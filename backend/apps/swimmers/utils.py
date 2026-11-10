from django.db import models
from .models import SwimmerProfile, SwimmerGuardianRelation


def get_accessible_swimmer_ids(user, request=None, requested_id=None):
    """
    Returns a list or QuerySet of SwimmerProfile IDs accessible by the user.
    Supports multi-child guardian accounts, direct swimmer accounts, and admin.
    """
    if not user or not user.is_authenticated:
        return []

    if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
        if requested_id:
            return [int(requested_id)]
        if request:
            req_id = request.query_params.get('swimmer_id') or request.headers.get('X-Swimmer-Id')
            if req_id and req_id.isdigit():
                return [int(req_id)]
        return None  # None indicates all swimmers accessible

    # Find all IDs linked to this guardian or user (strictly verified relations)
    guardian_swimmer_ids = list(
        SwimmerGuardianRelation.objects.filter(
            guardian=user,
            is_verified=True
        ).values_list('swimmer_id', flat=True)
    )
    if hasattr(user, 'swimmer_profile') and user.swimmer_profile:
        if user.swimmer_profile.id not in guardian_swimmer_ids:
            guardian_swimmer_ids.append(user.swimmer_profile.id)

    # Check if a specific child was requested
    target_id = requested_id
    if not target_id and request:
        target_id = request.query_params.get('swimmer_id') or request.headers.get('X-Swimmer-Id')

    if target_id:
        try:
            tid = int(target_id)
            if tid in guardian_swimmer_ids:
                return [tid]
            return []
        except (ValueError, TypeError):
            pass

    return guardian_swimmer_ids
