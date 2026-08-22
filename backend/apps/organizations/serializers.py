"""
Organization serializers.
"""
from rest_framework import serializers
from apps.organizations.models import Organization


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = [
            "id", "name", "organization_code", "email", "phone",
            "address", "timezone", "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "organization_code", "created_at", "updated_at"]


class OrganizationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""

    class Meta:
        model = Organization
        fields = ["id", "name", "organization_code", "is_active"]
