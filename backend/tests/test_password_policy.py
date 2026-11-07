import pytest
from rest_framework.test import APIClient
from rest_framework.exceptions import ValidationError as DRFValidationError
from django.core.exceptions import ValidationError as DjangoValidationError
from apps.accounts.models import User
from apps.accounts.validators import (
    validate_password_complexity,
    check_password_rules,
    IranSwimPasswordValidator
)


@pytest.fixture
def api_client():
    return APIClient()


def test_password_policy_rules_unit():
    """تست واحد توابع اعتبارسنجی سیاست رمز عبور"""
    # رمز معتبر: حروف بزرگ و کوچک، عدد، کاراکتر ویژه، فقط انگلیسی و حداقل ۸ کاراکتر
    assert len(check_password_rules('StrongPass@2026')) == 0
    assert validate_password_complexity('StrongPass@2026') == 'StrongPass@2026'

    # ۱. فاقد حرف بزرگ انگلیسی
    errors = check_password_rules('strongpass@2026')
    assert any('حرف بزرگ' in e for e in errors)
    with pytest.raises(DRFValidationError):
        validate_password_complexity('strongpass@2026')

    # ۲. فاقد حرف کوچک انگلیسی
    errors = check_password_rules('STRONGPASS@2026')
    assert any('حرف کوچک' in e for e in errors)
    with pytest.raises(DRFValidationError):
        validate_password_complexity('STRONGPASS@2026')

    # ۳. فاقد عدد
    errors = check_password_rules('StrongPass@Secret')
    assert any('عدد' in e for e in errors)
    with pytest.raises(DRFValidationError):
        validate_password_complexity('StrongPass@Secret')

    # ۴. فاقد کاراکتر ویژه (@، #، و ...)
    errors = check_password_rules('StrongPassword2026')
    assert any('کاراکتر خاص' in e or 'علامت' in e for e in errors)
    with pytest.raises(DRFValidationError):
        validate_password_complexity('StrongPassword2026')

    # ۵. شامل حروف یا اعداد فارسی (فقط باید انگلیسی باشد)
    errors = check_password_rules('StrongPass@۲۰۲۶')
    assert any('فارسی' in e or 'غیرلاتین' in e for e in errors)
    with pytest.raises(DRFValidationError):
        validate_password_complexity('StrongPass@۲۰۲۶')

    errors_persian_letter = check_password_rules('StrongPass@تست2026')
    assert any('فارسی' in e or 'غیرلاتین' in e for e in errors_persian_letter)
    with pytest.raises(DRFValidationError):
        validate_password_complexity('StrongPass@تست2026')

    # ۶. طول کمتر از ۸ کاراکتر
    errors = check_password_rules('St@1a')
    assert any('۸ کاراکتر' in e for e in errors)
    with pytest.raises(DRFValidationError):
        validate_password_complexity('St@1a')

    # ۷. دارای فاصله (space)
    errors = check_password_rules('Strong Pass@2026')
    assert any('فاصله' in e for e in errors)
    with pytest.raises(DRFValidationError):
        validate_password_complexity('Strong Pass@2026')


def test_django_standard_password_validator():
    """تست تطابق با اعتبارسنج استاندارد جنگو (AUTH_PASSWORD_VALIDATORS)"""
    validator = IranSwimPasswordValidator()

    # رمز صحیح نباید هیچ استثنایی ایجاد کند
    validator.validate('IranSwim#Secure2026')

    # رمز فاقد علامت ویژه باید استثنای جنگو ایجاد کند
    with pytest.raises(DjangoValidationError) as exc_info:
        validator.validate('InvalidPassword123')
    assert 'رمز عبور باید' in str(exc_info.value)

    # متن راهنما
    help_text = validator.get_help_text()
    assert 'حرف بزرگ' in help_text
    assert 'حرف کوچک' in help_text
    assert 'عدد' in help_text
    assert '@' in help_text


@pytest.mark.django_db
def test_change_password_api_enforces_policy(api_client):
    """تست تغییر رمز عبور در API و مسدودسازی رمزهای نامعتبر"""
    user = User.objects.create_user(
        phone='09121112233',
        password='InitialPass@123',
        first_name='کاربر',
        last_name='تستی',
        role=User.Role.SWIMMER,
        is_password_changed=True
    )
    api_client.force_authenticate(user=user)

    # تست ۱: رمز جدید بدون کاراکتر ویژه
    res_no_sym = api_client.post('/api/auth/change-password/', {
        'old_password': 'InitialPass@123',
        'new_password': 'WeakPassword123',
        'confirm_password': 'WeakPassword123',
    })
    assert res_no_sym.status_code == 400
    assert 'کاراکتر خاص' in res_no_sym.data['detail'] or 'علامت' in res_no_sym.data['detail']

    # تست ۲: رمز جدید شامل حروف فارسی
    res_fa = api_client.post('/api/auth/change-password/', {
        'old_password': 'InitialPass@123',
        'new_password': 'StrongPass@رمز123',
        'confirm_password': 'StrongPass@رمز123',
    })
    assert res_fa.status_code == 400
    assert 'فارسی' in res_fa.data['detail']

    # تست ۳: رمز کاملاً معتبر مطابق همه شرایط
    res_ok = api_client.post('/api/auth/change-password/', {
        'old_password': 'InitialPass@123',
        'new_password': 'BrandNew#StrongPass99',
        'confirm_password': 'BrandNew#StrongPass99',
    })
    assert res_ok.status_code == 200
    user.refresh_from_db()
    assert user.check_password('BrandNew#StrongPass99') is True


@pytest.mark.django_db
def test_user_creation_and_update_serializer_enforces_policy(api_client):
    """تست اعتبارسنجی رمز هنگام ایجاد کاربر توسط مدیر یا ناظر"""
    admin = User.objects.create_user(
        phone='09120000010',
        password='AdminPass@2026',
        first_name='مدیر',
        last_name='سیستم',
        role=User.Role.ADMIN,
        is_staff=True
    )
    api_client.force_authenticate(user=admin)

    # ایجاد کاربر با رمز ضعیف (بدون حرف بزرگ)
    res_fail = api_client.post('/api/auth/users/', {
        'phone': '09128889900',
        'first_name': 'شناگر',
        'last_name': 'جدید',
        'role': 'SWIMMER',
        'password': 'weakpassword@123',
        'is_active': True,
    })
    assert res_fail.status_code == 400
    assert 'password' in res_fail.data

    # ایجاد کاربر با رمز استاندارد و معتبر
    res_success = api_client.post('/api/auth/users/', {
        'phone': '09128889900',
        'first_name': 'شناگر',
        'last_name': 'جدید',
        'role': 'SWIMMER',
        'password': 'StrongPass@2026',
        'is_active': True,
    })
    assert res_success.status_code == 201
    created_user = User.objects.get(phone='09128889900')
    assert created_user.check_password('StrongPass@2026') is True
