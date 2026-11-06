from django.urls import path
from .views import (
    SwimmerListView, SwimmerDetailView, SwimmerMeView,
    SwimmerCompleteProfileView, SwimmerChildrenView, SwimmerAssignCoachView,
    SwimmerReviewDocumentsView
)

urlpatterns = [
    path('', SwimmerListView.as_view(), name='swimmer_list'),
    path('me/', SwimmerMeView.as_view(), name='swimmer_me'),
    path('me/complete/', SwimmerCompleteProfileView.as_view(), name='swimmer_complete_profile'),
    path('my-children/', SwimmerChildrenView.as_view(), name='swimmer_children'),
    path('<int:pk>/', SwimmerDetailView.as_view(), name='swimmer_detail'),
    path('<int:pk>/assign-coach/', SwimmerAssignCoachView.as_view(), name='swimmer_assign_coach'),
    path('<int:pk>/review-documents/', SwimmerReviewDocumentsView.as_view(), name='swimmer_review_documents'),
]
