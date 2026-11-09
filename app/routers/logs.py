"""Logs router: audit trail listing (join users + events)."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from ..deps import DbSessionDep, require_permission
from ..models import Event, Log, User
from ..schemas import ApiResponse, LogOut

router = APIRouter(prefix="/api/logs", tags=["logs"])


@router.get("")
def list_logs(
    _user: Annotated[User, Depends(require_permission("logs.view"))],
    db: DbSessionDep,
    limit: Annotated[int, Query(ge=1, le=5000)] = 500,
) -> ApiResponse[list[LogOut]]:
    """List the audit trail, newest first, with user nick and event name."""
    rows = (
        db.query(Log, User.nick, Event.name)
        .outerjoin(User, Log.user_id == User.id)
        .join(Event, Log.event_id == Event.id)
        .order_by(Log.created_at.desc(), Log.id.desc())
        .limit(limit)
        .all()
    )
    data = [
        {
            "id": log.id,
            "date": log.created_at.isoformat() if log.created_at else None,
            "user_nick": nick,
            "event": event_name,
            "description": log.description,
        }
        for log, nick, event_name in rows
    ]
    return {"ok": True, "data": data}
