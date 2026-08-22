# Dayflow HRMS — API Contracts

All endpoints use the base URL: `/api/v1/`

## Response Format

### Success
```json
{
  "success": true,
  "message": "Operation successful.",
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": {
    "email": ["A valid email is required."]
  }
}
```

### Paginated List
```json
{
  "count": 42,
  "next": "http://localhost:8000/api/v1/employees/?page=2",
  "previous": null,
  "results": [ ... ]
}
```

---

## Authentication

### Register Organization
```
POST /api/v1/auth/register-organization/
```
**Auth**: None

**Request**:
```json
{
  "organization_name": "Acme Corp",
  "organization_code": "ACME",
  "organization_email": "contact@acme.com",
  "organization_phone": "+1234567890",
  "timezone": "UTC",
  "email": "admin@acme.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Organization registered successfully. Please verify your email.",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@acme.com",
      "first_name": "Jane",
      "last_name": "Smith"
    },
    "organization": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "name": "Acme Corp",
      "organization_code": "ACME"
    },
    "tokens": {
      "access": "eyJ...",
      "refresh": "eyJ..."
    }
  }
}
```

---

### Login
```
POST /api/v1/auth/login/
```
**Auth**: None

**Request**:
```json
{
  "email": "admin@acme.com",
  "password": "SecurePass123!"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": { "id": "...", "email": "admin@acme.com", ... },
    "tokens": {
      "access": "eyJ...",
      "refresh": "eyJ..."
    }
  }
}
```

---

### Logout
```
POST /api/v1/auth/logout/
```
**Auth**: Bearer token

**Request**:
```json
{
  "refresh": "eyJ..."
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

---

### Refresh Token
```
POST /api/v1/auth/refresh/
```
**Request**:
```json
{
  "refresh": "eyJ..."
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "access": "eyJ...",
    "refresh": "eyJ..."
  }
}
```

---

### Verify Email
```
POST /api/v1/auth/verify-email/
```
**Request**: `{ "token": "raw-token-from-email" }`

---

### Forgot Password
```
POST /api/v1/auth/forgot-password/
```
**Request**: `{ "email": "user@acme.com" }`

**Response**: Always 200 (prevents email enumeration)

---

### Reset Password
```
POST /api/v1/auth/reset-password/
```
**Request**:
```json
{
  "token": "raw-token-from-email",
  "password": "NewPass123!",
  "password_confirm": "NewPass123!"
}
```

---

### Accept Invitation
```
POST /api/v1/auth/accept-invitation/
```
**Request**:
```json
{
  "token": "raw-token-from-email",
  "first_name": "John",
  "last_name": "Doe",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!"
}
```

---

### Get Current User
```
GET /api/v1/auth/me/
```
**Auth**: Bearer token

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "admin@acme.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "phone": "",
    "is_verified": true,
    "employee": {
      "id": "...",
      "employee_id": "ACME-2026-00001",
      "role": "ADMIN",
      "organization": {
        "id": "...",
        "name": "Acme Corp",
        "organization_code": "ACME"
      },
      "department": null,
      "designation": null,
      "employment_type": "FULL_TIME",
      "employment_status": "ACTIVE"
    }
  }
}
```

---

## Employees

### List Employees
```
GET /api/v1/employees/
```
**Auth**: Bearer token (org member)
**Filters**: `?employment_status=ACTIVE&department={id}&search=john&page=1&page_size=20`

---

### Get Employee
```
GET /api/v1/employees/{id}/
```
**Auth**: HR/Admin or self

---

### Create Employee (HR/Admin)
```
POST /api/v1/employees/
```
**Auth**: HR/Admin

**Request**:
```json
{
  "email": "newhire@acme.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "EMPLOYEE",
  "department_id": "...",
  "designation_id": "...",
  "employment_type": "FULL_TIME",
  "joining_date": "2026-08-22"
}
```

---

### Update Employee (HR/Admin)
```
PATCH /api/v1/employees/{id}/
```

---

### Delete Employee (soft-delete)
```
DELETE /api/v1/employees/{id}/
```
Sets `employment_status=TERMINATED` and deactivates user.

---

### Get My Profile (Employee)
```
GET /api/v1/employees/me/
```

---

### Update My Profile (Employee — restricted)
```
PATCH /api/v1/employees/me/
```
**Allowed fields**: `phone`, `address`, `emergency_contact_name`, `emergency_contact_phone`, `profile_picture`, `date_of_birth`, `gender`

**Protected fields** (ignored): `role`, `salary`, `organization`, `employee_id`, `employment_status`, `department`, `designation`

---

### Invite Employee
```
POST /api/v1/employees/invite/
```
**Auth**: HR/Admin

**Request**:
```json
{
  "email": "newhire@acme.com",
  "role": "EMPLOYEE",
  "department_id": "...",
  "designation_id": "..."
}
```

---

## Departments

```
GET    /api/v1/departments/          # List (org members)
POST   /api/v1/departments/          # Create (HR/Admin)
GET    /api/v1/departments/{id}/     # Detail (org members)
PATCH  /api/v1/departments/{id}/     # Update (HR/Admin)
DELETE /api/v1/departments/{id}/     # Delete (HR/Admin)
```

**Department object**:
```json
{
  "id": "...",
  "name": "Engineering",
  "description": "Software engineering",
  "manager": "...",
  "manager_name": "Jane Smith",
  "created_at": "2026-08-22T00:00:00Z",
  "updated_at": "2026-08-22T00:00:00Z"
}
```

---

## Designations

```
GET    /api/v1/designations/          # List (org members)
POST   /api/v1/designations/          # Create (HR/Admin)
GET    /api/v1/designations/{id}/     # Detail (org members)
PATCH  /api/v1/designations/{id}/     # Update (HR/Admin)
DELETE /api/v1/designations/{id}/     # Delete (HR/Admin)
```

---

## Notifications

```
GET   /api/v1/notifications/                # List my notifications
GET   /api/v1/notifications/{id}/           # Detail
PATCH /api/v1/notifications/{id}/read/      # Mark as read
PATCH /api/v1/notifications/read-all/       # Mark all as read
```

**Filters**: `?notification_type=LEAVE&is_read=false`

---

## Contracts (For Other Developers)

### Attendance (to be implemented)
```
GET  /api/v1/attendance/                     # List attendance records
POST /api/v1/attendance/check-in/            # Record check-in
POST /api/v1/attendance/check-out/           # Record check-out
POST /api/v1/attendance/corrections/         # Request correction
PATCH /api/v1/attendance/corrections/{id}/approve/
PATCH /api/v1/attendance/corrections/{id}/reject/
```

### Leave (to be implemented)
```
GET  /api/v1/leave/types/                    # List leave types
GET  /api/v1/leave/balance/                  # Get leave balance
POST /api/v1/leave/requests/                 # Create leave request
PATCH /api/v1/leave/requests/{id}/approve/
PATCH /api/v1/leave/requests/{id}/reject/
PATCH /api/v1/leave/requests/{id}/cancel/
```

### Payroll (to be implemented)
```
GET  /api/v1/payroll/salary/                 # View own salary
GET  /api/v1/payroll/salary/{employee_id}/   # View salary (HR/Admin)
POST /api/v1/payroll/salary/                 # Assign salary (HR/Admin)
GET  /api/v1/payroll/payslips/               # List payslips
POST /api/v1/payroll/payslips/generate/      # Generate payslips (HR/Admin)
```

### Reports (to be implemented)
```
GET /api/v1/reports/attendance/
GET /api/v1/reports/leave/
GET /api/v1/reports/employees/
GET /api/v1/reports/payroll/
```
All support filters: `?employee={id}&department={id}&start_date=2026-01-01&end_date=2026-12-31`
