"""Password hashing and JWT helpers.

Passwords and recovery answers are hashed with
``hashlib.pbkdf2_hmac('sha256', ...)`` using a per-user random salt and stored
in the format::

    pbkdf2_sha256$<iterations>$<salt_hex>$<hash_hex>

Access and reset tokens are signed JWTs (PyJWT). No md5 anywhere.
"""

import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import jwt

from . import config

PBKDF2_ALGORITHM = "pbkdf2_sha256"


def hash_password(password: str) -> str:
    """Hash a plaintext password with PBKDF2-HMAC-SHA256 and a random salt."""
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, config.PBKDF2_ITERATIONS
    )
    return "{0}${1}${2}${3}".format(
        PBKDF2_ALGORITHM,
        config.PBKDF2_ITERATIONS,
        salt.hex(),
        digest.hex(),
    )


def verify_password(password: str, stored: str) -> bool:
    """Verify a plaintext password against a stored ``pbkdf2_sha256$...`` hash.

    Uses ``hmac.compare_digest`` to avoid timing side channels.
    """
    try:
        algorithm, iterations, salt_hex, hash_hex = stored.split("$")
    except ValueError:
        return False
    if algorithm != PBKDF2_ALGORITHM:
        return False
    try:
        salt = bytes.fromhex(salt_hex)
        iterations = int(iterations)
    except ValueError:
        return False
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, iterations
    )
    return hmac.compare_digest(digest.hex(), hash_hex)


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(subject: str) -> str:
    """Issue an access token whose ``sub`` is the user id (as string)."""
    expires = _now_utc() + timedelta(hours=config.TOKEN_EXPIRE_HOURS)
    payload = {"sub": str(subject), "purpose": "access", "exp": expires}
    return jwt.encode(payload, config.SECRET_KEY, algorithm="HS256")


def create_password_reset_token(cedula: str) -> str:
    """Issue a short-lived token used by the password recovery flow."""
    expires = _now_utc() + timedelta(minutes=config.RESET_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": cedula, "purpose": "password_reset", "exp": expires}
    return jwt.encode(payload, config.SECRET_KEY, algorithm="HS256")


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and validate an access token. Raises jwt.PyJWTError on failure."""
    return jwt.decode(token, config.SECRET_KEY, algorithms=["HS256"])


def decode_password_reset_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode a password reset token, or return None when invalid."""
    try:
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
    if payload.get("purpose") != "password_reset":
        return None
    return payload
