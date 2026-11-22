from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class LocationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.locations'
    label = 'locations'
    verbose_name = _('موقعیت‌یابی و جستجوی اختصاصی قزوین')
