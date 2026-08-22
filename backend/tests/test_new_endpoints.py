import pytest
from django.urls import reverse
from rest_framework import status
from django.utils import timezone
from apps.attendance.models import AttendanceRecord
from apps.leave.models import LeaveType
from apps.payroll.models import SalaryStructure
from tests.conftest import auth_client

pytestmark = pytest.mark.django_db


class TestAttendanceAPI:
    def test_check_in_check_out(self, employee_user):
        client = auth_client(employee_user)
        
        # Check in
        url_in = reverse("api-v1:attendance:check-in")
        resp_in = client.post(url_in, {"source": "WEB", "notes": "Morning checkin"})
        assert resp_in.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]
        assert resp_in.data["success"] is True

        # Check out
        url_out = reverse("api-v1:attendance:check-out")
        resp_out = client.post(url_out, {"notes": "Leaving early"})
        assert resp_out.status_code == status.HTTP_200_OK
        assert resp_out.data["success"] is True

        # List records
        url_list = reverse("api-v1:attendance:attendance-record-list")
        resp_list = client.get(url_list)
        assert resp_list.status_code == status.HTTP_200_OK
        assert len(resp_list.data["results"]) == 1


class TestLeaveAPI:
    def test_leave_workflow(self, admin_user, employee_user, org_a):
        admin_client = auth_client(admin_user)
        emp_client = auth_client(employee_user)

        # 1. Admin creates a leave type
        url_type = reverse("api-v1:leave:leave-type-list")
        type_resp = admin_client.post(url_type, {
            "organization": org_a.id,
            "name": "Annual Leave",
            "max_days": 20,
            "is_paid": True,
        })
        assert type_resp.status_code == status.HTTP_201_CREATED
        leave_type_id = type_resp.data["id"]

        # 2. Employee requests leave
        url_req = reverse("api-v1:leave:leave-request-list")
        req_resp = emp_client.post(url_req, {
            "leave_type": leave_type_id,
            "start_date": str(timezone.localdate()),
            "end_date": str(timezone.localdate()),
            "reason": "Vacation",
        })
        assert req_resp.status_code == status.HTTP_201_CREATED
        from apps.leave.models import LeaveRequest
        request_id = LeaveRequest.objects.first().id

        # 3. Admin approves leave
        url_approve = reverse("api-v1:leave:leave-request-approve", kwargs={"pk": request_id})
        approve_resp = admin_client.patch(url_approve, {"comment": "Have fun!"})
        assert approve_resp.status_code == status.HTTP_200_OK


class TestPayrollAPI:
    def test_salary_management(self, admin_user, employee_user, org_a):
        admin_client = auth_client(admin_user)
        
        # Admin creates salary structure
        url_struct = reverse("api-v1:payroll:salary-structure-list")
        struct_resp = admin_client.post(url_struct, {
            "organization": org_a.id,
            "name": "Standard Band",
            "description": "Standard",
        })
        assert struct_resp.status_code == status.HTTP_201_CREATED
        struct_id = struct_resp.data["id"]

        # Admin assigns salary to employee
        url_salary = reverse("api-v1:payroll:employee-salary-list")
        salary_resp = admin_client.post(url_salary, {
            "employee": employee_user.employee.id,
            "salary_structure": struct_id,
            "base_salary": "50000.00",
            "effective_date": str(timezone.localdate()),
        })
        assert salary_resp.status_code == status.HTTP_201_CREATED

        # Employee views their salary
        emp_client = auth_client(employee_user)
        emp_resp = emp_client.get(url_salary)
        assert emp_resp.status_code == status.HTTP_200_OK
        assert len(emp_resp.data["results"]) == 1


class TestEmployeeExtrasAPI:
    def test_employment_history(self, admin_user, employee_user):
        admin_client = auth_client(admin_user)
        emp_client = auth_client(employee_user)

        url = reverse("api-v1:employees:employment-history-list")
        
        # Admin creates history record
        post_resp = admin_client.post(url, {
            "employee": employee_user.employee.id,
            "joining_date": str(timezone.localdate()),
            "change_reason": "Hired",
        })
        assert post_resp.status_code == status.HTTP_201_CREATED

        # Employee reads history
        get_resp = emp_client.get(url)
        assert get_resp.status_code == status.HTTP_200_OK
        assert len(get_resp.data["results"]) == 1

    def test_employee_documents(self, employee_user):
        emp_client = auth_client(employee_user)
        url = reverse("api-v1:employees:employee-document-list")
        
        # Employees cannot post without a real file (we'll just test a failed request for missing file)
        resp = emp_client.post(url, {
            "employee": employee_user.employee.id,
            "name": "My Resume",
            "document_type": "RESUME",
        })
        # Should fail with missing file, but indicates endpoint is accessible
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "file" in resp.data.get("errors", {})
