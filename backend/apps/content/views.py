from django.db import models
from django.db.models import Q
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import generics, permissions, views, status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import (
    NewsPost, NewsImage, SwimmingPool, PoolImage,
    Announcement, Notification, SupportTicket, LandingSection
)
from .serializers import (
    NewsPostSerializer, NewsImageSerializer,
    SwimmingPoolSerializer, PoolImageSerializer,
    AnnouncementSerializer, NotificationSerializer, SupportTicketSerializer,
    LandingSectionSerializer
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


def _get_visible_announcements(user):
    _ensure_initial_announcements()
    qs = Announcement.objects.all()
    if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
        return qs
    elif user.role == 'COACH':
        coach_profile = getattr(user, 'coach_profile', None)
        gender_filter = []
        if coach_profile and coach_profile.gender == 'MALE':
            gender_filter.append('COACHES_MALE')
        elif coach_profile and coach_profile.gender == 'FEMALE':
            gender_filter.append('COACHES_FEMALE')
        return qs.filter(audience__in=['ALL', 'COACHES', *gender_filter])
    elif user.role == 'SWIMMER':
        from apps.swimmers.utils import get_accessible_swimmer_ids
        from apps.swimmers.models import SwimmerProfile
        from apps.education.models import Enrollment
        ids = get_accessible_swimmer_ids(user)
        swimmers = list(SwimmerProfile.objects.filter(id__in=ids))
        group_ids = list(Enrollment.objects.filter(swimmer_id__in=ids).values_list('group_id', flat=True))
        gender_filter = []
        for sw in swimmers:
            if sw.gender == 'MALE' and 'SWIMMERS_MALE' not in gender_filter:
                gender_filter.append('SWIMMERS_MALE')
            elif sw.gender == 'FEMALE' and 'SWIMMERS_FEMALE' not in gender_filter:
                gender_filter.append('SWIMMERS_FEMALE')
        return qs.filter(
            Q(audience__in=['ALL', 'SWIMMERS', *gender_filter]) |
            Q(target_group_id__in=group_ids) |
            Q(target_groups__in=group_ids)
        ).distinct()
    return Announcement.objects.none()


class AnnouncementListView(generics.ListCreateAPIView):
    serializer_class = AnnouncementSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        return _get_visible_announcements(self.request.user)

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

    def get_queryset(self):
        return _get_visible_announcements(self.request.user)


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


def _get_user_notifications_qs(user):
    if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
        return Notification.objects.filter(
            models.Q(recipient=user) | models.Q(recipient__isnull=True)
        )
    return Notification.objects.filter(recipient=user)


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        _ensure_initial_notifications()
        return _get_user_notifications_qs(self.request.user).order_by('-created_at')

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
        qs = _get_user_notifications_qs(request.user)

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
        qs = _get_user_notifications_qs(request.user).filter(is_read=False)

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
            from apps.swimmers.utils import get_accessible_swimmer_ids
            if not (user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser):
                allowed_ids = get_accessible_swimmer_ids(user, self.request) or []
                try:
                    tid = int(swimmer_id)
                except (ValueError, TypeError):
                    raise PermissionDenied('شناسه شناگر نامعتبر است.')
                if tid not in allowed_ids:
                    raise PermissionDenied('شما اجازه ثبت تیکت برای این شناگر را ندارید.')
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


DEFAULT_LANDING_SECTIONS = [
    {
        'key': 'hero',
        'title': 'بنر اصلی و ورودی لندینگ',
        'subtitle': 'آموزش اصولی شنا از مبتدی تا پیشرفته در قزوین',
        'description': 'سربرگ لندینگ، تیتر اصلی، دکمه‌های ثبت‌نام، شماره تماس و جلوه بصری شناگر.',
        'display_order': 1,
        'is_enabled': True,
    },
    {
        'key': 'about',
        'title': 'ویژگی‌ها و مزایای آموزشگاه',
        'subtitle': 'چرا مدرسه شنای ایران؟',
        'description': 'کارت‌های سه‌گانه متد آموزش بدون ترس، اصلاح قامت، ساختار تنفس و استانداردهای فدراسیون.',
        'display_order': 2,
        'is_enabled': True,
    },
    {
        'key': 'courses',
        'title': 'دوره‌ها و کلاس‌های آموزشی شنا',
        'subtitle': 'برنامه آموزشی ترم جاری',
        'description': 'کاروسل دوره‌های فعال، ظرفیت‌های باقی‌مانده، رده سنی و شهریه ثبت‌نام.',
        'display_order': 3,
        'is_enabled': True,
    },
    {
        'key': 'pools',
        'title': 'استخرهای طرف قرارداد در قزوین',
        'subtitle': 'مجموعه‌های آبی و استخرهای استاندارد قزوین',
        'description': 'لیست استخرهای تحت پوشش قزوین، تصاویر گالری، ابعاد، عمق، مشخصات و آدرس دقیق.',
        'display_order': 4,
        'is_enabled': True,
    },
    {
        'key': 'facilities',
        'title': 'امکانات و شرایط بهداشتی استخرها',
        'subtitle': 'محیط استخر و بهداشت آب',
        'description': 'کارت‌های تصفیه مداوم، وسایل کمک‌آموزشی استاندارد، سونا و جکوزی و سانس‌های تفکیک‌شده.',
        'display_order': 5,
        'is_enabled': True,
    },
    {
        'key': 'coaches',
        'title': 'کادر مربیان رسمی فدراسیون',
        'subtitle': 'مربیان باسابقه و رسمی مدرسه شنای ایران',
        'description': 'کارت‌های پروفایل مربیان، فیلتر مربیان خانم و آقا، مدارک رسمی و سوابق ورزشی.',
        'display_order': 6,
        'is_enabled': True,
    },
    {
        'key': 'news',
        'title': 'اخبار، رویدادها و اطلاعیه‌ها',
        'subtitle': 'تازه‌ترین رویدادها و اطلاعیه‌های مدرسه شنای ایران',
        'description': 'اطلاعیه‌ها، تقویم زمان‌بندی ترم‌ها، آزمون‌های استعدادیابی و اخبار آموزشگاه.',
        'display_order': 7,
        'is_enabled': True,
    },
    {
        'key': 'cta',
        'title': 'بخش دعوت به اقدام و ثبت‌نام (CTA)',
        'subtitle': 'آماده‌اید شنا را اصولی و استاندارد شروع کنید؟',
        'description': 'باکس بنر انتهای صفحه، دکمه سریع ثبت‌نام در دوره‌ها و تماس با پذیرش آموزشگاه.',
        'display_order': 8,
        'is_enabled': True,
    },
]


def _ensure_initial_landing_sections():
    """ثبت یا به‌روزرسانی بخش‌های استاندارد صفحه لندینگ در صورت نبود رکورد"""
    existing_keys = set(LandingSection.objects.values_list('key', flat=True))
    to_create = []
    for item in DEFAULT_LANDING_SECTIONS:
        if item['key'] not in existing_keys:
            to_create.append(LandingSection(
                key=item['key'],
                title=item['title'],
                subtitle=item['subtitle'],
                description=item['description'],
                display_order=item['display_order'],
                is_enabled=item['is_enabled'],
            ))
    if to_create:
        LandingSection.objects.bulk_create(to_create)


class LandingSectionListView(generics.ListCreateAPIView):
    """لیست بخش‌های لندینگ جهت استعلام وضعیت نمایش یا ویرایش بخش‌ها"""
    serializer_class = LandingSectionSerializer
    pagination_class = None

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        _ensure_initial_landing_sections()
        return LandingSection.objects.all().order_by('display_order', 'id')

    def put(self, request, *args, **kwargs):
        """به‌روزرسانی گروهی وضعیت بخش‌ها"""
        sections_data = request.data.get('sections', [])
        if not isinstance(sections_data, list):
            return Response({'detail': 'فرمت داده نامعتبر است.'}, status=status.HTTP_400_BAD_REQUEST)

        updated_items = []
        for item in sections_data:
            key = item.get('key')
            if key and 'is_enabled' in item:
                section = LandingSection.objects.filter(key=key).first()
                if section:
                    section.is_enabled = bool(item['is_enabled'])
                    section.save(update_fields=['is_enabled', 'updated_at'])
                    updated_items.append(section)

        serializer = self.get_serializer(LandingSection.objects.all().order_by('display_order'), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LandingSectionDetailView(generics.RetrieveUpdateAPIView):
    """مشاهده یا تغییر وضعیت فعال/غیرفعال یک بخش مشخص بر اساس key"""
    serializer_class = LandingSectionSerializer
    lookup_field = 'key'
    queryset = LandingSection.objects.all()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsAdminUserRole()]


class LandingSectionToggleView(APIView):
    """سوئیچ سریع وضعیت فعال/غیرفعال بخش لندینگ توسط مدیر"""
    permission_classes = [IsAdminUserRole]

    def post(self, request, key):
        _ensure_initial_landing_sections()
        section = LandingSection.objects.filter(key=key).first()
        if not section:
            return Response({'detail': 'بخش مورد نظر یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        # Toggle or set explicit value if provided
        if 'is_enabled' in request.data:
            section.is_enabled = bool(request.data['is_enabled'])
        else:
            section.is_enabled = not section.is_enabled

        section.save(update_fields=['is_enabled', 'updated_at'])
        serializer = LandingSectionSerializer(section)
        return Response(serializer.data, status=status.HTTP_200_OK)



