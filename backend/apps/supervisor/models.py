from django.db import models
from django.conf import settings
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class ErrorSeverity(models.TextChoices):
    CRITICAL = 'CRITICAL', _('بحرانی (Critical)')
    HIGH = 'HIGH', _('بالا (High)')
    MEDIUM = 'MEDIUM', _('متوسط (Medium)')
    LOW = 'LOW', _('پایین (Low)')


class ErrorCategory(models.TextChoices):
    API = 'API', _('وب‌سرویس و API')
    AUTHENTICATION = 'AUTHENTICATION', _('احراز هویت و دسترسی')
    DATABASE = 'DATABASE', _('پایگاه داده و تراکنش')
    INFRASTRUCTURE = 'INFRASTRUCTURE', _('زیرساخت و ارتباط شبکه')
    BACKGROUND_TASKS = 'BACKGROUND_TASKS', _('وظایف پس‌زمینه (Celery)')
    FRONTEND = 'FRONTEND', _('کلاینت و فرانت‌اند')
    BUSINESS_LOGIC = 'BUSINESS_LOGIC', _('منطق تجاری و عملیات')


class IncidentStatus(models.TextChoices):
    NEW = 'NEW', _('جدید (New)')
    INVESTIGATING = 'INVESTIGATING', _('در حال بررسی (Investigating)')
    PENDING_FIX = 'PENDING_FIX', _('در انتظار اصلاحیه (Pending Fix)')
    RESOLVED = 'RESOLVED', _('رفع‌شده (Resolved)')
    CLOSED = 'CLOSED', _('بسته‌شده (Closed)')


class ErrorGroup(models.Model):
    """
    موجودیت تجمیع و گروه‌بندی باگ‌ها (Incident / Error Issue):
    خطاهای تکراری با یک اثرانگشت استوار (Stable Fingerprint) تجمیع شده
    و در چرخه حیات مدیریت رخداد پیگیری می‌شوند.
    """
    fingerprint = models.CharField(_('اثر انگشت استثنا (Fingerprint)'), max_length=64, unique=True, db_index=True)
    title = models.CharField(_('عنوان خطا / استثنا'), max_length=255)
    exception_type = models.CharField(_('نوع استثنا (Exception)'), max_length=200, db_index=True)
    error_message = models.TextField(_('پیام اصلی خطا'))
    severity = models.CharField(_('شدت رخداد'), max_length=20, choices=ErrorSeverity.choices, default=ErrorSeverity.HIGH, db_index=True)
    category = models.CharField(_('دسته‌بندی فنی'), max_length=30, choices=ErrorCategory.choices, default=ErrorCategory.API, db_index=True)
    status = models.CharField(_('وضعیت پیگیری'), max_length=20, choices=IncidentStatus.choices, default=IncidentStatus.NEW, db_index=True)
    status_code = models.PositiveIntegerField(_('کد وضعیت HTTP'), default=500, db_index=True)
    http_method = models.CharField(_('متد HTTP'), max_length=10, blank=True)
    endpoint = models.CharField(_('مسیر درخواست'), max_length=255, db_index=True)
    first_seen = models.DateTimeField(_('اولین رخداد'), default=timezone.now, db_index=True)
    last_seen = models.DateTimeField(_('آخرین رخداد'), default=timezone.now, db_index=True)
    occurrence_count = models.PositiveIntegerField(_('تعداد دفعات تکرار'), default=1)
    affected_users_count = models.PositiveIntegerField(_('تعداد کاربران متأثر'), default=0)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_error_groups',
        verbose_name=_('کارشناس مسئول پیگیری')
    )
    suspected_root_cause = models.TextField(_('ریشه‌یابی و علت اولیه احتمالی'), blank=True)
    resolution_details = models.TextField(_('جزئیات اقدام اصلاحی و رفع باگ'), blank=True)
    resolved_at = models.DateTimeField(_('زمان رفع مشکل'), null=True, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_error_groups',
        verbose_name=_('ناظر تأییدکننده رفع')
    )
    first_deployment = models.ForeignKey(
        'DeploymentMarker',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='originated_error_groups',
        verbose_name=_('استقرار مرتبط با شروع خطا')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('گروه خطای سیستمی (Incident)')
        verbose_name_plural = _('گروه‌های خطای سیستمی (Incidents)')
        ordering = ['-last_seen']

    def __str__(self):
        return f"[{self.severity}] #{self.id} {self.exception_type} on {self.endpoint} ({self.occurrence_count}x)"


class SystemErrorLog(models.Model):
    """
    رکورد وقوع تک‌استثنا یا خطای خاص (Error Occurrence):
    تمام جزئیات استک‌ترس، محتوای درخواست و مشخصات کاربر را نگهداری می‌کند.
    """
    class Level(models.TextChoices):
        CRITICAL = 'CRITICAL', _('بحرانی (Crash / 500)')
        ERROR = 'ERROR', _('خطای منطقی یا تراکنشی')
        WARNING = 'WARNING', _('هشدار سیستمی')

    error_group = models.ForeignKey(
        ErrorGroup,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='occurrences',
        verbose_name=_('گروه خطای مربوطه')
    )
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
    request_id = models.CharField(_('شناسه یکتای درخواست (Request ID)'), max_length=64, blank=True, db_index=True)
    duration_ms = models.FloatField(_('مدت زمان پردازش (میلی‌ثانیه)'), null=True, blank=True)
    query_params = models.TextField(_('پارامترهای URL (Query Params)'), blank=True)
    headers_summary = models.TextField(_('هدرهای کلاینت (غیرمحرمانه)'), blank=True)

    # Legacy fields preserved for 100% backward compatibility
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


class IncidentActivity(models.Model):
    """
    تاریخچه و ردپای حسابرسی اقدامات روی هر رخداد خطا:
    تغییر وضعیت، انتساب کارشناس، یادداشت‌های داخلی و ریشه‌یابی.
    """
    class ActivityType(models.TextChoices):
        STATUS_CHANGE = 'STATUS_CHANGE', _('تغییر وضعیت')
        ASSIGNMENT = 'ASSIGNMENT', _('تخصیص به کارشناس')
        NOTE = 'NOTE', _('ثبت یادداشت داخلی')
        ROOT_CAUSE = 'ROOT_CAUSE', _('ثبت یا ویرایش ریشه خطا')
        RESOLUTION = 'RESOLUTION', _('ثبت جزئیات رفع مشکل')
        REOPENED = 'REOPENED', _('بازگشایی مجدد رخداد')

    error_group = models.ForeignKey(
        ErrorGroup,
        on_delete=models.CASCADE,
        related_name='activities',
        verbose_name=_('گروه باگ مربوطه')
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='incident_activities',
        verbose_name=_('کارشناس اقدام‌کننده')
    )
    activity_type = models.CharField(_('نوع اقدام'), max_length=30, choices=ActivityType.choices, db_index=True)
    old_value = models.CharField(_('مقدار قبلی'), max_length=255, blank=True)
    new_value = models.CharField(_('مقدار جدید'), max_length=255, blank=True)
    note = models.TextField(_('متن یادداشت یا توضیحات'), blank=True)
    created_at = models.DateTimeField(_('زمان ثبت اقدام'), auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = _('فعالیت و ردپای حسابرسی رخداد')
        verbose_name_plural = _('فعالیت‌های مدیریت رخدادها')
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.activity_type}] on Issue #{self.error_group_id} by {self.actor}"


class AlertRule(models.Model):
    """
    قوانین و آستانه‌های تولید هشدار سیستمی:
    افزایش ۵۰۰، اختلال دیتابیس، فضای دیسک و خرابی وظایف.
    """
    class AlertType(models.TextChoices):
        ERROR_SPIKE = 'ERROR_SPIKE', _('افزایش ناگهانی خطاهای سرور (500 Spikes)')
        SERVICE_DOWN = 'SERVICE_DOWN', _('قطع یا اختلال سرویس حیاتی')
        DATABASE_FAILURE = 'DATABASE_FAILURE', _('خطای اتصال به پایگاه داده')
        TASK_FAILURE = 'TASK_FAILURE', _('شکست مکرر وظایف پس‌زمینه')
        DISK_SPACE = 'DISK_SPACE', _('مصرف بیش از حد دیسک سرور')

    name = models.CharField(_('نام قانون هشدار'), max_length=150)
    alert_type = models.CharField(_('نوع قانون'), max_length=40, choices=AlertType.choices, db_index=True)
    severity = models.CharField(_('سطح هشدار'), max_length=20, choices=ErrorSeverity.choices, default=ErrorSeverity.HIGH)
    threshold_value = models.FloatField(_('مقدار آستانه'), default=5.0)
    cooldown_minutes = models.PositiveIntegerField(_('دوره استراحت اعلان (دقیقه)'), default=30)
    is_enabled = models.BooleanField(_('فعال بودن قانون'), default=True)
    last_triggered_at = models.DateTimeField(_('آخرین زمان تحریک هشدار'), null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('قانون و شرط هشدار')
        verbose_name_plural = _('قوانین هشدارهای سیستمی')

    def __str__(self):
        return f"{self.name} ({self.alert_type} >= {self.threshold_value})"


class SystemAlert(models.Model):
    """
    رکوردهای هشدارهای فعال و پیشین سامانه با قابلیت یکتاسازی (Deduplication)
    و تأیید یا برطرف‌سازی توسط ناظر.
    """
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', _('فعال (Active)')
        ACKNOWLEDGED = 'ACKNOWLEDGED', _('مشاهده و تأییدشده (Acknowledged)')
        RESOLVED = 'RESOLVED', _('برطرف‌شده (Resolved)')

    rule = models.ForeignKey(
        AlertRule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='alerts',
        verbose_name=_('قانون مربوطه')
    )
    title = models.CharField(_('عنوان هشدار'), max_length=255)
    message = models.TextField(_('شرح هشدار و جزئیات'))
    severity = models.CharField(_('سطح هشدار'), max_length=20, choices=ErrorSeverity.choices, default=ErrorSeverity.HIGH, db_index=True)
    status = models.CharField(_('وضعیت هشدار'), max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    trigger_condition = models.CharField(_('شرط بروز'), max_length=120)
    dedup_key = models.CharField(_('کلید تجمیع و عدم ارسال تکراری'), max_length=128, db_index=True)
    created_at = models.DateTimeField(_('زمان ثبت هشدار'), default=timezone.now, db_index=True)
    acknowledged_at = models.DateTimeField(_('زمان بررسی و تأیید'), null=True, blank=True)
    acknowledged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='acknowledged_alerts',
        verbose_name=_('ناظر تأییدکننده')
    )
    resolved_at = models.DateTimeField(_('زمان رفع هشدار'), null=True, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_alerts',
        verbose_name=_('ناظر رفع‌کننده')
    )
    details = models.JSONField(_('اطلاعات متنی و داده‌های فنی'), default=dict, blank=True)

    class Meta:
        verbose_name = _('هشدار و اعلان بحرانی سیستم')
        verbose_name_plural = _('هشدارهای سامانه پایش')
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.severity}] {self.title} - {self.status}"


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
        # Incident and Monitoring Audit Actions
        INCIDENT_STATUS_CHANGE = 'INCIDENT_STATUS_CHANGE', _('تغییر وضعیت رخداد خطا')
        INCIDENT_ASSIGN = 'INCIDENT_ASSIGN', _('ارجاع باگ به کارشناس')
        INCIDENT_NOTE = 'INCIDENT_NOTE', _('ثبت یادداشت روی باگ')
        INCIDENT_RESOLVE = 'INCIDENT_RESOLVE', _('ثبت گزارش رفع رخداد')
        INCIDENT_REOPEN = 'INCIDENT_REOPEN', _('بازگشایی مجدد رخداد')
        ALERT_ACKNOWLEDGE = 'ALERT_ACKNOWLEDGE', _('تأیید هشدار سیستمی')
        ALERT_RESOLVE = 'ALERT_RESOLVE', _('رفع هشدار سیستمی')

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
