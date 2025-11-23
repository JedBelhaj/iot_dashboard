"""
Sensors app views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Count
from django.utils import timezone
from datetime import timedelta
from .models import SensorReading, SensorDevice
from .serializers import SensorReadingSerializer, SensorDeviceSerializer, SensorStatsSerializer

class SensorReadingViewSet(viewsets.ModelViewSet):
    """
    Sensor reading CRUD operations
    """
    queryset = SensorReading.objects.all()
    serializer_class = SensorReadingSerializer
    
    def get_queryset(self):
        queryset = SensorReading.objects.all()
        sensor_type = self.request.query_params.get('sensor_type')
        device_id = self.request.query_params.get('device_id')
        
        if sensor_type:
            queryset = queryset.filter(sensor_type=sensor_type)
        if device_id:
            queryset = queryset.filter(device_id=device_id)
            
        return queryset
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        """
        Get latest readings for each sensor type
        """
        latest_readings = []
        sensor_types = ['sound', 'vibration', 'gps']
        
        for sensor_type in sensor_types:
            reading = SensorReading.objects.filter(
                sensor_type=sensor_type
            ).order_by('-timestamp').first()
            
            if reading:
                latest_readings.append(reading)
        
        serializer = self.get_serializer(latest_readings, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def anomalies(self, request):
        """
        Get anomalous readings
        """
        anomalies = SensorReading.objects.filter(is_anomaly=True)
        serializer = self.get_serializer(anomalies, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get sensor statistics
        """
        today = timezone.now().date()
        
        # Basic counts
        total_devices = SensorDevice.objects.count()
        online_devices = SensorDevice.objects.filter(status='online').count()
        readings_today = SensorReading.objects.filter(
            timestamp__date=today
        ).count()
        
        # Average readings by sensor type
        avg_readings = {}
        for sensor_type in ['sound', 'vibration']:
            avg_value = SensorReading.objects.filter(
                sensor_type=sensor_type,
                timestamp__date=today
            ).aggregate(avg_value=Avg('value'))['avg_value']
            
            if avg_value:
                avg_readings[sensor_type] = round(avg_value, 2)
        
        # Latest readings
        latest_readings = []
        for sensor_type in ['sound', 'vibration', 'gps']:
            reading = SensorReading.objects.filter(
                sensor_type=sensor_type
            ).order_by('-timestamp').first()
            if reading:
                latest_readings.append(reading)
        
        # Device status breakdown
        device_status = dict(
            SensorDevice.objects.values('status').annotate(
                count=Count('id')
            ).values_list('status', 'count')
        )
        
        stats_data = {
            'total_devices': total_devices,
            'online_devices': online_devices,
            'readings_today': readings_today,
            'average_readings': avg_readings,
            'latest_readings': latest_readings,
            'device_status_breakdown': device_status,
        }
        
        serializer = SensorStatsSerializer(stats_data)
        return Response(serializer.data)

class SensorDeviceViewSet(viewsets.ModelViewSet):
    """
    Sensor device CRUD operations
    """
    queryset = SensorDevice.objects.all()
    serializer_class = SensorDeviceSerializer
    
    @action(detail=False, methods=['get'])
    def online(self, request):
        """
        Get online devices
        """
        online_devices = SensorDevice.objects.filter(status='online')
        serializer = self.get_serializer(online_devices, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """
        Update device status
        """
        device = self.get_object()
        new_status = request.data.get('status')
        
        if new_status in dict(SensorDevice.STATUS_CHOICES):
            device.status = new_status
            device.last_seen = timezone.now()
            device.save()
            
            serializer = self.get_serializer(device)
            return Response(serializer.data)
        
        return Response(
            {'error': 'Invalid status'}, 
            status=status.HTTP_400_BAD_REQUEST
        )