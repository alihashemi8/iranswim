from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from .models import ClassSession
from .serializers import ClassSessionSerializer
from apps.accounts.permissions import IsAdminOrCoach


class ClassSessionListView(generics.ListCreateAPIView):
    serializer_class = ClassSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = ClassSession.objects.all().select_related('group', 'coach__user')
        group_id = self.request.query_params.get('group_id')
        if group_id:
            qs = qs.filter(group_id=group_id)
        date = self.request.query_params.get('date')
        if date:
            qs = qs.filter(session_date=date)

        if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
            return qs
        elif user.role == 'COACH':
            coach_profile = getattr(user, 'coach_profile', None)
            return qs.filter(coach=coach_profile) if coach_profile else qs.none()
        elif user.role == 'SWIMMER':
            swimmer_profile = getattr(user, 'swimmer_profile', None)
            if swimmer_profile:
                return qs.filter(group__enrollments__swimmer=swimmer_profile).distinct()
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
