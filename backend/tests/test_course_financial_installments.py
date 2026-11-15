import pytest
from decimal import Decimal
import datetime
from django.utils import timezone
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.education.models import Course, SkillLevel, SwimmerGroup, EnrollmentRequest, Enrollment
from apps.coaches.models import CoachProfile
from apps.finance.models import Invoice, Installment


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        phone='09129990001',
        password='AdminPassword123',
        first_name='مدیر',
        last_name='آموزشگاه',
        role=User.Role.ADMIN
    )


@pytest.fixture
def coach_profile(db):
    u = User.objects.create_user(
        phone='09129990002',
        password='CoachPassword123',
        first_name='رضا',
        last_name='مربی',
        role=User.Role.COACH
    )
    return CoachProfile.objects.create(
        user=u,
        coaching_degree='LEVEL_1',
        card_number='6037997512345678'
    )


@pytest.fixture
def admin_client(api_client, admin_user):
    login_res = api_client.post('/api/auth/login/', {
        'phone': '09129990001',
        'password': 'AdminPassword123'
    })
    token = login_res.data['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return api_client


@pytest.mark.django_db
def test_course_creation_with_card_number(admin_client, coach_profile):
    """تست ثبت دوره جدید همراه با شماره کارت بانکی و سقف اقساط"""
    start_d = timezone.now().date() + datetime.timedelta(days=2)
    end_d = start_d + datetime.timedelta(days=60)

    payload = {
        'name': 'دوره شنای پیشرفته کرال سینه',
        'description': 'دوره ویژه شناگران نوجوان',
        'pool_location': 'استخر شهید رئیسی',
        'days_of_week': 'سه‌شنبه و پنج‌شنبه',
        'start_time': '17:00',
        'end_time': '19:00',
        'start_date': str(start_d),
        'end_date': str(end_d),
        'base_price': 6000000,
        'sessions_count': 12,
        'installments_count': 4,
        'card_number': '6037997511223344',
        'card_holder': 'مدرسه شنای ایران - علی هاشمی',
        'status': 'ACTIVE',
        'coach_ids': [coach_profile.id]
    }

    res = admin_client.post('/api/education/courses/', payload, format='json')
    assert res.status_code == 201
    course_id = res.data['id']

    course = Course.objects.get(id=course_id)
    assert course.card_number == '6037997511223344'
    assert course.card_holder == 'مدرسه شنای ایران - علی هاشمی'
    assert course.installments_count == 4
    assert course.base_price == Decimal('6000000.00')

    # بررسی بازیابی از طریق API
    get_res = admin_client.get(f'/api/education/courses/{course_id}/')
    assert get_res.status_code == 200
    assert get_res.data['card_number'] == '6037997511223344'
    assert get_res.data['card_holder'] == 'مدرسه شنای ایران - علی هاشمی'


@pytest.mark.django_db
def test_swimmer_enrollment_with_custom_unequal_installments(api_client, admin_client, coach_profile):
    """
    نکته دوم کاربر: تعداد اقساط به معنای تقسیم مساوی نیست؛ مبلغ دست شناگر است.
    شناگر دوره ۶ میلیون تومانی را در ۲ قسط دلخواه (مثلاً ۲ میلیون تومان پیش‌پرداخت و ۴ میلیون تومان قسط دوم) انتخاب می‌کند.
    """
    start_d = timezone.now().date() + datetime.timedelta(days=3)
    end_d = start_d + datetime.timedelta(days=60)

    course = Course.objects.create(
        name='دوره مقدماتی شنا',
        start_date=start_d,
        end_date=end_d,
        base_price=Decimal('6000000.00'),
        sessions_count=12,
        installments_count=4,
        card_number='6037997599887766',
        card_holder='آموزشگاه شنا'
    )
    course.coaches.add(coach_profile)
    course.sync_coach_classes()

    # ۱. ثبت درخواست توسط متقاضی با مبالغ دلخواه غیر مساوی: ۲,۰۰۰,۰۰۰ و ۴,۰۰۰,۰۰۰
    enroll_payload = {
        'course': course.id,
        'applicant_name': 'آرتین رستمی',
        'applicant_phone': '09121113355',
        'applicant_national_id': '0012345678',
        'selected_installments': 2,
        'installment_amounts': [2000000, 4000000],
        'notes': 'پرداخت قسط اول به مبلغ ۲ میلیون تومان کارت‌به‌کارت شد.'
    }

    submit_res = api_client.post('/api/education/requests/submit/', enroll_payload, format='json')
    assert submit_res.status_code == 201
    req_id = submit_res.data['id']

    req = EnrollmentRequest.objects.get(id=req_id)
    assert req.selected_installments == 2
    assert req.installment_amounts == [2000000, 4000000]

    # ۲. تأیید درخواست توسط مدیر
    review_res = admin_client.post(f'/api/education/requests/{req_id}/review/', {
        'action': 'APPROVE',
        'selected_installments': 2
    }, format='json')
    assert review_res.status_code == 200

    # ۳. بررسی اقساط تولید شده: باید دقیقاً ۲ میلیون و ۴ میلیون باشند (نه ۳ میلیون مساوی!)
    enrollment = Enrollment.objects.get(course=course, swimmer__phone='09121113355')
    invoice = enrollment.invoice
    assert invoice is not None
    assert invoice.total_amount == Decimal('6000000.00')

    installments = list(invoice.installments.order_by('installment_number'))
    assert len(installments) == 2

    # بررسی مبالغ دست شناگر (نه تقسیم مساوی!)
    assert installments[0].amount == Decimal('2000000.00')
    assert installments[1].amount == Decimal('4000000.00')
    assert installments[0].amount + installments[1].amount == Decimal('6000000.00')


@pytest.mark.django_db
def test_swimmer_enrollment_validation_amounts_sum(api_client, coach_profile):
    """تست اعتبارسنجی: اگر مجموع مبالغ اقساط دست شناگر با کل شهریه همخوانی نداشته باشد باید خطای اعتبارسنجی دهد"""
    start_d = timezone.now().date() + datetime.timedelta(days=3)
    end_d = start_d + datetime.timedelta(days=60)

    course = Course.objects.create(
        name='دوره آزمایشی',
        start_date=start_d,
        end_date=end_d,
        base_price=Decimal('5000000.00'),
        sessions_count=10,
        installments_count=3,
    )

    # مبالغ ارسالی مجموعشان ۴,۰۰۰,۰۰۰ است درحالی که شهریه ۵,۰۰۰,۰۰۰ است
    invalid_payload = {
        'course': course.id,
        'applicant_name': 'متقاضی تستی',
        'applicant_phone': '09129998877',
        'selected_installments': 2,
        'installment_amounts': [2000000, 2000000]
    }

    res = api_client.post('/api/education/requests/submit/', invalid_payload, format='json')
    assert res.status_code == 400
    assert 'installment_amounts' in res.data
