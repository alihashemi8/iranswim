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
    help = 'ایجاد داده‌های پایه واقعی برای سامانه آموزشگاه شنا'

    def handle(self, *args, **kwargs):
        self.stdout.write('در حال مقداردهی داده‌های واقعی با مشخصات درخواستی کاربر...')

        STANDARD_PASS = '12345678'

        # 1. Four specific users requested by the user:
        # User 1: Admin (مدیر) -> 09111111111
        admin, _ = User.objects.get_or_create(
            phone='09111111111',
            defaults={
                'first_name': 'علی',
                'last_name': 'هاشمی (مدیر)',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin.set_password(STANDARD_PASS)
        admin.role = User.Role.ADMIN
        admin.save()

        # User 2: Coach (مربی) -> 09222222222
        coach_user, _ = User.objects.get_or_create(
            phone='09222222222',
            defaults={
                'first_name': 'علیرضا',
                'last_name': 'مرادی (مربی)',
                'role': User.Role.COACH,
            }
        )
        coach_user.set_password(STANDARD_PASS)
        coach_user.role = User.Role.COACH
        coach_user.save()

        coach_profile, _ = CoachProfile.objects.get_or_create(
            user=coach_user,
            defaults={
                'specialties': 'کرال سینه، شنای پروانه، نجات غریق بین‌المللی',
                'bio': 'مربی رسمی فدراسیون شنا با ۱۲ سال سابقه تدریس و قهرمانی رده‌های پایه کشور',
                'employment_status': CoachProfile.EmploymentStatus.ACTIVE,
                'hourly_rate': Decimal('450000.00'),
            }
        )

        # Additional Coaches for rich landing page cards
        coach2_user, _ = User.objects.get_or_create(
            phone='09222222223',
            defaults={
                'first_name': 'سارا',
                'last_name': 'کاظمی',
                'role': User.Role.COACH,
            }
        )
        coach2_user.set_password(STANDARD_PASS)
        coach2_user.save()
        CoachProfile.objects.get_or_create(
            user=coach2_user,
            defaults={
                'specialties': 'شنای موزون (سینکرونایز)، آب‌درمانی و کرال پشت',
                'bio': 'مدرس رسمی فدراسیون و کارشناس ارشد فیزیولوژی ورزش با سابقه ۱۰ سال هدایت تیم‌های استانی',
                'employment_status': CoachProfile.EmploymentStatus.ACTIVE,
                'hourly_rate': Decimal('400000.00'),
            }
        )

        coach3_user, _ = User.objects.get_or_create(
            phone='09222222224',
            defaults={
                'first_name': 'نیما',
                'last_name': 'سعادتی',
                'role': User.Role.COACH,
            }
        )
        coach3_user.set_password(STANDARD_PASS)
        coach3_user.save()
        CoachProfile.objects.get_or_create(
            user=coach3_user,
            defaults={
                'specialties': 'شنای قورباغه، استارت و برگشت‌های سرعتی المپیک',
                'bio': 'عضو اسبق تیم ملی شنا و مربی تخصصی اصلاح تکنیک و استقامت بدنی شناگران نخبه',
                'employment_status': CoachProfile.EmploymentStatus.ACTIVE,
                'hourly_rate': Decimal('420000.00'),
            }
        )

        coach4_user, _ = User.objects.get_or_create(
            phone='09222222225',
            defaults={
                'first_name': 'مهدی',
                'last_name': 'یزدانی',
                'role': User.Role.COACH,
            }
        )
        coach4_user.set_password(STANDARD_PASS)
        coach4_user.save()
        CoachProfile.objects.get_or_create(
            user=coach4_user,
            defaults={
                'specialties': 'استعدادیابی نونهالان و آموزش آب‌بازی و مبتدی',
                'bio': 'مربی باحوصله و مجرب در حوزه آموزش اصولی شنا از پایه برای رده‌های سنی ۵ تا ۱۲ سال',
                'employment_status': CoachProfile.EmploymentStatus.ACTIVE,
                'hourly_rate': Decimal('380000.00'),
            }
        )

        # User 3: Swimmer (شاگرد) -> 09333333333
        swimmer_user, _ = User.objects.get_or_create(
            phone='09333333333',
            defaults={
                'first_name': 'پارسا',
                'last_name': 'حسینی (شاگرد)',
                'role': User.Role.SWIMMER,
            }
        )
        swimmer_user.set_password(STANDARD_PASS)
        swimmer_user.role = User.Role.SWIMMER
        swimmer_user.save()

        # User 4: Supervisor (ناظر فنی سامانه / خود کاربر) -> 09045911122
        supervisor, _ = User.objects.get_or_create(
            phone='09045911122',
            defaults={
                'first_name': 'علی',
                'last_name': 'هاشمی (ناظر سامانه)',
                'role': User.Role.SUPERVISOR,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        supervisor.set_password(STANDARD_PASS)
        supervisor.role = User.Role.SUPERVISOR
        supervisor.is_superuser = True
        supervisor.save()

        # 2. Skill Levels & Skills
        lvl1, _ = SkillLevel.objects.get_or_create(
            name='مبتدی (آشنایی با آب)',
            defaults={'order': 1, 'color_badge': '#38bdf8', 'description': 'غوطه‌وری، تنفس عمیق زیر آب و پای دوچرخه پایه'}
        )
        lvl2, _ = SkillLevel.objects.get_or_create(
            name='متوسط (کرال سینه و پشت)',
            defaults={'order': 2, 'color_badge': '#0284c7', 'description': 'تکنیک صحیح دست و پای کرال سینه و کرال پشت مداوم'}
        )
        lvl3, _ = SkillLevel.objects.get_or_create(
            name='پیشرفته (قورباغه و پروانه)',
            defaults={'order': 3, 'color_badge': '#0369a1', 'description': 'آموزش تخصصی قورباغه، پروانه و استارت و سالتو'}
        )

        sk1, _ = Skill.objects.get_or_create(level=lvl1, name='حبس نفس و شناوری لاک‌پشتی', defaults={'order': 1})
        sk2, _ = Skill.objects.get_or_create(level=lvl1, name='پای کرال سینه با تخته شنا', defaults={'order': 2})
        sk3, _ = Skill.objects.get_or_create(level=lvl2, name='تکنیک دست کرال سینه و نفس‌گیری دوطرفه', defaults={'order': 1})
        sk4, _ = Skill.objects.get_or_create(level=lvl2, name='کرال پشت کامل ۵۰ متر مداوم', defaults={'order': 2})

        swimmer_profile, _ = SwimmerProfile.objects.get_or_create(
            user=swimmer_user,
            defaults={
                'first_name': 'پارسا',
                'last_name': 'حسینی',
                'phone': '09333333333',
                'current_level': lvl2,
                'emergency_contact_name': 'پدر (محمد حسینی)',
                'emergency_contact_phone': '09129998877',
            }
        )

        # 3. Courses & Groups
        today = timezone.now().date()
        c1, _ = Course.objects.get_or_create(
            name='دوره جامع آموزش کرال سینه و تکنیک تنفس',
            defaults={
                'start_date': today - datetime.timedelta(days=10),
                'end_date': today + datetime.timedelta(days=50),
                'base_price': Decimal('2800000.00'),
                'sessions_count': 12,
                'status': Course.Status.ACTIVE,
                'description': 'آموزش کامل حرکات هماهنگ دست و پا، ریتم صحیح تنفس و استقامت در آب'
            }
        )
        c2, _ = Course.objects.get_or_create(
            name='دوره تخصصی شنای پروانه و استارت قهرمانی',
            defaults={
                'start_date': today + datetime.timedelta(days=5),
                'end_date': today + datetime.timedelta(days=65),
                'base_price': Decimal('3500000.00'),
                'sessions_count': 12,
                'status': Course.Status.ACTIVE,
                'description': 'تقویت عضلات هسته بدن، موج دلفین و تکنیک پرتاب دست پروانه با تجهیزات پیشرفته'
            }
        )
        c3, _ = Course.objects.get_or_create(
            name='مدرسه شنای نونهالان (آشنایی با آب و رفع ترس)',
            defaults={
                'start_date': today + datetime.timedelta(days=2),
                'end_date': today + datetime.timedelta(days=45),
                'base_price': Decimal('2400000.00'),
                'sessions_count': 10,
                'status': Course.Status.ACTIVE,
                'description': 'محیط شاد و مفرح برای کودکان با متدهای بین‌المللی همراه با نجات‌غریق مقیم'
            }
        )

        g1, _ = SwimmerGroup.objects.get_or_create(
            course=c1,
            name='گروه A عصرها (یکشنبه و سه‌شنبه ۱۷:۰۰)',
            defaults={
                'skill_level': lvl2,
                'capacity': 12,
                'pool_location': 'استخر ۵۰ متری المپیک - لاین ۳ و ۴',
                'status': SwimmerGroup.Status.OPEN,
            }
        )
        g2, _ = SwimmerGroup.objects.get_or_create(
            course=c2,
            name='گروه پیشرفته صبحگاهی (روزهای زوج ۰۸:۰۰)',
            defaults={
                'skill_level': lvl3,
                'capacity': 8,
                'pool_location': 'استخر قهرمانی آزادی - لاین اختصاصی ۲',
                'status': SwimmerGroup.Status.OPEN,
            }
        )
        g3, _ = SwimmerGroup.objects.get_or_create(
            course=c3,
            name='گروه نونهالان آب‌پری (پنج‌شنبه‌ها ۱۰:۰۰)',
            defaults={
                'skill_level': lvl1,
                'capacity': 10,
                'pool_location': 'استخر آموزشی سرپوشیده با دمای ۳۱ درجه',
                'status': SwimmerGroup.Status.OPEN,
            }
        )

        GroupSchedule.objects.get_or_create(
            group=g1,
            weekday=GroupSchedule.Weekday.SUNDAY,
            defaults={'start_time': datetime.time(17, 0), 'end_time': datetime.time(18, 30)}
        )
        GroupSchedule.objects.get_or_create(
            group=g1,
            weekday=GroupSchedule.Weekday.TUESDAY,
            defaults={'start_time': datetime.time(17, 0), 'end_time': datetime.time(18, 30)}
        )

        GroupCoach.objects.get_or_create(
            group=g1,
            coach=coach_profile,
            defaults={'assigned_from': c1.start_date, 'is_primary': True}
        )

        # 4. Enrollment & Invoice for Swimmer
        enrollment, _ = Enrollment.objects.get_or_create(
            swimmer=swimmer_profile,
            course=c1,
            group=g1,
            defaults={
                'status': Enrollment.Status.ACTIVE,
                'sessions_purchased': 12,
                'sessions_attended': 3
            }
        )

        invoice, _ = Invoice.objects.get_or_create(
            enrollment=enrollment,
            defaults={
                'invoice_number': Invoice.generate_invoice_number(),
                'swimmer': swimmer_profile,
                'total_amount': Decimal('2800000.00'),
                'issue_date': c1.start_date,
                'due_date': c1.end_date,
                'status': Invoice.Status.PARTIALLY_PAID
            }
        )

        InvoiceItem.objects.get_or_create(
            invoice=invoice,
            description=f'شهریه {c1.name} - {g1.name}',
            defaults={'unit_price': Decimal('2800000.00'), 'quantity': 1, 'total_price': Decimal('2800000.00')}
        )

        inst1, _ = Installment.objects.get_or_create(
            invoice=invoice,
            installment_number=1,
            defaults={'amount': Decimal('1400000.00'), 'due_date': c1.start_date, 'status': Installment.Status.PAID}
        )
        inst2, _ = Installment.objects.get_or_create(
            invoice=invoice,
            installment_number=2,
            defaults={'amount': Decimal('1400000.00'), 'due_date': c1.end_date, 'status': Installment.Status.UNPAID}
        )

        payment, _ = Payment.objects.get_or_create(
            payment_number=Payment.generate_payment_number(),
            defaults={
                'swimmer': swimmer_profile,
                'amount': Decimal('1400000.00'),
                'method': Payment.Method.POS,
                'status': Payment.Status.SUCCESSFUL,
                'transaction_ref': 'POS-7744102',
                'paid_at': timezone.now() - datetime.timedelta(days=7),
                'recorded_by': admin
            }
        )
        PaymentAllocation.objects.get_or_create(
            payment=payment,
            invoice=invoice,
            installment=inst1,
            defaults={'allocated_amount': Decimal('1400000.00')}
        )

        # 5. Sessions & Attendance
        sess1, _ = ClassSession.objects.get_or_create(
            group=g1,
            session_date=today - datetime.timedelta(days=3),
            defaults={
                'coach': coach_profile,
                'start_time': datetime.time(17, 0),
                'end_time': datetime.time(18, 30),
                'pool_location': g1.pool_location,
                'status': ClassSession.Status.COMPLETED,
                'session_notes': 'تمرین پای کرال و هماهنگی تنفس دوطرفه'
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
                'note': 'تمرکز و سرعت عالی در اجرای تکنیک'
            }
        )

        # Future session
        ClassSession.objects.get_or_create(
            group=g1,
            session_date=today + datetime.timedelta(days=2),
            defaults={
                'coach': coach_profile,
                'start_time': datetime.time(17, 0),
                'end_time': datetime.time(18, 30),
                'pool_location': g1.pool_location,
                'status': ClassSession.Status.SCHEDULED,
            }
        )

        # 6. Skill assessment & swimming record
        SkillAssessment.objects.get_or_create(
            swimmer=swimmer_profile,
            skill=sk3,
            assessed_at=today - datetime.timedelta(days=2),
            defaults={
                'score': Decimal('92.00'),
                'status': SkillAssessment.Status.PASSED,
                'assessed_by': coach_user,
                'feedback': 'تکنیک چرخش سر و دست کرال سینه به خوبی تسلط پیدا کرده است.'
            }
        )

        SwimmingRecord.objects.get_or_create(
            swimmer=swimmer_profile,
            stroke=SwimmingRecord.Stroke.FREESTYLE,
            distance_meters=50,
            defaults={
                'duration_seconds': Decimal('31.80'),
                'pool_course': SwimmingRecord.PoolCourse.SHORT_25M,
                'recorded_at': today - datetime.timedelta(days=5),
                'recorded_by': coach_user,
                'verification_status': SwimmingRecord.VerificationStatus.VERIFIED,
                'verified_by': admin
            }
        )

        # 7. League
        league, _ = League.objects.get_or_create(
            name='لیگ فصلی ستارگان شنای ایران',
            defaults={
                'season': 'پاییز و زمستان ۱۴۰۵',
                'starts_at': c1.start_date,
                'ends_at': c1.end_date,
                'is_active': True,
                'rules_description': 'مسابقات هفتگی مواد چهارگانه شنا در استخر مسافت کوتاه'
            }
        )
        cat, _ = LeagueCategory.objects.get_or_create(
            league=league,
            title='رده سنی ۱۲ تا ۱۵ سال پسران',
            defaults={'age_min': 12, 'age_max': 15, 'gender': LeagueCategory.Gender.MALE}
        )
        LeagueEntry.objects.get_or_create(
            league=league,
            category=cat,
            swimmer=swimmer_profile,
            defaults={'total_points': Decimal('94.00')}
        )

        # 8. Rich News Posts for Horizontal Scrolling Cards on Landing Page
        news_items = [
            {
                'slug': 'state-swimming-championship-freedom-cup',
                'title': 'برگزاری مسابقات استانی شنای سرعت «جام آزادی ۱۴۰۵»',
                'summary': 'رقابت‌های استانی شنا با حضور بیش از ۳۰۰ شناگر برتر و اهدای مدال‌های قهرمانی به میزبانی آموزشگاه شنای ایران برگزار شد.',
                'body': 'مسابقات استانی شنای سرعت با حضور تیم‌های منتخب از سراسر استان با شور و هیجان بی‌نظیر برگزار شد. شناگران آکادمی موفق به کسب مقام اول تیمی شدند.',
                'category': NewsPost.Category.COMPETITIONS,
            },
            {
                'slug': 'ozone-water-purification-upgrade',
                'title': 'افتتاح پیشرفته‌ترین سیستم تصفیه آب اوزون و تصفیه بدون کلر',
                'summary': 'به جهت حفظ سلامت پوست، چشم و ریه شناگران، موتورخانه و تصفیه‌خانه مرکزی آکادمی به تکنولوژی روز اوزوناسیون مجهز شد.',
                'body': 'این سیستم نوین با از بین بردن ۹۹.۹ درصد باکتری‌ها و کاهش بوی تند کلر، تجربه‌ای دلنشین و استاندارد برای ورزشکاران حرفه‌ای و کودکان فراهم می‌آورد.',
                'category': NewsPost.Category.HEALTH,
            },
            {
                'slug': 'winter-term-registration-opened',
                'title': 'آغاز پیش‌ثبت‌نام دوره‌های تخصصی شنای زمستانه با تخفیف ویژه',
                'summary': 'ثبت‌نام ترم جدید آموزش چهار شنا، واترپلو و نجات‌غریق برای تمامی رده‌های سنی آغاز شد.',
                'body': 'علاقه‌مندان می‌توانند با مراجعه به سایت و مشاهده جدول زمان‌بندی گروه‌ها، اقدام به ثبت‌نام در ساعات دلخواه نمایند.',
                'category': NewsPost.Category.CLASSES,
            },
            {
                'slug': 'nutrition-and-breathing-workshop',
                'title': 'کارگاه تغذیه ورزشی، ریکاوری و تنفس عمیق ویژه ورزشکاران شنا',
                'summary': 'سمینار کاربردی با حضور متخصصین تغذیه فدراسیون پزشکی ورزشی روز پنج‌شنبه در سالن همایش آکادمی برگزار می‌شود.',
                'body': 'در این دوره به مباحث برنامه غذایی در روزهای مسابقه، جبران الکترولیت‌ها و تکنیک‌های افزایش حجم ریه پرداخته خواهد شد.',
                'category': NewsPost.Category.GENERAL,
            },
            {
                'slug': 'iran-swim-academy-shines-in-national-league',
                'title': 'درخشش شناگران آموزشگاه شنای ایران در لیگ برتر باشگاه‌های کشور',
                'summary': 'تیم شنای نوجوانان آکادمی با شکستن دو رکورد ملی موفق به کسب کاپ اخلاق و جایگاه نخست ماده ۲۰۰ متر امدادی شدند.',
                'body': 'این موفقیت ارزشمند حاصل برنامه‌ریزی علمی، تمرینات منظم هفتگی و پایش مداوم شاخص‌های آمادگی جسمانی توسط مربیان مجرب است.',
                'category': NewsPost.Category.COMPETITIONS,
            },
        ]

        for item in news_items:
            NewsPost.objects.update_or_create(
                slug=item['slug'],
                defaults={
                    'title': item['title'],
                    'summary': item['summary'],
                    'body': item['body'],
                    'category': item['category'],
                    'author': admin,
                    'status': NewsPost.Status.PUBLISHED,
                    'publish_at': timezone.now() - datetime.timedelta(days=news_items.index(item) * 3)
                }
            )

        self.stdout.write(self.style.SUCCESS('اطلاعات با موفقیت در دیتابیس مستقر شدند.'))
        self.stdout.write(self.style.SUCCESS('کاربران درخواستی با رمز 12345678:'))
        self.stdout.write('  مدیر: 09111111111 / 12345678')
        self.stdout.write('  مربی: 09222222222 / 12345678')
        self.stdout.write('  شاگرد: 09333333333 / 12345678')
        self.stdout.write('  ناظر سامانه (کاربر): 09045911122 / 12345678')
