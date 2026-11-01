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
    coach_phone = serializers.CharField(source='coach.user.phone', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    course_id = serializers.IntegerField(source='group.course.id', read_only=True, default=None)
    course_name = serializers.CharField(source='group.course.name', read_only=True, default='')
    level_name = serializers.CharField(source='group.skill_level.name', read_only=True, default='')
    level_color = serializers.CharField(source='group.skill_level.color_badge', read_only=True, default='#0284c7')
    pool_location = serializers.CharField(source='group.pool_location', read_only=True, default='')
    capacity = serializers.IntegerField(source='group.capacity', read_only=True, default=0)
    enrolled_count = serializers.IntegerField(source='group.current_enrollments_count', read_only=True, default=0)
    schedules = GroupScheduleSerializer(source='group.schedules', many=True, read_only=True)

    class Meta:
        model = GroupCoach
        fields = [
            'id', 'group', 'group_name', 'course_id', 'course_name', 'level_name',
            'level_color', 'pool_location', 'capacity', 'enrolled_count', 'schedules',
            'coach', 'coach_name', 'coach_phone', 'assigned_from', 'assigned_to', 'is_primary'
        ]


class SwimmerGroupSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_max_installments = serializers.IntegerField(source='course.installments_count', read_only=True)
    course_base_price = serializers.DecimalField(source='course.base_price', max_digits=12, decimal_places=2, read_only=True)
    level_name = serializers.CharField(source='skill_level.name', read_only=True)
    current_enrollments_count = serializers.IntegerField(read_only=True)
    remaining_capacity = serializers.IntegerField(read_only=True)
    schedules = GroupScheduleSerializer(many=True, read_only=True)
    coach_assignments = GroupCoachSerializer(many=True, read_only=True)

    class Meta:
        model = SwimmerGroup
        fields = [
            'id', 'course', 'course_name', 'course_max_installments', 'course_base_price',
            'name', 'skill_level', 'level_name',
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
            'start_date', 'end_date', 'base_price', 'sessions_count', 'installments_count', 'status',
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

    def validate(self, attrs):
        # Enforce at least one coach when creating a course, or if coach_ids is passed on update
        if self.instance is None:
            coach_ids = attrs.get('coach_ids')
            if not coach_ids or len(coach_ids) == 0:
                raise serializers.ValidationError({
                    'coach_ids': 'حداقل یک مربی برای دوره آموزشی باید انتخاب شود.'
                })
        elif 'coach_ids' in attrs:
            coach_ids = attrs.get('coach_ids')
            if not coach_ids or len(coach_ids) == 0:
                raise serializers.ValidationError({
                    'coach_ids': 'حداقل یک مربی برای دوره آموزشی باید انتخاب شود.'
                })

        inst_count = attrs.get('installments_count')
        if inst_count is not None and inst_count < 1:
            raise serializers.ValidationError({
                'installments_count': 'تعداد اقساط باید حداقل ۱ قسط باشد.'
            })

        return super().validate(attrs)

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
    course_max_installments = serializers.IntegerField(source='course.installments_count', read_only=True)
    course_base_price = serializers.DecimalField(source='course.base_price', max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = EnrollmentRequest
        fields = [
            'id', 'swimmer', 'applicant_name', 'applicant_phone',
            'applicant_national_id', 'course', 'course_name', 'group',
            'group_name', 'coach', 'coach_name', 'status', 'status_display',
            'selected_installments', 'course_max_installments', 'course_base_price',
            'notes', 'rejection_reason', 'created_at', 'reviewed_at'
        ]
        read_only_fields = ['id', 'status', 'rejection_reason', 'created_at', 'reviewed_at', 'course_max_installments', 'course_base_price']

    def validate(self, attrs):
        course = attrs.get('course')
        selected_inst = attrs.get('selected_installments', 1)
        if selected_inst is not None and selected_inst < 1:
            raise serializers.ValidationError({'selected_installments': 'تعداد اقساط باید حداقل ۱ قسط باشد.'})
        if course and selected_inst:
            max_inst = getattr(course, 'installments_count', 1) or 1
            if selected_inst > max_inst:
                raise serializers.ValidationError({
                    'selected_installments': f'تعداد اقساط انتخابی ({selected_inst}) نمی‌تواند از سقف مجاز دوره ({max_inst} قسط) بیشتر باشد.'
                })
        return super().validate(attrs)


class EnrollmentSerializer(serializers.ModelSerializer):
    swimmer_name = serializers.CharField(source='swimmer.full_name', read_only=True)
    swimmer_avatar = serializers.SerializerMethodField()
    swimmer_phone = serializers.CharField(source='swimmer.phone', read_only=True)
    swimmer_national_id = serializers.CharField(source='swimmer.national_id', read_only=True)
    swimmer_level_name = serializers.CharField(source='swimmer.current_level.name', read_only=True)
    swimmer_gender = serializers.CharField(source='swimmer.gender', read_only=True)
    swimmer_gender_display = serializers.CharField(source='swimmer.get_gender_display', read_only=True)
    swimmer_level_id = serializers.IntegerField(source='swimmer.current_level_id', read_only=True)

    course_name = serializers.CharField(source='course.name', read_only=True)
    course_pool = serializers.CharField(source='course.pool_location', read_only=True)
    course_days = serializers.CharField(source='course.days_of_week', read_only=True)
    course_time = serializers.SerializerMethodField()
    course_gender = serializers.CharField(source='course.gender', read_only=True)

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
            'swimmer_national_id', 'swimmer_level_name', 'swimmer_gender',
            'swimmer_gender_display', 'swimmer_level_id',
            'course', 'course_name', 'course_pool', 'course_days', 'course_time', 'course_gender',
            'group', 'group_name', 'coach', 'coach_name', 'coach_avatar',
            'course_coaches', 'status', 'status_display',
            'sessions_purchased', 'sessions_attended', 'remaining_sessions',
            'selected_installments', 'enrolled_at', 'notes'
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
