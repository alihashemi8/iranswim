from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class AttendanceRecord(models.Model):
    class Status(models.TextChoices):
        PRESENT = 'PRESENT', _('حاضر')
        ABSENT = 'ABSENT', _('غایب غیرموجه')
        EXCUSED = 'EXCUSED', _('غایب موجه')
        LATE = 'LATE', _('حاضر با تأخیر')

    session = models.ForeignKey(
        'scheduling.ClassSession',
        on_delete=models.CASCADE,
        related_name='attendance_records',
        verbose_name=_('جلسه کلاسی')
    )
    swimmer = models.ForeignKey(
        'swimmers.SwimmerProfile',
        on_delete=models.CASCADE,
        related_name='attendance_records',
        verbose_name=_('شناگر')
    )
    enrollment = models.ForeignKey(
        'education.Enrollment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='attendance_records',
        verbose_name=_('ثبت‌نام مرتبط')
    )
    status = models.CharField(
        _('وضعیت حضور'),
        max_length=20,
        choices=Status.choices,
        default=Status.PRESENT,
        db_index=True
    )
    consumed_quota = models.BooleanField(
        _('کسر از سهمیه جلسات'),
        default=True,
        help_text=_('حاضر، غایب و تأخیر سهمیه را کسر می‌کنند؛ غایب موجه کسر نمی‌کند.')
    )
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_('ثبت‌کننده')
    )
    recorded_at = models.DateTimeField(_('زمان ثبت'), auto_now_add=True)
    updated_at = models.DateTimeField(_('زمان آخرین ویرایش'), auto_now=True)
    note = models.CharField(_('یادداشت مربی'), max_length=255, blank=True)
    change_reason = models.TextField(_('دلیل ویرایش یا اصلاح'), blank=True)

    class Meta:
        verbose_name = _('ثبت حضور و غیاب')
        verbose_name_plural = _('سوابق حضور و غیاب')
        ordering = ['-session__session_date', 'swimmer__last_name']
        constraints = [
            models.UniqueConstraint(
                fields=['session', 'swimmer'],
                name='unique_session_swimmer_attendance'
            )
        ]

    def __str__(self):
        return f"{self.swimmer} - {self.session} ({self.get_status_display()})"

    def save(self, *args, **kwargs):
        # Business rule: EXCUSED does not consume quota; PRESENT, ABSENT, LATE consume quota
        if self.status == self.Status.EXCUSED:
            self.consumed_quota = False
        else:
            self.consumed_quota = True

        super().save(*args, **kwargs)

        # Update enrollment consumed sessions count if enrollment exists
        if self.enrollment:
            count = AttendanceRecord.objects.filter(
                enrollment=self.enrollment,
                consumed_quota=True
            ).count()
            self.enrollment.sessions_attended = count
            self.enrollment.save(update_fields=['sessions_attended'])
