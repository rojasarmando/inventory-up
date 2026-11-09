"""Auth router: login, logout, current user and password recovery.

Password recovery implements ALL three steps (the original PHP only did
steps 1 and 2 — step 3 never updated the password):

  1. verify cedula -> return the recovery question
  2. verify the answer -> issue a short-lived reset token (~15 min)
  3. new password + token -> UPDATE the password (and log the event)
"""

from fastapi import APIRouter, HTTPException, Response

from .. import config
from ..deps import CurrentUserDep, DbSessionDep, log_event, user_permission_keys
from ..models import User
from ..schemas import (
    ApiResponse,
    LoginData,
    LoginRequest,
    MeData,
    RecoverQuestionData,
    RecoverResetTokenData,
    RecoverStep1Request,
    RecoverStep2Request,
    RecoverStep3Request,
)
from ..security import (
    create_access_token,
    create_password_reset_token,
    decode_password_reset_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=config.COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        path="/",
        max_age=config.TOKEN_EXPIRE_HOURS * 3600,
    )


def _clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(key=config.COOKIE_NAME, path="/")


def _serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "nick": user.nick,
        "role": {"id": user.role.id, "name": user.role.name}
        if user.role is not None
        else None,
    }


@router.post("/login")
def login(
    payload: LoginRequest,
    response: Response,
    db: DbSessionDep,
) -> ApiResponse[LoginData]:
    """Authenticate a user by nick + password and set the HttpOnly cookie."""
    user = db.query(User).filter(User.nick == payload.nick.strip()).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="error.invalid_credentials")
    if not user.status:
        raise HTTPException(status_code=401, detail="error.user_inactive")

    token = create_access_token(user.id)
    _set_auth_cookie(response, token)
    log_event(db, user, "login", f"User '{user.nick}' logged in")
    return {"ok": True, "data": {"user": _serialize_user(user)}}


@router.post("/logout")
def logout(
    response: Response,
    user: CurrentUserDep,
    db: DbSessionDep,
) -> ApiResponse[None]:
    """Clear the session cookie and log the CORRECT 'logout' event.

    (The original PHP logged the 'login' event on logout — fixed here.)
    """
    _clear_auth_cookie(response)
    log_event(db, user, "logout", f"User '{user.nick}' logged out")
    return {"ok": True, "data": None}


@router.get("/me")
def me(
    user: CurrentUserDep,
    db: DbSessionDep,
) -> ApiResponse[MeData]:
    """Return the current user plus their permission keys (None = full access)."""
    return {
        "ok": True,
        "data": {
            "user": _serialize_user(user),
            "permissions": user_permission_keys(db, user),
        },
    }


@router.post("/recover/step1")
def recover_step1(
    payload: RecoverStep1Request,
    db: DbSessionDep,
) -> ApiResponse[RecoverQuestionData]:
    """Step 1: given a cedula, return the user's recovery question."""
    user = db.query(User).filter(User.cedula == payload.cedula).first()
    if user is None:
        raise HTTPException(status_code=404, detail="error.user_not_found")
    if not user.status:
        raise HTTPException(status_code=404, detail="error.user_not_found")
    return {"ok": True, "data": {"question": user.question}}


@router.post("/recover/step2")
def recover_step2(
    payload: RecoverStep2Request,
    db: DbSessionDep,
) -> ApiResponse[RecoverResetTokenData]:
    """Step 2: verify the recovery answer and issue a short-lived reset token."""
    user = db.query(User).filter(User.cedula == payload.cedula).first()
    if user is None or not user.status:
        raise HTTPException(status_code=404, detail="error.user_not_found")
    if not verify_password(payload.answer, user.answer_hash):
        raise HTTPException(status_code=401, detail="error.invalid_answer")
    reset_token = create_password_reset_token(payload.cedula)
    return {"ok": True, "data": {"reset_token": reset_token}}


@router.post("/recover/step3")
def recover_step3(
    payload: RecoverStep3Request,
    db: DbSessionDep,
) -> ApiResponse[None]:
    """Step 3: validate the reset token and UPDATE the password (fixed bug)."""
    user = db.query(User).filter(User.cedula == payload.cedula).first()
    if user is None or not user.status:
        raise HTTPException(status_code=404, detail="error.user_not_found")

    info = decode_password_reset_token(payload.reset_token)
    if info is None or info.get("sub") != payload.cedula:
        raise HTTPException(status_code=401, detail="error.invalid_reset_token")

    user.password_hash = hash_password(payload.new_password)
    db.commit()
    log_event(db, user, "password_recovery", f"Password recovered for '{user.nick}'")
    return {"ok": True, "data": None}
