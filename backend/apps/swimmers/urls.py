from django.urls import path
from .views import (
    SwimmerListView, SwimmerDetailView, SwimmerMeView,
    SwimmerCompleteProfileView, SwimmerChildrenView, SwimmerAssignCoachView,
    SwimmerReviewDocumentsView, SwimmerDocumentDownloadView,
    SwimVideoListCreateView, SwimVideoDeleteView, SwimmerMyPlansView,
    SwimmerFilterOptionsView, DossiersSummaryView
)

urlpatterns = [
    path('', SwimmerListView.as_view(), name='swimmer_list'),
    path('filter-options/', SwimmerFilterOptionsView.as_view(), name='swimmer_filter_options'),
    path('dossiers-summary/', DossiersSummaryView.as_view(), name='swimmer_dossiers_summary'),
    path('me/', SwimmerMeView.as_view(), name='swimmer_me'),
    path('me/complete/', SwimmerCompleteProfileView.as_view(), name='swimmer_complete_profile'),
    path('my-children/', SwimmerChildrenView.as_view(), name='swimmer_children'),
    path('my-plans/', SwimmerMyPlansView.as_view(), name='swimmer_my_plans'),
    path('videos/', SwimVideoListCreateView.as_view(), name='swim_video_list'),
    path('videos/<int:pk>/', SwimVideoDeleteView.as_view(), name='swim_video_delete'),
    path('<int:pk>/', SwimmerDetailView.as_view(), name='swimmer_detail'),
    path('<int:pk>/documents/<str:document_type>/', SwimmerDocumentDownloadView.as_view(), name='swimmer_document_download'),
    path('<int:pk>/assign-coach/', SwimmerAssignCoachView.as_view(), name='swimmer_assign_coach'),
    path('<int:pk>/review-documents/', SwimmerReviewDocumentsView.as_view(), name='swimmer_review_documents'),
]
