from rest_framework import permissions


class IsAdminUserRole(permissions.BasePermission):
    """دسترسی فقط به مدیر آموزشگاه یا مدیر ارشد"""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == 'ADMIN' or request.user.is_superuser or request.user.is_staff)
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


class IsOwnerSwimmerOrAdmin(permissions.BasePermission):
    """کنترل امنیتی سطح شیء: شناگر فقط داده‌های خود را ببیند و ویرایش نکند؛ مدیر دسترسی کامل دارد"""
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == 'ADMIN' or request.user.is_superuser:
            return True
        # Check if obj is SwimmerProfile or has swimmer attribute
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'swimmer'):
            return getattr(obj.swimmer, 'user', None) == request.user
        return False
