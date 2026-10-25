from rest_framework import serializers
from .models import (
    SkillLevel, Skill, Course, SwimmerGroup,
    GroupSchedule, GroupCoach, EnrollmentRequest, Enrollment
)


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'level', 'name', 'criteria_description', 'order']


class SkillLevelSerializer(serializers.ModelSerializer):
    skills = SkillSerializer(many=True, read_only=True)

    class Meta:
        model = SkillLevel
        fields = ['id', 'name', 'description', 'order', 'color_badge', 'is_active', 'skills']


class GroupScheduleSerializer(serializers.ModelSerializer):
    weekday_display = serializers.CharField(source='get_weekday_display', read_only=True)

    class Meta:
        model = GroupSchedule
        fields = ['id', 'group', 'weekday', 'weekday_display', 'start_time', 'end_time']


class GroupCoachSerializer(serializers.ModelSerializer):
    coach_name = serializers.CharField(source='coach.full_name', read_only=True)

    class Meta:
        model = GroupCoach
        fields = ['id', 'group', 'coach', 'coach_name', 'assigned_from', 'assigned_to', 'is_primary']


class SwimmerGroupSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    level_name = serializers.CharField(source='skill_level.name', read_only=True)
    current_enrollments_count = serializers.IntegerField(read_only=True)
    remaining_capacity = serializers.IntegerField(read_only=True)
    schedules = GroupScheduleSerializer(many=True, read_only=True)
    coach_assignments = GroupCoachSerializer(many=True, read_only=True)

    class Meta:
        model = SwimmerGroup
        fields = [
            'id', 'course', 'course_name', 'name', 'skill_level', 'level_name',
            'capacity', 'pool_location', 'status', 'current_enrollments_count',
            'remaining_capacity', 'schedules', 'coach_assignments', 'created_at'
        ]


class CourseSerializer(serializers.ModelSerializer):
    groups = SwimmerGroupSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'name', 'description', 'start_date', 'end_date',
            'base_price', 'sessions_count', 'status', 'groups', 'created_at'
        ]


class EnrollmentRequestSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = EnrollmentRequest
        fields = [
            'id', 'swimmer', 'applicant_name', 'applicant_phone',
            'applicant_national_id', 'course', 'course_name', 'group',
            'group_name', 'status', 'status_display', 'notes',
            'rejection_reason', 'created_at', 'reviewed_at'
        ]
        read_only_fields = ['id', 'status', 'rejection_reason', 'created_at', 'reviewed_at']


class EnrollmentSerializer(serializers.ModelSerializer):
    swimmer_name = serializers.CharField(source='swimmer.full_name', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    remaining_sessions = serializers.IntegerField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            'id', 'swimmer', 'swimmer_name', 'course', 'course_name',
            'group', 'group_name', 'status', 'status_display',
            'sessions_purchased', 'sessions_attended', 'remaining_sessions',
            'enrolled_at', 'notes'
        ]
        read_only_fields = ['id', 'enrolled_at', 'sessions_attended', 'remaining_sessions']
