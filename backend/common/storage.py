"""
Storage abstraction for Dayflow HRMS.
Uses Django's default storage system, which can be swapped to S3/R2 via django-storages.

To switch to S3/Cloudflare R2 in production, update settings:
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    AWS_STORAGE_BUCKET_NAME = '...'
    AWS_S3_ENDPOINT_URL = '...'  # For R2
"""
import os
from django.conf import settings


def employee_profile_picture_path(instance, filename):
    """Generate upload path for employee profile pictures."""
    ext = os.path.splitext(filename)[1]
    return f"employees/{instance.organization_id}/profiles/{instance.id}{ext}"


def employee_document_path(instance, filename):
    """Generate upload path for employee documents."""
    ext = os.path.splitext(filename)[1]
    return f"employees/{instance.employee.organization_id}/documents/{instance.employee_id}/{instance.id}{ext}"


def organization_logo_path(instance, filename):
    """Generate upload path for organization logos."""
    ext = os.path.splitext(filename)[1]
    return f"organizations/{instance.id}/logo{ext}"
