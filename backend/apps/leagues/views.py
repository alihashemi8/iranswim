from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from decimal import Decimal
from datetime import date

from .models import League, LeagueCategory, LeagueCompetition, LeagueEntry, LeagueResult
from .serializers import (
    LeagueSerializer,
    LeagueCategorySerializer,
    LeagueCompetitionSerializer,
    LeagueEntrySerializer,
    LeagueResultSerializer
)
from apps.swimmers.models import SwimmerProfile
from apps.swimmers.utils import get_accessible_swimmer_ids
from apps.assessments.models import SwimmingRecord
from apps.accounts.permissions import IsAdminUserRole


class LeagueListView(generics.ListCreateAPIView):
    queryset = League.objects.all().prefetch_related('categories', 'competitions', 'entries')
    serializer_class = LeagueSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [IsAdminUserRole()]

    def perform_create(self, serializer):
        league = serializer.save()
        # Create default categories if none provided
        LeagueCategory.objects.create(
            league=league,
            title='رده سنی عمومی پسران',
            age_min=6,
            age_max=25,
            gender=LeagueCategory.Gender.MALE
        )
        LeagueCategory.objects.create(
            league=league,
            title='رده سنی عمومی دختران',
            age_min=6,
            age_max=25,
            gender=LeagueCategory.Gender.FEMALE
        )


class LeagueDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = League.objects.all().prefetch_related('categories', 'competitions', 'entries')
    serializer_class = LeagueSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [IsAdminUserRole()]


class LeagueStatsView(APIView):
    """داشبورد آماری لیگ شامل شرکت‌کنندگان، مسابقات، رویدادهای پیش‌رو و رکوردها"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, league_id):
        league = get_object_or_404(League, id=league_id)
        
        participants_count = league.entries.filter(status=LeagueEntry.Status.ACTIVE).count()
        completed_competitions_count = league.competitions.filter(status=LeagueCompetition.Status.COMPLETED).count()
        upcoming_competitions_count = league.competitions.filter(
            status__in=[LeagueCompetition.Status.SCHEDULED, LeagueCompetition.Status.IN_PROGRESS]
        ).count()
        
        # Records count: results that have a valid recorded time or link to SwimmingRecord
        records_count = LeagueResult.objects.filter(
            entry__league=league,
            duration_seconds__isnull=False
        ).count()
        
        # Total points sum
        total_points = float(league.entries.aggregate(s=Sum('total_points'))['s'] or 0)

        # Top 3 podium swimmers
        top_entries = league.entries.filter(status=LeagueEntry.Status.ACTIVE).order_by('-total_points')[:3]
        podium = [
            {
                'rank': idx + 1,
                'swimmer_id': e.swimmer.id,
                'swimmer_name': e.swimmer.full_name,
                'total_points': float(e.total_points),
                'gold_medals': e.gold_medals,
            }
            for idx, e in enumerate(top_entries)
        ]

        return Response({
            'league_id': league.id,
            'league_name': league.name,
            'season': league.season,
            'status': league.status,
            'participants_count': participants_count,
            'completed_competitions_count': completed_competitions_count,
            'upcoming_competitions_count': upcoming_competitions_count,
            'total_records_count': records_count,
            'total_points_sum': total_points,
            'podium': podium,
        })


class LeagueLeaderboardView(APIView):
    """جدول رده‌بندی زنده و رسمی لیگ شنا همراه با آمار مدال‌ها، روند و فیلترها"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, league_id):
        league = get_object_or_404(League, id=league_id)
        params = getattr(request, 'query_params', request.GET)
        category_id = params.get('category_id')
        gender = params.get('gender')
        search = params.get('search')

        user = getattr(request, 'user', None)
        is_privileged = bool(
            user and user.is_authenticated and
            (user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser)
        )

        entries = LeagueEntry.objects.filter(
            league=league,
            status=LeagueEntry.Status.ACTIVE
        ).select_related('swimmer', 'category').prefetch_related('results')

        if category_id:
            entries = entries.filter(category_id=category_id)
        if gender:
            entries = entries.filter(swimmer__gender=gender)
        if search:
            search_q = (
                Q(swimmer__first_name__icontains=search) |
                Q(swimmer__last_name__icontains=search)
            )
            if is_privileged:
                search_q = search_q | Q(swimmer__national_id__icontains=search)
            entries = entries.filter(search_q)

        entries = entries.order_by('-total_points', 'registered_at')

        leaderboard = []
        for rank, entry in enumerate(entries, start=1):
            swimmer = entry.swimmer
            avatar_url = swimmer.avatar.url if swimmer.avatar else None
            if avatar_url and request:
                avatar_url = request.build_absolute_uri(avatar_url)

            row = {
                'rank': rank,
                'entry_id': entry.id,
                'swimmer_id': swimmer.id,
                'swimmer_name': swimmer.full_name,
                'swimmer_avatar': avatar_url,
                'gender': swimmer.gender,
                'gender_display': swimmer.get_gender_display() if hasattr(swimmer, 'get_gender_display') else swimmer.gender,
                'category_id': entry.category.id,
                'category_title': entry.category.title,
                'matches_count': entry.matches_count,
                'gold_medals': entry.gold_medals,
                'silver_medals': entry.silver_medals,
                'bronze_medals': entry.bronze_medals,
                'total_points': float(entry.total_points),
                'rank_trend': entry.rank_trend,
                'status': entry.status,
            }
            if is_privileged:
                age = None
                if swimmer.date_of_birth:
                    today = date.today()
                    age = today.year - swimmer.date_of_birth.year - (
                        (today.month, today.day) < (swimmer.date_of_birth.month, swimmer.date_of_birth.day)
                    )
                row['age'] = age

            leaderboard.append(row)

        return Response(leaderboard)


class LeagueCompetitionsView(generics.ListCreateAPIView):
    serializer_class = LeagueCompetitionSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        league_id = self.kwargs['league_id']
        qs = LeagueCompetition.objects.filter(league_id=league_id).select_related('category', 'league').prefetch_related('results__entry__swimmer')
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    def perform_create(self, serializer):
        league = get_object_or_404(League, id=self.kwargs['league_id'])
        serializer.save(league=league)


class LeagueCompetitionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = LeagueCompetition.objects.all().select_related('category', 'league').prefetch_related('results__entry__swimmer')
    serializer_class = LeagueCompetitionSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [IsAdminUserRole()]


class RecordCompetitionResultsView(APIView):
    """
    ثبت نتایج مسابقه، رتبه‌بندی زمانی خودکار، محاسبه امتیازات لیگ و اهدای مدال‌ها
    """
    permission_classes = [IsAdminUserRole]

    def post(self, request, pk):
        competition = get_object_or_404(LeagueCompetition.objects.select_related('league'), pk=pk)
        league = competition.league
        scoring_rules = league.scoring_rules or {}

        # Default rules
        rank_1_pts = Decimal(str(scoring_rules.get('rank_1', 10)))
        rank_2_pts = Decimal(str(scoring_rules.get('rank_2', 7)))
        rank_3_pts = Decimal(str(scoring_rules.get('rank_3', 5)))
        rank_4_pts = Decimal(str(scoring_rules.get('rank_4', 3)))
        rank_5_pts = Decimal(str(scoring_rules.get('rank_5', 2)))
        part_pts = Decimal(str(scoring_rules.get('participation', 1)))

        results_data = request.data.get('results', [])
        if not results_data:
            return Response({'error': 'هیچ رکوردی برای ثبت ارسال نشده است.'}, status=status.HTTP_400_BAD_REQUEST)

        # Parse and sort valid duration results
        valid_items = []
        for item in results_data:
            swimmer_id = item.get('swimmer_id')
            raw_time = item.get('duration_seconds')
            notes = item.get('notes', '')
            if not swimmer_id or raw_time is None:
                continue
            try:
                dur = Decimal(str(raw_time))
                if dur > 0:
                    valid_items.append({
                        'swimmer_id': int(swimmer_id),
                        'duration_seconds': dur,
                        'notes': notes
                    })
            except (ValueError, TypeError):
                continue

        # Sort by duration ascending (fastest first)
        valid_items.sort(key=lambda x: x['duration_seconds'])

        created_results = []
        for index, item in enumerate(valid_items):
            rank_num = index + 1
            swimmer = get_object_or_404(SwimmerProfile, id=item['swimmer_id'])

            # Determine Points and Medals
            if rank_num == 1:
                score = rank_1_pts
                medal = LeagueResult.Medal.GOLD
            elif rank_num == 2:
                score = rank_2_pts
                medal = LeagueResult.Medal.SILVER
            elif rank_num == 3:
                score = rank_3_pts
                medal = LeagueResult.Medal.BRONZE
            elif rank_num == 4:
                score = rank_4_pts
                medal = LeagueResult.Medal.NONE
            elif rank_num == 5:
                score = rank_5_pts
                medal = LeagueResult.Medal.NONE
            else:
                score = part_pts
                medal = LeagueResult.Medal.NONE

            # Ensure Swimmer is enrolled in this League
            entry = LeagueEntry.objects.filter(league=league, swimmer=swimmer).first()
            if not entry:
                # Find or assign category
                category = competition.category
                if not category:
                    category = league.categories.filter(
                        Q(gender=swimmer.gender) | Q(gender=LeagueCategory.Gender.ALL)
                    ).first()
                if not category:
                    category = LeagueCategory.objects.create(
                        league=league,
                        title=f"رده عمومی {swimmer.get_gender_display()}",
                        age_min=6,
                        age_max=30,
                        gender=swimmer.gender
                    )

                entry = LeagueEntry.objects.create(
                    league=league,
                    category=category,
                    swimmer=swimmer,
                    total_points=Decimal('0.00'),
                    status=LeagueEntry.Status.ACTIVE
                )

            # Create or update SwimmingRecord in assessments
            swimming_record = SwimmingRecord.objects.create(
                swimmer=swimmer,
                stroke=competition.stroke,
                distance_meters=competition.distance_meters,
                duration_seconds=item['duration_seconds'],
                recorded_at=competition.held_at,
                verification_status=SwimmingRecord.VerificationStatus.VERIFIED,
                notes=f"مسابقه لیگ: {competition.title} (رتبه {rank_num})"
            )

            # Update or create LeagueResult
            league_res, created = LeagueResult.objects.update_or_create(
                entry=entry,
                competition=competition,
                defaults={
                    'event_name': competition.title,
                    'duration_seconds': item['duration_seconds'],
                    'rank': rank_num,
                    'medal': medal,
                    'score_points': score,
                    'swimming_record': swimming_record,
                    'recorded_at': competition.held_at,
                    'notes': item.get('notes', ''),
                    'is_manual': False,
                }
            )
            created_results.append(league_res)

        # Mark competition as completed
        competition.status = LeagueCompetition.Status.COMPLETED
        competition.save()

        # Recalculate points for all league entries
        league.recalculate_all_entries()

        return Response({
            'message': f'نتایج مسابقه با موفقیت برای {len(created_results)} شناگر ثبت شد و امتیازات لیگ محاسبه گردید.',
            'competition_id': competition.id,
            'status': competition.status,
            'results_count': len(created_results)
        })


class LeagueManualScoreView(APIView):
    """ثبت امتیاز دستی / تشویقی / انضباطی با ذکر دلیل برای شناگر"""
    permission_classes = [IsAdminUserRole]

    def post(self, request, league_id):
        league = get_object_or_404(League, id=league_id)
        swimmer_id = request.data.get('swimmer_id')
        score_points = request.data.get('score_points')
        event_name = request.data.get('event_name', 'امتیاز ویژه / تشویقی مدیر')
        notes = request.data.get('notes', '')

        if not swimmer_id or score_points is None:
            return Response({'error': 'شناگر و مقدار امتیاز الزامی هستند.'}, status=status.HTTP_400_BAD_REQUEST)

        swimmer = get_object_or_404(SwimmerProfile, id=swimmer_id)
        entry = LeagueEntry.objects.filter(league=league, swimmer=swimmer).first()
        if not entry:
            category = league.categories.first()
            if not category:
                category = LeagueCategory.objects.create(
                    league=league,
                    title='رده عمومی',
                    age_min=6,
                    age_max=30
                )
            entry = LeagueEntry.objects.create(
                league=league,
                category=category,
                swimmer=swimmer,
                total_points=Decimal('0.00')
            )

        result = LeagueResult.objects.create(
            entry=entry,
            event_name=event_name,
            score_points=Decimal(str(score_points)),
            recorded_at=date.today(),
            is_manual=True,
            notes=notes
        )

        return Response({
            'message': f'امتیاز {score_points} با موفقیت برای شناگر {swimmer.full_name} ثبت شد.',
            'swimmer_name': swimmer.full_name,
            'total_points': float(entry.total_points)
        })


class LeagueScoringRulesView(APIView):
    """مشاهده و ویرایش قوانین و جدول امتیازدهی لیگ"""
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [IsAdminUserRole()]

    def get(self, request, league_id):
        league = get_object_or_404(League, id=league_id)
        return Response({
            'league_id': league.id,
            'league_name': league.name,
            'scoring_rules': league.scoring_rules,
            'rules_description': league.rules_description
        })

    def patch(self, request, league_id):
        league = get_object_or_404(League, id=league_id)
        scoring_rules = request.data.get('scoring_rules')
        rules_description = request.data.get('rules_description')

        if scoring_rules is not None:
            league.scoring_rules = scoring_rules
        if rules_description is not None:
            league.rules_description = rules_description
        league.save()

        # Recalculate points if requested
        if request.data.get('recalculate', False):
            league.recalculate_all_entries()

        return Response({
            'message': 'قوانین امتیازدهی با موفقیت به‌روزرسانی شد.',
            'scoring_rules': league.scoring_rules,
            'rules_description': league.rules_description
        })


class SwimmerPerformanceDetailView(APIView):
    """جزئیات کامل عملکرد شناگر در فصل، رکوردها، مسابقات و نمودار پیشرفت"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, league_id, swimmer_id):
        league = get_object_or_404(League, id=league_id)
        swimmer = get_object_or_404(SwimmerProfile, id=swimmer_id)

        user = request.user
        is_privileged = bool(user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser)
        if not is_privileged:
            allowed_ids = get_accessible_swimmer_ids(user, request) or []
            if swimmer.id not in allowed_ids:
                return Response(
                    {'detail': 'شما مجاز به مشاهده جزئیات عملکرد این شناگر نیستید.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        entry = LeagueEntry.objects.filter(league=league, swimmer=swimmer).first()

        # Determine rank
        rank = None
        if entry:
            better_count = LeagueEntry.objects.filter(
                league=league,
                status=LeagueEntry.Status.ACTIVE,
                total_points__gt=entry.total_points
            ).count()
            rank = better_count + 1

        # All results in this league
        results_qs = LeagueResult.objects.filter(entry__league=league, entry__swimmer=swimmer).order_by('recorded_at', 'id')
        
        results_data = []
        chart_data = []
        cumulative_points = Decimal('0.00')

        for r in results_qs:
            cumulative_points += r.score_points
            results_data.append({
                'id': r.id,
                'event_name': r.event_name,
                'competition_title': r.competition.title if r.competition else None,
                'duration_seconds': float(r.duration_seconds) if r.duration_seconds else None,
                'formatted_time': r.formatted_time,
                'rank': r.rank,
                'medal': r.medal,
                'score_points': float(r.score_points),
                'is_manual': r.is_manual,
                'recorded_at': r.recorded_at.isoformat(),
                'notes': r.notes
            })
            chart_data.append({
                'label': r.recorded_at.strftime('%m/%d'),
                'value': float(cumulative_points)
            })

        # Personal Best times for this swimmer
        personal_bests = []
        best_records = SwimmingRecord.objects.filter(
            swimmer=swimmer,
            verification_status=SwimmingRecord.VerificationStatus.VERIFIED
        ).order_by('stroke', 'distance_meters', 'duration_seconds')

        seen_events = set()
        for rec in best_records:
            key = (rec.stroke, rec.distance_meters)
            if key not in seen_events:
                seen_events.add(key)
                personal_bests.append({
                    'stroke': rec.stroke,
                    'stroke_display': rec.get_stroke_display(),
                    'distance_meters': rec.distance_meters,
                    'duration_seconds': float(rec.duration_seconds),
                    'formatted_time': rec.formatted_time,
                    'recorded_at': rec.recorded_at.isoformat()
                })

        avatar_url = swimmer.avatar.url if swimmer.avatar else None
        if avatar_url and request:
            avatar_url = request.build_absolute_uri(avatar_url)

        swimmer_info = {
            'id': swimmer.id,
            'full_name': swimmer.full_name,
            'avatar': avatar_url,
            'gender': swimmer.gender,
            'gender_display': swimmer.get_gender_display(),
        }
        if is_privileged:
            swimmer_info['national_id'] = swimmer.national_id
            swimmer_info['date_of_birth'] = swimmer.date_of_birth.isoformat() if swimmer.date_of_birth else None

        return Response({
            'swimmer': swimmer_info,
            'league': {
                'id': league.id,
                'name': league.name,
                'season': league.season,
            },
            'entry': {
                'id': entry.id if entry else None,
                'category_title': entry.category.title if entry else 'نامشخص',
                'rank': rank,
                'total_points': float(entry.total_points) if entry else 0.0,
                'gold_medals': entry.gold_medals if entry else 0,
                'silver_medals': entry.silver_medals if entry else 0,
                'bronze_medals': entry.bronze_medals if entry else 0,
                'matches_count': entry.matches_count if entry else 0,
            },
            'chart_data': chart_data,
            'personal_bests': personal_bests,
            'results': results_data
        })


class LeagueEnrollSwimmerView(APIView):
    """ثبت‌نام مستقیم شناگر در یک رده از لیگ"""
    permission_classes = [IsAdminUserRole]

    def post(self, request, league_id):
        league = get_object_or_404(League, id=league_id)
        swimmer_id = request.data.get('swimmer_id')
        category_id = request.data.get('category_id')

        if not swimmer_id:
            return Response({'error': 'شناگر انتخاب نشده است.'}, status=status.HTTP_400_BAD_REQUEST)

        swimmer = get_object_or_404(SwimmerProfile, id=swimmer_id)

        if category_id:
            category = get_object_or_404(LeagueCategory, id=category_id, league=league)
        else:
            category = league.categories.filter(
                Q(gender=swimmer.gender) | Q(gender=LeagueCategory.Gender.ALL)
            ).first()
            if not category:
                category = LeagueCategory.objects.create(
                    league=league,
                    title='رده عمومی شناگران',
                    age_min=6,
                    age_max=30,
                    gender=swimmer.gender
                )

        entry, created = LeagueEntry.objects.get_or_create(
            league=league,
            swimmer=swimmer,
            defaults={'category': category, 'total_points': Decimal('0.00')}
        )

        return Response({
            'message': f'شناگر {swimmer.full_name} با موفقیت به رده {category.title} افزوده شد.',
            'entry_id': entry.id,
            'created': created
        })
