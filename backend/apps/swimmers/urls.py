from django.urls import path
from .views import SwimmerListView, SwimmerDetailView, SwimmerMeView, SwimmerCompleteProfileView

urlpatterns = [
    path('', SwimmerListView.as_view(), name='swimmer_list'),
    path('me/', SwimmerMeView.as_view(), name='swimmer_me'),
    path('me/complete/', SwimmerCompleteProfileView.as_view(), name='swimmer_complete_profile'),
    path('<int:pk>/', SwimmerDetailView.as_view(), name='swimmer_detail'),
]
