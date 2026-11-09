"""Movements router: purchases, sales and stock adjustments.

Every movement adjusts ``product.stock`` in the same transaction and snapshots
the product tax rate at movement time, so historical figures stay stable.
"""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from ..deps import DbSessionDep, log_event, require_permission
from ..models import Product, StockMovement, User
from ..schemas import (
    ApiResponse,
    MovementAdjustRequest,
    MovementOut,
    MovementPurchaseRequest,
    MovementSaleRequest,
)

router = APIRouter(prefix="/api/movements", tags=["movements"])


def _get_product_or_404(db, product_id: int) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="error.product_not_found")
    return product


def _serialize_movement(
    movement: StockMovement,
    product_name: Optional[str] = None,
    user_nick: Optional[str] = None,
) -> dict:
    return {
        "id": movement.id,
        "product_id": movement.product_id,
        "product_name": product_name
        if product_name is not None
        else (movement.product.name if movement.product is not None else None),
        "movement_type": movement.movement_type,
        "kind": movement.kind,
        "quantity": movement.quantity,
        "unit_price": movement.unit_price,
        "tax_rate": movement.tax_rate,
        "client": movement.client,
        "supplier": movement.supplier,
        "description": movement.description,
        "created_at": movement.created_at.isoformat() if movement.created_at else None,
        "user_nick": user_nick
        if user_nick is not None
        else (movement.user.nick if movement.user is not None else None),
    }


@router.post("/purchase")
def create_purchase(
    payload: MovementPurchaseRequest,
    current: Annotated[User, Depends(require_permission("purchases.create"))],
    db: DbSessionDep,
) -> ApiResponse[MovementOut]:
    """Register a purchase: stock in + a movement with the tax rate snapshot."""
    product = _get_product_or_404(db, payload.product_id)
    product.stock = product.stock + payload.quantity
    movement = StockMovement(
        product_id=product.id,
        movement_type="in",
        kind="purchase",
        quantity=payload.quantity,
        unit_price=payload.unit_price,
        tax_rate=product.tax_rate,
        supplier=payload.supplier or None,
        description=payload.description or "",
        user_id=current.id,
    )
    db.add(movement)
    db.commit()
    db.refresh(movement)
    log_event(
        db,
        current,
        "create_purchase",
        f"Purchased {payload.quantity} units of '{product.name}'",
    )
    return {"ok": True, "data": _serialize_movement(movement, product_name=product.name)}


@router.post("/sale")
def create_sale(
    payload: MovementSaleRequest,
    current: Annotated[User, Depends(require_permission("sales.create"))],
    db: DbSessionDep,
) -> ApiResponse[MovementOut]:
    """Register a sale: check stock, then stock out + a movement."""
    product = _get_product_or_404(db, payload.product_id)
    if product.stock < payload.quantity:
        raise HTTPException(status_code=400, detail="error.stock_insufficient")
    product.stock = product.stock - payload.quantity
    movement = StockMovement(
        product_id=product.id,
        movement_type="out",
        kind="sale",
        quantity=payload.quantity,
        unit_price=payload.unit_price,
        tax_rate=product.tax_rate,
        client=payload.client or None,
        description=payload.description or "",
        user_id=current.id,
    )
    db.add(movement)
    db.commit()
    db.refresh(movement)
    log_event(
        db,
        current,
        "create_sale",
        f"Sale of {payload.quantity} units of '{product.name}'",
    )
    return {"ok": True, "data": _serialize_movement(movement, product_name=product.name)}


@router.post("/adjust")
def adjust_stock(
    payload: MovementAdjustRequest,
    current: Annotated[User, Depends(require_permission("movements.create"))],
    db: DbSessionDep,
) -> ApiResponse[MovementOut]:
    """Manual stock adjustment (kind='adjustment'), in or out."""
    product = _get_product_or_404(db, payload.product_id)
    if payload.direction == "out":
        if product.stock < payload.quantity:
            raise HTTPException(status_code=400, detail="error.stock_insufficient")
        product.stock = product.stock - payload.quantity
        event_key = "stock_out"
        log_note = "removed"
    else:
        product.stock = product.stock + payload.quantity
        event_key = "stock_in"
        log_note = "added"
    movement = StockMovement(
        product_id=product.id,
        movement_type=payload.direction,
        kind="adjustment",
        quantity=payload.quantity,
        unit_price=0.0,
        tax_rate=product.tax_rate,
        description=payload.reason or "",
        user_id=current.id,
    )
    db.add(movement)
    db.commit()
    db.refresh(movement)
    log_event(
        db,
        current,
        event_key,
        f"Adjusted stock of '{product.name}': {log_note} {payload.quantity} units",
    )
    return {"ok": True, "data": _serialize_movement(movement, product_name=product.name)}


@router.get("")
def list_movements(
    _user: Annotated[User, Depends(require_permission("movements.view"))],
    db: DbSessionDep,
    product_id: Annotated[Optional[int], Query()] = None,
    type: Annotated[Optional[str], Query()] = None,
    kind: Annotated[Optional[str], Query()] = None,
) -> ApiResponse[list[MovementOut]]:
    """List movements, newest first, with product name and user nick."""
    query = db.query(StockMovement, Product.name, User.nick).join(
        Product, StockMovement.product_id == Product.id
    ).outerjoin(User, StockMovement.user_id == User.id)
    if product_id is not None:
        query = query.filter(StockMovement.product_id == product_id)
    if type is not None:
        query = query.filter(StockMovement.movement_type == type)
    if kind is not None:
        query = query.filter(StockMovement.kind == kind)
    rows = (
        query.order_by(StockMovement.created_at.desc(), StockMovement.id.desc()).all()
    )
    data = [
        _serialize_movement(movement, product_name=product_name, user_nick=nick)
        for movement, product_name, nick in rows
    ]
    return {"ok": True, "data": data}
