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
    # New Incident Management & Upgraded Monitoring Views
    SupervisorErrorOverviewStatsView,
    SupervisorErrorGroupListView,
    SupervisorErrorGroupDetailView,
    SupervisorErrorGroupOccurrencesView,
    SupervisorIncidentActionView,
    SupervisorInfrastructureHealthView,
    SupervisorAlertListView,
    SupervisorAlertActionView,
    SupervisorAlertRuleListView,
    SupervisorAlertRuleDetailView,
    SupervisorTechniciansListView,
    SupervisorMonitoringConfigView,
)

urlpatterns = [
    # Overview & Pulse
    path('overview/', SupervisorOverviewView.as_view(), name='supervisor_overview'),
    path('health/', SupervisorOverviewView.as_view(), name='supervisor_health'),

    # Infrastructure & Live Services Probing
    path('infrastructure/', SupervisorInfrastructureView.as_view(), name='supervisor_infrastructure'),
    path('infrastructure/live/', SupervisorInfrastructureHealthView.as_view(), name='supervisor_infrastructure_live'),
    path('services/', SupervisorServicesView.as_view(), name='supervisor_services'),

    # Error Center - Upgraded Incident Management Endpoints
    path('errors/overview/', SupervisorErrorOverviewStatsView.as_view(), name='supervisor_error_overview_stats'),
    path('errors/groups/', SupervisorErrorGroupListView.as_view(), name='supervisor_error_groups'),
    path('errors/groups/<int:pk>/', SupervisorErrorGroupDetailView.as_view(), name='supervisor_error_group_detail'),
    path('errors/groups/<int:pk>/occurrences/', SupervisorErrorGroupOccurrencesView.as_view(), name='supervisor_error_group_occurrences'),
    path('errors/groups/<int:pk>/action/', SupervisorIncidentActionView.as_view(), name='supervisor_error_group_action'),

    # Error Center - Legacy Endpoints (Preserved for compatibility)
    path('errors/', SupervisorErrorListView.as_view(), name='supervisor_errors'),
    path('errors/<int:pk>/', SupervisorErrorDetailView.as_view(), name='supervisor_error_detail'),
    path('errors/<int:pk>/resolve/', SupervisorResolveErrorView.as_view(), name='supervisor_error_resolve'),

    # Alerts & Anomaly Management
    path('alerts/', SupervisorAlertListView.as_view(), name='supervisor_alerts'),
    path('alerts/<int:pk>/action/', SupervisorAlertActionView.as_view(), name='supervisor_alert_action'),
    path('alerts/rules/', SupervisorAlertRuleListView.as_view(), name='supervisor_alert_rules'),
    path('alerts/rules/<int:pk>/', SupervisorAlertRuleDetailView.as_view(), name='supervisor_alert_rule_detail'),

    # Technicians and Operations
    path('technicians/', SupervisorTechniciansListView.as_view(), name='supervisor_technicians'),
    path('monitoring/config/', SupervisorMonitoringConfigView.as_view(), name='supervisor_monitoring_config'),

    # General Supervisor Hub Modules
    path('activity/', SupervisorUserActivityView.as_view(), name='supervisor_activity'),
    path('deployments/', SupervisorDeploymentView.as_view(), name='supervisor_deployments'),
    path('audit-logs/', SupervisorAuditLogListView.as_view(), name='supervisor_audit_logs'),
    path('backups/', SupervisorBackupView.as_view(), name='supervisor_backups'),
    path('config/', SupervisorSystemConfigView.as_view(), name='supervisor_config'),
    path('test-trigger/', SupervisorTestErrorTriggerView.as_view(), name='supervisor_test_trigger'),
]
