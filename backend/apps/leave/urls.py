"""Leave URL routing."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.leave.views import LeaveTypeViewSet, LeaveBalanceViewSet, LeaveRequestViewSet

app_name = "leave"

router = DefaultRouter()
router.register("types", LeaveTypeViewSet, basename="leave-type")
router.register("balance", LeaveBalanceViewSet, basename="leave-balance")
router.register("requests", LeaveRequestViewSet, basename="leave-request")

urlpatterns = [
    path("", include(router.urls)),
]
