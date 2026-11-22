import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.content.models import SupportTicket, TicketMessage, Notification

@pytest.mark.django_db
def test_support_tickets_all_roles_to_supervisor():
    client = APIClient()

    # 1. Create users for all 4 roles
    admin = User.objects.create_user(phone='09100000001', first_name='مدیر', last_name='آموزشگاه', role=User.Role.ADMIN)
    coach = User.objects.create_user(phone='09100000002', first_name='مربی', last_name='تیم', role=User.Role.COACH)
    swimmer = User.objects.create_user(phone='09100000003', first_name='شناگر', last_name='قهرمان', role=User.Role.SWIMMER)
    supervisor = User.objects.create_user(phone='09100000004', first_name='ناظر', last_name='فنی سامانه', role=User.Role.SUPERVISOR)

    # 2. Admin submits a ticket to supervisor
    client.force_authenticate(user=admin)
    res_admin = client.post('/api/content/tickets/', {
        'subject': 'بررسی لود سرور و قطعی سرویس پیامک',
        'category': 'TECHNICAL',
        'priority': 'HIGH',
        'description': 'سامانه ارسال پیامک در ساعات اوج ثبت‌نام با تاخیر مواجه می‌شود.',
    }, format='json')
    assert res_admin.status_code == 201
    admin_ticket_id = res_admin.data['id']
    assert res_admin.data['user_role'] == 'ADMIN'
    assert res_admin.data['status'] == 'SUBMITTED'
    assert res_admin.data['priority'] == 'HIGH'
    assert res_admin.data['messages_count'] == 1

    # Check notification for supervisor
    assert Notification.objects.filter(recipient=supervisor, link__contains=f'/supervisor/tickets?id={admin_ticket_id}').exists()

    # 3. Coach submits a ticket to supervisor
    client.force_authenticate(user=coach)
    res_coach = client.post('/api/content/tickets/', {
        'subject': 'خطا در ثبت رکورد کرال پشت',
        'category': 'BUG',
        'priority': 'MEDIUM',
        'description': 'در فرم ثبت رکورد خطای اعشار رخ می‌دهد.',
    }, format='json')
    assert res_coach.status_code == 201
    coach_ticket_id = res_coach.data['id']
    assert res_coach.data['user_role'] == 'COACH'

    # Coach should only see their own tickets
    res_coach_list = client.get('/api/content/tickets/')
    assert res_coach_list.status_code == 200
    coach_tickets = res_coach_list.data if isinstance(res_coach_list.data, list) else res_coach_list.data.get('results', [])
    assert len(coach_tickets) == 1
    assert coach_tickets[0]['id'] == coach_ticket_id

    # 4. Swimmer submits a ticket to supervisor
    client.force_authenticate(user=swimmer)
    res_swimmer = client.post('/api/content/tickets/', {
        'subject': 'عدم نمایش رسید پرداخت شهریه',
        'category': 'FINANCE',
        'priority': 'LOW',
        'description': 'رسید پرداخت اینترنتی دوره شنا صادر شده اما در پنل من نمایش داده نمی‌شود.',
    }, format='json')
    assert res_swimmer.status_code == 201
    swimmer_ticket_id = res_swimmer.data['id']
    assert res_swimmer.data['user_role'] == 'SWIMMER'

    # 5. Technical Supervisor views all tickets and filters
    client.force_authenticate(user=supervisor)
    res_sup_all = client.get('/api/content/tickets/')
    assert res_sup_all.status_code == 200
    all_tickets = res_sup_all.data if isinstance(res_sup_all.data, list) else res_sup_all.data.get('results', [])
    assert len(all_tickets) == 3

    # Filter by role: COACH
    res_sup_coach = client.get('/api/content/tickets/?role=COACH')
    coach_filtered = res_sup_coach.data if isinstance(res_sup_coach.data, list) else res_sup_coach.data.get('results', [])
    assert len(coach_filtered) == 1
    assert coach_filtered[0]['id'] == coach_ticket_id

    # Filter by role: ADMIN
    res_sup_admin = client.get('/api/content/tickets/?role=ADMIN')
    admin_filtered = res_sup_admin.data if isinstance(res_sup_admin.data, list) else res_sup_admin.data.get('results', [])
    assert len(admin_filtered) == 1
    assert admin_filtered[0]['id'] == admin_ticket_id

    # Filter by priority: HIGH
    res_sup_high = client.get('/api/content/tickets/?priority=HIGH')
    high_filtered = res_sup_high.data if isinstance(res_sup_high.data, list) else res_sup_high.data.get('results', [])
    assert len(high_filtered) == 1
    assert high_filtered[0]['id'] == admin_ticket_id

    # Check stats endpoint
    res_stats = client.get('/api/content/tickets/stats/')
    assert res_stats.status_code == 200
    assert res_stats.data['total'] == 3
    assert res_stats.data['submitted'] == 3
    assert res_stats.data['by_role']['ADMIN'] == 1
    assert res_stats.data['by_role']['COACH'] == 1
    assert res_stats.data['by_role']['SWIMMER'] == 1

    # 6. Supervisor replies to admin ticket
    res_reply = client.post(f'/api/content/tickets/{admin_ticket_id}/reply/', {
        'message': 'سلام، سرور پیامک بازنشانی شد و صف پیام‌ها با موفقیت تخلیه گردید.',
        'status': 'ANSWERED'
    }, format='json')
    assert res_reply.status_code == 201
    assert res_reply.data['status'] == 'ANSWERED'
    assert res_reply.data['messages_count'] == 2

    # Verify notification sent to admin
    assert Notification.objects.filter(recipient=admin, link='/admin/support').exists()

    # 7. Admin sends follow-up reply in the same thread
    client.force_authenticate(user=admin)
    res_admin_followup = client.post(f'/api/content/tickets/{admin_ticket_id}/reply/', {
        'message': 'تشکر از پیگیری سریع، پیامک‌ها در حال ارسال هستند.',
    }, format='json')
    assert res_admin_followup.status_code == 201
    assert res_admin_followup.data['messages_count'] == 3

    # 8. Admin closes ticket
    res_close = client.patch(f'/api/content/tickets/{admin_ticket_id}/', {
        'status': 'CLOSED'
    }, format='json')
    assert res_close.status_code == 200
    assert res_close.data['status'] == 'CLOSED'
