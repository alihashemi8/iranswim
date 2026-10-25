from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User


class IranSwimTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'phone'

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        data['user'] = {
            'id': user.id,
            'phone': user.phone,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': f"{user.first_name} {user.last_name}".strip() or user.phone,
            'role': user.role,
            'is_superuser': user.is_superuser,
            'swimmer_id': getattr(getattr(user, 'swimmer_profile', None), 'id', None),
            'coach_id': getattr(getattr(user, 'coach_profile', None), 'id', None),
        }
        return data


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    swimmer_id = serializers.SerializerMethodField()
    coach_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'phone', 'first_name', 'last_name', 'full_name',
            'national_id', 'role', 'is_active', 'swimmer_id', 'coach_id',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_swimmer_id(self, obj):
        profile = getattr(obj, 'swimmer_profile', None)
        return profile.id if profile else None

    def get_coach_id(self, obj):
        profile = getattr(obj, 'coach_profile', None)
        return profile.id if profile else None


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
                national_id=user.national_id or ''
            )
        elif role == User.Role.COACH:
            from apps.coaches.models import CoachProfile
            CoachProfile.objects.create(
                user=user
            )
        return user
