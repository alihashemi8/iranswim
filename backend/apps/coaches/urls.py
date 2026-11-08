from django.urls import path
from .views import (
    CoachDashboardOverviewView, CoachMyClassesView, CoachClassDetailView,
    CoachSwimmerDossierView, CoachWorkoutPlanListView, CoachWorkoutPlanDetailView,
    CoachAIAssistantView, CoachMessagesView, CoachReorderView
)
from .hr_views import (
    CoachStatisticsView, CoachListHRView, CoachDetailHRView,
    CoachChangeStatusView, CoachCertificateListCreateView, CoachCertificateDetailView,
    CoachContractListCreateView, CoachContractDetailView, CoachContractRenewView,
    CoachPayrollListCreateView, CoachPayrollDetailView, CoachPayrollApproveView,
    PayrollAdjustmentCreateView, CoachPaymentCreateView, CoachPaymentReverseView,
    CoachLeaveRequestListCreateView, CoachLeaveRequestReviewView,
    CoachPerformanceEvaluationListCreateView, CoachPerformanceEvaluationDetailView,
    CoachAdministrativeNoteListCreateView, CoachActivityTimelineView,
    CoachAttendanceSummaryView, CoachScheduleView, CoachHRReportsView
)

urlpatterns = [
    # 1. HR Statistics & Management Overview
    path('statistics/', CoachStatisticsView.as_view(), name='coach_statistics'),
    path('reports/', CoachHRReportsView.as_view(), name='coach_hr_reports'),
    path('reorder/', CoachReorderView.as_view(), name='coach_reorder'),

    # 2. Coach Portal dedicated endpoints (Preserved)
    path('dashboard-overview/', CoachDashboardOverviewView.as_view(), name='coach_dashboard_overview'),
    path('my-classes/', CoachMyClassesView.as_view(), name='coach_my_classes'),
    path('my-classes/<int:pk>/', CoachClassDetailView.as_view(), name='coach_class_detail'),
    path('swimmer-dossier/<int:pk>/', CoachSwimmerDossierView.as_view(), name='coach_swimmer_dossier'),
    path('workouts/', CoachWorkoutPlanListView.as_view(), name='coach_workouts_list'),
    path('workouts/<int:pk>/', CoachWorkoutPlanDetailView.as_view(), name='coach_workout_detail'),
    path('ai/assist/', CoachAIAssistantView.as_view(), name='coach_ai_assist'),
    path('messages/', CoachMessagesView.as_view(), name='coach_messages'),

    # 3. Contract Management
    path('contracts/<int:contract_id>/renew/', CoachContractRenewView.as_view(), name='coach_contract_renew'),
    path('contracts/<int:pk>/', CoachContractDetailView.as_view(), name='coach_contract_detail'),

    # 4. Payroll & Payment Management
    path('payrolls/<int:payroll_id>/approve/', CoachPayrollApproveView.as_view(), name='coach_payroll_approve'),
    path('payrolls/<int:payroll_id>/adjustments/', PayrollAdjustmentCreateView.as_view(), name='coach_payroll_adjustments'),
    path('payrolls/<int:payroll_id>/payments/', CoachPaymentCreateView.as_view(), name='coach_payroll_payments'),
    path('payrolls/<int:pk>/', CoachPayrollDetailView.as_view(), name='coach_payroll_detail'),
    path('payments/<int:payment_id>/reverse/', CoachPaymentReverseView.as_view(), name='coach_payment_reverse'),

    # 5. Certificates & Leaves & Evaluations Sub-routes
    path('certificates/<int:pk>/', CoachCertificateDetailView.as_view(), name='coach_certificate_detail'),
    path('leave-requests/<int:leave_id>/review/', CoachLeaveRequestReviewView.as_view(), name='coach_leave_review'),
    path('evaluations/<int:pk>/', CoachPerformanceEvaluationDetailView.as_view(), name='coach_evaluation_detail'),

    # 6. Coach Profile & Sub-modules
    path('<int:pk>/change-status/', CoachChangeStatusView.as_view(), name='coach_change_status'),
    path('<int:pk>/certificates/', CoachCertificateListCreateView.as_view(), name='coach_certificates'),
    path('<int:pk>/contracts/', CoachContractListCreateView.as_view(), name='coach_contracts'),
    path('<int:pk>/payrolls/', CoachPayrollListCreateView.as_view(), name='coach_payrolls'),
    path('<int:pk>/leave-requests/', CoachLeaveRequestListCreateView.as_view(), name='coach_leave_requests'),
    path('<int:pk>/evaluations/', CoachPerformanceEvaluationListCreateView.as_view(), name='coach_evaluations'),
    path('<int:pk>/administrative-notes/', CoachAdministrativeNoteListCreateView.as_view(), name='coach_admin_notes'),
    path('<int:pk>/activity-timeline/', CoachActivityTimelineView.as_view(), name='coach_activity_timeline'),
    path('<int:pk>/attendance-summary/', CoachAttendanceSummaryView.as_view(), name='coach_attendance_summary'),
    path('<int:pk>/schedule/', CoachScheduleView.as_view(), name='coach_schedule_details'),

    # 7. Main Profile List and Detail
    path('', CoachListHRView.as_view(), name='coach_list'),
    path('<int:pk>/', CoachDetailHRView.as_view(), name='coach_detail'),
]
