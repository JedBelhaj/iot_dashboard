from django.contrib import admin
from .models import HuntingZone, AmmunitionPurchase, ComplianceViolation, HunterLicense

@admin.register(HuntingZone)
class HuntingZoneAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'season_start', 'season_end', 'allowed_weekdays')
    list_filter = ('is_active', 'season_start', 'season_end')
    search_fields = ('name', 'description')
    ordering = ('name',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'is_active')
        }),
        ('Geographic Boundaries', {
            'fields': (
                ('center_latitude', 'center_longitude'),
                'radius_km'
            )
        }),
        ('Time Restrictions', {
            'fields': (
                ('season_start', 'season_end'),
                ('daily_start_time', 'daily_end_time'),
                'allowed_weekdays'
            )
        }),
    )

@admin.register(AmmunitionPurchase)
class AmmunitionPurchaseAdmin(admin.ModelAdmin):
    list_display = ('hunter', 'ammo_type', 'quantity', 'used_quantity', 'remaining_quantity_display', 'purchase_date')
    list_filter = ('purchase_date', 'ammo_type')
    search_fields = ('hunter__name', 'receipt_number', 'vendor')
    ordering = ('-purchase_date',)
    readonly_fields = ('remaining_quantity_display',)
    
    def remaining_quantity_display(self, obj):
        return obj.remaining_quantity
    remaining_quantity_display.short_description = 'Remaining'

@admin.register(ComplianceViolation)
class ComplianceViolationAdmin(admin.ModelAdmin):
    list_display = ('hunter', 'violation_type', 'severity', 'detected_at', 'resolved')
    list_filter = ('violation_type', 'severity', 'resolved', 'detected_at')
    search_fields = ('hunter__name', 'description')
    ordering = ('-detected_at',)
    readonly_fields = ('detected_at',)
    
    fieldsets = (
        ('Violation Details', {
            'fields': ('hunter', 'violation_type', 'severity', 'description')
        }),
        ('Resolution', {
            'fields': ('resolved', 'notes')
        }),
        ('Evidence', {
            'fields': ('evidence_data',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('detected_at',),
            'classes': ('collapse',)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing existing object
            return self.readonly_fields + ('hunter', 'violation_type', 'evidence_data')
        return self.readonly_fields

@admin.register(HunterLicense)
class HunterLicenseAdmin(admin.ModelAdmin):
    list_display = ('hunter', 'license_number', 'issue_date', 'expiry_date', 'is_valid_display')
    list_filter = ('issue_date', 'expiry_date')
    search_fields = ('hunter__name', 'license_number')
    ordering = ('expiry_date',)
    
    def is_valid_display(self, obj):
        return obj.is_valid
    is_valid_display.boolean = True
    is_valid_display.short_description = 'Valid'