from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from django.views.generic import TemplateView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
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

    # Media files (always accessible in production or dev)
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),

    # Frontend React SPA Catch-all (serves index.html for all client-side routes)
    re_path(r'^(?!api/|admin/|static/|media/).*$', TemplateView.as_view(template_name='index.html'), name='frontend-spa'),
]
