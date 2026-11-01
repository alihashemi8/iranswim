from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import generics, permissions, views, status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from .models import (
    NewsPost, NewsImage, SwimmingPool, PoolImage,
    Announcement, Notification, SupportTicket
)
from .serializers import (
    NewsPostSerializer, NewsImageSerializer,
    SwimmingPoolSerializer, PoolImageSerializer,
    AnnouncementSerializer, NotificationSerializer, SupportTicketSerializer
)
from apps.accounts.permissions import IsAdminUserRole


class NewsPostListView(generics.ListCreateAPIView):
    serializer_class = NewsPostSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

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
        author_val = self.request.user if self.request.user and self.request.user.is_authenticated else None
        
        # Auto slug if empty
        validated_data = serializer.validated_data
        title = validated_data.get('title', 'news')
        slug = validated_data.get('slug')
        if not slug:
            base_slug = slugify(title, allow_unicode=True) or 'news'
            validated_data['slug'] = f"{base_slug[:50]}-{timezone.now().strftime('%Y%m%d%H%M%S')}"

        post = serializer.save(author=author_val)

        # Handle multiple description images
        detail_files = self.request.FILES.getlist('detail_images')
        for idx, file in enumerate(detail_files):
            NewsImage.objects.create(news_post=post, image=file, order=idx)


class NewsPostDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = NewsPost.objects.all()
    serializer_class = NewsPostSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    lookup_field = 'slug'

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsAdminUserRole()]

    def perform_update(self, serializer):
        post = serializer.save()
        detail_files = self.request.FILES.getlist('detail_images')
        if detail_files:
            current_max = post.detail_images.aggregate(models.Max('order'))['order__max'] or 0
            for idx, file in enumerate(detail_files):
                NewsImage.objects.create(news_post=post, image=file, order=current_max + idx + 1)


class NewsImageDeleteView(generics.DestroyAPIView):
    """حذف یک تصویر شرح خبر به صورت تفکیک‌شده"""
    queryset = NewsImage.objects.all()
    permission_classes = [IsAdminUserRole]


def _ensure_initial_pools():
    """ثبت استخرهای شاخص قزوین در صورت عدم وجود رکورد در سیستم"""
    if SwimmingPool.objects.count() == 0:
        SwimmingPool.objects.bulk_create([
            SwimmingPool(
                name='استخر ۵۰ متری المپیک قزوین',
                slug='olympic-pool-qazvin',
                location='قزوین، شهرک کوثر، مجتمع ورزشی المپیک',
                description='مجموعه آبی المپیک مجهز به استخر مسابقاتی ۵۰ متری با ۱۰ خط، استاندارد برگزاری مسابقات رسمی فدراسیون شنا، سیستم پیشرفته گندزدایی ترکیبی ازن و کلر با کمترین میزان بوی گاز، آب زلال و مطبوع با عمق استاندارد.',
                facilities='استخر ۵۰ متری المپیک، سونای خشک و بخار فنلاندی، جکوزی ماساژوردار، حوضچه آب سرد، رختکن الکترونیک و پارکینگ اختصاصی',
                dimensions='۵۰ در ۲۵ متر (۱۰ لاین مسابقاتی)',
                depth='۱.۴۰ الی ۳.۸۰ متر',
                phone='۰۲۸-۳۳۶۵۲۰۰۱',
                display_order=1,
                is_active=True,
            ),
            SwimmingPool(
                name='استخر نیلگون انقلاب',
                slug='nilgoon-enghelab-pool',
                location='قزوین، میدان میرعماد، خیابان نادری شمالی',
                description='مرکز تخصصی آموزش ۴ شنا و رفع ترس کودکان با محیط بسیار تمیز و آب زلال و مطبوع ۳۰ درجه. محیطی آرام و استاندارد ویژه بانوان، کودکان و نوآموزان.',
                facilities='کاسه آموزشی اختصاصی، سونای بخار گیاهی، جکوزی ماساژوردار، بوفه سلامت و نجات غریق‌های مقیم فدراسیون',
                dimensions='۲۵ در ۱۲.۵ متر (۶ لاین)',
                depth='۰.۹۰ الی ۲.۲۰ متر',
                phone='۰۲۸-۳۳۳۴۱۰۰۲',
                display_order=2,
                is_active=True,
            ),
            SwimmingPool(
                name='استخر قهرمانی آزادی',
                slug='azadi-championship-pool',
                location='قزوین، سبزه میدان، مجموعه ورزشی جهان پهلوان تختی',
                description='پایگاه استعدادیابی و تمرینات تیم‌های منتخب شنای استان قزوین، مجهز به تجهیزات پیشرفته ثبت رکورد و تایم‌گیری دیجیتال و خطوط مجهز به طناب موج‌گیر.',
                facilities='لاین‌های اختصاصی تمرین سرعتی، تخته‌های شنا و فین، سالن بدنسازی خشک ویژه شناگران، سونای خشک',
                dimensions='۳۳ در ۱۵ متر',
                depth='۱.۲۰ الی ۲.۸۰ متر',
                phone='۰۲۸-۳۳۲۲۳۳۴۴',
                display_order=3,
                is_active=True,
            ),
            SwimmingPool(
                name='استخر آموزشی سرپوشیده نونهالان (آب‌پری)',
                slug='abpari-kids-pool',
                location='قزوین، بلوار دانشگاه، مجتمع آموزشی ورزشی دانشگاه',
                description='استخر ویژه کودکان و نونهالان با دمای کنترل‌شده ۳۱ درجه و سیستم بدون کلر شیمیایی جهت جلوگیری از هرگونه سوزش چشم یا حساسیت تنفسی نوآموزان.',
                facilities='کاسه شیب‌دار ایمن کودکان، بازوبند و نودل‌های فومی آلمانی، دوش‌های آبگرم اختصاصی کودکان و اتاق انتظار شیشه‌ای والدین',
                dimensions='۱۶ در ۸ متر',
                depth='۰.۷۰ الی ۱.۲۰ متر',
                phone='۰۲۸-۳۳۵۵۶۶۷۷',
                display_order=4,
                is_active=True,
            ),
        ])


class SwimmingPoolListView(generics.ListCreateAPIView):
    serializer_class = SwimmingPoolSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        _ensure_initial_pools()
        user = self.request.user
        if user and (getattr(user, 'role', '') in ['ADMIN', 'SUPERVISOR'] or getattr(user, 'is_superuser', False)):
            return SwimmingPool.objects.all().order_by('display_order', '-id')
        return SwimmingPool.objects.filter(is_active=True).order_by('display_order', '-id')

    def perform_create(self, serializer):
        name = serializer.validated_data.get('name', 'استخر')
        slug = serializer.validated_data.get('slug')
        if not slug:
            base_slug = slugify(name, allow_unicode=True) or 'pool'
            serializer.validated_data['slug'] = f"{base_slug[:50]}-{timezone.now().strftime('%Y%m%d%H%M%S')}"

        pool = serializer.save()
        gallery_files = self.request.FILES.getlist('gallery_images')
        for idx, file in enumerate(gallery_files):
            PoolImage.objects.create(pool=pool, image=file, order=idx)


class SwimmingPoolDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SwimmingPool.objects.all()
    serializer_class = SwimmingPoolSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    lookup_field = 'slug'

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsAdminUserRole()]

    def perform_update(self, serializer):
        pool = serializer.save()
        gallery_files = self.request.FILES.getlist('gallery_images')
        if gallery_files:
            current_max = pool.gallery_images.aggregate(models.Max('order'))['order__max'] or 0
            for idx, file in enumerate(gallery_files):
                PoolImage.objects.create(pool=pool, image=file, order=current_max + idx + 1)


class PoolImageDeleteView(generics.DestroyAPIView):
    """حذف تصویر گالری استخر به صورت مستقل"""
    queryset = PoolImage.objects.all()
    permission_classes = [IsAdminUserRole]


class PoolReorderView(APIView):
    """تنظیم گروهی ترتیب نمایش استخرها در سایت"""
    permission_classes = [IsAdminUserRole]

    def post(self, request):
        orders = request.data.get('orders', [])
        for item in orders:
            pool_id = item.get('id')
            order_val = item.get('display_order')
            if pool_id is not None and order_val is not None:
                SwimmingPool.objects.filter(id=pool_id).update(display_order=int(order_val))
        return Response({'status': 'success', 'message': 'ترتیب نمایش استخرها با موفقیت به‌روزرسانی شد.'})


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


class SupportTicketListView(generics.ListCreateAPIView):
    """ثبت و مشاهده تیکت‌های پشتیبانی شناگر و اولیا"""
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
            return SupportTicket.objects.all().select_related('user', 'swimmer').order_by('-created_at')
        return SupportTicket.objects.filter(user=user).select_related('user', 'swimmer').order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user
        swimmer_id = self.request.data.get('swimmer') or self.request.data.get('swimmer_id')
        swimmer = None
        if swimmer_id:
            from apps.swimmers.models import SwimmerProfile
            swimmer = SwimmerProfile.objects.filter(id=swimmer_id).first()
        elif hasattr(user, 'swimmer_profile') and user.swimmer_profile:
            swimmer = user.swimmer_profile

        ticket = serializer.save(user=user, swimmer=swimmer, status=SupportTicket.Status.SUBMITTED)

        # Notify academy admin
        Notification.objects.create(
            category=Notification.Category.ANNOUNCEMENT,
            title=f"تیکت پشتیبانی جدید: {ticket.subject}",
            message=f"تیکت جدیدی در موضوع {ticket.get_category_display()} توسط {user.full_name} ثبت گردید.",
            link='/admin/support',
            is_read=False
        )


class SupportTicketDetailView(generics.RetrieveUpdateAPIView):
    """مشاهده و پاسخ‌دهی به تیکت پشتیبانی"""
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
            return SupportTicket.objects.all()
        return SupportTicket.objects.filter(user=user)

    def perform_update(self, serializer):
        user = self.request.user
        if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
            response_text = self.request.data.get('response')
            new_status = self.request.data.get('status', SupportTicket.Status.ANSWERED)
            ticket = serializer.save(
                response=response_text or serializer.instance.response,
                status=new_status,
                responded_by=user,
                responded_at=timezone.now()
            )
            # Notify user
            Notification.objects.create(
                recipient=ticket.user,
                category=Notification.Category.ANNOUNCEMENT,
                title=f"پاسخ به تیکت: {ticket.subject}",
                message=f"پاسخ آموزشگاه: {ticket.response[:200]}",
                link='/swimmer/support',
                is_read=False
            )
        else:
            serializer.save()


