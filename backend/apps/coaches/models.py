from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from decimal import Decimal
import uuid


class CoachProfile(models.Model):
    class EmploymentStatus(models.TextChoices):
        ACTIVE = 'ACTIVE', _('فعال و مجاز')
        SUSPENDED = 'SUSPENDED', _('معلق')
        INACTIVE = 'INACTIVE', _('غیرفعال')
        ARCHIVED = 'ARCHIVED', _('بایگانی‌شده')

    class EmploymentType(models.TextChoices):
        HOURLY = 'HOURLY', _('ساعتی')
        FIXED = 'FIXED', _('حقوق ثابت ماهانه')
        PERCENTAGE = 'PERCENTAGE', _('درصدی')

    class Gender(models.TextChoices):
        MALE = 'MALE', _('آقا / مرد')
        FEMALE = 'FEMALE', _('خانم / زن')

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='coach_profile',
        verbose_name=_('حساب کاربری مربی')
    )
    personnel_id = models.CharField(
        _('کد پرسنلی'),
        max_length=50,
        blank=True,
        null=True,
        unique=True,
        db_index=True
    )
    gender = models.CharField(
        _('جنسیت مربی'),
        max_length=10,
        choices=Gender.choices,
        default=Gender.MALE,
        db_index=True
    )
    date_of_birth = models.DateField(_('تاریخ تولد'), null=True, blank=True)
    emergency_contact_name = models.CharField(_('نام مخاطب اضطراری'), max_length=150, blank=True)
    emergency_contact_phone = models.CharField(_('تلفن تماس اضطراری'), max_length=20, blank=True)
    address = models.TextField(_('آدرس محل سکونت'), blank=True)
    internal_notes = models.TextField(_('یادداشت محرمانه اداری'), blank=True)

    display_order = models.PositiveIntegerField(
        _('ترتیب نمایش در سایت'),
        default=0,
        db_index=True
    )
    show_on_landing = models.BooleanField(
        _('نمایش در صفحه لندینگ'),
        default=True,
        db_index=True
    )
    specialties = models.CharField(_('تخصص‌ها (کرال سینه، پروانه و...)'), max_length=255, blank=True)
    bio = models.TextField(_('رزومه و بیوگرافی'), blank=True)
    
    # Professional fields
    lifeguard_certificate = models.CharField(_('مدرک نجات‌غریق'), max_length=150, blank=True)
    lifeguard_expiration = models.DateField(_('تاریخ انقضای کارت نجات‌غریق'), null=True, blank=True)
    years_of_experience = models.PositiveIntegerField(_('سابقه مربیگری (سال)'), default=0)
    previous_experience = models.TextField(_('سوابق کاری و باشگاه‌های قبلی'), blank=True)
    additional_skills = models.TextField(_('سایر مهارت‌ها و دوره‌ها'), blank=True)

    # Employment & Compensation fields
    employment_start_date = models.DateField(_('تاریخ آغاز همکاری'), null=True, blank=True)
    employment_status = models.CharField(
        _('وضعیت کاری'),
        max_length=20,
        choices=EmploymentStatus.choices,
        default=EmploymentStatus.ACTIVE,
        db_index=True
    )
    employment_type = models.CharField(
        _('نوع قرارداد/همکاری'),
        max_length=20,
        choices=EmploymentType.choices,
        default=EmploymentType.HOURLY,
        db_index=True
    )
    hourly_rate = models.DecimalField(_('نرخ ساعتی (تومان)'), max_digits=12, decimal_places=2, default=0)
    fixed_monthly_salary = models.DecimalField(_('حقوق ثابت ماهانه (تومان)'), max_digits=12, decimal_places=2, default=0)
    revenue_percentage = models.DecimalField(_('درصد سهم از درآمد'), max_digits=5, decimal_places=2, default=0)
    percentage_revenue_basis = models.CharField(
        _('مبنای محاسبه درصد'),
        max_length=50,
        default='COURSE_GROSS',
        choices=[
            ('COURSE_GROSS', 'درآمد ناخالص دوره‌های مربی'),
            ('COURSE_COLLECTED', 'درآمد وصول‌شده دوره‌ها'),
            ('CUSTOM', 'مبلغ سفارشی توافق‌شده')
        ]
    )
    contractual_weekly_hours = models.PositiveIntegerField(_('ساعات کاری موظف در هفته'), default=20)

    created_at = models.DateTimeField(_('تاریخ ثبت'), auto_now_add=True)
    updated_at = models.DateTimeField(_('آخرین به‌روزرسانی'), auto_now=True)

    class Meta:
        verbose_name = _('پروفایل مربی')
        verbose_name_plural = _('مربیان')
        ordering = ['display_order', 'user__last_name', 'user__first_name']

    def __str__(self):
        return f"مربی {self.user.get_full_name() or self.user.phone}"

    @property
    def full_name(self):
        return self.user.get_full_name() or self.user.phone

    @property
    def active_contract(self):
        return self.contracts.filter(status='ACTIVE').order_by('-start_date').first()

    def save(self, *args, **kwargs):
        if not self.personnel_id:
            # Generate EMP-XXXX personnel ID if not set
            last_id = CoachProfile.objects.exclude(personnel_id__isnull=True).exclude(personnel_id='').order_by('-id').first()
            seq = 1001
            if last_id and last_id.personnel_id and last_id.personnel_id.startswith('EMP-'):
                try:
                    seq = int(last_id.personnel_id.split('-')[-1]) + 1
                except ValueError:
                    seq = 1001 + (self.id or 1)
            else:
                seq = 1001 + (self.id or 0)
            self.personnel_id = f"EMP-{seq}"
        super().save(*args, **kwargs)


class CoachCertificate(models.Model):
    coach = models.ForeignKey(
        CoachProfile,
        on_delete=models.CASCADE,
        related_name='certificates',
        verbose_name=_('مربی')
    )
    title = models.CharField(_('عنوان مدرک / گواهی'), max_length=200)
    issuing_organization = models.CharField(_('سازمان یا مرجع صادرکننده'), max_length=200, blank=True)
    issue_date = models.DateField(_('تاریخ صدور'), null=True, blank=True)
    expiration_date = models.DateField(_('تاریخ اعتبار / انقضا'), null=True, blank=True)
    certificate_number = models.CharField(_('شماره مدرک'), max_length=100, blank=True)
    file = models.FileField(_('تصویر یا فایل مدرک'), upload_to='coach_certificates/', null=True, blank=True)
    is_verified = models.BooleanField(_('تأییدشده توسط آموزشگاه'), default=True)
    notes = models.TextField(_('توضیحات و نکات'), blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('گواهی و مدرک مربی')
        verbose_name_plural = _('مدارک و گواهی‌های مربیان')
        ordering = ['-issue_date', '-created_at']

    def __str__(self):
        return f"{self.title} - {self.coach.full_name}"


class CoachContract(models.Model):
    class ContractType(models.TextChoices):
        STANDARD = 'STANDARD', _('استاندارد کادر آموزشی')
        FULL_TIME = 'FULL_TIME', _('تمام‌وقت')
        PART_TIME = 'PART_TIME', _('پاره‌وقت')
        PROJECT = 'PROJECT', _('پروژه‌ای / دوره‌ای')
        INTERNSHIP = 'INTERNSHIP', _('کارآموزی / آزمایشی')

    class Status(models.TextChoices):
        DRAFT = 'DRAFT', _('پیش‌نویس')
        ACTIVE = 'ACTIVE', _('فعال و جاری')
        EXPIRED = 'EXPIRED', _('منقضی‌شده')
        TERMINATED = 'TERMINATED', _('خاتمه‌یافته / فسخ')
        RENEWED = 'RENEWED', _('تمدیدشده')

    coach = models.ForeignKey(
        CoachProfile,
        on_delete=models.CASCADE,
        related_name='contracts',
        verbose_name=_('مربی')
    )
    contract_number = models.CharField(_('شماره قرارداد'), max_length=60, unique=True, db_index=True)
    contract_type = models.CharField(
        _('نوع قرارداد'),
        max_length=50,
        choices=ContractType.choices,
        default=ContractType.STANDARD
    )
    start_date = models.DateField(_('تاریخ شروع قرارداد'))
    end_date = models.DateField(_('تاریخ پایان قرارداد'))
    employment_type = models.CharField(
        _('مدل همکاری و دستمزد'),
        max_length=20,
        choices=CoachProfile.EmploymentType.choices,
        default=CoachProfile.EmploymentType.HOURLY
    )
    hourly_rate = models.DecimalField(_('نرخ ساعتی قرارداد (تومان)'), max_digits=12, decimal_places=2, default=0)
    fixed_salary = models.DecimalField(_('حقوق ثابت ماهانه قرارداد (تومان)'), max_digits=12, decimal_places=2, default=0)
    percentage_rate = models.DecimalField(_('درصد سهم قرارداد'), max_digits=5, decimal_places=2, default=0)
    percentage_basis = models.CharField(_('مبنای محاسبه سهم درصدی'), max_length=50, default='COURSE_GROSS')
    agreed_weekly_hours = models.PositiveIntegerField(_('ساعات کاری هفتگی توافق‌شده'), default=20)
    status = models.CharField(
        _('وضعیت قرارداد'),
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True
    )
    document = models.FileField(_('تصویر یا فایل قرارداد امضاشده'), upload_to='coach_contracts/', null=True, blank=True)
    terms_and_conditions = models.TextField(_('مفاد و شرایط اختصاصی قرارداد'), blank=True)
    internal_notes = models.TextField(_('یادداشت اداری داخلی'), blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name=_('ثبت‌کننده قرارداد')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('قرارداد مربی')
        verbose_name_plural = _('قراردادهای مربیان')
        ordering = ['-start_date', '-created_at']

    def __str__(self):
        return f"قرارداد {self.contract_number} ({self.coach.full_name})"

    @classmethod
    def generate_contract_number(cls):
        import datetime
        today_str = datetime.date.today().strftime('%Y%m%d')
        suffix = uuid.uuid4().hex[:5].upper()
        return f"CNT-{today_str}-{suffix}"


class CoachPayroll(models.Model):
    class ApprovalStatus(models.TextChoices):
        DRAFT = 'DRAFT', _('پیش‌نویس')
        PENDING_APPROVAL = 'PENDING_APPROVAL', _('در انتظار تأیید')
        APPROVED = 'APPROVED', _('تأییدشده')
        CANCELLED = 'CANCELLED', _('ابطال‌شده')

    class PaymentStatus(models.TextChoices):
        UNPAID = 'UNPAID', _('پرداخت‌نشده')
        PARTIALLY_PAID = 'PARTIALLY_PAID', _('بخشی پرداخت‌شده')
        PAID = 'PAID', _('تسویه کامل')

    coach = models.ForeignKey(
        CoachProfile,
        on_delete=models.CASCADE,
        related_name='payrolls',
        verbose_name=_('مربی')
    )
    contract = models.ForeignKey(
        CoachContract,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='payrolls',
        verbose_name=_('قرارداد استنادی دوره')
    )
    period_label = models.CharField(_('دوره حقوقی / ماه'), max_length=100)
    period_start = models.DateField(_('شروع دوره محاسباتی'))
    period_end = models.DateField(_('پایان دوره محاسباتی'))
    compensation_model = models.CharField(
        _('مدل محاسباتی دوره'),
        max_length=20,
        choices=CoachProfile.EmploymentType.choices
    )
    base_rate = models.DecimalField(_('نرخ پایه مصوب (ساعتی/ثابت/درصد)'), max_digits=12, decimal_places=2, default=0)
    teaching_hours = models.DecimalField(_('مجموع ساعات تدریس مصوب'), max_digits=8, decimal_places=2, default=0)
    completed_sessions_count = models.PositiveIntegerField(_('تعداد جلسات برگزارشده'), default=0)
    eligible_revenue = models.DecimalField(_('درآمد مشمول محاسبه سهم مربی'), max_digits=14, decimal_places=2, default=0)
    
    base_compensation = models.DecimalField(_('دستمزد پایه محاسبه‌شده (تومان)'), max_digits=14, decimal_places=2, default=0)
    bonuses_amount = models.DecimalField(_('مجموع پاداش‌ها (تومان)'), max_digits=14, decimal_places=2, default=0)
    overtime_amount = models.DecimalField(_('مبلغ اضافه‌کاری (تومان)'), max_digits=14, decimal_places=2, default=0)
    deductions_amount = models.DecimalField(_('مجموع کسورات قانونی و غیبت (تومان)'), max_digits=14, decimal_places=2, default=0)
    gross_amount = models.DecimalField(_('مجموع ناخالص حقوق (تومان)'), max_digits=14, decimal_places=2, default=0)
    net_payable_amount = models.DecimalField(_('خالص پرداختی قابل تسویه (تومان)'), max_digits=14, decimal_places=2, default=0)

    approval_status = models.CharField(
        _('وضعیت تأیید حقوق'),
        max_length=20,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.DRAFT,
        db_index=True
    )
    payment_status = models.CharField(
        _('وضعیت واریز حقوق'),
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.UNPAID,
        db_index=True
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='approved_payrolls',
        verbose_name=_('مدیر تأییدکننده')
    )
    approved_at = models.DateTimeField(_('زمان تأیید نهایی'), null=True, blank=True)
    notes = models.TextField(_('توضیحات و یادداشت‌های حقوق'), blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('حقوق و دستمزد ماهانه مربی')
        verbose_name_plural = _('لیست حقوق و دستمزد مربیان')
        ordering = ['-period_start', '-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['coach', 'period_start', 'period_end'],
                name='unique_coach_payroll_period'
            )
        ]

    def __str__(self):
        return f"فیش حقوق {self.coach.full_name} ({self.period_label})"

    @property
    def total_paid(self):
        valid_payments = self.payments.filter(is_reversal=False)
        reversals = self.payments.filter(is_reversal=True)
        paid = valid_payments.aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')
        rev = reversals.aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')
        return max(Decimal('0.00'), paid - rev)

    @property
    def remaining_balance(self):
        return max(Decimal('0.00'), self.net_payable_amount - self.total_paid)

    def recalculate_payment_status(self):
        paid = self.total_paid
        if paid >= self.net_payable_amount and self.net_payable_amount > Decimal('0.00'):
            self.payment_status = self.PaymentStatus.PAID
        elif paid > Decimal('0.00'):
            self.payment_status = self.PaymentStatus.PARTIALLY_PAID
        else:
            self.payment_status = self.PaymentStatus.UNPAID
        self.save(update_fields=['payment_status', 'updated_at'])


class PayrollAdjustment(models.Model):
    class AdjustmentType(models.TextChoices):
        BONUS = 'BONUS', _('پاداش عملکرد و رضایت')
        OVERTIME = 'OVERTIME', _('اضافه‌کاری و سانس‌های اضافه')
        DEDUCTION = 'DEDUCTION', _('کسورات انضباطی')
        TAX_INSURANCE = 'TAX_INSURANCE', _('بیمه و مالیات')
        PENALTY = 'PENALTY', _('جریمه غیبت غیرموجه')
        MANUAL = 'MANUAL', _('تعدیل دستی مصوب مدیریت')

    payroll = models.ForeignKey(
        CoachPayroll,
        on_delete=models.CASCADE,
        related_name='adjustments',
        verbose_name=_('فیش حقوق مرتبط')
    )
    adjustment_type = models.CharField(
        _('نوع تعدیل/ردیف'),
        max_length=20,
        choices=AdjustmentType.choices,
        default=AdjustmentType.BONUS
    )
    amount = models.DecimalField(_('مبلغ (تومان)'), max_digits=12, decimal_places=2)
    title = models.CharField(_('عنوان ردیف'), max_length=200)
    reason = models.TextField(_('علت و توضیحات تکمیلی'), blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name=_('کاربر ثبت‌کننده')
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('ردیف تعدیل حقوق')
        verbose_name_plural = _('ردیف‌های تعدیل حقوق')
        ordering = ['created_at']

    def __str__(self):
        return f"{self.get_adjustment_type_display()}: {self.title} ({self.amount} تومان)"


class CoachPaymentRecord(models.Model):
    class PaymentMethod(models.TextChoices):
        BANK_TRANSFER = 'BANK_TRANSFER', _('حواله بانکی پایا / ساتنا')
        CARD_TRANSFER = 'CARD_TRANSFER', _('کارت به کارت')
        CHEQUE = 'CHEQUE', _('چک بانکی صیادی')
        CASH = 'CASH', _('نقدی')
        OTHER = 'OTHER', _('سایر')

    payroll = models.ForeignKey(
        CoachPayroll,
        on_delete=models.PROTECT,
        related_name='payments',
        verbose_name=_('فیش حقوق مرتبط')
    )
    coach = models.ForeignKey(
        CoachProfile,
        on_delete=models.PROTECT,
        related_name='payments',
        verbose_name=_('مربی دریافت‌کننده')
    )
    payment_number = models.CharField(_('شماره سند پرداخت'), max_length=60, unique=True, db_index=True)
    amount = models.DecimalField(_('مبلغ واریزی (تومان)'), max_digits=14, decimal_places=2)
    payment_date = models.DateField(_('تاریخ واریز'))
    payment_method = models.CharField(
        _('روش پرداخت'),
        max_length=30,
        choices=PaymentMethod.choices,
        default=PaymentMethod.BANK_TRANSFER
    )
    reference_number = models.CharField(_('شماره پیگیری / مرجع بانکی'), max_length=100, blank=True)
    receipt_document = models.FileField(_('تصویر فیش یا رسید واریز'), upload_to='coach_payments/', null=True, blank=True)
    description = models.TextField(_('توضیحات پرداخت'), blank=True)
    registered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name=_('ثبت‌کننده پرداخت')
    )
    is_reversal = models.BooleanField(_('آیا سند اصلاحی/برگشتی است؟'), default=False)
    reverses_payment = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reversal_records',
        verbose_name=_('سند پرداخت برگشت‌داده‌شده')
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('سند پرداخت حقوق مربی')
        verbose_name_plural = _('اسناد واریزی حقوق مربیان')
        ordering = ['-payment_date', '-created_at']

    def __str__(self):
        return f"سند {self.payment_number} ({self.amount} تومان برای {self.coach.full_name})"

    @classmethod
    def generate_payment_number(cls):
        import datetime
        today_str = datetime.date.today().strftime('%Y%m%d')
        suffix = uuid.uuid4().hex[:6].upper()
        return f"CPAY-{today_str}-{suffix}"


class CoachLeaveRequest(models.Model):
    class LeaveType(models.TextChoices):
        SICK = 'SICK', _('مرخصی استعلاجی (پزشکی)')
        CASUAL = 'CASUAL', _('مرخصی استحقاقی / روزانه')
        HOURLY = 'HOURLY', _('مرخصی ساعتی')
        EMERGENCY = 'EMERGENCY', _('مرخصی اضطراری')
        UNPAID = 'UNPAID', _('مرخصی بدون حقوق')

    class Status(models.TextChoices):
        PENDING = 'PENDING', _('در انتظار بررسی مدیریت')
        APPROVED = 'APPROVED', _('موافقت‌شده')
        REJECTED = 'REJECTED', _('ردشده')
        CANCELLED = 'CANCELLED', _('لغو توسط مربی')

    coach = models.ForeignKey(
        CoachProfile,
        on_delete=models.CASCADE,
        related_name='leave_requests',
        verbose_name=_('مربی متقاضی')
    )
    leave_type = models.CharField(
        _('نوع مرخصی'),
        max_length=20,
        choices=LeaveType.choices,
        default=LeaveType.CASUAL
    )
    start_date = models.DateField(_('تاریخ آغاز مرخصی'))
    end_date = models.DateField(_('تاریخ پایان مرخصی'))
    hours_requested = models.DecimalField(
        _('ساعات درخواستی (برای مرخصی ساعتی)'),
        max_digits=5,
        decimal_places=2,
        default=0
    )
    reason = models.TextField(_('علت مرخصی'))
    document = models.FileField(_('مستندات پیوست (گواهی پزشکی و...)'), upload_to='coach_leaves/', null=True, blank=True)
    status = models.CharField(
        _('وضعیت درخواست'),
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reviewed_leaves',
        verbose_name=_('مدیر بررسی‌کننده')
    )
    reviewed_at = models.DateTimeField(_('زمان بررسی'), null=True, blank=True)
    admin_notes = models.TextField(_('یادداشت اداری / دلیل موافقت یا مخالفت'), blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('درخواست مرخصی مربی')
        verbose_name_plural = _('درخواست‌های مرخصی مربیان')
        ordering = ['-start_date', '-created_at']

    def __str__(self):
        return f"مرخصی {self.coach.full_name} ({self.start_date} تا {self.end_date})"


class CoachPerformanceEvaluation(models.Model):
    coach = models.ForeignKey(
        CoachProfile,
        on_delete=models.CASCADE,
        related_name='evaluations',
        verbose_name=_('مربی ارزیابی‌شده')
    )
    evaluator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='coach_evaluations_given',
        verbose_name=_('ارزیاب (مدیر یا ناظر فنی)')
    )
    evaluation_date = models.DateField(_('تاریخ ارزیابی'))
    period_label = models.CharField(_('دوره ارزیابی (ماه/فصل)'), max_length=100)
    
    # JSON dictionary storing criteria ratings from 1 to 5:
    # e.g.: {"teaching_quality": 5, "student_satisfaction": 4, "student_progress": 4.5, "punctuality": 5, ...}
    criteria_ratings = models.JSONField(_('امتیازات به تفکیک شاخص‌ها'), default=dict)
    overall_score = models.DecimalField(_('نمره کلی عملکرد (از ۵)'), max_digits=4, decimal_places=2)
    strengths = models.TextField(_('نقاط قوت برجسته'), blank=True)
    weaknesses = models.TextField(_('زمینه‌های نیازمند بهبود'), blank=True)
    recommendations = models.TextField(_('توصیه‌ها و برنامه‌های ارتقا'), blank=True)
    general_feedback = models.TextField(_('جمع‌بندی و بازخورد کلی'), blank=True)
    is_shared_with_coach = models.BooleanField(_('قابلیت مشاهده توسط مربی'), default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('ارزیابی عملکرد مربی')
        verbose_name_plural = _('ارزیابی‌های عملکرد مربیان')
        ordering = ['-evaluation_date', '-created_at']

    def __str__(self):
        return f"ارزیابی {self.coach.full_name} - {self.period_label} (نمره {self.overall_score})"


class CoachAdministrativeNote(models.Model):
    class Category(models.TextChoices):
        NOTE = 'NOTE', _('یادداشت اداری / سوابق')
        WARNING = 'WARNING', _('تذکر یا اخطار کتبی')
        COMMENDATION = 'COMMENDATION', _('تشویق، تقدیر و امتیاز مثبت')
        INCIDENT = 'INCIDENT', _('گزارش رویداد یا حادثه')
        MEETING = 'MEETING', _('جلسه هماهنگی و مصاحبه')

    class Severity(models.TextChoices):
        INFO = 'INFO', _('عادی / اطلاع‌رسانی')
        LOW = 'LOW', _('تذکر شفاهی اولیه')
        MEDIUM = 'MEDIUM', _('اخطار کتبی رسمی')
        HIGH = 'HIGH', _('اخطار نهایی / تعلیق')

    coach = models.ForeignKey(
        CoachProfile,
        on_delete=models.CASCADE,
        related_name='administrative_notes',
        verbose_name=_('مربی')
    )
    category = models.CharField(
        _('دسته‌بندی ثبت'),
        max_length=20,
        choices=Category.choices,
        default=Category.NOTE
    )
    title = models.CharField(_('عنوان موضوع'), max_length=200)
    description = models.TextField(_('متن و شرح کامل'))
    date = models.DateField(_('تاریخ رویداد'))
    severity = models.CharField(
        _('سطح اهمیت / شدت'),
        max_length=20,
        choices=Severity.choices,
        default=Severity.INFO
    )
    attachment = models.FileField(_('فایل پیوست / مستندات'), upload_to='coach_notes/', null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name=_('ثبت‌کننده')
    )
    is_confidential = models.BooleanField(_('محرمانه (فقط برای مدیر ارشد)'), default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('یادداشت، اخطار یا تشویق مربی')
        verbose_name_plural = _('یادداشت‌ها و اخطارهای اداری مربیان')
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"[{self.get_category_display()}] {self.title} ({self.coach.full_name})"


class CoachActivityLog(models.Model):
    class EventType(models.TextChoices):
        PROFILE_CREATED = 'PROFILE_CREATED', _('ثبت اولیه پرونده')
        PROFILE_UPDATED = 'PROFILE_UPDATED', _('ویرایش اطلاعات پرونده')
        STATUS_CHANGED = 'STATUS_CHANGED', _('تغییر وضعیت همکاری')
        CONTRACT_CREATED = 'CONTRACT_CREATED', _('ثبت قرارداد جدید')
        CONTRACT_RENEWED = 'CONTRACT_RENEWED', _('تمدید قرارداد')
        COMPENSATION_CHANGED = 'COMPENSATION_CHANGED', _('تغییر نرخ و شرایط مالی')
        CLASS_ASSIGNED = 'CLASS_ASSIGNED', _('تخصیص کلاس یا گروه')
        ATTENDANCE_CORRECTED = 'ATTENDANCE_CORRECTED', _('اصلاح سوابق حضور و جلسات')
        LEAVE_REQUESTED = 'LEAVE_REQUESTED', _('ثبت تقاضای مرخصی')
        LEAVE_APPROVED = 'LEAVE_APPROVED', _('تأیید تقاضای مرخصی')
        LEAVE_REJECTED = 'LEAVE_REJECTED', _('رد تقاضای مرخصی')
        PAYROLL_GENERATED = 'PAYROLL_GENERATED', _('محاسبه و صدور فیش حقوق')
        PAYROLL_APPROVED = 'PAYROLL_APPROVED', _('تأیید نهایی فیش حقوق')
        PAYMENT_REGISTERED = 'PAYMENT_REGISTERED', _('ثبت سند پرداخت حقوق')
        PAYMENT_REVERSED = 'PAYMENT_REVERSED', _('برگشت سند پرداخت حقوق')
        EVALUATION_RECORDED = 'EVALUATION_RECORDED', _('ثبت ارزیابی عملکرد')
        ADMIN_NOTE_ADDED = 'ADMIN_NOTE_ADDED', _('ثبت یادداشت یا اخطار اداری')

    coach = models.ForeignKey(
        CoachProfile,
        on_delete=models.CASCADE,
        related_name='activity_logs',
        verbose_name=_('مربی')
    )
    event_type = models.CharField(_('نوع رویداد'), max_length=50, choices=EventType.choices)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name=_('اقدام‌کننده')
    )
    description = models.TextField(_('شرح اقدام انجام‌شده'))
    metadata = models.JSONField(_('داده‌های تکمیلی'), default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('لاگ فعالیت و رویداد مربی')
        verbose_name_plural = _('تاریخچه فعالیت‌های مربیان')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_event_type_display()} - {self.coach.full_name}"


class CoachAttendanceCorrectionAudit(models.Model):
    coach = models.ForeignKey(
        CoachProfile,
        on_delete=models.CASCADE,
        related_name='attendance_corrections',
        verbose_name=_('مربی')
    )
    session = models.ForeignKey(
        'scheduling.ClassSession',
        on_delete=models.CASCADE,
        related_name='coach_corrections',
        verbose_name=_('جلسه کلاسی')
    )
    previous_status = models.CharField(_('وضعیت قبلی جلسه'), max_length=50)
    new_status = models.CharField(_('وضعیت جدید جلسه'), max_length=50)
    previous_hours = models.DecimalField(_('ساعات تدریس قبلی'), max_digits=5, decimal_places=2, default=0)
    new_hours = models.DecimalField(_('ساعات تدریس جدید'), max_digits=5, decimal_places=2, default=0)
    reason = models.TextField(_('دلیل و توضیح اصلاحیه'))
    adjusted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name=_('مدیر اصلاح‌کننده')
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('سند اصلاحیه حضور و تدریس مربی')
        verbose_name_plural = _('اسناد اصلاحیه حضور مربیان')
        ordering = ['-created_at']

    def __str__(self):
        return f"اصلاحیه جلسه {self.session.id} برای {self.coach.full_name}"


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
