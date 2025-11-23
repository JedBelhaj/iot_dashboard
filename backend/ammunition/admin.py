"""
Ammunition app admin configuration
"""
from django.contrib import admin
from .models import Ammunition, AmmunitionTransaction

@admin.register(Ammunition)
class AmmunitionAdmin(admin.ModelAdmin):
    list_display = ('ammo_type', 'quantity', 'location', 'is_low_stock', 'minimum_stock', 'purchase_date')
    list_filter = ('ammo_type', 'location', 'purchase_date')
    search_fields = ('ammo_type', 'location', 'supplier')
    readonly_fields = ('purchase_date', 'is_low_stock', 'total_cost')
    
    fieldsets = (
        ('Ammunition Details', {
            'fields': ('ammo_type', 'quantity', 'location', 'minimum_stock')
        }),
        ('Purchase Information', {
            'fields': ('cost_per_unit', 'supplier', 'purchase_date', 'total_cost')
        }),
        ('Expiry & Management', {
            'fields': ('expiry_date',)
        })
    )

@admin.register(AmmunitionTransaction)
class AmmunitionTransactionAdmin(admin.ModelAdmin):
    list_display = ('ammunition', 'transaction_type', 'quantity', 'hunter', 'timestamp')
    list_filter = ('transaction_type', 'ammunition__ammo_type', 'timestamp')
    search_fields = ('ammunition__ammo_type', 'hunter__name', 'reference_number', 'notes')
    readonly_fields = ('timestamp',)
    
    fieldsets = (
        ('Transaction Details', {
            'fields': ('ammunition', 'transaction_type', 'quantity', 'hunter')
        }),
        ('Additional Information', {
            'fields': ('reference_number', 'notes')
        }),
        ('Timestamp', {
            'fields': ('timestamp',),
            'classes': ('collapse',)
        })
    )