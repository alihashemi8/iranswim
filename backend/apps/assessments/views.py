from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import SkillAssessment, SwimmingRecord
from .serializers import SkillAssessmentSerializer, SwimmingRecordSerializer
from apps.accounts.permissions import IsAdminOrCoach, IsAdminUserRole
from apps.supervisor.models import AuditLog


class SkillAssessmentListView(generics.ListCreateAPIView):
    serializer_class = SkillAssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = SkillAssessment.objects.all().select_related('swimmer', 'skill__level', 'assessed_by')
        swimmer_id = self.request.query_params.get('swimmer_id')
        if swimmer_id:
            qs = qs.filter(swimmer_id=swimmer_id)

        if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
            return qs
        elif user.role == 'COACH':
            return qs
        elif user.role == 'SWIMMER':
            return qs.filter(swimmer__user=user)
        return qs.none()

    def perform_create(self, serializer):
        serializer.save(assessed_by=self.request.user)


class SwimmingRecordListView(generics.ListCreateAPIView):
    serializer_class = SwimmingRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = SwimmingRecord.objects.all().select_related('swimmer')
        stroke = self.request.query_params.get('stroke')
        if stroke:
            qs = qs.filter(stroke=stroke)
        swimmer_id = self.request.query_params.get('swimmer_id')
        if swimmer_id:
            qs = qs.filter(swimmer_id=swimmer_id)

        if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
            return qs
        elif user.role == 'COACH':
            return qs
        elif user.role == 'SWIMMER':
            # Swimmer sees only verified records or their own pending records
            return qs.filter(swimmer__user=user)
        return qs.filter(verification_status='VERIFIED')

    def perform_create(self, serializer):
        # Auto-verify if created by Admin, else mark PENDING
        is_admin = self.request.user.role == 'ADMIN' or self.request.user.is_superuser
        ver_status = SwimmingRecord.VerificationStatus.VERIFIED if is_admin else SwimmingRecord.VerificationStatus.PENDING
        verified_by = self.request.user if is_admin else None
        serializer.save(recorded_by=self.request.user, verification_status=ver_status, verified_by=verified_by)


class VerifyRecordView(APIView):
    """تأیید یا رد رکورد شنا توسط مدیر با ثبت لاگ حسابرسی"""
    permission_classes = [IsAdminUserRole]

    def post(self, request, pk):
        try:
            record = SwimmingRecord.objects.get(pk=pk)
        except SwimmingRecord.DoesNotExist:
            return Response({'detail': 'رکورد یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action') # 'VERIFY' or 'REJECT'
        reason = request.data.get('reason', '')

        if action == 'VERIFY':
            record.verification_status = SwimmingRecord.VerificationStatus.VERIFIED
            record.verified_by = request.user
            record.save()
            AuditLog.objects.create(
                actor=request.user,
                action=AuditLog.Action.RECORD_VERIFY,
                entity_type='SwimmingRecord',
                entity_id=str(record.id),
                details={'status': 'VERIFIED', 'swimmer': record.swimmer.full_name}
            )
            return Response({'message': 'رکورد با موفقیت تأیید شد.'})
        elif action == 'REJECT':
            record.verification_status = SwimmingRecord.VerificationStatus.REJECTED
            record.rejection_reason = reason
            record.verified_by = request.user
            record.save()
            return Response({'message': 'رکورد رد شد.'})
        return Response({'detail': 'عملیات نامعتبر است.'}, status=status.HTTP_400_BAD_REQUEST)
