import random
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework.exceptions import ValidationError, AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, OTPVerification


class IranSwimTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'phone'

    def validate(self, attrs):
        phone = attrs.get('phone', '').strip()
        password = attrs.get('password', '')

        # Standard check
        user = authenticate(self.context.get('request'), phone=phone, password=password)
        if not user:
            # Fallback check: if user entered their national_id as password
            try:
                candidate = User.objects.get(phone=phone)
                if candidate.national_id and candidate.national_id.strip() == password.strip():
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

        profile = getattr(user, 'swimmer_profile', None)
        is_profile_completed = profile.is_profile_completed if profile else True

        data['user'] = {
            'id': user.id,
            'phone': user.phone,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': f"{user.first_name} {user.last_name}".strip() or user.phone,
            'role': user.role,
            'is_superuser': user.is_superuser,
            'swimmer_id': getattr(profile, 'id', None),
            'coach_id': getattr(getattr(user, 'coach_profile', None), 'id', None),
            'is_profile_completed': is_profile_completed,
        }
        return data


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    swimmer_id = serializers.SerializerMethodField()
    coach_id = serializers.SerializerMethodField()
    is_profile_completed = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'phone', 'first_name', 'last_name', 'full_name',
            'national_id', 'role', 'is_active', 'swimmer_id', 'coach_id',
            'is_profile_completed', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_swimmer_id(self, obj):
        profile = getattr(obj, 'swimmer_profile', None)
        return profile.id if profile else None

    def get_coach_id(self, obj):
        profile = getattr(obj, 'coach_profile', None)
        return profile.id if profile else None

    def get_is_profile_completed(self, obj):
        if obj.role == User.Role.SWIMMER and hasattr(obj, 'swimmer_profile'):
            return obj.swimmer_profile.is_profile_completed
        return True


class SendOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15)
    purpose = serializers.ChoiceField(choices=['REGISTER', 'LOGIN'], default='LOGIN')

    def validate_phone(self, value):
        val = value.strip()
        if not (val.startswith('09') and len(val) == 11 and val.isdigit()):
            raise ValidationError('شماره موبایل وارد شده باید ۱۱ رقم بوده و با ۰۹ شروع شود.')
        return val


class VerifyOTPLoginSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15)
    code = serializers.CharField(max_length=6)

    def validate_phone(self, value):
        return value.strip()


class RegisterWithOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15)
    code = serializers.CharField(max_length=6)
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    national_id = serializers.CharField(max_length=10)

    def validate_phone(self, value):
        val = value.strip()
        if not (val.startswith('09') and len(val) == 11 and val.isdigit()):
            raise ValidationError('شماره موبایل باید ۱۱ رقم بوده و با ۰۹ آغاز شود.')
        if User.objects.filter(phone=val).exists():
            raise ValidationError('کاربری با این شماره همراه قبلاً در سامانه ثبت شده است. لطفاً وارد شوید.')
        return val

    def validate_national_id(self, value):
        val = value.strip()
        if not (len(val) == 10 and val.isdigit()):
            raise ValidationError('کد ملی باید دقیقاً ۱۰ رقم عددی باشد.')
        if User.objects.filter(national_id=val).exists():
            raise ValidationError('این کد ملی قبلاً برای کاربر دیگری ثبت شده است.')
        return val


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['phone', 'first_name', 'last_name', 'password', 'national_id', 'role']

    def create(self, validated_data):
        password = validated_data.pop('password')
        role = validated_data.get('role', User.Role.SWIMMER)
        user = User.objects.create_user(password=password, **validated_data)
        
        # Automatically create profile based on role
        if role == User.Role.SWIMMER:
            from apps.swimmers.models import SwimmerProfile
            SwimmerProfile.objects.create(
                user=user,
                first_name=user.first_name,
                last_name=user.last_name,
                phone=user.phone,
                national_id=user.national_id or '',
                is_profile_completed=False
            )
        elif role == User.Role.COACH:
            from apps.coaches.models import CoachProfile
            CoachProfile.objects.create(
                user=user
            )
        return user
