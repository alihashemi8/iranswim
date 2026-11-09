from rest_framework import serializers
from .models import ClassSession


class ClassSessionSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source='group.name', read_only=True)
    course_id = serializers.IntegerField(source='group.course.id', read_only=True, default=None)
    course_name = serializers.CharField(source='group.course.name', read_only=True, default='')
    skill_level_id = serializers.IntegerField(source='group.skill_level.id', read_only=True, default=None)
    skill_level_name = serializers.CharField(source='group.skill_level.name', read_only=True, default='')
    skill_level_badge = serializers.CharField(source='group.skill_level.color_badge', read_only=True, default='#0284c7')
    coach_name = serializers.CharField(source='coach.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    attendance_recorded = serializers.SerializerMethodField()
    attendance_count = serializers.SerializerMethodField()
    enrolled_count = serializers.SerializerMethodField()

    class Meta:
        model = ClassSession
        fields = [
            'id', 'group', 'group_name', 'course_id', 'course_name',
            'skill_level_id', 'skill_level_name', 'skill_level_badge',
            'coach', 'coach_name', 'session_date', 'start_time', 'end_time',
            'pool_location', 'status', 'status_display', 'is_makeup',
            'replaces_session', 'cancellation_reason', 'session_notes',
            'coach_evaluation', 'session_rating',
            'attendance_recorded', 'attendance_count', 'enrolled_count'
        ]

    def get_attendance_recorded(self, obj):
        return obj.attendance_records.exists()

    def get_attendance_count(self, obj):
        return obj.attendance_records.count()

    def get_enrolled_count(self, obj):
        if hasattr(obj, 'group') and obj.group:
            return obj.group.enrollments.filter(status__in=['ACTIVE', 'PENDING_PAYMENT']).count()
        return 0
