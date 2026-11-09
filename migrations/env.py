"""Alembic migration environment.

The canonical database URL lives in ``app.config.DATABASE_URL`` so the CLI,
the FastAPI lifespan and Docker all migrate the same database. The migration
target metadata comes from the SQLAlchemy models in ``app.models``.
"""

from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import create_engine, event

from app import config as app_config
from app.database import Base
from app.models import (  # noqa: F401  (import registers every table)
    Company,
    Distributor,
    Event,
    Log,
    Module,
    Permission,
    Product,
    Role,
    Song,
    StockMovement,
    SubModule,
    User,
)

# This is the Alembic Config object, which provides access to the values
# within the .ini file in use.
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# The application owns the canonical database URL.
config.set_main_option("sqlalchemy.url", app_config.DATABASE_URL)

target_metadata = Base.metadata


def _ensure_sqlite_dir(database_url: str) -> None:
    """Create the parent directory for a SQLite file database if needed."""
    if not database_url.startswith("sqlite:///"):
        return
    path = database_url.replace("sqlite:///", "", 1)
    if path == ":memory:":
        return
    parent = Path(path).parent
    if parent and str(parent) not in ("", "."):
        parent.mkdir(parents=True, exist_ok=True)


_ensure_sqlite_dir(app_config.DATABASE_URL)


def _enable_sqlite_foreign_keys(dbapi_connection, _connection_record):
    """Enforce foreign key constraints on SQLite (matches app/database.py)."""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (emit SQL to stdout)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (apply directly to the database)."""
    url = config.get_main_option("sqlalchemy.url")
    connectable = create_engine(
        url,
        connect_args={"check_same_thread": False}
        if url.startswith("sqlite")
        else {},
    )
    if url.startswith("sqlite"):
        event.listen(connectable, "connect", _enable_sqlite_foreign_keys)

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()

    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
