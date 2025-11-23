"""
Activities app serializers
"""
from rest_framework import serializers
from .models import Activity, SystemAlert

class ActivitySerializer(serializers.ModelSerializer):
    """
    Activity serializer
    """
    activity_type_display = serializers.CharField(source='get_activity_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    class Meta:
        model = Activity
        fields = ['id', 'activity_type', 'activity_type_display', 'title', 
                 'description', 'priority', 'priority_display', 'location', 
                 'metadata', 'timestamp', 'is_read']
        read_only_fields = ['timestamp']

class SystemAlertSerializer(serializers.ModelSerializer):
    """
    System alert serializer
    """
    alert_type_display = serializers.CharField(source='get_alert_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_active = serializers.ReadOnlyField()
    
    class Meta:
        model = SystemAlert
        fields = ['id', 'alert_type', 'alert_type_display', 'title', 'message', 
                 'status', 'status_display', 'is_active', 'device_id', 'location', 
                 'created_at', 'acknowledged_at', 'resolved_at']
        read_only_fields = ['created_at', 'is_active']