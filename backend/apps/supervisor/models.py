from django.db import models
from django.conf import settings
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
