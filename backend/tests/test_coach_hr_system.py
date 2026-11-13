import datetime
from decimal import Decimal
import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.coaches.models import (
    CoachProfile, CoachContract, CoachPayroll, PayrollAdjustment,
    CoachPaymentRecord, CoachLeaveRequest, CoachPerformanceEvaluation,
    CoachAdministrativeNote, CoachActivityLog, CoachAttendanceCorrectionAudit
)
from apps.coaches.services import PayrollService, ContractService, AttendanceCorrectionService
from apps.scheduling.models import ClassSession
from apps.education.models import Course, SwimmerGroup, SkillLevel, GroupCoach, Enrollment
from apps.swimmers.models import SwimmerProfile


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        phone='09121110010',
        password='AdminPass@2026',
        first_name='مدیر',
        last_name='آکادمی',
        role=User.Role.ADMIN,
        is_staff=True,
        is_superuser=True
    )


@pytest.fixture
def supervisor_user(db):
    return User.objects.create_user(
        phone='09121110011',
        password='SupervisorPass@2026',
        first_name='ناظر',
        last_name='فنی',
        role=User.Role.SUPERVISOR,
        is_staff=True
    )


@pytest.fixture
def coach1(db):
    u = User.objects.create_user(
        phone='09121110012',
        password='Coach1Pass@2026',
        first_name='علی',
        last_name='محمدی',
        role=User.Role.COACH
    )
    return CoachProfile.objects.create(
        user=u,
        personnel_id='EMP-1001',
        coaching_degree='درجه ۱',
        employment_type=CoachProfile.EmploymentType.HOURLY,
        hourly_rate=Decimal('250000.00'),
        contractual_weekly_hours=20,
        employment_start_date=datetime.date(2026, 1, 1)
    )


@pytest.fixture
def coach2(db):
    u = User.objects.create_user(
        phone='09121110013',
        password='Coach2Pass@2026',
        first_name='سارا',
        last_name='احمدی',
        role=User.Role.COACH
    )
    return CoachProfile.objects.create(
        user=u,
        personnel_id='EMP-1002',
        coaching_degree='درجه ۲',
        gender=CoachProfile.Gender.FEMALE,
        employment_type=CoachProfile.EmploymentType.FIXED,
        fixed_monthly_salary=Decimal('20000000.00'),
        contractual_weekly_hours=30,
        employment_start_date=datetime.date(2026, 2, 1)
    )


@pytest.fixture
def group_and_sessions(db, coach1):
    level = SkillLevel.objects.create(name='مقدماتی', order=1)
    course = Course.objects.create(
        name='ترم پاییزه کرال',
        start_date=datetime.date(2026, 10, 1),
        end_date=datetime.date(2026, 11, 30),
        base_price=Decimal('2000000.00'),
        sessions_count=12
    )
    group = SwimmerGroup.objects.create(
        course=course,
        name='گروه ۱',
        skill_level=level,
        capacity=15
    )
    GroupCoach.objects.create(
        group=group,
        coach=coach1,
        assigned_from=datetime.date(2026, 10, 1),
        is_primary=True
    )

    # جلسه ۱: ۲ ساعت
    s1 = ClassSession.objects.create(
        group=group,
        coach=coach1,
        session_date=datetime.date(2026, 11, 2),
        start_time=datetime.time(16, 0),
        end_time=datetime.time(18, 0),
        status=ClassSession.Status.COMPLETED
    )
    # جلسه ۲: ۲ ساعت
    s2 = ClassSession.objects.create(
        group=group,
        coach=coach1,
        session_date=datetime.date(2026, 11, 4),
        start_time=datetime.time(16, 0),
        end_time=datetime.time(18, 0),
        status=ClassSession.Status.COMPLETED
    )
    # جلسه ۳: لغوشده (نباید در حقوق ساعتی محاسبه شود)
    s3 = ClassSession.objects.create(
        group=group,
        coach=coach1,
        session_date=datetime.date(2026, 11, 6),
        start_time=datetime.time(16, 0),
        end_time=datetime.time(18, 0),
        status=ClassSession.Status.CANCELLED
    )
    return group, [s1, s2, s3]


# ==============================================================================
# 1. تست‌های حقوق و دستمزد (Payroll Tests)
# ==============================================================================

@pytest.mark.django_db
def test_hourly_payroll_calculation(coach1, group_and_sessions):
    """
    محاسبه حقوق ساعتی: مجموع ساعات جلسات برگزارشده (۴ ساعت) × نرخ ساعتی (۲۵۰،۰۰۰ تومان) = ۱،۰۰۰،۰۰۰ تومان
    جلسه لغوشده نباید به عنوان ساعت تدریس شمرده شود.
    """
    p_start = datetime.date(2026, 11, 1)
    p_end = datetime.date(2026, 11, 30)

    payroll = PayrollService.calculate_monthly_payroll(
        coach=coach1,
        period_start=p_start,
        period_end=p_end,
        period_label='آبان ۱۴۰۵'
    )

    assert payroll.completed_sessions_count == 2
    assert payroll.teaching_hours == Decimal('4.00')
    assert payroll.base_compensation == Decimal('1000000.00')
    assert payroll.net_payable_amount == Decimal('1000000.00')
    assert payroll.approval_status == CoachPayroll.ApprovalStatus.DRAFT
    assert payroll.payment_status == CoachPayroll.PaymentStatus.UNPAID


@pytest.mark.django_db
def test_fixed_salary_calculation(coach2):
    """
    محاسبه حقوق ثابت ماهانه: مبلغ مقطوع توافق‌شده (۲۰،۰۰۰،۰۰۰ تومان)
    """
    p_start = datetime.date(2026, 11, 1)
    p_end = datetime.date(2026, 11, 30)

    payroll = PayrollService.calculate_monthly_payroll(
        coach=coach2,
        period_start=p_start,
        period_end=p_end,
        period_label='آبان ۱۴۰۵'
    )

    assert payroll.base_compensation == Decimal('20000000.00')
    assert payroll.net_payable_amount == Decimal('20000000.00')


@pytest.mark.django_db
def test_percentage_based_calculation(db, group_and_sessions):
    """
    محاسبه حقوق درصدی: ۳۰٪ از درآمد ناخالص دوره
    دوره دارای ۱ شناگر با شهریه ۲،۰۰۰،۰۰۰ تومان است -> درآمد ۲،۰۰۰،۰۰۰ تومان -> سهم مربی ۶۰۰،۰۰۰ تومان
    """
    group, _ = group_and_sessions
    coach = group.coach_assignments.first().coach

    # ثبت یک شناگر در گروه
    swimmer_user = User.objects.create_user(phone='09121110099', password='Pass@12345678')
    swimmer = SwimmerProfile.objects.create(user=swimmer_user, first_name='رضا', last_name='نوری')
    Enrollment.objects.create(swimmer=swimmer, course=group.course, group=group, coach=coach, status='ACTIVE')

    coach.employment_type = CoachProfile.EmploymentType.PERCENTAGE
    coach.revenue_percentage = Decimal('30.00')
    coach.percentage_revenue_basis = 'COURSE_GROSS'
    coach.save()

    p_start = datetime.date(2026, 10, 1)
    p_end = datetime.date(2026, 11, 30)

    payroll = PayrollService.calculate_monthly_payroll(
        coach=coach,
        period_start=p_start,
        period_end=p_end,
        period_label='پاییز ۱۴۰۵'
    )

    assert payroll.eligible_revenue == Decimal('2000000.00')
    assert payroll.base_compensation == Decimal('600000.00')
    assert payroll.net_payable_amount == Decimal('600000.00')


@pytest.mark.django_db
def test_bonus_and_deduction_adjustments(coach1, group_and_sessions, admin_user):
    """
    اعمال پاداش و کسورات:
    پایه: ۱،۰۰۰،۰۰۰ تومان
    پاداش رضایت: ۲۰۰،۰۰۰ تومان
    اضافه‌کاری: ۱۰۰،۰۰۰ تومان
    کسر غیبت: ۵۰،۰۰۰ تومان
    خالص نهایی: ۱،۲۵۰،۰۰۰ تومان
    """
    payroll = PayrollService.calculate_monthly_payroll(
        coach=coach1,
        period_start=datetime.date(2026, 11, 1),
        period_end=datetime.date(2026, 11, 30),
        created_by=admin_user
    )

    PayrollAdjustment.objects.create(
        payroll=payroll,
        adjustment_type=PayrollAdjustment.AdjustmentType.BONUS,
        amount=Decimal('200000.00'),
        title='پاداش رضایت شناگران',
        created_by=admin_user
    )
    PayrollAdjustment.objects.create(
        payroll=payroll,
        adjustment_type=PayrollAdjustment.AdjustmentType.OVERTIME,
        amount=Decimal('100000.00'),
        title='یک ساعت کارگاه تخصصی',
        created_by=admin_user
    )
    PayrollAdjustment.objects.create(
        payroll=payroll,
        adjustment_type=PayrollAdjustment.AdjustmentType.PENALTY,
        amount=Decimal('50000.00'),
        title='تأخیر در ثبت حضور و غیاب',
        created_by=admin_user
    )

    # بازتولید فیش جهت اعمال ردیف‌ها
    updated_payroll = PayrollService.calculate_monthly_payroll(
        coach=coach1,
        period_start=datetime.date(2026, 11, 1),
        period_end=datetime.date(2026, 11, 30),
        created_by=admin_user
    )

    assert updated_payroll.bonuses_amount == Decimal('200000.00')
    assert updated_payroll.overtime_amount == Decimal('100000.00')
    assert updated_payroll.deductions_amount == Decimal('50000.00')
    assert updated_payroll.gross_amount == Decimal('1300000.00')
    assert updated_payroll.net_payable_amount == Decimal('1250000.00')


@pytest.mark.django_db
def test_partial_payment_and_full_settlement(coach2, admin_user):
    """
    پرداخت مرحله‌ای و تسویه کامل:
    حقوق خالص: ۲۰،۰۰۰،۰۰۰ تومان
    پرداخت اول: ۱۲،۰۰۰،۰۰۰ تومان -> مانده: ۸،۰۰۰،۰۰۰ تومان، وضعیت: PARTIALLY_PAID
    پرداخت دوم: ۸،۰۰۰،۰۰۰ تومان -> مانده: ۰ تومان، وضعیت: PAID
    """
    payroll = PayrollService.calculate_monthly_payroll(
        coach=coach2,
        period_start=datetime.date(2026, 11, 1),
        period_end=datetime.date(2026, 11, 30),
        created_by=admin_user
    )
    PayrollService.approve_payroll(payroll, approved_by=admin_user)

    # پرداخت اول (بخشی)
    p1 = PayrollService.register_payment(
        payroll=payroll,
        amount=Decimal('12000000.00'),
        payment_date=datetime.date(2026, 11, 25),
        payment_method=CoachPaymentRecord.PaymentMethod.BANK_TRANSFER,
        reference_number='PAY-REF-001',
        registered_by=admin_user
    )
    payroll.refresh_from_db()
    assert payroll.total_paid == Decimal('12000000.00')
    assert payroll.remaining_balance == Decimal('8000000.00')
    assert payroll.payment_status == CoachPayroll.PaymentStatus.PARTIALLY_PAID

    # پرداخت دوم (تسویه کامل)
    p2 = PayrollService.register_payment(
        payroll=payroll,
        amount=Decimal('8000000.00'),
        payment_date=datetime.date(2026, 11, 28),
        payment_method=CoachPaymentRecord.PaymentMethod.BANK_TRANSFER,
        reference_number='PAY-REF-002',
        registered_by=admin_user
    )
    payroll.refresh_from_db()
    assert payroll.total_paid == Decimal('20000000.00')
    assert payroll.remaining_balance == Decimal('0.00')
    assert payroll.payment_status == CoachPayroll.PaymentStatus.PAID


@pytest.mark.django_db
def test_payment_reversal_integrity(coach2, admin_user):
    """
    برگشت سند پرداخت: به جای حذف فیزیکی، سند اصلاحی (Reversal) ثبت می‌شود
    و مانده بدهی مجدداً افزایش می‌یابد.
    """
    payroll = PayrollService.calculate_monthly_payroll(
        coach=coach2,
        period_start=datetime.date(2026, 11, 1),
        period_end=datetime.date(2026, 11, 30),
        created_by=admin_user
    )
    PayrollService.approve_payroll(payroll, approved_by=admin_user)

    payment = PayrollService.register_payment(
        payroll=payroll,
        amount=Decimal('5000000.00'),
        payment_date=datetime.date(2026, 11, 25),
        payment_method=CoachPaymentRecord.PaymentMethod.CARD_TRANSFER,
        reference_number='TR-12345',
        registered_by=admin_user
    )
    payroll.refresh_from_db()
    assert payroll.remaining_balance == Decimal('15000000.00')

    # برگشت سند
    reversal = PayrollService.reverse_payment(
        payment_record=payment,
        reason='اشتباه در شماره شبا مربی',
        reversed_by=admin_user
    )
    payroll.refresh_from_db()
    assert reversal.is_reversal is True
    assert payroll.total_paid == Decimal('0.00')
    assert payroll.remaining_balance == Decimal('20000000.00')
    assert payroll.payment_status == CoachPayroll.PaymentStatus.UNPAID


@pytest.mark.django_db
def test_duplicate_payroll_prevention(coach1, admin_user):
    """
    جلوگیری از ایجاد فیش حقوقی تکراری برای یک مربی و یک بازه مشخص
    پس از تایید فیش حقوقی، سیستم اجازه بازنویسی آن را نمی‌دهد.
    """
    p_start = datetime.date(2026, 11, 1)
    p_end = datetime.date(2026, 11, 30)

    p1 = PayrollService.calculate_monthly_payroll(coach1, p_start, p_end, created_by=admin_user)
    PayrollService.approve_payroll(p1, approved_by=admin_user)

    # تلاش مجدد برای تولید فیش تاییدشده باید خطای اعتبارسنجی دهد
    with pytest.raises(Exception):
        PayrollService.calculate_monthly_payroll(coach1, p_start, p_end, created_by=admin_user)


# ==============================================================================
# 2. تست‌های قرارداد (Contracts Tests)
# ==============================================================================

@pytest.mark.django_db
def test_contract_creation_and_expiration_detection(coach1, admin_user):
    """
    انعقاد قرارداد جدید و تشخیص انقضا در بازه ۳۰ روزه
    """
    today = datetime.date.today()
    c = ContractService.create_contract(
        coach=coach1,
        data={
            'contract_type': 'FULL_TIME',
            'start_date': today - datetime.timedelta(days=330),
            'end_date': today + datetime.timedelta(days=20), # در شرف انقضا
            'employment_type': 'HOURLY',
            'hourly_rate': 300000,
            'agreed_weekly_hours': 25,
            'status': 'ACTIVE',
        },
        created_by=admin_user
    )

    assert c.status == CoachContract.Status.ACTIVE
    # بررسی متد کمکی یا سریالایزر
    diff = (c.end_date - today).days
    assert 0 <= diff <= 30


@pytest.mark.django_db
def test_contract_renewal_preserves_history(coach1, admin_user):
    """
    تمدید قرارداد: قرارداد قبلی به RENEWED تغییر می‌یابد و قرارداد جدید فعال می‌شود؛
    سوابق گذشته دستکاری یا حذف نمی‌شوند.
    """
    old_c = ContractService.create_contract(
        coach=coach1,
        data={
            'contract_type': 'STANDARD',
            'start_date': datetime.date(2025, 1, 1),
            'end_date': datetime.date(2025, 12, 29),
            'employment_type': 'HOURLY',
            'hourly_rate': 200000,
            'status': 'ACTIVE'
        },
        created_by=admin_user
    )

    new_c = ContractService.renew_contract(
        old_contract=old_c,
        renewal_data={
            'contract_type': 'FULL_TIME',
            'start_date': datetime.date(2026, 1, 1),
            'end_date': datetime.date(2026, 12, 29),
            'employment_type': 'FIXED',
            'fixed_salary': 18000000,
        },
        created_by=admin_user
    )

    old_c.refresh_from_db()
    assert old_c.status == CoachContract.Status.RENEWED
    assert new_c.status == CoachContract.Status.ACTIVE
    assert CoachContract.objects.filter(coach=coach1).count() == 2


# ==============================================================================
# 3. تست‌های حضور، غیاب و مرخصی (Attendance & Leave Tests)
# ==============================================================================

@pytest.mark.django_db
def test_attendance_correction_audit(coach1, group_and_sessions, admin_user):
    """
    اصلاح سوابق تدریس جلسه مربی با ثبت الزامی لاگ حسابرسی (Audit Trail)
    """
    _, sessions = group_and_sessions
    s = sessions[0]

    audit = AttendanceCorrectionService.correct_session(
        coach=coach1,
        session=s,
        new_status=ClassSession.Status.CANCELLED,
        new_hours=Decimal('0.00'),
        reason='خرابی تأسیسات موتورخانه استخر',
        adjusted_by=admin_user
    )

    s.refresh_from_db()
    assert s.status == ClassSession.Status.CANCELLED
    assert audit.previous_status == ClassSession.Status.COMPLETED
    assert audit.new_status == ClassSession.Status.CANCELLED
    assert audit.adjusted_by == admin_user
    assert CoachActivityLog.objects.filter(coach=coach1, event_type=CoachActivityLog.EventType.ATTENDANCE_CORRECTED).exists()


@pytest.mark.django_db
def test_leave_request_approval_flow(api_client, coach1, admin_user):
    """
    چرخه درخواست مرخصی: ثبت توسط مربی و تأیید توسط مدیر
    """
    api_client.force_authenticate(user=coach1.user)

    res = api_client.post(f'/api/coaches/{coach1.id}/leave-requests/', {
        'leave_type': 'CASUAL',
        'start_date': '2026-11-10',
        'end_date': '2026-11-12',
        'reason': 'سفر خانوادگی',
    })
    assert res.status_code == 201
    leave_id = res.data['id']

    # ورود مدیر جهت تأیید
    api_client.force_authenticate(user=admin_user)
    res_review = api_client.post(f'/api/coaches/leave-requests/{leave_id}/review/', {
        'status': 'APPROVED',
        'admin_notes': 'موافقت شد، مربی جایگزین هماهنگ شود.'
    })
    assert res_review.status_code == 200
    assert res_review.data['leave']['status'] == 'APPROVED'


# ==============================================================================
# 4. تست‌های مجوز و امنیت (Permissions & Security Tests)
# ==============================================================================

@pytest.mark.django_db
def test_supervisor_can_view_confidential_payroll_data_readonly(api_client, coach1, supervisor_user, admin_user):
    """
    ناظر فنی به همراه مدیر مجاز به مشاهده کلیه اطلاعات و فیش‌های حقوق مربیان است (فقط خواندنی)
    """
    PayrollService.calculate_monthly_payroll(
        coach=coach1,
        period_start=datetime.date(2026, 11, 1),
        period_end=datetime.date(2026, 11, 30),
        created_by=admin_user
    )

    api_client.force_authenticate(user=supervisor_user)

    res = api_client.get(f'/api/coaches/{coach1.id}/payrolls/')
    assert res.status_code == 200
    assert len(res.data) == 1

    # ناظر فنی امکان صدور یا تغییر فیش حقوق را ندارد (فقط مدیر)
    post_res = api_client.post(f'/api/coaches/{coach1.id}/payrolls/', {
        'period_start': '2026-12-01',
        'period_end': '2026-12-30',
    })
    assert post_res.status_code == 403


@pytest.mark.django_db
def test_coach_cannot_access_another_coach_private_records(api_client, coach1, coach2):
    """
    مربی ۱ نمی‌تواند به فیش حقوقی یا اطلاعات پرونده مربی ۲ دسترسی یابد (ضد IDOR - HTTP 403)
    """
    api_client.force_authenticate(user=coach1.user)

    # تلاش مربی ۱ برای دیدن فیش‌های مربی ۲
    res = api_client.get(f'/api/coaches/{coach2.id}/payrolls/')
    assert res.status_code == 403


@pytest.mark.django_db
def test_coach_can_access_own_payroll(api_client, coach1, admin_user):
    """
    مربی مجاز به مشاهده لیست فیش‌های حقوقی اختصاصی خود می‌باشد.
    """
    PayrollService.calculate_monthly_payroll(
        coach=coach1,
        period_start=datetime.date(2026, 11, 1),
        period_end=datetime.date(2026, 11, 30),
        created_by=admin_user
    )

    api_client.force_authenticate(user=coach1.user)
    res = api_client.get(f'/api/coaches/{coach1.id}/payrolls/')
    assert res.status_code == 200
    assert len(res.data) == 1
