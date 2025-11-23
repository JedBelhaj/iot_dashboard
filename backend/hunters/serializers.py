"""
Hunters app serializers
"""
from rest_framework import serializers
from .models import Hunter, Shot

class HunterSerializer(serializers.ModelSerializer):
    """
    Hunter model serializer
    """
    total_shots = serializers.ReadOnlyField()
    
    class Meta:
        model = Hunter
        fields = ['id', 'name', 'license_number', 'weapon_type', 'current_location', 
                 'is_active', 'latitude', 'longitude', 'registered_date', 
                 'last_active', 'total_shots']
        read_only_fields = ['registered_date', 'total_shots']

class ShotSerializer(serializers.ModelSerializer):
    """
    Shot model serializer
    """
    hunter_name = serializers.CharField(source='hunter.name', read_only=True)
    
    class Meta:
        model = Shot
        fields = ['id', 'hunter', 'hunter_name', 'timestamp', 'location', 
                 'sound_level', 'vibration_level', 'latitude', 'longitude', 
                 'weapon_used', 'notes']
        read_only_fields = ['timestamp']

class HunterStatsSerializer(serializers.Serializer):
    """
    Hunter statistics serializer
    """
    total_hunters = serializers.IntegerField()
    active_hunters = serializers.IntegerField()
    total_shots_today = serializers.IntegerField()
    most_active_hunter = HunterSerializer(read_only=True)
    shots_by_weapon_type = serializers.DictField()
    shots_by_location = serializers.DictField()