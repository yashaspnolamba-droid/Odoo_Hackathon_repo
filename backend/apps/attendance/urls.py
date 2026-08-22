"""Attendance URL routing."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.attendance.views import AttendanceViewSet, AttendanceCorrectionViewSet

app_name = "attendance"

router = DefaultRouter()
router.register("records", AttendanceViewSet, basename="attendance-record")
router.register("corrections", AttendanceCorrectionViewSet, basename="attendance-correction")

urlpatterns = [
    path("check-in/", AttendanceViewSet.as_view({"post": "check_in"}), name="check-in"),
    path("check-out/", AttendanceViewSet.as_view({"post": "check_out"}), name="check-out"),
    path("", include(router.urls)),
]
