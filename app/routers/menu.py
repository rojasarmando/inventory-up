"""Menu router: dynamic menu filtered by the current user's permissions.

Correct permission logic: Root (and any role with no permission rows) sees
every module/sub-module; other roles see only the sub-modules they have a
permission row for (the original PHP inverted this and hid what users were
allowed to see).
"""

from fastapi import APIRouter

from ..deps import CurrentUserDep, DbSessionDep, user_permission_keys
from ..models import Module
from ..schemas import ApiResponse, MenuModuleOut

router = APIRouter(prefix="/api/menu", tags=["menu"])

# Keys that represent navigation pages (action keys never appear in the menu).
MENU_KEYS = {
    "home.view",
    "users.view",
    "companies.view",
    "distributors.view",
    "roles.manage",
    "logs.view",
    "reports.view",
    "about.view",
    "products.view",
    "movements.view",
    "music.view",
    "gallery.view",
}

_URLS = {
    "home.view": "/home",
    "users.view": "/users",
    "companies.view": "/companies",
    "distributors.view": "/distributors",
    "roles.manage": "/roles",
    "logs.view": "/logs",
    "reports.view": "/reports",
    "about.view": "/",
    "products.view": "/products",
    "movements.view": "/movements",
    "music.view": "/music",
    "gallery.view": "/gallery",
}


@router.get("")
def get_menu(
    user: CurrentUserDep,
    db: DbSessionDep,
) -> ApiResponse[list[MenuModuleOut]]:
    """Return modules with only the sub-modules the user may access."""
    keys = user_permission_keys(db, user)
    full_access = keys is None
    allowed = set(keys) if not full_access else None

    modules = db.query(Module).order_by(Module.id).all()
    result = []
    for module in modules:
        visible = []
        for sub in module.sub_modules:
            if sub.key not in MENU_KEYS:
                continue
            if full_access or sub.key in allowed:
                visible.append(
                    {
                        "id": sub.id,
                        "name": sub.name,
                        "key": sub.key,
                        "url": _URLS.get(sub.key, "/"),
                    }
                )
        if visible:
            result.append(
                {
                    "id": module.id,
                    "name": module.name,
                    "description": module.description,
                    "sub_modules": visible,
                }
            )
    return {"ok": True, "data": result}
