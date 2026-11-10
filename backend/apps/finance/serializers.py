from rest_framework import serializers
from .models import Invoice, InvoiceItem, Installment, Payment, PaymentAllocation, FinancialAdjustment


def gregorian_to_jalali(gy, gm, gd):
    g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    if gy > 1600:
        jy = 979
        gy -= 1600
    else:
        jy = 0
        gy -= 621
    gy2 = gy if (gm > 2) else (gy - 1)
    days = (365 * gy) + ((gy2 + 4) // 4) - ((gy2 + 100) // 100) + ((gy2 + 400) // 400) - 80 + gd + g_d_m[gm - 1]
    jy += 33 * (days // 12053)
    days %= 12053
    jy += 4 * (days // 1461)
    days %= 1461
    if days > 365:
        jy += (days - 1) // 365
        days = (days - 1) % 365
    jm = (days // 31 + 1) if (days < 186) else ((days - 186) // 30 + 7)
    jd = 1 + (days % 31 if (days < 186) else (days - 186) % 30)
    return jy, jm, jd


def extract_swimmer_meta(swimmer, enrollment=None):
    gender = getattr(swimmer, 'gender', 'MALE') if swimmer else 'MALE'
    gender_display = 'دختر / بانوان' if gender == 'FEMALE' else 'پسر / آقایان'
    
    birth_year = ''
    birth_date_str = ''
    if swimmer and swimmer.date_of_birth:
        dob = swimmer.date_of_birth
        birth_date_str = dob.isoformat()
        try:
            jy, _, _ = gregorian_to_jalali(dob.year, dob.month, dob.day)
            birth_year = str(jy)
        except Exception:
            birth_year = str(dob.year)
            
    pool_name = '—'
    coach_name = '—'
    
    if not enrollment and swimmer:
        enrollment = swimmer.enrollments.select_related('group').order_by('-enrolled_at').first()
        
    if enrollment and getattr(enrollment, 'group', None):
        group = enrollment.group
        pool_name = group.pool_location or 'استخر اصلی'
        primary_coach = group.coach_assignments.select_related('coach__user').filter(is_primary=True).first() or group.coach_assignments.select_related('coach__user').first()
        if primary_coach and primary_coach.coach:
            c = primary_coach.coach
            coach_name = (c.user.get_full_name().strip() if c.user and c.user.get_full_name() else '') or 'مربی'

    return {
        'gender': gender,
        'gender_display': gender_display,
        'birth_year': birth_year,
        'birth_date': birth_date_str,
        'pool_name': pool_name,
        'coach_name': coach_name,
    }


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ['id', 'description', 'unit_price', 'quantity', 'total_price']


class InstallmentSerializer(serializers.ModelSerializer):
    paid_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    remaining_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    swimmer_name = serializers.CharField(source='invoice.swimmer.full_name', read_only=True)
    swimmer_phone = serializers.CharField(source='invoice.swimmer.phone', read_only=True)
    swimmer_id = serializers.IntegerField(source='invoice.swimmer.id', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    gender = serializers.SerializerMethodField()
    gender_display = serializers.SerializerMethodField()
    birth_year = serializers.SerializerMethodField()
    birth_date = serializers.SerializerMethodField()
    pool_name = serializers.SerializerMethodField()
    coach_name = serializers.SerializerMethodField()

    class Meta:
        model = Installment
        fields = [
            'id', 'invoice', 'invoice_number', 'installment_number', 'amount', 'due_date',
            'status', 'status_display', 'paid_amount', 'remaining_amount',
            'swimmer_id', 'swimmer_name', 'swimmer_phone',
            'gender', 'gender_display', 'birth_year', 'birth_date', 'pool_name', 'coach_name'
        ]

    def _meta(self, obj):
        swimmer = getattr(obj.invoice, 'swimmer', None)
        enrollment = getattr(obj.invoice, 'enrollment', None)
        return extract_swimmer_meta(swimmer, enrollment)

    def get_gender(self, obj):
        return self._meta(obj)['gender']

    def get_gender_display(self, obj):
        return self._meta(obj)['gender_display']

    def get_birth_year(self, obj):
        return self._meta(obj)['birth_year']

    def get_birth_date(self, obj):
        return self._meta(obj)['birth_date']

    def get_pool_name(self, obj):
        return self._meta(obj)['pool_name']

    def get_coach_name(self, obj):
        return self._meta(obj)['coach_name']


class FinancialAdjustmentSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.full_name', read_only=True)

    class Meta:
        model = FinancialAdjustment
        fields = ['id', 'invoice', 'type', 'type_display', 'amount', 'reason', 'approved_by_name', 'created_at']


class InvoiceSerializer(serializers.ModelSerializer):
    swimmer_name = serializers.CharField(source='swimmer.full_name', read_only=True)
    swimmer_phone = serializers.CharField(source='swimmer.phone', read_only=True)
    items = InvoiceItemSerializer(many=True, read_only=True)
    installments = InstallmentSerializer(many=True, read_only=True)
    adjustments = FinancialAdjustmentSerializer(many=True, read_only=True)
    total_paid = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_discount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_refund = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    remaining_balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    gender = serializers.SerializerMethodField()
    gender_display = serializers.SerializerMethodField()
    birth_year = serializers.SerializerMethodField()
    birth_date = serializers.SerializerMethodField()
    pool_name = serializers.SerializerMethodField()
    coach_name = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'swimmer', 'swimmer_name', 'swimmer_phone', 'enrollment',
            'total_amount', 'currency', 'status', 'status_display', 'issue_date',
            'due_date', 'notes', 'items', 'installments', 'adjustments',
            'total_paid', 'total_discount', 'total_refund', 'remaining_balance',
            'gender', 'gender_display', 'birth_year', 'birth_date', 'pool_name', 'coach_name',
            'created_at'
        ]
        read_only_fields = ['id', 'invoice_number', 'created_at']

    def _meta(self, obj):
        return extract_swimmer_meta(obj.swimmer, obj.enrollment)

    def get_gender(self, obj):
        return self._meta(obj)['gender']

    def get_gender_display(self, obj):
        return self._meta(obj)['gender_display']

    def get_birth_year(self, obj):
        return self._meta(obj)['birth_year']

    def get_birth_date(self, obj):
        return self._meta(obj)['birth_date']

    def get_pool_name(self, obj):
        return self._meta(obj)['pool_name']

    def get_coach_name(self, obj):
        return self._meta(obj)['coach_name']


class PaymentAllocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentAllocation
        fields = ['id', 'invoice', 'installment', 'allocated_amount']


class PaymentSerializer(serializers.ModelSerializer):
    swimmer_name = serializers.CharField(source='swimmer.full_name', read_only=True)
    swimmer_phone = serializers.CharField(source='swimmer.phone', read_only=True)
    method_display = serializers.CharField(source='get_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    allocations = PaymentAllocationSerializer(many=True, read_only=True)
    gender = serializers.SerializerMethodField()
    gender_display = serializers.SerializerMethodField()
    birth_year = serializers.SerializerMethodField()
    birth_date = serializers.SerializerMethodField()
    pool_name = serializers.SerializerMethodField()
    coach_name = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id', 'payment_number', 'swimmer', 'swimmer_name', 'swimmer_phone', 'amount',
            'currency', 'method', 'method_display', 'status', 'status_display',
            'transaction_ref', 'idempotency_key', 'paid_at', 'notes',
            'allocations', 'gender', 'gender_display', 'birth_year', 'birth_date', 'pool_name', 'coach_name',
            'created_at'
        ]
        read_only_fields = ['id', 'payment_number', 'created_at']

    def _meta(self, obj):
        # find enrollment from allocation or swimmer
        enrollment = None
        first_alloc = obj.allocations.first()
        if first_alloc and first_alloc.invoice:
            enrollment = first_alloc.invoice.enrollment
        return extract_swimmer_meta(obj.swimmer, enrollment)

    def get_gender(self, obj):
        return self._meta(obj)['gender']

    def get_gender_display(self, obj):
        return self._meta(obj)['gender_display']

    def get_birth_year(self, obj):
        return self._meta(obj)['birth_year']

    def get_birth_date(self, obj):
        return self._meta(obj)['birth_date']

    def get_pool_name(self, obj):
        return self._meta(obj)['pool_name']

    def get_coach_name(self, obj):
        return self._meta(obj)['coach_name']
