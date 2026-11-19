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


@pytest.mark.django_db
def test_course_serializer_complete_manager_fields_for_swimmer():
    """
    Verifies that all 16+ attributes defined by the manager when creating a course
    are serialized completely and without data loss for the swimmer portal.
    """
    from apps.coaches.models import CoachProfile
    from apps.education.models import SwimmerGroup, Enrollment
    from apps.education.serializers import CourseSerializer, EnrollmentSerializer

    coach_user = User.objects.create_user(
        phone='09121112233',
        first_name='کاوه',
        last_name='رضایی',
        role='COACH'
    )
    coach = CoachProfile.objects.create(
        user=coach_user,
        first_name='کاوه',
        last_name='رضایی',
        coaching_degree='GRADE_1',
        years_of_experience=8
    )

    start_d = datetime.date(2026, 12, 1)
    end_d = datetime.date(2027, 2, 28)
    course = Course.objects.create(
        name='دوره تخصصی شنای کرال سینه و پروانه',
        description='آموزش جامع پایه‌ای و پیشرفته',
        pool_location='استخر شهید رئیسی - سالن اصلی',
        days_of_week='سه‌شنبه و پنج‌شنبه',
        start_time=datetime.time(17, 30),
        end_time=datetime.time(19, 0),
        start_date=start_d,
        end_date=end_d,
        base_price=Decimal('2400000.00'),
        sessions_count=12,
        installments_count=3,
        card_number='6037997512345678',
        card_holder='مدرسه شنای ایران',
        age_range='۱۰ تا ۱۸ سال',
        gender='MALE',
        what_you_learn='سرفصل اول: پای دوچرخه\nسرفصل دوم: تنفس در کرال سینه',
        status=Course.Status.ACTIVE
    )
    course.coaches.add(coach)
    course.sync_coach_classes()

    serializer = CourseSerializer(instance=course)
    data = serializer.data

    # 1. General Specs
    assert data['name'] == 'دوره تخصصی شنای کرال سینه و پروانه'
    assert data['description'] == 'آموزش جامع پایه‌ای و پیشرفته'
    assert data['gender'] == 'MALE'
    assert data['gender_display'] == 'پسران / آقایان'
    assert data['age_range'] == '۱۰ تا ۱۸ سال'
    assert data['min_age'] == 10
    assert data['max_age'] == 18
    assert 'سرفصل اول' in data['what_you_learn']

    # 2. Timing & Location
    assert data['pool_location'] == 'استخر شهید رئیسی - سالن اصلی'
    assert data['days_of_week'] == 'سه‌شنبه و پنج‌شنبه'
    assert '17:30' in data['time_display']
    assert '19:00' in data['time_display']
    assert str(data['start_date']) == '2026-12-01'
    assert str(data['end_date']) == '2027-02-28'

    # 3. Financials & Installments
    assert Decimal(str(data['base_price'])) == Decimal('2400000.00')
    assert data['sessions_count'] == 12
    assert data['session_price'] == 200000
    assert data['installments_count'] == 3
    assert data['card_number'] == '6037997512345678'
    assert data['card_holder'] == 'مدرسه شنای ایران'

    # 4. Coaches
    assert len(data['coaches']) == 1
    c_info = data['coaches'][0]
    assert c_info['full_name'] == 'کاوه رضایی'
    assert c_info['coaching_degree'] == 'مربیگری درجه ۱'
    assert c_info['years_of_experience'] == 8

    # 5. Enrollment representation
    swimmer_user = User.objects.create_user(phone='09128889900', first_name='آرتین', last_name='راد', role='SWIMMER')
    swimmer_profile = SwimmerProfile.objects.create(user=swimmer_user, first_name='آرتین', last_name='راد', gender='MALE')
    enr = Enrollment.objects.create(
        swimmer=swimmer_profile,
        course=course,
        coach=coach,
        status=Enrollment.Status.ACTIVE,
        sessions_purchased=12,
        sessions_attended=3,
        selected_installments=3
    )

    enr_data = EnrollmentSerializer(instance=enr).data
    assert enr_data['course_name'] == 'دوره تخصصی شنای کرال سینه و پروانه'
    assert enr_data['course_pool'] == 'استخر شهید رئیسی - سالن اصلی'
    assert enr_data['course_days'] == 'سه‌شنبه و پنج‌شنبه'
    assert '17:30' in enr_data['course_time']
    assert str(enr_data['course_start_date']) == '2026-12-01'
    assert str(enr_data['course_end_date']) == '2027-02-28'
    assert enr_data['course_gender_display'] == 'پسران / آقایان'
    assert enr_data['course_sessions_count'] == 12
    assert Decimal(str(enr_data['course_base_price'])) == Decimal('2400000.00')
    assert enr_data['course_card_number'] == '6037997512345678'
    assert enr_data['course_card_holder'] == 'مدرسه شنای ایران'

