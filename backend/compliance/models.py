from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal

class HuntingZone(models.Model):
    """Legal hunting areas with time restrictions"""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Geographic boundaries (simplified polygon)
    center_latitude = models.DecimalField(max_digits=10, decimal_places=8)
    center_longitude = models.DecimalField(max_digits=11, decimal_places=8)
    radius_km = models.DecimalField(max_digits=5, decimal_places=2)  # Radius in kilometers
    
    # Time restrictions
    season_start = models.DateField()
    season_end = models.DateField()
    daily_start_time = models.TimeField()
    daily_end_time = models.TimeField()
    
    # Days of week (0=Monday, 6=Sunday)
    allowed_weekdays = models.CharField(
        max_length=20,
        default="1,2,3,4,5,6,0",  # Default: all days
        help_text="Comma-separated weekday numbers (0=Monday, 6=Sunday)"
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} ({self.season_start} - {self.season_end})"

class AmmunitionPurchase(models.Model):
    """Track ammunition purchases by hunters"""
    hunter = models.ForeignKey('hunters.Hunter', on_delete=models.CASCADE)
    ammo_type = models.CharField(max_length=50)
    quantity = models.PositiveIntegerField()
    purchase_date = models.DateTimeField(default=timezone.now)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2)
    vendor = models.CharField(max_length=200)
    receipt_number = models.CharField(max_length=100, blank=True)
    
    # Track usage
    used_quantity = models.PositiveIntegerField(default=0)
    
    @property
    def remaining_quantity(self):
        return self.quantity - self.used_quantity
    
    @property
    def is_depleted(self):
        return self.used_quantity >= self.quantity
    
    def __str__(self):
        return f"{self.hunter.name} - {self.ammo_type} ({self.quantity} units)"

class ComplianceViolation(models.Model):
    """Track hunting violations and compliance issues"""
    VIOLATION_TYPES = [
        ('AMMO_EXCESS', 'Shot more ammunition than purchased'),
        ('ILLEGAL_ZONE', 'Shot in restricted/illegal area'),
        ('ILLEGAL_TIME', 'Shot outside permitted hours'),
        ('ILLEGAL_DATE', 'Shot outside hunting season'),
        ('UNLICENSED', 'Hunter license expired or invalid'),
        ('WEAPON_UNREGISTERED', 'Used unregistered weapon'),
    ]
    
    SEVERITY_LEVELS = [
        ('LOW', 'Minor infraction'),
        ('MEDIUM', 'Significant violation'),
        ('HIGH', 'Serious offense'),
        ('CRITICAL', 'Criminal activity suspected'),
    ]
    
    hunter = models.ForeignKey('hunters.Hunter', on_delete=models.CASCADE)
    violation_type = models.CharField(max_length=20, choices=VIOLATION_TYPES)
    severity = models.CharField(max_length=10, choices=SEVERITY_LEVELS)
    
    # Related objects
    shot = models.ForeignKey('hunters.Shot', on_delete=models.CASCADE, null=True, blank=True)
    gun = models.ForeignKey('hunters.Gun', on_delete=models.CASCADE, null=True, blank=True)
    hunting_zone = models.ForeignKey(HuntingZone, on_delete=models.CASCADE, null=True, blank=True)
    
    description = models.TextField()
    detected_at = models.DateTimeField(default=timezone.now)
    resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    
    # Evidence data
    evidence_data = models.JSONField(default=dict, blank=True)
    
    def __str__(self):
        return f"{self.hunter.name} - {self.get_violation_type_display()} ({self.severity})"

class HunterLicense(models.Model):
    """Track hunter licenses and renewals"""
    hunter = models.OneToOneField('hunters.Hunter', on_delete=models.CASCADE, related_name='license')
    license_number = models.CharField(max_length=50, unique=True)
    issue_date = models.DateField()
    expiry_date = models.DateField()
    license_type = models.CharField(max_length=50)
    issuing_authority = models.CharField(max_length=200)
    
    # Restrictions
    max_daily_shots = models.PositiveIntegerField(default=50)
    allowed_weapon_types = models.CharField(
        max_length=200,
        default="rifle,shotgun,bow",
        help_text="Comma-separated weapon types"
    )
    
    is_suspended = models.BooleanField(default=False)
    suspension_reason = models.TextField(blank=True)
    
    @property
    def is_valid(self):
        return not self.is_suspended and self.expiry_date >= timezone.now().date()
    
    @property
    def days_until_expiry(self):
        return (self.expiry_date - timezone.now().date()).days
    
    def __str__(self):
        return f"{self.hunter.name} - {self.license_number}"