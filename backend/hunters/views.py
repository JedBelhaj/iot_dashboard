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
from .models import Hunter, Shot
from .serializers import HunterSerializer, ShotSerializer, HunterStatsSerializer

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
        summary="Record Shot for Hunter",
        description="Record a new shot fired by a specific hunter with sensor data including sound level, vibration, and GPS coordinates.",
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
        tags=['Hunters', 'Shots']
    )
    @action(detail=True, methods=['post'])
    def record_shot(self, request, pk=None):
        """
        Record a shot for a specific hunter with sensor data and location information
        """
        hunter = self.get_object()
        shot_data = request.data.copy()
        shot_data['hunter'] = hunter.id
        
        serializer = ShotSerializer(data=shot_data)
        if serializer.is_valid():
            serializer.save()
            
            # Update hunter's last_active
            hunter.last_active = timezone.now()
            hunter.save()
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
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
        
        # Today's shots
        total_shots_today = Shot.objects.filter(
            timestamp__date=today
        ).count()
        
        # Most active hunter
        most_active_hunter = Hunter.objects.annotate(
            shot_count=Count('shots')
        ).order_by('-shot_count').first()
        
        # Shots by weapon type
        shots_by_weapon = dict(
            Shot.objects.values('weapon_used').annotate(
                count=Count('id')
            ).values_list('weapon_used', 'count')
        )
        
        # Shots by location
        shots_by_location = dict(
            Shot.objects.values('location').annotate(
                count=Count('id')
            ).values_list('location', 'count')
        )
        
        stats_data = {
            'total_hunters': total_hunters,
            'active_hunters': active_hunters,
            'total_shots_today': total_shots_today,
            'most_active_hunter': most_active_hunter,
            'shots_by_weapon_type': shots_by_weapon,
            'shots_by_location': shots_by_location,
        }
        
        serializer = HunterStatsSerializer(stats_data)
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
        Get shots grouped by location
        """
        location = request.query_params.get('location')
        if location:
            shots = Shot.objects.filter(location__icontains=location)
        else:
            shots = Shot.objects.all()
        
        serializer = self.get_serializer(shots, many=True)
        return Response(serializer.data)