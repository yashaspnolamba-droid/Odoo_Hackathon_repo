"""
Notification views — list, mark read, mark all read.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema_view, extend_schema

from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationSerializer


@extend_schema_view(
    list=extend_schema(tags=["Notifications"]),
    retrieve=extend_schema(tags=["Notifications"]),
)
class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Notification API.
    Users can only see their own notifications.
    """

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["notification_type", "is_read"]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @extend_schema(tags=["Notifications"])
    @action(detail=True, methods=["patch"], url_path="read")
    def mark_read(self, request, pk=None):
        """PATCH /api/v1/notifications/{id}/read/ — mark single notification as read."""
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response(
            {"success": True, "message": "Notification marked as read."},
            status=status.HTTP_200_OK,
        )

    @extend_schema(tags=["Notifications"])
    @action(detail=False, methods=["patch"], url_path="read-all")
    def mark_all_read(self, request):
        """PATCH /api/v1/notifications/read-all/ — mark all as read."""
        count = Notification.objects.filter(
            user=request.user, is_read=False
        ).update(is_read=True)
        return Response(
            {"success": True, "message": f"{count} notifications marked as read."},
            status=status.HTTP_200_OK,
        )
