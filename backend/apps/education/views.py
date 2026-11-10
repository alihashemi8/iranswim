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
from apps.coaches.models import CoachProfile
from apps.swimmers.models import SwimmerProfile
from apps.finance.models import Invoice, InvoiceItem, Installment
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
            mine = self.request.query_params.get('mine')
            if mine in ['true', '1']:
                return qs.filter(coach=coach_profile) if coach_profile else qs.none()
            if coach_profile:
                return qs.filter(Q(coach=coach_profile) | Q(coach__isnull=True))
            return qs.filter(coach__isnull=True)

        return qs.filter(coach__isnull=True)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'COACH':
            coach_profile = getattr(user, 'coach_profile', None)
            serializer.save(coach=coach_profile, is_custom=True)
        else:
            serializer.save(is_custom=False)


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

    def get_queryset(self):
        qs = Course.objects.all().prefetch_related('groups__schedules', 'groups__coach_assignments', 'coaches__user')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminUserRole()]


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
        if user and user.is_authenticated:
            swimmer = getattr(user, 'swimmer_profile', None)
        serializer.save(swimmer=swimmer)


class EnrollmentRequestListView(generics.ListAPIView):
    """مشاهده لیست درخواست‌های ثبت‌نام توسط مدیر و ناظر فنی"""
    queryset = EnrollmentRequest.objects.all().select_related('course', 'group', 'swimmer')
    serializer_class = EnrollmentRequestSerializer
    permission_classes = [IsAdminOrSupervisor]

    def get_queryset(self):
        qs = EnrollmentRequest.objects.all().select_related('course', 'group', 'swimmer')
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
                    # Generate Installments based on swimmer's selected installments (up to course max)
                    total_amount = Decimal(str(req.course.base_price))

                    if inst_count <= 1:
                        Installment.objects.create(
                            invoice=invoice,
                            installment_number=1,
                            amount=total_amount,
                            due_date=req.course.start_date
                        )
                    else:
                        base_installment_amount = (total_amount / inst_count).quantize(Decimal('1.00'))
                        start_d = req.course.start_date
                        end_d = req.course.end_date
                        total_days = max(1, (end_d - start_d).days)
                        step_days = total_days / (inst_count - 1)

                        allocated_sum = Decimal('0.00')
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
                    details={'group': group.name, 'swimmer': swimmer.full_name}
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
            if inst_count <= 1:
                Installment.objects.create(
                    invoice=invoice,
                    installment_number=1,
                    amount=total_amount,
                    due_date=course.start_date or timezone.now().date()
                )
            else:
                base_installment_amount = (total_amount / inst_count).quantize(Decimal('1.00'))
                start_d = course.start_date or timezone.now().date()
                end_d = course.end_date or (start_d + datetime.timedelta(days=60))
                total_days = max(1, (end_d - start_d).days)
                step_days = total_days / (inst_count - 1)
                allocated_sum = Decimal('0.00')
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
