"""Department URL routing."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.employees.views_departments import DepartmentViewSet

app_name = "departments"

router = DefaultRouter()
router.register("", DepartmentViewSet, basename="department")

urlpatterns = [
    path("", include(router.urls)),
]
