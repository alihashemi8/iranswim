from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import ClassSession
from .serializers import ClassSessionSerializer
from apps.accounts.permissions import IsAdminOrCoach


class ClassSessionListView(generics.ListCreateAPIView):
    serializer_class = ClassSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = ClassSession.objects.all().select_related(
            'group__course',
            'group__skill_level',
            'coach__user'
        ).prefetch_related('attendance_records', 'group__enrollments')

        # Filters
        group_id = self.request.query_params.get('group_id')
        if group_id:
            qs = qs.filter(group_id=group_id)

        course_id = self.request.query_params.get('course_id')
        if course_id:
            qs = qs.filter(group__course_id=course_id)

        skill_level_id = self.request.query_params.get('skill_level_id') or self.request.query_params.get('level_id')
        if skill_level_id:
            qs = qs.filter(group__skill_level_id=skill_level_id)

        coach_id = self.request.query_params.get('coach_id')
        if coach_id:
            qs = qs.filter(coach_id=coach_id)

        pool_location = self.request.query_params.get('pool_location')
        if pool_location:
            qs = qs.filter(pool_location=pool_location)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        date = self.request.query_params.get('date')
        if date:
            qs = qs.filter(session_date=date)

        # Attendance status filter
        att_status = self.request.query_params.get('attendance_status')
        if att_status == 'UNRECORDED' or self.request.query_params.get('unrecorded') == 'true':
            qs = qs.filter(session_date__lte=timezone.now().date(), attendance_records__isnull=True)
        elif att_status == 'RECORDED':
            qs = qs.filter(attendance_records__isnull=False).distinct()

        # Search filter
        search = self.request.query_params.get('search')
        if search:
            search = search.strip()
            qs = qs.filter(
                Q(group__name__icontains=search) |
                Q(group__course__name__icontains=search) |
                Q(group__skill_level__name__icontains=search) |
                Q(coach__user__first_name__icontains=search) |
                Q(coach__user__last_name__icontains=search) |
                Q(pool_location__icontains=search) |
                Q(group__enrollments__swimmer__first_name__icontains=search) |
                Q(group__enrollments__swimmer__last_name__icontains=search)
            ).distinct()

        if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
            return qs
        elif user.role == 'COACH':
            coach_profile = getattr(user, 'coach_profile', None)
            return qs.filter(coach=coach_profile) if coach_profile else qs.none()
        elif user.role == 'SWIMMER':
            from apps.swimmers.utils import get_accessible_swimmer_ids
            ids = get_accessible_swimmer_ids(user, self.request)
            if ids:
                return qs.filter(group__enrollments__swimmer_id__in=ids).distinct()
            return qs.none()
        return qs.none()


class ClassSessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ClassSession.objects.all()
    serializer_class = ClassSessionSerializer
    permission_classes = [IsAdminOrCoach]


class CancelSessionView(APIView):
    """لغو جلسه همراه با ثبت دلیل و امکان اتصال جلسه جبرانی"""
    permission_classes = [IsAdminOrCoach]

    def post(self, request, pk):
        try:
            session = ClassSession.objects.get(pk=pk)
        except ClassSession.DoesNotExist:
            return Response({'detail': 'جلسه یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', 'لغو اضطراری')
        session.status = ClassSession.Status.CANCELLED
        session.cancellation_reason = reason
        session.cancelled_by = request.user
        session.cancelled_at = timezone.now()
        session.save()

        return Response({'message': 'جلسه لغو شد.', 'status': 'CANCELLED'})
