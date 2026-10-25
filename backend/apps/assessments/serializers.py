from rest_framework import serializers
from .models import SkillAssessment, SwimmingRecord


class SkillAssessmentSerializer(serializers.ModelSerializer):
    swimmer_name = serializers.CharField(source='swimmer.full_name', read_only=True)
    skill_name = serializers.CharField(source='skill.name', read_only=True)
    level_name = serializers.CharField(source='skill.level.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = SkillAssessment
        fields = [
            'id', 'swimmer', 'swimmer_name', 'skill', 'skill_name',
            'level_name', 'assessed_by', 'assessed_at', 'score',
            'status', 'status_display', 'feedback', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class SwimmingRecordSerializer(serializers.ModelSerializer):
    swimmer_name = serializers.CharField(source='swimmer.full_name', read_only=True)
    stroke_display = serializers.CharField(source='get_stroke_display', read_only=True)
    verification_status_display = serializers.CharField(source='get_verification_status_display', read_only=True)
    formatted_time = serializers.CharField(read_only=True)

    class Meta:
        model = SwimmingRecord
        fields = [
            'id', 'swimmer', 'swimmer_name', 'stroke', 'stroke_display',
            'distance_meters', 'duration_seconds', 'formatted_time',
            'pool_course', 'recorded_at', 'recorded_by', 'verification_status',
            'verification_status_display', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
