"""Pydantic v2 request/response schemas.

Server-side validation mirrors the original REGLAS.md rules:

- name / company / distributor names: 3-40 chars, letters only (spaces and
  accents allowed)
- nick: 8-12 chars, letters+numbers, must include at least 1 special char,
  1 letter and 1 number
- password: 8-12 chars, must include at least 1 special char, 1 letter and
  1 number
- cedula: 7-8 digits only
- rif: 7-12 digits only
- phone: 11 digits only
- recovery question: 6-50 chars, letters+numbers
- unique (rejected on duplicates): nick, cedula, rif, phone

Error messages use i18n keys (see ``error.*`` in static/js/i18n.js) so the
frontend can render them in the active language.

The ``*Out`` models are the public response shapes: FastAPI filters every
JSON API response to the declared return type, so these mirror the router
``_serialize`` helpers field-for-field (no frontend-required field may be
dropped).
"""

import re
from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel, ConfigDict, field_validator

from .config import SPECIAL_CHARS

# ---------------------------------------------------------------------------
# Shared validation helpers
# ---------------------------------------------------------------------------

NAME_RE = re.compile(r"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]{3,40}$")
QUESTION_RE = re.compile(r"^[A-Za-z0-9 ]{6,50}$")
CEDULA_RE = re.compile(r"^\d{7,8}$")
RIF_RE = re.compile(r"^\d{7,12}$")
PHONE_RE = re.compile(r"^\d{11}$")
NICK_RE = re.compile(r"^[A-Za-z0-9" + re.escape(SPECIAL_CHARS) + r"]{8,12}$")

SPECIAL_CHARS_SET = set(SPECIAL_CHARS)


def _has_letter(value: str) -> bool:
    return any(ch.isalpha() for ch in value)


def _has_digit(value: str) -> bool:
    return any(ch.isdigit() for ch in value)


def _has_special(value: str) -> bool:
    return any(ch in SPECIAL_CHARS_SET for ch in value)


def validate_name(value: str) -> str:
    value = value.strip()
    if not NAME_RE.fullmatch(value):
        raise ValueError("error.invalid_name")
    return value


def validate_nick(value: str) -> str:
    value = value.strip()
    if not NICK_RE.fullmatch(value):
        raise ValueError("error.invalid_nick")
    if not (_has_letter(value) and _has_digit(value) and _has_special(value)):
        raise ValueError("error.invalid_nick")
    return value


def validate_password(value: str) -> str:
    if not 8 <= len(value) <= 12:
        raise ValueError("error.invalid_password")
    if not (_has_letter(value) and _has_digit(value) and _has_special(value)):
        raise ValueError("error.invalid_password")
    return value


def validate_question(value: str) -> str:
    value = value.strip()
    if not QUESTION_RE.fullmatch(value):
        raise ValueError("error.invalid_question")
    return value


def validate_digits(value: str, *, pattern: re.Pattern, error_key: str) -> str:
    value = value.strip()
    if not pattern.fullmatch(value):
        raise ValueError(error_key)
    return value


# ---------------------------------------------------------------------------
# Response envelope + output models
# ---------------------------------------------------------------------------

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """Envelope for every JSON API response: ``{ok: bool, data: ...}``."""

    ok: bool
    data: T | None = None


class RoleOut(BaseModel):
    """Role reference nested inside a session user (login / me)."""

    id: int
    name: str


class RoleListOut(BaseModel):
    """Role row returned by GET /api/roles (dropdowns + manager)."""

    id: int
    name: str
    description: str


class UserOut(BaseModel):
    """Session user returned by login and GET /api/auth/me."""

    id: int
    name: str
    nick: str
    role: RoleOut | None = None


class UserRecordOut(BaseModel):
    """Full user record returned by the /api/users CRUD endpoints."""

    id: int
    name: str
    nick: str
    cedula: str
    question: str
    role_id: int
    role_name: str | None = None
    status: bool
    created_at: str | None = None


class CompanyOut(BaseModel):
    """Company row returned by the /api/companies endpoints."""

    id: int
    rif: str
    name: str
    description: str
    status: bool
    created_at: str | None = None


class DistributorOut(BaseModel):
    """Distributor row returned by the /api/distributors endpoints."""

    id: int
    name: str
    phone: str
    contact: str
    status: bool
    company_id: int
    company_name: str | None = None
    created_at: str | None = None


class DistributorSelectOut(BaseModel):
    """Lightweight distributor row for dropdowns (GET /api/distributors/select)."""

    id: int
    name: str


class LogOut(BaseModel):
    """Audit trail row returned by GET /api/logs."""

    id: int
    date: str | None = None
    user_nick: str | None = None
    event: str
    description: str


class LoginData(BaseModel):
    """``data`` payload of POST /api/auth/login."""

    user: UserOut


class MeData(BaseModel):
    """``data`` payload of GET /api/auth/me."""

    user: UserOut
    permissions: list[str] | None = None


class RecoverQuestionData(BaseModel):
    """``data`` payload of POST /api/auth/recover/step1."""

    question: str


class RecoverResetTokenData(BaseModel):
    """``data`` payload of POST /api/auth/recover/step2."""

    reset_token: str


class RolePermissionsOut(BaseModel):
    """Permission set of a role (GET/PUT /api/roles/{role_id}/permissions)."""

    role_id: int
    sub_module_ids: list[int]


class SubModuleCatalogOut(BaseModel):
    """Sub-module entry inside the permission catalog."""

    id: int
    name: str
    key: str


class ModuleCatalogOut(BaseModel):
    """Module entry of the permission catalog (GET /api/roles/permission-catalog)."""

    id: int
    name: str
    sub_modules: list[SubModuleCatalogOut]


class MenuSubModuleOut(BaseModel):
    """Sub-module entry inside the dynamic menu (GET /api/menu)."""

    id: int
    name: str
    key: str
    url: str


class MenuModuleOut(BaseModel):
    """Module entry of the dynamic menu (GET /api/menu)."""

    id: int
    name: str
    description: str
    sub_modules: list[MenuSubModuleOut]


# ---------------------------------------------------------------------------
# Users (request schemas)
# ---------------------------------------------------------------------------


class UserBase(BaseModel):
    name: str
    nick: str
    cedula: str
    question: str
    role_id: int

    @field_validator("name")
    @classmethod
    def _name(cls, v: str) -> str:
        return validate_name(v)

    @field_validator("nick")
    @classmethod
    def _nick(cls, v: str) -> str:
        return validate_nick(v)

    @field_validator("cedula")
    @classmethod
    def _cedula(cls, v: str) -> str:
        return validate_digits(v, pattern=CEDULA_RE, error_key="error.invalid_cedula")

    @field_validator("question")
    @classmethod
    def _question(cls, v: str) -> str:
        return validate_question(v)


class UserCreate(UserBase):
    password: str
    answer: str

    @field_validator("password")
    @classmethod
    def _password(cls, v: str) -> str:
        return validate_password(v)


class UserUpdate(BaseModel):
    """Partial update — only provided fields are changed."""

    name: Optional[str] = None
    nick: Optional[str] = None
    cedula: Optional[str] = None
    question: Optional[str] = None
    role_id: Optional[int] = None
    password: Optional[str] = None
    answer: Optional[str] = None

    @field_validator("name")
    @classmethod
    def _name(cls, v: Optional[str]) -> Optional[str]:
        return validate_name(v) if v is not None else None

    @field_validator("nick")
    @classmethod
    def _nick(cls, v: Optional[str]) -> Optional[str]:
        return validate_nick(v) if v is not None else None

    @field_validator("cedula")
    @classmethod
    def _cedula(cls, v: Optional[str]) -> Optional[str]:
        return (
            validate_digits(v, pattern=CEDULA_RE, error_key="error.invalid_cedula")
            if v is not None
            else None
        )

    @field_validator("question")
    @classmethod
    def _question(cls, v: Optional[str]) -> Optional[str]:
        return validate_question(v) if v is not None else None

    @field_validator("password")
    @classmethod
    def _password(cls, v: Optional[str]) -> Optional[str]:
        return validate_password(v) if v is not None else None


# ---------------------------------------------------------------------------
# Companies (request schemas)
# ---------------------------------------------------------------------------


class CompanyCreate(BaseModel):
    rif: str
    name: str
    description: Optional[str] = ""

    @field_validator("rif")
    @classmethod
    def _rif(cls, v: str) -> str:
        return validate_digits(v, pattern=RIF_RE, error_key="error.invalid_rif")

    @field_validator("name")
    @classmethod
    def _name(cls, v: str) -> str:
        return validate_name(v)


class CompanyUpdate(BaseModel):
    rif: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None

    @field_validator("rif")
    @classmethod
    def _rif(cls, v: Optional[str]) -> Optional[str]:
        return (
            validate_digits(v, pattern=RIF_RE, error_key="error.invalid_rif")
            if v is not None
            else None
        )

    @field_validator("name")
    @classmethod
    def _name(cls, v: Optional[str]) -> Optional[str]:
        return validate_name(v) if v is not None else None


# ---------------------------------------------------------------------------
# Distributors (request schemas)
# ---------------------------------------------------------------------------


class DistributorCreate(BaseModel):
    name: str
    phone: str
    contact: str
    company_id: int

    @field_validator("name")
    @classmethod
    def _name(cls, v: str) -> str:
        return validate_name(v)

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str) -> str:
        return validate_digits(v, pattern=PHONE_RE, error_key="error.invalid_phone")

    @field_validator("contact")
    @classmethod
    def _contact(cls, v: str) -> str:
        return validate_name(v)


class DistributorUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    contact: Optional[str] = None
    company_id: Optional[int] = None

    @field_validator("name")
    @classmethod
    def _name(cls, v: Optional[str]) -> Optional[str]:
        return validate_name(v) if v is not None else None

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: Optional[str]) -> Optional[str]:
        return (
            validate_digits(v, pattern=PHONE_RE, error_key="error.invalid_phone")
            if v is not None
            else None
        )

    @field_validator("contact")
    @classmethod
    def _contact(cls, v: Optional[str]) -> Optional[str]:
        return validate_name(v) if v is not None else None


# ---------------------------------------------------------------------------
# Auth / roles
# ---------------------------------------------------------------------------


class LoginRequest(BaseModel):
    nick: str
    password: str


class RecoverStep1Request(BaseModel):
    cedula: str

    @field_validator("cedula")
    @classmethod
    def _cedula(cls, v: str) -> str:
        return validate_digits(v, pattern=CEDULA_RE, error_key="error.invalid_cedula")


class RecoverStep2Request(BaseModel):
    cedula: str
    answer: str

    @field_validator("cedula")
    @classmethod
    def _cedula(cls, v: str) -> str:
        return validate_digits(v, pattern=CEDULA_RE, error_key="error.invalid_cedula")


class RecoverStep3Request(BaseModel):
    cedula: str
    reset_token: str
    new_password: str

    @field_validator("cedula")
    @classmethod
    def _cedula(cls, v: str) -> str:
        return validate_digits(v, pattern=CEDULA_RE, error_key="error.invalid_cedula")

    @field_validator("new_password")
    @classmethod
    def _new_password(cls, v: str) -> str:
        return validate_password(v)


class PermissionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sub_module_id: int
    key: str
    name: str


class PermissionsUpdate(BaseModel):
    sub_module_ids: List[int]


# ---------------------------------------------------------------------------
# Products (request + response schemas)
# ---------------------------------------------------------------------------


class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    price: float = 0.0
    tax_rate: float = 0.0
    stock: int = 0
    company_id: int

    @field_validator("name")
    @classmethod
    def _name(cls, v: str) -> str:
        return validate_name(v)

    @field_validator("description")
    @classmethod
    def _description(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return ""
        v = v.strip()
        if len(v) > 200:
            raise ValueError("error.invalid_description")
        return v

    @field_validator("price")
    @classmethod
    def _price(cls, v: float) -> float:
        if v < 0:
            raise ValueError("error.invalid_price")
        return v

    @field_validator("tax_rate")
    @classmethod
    def _tax_rate(cls, v: float) -> float:
        if not 0 <= v <= 100:
            raise ValueError("error.invalid_tax_rate")
        return v

    @field_validator("stock")
    @classmethod
    def _stock(cls, v: int) -> int:
        if v < 0:
            raise ValueError("error.invalid_stock")
        return v


class ProductUpdate(BaseModel):
    """Partial update — stock is NEVER edited here (movements own stock)."""

    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    tax_rate: Optional[float] = None
    status: Optional[bool] = None
    company_id: Optional[int] = None

    @field_validator("name")
    @classmethod
    def _name(cls, v: Optional[str]) -> Optional[str]:
        return validate_name(v) if v is not None else None

    @field_validator("description")
    @classmethod
    def _description(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        if len(v) > 200:
            raise ValueError("error.invalid_description")
        return v

    @field_validator("price")
    @classmethod
    def _price(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v < 0:
            raise ValueError("error.invalid_price")
        return v

    @field_validator("tax_rate")
    @classmethod
    def _tax_rate(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not 0 <= v <= 100:
            raise ValueError("error.invalid_tax_rate")
        return v


class ProductOut(BaseModel):
    """Product row returned by the /api/products endpoints."""

    id: int
    name: str
    description: str
    price: float
    tax_rate: float
    stock: int
    company_id: int
    company_name: str | None = None
    status: bool
    created_at: str | None = None


# ---------------------------------------------------------------------------
# Stock movements (request + response schemas)
# ---------------------------------------------------------------------------


class MovementPurchaseRequest(BaseModel):
    product_id: int
    quantity: int
    unit_price: float = 0.0
    supplier: Optional[str] = None
    description: Optional[str] = None

    @field_validator("quantity")
    @classmethod
    def _quantity(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("error.invalid_quantity")
        return v

    @field_validator("unit_price")
    @classmethod
    def _unit_price(cls, v: float) -> float:
        if v < 0:
            raise ValueError("error.invalid_unit_price")
        return v

    @field_validator("supplier")
    @classmethod
    def _supplier(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        if len(v) > 120:
            raise ValueError("error.invalid_supplier")
        return v

    @field_validator("description")
    @classmethod
    def _description(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        if len(v) > 200:
            raise ValueError("error.invalid_description")
        return v


class MovementSaleRequest(BaseModel):
    product_id: int
    quantity: int
    unit_price: float = 0.0
    client: Optional[str] = None
    description: Optional[str] = None

    @field_validator("quantity")
    @classmethod
    def _quantity(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("error.invalid_quantity")
        return v

    @field_validator("unit_price")
    @classmethod
    def _unit_price(cls, v: float) -> float:
        if v < 0:
            raise ValueError("error.invalid_unit_price")
        return v

    @field_validator("client")
    @classmethod
    def _client(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        if len(v) > 120:
            raise ValueError("error.invalid_client")
        return v

    @field_validator("description")
    @classmethod
    def _description(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        if len(v) > 200:
            raise ValueError("error.invalid_description")
        return v


class MovementAdjustRequest(BaseModel):
    product_id: int
    quantity: int
    direction: str  # "in" | "out"
    reason: Optional[str] = None

    @field_validator("quantity")
    @classmethod
    def _quantity(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("error.invalid_quantity")
        return v

    @field_validator("direction")
    @classmethod
    def _direction(cls, v: str) -> str:
        v = (v or "").strip().lower()
        if v not in ("in", "out"):
            raise ValueError("error.invalid_direction")
        return v

    @field_validator("reason")
    @classmethod
    def _reason(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        if len(v) > 200:
            raise ValueError("error.invalid_description")
        return v


class MovementOut(BaseModel):
    """Stock movement row returned by the /api/movements endpoints."""

    id: int
    product_id: int
    product_name: str | None = None
    movement_type: str
    kind: str
    quantity: int
    unit_price: float
    tax_rate: float
    client: str | None = None
    supplier: str | None = None
    description: str
    created_at: str | None = None
    user_nick: str | None = None


# ---------------------------------------------------------------------------
# Music (response schemas)
# ---------------------------------------------------------------------------


class SongOut(BaseModel):
    """Uploaded song row returned by the /api/music endpoints."""

    id: int
    title: str
    filename: str
    created_at: str | None = None
    url: str


# ---------------------------------------------------------------------------
# Dashboard (response schema)
# ---------------------------------------------------------------------------


class DashboardOut(BaseModel):
    """Aggregates returned by GET /api/dashboard."""

    products_count: int
    low_stock_count: int
    low_stock: List[ProductOut]
    movements_today: int
    sales_today: int
    latest_movements: List[MovementOut]
