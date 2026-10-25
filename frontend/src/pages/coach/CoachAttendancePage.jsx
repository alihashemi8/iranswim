import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Check, Save } from 'lucide-react';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';

export const CoachAttendancePage = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [swimmers, setSwimmers] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingSwimmers, setLoadingSwimmers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoadingSessions(true);
        const res = await api.get('/scheduling/sessions/');
        const list = res.data.results || res.data;
        setSessions(list);
        if (list.length > 0) {
          setSelectedSessionId(list[0].id);
        }
      } catch (err) {
        console.error(err);
        toast.error('خطا در دریافت برنامه‌های کلاسی مربی');
      } finally {
        setLoadingSessions(false);
      }
    };
    fetchSessions();
  }, []);

  useEffect(() => {
    if (!selectedSessionId) return;

    const fetchSessionSwimmers = async () => {
      try {
        setLoadingSwimmers(true);
        setSavedSuccess(false);
        const sess = sessions.find((s) => s.id === Number(selectedSessionId));
        if (!sess) return;

        // Fetch enrolled swimmers in this group
        const [enrRes, attRes] = await Promise.all([
          api.get(`/education/enrollments/?group_id=${sess.group}`),
          api.get(`/attendance/?session_id=${selectedSessionId}`),
        ]);

        const enrollments = enrRes.data.results || enrRes.data;
        const currentAtt = attRes.data.results || attRes.data;

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
        console.error(err);
        toast.error('خطا در دریافت لیست شاگردان کلاس');
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
      toast.success('دفتر حضور و غیاب جلسه با موفقیت ذخیره و سهمیه‌های اعضا کسر گردید.');
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در ثبت حضور و غیاب');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            دفتر حضور و غیاب کلاسی مربی
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            ثبت وضعیت حضور، غیبت موجه یا غیرموجه و به‌روزرسانی هوشمند سهمیه جلسات باقیمانده
          </p>
        </div>

        {/* Session selector dropdown */}
        <div className="w-full sm:w-72">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">انتخاب جلسه کلاسی:</label>
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {sessions.map((sess) => (
              <option key={sess.id} value={sess.id}>
                {sess.group_name} - {sess.session_date} ({sess.start_time?.slice(0, 5)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadingSessions || loadingSwimmers ? (
        <LoadingState message="در حال فراخوانی لیست شاگردان جلسه..." />
      ) : swimmers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
          شناگری در این گروه ثبت‌نام نکرده است.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              لیست شناگران حاضر در این کلاس ({swimmers.length} نفر)
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              * توجه: غیبت موجه از سهمیه کسر نمی‌کند؛ غیبت غیرموجه، حاضر و تأخیر سهمیه را کسر می‌نمایند.
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
            {swimmers.map((enr) => {
              const cur = attendanceMap[enr.swimmer] || { status: 'PRESENT', note: '' };
              return (
                <div key={enr.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white block">{enr.swimmer_name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      جلسات باقیمانده: {enr.remaining_sessions} از {enr.sessions_purchased}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Options */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setStatus(enr.swimmer, 'PRESENT')}
                        className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                          cur.status === 'PRESENT'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        حاضر
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(enr.swimmer, 'LATE')}
                        className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                          cur.status === 'LATE'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        با تأخیر
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(enr.swimmer, 'EXCUSED')}
                        className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                          cur.status === 'EXCUSED'
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        غیبت موجه
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(enr.swimmer, 'ABSENT')}
                        className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                          cur.status === 'ABSENT'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        غیبت غیرموجه
                      </button>
                    </div>

                    {/* Note input */}
                    <input
                      type="text"
                      placeholder="یادداشت مربی..."
                      value={cur.note}
                      onChange={(e) => setNote(enr.swimmer, e.target.value)}
                      className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 w-44 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            {savedSuccess ? (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                حضور و غیاب جلسه با موفقیت ذخیره و سهمیه‌ها به‌روزرسانی شد.
              </span>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500">برای اعمال نهایی، دکمه ذخیره را بفشارید.</span>
            )}
            <Button
              variant="primary"
              size="md"
              loading={saving}
              onClick={handleSave}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره نهایی حضور و غیاب</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
