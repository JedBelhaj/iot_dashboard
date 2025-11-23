# Generated manually to update ammunition models

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('ammunition', '0001_initial'),
        ('hunters', '0002_migrate_to_gun_model'),
    ]

    operations = [
        migrations.AddField(
            model_name='ammunitiontransaction',
            name='gun',
            field=models.ForeignKey(blank=True, help_text='Gun used for shot transactions', null=True, on_delete=django.db.models.deletion.SET_NULL, to='hunters.gun'),
        ),
        migrations.AddField(
            model_name='ammunitiontransaction',
            name='supplier',
            field=models.CharField(blank=True, help_text='Supplier for purchases or buyer for sales', max_length=100),
        ),
        migrations.AddField(
            model_name='ammunitiontransaction',
            name='total_cost',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name='ammunitiontransaction',
            name='unit_price',
            field=models.DecimalField(blank=True, decimal_places=2, help_text='Price per bullet for bought/sold transactions', max_digits=8, null=True),
        ),
        migrations.AlterField(
            model_name='ammunitiontransaction',
            name='hunter',
            field=models.ForeignKey(blank=True, help_text='Hunter involved in transaction', null=True, on_delete=django.db.models.deletion.SET_NULL, to='hunters.hunter'),
        ),
        migrations.AlterField(
            model_name='ammunitiontransaction',
            name='quantity',
            field=models.IntegerField(help_text='Always positive - represents amount of bullets'),
        ),
        migrations.AlterField(
            model_name='ammunitiontransaction',
            name='transaction_type',
            field=models.CharField(choices=[('bought', 'Bought/Purchased'), ('sold', 'Sold'), ('shot', 'Shot/Used'), ('transfer', 'Transfer'), ('loss', 'Loss/Damage'), ('return', 'Return/Refund')], max_length=20),
        ),
    ]