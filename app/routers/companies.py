"""Companies router: CRUD + status toggle (empresas)."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.exc import IntegrityError

from ..deps import DbSessionDep, log_event, require_permission
from ..models import Company, User
from ..schemas import ApiResponse, CompanyCreate, CompanyOut, CompanyUpdate

router = APIRouter(prefix="/api/companies", tags=["companies"])


def _serialize(company: Company) -> dict:
    return {
        "id": company.id,
        "rif": company.rif,
        "name": company.name,
        "description": company.description,
        "status": company.status,
        "created_at": company.created_at.isoformat() if company.created_at else None,
    }


def _unique_violation(exc: IntegrityError) -> HTTPException:
    message = str(exc.orig or exc)
    if "companies.rif" in message:
        return HTTPException(status_code=400, detail="error.rif_taken")
    return HTTPException(status_code=400, detail="error.duplicate_record")


@router.get("")
def list_companies(
    _user: Annotated[User, Depends(require_permission("companies.view"))],
    db: DbSessionDep,
) -> ApiResponse[list[CompanyOut]]:
    companies = db.query(Company).order_by(Company.id).all()
    return {"ok": True, "data": [_serialize(c) for c in companies]}


@router.post("")
def create_company(
    payload: CompanyCreate,
    current: Annotated[User, Depends(require_permission("companies.create"))],
    db: DbSessionDep,
) -> ApiResponse[CompanyOut]:
    company = Company(
        rif=payload.rif,
        name=payload.name,
        description=payload.description or "",
        status=True,
    )
    db.add(company)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise _unique_violation(exc)
    db.refresh(company)
    log_event(db, current, "create_company", f"Created company '{company.name}'")
    return {"ok": True, "data": _serialize(company)}


@router.put("/{company_id}")
def update_company(
    company_id: Annotated[int, Path()],
    payload: CompanyUpdate,
    current: Annotated[User, Depends(require_permission("companies.edit"))],
    db: DbSessionDep,
) -> ApiResponse[CompanyOut]:
    company = db.get(Company, company_id)
    if company is None:
        raise HTTPException(status_code=404, detail="error.not_found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(company, field, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise _unique_violation(exc)
    db.refresh(company)
    log_event(db, current, "edit_company", f"Edited company '{company.name}'")
    return {"ok": True, "data": _serialize(company)}


@router.delete("/{company_id}")
def delete_company(
    company_id: Annotated[int, Path()],
    current: Annotated[User, Depends(require_permission("companies.delete"))],
    db: DbSessionDep,
) -> ApiResponse[None]:
    company = db.get(Company, company_id)
    if company is None:
        raise HTTPException(status_code=404, detail="error.not_found")
    name = company.name
    try:
        db.delete(company)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="error.company_in_use")
    log_event(db, current, "delete_company", f"Deleted company '{name}'")
    return {"ok": True, "data": None}


@router.patch("/{company_id}/status")
def toggle_company_status(
    company_id: Annotated[int, Path()],
    current: Annotated[User, Depends(require_permission("companies.toggle_status"))],
    db: DbSessionDep,
) -> ApiResponse[CompanyOut]:
    company = db.get(Company, company_id)
    if company is None:
        raise HTTPException(status_code=404, detail="error.not_found")
    company.status = not company.status
    db.commit()
    log_event(
        db,
        current,
        "toggle_company_status",
        f"Company '{company.name}' status set to {company.status}",
    )
    return {"ok": True, "data": _serialize(company)}
