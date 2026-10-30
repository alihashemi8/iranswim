from rest_framework import serializers
from .models import CoachProfile, WorkoutPlan
from apps.education.models import SwimmerGroup, SkillLevel, GroupSchedule
from apps.swimmers.models import SwimmerProfile


class CoachProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = CoachProfile
        fields = [
            'id', 'user', 'first_name', 'last_name', 'full_name', 'phone',
            'avatar', 'specialties', 'bio', 'employment_status', 'hourly_rate',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_avatar(self, obj):
        if obj.user and obj.user.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user.avatar.url)
            return obj.user.avatar.url
        return None


class WorkoutPlanSerializer(serializers.ModelSerializer):
    coach_name = serializers.CharField(source='coach.full_name', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    target_level_name = serializers.CharField(source='target_level.name', read_only=True)

    class Meta:
        model = WorkoutPlan
        fields = [
            'id', 'coach', 'coach_name', 'title', 'group', 'group_name',
            'session', 'target_level', 'target_level_name', 'duration_minutes',
            'focus_skills', 'warmup_section', 'main_section', 'cooldown_section',
            'notes', 'is_template', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'coach', 'created_at', 'updated_at']


class GroupScheduleSerializer(serializers.ModelSerializer):
    weekday_display = serializers.CharField(source='get_weekday_display', read_only=True)

    class Meta:
        model = GroupSchedule
        fields = ['id', 'weekday', 'weekday_display', 'start_time', 'end_time']


class CoachClassListSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_status = serializers.CharField(source='course.status', read_only=True)
    skill_level_name = serializers.CharField(source='skill_level.name', read_only=True)
    skill_level_color = serializers.CharField(source='skill_level.color_badge', read_only=True)
    enrolled_count = serializers.IntegerField(source='current_enrollments_count', read_only=True)
    schedules = GroupScheduleSerializer(many=True, read_only=True)

    class Meta:
        model = SwimmerGroup
        fields = [
            'id', 'name', 'course', 'course_name', 'course_status',
            'skill_level', 'skill_level_name', 'skill_level_color',
            'capacity', 'enrolled_count', 'pool_location', 'status',
            'schedules', 'created_at'
        ]


class CoachSwimmerDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    current_level_name = serializers.CharField(source='current_level.name', read_only=True)
    guardian_phone = serializers.SerializerMethodField()

    class Meta:
        model = SwimmerProfile
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'gender',
            'date_of_birth', 'national_id', 'current_level',
            'current_level_name', 'guardian_phone', 'medical_notes',
            'created_at'
        ]

    def get_guardian_phone(self, obj):
        return obj.emergency_contact_phone or obj.father_phone or obj.mother_phone or obj.phone or ''

