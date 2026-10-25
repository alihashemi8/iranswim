from django.urls import path
from .views import AttendanceListView, AttendanceBulkSaveView

urlpatterns = [
    path('', AttendanceListView.as_view(), name='attendance_list'),
    path('bulk-save/', AttendanceBulkSaveView.as_view(), name='attendance_bulk_save'),
]
