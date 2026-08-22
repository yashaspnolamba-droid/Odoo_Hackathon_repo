"""
Permission and authorization tests for Dayflow HRMS.
Covers: role-based access, employee data restrictions, org isolation.
"""
import pytest
from rest_framework import status

from apps.employees.models import Employee, Department
from apps.organizations.models import Organization
from tests.conftest import auth_client


@pytest.mark.django_db
class TestRoleBasedAccess:
    """Test that role-based permissions are enforced correctly."""

    def test_employee_cannot_create_employee(self, employee_user):
        client = auth_client(employee_user)
        response = client.post(
            "/api/v1/employees/",
            {
                "email": "new@acme.com",
                "role": "EMPLOYEE",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_employee_cannot_create_department(self, employee_user):
        client = auth_client(employee_user)
        response = client.post(
            "/api/v1/departments/",
            {"name": "New Dept"},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_employee_cannot_create_designation(self, employee_user):
        client = auth_client(employee_user)
        response = client.post(
            "/api/v1/designations/",
            {"name": "New Role", "level": 1},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_hr_can_create_department(self, hr_user):
        client = auth_client(hr_user)
        response = client.post(
            "/api/v1/departments/",
            {"name": "Marketing"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_admin_can_create_department(self, admin_user):
        client = auth_client(admin_user)
        response = client.post(
            "/api/v1/departments/",
            {"name": "Finance"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_hr_can_create_designation(self, hr_user):
        client = auth_client(hr_user)
        response = client.post(
            "/api/v1/designations/",
            {"name": "Manager", "level": 5},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_employee_can_list_departments(self, employee_user, department_a):
        client = auth_client(employee_user)
        response = client.get("/api/v1/departments/")
        assert response.status_code == status.HTTP_200_OK

    def test_employee_can_list_designations(self, employee_user, designation_a):
        client = auth_client(employee_user)
        response = client.get("/api/v1/designations/")
        assert response.status_code == status.HTTP_200_OK

    def test_employee_can_view_me(self, employee_user):
        client = auth_client(employee_user)
        response = client.get("/api/v1/employees/me/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["data"]["role"] == "EMPLOYEE"


@pytest.mark.django_db
class TestOrganizationIsolation:
    """
    CRITICAL: Test that org A cannot access org B's data and vice versa.
    """

    def test_org_a_cannot_see_org_b_departments(self, admin_user, department_b):
        client = auth_client(admin_user)
        response = client.get("/api/v1/departments/")
        assert response.status_code == status.HTTP_200_OK
        # Should not contain org B's department
        dept_names = [d["name"] for d in response.data["results"]]
        # department_b belongs to org_b, should not appear
        assert all(
            d.get("id") != str(department_b.id) for d in response.data["results"]
        )

    def test_org_b_cannot_see_org_a_departments(self, org_b_admin, department_a):
        client = auth_client(org_b_admin)
        response = client.get("/api/v1/departments/")
        assert response.status_code == status.HTTP_200_OK
        assert all(
            d.get("id") != str(department_a.id) for d in response.data["results"]
        )

    def test_org_a_cannot_see_org_b_employees(self, admin_user, org_b_employee):
        client = auth_client(admin_user)
        response = client.get("/api/v1/employees/")
        assert response.status_code == status.HTTP_200_OK
        employee_ids = [e["id"] for e in response.data["results"]]
        assert str(org_b_employee.employee.id) not in employee_ids

    def test_org_b_cannot_see_org_a_employees(self, org_b_admin, employee_user):
        client = auth_client(org_b_admin)
        response = client.get("/api/v1/employees/")
        assert response.status_code == status.HTTP_200_OK
        employee_ids = [e["id"] for e in response.data["results"]]
        assert str(employee_user.employee.id) not in employee_ids

    def test_org_a_cannot_access_org_b_employee_by_id(self, admin_user, org_b_employee):
        client = auth_client(admin_user)
        response = client.get(f"/api/v1/employees/{org_b_employee.employee.id}/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_org_a_cannot_access_org_b_department_by_id(self, admin_user, department_b):
        client = auth_client(admin_user)
        response = client.get(f"/api/v1/departments/{department_b.id}/")
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestEmployeeSelfServiceRestrictions:
    """Test that employees cannot modify protected fields."""

    def test_employee_can_update_phone(self, employee_user):
        client = auth_client(employee_user)
        response = client.patch(
            "/api/v1/employees/me/",
            {"phone": "+1234567890"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK

    def test_employee_can_update_address(self, employee_user):
        client = auth_client(employee_user)
        response = client.patch(
            "/api/v1/employees/me/",
            {"address": "123 Main St"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK

    def test_employee_can_update_emergency_contact(self, employee_user):
        client = auth_client(employee_user)
        response = client.patch(
            "/api/v1/employees/me/",
            {
                "emergency_contact_name": "Jane Doe",
                "emergency_contact_phone": "+9876543210",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK

    def test_employee_cannot_change_role_via_self_update(self, employee_user):
        """Role field should be ignored in self-update serializer."""
        client = auth_client(employee_user)
        response = client.patch(
            "/api/v1/employees/me/",
            {"role": "ADMIN"},
            format="json",
        )
        # Should succeed but role should NOT change (field not in serializer)
        employee_user.employee.refresh_from_db()
        assert employee_user.employee.role == "EMPLOYEE"

    def test_employee_cannot_change_employment_status(self, employee_user):
        """Employment status should be ignored in self-update serializer."""
        client = auth_client(employee_user)
        response = client.patch(
            "/api/v1/employees/me/",
            {"employment_status": "TERMINATED"},
            format="json",
        )
        employee_user.employee.refresh_from_db()
        assert employee_user.employee.employment_status == "ACTIVE"

    def test_employee_cannot_view_other_employees_profile(self, employee_user, hr_user):
        """Regular employee cannot view another employee's detailed profile."""
        client = auth_client(employee_user)
        response = client.get(f"/api/v1/employees/{hr_user.employee.id}/")
        assert response.status_code == status.HTTP_403_FORBIDDEN
