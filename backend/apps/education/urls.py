from django.urls import path
from .views import (
    SkillLevelListView, CourseListView, CourseDetailView,
    SwimmerGroupListView, SwimmerGroupDetailView,
    EnrollmentRequestCreateView, EnrollmentRequestListView,
    EnrollmentRequestReviewView, EnrollmentListView
)

urlpatterns = [
    path('levels/', SkillLevelListView.as_view(), name='skill_level_list'),
    path('courses/', CourseListView.as_view(), name='course_list'),
    path('courses/<int:pk>/', CourseDetailView.as_view(), name='course_detail'),
    path('groups/', SwimmerGroupListView.as_view(), name='group_list'),
    path('groups/<int:pk>/', SwimmerGroupDetailView.as_view(), name='group_detail'),
    path('requests/', EnrollmentRequestListView.as_view(), name='enrollment_request_list'),
    path('requests/submit/', EnrollmentRequestCreateView.as_view(), name='enrollment_request_create'),
    path('requests/<int:pk>/review/', EnrollmentRequestReviewView.as_view(), name='enrollment_request_review'),
    path('enrollments/', EnrollmentListView.as_view(), name='enrollment_list'),
]
