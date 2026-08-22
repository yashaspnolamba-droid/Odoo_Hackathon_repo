"""
Audit log tests for Dayflow HRMS.
Verifies that sensitive actions create audit records.
"""
import pytest
from rest_framework import status

from apps.audit.models import AuditLog
from tests.conftest import auth_client


@pytest.mark.django_db
class TestAuditLogging:
    """Test that sensitive actions create audit log entries."""

    def test_org_registration_creates_audit(self, api_client):
        response = api_client.post(
            "/api/v1/auth/register-organization/",
            {
                "organization_name": "Audit Test Corp",
                "organization_code": "AUDIT",
                "email": "admin@audit.com",
                "first_name": "Audit",
                "last_name": "Admin",
                "password": "SecurePass123!",
                "password_confirm": "SecurePass123!",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert AuditLog.objects.filter(
            entity_type="Organization",
            action="CREATE",
        ).exists()

    def test_department_creation_creates_audit(self, admin_user):
        client = auth_client(admin_user)
        response = client.post(
            "/api/v1/departments/",
            {"name": "Audit Test Dept"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert AuditLog.objects.filter(
            entity_type="Department",
            action="CREATE",
        ).exists()

    def test_department_update_creates_audit(self, admin_user, department_a):
        client = auth_client(admin_user)
        response = client.patch(
            f"/api/v1/departments/{department_a.id}/",
            {"name": "Updated Engineering"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        audit = AuditLog.objects.filter(
            entity_type="Department",
            action="UPDATE",
            entity_id=str(department_a.id),
        ).first()
        assert audit is not None
        assert audit.old_values["name"] == "Engineering"

    def test_department_deletion_creates_audit(self, admin_user, department_a):
        client = auth_client(admin_user)
        dept_id = str(department_a.id)
        response = client.delete(f"/api/v1/departments/{department_a.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert AuditLog.objects.filter(
            entity_type="Department",
            action="DELETE",
            entity_id=dept_id,
        ).exists()

    def test_employee_soft_delete_creates_audit(self, admin_user, employee_user):
        client = auth_client(admin_user)
        emp_id = str(employee_user.employee.id)
        response = client.delete(f"/api/v1/employees/{emp_id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert AuditLog.objects.filter(
            entity_type="Employee",
            action="DELETE",
            entity_id=emp_id,
        ).exists()

    def test_audit_log_immutable(self):
        """Audit logs cannot be updated or deleted."""
        log = AuditLog.objects.create(
            action="CREATE",
            entity_type="TestEntity",
            entity_id="test-123",
        )
        with pytest.raises(ValueError, match="immutable"):
            log.action = "UPDATE"
            log.save()

        with pytest.raises(ValueError, match="immutable"):
            log.delete()

    def test_self_update_creates_audit(self, employee_user):
        client = auth_client(employee_user)
        response = client.patch(
            "/api/v1/employees/me/",
            {"phone": "+1234567890"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert AuditLog.objects.filter(
            entity_type="Employee",
            action="UPDATE",
            entity_id=str(employee_user.employee.id),
        ).exists()

    def test_password_reset_creates_audit(self, api_client, admin_user):
        from apps.accounts.models import PasswordResetToken
        _, raw_token = PasswordResetToken.create_token(admin_user)
        response = api_client.post(
            "/api/v1/auth/reset-password/",
            {
                "token": raw_token,
                "password": "NewSecurePass123!",
                "password_confirm": "NewSecurePass123!",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert AuditLog.objects.filter(
            entity_type="User",
            action="UPDATE",
        ).exists()
