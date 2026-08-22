# Dayflow HRMS — Backend

Production-quality Django backend for Dayflow, a Human Resource Management System.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Language | Python 3.12+ |
| Framework | Django 5.1 + Django REST Framework |
| Database | PostgreSQL 16 |
| Cache/Broker | Redis 7 |
| Task Queue | Celery 5.x |
| Auth | JWT (SimpleJWT) |
| Docs | OpenAPI 3.0 (drf-spectacular) |

## Quick Start

### 1. Clone and setup

```bash
cd backend
cp .env.example .env
```

### 2. Create virtual environment

```bash
python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Start PostgreSQL and Redis

```bash
# Option A: Docker (recommended)
docker-compose up db redis -d

# Option B: Local installations
# Ensure PostgreSQL is running on localhost:5432
# Ensure Redis is running on localhost:6379
```

### 5. Run migrations

```bash
python manage.py migrate
```

### 6. Create superuser (optional)

```bash
python manage.py createsuperuser
```

### 7. Run development server

```bash
python manage.py runserver
```

### 8. Access

- **API**: http://localhost:8000/api/v1/
- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **Admin**: http://localhost:8000/admin/

## Docker Setup

```bash
# Start all services (backend + PG + Redis + Celery)
docker-compose up

# Start only infrastructure
docker-compose up db redis -d
```

## Running Tests

```bash
# Run all tests (uses SQLite, no PG required)
python -m pytest tests/ -v

# Run specific test file
python -m pytest tests/test_auth.py -v

# Run with coverage
python -m pytest tests/ --cov=apps --cov-report=term
```

## Project Structure

```
backend/
├── config/                  # Django project configuration
│   ├── settings/            # Environment-specific settings
│   ├── urls.py              # Root URL routing (/api/v1/)
│   ├── celery.py            # Celery configuration
│   └── wsgi.py / asgi.py
│
├── apps/
│   ├── accounts/            # Custom User model, auth endpoints
│   ├── organizations/       # Organization model & API
│   ├── employees/           # Employee, Department, Designation, Documents, History
│   ├── audit/               # Immutable audit log
│   ├── notifications/       # Notification model & API
│   ├── attendance/          # Attendance models (contracts for integration)
│   ├── leave/               # Leave models + approval architecture (contracts)
│   ├── payroll/             # Salary & payslip models (contracts)
│   └── reports/             # Report endpoint contracts
│
├── common/                  # Shared utilities
│   ├── permissions.py       # IsAdmin, IsHR, IsHROrAdmin, etc.
│   ├── pagination.py        # Standard pagination (20/page, max 100)
│   ├── exceptions.py        # Consistent {success, message, errors} format
│   ├── mixins.py            # OrganizationScopedQuerySetMixin
│   ├── models.py            # BaseModel (UUID pk + timestamps)
│   ├── validators.py        # File size/type validators
│   └── storage.py           # Storage path generators (S3-ready)
│
├── tests/                   # Automated test suite
├── docker-compose.yml       # Docker services
├── Dockerfile               # Backend container
├── requirements.txt         # Python dependencies
└── .env.example             # Environment variable template
```

## API Versioning

All endpoints are under `/api/v1/`. See the full API contracts in `docs/api_contracts.md`.

## Environment Variables

See `.env.example` for all required configuration. Key variables:

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Django secret key |
| `DATABASE_URL` | PostgreSQL connection |
| `REDIS_URL` | Redis connection |
| `FRONTEND_URL` | Frontend URL for email links |
| `EMAIL_BACKEND` | Email backend class |

## Architecture Decisions

- **UUID primary keys** on all models for security and consistency
- **Employee ID** auto-generated as `{ORG_CODE}-{YEAR}-{SEQUENCE}` (not tied to names)
- **Organization isolation** via `OrganizationScopedQuerySetMixin` on all org-scoped views
- **Soft-delete** for employees (status → TERMINATED, user deactivated)
- **Immutable audit logs** — append-only, no update/delete
- **Hashed tokens** — email verification and password reset tokens are SHA-256 hashed before storage
- **JWT authentication** — 30min access / 7-day refresh, token blacklisting for logout

## For Other Team Members

### Frontend Developer
- Open Swagger UI at `/api/docs/` for all endpoint documentation
- Auth: send `Authorization: Bearer <access_token>` header
- All errors return `{success: false, message: "...", errors: {...}}`
- Pagination: `?page=1&page_size=20`

### Attendance Module Developer
- Models are in `apps/attendance/models.py` — ready to use
- Add views/serializers in the same app
- Use `OrganizationScopedQuerySetMixin` for org isolation
- Use `create_audit_log()` from `apps.audit.utils` for sensitive actions

### Leave/Payroll Module Developer
- Models are in `apps/leave/models.py` and `apps/payroll/models.py`
- Generic `ApprovalRequest` / `ApprovalStep` models support multi-level approval
- Use `common.permissions` classes for access control
