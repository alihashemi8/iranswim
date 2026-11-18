from django.core.management.base import BaseCommand
from apps.supervisor.services import evaluate_alert_rules
from apps.supervisor.models import SystemAlert


class Command(BaseCommand):
    help = 'ارزیابی خودکار و دوره‌ای قوانین هشدارهای سیستمی و زیرساخت (Periodic Alert Evaluator)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--verbose-output',
            action='store_true',
            help='چاپ جزئیات کامل هشدارهای فعال و وضعیت بررسی'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('در حال ارزیابی قوانین هشدارهای سیستمی...'))
        
        # Evaluate all alert rules (error spikes, db health, disk space, etc.)
        triggered = evaluate_alert_rules(trigger_type='PERIODIC')
        
        active_count = SystemAlert.objects.filter(status=SystemAlert.Status.ACTIVE).count()
        
        if triggered:
            self.stdout.write(
                self.style.WARNING(f'تعداد {len(triggered)} هشدار جدید فعال گردید.')
            )
            for alert in triggered:
                self.stdout.write(f"  - [{alert.severity}] {alert.title} ({alert.trigger_condition})")
        else:
            self.stdout.write(self.style.SUCCESS('هیچ هشدار جدیدی برانگیخته نشد.'))
            
        self.stdout.write(
            self.style.SUCCESS(f'ارزیابی پایان یافت. کل هشدارهای فعال جاری: {active_count}')
        )
