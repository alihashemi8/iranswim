from django.urls import path
from .views import (
    SupervisorHealthCheckView,
    SupervisorErrorListView,
    SupervisorErrorDetailView,
    SupervisorResolveErrorView,
    SupervisorTestErrorTriggerView,
    SupervisorAuditLogListView,
)

urlpatterns = [
    path('health/', SupervisorHealthCheckView.as_view(), name='supervisor_health'),
    path('errors/', SupervisorErrorListView.as_view(), name='supervisor_errors'),
    path('errors/<int:pk>/', SupervisorErrorDetailView.as_view(), name='supervisor_error_detail'),
    path('errors/<int:pk>/resolve/', SupervisorResolveErrorView.as_view(), name='supervisor_error_resolve'),
    path('test-trigger/', SupervisorTestErrorTriggerView.as_view(), name='supervisor_test_trigger'),
    path('audit-logs/', SupervisorAuditLogListView.as_view(), name='supervisor_audit_logs'),
]
