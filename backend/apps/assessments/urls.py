from django.urls import path
from .views import (
    SkillAssessmentListView, SwimmingRecordListView, VerifyRecordView,
    LevelPromotionProposalListView, LevelPromotionProposalReviewView
)

urlpatterns = [
    path('skills/', SkillAssessmentListView.as_view(), name='skill_assessment_list'),
    path('records/', SwimmingRecordListView.as_view(), name='record_list'),
    path('records/<int:pk>/verify/', VerifyRecordView.as_view(), name='record_verify'),
    path('promotions/', LevelPromotionProposalListView.as_view(), name='level_promotion_list'),
    path('promotions/<int:pk>/review/', LevelPromotionProposalReviewView.as_view(), name='level_promotion_review'),
]

