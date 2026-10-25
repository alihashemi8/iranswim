from rest_framework import serializers
from .models import Invoice, InvoiceItem, Installment, Payment, PaymentAllocation, FinancialAdjustment


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

    class Meta:
        model = Installment
        fields = [
            'id', 'invoice', 'invoice_number', 'installment_number', 'amount', 'due_date',
            'status', 'status_display', 'paid_amount', 'remaining_amount',
            'swimmer_id', 'swimmer_name', 'swimmer_phone'
        ]


class FinancialAdjustmentSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.full_name', read_only=True)

    class Meta:
        model = FinancialAdjustment
        fields = ['id', 'invoice', 'type', 'type_display', 'amount', 'reason', 'approved_by_name', 'created_at']


class InvoiceSerializer(serializers.ModelSerializer):
    swimmer_name = serializers.CharField(source='swimmer.full_name', read_only=True)
    items = InvoiceItemSerializer(many=True, read_only=True)
    installments = InstallmentSerializer(many=True, read_only=True)
    adjustments = FinancialAdjustmentSerializer(many=True, read_only=True)
    total_paid = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_discount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_refund = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    remaining_balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'swimmer', 'swimmer_name', 'enrollment',
            'total_amount', 'currency', 'status', 'status_display', 'issue_date',
            'due_date', 'notes', 'items', 'installments', 'adjustments',
            'total_paid', 'total_discount', 'total_refund', 'remaining_balance',
            'created_at'
        ]
        read_only_fields = ['id', 'invoice_number', 'created_at']


class PaymentAllocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentAllocation
        fields = ['id', 'invoice', 'installment', 'allocated_amount']


class PaymentSerializer(serializers.ModelSerializer):
    swimmer_name = serializers.CharField(source='swimmer.full_name', read_only=True)
    method_display = serializers.CharField(source='get_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    allocations = PaymentAllocationSerializer(many=True, read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'payment_number', 'swimmer', 'swimmer_name', 'amount',
            'currency', 'method', 'method_display', 'status', 'status_display',
            'transaction_ref', 'idempotency_key', 'paid_at', 'notes',
            'allocations', 'created_at'
        ]
        read_only_fields = ['id', 'payment_number', 'created_at']
