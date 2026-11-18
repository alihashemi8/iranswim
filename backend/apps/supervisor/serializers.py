from rest_framework import serializers
from apps.accounts.models import User
from .models import (
    SystemErrorLog,
    ErrorGroup,
    IncidentActivity,
    AlertRule,
    SystemAlert,
    AuditLog,
    DeploymentMarker,
    BackupRecord,
    SystemSetting,
)
from .fingerprint import parse_stack_trace_frames, extract_code_location


class TechnicianSerializer(serializers.ModelSerializer):
    """سریالایزر امن برای لیست تکنسین‌ها و ناظران فنی جهت تخصیص باگ"""
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'phone', 'full_name', 'role', 'role_display']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.phone


class IncidentActivitySerializer(serializers.ModelSerializer):
    """سریالایزر ردپای حسابرسی و اقدامات روی هر رخداد باگ"""
    actor_name = serializers.SerializerMethodField()
    activity_type_display = serializers.CharField(source='get_activity_type_display', read_only=True)

    class Meta:
        model = IncidentActivity
        fields = [
            'id', 'activity_type', 'activity_type_display', 'actor',
            'actor_name', 'old_value', 'new_value', 'note', 'created_at'
        ]

    def get_actor_name(self, obj):
        if obj.actor:
            return f"{obj.actor.first_name} {obj.actor.last_name}".strip() or obj.actor.phone
        return 'سیستم خودکار'


class SystemErrorOccurrenceSerializer(serializers.ModelSerializer):
    """سریالایزر خلاصه برای نمایش رخدادهای مجزای یک باگ در تایم‌لاین"""
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = SystemErrorLog
        fields = [
            'id', 'timestamp', 'http_method', 'endpoint', 'status_code',
            'ip_address', 'user_agent', 'request_id', 'duration_ms',
            'user', 'user_name'
        ]

    def get_user_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.phone
        return 'مهمان / ناشناس'


class ErrorGroupListSerializer(serializers.ModelSerializer):
    """سریالایزر جدول اصلی گروه‌های خطا و باگ‌ها (Incident Management Table)"""
    assigned_to_name = serializers.SerializerMethodField()
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    first_deployment_version = serializers.SerializerMethodField()

    class Meta:
        model = ErrorGroup
        fields = [
            'id', 'fingerprint', 'title', 'exception_type', 'error_message',
            'severity', 'severity_display', 'category', 'category_display',
            'status', 'status_display', 'status_code', 'http_method', 'endpoint',
            'first_seen', 'last_seen', 'occurrence_count', 'affected_users_count',
            'assigned_to', 'assigned_to_name', 'first_deployment_version'
        ]

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip() or obj.assigned_to.phone
        return None

    def get_first_deployment_version(self, obj):
        if obj.first_deployment:
            return f"{obj.first_deployment.version} ({obj.first_deployment.commit_sha[:7]})"
        return None


class ErrorGroupDetailSerializer(serializers.ModelSerializer):
    """سریالایزر نمای کامل کشو یا صفحه جزئیات باگ (Detailed Inspection View)"""
    assigned_to_name = serializers.SerializerMethodField()
    resolved_by_name = serializers.SerializerMethodField()
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    first_deployment_version = serializers.SerializerMethodField()
    activities = IncidentActivitySerializer(many=True, read_only=True)
    latest_occurrence = serializers.SerializerMethodField()

    class Meta:
        model = ErrorGroup
        fields = [
            'id', 'fingerprint', 'title', 'exception_type', 'error_message',
            'severity', 'severity_display', 'category', 'category_display',
            'status', 'status_display', 'status_code', 'http_method', 'endpoint',
            'first_seen', 'last_seen', 'occurrence_count', 'affected_users_count',
            'assigned_to', 'assigned_to_name', 'suspected_root_cause',
            'resolution_details', 'resolved_at', 'resolved_by', 'resolved_by_name',
            'first_deployment', 'first_deployment_version', 'created_at', 'updated_at',
            'activities', 'latest_occurrence'
        ]

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip() or obj.assigned_to.phone
        return None

    def get_resolved_by_name(self, obj):
        if obj.resolved_by:
            return f"{obj.resolved_by.first_name} {obj.resolved_by.last_name}".strip() or obj.resolved_by.phone
        return None

    def get_first_deployment_version(self, obj):
        if obj.first_deployment:
            return {
                'version': obj.first_deployment.version,
                'commit_sha': obj.first_deployment.commit_sha[:7],
                'deployed_at': obj.first_deployment.deployed_at,
                'status': obj.first_deployment.status
            }
        return None

    def get_latest_occurrence(self, obj):
        latest = obj.occurrences.order_by('-timestamp').first()
        if latest:
            return SystemErrorLogDetailSerializer(latest).data
        return None


class SystemErrorLogDetailSerializer(serializers.ModelSerializer):
    """سریالایزر تفصیلی رخداد تک‌استثنا با پارس استک‌ترس، بافت درخواست و بافت کاربر"""
    user_name = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()
    code_location = serializers.SerializerMethodField()
    parsed_stack_frames = serializers.SerializerMethodField()

    class Meta:
        model = SystemErrorLog
        fields = [
            'id', 'timestamp', 'level', 'endpoint', 'http_method', 'status_code',
            'exception_type', 'error_message', 'stack_trace', 'user', 'user_name',
            'user_role', 'ip_address', 'user_agent', 'request_data', 'request_id',
            'duration_ms', 'query_params', 'headers_summary', 'code_location',
            'parsed_stack_frames', 'is_resolved', 'resolved_at', 'resolution_note'
        ]

    def get_user_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.phone
        return 'کاربر ناشناس / مهمان'

    def get_user_role(self, obj):
        if obj.user:
            return obj.user.get_role_display()
        return 'مهمان'

    def get_code_location(self, obj):
        return extract_code_location(obj.stack_trace)

    def get_parsed_stack_frames(self, obj):
        return parse_stack_trace_frames(obj.stack_trace)


class AlertRuleSerializer(serializers.ModelSerializer):
    """سریالایزر قوانین و شروط ایجاد هشدارهای مانیتورینگ"""
    alert_type_display = serializers.CharField(source='get_alert_type_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)

    class Meta:
        model = AlertRule
        fields = [
            'id', 'name', 'alert_type', 'alert_type_display', 'severity',
            'severity_display', 'threshold_value', 'cooldown_minutes',
            'is_enabled', 'last_triggered_at', 'created_at'
        ]


class SystemAlertSerializer(serializers.ModelSerializer):
    """سریالایزر هشدارهای فعال و تاریخچه هشدارها"""
    rule_name = serializers.CharField(source='rule.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    acknowledged_by_name = serializers.SerializerMethodField()
    resolved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = SystemAlert
        fields = [
            'id', 'rule', 'rule_name', 'title', 'message', 'severity',
            'severity_display', 'status', 'status_display', 'trigger_condition',
            'dedup_key', 'created_at', 'acknowledged_at', 'acknowledged_by',
            'acknowledged_by_name', 'resolved_at', 'resolved_by',
            'resolved_by_name', 'details'
        ]

    def get_acknowledged_by_name(self, obj):
        if obj.acknowledged_by:
            return f"{obj.acknowledged_by.first_name} {obj.acknowledged_by.last_name}".strip() or obj.acknowledged_by.phone
        return None

    def get_resolved_by_name(self, obj):
        if obj.resolved_by:
            return f"{obj.resolved_by.first_name} {obj.resolved_by.last_name}".strip() or obj.resolved_by.phone
        return None


# ==============================================================================
# LEGACY SERIALIZERS PRESERVED FOR FULL BACKWARD COMPATIBILITY
# ==============================================================================

class SystemErrorLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    resolved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = SystemErrorLog
        fields = [
            'id', 'timestamp', 'level', 'endpoint', 'http_method', 'status_code',
            'exception_type', 'error_message', 'stack_trace', 'user', 'user_name',
            'ip_address', 'user_agent', 'request_data', 'is_resolved',
            'resolved_by', 'resolved_by_name', 'resolved_at', 'resolution_note'
        ]
        read_only_fields = ['id', 'timestamp', 'stack_trace', 'user', 'endpoint', 'http_method', 'status_code']

    def get_user_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.phone
        return 'کاربر ناشناس / مهمان'

    def get_resolved_by_name(self, obj):
        if obj.resolved_by:
            return f"{obj.resolved_by.first_name} {obj.resolved_by.last_name}".strip() or obj.resolved_by.phone
        return None


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'actor', 'actor_name', 'action', 'action_display', 'entity_type', 'entity_id',
            'details', 'ip_address', 'timestamp'
        ]

    def get_actor_name(self, obj):
        if obj.actor:
            return f"{obj.actor.first_name} {obj.actor.last_name}".strip() or obj.actor.phone
        return 'سامانه خودکار'


class DeploymentMarkerSerializer(serializers.ModelSerializer):
    deployed_by_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = DeploymentMarker
        fields = [
            'id', 'version', 'commit_sha', 'commit_message', 'branch', 'environment',
            'status', 'status_display', 'deployed_at', 'deployed_by', 'deployed_by_name', 'details'
        ]

    def get_deployed_by_name(self, obj):
        if obj.deployed_by:
            return f"{obj.deployed_by.first_name} {obj.deployed_by.last_name}".strip() or obj.deployed_by.phone
        return 'GitHub Actions CI/CD'


class BackupRecordSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    backup_type_display = serializers.CharField(source='get_backup_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    file_size_formatted = serializers.SerializerMethodField()

    class Meta:
        model = BackupRecord
        fields = [
            'id', 'filename', 'file_size_bytes', 'file_size_formatted', 'backup_type',
            'backup_type_display', 'status', 'status_display', 'checksum', 'created_at',
            'created_by', 'created_by_name', 'duration_seconds', 'notes'
        ]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.phone
        return 'کرون‌جاب خودکار سرور'

    def get_file_size_formatted(self, obj):
        mb = obj.file_size_bytes / (1024 * 1024)
        if mb >= 1:
            return f"{round(mb, 2)} مگابایت"
        return f"{round(obj.file_size_bytes / 1024, 1)} کیلوبایت"


class SystemSettingSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = SystemSetting
        fields = [
            'id', 'key', 'value', 'description', 'is_public', 'updated_at',
            'updated_by', 'updated_by_name'
        ]

    def get_updated_by_name(self, obj):
        if obj.updated_by:
            return f"{obj.updated_by.first_name} {obj.updated_by.last_name}".strip() or obj.updated_by.phone
        return 'پیش‌فرض سیستم'


class SupervisorUserInspectionSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'phone', 'full_name', 'role', 'role_display', 'is_staff',
            'is_superuser', 'is_active', 'date_joined', 'last_login'
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.phone
