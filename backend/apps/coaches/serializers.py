from rest_framework import serializers
from .models import CoachProfile, WorkoutPlan
from apps.education.models import SwimmerGroup, SkillLevel, GroupSchedule
from apps.swimmers.models import SwimmerProfile
from apps.accounts.models import User
from apps.accounts.validators import validate_password_complexity


class CoachProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    phone = serializers.CharField(required=False)
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    national_id = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    avatar = serializers.SerializerMethodField()
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    assigned_groups_count = serializers.SerializerMethodField()

    class Meta:
        model = CoachProfile
        fields = [
            'id', 'user', 'first_name', 'last_name', 'full_name', 'phone', 'national_id',
            'password', 'avatar', 'gender', 'gender_display', 'display_order', 'show_on_landing',
            'specialties', 'bio', 'employment_status', 'hourly_rate',
            'assigned_groups_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {
            'user': {'required': False, 'allow_null': True}
        }

    def get_avatar(self, obj):
        if obj.user and obj.user.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user.avatar.url)
            return obj.user.avatar.url
        return None

    def get_assigned_groups_count(self, obj):
        return obj.assigned_groups.count()

    def validate_password(self, value):
        if value:
            validate_password_complexity(value)
        return value

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.user:
            ret['first_name'] = instance.user.first_name or ''
            ret['last_name'] = instance.user.last_name or ''
            ret['phone'] = instance.user.phone or ''
            ret['national_id'] = instance.user.national_id or ''
            ret['full_name'] = instance.user.get_full_name() or instance.user.phone or ''
        return ret

    def create(self, validated_data):
        phone = validated_data.pop('phone', None)
        first_name = validated_data.pop('first_name', '')
        last_name = validated_data.pop('last_name', '')
        national_id = validated_data.pop('national_id', '')
        password = validated_data.pop('password', None)
        user = validated_data.pop('user', None)

        if not user:
            if not phone:
                raise serializers.ValidationError({'phone': 'شماره همراه الزامی است.'})
            phone = str(phone).strip()
            # Check if user already exists
            user = User.objects.filter(phone=phone).first()
            if user:
                user.role = User.Role.COACH
                if first_name:
                    user.first_name = first_name
                if last_name:
                    user.last_name = last_name
                if national_id:
                    user.national_id = national_id
                if password:
                    user.set_password(password)
                user.save()
            else:
                user = User.objects.create_user(
                    phone=phone,
                    password=password or national_id or phone,
                    first_name=first_name,
                    last_name=last_name,
                    national_id=national_id,
                    role=User.Role.COACH
                )

        profile, created = CoachProfile.objects.get_or_create(
            user=user,
            defaults=validated_data
        )
        if not created:
            for k, v in validated_data.items():
                setattr(profile, k, v)
            profile.save()

        # Handle avatar upload if present in context
        request = self.context.get('request')
        if request and 'avatar' in request.FILES:
            user.avatar = request.FILES['avatar']
            user.save(update_fields=['avatar'])

        return profile

    def update(self, instance, validated_data):
        phone = validated_data.pop('phone', None)
        first_name = validated_data.pop('first_name', None)
        last_name = validated_data.pop('last_name', None)
        national_id = validated_data.pop('national_id', None)
        password = validated_data.pop('password', None)
        validated_data.pop('user', None)

        if instance.user:
            user_obj = instance.user
            if phone and phone != user_obj.phone:
                if User.objects.filter(phone=phone).exclude(pk=user_obj.pk).exists():
                    raise serializers.ValidationError({'phone': 'این شماره همراه قبلاً در سیستم ثبت شده است.'})
                user_obj.phone = phone
            if first_name is not None:
                user_obj.first_name = first_name
            if last_name is not None:
                user_obj.last_name = last_name
            if national_id is not None:
                user_obj.national_id = national_id
            if password:
                user_obj.set_password(password)

            request = self.context.get('request')
            if request and 'avatar' in request.FILES:
                user_obj.avatar = request.FILES['avatar']

            user_obj.save()

        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        return instance


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

