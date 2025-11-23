"""
Sensors app admin configuration
"""
from django.contrib import admin
from .models import SensorReading, SensorDevice

@admin.register(SensorReading)
class SensorReadingAdmin(admin.ModelAdmin):
    list_display = ('sensor_type', 'value', 'unit', 'location_name', 'device_id', 'timestamp', 'is_anomaly')
    list_filter = ('sensor_type', 'device_id', 'location_name', 'is_anomaly', 'timestamp')
    search_fields = ('device_id', 'location_name')
    readonly_fields = ('timestamp',)
    
    fieldsets = (
        ('Sensor Data', {
            'fields': ('sensor_type', 'value', 'unit', 'device_id')
        }),
        ('Location', {
            'fields': ('latitude', 'longitude', 'location_name')
        }),
        ('Device Status', {
            'fields': ('battery_level', 'signal_strength', 'is_anomaly')
        }),
        ('Timestamp', {
            'fields': ('timestamp',),
            'classes': ('collapse',)
        })
    )

@admin.register(SensorDevice)
class SensorDeviceAdmin(admin.ModelAdmin):
    list_display = ('name', 'device_id', 'sensor_type', 'status', 'location_name', 'last_seen')
    list_filter = ('sensor_type', 'status', 'location_name')
    search_fields = ('name', 'device_id', 'location_name')
    readonly_fields = ('created_date',)
    
    fieldsets = (
        ('Device Information', {
            'fields': ('device_id', 'name', 'sensor_type', 'status', 'firmware_version')
        }),
        ('Location', {
            'fields': ('location_name', 'latitude', 'longitude')
        }),
        ('Timestamps', {
            'fields': ('last_seen', 'created_date'),
            'classes': ('collapse',)
        })
    )