import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from apps.content.models import NewsPost, NewsImage, SwimmingPool, PoolImage
from apps.coaches.models import CoachProfile

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    user = User.objects.create_superuser(
        phone='09121112233',
        password='AdminPassword123',
        first_name='مدیر',
        last_name='سیستم'
    )
    return user


@pytest.fixture
def admin_client(api_client, admin_user):
    login_res = api_client.post('/api/auth/login/', {
        'phone': '09121112233',
        'password': 'AdminPassword123'
    })
    token = login_res.data['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return api_client


TINY_GIF = b'GIF89a\x01\x00\x01\x00\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'


@pytest.mark.django_db
def test_news_with_poster_and_detail_images(admin_client):
    """تست ثبت خبر همراه با عکس پوستر و چندین عکس شرح خبر"""
    poster = SimpleUploadedFile("poster.gif", TINY_GIF, content_type="image/gif")
    detail1 = SimpleUploadedFile("detail1.gif", TINY_GIF, content_type="image/gif")
    detail2 = SimpleUploadedFile("detail2.gif", TINY_GIF, content_type="image/gif")

    payload = {
        'title': 'افتتاحیه دوره جدید شنا',
        'summary': 'خلاصه خبر افتتاحیه',
        'body': 'متن کامل خبر افتتاحیه در استخرهای قزوین',
        'category': 'CLASSES',
        'status': 'PUBLISHED',
        'image': poster,
        'detail_images': [detail1, detail2]
    }

    res = admin_client.post('/api/content/news/', payload, format='multipart')
    assert res.status_code == 201
    post_slug = res.data['slug']

    post = NewsPost.objects.get(slug=post_slug)
    assert post.title == 'افتتاحیه دوره جدید شنا'
    assert bool(post.image) is True
    assert post.detail_images.count() == 2

    # Verify public retrieval returns poster and detail_images
    public_client = APIClient()
    detail_res = public_client.get(f'/api/content/news/{post_slug}/')
    assert detail_res.status_code == 200
    assert len(detail_res.data['detail_images']) == 2


@pytest.mark.django_db
def test_swimming_pool_creation_and_details(admin_client):
    """تست ایجاد استخر با پوستر، نام، لوکیشن و عکس‌های گالری"""
    poster = SimpleUploadedFile("pool_poster.gif", TINY_GIF, content_type="image/gif")
    gallery1 = SimpleUploadedFile("gal1.gif", TINY_GIF, content_type="image/gif")

    payload = {
        'name': 'استخر الغدیر قزوین',
        'location': 'قزوین، خیابان نواب شمالی',
        'description': 'استخر مجهز با سونای خشک و آب زلال ۳۰ درجه',
        'facilities': 'سونا، جکوزی، بوفه',
        'dimensions': '۲۵ در ۱۲ متر',
        'depth': '۱.۲۰ تا ۲.۵۰ متر',
        'display_order': 5,
        'poster_image': poster,
        'gallery_images': [gallery1]
    }

    res = admin_client.post('/api/content/pools/', payload, format='multipart')
    assert res.status_code == 201
    pool_slug = res.data['slug']

    pool = SwimmingPool.objects.get(slug=pool_slug)
    assert pool.name == 'استخر الغدیر قزوین'
    assert pool.location == 'قزوین، خیابان نواب شمالی'
    assert pool.gallery_images.count() == 1

    # Verify public retrieval
    public_client = APIClient()
    pub_res = public_client.get('/api/content/pools/')
    assert pub_res.status_code == 200
    pools_list = pub_res.data['results'] if isinstance(pub_res.data, dict) and 'results' in pub_res.data else pub_res.data
    assert any(p['slug'] == pool_slug for p in pools_list)


@pytest.mark.django_db
def test_coaches_gender_and_reorder(admin_client):
    """تست تفکیک جنسیت مربیان و ذخیره ترتیب نمایش"""
    coach1_user = User.objects.create_user(phone='09121110001', first_name='سعید', last_name='موسوی', role=User.Role.COACH)
    coach2_user = User.objects.create_user(phone='09121110002', first_name='زهرا', last_name='حسینی', role=User.Role.COACH)

    c1 = CoachProfile.objects.create(user=coach1_user, gender=CoachProfile.Gender.MALE, display_order=10)
    c2 = CoachProfile.objects.create(user=coach2_user, gender=CoachProfile.Gender.FEMALE, display_order=20)

    # Reorder API
    reorder_res = admin_client.post('/api/coaches/reorder/', {
        'orders': [
            {'id': c1.id, 'display_order': 1},
            {'id': c2.id, 'display_order': 2}
        ]
    }, format='json')
    assert reorder_res.status_code == 200

    c1.refresh_from_db()
    c2.refresh_from_db()
    assert c1.display_order == 1
    assert c2.display_order == 2

    # Public list allows filtering by gender
    pub_client = APIClient()
    male_res = pub_client.get('/api/coaches/?gender=MALE')
    assert male_res.status_code == 200
    males = male_res.data.get('results') or male_res.data
    assert all(m['gender'] == 'MALE' for m in males)

    female_res = pub_client.get('/api/coaches/?gender=FEMALE')
    assert female_res.status_code == 200
    females = female_res.data.get('results') or female_res.data
    assert all(f['gender'] == 'FEMALE' for f in females)


@pytest.mark.django_db
def test_landing_sections_public_list_and_admin_toggle(admin_client):
    """تست مشاهده بخش‌های لندینگ و سوئیچ فعال/غیرفعال کردن بخش‌ها توسط مدیر"""
    pub_client = APIClient()
    res = pub_client.get('/api/content/landing-sections/')
    assert res.status_code == 200
    sections = res.data
    assert len(sections) == 8
    
    # Keys should include coaches, pools, news, courses, hero, about, facilities, cta
    keys = [s['key'] for s in sections]
    assert 'hero' in keys
    assert 'about' in keys
    assert 'courses' in keys
    assert 'pools' in keys
    assert 'facilities' in keys
    assert 'coaches' in keys
    assert 'news' in keys
    assert 'cta' in keys

    # Initially all are enabled
    coaches_sec = next(s for s in sections if s['key'] == 'coaches')
    assert coaches_sec['is_enabled'] is True

    # Anonymous user CANNOT toggle
    anon_toggle = pub_client.post('/api/content/landing-sections/coaches/toggle/')
    assert anon_toggle.status_code in [401, 403]

    # Admin toggles coaches off
    toggle_res = admin_client.post('/api/content/landing-sections/coaches/toggle/')
    assert toggle_res.status_code == 200
    assert toggle_res.data['is_enabled'] is False

    # Public list now shows coaches is disabled
    res_after = pub_client.get('/api/content/landing-sections/')
    assert res_after.status_code == 200
    updated_coaches = next(s for s in res_after.data if s['key'] == 'coaches')
    assert updated_coaches['is_enabled'] is False

    # Admin bulk updates (e.g. disable news and about)
    bulk_res = admin_client.put('/api/content/landing-sections/', {
        'sections': [
            {'key': 'news', 'is_enabled': False},
            {'key': 'about', 'is_enabled': False},
            {'key': 'coaches', 'is_enabled': True},
        ]
    }, format='json')
    assert bulk_res.status_code == 200
    
    res_final = pub_client.get('/api/content/landing-sections/')
    state_map = {s['key']: s['is_enabled'] for s in res_final.data}
    assert state_map['news'] is False
    assert state_map['about'] is False
    assert state_map['coaches'] is True

