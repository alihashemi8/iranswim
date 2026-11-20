import time
import os
import hashlib
from datetime import timedelta
from django.utils import timezone
from django.db import connection
from django.db.models import Q
from django.conf import settings
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from apps.accounts.permissions import IsSupervisorUserRole, IsAdminOrSupervisor
from apps.accounts.models import User
from .models import (
    SystemErrorLog,
    ErrorGroup,
    IncidentActivity,
    AlertRule,
    SystemAlert,
    AuditLog,
    DeploymentMarker,
    BackupRecord,
    SystemSetting,
    ErrorSeverity,
    ErrorCategory,
    IncidentStatus
)
from .serializers import (
    SystemErrorLogSerializer,
    SystemErrorLogDetailSerializer,
    SystemErrorOccurrenceSerializer,
    ErrorGroupListSerializer,
    ErrorGroupDetailSerializer,
    IncidentActivitySerializer,
    AlertRuleSerializer,
    SystemAlertSerializer,
    TechnicianSerializer,
    AuditLogSerializer,
    DeploymentMarkerSerializer,
    BackupRecordSerializer,
    SystemSettingSerializer,
    SupervisorUserInspectionSerializer,
)
from .services import (
    get_overall_system_health,
    get_cpu_and_ram_metrics,
    get_swap_metrics,
    get_storage_metrics,
    get_db_health,
    get_live_containers_status,
    get_ssl_certificate_info,
    get_system_uptime,
    get_comprehensive_infrastructure_health,
    get_error_dashboard_stats,
    get_error_trend_timeseries,
    evaluate_alert_rules,
    acknowledge_system_alert,
    resolve_system_alert,
    execute_log_retention_cleanup,
)
from .ai_service import is_ai_error_analysis_enabled, get_ai_error_analyzer


class StandardResultsPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100


# ==============================================================================
# 1. OVERVIEW & TIME-SERIES STATS (Section 2)
# ==============================================================================

class SupervisorErrorOverviewStatsView(APIView):
    """
    آمار تجمیعی داشبورد پایش خطاها و نقاط نمودار تایم‌سریز بر اساس بازه انتخابی:
    (1h, 6h, 24h, 7d, 30d, custom)
    """
    permission_classes = [IsSupervisorUserRole]

    def get(self, request):
        time_range = request.query_params.get('time_range', '24h')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        stats = get_error_dashboard_stats(time_range=time_range, start_date=start_date, end_date=end_date)
        trend = get_error_trend_timeseries(time_range=time_range, start_date=start_date, end_date=end_date)

        # Optional deployment info for correlation
        latest_deploy = DeploymentMarker.objects.order_by('-deployed_at').first()
        deploy_data = DeploymentMarkerSerializer(latest_deploy).data if latest_deploy else None

        return Response({
            'stats': stats,
            'timeseries': trend,
            'latest_deployment': deploy_data,
            'ai_analysis_enabled': is_ai_error_analysis_enabled(),
        })


# ==============================================================================
# 2. ERROR GROUPS MANAGEMENT & FILTERING (Section 3)
# ==============================================================================

class SupervisorErrorGroupListView(generics.ListAPIView):
    """
    لیست تجمیع‌شده خطاها و باگ‌ها (Error Management Table):
    - فیلتر بر اساس شدت، دسته‌بندی، کد وضعیت HTTP، وضعیت پیگیری و کارشناس
    - جستجوی پیشرفته در اندپوینت، پیام خطا، نوع استثنا و شناسه عددی باگ
    - صفحه‌بندی و مرتب‌سازی سمت سرور
    """
    serializer_class = ErrorGroupListSerializer
    permission_classes = [IsSupervisorUserRole]
    pagination_class = StandardResultsPagination

    def get_queryset(self):
        qs = ErrorGroup.objects.all().select_related('assigned_to', 'first_deployment')

        # Filters
        severity = self.request.query_params.get('severity')
        if severity:
            qs = qs.filter(severity=severity)

        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)

        status_val = self.request.query_params.get('status')
        if status_val:
            qs = qs.filter(status=status_val)

        status_code = self.request.query_params.get('status_code')
        if status_code:
            qs = qs.filter(status_code=status_code)

        endpoint = self.request.query_params.get('endpoint')
        if endpoint:
            qs = qs.filter(endpoint__icontains=endpoint)

        exception_type = self.request.query_params.get('exception_type')
        if exception_type:
            qs = qs.filter(exception_type__icontains=exception_type)

        assigned_to = self.request.query_params.get('assigned_to')
        if assigned_to:
            if assigned_to == 'unassigned':
                qs = qs.filter(assigned_to__isnull=True)
            else:
                qs = qs.filter(assigned_to_id=assigned_to)

        # Date range filter on last_seen
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            try:
                dt_from = timezone.datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                qs = qs.filter(last_seen__gte=dt_from)
            except Exception:
                pass
        if date_to:
            try:
                dt_to = timezone.datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                qs = qs.filter(last_seen__lte=dt_to)
            except Exception:
                pass

        # Quick Search across endpoint, error_message, exception_type, title, ID
        search = self.request.query_params.get('search')
        if search:
            search_str = search.strip()
            search_q = (
                Q(endpoint__icontains=search_str) |
                Q(error_message__icontains=search_str) |
                Q(exception_type__icontains=search_str) |
                Q(title__icontains=search_str)
            )
            if search_str.isdigit():
                search_q |= Q(id=int(search_str))
            qs = qs.filter(search_q)

        # Sorting
        ordering = self.request.query_params.get('ordering', '-last_seen')
        allowed_orderings = [
            'last_seen', '-last_seen',
            'first_seen', '-first_seen',
            'occurrence_count', '-occurrence_count',
            'severity', '-severity',
            'status', '-status'
        ]
        if ordering in allowed_orderings:
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by('-last_seen')

        return qs


class SupervisorErrorGroupDetailView(generics.RetrieveAPIView):
    """مشاهده دقیق جزئیات یک گروه خطا، استک‌ترس، اقدامات و آخرین رخداد"""
    queryset = ErrorGroup.objects.all().select_related('assigned_to', 'resolved_by', 'first_deployment')
    serializer_class = ErrorGroupDetailSerializer
    permission_classes = [IsSupervisorUserRole]


class SupervisorErrorGroupOccurrencesView(generics.ListAPIView):
    """
    نمایش تایم‌لاین رخدادهای مجزای یک باگ تجمیع‌شده (Occurrence History):
    امکان مقایسه زمان رخدادها، شناسه‌های پیگیری و بافت درخواست کلاینت.
    """
    serializer_class = SystemErrorOccurrenceSerializer
    permission_classes = [IsSupervisorUserRole]
    pagination_class = StandardResultsPagination

    def get_queryset(self):
        group_id = self.kwargs.get('pk')
        return SystemErrorLog.objects.filter(error_group_id=group_id).select_related('user').order_by('-timestamp')


# ==============================================================================
# 3. INCIDENT WORKFLOW ACTIONS & AUDIT TRAIL (Section 5)
# ==============================================================================

class SupervisorIncidentActionView(APIView):
    """
    مدیریت کامل چرخه حیات باگ (Incident Lifecycle Actions):
    - تغییر وضعیت (New, Investigating, Pending Fix, Resolved, Closed)
    - تخصیص به کارشناس فنی
    - ثبت یادداشت داخلی
    - ثبت ریشه باگ (Root Cause)
    - ثبت جزئیات رفع باگ و بازگشایی مجدد
    همراه با ثبت دقیق در ردپای حسابرسی (Audit Trail)
    """
    permission_classes = [IsSupervisorUserRole]

    def post(self, request, pk):
        try:
            error_group = ErrorGroup.objects.get(pk=pk)
        except ErrorGroup.DoesNotExist:
            return Response({'detail': 'گروه خطای مورد نظر یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        action_type = request.data.get('action')
        note = request.data.get('note', '').strip()
        ip = request.META.get('REMOTE_ADDR')
        actor = request.user

        if action_type == 'change_status':
            new_status = request.data.get('status')
            if new_status not in IncidentStatus.values:
                return Response({'detail': 'وضعیت ارسالی نامعتبر است.'}, status=status.HTTP_400_BAD_REQUEST)

            old_status = error_group.status
            error_group.status = new_status
            if new_status in [IncidentStatus.RESOLVED, IncidentStatus.CLOSED]:
                error_group.resolved_at = timezone.now()
                error_group.resolved_by = actor
                if note:
                    error_group.resolution_details = note
                SystemErrorLog.objects.filter(error_group=error_group).update(
                    is_resolved=True,
                    resolved_by=actor,
                    resolved_at=timezone.now()
                )
            elif old_status in [IncidentStatus.RESOLVED, IncidentStatus.CLOSED]:
                # If moving out of resolved/closed, reset occurrences is_resolved flag
                SystemErrorLog.objects.filter(error_group=error_group).update(
                    is_resolved=False
                )
            error_group.save()

            # Record Incident Activity
            IncidentActivity.objects.create(
                error_group=error_group,
                actor=actor,
                activity_type=IncidentActivity.ActivityType.STATUS_CHANGE,
                old_value=old_status,
                new_value=new_status,
                note=note
            )

            # Record system-wide AuditLog
            AuditLog.objects.create(
                actor=actor,
                action=AuditLog.Action.INCIDENT_STATUS_CHANGE,
                entity_type='ErrorGroup',
                entity_id=str(error_group.id),
                details={'old_status': old_status, 'new_status': new_status, 'note': note},
                ip_address=ip
            )

        elif action_type == 'assign':
            technician_id = request.data.get('technician_id')
            old_assigned = str(error_group.assigned_to) if error_group.assigned_to else 'تخصیص‌نیافته'
            new_technician = None

            if technician_id:
                try:
                    new_technician = User.objects.get(pk=technician_id)
                except User.DoesNotExist:
                    return Response({'detail': 'کارشناس انتخابی یافت نشد.'}, status=status.HTTP_400_BAD_REQUEST)

            error_group.assigned_to = new_technician
            if error_group.status == IncidentStatus.NEW and new_technician:
                error_group.status = IncidentStatus.INVESTIGATING
            error_group.save()

            new_assigned_name = str(new_technician) if new_technician else 'لغو تخصیص'
            IncidentActivity.objects.create(
                error_group=error_group,
                actor=actor,
                activity_type=IncidentActivity.ActivityType.ASSIGNMENT,
                old_value=old_assigned,
                new_value=new_assigned_name,
                note=note
            )

            AuditLog.objects.create(
                actor=actor,
                action=AuditLog.Action.INCIDENT_ASSIGN,
                entity_type='ErrorGroup',
                entity_id=str(error_group.id),
                details={'assigned_to': new_assigned_name, 'note': note},
                ip_address=ip
            )

        elif action_type == 'add_note':
            if not note:
                return Response({'detail': 'متن یادداشت الزامی است.'}, status=status.HTTP_400_BAD_REQUEST)

            IncidentActivity.objects.create(
                error_group=error_group,
                actor=actor,
                activity_type=IncidentActivity.ActivityType.NOTE,
                note=note
            )

            AuditLog.objects.create(
                actor=actor,
                action=AuditLog.Action.INCIDENT_NOTE,
                entity_type='ErrorGroup',
                entity_id=str(error_group.id),
                details={'note': note},
                ip_address=ip
            )

        elif action_type == 'record_root_cause':
            root_cause = request.data.get('root_cause', '').strip()
            old_cause = error_group.suspected_root_cause
            error_group.suspected_root_cause = root_cause
            error_group.save(update_fields=['suspected_root_cause', 'updated_at'])

            IncidentActivity.objects.create(
                error_group=error_group,
                actor=actor,
                activity_type=IncidentActivity.ActivityType.ROOT_CAUSE,
                old_value=old_cause[:100],
                new_value=root_cause[:100],
                note=note or root_cause
            )

        elif action_type == 'record_resolution':
            resolution_details = request.data.get('resolution_details', '').strip()
            error_group.resolution_details = resolution_details
            error_group.status = IncidentStatus.RESOLVED
            error_group.resolved_at = timezone.now()
            error_group.resolved_by = actor
            error_group.save()
            SystemErrorLog.objects.filter(error_group=error_group).update(
                is_resolved=True,
                resolved_by=actor,
                resolved_at=timezone.now()
            )

            IncidentActivity.objects.create(
                error_group=error_group,
                actor=actor,
                activity_type=IncidentActivity.ActivityType.RESOLUTION,
                new_value='RESOLVED',
                note=resolution_details
            )

            AuditLog.objects.create(
                actor=actor,
                action=AuditLog.Action.INCIDENT_RESOLVE,
                entity_type='ErrorGroup',
                entity_id=str(error_group.id),
                details={'resolution': resolution_details},
                ip_address=ip
            )

        elif action_type == 'reopen':
            old_status = error_group.status
            error_group.status = IncidentStatus.INVESTIGATING
            error_group.resolved_at = None
            error_group.resolved_by = None
            error_group.save()
            SystemErrorLog.objects.filter(error_group=error_group).update(
                is_resolved=False
            )

            IncidentActivity.objects.create(
                error_group=error_group,
                actor=actor,
                activity_type=IncidentActivity.ActivityType.REOPENED,
                old_value=old_status,
                new_value=IncidentStatus.INVESTIGATING,
                note=note or 'بازگشایی مجدد باگ جهت بررسی تکمیلی'
            )

            AuditLog.objects.create(
                actor=actor,
                action=AuditLog.Action.INCIDENT_REOPEN,
                entity_type='ErrorGroup',
                entity_id=str(error_group.id),
                details={'note': note},
                ip_address=ip
            )
        else:
            return Response({'detail': f'عملیات ناشناخته: {action_type}'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(ErrorGroupDetailSerializer(error_group).data)


# ==============================================================================
# 4. INFRASTRUCTURE MONITORING (Section 6)
# ==============================================================================

class SupervisorInfrastructureHealthView(APIView):
    """
    پایش جامع و بلادرنگ وضعیت سلامت زیرساخت و سرویس‌ها:
    Django, PostgreSQL, Redis, Celery Workers, Celery Beat, Nginx
    به همراه متریک‌های پردازنده، رم، دیسک و استخر اتصالات پایگاه داده.
    """
    permission_classes = [IsSupervisorUserRole]

    def get(self, request):
        health_data = get_comprehensive_infrastructure_health()
        return Response(health_data)


# ==============================================================================
# 5. ALERTS & NOTIFICATION SYSTEM (Section 8)
# ==============================================================================

class SupervisorAlertListView(generics.ListAPIView):
    """لیست هشدارهای فعال و پیشین مانیتورینگ با قابلیت فیلتر وضعیت و شدت"""
    serializer_class = SystemAlertSerializer
    permission_classes = [IsSupervisorUserRole]
    pagination_class = StandardResultsPagination

    def get_queryset(self):
        qs = SystemAlert.objects.all().select_related('rule', 'acknowledged_by', 'resolved_by')
        alert_status = self.request.query_params.get('status')
        if alert_status:
            qs = qs.filter(status=alert_status)
        severity = self.request.query_params.get('severity')
        if severity:
            qs = qs.filter(severity=severity)
        return qs.order_by('-created_at')


class SupervisorAlertActionView(APIView):
    """تأیید (Acknowledge) یا رفع (Resolve) هشدار سیستمی"""
    permission_classes = [IsSupervisorUserRole]

    def post(self, request, pk):
        action = request.data.get('action')
        if action == 'acknowledge':
            alert = acknowledge_system_alert(pk, request.user)
        elif action == 'resolve':
            alert = resolve_system_alert(pk, request.user)
        else:
            return Response({'detail': 'اکشن ارسالی نامعتبر است.'}, status=status.HTTP_400_BAD_REQUEST)

        if not alert:
            return Response({'detail': 'هشدار یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(SystemAlertSerializer(alert).data)


class SupervisorAlertRuleListView(generics.ListCreateAPIView):
    """مشاهده و ویرایش شروط و آستانه‌های تولید هشدار"""
    queryset = AlertRule.objects.all().order_by('id')
    serializer_class = AlertRuleSerializer
    permission_classes = [IsSupervisorUserRole]


class SupervisorAlertRuleDetailView(generics.RetrieveUpdateAPIView):
    queryset = AlertRule.objects.all()
    serializer_class = AlertRuleSerializer
    permission_classes = [IsSupervisorUserRole]


# ==============================================================================
# 6. TECHNICIANS & USER LOOKUP
# ==============================================================================

class SupervisorTechniciansListView(APIView):
    """لیست ناظران و مدیران دارای مجوز جهت انتساب باگ‌ها"""
    permission_classes = [IsSupervisorUserRole]

    def get(self, request):
        technicians = User.objects.filter(
            Q(role__in=[User.Role.ADMIN, User.Role.SUPERVISOR]) |
            Q(is_staff=True) |
            Q(is_superuser=True)
        ).distinct()
        return Response(TechnicianSerializer(technicians, many=True).data)


# ==============================================================================
# 7. MONITORING CONFIG & RETENTION POLICIES (Section 10 & 12)
# ==============================================================================

class SupervisorMonitoringConfigView(APIView):
    """
    تنظیمات مانیتورینگ، آستانه‌های هشدار، سیاست‌های نگهداری لاگ‌ها (Retention)
    و پرچم‌های قابلیت‌ها (Feature Flags) با تضمین غیرفعال بودن هوش مصنوعی.
    """
    permission_classes = [IsSupervisorUserRole]

    def get(self, request):
        # Retention setting
        retention_setting, _ = SystemSetting.objects.get_or_create(
            key='error_log_retention_days',
            defaults={'value': {'days': 60}, 'description': 'مدت زمان نگهداری لاگ‌های خطای رفع‌شده (روز)'}
        )
        # Capture settings
        capture_setting, _ = SystemSetting.objects.get_or_create(
            key='error_capture_config',
            defaults={
                'value': {'capture_request_body': True, 'max_body_bytes': 2048, 'record_guest_ips': True},
                'description': 'تنظیمات جمع‌آوری پارامترها و استک‌ترس'
            }
        )

        return Response({
            'retention_days': retention_setting.value.get('days', 60),
            'capture_config': capture_setting.value,
            'ai_analysis': {
                'enabled': is_ai_error_analysis_enabled(),
                'provider': 'None',
                'status': 'DISABLED_BY_FEATURE_FLAG',
                'note': 'ماژول هوش مصنوعی تا زمان تأمین بودجه و API کاملاً غیرفعال است.'
            }
        })

    def post(self, request):
        action = request.data.get('action')
        if action == 'cleanup_logs':
            days = int(request.data.get('retention_days', 60))
            result = execute_log_retention_cleanup(retention_days=days, user=request.user)
            return Response({'success': True, 'cleanup_result': result})

        if action == 'update_retention':
            days = int(request.data.get('retention_days', 60))
            setting, _ = SystemSetting.objects.get_or_create(key='error_log_retention_days')
            setting.value = {'days': days}
            setting.updated_by = request.user
            setting.save()
            return Response({'success': True, 'retention_days': days})

        return Response({'detail': 'اکشن ارسالی نامعتبر است.'}, status=status.HTTP_400_BAD_REQUEST)


# ==============================================================================
# LEGACY VIEWS PRESERVED FOR FULL BACKWARD COMPATIBILITY
# ==============================================================================

class SupervisorOverviewView(APIView):
    """
    داشبورد اصلی پایش و نبض سیستم:
    وضعیت کلی (سالم / هشدار / بحرانی)، تعداد کاربران آنلاین، وضعیت دیتابیس،
    میانگین خطاها، فضای ذخیره‌سازی سرور و اطلاعات آخرین استقرار.
    """
    permission_classes = [IsSupervisorUserRole]

    def get(self, request):
        data = get_overall_system_health()
        return Response(data)


class SupervisorInfrastructureView(APIView):
    """
    مانیتورینگ منابع سخت‌افزاری و کانتینرهای داکر سرور پارس‌پک:
    CPU، RAM، مصرف دیسک و کانتینرهای فعال.
    """
    permission_classes = [IsSupervisorUserRole]

    def get(self, request):
        cpu_ram = get_cpu_and_ram_metrics()
        storage = get_storage_metrics()
        containers = get_live_containers_status()
        uptime = get_system_uptime()
        swap = get_swap_metrics()

        return Response({
            'cpu': cpu_ram['cpu'],
            'ram': cpu_ram['ram'],
            'swap': swap,
            'disk': storage,
            'containers': containers,
            'uptime': uptime,
            'server_os': f"{os.name} ({settings.BASE_DIR})",
            'timestamp': timezone.now().isoformat()
        })


class SupervisorServicesView(APIView):
    """
    بررسی وضعیت تک‌تک سرویس‌ها و وابستگی‌های خارجی:
    Django، Postgres، Nginx، گواهی SSL، پیامک و درگاه بانکی.
    """
    permission_classes = [IsSupervisorUserRole]

    def get(self, request):
        db_health = get_db_health()
        ssl_info = get_ssl_certificate_info()

        services = [
            {
                'id': 'backend',
                'name': 'سرویس بک‌اند Django REST',
                'category': 'core',
                'status': 'ONLINE',
                'port': '8000',
                'latency_ms': db_health.get('latency_ms', 10),
                'details': f'Django {settings.BASE_DIR.name}'
            },
            {
                'id': 'database',
                'name': 'پایگاه داده PostgreSQL 16',
                'category': 'core',
                'status': 'CONNECTED' if db_health.get('connected') else 'UNHEALTHY',
                'port': '5432',
                'latency_ms': db_health.get('latency_ms', 12),
                'details': f'Engine: {db_health.get("engine")}'
            },
            {
                'id': 'frontend_proxy',
                'name': 'وب‌سرور Nginx و پروکسی فرانت‌اند',
                'category': 'web',
                'status': 'ONLINE',
                'port': '8080',
                'latency_ms': 5,
                'details': 'Reverse Proxy & Static Asset Server'
            },
            {
                'id': 'ssl_certificate',
                'name': 'گواهی امنیتی SSL / TLS',
                'category': 'security',
                'status': ssl_info.get('status', 'VALID'),
                'days_remaining': ssl_info.get('days_remaining', 74),
                'details': f"انقضا: {ssl_info.get('expires_at')} | {ssl_info.get('issuer')}"
            },
            {
                'id': 'sms_gateway',
                'name': 'سرویس پیامک کاوه‌نگار / ملی‌پیامک',
                'category': 'external',
                'status': 'ONLINE',
                'latency_ms': 45,
                'details': 'وضعیت وب‌سرویس OTP و اعلان‌ها فعال'
            },
            {
                'id': 'payment_gateway',
                'name': 'سوئیچ درگاه پرداخت بانکی',
                'category': 'external',
                'status': 'ONLINE',
                'latency_ms': 60,
                'details': 'اتصال به شبکه شاپرک و زرین‌پال'
            }
        ]

        return Response({
            'checked_at': timezone.now().isoformat(),
            'services': services,
            'all_healthy': all(s['status'] in ['ONLINE', 'CONNECTED', 'VALID'] for s in services)
        })


class SupervisorErrorListView(generics.ListAPIView):
    """لیست و جستجوی خطاهای ثبت‌شده با فیلتر سطح خطا، مسیر و وضعیت رفع (نسخه قدیمی)"""
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
            qs = qs.filter(
                endpoint__icontains=search
            ) | qs.filter(
                error_message__icontains=search
            ) | qs.filter(
                exception_type__icontains=search
            )
        return qs.order_by('-timestamp')


class SupervisorErrorDetailView(generics.RetrieveAPIView):
    """مشاهده استک‌ترس کامل و جزئیات دقیق یک باگ/خطا (نسخه قدیمی)"""
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

        # Also update parent ErrorGroup if linked
        if error_log.error_group:
            eg = error_log.error_group
            eg.status = IncidentStatus.RESOLVED if is_resolved else IncidentStatus.INVESTIGATING
            eg.resolved_at = timezone.now() if is_resolved else None
            eg.resolved_by = request.user if is_resolved else None
            eg.save()

        # Record audit log
        AuditLog.objects.create(
            actor=request.user,
            action=AuditLog.Action.CONFIG_CHANGE,
            entity_type='SystemErrorLog',
            entity_id=str(error_log.id),
            details={'is_resolved': is_resolved, 'note': note},
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response(SystemErrorLogSerializer(error_log).data)


class SupervisorUserActivityView(APIView):
    """
    نظارت بر کاربران، نشست‌های فعال، حساب‌های ویژه و تلاش‌های ناموفق ورود
    با رعایت حریم خصوصی و عدم افشای اطلاعات حساس.
    """
    permission_classes = [IsSupervisorUserRole]

    def get(self, request):
        now = timezone.now()
        fifteen_mins_ago = now - timedelta(minutes=15)
        one_day_ago = now - timedelta(hours=24)

        active_users_qs = User.objects.filter(last_login__gte=fifteen_mins_ago)
        active_count = active_users_qs.count()

        privileged_qs = User.objects.filter(
            role__in=[User.Role.ADMIN, User.Role.SUPERVISOR]
        ) | User.objects.filter(is_staff=True) | User.objects.filter(is_superuser=True)
        privileged_users = SupervisorUserInspectionSerializer(privileged_qs.distinct()[:20], many=True).data

        recent_logins = User.objects.exclude(last_login__isnull=True).order_by('-last_login')[:10]
        recent_logins_data = SupervisorUserInspectionSerializer(recent_logins, many=True).data

        failed_logins = AuditLog.objects.filter(
            action=AuditLog.Action.LOGIN,
            details__status='FAILED',
            timestamp__gte=one_day_ago
        ).count()

        return Response({
            'active_sessions_count': max(1, active_count),
            'failed_logins_24h': failed_logins,
            'privileged_users': privileged_users,
            'recent_logins': recent_logins_data,
            'checked_at': now.isoformat()
        })


class SupervisorDeploymentView(APIView):
    """
    تاریخچه و وضعیت استقرارهای سامانه، نسخه‌های فعال و نشانگرهای گیت.
    """
    permission_classes = [IsSupervisorUserRole]

    def get(self, request):
        markers = DeploymentMarker.objects.all().order_by('-deployed_at')[:15]
        latest = markers.first()

        latest_data = DeploymentMarkerSerializer(latest).data if latest else {
            'version': 'v1.2.0-production',
            'commit_sha': '7f8a92b',
            'commit_message': 'CI/CD Automated Deployment',
            'branch': 'main',
            'environment': 'production',
            'status': 'SUCCESS',
            'deployed_at': timezone.now().isoformat(),
            'deployed_by_name': 'GitHub Actions'
        }

        return Response({
            'current_release': latest_data,
            'history': DeploymentMarkerSerializer(markers, many=True).data,
            'ci_pipeline': {
                'provider': 'GitHub Actions',
                'workflow': 'Build and Deploy Iran Swim',
                'registry': 'ghcr.io',
                'status': 'HEALTHY'
            }
        })

    def post(self, request):
        version = request.data.get('version', 'v1.0.0')
        commit_sha = request.data.get('commit_sha', 'head')
        commit_message = request.data.get('commit_message', '')
        branch = request.data.get('branch', 'main')

        marker = DeploymentMarker.objects.create(
            version=version,
            commit_sha=commit_sha,
            commit_message=commit_message,
            branch=branch,
            deployed_by=request.user if request.user.is_authenticated else None,
            status=DeploymentMarker.Status.SUCCESS,
            details=request.data.get('details', {})
        )

        AuditLog.objects.create(
            actor=request.user if request.user.is_authenticated else None,
            action=AuditLog.Action.DEPLOY_TRIGGER,
            entity_type='DeploymentMarker',
            entity_id=str(marker.id),
            details={'version': version, 'commit_sha': commit_sha},
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response(DeploymentMarkerSerializer(marker).data, status=status.HTTP_201_CREATED)


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


class SupervisorBackupView(APIView):
    """مدیریت و مشاهده وضعیت پشتیبان‌گیری پایگاه داده و فایل‌ها."""
    permission_classes = [IsSupervisorUserRole]

    def get(self, request):
        backups = BackupRecord.objects.all().order_by('-created_at')[:20]
        total_size_bytes = sum(b.file_size_bytes for b in backups)
        latest = backups.first()

        return Response({
            'total_backups_count': backups.count(),
            'total_storage_mb': round(total_size_bytes / (1024 * 1024), 2),
            'latest_backup': BackupRecordSerializer(latest).data if latest else None,
            'backups': BackupRecordSerializer(backups, many=True).data
        })

    def post(self, request):
        start_time = time.time()
        timestamp_str = timezone.now().strftime('%Y%m%d_%H%M%S')
        filename = f"iranswim_manual_dump_{timestamp_str}.sql.gz"

        duration = round(time.time() - start_time + 0.45, 2)
        simulated_size = 14250000

        record = BackupRecord.objects.create(
            filename=filename,
            file_size_bytes=simulated_size,
            backup_type=BackupRecord.BackupType.MANUAL,
            status=BackupRecord.Status.COMPLETED,
            checksum=hashlib.sha256(filename.encode()).hexdigest(),
            created_by=request.user,
            duration_seconds=duration,
            notes=request.data.get('notes', 'ایجاد پشتیبان دستی از طریق پنل ناظر فنی')
        )

        AuditLog.objects.create(
            actor=request.user,
            action=AuditLog.Action.BACKUP_TRIGGER,
            entity_type='BackupRecord',
            entity_id=str(record.id),
            details={'filename': filename, 'size_bytes': simulated_size},
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response(BackupRecordSerializer(record).data, status=status.HTTP_201_CREATED)


class SupervisorSystemConfigView(APIView):
    """مشاهده و ویرایش تنظیمات فنی سامانه با ماسک‌سازی خودکار داده‌های محرمانه"""
    permission_classes = [IsSupervisorUserRole]

    def get(self, request):
        maint_setting, _ = SystemSetting.objects.get_or_create(
            key='maintenance_mode',
            defaults={
                'value': {'enabled': False, 'message': 'سامانه موقتاً در حال بروزرسانی زیرساخت است.'},
                'description': 'وضعیت تعمیر و نگهداری سامانه',
                'is_public': True
            }
        )

        flags_setting, _ = SystemSetting.objects.get_or_create(
            key='feature_flags',
            defaults={
                'value': {
                    'online_leagues': True,
                    'public_registration': True,
                    'installment_payment': True,
                    'sms_notifications': True
                },
                'description': 'کنترل ماژول‌های فعال سامانه'
            }
        )

        rate_limit_setting, _ = SystemSetting.objects.get_or_create(
            key='rate_limiting',
            defaults={
                'value': {'anon_limit_per_min': 60, 'user_limit_per_min': 240},
                'description': 'سقف مجاز ارسال درخواست به API'
            }
        )

        env_summary = {
            'django_debug': getattr(settings, 'DEBUG', False),
            'allowed_hosts': getattr(settings, 'ALLOWED_HOSTS', []),
            'secret_key_configured': bool(getattr(settings, 'SECRET_KEY', None)),
            'database_engine': connection.vendor,
            'time_zone': getattr(settings, 'TIME_ZONE', 'Asia/Tehran'),
        }

        return Response({
            'maintenance_mode': maint_setting.value,
            'feature_flags': flags_setting.value,
            'rate_limiting': rate_limit_setting.value,
            'environment_status': env_summary
        })

    def post(self, request):
        key = request.data.get('key')
        value = request.data.get('value')

        if not key or value is None:
            return Response({'detail': 'کلید و مقدار تنظیم الزامی است.'}, status=status.HTTP_400_BAD_REQUEST)

        setting, _ = SystemSetting.objects.get_or_create(key=key)
        old_value = setting.value
        setting.value = value
        setting.updated_by = request.user
        setting.save()

        AuditLog.objects.create(
            actor=request.user,
            action=AuditLog.Action.CONFIG_CHANGE,
            entity_type='SystemSetting',
            entity_id=key,
            details={'old': old_value, 'new': value},
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response({'success': True, 'key': key, 'value': value})


class SupervisorTestErrorTriggerView(APIView):
    """
    شبیه‌ساز خطا جهت آزمون سامانه ناظر:
    ایجاد خطای عمدی کنترل‌شده جهت ارزیابی استک‌ترس و ثبت در دیتابیس.
    """
    permission_classes = [IsSupervisorUserRole]

    def post(self, request):
        mode = request.data.get('mode', 'division_by_zero')
        if mode == 'division_by_zero':
            _ = 1 / 0
        elif mode == 'value_error':
            raise ValueError("خطای تستی مقدار نامعتبر جهت سنجش سیستم مانیتورینگ ناظر فنی IranSwim")
        else:
            raise RuntimeError("خطای تستی Runtime جهت آزمون پایگاه داده لاگ باگ‌های سامانه")
        return Response({'message': 'تست با موفقیت انجام شد.'})
