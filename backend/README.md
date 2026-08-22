# Dayflow HRMS — Backend

Human Resource Management System built with Django REST Framework.

## Tech Stack

- **Python** 3.12+ / **Django** 5.1
- **Django REST Framework** 3.15+
- **PostgreSQL** (production) / **SQLite** (development)
- **SimpleJWT** for authentication
- **Celery** + **Redis** for async tasks
- **drf-spectacular** for OpenAPI docs

## Quick Start (Development)

```bash
# 1. Create virtual environment
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create .env from example
cp .env.example .env
# Edit .env if needed (defaults work for local dev with SQLite)

# 4. Run migrations
python manage.py migrate

# 5. Create a superuser (optional — for Django admin)
python manage.py createsuperuser

# 6. Start the development server
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/v1/`.

## API Documentation

Once the server is running:

- **Swagger UI**: [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)
- **ReDoc**: [http://localhost:8000/api/redoc/](http://localhost:8000/api/redoc/)
- **Raw Schema**: [http://localhost:8000/api/schema/](http://localhost:8000/api/schema/)

## Getting Started — Typical Flow

```
1. POST /api/v1/auth/register-organization/   → Creates org + admin account
2. POST /api/v1/auth/verify-email/             → Verify email (token from email)
3. POST /api/v1/auth/login/                    → Get JWT tokens
4. POST /api/v1/employees/invite/              → HR/Admin invites employees
5. POST /api/v1/auth/accept-invitation/        → Employee accepts, sets password
```

## API Endpoints

### Authentication (`/api/v1/auth/`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register-organization/` | Public | Register org + admin |
| POST | `/login/` | Public | Login → JWT tokens |
| POST | `/logout/` | Bearer | Blacklist refresh token |
| POST | `/refresh/` | Public | Refresh access token |
| POST | `/verify-email/` | Public | Verify email with token |
| POST | `/forgot-password/` | Public | Request password reset |
| POST | `/reset-password/` | Public | Reset password with token |
| POST | `/accept-invitation/` | Public | Accept employee invitation |
| GET | `/me/` | Bearer | Current user profile |
| PATCH | `/me/` | Bearer | Update own profile |

### Organizations (`/api/v1/organizations/`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Bearer | List (user's org only) |
| GET | `/{id}/` | Bearer | Retrieve |
| PATCH | `/{id}/` | Admin | Update org details |

### Employees (`/api/v1/employees/`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Bearer + OrgMember | List (org-scoped, filterable) |
| POST | `/` | HR/Admin | Create employee |
| GET | `/{id}/` | Bearer + Self/HR/Admin | Retrieve |
| PATCH | `/{id}/` | HR/Admin | Update employee |
| DELETE | `/{id}/` | HR/Admin | Soft-delete (terminates) |
| GET | `/me/` | Bearer | Own employee profile |
| PATCH | `/me/` | Bearer | Self-update (restricted fields) |
| POST | `/invite/` | HR/Admin | Invite employee via email |

### Departments (`/api/v1/departments/`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Bearer + OrgMember | List |
| POST | `/` | HR/Admin | Create |
| PATCH | `/{id}/` | HR/Admin | Update |
| DELETE | `/{id}/` | HR/Admin | Delete |

### Designations (`/api/v1/designations/`)
Same pattern as Departments.

### Attendance (`/api/v1/attendance/`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/check-in/` | Bearer | Record check-in |
| POST | `/check-out/` | Bearer | Record check-out |
| GET | `/records/` | Bearer | List attendance records |
| GET | `/corrections/` | Bearer | List corrections |
| POST | `/corrections/` | Bearer | Request correction |
| PATCH | `/corrections/{id}/approve/` | HR/Admin | Approve correction |
| PATCH | `/corrections/{id}/reject/` | HR/Admin | Reject correction |

### Leave (`/api/v1/leave/`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/types/` | Bearer | List leave types |
| POST | `/types/` | HR/Admin | Create leave type |
| GET | `/balance/` | Bearer | View leave balance |
| GET | `/requests/` | Bearer | List leave requests |
| POST | `/requests/` | Bearer | Create leave request |
| PATCH | `/requests/{id}/approve/` | HR/Admin | Approve |
| PATCH | `/requests/{id}/reject/` | HR/Admin | Reject |
| PATCH | `/requests/{id}/cancel/` | Bearer (own) | Cancel |

### Payroll (`/api/v1/payroll/`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/structures/` | HR/Admin | List salary structures |
| POST | `/structures/` | HR/Admin | Create structure |
| GET | `/salary/` | Bearer | View salary (own or all) |
| POST | `/salary/` | HR/Admin | Assign salary |
| PATCH | `/salary/{id}/` | HR/Admin | Update salary |
| GET | `/payslips/` | Bearer | List payslips |

### Notifications (`/api/v1/notifications/`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Bearer | List notifications |
| PATCH | `/{id}/read/` | Bearer | Mark as read |
| PATCH | `/read-all/` | Bearer | Mark all as read |

## Roles

| Role | Capabilities |
|------|-------------|
| **ADMIN** | Full access within their organization |
| **HR** | Manage employees, approve leave, manage salary |
| **EMPLOYEE** | View own data, self-update personal info, apply for leave, check in/out |

## Running Tests

```bash
# Activate virtualenv first, then:
pytest -v

# With coverage:
pytest --cov=apps --cov=common -v
```

## Project Structure

```
backend/
├── config/              # Django settings, URLs, WSGI/ASGI, Celery
├── common/              # Shared: BaseModel, permissions, mixins, validators, pagination
├── apps/
│   ├── accounts/        # Custom User, auth tokens, auth views
│   ├── organizations/   # Organization model + views
│   ├── employees/       # Employee, Department, Designation, Documents, Invitations
│   ├── attendance/      # AttendanceRecord, AttendanceCorrection
│   ├── leave/           # LeaveType, LeaveBalance, LeaveRequest, ApprovalRequest
│   ├── payroll/         # SalaryStructure, SalaryComponent, EmployeeSalary, Payslip
│   ├── notifications/   # Notification model + views
│   ├── audit/           # Immutable AuditLog
│   └── reports/         # Report endpoints (placeholder)
└── tests/               # pytest test suite
```

## Environment Variables

See `.env.example` for all available settings. Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | dev default |
| `DEBUG` | Debug mode | `True` |
| `DB_NAME` | Database name | `dayflow` |
| `DJANGO_SETTINGS_MODULE` | Settings module | `config.settings.development` |
| `REDIS_URL` | Redis connection | `redis://localhost:6379/0` |
| `FRONTEND_URL` | Frontend URL for email links | `http://localhost:5173` |

## Docker (Production)

```bash
docker-compose up -d
```

This starts PostgreSQL, Redis, Django, and Celery worker/beat.
