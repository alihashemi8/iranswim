import io
import os
import uuid
import logging
from PIL import Image, ImageOps, UnidentifiedImageError
from PIL.Image import DecompressionBombError
from django.core.files.uploadedfile import InMemoryUploadedFile, UploadedFile
from rest_framework.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

logger = logging.getLogger(__name__)

# Security and Optimization Configuration
MAX_IMAGE_SIZE_BYTES = 12 * 1024 * 1024  # 12 MB max upload limit
MAX_IMAGE_DIMENSION = 6000  # 6000x6000 px max dimension limit
DECOMPRESSION_BOMB_MAX_PIXELS = 40_000_000  # 40 Megapixels threshold
ALLOWED_IMAGE_FORMATS = {'PNG', 'JPEG', 'JPG', 'WEBP', 'BMP', 'TIFF', 'GIF'}
TARGET_WEBP_QUALITY = 82
TARGET_WEBP_METHOD = 6

# Configure Pillow decompression bomb protection
Image.MAX_IMAGE_PIXELS = DECOMPRESSION_BOMB_MAX_PIXELS


def optimize_image_to_webp(
    file_obj,
    quality=TARGET_WEBP_QUALITY,
    method=TARGET_WEBP_METHOD,
    max_size_bytes=MAX_IMAGE_SIZE_BYTES,
    max_dimension=MAX_IMAGE_DIMENSION,
    field_name='image'
):
    """
    اعتبارسنجی عمیق امنیتی و تبدیل خودکار انواع تصاویر وبسایت به فرمت بهینه‌شده WebP.

    ویژگی‌ها و کنترل‌ها:
    - اعتبارسنجی بایت‌های واقعی فایل و عدم اعتماد به پسوند یا Content-Type
    - جلوگیری از حملات Decompression Bomb (Pixel Floods)
    - جلوگیری از پردازش فرمت‌های برداری (SVG) و اسکریپت‌ها یا باینری‌های مخرب
    - تبدیل تمامی فرمت‌های رستری رایج (PNG, JPG/JPEG, BMP, TIFF, GIF) به WebP
    - تنظیم کیفیت تبدیل روی ۸۲ و الگوریتم فشرده‌سازی بیشینه method=6 پیلو
    - حفظ شفافیت و کانال آلفا (RGBA / Transparency)
    - اصلاح و حفظ زاویه چرخش بر اساس اطلاعات EXIF Orientation
    - تولید نام فایل یکتا، تصادفی و امن با پسوند .webp
    - عدم تخریب فایل‌های قبلاً ذخیره‌شده (عدم پردازش مجدد فایل‌های متعهد)
    """
    if not file_obj:
        return None

    # اگر قبلاً در همین چرخه به WebP تبدیل و اعتبارسنجی شده، مستقیماً برگردانده شود
    if getattr(file_obj, '_is_optimized_webp', False):
        return file_obj

    # اگر فیلد مدل جنگو (FieldFile) است و قبلاً روی دیسک متعهد شده و تغییر نکرده باشد
    from django.db.models.fields.files import FieldFile
    if isinstance(file_obj, FieldFile) and getattr(file_obj, '_committed', False) and file_obj.name:
        return file_obj

    # خواندن بایت‌های خام فایل به منظور استقلال از هندل اصلی
    try:
        file_obj.seek(0)
    except Exception:
        pass

    raw_bytes = file_obj.read()
    try:
        file_obj.seek(0)
    except Exception:
        pass

    file_size = len(raw_bytes)
    if file_size == 0:
        raise ValidationError(_('فایل تصویر بارگذاری‌شده خالی است.'))
    if file_size > max_size_bytes:
        max_mb = max_size_bytes // (1024 * 1024)
        raise ValidationError(_(f'حجم تصویر بارگذاری‌شده فراتر از سقف مجاز ({max_mb} مگابایت) است.'))

    # گام ۱: اعتبارسنجی ساختار، هدر و فرمت تصویر
    format_stream = io.BytesIO(raw_bytes)
    try:
        raw_img = Image.open(format_stream)
        detected_format = (raw_img.format or '').upper()

        if detected_format not in ALLOWED_IMAGE_FORMATS:
            raise ValidationError(
                _(f'فرمت تصویر شناسایی‌شده ({detected_format or "نامعتبر"}) پشتیبانی نمی‌شود. فرمت‌های مجاز: PNG, JPG, WEBP, GIF, BMP, TIFF')
            )

        if raw_img.width * raw_img.height > DECOMPRESSION_BOMB_MAX_PIXELS:
            raise ValidationError(_('ابعاد تصویر بیش از حد مجاز امنیتی سیستم است.'))

        raw_img.verify()
    except (UnidentifiedImageError, SyntaxError):
        raise ValidationError(_('محتوای فایل ارسالی یک تصویر معتبر یا پشتیبانی‌شده نیست.'))
    except DecompressionBombError:
        raise ValidationError(_('تصویر به دلیل ریسک امنیتی پردازش نشد (Decompression Bomb).'))
    except ValidationError:
        raise
    except Exception as exc:
        logger.warning(f"Image verification failed: {exc}")
        raise ValidationError(_('فایل تصویر ارسالی مخدوش یا نامعتبر است.'))
    finally:
        try:
            format_stream.close()
        except Exception:
            pass

    # گام ۲: باز کردن مجدد با استریم اختصاصی و استخراج داده‌های پیکسلی
    load_stream = io.BytesIO(raw_bytes)
    try:
        img = Image.open(load_stream)
        img.load()
    except Exception:
        try:
            load_stream.close()
        except Exception:
            pass
        raise ValidationError(_('فایل تصویر مخدوش (corrupted) است و داده‌های آن خوانده نمی‌شوند.'))

    try:
        # کنترل سقف ابعاد تصویر
        if img.width > max_dimension or img.height > max_dimension:
            raise ValidationError(
                _(f'ابعاد تصویر ({img.width}x{img.height}) بیشتر از حد مجاز ({max_dimension}x{max_dimension} پیکسل) است.')
            )

        # اصلاح جهت‌گیری تصویر بر پایه متادیتای EXIF
        try:
            img = ImageOps.exif_transpose(img)
        except Exception as e:
            logger.debug(f"EXIF transpose skipped: {e}")

        # مدیریت کانال رنگ و حفظ شفافیت (Transparency / Alpha Channel)
        if img.mode in ('RGBA', 'LA'):
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
        elif img.mode == 'P':
            if 'transparency' in img.info:
                img = img.convert('RGBA')
            else:
                img = img.convert('RGB')
        elif img.mode == 'CMYK':
            img = img.convert('RGB')
        elif img.mode in ('RGB', 'L'):
            pass
        else:
            img = img.convert('RGBA' if 'A' in img.mode else 'RGB')

        # تبدیل و کدگذاری در قالب WebP با کیفیت ~82 و method=6
        output_io = io.BytesIO()
        try:
            img.save(
                output_io,
                format='WEBP',
                quality=quality,
                method=method,
            )
        except Exception as e:
            logger.error(f"Failed to encode image to WebP: {e}")
            raise ValidationError(_('خطای غیرمنتظره در پردازش و تبدیل تصویر به WebP.'))

        output_io.seek(0)
        converted_size = output_io.getbuffer().nbytes

        # تولید نام تصادفی و یکتا با پسوند .webp
        unique_filename = f"{uuid.uuid4().hex}.webp"

        converted_file = InMemoryUploadedFile(
            file=output_io,
            field_name=field_name,
            name=unique_filename,
            content_type='image/webp',
            size=converted_size,
            charset=None
        )
        converted_file._is_optimized_webp = True

        return converted_file
    finally:
        try:
            img.close()
        except Exception:
            pass
        try:
            load_stream.close()
        except Exception:
            pass


def cleanup_old_file_on_update(instance, field_name):
    """
    حذف فایل قبلی از فضای ذخیره‌سازی در صورت جایگزینی با تصویر جدید، جهت جلوگیری از تولید فایل‌های یتیم (Orphaned).
    """
    if not instance.pk:
        return

    try:
        current_field = getattr(instance, field_name, None)
        current_name = getattr(current_field, 'name', None)

        model_cls = type(instance)
        old_instance = model_cls.objects.filter(pk=instance.pk).only(field_name).first()
        if not old_instance:
            return

        old_field = getattr(old_instance, field_name, None)
        old_name = getattr(old_field, 'name', None)

        if old_name and old_name != current_name:
            if old_field and hasattr(old_field, 'close'):
                try:
                    old_field.close()
                except Exception:
                    pass
            storage = old_field.storage
            if storage.exists(old_name):
                storage.delete(old_name)
                logger.info(f"Deleted replaced old image file: {old_name}")
    except Exception as exc:
        logger.warning(f"Error while cleaning up old image {field_name}: {exc}")


def cleanup_file_on_delete(instance, field_name):
    """
    حذف فیزیکی فایل تصویر هنگام پاک شدن رکورد از دیتابیس.
    """
    try:
        field = getattr(instance, field_name, None)
        if field and hasattr(field, 'name') and field.name:
            if hasattr(field, 'close'):
                try:
                    field.close()
                except Exception:
                    pass
            storage = field.storage
            if storage.exists(field.name):
                storage.delete(field.name)
                logger.info(f"Deleted image file on record delete: {field.name}")
    except Exception as exc:
        logger.warning(f"Error while deleting image file for {field_name}: {exc}")
