from rest_framework import generics, permissions
from .models import CoachProfile
from .serializers import CoachProfileSerializer
from apps.accounts.permissions import IsAdminUserRole


class CoachListView(generics.ListCreateAPIView):
    queryset = CoachProfile.objects.all().select_related('user')
    serializer_class = CoachProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = CoachProfile.objects.all().select_related('user')
        status = self.request.query_params.get('status')
        if status:
            qs = qs.filter(employment_status=status)
        return qs


class CoachDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CoachProfile.objects.all().select_related('user')
    serializer_class = CoachProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
