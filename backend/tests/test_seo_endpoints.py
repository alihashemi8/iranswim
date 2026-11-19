import pytest
from rest_framework.test import APIClient
from apps.content.models import NewsPost


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


@pytest.mark.django_db
def test_dynamic_robots_txt():
    client = APIClient()
    response = client.get('/robots.txt')
    assert response.status_code == 200
    assert 'text/plain' in response['Content-Type']
    content = response.content.decode('utf-8')
    assert 'User-agent: *' in content
    assert 'Allow: /swimming-classes/' in content
    assert 'Disallow: /admin/' in content
    assert 'Disallow: /coach/' in content
    assert 'Disallow: /swimmer/' in content
    assert 'Disallow: /supervisor/' in content
    assert 'Disallow: /login' in content
    assert 'Disallow: /register' in content
    assert 'Sitemap: https://iran-swim.ir/sitemap.xml' in content
