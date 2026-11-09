import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  ClipboardCheck, Check, Save, UserCheck, AlertCircle,
  Calendar, Clock, MapPin, Users, CheckCheck, RefreshCw,
  Search, ArrowRight, FileText, Sparkles, Award
} from 'lucide-react';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { CustomSelect } from '../../components/common/CustomSelect';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';
import { toShamsiDate } from '../../utils/date';

const RATING_OPTIONS = [
  {
    id: 'EXCELLENT',
    label: 'عالی',
    desc: 'تمرکز بالا، دستیابی به اهداف جلسه',
    icon: '🌟',
    activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/25',
    idleClass: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 shadow-xs',
  },
  {
    id: 'GOOD',
    label: 'خوب',
    desc: 'پیشرفت مطلوب و عملکرد رضایت‌بخش',
    icon: '👍',
    activeClass: 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-500/25',
    idleClass: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 shadow-xs',
  },
  {
    id: 'AVERAGE',
    label: 'متوسط',
    desc: 'نیازمند تکرار و توجه بیشتر به تکنیک',
    icon: '⚡',
    activeClass: 'bg-amber-500 text-white border-amber-500 shadow-xs ring-2 ring-amber-500/25',
    idleClass: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 shadow-xs',
  },
  {
    id: 'NEEDS_PRACTICE',
    label: 'نیازمند تمرین بیشتر',
    desc: 'چالش در اجرای سرفصل‌ها و حرکات',
    icon: '⚠️',
    activeClass: 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-500/25',
    idleClass: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 shadow-xs',
  },
];

export const CoachAttendancePage = () => {
  const navigate = useNavigate();
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

  // Session Notes & Evaluation States
  const [sessionNotes, setSessionNotes] = useState('');
  const [coachEvaluation, setCoachEvaluation] = useState('');
  const [sessionRating, setSessionRating] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSavedSuccess, setNotesSavedSuccess] = useState(false);

  const toast = useToast();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/coach/classes');
    }
  };

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

  const currentSession = useMemo(() => {
    return sessions.find((s) => s.id === Number(selectedSessionId));
  }, [sessions, selectedSessionId]);

  const currentShamsi = useMemo(() => {
    return currentSession ? toShamsiDate(currentSession.session_date) : null;
  }, [currentSession]);

  // Sync session notes & evaluation when switching session
  useEffect(() => {
    if (currentSession) {
      setSessionNotes(currentSession.session_notes || '');
      setCoachEvaluation(currentSession.coach_evaluation || '');
      setSessionRating(currentSession.session_rating || '');
      setNotesSavedSuccess(false);
    }
  }, [currentSession?.id]);

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

  // Dedicated save for Session Notes & Evaluation
  const handleSaveSessionNotes = async () => {
    if (!selectedSessionId) return;
    try {
      setSavingNotes(true);
      setNotesSavedSuccess(false);
      await api.patch(`/scheduling/sessions/${selectedSessionId}/`, {
        session_notes: sessionNotes,
        coach_evaluation: coachEvaluation,
        session_rating: sessionRating,
      });

      setSessions((prev) =>
        prev.map((s) =>
          s.id === Number(selectedSessionId)
            ? { ...s, session_notes: sessionNotes, coach_evaluation: coachEvaluation, session_rating: sessionRating }
            : s
        )
      );

      setNotesSavedSuccess(true);
      toast.success('یادداشت و ارزیابی جلسه با موفقیت ثبت شد.');
      setTimeout(() => setNotesSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Error saving session notes:', err);
      toast.error('خطا در ثبت یادداشت و ارزیابی جلسه');
    } finally {
      setSavingNotes(false);
    }
  };

  // Full Save: Attendance + Notes + Evaluation
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
        session_notes: sessionNotes,
        coach_evaluation: coachEvaluation,
        session_rating: sessionRating,
      });

      setSessions((prev) =>
        prev.map((s) =>
          s.id === Number(selectedSessionId)
            ? { ...s, session_notes: sessionNotes, coach_evaluation: coachEvaluation, session_rating: sessionRating }
            : s
        )
      );

      setSavedSuccess(true);
      setNotesSavedSuccess(true);
      toast.success('دفتر حضور و غیاب، یادداشت و ارزیابی جلسه با موفقیت ثبت شد.');
      setTimeout(() => setSavedSuccess(false), 5000);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت حضور و غیاب');
    } finally {
      setSaving(false);
    }
  };

  const filteredSwimmers = swimmers.filter((s) =>
    s.swimmer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Build Shamsi options for dropdown
  const sessionOptions = useMemo(() => {
    return sessions.map((sess) => {
      const shamsi = toShamsiDate(sess.session_date);
      const timeStr = `${sess.start_time?.slice(0, 5)} تا ${sess.end_time?.slice(0, 5)}`;
      return {
        value: sess.id,
        label: shamsi.fullText || sess.session_date,
        badge: timeStr,
        description: `${sess.group_name} · ${shamsi.shortNumeric}${sess.pool_location ? ` · ${sess.pool_location}` : ''}`,
      };
    });
  }, [sessions]);

  return (
    <div className="space-y-6 pb-12 coach-panel">
      {/* 1. Header & Session Selection */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 md:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-20">
        <div className="flex items-start sm:items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer shadow-xs shrink-0 mt-0.5 sm:mt-0 active:scale-95"
            title="بازگشت به صفحه قبل"
          >
            <ArrowRight className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">بازگشت</span>
          </button>

          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600 shrink-0" />
              حضور و غیاب کنار استخر (Poolside)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              ثبت وضعیت شناگران، یادداشت و ارزیابی مربی و کسر خودکار جلسات
            </p>
          </div>
        </div>

        {/* Session Selector (Solar Hijri Date as primary identifier) */}
        <div className="w-full lg:w-96 shrink-0">
          <CustomSelect
            label="انتخاب تاریخ جلسه تمرینی:"
            value={selectedSessionId}
            onChange={(val) => setSelectedSessionId(val)}
            icon={Calendar}
            placeholder="انتخاب تاریخ جلسه..."
            color="emerald"
            searchable
            align="left"
            menuClassName="w-full sm:w-96 sm:min-w-[340px] max-w-[min(480px,calc(100vw-2rem))]"
            options={sessionOptions}
          />
        </div>
      </div>

      {/* 2. Current Session Summary Card */}
      {currentSession && (
        <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/60 dark:from-emerald-950/30 dark:to-teal-950/20 p-4 sm:p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-md">
                جلسه فعال
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {currentSession.group_name}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100/60 dark:bg-emerald-900/40 px-2 py-0.5 rounded-lg">
                <Calendar className="w-4 h-4 text-emerald-600" />
                تاریخ شمسی: {currentShamsi?.fullText} ({currentShamsi?.shortNumeric})
              </span>
              <span className="flex items-center gap-1.5 font-mono font-semibold text-slate-800 dark:text-slate-200">
                <Clock className="w-4 h-4 text-emerald-600" />
                ساعت {currentSession.start_time?.slice(0, 5)} تا {currentSession.end_time?.slice(0, 5)}
              </span>
              {currentSession.pool_location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  {currentSession.pool_location}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-slate-700 text-xs sm:text-sm font-bold border border-emerald-200 dark:border-emerald-800 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <CheckCheck className="w-4.5 h-4.5 text-emerald-600" />
              علامت‌گذاری همه به عنوان حاضر
            </button>
            <Button
              variant="primary"
              size="sm"
              loading={saving}
              onClick={handleSave}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 cursor-pointer shadow-xs"
            >
              <Save className="w-4.5 h-4.5" />
              ذخیره نهایی
            </Button>
          </div>
        </div>
      )}

      {/* 3. Coach Session Notes & Assessment Card */}
      {currentSession && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 md:p-6 shadow-sm space-y-4">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  یادداشت و ارزیابی مربی برای جلسه
                  {currentShamsi?.weekday && (
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      {currentShamsi.weekday}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  سرفصل‌های تمرینی، سطح تسلط گروه و تحلیل کیفیت برگزاری این جلسه
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              {notesSavedSuccess && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
                  <Check className="w-3.5 h-3.5" />
                  یادداشت ثبت شد
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                loading={savingNotes}
                onClick={handleSaveSessionNotes}
                className="gap-1.5 text-xs sm:text-sm font-bold border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-200"
              >
                <Save className="w-4 h-4 text-emerald-600" />
                ذخیره یادداشت و ارزیابی
              </Button>
            </div>
          </div>

          {/* Quick Rating Selector */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              ارزیابی عملکرد کلی کلاس در این جلسه:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {RATING_OPTIONS.map((item) => {
                const isSelected = sessionRating === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSessionRating(isSelected ? '' : item.id)}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-1.5 active:scale-98 ${
                      isSelected ? item.activeClass : item.idleClass
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{item.icon}</span>
                      <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                        {item.label}
                      </span>
                    </div>
                    <span className={`text-[11px] leading-tight ${isSelected ? 'text-white/90' : 'text-slate-500 dark:text-slate-400'}`}>
                      {item.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Textareas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                سرفصل‌های آموزشی و تمرینات انجام‌شده:
              </label>
              <textarea
                rows={3}
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="مثال: تمرین تکنیک هواگیری و پای دوچرخه، ۴ ست ۵۰ متر کرال سینه، مرور استارت و شیرجه..."
                className="w-full text-xs sm:text-sm p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none transition-all shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ارزیابی، بازخورد و توصیه‌های مربی:
              </label>
              <textarea
                rows={3}
                value={coachEvaluation}
                onChange={(e) => setCoachEvaluation(e.target.value)}
                placeholder="مثال: هماهنگی دست و پا در بیشتر شناگران مطلوب بود، نیاز به تمرین بیشتر بر روی چرخش سر در هواگیری در جلسه بعد..."
                className="w-full text-xs sm:text-sm p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none transition-all shadow-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. Swimmers List Table */}
      {loadingSessions || loadingSwimmers ? (
        <LoadingState type="table" rows={6} message="در حال دریافت لیست شناگران کلاس..." />
      ) : swimmers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-base text-slate-500 dark:text-slate-400">
          شناگری در این کلاس ثبت‌نام نکرده است.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
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
                      placeholder="توضیح یا یادداشت شناگر..."
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
                حضور و غیاب، یادداشت و ارزیابی جلسه با موفقیت ذخیره و ثبت نهایی شد.
              </span>
            ) : (
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                پس از علامت‌گذاری و تکمیل یادداشت‌ها، بر روی دکمه ذخیره نهایی کلیک کنید.
              </span>
            )}

            <Button
              variant="primary"
              size="md"
              loading={saving}
              onClick={handleSave}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base px-5 py-2.5 cursor-pointer"
            >
              <Save className="w-5 h-5" />
              ذخیره نهایی حضور و غیاب و ارزیابی
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
