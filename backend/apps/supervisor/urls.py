from django.urls import path
from .views import (
    SupervisorOverviewView,
    SupervisorInfrastructureView,
    SupervisorServicesView,
    SupervisorErrorListView,
    SupervisorErrorDetailView,
    SupervisorResolveErrorView,
    SupervisorUserActivityView,
    SupervisorDeploymentView,
    SupervisorAuditLogListView,
    SupervisorBackupView,
    SupervisorSystemConfigView,
    SupervisorTestErrorTriggerView,
)

urlpatterns = [
    path('overview/', SupervisorOverviewView.as_view(), name='supervisor_overview'),
    path('health/', SupervisorOverviewView.as_view(), name='supervisor_health'),
    path('infrastructure/', SupervisorInfrastructureView.as_view(), name='supervisor_infrastructure'),
    path('services/', SupervisorServicesView.as_view(), name='supervisor_services'),
    path('errors/', SupervisorErrorListView.as_view(), name='supervisor_errors'),
    path('errors/<int:pk>/', SupervisorErrorDetailView.as_view(), name='supervisor_error_detail'),
    path('errors/<int:pk>/resolve/', SupervisorResolveErrorView.as_view(), name='supervisor_error_resolve'),
    path('activity/', SupervisorUserActivityView.as_view(), name='supervisor_activity'),
    path('deployments/', SupervisorDeploymentView.as_view(), name='supervisor_deployments'),
    path('audit-logs/', SupervisorAuditLogListView.as_view(), name='supervisor_audit_logs'),
    path('backups/', SupervisorBackupView.as_view(), name='supervisor_backups'),
    path('config/', SupervisorSystemConfigView.as_view(), name='supervisor_config'),
    path('test-trigger/', SupervisorTestErrorTriggerView.as_view(), name='supervisor_test_trigger'),
]
