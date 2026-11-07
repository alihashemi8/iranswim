import re
import string
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError

# ASCII printable letters, digits, and standard punctuation: !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~
ALLOWED_ASCII_PUNCTUATION = string.punctuation
ALLOWED_PASSWORD_CHARACTERS = set(string.ascii_letters + string.digits + ALLOWED_ASCII_PUNCTUATION)
PUNCTUATION_REGEX = re.compile(r'[' + re.escape(ALLOWED_ASCII_PUNCTUATION) + r']')


def check_password_rules(password):
    """
    بررسی معیارهای امنیتی رمز عبور طبق سیاست امنیت سامانه:
    ۱. حداقل ۸ نویسه
    ۲. فاقد فاصله (space)
    ۳. فقط کاراکترهای انگلیسی (حروف، اعداد و علائم خاص اسکی) - بدون حروف و اعداد فارسی
    ۴. حداقل یک حرف بزرگ انگلیسی (A-Z)
    ۵. حداقل یک حرف کوچک انگلیسی (a-z)
    ۶. حداقل یک عدد انگلیسی (0-9)
    ۷. حداقل یک علامت یا نشانه خاص (@, #, $, %, ...)
    """
    if not password:
        return ['رمز عبور نمی‌تواند خالی باشد']

    errors = []

    if len(password) < 8:
        errors.append('حداقل دارای ۸ کاراکتر باشد')

    if any(c.isspace() for c in password):
        errors.append('فاقد فاصله (space) باشد')

    # بررسی اینکه تمام کاراکترها در دامنه مجاز انگلیسی باشند
    non_english_chars = [c for c in password if c not in ALLOWED_PASSWORD_CHARACTERS and not c.isspace()]
    if non_english_chars:
        errors.append('فقط شامل حروف، اعداد و نشانه‌های انگلیسی باشد (حروف، اعداد فارسی یا کاراکترهای غیرلاتین مجاز نیست)')

    if not re.search(r'[A-Z]', password):
        errors.append('حداقل شامل یک حرف بزرگ انگلیسی (A-Z) باشد')

    if not re.search(r'[a-z]', password):
        errors.append('حداقل شامل یک حرف کوچک انگلیسی (a-z) باشد')

    if not re.search(r'[0-9]', password):
        errors.append('حداقل شامل یک عدد انگلیسی (0-9) باشد')

    if not PUNCTUATION_REGEX.search(password):
        errors.append('حداقل شامل یک علامت یا کاراکتر خاص (مانند @، #، $، % و ...) باشد')

    return errors


def validate_password_complexity(password):
    """
    اعتبارسنجی کلمه عبور برای سریالایزرها و ویوها.
    """
    errors = check_password_rules(password)
    if errors:
        msg = 'رمز عبور باید: ' + '، '.join(errors) + '.'
        raise DRFValidationError(msg)
    return password


class IranSwimPasswordValidator:
    """
    کلاس اعتبارسنج استاندارد جنگو جهت ثبت در AUTH_PASSWORD_VALIDATORS.
    """
    def validate(self, password, user=None):
        errors = check_password_rules(password)
        if errors:
            raise DjangoValidationError(
                'رمز عبور باید: ' + '، '.join(errors) + '.',
                code='password_complexity_failed'
            )

    def get_help_text(self):
        return (
            'رمز عبور باید حداقل ۸ کاراکتر بوده، فقط از نویسه‌های انگلیسی تشکیل شده و '
            'شامل حداقل یک حرف بزرگ انگلیسی، یک حرف کوچک انگلیسی، یک عدد و یک علامت خاص (@، # و ...) باشد.'
        )
