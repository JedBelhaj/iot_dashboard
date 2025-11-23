"""
Activities app admin configuration
"""
from django.contrib import admin
from .models import Activity, SystemAlert

@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ('activity_type', 'title', 'priority', 'location', 'timestamp', 'is_read')
    list_filter = ('activity_type', 'priority', 'is_read', 'timestamp', 'location')
    search_fields = ('title', 'description', 'location')
    readonly_fields = ('timestamp', 'content_type', 'object_id')
    
    fieldsets = (
        ('Activity Information', {
            'fields': ('activity_type', 'title', 'description', 'priority')
        }),
        ('Location & Metadata', {
            'fields': ('location', 'metadata')
        }),
        ('Related Object', {
            'fields': ('content_type', 'object_id'),
            'classes': ('collapse',)
        }),
        ('Status & Timestamp', {
            'fields': ('is_read', 'timestamp')
        })
    )
    
    actions = ['mark_as_read', 'mark_as_unread']
    
    def mark_as_read(self, request, queryset):
        queryset.update(is_read=True)
        self.message_user(request, f"{queryset.count()} activities marked as read.")
    mark_as_read.short_description = "Mark selected activities as read"
    
    def mark_as_unread(self, request, queryset):
        queryset.update(is_read=False)
        self.message_user(request, f"{queryset.count()} activities marked as unread.")
    mark_as_unread.short_description = "Mark selected activities as unread"

@admin.register(SystemAlert)
class SystemAlertAdmin(admin.ModelAdmin):
    list_display = ('alert_type', 'title', 'status', 'device_id', 'location', 'created_at')
    list_filter = ('alert_type', 'status', 'location', 'created_at')
    search_fields = ('title', 'message', 'device_id', 'location')
    readonly_fields = ('created_at',)
    
    fieldsets = (
        ('Alert Information', {
            'fields': ('alert_type', 'title', 'message', 'status')
        }),
        ('Device & Location', {
            'fields': ('device_id', 'location')
        }),
        ('Related Activity', {
            'fields': ('activity',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'acknowledged_at', 'resolved_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['acknowledge_alerts', 'resolve_alerts']
    
    def acknowledge_alerts(self, request, queryset):
        from django.utils import timezone
        queryset.update(status='acknowledged', acknowledged_at=timezone.now())
        self.message_user(request, f"{queryset.count()} alerts acknowledged.")
    acknowledge_alerts.short_description = "Acknowledge selected alerts"
    
    def resolve_alerts(self, request, queryset):
        from django.utils import timezone
        queryset.update(status='resolved', resolved_at=timezone.now())
        self.message_user(request, f"{queryset.count()} alerts resolved.")
    resolve_alerts.short_description = "Resolve selected alerts"