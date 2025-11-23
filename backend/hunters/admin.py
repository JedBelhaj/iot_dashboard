"""
Hunters app admin configuration
"""
from django.contrib import admin
from .models import Hunter, Shot

@admin.register(Hunter)
class HunterAdmin(admin.ModelAdmin):
    list_display = ('name', 'license_number', 'weapon_type', 'current_location', 'is_active', 'total_shots', 'last_active')
    list_filter = ('weapon_type', 'is_active', 'current_location', 'registered_date')
    search_fields = ('name', 'license_number')
    readonly_fields = ('registered_date', 'total_shots')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'license_number', 'weapon_type')
        }),
        ('Location & Status', {
            'fields': ('current_location', 'latitude', 'longitude', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('registered_date', 'last_active'),
            'classes': ('collapse',)
        })
    )

@admin.register(Shot)
class ShotAdmin(admin.ModelAdmin):
    list_display = ('hunter', 'timestamp', 'location', 'weapon_used', 'sound_level', 'vibration_level')
    list_filter = ('weapon_used', 'location', 'timestamp')
    search_fields = ('hunter__name', 'hunter__license_number', 'location')
    readonly_fields = ('timestamp',)
    
    fieldsets = (
        ('Shot Information', {
            'fields': ('hunter', 'location', 'weapon_used', 'notes')
        }),
        ('Sensor Data', {
            'fields': ('sound_level', 'vibration_level', 'latitude', 'longitude')
        }),
        ('Timestamp', {
            'fields': ('timestamp',),
            'classes': ('collapse',)
        })
    )