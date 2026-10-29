import pytest
from decimal import Decimal
import datetime
from django.utils import timezone
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.coaches.models import CoachProfile, WorkoutPlan
from apps.education.models import Course, SwimmerGroup, SkillLevel, Skill, Enrollment, GroupCoach
from apps.swimmers.models import SwimmerProfile
from apps.scheduling.models import ClassSession
from apps.assessments.models import LevelPromotionProposal, SkillAssessment


@pytest.fixture
def coach_user(db):
    user = User.objects.create_user(
        phone='09129990001',
        password='testpassword123',
        first_name='مربی',
        last_name='نمونه',
        role=User.Role.COACH
    )
    CoachProfile.objects.create(user=user, specialties='کرال سینه، استقامت')
    return user


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        phone='09129990002',
        password='testpassword123',
        first_name='مدیر',
        last_name='آموزشگاه',
        role=User.Role.ADMIN
    )


@pytest.fixture
def sample_setup(db, coach_user):
    coach_profile = coach_user.coach_profile
    level1 = SkillLevel.objects.create(name='مقدماتی', order=1)
    level2 = SkillLevel.objects.create(name='متوسط', order=2)
    skill1 = Skill.objects.create(level=level1, name='شناوری و سرخوردن')

    course = Course.objects.create(
        name='ترم تابستانه شنا',
        start_date=timezone.now().date(),
        end_date=timezone.now().date() + datetime.timedelta(days=60),
        base_price=Decimal('1500000'),
        sessions_count=12
    )
    group = SwimmerGroup.objects.create(
        course=course,
        name='گروه A1',
        skill_level=level1,
        capacity=10
    )
    GroupCoach.objects.create(
        group=group,
        coach=coach_profile,
        assigned_from=timezone.now().date(),
        is_primary=True
    )
    swimmer_user = User.objects.create_user(
        phone='09129990003',
        password='testpassword123',
        first_name='علی',
        last_name='محمدی',
        role=User.Role.SWIMMER
    )
    swimmer = SwimmerProfile.objects.create(
        user=swimmer_user,
        first_name='علی',
        last_name='محمدی',
        current_level=level1
    )
    Enrollment.objects.create(swimmer=swimmer, course=course, group=group, status='ACTIVE')

    session = ClassSession.objects.create(
        group=group,
        coach=coach_profile,
        session_date=timezone.now().date(),
        start_time=datetime.time(10, 0),
        end_time=datetime.time(11, 30),
        status=ClassSession.Status.SCHEDULED
    )

    return {
        'coach': coach_profile,
        'group': group,
        'swimmer': swimmer,
        'level1': level1,
        'level2': level2,
        'session': session
    }


@pytest.mark.django_db
def test_coach_dashboard_overview(coach_user, sample_setup):
    client = APIClient()
    client.force_authenticate(user=coach_user)

    response = client.get('/api/coaches/dashboard-overview/')
    assert response.status_code == 200
    data = response.data
    assert data['coach']['full_name'] == coach_user.coach_profile.full_name
    assert data['today']['sessions_count'] == 1
    assert data['stats']['total_swimmers_count'] == 1


@pytest.mark.django_db
def test_coach_my_classes_and_swimmer_dossier(coach_user, sample_setup):
    client = APIClient()
    client.force_authenticate(user=coach_user)

    # 1. My Classes
    response = client.get('/api/coaches/my-classes/')
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]['name'] == 'گروه A1'

    # 2. Swimmer Dossier
    swimmer_id = sample_setup['swimmer'].id
    dossier_res = client.get(f'/api/coaches/swimmer-dossier/{swimmer_id}/')
    assert dossier_res.status_code == 200
    assert dossier_res.data['swimmer']['first_name'] == 'علی'
    assert 'assessments' in dossier_res.data


@pytest.mark.django_db
def test_coach_workout_plans(coach_user, sample_setup):
    client = APIClient()
    client.force_authenticate(user=coach_user)

    payload = {
        'title': 'تمرین استقامتی کرال سینه',
        'duration_minutes': 75,
        'focus_skills': 'تنفس منظم و هماهنگی پا',
        'warmup_section': '۳۰۰ متر شنای آرام و کشش در آب',
        'main_section': '۸ ست ۵۰ متر با سرعت متوسط',
        'cooldown_section': '۱۰۰ متر کرال پشت آرام',
        'notes': 'کنترل ضربان قلب',
        'is_template': True,
    }
    create_res = client.post('/api/coaches/workouts/', payload, format='json')
    assert create_res.status_code == 201
    assert create_res.data['title'] == 'تمرین استقامتی کرال سینه'

    list_res = client.get('/api/coaches/workouts/')
    assert list_res.status_code == 200
    results = list_res.data.get('results', list_res.data)
    assert len(results) == 1



@pytest.mark.django_db
def test_coach_ai_assistant(coach_user):
    client = APIClient()
    client.force_authenticate(user=coach_user)

    payload = {
        'mode': 'PRACTICE_PLAN',
        'level_name': 'پیشرفته',
        'stroke': 'کرال سینه',
        'duration_minutes': 90,
        'target_focus': 'افزایش سرعت انفجاری',
    }
    response = client.post('/api/coaches/ai/assist/', payload, format='json')
    assert response.status_code == 200
    assert response.data['status'] == 'success'
    plan = response.data['data']
    assert 'warmup_section' in plan
    assert 'main_section' in plan
    assert 'cooldown_section' in plan


@pytest.mark.django_db
def test_coach_level_promotion_flow(coach_user, admin_user, sample_setup):
    client = APIClient()
    client.force_authenticate(user=coach_user)

    swimmer = sample_setup['swimmer']
    level1 = sample_setup['level1']
    level2 = sample_setup['level2']

    payload = {
        'swimmer': swimmer.id,
        'current_level': level1.id,
        'proposed_level': level2.id,
        'coach_notes': 'تسلط کامل بر تمام سرفصل‌های سطح فعلی حاصل شده است.',
    }
    res = client.post('/api/assessments/promotions/', payload, format='json')
    assert res.status_code == 201
    assert res.data['status'] == 'PENDING'

    # Admin reviews proposal
    client.force_authenticate(user=admin_user)
    review_res = client.post(
        f"/api/assessments/promotions/{res.data['id']}/review/",
        {'action': 'APPROVE', 'reviewer_notes': 'تأیید شد.'},
        format='json'
    )
    assert review_res.status_code == 200
    swimmer.refresh_from_db()
    assert swimmer.current_level == level2
