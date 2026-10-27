import pytest
from decimal import Decimal
import datetime
from django.utils import timezone
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.education.models import Course, SwimmerGroup, SkillLevel, Enrollment
from apps.swimmers.models import SwimmerProfile
from apps.coaches.models import CoachProfile
from apps.scheduling.models import ClassSession
from apps.attendance.models import AttendanceRecord
from apps.finance.models import Invoice, Installment, Payment, PaymentAllocation
from apps.supervisor.models import SystemErrorLog


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    user = User.objects.create_user(
        phone='09120000001',
        password='testpassword123',
        first_name='مدیر',
        last_name='تست',
        role=User.Role.ADMIN
    )
    return user


@pytest.fixture
def supervisor_user(db):
    user = User.objects.create_user(
        phone='09120000002',
        password='testpassword123',
        first_name='ناظر',
        last_name='سامانه',
        role=User.Role.SUPERVISOR
    )
    return user


@pytest.fixture
def coach_user(db):
    user = User.objects.create_user(
        phone='09120000003',
        password='testpassword123',
        first_name='مربی',
        last_name='تست',
        role=User.Role.COACH
    )
    CoachProfile.objects.create(user=user, specialties='کرال')
    return user


@pytest.fixture
def swimmer_user(db):
    user = User.objects.create_user(
        phone='09120000004',
        password='testpassword123',
        first_name='شناگر',
        last_name='تست',
        role=User.Role.SWIMMER
    )
    SwimmerProfile.objects.create(user=user, first_name='شناگر', last_name='تست')
    return user


@pytest.mark.django_db
def test_login_and_jwt_tokens(api_client, admin_user):
    """تست ورود و دریافت توکن‌های معتبر JWT همراه با نقش کاربری"""
    res = api_client.post('/api/auth/login/', {
        'phone': '09120000001',
        'password': 'testpassword123'
    })
    assert res.status_code == 200
    assert 'access' in res.data
    assert 'refresh' in res.data
    assert res.data['user']['role'] == 'ADMIN'


@pytest.mark.django_db
def test_supervisor_health_check_endpoint(api_client, supervisor_user):
    """تست اختصاصی سرویس پایش سلامت ناظر سامانه"""
    api_client.force_authenticate(user=supervisor_user)
    res = api_client.get('/api/supervisor/health/')
    assert res.status_code == 200
    assert res.data['status'] in ['OPERATIONAL', 'DEGRADED']
    assert res.data['database']['status'] == 'HEALTHY'
    assert 'error_monitoring' in res.data


@pytest.mark.django_db
def test_supervisor_error_logging_middleware(api_client, supervisor_user):
    """تست شبیه‌سازی خطا و اطمینان از ثبت استک‌ترس در پایگاه داده توسط میدل‌ویر ناظر"""
    api_client.force_authenticate(user=supervisor_user)
    
    # Trigger intentional division by zero exception
    res = api_client.post('/api/supervisor/test-trigger/', {'mode': 'division_by_zero'})
    assert res.status_code == 500
    json_data = res.json()
    assert 'error_tracking_id' in json_data

    # Check error record created in DB
    log = SystemErrorLog.objects.get(id=json_data['error_tracking_id'])
    assert log.exception_type == 'ZeroDivisionError'
    assert log.is_resolved is False
    assert 'ZeroDivisionError' in log.stack_trace

    # Resolve error via supervisor API
    resolve_res = api_client.post(f'/api/supervisor/errors/{log.id}/resolve/', {
        'is_resolved': True,
        'resolution_note': 'خطای آزمایشی با موفقیت تحلیل و بررسی گردید.'
    })
    assert resolve_res.status_code == 200
    log.refresh_from_db()
    assert log.is_resolved is True
    assert log.resolution_note == 'خطای آزمایشی با موفقیت تحلیل و بررسی گردید.'


@pytest.mark.django_db
def test_attendance_and_quota_consumption(db, coach_user, swimmer_user):
    """تست ثبت حضور و کسر خودکار سهمیه، و عدم کسر برای غیبت موجه"""
    level = SkillLevel.objects.create(name='سطح ۱', order=1)
    course = Course.objects.create(
        name='دوره ۱',
        start_date=datetime.date.today(),
        end_date=datetime.date.today() + datetime.timedelta(days=30),
        base_price=Decimal('1000000.00'),
        sessions_count=10
    )
    group = SwimmerGroup.objects.create(
        course=course,
        name='گروه ۱',
        skill_level=level,
        capacity=10
    )
    swimmer = swimmer_user.swimmer_profile
    coach = coach_user.coach_profile

    enrollment = Enrollment.objects.create(
        swimmer=swimmer,
        course=course,
        group=group,
        sessions_purchased=10,
        sessions_attended=0
    )

    session = ClassSession.objects.create(
        group=group,
        coach=coach,
        session_date=datetime.date.today(),
        start_time=datetime.time(10, 0),
        end_time=datetime.time(11, 30)
    )

    # Record PRESENT -> quota consumed
    att1 = AttendanceRecord.objects.create(
        session=session,
        swimmer=swimmer,
        enrollment=enrollment,
        status=AttendanceRecord.Status.PRESENT
    )
    enrollment.refresh_from_db()
    assert enrollment.sessions_attended == 1
    assert enrollment.remaining_sessions == 9

    # Change to EXCUSED -> quota restored
    att1.status = AttendanceRecord.Status.EXCUSED
    att1.save()
    enrollment.refresh_from_db()
    assert enrollment.sessions_attended == 0
    assert enrollment.remaining_sessions == 10


@pytest.mark.django_db
def test_financial_decimal_precision_and_allocations(db, swimmer_user, admin_user):
    """تست دقت ریاضی و مالی Decimal و تخصیص اقساط و مانده فاکتور"""
    swimmer = swimmer_user.swimmer_profile
    invoice = Invoice.objects.create(
        invoice_number=Invoice.generate_invoice_number(),
        swimmer=swimmer,
        total_amount=Decimal('3000000.00'),
        issue_date=datetime.date.today(),
        due_date=datetime.date.today() + datetime.timedelta(days=30)
    )
    inst1 = Installment.objects.create(
        invoice=invoice,
        installment_number=1,
        amount=Decimal('1500000.00'),
        due_date=datetime.date.today()
    )
    inst2 = Installment.objects.create(
        invoice=invoice,
        installment_number=2,
        amount=Decimal('1500000.00'),
        due_date=datetime.date.today() + datetime.timedelta(days=30)
    )

    assert invoice.remaining_balance == Decimal('3000000.00')

    # Pay 1,500,000 for inst1
    payment = Payment.objects.create(
        payment_number=Payment.generate_payment_number(),
        swimmer=swimmer,
        amount=Decimal('1500000.00'),
        method=Payment.Method.POS,
        status=Payment.Status.SUCCESSFUL,
        paid_at=timezone.now(),
        recorded_by=admin_user
    )
    PaymentAllocation.objects.create(
        payment=payment,
        invoice=invoice,
        installment=inst1,
        allocated_amount=Decimal('1500000.00')
    )

    inst1.refresh_from_db()
    assert inst1.status == Installment.Status.PAID
    assert invoice.remaining_balance == Decimal('1500000.00')
    assert invoice.status == Invoice.Status.PARTIALLY_PAID


@pytest.mark.django_db
def test_notifications_api_and_read_actions(api_client, admin_user):
    """تست اختصاصی اندپوینت‌های اعلانات، شمارش ناخوانده‌ها و علامت‌گذاری خوانده‌شده"""
    from apps.content.models import Notification

    # Clear any previous notifications to test initial seeding
    Notification.objects.all().delete()

    # Anonymous request must fail
    anon_res = api_client.get('/api/content/notifications/')
    assert anon_res.status_code == 401

    api_client.force_authenticate(user=admin_user)
    res = api_client.get('/api/content/notifications/')
    assert res.status_code == 200
    assert 'unread_count' in res.data
    assert 'results' in res.data
    assert res.data['unread_count'] == 4
    assert len(res.data['results']) == 4

    # Verify categories exist
    categories = {n['category'] for n in res.data['results']}
    assert 'REGISTRATION' in categories
    assert 'PAYMENT' in categories
    assert 'SCHEDULE' in categories
    assert 'ANNOUNCEMENT' in categories

    # Mark single notification as read
    first_id = res.data['results'][0]['id']
    read_res = api_client.post(f'/api/content/notifications/{first_id}/read/')
    assert read_res.status_code == 200
    assert read_res.data['is_read'] is True

    # Check unread count is now 3
    res_after = api_client.get('/api/content/notifications/')
    assert res_after.data['unread_count'] == 3

    # Mark all as read
    read_all_res = api_client.post('/api/content/notifications/read-all/')
    assert read_all_res.status_code == 200
    assert read_all_res.data['success'] is True

    # Check unread count is now 0
    res_final = api_client.get('/api/content/notifications/')
    assert res_final.data['unread_count'] == 0


@pytest.mark.django_db
def test_announcements_crud_and_notification_sync(api_client, admin_user):
    """تست اعلانات درون‌برنامه‌ای، اتصال به سیستم اعلان‌ها و عملیات حذف و تغییر پین"""
    from apps.content.models import Announcement, Notification

    api_client.force_authenticate(user=admin_user)

    # 1. Get announcements list
    res = api_client.get('/api/content/announcements/')
    assert res.status_code == 200
    initial_count = len(res.data.get('results', res.data))

    # 2. Create new announcement
    payload = {
        'title': 'تست اطلاعیه آزمایشی',
        'message': 'این یک پیام اعلان برای آزمایش سیستم است.',
        'audience': 'ALL',
        'is_pinned': True,
    }
    create_res = api_client.post('/api/content/announcements/', payload)
    assert create_res.status_code == 201
    ann_id = create_res.data['id']
    assert create_res.data['title'] == payload['title']
    assert create_res.data['is_pinned'] is True

    # 3. Verify notification was created and connected
    notif = Notification.objects.filter(category=Notification.Category.ANNOUNCEMENT, title__contains='تست اطلاعیه آزمایشی').first()
    assert notif is not None

    # 4. Toggle pin status via PATCH
    patch_res = api_client.patch(f'/api/content/announcements/{ann_id}/', {'is_pinned': False})
    assert patch_res.status_code == 200
    assert patch_res.data['is_pinned'] is False

    # 5. Delete announcement
    del_res = api_client.delete(f'/api/content/announcements/{ann_id}/')
    assert del_res.status_code == 204
    assert not Announcement.objects.filter(id=ann_id).exists()


