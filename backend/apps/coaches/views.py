import datetime
from django.utils import timezone
from django.db.models import Q, Count, Avg
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import CoachProfile, WorkoutPlan
from .serializers import (
    CoachProfileSerializer, CoachPublicSerializer, WorkoutPlanSerializer,
    CoachClassListSerializer, CoachSwimmerDetailSerializer
)
from apps.accounts.permissions import IsAdminOrCoach, IsAdminUserRole
from apps.scheduling.models import ClassSession
from apps.education.models import SwimmerGroup, Enrollment, Skill, SkillLevel
from apps.attendance.models import AttendanceRecord
from apps.assessments.models import SkillAssessment, SwimmingRecord, LevelPromotionProposal
from apps.content.models import Announcement, Notification
from apps.swimmers.models import SwimmerProfile


def get_coach_profile(user):
    if hasattr(user, 'coach_profile'):
        return user.coach_profile
    return None


class CoachListView(generics.ListCreateAPIView):
    queryset = CoachProfile.objects.all().select_related('user')
    serializer_class = CoachProfileSerializer

    def get_serializer_class(self):
        user = self.request.user if hasattr(self, 'request') else None
        if user and user.is_authenticated and (user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser):
            return CoachProfileSerializer
        return CoachPublicSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        qs = CoachProfile.objects.all().select_related('user').order_by('display_order', 'user__last_name', 'user__first_name')
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(employment_status=status_param)
        gender_param = self.request.query_params.get('gender')
        if gender_param:
            qs = qs.filter(gender=gender_param)
        landing_param = self.request.query_params.get('landing')
        if landing_param and landing_param.lower() in ['true', '1']:
            qs = qs.filter(show_on_landing=True, employment_status=CoachProfile.EmploymentStatus.ACTIVE)
        return qs


class CoachDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CoachProfile.objects.all().select_related('user')
    serializer_class = CoachProfileSerializer

    def get_serializer_class(self):
        user = self.request.user if hasattr(self, 'request') else None
        if not user or not user.is_authenticated:
            return CoachPublicSerializer

        # Administrators and technical supervisors receive the full management serializer
        if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
            return CoachProfileSerializer

        # A coach viewing their own private profile dossier
        if user.role == 'COACH' and hasattr(user, 'coach_profile'):
            lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
            lookup_val = self.kwargs.get(lookup_url_kwarg)
            if lookup_val is not None and str(user.coach_profile.id) == str(lookup_val):
                return CoachProfileSerializer

        return CoachPublicSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsAdminUserRole()]


class CoachReorderView(APIView):
    """
    تنظیم گروهی ترتیب نمایش مربیان در صفحه لندینگ و پرتال
    """
    permission_classes = [IsAdminUserRole]

    def post(self, request):
        orders = request.data.get('orders', [])
        if not isinstance(orders, list):
            return Response({'detail': 'فرمت داده‌های ارسالی نامعتبر است.'}, status=status.HTTP_400_BAD_REQUEST)

        for item in orders:
            coach_id = item.get('id')
            order_val = item.get('display_order')
            if coach_id is not None and order_val is not None:
                CoachProfile.objects.filter(id=coach_id).update(display_order=int(order_val))

        return Response({'status': 'success', 'message': 'ترتیب نمایش مربیان با موفقیت ذخیره شد.'})


class CoachDashboardOverviewView(APIView):
    """
    داشبورد مربی: نقطه ورود و مرکز عملیات روزانه مربی.
    داده‌های زنده امروز، جلسه بعدی، جلسات نیازمند ثبت حضور و آمار تجمیعی کلاس‌های تخصیص‌یافته.
    """
    permission_classes = [IsAdminOrCoach]

    def get(self, request):
        user = request.user
        coach = get_coach_profile(user)

        # For Admin testing coach panel, fallback to first coach or admin view
        if not coach and (user.role == 'ADMIN' or user.is_superuser):
            coach = CoachProfile.objects.first()

        if not coach:
            return Response({'detail': 'پروفایل مربی برای این کاربر یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        today = timezone.now().date()
        now_time = timezone.now().time()

        # 1. Today's Sessions
        today_sessions = ClassSession.objects.filter(
            coach=coach,
            session_date=today
        ).select_related('group', 'group__course', 'group__skill_level').order_by('start_time')

        today_sessions_data = []
        next_session = None

        for s in today_sessions:
            enrolled_count = s.group.enrollments.filter(status='ACTIVE').count()
            has_attendance = s.attendance_records.exists()
            is_upcoming = s.start_time > now_time and s.status == ClassSession.Status.SCHEDULED

            s_data = {
                'id': s.id,
                'group_id': s.group.id,
                'group_name': s.group.name,
                'course_name': s.group.course.name,
                'skill_level': s.group.skill_level.name,
                'start_time': s.start_time.strftime('%H:%M'),
                'end_time': s.end_time.strftime('%H:%M'),
                'pool_location': s.pool_location,
                'status': s.status,
                'status_display': s.get_status_display(),
                'enrolled_count': enrolled_count,
                'attendance_recorded': has_attendance,
            }
            today_sessions_data.append(s_data)

            if is_upcoming and next_session is None:
                next_session = s_data

        if not next_session and today_sessions_data:
            # Fallback to the first session of today if all completed or current
            next_session = today_sessions_data[0]

        # 2. Coach Groups & Total Swimmers Count
        coach_groups = SwimmerGroup.objects.filter(
            Q(coach_assignments__coach=coach) | Q(sessions__coach=coach)
        ).distinct()

        active_classes_count = coach_groups.filter(status='OPEN').count()
        total_swimmers_count = Enrollment.objects.filter(
            group__in=coach_groups,
            status='ACTIVE'
        ).values('swimmer').distinct().count()

        # 3. Unrecorded Past/Today Attendance (Action Items)
        unrecorded_sessions = ClassSession.objects.filter(
            coach=coach,
            session_date__lte=today,
            status__in=[ClassSession.Status.SCHEDULED, ClassSession.Status.COMPLETED]
        ).annotate(
            record_count=Count('attendance_records')
        ).filter(record_count=0).order_by('-session_date', 'start_time')[:5]

        unrecorded_data = [
            {
                'id': us.id,
                'group_name': us.group.name,
                'date': us.session_date.strftime('%Y-%m-%d'),
                'start_time': us.start_time.strftime('%H:%M'),
                'pool_location': us.pool_location,
            }
            for us in unrecorded_sessions
        ]

        # 4. Action Items & Pending Proposals
        pending_proposals_count = LevelPromotionProposal.objects.filter(
            coach=coach,
            status=LevelPromotionProposal.Status.PENDING
        ).count()

        unread_notifications_count = Notification.objects.filter(
            recipient=user,
            is_read=False
        ).count()

        return Response({
            'coach': {
                'id': coach.id,
                'full_name': coach.full_name,
                'specialties': coach.specialties,
            },
            'today': {
                'date': today.strftime('%Y-%m-%d'),
                'sessions_count': len(today_sessions_data),
                'sessions': today_sessions_data,
                'next_session': next_session,
            },
            'stats': {
                'active_classes_count': active_classes_count,
                'total_swimmers_count': total_swimmers_count,
                'unrecorded_attendance_count': len(unrecorded_data),
                'pending_proposals_count': pending_proposals_count,
                'unread_notifications_count': unread_notifications_count,
            },
            'pending_actions': {
                'unrecorded_sessions': unrecorded_data,
            }
        })


class CoachMyClassesView(APIView):
    """
    فهرست کلاس‌ها و گروه‌های آموزشی تحت هدایت مربی جاری
    """
    permission_classes = [IsAdminOrCoach]

    def get(self, request):
        user = request.user
        coach = get_coach_profile(user)
        if not coach and (user.role == 'ADMIN' or user.is_superuser):
            coach = CoachProfile.objects.first()

        if not coach:
            return Response([], status=status.HTTP_200_OK)

        groups = SwimmerGroup.objects.filter(
            Q(coach_assignments__coach=coach) | Q(sessions__coach=coach)
        ).select_related('course', 'skill_level').prefetch_related('schedules', 'enrollments').distinct()

        serializer = CoachClassListSerializer(groups, many=True)
        return Response(serializer.data)


class CoachClassDetailView(APIView):
    """
    جزئیات جامع یک کلاس/گروه آموزشی شامل مشخصات، شناگران، جلسات و عملکرد
    """
    permission_classes = [IsAdminOrCoach]

    def get(self, request, pk):
        user = request.user
        coach = get_coach_profile(user)
        if not coach and (user.role == 'ADMIN' or user.is_superuser):
            coach = CoachProfile.objects.first()

        try:
            group = SwimmerGroup.objects.select_related('course', 'skill_level').get(pk=pk)
        except SwimmerGroup.DoesNotExist:
            return Response({'detail': 'کلاس مورد نظر یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        # Check access permission
        is_assigned = (
            user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser or
            group.coach_assignments.filter(coach=coach).exists() or
            group.sessions.filter(coach=coach).exists()
        )
        if not is_assigned:
            return Response({'detail': 'شما به این کلاس دسترسی ندارید.'}, status=status.HTTP_403_FORBIDDEN)

        # Swimmers in this group
        enrollments = Enrollment.objects.filter(group=group).select_related('swimmer', 'swimmer__current_level')
        swimmers_data = []
        for en in enrollments:
            sw = en.swimmer
            att_count = AttendanceRecord.objects.filter(swimmer=sw, session__group=group, status='PRESENT').count()
            total_recorded = AttendanceRecord.objects.filter(swimmer=sw, session__group=group).count()
            swimmers_data.append({
                'enrollment_id': en.id,
                'swimmer_id': sw.id,
                'full_name': sw.full_name,
                'national_id': sw.national_id,
                'gender': sw.get_gender_display(),
                'level_name': sw.current_level.name if sw.current_level else 'تعیین‌نشده',
                'status': en.status,
                'sessions_attended': att_count,
                'total_recorded_sessions': total_recorded,
                'attendance_rate': round((att_count / total_recorded * 100), 1) if total_recorded > 0 else 100.0,
            })

        # Sessions for this group
        sessions = ClassSession.objects.filter(group=group).order_by('session_date', 'start_time')
        sessions_data = []
        for s in sessions:
            sessions_data.append({
                'id': s.id,
                'session_date': s.session_date.strftime('%Y-%m-%d'),
                'start_time': s.start_time.strftime('%H:%M'),
                'end_time': s.end_time.strftime('%H:%M'),
                'status': s.status,
                'status_display': s.get_status_display(),
                'pool_location': s.pool_location,
                'has_attendance': s.attendance_records.exists(),
            })

        # Announcements targeted to this class
        announcements = Announcement.objects.filter(
            Q(target_group=group) | Q(target_groups=group)
        ).select_related('created_by').order_by('-is_pinned', '-created_at')

        announcements_data = []
        for a in announcements:
            author_title = 'مربی کلاس'
            if a.created_by:
                name = a.created_by.get_full_name() if hasattr(a.created_by, 'get_full_name') else ''
                if not name and hasattr(a.created_by, 'phone'):
                    name = a.created_by.phone
                if name:
                    author_title = name

            can_delete = (
                user.role in ['ADMIN', 'SUPERVISOR'] or
                user.is_superuser or
                (a.created_by_id and a.created_by_id == user.id)
            )

            announcements_data.append({
                'id': a.id,
                'title': a.title,
                'message': a.message,
                'is_pinned': a.is_pinned,
                'send_sms': a.send_sms,
                'audience': a.get_audience_display(),
                'created_by_name': author_title,
                'created_by_role': getattr(a.created_by, 'role', 'COACH') if a.created_by else 'COACH',
                'can_delete': can_delete,
                'created_at': a.created_at.isoformat() if a.created_at else '',
                'created_at_display': a.created_at.strftime('%Y-%m-%d %H:%M') if a.created_at else '',
            })

        return Response({
            'id': group.id,
            'name': group.name,
            'course_name': group.course.name,
            'course_status': group.course.get_status_display(),
            'skill_level': group.skill_level.name,
            'capacity': group.capacity,
            'enrolled_count': len(swimmers_data),
            'pool_location': group.pool_location,
            'swimmers': swimmers_data,
            'sessions': sessions_data,
            'announcements': announcements_data,
            'schedules': [
                {
                    'weekday_display': sch.get_weekday_display(),
                    'start_time': sch.start_time.strftime('%H:%M'),
                    'end_time': sch.end_time.strftime('%H:%M'),
                }
                for sch in group.schedules.all()
            ]
        })

    def post(self, request, pk):
        """
        ارسال اعلان اختصاصی توسط مربی برای تمامی شناگران این کلاس
        """
        user = request.user
        coach = get_coach_profile(user)
        if not coach and (user.role == 'ADMIN' or user.is_superuser):
            coach = CoachProfile.objects.first()

        try:
            group = SwimmerGroup.objects.get(pk=pk)
        except SwimmerGroup.DoesNotExist:
            return Response({'detail': 'کلاس مورد نظر یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        is_assigned = (
            user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser or
            group.coach_assignments.filter(coach=coach).exists() or
            group.sessions.filter(coach=coach).exists()
        )
        if not is_assigned:
            return Response({'detail': 'شما به این کلاس دسترسی ندارید.'}, status=status.HTTP_403_FORBIDDEN)

        title = request.data.get('title', '').strip()
        message = request.data.get('message', '').strip()
        is_pinned = bool(request.data.get('is_pinned', False))
        send_sms = bool(request.data.get('send_sms', False))

        if not title or not message:
            return Response({'detail': 'عنوان و متن اعلان الزامی هستند.'}, status=status.HTTP_400_BAD_REQUEST)

        announcement = Announcement.objects.create(
            title=title,
            message=message,
            audience=Announcement.Audience.GROUP,
            target_group=group,
            is_pinned=is_pinned,
            send_sms=send_sms,
            created_by=user
        )

        # Notify active enrolled swimmers and their users
        enrollments = group.enrollments.filter(status='ACTIVE').select_related('swimmer__user')
        for en in enrollments:
            sw = en.swimmer
            if sw and sw.user:
                Notification.objects.create(
                    recipient=sw.user,
                    category=Notification.Category.ANNOUNCEMENT,
                    title=f"پیام مربی در کلاس {group.name}: {title}",
                    message=message[:250],
                    link='/swimmer/announcements',
                    is_read=False
                )

        author_name = user.get_full_name() if hasattr(user, 'get_full_name') and user.get_full_name() else getattr(user, 'phone', 'مربی')

        return Response({
            'detail': 'اعلان با موفقیت برای تمامی شناگران کلاس ارسال شد.',
            'announcement': {
                'id': announcement.id,
                'title': announcement.title,
                'message': announcement.message,
                'is_pinned': announcement.is_pinned,
                'send_sms': announcement.send_sms,
                'audience': announcement.get_audience_display(),
                'created_by_name': author_name,
                'created_by_role': getattr(user, 'role', 'COACH'),
                'can_delete': True,
                'created_at': announcement.created_at.isoformat(),
                'created_at_display': announcement.created_at.strftime('%Y-%m-%d %H:%M'),
            }
        }, status=status.HTTP_201_CREATED)


class CoachClassAnnouncementDeleteView(APIView):
    """
    حذف اعلان ارسال‌شده برای کلاس یا تغییر پین توسط مربی ایجادکننده یا مدیر
    """
    permission_classes = [IsAdminOrCoach]

    def delete(self, request, group_id, announcement_id):
        user = request.user
        coach = get_coach_profile(user)
        if not coach and (user.role == 'ADMIN' or user.is_superuser):
            coach = CoachProfile.objects.first()

        try:
            group = SwimmerGroup.objects.get(pk=group_id)
        except SwimmerGroup.DoesNotExist:
            return Response({'detail': 'کلاس مورد نظر یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        is_assigned = (
            user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser or
            group.coach_assignments.filter(coach=coach).exists() or
            group.sessions.filter(coach=coach).exists()
        )
        if not is_assigned:
            return Response({'detail': 'دسترسی غیرمجاز.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            announcement = Announcement.objects.get(pk=announcement_id)
        except Announcement.DoesNotExist:
            return Response({'detail': 'اعلان مورد نظر یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        if announcement.target_group_id != group.id and not announcement.target_groups.filter(id=group.id).exists():
            return Response({'detail': 'این اعلان مربوط به این کلاس نیست.'}, status=status.HTTP_400_BAD_REQUEST)

        if not (user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser or announcement.created_by == user):
            return Response({'detail': 'تنها ارسال‌کننده اعلان یا مدیر مجاز به حذف آن هستند.'}, status=status.HTTP_403_FORBIDDEN)

        announcement.delete()
        return Response({'detail': 'اعلان با موفقیت حذف گردید.'}, status=status.HTTP_200_OK)

    def patch(self, request, group_id, announcement_id):
        user = request.user
        coach = get_coach_profile(user)
        if not coach and (user.role == 'ADMIN' or user.is_superuser):
            coach = CoachProfile.objects.first()

        try:
            group = SwimmerGroup.objects.get(pk=group_id)
        except SwimmerGroup.DoesNotExist:
            return Response({'detail': 'کلاس مورد نظر یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        is_assigned = (
            user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser or
            group.coach_assignments.filter(coach=coach).exists() or
            group.sessions.filter(coach=coach).exists()
        )
        if not is_assigned:
            return Response({'detail': 'دسترسی غیرمجاز.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            announcement = Announcement.objects.get(pk=announcement_id)
        except Announcement.DoesNotExist:
            return Response({'detail': 'اعلان یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        if not (user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser or announcement.created_by == user):
            return Response({'detail': 'شما مجاز به ویرایش این اعلان نیستید.'}, status=status.HTTP_403_FORBIDDEN)

        announcement.is_pinned = not announcement.is_pinned
        announcement.save(update_fields=['is_pinned'])
        return Response({
            'detail': 'وضعیت پین با موفقیت بروزرسانی شد.',
            'is_pinned': announcement.is_pinned
        }, status=status.HTTP_200_OK)


class CoachSwimmerDossierView(APIView):
    """
    پرونده مهارتی و عملکردی شناگر ویژه مربی:
    نمایش پیشرفت مهارت‌ها، سوابق ارزیابی، رکوردهای زمانی و تاریخچه حضور.
    """
    permission_classes = [IsAdminOrCoach]

    def get(self, request, pk):
        user = request.user
        coach = get_coach_profile(user)
        if not coach and (user.role == 'ADMIN' or user.is_superuser):
            coach = CoachProfile.objects.first()

        try:
            swimmer = SwimmerProfile.objects.select_related('current_level', 'user').get(pk=pk)
        except SwimmerProfile.DoesNotExist:
            return Response({'detail': 'شناگر یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        # Verify coach has teaching relationship with this swimmer
        is_admin = user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser
        if not is_admin and coach:
            has_common_class = Enrollment.objects.filter(
                swimmer=swimmer,
                group__in=SwimmerGroup.objects.filter(
                    Q(coach_assignments__coach=coach) | Q(sessions__coach=coach)
                )
            ).exists()
            if not has_common_class:
                return Response({'detail': 'شما به پرونده این شناگر دسترسی ندارید.'}, status=status.HTTP_403_FORBIDDEN)

        # 1. Skill Assessments
        assessments = SkillAssessment.objects.filter(swimmer=swimmer).select_related('skill', 'skill__level', 'assessed_by')
        assessments_data = [
            {
                'id': a.id,
                'skill_id': a.skill.id,
                'skill_name': a.skill.name,
                'level_name': a.skill.level.name,
                'status': a.status,
                'status_display': a.get_status_display(),
                'score': float(a.score),
                'feedback': a.feedback,
                'assessed_at': a.assessed_at.strftime('%Y-%m-%d'),
                'assessed_by': a.assessed_by.get_full_name() if a.assessed_by else 'مربی',
            }
            for a in assessments
        ]

        # 2. Swimming Records
        records = SwimmingRecord.objects.filter(swimmer=swimmer).order_by('-recorded_at')
        records_data = [
            {
                'id': r.id,
                'stroke': r.stroke,
                'stroke_display': r.get_stroke_display(),
                'distance_meters': r.distance_meters,
                'duration_seconds': float(r.duration_seconds),
                'formatted_time': r.formatted_time,
                'recorded_at': r.recorded_at.strftime('%Y-%m-%d'),
                'verification_status': r.verification_status,
                'verification_status_display': r.get_verification_status_display(),
            }
            for r in records
        ]

        # 3. Attendance Summary
        att_records = AttendanceRecord.objects.filter(swimmer=swimmer).select_related('session')
        total_sessions = att_records.count()
        present_count = att_records.filter(status='PRESENT').count()
        absent_count = att_records.filter(status='ABSENT').count()
        excused_count = att_records.filter(status='EXCUSED').count()
        late_count = att_records.filter(status='LATE').count()

        # 4. Available Skill Levels for promotion
        skill_levels = SkillLevel.objects.filter(is_active=True).values('id', 'name', 'order')

        return Response({
            'swimmer': {
                'id': swimmer.id,
                'first_name': swimmer.first_name,
                'last_name': swimmer.last_name,
                'full_name': swimmer.full_name,
                'gender': swimmer.get_gender_display(),
                'date_of_birth': swimmer.date_of_birth.strftime('%Y-%m-%d') if swimmer.date_of_birth else None,
                'national_id': swimmer.national_id,
                'current_level_id': swimmer.current_level.id if swimmer.current_level else None,
                'current_level_name': swimmer.current_level.name if swimmer.current_level else 'تعیین‌نشده',
                'medical_conditions': swimmer.medical_notes or 'بدون مورد خاص',
                'guardian_phone': swimmer.emergency_contact_phone or swimmer.father_phone or swimmer.mother_phone or swimmer.phone or 'ثبت‌نشده',
            },
            'assessments': assessments_data,
            'records': records_data,
            'attendance_summary': {
                'total_sessions': total_sessions,
                'present': present_count,
                'absent': absent_count,
                'excused': excused_count,
                'late': late_count,
                'attendance_rate': round((present_count / total_sessions * 100), 1) if total_sessions > 0 else 100.0,
            },
            'skill_levels': list(skill_levels),
        })


class CoachWorkoutPlanListView(generics.ListCreateAPIView):
    """
    مشاهده و ایجاد برنامه‌های تمرینی مربی
    """
    serializer_class = WorkoutPlanSerializer
    permission_classes = [IsAdminOrCoach]

    def get_queryset(self):
        user = self.request.user
        coach = get_coach_profile(user)
        if not coach and (user.role == 'ADMIN' or user.is_superuser):
            coach = CoachProfile.objects.first()

        if not coach:
            return WorkoutPlan.objects.none()

        qs = WorkoutPlan.objects.filter(coach=coach).select_related('group', 'target_level')
        template_param = self.request.query_params.get('template')
        if template_param == 'true':
            qs = qs.filter(is_template=True)
        return qs

    def perform_create(self, serializer):
        coach = get_coach_profile(self.request.user)
        if not coach and (self.request.user.role == 'ADMIN' or self.request.user.is_superuser):
            coach = CoachProfile.objects.first()
        serializer.save(coach=coach)


class CoachWorkoutPlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = WorkoutPlanSerializer
    permission_classes = [IsAdminOrCoach]

    def get_queryset(self):
        user = self.request.user
        coach = get_coach_profile(user)
        if not coach and (user.role == 'ADMIN' or user.is_superuser):
            return WorkoutPlan.objects.all()
        return WorkoutPlan.objects.filter(coach=coach)


class CoachAIAssistantView(APIView):
    """
    دستیار هوشمند مربی:
    ۱. تولید برنامه تمرینی استاندارد متناسب با سطح و ماده شنا
    ۲. تولید متن بازخورد آموزشی و پیشرفت برای ارسال به اولیا
    ۳. پیشنهاد تمرینات اصلاح تکنیک بر اساس نقاط ضعف شناگر
    """
    permission_classes = [IsAdminOrCoach]

    def post(self, request):
        mode = request.data.get('mode', 'PRACTICE_PLAN')
        level_name = request.data.get('level_name', 'متوسط')
        stroke = request.data.get('stroke', 'کرال سینه')
        duration = int(request.data.get('duration_minutes', 60))
        target_focus = request.data.get('target_focus', 'بهبود تنفس و استقامت')
        swimmer_name = request.data.get('swimmer_name', '')
        weakness = request.data.get('weakness', '')

        if mode == 'PRACTICE_PLAN':
            # Generate structured practice routine
            warmup_dist = 200 if duration <= 60 else 400
            main_dist = 800 if duration <= 60 else 1400
            cool_dist = 100 if duration <= 60 else 200

            plan = {
                'title': f'طرح تمرین {duration} دقیقه‌ای - {stroke} ({level_name})',
                'focus_skills': f'تمرکز روی {target_focus} با هماهنگی دست و پا',
                'total_distance_meters': warmup_dist + main_dist + cool_dist,
                'warmup_section': (
                    f"۱. {warmup_dist // 2} متر شنای آرام و کشیده برای گرم‌کردن عمومی\n"
                    f"۲. {warmup_dist // 2} متر پا زدن با تخته شنا (کیک‌بورد) - استراحت ۱۵ ثانیه بین هر ۵۰ متر\n"
                    f"۳. تمرینات کششی سبک شانه و مچ پا در آب به مدت ۵ دقیقه"
                ),
                'main_section': (
                    f"۱. ۴ ست ۵۰ متر دریل تک‌دست {stroke} با تمرکز بر چرخش تنه و زاویه ورود دست\n"
                    f"۲. ۶ ست ۵۰ متر شنای سرعتی در آستانه هوازی (استراحت ۲۰ ثانیه)\n"
                    f"۳. ۴ ست ۲۵ متر تمرین استارت انفجاری و سرخوردن زیر آب بدون تنفس در ۵ متر اول\n"
                    f"۴. {main_dist - 400} متر شنای پیوسته با ریتم متوسط و شمارش تعداد دست در هر طول استخر"
                ),
                'cooldown_section': (
                    f"۱. {cool_dist // 2} متر شنای قورباغه یا کرال پشت بسیار آرام\n"
                    f"۲. {cool_dist // 2} متر سرخوردن کشیده و غوطه‌وری کنترل‌شده\n"
                    f"۳. تمرین تنفس عمیق حبابی در کنار لبه استخر"
                ),
                'notes': (
                    "تأکید روی کنترل سر در خط آب؛ از بالا آمدن بیش از حد چانه جلوگیری شود. "
                    "در صورت خستگی مفرط شناگران، استراحت بین ست‌ها ۵ الی ۱۰ ثانیه افزایش یابد."
                )
            }
            return Response({'status': 'success', 'data': plan})

        elif mode == 'SWIMMER_REPORT':
            report_text = (
                f"با سلام و احترام،\n"
                f"گزارش پیشرفت ورزشی {swimmer_name or 'شناگر عزیز'} در دوره آموزشی جاری:\n\n"
                f"۱. حضور و انضباط: روند حضور در جلسات تمرینی بسیار منظم و مشتاقانه بوده است.\n"
                f"۲. پیشرفت مهارتی: تسلط بر مهارت‌های {stroke} و بهبود هماهنگی تنفس و پا به وضوح مشاهده می‌شود.\n"
                f"۳. اهداف جلسه آینده: در جلسات پیش‌رو روی {target_focus} و استقامت طولانی‌تر تمرکز خواهیم کرد.\n\n"
                f"از همراهی و حمایت همیشگی شما در مسیر آموزش سپاسگزاریم.\n"
                f"مربی آکادمی شنای ایران"
            )
            return Response({'status': 'success', 'report_text': report_text})

        elif mode == 'DRILL_RECOMMENDATION':
            drills = [
                {
                    'title': f'دریل اصلاحی شماره ۱: Catch-Up Drill برای {stroke}',
                    'focus': 'جلوگیری از عجله در چرخش دست و حفظ تعادل طولی',
                    'reps': '۶ ست ۲۵ متر با استراحت ۲۰ ثانیه',
                    'instructions': 'یک دست در جلو کشیده می‌ماند تا دست دیگر چرخه کامل را طی کرده و به آن برسد.',
                },
                {
                    'title': 'دریل اصلاحی شماره ۲: پا با تخته شنا و تنفس جانبی',
                    'focus': 'حفظ موقعیت خطی بدن بدون افتادن باسن در آب',
                    'reps': '۴ ست ۵۰ متر',
                    'instructions': 'بدن کاملاً صاف، گوش چسبیده به شانه هنگام تنفس، تخته کاملاً موازی سطح آب.',
                },
                {
                    'title': 'دریل اصلاحی شماره ۳: شنای Fingertip Drag',
                    'focus': 'بالا نگه داشتن آرنج در مرحله پرواز دست (Recovery)',
                    'reps': '۴ ست ۲۵ متر',
                    'instructions': 'نوک انگشتان در طول بازگشت دست با سطح آب تماس ملایم داشته باشند.',
                }
            ]
            return Response({'status': 'success', 'drills': drills})

        return Response({'detail': 'حالت نامعتبر است.'}, status=status.HTTP_400_BAD_REQUEST)


class CoachMessagesView(APIView):
    """
    ارسال و مشاهده پیام‌ها و اعلان‌های اختصاصی مربی و کلاس‌های تحت پوشش
    """
    permission_classes = [IsAdminOrCoach]

    def get(self, request):
        user = request.user
        coach = get_coach_profile(user)
        if not coach and (user.role == 'ADMIN' or user.is_superuser):
            coach = CoachProfile.objects.first()

        # Announcements for coaches or coach's groups
        coach_groups = SwimmerGroup.objects.filter(
            Q(coach_assignments__coach=coach) | Q(sessions__coach=coach)
        ).distinct()

        announcements = Announcement.objects.filter(
            Q(audience__in=['ALL', 'COACHES']) | Q(target_group__in=coach_groups)
        ).select_related('target_group').order_by('-is_pinned', '-created_at')[:20]

        announcements_data = [
            {
                'id': a.id,
                'title': a.title,
                'message': a.message,
                'audience': a.get_audience_display(),
                'group_name': a.target_group.name if a.target_group else None,
                'is_pinned': a.is_pinned,
                'created_at': a.created_at.strftime('%Y-%m-%d %H:%M'),
            }
            for a in announcements
        ]

        # Notifications
        notifications = Notification.objects.filter(recipient=user).order_by('-created_at')[:20]
        notifications_data = [
            {
                'id': n.id,
                'title': n.title,
                'message': n.message,
                'category': n.category,
                'is_read': n.is_read,
                'link': n.link,
                'created_at': n.created_at.strftime('%Y-%m-%d %H:%M'),
            }
            for n in notifications
        ]

        # Return list of coach's groups so coach can choose target group for new message
        groups_list = [{'id': g.id, 'name': g.name} for g in coach_groups]

        return Response({
            'announcements': announcements_data,
            'notifications': notifications_data,
            'my_groups': groups_list,
        })

    def post(self, request):
        """
        ارسال اعلان توسط مربی به یکی از کلاس‌های مجاز خود
        """
        user = request.user
        coach = get_coach_profile(user)
        if not coach and (user.role == 'ADMIN' or user.is_superuser):
            coach = CoachProfile.objects.first()

        title = request.data.get('title')
        message = request.data.get('message')
        group_id = request.data.get('group_id')

        if not title or not message or not group_id:
            return Response({'detail': 'عنوان، پیام و گروه الزامی هستند.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            group = SwimmerGroup.objects.get(pk=group_id)
        except SwimmerGroup.DoesNotExist:
            return Response({'detail': 'گروه یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        # Security check: coach must belong to this group
        is_admin = user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser
        if not is_admin and coach:
            is_coach_of_group = (
                group.coach_assignments.filter(coach=coach).exists() or
                group.sessions.filter(coach=coach).exists()
            )
            if not is_coach_of_group:
                return Response({'detail': 'شما مجاز به ارسال پیام به این کلاس نیستید.'}, status=status.HTTP_403_FORBIDDEN)

        announcement = Announcement.objects.create(
            title=title,
            message=message,
            audience=Announcement.Audience.GROUP,
            target_group=group,
            created_by=user
        )

        return Response({
            'message': 'پیام با موفقیت به شناگران کلاس ارسال شد.',
            'id': announcement.id
        }, status=status.HTTP_201_CREATED)
