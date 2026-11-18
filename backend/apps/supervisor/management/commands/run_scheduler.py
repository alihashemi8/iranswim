import time
import signal
import logging
from django.core.management.base import BaseCommand
from django.core.management import call_command

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'زمان‌بند سبک و مستقل وظایف دوره‌ای پایش و نگهداری سیستم (IranSwim Dedicated Operations Scheduler)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--alert-interval',
            type=int,
            default=120,
            help='فاصله زمانی ارزیابی دوره‌ای قوانین هشدار برحسب ثانیه (پیش‌فرض: ۱۲۰ ثانیه)'
        )
        parser.add_argument(
            '--cleanup-interval',
            type=int,
            default=86400,
            help='فاصله زمانی اجرای پاک‌سازی دوره‌ای لاگ‌ها برحسب ثانیه (پیش‌فرض: ۸۶۴۰۰ ثانیه / ۲۴ ساعت)'
        )
        parser.add_argument(
            '--retention-days',
            type=int,
            default=90,
            help='تعداد روزهای نگهداری رخدادهای خطای حل‌شده پیش از پاک‌سازی (پیش‌فرض: ۹۰ روز)'
        )

    def handle(self, *args, **options):
        alert_interval = options['alert_interval']
        cleanup_interval = options['cleanup_interval']
        retention_days = options['retention_days']

        running = True

        def graceful_exit(signum, frame):
            nonlocal running
            self.stdout.write(self.style.WARNING(f"\nسیگنال خروج ({signum}) دریافت شد. پایان زمان‌بند عملیات..."))
            running = False

        signal.signal(signal.SIGINT, graceful_exit)
        signal.signal(signal.SIGTERM, graceful_exit)

        self.stdout.write(
            self.style.SUCCESS(
                f"=== زمان‌بند مستقل مانیتورینگ IranSwim آغاز به کار کرد ===\n"
                f"- بازه ارزیابی هشدارها: هر {alert_interval} ثانیه ({round(alert_interval/60, 1)} دقیقه)\n"
                f"- بازه پاک‌سازی لاگ‌ها: هر {cleanup_interval} ثانیه ({round(cleanup_interval/3600, 1)} ساعت)\n"
                f"- دوره نگهداری لاگ‌ها: {retention_days} روز (حفظ حوادث فعال و خلاصه باگ‌ها)"
            )
        )

        last_alert_run = 0
        last_cleanup_run = time.time()  # First cleanup run after 24 hours of uptime

        while running:
            now = time.time()

            # 1. Periodic Alert Evaluation
            if now - last_alert_run >= alert_interval:
                last_alert_run = now
                try:
                    call_command('evaluate_alerts')
                except Exception as e:
                    logger.error(f"[SCHEDULER_ALERT_ERROR] Failed during evaluate_alerts: {e}", exc_info=True)
                    self.stdout.write(self.style.ERROR(f"خطا در اجرای ارزیابی هشدارها: {e}"))

            # 2. Daily Log Retention Cleanup
            if now - last_cleanup_run >= cleanup_interval:
                last_cleanup_run = now
                try:
                    call_command('cleanup_error_logs', days=retention_days)
                except Exception as e:
                    logger.error(f"[SCHEDULER_CLEANUP_ERROR] Failed during cleanup_error_logs: {e}", exc_info=True)
                    self.stdout.write(self.style.ERROR(f"خطا در اجرای پاک‌سازی دوره‌ای لاگ‌ها: {e}"))

            # Sleep in 1-second ticks for fast and responsive signal handling
            tick_end = min(last_alert_run + alert_interval, last_cleanup_run + cleanup_interval)
            while running and time.time() < tick_end:
                time.sleep(1)

        self.stdout.write(self.style.NOTICE("زمان‌بند عملیاتی با موفقیت متوقف گردید."))
