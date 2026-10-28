from django.urls import path
from .views import (
    SwimmerListView, SwimmerDetailView, SwimmerMeView,
    SwimmerCompleteProfileView, SwimmerChildrenView
)

urlpatterns = [
    path('', SwimmerListView.as_view(), name='swimmer_list'),
    path('me/', SwimmerMeView.as_view(), name='swimmer_me'),
    path('me/complete/', SwimmerCompleteProfileView.as_view(), name='swimmer_complete_profile'),
    path('my-children/', SwimmerChildrenView.as_view(), name='swimmer_children'),
    path('<int:pk>/', SwimmerDetailView.as_view(), name='swimmer_detail'),
]
