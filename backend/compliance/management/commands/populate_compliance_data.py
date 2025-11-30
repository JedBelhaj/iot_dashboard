from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta, time, date
import random
from hunters.models import Hunter
from compliance.models import HuntingZone, AmmunitionPurchase, ComplianceViolation, HunterLicense

class Command(BaseCommand):
    help = 'Populate the database with mock compliance data'

    def handle(self, *args, **options):
        self.stdout.write('Creating mock compliance data...')
        
        # Create hunting zones
        zones = [
            {
                'name': 'North Forest Reserve',
                'description': 'Primary hunting area in the northern region',
                'center_latitude': 45.1,
                'center_longitude': -74.9,
                'radius_km': 5.0,
                'season_start': date.today() - timedelta(days=30),
                'season_end': date.today() + timedelta(days=120),
                'daily_start_time': time(6, 0),
                'daily_end_time': time(18, 0),
                'allowed_weekdays': '0,1,2,3,4,5,6',  # All days
                'is_active': True
            },
            {
                'name': 'South Valley Area',
                'description': 'Weekend hunting zone in the southern valley',
                'center_latitude': 44.9,
                'center_longitude': -75.1,
                'radius_km': 3.0,
                'season_start': date.today() - timedelta(days=10),
                'season_end': date.today() + timedelta(days=90),
                'daily_start_time': time(7, 0),
                'daily_end_time': time(17, 0),
                'allowed_weekdays': '5,6',  # Saturday and Sunday only
                'is_active': True
            },
            {
                'name': 'East Ridge Protected',
                'description': 'Protected area - hunting restricted',
                'center_latitude': 45.2,
                'center_longitude': -74.7,
                'radius_km': 2.5,
                'season_start': date.today() + timedelta(days=30),
                'season_end': date.today() + timedelta(days=150),
                'daily_start_time': time(8, 0),
                'daily_end_time': time(16, 0),
                'allowed_weekdays': '1,3,5',  # Limited days
                'is_active': False  # Currently inactive
            }
        ]
        
        for zone_data in zones:
            zone, created = HuntingZone.objects.get_or_create(
                name=zone_data['name'],
                defaults=zone_data
            )
            if created:
                self.stdout.write(f'Created hunting zone: {zone.name}')
        
        # Get all hunters
        hunters = list(Hunter.objects.all())
        if not hunters:
            self.stdout.write(self.style.WARNING('No hunters found. Please create hunters first.'))
            return
        
        # Create hunter licenses
        for hunter in hunters:
            # Some hunters have valid licenses, some expired, some missing
            license_type = random.choice(['valid', 'expired', 'expiring_soon', 'missing'])
            
            if license_type != 'missing':
                if license_type == 'valid':
                    issue_date = date.today() - timedelta(days=random.randint(30, 365))
                    expiry_date = date.today() + timedelta(days=random.randint(30, 730))
                elif license_type == 'expired':
                    issue_date = date.today() - timedelta(days=random.randint(400, 800))
                    expiry_date = date.today() - timedelta(days=random.randint(1, 100))
                else:  # expiring_soon
                    issue_date = date.today() - timedelta(days=random.randint(300, 365))
                    expiry_date = date.today() + timedelta(days=random.randint(1, 29))
                
                license, created = HunterLicense.objects.get_or_create(
                    hunter=hunter,
                    defaults={
                        'license_number': f'HL-{hunter.id:04d}-{random.randint(1000, 9999)}',
                        'issue_date': issue_date,
                        'expiry_date': expiry_date
                    }
                )
                if created:
                    self.stdout.write(f'Created license for {hunter.name}: {license_type}')
        
        # Create ammunition purchases
        for hunter in random.sample(hunters, min(len(hunters), 15)):  # Not all hunters buy ammo
            # Create 1-3 purchases per hunter
            for _ in range(random.randint(1, 3)):
                purchase_date = timezone.now() - timedelta(days=random.randint(1, 90))
                quantity = random.choice([20, 25, 30, 50, 100])  # Common ammo box sizes
                used_quantity = random.randint(0, min(quantity + 10, quantity * 2))  # Some may overuse
                
                purchase = AmmunitionPurchase.objects.create(
                    hunter=hunter,
                    ammo_type=random.choice(['9mm', '.308', '12ga', '.30-06', '.22LR']),
                    quantity=quantity,
                    used_quantity=used_quantity,
                    purchase_date=purchase_date,
                    purchase_price=quantity * random.uniform(0.50, 2.00),
                    vendor=random.choice(['SportsCo', 'Hunter Supply', 'Ammo Depot', 'OutdoorGear']),
                    receipt_number=f'RCP-{random.randint(100000, 999999)}'
                )
                self.stdout.write(f'Created ammo purchase for {hunter.name}: {quantity} rounds')
        
        # Create some compliance violations
        violation_scenarios = [
            {
                'type': 'ammo_overuse',
                'severity': 'high',
                'description': 'Hunter exceeded purchased ammunition limit',
                'count': 3
            },
            {
                'type': 'illegal_location',
                'severity': 'high',
                'description': 'Shot fired outside permitted hunting zones',
                'count': 5
            },
            {
                'type': 'time_violation',
                'severity': 'medium',
                'description': 'Hunting outside permitted hours',
                'count': 4
            },
            {
                'type': 'invalid_license',
                'severity': 'critical',
                'description': 'Hunting with expired or invalid license',
                'count': 2
            },
            {
                'type': 'no_license',
                'severity': 'critical',
                'description': 'Hunting without valid license',
                'count': 1
            }
        ]
        
        for scenario in violation_scenarios:
            for _ in range(scenario['count']):
                hunter = random.choice(hunters)
                violation = ComplianceViolation.objects.create(
                    hunter=hunter,
                    violation_type=scenario['type'],
                    severity=scenario['severity'],
                    description=f"{scenario['description']} - {hunter.name}",
                    evidence_data={
                        'timestamp': (timezone.now() - timedelta(days=random.randint(1, 30))).isoformat(),
                        'location': {
                            'lat': random.uniform(44.8, 45.3),
                            'lng': random.uniform(-75.2, -74.6)
                        },
                        'auto_generated': True
                    },
                    resolved=random.choice([True, False])
                )
                if violation.resolved:
                    violation.notes = f"Resolved by admin - Warning issued to {hunter.name}"
                    violation.resolved_at = timezone.now()
                    violation.save()
                
                self.stdout.write(f'Created {scenario["type"]} violation for {hunter.name}')
        
        # Print summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('COMPLIANCE DATA SUMMARY'))
        self.stdout.write('='*50)
        self.stdout.write(f'Hunting Zones: {HuntingZone.objects.count()}')
        self.stdout.write(f'Hunter Licenses: {HunterLicense.objects.count()}')
        self.stdout.write(f'Ammunition Purchases: {AmmunitionPurchase.objects.count()}')
        self.stdout.write(f'Compliance Violations: {ComplianceViolation.objects.count()}')
        
        # Active zones
        active_zones = HuntingZone.objects.filter(is_active=True).count()
        self.stdout.write(f'Active Hunting Zones: {active_zones}')
        
        # License stats
        valid_licenses = HunterLicense.objects.filter(expiry_date__gte=date.today()).count()
        expired_licenses = HunterLicense.objects.filter(expiry_date__lt=date.today()).count()
        self.stdout.write(f'Valid Licenses: {valid_licenses}')
        self.stdout.write(f'Expired Licenses: {expired_licenses}')
        
        # Violation stats
        unresolved_violations = ComplianceViolation.objects.filter(resolved=False).count()
        self.stdout.write(f'Unresolved Violations: {unresolved_violations}')
        
        self.stdout.write('\n' + self.style.SUCCESS('Mock compliance data created successfully!'))
        self.stdout.write('You can now access the compliance system through:')
        self.stdout.write('- API: http://localhost:8000/api/compliance/')
        self.stdout.write('- Admin: http://localhost:8000/admin/')