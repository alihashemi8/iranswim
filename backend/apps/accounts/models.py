from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _


class UserManager(BaseUserManager):
    """مدیریت کاربران سفارشی با شناسه تلفن همراه به عنوان فیلد اصلی ورود"""
    def create_user(self, phone, password=None, **extra_fields):
        if not phone:
            raise ValueError(_('شماره تلفن همراه الزامی است.'))
        phone = phone.strip()
        extra_fields.setdefault('is_active', True)
        user = self.model(phone=phone, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(phone, password, **extra_fields)


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', _('مدیر آموزشگاه')
        COACH = 'COACH', _('مربی')
        SWIMMER = 'SWIMMER', _('شناگر')
        SUPERVISOR = 'SUPERVISOR', _('ناظر فنی سامانه')

    username = models.CharField(_('نام کاربری'), max_length=150, unique=True, null=True, blank=True)
    phone = models.CharField(_('شماره همراه'), max_length=15, unique=True, db_index=True)
    national_id = models.CharField(_('کد ملی'), max_length=10, blank=True, null=True, db_index=True)
    role = models.CharField(_('نقش کاربری'), max_length=20, choices=Role.choices, default=Role.SWIMMER, db_index=True)
    avatar = models.ImageField(_('تصویر پروفایل'), upload_to='avatars/', null=True, blank=True)
    created_at = models.DateTimeField(_('تاریخ ایجاد'), auto_now_add=True)
    updated_at = models.DateTimeField(_('آخرین به‌روزرسانی'), auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        verbose_name = _('کاربر')
        verbose_name_plural = _('کاربران')
        ordering = ['-created_at']

    def __str__(self):
        full = f"{self.first_name} {self.last_name}".strip()
        return full if full else self.phone

    @property
    def full_name(self):
        full = f"{self.first_name} {self.last_name}".strip()
        return full if full else self.phone

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN or self.is_superuser

    @property
    def is_coach(self):
        return self.role == self.Role.COACH

    @property
    def is_swimmer(self):
        return self.role == self.Role.SWIMMER

    @property
    def is_supervisor(self):
        return self.role == self.Role.SUPERVISOR or self.is_superuser
