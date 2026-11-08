import datetime
from decimal import Decimal
from django.utils import timezone
from rest_framework import serializers

from .models import (
    CoachProfile, CoachCertificate, CoachContract, CoachPayroll,
    PayrollAdjustment, CoachPaymentRecord, CoachLeaveRequest,
    CoachPerformanceEvaluation, CoachAdministrativeNote, CoachActivityLog,
    CoachAttendanceCorrectionAudit, WorkoutPlan
)
from apps.education.models import SwimmerGroup, SkillLevel, GroupSchedule, GroupCoach
from apps.scheduling.models import ClassSession
from apps.swimmers.models import SwimmerProfile
from apps.accounts.models import User
from apps.accounts.validators import validate_password_complexity


class CoachPublicSerializer(serializers.ModelSerializer):
    """
    سریالایزر عمومی مربیان جهت نمایش در صفحه لندینگ و پرتال عمومی.
    اطلاعات هویتی و مالی کاملاً محرمانه است و حذف می‌شود.
    """
    full_name = serializers.CharField(read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    avatar = serializers.SerializerMethodField()
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    assigned_groups_count = serializers.SerializerMethodField()

    class Meta:
        model = CoachProfile
        fields = [
            'id', 'first_name', 'last_name', 'full_name',
            'avatar', 'gender', 'gender_display', 'display_order', 'show_on_landing',
            'specialties', 'bio', 'years_of_experience', 'assigned_groups_count'
        ]
        read_only_fields = fields

    def get_avatar(self, obj):
        if obj.user and obj.user.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user.avatar.url)
            return obj.user.avatar.url
        return None

    def get_assigned_groups_count(self, obj):
        return obj.assigned_groups.count()


class CoachCertificateSerializer(serializers.ModelSerializer):
    coach_name = serializers.CharField(source='coach.full_name', read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = CoachCertificate
        fields = [
            'id', 'coach', 'coach_name', 'title', 'issuing_organization',
            'issue_date', 'expiration_date', 'certificate_number',
            'file', 'file_url', 'is_verified', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'coach_name', 'created_at']

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class CoachContractSerializer(serializers.ModelSerializer):
    coach_name = serializers.CharField(source='coach.full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    contract_type_display = serializers.CharField(source='get_contract_type_display', read_only=True)
    employment_type_display = serializers.CharField(source='get_employment_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_expiring_soon = serializers.SerializerMethodField()
    document_url = serializers.SerializerMethodField()

    class Meta:
        model = CoachContract
        fields = [
            'id', 'coach', 'coach_name', 'contract_number', 'contract_type',
            'contract_type_display', 'start_date', 'end_date', 'employment_type',
            'employment_type_display', 'hourly_rate', 'fixed_salary', 'percentage_rate',
            'percentage_basis', 'agreed_weekly_hours', 'status', 'status_display',
            'document', 'document_url', 'terms_and_conditions', 'internal_notes',
            'is_expiring_soon', 'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'coach_name', 'created_by_name', 'created_at', 'updated_at']

    def get_is_expiring_soon(self, obj):
        if obj.status == CoachContract.Status.ACTIVE and obj.end_date:
            today = timezone.now().date()
            diff = (obj.end_date - today).days
            return 0 <= diff <= 30
        return False

    def get_document_url(self, obj):
        if obj.document:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.document.url)
            return obj.document.url
        return None


class PayrollAdjustmentSerializer(serializers.ModelSerializer):
    adjustment_type_display = serializers.CharField(source='get_adjustment_type_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)

    class Meta:
        model = PayrollAdjustment
        fields = [
            'id', 'payroll', 'adjustment_type', 'adjustment_type_display',
            'amount', 'title', 'reason', 'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_by_name', 'created_at']


class CoachPaymentRecordSerializer(serializers.ModelSerializer):
    coach_name = serializers.CharField(source='coach.full_name', read_only=True)
    registered_by_name = serializers.CharField(source='registered_by.full_name', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    receipt_document_url = serializers.SerializerMethodField()

    class Meta:
        model = CoachPaymentRecord
        fields = [
            'id', 'payroll', 'coach', 'coach_name', 'payment_number',
            'amount', 'payment_date', 'payment_method', 'payment_method_display',
            'reference_number', 'receipt_document', 'receipt_document_url',
            'description', 'registered_by', 'registered_by_name',
            'is_reversal', 'reverses_payment', 'created_at'
        ]
        read_only_fields = ['id', 'coach_name', 'registered_by_name', 'payment_number', 'created_at']

    def get_receipt_document_url(self, obj):
        if obj.receipt_document:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.receipt_document.url)
            return obj.receipt_document.url
        return None


class CoachPayrollSerializer(serializers.ModelSerializer):
    coach_name = serializers.CharField(source='coach.full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.full_name', read_only=True)
    compensation_model_display = serializers.CharField(source='get_compensation_model_display', read_only=True)
    approval_status_display = serializers.CharField(source='get_approval_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    total_paid = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    remaining_balance = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    adjustments = PayrollAdjustmentSerializer(many=True, read_only=True)
    payments = CoachPaymentRecordSerializer(many=True, read_only=True)

    class Meta:
        model = CoachPayroll
        fields = [
            'id', 'coach', 'coach_name', 'contract', 'period_label',
            'period_start', 'period_end', 'compensation_model', 'compensation_model_display',
            'base_rate', 'teaching_hours', 'completed_sessions_count', 'eligible_revenue',
            'base_compensation', 'bonuses_amount', 'overtime_amount', 'deductions_amount',
            'gross_amount', 'net_payable_amount', 'total_paid', 'remaining_balance',
            'approval_status', 'approval_status_display', 'payment_status', 'payment_status_display',
            'approved_by', 'approved_by_name', 'approved_at', 'notes',
            'adjustments', 'payments', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'coach_name', 'approved_by_name', 'total_paid', 'remaining_balance',
            'approval_status_display', 'payment_status_display', 'created_at', 'updated_at'
        ]


class CoachLeaveRequestSerializer(serializers.ModelSerializer):
    coach_name = serializers.CharField(source='coach.full_name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.full_name', read_only=True)
    leave_type_display = serializers.CharField(source='get_leave_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    document_url = serializers.SerializerMethodField()

    class Meta:
        model = CoachLeaveRequest
        fields = [
            'id', 'coach', 'coach_name', 'leave_type', 'leave_type_display',
            'start_date', 'end_date', 'hours_requested', 'reason',
            'document', 'document_url', 'status', 'status_display',
            'reviewed_by', 'reviewed_by_name', 'reviewed_at', 'admin_notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'coach_name', 'reviewed_by_name', 'reviewed_at', 'created_at', 'updated_at']

    def get_document_url(self, obj):
        if obj.document:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.document.url)
            return obj.document.url
        return None


class CoachPerformanceEvaluationSerializer(serializers.ModelSerializer):
    coach_name = serializers.CharField(source='coach.full_name', read_only=True)
    evaluator_name = serializers.CharField(source='evaluator.full_name', read_only=True)

    class Meta:
        model = CoachPerformanceEvaluation
        fields = [
            'id', 'coach', 'coach_name', 'evaluator', 'evaluator_name',
            'evaluation_date', 'period_label', 'criteria_ratings',
            'overall_score', 'strengths', 'weaknesses', 'recommendations',
            'general_feedback', 'is_shared_with_coach', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'coach_name', 'evaluator_name', 'created_at', 'updated_at']


class CoachAdministrativeNoteSerializer(serializers.ModelSerializer):
    coach_name = serializers.CharField(source='coach.full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = CoachAdministrativeNote
        fields = [
            'id', 'coach', 'coach_name', 'category', 'category_display',
            'title', 'description', 'date', 'severity', 'severity_display',
            'attachment', 'attachment_url', 'created_by', 'created_by_name',
            'is_confidential', 'created_at'
        ]
        read_only_fields = ['id', 'coach_name', 'created_by_name', 'created_at']

    def get_attachment_url(self, obj):
        if obj.attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.attachment.url)
            return obj.attachment.url
        return None


class CoachActivityLogSerializer(serializers.ModelSerializer):
    coach_name = serializers.CharField(source='coach.full_name', read_only=True)
    actor_name = serializers.CharField(source='actor.full_name', read_only=True)
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)

    class Meta:
        model = CoachActivityLog
        fields = [
            'id', 'coach', 'coach_name', 'event_type', 'event_type_display',
            'actor', 'actor_name', 'description', 'metadata', 'created_at'
        ]
        read_only_fields = fields


class CoachAttendanceCorrectionAuditSerializer(serializers.ModelSerializer):
    coach_name = serializers.CharField(source='coach.full_name', read_only=True)
    adjusted_by_name = serializers.CharField(source='adjusted_by.full_name', read_only=True)
    session_date = serializers.DateField(source='session.session_date', read_only=True)
    session_group_name = serializers.CharField(source='session.group.name', read_only=True)

    class Meta:
        model = CoachAttendanceCorrectionAudit
        fields = [
            'id', 'coach', 'coach_name', 'session', 'session_date', 'session_group_name',
            'previous_status', 'new_status', 'previous_hours', 'new_hours',
            'reason', 'adjusted_by', 'adjusted_by_name', 'created_at'
        ]
        read_only_fields = fields


class CoachProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    phone = serializers.CharField(required=False)
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    national_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    lifeguard_expiration = serializers.DateField(required=False, allow_null=True)
    employment_start_date = serializers.DateField(required=False, allow_null=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    avatar = serializers.SerializerMethodField()
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    employment_status_display = serializers.CharField(source='get_employment_status_display', read_only=True)
    employment_type_display = serializers.CharField(source='get_employment_type_display', read_only=True)
    assigned_groups_count = serializers.SerializerMethodField()
    active_classes_count = serializers.SerializerMethodField()
    active_contract_summary = serializers.SerializerMethodField()
    current_month_payroll_status = serializers.SerializerMethodField()

    class Meta:
        model = CoachProfile
        fields = [
            'id', 'user', 'first_name', 'last_name', 'full_name', 'phone', 'national_id',
            'password', 'avatar', 'personnel_id', 'gender', 'gender_display',
            'date_of_birth', 'emergency_contact_name', 'emergency_contact_phone', 'address', 'internal_notes',
            'display_order', 'show_on_landing', 'specialties', 'bio',
            'lifeguard_certificate', 'lifeguard_expiration', 'years_of_experience',
            'previous_experience', 'additional_skills',
            'employment_start_date', 'employment_status', 'employment_status_display',
            'employment_type', 'employment_type_display',
            'hourly_rate', 'fixed_monthly_salary', 'revenue_percentage', 'percentage_revenue_basis',
            'contractual_weekly_hours', 'assigned_groups_count', 'active_classes_count',
            'active_contract_summary', 'current_month_payroll_status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
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

    def get_active_classes_count(self, obj):
        return obj.assigned_groups.filter(group__status__in=['OPEN', 'FULL']).count()

    def get_active_contract_summary(self, obj):
        contract = obj.contracts.filter(status=CoachContract.Status.ACTIVE).order_by('-start_date').first()
        if not contract:
            return None
        today = timezone.now().date()
        diff = (contract.end_date - today).days if contract.end_date else 999
        return {
            'id': contract.id,
            'contract_number': contract.contract_number,
            'contract_type': contract.contract_type,
            'contract_type_display': contract.get_contract_type_display(),
            'start_date': contract.start_date,
            'end_date': contract.end_date,
            'is_expiring_soon': 0 <= diff <= 30,
            'status': contract.status,
            'employment_type': contract.employment_type,
            'employment_type_display': contract.get_employment_type_display(),
        }

    def get_current_month_payroll_status(self, obj):
        today = timezone.now().date()
        # Find payroll overlapping current month
        p = obj.payrolls.filter(
            period_start__lte=today,
            period_end__gte=today
        ).order_by('-created_at').first()
        if not p:
            # Try last 30 days
            p = obj.payrolls.order_by('-period_end').first()
        if p:
            return {
                'id': p.id,
                'period_label': p.period_label,
                'approval_status': p.approval_status,
                'payment_status': p.payment_status,
                'payment_status_display': p.get_payment_status_display(),
                'net_payable': str(p.net_payable_amount),
                'total_paid': str(p.total_paid),
                'remaining_balance': str(p.remaining_balance)
            }
        return None

    def validate_password(self, value):
        if value:
            validate_password_complexity(value)
        return value

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        for date_field in ['date_of_birth', 'lifeguard_expiration', 'employment_start_date']:
            if date_field in data and (data[date_field] == '' or data[date_field] is None):
                data[date_field] = None

        for num_field in ['years_of_experience', 'contractual_weekly_hours', 'display_order']:
            if num_field in data and (data[num_field] == '' or data[num_field] is None):
                data[num_field] = 0

        for dec_field in ['hourly_rate', 'fixed_monthly_salary', 'revenue_percentage']:
            if dec_field in data and (data[dec_field] == '' or data[dec_field] is None):
                data[dec_field] = '0'

        if 'personnel_id' in data and not data['personnel_id']:
            data['personnel_id'] = None

        return super().to_internal_value(data)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        user = request.user if request and hasattr(request, 'user') and request.user.is_authenticated else None
        
        is_admin = bool(user and (user.role == 'ADMIN' or user.is_superuser))
        is_supervisor = bool(user and user.role == 'SUPERVISOR')
        is_self = bool(user and instance.user and instance.user == user)

        if instance.user:
            ret['first_name'] = instance.user.first_name or ''
            ret['last_name'] = instance.user.last_name or ''
            ret['full_name'] = instance.user.get_full_name() or instance.user.phone or ''
            if is_admin or is_self or is_supervisor:
                ret['phone'] = instance.user.phone or ''
            else:
                ret.pop('phone', None)

            if is_admin or is_self or is_supervisor:
                ret['national_id'] = instance.user.national_id or ''
            else:
                ret.pop('national_id', None)
        else:
            if not (is_admin or is_self or is_supervisor):
                ret.pop('phone', None)
                ret.pop('national_id', None)

        # Confidential fields handling
        if not is_admin:
            ret.pop('internal_notes', None)

        if is_supervisor and not is_admin:
            # Supervisors cannot view monthly payroll status
            ret.pop('current_month_payroll_status', None)

        if not (is_admin or is_supervisor or is_self):
            ret.pop('hourly_rate', None)
            ret.pop('fixed_monthly_salary', None)
            ret.pop('revenue_percentage', None)
            ret.pop('employment_status', None)
            ret.pop('emergency_contact_name', None)
            ret.pop('emergency_contact_phone', None)
            ret.pop('address', None)

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

        request = self.context.get('request')
        if request and 'avatar' in request.FILES:
            user.avatar = request.FILES['avatar']
            user.save(update_fields=['avatar'])

        actor = request.user if request and hasattr(request, 'user') else None
        from .services import CoachActivityLogger
        CoachActivityLogger.log(
            coach=profile,
            event_type=CoachActivityLog.EventType.PROFILE_CREATED,
            actor=actor,
            description=f"ایجاد پرونده مربی جدید {profile.full_name}"
        )

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
            if phone is not None:
                phone = str(phone).strip()
                if not phone:
                    raise serializers.ValidationError({'phone': 'شماره همراه نمی‌تواند خالی باشد.'})
                if phone != user_obj.phone:
                    if User.objects.filter(phone=phone).exclude(pk=user_obj.pk).exists():
                        raise serializers.ValidationError({'phone': 'این شماره همراه قبلاً در سیستم برای کاربر دیگری ثبت شده است.'})
                    user_obj.phone = phone
            if first_name is not None:
                user_obj.first_name = str(first_name).strip()
            if last_name is not None:
                user_obj.last_name = str(last_name).strip()
            if national_id is not None:
                user_obj.national_id = str(national_id).strip() or None
            if password:
                user_obj.set_password(password)

            request = self.context.get('request')
            if request and 'avatar' in request.FILES:
                user_obj.avatar = request.FILES['avatar']

            user_obj.save()

        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()

        request = self.context.get('request')
        actor = request.user if request and hasattr(request, 'user') else None
        from .services import CoachActivityLogger
        CoachActivityLogger.log(
            coach=instance,
            event_type=CoachActivityLog.EventType.PROFILE_UPDATED,
            actor=actor,
            description=f"به‌روزرسانی اطلاعات پرونده مربی {instance.full_name}"
        )

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
