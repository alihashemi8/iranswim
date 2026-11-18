import logging
from django.core.management.base import BaseCommand
from apps.supervisor.services import execute_log_retention_cleanup
from apps.supervisor.locking import execution_lock, LOCK_CLEANUP_LOGS

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'پاک‌سازی امن و دوره‌ای لاگ‌های رخداد خطای قدیمی و حل‌شده (Safe Error Log Retention Cleanup)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=90,
            help='تعداد روزهای نگهداری لاگ‌ها پیش از پاک‌سازی (پیش‌فرض: ۹۰ روز)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='پیش‌نمایش تعداد رکوردهای واجد شرایط پاک‌سازی بدون حذف واقعی از دیتابیس'
        )

    def handle(self, *args, **options):
        days = options['days']
        dry_run = options['dry_run']

        with execution_lock(LOCK_CLEANUP_LOGS, "cleanup_logs") as acquired:
            if not acquired:
                self.stdout.write(
                    self.style.WARNING(
                        'فرایند پاک‌سازی دیگری در حال اجراست. جهت جلوگیری از تداخل همروند، این عملیات لغو شد.'
                    )
                )
                return

            self.stdout.write(
                self.style.NOTICE(
                    f"آغاز ارزیابی پاک‌سازی لاگ‌ها (بازه نگهداری: {days} روز, حالت پیش‌نمایش: {dry_run})..."
                )
            )

            try:
                result = execute_log_retention_cleanup(
                    retention_days=days,
                    user=None,
                    dry_run=dry_run
                )

                if dry_run:
                    self.stdout.write(
                        self.style.WARNING(
                            f"[DRY-RUN] تعداد {result['eligible_count']} رکورد خطای حل‌شده قدیمی‌تر از {result['cutoff_date']} شناسایی شد (هیچ رکوردی حذف نگردید)."
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"پاک‌سازی با موفقیت انجام شد. تعداد {result['deleted_count']} رخداد حذف گردید (خلاصه‌های ErrorGroup و حوادث حل‌نشده حفظ شدند)."
                        )
                    )
            except Exception as e:
                logger.error(f"[LOG_CLEANUP_FAILURE] Error during log retention cleanup: {e}", exc_info=True)
                self.stdout.write(
                    self.style.ERROR(f"خطا در حین پاک‌سازی لاگ‌های قدیمی: {e}")
                )
