from django.urls import path
from .views import CoachListView, CoachDetailView

urlpatterns = [
    path('', CoachListView.as_view(), name='coach_list'),
    path('<int:pk>/', CoachDetailView.as_view(), name='coach_detail'),
]
