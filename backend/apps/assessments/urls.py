from django.urls import path
from .views import SkillAssessmentListView, SwimmingRecordListView, VerifyRecordView

urlpatterns = [
    path('skills/', SkillAssessmentListView.as_view(), name='skill_assessment_list'),
    path('records/', SwimmingRecordListView.as_view(), name='record_list'),
    path('records/<int:pk>/verify/', VerifyRecordView.as_view(), name='record_verify'),
]
