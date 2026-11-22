from rest_framework import serializers
from apps.locations.models import QazvinPlace, SearchQueryLog
from apps.locations.geo_config import is_point_in_qazvin


class QazvinPlaceSerializer(serializers.ModelSerializer):
    category_label = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = QazvinPlace
        fields = [
            'id',
            'title',
            'category',
            'category_label',
            'place_type',
            'address',
            'neighborhood',
            'street',
            'alley',
            'latitude',
            'longitude',
            'importance',
            'search_count',
            'keywords',
            'metadata',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class AutocompleteQuerySerializer(serializers.Serializer):
    q = serializers.CharField(required=False, default='', allow_blank=True, max_length=200)
    lat = serializers.FloatField(required=False, allow_null=True)
    lng = serializers.FloatField(required=False, allow_null=True)
    limit = serializers.IntegerField(required=False, default=10, min_value=1, max_value=30)


class LocationSearchQuerySerializer(serializers.Serializer):
    q = serializers.CharField(required=False, default='', allow_blank=True, max_length=200)
    lat = serializers.FloatField(required=False, allow_null=True)
    lng = serializers.FloatField(required=False, allow_null=True)
    category = serializers.CharField(required=False, default='', allow_blank=True, max_length=40)
    page = serializers.IntegerField(required=False, default=1, min_value=1)
    page_size = serializers.IntegerField(required=False, default=15, min_value=1, max_value=50)


class ReverseGeocodeQuerySerializer(serializers.Serializer):
    lat = serializers.FloatField(required=True)
    lng = serializers.FloatField(required=True)

    def validate(self, attrs):
        lat = attrs['lat']
        lng = attrs['lng']
        if not is_point_in_qazvin(lat, lng):
            raise serializers.ValidationError({
                'location': 'مختصات جغرافیایی ارائه‌شده خارج از محدوده شهر قزوین است.'
            })
        return attrs
