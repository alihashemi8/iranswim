from django.urls import path
from .views import (
    SkillLevelListView, SkillListCreateView, SkillDetailView, SkillImportDefaultsView,
    CourseListView, CourseDetailView,
    SwimmerGroupListView, SwimmerGroupDetailView,
    EnrollmentRequestCreateView, EnrollmentRequestListView,
    EnrollmentRequestReviewView, EnrollmentListView, EnrollmentDetailView,
    EnrollmentAssignCoachView, GroupCoachListCreateView, GroupCoachDetailView
)

urlpatterns = [
    path('levels/', SkillLevelListView.as_view(), name='skill_level_list'),
    path('skills/', SkillListCreateView.as_view(), name='skill_list'),
    path('skills/import-defaults/', SkillImportDefaultsView.as_view(), name='skill_import_defaults'),
    path('skills/<int:pk>/', SkillDetailView.as_view(), name='skill_detail'),
    path('courses/', CourseListView.as_view(), name='course_list'),
    path('courses/<int:pk>/', CourseDetailView.as_view(), name='course_detail'),
    path('groups/', SwimmerGroupListView.as_view(), name='group_list'),
    path('groups/<int:pk>/', SwimmerGroupDetailView.as_view(), name='group_detail'),
    path('group-coaches/', GroupCoachListCreateView.as_view(), name='group_coach_list'),
    path('group-coaches/<int:pk>/', GroupCoachDetailView.as_view(), name='group_coach_detail'),
    path('requests/', EnrollmentRequestListView.as_view(), name='enrollment_request_list'),
    path('requests/submit/', EnrollmentRequestCreateView.as_view(), name='enrollment_request_create'),
    path('requests/<int:pk>/review/', EnrollmentRequestReviewView.as_view(), name='enrollment_request_review'),
    path('enrollments/', EnrollmentListView.as_view(), name='enrollment_list'),
    path('enrollments/<int:pk>/', EnrollmentDetailView.as_view(), name='enrollment_detail'),
    path('enrollments/<int:pk>/assign-coach/', EnrollmentAssignCoachView.as_view(), name='enrollment_assign_coach'),
]
