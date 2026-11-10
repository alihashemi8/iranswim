from rest_framework import serializers
from .models import SkillAssessment, SwimmingRecord, LevelPromotionProposal


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


class LevelPromotionProposalSerializer(serializers.ModelSerializer):
    swimmer_name = serializers.CharField(source='swimmer.full_name', read_only=True)
    coach_name = serializers.SerializerMethodField()
    current_level_name = serializers.CharField(source='current_level.name', read_only=True)
    proposed_level_name = serializers.CharField(source='proposed_level.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = LevelPromotionProposal
        fields = [
            'id', 'swimmer', 'swimmer_name', 'coach', 'coach_name',
            'current_level', 'current_level_name', 'proposed_level',
            'proposed_level_name', 'status', 'status_display',
            'coach_notes', 'reviewer_notes', 'reviewed_by',
            'reviewed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'coach', 'status', 'reviewed_by', 'reviewed_at', 'created_at', 'updated_at']

    def get_coach_name(self, obj):
        if not obj.coach:
            return None
        name = obj.coach.user.get_full_name().strip() if obj.coach.user and obj.coach.user.get_full_name() else ''
        return name or 'مربی'

