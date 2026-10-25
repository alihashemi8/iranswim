from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import League, LeagueCategory, LeagueEntry, LeagueResult
from .serializers import LeagueSerializer, LeagueCategorySerializer, LeagueEntrySerializer, LeagueResultSerializer


class LeagueListView(generics.ListCreateAPIView):
    queryset = League.objects.all().prefetch_related('categories')
    serializer_class = LeagueSerializer
    permission_classes = [permissions.AllowAny]


class LeagueDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = League.objects.all().prefetch_related('categories')
    serializer_class = LeagueSerializer
    permission_classes = [permissions.IsAuthenticated]


class LeagueLeaderboardView(APIView):
    """جدول رده‌بندی زنده و رسمی لیگ شنا بر مبنای امتیازات تأییدشده"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, league_id):
        category_id = request.query_params.get('category_id')
        entries = LeagueEntry.objects.filter(league_id=league_id, status='ACTIVE').select_related('swimmer', 'category')
        if category_id:
            entries = entries.filter(category_id=category_id)

        entries = entries.order_by('-total_points', 'registered_at')
        
        leaderboard = []
        for rank, entry in enumerate(entries, start=1):
            leaderboard.append({
                'rank': rank,
                'entry_id': entry.id,
                'swimmer_id': entry.swimmer.id,
                'swimmer_name': entry.swimmer.full_name,
                'category_title': entry.category.title,
                'total_points': float(entry.total_points),
            })

        return Response(leaderboard)
