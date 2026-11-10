import io
import os
import sys
import datetime
import pytest
from decimal import Decimal
from importlib import reload
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ImproperlyConfigured
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework.exceptions import ValidationError

from apps.accounts.models import User
from apps.swimmers.models import SwimmerProfile, SwimmerGuardianRelation
from apps.swimmers.views import get_accessible_swimmer_profile
from apps.swimmers.validators import validate_document_file, ALLOWED_DOCUMENT_EXTENSIONS
from apps.coaches.models import CoachProfile
from apps.education.models import Course, SwimmerGroup, SkillLevel, GroupCoach, Enrollment


@pytest.fixture
def api_client():
    return APIClient()


def get_valid_jpeg_bytes():
    buf = io.BytesIO()
    img = Image.new('RGB', (20, 20), color='green')
    img.save(buf, format='JPEG')
    buf.seek(0)
    return buf.read()


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        phone='09120010001',
        password='AdminPassword@2026',
        first_name='مدیر',
        last_name='سامانه',
        role=User.Role.ADMIN,
        is_staff=True,
        is_superuser=True
    )


@pytest.fixture
def child_swimmer(db):
    user = User.objects.create_user(
        phone='09120010002',
        password='SwimmerPass@2026',
        first_name='علی',
        last_name='فرزند',
        role=User.Role.SWIMMER
    )
    jpg_bytes = get_valid_jpeg_bytes()
    profile = SwimmerProfile.objects.create(
        user=user,
        first_name='علی',
        last_name='فرزند',
        phone='09120010002',
        national_id='0012345678',
        birth_certificate_image=SimpleUploadedFile('birth_cert.jpg', jpg_bytes, content_type='image/jpeg'),
        national_card_image=SimpleUploadedFile('national_card.jpg', jpg_bytes, content_type='image/jpeg'),
        sports_insurance_image=SimpleUploadedFile('bimeh.jpg', jpg_bytes, content_type='image/jpeg')
    )
    return profile


@pytest.fixture
def other_swimmer(db):
    user = User.objects.create_user(
        phone='09120010003',
        password='Swimmer2Pass@2026',
        first_name='رضا',
        last_name='دیگر',
        role=User.Role.SWIMMER
    )
    jpg_bytes = get_valid_jpeg_bytes()
    profile = SwimmerProfile.objects.create(
        user=user,
        first_name='رضا',
        last_name='دیگر',
        phone='09120010003',
        national_id='0012345679',
        birth_certificate_image=SimpleUploadedFile('birth_cert2.jpg', jpg_bytes, content_type='image/jpeg'),
        national_card_image=SimpleUploadedFile('national_card2.jpg', jpg_bytes, content_type='image/jpeg'),
        sports_insurance_image=SimpleUploadedFile('bimeh2.jpg', jpg_bytes, content_type='image/jpeg')
    )
    return profile


@pytest.fixture
def guardian_user(db):
    return User.objects.create_user(
        phone='09120010004',
        password='GuardianPass@2026',
        first_name='والد',
        last_name='سرپرست',
        role=User.Role.SWIMMER
    )


@pytest.fixture
def active_coach(db):
    coach_user = User.objects.create_user(
        phone='09120010005',
        password='CoachPass@2026',
        first_name='مربی',
        last_name='فعال',
        role=User.Role.COACH
    )
    return CoachProfile.objects.create(user=coach_user, specialties='کرال سینه')


@pytest.fixture
def expired_coach(db):
    coach_user = User.objects.create_user(
        phone='09120010006',
        password='ExpiredCoachPass@2026',
        first_name='مربی',
        last_name='منقضی',
        role=User.Role.COACH
    )
    return CoachProfile.objects.create(user=coach_user, specialties='کرال پشت')


# --------------------------------------------------------------------------
# 1. SECRET_KEY Fail-Fast Matrix Tests
# --------------------------------------------------------------------------

def test_production_secret_key_fail_fast_on_missing_or_insecure():
    """
    CRITICAL: Verify production startup raises ImproperlyConfigured when:
    - DJANGO_SECRET_KEY is missing
    - DJANGO_SECRET_KEY is empty / whitespace
    - DJANGO_SECRET_KEY is a known placeholder
    - DJANGO_SECRET_KEY starts with 'django-insecure-'
    """
    insecure_keys = [
        '',
        '   ',
        'django-insecure-iranswim-platform-super-secret-production-key-2026',
        'iranswim-production-secure-key-2026',
        'changeme',
        'django-insecure-custom-key',
    ]

    if 'backend' not in sys.path:
        sys.path.insert(0, 'backend')

    try:
        for bad_key in insecure_keys:
            os.environ['DJANGO_ENV'] = 'production'
            os.environ['DJANGO_DEBUG'] = 'False'
            os.environ['DJANGO_SECRET_KEY'] = bad_key

            with pytest.raises(ImproperlyConfigured) as exc_info:
                if 'config.settings' in sys.modules:
                    reload(sys.modules['config.settings'])
                else:
                    import config.settings
            assert 'DJANGO_SECRET_KEY must be explicitly configured' in str(exc_info.value)

        # Also test completely unset DJANGO_SECRET_KEY
        os.environ['DJANGO_ENV'] = 'production'
        os.environ['DJANGO_DEBUG'] = 'False'
        os.environ.pop('DJANGO_SECRET_KEY', None)
        with pytest.raises(ImproperlyConfigured):
            if 'config.settings' in sys.modules:
                reload(sys.modules['config.settings'])
            else:
                import config.settings

    finally:
        # Reset environment back to development/test state
        os.environ['DJANGO_ENV'] = 'development'
        os.environ['DJANGO_DEBUG'] = 'True'
        os.environ['DJANGO_SECRET_KEY'] = 'django-insecure-test-environment-key'
        if 'config.settings' in sys.modules:
            reload(sys.modules['config.settings'])


def test_production_secret_key_success_with_strong_key():
    """
    Verify production startup succeeds when a strong, unique secret key is provided.
    """
    try:
        os.environ['DJANGO_ENV'] = 'production'
        os.environ['DJANGO_DEBUG'] = 'False'
        os.environ['DJANGO_SECRET_KEY'] = 'sUpEr-sTrOnG-pRoDuCtIoN-kEy-998877665544332211!!'

        if 'config.settings' in sys.modules:
            settings_mod = reload(sys.modules['config.settings'])
        else:
            import config.settings as settings_mod

        assert settings_mod.SECRET_KEY == 'sUpEr-sTrOnG-pRoDuCtIoN-kEy-998877665544332211!!'
    finally:
        os.environ['DJANGO_ENV'] = 'development'
        os.environ['DJANGO_DEBUG'] = 'True'
        os.environ['DJANGO_SECRET_KEY'] = 'django-insecure-test-environment-key'
        if 'config.settings' in sys.modules:
            reload(sys.modules['config.settings'])


def test_development_mode_fallback_secret_key():
    """
    Verify development environment (DEBUG=True) allows starting with fallback dev key
    without raising ImproperlyConfigured.
    """
    try:
        os.environ['DJANGO_ENV'] = 'development'
        os.environ['DJANGO_DEBUG'] = 'True'
        os.environ.pop('DJANGO_SECRET_KEY', None)

        if 'config.settings' in sys.modules:
            settings_mod = reload(sys.modules['config.settings'])
        else:
            import config.settings as settings_mod

        assert settings_mod.SECRET_KEY == 'django-insecure-iranswim-dev-local-only-key'
    finally:
        os.environ['DJANGO_ENV'] = 'development'
        os.environ['DJANGO_DEBUG'] = 'True'
        os.environ['DJANGO_SECRET_KEY'] = 'django-insecure-test-environment-key'
        if 'config.settings' in sys.modules:
            reload(sys.modules['config.settings'])


# --------------------------------------------------------------------------
# 2. Guardian Verification Status & Anti-IDOR Tests
# --------------------------------------------------------------------------

@pytest.mark.django_db
def test_verified_guardian_can_access_child_documents(api_client, guardian_user, child_swimmer):
    """
    HIGH: A guardian with is_verified=True CAN access and download their child's sensitive documents.
    """
    SwimmerGuardianRelation.objects.create(
        guardian=guardian_user,
        swimmer=child_swimmer,
        relationship_type='FATHER',
        is_primary=True,
        is_verified=True
    )
    api_client.force_authenticate(user=guardian_user)

    res = api_client.get(f'/api/swimmers/{child_swimmer.id}/documents/birth_certificate/')
    assert res.status_code == 200

    ins_res = api_client.get(f'/api/swimmers/{child_swimmer.id}/documents/sports_insurance/')
    assert ins_res.status_code == 200


@pytest.mark.django_db
def test_unverified_guardian_cannot_access_child_documents(api_client, guardian_user, child_swimmer):
    """
    HIGH: An unverified guardian (is_verified=False) MUST receive HTTP 403 Forbidden.
    """
    SwimmerGuardianRelation.objects.create(
        guardian=guardian_user,
        swimmer=child_swimmer,
        relationship_type='FATHER',
        is_primary=False,
        is_verified=False  # Unverified!
    )
    api_client.force_authenticate(user=guardian_user)

    res = api_client.get(f'/api/swimmers/{child_swimmer.id}/documents/birth_certificate/')
    assert res.status_code == 403
    assert 'دسترسی لازم' in res.data['detail']

    card_res = api_client.get(f'/api/swimmers/{child_swimmer.id}/documents/national_card/')
    assert card_res.status_code == 403


@pytest.mark.django_db
def test_unverified_guardian_cannot_access_profile_via_helper(guardian_user, child_swimmer):
    """
    HIGH: get_accessible_swimmer_profile helper strictly respects is_verified=True.
    """
    SwimmerGuardianRelation.objects.create(
        guardian=guardian_user,
        swimmer=child_swimmer,
        relationship_type='FATHER',
        is_primary=False,
        is_verified=False
    )
    # Direct swimmer_id check
    profile = get_accessible_swimmer_profile(guardian_user, swimmer_id=child_swimmer.id)
    # It must NOT return child_swimmer because relation is unverified
    assert profile != child_swimmer


@pytest.mark.django_db
def test_guardian_cannot_access_unrelated_child_document_anti_idor(api_client, guardian_user, child_swimmer, other_swimmer):
    """
    HIGH: Guardian of child_swimmer attempting to access other_swimmer's documents receives 403 Forbidden.
    """
    SwimmerGuardianRelation.objects.create(
        guardian=guardian_user,
        swimmer=child_swimmer,
        relationship_type='MOTHER',
        is_primary=True,
        is_verified=True
    )
    api_client.force_authenticate(user=guardian_user)

    res = api_client.get(f'/api/swimmers/{other_swimmer.id}/documents/birth_certificate/')
    assert res.status_code == 403


# --------------------------------------------------------------------------
# 3. Coach Assignment Expiration & Scope Tests
# --------------------------------------------------------------------------

@pytest.mark.django_db
def test_active_coach_cannot_access_any_swimmer_documents(api_client, child_swimmer, active_coach):
    """
    Privacy Policy: Even an active coach assigned to a swimmer's group cannot view or download
    any swimmer documents (sports insurance, national card, birth certificate).
    """
    level = SkillLevel.objects.create(name='مقدماتی 1', order=1)
    course = Course.objects.create(
        name='دوره فعال',
        start_date=timezone.now().date(),
        end_date=timezone.now().date() + datetime.timedelta(days=30),
        base_price=Decimal('1000000'),
        sessions_count=10
    )
    group = SwimmerGroup.objects.create(course=course, name='گروه ۱', skill_level=level, capacity=10)

    # Active assignment: assigned_to is None
    GroupCoach.objects.create(
        group=group,
        coach=active_coach,
        is_primary=True,
        assigned_from=timezone.now().date(),
        assigned_to=None
    )
    Enrollment.objects.create(swimmer=child_swimmer, course=course, group=group, status='ACTIVE')

    api_client.force_authenticate(user=active_coach.user)

    for doc_type in ('sports_insurance', 'national_card', 'birth_certificate'):
        res = api_client.get(f'/api/swimmers/{child_swimmer.id}/documents/{doc_type}/')
        assert res.status_code == 403


@pytest.mark.django_db
def test_expired_coach_assignment_cannot_access_swimmer_sports_insurance(api_client, child_swimmer, expired_coach):
    """
    LOW: A coach whose assignment has expired (assigned_to < today) receives HTTP 403 Forbidden.
    """
    level = SkillLevel.objects.create(name='مقدماتی 2', order=2)
    course = Course.objects.create(
        name='دوره منقضی',
        start_date=timezone.now().date() - datetime.timedelta(days=60),
        end_date=timezone.now().date() - datetime.timedelta(days=1),
        base_price=Decimal('1000000'),
        sessions_count=10
    )
    group = SwimmerGroup.objects.create(course=course, name='گروه منقضی', skill_level=level, capacity=10)

    yesterday = timezone.now().date() - datetime.timedelta(days=1)
    past_start = yesterday - datetime.timedelta(days=30)
    GroupCoach.objects.create(
        group=group,
        coach=expired_coach,
        is_primary=True,
        assigned_from=past_start,
        assigned_to=yesterday
    )
    Enrollment.objects.create(swimmer=child_swimmer, course=course, group=group, status='ACTIVE')

    api_client.force_authenticate(user=expired_coach.user)

    # Expired coach must receive 403 Forbidden
    res = api_client.get(f'/api/swimmers/{child_swimmer.id}/documents/sports_insurance/')
    assert res.status_code == 403
    assert 'دسترسی لازم' in res.data['detail']


@pytest.mark.django_db
def test_expired_coach_with_historical_completed_session_is_denied(api_client, child_swimmer, expired_coach):
    """
    2. Expired coach with a historical COMPLETED session must be denied (HTTP 403).
    """
    from apps.scheduling.models import ClassSession

    level = SkillLevel.objects.create(name='مقدماتی 3a', order=3)
    course = Course.objects.create(
        name='دوره تاریخی 1',
        start_date=timezone.now().date() - datetime.timedelta(days=60),
        end_date=timezone.now().date() + datetime.timedelta(days=30),
        base_price=Decimal('1000000'),
        sessions_count=10
    )
    group = SwimmerGroup.objects.create(course=course, name='گروه تاریخی 1', skill_level=level, capacity=10)

    past_end = timezone.now().date() - datetime.timedelta(days=10)
    past_start = past_end - datetime.timedelta(days=30)
    GroupCoach.objects.create(
        group=group,
        coach=expired_coach,
        is_primary=True,
        assigned_from=past_start,
        assigned_to=past_end
    )
    Enrollment.objects.create(swimmer=child_swimmer, course=course, group=group, status='ACTIVE')

    # Historical COMPLETED session
    ClassSession.objects.create(
        group=group,
        coach=expired_coach,
        session_date=past_start + datetime.timedelta(days=5),
        start_time=datetime.time(10, 0),
        end_time=datetime.time(11, 0),
        status=ClassSession.Status.COMPLETED
    )

    api_client.force_authenticate(user=expired_coach.user)

    res = api_client.get(f'/api/swimmers/{child_swimmer.id}/documents/sports_insurance/')
    assert res.status_code == 403
    assert 'دسترسی لازم' in res.data['detail']


@pytest.mark.django_db
def test_expired_coach_with_historical_cancelled_session_is_denied(api_client, child_swimmer, expired_coach):
    """
    3. Expired coach with a historical CANCELLED session must be denied (HTTP 403).
    """
    from apps.scheduling.models import ClassSession

    level = SkillLevel.objects.create(name='مقدماتی 3b', order=3)
    course = Course.objects.create(
        name='دوره تاریخی 2',
        start_date=timezone.now().date() - datetime.timedelta(days=60),
        end_date=timezone.now().date() + datetime.timedelta(days=30),
        base_price=Decimal('1000000'),
        sessions_count=10
    )
    group = SwimmerGroup.objects.create(course=course, name='گروه تاریخی 2', skill_level=level, capacity=10)

    past_end = timezone.now().date() - datetime.timedelta(days=5)
    past_start = past_end - datetime.timedelta(days=20)
    GroupCoach.objects.create(
        group=group,
        coach=expired_coach,
        is_primary=True,
        assigned_from=past_start,
        assigned_to=past_end
    )
    Enrollment.objects.create(swimmer=child_swimmer, course=course, group=group, status='ACTIVE')

    # Historical CANCELLED session
    ClassSession.objects.create(
        group=group,
        coach=expired_coach,
        session_date=past_start + datetime.timedelta(days=2),
        start_time=datetime.time(14, 0),
        end_time=datetime.time(15, 30),
        status=ClassSession.Status.CANCELLED,
        cancellation_reason='تعطیلی عمومی استخر'
    )

    api_client.force_authenticate(user=expired_coach.user)

    res = api_client.get(f'/api/swimmers/{child_swimmer.id}/documents/sports_insurance/')
    assert res.status_code == 403
    assert 'دسترسی لازم' in res.data['detail']


@pytest.mark.django_db
def test_expired_coach_with_future_scheduled_session_is_denied(api_client, child_swimmer, expired_coach):
    """
    4. Expired coach with a future scheduled session without active GroupCoach assignment is denied (HTTP 403).
    """
    from apps.scheduling.models import ClassSession

    level = SkillLevel.objects.create(name='مقدماتی 3c', order=3)
    course = Course.objects.create(
        name='دوره آینده',
        start_date=timezone.now().date() - datetime.timedelta(days=60),
        end_date=timezone.now().date() + datetime.timedelta(days=60),
        base_price=Decimal('1000000'),
        sessions_count=10
    )
    group = SwimmerGroup.objects.create(course=course, name='گروه آینده', skill_level=level, capacity=10)

    yesterday = timezone.now().date() - datetime.timedelta(days=1)
    past_start = yesterday - datetime.timedelta(days=30)
    GroupCoach.objects.create(
        group=group,
        coach=expired_coach,
        is_primary=True,
        assigned_from=past_start,
        assigned_to=yesterday
    )
    Enrollment.objects.create(swimmer=child_swimmer, course=course, group=group, status='ACTIVE')

    # Future session scheduled 5 days from now
    future_date = timezone.now().date() + datetime.timedelta(days=5)
    ClassSession.objects.create(
        group=group,
        coach=expired_coach,
        session_date=future_date,
        start_time=datetime.time(16, 0),
        end_time=datetime.time(17, 30),
        status=ClassSession.Status.SCHEDULED
    )

    api_client.force_authenticate(user=expired_coach.user)

    res = api_client.get(f'/api/swimmers/{child_swimmer.id}/documents/sports_insurance/')
    assert res.status_code == 403
    assert 'دسترسی لازم' in res.data['detail']


@pytest.mark.django_db
def test_unrelated_coach_is_denied(api_client, child_swimmer):
    """
    6. Unrelated coach with no assignment is denied (HTTP 403).
    """
    unrelated_user = User.objects.create_user(
        phone='09120010099',
        password='UnrelatedCoachPass@2026',
        first_name='مربی',
        last_name='نامرتبط',
        role=User.Role.COACH
    )
    CoachProfile.objects.create(user=unrelated_user, specialties='قورباغه')

    api_client.force_authenticate(user=unrelated_user)

    res = api_client.get(f'/api/swimmers/{child_swimmer.id}/documents/sports_insurance/')
    assert res.status_code == 403


@pytest.mark.django_db
def test_active_direct_enrollment_coach_cannot_access_swimmer_documents(api_client, child_swimmer, active_coach):
    """
    Direct coach assignment on active Enrollment also denies access to swimmer documents.
    """
    level = SkillLevel.objects.create(name='مقدماتی خصوصی', order=1)
    course = Course.objects.create(
        name='کلاس خصوصی',
        start_date=timezone.now().date(),
        end_date=timezone.now().date() + datetime.timedelta(days=30),
        base_price=Decimal('2000000'),
        sessions_count=8
    )
    Enrollment.objects.create(swimmer=child_swimmer, course=course, coach=active_coach, status='ACTIVE')

    api_client.force_authenticate(user=active_coach.user)

    res = api_client.get(f'/api/swimmers/{child_swimmer.id}/documents/sports_insurance/')
    assert res.status_code == 403


# --------------------------------------------------------------------------
# 4. PDF / ImageField Consistency Validation Tests
# --------------------------------------------------------------------------

def test_validate_document_file_rejects_pdf_extension():
    """
    LOW: validate_document_file strictly rejects .pdf extension and allows only image formats.
    """
    assert '.pdf' not in ALLOWED_DOCUMENT_EXTENSIONS
    assert ALLOWED_DOCUMENT_EXTENSIONS == {'.jpg', '.jpeg', '.png', '.webp'}

    pdf_content = b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF'
    pdf_file = SimpleUploadedFile('identity.pdf', pdf_content, content_type='application/pdf')

    with pytest.raises(ValidationError) as exc_info:
        validate_document_file(pdf_file)

    err_msg = str(exc_info.value)
    assert 'پسوند فایل نامعتبر است' in err_msg


@pytest.mark.django_db
def test_pdf_upload_api_rejected_with_http_400(api_client, child_swimmer):
    """
    LOW: SwimmerProfile uses ImageField. Uploading a .pdf file via API is cleanly rejected
    with HTTP 400 Bad Request.
    """
    api_client.force_authenticate(user=child_swimmer.user)

    pdf_content = b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF'
    pdf_file = SimpleUploadedFile('document.pdf', pdf_content, content_type='application/pdf')

    res = api_client.patch('/api/swimmers/me/', {
        'birth_certificate_image': pdf_file
    }, format='multipart')

    assert res.status_code == 400
    assert 'birth_certificate_image' in res.data


# --------------------------------------------------------------------------
# 5. X-Accel-Redirect Delivery Mode Tests
# --------------------------------------------------------------------------

@pytest.mark.django_db
def test_document_download_x_accel_redirect_mode(api_client, admin_user, child_swimmer):
    """
    MEDIUM: When USE_X_ACCEL_REDIRECT is True, SwimmerDocumentDownloadView sets the
    X-Accel-Redirect header pointing to /protected_media/... with proper security headers.
    """
    api_client.force_authenticate(user=admin_user)

    with override_settings(USE_X_ACCEL_REDIRECT=True):
        res = api_client.get(f'/api/swimmers/{child_swimmer.id}/documents/sports_insurance/')
        assert res.status_code == 200
        assert 'X-Accel-Redirect' in res.headers
        assert res.headers['X-Accel-Redirect'].startswith('/protected_media/')
        assert res.headers.get('Cache-Control') == 'private, no-store, max-age=0'
        assert res.headers.get('X-Content-Type-Options') == 'nosniff'


@pytest.mark.django_db
def test_document_download_file_response_mode(api_client, admin_user, child_swimmer):
    """
    MEDIUM: When USE_X_ACCEL_REDIRECT is False (dev/test fallback), FileResponse streams content directly.
    """
    api_client.force_authenticate(user=admin_user)

    with override_settings(USE_X_ACCEL_REDIRECT=False):
        res = api_client.get(f'/api/swimmers/{child_swimmer.id}/documents/sports_insurance/')
        assert res.status_code == 200
        assert 'X-Accel-Redirect' not in res.headers
        assert res.headers.get('Cache-Control') == 'private, no-store, max-age=0'
        assert res.headers.get('X-Content-Type-Options') == 'nosniff'


@pytest.mark.django_db
def test_x_accel_maps_to_physical_file_path_and_cannot_be_tampered(api_client, admin_user, child_swimmer):
    """
    MEDIUM: Verify that the X-Accel-Redirect header maps directly to the actual physical file
    stored on disk, and that user input (query parameters, malicious headers) cannot influence
    the internal redirect destination.
    """
    from django.conf import settings
    api_client.force_authenticate(user=admin_user)

    with override_settings(USE_X_ACCEL_REDIRECT=True):
        res = api_client.get(f'/api/swimmers/{child_swimmer.id}/documents/sports_insurance/?path=../../etc/passwd')
        assert res.status_code == 200
        x_accel_path = res.headers['X-Accel-Redirect']

        assert x_accel_path.startswith('/protected_media/')
        relative_path = x_accel_path.removeprefix('/protected_media/')
        expected_physical_path = os.path.join(settings.MEDIA_ROOT, relative_path)

        assert os.path.exists(expected_physical_path)
        assert relative_path == child_swimmer.sports_insurance_image.name
        assert '..' not in x_accel_path
        assert 'etc/passwd' not in x_accel_path

