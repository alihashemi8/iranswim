import pytest
from rest_framework.test import APIClient
from apps.content.models import NewsPost, SwimmingPool


@pytest.mark.django_db
def test_dynamic_sitemap_xml():
    client = APIClient()

    # Create a test published news article
    NewsPost.objects.create(
        title='تست سئو و خبر آزمایشی',
        slug='test-seo-news-article',
        body='متن تستی مقاله برای سئو',
        summary='خلاصه مقاله تستی',
        status=NewsPost.Status.PUBLISHED
    )

    response = client.get('/sitemap.xml')
    assert response.status_code == 200
    assert 'application/xml' in response['Content-Type']
    content = response.content.decode('utf-8')
    assert 'https://iran-swim.ir/' in content
    assert 'swimming-classes/' in content
    assert 'courses/kids-swimming/' in content
    assert 'courses/adults-swimming/' in content
    assert 'courses/beginner-swimming/' in content
    assert 'coaches/' in content
    assert 'pricing/' in content
    assert 'schedule/' in content
    assert 'contact/' in content
    assert 'blog/' in content
    assert 'blog/test-seo-news-article' in content

    # Verify no private routes are in the sitemap
    assert '/admin/' not in content
    assert '/coach/' not in content
    assert '/swimmer/' not in content
    assert '/supervisor/' not in content
    assert '/login' not in content
    assert '/register' not in content


@pytest.mark.django_db
def test_dynamic_robots_txt():
    client = APIClient()
    response = client.get('/robots.txt')
    assert response.status_code == 200
    assert 'text/plain' in response['Content-Type']
    content = response.content.decode('utf-8')
    assert 'User-agent: *' in content
    assert 'Allow: /swimming-classes/' in content

    # Verify public API rendering endpoints are explicitly ALLOWED
    assert 'Allow: /api/education/courses/' in content
    assert 'Allow: /api/coaches/' in content
    assert 'Allow: /api/content/' in content
    assert 'Allow: /api/leagues/public/' in content

    # Verify private panels and general API are DISALLOWED
    assert 'Disallow: /admin/' in content
    assert 'Disallow: /coach/' in content
    assert 'Disallow: /swimmer/' in content
    assert 'Disallow: /supervisor/' in content
    assert 'Disallow: /api/' in content
    assert 'Disallow: /login' in content
    assert 'Disallow: /register' in content
    assert 'Sitemap: https://iran-swim.ir/sitemap.xml' in content


@pytest.mark.django_db
def test_public_api_endpoints_accessibility_for_crawlers():
    """
    اطمینان از دسترسی‌پذیری و بازگشت پاسخ ۲۰۰ برای APIهای عمومی که برای رندر صفحات سئو لازمند
    """
    client = APIClient()

    # 1. Courses public API
    res_courses = client.get('/api/education/courses/')
    assert res_courses.status_code == 200

    # 2. Coaches public API
    res_coaches = client.get('/api/coaches/')
    assert res_coaches.status_code == 200

    # 3. News public API
    res_news = client.get('/api/content/news/')
    assert res_news.status_code == 200

    # 4. Pools public API
    res_pools = client.get('/api/content/pools/')
    assert res_pools.status_code == 200


@pytest.mark.django_db
def test_private_routes_protected_against_unauthorized_access():
    """
    اطمینان از مسدود بودن روت‌ها و APIهای خصوصی و عدم افشای اطلاعات بدون احراز هویت
    """
    client = APIClient()

    # Swimmers private data
    res_swimmers = client.get('/api/swimmers/')
    assert res_swimmers.status_code in [401, 403]

    # Finance private data
    res_finance = client.get('/api/finance/invoices/')
    assert res_finance.status_code in [401, 403]

    # Direct document download blocking
    res_doc = client.get('/media/swimmers/documents/sensitive_id.pdf')
    assert res_doc.status_code == 404

    # Unknown invalid endpoint
    res_invalid = client.get('/api/invalid-nonexistent-route-xyz/')
    assert res_invalid.status_code == 404
