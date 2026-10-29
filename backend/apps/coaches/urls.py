from django.urls import path
from .views import (
    CoachListView, CoachDetailView, CoachDashboardOverviewView,
    CoachMyClassesView, CoachClassDetailView, CoachSwimmerDossierView,
    CoachWorkoutPlanListView, CoachWorkoutPlanDetailView,
    CoachAIAssistantView, CoachMessagesView
)

urlpatterns = [
    # Coach Panel dedicated endpoints
    path('dashboard-overview/', CoachDashboardOverviewView.as_view(), name='coach_dashboard_overview'),
    path('my-classes/', CoachMyClassesView.as_view(), name='coach_my_classes'),
    path('my-classes/<int:pk>/', CoachClassDetailView.as_view(), name='coach_class_detail'),
    path('swimmer-dossier/<int:pk>/', CoachSwimmerDossierView.as_view(), name='coach_swimmer_dossier'),
    path('workouts/', CoachWorkoutPlanListView.as_view(), name='coach_workouts_list'),
    path('workouts/<int:pk>/', CoachWorkoutPlanDetailView.as_view(), name='coach_workout_detail'),
    path('ai/assist/', CoachAIAssistantView.as_view(), name='coach_ai_assist'),
    path('messages/', CoachMessagesView.as_view(), name='coach_messages'),

    # General / Admin endpoints
    path('', CoachListView.as_view(), name='coach_list'),
    path('<int:pk>/', CoachDetailView.as_view(), name='coach_detail'),
]
