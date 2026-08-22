from django.contrib import admin
from apps.organizations.models import Organization


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "organization_code", "email", "timezone", "is_active", "created_at")
    list_filter = ("is_active", "timezone")
    search_fields = ("name", "organization_code", "email")
    readonly_fields = ("id", "created_at", "updated_at")
