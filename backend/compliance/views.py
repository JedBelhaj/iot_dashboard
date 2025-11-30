from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Sum, Count, F
from django.utils import timezone
from datetime import timedelta
from .models import HuntingZone, AmmunitionPurchase, ComplianceViolation, HunterLicense
from .serializers import HuntingZoneSerializer, AmmunitionPurchaseSerializer, ComplianceViolationSerializer, HunterLicenseSerializer
from hunters.models import Hunter, Shot

class HuntingZoneViewSet(viewsets.ModelViewSet):
    queryset = HuntingZone.objects.all()
    serializer_class = HuntingZoneSerializer
    
    @action(detail=False, methods=['GET'])
    def active_zones(self, request):
        """Get currently active hunting zones"""
        current_time = timezone.now().time()
        current_day = timezone.now().weekday()
        
        active_zones = HuntingZone.objects.filter(
            is_active=True,
            allowed_days__contains=str(current_day)
        ).filter(
            Q(start_time__lte=current_time) & Q(end_time__gte=current_time)
        )
        
        serializer = self.get_serializer(active_zones, many=True)
        return Response(serializer.data)

class AmmunitionPurchaseViewSet(viewsets.ModelViewSet):
    queryset = AmmunitionPurchase.objects.all()
    serializer_class = AmmunitionPurchaseSerializer
    
    def get_queryset(self):
        """
        Filter ammunition purchases by hunter if provided
        """
        queryset = AmmunitionPurchase.objects.all().order_by('-purchase_date')
        hunter_id = self.request.query_params.get('hunter', None)
        if hunter_id is not None:
            queryset = queryset.filter(hunter_id=hunter_id)
        return queryset
    
    @action(detail=False, methods=['GET'])
    def usage_statistics(self, request):
        """Get ammunition usage statistics"""
        stats = AmmunitionPurchase.objects.aggregate(
            total_purchased=Sum('quantity'),
            total_used=Sum('quantity_used'),
            depleted_purchases=Count('id', filter=Q(is_depleted=True))
        )
        
        return Response({
            'total_purchased': stats['total_purchased'] or 0,
            'total_used': stats['total_used'] or 0,
            'total_remaining': (stats['total_purchased'] or 0) - (stats['total_used'] or 0),
            'depleted_purchases': stats['depleted_purchases'] or 0
        })
    
    @action(detail=False, methods=['GET'])
    def violations(self, request):
        """Get ammunition purchase violations (overuse)"""
        violations = AmmunitionPurchase.objects.filter(quantity_used__gt=F('quantity'))
        serializer = self.get_serializer(violations, many=True)
        return Response(serializer.data)

class ComplianceViolationViewSet(viewsets.ModelViewSet):
    queryset = ComplianceViolation.objects.all()
    serializer_class = ComplianceViolationSerializer
    
    def get_queryset(self):
        """
        Filter violations by hunter if provided
        """
        queryset = ComplianceViolation.objects.all().order_by('-detected_at')
        hunter_id = self.request.query_params.get('hunter', None)
        if hunter_id is not None:
            queryset = queryset.filter(hunter_id=hunter_id)
        return queryset
    
    @action(detail=False, methods=['GET'])
    def recent_violations(self, request):
        """Get violations from the last 30 days"""
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_violations = ComplianceViolation.objects.filter(
            detected_at__gte=thirty_days_ago
        ).order_by('-detected_at')
        
        serializer = self.get_serializer(recent_violations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['GET'])
    def violation_stats(self, request):
        """Get violation statistics"""
        stats = ComplianceViolation.objects.values('violation_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        severity_stats = ComplianceViolation.objects.values('severity').annotate(
            count=Count('id')
        )
        
        return Response({
            'by_type': list(stats),
            'by_severity': list(severity_stats),
            'total_violations': ComplianceViolation.objects.count()
        })

class HunterLicenseViewSet(viewsets.ModelViewSet):
    queryset = HunterLicense.objects.all()
    serializer_class = HunterLicenseSerializer
    
    def get_queryset(self):
        """
        Filter licenses by hunter if provided
        """
        queryset = HunterLicense.objects.all().order_by('-issue_date')
        hunter_id = self.request.query_params.get('hunter', None)
        if hunter_id is not None:
            queryset = queryset.filter(hunter_id=hunter_id)
        return queryset
    
    @action(detail=False, methods=['GET'])
    def expiring_soon(self, request):
        """Get licenses expiring in the next 30 days"""
        thirty_days_from_now = timezone.now().date() + timedelta(days=30)
        expiring_licenses = HunterLicense.objects.filter(
            expiry_date__lte=thirty_days_from_now,
            expiry_date__gte=timezone.now().date()
        ).order_by('expiry_date')
        
        serializer = self.get_serializer(expiring_licenses, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['GET'])
    def license_stats(self, request):
        """Get license statistics"""
        total_licenses = HunterLicense.objects.count()
        valid_licenses = HunterLicense.objects.filter(is_valid=True).count()
        expired_licenses = HunterLicense.objects.filter(
            expiry_date__lt=timezone.now().date()
        ).count()
        
        return Response({
            'total_licenses': total_licenses,
            'valid_licenses': valid_licenses,
            'expired_licenses': expired_licenses,
            'expiring_soon': HunterLicense.objects.filter(
                expiry_date__lte=timezone.now().date() + timedelta(days=30),
                expiry_date__gte=timezone.now().date()
            ).count()
        })

# Violation detection function
def check_compliance_violations(shot):
    """
    Check for compliance violations when a shot is fired
    This function should be called whenever a new Shot is created
    """
    violations = []
    
    # Check ammunition overuse
    hunter = shot.gun.owner
    total_shots = Shot.objects.filter(gun__owner=hunter).count()
    total_purchased = AmmunitionPurchase.objects.filter(hunter=hunter).aggregate(
        total=Sum('quantity')
    )['total'] or 0
    
    if total_shots > total_purchased:
        violation = ComplianceViolation.objects.create(
            hunter=hunter,
            violation_type='ammo_overuse',
            severity='high',
            description=f"Hunter has fired {total_shots} shots but only purchased {total_purchased} rounds",
            evidence={'shots_fired': total_shots, 'ammo_purchased': total_purchased}
        )
        violations.append(violation)
    
    # Check hunting zone violations
    current_time = timezone.now().time()
    current_day = timezone.now().weekday()
    
    # Check if shot location is in any active hunting zone
    shot_lat, shot_lng = shot.latitude, shot.longitude
    
    active_zones = HuntingZone.objects.filter(
        is_active=True,
        allowed_days__contains=str(current_day)
    ).filter(
        Q(start_time__lte=current_time) & Q(end_time__gte=current_time)
    )
    
    in_valid_zone = False
    for zone in active_zones:
        # Simple rectangular zone check (in real implementation, use proper geospatial queries)
        if (zone.min_latitude <= shot_lat <= zone.max_latitude and
            zone.min_longitude <= shot_lng <= zone.max_longitude):
            in_valid_zone = True
            break
    
    if not in_valid_zone:
        violation = ComplianceViolation.objects.create(
            hunter=hunter,
            violation_type='illegal_location',
            severity='high',
            description=f"Shot fired outside of permitted hunting zones",
            evidence={
                'shot_location': {'lat': shot_lat, 'lng': shot_lng},
                'timestamp': shot.timestamp.isoformat()
            }
        )
        violations.append(violation)
    
    # Check license validity
    try:
        license = HunterLicense.objects.get(hunter=hunter)
        if not license.is_valid:
            violation = ComplianceViolation.objects.create(
                hunter=hunter,
                violation_type='invalid_license',
                severity='critical',
                description=f"Hunter license is invalid or expired",
                evidence={'license_expiry': license.expiry_date.isoformat()}
            )
            violations.append(violation)
    except HunterLicense.DoesNotExist:
        violation = ComplianceViolation.objects.create(
            hunter=hunter,
            violation_type='no_license',
            severity='critical',
            description=f"Hunter has no valid license on record",
            evidence={'hunter_id': hunter.id}
        )
        violations.append(violation)
    
    return violations