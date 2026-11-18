import time
import uuid
import json
import logging
import traceback
from django.utils import timezone
from django.http import JsonResponse
from django.conf import settings
from .models import SystemErrorLog, ErrorGroup, DeploymentMarker
from .fingerprint import (
    generate_error_fingerprint,
    determine_error_severity,
    determine_error_category,
    normalize_endpoint
)

logger = logging.getLogger('iranswim.supervisor')

# Comprehensive set of sensitive keys to redact across headers, params, and body
SENSITIVE_KEYS = {
    'password', 'token', 'access', 'refresh', 'secret', 'authorization',
    'credit_card', 'cookie', 'session', 'sessionid', 'national_id',
    'otp', 'code', 'birth_certificate', 'document', 'identity', 'key',
    'cvv', 'cvv2', 'pan', 'card_number', 'phone_verification', 'api_key',
    'private_key', 'passphrase', 'auth'
}


def sanitize_data(data, max_depth=5):
    """
    حذف و ماسک‌سازی فیلدهای حساس و محرمانه قبل از ثبت در دیتابیس
    برای جلوگیری از نشت پسوردها، توکن‌ها، کوکی‌ها و اطلاعات هویتی.
    """
    if max_depth <= 0:
        return '***DEPTH_LIMIT***'

    if isinstance(data, dict):
        cleaned = {}
        for k, v in data.items():
            k_lower = str(k).lower()
            if any(s in k_lower for s in SENSITIVE_KEYS):
                cleaned[k] = '***REDACTED***'
            elif isinstance(v, (dict, list)):
                cleaned[k] = sanitize_data(v, max_depth - 1)
            else:
                cleaned[k] = str(v)[:300]
        return cleaned
    elif isinstance(data, list):
        return [sanitize_data(item, max_depth - 1) for item in data[:50]]
    elif isinstance(data, (int, float, bool)):
        return data
    elif data is None:
        return None
    return str(data)[:300]


def sanitize_headers(meta):
    """
    استخراج هدرهای امن کلاینت و حذف هدرهای امنیتی حساس مانند Authorization و Cookie
    """
    safe_headers = {}
    for key, value in meta.items():
        if key.startswith('HTTP_'):
            header_name = key[5:].replace('_', '-').title()
            header_lower = header_name.lower()
            if any(s in header_lower for s in ['authorization', 'cookie', 'token', 'secret', 'key']):
                safe_headers[header_name] = '***REDACTED***'
            else:
                safe_headers[header_name] = str(value)[:200]
    return safe_headers


class SupervisorExceptionLoggingMiddleware:
    """
    میدل‌ویر جامع پایش خطاها و مدیریت وقایع (Incident Management Middleware):
    - ثبت و گروه‌بندی خودکار استثناها بر اساس اثرانگشت پایدار (Stable Fingerprint)
    - ماسک‌سازی داده‌های محرمانه (Sanitization)
    - ثبت مدت‌زمان پردازش، هدرها، پارامترهای URL و شناسه یکتای پیگیری (Correlation ID)
    - امنیت کامل و عدم ایجاد اختلال در پردازش درخواست در صورت بروز خطا در ثبت لاگ
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request._supervisor_start_time = time.time()
        # Correlation ID from upstream proxy or generate fresh UUID
        request_id = request.META.get('HTTP_X_REQUEST_ID') or str(uuid.uuid4())
        request._supervisor_request_id = request_id

        response = self.get_response(request)
        return response

    def process_exception(self, request, exception):
        try:
            tb_str = traceback.format_exc()
            exc_type = type(exception).__name__
            err_msg = str(exception)
            endpoint = request.path[:250]
            http_method = request.method[:10]
            request_id = getattr(request, '_supervisor_request_id', str(uuid.uuid4()))

            # Processing duration
            start_time = getattr(request, '_supervisor_start_time', None)
            duration_ms = round((time.time() - start_time) * 1000, 2) if start_time else None

            # Client IP
            x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded:
                ip = x_forwarded.split(',')[0].strip()
            else:
                ip = request.META.get('REMOTE_ADDR')

            # User agent
            ua = request.META.get('HTTP_USER_AGENT', '')[:250]

            # Query params (sanitized)
            query_preview = ''
            if request.GET:
                try:
                    query_dict = sanitize_data(request.GET.dict())
                    query_preview = json.dumps(query_dict, ensure_ascii=False)
                except Exception:
                    query_preview = '(خطا در پردازش پارامترهای GET)'

            # Request body preview (sanitized)
            req_preview = ''
            if request.method in ['POST', 'PUT', 'PATCH']:
                try:
                    if request.content_type == 'application/json' and request.body:
                        parsed = json.loads(request.body.decode('utf-8', errors='ignore'))
                        req_preview = json.dumps(sanitize_data(parsed), ensure_ascii=False)
                    elif request.POST:
                        req_preview = json.dumps(sanitize_data(request.POST.dict()), ensure_ascii=False)
                except Exception:
                    req_preview = '(قالب داده ارسالی غیرقابل پردازش)'

            # Safe headers
            headers_summary = ''
            try:
                headers_summary = json.dumps(sanitize_headers(request.META), ensure_ascii=False)
            except Exception:
                headers_summary = '{}'

            user = request.user if getattr(request, 'user', None) and request.user.is_authenticated else None

            # 1. Compute stable fingerprint for grouping
            fingerprint = generate_error_fingerprint(
                exception_type=exc_type,
                endpoint=endpoint,
                stack_trace=tb_str,
                error_message=err_msg
            )

            severity = determine_error_severity(exc_type, 500, endpoint)
            category = determine_error_category(exc_type, endpoint, err_msg)
            now = timezone.now()

            # Latest deployment correlation
            latest_deploy = DeploymentMarker.objects.filter(
                status=DeploymentMarker.Status.SUCCESS,
                deployed_at__lte=now
            ).order_by('-deployed_at').first()

            # 2. Get or create ErrorGroup (Issue/Incident)
            error_group, created = ErrorGroup.objects.get_or_create(
                fingerprint=fingerprint,
                defaults={
                    'title': f"{exc_type}: {err_msg[:120]}",
                    'exception_type': exc_type,
                    'error_message': err_msg,
                    'severity': severity,
                    'category': category,
                    'status': 'NEW',
                    'status_code': 500,
                    'http_method': http_method,
                    'endpoint': endpoint,
                    'first_seen': now,
                    'last_seen': now,
                    'occurrence_count': 1,
                    'affected_users_count': 1 if user else 0,
                    'first_deployment': latest_deploy
                }
            )

            if not created:
                error_group.occurrence_count += 1
                error_group.last_seen = now
                if error_group.status in ['RESOLVED', 'CLOSED']:
                    # Auto-reopen issue if new occurrences happen after resolution
                    error_group.status = 'NEW'
                    from .models import IncidentActivity
                    IncidentActivity.objects.create(
                        error_group=error_group,
                        actor=None,
                        activity_type=IncidentActivity.ActivityType.REOPENED,
                        old_value='RESOLVED',
                        new_value='NEW',
                        note='بازگشایی خودکار رخداد به دلیل وقوع مجدد باگ پس از رفع.'
                    )
                # Recalculate distinct affected users count
                if user:
                    distinct_users = SystemErrorLog.objects.filter(
                        error_group=error_group,
                        user__isnull=False
                    ).values('user_id').distinct().count()
                    error_group.affected_users_count = max(distinct_users, 1)

                error_group.save(update_fields=['occurrence_count', 'last_seen', 'status', 'affected_users_count', 'updated_at'])

            # 3. Create individual SystemErrorLog occurrence
            log_entry = SystemErrorLog.objects.create(
                error_group=error_group,
                level=SystemErrorLog.Level.CRITICAL,
                endpoint=endpoint,
                http_method=http_method,
                status_code=500,
                exception_type=exc_type,
                error_message=err_msg,
                stack_trace=tb_str,
                user=user,
                ip_address=ip,
                user_agent=ua,
                request_data=req_preview,
                request_id=request_id,
                duration_ms=duration_ms,
                query_params=query_preview,
                headers_summary=headers_summary
            )

            logger.error(
                f"[SUPERVISOR INCIDENT #{error_group.id} (Occurrence #{log_entry.id})] {exc_type}: {err_msg} on {http_method} {endpoint}",
                exc_info=True
            )

            # 4. Check Alert Rules evaluation asynchronously or safely
            try:
                from .services import evaluate_alert_rules
                evaluate_alert_rules(trigger_type='ERROR_OCCURRENCE', context={'error_group': error_group, 'log': log_entry})
            except Exception as alert_err:
                logger.warning(f"عدم امکان ارزیابی هشدارهای خودکار: {alert_err}")

            # Return structured JSON error for API requests
            if request.path.startswith('/api/'):
                return JsonResponse({
                    'detail': 'خطای غیرمنتظره‌ای در سرور رخ داده است. این رخداد با موفقیت در سامانه ناظر ثبت گردید.',
                    'error_tracking_id': log_entry.id,
                    'incident_id': error_group.id,
                    'exception_type': exc_type,
                    'request_id': request_id
                }, status=500)

        except Exception as logger_err:
            logger.critical(f"خطای بحرانی در میدل‌ویر ناظر فنی: {logger_err}")

        return None
