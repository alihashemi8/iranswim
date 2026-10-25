import React, { useState, useEffect } from 'react';
import {
  UserCheck, Plus, Calendar, Clock, BookOpen,
  Award, Shield, Phone, Edit, CheckCircle2, AlertTriangle, FileSpreadsheet
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { exportToCsv } from '../../utils/exportCsv';

export const AdminCoachesPage = () => {
  const [coaches, setCoaches] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const toast = useToast();

  // Assign Coach Modal
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [assignGroupModalOpen, setAssignGroupModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    group: '',
    assigned_from: new Date().toISOString().split('T')[0],
    assigned_to: '',
    is_primary: true,
  });
  const [assigning, setAssigning] = useState(false);

  // Coach Profile & Workload Modal
  const [viewCoach, setViewCoach] = useState(null);
  const [coachSessions, setCoachSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Edit Status Modal
  const [statusCoach, setStatusCoach] = useState(null);
  const [newStatus, setNewStatus] = useState('ACTIVE');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchCoachesAndGroups = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const [coachesRes, groupsRes] = await Promise.all([
        api.get('/coaches/', { params }),
        api.get('/education/groups/'),
      ]);

      setCoaches(coachesRes.data.results || coachesRes.data);
      setGroups(groupsRes.data.results || groupsRes.data);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت اطلاعات مربیان');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoachesAndGroups();
  }, [statusFilter]);

  // Open Coach Schedule & Workload
  const handleOpenCoachSchedule = async (coach) => {
    setViewCoach(coach);
    setSessionsLoading(true);
    try {
      const res = await api.get(`/scheduling/sessions/?coach_id=${coach.id}`);
      setCoachSessions(res.data.results || res.data);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت برنامه کلاسی مربی');
    } finally {
      setSessionsLoading(false);
    }
  };

  // Submit Coach Assignment to Group
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCoach || !assignForm.group) {
      toast.error('لطفاً گروه آموزشی را انتخاب کنید.');
      return;
    }

    try {
      setAssigning(true);
      await api.post('/education/group-coaches/', {
        coach: selectedCoach.id,
        group: Number(assignForm.group),
        assigned_from: assignForm.assigned_from,
        assigned_to: assignForm.assigned_to || null,
        is_primary: assignForm.is_primary,
      });

      toast.success(`مربی ${selectedCoach.full_name} با موفقیت به گروه تخصیص داده شد.`);
      setAssignGroupModalOpen(false);
      setSelectedCoach(null);
      setAssignForm({
        group: '',
        assigned_from: new Date().toISOString().split('T')[0],
        assigned_to: '',
        is_primary: true,
      });
      fetchCoachesAndGroups();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در تخصیص مربی به گروه');
    } finally {
      setAssigning(false);
    }
  };

  // Submit Coach Status Update
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!statusCoach) return;

    try {
      setUpdatingStatus(true);
      await api.patch(`/coaches/${statusCoach.id}/`, {
        employment_status: newStatus,
      });
      toast.success(`وضعیت همکاری مربی ${statusCoach.full_name} با موفقیت به‌روزرسانی شد.`);
      setStatusCoach(null);
      fetchCoachesAndGroups();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در تغییر وضعیت همکاری مربی');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleExportCsv = () => {
    const rows = coaches.map((c) => ({
      name: c.full_name,
      phone: c.phone,
      specialties: c.specialties || '—',
      status: c.employment_status === 'ACTIVE' ? 'فعال' : c.employment_status === 'SUSPENDED' ? 'معلق' : 'غیرفعال',
      hourly_rate: Number(c.hourly_rate || 0).toLocaleString('fa-IR'),
    }));
    exportToCsv('IranSwim_Coaches_List', rows, {
      name: 'نام و نام خانوادگی',
      phone: 'شماره همراه',
      specialties: 'تخصص‌ها',
      status: 'وضعیت همکاری',
      hourly_rate: 'نرخ ساعتی (تومان)',
    });
  };

  const formatPrice = (v) => Number(v || 0).toLocaleString('fa-IR');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-sky-600" />
            مدیریت کادر مربیان، تخصص‌ها و برنامه هفتگی
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            بررسی پرونده حرفه‌ای مربیان، تخصیص کلاس با کنترل تداخل و نظارت بر جلسات برگزارشده
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCsv} className="gap-1.5 text-xs">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>خروجی اکسل مربیان</span>
          </Button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">تمام وضعیت‌های کاری</option>
            <option value="ACTIVE">فعال و مجاز</option>
            <option value="SUSPENDED">معلق</option>
            <option value="INACTIVE">غیرفعال</option>
          </select>
        </div>
      </div>

      {/* Grid of Coaches */}
      {loading ? (
        <LoadingState message="در حال دریافت اطلاعات مربیان آموزشگاه..." />
      ) : coaches.length === 0 ? (
        <EmptyState
          title="مربی‌ای یافت نشد"
          description="با تغییر فیلترها، اطلاعات مربیان ثبت‌شده نمایش داده می‌شود."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coaches.map((coach) => (
            <div
              key={coach.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between transition-colors"
            >
              <div>
                {/* Header Profile */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      {coach.full_name ? coach.full_name.charAt(0) : 'C'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        {coach.full_name}
                      </h3>
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {coach.phone}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={
                      coach.employment_status === 'ACTIVE'
                        ? 'success'
                        : coach.employment_status === 'SUSPENDED'
                        ? 'warning'
                        : 'neutral'
                    }
                  >
                    {coach.employment_status === 'ACTIVE'
                      ? 'فعال و مجاز'
                      : coach.employment_status === 'SUSPENDED'
                      ? 'معلق'
                      : 'غیرفعال'}
                  </Badge>
                </div>

                {/* Specialties & Bio */}
                <div className="py-3 space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">تخصص‌های آموزشی:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {coach.specialties || 'شنای عمومی و مقدماتی'}
                    </span>
                  </div>

                  {coach.bio && (
                    <div>
                      <span className="text-slate-400 block mb-0.5">بیوگرافی و مدارک:</span>
                      <p className="text-slate-600 dark:text-slate-400 line-clamp-2">{coach.bio}</p>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between text-slate-500">
                    <span>حق‌التدریس ساعتی:</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                      {formatPrice(coach.hourly_rate)} تومان
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenCoachSchedule(coach)}
                  className="flex-1 py-1.5 px-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200/60 dark:border-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-sky-600" />
                  <span>برنامه کلاسی</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCoach(coach);
                    setAssignGroupModalOpen(true);
                  }}
                  className="flex-1 py-1.5 px-2 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 rounded-xl text-xs font-semibold border border-sky-200 dark:border-sky-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>تخصیص گروه</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStatusCoach(coach);
                    setNewStatus(coach.employment_status);
                  }}
                  className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-500 rounded-xl border border-slate-200/60 dark:border-slate-700 transition-colors cursor-pointer"
                  title="تغییر وضعیت همکاری"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1. Modal: Assign Coach to SwimmerGroup */}
      <Modal
        isOpen={assignGroupModalOpen}
        onClose={() => setAssignGroupModalOpen(false)}
        title={`تخصیص مربی به گروه آموزشی: ${selectedCoach?.full_name}`}
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              انتخاب گروه آموزشی *
            </label>
            <select
              required
              value={assignForm.group}
              onChange={(e) => setAssignForm({ ...assignForm, group: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
            >
              <option value="">انتخاب کنید...</option>
              {groups.map((grp) => (
                <option key={grp.id} value={grp.id}>
                  {grp.course_name} - {grp.name} ({grp.level_name}) - {grp.pool_location}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                تاریخ شروع تخصیص *
              </label>
              <input
                type="date"
                required
                value={assignForm.assigned_from}
                onChange={(e) => setAssignForm({ ...assignForm, assigned_from: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                تاریخ پایان تخصیص (اختیاری)
              </label>
              <input
                type="date"
                value={assignForm.assigned_to}
                onChange={(e) => setAssignForm({ ...assignForm, assigned_to: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_primary"
              checked={assignForm.is_primary}
              onChange={(e) => setAssignForm({ ...assignForm, is_primary: e.target.checked })}
              className="rounded text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="is_primary" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              این مربی، مربی اصلی این گروه باشد (در غیر این صورت مربی کمکی/جایگزین)
            </label>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
            سیستم به صورت خودکار تداخل زمانی جلسات این گروه با سایر کلاس‌های همزمان این مربی را کنترل خواهد کرد.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setAssignGroupModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={assigning}>
              {assigning ? 'در حال تخصیص...' : 'تأیید تخصیص'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Modal: Coach Workload & Sessions Schedule */}
      <Modal
        isOpen={!!viewCoach}
        onClose={() => setViewCoach(null)}
        title={`برنامه کلاسی و جلسات مربی: ${viewCoach?.full_name}`}
      >
        <div className="space-y-4">
          {sessionsLoading ? (
            <LoadingState message="در حال بارگذاری جلسات مربی..." />
          ) : coachSessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              جلسه کلاسی برای این مربی در تقویم آموزشی یافت نشد.
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {coachSessions.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100 block">
                      {s.group_name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(s.session_date).toLocaleDateString('fa-IR')} | ساعت {s.start_time?.slice(0, 5)} تا {s.end_time?.slice(0, 5)}
                    </span>
                  </div>
                  <div className="text-left">
                    <Badge variant={s.status === 'COMPLETED' ? 'success' : s.status === 'CANCELLED' ? 'danger' : 'info'}>
                      {s.status_display}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setViewCoach(null)}>
              بستن
            </Button>
          </div>
        </div>
      </Modal>

      {/* 3. Modal: Change Employment Status */}
      <Modal
        isOpen={!!statusCoach}
        onClose={() => setStatusCoach(null)}
        title={`تغییر وضعیت همکاری: ${statusCoach?.full_name}`}
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              وضعیت همکاری جدید
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
            >
              <option value="ACTIVE">فعال و مجاز (Active)</option>
              <option value="SUSPENDED">معلق موقت (Suspended)</option>
              <option value="INACTIVE">پایان همکاری / غیرفعال (Inactive)</option>
            </select>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300">
            نکته معماری: تغییر وضعیت همکاری، سوابق تدریس، گروه‌های قبلی و کارنامه ثبت‌شده توسط مربی را حذف نخواهد کرد.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setStatusCoach(null)}>
              انصراف
            </Button>
            <Button type="submit" disabled={updatingStatus}>
              {updatingStatus ? 'در حال ثبت...' : 'ذخیره تغییرات'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
