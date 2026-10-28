from rest_framework import serializers
from .models import NewsPost, Announcement, Notification, SupportTicket


class NewsPostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = NewsPost
        fields = [
            'id', 'title', 'slug', 'body', 'summary', 'image', 'category',
            'category_display', 'status', 'author_name', 'publish_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AnnouncementSerializer(serializers.ModelSerializer):
    target_group_name = serializers.CharField(source='target_group.name', read_only=True)
    audience_display = serializers.CharField(source='get_audience_display', read_only=True)

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'message', 'audience', 'audience_display',
            'target_group', 'target_group_name', 'is_pinned', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'category', 'category_display',
            'title', 'message', 'link', 'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class SupportTicketSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    swimmer_name = serializers.CharField(source='swimmer.full_name', read_only=True)

    class Meta:
        model = SupportTicket
        fields = [
            'id', 'user', 'user_name', 'swimmer', 'swimmer_name',
            'category', 'category_display', 'subject', 'description',
            'attachment', 'status', 'status_display', 'response',
            'responded_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'status', 'response', 'responded_at', 'created_at', 'updated_at']


