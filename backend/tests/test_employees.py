"""
Employee CRUD tests for Dayflow HRMS.
"""
import pytest
from rest_framework import status

from apps.employees.models import Employee, Department, Designation
from tests.conftest import auth_client


@pytest.mark.django_db
class TestEmployeeCRUD:
    """Test employee create, read, update, soft-delete operations."""

    def test_admin_can_list_employees(self, admin_user):
        client = auth_client(admin_user)
        response = client.get("/api/v1/employees/")
        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data

    def test_hr_can_list_employees(self, hr_user):
        client = auth_client(hr_user)
        response = client.get("/api/v1/employees/")
        assert response.status_code == status.HTTP_200_OK

    def test_admin_can_update_employee(self, admin_user, employee_user):
        client = auth_client(admin_user)
        response = client.patch(
            f"/api/v1/employees/{employee_user.employee.id}/",
            {"employment_type": "CONTRACT"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        employee_user.employee.refresh_from_db()
        assert employee_user.employee.employment_type == "CONTRACT"

    def test_soft_delete_employee(self, admin_user, employee_user):
        """DELETE should soft-delete (set status=TERMINATED, deactivate user)."""
        client = auth_client(admin_user)
        emp_id = employee_user.employee.id
        response = client.delete(f"/api/v1/employees/{emp_id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Employee should still exist but be terminated
        emp = Employee.objects.get(id=emp_id)
        assert emp.employment_status == "TERMINATED"
        emp.user.refresh_from_db()
        assert emp.user.is_active is False

    def test_employee_id_auto_generated(self, admin_user, org_a):
        """Employee ID should be auto-generated in {ORG}-{YEAR}-{SEQ} format."""
        emp = Employee.objects.create(
            organization=org_a,
            role="EMPLOYEE",
            employment_type="FULL_TIME",
            employment_status="ACTIVE",
        )
        assert emp.employee_id.startswith("ACME-")
        parts = emp.employee_id.split("-")
        assert len(parts) == 3
        assert parts[0] == "ACME"
        # Year should be current year
        from django.utils import timezone
        assert parts[1] == str(timezone.now().year)

    def test_employee_id_sequential(self, org_a):
        """Employee IDs should increment sequentially."""
        emp1 = Employee.objects.create(
            organization=org_a, role="EMPLOYEE",
            employment_type="FULL_TIME", employment_status="ACTIVE",
        )
        emp2 = Employee.objects.create(
            organization=org_a, role="EMPLOYEE",
            employment_type="FULL_TIME", employment_status="ACTIVE",
        )
        seq1 = int(emp1.employee_id.split("-")[-1])
        seq2 = int(emp2.employee_id.split("-")[-1])
        assert seq2 == seq1 + 1


@pytest.mark.django_db
class TestDepartmentCRUD:
    """Test department CRUD operations."""

    def test_create_department(self, admin_user):
        client = auth_client(admin_user)
        response = client.post(
            "/api/v1/departments/",
            {"name": "Research", "description": "R&D team"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Research"

    def test_list_departments(self, admin_user, department_a):
        client = auth_client(admin_user)
        response = client.get("/api/v1/departments/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) >= 1

    def test_update_department(self, admin_user, department_a):
        client = auth_client(admin_user)
        response = client.patch(
            f"/api/v1/departments/{department_a.id}/",
            {"description": "Updated description"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK

    def test_delete_department(self, admin_user, department_a):
        client = auth_client(admin_user)
        response = client.delete(f"/api/v1/departments/{department_a.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_unique_department_name_per_org(self, admin_user, department_a):
        """Cannot create two departments with same name in same org."""
        client = auth_client(admin_user)
        response = client.post(
            "/api/v1/departments/",
            {"name": "Engineering"},  # Already exists
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestDesignationCRUD:
    """Test designation CRUD operations."""

    def test_create_designation(self, admin_user):
        client = auth_client(admin_user)
        response = client.post(
            "/api/v1/designations/",
            {"name": "Team Lead", "level": 5},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_list_designations(self, admin_user, designation_a):
        client = auth_client(admin_user)
        response = client.get("/api/v1/designations/")
        assert response.status_code == status.HTTP_200_OK
