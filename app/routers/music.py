"""Music router: upload, list and delete audio tracks.

Files are stored in ``config.MUSIC_DIR`` with a sanitized unique filename and
served back through the ``/music`` static mount.
"""

import os
import re
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Path, UploadFile

from .. import config
from ..deps import DbSessionDep, log_event, require_permission
from ..models import Song, User
from ..schemas import ApiResponse, SongOut

router = APIRouter(prefix="/api/music", tags=["music"])

ALLOWED_EXTENSIONS = {".mp3", ".ogg", ".wav", ".m4a"}

_SAFE_NAME_RE = re.compile(r"[^A-Za-z0-9._-]")


def _sanitize_filename(name: str) -> str:
    """Strip directories and replace unsafe characters with underscores."""
    base = os.path.basename(name or "")
    return _SAFE_NAME_RE.sub("_", base)


def _unique_path(filename: str) -> str:
    """Return MUSIC_DIR/filename, prefixing a uuid fragment on collision."""
    path = os.path.join(config.MUSIC_DIR, filename)
    if not os.path.exists(path):
        return path
    stem, ext = os.path.splitext(filename)
    return os.path.join(config.MUSIC_DIR, f"{uuid4().hex[:8]}-{stem}{ext}")


def _serialize_song(song: Song) -> dict:
    return {
        "id": song.id,
        "title": song.title,
        "filename": song.filename,
        "created_at": song.created_at.isoformat() if song.created_at else None,
        "url": f"/music/{song.filename}",
    }


@router.get("")
def list_songs(
    _user: Annotated[User, Depends(require_permission("music.view"))],
    db: DbSessionDep,
) -> ApiResponse[list[SongOut]]:
    """List all songs, newest first."""
    songs = db.query(Song).order_by(Song.created_at.desc(), Song.id.desc()).all()
    return {"ok": True, "data": [_serialize_song(s) for s in songs]}


@router.post("")
async def upload_song(
    title: Annotated[str, Form()],
    file: Annotated[UploadFile, File()],
    current: Annotated[User, Depends(require_permission("music.manage"))],
    db: DbSessionDep,
) -> ApiResponse[SongOut]:
    """Upload an audio file (multipart: title field + file)."""
    title = (title or "").strip()
    if not title or len(title) > 120:
        raise HTTPException(status_code=400, detail="error.invalid_title")

    original = file.filename or ""
    extension = os.path.splitext(original)[1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="error.invalid_file_type")

    filename = _sanitize_filename(original)
    if not filename or filename in (".", ".."):
        filename = f"audio{extension}"
    path = _unique_path(filename)

    contents = await file.read()
    os.makedirs(config.MUSIC_DIR, exist_ok=True)
    with open(path, "wb") as handle:
        handle.write(contents)

    song = Song(title=title, filename=os.path.basename(path))
    db.add(song)
    db.commit()
    db.refresh(song)
    log_event(db, current, "add_song", f"Added song '{song.title}'")
    return {"ok": True, "data": _serialize_song(song)}


@router.delete("/{song_id}")
def delete_song(
    song_id: Annotated[int, Path()],
    current: Annotated[User, Depends(require_permission("music.manage"))],
    db: DbSessionDep,
) -> ApiResponse[None]:
    """Delete a song: remove the file from disk and the database row."""
    song = db.get(Song, song_id)
    if song is None:
        raise HTTPException(status_code=404, detail="error.not_found")
    path = os.path.join(config.MUSIC_DIR, song.filename)
    try:
        os.remove(path)
    except FileNotFoundError:
        pass  # file already gone; still remove the row
    title = song.title
    db.delete(song)
    db.commit()
    log_event(db, current, "delete_song", f"Deleted song '{title}'")
    return {"ok": True, "data": None}
