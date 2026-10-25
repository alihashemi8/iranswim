import datetime
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.accounts.models import User
from apps.swimmers.models import SwimmerProfile
from apps.coaches.models import CoachProfile
from apps.education.models import (
    SkillLevel, Skill, Course, SwimmerGroup,
    GroupSchedule, GroupCoach, Enrollment
)
from apps.scheduling.models import ClassSession
from apps.attendance.models import AttendanceRecord
from apps.finance.models import Invoice, InvoiceItem, Installment, Payment, PaymentAllocation
from apps.assessments.models import SkillAssessment, SwimmingRecord
from apps.leagues.models import League, LeagueCategory, LeagueEntry
from apps.content.models import NewsPost, Announcement
from apps.supervisor.models import SystemErrorLog, AuditLog


class Command(BaseCommand):
    help = 'ایجاد داده‌های پایه آزمایشی برای سامانه آموزشگاه شنا'

    def handle(self, *args, **kwargs):
        self.stdout.write('در حال مقداردهی داده‌های اولیه...')

        # 1. Users
        admin, _ = User.objects.get_or_create(
            phone='09121111111',
            defaults={
                'first_name': 'علی',
                'last_name': 'هاشمی',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin.set_password('admin123456')
        admin.save()

        supervisor, _ = User.objects.get_or_create(
            phone='09122222222',
            defaults={
                'first_name': 'ناظر',
                'last_name': 'فنی سامانه',
                'role': User.Role.SUPERVISOR,
                'is_staff': True,
            }
        )
        supervisor.set_password('super123456')
        supervisor.save()

        coach_user, _ = User.objects.get_or_create(
            phone='09123333333',
            defaults={
                'first_name': 'محمد',
                'last_name': 'رضایی',
                'role': User.Role.COACH,
            }
        )
        coach_user.set_password('coach123456')
        coach_user.save()

        coach_profile, _ = CoachProfile.objects.get_or_create(
            user=coach_user,
            defaults={
                'specialties': 'کرال سینه، شنای پروانه، نجات غریق درجه ۱',
                'bio': 'مربی رسمی فدراسیون شنا با ۱۰ سال سابقه آموزش تیم‌های پایه',
                'employment_status': CoachProfile.EmploymentStatus.ACTIVE,
                'hourly_rate': Decimal('350000.00'),
            }
        )

        swimmer_user, _ = User.objects.get_or_create(
            phone='09124444444',
            defaults={
                'first_name': 'سارا',
                'last_name': 'احمدی',
                'role': User.Role.SWIMMER,
            }
        )
        swimmer_user.set_password('swim123456')
        swimmer_user.save()

        # 2. Skill Levels & Skills
        lvl1, _ = SkillLevel.objects.get_or_create(
            name='مبتدی (آشنایی با آب)',
            defaults={'order': 1, 'color_badge': '#38bdf8', 'description': 'غوطه‌وری، تنفس زیر آب و پای دوچرخه پایه'}
        )
        lvl2, _ = SkillLevel.objects.get_or_create(
            name='متوسط (کرال سینه و پشت)',
            defaults={'order': 2, 'color_badge': '#0284c7', 'description': 'تکنیک صحیح دست و پای کرال سینه و کرال پشت'}
        )
        lvl3, _ = SkillLevel.objects.get_or_create(
            name='پیشرفته (قورباغه و پروانه)',
            defaults={'order': 3, 'color_badge': '#0369a1', 'description': 'آموزش تخصصی قورباغه، پروانه و استارت و برگشت'}
        )

        sk1, _ = Skill.objects.get_or_create(level=lvl1, name='حبس نفس و شناوری لاک‌پشتی', defaults={'order': 1})
        sk2, _ = Skill.objects.get_or_create(level=lvl1, name='پای کرال سینه با تخته شنا', defaults={'order': 2})
        sk3, _ = Skill.objects.get_or_create(level=lvl2, name='تکنیک دست کرال سینه و نفس‌گیری یک‌طرفه', defaults={'order': 1})
        sk4, _ = Skill.objects.get_or_create(level=lvl2, name='کرال پشت کامل ۵۰ متر مداوم', defaults={'order': 2})

        swimmer_profile, _ = SwimmerProfile.objects.get_or_create(
            user=swimmer_user,
            defaults={
                'first_name': 'سارا',
                'last_name': 'احمدی',
                'phone': '09124444444',
                'current_level': lvl2,
                'emergency_contact_name': 'پدر (علیرضا احمدی)',
                'emergency_contact_phone': '09129999999',
            }
        )

        # 3. Course & SwimmerGroup
        today = timezone.now().date()
        course, _ = Course.objects.get_or_create(
            name='دوره جامع آموزش کرال سینه و استقامت پاییز ۱۴۰۵',
            defaults={
                'start_date': today - datetime.timedelta(days=10),
                'end_date': today + datetime.timedelta(days=50),
                'base_price': Decimal('2400000.00'),
                'sessions_count': 12,
                'status': Course.Status.ACTIVE,
                'description': 'دوره ۱۲ جلسه‌ای ویژه ارتقای مهارت شناگران سطح متوسط'
            }
        )

        group, _ = SwimmerGroup.objects.get_or_create(
            course=course,
            name='گروه A (روزهای فرد ساعت ۱۷:۰۰)',
            defaults={
                'skill_level': lvl2,
                'capacity': 12,
                'pool_location': 'استخر آزادی - لاین ۲ و ۳',
                'status': SwimmerGroup.Status.OPEN,
            }
        )

        GroupSchedule.objects.get_or_create(
            group=group,
            weekday=GroupSchedule.Weekday.SUNDAY,
            defaults={'start_time': datetime.time(17, 0), 'end_time': datetime.time(18, 30)}
        )
        GroupSchedule.objects.get_or_create(
            group=group,
            weekday=GroupSchedule.Weekday.TUESDAY,
            defaults={'start_time': datetime.time(17, 0), 'end_time': datetime.time(18, 30)}
        )

        GroupCoach.objects.get_or_create(
            group=group,
            coach=coach_profile,
            defaults={'assigned_from': course.start_date, 'is_primary': True}
        )

        # 4. Enrollment & Invoice
        enrollment, _ = Enrollment.objects.get_or_create(
            swimmer=swimmer_profile,
            course=course,
            group=group,
            defaults={
                'status': Enrollment.Status.ACTIVE,
                'sessions_purchased': 12,
                'sessions_attended': 2
            }
        )

        invoice, _ = Invoice.objects.get_or_create(
            enrollment=enrollment,
            defaults={
                'invoice_number': Invoice.generate_invoice_number(),
                'swimmer': swimmer_profile,
                'total_amount': Decimal('2400000.00'),
                'issue_date': course.start_date,
                'due_date': course.end_date,
                'status': Invoice.Status.PARTIALLY_PAID
            }
        )

        InvoiceItem.objects.get_or_create(
            invoice=invoice,
            description=f'شهریه ثبت‌نام {course.name}',
            defaults={'unit_price': Decimal('2400000.00'), 'quantity': 1, 'total_price': Decimal('2400000.00')}
        )

        inst1, _ = Installment.objects.get_or_create(
            invoice=invoice,
            installment_number=1,
            defaults={'amount': Decimal('1200000.00'), 'due_date': course.start_date, 'status': Installment.Status.PAID}
        )
        inst2, _ = Installment.objects.get_or_create(
            invoice=invoice,
            installment_number=2,
            defaults={'amount': Decimal('1200000.00'), 'due_date': course.end_date, 'status': Installment.Status.UNPAID}
        )

        # Payment for installment 1
        payment, _ = Payment.objects.get_or_create(
            payment_number=Payment.generate_payment_number(),
            defaults={
                'swimmer': swimmer_profile,
                'amount': Decimal('1200000.00'),
                'method': Payment.Method.POS,
                'status': Payment.Status.SUCCESSFUL,
                'transaction_ref': 'POS-8934201',
                'paid_at': timezone.now() - datetime.timedelta(days=8),
                'recorded_by': admin
            }
        )
        PaymentAllocation.objects.get_or_create(
            payment=payment,
            invoice=invoice,
            installment=inst1,
            defaults={'allocated_amount': Decimal('1200000.00')}
        )

        # 5. Class Sessions & Attendance
        sess1, _ = ClassSession.objects.get_or_create(
            group=group,
            session_date=today - datetime.timedelta(days=4),
            defaults={
                'coach': coach_profile,
                'start_time': datetime.time(17, 0),
                'end_time': datetime.time(18, 30),
                'pool_location': group.pool_location,
                'status': ClassSession.Status.COMPLETED,
                'session_notes': 'جلسه تمرین پای کرال و تنفس - انگیزه شناگران بسیار عالی بود.'
            }
        )
        AttendanceRecord.objects.get_or_create(
            session=sess1,
            swimmer=swimmer_profile,
            defaults={
                'enrollment': enrollment,
                'status': AttendanceRecord.Status.PRESENT,
                'consumed_quota': True,
                'recorded_by': coach_user,
                'note': 'عملکرد بسیار خوب در اجرای پای دوچرخه'
            }
        )

        # 6. Assessment & Swimming Record
        SkillAssessment.objects.get_or_create(
            swimmer=swimmer_profile,
            skill=sk3,
            assessed_at=today - datetime.timedelta(days=2),
            defaults={
                'score': Decimal('90.00'),
                'status': SkillAssessment.Status.PASSED,
                'assessed_by': coach_user,
                'feedback': 'تکنیک دست بسیار خوب اجرا شد؛ زاویه مچ نیاز به تثبیت بیشتر دارد.'
            }
        )

        SwimmingRecord.objects.get_or_create(
            swimmer=swimmer_profile,
            stroke=SwimmingRecord.Stroke.FREESTYLE,
            distance_meters=50,
            defaults={
                'duration_seconds': Decimal('32.45'),
                'pool_course': SwimmingRecord.PoolCourse.SHORT_25M,
                'recorded_at': today - datetime.timedelta(days=5),
                'recorded_by': coach_user,
                'verification_status': SwimmingRecord.VerificationStatus.VERIFIED,
                'verified_by': admin
            }
        )

        # 7. League
        league, _ = League.objects.get_or_create(
            name='لیگ فصلی ستارگان شنا',
            defaults={
                'season': 'پاییز ۱۴۰۵',
                'starts_at': course.start_date,
                'ends_at': course.end_date,
                'is_active': True,
                'rules_description': 'مسابقات هفتگی ۵۰ متر کرال سینه و پشت؛ برندگان بر اساس مجموع امتیازات هفتگی'
            }
        )
        cat, _ = LeagueCategory.objects.get_or_create(
            league=league,
            title='رده سنی ۱۲ تا ۱۵ سال دختران',
            defaults={'age_min': 12, 'age_max': 15, 'gender': LeagueCategory.Gender.FEMALE}
        )
        LeagueEntry.objects.get_or_create(
            league=league,
            category=cat,
            swimmer=swimmer_profile,
            defaults={'total_points': Decimal('85.50')}
        )

        # 8. Content
        NewsPost.objects.get_or_create(
            slug='welcome-autumn-term-1405',
            defaults={
                'title': 'آغاز دوره‌های تخصصی شنای پاییز ۱۴۰۵ در آکادمی ایران سوییم',
                'body': 'با افتخار به اطلاع اعضای محترم می‌رساند ثبت‌نام دوره‌های تخصصی شنا از امروز آغاز گردید...',
                'summary': 'ثبت‌نام دوره‌های پاییز ۱۴۰۵ با حضور مربیان مجرب فدراسیون آغاز شد.',
                'status': NewsPost.Status.PUBLISHED,
                'author': admin,
                'category': NewsPost.Category.CLASSES
            }
        )

        Announcement.objects.get_or_create(
            title='جلسه توجیهی مسابقات استانی',
            defaults={
                'message': 'شناگران عضو لیگ روز شنبه ساعت ۱۸ جهت دریافت کارت مسابقات در دفتر آکادمی حاضر شوند.',
                'audience': Announcement.Audience.ALL,
                'is_pinned': True,
                'created_by': admin
            }
        )

        # 9. Initial Supervisor Audit and Sample Error
        AuditLog.objects.get_or_create(
            action=AuditLog.Action.CONFIG_CHANGE,
            entity_type='System',
            entity_id='1',
            defaults={
                'actor': admin,
                'details': {'action': 'System initialized with production seed data'}
            }
        )

        self.stdout.write(self.style.SUCCESS('تمامی داده‌های اولیه با موفقیت ایجاد شدند.'))
        self.stdout.write(self.style.SUCCESS('کاربران ساخته‌شده:'))
        self.stdout.write('  مدیر: 09121111111 / admin123456')
        self.stdout.write('  ناظر سامانه: 09122222222 / super123456')
        self.stdout.write('  مربی: 09123333333 / coach123456')
        self.stdout.write('  شناگر: 09124444444 / swim123456')
