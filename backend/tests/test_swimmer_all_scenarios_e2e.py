import pytest
import io
import datetime
from decimal import Decimal
from PIL import Image
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.swimmers.models import SwimmerProfile, SwimmerGuardianRelation, DocumentStatus
from apps.education.models import Course, SwimmerGroup, Enrollment, EnrollmentRequest, SkillLevel, Skill, GroupCoach
from apps.scheduling.models import ClassSession
from apps.attendance.models import AttendanceRecord
from apps.finance.models import Invoice, Installment, PaymentReceipt
from apps.assessments.models import SkillAssessment, SwimmingRecord, LevelPromotionProposal
from apps.leagues.models import League, LeagueCategory, LeagueEntry
from apps.coaches.models import CoachProfile, WorkoutPlan
from apps.content.models import Announcement, Notification, SupportTicket


def get_mock_jpeg():
    img = Image.new('RGB', (20, 20), color='blue')
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    return buf.getvalue()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def swimmer_user():
    user = User.objects.create_user(
        phone='09351112233',
        password='TestPassword@1234',
        first_name='آرتین',
        last_name='شمس',
        role=User.Role.SWIMMER
    )
    return user


@pytest.fixture
def coach_user():
    user = User.objects.create_user(
        phone='09129998877',
        password='CoachPassword@1234',
        first_name='علی',
        last_name='رضایی',
        role=User.Role.COACH
    )
    CoachProfile.objects.create(
        user=user,
        first_name='علی',
        last_name='رضایی',
        national_id='0012345678',
        employment_status=CoachProfile.EmploymentStatus.ACTIVE
    )
    return user


@pytest.fixture
def skill_level():
    return SkillLevel.objects.create(
        name='سطح ۲ - کرال سینه مقدماتی',
        order=2,
        description='آموزش پایه کرال سینه و ریتم ۶ ضربه‌ای'
    )


@pytest.fixture
def sample_course():
    start_d = timezone.now().date() + datetime.timedelta(days=1)
    end_d = start_d + datetime.timedelta(days=60)
    course = Course.objects.create(
        name='دوره جامع آموزش کرال سینه تابستان',
        start_date=start_d,
        end_date=end_d,
        base_price=Decimal('2400000.00'),
        installments_count=4,
        status='ACTIVE',
        gender='MALE',
        pool_location='استخر شهید رجایی قزوین',
        description='آموزش جامع شناوری، کرال سینه و تنفس'
    )
    return course


@pytest.fixture
def sample_group(sample_course, coach_user, skill_level):
    coach = coach_user.coach_profile
    group = SwimmerGroup.objects.create(
        course=sample_course,
        name='کلاس الف - روزهای زوج',
        skill_level=skill_level,
        capacity=15,
        status='OPEN',
        pool_location='استخر شهید رجایی قزوین'
    )
    GroupCoach.objects.create(
        group=group,
        coach=coach,
        is_primary=True,
        assigned_from=timezone.now().date()
    )
    return group


# ------------------------------------------------------------------------------
# 1. Dashboard & Profile Access
# ------------------------------------------------------------------------------
@pytest.mark.django_db
def test_swimmer_dashboard_and_profile_access(api_client, swimmer_user):
    api_client.force_authenticate(user=swimmer_user)

    # Calling /api/swimmers/me/ auto-initializes profile and self relation
    response = api_client.get('/api/swimmers/me/')
    assert response.status_code == status.HTTP_200_OK

    data = response.data
    assert data['first_name'] == 'آرتین'
    assert data['last_name'] == 'شمس'
    assert 'is_profile_completed' in data
    assert 'birth_certificate_status' in data

    # Verify relation was created in database
    assert SwimmerProfile.objects.filter(user=swimmer_user).exists()
    profile = swimmer_user.swimmer_profile
    assert SwimmerGuardianRelation.objects.filter(guardian=swimmer_user, swimmer=profile, is_verified=True).exists()


# ------------------------------------------------------------------------------
# 2. Profile Completion & Document Upload
# ------------------------------------------------------------------------------
@pytest.mark.django_db
def test_swimmer_profile_completion_and_document_upload(api_client, swimmer_user):
    api_client.force_authenticate(user=swimmer_user)

    jpeg_bytes = get_mock_jpeg()
    avatar = SimpleUploadedFile("avatar.jpg", jpeg_bytes, content_type="image/jpeg")
    birth_cert = SimpleUploadedFile("birth_cert.jpg", jpeg_bytes, content_type="image/jpeg")
    national_card = SimpleUploadedFile("national_card.jpg", jpeg_bytes, content_type="image/jpeg")
    insurance = SimpleUploadedFile("insurance.jpg", jpeg_bytes, content_type="image/jpeg")

    payload = {
        'first_name': 'آرتین',
        'last_name': 'شمس',
        'national_id': '0021345678',
        'date_of_birth': '2014-05-10',
        'father_name': 'رضا',
        'father_phone': '09121112233',
        'father_job': 'مهندس برق',
        'mother_phone': '09124445566',
        'mother_job': 'معلم',
        'gender': 'MALE',
        'address': 'قزوین، خیابان خیام شمالی، کوچه صفا، پلاک ۱۲',
        'school_name': 'دبستان شهید بابایی',
        'avatar': avatar,
        'birth_certificate_image': birth_cert,
        'national_card_image': national_card,
        'sports_insurance_image': insurance,
    }

    response = api_client.post('/api/swimmers/me/complete/', payload, format='multipart')
    assert response.status_code == status.HTTP_200_OK

    profile = SwimmerProfile.objects.get(user=swimmer_user)
    assert profile.national_id == '0021345678'
    assert profile.father_name == 'رضا'
    assert profile.school_name == 'دبستان شهید بابایی'
    assert profile.birth_certificate_status == DocumentStatus.PENDING
    assert profile.national_card_status == DocumentStatus.PENDING
    assert profile.sports_insurance_status == DocumentStatus.PENDING
    assert profile.is_profile_completed is True


# ------------------------------------------------------------------------------
# 3. Family / Multi-Child Management
# ------------------------------------------------------------------------------
@pytest.mark.django_db
def test_swimmer_multi_child_and_parent_guardian_switch(api_client, swimmer_user):
    api_client.force_authenticate(user=swimmer_user)

    # Auto-initialize self profile first
    api_client.get('/api/swimmers/me/')

    # 1. Add child
    child_payload = {
        'first_name': 'کیان',
        'last_name': 'شمس',
        'national_id': '0029876543',
        'gender': 'MALE',
        'relationship_type': 'CHILD'
    }
    create_res = api_client.post('/api/swimmers/my-children/', child_payload)
    assert create_res.status_code == status.HTTP_201_CREATED

    child_profile_id = create_res.data['swimmer']

    # 2. List all children under parent
    list_res = api_client.get('/api/swimmers/my-children/')
    assert list_res.status_code == status.HTTP_200_OK
    assert len(list_res.data) >= 2  # Primary/Self + New Child

    # 3. Access child profile via ?swimmer_id=...
    child_detail_res = api_client.get(f'/api/swimmers/me/?swimmer_id={child_profile_id}')
    assert child_detail_res.status_code == status.HTTP_200_OK
    assert child_detail_res.data['first_name'] == 'کیان'
    assert child_detail_res.data['national_id'] == '0029876543'


# ------------------------------------------------------------------------------
# 4. Course Browsing & Enrollment Request
# ------------------------------------------------------------------------------
@pytest.mark.django_db
def test_swimmer_course_browsing_and_enrollment_request(api_client, swimmer_user, sample_course):
    api_client.force_authenticate(user=swimmer_user)

    # 1. Browse courses
    courses_res = api_client.get('/api/education/courses/')
    assert courses_res.status_code == status.HTTP_200_OK
    courses_list = courses_res.data.get('results', courses_res.data)
    assert len(courses_list) >= 1
    assert any(c['id'] == sample_course.id for c in courses_list)

    # 2. Submit enrollment request
    req_payload = {
        'course': sample_course.id,
        'applicant_name': 'آرتین شمس',
        'applicant_phone': swimmer_user.phone,
        'selected_installments': 2,
        'notes': 'ترجیحاً در لاین‌های کم‌عمق شروع کنم.',
        'swimmer': swimmer_user.swimmer_profile.id if hasattr(swimmer_user, 'swimmer_profile') else None
    }
    submit_res = api_client.post('/api/education/requests/submit/', req_payload)
    assert submit_res.status_code == status.HTTP_201_CREATED

    created_req = EnrollmentRequest.objects.get(pk=submit_res.data['id'])
    assert created_req.course == sample_course
    assert created_req.status == EnrollmentRequest.Status.PENDING
    assert created_req.selected_installments == 2


# ------------------------------------------------------------------------------
# 5. Enrolled Courses & Sessions Schedule
# ------------------------------------------------------------------------------
@pytest.mark.django_db
def test_swimmer_enrolled_courses_and_sessions_schedule(api_client, swimmer_user, sample_group, coach_user):
    api_client.force_authenticate(user=swimmer_user)

    profile = SwimmerProfile.objects.create(
        user=swimmer_user,
        first_name=swimmer_user.first_name,
        last_name=swimmer_user.last_name,
        phone=swimmer_user.phone
    )
    SwimmerGuardianRelation.objects.create(
        guardian=swimmer_user,
        swimmer=profile,
        relationship_type='SELF',
        is_primary=True,
        is_verified=True
    )

    enrollment = Enrollment.objects.create(
        swimmer=profile,
        group=sample_group,
        course=sample_group.course,
        coach=coach_user.coach_profile,
        sessions_purchased=12,
        status=Enrollment.Status.ACTIVE
    )

    session_date = timezone.now().date() + datetime.timedelta(days=2)
    session = ClassSession.objects.create(
        group=sample_group,
        coach=coach_user.coach_profile,
        session_date=session_date,
        start_time=datetime.time(16, 0),
        end_time=datetime.time(17, 30),
        status='SCHEDULED',
        pool_location='استخر شهید رجایی قزوین'
    )

    # 1. Check my enrollments
    enr_res = api_client.get(f'/api/education/enrollments/?swimmer_id={profile.id}')
    assert enr_res.status_code == status.HTTP_200_OK
    enr_list = enr_res.data.get('results', enr_res.data)
    assert len(enr_list) >= 1
    assert enr_list[0]['id'] == enrollment.id

    # 2. Check scheduled sessions for swimmer
    sess_res = api_client.get(f'/api/scheduling/sessions/?swimmer_id={profile.id}')
    assert sess_res.status_code == status.HTTP_200_OK
    sess_list = sess_res.data.get('results', sess_res.data)
    assert len(sess_list) >= 1
    assert any(s['id'] == session.id for s in sess_list)


# ------------------------------------------------------------------------------
# 6. Attendance History & Absence Excuse Submission
# ------------------------------------------------------------------------------
@pytest.mark.django_db
def test_swimmer_attendance_history_and_absence_excuse(api_client, swimmer_user, sample_group, coach_user):
    api_client.force_authenticate(user=swimmer_user)

    profile = SwimmerProfile.objects.create(
        user=swimmer_user,
        first_name=swimmer_user.first_name,
        last_name=swimmer_user.last_name,
        phone=swimmer_user.phone
    )
    SwimmerGuardianRelation.objects.create(
        guardian=swimmer_user,
        swimmer=profile,
        relationship_type='SELF',
        is_primary=True,
        is_verified=True
    )

    session = ClassSession.objects.create(
        group=sample_group,
        coach=coach_user.coach_profile,
        session_date=timezone.now().date() - datetime.timedelta(days=1),
        start_time=datetime.time(16, 0),
        end_time=datetime.time(17, 30),
        status='COMPLETED'
    )

    att = AttendanceRecord.objects.create(
        session=session,
        swimmer=profile,
        status='ABSENT',
        note='کسالت و سرماخوردگی'
    )

    # 1. Swimmer views attendance
    att_res = api_client.get(f'/api/attendance/?swimmer_id={profile.id}')
    assert att_res.status_code == status.HTTP_200_OK
    att_list = att_res.data.get('results', att_res.data)
    assert len(att_list) >= 1
    assert att_list[0]['id'] == att.id

    # 2. Swimmer submits absence excuse ticket
    ticket_payload = {
        'category': 'SCHEDULE',
        'subject': 'درخواست موجه‌سازی غیبت جلسه دیروز',
        'description': 'شناگر دچار تب و گلودرد بود و گواهی پزشک به پیوست تقدیم می‌گردد.',
        'swimmer': profile.id
    }
    ticket_res = api_client.post('/api/content/tickets/', ticket_payload)
    assert ticket_res.status_code == status.HTTP_201_CREATED

    ticket = SupportTicket.objects.get(pk=ticket_res.data['id'])
    assert ticket.category == 'SCHEDULE'
    assert ticket.swimmer == profile
    assert ticket.user == swimmer_user


# ------------------------------------------------------------------------------
# 7. Finance Invoices, Installments & Receipt Upload
# ------------------------------------------------------------------------------
@pytest.mark.django_db
def test_swimmer_finance_invoices_installments_and_receipt_upload(api_client, swimmer_user, sample_course):
    api_client.force_authenticate(user=swimmer_user)

    profile = SwimmerProfile.objects.create(
        user=swimmer_user,
        first_name=swimmer_user.first_name,
        last_name=swimmer_user.last_name,
        phone=swimmer_user.phone
    )
    SwimmerGuardianRelation.objects.create(
        guardian=swimmer_user,
        swimmer=profile,
        relationship_type='SELF',
        is_primary=True,
        is_verified=True
    )

    invoice = Invoice.objects.create(
        swimmer=profile,
        total_amount=Decimal('2400000.00'),
        status=Invoice.Status.ISSUED,
        issue_date=timezone.now().date(),
        due_date=timezone.now().date() + datetime.timedelta(days=30)
    )

    inst1 = Installment.objects.create(
        invoice=invoice,
        installment_number=1,
        amount=Decimal('1200000.00'),
        due_date=timezone.now().date() + datetime.timedelta(days=5),
        status=Installment.Status.UNPAID
    )

    # 1. View invoices
    inv_res = api_client.get(f'/api/finance/invoices/?swimmer_id={profile.id}')
    assert inv_res.status_code == status.HTTP_200_OK

    # 2. View installments
    ins_res = api_client.get(f'/api/finance/installments/?swimmer_id={profile.id}')
    assert ins_res.status_code == status.HTTP_200_OK
    ins_list = ins_res.data if isinstance(ins_res.data, list) else ins_res.data.get('results', [])
    assert any(i['id'] == inst1.id for i in ins_list)

    # 3. Upload card-to-card payment receipt
    jpeg_bytes = get_mock_jpeg()
    receipt_file = SimpleUploadedFile("receipt.jpg", jpeg_bytes, content_type="image/jpeg")

    receipt_payload = {
        'swimmer': profile.id,
        'invoice': invoice.id,
        'installment': inst1.id,
        'amount_claimed': '1200000.00',
        'tracking_number': 'TRK-987654321',
        'payer_card_number': '6037991823456789',
        'receipt_image': receipt_file,
        'notes': 'واریز از همراه بانک ملی'
    }
    rec_res = api_client.post('/api/finance/receipts/', receipt_payload, format='multipart')
    assert rec_res.status_code == status.HTTP_201_CREATED

    receipt = PaymentReceipt.objects.get(pk=rec_res.data['id'])
    assert receipt.swimmer == profile
    assert receipt.amount_claimed == Decimal('1200000.00')
    assert receipt.status == PaymentReceipt.Status.PENDING


# ------------------------------------------------------------------------------
# 8. Skills Assessment, Swimming Records & Level Promotions
# ------------------------------------------------------------------------------
@pytest.mark.django_db
def test_swimmer_skills_assessments_records_and_promotions(api_client, swimmer_user, skill_level, coach_user):
    api_client.force_authenticate(user=swimmer_user)

    profile = SwimmerProfile.objects.create(
        user=swimmer_user,
        first_name=swimmer_user.first_name,
        last_name=swimmer_user.last_name,
        phone=swimmer_user.phone,
        current_level=skill_level
    )
    SwimmerGuardianRelation.objects.create(
        guardian=swimmer_user,
        swimmer=profile,
        relationship_type='SELF',
        is_primary=True,
        is_verified=True
    )

    coach = coach_user.coach_profile

    # 1. Skill Assessment
    skill = Skill.objects.create(
        level=skill_level,
        name='کشش متقارن کرال سینه',
        criteria_description='کشش کامل بازو و زاویه آرنج بالا'
    )
    SkillAssessment.objects.create(
        swimmer=profile,
        skill=skill,
        assessed_by=coach_user,
        assessed_at=timezone.now(),
        score=Decimal('90.00'),
        status=SkillAssessment.Status.PASSED,
        feedback='آرنج در فاز کشش کاملاً زاویه‌دار و عالی'
    )

    # 2. Swim Record
    SwimmingRecord.objects.create(
        swimmer=profile,
        recorded_by=coach_user,
        stroke=SwimmingRecord.Stroke.FREESTYLE,
        distance_meters=50,
        duration_seconds=Decimal('31.25'),
        pool_course=SwimmingRecord.PoolCourse.SHORT_25M,
        recorded_at=timezone.now().date(),
        verification_status='APPROVED'
    )

    # 3. Promotion Proposal
    next_level = SkillLevel.objects.create(name='سطح ۳ - کرال پشت و تنفس پیشرفته', order=3)
    LevelPromotionProposal.objects.create(
        swimmer=profile,
        coach=coach,
        current_level=skill_level,
        proposed_level=next_level,
        status=LevelPromotionProposal.Status.APPROVED
    )

    # Swimmer fetches assessments
    skills_res = api_client.get(f'/api/assessments/skills/?swimmer_id={profile.id}')
    assert skills_res.status_code == status.HTTP_200_OK
    skills_list = skills_res.data.get('results', skills_res.data)
    assert len(skills_list) >= 1
    assert skills_list[0]['score'] == '90.00'

    # Swimmer fetches records
    rec_res = api_client.get(f'/api/assessments/records/?swimmer_id={profile.id}')
    assert rec_res.status_code == status.HTTP_200_OK
    rec_list = rec_res.data.get('results', rec_res.data)
    assert len(rec_list) >= 1
    assert Decimal(str(rec_list[0]['duration_seconds'])) == Decimal('31.25')

    # Swimmer fetches level promotions
    promo_res = api_client.get(f'/api/assessments/promotions/?swimmer_id={profile.id}')
    assert promo_res.status_code == status.HTTP_200_OK
    promo_list = promo_res.data.get('results', promo_res.data)
    assert len(promo_list) >= 1
    assert promo_list[0]['proposed_level_name'] == 'سطح ۳ - کرال پشت و تنفس پیشرفته'


# ------------------------------------------------------------------------------
# 9. League Standings & Leaderboard
# ------------------------------------------------------------------------------
@pytest.mark.django_db
def test_swimmer_league_standings_and_leaderboard(api_client, swimmer_user):
    api_client.force_authenticate(user=swimmer_user)

    profile = SwimmerProfile.objects.create(
        user=swimmer_user,
        first_name=swimmer_user.first_name,
        last_name=swimmer_user.last_name,
        phone=swimmer_user.phone
    )
    SwimmerGuardianRelation.objects.create(
        guardian=swimmer_user,
        swimmer=profile,
        relationship_type='SELF',
        is_primary=True,
        is_verified=True
    )

    league = League.objects.create(
        name='لیگ شنای زمستانه قزوین ۱۴۰۳',
        season='زمستان ۱۴۰۳',
        starts_at=timezone.now().date(),
        ends_at=timezone.now().date() + datetime.timedelta(days=90),
        status=League.Status.ACTIVE
    )

    category = LeagueCategory.objects.create(
        league=league,
        title='نونهالان زیر ۱۲ سال',
        gender=LeagueCategory.Gender.MALE,
        age_min=8,
        age_max=12
    )

    LeagueEntry.objects.create(
        league=league,
        category=category,
        swimmer=profile,
        total_points=Decimal('185.00')
    )

    # 1. Swimmer views active leagues
    leagues_res = api_client.get('/api/leagues/')
    assert leagues_res.status_code == status.HTTP_200_OK
    leagues_list = leagues_res.data.get('results', leagues_res.data)
    assert any(l['id'] == league.id for l in leagues_list)

    # 2. Swimmer views leaderboard
    lb_res = api_client.get(f'/api/leagues/{league.id}/leaderboard/')
    assert lb_res.status_code == status.HTTP_200_OK
    assert any(item['swimmer_id'] == profile.id for item in lb_res.data)


# ------------------------------------------------------------------------------
# 10. Workout & Nutrition Plans Assigned to Swimmer
# ------------------------------------------------------------------------------
@pytest.mark.django_db
def test_swimmer_workout_and_nutrition_plans(api_client, swimmer_user, coach_user):
    api_client.force_authenticate(user=swimmer_user)

    profile = SwimmerProfile.objects.create(
        user=swimmer_user,
        first_name=swimmer_user.first_name,
        last_name=swimmer_user.last_name,
        phone=swimmer_user.phone
    )
    SwimmerGuardianRelation.objects.create(
        guardian=swimmer_user,
        swimmer=profile,
        relationship_type='SELF',
        is_primary=True,
        is_verified=True
    )

    coach = coach_user.coach_profile

    # Create Training Plan
    WorkoutPlan.objects.create(
        coach=coach,
        swimmer=profile,
        title='برنامه تمرین هوازی ۴۰۰ متر استقامتی',
        plan_type='TRAINING',
        warmup_section='۲۰۰ متر شناوری آزاد',
        main_section='۴ در ۱۰۰ متر با استراحت ۲۰ ثانیه',
        is_template=False
    )

    # Create Diet Plan
    WorkoutPlan.objects.create(
        coach=coach,
        swimmer=profile,
        title='رژیم تغذیه قبل و بعد از تمرین شنا',
        plan_type='DIET',
        diet_goal='افزایش استقامت و هایدریشن',
        breakfast='موز و کره بادام زمینی',
        lunch='سینه مرغ و برنج قهوه‌ای',
        is_template=False
    )

    # 1. Fetch all plans
    plans_res = api_client.get(f'/api/swimmers/my-plans/?swimmer_id={profile.id}')
    assert plans_res.status_code == status.HTTP_200_OK
    plans_list = plans_res.data
    assert len(plans_list) == 2

    # 2. Filter by plan_type=TRAINING
    t_res = api_client.get(f'/api/swimmers/my-plans/?swimmer_id={profile.id}&plan_type=TRAINING')
    assert t_res.status_code == status.HTTP_200_OK
    assert len(t_res.data) == 1
    assert t_res.data[0]['title'] == 'برنامه تمرین هوازی ۴۰۰ متر استقامتی'


# ------------------------------------------------------------------------------
# 11. Announcements, Notifications & Read-All
# ------------------------------------------------------------------------------
@pytest.mark.django_db
def test_swimmer_announcements_notifications_and_read_all(api_client, swimmer_user):
    api_client.force_authenticate(user=swimmer_user)

    # Create announcement
    Announcement.objects.create(
        title='تعطیلی استخر به مناسبت تعمیرات موتورخانه',
        message='جلسات روز سه‌شنبه به پنج‌شنبه همین هفته منتقل می‌گردد.',
        audience=Announcement.Audience.SWIMMERS
    )

    # Create user notification
    Notification.objects.create(
        recipient=swimmer_user,
        title='فاکتور شهریه صادر شد',
        message='فاکتور ترم جدید شما در بخش مالی صادر گردید.',
        is_read=False
    )

    # 1. Check announcements
    ann_res = api_client.get('/api/content/announcements/')
    assert ann_res.status_code == status.HTTP_200_OK
    ann_list = ann_res.data.get('results', ann_res.data)
    assert len(ann_list) >= 1

    # 2. Check notifications
    notif_res = api_client.get('/api/content/notifications/')
    assert notif_res.status_code == status.HTTP_200_OK
    notif_list = notif_res.data.get('results', notif_res.data)
    assert len(notif_list) >= 1
    assert notif_list[0]['is_read'] is False

    # 3. Mark all notifications as read
    read_res = api_client.post('/api/content/notifications/read-all/')
    assert read_res.status_code == status.HTTP_200_OK

    updated_notif = Notification.objects.get(recipient=swimmer_user)
    assert updated_notif.is_read is True


# ------------------------------------------------------------------------------
# 12. Security & Password Change
# ------------------------------------------------------------------------------
@pytest.mark.django_db
def test_swimmer_security_and_password_change(api_client, swimmer_user):
    api_client.force_authenticate(user=swimmer_user)

    # Test changing password with valid password policy
    new_pw = 'SuperSecurePass@2025'
    payload = {
        'old_password': 'TestPassword@1234',
        'new_password': new_pw,
        'confirm_password': new_pw
    }
    pw_res = api_client.post('/api/auth/change-password/', payload)
    assert pw_res.status_code == status.HTTP_200_OK

    # Verify swimmer can re-authenticate with the new password
    swimmer_user.refresh_from_db()
    assert swimmer_user.check_password(new_pw) is True
    assert swimmer_user.check_password('TestPassword@1234') is False
