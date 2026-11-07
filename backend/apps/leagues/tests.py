from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from decimal import Decimal
from datetime import date

from apps.leagues.models import League, LeagueCategory, LeagueCompetition, LeagueEntry, LeagueResult
from apps.swimmers.models import SwimmerProfile


class LeagueManagementTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Swimmers
        self.swimmer1 = SwimmerProfile.objects.create(
            first_name='علی',
            last_name='رضایی',
            gender=SwimmerProfile.Gender.MALE,
            date_of_birth=date(2010, 5, 12)
        )
        self.swimmer2 = SwimmerProfile.objects.create(
            first_name='مهدی',
            last_name='کریمی',
            gender=SwimmerProfile.Gender.MALE,
            date_of_birth=date(2011, 8, 20)
        )

        # Create League
        self.league = League.objects.create(
            name='لیگ فصلی ستارگان شنای ایران',
            season='پاییز و زمستان ۱۴۰۵',
            starts_at=date(2026, 9, 23),
            ends_at=date(2027, 3, 20),
            status=League.Status.ACTIVE,
            scoring_rules={
                'rank_1': 10,
                'rank_2': 7,
                'rank_3': 5,
                'rank_4': 3,
                'rank_5': 2,
                'participation': 1
            }
        )

        # Create Category
        self.category = LeagueCategory.objects.create(
            league=self.league,
            title='رده سنی ۱۲ تا ۱۵ سال پسران',
            age_min=12,
            age_max=15,
            gender=LeagueCategory.Gender.MALE
        )

        # Enroll Swimmer 1
        self.entry1 = LeagueEntry.objects.create(
            league=self.league,
            category=self.category,
            swimmer=self.swimmer1,
            total_points=Decimal('0.00'),
            status=LeagueEntry.Status.ACTIVE
        )

    def test_league_stats_api(self):
        url = reverse('league_stats', kwargs={'league_id': self.league.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['participants_count'], 1)
        self.assertEqual(response.data['completed_competitions_count'], 0)

    def test_record_competition_results_and_scoring(self):
        # Create Competition
        comp = LeagueCompetition.objects.create(
            league=self.league,
            category=self.category,
            title='مسابقه شنای آزاد ۵۰ متر',
            stroke=LeagueCompetition.Stroke.FREESTYLE,
            distance_meters=50,
            held_at=date(2026, 10, 10),
            status=LeagueCompetition.Status.SCHEDULED
        )

        url = reverse('record_competition_results', kwargs={'pk': comp.id})
        payload = {
            'results': [
                {'swimmer_id': self.swimmer1.id, 'duration_seconds': 28.50, 'notes': 'تایم اول'},
                {'swimmer_id': self.swimmer2.id, 'duration_seconds': 29.10, 'notes': 'تایم دوم'},
            ]
        }

        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, 200)

        # Verify competition status is COMPLETED
        comp.refresh_from_db()
        self.assertEqual(comp.status, LeagueCompetition.Status.COMPLETED)

        # Swimmer 1 was fastest (28.50s) -> Rank 1 -> 10 points & Gold medal
        self.entry1.refresh_from_db()
        self.assertEqual(self.entry1.total_points, Decimal('10.00'))
        self.assertEqual(self.entry1.gold_medals, 1)

        # Swimmer 2 was second (29.10s) -> Auto-enrolled -> Rank 2 -> 7 points & Silver medal
        entry2 = LeagueEntry.objects.get(league=self.league, swimmer=self.swimmer2)
        self.assertEqual(entry2.total_points, Decimal('7.00'))
        self.assertEqual(entry2.silver_medals, 1)

    def test_manual_score_addition(self):
        url = reverse('league_manual_score', kwargs={'league_id': self.league.id})
        payload = {
            'swimmer_id': self.swimmer1.id,
            'score_points': 5.0,
            'event_name': 'امتیاز اخلاق ورزشی',
            'notes': 'انضباط و حضور فعال'
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, 200)

        self.entry1.refresh_from_db()
        self.assertEqual(self.entry1.total_points, Decimal('5.00'))

    def test_swimmer_performance_detail_api(self):
        url = reverse('swimmer_performance', kwargs={'league_id': self.league.id, 'swimmer_id': self.swimmer1.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn('swimmer', response.data)
        self.assertIn('entry', response.data)
        self.assertIn('chart_data', response.data)
