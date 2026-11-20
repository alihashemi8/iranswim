import pytest
import datetime
from decimal import Decimal
import io
from PIL import Image
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.coaches.models import CoachProfile, WorkoutPlan, CoachContract, CoachPayroll, CoachLeaveRequest
from apps.education.models import Course, SwimmerGroup, SkillLevel, Skill, Enrollment, GroupCoach, GroupSchedule
from apps.swimmers.models import SwimmerProfile, SwimVideo
from apps.scheduling.models import ClassSession
from apps.attendance.models import AttendanceRecord
from apps.assessments.models import LevelPromotionProposal, SkillAssessment, SwimmingRecord


def create_dummy_image(name='test.jpg'):
    f = io.BytesIO()
    img = Image.new('RGB', (100, 100), color=(50, 100, 150))
    img.save(f, format='JPEG')
    f.seek(0)
    return SimpleUploadedFile(name, f.read(), content_type='image/jpeg')


def create_dummy_video(name='test_swim.mp4'):
    # Small dummy byte array to simulate MP4 upload
    return SimpleUploadedFile(name, b'\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00isommp42', content_type='video/mp4')


@pytest.fixture
def coach_env(db):
    user = User.objects.create_user(
        phone='09127778899',
        password='TestPassword123!',
        first_name='ارسلان',
        last_name='مرادی',
        role=User.Role.COACH
    )
    coach = CoachProfile.objects.create(
        user=user,
        personnel_id='EMP-2001',
        first_name='ارسلان',
        last_name='مرادی',
        coaching_degree='GRADE_1',
        hourly_rate=Decimal('300000.00'),
        card_number='6037991988776655',
        shaba_number='IR110170000000112233445566'
    )

    admin = User.objects.create_user(
        phone='09121112233',
        password='AdminPass123!',
        first_name='مدیر',
        last_name='استخر',
        role=User.Role.ADMIN
    )

    level_beg = SkillLevel.objects.create(name='مقدماتی ۱', order=1)
    level_adv = SkillLevel.objects.create(name='متوسط ۱', order=2)

    course = Course.objects.create(
        name='دوره شنا بهاره',
        start_date=timezone.now().date(),
        end_date=timezone.now().date() + datetime.timedelta(days=90),
        base_price=Decimal('2500000.00'),
        sessions_count=10
    )

    group = SwimmerGroup.objects.create(
        course=course,
        name='گروه دلفین‌ها',
        skill_level=level_beg,
        pool_location='استخر آزادی - خط ۲',
        capacity=12
    )

    GroupCoach.objects.create(
        group=group,
        coach=coach,
        assigned_from=timezone.now().date(),
        is_primary=True
    )

    # Swimmer 1
    sw1_u = User.objects.create_user(
        phone='09123334411',
        password='SwimmerPass1!',
        first_name='پارسا',
        last_name='کاظمی',
        role=User.Role.SWIMMER
    )
    swimmer1 = SwimmerProfile.objects.create(
        user=sw1_u,
        first_name='پارسا',
        last_name='کاظمی',
        current_level=level_beg,
        emergency_contact_phone='09123334400'
    )
    enr1 = Enrollment.objects.create(
        swimmer=swimmer1,
        course=course,
        group=group,
        sessions_purchased=10,
        status=Enrollment.Status.ACTIVE
    )

    # Swimmer 2
    sw2_u = User.objects.create_user(
        phone='09123334422',
        password='SwimmerPass2!',
        first_name='سینا',
        last_name='حسینی',
        role=User.Role.SWIMMER
    )
    swimmer2 = SwimmerProfile.objects.create(
        user=sw2_u,
        first_name='سینا',
        last_name='حسینی',
        current_level=level_beg,
        emergency_contact_phone='09123334401'
    )
    enr2 = Enrollment.objects.create(
        swimmer=swimmer2,
        course=course,
        group=group,
        sessions_purchased=10,
        status=Enrollment.Status.ACTIVE
    )

    # Class Session
    session = ClassSession.objects.create(
        group=group,
        coach=coach,
        session_date=timezone.now().date(),
        start_time=datetime.time(15, 0),
        end_time=datetime.time(16, 30),
        pool_location='استخر آزادی - خط ۲',
        status=ClassSession.Status.SCHEDULED
    )

    return {
        'coach_user': user,
        'coach': coach,
        'admin_user': admin,
        'level_beg': level_beg,
        'level_adv': level_adv,
        'course': course,
        'group': group,
        'swimmer1': swimmer1,
        'swimmer2': swimmer2,
        'enr1': enr1,
        'enr2': enr2,
        'session': session,
    }


@pytest.mark.django_db
def test_scenario_attendance_bulk_save_and_evaluation(coach_env):
    """
    بررسی سناریوی حضور و غیاب سریع کنار استخر:
    - ثبت وضعیت حاضر (با کسر سهمیه)
    - ثبت وضعیت غایب موجه (بدون کسر سهمیه)
    - ثبت ارزیابی و نمره کیفی کلی جلسه توسط مربی
    - تغییر خودکار وضعیت جلسه به COMPLETED
    """
    client = APIClient()
    client.force_authenticate(user=coach_env['coach_user'])
    sess = coach_env['session']
    sw1 = coach_env['swimmer1']
    sw2 = coach_env['swimmer2']

    payload = {
        'session_id': sess.id,
        'records': [
            {'swimmer_id': sw1.id, 'status': 'PRESENT', 'note': 'ورود به‌موقع'},
            {'swimmer_id': sw2.id, 'status': 'EXCUSED', 'note': 'گواهی پزشکی ارائه شد'},
        ],
        'session_notes': 'تمرین پای قورباغه با تمرکز بر تقارن زانوها',
        'coach_evaluation': 'عملکرد کلی گروه بسیار رضایت‌بخش و پرانرژی بود.',
        'session_rating': 'EXCELLENT',
    }

    res = client.post('/api/attendance/bulk-save/', payload, format='json')
    assert res.status_code == 200
    assert res.data['count'] == 2

    # Check session updated
    sess.refresh_from_db()
    assert sess.status == ClassSession.Status.COMPLETED
    assert sess.session_rating == 'EXCELLENT'
    assert 'تقارن زانوها' in sess.session_notes
    assert 'پرانرژی' in sess.coach_evaluation

    # Check attendance records
    att1 = AttendanceRecord.objects.get(session=sess, swimmer=sw1)
    assert att1.status == AttendanceRecord.Status.PRESENT
    assert att1.consumed_quota is True

    att2 = AttendanceRecord.objects.get(session=sess, swimmer=sw2)
    assert att2.status == AttendanceRecord.Status.EXCUSED
    assert att2.consumed_quota is False

    # Check swimmer 1 quota updated
    coach_env['enr1'].refresh_from_db()
    assert coach_env['enr1'].sessions_attended == 1
    assert coach_env['enr1'].remaining_sessions == 9

    # Check swimmer 2 quota preserved (excused)
    coach_env['enr2'].refresh_from_db()
    assert coach_env['enr2'].sessions_attended == 0
    assert coach_env['enr2'].remaining_sessions == 10


@pytest.mark.django_db
def test_scenario_swimming_records_and_stopwatch(coach_env):
    """
    بررسی سناریوی ثبت رکوردهای زمانی کرونومتر برای شناگر توسط مربی
    """
    client = APIClient()
    client.force_authenticate(user=coach_env['coach_user'])
    sw1 = coach_env['swimmer1']

    record_payload = {
        'swimmer': sw1.id,
        'stroke': 'FREESTYLE',
        'distance_meters': 50,
        'duration_seconds': '32.45',
        'pool_course': 'SHORT_25M',
        'recorded_at': timezone.now().date().isoformat(),
        'notes': 'رکورد تایم‌تریال درون کلاسی کرال سینه',
    }

    res = client.post('/api/assessments/records/', record_payload, format='json')
    assert res.status_code == 201
    assert res.data['stroke'] == 'FREESTYLE'
    assert res.data['distance_meters'] == 50
    assert res.data['verification_status'] == 'VERIFIED'
    assert res.data['swimmer_name'] == 'پارسا کاظمی'

    # Verify query
    list_res = client.get(f'/api/assessments/records/?swimmer_id={sw1.id}')
    assert list_res.status_code == 200
    assert len(list_res.data.get('results', list_res.data)) >= 1


@pytest.mark.django_db
def test_scenario_technique_video_upload_and_delete(coach_env):
    """
    بررسی سناریوی آپلود و حذف ویدیوی تحلیل تکنیک شناگر توسط مربی
    """
    client = APIClient()
    client.force_authenticate(user=coach_env['coach_user'])
    sw1 = coach_env['swimmer1']

    video_file = create_dummy_video('freestyle_technique.mp4')
    upload_res = client.post(
        '/api/swimmers/videos/',
        {
            'swimmer': sw1.id,
            'title': 'آنالیز حرکت دست کرال سینه',
            'description': 'نیاز به افزایش کشیدگی دست در فاز ورودی به آب',
            'video': video_file
        },
        format='multipart'
    )
    assert upload_res.status_code == 201
    assert upload_res.data['title'] == 'آنالیز حرکت دست کرال سینه'
    vid_id = upload_res.data['id']

    # Fetch list
    list_res = client.get(f'/api/swimmers/videos/?swimmer_id={sw1.id}')
    assert list_res.status_code == 200
    items = list_res.data.get('results', list_res.data)
    assert any(v['id'] == vid_id for v in items)

    # Delete video
    del_res = client.delete(f'/api/swimmers/videos/{vid_id}/')
    assert del_res.status_code == 200


@pytest.mark.django_db
def test_scenario_coach_leave_requests_self_service(coach_env):
    """
    بررسی سناریوی ثبت درخواست مرخصی توسط مربی و مشاهده کارتابل
    """
    client = APIClient()
    client.force_authenticate(user=coach_env['coach_user'])
    coach = coach_env['coach']

    leave_payload = {
        'leave_type': 'CASUAL',
        'start_date': (timezone.now().date() + datetime.timedelta(days=2)).isoformat(),
        'end_date': (timezone.now().date() + datetime.timedelta(days=3)).isoformat(),
        'hours_requested': 8,
        'reason': 'شرکت در کارگاه بین‌المللی ارتقای مربیگری شنا',
    }

    create_res = client.post(f'/api/coaches/{coach.id}/leave-requests/', leave_payload, format='json')
    assert create_res.status_code == 201
    assert create_res.data['status'] == 'PENDING'
    assert create_res.data['leave_type'] == 'CASUAL'

    # Fetch own leaves
    list_res = client.get(f'/api/coaches/{coach.id}/leave-requests/')
    assert list_res.status_code == 200
    assert len(list_res.data) >= 1
    assert list_res.data[0]['reason'] == leave_payload['reason']


@pytest.mark.django_db
def test_scenario_coach_my_swimmers_overview(coach_env):
    """
    بررسی سناریوی دریافت فهرست جامع شناگران مربی و فیلترها
    """
    client = APIClient()
    client.force_authenticate(user=coach_env['coach_user'])

    res = client.get('/api/coaches/my-swimmers/')
    assert res.status_code == 200
    data = res.data
    assert len(data) == 2
    swimmer_names = [s['full_name'] for s in data]
    assert 'پارسا کاظمی' in swimmer_names
    assert 'سینا حسینی' in swimmer_names

    # Check search filter
    search_res = client.get('/api/coaches/my-swimmers/?search=پارسا')
    assert search_res.status_code == 200
    assert len(search_res.data) == 1
    assert search_res.data[0]['full_name'] == 'پارسا کاظمی'


@pytest.mark.django_db
def test_scenario_skills_manager_and_default_imports(coach_env):
    """
    بررسی سناریوی مدیریت بانک سرفصل‌های اختصاصی مربی و ایمپورت سرفصل‌های پیش‌فرض
    """
    client = APIClient()
    client.force_authenticate(user=coach_env['coach_user'])

    # 1. Create custom skill
    c_res = client.post('/api/education/skills/', {
        'name': 'پای دوچرخه بدون دست ۴۵ ثانیه',
        'criteria_description': 'نگه‌داشتن سر کاملاً بیرون آب با چرخش تخم‌مرغی پاها',
    }, format='json')
    assert c_res.status_code == 201
    skill_id = c_res.data['id']

    # 2. Update custom skill
    u_res = client.patch(f'/api/education/skills/{skill_id}/', {
        'name': 'پای دوچرخه بدون دست ۶۰ ثانیه',
    }, format='json')
    assert u_res.status_code == 200
    assert u_res.data['name'] == 'پای دوچرخه بدون دست ۶۰ ثانیه'

    # 3. Import default skills
    imp_res = client.post('/api/education/skills/import-defaults/')
    assert imp_res.status_code == 200
    assert 'skills' in imp_res.data

    # 4. Delete skill
    d_res = client.delete(f'/api/education/skills/{skill_id}/')
    assert d_res.status_code in [200, 204]
