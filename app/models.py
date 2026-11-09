"""SQLAlchemy ORM models.

All table and column names are in English. This module is the single ORM
source of truth for the schema; the Alembic migrations under ``migrations/``
create the tables to match it exactly.
"""

from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow() -> datetime:
    """Timezone-aware UTC now, stored as naive UTC in SQLite."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    description: Mapped[str] = mapped_column(String(120), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    users: Mapped[List["User"]] = relationship(back_populates="role")
    permissions: Mapped[List["Permission"]] = relationship(
        back_populates="role", cascade="all, delete-orphan"
    )


class Module(Base):
    __tablename__ = "modules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(40), unique=True)
    description: Mapped[str] = mapped_column(String(120), default="")

    sub_modules: Mapped[List["SubModule"]] = relationship(
        back_populates="module", order_by="SubModule.id"
    )


class SubModule(Base):
    __tablename__ = "sub_modules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(60))
    key: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    module_id: Mapped[int] = mapped_column(ForeignKey("modules.id"))

    module: Mapped["Module"] = relationship(back_populates="sub_modules")
    permissions: Mapped[List["Permission"]] = relationship(back_populates="sub_module")


class Permission(Base):
    """Link between a role and a sub-module (a permission key)."""

    __tablename__ = "permissions"
    __table_args__ = (
        UniqueConstraint("role_id", "sub_module_id", name="uq_role_submodule"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), index=True)
    sub_module_id: Mapped[int] = mapped_column(ForeignKey("sub_modules.id"), index=True)

    role: Mapped["Role"] = relationship(back_populates="permissions")
    sub_module: Mapped["SubModule"] = relationship(back_populates="permissions")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(40))
    nick: Mapped[str] = mapped_column(String(12), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(200))
    cedula: Mapped[str] = mapped_column(String(8), unique=True, index=True)
    question: Mapped[str] = mapped_column(String(50))
    answer_hash: Mapped[str] = mapped_column(String(200))
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), index=True)
    status: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    role: Mapped["Role"] = relationship(back_populates="users")
    logs: Mapped[List["Log"]] = relationship(back_populates="user")
    stock_movements: Mapped[List["StockMovement"]] = relationship(
        back_populates="user"
    )


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    rif: Mapped[str] = mapped_column(String(12), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(40))
    description: Mapped[str] = mapped_column(String(120), default="")
    status: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    distributors: Mapped[List["Distributor"]] = relationship(back_populates="company")
    products: Mapped[List["Product"]] = relationship(back_populates="company")


class Distributor(Base):
    __tablename__ = "distributors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(40))
    phone: Mapped[str] = mapped_column(String(11), unique=True, index=True)
    contact: Mapped[str] = mapped_column(String(40))
    status: Mapped[bool] = mapped_column(Boolean, default=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    company: Mapped["Company"] = relationship(back_populates="distributors")


class Product(Base):
    """Inventory product belonging to a company.

    ``name`` is NOT unique so the same product name may exist under different
    companies. ``stock`` is adjusted by stock_movements (never edited directly
    through the product endpoints).
    """

    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(40))
    description: Mapped[str] = mapped_column(String(200), default="")
    price: Mapped[float] = mapped_column(Float, default=0.0)
    tax_rate: Mapped[float] = mapped_column(Float, default=0.0)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), index=True)
    status: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    company: Mapped["Company"] = relationship(back_populates="products")
    movements: Mapped[List["StockMovement"]] = relationship(back_populates="product")


class StockMovement(Base):
    """A stock in/out movement (purchase, sale or manual adjustment).

    ``tax_rate`` is a snapshot of the product tax rate at movement time so
    historical figures never change when the product tax is edited.
    """

    __tablename__ = "stock_movements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    movement_type: Mapped[str] = mapped_column(String(10))  # "in" | "out"
    kind: Mapped[str] = mapped_column(String(20))  # "purchase" | "sale" | "adjustment"
    quantity: Mapped[int] = mapped_column(Integer)
    unit_price: Mapped[float] = mapped_column(Float, default=0.0)
    tax_rate: Mapped[float] = mapped_column(Float, default=0.0)
    client: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    supplier: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    description: Mapped[str] = mapped_column(String(200), default="")
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    product: Mapped["Product"] = relationship(back_populates="movements")
    user: Mapped[Optional["User"]] = relationship(back_populates="stock_movements")


class Song(Base):
    """Uploaded audio track served from MUSIC_DIR under /music."""

    __tablename__ = "songs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(120))
    filename: Mapped[str] = mapped_column(String(255), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(60), unique=True)
    description: Mapped[str] = mapped_column(String(120), default="")

    logs: Mapped[List["Log"]] = relationship(back_populates="event")


class Log(Base):
    __tablename__ = "logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"), index=True)
    description: Mapped[str] = mapped_column(String(200), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)

    user: Mapped[Optional["User"]] = relationship(back_populates="logs")
    event: Mapped["Event"] = relationship(back_populates="logs")
