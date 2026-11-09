"""FastAPI application entry point.

Lifecycle: apply Alembic migrations (schema + minimal default seed data) when
the app starts, then serve Jinja2 pages, JSON APIs under /api and static files
under /static.
"""

from contextlib import asynccontextmanager
import os

from alembic import command
from alembic.config import Config
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.exceptions import HTTPException as StarletteHTTPException

from . import config


def run_migrations() -> None:
    """Apply Alembic migrations up to ``head``.

    The CLI, the app lifespan and Docker all read the same database URL from
    ``app.config.DATABASE_URL`` (see migrations/env.py).
    """
    cfg = Config("alembic.ini")
    cfg.set_main_option("script_location", "migrations")
    command.upgrade(cfg, "head")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Schema + default seed data are owned by the Alembic migrations.
    run_migrations()
    # Ensure the music directory exists before /music serves any file.
    os.makedirs(config.MUSIC_DIR, exist_ok=True)
    yield


app = FastAPI(title=config.APP_NAME, lifespan=lifespan)

# The /music static mount needs the directory to exist at import time.
os.makedirs(config.MUSIC_DIR, exist_ok=True)

app.state.templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/music", StaticFiles(directory=config.MUSIC_DIR), name="music")

from .routers import (  # noqa: E402  (imports after app creation)
    auth,
    companies,
    dashboard,
    distributors,
    logs,
    menu,
    movements,
    music,
    pages,
    products,
    reports,
    roles,
    users,
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(companies.router)
app.include_router(distributors.router)
app.include_router(roles.router)
app.include_router(logs.router)
app.include_router(reports.router)
app.include_router(menu.router)
app.include_router(products.router)
app.include_router(movements.router)
app.include_router(music.router)
app.include_router(dashboard.router)
app.include_router(pages.router)


# ---------------------------------------------------------------------------
# Exception handlers -> consistent response shape {ok, detail} on /api, and
# HTML pages elsewhere.
# ---------------------------------------------------------------------------


def _is_api(request: Request) -> bool:
    return request.url.path.startswith("/api")


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    if _is_api(request):
        return JSONResponse(
            status_code=400, content={"ok": False, "detail": "error.validation"}
        )
    return _render_error_page(request, 400)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    if _is_api(request):
        return JSONResponse(
            status_code=exc.status_code,
            content={"ok": False, "detail": exc.detail or "error.not_found"},
        )
    if exc.status_code == 404:
        return _render_error_page(request, 404)
    if exc.status_code == 403:
        return _render_error_page(request, 403)
    return _render_error_page(request, exc.status_code)


@app.exception_handler(500)
async def server_error_handler(request: Request, exc: Exception):
    if _is_api(request):
        return JSONResponse(
            status_code=500, content={"ok": False, "detail": "error.server"}
        )
    return _render_error_page(request, 505)


def _render_error_page(request: Request, status_code: int) -> HTMLResponse:
    templates: Jinja2Templates = request.app.state.templates
    template = {404: "404.html", 403: "403.html", 505: "505.html"}.get(
        status_code, "505.html"
    )
    return templates.TemplateResponse(request, template, {}, status_code=status_code)
