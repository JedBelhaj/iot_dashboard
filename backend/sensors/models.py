"""
Sensors app models
"""
from django.db import models
from django.utils import timezone

class SensorReading(models.Model):
    """
    Sensor reading model for storing IoT sensor data
    """
    SENSOR_TYPES = [
        ('sound', 'Sound Level'),
        ('vibration', 'Vibration'),
        ('gps', 'GPS Location'),
        ('temperature', 'Temperature'),
        ('humidity', 'Humidity'),
    ]
    
    sensor_type = models.CharField(max_length=20, choices=SENSOR_TYPES)
    value = models.FloatField(help_text='Sensor reading value')
    unit = models.CharField(max_length=10, help_text='Unit of measurement (dB, Hz, °C, etc.)')
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Location data
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    location_name = models.CharField(max_length=100, blank=True)
    
    # Device information
    device_id = models.CharField(max_length=50, default='default_sensor')
    battery_level = models.FloatField(null=True, blank=True, help_text='Battery percentage')
    
    # Quality indicators
    signal_strength = models.FloatField(null=True, blank=True)
    is_anomaly = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.get_sensor_type_display()}: {self.value} {self.unit} at {self.timestamp}"
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['sensor_type', '-timestamp']),
            models.Index(fields=['device_id', '-timestamp']),
        ]

class SensorDevice(models.Model):
    """
    IoT sensor device model
    """
    STATUS_CHOICES = [
        ('online', 'Online'),
        ('offline', 'Offline'),
        ('maintenance', 'Maintenance'),
        ('error', 'Error'),
    ]
    
    device_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    sensor_type = models.CharField(max_length=20, choices=SensorReading.SENSOR_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='offline')
    
    # Location
    location_name = models.CharField(max_length=100)
    latitude = models.FloatField()
    longitude = models.FloatField()
    
    # Device info
    firmware_version = models.CharField(max_length=20, default='1.0.0')
    last_seen = models.DateTimeField(default=timezone.now)
    created_date = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} ({self.device_id})"
    
    @property
    def is_online(self):
        return self.status == 'online'
    
    class Meta:
        ordering = ['location_name', 'name']