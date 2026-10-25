from django.urls import path
from .views import NewsPostListView, NewsPostDetailView, AnnouncementListView

urlpatterns = [
    path('news/', NewsPostListView.as_view(), name='news_list'),
    path('news/<slug:slug>/', NewsPostDetailView.as_view(), name='news_detail'),
    path('announcements/', AnnouncementListView.as_view(), name='announcement_list'),
]
