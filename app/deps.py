"""FastAPI dependencies: current user, permission guard, audit logging.

Permission logic (fixed vs the original PHP version which was inverted):

- A user whose role is "Root" has full access (superadmin).
- A role with zero permission rows is also treated as full access.
- Otherwise the user is allowed ONLY when their role has a permission row for
  the required sub-module key. Missing permission -> 403.
"""

from typing import Annotated, Optional

import jwt as pyjwt
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from .database import get_db
from .models import Event, Log, Permission, Role, SubModule, User
from .security import decode_access_token
from . import config

ROOT_ROLE_NAME = "root"

# Reusable dependency aliases (FastAPI `Annotated` style).
DbSessionDep = Annotated[Session, Depends(get_db)]


def get_current_user(request: Request, db: DbSessionDep) -> User:
    """API dependency: resolve the user from the HttpOnly JWT cookie."""
    token = request.cookies.get(config.COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="error.not_authenticated")
    try:
        payload = decode_access_token(token)
    except pyjwt.PyJWTError:
        raise HTTPException(status_code=401, detail="error.not_authenticated")
    if payload.get("purpose") != "access":
        raise HTTPException(status_code=401, detail="error.not_authenticated")
    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="error.not_authenticated")
    user = db.get(User, user_id)
    if user is None or not user.status:
        raise HTTPException(status_code=401, detail="error.not_authenticated")
    return user


CurrentUserDep = Annotated[User, Depends(get_current_user)]


def user_has_permission(db: Session, user: User, key: str) -> bool:
    """Core permission check (correct logic: having the permission allows)."""
    if user is None:
        return False
    role: Optional[Role] = user.role
    if role is None:
        return False
    # Root role -> full access.
    if role.name.strip().lower() == ROOT_ROLE_NAME:
        return True
    # A role with no permission rows is treated as full access (Root style).
    perm_count = (
        db.query(Permission).filter(Permission.role_id == role.id).count()
    )
    if perm_count == 0:
        return True
    return (
        db.query(Permission)
        .join(SubModule, Permission.sub_module_id == SubModule.id)
        .filter(Permission.role_id == role.id, SubModule.key == key)
        .first()
        is not None
    )


def user_permission_keys(db: Session, user: User):
    """Return the list of permission keys for a user (None = full access)."""
    role = user.role
    if role is None:
        return []
    if role.name.strip().lower() == ROOT_ROLE_NAME:
        return None  # full access
    perm_count = (
        db.query(Permission).filter(Permission.role_id == role.id).count()
    )
    if perm_count == 0:
        return None  # full access
    rows = (
        db.query(SubModule.key)
        .join(Permission, Permission.sub_module_id == SubModule.id)
        .filter(Permission.role_id == role.id)
        .all()
    )
    return [row[0] for row in rows]


def require_permission(key: str):
    """Factory for a FastAPI dependency guarding an API endpoint by key."""

    def dependency(
        user: CurrentUserDep,
        db: DbSessionDep,
    ) -> User:
        if not user_has_permission(db, user, key):
            raise HTTPException(status_code=403, detail="error.forbidden")
        return user

    return dependency


def log_event(
    db: Session,
    user: Optional[User],
    event_key: str,
    description: str = "",
) -> None:
    """Insert an audit log row. Event keys must exist in the seed data."""
    event = db.query(Event).filter(Event.name == event_key).first()
    if event is None:
        # Do not crash business logic on a missing event definition.
        return
    db.add(
        Log(
            user_id=user.id if user is not None else None,
            event_id=event.id,
            description=description,
        )
    )
    db.commit()
