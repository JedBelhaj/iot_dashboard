"""
WebSocket consumers for real-time sensor data
"""
import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import SensorReading
import random


class SensorConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time sensor data streaming
    """
    
    async def connect(self):
        """Accept WebSocket connection"""
        await self.accept()
        
        # Start sending simulated sensor data
        self.sensor_task = asyncio.create_task(self.send_sensor_data())
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, 'sensor_task'):
            self.sensor_task.cancel()
    
    async def send_sensor_data(self):
        """Send simulated sensor data every 3 seconds"""
        try:
            while True:
                # Generate simulated sensor readings
                sensor_data = await self.generate_sensor_readings()
                
                # Send data to WebSocket
                await self.send(text_data=json.dumps({
                    'type': 'sensor_update',
                    'data': sensor_data
                }))
                
                # Wait 3 seconds before next update
                await asyncio.sleep(3)
                
        except asyncio.CancelledError:
            pass
    
    @database_sync_to_async
    def generate_sensor_readings(self):
        """Generate and save simulated sensor readings"""
        readings = {}
        
        # Sound sensor (30-120 dB)
        sound_value = random.uniform(30, 120)
        if random.random() < 0.1:  # 10% chance of shot detection
            sound_value = random.uniform(90, 120)
        
        sound_reading = SensorReading.objects.create(
            sensor_type='sound',
            value=round(sound_value, 1),
            unit='dB',
            latitude=40.7128 + random.uniform(-0.001, 0.001),
            longitude=-74.0060 + random.uniform(-0.001, 0.001),
            location_name='Hunting Zone A',
            device_id='sound_sensor_01',
            battery_level=random.uniform(20, 100),
            signal_strength=random.uniform(70, 100)
        )
        
        readings['sound'] = {
            'id': sound_reading.id,
            'value': sound_reading.value,
            'unit': sound_reading.unit,
            'timestamp': sound_reading.timestamp.isoformat(),
            'location': {
                'lat': sound_reading.latitude,
                'lng': sound_reading.longitude
            }
        }
        
        # Vibration sensor (0-100 Hz)
        vibration_value = random.uniform(0, 100)
        if sound_value > 90:  # Correlate with sound
            vibration_value = random.uniform(40, 100)
        
        vibration_reading = SensorReading.objects.create(
            sensor_type='vibration',
            value=round(vibration_value, 1),
            unit='Hz',
            latitude=40.7128 + random.uniform(-0.001, 0.001),
            longitude=-74.0060 + random.uniform(-0.001, 0.001),
            location_name='Hunting Zone A',
            device_id='vibration_sensor_01',
            battery_level=random.uniform(20, 100),
            signal_strength=random.uniform(70, 100)
        )
        
        readings['vibration'] = {
            'id': vibration_reading.id,
            'value': vibration_reading.value,
            'unit': vibration_reading.unit,
            'timestamp': vibration_reading.timestamp.isoformat(),
            'location': {
                'lat': vibration_reading.latitude,
                'lng': vibration_reading.longitude
            }
        }
        
        # GPS reading
        gps_reading = SensorReading.objects.create(
            sensor_type='gps',
            value=1.0,  # GPS active indicator
            unit='status',
            latitude=40.7128 + random.uniform(-0.0001, 0.0001),
            longitude=-74.0060 + random.uniform(-0.0001, 0.0001),
            location_name='Hunting Zone A',
            device_id='gps_sensor_01',
            battery_level=random.uniform(20, 100),
            signal_strength=random.uniform(70, 100)
        )
        
        readings['gps'] = {
            'id': gps_reading.id,
            'latitude': gps_reading.latitude,
            'longitude': gps_reading.longitude,
            'timestamp': gps_reading.timestamp.isoformat(),
            'active': True
        }
        
        return readings