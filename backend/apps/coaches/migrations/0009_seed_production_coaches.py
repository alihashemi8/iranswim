from django.db import migrations
from django.contrib.auth.hashers import make_password

COACHES_DATA = [
    # Female Coaches (بانوان - ۶ نفر)
    {'first_name': 'سارا', 'last_name': 'مینایی فر', 'phone': '09196617477', 'gender': 'FEMALE'},
    {'first_name': 'مائده', 'last_name': 'بخارایی', 'phone': '09100442163', 'gender': 'FEMALE'},
    {'first_name': 'زهرا', 'last_name': 'قلی پور', 'phone': '09102068863', 'gender': 'FEMALE'},
    {'first_name': 'مریم', 'last_name': 'نیک راه', 'phone': '09381079522', 'gender': 'FEMALE'},
    {'first_name': 'مریم', 'last_name': 'کاظمی', 'phone': '09128862320', 'gender': 'FEMALE'},
    {'first_name': 'فائزه سادات', 'last_name': 'موسوی', 'phone': '09921515695', 'gender': 'FEMALE'},
    # Male Coaches (آقایان - ۱۴ نفر)
    {'first_name': 'محسن', 'last_name': 'همدانی', 'phone': '09123825399', 'gender': 'MALE'},
    {'first_name': 'امیر', 'last_name': 'فرح بخش', 'phone': '09127053428', 'gender': 'MALE'},
    {'first_name': 'جواد', 'last_name': 'بابا حسین پور', 'phone': '09192878158', 'gender': 'MALE'},
    {'first_name': 'علیرضا', 'last_name': 'آدینه مهر', 'phone': '09365880119', 'gender': 'MALE'},
    {'first_name': 'کمیل', 'last_name': 'رحمانی', 'phone': '09127098140', 'gender': 'MALE'},
    {'first_name': 'محمد رضا', 'last_name': 'جباری', 'phone': '09191821523', 'gender': 'MALE'},
    {'first_name': 'عباس', 'last_name': 'توکلی', 'phone': '09198485526', 'gender': 'MALE'},
    {'first_name': 'علیرضا', 'last_name': 'رفیعی', 'phone': '09126815734', 'gender': 'MALE'},
    {'first_name': 'مهدی', 'last_name': 'خلخالی', 'phone': '09960144289', 'gender': 'MALE'},
    {'first_name': 'حسین', 'last_name': 'سجادی', 'phone': '09935759134', 'gender': 'MALE'},
    {'first_name': 'حسین', 'last_name': 'جمالی', 'phone': '09106143027', 'gender': 'MALE'},
    {'first_name': 'امیرمحمد', 'last_name': 'سلطانی کمال', 'phone': '09911942642', 'gender': 'MALE'},
    {'first_name': 'مهدی', 'last_name': 'خلیلی', 'phone': '09127838878', 'gender': 'MALE'},
    {'first_name': 'ابوالفضل', 'last_name': 'کیامیری', 'phone': '09120550613', 'gender': 'MALE'},
]


def add_coaches(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    CoachProfile = apps.get_model('coaches', 'CoachProfile')

    hashed_pwd = make_password('12345678')
    last_order = CoachProfile.objects.order_by('-display_order').values_list('display_order', flat=True).first() or 0

    for idx, item in enumerate(COACHES_DATA, start=1):
        user, _ = User.objects.get_or_create(
            phone=item['phone'],
            defaults={
                'first_name': item['first_name'],
                'last_name': item['last_name'],
                'role': 'COACH',
                'is_active': True,
                'is_password_changed': True,
                'password': hashed_pwd,
            }
        )
        user.first_name = item['first_name']
        user.last_name = item['last_name']
        user.role = 'COACH'
        user.is_active = True
        user.password = hashed_pwd
        user.save()

        profile, prof_created = CoachProfile.objects.get_or_create(
            user=user,
            defaults={
                'first_name': item['first_name'],
                'last_name': item['last_name'],
                'gender': item['gender'],
                'employment_status': 'ACTIVE',
                'show_on_landing': True,
                'display_order': last_order + idx,
            }
        )
        if not prof_created:
            profile.first_name = item['first_name']
            profile.last_name = item['last_name']
            profile.gender = item['gender']
            profile.employment_status = 'ACTIVE'
            profile.show_on_landing = True
            profile.save()


def remove_coaches(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('coaches', '0008_alter_coachprofile_retraining_status'),
        ('accounts', '0003_user_is_password_changed'),
    ]

    operations = [
        migrations.RunPython(add_coaches, reverse_code=remove_coaches),
    ]
