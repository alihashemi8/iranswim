import os
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.swimmers.models import SwimmerProfile


class Command(BaseCommand):
    help = 'بررسی، حسابرسی و گزارش‌گیری امن از وضعیت ذخیره‌سازی مدارک هویتی شناگران'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("در حال بررسی وضعیت ذخیره‌سازی مدارک هویتی شناگران..."))

        total_swimmers = SwimmerProfile.objects.count()
        total_documents_referenced = 0
        existing_on_disk = 0
        missing_on_disk = 0
        total_bytes = 0

        doc_fields = [
            'birth_certificate_image',
            'national_card_image',
            'sports_insurance_image'
        ]

        for swimmer in SwimmerProfile.objects.all():
            for field in doc_fields:
                file_field = getattr(swimmer, field, None)
                if file_field and file_field.name:
                    total_documents_referenced += 1
                    file_path = os.path.join(settings.MEDIA_ROOT, file_field.name)
                    if os.path.exists(file_path):
                        existing_on_disk += 1
                        try:
                            total_bytes += os.path.getsize(file_path)
                        except OSError:
                            pass
                    else:
                        missing_on_disk += 1

        mb_size = round(total_bytes / (1024 * 1024), 2)
        self.stdout.write(self.style.SUCCESS(f"تعداد کل پرونده‌های شناگران: {total_swimmers}"))
        self.stdout.write(self.style.SUCCESS(f"تعداد کل ارجاعات مدارک در دیتابیس: {total_documents_referenced}"))
        self.stdout.write(self.style.SUCCESS(f"فایل‌های فیزیکی موجود در دیسک: {existing_on_disk} ({mb_size} MB)"))
        if missing_on_disk > 0:
            self.stdout.write(self.style.WARNING(f"فایل‌های فاقد ذخیره فیزیکی: {missing_on_disk}"))
        else:
            self.stdout.write(self.style.SUCCESS("تمام فایل‌های ثبت‌شده در دیتابیس بر روی دیسک تأیید شدند."))

        self.stdout.write(self.style.SUCCESS("عملیات حسابرسی مدارک با موفقیت پایان یافت (حالت امن بدون تغییر فایل)."))
