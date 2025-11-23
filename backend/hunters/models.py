"""
Hunters app models
"""
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Hunter(models.Model):
    """
    Hunter model representing registered hunters
    """
    WEAPON_CHOICES = [
        ('rifle', 'Rifle'),
        ('shotgun', 'Shotgun'),
        ('handgun', 'Handgun'),
        ('bow', 'Bow'),
    ]
    
    name = models.CharField(max_length=100)
    license_number = models.CharField(max_length=50, unique=True)
    weapon_type = models.CharField(max_length=20, choices=WEAPON_CHOICES)
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
        return self.shots.count()
    
    class Meta:
        ordering = ['-last_active']

class Shot(models.Model):
    """
    Shot model representing individual shots fired
    """
    hunter = models.ForeignKey(Hunter, on_delete=models.CASCADE, related_name='shots')
    timestamp = models.DateTimeField(auto_now_add=True)
    location = models.CharField(max_length=100)
    
    # Sensor data at time of shot
    sound_level = models.FloatField(help_text='Sound level in dB')
    vibration_level = models.FloatField(help_text='Vibration level in Hz')
    
    # GPS coordinates
    latitude = models.FloatField()
    longitude = models.FloatField()
    
    # Additional metadata
    weapon_used = models.CharField(max_length=20, choices=Hunter.WEAPON_CHOICES)
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"Shot by {self.hunter.name} at {self.timestamp}"
    
    class Meta:
        ordering = ['-timestamp']