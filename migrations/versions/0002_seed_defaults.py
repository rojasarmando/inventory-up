"""seed minimal default data

All seeded values are English. A fresh database contains only:

- roles: ``Root`` (full access, no permission rows) and ``Administrator``
- modules + sub_modules: the permission catalog the code actually uses
  (every ``require_permission(...)`` / menu key referenced in app/)
- events: every audit event key referenced in app/ (``log_event`` calls)
- one admin user (nick ``admin``, role Root, active) with an English
  recovery question and its hashed answer

No companies, no distributors and no demo users are seeded.

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-02

"""
from datetime import datetime, timezone
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.security import hash_password


# revision identifiers, used by Alembic.
revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _utcnow() -> datetime:
    """Timezone-aware UTC now, stored as naive UTC in SQLite."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


# Permission keys the code actually uses (require_permission + menu/pages).
ADMIN_PERMISSION_KEYS = [
    "home.view",
    "users.view",
    "users.create",
    "users.edit",
    "users.delete",
    "users.toggle_status",
    "companies.view",
    "companies.create",
    "companies.edit",
    "companies.delete",
    "companies.toggle_status",
    "distributors.view",
    "distributors.create",
    "distributors.edit",
    "distributors.delete",
    "distributors.toggle_status",
    "roles.manage",
    "reports.view",
    "logs.view",
    "about.view",
]

# (module_name, module_description, [(sub_name, key)])
MODULES = [
    ("Operations", "Operational screens", [("Home", "home.view")]),
    (
        "Management",
        "Management screens",
        [
            ("View Users", "users.view"),
            ("Create Users", "users.create"),
            ("Edit Users", "users.edit"),
            ("Delete Users", "users.delete"),
            ("Toggle User Status", "users.toggle_status"),
            ("View Companies", "companies.view"),
            ("Create Companies", "companies.create"),
            ("Edit Companies", "companies.edit"),
            ("Delete Companies", "companies.delete"),
            ("Toggle Company Status", "companies.toggle_status"),
            ("View Distributors", "distributors.view"),
            ("Create Distributors", "distributors.create"),
            ("Edit Distributors", "distributors.edit"),
            ("Delete Distributors", "distributors.delete"),
            ("Toggle Distributor Status", "distributors.toggle_status"),
            ("Manage Roles", "roles.manage"),
        ],
    ),
    (
        "Reports",
        "Reports and audit",
        [
            ("View Reports", "reports.view"),
            ("View Logs", "logs.view"),
        ],
    ),
    ("Information", "Information screens", [("About", "about.view")]),
]

# (event_key, description) for every log_event(...) call in app/.
EVENTS = [
    ("login", "User logged in"),
    ("logout", "User logged out"),
    ("create_user", "A user was created"),
    ("edit_user", "A user was edited"),
    ("delete_user", "A user was deleted"),
    ("toggle_user_status", "A user status was changed"),
    ("create_company", "A company was created"),
    ("edit_company", "A company was edited"),
    ("delete_company", "A company was deleted"),
    ("toggle_company_status", "A company status was changed"),
    ("create_distributor", "A distributor was created"),
    ("edit_distributor", "A distributor was edited"),
    ("delete_distributor", "A distributor was deleted"),
    ("toggle_distributor_status", "A distributor status was changed"),
    ("update_role_permissions", "Role permissions were updated"),
    ("generate_report", "A report was generated"),
    ("password_recovery", "A password was recovered"),
]


def upgrade() -> None:
    connection = op.get_bind()

    # --- roles ---------------------------------------------------------
    roles = sa.table(
        "roles",
        sa.column("id", sa.Integer()),
        sa.column("name", sa.String()),
        sa.column("description", sa.String()),
        sa.column("created_at", sa.DateTime()),
    )
    op.bulk_insert(
        roles,
        [
            {
                "name": "Root",
                "description": "Full access (superadmin, no permission rows)",
                "created_at": _utcnow(),
            },
            {
                "name": "Administrator",
                "description": "Full management of the system",
                "created_at": _utcnow(),
            },
        ],
    )

    # --- modules + sub_modules (permission catalog) --------------------
    modules = sa.table(
        "modules",
        sa.column("id", sa.Integer()),
        sa.column("name", sa.String()),
        sa.column("description", sa.String()),
    )
    op.bulk_insert(
        modules,
        [
            {"name": name, "description": description}
            for name, description, _ in MODULES
        ],
    )
    module_ids = {
        row[1]: row[0]
        for row in connection.execute(sa.select(modules.c.id, modules.c.name))
    }

    sub_modules = sa.table(
        "sub_modules",
        sa.column("id", sa.Integer()),
        sa.column("name", sa.String()),
        sa.column("key", sa.String()),
        sa.column("module_id", sa.Integer()),
    )
    op.bulk_insert(
        sub_modules,
        [
            {"name": sub_name, "key": key, "module_id": module_ids[module_name]}
            for module_name, _, subs in MODULES
            for sub_name, key in subs
        ],
    )
    key_to_sub_id = {
        row[1]: row[0]
        for row in connection.execute(sa.select(sub_modules.c.id, sub_modules.c.key))
    }

    # --- permissions (Administrator gets the full catalog; Root has none) -
    permissions = sa.table(
        "permissions",
        sa.column("id", sa.Integer()),
        sa.column("role_id", sa.Integer()),
        sa.column("sub_module_id", sa.Integer()),
    )
    role_ids = {
        row[1]: row[0]
        for row in connection.execute(sa.select(roles.c.id, roles.c.name))
    }
    op.bulk_insert(
        permissions,
        [
            {"role_id": role_ids["Administrator"], "sub_module_id": key_to_sub_id[key]}
            for key in ADMIN_PERMISSION_KEYS
        ],
    )

    # --- events (audit event catalog) ----------------------------------
    events = sa.table(
        "events",
        sa.column("id", sa.Integer()),
        sa.column("name", sa.String()),
        sa.column("description", sa.String()),
    )
    op.bulk_insert(
        events,
        [{"name": name, "description": description} for name, description in EVENTS],
    )

    # --- admin user (role Root) ----------------------------------------
    users = sa.table(
        "users",
        sa.column("id", sa.Integer()),
        sa.column("name", sa.String()),
        sa.column("nick", sa.String()),
        sa.column("password_hash", sa.String()),
        sa.column("cedula", sa.String()),
        sa.column("question", sa.String()),
        sa.column("answer_hash", sa.String()),
        sa.column("role_id", sa.Integer()),
        sa.column("status", sa.Boolean()),
        sa.column("created_at", sa.DateTime()),
    )
    op.bulk_insert(
        users,
        [
            {
                "name": "Administrator",
                "nick": "admin",
                "password_hash": hash_password("Admin123!"),
                "cedula": "12345678",
                "question": "What is the name of your first pet",
                "answer_hash": hash_password("Rex"),
                "role_id": role_ids["Root"],
                "status": True,
                "created_at": _utcnow(),
            }
        ],
    )


def downgrade() -> None:
    connection = op.get_bind()
    # Reverse dependency order: logs -> users -> events -> permissions ->
    # sub_modules -> modules -> roles.
    for table_name in (
        "logs",
        "users",
        "events",
        "permissions",
        "sub_modules",
        "modules",
        "roles",
    ):
        connection.execute(sa.delete(sa.table(table_name)))
