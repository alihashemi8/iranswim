import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ClipboardCheck, Check, Save, UserCheck, AlertCircle,
  Calendar, Clock, MapPin, Users, CheckCheck, RefreshCw,
  Search, ArrowRight
} from 'lucide-react';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { CustomSelect } from '../../components/common/CustomSelect';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';

export const CoachAttendancePage = () => {
  const [searchParams] = useSearchParams();
  const urlSessionId = searchParams.get('session_id');
  const urlGroupId = searchParams.get('group_id');

  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(urlSessionId || '');
  const [swimmers, setSwimmers] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingSwimmers, setLoadingSwimmers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const toast = useToast();

  // 1. Fetch Coach's Sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoadingSessions(true);
        const res = await api.get('/scheduling/sessions/');
        const list = res.data.results || res.data || [];
        setSessions(list);

        if (urlSessionId) {
          setSelectedSessionId(urlSessionId);
        } else if (urlGroupId) {
          const match = list.find((s) => s.group === Number(urlGroupId));
          if (match) setSelectedSessionId(match.id);
          else if (list.length > 0) setSelectedSessionId(list[0].id);
        } else if (list.length > 0) {
          setSelectedSessionId(list[0].id);
        }
      } catch (err) {
        console.error('Error fetching sessions:', err);
        toast.error('خطا در دریافت برنامه‌های کلاسی مربی');
      } finally {
        setLoadingSessions(false);
      }
    };
    fetchSessions();
  }, [urlSessionId, urlGroupId]);

  // 2. Fetch Swimmers for selected session
  useEffect(() => {
    if (!selectedSessionId) return;

    const fetchSessionSwimmers = async () => {
      try {
        setLoadingSwimmers(true);
        setSavedSuccess(false);
        const sess = sessions.find((s) => s.id === Number(selectedSessionId));
        if (!sess) return;

        const [enrRes, attRes] = await Promise.all([
          api.get(`/education/enrollments/?group_id=${sess.group}`),
          api.get(`/attendance/?session_id=${selectedSessionId}`),
        ]);

        const enrollments = enrRes.data.results || enrRes.data || [];
        const currentAtt = attRes.data.results || attRes.data || [];

        const attLookup = {};
        currentAtt.forEach((a) => {
          attLookup[a.swimmer] = { status: a.status, note: a.note || '' };
        });

        const initialMap = {};
        enrollments.forEach((e) => {
          initialMap[e.swimmer] = attLookup[e.swimmer] || {
            status: 'PRESENT',
            note: '',
          };
        });

        setSwimmers(enrollments);
        setAttendanceMap(initialMap);
      } catch (err) {
        console.error('Error fetching session swimmers:', err);
        toast.error('خطا در دریافت لیست شناگران کلاس');
      } finally {
        setLoadingSwimmers(false);
      }
    };

    fetchSessionSwimmers();
  }, [selectedSessionId, sessions]);

  const setStatus = (swimmerId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [swimmerId]: {
        ...prev[swimmerId],
        status,
      },
    }));
  };

  const setNote = (swimmerId, note) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [swimmerId]: {
        ...prev[swimmerId],
        note,
      },
    }));
  };

  // Bulk action: Mark All Present
  const handleMarkAllPresent = () => {
    const updated = { ...attendanceMap };
    swimmers.forEach((s) => {
      updated[s.swimmer] = {
        ...updated[s.swimmer],
        status: 'PRESENT',
      };
    });
    setAttendanceMap(updated);
    toast.success('تمام شناگران این جلسه حاضر علامت‌گذاری شدند.');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSavedSuccess(false);
      const records = Object.keys(attendanceMap).map((swimmerId) => ({
        swimmer_id: Number(swimmerId),
        status: attendanceMap[swimmerId].status,
        note: attendanceMap[swimmerId].note,
      }));

      await api.post('/attendance/bulk-save/', {
        session_id: Number(selectedSessionId),
        records,
      });

      setSavedSuccess(true);
      toast.success('دفتر حضور و غیاب جلسه با موفقیت ثبت و نهایی شد.');
      setTimeout(() => setSavedSuccess(false), 5000);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت حضور و غیاب');
    } finally {
      setSaving(false);
    }
  };

  const currentSession = sessions.find((s) => s.id === Number(selectedSessionId));

  const filteredSwimmers = swimmers.filter((s) =>
    s.swimmer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 coach-panel">
      {/* 1. Header & Session Selection */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-20">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <ClipboardCheck className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
            حضور و غیاب کنار استخر (Poolside)
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            ثبت سریع وضعیت شناگران، یادداشت‌های کلاسی و کسر خودکار جلسات
          </p>
        </div>

        {/* Session Selector */}
        <div className="w-full md:w-80">
          <CustomSelect
            label="انتخاب جلسه تمرینی:"
            value={selectedSessionId}
            onChange={(val) => setSelectedSessionId(val)}
            icon={Calendar}
            placeholder="انتخاب جلسه تمرینی..."
            color="emerald"
            searchable
            options={sessions.map((sess) => ({
              value: sess.id,
              label: sess.group_name,
              description: `${sess.session_date} · ساعت ${sess.start_time?.slice(0, 5)} تا ${sess.end_time?.slice(0, 5)}${sess.pool_location ? ` · ${sess.pool_location}` : ''}`,
            }))}
          />
        </div>
      </div>

      {/* 2. Current Session Summary Card & Quick Actions */}
      {currentSession && (
        <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/60 dark:from-emerald-950/30 dark:to-teal-950/20 p-4 sm:p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-md">
                جلسه فعال
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {currentSession.group_name}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-3.5 text-sm text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5 font-mono font-semibold text-slate-800 dark:text-slate-200">
                <Clock className="w-4 h-4 text-emerald-600" />
                ساعت {currentSession.start_time?.slice(0, 5)} تا {currentSession.end_time?.slice(0, 5)}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                تاریخ: {currentSession.session_date}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                {currentSession.pool_location}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-slate-700 text-sm font-bold border border-emerald-200 dark:border-emerald-800 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <CheckCheck className="w-4.5 h-4.5 text-emerald-600" />
              علامت‌گذاری همه به عنوان حاضر
            </button>
            <Button
              variant="primary"
              size="sm"
              loading={saving}
              onClick={handleSave}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base px-4 py-2.5"
            >
              <Save className="w-4.5 h-4.5" />
              ذخیره نهایی
            </Button>
          </div>
        </div>
      )}

      {/* 3. Swimmers List Table */}
      {loadingSessions || loadingSwimmers ? (
        <LoadingState type="table" rows={6} message="در حال دریافت لیست شناگران کلاس..." />
      ) : swimmers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 text-base text-slate-500 dark:text-slate-400">
          شناگری در این کلاس ثبت‌نام نکرده است.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          {/* Search bar inside list */}
          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="جست‌وجوی شناگر..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-9 pl-3.5 py-2 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
              مجموع: <span className="font-bold text-slate-800 dark:text-slate-200">{swimmers.length}</span> شناگر · حاضرین: <span className="font-bold text-emerald-600 dark:text-emerald-400">{Object.values(attendanceMap).filter(v => v.status === 'PRESENT').length}</span> نفر
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredSwimmers.map((enr) => {
              const cur = attendanceMap[enr.swimmer] || { status: 'PRESENT', note: '' };
              return (
                <div
                  key={enr.id}
                  className="p-4 sm:p-4.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm text-slate-700 dark:text-slate-300 shrink-0">
                      {enr.swimmer_name?.charAt(0) || 'ش'}
                    </div>
                    <div>
                      <Link
                        to={`/coach/progress/${enr.swimmer}`}
                        className="font-bold text-base text-slate-900 dark:text-white hover:text-emerald-600 transition-colors flex items-center gap-1.5"
                      >
                        {enr.swimmer_name}
                      </Link>
                      <span className="text-xs text-slate-500 font-mono mt-0.5 block">
                        سهمیه جلسات: {enr.remaining_sessions} باقیمانده از {enr.sessions_purchased}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Status Toggle Buttons (Poolside touch targets) */}
                    <div className="grid grid-cols-4 sm:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setStatus(enr.swimmer, 'PRESENT')}
                        className={`min-h-[40px] px-4 py-1.5 text-sm rounded-lg font-bold transition-all cursor-pointer ${
                          cur.status === 'PRESENT'
                            ? 'bg-emerald-600 text-white shadow-xs scale-102'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        حاضر
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(enr.swimmer, 'LATE')}
                        className={`min-h-[40px] px-4 py-1.5 text-sm rounded-lg font-bold transition-all cursor-pointer ${
                          cur.status === 'LATE'
                            ? 'bg-amber-500 text-white shadow-xs scale-102'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        تأخیر
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(enr.swimmer, 'EXCUSED')}
                        className={`min-h-[40px] px-4 py-1.5 text-sm rounded-lg font-bold transition-all cursor-pointer ${
                          cur.status === 'EXCUSED'
                            ? 'bg-sky-600 text-white shadow-xs scale-102'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        موجه
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(enr.swimmer, 'ABSENT')}
                        className={`min-h-[40px] px-4 py-1.5 text-sm rounded-lg font-bold transition-all cursor-pointer ${
                          cur.status === 'ABSENT'
                            ? 'bg-rose-600 text-white shadow-xs scale-102'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        غایب
                      </button>
                    </div>

                    {/* Note input */}
                    <input
                      type="text"
                      placeholder="توضیح یا یادداشت..."
                      value={cur.note}
                      onChange={(e) => setNote(enr.swimmer, e.target.value)}
                      className="text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 w-full sm:w-52 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Save Area */}
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            {savedSuccess ? (
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Check className="w-5 h-5" />
                حضور و غیاب جلسه با موفقیت ذخیره و سهمیه جلسات اعضا به‌روزرسانی شد.
              </span>
            ) : (
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                پس از علامت‌گذاری، بر روی دکمه ذخیره نهایی کلیک کنید.
              </span>
            )}

            <Button
              variant="primary"
              size="md"
              loading={saving}
              onClick={handleSave}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base px-5 py-2.5"
            >
              <Save className="w-5 h-5" />
              ذخیره نهایی حضور و غیاب
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
