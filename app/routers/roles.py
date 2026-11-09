"""Roles router: role list for selects + permission assignment."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path

from ..deps import CurrentUserDep, DbSessionDep, log_event, require_permission
from ..models import Module, Permission, Role, SubModule, User
from ..schemas import (
    ApiResponse,
    ModuleCatalogOut,
    PermissionsUpdate,
    RoleListOut,
    RolePermissionsOut,
)

router = APIRouter(prefix="/api/roles", tags=["roles"])


@router.get("")
def list_roles(
    user: CurrentUserDep,
    db: DbSessionDep,
) -> ApiResponse[list[RoleListOut]]:
    """List roles for dropdowns (any authenticated user)."""
    roles = db.query(Role).order_by(Role.id).all()
    return {
        "ok": True,
        "data": [
            {"id": r.id, "name": r.name, "description": r.description}
            for r in roles
        ],
    }


@router.get("/permission-catalog")
def permission_catalog(
    user: Annotated[User, Depends(require_permission("roles.manage"))],
    db: DbSessionDep,
) -> ApiResponse[list[ModuleCatalogOut]]:
    """All sub-modules grouped by module, for the permission manager."""
    modules = db.query(Module).order_by(Module.id).all()
    return {
        "ok": True,
        "data": [
            {
                "id": m.id,
                "name": m.name,
                "sub_modules": [
                    {"id": s.id, "name": s.name, "key": s.key}
                    for s in m.sub_modules
                ],
            }
            for m in modules
        ],
    }


@router.get("/{role_id}/permissions")
def get_role_permissions(
    role_id: Annotated[int, Path()],
    user: Annotated[User, Depends(require_permission("roles.manage"))],
    db: DbSessionDep,
) -> ApiResponse[RolePermissionsOut]:
    """Return the permission sub-module ids currently assigned to a role."""
    role = db.get(Role, role_id)
    if role is None:
        raise HTTPException(status_code=404, detail="error.not_found")
    rows = (
        db.query(Permission.sub_module_id)
        .filter(Permission.role_id == role_id)
        .all()
    )
    return {"ok": True, "data": {"role_id": role_id, "sub_module_ids": [r[0] for r in rows]}}


@router.put("/{role_id}/permissions")
def set_role_permissions(
    role_id: Annotated[int, Path()],
    payload: PermissionsUpdate,
    current: Annotated[User, Depends(require_permission("roles.manage"))],
    db: DbSessionDep,
) -> ApiResponse[RolePermissionsOut]:
    """Replace the permission set of a role."""
    role = db.get(Role, role_id)
    if role is None:
        raise HTTPException(status_code=404, detail="error.not_found")
    if role.name.strip().lower() == "root":
        # Root is full-access by definition; permission rows are meaningless.
        raise HTTPException(status_code=400, detail="error.root_permissions_readonly")

    valid_ids = {s.id for s in db.query(SubModule.id).all()}
    wanted = set(payload.sub_module_ids)
    unknown = wanted - valid_ids
    if unknown:
        raise HTTPException(status_code=400, detail="error.unknown_permission")

    db.query(Permission).filter(Permission.role_id == role_id).delete()
    for sub_module_id in sorted(wanted):
        db.add(Permission(role_id=role_id, sub_module_id=sub_module_id))
    db.commit()
    log_event(
        db,
        current,
        "update_role_permissions",
        f"Permissions updated for role '{role.name}'",
    )
    return {"ok": True, "data": {"role_id": role_id, "sub_module_ids": sorted(wanted)}}
