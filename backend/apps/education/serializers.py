from django.utils import timezone
from rest_framework import serializers
from .models import (
    SkillLevel, Skill, Course, SwimmerGroup,
    GroupSchedule, GroupCoach, EnrollmentRequest, Enrollment
)


class SkillSerializer(serializers.ModelSerializer):
    level_name = serializers.CharField(source='level.name', read_only=True, default='')
    coach_name = serializers.CharField(source='coach.full_name', read_only=True, default='')

    class Meta:
        model = Skill
        fields = [
            'id', 'level', 'level_name', 'name', 'criteria_description',
            'order', 'coach', 'coach_name', 'is_custom'
        ]
        read_only_fields = ['id', 'coach', 'is_custom']
        extra_kwargs = {
            'level': {'required': False, 'allow_null': True}
        }


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


def _safe_coach_name(coach):
    if not coach:
        return None
    name = coach.user.get_full_name().strip() if getattr(coach, 'user', None) and coach.user.get_full_name() else ''
    return name or 'مربی'


class GroupCoachSerializer(serializers.ModelSerializer):
    coach_name = serializers.SerializerMethodField()
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

    def get_coach_name(self, obj):
        return _safe_coach_name(obj.coach)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        user = request.user if request and hasattr(request, 'user') and request.user.is_authenticated else None
        is_privileged = bool(user and (user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser))
        is_self = bool(user and instance.coach and instance.coach.user_id and instance.coach.user_id == user.id)
        if not (is_privileged or is_self):
            ret.pop('coach_phone', None)
        return ret


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
    session_price = serializers.SerializerMethodField(read_only=True)
    total_capacity = serializers.SerializerMethodField(read_only=True)
    remaining_capacity = serializers.SerializerMethodField(read_only=True)
    is_matched = serializers.SerializerMethodField(read_only=True)
    match_details = serializers.SerializerMethodField(read_only=True)
    is_enrolled = serializers.SerializerMethodField(read_only=True)
    enrollment_status = serializers.SerializerMethodField(read_only=True)
    has_pending_request = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'name', 'description', 'pool_location', 'days_of_week',
            'start_time', 'end_time', 'time_display', 'coaches', 'coach_ids',
            'start_date', 'end_date', 'base_price', 'sessions_count', 'session_price',
            'installments_count', 'card_number', 'card_holder', 'status',
            'groups', 'total_capacity', 'remaining_capacity',
            'age_range', 'min_age', 'max_age', 'gender', 'gender_display', 'what_you_learn',
            'is_matched', 'match_details', 'is_enrolled', 'enrollment_status', 'has_pending_request',
            'created_at'
        ]

    def _get_target_swimmer(self):
        if hasattr(self, '_target_swimmer_cached'):
            return self._target_swimmer_cached
        request = self.context.get('request')
        swimmer = None
        if request and getattr(request, 'user', None) and request.user.is_authenticated:
            from apps.swimmers.views import get_accessible_swimmer_profile
            params = getattr(request, 'query_params', None)
            if params is None:
                params = getattr(request, 'GET', {})
            swimmer_id = params.get('swimmer_id')

            if not swimmer_id:
                headers = getattr(request, 'headers', None)
                if headers and hasattr(headers, 'get'):
                    swimmer_id = headers.get('X-Swimmer-Id')
                if not swimmer_id and hasattr(request, 'META'):
                    swimmer_id = request.META.get('HTTP_X_SWIMMER_ID')

            try:
                swimmer = get_accessible_swimmer_profile(request.user, swimmer_id)
            except Exception:
                swimmer = getattr(request.user, 'swimmer_profile', None)
        self._target_swimmer_cached = swimmer
        return swimmer

    def get_match_details(self, obj):
        swimmer = self._get_target_swimmer()
        if not swimmer:
            return {
                'has_profile': False,
                'is_matched': True,
                'gender_matched': True,
                'age_matched': True,
                'gender_reason': '',
                'age_reason': ''
            }

        swimmer_gender = getattr(swimmer, 'gender', None)
        swimmer_age = getattr(swimmer, 'age', None)

        gender_ok = obj.is_gender_eligible(swimmer_gender)
        age_ok = obj.is_age_eligible(swimmer_age)

        gender_reason = ''
        if not gender_ok:
            if obj.gender == 'MALE':
                gender_reason = 'این دوره اختصاصاً ویژه پسران / آقایان است.'
            elif obj.gender == 'FEMALE':
                gender_reason = 'این دوره اختصاصاً ویژه دختران / بانوان است.'

        age_reason = ''
        if not age_ok and swimmer_age is not None:
            if obj.min_age is not None and swimmer_age < obj.min_age:
                age_reason = f'حداقل سن مجاز {obj.min_age} سال است (سن شما: {swimmer_age} سال).'
            elif obj.max_age is not None and swimmer_age > obj.max_age:
                age_reason = f'حداکثر سن مجاز {obj.max_age} سال است (سن شما: {swimmer_age} سال).'
        elif swimmer_age is None and (obj.min_age is not None or obj.max_age is not None):
            age_reason = 'تاریخ تولد شناگر در پروفایل ثبت نشده است.'

        return {
            'has_profile': True,
            'swimmer_id': swimmer.id,
            'swimmer_name': swimmer.full_name,
            'swimmer_gender': swimmer_gender,
            'swimmer_age': swimmer_age,
            'gender_matched': gender_ok,
            'age_matched': age_ok,
            'is_matched': gender_ok and age_ok,
            'gender_reason': gender_reason,
            'age_reason': age_reason,
        }

    def get_is_matched(self, obj):
        details = self.get_match_details(obj)
        return details.get('is_matched', True)

    def get_is_enrolled(self, obj):
        swimmer = self._get_target_swimmer()
        if not swimmer:
            return False
        return obj.enrollments.filter(swimmer=swimmer, status__in=['ACTIVE', 'PENDING_PAYMENT']).exists()

    def get_has_pending_request(self, obj):
        swimmer = self._get_target_swimmer()
        if not swimmer:
            return False
        return obj.enrollment_requests.filter(swimmer=swimmer, status='PENDING').exists()

    def get_enrollment_status(self, obj):
        swimmer = self._get_target_swimmer()
        if not swimmer:
            return 'NOT_ENROLLED'
        enr = obj.enrollments.filter(swimmer=swimmer).first()
        if enr:
            return enr.status
        if obj.enrollment_requests.filter(swimmer=swimmer, status='PENDING').exists():
            return 'REQUEST_PENDING'
        return 'AVAILABLE'

    def get_time_display(self, obj):
        if obj.start_time and obj.end_time:
            st = obj.start_time.strftime('%H:%M') if hasattr(obj.start_time, 'strftime') else str(obj.start_time)[:5]
            et = obj.end_time.strftime('%H:%M') if hasattr(obj.end_time, 'strftime') else str(obj.end_time)[:5]
            return f"{st} الی {et}"
        return ''

    def get_session_price(self, obj):
        if obj.sessions_count and obj.sessions_count > 0:
            return round(obj.base_price / obj.sessions_count)
        return 0

    def get_total_capacity(self, obj):
        try:
            return sum(g.capacity for g in obj.groups.all())
        except Exception:
            return 0

    def get_remaining_capacity(self, obj):
        try:
            return sum(g.remaining_capacity for g in obj.groups.all())
        except Exception:
            return 0

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
                coach_label = (c.user.get_full_name().strip() if c.user else '') or 'مربی'
                degree_display = ''
                try:
                    degree_display = c.get_coaching_degree_display() or ''
                except Exception:
                    degree_display = getattr(c, 'coaching_degree', '') or ''
                result.append({
                    'id': c.id,
                    'full_name': coach_label,
                    'avatar': avatar_url,
                    'class_name': f"کلاس {coach_label}",
                    'coaching_degree': degree_display,
                    'years_of_experience': getattr(c, 'years_of_experience', 0) or 0,
                })
        except Exception:
            pass
        return result

    def validate(self, attrs):
        # Enforce at least one coach when creating a course
        if self.instance is None:
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
    group_name = serializers.CharField(source='group.name', read_only=True, default=None, allow_null=True)
    coach_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    course_max_installments = serializers.IntegerField(source='course.installments_count', read_only=True)
    course_base_price = serializers.DecimalField(source='course.base_price', max_digits=12, decimal_places=2, read_only=True)
    course_card_number = serializers.CharField(source='course.card_number', read_only=True)
    course_card_holder = serializers.CharField(source='course.card_holder', read_only=True)
    course_pool = serializers.CharField(source='course.pool_location', read_only=True, default='')
    course_days = serializers.CharField(source='course.days_of_week', read_only=True, default='')
    course_time = serializers.SerializerMethodField(read_only=True)
    course_start_date = serializers.DateField(source='course.start_date', read_only=True, default=None)
    course_end_date = serializers.DateField(source='course.end_date', read_only=True, default=None)
    course_gender_display = serializers.CharField(source='course.get_gender_display', read_only=True, default='')
    course_sessions_count = serializers.IntegerField(source='course.sessions_count', read_only=True, default=12)
    course_age_range = serializers.CharField(source='course.age_range', read_only=True, default='')
    course_what_you_learn = serializers.CharField(source='course.what_you_learn', read_only=True, default='')
    course_description = serializers.CharField(source='course.description', read_only=True, default='')

    class Meta:
        model = EnrollmentRequest
        fields = [
            'id', 'swimmer', 'applicant_name', 'applicant_phone',
            'applicant_national_id', 'course', 'course_name', 'group',
            'group_name', 'coach', 'coach_name', 'status', 'status_display',
            'selected_installments', 'installment_amounts',
            'course_max_installments', 'course_base_price', 'course_card_number', 'course_card_holder',
            'course_pool', 'course_days', 'course_time', 'course_start_date', 'course_end_date',
            'course_gender_display', 'course_sessions_count', 'course_age_range',
            'course_what_you_learn', 'course_description',
            'notes', 'rejection_reason', 'created_at', 'reviewed_at'
        ]
        read_only_fields = [
            'id', 'status', 'rejection_reason', 'created_at', 'reviewed_at',
            'course_max_installments', 'course_base_price', 'course_card_number', 'course_card_holder',
            'course_pool', 'course_days', 'course_time', 'course_start_date', 'course_end_date',
            'course_gender_display', 'course_sessions_count', 'course_age_range',
            'course_what_you_learn', 'course_description'
        ]

    def get_coach_name(self, obj):
        return _safe_coach_name(obj.coach)

    def get_course_time(self, obj):
        if obj.course and obj.course.start_time and obj.course.end_time:
            st = obj.course.start_time.strftime('%H:%M') if hasattr(obj.course.start_time, 'strftime') else str(obj.course.start_time)[:5]
            et = obj.course.end_time.strftime('%H:%M') if hasattr(obj.course.end_time, 'strftime') else str(obj.course.end_time)[:5]
            return f"{st} الی {et}"
        return ''

    def validate(self, attrs):
        course = attrs.get('course')
        selected_inst = attrs.get('selected_installments', 1)
        installment_amounts = attrs.get('installment_amounts', [])

        if selected_inst is not None and selected_inst < 1:
            raise serializers.ValidationError({'selected_installments': 'تعداد اقساط باید حداقل ۱ قسط باشد.'})
        if course and selected_inst:
            max_inst = getattr(course, 'installments_count', 1) or 1
            if selected_inst > max_inst:
                raise serializers.ValidationError({
                    'selected_installments': f'تعداد اقساط انتخابی ({selected_inst}) نمی‌تواند از سقف مجاز دوره ({max_inst} قسط) بیشتر باشد.'
                })

        if installment_amounts:
            if not isinstance(installment_amounts, list):
                raise serializers.ValidationError({'installment_amounts': 'مبالغ اقساط باید به صورت لیست ارائه شود.'})
            if len(installment_amounts) != selected_inst:
                raise serializers.ValidationError({
                    'installment_amounts': f'تعداد مبالغ وارد شده ({len(installment_amounts)}) با تعداد اقساط انتخابی ({selected_inst}) مطابقت ندارد.'
                })
            try:
                from decimal import Decimal
                amounts_dec = [Decimal(str(a)) for a in installment_amounts]
                if any(a <= 0 for a in amounts_dec):
                    raise serializers.ValidationError({'installment_amounts': 'مبلغ هر قسط باید بزرگتر از صفر باشد.'})
                if course and sum(amounts_dec) != course.base_price:
                    raise serializers.ValidationError({
                        'installment_amounts': f'مجموع مبالغ اقساط ({sum(amounts_dec):,} تومان) باید دقیقا با مبلغ شهریه دوره ({course.base_price:,} تومان) برابر باشد.'
                    })
            except (ValueError, TypeError):
                raise serializers.ValidationError({'installment_amounts': 'فرمت مبالغ اقساط نامعتبر است.'})

        return super().validate(attrs)


class EnrollmentSerializer(serializers.ModelSerializer):
    swimmer_name = serializers.CharField(source='swimmer.full_name', read_only=True)
    swimmer_avatar = serializers.SerializerMethodField()
    swimmer_date_of_birth = serializers.SerializerMethodField()
    swimmer_age = serializers.SerializerMethodField()
    swimmer_phone = serializers.CharField(source='swimmer.phone', read_only=True)
    swimmer_national_id = serializers.CharField(source='swimmer.national_id', read_only=True)
    swimmer_level_name = serializers.CharField(source='swimmer.current_level.name', read_only=True)
    swimmer_gender = serializers.CharField(source='swimmer.gender', read_only=True)
    swimmer_gender_display = serializers.CharField(source='swimmer.get_gender_display', read_only=True)
    swimmer_level_id = serializers.IntegerField(source='swimmer.current_level_id', read_only=True)

    course_name = serializers.CharField(source='course.name', read_only=True)
    course_pool = serializers.CharField(source='course.pool_location', read_only=True, default='')
    course_days = serializers.CharField(source='course.days_of_week', read_only=True, default='')
    course_time = serializers.SerializerMethodField()
    course_gender = serializers.CharField(source='course.gender', read_only=True, default='')
    course_gender_display = serializers.CharField(source='course.get_gender_display', read_only=True, default='')
    course_start_date = serializers.DateField(source='course.start_date', read_only=True, default=None)
    course_end_date = serializers.DateField(source='course.end_date', read_only=True, default=None)
    course_sessions_count = serializers.IntegerField(source='course.sessions_count', read_only=True, default=12)
    course_base_price = serializers.DecimalField(source='course.base_price', max_digits=12, decimal_places=2, read_only=True, default=0)
    course_installments_count = serializers.IntegerField(source='course.installments_count', read_only=True, default=1)
    course_card_number = serializers.CharField(source='course.card_number', read_only=True, default='')
    course_card_holder = serializers.CharField(source='course.card_holder', read_only=True, default='')
    course_age_range = serializers.CharField(source='course.age_range', read_only=True, default='')
    course_what_you_learn = serializers.CharField(source='course.what_you_learn', read_only=True, default='')
    course_description = serializers.CharField(source='course.description', read_only=True, default='')

    group_name = serializers.CharField(source='group.name', read_only=True, default=None, allow_null=True)
    coach_name = serializers.SerializerMethodField()
    coach_avatar = serializers.SerializerMethodField()

    course_coaches = serializers.SerializerMethodField()
    remaining_sessions = serializers.IntegerField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            'id', 'swimmer', 'swimmer_name', 'swimmer_avatar', 'swimmer_date_of_birth', 'swimmer_age', 'swimmer_phone',
            'swimmer_national_id', 'swimmer_level_name', 'swimmer_gender',
            'swimmer_gender_display', 'swimmer_level_id',
            'course', 'course_name', 'course_pool', 'course_days', 'course_time', 'course_gender',
            'course_gender_display', 'course_start_date', 'course_end_date', 'course_sessions_count',
            'course_base_price', 'course_installments_count', 'course_card_number', 'course_card_holder',
            'course_age_range', 'course_what_you_learn', 'course_description',
            'group', 'group_name', 'coach', 'coach_name', 'coach_avatar',
            'course_coaches', 'status', 'status_display',
            'sessions_purchased', 'sessions_attended', 'remaining_sessions',
            'selected_installments', 'installment_amounts', 'enrolled_at', 'notes'
        ]
        read_only_fields = ['id', 'enrolled_at', 'sessions_attended', 'remaining_sessions']

    def get_swimmer_avatar(self, obj):
        if obj.swimmer and obj.swimmer.avatar:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.swimmer.avatar.url) if request else obj.swimmer.avatar.url
        return None

    def get_swimmer_date_of_birth(self, obj):
        if obj.swimmer and obj.swimmer.date_of_birth:
            return obj.swimmer.date_of_birth.strftime('%Y-%m-%d')
        return None

    def get_swimmer_age(self, obj):
        if obj.swimmer and obj.swimmer.date_of_birth:
            today = timezone.localdate()
            dob = obj.swimmer.date_of_birth
            return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        return None

    def get_coach_name(self, obj):
        return _safe_coach_name(obj.coach)

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
            coach_label = (c.user.get_full_name().strip() if c.user else '') or 'مربی'
            degree_display = ''
            try:
                degree_display = c.get_coaching_degree_display() or ''
            except Exception:
                degree_display = getattr(c, 'coaching_degree', '') or ''
            result.append({
                'id': c.id,
                'full_name': coach_label,
                'avatar': avatar_url,
                'class_name': f"کلاس {coach_label}",
                'coaching_degree': degree_display,
                'years_of_experience': getattr(c, 'years_of_experience', 0) or 0,
            })
        return result

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        user = request.user if request and hasattr(request, 'user') and request.user.is_authenticated else None
        is_privileged = bool(user and (user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser))
        is_owner_swimmer = False
        if user and user.role == 'SWIMMER' and instance.swimmer:
            if instance.swimmer.user_id and instance.swimmer.user_id == user.id:
                is_owner_swimmer = True
            else:
                from apps.swimmers.models import SwimmerGuardianRelation
                is_owner_swimmer = SwimmerGuardianRelation.objects.filter(
                    guardian=user,
                    swimmer=instance.swimmer,
                    is_verified=True
                ).exists()
        if not (is_privileged or is_owner_swimmer):
            ret.pop('swimmer_phone', None)
            ret.pop('swimmer_national_id', None)
        return ret

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
