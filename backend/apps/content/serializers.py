from rest_framework import serializers
from .models import (
    NewsPost, NewsImage, SwimmingPool, PoolImage,
    Announcement, Notification, SupportTicket
)


class NewsImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = NewsImage
        fields = ['id', 'image', 'image_url', 'caption', 'order', 'created_at']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class NewsPostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    image_url = serializers.SerializerMethodField()
    slug = serializers.SlugField(required=False, allow_blank=True)
    detail_images = NewsImageSerializer(many=True, read_only=True)

    class Meta:
        model = NewsPost
        fields = [
            'id', 'title', 'slug', 'body', 'summary', 'image', 'image_url',
            'category', 'category_display', 'status', 'status_display',
            'author_name', 'detail_images', 'publish_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate(self, attrs):
        if not attrs.get('slug'):
            from django.utils.text import slugify
            from django.utils import timezone
            title = attrs.get('title', 'news')
            attrs['slug'] = f"{slugify(title, allow_unicode=True)[:50]}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
        return attrs

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class PoolImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = PoolImage
        fields = ['id', 'image', 'image_url', 'caption', 'order', 'created_at']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class SwimmingPoolSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False, default=True)
    poster_image_url = serializers.SerializerMethodField()
    gallery_images = PoolImageSerializer(many=True, read_only=True)

    class Meta:
        model = SwimmingPool
        fields = [
            'id', 'name', 'slug', 'poster_image', 'poster_image_url',
            'location', 'map_url', 'description', 'facilities',
            'dimensions', 'depth', 'phone', 'display_order', 'is_active',
            'gallery_images', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        if not attrs.get('slug'):
            from django.utils.text import slugify
            from django.utils import timezone
            name = attrs.get('name', 'pool')
            attrs['slug'] = f"{slugify(name, allow_unicode=True)[:50]}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
        return attrs

    def get_poster_image_url(self, obj):
        if obj.poster_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.poster_image.url)
            return obj.poster_image.url
        return None


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


