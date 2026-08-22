"""Employee URL routing."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.employees.views import EmployeeViewSet
from apps.employees.views_history import EmploymentHistoryViewSet
from apps.employees.views_documents import EmployeeDocumentViewSet

app_name = "employees"

router = DefaultRouter()
router.register("history", EmploymentHistoryViewSet, basename="employment-history")
router.register("documents", EmployeeDocumentViewSet, basename="employee-document")
router.register("", EmployeeViewSet, basename="employee")

urlpatterns = [
    path("", include(router.urls)),
]
