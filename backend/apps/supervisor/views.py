import time
from datetime import timedelta
from django.utils import timezone
from django.db import connection
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.accounts.permissions import IsSupervisorUserRole, IsAdminOrSupervisor
from .models import SystemErrorLog, AuditLog
from .serializers import SystemErrorLogSerializer, AuditLogSerializer
from apps.accounts.models import User
from apps.swimmers.models import SwimmerProfile
from apps.education.models import Course, SwimmerGroup
from apps.scheduling.models import ClassSession
from apps.finance.models import Payment


class SupervisorHealthCheckView(APIView):
    """
    سرویس پایش سلامت و وضعیت سامانه برای پنل ناظر:
    - بررسی سلامت و تاخیر دیتابیس PostgreSQL
    - شمارش تعداد خطاهای ۲۴ ساعت اخیر
    - آمار زنده از رکوردهای کلیدی سامانه
    """
    permission_classes = [IsSupervisorUserRole]

    def get(self, request):
        # Measure DB latency
        start_time = time.time()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            db_status = 'HEALTHY'
            db_latency_ms = round((time.time() - start_time) * 1000, 2)
        except Exception as e:
            db_status = f'UNHEALTHY: {str(e)}'
            db_latency_ms = -1

        # Calculate 24h error stats
        one_day_ago = timezone.now() - timedelta(hours=24)
        errors_24h_qs = SystemErrorLog.objects.filter(timestamp__gte=one_day_ago)
        total_errors_24h = errors_24h_qs.count()
        critical_errors_24h = errors_24h_qs.filter(level=SystemErrorLog.Level.CRITICAL).count()
        unresolved_errors = SystemErrorLog.objects.filter(is_resolved=False).count()

        # Operational metrics
        stats = {
            'total_users': User.objects.count(),
            'active_swimmers': SwimmerProfile.objects.filter(is_active=True).count(),
            'courses_count': Course.objects.count(),
            'active_groups': SwimmerGroup.objects.filter(status='OPEN').count(),
            'total_sessions': ClassSession.objects.count(),
            'successful_payments': Payment.objects.filter(status='SUCCESSFUL').count(),
        }

        return Response({
            'status': 'OPERATIONAL' if critical_errors_24h == 0 else 'DEGRADED',
            'server_time': timezone.now().isoformat(),
            'database': {
                'engine': connection.vendor,
                'status': db_status,
                'latency_ms': db_latency_ms,
            },
            'error_monitoring': {
                'total_errors_24h': total_errors_24h,
                'critical_errors_24h': critical_errors_24h,
                'unresolved_errors': unresolved_errors,
            },
            'system_stats': stats,
            'app_version': '1.0.0-production-ready'
        })


class SupervisorErrorListView(generics.ListAPIView):
    """لیست و جستجوی خطاهای ثبت‌شده با فیلتر سطح خطا، مسیر و وضعیت رفع"""
    serializer_class = SystemErrorLogSerializer
    permission_classes = [IsSupervisorUserRole]

    def get_queryset(self):
        qs = SystemErrorLog.objects.all().select_related('user', 'resolved_by')
        level = self.request.query_params.get('level')
        if level:
            qs = qs.filter(level=level)
        status_code = self.request.query_params.get('status_code')
        if status_code:
            qs = qs.filter(status_code=status_code)
        is_resolved = self.request.query_params.get('is_resolved')
        if is_resolved is not None:
            qs = qs.filter(is_resolved=(is_resolved.lower() == 'true'))
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(endpoint__icontains=search) | qs.filter(error_message__icontains=search) | qs.filter(exception_type__icontains=search)
        return qs.order_by('-timestamp')


class SupervisorErrorDetailView(generics.RetrieveAPIView):
    """مشاهده استک‌ترس کامل و جزئیات دقیق یک باگ/خطا"""
    queryset = SystemErrorLog.objects.all().select_related('user', 'resolved_by')
    serializer_class = SystemErrorLogSerializer
    permission_classes = [IsSupervisorUserRole]


class SupervisorResolveErrorView(APIView):
    """علامت‌گذاری یک خطا به عنوان بررسی و رفع‌شده همراه با ثبت توضیحات ناظر"""
    permission_classes = [IsSupervisorUserRole]

    def post(self, request, pk):
        try:
            error_log = SystemErrorLog.objects.get(pk=pk)
        except SystemErrorLog.DoesNotExist:
            return Response({'detail': 'خطای مورد نظر یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        is_resolved = request.data.get('is_resolved', True)
        note = request.data.get('resolution_note', '')

        error_log.is_resolved = is_resolved
        error_log.resolved_by = request.user
        error_log.resolved_at = timezone.now()
        error_log.resolution_note = note
        error_log.save()

        # Record audit log
        AuditLog.objects.create(
            actor=request.user,
            action=AuditLog.Action.CONFIG_CHANGE,
            entity_type='SystemErrorLog',
            entity_id=str(error_log.id),
            details={'is_resolved': is_resolved, 'note': note}
        )

        return Response(SystemErrorLogSerializer(error_log).data)


class SupervisorTestErrorTriggerView(APIView):
    """
    شبیه‌ساز خطا جهت آزمون سامانه ناظر:
    با فراخوانی این اندپوینت، یک خطای تستی عمدی ایجاد می‌شود تا ناظر مشاهده کند
    که خطای سرور بدون آسیب به کلاینت ثبت شده و در داشبورد خطاها قرار می‌گیرد.
    """
    permission_classes = [IsSupervisorUserRole]

    def post(self, request):
        mode = request.data.get('mode', 'division_by_zero')
        if mode == 'division_by_zero':
            # Intentionally trigger division by zero
            _ = 1 / 0
        elif mode == 'value_error':
            raise ValueError("خطای تستی مقدار نامعتبر جهت سنجش سیستم مانیتورینگ ناظر فنی IranSwim")
        else:
            raise RuntimeError("خطای تستی Runtime جهت آزمون پایگاه داده لاگ باگ‌های سامانه")
        return Response({'message': 'تست با موفقیت پایان یافت.'})


class SupervisorAuditLogListView(generics.ListAPIView):
    """لیست رخدادهای حساس و لاگ‌های حسابرسی سامانه"""
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminOrSupervisor]

    def get_queryset(self):
        qs = AuditLog.objects.all().select_related('actor')
        action = self.request.query_params.get('action')
        if action:
            qs = qs.filter(action=action)
        entity_type = self.request.query_params.get('entity_type')
        if entity_type:
            qs = qs.filter(entity_type=entity_type)
        return qs.order_by('-timestamp')
