import io
import os
import pytest
from decimal import Decimal
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.swimmers.models import SwimmerProfile, SwimmerGuardianRelation
from apps.coaches.models import CoachProfile
from apps.education.models import Course, SwimmerGroup, SkillLevel, GroupCoach, Enrollment
from django.utils import timezone
import datetime


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        phone='09121110001',
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
        phone='09121110002',
        password='SupervisorPass@2026',
        first_name='ناظر',
        last_name='فنی',
        role=User.Role.SUPERVISOR,
        is_staff=True,
        is_superuser=False
    )


@pytest.fixture
def swimmer1(db):
    user = User.objects.create_user(
        phone='09121110003',
        password='SwimmerPass@2026',
        first_name='شناگر',
        last_name='اول',
        role=User.Role.SWIMMER
    )
    # Valid JPEG image bytes (SOI marker + JFIF header)
    valid_jpg_content = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00' + b'\x00' * 100 + b'\xff\xd9'
    profile = SwimmerProfile.objects.create(
        user=user,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        national_id='0019998811',
        birth_certificate_image=SimpleUploadedFile('birth_cert.jpg', valid_jpg_content, content_type='image/jpeg'),
        national_card_image=SimpleUploadedFile('national_card.jpg', valid_jpg_content, content_type='image/jpeg'),
        sports_insurance_image=SimpleUploadedFile('bimeh.jpg', valid_jpg_content, content_type='image/jpeg')
    )
    SwimmerGuardianRelation.objects.create(
        guardian=user,
        swimmer=profile,
        relationship_type='SELF',
        is_primary=True,
        is_verified=True
    )
    return profile


@pytest.fixture
def swimmer2(db):
    user = User.objects.create_user(
        phone='09121110004',
        password='Swimmer2Pass@2026',
        first_name='شناگر',
        last_name='دوم',
        role=User.Role.SWIMMER
    )
    valid_jpg_content = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00' + b'\x00' * 100 + b'\xff\xd9'
    profile = SwimmerProfile.objects.create(
        user=user,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        national_id='0019998822',
        birth_certificate_image=SimpleUploadedFile('birth_cert_2.jpg', valid_jpg_content, content_type='image/jpeg'),
        national_card_image=SimpleUploadedFile('national_card_2.jpg', valid_jpg_content, content_type='image/jpeg'),
        sports_insurance_image=SimpleUploadedFile('bimeh_2.jpg', valid_jpg_content, content_type='image/jpeg')
    )
    SwimmerGuardianRelation.objects.create(
        guardian=user,
        swimmer=profile,
        relationship_type='SELF',
        is_primary=True,
        is_verified=True
    )
    return profile


@pytest.fixture
def coach_with_assignment(db, swimmer1):
    coach_user = User.objects.create_user(
        phone='09121110005',
        password='CoachPass@2026',
        first_name='مربی',
        last_name='تخصیص‌یافته',
        role=User.Role.COACH
    )
    coach = CoachProfile.objects.create(user=coach_user, specialties='کرال سینه')

    level = SkillLevel.objects.create(name='مقدماتی', order=1)
    course = Course.objects.create(
        name='ترم پاییز',
        start_date=timezone.now().date(),
        end_date=timezone.now().date() + datetime.timedelta(days=30),
        base_price=Decimal('1000000'),
        sessions_count=10
    )
    group = SwimmerGroup.objects.create(course=course, name='گروه ۱', skill_level=level, capacity=10)
    GroupCoach.objects.create(group=group, coach=coach, is_primary=True, assigned_from=timezone.now().date())

    Enrollment.objects.create(swimmer=swimmer1, course=course, group=group, coach=coach, status='ACTIVE')
    return coach


@pytest.fixture
def unrelated_coach(db):
    coach_user = User.objects.create_user(
        phone='09121110006',
        password='Coach2Pass@2026',
        first_name='مربی',
        last_name='غیرمرتبط',
        role=User.Role.COACH
    )
    return CoachProfile.objects.create(user=coach_user, specialties='پروانه')


# ==============================================================================
# Security Tests for Phase 1-B: Swimmer Identity Documents
# ==============================================================================

@pytest.mark.django_db
def test_anonymous_users_cannot_access_sensitive_documents(api_client, swimmer1):
    """
    آزمون امنیتی ۱: کاربر ناشناس/مهمان تحت هیچ شرایطی نمی‌تواند به مدارک هویتی دسترسی یابد (HTTP 401).
    """
    res = api_client.get(f'/api/swimmers/{swimmer1.id}/documents/birth_certificate/')
    assert res.status_code == 401


@pytest.mark.django_db
def test_swimmer_cannot_access_another_swimmer_documents_anti_idor(api_client, swimmer1, swimmer2):
    """
    آزمون امنیتی ۲: شناگر ۱ نمی‌تواند مدارک هویتی شناگر ۲ را با حدس شناسه یا دستکاری URL مشاهده کند (ضد IDOR - HTTP 403).
    """
    api_client.force_authenticate(user=swimmer1.user)

    # تلاش برای دیدن شناسنامه شناگر ۲
    res = api_client.get(f'/api/swimmers/{swimmer2.id}/documents/birth_certificate/')
    assert res.status_code == 403
    assert 'دسترسی' in res.data['detail']

    # تلاش برای دیدن کارت ملی شناگر ۲
    card_res = api_client.get(f'/api/swimmers/{swimmer2.id}/documents/national_card/')
    assert card_res.status_code == 403


@pytest.mark.django_db
def test_unrelated_coach_cannot_access_swimmer_documents(api_client, unrelated_coach, swimmer1):
    """
    آزمون امنیتی ۳: مربی که به شناگر تخصیص داده نشده، هیچ‌گونه دسترسی به مدارک وی ندارد (HTTP 403).
    """
    api_client.force_authenticate(user=unrelated_coach.user)

    res = api_client.get(f'/api/swimmers/{swimmer1.id}/documents/sports_insurance/')
    assert res.status_code == 403

    cert_res = api_client.get(f'/api/swimmers/{swimmer1.id}/documents/birth_certificate/')
    assert cert_res.status_code == 403


@pytest.mark.django_db
def test_assigned_coach_cannot_access_any_swimmer_documents(api_client, coach_with_assignment, swimmer1):
    """
    آزمون امنیتی ۴: مربی (حتی مربی تخصیص‌یافته کلاس) مجاز به مشاهده و دانلود هیچ‌یک از
    مدارک حساس شناگران (بیمه ورزشی، شناسنامه، کارت ملی) نیست (HTTP 403).
    """
    api_client.force_authenticate(user=coach_with_assignment.user)

    # ۱. بیمه ورزشی شناگر: ممنوع برای مربی (HTTP 403)
    insurance_res = api_client.get(f'/api/swimmers/{swimmer1.id}/documents/sports_insurance/')
    assert insurance_res.status_code == 403

    # ۲. شناسنامه شناگر: ممنوع (HTTP 403)
    cert_res = api_client.get(f'/api/swimmers/{swimmer1.id}/documents/birth_certificate/')
    assert cert_res.status_code == 403

    # ۳. کارت ملی شناگر: ممنوع (HTTP 403)
    card_res = api_client.get(f'/api/swimmers/{swimmer1.id}/documents/national_card/')
    assert card_res.status_code == 403


@pytest.mark.django_db
def test_admin_can_access_authorized_documents(api_client, admin_user, swimmer1):
    """
    آزمون امنیتی ۵: مدیر آموزشگاه جهت بررسی و تأیید مدارک، دسترسی مجاز به اسناد هویتی دارد (HTTP 200).
    """
    api_client.force_authenticate(user=admin_user)

    cert_res = api_client.get(f'/api/swimmers/{swimmer1.id}/documents/birth_certificate/')
    assert cert_res.status_code == 200

    card_res = api_client.get(f'/api/swimmers/{swimmer1.id}/documents/national_card/')
    assert card_res.status_code == 200

    ins_res = api_client.get(f'/api/swimmers/{swimmer1.id}/documents/sports_insurance/')
    assert ins_res.status_code == 200


@pytest.mark.django_db
def test_supervisor_has_full_read_document_access(api_client, supervisor_user, swimmer1):
    """
    آزمون امنیتی ۶: ناظر فنی سامانه (SUPERVISOR) به همراه مدیر آموزشگاه مجاز به
    مشاهده کامل کلیه مدارک هویتی و ورزشی شناگران می‌باشد (HTTP 200).
    """
    api_client.force_authenticate(user=supervisor_user)

    for doc_type in ('birth_certificate', 'national_card', 'sports_insurance'):
        res = api_client.get(f'/api/swimmers/{swimmer1.id}/documents/{doc_type}/')
        assert res.status_code == 200


@pytest.mark.django_db
def test_guessed_or_invalid_document_ids_return_safe_errors(api_client, swimmer1):
    """
    آزمون امنیتی ۷: شناسه‌های ناموجود شناگر یا انواع نامعتبر مدرک خطای ایمن ۴۰۴ بازمی‌گردانند (بدون نشت مسیر فایل).
    """
    api_client.force_authenticate(user=swimmer1.user)

    # شناگر ناموجود
    res = api_client.get('/api/swimmers/99999/documents/birth_certificate/')
    assert res.status_code == 404

    # نوع مدرک نامعتبر/تزریقی
    type_res = api_client.get(f'/api/swimmers/{swimmer1.id}/documents/invalid_secret_doc/')
    assert type_res.status_code == 404


@pytest.mark.django_db
def test_missing_unuploaded_document_returns_safe_404(api_client, admin_user, db):
    """
    آزمون امنیتی ۸: در صورتی که شناگر هنوز مدرک را بارگذاری نکرده باشد، خطای ۴۰۴ ایمن صادر می‌شود.
    """
    swimmer_without_docs = SwimmerProfile.objects.create(
        first_name='بی‌مدرک',
        last_name='تست',
        phone='09129990099'
    )
    api_client.force_authenticate(user=admin_user)

    res = api_client.get(f'/api/swimmers/{swimmer_without_docs.id}/documents/birth_certificate/')
    assert res.status_code == 404
    assert 'بارگذاری نشده' in res.data['detail']


@pytest.mark.django_db
def test_sensitive_files_are_not_exposed_through_public_media_urls(api_client):
    """
    آزمون امنیتی ۹: درخواست مستقیم به شاخه /media/swimmers/documents/ همواره باید خطای ۴۰۴ بازگرداند
    و هیچ فایلی به صورت عمومی در دسترس نخواهد بود.
    """
    res = api_client.get('/media/swimmers/documents/bimeh.jpg')
    assert res.status_code == 404


@pytest.mark.django_db
def test_sensitive_document_response_includes_required_security_headers(api_client, admin_user, swimmer1):
    """
    آزمون امنیتی ۱۰: پاسخ سند محرمانه باید دارای هدرهای امنیتی Cache-Control (no-store)،
    X-Content-Type-Options (nosniff) و Content-Disposition ایمن باشد.
    """
    api_client.force_authenticate(user=admin_user)

    res = api_client.get(f'/api/swimmers/{swimmer1.id}/documents/birth_certificate/')
    assert res.status_code == 200

    # بررسی هدرهای امنیتی
    assert res.headers.get('Cache-Control') == 'private, no-store, max-age=0'
    assert res.headers.get('X-Content-Type-Options') == 'nosniff'
    disp = res.headers.get('Content-Disposition', '')
    assert 'inline; filename=' in disp
    # اطمینان از عدم افشای ساختار دایرکتوری در نام فایل
    assert '/' not in disp.split('filename=')[1]
    assert '\\' not in disp.split('filename=')[1]


from PIL import Image


def get_valid_test_image_bytes():
    buf = io.BytesIO()
    img = Image.new('RGB', (20, 20), color='blue')
    img.save(buf, format='JPEG')
    buf.seek(0)
    return buf.read()


@pytest.mark.django_db
def test_legitimate_upload_and_download_flow_for_swimmer(api_client, swimmer1):
    """
    آزمون ۱۱: فرآیند معتبر بارگذاری فایل تصویر و دانلود امن آن توسط شناگر به درستی کار می‌کند.
    """
    api_client.force_authenticate(user=swimmer1.user)

    # بارگذاری فایل تصویر معتبر ایجادشده با PIL
    new_jpg = get_valid_test_image_bytes()
    upload_file = SimpleUploadedFile('new_bimeh.jpg', new_jpg, content_type='image/jpeg')

    patch_res = api_client.patch('/api/swimmers/me/', {
        'sports_insurance_image': upload_file
    }, format='multipart')
    assert patch_res.status_code == 200
    # سریالایزر باید آدرس اندپوینت امن برگرداند نه آدرس فیزیکی مدیا
    assert f'/api/swimmers/{swimmer1.id}/documents/sports_insurance/' in patch_res.data['sports_insurance_image']

    # دانلود موفق مدرک توسط خود شناگر
    doc_res = api_client.get(f'/api/swimmers/{swimmer1.id}/documents/sports_insurance/')
    assert doc_res.status_code == 200


@pytest.mark.django_db
def test_upload_safety_rejects_dangerous_svg_and_script_payloads(api_client, swimmer1):
    """
    آزمون ۱۲ (Upload Safety): بارگذاری فایل‌های SVG، کدهای HTML یا اسکریپت با خطای ۴۰۰ مسدود می‌شود.
    """
    api_client.force_authenticate(user=swimmer1.user)

    # تلاش ۱: بارگذاری فایل SVG
    svg_payload = b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
    svg_file = SimpleUploadedFile('fake_doc.svg', svg_payload, content_type='image/svg+xml')
    svg_res = api_client.patch('/api/swimmers/me/', {'birth_certificate_image': svg_file}, format='multipart')
    assert svg_res.status_code == 400

    # تلاش ۲: بارگذاری اسکریپت HTML تغییرنام داده شده به jpg
    fake_jpg = b'<!DOCTYPE html><html><body><script>document.cookie</script></body></html>'
    fake_file = SimpleUploadedFile('script.jpg', fake_jpg, content_type='image/jpeg')
    fake_res = api_client.patch('/api/swimmers/me/', {'birth_certificate_image': fake_file}, format='multipart')
    assert fake_res.status_code == 400

    # تلاش ۳: فایل حاوی دستکاری مسیر (Path Traversal)
    valid_jpg = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00' + b'\x00' * 50 + b'\xff\xd9'
    traversal_file = SimpleUploadedFile('../../traversal.jpg', valid_jpg, content_type='image/jpeg')
    traversal_res = api_client.patch('/api/swimmers/me/', {'birth_certificate_image': traversal_file}, format='multipart')
    assert traversal_res.status_code == 400
