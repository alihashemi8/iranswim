from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class SwimmerProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='swimmer_profile',
        verbose_name=_('حساب کاربری')
    )
    first_name = models.CharField(_('نام'), max_length=100)
    last_name = models.CharField(_('نام خانوادگی'), max_length=100)
    phone = models.CharField(_('تلفن تماس'), max_length=15, blank=True)
    national_id = models.CharField(_('کد ملی'), max_length=10, blank=True, db_index=True)
    date_of_birth = models.DateField(_('تاریخ تولد'), null=True, blank=True)
    emergency_contact_name = models.CharField(_('نام مخاطب اضطراری/ولی'), max_length=100, blank=True)
    emergency_contact_phone = models.CharField(_('شماره تماس اضطراری'), max_length=20, blank=True)
    current_level = models.ForeignKey(
        'education.SkillLevel',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='swimmers',
        verbose_name=_('سطح مهارت فعلی')
    )
    medical_notes = models.TextField(_('ملاحظات پزشکی یا ویژه'), blank=True)
    is_active = models.BooleanField(_('فعال'), default=True, db_index=True)
    created_at = models.DateTimeField(_('تاریخ ثبت'), auto_now_add=True)
    updated_at = models.DateTimeField(_('آخرین به‌روزرسانی'), auto_now=True)

    class Meta:
        verbose_name = _('پرونده شناگر')
        verbose_name_plural = _('شناگران')
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
