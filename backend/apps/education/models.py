from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError


class SkillLevel(models.Model):
    name = models.CharField(_('نام سطح مهارت'), max_length=100)
    description = models.TextField(_('توضیحات و نیازمندی‌ها'), blank=True)
    order = models.PositiveSmallIntegerField(_('ترتیب سطح'), default=1)
    color_badge = models.CharField(_('کد رنگ برچسب'), max_length=20, default='#0284c7')
    is_active = models.BooleanField(_('فعال'), default=True)

    class Meta:
        verbose_name = _('سطح مهارت')
        verbose_name_plural = _('سطوح مهارت')
        ordering = ['order', 'name']

    def __str__(self):
        return f"{self.order}. {self.name}"


class Skill(models.Model):
    level = models.ForeignKey(
        SkillLevel,
        on_delete=models.CASCADE,
        related_name='skills',
        verbose_name=_('سطح مهارت مرتبط')
    )
    name = models.CharField(_('عنوان مهارت/آیتم آموزشی'), max_length=150)
    criteria_description = models.TextField(_('معیار سنجش و قبولی'), blank=True)
    order = models.PositiveSmallIntegerField(_('ترتیب'), default=1)

    class Meta:
        verbose_name = _('مهارت آموزشی')
        verbose_name_plural = _('مهارت‌های آموزشی')
        ordering = ['level', 'order']

    def __str__(self):
        return f"{self.name} ({self.level.name})"


class Course(models.Model):
    class Status(models.TextChoices):
        UPCOMING = 'UPCOMING', _('پیش‌ثبت‌نام')
        ACTIVE = 'ACTIVE', _('در حال برگزاری')
        COMPLETED = 'COMPLETED', _('خاتمه‌یافته')
        ARCHIVED = 'ARCHIVED', _('بایگانی‌شده')

    name = models.CharField(_('عنوان دوره'), max_length=200)
    description = models.TextField(_('توضیحات دوره'), blank=True)
    start_date = models.DateField(_('تاریخ شروع'))
    end_date = models.DateField(_('تاریخ پایان'))
    base_price = models.DecimalField(_('شهریه پایه (تومان)'), max_digits=12, decimal_places=2)
    sessions_count = models.PositiveIntegerField(_('تعداد جلسات کل دوره'), default=12)
    status = models.CharField(
        _('وضعیت دوره'),
        max_length=20,
        choices=Status.choices,
        default=Status.UPCOMING,
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('دوره آموزشی')
        verbose_name_plural = _('دوره‌های آموزشی')
        ordering = ['-start_date']

    def __str__(self):
        return self.name

    def clean(self):
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValidationError(_('تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.'))


class SwimmerGroup(models.Model):
    class Status(models.TextChoices):
        OPEN = 'OPEN', _('ثبت‌نام باز')
        FULL = 'FULL', _('تکمیل ظرفیت')
        CLOSED = 'CLOSED', _('بسته‌شده')
        CANCELLED = 'CANCELLED', _('لغو شده')

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='groups',
        verbose_name=_('دوره آموزشی')
    )
    name = models.CharField(_('نام گروه اجرایی'), max_length=150)
    skill_level = models.ForeignKey(
        SkillLevel,
        on_delete=models.PROTECT,
        related_name='groups',
        verbose_name=_('سطح مهارت گروه')
    )
    capacity = models.PositiveIntegerField(_('ظرفیت مجاز'), default=15)
    pool_location = models.CharField(_('استخر و محل برگزاری'), max_length=200, default='استخر اصلی')
    status = models.CharField(
        _('وضعیت گروه'),
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN,
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('گروه اجرایی')
        verbose_name_plural = _('گروه‌های اجرایی')
        ordering = ['course', 'name']

    def __str__(self):
        return f"{self.course.name} - {self.name}"

    @property
    def current_enrollments_count(self):
        return self.enrollments.filter(status__in=['ACTIVE', 'PENDING_PAYMENT']).count()

    @property
    def remaining_capacity(self):
        return max(0, self.capacity - self.current_enrollments_count)


class GroupSchedule(models.Model):
    class Weekday(models.IntegerChoices):
        SATURDAY = 0, _('شنبه')
        SUNDAY = 1, _('یک‌شنبه')
        MONDAY = 2, _('دوشنبه')
        TUESDAY = 3, _('سه‌شنبه')
        WEDNESDAY = 4, _('چهارشنبه')
        THURSDAY = 5, _('پنج‌شنبه')
        FRIDAY = 6, _('جمعه')

    group = models.ForeignKey(
        SwimmerGroup,
        on_delete=models.CASCADE,
        related_name='schedules',
        verbose_name=_('گروه اجرایی')
    )
    weekday = models.PositiveSmallIntegerField(_('روز هفته'), choices=Weekday.choices)
    start_time = models.TimeField(_('ساعت شروع'))
    end_time = models.TimeField(_('ساعت پایان'))

    class Meta:
        verbose_name = _('برنامه هفتگی گروه')
        verbose_name_plural = _('برنامه‌های هفتگی گروه')
        ordering = ['weekday', 'start_time']

    def __str__(self):
        return f"{self.get_weekday_display()} ({self.start_time.strftime('%H:%M')} تا {self.end_time.strftime('%H:%M')})"


class GroupCoach(models.Model):
    group = models.ForeignKey(
        SwimmerGroup,
        on_delete=models.CASCADE,
        related_name='coach_assignments',
        verbose_name=_('گروه اجرایی')
    )
    coach = models.ForeignKey(
        'coaches.CoachProfile',
        on_delete=models.CASCADE,
        related_name='assigned_groups',
        verbose_name=_('مربی')
    )
    assigned_from = models.DateField(_('تاریخ آغاز تخصیص'))
    assigned_to = models.DateField(_('تاریخ پایان تخصیص'), null=True, blank=True)
    is_primary = models.BooleanField(_('مربی اصلی گروه'), default=True)

    class Meta:
        verbose_name = _('تخصیص مربی به گروه')
        verbose_name_plural = _('تخصیص‌های مربیان به گروه‌ها')
        ordering = ['-assigned_from']

    def __str__(self):
        return f"{self.coach} -> {self.group.name}"


class EnrollmentRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', _('در انتظار بررسی')
        APPROVED = 'APPROVED', _('تأیید شده')
        REJECTED = 'REJECTED', _('رد شده')
        WAITLIST = 'WAITLIST', _('در فهرست انتظار')

    swimmer = models.ForeignKey(
        'swimmers.SwimmerProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='enrollment_requests',
        verbose_name=_('شناگر (در صورت وجود پرونده)')
    )
    applicant_name = models.CharField(_('نام و نام خانوادگی متقاضی'), max_length=150)
    applicant_phone = models.CharField(_('شماره همراه متقاضی'), max_length=15, db_index=True)
    applicant_national_id = models.CharField(_('کد ملی'), max_length=10, blank=True)
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='enrollment_requests',
        verbose_name=_('دوره درخواستی')
    )
    group = models.ForeignKey(
        SwimmerGroup,
        on_delete=models.CASCADE,
        related_name='enrollment_requests',
        verbose_name=_('گروه درخواستی')
    )
    status = models.CharField(
        _('وضعیت درخواست'),
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )
    notes = models.TextField(_('توضیحات متقاضی'), blank=True)
    rejection_reason = models.TextField(_('دلیل رد درخواست'), blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_('بررسی‌کننده')
    )
    created_at = models.DateTimeField(_('زمان ثبت درخواست'), auto_now_add=True)
    reviewed_at = models.DateTimeField(_('زمان بررسی'), null=True, blank=True)

    class Meta:
        verbose_name = _('درخواست ثبت‌نام آنلاین')
        verbose_name_plural = _('درخواست‌های ثبت‌نام آنلاین')
        ordering = ['-created_at']

    def __str__(self):
        return f"درخواست {self.applicant_name} برای {self.group.name} ({self.get_status_display()})"


class Enrollment(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', _('فعال')
        PENDING_PAYMENT = 'PENDING_PAYMENT', _('در انتظار پرداخت')
        COMPLETED = 'COMPLETED', _('تکمیل‌شده/پایان‌یافته')
        CANCELLED = 'CANCELLED', _('لغوشده')

    swimmer = models.ForeignKey(
        'swimmers.SwimmerProfile',
        on_delete=models.PROTECT,
        related_name='enrollments',
        verbose_name=_('شناگر')
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.PROTECT,
        related_name='enrollments',
        verbose_name=_('دوره آموزشی')
    )
    group = models.ForeignKey(
        SwimmerGroup,
        on_delete=models.PROTECT,
        related_name='enrollments',
        verbose_name=_('گروه اجرایی')
    )
    status = models.CharField(
        _('وضعیت ثبت‌نام'),
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING_PAYMENT,
        db_index=True
    )
    sessions_purchased = models.PositiveIntegerField(_('تعداد جلسات خریداری‌شده'), default=12)
    sessions_attended = models.PositiveIntegerField(_('تعداد جلسات مصرف‌شده'), default=0)
    enrolled_at = models.DateTimeField(_('تاریخ ثبت‌نام'), auto_now_add=True)
    notes = models.TextField(_('یادداشت مدیر'), blank=True)

    class Meta:
        verbose_name = _('ثبت‌نام قطعی')
        verbose_name_plural = _('ثبت‌نام‌های قطعی')
        ordering = ['-enrolled_at']
        constraints = [
            models.UniqueConstraint(
                fields=['swimmer', 'course', 'group'],
                name='unique_swimmer_course_group'
            )
        ]

    def __str__(self):
        return f"{self.swimmer} در {self.group.name}"

    @property
    def remaining_sessions(self):
        return max(0, self.sessions_purchased - self.sessions_attended)
