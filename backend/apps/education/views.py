import datetime
from decimal import Decimal
from django.db import transaction
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
from apps.accounts.permissions import IsAdminUserRole, IsAdminOrSupervisor
from apps.swimmers.models import SwimmerProfile
from apps.finance.models import Invoice, InvoiceItem, Installment
from apps.supervisor.models import AuditLog


class SkillLevelListView(generics.ListCreateAPIView):
    queryset = SkillLevel.objects.all().prefetch_related('skills')
    serializer_class = SkillLevelSerializer
    permission_classes = [permissions.AllowAny]


class CourseListView(generics.ListCreateAPIView):
    queryset = Course.objects.all().prefetch_related('groups__schedules', 'groups__coach_assignments', 'coaches__user')
    serializer_class = CourseSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Course.objects.all().prefetch_related('groups__schedules', 'groups__coach_assignments', 'coaches__user')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]


class SwimmerGroupListView(generics.ListCreateAPIView):
    queryset = SwimmerGroup.objects.all().select_related('course', 'skill_level').prefetch_related('schedules', 'coach_assignments')
    serializer_class = SwimmerGroupSerializer
    permission_classes = [permissions.IsAuthenticated]

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
    permission_classes = [permissions.IsAuthenticated]


class EnrollmentRequestCreateView(generics.CreateAPIView):
    """ثبت درخواست آنلاین توسط کاربر مهمان یا شناگر"""
    queryset = EnrollmentRequest.objects.all()
    serializer_class = EnrollmentRequestSerializer
    permission_classes = [permissions.AllowAny]


class EnrollmentRequestListView(generics.ListAPIView):
    """مشاهده لیست درخواست‌های ثبت‌نام توسط مدیر"""
    queryset = EnrollmentRequest.objects.all().select_related('course', 'group', 'swimmer')
    serializer_class = EnrollmentRequestSerializer
    permission_classes = [IsAdminUserRole]

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
                # Lock group row to prevent race conditions exceeding capacity
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
                    swimmer = SwimmerProfile.objects.create(
                        first_name=first_name,
                        last_name=last_name,
                        phone=req.applicant_phone,
                        national_id=req.applicant_national_id or '',
                        current_level=group.skill_level
                    )
                    req.swimmer = swimmer

                # Create or activate Enrollment
                enrollment, created = Enrollment.objects.get_or_create(
                    swimmer=swimmer,
                    course=req.course,
                    group=group,
                    defaults={
                        'status': Enrollment.Status.ACTIVE,
                        'sessions_purchased': req.course.sessions_count,
                        'sessions_attended': 0
                    }
                )

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
                        description=f"شهریه {req.course.name} - {group.name}",
                        unit_price=req.course.base_price,
                        quantity=1,
                        total_price=req.course.base_price
                    )
                    # Generate Installments based on course.installments_count
                    inst_count = max(1, getattr(req.course, 'installments_count', 1) or 1)
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
    permission_classes = [permissions.IsAuthenticated]

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
                return qs.filter(coach=coach_profile).distinct()
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
    permission_classes = [permissions.IsAuthenticated]


class EnrollmentAssignCoachView(APIView):
    """
    تخصیص یا تغییر مربی یک ثبت‌نام با انتساب مستقیم به کلاس آن مربی
    """
    permission_classes = [IsAdminUserRole]

    def post(self, request, pk):
        try:
            enrollment = Enrollment.objects.select_related('course', 'group', 'swimmer').get(pk=pk)
        except Enrollment.DoesNotExist:
            return Response({'detail': 'ثبت‌نام یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        coach_id = request.data.get('coach_id')
        if coach_id:
            from apps.coaches.models import CoachProfile
            try:
                coach = CoachProfile.objects.get(pk=coach_id)
            except CoachProfile.DoesNotExist:
                return Response({'detail': 'مربی مورد نظر یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

            enrollment.coach = coach
            # Find or assign group for this coach in this course
            if enrollment.course:
                target_group = SwimmerGroup.objects.filter(
                    course=enrollment.course,
                    coach_assignments__coach=coach
                ).first()
                if not target_group:
                    # Create group if doesn't exist
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
                'group': enrollment.group.name if enrollment.group else ''
            }
        )

        serializer = EnrollmentSerializer(enrollment, context={'request': request})
        return Response(serializer.data)


class GroupCoachListCreateView(generics.ListCreateAPIView):
    """مدیریت و ثبت تخصیص مربیان به گروه‌های آموزشی توسط مدیر"""
    queryset = GroupCoach.objects.all().select_related('group', 'coach__user')
    serializer_class = GroupCoachSerializer
    permission_classes = [IsAdminUserRole]

    def get_queryset(self):
        qs = GroupCoach.objects.all().select_related('group', 'coach__user')
        coach_id = self.request.query_params.get('coach_id')
        if coach_id:
            qs = qs.filter(coach_id=coach_id)
        group_id = self.request.query_params.get('group_id')
        if group_id:
            qs = qs.filter(group_id=group_id)
        return qs
