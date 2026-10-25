from rest_framework import generics, permissions
from .models import NewsPost, Announcement
from .serializers import NewsPostSerializer, AnnouncementSerializer
from apps.accounts.permissions import IsAdminUserRole


class NewsPostListView(generics.ListCreateAPIView):
    serializer_class = NewsPostSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        user = self.request.user
        if user and (getattr(user, 'role', '') in ['ADMIN', 'SUPERVISOR'] or getattr(user, 'is_superuser', False)):
            return NewsPost.objects.all().order_by('-publish_at')
        return NewsPost.objects.filter(status=NewsPost.Status.PUBLISHED).order_by('-publish_at')

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class NewsPostDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = NewsPost.objects.all()
    serializer_class = NewsPostSerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsAdminUserRole()]


class AnnouncementListView(generics.ListCreateAPIView):
    serializer_class = AnnouncementSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        user = self.request.user
        qs = Announcement.objects.all()
        if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
            return qs
        elif user.role == 'COACH':
            return qs.filter(audience__in=['ALL', 'COACHES'])
        elif user.role == 'SWIMMER':
            swimmer = getattr(user, 'swimmer_profile', None)
            group_ids = swimmer.enrollments.values_list('group_id', flat=True) if swimmer else []
            return qs.filter(audience__in=['ALL', 'SWIMMERS']) | qs.filter(target_group_id__in=group_ids)
        return Announcement.objects.none()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
