from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils import timezone


class NewsPost(models.Model):
    class Category(models.TextChoices):
        GENERAL = 'GENERAL', _('عمومی و اطلاعیه‌ها')
        COMPETITIONS = 'COMPETITIONS', _('مسابقات و رویدادها')
        CLASSES = 'CLASSES', _('دوره‌ها و کلاس‌ها')
        HEALTH = 'HEALTH', _('آموزش و بهداشت استخر')

    class Status(models.TextChoices):
        DRAFT = 'DRAFT', _('پیش‌نویس')
        PUBLISHED = 'PUBLISHED', _('منتشرشده')
        ARCHIVED = 'ARCHIVED', _('بایگانی‌شده')

    title = models.CharField(_('عنوان خبر'), max_length=200)
    slug = models.SlugField(_('نامک (Slug)'), max_length=220, unique=True, allow_unicode=True)
    body = models.TextField(_('متن کامل خبر'))
    summary = models.TextField(_('خلاصه خبر'), max_length=400, blank=True)
    image = models.ImageField(_('تصویر شاخص'), upload_to='news/', null=True, blank=True)
    category = models.CharField(_('دسته‌بندی'), max_length=20, choices=Category.choices, default=Category.GENERAL)
    status = models.CharField(_('وضعیت انتشار'), max_length=20, choices=Status.choices, default=Status.PUBLISHED, db_index=True)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, verbose_name=_('نویسنده'))
    publish_at = models.DateTimeField(_('زمان انتشار'), default=timezone.now, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('خبر و اطلاعیه عمومی')
        verbose_name_plural = _('اخبار آموزشگاه')
        ordering = ['-publish_at']

    def __str__(self):
        return self.title


class Announcement(models.Model):
    class Audience(models.TextChoices):
        ALL = 'ALL', _('همه اعضا')
        SWIMMERS = 'SWIMMERS', _('فقط شناگران')
        COACHES = 'COACHES', _('فقط مربیان')
        GROUP = 'GROUP', _('اعضای یک گروه مشخص')

    title = models.CharField(_('عنوان اعلان'), max_length=180)
    message = models.TextField(_('متن اعلان'))
    audience = models.CharField(_('مخاطبان هدف'), max_length=20, choices=Audience.choices, default=Audience.ALL)
    target_group = models.ForeignKey(
        'education.SwimmerGroup',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='announcements',
        verbose_name=_('گروه هدف (در صورت انتخاب گروه)')
    )
    is_pinned = models.BooleanField(_('پین شده / مهم'), default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('اعلان درون‌برنامه‌ای')
        verbose_name_plural = _('اعلان‌های درون‌برنامه‌ای')
        ordering = ['-is_pinned', '-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_audience_display()})"


class Notification(models.Model):
    class Category(models.TextChoices):
        REGISTRATION = 'REGISTRATION', _('درخواست ثبت‌نام جدید')
        PAYMENT = 'PAYMENT', _('سررسید یا تأخیر پرداخت اقساط')
        SCHEDULE = 'SCHEDULE', _('تغییر یا لغو برنامه کلاس')
        ANNOUNCEMENT = 'ANNOUNCEMENT', _('اطلاعیه‌های مهم سیستم')

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
        verbose_name=_('کاربر گیرنده')
    )
    category = models.CharField(
        _('دسته‌بندی اعلان'),
        max_length=20,
        choices=Category.choices,
        default=Category.ANNOUNCEMENT,
        db_index=True
    )
    title = models.CharField(_('عنوان اعلان'), max_length=200)
    message = models.TextField(_('متن و توضیحات اعلان'))
    link = models.CharField(_('مسیر صفحه مرتبط در سامانه'), max_length=255, blank=True)
    is_read = models.BooleanField(_('خوانده‌شده'), default=False, db_index=True)
    created_at = models.DateTimeField(_('زمان ثبت'), auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = _('اعلان')
        verbose_name_plural = _('اعلان‌ها')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_category_display()})"

