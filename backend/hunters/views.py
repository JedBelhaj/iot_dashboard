"""
Hunters app views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiResponse, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from .models import Hunter, Gun, Shot
from .serializers import HunterSerializer, GunSerializer, ShotSerializer, HunterStatsSerializer

@extend_schema_view(
    list=extend_schema(
        summary="List All Hunters",
        description="Retrieve a paginated list of all registered hunters with their details.",
        tags=['Hunters']
    ),
    retrieve=extend_schema(
        summary="Get Hunter Details", 
        description="Retrieve detailed information about a specific hunter including their profile and statistics.",
        tags=['Hunters']
    ),
    create=extend_schema(
        summary="Register New Hunter",
        description="Register a new hunter in the system with license information and weapon type.",
        tags=['Hunters']
    ),
    update=extend_schema(
        summary="Update Hunter Information",
        description="Update all fields of an existing hunter's profile.",
        tags=['Hunters']
    ),
    partial_update=extend_schema(
        summary="Partially Update Hunter",
        description="Update specific fields of an existing hunter's profile.",
        tags=['Hunters']
    ),
    destroy=extend_schema(
        summary="Remove Hunter",
        description="Remove a hunter from the system (soft delete recommended).",
        tags=['Hunters']
    )
)
class HunterViewSet(viewsets.ModelViewSet):
    """
    Complete CRUD operations for hunter management including registration, 
    profile updates, shot tracking, and statistics retrieval.
    """
    queryset = Hunter.objects.all()
    serializer_class = HunterSerializer
    
    @extend_schema(
        summary="Get Active Hunters",
        description="Retrieve all currently active hunters who are available for hunting activities.",
        responses={
            200: HunterSerializer(many=True)
        },
        tags=['Hunters']
    )
    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Get all active hunters currently available for hunting activities
        """
        active_hunters = Hunter.objects.filter(is_active=True)
        serializer = self.get_serializer(active_hunters, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Get Hunter's Guns",
        description="Retrieve all guns registered to a specific hunter.",
        responses={
            200: GunSerializer(many=True)
        },
        tags=['Hunters', 'Guns']
    )
    @action(detail=True, methods=['get'])
    def guns(self, request, pk=None):
        """
        Get all guns registered to a specific hunter
        """
        hunter = self.get_object()
        guns = hunter.guns.all()
        serializer = GunSerializer(guns, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Get Hunter Statistics",
        description="Retrieve comprehensive statistics about hunters including counts, activity levels, and shot analytics.",
        responses={
            200: OpenApiResponse(
                response=OpenApiTypes.OBJECT,
                description="Hunter statistics retrieved successfully",
                examples=[
                    OpenApiExample(
                        'Statistics Response',
                        value={
                            'total_hunters': 25,
                            'active_hunters': 18,
                            'shots_today': 12,
                            'avg_shots_per_hunter': 8.4,
                            'most_active_hunter': 'John Smith',
                            'top_locations': ['Forest Area A', 'Mountain Ridge B']
                        }
                    )
                ]
            )
        },
        tags=['Hunters', 'Statistics']
    )
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get comprehensive hunter statistics and activity analytics
        """
        today = timezone.now().date()
        
        # Basic counts
        total_hunters = Hunter.objects.count()
        active_hunters = Hunter.objects.filter(is_active=True).count()
        total_guns = Gun.objects.count()
        active_guns = Gun.objects.filter(status='active').count()
        
        # Today's shots
        total_shots_today = Shot.objects.filter(
            timestamp__date=today
        ).count()
        
        # Most active hunter (by shots from their guns)
        most_active_hunter = Hunter.objects.annotate(
            shot_count=Count('guns__shots')
        ).order_by('-shot_count').first()
        
        # Shots by weapon type (from gun)
        shots_by_weapon = dict(
            Shot.objects.values('gun__weapon_type').annotate(
                count=Count('id')
            ).values_list('gun__weapon_type', 'count')
        )
        
        # Shots by location (using generated location property)
        shots_by_location = {}
        shots = Shot.objects.all()
        for shot in shots:
            location = shot.location  # Uses the property that generates from coordinates
            shots_by_location[location] = shots_by_location.get(location, 0) + 1
        
        stats_data = {
            'total_hunters': total_hunters,
            'active_hunters': active_hunters,
            'total_guns': total_guns,
            'active_guns': active_guns,
            'total_shots_today': total_shots_today,
            'most_active_hunter': most_active_hunter,
            'shots_by_weapon_type': shots_by_weapon,
            'shots_by_location': shots_by_location,
        }
        
        serializer = HunterStatsSerializer(stats_data)
        return Response(serializer.data)

@extend_schema_view(
    list=extend_schema(
        summary="List All Guns",
        description="Retrieve a paginated list of all registered guns with their details.",
        tags=['Guns']
    ),
    retrieve=extend_schema(
        summary="Get Gun Details", 
        description="Retrieve detailed information about a specific gun including owner and shot history.",
        tags=['Guns']
    ),
    create=extend_schema(
        summary="Register New Gun",
        description="Register a new gun/weapon with IoT device in the system.",
        tags=['Guns']
    ),
    update=extend_schema(
        summary="Update Gun Information",
        description="Update all fields of an existing gun's information.",
        tags=['Guns']
    ),
    partial_update=extend_schema(
        summary="Partially Update Gun",
        description="Update specific fields of an existing gun's information.",
        tags=['Guns']
    ),
    destroy=extend_schema(
        summary="Remove Gun",
        description="Remove a gun from the system.",
        tags=['Guns']
    )
)
class GunViewSet(viewsets.ModelViewSet):
    """
    Complete CRUD operations for gun/weapon management including registration,
    updates, shot recording, and device status monitoring.
    """
    queryset = Gun.objects.all()
    serializer_class = GunSerializer
    
    @extend_schema(
        summary="Record Shot from Gun",
        description="Record a new shot fired by this specific gun with IoT sensor data.",
        request=ShotSerializer,
        responses={
            201: OpenApiResponse(
                response=ShotSerializer,
                description="Shot recorded successfully"
            ),
            400: OpenApiResponse(
                response=OpenApiTypes.OBJECT,
                description="Invalid shot data provided"
            )
        },
        tags=['Guns', 'Shots']
    )
    @action(detail=True, methods=['post'])
    def record_shot(self, request, pk=None):
        """
        Record a shot fired by this gun with IoT sensor data
        """
        gun = self.get_object()
        shot_data = request.data.copy()
        shot_data['gun'] = gun.id
        
        serializer = ShotSerializer(data=shot_data)
        if serializer.is_valid():
            shot = serializer.save()
            
            # Update gun's last_used and owner's last_active
            gun.last_used = timezone.now()
            gun.save()
            
            gun.owner.last_active = timezone.now()
            gun.owner.save()
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @extend_schema(
        summary="Update Gun Device Status",
        description="Update IoT device status information like battery level and firmware version.",
        request=OpenApiTypes.OBJECT,
        responses={
            200: GunSerializer
        },
        tags=['Guns', 'IoT']
    )
    @action(detail=True, methods=['patch'])
    def update_device_status(self, request, pk=None):
        """
        Update IoT device status (battery, firmware, sync time)
        """
        gun = self.get_object()
        
        # Update device-related fields
        if 'battery_level' in request.data:
            gun.battery_level = request.data['battery_level']
        if 'firmware_version' in request.data:
            gun.firmware_version = request.data['firmware_version']
        
        gun.last_sync = timezone.now()
        gun.save()
        
        serializer = self.get_serializer(gun)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Get Low Battery Guns",
        description="Retrieve all guns with low battery levels that need attention.",
        responses={
            200: GunSerializer(many=True)
        },
        tags=['Guns', 'IoT']
    )
    @action(detail=False, methods=['get'])
    def low_battery(self, request):
        """
        Get all guns with low battery levels
        """
        low_battery_guns = Gun.objects.filter(battery_level__lt=20, status='active')
        serializer = self.get_serializer(low_battery_guns, many=True)
        return Response(serializer.data)

class ShotViewSet(viewsets.ModelViewSet):
    """
    Shot CRUD operations
    """
    queryset = Shot.objects.all()
    serializer_class = ShotSerializer
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """
        Get recent shots (last 24 hours)
        """
        yesterday = timezone.now() - timedelta(days=1)
        recent_shots = Shot.objects.filter(timestamp__gte=yesterday)
        serializer = self.get_serializer(recent_shots, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_location(self, request):
        """
        Get shots grouped by location coordinates
        """
        lat = request.query_params.get('latitude')
        lng = request.query_params.get('longitude')
        radius = request.query_params.get('radius', 0.01)  # Default ~1km radius
        
        if lat and lng:
            # Simple bounding box search
            lat_min = float(lat) - float(radius)
            lat_max = float(lat) + float(radius) 
            lng_min = float(lng) - float(radius)
            lng_max = float(lng) + float(radius)
            
            shots = Shot.objects.filter(
                latitude__gte=lat_min, latitude__lte=lat_max,
                longitude__gte=lng_min, longitude__lte=lng_max
            )
        else:
            shots = Shot.objects.all()
        
        serializer = self.get_serializer(shots, many=True)
        return Response(serializer.data)