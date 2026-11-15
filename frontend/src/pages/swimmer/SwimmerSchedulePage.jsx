import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Clock, User, MapPin, AlertCircle, CheckCircle2,
  XCircle, ArrowRightLeft, ShieldAlert, Sparkles, PlusCircle,
  Dumbbell, Utensils, Download, Printer, Users
} from 'lucide-react';
import api from '../../api/client';
import { useSwimmer } from '../../context/SwimmerContext';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { exportPlanToWord, printPlanToPdf } from '../../utils/planExport';

export const SwimmerSchedulePage = () => {
  const { activeSwimmer, activeSwimmerId } = useSwimmer();
  const [sessions, setSessions] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState('SCHEDULE'); // 'SCHEDULE' | 'PLANS'
  const [filter, setFilter] = useState('ALL'); // ALL, UPCOMING, PAST
  const [planFilter, setPlanFilter] = useState('ALL'); // ALL, TRAINING, DIET

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const params = activeSwimmerId ? { swimmer_id: activeSwimmerId } : {};
      const [sessRes, enrRes, plansRes] = await Promise.allSettled([
        api.get('/scheduling/sessions/', { params }),
        api.get('/education/enrollments/', { params }),
        api.get('/swimmers/my-plans/', { params }),
      ]);

      if (sessRes.status === 'fulfilled') {
        const d = sessRes.value.data;
        setSessions(Array.isArray(d) ? d : d.results || []);
      }
      if (enrRes.status === 'fulfilled') {
        const d = enrRes.value.data;
        setEnrollments(Array.isArray(d) ? d : d.results || []);
      }
      if (plansRes.status === 'fulfilled') {
        const d = plansRes.value.data;
        setPlans(Array.isArray(d) ? d : d.results || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [activeSwimmerId]);

  if (loading) {
    return <LoadingState type="table" message="در حال دریافت برنامه زمان‌بندی کلاس‌ها..." />;
  }

  const activeEnrollment = enrollments[0];
  const totalRemaining = enrollments.reduce((acc, curr) => acc + (curr.remaining_sessions || 0), 0);

  const nowStr = new Date().toISOString().split('T')[0];

  const filteredSessions = sessions.filter((s) => {
    if (filter === 'UPCOMING') return s.session_date >= nowStr;
    if (filter === 'PAST') return s.session_date < nowStr;
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge variant="teal">برنامه‌ریزی‌شده</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">برگزارشده</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">لغوشده توسط آموزشگاه</Badge>;
      case 'RESCHEDULED':
        return <Badge variant="coral">جابه‌جاشده</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-900/60">
              <Calendar className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              برنامه کلاس‌ها و زمان‌بندی استخر
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            برنامه تمرینی هفتگی، ساعات حضور، استخر محل برگزاری و وضعیت جلسات
          </p>
        </div>

        {/* Quota status pill */}
        <div className="flex items-center gap-3 bg-teal-50/80 dark:bg-teal-950/50 p-3 rounded-2xl border border-teal-200 dark:border-teal-800">
          <div className="text-right">
            <span className="text-xs sm:text-sm text-teal-700 dark:text-teal-300 font-bold block">
              سهمیه باقیمانده دوره:
            </span>
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono">
              {totalRemaining} جلسه
            </span>
          </div>
          <Link
            to="/swimmer/support"
            className="px-3.5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>درخواست جابه‌جایی یا غیبت</span>
          </Link>
        </div>
      </div>

      {/* Group Info Banner */}
      {activeEnrollment && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-teal-50/60 via-sky-50/40 to-blue-50/40 dark:from-teal-950/30 dark:to-slate-850 border border-teal-200/60 dark:border-teal-900/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {activeEnrollment.group_name?.charAt(0) || 'گ'}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                گروه: {activeEnrollment.group_name} ({activeEnrollment.course_title})
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                مربی دوره: {activeEnrollment.coach_name || 'کادر فنی آکادمی'} · تاریخ ثبت‌نام:{' '}
                {activeEnrollment.created_at?.slice(0, 10)}
              </p>
            </div>
          </div>
          <Badge variant={activeEnrollment.status === 'ACTIVE' ? 'success' : 'neutral'}>
            وضعیت ثبت‌نام: {activeEnrollment.status_display || 'فعال'}
          </Badge>
        </div>
      )}

      {/* Main View Mode Selector (Schedule Sessions vs Training & Nutrition Plans) */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setMainTab('SCHEDULE')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            mainTab === 'SCHEDULE'
              ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>سانس‌ها و جلسات استخر</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('PLANS')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            mainTab === 'PLANS'
              ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          <span>برنامه‌های تمرینی و غذایی من</span>
          {plans.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-teal-600 text-white font-mono font-bold">
              {plans.length}
            </span>
          )}
        </button>
      </div>

      {mainTab === 'SCHEDULE' ? (
        <>
          {/* Filter Tabs */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setFilter('ALL')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                  filter === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                همه جلسات ({sessions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('UPCOMING')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                  filter === 'UPCOMING'
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                جلسات پیش‌رو
              </button>
              <button
                type="button"
                onClick={() => setFilter('PAST')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                  filter === 'PAST'
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                جلسات گذشته
              </button>
            </div>
          </div>

          {/* Sessions List */}
          {filteredSessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSessions.map((sess) => (
                <div
                  key={sess.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-sky-300 dark:hover:border-sky-800 transition-all flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-sm font-black text-sky-700 dark:text-sky-300 font-mono flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {sess.session_date}
                      </span>
                      {getStatusBadge(sess.status)}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                      {sess.group_name || 'کلاس تمرینی شنا'}
                    </h3>

                    <div className="mt-3 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-sky-600" />
                        <span>
                          ساعت {sess.start_time?.slice(0, 5)} الی {sess.end_time?.slice(0, 5)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-sky-600" />
                        <span>مربی مسئول: {sess.coach_name || 'کادر فنی آکادمی'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-sky-600" />
                        <span>محل استخر: مجموعه آبی سرپوشیده ایران‌سویم (خط ۱ و ۲)</span>
                      </div>
                    </div>
                  </div>

                  {sess.status === 'CANCELLED' && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs sm:text-sm text-rose-700 dark:text-rose-300 font-medium">
                      ⚠️ این جلسه به دلیل هماهنگی یا مسابقات لغو شده است و سهمیه‌ای از شناگر کسر نمی‌گردد.
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200">
                جلسه‌ای برای این فیلتر یافت نشد
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                لطفاً فیلتر «همه جلسات» را انتخاب فرمایید.
              </p>
            </div>
          )}
        </>
      ) : (
        /* TRAINING & DIET PLANS VIEW */
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
            <button
              type="button"
              onClick={() => setPlanFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                planFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              همه ({plans.length})
            </button>
            <button
              type="button"
              onClick={() => setPlanFilter('TRAINING')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                planFilter === 'TRAINING'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>تمرینی</span>
            </button>
            <button
              type="button"
              onClick={() => setPlanFilter('DIET')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                planFilter === 'DIET'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>غذایی</span>
            </button>
          </div>

          {plans.filter((p) => planFilter === 'ALL' || p.plan_type === planFilter).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans
                .filter((p) => planFilter === 'ALL' || p.plan_type === planFilter)
                .map((p) => {
                  const isDiet = p.plan_type === 'DIET';

                  return (
                    <div
                      key={p.id}
                      className={`bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border shadow-xs flex flex-col justify-between gap-4 ${
                        isDiet
                          ? 'border-emerald-200 dark:border-emerald-900/60'
                          : 'border-blue-200 dark:border-blue-900/60'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs font-black px-2.5 py-0.5 rounded-md ${
                                isDiet
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              }`}
                            >
                              {isDiet ? 'برنامه غذایی' : 'برنامه تمرینی'}
                            </span>
                            {p.target_type === 'INDIVIDUAL' ? (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                                اختصاصی برای شما
                              </span>
                            ) : p.group_name ? (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                کلاس: {p.group_name}
                              </span>
                            ) : null}
                          </div>

                          <span className="text-xs text-slate-400 font-mono">
                            {p.created_at?.slice(0, 10)}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                          {p.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-slate-500">
                          مربی طراح: {p.coach_name || 'کادر فنی آکادمی'}
                        </p>

                        {isDiet ? (
                          <div className="space-y-2 text-xs sm:text-sm">
                            {p.diet_goal && (
                              <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200">
                                <strong>هدف: </strong> {p.diet_goal}
                              </div>
                            )}
                            {p.breakfast && (
                              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                <strong>صبحانه: </strong> {p.breakfast}
                              </div>
                            )}
                            {p.lunch && (
                              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                <strong>ناهار: </strong> {p.lunch}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2 text-xs sm:text-sm">
                            {p.focus_skills && (
                              <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200">
                                <strong>تمرکز: </strong> {p.focus_skills}
                              </div>
                            )}
                            {p.main_section && (
                              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 font-mono text-xs">
                                <strong>تمرین اصلی: </strong>
                                <p className="line-clamp-2 mt-1">{p.main_section}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Download Buttons for Swimmer */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => exportPlanToWord(p)}
                          className="flex-1 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>دانلود فایل Word</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => printPlanToPdf(p)}
                          className="flex-1 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                          <span>چاپ / ذخیره PDF</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Dumbbell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200">
                هنوز برنامه تمرینی یا غذایی برای شما ثبت نشده است
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                به محض اینکه مربی شما برنامه‌ای ثبت و ارسال نماید، در این بخش قابل مشاهده و دانلود خواهد بود.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
