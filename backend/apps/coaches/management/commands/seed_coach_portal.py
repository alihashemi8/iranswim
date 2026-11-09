import datetime
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.accounts.models import User
from apps.coaches.models import (
    CoachProfile, CoachCertificate, CoachContract, CoachPayroll,
    CoachPaymentRecord, CoachLeaveRequest, CoachPerformanceEvaluation,
    CoachAdministrativeNote, WorkoutPlan
)
from apps.education.models import (
    SkillLevel, Skill, Course, SwimmerGroup, GroupSchedule, GroupCoach, Enrollment
)
from apps.scheduling.models import ClassSession
from apps.attendance.models import AttendanceRecord
from apps.assessments.models import SkillAssessment, SwimmingRecord, LevelPromotionProposal
from apps.content.models import Announcement, Notification
from apps.swimmers.models import SwimmerProfile


class Command(BaseCommand):
    help = 'ایجاد داده‌های جامع، زنده و واقعی برای تست و بررسی UI پنل معلم و مربی شنا'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE('در حال بارگذاری داده‌های واقعی پنل مربی شنا...'))

        STANDARD_PASS = '12345678'
        today = timezone.now().date()  # 2026-11-09

        # -------------------------------------------------------------
        # 1. کاربران مدیر و مربیان
        # -------------------------------------------------------------
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
        admin.is_staff = True
        admin.is_superuser = True
        admin.save()

        # مربی ۱ (مربی پرچمدار اصلی برای بررسی پنل)
        coach_user, _ = User.objects.get_or_create(
            phone='09222222222',
            defaults={
                'first_name': 'علیرضا',
                'last_name': 'مرادی',
                'role': User.Role.COACH,
            }
        )
        coach_user.set_password(STANDARD_PASS)
        coach_user.role = User.Role.COACH
        coach_user.is_active = True
        coach_user.first_name = 'علیرضا'
        coach_user.last_name = 'مرادی'
        coach_user.national_id = '0019842510'
        coach_user.save()

        coach_profile, _ = CoachProfile.objects.get_or_create(
            user=coach_user,
            defaults={
                'specialties': 'کرال سینه، شنای پروانه، نجات غریق بین‌المللی',
                'bio': 'مربی ارشد و رسمی فدراسیون شنا با ۱۲ سال سابقه تدریس، هدایت تیم‌های استانی و قهرمانی در رده‌های پایه کشور.',
                'employment_status': CoachProfile.EmploymentStatus.ACTIVE,
                'hourly_rate': Decimal('450000.00'),
            }
        )
        coach_profile.specialties = 'کرال سینه، شنای پروانه، نجات غریق بین‌المللی'
        coach_profile.bio = 'مربی ارشد و رسمی فدراسیون شنا با ۱۲ سال سابقه تدریس، هدایت تیم‌های استانی و قهرمانی در رده‌های پایه کشور.'
        coach_profile.lifeguard_certificate = 'کارت بین‌المللی نجات‌غریق درجه یک ILS'
        coach_profile.lifeguard_expiration = today + datetime.timedelta(days=580)
        coach_profile.years_of_experience = 12
        coach_profile.previous_experience = 'سرمربی تیم نونهالان باشگاه انقلاب، مربی تیم استخر آزادی تهران، مدرس کارگاه‌های بازآموزی فدراسیون'
        coach_profile.additional_skills = 'آب‌درمانی تخصصی و ریکاوری، اصلاح ناهنجاری‌های اسکلتی در آب، مدرک مربیگری بین‌المللی FINA Level 2'
        coach_profile.emergency_contact_name = 'مهدی مرادی (برادر)'
        coach_profile.emergency_contact_phone = '09129876543'
        coach_profile.address = 'تهران، خیابان شریعتی، بالاتر از پل رومی، کوچه یاس، پلاک ۴۲'
        coach_profile.employment_start_date = today - datetime.timedelta(days=700)
        coach_profile.employment_status = CoachProfile.EmploymentStatus.ACTIVE
        coach_profile.employment_type = CoachProfile.EmploymentType.HOURLY
        coach_profile.hourly_rate = Decimal('450000.00')
        coach_profile.fixed_monthly_salary = Decimal('18000000.00')
        coach_profile.revenue_percentage = Decimal('15.00')
        coach_profile.contractual_weekly_hours = 24
        coach_profile.personnel_id = 'COACH-1042'
        coach_profile.save()

        # مربی ۲ (همکار)
        coach2_user, _ = User.objects.get_or_create(
            phone='09222222223',
            defaults={
                'first_name': 'سارا',
                'last_name': 'کاظمی',
                'role': User.Role.COACH,
            }
        )
        coach2_user.set_password(STANDARD_PASS)
        coach2_user.role = User.Role.COACH
        coach2_user.save()
        CoachProfile.objects.get_or_create(
            user=coach2_user,
            defaults={
                'specialties': 'شنای موزون، آب‌درمانی، کرال پشت و قورباغه',
                'bio': 'مدرس رسمی فدراسیون و کارشناس ارشد فیزیولوژی ورزش با سابقه ۱۰ سال هدایت تیم‌های شنای بانوان.',
                'employment_status': CoachProfile.EmploymentStatus.ACTIVE,
                'hourly_rate': Decimal('400000.00'),
            }
        )

        self.stdout.write(self.style.SUCCESS(f'✓ حساب‌های کاربری مربی ({coach_user.phone}) و مدیر فعال گردیدند.'))

        # -------------------------------------------------------------
        # 2. سطوح مهارتی و مهارت‌های شنا
        # -------------------------------------------------------------
        level1, _ = SkillLevel.objects.get_or_create(
            name='مبتدی (آشنایی با آب)',
            defaults={'order': 1, 'color_badge': '#3B82F6', 'description': 'غوطه‌وری، تنفس صحیح و اصول پای کرال'}
        )
        level2, _ = SkillLevel.objects.get_or_create(
            name='متوسط (کرال سینه و پشت)',
            defaults={'order': 2, 'color_badge': '#10B981', 'description': 'هماهنگی دست و پا، نفس‌گیری دوطرفه و کرال پشت'}
        )
        level3, _ = SkillLevel.objects.get_or_create(
            name='پیشرفته (قورباغه و پروانه)',
            defaults={'order': 3, 'color_badge': '#8B5CF6', 'description': 'تکنیک تخصصی قورباغه و پروانه و آمادگی مسابقات'}
        )

        skill_defs = [
            (level1, 'حبس نفس و شناوری لاک‌پشتی', 'نگه داشتن نفس به مدت ۱۵ ثانیه در وضعیت شناوری کامل'),
            (level1, 'پای کرال سینه با تخته شنا ۲۵ متر', 'حرکت شلاقی مچ پا با زانوی کشیده بدون خستگی'),
            (level1, 'سُر خوردن هیدرودینامیک و غوطه‌وری قارچی', 'سر خوردن حداقل ۵ متر پس از فشار پا به دیواره استخر'),
            (level2, 'تکنیک دست کرال سینه و نفس‌گیری دوطرفه', 'حرکت متقارن دست‌ها و هواگیری منظم در ریتم ۳ ضرب'),
            (level2, 'کرال پشت ۵۰ متر پیوسته با ریتم پا', 'حفظ تعادل افقی در آب و گردش مداوم دست‌ها بدون توقف'),
            (level2, 'پای دوچرخه ۲ دقیقه در آب عمیق بدون تکیه‌گاه', 'حفظ سر بیرون از آب با دست‌های ثابت روی سینه'),
            (level3, 'شنای پروانه ۲۵ متر با موج دلفین متوالی', 'دو موج پا به ازای هر سیکل دست بدون افتادگی باسن'),
            (level3, 'شنای قورباغه ۱۰۰ متر با زمانبندی صحیح دست و پا', 'کشش، ضربه شلاقی پا و فاز سر خوردن با زمانبندی تفکیک‌شده'),
            (level3, 'استارت مسابقاتی از روی سکو و سالتو برگشت', 'ورود تیز به آب و چرخش سریع زیر آب با زاویه هیدرودینامیک'),
        ]
        created_skills = {}
        for lvl, s_name, s_desc in skill_defs:
            sk, _ = Skill.objects.get_or_create(
                level=lvl,
                name=s_name,
                defaults={'criteria_description': s_desc, 'order': 1}
            )
            created_skills[s_name] = sk

        # -------------------------------------------------------------
        # 3. دوره‌ها و کلاس‌های مربی علیرضا مرادی
        # -------------------------------------------------------------
        course1, _ = Course.objects.get_or_create(
            name='دوره جامع آموزش کرال سینه و استقامت پاییز ۱۴۰۵',
            defaults={
                'description': 'آموزش اصولی کرال سینه، هواگیری تخصصی و استقامت در آب برای نوجوانان',
                'gender': 'MALE',
                'status': 'ACTIVE',
                'base_price': Decimal('4200000.00'),
                'sessions_count': 12,
                'pool_location': 'استخر قهرمانی آزادی (استخر ۲۵ متر)',
            }
        )

        course2, _ = Course.objects.get_or_create(
            name='دوره تخصصی شنای پروانه و استارت قهرمانی',
            defaults={
                'description': 'تکنیک‌های پیشرفته ۴ شنا، موج دلفین، استارت از سکو و چرخش سالتو برای شناگران مستعد',
                'gender': 'MALE',
                'status': 'ACTIVE',
                'base_price': Decimal('5500000.00'),
                'sessions_count': 16,
                'pool_location': 'استخر مروارید ولنجک',
            }
        )

        course3, _ = Course.objects.get_or_create(
            name='مدرسه شنای نونهالان (آشنایی با آب و رفع ترس)',
            defaults={
                'description': 'دوره شاداب پایه با متد آموزش بازی‌محور برای رفع ترس و ایجاد علاقه به آب',
                'gender': 'MALE',
                'status': 'ACTIVE',
                'base_price': Decimal('3800000.00'),
                'sessions_count': 10,
                'pool_location': 'استخر شهید چمران (بولینگ عبدو)',
            }
        )

        # کلاس ۱: گروه A عصرها (یکشنبه و سه‌شنبه ۱۷:۰۰)
        group1, _ = SwimmerGroup.objects.get_or_create(
            name='گروه A عصرها (یکشنبه و سه‌شنبه ۱۷:۰۰)',
            course=course1,
            defaults={
                'skill_level': level2,
                'capacity': 12,
                'status': 'OPEN',
                'pool_location': 'استخر قهرمانی آزادی (استخر ۲۵ متر)',
            }
        )
        group1.skill_level = level2
        group1.pool_location = 'استخر قهرمانی آزادی (استخر ۲۵ متر)'
        group1.status = 'OPEN'
        group1.save()
        GroupCoach.objects.get_or_create(group=group1, coach=coach_profile, defaults={'is_primary': True})

        GroupSchedule.objects.get_or_create(
            group=group1, weekday=1,  # یک‌شنبه
            defaults={'start_time': datetime.time(17, 0), 'end_time': datetime.time(18, 30)}
        )
        GroupSchedule.objects.get_or_create(
            group=group1, weekday=3,  # سه‌شنبه
            defaults={'start_time': datetime.time(17, 0), 'end_time': datetime.time(18, 30)}
        )

        # کلاس ۲: تیم نخبگان پروانه و مسابقات پایه
        group2, _ = SwimmerGroup.objects.get_or_create(
            name='تیم نخبگان پروانه و مسابقات پایه',
            course=course2,
            defaults={
                'skill_level': level3,
                'capacity': 10,
                'status': 'OPEN',
                'pool_location': 'استخر مروارید ولنجک',
            }
        )
        group2.skill_level = level3
        group2.pool_location = 'استخر مروارید ولنجک'
        group2.status = 'OPEN'
        group2.save()
        GroupCoach.objects.get_or_create(group=group2, coach=coach_profile, defaults={'is_primary': True})

        GroupSchedule.objects.get_or_create(
            group=group2, weekday=2,  # دوشنبه
            defaults={'start_time': datetime.time(18, 0), 'end_time': datetime.time(19, 30)}
        )
        GroupSchedule.objects.get_or_create(
            group=group2, weekday=4,  # چهارشنبه
            defaults={'start_time': datetime.time(18, 0), 'end_time': datetime.time(19, 30)}
        )

        # کلاس ۳: مدرسه شنای نونهالان B (روزهای زوج)
        group3, _ = SwimmerGroup.objects.get_or_create(
            name='مدرسه شنای نونهالان B (آشنایی با آب)',
            course=course3,
            defaults={
                'skill_level': level1,
                'capacity': 8,
                'status': 'OPEN',
                'pool_location': 'استخر شهید چمران (بولینگ عبدو)',
            }
        )
        group3.skill_level = level1
        group3.pool_location = 'استخر شهید چمران (بولینگ عبدو)'
        group3.status = 'OPEN'
        group3.save()
        GroupCoach.objects.get_or_create(group=group3, coach=coach_profile, defaults={'is_primary': True})

        GroupSchedule.objects.get_or_create(
            group=group3, weekday=0,  # شنبه
            defaults={'start_time': datetime.time(14, 0), 'end_time': datetime.time(15, 15)}
        )
        GroupSchedule.objects.get_or_create(
            group=group3, weekday=2,  # دوشنبه
            defaults={'start_time': datetime.time(14, 0), 'end_time': datetime.time(15, 15)}
        )

        self.stdout.write(self.style.SUCCESS('✓ کلاس‌ها و برنامه‌های هفتگی مربی تنظیم شدند.'))

        # -------------------------------------------------------------
        # 4. شناگران و ثبت‌نام در کلاس‌های مربی
        # -------------------------------------------------------------
        swimmers_data = [
            ('پارسا', 'حسینی', '0024510001', 'MALE', level2, '09121111101', 'بدون بیماری خاص، اولیا تاکید بر تایم‌گیری منظم دارند.'),
            ('مانی', 'جعفری', '0024510002', 'MALE', level1, '09121111102', 'حساسیت خفیف به کلر (استفاده از قطره استریل مجاز است).'),
            ('سام', 'احمدوند', '0024510003', 'MALE', level3, '09121111103', 'ورزشکار حرفه‌ای رده زیر ۱۲ سال، آمادگی مسابقات کشوری.'),
            ('ستایش', 'باقری', '0024510004', 'FEMALE', level2, '09121111104', 'کاملاً سالم و دارای گواهی سلامت ورزشی.'),
            ('ترنم', 'حیدری', '0024510005', 'FEMALE', level1, '09121111105', 'قدری کم‌حرف، نیاز به تشویق بیشتر در غوطه‌وری.'),
            ('آرتین', 'کاظمی', '0024510006', 'MALE', level2, '09121111106', 'سابقه ۱ سال شنا در کانون پرورش فکری.'),
            ('کیان', 'صادقی', '0024510007', 'MALE', level3, '09121111107', 'مچ پای فوق‌العاده منعطف، مناسب پروانه و کرال پشت.'),
            ('باران', 'موسوی', '0024510008', 'FEMALE', level2, '09121111108', 'علاقمند به تمرینات استقامتی.'),
            ('ایلیا', 'کریمی', '0024510009', 'MALE', level1, '09121111109', 'ترس از عمق آب در جلسه اول، اکنون مسلط بر پایاب.'),
            ('رادین', 'نوری', '0024510010', 'MALE', level3, '09121111110', 'رکورددار ۵۰ متر آزاد در المپیاد مدارس منطقه.'),
        ]

        active_swimmers = []
        for fn, ln, nat, gen, lvl, ph, med in swimmers_data:
            u, _ = User.objects.get_or_create(
                phone=ph,
                defaults={
                    'first_name': fn,
                    'last_name': ln,
                    'national_id': nat,
                    'role': User.Role.SWIMMER,
                }
            )
            u.set_password(STANDARD_PASS)
            u.save()

            sw, _ = SwimmerProfile.objects.get_or_create(
                user=u,
                defaults={
                    'first_name': fn,
                    'last_name': ln,
                    'national_id': nat,
                    'gender': gen,
                    'current_level': lvl,
                    'emergency_contact_phone': ph,
                    'medical_notes': med,
                    'date_of_birth': today - datetime.timedelta(days=365 * 11),
                }
            )
            sw.first_name = fn
            sw.last_name = ln
            sw.current_level = lvl
            sw.medical_notes = med
            sw.save()
            active_swimmers.append(sw)

        # گروه ۱: شناگران سطح ۲
        g1_swimmers = [active_swimmers[0], active_swimmers[3], active_swimmers[5], active_swimmers[7]]
        for sw in g1_swimmers:
            en, _ = Enrollment.objects.get_or_create(
                swimmer=sw, group=group1,
                defaults={
                    'course': group1.course,
                    'coach': coach_profile,
                    'status': 'ACTIVE',
                    'sessions_purchased': 12,
                    'sessions_attended': 7
                }
            )
            en.status = 'ACTIVE'
            en.coach = coach_profile
            en.save()

        # گروه ۲: شناگران سطح ۳
        g2_swimmers = [active_swimmers[2], active_swimmers[6], active_swimmers[9]]
        for sw in g2_swimmers:
            en, _ = Enrollment.objects.get_or_create(
                swimmer=sw, group=group2,
                defaults={
                    'course': group2.course,
                    'coach': coach_profile,
                    'status': 'ACTIVE',
                    'sessions_purchased': 16,
                    'sessions_attended': 10
                }
            )
            en.status = 'ACTIVE'
            en.coach = coach_profile
            en.save()

        # گروه ۳: شناگران سطح ۱
        g3_swimmers = [active_swimmers[1], active_swimmers[4], active_swimmers[8]]
        for sw in g3_swimmers:
            en, _ = Enrollment.objects.get_or_create(
                swimmer=sw, group=group3,
                defaults={
                    'course': group3.course,
                    'coach': coach_profile,
                    'status': 'ACTIVE',
                    'sessions_purchased': 10,
                    'sessions_attended': 4
                }
            )
            en.status = 'ACTIVE'
            en.coach = coach_profile
            en.save()

        self.stdout.write(self.style.SUCCESS(f'✓ {len(active_swimmers)} شناگر واقعی در گروه‌های مربی ثبت‌نام شدند.'))

        # -------------------------------------------------------------
        # 5. جلسات کلاسی زنده: امروز، گذشته با حضور، و ثبت‌نشده (Pending)
        # -------------------------------------------------------------
        # الف) جلسه امروز ساعت ۱۸:۰۰ تا ۱۹:۳۰ (جلسه بعدی زنده در داشبورد)
        today_next_session, _ = ClassSession.objects.get_or_create(
            group=group2,
            session_date=today,
            start_time=datetime.time(18, 0),
            defaults={
                'coach': coach_profile,
                'end_time': datetime.time(19, 30),
                'pool_location': group2.pool_location,
                'status': ClassSession.Status.SCHEDULED,
                'session_notes': 'جلسه تمرین اصلی پروانه و استارت قهرمانی - لطفا تخته و کفی شنا همراه داشته باشند.'
            }
        )
        today_next_session.coach = coach_profile
        today_next_session.status = ClassSession.Status.SCHEDULED
        today_next_session.save()

        # ب) جلسه امروز ساعت ۱۴:۰۰ تا ۱۵:۱۵ (برگزار شده و حضور غیاب ثبت‌شده)
        today_done_session, _ = ClassSession.objects.get_or_create(
            group=group3,
            session_date=today,
            start_time=datetime.time(14, 0),
            defaults={
                'coach': coach_profile,
                'end_time': datetime.time(15, 15),
                'pool_location': group3.pool_location,
                'status': ClassSession.Status.COMPLETED,
                'session_notes': 'تمرین موفق غوطه‌وری و رفع ترس نوآموزان با اسباب‌بازی‌های غوطه‌ور.'
            }
        )
        today_done_session.coach = coach_profile
        today_done_session.status = ClassSession.Status.COMPLETED
        today_done_session.save()

        # ثبت حضور و غیاب برای جلسه امروز ساعت ۱۴:۰۰
        for i, sw in enumerate(g3_swimmers):
            en = sw.enrollments.filter(group=group3).first()
            stat = AttendanceRecord.Status.PRESENT if i != 2 else AttendanceRecord.Status.LATE
            note_text = 'پیشرفت عالی در غوطه‌وری' if i == 0 else ('کمی خسته' if i == 1 else '۱۰ دقیقه تاخیر در ورود به استخر')
            AttendanceRecord.objects.update_or_create(
                session=today_done_session,
                swimmer=sw,
                defaults={
                    'enrollment': en,
                    'status': stat,
                    'recorded_by': coach_user,
                    'note': note_text,
                    'consumed_quota': True,
                }
            )

        # ج) جلسه امروز ساعت ۱۶:۰۰ تا ۱۷:۱۵ (برگزار شده اما بدون حضور غیاب جهت تست Pending Actions)
        today_unrecorded_session, _ = ClassSession.objects.get_or_create(
            group=group1,
            session_date=today,
            start_time=datetime.time(16, 0),
            defaults={
                'coach': coach_profile,
                'end_time': datetime.time(17, 15),
                'pool_location': group1.pool_location,
                'status': ClassSession.Status.COMPLETED,
                'session_notes': 'جلسه تمرینی دست کرال سینه - نیازمند ثبت فوری حضور و غیاب'
            }
        )
        today_unrecorded_session.coach = coach_profile
        today_unrecorded_session.status = ClassSession.Status.COMPLETED
        today_unrecorded_session.save()
        AttendanceRecord.objects.filter(session=today_unrecorded_session).delete()

        # د) جلسات گذشته (هفته‌های گذشته) با سوابق کامل حضور و غیاب
        past_dates = [
            (today - datetime.timedelta(days=2), group1, datetime.time(17, 0), datetime.time(18, 30), True),
            (today - datetime.timedelta(days=4), group2, datetime.time(18, 0), datetime.time(19, 30), True),
            (today - datetime.timedelta(days=7), group1, datetime.time(17, 0), datetime.time(18, 30), True),
            (today - datetime.timedelta(days=9), group3, datetime.time(14, 0), datetime.time(15, 15), True),
            (today - datetime.timedelta(days=11), group2, datetime.time(18, 0), datetime.time(19, 30), True),
            (today - datetime.timedelta(days=3), group1, datetime.time(17, 0), datetime.time(18, 30), False),
        ]

        for p_date, grp, st, et, record_att in past_dates:
            sess, _ = ClassSession.objects.get_or_create(
                group=grp,
                session_date=p_date,
                start_time=st,
                defaults={
                    'coach': coach_profile,
                    'end_time': et,
                    'pool_location': grp.pool_location,
                    'status': ClassSession.Status.COMPLETED,
                }
            )
            sess.coach = coach_profile
            sess.status = ClassSession.Status.COMPLETED
            sess.save()

            if record_att:
                enrolled = grp.enrollments.all()
                for idx, enr in enumerate(enrolled):
                    s_status = AttendanceRecord.Status.PRESENT
                    s_note = 'تکنیک عالی'
                    if idx == 1:
                        s_status = AttendanceRecord.Status.EXCUSED
                        s_note = 'غیبت موجه با اطلاع قبلی اولیا'
                    elif idx == 2 and p_date.day % 2 == 0:
                        s_status = AttendanceRecord.Status.ABSENT
                        s_note = 'غیبت بدون اطلاع'

                    AttendanceRecord.objects.update_or_create(
                        session=sess,
                        swimmer=enr.swimmer,
                        defaults={
                            'enrollment': enr,
                            'status': s_status,
                            'recorded_by': coach_user,
                            'note': s_note,
                            'consumed_quota': (s_status in [AttendanceRecord.Status.PRESENT, AttendanceRecord.Status.LATE]),
                        }
                    )
            else:
                AttendanceRecord.objects.filter(session=sess).delete()

        # ه) جلسات آینده (هفته‌های آینده) برای جدول زمانبندی و تقویم
        future_dates = [
            (today + datetime.timedelta(days=2), group1, datetime.time(17, 0), datetime.time(18, 30)),
            (today + datetime.timedelta(days=4), group2, datetime.time(18, 0), datetime.time(19, 30)),
            (today + datetime.timedelta(days=5), group3, datetime.time(14, 0), datetime.time(15, 15)),
            (today + datetime.timedelta(days=7), group1, datetime.time(17, 0), datetime.time(18, 30)),
            (today + datetime.timedelta(days=9), group2, datetime.time(18, 0), datetime.time(19, 30)),
            (today + datetime.timedelta(days=12), group3, datetime.time(14, 0), datetime.time(15, 15)),
        ]
        for f_date, grp, st, et in future_dates:
            f_sess, _ = ClassSession.objects.get_or_create(
                group=grp,
                session_date=f_date,
                start_time=st,
                defaults={
                    'coach': coach_profile,
                    'end_time': et,
                    'pool_location': grp.pool_location,
                    'status': ClassSession.Status.SCHEDULED,
                }
            )
            f_sess.coach = coach_profile
            f_sess.status = ClassSession.Status.SCHEDULED
            f_sess.save()

        self.stdout.write(self.style.SUCCESS('✓ جلسات زنده امروز، گذشته و آینده کلاسی ثبت گردیدند.'))

        # -------------------------------------------------------------
        # 6. برنامه‌های تمرینی (Workout Plans)
        # -------------------------------------------------------------
        workouts_data = [
            (
                'برنامه تمرینی استقامتی کرال سینه و ریتم ۳ ضرب تنفس',
                group1, level2, 75,
                'هواگیری دوطرفه منظم و افزایش ظرفیت هوازی شناگران',
                '۴۰۰ متر شنای آزاد سبک گرم‌کردن + ۲۰۰ متر پا با تخته کیک‌بورد + تمرینات کششی سرشانه کنار استخر',
                '۶ ست ۱۰۰ متر کرال سینه با ریتم یکنواخت (۲۰ ثانیه استراحت) + ۴ ست ۵۰ متر با سرعت مسابقه‌ای (۳۰ ثانیه استراحت) + ۲۰۰ متر ترکیبی ۴ شنا',
                '۲۰۰ متر کرال پشت نرم و آرام + تمرینات تنفس عمیق در جا',
                'به حفظ زاویه بدن و عدم فرو رفتن لگن در فاز خستگی شدید دقت شود.',
                True
            ),
            (
                'آموزش تخصصی موج دلفین و هماهنگی تنفس در پروانه',
                group2, level3, 60,
                'انعطاف ستون فقرات در موج دلفین و خروج به موقع چانه جهت تنفس',
                '۳۰۰ متر شنای آزاد + ۱۵۰ متر پا دلفین به پشت با دستان کشیده',
                '۸ ست ۲۵ متر تک دست پروانه (راست/چپ/جفت) + ۶ ست ۵۰ متر پروانه کامل با ۲۰ ثانیه استراحت بین ست‌ها + ۴ ست استارت انفجاری پروانه از سکو',
                '۱۵۰ متر پای دوچرخه سبک + کشش کامل بالاتنه',
                'فشار اصلی بر روی فرود دست‌ها بدون ضربه شدید به آب متمرکز باشد.',
                False
            ),
            (
                'شبیه‌سازی استارت مسابقاتی از سکو و چرخش سالتو دیواره',
                group2, level3, 90,
                'انفجار در ترک سکو و چرخش هیدرودینامیک در دیواره استخر',
                '۵۰۰ متر ترکیبی + ست حرکات پرشی و چابکی در خشکی کنار استخر',
                '۱۲ ست تمرین سالتو با فاصله ۵ متر از دیواره + ۱۰ استارت مسابقه‌ای با ۱۵ متر شنای زیرآب با موج دلفین + ۴ ست ۱۰۰ متر تایم‌گیری مسابقه‌ای',
                '۳۰۰ متر شنای سبک انتخابی',
                'فیلم‌برداری از زاویه ورود دست‌ها به آب جهت آنالیز ویدیویی بعد از تمرین انجام پذیرد.',
                True
            ),
            (
                'پای کرال سینه و سر خوردن هیدرودینامیک نوآموزان نونهال',
                group3, level1, 45,
                'حفظ خط تعادل افقی در سطح آب و عدم انقباض عضلات گردن',
                '۱۰ دقیقه بازی غوطه‌وری قارچی و ستاره‌ای + ۵ دقیقه راه رفتن در آب کم‌عمق',
                '۸ ست ۱۲ متر پای کرال با تخته + ۶ ست سر خوردن موشکی با دست‌های کشیده بدون پا + تمرین مداوم حباب‌سازی در آب',
                'بازی جمع‌آوری حلقه‌های غرق‌شونده در آب و تشویق گروهی نوآموزان',
                'ایجاد اعتمادبه‌نفس در نوآموزانی که از رها کردن لبه استخر هراس دارند اولویت دارد.',
                False
            ),
        ]

        for w_title, grp, lvl, dur, foc, warm, main_s, cool, nte, is_tmpl in workouts_data:
            WorkoutPlan.objects.update_or_create(
                coach=coach_profile,
                title=w_title,
                defaults={
                    'group': grp,
                    'target_level': lvl,
                    'duration_minutes': dur,
                    'focus_skills': foc,
                    'warmup_section': warm,
                    'main_section': main_s,
                    'cooldown_section': cool,
                    'notes': nte,
                    'is_template': is_tmpl,
                }
            )

        self.stdout.write(self.style.SUCCESS(f'✓ {len(workouts_data)} طرح تمرینی تخصصی مربی ذخیره شد.'))

        # -------------------------------------------------------------
        # 7. ارزیابی مهارتی و رکوردهای زمانی شناگران
        # -------------------------------------------------------------
        skill_1 = created_skills.get('حبس نفس و شناوری لاک‌پشتی')
        skill_2 = created_skills.get('تکنیک دست کرال سینه و نفس‌گیری دوطرفه')
        skill_3 = created_skills.get('شنای پروانه ۲۵ متر با موج دلفین متوالی')
        skill_4 = created_skills.get('کرال پشت ۵۰ متر پیوسته با ریتم پا')

        assessments_seed = [
            (active_swimmers[0], skill_2, Decimal('92.00'), SkillAssessment.Status.PASSED, 'حرکت دست‌ها کاملاً قرینه و زاویه کشش آرنج بسیار استاندارد است.'),
            (active_swimmers[0], skill_4, Decimal('86.00'), SkillAssessment.Status.PASSED, 'ریتم تنفس در پشت عالی است، مقداری چرخش شانه تقویت شود.'),
            (active_swimmers[1], skill_1, Decimal('88.00'), SkillAssessment.Status.PASSED, 'آرامش در آب عمیق و شناوری کامل بدون ترس.'),
            (active_swimmers[2], skill_3, Decimal('94.00'), SkillAssessment.Status.PASSED, 'موج پروانه بسیار روان و انفجاری.'),
            (active_swimmers[3], skill_4, Decimal('68.00'), SkillAssessment.Status.NEEDS_PRACTICE, 'افت لگن در مترهای پایانی، نیاز به تقویت عضلات فیله و میان‌تنه.'),
            (active_swimmers[4], skill_1, Decimal('75.00'), SkillAssessment.Status.IN_PROGRESS, 'شناوری قارچی خوب است ولی هنوز در رها کردن کامل تکیه‌گاه تعلل دارد.'),
            (active_swimmers[6], skill_3, Decimal('89.00'), SkillAssessment.Status.PASSED, 'شتاب دست‌ها در فاز پوش (Push) عالی است.'),
        ]

        for sw, sk, sc, st, fb in assessments_seed:
            if sk:
                SkillAssessment.objects.update_or_create(
                    swimmer=sw,
                    skill=sk,
                    defaults={
                        'assessed_by': coach_user,
                        'assessed_at': today - datetime.timedelta(days=3),
                        'score': sc,
                        'status': st,
                        'feedback': fb,
                    }
                )

        records_seed = [
            (active_swimmers[0], SwimmingRecord.Stroke.FREESTYLE, 50, Decimal('29.85'), SwimmingRecord.PoolCourse.SHORT_25M),
            (active_swimmers[0], SwimmingRecord.Stroke.BACKSTROKE, 50, Decimal('35.20'), SwimmingRecord.PoolCourse.SHORT_25M),
            (active_swimmers[2], SwimmingRecord.Stroke.BUTTERFLY, 50, Decimal('31.40'), SwimmingRecord.PoolCourse.SHORT_25M),
            (active_swimmers[2], SwimmingRecord.Stroke.FREESTYLE, 100, Decimal('64.80'), SwimmingRecord.PoolCourse.LONG_50M),
            (active_swimmers[6], SwimmingRecord.Stroke.BREASTSTROKE, 50, Decimal('38.60'), SwimmingRecord.PoolCourse.SHORT_25M),
            (active_swimmers[9], SwimmingRecord.Stroke.FREESTYLE, 50, Decimal('28.30'), SwimmingRecord.PoolCourse.SHORT_25M),
        ]

        for sw, strk, dist, dur, pc in records_seed:
            SwimmingRecord.objects.get_or_create(
                swimmer=sw,
                stroke=strk,
                distance_meters=dist,
                pool_course=pc,
                defaults={
                    'duration_seconds': dur,
                    'recorded_at': today - datetime.timedelta(days=5),
                    'recorded_by': coach_user,
                    'verification_status': SwimmingRecord.VerificationStatus.VERIFIED,
                    'verified_by': admin,
                    'notes': 'ثبت رسمی در پایان دوره با کرنومتر دیجیتال و تأیید سرداور'
                }
            )

        self.stdout.write(self.style.SUCCESS('✓ ارزیابی‌های مهارتی و رکوردهای تایم‌گیری شناگران ثبت شد.'))

        # -------------------------------------------------------------
        # 8. پیشنهادات ارتقای سطح و آزمون‌ها (Promotion Proposals)
        # -------------------------------------------------------------
        proposals_seed = [
            (
                active_swimmers[1], level1, level2, LevelPromotionProposal.Status.PENDING,
                'شناگر به تمامی مهارت‌های آشنایی با آب، هواگیری و شناوری تسلط کامل دارد و شایسته ارتقا به سطح کرال سینه است.',
                '', None, None
            ),
            (
                active_swimmers[0], level2, level3, LevelPromotionProposal.Status.APPROVED,
                'رکوردهای ۵۰ متر کرال سینه و پشت به استانداردهای ورودی سطح پیشرفته رسیده است.',
                'تأیید شد. پرونده و گواهینامه سطح متوسط صادر گردید.', admin, today - datetime.timedelta(days=2)
            ),
            (
                active_swimmers[4], level1, level2, LevelPromotionProposal.Status.PENDING,
                'پیشرفت سریع در حفظ تعادل و شناوری در آب عمیق.',
                '', None, None
            ),
            (
                active_swimmers[3], level2, level3, LevelPromotionProposal.Status.REJECTED,
                'پیشنهاد ارتقا به تیم مسابقات استانی.',
                'شناگر نیاز به حداقل ۴ جلسه تمرین بیشتر در کرال پشت دارد. در آزمون پایان ماه مجدداً ارزیابی شود.',
                admin, today - datetime.timedelta(days=4)
            ),
        ]

        for sw, cur_l, prop_l, st, c_note, r_note, rev_by, rev_at in proposals_seed:
            LevelPromotionProposal.objects.update_or_create(
                swimmer=sw,
                proposed_level=prop_l,
                coach=coach_profile,
                defaults={
                    'current_level': cur_l,
                    'status': st,
                    'coach_notes': c_note,
                    'reviewer_notes': r_note,
                    'reviewed_by': rev_by,
                    'reviewed_at': rev_at,
                }
            )

        self.stdout.write(self.style.SUCCESS('✓ پیشنهادات ارتقای سطح و آزمون‌ها با وضعیت‌های متنوع درج شدند.'))

        # -------------------------------------------------------------
        # 9. پیام‌ها، اعلانات و نوتیفیکیشن‌ها (Messages & Announcements)
        # -------------------------------------------------------------
        Announcement.objects.get_or_create(
            title='برگزاری المپیاد شنای رده‌های سنی پایه استان تهران (آذر ۱۴۰۵)',
            defaults={
                'message': 'کلیه شناگران تیم‌های پایه و مربیان گرامی؛ زمان‌بندی و شرایط ثبت‌نام در مسابقات استانی در تابلوی اعلانات باشگاه درج گردید.',
                'audience': Announcement.Audience.ALL,
                'is_pinned': True,
                'created_by': admin,
            }
        )

        Announcement.objects.get_or_create(
            title='تغییر موقت ساعت جلسه روز پنجشنبه استخر آزادی',
            defaults={
                'message': 'به اطلاع شناگران گروه A می‌رساند سانس روز پنجشنبه به علت مسابقات کشوری با ۱ ساعت تاخیر از ساعت ۱۸ برگزار می‌گردد.',
                'audience': Announcement.Audience.GROUP,
                'target_group': group1,
                'is_pinned': False,
                'created_by': coach_user,
            }
        )

        Announcement.objects.get_or_create(
            title='جلسه هماهنگی فنی و ارزیابی فصلی مربیان شنا',
            defaults={
                'message': 'جلسه شورای فنی مربیان با حضور مدیر آکادمی روز چهارشنبه ساعت ۲۰ در سالن کنفرانس باشگاه برگزار خواهد شد.',
                'audience': Announcement.Audience.COACHES,
                'is_pinned': True,
                'created_by': admin,
            }
        )

        notifications_seed = [
            ('طرح ارتقای سطح شناگر پارسا حسینی تأیید شد', 'پیشنهاد ارتقای سطح شناگر به سطح پیشرفته توسط مدیر آموزشگاه مورد تایید قرار گرفت.', Notification.Category.ANNOUNCEMENT, False),
            ('فیش حقوقی دوره آبان ۱۴۰۵ صادر شد', 'فیش حقوقی و تسویه محاسباتی ساعات تدریس ماه جاری شما آماده مشاهده در بخش مالی و اداری است.', Notification.Category.PAYMENT, False),
            ('جلسه تمرین امروز ساعت ۱۸:۰۰', 'یادآوری: کلاس پیشرفته پروانه و مسابقات پایه امروز ساعت ۱۸:۰۰ در استخر مروارید ولنجک آغاز می‌شود.', Notification.Category.SCHEDULE, False),
            ('موافقت با مرخصی استحقاقی', 'درخواست مرخصی ۲ روزه شما برای تاریخ ۲۵ آبان به تایید مدیریت رسید و مربی جایگزین هماهنگ شد.', Notification.Category.ANNOUNCEMENT, True),
        ]

        for n_title, n_msg, n_cat, n_read in notifications_seed:
            Notification.objects.get_or_create(
                recipient=coach_user,
                title=n_title,
                defaults={
                    'message': n_msg,
                    'category': n_cat,
                    'is_read': n_read,
                    'link': '/coach/profile?tab=PAYROLL' if n_cat == Notification.Category.PAYMENT else '/coach',
                }
            )

        self.stdout.write(self.style.SUCCESS('✓ اطلاعیه‌ها، پیام‌های کلاسی و اعلان‌های مربی ثبت شدند.'))

        # -------------------------------------------------------------
        # 10. سوابق اداری، قراردادها، فیش‌های حقوقی و ارزیابی عملکرد (HR)
        # -------------------------------------------------------------
        contract, _ = CoachContract.objects.get_or_create(
            coach=coach_profile,
            contract_number='CNT-1405-082',
            defaults={
                'contract_type': CoachContract.ContractType.STANDARD,
                'start_date': today - datetime.timedelta(days=300),
                'end_date': today + datetime.timedelta(days=400),
                'employment_type': CoachProfile.EmploymentType.HOURLY,
                'hourly_rate': Decimal('450000.00'),
                'fixed_salary': Decimal('18000000.00'),
                'percentage_rate': Decimal('15.00'),
                'percentage_basis': 'COURSE_GROSS',
                'agreed_weekly_hours': 24,
                'status': CoachContract.Status.ACTIVE,
                'terms_and_conditions': 'مربی متعهد به حضور منظم ۱۵ دقیقه قبل از شروع سانس کنار استخر، پوشش رسمی کادر مربیگری و ارزیابی مستمر ماهانه شناگران می‌باشد.',
                'internal_notes': 'قرارداد اصلی تمدید شده سال ۱۴۰۵ با رضایت کامل از عملکرد آموزشی.',
                'created_by': admin,
            }
        )

        payroll_1, _ = CoachPayroll.objects.get_or_create(
            coach=coach_profile,
            period_label='مهر ۱۴۰۵',
            defaults={
                'contract': contract,
                'period_start': today - datetime.timedelta(days=48),
                'period_end': today - datetime.timedelta(days=18),
                'compensation_model': CoachProfile.EmploymentType.HOURLY,
                'base_rate': Decimal('450000.00'),
                'teaching_hours': Decimal('48.00'),
                'completed_sessions_count': 24,
                'base_compensation': Decimal('21600000.00'),
                'bonuses_amount': Decimal('2000000.00'),
                'overtime_amount': Decimal('1500000.00'),
                'deductions_amount': Decimal('1200000.00'),
                'gross_amount': Decimal('25100000.00'),
                'net_payable_amount': Decimal('23900000.00'),
                'approval_status': CoachPayroll.ApprovalStatus.APPROVED,
                'payment_status': CoachPayroll.PaymentStatus.PAID,
                'approved_by': admin,
                'notes': 'حقوق و پاداش درخشش تیم نونهالان در مسابقات استانی مهرماه'
            }
        )

        CoachPaymentRecord.objects.get_or_create(
            payroll=payroll_1,
            payment_number='PAY-1405-08-01',
            defaults={
                'coach': coach_profile,
                'amount': Decimal('23900000.00'),
                'payment_date': today - datetime.timedelta(days=15),
                'payment_method': CoachPaymentRecord.PaymentMethod.BANK_TRANSFER,
                'reference_number': 'TRX-984521034',
                'description': 'تسویه کامل حقوق و پاداش مهرماه ۱۴۰۵ از طریق پایا بانک ملت',
                'registered_by': admin,
            }
        )

        CoachPayroll.objects.get_or_create(
            coach=coach_profile,
            period_label='آبان ۱۴۰۵',
            defaults={
                'contract': contract,
                'period_start': today - datetime.timedelta(days=17),
                'period_end': today + datetime.timedelta(days=13),
                'compensation_model': CoachProfile.EmploymentType.HOURLY,
                'base_rate': Decimal('450000.00'),
                'teaching_hours': Decimal('44.00'),
                'completed_sessions_count': 22,
                'base_compensation': Decimal('19800000.00'),
                'bonuses_amount': Decimal('1500000.00'),
                'overtime_amount': Decimal('800000.00'),
                'deductions_amount': Decimal('1000000.00'),
                'gross_amount': Decimal('22100000.00'),
                'net_payable_amount': Decimal('21100000.00'),
                'approval_status': CoachPayroll.ApprovalStatus.APPROVED,
                'payment_status': CoachPayroll.PaymentStatus.PARTIALLY_PAID,
                'approved_by': admin,
                'notes': 'مساعده پرداخت شده و مانده در پایان ماه تسویه می‌گردد.'
            }
        )

        CoachLeaveRequest.objects.get_or_create(
            coach=coach_profile,
            leave_type=CoachLeaveRequest.LeaveType.CASUAL,
            start_date=today + datetime.timedelta(days=6),
            defaults={
                'end_date': today + datetime.timedelta(days=7),
                'hours_requested': 8,
                'reason': 'شرکت در کارگاه بین‌المللی متدولوژی مربیگری شنا',
                'status': CoachLeaveRequest.Status.APPROVED,
                'reviewed_by': admin,
                'admin_notes': 'موافقت شد. هماهنگی با مربی جایگزین (سارا کاظمی) برای پوشش سانس‌ها صورت گرفت.',
            }
        )

        CoachLeaveRequest.objects.get_or_create(
            coach=coach_profile,
            leave_type=CoachLeaveRequest.LeaveType.HOURLY,
            start_date=today + datetime.timedelta(days=12),
            defaults={
                'end_date': today + datetime.timedelta(days=12),
                'hours_requested': 3,
                'reason': 'انجام امور اداری و تمدید دفترچه درمانی',
                'status': CoachLeaveRequest.Status.PENDING,
            }
        )

        CoachPerformanceEvaluation.objects.get_or_create(
            coach=coach_profile,
            period_label='شش‌ماهه اول ۱۴۰۵',
            defaults={
                'evaluator': admin,
                'evaluation_date': today - datetime.timedelta(days=25),
                'overall_score': Decimal('94.50'),
                'strengths': 'تسلط فوق‌العاده بر اصلاح عیوب تکنیکی شناگران، حضور به موقع در کنار استخر و ارتباط موثر و گرم با نوآموزان و اولیا.',
                'weaknesses': 'نیاز به ثبت سریع‌تر حضور و غیاب روزانه در پرتال بلافاصله پس از اتمام هر جلسه.',
                'recommendations': 'برگزاری کارگاه انتقال تجربه برای مربیان رده‌های پایه و جوان‌تر آکادمی.',
                'general_feedback': 'یکی از برترین و متعهدترین مربیان آکادمی با بالاترین نرخ رضایت در نظرسنجی اولیا.',
                'is_shared_with_coach': True,
                'criteria_ratings': {
                    'teaching_technique': 98,
                    'punctuality': 95,
                    'swimmer_engagement': 96,
                    'safety_awareness': 95,
                    'administrative_compliance': 88
                }
            }
        )

        CoachAdministrativeNote.objects.get_or_create(
            coach=coach_profile,
            title='تقدیرنامه ویژه مدیر آکادمی بابت کسب مدال‌های المپیاد',
            defaults={
                'category': CoachAdministrativeNote.Category.COMMENDATION,
                'severity': CoachAdministrativeNote.Severity.INFO,
                'description': 'کسب ۲ مدال طلا و ۱ نقره توسط شناگران تیم مربی در مسابقات استانی و ابراز رضایت ویژه اولیا.',
                'date': today - datetime.timedelta(days=12),
                'created_by': admin,
                'is_confidential': False,
            }
        )

        CoachCertificate.objects.get_or_create(
            coach=coach_profile,
            title='کارت مربیگری درجه ۲ فدراسیون شنا، شیرجه و واترپلو',
            defaults={
                'issuing_organization': 'فدراسیون شنای جمهوری اسلامی ایران',
                'issue_date': today - datetime.timedelta(days=1200),
                'expiration_date': today + datetime.timedelta(days=600),
                'certificate_number': 'IR-SWIM-2022-8410',
                'is_verified': True,
                'notes': 'تایید شده توسط دبیر فدراسیون'
            }
        )

        CoachCertificate.objects.get_or_create(
            coach=coach_profile,
            title='کارت بین‌المللی نجات‌غریق درجه یک ILS',
            defaults={
                'issuing_organization': 'فدراسیون نجات‌غریق و غواصی ایران',
                'issue_date': today - datetime.timedelta(days=800),
                'expiration_date': today + datetime.timedelta(days=580),
                'certificate_number': 'ILS-LIFE-2023-994',
                'is_verified': True,
                'notes': 'معتبر برای استخرهای بین‌المللی و دریا'
            }
        )

        self.stdout.write(self.style.SUCCESS('✓ سوابق اداری، قرارداد، فیش‌های حقوقی و ارزیابی عملکرد مربی ثبت شدند.'))

        # -------------------------------------------------------------
        # خلاصه نهایی
        # -------------------------------------------------------------
        self.stdout.write(self.style.SUCCESS('\n======================================================='))
        self.stdout.write(self.style.SUCCESS('🎉 داده‌های دیتابیس برای پنل معلم/مربی با موفقیت ایجاد گردید!'))
        self.stdout.write(self.style.SUCCESS(f'نام مربی: {coach_profile.full_name}'))
        self.stdout.write(self.style.SUCCESS(f'شماره تلفن لاگین مربی: {coach_user.phone}'))
        self.stdout.write(self.style.SUCCESS(f'رمز عبور: {STANDARD_PASS}'))
        self.stdout.write(self.style.SUCCESS('مسیر پنل مربی: /coach'))
        self.stdout.write(self.style.SUCCESS('=======================================================\n'))
