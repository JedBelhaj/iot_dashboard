"""
Activities app views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Activity, SystemAlert
from .serializers import ActivitySerializer, SystemAlertSerializer

class ActivityViewSet(viewsets.ModelViewSet):
    """
    Activity CRUD operations
    """
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    
    def get_queryset(self):
        queryset = Activity.objects.all()
        activity_type = self.request.query_params.get('activity_type')
        is_read = self.request.query_params.get('is_read')
        
        if activity_type:
            queryset = queryset.filter(activity_type=activity_type)
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')
            
        return queryset
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """
        Get recent activities (last 50)
        """
        recent = Activity.objects.all()[:50]
        serializer = self.get_serializer(recent, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """
        Mark all activities as read
        """
        Activity.objects.filter(is_read=False).update(is_read=True)
        return Response({'message': 'All activities marked as read'})
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """
        Mark specific activity as read
        """
        activity = self.get_object()
        activity.is_read = True
        activity.save()
        
        serializer = self.get_serializer(activity)
        return Response(serializer.data)

class SystemAlertViewSet(viewsets.ModelViewSet):
    """
    System alert CRUD operations
    """
    queryset = SystemAlert.objects.all()
    serializer_class = SystemAlertSerializer
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Get active alerts
        """
        active_alerts = SystemAlert.objects.filter(status='active')
        serializer = self.get_serializer(active_alerts, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """
        Acknowledge an alert
        """
        alert = self.get_object()
        alert.status = 'acknowledged'
        alert.acknowledged_at = timezone.now()
        alert.save()
        
        serializer = self.get_serializer(alert)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """
        Resolve an alert
        """
        alert = self.get_object()
        alert.status = 'resolved'
        alert.resolved_at = timezone.now()
        alert.save()
        
        serializer = self.get_serializer(alert)
        return Response(serializer.data)