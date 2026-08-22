"""
Notification model and utility for Dayflow HRMS.
"""
from django.conf import settings
from django.db import models
from common.models import BaseModel


class Notification(BaseModel):
    """User notifications — supports multiple types and read tracking."""

    class NotificationType(models.TextChoices):
        LEAVE = "LEAVE", "Leave"
        ATTENDANCE = "ATTENDANCE", "Attendance"
        PAYROLL = "PAYROLL", "Payroll"
        SYSTEM = "SYSTEM", "System"
        EMPLOYEE = "EMPLOYEE", "Employee"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM,
        db_index=True,
    )
    is_read = models.BooleanField(default=False, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read", "-created_at"]),
        ]

    def __str__(self):
        return f"[{self.notification_type}] {self.title}"


def send_notification(user, organization, title, message, notification_type="SYSTEM"):
    """
    Create a notification for a user.
    Can be extended to also send email/push via Celery.
    """
    return Notification.objects.create(
        user=user,
        organization=organization,
        title=title,
        message=message,
        notification_type=notification_type,
    )
