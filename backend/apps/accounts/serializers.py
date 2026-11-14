import os
import random
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework.exceptions import ValidationError, AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, OTPVerification
from .validators import validate_password_complexity, validate_avatar_file


def delete_user_old_avatar(user):
    """حذف فایل فیزیکی تصویر پروفایل قبلی کاربر جهت تضمین وجود فقط یک عکس (فقط یکی)"""
    if user and user.avatar:
        try:
            if hasattr(user.avatar, 'path') and os.path.isfile(user.avatar.path):
                os.remove(user.avatar.path)
        except Exception:
            pass


def get_user_avatar_url(user, request=None):
    """دریافت آدرس تصویر پروفایل کاربر"""
    if not user:
        return None
    if user.avatar:
        return user.avatar.url
    profile = getattr(user, 'swimmer_profile', None)
    if profile and profile.avatar:
        return profile.avatar.url
    return None


def get_user_data(user, request=None):
    """تولید ساختار استاندارد اطلاعات کاربر جهت پاسخ‌های ورود، احراز هویت و پروفایل"""
    profile = getattr(user, 'swimmer_profile', None)
    coach_profile = getattr(user, 'coach_profile', None)
    if user.role == User.Role.SWIMMER:
        is_profile_completed = profile.is_profile_completed if profile else False
    elif user.role == User.Role.COACH:
        is_profile_completed = coach_profile.is_profile_completed if coach_profile else False
    else:
        is_profile_completed = True

    return {
        'id': user.id,
        'phone': user.phone,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'full_name': f"{user.first_name} {user.last_name}".strip() or user.phone,
        'role': user.role,
        'is_superuser': user.is_superuser,
        'is_password_changed': user.is_password_changed,
        'swimmer_id': getattr(profile, 'id', None),
        'coach_id': getattr(coach_profile, 'id', None),
        'is_profile_completed': is_profile_completed,
        'avatar': get_user_avatar_url(user, request),
    }


def to_english_digits(text):
    if not text:
        return text
    persian_digits = '۰۱۲۳۴۵۶۷۸۹'
    arabic_digits = '٠١٢٣٤٥٦٧٨٩'
    english_digits = '0123456789'
    trans = str.maketrans(persian_digits + arabic_digits, english_digits + english_digits)
    return str(text).translate(trans)


class IranSwimTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'phone'

    def validate(self, attrs):
        raw_phone = attrs.get('phone', '')
        phone = to_english_digits(raw_phone).strip()
        raw_password = attrs.get('password', '')
        password = to_english_digits(raw_password).strip()

        # Standard check with converted password and raw password
        user = authenticate(self.context.get('request'), phone=phone, password=password)
        if not user and password != raw_password:
            user = authenticate(self.context.get('request'), phone=phone, password=raw_password)

        if not user:
            # Fallback check: if user entered their national_id as password
            try:
                candidate = User.objects.get(phone=phone)
                candidate_nid = to_english_digits(candidate.national_id or '').strip()
                if candidate_nid and (candidate_nid == password or candidate_nid == raw_password):
                    user = candidate
            except User.DoesNotExist:
                pass

        if not user:
            raise AuthenticationFailed('شماره تلفن همراه یا رمز عبور (کد ملی) اشتباه است.')

        if not user.is_active:
            raise AuthenticationFailed('حساب کاربری شما غیرفعال شده است.')

        self.user = user
        refresh = self.get_token(self.user)
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

        data['user'] = get_user_data(user, self.context.get('request'))
        return data


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    avatar = serializers.ImageField(required=False, allow_null=True, validators=[validate_avatar_file])
    swimmer_id = serializers.SerializerMethodField()
    coach_id = serializers.SerializerMethodField()
    is_profile_completed = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'phone', 'first_name', 'last_name', 'full_name',
            'national_id', 'role', 'avatar', 'is_active', 'is_password_changed', 'password',
            'swimmer_id', 'coach_id', 'is_profile_completed', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if not ret.get('avatar'):
            ret['avatar'] = get_user_avatar_url(instance, self.context.get('request'))
        return ret

    def validate_phone(self, value):
        val = to_english_digits(value).strip() if value else ''
        if not (val.startswith('09') and len(val) == 11 and val.isdigit()):
            raise ValidationError('شماره موبایل وارد شده باید ۱۱ رقم بوده و با ۰۹ شروع شود.')
        return val

    def validate_national_id(self, value):
        if value:
            return to_english_digits(value).strip()
        return value

    def validate_password(self, value):
        if value:
            validate_password_complexity(value)
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        # Strict authorization: only authenticated admin or supervisor can modify user role
        if 'role' in attrs:
            if not request or not request.user or not request.user.is_authenticated or request.user.role not in [User.Role.ADMIN, User.Role.SUPERVISOR]:
                raise ValidationError({'role': 'فقط مدیر سامانه یا ناظر فنی مجاز به تعیین یا تغییر نقش کاربری هستند.'})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        avatar = validated_data.pop('avatar', None)
        phone = validated_data.get('phone')
        role = validated_data.get('role', User.Role.SWIMMER)

        if User.objects.filter(phone=phone).exists():
            raise ValidationError({'phone': 'کاربری با این شماره همراه قبلاً در سامانه ثبت شده است.'})

        user = User.objects.create_user(**validated_data)
        if avatar:
            user.avatar = avatar
            user.save(update_fields=['avatar'])
        if password:
            user.set_password(to_english_digits(password).strip())
            user.is_password_changed = True
        elif user.national_id:
            user.set_password(user.national_id)
        else:
            user.set_unusable_password()

        if role in [User.Role.ADMIN, User.Role.SUPERVISOR]:
            user.is_staff = True
            if role == User.Role.ADMIN:
                user.is_superuser = True
        user.save()

        # Create Profile
        if role == User.Role.SWIMMER:
            from apps.swimmers.models import SwimmerProfile
            swimmer_prof, _ = SwimmerProfile.objects.get_or_create(
                user=user,
                defaults={
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'phone': user.phone,
                    'national_id': user.national_id or '',
                    'avatar': user.avatar,
                }
            )
            if user.avatar and not swimmer_prof.avatar:
                swimmer_prof.avatar = user.avatar
                swimmer_prof.save(update_fields=['avatar'])
        elif role == User.Role.COACH:
            from apps.coaches.models import CoachProfile
            CoachProfile.objects.get_or_create(user=user)

        # Audit Log
        request = self.context.get('request')
        if request and getattr(request, 'user', None) and request.user.is_authenticated:
            try:
                from apps.supervisor.models import AuditLog
                AuditLog.objects.create(
                    actor=request.user,
                    action='USER_CREATE',
                    entity_type='User',
                    entity_id=str(user.id),
                    details={
                        'phone': user.phone,
                        'full_name': user.full_name,
                        'role': user.role
                    }
                )
            except Exception:
                pass

        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        has_avatar = 'avatar' in self.initial_data or 'avatar' in validated_data
        avatar = validated_data.pop('avatar', None)
        old_role = instance.role
        phone = validated_data.get('phone')
        if phone and phone != instance.phone and User.objects.filter(phone=phone).exclude(id=instance.id).exists():
            raise ValidationError({'phone': 'این شماره همراه قبلاً توسط کاربر دیگری ثبت شده است.'})

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if has_avatar:
            if not avatar:
                delete_user_old_avatar(instance)
                instance.avatar = None
            else:
                delete_user_old_avatar(instance)
                instance.avatar = avatar

        if password:
            instance.set_password(to_english_digits(password).strip())
            instance.is_password_changed = True

        if instance.role in [User.Role.ADMIN, User.Role.SUPERVISOR]:
            instance.is_staff = True
            if instance.role == User.Role.ADMIN:
                instance.is_superuser = True

        instance.save()

        if has_avatar and hasattr(instance, 'swimmer_profile') and instance.swimmer_profile:
            instance.swimmer_profile.avatar = instance.avatar
            instance.swimmer_profile.save(update_fields=['avatar'])

        # Create Profile if role changed
        if instance.role == User.Role.SWIMMER:
            from apps.swimmers.models import SwimmerProfile
            SwimmerProfile.objects.get_or_create(
                user=instance,
                defaults={
                    'first_name': instance.first_name,
                    'last_name': instance.last_name,
                    'phone': instance.phone,
                    'national_id': instance.national_id or '',
                }
            )
        elif instance.role == User.Role.COACH:
            from apps.coaches.models import CoachProfile
            CoachProfile.objects.get_or_create(user=instance)

        # Audit Log
        request = self.context.get('request')
        if request and getattr(request, 'user', None) and request.user.is_authenticated:
            try:
                from apps.supervisor.models import AuditLog
                action = 'ROLE_CHANGE' if old_role != instance.role else ('PASSWORD_RESET' if password else 'USER_UPDATE')
                AuditLog.objects.create(
                    actor=request.user,
                    action=action,
                    entity_type='User',
                    entity_id=str(instance.id),
                    details={
                        'phone': instance.phone,
                        'full_name': instance.full_name,
                        'old_role': old_role,
                        'new_role': instance.role,
                        'is_active': instance.is_active,
                        'password_changed': bool(password)
                    }
                )
            except Exception:
                pass

        return instance

    def get_swimmer_id(self, obj):
        profile = getattr(obj, 'swimmer_profile', None)
        return profile.id if profile else None

    def get_coach_id(self, obj):
        profile = getattr(obj, 'coach_profile', None)
        return profile.id if profile else None

    def get_is_profile_completed(self, obj):
        if obj.role == User.Role.SWIMMER and hasattr(obj, 'swimmer_profile'):
            return obj.swimmer_profile.is_profile_completed
        if obj.role == User.Role.COACH and hasattr(obj, 'coach_profile'):
            return obj.coach_profile.is_profile_completed
        return True


class SendOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15)
    purpose = serializers.ChoiceField(choices=['REGISTER', 'LOGIN'], default='LOGIN')

    def validate_phone(self, value):
        val = to_english_digits(value).strip()
        if not (val.startswith('09') and len(val) == 11 and val.isdigit()):
            raise ValidationError('شماره موبایل وارد شده باید ۱۱ رقم بوده و با ۰۹ شروع شود.')
        return val


class VerifyOTPLoginSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15)
    code = serializers.CharField(max_length=6)

    def validate_phone(self, value):
        return to_english_digits(value).strip()

    def validate_code(self, value):
        return to_english_digits(value).strip()


class RegisterWithOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15)
    code = serializers.CharField(max_length=6)
    first_name = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    last_name = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    national_id = serializers.CharField(max_length=10, required=False, allow_blank=True, default='')

    def validate_phone(self, value):
        val = to_english_digits(value).strip() if value else ''
        if not (val.startswith('09') and len(val) == 11 and val.isdigit()):
            raise ValidationError('شماره موبایل باید ۱۱ رقم بوده و با ۰۹ آغاز شود.')
        return val

    def validate_code(self, value):
        return to_english_digits(value).strip() if value else ''

    def validate_national_id(self, value):
        if not value:
            return ''
        val = to_english_digits(value).strip()
        if not (len(val) == 10 and val.isdigit()):
            raise ValidationError('کد ملی باید دقیقاً ۱۰ رقم عددی باشد.')
        return val


class SelfProfileSerializer(serializers.ModelSerializer):
    """
    سریالایزر امن ویرایش پروفایل کاربری توسط خود کاربر (/api/auth/me/):
    فیلدهای سطح دسترسی (نقش، سوپریوزر، کارمند و وضعیت فعال) را غیرقابل ویرایش می‌سازد
    تا از هرگونه ترفیع دسترسی غیرمجاز جلوگیری شود.
    امکان بارگذاری و تغییر تصویر پروفایل (فقط یکی) برای کلیه کاربران فراهم است.
    """
    full_name = serializers.CharField(read_only=True)
    swimmer_id = serializers.SerializerMethodField()
    coach_id = serializers.SerializerMethodField()
    is_profile_completed = serializers.SerializerMethodField()
    avatar = serializers.ImageField(required=False, allow_null=True, validators=[validate_avatar_file])

    class Meta:
        model = User
        fields = [
            'id', 'phone', 'first_name', 'last_name', 'full_name',
            'national_id', 'role', 'avatar', 'is_active', 'is_password_changed',
            'swimmer_id', 'coach_id', 'is_profile_completed', 'created_at'
        ]
        read_only_fields = [
            'id', 'phone', 'role', 'is_active', 'is_password_changed',
            'swimmer_id', 'coach_id', 'is_profile_completed', 'created_at'
        ]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if not ret.get('avatar'):
            ret['avatar'] = get_user_avatar_url(instance, self.context.get('request'))
        return ret

    def get_swimmer_id(self, obj):
        profile = getattr(obj, 'swimmer_profile', None)
        return profile.id if profile else None

    def get_coach_id(self, obj):
        profile = getattr(obj, 'coach_profile', None)
        return profile.id if profile else None

    def get_is_profile_completed(self, obj):
        if obj.role == User.Role.SWIMMER and hasattr(obj, 'swimmer_profile'):
            return obj.swimmer_profile.is_profile_completed
        if obj.role == User.Role.COACH and hasattr(obj, 'coach_profile'):
            return obj.coach_profile.is_profile_completed
        return True

    def validate_national_id(self, value):
        if value:
            return to_english_digits(value).strip()
        return value

    def validate(self, attrs):
        # Explicitly disallow any attempt to supply privileged or security-sensitive fields
        forbidden_attempts = []
        for field in ['role', 'is_staff', 'is_superuser', 'is_active', 'is_password_changed', 'password', 'phone']:
            if field in self.initial_data:
                val = self.initial_data.get(field)
                current_val = getattr(self.instance, field, None)
                if val is not None and str(val) != str(current_val):
                    forbidden_attempts.append(field)

        if forbidden_attempts:
            raise ValidationError({
                f: 'شما دسترسی لازم برای تغییر این فیلد را ندارید.'
                for f in forbidden_attempts
            })
        return attrs

    def update(self, instance, validated_data):
        # Whitelist safe editable profile fields only
        safe_fields = {'first_name', 'last_name', 'national_id', 'avatar'}
        for attr in ['first_name', 'last_name', 'national_id']:
            if attr in validated_data:
                setattr(instance, attr, validated_data[attr])

        has_avatar = 'avatar' in self.initial_data or 'avatar' in validated_data
        if has_avatar:
            new_avatar = validated_data.get('avatar')
            if not new_avatar:
                delete_user_old_avatar(instance)
                instance.avatar = None
            else:
                delete_user_old_avatar(instance)
                instance.avatar = new_avatar

        instance.save()

        # Synchronize first_name, last_name, national_id, and avatar with linked SwimmerProfile if present
        if hasattr(instance, 'swimmer_profile') and instance.swimmer_profile:
            profile = instance.swimmer_profile
            profile_changed = False
            if 'first_name' in validated_data and profile.first_name != instance.first_name:
                profile.first_name = instance.first_name
                profile_changed = True
            if 'last_name' in validated_data and profile.last_name != instance.last_name:
                profile.last_name = instance.last_name
                profile_changed = True
            if 'national_id' in validated_data and profile.national_id != instance.national_id:
                profile.national_id = instance.national_id or ''
                profile_changed = True
            if has_avatar:
                profile.avatar = instance.avatar
                profile_changed = True
            if profile_changed:
                profile.save()

        return instance


class RegisterSerializer(serializers.ModelSerializer):
    """
    سریالایزر ثبت‌نام عمومی:
    فقط و فقط امکان ثبت‌نام با نقش SWIMMER را فراهم می‌کند.
    هیچ کاربری نمی‌تواند نقش‌های مدیریتی (ADMIN, COACH, SUPERVISOR) یا دسترسی‌های ویژه ایجاد کند.
    """
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['phone', 'first_name', 'last_name', 'password', 'national_id']

    def validate_phone(self, value):
        val = to_english_digits(value).strip() if value else ''
        if not (val.startswith('09') and len(val) == 11 and val.isdigit()):
            raise ValidationError('شماره موبایل باید ۱۱ رقم بوده و با ۰۹ آغاز شود.')
        if User.objects.filter(phone=val).exists():
            raise ValidationError('کاربری با این شماره همراه قبلاً در سامانه ثبت شده است. لطفاً وارد شوید.')
        return val

    def validate_password(self, value):
        return validate_password_complexity(value)

    def validate_national_id(self, value):
        if value:
            val = to_english_digits(value).strip()
            if not (len(val) == 10 and val.isdigit()):
                raise ValidationError('کد ملی باید دقیقاً ۱۰ رقم عددی باشد.')
            if User.objects.filter(national_id=val).exists():
                raise ValidationError('این کد ملی قبلاً برای کاربر دیگری ثبت شده است.')
            return val
        return value

    def validate(self, attrs):
        # Reject client-supplied privileged role attempts
        requested_role = self.initial_data.get('role')
        if requested_role and requested_role != User.Role.SWIMMER:
            raise ValidationError({'role': 'ثبت‌نام عمومی فقط برای حساب‌های شناگر مجاز است.'})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        # Ensure role, is_staff, is_superuser cannot be manipulated via registration
        validated_data.pop('role', None)
        validated_data.pop('is_staff', None)
        validated_data.pop('is_superuser', None)

        user = User.objects.create_user(
            password=password,
            role=User.Role.SWIMMER,
            is_staff=False,
            is_superuser=False,
            **validated_data
        )
        
        # Automatically create profile for swimmer
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
        SwimmerGuardianRelation.objects.get_or_create(
            guardian=user,
            swimmer=swimmer_profile,
            defaults={'relationship_type': 'SELF', 'is_primary': True, 'is_verified': True}
        )
        return user
