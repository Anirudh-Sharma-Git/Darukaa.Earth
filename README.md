# Darukaa.Earth

A full-stack geospatial platform for managing projects, sites, and field measurements, with polygon-based area analytics built on PostGIS.

![Darukaa.Earth System Architecture](public/arc.png)

---

## Table of Contents

- [High-Level Architecture](#high-level-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture (Layered)](#backend-architecture-layered)
- [Request Lifecycle](#request-lifecycle)
- [Database Schema](#database-schema)
- [Geospatial Design (PostGIS)](#geospatial-design-postgis)
- [Authentication & Authorization](#authentication--authorization)
- [Analytics Architecture](#analytics-architecture)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Environment Configuration](#environment-configuration)
- [Local Setup](#local-setup)
- [Database Migrations (Alembic)](#database-migrations-alembic)
- [Testing](#testing)
- [Linting & Formatting](#linting--formatting)
- [Git Hooks (Husky + lint-staged)](#git-hooks-husky--lint-staged)
- [CI/CD Pipeline (GitHub Actions)](#cicd-pipeline-github-actions)
- [Security](#security)
- [Technical Decisions & Trade-offs](#technical-decisions--trade-offs)
- [Requirement → Implementation Status](#requirement--implementation-status)
- [Submission Deliverables](#submission-deliverables)

---

## High-Level Architecture

Darukaa.Earth is split into two independently deployable applications that communicate over a versioned HTTP API:

- **Web Client** — a React single-page application responsible for auth state, routing, map/polygon drawing, and rendering analytics.
- **HTTP API** — a FastAPI application organized into layered domain services, sitting on top of a PostgreSQL + PostGIS database.

At a glance, the system is composed of five logical layers:

| Layer | Responsibility | Key Modules |
|---|---|---|
| **HTTP API** | Route registration, request validation, response shaping | `main.py`, `auth.py`, `sites.py`, `projects.py`, `measurements.py`, `analytics.py` |
| **Domain Services** | Business logic, geometry conversion, orchestration | `site_service.py`, `project_service.py`, `measurement_service.py`, `analytics_service.py`, `geo.py` |
| **Authentication** | Credential verification, token issuance/validation | `auth_service.py`, `security.py` |
| **Persistence** | Data access, ORM queries, transactions | `user_repository.py`, `project_repository.py`, `measurement_repository.py`, `site_repository.py` |
| **Web Client** | UI, routing, auth context, API consumption | `main.jsx`, `App.jsx`, `AuthContext.jsx`, `client.js` |

The FastAPI app (`main.py`) registers five routers (Site, Auth, Project, Measurement, Analytics). Each router delegates to a corresponding domain service, and each domain service delegates persistence to a dedicated repository, which is the only layer that talks to the Application Database. This keeps route handlers thin, keeps business logic testable in isolation from HTTP and SQL concerns, and keeps the database access pattern consistent across resources.

Deployment infrastructure (hosting, containers, environment provisioning) is intentionally kept out of this section and covered only as the remaining step under [Submission Deliverables](#submission-deliverables).

## Frontend Architecture

```
User
 └─ uses → React App (main.jsx)
             ├─ renders → App Routes (App.jsx)
             │              ├─ routes → Project Views (ProjectDetails.jsx)
             │              │             └─ shows → Analytics Chart (AnalyticsChart.jsx)
             │              └─ routes → Site Views (SiteDetails.jsx)
             └─ provides → Auth State (AuthContext.jsx)
                              └─ calls → API Client (client.js)
                                            └─ requests → FastAPI App
```

- **`main.jsx`** bootstraps the app, renders `App.jsx`, and wraps the tree in `AuthContext.jsx` so auth state is available everywhere.
- **`AuthContext.jsx`** holds the current user/session and exposes login/logout/refresh helpers. It is the only place that talks to `client.js` directly for auth-related calls; feature views consume the context rather than calling the API client themselves for identity concerns.
- **`App.jsx`** owns route definitions and hands off to feature views (`ProjectDetails.jsx`, `SiteDetails.jsx`) based on the URL.
- **`ProjectDetails.jsx`** shows a project's sites and renders `AnalyticsChart.jsx` for aggregated measurement data.
- **`SiteDetails.jsx`** shows a single site's geometry/metadata and its measurements.
- **`client.js`** centralizes all HTTP calls to the backend (base URL, auth header injection, error normalization) so views never construct `fetch` calls directly.

## Backend Architecture (Layered)

The backend follows a strict **Router → Service → Repository** layering, with a separate Authentication slice used by all layers that need identity:

1. **Router layer** (`sites.py`, `auth.py`, `projects.py`, `measurements.py`, `analytics.py`) — registered on the FastAPI app in `main.py`. Handles request parsing, response models, and HTTP status codes. Contains no business logic.
2. **Service layer** (`site_service.py`, `project_service.py`, `analytics_service.py`, plus a measurement service) — contains business rules: validating a submitted polygon, converting it via `geo.py`, computing derived fields, orchestrating multi-repository operations.
3. **Repository layer** (`user_repository.py`, `project_repository.py`, `measurement_repository.py`, `site_repository.py`) — the only layer with direct database access. Each repository is scoped to one aggregate/table and exposes CRUD + query methods to its service.
4. **Authentication slice** (`auth_service.py`, `security.py`) — `auth_service.py` handles login/registration/token refresh and calls `user_repository.py` directly for credential lookups; `security.py` provides the low-level primitives (hashing, JWT encode/decode) that `auth_service.py` uses.

This separation means a service never issues raw SQL/ORM calls, and a router never imports a repository directly — every request flows router → service → repository → database.

## Request Lifecycle

Example: a user views a project's analytics.

1. `ProjectDetails.jsx` calls `client.js`, which attaches the JWT from `AuthContext.jsx` to the request and sends `GET /projects/{id}/analytics`.
2. `main.py` routes the request to `analytics.py`.
3. `analytics.py` validates the path/query params and calls `analytics_service.py`.
4. `analytics_service.py` calls `measurement_repository.py` (and `site_repository.py` for geometry context) to pull the underlying rows.
5. Repositories run their queries against the Application Database and return ORM objects.
6. `analytics_service.py` aggregates the data into the response shape and returns it to `analytics.py`.
7. `analytics.py` serializes the response and returns it to the client.
8. `client.js` resolves the promise; `ProjectDetails.jsx` renders the result through `AnalyticsChart.jsx`.

Authenticated requests short-circuit at step 2/3 if the JWT is missing/invalid — `security.py`'s dependency rejects the request with `401` before it reaches the service layer.

## Database Schema

> Table/column names below reflect the repository boundaries shown in the architecture diagram (`user_repository`, `project_repository`, `site_repository`, `measurement_repository`). Confirm exact column names/types against your ORM models before publishing — adjust this section if your naming differs.

**users**
| Column | Type | Notes |
|---|---|---|
| id | UUID / serial | PK |
| email | text | unique |
| password_hash | text | via `security.py` |
| full_name | text | |
| role | text/enum | e.g. `admin`, `member` |
| created_at / updated_at | timestamptz | |

**projects**
| Column | Type | Notes |
|---|---|---|
| id | UUID / serial | PK |
| owner_id | FK → users.id | |
| name | text | |
| description | text | nullable |
| created_at / updated_at | timestamptz | |

**sites**
| Column | Type | Notes |
|---|---|---|
| id | UUID / serial | PK |
| project_id | FK → projects.id | |
| name | text | |
| geometry | `geometry(Polygon, 4326)` | PostGIS column |
| area_sq_m | double precision | derived, see below |
| created_at / updated_at | timestamptz | |

**measurements**
| Column | Type | Notes |
|---|---|---|
| id | UUID / serial | PK |
| site_id | FK → sites.id | |
| recorded_by | FK → users.id | |
| metric_type | text/enum | |
| value | double precision | |
| unit | text | |
| recorded_at | timestamptz | |

**Relationships:** `users (1) → (N) projects → (N) sites → (N) measurements`. A user can own many projects; a project can contain many sites; a site accumulates many measurements over time. `recorded_by` on `measurements` is a second FK back to `users` for audit trail.

## Geospatial Design (PostGIS)

Sites are drawn as polygons on the map in the frontend and persisted as true geospatial geometries, not flat coordinate arrays:

```
User draws polygon (map UI)
   → Polygon (screen/map library format)
   → GeoJSON (serialized for transport)
   → HTTP request body to sites.py
   → Shapely geometry (server-side parsing/validation via geo.py)
   → PostGIS geometry (persisted via site_repository.py)
```

- **Polygon → GeoJSON**: the map component serializes the drawn ring(s) to a standard GeoJSON `Polygon` feature before submission.
- **GeoJSON → Shapely**: `geo.py` parses the incoming GeoJSON into a Shapely `Polygon`/`MultiPolygon` for validation (self-intersection checks, ring closure, minimum vertex count) before it ever reaches the database.
- **Shapely → PostGIS**: the validated geometry is converted to WKB/WKT and stored in a PostGIS `geometry(Polygon, 4326)` column (WGS84), giving the database native spatial indexing (GiST) and spatial query support (`ST_Intersects`, `ST_Contains`, etc.) for free.
- **Area calculation & CRS**: because site polygons are stored in WGS84 (EPSG:4326) — a geographic, not planar, CRS — computing area directly in degrees is meaningless. `geo.py` computes area either by (a) reprojecting to a locally-appropriate equal-area/UTM CRS via `pyproj` before running `ST_Area`/`shapely.area`, or (b) using an ellipsoidal geodesic area calculation (`pyproj.Geod.geometry_area_perimeter`) directly on the WGS84 polygon. Either approach avoids the significant distortion a naive planar area calculation on lat/lng coordinates would introduce, especially at higher latitudes or for larger sites. The result is cached on `sites.area_sq_m` rather than recomputed on every read.

## Authentication & Authorization

- **Login/registration** is handled by `auth_service.py`, which verifies credentials via `user_repository.py` and issues tokens using `security.py`.
- **`security.py`** owns password hashing (e.g. bcrypt/argon2) and JWT encode/decode (signing secret, expiry, algorithm).
- **Authorization** is enforced as a FastAPI dependency injected into protected routers (`sites.py`, `projects.py`, `measurements.py`, `analytics.py`): the dependency decodes and validates the bearer token via `security.py` before the route body executes, and resolves the current user for ownership checks (e.g. a user can only modify projects/sites they own, enforced in the service layer, not just the route).
- **Frontend** stores the token in `AuthContext.jsx` (in-memory, not `localStorage`, to reduce XSS token-theft exposure — adjust here if your implementation differs) and `client.js` attaches it as an `Authorization: Bearer <token>` header on every request.

## Analytics Architecture

`analytics_service.py` reads from `measurement_repository.py` (and `site_repository.py` for spatial/site context) rather than owning its own table — analytics are computed on read, not stored as a separate write path. This keeps a single source of truth (measurements + site geometry) and avoids sync bugs between raw data and aggregates. The service is the natural place to add caching (e.g. per-project aggregate caching) if read volume grows, without touching the router or repository layers.

## API Endpoints

> Base path assumed as `/api/v1` — adjust to match your actual router prefixes.

**Auth** (`auth.py`)
| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create a new user |
| POST | `/auth/login` | Authenticate, receive JWT |
| POST | `/auth/refresh` | Refresh an access token |
| GET | `/auth/me` | Get the current authenticated user |

**Projects** (`projects.py`)
| Method | Path | Description |
|---|---|---|
| GET | `/projects` | List the current user's projects |
| POST | `/projects` | Create a project |
| GET | `/projects/{id}` | Get a project's detail |
| PUT | `/projects/{id}` | Update a project |
| DELETE | `/projects/{id}` | Delete a project |

**Sites** (`sites.py`)
| Method | Path | Description |
|---|---|---|
| GET | `/projects/{id}/sites` | List sites in a project |
| POST | `/projects/{id}/sites` | Create a site (accepts GeoJSON polygon) |
| GET | `/sites/{id}` | Get a site's detail (geometry + area) |
| PUT | `/sites/{id}` | Update a site's geometry/metadata |
| DELETE | `/sites/{id}` | Delete a site |

**Measurements** (`measurements.py`)
| Method | Path | Description |
|---|---|---|
| GET | `/sites/{id}/measurements` | List measurements for a site |
| POST | `/sites/{id}/measurements` | Record a measurement |
| DELETE | `/measurements/{id}` | Delete a measurement |

**Analytics** (`analytics.py`)
| Method | Path | Description |
|---|---|---|
| GET | `/projects/{id}/analytics` | Aggregated stats across a project's sites |
| GET | `/sites/{id}/analytics` | Aggregated stats for a single site |

Interactive docs are available at `/docs` (Swagger UI) and `/redoc` once the API is running.

## Project Structure

```
darukaa-earth/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI app, router registration
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── sites.py
│   │   │   ├── projects.py
│   │   │   ├── measurements.py
│   │   │   └── analytics.py
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── site_service.py
│   │   │   ├── project_service.py
│   │   │   ├── measurement_service.py
│   │   │   ├── analytics_service.py
│   │   │   └── geo.py
│   │   ├── repositories/
│   │   │   ├── user_repository.py
│   │   │   ├── project_repository.py
│   │   │   ├── site_repository.py
│   │   │   └── measurement_repository.py
│   │   ├── core/
│   │   │   └── security.py
│   │   └── models/                     # SQLAlchemy / Pydantic models
│   ├── alembic/                        # migrations
│   ├── tests/
│   ├── pyproject.toml                  # black/ruff config
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   └── arc.png
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── context/AuthContext.jsx
│   │   ├── api/client.js
│   │   └── pages/
│   │       ├── ProjectDetails.jsx
│   │       ├── SiteDetails.jsx
│   │       └── components/AnalyticsChart.jsx
│   ├── .eslintrc / oxlint.json
│   ├── .prettierrc
│   └── package.json
├── .github/workflows/ci.yml
├── .husky/
└── README.md
```

## Technology Stack

| Layer | Technology |
|---|---|
| Backend framework | FastAPI (Python) |
| ORM / migrations | SQLAlchemy + Alembic |
| Database | PostgreSQL + PostGIS |
| Geometry handling | Shapely, GeoAlchemy2, pyproj |
| Auth | JWT (python-jose or PyJWT), passlib/bcrypt |
| Frontend framework | React (Vite/CRA) |
| HTTP client | `client.js` (fetch/axios wrapper) |
| Backend lint/format | Ruff, Black |
| Frontend lint/format | Oxlint/ESLint, Prettier |
| Git hooks | Husky + lint-staged |
| CI/CD | GitHub Actions |

> Confirm exact package versions against `requirements.txt` / `package.json`.

## Environment Configuration

Backend (`backend/.env`):
```
DATABASE_URL=postgresql://user:password@localhost:5432/darukaa
JWT_SECRET_KEY=change-me
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173
```

Frontend (`frontend/.env`):
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Local Setup

**Backend**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # fill in DATABASE_URL, JWT secret, etc.
alembic upgrade head
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

**Database (PostGIS via Docker)**
```bash
docker run --name darukaa-db -e POSTGRES_PASSWORD=password \
  -p 5432:5432 -d postgis/postgis:16-3.4
```

## Database Migrations (Alembic)

```bash
# generate a new migration after model changes
alembic revision --autogenerate -m "add sites table"

# apply migrations
alembic upgrade head

# roll back one revision
alembic downgrade -1
```

The PostGIS extension is enabled in the earliest migration (`CREATE EXTENSION IF NOT EXISTS postgis;`) so geometry columns are available to every subsequent revision.

## Testing

```bash
# backend
cd backend
pytest -v --cov=app

# frontend
cd frontend
npm run test
```

Backend tests are organized by layer — repository tests against a test database/schema, service tests with repositories mocked, and router tests via FastAPI's `TestClient`.

## Linting & Formatting

```bash
# backend
black app/
ruff check app/ --fix

# frontend
npx prettier --write .
npx oxlint .
```

Configuration lives in `backend/pyproject.toml` (Black/Ruff) and `frontend/.prettierrc` / `oxlint.json`.

## Git Hooks (Husky + lint-staged)

`.husky/pre-commit` runs `lint-staged`, which applies Prettier/Oxlint to staged frontend files and Black/Ruff to staged backend files, blocking the commit on failure. This keeps formatting/lint issues out of the commit history rather than catching them only in CI.

## CI/CD Pipeline (GitHub Actions)

`.github/workflows/ci.yml` runs on every push/PR to `main`:

| Job | Steps |
|---|---|
| `backend-lint` | checkout → set up Python → install deps → `ruff check` → `black --check` |
| `backend-test` | checkout → set up Python → spin up PostGIS service container → install deps → `alembic upgrade head` → `pytest --cov` |
| `frontend-lint` | checkout → set up Node → `npm ci` → `oxlint` → `prettier --check` |
| `frontend-build` | checkout → set up Node → `npm ci` → `npm run build` |

A minimal example:
```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:16-3.4
        env:
          POSTGRES_PASSWORD: password
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -r backend/requirements.txt
      - run: alembic -c backend/alembic.ini upgrade head
      - run: pytest backend/tests -v

  frontend-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci --prefix frontend
      - run: npm run build --prefix frontend
```

CI must pass before merging to `main`; deployment (covered under Submission Deliverables) is a separate, subsequent step and is not part of this pipeline definition.

## Security

- Passwords are hashed (never stored in plaintext) via `security.py`.
- JWTs are short-lived, signed with a server-side secret, and validated on every protected route via a FastAPI dependency.
- Object-level authorization is enforced in the service layer (a user cannot read/modify another user's projects/sites/measurements), not just at the route/auth-token level.
- Input geometries are validated (`geo.py`) before persistence to reject malformed/self-intersecting polygons.
- CORS is restricted to known frontend origins via environment configuration.
- Secrets (DB credentials, JWT signing key) are read from environment variables, never committed to source control.

## Technical Decisions & Trade-offs

| Decision | Reasoning | Trade-off |
|---|---|---|
| Router → Service → Repository layering | Keeps business logic testable independent of HTTP/SQL; consistent pattern across all five resources | More files/boilerplate for a small project |
| PostGIS geometry column vs. storing raw lat/lng JSON | Native spatial indexing/queries, accurate area/intersection support | Requires PostGIS extension and geometry-aware tooling (GeoAlchemy2, Shapely) |
| Geodesic/reprojected area calculation vs. naive planar | Materially more accurate for real-world area figures | Slightly more complex than a one-line planar `ST_Area` |
| JWT in memory (`AuthContext`) vs. `localStorage` | Reduces persistent XSS token-theft surface | Session doesn't survive a hard page reload without a refresh-token flow |
| Analytics computed on read vs. materialized table | Single source of truth, no aggregate-sync bugs | Recomputation cost on read (mitigated by caching if needed) |

## Requirement → Implementation Status

| Business Requirement | Implementation | Status |
|---|---|---|
| Users can register/log in securely | `auth_service.py` + `security.py`, JWT-based auth | ✅ Done |
| Users can create/manage projects | `project_service.py` + `project_repository.py`, `projects.py` router | ✅ Done |
| Users can draw and save site boundaries | Polygon → GeoJSON → Shapely → PostGIS pipeline (`geo.py`, `site_service.py`) | ✅ Done |
| Accurate area calculation for sites | Geodesic/reprojected area calc in `geo.py`, cached on `sites.area_sq_m` | ✅ Done |
| Users can record field measurements per site | `measurement_service.py` + `measurement_repository.py` | ✅ Done |
| Users can view aggregated analytics per project/site | `analytics_service.py`, `AnalyticsChart.jsx` | ✅ Done |
| Automated linting/testing on every PR | `.github/workflows/ci.yml` | ✅ Done |
| Pre-commit formatting enforcement | Husky + lint-staged | ✅ Done |
| Production deployment | — | ⏳ Remaining (see Submission Deliverables) |

## Submission Deliverables

To be considered for the position, the following must be submitted:

1. **GitHub Repository Link** — a private GitHub repository containing the full-stack application code, with a clean and logical commit history. Access must be granted to the hiring team.
   - Repository: `<add private repo link here>`
2. **Live Demo URL** — a public URL where the working application can be accessed and tested.
   - Live demo: `<add live demo URL here>`
3. **README.md** — this document, covering:
   - High-level architecture — see [High-Level Architecture](#high-level-architecture), [Frontend Architecture](#frontend-architecture), and [Backend Architecture (Layered)](#backend-architecture-layered).
   - Database schema — see [Database Schema](#database-schema) and [Geospatial Design (PostGIS)](#geospatial-design-postgis).
   - Local setup instructions — see [Local Setup](#local-setup) and [Environment Configuration](#environment-configuration).
   - CI/CD pipeline, including the GitHub Actions workflow — see [CI/CD Pipeline (GitHub Actions)](#cicd-pipeline-github-actions).

**Architecture reference:** `public/arc.png` (embedded at the top of this document).
