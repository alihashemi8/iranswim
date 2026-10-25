from django.urls import path
from .views import ClassSessionListView, ClassSessionDetailView, CancelSessionView

urlpatterns = [
    path('sessions/', ClassSessionListView.as_view(), name='session_list'),
    path('sessions/<int:pk>/', ClassSessionDetailView.as_view(), name='session_detail'),
    path('sessions/<int:pk>/cancel/', CancelSessionView.as_view(), name='session_cancel'),
]
