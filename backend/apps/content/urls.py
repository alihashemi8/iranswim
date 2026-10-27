from django.urls import path
from .views import (
    NewsPostListView, NewsPostDetailView, AnnouncementListView, AnnouncementDetailView,
    NotificationListView, NotificationMarkReadView, NotificationMarkAllReadView
)

urlpatterns = [
    path('news/', NewsPostListView.as_view(), name='news_list'),
    path('news/<slug:slug>/', NewsPostDetailView.as_view(), name='news_detail'),
    path('announcements/', AnnouncementListView.as_view(), name='announcement_list'),
    path('announcements/<int:pk>/', AnnouncementDetailView.as_view(), name='announcement_detail'),
    path('notifications/', NotificationListView.as_view(), name='notification_list'),
    path('notifications/<int:pk>/read/', NotificationMarkReadView.as_view(), name='notification_mark_read'),
    path('notifications/read-all/', NotificationMarkAllReadView.as_view(), name='notification_mark_all_read'),
]

