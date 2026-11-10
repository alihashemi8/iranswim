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
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='skills',
        verbose_name=_('سطح مهارت مرتبط')
    )
    name = models.CharField(_('عنوان مهارت/آیتم آموزشی'), max_length=150)
    criteria_description = models.TextField(_('معیار سنجش و قبولی'), blank=True)
    order = models.PositiveSmallIntegerField(_('ترتیب'), default=1)
    coach = models.ForeignKey(
        'coaches.CoachProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='custom_skills',
        verbose_name=_('مربی تعریف‌کننده')
    )
    is_custom = models.BooleanField(_('آیتم اختصاصی مربی'), default=False)

    class Meta:
        verbose_name = _('مهارت آموزشی')
        verbose_name_plural = _('مهارت‌های آموزشی')
        ordering = ['order', 'name']

    def __str__(self):
        level_str = self.level.name if self.level else (_('اختصاصی ') + (self.coach.full_name if self.coach else _('مربی')))
        return f"{self.name} ({level_str})"


class Course(models.Model):
    class Status(models.TextChoices):
        UPCOMING = 'UPCOMING', _('پیش‌ثبت‌نام')
        ACTIVE = 'ACTIVE', _('در حال برگزاری')
        COMPLETED = 'COMPLETED', _('خاتمه‌یافته')
        ARCHIVED = 'ARCHIVED', _('بایگانی‌شده')

    class GenderTarget(models.TextChoices):
        MALE = 'MALE', _('پسران / آقایان')
        FEMALE = 'FEMALE', _('دختران / بانوان')

    name = models.CharField(_('عنوان دوره'), max_length=200)
    description = models.TextField(_('توضیحات دوره'), blank=True)
    pool_location = models.CharField(_('استخر و محل برگزاری'), max_length=200, blank=True, default='استخر شهید رئیسی')
    days_of_week = models.CharField(_('روزهای برگزاری'), max_length=150, blank=True, default='سه‌شنبه و پنج‌شنبه')
    start_time = models.TimeField(_('ساعت شروع'), null=True, blank=True)
    end_time = models.TimeField(_('ساعت پایان'), null=True, blank=True)
    coaches = models.ManyToManyField(
        'coaches.CoachProfile',
        related_name='courses',
        blank=True,
        verbose_name=_('مربیان دوره')
    )
    start_date = models.DateField(_('تاریخ شروع'))
    end_date = models.DateField(_('تاریخ پایان'))
    base_price = models.DecimalField(_('شهریه پایه (تومان)'), max_digits=12, decimal_places=2)
    sessions_count = models.PositiveIntegerField(_('تعداد جلسات کل دوره'), default=12)
    installments_count = models.PositiveIntegerField(
        _('سقف تعداد اقساط مجاز'),
        default=1,
        help_text=_('حداکثر تعداد اقساط مجاز برای این دوره (مثلاً ۴ قسط؛ شناگر می‌تواند کمتر هم انتخاب کند)')
    )
    age_range = models.CharField(_('رده سنی'), max_length=120, blank=True, default='')
    gender = models.CharField(
        _('جنسیت مجاز'),
        max_length=20,
        choices=GenderTarget.choices,
        default=GenderTarget.MALE,
        blank=True
    )
    what_you_learn = models.TextField(_('آنچه در این دوره یاد می‌گیرید'), blank=True, default='')
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

    def sync_coach_classes(self):
        """
        برای هر مربی تخصیص‌یافته به دوره، یک کلاس اختصاصی تعریف یا همگام می‌کند:
        مربی A ---> کلاس A
        و برنامه زمانی و استخر دوره را به آن منتسب می‌کند.
        """
        weekday_map = {
            'شنبه': 0, 'یکشنبه': 1, 'یک‌شنبه': 1, 'دوشنبه': 2,
            'سه‌شنبه': 3, 'سه شنبه': 3, 'چهارشنبه': 4,
            'پنج‌شنبه': 5, 'پنج شنبه': 5, 'جمعه': 6
        }

        selected_weekdays = []
        if self.days_of_week:
            for day_name, w_idx in weekday_map.items():
                if day_name in self.days_of_week and w_idx not in selected_weekdays:
                    selected_weekdays.append(w_idx)
        if not selected_weekdays:
            selected_weekdays = [3, 5]  # سه‌شنبه و پنج‌شنبه پیش‌فرض

        default_level = SkillLevel.objects.first()
        if not default_level:
            default_level = SkillLevel.objects.create(name='عمومی و پیش‌نیاز', order=1)

        for coach in self.coaches.all():
            group_name = f"کلاس مربی {coach.full_name}"
            group, _ = SwimmerGroup.objects.get_or_create(
                course=self,
                name=group_name,
                defaults={
                    'skill_level': default_level,
                    'capacity': 15,
                    'pool_location': self.pool_location or 'استخر شهید رئیسی',
                    'status': SwimmerGroup.Status.OPEN
                }
            )
            if self.pool_location and group.pool_location != self.pool_location:
                group.pool_location = self.pool_location
                group.save(update_fields=['pool_location'])

            GroupCoach.objects.get_or_create(
                group=group,
                coach=coach,
                defaults={
                    'is_primary': True,
                    'assigned_from': self.start_date
                }
            )

            if self.start_time and self.end_time:
                for w in selected_weekdays:
                    GroupSchedule.objects.get_or_create(
                        group=group,
                        weekday=w,
                        defaults={
                            'start_time': self.start_time,
                            'end_time': self.end_time
                        }
                    )

        current_coach_ids = set(self.coaches.values_list('id', flat=True))

        # Unassign swimmers and requests whose coach is no longer in this course -> become "بدون مربی"
        self.enrollments.exclude(coach_id__in=current_coach_ids).update(
            coach=None,
            group=None
        )
        self.enrollment_requests.exclude(coach_id__in=current_coach_ids).update(
            coach=None,
            group=None
        )

        # Clean up empty groups for coaches no longer assigned to this course
        for grp in self.groups.all():
            assigned_coaches = set(grp.coach_assignments.values_list('coach_id', flat=True))
            if not assigned_coaches.intersection(current_coach_ids):
                self.enrollments.filter(group=grp).update(coach=None, group=None)
                self.enrollment_requests.filter(group=grp).update(coach=None, group=None)
                grp.delete()


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
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='enrollment_requests',
        verbose_name=_('گروه درخواستی')
    )
    coach = models.ForeignKey(
        'coaches.CoachProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='enrollment_requests',
        verbose_name=_('مربی انتخابی')
    )
    status = models.CharField(
        _('وضعیت درخواست'),
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )
    selected_installments = models.PositiveSmallIntegerField(
        _('تعداد اقساط انتخابی متقاضی'),
        default=1,
        help_text=_('تعداد اقساطی که متقاضی هنگام ثبت‌نام انتخاب کرده است (حداکثر تا سقف مجاز دوره)')
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
        return f"درخواست {self.applicant_name} برای {self.course.name} ({self.get_status_display()})"


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
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='enrollments',
        verbose_name=_('گروه اجرایی')
    )
    coach = models.ForeignKey(
        'coaches.CoachProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='enrollments',
        verbose_name=_('مربی تخصیص‌یافته')
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
    selected_installments = models.PositiveSmallIntegerField(
        _('تعداد اقساط توافق‌شده'),
        default=1,
        help_text=_('تعداد اقساط مورد توافق برای پرداخت شهریه این ثبت‌نام')
    )
    enrolled_at = models.DateTimeField(_('تاریخ ثبت‌نام'), auto_now_add=True)
    notes = models.TextField(_('یادداشت مدیر'), blank=True)

    class Meta:
        verbose_name = _('ثبت‌نام قطعی')
        verbose_name_plural = _('ثبت‌نام‌های قطعی')
        ordering = ['-enrolled_at']
        constraints = [
            models.UniqueConstraint(
                fields=['swimmer', 'course'],
                name='unique_swimmer_course'
            )
        ]

    def __str__(self):
        coach_str = f" (مربی: {self.coach.full_name})" if self.coach else ""
        return f"{self.swimmer} در {self.course.name}{coach_str}"

    @property
    def remaining_sessions(self):
        return max(0, self.sessions_purchased - self.sessions_attended)
