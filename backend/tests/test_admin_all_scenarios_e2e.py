import pytest
import datetime
from decimal import Decimal
import io
from PIL import Image
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.coaches.models import CoachProfile, CoachPerformanceEvaluation, CoachAdministrativeNote
from apps.education.models import Course, SwimmerGroup, SkillLevel, Skill, Enrollment, GroupCoach, GroupSchedule
from apps.swimmers.models import SwimmerProfile, DocumentStatus
from apps.scheduling.models import ClassSession
from apps.attendance.models import AttendanceRecord
from apps.finance.models import Invoice, Installment, Payment
from apps.assessments.models import SwimmingRecord, LevelPromotionProposal
from apps.content.models import SwimmingPool, Announcement, Notification, LandingSection


def create_dummy_image(name='test_img.jpg'):
    f = io.BytesIO()
    img = Image.new('RGB', (100, 100), color=(60, 120, 180))
    img.save(f, format='JPEG')
    f.seek(0)
    return SimpleUploadedFile(name, f.read(), content_type='image/jpeg')


@pytest.fixture
def admin_env(db):
    admin_user = User.objects.create_user(
        phone='09121119900',
        password='AdminPassword@2026',
        first_name='مدیر',
        last_name='کل',
        role=User.Role.ADMIN,
        is_staff=True,
        is_superuser=True
    )

    coach_user = User.objects.create_user(
        phone='09122229900',
        password='CoachPassword@2026',
        first_name='کامران',
        last_name='نجفی',
        role=User.Role.COACH
    )
    coach = CoachProfile.objects.create(
        user=coach_user,
        personnel_id='EMP-ADMIN-1',
        first_name='کامران',
        last_name='نجفی',
        coaching_degree='GRADE_2',
        hourly_rate=Decimal('250000.00'),
        card_number='6037991199887766',
        shaba_number='IR550170000000112233445566'
    )

    swimmer_user = User.objects.create_user(
        phone='09123339900',
        password='SwimmerPassword@2026',
        first_name='بردیا',
        last_name='صالحی',
        role=User.Role.SWIMMER
    )
    level1 = SkillLevel.objects.create(name='مقدماتی ۲', order=1)
    level2 = SkillLevel.objects.create(name='پیشرفته ۱', order=2)

    swimmer = SwimmerProfile.objects.create(
        user=swimmer_user,
        first_name='بردیا',
        last_name='صالحی',
        current_level=level1,
        date_of_birth='1390-05-10',
        emergency_contact_phone='09123339901'
    )

    course = Course.objects.create(
        name='ترم پاییزه تخصصی کرال',
        start_date=timezone.now().date(),
        end_date=timezone.now().date() + datetime.timedelta(days=60),
        base_price=Decimal('3000000.00'),
        sessions_count=12,
        installments_count=3
    )

    group = SwimmerGroup.objects.create(
        course=course,
        name='کلاس آلفا',
        skill_level=level1,
        pool_location='مجموعه ورزشی آزادی',
        capacity=10
    )

    GroupCoach.objects.create(
        group=group,
        coach=coach,
        assigned_from=timezone.now().date(),
        is_primary=True
    )

    return {
        'admin_user': admin_user,
        'coach_user': coach_user,
        'coach': coach,
        'swimmer_user': swimmer_user,
        'swimmer': swimmer,
        'level1': level1,
        'level2': level2,
        'course': course,
        'group': group,
    }


# ==============================================================================
# 1. تست داشبورد و آمار تجمیعی مالی و نظارتی مدیر
# ==============================================================================
@pytest.mark.django_db
def test_admin_dashboard_kpis_and_live_stats(admin_env):
    client = APIClient()
    client.force_authenticate(user=admin_env['admin_user'])

    # 1. Financial summary
    fin_res = client.get('/api/finance/summary/')
    assert fin_res.status_code == 200
    assert 'total_invoiced' in fin_res.data
    assert 'total_paid' in fin_res.data
    assert 'receivables' in fin_res.data

    # 2. Supervisor health stats
    health_res = client.get('/api/supervisor/health/')
    assert health_res.status_code == 200
    assert 'database' in health_res.data
    assert health_res.data['database']['connected'] is True

    # 3. Schedule today sessions
    today_str = timezone.now().date().isoformat()
    sess_res = client.get(f'/api/scheduling/sessions/?date={today_str}')
    assert sess_res.status_code == 200


# ==============================================================================
# 2. تست کارتابل بررسی مدارک هویتی و پزشکی شناگران (Dossiers)
# ==============================================================================
@pytest.mark.django_db
def test_admin_dossiers_document_review_and_approval(admin_env):
    client = APIClient()
    client.force_authenticate(user=admin_env['admin_user'])
    swimmer = admin_env['swimmer']

    # Attach dummy document files
    swimmer.national_card_image = create_dummy_image('card.jpg')
    swimmer.sports_insurance_image = create_dummy_image('ins.jpg')
    swimmer.national_card_status = DocumentStatus.PENDING
    swimmer.sports_insurance_status = DocumentStatus.PENDING
    swimmer.birth_certificate_status = DocumentStatus.PENDING
    swimmer.is_profile_completed = True
    swimmer.save()

    # 1. Fetch dossiers summary
    sum_res = client.get('/api/swimmers/dossiers-summary/')
    assert sum_res.status_code == 200
    assert sum_res.data.get('total_pending', 0) >= 1

    # 2. Admin approves documents
    approve_res = client.post(f'/api/swimmers/{swimmer.id}/review-documents/', {
        'action': 'APPROVE',
        'reason': 'مدارک شناسایی و بیمه ورزشی کاملاً معتبر است.'
    }, format='json')
    assert approve_res.status_code == 200
    assert 'swimmer' in approve_res.data

    swimmer.refresh_from_db()
    assert swimmer.national_card_status == DocumentStatus.APPROVED
    assert swimmer.sports_insurance_status == DocumentStatus.APPROVED
    assert swimmer.birth_certificate_status == DocumentStatus.APPROVED

    # 3. Admin rejects documents with reason
    reject_res = client.post(f'/api/swimmers/{swimmer.id}/review-documents/', {
        'action': 'REJECT',
        'reason': 'کارت بیمه ورزشی منقضی شده است. لطفاً گواهی تمدید بارگذاری گردد.'
    }, format='json')
    assert reject_res.status_code == 200
    assert 'swimmer' in reject_res.data

    swimmer.refresh_from_db()
    assert swimmer.national_card_status == DocumentStatus.REVISION_REQUIRED
    assert swimmer.documents_rejection_reason == 'کارت بیمه ورزشی منقضی شده است. لطفاً گواهی تمدید بارگذاری گردد.'

    # Swimmer receives notification
    notif = Notification.objects.filter(recipient=swimmer.user).first()
    assert notif is not None
    assert 'منقضی' in notif.message or 'نقص' in notif.title


# ==============================================================================
# 3. تست ثبت‌نام مستقیم و تقسیط خودکار شهریه
# ==============================================================================
@pytest.mark.django_db
def test_admin_direct_enrollment_and_auto_invoicing(admin_env):
    client = APIClient()
    client.force_authenticate(user=admin_env['admin_user'])
    swimmer = admin_env['swimmer']
    course = admin_env['course']
    group = admin_env['group']

    enroll_payload = {
        'swimmer': swimmer.id,
        'course': course.id,
        'group': group.id,
        'selected_installments': 3,
        'status': 'ACTIVE',
    }

    enroll_res = client.post('/api/education/enrollments/', enroll_payload, format='json')
    assert enroll_res.status_code == 201
    enr_id = enroll_res.data['id']

    # Verify auto-generated invoice and installments
    invoice = Invoice.objects.filter(enrollment_id=enr_id).first()
    assert invoice is not None
    assert invoice.total_amount == course.base_price
    assert invoice.installments.count() == 3

    # Check installment amounts (3,000,000 / 3 = 1,000,000 each)
    for inst in invoice.installments.all():
        assert inst.amount == Decimal('1000000.00')
        assert inst.status == Installment.Status.UNPAID


# ==============================================================================
# 4. تست امور مالی: ثبت واریزی، تخصیص هوشمند به اقساط و کلید یکتایی
# ==============================================================================
@pytest.mark.django_db
def test_admin_finance_payment_recording_and_allocation(admin_env):
    client = APIClient()
    client.force_authenticate(user=admin_env['admin_user'])
    swimmer = admin_env['swimmer']
    course = admin_env['course']
    group = admin_env['group']

    # Setup enrollment & invoice
    enrollment = Enrollment.objects.create(
        swimmer=swimmer,
        course=course,
        group=group,
        selected_installments=2,
        status='ACTIVE'
    )
    invoice = Invoice.objects.create(
        invoice_number=Invoice.generate_invoice_number(),
        swimmer=swimmer,
        enrollment=enrollment,
        total_amount=Decimal('2000000.00'),
        issue_date=timezone.now().date(),
        due_date=timezone.now().date() + datetime.timedelta(days=30)
    )
    inst1 = Installment.objects.create(
        invoice=invoice,
        installment_number=1,
        amount=Decimal('1000000.00'),
        due_date=timezone.now().date()
    )
    inst2 = Installment.objects.create(
        invoice=invoice,
        installment_number=2,
        amount=Decimal('1000000.00'),
        due_date=timezone.now().date() + datetime.timedelta(days=30)
    )

    payment_payload = {
        'swimmer_id': swimmer.id,
        'invoice_id': invoice.id,
        'amount': '1000000.00',
        'method': 'POS',
        'transaction_ref': 'POS-998877',
        'idempotency_key': 'IDEMP-TEST-KEY-001',
        'notes': 'واریز قسط اول از طریق کارتخوان باشگاه',
    }

    # Record payment
    pay_res = client.post('/api/finance/payments/record/', payment_payload, format='json')
    assert pay_res.status_code == 201
    assert pay_res.data['amount'] == '1000000.00'

    # Check inst1 marked PAID, inst2 still UNPAID
    inst1.refresh_from_db()
    assert inst1.status == Installment.Status.PAID
    inst2.refresh_from_db()
    assert inst2.status == Installment.Status.UNPAID

    # Idempotency check: returns same payment safely without duplicate charge
    dup_res = client.post('/api/finance/payments/record/', payment_payload, format='json')
    assert dup_res.status_code == 200
    assert dup_res.data['id'] == pay_res.data['id']
    assert Payment.objects.filter(idempotency_key=payment_payload['idempotency_key']).count() == 1


# ==============================================================================
# 5. تست مدیریت منابع انسانی مربیان (HR Management)
# ==============================================================================
@pytest.mark.django_db
def test_admin_coach_hr_management_flow(admin_env):
    client = APIClient()
    client.force_authenticate(user=admin_env['admin_user'])
    coach = admin_env['coach']

    # 1. Admin verifies retraining certificate
    coach.retraining_certificate_file = create_dummy_image('retraining.jpg')
    coach.retraining_status = CoachProfile.RetrainingStatus.PENDING
    coach.save()

    retrain_res = client.post(f'/api/coaches/{coach.id}/verify-retraining/', {'action': 'APPROVE'})
    assert retrain_res.status_code == 200
    coach.refresh_from_db()
    assert coach.retraining_status == CoachProfile.RetrainingStatus.APPROVED
    assert coach.is_retraining_valid is True

    # 2. Admin adds performance evaluation
    eval_res = client.post(f'/api/coaches/{coach.id}/evaluations/', {
        'evaluation_date': timezone.now().date().isoformat(),
        'period_label': 'پاییز ۱۴۰۵',
        'overall_score': '92.50',
        'strengths': 'انضباط کلاسی بالا و ارتباط صمیمانه با شناگران',
        'weaknesses': 'تمرکز بیشتر بر تمرینات اختصاصی پروانه',
        'recommendations': 'شرکت در کارگاه‌های پیشرفته فدراسیون',
        'general_feedback': 'عملکرد کلی رضایت‌بخش است.',
        'is_shared_with_coach': True,
    }, format='json')
    assert eval_res.status_code == 201
    assert eval_res.data['overall_score'] == '92.50'

    # 3. Admin records administrative note
    note_res = client.post(f'/api/coaches/{coach.id}/administrative-notes/', {
        'category': 'COMMENDATION',
        'title': 'تقدیر از کسب مقام تیم در لیگ',
        'description': 'تلاش‌های شایسته مربی در کسب رتبه برتر شناگران نوجوان',
        'date': timezone.now().date().isoformat(),
        'severity': 'LOW',
        'is_confidential': False,
    }, format='json')
    assert note_res.status_code == 201
    assert note_res.data['title'] == 'تقدیر از کسب مقام تیم در لیگ'


# ==============================================================================
# 6. تست مدیریت دوره‌ها، سانس‌ها و کشف تداخل زمانی استخر و مربی
# ==============================================================================
@pytest.mark.django_db
def test_admin_scheduling_and_conflict_detection(admin_env):
    client = APIClient()
    client.force_authenticate(user=admin_env['admin_user'])
    coach = admin_env['coach']
    group = admin_env['group']

    today = timezone.now().date()

    # Session 1: 17:00 to 18:30
    s1 = ClassSession.objects.create(
        group=group,
        coach=coach,
        session_date=today,
        start_time=datetime.time(17, 0),
        end_time=datetime.time(18, 30),
        pool_location='استخر آزادی',
        status=ClassSession.Status.SCHEDULED
    )
    assert s1.id is not None

    # Session 2 with overlapping time (17:30 to 19:00) for same coach should trigger conflict
    from django.core.exceptions import ValidationError
    s2 = ClassSession(
        group=group,
        coach=coach,
        session_date=today,
        start_time=datetime.time(17, 30),
        end_time=datetime.time(19, 0),
        pool_location='استخر آزادی',
        status=ClassSession.Status.SCHEDULED
    )
    with pytest.raises(ValidationError):
        s2.clean()


# ==============================================================================
# 7. تست تأیید یا رد رکوردهای مسابقاتی شنا
# ==============================================================================
@pytest.mark.django_db
def test_admin_swimming_record_verification(admin_env):
    client = APIClient()
    client.force_authenticate(user=admin_env['admin_user'])
    swimmer = admin_env['swimmer']

    # Record created with PENDING verification status
    record = SwimmingRecord.objects.create(
        swimmer=swimmer,
        stroke=SwimmingRecord.Stroke.BREASTSTROKE,
        distance_meters=100,
        duration_seconds=Decimal('78.50'),
        pool_course=SwimmingRecord.PoolCourse.SHORT_25M,
        recorded_at=timezone.now().date(),
        verification_status=SwimmingRecord.VerificationStatus.PENDING
    )

    # Admin verifies record
    v_res = client.post(f'/api/assessments/records/{record.id}/verify/', {
        'action': 'VERIFY',
        'notes': 'تأیید بر اساس بازبینی رسمی برگه داوری مسابقات'
    }, format='json')
    assert v_res.status_code == 200
    assert 'موفقیت' in v_res.data['message']

    record.refresh_from_db()
    assert record.verification_status == SwimmingRecord.VerificationStatus.VERIFIED


# ==============================================================================
# 8. تست ارسال اعلانات عمومی، تفکیک مخاطب و اعلان پیامکی
# ==============================================================================
@pytest.mark.django_db
def test_admin_announcements_and_notifications_broadcast(admin_env):
    client = APIClient()
    client.force_authenticate(user=admin_env['admin_user'])

    ann_payload = {
        'title': 'تعطیلی استخر به دلیل تعمیرات دوره‌ای',
        'message': 'کلیه کلاس‌های روز پنج‌شنبه تعطیل بوده و جلسه جبرانی متعاقباً اعلام می‌گردد.',
        'audience': 'ALL',
        'is_pinned': True,
        'send_sms': False
    }

    create_res = client.post('/api/content/announcements/', ann_payload, format='json')
    assert create_res.status_code == 201
    assert create_res.data['title'] == ann_payload['title']

    # Check notification created in notification system
    notif = Notification.objects.filter(category=Notification.Category.ANNOUNCEMENT).first()
    assert notif is not None
    assert 'تعطیلی استخر' in notif.title


# ==============================================================================
# 9. تست مدیریت محتوای وب‌سایت، سکشن‌های لندینگ و استخرها
# ==============================================================================
@pytest.mark.django_db
def test_admin_website_manager_toggle_and_pools(admin_env):
    client = APIClient()
    client.force_authenticate(user=admin_env['admin_user'])

    # 1. Toggle landing section
    sec, _ = LandingSection.objects.get_or_create(
        key='hero',
        defaults={'title': 'بخش هیرو صفحه اصلی', 'is_enabled': True, 'display_order': 1}
    )
    toggle_res = client.post(f'/api/content/landing-sections/{sec.key}/toggle/')
    assert toggle_res.status_code == 200
    assert toggle_res.data['is_enabled'] is False

    # 2. Create swimming pool
    pool_payload = {
        'name': 'استخر قهرمانی شهید چمران',
        'location': 'تهران، خیابان ولیعصر، بالاتر از پارک وی',
        'phone': '02122003344',
        'description': 'استخر قهرمانی با استانداردهای فدراسیون و سیستم تصفیه آب نوین',
        'dimensions': '۵۰ در ۲۵ متر',
        'depth': '۲ تا ۴.۵ متر',
        'facilities': 'سونا خشک و بخار، جکوزی، حوضچه آب سرد',
        'is_active': True,
    }
    pool_res = client.post('/api/content/pools/', pool_payload, format='json')
    assert pool_res.status_code == 201
    assert pool_res.data['name'] == 'استخر قهرمانی شهید چمران'
    assert pool_res.data['slug'] is not None


# ==============================================================================
# 10. تست مدیریت امنیت و کنترل کاربران (User Management)
# ==============================================================================
@pytest.mark.django_db
def test_admin_user_security_and_account_management(admin_env):
    client = APIClient()
    client.force_authenticate(user=admin_env['admin_user'])
    swimmer_user = admin_env['swimmer_user']

    # 1. List users
    list_res = client.get('/api/auth/users/')
    assert list_res.status_code == 200
    assert len(list_res.data.get('results', list_res.data)) >= 3

    # 2. Deactivate user account
    deact_res = client.patch(f'/api/auth/users/{swimmer_user.id}/', {'is_active': False}, format='json')
    assert deact_res.status_code == 200
    swimmer_user.refresh_from_db()
    assert swimmer_user.is_active is False

    # 3. Reactivate user account
    react_res = client.patch(f'/api/auth/users/{swimmer_user.id}/', {'is_active': True}, format='json')
    assert react_res.status_code == 200
    swimmer_user.refresh_from_db()
    assert swimmer_user.is_active is True
