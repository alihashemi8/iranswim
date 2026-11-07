from rest_framework import serializers
from decimal import Decimal
from django.db.models import Sum
from .models import League, LeagueCategory, LeagueCompetition, LeagueEntry, LeagueResult


class LeagueCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LeagueCategory
        fields = ['id', 'league', 'title', 'age_min', 'age_max', 'gender']


class LeagueResultSerializer(serializers.ModelSerializer):
    swimmer_name = serializers.CharField(source='entry.swimmer.full_name', read_only=True)
    swimmer_id = serializers.IntegerField(source='entry.swimmer.id', read_only=True)
    competition_title = serializers.CharField(source='competition.title', read_only=True, allow_null=True)
    formatted_time = serializers.ReadOnlyField()

    class Meta:
        model = LeagueResult
        fields = [
            'id', 'entry', 'swimmer_name', 'swimmer_id', 'competition', 'competition_title',
            'event_name', 'duration_seconds', 'formatted_time', 'rank', 'medal',
            'score_points', 'is_manual', 'recorded_at', 'notes'
        ]


class LeagueCompetitionSerializer(serializers.ModelSerializer):
    category_title = serializers.CharField(source='category.title', read_only=True, allow_null=True)
    stroke_display = serializers.CharField(source='get_stroke_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    participants_count = serializers.SerializerMethodField()
    results = LeagueResultSerializer(many=True, read_only=True)

    class Meta:
        model = LeagueCompetition
        fields = [
            'id', 'league', 'category', 'category_title', 'title', 'stroke',
            'stroke_display', 'distance_meters', 'gender', 'gender_display',
            'held_at', 'location', 'status', 'status_display', 'notes',
            'participants_count', 'results', 'created_at'
        ]

    def get_participants_count(self, obj):
        return obj.results.count()


class LeagueEntrySerializer(serializers.ModelSerializer):
    swimmer_name = serializers.CharField(source='swimmer.full_name', read_only=True)
    swimmer_avatar = serializers.SerializerMethodField()
    swimmer_gender = serializers.CharField(source='swimmer.gender', read_only=True)
    category_title = serializers.CharField(source='category.title', read_only=True)
    gold_medals = serializers.ReadOnlyField()
    silver_medals = serializers.ReadOnlyField()
    bronze_medals = serializers.ReadOnlyField()
    matches_count = serializers.ReadOnlyField()
    results = LeagueResultSerializer(many=True, read_only=True)

    class Meta:
        model = LeagueEntry
        fields = [
            'id', 'league', 'category', 'category_title', 'swimmer',
            'swimmer_name', 'swimmer_avatar', 'swimmer_gender',
            'total_points', 'status', 'rank_trend', 'gold_medals',
            'silver_medals', 'bronze_medals', 'matches_count',
            'results', 'registered_at'
        ]

    def get_swimmer_avatar(self, obj):
        if obj.swimmer.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.swimmer.avatar.url)
            return obj.swimmer.avatar.url
        return None


class LeagueSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='name', read_only=True)
    categories = LeagueCategorySerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    participants_count = serializers.SerializerMethodField()
    competitions_count = serializers.SerializerMethodField()
    completed_competitions_count = serializers.SerializerMethodField()
    total_points_sum = serializers.SerializerMethodField()

    class Meta:
        model = League
        fields = [
            'id', 'name', 'title', 'season', 'starts_at', 'ends_at', 'status',
            'status_display', 'is_active', 'rules_description', 'scoring_rules',
            'categories', 'participants_count', 'competitions_count',
            'completed_competitions_count', 'total_points_sum', 'created_at'
        ]

    def get_participants_count(self, obj):
        return obj.entries.filter(status=LeagueEntry.Status.ACTIVE).count()

    def get_competitions_count(self, obj):
        return obj.competitions.count()

    def get_completed_competitions_count(self, obj):
        return obj.competitions.filter(status=LeagueCompetition.Status.COMPLETED).count()

    def get_total_points_sum(self, obj):
        total = obj.entries.aggregate(s=Sum('total_points'))['s']
        return float(total or Decimal('0.00'))
