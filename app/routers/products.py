"""Products router: CRUD + low stock + status toggle.

Products belong to a company. ``stock`` is owned by stock movements (see
``movements.py``) and is never edited through this router. DELETE performs a
soft delete (``status=False``) so movement history is preserved.
"""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query

from ..deps import DbSessionDep, log_event, require_permission
from ..models import Company, Product, User
from ..schemas import ApiResponse, ProductCreate, ProductOut, ProductUpdate

router = APIRouter(prefix="/api/products", tags=["products"])

LOW_STOCK_THRESHOLD = 5


def _serialize_product(product: Product) -> dict:
    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": product.price,
        "tax_rate": product.tax_rate,
        "stock": product.stock,
        "company_id": product.company_id,
        "company_name": product.company.name if product.company is not None else None,
        "status": product.status,
        "created_at": product.created_at.isoformat() if product.created_at else None,
    }


@router.get("")
def list_products(
    _user: Annotated[User, Depends(require_permission("products.view"))],
    db: DbSessionDep,
    company_id: Annotated[Optional[int], Query()] = None,
    status: Annotated[Optional[bool], Query()] = None,
) -> ApiResponse[list[ProductOut]]:
    """List products, optionally filtered by company and/or status."""
    query = db.query(Product)
    if company_id is not None:
        query = query.filter(Product.company_id == company_id)
    if status is not None:
        query = query.filter(Product.status == status)
    products = query.order_by(Product.id).all()
    return {"ok": True, "data": [_serialize_product(p) for p in products]}


@router.get("/low")
def list_low_stock_products(
    _user: Annotated[User, Depends(require_permission("products.view"))],
    db: DbSessionDep,
) -> ApiResponse[list[ProductOut]]:
    """List products at or below the low stock threshold (stock <= 5)."""
    products = (
        db.query(Product)
        .filter(Product.stock <= LOW_STOCK_THRESHOLD)
        .order_by(Product.stock, Product.id)
        .all()
    )
    return {"ok": True, "data": [_serialize_product(p) for p in products]}


@router.post("")
def create_product(
    payload: ProductCreate,
    current: Annotated[User, Depends(require_permission("products.create"))],
    db: DbSessionDep,
) -> ApiResponse[ProductOut]:
    """Create a product for an existing company."""
    company = db.get(Company, payload.company_id)
    if company is None:
        raise HTTPException(status_code=404, detail="error.company_not_found")
    product = Product(
        name=payload.name,
        description=payload.description or "",
        price=payload.price,
        tax_rate=payload.tax_rate,
        stock=payload.stock,
        company_id=payload.company_id,
        status=True,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    log_event(db, current, "create_product", f"Created product '{product.name}'")
    return {"ok": True, "data": _serialize_product(product)}


@router.put("/{product_id}")
def update_product(
    product_id: Annotated[int, Path()],
    payload: ProductUpdate,
    current: Annotated[User, Depends(require_permission("products.edit"))],
    db: DbSessionDep,
) -> ApiResponse[ProductOut]:
    """Edit product fields (name/description/price/tax_rate/status/company_id).

    ``stock`` is intentionally NOT editable here.
    """
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="error.not_found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "stock":
            continue
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    log_event(db, current, "edit_product", f"Edited product '{product.name}'")
    return {"ok": True, "data": _serialize_product(product)}


@router.delete("/{product_id}")
def delete_product(
    product_id: Annotated[int, Path()],
    current: Annotated[User, Depends(require_permission("products.delete"))],
    db: DbSessionDep,
) -> ApiResponse[None]:
    """Soft delete a product (status=False) to preserve movement history."""
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="error.not_found")
    product.status = False
    db.commit()
    log_event(db, current, "delete_product", f"Deleted product '{product.name}'")
    return {"ok": True, "data": None}


@router.patch("/{product_id}/status")
def toggle_product_status(
    product_id: Annotated[int, Path()],
    current: Annotated[User, Depends(require_permission("products.edit"))],
    db: DbSessionDep,
) -> ApiResponse[ProductOut]:
    """Toggle the active status of a product (no dedicated toggle key)."""
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="error.not_found")
    product.status = not product.status
    db.commit()
    log_event(
        db,
        current,
        "toggle_product_status",
        f"Product '{product.name}' status set to {product.status}",
    )
    return {"ok": True, "data": _serialize_product(product)}