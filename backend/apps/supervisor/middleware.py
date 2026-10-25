import traceback
import json
import logging
from django.http import JsonResponse
from .models import SystemErrorLog

logger = logging.getLogger('iranswim.supervisor')

SENSITIVE_KEYS = {'password', 'token', 'access', 'refresh', 'secret', 'authorization', 'credit_card'}


def sanitize_data(data):
    """حذف فیلدهای حساس مانند رمز عبور و توکن قبل از ثبت در دیتابیس"""
    if isinstance(data, dict):
        cleaned = {}
        for k, v in data.items():
            if any(s in k.lower() for s in SENSITIVE_KEYS):
                cleaned[k] = '***REDACTED***'
            elif isinstance(v, (dict, list)):
                cleaned[k] = sanitize_data(v)
            else:
                cleaned[k] = str(v)[:200]
        return cleaned
    elif isinstance(data, list):
        return [sanitize_data(item) for item in data]
    return str(data)[:200]


class SupervisorExceptionLoggingMiddleware:
    """
    میدل‌ویر ناظر فنی:
    هر استثنای مدیریت‌نشده در سرور را به شکل امن همراه با استک‌ترس، مشخصات کاربر،
    آدرس IP و اطلاعات درخواست در دیتابیس ثبت می‌کند تا در پنل ناظر در دسترس باشد.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_exception(self, request, exception):
        try:
            tb_str = traceback.format_exc()
            exc_type = type(exception).__name__
            err_msg = str(exception)
            endpoint = request.path[:250]
            http_method = request.method[:10]

            # Get Client IP
            x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded:
                ip = x_forwarded.split(',')[0].strip()
            else:
                ip = request.META.get('REMOTE_ADDR')

            # User agent
            ua = request.META.get('HTTP_USER_AGENT', '')[:250]

            # Request body preview (safe)
            req_preview = ''
            if request.method in ['POST', 'PUT', 'PATCH']:
                try:
                    if request.content_type == 'application/json' and request.body:
                        parsed = json.loads(request.body.decode('utf-8', errors='ignore'))
                        req_preview = json.dumps(sanitize_data(parsed), ensure_ascii=False)
                    elif request.POST:
                        req_preview = json.dumps(sanitize_data(request.POST.dict()), ensure_ascii=False)
                except Exception:
                    req_preview = '(قالب داده غیرقابل پردازش)'

            user = request.user if getattr(request, 'user', None) and request.user.is_authenticated else None

            # Create error log record in DB
            log_entry = SystemErrorLog.objects.create(
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
                request_data=req_preview
            )

            logger.error(
                f"[SUPERVISOR BUG LOGGED #{log_entry.id}] {exc_type}: {err_msg} on {http_method} {endpoint}",
                exc_info=True
            )

            # If request is API call, return structured JSON error with Error Tracking ID
            if request.path.startswith('/api/'):
                return JsonResponse({
                    'detail': 'خطای غیرمنتظره‌ای در سرور رخ داده است. این رخداد با موفقیت در سامانه ناظر ثبت گردید.',
                    'error_tracking_id': log_entry.id,
                    'exception_type': exc_type
                }, status=500)

        except Exception as logger_err:
            logger.critical(f"خطا در ثبت لاگ ناظر: {logger_err}")

        return None
