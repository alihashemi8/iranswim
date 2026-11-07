from django.urls import path
from .views import (
    LeagueListView,
    LeagueDetailView,
    LeagueStatsView,
    LeagueLeaderboardView,
    LeagueCompetitionsView,
    LeagueCompetitionDetailView,
    RecordCompetitionResultsView,
    LeagueManualScoreView,
    LeagueScoringRulesView,
    SwimmerPerformanceDetailView,
    LeagueEnrollSwimmerView
)

urlpatterns = [
    path('', LeagueListView.as_view(), name='league_list'),
    path('<int:pk>/', LeagueDetailView.as_view(), name='league_detail'),
    path('<int:league_id>/stats/', LeagueStatsView.as_view(), name='league_stats'),
    path('<int:league_id>/leaderboard/', LeagueLeaderboardView.as_view(), name='league_leaderboard'),
    path('<int:league_id>/competitions/', LeagueCompetitionsView.as_view(), name='league_competitions'),
    path('competitions/<int:pk>/', LeagueCompetitionDetailView.as_view(), name='league_competition_detail'),
    path('competitions/<int:pk>/record_results/', RecordCompetitionResultsView.as_view(), name='record_competition_results'),
    path('competitions/<int:pk>/record-results/', RecordCompetitionResultsView.as_view(), name='record_competition_results_hyphen'),
    path('<int:league_id>/manual_score/', LeagueManualScoreView.as_view(), name='league_manual_score'),
    path('<int:league_id>/manual-score/', LeagueManualScoreView.as_view(), name='league_manual_score_hyphen'),
    path('<int:league_id>/scoring_rules/', LeagueScoringRulesView.as_view(), name='league_scoring_rules'),
    path('<int:league_id>/scoring-rules/', LeagueScoringRulesView.as_view(), name='league_scoring_rules_hyphen'),
    path('<int:league_id>/swimmer_performance/<int:swimmer_id>/', SwimmerPerformanceDetailView.as_view(), name='swimmer_performance'),
    path('<int:league_id>/swimmer-performance/<int:swimmer_id>/', SwimmerPerformanceDetailView.as_view(), name='swimmer_performance_hyphen'),
    path('<int:league_id>/enroll_swimmer/', LeagueEnrollSwimmerView.as_view(), name='league_enroll_swimmer'),
    path('<int:league_id>/enroll-swimmer/', LeagueEnrollSwimmerView.as_view(), name='league_enroll_swimmer_hyphen'),
]
