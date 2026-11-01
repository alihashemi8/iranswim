from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import AttendanceRecord
from .serializers import AttendanceRecordSerializer
from apps.accounts.permissions import IsAdminOrCoach
from apps.scheduling.models import ClassSession
from apps.education.models import Enrollment


class AttendanceListView(generics.ListAPIView):
    serializer_class = AttendanceRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = AttendanceRecord.objects.all().select_related('session', 'swimmer')
        session_id = self.request.query_params.get('session_id')
        if session_id:
            qs = qs.filter(session_id=session_id)
        swimmer_id = self.request.query_params.get('swimmer_id')
        if swimmer_id:
            qs = qs.filter(swimmer_id=swimmer_id)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(swimmer__first_name__icontains=search) |
                Q(swimmer__last_name__icontains=search) |
                Q(session__group__name__icontains=search) |
                Q(note__icontains=search)
            )

        if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
            return qs
        elif user.role == 'COACH':
            coach_profile = getattr(user, 'coach_profile', None)
            return qs.filter(session__coach=coach_profile) if coach_profile else qs.none()
        elif user.role == 'SWIMMER':
            from apps.swimmers.utils import get_accessible_swimmer_ids
            ids = get_accessible_swimmer_ids(user, self.request)
            return qs.filter(swimmer_id__in=ids)
        return qs.none()


class AttendanceBulkSaveView(APIView):
    """
    ثبت یا ویرایش دسته‌ای حضور و غیاب برای تمام شناگران یک جلسه
    و به‌روزرسانی خودکار سهمیه جلسات با رعایت قوانین حضور و موجه بودن
    """
    permission_classes = [IsAdminOrCoach]

    def post(self, request):
        session_id = request.data.get('session_id')
        records = request.data.get('records', [])

        if not session_id or not isinstance(records, list):
            return Response({'detail': 'پارامترهای session_id و records الزامی هستند.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            session = ClassSession.objects.select_related('group').get(pk=session_id)
        except ClassSession.DoesNotExist:
            return Response({'detail': 'جلسه یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        # Check Coach permission on this session
        if request.user.role == 'COACH':
            coach_profile = getattr(request.user, 'coach_profile', None)
            if not coach_profile or session.coach != coach_profile:
                return Response({'detail': 'شما مربی این جلسه نیستید.'}, status=status.HTTP_403_FORBIDDEN)

        saved_records = []
        with transaction.atomic():
            for item in records:
                swimmer_id = item.get('swimmer_id')
                status_val = item.get('status', AttendanceRecord.Status.PRESENT)
                note = item.get('note', '')

                # Find active enrollment
                enrollment = Enrollment.objects.filter(
                    swimmer_id=swimmer_id,
                    group=session.group
                ).first()

                att, created = AttendanceRecord.objects.update_or_create(
                    session=session,
                    swimmer_id=swimmer_id,
                    defaults={
                        'enrollment': enrollment,
                        'status': status_val,
                        'note': note,
                        'recorded_by': request.user
                    }
                )
                saved_records.append(att)

            # Mark session as COMPLETED if scheduled
            if session.status == ClassSession.Status.SCHEDULED:
                session.status = ClassSession.Status.COMPLETED
                session.save(update_fields=['status'])

        return Response({
            'message': 'حضور و غیاب با موفقیت ثبت و سهمیه جلسات به‌روزرسانی شد.',
            'count': len(saved_records)
        })
