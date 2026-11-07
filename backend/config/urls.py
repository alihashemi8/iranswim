from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponseNotFound
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


def block_sensitive_documents_direct_access(request, subpath=None):
    """
    مسدودسازی قطعی دسترسی مستقیم عمومی به مدارک هویتی در سطح وب‌سرور/جنگو
    """
    return HttpResponseNotFound("Not Found")


urlpatterns = [
    # Block direct public access to sensitive swimmer documents
    path('media/swimmers/documents/<path:subpath>', block_sensitive_documents_direct_access),

    path('admin/', admin.site.urls),

    # OpenAPI Schema & Swagger Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # Modular IranSwim API endpoints
    path('api/auth/', include('apps.accounts.urls')),
    path('api/supervisor/', include('apps.supervisor.urls')),
    path('api/swimmers/', include('apps.swimmers.urls')),
    path('api/coaches/', include('apps.coaches.urls')),
    path('api/education/', include('apps.education.urls')),
    path('api/scheduling/', include('apps.scheduling.urls')),
    path('api/attendance/', include('apps.attendance.urls')),
    path('api/finance/', include('apps.finance.urls')),
    path('api/assessments/', include('apps.assessments.urls')),
    path('api/leagues/', include('apps.leagues.urls')),
    path('api/content/', include('apps.content.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
