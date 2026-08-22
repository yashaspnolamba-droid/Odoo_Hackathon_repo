from django.test import TestCase
from django.utils import timezone
from apps.attendance.models import AttendanceRecord
from apps.accounts.models import Employee, Organization, User

class AttendanceModelTest(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="Test Org", domain="test.com")
        self.user = User.objects.create_user(email="test@test.com", password="password", organization=self.org)
        self.employee = Employee.objects.create(user=self.user, employee_id="EMP001", organization=self.org)
        
    def test_create_attendance_record(self):
        record = AttendanceRecord.objects.create(
            employee=self.employee,
            date=timezone.now().date(),
            check_in=timezone.now(),
            status="PRESENT",
            source="WEB"
        )
        self.assertEqual(record.employee, self.employee)
        self.assertEqual(record.status, "PRESENT")
        self.assertEqual(record.source, "WEB")
        self.assertTrue(record.is_present)
