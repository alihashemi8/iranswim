from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from decimal import Decimal


class League(models.Model):
    name = models.CharField(_('عنوان دوره لیگ'), max_length=150)
    season = models.CharField(_('فصل / بازه زمانی'), max_length=50)
    starts_at = models.DateField(_('تاریخ آغاز لیگ'))
    ends_at = models.DateField(_('تاریخ پایان لیگ'))
    is_active = models.BooleanField(_('فعال'), default=True, db_index=True)
    rules_description = models.TextField(_('قوانین، نحوه امتیازدهی و ضرایب'), blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('لیگ رقابتی شنا')
        verbose_name_plural = _('لیگ‌ها')
        ordering = ['-starts_at']

    def __str__(self):
        return f"{self.name} ({self.season})"


class LeagueCategory(models.Model):
    class Gender(models.TextChoices):
        ALL = 'ALL', _('عمومی / مختلط')
        MALE = 'MALE', _('پسران')
        FEMALE = 'FEMALE', _('دختران')

    league = models.ForeignKey(
        League,
        on_delete=models.CASCADE,
        related_name='categories',
        verbose_name=_('لیگ مرتبط')
    )
    title = models.CharField(_('عنوان رده رقابتی'), max_length=100)
    age_min = models.PositiveSmallIntegerField(_('حداقل سن'), default=6)
    age_max = models.PositiveSmallIntegerField(_('حداکثر سن'), default=99)
    gender = models.CharField(_('جنسیت'), max_length=10, choices=Gender.choices, default=Gender.ALL)

    class Meta:
        verbose_name = _('رده لیگ')
        verbose_name_plural = _('رده‌های مسابقاتی لیگ')

    def __str__(self):
        return f"{self.title} - {self.league.name}"


class LeagueEntry(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', _('فعال و مجاز')
        SUSPENDED = 'SUSPENDED', _('معلق')
        DISQUALIFIED = 'DISQUALIFIED', _('حذف‌شده / دیسکالیفه')

    league = models.ForeignKey(
        League,
        on_delete=models.CASCADE,
        related_name='entries',
        verbose_name=_('لیگ')
    )
    category = models.ForeignKey(
        LeagueCategory,
        on_delete=models.CASCADE,
        related_name='entries',
        verbose_name=_('رده مسابقاتی')
    )
    swimmer = models.ForeignKey(
        'swimmers.SwimmerProfile',
        on_delete=models.CASCADE,
        related_name='league_entries',
        verbose_name=_('شناگر')
    )
    total_points = models.DecimalField(_('مجموع امتیازات کسب‌شده'), max_digits=8, decimal_places=2, default=Decimal('0.00'), db_index=True)
    status = models.CharField(
        _('وضعیت حضور در لیگ'),
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True
    )
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('عضویت شناگر در لیگ')
        verbose_name_plural = _('عضویت‌های لیگ')
        ordering = ['-total_points', 'registered_at']
        constraints = [
            models.UniqueConstraint(fields=['league', 'swimmer'], name='unique_swimmer_league_entry')
        ]

    def __str__(self):
        return f"{self.swimmer} در {self.league.name} ({self.total_points} امتیاز)"

    def recalculate_points(self):
        pts = self.results.aggregate(total=models.Sum('score_points'))['total'] or Decimal('0.00')
        self.total_points = pts
        self.save(update_fields=['total_points'])


class LeagueResult(models.Model):
    entry = models.ForeignKey(
        LeagueEntry,
        on_delete=models.CASCADE,
        related_name='results',
        verbose_name=_('شناگر در لیگ')
    )
    swimming_record = models.ForeignKey(
        'assessments.SwimmingRecord',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='league_results',
        verbose_name=_('رکورد زمانی مبنا')
    )
    event_name = models.CharField(_('عنوان ماده/رویداد مسابقه'), max_length=150)
    score_points = models.DecimalField(_('امتیاز کسب‌شده'), max_digits=6, decimal_places=2)
    recorded_at = models.DateField(_('تاریخ کسب امتیاز'))
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_('داور/تأییدکننده')
    )
    notes = models.CharField(_('توضیحات داوری'), max_length=255, blank=True)

    class Meta:
        verbose_name = _('نتیجه مسابقه لیگ')
        verbose_name_plural = _('نتایج مسابقات لیگ')
        ordering = ['-recorded_at']

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.entry.recalculate_points()
