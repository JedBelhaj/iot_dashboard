from rest_framework import serializers
from .models import HuntingZone, AmmunitionPurchase, ComplianceViolation, HunterLicense

class HuntingZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = HuntingZone
        fields = '__all__'

class AmmunitionPurchaseSerializer(serializers.ModelSerializer):
    hunter_name = serializers.CharField(source='hunter.name', read_only=True)
    remaining_quantity = serializers.ReadOnlyField()
    is_depleted = serializers.ReadOnlyField()
    
    class Meta:
        model = AmmunitionPurchase
        fields = '__all__'

class ComplianceViolationSerializer(serializers.ModelSerializer):
    hunter_name = serializers.CharField(source='hunter.name', read_only=True)
    violation_type_display = serializers.CharField(source='get_violation_type_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    
    class Meta:
        model = ComplianceViolation
        fields = '__all__'

class HunterLicenseSerializer(serializers.ModelSerializer):
    hunter_name = serializers.CharField(source='hunter.name', read_only=True)
    is_valid = serializers.ReadOnlyField()
    days_until_expiry = serializers.ReadOnlyField()
    
    class Meta:
        model = HunterLicense
        fields = '__all__'