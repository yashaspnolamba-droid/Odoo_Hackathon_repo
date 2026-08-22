"""
Immutable audit log model for tracking sensitive actions.
"""
import uuid
from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    """
    Append-only audit log. Records should never be updated or deleted.
    Tracks who did what, when, and what changed.
    """

    class Action(models.TextChoices):
        CREATE = "CREATE", "Create"
        UPDATE = "UPDATE", "Update"
        DELETE = "DELETE", "Delete"
        LOGIN = "LOGIN", "Login"
        LOGOUT = "LOGOUT", "Logout"
        APPROVE = "APPROVE", "Approve"
        REJECT = "REJECT", "Reject"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=20, choices=Action.choices, db_index=True)
    entity_type = models.CharField(
        max_length=100,
        db_index=True,
        help_text="Model name (e.g., Employee, Department, LeaveRequest).",
    )
    entity_id = models.CharField(
        max_length=255,
        db_index=True,
        help_text="Primary key of the affected entity.",
    )
    old_values = models.JSONField(null=True, blank=True, help_text="Previous state.")
    new_values = models.JSONField(null=True, blank=True, help_text="New state.")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "entity_type", "-created_at"]),
            models.Index(fields=["actor", "-created_at"]),
        ]
        # Prevent accidental updates/deletes at the Django ORM level
        managed = True

    def __str__(self):
        return f"{self.action} {self.entity_type} ({self.entity_id}) by {self.actor}"

    def save(self, *args, **kwargs):
        # Only allow creation, not updates
        if self.pk and AuditLog.objects.filter(pk=self.pk).exists():
            raise ValueError("Audit logs are immutable and cannot be updated.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError("Audit logs are immutable and cannot be deleted.")
