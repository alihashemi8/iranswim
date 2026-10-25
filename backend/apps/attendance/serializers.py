from rest_framework import serializers
from .models import AttendanceRecord


class AttendanceRecordSerializer(serializers.ModelSerializer):
    swimmer_name = serializers.CharField(source='swimmer.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'session', 'swimmer', 'swimmer_name', 'enrollment',
            'status', 'status_display', 'consumed_quota', 'note',
            'change_reason', 'recorded_by', 'recorded_at'
        ]
        read_only_fields = ['id', 'consumed_quota', 'recorded_at']
