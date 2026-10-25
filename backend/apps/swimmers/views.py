from rest_framework import generics, permissions
from .models import SwimmerProfile
from .serializers import SwimmerProfileSerializer
from apps.accounts.permissions import IsAdminUserRole, IsOwnerSwimmerOrAdmin


class SwimmerListView(generics.ListCreateAPIView):
    """مدیریت شناگران توسط مدیر، یا مشاهده مشخصات توسط مدیر/ناظر"""
    queryset = SwimmerProfile.objects.all().select_related('current_level', 'user')
    serializer_class = SwimmerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
            qs = SwimmerProfile.objects.all().select_related('current_level', 'user')
            level = self.request.query_params.get('level')
            if level:
                qs = qs.filter(current_level_id=level)
            search = self.request.query_params.get('search')
            if search:
                qs = qs.filter(first_name__icontains=search) | qs.filter(last_name__icontains=search) | qs.filter(phone__icontains=search)
            return qs
        elif user.role == 'COACH':
            # Coach only sees swimmers enrolled in their assigned groups!
            coach_profile = getattr(user, 'coach_profile', None)
            if not coach_profile:
                return SwimmerProfile.objects.none()
            assigned_group_ids = coach_profile.assigned_groups.values_list('group_id', flat=True)
            return SwimmerProfile.objects.filter(
                enrollments__group_id__in=assigned_group_ids
            ).distinct().select_related('current_level', 'user')
        elif user.role == 'SWIMMER':
            return SwimmerProfile.objects.filter(user=user).select_related('current_level', 'user')
        return SwimmerProfile.objects.none()


class SwimmerDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SwimmerProfile.objects.all().select_related('current_level', 'user')
    serializer_class = SwimmerProfileSerializer
    permission_classes = [IsOwnerSwimmerOrAdmin]
