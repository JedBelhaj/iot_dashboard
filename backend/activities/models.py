"""
Activities app models
"""
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

class Activity(models.Model):
    """
    Activity log model for tracking system events
    """
    ACTIVITY_TYPES = [
        ('shot_detected', 'Shot Detected'),
        ('hunter_registered', 'Hunter Registered'),
        ('ammunition_purchased', 'Ammunition Purchased'),
        ('sensor_alert', 'Sensor Alert'),
        ('device_online', 'Device Online'),
        ('device_offline', 'Device Offline'),
        ('low_stock_alert', 'Low Stock Alert'),
        ('system_maintenance', 'System Maintenance'),
    ]
    
    PRIORITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    activity_type = models.CharField(max_length=30, choices=ACTIVITY_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_LEVELS, default='medium')
    
    # Generic foreign key to link to any model
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Additional metadata
    location = models.CharField(max_length=100, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.get_activity_type_display()}: {self.title}"
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name_plural = 'Activities'

class SystemAlert(models.Model):
    """
    System alert model for critical notifications
    """
    ALERT_TYPES = [
        ('security', 'Security Alert'),
        ('maintenance', 'Maintenance Required'),
        ('low_battery', 'Low Battery'),
        ('sensor_malfunction', 'Sensor Malfunction'),
        ('unauthorized_access', 'Unauthorized Access'),
        ('network_issue', 'Network Issue'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('acknowledged', 'Acknowledged'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
    ]
    
    alert_type = models.CharField(max_length=30, choices=ALERT_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Related activity
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, null=True, blank=True)
    
    # Location and device info
    device_id = models.CharField(max_length=50, blank=True)
    location = models.CharField(max_length=100, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.get_alert_type_display()}: {self.title}"
    
    @property
    def is_active(self):
        return self.status == 'active'
    
    class Meta:
        ordering = ['-created_at']