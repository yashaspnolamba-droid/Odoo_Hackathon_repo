"""
Base models for Dayflow HRMS.
All models should inherit from BaseModel for consistent UUID PKs and timestamps.
"""
import uuid
from django.db import models


class BaseModel(models.Model):
    """
    Abstract base model providing UUID primary key and timestamp fields.
    All Dayflow models should inherit from this.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ["-created_at"]
