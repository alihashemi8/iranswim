from django.db import models
from rest_framework import generics, permissions, views, status
from rest_framework.response import Response
from .models import NewsPost, Announcement, Notification
from .serializers import NewsPostSerializer, AnnouncementSerializer, NotificationSerializer
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


def _ensure_initial_announcements():
    """Ensure baseline operational announcements exist in the database."""
    if Announcement.objects.count() == 0:
        Announcement.objects.bulk_create([
            Announcement(
                title='جلسه توجیهی مسابقات استانی شنا',
                message='شناگران عضو لیگ روز شنبه ساعت ۱۸ جهت دریافت کارت مسابقات و هماهنگی نهایی در دفتر آکادمی حاضر شوند.',
                audience=Announcement.Audience.ALL,
                is_pinned=True,
            ),
            Announcement(
                title='ضوابط بهداشتی و ایمنی استخر در فصل پاییز',
                message='استفاده از کلاه شنا، عینک استاندارد و دوش قبل از ورود به کاسه استخر برای تمامی شناگران الزامی است.',
                audience=Announcement.Audience.ALL,
                is_pinned=False,
            ),
            Announcement(
                title='جلسه هماهنگی کادر مربیان آکادمی',
                message='جلسه بررسی رکوردهای ثبت‌شده و ارزیابی هفتگی شناگران روز پنج‌شنبه برگزار خواهد شد.',
                audience=Announcement.Audience.COACHES,
                is_pinned=False,
            ),
        ])


class AnnouncementListView(generics.ListCreateAPIView):
    serializer_class = AnnouncementSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        _ensure_initial_announcements()
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
        announcement = serializer.save(created_by=self.request.user)
        # Automatically connect announcement to the notification system so users receive an alert!
        Notification.objects.create(
            category=Notification.Category.ANNOUNCEMENT,
            title=f"اعلان جدید: {announcement.title}",
            message=announcement.message[:250],
            link='/admin/announcements' if self.request.user.role == 'ADMIN' else '/',
            is_read=False,
            recipient=None,
        )


class AnnouncementDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [IsAdminUserRole()]


def _ensure_initial_notifications():
    """Ensure baseline operational notifications exist across all 4 system categories."""
    if Notification.objects.count() == 0:
        Notification.objects.bulk_create([
            Notification(
                category=Notification.Category.REGISTRATION,
                title='درخواست ثبت‌نام جدید شناگر',
                message='یک درخواست ثبت‌نام جدید در سامانه ثبت شده و در انتظار بررسی و تأیید مدارک است.',
                link='/admin/swimmers',
                is_read=False,
            ),
            Notification(
                category=Notification.Category.PAYMENT,
                title='سررسید پرداخت اقساط شهریه',
                message='قسط دوم شهریه شناگران دوره پاییزه سررسید شده و نیازمند پیگیری امور مالی است.',
                link='/admin/finance',
                is_read=False,
            ),
            Notification(
                category=Notification.Category.SCHEDULE,
                title='تغییر در زمان‌بندی و سانس استخر',
                message='سانس روز پنج‌شنبه استخر به دلیل برگزاری مسابقات استانی جابجا گردید.',
                link='/admin/sessions',
                is_read=False,
            ),
            Notification(
                category=Notification.Category.ANNOUNCEMENT,
                title='بخشنامه جدید هیئت شنا',
                message='دستورالعمل بهداشتی و ضوابط آزمون رکوردهای تیمی به سامانه ابلاغ گردید.',
                link='/admin/announcements',
                is_read=False,
            ),
        ])


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        _ensure_initial_notifications()
        user = self.request.user
        # All authenticated users (Admin, Supervisor, Coach, Swimmer) can see broadcast notifications
        return Notification.objects.filter(
            models.Q(recipient=user) | models.Q(recipient__isnull=True)
        ).order_by('-created_at')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        unread_count = queryset.filter(is_read=False).count()
        return Response({
            'unread_count': unread_count,
            'results': serializer.data,
        })


class NotificationMarkReadView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        qs = Notification.objects.filter(models.Q(recipient=user) | models.Q(recipient__isnull=True))

        try:
            notif = qs.get(pk=pk)
            notif.is_read = True
            notif.save(update_fields=['is_read'])
            return Response({'id': notif.id, 'is_read': True})
        except Notification.DoesNotExist:
            return Response({'detail': 'اعلان یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)


class NotificationMarkAllReadView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        qs = Notification.objects.filter(
            models.Q(recipient=user) | models.Q(recipient__isnull=True),
            is_read=False
        )

        count = qs.update(is_read=True)
        return Response({'marked_count': count, 'success': True})

