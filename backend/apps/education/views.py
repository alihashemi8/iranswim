import datetime
from decimal import Decimal
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import (
    SkillLevel, Skill, Course, SwimmerGroup,
    GroupSchedule, GroupCoach, EnrollmentRequest, Enrollment
)
from .serializers import (
    SkillLevelSerializer, SkillSerializer, CourseSerializer,
    SwimmerGroupSerializer, GroupScheduleSerializer, GroupCoachSerializer,
    EnrollmentRequestSerializer, EnrollmentSerializer
)
from apps.accounts.permissions import IsAdminUserRole, IsAdminOrSupervisor, IsAdminOrCoach
from apps.coaches.models import CoachProfile, CoachPayroll, CoachPaymentRecord
from apps.coaches.serializers import CoachPayrollSerializer, CoachPaymentRecordSerializer
from apps.coaches.services import PayrollService
from apps.swimmers.models import SwimmerProfile
from apps.finance.models import Invoice, InvoiceItem, Installment, Payment, PaymentAllocation, FinancialAdjustment, PaymentReceipt
from apps.finance.serializers import InvoiceSerializer, InstallmentSerializer, PaymentSerializer, PaymentReceiptSerializer
from apps.supervisor.models import AuditLog


class SkillLevelListView(generics.ListCreateAPIView):
    queryset = SkillLevel.objects.all().prefetch_related('skills')
    serializer_class = SkillLevelSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [IsAdminUserRole()]


class SkillListCreateView(generics.ListCreateAPIView):
    serializer_class = SkillSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminOrCoach()]

    def get_queryset(self):
        user = self.request.user
        qs = Skill.objects.all().select_related('level', 'coach__user')
        level_id = self.request.query_params.get('level')
        if level_id:
            qs = qs.filter(level_id=level_id)

        if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
            mine = self.request.query_params.get('mine')
            if mine in ['true', '1']:
                return qs.filter(is_custom=False)
            return qs

        if user.role == 'COACH':
            coach_profile = getattr(user, 'coach_profile', None)
            if not coach_profile:
                return qs.none()
            all_param = self.request.query_params.get('all')
            if all_param in ['true', '1']:
                return qs.filter(Q(coach=coach_profile) | Q(coach__isnull=True))
            return qs.filter(coach=coach_profile)

        return qs.filter(coach__isnull=True)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'COACH':
            coach_profile = getattr(user, 'coach_profile', None)
            serializer.save(coach=coach_profile, is_custom=True)
        else:
            serializer.save(is_custom=False)


class SkillImportDefaultsView(APIView):
    """کپی کردن سرفصل‌های پایه در بانک ارزیابی اختصاصی مربی جهت شخصی‌سازی و استفاده در کلاس‌ها"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role != 'COACH':
            return Response({'detail': 'تنها مربیان مجاز به استفاده از این قابلیت هستند.'}, status=status.HTTP_403_FORBIDDEN)
        coach_profile = getattr(user, 'coach_profile', None)
        if not coach_profile:
            return Response({'detail': 'پروفایل مربی یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        system_skills = Skill.objects.filter(coach__isnull=True)
        created_count = 0
        for sys_sk in system_skills:
            if not Skill.objects.filter(coach=coach_profile, name=sys_sk.name).exists():
                Skill.objects.create(
                    name=sys_sk.name,
                    criteria_description=sys_sk.criteria_description,
                    level=sys_sk.level,
                    coach=coach_profile,
                    is_custom=True
                )
                created_count += 1

        coach_skills = Skill.objects.filter(coach=coach_profile).select_related('level')
        serializer = SkillSerializer(coach_skills, many=True)
        return Response({
            'message': f'{created_count} سرفصل به گزینه‌های شما اضافه شد.',
            'skills': serializer.data,
            'count': created_count,
        }, status=status.HTTP_200_OK)


class SkillDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SkillSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminOrCoach()]

    def get_queryset(self):
        user = self.request.user
        qs = Skill.objects.all().select_related('level', 'coach__user')
        if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
            return qs
        if user.role == 'COACH':
            coach_profile = getattr(user, 'coach_profile', None)
            if self.request.method in permissions.SAFE_METHODS:
                if coach_profile:
                    return qs.filter(Q(coach=coach_profile) | Q(coach__isnull=True))
                return qs.filter(coach__isnull=True)
            return qs.filter(coach=coach_profile) if coach_profile else qs.none()
        return qs.filter(coach__isnull=True)


class CourseListView(generics.ListCreateAPIView):
    queryset = Course.objects.all().prefetch_related('groups__schedules', 'groups__coach_assignments', 'coaches__user')
    serializer_class = CourseSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [IsAdminUserRole()]

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'FEMALE_ADMIN':
            if serializer.validated_data.get('gender') == 'MALE':
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'gender': 'مدیریت بانوان فقط مجاز به تعریف دوره‌های ویژه دختران / بانوان است.'})
            serializer.save(gender='FEMALE')
        else:
            serializer.save()

    def get_queryset(self):
        qs = Course.objects.all().prefetch_related('groups__schedules', 'groups__coach_assignments', 'coaches__user')
        user = getattr(self.request, 'user', None)
        if user and user.is_authenticated and user.role == 'FEMALE_ADMIN':
            qs = qs.filter(Q(gender='FEMALE') | Q(coaches__gender='FEMALE')).distinct()

        params = getattr(self.request, 'query_params', None)
        if params is None:
            params = getattr(self.request, 'GET', {})

        status_filter = params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        gender = params.get('gender')
        if gender and gender != 'ALL':
            qs = qs.filter(Q(gender=gender) | Q(gender='ALL') | Q(gender='') | Q(gender__isnull=True))

        age = params.get('age')
        if age:
            try:
                age_val = int(age)
                qs = qs.filter(
                    (Q(min_age__isnull=True) | Q(min_age__lte=age_val)) &
                    (Q(max_age__isnull=True) | Q(max_age__gte=age_val))
                )
            except (ValueError, TypeError):
                pass

        search = params.get('search')
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(pool_location__icontains=search) |
                Q(coaches__user__first_name__icontains=search) |
                Q(coaches__user__last_name__icontains=search)
            ).distinct()

        matched_only = params.get('matched_only')
        if matched_only in ['true', '1', 'True']:
            from apps.swimmers.views import get_accessible_swimmer_profile
            swimmer = None
            if self.request.user and self.request.user.is_authenticated:
                swimmer_id = params.get('swimmer_id')
                if not swimmer_id:
                    headers = getattr(self.request, 'headers', None)
                    if headers and hasattr(headers, 'get'):
                        swimmer_id = headers.get('X-Swimmer-Id')
                    if not swimmer_id and hasattr(self.request, 'META'):
                        swimmer_id = self.request.META.get('HTTP_X_SWIMMER_ID')
                try:
                    swimmer = get_accessible_swimmer_profile(self.request.user, swimmer_id)
                except Exception:
                    swimmer = getattr(self.request.user, 'swimmer_profile', None)
            if swimmer:
                if swimmer.gender:
                    qs = qs.filter(Q(gender=swimmer.gender) | Q(gender='ALL') | Q(gender='') | Q(gender__isnull=True))
                if swimmer.age is not None:
                    qs = qs.filter(
                        (Q(min_age__isnull=True) | Q(min_age__lte=swimmer.age)) &
                        (Q(max_age__isnull=True) | Q(max_age__gte=swimmer.age))
                    )

        return qs


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminUserRole()]

    def perform_update(self, serializer):
        user = self.request.user
        if user.role == 'FEMALE_ADMIN' and serializer.validated_data.get('gender') == 'MALE':
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'gender': 'تغییر جنسیت دوره به پسران / آقایان توسط مدیریت بانوان مجاز نیست.'})
        serializer.save()


class SwimmerGroupListView(generics.ListCreateAPIView):
    queryset = SwimmerGroup.objects.all().select_related('course', 'skill_level').prefetch_related('schedules', 'coach_assignments')
    serializer_class = SwimmerGroupSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        user = self.request.user
        qs = SwimmerGroup.objects.all().select_related('course', 'skill_level').prefetch_related('schedules', 'coach_assignments')
        if user.role == 'FEMALE_ADMIN':
            return qs.filter(Q(course__gender='FEMALE') | Q(coach_assignments__coach__gender='FEMALE')).distinct()
        if user.role == 'COACH':
            coach_profile = getattr(user, 'coach_profile', None)
            if coach_profile:
                return qs.filter(coach_assignments__coach=coach_profile).distinct()
            return qs.none()
        return qs


class SwimmerGroupDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SwimmerGroup.objects.all()
    serializer_class = SwimmerGroupSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        user = self.request.user
        qs = SwimmerGroup.objects.all().select_related('course', 'skill_level').prefetch_related('schedules', 'coach_assignments')
        if user.role == 'COACH':
            coach_profile = getattr(user, 'coach_profile', None)
            if coach_profile:
                return qs.filter(coach_assignments__coach=coach_profile).distinct()
            return qs.none()
        return qs


class EnrollmentRequestCreateView(generics.CreateAPIView):
    """ثبت درخواست آنلاین توسط کاربر مهمان یا شناگر"""
    queryset = EnrollmentRequest.objects.all()
    serializer_class = EnrollmentRequestSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = self.request.user
        swimmer = None
        if user and user.is_authenticated and getattr(user, 'role', '') == 'SWIMMER':
            from apps.swimmers.views import get_accessible_swimmer_profile
            swimmer_id = self.request.data.get('swimmer') or self.request.data.get('swimmer_id')
            if not swimmer_id:
                headers = getattr(self.request, 'headers', None)
                if headers and hasattr(headers, 'get'):
                    swimmer_id = headers.get('X-Swimmer-Id')
                if not swimmer_id and hasattr(self.request, 'META'):
                    swimmer_id = self.request.META.get('HTTP_X_SWIMMER_ID')
            try:
                if swimmer_id:
                    swimmer = get_accessible_swimmer_profile(user, swimmer_id)
                else:
                    swimmer = getattr(user, 'swimmer_profile', None)
            except Exception:
                swimmer = getattr(user, 'swimmer_profile', None)

        kwargs = {'swimmer': swimmer}
        if swimmer:
            if not serializer.validated_data.get('applicant_name'):
                kwargs['applicant_name'] = swimmer.full_name
            if not serializer.validated_data.get('applicant_phone'):
                kwargs['applicant_phone'] = swimmer.phone or (user.phone if user and user.is_authenticated else '')
            if not serializer.validated_data.get('applicant_national_id'):
                kwargs['applicant_national_id'] = swimmer.national_id or ''
        serializer.save(**kwargs)


class EnrollmentRequestListView(generics.ListAPIView):
    """مشاهده لیست درخواست‌های ثبت‌نام توسط مدیر، مدیریت بانوان و ناظر فنی"""
    queryset = EnrollmentRequest.objects.all().select_related('course', 'group', 'swimmer')
    serializer_class = EnrollmentRequestSerializer
    permission_classes = [IsAdminOrSupervisor]

    def get_queryset(self):
        user = self.request.user
        qs = EnrollmentRequest.objects.all().select_related('course', 'group', 'swimmer')
        if user and user.is_authenticated and user.role == 'FEMALE_ADMIN':
            qs = qs.filter(
                Q(swimmer__gender='FEMALE') |
                Q(course__gender='FEMALE') |
                Q(coach__gender='FEMALE')
            ).distinct()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class EnrollmentRequestReviewView(APIView):
    """
    بررسی، تأیید یا رد درخواست ثبت‌نام توسط مدیر با بررسی مجدد ظرفیت در تراکنش امن (Atomic Transaction).
    در صورت تأیید، پرونده شناگر (در صورت نیاز) و ثبت‌نام قطعی و صورتحساب صادر می‌شود.
    """
    permission_classes = [IsAdminUserRole]

    def post(self, request, pk):
        try:
            req = EnrollmentRequest.objects.select_related('group', 'course').get(pk=pk)
        except EnrollmentRequest.DoesNotExist:
            return Response({'detail': 'درخواست یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role == 'FEMALE_ADMIN':
            if req.swimmer and req.swimmer.gender != 'FEMALE':
                raise PermissionDenied('مدیریت بانوان فقط مجاز به بررسی درخواست‌های شناگران خانم است.')
            if req.course and req.course.gender == 'MALE':
                raise PermissionDenied('مدیریت بانوان فقط مجاز به بررسی دوره‌های بانوان است.')

        action = request.data.get('action') # 'APPROVE' or 'REJECT'
        rejection_reason = request.data.get('rejection_reason', '')

        if action == 'REJECT':
            req.status = EnrollmentRequest.Status.REJECTED
            req.rejection_reason = rejection_reason
            req.reviewed_by = request.user
            req.reviewed_at = timezone.now()
            req.save()
            return Response({'message': 'درخواست با موفقیت رد شد.', 'status': 'REJECTED'})

        elif action == 'APPROVE':
            with transaction.atomic():
                # Lock group row to prevent race conditions exceeding capacity (if group specified)
                group = None
                if req.group:
                    group = SwimmerGroup.objects.select_for_update().get(id=req.group.id)
                    if group.remaining_capacity <= 0:
                        req.status = EnrollmentRequest.Status.WAITLIST
                        req.save()
                        return Response({
                            'detail': 'ظرفیت این گروه تکمیل است. درخواست به فهرست انتظار منتقل شد.'
                        }, status=status.HTTP_400_BAD_REQUEST)

                # Ensure swimmer profile exists
                swimmer = req.swimmer
                if not swimmer:
                    names = req.applicant_name.split(maxsplit=1)
                    first_name = names[0]
                    last_name = names[1] if len(names) > 1 else '—'
                    default_level = group.skill_level if group else SkillLevel.objects.first()
                    swimmer = SwimmerProfile.objects.create(
                        first_name=first_name,
                        last_name=last_name,
                        gender='FEMALE' if request.user.role == 'FEMALE_ADMIN' or (req.course and req.course.gender == 'FEMALE') else 'MALE',
                        phone=req.applicant_phone,
                        national_id=req.applicant_national_id or '',
                        current_level=default_level
                    )
                    req.swimmer = swimmer

                course_max_inst = max(1, getattr(req.course, 'installments_count', 1) or 1)
                admin_inst = request.data.get('selected_installments') or request.data.get('installments_count')
                if admin_inst:
                    inst_count = max(1, min(int(admin_inst), course_max_inst))
                else:
                    inst_count = max(1, min(getattr(req, 'selected_installments', 1) or 1, course_max_inst))

                # Create or activate Enrollment (newly registered swimmer starts as بدون مربی if no coach assigned)
                enrollment, created = Enrollment.objects.get_or_create(
                    swimmer=swimmer,
                    course=req.course,
                    defaults={
                        'group': group,
                        'coach': req.coach,
                        'status': Enrollment.Status.ACTIVE,
                        'sessions_purchased': req.course.sessions_count,
                        'sessions_attended': 0,
                        'selected_installments': inst_count,
                    }
                )
                if not created and getattr(enrollment, 'selected_installments', None) != inst_count:
                    enrollment.selected_installments = inst_count
                    enrollment.save(update_fields=['selected_installments'])

                # Generate Invoice & Installments
                if not hasattr(enrollment, 'invoice'):
                    invoice = Invoice.objects.create(
                        invoice_number=Invoice.generate_invoice_number(),
                        swimmer=swimmer,
                        enrollment=enrollment,
                        total_amount=req.course.base_price,
                        issue_date=timezone.now().date(),
                        due_date=req.course.end_date
                    )
                    InvoiceItem.objects.create(
                        invoice=invoice,
                        description=f"شهریه {req.course.name}" + (f" - {group.name}" if group else ""),
                        unit_price=req.course.base_price,
                        quantity=1,
                        total_price=req.course.base_price
                    )
                    # Generate Installments based on swimmer's selected installments and custom amounts
                    total_amount = Decimal(str(req.course.base_price))

                    custom_amounts = request.data.get('installment_amounts') or getattr(req, 'installment_amounts', None) or []
                    valid_custom = False
                    parsed_amounts = []
                    if isinstance(custom_amounts, list) and len(custom_amounts) == inst_count and inst_count > 1:
                        try:
                            parsed_amounts = [Decimal(str(a)) for a in custom_amounts]
                            if all(a > 0 for a in parsed_amounts) and sum(parsed_amounts) == total_amount:
                                valid_custom = True
                        except Exception:
                            valid_custom = False

                    if inst_count <= 1:
                        Installment.objects.create(
                            invoice=invoice,
                            installment_number=1,
                            amount=total_amount,
                            due_date=req.course.start_date
                        )
                        enrollment.installment_amounts = [float(total_amount)]
                        enrollment.save(update_fields=['installment_amounts'])
                    elif valid_custom:
                        start_d = req.course.start_date
                        end_d = req.course.end_date
                        total_days = max(1, (end_d - start_d).days)
                        step_days = total_days / (inst_count - 1)
                        for i, inst_amount in enumerate(parsed_amounts, start=1):
                            if i == inst_count:
                                inst_due = end_d
                            else:
                                days_offset = int(round((i - 1) * step_days))
                                inst_due = start_d + datetime.timedelta(days=days_offset)
                            Installment.objects.create(
                                invoice=invoice,
                                installment_number=i,
                                amount=inst_amount,
                                due_date=inst_due
                            )
                        enrollment.installment_amounts = [float(a) for a in parsed_amounts]
                        enrollment.save(update_fields=['installment_amounts'])
                    else:
                        base_installment_amount = (total_amount / inst_count).quantize(Decimal('1.00'))
                        start_d = req.course.start_date
                        end_d = req.course.end_date
                        total_days = max(1, (end_d - start_d).days)
                        step_days = total_days / (inst_count - 1)

                        allocated_sum = Decimal('0.00')
                        stored_amounts = []
                        for i in range(1, inst_count + 1):
                            if i == inst_count:
                                inst_amount = total_amount - allocated_sum
                                inst_due = end_d
                            else:
                                inst_amount = base_installment_amount
                                allocated_sum += inst_amount
                                days_offset = int(round((i - 1) * step_days))
                                inst_due = start_d + datetime.timedelta(days=days_offset)

                            Installment.objects.create(
                                invoice=invoice,
                                installment_number=i,
                                amount=inst_amount,
                                due_date=inst_due
                            )
                            stored_amounts.append(float(inst_amount))
                        enrollment.installment_amounts = stored_amounts
                        enrollment.save(update_fields=['installment_amounts'])

                req.status = EnrollmentRequest.Status.APPROVED
                req.reviewed_by = request.user
                req.reviewed_at = timezone.now()
                req.save()

                # Audit log
                AuditLog.objects.create(
                    actor=request.user,
                    action=AuditLog.Action.ENROLLMENT_CREATE,
                    entity_type='Enrollment',
                    entity_id=str(enrollment.id),
                    details={'group': group.name if group else 'بدون گروه کلاسی', 'swimmer': swimmer.full_name}
                )

                return Response({
                    'message': 'ثبت‌نام با موفقیت تایید و قطعی گردید و صورتحساب صادر شد.',
                    'enrollment_id': enrollment.id
                })

        return Response({'detail': 'عملیات نامعتبر است.'}, status=status.HTTP_400_BAD_REQUEST)


class EnrollmentListView(generics.ListCreateAPIView):
    """مدیریت ثبت‌نام‌های قطعی"""
    queryset = Enrollment.objects.all().select_related('swimmer', 'course', 'group', 'coach')
    serializer_class = EnrollmentSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminUserRole()]

    def perform_create(self, serializer):
        if self.request.user.role == 'FEMALE_ADMIN':
            swimmer_obj = serializer.validated_data.get('swimmer')
            coach_obj = serializer.validated_data.get('coach')
            if swimmer_obj and swimmer_obj.gender != 'FEMALE':
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'swimmer': 'مدیریت بانوان فقط مجاز به ثبت‌نام شناگران دختر / خانم است.'})
            if coach_obj and coach_obj.gender != 'FEMALE':
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'coach': 'مدیریت بانوان فقط مجاز به انتخاب مربیان خانم است.'})
        enrollment = serializer.save()
        course = enrollment.course
        group = enrollment.group
        swimmer = enrollment.swimmer
        if course and swimmer and not hasattr(enrollment, 'invoice'):
            inst_count = max(1, getattr(enrollment, 'selected_installments', 1) or 1)
            course_max_inst = max(1, getattr(course, 'installments_count', 1) or 1)
            inst_count = min(inst_count, course_max_inst)

            invoice = Invoice.objects.create(
                invoice_number=Invoice.generate_invoice_number(),
                swimmer=swimmer,
                enrollment=enrollment,
                total_amount=course.base_price,
                issue_date=timezone.now().date(),
                due_date=course.end_date or timezone.now().date()
            )
            InvoiceItem.objects.create(
                invoice=invoice,
                description=f"شهریه {course.name}" + (f" - {group.name}" if group else ""),
                unit_price=course.base_price,
                quantity=1,
                total_price=course.base_price
            )
            total_amount = Decimal(str(course.base_price))
            custom_amounts = getattr(enrollment, 'installment_amounts', None) or self.request.data.get('installment_amounts') or []
            valid_custom = False
            parsed_amounts = []
            if isinstance(custom_amounts, list) and len(custom_amounts) == inst_count and inst_count > 1:
                try:
                    parsed_amounts = [Decimal(str(a)) for a in custom_amounts]
                    if all(a > 0 for a in parsed_amounts) and sum(parsed_amounts) == total_amount:
                        valid_custom = True
                except Exception:
                    valid_custom = False

            if inst_count <= 1:
                Installment.objects.create(
                    invoice=invoice,
                    installment_number=1,
                    amount=total_amount,
                    due_date=course.start_date or timezone.now().date()
                )
                if not getattr(enrollment, 'installment_amounts', None):
                    enrollment.installment_amounts = [float(total_amount)]
                    enrollment.save(update_fields=['installment_amounts'])
            elif valid_custom:
                start_d = course.start_date or timezone.now().date()
                end_d = course.end_date or (start_d + datetime.timedelta(days=60))
                total_days = max(1, (end_d - start_d).days)
                step_days = total_days / (inst_count - 1)
                for i, inst_amount in enumerate(parsed_amounts, start=1):
                    if i == inst_count:
                        inst_due = end_d
                    else:
                        days_offset = int(round((i - 1) * step_days))
                        inst_due = start_d + datetime.timedelta(days=days_offset)
                    Installment.objects.create(
                        invoice=invoice,
                        installment_number=i,
                        amount=inst_amount,
                        due_date=inst_due
                    )
                if not getattr(enrollment, 'installment_amounts', None):
                    enrollment.installment_amounts = [float(a) for a in parsed_amounts]
                    enrollment.save(update_fields=['installment_amounts'])
            else:
                base_installment_amount = (total_amount / inst_count).quantize(Decimal('1.00'))
                start_d = course.start_date or timezone.now().date()
                end_d = course.end_date or (start_d + datetime.timedelta(days=60))
                total_days = max(1, (end_d - start_d).days)
                step_days = total_days / (inst_count - 1)
                allocated_sum = Decimal('0.00')
                stored_amounts = []
                for i in range(1, inst_count + 1):
                    if i == inst_count:
                        inst_amount = total_amount - allocated_sum
                        inst_due = end_d
                    else:
                        inst_amount = base_installment_amount
                        allocated_sum += inst_amount
                        days_offset = int(round((i - 1) * step_days))
                        inst_due = start_d + datetime.timedelta(days=days_offset)
                    Installment.objects.create(
                        invoice=invoice,
                        installment_number=i,
                        amount=inst_amount,
                        due_date=inst_due
                    )
                    stored_amounts.append(float(inst_amount))
                if not getattr(enrollment, 'installment_amounts', None):
                    enrollment.installment_amounts = stored_amounts
                    enrollment.save(update_fields=['installment_amounts'])

    def get_queryset(self):
        user = self.request.user
        qs = Enrollment.objects.all().select_related('swimmer', 'course', 'group', 'coach')
        if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
            swimmer_id = self.request.query_params.get('swimmer_id')
            if swimmer_id:
                qs = qs.filter(swimmer_id=swimmer_id)
            group_id = self.request.query_params.get('group_id')
            if group_id:
                qs = qs.filter(group_id=group_id)
            course_id = self.request.query_params.get('course_id')
            if course_id:
                qs = qs.filter(course_id=course_id)
            coach_id = self.request.query_params.get('coach_id')
            if coach_id:
                qs = qs.filter(coach_id=coach_id)
            return qs
        elif user.role == 'FEMALE_ADMIN':
            qs = qs.filter(swimmer__gender='FEMALE')
            swimmer_id = self.request.query_params.get('swimmer_id')
            if swimmer_id:
                qs = qs.filter(swimmer_id=swimmer_id)
            group_id = self.request.query_params.get('group_id')
            if group_id:
                qs = qs.filter(group_id=group_id)
            course_id = self.request.query_params.get('course_id')
            if course_id:
                qs = qs.filter(course_id=course_id)
            coach_id = self.request.query_params.get('coach_id')
            if coach_id:
                qs = qs.filter(coach_id=coach_id)
            return qs
        elif user.role == 'COACH':
            coach_profile = getattr(user, 'coach_profile', None)
            if coach_profile:
                qs = qs.filter(
                    Q(coach=coach_profile) |
                    Q(group__coach_assignments__coach=coach_profile)
                ).distinct()
                group_id = self.request.query_params.get('group_id')
                if group_id:
                    qs = qs.filter(group_id=group_id)
                return qs
            return qs.none()
        elif user.role == 'SWIMMER':
            from apps.swimmers.utils import get_accessible_swimmer_ids
            ids = get_accessible_swimmer_ids(user, self.request)
            return qs.filter(swimmer_id__in=ids)
        return qs.none()


class EnrollmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """مشاهده، ویرایش و حذف ثبت‌نام مشخص"""
    queryset = Enrollment.objects.all().select_related('swimmer', 'course', 'group', 'coach')
    serializer_class = EnrollmentSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        user = self.request.user
        qs = Enrollment.objects.all().select_related('swimmer', 'course', 'group', 'coach')
        if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
            return qs
        elif user.role == 'FEMALE_ADMIN':
            return qs.filter(swimmer__gender='FEMALE')
        elif user.role == 'COACH':
            coach_profile = getattr(user, 'coach_profile', None)
            if coach_profile:
                return qs.filter(
                    Q(coach=coach_profile) |
                    Q(group__coach_assignments__coach=coach_profile)
                ).distinct()
            return qs.none()
        elif user.role == 'SWIMMER':
            from apps.swimmers.utils import get_accessible_swimmer_ids
            ids = get_accessible_swimmer_ids(user, self.request)
            return qs.filter(swimmer_id__in=ids)
        return qs.none()


class EnrollmentAssignCoachView(APIView):
    """
    تخصیص یا تغییر مربی، کلاس یا دوره ثبت‌نام شناگر توسط مدیر
    """
    permission_classes = [IsAdminUserRole]

    def post(self, request, pk):
        try:
            enrollment = Enrollment.objects.select_related('course', 'group', 'swimmer').get(pk=pk)
        except Enrollment.DoesNotExist:
            return Response({'detail': 'ثبت‌نام یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role == 'FEMALE_ADMIN':
            if enrollment.swimmer and enrollment.swimmer.gender != 'FEMALE':
                raise PermissionDenied('مدیریت بانوان فقط مجاز به ویرایش کلاس شناگران خانم است.')

        course_id = request.data.get('course_id')
        group_id = request.data.get('group_id')
        coach_id = request.data.get('coach_id')
        reset_sessions = request.data.get('reset_sessions', False)

        old_course_name = enrollment.course.name if enrollment.course else ''
        old_coach_name = enrollment.coach.full_name if enrollment.coach else 'تعیین‌نشده'
        old_group_name = enrollment.group.name if enrollment.group else ''

        # 1. Handle course change if provided
        if course_id and (not enrollment.course or str(enrollment.course.id) != str(course_id)):
            try:
                new_course = Course.objects.get(pk=course_id)
            except Course.DoesNotExist:
                return Response({'detail': 'دوره آموزشی مورد نظر یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

            # Check if swimmer is already enrolled in this new course (unique constraint)
            already_enrolled = Enrollment.objects.filter(
                swimmer=enrollment.swimmer,
                course=new_course
            ).exclude(pk=enrollment.pk).exists()
            if already_enrolled:
                return Response({
                    'detail': f'شناگر «{enrollment.swimmer.full_name}» در حال حاضر در دوره «{new_course.name}» ثبت‌نام قطعی دارد.'
                }, status=status.HTTP_400_BAD_REQUEST)

            enrollment.course = new_course
            enrollment.sessions_purchased = new_course.sessions_count
            if reset_sessions:
                enrollment.sessions_attended = 0

            # If current group does not belong to new course, reset it
            if enrollment.group and enrollment.group.course_id != new_course.id:
                enrollment.group = None

        # 2. Handle group change if provided
        if group_id:
            try:
                group = SwimmerGroup.objects.get(pk=group_id)
                enrollment.group = group
                if not enrollment.course or enrollment.course_id != group.course_id:
                    enrollment.course = group.course
                # If coach_id was not explicitly specified, adopt group's primary coach
                if coach_id is None and not enrollment.coach:
                    primary_gc = group.coach_assignments.filter(is_primary=True).first()
                    if primary_gc:
                        enrollment.coach = primary_gc.coach
            except SwimmerGroup.DoesNotExist:
                return Response({'detail': 'گروه/کلاس مورد نظر یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        # 3. Handle coach change if provided
        if coach_id is not None:
            if coach_id:
                from apps.coaches.models import CoachProfile
                try:
                    coach = CoachProfile.objects.get(pk=coach_id)
                except CoachProfile.DoesNotExist:
                    return Response({'detail': 'مربی مورد نظر یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

                if request.user.role == 'FEMALE_ADMIN' and coach.gender != 'FEMALE':
                    return Response({'detail': 'مدیریت بانوان فقط مجاز به تخصیص مربیان خانم است.'}, status=status.HTTP_400_BAD_REQUEST)

                enrollment.coach = coach
                if enrollment.course and not enrollment.course.coaches.filter(id=coach.id).exists():
                    enrollment.course.coaches.add(coach)

                # Ensure enrollment.group matches this coach if group wasn't explicitly set or belongs to another coach
                if enrollment.course and not group_id:
                    target_group = SwimmerGroup.objects.filter(
                        course=enrollment.course,
                        coach_assignments__coach=coach
                    ).first()
                    if not target_group:
                        target_group, _ = SwimmerGroup.objects.get_or_create(
                            course=enrollment.course,
                            name=f"کلاس مربی {coach.full_name}",
                            defaults={
                                'skill_level': SkillLevel.objects.first(),
                                'capacity': 15,
                                'pool_location': enrollment.course.pool_location or 'استخر شهید رئیسی',
                                'status': SwimmerGroup.Status.OPEN
                            }
                        )
                        GroupCoach.objects.get_or_create(
                            group=target_group,
                            coach=coach,
                            defaults={'is_primary': True, 'assigned_from': enrollment.course.start_date}
                        )
                    enrollment.group = target_group
            else:
                enrollment.coach = None
                if not group_id:
                    enrollment.group = None

        enrollment.save()

        AuditLog.objects.create(
            actor=request.user,
            action=AuditLog.Action.ENROLLMENT_CREATE,
            entity_type='Enrollment',
            entity_id=str(enrollment.id),
            details={
                'swimmer': enrollment.swimmer.full_name,
                'course': enrollment.course.name if enrollment.course else '',
                'coach': enrollment.coach.full_name if enrollment.coach else 'تعیین‌نشده',
                'group': enrollment.group.name if enrollment.group else '',
                'old_course': old_course_name,
                'old_coach': old_coach_name,
                'old_group': old_group_name,
            }
        )

        serializer = EnrollmentSerializer(enrollment, context={'request': request})
        return Response(serializer.data)


class GroupCoachListCreateView(generics.ListCreateAPIView):
    """مدیریت و ثبت تخصیص مربیان به گروه‌های آموزشی توسط مدیر"""
    queryset = GroupCoach.objects.all().select_related('group', 'coach__user')
    serializer_class = GroupCoachSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [IsAdminOrSupervisor()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        qs = GroupCoach.objects.all().select_related('group', 'coach__user')
        coach_id = self.request.query_params.get('coach_id')
        if coach_id:
            qs = qs.filter(coach_id=coach_id)
        group_id = self.request.query_params.get('group_id')
        if group_id:
            qs = qs.filter(group_id=group_id)
        return qs

    def perform_create(self, serializer):
        coach = serializer.validated_data.get('coach')
        group = serializer.validated_data.get('group')
        ignore_conflict = self.request.data.get('ignore_conflict', False)

        if self.request.user.role == 'FEMALE_ADMIN':
            if coach and coach.gender != 'FEMALE':
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'coach': 'مدیریت بانوان فقط مجاز به تخصیص مربیان خانم است.'})

        if coach and group and not ignore_conflict:
            # Check for schedule conflicts with existing active assignments for this coach
            existing_assignments = GroupCoach.objects.filter(coach=coach).exclude(group=group)
            group_schedules = group.schedules.all()
            for assign in existing_assignments:
                for ex_sched in assign.group.schedules.all():
                    for new_sched in group_schedules:
                        if ex_sched.weekday == new_sched.weekday:
                            # check time overlap: (start1 < end2) and (end1 > start2)
                            if (new_sched.start_time < ex_sched.end_time and new_sched.end_time > ex_sched.start_time):
                                from rest_framework.exceptions import ValidationError
                                raise ValidationError({
                                    'conflict': f"تداخل زمانی با گروه '{assign.group.name}' در روز {new_sched.get_weekday_display()} (ساعت {ex_sched.start_time.strftime('%H:%M')} تا {ex_sched.end_time.strftime('%H:%M')}) وجود دارد."
                                })
        serializer.save()


class GroupCoachDetailView(generics.RetrieveUpdateDestroyAPIView):
    """مشاهده، ویرایش و حذف تخصیص مربی به گروه آموزشی"""
    queryset = GroupCoach.objects.all().select_related('group', 'coach__user')
    serializer_class = GroupCoachSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [IsAdminOrSupervisor()]
        return [IsAdminUserRole()]


class CourseFinancesView(APIView):
    """
    دریافت تجمیعی و موشکافانه تمامی داده‌های مالی مربوط به یک دوره اختصاصی:
    ۱. بخش شناگران: شهریه مصوب، فاکتورها، واریزی‌ها، اقساط معوق، فیش‌های واریزی کارت‌به‌کارت
    ۲. بخش مربیان: برآورد دستمزد کادر دوره بر اساس مدل‌های ساعتی/درصدی/ثابت، فیش‌های حقوقی و واریزی‌های انجام‌شده
    """
    permission_classes = [IsAdminOrSupervisor]

    def get(self, request, pk):
        course = generics.get_object_or_404(
            Course.objects.prefetch_related('coaches__user', 'groups__coach_assignments'),
            pk=pk
        )

        # -------------------------------------------------------------
        # 1. Swimmers Financials (امور مالی شناگران)
        # -------------------------------------------------------------
        invoices_qs = Invoice.objects.filter(
            enrollment__course=course
        ).select_related(
            'swimmer', 'enrollment', 'enrollment__coach', 'enrollment__group'
        ).prefetch_related(
            'items', 'installments', 'adjustments', 'allocations__payment'
        ).order_by('-issue_date', '-created_at')

        total_swimmers = course.enrollments.count()
        total_invoiced = sum(inv.total_amount for inv in invoices_qs) or Decimal('0.00')
        total_paid = sum(inv.total_paid for inv in invoices_qs) or Decimal('0.00')
        total_remaining = sum(inv.remaining_balance for inv in invoices_qs) or Decimal('0.00')
        total_discount = sum(inv.total_discount for inv in invoices_qs) or Decimal('0.00')
        total_expected_tuition = Decimal(str(course.base_price or 0)) * total_swimmers

        collection_rate = 0
        if total_invoiced > 0:
            collection_rate = min(100, round(float(total_paid / total_invoiced) * 100))
        elif total_expected_tuition > 0:
            collection_rate = min(100, round(float(total_paid / total_expected_tuition) * 100))

        paid_count = sum(1 for inv in invoices_qs if inv.status == Invoice.Status.PAID)
        partially_paid_count = sum(1 for inv in invoices_qs if inv.status == Invoice.Status.PARTIALLY_PAID)
        unpaid_count = sum(1 for inv in invoices_qs if inv.status in [Invoice.Status.ISSUED, Invoice.Status.DRAFT])
        cancelled_count = sum(1 for inv in invoices_qs if inv.status == Invoice.Status.CANCELLED)

        # اقساط مرتبط با این دوره
        installments_qs = Installment.objects.filter(
            invoice__enrollment__course=course
        ).select_related('invoice__swimmer', 'invoice').order_by('due_date', 'installment_number')
        
        today_date = timezone.now().date()
        overdue_installments = [
            inst for inst in installments_qs
            if inst.status in ['UNPAID', 'PARTIAL', 'OVERDUE'] and inst.due_date < today_date
        ]

        # واریزی‌ها و تراکنش‌های شناگران دوره
        payments_qs = Payment.objects.filter(
            Q(allocations__invoice__enrollment__course=course) |
            Q(swimmer__enrollments__course=course)
        ).distinct().select_related('swimmer').prefetch_related('allocations').order_by('-paid_at')

        # فیش‌های واریزی کارت‌به‌کارت ارسالی شناگران برای این دوره
        receipts_qs = PaymentReceipt.objects.filter(
            Q(enrollment__course=course) |
            Q(invoice__enrollment__course=course)
        ).distinct().select_related('swimmer', 'enrollment', 'invoice').order_by('-created_at')

        # -------------------------------------------------------------
        # 2. Coaches Financials (امور مالی و حقوق مربیان دوره)
        # -------------------------------------------------------------
        coaches_list = []
        total_estimated_coach_comp = Decimal('0.00')
        total_coach_paid = Decimal('0.00')

        sessions_count = course.sessions_count or 12
        duration_hours = Decimal('1.5')  # پیش‌فرض ۱.۵ ساعت
        if course.start_time and course.end_time:
            t1 = datetime.datetime.combine(today_date, course.start_time)
            t2 = datetime.datetime.combine(today_date, course.end_time)
            secs = (t2 - t1).total_seconds()
            if secs > 0:
                duration_hours = Decimal(str(round(secs / 3600.0, 2)))

        course_coaches = course.coaches.all()
        all_coach_payments_set = set()

        for coach in course_coaches:
            swimmer_cnt = course.enrollments.filter(coach=coach).count()
            c_type = coach.employment_type
            comp = Decimal('0.00')
            comp_formula = ''

            if c_type == CoachProfile.EmploymentType.HOURLY:
                rate = coach.hourly_rate or Decimal('0.00')
                total_hours = duration_hours * sessions_count
                comp = (total_hours * rate).quantize(Decimal('0.01'))
                comp_formula = f"{sessions_count} جلسه × {duration_hours} ساعت × {int(rate):,} تومان (نرخ ساعتی)"
            elif c_type == CoachProfile.EmploymentType.PERCENTAGE:
                pct = coach.revenue_percentage or Decimal('0.00')
                course_swimmers_rev = Decimal(str(course.base_price or 0)) * swimmer_cnt
                comp = (course_swimmers_rev * (pct / Decimal('100.00'))).quantize(Decimal('0.01'))
                comp_formula = f"{pct}% از شهریه {swimmer_cnt} شاگرد ({int(course_swimmers_rev):,} تومان)"
            elif c_type == CoachProfile.EmploymentType.FIXED:
                comp = (coach.fixed_monthly_salary or Decimal('0.00')).quantize(Decimal('0.01'))
                comp_formula = f"حقوق ثابت ماهانه ({int(comp):,} تومان)"
            else:
                comp = Decimal('0.00')
                comp_formula = 'حق‌الزحمه توافقی'

            total_estimated_coach_comp += comp

            # فیش‌های حقوقی و پرداخت‌ها
            payrolls = CoachPayroll.objects.filter(coach=coach).order_by('-period_start')
            coach_payments = CoachPaymentRecord.objects.filter(coach=coach).select_related('payroll').order_by('-payment_date')

            # یافتن فیش حقوقی منطبق با بازه زمانی دوره
            matching_payroll = None
            if course.start_date and course.end_date:
                matching_payroll = payrolls.filter(
                    period_start__lte=course.end_date,
                    period_end__gte=course.start_date
                ).first()
            if not matching_payroll:
                matching_payroll = payrolls.first()

            coach_paid_for_course = Decimal('0.00')
            if matching_payroll:
                coach_paid_for_course = matching_payroll.total_paid
            elif coach_payments.exists():
                coach_paid_for_course = sum((p.amount for p in coach_payments if not p.is_reversal), Decimal('0.00'))

            total_coach_paid += coach_paid_for_course

            for cp in coach_payments:
                all_coach_payments_set.add(cp)

            avatar_url = None
            if coach.user and getattr(coach.user, 'avatar', None):
                avatar_url = request.build_absolute_uri(coach.user.avatar.url)

            # Class name
            group = course.groups.filter(coach_assignments__coach=coach).first()
            class_name = group.name if group else f"کلاس مربی {coach.full_name}"

            settlement_status = (
                'PAID' if coach_paid_for_course >= comp and comp > 0
                else ('PARTIAL' if coach_paid_for_course > 0 else 'UNPAID')
            )

            coaches_list.append({
                'id': coach.id,
                'full_name': coach.full_name,
                'avatar': avatar_url,
                'personnel_id': coach.personnel_id or f"EMP-{coach.id}",
                'employment_type': coach.employment_type,
                'employment_type_display': coach.get_employment_type_display(),
                'hourly_rate': str(coach.hourly_rate),
                'fixed_monthly_salary': str(coach.fixed_monthly_salary),
                'revenue_percentage': str(coach.revenue_percentage),
                'card_number': coach.card_number,
                'shaba_number': coach.shaba_number,
                'class_name': class_name,
                'swimmers_count': swimmer_cnt,
                'calculated_compensation': str(comp),
                'compensation_formula': comp_formula,
                'paid_amount': str(coach_paid_for_course),
                'remaining_balance': str(max(Decimal('0.00'), comp - coach_paid_for_course)),
                'settlement_status': settlement_status,
                'latest_payroll': CoachPayrollSerializer(matching_payroll, context={'request': request}).data if matching_payroll else None,
                'payrolls_count': payrolls.count(),
            })

        all_coach_payments = sorted(list(all_coach_payments_set), key=lambda x: x.payment_date or today_date, reverse=True)

        return Response({
            'course': {
                'id': course.id,
                'name': course.name,
                'base_price': str(course.base_price or 0),
                'sessions_count': sessions_count,
                'installments_count': course.installments_count or 1,
                'start_date': course.start_date,
                'end_date': course.end_date,
                'pool_location': course.pool_location or 'استخر اصلی',
                'card_number': course.card_number,
                'card_holder': course.card_holder,
            },
            'swimmers_finance': {
                'summary': {
                    'total_swimmers': total_swimmers,
                    'total_expected_tuition': str(total_expected_tuition),
                    'total_invoiced': str(total_invoiced),
                    'total_paid': str(total_paid),
                    'total_remaining': str(total_remaining),
                    'total_discount': str(total_discount),
                    'collection_rate': collection_rate,
                    'paid_count': paid_count,
                    'partially_paid_count': partially_paid_count,
                    'unpaid_count': unpaid_count,
                    'cancelled_count': cancelled_count,
                    'overdue_installments_count': len(overdue_installments),
                    'pending_receipts_count': receipts_qs.filter(status='PENDING').count(),
                },
                'invoices': InvoiceSerializer(invoices_qs, many=True, context={'request': request}).data,
                'installments': InstallmentSerializer(installments_qs, many=True, context={'request': request}).data,
                'payments': PaymentSerializer(payments_qs, many=True, context={'request': request}).data,
                'receipts': PaymentReceiptSerializer(receipts_qs, many=True, context={'request': request}).data,
            },
            'coaches_finance': {
                'summary': {
                    'total_coaches': course_coaches.count(),
                    'total_estimated_compensation': str(total_estimated_coach_comp),
                    'total_paid_to_coaches': str(total_coach_paid),
                    'total_remaining_payable': str(max(Decimal('0.00'), total_estimated_coach_comp - total_coach_paid)),
                    'settlement_rate': min(100, round(float(total_coach_paid / total_estimated_coach_comp) * 100)) if total_estimated_coach_comp > 0 else 100,
                },
                'coaches': coaches_list,
                'payments': CoachPaymentRecordSerializer(all_coach_payments, many=True, context={'request': request}).data,
            }
        })


class CourseCoachPaymentQuickRecordView(APIView):
    """
    ثبت سریع واریز وجه حقوق یا دستمزد به مربی در چارچوب یک دوره آموزشی
    """
    permission_classes = [IsAdminUserRole]

    def post(self, request, pk):
        course = generics.get_object_or_404(Course, pk=pk)
        coach_id = request.data.get('coach_id')
        amount_raw = request.data.get('amount')
        payment_date_str = request.data.get('payment_date') or timezone.now().date().isoformat()
        payment_method = request.data.get('payment_method', CoachPaymentRecord.PaymentMethod.BANK_TRANSFER)
        reference_number = request.data.get('reference_number', '')
        description = request.data.get('description', '')
        receipt_document = request.FILES.get('receipt_document') or request.FILES.get('receipt')

        if not coach_id or not amount_raw:
            return Response({'detail': 'شناسه مربی و مبلغ واریزی الزامی هستند.'}, status=status.HTTP_400_BAD_REQUEST)

        coach = generics.get_object_or_404(CoachProfile, pk=coach_id)

        try:
            amount = Decimal(str(amount_raw))
            if amount <= Decimal('0.00'):
                raise ValueError
        except Exception:
            return Response({'detail': 'مبلغ واریزی نامعتبر است.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            p_date = datetime.date.fromisoformat(str(payment_date_str))
        except ValueError:
            p_date = timezone.now().date()

        with transaction.atomic():
            payroll = CoachPayroll.objects.filter(
                coach=coach,
                period_start__lte=course.end_date,
                period_end__gte=course.start_date,
                approval_status=CoachPayroll.ApprovalStatus.APPROVED
            ).first()

            if not payroll:
                candidate = CoachPayroll.objects.filter(
                    coach=coach,
                    period_start__lte=course.end_date,
                    period_end__gte=course.start_date
                ).first()
                if candidate:
                    payroll = PayrollService.approve_payroll(candidate, approved_by=request.user)
                else:
                    payroll = PayrollService.calculate_monthly_payroll(
                        coach=coach,
                        period_start=course.start_date,
                        period_end=course.end_date,
                        period_label=f"حقوق دوره {course.name}",
                        created_by=request.user
                    )
                    payroll = PayrollService.approve_payroll(payroll, approved_by=request.user)

            payment = PayrollService.register_payment(
                payroll=payroll,
                amount=amount,
                payment_date=p_date,
                payment_method=payment_method,
                reference_number=reference_number,
                description=description or f"واریز حقوق مربی بابت دوره {course.name}",
                receipt_document=receipt_document,
                registered_by=request.user
            )

            AuditLog.objects.create(
                actor=request.user,
                action=AuditLog.Action.PAYMENT_RECORD,
                entity_type='CoachPaymentRecord',
                entity_id=str(payment.id),
                details={
                    'coach': coach.full_name,
                    'course': course.name,
                    'amount': str(amount),
                    'ref': reference_number
                }
            )

        serializer = CoachPaymentRecordSerializer(payment, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
