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
    Ammunition transaction serializer
    """
    ammunition_display = serializers.CharField(source='ammunition.get_ammo_type_display', read_only=True)
    hunter_name = serializers.CharField(source='hunter.name', read_only=True)
    
    class Meta:
        model = AmmunitionTransaction
        fields = ['id', 'ammunition', 'ammunition_display', 'transaction_type', 
                 'quantity', 'hunter', 'hunter_name', 'timestamp', 'notes', 'reference_number']
        read_only_fields = ['timestamp']