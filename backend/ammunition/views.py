"""
Ammunition app views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from .models import Ammunition, AmmunitionTransaction
from .serializers import AmmunitionSerializer, AmmunitionTransactionSerializer

class AmmunitionViewSet(viewsets.ModelViewSet):
    """
    Ammunition CRUD operations
    """
    queryset = Ammunition.objects.all()
    serializer_class = AmmunitionSerializer
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """
        Get low stock ammunition
        """
        low_stock = Ammunition.objects.filter(
            quantity__lte=models.F('minimum_stock')
        )
        serializer = self.get_serializer(low_stock, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def inventory_summary(self, request):
        """
        Get ammunition inventory summary
        """
        summary = {}
        
        # Total by ammo type
        ammo_totals = Ammunition.objects.values('ammo_type').annotate(
            total_quantity=Sum('quantity')
        )
        
        for item in ammo_totals:
            ammo_type = item['ammo_type']
            ammunition_obj = Ammunition.objects.filter(ammo_type=ammo_type).first()
            summary[ammo_type] = {
                'total_quantity': item['total_quantity'],
                'display_name': ammunition_obj.get_ammo_type_display() if ammunition_obj else ammo_type,
                'locations': list(Ammunition.objects.filter(
                    ammo_type=ammo_type
                ).values_list('location', flat=True).distinct())
            }
        
        return Response(summary)
    
    @action(detail=True, methods=['post'])
    def add_stock(self, request, pk=None):
        """
        Add stock to ammunition
        """
        ammunition = self.get_object()
        quantity = request.data.get('quantity', 0)
        
        if quantity > 0:
            ammunition.quantity += quantity
            ammunition.save()
            
            # Create transaction record
            AmmunitionTransaction.objects.create(
                ammunition=ammunition,
                transaction_type='purchase',
                quantity=quantity,
                notes=f"Stock added via API: {quantity} rounds"
            )
            
            serializer = self.get_serializer(ammunition)
            return Response(serializer.data)
        
        return Response(
            {'error': 'Quantity must be positive'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

class AmmunitionTransactionViewSet(viewsets.ModelViewSet):
    """
    Ammunition transaction CRUD operations
    """
    queryset = AmmunitionTransaction.objects.all()
    serializer_class = AmmunitionTransactionSerializer
    
    def perform_create(self, serializer):
        """
        Update ammunition quantity when creating transaction
        """
        transaction = serializer.save()
        ammunition = transaction.ammunition
        
        # Update ammunition quantity based on transaction type
        if transaction.transaction_type in ['purchase']:
            ammunition.quantity += abs(transaction.quantity)
        elif transaction.transaction_type in ['usage', 'loss']:
            ammunition.quantity -= abs(transaction.quantity)
            ammunition.quantity = max(0, ammunition.quantity)  # Prevent negative
        
        ammunition.save()