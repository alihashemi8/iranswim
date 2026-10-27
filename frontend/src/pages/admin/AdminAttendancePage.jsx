import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ClipboardCheck, Calendar, Clock, Users, CheckCircle,
  XCircle, AlertCircle, HelpCircle, Save, Filter, FileSpreadsheet
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { exportToCsv } from '../../utils/exportCsv';

export const AdminAttendancePage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL'); // ALL, UNRECORDED, TODAY, COMPLETED
  const [searchParams] = useSearchParams();
  const toast = useToast();

  // Active Attendance Registering Modal
  const [activeSession, setActiveSession] = useState(null);
  const [groupEnrollments, setGroupEnrollments] = useState([]);
  const [existingAttendance, setExistingAttendance] = useState({});
  const [modalLoading, setModalLoading] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterType === 'UNRECORDED') params.unrecorded = 'true';
      if (filterType === 'TODAY') params.date = new Date().toISOString().split('T')[0];

      const res = await api.get('/scheduling/sessions/', { params });
      let list = res.data.results || res.data;
      if (filterType === 'COMPLETED') {
        list = list.filter((s) => s.status === 'COMPLETED');
      }
      setSessions(list);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت لیست جلسات آموزشی');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [filterType]);

  // Open Attendance Sheet for a Session
  const handleOpenAttendanceSheet = async (session) => {
    setActiveSession(session);
    setModalLoading(true);
    try {
      // 1. Fetch swimmers enrolled in this session's group
      // 2. Fetch any already-recorded attendance records for this session
      const [enrollRes, attRes] = await Promise.all([
        api.get(`/education/enrollments/?group_id=${session.group}`),
        api.get(`/attendance/?session_id=${session.id}`),
      ]);

      const enrollments = enrollRes.data.results || enrollRes.data;
      const records = attRes.data.results || attRes.data;

      // Map existing records by swimmer id
      const attMap = {};
      records.forEach((r) => {
        attMap[r.swimmer] = {
          status: r.status,
          note: r.note || '',
        };
      });

      // For enrolled swimmers without existing record, default to 'PRESENT'
      enrollments.forEach((e) => {
        if (!attMap[e.swimmer]) {
          attMap[e.swimmer] = {
            status: 'PRESENT',
            note: '',
          };
        }
      });

      setGroupEnrollments(enrollments);
      setExistingAttendance(attMap);
    } catch (err) {
      console.error(err);
      toast.error('خطا در بارگذاری دفتر حضور و غیاب جلسه');
    } finally {
      setModalLoading(false);
    }
  };

  // Synchronize URL query params (e.g. ?session_id=... or ?filter=TODAY)
  useEffect(() => {
    const filter = searchParams.get('filter')?.toUpperCase();
    if (filter && ['ALL', 'UNRECORDED', 'TODAY', 'COMPLETED'].includes(filter)) {
      setFilterType(filter);
    }
  }, [searchParams]);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId && sessions.length > 0 && !activeSession) {
      const target = sessions.find((s) => s.id === Number(sessionId));
      if (target) {
        handleOpenAttendanceSheet(target);
      }
    }
  }, [searchParams, sessions, activeSession]);

  // Status Change in Attendance Sheet
  const handleStatusChange = (swimmerId, status) => {
    setExistingAttendance((prev) => ({
      ...prev,
      [swimmerId]: {
        ...prev[swimmerId],
        status,
      },
    }));
  };

  // Note Change in Attendance Sheet
  const handleNoteChange = (swimmerId, note) => {
    setExistingAttendance((prev) => ({
      ...prev,
      [swimmerId]: {
        ...prev[swimmerId],
        note,
      },
    }));
  };

  // Save Attendance Sheet
  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    if (!activeSession) return;

    const records = Object.entries(existingAttendance).map(([swimmerId, data]) => ({
      swimmer_id: Number(swimmerId),
      status: data.status,
      note: data.note,
    }));

    try {
      setSavingAttendance(true);
      await api.post('/attendance/bulk-save/', {
        session_id: activeSession.id,
        records,
      });

      toast.success('دفتر حضور و غیاب ثبت و سهمیه شناگران با موفقیت به‌روزرسانی شد.');
      setActiveSession(null);
      fetchSessions();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در ثبت حضور و غیاب');
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleExportCsv = () => {
    const rows = sessions.map((s) => ({
      group: s.group_name,
      coach: s.coach_name,
      date: new Date(s.session_date).toLocaleDateString('fa-IR'),
      time: `${s.start_time?.slice(0, 5)} - ${s.end_time?.slice(0, 5)}`,
      location: s.pool_location,
      status: s.status_display,
    }));
    exportToCsv('IranSwim_Sessions_Attendance', rows, {
      group: 'گروه آموزشی',
      coach: 'مربی مسئول',
      date: 'تاریخ برگزاری',
      time: 'ساعت',
      location: 'استخر / لاین',
      status: 'وضعیت جلسه',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-sky-600" />
            دفتر حضور و غیاب، مدیریت جلسات و کسر سهمیه
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            پشتیبانی از وضعیت‌های پنج‌گانه (حاضر، غایب غیرموجه، غایب موجه، تأخیر و ثبت‌نشده) و کسر هوشمند جلسات
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={handleExportCsv} className="gap-1.5 text-xs">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>خروجی اکسل گزارش جلسات</span>
          </Button>

          {/* Filter Pills */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterType === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              همه جلسات
            </button>
            <button
              type="button"
              onClick={() => setFilterType('UNRECORDED')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterType === 'UNRECORDED'
                  ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              ثبت‌نشده‌ها ⚠️
            </button>
            <button
              type="button"
              onClick={() => setFilterType('TODAY')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterType === 'TODAY'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              جلسات امروز
            </button>
          </div>
        </div>
      </div>

      {/* Sessions Attendance List */}
      {loading ? (
        <LoadingState type="table" rows={6} message="در حال دریافت جلسات کلاسی..." />
      ) : sessions.length === 0 ? (
        <EmptyState
          title="جلسه‌ای برای نمایش یافت نشد"
          description="با تغییر فیلترها، جلسات آموزشی و دفتر ثبت حضور در این قسمت نمایش داده می‌شوند."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-right min-w-[650px]">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 rounded-r-xl">گروه کلاسی</th>
                  <th className="px-4 py-3.5">مربی مسئول</th>
                  <th className="px-4 py-3.5">تاریخ برگزاری</th>
                  <th className="px-4 py-3.5">زمان سانس</th>
                  <th className="px-4 py-3.5">محل استخر</th>
                  <th className="px-4 py-3.5">وضعیت جلسه</th>
                  <th className="px-4 py-3.5 text-center rounded-l-xl">دفتر حضور</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-100">
                      {session.group_name}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300">
                      {session.coach_name}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {new Date(session.session_date).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {session.start_time?.slice(0, 5)} تا {session.end_time?.slice(0, 5)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                      {session.pool_location}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          session.status === 'COMPLETED'
                            ? 'success'
                            : session.status === 'CANCELLED'
                            ? 'danger'
                            : 'info'
                        }
                      >
                        {session.status_display}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenAttendanceSheet(session)}
                        className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 font-semibold text-xs border border-sky-200 dark:border-sky-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        <span>ثبت / بازبینی حضور</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3 text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {session.group_name}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                      مربی: {session.coach_name || 'نامشخص'}
                    </p>
                  </div>
                  <Badge
                    variant={
                      session.status === 'COMPLETED'
                        ? 'success'
                        : session.status === 'CANCELLED'
                        ? 'danger'
                        : 'info'
                    }
                  >
                    {session.status_display}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[10px]">تاریخ</span>
                    <span className="font-mono text-slate-700 dark:text-slate-200 font-semibold">
                      {new Date(session.session_date).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">زمان سانس</span>
                    <span className="font-mono text-slate-700 dark:text-slate-200">
                      {session.start_time?.slice(0, 5)} تا {session.end_time?.slice(0, 5)}
                    </span>
                  </div>
                  {session.pool_location && (
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[10px]">محل استخر</span>
                      <span className="text-slate-600 dark:text-slate-300">{session.pool_location}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                  <button
                    type="button"
                    onClick={() => handleOpenAttendanceSheet(session)}
                    className="w-full py-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 font-semibold border border-sky-200 dark:border-sky-800 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    <span>ثبت / بازبینی حضور و غیاب</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Live Attendance Sheet Register */}
      <Modal
        isOpen={!!activeSession}
        onClose={() => setActiveSession(null)}
        title={`دفتر حضور و غیاب جلسه: ${activeSession?.group_name} (${activeSession?.session_date})`}
      >
        <form onSubmit={handleSaveAttendance} className="space-y-4">
          <div className="bg-sky-50 dark:bg-sky-950/40 p-3 rounded-xl border border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-200 flex items-center justify-between">
            <div>
              <span className="font-bold">مربی مسئول: </span>
              <span>{activeSession?.coach_name}</span>
            </div>
            <div className="font-mono">
              سانس: {activeSession?.start_time?.slice(0, 5)} تا {activeSession?.end_time?.slice(0, 5)}
            </div>
          </div>

          {modalLoading ? (
            <LoadingState type="inline" message="در حال بارگذاری لیست شاگردان این کلاس..." />
          ) : groupEnrollments.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              هیچ شناگری در این گروه ثبت‌نام قطعی ندارد.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {groupEnrollments.map((enr) => {
                const currentStatus = existingAttendance[enr.swimmer]?.status || 'PRESENT';
                const currentNote = existingAttendance[enr.swimmer]?.note || '';

                return (
                  <div
                    key={enr.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-100 block">
                        {enr.swimmer_name}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {enr.remaining_sessions} جلسه باقی‌مانده از {enr.sessions_purchased}
                      </span>
                    </div>

                    {/* Status Select Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { key: 'PRESENT', label: 'حاضر', color: 'bg-emerald-600 text-white' },
                        { key: 'LATE', label: 'با تأخیر', color: 'bg-amber-600 text-white' },
                        { key: 'EXCUSED', label: 'موجه (بدون کسر)', color: 'bg-sky-600 text-white' },
                        { key: 'ABSENT', label: 'غایب', color: 'bg-rose-600 text-white' },
                      ].map((st) => (
                        <button
                          key={st.key}
                          type="button"
                          onClick={() => handleStatusChange(enr.swimmer, st.key)}
                          className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                            currentStatus === st.key
                              ? `${st.color} shadow-2xs`
                              : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>

                    {/* Note Input */}
                    <div className="w-full sm:w-44">
                      <input
                        type="text"
                        placeholder="یادداشت مربی یا علت غیبت..."
                        value={currentNote}
                        onChange={(e) => handleNoteChange(enr.swimmer, e.target.value)}
                        className="w-full px-2.5 py-1 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-[11px] text-slate-500 dark:text-slate-400">
            قانون هوشمند سهمیه: وضعیت‌های «حاضر»، «تأخیر» و «غایب» یک جلسه از سهمیه شناگر کسر می‌کنند؛ وضعیت «غایب موجه» سهمیه‌ای کسر نمی‌کند.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setActiveSession(null)}>
              انصراف
            </Button>
            <Button type="submit" disabled={savingAttendance || groupEnrollments.length === 0}>
              {savingAttendance ? 'در حال ثبت...' : 'ثبت و نهایی‌سازی حضور و غیاب'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
