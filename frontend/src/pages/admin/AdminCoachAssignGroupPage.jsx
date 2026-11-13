import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, Calendar, Clock, MapPin, UserCheck, CheckCircle2,
  AlertTriangle, ArrowRight, Plus, Trash2, Shield, Info, Users
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { CustomSelect } from '../../components/common/CustomSelect';
import { PersianDatePicker } from '../../components/common/PersianDatePicker';
import { Modal } from '../../components/common/Modal';
import { BackButton } from '../../components/common/BackButton';
import { useToast } from '../../context/ToastContext';

export const AdminCoachAssignGroupPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [coach, setCoach] = useState(null);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [assignedGroups, setAssignedGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [assignedFrom, setAssignedFrom] = useState(new Date().toISOString().split('T')[0]);
  const [assignedTo, setAssignedTo] = useState('');
  const [isPrimary, setIsPrimary] = useState(true);
  const [ignoreConflict, setIgnoreConflict] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Unassign confirmation modal
  const [unassignItem, setUnassignItem] = useState(null);
  const [unassigning, setUnassigning] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [coachRes, groupsRes, assignedRes] = await Promise.all([
        api.get(`/coaches/${id}/`),
        api.get('/education/groups/'),
        api.get(`/education/group-coaches/?coach_id=${id}`),
      ]);

      setCoach(coachRes.data);
      setAvailableGroups(groupsRes.data.results || groupsRes.data || []);
      setAssignedGroups(assignedRes.data.results || assignedRes.data || []);
    } catch (err) {
      console.error('Error fetching assign page data:', err);
      toast.error('خطا در دریافت اطلاعات مربی و گروه‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Selected group object
  const selectedGroup = useMemo(() => {
    return availableGroups.find((g) => String(g.id) === String(selectedGroupId));
  }, [availableGroups, selectedGroupId]);

  // Schedule conflict detection logic
  const conflictInfo = useMemo(() => {
    if (!selectedGroup || !selectedGroup.schedules) return null;

    const conflicts = [];
    assignedGroups.forEach((assign) => {
      // Don't compare with same group
      if (String(assign.group) === String(selectedGroup.id)) return;

      const assignSchedules = assign.schedules || [];
      selectedGroup.schedules.forEach((newSch) => {
        assignSchedules.forEach((exSch) => {
          if (newSch.weekday === exSch.weekday) {
            const newStart = newSch.start_time?.slice(0, 5);
            const newEnd = newSch.end_time?.slice(0, 5);
            const exStart = exSch.start_time?.slice(0, 5);
            const exEnd = exSch.end_time?.slice(0, 5);

            // Overlap condition
            if (newStart < exEnd && newEnd > exStart) {
              conflicts.push({
                conflictingGroupName: assign.group_name || `گروه ${assign.group}`,
                weekdayName: newSch.weekday_display || 'روز مشترک',
                existingTime: `${exStart} تا ${exEnd}`,
                newTime: `${newStart} تا ${newEnd}`,
              });
            }
          }
        });
      });
    });

    return conflicts.length > 0 ? conflicts : null;
  }, [selectedGroup, assignedGroups]);

  // Handle Form Submission
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGroupId) {
      toast.error('لطفاً گروه آموزشی را انتخاب کنید.');
      return;
    }

    if (conflictInfo && !ignoreConflict) {
      toast.error('تداخل زمانی با کلاس‌های قبلی مربی وجود دارد. برای ادامه تیک نادیده گرفتن تداخل را بزنید.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/education/group-coaches/', {
        coach: Number(id),
        group: Number(selectedGroupId),
        assigned_from: assignedFrom,
        assigned_to: assignedTo || null,
        is_primary: isPrimary,
        ignore_conflict: ignoreConflict,
      });

      toast.success(`مربی ${coach.full_name} با موفقیت به گروه ${selectedGroup?.name} تخصیص یافت.`);
      setSelectedGroupId('');
      setAssignedTo('');
      setIgnoreConflict(false);
      fetchData();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.conflict || err.response?.data?.detail || 'خطا در تخصیص گروه به مربی';
      toast.error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Unassign Coach from Group
  const handleConfirmUnassign = async () => {
    if (!unassignItem) return;
    try {
      setUnassigning(true);
      await api.delete(`/education/group-coaches/${unassignItem.id}/`);
      toast.success(`تخصیص مربی به گروه ${unassignItem.group_name} با موفقیت لغو شد.`);
      setUnassignItem(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('خطا در لغو تخصیص گروه');
    } finally {
      setUnassigning(false);
    }
  };

  // Group Select Options
  const groupSelectOptions = useMemo(() => {
    return availableGroups.map((grp) => {
      const scheduleSummary = (grp.schedules || [])
        .map((s) => `${s.weekday_display} ${s.start_time?.slice(0, 5)}`)
        .join('، ');
      return {
        value: String(grp.id),
        label: `${grp.course_name} - ${grp.name} (${grp.level_name})`,
        description: `سانس: ${scheduleSummary || 'بدون زمان‌بندی'} | مکان: ${grp.pool_location}`,
      };
    });
  }, [availableGroups]);

  if (loading) {
    return (
      <div className="py-12">
        <LoadingState type="cards" count={2} message="در حال دریافت اطلاعات تخصیص گروه..." />
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-4">
        <p className="text-slate-600 dark:text-slate-400">مربی مورد نظر یافت نشد.</p>
        <BackButton to="/admin/coaches" label="بازگشت به کادر مربیان" showLabelAlways />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header / Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <BackButton fallback={`/admin/coaches/${id}`} title="بازگشت به پرونده مربی" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">کادر مربیان</span>
              <span className="text-xs text-slate-300 dark:text-slate-700">/</span>
              <Link
                to={`/admin/coaches/${coach.id}`}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400"
              >
                پروفایل {coach.full_name}
              </Link>
              <span className="text-xs text-slate-300 dark:text-slate-700">/</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                تخصیص گروه آموزشی
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sky-600" />
              تخصیص گروه آموزشی به مربی: {coach.full_name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/coaches/${coach.id}/schedule`)}
            className="gap-1.5 text-xs bg-white dark:bg-slate-900 shadow-xs"
          >
            <Calendar className="w-4 h-4 text-sky-600" />
            <span>مشاهده جدول برنامه کلاسی</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate(`/admin/coaches/${coach.id}`)}
            className="gap-1.5 text-xs bg-white dark:bg-slate-900 shadow-xs"
          >
            <UserCheck className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>پروفایل مربی</span>
          </Button>
        </div>
      </div>

      {/* Coach Info Summary Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
            {coach.avatar ? (
              <img src={coach.avatar} alt={coach.full_name} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              coach.full_name?.charAt(0) || 'C'
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                {coach.full_name}
              </h2>
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
                  ? 'فعال'
                  : coach.employment_status === 'SUSPENDED'
                  ? 'معلق'
                  : 'غیرفعال'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              شماره همراه: <span className="font-mono">{coach.phone}</span> | درجه مربیگری: {coach.coaching_degree_display || coach.coaching_degree || 'درجه ۳'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">تعداد گروه‌های فعلی:</span>
          <span className="font-bold px-2.5 py-1 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 rounded-lg border border-sky-200 dark:border-sky-800 font-mono">
            {assignedGroups.length} گروه فعال
          </span>
        </div>
      </div>

      {/* Main Grid: Left: Assignment Form, Right: Currently Assigned Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-600" />
              فرم تخصیص گروه آموزشی جدید
            </h3>

            <form onSubmit={handleAssignSubmit} className="mt-4 space-y-4 text-xs">
              {/* Group Selector */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  انتخاب گروه آموزشی هدف *
                </label>
                <CustomSelect
                  value={selectedGroupId}
                  onChange={(val) => {
                    setSelectedGroupId(val);
                    setIgnoreConflict(false);
                  }}
                  options={groupSelectOptions}
                  searchable
                  placeholder="جست‌وجو و انتخاب گروه آموزشی..."
                  color="sky"
                />
              </div>

              {/* Group Details Preview Card */}
              {selectedGroup && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedGroup.name}
                    </span>
                    <Badge variant="neutral" style={{ backgroundColor: selectedGroup.level_color || '#0284c7', color: '#fff' }}>
                      {selectedGroup.level_name}
                    </Badge>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>مکان: {selectedGroup.pool_location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-600" />
                      <span>
                        سانس‌های کلاسی:{' '}
                        {(selectedGroup.schedules || [])
                          .map((s) => `${s.weekday_display} ${s.start_time?.slice(0, 5)} الی ${s.end_time?.slice(0, 5)}`)
                          .join(' | ') || 'نامشخص'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      <span>ظرفیت: {selectedGroup.capacity} نفر ({selectedGroup.current_enrollments_count || 0} شناگر ثبت‌نام‌شده)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Schedule Conflict Warning or Clear Status */}
              {selectedGroup && (
                <div>
                  {conflictInfo ? (
                    <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl space-y-2 text-amber-900 dark:text-amber-200">
                      <div className="flex items-center gap-2 font-bold text-xs text-amber-800 dark:text-amber-300">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>هشدار تداخل زمانی با سایر برنامه‌های مربی:</span>
                      </div>
                      <div className="space-y-1 text-[11px]">
                        {conflictInfo.map((c, idx) => (
                          <div key={idx} className="bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg">
                            • تداخل با <strong className="text-amber-900 dark:text-white">{c.conflictingGroupName}</strong> در روز <strong>{c.weekdayName}</strong> (ساعت {c.existingTime} با سانس جدید {c.newTime})
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-amber-200 dark:border-amber-900/60 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="ignoreConflict"
                          checked={ignoreConflict}
                          onChange={(e) => setIgnoreConflict(e.target.checked)}
                          className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                        <label htmlFor="ignoreConflict" className="text-[11px] font-semibold cursor-pointer">
                          نادیده گرفتن هشدار تداخل و تخصیص اجباری
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>زمان‌بندی این گروه هیچ تداخلی با سایر کلاس‌های این مربی ندارد.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <PersianDatePicker
                    label="تاریخ شروع تخصیص *"
                    value={assignedFrom}
                    onChange={(jalaliStr, gDate, gIso) =>
                      setAssignedFrom(gIso || jalaliStr)
                    }
                    placeholder="انتخاب تاریخ شروع..."
                    clearable={false}
                  />
                </div>
                <div>
                  <PersianDatePicker
                    label="تاریخ پایان تخصیص (اختیاری)"
                    value={assignedTo}
                    onChange={(jalaliStr, gDate, gIso) =>
                      setAssignedTo(gIso || '')
                    }
                    placeholder="پایان دوره..."
                    clearable
                  />
                </div>
              </div>

              {/* Primary Coach Toggle */}
              <div className="flex items-center gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700">
                <input
                  type="checkbox"
                  id="is_primary"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer w-4 h-4"
                />
                <label htmlFor="is_primary" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  مربی اصلی گروه باشد (در غیر این صورت مربی کمکی / جایگزین)
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/coaches')}
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !selectedGroupId}
                  className="bg-sky-600 hover:bg-sky-500 text-white gap-1.5"
                >
                  {submitting ? 'در حال ثبت تخصیص...' : 'تأیید و تخصیص گروه'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Currently Assigned Groups (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  گروه‌های آموزشی فعال این مربی ({assignedGroups.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  فهرست کلاس‌هایی که مربی هم‌اکنون به عنوان مربی اصلی یا کمکی در آن‌ها تدریس می‌کند
                </p>
              </div>
            </div>

            {assignedGroups.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                هنوز هیچ گروه آموزشی به این مربی تخصیص داده نشده است.
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {assignedGroups.map((assign) => (
                  <div
                    key={assign.id}
                    className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 hover:border-sky-300 dark:hover:border-sky-700 transition-all flex flex-col justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                            {assign.group_name || `گروه ${assign.group}`}
                          </h4>
                          <Badge
                            variant="neutral"
                            style={{ backgroundColor: assign.level_color || '#0284c7', color: '#fff' }}
                          >
                            {assign.level_name || 'عمومی'}
                          </Badge>
                          <Badge variant={assign.is_primary ? 'success' : 'neutral'}>
                            {assign.is_primary ? 'مربی اصلی' : 'مربی کمکی'}
                          </Badge>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">
                          دوره: {assign.course_name || 'دوره شنا'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setUnassignItem(assign)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-red-200"
                        title="لغو تخصیص این گروه"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Schedules & Location */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span className="font-mono">
                          {(assign.schedules || [])
                            .map((s) => `${s.weekday_display} ${s.start_time?.slice(0, 5)} تا ${s.end_time?.slice(0, 5)}`)
                            .join(' | ') || 'ساعات نامشخص'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{assign.pool_location || 'استخر مرکزی'}</span>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>
                        تاریخ شروع: {assign.assigned_from ? new Date(assign.assigned_from).toLocaleDateString('fa-IR') : '—'}
                      </span>
                      {assign.assigned_to && (
                        <span>
                          تاریخ پایان: {new Date(assign.assigned_to).toLocaleDateString('fa-IR')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Confirm Unassign */}
      <Modal
        isOpen={!!unassignItem}
        onClose={() => setUnassignItem(null)}
        title="لغو تخصیص مربی از گروه"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-700 dark:text-slate-300">
            آیا از لغو تخصیص مربی <strong>{coach.full_name}</strong> از گروه آموزشی{' '}
            <strong>{unassignItem?.group_name}</strong> اطمینان دارید؟
          </p>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300">
            با لغو تخصیص، این مربی دیگر در کلاس‌ها و جلسات این گروه به عنوان مربی نخواهد بود، اما سوابق قبلی حفظ می‌شود.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setUnassignItem(null)}
            >
              انصراف
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={unassigning}
              onClick={handleConfirmUnassign}
            >
              {unassigning ? 'در حال لغو...' : 'تأیید و لغو تخصیص'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
