import io
import pytest
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.swimmers.models import SwimmerProfile
from apps.coaches.models import CoachProfile


def create_test_image(format='JPEG', size=(100, 100), color=(0, 128, 255)):
    """ایجاد یک فایل تصویر معتبر تستی در حافظه"""
    file_obj = io.BytesIO()
    image = Image.new('RGB', size, color=color)
    image.save(file_obj, format=format)
    file_obj.seek(0)
    ext = 'jpg' if format.upper() == 'JPEG' else format.lower()
    return SimpleUploadedFile(f"avatar_test.{ext}", file_obj.read(), content_type=f"image/{ext}")


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
@pytest.mark.parametrize("role", [
    User.Role.ADMIN,
    User.Role.COACH,
    User.Role.SWIMMER,
    User.Role.SUPERVISOR,
])
def test_all_roles_can_upload_profile_picture_via_avatar_endpoint(api_client, role):
    """همه کاربران با هر نقشی بتونن عکس پروفایل بذارن"""
    user = User.objects.create_user(
        phone=f'0912111000{role[:3]}',
        password='TestPassword123!',
        first_name='کاربر',
        last_name=f'تست {role}',
        role=role
    )
    if role == User.Role.SWIMMER:
        SwimmerProfile.objects.create(user=user, first_name='کاربر', last_name=f'تست {role}')
    elif role == User.Role.COACH:
        CoachProfile.objects.create(user=user, first_name='کاربر', last_name=f'تست {role}')

    api_client.force_authenticate(user=user)

    # 1. Upload first avatar
    img1 = create_test_image('JPEG', color=(255, 0, 0))
    res1 = api_client.post('/api/auth/me/avatar/', {'avatar': img1}, format='multipart')
    assert res1.status_code == 200
    assert 'avatar' in res1.data
    assert res1.data['avatar'] is not None

    user.refresh_from_db()
    assert bool(user.avatar) is True
    first_avatar_name = user.avatar.name

    # If swimmer, swimmer_profile.avatar must be synchronized
    if role == User.Role.SWIMMER:
        user.swimmer_profile.refresh_from_db()
        assert bool(user.swimmer_profile.avatar) is True

    # 2. Upload second avatar -> replaces first avatar ("فقط یکی")
    img2 = create_test_image('PNG', color=(0, 255, 0))
    res2 = api_client.post('/api/auth/me/avatar/', {'avatar': img2}, format='multipart')
    assert res2.status_code == 200
    assert res2.data['avatar'] is not None

    user.refresh_from_db()
    assert bool(user.avatar) is True
    assert user.avatar.name != first_avatar_name

    # 3. Get profile /api/auth/me/ -> avatar URL returned
    res_me = api_client.get('/api/auth/me/')
    assert res_me.status_code == 200
    assert res_me.data.get('avatar') is not None
    assert 'media/avatars/' in res_me.data['avatar']

    # 4. Delete avatar
    res_del = api_client.delete('/api/auth/me/avatar/')
    assert res_del.status_code == 200
    assert res_del.data.get('avatar') is None

    user.refresh_from_db()
    assert not user.avatar

    if role == User.Role.SWIMMER:
        user.swimmer_profile.refresh_from_db()
        assert not user.swimmer_profile.avatar


@pytest.mark.django_db
def test_upload_profile_picture_via_me_endpoint(api_client):
    """تست آپلود تصویر پروفایل مستقیماً از طریق /api/auth/me/"""
    user = User.objects.create_user(
        phone='09129990001',
        password='TestPassword123!',
        first_name='علی',
        last_name='رضایی',
        role=User.Role.ADMIN
    )
    api_client.force_authenticate(user=user)

    img = create_test_image('JPEG')
    res = api_client.patch('/api/auth/me/', {'avatar': img}, format='multipart')
    assert res.status_code == 200
    assert res.data.get('avatar') is not None

    user.refresh_from_db()
    assert bool(user.avatar) is True

    # Remove avatar via patch with empty value
    res_clear = api_client.patch('/api/auth/me/', {'avatar': ''})
    assert res_clear.status_code == 200
    user.refresh_from_db()
    assert not user.avatar


@pytest.mark.django_db
def test_reject_invalid_image_file(api_client):
    """مسدودسازی فایل‌های غیرتصویر یا نامعتبر"""
    user = User.objects.create_user(
        phone='09129990002',
        password='TestPassword123!',
        first_name='سارا',
        last_name='تست',
        role=User.Role.COACH
    )
    api_client.force_authenticate(user=user)

    # 1. Text file disguised as image
    fake_img = SimpleUploadedFile("malicious.jpg", b"This is plain text not an image", content_type="image/jpeg")
    res = api_client.post('/api/auth/me/avatar/', {'avatar': fake_img}, format='multipart')
    assert res.status_code == 400

    # 2. SVG / script file
    svg_file = SimpleUploadedFile("vector.svg", b"<svg><script>alert('xss')</script></svg>", content_type="image/svg+xml")
    res_svg = api_client.post('/api/auth/me/avatar/', {'avatar': svg_file}, format='multipart')
    assert res_svg.status_code == 400


@pytest.mark.django_db
def test_reject_oversized_image_file(api_client):
    """مسدودسازی تصاویر با حجم بیش از ۵ مگابایت"""
    user = User.objects.create_user(
        phone='09129990003',
        password='TestPassword123!',
        first_name='محمد',
        last_name='تست',
        role=User.Role.SWIMMER
    )
    api_client.force_authenticate(user=user)

    # Fake header + 6MB content
    huge_data = b'\xff\xd8\xff\xe0' + b'0' * (6 * 1024 * 1024)
    huge_file = SimpleUploadedFile("huge.jpg", huge_data, content_type="image/jpeg")
    res = api_client.post('/api/auth/me/avatar/', {'avatar': huge_file}, format='multipart')
    assert res.status_code == 400
    assert '۵ مگابایت' in str(res.data)


@pytest.mark.django_db
def test_login_returns_avatar_url(api_client):
    """پاسخ لاگین شامل آدرس تصویر پروفایل کاربر است"""
    user = User.objects.create_user(
        phone='09129990004',
        password='TestPassword123!',
        first_name='امیر',
        last_name='احمدی',
        role=User.Role.ADMIN
    )
    # Assign avatar
    img = create_test_image('JPEG')
    user.avatar = img
    user.save()

    res = api_client.post('/api/auth/login/', {'phone': user.phone, 'password': 'TestPassword123!'})
    assert res.status_code == 200
    assert 'user' in res.data
    assert res.data['user'].get('avatar') is not None
    assert 'media/avatars/' in res.data['user']['avatar']


@pytest.mark.django_db
def test_avatar_upload_with_xmp_metadata(api_client):
    """تصاویر واقعی گوشی‌های هوشمند حاوی متادیتای ادوبی XMP در بخش APP1 بدون خطا آپلود می‌شوند"""
    user = User.objects.create_user(
        phone='09129990005',
        password='TestPassword123!',
        first_name='هادی',
        last_name='شمس',
        role=User.Role.COACH
    )
    api_client.force_authenticate(user=user)

    # Create real valid JPEG with XMP metadata inside APP1
    img = Image.new('RGB', (120, 120), color=(10, 80, 200))
    xmp_meta = b'http://ns.adobe.com/xap/1.0/\x00<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description/></rdf:RDF></x:xmpmeta><?xpacket end="w"?>'
    buf = io.BytesIO()
    img.save(buf, format='JPEG', app=b'\xe1' + len(xmp_meta + b'\x00\x00').to_bytes(2, 'big') + xmp_meta)
    buf.seek(0)

    upload_file = SimpleUploadedFile("camera_phone_photo.jpg", buf.read(), content_type="image/jpeg")
    res = api_client.post('/api/auth/me/avatar/', {'avatar': upload_file}, format='multipart')
    assert res.status_code == 200
    assert res.data.get('avatar') is not None

    user.refresh_from_db()
    assert bool(user.avatar) is True


@pytest.mark.django_db
def test_avatar_upload_with_windows_fakepath(api_client):
    """مرورگرهای ویندوزی که پیشوند fakepath ارسال می‌کنند بدون خطا پردازش می‌شوند"""
    user = User.objects.create_user(
        phone='09129990006',
        password='TestPassword123!',
        first_name='فرزاد',
        last_name='صالحی',
        role=User.Role.SUPERVISOR
    )
    api_client.force_authenticate(user=user)

    img = create_test_image('PNG')
    # Windows browser fakepath
    upload_file = SimpleUploadedFile(r"C:\fakepath\my_avatar.png", img.read(), content_type="image/png")
    res = api_client.post('/api/auth/me/avatar/', {'avatar': upload_file}, format='multipart')
    assert res.status_code == 200
    assert res.data.get('avatar') is not None

