from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import SkillAssessment, SwimmingRecord, LevelPromotionProposal
from .serializers import (
    SkillAssessmentSerializer, SwimmingRecordSerializer,
    LevelPromotionProposalSerializer
)
from apps.accounts.permissions import IsAdminOrCoach, IsAdminUserRole
from apps.supervisor.models import AuditLog


class LevelPromotionProposalListView(generics.ListCreateAPIView):
    serializer_class = LevelPromotionProposalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = LevelPromotionProposal.objects.all().select_related(
            'swimmer', 'coach__user', 'current_level', 'proposed_level'
        )
        if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
            return qs
        elif user.role == 'COACH':
            coach_profile = getattr(user, 'coach_profile', None)
            return qs.filter(coach=coach_profile) if coach_profile else qs.none()
        elif user.role == 'SWIMMER':
            from apps.swimmers.utils import get_accessible_swimmer_ids
            ids = get_accessible_swimmer_ids(user, self.request)
            return qs.filter(swimmer_id__in=ids)
        return qs.none()

    def perform_create(self, serializer):
        coach_profile = getattr(self.request.user, 'coach_profile', None)
        serializer.save(coach=coach_profile)


class LevelPromotionProposalReviewView(APIView):
    """تأیید یا رد پیشنهاد ارتقای سطح توسط مدیر آموزشگاه"""
    permission_classes = [IsAdminUserRole]

    def post(self, request, pk):
        try:
            proposal = LevelPromotionProposal.objects.select_related('swimmer').get(pk=pk)
        except LevelPromotionProposal.DoesNotExist:
            return Response({'detail': 'پیشنهاد یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')  # 'APPROVE' or 'REJECT'
        reviewer_notes = request.data.get('reviewer_notes', '')

        if action == 'APPROVE':
            proposal.status = LevelPromotionProposal.Status.APPROVED
            proposal.reviewer_notes = reviewer_notes
            proposal.reviewed_by = request.user
            proposal.save()

            # Update swimmer's current skill level
            proposal.swimmer.current_level = proposal.proposed_level
            proposal.swimmer.save(update_fields=['current_level'])

            AuditLog.objects.create(
                actor=request.user,
                action=AuditLog.Action.RECORD_VERIFY,
                entity_type='LevelPromotionProposal',
                entity_id=str(proposal.id),
                details={
                    'status': 'APPROVED',
                    'swimmer': proposal.swimmer.full_name,
                    'new_level': proposal.proposed_level.name
                }
            )
            return Response({'message': 'ارتقای سطح شناگر با موفقیت تأیید شد.'})
        elif action == 'REJECT':
            proposal.status = LevelPromotionProposal.Status.REJECTED
            proposal.reviewer_notes = reviewer_notes
            proposal.reviewed_by = request.user
            proposal.save()
            return Response({'message': 'پیشنهاد ارتقای سطح رد شد.'})

        return Response({'detail': 'عملیات نامعتبر است.'}, status=status.HTTP_400_BAD_REQUEST)



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
            from apps.swimmers.utils import get_accessible_swimmer_ids
            ids = get_accessible_swimmer_ids(user, self.request)
            return qs.filter(swimmer_id__in=ids)
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
            from apps.swimmers.utils import get_accessible_swimmer_ids
            ids = get_accessible_swimmer_ids(user, self.request)
            return qs.filter(swimmer_id__in=ids)
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
