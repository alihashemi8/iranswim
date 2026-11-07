import os
import sys
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

# Add apps directory to sys.path so modules can be imported smoothly
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / 'apps'))

from django.core.exceptions import ImproperlyConfigured

# Resolve DEBUG and ENVIRONMENT first before validating secrets
DEBUG = os.environ.get('DJANGO_DEBUG', 'True').lower() in ('true', '1', 'yes')
ENVIRONMENT = os.environ.get('DJANGO_ENV', 'development' if DEBUG else 'production').lower()

KNOWN_INSECURE_SECRET_KEYS = {
    'django-insecure-iranswim-platform-super-secret-production-key-2026',
    'changeme',
    'secret',
    'your-secret-key-here',
}

raw_secret = os.environ.get('DJANGO_SECRET_KEY')

if ENVIRONMENT == 'production' or not DEBUG:
    if (
        not raw_secret
        or not raw_secret.strip()
        or raw_secret.strip() in KNOWN_INSECURE_SECRET_KEYS
        or raw_secret.strip().startswith('django-insecure-')
    ):
        raise ImproperlyConfigured(
            'DJANGO_SECRET_KEY must be explicitly configured with a secure, non-default value in production. '
            'Missing, blank, or insecure placeholder secret keys are strictly prohibited.'
        )
    SECRET_KEY = raw_secret.strip()
else:
    # Development / Testing fallback
    SECRET_KEY = raw_secret.strip() if (raw_secret and raw_secret.strip()) else 'django-insecure-iranswim-dev-local-only-key'

# X-Accel-Redirect delivery mode for internal Nginx file serving
USE_X_ACCEL_REDIRECT = os.environ.get(
    'DJANGO_USE_X_ACCEL_REDIRECT',
    'True' if (ENVIRONMENT == 'production' and not DEBUG) else 'False'
).lower() in ('true', '1', 'yes')

# Security / OTP Policy:
# In production, OTP is strictly dispatched via SMS and never returned in API responses.
# In local development or automated test suites, DEV_OTP can be enabled for test flows.
# It is impossible to activate in production (strictly blocked when ENVIRONMENT == 'production' or DJANGO_DEBUG == 'False').
EXPOSE_DEV_OTP = (
    ENVIRONMENT != 'production' and
    DEBUG and
    os.environ.get('DJANGO_EXPOSE_DEV_OTP', 'True').lower() == 'true'
)

ALLOWED_HOSTS_ENV = os.environ.get('ALLOWED_HOSTS')
if ALLOWED_HOSTS_ENV:
    ALLOWED_HOSTS = [h.strip() for h in ALLOWED_HOSTS_ENV.split(',') if h.strip()]
else:
    ALLOWED_HOSTS = ['*']

CSRF_TRUSTED_ENV = os.environ.get('CSRF_TRUSTED_ORIGINS')
if CSRF_TRUSTED_ENV:
    CSRF_TRUSTED_ORIGINS = [orig.strip() for orig in CSRF_TRUSTED_ENV.split(',') if orig.strip()]

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

AUTH_USER_MODEL = 'accounts.User'

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party packages
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'drf_spectacular',

    # IranSwim Modular Business Apps
    'apps.accounts.apps.AccountsConfig',
    'apps.swimmers.apps.SwimmersConfig',
    'apps.coaches.apps.CoachesConfig',
    'apps.education.apps.EducationConfig',
    'apps.scheduling.apps.SchedulingConfig',
    'apps.attendance.apps.AttendanceConfig',
    'apps.finance.apps.FinanceConfig',
    'apps.assessments.apps.AssessmentsConfig',
    'apps.leagues.apps.LeaguesConfig',
    'apps.content.apps.ContentConfig',
    'apps.supervisor.apps.SupervisorConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # Site Supervisor & Bug Tracking Middleware
    'apps.supervisor.middleware.SupervisorExceptionLoggingMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database Configuration: PostgreSQL by default, with smooth SQLite fallback if env vars missing
DB_NAME = os.environ.get('POSTGRES_DB')
if DB_NAME:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': DB_NAME,
            'USER': os.environ.get('POSTGRES_USER', 'postgres'),
            'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'postgres'),
            'HOST': os.environ.get('POSTGRES_HOST', 'localhost'),
            'PORT': os.environ.get('POSTGRES_PORT', '5432'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'apps.accounts.validators.IranSwimPasswordValidator'},
]

LANGUAGE_CODE = 'fa-ir'
TIME_ZONE = 'Asia/Tehran'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# Simple JWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=14),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# CORS Configuration
CORS_ORIGINS_ENV = os.environ.get('CORS_ALLOWED_ORIGINS')
if CORS_ORIGINS_ENV:
    CORS_ALLOWED_ORIGINS = [orig.strip() for orig in CORS_ORIGINS_ENV.split(',') if orig.strip()]
    CORS_ALLOW_ALL_ORIGINS = False
else:
    CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# OpenAPI Documentation
SPECTACULAR_SETTINGS = {
    'TITLE': 'IranSwim Platform API',
    'DESCRIPTION': 'سامانه جامع مدیریت و آموزش شنا - مستندات کامل APIها و سرویس‌ها',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}
