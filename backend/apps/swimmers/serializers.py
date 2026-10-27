from rest_framework import serializers
from .models import SwimmerProfile
from apps.education.models import SkillLevel


class SwimmerProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    level_name = serializers.CharField(source='current_level.name', read_only=True)
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    has_required_info = serializers.BooleanField(read_only=True)

    class Meta:
        model = SwimmerProfile
        fields = [
            'id', 'user', 'first_name', 'last_name', 'full_name',
            'gender', 'gender_display', 'phone', 'national_id',
            'date_of_birth', 'father_name', 'father_phone', 'mother_phone',
            'emergency_contact_name', 'emergency_contact_phone',
            'address', 'latitude', 'longitude', 'school_name',
            'avatar', 'birth_certificate_image', 'national_card_image', 'sports_insurance_image',
            'is_profile_completed', 'has_required_info',
            'current_level', 'level_name', 'medical_notes', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        # If completing profile or updating contact info, ensure at least father_phone or mother_phone is provided if completing
        is_completing = attrs.get('is_profile_completed', False) or self.instance and self.instance.is_profile_completed
        father_p = attrs.get('father_phone', self.instance.father_phone if self.instance else '')
        mother_p = attrs.get('mother_phone', self.instance.mother_phone if self.instance else '')
        
        if is_completing and not (father_p or mother_p):
            raise serializers.ValidationError({
                'parent_phone': 'ثبت حداقل یکی از شماره‌های تماس پدر یا مادر الزامی است.'
            })
        return attrs

    def update(self, instance, validated_data):
        profile = super().update(instance, validated_data)
        # Synchronize first_name and last_name with linked User model if changed
        if profile.user:
            user_changed = False
            if 'first_name' in validated_data and profile.user.first_name != profile.first_name:
                profile.user.first_name = profile.first_name
                user_changed = True
            if 'last_name' in validated_data and profile.user.last_name != profile.last_name:
                profile.user.last_name = profile.last_name
                user_changed = True
            if 'national_id' in validated_data and profile.user.national_id != profile.national_id:
                profile.user.national_id = profile.national_id
                user_changed = True
            if user_changed:
                profile.user.save()
        return profile

