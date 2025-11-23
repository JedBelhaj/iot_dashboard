"""
Simple management command to create a test shot
"""
from django.core.management.base import BaseCommand
from hunters.models import Gun, Shot
import random


class Command(BaseCommand):
    help = 'Create a test shot for simulation'

    def handle(self, *args, **options):
        # Get active guns
        active_guns = Gun.objects.filter(status='active')
        
        if not active_guns.exists():
            self.stdout.write(self.style.ERROR('No active guns found'))
            return
        
        # Select random gun
        gun = random.choice(active_guns)
        
        # Create shot
        shot = Shot.objects.create(
            gun=gun,
            sound_level=random.uniform(85, 120),
            vibration_level=random.uniform(40, 80),
            latitude=40.7128 + random.uniform(-0.01, 0.01),
            longitude=-74.0060 + random.uniform(-0.01, 0.01),
            notes='Test simulation shot'
        )
        
        self.stdout.write(
            self.style.SUCCESS(f'Created shot: {shot.id} from gun {gun.device_id}')
        )