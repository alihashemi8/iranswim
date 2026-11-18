"""
IranSwim Technical Supervisor - AI Analysis Interface (DISABLED)
-----------------------------------------------------------------
این ماژول واسط معماری (Interface) برای سرویس‌های آینده هوش مصنوعی را فراهم می‌کند.
بر اساس الزامات امنیتی و سیاستی پروژه، این سرویس به صورت پیش‌فرض کاملاً غیرفعال است
و هیچ‌گونه فراخوانی خارجی به APIها نداشته و هزینه‌ای تولید نمی‌کند.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from django.conf import settings
from .models import SystemSetting


def is_ai_error_analysis_enabled() -> bool:
    """
    بررسی وضعیت پرچم فعال‌سازی تحلیل هوشمند خطاها:
    ابتدا تنظیمات Django و سپس رکورد Feature Flag در پایگاه داده بررسی می‌شود.
    در صورت عدم تنظیم صریح، همواره False برگردانده می‌شود.
    """
    # 1. Environment / Django Settings Flag
    if getattr(settings, 'AI_ERROR_ANALYSIS_ENABLED', False) is True:
        return True

    # 2. Dynamic System Setting Flag
    try:
        setting = SystemSetting.objects.filter(key='ai_error_analysis_enabled').first()
        if setting and isinstance(setting.value, dict):
            return bool(setting.value.get('enabled', False))
        elif setting and isinstance(setting.value, bool):
            return setting.value
    except Exception:
        pass

    return False


class BaseAIErrorAnalyzer(ABC):
    """واسط استاندارد برای پیاده‌سازی تحلیل‌گر هوشمند در آینده"""

    @abstractmethod
    def analyze_incident(self, error_group_id: int) -> Dict[str, Any]:
        """تحلیل خطای تجمیع‌شده و استخراج علل احتمالی"""
        pass

    @abstractmethod
    def suggest_remediation(self, error_group_id: int) -> Dict[str, Any]:
        """پیشنهاد راهکارهای فنی جهت رفع خطا"""
        pass


class DisabledAIErrorAnalyzer(BaseAIErrorAnalyzer):
    """
    پیاده‌سازی امن و بدون عملیات (No-Op) در زمان غیرفعال بودن هوش مصنوعی:
    هیچ درخواست خارجی ارسال نمی‌کند و داده شبیه‌سازی‌شده کذب تولید نمی‌نماید.
    """

    def analyze_incident(self, error_group_id: int) -> Dict[str, Any]:
        return {
            'enabled': False,
            'status': 'DISABLED',
            'message': 'سرویس تحلیل هوشمند خطا در حال حاضر غیرفعال است (AI_ERROR_ANALYSIS_ENABLED=False).',
            'analysis': None
        }

    def suggest_remediation(self, error_group_id: int) -> Dict[str, Any]:
        return {
            'enabled': False,
            'status': 'DISABLED',
            'message': 'پیشنهادات هوشمند غیرفعال است.',
            'suggestions': []
        }


def get_ai_error_analyzer() -> BaseAIErrorAnalyzer:
    """کارخانه بازگردانی تحلیل‌گر هوش مصنوعی"""
    if not is_ai_error_analysis_enabled():
        return DisabledAIErrorAnalyzer()

    # در آینده در صورت فعال‌سازی و عقد قرارداد با ارائه‌دهنده، کلاس ارائه‌دهنده برگردانده می‌شود.
    return DisabledAIErrorAnalyzer()
