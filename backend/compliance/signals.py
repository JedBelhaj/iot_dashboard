from django.db.models.signals import post_save
from django.dispatch import receiver
from hunters.models import Shot
from compliance.views import check_compliance_violations

@receiver(post_save, sender=Shot)
def check_shot_compliance(sender, instance, created, **kwargs):
    """
    Automatically check for compliance violations when a new shot is recorded
    """
    if created:  # Only check for new shots, not updates
        try:
            violations = check_compliance_violations(instance)
            if violations:
                print(f"⚠️  Compliance violations detected for shot by {instance.gun.owner.name}:")
                for violation in violations:
                    print(f"   - {violation.get_violation_type_display()}: {violation.description}")
        except Exception as e:
            print(f"Error checking compliance for shot {instance.id}: {e}")