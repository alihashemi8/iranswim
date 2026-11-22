from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError

from apps.locations.geo_config import is_point_in_qazvin
from apps.locations.persian_normalizer import normalize_persian


class PlaceCategory(models.TextChoices):
    LANDMARK = 'landmark', _('اماکن و شاخص‌ها')
    STREET = 'street', _('خیابان‌ها و معابر اصلی')
    NEIGHBORHOOD = 'neighborhood', _('محله‌ها')
    POOL = 'pool', _('استخرها و اماکن ورزشی')
    HEALTH = 'health', _('مراکز درمانی و بیمارستان‌ها')
    EDUCATION = 'education', _('دانشگاه‌ها و مراکز آموزشی')
    COMMERCIAL = 'commercial', _('مراکز تجاری و بازار')
    SERVICE = 'service', _('خدمات شهری و رفاهی')
    TRANSPORT = 'transport', _('پایانه‌ها و حمل‌ونقل')
    ALLEY = 'alley', _('کوچه‌ها و معابر فرعی')


class QazvinPlace(models.Model):
    title = models.CharField(_('عنوان مکان'), max_length=200)
    category = models.CharField(
        _('دسته‌بندی'),
        max_length=40,
        choices=PlaceCategory.choices,
        default=PlaceCategory.LANDMARK,
        db_index=True
    )
    place_type = models.CharField(
        _('نوع دقیق مکان'),
        max_length=50,
        blank=True,
        db_index=True,
        help_text=_('مثال: pool, hospital, square, street, alley, university, park, mall, pharmacy, gas_station')
    )
    address = models.TextField(_('آدرس کامل / سلسله‌مراتب شهری'))
    neighborhood = models.CharField(_('محله'), max_length=120, blank=True, db_index=True)
    street = models.CharField(_('خیابان اصلی'), max_length=150, blank=True)
    alley = models.CharField(_('کوچه / فرعی'), max_length=150, blank=True)
    latitude = models.FloatField(_('عرض جغرافیایی (Latitude)'), db_index=True)
    longitude = models.FloatField(_('طول جغرافیایی (Longitude)'), db_index=True)
    importance = models.PositiveSmallIntegerField(
        _('ضریب اهمیت (۱ تا ۱۰۰)'),
        default=50,
        db_index=True
    )
    search_count = models.PositiveIntegerField(
        _('تعداد دفعات جستجو'),
        default=0,
        db_index=True
    )
    keywords = models.JSONField(
        _('کلمات کلیدی و مترادف‌ها'),
        default=list,
        blank=True
    )
    normalized_title = models.CharField(
        _('عنوان نرمالایزشده'),
        max_length=200,
        db_index=True,
        blank=True
    )
    normalized_address = models.TextField(
        _('آدرس نرمالایزشده'),
        blank=True
    )
    metadata = models.JSONField(
        _('اطلاعات تکمیلی'),
        default=dict,
        blank=True
    )
    is_active = models.BooleanField(_('فعال'), default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('مکان شهر قزوین')
        verbose_name_plural = _('بانک اماکن شهر قزوین')
        ordering = ['-importance', '-search_count', 'title']
        indexes = [
            models.Index(fields=['category', 'importance']),
            models.Index(fields=['normalized_title']),
            models.Index(fields=['neighborhood']),
            models.Index(fields=['latitude', 'longitude']),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_category_display()})"

    def clean(self):
        super().clean()
        if self.latitude is not None and self.longitude is not None:
            if not is_point_in_qazvin(self.latitude, self.longitude):
                raise ValidationError(
                    _('مختصات ثبت‌شده (%(lat)s, %(lng)s) خارج از محدوده مجاز شهر قزوین قرار دارد.'),
                    params={'lat': self.latitude, 'lng': self.longitude}
                )

    def save(self, *args, **kwargs):
        self.normalized_title = normalize_persian(self.title)
        self.normalized_address = normalize_persian(self.address)
        self.full_clean()
        super().save(*args, **kwargs)


class SearchQueryLog(models.Model):
    query = models.CharField(_('عبارت جستجو'), max_length=200)
    normalized_query = models.CharField(_('عبارت نرمالایزشده'), max_length=200, db_index=True)
    results_count = models.PositiveIntegerField(_('تعداد نتایج'), default=0)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='location_search_logs',
        verbose_name=_('کاربر جستجوکننده')
    )
    user_latitude = models.FloatField(_('عرض جغرافیایی کاربر'), null=True, blank=True)
    user_longitude = models.FloatField(_('طول جغرافیایی کاربر'), null=True, blank=True)
    execution_time_ms = models.FloatField(_('مدت زمان پردازش (میلی‌ثانیه)'), default=0.0)
    created_at = models.DateTimeField(_('زمان ثبت'), auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = _('لاگ جستجوی موقعیت')
        verbose_name_plural = _('لاگ‌های جستجوی موقعیت')
        ordering = ['-created_at']
