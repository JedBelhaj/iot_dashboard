"""
Hunters app models - Gun-based IoT system
"""
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Hunter(models.Model):
    """
    Hunter model representing registered hunters
    """
    name = models.CharField(max_length=100)
    license_number = models.CharField(max_length=50, unique=True)
    current_location = models.CharField(max_length=100, default='Unknown')
    is_active = models.BooleanField(default=True)
    registered_date = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(default=timezone.now)
    
    # GPS coordinates
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.name} ({self.license_number})"
    
    @property
    def total_shots(self):
        return Shot.objects.filter(gun__owner=self).count()
    
    @property
    def total_guns(self):
        return self.guns.count()
    
    class Meta:
        ordering = ['-last_active']

class Gun(models.Model):
    """
    Gun/Weapon model representing individual firearms with IoT devices
    """
    WEAPON_TYPES = [
        ('rifle', 'Rifle'),
        ('shotgun', 'Shotgun'),
        ('handgun', 'Handgun'),
        ('bow', 'Bow'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('maintenance', 'Maintenance'),
        ('inactive', 'Inactive'),
        ('lost', 'Lost/Stolen'),
    ]
    
    # IoT Device Information
    device_id = models.CharField(max_length=50, unique=True, help_text='Unique IoT device identifier')
    
    # Gun Information
    serial_number = models.CharField(max_length=100, unique=True)
    make = models.CharField(max_length=50)
    model = models.CharField(max_length=50)
    caliber = models.CharField(max_length=20)
    weapon_type = models.CharField(max_length=20, choices=WEAPON_TYPES)
    
    # Ownership and Status
    owner = models.ForeignKey(Hunter, on_delete=models.CASCADE, related_name='guns')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Registration and Usage
    registered_date = models.DateTimeField(auto_now_add=True)
    last_used = models.DateTimeField(null=True, blank=True)
    
    # IoT Device Status
    firmware_version = models.CharField(max_length=20, blank=True)
    battery_level = models.IntegerField(default=100, help_text='Battery percentage 0-100')
    last_sync = models.DateTimeField(null=True, blank=True)
    
    # Additional Details
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.make} {self.model} ({self.device_id}) - {self.owner.name}"
    
    @property
    def total_shots(self):
        return self.shots.count()
    
    @property
    def is_low_battery(self):
        return self.battery_level < 20
    
    class Meta:
        ordering = ['-last_used', 'make', 'model']

class Shot(models.Model):
    """
    Shot model representing individual shots fired by IoT-enabled guns
    """
    gun = models.ForeignKey(Gun, on_delete=models.CASCADE, related_name='shots')
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Sensor data from IoT device
    sound_level = models.FloatField(help_text='Sound level in dB')
    vibration_level = models.FloatField(help_text='Vibration level in Hz')
    
    # GPS coordinates from device
    latitude = models.FloatField()
    longitude = models.FloatField()
    
    # Additional metadata
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"Shot from {self.gun.device_id} by {self.gun.owner.name} at {self.timestamp}"
    
    @property
    def hunter(self):
        """Backward compatibility property"""
        return self.gun.owner
    
    @property
    def hunter_name(self):
        return self.gun.owner.name
    
    @property
    def weapon_used(self):
        return self.gun.weapon_type
    
    @property
    def location(self):
        """Generate location from coordinates"""
        return f"{self.latitude:.4f}, {self.longitude:.4f}"
    
    class Meta:
        ordering = ['-timestamp']