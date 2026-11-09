from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError


class ClassSession(models.Model):
    class Status(models.TextChoices):
        SCHEDULED = 'SCHEDULED', _('برنامه‌ریزی‌شده')
        COMPLETED = 'COMPLETED', _('برگزارشده')
        CANCELLED = 'CANCELLED', _('لغوشده')
        MAKEUP = 'MAKEUP', _('جلسه جبرانی')

    group = models.ForeignKey(
        'education.SwimmerGroup',
        on_delete=models.CASCADE,
        related_name='sessions',
        verbose_name=_('گروه آموزشی')
    )
    coach = models.ForeignKey(
        'coaches.CoachProfile',
        on_delete=models.PROTECT,
        related_name='sessions',
        verbose_name=_('مربی مسئول')
    )
    session_date = models.DateField(_('تاریخ برگزاری جلسه'), db_index=True)
    start_time = models.TimeField(_('ساعت شروع'))
    end_time = models.TimeField(_('ساعت پایان'))
    pool_location = models.CharField(_('محل استخر'), max_length=200, default='استخر اصلی')
    status = models.CharField(
        _('وضعیت جلسه'),
        max_length=20,
        choices=Status.choices,
        default=Status.SCHEDULED,
        db_index=True
    )
    is_makeup = models.BooleanField(_('آیا جلسه جبرانی است؟'), default=False)
    replaces_session = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='replacement_sessions',
        verbose_name=_('جلسه جایگزین‌شده (در صورت جبرانی بودن)')
    )
    cancellation_reason = models.TextField(_('دلیل لغو جلسه'), blank=True)
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cancelled_sessions',
        verbose_name=_('ثبت‌کننده لغو')
    )
    cancelled_at = models.DateTimeField(_('زمان ثبت لغو'), null=True, blank=True)
    session_notes = models.TextField(_('یادداشت آموزشی یا گزارش جلسه'), blank=True)
    coach_evaluation = models.TextField(_('ارزیابی و تحلیل عملکرد جلسه توسط مربی'), blank=True)
    session_rating = models.CharField(
        _('ارزیابی کیفی جلسه'),
        max_length=25,
        blank=True,
        choices=[
            ('EXCELLENT', 'عالی'),
            ('GOOD', 'خوب'),
            ('AVERAGE', 'متوسط'),
            ('NEEDS_PRACTICE', 'نیازمند تمرین بیشتر'),
        ],
        default=''
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('جلسه کلاسی')
        verbose_name_plural = _('جلسات کلاسی')
        ordering = ['session_date', 'start_time']
        indexes = [
            models.Index(fields=['session_date', 'coach']),
            models.Index(fields=['session_date', 'group']),
            models.Index(fields=['status', 'session_date']),
        ]

    def __str__(self):
        return f"{self.group.name} - {self.session_date} ({self.start_time.strftime('%H:%M')})"

    def clean(self):
        if self.start_time and self.end_time and self.end_time <= self.start_time:
            raise ValidationError(_('ساعت پایان جلسه باید بعد از ساعت شروع باشد.'))

        # Check Coach conflict on the same date and overlapping time
        coach_conflicts = ClassSession.objects.filter(
            coach=self.coach,
            session_date=self.session_date,
            status__in=[self.Status.SCHEDULED, self.Status.MAKEUP]
        ).exclude(pk=self.pk)

        for other in coach_conflicts:
            if not (self.end_time <= other.start_time or self.start_time >= other.end_time):
                raise ValidationError(
                    _('تداخل مربی: مربی %(coach)s در این بازه زمانی در کلاس %(group)s حضور دارد.'),
                    params={'coach': self.coach, 'group': other.group.name}
                )

        # Check Pool location conflict on same date and overlapping time
        pool_conflicts = ClassSession.objects.filter(
            pool_location=self.pool_location,
            session_date=self.session_date,
            status__in=[self.Status.SCHEDULED, self.Status.MAKEUP]
        ).exclude(pk=self.pk)

        for other in pool_conflicts:
            if not (self.end_time <= other.start_time or self.start_time >= other.end_time):
                raise ValidationError(
                    _('تداخل استخر: مکان %(loc)s در این بازه برای کلاس %(group)s رزرو شده است.'),
                    params={'loc': self.pool_location, 'group': other.group.name}
                )
