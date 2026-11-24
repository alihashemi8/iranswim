from rest_framework import serializers
from .image_optimizer import optimize_image_to_webp
from .models import (
    NewsPost, NewsImage, SwimmingPool, PoolImage,
    Announcement, Notification, SupportTicket, TicketMessage, LandingSection,
    TopSwimmer
)


class NewsImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = NewsImage
        fields = ['id', 'image', 'image_url', 'caption', 'order', 'created_at']

    def validate_image(self, value):
        if value:
            return optimize_image_to_webp(value, field_name='image')
        return value

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class NewsPostSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField(read_only=True)
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

    def get_author_name(self, obj):
        if obj.author:
            name = obj.author.get_full_name().strip()
            if name:
                return name
        return 'تحریریه آکادمی'

    def validate(self, attrs):
        if not attrs.get('slug'):
            from django.utils.text import slugify
            from django.utils import timezone
            title = attrs.get('title', 'news')
            attrs['slug'] = f"{slugify(title, allow_unicode=True)[:50]}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
        return attrs

    def validate_image(self, value):
        if value:
            return optimize_image_to_webp(value, field_name='image')
        return value

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

    def validate_image(self, value):
        if value:
            return optimize_image_to_webp(value, field_name='image')
        return value

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

    def validate_poster_image(self, value):
        if value:
            return optimize_image_to_webp(value, field_name='poster_image')
        return value

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
    target_group_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True
    )
    target_groups_details = serializers.SerializerMethodField(read_only=True)
    created_by_name = serializers.SerializerMethodField(read_only=True)
    created_by_role = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'message', 'audience', 'audience_display',
            'target_group', 'target_group_name', 'target_group_ids',
            'target_groups_details', 'is_pinned', 'send_sms',
            'created_by_name', 'created_by_role', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_created_by_name(self, obj):
        if not obj.created_by:
            return 'مدیریت آکادمی'
        name = obj.created_by.get_full_name()
        return name if name else 'مدیریت آکادمی'

    def get_created_by_role(self, obj):
        if not obj.created_by:
            return 'ADMIN'
        return getattr(obj.created_by, 'role', 'ADMIN')

    def get_target_groups_details(self, obj):
        return [
            {'id': g.id, 'name': g.name, 'course_name': g.course.name if g.course else ''}
            for g in obj.target_groups.all()
        ]

    def create(self, validated_data):
        group_ids = validated_data.pop('target_group_ids', [])
        announcement = super().create(validated_data)
        if group_ids:
            announcement.target_groups.set(group_ids)
            if not announcement.target_group_id:
                announcement.target_group_id = group_ids[0]
                announcement.save(update_fields=['target_group'])
        return announcement


class NotificationSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'category', 'category_display',
            'title', 'message', 'link', 'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class TicketMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    sender_role_display = serializers.CharField(source='sender.get_role_display', read_only=True)
    sender_avatar = serializers.SerializerMethodField(read_only=True)
    attachment_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = TicketMessage
        fields = [
            'id', 'ticket', 'sender', 'sender_name', 'sender_role',
            'sender_role_display', 'sender_avatar', 'message',
            'attachment', 'attachment_url', 'created_at'
        ]
        read_only_fields = ['id', 'ticket', 'sender', 'created_at']

    def get_sender_avatar(self, obj):
        if obj.sender and obj.sender.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.sender.avatar.url)
            return obj.sender.avatar.url
        return None

    def get_attachment_url(self, obj):
        if obj.attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.attachment.url)
            return obj.attachment.url
        return None


class SupportTicketSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)
    user_role_display = serializers.CharField(source='user.get_role_display', read_only=True)
    user_phone = serializers.CharField(source='user.phone', read_only=True)
    user_avatar = serializers.SerializerMethodField(read_only=True)
    swimmer_name = serializers.CharField(source='swimmer.full_name', read_only=True)
    responded_by_name = serializers.CharField(source='responded_by.full_name', read_only=True)
    attachment_url = serializers.SerializerMethodField(read_only=True)
    messages = TicketMessageSerializer(many=True, read_only=True)
    messages_count = serializers.IntegerField(source='messages.count', read_only=True)

    class Meta:
        model = SupportTicket
        fields = [
            'id', 'user', 'user_name', 'user_role', 'user_role_display', 'user_phone', 'user_avatar',
            'swimmer', 'swimmer_name',
            'category', 'category_display', 'priority', 'priority_display',
            'subject', 'description',
            'attachment', 'attachment_url', 'status', 'status_display',
            'response', 'responded_by', 'responded_by_name', 'responded_at',
            'messages', 'messages_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'status', 'response', 'responded_by',
            'responded_at', 'created_at', 'updated_at'
        ]

    def get_user_avatar(self, obj):
        if obj.user and obj.user.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user.avatar.url)
            return obj.user.avatar.url
        return None

    def get_attachment_url(self, obj):
        if obj.attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.attachment.url)
            return obj.attachment.url
        return None


class LandingSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LandingSection
        fields = [
            'id', 'key', 'title', 'subtitle', 'description',
            'is_enabled', 'display_order', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TopSwimmerSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = TopSwimmer
        fields = [
            'id', 'name', 'role', 'age', 'description',
            'image', 'image_url', 'display_order', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_image(self, value):
        if value:
            return optimize_image_to_webp(value, field_name='image')
        return value

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None




