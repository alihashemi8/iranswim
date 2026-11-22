import time
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from drf_spectacular.utils import extend_schema, OpenApiParameter

from apps.locations.models import QazvinPlace, SearchQueryLog, PlaceCategory
from apps.locations.geo_config import (
    is_point_in_qazvin,
    calculate_distance_meters,
    format_distance_persian,
)
from apps.locations.persian_normalizer import normalize_persian
from apps.locations.search_engine import QazvinSearchEngine, CATEGORY_ICONS
from apps.locations.serializers import (
    AutocompleteQuerySerializer,
    LocationSearchQuerySerializer,
    ReverseGeocodeQuerySerializer,
    QazvinPlaceSerializer,
)

logger = logging.getLogger(__name__)
search_engine = QazvinSearchEngine()


class AutocompleteAPIView(APIView):
    """
    موتور پیشنهاد و تکمیل خودکار هوشمند جستجو — ویژه شهر قزوین
    پاسخگویی سریع برای Suggestion Dropdown در هنگام تایپ کاربر
    """
    permission_classes = [AllowAny]

    @extend_schema(
        summary="پیشنهاد و تکمیل خودکار موقعیت در قزوین",
        description="ارائه پیشنهادات هوشمند دسته‌بندی‌شده شامل اماکن، معابر، استخرها و محله‌های شهر قزوین",
        parameters=[
            OpenApiParameter(name='q', type=str, description='عبارت جستجو', required=False),
            OpenApiParameter(name='lat', type=float, description='عرض جغرافیایی کاربر (اختیاری)', required=False),
            OpenApiParameter(name='lng', type=float, description='طول جغرافیایی کاربر (اختیاری)', required=False),
            OpenApiParameter(name='limit', type=int, description='حداکثر تعداد پیشنهادات (پیش‌فرض ۱۰)', required=False),
        ]
    )
    def get(self, request):
        start_time = time.perf_counter()
        serializer = AutocompleteQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        query = data.get('q', '').strip()
        user_coords = None
        if data.get('lat') is not None and data.get('lng') is not None:
            user_coords = {'lat': data['lat'], 'lng': data['lng']}

        result = search_engine.autocomplete(
            query=query,
            user_coords=user_coords,
            limit=data.get('limit', 10),
        )

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        result['execution_time_ms'] = round(elapsed_ms, 2)

        return Response(result, status=status.HTTP_200_OK)


class LocationSearchAPIView(APIView):
    """
    سرویس جامع جستجوی پیشرفته و ساختاریافته اماکن، معابر و استخرهای شهر قزوین
    """
    permission_classes = [AllowAny]

    @extend_schema(
        summary="جستجوی ساختاریافته و فیلترشده در قزوین",
        description="جستجوی پیشرفته به همراه صفحه‌بندی، فیلتر دسته‌بندی و تضمین قاطع محدودیت جغرافیایی به شهر قزوین",
        parameters=[
            OpenApiParameter(name='q', type=str, description='عبارت مورد جستجو', required=False),
            OpenApiParameter(name='category', type=str, description='فیلتر دسته‌بندی (اختیاری)', required=False),
            OpenApiParameter(name='lat', type=float, description='عرض جغرافیایی کاربر (جهت محاسبه فاصله)', required=False),
            OpenApiParameter(name='lng', type=float, description='طول جغرافیایی کاربر (جهت محاسبه فاصله)', required=False),
            OpenApiParameter(name='page', type=int, description='شماره صفحه (پیش‌فرض ۱)', required=False),
            OpenApiParameter(name='page_size', type=int, description='اندازه صفحه (پیش‌فرض ۱۵)', required=False),
        ]
    )
    def get(self, request):
        start_time = time.perf_counter()
        serializer = LocationSearchQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        query = data.get('q', '').strip()
        user_coords = None
        if data.get('lat') is not None and data.get('lng') is not None:
            user_coords = {'lat': data['lat'], 'lng': data['lng']}

        result = search_engine.search(
            query=query,
            user_coords=user_coords,
            category=data.get('category'),
            page=data.get('page', 1),
            page_size=data.get('page_size', 15),
        )

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        result['execution_time_ms'] = round(elapsed_ms, 2)

        # Log query asynchronously or non-blockingly
        if query and len(query) >= 2:
            try:
                SearchQueryLog.objects.create(
                    query=query,
                    normalized_query=normalize_persian(query),
                    results_count=result.get('total_count', 0),
                    user=request.user if request.user.is_authenticated else None,
                    user_latitude=data.get('lat'),
                    user_longitude=data.get('lng'),
                    execution_time_ms=round(elapsed_ms, 2),
                )
            except Exception as e:
                logger.debug(f"SearchQueryLog creation failed: {e}")

        return Response(result, status=status.HTTP_200_OK)


class PopularPlacesAPIView(APIView):
    """
    ارائه فهرست اماکن و استخرهای پرمخاطب شهر قزوین جهت نمایش سریع در حالت خالی (Empty State)
    """
    permission_classes = [AllowAny]

    @extend_schema(summary="اماکن شاخص و پرجستجوی شهر قزوین")
    def get(self, request):
        places = QazvinPlace.objects.filter(is_active=True).order_by('-importance', '-search_count')[:12]
        serializer = QazvinPlaceSerializer(places, many=True)
        return Response({
            'city': 'قزوین',
            'popular_places': serializer.data,
            'popular_tags': [
                'استخر شهید رجایی',
                'سبزه‌میدان',
                'خیابان خیام',
                'خیابان دانشگاه',
                'بلوار نوروزیان',
                'بیمارستان ولایت',
                'شهرک کوثر',
                'شهرک مینودر',
                'سرای سعدالسلطنه',
                'داروخانه شبانه‌روزی',
                'پمپ بنزین بابایی',
            ]
        }, status=status.HTTP_200_OK)


class ReverseGeocodeAPIView(APIView):
    """
    تبدیل مختصات جغرافیایی (Latitude/Longitude) به سلسله‌مراتب آدرس شهری قزوین
    """
    permission_classes = [AllowAny]

    @extend_schema(
        summary="تبدیل مختصات به آدرس در قزوین (Reverse Geocode)",
        parameters=[
            OpenApiParameter(name='lat', type=float, description='عرض جغرافیایی', required=True),
            OpenApiParameter(name='lng', type=float, description='طول جغرافیایی', required=True),
        ]
    )
    def get(self, request):
        serializer = ReverseGeocodeQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        lat = serializer.validated_data['lat']
        lng = serializer.validated_data['lng']

        # Enforce Qazvin city boundary
        if not is_point_in_qazvin(lat, lng):
            return Response(
                {'error': 'موقعیت انتخاب‌شده خارج از مرزهای شهری قزوین است.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find closest place in database
        places = QazvinPlace.objects.filter(is_active=True)
        best_place = None
        min_dist = float('inf')

        for p in places:
            dist = calculate_distance_meters(lat, lng, p.latitude, p.longitude)
            if dist < min_dist:
                min_dist = dist
                best_place = p

        if best_place and min_dist < 300:
            formatted_address = best_place.address
            neighborhood = best_place.neighborhood
            street = best_place.street
        else:
            neighborhood = best_place.neighborhood if best_place else ''
            street = best_place.street if best_place else ''
            parts = ['استان قزوین', 'قزوین']
            if neighborhood:
                parts.append(neighborhood)
            if street:
                parts.append(street)
            formatted_address = '، '.join(parts)

        return Response({
            'city': 'قزوین',
            'province': 'استان قزوین',
            'neighborhood': neighborhood,
            'street': street,
            'address': formatted_address,
            'latitude': lat,
            'longitude': lng,
            'closest_landmark': best_place.title if best_place else None,
            'distance_to_landmark_meters': round(min_dist, 1) if best_place else None,
        }, status=status.HTTP_200_OK)
