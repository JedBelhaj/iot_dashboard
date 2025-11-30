from django.apps import AppConfig

class ComplianceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'compliance'
    verbose_name = 'Hunting Compliance'
    
    def ready(self):
        import compliance.signals