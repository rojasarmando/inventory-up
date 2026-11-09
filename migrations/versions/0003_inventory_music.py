"""add inventory and music schema + seed

Handwritten migration matching app/models.py exactly (all table and column
names in English):

- new tables: ``products`` (company-owned, name NOT unique), ``stock_movements``
  (in/out movements: purchase/sale/adjustment, tax rate snapshot), ``songs``
  (uploaded audio files)
- new permission keys under two new modules:
  * ``Inventory``: products.view/create/edit/delete, movements.view/create,
    sales.view/create, purchases.view/create
  * ``Media``: music.view, music.manage, gallery.view
- the Administrator role is granted ALL the new permission keys (Root stays
  rowless/superadmin)
- new audit events for the new endpoints (``log_event`` calls in app/)

No demo products, movements or songs are seeded.

Revision ID: 0003
Revises: 0002
Create Date: 2026-08-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# New permission keys granted to the Administrator role in this revision.
ADMIN_PERMISSION_KEYS = [
    "products.view",
    "products.create",
    "products.edit",
    "products.delete",
    "movements.view",
    "movements.create",
    "sales.view",
    "sales.create",
    "purchases.view",
    "purchases.create",
    "music.view",
    "music.manage",
    "gallery.view",
]

# (module_name, module_description, [(sub_name, key)])
MODULES = [
    (
        "Inventory",
        "Products and stock",
        [
            ("View Products", "products.view"),
            ("Create Products", "products.create"),
            ("Edit Products", "products.edit"),
            ("Delete Products", "products.delete"),
            ("View Movements", "movements.view"),
            ("Create Movements", "movements.create"),
            ("View Sales", "sales.view"),
            ("Create Sales", "sales.create"),
            ("View Purchases", "purchases.view"),
            ("Create Purchases", "purchases.create"),
        ],
    ),
    (
        "Media",
        "Music and gallery",
        [
            ("View Music", "music.view"),
            ("Manage Music", "music.manage"),
            ("View Gallery", "gallery.view"),
        ],
    ),
]

# (event_key, description) for every new log_event(...) call in app/.
EVENTS = [
    ("create_product", "A product was created"),
    ("edit_product", "A product was edited"),
    ("delete_product", "A product was deleted"),
    ("toggle_product_status", "A product status was changed"),
    ("stock_in", "Stock was added to a product"),
    ("stock_out", "Stock was removed from a product"),
    ("create_sale", "A sale was registered"),
    ("create_purchase", "A purchase was registered"),
    ("add_song", "A song was added"),
    ("delete_song", "A song was deleted"),
]


def upgrade() -> None:
    connection = op.get_bind()

    # --- products -----------------------------------------------------
    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=40), nullable=False),
        sa.Column("description", sa.String(length=200), nullable=False),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("tax_rate", sa.Float(), nullable=False),
        sa.Column("stock", sa.Integer(), nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # --- stock_movements ----------------------------------------------
    op.create_table(
        "stock_movements",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("movement_type", sa.String(length=10), nullable=False),
        sa.Column("kind", sa.String(length=20), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Float(), nullable=False),
        sa.Column("tax_rate", sa.Float(), nullable=False),
        sa.Column("client", sa.String(length=120), nullable=True),
        sa.Column("supplier", sa.String(length=120), nullable=True),
        sa.Column("description", sa.String(length=200), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # --- songs --------------------------------------------------------
    op.create_table(
        "songs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index("ix_products_company_id", "products", ["company_id"], unique=False)
    op.create_index(
        "ix_stock_movements_product_id",
        "stock_movements",
        ["product_id"],
        unique=False,
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

    # --- permissions (Administrator gets the new keys; Root has none) ---
    roles = sa.table(
        "roles",
        sa.column("id", sa.Integer()),
        sa.column("name", sa.String()),
    )
    role_ids = {
        row[1]: row[0]
        for row in connection.execute(sa.select(roles.c.id, roles.c.name))
    }
    permissions = sa.table(
        "permissions",
        sa.column("id", sa.Integer()),
        sa.column("role_id", sa.Integer()),
        sa.column("sub_module_id", sa.Integer()),
    )
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


def downgrade() -> None:
    connection = op.get_bind()

    # Remove only the rows seeded by this revision (in FK-safe order).
    sub_modules_t = sa.table(
        "sub_modules",
        sa.column("id", sa.Integer()),
        sa.column("key", sa.String()),
    )
    sub_ids = sa.select(sub_modules_t.c.id).where(
        sub_modules_t.c.key.in_(ADMIN_PERMISSION_KEYS)
    )
    permissions = sa.table(
        "permissions",
        sa.column("id", sa.Integer()),
        sa.column("role_id", sa.Integer()),
        sa.column("sub_module_id", sa.Integer()),
    )
    connection.execute(
        permissions.delete().where(permissions.c.sub_module_id.in_(sub_ids))
    )
    connection.execute(
        sub_modules_t.delete().where(sub_modules_t.c.key.in_(ADMIN_PERMISSION_KEYS))
    )
    modules_t = sa.table("modules", sa.column("id", sa.Integer()), sa.column("name", sa.String()))
    connection.execute(
        modules_t.delete().where(modules_t.c.name.in_([m[0] for m in MODULES]))
    )
    events_t = sa.table("events", sa.column("id", sa.Integer()), sa.column("name", sa.String()))
    connection.execute(
        events_t.delete().where(events_t.c.name.in_([e[0] for e in EVENTS]))
    )

    # Drop indexes first, then tables.
    op.drop_index("ix_stock_movements_product_id", table_name="stock_movements")
    op.drop_index("ix_products_company_id", table_name="products")
    op.drop_table("songs")
    op.drop_table("stock_movements")
    op.drop_table("products")
