import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ClipboardCheck, Calendar, Clock, Users, CheckCircle,
  AlertCircle, Save, ArrowRight, Search, X, CheckCheck,
  MapPin, UserCheck, BookOpen, Award, Check
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { BackButton } from '../../components/common/BackButton';
import { useToast } from '../../context/ToastContext';

export const AdminAttendanceDetailPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [session, setSession] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Search & Filter within sheet
  const [searchSwimmer, setSearchSwimmer] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    if (!sessionId) return;

    const fetchSheetData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Session
        const sessRes = await api.get(`/scheduling/sessions/${sessionId}/`);
        const sess = sessRes.data;
        setSession(sess);

        // 2. Fetch Enrollments & Existing Attendance in parallel
        const [enrRes, attRes] = await Promise.all([
          api.get(`/education/enrollments/?group_id=${sess.group}`),
          api.get(`/attendance/?session_id=${sessionId}`),
        ]);

        const enrList = enrRes.data.results || enrRes.data || [];
        const attList = attRes.data.results || attRes.data || [];

        // Build attendance map
        const lookup = {};
        attList.forEach((r) => {
          lookup[r.swimmer] = {
            status: r.status,
            note: r.note || '',
          };
        });

        // Default to 'PRESENT' for enrolled swimmers without existing record
        enrList.forEach((e) => {
          if (!lookup[e.swimmer]) {
            lookup[e.swimmer] = {
              status: 'PRESENT',
              note: '',
            };
          }
        });

        setEnrollments(enrList);
        setAttendanceMap(lookup);
      } catch (err) {
        console.error('Error fetching attendance session data:', err);
        toast.error('خطا در دریافت اطلاعات جلسه و دفترچه حضور و غیاب');
      } finally {
        setLoading(false);
      }
    };

    fetchSheetData();
  }, [sessionId]);

  const handleStatusChange = (swimmerId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [swimmerId]: {
        ...(prev[swimmerId] || {}),
        status,
      },
    }));
  };

  const handleNoteChange = (swimmerId, note) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [swimmerId]: {
        ...(prev[swimmerId] || {}),
        note,
      },
    }));
  };

  const handleMarkAllPresent = () => {
    const updated = { ...attendanceMap };
    enrollments.forEach((e) => {
      updated[e.swimmer] = {
        ...(updated[e.swimmer] || {}),
        status: 'PRESENT',
      };
    });
    setAttendanceMap(updated);
    toast.success('تمامی شناگران این جلسه به عنوان «حاضر» علامت‌گذاری شدند.');
  };

  const handleSaveAttendance = async (e) => {
    if (e) e.preventDefault();
    if (!sessionId) return;

    const records = Object.entries(attendanceMap).map(([swimmerId, data]) => ({
      swimmer_id: Number(swimmerId),
      status: data.status,
      note: data.note,
    }));

    try {
      setSaving(true);
      setSavedSuccess(false);
      await api.post('/attendance/bulk-save/', {
        session_id: Number(sessionId),
        records,
      });

      setSavedSuccess(true);
      toast.success('دفتر حضور و غیاب ثبت و سهمیه شناگران با موفقیت به‌روزرسانی شد.');
      setTimeout(() => {
        navigate('/admin/attendance');
      }, 1200);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت نهایی حضور و غیاب');
    } finally {
      setSaving(false);
    }
  };

  // Filtered Swimmers List
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((enr) => {
      const q = searchSwimmer.trim().toLowerCase();
      const matchesSearch = !q || enr.swimmer_name?.toLowerCase().includes(q);
      const currentStatus = attendanceMap[enr.swimmer]?.status || 'PRESENT';
      const matchesStatus = statusFilter === 'ALL' || currentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [enrollments, attendanceMap, searchSwimmer, statusFilter]);

  // Counts of swimmers by status
  const counts = useMemo(() => {
    const c = { ALL: enrollments.length, PRESENT: 0, LATE: 0, EXCUSED: 0, ABSENT: 0 };
    enrollments.forEach((enr) => {
      const st = attendanceMap[enr.swimmer]?.status || 'PRESENT';
      if (c[st] !== undefined) c[st]++;
    });
    return c;
  }, [enrollments, attendanceMap]);

  // Format Date Helper
  const formatSessionDate = (dateStr) => {
    if (!dateStr) return { weekday: '', dateFormatted: '—' };
    try {
      const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
      const weekday = d.toLocaleDateString('fa-IR', { weekday: 'long' });
      const dateFormatted = d.toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' });
      return { weekday, dateFormatted };
    } catch {
      return { weekday: '', dateFormatted: dateStr };
    }
  };

  if (loading) {
    return <LoadingState type="table" rows={6} message="در حال دریافت دفترچه حضور و غیاب جلسه..." />;
  }

  if (!session) {
    return (
      <EmptyState
        title="جلسه مورد نظر یافت نشد"
        description="ممکن است شناسه جلسه نامعتبر باشد یا جلسه حذف شده باشد."
        action={
          <BackButton to="/admin/attendance" label="بازگشت به لیست حضور و غیاب" showLabelAlways />
        }
      />
    );
  }

  const { weekday, dateFormatted } = formatSessionDate(session.session_date);

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Navigation & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <BackButton fallback="/admin/attendance" title="بازگشت به لیست جلسات" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                دفتر حضور و غیاب
              </span>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                ثبت و بازبینی جلسه
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5 flex items-center gap-2 truncate">
              <ClipboardCheck className="w-6 h-6 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>{session.group_name}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/attendance')}
            className="flex-1 sm:flex-initial text-xs"
          >
            انصراف
          </Button>
          <Button
            type="button"
            loading={saving}
            disabled={saving || enrollments.length === 0}
            onClick={handleSaveAttendance}
            className="flex-1 sm:flex-initial gap-1.5 text-xs bg-sky-600 hover:bg-sky-700 text-white font-bold px-4"
          >
            <Save className="w-4 h-4" />
            {saving ? 'در حال ثبت...' : 'ثبت و نهایی‌سازی حضور و غیاب'}
          </Button>
        </div>
      </div>

      {/* 2. Session Overview Hero Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {session.group_name}
              </h2>
              {session.course_name && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-medium">
                  <BookOpen className="w-3.5 h-3.5 text-sky-500" />
                  {session.course_name}
                </span>
              )}
              {session.skill_level_name && (
                <Badge
                  variant="info"
                  className="text-xs gap-1 font-semibold"
                  style={{
                    borderColor: session.skill_level_badge ? `${session.skill_level_badge}40` : undefined,
                    color: session.skill_level_badge || undefined,
                  }}
                >
                  <Award className="w-3 h-3" />
                  {session.skill_level_name}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                مربی مسئول: <strong>{session.coach_name || 'نامشخص'}</strong>
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                محل: <strong>{session.pool_location || 'استخر اصلی'}</strong>
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                شناگران ثبت‌نام‌شده: <strong>{enrollments.length} نفر</strong>
              </span>
            </div>
          </div>

          {/* Date & Time pill */}
          <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 shrink-0 flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-100 block">{weekday}</span>
                <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px] block">{dateFormatted}</span>
              </div>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <div>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100 block">
                  {session.start_time?.slice(0, 5)} تا {session.end_time?.slice(0, 5)}
                </span>
                <span className="text-slate-400 text-[11px] block">زمان سانس</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Toolbar: Search Swimmers, Status Tabs, Mark All Present */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchSwimmer}
              onChange={(e) => setSearchSwimmer(e.target.value)}
              placeholder="جست‌وجوی نام شناگر در این کلاس..."
              className="w-full pl-8 pr-9 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            />
            {searchSwimmer && (
              <button
                type="button"
                onClick={() => setSearchSwimmer('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Status Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700 text-xs">
              {[
                { key: 'ALL', label: `همه (${counts.ALL})` },
                { key: 'PRESENT', label: `حاضر (${counts.PRESENT})`, color: 'text-emerald-700 dark:text-emerald-300' },
                { key: 'LATE', label: `تأخیر (${counts.LATE})`, color: 'text-amber-700 dark:text-amber-300' },
                { key: 'EXCUSED', label: `موجه (${counts.EXCUSED})`, color: 'text-sky-700 dark:text-sky-300' },
                { key: 'ABSENT', label: `غایب (${counts.ABSENT})`, color: 'text-rose-700 dark:text-rose-300' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setStatusFilter(item.key)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap text-[11px] cursor-pointer ${
                    statusFilter === item.key
                      ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Mark All Present */}
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition-all shrink-0 shadow-2xs active:scale-95 cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              حاضر کردن همه
            </button>
          </div>
        </div>
      </div>

      {/* 4. Swimmers Attendance Sheet Cards */}
      {enrollments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-slate-200/80 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
          هیچ شناگری در این کلاس ثبت‌نام قطعی ندارد.
        </div>
      ) : filteredEnrollments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-8 text-center rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-400">
          شناگری با فیلتر انتخابی یافت نشد.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEnrollments.map((enr) => {
            const currentStatus = attendanceMap[enr.swimmer]?.status || 'PRESENT';
            const currentNote = attendanceMap[enr.swimmer]?.note || '';

            return (
              <div
                key={enr.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 text-xs transition-colors"
              >
                {/* Swimmer Info */}
                <div className="flex items-center gap-3 min-w-[220px]">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 flex items-center justify-center font-bold text-sm text-sky-700 dark:text-sky-300 shrink-0">
                    {enr.swimmer_name?.charAt(0) || 'ش'}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm block">
                      {enr.swimmer_name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 block">
                      {enr.remaining_sessions} جلسه باقی‌مانده از {enr.sessions_purchased}
                    </span>
                  </div>
                </div>

                {/* Status Selection Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { key: 'PRESENT', label: 'حاضر', activeClass: 'bg-emerald-600 text-white font-bold shadow-xs scale-102' },
                    { key: 'LATE', label: 'تأخیر', activeClass: 'bg-amber-600 text-white font-bold shadow-xs scale-102' },
                    { key: 'EXCUSED', label: 'موجه (بدون کسر)', activeClass: 'bg-sky-600 text-white font-bold shadow-xs scale-102' },
                    { key: 'ABSENT', label: 'غایب', activeClass: 'bg-rose-600 text-white font-bold shadow-xs scale-102' },
                  ].map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => handleStatusChange(enr.swimmer, st.key)}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        currentStatus === st.key
                          ? st.activeClass
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* Note Input */}
                <div className="w-full lg:w-64">
                  <input
                    type="text"
                    placeholder="یادداشت مربی یا علت غیبت..."
                    value={currentNote}
                    onChange={(e) => handleNoteChange(enr.swimmer, e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Business Rule Banner */}
      <div className="p-4 bg-sky-50/70 dark:bg-sky-950/30 rounded-2xl text-xs text-sky-900 dark:text-sky-200 border border-sky-200/80 dark:border-sky-800/60 leading-relaxed">
        💡 <strong>قانون هوشمند سهمیه:</strong> وضعیت‌های «حاضر»، «تأخیر» و «غایب» یک جلسه از سهمیه شناگر کسر می‌کنند؛ وضعیت «غایب موجه» سهمیه‌ای کسر نمی‌کند.
      </div>

      {/* 6. Sticky Save Footer */}
      <div className="sticky bottom-4 z-30 p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        {savedSuccess ? (
          <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <Check className="w-5 h-5" />
            دفتر حضور و غیاب با موفقیت ثبت شد. در حال بازگشت...
          </span>
        ) : (
          <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            مجموع: <span className="font-bold text-slate-900 dark:text-white">{enrollments.length} نفر</span> · حاضرین: <span className="font-bold text-emerald-600">{counts.PRESENT}</span> · تأخیر: <span className="font-bold text-amber-600">{counts.LATE}</span> · موجه: <span className="font-bold text-sky-600">{counts.EXCUSED}</span> · غایب: <span className="font-bold text-rose-600">{counts.ABSENT}</span>
          </div>
        )}

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/attendance')}
            className="flex-1 sm:flex-initial text-xs"
          >
            انصراف
          </Button>
          <Button
            type="button"
            loading={saving}
            disabled={saving || enrollments.length === 0}
            onClick={handleSaveAttendance}
            className="flex-1 sm:flex-initial gap-1.5 text-xs bg-sky-600 hover:bg-sky-700 text-white font-bold px-5"
          >
            <Save className="w-4 h-4" />
            {saving ? 'در حال ثبت...' : 'ثبت و نهایی‌سازی حضور و غیاب'}
          </Button>
        </div>
      </div>
    </div>
  );
};
