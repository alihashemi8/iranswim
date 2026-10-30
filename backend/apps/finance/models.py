from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from decimal import Decimal
import uuid


class Invoice(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', _('پیش‌نویس')
        ISSUED = 'ISSUED', _('پرداخت نشده')
        PARTIALLY_PAID = 'PARTIALLY_PAID', _('بخشی پرداخت‌شده')
        PAID = 'PAID', _('تسویه‌شده کامل')
        CANCELLED = 'CANCELLED', _('ابطال‌شده')

    invoice_number = models.CharField(_('شماره فاکتور'), max_length=50, unique=True, db_index=True)
    swimmer = models.ForeignKey(
        'swimmers.SwimmerProfile',
        on_delete=models.PROTECT,
        related_name='invoices',
        verbose_name=_('شناگر')
    )
    enrollment = models.OneToOneField(
        'education.Enrollment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoice',
        verbose_name=_('ثبت‌نام مرتبط')
    )
    total_amount = models.DecimalField(_('مبلغ کل (تومان)'), max_digits=12, decimal_places=2)
    currency = models.CharField(_('واحد پول'), max_length=10, default='TOMAN')
    status = models.CharField(
        _('وضعیت صورتحساب'),
        max_length=20,
        choices=Status.choices,
        default=Status.ISSUED,
        db_index=True
    )
    issue_date = models.DateField(_('تاریخ صدور'))
    due_date = models.DateField(_('سررسید نهایی'))
    notes = models.TextField(_('توضیحات فاکتور'), blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('صورتحساب / فاکتور')
        verbose_name_plural = _('صورتحساب‌ها')
        ordering = ['-issue_date', '-created_at']

    def __str__(self):
        return f"فاکتور {self.invoice_number} ({self.swimmer.full_name})"

    @classmethod
    def generate_invoice_number(cls):
        import datetime
        today_str = datetime.date.today().strftime('%Y%m%d')
        unique_suffix = uuid.uuid4().hex[:6].upper()
        return f"INV-{today_str}-{unique_suffix}"

    @property
    def total_paid(self):
        allocations = self.allocations.filter(payment__status=Payment.Status.SUCCESSFUL)
        return allocations.aggregate(total=models.Sum('allocated_amount'))['total'] or Decimal('0.00')

    @property
    def total_discount(self):
        discounts = self.adjustments.filter(type=FinancialAdjustment.AdjustmentType.DISCOUNT)
        return discounts.aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')

    @property
    def total_refund(self):
        refunds = self.adjustments.filter(type=FinancialAdjustment.AdjustmentType.REFUND)
        return refunds.aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')

    @property
    def remaining_balance(self):
        effective_total = self.total_amount - self.total_discount
        balance = effective_total - self.total_paid + self.total_refund
        return max(Decimal('0.00'), balance)

    def recalculate_status(self):
        if self.status == self.Status.CANCELLED:
            return
        balance = self.remaining_balance
        if balance <= Decimal('0.00'):
            self.status = self.Status.PAID
        elif self.total_paid > Decimal('0.00'):
            self.status = self.Status.PARTIALLY_PAID
        else:
            self.status = self.Status.ISSUED
        self.save(update_fields=['status'])


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name=_('صورتحساب')
    )
    description = models.CharField(_('شرح ردیف'), max_length=255)
    unit_price = models.DecimalField(_('قیمت واحد (تومان)'), max_digits=12, decimal_places=2)
    quantity = models.PositiveIntegerField(_('تعداد'), default=1)
    total_price = models.DecimalField(_('مبلغ کل ردیف (تومان)'), max_digits=12, decimal_places=2)

    class Meta:
        verbose_name = _('ردیف فاکتور')
        verbose_name_plural = _('ردیف‌های فاکتور')

    def save(self, *args, **kwargs):
        self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)


class Installment(models.Model):
    class Status(models.TextChoices):
        UNPAID = 'UNPAID', _('پرداخت‌نشده')
        PARTIAL = 'PARTIAL', _('بخشی پرداخت‌شده')
        PAID = 'PAID', _('تسویه کامل')
        OVERDUE = 'OVERDUE', _('سررسید گذشته')

    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='installments',
        verbose_name=_('صورتحساب')
    )
    installment_number = models.PositiveSmallIntegerField(_('شماره قسط'), default=1)
    amount = models.DecimalField(_('مبلغ قسط (تومان)'), max_digits=12, decimal_places=2)
    due_date = models.DateField(_('تاریخ سررسید قسط'), db_index=True)
    status = models.CharField(
        _('وضعیت قسط'),
        max_length=20,
        choices=Status.choices,
        default=Status.UNPAID,
        db_index=True
    )

    class Meta:
        verbose_name = _('قسط شهریه')
        verbose_name_plural = _('اقساط شهریه')
        ordering = ['due_date', 'installment_number']

    def __str__(self):
        return f"قسط {self.installment_number} فاکتور {self.invoice.invoice_number}"

    @property
    def paid_amount(self):
        allocations = self.allocations.filter(payment__status=Payment.Status.SUCCESSFUL)
        return allocations.aggregate(total=models.Sum('allocated_amount'))['total'] or Decimal('0.00')

    @property
    def remaining_amount(self):
        return max(Decimal('0.00'), self.amount - self.paid_amount)

    def recalculate_status(self):
        paid = self.paid_amount
        import datetime
        is_past_due = self.due_date < datetime.date.today()

        if paid >= self.amount:
            self.status = self.Status.PAID
        elif paid > Decimal('0.00'):
            self.status = self.Status.PARTIAL
        elif is_past_due:
            self.status = self.Status.OVERDUE
        else:
            self.status = self.Status.UNPAID
        self.save(update_fields=['status'])


class Payment(models.Model):
    class Method(models.TextChoices):
        CASH = 'CASH', _('نقدی')
        POS = 'POS', _('دستگاه کارتخوان حضوری')
        CARD_TRANSFER = 'CARD_TRANSFER', _('انتقال کارت به کارت / شبا')
        ONLINE_GATEWAY = 'ONLINE_GATEWAY', _('درگاه پرداخت الکترونیک')

    class Status(models.TextChoices):
        SUCCESSFUL = 'SUCCESSFUL', _('موفق و قطعی')
        PENDING = 'PENDING', _('در انتظار تأیید')
        FAILED = 'FAILED', _('ناموفق')
        REFUNDED = 'REFUNDED', _('مسترد شده')

    payment_number = models.CharField(_('شماره پرداخت'), max_length=50, unique=True, db_index=True)
    swimmer = models.ForeignKey(
        'swimmers.SwimmerProfile',
        on_delete=models.PROTECT,
        related_name='payments',
        verbose_name=_('شناگر پرداخت‌کننده')
    )
    amount = models.DecimalField(_('مبلغ پرداختی (تومان)'), max_digits=12, decimal_places=2)
    currency = models.CharField(_('واحد پول'), max_length=10, default='TOMAN')
    method = models.CharField(
        _('روش پرداخت'),
        max_length=20,
        choices=Method.choices,
        default=Method.POS,
        db_index=True
    )
    status = models.CharField(
        _('وضعیت تراکنش'),
        max_length=20,
        choices=Status.choices,
        default=Status.SUCCESSFUL,
        db_index=True
    )
    transaction_ref = models.CharField(_('شماره پیگیری / مرجع بانکی'), max_length=100, blank=True, db_index=True)
    idempotency_key = models.CharField(_('کلید یکتایی (Idempotency)'), max_length=64, unique=True, null=True, blank=True)
    paid_at = models.DateTimeField(_('زمان تراکنش'))
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_('کاربر ثبت‌کننده')
    )
    notes = models.TextField(_('توضیحات تراکنش'), blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('تراکنش مالی و پرداخت')
        verbose_name_plural = _('پرداخت‌ها')
        ordering = ['-paid_at']

    def __str__(self):
        return f"پرداخت {self.payment_number} - {self.amount} تومان"

    @classmethod
    def generate_payment_number(cls):
        import datetime
        today_str = datetime.date.today().strftime('%Y%m%d')
        suffix = uuid.uuid4().hex[:6].upper()
        return f"PAY-{today_str}-{suffix}"


class PaymentAllocation(models.Model):
    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name='allocations',
        verbose_name=_('تراکنش پرداخت')
    )
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='allocations',
        verbose_name=_('صورتحساب مرتبط')
    )
    installment = models.ForeignKey(
        Installment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='allocations',
        verbose_name=_('قسط مرتبط (در صورت تخصیص به قسط)')
    )
    allocated_amount = models.DecimalField(_('مبلغ تخصیص‌یافته (تومان)'), max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('تخصیص پرداخت به بدهی')
        verbose_name_plural = _('تخصیص‌های پرداخت')

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.installment:
            self.installment.recalculate_status()
        self.invoice.recalculate_status()


class FinancialAdjustment(models.Model):
    class AdjustmentType(models.TextChoices):
        DISCOUNT = 'DISCOUNT', _('تخفیف')
        REFUND = 'REFUND', _('استرداد وجه')
        CREDIT_MEMO = 'CREDIT_MEMO', _('اعتبار / تخفیف دوره بعد')

    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='adjustments',
        verbose_name=_('صورتحساب')
    )
    type = models.CharField(_('نوع تعدیل مالی'), max_length=20, choices=AdjustmentType.choices)
    amount = models.DecimalField(_('مبلغ تعدیل (تومان)'), max_digits=12, decimal_places=2)
    reason = models.TextField(_('دلیل و مستندات تعدیل مالی'))
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_('تأییدکننده')
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('سند تعدیل مالی')
        verbose_name_plural = _('اسناد تعدیل مالی')
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.invoice.recalculate_status()
