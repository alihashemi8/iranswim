from decimal import Decimal
from django.db import transaction, models
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Invoice, Installment, Payment, PaymentAllocation, FinancialAdjustment
from .serializers import (
    InvoiceSerializer, InstallmentSerializer, PaymentSerializer,
    FinancialAdjustmentSerializer
)
from apps.accounts.permissions import IsAdminUserRole, IsAdminOrSupervisor
from apps.supervisor.models import AuditLog


class InvoiceListView(generics.ListCreateAPIView):
    serializer_class = InvoiceSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        user = self.request.user
        qs = Invoice.objects.all().select_related('swimmer').prefetch_related('items', 'installments', 'adjustments', 'allocations')
        swimmer_id = self.request.query_params.get('swimmer_id')
        if swimmer_id:
            qs = qs.filter(swimmer_id=swimmer_id)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
            return qs
        elif user.role == 'SWIMMER':
            from apps.swimmers.utils import get_accessible_swimmer_ids
            ids = get_accessible_swimmer_ids(user, self.request)
            return qs.filter(swimmer_id__in=ids)
        return qs.none()


class InvoiceDetailView(generics.RetrieveAPIView):
    queryset = Invoice.objects.all().select_related('swimmer').prefetch_related('items', 'installments', 'adjustments', 'allocations')
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
            return Invoice.objects.all()
        elif user.role == 'SWIMMER':
            from apps.swimmers.utils import get_accessible_swimmer_ids
            ids = get_accessible_swimmer_ids(user, self.request)
            return Invoice.objects.filter(swimmer_id__in=ids)
        return Invoice.objects.none()


class InstallmentListView(generics.ListAPIView):
    """لیست اقساط با فیلتر وضعیت و سررسیدگذشته برای مدیریت بدهکاران"""
    serializer_class = InstallmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Installment.objects.all().select_related('invoice__swimmer')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if self.request.query_params.get('overdue') == 'true':
            qs = qs.filter(due_date__lt=timezone.now().date(), status__in=['UNPAID', 'PARTIAL', 'OVERDUE'])
        swimmer_id = self.request.query_params.get('swimmer_id')
        if swimmer_id:
            qs = qs.filter(invoice__swimmer_id=swimmer_id)
        if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
            return qs.order_by('due_date')
        elif user.role == 'SWIMMER':
            from apps.swimmers.utils import get_accessible_swimmer_ids
            ids = get_accessible_swimmer_ids(user, self.request)
            return qs.filter(invoice__swimmer_id__in=ids).order_by('due_date')
        return qs.none()


class PaymentListView(generics.ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Payment.objects.all().select_related('swimmer').prefetch_related('allocations')
        swimmer_id = self.request.query_params.get('swimmer_id')
        if swimmer_id:
            qs = qs.filter(swimmer_id=swimmer_id)

        if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
            return qs
        elif user.role == 'SWIMMER':
            from apps.swimmers.utils import get_accessible_swimmer_ids
            ids = get_accessible_swimmer_ids(user, self.request)
            return qs.filter(swimmer_id__in=ids)
        return qs.none()


class RecordPaymentView(APIView):
    """
    ثبت پرداخت با رعایت کلید یکتایی (Idempotency)، کنترل مبلغ،
    تراکنش اتمیک و تخصیص هوشمند به اقساط پرداخت‌نشده و صورتحساب
    """
    permission_classes = [IsAdminUserRole]

    def post(self, request):
        swimmer_id = request.data.get('swimmer_id')
        amount_raw = request.data.get('amount')
        method = request.data.get('method', Payment.Method.POS)
        transaction_ref = request.data.get('transaction_ref', '')
        idempotency_key = request.data.get('idempotency_key')
        invoice_id = request.data.get('invoice_id')
        installment_id = request.data.get('installment_id')
        notes = request.data.get('notes', '')

        if not swimmer_id or not amount_raw:
            return Response({'detail': 'شناسه شناگر و مبلغ پرداخت الزامی هستند.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amount = Decimal(str(amount_raw))
            if amount <= Decimal('0.00'):
                raise ValueError
        except Exception:
            return Response({'detail': 'مبلغ پرداختی نامعتبر است.'}, status=status.HTTP_400_BAD_REQUEST)

        # Idempotency check: prevent duplicate submissions
        if idempotency_key:
            existing_payment = Payment.objects.filter(idempotency_key=idempotency_key).first()
            if existing_payment:
                return Response(PaymentSerializer(existing_payment).data, status=status.HTTP_200_OK)

        with transaction.atomic():
            payment = Payment.objects.create(
                payment_number=Payment.generate_payment_number(),
                swimmer_id=swimmer_id,
                amount=amount,
                method=method,
                status=Payment.Status.SUCCESSFUL,
                transaction_ref=transaction_ref,
                idempotency_key=idempotency_key,
                paid_at=timezone.now(),
                recorded_by=request.user,
                notes=notes
            )

            # Allocation logic
            remaining_to_allocate = amount

            if installment_id:
                installment = Installment.objects.select_for_update().get(id=installment_id)
                alloc_amt = min(remaining_to_allocate, installment.remaining_amount)
                if alloc_amt > 0:
                    PaymentAllocation.objects.create(
                        payment=payment,
                        invoice=installment.invoice,
                        installment=installment,
                        allocated_amount=alloc_amt
                    )
                    remaining_to_allocate -= alloc_amt

            elif invoice_id:
                invoice = Invoice.objects.select_for_update().get(id=invoice_id)
                # Allocate to installments of this invoice first
                for inst in invoice.installments.filter(status__in=['UNPAID', 'PARTIAL', 'OVERDUE']).order_by('due_date'):
                    if remaining_to_allocate <= 0:
                        break
                    inst_alloc = min(remaining_to_allocate, inst.remaining_amount)
                    if inst_alloc > 0:
                        PaymentAllocation.objects.create(
                            payment=payment,
                            invoice=invoice,
                            installment=inst,
                            allocated_amount=inst_alloc
                        )
                        remaining_to_allocate -= inst_alloc

                # Allocate any leftover to invoice directly
                if remaining_to_allocate > 0:
                    PaymentAllocation.objects.create(
                        payment=payment,
                        invoice=invoice,
                        installment=None,
                        allocated_amount=remaining_to_allocate
                    )
                    remaining_to_allocate = Decimal('0.00')

            # Log Audit Trail
            AuditLog.objects.create(
                actor=request.user,
                action=AuditLog.Action.PAYMENT_RECORD,
                entity_type='Payment',
                entity_id=str(payment.id),
                details={'amount': str(payment.amount), 'method': payment.method, 'ref': payment.transaction_ref}
            )

        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)


class FinancialAdjustmentCreateView(generics.CreateAPIView):
    """ثبت تخفیف یا استرداد وجه با ثبت ردپا و به‌روزرسانی مانده فاکتور"""
    serializer_class = FinancialAdjustmentSerializer
    permission_classes = [IsAdminUserRole]

    def perform_create(self, serializer):
        adj = serializer.save(approved_by=self.request.user)
        AuditLog.objects.create(
            actor=self.request.user,
            action=AuditLog.Action.REFUND_ISSUE,
            entity_type='FinancialAdjustment',
            entity_id=str(adj.id),
            details={'type': adj.type, 'amount': str(adj.amount), 'reason': adj.reason}
        )


class FinancialSummaryView(APIView):
    """آمار و شاخص‌های مالی آموزشگاه برای مدیر و ناظر"""
    permission_classes = [IsAdminOrSupervisor]

    def get(self, request):
        total_invoiced = Invoice.objects.aggregate(t=models.Sum('total_amount'))['t'] or Decimal('0.00')
        total_paid = Payment.objects.filter(status='SUCCESSFUL').aggregate(t=models.Sum('amount'))['t'] or Decimal('0.00')
        total_refunded = FinancialAdjustment.objects.filter(type='REFUND').aggregate(t=models.Sum('amount'))['t'] or Decimal('0.00')
        total_discounted = FinancialAdjustment.objects.filter(type='DISCOUNT').aggregate(t=models.Sum('amount'))['t'] or Decimal('0.00')
        
        # Outstanding receivables
        receivables = max(Decimal('0.00'), total_invoiced - total_discounted - total_paid + total_refunded)
        overdue_installments_count = Installment.objects.filter(due_date__lt=timezone.now().date(), status__in=['UNPAID', 'PARTIAL', 'OVERDUE']).count()

        return Response({
            'total_invoiced': total_invoiced,
            'total_paid': total_paid,
            'total_refunded': total_refunded,
            'total_discounted': total_discounted,
            'receivables': receivables,
            'overdue_installments_count': overdue_installments_count
        })
