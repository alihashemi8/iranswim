import pytest
from decimal import Decimal
from django.test import override_settings
from rest_framework.test import APIClient
from apps.accounts.models import User, OTPVerification
from apps.coaches.models import CoachProfile
from apps.swimmers.models import SwimmerProfile


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        phone='09120000001',
        password='AdminPassword@2026',
        first_name='مدیر',
        last_name='سامانه',
        role=User.Role.ADMIN,
        is_staff=True,
        is_superuser=True
    )


@pytest.fixture
def swimmer_user(db):
    user = User.objects.create_user(
        phone='09120000002',
        password='SwimmerPass@2026',
        first_name='شناگر',
        last_name='آزمایشی',
        role=User.Role.SWIMMER
    )
    SwimmerProfile.objects.create(
        user=user,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone
    )
    return user


@pytest.fixture
def coach_profile(db):
    coach_user = User.objects.create_user(
        phone='09120000003',
        password='CoachPass@2026',
        first_name='مربی',
        last_name='محرمانه',
        national_id='0019988776',
        role=User.Role.COACH
    )
    return CoachProfile.objects.create(
        user=coach_user,
        gender=CoachProfile.Gender.MALE,
        specialties='کرال سینه، شنای پروانه',
        bio='مربی رسمی فدراسیون شنا با ۱۰ سال سابقه تدریس',
        hourly_rate=Decimal('350000.00'),
        employment_status=CoachProfile.EmploymentStatus.ACTIVE,
        display_order=1,
        show_on_landing=True
    )


# ==============================================================================
# Vulnerability A: OTP Leakage Regression Tests
# ==============================================================================

@pytest.mark.django_db
def test_otp_response_never_contains_code_in_production(api_client):
    """
    آزمون امنیتی ۱: پاسخ درخواست OTP در محیط عملیاتی (Production)
    به هیچ عنوان نباید حاوی کد تایید یکبار مصرف باشد.
    """
    phone = '09121110001'
    with override_settings(ENVIRONMENT='production', EXPOSE_DEV_OTP=False):
        res = api_client.post('/api/auth/otp/send/', {'phone': phone, 'purpose': 'REGISTER'})
        assert res.status_code == 200
        assert 'code' not in res.data, "VULNERABILITY: OTP code leaked in production response!"
        assert 'expires_in' in res.data
        assert res.data['phone'] == phone


@pytest.mark.django_db
def test_otp_response_never_contains_code_even_if_dev_flag_attempted_in_production(api_client):
    """
    آزمون امنیتی ۲: حتی در صورت تنظیم اشتباه فلگ EXPOSE_DEV_OTP در پروداکشن،
    پاسخ نباید کد OTP را افشا کند (حفاظت چندلایه).
    """
    phone = '09121110002'
    with override_settings(ENVIRONMENT='production', EXPOSE_DEV_OTP=True):
        res = api_client.post('/api/auth/otp/send/', {'phone': phone, 'purpose': 'REGISTER'})
        assert res.status_code == 200
        assert 'code' not in res.data, "VULNERABILITY: EXPOSE_DEV_OTP was activated in production!"


@pytest.mark.django_db
def test_legitimate_otp_delivery_and_verification_workflow(api_client):
    """
    آزمون امنیتی ۳: فرآیند معتبر ارسال و تایید پیامکی OTP در پروداکشن
    با کد تولیدشده در دیتابیس با موفقیت کار می‌کند.
    """
    phone = '09121110003'
    national_id = '0019988111'
    with override_settings(ENVIRONMENT='production', EXPOSE_DEV_OTP=False):
        send_res = api_client.post('/api/auth/otp/send/', {'phone': phone, 'purpose': 'REGISTER'})
        assert send_res.status_code == 200
        assert 'code' not in send_res.data

        # دریافت ایمن کد از دیتابیس (مشابه دریافت پیامک توسط کاربر)
        otp_record = OTPVerification.objects.filter(phone=phone, is_used=False).latest('created_at')
        assert len(otp_record.code) == 6
        assert otp_record.code.isdigit()

        # ثبت‌نام با کد معتبر
        reg_res = api_client.post('/api/auth/register-otp/', {
            'phone': phone,
            'code': otp_record.code,
            'first_name': 'رضا',
            'last_name': 'امنیتی',
            'national_id': national_id
        })
        assert reg_res.status_code == 201
        assert 'access' in reg_res.data
        assert reg_res.data['user']['role'] == 'SWIMMER'

        otp_record.refresh_from_db()
        assert otp_record.is_used is True, "Used OTP must be marked as used"


# ==============================================================================
# Vulnerability B: Self-Profile Privilege Escalation Tests (/api/auth/me/)
# ==============================================================================

@pytest.mark.django_db
def test_self_profile_patch_cannot_escalate_role_or_privileges(api_client, swimmer_user):
    """
    آزمون امنیتی ۴: کاربر عادی نمی‌تواند از طریق PATCH /api/auth/me/
    نقش خود را به ADMIN, COACH یا SUPERVISOR ارتقا دهد یا is_staff / is_superuser را تغییر دهد.
    """
    api_client.force_authenticate(user=swimmer_user)

    # تلاش برای ارتقا به مدیر
    patch_res = api_client.patch('/api/auth/me/', {
        'role': 'ADMIN',
        'is_staff': True,
        'is_superuser': True
    })
    # باید رد شود یا فیلدهای غیرمجاز نادیده گرفته شوند
    swimmer_user.refresh_from_db()
    assert swimmer_user.role == User.Role.SWIMMER, "VULNERABILITY: Swimmer escalated role to ADMIN via PATCH!"
    assert swimmer_user.is_staff is False, "VULNERABILITY: is_staff was modified via PATCH!"
    assert swimmer_user.is_superuser is False, "VULNERABILITY: is_superuser was modified via PATCH!"

    # تلاش برای ارتقا به مربی
    api_client.patch('/api/auth/me/', {'role': 'COACH'})
    swimmer_user.refresh_from_db()
    assert swimmer_user.role == User.Role.SWIMMER, "VULNERABILITY: Swimmer escalated role to COACH via PATCH!"

    # تلاش برای ارتقا به ناظر
    api_client.patch('/api/auth/me/', {'role': 'SUPERVISOR'})
    swimmer_user.refresh_from_db()
    assert swimmer_user.role == User.Role.SWIMMER, "VULNERABILITY: Swimmer escalated role to SUPERVISOR via PATCH!"


@pytest.mark.django_db
def test_self_profile_put_cannot_escalate_role_or_privileges(api_client, swimmer_user):
    """
    آزمون امنیتی ۵: کاربر عادی نمی‌تواند از طریق PUT /api/auth/me/
    نقش خود یا دسترسی‌های staff/superuser را ارتقا دهد.
    """
    api_client.force_authenticate(user=swimmer_user)

    api_client.put('/api/auth/me/', {
        'first_name': 'هکر',
        'last_name': 'تست',
        'role': 'ADMIN',
        'is_staff': True,
        'is_superuser': True
    })

    swimmer_user.refresh_from_db()
    assert swimmer_user.role == User.Role.SWIMMER, "VULNERABILITY: Swimmer escalated role to ADMIN via PUT!"
    assert swimmer_user.is_staff is False
    assert swimmer_user.is_superuser is False


@pytest.mark.django_db
def test_self_profile_legitimate_updates_continue_to_work(api_client, swimmer_user):
    """
    آزمون ۶: ویرایش‌های قانونی و مجاز کاربر (نام و نام خانوادگی)
    بدون مشکل انجام شده و با پرونده شناگر همگام می‌شود.
    """
    api_client.force_authenticate(user=swimmer_user)

    res = api_client.patch('/api/auth/me/', {
        'first_name': 'نام جدید',
        'last_name': 'فامیل جدید'
    })
    assert res.status_code == 200
    assert res.data['first_name'] == 'نام جدید'
    assert res.data['last_name'] == 'فامیل جدید'
    assert res.data['role'] == 'SWIMMER'

    swimmer_user.refresh_from_db()
    assert swimmer_user.first_name == 'نام جدید'
    assert swimmer_user.last_name == 'فامیل جدید'
    assert swimmer_user.swimmer_profile.first_name == 'نام جدید'
    assert swimmer_user.swimmer_profile.last_name == 'فامیل جدید'


# ==============================================================================
# Vulnerability C: Public Registration Privilege Escalation Tests
# ==============================================================================

@pytest.mark.django_db
def test_public_registration_cannot_create_privileged_accounts(api_client):
    """
    آزمون امنیتی ۷: در ثبت‌نام عمومی (/api/auth/register/) ارسال نقش‌های ADMIN, COACH
    یا دسترسی‌های is_staff/is_superuser باید مسدود شود و صرفاً حساب SWIMMER ایجاد شود.
    """
    # تلاش ۱: ثبت‌نام به عنوان ADMIN
    admin_attempt = api_client.post('/api/auth/register/', {
        'phone': '09190001122',
        'password': 'StrongPassword@2026',
        'first_name': 'تست',
        'last_name': 'ادمین',
        'role': 'ADMIN',
        'is_staff': True,
        'is_superuser': True
    })
    # اگر ارور ولیدیشن بدهد یا اگر بسازد نقش باید SWIMMER باشد
    if admin_attempt.status_code == 201:
        created_user = User.objects.get(phone='09190001122')
        assert created_user.role == User.Role.SWIMMER, "VULNERABILITY: Public registration created ADMIN user!"
        assert created_user.is_staff is False
        assert created_user.is_superuser is False
    else:
        assert admin_attempt.status_code == 400
        assert not User.objects.filter(phone='09190001122', role='ADMIN').exists()

    # تلاش ۲: ثبت‌نام به عنوان COACH
    coach_attempt = api_client.post('/api/auth/register/', {
        'phone': '09190001133',
        'password': 'StrongPassword@2026',
        'first_name': 'تست',
        'last_name': 'مربی',
        'role': 'COACH'
    })
    if coach_attempt.status_code == 201:
        created_user = User.objects.get(phone='09190001133')
        assert created_user.role == User.Role.SWIMMER, "VULNERABILITY: Public registration created COACH user!"
    else:
        assert coach_attempt.status_code == 400
        assert not User.objects.filter(phone='09190001133', role='COACH').exists()


@pytest.mark.django_db
def test_public_registration_legitimate_swimmer_workflow(api_client):
    """
    آزمون ۸: ثبت‌نام قانونی شناگر به صورت عمومی با موفقیت کار می‌کند
    و پرونده شناگر برای وی ایجاد می‌شود.
    """
    res = api_client.post('/api/auth/register/', {
        'phone': '09190001144',
        'password': 'StrongPassword@2026',
        'first_name': 'شناگر',
        'last_name': 'عادی',
        'national_id': '0018899776'
    })
    assert res.status_code == 201
    user = User.objects.get(phone='09190001144')
    assert user.role == User.Role.SWIMMER
    assert user.is_staff is False
    assert user.is_superuser is False
    assert hasattr(user, 'swimmer_profile')
    assert user.swimmer_profile.first_name == 'شناگر'


# ==============================================================================
# Vulnerability D: Public Coach Information Disclosure Tests (/api/coaches/)
# ==============================================================================

@pytest.mark.django_db
def test_public_coach_list_does_not_expose_sensitive_pii(api_client, coach_profile):
    """
    آزمون امنیتی ۹: اندپوینت عمومی لیست مربیان (GET /api/coaches/)
    نباید اطلاعات حساس مربیان (کد ملی، شماره همراه، نرخ دستمزد ساعتی، وضعیت استخدامی) را فاش کند.
    """
    res = api_client.get('/api/coaches/')
    assert res.status_code == 200

    results = res.data.get('results', res.data) if isinstance(res.data, dict) else res.data
    assert len(results) >= 1

    for coach in results:
        # فیلدهای حساس ممنوعه در پاسخ عمومی
        assert 'national_id' not in coach, "VULNERABILITY: Coach national_id exposed in public list!"
        assert 'phone' not in coach, "VULNERABILITY: Coach phone number exposed in public list!"
        assert 'hourly_rate' not in coach, "VULNERABILITY: Coach hourly_rate exposed in public list!"
        assert 'employment_status' not in coach, "VULNERABILITY: Coach employment_status exposed in public list!"
        assert 'password' not in coach
        assert 'user' not in coach

        # فیلدهای مجاز عمومی باید حضور داشته باشند
        assert 'id' in coach
        assert 'full_name' in coach
        assert 'specialties' in coach
        assert 'gender' in coach


@pytest.mark.django_db
def test_public_coach_detail_does_not_expose_sensitive_pii(api_client, coach_profile):
    """
    آزمون امنیتی ۱۰: اندپوینت عمومی جزئیات مربی (GET /api/coaches/<id>/)
    نباید اطلاعات حساس مربی (کد ملی، شماره همراه، دستمزد ساعتی) را به کاربر مهمان فاش کند.
    """
    res = api_client.get(f'/api/coaches/{coach_profile.id}/')
    assert res.status_code == 200

    assert 'national_id' not in res.data, "VULNERABILITY: Coach national_id exposed in public detail!"
    assert 'phone' not in res.data, "VULNERABILITY: Coach phone number exposed in public detail!"
    assert 'hourly_rate' not in res.data, "VULNERABILITY: Coach hourly_rate exposed in public detail!"
    assert 'employment_status' not in res.data
    assert 'password' not in res.data
    assert 'user' not in res.data

    assert res.data['full_name'] == 'مربی محرمانه'
    assert res.data['specialties'] == 'کرال سینه، شنای پروانه'


@pytest.mark.django_db
def test_authenticated_admin_retains_full_coach_management_data(api_client, admin_user, coach_profile):
    """
    آزمون ۱۱: مدیر احرازهویت‌شده آموزشگاه همچنان به داده‌های کامل مربیان
    (شماره همراه، کد ملی، نرخ دستمزد) جهت مدیریت دسترسی دارد.
    """
    api_client.force_authenticate(user=admin_user)

    # مشاهده لیست توسط مدیر
    list_res = api_client.get('/api/coaches/')
    assert list_res.status_code == 200
    results = list_res.data.get('results', list_res.data) if isinstance(list_res.data, dict) else list_res.data
    target = next((c for c in results if c['id'] == coach_profile.id), None)
    assert target is not None
    assert 'phone' in target, "Admin must be able to view coach phone"
    assert 'national_id' in target, "Admin must be able to view coach national_id"
    assert 'hourly_rate' in target, "Admin must be able to view coach hourly_rate"
    assert target['national_id'] == '0019988776'

    # مشاهده جزئیات توسط مدیر
    detail_res = api_client.get(f'/api/coaches/{coach_profile.id}/')
    assert detail_res.status_code == 200
    assert detail_res.data['phone'] == '09120000003'
    assert detail_res.data['national_id'] == '0019988776'
    assert Decimal(str(detail_res.data['hourly_rate'])) == Decimal('350000.00')

    # ویرایش مربی توسط مدیر
    edit_res = api_client.patch(f'/api/coaches/{coach_profile.id}/', {
        'hourly_rate': '400000.00'
    })
    assert edit_res.status_code == 200
    coach_profile.refresh_from_db()
    assert coach_profile.hourly_rate == Decimal('400000.00')
