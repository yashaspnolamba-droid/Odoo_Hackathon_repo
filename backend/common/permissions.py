"""
Centralized permission classes for Dayflow HRMS.
These ensure consistent role-based access control across all endpoints.
"""
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Allow access only to users with ADMIN role."""

    message = "Admin access required."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "employee")
            and request.user.employee.role == "ADMIN"
        )


class IsHR(BasePermission):
    """Allow access only to users with HR role."""

    message = "HR access required."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "employee")
            and request.user.employee.role == "HR"
        )


class IsEmployee(BasePermission):
    """Allow access to any authenticated user with an employee profile."""

    message = "Employee access required."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "employee")
        )


class IsHROrAdmin(BasePermission):
    """Allow access to users with HR or ADMIN role."""

    message = "HR or Admin access required."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "employee")
            and request.user.employee.role in ("ADMIN", "HR")
        )


class IsOrganizationMember(BasePermission):
    """
    Ensure the user belongs to an organization.
    Used as a base-level check before org-scoped queries.
    """

    message = "You must belong to an organization."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "employee")
            and request.user.employee.organization_id is not None
        )


class IsSelfOrHRAdmin(BasePermission):
    """
    Allow access if the user is viewing/editing their own resource,
    or if they are HR/Admin in the same organization.
    Requires the view to have a `get_object()` that returns an object
    with a `user` or `employee.user` attribute.
    """

    message = "You can only access your own data or you need HR/Admin privileges."

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if not hasattr(user, "employee"):
            return False

        # Check if accessing own resource
        obj_user_id = None
        if hasattr(obj, "user_id"):
            obj_user_id = obj.user_id
        elif hasattr(obj, "user"):
            obj_user_id = obj.user.id if obj.user else None
        elif hasattr(obj, "employee"):
            obj_user_id = obj.employee.user_id if obj.employee else None

        if obj_user_id and obj_user_id == user.id:
            return True

        # Check if HR/Admin in same organization
        obj_org_id = None
        if hasattr(obj, "organization_id"):
            obj_org_id = obj.organization_id
        elif hasattr(obj, "employee") and obj.employee:
            obj_org_id = obj.employee.organization_id

        return (
            obj_org_id == user.employee.organization_id
            and user.employee.role in ("ADMIN", "HR")
        )
