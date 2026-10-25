from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class SkillAssessment(models.Model):
    class Status(models.TextChoices):
        PASSED = 'PASSED', _('قبول / کسب مهارت')
        IN_PROGRESS = 'IN_PROGRESS', _('در حال تمرین')
        NEEDS_PRACTICE = 'NEEDS_PRACTICE', _('نیازمند تمرین بیشتر')

    swimmer = models.ForeignKey(
        'swimmers.SwimmerProfile',
        on_delete=models.CASCADE,
        related_name='skill_assessments',
        verbose_name=_('شناگر')
    )
    skill = models.ForeignKey(
        'education.Skill',
        on_delete=models.PROTECT,
        related_name='assessments',
        verbose_name=_('آیتم مهارتی')
    )
    assessed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_('مربی ارزیاب')
    )
    assessed_at = models.DateField(_('تاریخ ارزیابی'), db_index=True)
    score = models.DecimalField(_('نمره ارزیابی (از ۱۰۰)'), max_digits=5, decimal_places=2, default=100.0)
    status = models.CharField(
        _('نتیجه ارزیابی'),
        max_length=20,
        choices=Status.choices,
        default=Status.IN_PROGRESS,
        db_index=True
    )
    feedback = models.TextField(_('توضیحات و بازخورد مربی'), blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('ارزیابی مهارتی شناگر')
        verbose_name_plural = _('ارزیابی‌های مهارتی')
        ordering = ['-assessed_at', '-created_at']

    def __str__(self):
        return f"{self.swimmer} - {self.skill.name}: {self.get_status_display()}"


class SwimmingRecord(models.Model):
    class Stroke(models.TextChoices):
        FREESTYLE = 'FREESTYLE', _('کرال سینه (آزاد)')
        BACKSTROKE = 'BACKSTROKE', _('کرال پشت')
        BREASTSTROKE = 'BREASTSTROKE', _('شنای قورباغه')
        BUTTERFLY = 'BUTTERFLY', _('شنای پروانه')
        INDIVIDUAL_MEDLEY = 'MEDLEY', _('مختلط انفرادی')

    class VerificationStatus(models.TextChoices):
        PENDING = 'PENDING', _('در انتظار تأیید داور/مدیر')
        VERIFIED = 'VERIFIED', _('تأییدشده و رسمی')
        REJECTED = 'REJECTED', _('رد شده')

    class PoolCourse(models.TextChoices):
        SHORT_25M = 'SHORT_25M', _('استخر ۲۵ متر (مسافت کوتاه)')
        LONG_50M = 'LONG_50M', _('استخر ۵۰ متر (المپیک)')

    swimmer = models.ForeignKey(
        'swimmers.SwimmerProfile',
        on_delete=models.CASCADE,
        related_name='swimming_records',
        verbose_name=_('شناگر')
    )
    stroke = models.CharField(_('ماده / سبک شنا'), max_length=20, choices=Stroke.choices, db_index=True)
    distance_meters = models.PositiveIntegerField(_('مسافت (متر)'), db_index=True)
    duration_seconds = models.DecimalField(_('زمان ثبت‌شده (ثانیه)'), max_digits=6, decimal_places=2, db_index=True)
    pool_course = models.CharField(
        _('نوع استخر'),
        max_length=20,
        choices=PoolCourse.choices,
        default=PoolCourse.SHORT_25M
    )
    recorded_at = models.DateField(_('تاریخ ثبت رکورد'), db_index=True)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='registered_records',
        verbose_name=_('ثبت‌کننده رکورد')
    )
    verification_status = models.CharField(
        _('وضعیت تأیید'),
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
        db_index=True
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_records',
        verbose_name=_('تأییدکننده')
    )
    rejection_reason = models.TextField(_('دلیل رد رکورد'), blank=True)
    notes = models.CharField(_('شرایط مسابقه/آزمون'), max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('رکورد زمانی شنا')
        verbose_name_plural = _('رکوردهای شنا')
        ordering = ['distance_meters', 'stroke', 'duration_seconds']

    def __str__(self):
        return f"{self.swimmer} - {self.distance_meters}م {self.get_stroke_display()}: {self.duration_seconds}s"

    @property
    def formatted_time(self):
        total_sec = float(self.duration_seconds)
        mins = int(total_sec // 60)
        secs = total_sec % 60
        if mins > 0:
            return f"{mins}:{secs:05.2f}"
        return f"{secs:.2f}s"
