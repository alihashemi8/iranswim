from django.urls import path
from .views import (
    NewsPostListView, NewsPostDetailView, NewsImageDeleteView,
    SwimmingPoolListView, SwimmingPoolDetailView, PoolImageDeleteView, PoolReorderView,
    AnnouncementListView, AnnouncementDetailView,
    NotificationListView, NotificationMarkReadView, NotificationMarkAllReadView,
    SupportTicketListView, SupportTicketDetailView
)

urlpatterns = [
    # News & Articles
    path('news/', NewsPostListView.as_view(), name='news_list'),
    path('news/<str:slug>/', NewsPostDetailView.as_view(), name='news_detail'),
    path('news/images/<int:pk>/', NewsImageDeleteView.as_view(), name='news_image_delete'),

    # Pools & Venues
    path('pools/', SwimmingPoolListView.as_view(), name='pool_list'),
    path('pools/reorder/', PoolReorderView.as_view(), name='pool_reorder'),
    path('pools/<str:slug>/', SwimmingPoolDetailView.as_view(), name='pool_detail'),
    path('pools/images/<int:pk>/', PoolImageDeleteView.as_view(), name='pool_image_delete'),

    # Internal Communications
    path('announcements/', AnnouncementListView.as_view(), name='announcement_list'),
    path('announcements/<int:pk>/', AnnouncementDetailView.as_view(), name='announcement_detail'),
    path('notifications/', NotificationListView.as_view(), name='notification_list'),
    path('notifications/<int:pk>/read/', NotificationMarkReadView.as_view(), name='notification_mark_read'),
    path('notifications/read-all/', NotificationMarkAllReadView.as_view(), name='notification_mark_all_read'),
    path('tickets/', SupportTicketListView.as_view(), name='ticket_list'),
    path('tickets/<int:pk>/', SupportTicketDetailView.as_view(), name='ticket_detail'),
]

