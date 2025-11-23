"""
Hunters app admin configuration
"""
from django.contrib import admin
from .models import Hunter, Gun, Shot

@admin.register(Hunter)
class HunterAdmin(admin.ModelAdmin):
    list_display = ('name', 'license_number', 'current_location', 'is_active', 'total_shots', 'total_guns', 'last_active')
    list_filter = ('is_active', 'current_location', 'registered_date')
    search_fields = ('name', 'license_number')
    readonly_fields = ('registered_date', 'total_shots', 'total_guns')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'license_number')
        }),
        ('Location & Status', {
            'fields': ('current_location', 'latitude', 'longitude', 'is_active')
        }),
        ('Statistics', {
            'fields': ('total_shots', 'total_guns'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('registered_date', 'last_active'),
            'classes': ('collapse',)
        })
    )

@admin.register(Gun)
class GunAdmin(admin.ModelAdmin):
    list_display = ('device_id', 'make', 'model', 'weapon_type', 'owner', 'status', 'battery_level', 'total_shots')
    list_filter = ('weapon_type', 'status', 'make', 'registered_date')
    search_fields = ('device_id', 'serial_number', 'make', 'model', 'owner__name')
    readonly_fields = ('registered_date', 'total_shots', 'is_low_battery')
    
    fieldsets = (
        ('Gun Information', {
            'fields': ('device_id', 'serial_number', 'make', 'model', 'caliber', 'weapon_type')
        }),
        ('Ownership', {
            'fields': ('owner', 'status')
        }),
        ('IoT Device Status', {
            'fields': ('firmware_version', 'battery_level', 'is_low_battery', 'last_sync')
        }),
        ('Statistics', {
            'fields': ('total_shots', 'last_used'),
            'classes': ('collapse',)
        }),
        ('Additional Details', {
            'fields': ('notes', 'registered_date'),
            'classes': ('collapse',)
        })
    )

@admin.register(Shot)
class ShotAdmin(admin.ModelAdmin):
    list_display = ('gun', 'hunter_name', 'timestamp', 'weapon_used', 'sound_level', 'vibration_level')
    list_filter = ('gun__weapon_type', 'timestamp', 'gun__owner')
    search_fields = ('gun__device_id', 'gun__owner__name', 'gun__owner__license_number')
    readonly_fields = ('timestamp', 'hunter_name', 'weapon_used', 'location')
    
    def hunter_name(self, obj):
        return obj.gun.owner.name
    hunter_name.short_description = 'Hunter'
    
    fieldsets = (
        ('Shot Information', {
            'fields': ('gun', 'hunter_name', 'weapon_used', 'notes')
        }),
        ('Sensor Data', {
            'fields': ('sound_level', 'vibration_level', 'latitude', 'longitude', 'location')
        }),
        ('Timestamp', {
            'fields': ('timestamp',),
            'classes': ('collapse',)
        })
    )