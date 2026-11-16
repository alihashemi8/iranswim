from django.urls import path
from .views import (
    InvoiceListView, InvoiceDetailView, InstallmentListView, PaymentListView,
    RecordPaymentView, FinancialAdjustmentCreateView, FinancialSummaryView,
    PaymentReceiptListCreateView, PaymentReceiptReviewView, PaymentReceiptDetailView
)

urlpatterns = [
    path('invoices/', InvoiceListView.as_view(), name='invoice_list'),
    path('invoices/<int:pk>/', InvoiceDetailView.as_view(), name='invoice_detail'),
    path('installments/', InstallmentListView.as_view(), name='installment_list'),
    path('payments/', PaymentListView.as_view(), name='payment_list'),
    path('payments/record/', RecordPaymentView.as_view(), name='payment_record'),
    path('adjustments/', FinancialAdjustmentCreateView.as_view(), name='adjustment_create'),
    path('summary/', FinancialSummaryView.as_view(), name='finance_summary'),
    path('receipts/', PaymentReceiptListCreateView.as_view(), name='receipt_list_create'),
    path('receipts/<int:pk>/', PaymentReceiptDetailView.as_view(), name='receipt_detail'),
    path('receipts/<int:pk>/review/', PaymentReceiptReviewView.as_view(), name='receipt_review'),
]

