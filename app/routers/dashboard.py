"""Dashboard router: aggregates for the home page (GET /api/dashboard)."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func

from ..deps import DbSessionDep, require_permission
from ..models import Product, StockMovement, User, utcnow
from ..schemas import ApiResponse, DashboardOut
from .movements import _serialize_movement
from .products import _serialize_product, LOW_STOCK_THRESHOLD

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

LATEST_MOVEMENTS_LIMIT = 5


@router.get("")
def dashboard(
    _user: Annotated[User, Depends(require_permission("home.view"))],
    db: DbSessionDep,
) -> ApiResponse[DashboardOut]:
    """Return product/movement aggregates for the dashboard home page."""
    products_count = db.query(func.count(Product.id)).scalar() or 0

    low_stock = (
        db.query(Product)
        .filter(Product.stock <= LOW_STOCK_THRESHOLD)
        .order_by(Product.stock, Product.id)
        .all()
    )

    now = utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    movements_today = (
        db.query(func.count(StockMovement.id))
        .filter(StockMovement.created_at >= today_start)
        .scalar()
        or 0
    )
    sales_today = (
        db.query(func.count(StockMovement.id))
        .filter(
            StockMovement.created_at >= today_start,
            StockMovement.kind == "sale",
        )
        .scalar()
        or 0
    )

    latest = (
        db.query(StockMovement)
        .order_by(StockMovement.created_at.desc(), StockMovement.id.desc())
        .limit(LATEST_MOVEMENTS_LIMIT)
        .all()
    )

    return {
        "ok": True,
        "data": {
            "products_count": products_count,
            "low_stock_count": len(low_stock),
            "low_stock": [_serialize_product(p) for p in low_stock],
            "movements_today": movements_today,
            "sales_today": sales_today,
            "latest_movements": [_serialize_movement(m) for m in latest],
        },
    }
