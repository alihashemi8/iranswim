from rest_framework import serializers
from .models import SwimmerProfile, SwimmerGuardianRelation
from apps.education.models import SkillLevel


class SwimmerProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    level_name = serializers.CharField(source='current_level.name', read_only=True)
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    has_required_info = serializers.BooleanField(read_only=True)
    birth_certificate_status_display = serializers.CharField(source='get_birth_certificate_status_display', read_only=True)
    national_card_status_display = serializers.CharField(source='get_national_card_status_display', read_only=True)
    sports_insurance_status_display = serializers.CharField(source='get_sports_insurance_status_display', read_only=True)

    current_enrollment = serializers.SerializerMethodField()
    coach_name = serializers.SerializerMethodField()
    coach_avatar = serializers.SerializerMethodField()
    coach_id = serializers.SerializerMethodField()
    course_name = serializers.SerializerMethodField()
    course_id = serializers.SerializerMethodField()
    course_coaches = serializers.SerializerMethodField()
    group_id = serializers.SerializerMethodField()
    group_name = serializers.SerializerMethodField()
    class_name = serializers.SerializerMethodField()
    available_classes = serializers.SerializerMethodField()

    class Meta:
        model = SwimmerProfile
        fields = [
            'id', 'user', 'first_name', 'last_name', 'full_name',
            'gender', 'gender_display', 'phone', 'national_id',
            'date_of_birth', 'father_name', 'father_phone', 'mother_phone',
            'emergency_contact_name', 'emergency_contact_phone',
            'address', 'latitude', 'longitude', 'school_name',
            'avatar', 'birth_certificate_image', 'birth_certificate_status', 'birth_certificate_status_display',
            'national_card_image', 'national_card_status', 'national_card_status_display',
            'sports_insurance_image', 'sports_insurance_status', 'sports_insurance_status_display',
            'sports_insurance_expiry', 'documents_rejection_reason',
            'is_profile_completed', 'has_required_info',
            'current_level', 'level_name', 'medical_notes', 'is_active',
            'current_enrollment', 'coach_name', 'coach_avatar', 'coach_id',
            'group_id', 'group_name', 'class_name', 'available_classes',
            'course_name', 'course_id', 'course_coaches',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_current_enrollment(self, obj):
        latest = obj.enrollments.select_related('course', 'coach__user', 'group').filter(status='ACTIVE').first()
        if not latest:
            latest = obj.enrollments.select_related('course', 'coach__user', 'group').first()
        if not latest:
            return None
        request = self.context.get('request')
        coach_avatar = None
        if latest.coach and latest.coach.user and latest.coach.user.avatar:
            coach_avatar = request.build_absolute_uri(latest.coach.user.avatar.url) if request else latest.coach.user.avatar.url

        coaches = []
        if latest.course:
            course_coaches = latest.course.coaches.all()
            if not course_coaches.exists():
                from apps.coaches.models import CoachProfile
                course_coaches = CoachProfile.objects.filter(assigned_groups__group__course=latest.course).distinct()
            if not course_coaches.exists():
                from apps.coaches.models import CoachProfile
                course_coaches = CoachProfile.objects.filter(employment_status='ACTIVE')
            for c in course_coaches:
                c_avatar = None
                if c.user and c.user.avatar:
                    c_avatar = request.build_absolute_uri(c.user.avatar.url) if request else c.user.avatar.url
                coaches.append({
                    'id': c.id,
                    'full_name': c.full_name,
                    'avatar': c_avatar,
                    'class_name': f"کلاس {c.full_name}"
                })

        time_display = ''
        if latest.course and latest.course.start_time and latest.course.end_time:
            st = latest.course.start_time.strftime('%H:%M') if hasattr(latest.course.start_time, 'strftime') else str(latest.course.start_time)[:5]
            et = latest.course.end_time.strftime('%H:%M') if hasattr(latest.course.end_time, 'strftime') else str(latest.course.end_time)[:5]
            time_display = f"{st} الی {et}"

        return {
            'id': latest.id,
            'course_id': latest.course.id if latest.course else None,
            'course_name': latest.course.name if latest.course else None,
            'pool_location': latest.course.pool_location if latest.course else '',
            'days_of_week': latest.course.days_of_week if latest.course else '',
            'time_display': time_display,
            'group_id': latest.group.id if latest.group else None,
            'group_name': latest.group.name if latest.group else None,
            'coach_id': latest.coach.id if latest.coach else None,
            'coach_name': latest.coach.full_name if latest.coach else None,
            'coach_avatar': coach_avatar,
            'course_coaches': coaches,
            'status': latest.status
        }

    def get_coach_name(self, obj):
        enr = self.get_current_enrollment(obj)
        return enr['coach_name'] if enr else None

    def get_coach_avatar(self, obj):
        enr = self.get_current_enrollment(obj)
        return enr['coach_avatar'] if enr else None

    def get_coach_id(self, obj):
        enr = self.get_current_enrollment(obj)
        return enr['coach_id'] if enr else None

    def get_course_name(self, obj):
        enr = self.get_current_enrollment(obj)
        return enr['course_name'] if enr else None

    def get_course_id(self, obj):
        enr = self.get_current_enrollment(obj)
        return enr['course_id'] if enr else None

    def get_course_coaches(self, obj):
        enr = self.get_current_enrollment(obj)
        if enr and enr.get('course_coaches'):
            return enr['course_coaches']
        from apps.coaches.models import CoachProfile
        request = self.context.get('request')
        active_coaches = CoachProfile.objects.filter(employment_status='ACTIVE')
        res = []
        for c in active_coaches:
            c_avatar = None
            if c.user and c.user.avatar:
                c_avatar = request.build_absolute_uri(c.user.avatar.url) if request else c.user.avatar.url
            res.append({
                'id': c.id,
                'full_name': c.full_name,
                'avatar': c_avatar,
                'class_name': f"کلاس {c.full_name}"
            })
        return res

    def get_group_id(self, obj):
        enr = self.get_current_enrollment(obj)
        return enr['group_id'] if enr else None

    def get_group_name(self, obj):
        enr = self.get_current_enrollment(obj)
        return enr['group_name'] if enr else None

    def get_class_name(self, obj):
        enr = self.get_current_enrollment(obj)
        if not enr:
            return None
        if enr.get('group_name'):
            return enr['group_name']
        if enr.get('coach_name'):
            return f"کلاس {enr['coach_name']}"
        return None

    def get_available_classes(self, obj):
        enr = self.get_current_enrollment(obj)
        request = self.context.get('request')
        from apps.education.models import SwimmerGroup

        classes = []
        current_course_id = enr.get('course_id') if enr else None

        groups = SwimmerGroup.objects.all().select_related('course').prefetch_related('coach_assignments__coach__user')
        for g in groups:
            primary_coach = g.coach_assignments.filter(is_primary=True).first()
            if not primary_coach:
                primary_coach = g.coach_assignments.first()
            c_avatar = None
            coach_id = None
            coach_name = None
            if primary_coach and primary_coach.coach:
                coach_id = primary_coach.coach.id
                coach_name = primary_coach.coach.full_name
                if primary_coach.coach.user and primary_coach.coach.user.avatar:
                    c_avatar = request.build_absolute_uri(primary_coach.coach.user.avatar.url) if request else primary_coach.coach.user.avatar.url
            
            is_curr = bool(current_course_id and g.course_id == current_course_id)
            classes.append({
                'id': f"g_{g.id}",
                'group_id': g.id,
                'coach_id': coach_id,
                'name': g.name,
                'coach_name': coach_name,
                'avatar': c_avatar,
                'course_id': g.course_id,
                'course_name': g.course.name if g.course else '',
                'is_current_course': is_curr,
                'capacity': g.capacity,
                'remaining_capacity': g.remaining_capacity,
            })

        # Sort: current course classes first, then course name, then class name
        classes.sort(key=lambda x: (0 if x['is_current_course'] else 1, x['course_name'], x['name']))

        return classes


class SwimmerGuardianRelationSerializer(serializers.ModelSerializer):
    swimmer_detail = SwimmerProfileSerializer(source='swimmer', read_only=True)
    relationship_display = serializers.CharField(source='get_relationship_type_display', read_only=True)

    class Meta:
        model = SwimmerGuardianRelation
        fields = [
            'id', 'guardian', 'swimmer', 'swimmer_detail',
            'relationship_type', 'relationship_display',
            'is_primary', 'is_verified', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate(self, attrs):
        # If completing profile or updating contact info, ensure at least father_phone or mother_phone is provided if completing
        is_completing = attrs.get('is_profile_completed', False) or self.instance and self.instance.is_profile_completed
        father_p = attrs.get('father_phone', self.instance.father_phone if self.instance else '')
        mother_p = attrs.get('mother_phone', self.instance.mother_phone if self.instance else '')
        
        if is_completing and not (father_p or mother_p):
            raise serializers.ValidationError({
                'parent_phone': 'ثبت حداقل یکی از شماره‌های تماس پدر یا مادر الزامی است.'
            })
        return attrs

    def update(self, instance, validated_data):
        profile = super().update(instance, validated_data)
        # Synchronize first_name and last_name with linked User model if changed
        if profile.user:
            user_changed = False
            if 'first_name' in validated_data and profile.user.first_name != profile.first_name:
                profile.user.first_name = profile.first_name
                user_changed = True
            if 'last_name' in validated_data and profile.user.last_name != profile.last_name:
                profile.user.last_name = profile.last_name
                user_changed = True
            if 'national_id' in validated_data and profile.user.national_id != profile.national_id:
                profile.user.national_id = profile.national_id
                user_changed = True
            if user_changed:
                profile.user.save()
        return profile

