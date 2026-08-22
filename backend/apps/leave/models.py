"""
Leave management models — contracts for the leave module developer.
"""
from django.conf import settings
from django.db import models
from common.models import BaseModel


class LeaveType(BaseModel):
    """Types of leave available in an organization."""

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="leave_types",
    )
    name = models.CharField(max_length=100, help_text="e.g., Paid Leave, Sick Leave")
    max_days = models.PositiveIntegerField(
        default=0, help_text="Maximum days per year. 0 = unlimited."
    )
    is_paid = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["name"]
        unique_together = [("organization", "name")]

    def __str__(self):
        return self.name


class LeaveBalance(BaseModel):
    """Tracks leave balance per employee per leave type per year."""

    employee = models.ForeignKey(
        "employees.Employee",
        on_delete=models.CASCADE,
        related_name="leave_balances",
    )
    leave_type = models.ForeignKey(
        LeaveType,
        on_delete=models.CASCADE,
        related_name="balances",
    )
    year = models.PositiveIntegerField()
    total = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    used = models.DecimalField(max_digits=5, decimal_places=1, default=0)

    class Meta:
        unique_together = [("employee", "leave_type", "year")]
        ordering = ["-year"]

    @property
    def remaining(self):
        return self.total - self.used

    def __str__(self):
        return f"{self.employee.employee_id} - {self.leave_type.name} ({self.year})"


class LeaveRequest(BaseModel):
    """Leave request with approval workflow."""

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
        CANCELLED = "CANCELLED", "Cancelled"

    employee = models.ForeignKey(
        "employees.Employee",
        on_delete=models.CASCADE,
        related_name="leave_requests",
    )
    leave_type = models.ForeignKey(
        LeaveType,
        on_delete=models.CASCADE,
        related_name="requests",
    )
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    attachment = models.FileField(upload_to="leave/attachments/", blank=True, null=True)
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
        related_name="reviewed_leave_requests",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_comment = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["employee", "status"]),
            models.Index(fields=["employee", "start_date", "end_date"]),
        ]

    @property
    def days_requested(self):
        if self.start_date and self.end_date:
            return (self.end_date - self.start_date).days + 1
        return 0

    def __str__(self):
        return f"{self.employee.employee_id} - {self.leave_type.name} ({self.start_date} to {self.end_date})"


class ApprovalRequest(BaseModel):
    """
    Generic approval request — can support leave, attendance corrections,
    profile changes, salary changes, etc.
    """

    class RequestType(models.TextChoices):
        LEAVE = "LEAVE", "Leave Request"
        ATTENDANCE = "ATTENDANCE", "Attendance Correction"
        PROFILE = "PROFILE", "Profile Change"
        SALARY = "SALARY", "Salary Change"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
        CANCELLED = "CANCELLED", "Cancelled"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="approval_requests",
    )
    request_type = models.CharField(
        max_length=20,
        choices=RequestType.choices,
        db_index=True,
    )
    requestor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="approval_requests",
    )
    entity_type = models.CharField(
        max_length=100,
        help_text="Model name of the entity being approved.",
    )
    entity_id = models.CharField(
        max_length=255,
        help_text="PK of the entity being approved.",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.request_type} by {self.requestor} ({self.status})"


class ApprovalStep(BaseModel):
    """
    Individual approval step — supports multi-level approvals.
    For MVP, single-level is sufficient.
    """

    approval_request = models.ForeignKey(
        ApprovalRequest,
        on_delete=models.CASCADE,
        related_name="steps",
    )
    approver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="approval_steps",
    )
    order = models.PositiveIntegerField(
        default=1,
        help_text="Approval order (1 = first approver).",
    )
    status = models.CharField(
        max_length=20,
        choices=ApprovalRequest.Status.choices,
        default="PENDING",
    )
    comment = models.TextField(blank=True, default="")
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"Step {self.order} - {self.approver} ({self.status})"
