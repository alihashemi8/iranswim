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


class WorkoutPlan(models.Model):
    coach = models.ForeignKey(
        CoachProfile,
        on_delete=models.CASCADE,
        related_name='workout_plans',
        verbose_name=_('مربی طراح')
    )
    title = models.CharField(_('عنوان برنامه تمرینی'), max_length=150)
    group = models.ForeignKey(
        'education.SwimmerGroup',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='workout_plans',
        verbose_name=_('گروه هدف (اختیاری)')
    )
    session = models.ForeignKey(
        'scheduling.ClassSession',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='workout_plans',
        verbose_name=_('جلسه مرتبط (اختیاری)')
    )
    target_level = models.ForeignKey(
        'education.SkillLevel',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='workout_plans',
        verbose_name=_('سطح مهارت هدف')
    )
    duration_minutes = models.PositiveIntegerField(_('مدت زمان تمرین (دقیقه)'), default=60)
    focus_skills = models.CharField(_('تمرکز آموزشی اصلی'), max_length=255, blank=True)
    warmup_section = models.TextField(_('بخش گرم‌کردن و تمرینات کششی'), blank=True)
    main_section = models.TextField(_('بخش تمرینات اصلی و ست‌های شنا'))
    cooldown_section = models.TextField(_('بخش سردکردن و ریکاوری'), blank=True)
    notes = models.TextField(_('توضیحات و نکات تکنیکی برای مربی'), blank=True)
    is_template = models.BooleanField(_('آیا به عنوان الگو ذخیره شود؟'), default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('برنامه تمرین')
        verbose_name_plural = _('برنامه‌های تمرین')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.coach.full_name})"

