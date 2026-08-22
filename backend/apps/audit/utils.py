"""
Utility functions for creating audit log entries.
Used throughout the application to record sensitive actions.
"""
import json
import logging
from apps.audit.models import AuditLog

logger = logging.getLogger(__name__)


def create_audit_log(
    request=None,
    action="UPDATE",
    entity_type="",
    entity_id="",
    old_values=None,
    new_values=None,
    user=None,
    organization=None,
):
    """
    Create an audit log entry.

    Args:
        request: DRF request object (used to extract user, IP, user-agent).
        action: One of AuditLog.Action choices.
        entity_type: Model/entity name (e.g., "Employee").
        entity_id: Primary key of the entity as string.
        old_values: Dict of previous values (optional).
        new_values: Dict of new values (optional).
        user: Override user (if request is not available).
        organization: Override organization (if request is not available).
    """
    try:
        actor = user
        org = organization
        ip_address = None
        user_agent = ""

        if request:
            actor = actor or getattr(request, "user", None)
            if actor and not actor.is_authenticated:
                actor = None

            # Extract IP
            ip_address = _get_client_ip(request)
            user_agent = request.META.get("HTTP_USER_AGENT", "")[:500]

            # Extract organization from user's employee
            if not org and actor and hasattr(actor, "employee"):
                org = actor.employee.organization

        # Sanitize values — ensure they're JSON-serializable
        clean_old = _sanitize_values(old_values)
        clean_new = _sanitize_values(new_values)

        AuditLog.objects.create(
            organization=org,
            actor=actor,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            old_values=clean_old,
            new_values=clean_new,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    except Exception as e:
        # Audit logging should never break the main operation
        logger.error(f"Failed to create audit log: {e}", exc_info=True)


def _get_client_ip(request):
    """Extract client IP from request, handling proxies."""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _sanitize_values(values):
    """Ensure values are JSON-serializable."""
    if values is None:
        return None
    try:
        json.dumps(values, default=str)
        return values
    except (TypeError, ValueError):
        return {k: str(v) for k, v in values.items()} if isinstance(values, dict) else str(values)
