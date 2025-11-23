"""
Main API Views for dashboard statistics
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Sum
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from hunters.models import Hunter, Shot
from ammunition.models import Ammunition
from sensors.models import SensorReading
from activities.models import Activity

class DashboardStatsView(APIView):
    """
    Get overall dashboard statistics including active hunters, shots, ammunition, and locations.
    """
    
    @extend_schema(
        summary="Get Dashboard Statistics",
        description="Retrieve comprehensive dashboard statistics including active hunters count, total shots fired, ammunition inventory, and active hunting locations.",
        responses={
            200: OpenApiResponse(
                response=OpenApiTypes.OBJECT,
                description="Dashboard statistics retrieved successfully",
                examples=[
                    OpenApiExample(
                        'Success Response',
                        value={
                            'active_hunters': 15,
                            'total_shots': 247,
                            'total_bullets': 1250,
                            'active_locations': 8
                        }
                    )
                ]
            ),
            500: OpenApiResponse(
                response=OpenApiTypes.OBJECT,
                description="Internal server error",
                examples=[
                    OpenApiExample(
                        'Error Response',
                        value={'error': 'Database connection failed'}
                    )
                ]
            )
        },
        tags=['Dashboard']
    )
    def get(self, request):
        try:
            # Get counts
            active_hunters = Hunter.objects.filter(is_active=True).count()
            total_shots = Shot.objects.count()
            total_bullets = Ammunition.objects.aggregate(
                total=Sum('quantity')
            )['total'] or 0
            
            # Get unique locations
            active_locations = Hunter.objects.filter(
                is_active=True
            ).values('current_location').distinct().count()
            
            return Response({
                'active_hunters': active_hunters,
                'total_shots': total_shots,
                'total_bullets': total_bullets,
                'active_locations': active_locations,
            })
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SystemStatusView(APIView):
    """
    Get real-time system status and latest sensor readings from IoT devices.
    """
    
    @extend_schema(
        summary="Get System Status",
        description="Retrieve current system status including latest sensor readings from sound, vibration, and GPS devices. Returns real-time data for monitoring dashboard.",
        responses={
            200: OpenApiResponse(
                response=OpenApiTypes.OBJECT,
                description="System status retrieved successfully",
                examples=[
                    OpenApiExample(
                        'Success Response',
                        value={
                            'sensors': {
                                'sound': {
                                    'value': 85.4,
                                    'timestamp': '2025-11-23T14:30:00Z',
                                    'location': None
                                },
                                'vibration': {
                                    'value': 42.1,
                                    'timestamp': '2025-11-23T14:29:55Z',
                                    'location': None
                                },
                                'gps': {
                                    'value': 1,
                                    'timestamp': '2025-11-23T14:30:10Z',
                                    'location': {
                                        'lat': 40.7128,
                                        'lng': -74.0060
                                    }
                                }
                            },
                            'status': 'online',
                            'last_updated': '2025-11-23T14:30:00Z'
                        }
                    )
                ]
            ),
            500: OpenApiResponse(
                response=OpenApiTypes.OBJECT,
                description="Internal server error"
            )
        },
        tags=['Dashboard', 'Sensors']
    )
    def get(self, request):
        try:
            # Get latest sensor readings
            latest_sensors = {}
            for sensor_type in ['sound', 'vibration', 'gps']:
                reading = SensorReading.objects.filter(
                    sensor_type=sensor_type
                ).order_by('-timestamp').first()
                
                if reading:
                    latest_sensors[sensor_type] = {
                        'value': reading.value,
                        'timestamp': reading.timestamp,
                        'location': {
                            'lat': reading.latitude,
                            'lng': reading.longitude
                        } if sensor_type == 'gps' else None
                    }
            
            return Response({
                'sensors': latest_sensors,
                'status': 'online',
                'last_updated': latest_sensors.get('sound', {}).get('timestamp') if latest_sensors else None
            })
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )