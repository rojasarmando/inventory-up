"""Application settings loaded from environment variables.

All settings have sensible defaults for development. Override them with
environment variables in production or when running outside Docker.
"""

import os

# Secret used to sign JWTs. In production set a strong random value via
# the SECRET_KEY environment variable (docker-compose.yml provides a default).
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-me-in-production")

# SQLAlchemy database URL. Default targets the Docker volume at /data.
# For local (non-Docker) runs use:
#   DATABASE_URL=sqlite:///./data/inventory.db
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////data/inventory.db")

# Lifetime of the access token cookie, in hours.
TOKEN_EXPIRE_HOURS = int(os.getenv("TOKEN_EXPIRE_HOURS", "8"))

# Lifetime of the password reset token, in minutes.
RESET_TOKEN_EXPIRE_MINUTES = int(os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "15"))

# Application display name.
APP_NAME = os.getenv("APP_NAME", "Inventario Kajataca")

# Cookie name used for the JWT access token.
COOKIE_NAME = "access_token"

# Characters accepted as "special" in nick and password rules.
SPECIAL_CHARS = "!@#$%^&*_.-"

# PBKDF2 iterations for password hashing.
PBKDF2_ITERATIONS = int(os.getenv("PBKDF2_ITERATIONS", "200000"))

# Directory where uploaded music files are stored and served from /music.
MUSIC_DIR = os.getenv("MUSIC_DIR", "/data/music")
