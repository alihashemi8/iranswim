import re
import hashlib
from typing import Dict, Any, List, Optional
from .models import ErrorSeverity, ErrorCategory


UUID_REGEX = re.compile(r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}')
ID_REGEX = re.compile(r'/(\d+)(/|$)')
QUERY_STRIP_REGEX = re.compile(r'\?.*$')


def normalize_endpoint(endpoint: str) -> str:
    """
    مسیر اندپوینت را نرمال‌سازی می‌کند تا شناسه‌های داینامیک باعث تفکیک خطای یکسان نشوند.
    مثال: /api/auth/users/42/ -> /api/auth/users/{id}/
    """
    if not endpoint:
        return '/'
    path = QUERY_STRIP_REGEX.sub('', endpoint.strip())
    path = UUID_REGEX.sub('{uuid}', path)
    path = ID_REGEX.sub(r'/{id}\2', path)
    return path[:250]


def extract_code_location(stack_trace: str) -> Dict[str, Any]:
    """
    استخراج محل دقیق رخداد خطا (مسیر فایل، خط و تابع) از استک‌ترس
    """
    if not stack_trace:
        return {
            'file_path': 'unknown',
            'line_number': 0,
            'function_name': 'unknown',
            'code_snippet': ''
        }

    lines = stack_trace.strip().splitlines()
    app_frame = None
    last_frame = None

    frame_pattern = re.compile(r'File "([^"]+)", line (\d+), in (.*)')

    for i, line in enumerate(lines):
        match = frame_pattern.search(line)
        if match:
            file_path, line_no, func_name = match.groups()
            code_line = lines[i + 1].strip() if i + 1 < len(lines) else ''
            frame_info = {
                'file_path': file_path,
                'line_number': int(line_no),
                'function_name': func_name,
                'code_snippet': code_line
            }
            last_frame = frame_info
            if 'apps/' in file_path or 'iranswim' in file_path:
                app_frame = frame_info

    # Prefer app frame over django internals frame
    target = app_frame or last_frame or {
        'file_path': 'unknown',
        'line_number': 0,
        'function_name': 'unknown',
        'code_snippet': ''
    }
    return target


def parse_stack_trace_frames(stack_trace: str) -> List[Dict[str, Any]]:
    """
    تفکیک تمام فریم‌های استک‌ترس به ساختار JSON جهت نمایش پیشرفته و های‌لایت کد در فرانت‌اند
    """
    if not stack_trace:
        return []

    frames = []
    lines = stack_trace.strip().splitlines()
    frame_pattern = re.compile(r'File "([^"]+)", line (\d+), in (.*)')

    for i, line in enumerate(lines):
        match = frame_pattern.search(line)
        if match:
            file_path, line_no, func_name = match.groups()
            code_line = lines[i + 1].strip() if i + 1 < len(lines) and not lines[i + 1].strip().startswith('File ') else ''
            is_in_app = ('apps/' in file_path or 'backend' in file_path) and ('site-packages' not in file_path)
            frames.append({
                'file_path': file_path,
                'file_name': file_path.replace('\\', '/').split('/')[-1],
                'line_number': int(line_no),
                'function_name': func_name,
                'code_snippet': code_line,
                'is_in_app': is_in_app
            })
    return frames


def generate_error_fingerprint(
    exception_type: str,
    endpoint: str,
    stack_trace: str,
    error_message: str = ''
) -> str:
    """
    محاسبه اثرانگشت استوار (Stable Fingerprint) بر اساس:
    نوع استثنا، اندپوینت نرمال‌شده و فریم اصلی محل رخداد باگ.
    """
    norm_ep = normalize_endpoint(endpoint)
    loc = extract_code_location(stack_trace)
    file_name = loc['file_path'].replace('\\', '/').split('/')[-1]
    func_name = loc['function_name']
    exc_type = (exception_type or 'Exception').strip()

    fingerprint_raw = f"{exc_type}|{norm_ep}|{file_name}|{func_name}"
    return hashlib.sha256(fingerprint_raw.encode('utf-8')).hexdigest()


def determine_error_severity(exception_type: str, status_code: int, endpoint: str) -> str:
    """
    تعیین خودکار سطح اهمیت و شدت خطا بر اساس نوع استثنا و کد وضعیت HTTP
    """
    critical_exceptions = {
        'DatabaseError', 'OperationalError', 'ProgrammingError', 'IntegrityError',
        'MemoryError', 'SystemExit', 'ConnectionRefusedError', 'RedisError',
        'ImproperlyConfigured', 'FatalAlert'
    }
    if exception_type in critical_exceptions or status_code >= 503:
        return ErrorSeverity.CRITICAL

    if status_code == 500:
        return ErrorSeverity.HIGH

    if status_code in (401, 403):
        return ErrorSeverity.MEDIUM

    if status_code in (400, 404, 422):
        return ErrorSeverity.LOW

    return ErrorSeverity.MEDIUM


def determine_error_category(exception_type: str, endpoint: str, error_message: str = '') -> str:
    """
    تشخیص هوشمند دسته‌بندی باگ بر اساس مسیر و ماهیت خطا
    """
    ep_lower = (endpoint or '').lower()
    msg_lower = (error_message or '').lower()
    exc_lower = (exception_type or '').lower()

    if any(k in ep_lower for k in ['auth', 'login', 'token', 'otp', 'jwt', 'permission']) or \
       any(k in exc_lower for k in ['permissiondenied', 'authenticationfailed', 'notauthenticated']):
        return ErrorCategory.AUTHENTICATION

    if any(k in exc_lower for k in ['database', 'operationalerror', 'integrityerror', 'doesnotexist', 'multipleobjectsreturned']) or \
       any(k in msg_lower for k in ['database', 'sql', 'foreign key', 'unique constraint', 'deadlock']):
        return ErrorCategory.DATABASE

    if any(k in exc_lower for k in ['connection', 'timeout', 'redis', 'network', 'socket']) or \
       any(k in ep_lower for k in ['health', 'infrastructure', 'services']):
        return ErrorCategory.INFRASTRUCTURE

    if any(k in ep_lower for k in ['task', 'celery', 'job']) or \
       any(k in msg_lower for k in ['celery', 'kombu', 'amqp', 'worker', 'broker']):
        return ErrorCategory.BACKGROUND_TASKS

    if any(k in exc_lower for k in ['validationerror', 'parseerror', 'badrequest']):
        return ErrorCategory.FRONTEND

    if any(k in ep_lower for k in ['finance', 'payment', 'enrollment', 'league', 'swimmer', 'attendance']):
        return ErrorCategory.BUSINESS_LOGIC

    return ErrorCategory.API
