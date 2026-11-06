from django.db import models
from django.conf import settings
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class SystemErrorLog(models.Model):
    class Level(models.TextChoices):
        CRITICAL = 'CRITICAL', _('بحرانی (Crash / 500)')
        ERROR = 'ERROR', _('خطای منطقی یا تراکنشی')
        WARNING = 'WARNING', _('هشدار سیستمی')

    timestamp = models.DateTimeField(_('زمان رخ‌داد'), auto_now_add=True, db_index=True)
    level = models.CharField(_('سطح خطا'), max_length=15, choices=Level.choices, default=Level.CRITICAL, db_index=True)
    endpoint = models.CharField(_('مسیر درخواست'), max_length=255, db_index=True)
    http_method = models.CharField(_('متد HTTP'), max_length=10)
    status_code = models.PositiveIntegerField(_('کد وضعیت HTTP'), default=500, db_index=True)
    exception_type = models.CharField(_('نوع استثنا (Exception)'), max_length=200, db_index=True)
    error_message = models.TextField(_('پیام خطا'))
    stack_trace = models.TextField(_('استک‌ترس کامل (Stack Trace)'))
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='logged_errors',
        verbose_name=_('کاربر مربوطه در زمان خطا')
    )
    ip_address = models.GenericIPAddressField(_('آدرس IP کلاینت'), null=True, blank=True)
    user_agent = models.CharField(_('مرورگر / دستگاه'), max_length=255, blank=True)
    request_data = models.TextField(_('پیش‌نمایش پارامترهای درخواست'), blank=True)
    is_resolved = models.BooleanField(_('بررسی و رفع‌شده'), default=False, db_index=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_errors',
        verbose_name=_('ناظر رفع‌کننده')
    )
    resolved_at = models.DateTimeField(_('زمان ثبت رفع مشکل'), null=True, blank=True)
    resolution_note = models.TextField(_('گزارش و یادداشت ناظر'), blank=True)

    class Meta:
        verbose_name = _('لاگ خطای سیستمی و باگ')
        verbose_name_plural = _('خطاهای ثبت‌شده سامانه')
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.level}] {self.status_code} {self.endpoint} ({self.exception_type})"


class AuditLog(models.Model):
    class Action(models.TextChoices):
        LOGIN = 'LOGIN', _('ورود به سیستم')
        ROLE_CHANGE = 'ROLE_CHANGE', _('تغییر نقش کاربر')
        ENROLLMENT_CREATE = 'ENROLLMENT_CREATE', _('ثبت‌نام جدید')
        PAYMENT_RECORD = 'PAYMENT_RECORD', _('ثبت پرداخت مالی')
        REFUND_ISSUE = 'REFUND_ISSUE', _('ثبت استرداد یا تخفیف')
        ATTENDANCE_EDIT = 'ATTENDANCE_EDIT', _('ویرایش حضور و غیاب')
        RECORD_VERIFY = 'RECORD_VERIFY', _('تأیید رکورد شنا')
        LEAGUE_RULE_CHANGE = 'LEAGUE_RULE_CHANGE', _('تغییر قوانین لیگ')
        CONFIG_CHANGE = 'CONFIG_CHANGE', _('تغییر تنظیمات سامانه')
        BACKUP_TRIGGER = 'BACKUP_TRIGGER', _('اجرای پشتیبان‌گیری')
        DEPLOY_TRIGGER = 'DEPLOY_TRIGGER', _('ثبت نشانگر استقرار')
        MAINTENANCE_TOGGLE = 'MAINTENANCE_TOGGLE', _('تغییر حالت تعمیرات')
        USER_CREATE = 'USER_CREATE', _('ایجاد کاربر جدید')
        USER_UPDATE = 'USER_UPDATE', _('ویرایش مشخصات کاربر')
        USER_DELETE = 'USER_DELETE', _('حذف کاربر')
        PASSWORD_RESET = 'PASSWORD_RESET', _('تغییر کلمه عبور کاربر')

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_actions',
        verbose_name=_('کاربر اقدام‌کننده')
    )
    action = models.CharField(_('نوع عملیات حساس'), max_length=50, choices=Action.choices, db_index=True)
    entity_type = models.CharField(_('نوع موجودیت'), max_length=100, db_index=True)
    entity_id = models.CharField(_('شناسه موجودیت'), max_length=100)
    details = models.JSONField(_('جزئیات تغییرات و مقادیر'), default=dict)
    ip_address = models.GenericIPAddressField(_('آدرس IP'), null=True, blank=True)
    timestamp = models.DateTimeField(_('زمان اقدام'), auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = _('لاگ حسابرسی عملیات حساس')
        verbose_name_plural = _('لاگ‌های حسابرسی')
        ordering = ['-timestamp']

    def __str__(self):
        actor_name = self.actor.phone if self.actor else 'سیستم'
        return f"{self.action} توسط {actor_name} روی {self.entity_type}#{self.entity_id}"


class DeploymentMarker(models.Model):
    class Status(models.TextChoices):
        SUCCESS = 'SUCCESS', _('موفق')
        FAILED = 'FAILED', _('ناموفق')
        IN_PROGRESS = 'IN_PROGRESS', _('در حال استقرار')
        ROLLED_BACK = 'ROLLED_BACK', _('بازگردانی‌شده')

    version = models.CharField(_('نسخه نرم‌افزار'), max_length=50, default='v1.0.0')
    commit_sha = models.CharField(_('شناسه کامیت گیت'), max_length=40, db_index=True)
    commit_message = models.CharField(_('پیام کامیت'), max_length=255, blank=True)
    branch = models.CharField(_('شاخه'), max_length=100, default='main')
    environment = models.CharField(_('محیط اجرا'), max_length=50, default='production')
    status = models.CharField(_('وضعیت استقرار'), max_length=20, choices=Status.choices, default=Status.SUCCESS)
    deployed_at = models.DateTimeField(_('زمان استقرار'), default=timezone.now)
    deployed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deployments_triggered',
        verbose_name=_('کاربر یا ایجنت دیپلوی')
    )
    details = models.JSONField(_('جزئیات کانتینرها و بیلد'), default=dict, blank=True)

    class Meta:
        verbose_name = _('نشانگر استقرار و نسخه')
        verbose_name_plural = _('تاریخچه استقرارها')
        ordering = ['-deployed_at']

    def __str__(self):
        return f"{self.version} ({self.commit_sha[:7]}) - {self.status}"


class BackupRecord(models.Model):
    class BackupType(models.TextChoices):
        AUTOMATED = 'AUTOMATED', _('خودکار (سیستمی)')
        MANUAL = 'MANUAL', _('دستی (توسط ناظر)')

    class Status(models.TextChoices):
        COMPLETED = 'COMPLETED', _('کامل‌شده')
        IN_PROGRESS = 'IN_PROGRESS', _('در حال ایجاد')
        FAILED = 'FAILED', _('ناموفق')

    filename = models.CharField(_('نام فایل پشتیبان'), max_length=255)
    file_size_bytes = models.BigIntegerField(_('حجم فایل به بایت'), default=0)
    backup_type = models.CharField(_('نوع پشتیبان'), max_length=20, choices=BackupType.choices, default=BackupType.AUTOMATED)
    status = models.CharField(_('وضعیت'), max_length=20, choices=Status.choices, default=Status.COMPLETED)
    checksum = models.CharField(_('چک‌سام SHA256'), max_length=64, blank=True)
    created_at = models.DateTimeField(_('زمان ایجاد'), default=timezone.now, db_index=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='backups_created',
        verbose_name=_('کاربر ایجادکننده')
    )
    duration_seconds = models.FloatField(_('مدت زمان پردازش (ثانیه)'), default=0.0)
    notes = models.TextField(_('یادداشت ناظر'), blank=True)

    class Meta:
        verbose_name = _('رکورد پشتیبان پایگاه داده')
        verbose_name_plural = _('رکوردهای پشتیبان‌گیری')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.filename} ({self.status})"


class SystemSetting(models.Model):
    key = models.CharField(_('شناسه تنظیم'), max_length=100, unique=True, db_index=True)
    value = models.JSONField(_('مقدار تنظیم'), default=dict)
    description = models.CharField(_('توضیحات'), max_length=255, blank=True)
    is_public = models.BooleanField(_('عمومی برای همه کاربران'), default=False)
    updated_at = models.DateTimeField(_('آخرین بروزرسانی'), auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='system_settings_updated',
        verbose_name=_('کاربر بروزرسان')
    )

    class Meta:
        verbose_name = _('تنظیم و متغیر فنی سامانه')
        verbose_name_plural = _('تنظیمات فنی سامانه')

    def __str__(self):
        return self.key

