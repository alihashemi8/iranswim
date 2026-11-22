from django.db import models
from django.db.models import Q, Count
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import generics, permissions, views, status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from apps.accounts.models import User
from .models import (
    NewsPost, NewsImage, SwimmingPool, PoolImage,
    Announcement, Notification, SupportTicket, TicketMessage, LandingSection,
    TopSwimmer
)
from .serializers import (
    NewsPostSerializer, NewsImageSerializer,
    SwimmingPoolSerializer, PoolImageSerializer,
    AnnouncementSerializer, NotificationSerializer, SupportTicketSerializer,
    TicketMessageSerializer,
    LandingSectionSerializer, TopSwimmerSerializer
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
    serializer_class = NewsPostSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    lookup_field = 'slug'

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        user = self.request.user
        if user and (getattr(user, 'role', '') in ['ADMIN', 'SUPERVISOR'] or getattr(user, 'is_superuser', False)):
            return NewsPost.objects.all()
        return NewsPost.objects.filter(status=NewsPost.Status.PUBLISHED, publish_at__lte=timezone.now())

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
    """ثبت و مشاهده تیکت‌های پشتیبانی کلیه نقش‌ها (مدیریت، مربی، شناگر) خطاب به ناظر فنی"""
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        qs = SupportTicket.objects.select_related('user', 'swimmer', 'responded_by').prefetch_related('messages__sender')

        # ناظر فنی و کاربر ارشد همه تیکت‌ها را می‌بینند
        if user.role == 'SUPERVISOR' or user.is_superuser:
            role_param = self.request.query_params.get('role')
            if role_param and role_param.upper() in ['ADMIN', 'COACH', 'SWIMMER']:
                qs = qs.filter(user__role=role_param.upper())

            mine = self.request.query_params.get('mine')
            if mine == 'true':
                qs = qs.filter(user=user)
        else:
            # سایر کاربران (مدیر، مربی، شناگر) فقط تیکت‌های ارسالی خودشان را مشاهده می‌کنند
            qs = qs.filter(user=user)

        # فیلترهای مشترک
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        category_param = self.request.query_params.get('category')
        if category_param:
            qs = qs.filter(category=category_param)

        priority_param = self.request.query_params.get('priority')
        if priority_param:
            qs = qs.filter(priority=priority_param)

        search = self.request.query_params.get('search')
        if search:
            search = search.strip()
            q_filter = (
                Q(subject__icontains=search) |
                Q(description__icontains=search) |
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__phone__icontains=search)
            )
            if search.isdigit():
                q_filter |= Q(id=int(search))
            qs = qs.filter(q_filter)

        return qs.order_by('-created_at')

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

        priority = self.request.data.get('priority') or SupportTicket.Priority.MEDIUM
        category = self.request.data.get('category') or SupportTicket.Category.TECHNICAL

        ticket = serializer.save(
            user=user,
            swimmer=swimmer,
            priority=priority,
            category=category,
            status=SupportTicket.Status.SUBMITTED
        )

        # ثبت اولین پیام در تاریخچه گفتگو
        TicketMessage.objects.create(
            ticket=ticket,
            sender=user,
            message=ticket.description,
            attachment=ticket.attachment
        )

        # اطلاع‌رسانی به ناظرین فنی سامانه
        supervisors = User.objects.filter(
            Q(role=User.Role.SUPERVISOR) | Q(is_superuser=True),
            is_active=True
        ).distinct()

        role_label = user.get_role_display()
        for sup in supervisors:
            if sup != user:
                Notification.objects.create(
                    recipient=sup,
                    category=Notification.Category.ANNOUNCEMENT,
                    title=f"تیکت پشتیبانی جدید: {ticket.subject}",
                    message=f"تیکت جدیدی در دسته‌بندی «{ticket.get_category_display()}» با اولویت «{ticket.get_priority_display()}» توسط {user.full_name} ({role_label}) ثبت گردید.",
                    link=f"/supervisor/tickets?id={ticket.id}",
                    is_read=False
                )


class SupportTicketDetailView(generics.RetrieveUpdateAPIView):
    """مشاهده، تغییر وضعیت و بروزرسانی تیکت پشتیبانی"""
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        qs = SupportTicket.objects.select_related('user', 'swimmer', 'responded_by').prefetch_related('messages__sender')
        if user.role == 'SUPERVISOR' or user.is_superuser:
            return qs
        return qs.filter(user=user)

    def perform_update(self, serializer):
        user = self.request.user
        ticket_before = self.get_object()

        if user.role == 'SUPERVISOR' or user.is_superuser:
            response_text = self.request.data.get('response')
            new_status = self.request.data.get('status', ticket_before.status)
            new_priority = self.request.data.get('priority', ticket_before.priority)

            update_kwargs = {
                'status': new_status,
                'priority': new_priority,
            }

            if response_text and response_text.strip() and response_text != ticket_before.response:
                update_kwargs['response'] = response_text.strip()
                update_kwargs['responded_by'] = user
                update_kwargs['responded_at'] = timezone.now()
                if new_status == SupportTicket.Status.SUBMITTED:
                    update_kwargs['status'] = SupportTicket.Status.ANSWERED

                # ثبت پیام پاسخ در تاریخچه
                TicketMessage.objects.create(
                    ticket=ticket_before,
                    sender=user,
                    message=response_text.strip()
                )

            ticket = serializer.save(**update_kwargs)

            # اطلاع‌رسانی به ارسال‌کننده تیکت در صورت پاسخ‌دهی
            if response_text and response_text.strip() and response_text != ticket_before.response:
                role = ticket.user.role
                user_link = '/admin/support' if role == 'ADMIN' else ('/coach/support' if role == 'COACH' else '/swimmer/support')
                Notification.objects.create(
                    recipient=ticket.user,
                    category=Notification.Category.ANNOUNCEMENT,
                    title=f"پاسخ ناظر فنی به تیکت: {ticket.subject}",
                    message=f"پاسخ ناظر فنی: {ticket.response[:150]}",
                    link=user_link,
                    is_read=False
                )
        else:
            # کاربر عادی می‌تواند تیکت خود را ببندد
            new_status = self.request.data.get('status')
            if new_status in [SupportTicket.Status.CLOSED, SupportTicket.Status.SUBMITTED]:
                serializer.save(status=new_status)
            else:
                serializer.save()


class SupportTicketReplyView(APIView):
    """ثبت پیام و پاسخ جدید در گفتگوی تیکت (توسط ناظر فنی یا ارسال‌کننده تیکت)"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, pk):
        user = request.user
        try:
            if user.role == 'SUPERVISOR' or user.is_superuser:
                ticket = SupportTicket.objects.select_related('user', 'swimmer').get(pk=pk)
            else:
                ticket = SupportTicket.objects.select_related('user', 'swimmer').get(pk=pk, user=user)
        except SupportTicket.DoesNotExist:
            return Response({'detail': 'تیکت مورد نظر یافت نشد یا شما دسترسی به آن ندارید.'}, status=status.HTTP_404_NOT_FOUND)

        message_text = request.data.get('message', '').strip()
        attachment = request.FILES.get('attachment')
        new_status = request.data.get('status')

        if not message_text and not attachment:
            return Response({'detail': 'لطفاً متن پیام یا فایل پیوست را وارد نمایید.'}, status=status.HTTP_400_BAD_REQUEST)

        # ایجاد پیام جدید در تیکت
        TicketMessage.objects.create(
            ticket=ticket,
            sender=user,
            message=message_text,
            attachment=attachment
        )

        is_supervisor_reply = (user.role == 'SUPERVISOR' or user.is_superuser)

        if is_supervisor_reply:
            ticket.response = message_text or ticket.response
            ticket.responded_by = user
            ticket.responded_at = timezone.now()
            ticket.status = new_status if new_status else SupportTicket.Status.ANSWERED
            ticket.save()

            # اطلاع به ارسال‌کننده تیکت
            if ticket.user != user:
                role = ticket.user.role
                user_link = '/admin/support' if role == 'ADMIN' else ('/coach/support' if role == 'COACH' else '/swimmer/support')
                Notification.objects.create(
                    recipient=ticket.user,
                    category=Notification.Category.ANNOUNCEMENT,
                    title=f"پاسخ ناظر فنی به تیکت #{ticket.id}",
                    message=f"ناظر فنی: {(message_text or 'فایل پیوست ارسال شد')[:140]}",
                    link=user_link,
                    is_read=False
                )
        else:
            # پاسخ توسط صاحب تیکت (مدیر، مربی، شناگر)
            if new_status:
                ticket.status = new_status
            elif ticket.status in [SupportTicket.Status.ANSWERED, SupportTicket.Status.CLOSED]:
                ticket.status = SupportTicket.Status.IN_PROGRESS
            ticket.save()

            # اطلاع به ناظرین فنی
            supervisors = User.objects.filter(
                Q(role=User.Role.SUPERVISOR) | Q(is_superuser=True),
                is_active=True
            ).distinct()
            role_label = user.get_role_display()
            for sup in supervisors:
                if sup != user:
                    Notification.objects.create(
                        recipient=sup,
                        category=Notification.Category.ANNOUNCEMENT,
                        title=f"پیام جدید در تیکت #{ticket.id}: {ticket.subject}",
                        message=f"{user.full_name} ({role_label}): {(message_text or 'فایل پیوست ارسال شد')[:140]}",
                        link=f"/supervisor/tickets?id={ticket.id}",
                        is_read=False
                    )

        serialized = SupportTicketSerializer(ticket, context={'request': request})
        return Response(serialized.data, status=status.HTTP_201_CREATED)


class SupportTicketStatsView(APIView):
    """آمار کلی تیکت‌های پشتیبانی برای داشبورد ناظر و کاربران"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role == 'SUPERVISOR' or user.is_superuser:
            qs = SupportTicket.objects.all()
        else:
            qs = SupportTicket.objects.filter(user=user)

        stats = {
            'total': qs.count(),
            'submitted': qs.filter(status=SupportTicket.Status.SUBMITTED).count(),
            'in_progress': qs.filter(status=SupportTicket.Status.IN_PROGRESS).count(),
            'need_info': qs.filter(status=SupportTicket.Status.NEED_INFO).count(),
            'answered': qs.filter(status=SupportTicket.Status.ANSWERED).count(),
            'closed': qs.filter(status=SupportTicket.Status.CLOSED).count(),
            'by_role': {
                'ADMIN': qs.filter(user__role='ADMIN').count(),
                'COACH': qs.filter(user__role='COACH').count(),
                'SWIMMER': qs.filter(user__role='SWIMMER').count(),
            },
            'by_priority': {
                'LOW': qs.filter(priority=SupportTicket.Priority.LOW).count(),
                'MEDIUM': qs.filter(priority=SupportTicket.Priority.MEDIUM).count(),
                'HIGH': qs.filter(priority=SupportTicket.Priority.HIGH).count(),
                'URGENT': qs.filter(priority=SupportTicket.Priority.URGENT).count(),
            }
        }
        return Response(stats)


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
        'title': 'شناگران برتر و قهرمانان مجموعه',
        'subtitle': 'معرفی قهرمانان و استعدادهای برتر مجموعه',
        'description': 'اسلایدر کاورفلو ۳ بعدی شناگران برتر، رکوردها، رده‌های سنی و افتخارات ورزشی.',
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

    # به‌روزرسانی عنوان بخش facilities به شناگران برتر در صورت وجود عنوان قدیمی
    LandingSection.objects.filter(key='facilities', title='امکانات و شرایط بهداشتی استخرها').update(
        title='شناگران برتر و قهرمانان مجموعه',
        subtitle='معرفی قهرمانان و استعدادهای برتر مجموعه',
        description='اسلایدر کاورفلو ۳ بعدی شناگران برتر، رکوردها، رده‌های سنی و افتخارات ورزشی.'
    )


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
                section = LandingSection.objects.filter(
                    Q(key=key) |
                    (Q(key='facilities') if key == 'top_swimmers' else Q()) |
                    (Q(key='top_swimmers') if key == 'facilities' else Q())
                ).first()
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

    def get_object(self):
        key = self.kwargs.get(self.lookup_field)
        section = LandingSection.objects.filter(
            Q(key=key) |
            (Q(key='facilities') if key == 'top_swimmers' else Q()) |
            (Q(key='top_swimmers') if key == 'facilities' else Q())
        ).first()
        if not section:
            from rest_framework.exceptions import NotFound
            raise NotFound('بخش مورد نظر یافت نشد.')
        return section


class LandingSectionToggleView(APIView):
    """سوئیچ سریع وضعیت فعال/غیرفعال بخش لندینگ توسط مدیر"""
    permission_classes = [IsAdminUserRole]

    def post(self, request, key):
        _ensure_initial_landing_sections()
        section = LandingSection.objects.filter(
            Q(key=key) |
            (Q(key='facilities') if key == 'top_swimmers' else Q()) |
            (Q(key='top_swimmers') if key == 'facilities' else Q())
        ).first()
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


def _ensure_initial_top_swimmers():
    """ثبت شناگران برتر اولیه مطابق با اسکرین‌شات و داده‌های واقعی آموزشگاه"""
    if TopSwimmer.objects.count() == 0:
        TopSwimmer.objects.bulk_create([
            TopSwimmer(
                name='محمد پارسا صفایی',
                role='پروانه',
                age='۱۵ تا ۱۷ سال',
                description='رکورددار ۱۰۰ متر پروانه',
                image='swimmers/top/safaei.jpg',
                display_order=1,
                is_active=True,
            ),
            TopSwimmer(
                name='کاوه راموز',
                role='استقامت سینه',
                age='۱۸ سال به بالا',
                description='قهرمان کشور',
                image='swimmers/top/ramooz.jpg',
                display_order=2,
                is_active=True,
            ),
            TopSwimmer(
                name='مازیار بگیان',
                role='پروانه رو',
                age='۱۸ سال به بالا',
                description='قهرمان کشور',
                image='swimmers/top/begian.jpg',
                display_order=3,
                is_active=True,
            ),
            TopSwimmer(
                name='فربد ترابی',
                role='پروانه رو',
                age='۱۸ سال به بالا',
                description='قهرمان کشور',
                image='swimmers/top/torabi.jpg',
                display_order=4,
                is_active=True,
            ),
            TopSwimmer(
                name='معراج توروه',
                role='قورباغه رو',
                age='۱۸ سال به بالا',
                description='قهرمان کشور و مسابقات بین‌المللی دبی',
                image='swimmers/top/toureh.jpg',
                display_order=5,
                is_active=True,
            ),
            TopSwimmer(
                name='پوریا سید جعفری',
                role='مختلط',
                age='۱۸ سال به بالا',
                description='قهرمان کشور',
                image='swimmers/top/jafari.jpg',
                display_order=6,
                is_active=True,
            ),
            TopSwimmer(
                name='امیر یعقوبی',
                role='مختلط',
                age='۱۳ تا ۱۴ سال',
                description='قهرمان کشور در رده سنی نوجوانان',
                image='swimmers/top/yaghoubi.jpg',
                display_order=7,
                is_active=True,
            ),
        ])


class TopSwimmerListView(generics.ListCreateAPIView):
    """لیست شناگران برتر جهت نمایش در لندینگ و ثبت شناگر جدید توسط مدیر"""
    serializer_class = TopSwimmerSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    pagination_class = None

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        _ensure_initial_top_swimmers()
        user = self.request.user
        if user and (getattr(user, 'role', '') in ['ADMIN', 'SUPERVISOR'] or getattr(user, 'is_superuser', False)):
            return TopSwimmer.objects.all().order_by('display_order', 'id')
        return TopSwimmer.objects.filter(is_active=True).order_by('display_order', 'id')


class TopSwimmerDetailView(generics.RetrieveUpdateDestroyAPIView):
    """مشاهده، ویرایش یا حذف یک شناگر برتر توسط مدیر"""
    serializer_class = TopSwimmerSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    queryset = TopSwimmer.objects.all()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsAdminUserRole()]


from django.http import HttpResponse, HttpResponseNotFound


class TopSwimmerReorderView(APIView):
    """مرتب‌سازی ترتیب نمایش شناگران برتر توسط مدیر"""
    permission_classes = [IsAdminUserRole]

    def post(self, request):
        orders = request.data.get('orders', [])
        if not isinstance(orders, list):
            return Response({'detail': 'لیست ارسالی نامعتبر است.'}, status=status.HTTP_400_BAD_REQUEST)

        for item in orders:
            swimmer_id = item.get('id')
            display_order = item.get('display_order')
            if swimmer_id is not None and display_order is not None:
                TopSwimmer.objects.filter(id=swimmer_id).update(display_order=display_order)

        swimmers = TopSwimmer.objects.all().order_by('display_order', 'id')
        serializer = TopSwimmerSerializer(swimmers, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class DynamicSitemapXmlView(APIView):
    """
    سایت‌مپ پویا استاندارد بر اساس آخرین دوره‌ها، استخرها و اخبار ثبت‌شده در دیتابیس
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        base_url = "https://iran-swim.ir"
        now_str = timezone.now().strftime("%Y-%m-%dT%H:%M:%S+03:30")

        static_routes = [
            ("", "1.0", "daily"),
            ("swimming-classes/", "0.9", "weekly"),
            ("courses/kids-swimming/", "0.9", "weekly"),
            ("courses/adults-swimming/", "0.9", "weekly"),
            ("courses/beginner-swimming/", "0.9", "weekly"),
            ("coaches/", "0.8", "monthly"),
            ("pricing/", "0.8", "weekly"),
            ("schedule/", "0.8", "weekly"),
            ("contact/", "0.8", "monthly"),
            ("blog/", "0.8", "daily"),
        ]

        xml_entries = []
        for path, priority, freq in static_routes:
            loc = f"{base_url}/{path}".rstrip("/") + ("/" if path else "/")
            xml_entries.append(
                f"  <url>\n"
                f"    <loc>{loc}</loc>\n"
                f"    <lastmod>{now_str}</lastmod>\n"
                f"    <changefreq>{freq}</changefreq>\n"
                f"    <priority>{priority}</priority>\n"
                f"  </url>"
            )

        # Dynamic news & articles (published and effective up to now)
        now = timezone.now()
        for post in NewsPost.objects.filter(status=NewsPost.Status.PUBLISHED, publish_at__lte=now):
            loc = f"{base_url}/blog/{post.slug}"
            lastmod = post.updated_at.strftime("%Y-%m-%dT%H:%M:%S+03:30") if post.updated_at else now_str
            xml_entries.append(
                f"  <url>\n"
                f"    <loc>{loc}</loc>\n"
                f"    <lastmod>{lastmod}</lastmod>\n"
                f"    <changefreq>monthly</changefreq>\n"
                f"    <priority>0.7</priority>\n"
                f"  </url>"
            )

        xml_content = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + "\n".join(xml_entries)
            + "\n</urlset>"
        )
        return HttpResponse(xml_content, content_type="application/xml; charset=utf-8")


def blog_article_resolver_view(request, slug):
    """
    اعتبارسنجی اسلاگ مقاله برای وب‌سرور Nginx:
    در صورت وجود و انتشار قطعی مقاله تا لحظه فعلی، پاسخ ۲۰۰ با هدر X-Accel-Redirect به Nginx جهت سرو index.html ارسال می‌شود.
    در صورت عدم وجود مقاله، وضعیت پیش‌نویس (DRAFT)، بایگانی (ARCHIVED) یا انتشار آینده، خطای واقعی ۴۰۴ صادر می‌شود تا از رخداد Soft 404 جلوگیری گردد.
    """
    clean_slug = slug.strip().rstrip('/')
    now = timezone.now()
    exists = NewsPost.objects.filter(
        slug=clean_slug,
        status=NewsPost.Status.PUBLISHED,
        publish_at__lte=now
    ).exists()
    if not exists:
        return HttpResponseNotFound("Article Not Found")

    response = HttpResponse(content_type="text/html; charset=utf-8")
    response['X-Accel-Redirect'] = '/internal_spa/index.html'
    return response


class DynamicRobotsTxtView(APIView):
    """
    سرویس robots.txt استاندارد به همراه آدرس سایت‌مپ رسمی و دسترسی کرالرها به APIهای عمومی
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        content = (
            "# robots.txt for IranSwim (https://iran-swim.ir)\n"
            "User-agent: *\n"
            "Allow: /\n"
            "Allow: /swimming-classes/\n"
            "Allow: /courses/\n"
            "Allow: /courses/kids-swimming/\n"
            "Allow: /courses/adults-swimming/\n"
            "Allow: /courses/beginner-swimming/\n"
            "Allow: /coaches/\n"
            "Allow: /pricing/\n"
            "Allow: /schedule/\n"
            "Allow: /contact/\n"
            "Allow: /blog/\n"
            "Allow: /assets/\n"
            "Allow: /images/\n"
            "Allow: /fonts/\n\n"
            "# Allow public read-only API endpoints required for client-side rendering\n"
            "Allow: /api/education/courses/\n"
            "Allow: /api/coaches/\n"
            "Allow: /api/content/\n"
            "Allow: /api/leagues/public/\n\n"
            "# Disallow authenticated private panels and system operations\n"
            "Disallow: /admin/\n"
            "Disallow: /coach/\n"
            "Disallow: /swimmer/\n"
            "Disallow: /supervisor/\n"
            "Disallow: /api/\n"
            "Disallow: /login\n"
            "Disallow: /register\n\n"
            "# Disallow session / tracking query strings\n"
            "Disallow: /*?*token=\n"
            "Disallow: /*?*session=\n\n"
            "# Authoritative XML Sitemap\n"
            "Sitemap: https://iran-swim.ir/sitemap.xml\n"
        )
        return HttpResponse(content, content_type="text/plain; charset=utf-8")





