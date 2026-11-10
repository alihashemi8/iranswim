from rest_framework import permissions


class IsAdminUserRole(permissions.BasePermission):
    """دسترسی فقط به مدیر آموزشگاه یا مدیر ارشد"""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == 'ADMIN' or request.user.is_superuser)
        )


class IsCoachUserRole(permissions.BasePermission):
    """دسترسی فقط به مربیان"""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'COACH'
        )


class IsSwimmerUserRole(permissions.BasePermission):
    """دسترسی فقط به شناگران"""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'SWIMMER'
        )


class IsSupervisorUserRole(permissions.BasePermission):
    """دسترسی فقط به ناظر فنی سامانه (یا سوپریوزر)"""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == 'SUPERVISOR' or request.user.is_superuser)
        )


class IsAdminOrSupervisor(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role in ['ADMIN', 'SUPERVISOR'] or request.user.is_superuser)
        )


class IsAdminOrCoach(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role in ['ADMIN', 'COACH'] or request.user.is_superuser)
        )


class IsAdminOrSupervisorOrCoach(permissions.BasePermission):
    """دسترسی به مدیر، ناظر فنی یا مربی"""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role in ['ADMIN', 'SUPERVISOR', 'COACH'] or request.user.is_superuser)
        )


class IsOwnerSwimmerOrAdmin(permissions.BasePermission):
    """کنترل امنیتی سطح شیء: شناگر (و ولی تأییدشده) فقط داده‌های خود را می‌بیند؛ مدیر دسترسی کامل دارد و ناظر فنی دسترسی مشاهده دارد"""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == 'ADMIN' or request.user.is_superuser:
            return True
        if request.user.role == 'SUPERVISOR':
            return request.method in permissions.SAFE_METHODS

        swimmer_obj = obj if hasattr(obj, 'birth_certificate_status') else getattr(obj, 'swimmer', None)
        if not swimmer_obj:
            return False
        if swimmer_obj.user_id and swimmer_obj.user_id == request.user.id:
            return True
        if request.user.role == 'SWIMMER':
            from apps.swimmers.models import SwimmerGuardianRelation
            return SwimmerGuardianRelation.objects.filter(
                guardian=request.user,
                swimmer=swimmer_obj,
                is_verified=True,
            ).exists()
        return False
