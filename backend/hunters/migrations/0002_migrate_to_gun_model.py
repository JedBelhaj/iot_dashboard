# Generated manually to migrate from old Hunter/Shot structure to new Gun-based structure

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone

def create_guns_from_hunters(apps, schema_editor):
    """
    Create Gun objects based on existing Hunter data
    """
    Hunter = apps.get_model('hunters', 'Hunter')
    Gun = apps.get_model('hunters', 'Gun')
    Shot = apps.get_model('hunters', 'Shot')
    
    # Create guns for each hunter based on their weapon_type
    for hunter in Hunter.objects.all():
        # Create a default gun for each hunter
        gun = Gun.objects.create(
            device_id=f"IOT_{hunter.license_number}",
            serial_number=f"SN_{hunter.license_number}",
            make="Generic",
            model="IoT Device",
            caliber="Various",
            weapon_type=hunter.weapon_type,
            owner=hunter,
            status='active',
            battery_level=85,
            firmware_version="1.0.0"
        )
        
        # Update all shots to reference the new gun
        Shot.objects.filter(hunter=hunter).update(gun=gun)

def reverse_guns_to_hunters(apps, schema_editor):
    """
    Reverse migration - this is a destructive operation
    """
    pass  # Cannot easily reverse this migration

class Migration(migrations.Migration):

    dependencies = [
        ('hunters', '0001_initial'),
    ]

    operations = [
        # Create Gun model
        migrations.CreateModel(
            name='Gun',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('device_id', models.CharField(help_text='Unique IoT device identifier', max_length=50, unique=True)),
                ('serial_number', models.CharField(max_length=100, unique=True)),
                ('make', models.CharField(max_length=50)),
                ('model', models.CharField(max_length=50)),
                ('caliber', models.CharField(max_length=20)),
                ('weapon_type', models.CharField(choices=[('rifle', 'Rifle'), ('shotgun', 'Shotgun'), ('handgun', 'Handgun'), ('bow', 'Bow')], max_length=20)),
                ('status', models.CharField(choices=[('active', 'Active'), ('maintenance', 'Maintenance'), ('inactive', 'Inactive'), ('lost', 'Lost/Stolen')], default='active', max_length=20)),
                ('registered_date', models.DateTimeField(auto_now_add=True)),
                ('last_used', models.DateTimeField(blank=True, null=True)),
                ('firmware_version', models.CharField(blank=True, max_length=20)),
                ('battery_level', models.IntegerField(default=100, help_text='Battery percentage 0-100')),
                ('last_sync', models.DateTimeField(blank=True, null=True)),
                ('notes', models.TextField(blank=True)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='guns', to='hunters.hunter')),
            ],
            options={
                'ordering': ['-last_used', 'make', 'model'],
            },
        ),
        
        # Add gun field to Shot model (nullable initially)
        migrations.AddField(
            model_name='shot',
            name='gun',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='shots', to='hunters.gun'),
        ),
        
        # Run data migration to create guns and update shots
        migrations.RunPython(create_guns_from_hunters, reverse_guns_to_hunters),
        
        # Remove old fields from Hunter
        migrations.RemoveField(
            model_name='hunter',
            name='weapon_type',
        ),
        
        # Remove old fields from Shot
        migrations.RemoveField(
            model_name='shot',
            name='hunter',
        ),
        migrations.RemoveField(
            model_name='shot',
            name='location',
        ),
        migrations.RemoveField(
            model_name='shot',
            name='weapon_used',
        ),
        
        # Make gun field non-nullable
        migrations.AlterField(
            model_name='shot',
            name='gun',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='shots', to='hunters.gun'),
        ),
    ]