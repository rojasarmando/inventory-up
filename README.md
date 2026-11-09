# Inventario Kajataca — Sistema de Inventario para Cervecería

Versión modernizada del proyecto original en PHP (vanilla MVC, jQuery + Bootstrap 4), migrada a **Python 3.14 + FastAPI + Docker** con frontend en **JavaScript vanilla + Bootstrap 5**.

## Badges

![Python 3.14](https://img.shields.io/badge/Python-3.14-3776AB) ![FastAPI](https://img.shields.io/badge/FastAPI-0.141-009688) ![Docker](https://img.shields.io/badge/Docker-✓-2496ED) ![Bootstrap 5](https://img.shields.io/badge/Bootstrap-5.3-7952B3) ![Licencia MIT](https://img.shields.io/badge/Licencia-MIT-green)

## Autor

**Armando Rojas** — Desarrollador

- GitHub: [rojasarmando](https://github.com/rojasarmando)
- LinkedIn: [rojasarmando](https://www.linkedin.com/in/rojasarmando)
- Correo: ✉ armando.develop@gmail.com

## Descripción

**Kajataca** es un sistema de gestión de inventario para cervecería, desarrollado originalmente como proyecto universitario para la materia *Implantación de Sistemas* en la **UNEFA**, extensión Turén, Venezuela (2018). El sistema permite administrar usuarios con roles y permisos, empresas, distribuidoras y una bitácora de auditoría, además de generar reportes en PDF.

Esta versión es una **migración completa** del código original en PHP a un stack moderno:

- Backend en **FastAPI** que sirve tanto las páginas (Jinja2) como la API JSON y los archivos estáticos.
- Base de datos **SQLite** definida mediante modelos **SQLAlchemy 2.0** y gestionada con **migraciones Alembic** (sin volcados SQL).
- Frontend con **JavaScript vanilla** (`fetch()` + modales/toasts nativos de Bootstrap 5). Sin jQuery ni frameworks JS.
- Interfaz **bilingüe** español (idioma predeterminado) / inglés, con un módulo i18n ligero.

Durante la migración se corrigieron errores conocidos del original: la lógica de permisos invertida (un usuario **con** permiso ahora puede acceder; sin permiso recibe 403), la recuperación de contraseña incompleta (ahora el paso 3 **sí actualiza** la contraseña), el evento incorrecto al cerrar sesión (ahora registra `logout`) y el `var_dump` residual en el cambio de estado de distribuidoras.

## Características

- **Autenticación** con sesión JWT en cookie HttpOnly, validación de usuario activo y **recuperación de contraseña en 3 pasos** (cédula → pregunta de seguridad → nueva contraseña con token de corta duración).
- **Usuarios y roles** con asignación de permisos por rol. El rol **Root** (sin filas de permisos) tiene acceso total (superadmin).
- **Menú dinámico** según los permisos del usuario (un usuario ve solo lo que puede usar).
- **Empresas** (CRUD + estado) y **distribuidoras** (CRUD + estado + filtro por empresa).
- **Bitácora de logs** con auditoría de todas las operaciones (evento, usuario, fecha, descripción).
- **Reportes PDF** con fpdf2.
- **Interfaz bilingüe** es/en con persistencia de idioma en `localStorage`.
- **Validación** de formularios en servidor (Pydantic) y espejo en cliente, según las reglas originales de `REGLAS.md`.

## Tecnologías

| Capa | Tecnología |
|------|------------|
| Backend | Python 3.14, FastAPI, Uvicorn |
| ORM | SQLAlchemy 2.0 |
| Migraciones | Alembic |
| Base de datos | SQLite |
| Plantillas | Jinja2 |
| Autenticación | PyJWT (JWT en cookie HttpOnly) |
| Contraseñas | `hashlib.pbkdf2_hmac('sha256', ...)` con salt por usuario |
| Reportes | fpdf2 |
| Frontend | JavaScript vanilla + Bootstrap 5.3 (CDN) |
| Infraestructura | Docker + Docker Compose |

## Requisitos

- **Docker** y **Docker Compose** (recomendado).
- Alternativa sin Docker: **Python 3.12+** y `pip`.

## Cómo ejecutar

### Con Docker (recomendado)

```bash
docker compose up --build
```

Abra <http://localhost:9696>.

Credenciales por defecto:

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `Admin123!` | Root (acceso total) |

> ⚠️ **Importante:** cambie la contraseña del usuario `admin` después del primer ingreso (la contraseña por defecto es solo para desarrollo).

La base de datos SQLite se persiste en el volumen `./data:/data` (archivo `inventory.db`). El esquema y los datos mínimos se crean automáticamente al iniciar mediante **migraciones Alembic** (consulte la sección [Migraciones](#migraciones)).

### Sin Docker (desarrollo local)

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
export DATABASE_URL=sqlite:///./data/inventory.db
uvicorn app.main:app --reload
```

### Ejecutar las pruebas

```bash
pip install -r requirements-dev.txt
pytest tests/ -q
```

## Estructura del proyecto

```
inventory-up/
├── app/
│   ├── main.py               # Aplicación FastAPI: lifespan (migraciones Alembic), rutas, manejadores de error
│   ├── config.py             # Configuración vía variables de entorno (SECRET_KEY, DATABASE_URL, ...)
│   ├── database.py           # Motor SQLAlchemy, SessionLocal, Base y dependencia get_db
│   ├── models.py             # Modelos ORM (users, roles, modules, sub_modules, permissions, companies, distributors, events, logs)
│   ├── schemas.py            # Esquemas Pydantic v2 con validación de REGLAS.md
│   ├── security.py           # hash/verificación PBKDF2-SHA256 y tokens JWT
│   ├── deps.py               # get_current_user, require_permission (lógica corregida) y log_event
│   └── routers/
│       ├── auth.py           # login/logout/me + recuperación de contraseña (3 pasos)
│       ├── users.py          # CRUD de usuarios + cambio de estado
│       ├── companies.py      # CRUD de empresas (empresas) + estado
│       ├── distributors.py   # CRUD de distribuidoras (distribuidora) + estado + select
│       ├── roles.py          # Roles + asignación de permisos
│       ├── logs.py           # Listado de la bitácora
│       ├── reports.py        # Reporte PDF de usuarios (fpdf2)
│       ├── menu.py           # Menú dinámico según permisos
│       └── pages.py          # Rutas de páginas Jinja2 (/, /login, /home, /users, ...)
├── migrations/
│   ├── env.py                # Entorno de Alembic (lee DATABASE_URL de app.config)
│   └── versions/
│       ├── 0001_schema.py    # Esquema inicial (todas las tablas)
│       └── 0002_seed_defaults.py  # Datos mínimos: roles, catálogo de permisos, eventos, admin
├── templates/                # Plantillas Jinja2 (base, login, home, users, companies, ...)
├── static/
│   ├── css/app.css           # Estilos (adaptados del ack.css original, compatibles con Bootstrap 5)
│   ├── js/                   # i18n.js, api.js, auth.js, menu.js, validators.js, users.js, ...
│   └── images/               # Imágenes originales del sistema (logo, banner, galería)
├── tests/test_app.py         # Pruebas de humo (login, permisos, validación, recuperación)
├── alembic.ini               # Configuración de Alembic (script_location, logging)
├── Dockerfile                # Imagen python:3.14-slim + uvicorn
├── docker-compose.yml        # Servicio web en el puerto 9696 con volumen ./data
├── requirements.txt          # Dependencias de producción
├── requirements-dev.txt      # Dependencias de desarrollo (pytest, httpx)
└── README.md
```

## Migraciones

El esquema de la base de datos y los **datos mínimos por defecto** se gestionan con [Alembic](https://alembic.sqlalchemy.org/), no con volcados SQL:

- **`0001_schema.py`** crea todas las tablas (users, roles, modules, sub_modules, permissions, companies, distributors, events, logs) a partir de los modelos ORM de `app/models.py`.
- **`0002_seed_defaults.py`** siembra únicamente los datos mínimos, todos en inglés: los roles `Root` (acceso total, sin filas de permisos) y `Administrator`, el catálogo de permisos (módulos + sub-módulos), los eventos de auditoría y el usuario `admin` (rol `Root`) con su pregunta de seguridad. **No** incluye empresas, distribuidoras ni usuarios de demostración.

Las migraciones se aplican **automáticamente al iniciar la aplicación** (en el `lifespan` de FastAPI, antes de atender peticiones). También pueden ejecutarse manualmente desde la raíz del repositorio:

```bash
alembic upgrade head
```

La URL de la base de datos se lee de `DATABASE_URL` (la misma que usa la aplicación), por lo que la línea de comandos, el `lifespan` y Docker migran siempre la misma base.

## API

Todos los endpoints responden con `{ok: true, data}` en éxito y `{ok: false, detail}` en error (el `detail` es una clave i18n que el frontend traduce al idioma activo).

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Inicia sesión (cookie HttpOnly `access_token`) |
| POST | `/api/auth/logout` | Cierra sesión y registra el evento `logout` |
| GET | `/api/auth/me` | Usuario actual + claves de permiso |
| POST | `/api/auth/recover/step1` | Paso 1: cédula → pregunta de seguridad |
| POST | `/api/auth/recover/step2` | Paso 2: respuesta → token de reinicio (≈15 min) |
| POST | `/api/auth/recover/step3` | Paso 3: nueva contraseña + token → actualiza contraseña |
| GET | `/api/users` | Lista usuarios (`?role_id=&status=`) |
| POST | `/api/users` | Crea usuario |
| PUT | `/api/users/{id}` | Actualiza usuario |
| DELETE | `/api/users/{id}` | Elimina usuario |
| PATCH | `/api/users/{id}/status` | Cambia estado del usuario |
| GET | `/api/roles` | Lista roles (para selectores) |
| GET | `/api/roles/{id}/permissions` | Permisos actuales de un rol |
| PUT | `/api/roles/{id}/permissions` | Asigna permisos a un rol |
| GET | `/api/companies` | Lista empresas |
| POST | `/api/companies` | Crea empresa |
| PUT | `/api/companies/{id}` | Actualiza empresa |
| DELETE | `/api/companies/{id}` | Elimina empresa |
| PATCH | `/api/companies/{id}/status` | Cambia estado de la empresa |
| GET | `/api/distributors` | Lista distribuidoras (`?company_id=`) |
| GET | `/api/distributors/select` | Distribuidoras activas para selectores |
| POST | `/api/distributors` | Crea distribuidora |
| PUT | `/api/distributors/{id}` | Actualiza distribuidora |
| DELETE | `/api/distributors/{id}` | Elimina distribuidora |
| PATCH | `/api/distributors/{id}/status` | Cambia estado de la distribuidora |
| GET | `/api/logs` | Bitácora (usuario, evento, fecha, descripción) |
| GET | `/api/menu` | Menú filtrado por permisos del usuario |
| GET | `/api/reports/users` | Reporte PDF de usuarios |

## Reglas de validación

Reglas originales de `REGLAS.md`, ahora aplicadas **en el servidor** (Pydantic) y espejadas en el cliente:

| Campo | Regla |
|-------|-------|
| Nombre | 3–40 caracteres, solo letras (espacios y acentos permitidos) |
| Nick | 8–12 caracteres, letras y números, al menos 1 carácter especial, 1 letra y 1 número |
| Contraseña | 8–12 caracteres, al menos 1 carácter especial, 1 letra y 1 número |
| Cédula | 7–8 dígitos |
| RIF | 7–12 dígitos |
| Teléfono | 11 dígitos |
| Pregunta de seguridad | 6–50 caracteres, letras y números |

**Unicidad** (se rechazan duplicados): nick, cédula, RIF y teléfono.

Las contraseñas y respuestas de seguridad se almacenan con **PBKDF2-HMAC-SHA256** y salt aleatorio por usuario (formato `pbkdf2_sha256$iteraciones$salt$hash`). No se usa MD5.

## Licencia

Proyecto distribuido bajo la **Licencia MIT**. Consulte el archivo [LICENSE](LICENSE) para más detalles.
