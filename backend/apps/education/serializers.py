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
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    coach_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    coaches = serializers.SerializerMethodField(read_only=True)
    time_display = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'name', 'description', 'pool_location', 'days_of_week',
            'start_time', 'end_time', 'time_display', 'coaches', 'coach_ids',
            'start_date', 'end_date', 'base_price', 'sessions_count', 'status',
            'groups', 'age_range', 'gender', 'gender_display', 'what_you_learn',
            'created_at'
        ]

    def get_time_display(self, obj):
        if obj.start_time and obj.end_time:
            st = obj.start_time.strftime('%H:%M') if hasattr(obj.start_time, 'strftime') else str(obj.start_time)[:5]
            et = obj.end_time.strftime('%H:%M') if hasattr(obj.end_time, 'strftime') else str(obj.end_time)[:5]
            return f"{st} الی {et}"
        return ''

    def get_coaches(self, obj):
        request = self.context.get('request')
        result = []
        try:
            for c in obj.coaches.all():
                avatar_url = None
                try:
                    if c.user and c.user.avatar:
                        avatar_url = request.build_absolute_uri(c.user.avatar.url) if request else c.user.avatar.url
                except Exception:
                    avatar_url = None
                result.append({
                    'id': c.id,
                    'full_name': c.full_name,
                    'avatar': avatar_url,
                    'class_name': f"کلاس {c.full_name}"
                })
        except Exception:
            pass
        return result

    def create(self, validated_data):
        coach_ids = validated_data.pop('coach_ids', None)
        course = super().create(validated_data)
        if coach_ids is not None:
            course.coaches.set(coach_ids)
            course.sync_coach_classes()
        return course

    def update(self, instance, validated_data):
        coach_ids = validated_data.pop('coach_ids', None)
        course = super().update(instance, validated_data)
        if coach_ids is not None:
            course.coaches.set(coach_ids)
            course.sync_coach_classes()
        return course


class EnrollmentRequestSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    coach_name = serializers.CharField(source='coach.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = EnrollmentRequest
        fields = [
            'id', 'swimmer', 'applicant_name', 'applicant_phone',
            'applicant_national_id', 'course', 'course_name', 'group',
            'group_name', 'coach', 'coach_name', 'status', 'status_display',
            'notes', 'rejection_reason', 'created_at', 'reviewed_at'
        ]
        read_only_fields = ['id', 'status', 'rejection_reason', 'created_at', 'reviewed_at']


class EnrollmentSerializer(serializers.ModelSerializer):
    swimmer_name = serializers.CharField(source='swimmer.full_name', read_only=True)
    swimmer_avatar = serializers.SerializerMethodField()
    swimmer_phone = serializers.CharField(source='swimmer.phone', read_only=True)
    swimmer_national_id = serializers.CharField(source='swimmer.national_id', read_only=True)
    swimmer_level_name = serializers.CharField(source='swimmer.current_level.name', read_only=True)

    course_name = serializers.CharField(source='course.name', read_only=True)
    course_pool = serializers.CharField(source='course.pool_location', read_only=True)
    course_days = serializers.CharField(source='course.days_of_week', read_only=True)
    course_time = serializers.SerializerMethodField()

    group_name = serializers.CharField(source='group.name', read_only=True)
    coach_name = serializers.CharField(source='coach.full_name', read_only=True)
    coach_avatar = serializers.SerializerMethodField()

    course_coaches = serializers.SerializerMethodField()
    remaining_sessions = serializers.IntegerField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            'id', 'swimmer', 'swimmer_name', 'swimmer_avatar', 'swimmer_phone',
            'swimmer_national_id', 'swimmer_level_name',
            'course', 'course_name', 'course_pool', 'course_days', 'course_time',
            'group', 'group_name', 'coach', 'coach_name', 'coach_avatar',
            'course_coaches', 'status', 'status_display',
            'sessions_purchased', 'sessions_attended', 'remaining_sessions',
            'enrolled_at', 'notes'
        ]
        read_only_fields = ['id', 'enrolled_at', 'sessions_attended', 'remaining_sessions']

    def get_swimmer_avatar(self, obj):
        if obj.swimmer and obj.swimmer.avatar:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.swimmer.avatar.url) if request else obj.swimmer.avatar.url
        return None

    def get_coach_avatar(self, obj):
        if obj.coach and obj.coach.user and obj.coach.user.avatar:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.coach.user.avatar.url) if request else obj.coach.user.avatar.url
        return None

    def get_course_time(self, obj):
        if obj.course and obj.course.start_time and obj.course.end_time:
            st = obj.course.start_time.strftime('%H:%M') if hasattr(obj.course.start_time, 'strftime') else str(obj.course.start_time)[:5]
            et = obj.course.end_time.strftime('%H:%M') if hasattr(obj.course.end_time, 'strftime') else str(obj.course.end_time)[:5]
            return f"{st} الی {et}"
        return ''

    def get_course_coaches(self, obj):
        if not obj.course:
            return []
        coaches = obj.course.coaches.all()
        if not coaches.exists():
            from apps.coaches.models import CoachProfile
            coaches = CoachProfile.objects.filter(assigned_groups__group__course=obj.course).distinct()
        if not coaches.exists():
            from apps.coaches.models import CoachProfile
            coaches = CoachProfile.objects.filter(employment_status='ACTIVE')

        request = self.context.get('request')
        result = []
        for c in coaches:
            avatar_url = None
            if c.user and c.user.avatar:
                avatar_url = request.build_absolute_uri(c.user.avatar.url) if request else c.user.avatar.url
            result.append({
                'id': c.id,
                'full_name': c.full_name,
                'avatar': avatar_url,
                'class_name': f"کلاس {c.full_name}"
            })
        return result

    def update(self, instance, validated_data):
        coach = validated_data.get('coach', instance.coach)
        if coach and instance.course:
            target_group = SwimmerGroup.objects.filter(
                course=instance.course,
                coach_assignments__coach=coach
            ).first()
            if target_group:
                instance.group = target_group
        return super().update(instance, validated_data)
