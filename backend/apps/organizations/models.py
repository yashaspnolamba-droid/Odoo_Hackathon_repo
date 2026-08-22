"""
Organization model for Dayflow HRMS.
"""
from django.db import models
from common.models import BaseModel
from common.storage import organization_logo_path


class Organization(BaseModel):
    """
    Represents an organization/company using Dayflow.
    All employees, departments, and data are scoped to an organization.
    """

    name = models.CharField(max_length=255, db_index=True)
    organization_code = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        help_text="Unique code for the organization, used in employee IDs (e.g., 'OI').",
    )
    email = models.EmailField(blank=True, default="")
    phone = models.CharField(max_length=20, blank=True, default="")
    address = models.TextField(blank=True, default="")
    logo = models.ImageField(upload_to=organization_logo_path, blank=True, null=True)
    timezone = models.CharField(
        max_length=50,
        default="UTC",
        help_text="IANA timezone (e.g., 'Asia/Kolkata', 'US/Eastern').",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["organization_code"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.organization_code})"
