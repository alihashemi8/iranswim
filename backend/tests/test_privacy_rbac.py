import datetime
from decimal import Decimal
import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.assessments.models import (
    LevelPromotionProposal,
    SkillAssessment,
    SwimmingRecord,
)
from apps.attendance.models import AttendanceRecord
from apps.coaches.models import (
    CoachAdministrativeNote,
    CoachCertificate,
    CoachContract,
    CoachPayroll,
    CoachPerformanceEvaluation,
    CoachProfile,
)
from apps.content.models import (
    Announcement,
    NewsPost,
    Notification,
    SupportTicket,
)
from apps.education.models import (
    Course,
    Enrollment,
    EnrollmentRequest,
    GroupCoach,
    Skill,
    SkillLevel,
    SwimmerGroup,
)
from apps.finance.models import Installment, Invoice, Payment
from apps.leagues.models import League, LeagueCategory, LeagueEntry
from apps.scheduling.models import ClassSession
from apps.swimmers.models import (
    DocumentStatus,
    SwimmerGuardianRelation,
    SwimmerProfile,
)


VALID_JPG_BYTES = (
    b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00'
    + b'\x00' * 80
    + b'\xff\xd9'
)


def _doc_file(name):
    return SimpleUploadedFile(name, VALID_JPG_BYTES, content_type='image/jpeg')


def _items(res_or_data):
    data = res_or_data.data if hasattr(res_or_data, 'data') else res_or_data
    if isinstance(data, dict) and 'results' in data:
        return data['results']
    return data


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def privacy_world(db):
    today = timezone.localdate()

    admin = User.objects.create_user(
        phone='09129000001',
        password='AdminPass@2026',
        first_name='مدیر',
        last_name='کل',
        role=User.Role.ADMIN,
        is_staff=True,
        is_superuser=True,
    )
    supervisor = User.objects.create_user(
        phone='09129000002',
        password='SupervisorPass@2026',
        first_name='ناظر',
        last_name='فنی',
        role=User.Role.SUPERVISOR,
        is_staff=True,
        is_superuser=False,
    )
    staff_swimmer = User.objects.create_user(
        phone='09129000003',
        password='StaffSwimmer@2026',
        first_name='کارمند',
        last_name='ساده',
        role=User.Role.SWIMMER,
        is_staff=True,
        is_superuser=False,
    )

    coach1_user = User.objects.create_user(
        phone='09129000011',
        password='Coach1Pass@2026',
        first_name='مربی',
        last_name='یکم',
        national_id='0091112233',
        role=User.Role.COACH,
    )
    coach1 = CoachProfile.objects.create(
        user=coach1_user,
        gender=CoachProfile.Gender.MALE,
        date_of_birth=datetime.date(1988, 5, 10),
        emergency_contact_name='همسر مربی یکم',
        emergency_contact_phone='09128881111',
        address='قزوین، خیابان خیام، پلاک ۱۲',
        internal_notes='یادداشت محرمانه اداری مربی یکم',
        specialties='کرال سینه',
        bio='رزومه رسمی مربی یکم',
        lifeguard_certificate='LG-101',
        lifeguard_expiration=today + datetime.timedelta(days=180),
        years_of_experience=8,
        previous_experience='باشگاه آزادی',
        employment_start_date=today - datetime.timedelta(days=365),
        employment_status=CoachProfile.EmploymentStatus.ACTIVE,
        employment_type=CoachProfile.EmploymentType.HOURLY,
        hourly_rate=Decimal('450000.00'),
        fixed_monthly_salary=Decimal('15000000.00'),
        revenue_percentage=Decimal('25.00'),
        contractual_weekly_hours=24,
        show_on_landing=True,
    )

    # Second coach with intentionally blank first/last name to verify no phone fallback leakage
    coach2_user = User.objects.create_user(
        phone='09129000012',
        password='Coach2Pass@2026',
        first_name='',
        last_name='',
        national_id='0092223344',
        role=User.Role.COACH,
    )
    coach2 = CoachProfile.objects.create(
        user=coach2_user,
        gender=CoachProfile.Gender.FEMALE,
        emergency_contact_name='مخاطب مربی دوم',
        emergency_contact_phone='09128882222',
        address='قزوین، کوثر، پلاک ۹۹',
        internal_notes='یادداشت محرمانه اداری مربی دوم',
        specialties='قورباغه',
        hourly_rate=Decimal('500000.00'),
        employment_status=CoachProfile.EmploymentStatus.ACTIVE,
        show_on_landing=True,
    )

    # Coach HR dossier artifacts on coach1
    cert1 = CoachCertificate.objects.create(
        coach=coach1,
        title='مدرک مربیگری درجه یک',
        issuing_organization='فدراسیون شنا',
        certificate_number='CERT-9988',
        is_verified=True,
    )
    contract1 = CoachContract.objects.create(
        coach=coach1,
        contract_number='CNT-1405-01',
        start_date=today - datetime.timedelta(days=60),
        end_date=today + datetime.timedelta(days=300),
        employment_type=CoachProfile.EmploymentType.HOURLY,
        hourly_rate=Decimal('450000.00'),
        status=CoachContract.Status.ACTIVE,
        created_by=admin,
    )
    payroll1 = CoachPayroll.objects.create(
        coach=coach1,
        contract=contract1,
        period_label='آبان ۱۴۰۵',
        period_start=today - datetime.timedelta(days=15),
        period_end=today + datetime.timedelta(days=15),
        compensation_model=CoachProfile.EmploymentType.HOURLY,
        base_rate=Decimal('450000.00'),
        teaching_hours=Decimal('20.00'),
        completed_sessions_count=10,
        base_compensation=Decimal('9000000.00'),
        gross_amount=Decimal('9000000.00'),
        net_payable_amount=Decimal('9000000.00'),
    )
    admin_note1 = CoachAdministrativeNote.objects.create(
        coach=coach1,
        title='گزارش محرمانه منابع انسانی',
        description='جزئیات محرمانه انضباطی و اداری',
        date=today,
        created_by=admin,
        is_confidential=True,
    )
    eval1 = CoachPerformanceEvaluation.objects.create(
        coach=coach1,
        evaluator=supervisor,
        evaluation_date=today,
        period_label='پاییز ۱۴۰۵',
        overall_score=Decimal('4.75'),
        general_feedback='عملکرد فنی بسیار مطلوب',
        is_shared_with_coach=True,
    )

    # Swimmers with full sensitive PII and uploaded documents
    level1 = SkillLevel.objects.create(name='مبتدی', order=1)
    level2 = SkillLevel.objects.create(name='پیشرفته', order=2)
    skill1 = Skill.objects.create(level=level1, name='کرال سینه مقدماتی', order=1)

    sw1_user = User.objects.create_user(
        phone='09129000021',
        password='Swimmer1Pass@2026',
        first_name='آرش',
        last_name='حسینی',
        national_id='0015551111',
        role=User.Role.SWIMMER,
    )
    swimmer1 = SwimmerProfile.objects.create(
        user=sw1_user,
        first_name='آرش',
        last_name='حسینی',
        gender='MALE',
        phone='09129000021',
        national_id='0015551111',
        date_of_birth=datetime.date(2012, 3, 15),
        father_name='بهرام حسینی',
        father_phone='09127771111',
        mother_phone='09127771112',
        emergency_contact_name='عموی آرش',
        emergency_contact_phone='09127771113',
        address='قزوین، ملاصدرا، کوچه ۵',
        school_name='دبستان علامه',
        medical_notes='آسم خفیف ورزشی',
        current_level=level1,
        birth_certificate_image=_doc_file('sw1_birth.jpg'),
        national_card_image=_doc_file('sw1_nid.jpg'),
        sports_insurance_image=_doc_file('sw1_ins.jpg'),
        birth_certificate_status=DocumentStatus.PENDING,
        national_card_status=DocumentStatus.APPROVED,
        sports_insurance_status=DocumentStatus.APPROVED,
        is_profile_completed=False,
    )
    SwimmerGuardianRelation.objects.create(
        guardian=sw1_user, swimmer=swimmer1, relationship_type='SELF', is_primary=True, is_verified=True
    )

    sw2_user = User.objects.create_user(
        phone='09129000022',
        password='Swimmer2Pass@2026',
        first_name='سارا',
        last_name='کریمی',
        national_id='0026662222',
        role=User.Role.SWIMMER,
    )
    swimmer2 = SwimmerProfile.objects.create(
        user=sw2_user,
        first_name='سارا',
        last_name='کریمی',
        gender='FEMALE',
        phone='09129000022',
        national_id='0026662222',
        date_of_birth=datetime.date(2011, 7, 20),
        father_name='کامران کریمی',
        father_phone='09127772221',
        mother_phone='09127772222',
        emergency_contact_name='مادر سارا',
        emergency_contact_phone='09127772223',
        address='قزوین، مینودر، بلوار صدف',
        school_name='دبیرستان فرزانگان',
        medical_notes='حساسیت پوستی به کلر بالا',
        current_level=level2,
        birth_certificate_image=_doc_file('sw2_birth.jpg'),
        national_card_image=_doc_file('sw2_nid.jpg'),
        sports_insurance_image=_doc_file('sw2_ins.jpg'),
        birth_certificate_status=DocumentStatus.PENDING,
        national_card_status=DocumentStatus.PENDING,
        sports_insurance_status=DocumentStatus.APPROVED,
        is_profile_completed=False,
    )
    SwimmerGuardianRelation.objects.create(
        guardian=sw2_user, swimmer=swimmer2, relationship_type='SELF', is_primary=True, is_verified=True
    )

    # Multi-child verified guardian and an unverified guardian
    verified_guardian_user = User.objects.create_user(
        phone='09129000031',
        password='GuardianPass@2026',
        first_name='مهرداد',
        last_name='رضایی',
        role=User.Role.SWIMMER,
    )
    child_swimmer = SwimmerProfile.objects.create(
        user=None,
        first_name='کیان',
        last_name='رضایی',
        gender='MALE',
        national_id='0037773333',
        father_name='مهرداد رضایی',
        father_phone='09129000031',
        medical_notes='ملاحظه پزشکی کودک',
        current_level=level1,
        sports_insurance_image=_doc_file('child_ins.jpg'),
    )
    SwimmerGuardianRelation.objects.create(
        guardian=verified_guardian_user,
        swimmer=child_swimmer,
        relationship_type='FATHER',
        is_primary=True,
        is_verified=True,
    )

    unverified_guardian_user = User.objects.create_user(
        phone='09129000032',
        password='UnverifiedPass@2026',
        first_name='ولی',
        last_name='تاییدنشده',
        role=User.Role.SWIMMER,
    )
    SwimmerGuardianRelation.objects.create(
        guardian=unverified_guardian_user,
        swimmer=swimmer2,
        relationship_type='GUARDIAN',
        is_primary=False,
        is_verified=False,
    )

    # Courses, Groups, Sessions, Enrollments
    course1 = Course.objects.create(
        name='دوره پاییز الف',
        start_date=today - datetime.timedelta(days=10),
        end_date=today + datetime.timedelta(days=60),
        base_price=Decimal('2500000.00'),
        sessions_count=12,
    )
    course1.coaches.add(coach1)
    group1 = SwimmerGroup.objects.create(
        course=course1, name='گروه یکم', skill_level=level1, capacity=15, pool_location='استخر المپیک'
    )
    group_coach1 = GroupCoach.objects.create(
        group=group1, coach=coach1, is_primary=True, assigned_from=today - datetime.timedelta(days=10)
    )

    course2 = Course.objects.create(
        name='دوره پاییز ب',
        start_date=today - datetime.timedelta(days=10),
        end_date=today + datetime.timedelta(days=60),
        base_price=Decimal('2800000.00'),
        sessions_count=12,
    )
    course2.coaches.add(coach2)
    group2 = SwimmerGroup.objects.create(
        course=course2, name='گروه دوم', skill_level=level2, capacity=15, pool_location='استخر آزادی'
    )
    group_coach2 = GroupCoach.objects.create(
        group=group2, coach=coach2, is_primary=True, assigned_from=today - datetime.timedelta(days=10)
    )

    enr1 = Enrollment.objects.create(swimmer=swimmer1, course=course1, group=group1, coach=coach1, status='ACTIVE')
    enr_child = Enrollment.objects.create(swimmer=child_swimmer, course=course1, group=group1, coach=coach1, status='ACTIVE')
    enr2 = Enrollment.objects.create(swimmer=swimmer2, course=course2, group=group2, coach=coach2, status='ACTIVE')

    enr_req1 = EnrollmentRequest.objects.create(
        applicant_name='متقاضی نمونه',
        applicant_phone='09129998877',
        applicant_national_id='0048884444',
        course=course1,
        group=group1,
    )

    session1 = ClassSession.objects.create(
        group=group1,
        coach=coach1,
        session_date=today,
        start_time=datetime.time(16, 0),
        end_time=datetime.time(17, 30),
        pool_location='استخر المپیک',
    )
    session2 = ClassSession.objects.create(
        group=group2,
        coach=coach2,
        session_date=today,
        start_time=datetime.time(18, 0),
        end_time=datetime.time(19, 30),
        pool_location='استخر آزادی',
    )

    # Assessments, records, proposals
    assess2 = SkillAssessment.objects.create(
        swimmer=swimmer2,
        skill=skill1,
        assessed_by=coach2_user,
        assessed_at=today,
        score=Decimal('88.00'),
        feedback='عالی',
    )
    record2 = SwimmingRecord.objects.create(
        swimmer=swimmer2,
        stroke='FREESTYLE',
        distance_meters=50,
        duration_seconds=Decimal('32.45'),
        recorded_at=today,
        recorded_by=coach2_user,
        verification_status=SwimmingRecord.VerificationStatus.VERIFIED,
    )
    proposal2 = LevelPromotionProposal.objects.create(
        swimmer=swimmer2,
        coach=coach2,
        current_level=level1,
        proposed_level=level2,
        coach_notes='پیشنهاد ارتقا',
    )

    # Finance records
    inv1 = Invoice.objects.create(
        invoice_number='INV-PRV-001',
        swimmer=swimmer1,
        enrollment=enr1,
        total_amount=Decimal('2500000.00'),
        issue_date=today,
        due_date=today + datetime.timedelta(days=30),
    )
    inv2 = Invoice.objects.create(
        invoice_number='INV-PRV-002',
        swimmer=swimmer2,
        enrollment=enr2,
        total_amount=Decimal('2800000.00'),
        issue_date=today,
        due_date=today + datetime.timedelta(days=30),
    )
    inst2 = Installment.objects.create(
        invoice=inv2, installment_number=1, amount=Decimal('2800000.00'), due_date=today + datetime.timedelta(days=10)
    )
    pay2 = Payment.objects.create(
        payment_number='PAY-PRV-002',
        swimmer=swimmer2,
        amount=Decimal('1000000.00'),
        paid_at=timezone.now(),
        recorded_by=admin,
    )

    # Content: announcements, notifications (broadcast admin alert + personal), tickets, news
    ann_coaches = Announcement.objects.create(
        title='جلسه داخلی کادر مربیان',
        message='فقط برای مربیان است.',
        audience=Announcement.Audience.COACHES,
        created_by=admin,
    )
    ann_group1 = Announcement.objects.create(
        title='اطلاعیه کلاس یکم',
        message='لوازم تمرین را همراه بیاورید.',
        audience=Announcement.Audience.GROUP,
        target_group=group1,
        created_by=coach1_user,
    )
    broadcast_notif = Notification.objects.create(
        recipient=None,
        category=Notification.Category.REGISTRATION,
        title='هشدار ادمین برای بررسی مدارک جدید',
        message='شناگر جدید مدارک بارگذاری کرده است.',
        link='/admin/swimmers',
    )
    sw1_notif = Notification.objects.create(
        recipient=sw1_user,
        category=Notification.Category.PAYMENT,
        title='یادآوری شهریه آرش',
        message='سررسید شهریه نزدیک است.',
    )
    ticket2 = SupportTicket.objects.create(
        user=sw2_user, swimmer=swimmer2, subject='سوال محرمانه سارا', description='توضیحات محرمانه سارا'
    )
    news_admin_blank = NewsPost.objects.create(
        title='خبر عمومی تست',
        slug='news-public-test-priv',
        body='متن خبر عمومی',
        author=coach2_user,
        status=NewsPost.Status.PUBLISHED,
    )

    # League & entries
    league = League.objects.create(
        name='لیگ پاییزه تست',
        season='پاییز ۱۴۰۵',
        starts_at=today - datetime.timedelta(days=5),
        ends_at=today + datetime.timedelta(days=30),
        is_active=True,
    )
    cat = LeagueCategory.objects.create(league=league, title='رده آزاد', age_min=6, age_max=30, gender='ALL')
    LeagueEntry.objects.create(league=league, category=cat, swimmer=swimmer1, total_points=Decimal('20.00'))
    LeagueEntry.objects.create(league=league, category=cat, swimmer=swimmer2, total_points=Decimal('35.00'))

    return {
        'admin': admin,
        'supervisor': supervisor,
        'staff_swimmer': staff_swimmer,
        'coach1_user': coach1_user,
        'coach1': coach1,
        'coach2_user': coach2_user,
        'coach2': coach2,
        'cert1': cert1,
        'contract1': contract1,
        'payroll1': payroll1,
        'admin_note1': admin_note1,
        'eval1': eval1,
        'sw1_user': sw1_user,
        'swimmer1': swimmer1,
        'sw2_user': sw2_user,
        'swimmer2': swimmer2,
        'verified_guardian_user': verified_guardian_user,
        'child_swimmer': child_swimmer,
        'unverified_guardian_user': unverified_guardian_user,
        'level1': level1,
        'level2': level2,
        'skill1': skill1,
        'course1': course1,
        'group1': group1,
        'group_coach1': group_coach1,
        'course2': course2,
        'group2': group2,
        'enr1': enr1,
        'enr_child': enr_child,
        'enr2': enr2,
        'enr_req1': enr_req1,
        'session1': session1,
        'session2': session2,
        'assess2': assess2,
        'record2': record2,
        'proposal2': proposal2,
        'inv1': inv1,
        'inv2': inv2,
        'inst2': inst2,
        'pay2': pay2,
        'ann_coaches': ann_coaches,
        'ann_group1': ann_group1,
        'broadcast_notif': broadcast_notif,
        'sw1_notif': sw1_notif,
        'ticket2': ticket2,
        'news_admin_blank': news_admin_blank,
        'league': league,
    }


SENSITIVE_SWIMMER_FIELDS = {
    'phone',
    'national_id',
    'date_of_birth',
    'father_name',
    'father_phone',
    'mother_phone',
    'emergency_contact_name',
    'emergency_contact_phone',
    'address',
    'latitude',
    'longitude',
    'school_name',
    'medical_notes',
    'medical_conditions',
    'guardian_phone',
    'birth_certificate_image',
    'birth_certificate_status',
    'birth_certificate_status_display',
    'national_card_image',
    'national_card_status',
    'national_card_status_display',
    'sports_insurance_image',
    'sports_insurance_status',
    'sports_insurance_status_display',
    'sports_insurance_expiry',
    'documents_rejection_reason',
}

SENSITIVE_COACH_FIELDS = {
    'phone',
    'national_id',
    'hourly_rate',
    'fixed_monthly_salary',
    'revenue_percentage',
    'percentage_revenue_basis',
    'emergency_contact_name',
    'emergency_contact_phone',
    'address',
    'internal_notes',
    'date_of_birth',
    'lifeguard_certificate',
    'lifeguard_expiration',
    'previous_experience',
    'personnel_id',
    'contractual_weekly_hours',
    'active_contract_summary',
    'current_month_payroll_status',
    'employment_status',
    'employment_status_display',
    'employment_type',
    'employment_type_display',
    'employment_start_date',
}


@pytest.mark.django_db
def test_coach_cannot_see_swimmer_sensitive_information(api_client, privacy_world):
    """
    مربی فقط اطلاعات عملیاتی و آموزشی شناگران کلاس خود (نام، جنسیت، سطح مهارت و کلاس) را می‌بیند
    و به هیچ اطلاعات حساس هویتی، تماس، آدرس، پزشکی، مدارک و داده‌های سایر شناگران دسترسی ندارد.
    """
    w = privacy_world
    api_client.force_authenticate(user=w['coach1_user'])
    sw1 = w['swimmer1']
    sw2 = w['swimmer2']

    # 1. /api/swimmers/ returns only assigned class swimmers without sensitive fields
    list_res = api_client.get('/api/swimmers/')
    assert list_res.status_code == 200
    rows = list_res.data['results']
    returned_ids = {r['id'] for r in rows}
    assert returned_ids == {sw1.id, w['child_swimmer'].id}
    assert sw2.id not in returned_ids
    assert list_res.data['counts']['docs_pending'] == 0

    for row in rows:
        assert 'full_name' in row
        assert 'level_name' in row
        for forbidden_key in SENSITIVE_SWIMMER_FIELDS:
            assert forbidden_key not in row, f"Coach swimmer list leaked '{forbidden_key}'"

    # Search/filter oracles must not work for coach
    assert api_client.get(f'/api/swimmers/?search={sw1.national_id}').data['results'] == []
    assert api_client.get(f'/api/swimmers/?search={sw1.phone}').data['results'] == []
    assert api_client.get('/api/swimmers/?status=DOCS_PENDING').data['results'] == []

    # 2. /api/swimmers/<id>/ detail & mutations are strictly forbidden for coaches
    for target in (sw1, sw2):
        assert api_client.get(f'/api/swimmers/{target.id}/').status_code == 403
        assert api_client.patch(f'/api/swimmers/{target.id}/', {'first_name': 'تغییر'}).status_code == 403
        assert api_client.delete(f'/api/swimmers/{target.id}/').status_code == 403
        for doc_type in ('birth_certificate', 'national_card', 'sports_insurance'):
            assert api_client.get(f'/api/swimmers/{target.id}/documents/{doc_type}/').status_code == 403

    assert api_client.post('/api/swimmers/', {'first_name': 'جدید', 'last_name': 'تست'}).status_code == 403

    # 3. /api/coaches/my-classes/<group_id>/ omits national_id and personal info
    cls_res = api_client.get(f"/api/coaches/my-classes/{w['group1'].id}/")
    assert cls_res.status_code == 200
    for s_item in cls_res.data['swimmers']:
        for forbidden_key in SENSITIVE_SWIMMER_FIELDS:
            assert forbidden_key not in s_item, f"Class detail leaked '{forbidden_key}'"
    assert api_client.get(f"/api/coaches/my-classes/{w['group2'].id}/").status_code == 403

    # 4. /api/coaches/swimmer-dossier/<id>/ strips sensitive PII on assigned swimmer & blocks unrelated swimmer
    dossier_res = api_client.get(f'/api/coaches/swimmer-dossier/{sw1.id}/')
    assert dossier_res.status_code == 200
    assert dossier_res.data['swimmer']['full_name'] == sw1.full_name
    for forbidden_key in SENSITIVE_SWIMMER_FIELDS:
        assert forbidden_key not in dossier_res.data['swimmer']
    assert api_client.get(f'/api/coaches/swimmer-dossier/{sw2.id}/').status_code == 403

    # 5. Enrollments list/detail scoped & stripped of swimmer_phone and swimmer_national_id
    enr_res = api_client.get('/api/education/enrollments/')
    assert enr_res.status_code == 200
    enr_rows = _items(enr_res)
    enr_ids = {item['id'] for item in enr_rows}
    assert w['enr1'].id in enr_ids
    assert w['enr2'].id not in enr_ids
    for item in enr_rows:
        assert 'swimmer_phone' not in item
        assert 'swimmer_national_id' not in item
    enr1_detail = api_client.get(f"/api/education/enrollments/{w['enr1'].id}/")
    assert enr1_detail.status_code == 200
    assert 'swimmer_phone' not in enr1_detail.data
    assert 'swimmer_national_id' not in enr1_detail.data
    assert api_client.get(f"/api/education/enrollments/{w['enr2'].id}/").status_code == 404

    # 6. Finance & user management & requests remain hidden from coaches
    assert _items(api_client.get('/api/finance/invoices/')) == []
    assert _items(api_client.get('/api/finance/installments/')) == []
    assert _items(api_client.get('/api/finance/payments/')) == []
    assert api_client.get('/api/education/requests/').status_code == 403
    assert api_client.get('/api/auth/users/').status_code == 403


@pytest.mark.django_db
def test_coach_isolation_for_assessments_attendance_and_admin_notifications(api_client, privacy_world):
    """
    مربی نمی‌تواند ارزیابی، رکورد، پیشنهاد ارتقا یا حضور و غیاب برای شناگر خارج از کلاس خود ثبت کند
    و اعلان‌های مدیریتی/سیستمی برای مربی نمایش داده نمی‌شود.
    """
    w = privacy_world
    api_client.force_authenticate(user=w['coach1_user'])
    sw2 = w['swimmer2']

    # Cannot see unrelated swimmer's assessments/records
    assert _items(api_client.get('/api/assessments/skills/')) == []
    assert _items(api_client.get('/api/assessments/records/')) == []

    # Cannot create assessment / record / promotion proposal for unrelated swimmer
    assert api_client.post('/api/assessments/skills/', {
        'swimmer': sw2.id,
        'skill': w['skill1'].id,
        'assessed_at': str(timezone.localdate()),
        'score': '90.00',
        'status': 'PASSED',
    }).status_code == 403
    assert api_client.post('/api/assessments/records/', {
        'swimmer': sw2.id,
        'stroke': 'FREESTYLE',
        'distance_meters': 50,
        'duration_seconds': '30.50',
        'recorded_at': str(timezone.localdate()),
    }).status_code == 403
    assert api_client.post('/api/assessments/promotions/', {
        'swimmer': sw2.id,
        'current_level': w['level1'].id,
        'proposed_level': w['level2'].id,
        'coach_notes': 'پیشنهاد تستی غیرمجاز',
    }).status_code == 403

    # Cannot inject an unrelated swimmer into own session attendance bulk-save (and atomic rollback holds)
    bad_att_res = api_client.post('/api/attendance/bulk-save/', {
        'session_id': w['session1'].id,
        'records': [
            {'swimmer_id': w['swimmer1'].id, 'status': 'PRESENT'},
            {'swimmer_id': sw2.id, 'status': 'PRESENT'},
        ],
    }, format='json')
    assert bad_att_res.status_code == 403
    assert AttendanceRecord.objects.filter(session=w['session1']).count() == 0

    # Cannot see system/admin broadcast notification (recipient=None)
    notif_res = api_client.get('/api/content/notifications/')
    assert notif_res.status_code == 200
    notif_ids = {n['id'] for n in notif_res.data['results']}
    assert w['broadcast_notif'].id not in notif_ids
    assert api_client.post(f"/api/content/notifications/{w['broadcast_notif'].id}/read/").status_code == 404


@pytest.mark.django_db
def test_swimmer_cannot_see_coaches_personal_information(api_client, privacy_world):
    """
    شناگر (و کاربر عادی دارای پرچم is_staff بدون نقش مدیریتی یا کاربر ناشناس)
    نباید اطلاعات شخصی و مالی مربیان را ببیند.
    """
    w = privacy_world

    for actor in (None, w['sw1_user'], w['staff_swimmer']):
        if actor is None:
            api_client.force_authenticate(user=None)
        else:
            api_client.force_authenticate(user=actor)

        # Coaches list and detail expose only public showcase fields, never personal/HR/salary fields
        list_res = api_client.get('/api/coaches/')
        assert list_res.status_code == 200
        coach_rows = _items(list_res)
        assert len(coach_rows) >= 2
        for item in coach_rows:
            for forbidden_key in SENSITIVE_COACH_FIELDS:
                assert forbidden_key not in item, f"Coaches list leaked '{forbidden_key}'"
            # Even coach2 without first/last name must NOT fall back to exposing phone number
            assert w['coach2_user'].phone not in str(item.get('full_name', ''))

        detail_res = api_client.get(f"/api/coaches/{w['coach1'].id}/")
        assert detail_res.status_code == 200
        for forbidden_key in SENSITIVE_COACH_FIELDS:
            assert forbidden_key not in detail_res.data

        # Course & news serializers must also not leak blank-named coach's phone
        courses_res = api_client.get('/api/education/courses/')
        assert courses_res.status_code == 200
        assert w['coach2_user'].phone not in str(courses_res.data)
        news_res = api_client.get('/api/content/news/')
        assert news_res.status_code == 200
        assert w['coach2_user'].phone not in str(news_res.data)

    # Authenticated swimmer checks on protected endpoints
    api_client.force_authenticate(user=w['sw1_user'])
    c1_id = w['coach1'].id

    # Education groups, swimmer profile /me/, & enrollments omit coach_phone & phone fallback
    groups_res = api_client.get('/api/education/groups/')
    assert groups_res.status_code == 200
    assert w['coach2_user'].phone not in str(groups_res.data)
    for grp in _items(groups_res):
        for assign in grp.get('coach_assignments', []):
            assert 'coach_phone' not in assign
    me_res = api_client.get('/api/swimmers/me/')
    assert me_res.status_code == 200
    assert w['coach2_user'].phone not in str(me_res.data)

    # Swimmer cannot mutate coach or access any HR endpoint (401/403, never 200/500)
    assert api_client.patch(f'/api/coaches/{c1_id}/', {'bio': 'hacked'}).status_code == 403
    assert api_client.delete(f'/api/coaches/{c1_id}/').status_code == 403
    for endpoint in (
        f'/api/coaches/{c1_id}/contracts/',
        f'/api/coaches/{c1_id}/payrolls/',
        f'/api/coaches/{c1_id}/certificates/',
        f'/api/coaches/{c1_id}/leave-requests/',
        f'/api/coaches/{c1_id}/evaluations/',
        f'/api/coaches/{c1_id}/administrative-notes/',
        f'/api/coaches/{c1_id}/activity-timeline/',
        f'/api/coaches/{c1_id}/attendance-summary/',
        f'/api/coaches/{c1_id}/schedule/',
        f"/api/coaches/evaluations/{w['eval1'].id}/",
        '/api/coaches/statistics/',
        '/api/coaches/reports/',
    ):
        assert api_client.get(endpoint).status_code == 403, f"Expected 403 on {endpoint} for swimmer"
    for endpoint in (
        f"/api/coaches/contracts/{w['contract1'].id}/",
        f"/api/coaches/payrolls/{w['payroll1'].id}/",
        f"/api/coaches/certificates/{w['cert1'].id}/",
    ):
        assert api_client.get(endpoint).status_code in (403, 404), f"Expected 403/404 on {endpoint} for swimmer"


@pytest.mark.django_db
def test_swimmer_cannot_see_other_swimmers_personal_info_or_oracle(api_client, privacy_world):
    """
    شناگر نباید هیچ‌گونه اطلاعات شخصی، پرونده، مدرک، ثبت‌نام، فاکتور یا جستجوی غیرمستقیم سایر شناگران را ببیند.
    """
    w = privacy_world
    api_client.force_authenticate(user=w['sw1_user'])
    sw1 = w['swimmer1']
    sw2 = w['swimmer2']

    # 1. Swimmers list strictly scoped to self
    sw_list = api_client.get('/api/swimmers/')
    assert sw_list.status_code == 200
    assert [r['id'] for r in sw_list.data['results']] == [sw1.id]
    assert sw_list.data['counts']['docs_pending'] == 0
    assert api_client.get(f'/api/swimmers/?search={sw2.first_name}').data['results'] == []
    assert api_client.get(f'/api/swimmers/?search={sw2.national_id}').data['results'] == []

    # 2. Direct detail, /me/?swimmer_id=, /me/complete/, documents download blocked on other swimmer
    assert api_client.get(f'/api/swimmers/{sw2.id}/').status_code == 403
    assert api_client.patch(f'/api/swimmers/{sw2.id}/', {'first_name': 'hack'}).status_code == 403
    assert api_client.get(f'/api/swimmers/me/?swimmer_id={sw2.id}').status_code == 403
    assert api_client.post('/api/swimmers/me/complete/', {'swimmer_id': sw2.id}).status_code == 403
    for doc_type in ('birth_certificate', 'national_card', 'sports_insurance'):
        assert api_client.get(f'/api/swimmers/{sw2.id}/documents/{doc_type}/').status_code == 403

    # Swimmer cannot self-approve documents via PATCH /swimmers/me/
    api_client.patch('/api/swimmers/me/', {
        'birth_certificate_status': DocumentStatus.APPROVED,
        'is_profile_completed': True,
    })
    sw1.refresh_from_db()
    assert sw1.birth_certificate_status == DocumentStatus.PENDING
    assert sw1.is_profile_completed is False

    # 3. Leaderboard & League Performance Privacy
    lb_res = api_client.get(f"/api/leagues/{w['league'].id}/leaderboard/")
    assert lb_res.status_code == 200
    for row in lb_res.data:
        assert 'age' not in row
        assert 'national_id' not in row
        assert 'phone' not in row
        assert 'date_of_birth' not in row
    assert api_client.get(f"/api/leagues/{w['league'].id}/leaderboard/?search={sw2.national_id}").data == []

    perf_other = api_client.get(f"/api/leagues/{w['league'].id}/swimmer_performance/{sw2.id}/")
    assert perf_other.status_code == 403
    perf_self = api_client.get(f"/api/leagues/{w['league'].id}/swimmer_performance/{sw1.id}/")
    assert perf_self.status_code == 200
    assert 'national_id' not in perf_self.data['swimmer']
    assert 'date_of_birth' not in perf_self.data['swimmer']

    # 4. Cross-swimmer isolation on enrollments, finance, scheduling, content, and search oracles
    assert api_client.get(f"/api/education/enrollments/{w['enr2'].id}/").status_code == 404
    assert api_client.get(f"/api/finance/invoices/{w['inv2'].id}/").status_code == 404
    assert [i['id'] for i in _items(api_client.get('/api/finance/installments/'))] == []
    assert [p['id'] for p in _items(api_client.get('/api/finance/payments/'))] == []
    assert api_client.get(f"/api/scheduling/sessions/{w['session2'].id}/").status_code == 403
    # Swimmer can find own session by course/group name, NOT by probing classmate's or other swimmer's name
    assert len(_items(api_client.get(f"/api/scheduling/sessions/?search={w['course1'].name}"))) >= 1
    assert _items(api_client.get(f"/api/scheduling/sessions/?search={w['child_swimmer'].first_name}")) == []
    assert _items(api_client.get(f'/api/scheduling/sessions/?search={sw2.first_name}')) == []

    # Announcements & notifications & support tickets
    ann_ids = {a['id'] for a in _items(api_client.get('/api/content/announcements/'))}
    assert w['ann_coaches'].id not in ann_ids
    assert w['ann_group1'].id in ann_ids
    assert api_client.get(f"/api/content/announcements/{w['ann_coaches'].id}/").status_code == 404

    notif_ids = {n['id'] for n in api_client.get('/api/content/notifications/').data['results']}
    assert w['sw1_notif'].id in notif_ids
    assert w['broadcast_notif'].id not in notif_ids

    assert api_client.get(f"/api/content/tickets/{w['ticket2'].id}/").status_code == 404
    assert api_client.post('/api/content/tickets/', {
        'swimmer': sw2.id,
        'subject': 'تیکت جعلی',
        'description': 'تست',
    }).status_code == 403

    # Unverified vs Verified Guardian isolation
    api_client.force_authenticate(user=w['unverified_guardian_user'])
    assert _items(api_client.get('/api/swimmers/my-children/')) == []
    assert api_client.get('/api/swimmers/').data['results'] == []
    assert api_client.get(f'/api/swimmers/{sw2.id}/').status_code == 403
    assert api_client.get(f'/api/swimmers/{sw2.id}/documents/sports_insurance/').status_code == 403

    api_client.force_authenticate(user=w['verified_guardian_user'])
    children_res = api_client.get('/api/swimmers/my-children/')
    assert children_res.status_code == 200
    assert [rel['swimmer'] for rel in _items(children_res)] == [w['child_swimmer'].id]
    assert api_client.get(f"/api/swimmers/{w['child_swimmer'].id}/documents/sports_insurance/").status_code == 200


@pytest.mark.django_db
def test_only_admin_and_supervisor_see_all_information_with_readonly_separation(api_client, privacy_world):
    """
    فقط مدیر و ناظر فنی اجازه مشاهده تمامی اطلاعات حساس شناگران و مربیان را دارند
    و نقش ناظر فنی در عملیات ویرایشی/مالی محدود به مشاهده است.
    """
    w = privacy_world
    sw1 = w['swimmer1']
    sw2 = w['swimmer2']
    c1 = w['coach1']

    for privileged_user in (w['admin'], w['supervisor']):
        api_client.force_authenticate(user=privileged_user)

        # 1. Full swimmer directory, PII search, detail, and all 3 document downloads
        sw_list = api_client.get('/api/swimmers/')
        assert sw_list.status_code == 200
        returned_ids = {r['id'] for r in sw_list.data['results']}
        assert {sw1.id, sw2.id, w['child_swimmer'].id}.issubset(returned_ids)
        assert sw_list.data['counts']['docs_pending'] >= 2

        search_nid = api_client.get(f'/api/swimmers/?search={sw2.national_id}')
        assert [r['id'] for r in search_nid.data['results']] == [sw2.id]

        sw2_detail = api_client.get(f'/api/swimmers/{sw2.id}/')
        assert sw2_detail.status_code == 200
        assert sw2_detail.data['national_id'] == sw2.national_id
        assert sw2_detail.data['father_phone'] == sw2.father_phone
        assert sw2_detail.data['medical_notes'] == sw2.medical_notes

        for doc_type in ('birth_certificate', 'national_card', 'sports_insurance'):
            assert api_client.get(f'/api/swimmers/{sw2.id}/documents/{doc_type}/').status_code == 200

        # 2. Full coach HR dossiers, confidential fields, statistics, and reports
        c1_detail = api_client.get(f'/api/coaches/{c1.id}/')
        assert c1_detail.status_code == 200
        assert c1_detail.data['phone'] == w['coach1_user'].phone
        assert c1_detail.data['national_id'] == w['coach1_user'].national_id
        assert c1_detail.data['internal_notes'] == c1.internal_notes
        assert c1_detail.data['hourly_rate'] == '450000.00'
        assert c1_detail.data['active_contract_summary']['contract_number'] == 'CNT-1405-01'
        assert c1_detail.data['current_month_payroll_status']['period_label'] == 'آبان ۱۴۰۵'

        stats_res = api_client.get('/api/coaches/statistics/')
        assert stats_res.status_code == 200
        assert Decimal(stats_res.data['total_payroll_month']) > Decimal('0')

        assert api_client.get('/api/coaches/reports/?type=payroll').status_code == 200
        assert api_client.get(f'/api/coaches/{c1.id}/contracts/').status_code == 200
        assert api_client.get(f'/api/coaches/{c1.id}/payrolls/').status_code == 200
        assert api_client.get(f'/api/coaches/{c1.id}/administrative-notes/').status_code == 200
        assert api_client.get(f"/api/coaches/contracts/{w['contract1'].id}/").status_code == 200
        assert api_client.get(f"/api/coaches/payrolls/{w['payroll1'].id}/").status_code == 200
        assert api_client.get(f"/api/coaches/certificates/{w['cert1'].id}/").status_code == 200
        assert api_client.get(f"/api/coaches/evaluations/{w['eval1'].id}/").status_code == 200

        # 3. Full enrollments, requests, class detail, dossier, leaderboard, notifications
        enr_res = api_client.get('/api/education/enrollments/')
        assert enr_res.status_code == 200
        assert any(e.get('swimmer_national_id') == sw2.national_id for e in _items(enr_res))
        assert api_client.get('/api/education/requests/').status_code == 200
        gc_res = api_client.get('/api/education/group-coaches/')
        assert gc_res.status_code == 200
        assert any(g.get('coach_phone') == w['coach1_user'].phone for g in _items(gc_res))

        cls1 = api_client.get(f"/api/coaches/my-classes/{w['group1'].id}/")
        assert cls1.status_code == 200
        assert any(s.get('national_id') == sw1.national_id for s in cls1.data['swimmers'])

        dossier1 = api_client.get(f'/api/coaches/swimmer-dossier/{sw1.id}/')
        assert dossier1.status_code == 200
        assert dossier1.data['swimmer']['national_id'] == sw1.national_id
        assert dossier1.data['swimmer']['medical_conditions'] == sw1.medical_notes

        lb = api_client.get(f"/api/leagues/{w['league'].id}/leaderboard/")
        assert lb.status_code == 200
        assert all('age' in row for row in lb.data)
        assert len(api_client.get(f"/api/leagues/{w['league'].id}/leaderboard/?search={sw2.national_id}").data) == 1

        perf2 = api_client.get(f"/api/leagues/{w['league'].id}/swimmer_performance/{sw2.id}/")
        assert perf2.status_code == 200
        assert perf2.data['swimmer']['national_id'] == sw2.national_id

        notif_ids = {n['id'] for n in api_client.get('/api/content/notifications/').data['results']}
        assert w['broadcast_notif'].id in notif_ids

    # Supervisor remains read-only on administrative mutations
    api_client.force_authenticate(user=w['supervisor'])
    assert api_client.post('/api/swimmers/', {'first_name': 'تست', 'last_name': 'تست'}).status_code == 403
    assert api_client.patch(f'/api/swimmers/{sw2.id}/', {'first_name': 'تغییر'}).status_code == 403
    assert api_client.delete(f'/api/swimmers/{sw2.id}/').status_code == 403
    assert api_client.post(f'/api/swimmers/{sw2.id}/review-documents/', {'action': 'APPROVE'}).status_code == 403
    assert api_client.patch(f'/api/coaches/{c1.id}/', {'hourly_rate': '999999'}).status_code == 403
    assert api_client.delete(f'/api/coaches/{c1.id}/').status_code == 403
    assert api_client.post(f'/api/coaches/{c1.id}/administrative-notes/', {'title': 'تست', 'description': 'تست'}).status_code == 403
    assert api_client.post(f"/api/coaches/my-classes/{w['group1'].id}/", {'title': 'اعلان', 'message': 'تست'}).status_code == 403
    assert api_client.post('/api/education/group-coaches/', {}).status_code == 403
    assert api_client.post('/api/finance/invoices/', {}).status_code == 403

    # Anonymous user gets 401 (never 500) on protected endpoints
    api_client.force_authenticate(user=None)
    assert api_client.get(f"/api/coaches/evaluations/{w['eval1'].id}/").status_code == 401
    assert api_client.get('/api/swimmers/').status_code == 401
    assert api_client.get('/api/education/requests/').status_code == 401
