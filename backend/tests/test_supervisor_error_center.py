import pytest
from django.utils import timezone
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.supervisor.models import (
    SystemErrorLog,
    ErrorGroup,
    IncidentActivity,
    AlertRule,
    SystemAlert,
    AuditLog,
    DeploymentMarker,
    ErrorSeverity,
    ErrorCategory,
    IncidentStatus
)
from apps.supervisor.fingerprint import (
    generate_error_fingerprint,
    normalize_endpoint,
    determine_error_severity,
    determine_error_category,
    extract_code_location
)
from apps.supervisor.middleware import sanitize_data, sanitize_headers
from apps.supervisor.services import (
    get_error_dashboard_stats,
    get_error_trend_timeseries,
    get_comprehensive_infrastructure_health,
    evaluate_alert_rules,
    acknowledge_system_alert,
    resolve_system_alert
)
from apps.supervisor.ai_service import is_ai_error_analysis_enabled, get_ai_error_analyzer


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def supervisor_user(db):
    user = User.objects.create_user(
        phone='09121111111',
        password='SupervisorStrongPass123',
        first_name='ناظر',
        last_name='فنی',
        role=User.Role.SUPERVISOR
    )
    return user


@pytest.fixture
def regular_user(db):
    user = User.objects.create_user(
        phone='09122222222',
        password='SwimmerPass123',
        first_name='علی',
        last_name='شناگر',
        role=User.Role.SWIMMER
    )
    return user


@pytest.fixture
def coach_user(db):
    user = User.objects.create_user(
        phone='09123333333',
        password='CoachPass123',
        first_name='رضا',
        last_name='مربی',
        role=User.Role.COACH
    )
    return user


@pytest.mark.django_db
def test_fingerprint_stability_and_endpoint_normalization():
    """آزمون پایداری اثرانگشت خطا و نرمال‌سازی مسیرهای داینامیک"""
    ep1 = "/api/swimmers/45/"
    ep2 = "/api/swimmers/989/"
    assert normalize_endpoint(ep1) == normalize_endpoint(ep2) == "/api/swimmers/{id}/"

    ep_uuid1 = "/api/documents/12345678-1234-5678-1234-567812345678/"
    assert "{uuid}" in normalize_endpoint(ep_uuid1)

    tb = '''Traceback (most recent call last):
  File "C:\\Users\\user\\Desktop\\iranswim\\backend\\apps\\swimmers\\views.py", line 42, in get
    raise ValueError("Invalid swimmer profile")
ValueError: Invalid swimmer profile'''

    fp1 = generate_error_fingerprint('ValueError', ep1, tb, 'Invalid swimmer profile')
    fp2 = generate_error_fingerprint('ValueError', ep2, tb, 'Invalid swimmer profile')
    # Both identical exceptions on same logical route MUST share the exact same fingerprint!
    assert fp1 == fp2
    assert len(fp1) == 64


@pytest.mark.django_db
def test_sensitive_data_sanitization():
    """آزمون عدم افشای پسوردها، توکن‌ها، کد ملی، کوکی‌ها و اطلاعات حساس"""
    payload = {
        'username': 'ali_user',
        'password': 'SuperSecretPassword123!',
        'access_token': 'jwt.token.string',
        'refresh': 'jwt.refresh.string',
        'national_id': '0012345678',
        'otp_code': '54321',
        'credit_card': '6037991122334455',
        'meta': {
            'cookie': 'sessionid=xyz',
            'auth_header': 'Bearer topsecret'
        }
    }
    sanitized = sanitize_data(payload)
    assert sanitized['password'] == '***REDACTED***'
    assert sanitized['access_token'] == '***REDACTED***'
    assert sanitized['refresh'] == '***REDACTED***'
    assert sanitized['national_id'] == '***REDACTED***'
    assert sanitized['otp_code'] == '***REDACTED***'
    assert sanitized['credit_card'] == '***REDACTED***'
    assert sanitized['meta']['cookie'] == '***REDACTED***'
    assert sanitized['meta']['auth_header'] == '***REDACTED***'
    assert sanitized['username'] == 'ali_user'


@pytest.mark.django_db
def test_error_grouping_and_occurrence_counting(api_client, supervisor_user):
    """آزمون تجمیع ۵ خطای تکراری در یک رخداد (Issue) با شمارش تکرار"""
    api_client.force_authenticate(user=supervisor_user)

    # Trigger 3 identical division_by_zero errors
    for _ in range(3):
        res = api_client.post('/api/supervisor/test-trigger/', {'mode': 'division_by_zero'})
        assert res.status_code == 500
        assert 'error_tracking_id' in res.json()
        assert 'incident_id' in res.json()

    # Verify that in database, only 1 ErrorGroup exists for this division_by_zero
    group = ErrorGroup.objects.get(exception_type='ZeroDivisionError')
    assert group.occurrence_count >= 3
    assert group.status == IncidentStatus.NEW
    assert group.occurrences.count() >= 3


@pytest.mark.django_db
def test_incident_management_workflow_and_audit_trail(api_client, supervisor_user, coach_user):
    """آزمون کامل چرخه حیات رخداد: تغییر وضعیت، انتساب به کارشناس، یادداشت، ریشه و رفع باگ"""
    api_client.force_authenticate(user=supervisor_user)

    # 1. Create an incident via test trigger
    res_err = api_client.post('/api/supervisor/test-trigger/', {'mode': 'value_error'})
    assert res_err.status_code == 500
    group = ErrorGroup.objects.get(exception_type='ValueError')

    # 2. Assign technician
    res_assign = api_client.post(f'/api/supervisor/errors/groups/{group.id}/action/', {
        'action': 'assign',
        'technician_id': supervisor_user.id,
        'note': 'ارجاع به ناظر شیفت صبح'
    })
    assert res_assign.status_code == 200
    group.refresh_from_db()
    assert group.assigned_to == supervisor_user
    assert group.status == IncidentStatus.INVESTIGATING

    # 3. Add internal note
    res_note = api_client.post(f'/api/supervisor/errors/groups/{group.id}/action/', {
        'action': 'add_note',
        'note': 'بررسی انجام شد؛ به نظر می‌رسد ورودی کلاینت اعتبارسنجی نشده بود.'
    })
    assert res_note.status_code == 200

    # 4. Record root cause
    res_cause = api_client.post(f'/api/supervisor/errors/groups/{group.id}/action/', {
        'action': 'record_root_cause',
        'root_cause': 'عدم بررسی مقادیر Null در پارامتر mode اندپوینت تست'
    })
    assert res_cause.status_code == 200
    group.refresh_from_db()
    assert 'Null' in group.suspected_root_cause

    # 5. Record resolution
    res_resolve = api_client.post(f'/api/supervisor/errors/groups/{group.id}/action/', {
        'action': 'record_resolution',
        'resolution_details': 'اصلاحیه با اضافه کردن اعتبارسنجی در ویو اعمال شد.'
    })
    assert res_resolve.status_code == 200
    group.refresh_from_db()
    assert group.status == IncidentStatus.RESOLVED
    assert group.resolved_by == supervisor_user

    # 6. Verify audit trail and incident activity log
    activities = IncidentActivity.objects.filter(error_group=group)
    assert activities.count() >= 4

    audit_logs = AuditLog.objects.filter(entity_type='ErrorGroup', entity_id=str(group.id))
    assert audit_logs.count() >= 3

    # 7. Reopen
    res_reopen = api_client.post(f'/api/supervisor/errors/groups/{group.id}/action/', {
        'action': 'reopen',
        'note': 'خطا مجدداً در لاگ‌ها مشاهده شد.'
    })
    assert res_reopen.status_code == 200
    group.refresh_from_db()
    assert group.status == IncidentStatus.INVESTIGATING


@pytest.mark.django_db
def test_supervisor_role_authorization_enforcement(api_client, regular_user, coach_user):
    """آزمون عدم دسترسی کاربران عادی یا مربیان به مرکز پایش خطاها و رخدادها"""
    # 1. Anonymous request
    res_anon = api_client.get('/api/supervisor/errors/overview/')
    assert res_anon.status_code == 401

    # 2. Regular Swimmer request
    api_client.force_authenticate(user=regular_user)
    res_swimmer = api_client.get('/api/supervisor/errors/overview/')
    assert res_swimmer.status_code == 403

    res_swimmer_groups = api_client.get('/api/supervisor/errors/groups/')
    assert res_swimmer_groups.status_code == 403

    # 3. Coach request
    api_client.force_authenticate(user=coach_user)
    res_coach = api_client.get('/api/supervisor/errors/overview/')
    assert res_coach.status_code == 403


@pytest.mark.django_db
def test_error_overview_stats_and_timeseries(api_client, supervisor_user):
    """آزمون دریافت آمار نمای کلی و نقاط زمانی نمودار فراوانی خطاها"""
    api_client.force_authenticate(user=supervisor_user)

    res = api_client.get('/api/supervisor/errors/overview/', {'time_range': '24h'})
    assert res.status_code == 200
    data = res.json()
    assert 'stats' in data
    assert 'timeseries' in data
    assert 'total_errors_24h' in data['stats']
    assert 'critical_errors_24h' in data['stats']
    assert 'unresolved_errors' in data['stats']
    assert 'error_rate_percent' in data['stats']
    assert isinstance(data['timeseries'], list)
    assert len(data['timeseries']) > 0


@pytest.mark.django_db
def test_infrastructure_health_probe(api_client, supervisor_user):
    """آزمون سنجش سلامت زنده زیرساخت و تمایز سرویس‌های پیکربندی‌نشده (UNKNOWN)"""
    api_client.force_authenticate(user=supervisor_user)

    res = api_client.get('/api/supervisor/infrastructure/live/')
    assert res.status_code == 200
    data = res.json()
    assert 'services' in data
    assert 'metrics' in data

    service_ids = [s['id'] for s in data['services']]
    assert 'backend' in service_ids
    assert 'database' in service_ids
    assert 'redis' in service_ids
    assert 'celery_workers' in service_ids
    assert 'celery_beat' in service_ids
    assert 'nginx' in service_ids

    # Backend and Database MUST be healthy in this test environment
    backend_svc = next(s for s in data['services'] if s['id'] == 'backend')
    assert backend_svc['status'] == 'HEALTHY'

    db_svc = next(s for s in data['services'] if s['id'] == 'database')
    assert db_svc['status'] in ['HEALTHY', 'DEGRADED']

    # Unconfigured services MUST be marked UNKNOWN, not failing falsely
    redis_svc = next(s for s in data['services'] if s['id'] == 'redis')
    assert redis_svc['status'] in ['UNKNOWN', 'HEALTHY']


@pytest.mark.django_db
def test_alerts_deduplication_and_acknowledgment(api_client, supervisor_user):
    """آزمون سیستم هشدار، یکتاسازی (Deduplication) و تأیید و رفع هشدار"""
    api_client.force_authenticate(user=supervisor_user)

    # 1. Trigger an alert evaluation
    alerts = evaluate_alert_rules()

    # 2. Fetch alert list API
    res_list = api_client.get('/api/supervisor/alerts/')
    assert res_list.status_code == 200

    # 3. Create a test alert directly to test action flow
    rule = AlertRule.objects.first()
    alert = SystemAlert.objects.create(
        rule=rule,
        title='تست هشدار قطعی سرویس',
        message='توضیحات تست هشدار برای ارزیابی عملکرد ناظر',
        severity=ErrorSeverity.HIGH,
        trigger_condition='test == True',
        dedup_key='TEST_ALERT_KEY_123'
    )

    # 4. Acknowledge alert
    res_ack = api_client.post(f'/api/supervisor/alerts/{alert.id}/action/', {'action': 'acknowledge'})
    assert res_ack.status_code == 200
    alert.refresh_from_db()
    assert alert.status == SystemAlert.Status.ACKNOWLEDGED
    assert alert.acknowledged_by == supervisor_user

    # 5. Resolve alert
    res_resolve = api_client.post(f'/api/supervisor/alerts/{alert.id}/action/', {'action': 'resolve'})
    assert res_resolve.status_code == 200
    alert.refresh_from_db()
    assert alert.status == SystemAlert.Status.RESOLVED


@pytest.mark.django_db
def test_ai_feature_flag_is_strictly_disabled():
    """الزام اساسی بند ۹: هوش مصنوعی باید کاملاً غیرفعال و بدون هزینه/فراخوانی باشد"""
    assert is_ai_error_analysis_enabled() is False

    analyzer = get_ai_error_analyzer()
    analysis = analyzer.analyze_incident(1)
    assert analysis['enabled'] is False
    assert analysis['status'] == 'DISABLED'
    assert analysis['analysis'] is None

    suggestions = analyzer.suggest_remediation(1)
    assert suggestions['enabled'] is False
    assert suggestions['suggestions'] == []


@pytest.mark.django_db
def test_swap_metrics_and_infrastructure_endpoints(api_client, supervisor_user, regular_user):
    """آزمون متریک‌های Swap، سلامت هاست فیزیکی، کانتینرها و کنترل سطح دسترسی RBAC"""
    from apps.supervisor.services import get_swap_metrics, get_live_containers_status, get_storage_metrics

    # 1. Direct service test for Swap metrics
    swap = get_swap_metrics()
    assert 'status' in swap
    assert 'total_mb' in swap
    assert 'used_mb' in swap
    assert 'free_mb' in swap
    assert 'percent' in swap
    assert 'metric_scope' in swap
    assert swap['metric_scope'] == 'VPS_HOST'

    # 2. Direct service test for Storage metrics
    storage = get_storage_metrics()
    assert storage['metric_scope'] == 'VPS_HOST_ROOT'
    assert 'total_gb' in storage
    assert 'free_gb' in storage

    # 3. Direct service test for Live containers
    containers = get_live_containers_status()
    assert len(containers) >= 3
    container_names = [c['name'] for c in containers]
    assert 'iranswim_backend' in container_names
    assert 'iranswim_db' in container_names
    assert 'iranswim_frontend' in container_names
    for c in containers:
        assert 'status' in c
        assert 'health' in c
        assert 'restart_count' in c
        assert c['restart_count'] == 0

    # 4. RBAC: Regular swimmer user cannot access infrastructure
    api_client.force_authenticate(user=regular_user)
    res_forbidden = api_client.get('/api/supervisor/infrastructure/')
    assert res_forbidden.status_code == 403

    # 5. RBAC: Supervisor user receives 200 with complete metrics including Swap
    api_client.force_authenticate(user=supervisor_user)
    res_ok = api_client.get('/api/supervisor/infrastructure/')
    assert res_ok.status_code == 200
    data = res_ok.data
    assert 'swap' in data
    assert 'cpu' in data
    assert 'ram' in data
    assert 'disk' in data
    assert 'containers' in data
    assert 'uptime' in data
    assert data['disk']['metric_scope'] == 'VPS_HOST_ROOT'
    assert 'swap' in data['ram']

    # 6. Live Infrastructure Health Endpoint
    res_live = api_client.get('/api/supervisor/infrastructure/live/')
    assert res_live.status_code == 200
    live_data = res_live.data
    assert 'swap' in live_data['metrics']
    assert 'containers' in live_data
