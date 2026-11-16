from django.contrib import admin
from .models import Invoice, InvoiceItem, Installment, Payment, PaymentAllocation, FinancialAdjustment, PaymentReceipt

class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 0

class InstallmentInline(admin.TabularInline):
    model = Installment
    extra = 0

class PaymentAllocationInline(admin.TabularInline):
    model = PaymentAllocation
    extra = 0

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'swimmer', 'total_amount', 'status', 'issue_date', 'due_date']
    list_filter = ['status', 'issue_date']
    search_fields = ['invoice_number', 'swimmer__first_name', 'swimmer__last_name']
    inlines = [InvoiceItemInline, InstallmentInline]

@admin.register(Installment)
class InstallmentAdmin(admin.ModelAdmin):
    list_display = ['invoice', 'installment_number', 'amount', 'due_date', 'status']
    list_filter = ['status', 'due_date']

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['payment_number', 'swimmer', 'amount', 'method', 'status', 'paid_at']
    list_filter = ['method', 'status', 'paid_at']
    search_fields = ['payment_number', 'transaction_ref', 'swimmer__first_name', 'swimmer__last_name']
    inlines = [PaymentAllocationInline]

@admin.register(PaymentReceipt)
class PaymentReceiptAdmin(admin.ModelAdmin):
    list_display = ['id', 'swimmer', 'amount_claimed', 'approved_amount', 'status', 'tracking_number', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['tracking_number', 'swimmer__first_name', 'swimmer__last_name', 'payer_card_number']

@admin.register(FinancialAdjustment)
class FinancialAdjustmentAdmin(admin.ModelAdmin):
    list_display = ['invoice', 'type', 'amount', 'approved_by', 'created_at']
    list_filter = ['type', 'created_at']
