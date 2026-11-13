import os
import mimetypes
from django.conf import settings
from django.db.models import Count, Q
from django.core.paginator import InvalidPage, EmptyPage
from django.http import FileResponse, HttpResponse
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import NotFound, PermissionDenied
from .models import SwimmerProfile, SwimmerGuardianRelation, DocumentStatus
from .serializers import SwimmerProfileSerializer, CoachSwimmerSerializer, SwimmerGuardianRelationSerializer
from .utils import get_accessible_swimmer_ids
from apps.accounts.permissions import IsAdminUserRole, IsOwnerSwimmerOrAdmin


def get_accessible_swimmer_profile(user, swimmer_id=None):
    """Retrieve swimmer profile accessible by user (either self or guardian)"""
    if swimmer_id:
        try:
            profile = SwimmerProfile.objects.get(id=swimmer_id)
            if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
                return profile
            if profile.user == user:
                return profile
            if SwimmerGuardianRelation.objects.filter(guardian=user, swimmer=profile, is_verified=True).exists():
                return profile
        except SwimmerProfile.DoesNotExist:
            pass

    # Check verified guardian relations first
    relation = SwimmerGuardianRelation.objects.filter(guardian=user, is_verified=True).first()
    if relation:
        return relation.swimmer

    # Fallback to direct user profile
    profile = getattr(user, 'swimmer_profile', None)
    if not profile:
        profile = SwimmerProfile.objects.create(
            user=user,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            national_id=user.national_id or ''
        )
    # Ensure relation exists
    SwimmerGuardianRelation.objects.get_or_create(
        guardian=user,
        swimmer=profile,
        defaults={'relationship_type': 'SELF', 'is_primary': True, 'is_verified': True}
    )
    return profile


class SwimmerMeView(APIView):
    """مشاهده و ویرایش پرونده شناگر جاری واردشده یا فرزند انتخاب‌شده"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        swimmer_id = self.request.query_params.get('swimmer_id') or self.request.headers.get('X-Swimmer-Id')
        profile = get_accessible_swimmer_profile(self.request.user, swimmer_id)
        if swimmer_id and not (self.request.user.role in ['ADMIN', 'SUPERVISOR'] or self.request.user.is_superuser):
            if str(profile.id) != str(swimmer_id):
                raise PermissionDenied('شما اجازه دسترسی به پرونده این شناگر را ندارید.')
        return profile

    def get(self, request):
        profile = self.get_object()
        serializer = SwimmerProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        profile = self.get_object()
        serializer = SwimmerProfileSerializer(profile, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class SwimmerChildrenView(APIView):
    """مدیریت فرزندان متصل به حساب والد (مشاهده لیست و ثبت فرزند دوم/جدید)"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        user = request.user
        # Auto-link direct profile if not linked yet
        if hasattr(user, 'swimmer_profile') and user.swimmer_profile:
            SwimmerGuardianRelation.objects.get_or_create(
                guardian=user,
                swimmer=user.swimmer_profile,
                defaults={'relationship_type': 'SELF', 'is_primary': True, 'is_verified': True}
            )

        relations = SwimmerGuardianRelation.objects.filter(
            guardian=user,
            is_verified=True
        ).select_related('swimmer', 'swimmer__current_level')
        serializer = SwimmerGuardianRelationSerializer(relations, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        user = request.user
        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()
        national_id = request.data.get('national_id', '').strip()
        relationship_type = request.data.get('relationship_type', 'GUARDIAN')
        gender = request.data.get('gender', 'MALE')

        if not first_name or not last_name:
            return Response({'detail': 'نام و نام خانوادگی فرزند الزامی است.'}, status=status.HTTP_400_BAD_REQUEST)

        # Create new swimmer profile for child
        child_profile = SwimmerProfile.objects.create(
            user=None, # Child does not need an independent user login yet
            first_name=first_name,
            last_name=last_name,
            national_id=national_id,
            gender=gender,
            father_phone=user.phone if relationship_type == 'FATHER' else '',
            mother_phone=user.phone if relationship_type == 'MOTHER' else '',
            is_profile_completed=False
        )

        relation = SwimmerGuardianRelation.objects.create(
            guardian=user,
            swimmer=child_profile,
            relationship_type=relationship_type,
            is_primary=True,
            is_verified=True
        )

        return Response(SwimmerGuardianRelationSerializer(relation, context={'request': request}).data, status=status.HTTP_201_CREATED)


class SwimmerCompleteProfileView(APIView):
    """اعتبارسنجی و ثبت نهایی مدارک و تکمیل پرونده هویتی شناگر"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        user = request.user
        swimmer_id = request.data.get('swimmer_id') or request.query_params.get('swimmer_id')
        profile = get_accessible_swimmer_profile(user, swimmer_id)
        if swimmer_id and not (user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser):
            if str(profile.id) != str(swimmer_id):
                raise PermissionDenied('شما اجازه دسترسی به پرونده این شناگر را ندارید.')

        serializer = SwimmerProfileSerializer(profile, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()

        # Update document statuses to PENDING if newly uploaded or previously unuploaded
        if profile.birth_certificate_image and profile.birth_certificate_status in [DocumentStatus.UNUPLOADED, DocumentStatus.REVISION_REQUIRED]:
            profile.birth_certificate_status = DocumentStatus.PENDING
        if profile.national_card_image and profile.national_card_status in [DocumentStatus.UNUPLOADED, DocumentStatus.REVISION_REQUIRED]:
            profile.national_card_status = DocumentStatus.PENDING
        if profile.sports_insurance_image and profile.sports_insurance_status in [DocumentStatus.UNUPLOADED, DocumentStatus.REVISION_REQUIRED]:
            profile.sports_insurance_status = DocumentStatus.PENDING

        # Check all required fields specified by user:
        missing = []
        if not profile.first_name or not profile.last_name:
            missing.append('نام و نام خانوادگی')
        if not profile.date_of_birth:
            missing.append('تاریخ تولد')
        if not profile.father_name:
            missing.append('نام پدر')
        if not profile.national_id or len(profile.national_id.strip()) != 10:
            missing.append('کد ملی ۱۰ رقمی معتبر')
        if not profile.school_name:
            missing.append('نام مدرسه')
        if not profile.avatar:
            missing.append('عکس پرسنلی شناگر')
        if not profile.address:
            missing.append('آدرس منزل')
        if not profile.father_phone:
            missing.append('شماره تماس پدر')
        if not profile.father_job or not profile.father_job.strip():
            missing.append('شغل پدر')
        if not profile.mother_phone:
            missing.append('شماره تماس مادر')
        if not profile.mother_job or not profile.mother_job.strip():
            missing.append('شغل مادر')
        if not profile.gender:
            missing.append('جنسیت')
        if not profile.birth_certificate_image:
            missing.append('عکس صفحه اول شناسنامه')
        if not profile.national_card_image:
            missing.append('عکس کارت ملی')
        if not profile.sports_insurance_image:
            missing.append('عکس بیمه ورزشی')

        if missing:
            profile.save()
            return Response({
                'detail': f'تکمیل موارد ستاره‌دار زیر الزامی است: {", ".join(missing)}',
                'missing_fields': missing
            }, status=status.HTTP_400_BAD_REQUEST)

        profile.is_profile_completed = True
        profile.save()

        # Synchronize first_name, last_name, and national_id with linked User account
        if profile.user:
            user_updated = False
            if profile.first_name and profile.user.first_name != profile.first_name:
                profile.user.first_name = profile.first_name
                user_updated = True
            if profile.last_name and profile.user.last_name != profile.last_name:
                profile.user.last_name = profile.last_name
                user_updated = True
            if profile.national_id and profile.user.national_id != profile.national_id:
                profile.user.national_id = profile.national_id
                user_updated = True
            if user_updated:
                profile.user.save()

        # Send notification to admins about newly submitted/updated documents
        from apps.accounts.models import User
        from apps.content.models import Notification

        admin_users = list(User.objects.filter(role__in=['ADMIN', 'SUPERVISOR'], is_active=True))
        notification_title = f'ارسال مدارک هویتی توسط شناگر: {profile.full_name}'
        notification_msg = f'شناگر «{profile.full_name}» مدارک هویتی خود (شناسنامه، کارت ملی، بیمه ورزشی) را ارسال نموده و در انتظار بررسی و تأیید مدیریت است.'
        notification_link = f'/admin/swimmers/{profile.id}#documents'

        if admin_users:
            Notification.objects.bulk_create([
                Notification(
                    recipient=admin,
                    category=Notification.Category.REGISTRATION,
                    title=notification_title,
                    message=notification_msg,
                    link=notification_link,
                    is_read=False,
                )
                for admin in admin_users
            ])
        else:
            Notification.objects.create(
                recipient=None,
                category=Notification.Category.REGISTRATION,
                title=notification_title,
                message=notification_msg,
                link=notification_link,
                is_read=False,
            )

        return Response({
            'detail': 'پرونده هویتی و مدارک شناگر با موفقیت تکمیل و ثبت نهایی شد.',
            'profile': SwimmerProfileSerializer(profile, context={'request': request}).data
        }, status=status.HTTP_200_OK)


class SwimmerPagination(PageNumberPagination):
    """صفحه‌بندی اختصاصی شناگران به صورت پیش‌فرض ۱۰ موردی همراه با متادیتای خلاصه وضعیت‌ها"""
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

    def paginate_queryset(self, queryset, request, view=None):
        all_param = str(request.query_params.get('all', '')).lower()
        page_size_param = str(request.query_params.get('page_size', '')).lower()
        if all_param in ['true', '1'] or page_size_param == 'all':
            return None

        try:
            return super().paginate_queryset(queryset, request, view)
        except (NotFound, InvalidPage, EmptyPage):
            page_size = self.get_page_size(request)
            paginator = self.django_paginator_class(queryset, page_size)
            self.request = request
            if paginator.count == 0:
                self.page = paginator.page(1)
            else:
                self.page = paginator.page(paginator.num_pages)
            return list(self.page)

    def get_paginated_response(self, data):
        counts = getattr(self, 'counts_summary', {})
        return Response({
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'page_size': self.get_page_size(self.request),
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'counts': counts,
            'results': data
        })


class SwimmerListView(generics.ListCreateAPIView):
    """مدیریت شناگران توسط مدیر، یا مشاهده مشخصات توسط مدیر/ناظر/مربی"""
    queryset = SwimmerProfile.objects.all().select_related('current_level', 'user').prefetch_related(
        'enrollments__course', 'enrollments__coach__user', 'enrollments__group'
    )
    serializer_class = SwimmerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = SwimmerPagination

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUserRole()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        user = self.request.user
        if user and user.is_authenticated and user.role == 'COACH':
            return CoachSwimmerSerializer
        return SwimmerProfileSerializer

    def _get_coach_swimmer_queryset(self, user):
        coach_profile = getattr(user, 'coach_profile', None)
        if not coach_profile:
            return SwimmerProfile.objects.none()
        from django.utils import timezone
        today = timezone.localdate()
        assigned_group_ids = coach_profile.assigned_groups.filter(
            Q(assigned_to__isnull=True) | Q(assigned_to__gte=today)
        ).values_list('group_id', flat=True)
        return SwimmerProfile.objects.filter(
            Q(enrollments__group_id__in=assigned_group_ids) |
            Q(enrollments__coach=coach_profile)
        ).distinct()

    def get_queryset(self):
        user = self.request.user
        is_privileged = bool(user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser)

        if is_privileged:
            qs = SwimmerProfile.objects.all()
        elif user.role == 'COACH':
            qs = self._get_coach_swimmer_queryset(user)
        elif user.role == 'SWIMMER':
            ids = get_accessible_swimmer_ids(user, self.request)
            qs = SwimmerProfile.objects.filter(id__in=ids)
        else:
            return SwimmerProfile.objects.none()

        # Filter by level
        level = self.request.query_params.get('level')
        if level:
            qs = qs.filter(current_level_id=level)

        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param == 'ACTIVE':
            qs = qs.filter(is_active=True)
        elif status_param == 'INACTIVE':
            qs = qs.filter(is_active=False)
        elif status_param == 'DOCS_PENDING':
            if not is_privileged:
                return qs.none()
            docs_pending_q = (
                Q(birth_certificate_status=DocumentStatus.PENDING) |
                Q(national_card_status=DocumentStatus.PENDING) |
                Q(sports_insurance_status=DocumentStatus.PENDING) |
                (
                    Q(is_profile_completed=False) &
                    (
                        ~Q(birth_certificate_image='') |
                        ~Q(national_card_image='') |
                        ~Q(sports_insurance_image='')
                    )
                )
            )
            qs = qs.filter(docs_pending_q)

        # Filter by search (restrict sensitive identity/contact search strictly to Admin & Supervisor)
        search = self.request.query_params.get('search', '').strip()
        if search:
            if is_privileged:
                qs = qs.filter(
                    Q(first_name__icontains=search) |
                    Q(last_name__icontains=search) |
                    Q(phone__icontains=search) |
                    Q(national_id__icontains=search) |
                    Q(emergency_contact_name__icontains=search)
                )
            else:
                qs = qs.filter(
                    Q(first_name__icontains=search) |
                    Q(last_name__icontains=search)
                )

        return qs.select_related('current_level', 'user').prefetch_related(
            'enrollments__course', 'enrollments__coach__user', 'enrollments__group'
        ).order_by('last_name', 'first_name', 'id')

    def list(self, request, *args, **kwargs):
        # Calculate summary counts for tab counters
        user = request.user
        is_privileged = bool(user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser)
        if is_privileged:
            base_qs = SwimmerProfile.objects.all()
        elif user.role == 'COACH':
            base_qs = self._get_coach_swimmer_queryset(user)
        elif user.role == 'SWIMMER':
            ids = get_accessible_swimmer_ids(user, request)
            base_qs = SwimmerProfile.objects.filter(id__in=ids)
        else:
            base_qs = SwimmerProfile.objects.none()

        docs_pending_q = (
            Q(birth_certificate_status=DocumentStatus.PENDING) |
            Q(national_card_status=DocumentStatus.PENDING) |
            Q(sports_insurance_status=DocumentStatus.PENDING) |
            (
                Q(is_profile_completed=False) &
                (
                    ~Q(birth_certificate_image='') |
                    ~Q(national_card_image='') |
                    ~Q(sports_insurance_image='')
                )
            )
        )

        agg_kwargs = {
            'total': Count('id'),
            'active': Count('id', filter=Q(is_active=True)),
            'inactive': Count('id', filter=Q(is_active=False)),
        }
        if is_privileged:
            agg_kwargs['docs_pending'] = Count('id', filter=docs_pending_q)

        counts_summary = base_qs.aggregate(**agg_kwargs)
        if not is_privileged:
            counts_summary['docs_pending'] = 0

        if self.paginator:
            self.paginator.counts_summary = counts_summary

        return super().list(request, *args, **kwargs)


class SwimmerDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SwimmerProfile.objects.all().select_related('current_level', 'user')
    serializer_class = SwimmerProfileSerializer
    permission_classes = [IsOwnerSwimmerOrAdmin]

    def get_permissions(self):
        if self.request.method == 'DELETE':
            return [IsAdminUserRole()]
        return [IsOwnerSwimmerOrAdmin()]


class SwimmerAssignCoachView(APIView):
    """
    تخصیص یا تغییر مربی یک شناگر در دوره فعال یا مشخص
    """
    permission_classes = [IsAdminUserRole]

    def post(self, request, pk):
        try:
            swimmer = SwimmerProfile.objects.get(pk=pk)
        except SwimmerProfile.DoesNotExist:
            return Response({'detail': 'شناگر یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        coach_id = request.data.get('coach_id')
        group_id = request.data.get('group_id')
        course_id = request.data.get('course_id')

        from apps.coaches.models import CoachProfile
        from apps.education.models import Enrollment, Course, SwimmerGroup, SkillLevel, GroupCoach
        from apps.supervisor.models import AuditLog

        target_group = None
        if group_id:
            try:
                target_group = SwimmerGroup.objects.select_related('course').get(pk=group_id)
                if not course_id and target_group.course:
                    course_id = target_group.course.id
            except SwimmerGroup.DoesNotExist:
                return Response({'detail': 'کلاس مورد نظر یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        coach = None
        if coach_id:
            try:
                coach = CoachProfile.objects.get(pk=coach_id)
            except CoachProfile.DoesNotExist:
                return Response({'detail': 'مربی مورد نظر یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)
        elif target_group:
            primary_gc = target_group.coach_assignments.filter(is_primary=True).first()
            if primary_gc:
                coach = primary_gc.coach
            else:
                gc = target_group.coach_assignments.first()
                if gc:
                    coach = gc.coach

        target_course = None
        if target_group and target_group.course:
            target_course = target_group.course
        elif course_id:
            target_course = Course.objects.filter(pk=course_id).first()

        enrollment = None
        if target_course:
            enrollment = Enrollment.objects.filter(swimmer=swimmer, course=target_course).first()
        if not enrollment:
            enrollment = swimmer.enrollments.filter(status='ACTIVE').first()
        if not enrollment:
            enrollment = swimmer.enrollments.first()

        if not enrollment:
            if not target_course:
                target_course = Course.objects.first()
            if not target_course:
                return Response({'detail': 'دوره‌ای برای ثبت‌نام شناگر تعریف نشده است.'}, status=status.HTTP_400_BAD_REQUEST)
            enrollment = Enrollment.objects.create(
                swimmer=swimmer,
                course=target_course,
                status='ACTIVE'
            )
        elif target_course and enrollment.course != target_course:
            existing_target_enr = Enrollment.objects.filter(swimmer=swimmer, course=target_course).first()
            if existing_target_enr:
                enrollment = existing_target_enr
            else:
                enrollment.course = target_course

        if target_group:
            enrollment.group = target_group
            enrollment.coach = coach
            enrollment.status = 'ACTIVE'
        elif coach:
            enrollment.coach = coach
            enrollment.status = 'ACTIVE'
            if enrollment.course:
                target_group = SwimmerGroup.objects.filter(
                    course=enrollment.course,
                    coach_assignments__coach=coach
                ).first()
                if not target_group:
                    target_group, _ = SwimmerGroup.objects.get_or_create(
                        course=enrollment.course,
                        name=f"کلاس مربی {coach.full_name}",
                        defaults={
                            'skill_level': SkillLevel.objects.first(),
                            'capacity': 15,
                            'pool_location': enrollment.course.pool_location or 'استخر شهید رئیسی',
                            'status': SwimmerGroup.Status.OPEN
                        }
                    )
                    GroupCoach.objects.get_or_create(
                        group=target_group,
                        coach=coach,
                        defaults={'is_primary': True, 'assigned_from': enrollment.course.start_date}
                    )
                enrollment.group = target_group
        else:
            enrollment.coach = None
            enrollment.group = None

        enrollment.save()

        AuditLog.objects.create(
            actor=request.user,
            action=AuditLog.Action.ENROLLMENT_CREATE,
            entity_type='Enrollment',
            entity_id=str(enrollment.id),
            details={
                'swimmer': swimmer.full_name,
                'course': enrollment.course.name if enrollment.course else '',
                'coach': coach.full_name if coach else 'تعیین‌نشده',
                'group': enrollment.group.name if enrollment.group else 'تعیین‌نشده'
            }
        )

        return Response(SwimmerProfileSerializer(swimmer, context={'request': request}).data)


class SwimmerReviewDocumentsView(APIView):
    """
    تأیید یا رد مدارک هویتی شناگر (گام سوم) توسط مدیر آموزشگاه همراه با ثبت توضیحات و ارسال اعلان به شناگر
    """
    permission_classes = [IsAdminUserRole]

    def post(self, request, pk):
        try:
            swimmer = SwimmerProfile.objects.select_related('user').get(pk=pk)
        except SwimmerProfile.DoesNotExist:
            return Response({'detail': 'شناگر یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')  # 'APPROVE' or 'REJECT'
        reason = request.data.get('reason', '').strip()

        if action not in ['APPROVE', 'REJECT']:
            return Response({'detail': 'نوع عملیات نامعتبر است (باید APPROVE یا REJECT باشد).'}, status=status.HTTP_400_BAD_REQUEST)

        from apps.content.models import Notification
        from apps.supervisor.models import AuditLog

        # Find all recipient users (direct swimmer account or guardians)
        recipient_users = set()
        if swimmer.user:
            recipient_users.add(swimmer.user)
        for rel in swimmer.guardian_relations.select_related('guardian').all():
            if rel.guardian:
                recipient_users.add(rel.guardian)

        if action == 'APPROVE':
            swimmer.birth_certificate_status = DocumentStatus.APPROVED
            swimmer.national_card_status = DocumentStatus.APPROVED
            swimmer.sports_insurance_status = DocumentStatus.APPROVED
            swimmer.documents_rejection_reason = ''
            swimmer.is_profile_completed = True
            swimmer.save()

            # Create notification for swimmer / guardians
            for u in recipient_users:
                Notification.objects.create(
                    recipient=u,
                    category=Notification.Category.REGISTRATION,
                    title='تأیید مدارک هویتی شناگر',
                    message=f'مدارک هویتی شناگر «{swimmer.full_name}» توسط مدیریت آموزشگاه بررسی و با موفقیت تأیید شد.',
                    link='/swimmer/documents',
                    is_read=False,
                )

            AuditLog.objects.create(
                actor=request.user,
                action=AuditLog.Action.USER_UPDATE,
                entity_type='SwimmerProfile',
                entity_id=str(swimmer.id),
                details={
                    'action': 'APPROVE_DOCUMENTS',
                    'swimmer': swimmer.full_name,
                    'national_id': swimmer.national_id,
                }
            )

            return Response({
                'detail': f'مدارک هویتی شناگر «{swimmer.full_name}» با موفقیت تأیید شد و اعلان تأیید برای شناگر ارسال گردید.',
                'swimmer': SwimmerProfileSerializer(swimmer, context={'request': request}).data
            }, status=status.HTTP_200_OK)

        elif action == 'REJECT':
            if not reason:
                return Response({'detail': 'ثبت توضیحات و علت رد مدارک الزامی است.'}, status=status.HTTP_400_BAD_REQUEST)

            swimmer.birth_certificate_status = DocumentStatus.REVISION_REQUIRED
            swimmer.national_card_status = DocumentStatus.REVISION_REQUIRED
            swimmer.sports_insurance_status = DocumentStatus.REVISION_REQUIRED
            swimmer.documents_rejection_reason = reason
            swimmer.is_profile_completed = False
            swimmer.save()

            # Create notification for swimmer / guardians
            for u in recipient_users:
                Notification.objects.create(
                    recipient=u,
                    category=Notification.Category.REGISTRATION,
                    title='نقص در مدارک هویتی شناگر',
                    message=f'مدارک هویتی شناگر «{swimmer.full_name}» نیازمند اصلاح و بارگذاری مجدد است.\n\nتوضیحات مدیریت:\n{reason}',
                    link='/swimmer/complete-profile',
                    is_read=False,
                )

            AuditLog.objects.create(
                actor=request.user,
                action=AuditLog.Action.USER_UPDATE,
                entity_type='SwimmerProfile',
                entity_id=str(swimmer.id),
                details={
                    'action': 'REJECT_DOCUMENTS',
                    'swimmer': swimmer.full_name,
                    'reason': reason,
                }
            )

            return Response({
                'detail': f'مدارک شناگر «{swimmer.full_name}» رد شد و توضیحات نقص مدارک در قالب اعلان برای شناگر ارسال گردید.',
                'swimmer': SwimmerProfileSerializer(swimmer, context={'request': request}).data
            }, status=status.HTTP_200_OK)


class SwimmerDocumentDownloadView(APIView):
    """
    تحویل امن و کنترل‌شده مدارک هویتی محرمانه شناگران (شناسنامه، کارت ملی، بیمه ورزشی):
    - احراز هویت اجباری
    - مدیر آموزشگاه، ناظر فنی سامانه و سوپریوزر: مجاز به مشاهده کلیه مدارک
    - شناگر و ولی تأییدشده: فقط مدارک خود یا فرزندان تحت سرپرستی
    - مربی و سایر کاربران: مسدود (عدم دسترسی به اسناد هویتی و بیمه‌ای شناگران)
    - مسدودسازی حملات IDOR
    - هدرهای امنیتی ضد کش و عدم افشای ساختار دایرکتوری سرور
    - پشتیبانی از X-Accel-Redirect انجین‌ایکس در محیط پروداکشن
    """
    permission_classes = [permissions.IsAuthenticated]

    DOCUMENT_FIELD_MAP = {
        'birth_certificate': 'birth_certificate_image',
        'national_card': 'national_card_image',
        'sports_insurance': 'sports_insurance_image',
    }

    def get(self, request, pk, document_type):
        user = request.user

        if document_type not in self.DOCUMENT_FIELD_MAP:
            return Response({'detail': 'نوع مدرک درخواستی نامعتبر است.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            swimmer = SwimmerProfile.objects.select_related('user').get(pk=pk)
        except SwimmerProfile.DoesNotExist:
            return Response({'detail': 'شناگر مورد نظر یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        # 1. Authorization: Admin, Supervisor, or Superuser
        is_privileged = bool(user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser)

        # 2. Authorization: Swimmer / Verified Guardian (Ownership & Anti-IDOR)
        is_owner = bool(swimmer.user_id and swimmer.user_id == user.id)
        is_guardian = False
        if not is_owner and user.role == 'SWIMMER':
            is_guardian = SwimmerGuardianRelation.objects.filter(
                guardian=user,
                swimmer=swimmer,
                is_verified=True,
            ).exists()

        # Coaches and unrelated users have no access to swimmer identity or insurance documents
        if not (is_privileged or is_owner or is_guardian):
            return Response({
                'detail': 'شما دسترسی لازم برای مشاهده این مدرک محرمانه را ندارید.'
            }, status=status.HTTP_403_FORBIDDEN)

        # 5. Document existence check
        field_name = self.DOCUMENT_FIELD_MAP[document_type]
        file_field = getattr(swimmer, field_name, None)
        if not file_field or not file_field.name:
            return Response({'detail': 'مدرک مورد نظر برای این شناگر بارگذاری نشده است.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            file_path = file_field.path
        except NotImplementedError:
            file_path = None

        if not file_path or not os.path.exists(file_path):
            return Response({'detail': 'فایل فیزیکی مدرک در سرور یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        # 6. MIME type and safe download headers
        content_type, _ = mimetypes.guess_type(file_path)
        if not content_type:
            ext = os.path.splitext(file_path)[1].lower()
            content_type = 'image/jpeg' if ext in ['.jpg', '.jpeg'] else ('image/png' if ext == '.png' else 'application/octet-stream')

        ext = os.path.splitext(file_path)[1].lower() or '.jpg'
        safe_filename = f"{document_type}_{swimmer.id}{ext}"

        # 7. Delivery: Nginx X-Accel-Redirect in production or FileResponse
        use_x_accel = getattr(settings, 'USE_X_ACCEL_REDIRECT', False)
        if use_x_accel:
            response = HttpResponse(content_type=content_type)
            response['X-Accel-Redirect'] = f"/protected_media/{file_field.name}"
        else:
            response = FileResponse(open(file_path, 'rb'), content_type=content_type)

        response['Cache-Control'] = 'private, no-store, max-age=0'
        response['X-Content-Type-Options'] = 'nosniff'
        response['Content-Disposition'] = f'inline; filename="{safe_filename}"'
        return response

