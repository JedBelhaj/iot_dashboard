"""
Management command to populate database with mock data
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random
from hunters.models import Hunter, Shot
from sensors.models import SensorReading, SensorDevice
from ammunition.models import Ammunition, AmmunitionTransaction
from activities.models import Activity, SystemAlert


class Command(BaseCommand):
    help = 'Populate database with mock IoT data'

    def add_arguments(self, parser):
        parser.add_argument('--hunters', type=int, default=10, help='Number of hunters to create')
        parser.add_argument('--shots', type=int, default=50, help='Number of shots to create')
        parser.add_argument('--sensors', type=int, default=100, help='Number of sensor readings to create')

    def handle(self, *args, **options):
        self.stdout.write('Creating mock data...')
        
        # Create hunters
        self.create_hunters(options['hunters'])
        
        # Create sensor devices
        self.create_sensor_devices()
        
        # Create ammunition inventory
        self.create_ammunition()
        
        # Create sensor readings
        self.create_sensor_readings(options['sensors'])
        
        # Create shots
        self.create_shots(options['shots'])
        
        # Create activities and alerts
        self.create_activities()
        self.create_alerts()
        
        self.stdout.write(
            self.style.SUCCESS('Successfully created mock data!')
        )

    def create_hunters(self, count):
        """Create mock hunters"""
        names = [
            'John Smith', 'Sarah Johnson', 'Mike Davis', 'Emily Brown',
            'David Wilson', 'Lisa Anderson', 'Tom Miller', 'Jessica Taylor',
            'Chris Martinez', 'Amanda Garcia', 'Ryan Rodriguez', 'Nicole Lewis'
        ]
        
        weapon_types = ['rifle', 'shotgun', 'handgun', 'bow']
        locations = ['Hunting Zone A', 'Training Range B', 'Forest Reserve C', 'Mountain Area D']
        
        for i in range(count):
            Hunter.objects.create(
                name=random.choice(names),
                license_number=f"HNT-2025-{str(i+1).zfill(3)}",
                weapon_type=random.choice(weapon_types),
                current_location=random.choice(locations),
                is_active=random.choice([True, True, True, False]),  # 75% active
                latitude=40.7128 + random.uniform(-0.01, 0.01),
                longitude=-74.0060 + random.uniform(-0.01, 0.01),
                last_active=timezone.now() - timedelta(
                    hours=random.randint(0, 48)
                )
            )
        
        self.stdout.write(f'Created {count} hunters')

    def create_sensor_devices(self):
        """Create sensor devices"""
        devices = [
            {
                'device_id': 'sound_sensor_01',
                'name': 'Sound Level Meter - Zone A',
                'sensor_type': 'sound',
                'location_name': 'Hunting Zone A',
                'latitude': 40.7128,
                'longitude': -74.0060,
            },
            {
                'device_id': 'vibration_sensor_01',
                'name': 'Vibration Detector - Zone A',
                'sensor_type': 'vibration',
                'location_name': 'Hunting Zone A',
                'latitude': 40.7130,
                'longitude': -74.0062,
            },
            {
                'device_id': 'gps_sensor_01',
                'name': 'GPS Tracker - Zone A',
                'sensor_type': 'gps',
                'location_name': 'Hunting Zone A',
                'latitude': 40.7132,
                'longitude': -74.0058,
            },
            {
                'device_id': 'sound_sensor_02',
                'name': 'Sound Level Meter - Range B',
                'sensor_type': 'sound',
                'location_name': 'Training Range B',
                'latitude': 40.7150,
                'longitude': -74.0080,
            },
        ]
        
        for device_data in devices:
            SensorDevice.objects.create(
                **device_data,
                status=random.choice(['online', 'online', 'offline']),  # 67% online
                firmware_version='1.2.0',
                last_seen=timezone.now() - timedelta(
                    minutes=random.randint(0, 60)
                )
            )
        
        self.stdout.write('Created sensor devices')

    def create_ammunition(self):
        """Create ammunition inventory"""
        ammo_data = [
            {'ammo_type': '308', 'quantity': 450, 'cost_per_unit': 1.25, 'supplier': 'Federal Ammunition'},
            {'ammo_type': '12g', 'quantity': 320, 'cost_per_unit': 0.85, 'supplier': 'Winchester'},
            {'ammo_type': '9mm', 'quantity': 180, 'cost_per_unit': 0.45, 'supplier': 'Remington'},
            {'ammo_type': '22lr', 'quantity': 820, 'cost_per_unit': 0.15, 'supplier': 'CCI'},
            {'ammo_type': '223', 'quantity': 275, 'cost_per_unit': 0.95, 'supplier': 'Hornady'},
            {'ammo_type': '30-06', 'quantity': 150, 'cost_per_unit': 1.85, 'supplier': 'Nosler'},
        ]
        
        locations = ['Main Storage', 'Range Armory', 'Field Station A']
        
        for ammo in ammo_data:
            Ammunition.objects.create(
                **ammo,
                location=random.choice(locations),
                minimum_stock=random.randint(50, 150),
                purchase_date=timezone.now() - timedelta(
                    days=random.randint(1, 30)
                )
            )
        
        self.stdout.write('Created ammunition inventory')

    def create_sensor_readings(self, count):
        """Create sensor readings"""
        devices = list(SensorDevice.objects.all())
        
        for _ in range(count):
            device = random.choice(devices)
            
            # Generate appropriate values based on sensor type
            if device.sensor_type == 'sound':
                value = random.uniform(30, 120)
                unit = 'dB'
            elif device.sensor_type == 'vibration':
                value = random.uniform(0, 100)
                unit = 'Hz'
            elif device.sensor_type == 'gps':
                value = 1.0
                unit = 'status'
            else:
                value = random.uniform(0, 100)
                unit = 'unit'
            
            SensorReading.objects.create(
                sensor_type=device.sensor_type,
                value=round(value, 2),
                unit=unit,
                latitude=device.latitude + random.uniform(-0.001, 0.001),
                longitude=device.longitude + random.uniform(-0.001, 0.001),
                location_name=device.location_name,
                device_id=device.device_id,
                battery_level=random.uniform(20, 100),
                signal_strength=random.uniform(60, 100),
                is_anomaly=random.choice([False] * 9 + [True]),  # 10% anomalies
                timestamp=timezone.now() - timedelta(
                    hours=random.randint(0, 72)
                )
            )
        
        self.stdout.write(f'Created {count} sensor readings')

    def create_shots(self, count):
        """Create shot records"""
        hunters = list(Hunter.objects.all())
        weapon_types = ['rifle', 'shotgun', 'handgun', 'bow']
        locations = ['Hunting Zone A', 'Training Range B', 'Forest Reserve C']
        
        for _ in range(count):
            hunter = random.choice(hunters)
            
            Shot.objects.create(
                hunter=hunter,
                location=random.choice(locations),
                sound_level=random.uniform(85, 120),
                vibration_level=random.uniform(30, 80),
                latitude=40.7128 + random.uniform(-0.01, 0.01),
                longitude=-74.0060 + random.uniform(-0.01, 0.01),
                weapon_used=random.choice(weapon_types),
                notes=random.choice([
                    'Clean shot, good conditions',
                    'Target practice session',
                    'Hunting expedition',
                    'Training exercise',
                    ''
                ]),
                timestamp=timezone.now() - timedelta(
                    hours=random.randint(0, 168)  # Last week
                )
            )
        
        self.stdout.write(f'Created {count} shot records')

    def create_activities(self):
        """Create activity log entries"""
        activities = [
            {
                'activity_type': 'shot_detected',
                'title': 'Shot Detected in Zone A',
                'description': 'Sound and vibration sensors detected gunshot',
                'priority': 'medium',
                'location': 'Hunting Zone A'
            },
            {
                'activity_type': 'hunter_registered',
                'title': 'New Hunter Registration',
                'description': 'Hunter John Smith successfully registered',
                'priority': 'low',
                'location': 'Registration Office'
            },
            {
                'activity_type': 'ammunition_purchased',
                'title': 'Ammunition Restocked',
                'description': '500 rounds of .308 Winchester added to inventory',
                'priority': 'low',
                'location': 'Main Storage'
            },
            {
                'activity_type': 'sensor_alert',
                'title': 'High Sound Level Alert',
                'description': 'Sound level exceeded 110 dB threshold',
                'priority': 'high',
                'location': 'Training Range B'
            },
            {
                'activity_type': 'device_offline',
                'title': 'Sensor Device Offline',
                'description': 'Vibration sensor in Zone C is not responding',
                'priority': 'medium',
                'location': 'Forest Reserve C'
            }
        ]
        
        for activity_data in activities:
            Activity.objects.create(
                **activity_data,
                timestamp=timezone.now() - timedelta(
                    hours=random.randint(0, 48)
                ),
                is_read=random.choice([True, False])
            )
        
        self.stdout.write('Created activity entries')

    def create_alerts(self):
        """Create system alerts"""
        alerts = [
            {
                'alert_type': 'low_battery',
                'title': 'Low Battery Warning',
                'message': 'GPS sensor battery below 20%',
                'device_id': 'gps_sensor_01',
                'location': 'Hunting Zone A'
            },
            {
                'alert_type': 'sensor_malfunction',
                'title': 'Sensor Malfunction',
                'message': 'Vibration sensor returning inconsistent readings',
                'device_id': 'vibration_sensor_01',
                'location': 'Hunting Zone A'
            },
            {
                'alert_type': 'security',
                'title': 'Unauthorized Access Attempt',
                'message': 'Failed authentication attempt detected',
                'location': 'Main Server'
            }
        ]
        
        for alert_data in alerts:
            SystemAlert.objects.create(
                **alert_data,
                status=random.choice(['active', 'acknowledged']),
                created_at=timezone.now() - timedelta(
                    hours=random.randint(0, 24)
                )
            )
        
        self.stdout.write('Created system alerts')