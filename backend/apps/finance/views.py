from decimal import Decimal
from django.db import transaction, models
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Invoice, Installment, Payment, PaymentAllocation, FinancialAdjustment, PaymentReceipt
from .serializers import (
    InvoiceSerializer, InstallmentSerializer, PaymentSerializer,
    FinancialAdjustmentSerializer, PaymentReceiptSerializer, PaymentReceiptCreateSerializer
)
from apps.accounts.permissions import IsAdminUserRole, IsAdminOrSupervisor
from apps.supervisor.models import AuditLog
from apps.swimmers.models import SwimmerProfile
from apps.education.models import Enrollment



class InvoiceListView(generics.ListCreateAPIView):
    serializer_class = InvoiceSerializer
    pagination_class = None

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
    pagination_class = None
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
    pagination_class = None
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


class PaymentReceiptListCreateView(generics.ListCreateAPIView):
    pagination_class = None

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PaymentReceiptCreateSerializer
        return PaymentReceiptSerializer

    def get_queryset(self):
        user = self.request.user
        qs = PaymentReceipt.objects.all().select_related(
            'swimmer', 'enrollment__course', 'enrollment__group', 'invoice', 'reviewed_by', 'payment'
        ).prefetch_related('invoice__installments')

        # Filters
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        swimmer_id = self.request.query_params.get('swimmer_id')
        if swimmer_id:
            qs = qs.filter(swimmer_id=swimmer_id)

        search = self.request.query_params.get('search')
        if search:
            search = search.strip()
            qs = qs.filter(
                Q(swimmer__first_name__icontains=search) |
                Q(swimmer__last_name__icontains=search) |
                Q(swimmer__phone__icontains=search) |
                Q(swimmer__national_id__icontains=search) |
                Q(tracking_number__icontains=search) |
                Q(payer_card_number__icontains=search)
            )

        if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
            return qs.order_by('-created_at')
        elif user.role == 'SWIMMER':
            from apps.swimmers.utils import get_accessible_swimmer_ids
            ids = get_accessible_swimmer_ids(user, self.request)
            return qs.filter(swimmer_id__in=ids).order_by('-created_at')
        return qs.none()

    def create(self, request, *args, **kwargs):
        user = request.user
        data = request.data.dict() if hasattr(request.data, 'dict') else request.data.copy()

        # Determine swimmer
        swimmer_id = data.get('swimmer_id') or data.get('swimmer')
        if user.role == 'SWIMMER':
            from apps.swimmers.utils import get_accessible_swimmer_ids
            accessible_ids = get_accessible_swimmer_ids(user, request)
            if not swimmer_id:
                if accessible_ids:
                    swimmer_id = accessible_ids[0]
            elif int(swimmer_id) not in accessible_ids:
                return Response({'detail': 'شما دسترسی به این شناگر ندارید.'}, status=status.HTTP_403_FORBIDDEN)
        
        if not swimmer_id:
            return Response({'detail': 'شناسه شناگر الزامی است.'}, status=status.HTTP_400_BAD_REQUEST)

        swimmer = SwimmerProfile.objects.filter(id=swimmer_id).first()
        if not swimmer:
            return Response({'detail': 'شناگر یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        # Determine enrollment and invoice if not explicitly specified
        enrollment_id = data.get('enrollment_id') or data.get('enrollment')
        enrollment = None
        if enrollment_id:
            enrollment = Enrollment.objects.filter(id=enrollment_id, swimmer=swimmer).first()
        if not enrollment:
            # Pick latest active or pending enrollment
            enrollment = swimmer.enrollments.order_by('-enrolled_at').first()

        invoice_id = data.get('invoice_id') or data.get('invoice')
        invoice = None
        if invoice_id:
            invoice = Invoice.objects.filter(id=invoice_id, swimmer=swimmer).first()
        elif enrollment and hasattr(enrollment, 'invoice'):
            invoice = enrollment.invoice
        elif not invoice:
            invoice = swimmer.invoices.filter(status__in=['ISSUED', 'PARTIALLY_PAID']).order_by('-created_at').first()

        installment_id = data.get('installment_id') or data.get('installment')
        installment = None
        if installment_id:
            installment = Installment.objects.filter(id=installment_id).first()

        receipt_image = request.FILES.get('receipt_image')
        if not receipt_image:
            return Response({'detail': 'بارگذاری تصویر فیش یا رسید الزامی است.'}, status=status.HTTP_400_BAD_REQUEST)

        amount_claimed_val = data.get('amount_claimed')
        amount_claimed = Decimal('0.00')
        if amount_claimed_val:
            try:
                amount_claimed = Decimal(str(amount_claimed_val))
            except Exception:
                pass

        receipt = PaymentReceipt.objects.create(
            swimmer=swimmer,
            enrollment=enrollment,
            invoice=invoice,
            installment=installment,
            receipt_image=receipt_image,
            amount_claimed=amount_claimed,
            tracking_number=data.get('tracking_number', '').strip(),
            payer_card_number=data.get('payer_card_number', '').strip(),
            notes=data.get('notes', '').strip(),
            status=PaymentReceipt.Status.PENDING
        )

        return Response(PaymentReceiptSerializer(receipt, context={'request': request}).data, status=status.HTTP_201_CREATED)


class PaymentReceiptReviewView(APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request, pk):
        receipt = generics.get_object_or_404(
            PaymentReceipt.objects.select_related('swimmer', 'enrollment', 'invoice'),
            pk=pk
        )

        action = request.data.get('action')
        if action not in ['APPROVE', 'REJECT']:
            return Response({'detail': 'عملیات نامعتبر است (APPROVE یا REJECT).'}, status=status.HTTP_400_BAD_REQUEST)

        if action == 'REJECT':
            reason = request.data.get('reason', '').strip()
            if not reason:
                return Response({'detail': 'لطفاً علت رد رسید را وارد نمایید.'}, status=status.HTTP_400_BAD_REQUEST)
            
            receipt.status = PaymentReceipt.Status.REJECTED
            receipt.rejection_reason = reason
            receipt.reviewed_by = request.user
            receipt.reviewed_at = timezone.now()
            receipt.save()

            AuditLog.objects.create(
                actor=request.user,
                action=AuditLog.Action.PAYMENT_RECORD,
                entity_type='PaymentReceipt',
                entity_id=str(receipt.id),
                details={'action': 'REJECT', 'reason': reason, 'swimmer': receipt.swimmer.full_name}
            )

            return Response(PaymentReceiptSerializer(receipt, context={'request': request}).data)

        # APPROVE action: manager must enter amount
        amount_raw = request.data.get('approved_amount')
        if not amount_raw:
            return Response({'detail': 'ورود مبلغ تأییدشده الزامی است.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            approved_amount = Decimal(str(amount_raw))
            if approved_amount <= Decimal('0.00'):
                raise ValueError
        except Exception:
            return Response({'detail': 'مبلغ تأییدشده نامعتبر است.'}, status=status.HTTP_400_BAD_REQUEST)

        notes = request.data.get('notes', '').strip()

        with transaction.atomic():
            # Determine target invoice
            target_invoice = receipt.invoice
            if not target_invoice and receipt.enrollment and hasattr(receipt.enrollment, 'invoice'):
                target_invoice = receipt.enrollment.invoice
            if not target_invoice:
                target_invoice = Invoice.objects.filter(
                    swimmer=receipt.swimmer,
                    status__in=[Invoice.Status.ISSUED, Invoice.Status.PARTIALLY_PAID]
                ).order_by('-created_at').first()

            # Create Payment record
            payment = Payment.objects.create(
                payment_number=Payment.generate_payment_number(),
                swimmer=receipt.swimmer,
                amount=approved_amount,
                method=Payment.Method.CARD_TRANSFER,
                status=Payment.Status.SUCCESSFUL,
                transaction_ref=receipt.tracking_number or f"RCPT-{receipt.id}",
                paid_at=timezone.now(),
                recorded_by=request.user,
                notes=f"تأیید فیش کارت‌به‌کارت رسید #{receipt.id}" + (f" - {notes}" if notes else "")
            )

            # Allocate amount to invoice and its installments
            remaining_to_allocate = approved_amount
            if target_invoice:
                if receipt.installment and receipt.installment.status != Installment.Status.PAID:
                    inst = receipt.installment
                    inst_alloc = min(remaining_to_allocate, inst.remaining_amount)
                    if inst_alloc > 0:
                        PaymentAllocation.objects.create(
                            payment=payment,
                            invoice=target_invoice,
                            installment=inst,
                            allocated_amount=inst_alloc
                        )
                        remaining_to_allocate -= inst_alloc

                # Allocate to other unpaid installments
                for inst in target_invoice.installments.filter(status__in=['UNPAID', 'PARTIAL', 'OVERDUE']).order_by('due_date'):
                    if remaining_to_allocate <= 0:
                        break
                    inst_alloc = min(remaining_to_allocate, inst.remaining_amount)
                    if inst_alloc > 0:
                        PaymentAllocation.objects.create(
                            payment=payment,
                            invoice=target_invoice,
                            installment=inst,
                            allocated_amount=inst_alloc
                        )
                        remaining_to_allocate -= inst_alloc

                # Allocate remaining directly to invoice if any
                if remaining_to_allocate > 0:
                    PaymentAllocation.objects.create(
                        payment=payment,
                        invoice=target_invoice,
                        installment=None,
                        allocated_amount=remaining_to_allocate
                    )
                    remaining_to_allocate = Decimal('0.00')

                target_invoice.recalculate_status()

                # If enrollment was PENDING_PAYMENT, update to ACTIVE
                if target_invoice.enrollment and target_invoice.enrollment.status == 'PENDING_PAYMENT':
                    target_invoice.enrollment.status = 'ACTIVE'
                    target_invoice.enrollment.save(update_fields=['status'])

            # Update receipt
            receipt.status = PaymentReceipt.Status.APPROVED
            receipt.approved_amount = approved_amount
            receipt.payment = payment
            receipt.reviewed_by = request.user
            receipt.reviewed_at = timezone.now()
            if target_invoice and not receipt.invoice:
                receipt.invoice = target_invoice
            if notes:
                receipt.notes = f"{receipt.notes}\n[مدیریت]: {notes}".strip()
            receipt.save()

            AuditLog.objects.create(
                actor=request.user,
                action=AuditLog.Action.PAYMENT_RECORD,
                entity_type='PaymentReceipt',
                entity_id=str(receipt.id),
                details={
                    'action': 'APPROVE',
                    'amount': str(approved_amount),
                    'swimmer': receipt.swimmer.full_name,
                    'invoice': target_invoice.invoice_number if target_invoice else None
                }
            )

        return Response(PaymentReceiptSerializer(receipt, context={'request': request}).data)


class PaymentReceiptDetailView(generics.RetrieveDestroyAPIView):
    queryset = PaymentReceipt.objects.all().select_related(
        'swimmer', 'enrollment__course', 'invoice', 'reviewed_by', 'payment'
    )
    serializer_class = PaymentReceiptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
            return self.queryset
        from apps.swimmers.utils import get_accessible_swimmer_ids
        ids = get_accessible_swimmer_ids(user, self.request)
        return self.queryset.filter(swimmer_id__in=ids)

