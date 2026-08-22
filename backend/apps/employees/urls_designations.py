"""Designation URL routing."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.employees.views_designations import DesignationViewSet

app_name = "designations"

router = DefaultRouter()
router.register("", DesignationViewSet, basename="designation")

urlpatterns = [
    path("", include(router.urls)),
]
