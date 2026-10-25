from rest_framework import serializers
from .models import SwimmerProfile
from apps.education.models import SkillLevel


class SwimmerProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    level_name = serializers.CharField(source='current_level.name', read_only=True)

    class Meta:
        model = SwimmerProfile
        fields = [
            'id', 'user', 'first_name', 'last_name', 'full_name', 'phone',
            'national_id', 'date_of_birth', 'emergency_contact_name',
            'emergency_contact_phone', 'current_level', 'level_name',
            'medical_notes', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
