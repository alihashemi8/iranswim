from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class SwimmerProfile(models.Model):
    class Gender(models.TextChoices):
        MALE = 'MALE', _('پسر / آقایان')
        FEMALE = 'FEMALE', _('دختر / بانوان')

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
    gender = models.CharField(_('جنسیت'), max_length=10, choices=Gender.choices, default=Gender.MALE, blank=True)
    phone = models.CharField(_('تلفن تماس'), max_length=15, blank=True)
    national_id = models.CharField(_('کد ملی'), max_length=10, blank=True, db_index=True)
    date_of_birth = models.DateField(_('تاریخ تولد'), null=True, blank=True)
    father_name = models.CharField(_('نام پدر'), max_length=100, blank=True)
    father_phone = models.CharField(_('شماره تماس پدر'), max_length=20, blank=True)
    mother_phone = models.CharField(_('شماره تماس مادر'), max_length=20, blank=True)
    emergency_contact_name = models.CharField(_('نام مخاطب اضطراری/ولی'), max_length=100, blank=True)
    emergency_contact_phone = models.CharField(_('شماره تماس اضطراری'), max_length=20, blank=True)
    address = models.TextField(_('آدرس منزل'), blank=True)
    latitude = models.FloatField(_('عرض جغرافیایی (Latitude)'), null=True, blank=True)
    longitude = models.FloatField(_('طول جغرافیایی (Longitude)'), null=True, blank=True)
    school_name = models.CharField(_('نام مدرسه'), max_length=150, blank=True)
    avatar = models.ImageField(_('عکس پروفایل'), upload_to='swimmers/avatars/', null=True, blank=True)
    birth_certificate_image = models.ImageField(_('عکس صفحه اول شناسنامه'), upload_to='swimmers/documents/', null=True, blank=True)
    national_card_image = models.ImageField(_('عکس کارت ملی'), upload_to='swimmers/documents/', null=True, blank=True)
    sports_insurance_image = models.ImageField(_('عکس بیمه ورزشی'), upload_to='swimmers/documents/', null=True, blank=True)
    is_profile_completed = models.BooleanField(_('تکمیل پرونده انجام شده'), default=False, db_index=True)
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

    @property
    def has_required_info(self):
        has_parent_phone = bool(self.father_phone or self.mother_phone or self.emergency_contact_phone)
        return bool(
            self.first_name and self.last_name and self.date_of_birth and
            self.father_name and self.national_id and self.address and
            has_parent_phone and self.gender and
            self.birth_certificate_image and self.national_card_image and
            self.sports_insurance_image
        )

