import pytest
import datetime
from decimal import Decimal
from django.utils import timezone
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.education.models import Course, parse_age_range_string
from apps.swimmers.models import SwimmerProfile


@pytest.mark.django_db
def test_parse_age_range_string_utility():
    min_a, max_a = parse_age_range_string('نونهالان و نوجوانان (۸ تا ۱۵ سال)')
    assert min_a == 8
    assert max_a == 15

    min_a, max_a = parse_age_range_string('کودکان و خردسالان (۴ تا ۹ سال)')
    assert min_a == 4
    assert max_a == 9

    min_a, max_a = parse_age_range_string('نوجوانان و جوانان (۱۲ سال به بالا)')
    assert min_a == 12
    assert max_a is None

    min_a, max_a = parse_age_range_string('تا ۱۰ سال')
    assert min_a is None
    assert max_a == 10

    min_a, max_a = parse_age_range_string('')
    assert min_a is None
    assert max_a is None


@pytest.mark.django_db
def test_course_age_range_auto_sync_on_save():
    start_d = timezone.now().date() + datetime.timedelta(days=1)
    end_d = start_d + datetime.timedelta(days=30)

    course = Course.objects.create(
        name='دوره آزمایشی خردسالان',
        start_date=start_d,
        end_date=end_d,
        base_price=Decimal('1000000.00'),
        age_range='کودکان (۵ تا ۱۰ سال)',
        gender='FEMALE'
    )
    assert course.min_age == 5
    assert course.max_age == 10
    assert course.is_gender_eligible('FEMALE') is True
    assert course.is_gender_eligible('MALE') is False
    assert course.is_age_eligible(7) is True
    assert course.is_age_eligible(4) is False
    assert course.is_age_eligible(11) is False


@pytest.mark.django_db
def test_swimmer_age_calculation():
    user = User.objects.create_user(
        phone='09120000001',
        first_name='مهسا',
        last_name='امینی',
        role='SWIMMER'
    )
    today = timezone.localdate() if hasattr(timezone, 'localdate') else timezone.now().date()
    # 10 years ago today
    birth_date = today.replace(year=today.year - 10)
    profile = SwimmerProfile.objects.create(
        user=user,
        first_name='مهسا',
        last_name='امینی',
        gender='FEMALE',
        date_of_birth=birth_date
    )
    assert profile.age == 10


@pytest.mark.django_db
def test_course_list_api_gender_and_age_filtering():
    api_client = APIClient()
    start_d = timezone.now().date() + datetime.timedelta(days=1)
    end_d = start_d + datetime.timedelta(days=30)

    # Course 1: MALE only, 12+
    c_male = Course.objects.create(
        name='شنای قهرمانی پسران',
        start_date=start_d,
        end_date=end_d,
        base_price=Decimal('2000000.00'),
        age_range='۱۲ سال به بالا',
        gender='MALE'
    )

    # Course 2: FEMALE only, 6-12
    c_female = Course.objects.create(
        name='شنای مقدماتی دختران',
        start_date=start_d,
        end_date=end_d,
        base_price=Decimal('1800000.00'),
        age_range='۶ تا ۱۲ سال',
        gender='FEMALE'
    )

    # Course 3: ALL gender, 4-8
    c_all = Course.objects.create(
        name='رفع ترس از آب خردسالان',
        start_date=start_d,
        end_date=end_d,
        base_price=Decimal('1500000.00'),
        age_range='۴ تا ۸ سال',
        gender='ALL'
    )

    # Filter by gender=MALE
    res_m = api_client.get('/api/education/courses/?gender=MALE')
    assert res_m.status_code == 200
    names_m = [c['name'] for c in (res_m.data.get('results') or res_m.data)]
    assert 'شنای قهرمانی پسران' in names_m
    assert 'رفع ترس از آب خردسالان' in names_m  # gender='ALL' is inclusive
    assert 'شنای مقدماتی دختران' not in names_m

    # Filter by gender=FEMALE
    res_f = api_client.get('/api/education/courses/?gender=FEMALE')
    assert res_f.status_code == 200
    names_f = [c['name'] for c in (res_f.data.get('results') or res_f.data)]
    assert 'شنای مقدماتی دختران' in names_f
    assert 'رفع ترس از آب خردسالان' in names_f
    assert 'شنای قهرمانی پسران' not in names_f

    # Filter by age=7
    res_age7 = api_client.get('/api/education/courses/?age=7')
    assert res_age7.status_code == 200
    names_age7 = [c['name'] for c in (res_age7.data.get('results') or res_age7.data)]
    assert 'شنای مقدماتی دختران' in names_age7
    assert 'رفع ترس از آب خردسالان' in names_age7
    assert 'شنای قهرمانی پسران' not in names_age7

    # Filter by age=14
    res_age14 = api_client.get('/api/education/courses/?age=14')
    assert res_age14.status_code == 200
    names_age14 = [c['name'] for c in (res_age14.data.get('results') or res_age14.data)]
    assert 'شنای قهرمانی پسران' in names_age14
    assert 'شنای مقدماتی دختران' not in names_age14
    assert 'رفع ترس از آب خردسالان' not in names_age14


@pytest.mark.django_db
def test_swimmer_matched_only_courses_endpoint():
    api_client = APIClient()
    today = timezone.localdate() if hasattr(timezone, 'localdate') else timezone.now().date()
    start_d = today + datetime.timedelta(days=1)
    end_d = start_d + datetime.timedelta(days=30)

    # 1. Create a female swimmer aged 10
    user_f = User.objects.create_user(
        phone='09129998811',
        first_name='نیلوفر',
        last_name='مهرابی',
        role='SWIMMER'
    )
    profile_f = SwimmerProfile.objects.create(
        user=user_f,
        first_name='نیلوفر',
        last_name='مهرابی',
        gender='FEMALE',
        date_of_birth=today.replace(year=today.year - 10)
    )

    # 2. Courses
    Course.objects.create(
        name='دوره دختران نونهال',
        start_date=start_d,
        end_date=end_d,
        base_price=Decimal('1500000.00'),
        age_range='۸ تا ۱۲ سال',
        gender='FEMALE'
    )
    Course.objects.create(
        name='دوره پسران نوجوان',
        start_date=start_d,
        end_date=end_d,
        base_price=Decimal('1500000.00'),
        age_range='۸ تا ۱۲ سال',
        gender='MALE'
    )
    Course.objects.create(
        name='دوره خردسالان عمومی',
        start_date=start_d,
        end_date=end_d,
        base_price=Decimal('1500000.00'),
        age_range='۴ تا ۶ سال',
        gender='ALL'
    )

    # Query with swimmer_id and matched_only=true
    api_client.force_authenticate(user=user_f)
    res = api_client.get(f'/api/education/courses/?swimmer_id={profile_f.id}&matched_only=true')
    assert res.status_code == 200
    courses_data = res.data.get('results') or res.data
    course_names = [c['name'] for c in courses_data]

    assert 'دوره دختران نونهال' in course_names
    assert 'دوره پسران نوجوان' not in course_names
    assert 'دوره خردسالان عمومی' not in course_names

    # Check serializer match details
    target_c = next(c for c in courses_data if c['name'] == 'دوره دختران نونهال')
    assert target_c['is_matched'] is True
    assert target_c['match_details']['gender_matched'] is True
    assert target_c['match_details']['age_matched'] is True
