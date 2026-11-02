from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils import timezone


class NewsPost(models.Model):
    class Category(models.TextChoices):
        GENERAL = 'GENERAL', _('عمومی و اطلاعیه‌ها')
        COMPETITIONS = 'COMPETITIONS', _('مسابقات و رویدادها')
        CLASSES = 'CLASSES', _('دوره‌ها و کلاس‌ها')
        HEALTH = 'HEALTH', _('آموزش و بهداشت استخر')

    class Status(models.TextChoices):
        DRAFT = 'DRAFT', _('پیش‌نویس')
        PUBLISHED = 'PUBLISHED', _('منتشرشده')
        ARCHIVED = 'ARCHIVED', _('بایگانی‌شده')

    title = models.CharField(_('عنوان خبر'), max_length=200)
    slug = models.SlugField(_('نامک (Slug)'), max_length=220, unique=True, allow_unicode=True)
    body = models.TextField(_('متن کامل خبر'))
    summary = models.TextField(_('خلاصه خبر'), max_length=400, blank=True)
    image = models.ImageField(_('عکس پوستر خبر'), upload_to='news/', null=True, blank=True)
    category = models.CharField(_('دسته‌بندی'), max_length=20, choices=Category.choices, default=Category.GENERAL)
    status = models.CharField(_('وضعیت انتشار'), max_length=20, choices=Status.choices, default=Status.PUBLISHED, db_index=True)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, verbose_name=_('نویسنده'))
    publish_at = models.DateTimeField(_('زمان انتشار'), default=timezone.now, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('خبر و اطلاعیه عمومی')
        verbose_name_plural = _('اخبار آموزشگاه')
        ordering = ['-publish_at']

    def __str__(self):
        return self.title


class NewsImage(models.Model):
    """تصاویر مربوط به شرح اخبار و گالری خبر"""
    news_post = models.ForeignKey(
        NewsPost,
        on_delete=models.CASCADE,
        related_name='detail_images',
        verbose_name=_('خبر مرتبط')
    )
    image = models.ImageField(_('تصویر شرح خبر'), upload_to='news/details/')
    caption = models.CharField(_('توضیح تصویر'), max_length=250, blank=True)
    order = models.PositiveIntegerField(_('ترتیب'), default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('تصویر شرح خبر')
        verbose_name_plural = _('تصاویر شرح خبر')
        ordering = ['order', 'id']

    def __str__(self):
        return f"تصویر {self.id} برای {self.news_post.title}"


class SwimmingPool(models.Model):
    """اطلاعات و تصاویر استخرهای تحت قرارداد و برگزاری کلاس‌ها در قزوین"""
    name = models.CharField(_('نام استخر'), max_length=180)
    slug = models.SlugField(_('نامک (Slug)'), max_length=200, unique=True, allow_unicode=True, blank=True)
    poster_image = models.ImageField(_('عکس پوستر استخر'), upload_to='pools/posters/', null=True, blank=True)
    location = models.CharField(_('آدرس و لوکیشن استخر'), max_length=300)
    map_url = models.CharField(_('لینک نقشه یا نشان'), max_length=500, blank=True)
    description = models.TextField(_('توضیحات و مشخصات استخر'))
    facilities = models.CharField(_('امکانات استخر'), max_length=300, blank=True, default='سونا خشک و بخار، جکوزی، بوفه، پارکینگ، رختکن تمیز')
    dimensions = models.CharField(_('ابعاد استخر'), max_length=100, blank=True, default='۵۰ در ۲۵ متر')
    depth = models.CharField(_('عمق استخر'), max_length=100, blank=True, default='۱.۲۰ تا ۳.۸۰ متر')
    phone = models.CharField(_('شماره تماس هماهنگی'), max_length=25, blank=True)
    display_order = models.PositiveIntegerField(_('ترتیب نمایش'), default=0, db_index=True)
    is_active = models.BooleanField(_('نمایش در سایت'), default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('استخر و مجموعه ورزشی')
        verbose_name_plural = _('استخرها و مجموعه‌های ورزشی')
        ordering = ['display_order', '-id']

    def __str__(self):
        return self.name


class PoolImage(models.Model):
    """تصاویر بیشتر و جزئیات استخر جهت نمایش در مدال و گالری"""
    pool = models.ForeignKey(
        SwimmingPool,
        on_delete=models.CASCADE,
        related_name='gallery_images',
        verbose_name=_('استخر مرتبط')
    )
    image = models.ImageField(_('عکس استخر'), upload_to='pools/gallery/')
    caption = models.CharField(_('عنوان تصویر'), max_length=200, blank=True)
    order = models.PositiveIntegerField(_('ترتیب'), default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('تصویر استخر')
        verbose_name_plural = _('تصاویر استخر')
        ordering = ['order', 'id']

    def __str__(self):
        return f"عکس {self.id} برای استخر {self.pool.name}"


class Announcement(models.Model):
    class Audience(models.TextChoices):
        ALL = 'ALL', _('همه اعضا')
        SWIMMERS = 'SWIMMERS', _('فقط شناگران')
        COACHES = 'COACHES', _('فقط مربیان')
        GROUP = 'GROUP', _('اعضای یک گروه مشخص')

    title = models.CharField(_('عنوان اعلان'), max_length=180)
    message = models.TextField(_('متن اعلان'))
    audience = models.CharField(_('مخاطبان هدف'), max_length=20, choices=Audience.choices, default=Audience.ALL)
    target_group = models.ForeignKey(
        'education.SwimmerGroup',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='announcements',
        verbose_name=_('گروه هدف (در صورت انتخاب گروه)')
    )
    is_pinned = models.BooleanField(_('پین شده / مهم'), default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('اعلان درون‌برنامه‌ای')
        verbose_name_plural = _('اعلان‌های درون‌برنامه‌ای')
        ordering = ['-is_pinned', '-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_audience_display()})"


class Notification(models.Model):
    class Category(models.TextChoices):
        REGISTRATION = 'REGISTRATION', _('درخواست ثبت‌نام جدید')
        PAYMENT = 'PAYMENT', _('سررسید یا تأخیر پرداخت اقساط')
        SCHEDULE = 'SCHEDULE', _('تغییر یا لغو برنامه کلاس')
        ANNOUNCEMENT = 'ANNOUNCEMENT', _('اطلاعیه‌های مهم سیستم')

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
        verbose_name=_('کاربر گیرنده')
    )
    category = models.CharField(
        _('دسته‌بندی اعلان'),
        max_length=20,
        choices=Category.choices,
        default=Category.ANNOUNCEMENT,
        db_index=True
    )
    title = models.CharField(_('عنوان اعلان'), max_length=200)
    message = models.TextField(_('متن و توضیحات اعلان'))
    link = models.CharField(_('مسیر صفحه مرتبط در سامانه'), max_length=255, blank=True)
    is_read = models.BooleanField(_('خوانده‌شده'), default=False, db_index=True)
    created_at = models.DateTimeField(_('زمان ثبت'), auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = _('اعلان')
        verbose_name_plural = _('اعلان‌ها')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_category_display()})"


class SupportTicket(models.Model):
    class Category(models.TextChoices):
        REGISTRATION = 'REGISTRATION', _('ثبت‌نام و پذیرش')
        FINANCE = 'FINANCE', _('امور مالی و شهریه')
        SCHEDULE = 'SCHEDULE', _('برنامه کلاس و جابه‌جایی')
        DOCUMENTS = 'DOCUMENTS', _('مدارک و بیمه ورزشی')
        OTHER = 'OTHER', _('سایر موارد')

    class Status(models.TextChoices):
        SUBMITTED = 'SUBMITTED', _('ثبت‌شده')
        IN_PROGRESS = 'IN_PROGRESS', _('در حال بررسی')
        NEED_INFO = 'NEED_INFO', _('نیازمند اطلاعات بیشتر')
        ANSWERED = 'ANSWERED', _('پاسخ داده‌شده')
        CLOSED = 'CLOSED', _('بسته‌شده')

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='support_tickets',
        verbose_name=_('کاربر ارسال‌کننده')
    )
    swimmer = models.ForeignKey(
        'swimmers.SwimmerProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='support_tickets',
        verbose_name=_('شناگر مرتبط')
    )
    category = models.CharField(
        _('موضوع درخواست'),
        max_length=30,
        choices=Category.choices,
        default=Category.OTHER
    )
    subject = models.CharField(_('عنوان پیام'), max_length=200)
    description = models.TextField(_('شرح درخواست / مشکل'))
    attachment = models.FileField(_('فایل یا تصویر پیوست'), upload_to='tickets/', null=True, blank=True)
    status = models.CharField(
        _('وضعیت'),
        max_length=20,
        choices=Status.choices,
        default=Status.SUBMITTED,
        db_index=True
    )
    response = models.TextField(_('پاسخ آموزشگاه'), blank=True)
    responded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='responded_tickets',
        verbose_name=_('پاسخ‌دهنده')
    )
    responded_at = models.DateTimeField(_('زمان پاسخ'), null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('درخواست پشتیبانی')
        verbose_name_plural = _('تیکت‌های پشتیبانی')
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.get_status_display()}] {self.subject}"


class LandingSection(models.Model):
    """بخش‌های صفحه اصلی (لندینگ) و وضعیت فعال/غیرفعال بودن هر بخش برای مدیریت سایت"""
    key = models.CharField(_('شناسه انگلیسی بخش'), max_length=50, unique=True, db_index=True)
    title = models.CharField(_('عنوان بخش'), max_length=150)
    subtitle = models.CharField(_('زیرعنوان یا برچسب'), max_length=250, blank=True)
    description = models.TextField(_('توضیحات و محتوای بخش'), blank=True)
    is_enabled = models.BooleanField(_('وضعیت نمایش در لندینگ'), default=True, db_index=True)
    display_order = models.PositiveIntegerField(_('ترتیب نمایش'), default=0, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('بخش صفحه لندینگ')
        verbose_name_plural = _('بخش‌های صفحه لندینگ')
        ordering = ['display_order', 'id']

    def __str__(self):
        status_txt = "فعال" if self.is_enabled else "غیرفعال"
        return f"{self.title} ({self.key}) - {status_txt}"


