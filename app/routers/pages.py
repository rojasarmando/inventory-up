"""Page routes: Jinja2 templates for all screens.

Auth guards:
- Not authenticated -> redirect to /login
- Authenticated but missing the page permission -> redirect to /403
"""

from typing import Optional, Union

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session

from ..deps import DbSessionDep, user_has_permission
from ..models import User
from .. import config
from ..security import decode_access_token

router = APIRouter(tags=["pages"])

# Page path -> permission key required to view it.
PAGE_PERMISSIONS = {
    "/home": "home.view",
    "/users": "users.view",
    "/companies": "companies.view",
    "/distributors": "distributors.view",
    "/roles": "roles.manage",
    "/logs": "logs.view",
    "/reports": "reports.view",
    "/products": "products.view",
    "/movements": "movements.view",
    "/music": "music.view",
    "/gallery": "gallery.view",
}


def _page_user(request: Request, db: Session) -> Optional[User]:
    """Resolve the user from the cookie, or None when not authenticated."""
    token = request.cookies.get(config.COOKIE_NAME)
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        user_id = int(payload.get("sub"))
    except Exception:
        return None
    user = db.get(User, user_id)
    if user is None or not user.status:
        return None
    return user


def _guard(
    request: Request,
    db: Session,
    key: Optional[str],
) -> Union[User, RedirectResponse]:
    """Return the user, or a redirect to /login or /403."""
    user = _page_user(request, db)
    if user is None:
        return RedirectResponse(url="/login", status_code=303)
    if key is not None and not user_has_permission(db, user, key):
        return RedirectResponse(url="/403", status_code=303)
    return user


@router.get("/", response_class=HTMLResponse)
def index(request: Request, db: DbSessionDep):
    user = _page_user(request, db)
    if user is None:
        return RedirectResponse(url="/login", status_code=303)
    return RedirectResponse(url="/home", status_code=303)


@router.get("/login", response_class=HTMLResponse)
def login_page(request: Request, db: DbSessionDep):
    user = _page_user(request, db)
    if user is not None:
        return RedirectResponse(url="/home", status_code=303)
    return _render(request, "login.html", {})


@router.get("/home", response_class=HTMLResponse)
def home_page(request: Request, db: DbSessionDep):
    guard = _guard(request, db, "home.view")
    if isinstance(guard, RedirectResponse):
        return guard
    return _render(request, "home.html", {"user": guard})


@router.get("/users", response_class=HTMLResponse)
def users_page(request: Request, db: DbSessionDep):
    guard = _guard(request, db, "users.view")
    if isinstance(guard, RedirectResponse):
        return guard
    return _render(request, "users.html", {"user": guard})


@router.get("/companies", response_class=HTMLResponse)
def companies_page(request: Request, db: DbSessionDep):
    guard = _guard(request, db, "companies.view")
    if isinstance(guard, RedirectResponse):
        return guard
    return _render(request, "companies.html", {"user": guard})


@router.get("/distributors", response_class=HTMLResponse)
def distributors_page(request: Request, db: DbSessionDep):
    guard = _guard(request, db, "distributors.view")
    if isinstance(guard, RedirectResponse):
        return guard
    return _render(request, "distributors.html", {"user": guard})


@router.get("/logs", response_class=HTMLResponse)
def logs_page(request: Request, db: DbSessionDep):
    guard = _guard(request, db, "logs.view")
    if isinstance(guard, RedirectResponse):
        return guard
    return _render(request, "logs.html", {"user": guard})


@router.get("/roles", response_class=HTMLResponse)
def roles_page(request: Request, db: DbSessionDep):
    guard = _guard(request, db, "roles.manage")
    if isinstance(guard, RedirectResponse):
        return guard
    return _render(request, "roles.html", {"user": guard})


@router.get("/reports", response_class=HTMLResponse)
def reports_page(request: Request, db: DbSessionDep):
    guard = _guard(request, db, "reports.view")
    if isinstance(guard, RedirectResponse):
        return guard
    return _render(request, "reports.html", {"user": guard})


@router.get("/products", response_class=HTMLResponse)
def products_page(request: Request, db: DbSessionDep):
    guard = _guard(request, db, "products.view")
    if isinstance(guard, RedirectResponse):
        return guard
    return _render(request, "products.html", {"user": guard})


@router.get("/movements", response_class=HTMLResponse)
def movements_page(request: Request, db: DbSessionDep):
    guard = _guard(request, db, "movements.view")
    if isinstance(guard, RedirectResponse):
        return guard
    return _render(request, "movements.html", {"user": guard})


@router.get("/music", response_class=HTMLResponse)
def music_page(request: Request, db: DbSessionDep):
    guard = _guard(request, db, "music.view")
    if isinstance(guard, RedirectResponse):
        return guard
    return _render(request, "music.html", {"user": guard})


@router.get("/gallery", response_class=HTMLResponse)
def gallery_page(request: Request, db: DbSessionDep):
    guard = _guard(request, db, "gallery.view")
    if isinstance(guard, RedirectResponse):
        return guard
    return _render(request, "gallery.html", {"user": guard})


@router.get("/403", response_class=HTMLResponse)
def forbidden_page(request: Request):
    return _render(request, "403.html", {})


@router.get("/505", response_class=HTMLResponse)
def server_error_page(request: Request):
    return _render(request, "505.html", {})


def _render(request: Request, template: str, context: dict) -> HTMLResponse:
    templates = request.app.state.templates
    return templates.TemplateResponse(request, template, context)
