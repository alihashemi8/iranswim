import io
import os
import uuid
import pytest
from PIL import Image
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.files.base import ContentFile
from rest_framework.test import APIClient
from apps.content.models import NewsPost, NewsImage, SwimmingPool, PoolImage, TopSwimmer
from apps.coaches.models import CoachProfile
from apps.swimmers.models import SwimmerProfile

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    user = User.objects.create_superuser(
        phone='09121110001',
        password='AdminPassword123!',
        first_name='مدیر',
        last_name='سیستم',
        role=User.Role.ADMIN
    )
    return user


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
def swimmer_user(db):
    user = User.objects.create_user(
        phone='09122220002',
        password='SwimmerPassword123!',
        first_name='شناگر',
        last_name='تست',
        role=User.Role.SWIMMER
    )
    SwimmerProfile.objects.create(user=user, date_of_birth='2010-01-01')
    return user


@pytest.fixture
def swimmer_client(api_client, swimmer_user):
    login_res = api_client.post('/api/auth/login/', {
        'phone': '09122220002',
        'password': 'SwimmerPassword123!'
    })
    token = login_res.data['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return api_client


def make_png_bytes(size=(100, 100), color=(255, 0, 0, 255), mode='RGBA'):
    buf = io.BytesIO()
    img = Image.new(mode, size, color)
    img.save(buf, format='PNG')
    buf.seek(0)
    return buf.read()


def make_jpeg_bytes(size=(100, 100), color=(0, 255, 0), exif_orientation=None):
    buf = io.BytesIO()
    img = Image.new('RGB', size, color)
    exif = img.getexif()
    if exif_orientation:
        exif[0x0112] = exif_orientation
    img.save(buf, format='JPEG', exif=exif)
    buf.seek(0)
    return buf.read()


def make_transparent_png_bytes(size=(100, 100)):
    buf = io.BytesIO()
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    # Draw half semi-transparent blue and half completely transparent
    for x in range(size[0] // 2):
        for y in range(size[1]):
            img.putpixel((x, y), (0, 120, 255, 128))
    img.save(buf, format='PNG')
    buf.seek(0)
    return buf.read()


# =========================================================================
# TEST 1: PNG to WebP Conversion
# =========================================================================
@pytest.mark.django_db
def test_png_to_webp_conversion(admin_client):
    png_data = make_png_bytes((120, 120), (255, 50, 50, 255), mode='RGBA')
    upload_file = SimpleUploadedFile("banner.png", png_data, content_type="image/png")

    payload = {
        'title': 'خبر تست تبدیل پی‌ان‌جی به وب‌پی',
        'body': 'متن کامل خبر جهت تست',
        'category': 'GENERAL',
        'status': 'PUBLISHED',
        'image': upload_file
    }
    res = admin_client.post('/api/content/news/', payload, format='multipart')
    assert res.status_code == 201
    post_slug = res.data['slug']

    post = NewsPost.objects.get(slug=post_slug)
    assert post.image.name.endswith('.webp')
    assert os.path.exists(post.image.path)

    # Physical verification of disk file format
    with Image.open(post.image.path) as disk_img:
        assert disk_img.format == 'WEBP'
        assert disk_img.size == (120, 120)

    # Clean up
    post.delete()


# =========================================================================
# TEST 2: JPEG to WebP Conversion
# =========================================================================
@pytest.mark.django_db
def test_jpeg_to_webp_conversion(admin_client):
    jpg_data = make_jpeg_bytes((150, 90), (0, 180, 80))
    upload_file = SimpleUploadedFile("venue.jpeg", jpg_data, content_type="image/jpeg")

    payload = {
        'name': 'استخر آزمایشی تبدیل جی‌پگ',
        'location': 'قزوین، میدان عدل',
        'description': 'مشخصات استخر برای آزمون تبدیل فرمت',
        'poster_image': upload_file
    }
    res = admin_client.post('/api/content/pools/', payload, format='multipart')
    assert res.status_code == 201
    pool_slug = res.data['slug']

    pool = SwimmingPool.objects.get(slug=pool_slug)
    assert pool.poster_image.name.endswith('.webp')
    assert os.path.exists(pool.poster_image.path)

    with Image.open(pool.poster_image.path) as disk_img:
        assert disk_img.format == 'WEBP'
        assert disk_img.size == (150, 90)

    # Clean up
    pool.delete()


# =========================================================================
# TEST 3: Transparency Preservation (Alpha Channel)
# =========================================================================
@pytest.mark.django_db
def test_transparency_preservation(admin_client):
    transparent_data = make_transparent_png_bytes((80, 80))
    upload_file = SimpleUploadedFile("transparent_logo.png", transparent_data, content_type="image/png")

    payload = {
        'name': 'آرتین شناگر برتر',
        'role': 'کرال سینه',
        'age': 'رده نونهالان',
        'description': 'دارنده مدال طلای استانی',
        'image': upload_file
    }
    res = admin_client.post('/api/content/top-swimmers/', payload, format='multipart')
    assert res.status_code == 201
    swimmer_id = res.data['id']

    swimmer = TopSwimmer.objects.get(id=swimmer_id)
    assert swimmer.image.name.endswith('.webp')

    with Image.open(swimmer.image.path) as disk_img:
        assert disk_img.format == 'WEBP'
        assert disk_img.mode == 'RGBA'
        # Inspect pixel on left half: should retain transparency alpha around 128
        left_pixel = disk_img.getpixel((10, 10))
        assert len(left_pixel) == 4
        assert left_pixel[3] > 0  # Alpha channel present and non-zero
        # Inspect pixel on right half: should be fully transparent (alpha 0)
        right_pixel = disk_img.getpixel((70, 70))
        assert right_pixel[3] == 0

    swimmer.delete()


# =========================================================================
# TEST 4: EXIF Orientation Handling
# =========================================================================
@pytest.mark.django_db
def test_exif_orientation_handling(admin_client):
    # Width 120, Height 60 with orientation tag 6 (90 degrees CW rotation)
    # When correctly transposed, width becomes 60 and height becomes 120
    oriented_jpg = make_jpeg_bytes((120, 60), (50, 100, 150), exif_orientation=6)
    upload_file = SimpleUploadedFile("camera_phone.jpg", oriented_jpg, content_type="image/jpeg")

    payload = {
        'name': 'استخر چرخش‌یافته EXIF',
        'location': 'قزوین، پونک',
        'description': 'تست اصلاح خودکار چرخش عمودی',
        'poster_image': upload_file
    }
    res = admin_client.post('/api/content/pools/', payload, format='multipart')
    assert res.status_code == 201
    pool = SwimmingPool.objects.get(slug=res.data['slug'])

    with Image.open(pool.poster_image.path) as disk_img:
        assert disk_img.format == 'WEBP'
        # Transposed dimensions must be swapped: 60x120 instead of 120x60
        assert disk_img.size == (60, 120)

    pool.delete()


# =========================================================================
# TEST 5: Invalid and Corrupted Image Rejection
# =========================================================================
@pytest.mark.django_db
def test_invalid_and_corrupted_image_rejection(admin_client):
    # A) Corrupted random bytes disguised as JPG
    corrupt_file = SimpleUploadedFile("corrupt.jpg", b"\xFF\xD8\xFF\xE0garbage_data_here", content_type="image/jpeg")
    res1 = admin_client.post('/api/content/news/', {
        'title': 'خبر با فایل مخدوش',
        'body': 'تست فایل نامعتبر',
        'image': corrupt_file
    }, format='multipart')
    assert res1.status_code == 400

    # B) SVG Vector file disguised as PNG
    svg_data = b'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40"/></svg>'
    svg_file = SimpleUploadedFile("vector.png", svg_data, content_type="image/png")
    res2 = admin_client.post('/api/content/news/', {
        'title': 'خبر با فایل وکتور اس‌وی‌جی',
        'body': 'تست جلوگیری از اس‌وی‌جی',
        'image': svg_file
    }, format='multipart')
    assert res2.status_code == 400

    # C) Empty 0-byte file
    empty_file = SimpleUploadedFile("empty.png", b"", content_type="image/png")
    res3 = admin_client.post('/api/content/news/', {
        'title': 'خبر با فایل خالی',
        'body': 'تست فایل خالی',
        'image': empty_file
    }, format='multipart')
    assert res3.status_code == 400

    # D) Arbitrary executable script
    script_file = SimpleUploadedFile("malware.php", b"<?php echo 'attack'; ?>", content_type="application/x-php")
    res4 = admin_client.post('/api/content/news/', {
        'title': 'خبر با اسکریپت پی‌اچ‌پی',
        'body': 'تست اسکریپت',
        'image': script_file
    }, format='multipart')
    assert res4.status_code == 400


# =========================================================================
# TEST 6: Oversized Image Rejection
# =========================================================================
@pytest.mark.django_db
def test_oversized_image_rejection(admin_client):
    from apps.content.image_optimizer import optimize_image_to_webp
    from rest_framework.exceptions import ValidationError

    # A) Exceeding max file size (e.g. simulated > 12 MB)
    large_buf = io.BytesIO(b"0" * (13 * 1024 * 1024))
    large_upload = SimpleUploadedFile("huge.jpg", large_buf.read(), content_type="image/jpeg")
    with pytest.raises(ValidationError) as exc1:
        optimize_image_to_webp(large_upload, max_size_bytes=12 * 1024 * 1024)
    assert 'فراتر از سقف مجاز' in str(exc1.value)

    # B) Exceeding max dimensions (> 6000 px)
    dim_buf = io.BytesIO()
    dim_img = Image.new('RGB', (6200, 100), (100, 100, 100))
    dim_img.save(dim_buf, format='JPEG')
    dim_buf.seek(0)
    dim_upload = SimpleUploadedFile("panoramic.jpg", dim_buf.read(), content_type="image/jpeg")
    with pytest.raises(ValidationError) as exc2:
        optimize_image_to_webp(dim_upload, max_dimension=6000)
    assert 'بیشتر از حد مجاز' in str(exc2.value)


# =========================================================================
# TEST 7: Unique Filename Generation
# =========================================================================
@pytest.mark.django_db
def test_unique_filename_generation(admin_client):
    # Upload images with malicious or identical filenames
    img1 = make_png_bytes((50, 50))
    img2 = make_png_bytes((50, 50))

    file1 = SimpleUploadedFile("../../../etc/shadow.jpg", img1, content_type="image/jpeg")
    file2 = SimpleUploadedFile("عکس استخر شنا ۲.png", img2, content_type="image/png")

    res1 = admin_client.post('/api/content/pools/', {
        'name': 'استخر تست نامگذاری ۱',
        'location': 'قزوین',
        'description': 'تست ۱',
        'poster_image': file1
    }, format='multipart')
    assert res1.status_code == 201

    res2 = admin_client.post('/api/content/pools/', {
        'name': 'استخر تست نامگذاری ۲',
        'location': 'قزوین',
        'description': 'تست ۲',
        'poster_image': file2
    }, format='multipart')
    assert res2.status_code == 201

    pool1 = SwimmingPool.objects.get(slug=res1.data['slug'])
    pool2 = SwimmingPool.objects.get(slug=res2.data['slug'])

    # Basenames must be random UUIDs, not user-supplied names
    base1 = os.path.basename(pool1.poster_image.name)
    base2 = os.path.basename(pool2.poster_image.name)

    assert base1.endswith('.webp')
    assert base2.endswith('.webp')
    assert 'shadow' not in base1
    assert 'استخر' not in base2
    assert base1 != base2

    pool1.delete()
    pool2.delete()


# =========================================================================
# TEST 8: Correct Database File Reference After Conversion
# =========================================================================
@pytest.mark.django_db
def test_correct_database_file_reference_after_conversion(admin_client):
    png_data = make_png_bytes((60, 60))
    file = SimpleUploadedFile("sample.png", png_data, content_type="image/png")

    res = admin_client.post('/api/content/news/', {
        'title': 'خبر تایید ارجاع دیتابیس',
        'body': 'متن خبر',
        'image': file
    }, format='multipart')
    assert res.status_code == 201

    post = NewsPost.objects.get(slug=res.data['slug'])
    assert post.image.name.startswith('news/')
    assert post.image.name.endswith('.webp')

    # Serializer returned URL must match
    assert res.data['image_url'].endswith('.webp')
    assert 'news/' in res.data['image_url']

    post.delete()


# =========================================================================
# TEST 9: Existing Image Compatibility (Historical Images Remain Intact)
# =========================================================================
@pytest.mark.django_db
def test_existing_image_compatibility(admin_client):
    # Simulate a historical legacy JPEG image already in database
    jpg_data = make_jpeg_bytes((70, 70))
    legacy_file_name = 'news/legacy_archive_photo.jpg'

    post = NewsPost.objects.create(
        title='خبر قدیمی با عکس جی‌پگ',
        slug='legacy-news-post',
        body='متن خبر آرشیو',
        image=SimpleUploadedFile('legacy_archive_photo.jpg', jpg_data, content_type='image/jpeg')
    )
    # Manually simulate committed legacy state with .jpg
    post.image.save('legacy_photo.jpg', ContentFile(jpg_data), save=True)
    initial_path = post.image.path
    initial_name = post.image.name
    assert initial_name.endswith('.jpg')
    assert os.path.exists(initial_path)

    # Update metadata WITHOUT re-uploading an image
    patch_res = admin_client.patch(f'/api/content/news/{post.slug}/', {
        'title': 'خبر قدیمی - عنوان به‌روزرسانی‌شده'
    }, format='json')
    assert patch_res.status_code == 200

    post.refresh_from_db()
    assert post.title == 'خبر قدیمی - عنوان به‌روزرسانی‌شده'
    # Existing legacy image must remain completely untouched
    assert post.image.name == initial_name
    assert os.path.exists(initial_path)

    post.delete()


# =========================================================================
# TEST 10: Private Documents Are Unaffected
# =========================================================================
@pytest.mark.django_db
def test_private_documents_are_unaffected(swimmer_user, admin_client):
    # Private documents in swimmers/documents/ must NOT be converted to WebP
    raw_pdf = b'%PDF-1.4 test document content'
    doc_file = SimpleUploadedFile("birth_certificate.pdf", raw_pdf, content_type="application/pdf")

    profile = swimmer_user.swimmer_profile
    profile.birth_certificate_image.save('birth_doc.pdf', doc_file, save=True)

    profile.refresh_from_db()
    assert profile.birth_certificate_image.name.endswith('.pdf')
    assert 'swimmers/documents/' in profile.birth_certificate_image.name

    # Coach documents must NOT be converted to WebP
    coach_user = User.objects.create_user(phone='09123334444', password='Password123!', role=User.Role.COACH)
    coach = CoachProfile.objects.create(user=coach_user)
    cert_file = SimpleUploadedFile("certificate.pdf", raw_pdf, content_type="application/pdf")
    coach.coaching_certificate_file.save('coach_cert.pdf', cert_file, save=True)
    coach.refresh_from_db()

    assert coach.coaching_certificate_file.name.endswith('.pdf')
    assert 'coach_certificates/' in coach.coaching_certificate_file.name


# =========================================================================
# TEST 11: Permission Checks for Unauthorized Uploads
# =========================================================================
@pytest.mark.django_db
def test_permission_checks_for_unauthorized_uploads(api_client, swimmer_client):
    img_data = make_png_bytes((50, 50))
    upload_file = SimpleUploadedFile("test.png", img_data, content_type="image/png")

    # 1. Anonymous user must be rejected with HTTP 401 or 403
    anon_res = api_client.post('/api/content/news/', {
        'title': 'خبر غیرمجاز',
        'body': 'متن',
        'image': upload_file
    }, format='multipart')
    assert anon_res.status_code in [401, 403]

    # 2. Authenticated swimmer role must be rejected with HTTP 403
    swimmer_res = swimmer_client.post('/api/content/pools/', {
        'name': 'استخر غیرمجاز',
        'location': 'قزوین',
        'poster_image': upload_file
    }, format='multipart')
    assert swimmer_res.status_code == 403


# =========================================================================
# TEST 12: Orphaned File Cleanup on Replacement and Deletion
# =========================================================================
@pytest.mark.django_db
def test_orphaned_file_cleanup_on_replacement_and_deletion(admin_client):
    img1 = make_png_bytes((50, 50))
    img2 = make_png_bytes((60, 60))

    file1 = SimpleUploadedFile("pool1.png", img1, content_type="image/png")
    res1 = admin_client.post('/api/content/pools/', {
        'name': 'استخر تست پاکسازی فایل',
        'location': 'قزوین',
        'description': 'تست پاکسازی',
        'poster_image': file1
    }, format='multipart')
    assert res1.status_code == 201

    pool = SwimmingPool.objects.get(slug=res1.data['slug'])
    path1 = pool.poster_image.path
    assert os.path.exists(path1)

    # Replace with second image
    file2 = SimpleUploadedFile("pool2.png", img2, content_type="image/png")
    res2 = admin_client.patch(f'/api/content/pools/{pool.slug}/', {
        'poster_image': file2
    }, format='multipart')
    assert res2.status_code == 200

    pool.refresh_from_db()
    path2 = pool.poster_image.path
    assert os.path.exists(path2)
    # Old file must have been deleted
    assert not os.path.exists(path1)

    # Delete pool -> path2 must be deleted
    pool.delete()
    assert not os.path.exists(path2)


# =========================================================================
# TEST 13: Coach Card Avatar Optimization via Website Management
# =========================================================================
@pytest.mark.django_db
def test_coach_avatar_webp_optimization(admin_client):
    png_avatar = make_png_bytes((100, 100), (30, 140, 200, 255))
    upload_file = SimpleUploadedFile("coach_photo.png", png_avatar, content_type="image/png")

    # Post coach card with avatar (as in Website Management coaches tab)
    payload = {
        'first_name': 'رضا',
        'last_name': 'سلیمانی',
        'phone': '09124445566',
        'gender': 'MALE',
        'coaching_degree': 'GRADE_1',
        'bio': 'مربی ارشد تیم ملی شنا',
        'show_on_landing': True,
        'avatar': upload_file
    }
    res = admin_client.post('/api/coaches/', payload, format='multipart')
    assert res.status_code == 201
    coach_id = res.data['id']

    coach = CoachProfile.objects.get(id=coach_id)
    assert coach.user.avatar.name.endswith('.webp')
    assert os.path.exists(coach.user.avatar.path)

    with Image.open(coach.user.avatar.path) as disk_img:
        assert disk_img.format == 'WEBP'
        assert disk_img.size == (100, 100)

    # Test replacing coach avatar
    old_avatar_path = coach.user.avatar.path
    new_jpg_avatar = make_jpeg_bytes((90, 90), (200, 50, 50))
    res_update = admin_client.patch(f'/api/coaches/{coach_id}/', {
        'avatar': SimpleUploadedFile("new_coach_photo.jpg", new_jpg_avatar, content_type="image/jpeg")
    }, format='multipart')
    assert res_update.status_code == 200

    coach.refresh_from_db()
    new_avatar_path = coach.user.avatar.path
    assert new_avatar_path.endswith('.webp')
    assert os.path.exists(new_avatar_path)
    assert not os.path.exists(old_avatar_path)

    # Cleanup
    if os.path.exists(new_avatar_path):
        os.remove(new_avatar_path)
    coach.user.delete()

