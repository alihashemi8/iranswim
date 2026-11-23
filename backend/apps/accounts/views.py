import logging
import secrets
from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from rest_framework import status, generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.exceptions import ValidationError, AuthenticationFailed
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q
from .models import User, OTPVerification
from .validators import validate_password_complexity, validate_avatar_file
from .serializers import (
    IranSwimTokenObtainPairSerializer, UserSerializer, SelfProfileSerializer, RegisterSerializer,
    SendOTPSerializer, VerifyOTPLoginSerializer, RegisterWithOTPSerializer,
    to_english_digits, get_user_data, get_user_avatar_url, delete_user_old_avatar
)
from .permissions import IsAdminUserRole, IsAdminOrSupervisor

logger = logging.getLogger('iranswim.accounts')


class LoginView(TokenObtainPairView):
    serializer_class = IranSwimTokenObtainPairSerializer


class SendOTPView(APIView):
    """ارسال کد یکبار مصرف پیامکی برای ورود یا ثبت نام"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone']
        purpose = serializer.validated_data['purpose']

        user_exists = User.objects.filter(phone=phone).exists()

        if purpose == 'LOGIN' and not user_exists:
            return Response(
                {'detail': 'کاربری با این شماره همراه یافت نشد. لطفاً ابتدا ثبت‌نام نمایید.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Invalidate existing unused codes for this phone
        OTPVerification.objects.filter(phone=phone, is_used=False).update(is_used=True)

        # Generate a cryptographically secure 5-digit code
        code = f"{secrets.SystemRandom().randint(10000, 99999)}"
        expires_at = timezone.now() + timedelta(minutes=2)

        otp_record = OTPVerification.objects.create(
            phone=phone,
            code=code,
            purpose=purpose,
            expires_at=expires_at
        )

        # Safe logging: log destination with phone masking, NEVER log the OTP code
        masked_phone = phone[:4] + '****' + phone[-3:] if len(phone) >= 7 else phone
        logger.info(f"Dispatched OTP verification SMS to {masked_phone}")

        response_payload = {
            'detail': f'کد یکبار مصرف با موفقیت به شماره {phone} ارسال شد.',
            'expires_in': 120,
            'phone': phone
        }

        # Expose OTP strictly in local development or automated test suites; impossible to activate in production
        is_production = (
            getattr(settings, 'ENVIRONMENT', 'production').lower() == 'production' or
            not getattr(settings, 'EXPOSE_DEV_OTP', False)
        )
        if not is_production:
            response_payload['code'] = code

        return Response(response_payload, status=status.HTTP_200_OK)


class VerifyOTPLoginView(APIView):
    """ورود به سامانه با استفاده از کد یکبار مصرف (بدون نیاز به رمز عبور)"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyOTPLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone']
        code = serializer.validated_data['code']

        otp = OTPVerification.objects.filter(
            phone=phone,
            code=code,
            is_used=False,
            expires_at__gte=timezone.now()
        ).first()

        if not otp:
            return Response(
                {'detail': 'کد تأیید وارد شده نامعتبر یا منقضی شده است. لطفاً مجدداً تلاش کنید.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(phone=phone)
        except User.DoesNotExist:
            return Response(
                {'detail': 'کاربری با این شماره همراه یافت نشد. لطفاً ابتدا ثبت‌نام فرمایید.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not user.is_active:
            return Response(
                {'detail': 'حساب کاربری شما غیرفعال شده است. لطفاً با مدیریت تماس بگیرید.'},
                status=status.HTTP_403_FORBIDDEN
            )

        otp.is_used = True
        otp.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': get_user_data(user, request)
        }, status=status.HTTP_200_OK)


class RegisterWithOTPView(APIView):
    """ثبت‌نام شناگر جدید فقط با شماره همراه و کد یکبار مصرف پیامکی"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterWithOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone = serializer.validated_data['phone']
        code = serializer.validated_data['code']
        first_name = serializer.validated_data.get('first_name', '').strip()
        last_name = serializer.validated_data.get('last_name', '').strip()
        national_id = serializer.validated_data.get('national_id', '').strip()

        otp = OTPVerification.objects.filter(
            phone=phone,
            code=code,
            is_used=False,
            expires_at__gte=timezone.now()
        ).first()

        if not otp:
            return Response(
                {'detail': 'کد تأیید وارد شده نامعتبر یا منقضی شده است. لطفاً مجدداً درخواست ارسال کد دهید.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        otp.is_used = True
        otp.save()

        # Check if user already exists with this phone
        user = User.objects.filter(phone=phone).first()
        is_new = False
        if not user:
            is_new = True
            user = User.objects.create_user(
                phone=phone,
                password=national_id if national_id else None,
                national_id=national_id or None,
                first_name=first_name,
                last_name=last_name,
                role=User.Role.SWIMMER,
                is_password_changed=False
            )
            if not national_id:
                user.set_unusable_password()
                user.save()
        else:
            updated = False
            if first_name and not user.first_name:
                user.first_name = first_name
                updated = True
            if last_name and not user.last_name:
                user.last_name = last_name
                updated = True
            if national_id and not user.national_id:
                user.national_id = national_id
                updated = True
            if updated:
                user.save()

        from apps.swimmers.models import SwimmerProfile, SwimmerGuardianRelation
        swimmer_profile, _ = SwimmerProfile.objects.get_or_create(
            user=user,
            defaults={
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
                'national_id': user.national_id or '',
                'is_profile_completed': False
            }
        )

        # Create primary guardian relation
        SwimmerGuardianRelation.objects.get_or_create(
            guardian=user,
            swimmer=swimmer_profile,
            defaults={'relationship_type': 'SELF', 'is_primary': True, 'is_verified': True}
        )

        refresh = RefreshToken.for_user(user)

        return Response({
            'detail': 'ثبت‌نام شما با موفقیت انجام شد. خوش آمدید!' if is_new else 'ورود با موفقیت انجام شد. خوش آمدید!',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': get_user_data(user, request)
        }, status=status.HTTP_201_CREATED if is_new else status.HTTP_200_OK)


class ChangePasswordView(APIView):
    """تغییر کلمه عبور و ارتقای رمز اولیه (کد ملی) به رمز عبور قوی"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password', '').strip()
        new_password = request.data.get('new_password', '').strip()
        confirm_password = request.data.get('confirm_password', '').strip()

        if not new_password:
            return Response(
                {'detail': 'کلمه عبور جدید الزامی است.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_password != confirm_password:
            return Response(
                {'detail': 'تکرار کلمه عبور جدید با آن مطابقت ندارد.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # اعتبارسنجی پیچیدگی رمز عبور طبق سیاست امنیت سامانه
        try:
            validate_password_complexity(new_password)
        except ValidationError as e:
            detail = e.detail if isinstance(e.detail, str) else (e.detail[0] if isinstance(e.detail, list) else str(e.detail))
            return Response(
                {'detail': str(detail)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Allow change if user hasn't changed initial password or provided valid old_password
        is_initial = not user.is_password_changed
        valid_old = user.check_password(old_password) or (user.national_id and old_password == user.national_id)

        if not is_initial and not valid_old:
            return Response(
                {'detail': 'کلمه عبور فعلی نامعتبر است.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.is_password_changed = True
        user.save()

        return Response({
            'detail': 'کلمه عبور شما با موفقیت تغییر یافت.',
            'is_password_changed': True
        }, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    """
    مشاهده و ویرایش مشخصات فردی کاربر جاری واردشده:
    با استفاده از سریالایزر SelfProfileSerializer، امکان ترفیع دسترسی (role, is_staff, is_superuser)
    یا ویرایش فیلدهای حساس امنیتی به طور کامل مسدود شده است.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        serializer = SelfProfileSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        user = request.user
        serializer = SelfProfileSerializer(user, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def put(self, request):
        user = request.user
        serializer = SelfProfileSerializer(user, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class UserAvatarView(APIView):
    """
    مدیریت اختصاصی تصویر پروفایل کاربر جاری (/api/auth/me/avatar/):
    - امکان بارگذاری، به‌روزرسانی و حذف تصویر برای کلیه کاربران با هر نقشی (مدیر، مربی، شناگر، ناظر)
    - تضمین وجود فقط یک تصویر (فقط یکی): فایل قبلی از دیسک پاکسازی و با فایل جدید جایگزین می‌شود
    - حذف فایل با متد DELETE
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        user = request.user
        avatar_url = get_user_avatar_url(user, request)
        return Response({'avatar': avatar_url}, status=status.HTTP_200_OK)

    def post(self, request):
        return self._handle_avatar_upload(request)

    def put(self, request):
        return self._handle_avatar_upload(request)

    def patch(self, request):
        return self._handle_avatar_upload(request)

    def _handle_avatar_upload(self, request):
        user = request.user
        avatar_file = (
            request.FILES.get('avatar') or
            request.FILES.get('image') or
            request.FILES.get('photo') or
            request.FILES.get('file')
        )

        if not avatar_file and request.FILES:
            avatar_file = next(iter(request.FILES.values()), None)

        if not avatar_file:
            if 'avatar' in request.data and not request.data.get('avatar'):
                return self.delete(request)
            return Response(
                {'detail': 'فایل تصویر پروفایل انتخاب نشده است.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            validate_avatar_file(avatar_file)
        except ValidationError as e:
            detail = e.detail if isinstance(e.detail, (str, list, dict)) else str(e)
            if isinstance(detail, list) and detail:
                detail = detail[0]
            elif isinstance(detail, dict):
                first_val = next(iter(detail.values()), str(detail))
                detail = first_val[0] if isinstance(first_val, list) and first_val else str(first_val)
            return Response({'detail': str(detail)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # پاکسازی تصویر قبلی از روی دیسک (تضمین قاعده فقط یکی)
        delete_user_old_avatar(user)

        user.avatar = avatar_file
        user.save(update_fields=['avatar'])

        # همگام‌سازی با پرونده شناگر در صورت وجود
        if hasattr(user, 'swimmer_profile') and user.swimmer_profile:
            swimmer_profile = user.swimmer_profile
            swimmer_profile.avatar = user.avatar
            swimmer_profile.save(update_fields=['avatar'])

        avatar_url = user.avatar.url
        return Response({
            'detail': 'تصویر پروفایل شما با موفقیت ذخیره شد.',
            'avatar': avatar_url,
            'user': get_user_data(user, request)
        }, status=status.HTTP_200_OK)

    def delete(self, request):
        user = request.user
        delete_user_old_avatar(user)
        user.avatar = None
        user.save(update_fields=['avatar'])

        if hasattr(user, 'swimmer_profile') and user.swimmer_profile:
            swimmer_profile = user.swimmer_profile
            swimmer_profile.avatar = None
            swimmer_profile.save(update_fields=['avatar'])

        return Response({
            'detail': 'تصویر پروفایل با موفقیت حذف گردید.',
            'avatar': None,
            'user': get_user_data(user, request)
        }, status=status.HTTP_200_OK)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class UserPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 200


class UserListView(generics.ListCreateAPIView):
    """لیست و ایجاد کاربران با دسترسی مدیر و ناظر فنی سامانه"""
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrSupervisor]
    pagination_class = UserPagination

    def get_queryset(self):
        qs = User.objects.all().order_by('-created_at')
        if self.request.user.is_authenticated and self.request.user.role == User.Role.ADMIN:
            # Manager has access to everyone except other managers and technical supervisors
            qs = qs.exclude(role=User.Role.SUPERVISOR).exclude(
                Q(role__in=[User.Role.ADMIN, User.Role.FEMALE_ADMIN]) & ~Q(id=self.request.user.id)
            )
        elif self.request.user.is_authenticated and self.request.user.role == User.Role.FEMALE_ADMIN:
            qs = qs.filter(
                Q(id=self.request.user.id) |
                Q(role=User.Role.SWIMMER, swimmer_profile__gender='FEMALE') |
                Q(role=User.Role.COACH, coach_profile__gender='FEMALE')
            )
        role = self.request.query_params.get('role')
        if role:
            if role.upper() == 'PRIVILEGED':
                qs = qs.filter(
                    Q(role__in=[User.Role.ADMIN, User.Role.SUPERVISOR]) |
                    Q(is_staff=True) |
                    Q(is_superuser=True)
                )
            else:
                qs = qs.filter(role=role)
        is_active = self.request.query_params.get('is_active')
        if is_active is not None and is_active != '':
            if is_active.lower() in ['true', '1']:
                qs = qs.filter(is_active=True)
            elif is_active.lower() in ['false', '0']:
                qs = qs.filter(is_active=False)
        search = self.request.query_params.get('search')
        if search:
            search = to_english_digits(search).strip()
            qs = qs.filter(
                Q(phone__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(national_id__icontains=search)
            )
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        role = serializer.validated_data.get('role', User.Role.SWIMMER)
        if user.is_authenticated and user.role in [User.Role.ADMIN, User.Role.FEMALE_ADMIN]:
            if role in [User.Role.ADMIN, User.Role.FEMALE_ADMIN, User.Role.SUPERVISOR]:
                raise ValidationError({'role': 'مدیر فقط مجاز به ایجاد کاربر شناگر یا مربی است.'})
        new_user = serializer.save()
        try:
            from apps.supervisor.models import AuditLog
            AuditLog.objects.create(
                actor=user,
                action='USER_CREATE',
                entity_type='User',
                entity_id=str(new_user.id),
                details={
                    'phone': new_user.phone,
                    'full_name': new_user.full_name,
                    'role': new_user.role,
                    'is_active': new_user.is_active
                }
            )
        except Exception:
            pass


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """مشاهده، ویرایش، حذف و بازنشانی مشخصات کاربر توسط مدیر و ناظر فنی"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrSupervisor]

    def get_queryset(self):
        qs = User.objects.all()
        user = self.request.user
        if user.is_authenticated and user.role == User.Role.ADMIN:
            qs = qs.exclude(role=User.Role.SUPERVISOR).exclude(
                Q(role__in=[User.Role.ADMIN, User.Role.FEMALE_ADMIN]) & ~Q(id=user.id)
            )
        elif user.is_authenticated and user.role == User.Role.FEMALE_ADMIN:
            qs = qs.filter(
                Q(id=user.id) |
                Q(role=User.Role.SWIMMER, swimmer_profile__gender='FEMALE') |
                Q(role=User.Role.COACH, coach_profile__gender='FEMALE')
            )
        return qs

    def perform_update(self, serializer):
        user = self.request.user
        target = serializer.instance
        if target.id == user.id and serializer.validated_data.get('is_active') is False:
            raise ValidationError({'is_active': 'شما نمی‌توانید حساب کاربری فعال خود را معلق یا غیرفعال کنید.'})
        if user.is_authenticated and user.role in [User.Role.ADMIN, User.Role.FEMALE_ADMIN]:
            if target.role in [User.Role.SUPERVISOR, User.Role.ADMIN, User.Role.FEMALE_ADMIN] and target.id != user.id:
                raise ValidationError('شما دسترسی لازم برای ویرایش این کاربر را ندارید.')
            new_role = serializer.validated_data.get('role')
            if new_role and new_role in [User.Role.ADMIN, User.Role.FEMALE_ADMIN, User.Role.SUPERVISOR]:
                raise ValidationError({'role': 'مدیر فقط مجاز به تخصیص نقش شناگر یا مربی است.'})

        has_password = bool(serializer.validated_data.get('password'))
        was_active = target.is_active
        updated_user = serializer.save()

        try:
            from apps.supervisor.models import AuditLog
            if has_password:
                AuditLog.objects.create(
                    actor=user,
                    action='PASSWORD_RESET',
                    entity_type='User',
                    entity_id=str(updated_user.id),
                    details={'phone': updated_user.phone, 'full_name': updated_user.full_name}
                )
            details = {
                'phone': updated_user.phone,
                'full_name': updated_user.full_name,
                'role': updated_user.role,
                'is_active': updated_user.is_active,
            }
            if was_active != updated_user.is_active:
                details['status_change'] = 'ACTIVATED' if updated_user.is_active else 'SUSPENDED'
            AuditLog.objects.create(
                actor=user,
                action='USER_UPDATE',
                entity_type='User',
                entity_id=str(updated_user.id),
                details=details
            )
        except Exception:
            pass

    def perform_destroy(self, instance):
        if instance == self.request.user:
            raise ValidationError('شما نمی‌توانید حساب کاربری فعال خود را حذف نمایید.')

        user = self.request.user
        if user.is_authenticated and user.role in [User.Role.ADMIN, User.Role.FEMALE_ADMIN]:
            if instance.role in [User.Role.SUPERVISOR, User.Role.ADMIN, User.Role.FEMALE_ADMIN] and instance.id != user.id:
                raise ValidationError('شما دسترسی لازم برای حذف این کاربر را ندارید.')

        try:
            from apps.supervisor.models import AuditLog
            AuditLog.objects.create(
                actor=self.request.user,
                action='USER_DELETE',
                entity_type='User',
                entity_id=str(instance.id),
                details={
                    'phone': instance.phone,
                    'full_name': instance.full_name,
                    'role': instance.role
                }
            )
        except Exception:
            pass

        instance.delete()

