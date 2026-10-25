from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class CoachProfile(models.Model):
    class EmploymentStatus(models.TextChoices):
        ACTIVE = 'ACTIVE', _('فعال و مجاز')
        SUSPENDED = 'SUSPENDED', _('معلق')
        INACTIVE = 'INACTIVE', _('غیرفعال')

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='coach_profile',
        verbose_name=_('حساب کاربری مربی')
    )
    specialties = models.CharField(_('تخصص‌ها (کرال سینه، پروانه و...)'), max_length=255, blank=True)
    bio = models.TextField(_('رزومه و بیوگرافی'), blank=True)
    employment_status = models.CharField(
        _('وضعیت کاری'),
        max_length=20,
        choices=EmploymentStatus.choices,
        default=EmploymentStatus.ACTIVE,
        db_index=True
    )
    hourly_rate = models.DecimalField(_('نرخ ساعتی (تومان)'), max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(_('تاریخ ثبت'), auto_now_add=True)
    updated_at = models.DateTimeField(_('آخرین به‌روزرسانی'), auto_now=True)

    class Meta:
        verbose_name = _('پروفایل مربی')
        verbose_name_plural = _('مربیان')
        ordering = ['user__last_name', 'user__first_name']

    def __str__(self):
        return f"مربی {self.user.get_full_name() or self.user.phone}"

    @property
    def full_name(self):
        return self.user.get_full_name() or self.user.phone
