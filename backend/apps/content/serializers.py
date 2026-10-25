from rest_framework import serializers
from .models import NewsPost, Announcement


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
