import pytest
from decimal import Decimal
import datetime
from django.utils import timezone
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.swimmers.models import SwimmerProfile
from apps.coaches.models import CoachProfile
from apps.education.models import Course, SwimmerGroup, SkillLevel, Enrollment
from apps.finance.models import Invoice, Installment, Payment


@pytest.fixture
def female_admin_test_env(db):
    # 1. Normal Admin (Full access to all genders)
    admin_user = User.objects.create_user(
        phone='09111111111',
        password='Password123!',
        first_name='علی',
        last_name='مدیری',
        role=User.Role.ADMIN,
        is_staff=True,
    )

    # 2. Female Admin (Scoped strictly to females)
    female_admin_user = User.objects.create_user(
        phone='09444444444',
        password='Password123!',
        first_name='مریم',
        last_name='رضایی',
        role=User.Role.FEMALE_ADMIN,
        is_staff=True,
    )

    # 3. Male Swimmer & User
    male_swimmer_user = User.objects.create_user(
        phone='09120000001',
        password='Password123!',
        first_name='سامان',
        last_name='پسرانه',
        role=User.Role.SWIMMER,
    )
    male_swimmer = SwimmerProfile.objects.create(
        user=male_swimmer_user,
        first_name='سامان',
        last_name='پسرانه',
        gender='MALE',
        date_of_birth=datetime.date(2012, 5, 10),
    )

    # 4. Female Swimmer & User
    female_swimmer_user = User.objects.create_user(
        phone='09120000002',
        password='Password123!',
        first_name='سارا',
        last_name='دخترانه',
        role=User.Role.SWIMMER,
    )
    female_swimmer = SwimmerProfile.objects.create(
        user=female_swimmer_user,
        first_name='سارا',
        last_name='دخترانه',
        gender='FEMALE',
        date_of_birth=datetime.date(2013, 8, 15),
    )

    # 5. Male Coach & User
    male_coach_user = User.objects.create_user(
        phone='09130000001',
        password='Password123!',
        first_name='کامران',
        last_name='مردانی',
        role=User.Role.COACH,
    )
    male_coach = CoachProfile.objects.create(
        user=male_coach_user,
        first_name='کامران',
        last_name='مردانی',
        gender='MALE',
        personnel_id='EMP-MALE-1',
    )

    # 6. Female Coach & User
    female_coach_user = User.objects.create_user(
        phone='09130000002',
        password='Password123!',
        first_name='نیلوفر',
        last_name='بانو',
        role=User.Role.COACH,
    )
    female_coach = CoachProfile.objects.create(
        user=female_coach_user,
        first_name='نیلوفر',
        last_name='بانو',
        gender='FEMALE',
        personnel_id='EMP-FEMALE-1',
    )

    # 7. Level & Courses
    level = SkillLevel.objects.create(name='مقدماتی ۱', order=1)

    male_course = Course.objects.create(
        name='شنا مقدماتی پسران',
        gender=Course.GenderTarget.MALE,
        base_price=Decimal('1000000.00'),
        start_date=timezone.now().date(),
        end_date=timezone.now().date() + datetime.timedelta(days=60),
    )

    female_course = Course.objects.create(
        name='شنا مقدماتی بانوان',
        gender=Course.GenderTarget.FEMALE,
        base_price=Decimal('1200000.00'),
        start_date=timezone.now().date(),
        end_date=timezone.now().date() + datetime.timedelta(days=60),
    )

    # 8. Invoices
    today = timezone.now().date()
    male_inv = Invoice.objects.create(
        invoice_number='INV-TEST-MALE-1',
        swimmer=male_swimmer,
        total_amount=Decimal('1000000.00'),
        status='PARTIALLY_PAID',
        issue_date=today,
        due_date=today + datetime.timedelta(days=30),
    )
    female_inv = Invoice.objects.create(
        invoice_number='INV-TEST-FEMALE-1',
        swimmer=female_swimmer,
        total_amount=Decimal('1200000.00'),
        status='PAID',
        issue_date=today,
        due_date=today + datetime.timedelta(days=30),
    )

    return {
        'admin_user': admin_user,
        'female_admin_user': female_admin_user,
        'male_swimmer': male_swimmer,
        'female_swimmer': female_swimmer,
        'male_coach': male_coach,
        'female_coach': female_coach,
        'male_course': male_course,
        'female_course': female_course,
        'male_inv': male_inv,
        'female_inv': female_inv,
        'level': level,
    }


@pytest.mark.django_db
def test_female_admin_login(female_admin_test_env):
    """Verify FEMALE_ADMIN can login and role is returned as FEMALE_ADMIN."""
    client = APIClient()
    res = client.post('/api/auth/login/', {
        'phone': '09444444444',
        'password': 'Password123!',
    })
    assert res.status_code == 200
    assert res.data['user']['role'] == 'FEMALE_ADMIN'
    assert 'access' in res.data


@pytest.mark.django_db
def test_swimmer_list_and_detail_gender_isolation(female_admin_test_env):
    """
    FEMALE_ADMIN querying /api/swimmers/ receives ONLY female swimmers.
    ADMIN querying /api/swimmers/ receives BOTH genders.
    """
    env = female_admin_test_env
    client = APIClient()

    # 1. As FEMALE_ADMIN
    client.force_authenticate(user=env['female_admin_user'])
    res_fa = client.get('/api/swimmers/')
    assert res_fa.status_code == 200
    results_fa = res_fa.data['results'] if isinstance(res_fa.data, dict) and 'results' in res_fa.data else res_fa.data
    swimmer_ids_fa = [s['id'] for s in results_fa]

    assert env['female_swimmer'].id in swimmer_ids_fa
    assert env['male_swimmer'].id not in swimmer_ids_fa

    # Attempting to fetch male swimmer directly as FEMALE_ADMIN returns 404
    res_detail_male = client.get(f'/api/swimmers/{env["male_swimmer"].id}/')
    assert res_detail_male.status_code == 404

    # Fetching female swimmer returns 200
    res_detail_female = client.get(f'/api/swimmers/{env["female_swimmer"].id}/')
    assert res_detail_female.status_code == 200
    assert res_detail_female.data['gender'] == 'FEMALE'

    # 2. As normal ADMIN (unrestricted)
    client.force_authenticate(user=env['admin_user'])
    res_admin = client.get('/api/swimmers/')
    assert res_admin.status_code == 200
    results_admin = res_admin.data['results'] if isinstance(res_admin.data, dict) and 'results' in res_admin.data else res_admin.data
    swimmer_ids_admin = [s['id'] for s in results_admin]

    assert env['female_swimmer'].id in swimmer_ids_admin
    assert env['male_swimmer'].id in swimmer_ids_admin


@pytest.mark.django_db
def test_swimmer_creation_enforces_female_for_female_admin(female_admin_test_env):
    """
    FEMALE_ADMIN creating a swimmer:
    1. Sending gender='MALE' is rejected with 400 ValidationError.
    2. Sending gender='FEMALE' creates the swimmer successfully with gender='FEMALE'.
    """
    env = female_admin_test_env
    client = APIClient()
    client.force_authenticate(user=env['female_admin_user'])

    # 1. Sending MALE is rejected
    res_male = client.post('/api/swimmers/', {
        'first_name': 'رضا',
        'last_name': 'پسرانه',
        'phone': '09129998870',
        'gender': 'MALE',
        'date_of_birth': '2014-01-01',
    })
    assert res_male.status_code == 400
    assert 'gender' in res_male.data

    # 2. Sending FEMALE succeeds
    res_female = client.post('/api/swimmers/', {
        'first_name': 'مبینا',
        'last_name': 'احمدی',
        'phone': '09129998877',
        'gender': 'FEMALE',
        'date_of_birth': '2014-01-01',
    })
    assert res_female.status_code in [200, 201]
    swimmer = SwimmerProfile.objects.get(phone='09129998877')
    assert swimmer.gender == 'FEMALE'


@pytest.mark.django_db
def test_coach_list_and_detail_gender_isolation(female_admin_test_env):
    """
    FEMALE_ADMIN querying /api/coaches/ receives ONLY female coaches.
    ADMIN querying /api/coaches/ receives BOTH genders.
    """
    env = female_admin_test_env
    client = APIClient()

    # 1. As FEMALE_ADMIN
    client.force_authenticate(user=env['female_admin_user'])
    res_fa = client.get('/api/coaches/')
    assert res_fa.status_code == 200
    results_fa = res_fa.data['results'] if isinstance(res_fa.data, dict) and 'results' in res_fa.data else res_fa.data
    coach_ids_fa = [c['id'] for c in results_fa]

    assert env['female_coach'].id in coach_ids_fa
    assert env['male_coach'].id not in coach_ids_fa

    # Attempting to fetch male coach directly returns 404
    res_male = client.get(f'/api/coaches/{env["male_coach"].id}/')
    assert res_male.status_code == 404

    # Fetching female coach returns 200
    res_female = client.get(f'/api/coaches/{env["female_coach"].id}/')
    assert res_female.status_code == 200

    # 2. As normal ADMIN
    client.force_authenticate(user=env['admin_user'])
    res_admin = client.get('/api/coaches/')
    assert res_admin.status_code == 200
    results_admin = res_admin.data['results'] if isinstance(res_admin.data, dict) and 'results' in res_admin.data else res_admin.data
    coach_ids_admin = [c['id'] for c in results_admin]

    assert env['female_coach'].id in coach_ids_admin
    assert env['male_coach'].id in coach_ids_admin


@pytest.mark.django_db
def test_finance_isolation_for_female_admin(female_admin_test_env):
    """
    Invoices and financial summaries are scoped to female swimmers for FEMALE_ADMIN.
    ADMIN sees all invoices and total financials.
    """
    env = female_admin_test_env
    client = APIClient()

    # 1. As FEMALE_ADMIN
    client.force_authenticate(user=env['female_admin_user'])
    res_inv = client.get('/api/finance/invoices/')
    assert res_inv.status_code == 200
    invoices_fa = res_inv.data['results'] if isinstance(res_inv.data, dict) and 'results' in res_inv.data else res_inv.data
    inv_ids_fa = [inv['id'] for inv in invoices_fa]

    assert env['female_inv'].id in inv_ids_fa
    assert env['male_inv'].id not in inv_ids_fa

    res_sum = client.get('/api/finance/summary/')
    assert res_sum.status_code == 200
    assert Decimal(str(res_sum.data['total_invoiced'])) == Decimal('1200000.00')

    # 2. As normal ADMIN
    client.force_authenticate(user=env['admin_user'])
    res_inv_admin = client.get('/api/finance/invoices/')
    assert res_inv_admin.status_code == 200
    invoices_admin = res_inv_admin.data['results'] if isinstance(res_inv_admin.data, dict) and 'results' in res_inv_admin.data else res_inv_admin.data
    inv_ids_admin = [inv['id'] for inv in invoices_admin]

    assert env['female_inv'].id in inv_ids_admin
    assert env['male_inv'].id in inv_ids_admin
