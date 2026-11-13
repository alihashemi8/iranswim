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
def supervisor_user(db):
    return User.objects.create_user(
        phone='09120000099',
        password='SupervisorPass@2026',
        first_name='ناظر',
        last_name='فنی',
        role=User.Role.SUPERVISOR,
        is_staff=True,
        is_superuser=False
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
def staff_swimmer_user(db):
    """کاربر با پرچم is_staff=True در سطح دیتابیس اما با نقش شناگر (فاقد نقش مدیریتی)"""
    return User.objects.create_user(
        phone='09120000088',
        password='StaffSwimmerPass@2026',
        first_name='کارمند',
        last_name='پذیرش',
        role=User.Role.SWIMMER,
        is_staff=True,
        is_superuser=False
    )


@pytest.fixture
def coach1_profile(db):
    coach_user = User.objects.create_user(
        phone='09120000003',
        password='CoachPass@2026',
        first_name='مربی',
        last_name='اول',
        national_id='0019988776',
        role=User.Role.COACH
    )
    return CoachProfile.objects.create(
        user=coach_user,
        gender=CoachProfile.Gender.MALE,
        coaching_degree='درجه ۱',
        bio='مربی رسمی فدراسیون شنا با ۱۰ سال سابقه تدریس',
        hourly_rate=Decimal('350000.00'),
        employment_status=CoachProfile.EmploymentStatus.ACTIVE,
        display_order=1,
        show_on_landing=True
    )


@pytest.fixture
def coach2_profile(db):
    coach_user = User.objects.create_user(
        phone='09120000004',
        password='Coach2Pass@2026',
        first_name='مربی',
        last_name='دوم',
        national_id='0019988777',
        role=User.Role.COACH
    )
    return CoachProfile.objects.create(
        user=coach_user,
        gender=CoachProfile.Gender.FEMALE,
        coaching_degree='درجه ۲',
        bio='مربی درجه یک فدراسیون با ۸ سال سابقه',
        hourly_rate=Decimal('420000.00'),
        employment_status=CoachProfile.EmploymentStatus.ACTIVE,
        display_order=2,
        show_on_landing=True
    )


# ==============================================================================
# Vulnerability A: OTP Leakage Regression & Multi-Layer Environment Tests
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
def test_otp_response_never_contains_code_with_conflicting_debug_flag_in_production(api_client):
    """
    آزمون امنیتی ۳: در صورتی که در پروداکشن پرچم DEBUG یا EXPOSE فعال شده باشد،
    شرط صریح ENVIRONMENT='production' باید اولویت کامل داشته و مانع افشای کد شود.
    """
    phone = '09121110099'
    with override_settings(ENVIRONMENT='production', DEBUG=True, EXPOSE_DEV_OTP=True):
        res = api_client.post('/api/auth/otp/send/', {'phone': phone, 'purpose': 'REGISTER'})
        assert res.status_code == 200
        assert 'code' not in res.data, "VULNERABILITY: Code leaked during conflicting production debug flags!"


@pytest.mark.django_db
def test_legitimate_otp_delivery_and_verification_workflow(api_client):
    """
    آزمون ۴: فرآیند معتبر ارسال و تایید پیامکی OTP در پروداکشن
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
        assert len(otp_record.code) == 5
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
    آزمون امنیتی ۵: کاربر عادی نمی‌تواند از طریق PATCH /api/auth/me/
    نقش خود را به ADMIN, COACH یا SUPERVISOR ارتقا دهد یا is_staff / is_superuser را تغییر دهد.
    """
    api_client.force_authenticate(user=swimmer_user)

    # تلاش برای ارتقا به مدیر
    patch_res = api_client.patch('/api/auth/me/', {
        'role': 'ADMIN',
        'is_staff': True,
        'is_superuser': True
    })
    assert patch_res.status_code == 400
    swimmer_user.refresh_from_db()
    assert swimmer_user.role == User.Role.SWIMMER, "VULNERABILITY: Swimmer escalated role to ADMIN via PATCH!"
    assert swimmer_user.is_staff is False, "VULNERABILITY: is_staff was modified via PATCH!"
    assert swimmer_user.is_superuser is False, "VULNERABILITY: is_superuser was modified via PATCH!"

    # تلاش برای ارتقا به مربی
    coach_res = api_client.patch('/api/auth/me/', {'role': 'COACH'})
    assert coach_res.status_code == 400
    swimmer_user.refresh_from_db()
    assert swimmer_user.role == User.Role.SWIMMER, "VULNERABILITY: Swimmer escalated role to COACH via PATCH!"

    # تلاش برای ارتقا به ناظر
    super_res = api_client.patch('/api/auth/me/', {'role': 'SUPERVISOR'})
    assert super_res.status_code == 400
    swimmer_user.refresh_from_db()
    assert swimmer_user.role == User.Role.SWIMMER, "VULNERABILITY: Swimmer escalated role to SUPERVISOR via PATCH!"


@pytest.mark.django_db
def test_self_profile_put_cannot_escalate_role_or_privileges(api_client, swimmer_user):
    """
    آزمون امنیتی ۶: کاربر عادی نمی‌تواند از طریق PUT /api/auth/me/
    نقش خود یا دسترسی‌های staff/superuser را ارتقا دهد.
    """
    api_client.force_authenticate(user=swimmer_user)

    put_res = api_client.put('/api/auth/me/', {
        'first_name': 'هکر',
        'last_name': 'تست',
        'role': 'ADMIN',
        'is_staff': True,
        'is_superuser': True
    })
    assert put_res.status_code == 400
    swimmer_user.refresh_from_db()
    assert swimmer_user.role == User.Role.SWIMMER, "VULNERABILITY: Swimmer escalated role to ADMIN via PUT!"
    assert swimmer_user.is_staff is False
    assert swimmer_user.is_superuser is False


@pytest.mark.django_db
def test_self_profile_legitimate_updates_continue_to_work(api_client, swimmer_user):
    """
    آزمون ۷: ویرایش‌های قانونی و مجاز کاربر (نام و نام خانوادگی)
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
def test_public_registration_with_admin_role_must_return_http_400(api_client):
    """
    آزمون امنیتی ۸: ارسال role=ADMIN در ثبت‌نام عمومی باید با خطای قطعی HTTP 400 مسدود شود
    و هیچ حسابی در دیتابیس ساخته نشود.
    """
    admin_attempt = api_client.post('/api/auth/register/', {
        'phone': '09190001122',
        'password': 'StrongPassword@2026',
        'first_name': 'تست',
        'last_name': 'ادمین',
        'role': 'ADMIN',
        'is_staff': True,
        'is_superuser': True
    })
    assert admin_attempt.status_code == 400, "VULNERABILITY: Public registration with role=ADMIN did not return HTTP 400!"
    assert 'role' in admin_attempt.data
    assert not User.objects.filter(phone='09190001122').exists(), "VULNERABILITY: User was persisted despite privileged role submission!"


@pytest.mark.django_db
def test_public_registration_with_coach_role_must_return_http_400(api_client):
    """
    آزمون امنیتی ۹: ارسال role=COACH در ثبت‌نام عمومی باید با خطای قطعی HTTP 400 مسدود شود
    و هیچ حسابی در دیتابیس ساخته نشود.
    """
    coach_attempt = api_client.post('/api/auth/register/', {
        'phone': '09190001133',
        'password': 'StrongPassword@2026',
        'first_name': 'تست',
        'last_name': 'مربی',
        'role': 'COACH'
    })
    assert coach_attempt.status_code == 400, "VULNERABILITY: Public registration with role=COACH did not return HTTP 400!"
    assert 'role' in coach_attempt.data
    assert not User.objects.filter(phone='09190001133').exists(), "VULNERABILITY: User was persisted despite privileged coach role submission!"


@pytest.mark.django_db
def test_public_registration_with_staff_or_superuser_without_role_never_elevates_privileges(api_client):
    """
    آزمون امنیتی ۱۰: ثبت‌نام با فیلدهای is_staff=True و is_superuser=True بدون ارسال فیلد role
    هرگز نباید دسترسی ویژه ایجاد کند و در دیتابیس صرفاً کاربر عادی شناگر با دسترسی‌های False ثبت می‌شود.
    """
    res = api_client.post('/api/auth/register/', {
        'phone': '09190001199',
        'password': 'StrongPassword@2026',
        'first_name': 'تست',
        'last_name': 'استف',
        'is_staff': True,
        'is_superuser': True
    })
    # چه ارور ۴۰۰ بدهد و چه حساب شناگر بسازد، در دیتابیس نباید دسترسی ادمین وجود داشته باشد
    user = User.objects.filter(phone='09190001199').first()
    if user:
        assert user.role == User.Role.SWIMMER, "VULNERABILITY: User was assigned privileged role!"
        assert user.is_staff is False, "VULNERABILITY: is_staff was persisted as True!"
        assert user.is_superuser is False, "VULNERABILITY: is_superuser was persisted as True!"


@pytest.mark.django_db
def test_public_registration_legitimate_swimmer_workflow(api_client):
    """
    آزمون ۱۱: ثبت‌نام قانونی شناگر به صورت عمومی با موفقیت کار می‌کند
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
# Vulnerability D: Coach PII Authorization & Access Control Tests
# ==============================================================================

@pytest.mark.django_db
def test_public_unauthenticated_coach_list_and_detail_do_not_expose_sensitive_pii(api_client, coach1_profile):
    """
    آزمون امنیتی ۱۲: کاربران مهمان (مهمان/ناشناس) نباید در لیست یا جزئیات مربی
    به فیلدهای حساس (کد ملی، شماره همراه، نرخ دستمزد ساعتی، وضعیت استخدامی) دسترسی داشته باشند.
    """
    # بررسی لیست عمومی
    list_res = api_client.get('/api/coaches/')
    assert list_res.status_code == 200
    results = list_res.data.get('results', list_res.data) if isinstance(list_res.data, dict) else list_res.data
    assert len(results) >= 1
    for coach in results:
        assert 'national_id' not in coach
        assert 'phone' not in coach
        assert 'hourly_rate' not in coach
        assert 'employment_status' not in coach

    # بررسی جزئیات عمومی
    detail_res = api_client.get(f'/api/coaches/{coach1_profile.id}/')
    assert detail_res.status_code == 200
    assert 'national_id' not in detail_res.data
    assert 'phone' not in detail_res.data
    assert 'hourly_rate' not in detail_res.data
    assert 'employment_status' not in detail_res.data
    assert detail_res.data['full_name'] == 'مربی اول'


@pytest.mark.django_db
def test_authenticated_swimmer_cannot_access_private_coach_fields(api_client, swimmer_user, coach1_profile):
    """
    آزمون امنیتی ۱۳: کاربر احرازهویت‌شده با نقش شناگر (SWIMMER)
    نباید به فیلدهای محرمانه مربیان در اندپوینت لیست یا جزئیات دسترسی پیدا کند.
    """
    api_client.force_authenticate(user=swimmer_user)

    # لیست مربیان
    list_res = api_client.get('/api/coaches/')
    assert list_res.status_code == 200
    results = list_res.data.get('results', list_res.data) if isinstance(list_res.data, dict) else list_res.data
    for coach in results:
        assert 'national_id' not in coach, "VULNERABILITY: Swimmer saw coach national_id in list!"
        assert 'phone' not in coach, "VULNERABILITY: Swimmer saw coach phone in list!"
        assert 'hourly_rate' not in coach, "VULNERABILITY: Swimmer saw coach hourly_rate in list!"
        assert 'employment_status' not in coach

    # جزئیات مربی
    detail_res = api_client.get(f'/api/coaches/{coach1_profile.id}/')
    assert detail_res.status_code == 200
    assert 'national_id' not in detail_res.data, "VULNERABILITY: Swimmer saw coach national_id in detail!"
    assert 'phone' not in detail_res.data, "VULNERABILITY: Swimmer saw coach phone in detail!"
    assert 'hourly_rate' not in detail_res.data, "VULNERABILITY: Swimmer saw coach hourly_rate in detail!"
    assert 'employment_status' not in detail_res.data


@pytest.mark.django_db
def test_coach_cannot_access_another_coach_private_information(api_client, coach1_profile, coach2_profile):
    """
    آزمون امنیتی ۱۴: مربی الف تحت هیچ شرایطی نباید بتواند اطلاعات هویتی و مالی مربی ب
    (کد ملی، شماره همراه، نرخ دستمزد و وضعیت استخدام) را در لیست یا صفحه جزئیات مشاهده کند.
    """
    # لاگین به عنوان مربی ۱
    api_client.force_authenticate(user=coach1_profile.user)

    # استعلام لیست مربیان: برای مربی نیز لیست باید کاملاً عمومی باشد
    list_res = api_client.get('/api/coaches/')
    assert list_res.status_code == 200
    results = list_res.data.get('results', list_res.data) if isinstance(list_res.data, dict) else list_res.data
    for coach in results:
        assert 'national_id' not in coach, "VULNERABILITY: Coach saw national_id in coach list!"
        assert 'phone' not in coach, "VULNERABILITY: Coach saw phone in coach list!"
        assert 'hourly_rate' not in coach, "VULNERABILITY: Coach saw hourly_rate in coach list!"
        assert 'employment_status' not in coach

    # استعلام جزئیات مربی ۲ توسط مربی ۱
    detail_res = api_client.get(f'/api/coaches/{coach2_profile.id}/')
    assert detail_res.status_code == 200
    assert 'national_id' not in detail_res.data, "VULNERABILITY: Coach 1 accessed Coach 2 national_id!"
    assert 'phone' not in detail_res.data, "VULNERABILITY: Coach 1 accessed Coach 2 phone number!"
    assert 'hourly_rate' not in detail_res.data, "VULNERABILITY: Coach 1 accessed Coach 2 hourly_rate!"
    assert 'employment_status' not in detail_res.data
    assert detail_res.data['full_name'] == 'مربی دوم'


@pytest.mark.django_db
def test_coach_can_access_own_private_dossier(api_client, coach1_profile):
    """
    آزمون امنیتی ۱۵: مربی در هنگام مشاهده جزئیات پروفایل شخصی خود در اندپوینت /api/coaches/<own_id>/
    باید بتواند پرونده و اطلاعات خصوصی خود (تلفن، کد ملی، نرخ دستمزد) را مشاهده کند.
    """
    api_client.force_authenticate(user=coach1_profile.user)

    detail_res = api_client.get(f'/api/coaches/{coach1_profile.id}/')
    assert detail_res.status_code == 200
    assert 'national_id' in detail_res.data, "Coach should be able to view their own national_id"
    assert 'phone' in detail_res.data, "Coach should be able to view their own phone"
    assert 'hourly_rate' in detail_res.data, "Coach should be able to view their own hourly_rate"
    assert detail_res.data['national_id'] == coach1_profile.user.national_id
    assert detail_res.data['phone'] == coach1_profile.user.phone
    assert Decimal(str(detail_res.data['hourly_rate'])) == coach1_profile.hourly_rate
    assert detail_res.data['employment_status'] == coach1_profile.employment_status


@pytest.mark.django_db
def test_staff_user_without_management_role_cannot_access_private_coach_fields(api_client, staff_swimmer_user, coach1_profile):
    """
    آزمون امنیتی ۱۶: کاربری که پرچم is_staff=True دارد اما نقش وی ADMIN یا SUPERVISOR نیست
    نباید به هیچ عنوان به اطلاعات محرمانه مربیان دسترسی یابد.
    """
    api_client.force_authenticate(user=staff_swimmer_user)

    # بررسی لیست
    list_res = api_client.get('/api/coaches/')
    assert list_res.status_code == 200
    results = list_res.data.get('results', list_res.data) if isinstance(list_res.data, dict) else list_res.data
    for coach in results:
        assert 'national_id' not in coach, "VULNERABILITY: Non-manager staff saw coach national_id in list!"
        assert 'phone' not in coach, "VULNERABILITY: Non-manager staff saw coach phone in list!"
        assert 'hourly_rate' not in coach, "VULNERABILITY: Non-manager staff saw coach hourly_rate in list!"
        assert 'employment_status' not in coach

    # بررسی جزئیات
    detail_res = api_client.get(f'/api/coaches/{coach1_profile.id}/')
    assert detail_res.status_code == 200
    assert 'national_id' not in detail_res.data, "VULNERABILITY: Non-manager staff saw coach national_id in detail!"
    assert 'phone' not in detail_res.data, "VULNERABILITY: Non-manager staff saw coach phone in detail!"
    assert 'hourly_rate' not in detail_res.data, "VULNERABILITY: Non-manager staff saw coach hourly_rate in detail!"
    assert 'employment_status' not in detail_res.data


@pytest.mark.django_db
def test_authorized_admin_and_supervisor_retain_full_coach_management_data(api_client, admin_user, supervisor_user, coach1_profile):
    """
    آزمون ۱۷: مدیر آموزشگاه و ناظر فنی سامانه به اطلاعات کامل مربیان دسترسی مدیریتی دارند.
    """
    # ۱. دسترسی مدیر آموزشگاه
    api_client.force_authenticate(user=admin_user)

    list_res = api_client.get('/api/coaches/')
    assert list_res.status_code == 200
    results = list_res.data.get('results', list_res.data) if isinstance(list_res.data, dict) else list_res.data
    target = next((c for c in results if c['id'] == coach1_profile.id), None)
    assert target is not None
    assert 'phone' in target
    assert 'national_id' in target
    assert 'hourly_rate' in target

    detail_res = api_client.get(f'/api/coaches/{coach1_profile.id}/')
    assert detail_res.status_code == 200
    assert detail_res.data['phone'] == coach1_profile.user.phone
    assert detail_res.data['national_id'] == coach1_profile.user.national_id
    assert Decimal(str(detail_res.data['hourly_rate'])) == coach1_profile.hourly_rate

    # ویرایش مربی توسط مدیر
    edit_res = api_client.patch(f'/api/coaches/{coach1_profile.id}/', {
        'hourly_rate': '400000.00'
    })
    assert edit_res.status_code == 200
    coach1_profile.refresh_from_db()
    assert coach1_profile.hourly_rate == Decimal('400000.00')

    # ۲. دسترسی ناظر فنی سامانه (SUPERVISOR)
    api_client.force_authenticate(user=supervisor_user)

    sup_list_res = api_client.get('/api/coaches/')
    assert sup_list_res.status_code == 200
    sup_results = sup_list_res.data.get('results', sup_list_res.data) if isinstance(sup_list_res.data, dict) else sup_list_res.data
    sup_target = next((c for c in sup_results if c['id'] == coach1_profile.id), None)
    assert sup_target is not None
    assert 'phone' in sup_target
    assert 'national_id' in sup_target
    assert 'hourly_rate' in sup_target
