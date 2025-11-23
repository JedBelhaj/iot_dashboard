"""
Ammunition app models
"""
from django.db import models
from django.utils import timezone
from hunters.models import Hunter

class Ammunition(models.Model):
    """
    Ammunition inventory model
    """
    AMMO_TYPES = [
        ('308', '.308 Winchester'),
        ('12g', '12 Gauge'),
        ('9mm', '9mm Parabellum'),
        ('22lr', '.22 LR'),
        ('223', '.223 Remington'),
        ('30-06', '.30-06 Springfield'),
        ('45acp', '.45 ACP'),
        ('270', '.270 Winchester'),
    ]
    
    ammo_type = models.CharField(max_length=10, choices=AMMO_TYPES)
    quantity = models.PositiveIntegerField()
    location = models.CharField(max_length=100, default='Main Storage')
    
    # Purchase information
    purchase_date = models.DateTimeField(auto_now_add=True)
    cost_per_unit = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    supplier = models.CharField(max_length=100, blank=True)
    
    # Inventory management
    minimum_stock = models.PositiveIntegerField(default=100)
    expiry_date = models.DateField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.get_ammo_type_display()}: {self.quantity} rounds"
    
    @property
    def is_low_stock(self):
        return self.quantity <= self.minimum_stock
    
    @property
    def total_cost(self):
        if self.cost_per_unit:
            return self.quantity * self.cost_per_unit
        return 0
    
    class Meta:
        ordering = ['ammo_type', '-purchase_date']

class AmmunitionTransaction(models.Model):
    """
    Ammunition transaction model for tracking purchases and usage
    """
    TRANSACTION_TYPES = [
        ('purchase', 'Purchase'),
        ('usage', 'Usage'),
        ('transfer', 'Transfer'),
        ('loss', 'Loss/Damage'),
    ]
    
    ammunition = models.ForeignKey(Ammunition, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    quantity = models.IntegerField(help_text='Positive for additions, negative for subtractions')
    
    # Related entities
    hunter = models.ForeignKey(Hunter, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Transaction details
    timestamp = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    reference_number = models.CharField(max_length=50, blank=True)
    
    def __str__(self):
        return f"{self.get_transaction_type_display()}: {self.quantity} {self.ammunition.get_ammo_type_display()}"
    
    class Meta:
        ordering = ['-timestamp']