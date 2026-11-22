import time
import pytest
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient

from apps.locations.geo_config import (
    QAZVIN_CENTER,
    QAZVIN_BOUNDS,
    is_point_in_qazvin,
    detect_outside_scope_intent,
    calculate_distance_meters,
    format_distance_persian,
)
from apps.locations.persian_normalizer import (
    normalize_persian,
    tokenize_persian,
    parse_persian_word_number,
    convert_number_words_to_digits,
    damerau_levenshtein_distance,
    is_fuzzy_match,
    extract_search_intent,
)
from apps.locations.models import QazvinPlace, SearchQueryLog, PlaceCategory
from apps.locations.search_engine import QazvinSearchEngine


# ==============================================================================
# 1. GEOGRAPHIC BOUNDARY & SCOPE RESTRICTION TESTS
# ==============================================================================

class TestGeographicEnforcement:
    def test_qazvin_points_accepted(self):
        """Points strictly inside Qazvin city boundary must be accepted."""
        qazvin_points = [
            (36.2692, 50.0058),  # Sabzeh Meydan (City Center)
            (36.2785, 50.0062),  # Khayyam St
            (36.3025, 50.0125),  # Noorooziyan Blvd
            (36.2950, 49.9980),  # University Blvd / IKIU
            (36.3080, 50.0330),  # Velayat Hospital (Pounak)
            (36.2950, 50.0550),  # Minoodar Township
            (36.2480, 49.9980),  # Railway Station (Rah Ahan)
            (36.3260, 50.0350),  # Barajin Islamic Azad University
        ]
        for lat, lng in qazvin_points:
            assert is_point_in_qazvin(lat, lng) is True, f"Failed for ({lat}, {lng})"

    def test_outside_points_rejected(self):
        """Points outside Qazvin city (other cities & provinces) must be rejected."""
        outside_points = [
            (36.1890, 50.0450),  # Alvand (Outside Qazvin city)
            (36.2080, 50.1550),  # Mohammadiyeh / Zibashahr
            (36.2490, 50.1790),  # Mehregan
            (36.0690, 49.6950),  # Takestan
            (36.3150, 49.8850),  # Mahmoud Abad Namooneh
            (36.0530, 50.5360),  # Abyek
            (35.6892, 51.3890),  # Tehran
            (35.8327, 50.9915),  # Karaj
            (32.6546, 51.6680),  # Isfahan
            (29.5918, 52.5837),  # Shiraz
            (38.0800, 46.2919),  # Tabriz
        ]
        for lat, lng in outside_points:
            assert is_point_in_qazvin(lat, lng) is False, f"Should reject outside ({lat}, {lng})"

    def test_boundary_edge_handling(self):
        """Borderline edge coordinates are accurately partitioned."""
        # Just inside southern border
        assert is_point_in_qazvin(36.2480, 50.0000) is True
        # Far south in plains
        assert is_point_in_qazvin(36.2100, 50.0000) is False

    @pytest.mark.django_db
    def test_qazvin_place_model_clean_validation(self):
        """Model validation prevents persisting coordinates outside Qazvin."""
        # Valid place in Qazvin
        valid_place = QazvinPlace(
            title='استخر آزمایشی قزوین',
            category=PlaceCategory.POOL,
            address='استان قزوین، قزوین، خیام',
            latitude=36.2797,
            longitude=50.0049,
        )
        valid_place.clean()  # Should not raise

        # Invalid place in Tehran
        invalid_place = QazvinPlace(
            title='استخر آزادی تهران',
            category=PlaceCategory.POOL,
            address='تهران، میدان آزادی',
            latitude=35.6997,
            longitude=51.3380,
        )
        with pytest.raises(ValidationError):
            invalid_place.clean()

    def test_outside_city_search_detection(self):
        """Queries explicitly targeting non-Qazvin cities are intercepted."""
        queries_to_reject = [
            'تهران',
            'میدان انقلاب تهران',
            'استخر در کرج',
            'رستورانهای اصفهان',
            'هتل در شیراز',
            'الوند',
            'محمدیه',
            'تاکستان',
        ]
        for q in queries_to_reject:
            res = detect_outside_scope_intent(normalize_persian(q))
            assert res is not None, f"Expected outside scope for: {q}"
            assert res['is_outside_scope'] is True
            assert 'شهر قزوین' in res['message']

    def test_qazvin_streets_named_after_cities_not_blocked(self):
        """Historical Qazvin locations like 'خیابان تهران قدیم' must NOT be blocked."""
        res = detect_outside_scope_intent(normalize_persian('خیابان تهران قدیم'))
        assert res is None, "Historical Qazvin street should not be falsely rejected"


# ==============================================================================
# 2. PERSIAN NORMALIZATION & NLP TESTS
# ==============================================================================

class TestPersianNormalizer:
    def test_arabic_persian_character_equivalence(self):
        """Arabic characters (ي, ك, ة, etc.) normalize to Persian equivalents."""
        assert normalize_persian('دانشگاه ملّي') == 'دانشگاه ملی'
        assert normalize_persian('بانك كشاورزي') == 'بانک کشاورزی'
        assert normalize_persian('خيابان خيّام') == 'خیابان خیام'
        assert normalize_persian('مؤسسه') == 'موسسه'
        assert normalize_persian('أحمد') == 'احمد'

    def test_numerals_conversion(self):
        """Eastern Arabic and Persian digits normalize to ASCII digits."""
        assert normalize_persian('کوچه ۱۲') == 'کوچه 12'
        assert normalize_persian('حکمت ٤٥') == 'حکمت 45'
        assert normalize_persian('پلاک ۰۹') == 'پلاک 09'

    def test_number_words_to_digits(self):
        """Written Persian numbers convert into Arabic/ASCII digits."""
        assert parse_persian_word_number('یک') == 1
        assert parse_persian_word_number('دوازده') == 12
        assert parse_persian_word_number('بیست') == 20
        assert parse_persian_word_number('چهل') == 40
        assert parse_persian_word_number('سی و سه') == 33
        assert parse_persian_word_number('چهل و هشت') == 48

        assert convert_number_words_to_digits('حکمت چهل و دوم') == 'حکمت 42'
        assert convert_number_words_to_digits('کوچه پانزدهم') == 'کوچه 15'

    def test_diacritics_and_zwnj_normalization(self):
        """Tashkeel and ZWNJ are stripped or normalized to space."""
        # With Tashkeel
        assert normalize_persian('قَزْوِینْ') == 'قزوین'
        # With ZWNJ (\u200c)
        assert normalize_persian('سبزه‌میدان') == 'سبزه میدان'
        assert normalize_persian('شبانه\u200cروزی') == 'شبانه روزی'

    def test_damerau_levenshtein_typo_tolerance(self):
        """Damerau-Levenshtein correctly handles typos, transpositions, and deletions."""
        # Transposition of adjacent characters
        assert damerau_levenshtein_distance('خیام', 'خایم') == 1
        # Deletion
        assert damerau_levenshtein_distance('نوروزیان', 'نورزیان') == 1
        # Substitution
        assert damerau_levenshtein_distance('بیمارستان', 'بیماستان') == 1

        is_match, dist = is_fuzzy_match('بیمارستان', 'بیماستان')
        assert is_match is True
        assert dist == 1


# ==============================================================================
# 3. SEARCH ENGINE & RANKING TESTS
# ==============================================================================

@pytest.mark.django_db
class TestSearchEngine:
    @pytest.fixture(autouse=True)
    def setup_places(self):
        from django.core.cache import cache
        cache.clear()
        # Create representative test places in Qazvin
        QazvinPlace.objects.create(
            title='استخر شهید رجایی قزوین',
            category=PlaceCategory.POOL,
            place_type='pool',
            address='استان قزوین، قزوین، دانشگاه، بلوار شهید مفتح',
            neighborhood='دانشگاه',
            street='بلوار شهید مفتح',
            latitude=36.2965,
            longitude=50.0012,
            importance=95,
            keywords=['استخر رجایی', 'استخر دانشگاه'],
        )
        QazvinPlace.objects.create(
            title='خیابان خیام شمالی',
            category=PlaceCategory.STREET,
            place_type='street',
            address='استان قزوین، قزوین، خیام، خیابان خیام شمالی',
            neighborhood='خیام',
            street='خیابان خیام شمالی',
            latitude=36.2820,
            longitude=50.0065,
            importance=97,
            keywords=['خیام شمالی', 'خیام'],
        )
        QazvinPlace.objects.create(
            title='کوچه شقایق (خیام شمالی)',
            category=PlaceCategory.ALLEY,
            place_type='alley',
            address='استان قزوین، قزوین، خیام، خیابان خیام شمالی، کوچه شقایق',
            neighborhood='خیام',
            street='خیابان خیام شمالی',
            alley='کوچه شقایق',
            latitude=36.2845,
            longitude=50.0065,
            importance=60,
            keywords=['شقایق', 'کوچه شقایق'],
        )
        QazvinPlace.objects.create(
            title='بیمارستان ولایت قزوین',
            category=PlaceCategory.HEALTH,
            place_type='hospital',
            address='استان قزوین، قزوین، پونک، بلوار امیرکبیر',
            neighborhood='پونک',
            street='بلوار امیرکبیر',
            latitude=36.3080,
            longitude=50.0330,
            importance=98,
            keywords=['بیمارستان ولایت', 'ولایت'],
            metadata={'is_hospital': True, 'is_24h': True},
        )
        QazvinPlace.objects.create(
            title='داروخانه شبانه‌روزی دکتر چلبیانلی',
            category=PlaceCategory.HEALTH,
            place_type='pharmacy',
            address='استان قزوین، قزوین، خیام، خیابان خیام شمالی',
            neighborhood='خیام',
            street='خیابان خیام شمالی',
            latitude=36.2790,
            longitude=50.0065,
            importance=90,
            keywords=['داروخانه چلبیانلی', 'داروخانه شبانه روزی'],
            metadata={'is_pharmacy': True, 'is_24h': True},
        )
        QazvinPlace.objects.create(
            title='کوچه حکمت ۴۰ (نوروزیان)',
            category=PlaceCategory.ALLEY,
            place_type='alley',
            address='استان قزوین، قزوین، نوروزیان، بلوار نوروزیان، حکمت ۴۰',
            neighborhood='نوروزیان',
            street='بلوار نوروزیان',
            alley='حکمت ۴۰',
            latitude=36.3030,
            longitude=50.0120,
            importance=55,
            keywords=['حکمت ۴۰', 'حکمت 40'],
        )
        QazvinPlace.objects.create(
            title='کوچه حکمت ۴۱ (نوروزیان)',
            category=PlaceCategory.ALLEY,
            place_type='alley',
            address='استان قزوین، قزوین، نوروزیان، بلوار نوروزیان، حکمت ۴۱',
            neighborhood='نوروزیان',
            street='بلوار نوروزیان',
            alley='حکمت ۴۱',
            latitude=36.3035,
            longitude=50.0122,
            importance=55,
            keywords=['حکمت ۴۱', 'حکمت 41'],
        )

    def test_exact_name_match_ranking(self):
        """Exact title matches rank above partial or address matches."""
        se = QazvinSearchEngine()
        res = se.search('خیابان خیام شمالی')
        assert res['total_count'] > 0
        top_item = res['results'][0]
        assert top_item['title'] == 'خیابان خیام شمالی'

    def test_pool_search_and_relevance(self):
        """Pool queries prioritize swimming venues."""
        se = QazvinSearchEngine()
        res = se.search('استخر رجایی')
        assert res['total_count'] > 0
        top_item = res['results'][0]
        assert 'استخر شهید رجایی' in top_item['title']
        assert top_item['category'] == PlaceCategory.POOL

    def test_number_parsing_and_conflict_penalty(self):
        """Search for 'حکمت چهل' correctly identifies 40 and ranks حکمت ۴۰ above حکمت ۴۱."""
        se = QazvinSearchEngine()
        res = se.search('حکمت چهل')
        assert res['total_count'] > 0
        top_item = res['results'][0]
        assert '۴۰' in top_item['title'] or '40' in top_item['title']

    def test_contextual_query_night_pharmacy(self):
        """Query for 'داروخانه شبانه روزی' extracts 24h pharmacy intent."""
        se = QazvinSearchEngine()
        res = se.search('داروخانه شبانه روزی')
        assert res['total_count'] > 0
        top_item = res['results'][0]
        assert 'داروخانه' in top_item['title']
        assert top_item['metadata'].get('is_24h') is True

    def test_typo_tolerant_search(self):
        """Minor spelling error in query still successfully finds place."""
        se = QazvinSearchEngine()
        # 'بیماستان ولایت' missing 'ر'
        res = se.search('بیماستان ولایت')
        assert res['total_count'] > 0
        assert 'بیمارستان ولایت' in res['results'][0]['title']

    def test_proximity_scoring(self):
        """User proximity gives bonus to nearby places."""
        se = QazvinSearchEngine()
        # User is in Pounak right by Velayat Hospital
        pounak_coords = {'lat': 36.3080, 'lng': 50.0330}
        res = se.search('بیمارستان', user_coords=pounak_coords)
        assert res['total_count'] > 0
        assert 'ولایت' in res['results'][0]['title']
        assert 'متر' in res['results'][0]['distance_persian']


# ==============================================================================
# 4. API ENDPOINT INTEGRATION TESTS
# ==============================================================================

@pytest.mark.django_db
class TestLocationAPIEndpoints:
    @pytest.fixture(autouse=True)
    def seed_data(self):
        from django.core.cache import cache
        cache.clear()
        QazvinPlace.objects.create(
            title='استخر شهید رجایی قزوین',
            category=PlaceCategory.POOL,
            place_type='pool',
            address='استان قزوین، قزوین، دانشگاه، بلوار شهید مفتح',
            neighborhood='دانشگاه',
            street='بلوار شهید مفتح',
            latitude=36.2965,
            longitude=50.0012,
            importance=95,
        )
        QazvinPlace.objects.create(
            title='سبزه‌میدان (میدان آزادی قزوین)',
            category=PlaceCategory.LANDMARK,
            place_type='square',
            address='استان قزوین، قزوین، سبزه‌میدان، میدان آزادی',
            neighborhood='سبزه‌میدان',
            street='میدان آزادی',
            latitude=36.2692,
            longitude=50.0058,
            importance=100,
        )

    def test_autocomplete_endpoint(self):
        """GET /api/locations/autocomplete/ returns suggestions and execution time."""
        client = APIClient()
        response = client.get('/api/locations/autocomplete/', {'q': 'استخر'})
        assert response.status_code == 200
        data = response.json()
        assert data['is_outside_scope'] is False
        assert len(data['suggestions']) > 0
        assert 'execution_time_ms' in data
        assert data['execution_time_ms'] < 3000  # Generous threshold for cold test runs

    def test_autocomplete_outside_city_scope(self):
        """GET /api/locations/autocomplete/ rejects queries for outside cities."""
        client = APIClient()
        response = client.get('/api/locations/autocomplete/', {'q': 'تهران'})
        assert response.status_code == 200
        data = response.json()
        assert data['is_outside_scope'] is True
        assert data['detected_location'] == 'تهران'
        assert 'قزوین' in data['message']
        assert len(data['suggestions']) == 0

    def test_search_endpoint_with_pagination(self):
        """GET /api/locations/search/ supports pagination and facets."""
        client = APIClient()
        response = client.get('/api/locations/search/', {'q': 'میدان', 'page': 1, 'page_size': 10})
        assert response.status_code == 200
        data = response.json()
        assert data['is_outside_scope'] is False
        assert data['total_count'] >= 1
        assert len(data['results']) >= 1
        assert 'categories' in data

    def test_popular_places_endpoint(self):
        """GET /api/locations/popular/ returns popular landmarks and tags."""
        client = APIClient()
        response = client.get('/api/locations/popular/')
        assert response.status_code == 200
        data = response.json()
        assert data['city'] == 'قزوین'
        assert len(data['popular_places']) > 0
        assert len(data['popular_tags']) > 0

    def test_reverse_geocode_inside_qazvin(self):
        """GET /api/locations/reverse/ returns address for coordinate inside Qazvin."""
        client = APIClient()
        response = client.get('/api/locations/reverse/', {'lat': 36.2692, 'lng': 50.0058})
        assert response.status_code == 200
        data = response.json()
        assert data['city'] == 'قزوین'
        assert 'سبزه‌میدان' in data['closest_landmark']

    def test_reverse_geocode_outside_qazvin_rejected(self):
        """GET /api/locations/reverse/ rejects coordinates outside Qazvin."""
        client = APIClient()
        # Tehran coordinates
        response = client.get('/api/locations/reverse/', {'lat': 35.6892, 'lng': 51.3890})
        assert response.status_code == 400

    def test_search_logging(self):
        """Search requests are logged in SearchQueryLog."""
        client = APIClient()
        initial_count = SearchQueryLog.objects.count()
        response = client.get('/api/locations/search/', {'q': 'استخر رجایی'})
        assert response.status_code == 200
        assert SearchQueryLog.objects.count() == initial_count + 1
        latest_log = SearchQueryLog.objects.first()
        assert latest_log.query == 'استخر رجایی'
