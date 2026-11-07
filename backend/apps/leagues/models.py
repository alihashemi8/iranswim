from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from decimal import Decimal


def default_scoring_rules():
    return {
        "rank_1": 10,
        "rank_2": 7,
        "rank_3": 5,
        "rank_4": 3,
        "rank_5": 2,
        "participation": 1,
        "record_bonus": 2,
        "tie_breaker": "gold_medals"
    }


class League(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', _('پیش‌نویس')
        ACTIVE = 'ACTIVE', _('فعال')
        COMPLETED = 'COMPLETED', _('پایان‌یافته')
        ARCHIVED = 'ARCHIVED', _('بایگانی‌شده')

    name = models.CharField(_('عنوان دوره لیگ'), max_length=150)
    season = models.CharField(_('فصل / بازه زمانی'), max_length=50)
    starts_at = models.DateField(_('تاریخ آغاز لیگ'))
    ends_at = models.DateField(_('تاریخ پایان لیگ'))
    status = models.CharField(
        _('وضعیت دوره'),
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True
    )
    is_active = models.BooleanField(_('فعال'), default=True, db_index=True)
    rules_description = models.TextField(_('قوانین، نحوه امتیازدهی و ضرایب'), blank=True)
    scoring_rules = models.JSONField(
        _('پیکربندی امتیازدهی مسابقات'),
        default=default_scoring_rules,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('لیگ رقابتی شنا')
        verbose_name_plural = _('لیگ‌ها')
        ordering = ['-starts_at']

    def __str__(self):
        return f"{self.name} ({self.season})"

    def recalculate_all_entries(self):
        for entry in self.entries.all():
            entry.recalculate_points()


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


class LeagueCompetition(models.Model):
    class Stroke(models.TextChoices):
        FREESTYLE = 'FREESTYLE', _('شنای کرال سینه (آزاد)')
        BACKSTROKE = 'BACKSTROKE', _('شنای کرال پشت')
        BREASTSTROKE = 'BREASTSTROKE', _('شنای قورباغه')
        BUTTERFLY = 'BUTTERFLY', _('شنای پروانه')
        MEDLEY = 'MEDLEY', _('شنای مختلط انفرادی')

    class Status(models.TextChoices):
        SCHEDULED = 'SCHEDULED', _('برنامه‌ریزی‌شده (پیش‌رو)')
        IN_PROGRESS = 'IN_PROGRESS', _('در حال برگزاری')
        COMPLETED = 'COMPLETED', _('پایان‌یافته و ثبت نتایج')
        CANCELLED = 'CANCELLED', _('لغوشده')

    class Gender(models.TextChoices):
        ALL = 'ALL', _('عمومی / مختلط')
        MALE = 'MALE', _('پسران')
        FEMALE = 'FEMALE', _('دختران')

    league = models.ForeignKey(
        League,
        on_delete=models.CASCADE,
        related_name='competitions',
        verbose_name=_('لیگ مرتبط')
    )
    category = models.ForeignKey(
        LeagueCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='competitions',
        verbose_name=_('رده سنی و جنسیتی مجاز')
    )
    title = models.CharField(_('عنوان رویداد مسابقه'), max_length=150)
    stroke = models.CharField(_('ماده شنا'), max_length=30, choices=Stroke.choices, default=Stroke.FREESTYLE)
    distance_meters = models.PositiveIntegerField(_('مسافت (متر)'), default=50)
    gender = models.CharField(_('جنسیت'), max_length=10, choices=Gender.choices, default=Gender.ALL)
    held_at = models.DateField(_('تاریخ برگزاری مسابقه'))
    location = models.CharField(_('محل استخر / موقعیت'), max_length=150, blank=True, default='استخر اصلی آکادمی')
    status = models.CharField(_('وضعیت مسابقه'), max_length=20, choices=Status.choices, default=Status.SCHEDULED, db_index=True)
    notes = models.TextField(_('توضیحات و قوانین خاص مسابقه'), blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('مسابقه لیگ')
        verbose_name_plural = _('مسابقات و رویدادهای لیگ')
        ordering = ['-held_at', '-id']

    def __str__(self):
        return f"{self.title} ({self.get_stroke_display()} {self.distance_meters}م)"


class LeagueEntry(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', _('فعال و مجاز')
        SUSPENDED = 'SUSPENDED', _('معلق')
        DISQUALIFIED = 'DISQUALIFIED', _('حذف‌شده / دیسکالیفه')

    class RankTrend(models.TextChoices):
        UP = 'UP', _('صعودی')
        SAME = 'SAME', _('بدون تغییر')
        DOWN = 'DOWN', _('نزولی')

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
    rank_trend = models.CharField(
        _('روند تغییر رتبه'),
        max_length=10,
        choices=RankTrend.choices,
        default=RankTrend.SAME
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

    @property
    def gold_medals(self):
        return self.results.filter(medal=LeagueResult.Medal.GOLD).count()

    @property
    def silver_medals(self):
        return self.results.filter(medal=LeagueResult.Medal.SILVER).count()

    @property
    def bronze_medals(self):
        return self.results.filter(medal=LeagueResult.Medal.BRONZE).count()

    @property
    def matches_count(self):
        return self.results.filter(competition__isnull=False).values('competition').distinct().count() or self.results.count()


class LeagueResult(models.Model):
    class Medal(models.TextChoices):
        NONE = 'NONE', _('بدون مدال')
        GOLD = 'GOLD', _('طلا')
        SILVER = 'SILVER', _('نقره')
        BRONZE = 'BRONZE', _('برنز')

    entry = models.ForeignKey(
        LeagueEntry,
        on_delete=models.CASCADE,
        related_name='results',
        verbose_name=_('شناگر در لیگ')
    )
    competition = models.ForeignKey(
        LeagueCompetition,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='results',
        verbose_name=_('رویداد مسابقه مرتبط')
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
    duration_seconds = models.DecimalField(_('زمان ثبت‌شده (ثانیه)'), max_digits=6, decimal_places=2, null=True, blank=True)
    rank = models.PositiveIntegerField(_('رتبه در مسابقه'), null=True, blank=True)
    medal = models.CharField(_('مدال'), max_length=10, choices=Medal.choices, default=Medal.NONE)
    score_points = models.DecimalField(_('امتیاز کسب‌شده'), max_digits=6, decimal_places=2)
    is_manual = models.BooleanField(_('ثبت دستی / امتیاز تشویقی یا پنالتی'), default=False)
    recorded_at = models.DateField(_('تاریخ کسب امتیاز'))
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_('داور/تأییدکننده')
    )
    notes = models.CharField(_('توضیحات داوری / علت امتیاز'), max_length=255, blank=True)

    class Meta:
        verbose_name = _('نتیجه مسابقه لیگ')
        verbose_name_plural = _('نتایج مسابقات لیگ')
        ordering = ['-recorded_at', '-id']

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.entry.recalculate_points()

    def delete(self, *args, **kwargs):
        entry = self.entry
        super().delete(*args, **kwargs)
        entry.recalculate_points()

    @property
    def formatted_time(self):
        if not self.duration_seconds:
            return '-'
        total_sec = float(self.duration_seconds)
        mins = int(total_sec // 60)
        secs = total_sec % 60
        if mins > 0:
            return f"{mins}:{secs:05.2f}"
        return f"{secs:.2f}s"
