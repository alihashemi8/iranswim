import os
import re
from rest_framework.exceptions import ValidationError

ALLOWED_DOCUMENT_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
MAX_DOCUMENT_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

DANGEROUS_PAYLOADS = [
    b'<svg', b'<?xml', b'<html', b'<!doctype', b'<script', b'javascript:', b'onload=', b'onerror='
]


def validate_document_file(file_obj):
    """
    اعتبارسنجی جامع فایل‌های مدارک هویتی شناگر:
    ۱. بررسی پسوند تصویری مجاز (مدل‌ها از ImageField استفاده می‌کنند)
    ۲. بررسی سقف حجم فایل (حداکثر ۱۰ مگابایت)
    ۳. بررسی امضای باینری تصویر (Magic Numbers)
    ۴. جلوگیری از تزریق اسکریپت و کدهای خطرناک SVG/HTML
    ۵. مسدودسازی کاراکترهای خطرناک و Path Traversal در نام فایل
    """
    if not file_obj:
        return file_obj

    filename = getattr(file_obj, 'name', '')
    if not filename:
        return file_obj

    # 1. Path traversal check in original filename
    if '..' in filename or '/' in filename or '\\' in filename:
        raise ValidationError('نام فایل نامعتبر است و شامل کاراکترهای غیرمجاز می‌باشد.')

    # 2. Extension check
    _, ext = os.path.splitext(filename)
    ext = ext.lower()
    if ext not in ALLOWED_DOCUMENT_EXTENSIONS:
        raise ValidationError(f'پسوند فایل نامعتبر است. پسوندهای مجاز: {", ".join(sorted(ALLOWED_DOCUMENT_EXTENSIONS))}')

    # 3. File size check
    size = getattr(file_obj, 'size', None)
    if size and size > MAX_DOCUMENT_FILE_SIZE:
        raise ValidationError('حجم فایل ارسالی بیش از سقف مجاز (۱۰ مگابایت) است.')

    # 4. Binary header / Magic signature inspection
    try:
        file_obj.seek(0)
        header = file_obj.read(512)
        file_obj.seek(0)
    except Exception:
        raise ValidationError('امکان پردازش و خواندن فایل ارسالی وجود ندارد.')

    if not header:
        raise ValidationError('فایل ارسالی خالی است.')

    lower_header = header.lower()
    for dangerous in DANGEROUS_PAYLOADS:
        if dangerous in lower_header:
            raise ValidationError('بارگذاری فایل‌های حاوی کدهای اسکریپت یا اسناد وب (مانند SVG/HTML) مجاز نیست.')

    # Magic signature verification
    is_valid_signature = False
    if header.startswith(b'\xff\xd8\xff'):  # JPEG
        is_valid_signature = True
    elif header.startswith(b'\x89PNG\r\n\x1a\n'):  # PNG
        is_valid_signature = True
    elif header.startswith(b'RIFF') and b'WEBP' in header[:16]:  # WebP
        is_valid_signature = True

    if not is_valid_signature:
        raise ValidationError('محتوای باینری فایل ارسالی با پسوند اعلام‌شده همخوانی ندارد یا فرمت آن پشتیبانی نمی‌شود.')

    return file_obj
