"""
Sensors app serializers
"""
from rest_framework import serializers
from .models import SensorReading, SensorDevice

class SensorReadingSerializer(serializers.ModelSerializer):
    """
    Sensor reading serializer
    """
    sensor_type_display = serializers.CharField(source='get_sensor_type_display', read_only=True)
    
    class Meta:
        model = SensorReading
        fields = ['id', 'sensor_type', 'sensor_type_display', 'value', 'unit', 
                 'timestamp', 'latitude', 'longitude', 'location_name', 
                 'device_id', 'battery_level', 'signal_strength', 'is_anomaly']
        read_only_fields = ['timestamp']

class SensorDeviceSerializer(serializers.ModelSerializer):
    """
    Sensor device serializer
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_online = serializers.ReadOnlyField()
    
    class Meta:
        model = SensorDevice
        fields = ['id', 'device_id', 'name', 'sensor_type', 'status', 
                 'status_display', 'is_online', 'location_name', 'latitude', 
                 'longitude', 'firmware_version', 'last_seen', 'created_date']
        read_only_fields = ['created_date', 'is_online']

class SensorStatsSerializer(serializers.Serializer):
    """
    Sensor statistics serializer
    """
    total_devices = serializers.IntegerField()
    online_devices = serializers.IntegerField()
    readings_today = serializers.IntegerField()
    average_readings = serializers.DictField()
    latest_readings = SensorReadingSerializer(many=True, read_only=True)
    device_status_breakdown = serializers.DictField()