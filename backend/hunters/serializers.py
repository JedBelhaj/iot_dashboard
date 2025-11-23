"""
Hunters app serializers
"""
from rest_framework import serializers
from .models import Hunter, Gun, Shot

class HunterSerializer(serializers.ModelSerializer):
    """
    Hunter model serializer
    """
    total_shots = serializers.ReadOnlyField()
    total_guns = serializers.ReadOnlyField()
    
    class Meta:
        model = Hunter
        fields = ['id', 'name', 'license_number', 'current_location', 
                 'is_active', 'latitude', 'longitude', 'registered_date', 
                 'last_active', 'total_shots', 'total_guns']
        read_only_fields = ['registered_date', 'total_shots', 'total_guns']

class GunSerializer(serializers.ModelSerializer):
    """
    Gun model serializer
    """
    owner_name = serializers.CharField(source='owner.name', read_only=True)
    total_shots = serializers.ReadOnlyField()
    is_low_battery = serializers.ReadOnlyField()
    
    class Meta:
        model = Gun
        fields = ['id', 'device_id', 'serial_number', 'make', 'model', 'caliber', 
                 'weapon_type', 'owner', 'owner_name', 'status', 'registered_date', 
                 'last_used', 'firmware_version', 'battery_level', 'last_sync', 
                 'notes', 'total_shots', 'is_low_battery']
        read_only_fields = ['registered_date', 'total_shots', 'is_low_battery']

class ShotSerializer(serializers.ModelSerializer):
    """
    Shot model serializer
    """
    hunter_name = serializers.CharField(source='gun.owner.name', read_only=True)
    weapon_used = serializers.CharField(source='gun.weapon_type', read_only=True)
    gun_device_id = serializers.CharField(source='gun.device_id', read_only=True)
    location = serializers.ReadOnlyField()
    
    class Meta:
        model = Shot
        fields = ['id', 'gun', 'gun_device_id', 'hunter_name', 'timestamp', 'location', 
                 'sound_level', 'vibration_level', 'latitude', 'longitude', 
                 'weapon_used', 'notes']
        read_only_fields = ['timestamp', 'location', 'hunter_name', 'weapon_used', 'gun_device_id']

class HunterStatsSerializer(serializers.Serializer):
    """
    Hunter statistics serializer
    """
    total_hunters = serializers.IntegerField()
    active_hunters = serializers.IntegerField()
    total_shots_today = serializers.IntegerField()
    total_guns = serializers.IntegerField()
    active_guns = serializers.IntegerField()
    most_active_hunter = HunterSerializer(read_only=True)
    shots_by_weapon_type = serializers.DictField()
    shots_by_location = serializers.DictField()