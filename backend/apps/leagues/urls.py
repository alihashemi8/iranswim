from django.urls import path
from .views import LeagueListView, LeagueDetailView, LeagueLeaderboardView

urlpatterns = [
    path('', LeagueListView.as_view(), name='league_list'),
    path('<int:pk>/', LeagueDetailView.as_view(), name='league_detail'),
    path('<int:league_id>/leaderboard/', LeagueLeaderboardView.as_view(), name='league_leaderboard'),
]
