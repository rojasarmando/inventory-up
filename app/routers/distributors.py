"""Distributors router: CRUD + status toggle (distribuidoras)."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..deps import CurrentUserDep, DbSessionDep, log_event, require_permission
from ..models import Company, Distributor, User
from ..schemas import (
    ApiResponse,
    DistributorCreate,
    DistributorOut,
    DistributorSelectOut,
    DistributorUpdate,
)

router = APIRouter(prefix="/api/distributors", tags=["distributors"])


def _serialize(distributor: Distributor) -> dict:
    return {
        "id": distributor.id,
        "name": distributor.name,
        "phone": distributor.phone,
        "contact": distributor.contact,
        "status": distributor.status,
        "company_id": distributor.company_id,
        "company_name": distributor.company.name if distributor.company else None,
        "created_at": distributor.created_at.isoformat()
        if distributor.created_at
        else None,
    }


def _unique_violation(exc: IntegrityError) -> HTTPException:
    message = str(exc.orig or exc)
    if "distributors.phone" in message:
        return HTTPException(status_code=400, detail="error.phone_taken")
    return HTTPException(status_code=400, detail="error.duplicate_record")


def _company_exists(db: Session, company_id: int) -> bool:
    return db.query(Company.id).filter(Company.id == company_id).first() is not None


@router.get("")
def list_distributors(
    _user: Annotated[User, Depends(require_permission("distributors.view"))],
    db: DbSessionDep,
    company_id: Annotated[int | None, Query()] = None,
) -> ApiResponse[list[DistributorOut]]:
    """List distributors, optionally filtered by company."""
    query = db.query(Distributor)
    if company_id is not None:
        query = query.filter(Distributor.company_id == company_id)
    distributors = query.order_by(Distributor.id).all()
    return {"ok": True, "data": [_serialize(d) for d in distributors]}


@router.get("/select")
def select_distributors(
    user: CurrentUserDep,
    db: DbSessionDep,
    company_id: Annotated[int | None, Query()] = None,
) -> ApiResponse[list[DistributorSelectOut]]:
    """Lightweight list of active distributors for <select> dropdowns."""
    query = db.query(Distributor).filter(Distributor.status.is_(True))
    if company_id is not None:
        query = query.filter(Distributor.company_id == company_id)
    distributors = query.order_by(Distributor.name).all()
    return {
        "ok": True,
        "data": [{"id": d.id, "name": d.name} for d in distributors],
    }


@router.post("")
def create_distributor(
    payload: DistributorCreate,
    current: Annotated[User, Depends(require_permission("distributors.create"))],
    db: DbSessionDep,
) -> ApiResponse[DistributorOut]:
    if not _company_exists(db, payload.company_id):
        raise HTTPException(status_code=400, detail="error.company_not_found")
    distributor = Distributor(
        name=payload.name,
        phone=payload.phone,
        contact=payload.contact,
        company_id=payload.company_id,
        status=True,
    )
    db.add(distributor)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise _unique_violation(exc)
    db.refresh(distributor)
    log_event(
        db, current, "create_distributor", f"Created distributor '{distributor.name}'"
    )
    return {"ok": True, "data": _serialize(distributor)}


@router.put("/{distributor_id}")
def update_distributor(
    distributor_id: Annotated[int, Path()],
    payload: DistributorUpdate,
    current: Annotated[User, Depends(require_permission("distributors.edit"))],
    db: DbSessionDep,
) -> ApiResponse[DistributorOut]:
    distributor = db.get(Distributor, distributor_id)
    if distributor is None:
        raise HTTPException(status_code=404, detail="error.not_found")
    updates = payload.model_dump(exclude_unset=True)
    if "company_id" in updates and not _company_exists(db, updates["company_id"]):
        raise HTTPException(status_code=400, detail="error.company_not_found")
    for field, value in updates.items():
        setattr(distributor, field, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise _unique_violation(exc)
    db.refresh(distributor)
    log_event(
        db, current, "edit_distributor", f"Edited distributor '{distributor.name}'"
    )
    return {"ok": True, "data": _serialize(distributor)}


@router.delete("/{distributor_id}")
def delete_distributor(
    distributor_id: Annotated[int, Path()],
    current: Annotated[User, Depends(require_permission("distributors.delete"))],
    db: DbSessionDep,
) -> ApiResponse[None]:
    distributor = db.get(Distributor, distributor_id)
    if distributor is None:
        raise HTTPException(status_code=404, detail="error.not_found")
    name = distributor.name
    db.delete(distributor)
    db.commit()
    log_event(db, current, "delete_distributor", f"Deleted distributor '{name}'")
    return {"ok": True, "data": None}


@router.patch("/{distributor_id}/status")
def toggle_distributor_status(
    distributor_id: Annotated[int, Path()],
    current: Annotated[
        User, Depends(require_permission("distributors.toggle_status"))
    ],
    db: DbSessionDep,
) -> ApiResponse[DistributorOut]:
    distributor = db.get(Distributor, distributor_id)
    if distributor is None:
        raise HTTPException(status_code=404, detail="error.not_found")
    distributor.status = not distributor.status
    db.commit()
    log_event(
        db,
        current,
        "toggle_distributor_status",
        f"Distributor '{distributor.name}' status set to {distributor.status}",
    )
    return {"ok": True, "data": _serialize(distributor)}
