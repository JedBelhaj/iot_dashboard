"""
WebSocket consumer for real-time shot recording simulation
"""
import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from hunters.models import Gun, Shot
import random


class ShotSimulatorConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for simulating automatic shot recording
    """
    
    async def connect(self):
        """Accept WebSocket connection"""
        await self.accept()
        
        # Start shot simulation
        self.shot_task = asyncio.create_task(self.simulate_shots())
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, 'shot_task'):
            self.shot_task.cancel()
    
    async def simulate_shots(self):
        """Simulate shots every 10 seconds"""
        try:
            while True:
                # Generate and record a shot
                shot_data = await self.create_random_shot()
                
                if shot_data:
                    # Send shot data to WebSocket
                    await self.send(text_data=json.dumps({
                        'type': 'new_shot',
                        'shot': shot_data
                    }))
                
                # Wait 10 seconds before next shot
                await asyncio.sleep(10)
                
        except asyncio.CancelledError:
            pass
    
    @database_sync_to_async
    def create_random_shot(self):
        """Create a random shot record"""
        # Get active guns
        active_guns = list(Gun.objects.filter(status='active'))
        
        if not active_guns:
            return None
        
        # Select random gun
        gun = random.choice(active_guns)
        
        # Generate realistic shot data
        shot = Shot.objects.create(
            gun=gun,
            sound_level=random.uniform(85, 120),  # Realistic gunshot sound levels
            vibration_level=random.uniform(40, 80),  # Vibration from recoil
            latitude=gun.owner.latitude + random.uniform(-0.01, 0.01) if gun.owner.latitude else 40.7128 + random.uniform(-0.01, 0.01),
            longitude=gun.owner.longitude + random.uniform(-0.01, 0.01) if gun.owner.longitude else -74.0060 + random.uniform(-0.01, 0.01),
            notes=random.choice([
                'Auto-simulated shot',
                'Training exercise',
                'Target practice',
                'Field test',
                'Calibration shot'
            ])
        )
        
        # Update gun's last_used time
        gun.last_used = timezone.now()
        gun.save()
        
        # Update owner's last_active time
        gun.owner.last_active = timezone.now()
        gun.owner.save()
        
        return {
            'id': shot.id,
            'gun_device_id': gun.device_id,
            'hunter_name': gun.owner.name,
            'timestamp': shot.timestamp.isoformat(),
            'location': shot.location,
            'sound_level': round(shot.sound_level, 1),
            'vibration_level': round(shot.vibration_level, 1),
            'latitude': shot.latitude,
            'longitude': shot.longitude,
            'weapon_used': gun.weapon_type,
            'notes': shot.notes
        }