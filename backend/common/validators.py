"""
File upload validators for Dayflow HRMS.
"""
from django.conf import settings
from django.core.exceptions import ValidationError


def validate_file_size(file):
    """Validate that uploaded file does not exceed MAX_UPLOAD_SIZE."""
    max_size = getattr(settings, "MAX_UPLOAD_SIZE", 10 * 1024 * 1024)
    if file.size > max_size:
        max_mb = max_size // (1024 * 1024)
        raise ValidationError(f"File size must not exceed {max_mb}MB. Got {file.size / (1024 * 1024):.1f}MB.")


def validate_file_type(file):
    """Validate that uploaded file has an allowed content type."""
    allowed_types = getattr(
        settings,
        "ALLOWED_UPLOAD_TYPES",
        ["application/pdf", "image/png", "image/jpeg"],
    )
    if hasattr(file, "content_type") and file.content_type not in allowed_types:
        raise ValidationError(
            f"File type '{file.content_type}' is not allowed. "
            f"Allowed types: {', '.join(allowed_types)}"
        )


def validate_image_file(file):
    """Validate that uploaded file is an image."""
    allowed_image_types = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
    if hasattr(file, "content_type") and file.content_type not in allowed_image_types:
        raise ValidationError(
            f"File must be an image. Allowed types: {', '.join(allowed_image_types)}"
        )
