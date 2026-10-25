from rest_framework import serializers
from .models import SystemErrorLog, AuditLog


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

    class Meta:
        model = AuditLog
        fields = [
            'id', 'actor', 'actor_name', 'action', 'entity_type', 'entity_id',
            'details', 'ip_address', 'timestamp'
        ]

    def get_actor_name(self, obj):
        if obj.actor:
            return f"{obj.actor.first_name} {obj.actor.last_name}".strip() or obj.actor.phone
        return 'سامانه خودکار'
