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
def test_supervisor_technical_operations_hub_endpoints(api_client, supervisor_user):
    """تست جامع اندپوینت‌های دهگانه هاب عملیات فنی ناظر (Overview, Infra, Services, Config, etc.)"""
    api_client.force_authenticate(user=supervisor_user)

    # 1. Overview
    res_overview = api_client.get('/api/supervisor/overview/')
    assert res_overview.status_code == 200
    assert 'system_status' in res_overview.data
    assert 'database' in res_overview.data

    # 2. Infrastructure
    res_infra = api_client.get('/api/supervisor/infrastructure/')
    assert res_infra.status_code == 200
    assert 'cpu' in res_infra.data
    assert 'ram' in res_infra.data
    assert 'containers' in res_infra.data

    # 3. Services
    res_services = api_client.get('/api/supervisor/services/')
    assert res_services.status_code == 200
    assert 'services' in res_services.data
    assert len(res_services.data['services']) >= 4

    # 4. Activity
    res_act = api_client.get('/api/supervisor/activity/')
    assert res_act.status_code == 200
    assert 'active_sessions_count' in res_act.data
    assert 'privileged_users' in res_act.data

    # 5. Deployments
    res_dep = api_client.get('/api/supervisor/deployments/')
    assert res_dep.status_code == 200
    assert 'current_release' in res_dep.data

    # Create new deployment marker
    res_dep_post = api_client.post('/api/supervisor/deployments/', {
        'version': 'v1.3.0',
        'commit_sha': 'abcdef123456',
        'commit_message': 'Add technical supervisor ops hub',
        'branch': 'main'
    })
    assert res_dep_post.status_code == 201
    assert res_dep_post.data['version'] == 'v1.3.0'

    # 6. Backups
    res_bak = api_client.get('/api/supervisor/backups/')
    assert res_bak.status_code == 200
    assert 'backups' in res_bak.data

    # Create manual backup snapshot
    res_bak_post = api_client.post('/api/supervisor/backups/', {
        'notes': 'تست بک‌آپ دستی در واحد آزمون'
    })
    assert res_bak_post.status_code == 201
    assert res_bak_post.data['status'] == 'COMPLETED'
    assert 'checksum' in res_bak_post.data

    # 7. Config & Feature Flags
    res_cfg = api_client.get('/api/supervisor/config/')
    assert res_cfg.status_code == 200
    assert 'maintenance_mode' in res_cfg.data
    assert 'feature_flags' in res_cfg.data

    # Update config toggle
    res_cfg_post = api_client.post('/api/supervisor/config/', {
        'key': 'feature_flags',
        'value': {'online_leagues': True, 'test_flag': True}
    }, format='json')
    assert res_cfg_post.status_code == 200
    assert res_cfg_post.data['value']['test_flag'] is True


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
def test_admin_attendance_search_and_category_filtering(api_client, admin_user, coach_user, swimmer_user):
    """تست فیلترهای دسته‌بندی و سرچ حضور و غیاب در پنل مدیریت"""
    level_beginner = SkillLevel.objects.create(name='مبتدی (آشنایی با آب)', order=1)
    level_advanced = SkillLevel.objects.create(name='پیشرفته (قورباغه و پروانه)', order=2)

    course1 = Course.objects.create(
        name='دوره جامع آموزش کرال سینه',
        start_date=datetime.date.today(),
        end_date=datetime.date.today() + datetime.timedelta(days=30),
        base_price=Decimal('1000000.00'),
        sessions_count=10
    )
    course2 = Course.objects.create(
        name='دوره تخصصی پروانه و استارت',
        start_date=datetime.date.today(),
        end_date=datetime.date.today() + datetime.timedelta(days=30),
        base_price=Decimal('1500000.00'),
        sessions_count=10
    )

    group1 = SwimmerGroup.objects.create(
        course=course1,
        name='گروه A کرال سینه',
        skill_level=level_beginner,
        capacity=10
    )
    group2 = SwimmerGroup.objects.create(
        course=course2,
        name='گروه B پروانه',
        skill_level=level_advanced,
        capacity=10
    )

    coach = coach_user.coach_profile
    swimmer = swimmer_user.swimmer_profile

    Enrollment.objects.create(
        swimmer=swimmer,
        course=course1,
        group=group1,
        sessions_purchased=10,
        sessions_attended=0,
        status=Enrollment.Status.ACTIVE
    )

    session1 = ClassSession.objects.create(
        group=group1,
        coach=coach,
        session_date=datetime.date.today(),
        start_time=datetime.time(10, 0),
        end_time=datetime.time(11, 30),
        pool_location='استخر آزادی',
        status=ClassSession.Status.COMPLETED
    )
    session2 = ClassSession.objects.create(
        group=group2,
        coach=coach,
        session_date=datetime.date.today(),
        start_time=datetime.time(14, 0),
        end_time=datetime.time(15, 30),
        pool_location='استخر ۵۰ متری المپیک',
        status=ClassSession.Status.SCHEDULED
    )

    # Record attendance for session1
    AttendanceRecord.objects.create(
        session=session1,
        swimmer=swimmer,
        status=AttendanceRecord.Status.PRESENT
    )

    api_client.force_authenticate(user=admin_user)

    # Helper to extract list from paginated or non-paginated response
    def get_list(response):
        if isinstance(response.data, dict) and 'results' in response.data:
            return response.data['results']
        return response.data

    # 1. Test Course category filter
    res = api_client.get('/api/scheduling/sessions/', {'course_id': course1.id})
    assert res.status_code == 200
    ids = [item['id'] for item in get_list(res)]
    assert session1.id in ids
    assert session2.id not in ids

    # 2. Test Skill Level category filter
    res = api_client.get('/api/scheduling/sessions/', {'skill_level_id': level_advanced.id})
    assert res.status_code == 200
    ids = [item['id'] for item in get_list(res)]
    assert session2.id in ids
    assert session1.id not in ids

    # 3. Test Pool Location category filter
    res = api_client.get('/api/scheduling/sessions/', {'pool_location': 'استخر آزادی'})
    assert res.status_code == 200
    ids = [item['id'] for item in get_list(res)]
    assert session1.id in ids
    assert session2.id not in ids

    # 4. Test Search by group/course name
    res = api_client.get('/api/scheduling/sessions/', {'search': 'پروانه'})
    assert res.status_code == 200
    ids = [item['id'] for item in get_list(res)]
    assert session2.id in ids
    assert session1.id not in ids

    # 5. Test Attendance Status filters (RECORDED vs UNRECORDED)
    res_rec = api_client.get('/api/scheduling/sessions/', {'attendance_status': 'RECORDED'})
    assert res_rec.status_code == 200
    ids_rec = [item['id'] for item in get_list(res_rec)]
    assert session1.id in ids_rec
    assert session2.id not in ids_rec

    res_unrec = api_client.get('/api/scheduling/sessions/', {'attendance_status': 'UNRECORDED'})
    assert res_unrec.status_code == 200
    ids_unrec = [item['id'] for item in get_list(res_unrec)]
    assert session2.id in ids_unrec
    assert session1.id not in ids_unrec

    # 6. Verify serializer category fields
    item1 = next(item for item in get_list(res) if item['id'] == session2.id)
    assert item1['course_name'] == 'دوره تخصصی پروانه و استارت'
    assert item1['skill_level_name'] == 'پیشرفته (قورباغه و پروانه)'
    assert item1['attendance_recorded'] is False
    assert item1['attendance_count'] == 0


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


@pytest.mark.django_db
def test_otp_registration_and_login_flow(api_client):
    # 1. Request OTP for registration
    phone = '09129998877'
    send_res = api_client.post('/api/auth/otp/send/', {'phone': phone, 'purpose': 'REGISTER'})
    assert send_res.status_code == 200
    otp_code = send_res.data['code']
    assert len(otp_code) == 6

    # 2. Register swimmer with OTP and national_id
    national_id = '0012345678'
    reg_payload = {
        'phone': phone,
        'code': otp_code,
        'first_name': 'رضا',
        'last_name': 'علوی',
        'national_id': national_id,
    }
    reg_res = api_client.post('/api/auth/register-otp/', reg_payload)
    assert reg_res.status_code == 201
    assert 'access' in reg_res.data
    assert reg_res.data['user']['phone'] == phone
    assert reg_res.data['user']['role'] == 'SWIMMER'
    assert reg_res.data['user']['is_profile_completed'] is False

    # 3. Login with password (national_id) as required: نام کاربری: شماره و رمز: کد ملی
    login_res = api_client.post('/api/auth/login/', {'phone': phone, 'password': national_id})
    assert login_res.status_code == 200
    assert 'access' in login_res.data
    assert login_res.data['user']['full_name'] == 'رضا علوی'

    # 4. Login with OTP (بدون رمز)
    otp_login_send = api_client.post('/api/auth/otp/send/', {'phone': phone, 'purpose': 'LOGIN'})
    assert otp_login_send.status_code == 200
    login_otp_code = otp_login_send.data['code']

    otp_verify_res = api_client.post('/api/auth/otp/verify-login/', {'phone': phone, 'code': login_otp_code})
    assert otp_verify_res.status_code == 200
    assert 'access' in otp_verify_res.data
    assert otp_verify_res.data['user']['phone'] == phone


@pytest.mark.django_db
def test_swimmer_profile_completion_and_validation(api_client):
    import io
    from PIL import Image
    from django.core.files.uploadedfile import SimpleUploadedFile

    # Create dummy image in memory
    def create_dummy_image(name='test.jpg'):
        file_obj = io.BytesIO()
        image = Image.new('RGB', (100, 100), color=(73, 109, 137))
        image.save(file_obj, format='JPEG')
        file_obj.seek(0)
        return SimpleUploadedFile(name, file_obj.read(), content_type='image/jpeg')

    # Register user first
    phone = '09351112233'
    send_res = api_client.post('/api/auth/otp/send/', {'phone': phone, 'purpose': 'REGISTER'})
    code = send_res.data['code']
    national_id = '0088991122'
    api_client.post('/api/auth/register-otp/', {
        'phone': phone,
        'code': code,
        'first_name': 'سهراب',
        'last_name': 'سپهری',
        'national_id': national_id,
    })

    user = User.objects.get(phone=phone)
    api_client.force_authenticate(user=user)

    # 1. Fetch own profile via /api/swimmers/me/
    me_res = api_client.get('/api/swimmers/me/')
    assert me_res.status_code == 200
    assert me_res.data['phone'] == phone
    assert me_res.data['is_profile_completed'] is False

    # 2. Try to complete profile with missing mandatory fields -> should fail with clear list
    fail_res = api_client.post('/api/swimmers/me/complete/', {})
    assert fail_res.status_code == 400
    assert 'missing_fields' in fail_res.data

    # 3. Complete profile with all required star fields
    complete_payload = {
        'first_name': 'سهراب',
        'last_name': 'سپهری',
        'date_of_birth': '1388-05-15',
        'father_name': 'مهدی',
        'national_id': national_id,
        'address': 'تهران، خیابان آزادی، کوچه مروارید، پلاک ۱۲',
        'latitude': 35.6892,
        'longitude': 51.3890,
        'father_phone': '09121112233',
        'mother_phone': '09124445566',
        'gender': 'MALE',
        'school_name': 'دبیرستان رازی',
        'birth_certificate_image': create_dummy_image('shenasname.jpg'),
        'national_card_image': create_dummy_image('melli.jpg'),
        'sports_insurance_image': create_dummy_image('bimeh.jpg'),
        'avatar': create_dummy_image('avatar.jpg'),
    }
    comp_res = api_client.post('/api/swimmers/me/complete/', complete_payload, format='multipart')
    assert comp_res.status_code == 200
    assert comp_res.data['profile']['is_profile_completed'] is True
    assert comp_res.data['profile']['father_name'] == 'مهدی'
    assert comp_res.data['profile']['address'] == complete_payload['address']


@pytest.mark.django_db
def test_guardian_multi_child_and_password_change(api_client, admin_user):
    """تست پشتیبانی از چند فرزند برای یک حساب والد و تغییر رمز اولیه کد ملی به رمز قوی"""
    parent_phone = '09351234567'
    national_id = '0012345678'
    
    # 1. Register parent with OTP
    from apps.accounts.models import OTPVerification
    OTPVerification.objects.create(
        phone=parent_phone,
        code='112233',
        purpose='REGISTER',
        expires_at=timezone.now() + datetime.timedelta(minutes=5)
    )
    reg_res = api_client.post('/api/auth/register-otp/', {
        'phone': parent_phone,
        'code': '112233',
        'first_name': 'مریم',
        'last_name': 'کریمی',
        'national_id': national_id,
    })
    assert reg_res.status_code == 201
    parent_user = User.objects.get(phone=parent_phone)
    assert parent_user.is_password_changed is False

    api_client.force_authenticate(user=parent_user)

    # 2. Add second child (آرتین) under the same parent account
    add_child_res = api_client.post('/api/swimmers/my-children/', {
        'first_name': 'آرتین',
        'last_name': 'کریمی',
        'national_id': '0098765432',
        'gender': 'MALE',
        'relationship_type': 'MOTHER',
    })
    assert add_child_res.status_code == 201
    second_child_id = add_child_res.data['swimmer']

    # 3. List children
    children_res = api_client.get('/api/swimmers/my-children/')
    assert children_res.status_code == 200
    assert len(children_res.data) == 2

    # 4. Access second child profile specifically
    child_profile_res = api_client.get(f'/api/swimmers/me/?swimmer_id={second_child_id}')
    assert child_profile_res.status_code == 200
    assert child_profile_res.data['first_name'] == 'آرتین'

    # 5. Change initial password to strong password
    pwd_res = api_client.post('/api/auth/change-password/', {
        'old_password': national_id,
        'new_password': 'MyStrongPassword@2026',
        'confirm_password': 'MyStrongPassword@2026',
    })
    assert pwd_res.status_code == 200
    parent_user.refresh_from_db()
    assert parent_user.is_password_changed is True
    assert parent_user.check_password('MyStrongPassword@2026') is True


@pytest.mark.django_db
def test_support_ticket_flow(api_client, admin_user):
    """تست ثبت تیکت پشتیبانی شناگر و پاسخ‌دهی مدیریت آموزشگاه"""
    user = User.objects.create_user(
        phone='09360000001',
        password='pass123456',
        first_name='پارسا',
        last_name='افشار',
        role=User.Role.SWIMMER
    )
    from apps.swimmers.models import SwimmerProfile
    swimmer = SwimmerProfile.objects.create(
        user=user,
        first_name='پارسا',
        last_name='افشار',
        phone=user.phone
    )

    api_client.force_authenticate(user=user)

    # 1. User submits ticket
    ticket_res = api_client.post('/api/content/tickets/', {
        'category': 'SCHEDULE',
        'subject': 'درخواست غیبت موجه به دلیل مسابقات مدرسه',
        'description': 'شناگر در تاریخ پنج‌شنبه در مسابقات شنای دانش‌آموزی شرکت دارد.',
    })
    assert ticket_res.status_code == 201
    ticket_id = ticket_res.data['id']
    assert ticket_res.data['status'] == 'SUBMITTED'

    # 2. Admin views and responds
    api_client.force_authenticate(user=admin_user)
    reply_res = api_client.patch(f'/api/content/tickets/{ticket_id}/', {
        'response': 'با غیبت موجه موافقت شد و سهمیه جلسه کسر نخواهد گردید.',
        'status': 'ANSWERED',
    })
    assert reply_res.status_code == 200
    assert reply_res.data['status'] == 'ANSWERED'

    # 3. User verifies response
    api_client.force_authenticate(user=user)
    user_tickets_res = api_client.get('/api/content/tickets/')
    assert user_tickets_res.status_code == 200
    assert user_tickets_res.data['results'][0]['status'] == 'ANSWERED'
    assert 'با غیبت موجه موافقت شد' in user_tickets_res.data['results'][0]['response']


@pytest.mark.django_db
def test_supervisor_user_management_crud(api_client, supervisor_user):
    """تست کامل مدیریت کاربران (ایجاد، ویرایش، تغییر نقش، تغییر کلمه عبور و حذف) توسط ناظر فنی"""
    from apps.supervisor.models import AuditLog

    api_client.force_authenticate(user=supervisor_user)

    # 1. ناظر فنی لیست کاربران را دریافت می‌کند
    list_res = api_client.get('/api/auth/users/')
    assert list_res.status_code == 200

    # 2. ناظر فنی یک کاربر جدید با نقش مدیر می‌سازد
    create_res = api_client.post('/api/auth/users/', {
        'phone': '09129998877',
        'first_name': 'مدیر جدید',
        'last_name': 'تهرانی',
        'national_id': '0012345678',
        'role': 'ADMIN',
        'password': 'StrongPassword@2026',
        'is_active': True,
    })
    assert create_res.status_code == 201
    new_user_id = create_res.data['id']
    assert create_res.data['phone'] == '09129998877'
    assert create_res.data['role'] == 'ADMIN'

    # بررسی ثبت در دیتابیس و لاگ حسابرسی
    created_user = User.objects.get(id=new_user_id)
    assert created_user.check_password('StrongPassword@2026')
    assert AuditLog.objects.filter(entity_type='User', entity_id=str(new_user_id), action='USER_CREATE').exists()

    # 3. ناظر فنی مشخصات و کلمه عبور کاربر را ویرایش می‌کند
    update_res = api_client.patch(f'/api/auth/users/{new_user_id}/', {
        'first_name': 'مدیر ارشد',
        'password': 'UpdatedPassword@2026',
    })
    assert update_res.status_code == 200
    assert update_res.data['first_name'] == 'مدیر ارشد'
    created_user.refresh_from_db()
    assert created_user.check_password('UpdatedPassword@2026')

    # 4. جلوگیری از حذف کاربر جاری توسط خودش
    self_delete_res = api_client.delete(f'/api/auth/users/{supervisor_user.id}/')
    assert self_delete_res.status_code == 400

    # 5. ناظر فنی کاربر ایجاد شده را حذف می‌کند
    delete_res = api_client.delete(f'/api/auth/users/{new_user_id}/')
    assert delete_res.status_code == 204
    assert not User.objects.filter(id=new_user_id).exists()
    assert AuditLog.objects.filter(entity_type='User', entity_id=str(new_user_id), action='USER_DELETE').exists()


def test_admin_user_management_crud_and_access_restrictions(api_client, admin_user, supervisor_user, coach_user, swimmer_user):
    """مدیر آموزشگاه فقط به مربیان، شناگران و خودش دسترسی دارد؛ ناظران فنی و سایر مدیران قابل دسترسی نیستند"""
    # Create another admin
    other_admin = User.objects.create_user(
        phone='09120000099',
        password='testpassword123',
        first_name='مدیر دیگر',
        last_name='تست',
        role=User.Role.ADMIN
    )

    api_client.force_authenticate(user=admin_user)

    # 1. مدیر لیست کاربران را می‌گیرد: نباید ناظر فنی یا مدیر دیگر در لیست باشند
    list_res = api_client.get('/api/auth/users/')
    assert list_res.status_code == 200
    data_list = list_res.data.get('results', list_res.data) if isinstance(list_res.data, dict) else list_res.data
    user_ids = [u['id'] for u in data_list]
    assert supervisor_user.id not in user_ids
    assert other_admin.id not in user_ids
    assert coach_user.id in user_ids
    assert swimmer_user.id in user_ids
    assert admin_user.id in user_ids

    # 2. مدیر نمی‌تواند مدیر جدید یا ناظر فنی ایجاد کند
    fail_create = api_client.post('/api/auth/users/', {
        'phone': '09129990011',
        'first_name': 'ادمین غیرمجاز',
        'last_name': 'تست',
        'role': 'ADMIN',
    })
    assert fail_create.status_code == 400

    fail_create_sup = api_client.post('/api/auth/users/', {
        'phone': '09129990012',
        'first_name': 'ناظر غیرمجاز',
        'last_name': 'تست',
        'role': 'SUPERVISOR',
    })
    assert fail_create_sup.status_code == 400

    # 3. مدیر کاربر جدید شناگر ایجاد می‌کند (اضافه کردن)
    create_swimmer = api_client.post('/api/auth/users/', {
        'phone': '09129990013',
        'first_name': 'شناگر جدید',
        'last_name': 'مدیریتی',
        'national_id': '0012399999',
        'role': 'SWIMMER',
        'password': 'Password@123',
        'is_active': True,
    })
    assert create_swimmer.status_code == 201
    new_swimmer_id = create_swimmer.data['id']

    # 4. مدیر مشخصات کاربر را ادیت می‌کند
    edit_res = api_client.patch(f'/api/auth/users/{new_swimmer_id}/', {
        'first_name': 'شناگر ویرایش شده',
    })
    assert edit_res.status_code == 200
    assert edit_res.data['first_name'] == 'شناگر ویرایش شده'

    # 5. مدیر کاربر را معلق (غیرفعال) می‌کند
    suspend_res = api_client.patch(f'/api/auth/users/{new_swimmer_id}/', {
        'is_active': False,
    })
    assert suspend_res.status_code == 200
    assert suspend_res.data['is_active'] is False

    # 6. مدیر نمی‌تواند خودش را معلق کند
    self_suspend_res = api_client.patch(f'/api/auth/users/{admin_user.id}/', {
        'is_active': False,
    })
    assert self_suspend_res.status_code == 400

    # 7. مدیر نمی‌تواند نقش کاربر را به ADMIN یا SUPERVISOR تغییر دهد
    role_change_fail = api_client.patch(f'/api/auth/users/{new_swimmer_id}/', {
        'role': 'ADMIN',
    })
    assert role_change_fail.status_code == 400

    # 8. مدیر نمی‌تواند مدیر دیگر یا ناظر فنی را مشاهده، ویرایش یا حذف کند
    sup_detail = api_client.get(f'/api/auth/users/{supervisor_user.id}/')
    assert sup_detail.status_code == 404

    other_admin_edit = api_client.patch(f'/api/auth/users/{other_admin.id}/', {'first_name': 'تلاش هک'})
    assert other_admin_edit.status_code == 404

    other_admin_del = api_client.delete(f'/api/auth/users/{other_admin.id}/')
    assert other_admin_del.status_code == 404

    # 9. مدیر کاربر ساخته شده را حذف (دیلیت) می‌کند
    del_res = api_client.delete(f'/api/auth/users/{new_swimmer_id}/')
    assert del_res.status_code == 204
    assert not User.objects.filter(id=new_swimmer_id).exists()


@pytest.mark.django_db
def test_admin_swimmer_document_review_and_notifications(api_client, admin_user, swimmer_user):
    from apps.content.models import Notification
    from apps.swimmers.models import SwimmerProfile, DocumentStatus

    # Get swimmer profile
    swimmer = swimmer_user.swimmer_profile

    # Swimmer cannot review own documents (Forbidden)
    api_client.force_authenticate(user=swimmer_user)
    fail_res = api_client.post(f'/api/swimmers/{swimmer.id}/review-documents/', {
        'action': 'APPROVE'
    })
    assert fail_res.status_code == 403

    # Authenticate as Admin
    api_client.force_authenticate(user=admin_user)

    # 1. Reject without reason should fail
    reject_fail = api_client.post(f'/api/swimmers/{swimmer.id}/review-documents/', {
        'action': 'REJECT',
        'reason': ''
    })
    assert reject_fail.status_code == 400

    # 2. Reject with reason
    reason_text = 'تصویر کارت ملی تار است، لطفاً تصویر باکیفیت بارگذاری فرمایید.'
    reject_res = api_client.post(f'/api/swimmers/{swimmer.id}/review-documents/', {
        'action': 'REJECT',
        'reason': reason_text
    })
    assert reject_res.status_code == 200
    swimmer.refresh_from_db()
    assert swimmer.birth_certificate_status == DocumentStatus.REVISION_REQUIRED
    assert swimmer.national_card_status == DocumentStatus.REVISION_REQUIRED
    assert swimmer.sports_insurance_status == DocumentStatus.REVISION_REQUIRED
    assert swimmer.documents_rejection_reason == reason_text
    assert swimmer.is_profile_completed is False

    # Check that notification was created for swimmer
    notif = Notification.objects.filter(recipient=swimmer_user).latest('created_at')
    assert 'نقص در مدارک هویتی شناگر' in notif.title
    assert reason_text in notif.message
    assert notif.link == '/swimmer/complete-profile'

    # 3. Approve documents
    approve_res = api_client.post(f'/api/swimmers/{swimmer.id}/review-documents/', {
        'action': 'APPROVE'
    })
    assert approve_res.status_code == 200
    swimmer.refresh_from_db()
    assert swimmer.birth_certificate_status == DocumentStatus.APPROVED
    assert swimmer.national_card_status == DocumentStatus.APPROVED
    assert swimmer.sports_insurance_status == DocumentStatus.APPROVED
    assert swimmer.documents_rejection_reason == ''
    assert swimmer.is_profile_completed is True

    # Check approval notification
    notif_appr = Notification.objects.filter(recipient=swimmer_user).latest('created_at')
    assert 'تأیید مدارک هویتی شناگر' in notif_appr.title
    assert notif_appr.link == '/swimmer/documents'


@pytest.mark.django_db
def test_remove_coach_from_course(api_client, admin_user, coach_user, swimmer_user):
    import datetime
    from apps.education.models import Course, SwimmerGroup, SkillLevel, Enrollment
    from apps.coaches.models import CoachProfile
    from django.contrib.auth import get_user_model

    User = get_user_model()
    coach2_user = User.objects.create_user(phone='09129998877', role=User.Role.COACH, first_name='مربی۲', last_name='آزمایشی')
    coach2, _ = CoachProfile.objects.get_or_create(user=coach2_user)
    coach1 = coach_user.coach_profile

    course = Course.objects.create(
        name='دوره آزمایشی شنای کرال',
        start_date=datetime.date.today(),
        end_date=datetime.date.today() + datetime.timedelta(days=30),
        base_price=1000000,
        status=Course.Status.ACTIVE
    )
    course.coaches.set([coach1, coach2])
    course.sync_coach_classes()

    assert course.coaches.count() == 2
    assert course.groups.count() == 2

    # Authenticate as admin
    api_client.force_authenticate(user=admin_user)

    # 1. Remove coach2 (who has no enrollments)
    res = api_client.patch(f'/api/education/courses/{course.id}/', {
        'coach_ids': [coach1.id]
    }, format='json')
    assert res.status_code == 200
    course.refresh_from_db()
    assert course.coaches.count() == 1
    assert list(course.coaches.values_list('id', flat=True)) == [coach1.id]
    # Coach 2's empty group should be cleaned up
    assert course.groups.count() == 1

    # 2. Add an enrollment for coach1
    group1 = course.groups.first()
    enr = Enrollment.objects.create(
        swimmer=swimmer_user.swimmer_profile,
        course=course,
        group=group1,
        coach=coach1,
        status=Enrollment.Status.ACTIVE
    )

    # 3. Removing coach1 should succeed and turn their students into "بدون مربی" (coach=None, group=None)
    res_remove = api_client.patch(f'/api/education/courses/{course.id}/', {
        'coach_ids': []
    }, format='json')
    assert res_remove.status_code == 200
    course.refresh_from_db()
    assert course.coaches.count() == 0
    assert course.groups.count() == 0

    # Verify student is now "بدون مربی"
    enr.refresh_from_db()
    assert enr.coach is None
    assert enr.group is None
    assert enr.status == Enrollment.Status.ACTIVE








