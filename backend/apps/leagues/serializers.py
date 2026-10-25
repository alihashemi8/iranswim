from rest_framework import serializers
from .models import League, LeagueCategory, LeagueEntry, LeagueResult


class LeagueCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LeagueCategory
        fields = ['id', 'league', 'title', 'age_min', 'age_max', 'gender']


class LeagueSerializer(serializers.ModelSerializer):
    categories = LeagueCategorySerializer(many=True, read_only=True)

    class Meta:
        model = League
        fields = ['id', 'name', 'season', 'starts_at', 'ends_at', 'is_active', 'rules_description', 'categories']


class LeagueResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeagueResult
        fields = ['id', 'entry', 'event_name', 'score_points', 'recorded_at', 'notes']


class LeagueEntrySerializer(serializers.ModelSerializer):
    swimmer_name = serializers.CharField(source='swimmer.full_name', read_only=True)
    category_title = serializers.CharField(source='category.title', read_only=True)
    results = LeagueResultSerializer(many=True, read_only=True)

    class Meta:
        model = LeagueEntry
        fields = [
            'id', 'league', 'category', 'category_title', 'swimmer',
            'swimmer_name', 'total_points', 'status', 'results', 'registered_at'
        ]
