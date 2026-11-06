import random
from datetime import timedelta
from django.utils import timezone
from rest_framework import status, generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, AuthenticationFailed
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q
from .models import User, OTPVerification
from .serializers import (
    IranSwimTokenObtainPairSerializer, UserSerializer, RegisterSerializer,
    SendOTPSerializer, VerifyOTPLoginSerializer, RegisterWithOTPSerializer,
    to_english_digits
)
from .permissions import IsAdminUserRole, IsAdminOrSupervisor


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

        if purpose == 'REGISTER' and user_exists:
            return Response(
                {'detail': 'این شماره همراه قبلاً در سامانه ثبت شده است. لطفاً وارد شوید.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Invalidate existing unused codes for this phone
        OTPVerification.objects.filter(phone=phone, is_used=False).update(is_used=True)

        # Generate a new 6-digit code
        code = f"{random.randint(100000, 999999)}"
        expires_at = timezone.now() + timedelta(minutes=2)

        otp_record = OTPVerification.objects.create(
            phone=phone,
            code=code,
            purpose=purpose,
            expires_at=expires_at
        )

        return Response({
            'detail': f'کد یکبار مصرف با موفقیت به شماره {phone} ارسال شد.',
            'code': code,  # Provided in response for seamless development & demo testing
            'expires_in': 120,
            'phone': phone
        }, status=status.HTTP_200_OK)


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
        profile = getattr(user, 'swimmer_profile', None)
        is_profile_completed = profile.is_profile_completed if profile else True

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'phone': user.phone,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': f"{user.first_name} {user.last_name}".strip() or user.phone,
                'role': user.role,
                'is_superuser': user.is_superuser,
                'is_password_changed': user.is_password_changed,
                'swimmer_id': getattr(profile, 'id', None),
                'coach_id': getattr(getattr(user, 'coach_profile', None), 'id', None),
                'is_profile_completed': is_profile_completed,
            }
        }, status=status.HTTP_200_OK)


class RegisterWithOTPView(APIView):
    """ثبت‌نام شناگر جدید با تایید کد یکبار مصرف (رمز عبور به صورت خودکار کد ملی تنظیم می‌شود)"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterWithOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone = serializer.validated_data['phone']
        code = serializer.validated_data['code']
        first_name = serializer.validated_data['first_name']
        last_name = serializer.validated_data['last_name']
        national_id = serializer.validated_data['national_id']

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

        # Create user with password = national_id as temporary initial password
        user = User.objects.create_user(
            phone=phone,
            password=national_id,
            national_id=national_id,
            first_name=first_name,
            last_name=last_name,
            role=User.Role.SWIMMER,
            is_password_changed=False
        )

        from apps.swimmers.models import SwimmerProfile, SwimmerGuardianRelation
        swimmer_profile = SwimmerProfile.objects.create(
            user=user,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            national_id=national_id,
            is_profile_completed=False
        )

        # Create primary guardian relation
        SwimmerGuardianRelation.objects.get_or_create(
            guardian=user,
            swimmer=swimmer_profile,
            defaults={'relationship_type': 'SELF', 'is_primary': True, 'is_verified': True}
        )

        refresh = RefreshToken.for_user(user)

        return Response({
            'detail': 'ثبت‌نام با موفقیت انجام شد. خوش آمدید!',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'phone': user.phone,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': f"{user.first_name} {user.last_name}".strip() or user.phone,
                'role': user.role,
                'is_superuser': user.is_superuser,
                'is_password_changed': False,
                'swimmer_id': swimmer_profile.id,
                'coach_id': None,
                'is_profile_completed': False,
            }
        }, status=status.HTTP_201_CREATED)


class ChangePasswordView(APIView):
    """تغییر کلمه عبور و ارتقای رمز اولیه (کد ملی) به رمز عبور قوی"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password', '').strip()
        new_password = request.data.get('new_password', '').strip()
        confirm_password = request.data.get('confirm_password', '').strip()

        if not new_password or len(new_password) < 6:
            return Response(
                {'detail': 'کلمه عبور جدید باید حداقل ۶ کاراکتر باشد.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_password != confirm_password:
            return Response(
                {'detail': 'تکرار کلمه عبور جدید با آن مطابقت ندارد.'},
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
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        user = request.user
        password = request.data.get('password')
        if password:
            user.set_password(password)
            user.save()
        serializer = UserSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class UserListView(generics.ListCreateAPIView):
    """لیست و ایجاد کاربران با دسترسی مدیر و ناظر فنی سامانه"""
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrSupervisor]

    def get_queryset(self):
        qs = User.objects.all().order_by('-created_at')
        if self.request.user.is_authenticated and self.request.user.role == User.Role.ADMIN:
            # Manager has access to everyone except other managers and technical supervisors
            qs = qs.exclude(role=User.Role.SUPERVISOR).exclude(
                Q(role=User.Role.ADMIN) & ~Q(id=self.request.user.id)
            )
        role = self.request.query_params.get('role')
        if role:
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
        if user.is_authenticated and user.role == User.Role.ADMIN:
            if role in [User.Role.ADMIN, User.Role.SUPERVISOR]:
                raise ValidationError({'role': 'مدیر آموزشگاه فقط مجاز به ایجاد کاربر شناگر یا مربی است.'})
        serializer.save()


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
                Q(role=User.Role.ADMIN) & ~Q(id=user.id)
            )
        return qs

    def perform_update(self, serializer):
        user = self.request.user
        target = serializer.instance
        if user.is_authenticated and user.role == User.Role.ADMIN:
            if target.role == User.Role.SUPERVISOR or (target.role == User.Role.ADMIN and target.id != user.id):
                raise ValidationError('شما دسترسی لازم برای ویرایش این کاربر را ندارید.')
            new_role = serializer.validated_data.get('role')
            if new_role and new_role in [User.Role.ADMIN, User.Role.SUPERVISOR]:
                raise ValidationError({'role': 'مدیر آموزشگاه فقط مجاز به تخصیص نقش شناگر یا مربی است.'})
            if target.id == user.id and serializer.validated_data.get('is_active') is False:
                raise ValidationError({'is_active': 'شما نمی‌توانید حساب کاربری فعال خود را معلق یا غیرفعال کنید.'})
        serializer.save()

    def perform_destroy(self, instance):
        if instance == self.request.user:
            raise ValidationError('شما نمی‌توانید حساب کاربری فعال خود را حذف نمایید.')

        user = self.request.user
        if user.is_authenticated and user.role == User.Role.ADMIN:
            if instance.role == User.Role.SUPERVISOR or (instance.role == User.Role.ADMIN and instance.id != user.id):
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

