import datetime
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.accounts.models import User
from apps.swimmers.models import SwimmerProfile
from apps.coaches.models import CoachProfile
from apps.education.models import (
    SkillLevel, Course, SwimmerGroup, GroupCoach, Enrollment
)
from apps.finance.models import (
    Invoice, InvoiceItem, Installment, Payment, PaymentAllocation, FinancialAdjustment
)


class Command(BaseCommand):
    help = 'ایجاد داده‌های فیک غنی، متنوع و واقعی برای بخش مالی و شهریه آموزشگاه شنا'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('در حال تولید و تزریق داده‌های جامع شهریه و امور مالی...'))

        today = timezone.now().date()
        now = timezone.now()

        # 1. مدیر سیستم برای ثبت پرداخت‌ها و تأیید اسناد
        admin = User.objects.filter(role=User.Role.ADMIN).first()
        if not admin:
            admin = User.objects.filter(is_superuser=True).first()
        if not admin:
            admin = User.objects.create(
                phone='09111111111',
                first_name='علی',
                last_name='هاشمی (مدیر)',
                role=User.Role.ADMIN,
                is_staff=True,
                is_superuser=True
            )
            admin.set_password('12345678')
            admin.save()

        # 2. مربیان آکادمی
        coaches_data = [
            ('09222222222', 'علیرضا', 'مرادی (مربی)', 'کرال سینه، شنای پروانه، نجات غریق بین‌المللی', Decimal('450000.00')),
            ('09123333333', 'محمد', 'رضایی', 'کرال سینه و استقامت، قهرمان مسابقات کشوری', Decimal('420000.00')),
            ('09222222224', 'نیما', 'سعادتی', 'شنای قورباغه، استارت و برگشت‌های سرعتی', Decimal('420000.00')),
            ('09222222223', 'سارا', 'کاظمی', 'شنای موزون (سینکرونایز)، آب‌درمانی و کرال پشت بانوان', Decimal('400000.00')),
            ('09222222225', 'مهدی', 'یزدانی', 'استعدادیابی نونهالان و آموزش شنا از پایه', Decimal('380000.00')),
        ]
        coaches = {}
        for phone, fn, ln, spec, rate in coaches_data:
            c_user, _ = User.objects.get_or_create(
                phone=phone,
                defaults={'first_name': fn, 'last_name': ln, 'role': User.Role.COACH}
            )
            c_prof, _ = CoachProfile.objects.get_or_create(
                user=c_user,
                defaults={
                    'coaching_degree': 'درجه ۱',
                    'bio': f'مربی رسمی با بیش از ۱۰ سال تجربه حرفه‌ای در {spec}',
                    'hourly_rate': rate,
                    'employment_status': CoachProfile.EmploymentStatus.ACTIVE
                }
            )
            coaches[fn] = c_prof

        # 3. سطوح مهارتی
        lvl1, _ = SkillLevel.objects.get_or_create(name='مبتدی (آشنایی با آب)', defaults={'order': 1, 'color_badge': '#38bdf8'})
        lvl2, _ = SkillLevel.objects.get_or_create(name='متوسط (کرال سینه و پشت)', defaults={'order': 2, 'color_badge': '#0284c7'})
        lvl3, _ = SkillLevel.objects.get_or_create(name='پیشرفته (قورباغه و پروانه)', defaults={'order': 3, 'color_badge': '#0369a1'})

        # 4. دوره‌ها
        c_crawl, _ = Course.objects.get_or_create(
            name='دوره جامع آموزش کرال سینه و تکنیک تنفس',
            defaults={
                'start_date': today - datetime.timedelta(days=20),
                'end_date': today + datetime.timedelta(days=40),
                'base_price': Decimal('2800000.00'),
                'sessions_count': 12,
                'status': Course.Status.ACTIVE,
                'description': 'آموزش کامل حرکات هماهنگ دست و پا، ریتم صحیح تنفس و استقامت در آب'
            }
        )

        c_endurance, _ = Course.objects.get_or_create(
            name='دوره جامع آموزش کرال سینه و استقامت پاییز ۱۴۰۵',
            defaults={
                'start_date': today - datetime.timedelta(days=30),
                'end_date': today + datetime.timedelta(days=30),
                'base_price': Decimal('2400000.00'),
                'sessions_count': 12,
                'status': Course.Status.ACTIVE,
                'description': 'تمرینات هوازی و قدرتی درون آب و رکوردگیری‌های هفتگی'
            }
        )

        c_butterfly, _ = Course.objects.get_or_create(
            name='دوره تخصصی شنای پروانه و استارت قهرمانی',
            defaults={
                'start_date': today - datetime.timedelta(days=15),
                'end_date': today + datetime.timedelta(days=45),
                'base_price': Decimal('3500000.00'),
                'sessions_count': 12,
                'status': Course.Status.ACTIVE,
                'description': 'تقویت عضلات هسته بدن، موج دلفین و تکنیک پرتاب دست پروانه'
            }
        )

        c_kids, _ = Course.objects.get_or_create(
            name='مدرسه شنای نونهالان (آشنایی با آب و رفع ترس)',
            defaults={
                'start_date': today - datetime.timedelta(days=10),
                'end_date': today + datetime.timedelta(days=35),
                'base_price': Decimal('2400000.00'),
                'sessions_count': 10,
                'status': Course.Status.ACTIVE,
                'description': 'محیط شاد و مفرح برای کودکان با متدهای بین‌المللی همراه با مربی و نجات‌غریق مقیم',
                'age_range': 'کودکان و خردسالان (۴ تا ۹ سال)',
                'gender': Course.GenderTarget.MALE,
                'what_you_learn': 'غلبه بر ترس از آب، اصول تنفس و غوطه‌وری، بازی‌های تعادلی و شناوری، آموزش مقدماتی پا زدن',
            }
        )

        c_talent, _ = Course.objects.get_or_create(
            name='دوره جامع استعدادیابی نخبگان نونهال',
            defaults={
                'start_date': today - datetime.timedelta(days=5),
                'end_date': today + datetime.timedelta(days=55),
                'base_price': Decimal('2600000.00'),
                'sessions_count': 12,
                'status': Course.Status.ACTIVE,
                'description': 'آزمون‌های فیزیولوژیک درون آب و استعدادیابی جهت معرفی به لیگ باشگاهی',
                'age_range': 'نونهالان و نوجوانان (۶ تا ۱۲ سال)',
                'gender': Course.GenderTarget.MALE,
                'what_you_learn': 'آزمون‌های فیزیولوژیک درون آب، پیکرسنجی و کشش عضلانی، سنجش توان قلبی‌عروقی و ارزیابی ورود به لیگ',
            }
        )

        # 5. گروه‌ها و انتساب مربیان اصلی به هر استخر
        groups_config = [
            ('گروه A عصرها (یکشنبه و سه‌شنبه ۱۷:۰۰)', c_crawl, lvl2, 'استخر ۵۰ متری المپیک', coaches['علیرضا']),
            ('گروه A (روزهای فرد ساعت ۱۷:۰۰)', c_endurance, lvl2, 'استخر آزادی', coaches['محمد']),
            ('گروه پیشرفته صبحگاهی (روزهای زوج ۰۸:۰۰)', c_butterfly, lvl3, 'استخر قهرمانی آزادی', coaches['نیما']),
            ('گروه نونهالان آب‌پری (پنج‌شنبه‌ها ۱۰:۰۰)', c_kids, lvl1, 'استخر آموزشی سرپوشیده با دمای ۳۱ درجه', coaches['سارا']),
            ('گروه استعدادیابی نونهالان (شنبه و چهارشنبه ۱۶:۰۰)', c_talent, lvl1, 'استخر نیلگون انقلاب', coaches['مهدی']),
        ]

        groups = {}
        for g_name, course, lvl, pool, coach_prof in groups_config:
            grp, _ = SwimmerGroup.objects.get_or_create(
                name=g_name,
                defaults={
                    'course': course,
                    'skill_level': lvl,
                    'capacity': 15,
                    'pool_location': pool,
                    'status': SwimmerGroup.Status.OPEN
                }
            )
            # انتساب مربی اصلی
            GroupCoach.objects.update_or_create(
                group=grp,
                is_primary=True,
                defaults={
                    'coach': coach_prof,
                    'assigned_from': course.start_date
                }
            )
            groups[g_name] = grp

        # 6. لیست ۲۰ شناگر جدید واقعی با تنوع کامل (جنسیت، تاریخ تولد، استخر و مربی)
        # هر شناگر دارای ساختار داده‌ای مشخص است.
        swimmers_data = [
            {
                'first_name': 'امیرعلی',
                'last_name': 'رستمی',
                'gender': SwimmerProfile.Gender.MALE,
                'dob': datetime.date(2009, 7, 15),  # 1388
                'phone': '09121010101',
                'emergency_name': 'پدر (رضا رستمی)',
                'emergency_phone': '09121112233',
                'group_name': 'گروه پیشرفته صبحگاهی (روزهای زوج ۰۸:۰۰)',
                'level': lvl3,
                'items': [('شهریه دوره تخصصی پروانه و استارت قهرمانی (۱۲ جلسه)', Decimal('3500000.00'))],
                'installments': [
                    {'num': 1, 'amt': Decimal('1750000.00'), 'days_due': -20, 'paid': True},
                    {'num': 2, 'amt': Decimal('1750000.00'), 'days_due': -5, 'paid': True},
                ],
                'payments': [
                    {'amt': Decimal('1750000.00'), 'method': Payment.Method.POS, 'ref': 'POS-990141', 'days_ago': 20, 'inst_num': 1},
                    {'amt': Decimal('1750000.00'), 'method': Payment.Method.ONLINE_GATEWAY, 'ref': 'SHP-7728104', 'days_ago': 5, 'inst_num': 2},
                ],
                'notes': 'تسویه کامل صورتحساب بدون تاخیر.'
            },
            {
                'first_name': 'سارینا',
                'last_name': 'عباسی',
                'gender': SwimmerProfile.Gender.FEMALE,
                'dob': datetime.date(2011, 4, 20),  # 1390
                'phone': '09122020202',
                'emergency_name': 'مادر (مریم حسینی)',
                'emergency_phone': '09122223344',
                'group_name': 'گروه نونهالان آب‌پری (پنج‌شنبه‌ها ۱۰:۰۰)',
                'level': lvl1,
                'items': [
                    ('شهریه مدرسه شنای نونهالان (۱۰ جلسه)', Decimal('2400000.00')),
                ],
                'adjustment': {'type': FinancialAdjustment.AdjustmentType.DISCOUNT, 'amt': Decimal('300000.00'), 'reason': 'تخفیف ثبت‌نام زودهنگام جشنواره پاییزه'},
                'installments': [
                    {'num': 1, 'amt': Decimal('2100000.00'), 'days_due': -15, 'paid': True},
                ],
                'payments': [
                    {'amt': Decimal('2100000.00'), 'method': Payment.Method.CARD_TRANSFER, 'ref': 'TRF-6037-99120', 'days_ago': 15, 'inst_num': 1},
                ],
                'notes': 'شامل ۳۰۰,۰۰۰ تومان تخفیف جشنواره پاییزه.'
            },
            {
                'first_name': 'بردیا',
                'last_name': 'سلیمانی',
                'gender': SwimmerProfile.Gender.MALE,
                'dob': datetime.date(2010, 9, 10),  # 1389
                'phone': '09123030303',
                'emergency_name': 'پدر (حسین سلیمانی)',
                'emergency_phone': '09123334455',
                'group_name': 'گروه A عصرها (یکشنبه و سه‌شنبه ۱۷:۰۰)',
                'level': lvl2,
                'items': [
                    ('شهریه دوره جامع کرال سینه و تکنیک تنفس', Decimal('2800000.00')),
                    ('پکیج عینک، کلاه سیلیکونی و مایو آکادمی', Decimal('400000.00')),
                ],
                'installments': [
                    {'num': 1, 'amt': Decimal('1200000.00'), 'days_due': -15, 'paid': True},
                    {'num': 2, 'amt': Decimal('1000000.00'), 'days_due': -4, 'paid': False},   # Overdue
                    {'num': 3, 'amt': Decimal('1000000.00'), 'days_due': 20, 'paid': False},   # Future
                ],
                'payments': [
                    {'amt': Decimal('1200000.00'), 'method': Payment.Method.POS, 'ref': 'POS-554109', 'days_ago': 15, 'inst_num': 1},
                ],
                'notes': 'دارای قسط سررسید گذشته (قسط دوم با ۴ روز دیرکرد).'
            },
            {
                'first_name': 'هلیا',
                'last_name': 'صادقی',
                'gender': SwimmerProfile.Gender.FEMALE,
                'dob': datetime.date(2012, 8, 14),  # 1391
                'phone': '09124040404',
                'emergency_name': 'مادر (سمیرا باقری)',
                'emergency_phone': '09124445566',
                'group_name': 'گروه نونهالان آب‌پری (پنج‌شنبه‌ها ۱۰:۰۰)',
                'level': lvl1,
                'items': [
                    ('شهریه مدرسه شنای نونهالان', Decimal('2400000.00')),
                ],
                'installments': [
                    {'num': 1, 'amt': Decimal('1200000.00'), 'days_due': -8, 'paid': False},   # Overdue
                    {'num': 2, 'amt': Decimal('1200000.00'), 'days_due': 15, 'paid': False},   # Future
                ],
                'payments': [],
                'notes': 'قسط اول ۸ روز از سررسید گذشته و در لیست بدهکاران قرار دارد.'
            },
            {
                'first_name': 'کیان',
                'last_name': 'رضایی',
                'gender': SwimmerProfile.Gender.MALE,
                'dob': datetime.date(2013, 11, 5),  # 1392
                'phone': '09125050505',
                'emergency_name': 'پدر (مجید رضایی)',
                'emergency_phone': '09125556677',
                'group_name': 'گروه استعدادیابی نونهالان (شنبه و چهارشنبه ۱۶:۰۰)',
                'level': lvl1,
                'items': [
                    ('شهریه دوره استعدادیابی نونهالان', Decimal('2600000.00')),
                ],
                'installments': [
                    {'num': 1, 'amt': Decimal('2600000.00'), 'days_due': -10, 'paid': True},
                ],
                'payments': [
                    {'amt': Decimal('2600000.00'), 'method': Payment.Method.POS, 'ref': 'POS-771920', 'days_ago': 10, 'inst_num': 1},
                ],
                'notes': 'تسویه کامل از طریق کارتخوان پذیرش استخر نیلگون.'
            },
            {
                'first_name': 'روژان',
                'last_name': 'نصیری',
                'gender': SwimmerProfile.Gender.FEMALE,
                'dob': datetime.date(2010, 3, 12),  # 1388
                'phone': '09126060606',
                'emergency_name': 'پدر (داود نصیری)',
                'emergency_phone': '09126667788',
                'group_name': 'گروه A (روزهای فرد ساعت ۱۷:۰۰)',
                'level': lvl2,
                'items': [
                    ('شهریه دوره جامع کرال سینه و استقامت پاییز ۱۴۰۵', Decimal('2400000.00')),
                ],
                'installments': [
                    {'num': 1, 'amt': Decimal('1200000.00'), 'days_due': -25, 'paid': True},
                    {'num': 2, 'amt': Decimal('1200000.00'), 'days_due': -12, 'paid': False},  # Overdue
                ],
                'payments': [
                    {'amt': Decimal('1200000.00'), 'method': Payment.Method.CARD_TRANSFER, 'ref': 'TRF-5859-44102', 'days_ago': 25, 'inst_num': 1},
                ],
                'notes': 'قسط دوم به مبلغ ۱,۲۰۰,۰۰۰ تومان با ۱۲ روز تاخیر معوق است.'
            },
            {
                'first_name': 'آرتین',
                'last_name': 'محمدی',
                'gender': SwimmerProfile.Gender.MALE,
                'dob': datetime.date(2014, 6, 22),  # 1393
                'phone': '09127070707',
                'emergency_name': 'پدر (مهدی محمدی)',
                'emergency_phone': '09127778899',
                'group_name': 'گروه استعدادیابی نونهالان (شنبه و چهارشنبه ۱۶:۰۰)',
                'level': lvl1,
                'items': [
                    ('شهریه دوره استعدادیابی نونهالان', Decimal('2600000.00')),
                    ('حق بیمه حوادث ورزشی فدراسیون شنا', Decimal('200000.00')),
                ],
                'installments': [
                    {'num': 1, 'amt': Decimal('1400000.00'), 'days_due': -14, 'paid': False},  # Overdue
                    {'num': 2, 'amt': Decimal('1400000.00'), 'days_due': 10, 'paid': False},   # Future
                ],
                'payments': [],
                'notes': 'شناگر مستعد، فاکتور کاملاً پرداخت‌نشده با قسط معوق.'
            },
            {
                'first_name': 'دینا',
                'last_name': 'کریمی',
                'gender': SwimmerProfile.Gender.FEMALE,
                'dob': datetime.date(2015, 9, 30),  # 1394
                'phone': '09128080808',
                'emergency_name': 'مادر (زهره صادقی)',
                'emergency_phone': '09128889900',
                'group_name': 'گروه نونهالان آب‌پری (پنج‌شنبه‌ها ۱۰:۰۰)',
                'level': lvl1,
                'items': [
                    ('شهریه مدرسه شنای نونهالان', Decimal('2400000.00')),
                ],
                'adjustment': {'type': FinancialAdjustment.AdjustmentType.DISCOUNT, 'amt': Decimal('400000.00'), 'reason': 'تخفیف استعداد برتر رده سنی زیر ۱۰ سال'},
                'installments': [
                    {'num': 1, 'amt': Decimal('2000000.00'), 'days_due': -6, 'paid': True},
                ],
                'payments': [
                    {'amt': Decimal('2000000.00'), 'method': Payment.Method.ONLINE_GATEWAY, 'ref': 'ZP-884012', 'days_ago': 6, 'inst_num': 1},
                ],
                'notes': 'تسویه آنلاین از درگاه با اعمال ۴۰۰,۰۰۰ تومان تخفیف استعداد درخشان.'
            },
            {
                'first_name': 'سام',
                'last_name': 'احمدوند',
                'gender': SwimmerProfile.Gender.MALE,
                'dob': datetime.date(2012, 2, 18),  # 1390
                'phone': '09129090909',
                'emergency_name': 'پدر (علیرضا احمدوند)',
                'emergency_phone': '09129990011',
                'group_name': 'گروه پیشرفته صبحگاهی (روزهای زوج ۰۸:۰۰)',
                'level': lvl3,
                'items': [
                    ('شهریه دوره تخصصی شنای پروانه و استارت قهرمانی', Decimal('3500000.00')),
                ],
                'installments': [
                    {'num': 1, 'amt': Decimal('1500000.00'), 'days_due': -18, 'paid': True},
                    {'num': 2, 'amt': Decimal('1000000.00'), 'days_due': -3, 'paid': False},   # Overdue
                    {'num': 3, 'amt': Decimal('1000000.00'), 'days_due': 20, 'paid': False},   # Future
                ],
                'payments': [
                    {'amt': Decimal('1500000.00'), 'method': Payment.Method.POS, 'ref': 'POS-662301', 'days_ago': 18, 'inst_num': 1},
                ],
                'notes': 'قسط اول واریز شده، قسط دوم ۳ روز تاخیر دارد.'
            },
            {
                'first_name': 'یسنا',
                'last_name': 'فراهانی',
                'gender': SwimmerProfile.Gender.FEMALE,
                'dob': datetime.date(2013, 5, 10),  # 1392
                'phone': '09131112233',
                'emergency_name': 'مادر (نرگس نادری)',
                'emergency_phone': '09131119988',
                'group_name': 'گروه A عصرها (یکشنبه و سه‌شنبه ۱۷:۰۰)',
                'level': lvl2,
                'items': [
                    ('شهریه دوره جامع کرال سینه و تکنیک تنفس', Decimal('2800000.00')),
                ],
                'installments': [
                    {'num': 1, 'amt': Decimal('1400000.00'), 'days_due': -16, 'paid': True},
                    {'num': 2, 'amt': Decimal('1400000.00'), 'days_due': -2, 'paid': True},
                ],
                'payments': [
                    {'amt': Decimal('1400000.00'), 'method': Payment.Method.CASH, 'ref': 'CSH-REC-104', 'days_ago': 16, 'inst_num': 1},
                    {'amt': Decimal('1400000.00'), 'method': Payment.Method.POS, 'ref': 'POS-338291', 'days_ago': 2, 'inst_num': 2},
                ],
                'notes': 'تسویه کامل صورتحساب در دو مرحله (نقدی و کارتخوان).'
            },
            {
                'first_name': 'مانی',
                'last_name': 'جعفری',
                'gender': SwimmerProfile.Gender.MALE,
                'dob': datetime.date(2016, 10, 4),  # 1395
                'phone': '09132223344',
                'emergency_name': 'پدر (سعید جعفری)',
                'emergency_phone': '09132228877',
                'group_name': 'گروه استعدادیابی نونهالان (شنبه و چهارشنبه ۱۶:۰۰)',
                'level': lvl1,
                'items': [
                    ('شهریه دوره استعدادیابی نونهالان', Decimal('2600000.00')),
                ],
                'installments': [
                    {'num': 1, 'amt': Decimal('1300000.00'), 'days_due': -6, 'paid': False},   # Overdue
                    {'num': 2, 'amt': Decimal('1300000.00'), 'days_due': 18, 'paid': False},   # Future
                ],
                'payments': [],
                'notes': 'قسط اول ۶ روز سررسید گذشته دارد، هماهنگی با ولی انجام شود.'
            },
            {
                'first_name': 'النا',
                'last_name': 'غفاری',
                'gender': SwimmerProfile.Gender.FEMALE,
                'dob': datetime.date(2011, 12, 8),  # 1390
                'phone': '09133334455',
                'emergency_name': 'مادر (مونا شایسته)',
                'emergency_phone': '09133337766',
                'group_name': 'گروه A (روزهای فرد ساعت ۱۷:۰۰)',
                'level': lvl2,
                'items': [
                    ('شهریه دوره جامع آموزش کرال سینه و استقامت پاییز ۱۴۰۵', Decimal('2400000.00')),
                ],
                'installments': [
                    {'num': 1, 'amt': Decimal('2400000.00'), 'days_due': -8, 'paid': True},
                ],
                'payments': [
                    {'amt': Decimal('2400000.00'), 'method': Payment.Method.POS, 'ref': 'POS-441920', 'days_ago': 8, 'inst_num': 1},
                ],
                'notes': 'تسویه یکجای شهریه در ابتدای دوره با کارتخوان.'
            },
            {
                'first_name': 'طاها',
                'last_name': 'شریفی',
                'gender': SwimmerProfile.Gender.MALE,
                'dob': datetime.date(2014, 3, 1),  # 1392
                'phone': '09134445566',
                'emergency_name': 'پدر (جواد شریفی)',
                'emergency_phone': '09134446655',
                'group_name': 'گروه پیشرفته صبحگاهی (روزهای زوج ۰۸:۰۰)',
                'level': lvl3,
                'items': [
                    ('شهریه دوره تخصصی شنای پروانه و استارت قهرمانی', Decimal('3500000.00')),
                ],
                'installments': [
                    {'num': 1, 'amt': Decimal('2000000.00'), 'days_due': -22, 'paid': True},
                    {'num': 2, 'amt': Decimal('1500000.00'), 'days_due': -9, 'paid': False},   # Overdue
                ],
                'payments': [
                    {'amt': Decimal('2000000.00'), 'method': Payment.Method.ONLINE_GATEWAY, 'ref': 'SHP-992140', 'days_ago': 22, 'inst_num': 1},
                ],
                'notes': 'قسط دوم ۹ روز معوق است.'
            },
            {
                'first_name': 'آوا',
                'last_name': 'ملکی',
                'gender': SwimmerProfile.Gender.FEMALE,
                'dob': datetime.date(2015, 4, 12),  # 1394
                'phone': '09135556677',
                'emergency_name': 'مادر (بهاره کمالی)',
                'emergency_phone': '09135555544',
                'group_name': 'گروه نونهالان آب‌پری (پنج‌شنبه‌ها ۱۰:۰۰)',
                'level': lvl1,
                'items': [
                    ('شهریه مدرسه شنای نونهالان', Decimal('2400000.00')),
                ],
                'installments': [
                    {'num': 1, 'amt': Decimal('2400000.00'), 'days_due': 5, 'paid': False},    # Upcoming
                ],
                'payments': [],
                'notes': 'فاکتور صادرشده و هنوز سررسید آن فرا نرسیده است.'
            },
            {
                'first_name': 'باربد',
                'last_name': 'خسروی',
                'gender': SwimmerProfile.Gender.MALE,
                'dob': datetime.date(2009, 11, 20),  # 1388
                'phone': '09136667788',
                'emergency_name': 'پدر (فرهاد خسروی)',
                'emergency_phone': '09136664433',
                'group_name': 'گروه A عصرها (یکشنبه و سه‌شنبه ۱۷:۰۰)',
                'level': lvl2,
                'items': [
                    ('شهریه دوره جامع کرال سینه و تکنیک تنفس', Decimal('2800000.00')),
                    ('حق اشتراک سالانه عضویت فدراسیون', Decimal('200000.00')),
                ],
                'installments': [
                    {'num': 1, 'amt': Decimal('1500000.00'), 'days_due': -24, 'paid': True},
                    {'num': 2, 'amt': Decimal('1500000.00'), 'days_due': -4, 'paid': True},
                ],
                'payments': [
                    {'amt': Decimal('1500000.00'), 'method': Payment.Method.CARD_TRANSFER, 'ref': 'TRF-5022-88192', 'days_ago': 24, 'inst_num': 1},
                    {'amt': Decimal('1500000.00'), 'method': Payment.Method.POS, 'ref': 'POS-889104', 'days_ago': 4, 'inst_num': 2},
                ],
                'notes': 'تسویه کامل صورتحساب و صدور کارت بیمه ورزشی.'
            },
            {
                'first_name': 'ستایش',
                'last_name': 'باقری',
                'gender': SwimmerProfile.Gender.FEMALE,
                'dob': datetime.date(2012, 6, 19),  # 1391
                'phone': '09137778899',
                'emergency_name': 'پدر (محمدرضا باقری)',
                'emergency_phone': '09137773322',
                'group_name': 'گروه A (روزهای فرد ساعت ۱۷:۰۰)',
                'level': lvl2,
                'items': [
                    ('شهریه دوره جامع کرال سینه و استقامت', Decimal('2400000.00')),
                ],
                'adjustment': {'type': FinancialAdjustment.AdjustmentType.REFUND, 'amt': Decimal('300000.00'), 'reason': 'استرداد وجه عدم تشکیل ۲ جلسه کلاسی به دلیل تعمیرات استخر آزادی'},
                'installments': [
                    {'num': 1, 'amt': Decimal('2400000.00'), 'days_due': -15, 'paid': True},
                ],
                'payments': [
                    {'amt': Decimal('2400000.00'), 'method': Payment.Method.POS, 'ref': 'POS-119283', 'days_ago': 15, 'inst_num': 1},
                ],
                'notes': 'پرداخت اولیه کامل انجام شده و سند استرداد ۳۰۰,۰۰۰ تومان به حساب ولی برگشت داده شد.'
            },
            {
                'first_name': 'کسری',
                'last_name': 'صبوری',
                'gender': SwimmerProfile.Gender.MALE,
                'dob': datetime.date(2010, 7, 25),  # 1389
                'phone': '09138889900',
                'emergency_name': 'مادر (ساناز تیموری)',
                'emergency_phone': '09138882211',
                'group_name': 'گروه پیشرفته صبحگاهی (روزهای زوج ۰۸:۰۰)',
                'level': lvl3,
                'items': [
                    ('شهریه دوره تخصصی شنای پروانه و استارت قهرمانی', Decimal('3500000.00')),
                ],
                'installments': [
                    {'num': 1, 'amt': Decimal('1750000.00'), 'days_due': -28, 'paid': True},
                    {'num': 2, 'amt': Decimal('1750000.00'), 'days_due': -18, 'paid': False},  # Overdue
                ],
                'payments': [
                    {'amt': Decimal('1750000.00'), 'method': Payment.Method.POS, 'ref': 'POS-129845', 'days_ago': 28, 'inst_num': 1},
                ],
                'notes': 'قسط دوم ۱۸ روز است که از سررسید گذشته است (پیگیری فوری).'
            },
            {
                'first_name': 'ترنم',
                'last_name': 'حیدری',
                'gender': SwimmerProfile.Gender.FEMALE,
                'dob': datetime.date(2016, 1, 15),  # 1394
                'phone': '09141112233',
                'emergency_name': 'پدر (پژمان حیدری)',
                'emergency_phone': '09141119900',
                'group_name': 'گروه استعدادیابی نونهالان (شنبه و چهارشنبه ۱۶:۰۰)',
                'level': lvl1,
                'items': [
                    ('شهریه دوره استعدادیابی نونهالان', Decimal('2600000.00')),
                ],
                'installments': [
                    {'num': 1, 'amt': Decimal('2600000.00'), 'days_due': -12, 'paid': True},
                ],
                'payments': [
                    {'amt': Decimal('2600000.00'), 'method': Payment.Method.CARD_TRANSFER, 'ref': 'TRF-6219-5501', 'days_ago': 12, 'inst_num': 1},
                ],
                'notes': 'واریز کارت به کارت فیش حساب بانک سامان.'
            },
            {
                'first_name': 'دانیال',
                'last_name': 'نوری',
                'gender': SwimmerProfile.Gender.MALE,
                'dob': datetime.date(2013, 8, 30),  # 1392
                'phone': '09142223344',
                'emergency_name': 'پدر (کامران نوری)',
                'emergency_phone': '09142228899',
                'group_name': 'گروه A عصرها (یکشنبه و سه‌شنبه ۱۷:۰۰)',
                'level': lvl2,
                'items': [
                    ('شهریه دوره جامع کرال سینه و تکنیک تنفس', Decimal('2800000.00')),
                ],
                'status_override': Invoice.Status.CANCELLED,
                'installments': [
                    {'num': 1, 'amt': Decimal('2800000.00'), 'days_due': -20, 'paid': False},
                ],
                'payments': [],
                'notes': 'صورتحساب به علت انصراف شناگر قبل از شروع ترم به دلیل جابجایی محل سکونت ابطال گردید.'
            },
            {
                'first_name': 'غزل',
                'last_name': 'شمس',
                'gender': SwimmerProfile.Gender.FEMALE,
                'dob': datetime.date(2014, 10, 18),  # 1393
                'phone': '09143334455',
                'emergency_name': 'مادر (شیوا افشار)',
                'emergency_phone': '09143337788',
                'group_name': 'گروه نونهالان آب‌پری (پنج‌شنبه‌ها ۱۰:۰۰)',
                'level': lvl1,
                'items': [
                    ('شهریه مدرسه شنای نونهالان', Decimal('2400000.00')),
                ],
                'installments': [
                    {'num': 1, 'amt': Decimal('1200000.00'), 'days_due': -16, 'paid': True},
                    {'num': 2, 'amt': Decimal('1200000.00'), 'days_due': -4, 'paid': False},   # Overdue
                ],
                'payments': [
                    {'amt': Decimal('1200000.00'), 'method': Payment.Method.POS, 'ref': 'POS-774412', 'days_ago': 16, 'inst_num': 1},
                ],
                'notes': 'قسط اول تسویه شده و قسط دوم ۴ روز است که سررسید شده.'
            },
            {
                'first_name': 'مهدی',
                'last_name': 'کاظمی',
                'gender': SwimmerProfile.Gender.MALE,
                'dob': datetime.date(2015, 3, 25),  # 1394
                'phone': '09144445566',
                'emergency_name': 'پدر (علی کاظمی)',
                'emergency_phone': '09144446677',
                'group_name': 'گروه استعدادیابی نونهالان (شنبه و چهارشنبه ۱۶:۰۰)',
                'level': lvl1,
                'items': [
                    ('شهریه دوره استعدادیابی نونهالان', Decimal('2600000.00')),
                ],
                'installments': [
                    {'num': 1, 'amt': Decimal('2600000.00'), 'days_due': -11, 'paid': False},  # Overdue
                ],
                'payments': [],
                'notes': 'بدهی معوق ۱۱ روزه. پیامک یادآوری پرداخت ارسال گردید.'
            },
            {
                'first_name': 'مهتا',
                'last_name': 'یوسفی',
                'gender': SwimmerProfile.Gender.FEMALE,
                'dob': datetime.date(2011, 1, 10),  # 1389
                'phone': '09145556677',
                'emergency_name': 'مادر (لیلا رضوی)',
                'emergency_phone': '09145555566',
                'group_name': 'گروه پیشرفته صبحگاهی (روزهای زوج ۰۸:۰۰)',
                'level': lvl3,
                'items': [
                    ('شهریه دوره تخصصی شنای پروانه و استارت قهرمانی', Decimal('3500000.00')),
                    ('ست فین و کفی مسابقه‌ای آرنا', Decimal('400000.00')),
                ],
                'installments': [
                    {'num': 1, 'amt': Decimal('2000000.00'), 'days_due': -22, 'paid': True},
                    {'num': 2, 'amt': Decimal('1900000.00'), 'days_due': -2, 'paid': True},
                ],
                'payments': [
                    {'amt': Decimal('2000000.00'), 'method': Payment.Method.ONLINE_GATEWAY, 'ref': 'SHP-110293', 'days_ago': 22, 'inst_num': 1},
                    {'amt': Decimal('1900000.00'), 'method': Payment.Method.POS, 'ref': 'POS-993810', 'days_ago': 2, 'inst_num': 2},
                ],
                'notes': 'تسویه کامل صورتحساب به همراه تجهیزات شنا.'
            },
        ]

        created_invoices_count = 0
        created_payments_count = 0
        created_installments_count = 0

        for s_data in swimmers_data:
            # ایجاد یا دریافت پروفایل کاربر و شناگر
            s_user, _ = User.objects.get_or_create(
                phone=s_data['phone'],
                defaults={
                    'first_name': s_data['first_name'],
                    'last_name': s_data['last_name'],
                    'role': User.Role.SWIMMER
                }
            )
            s_user.set_password('12345678')
            s_user.save()

            swimmer, _ = SwimmerProfile.objects.update_or_create(
                phone=s_data['phone'],
                defaults={
                    'user': s_user,
                    'first_name': s_data['first_name'],
                    'last_name': s_data['last_name'],
                    'gender': s_data['gender'],
                    'date_of_birth': s_data['dob'],
                    'emergency_contact_name': s_data['emergency_name'],
                    'emergency_contact_phone': s_data['emergency_phone'],
                    'current_level': s_data['level'],
                    'is_active': True
                }
            )

            # ثبت‌نام در گروه مربوطه
            group = groups[s_data['group_name']]
            course = group.course

            enrollment, _ = Enrollment.objects.get_or_create(
                swimmer=swimmer,
                course=course,
                group=group,
                defaults={
                    'status': Enrollment.Status.ACTIVE,
                    'sessions_purchased': course.sessions_count or 12,
                    'sessions_attended': 3
                }
            )

            # محاسبه مبلغ کل
            total_amt = sum(item[1] for item in s_data['items'])
            issue_date = today - datetime.timedelta(days=25)
            due_date = today + datetime.timedelta(days=35)

            # بررسی اینکه فاکتور قبلا وجود دارد یا خیر
            invoice = Invoice.objects.filter(enrollment=enrollment).first()
            if not invoice:
                invoice = Invoice.objects.create(
                    invoice_number=Invoice.generate_invoice_number(),
                    swimmer=swimmer,
                    enrollment=enrollment,
                    total_amount=total_amt,
                    currency='TOMAN',
                    status=Invoice.Status.ISSUED,
                    issue_date=issue_date,
                    due_date=due_date,
                    notes=s_data.get('notes', '')
                )
                created_invoices_count += 1
            else:
                invoice.total_amount = total_amt
                invoice.notes = s_data.get('notes', '')
                invoice.save()

            # ردیف‌های فاکتور
            for desc, price in s_data['items']:
                InvoiceItem.objects.get_or_create(
                    invoice=invoice,
                    description=desc,
                    defaults={
                        'unit_price': price,
                        'quantity': 1,
                        'total_price': price
                    }
                )

            # اسناد تعدیل (تخفیف یا استرداد وجه)
            if 'adjustment' in s_data:
                adj = s_data['adjustment']
                FinancialAdjustment.objects.get_or_create(
                    invoice=invoice,
                    type=adj['type'],
                    defaults={
                        'amount': adj['amt'],
                        'reason': adj['reason'],
                        'approved_by': admin
                    }
                )

            # اقساط
            inst_map = {}
            for inst_cfg in s_data.get('installments', []):
                inst_due = today + datetime.timedelta(days=inst_cfg['days_due'])
                inst, _ = Installment.objects.update_or_create(
                    invoice=invoice,
                    installment_number=inst_cfg['num'],
                    defaults={
                        'amount': inst_cfg['amt'],
                        'due_date': inst_due,
                        'status': Installment.Status.UNPAID
                    }
                )
                inst_map[inst_cfg['num']] = inst
                created_installments_count += 1

            # پرداخت‌ها و تخصیص به اقساط و فاکتور
            for p_cfg in s_data.get('payments', []):
                p_date = now - datetime.timedelta(days=p_cfg['days_ago'], hours=3)
                payment, p_created = Payment.objects.get_or_create(
                    swimmer=swimmer,
                    transaction_ref=p_cfg['ref'],
                    defaults={
                        'payment_number': Payment.generate_payment_number(),
                        'amount': p_cfg['amt'],
                        'method': p_cfg['method'],
                        'status': Payment.Status.SUCCESSFUL,
                        'paid_at': p_date,
                        'recorded_by': admin,
                        'notes': f"تسویه تراکنش {p_cfg['ref']} مربوط به فاکتور {invoice.invoice_number}"
                    }
                )
                if p_created:
                    created_payments_count += 1

                target_inst = inst_map.get(p_cfg.get('inst_num'))
                PaymentAllocation.objects.get_or_create(
                    payment=payment,
                    invoice=invoice,
                    installment=target_inst,
                    defaults={'allocated_amount': p_cfg['amt']}
                )

            # بازنگری وضعیت اقساط و فاکتور
            for inst in invoice.installments.all():
                inst.recalculate_status()

            if s_data.get('status_override'):
                invoice.status = s_data['status_override']
                invoice.save(update_fields=['status'])
            else:
                invoice.recalculate_status()

        self.stdout.write(self.style.SUCCESS(
            f"عملیات با موفقیت پایان یافت!\n"
            f"- فاکتورهای افزوده/به‌روزشده: {created_invoices_count}\n"
            f"- اقساط مدیریت‌شده: {created_installments_count}\n"
            f"- پرداخت‌ها و رسیدها: {created_payments_count}\n"
            f"- مجموع فاکتورهای موجود: {Invoice.objects.count()}\n"
            f"- مجموع اقساط موجود: {Installment.objects.count()}\n"
            f"- مجموع پرداخت‌های موجود: {Payment.objects.count()}"
        ))
