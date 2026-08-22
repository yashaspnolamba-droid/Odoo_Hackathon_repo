"""
Shared test fixtures for Dayflow HRMS.
Provides pre-configured organizations, users, and employees for all tests.
"""
import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.organizations.models import Organization
from apps.employees.models import Employee, Department, Designation


@pytest.fixture
def api_client():
    """Unauthenticated API client."""
    return APIClient()


@pytest.fixture
def org_a():
    """Organization A."""
    return Organization.objects.create(
        name="Acme Corp",
        organization_code="ACME",
        email="admin@acme.com",
        timezone="UTC",
    )


@pytest.fixture
def org_b():
    """Organization B — for isolation tests."""
    return Organization.objects.create(
        name="Beta Inc",
        organization_code="BETA",
        email="admin@beta.com",
        timezone="US/Eastern",
    )


@pytest.fixture
def admin_user(org_a):
    """Admin user for Org A."""
    user = User.objects.create_user(
        email="admin@acme.com",
        password="AdminPass123!",
        first_name="Admin",
        last_name="User",
        is_verified=True,
    )
    Employee.objects.create(
        user=user,
        organization=org_a,
        role="ADMIN",
        employment_type="FULL_TIME",
        employment_status="ACTIVE",
    )
    return user


@pytest.fixture
def hr_user(org_a):
    """HR user for Org A."""
    user = User.objects.create_user(
        email="hr@acme.com",
        password="HRPass123!",
        first_name="HR",
        last_name="Manager",
        is_verified=True,
    )
    Employee.objects.create(
        user=user,
        organization=org_a,
        role="HR",
        employment_type="FULL_TIME",
        employment_status="ACTIVE",
    )
    return user


@pytest.fixture
def employee_user(org_a):
    """Regular employee user for Org A."""
    user = User.objects.create_user(
        email="employee@acme.com",
        password="EmpPass123!",
        first_name="John",
        last_name="Doe",
        is_verified=True,
    )
    Employee.objects.create(
        user=user,
        organization=org_a,
        role="EMPLOYEE",
        employment_type="FULL_TIME",
        employment_status="ACTIVE",
    )
    return user


@pytest.fixture
def org_b_admin(org_b):
    """Admin user for Org B — for isolation tests."""
    user = User.objects.create_user(
        email="admin@beta.com",
        password="BetaAdmin123!",
        first_name="Beta",
        last_name="Admin",
        is_verified=True,
    )
    Employee.objects.create(
        user=user,
        organization=org_b,
        role="ADMIN",
        employment_type="FULL_TIME",
        employment_status="ACTIVE",
    )
    return user


@pytest.fixture
def org_b_employee(org_b):
    """Employee for Org B — for isolation tests."""
    user = User.objects.create_user(
        email="employee@beta.com",
        password="BetaEmp123!",
        first_name="Beta",
        last_name="Employee",
        is_verified=True,
    )
    Employee.objects.create(
        user=user,
        organization=org_b,
        role="EMPLOYEE",
        employment_type="FULL_TIME",
        employment_status="ACTIVE",
    )
    return user


@pytest.fixture
def department_a(org_a):
    """Engineering department for Org A."""
    return Department.objects.create(
        organization=org_a,
        name="Engineering",
        description="Software engineering department",
    )


@pytest.fixture
def designation_a(org_a):
    """Software Engineer designation for Org A."""
    return Designation.objects.create(
        organization=org_a,
        name="Software Engineer",
        level=3,
    )


@pytest.fixture
def department_b(org_b):
    """Engineering department for Org B."""
    return Department.objects.create(
        organization=org_b,
        name="Engineering",
        description="Engineering at Beta",
    )


def get_auth_header(user):
    """Generate JWT auth header for a user."""
    refresh = RefreshToken.for_user(user)
    return {"HTTP_AUTHORIZATION": f"Bearer {refresh.access_token}"}


def auth_client(user):
    """Return an authenticated API client."""
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client
