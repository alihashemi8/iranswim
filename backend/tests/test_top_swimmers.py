import pytest
from rest_framework import status
from apps.accounts.models import User
from apps.content.models import TopSwimmer


@pytest.fixture
def admin_user(db):
    user = User(
        phone='09121112233',
        first_name='مدیر',
        last_name='سیستم',
        role='ADMIN',
        is_staff=True
    )
    user.set_password('Password123!')
    user.save()
    return user


@pytest.fixture
def auth_admin_client(client, admin_user):
    client.force_login(admin_user)
    return client


@pytest.mark.django_db
def test_top_swimmers_public_list_and_defaults(client):
    # GET public list
    res = client.get('/api/content/top-swimmers/')
    assert res.status_code == status.HTTP_200_OK
    data = res.data
    assert len(data) >= 7
    # Verify Mohammad Parsa Safaei exists
    names = [s['name'] for s in data]
    assert 'محمد پارسا صفایی' in names
    assert 'کاوه راموز' in names


@pytest.mark.django_db
def test_top_swimmers_admin_crud(auth_admin_client, client):
    # Admin creates new swimmer
    payload = {
        'name': 'آراد نوری',
        'role': 'کرال پشت',
        'age': '۱۴ سال',
        'description': 'مدال طلای مسابقات استانی',
        'display_order': 10,
        'is_active': True,
    }
    create_res = auth_admin_client.post('/api/content/top-swimmers/', data=payload)
    assert create_res.status_code == status.HTTP_201_CREATED
    swimmer_id = create_res.data['id']

    # Update swimmer
    patch_res = auth_admin_client.patch(
        f'/api/content/top-swimmers/{swimmer_id}/',
        data={'role': 'کرال سینه'},
        content_type='application/json'
    )
    assert patch_res.status_code == status.HTTP_200_OK
    assert patch_res.data['role'] == 'کرال سینه'

    # Reorder swimmers
    reorder_res = auth_admin_client.post('/api/content/top-swimmers/reorder/', data={
        'orders': [{'id': swimmer_id, 'display_order': 1}]
    }, content_type='application/json')
    assert reorder_res.status_code == status.HTTP_200_OK

    # Delete swimmer
    del_res = auth_admin_client.delete(f'/api/content/top-swimmers/{swimmer_id}/')
    assert del_res.status_code == status.HTTP_204_NO_CONTENT
