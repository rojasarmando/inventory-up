"""Smoke tests for the Kajataca FastAPI backend.

Run with:  pip install -r requirements-dev.txt && pytest tests/ -q
"""

import os
import tempfile
from pathlib import Path

# Point the app at a throwaway database and music dir BEFORE importing it.
_TMP_DIR = Path(tempfile.mkdtemp(prefix="kajataca-test-"))
_TMP_DB = _TMP_DIR / "test.db"
_TMP_MUSIC = _TMP_DIR / "music"
os.environ["DATABASE_URL"] = f"sqlite:///{_TMP_DB}"
os.environ["MUSIC_DIR"] = str(_TMP_MUSIC)

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

ADMIN_NICK = "admin"
ADMIN_PASSWORD = "Admin123!"
ADMIN_CEDULA = "12345678"


@pytest.fixture(scope="module")
def client():
    # Context manager triggers the lifespan (Alembic migrations).
    with TestClient(app) as test_client:
        yield test_client


def _login(client, nick, password):
    return client.post("/api/auth/login", json={"nick": nick, "password": password})


def _valid_user_payload(**overrides):
    payload = {
        "name": "Test User",
        "nick": "testuser1!",
        "password": "Test1234!",
        "cedula": "8765432",
        "question": "What is your favorite beer",
        "answer": "Polar",
        "role_id": 1,  # replaced by the caller when needed
    }
    payload.update(overrides)
    return payload


def _role_id(client, name):
    response = client.get("/api/roles")
    assert response.status_code == 200
    roles = response.json()["data"]
    return next(r for r in roles if r["name"] == name)["id"]


def _sub_module_id_for_key(client, key):
    response = client.get("/api/roles/permission-catalog")
    assert response.status_code == 200
    for module in response.json()["data"]:
        for sub in module["sub_modules"]:
            if sub["key"] == key:
                return sub["id"]
    raise AssertionError(f"permission key {key!r} not found in catalog")


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------


def test_login_success_sets_cookie(client):
    response = _login(client, ADMIN_NICK, ADMIN_PASSWORD)
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["data"]["user"]["nick"] == ADMIN_NICK
    assert "access_token" in response.cookies


def test_login_failure(client):
    response = _login(client, ADMIN_NICK, "wrong-password")
    assert response.status_code == 401
    assert response.json()["ok"] is False


def test_me_requires_auth(client):
    client.cookies.clear()  # drop any cookie from previous tests
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    assert response.json()["ok"] is False


def test_me_with_auth(client):
    _login(client, ADMIN_NICK, ADMIN_PASSWORD)
    response = client.get("/api/auth/me")
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["user"]["nick"] == ADMIN_NICK
    assert body["data"]["user"]["role"]["name"] == "Root"


# ---------------------------------------------------------------------------
# Validation (REGLAS.md enforced server-side)
# ---------------------------------------------------------------------------


def test_user_validation_rejects_bad_nick(client):
    _login(client, ADMIN_NICK, ADMIN_PASSWORD)
    response = client.post(
        "/api/users",
        json=_valid_user_payload(nick="ab", cedula="1111111"),
    )
    assert response.status_code == 400
    assert response.json()["ok"] is False


def test_user_validation_rejects_nick_without_special_char(client):
    _login(client, ADMIN_NICK, ADMIN_PASSWORD)
    response = client.post(
        "/api/users",
        json=_valid_user_payload(nick="abcdefgh", cedula="1111112"),
    )
    assert response.status_code == 400


def test_user_validation_rejects_bad_cedula(client):
    _login(client, ADMIN_NICK, ADMIN_PASSWORD)
    response = client.post(
        "/api/users",
        json=_valid_user_payload(nick="testuser2!", cedula="123"),
    )
    assert response.status_code == 400


def test_user_validation_rejects_duplicate_cedula(client):
    _login(client, ADMIN_NICK, ADMIN_PASSWORD)
    response = client.post(
        "/api/users",
        json=_valid_user_payload(nick="testuser3!", cedula=ADMIN_CEDULA),
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "error.cedula_taken"


# ---------------------------------------------------------------------------
# Permissions (correct logic: user WITH permission is allowed)
# ---------------------------------------------------------------------------


def test_non_permitted_user_gets_403(client):
    # The minimal seed has no read-only role, so create one: strip the
    # Administrator role down to a single permission (users.view).
    _login(client, ADMIN_NICK, ADMIN_PASSWORD)
    admin_role_id = _role_id(client, "Administrator")
    users_view_id = _sub_module_id_for_key(client, "users.view")
    limited = client.put(
        f"/api/roles/{admin_role_id}/permissions",
        json={"sub_module_ids": [users_view_id]},
    )
    assert limited.status_code == 200

    # Admin creates a limited user (view-only role, no users.create).
    created = client.post(
        "/api/users",
        json=_valid_user_payload(
            name="Limited Operator",
            nick="limit3dop!",
            password="Limit1234!",
            cedula="7654321",
            role_id=admin_role_id,
        ),
    )
    assert created.status_code == 200

    # The limited user can log in...
    login = _login(client, "limit3dop!", "Limit1234!")
    assert login.status_code == 200

    # ...can list users (users.view)...
    listing = client.get("/api/users")
    assert listing.status_code == 200

    # ...but cannot create users (users.create missing) -> 403.
    blocked = client.post(
        "/api/users",
        json=_valid_user_payload(nick="otherus3r!", cedula="7654322"),
    )
    assert blocked.status_code == 403
    assert blocked.json()["ok"] is False


def test_root_has_full_access(client):
    # Root sees every menu sub-module without permission rows.
    _login(client, ADMIN_NICK, ADMIN_PASSWORD)
    response = client.get("/api/menu")
    assert response.status_code == 200
    keys = {
        sub["key"]
        for module in response.json()["data"]
        for sub in module["sub_modules"]
    }
    assert "users.view" in keys
    assert "roles.manage" in keys
    assert "about.view" in keys


# ---------------------------------------------------------------------------
# Logout logs the correct event (fixed bug)
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# Edit keeps the existing password when a blank one is sent
# ---------------------------------------------------------------------------


def test_edit_user_keeps_password_when_blank(client):
    _login(client, ADMIN_NICK, ADMIN_PASSWORD)
    created = client.post(
        "/api/users",
        json=_valid_user_payload(nick="editab1e!", cedula="6543210"),
    )
    assert created.status_code == 200
    user_id = created.json()["data"]["id"]

    # Edit the user WITHOUT sending a password -> hash must be kept.
    edited = client.put(f"/api/users/{user_id}", json={"name": "Edited Name"})
    assert edited.status_code == 200

    # The original password still works.
    assert _login(client, "editab1e!", "Test1234!").status_code == 200


# ---------------------------------------------------------------------------
# Logout logs the correct event (fixed bug)
# ---------------------------------------------------------------------------


def test_logout_logs_correct_event(client):
    _login(client, ADMIN_NICK, ADMIN_PASSWORD)
    response = client.post("/api/auth/logout")
    assert response.status_code == 200
    assert "access_token" not in response.cookies or response.cookies.get("access_token") is None

    # Re-login to read the audit trail.
    _login(client, ADMIN_NICK, ADMIN_PASSWORD)
    logs = client.get("/api/logs")
    assert logs.status_code == 200
    events = [row["event"] for row in logs.json()["data"]]
    assert "logout" in events


# ---------------------------------------------------------------------------
# Inventory: products, movements, music, dashboard
# ---------------------------------------------------------------------------


def _create_company(client, name="Test Company", rif="12345678"):
    response = client.post("/api/companies", json={"rif": rif, "name": name})
    assert response.status_code == 200, response.text
    return response.json()["data"]["id"]


def _create_product(client, company_id, **overrides):
    payload = {
        "name": "Test Product",
        "description": "A test product",
        "price": 10.0,
        "tax_rate": 16,
        "stock": 0,
        "company_id": company_id,
    }
    payload.update(overrides)
    response = client.post("/api/products", json=payload)
    assert response.status_code == 200, response.text
    return response.json()["data"]["id"]


def test_product_create_and_list(client):
    _login(client, ADMIN_NICK, ADMIN_PASSWORD)
    company_id = _create_company(client, name="Product Company", rif="11112222")
    product_id = _create_product(client, company_id)

    listing = client.get("/api/products")
    assert listing.status_code == 200
    products = listing.json()["data"]
    match = next(p for p in products if p["id"] == product_id)
    assert match["name"] == "Test Product"
    assert match["company_id"] == company_id
    assert match["company_name"] == "Product Company"
    assert match["price"] == 10.0
    assert match["tax_rate"] == 16
    assert match["status"] is True

    # company_id filter works
    filtered = client.get(f"/api/products?company_id={company_id}")
    assert filtered.status_code == 200
    assert all(p["company_id"] == company_id for p in filtered.json()["data"])


def test_purchase_increases_stock_and_creates_movement(client):
    _login(client, ADMIN_NICK, ADMIN_PASSWORD)
    company_id = _create_company(client, name="Purchase Company", rif="22223333")
    product_id = _create_product(client, company_id)

    purchase = client.post(
        "/api/movements/purchase",
        json={
            "product_id": product_id,
            "quantity": 10,
            "unit_price": 5.0,
            "supplier": "ACME Distributor",
        },
    )
    assert purchase.status_code == 200, purchase.text
    movement = purchase.json()["data"]
    assert movement["movement_type"] == "in"
    assert movement["kind"] == "purchase"
    assert movement["quantity"] == 10
    assert movement["tax_rate"] == 16  # snapshot of product.tax_rate
    assert movement["product_name"] == "Test Product"

    listing = client.get("/api/products")
    product = next(p for p in listing.json()["data"] if p["id"] == product_id)
    assert product["stock"] == 10


def test_sale_decreases_stock_and_creates_movement(client):
    _login(client, ADMIN_NICK, ADMIN_PASSWORD)
    company_id = _create_company(client, name="Sale Company", rif="33334444")
    product_id = _create_product(client, company_id, name="Sale Product")

    client.post(
        "/api/movements/purchase",
        json={"product_id": product_id, "quantity": 10, "unit_price": 5.0},
    )
    sale = client.post(
        "/api/movements/sale",
        json={
            "product_id": product_id,
            "quantity": 3,
            "unit_price": 8.0,
            "client": "Walk-in customer",
        },
    )
    assert sale.status_code == 200, sale.text
    movement = sale.json()["data"]
    assert movement["movement_type"] == "out"
    assert movement["kind"] == "sale"
    assert movement["quantity"] == 3

    listing = client.get("/api/products")
    product = next(p for p in listing.json()["data"] if p["id"] == product_id)
    assert product["stock"] == 7


def test_sale_with_insufficient_stock_returns_400(client):
    _login(client, ADMIN_NICK, ADMIN_PASSWORD)
    company_id = _create_company(client, name="NoStock Company", rif="44445555")
    product_id = _create_product(client, company_id, name="Empty Product", stock=0)

    response = client.post(
        "/api/movements/sale",
        json={"product_id": product_id, "quantity": 1, "unit_price": 8.0},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "error.stock_insufficient"


def test_movement_list_returns_entries(client):
    _login(client, ADMIN_NICK, ADMIN_PASSWORD)
    company_id = _create_company(client, name="List Company", rif="55556666")
    product_id = _create_product(client, company_id, name="List Product")
    client.post(
        "/api/movements/purchase",
        json={"product_id": product_id, "quantity": 5, "unit_price": 2.0},
    )

    listing = client.get("/api/movements")
    assert listing.status_code == 200
    movements = listing.json()["data"]
    assert len(movements) >= 1
    newest = movements[0]
    assert newest["product_id"] == product_id
    assert newest["product_name"] == "List Product"
    assert newest["user_nick"] == ADMIN_NICK

    filtered = client.get(f"/api/movements?product_id={product_id}&type=in&kind=purchase")
    assert filtered.status_code == 200
    assert all(m["kind"] == "purchase" for m in filtered.json()["data"])


def test_music_upload_list_delete(client):
    _login(client, ADMIN_NICK, ADMIN_PASSWORD)
    upload = client.post(
        "/api/music",
        data={"title": "My Song"},
        files={"file": ("mysong.mp3", b"fake audio bytes", "audio/mpeg")},
    )
    assert upload.status_code == 200, upload.text
    song = upload.json()["data"]
    assert song["title"] == "My Song"
    assert song["filename"].endswith(".mp3")
    assert song["url"] == f"/music/{song['filename']}"
    stored = os.path.join(os.environ["MUSIC_DIR"], song["filename"])
    assert os.path.exists(stored)

    listing = client.get("/api/music")
    assert listing.status_code == 200
    assert any(s["id"] == song["id"] for s in listing.json()["data"])

    deleted = client.delete(f"/api/music/{song['id']}")
    assert deleted.status_code == 200
    assert not os.path.exists(stored)


def test_music_upload_rejects_bad_extension(client):
    _login(client, ADMIN_NICK, ADMIN_PASSWORD)
    response = client.post(
        "/api/music",
        data={"title": "Bad File"},
        files={"file": ("virus.exe", b"MZ", "application/octet-stream")},
    )
    assert response.status_code == 400


def test_dashboard_returns_counts(client):
    _login(client, ADMIN_NICK, ADMIN_PASSWORD)
    company_id = _create_company(client, name="Dash Company", rif="66667777")
    product_id = _create_product(client, company_id, name="Dash Product")
    client.post(
        "/api/movements/purchase",
        json={"product_id": product_id, "quantity": 3, "unit_price": 5.0},
    )
    client.post(
        "/api/movements/sale",
        json={"product_id": product_id, "quantity": 2, "unit_price": 8.0},
    )

    dashboard = client.get("/api/dashboard")
    assert dashboard.status_code == 200
    data = dashboard.json()["data"]
    assert data["products_count"] >= 1
    assert data["low_stock_count"] >= 1
    assert any(p["id"] == product_id for p in data["low_stock"])  # stock == 1
    assert data["movements_today"] >= 2
    assert data["sales_today"] >= 1
    assert len(data["latest_movements"]) >= 1


def test_menu_includes_inventory_and_media_modules(client):
    _login(client, ADMIN_NICK, ADMIN_PASSWORD)
    response = client.get("/api/menu")
    assert response.status_code == 200
    keys = {
        sub["key"]
        for module in response.json()["data"]
        for sub in module["sub_modules"]
    }
    for key in ("products.view", "movements.view", "music.view", "gallery.view"):
        assert key in keys


# ---------------------------------------------------------------------------
# Password recovery — all 3 steps (step 3 previously never updated the password)
# ---------------------------------------------------------------------------


def test_password_recovery_full_flow(client):
    # Step 1: cedula -> question
    step1 = client.post(
        "/api/auth/recover/step1", json={"cedula": ADMIN_CEDULA}
    )
    assert step1.status_code == 200
    assert step1.json()["data"]["question"] == "What is the name of your first pet"

    # Step 2: answer -> reset token
    step2 = client.post(
        "/api/auth/recover/step2",
        json={"cedula": ADMIN_CEDULA, "answer": "Rex"},
    )
    assert step2.status_code == 200
    reset_token = step2.json()["data"]["reset_token"]
    assert reset_token

    # Wrong answer is rejected.
    bad = client.post(
        "/api/auth/recover/step2",
        json={"cedula": ADMIN_CEDULA, "answer": "wrong"},
    )
    assert bad.status_code == 401

    # Step 3: new password with token -> password actually updated.
    step3 = client.post(
        "/api/auth/recover/step3",
        json={
            "cedula": ADMIN_CEDULA,
            "reset_token": reset_token,
            "new_password": "NewPass123!",
        },
    )
    assert step3.status_code == 200

    # Old password no longer works; the new one does.
    assert _login(client, ADMIN_NICK, ADMIN_PASSWORD).status_code == 401
    assert _login(client, ADMIN_NICK, "NewPass123!").status_code == 200
