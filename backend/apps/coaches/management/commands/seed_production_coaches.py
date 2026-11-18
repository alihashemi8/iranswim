import logging
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.accounts.models import User
from apps.coaches.models import CoachProfile

logger = logging.getLogger(__name__)

COACHES_DATA = [
    # Female Coaches (بانوان - ۶ نفر اول)
    {
        'first_name': 'سارا',
        'last_name': 'مینایی فر',
        'phone': '09196617477',
        'gender': CoachProfile.Gender.FEMALE,
    },
    {
        'first_name': 'مائده',
        'last_name': 'بخارایی',
        'phone': '09100442163',
        'gender': CoachProfile.Gender.FEMALE,
    },
    {
        'first_name': 'زهرا',
        'last_name': 'قلی پور',
        'phone': '09102068863',
        'gender': CoachProfile.Gender.FEMALE,
    },
    {
        'first_name': 'مریم',
        'last_name': 'نیک راه',
        'phone': '09381079522',
        'gender': CoachProfile.Gender.FEMALE,
    },
    {
        'first_name': 'مریم',
        'last_name': 'کاظمی',
        'phone': '09128862320',
        'gender': CoachProfile.Gender.FEMALE,
    },
    {
        'first_name': 'فائزه سادات',
        'last_name': 'موسوی',
        'phone': '09921515695',
        'gender': CoachProfile.Gender.FEMALE,
    },
    # Male Coaches (آقایان - باقی نفرات)
    {
        'first_name': 'محسن',
        'last_name': 'همدانی',
        'phone': '09123825399',
        'gender': CoachProfile.Gender.MALE,
    },
    {
        'first_name': 'امیر',
        'last_name': 'فرح بخش',
        'phone': '09127053428',
        'gender': CoachProfile.Gender.MALE,
    },
    {
        'first_name': 'جواد',
        'last_name': 'بابا حسین پور',
        'phone': '09192878158',
        'gender': CoachProfile.Gender.MALE,
    },
    {
        'first_name': 'علیرضا',
        'last_name': 'آدینه مهر',
        'phone': '09365880119',
        'gender': CoachProfile.Gender.MALE,
    },
    {
        'first_name': 'کمیل',
        'last_name': 'رحمانی',
        'phone': '09127098140',
        'gender': CoachProfile.Gender.MALE,
    },
    {
        'first_name': 'محمد رضا',
        'last_name': 'جباری',
        'phone': '09191821523',
        'gender': CoachProfile.Gender.MALE,
    },
    {
        'first_name': 'عباس',
        'last_name': 'توکلی',
        'phone': '09198485526',
        'gender': CoachProfile.Gender.MALE,
    },
    {
        'first_name': 'علیرضا',
        'last_name': 'رفیعی',
        'phone': '09126815734',
        'gender': CoachProfile.Gender.MALE,
    },
    {
        'first_name': 'مهدی',
        'last_name': 'خلخالی',
        'phone': '09960144289',
        'gender': CoachProfile.Gender.MALE,
    },
    {
        'first_name': 'حسین',
        'last_name': 'سجادی',
        'phone': '09935759134',
        'gender': CoachProfile.Gender.MALE,
    },
    {
        'first_name': 'حسین',
        'last_name': 'جمالی',
        'phone': '09106143027',
        'gender': CoachProfile.Gender.MALE,
    },
    {
        'first_name': 'امیرمحمد',
        'last_name': 'سلطانی کمال',
        'phone': '09911942642',
        'gender': CoachProfile.Gender.MALE,
    },
    {
        'first_name': 'مهدی',
        'last_name': 'خلیلی',
        'phone': '09127838878',
        'gender': CoachProfile.Gender.MALE,
    },
    {
        'first_name': 'ابوالفضل',
        'last_name': 'کیامیری',
        'phone': '09120550613',
        'gender': CoachProfile.Gender.MALE,
    },
]

DEFAULT_PASSWORD = '12345678'


class Command(BaseCommand):
    help = 'افزودن لیست رسمی مربیان به دیتابیس پروداکشن با رمز ۱۲۳۴۵۶۷۸'

    def add_arguments(self, parser):
        parser.add_argument(
            '--zahra-phone',
            type=str,
            help='شماره همراه صحیح خانم زهرا قلی پور (در صورت وجود)',
            default=None
        )

    def handle(self, *args, **options):
        zahra_phone = options.get('zahra_phone')
        if zahra_phone:
            zahra_phone = zahra_phone.strip()

        self.stdout.write(self.style.NOTICE('شروع ثبت و به‌روزرسانی مربیان در دیتابیس...'))

        seen_phones = set()
        created_count = 0
        updated_count = 0
        skipped_count = 0

        # دریافت بیشترین order موجود
        last_order = CoachProfile.objects.order_by('-display_order').values_list('display_order', flat=True).first() or 0

        for index, item in enumerate(COACHES_DATA, start=1):
            fn = item['first_name']
            ln = item['last_name']
            phone = item['phone']
            gender = item['gender']

            # اگر برای زهرا قلی پور شماره جدید پاس داده شده باشد
            if fn == 'زهرا' and ln == 'قلی پور' and zahra_phone:
                phone = zahra_phone

            if phone in seen_phones:
                self.stdout.write(
                    self.style.WARNING(
                        f"هشدار: شماره {phone} برای «{fn} {ln}» تکراری است (قبلاً در همین لیست استفاده شده). این رکورد رد شد."
                    )
                )
                skipped_count += 1
                continue

            seen_phones.add(phone)

            try:
                with transaction.atomic():
                    user, user_created = User.objects.get_or_create(
                        phone=phone,
                        defaults={
                            'first_name': fn,
                            'last_name': ln,
                            'role': User.Role.COACH,
                            'is_active': True,
                            'is_password_changed': True,
                        }
                    )

                    user.first_name = fn
                    user.last_name = ln
                    user.role = User.Role.COACH
                    user.is_active = True
                    user.set_password(DEFAULT_PASSWORD)
                    user.save()

                    profile, prof_created = CoachProfile.objects.get_or_create(
                        user=user,
                        defaults={
                            'first_name': fn,
                            'last_name': ln,
                            'gender': gender,
                            'employment_status': CoachProfile.EmploymentStatus.ACTIVE,
                            'show_on_landing': True,
                            'display_order': last_order + index,
                        }
                    )

                    if not prof_created:
                        profile.first_name = fn
                        profile.last_name = ln
                        profile.gender = gender
                        profile.employment_status = CoachProfile.EmploymentStatus.ACTIVE
                        profile.show_on_landing = True
                        profile.save()

                    status_str = "ایجاد شد" if (user_created or prof_created) else "به‌روزرسانی شد"
                    gender_str = "بانو" if gender == CoachProfile.Gender.FEMALE else "آقا"
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"✓ [{status_str}] {gender_str}: {fn} {ln} ({phone}) - کلمه عبور: {DEFAULT_PASSWORD}"
                        )
                    )

                    if user_created or prof_created:
                        created_count += 1
                    else:
                        updated_count += 1

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"خطا در ثبت {fn} {ln} ({phone}): {e}"))
                skipped_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\nپایان عملیات: {created_count} جدید، {updated_count} به‌روزرسانی، {skipped_count} رد شده (تکراری یا دارای خطا)."
            )
        )
