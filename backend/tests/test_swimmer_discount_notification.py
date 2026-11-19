import pytest
from decimal import Decimal
import datetime
from django.utils import timezone
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.education.models import Course, SkillLevel, SwimmerGroup, Enrollment
from apps.swimmers.models import SwimmerProfile, SwimmerGuardianRelation
from apps.finance.models import Invoice, FinancialAdjustment
from apps.content.models import Notification


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        phone='09121110001',
        password='AdminPassword123!',
        first_name='مدیر',
        last_name='آموزشگاه',
        role=User.Role.ADMIN
    )


@pytest.fixture
def admin_client(api_client, admin_user):
    login_res = api_client.post('/api/auth/login/', {
        'phone': '09121110001',
        'password': 'AdminPassword123!'
    })
    token = login_res.data['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return api_client


@pytest.fixture
def swimmer_setup(db):
    swimmer_user = User.objects.create_user(
        phone='09122220002',
        password='SwimmerPass123!',
        first_name='علی',
        last_name='اکبری',
        role=User.Role.SWIMMER
    )
    swimmer = SwimmerProfile.objects.create(
        user=swimmer_user,
        first_name='علی',
        last_name='اکبری',
        phone='09122220002'
    )

    guardian_user = User.objects.create_user(
        phone='09123330003',
        password='GuardianPass123!',
        first_name='محسن',
        last_name='اکبری',
        role=User.Role.SWIMMER
    )
    SwimmerGuardianRelation.objects.create(
        guardian=guardian_user,
        swimmer=swimmer,
        relationship_type='FATHER',
        is_verified=True
    )

    level = SkillLevel.objects.create(name='مقدماتی', order=1)
    course = Course.objects.create(
        name='دوره آموزشی شنای کرال سینه',
        base_price=Decimal('2000000.00'),
        start_date=timezone.now().date(),
        end_date=timezone.now().date() + datetime.timedelta(days=30),
    )
    group = SwimmerGroup.objects.create(
        course=course,
        name='گروه A',
        skill_level=level
    )
    enrollment = Enrollment.objects.create(
        swimmer=swimmer,
        course=course,
        group=group
    )
    invoice = Invoice.objects.create(
        invoice_number=Invoice.generate_invoice_number(),
        swimmer=swimmer,
        enrollment=enrollment,
        total_amount=Decimal('2000000.00'),
        issue_date=timezone.now().date(),
        due_date=timezone.now().date() + datetime.timedelta(days=15)
    )

    return {
        'swimmer_user': swimmer_user,
        'guardian_user': guardian_user,
        'swimmer': swimmer,
        'course': course,
        'invoice': invoice
    }


@pytest.mark.django_db
def test_discount_creates_notification_for_swimmer_and_guardian(admin_client, swimmer_setup):
    """ثبت تخفیف توسط مدیریت باید باعث ارسال اعلان به شناگر و ولی وی شود"""
    invoice = swimmer_setup['invoice']
    swimmer_user = swimmer_setup['swimmer_user']
    guardian_user = swimmer_setup['guardian_user']

    # مدیریت از طریق API یک تخفیف ثبت می‌کند
    discount_amount = Decimal('500000.00')
    reason_text = 'تخفیف وفاداری و ثبت‌نام زودهنگام'

    response = admin_client.post('/api/finance/adjustments/', {
        'invoice': invoice.id,
        'type': 'DISCOUNT',
        'amount': str(discount_amount),
        'reason': reason_text
    })

    assert response.status_code == 201

    # بررسی به‌روزرسانی فاکتور
    invoice.refresh_from_db()
    assert invoice.total_discount == discount_amount
    assert invoice.remaining_balance == Decimal('1500000.00')

    # بررسی ارسال اعلان به کاربر شناگر
    swimmer_notif = Notification.objects.filter(
        recipient=swimmer_user,
        category=Notification.Category.PAYMENT
    ).first()
    assert swimmer_notif is not None
    assert '500,000' in swimmer_notif.title or '۵۰۰,۰۰۰' in swimmer_notif.title or 'تخفیف' in swimmer_notif.title
    assert swimmer_notif.link == '/swimmer/finance'
    assert reason_text in swimmer_notif.message

    # بررسی ارسال اعلان به ولی شناگر
    guardian_notif = Notification.objects.filter(
        recipient=guardian_user,
        category=Notification.Category.PAYMENT
    ).first()
    assert guardian_notif is not None
    assert 'تخفیف' in guardian_notif.title


@pytest.mark.django_db
def test_next_course_discount_notification(admin_client, swimmer_setup):
    """تست ثبت تخفیف دوره بعدی (CREDIT_MEMO) و ایجاد اعلان برای شناگر"""
    invoice = swimmer_setup['invoice']
    swimmer_user = swimmer_setup['swimmer_user']

    credit_amount = Decimal('300000.00')
    reason_text = '[تخفیف دوره بعد] تخفیف استعداد برتر'

    response = admin_client.post('/api/finance/adjustments/', {
        'invoice': invoice.id,
        'type': 'CREDIT_MEMO',
        'amount': str(credit_amount),
        'reason': reason_text
    })

    assert response.status_code == 201

    notif = Notification.objects.filter(
        recipient=swimmer_user,
        category=Notification.Category.PAYMENT
    ).first()
    assert notif is not None
    assert 'دوره بعدی' in notif.title or 'تخفیف' in notif.title
    assert '300,000' in notif.title or '300,000' in notif.message


@pytest.mark.django_db
def test_swimmer_can_view_discount_in_invoices_api(api_client, swimmer_setup):
    """شناگر در پنل خود در بخش صورتحساب‌ها باید تخفیف و عنوان دوره را مشاهده کند"""
    invoice = swimmer_setup['invoice']
    swimmer_user = swimmer_setup['swimmer_user']

    # ثبت تخفیف
    FinancialAdjustment.objects.create(
        invoice=invoice,
        type='DISCOUNT',
        amount=Decimal('400000.00'),
        reason='تخفیف خانوادگی'
    )

    # ورود با حساب شناگر
    login_res = api_client.post('/api/auth/login/', {
        'phone': swimmer_user.phone,
        'password': 'SwimmerPass123!'
    })
    assert login_res.status_code == 200
    token = login_res.data['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    # دریافت فاکتورها در پنل شناگر
    inv_res = api_client.get('/api/finance/invoices/')
    assert inv_res.status_code == 200
    inv_data = inv_res.data if isinstance(inv_res.data, list) else inv_res.data.get('results', [])
    assert len(inv_data) == 1
    item = inv_data[0]

    assert item['course_title'] == 'دوره آموزشی شنای کرال سینه'
    assert Decimal(str(item['total_discount'])) == Decimal('400000.00')
    assert Decimal(str(item['remaining_balance'])) == Decimal('1600000.00')
    assert len(item['adjustments']) == 1
    assert item['adjustments'][0]['reason'] == 'تخفیف خانوادگی'

    # دریافت اعلانات شناگر
    notif_res = api_client.get('/api/content/notifications/')
    assert notif_res.status_code == 200
    notifs = notif_res.data.get('results', [])
    assert len(notifs) >= 1
    assert 'تخفیف' in notifs[0]['title']
