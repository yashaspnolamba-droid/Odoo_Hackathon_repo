"""
Custom exception handler for consistent API error responses.

All errors return:
{
    "success": false,
    "message": "Error description",
    "errors": { ... }  // field-level errors if applicable
}
"""
from rest_framework.views import exception_handler
from rest_framework.exceptions import (
    ValidationError,
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied,
    NotFound,
    Throttled,
)
from rest_framework.response import Response
from rest_framework import status
from django.http import Http404
from django.core.exceptions import ObjectDoesNotExist


def custom_exception_handler(exc, context):
    """
    Custom DRF exception handler that normalizes all error responses
    into a consistent JSON format.
    """
    # Let DRF handle it first
    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            "success": False,
            "message": _get_error_message(exc, response),
            "errors": _get_error_details(exc, response),
        }
        response.data = custom_data
        return response

    # Handle Django exceptions not caught by DRF
    if isinstance(exc, Http404):
        return Response(
            {
                "success": False,
                "message": "Resource not found.",
                "errors": {},
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    if isinstance(exc, ObjectDoesNotExist):
        return Response(
            {
                "success": False,
                "message": "Requested object does not exist.",
                "errors": {},
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    # Unhandled exceptions — return 500 without leaking details
    return Response(
        {
            "success": False,
            "message": "An unexpected error occurred.",
            "errors": {},
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


def _get_error_message(exc, response):
    """Extract a human-readable message from the exception."""
    if isinstance(exc, ValidationError):
        return "Validation failed."
    if isinstance(exc, AuthenticationFailed):
        return "Authentication failed."
    if isinstance(exc, NotAuthenticated):
        return "Authentication credentials were not provided."
    if isinstance(exc, PermissionDenied):
        return "You do not have permission to perform this action."
    if isinstance(exc, NotFound):
        return "Resource not found."
    if isinstance(exc, Throttled):
        wait = exc.wait
        if wait:
            return f"Request throttled. Try again in {int(wait)} seconds."
        return "Request throttled."

    # Fallback
    if hasattr(exc, "detail"):
        detail = exc.detail
        if isinstance(detail, str):
            return detail
        if isinstance(detail, list):
            return detail[0] if detail else "An error occurred."
    return "An error occurred."


def _get_error_details(exc, response):
    """Extract structured error details, primarily for validation errors."""
    if isinstance(exc, ValidationError):
        if isinstance(exc.detail, dict):
            return {
                field: [str(e) for e in errors] if isinstance(errors, list) else [str(errors)]
                for field, errors in exc.detail.items()
            }
        if isinstance(exc.detail, list):
            return {"non_field_errors": [str(e) for e in exc.detail]}
    return {}
