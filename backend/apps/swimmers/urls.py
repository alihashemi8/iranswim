from django.urls import path
from .views import SwimmerListView, SwimmerDetailView

urlpatterns = [
    path('', SwimmerListView.as_view(), name='swimmer_list'),
    path('<int:pk>/', SwimmerDetailView.as_view(), name='swimmer_detail'),
]
