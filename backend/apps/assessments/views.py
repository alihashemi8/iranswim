from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import SkillAssessment, SwimmingRecord, LevelPromotionProposal
from .serializers import (
    SkillAssessmentSerializer, SwimmingRecordSerializer,
    LevelPromotionProposalSerializer
)
from apps.accounts.permissions import IsAdminOrCoach, IsAdminUserRole
from apps.supervisor.models import AuditLog
from apps.swimmers.models import SwimmerProfile


def _coach_swimmers_q(coach_profile):
    today = timezone.localdate()
    return (
        Q(enrollments__coach=coach_profile) |
        (
            Q(enrollments__group__coach_assignments__coach=coach_profile) &
            (
                Q(enrollments__group__coach_assignments__assigned_to__isnull=True) |
                Q(enrollments__group__coach_assignments__assigned_to__gte=today)
            )
        )
    )


def _coach_teaches_swimmer(coach_profile, swimmer):
    if not coach_profile or not swimmer:
        return False
    return SwimmerProfile.objects.filter(pk=swimmer.pk).filter(_coach_swimmers_q(coach_profile)).exists()


class LevelPromotionProposalListView(generics.ListCreateAPIView):
    serializer_class = LevelPromotionProposalSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminOrCoach()]

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
        user = self.request.user
        coach_profile = getattr(user, 'coach_profile', None)
        swimmer = serializer.validated_data.get('swimmer')
        if user.role == 'COACH':
            if not _coach_teaches_swimmer(coach_profile, swimmer):
                raise PermissionDenied('شما فقط مجاز به ثبت پیشنهاد ارتقای سطح برای شناگران کلاس خود هستید.')
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

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminOrCoach()]

    def get_queryset(self):
        user = self.request.user
        qs = SkillAssessment.objects.all().select_related('swimmer', 'skill__level', 'assessed_by')
        swimmer_id = self.request.query_params.get('swimmer_id')
        if swimmer_id:
            qs = qs.filter(swimmer_id=swimmer_id)

        if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
            return qs
        elif user.role == 'COACH':
            coach_profile = getattr(user, 'coach_profile', None)
            if not coach_profile:
                return qs.none()
            allowed_swimmers = SwimmerProfile.objects.filter(_coach_swimmers_q(coach_profile)).distinct()
            return qs.filter(swimmer__in=allowed_swimmers)
        elif user.role == 'SWIMMER':
            from apps.swimmers.utils import get_accessible_swimmer_ids
            ids = get_accessible_swimmer_ids(user, self.request)
            return qs.filter(swimmer_id__in=ids)
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        swimmer = serializer.validated_data.get('swimmer')
        if user.role == 'COACH':
            coach_profile = getattr(user, 'coach_profile', None)
            if not _coach_teaches_swimmer(coach_profile, swimmer):
                raise PermissionDenied('شما فقط مجاز به ثبت ارزیابی مهارت برای شناگران کلاس خود هستید.')
        serializer.save(assessed_by=user)


class SwimmingRecordListView(generics.ListCreateAPIView):
    serializer_class = SwimmingRecordSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminOrCoach()]

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
            coach_profile = getattr(user, 'coach_profile', None)
            if not coach_profile:
                return qs.none()
            allowed_swimmers = SwimmerProfile.objects.filter(_coach_swimmers_q(coach_profile)).distinct()
            return qs.filter(swimmer__in=allowed_swimmers)
        elif user.role == 'SWIMMER':
            # Swimmer sees only their own or verified children's records
            from apps.swimmers.utils import get_accessible_swimmer_ids
            ids = get_accessible_swimmer_ids(user, self.request)
            return qs.filter(swimmer_id__in=ids)
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        swimmer = serializer.validated_data.get('swimmer')
        if user.role == 'COACH':
            coach_profile = getattr(user, 'coach_profile', None)
            if not _coach_teaches_swimmer(coach_profile, swimmer):
                raise PermissionDenied('شما فقط مجاز به ثبت رکورد برای شناگران کلاس خود هستید.')
        # Auto-verify if created by Admin, else mark PENDING
        is_admin = user.role == 'ADMIN' or user.is_superuser
        ver_status = SwimmingRecord.VerificationStatus.VERIFIED if is_admin else SwimmingRecord.VerificationStatus.PENDING
        verified_by = user if is_admin else None
        serializer.save(recorded_by=user, verification_status=ver_status, verified_by=verified_by)


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
