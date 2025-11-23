"""
Ammunition app serializers
"""
from rest_framework import serializers
from .models import Ammunition, AmmunitionTransaction

class AmmunitionSerializer(serializers.ModelSerializer):
    """
    Ammunition serializer
    """
    ammo_type_display = serializers.CharField(source='get_ammo_type_display', read_only=True)
    is_low_stock = serializers.ReadOnlyField()
    total_cost = serializers.ReadOnlyField()
    
    class Meta:
        model = Ammunition
        fields = ['id', 'ammo_type', 'ammo_type_display', 'quantity', 'location', 
                 'purchase_date', 'cost_per_unit', 'supplier', 'minimum_stock', 
                 'expiry_date', 'is_low_stock', 'total_cost']
        read_only_fields = ['purchase_date', 'is_low_stock', 'total_cost']

class AmmunitionTransactionSerializer(serializers.ModelSerializer):
    """
    Ammunition transaction serializer for bought, sold, and shot bullets
    """
    ammunition_display = serializers.CharField(source='ammunition.get_ammo_type_display', read_only=True)
    hunter_name = serializers.CharField(source='hunter.name', read_only=True)
    gun_device_id = serializers.CharField(source='gun.device_id', read_only=True)
    net_quantity = serializers.ReadOnlyField()
    
    class Meta:
        model = AmmunitionTransaction
        fields = ['id', 'ammunition', 'ammunition_display', 'transaction_type', 
                 'quantity', 'hunter', 'hunter_name', 'gun', 'gun_device_id',
                 'unit_price', 'total_cost', 'timestamp', 'notes', 'reference_number', 
                 'supplier', 'net_quantity']
        read_only_fields = ['timestamp', 'total_cost', 'net_quantity']