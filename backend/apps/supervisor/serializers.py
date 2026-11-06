from rest_framework import serializers
from apps.accounts.models import User
from .models import SystemErrorLog, AuditLog, DeploymentMarker, BackupRecord, SystemSetting


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
    """Safe read-only serializer for monitoring privileged accounts without exposing sensitive hashes."""
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
