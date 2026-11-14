import os
import re
import string
from PIL import Image, ImageFile
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError

# Allow loading truncated images if slightly malformed
ImageFile.LOAD_TRUNCATED_IMAGES = True

# ASCII printable letters, digits, and standard punctuation: !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~
ALLOWED_ASCII_PUNCTUATION = string.punctuation
ALLOWED_PASSWORD_CHARACTERS = set(string.ascii_letters + string.digits + ALLOWED_ASCII_PUNCTUATION)
PUNCTUATION_REGEX = re.compile(r'[' + re.escape(ALLOWED_ASCII_PUNCTUATION) + r']')

ALLOWED_AVATAR_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.jfif', '.gif'}
MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def validate_avatar_file(file_obj):
    """
    اعتبارسنجی فایل تصویر پروفایل کاربر:
    ۱. بررسی پسوند مجاز (jpg, jpeg, png, webp, jfif, gif)
    ۲. بررسی سقف حجم فایل (حداکثر ۵ مگابایت)
    ۳. بررسی امضای باینری تصویر (Magic Numbers)
    ۴. جلوگیری از تزریق اسکریپت یا اسناد وب خطرناک (SVG/HTML)
    ۵. اعتبارسنجی فایل با کتابخانه Pillow جهت اطمینان از سلامت تصویر
    """
    if not file_obj:
        return file_obj

    raw_filename = getattr(file_obj, 'name', '') or ''
    if not raw_filename:
        return file_obj

    # 1. Clean path separators (handle Windows paths e.g. C:\fakepath\image.jpg or unix paths)
    filename = os.path.basename(raw_filename.replace('\\', '/'))
    if not filename or '..' in filename:
        raise DRFValidationError('نام فایل تصویر نامعتبر است و شامل کاراکترهای غیرمجاز می‌باشد.')

    # 2. Extension check
    _, ext = os.path.splitext(filename)
    ext = ext.lower()
    if ext not in ALLOWED_AVATAR_EXTENSIONS:
        raise DRFValidationError(f'فرمت تصویر نامعتبر است. فرمت‌های مجاز: {", ".join(sorted(ALLOWED_AVATAR_EXTENSIONS))}')

    # 3. File size check
    size = getattr(file_obj, 'size', None)
    if size and size > MAX_AVATAR_FILE_SIZE:
        raise DRFValidationError('حجم تصویر پروفایل نباید بیشتر از ۵ مگابایت باشد.')

    # 4. Binary header / Magic signature inspection
    try:
        file_obj.seek(0)
        header = file_obj.read(512)
        file_obj.seek(0)
    except Exception:
        raise DRFValidationError('امکان پردازش و خواندن فایل تصویر وجود ندارد.')

    if not header:
        raise DRFValidationError('فایل تصویر ارسالی خالی است.')

    # Check against SVG/HTML/script files disguised as raster images
    stripped_header = header.lstrip().lower()
    if stripped_header.startswith((b'<?xml', b'<svg', b'<html', b'<!doctype', b'<!--', b'<script', b'javascript:', b'data:image/svg')):
        raise DRFValidationError('بارگذاری فایل‌های حاوی کدهای اسکریپت یا وب (مانند SVG/HTML) به عنوان عکس پروفایل مجاز نیست.')

    is_valid_signature = False
    if header.startswith(b'\xff\xd8'):  # Standard JPEG SOI (0xFFD8)
        is_valid_signature = True
    elif header.startswith(b'\x89PNG\r\n\x1a\n'):  # PNG
        is_valid_signature = True
    elif header.startswith(b'RIFF') and b'WEBP' in header[:16]:  # WebP
        is_valid_signature = True
    elif header.startswith((b'GIF87a', b'GIF89a')):  # GIF
        is_valid_signature = True

    if not is_valid_signature:
        raise DRFValidationError('محتوای فایل ارسالی با فرمت تصویر اعلام‌شده مطابقت ندارد.')

    # 5. Pillow validation
    try:
        file_obj.seek(0)
        with Image.open(file_obj) as img:
            img.verify()
            if img.format not in ('JPEG', 'PNG', 'WEBP', 'GIF'):
                raise DRFValidationError('فرمت تصویر پردازش‌شده مجاز نمی‌باشد.')
        file_obj.seek(0)
    except DRFValidationError:
        raise
    except Exception:
        raise DRFValidationError('فایل ارسالی یک تصویر سالم و معتبر نیست.')

    return file_obj


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
