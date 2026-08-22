"""
Attendance models — contracts for the attendance module developer.
"""
from django.conf import settings
from django.db import models
from common.models import BaseModel


class AttendanceRecord(BaseModel):
    """
    Daily attendance record for an employee.
    One record per employee per date.
    """

    class Status(models.TextChoices):
        PRESENT = "PRESENT", "Present"
        ABSENT = "ABSENT", "Absent"
        HALF_DAY = "HALF_DAY", "Half Day"
        LEAVE = "LEAVE", "Leave"
        HOLIDAY = "HOLIDAY", "Holiday"
        WEEK_OFF = "WEEK_OFF", "Week Off"

    class Source(models.TextChoices):
        MANUAL = "MANUAL", "Manual"
        BIOMETRIC = "BIOMETRIC", "Biometric"
        MOBILE = "MOBILE", "Mobile App"
        WEB = "WEB", "Web Portal"
        SYSTEM = "SYSTEM", "System Generated"

    employee = models.ForeignKey(
        "employees.Employee",
        on_delete=models.CASCADE,
        related_name="attendance_records",
    )
    date = models.DateField(db_index=True)
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    break_duration = models.DurationField(
        null=True, blank=True,
        help_text="Total break time during the day.",
    )
    working_hours = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        help_text="Calculated working hours.",
    )
    overtime_hours = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text="Overtime hours beyond standard.",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PRESENT,
        db_index=True,
    )
    source = models.CharField(
        max_length=20,
        choices=Source.choices,
        default=Source.WEB,
    )
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-date"]
        unique_together = [("employee", "date")]
        indexes = [
            models.Index(fields=["employee", "date"]),
            models.Index(fields=["employee", "status"]),
        ]

    def __str__(self):
        return f"{self.employee.employee_id} - {self.date} ({self.status})"


class AttendanceCorrection(BaseModel):
    """
    Request to correct an attendance record.
    Follows a simple approval workflow.
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    employee = models.ForeignKey(
        "employees.Employee",
        on_delete=models.CASCADE,
        related_name="attendance_corrections",
    )
    attendance_record = models.ForeignKey(
        AttendanceRecord,
        on_delete=models.CASCADE,
        related_name="corrections",
    )
    field_name = models.CharField(
        max_length=50,
        help_text="Name of the field to correct (e.g., check_in, check_out, status).",
    )
    old_value = models.CharField(max_length=255, blank=True, default="")
    new_value = models.CharField(max_length=255)
    reason = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_corrections",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_comment = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Correction for {self.attendance_record} ({self.status})"
