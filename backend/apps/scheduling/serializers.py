from rest_framework import serializers
from .models import ClassSession


class ClassSessionSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source='group.name', read_only=True)
    coach_name = serializers.CharField(source='coach.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ClassSession
        fields = [
            'id', 'group', 'group_name', 'coach', 'coach_name',
            'session_date', 'start_time', 'end_time', 'pool_location',
            'status', 'status_display', 'is_makeup', 'replaces_session',
            'cancellation_reason', 'session_notes'
        ]
