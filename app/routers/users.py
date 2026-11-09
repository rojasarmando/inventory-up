"""Users router: CRUD + status toggle.

Every mutation writes an audit log row. Unique constraints (nick, cedula)
are enforced here and surfaced as 400 errors with i18n keys.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.exc import IntegrityError

from ..deps import DbSessionDep, log_event, require_permission
from ..models import User
from ..schemas import ApiResponse, UserCreate, UserRecordOut, UserUpdate
from ..security import hash_password

router = APIRouter(prefix="/api/users", tags=["users"])

_unique_errors = {
    "users.nick": "error.nick_taken",
    "users.cedula": "error.cedula_taken",
}


def _serialize(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "nick": user.nick,
        "cedula": user.cedula,
        "question": user.question,
        "role_id": user.role_id,
        "role_name": user.role.name if user.role else None,
        "status": user.status,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


def _unique_violation(exc: IntegrityError) -> HTTPException:
    message = str(exc.orig or exc)
    for column, error_key in _unique_errors.items():
        if column in message:
            return HTTPException(status_code=400, detail=error_key)
    return HTTPException(status_code=400, detail="error.duplicate_record")


@router.get("")
def list_users(
    _user: Annotated[User, Depends(require_permission("users.view"))],
    db: DbSessionDep,
    role_id: Annotated[int | None, Query()] = None,
    status: Annotated[int | None, Query()] = None,
) -> ApiResponse[list[UserRecordOut]]:
    """List users, optionally filtered by role and/or status."""
    query = db.query(User)
    if role_id is not None:
        query = query.filter(User.role_id == role_id)
    if status is not None:
        query = query.filter(User.status == (1 if status else 0))
    users = query.order_by(User.id).all()
    return {"ok": True, "data": [_serialize(u) for u in users]}


@router.post("")
def create_user(
    payload: UserCreate,
    current: Annotated[User, Depends(require_permission("users.create"))],
    db: DbSessionDep,
) -> ApiResponse[UserRecordOut]:
    """Create a user. Password and recovery answer are hashed with PBKDF2."""
    user = User(
        name=payload.name,
        nick=payload.nick,
        password_hash=hash_password(payload.password),
        cedula=payload.cedula,
        question=payload.question,
        answer_hash=hash_password(payload.answer),
        role_id=payload.role_id,
        status=True,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise _unique_violation(exc)
    db.refresh(user)
    log_event(db, current, "create_user", f"Created user '{user.nick}'")
    return {"ok": True, "data": _serialize(user)}


@router.put("/{user_id}")
def update_user(
    user_id: Annotated[int, Path()],
    payload: UserUpdate,
    current: Annotated[User, Depends(require_permission("users.edit"))],
    db: DbSessionDep,
) -> ApiResponse[UserRecordOut]:
    """Update a user. Empty password/answer keep the existing hashes."""
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="error.not_found")

    updates = payload.model_dump(exclude_unset=True)
    if "password" in updates:
        new_password = updates.pop("password")
        if new_password:
            user.password_hash = hash_password(new_password)
    if "answer" in updates:
        new_answer = updates.pop("answer")
        if new_answer:
            user.answer_hash = hash_password(new_answer)
    for field, value in updates.items():
        setattr(user, field, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise _unique_violation(exc)
    db.refresh(user)
    log_event(db, current, "edit_user", f"Edited user '{user.nick}'")
    return {"ok": True, "data": _serialize(user)}


@router.delete("/{user_id}")
def delete_user(
    user_id: Annotated[int, Path()],
    current: Annotated[User, Depends(require_permission("users.delete"))],
    db: DbSessionDep,
) -> ApiResponse[None]:
    """Delete a user. Self-deletion is rejected; logs keep the record with a
    NULL user reference."""
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="error.not_found")
    if user.id == current.id:
        raise HTTPException(status_code=400, detail="error.cannot_delete_self")
    nick = user.nick
    db.delete(user)
    db.commit()
    log_event(db, current, "delete_user", f"Deleted user '{nick}'")
    return {"ok": True, "data": None}


@router.patch("/{user_id}/status")
def toggle_user_status(
    user_id: Annotated[int, Path()],
    current: Annotated[User, Depends(require_permission("users.toggle_status"))],
    db: DbSessionDep,
) -> ApiResponse[UserRecordOut]:
    """Toggle the active status of a user."""
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="error.not_found")
    if user.id == current.id:
        raise HTTPException(status_code=400, detail="error.cannot_deactivate_self")
    user.status = not user.status
    db.commit()
    log_event(
        db,
        current,
        "toggle_user_status",
        f"User '{user.nick}' status set to {user.status}",
    )
    return {"ok": True, "data": _serialize(user)}
