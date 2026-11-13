import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Users, ClipboardCheck, Award, TrendingUp,
  Clock, MapPin, AlertCircle, CheckCircle2, ArrowLeft,
  ChevronLeft, Bell, BookOpen, MessageSquare, PlusCircle
} from 'lucide-react';
import api from '../../api/client';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';

export const CoachDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.get('/coaches/dashboard-overview/');
        setData(res.data);
      } catch (err) {
        console.error('Error fetching coach dashboard:', err);
        toast.error('خطا در دریافت اطلاعات داشبورد مربی');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingState type="dashboard" message="در حال دریافت برنامه کاری و وضعیت امروز..." />;
  }

  const coach = data?.coach || {};
  const today = data?.today || { sessions: [], sessions_count: 0, next_session: null };
  const stats = data?.stats || {};
  const pendingActions = data?.pending_actions || { unrecorded_sessions: [] };

  return (
    <div className="space-y-6 pb-12 coach-panel">
      {/* 0. Incomplete Profile Alert Banner */}
      {coach && coach.is_profile_completed === false && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm sm:text-base font-bold text-amber-900 dark:text-amber-200">
                پرونده مربیگری شما ناقص است!
              </h4>
              <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                جهت فعال‌سازی صلاحیت برگزاری جلسات و تسویه مالی حق‌الزحمه، تکمیل فرم چندمرحله‌ای پرونده (شامل مدارک مربیگری و شماره شبا) الزامی است.
              </p>
            </div>
          </div>
          <Link
            to="/coach/complete-profile"
            className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 whitespace-nowrap"
          >
            <span>تکمیل مشخصات و مدارک</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-emerald-600 via-teal-600 to-cyan-700 p-6 sm:p-8 text-white shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-sm font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              داشبورد روزانه مربی شنا
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              درود،{' '}
              <Link
                to="/coach/profile"
                className="hover:underline hover:text-emerald-200 transition-colors"
                title="مشاهده پروفایل مربی"
              >
                {coach.full_name || 'مربی گرامی'}
              </Link>
              !
            </h1>
            <p className="text-emerald-100 text-base sm:text-lg mt-1.5 max-w-xl font-normal leading-relaxed">
              برنامه تمرینات، حضور و غیاب کنار استخر و پیشرفت شناگران امروز در یک نگاه.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <Link
              to="/coach/attendance"
              className="flex-1 md:flex-initial justify-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-800 text-sm sm:text-base font-bold shadow-md hover:bg-emerald-50 transition-all active:scale-95 whitespace-nowrap"
            >
              <ClipboardCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
              <span>ثبت حضور و غیاب</span>
            </Link>
            <Link
              to="/coach/workouts"
              className="flex-1 md:flex-initial justify-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700/60 hover:bg-emerald-700 text-white text-sm sm:text-base font-semibold backdrop-blur-sm border border-emerald-400/30 transition-all active:scale-95 whitespace-nowrap"
            >
              <PlusCircle className="w-4.5 h-4.5 shrink-0" />
              <span>طرح تمرین امروز</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Highlight: Next Session Card */}
      {today.next_session ? (
        <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-50/70 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/50 px-3 py-1 rounded-lg">
                <Clock className="w-4 h-4" />
                جلسه بعدی شما امروز
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                {today.next_session.group_name}
                <span className="text-xs sm:text-sm px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                  {today.next_session.skill_level}
                </span>
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  ساعت {today.next_session.start_time} تا {today.next_session.end_time}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  {today.next_session.pool_location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  {today.next_session.enrolled_count} شناگر
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={`/coach/attendance?session_id=${today.next_session.id}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base shadow-md transition-all active:scale-95"
              >
                <ClipboardCheck className="w-5 h-5" />
                شروع جلسه و حضور و غیاب
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">جلسه برنامه‌ریزی‌شده فوری ندارید</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">تمام جلسات ثبت‌شده امروز مربی خاتمه یافته یا برای ساعات آتی جلسه‌ای تنظیم نشده است.</p>
          </div>
        </div>
      )}

      {/* 3. Operational Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link
          to="/coach/attendance"
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">کلاس‌های امروز</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <Calendar className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {today.sessions_count}
          </div>
          <span className="text-xs sm:text-sm text-emerald-600 font-semibold mt-1 inline-block">
            جلسات ثبت‌شده استخر
          </span>
        </Link>

        <Link
          to="/coach/classes"
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-sky-300 dark:hover:border-sky-700 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">شناگران فعال من</span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {stats.total_swimmers_count || 0}
          </div>
          <span className="text-xs sm:text-sm text-sky-600 font-semibold mt-1 inline-block">
            در {stats.active_classes_count || 0} گروه آموزشی
          </span>
        </Link>

        <Link
          to="/coach/attendance?filter=unrecorded"
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-amber-300 dark:hover:border-amber-700 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">حضور و غیاب معوق</span>
            <div className={`p-2 rounded-xl ${stats.unrecorded_attendance_count > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
              <AlertCircle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {stats.unrecorded_attendance_count || 0}
          </div>
          <span className={`text-xs sm:text-sm font-semibold mt-1 inline-block ${stats.unrecorded_attendance_count > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
            {stats.unrecorded_attendance_count > 0 ? 'نیاز به تکمیل ثبت' : 'تمام جلسات ثبت شده'}
          </span>
        </Link>

        <Link
          to="/coach/exams"
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-purple-300 dark:hover:border-purple-700 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">پیشنهاد ارتقا</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600">
              <Award className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {stats.pending_proposals_count || 0}
          </div>
          <span className="text-xs sm:text-sm text-purple-600 font-semibold mt-1 inline-block">
            در انتظار بررسی مدیر
          </span>
        </Link>
      </div>

      {/* 4. Action Items (کارهای نیازمند اقدام) */}
      {pendingActions.unrecorded_sessions && pendingActions.unrecorded_sessions.length > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <AlertCircle className="w-4.5 h-4.5 text-amber-600" />
              کارهای نیازمند اقدام فوری (حضور و غیاب ثبت‌نشده)
            </h2>
            <span className="text-sm text-amber-700 dark:text-amber-300 font-bold">
              {pendingActions.unrecorded_sessions.length} جلسه
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {pendingActions.unrecorded_sessions.map((sess) => (
              <div
                key={sess.id}
                className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/50 shadow-xs flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{sess.group_name}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span>{sess.date}</span>
                    <span>ساعت {sess.start_time}</span>
                  </div>
                </div>
                <Link
                  to={`/coach/attendance?session_id=${sess.id}`}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold transition-all"
                >
                  ثبت
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Today's Full Schedule Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              برنامه زمانی جلسات امروز
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              فهرست جلسات برگزارشده، در حال برگزاری و آتی امروز
            </p>
          </div>
          <Link
            to="/coach/classes"
            className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            مشاهده همه کلاس‌ها
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>

        {today.sessions && today.sessions.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {today.sessions.map((s) => (
              <div
                key={s.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-mono text-sm font-bold text-center min-w-[70px]">
                    {s.start_time}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {s.group_name}
                      <span className="text-xs font-normal px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {s.skill_level}
                      </span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                      <span>{s.course_name}</span>
                      <span>·</span>
                      <span>{s.pool_location}</span>
                      <span>·</span>
                      <span>{s.enrolled_count} شناگر</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  {s.attendance_recorded ? (
                    <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      حضور ثبت‌شده
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs sm:text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-lg font-semibold">
                      در انتظار ثبت
                    </span>
                  )}
                  <Link
                    to={`/coach/attendance?session_id=${s.id}`}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold transition-all"
                  >
                    حضور و غیاب
                  </Link>
                  <Link
                    to={`/coach/classes/${s.group_id}`}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    title="جزئیات کلاس"
                  >
                    <ChevronLeft className="w-4.5 h-4.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-base">
            امروز هیچ جلسه تمرینی برای شما برنامه‌ریزی نشده است.
          </div>
        )}
      </div>

      {/* 6. Coach Shortcuts / Direct Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/coach/workouts"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex items-center gap-4 group"
        >
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 group-hover:scale-105 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">طراحی برنامه تمرین</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">ست‌های گرم‌کردن، اصلی و سردکردن</p>
          </div>
        </Link>

        <Link
          to="/coach/progress"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-all flex items-center gap-4 group"
        >
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">ارزیابی و مهارت‌ها</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">ثبت مهارت و بررسی پیشرفت شناگران</p>
          </div>
        </Link>

        <Link
          to="/coach/messages"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-cyan-300 dark:hover:border-cyan-700 transition-all flex items-center gap-4 group"
        >
          <div className="p-3 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 group-hover:scale-105 transition-transform">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">پیام‌ها و اولیا</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">ارسال اطلاعیه کلاسی و پیگیری</p>
          </div>
        </Link>
      </div>
    </div>
  );
};
