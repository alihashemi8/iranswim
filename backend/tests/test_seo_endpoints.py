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


@pytest.mark.django_db
def test_blog_article_resolver_and_visibility_restrictions():
    """
    آزمون جامع اعتبارسنجی اسلاگ‌ها و رویت‌پذیری مقالات:
    ۱. مقاله منتشرشده فعلی -> HTTP 200 + X-Accel-Redirect
    ۲. مقاله پیش‌نویس (DRAFT) -> HTTP 404 (غیرقابل دسترس عمومی)
    ۳. مقاله بایگانی‌شده (ARCHIVED) -> HTTP 404
    ۴. مقاله زمان‌بندی‌شده برای آینده (Future publish_at) -> HTTP 404
    ۵. مقاله ناموجود -> HTTP 404
    """
    from datetime import timedelta
    from django.utils import timezone
    client = APIClient()

    now = timezone.now()

    # 1. Published post
    NewsPost.objects.create(
        title='مقاله منتشرشده',
        slug='published-article-slug',
        body='محتوا',
        summary='خلاصه',
        status=NewsPost.Status.PUBLISHED,
        publish_at=now - timedelta(days=1)
    )

    # 2. Draft post
    NewsPost.objects.create(
        title='مقاله پیش‌نویس',
        slug='draft-article-slug',
        body='محتوای محرمانه پیش‌نویس',
        summary='خلاصه',
        status=NewsPost.Status.DRAFT,
        publish_at=now - timedelta(days=1)
    )

    # 3. Archived post
    NewsPost.objects.create(
        title='مقاله بایگانی',
        slug='archived-article-slug',
        body='محتوای منقضی',
        summary='خلاصه',
        status=NewsPost.Status.ARCHIVED,
        publish_at=now - timedelta(days=30)
    )

    # 4. Future scheduled post
    NewsPost.objects.create(
        title='مقاله آینده',
        slug='future-scheduled-article-slug',
        body='محتوای آینده',
        summary='خلاصه',
        status=NewsPost.Status.PUBLISHED,
        publish_at=now + timedelta(days=5)
    )

    # A) Test blog_article_resolver (used by Nginx)
    # 1. Published -> 200 + X-Accel-Redirect
    res_pub = client.get('/api/content/validate-article/published-article-slug/')
    assert res_pub.status_code == 200
    assert res_pub.headers.get('X-Accel-Redirect') == '/internal_spa/index.html'

    # 2. Draft -> 404
    res_draft = client.get('/api/content/validate-article/draft-article-slug/')
    assert res_draft.status_code == 404

    # 3. Archived -> 404
    res_archived = client.get('/api/content/validate-article/archived-article-slug/')
    assert res_archived.status_code == 404

    # 4. Future -> 404
    res_future = client.get('/api/content/validate-article/future-scheduled-article-slug/')
    assert res_future.status_code == 404

    # 5. Non-existent -> 404
    res_nonexistent = client.get('/api/content/validate-article/definitely-nonexistent-slug-xyz/')
    assert res_nonexistent.status_code == 404

    # B) Test NewsPostDetailView (public API)
    # Anonymous user
    assert client.get('/api/content/news/published-article-slug/').status_code == 200
    assert client.get('/api/content/news/draft-article-slug/').status_code == 404
    assert client.get('/api/content/news/archived-article-slug/').status_code == 404
    assert client.get('/api/content/news/future-scheduled-article-slug/').status_code == 404


@pytest.mark.django_db
def test_canonical_and_schema_files_integrity():
    """
    آزمون یکپارچگی ساختار Schema.org و آدرس‌های کانونیکال در index.html و robots.txt
    """
    import os, json, re

    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    index_path = os.path.join(base_dir, 'frontend', 'index.html')

    assert os.path.exists(index_path), "index.html must exist"
    with open(index_path, encoding='utf-8') as f:
        html = f.read()

    # 1. Canonical tag
    assert '<link rel="canonical" href="https://iran-swim.ir/" />' in html

    # 2. No placeholder phone in Schema.org
    assert 'id="base-organization-schema"' in html
    match = re.search(r'<script type="application/ld\+json" id="base-organization-schema">([\s\S]*?)</script>', html)
    assert match, "Schema tag must exist"
    schema_json = json.loads(match.group(1))
    assert schema_json['@context'] == 'https://schema.org'

    org = next(item for item in schema_json['@graph'] if 'SportsClub' in item.get('@type', []))
    assert 'telephone' not in org, "Placeholder central phone must be omitted from org schema"

    # 3. Contracted venues labeled Place
    pools = org.get('location', [])
    assert len(pools) == 4
    for p in pools:
        assert p['@type'] == 'Place'
        assert '(مجموعه طرف قرارداد)' in p['name']
        assert p.get('telephone') is not None
