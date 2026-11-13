import datetime
from decimal import Decimal
from django.utils import timezone
from django.db import models, transaction
from django.db.models import Q, Count, Sum
from django.http import HttpResponse
from rest_framework import generics, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied

from .models import (
    CoachProfile, CoachCertificate, CoachContract, CoachPayroll,
    PayrollAdjustment, CoachPaymentRecord, CoachLeaveRequest,
    CoachPerformanceEvaluation, CoachAdministrativeNote, CoachActivityLog,
    CoachAttendanceCorrectionAudit
)
from .serializers import (
    CoachProfileSerializer, CoachPublicSerializer, CoachCertificateSerializer,
    CoachContractSerializer, CoachPayrollSerializer, PayrollAdjustmentSerializer,
    CoachPaymentRecordSerializer, CoachLeaveRequestSerializer,
    CoachPerformanceEvaluationSerializer, CoachAdministrativeNoteSerializer,
    CoachActivityLogSerializer, CoachAttendanceCorrectionAuditSerializer
)
from .services import (
    PayrollService, ContractService, AttendanceCorrectionService, CoachActivityLogger
)
from apps.accounts.permissions import IsAdminUserRole, IsSupervisorUserRole, IsAdminOrSupervisor, IsAdminOrCoach
from apps.scheduling.models import ClassSession
from apps.education.models import SwimmerGroup, GroupCoach


def get_target_coach(request, pk):
    """
    بررسی امنیتی دسترسی به پرونده مربی:
    - مدیر و ناظر فنی به تمام مربیان دسترسی دارند (با فیلتر فیلدهای محرمانه در سریالایزر)
    - مربی فقط و فقط به شناسه پروفایل اختصاصی خود دسترسی دارد.
    """
    user = request.user
    if not user or not user.is_authenticated:
        raise PermissionDenied('احراز هویت الزامی است.')

    try:
        coach = CoachProfile.objects.select_related('user').get(pk=pk)
    except CoachProfile.DoesNotExist:
        raise ValidationError('مربی با این شناسه یافت نشد.')

    if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
        return coach

    if user.role == 'COACH' and hasattr(user, 'coach_profile') and user.coach_profile.id == coach.id:
        return coach

    raise PermissionDenied('شما مجاز به دسترسی به پرونده این مربی نیستید.')


class CoachStatisticsView(APIView):
    """
    آمار تجمیعی و بلادرنگ پیشخوان مدیریت مربیان و منابع انسانی
    با قابلیت فیلتر بر اساس ماه انتخابی
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if not (user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser):
            raise PermissionDenied('دسترسی به آمار مدیریت مربیان مجاز نیست.')

        today = timezone.now().date()
        month_param = request.query_params.get('month')  # e.g. '2026-11' or current

        if month_param:
            try:
                parts = [int(p) for p in month_param.split('-')]
                if len(parts) == 2:
                    y, m = parts
                    start_date = datetime.date(y, m, 1)
                    if m == 12:
                        end_date = datetime.date(y + 1, 1, 1) - datetime.timedelta(days=1)
                    else:
                        end_date = datetime.date(y, m + 1, 1) - datetime.timedelta(days=1)
                else:
                    start_date = datetime.date(today.year, today.month, 1)
                    end_date = today
            except Exception:
                start_date = datetime.date(today.year, today.month, 1)
                end_date = today
        else:
            start_date = datetime.date(today.year, today.month, 1)
            end_date = today

        total_coaches = CoachProfile.objects.count()
        active_coaches = CoachProfile.objects.filter(employment_status=CoachProfile.EmploymentStatus.ACTIVE).count()
        suspended_coaches = CoachProfile.objects.filter(employment_status=CoachProfile.EmploymentStatus.SUSPENDED).count()
        inactive_coaches = CoachProfile.objects.filter(employment_status=CoachProfile.EmploymentStatus.INACTIVE).count()
        archived_coaches = CoachProfile.objects.filter(employment_status=CoachProfile.EmploymentStatus.ARCHIVED).count()

        # مربیانی که هم‌اکنون کلاس فعال یا جلسه تدریس دارند
        teaching_coaches = CoachProfile.objects.filter(
            Q(assigned_groups__group__status__in=['OPEN', 'FULL']) |
            Q(sessions__session_date__gte=start_date, sessions__session_date__lte=end_date, sessions__status=ClassSession.Status.SCHEDULED)
        ).distinct().count()

        # قراردادهای در شرف انقضا در ۳۰ روز آینده
        thirty_days_later = today + datetime.timedelta(days=30)
        expiring_contracts_count = CoachContract.objects.filter(
            status=CoachContract.Status.ACTIVE,
            end_date__gte=today,
            end_date__lte=thirty_days_later
        ).count()

        # مرخصی‌های در انتظار بررسی
        pending_leave_requests_count = CoachLeaveRequest.objects.filter(
            status=CoachLeaveRequest.Status.PENDING
        ).count()

        # شاخص‌های مالی ماه (مدیران و ناظران فنی مجاز به مشاهده هستند)
        is_privileged = user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser
        total_payroll_month = Decimal('0.00')
        outstanding_salary_payments = Decimal('0.00')
        fully_settled_coaches = 0

        if is_privileged:
            payrolls_month = CoachPayroll.objects.filter(
                period_start__lte=end_date,
                period_end__gte=start_date
            )
            for p in payrolls_month:
                total_payroll_month += p.net_payable_amount
                rem = p.remaining_balance
                outstanding_salary_payments += rem
                if p.payment_status == CoachPayroll.PaymentStatus.PAID:
                    fully_settled_coaches += 1

        return Response({
            'selected_month': month_param or today.strftime('%Y-%m'),
            'total_coaches': total_coaches,
            'active_coaches': active_coaches,
            'inactive_coaches': inactive_coaches,
            'suspended_coaches': suspended_coaches,
            'archived_coaches': archived_coaches,
            'inactive_or_suspended_coaches': inactive_coaches + suspended_coaches,
            'teaching_coaches': teaching_coaches,
            'total_payroll_month': str(total_payroll_month),
            'outstanding_salary_payments': str(outstanding_salary_payments),
            'fully_settled_coaches': fully_settled_coaches,
            'expiring_contracts_count': expiring_contracts_count,
            'pending_leave_requests_count': pending_leave_requests_count,
        })


class CoachListHRView(generics.ListCreateAPIView):
    """
    لیست مربیان با فیلترهای جامع پرسنلی، قراردادی، مالی و جستجو
    """
    serializer_class = CoachProfileSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsAdminUserRole()]

    def get_serializer_class(self):
        user = self.request.user if hasattr(self, 'request') else None
        if user and user.is_authenticated and (user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser):
            return CoachProfileSerializer
        return CoachPublicSerializer

    def get_queryset(self):
        user = self.request.user if hasattr(self, 'request') else None
        qs = CoachProfile.objects.all().select_related('user').prefetch_related(
            'contracts', 'payrolls', 'assigned_groups'
        )

        # اگر کاربر احراز هویت نشده یا عموم است
        if not (user and user.is_authenticated and (user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser)):
            landing_param = self.request.query_params.get('landing')
            if landing_param and landing_param.lower() in ['true', '1']:
                qs = qs.filter(show_on_landing=True, employment_status=CoachProfile.EmploymentStatus.ACTIVE)
            else:
                qs = qs.filter(employment_status=CoachProfile.EmploymentStatus.ACTIVE)
            gender_param = self.request.query_params.get('gender')
            if gender_param:
                qs = qs.filter(gender=gender_param)
            return qs.order_by('display_order', 'id')

        params = self.request.query_params

        # 1. Search
        search = params.get('search')
        if search:
            search = search.strip()
            qs = qs.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__phone__icontains=search) |
                Q(user__national_id__icontains=search) |
                Q(personnel_id__icontains=search) |
                Q(coaching_degree__icontains=search)
            )

        # 2. Employment Status
        status_param = params.get('status')
        if status_param:
            qs = qs.filter(employment_status=status_param)

        # 3. Gender
        gender = params.get('gender')
        if gender:
            qs = qs.filter(gender=gender)

        # 4. Employment Type (HOURLY, FIXED, PERCENTAGE)
        emp_type = params.get('employment_type')
        if emp_type:
            qs = qs.filter(employment_type=emp_type)

        # 5. Coaching Degree
        coaching_degree = params.get('coaching_degree') or params.get('degree')
        if coaching_degree:
            qs = qs.filter(coaching_degree__icontains=coaching_degree)

        # 6. Contract Status (ACTIVE, EXPIRING_SOON, EXPIRED, NO_CONTRACT)
        contract_status = params.get('contract_status')
        if contract_status:
            today = timezone.now().date()
            if contract_status == 'ACTIVE':
                qs = qs.filter(contracts__status=CoachContract.Status.ACTIVE).distinct()
            elif contract_status == 'EXPIRING_SOON':
                thirty_days = today + datetime.timedelta(days=30)
                qs = qs.filter(
                    contracts__status=CoachContract.Status.ACTIVE,
                    contracts__end_date__gte=today,
                    contracts__end_date__lte=thirty_days
                ).distinct()
            elif contract_status == 'EXPIRED':
                qs = qs.filter(contracts__status=CoachContract.Status.EXPIRED).distinct()
            elif contract_status == 'NO_CONTRACT':
                qs = qs.filter(contracts__isnull=True)

        # 7. Payroll Status (PAID, PARTIALLY_PAID, UNPAID)
        payroll_status = params.get('payroll_status')
        if payroll_status:
            qs = qs.filter(payrolls__payment_status=payroll_status).distinct()

        # 8. Ordering
        ordering = params.get('ordering', 'display_order')
        if ordering == 'name':
            qs = qs.order_by('user__last_name', 'user__first_name')
        elif ordering == '-name':
            qs = qs.order_by('-user__last_name', '-user__first_name')
        elif ordering == 'employment_date':
            qs = qs.order_by('employment_start_date')
        elif ordering == '-employment_date':
            qs = qs.order_by('-employment_start_date')
        else:
            qs = qs.order_by('display_order', 'user__last_name', 'user__first_name')

        return qs


class CoachDetailHRView(generics.RetrieveUpdateDestroyAPIView):
    """
    پرونده تفصیلی مربی با پشتیبانی از واکشی، ویرایش کامل و بایگانی (بدون حذف سوابق مالی و حضور)
    """
    queryset = CoachProfile.objects.all().select_related('user')
    serializer_class = CoachProfileSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_serializer_class(self):
        user = self.request.user if hasattr(self, 'request') else None
        if not user or not user.is_authenticated:
            return CoachPublicSerializer
        if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
            return CoachProfileSerializer
        if user.role == 'COACH' and hasattr(user, 'coach_profile') and str(user.coach_profile.id) == str(self.kwargs.get('pk')):
            return CoachProfileSerializer
        return CoachPublicSerializer

    COACH_SELF_UPDATE_ALLOWED_FIELDS = {
        'specialties', 'bio', 'emergency_contact_name', 'emergency_contact_phone', 'address'
    }

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        if self.request.method == 'DELETE':
            return [IsAdminUserRole()]
        return [IsAdminOrCoach()]

    def perform_update(self, serializer):
        user = self.request.user
        instance = self.get_object()
        if user.role == 'ADMIN' or user.is_superuser:
            serializer.save()
            return
        if user.role == 'COACH' and instance.user_id and instance.user_id == user.id:
            disallowed = set(serializer.validated_data.keys()) - self.COACH_SELF_UPDATE_ALLOWED_FIELDS
            if disallowed:
                raise PermissionDenied('شما فقط مجاز به ویرایش فیلدهای مشخصات فردی و تخصصی خود هستید.')
            serializer.save()
            return
        raise PermissionDenied('شما مجاز به ویرایش پرونده این مربی نیستید.')

    def perform_destroy(self, instance):
        """
        عملیات بایگانی مربی (هرگز دیتابیس و سوابق مالی/حضور مربی را فیزیکی پاک نمی‌کنیم)
        """
        user = self.request.user
        if not (user.role == 'ADMIN' or user.is_superuser):
            raise PermissionDenied('تنها مدیران ارشد مجاز به بایگانی پرونده مربی هستند.')

        instance.employment_status = CoachProfile.EmploymentStatus.ARCHIVED
        instance.save(update_fields=['employment_status', 'updated_at'])

        CoachActivityLogger.log(
            coach=instance,
            event_type=CoachActivityLog.EventType.STATUS_CHANGED,
            actor=user,
            description=f"بایگانی رسمی پرونده مربی {instance.full_name} با حفظ کلیه سوابق مالی و احکام"
        )


class CoachChangeStatusView(APIView):
    """
    تغییر وضعیت همکاری مربی (فعال، معلق، غیرفعال، بایگانی) با ثبت ردپای حسابرسی
    """
    permission_classes = [IsAdminUserRole]

    def post(self, request, pk):
        coach = get_target_coach(request, pk)
        new_status = request.data.get('employment_status')
        reason = request.data.get('reason', '')

        if new_status not in CoachProfile.EmploymentStatus.values:
            return Response({'detail': 'وضعیت همکاری انتخاب‌شده نامعتبر است.'}, status=status.HTTP_400_BAD_REQUEST)

        old_status_display = coach.get_employment_status_display()
        coach.employment_status = new_status
        coach.save(update_fields=['employment_status', 'updated_at'])

        new_status_display = coach.get_employment_status_display()
        CoachActivityLogger.log(
            coach=coach,
            event_type=CoachActivityLog.EventType.STATUS_CHANGED,
            actor=request.user,
            description=f"تغییر وضعیت از «{old_status_display}» به «{new_status_display}» - علت: {reason or 'بدون توضیح'}",
            metadata={'old_status': old_status_display, 'new_status': new_status_display, 'reason': reason}
        )

        return Response({
            'message': f'وضعیت مربی {coach.full_name} با موفقیت به {new_status_display} تغییر یافت.',
            'employment_status': new_status
        })


class CoachCertificateListCreateView(APIView):
    """
    لیست و ثبت مدارک و گواهینامه‌های مربی
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        coach = get_target_coach(request, pk)
        certs = coach.certificates.all()
        serializer = CoachCertificateSerializer(certs, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, pk):
        coach = get_target_coach(request, pk)
        if not (request.user.role == 'ADMIN' or request.user.is_superuser):
            raise PermissionDenied('تنها مدیران مجاز به ثبت و تایید مدرک مربی هستند.')

        data = request.data.copy()
        data['coach'] = coach.id
        serializer = CoachCertificateSerializer(data=data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        cert = serializer.save()

        CoachActivityLogger.log(
            coach=coach,
            event_type=CoachActivityLog.EventType.PROFILE_UPDATED,
            actor=request.user,
            description=f"ثبت گواهینامه جدید: {cert.title}"
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CoachCertificateDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CoachCertificate.objects.all()
    serializer_class = CoachCertificateSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        user = self.request.user
        qs = CoachCertificate.objects.all().select_related('coach', 'coach__user')
        if user and user.is_authenticated:
            if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
                return qs
            if user.role == 'COACH':
                return qs.filter(coach__user=user)
        return qs.none()


class CoachContractListCreateView(APIView):
    """
    مدیریت قراردادهای مربی (انعقاد قرارداد جدید با حفظ تاریخچه)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        coach = get_target_coach(request, pk)
        contracts = coach.contracts.all()
        serializer = CoachContractSerializer(contracts, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, pk):
        coach = get_target_coach(request, pk)
        if not (request.user.role == 'ADMIN' or request.user.is_superuser):
            raise PermissionDenied('فقط مدیران آموزشگاه مجاز به ثبت قرارداد هستند.')

        contract = ContractService.create_contract(coach, request.data, created_by=request.user)
        serializer = CoachContractSerializer(contract, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CoachContractDetailView(generics.RetrieveUpdateAPIView):
    queryset = CoachContract.objects.all()
    serializer_class = CoachContractSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        user = self.request.user
        qs = CoachContract.objects.all().select_related('coach', 'coach__user', 'created_by')
        if user and user.is_authenticated:
            if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
                return qs
            if user.role == 'COACH':
                return qs.filter(coach__user=user)
        return qs.none()


class CoachContractRenewView(APIView):
    """
    تمدید قرارداد موجود با شماره قرارداد و مفاد جدید (بدون دستکاری سوابق گذشته)
    """
    permission_classes = [IsAdminUserRole]

    def post(self, request, contract_id):
        try:
            old_contract = CoachContract.objects.get(pk=contract_id)
        except CoachContract.DoesNotExist:
            return Response({'detail': 'قرارداد یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        new_contract = ContractService.renew_contract(old_contract, request.data, created_by=request.user)
        serializer = CoachContractSerializer(new_contract, context={'request': request})
        return Response({
            'message': 'تمدید قرارداد با موفقیت انجام شد.',
            'contract': serializer.data
        }, status=status.HTTP_201_CREATED)


class CoachPayrollListCreateView(APIView):
    """
    فیش‌های حقوقی مربی و موتور صدور و محاسبه حقوق ماهانه
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        coach = get_target_coach(request, pk)
        payrolls = coach.payrolls.all().prefetch_related('adjustments', 'payments')
        serializer = CoachPayrollSerializer(payrolls, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, pk):
        """
        محاسبه حقوق و صدور فیش با امکان پیش‌نمایش (Preview)
        """
        coach = get_target_coach(request, pk)
        if not (request.user.role == 'ADMIN' or request.user.is_superuser):
            raise PermissionDenied('تنها مدیران مجاز به صدور فیش حقوقی هستند.')

        period_start_str = request.data.get('period_start')
        period_end_str = request.data.get('period_end')
        period_label = request.data.get('period_label')
        preview_only = str(request.data.get('preview_only', '')).lower() in ['true', '1']
        base_rate_override = request.data.get('base_rate_override')
        comp_model_override = request.data.get('compensation_model_override')

        if not period_start_str or not period_end_str:
            return Response({'detail': 'تاریخ شروع و پایان دوره الزامی است.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            p_start = datetime.date.fromisoformat(period_start_str)
            p_end = datetime.date.fromisoformat(period_end_str)
        except ValueError:
            return Response({'detail': 'فرمت تاریخ باید YYYY-MM-DD باشد.'}, status=status.HTTP_400_BAD_REQUEST)

        result = PayrollService.calculate_monthly_payroll(
            coach=coach,
            period_start=p_start,
            period_end=p_end,
            period_label=period_label,
            preview_only=preview_only,
            created_by=request.user,
            base_rate_override=base_rate_override,
            compensation_model_override=comp_model_override
        )

        if preview_only:
            return Response(result, status=status.HTTP_200_OK)

        serializer = CoachPayrollSerializer(result, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CoachPayrollDetailView(generics.RetrieveUpdateAPIView):
    queryset = CoachPayroll.objects.all().prefetch_related('adjustments', 'payments')
    serializer_class = CoachPayrollSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        user = self.request.user
        qs = CoachPayroll.objects.all().select_related('coach', 'coach__user').prefetch_related('adjustments', 'payments')
        if user and user.is_authenticated:
            if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
                return qs
            if user.role == 'COACH':
                return qs.filter(coach__user=user)
        return qs.none()


class CoachPayrollApproveView(APIView):
    """
    تأیید نهایی فیش حقوقی توسط مدیر
    """
    permission_classes = [IsAdminUserRole]

    def post(self, request, payroll_id):
        try:
            payroll = CoachPayroll.objects.get(pk=payroll_id)
        except CoachPayroll.DoesNotExist:
            return Response({'detail': 'فیش حقوقی یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        approved = PayrollService.approve_payroll(payroll, approved_by=request.user)
        serializer = CoachPayrollSerializer(approved, context={'request': request})
        return Response({
            'message': 'فیش حقوقی با موفقیت تأیید شد.',
            'payroll': serializer.data
        })


class PayrollAdjustmentCreateView(APIView):
    """
    ثبت ردیف‌های پاداش، اضافه‌کاری، کسورات یا جریمه غیبت روی فیش حقوقی
    """
    permission_classes = [IsAdminUserRole]

    def post(self, request, payroll_id):
        try:
            payroll = CoachPayroll.objects.get(pk=payroll_id)
        except CoachPayroll.DoesNotExist:
            return Response({'detail': 'فیش حقوقی یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        if payroll.approval_status == CoachPayroll.ApprovalStatus.APPROVED:
            return Response(
                {'detail': 'این فیش حقوقی قبلاً تأیید شده است. برای تغییر، از سند تعدیل مصوب استفاده کنید.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = request.data.copy()
        data['payroll'] = payroll.id
        serializer = PayrollAdjustmentSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        adj = serializer.save(created_by=request.user)

        # بازمحاسبه فیش
        PayrollService.calculate_monthly_payroll(
            coach=payroll.coach,
            period_start=payroll.period_start,
            period_end=payroll.period_end,
            period_label=payroll.period_label,
            created_by=request.user
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CoachPaymentCreateView(APIView):
    """
    ثبت پرداخت وجه (واریز کامل یا بخشی از حقوق با سند پیگیری بانکی)
    """
    permission_classes = [IsAdminUserRole]

    def post(self, request, payroll_id):
        try:
            payroll = CoachPayroll.objects.get(pk=payroll_id)
        except CoachPayroll.DoesNotExist:
            return Response({'detail': 'فیش حقوقی یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        amount = request.data.get('amount')
        payment_date_str = request.data.get('payment_date') or timezone.now().date().isoformat()
        payment_method = request.data.get('payment_method', CoachPaymentRecord.PaymentMethod.BANK_TRANSFER)
        reference_number = request.data.get('reference_number', '')
        description = request.data.get('description', '')
        receipt_document = request.FILES.get('receipt_document')

        try:
            p_date = datetime.date.fromisoformat(str(payment_date_str))
        except ValueError:
            p_date = timezone.now().date()

        payment = PayrollService.register_payment(
            payroll=payroll,
            amount=amount,
            payment_date=p_date,
            payment_method=payment_method,
            reference_number=reference_number,
            description=description,
            receipt_document=receipt_document,
            registered_by=request.user
        )

        serializer = CoachPaymentRecordSerializer(payment, context={'request': request})
        return Response({
            'message': 'سند واریز حقوق با موفقیت در سیستم ثبت گردید.',
            'payment': serializer.data,
            'remaining_balance': str(payroll.remaining_balance),
            'payment_status': payroll.payment_status
        }, status=status.HTTP_201_CREATED)


class CoachPaymentReverseView(APIView):
    """
    برگشت و ابطال سند واریزی حقوق مربی با رعایت ردپای حسابرسی
    """
    permission_classes = [IsAdminUserRole]

    def post(self, request, payment_id):
        try:
            payment = CoachPaymentRecord.objects.get(pk=payment_id)
        except CoachPaymentRecord.DoesNotExist:
            return Response({'detail': 'سند پرداخت یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', '')
        reversal = PayrollService.reverse_payment(payment, reason=reason, reversed_by=request.user)
        serializer = CoachPaymentRecordSerializer(reversal, context={'request': request})
        return Response({
            'message': 'سند واریزی با موفقیت برگشت داده شد.',
            'reversal': serializer.data
        })


class CoachLeaveRequestListCreateView(APIView):
    """
    مدیریت مرخصی مربی (امکان ثبت توسط مربی یا مدیر و بررسی تاریخچه)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        coach = get_target_coach(request, pk)
        leaves = coach.leave_requests.all()
        serializer = CoachLeaveRequestSerializer(leaves, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, pk):
        coach = get_target_coach(request, pk)
        if not (request.user.role == 'ADMIN' or request.user.is_superuser or (coach.user_id and coach.user_id == request.user.id)):
            raise PermissionDenied('فقط مربی مربوطه یا مدیر مجاز به ثبت درخواست مرخصی است.')
        data = request.data.copy()
        data['coach'] = coach.id

        serializer = CoachLeaveRequestSerializer(data=data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        leave = serializer.save()

        CoachActivityLogger.log(
            coach=coach,
            event_type=CoachActivityLog.EventType.LEAVE_REQUESTED,
            actor=request.user,
            description=f"ثبت درخواست {leave.get_leave_type_display()} از تاریخ {leave.start_date} تا {leave.end_date}"
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CoachLeaveRequestReviewView(APIView):
    """
    بررسی درخواست مرخصی توسط مدیر (موافقت یا رد با درج یادداشت اداری)
    """
    permission_classes = [IsAdminUserRole]

    def post(self, request, leave_id):
        try:
            leave = CoachLeaveRequest.objects.get(pk=leave_id)
        except CoachLeaveRequest.DoesNotExist:
            return Response({'detail': 'درخواست مرخصی یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        admin_notes = request.data.get('admin_notes', '')

        if new_status not in [CoachLeaveRequest.Status.APPROVED, CoachLeaveRequest.Status.REJECTED]:
            return Response({'detail': 'وضعیت باید APPROVED یا REJECTED باشد.'}, status=status.HTTP_400_BAD_REQUEST)

        leave.status = new_status
        leave.admin_notes = admin_notes
        leave.reviewed_by = request.user
        leave.reviewed_at = timezone.now()
        leave.save()

        ev_type = CoachActivityLog.EventType.LEAVE_APPROVED if new_status == CoachLeaveRequest.Status.APPROVED else CoachActivityLog.EventType.LEAVE_REJECTED
        CoachActivityLogger.log(
            coach=leave.coach,
            event_type=ev_type,
            actor=request.user,
            description=f"بررسی درخواست مرخصی {leave.get_leave_type_display()}: {leave.get_status_display()} - یادداشت: {admin_notes or 'ندارد'}"
        )

        serializer = CoachLeaveRequestSerializer(leave, context={'request': request})
        return Response({
            'message': f'وضعیت درخواست با موفقیت به {leave.get_status_display()} به‌روزرسانی شد.',
            'leave': serializer.data
        })


class CoachPerformanceEvaluationListCreateView(APIView):
    """
    ارزیابی عملکرد دوره‌ای مربی (توسط مدیر آموزشگاه یا ناظر فنی)
    مربی امکان ویرایش ارزیابی را ندارد.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        coach = get_target_coach(request, pk)
        evals = coach.evaluations.all()
        # اگر مربی است، فقط موارد به اشتراک گذاشته شده
        if request.user.role == 'COACH':
            evals = evals.filter(is_shared_with_coach=True)

        serializer = CoachPerformanceEvaluationSerializer(evals, many=True)
        return Response(serializer.data)

    def post(self, request, pk):
        coach = get_target_coach(request, pk)
        user = request.user
        # مربی حق ارزیابی خود را ندارد
        if not (user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser):
            raise PermissionDenied('تنها مدیران و ناظران فنی مجاز به ثبت ارزیابی عملکرد هستند.')

        data = request.data.copy()
        data['coach'] = coach.id
        serializer = CoachPerformanceEvaluationSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        eval_record = serializer.save(evaluator=user)

        CoachActivityLogger.log(
            coach=coach,
            event_type=CoachActivityLog.EventType.EVALUATION_RECORDED,
            actor=user,
            description=f"ثبت ارزیابی عملکرد دوره {eval_record.period_label} با نمره {eval_record.overall_score} از ۵ توسط {user.full_name}"
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CoachPerformanceEvaluationDetailView(generics.RetrieveUpdateAPIView):
    queryset = CoachPerformanceEvaluation.objects.all()
    serializer_class = CoachPerformanceEvaluationSerializer
    permission_classes = [IsAdminOrSupervisor]


class CoachAdministrativeNoteListCreateView(APIView):
    """
    یادداشت‌های محرمانه، تذکرات، تشویق‌ها و گزارش وقایع اداری مربی
    """
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [IsAdminOrSupervisor()]
        return [IsAdminUserRole()]

    def get(self, request, pk):
        coach = get_target_coach(request, pk)
        notes = coach.administrative_notes.all()
        serializer = CoachAdministrativeNoteSerializer(notes, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, pk):
        coach = get_target_coach(request, pk)
        data = request.data.copy()
        data['coach'] = coach.id
        serializer = CoachAdministrativeNoteSerializer(data=data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        note = serializer.save(created_by=request.user)

        CoachActivityLogger.log(
            coach=coach,
            event_type=CoachActivityLog.EventType.ADMIN_NOTE_ADDED,
            actor=request.user,
            description=f"ثبت {note.get_category_display()}: {note.title}"
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CoachActivityTimelineView(APIView):
    """
    تاریخچه زمانی جامع کلیه رویدادهای مربی (قراردادها، تغییر وضعیت، احکام، پرداخت‌ها و...)
    با امکان فیلتر بر اساس دسته‌بندی
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        coach = get_target_coach(request, pk)
        logs = coach.activity_logs.all()

        event_type = request.query_params.get('event_type')
        if event_type:
            logs = logs.filter(event_type=event_type)

        serializer = CoachActivityLogSerializer(logs[:100], many=True)
        return Response(serializer.data)


class CoachAttendanceSummaryView(APIView):
    """
    خلاصه حضور و جلسات تدریس مربی و ثبت اصلاحیه سوابق با لاگ حسابرسی
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        coach = get_target_coach(request, pk)
        month_param = request.query_params.get('month')

        today = timezone.now().date()
        if month_param:
            try:
                y, m = [int(p) for p in month_param.split('-')]
                start_date = datetime.date(y, m, 1)
                end_date = (datetime.date(y + 1, 1, 1) if m == 12 else datetime.date(y, m + 1, 1)) - datetime.timedelta(days=1)
            except Exception:
                start_date = today - datetime.timedelta(days=30)
                end_date = today
        else:
            start_date = today - datetime.timedelta(days=30)
            end_date = today

        sessions = ClassSession.objects.filter(
            coach=coach,
            session_date__gte=start_date,
            session_date__lte=end_date
        ).select_related('group', 'group__course').order_by('-session_date', '-start_time')

        scheduled_hours = Decimal('0.00')
        approved_hours = Decimal('0.00')
        completed_count = 0
        cancelled_count = 0

        sessions_data = []
        for s in sessions:
            dur = Decimal('0.00')
            if s.start_time and s.end_time:
                t1 = datetime.datetime.combine(s.session_date, s.start_time)
                t2 = datetime.datetime.combine(s.session_date, s.end_time)
                dur = Decimal(str(max(0, (t2 - t1).total_seconds()) / 3600.0)).quantize(Decimal('0.01'))

            scheduled_hours += dur
            if s.status == ClassSession.Status.COMPLETED:
                approved_hours += dur
                completed_count += 1
            elif s.status == ClassSession.Status.CANCELLED:
                cancelled_count += 1

            sessions_data.append({
                'id': s.id,
                'session_date': s.session_date,
                'start_time': s.start_time.strftime('%H:%M'),
                'end_time': s.end_time.strftime('%H:%M'),
                'duration_hours': str(dur),
                'group_name': s.group.name,
                'course_name': s.group.course.name,
                'pool_location': s.pool_location,
                'status': s.status,
                'status_display': s.get_status_display(),
                'cancellation_reason': s.cancellation_reason,
            })

        # اصلاحات انجام‌شده
        corrections = CoachAttendanceCorrectionAudit.objects.filter(coach=coach).order_by('-created_at')[:20]
        corrections_serializer = CoachAttendanceCorrectionAuditSerializer(corrections, many=True)

        return Response({
            'period_start': start_date,
            'period_end': end_date,
            'scheduled_hours': str(scheduled_hours),
            'approved_hours': str(approved_hours),
            'completed_sessions': completed_count,
            'cancelled_sessions': cancelled_count,
            'sessions': sessions_data,
            'recent_corrections': corrections_serializer.data,
        })

    def post(self, request, pk):
        """
        اصلاح دستی ساعت یا وضعیت جلسه تدریس مربی (Audit Trail)
        """
        coach = get_target_coach(request, pk)
        if not (request.user.role == 'ADMIN' or request.user.is_superuser):
            raise PermissionDenied('تنها مدیر آموزشگاه مجاز به اصلاح سوابق تدریس است.')

        session_id = request.data.get('session_id')
        new_status = request.data.get('new_status')
        new_hours = request.data.get('new_hours', 0)
        reason = request.data.get('reason')

        if not session_id or not new_status or not reason:
            return Response({'detail': 'شناسه جلسه، وضعیت جدید و علت اصلاح الزامی است.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            session = ClassSession.objects.get(pk=session_id, coach=coach)
        except ClassSession.DoesNotExist:
            return Response({'detail': 'جلسه کلاسی برای این مربی یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        audit = AttendanceCorrectionService.correct_session(
            coach=coach,
            session=session,
            new_status=new_status,
            new_hours=new_hours,
            reason=reason,
            adjusted_by=request.user
        )

        serializer = CoachAttendanceCorrectionAuditSerializer(audit)
        return Response({
            'message': 'اصلاحیه سابقه تدریس با موفقیت ثبت شد.',
            'correction': serializer.data
        }, status=status.HTTP_201_CREATED)


class CoachScheduleView(APIView):
    """
    برنامه هفتگی مربی، سانس‌های اشغال و آزاد و تشخیص هوشمند تداخل کلاسی
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        coach = get_target_coach(request, pk)

        # تخصیص‌های جاری به گروه‌ها
        group_assignments = GroupCoach.objects.filter(
            coach=coach
        ).select_related('group', 'group__course', 'group__skill_level').prefetch_related('group__schedules')

        groups_data = []
        total_weekly_minutes = 0

        for ga in group_assignments:
            grp = ga.group
            schedules = grp.schedules.all()
            sch_list = []
            for s in schedules:
                sh, sm = s.start_time.hour, s.start_time.minute
                eh, em = s.end_time.hour, s.end_time.minute
                diff = (eh * 60 + em) - (sh * 60 + sm)
                if diff > 0:
                    total_weekly_minutes += diff
                sch_list.append({
                    'id': s.id,
                    'weekday': s.weekday,
                    'weekday_display': s.get_weekday_display(),
                    'start_time': s.start_time.strftime('%H:%M'),
                    'end_time': s.end_time.strftime('%H:%M'),
                    'duration_minutes': diff,
                })

            groups_data.append({
                'assignment_id': ga.id,
                'group_id': grp.id,
                'group_name': grp.name,
                'course_name': grp.course.name,
                'skill_level': grp.skill_level.name,
                'status': grp.status,
                'pool_location': grp.pool_location,
                'is_primary': ga.is_primary,
                'schedules': sch_list,
            })

        weekly_hours = Decimal(str(total_weekly_minutes / 60.0)).quantize(Decimal('0.1'))

        # جلسات آتی در ۳۰ روز آینده
        today = timezone.now().date()
        upcoming_sessions = ClassSession.objects.filter(
            coach=coach,
            session_date__gte=today,
            session_date__lte=today + datetime.timedelta(days=30),
            status__in=[ClassSession.Status.SCHEDULED, ClassSession.Status.MAKEUP]
        ).select_related('group', 'group__course').order_by('session_date', 'start_time')

        upcoming_data = [
            {
                'id': us.id,
                'session_date': us.session_date,
                'start_time': us.start_time.strftime('%H:%M'),
                'end_time': us.end_time.strftime('%H:%M'),
                'group_name': us.group.name,
                'course_name': us.group.course.name,
                'pool_location': us.pool_location,
                'status': us.status,
            }
            for us in upcoming_sessions
        ]

        # بررسی تداخل‌ها در جلسات آینده
        conflicts = []
        for i, s1 in enumerate(upcoming_sessions):
            for s2 in upcoming_sessions[i + 1:]:
                if s1.session_date == s2.session_date:
                    if not (s1.end_time <= s2.start_time or s1.start_time >= s2.end_time):
                        conflicts.append({
                            'date': s1.session_date,
                            'session_1': f"{s1.group.name} ({s1.start_time.strftime('%H:%M')}-{s1.end_time.strftime('%H:%M')})",
                            'session_2': f"{s2.group.name} ({s2.start_time.strftime('%H:%M')}-{s2.end_time.strftime('%H:%M')})",
                            'description': 'تداخل همزمانی دو کلاس در یک سانس'
                        })

        return Response({
            'contractual_weekly_hours': coach.contractual_weekly_hours,
            'scheduled_weekly_hours': str(weekly_hours),
            'hours_difference': str(weekly_hours - Decimal(str(coach.contractual_weekly_hours))),
            'assigned_groups': groups_data,
            'upcoming_sessions': upcoming_data,
            'conflicts_count': len(conflicts),
            'conflicts': conflicts
        })


class CoachHRReportsView(APIView):
    """
    گزارش‌گیری تحلیلی و خروجی اکسل و CSV برای مدیران و ناظران فنی
    شامل مطالبات، گزارش حقوق ماهانه، ساعات تدریس، انقضای قراردادها و ارزیابی عملکرد
    """
    permission_classes = [IsAdminOrSupervisor]

    def get(self, request):
        report_type = request.query_params.get('type', 'payroll')
        export_csv = request.query_params.get('export') == 'csv'

        today = timezone.now().date()

        if report_type == 'payroll':
            # گزارش حقوق و دستمزد ماهانه
            payrolls = CoachPayroll.objects.all().select_related('coach', 'coach__user').order_by('-period_start')
            coach_id = request.query_params.get('coach_id')
            if coach_id:
                payrolls = payrolls.filter(coach_id=coach_id)

            data = []
            for p in payrolls:
                data.append({
                    'id': p.id,
                    'coach_name': p.coach.full_name,
                    'personnel_id': p.coach.personnel_id or '—',
                    'period_label': p.period_label,
                    'period_start': p.period_start,
                    'period_end': p.period_end,
                    'compensation_model': p.get_compensation_model_display(),
                    'teaching_hours': str(p.teaching_hours),
                    'sessions_count': p.completed_sessions_count,
                    'gross_amount': str(p.gross_amount),
                    'bonuses': str(p.bonuses_amount + p.overtime_amount),
                    'deductions': str(p.deductions_amount),
                    'net_payable': str(p.net_payable_amount),
                    'total_paid': str(p.total_paid),
                    'remaining_balance': str(p.remaining_balance),
                    'approval_status': p.get_approval_status_display(),
                    'payment_status': p.get_payment_status_display(),
                })

            if export_csv:
                return self.export_as_csv(
                    filename=f"payroll_report_{today.strftime('%Y%m%d')}.csv",
                    headers=['نام مربی', 'کد پرسنلی', 'دوره حقوق', 'مدل دستمزد', 'ساعات تدریس', 'مبلغ ناخالص', 'خالص پرداختی', 'واریزشده', 'مانده بدهی', 'وضعیت تسویه'],
                    rows=[[r['coach_name'], r['personnel_id'], r['period_label'], r['compensation_model'], r['teaching_hours'], r['gross_amount'], r['net_payable'], r['total_paid'], r['remaining_balance'], r['payment_status']] for r in data]
                )
            return Response({'report_type': 'payroll', 'records': data})

        elif report_type == 'contracts':
            # گزارش قراردادها و هشدارهای انقضا
            contracts = CoachContract.objects.all().select_related('coach', 'coach__user').order_by('end_date')
            data = []
            for c in contracts:
                diff = (c.end_date - today).days if c.end_date else 999
                data.append({
                    'id': c.id,
                    'coach_name': c.coach.full_name,
                    'contract_number': c.contract_number,
                    'contract_type': c.get_contract_type_display(),
                    'employment_type': c.get_employment_type_display(),
                    'start_date': c.start_date,
                    'end_date': c.end_date,
                    'days_remaining': diff,
                    'is_expiring_soon': 0 <= diff <= 30,
                    'status': c.get_status_display(),
                })
            return Response({'report_type': 'contracts', 'records': data})

        elif report_type == 'performance':
            evals = CoachPerformanceEvaluation.objects.all().select_related('coach', 'evaluator').order_by('-evaluation_date')
            data = [
                {
                    'id': e.id,
                    'coach_name': e.coach.full_name,
                    'period_label': e.period_label,
                    'overall_score': str(e.overall_score),
                    'evaluator_name': e.evaluator.full_name if e.evaluator else '—',
                    'evaluation_date': e.evaluation_date,
                }
                for e in evals
            ]
            return Response({'report_type': 'performance', 'records': data})

        return Response({'detail': 'نوع گزارش نامعتبر است.'}, status=status.HTTP_400_BAD_REQUEST)

    def export_as_csv(self, filename, headers, rows):
        import csv
        import io
        output = io.StringIO()
        # Add UTF-8 BOM so Excel opens Persian text cleanly
        output.write('\ufeff')
        writer = csv.writer(output)
        writer.writerow(headers)
        for r in rows:
            writer.writerow(r)

        response = HttpResponse(output.getvalue(), content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
