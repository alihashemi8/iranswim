import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, CreditCard, Award, Trophy, Sparkles, Bell, Pin,
  CheckCircle2, FileText, Clock, MapPin, User, ChevronLeft,
  AlertTriangle, TrendingUp, HelpCircle, Waves, Medal, Timer,
  AlertCircle, Check
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSwimmer } from '../../context/SwimmerContext';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { StatsCard } from '../../components/common/StatsCard';
import { ProgressBar } from '../../components/common/Charts';

export const SwimmerDashboardPage = () => {
  const { user } = useAuth();
  const { activeSwimmer, activeSwimmerId } = useSwimmer();

  const [profile, setProfile] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [records, setRecords] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSwimmerData = async () => {
    try {
      setLoading(true);
      const params = activeSwimmerId ? { swimmer_id: activeSwimmerId } : {};

      const [meRes, enrRes, sessRes, invRes, assRes, recRes, annRes, attRes] = await Promise.allSettled([
        api.get('/swimmers/me/', { params }),
        api.get('/education/enrollments/', { params }),
        api.get('/scheduling/sessions/', { params }),
        api.get('/finance/invoices/', { params }),
        api.get('/assessments/skills/', { params }),
        api.get('/assessments/records/', { params }),
        api.get('/content/announcements/'),
        api.get('/attendance/', { params }),
      ]);

      if (meRes.status === 'fulfilled') setProfile(meRes.value.data);
      if (enrRes.status === 'fulfilled') {
        const d = enrRes.value.data;
        setEnrollments(Array.isArray(d) ? d : d.results || []);
      }
      if (sessRes.status === 'fulfilled') {
        const d = sessRes.value.data;
        setSessions(Array.isArray(d) ? d : d.results || []);
      }
      if (invRes.status === 'fulfilled') {
        const d = invRes.value.data;
        setInvoices(Array.isArray(d) ? d : d.results || []);
      }
      if (assRes.status === 'fulfilled') {
        const d = assRes.value.data;
        setAssessments(Array.isArray(d) ? d : d.results || []);
      }
      if (recRes.status === 'fulfilled') {
        const d = recRes.value.data;
        setRecords(Array.isArray(d) ? d : d.results || []);
      }
      if (annRes.status === 'fulfilled') {
        const d = annRes.value.data;
        setAnnouncements(Array.isArray(d) ? d : d.results || []);
      }
      if (attRes.status === 'fulfilled') {
        const d = attRes.value.data;
        setAttendance(Array.isArray(d) ? d : d.results || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSwimmerData();
  }, [activeSwimmerId]);

  useEffect(() => {
    const handleSwitched = () => fetchSwimmerData();
    window.addEventListener('swimmer:switched', handleSwitched);
    return () => window.removeEventListener('swimmer:switched', handleSwitched);
  }, []);

  if (loading) {
    return <LoadingState type="dashboard" message="در حال آماده‌سازی داشبورد شناگر..." />;
  }

  const swimmerName = profile?.full_name || activeSwimmer?.full_name || user?.full_name || 'شناگر عزیز';
  const totalRemainingSessions = enrollments.reduce((acc, curr) => acc + (curr.remaining_sessions || 0), 0);
  const totalDebt = invoices.reduce((acc, curr) => acc + Number(curr.remaining_balance || 0), 0);
  const formatPrice = (val) => Number(val || 0).toLocaleString('fa-IR');

  // Next Upcoming Session
  const upcomingSessions = sessions.filter((s) => s.status === 'SCHEDULED');
  const nextSession = upcomingSessions.length > 0 ? upcomingSessions[0] : null;

  // Attendance rate & streak calculation
  const totalAttended = attendance.filter((a) => a.status === 'PRESENT').length;
  const totalPastSessions = attendance.length;
  const attendanceRate = totalPastSessions > 0 ? Math.round((totalAttended / totalPastSessions) * 100) : 100;

  // Passed skills & progress
  const passedSkills = assessments.filter((a) => a.status === 'PASSED').length;
  const totalTargetSkills = Math.max(assessments.length, 12);
  const skillProgressPercent = Math.min(100, Math.round((passedSkills / totalTargetSkills) * 100));

  // Best Record
  const verifiedRecords = records.filter((r) => r.verification_status === 'VERIFIED');
  const primaryRecord = verifiedRecords.length > 0 ? verifiedRecords[0] : records.length > 0 ? records[0] : null;

  // Action items (Reminders with coral/amber priority)
  const actionItems = [];
  if (profile && !profile.is_profile_completed) {
    actionItems.push({
      id: 'incomplete_profile',
      title: 'تکمیل مدارک و مشخصات فردی',
      desc: 'جهت صدور کارت تردد استخر و عضویت فدراسیون، پرونده نیازمند بارگذاری مدارک است.',
      link: '/swimmer/documents',
      level: 'warning',
      actionText: 'تکمیل مدارک',
    });
  }
  if (user && !user.is_password_changed) {
    actionItems.push({
      id: 'initial_password',
      title: 'تغییر کلمه عبور اولیه (کد ملی)',
      desc: 'کد ملی اطلاعات قابل افشا است؛ لطفاً کلمه عبور اختصاصی و ایمن برای حساب تعریف فرمایید.',
      link: '/swimmer/settings',
      level: 'danger',
      actionText: 'تعیین رمز قوی',
    });
  }
  if (totalDebt > 0) {
    actionItems.push({
      id: 'debt_payment',
      title: 'تسویه شهریه یا قسط سررسیدشده',
      desc: `مبلغ ${formatPrice(totalDebt)} تومان از شهریه دوره سررسید شده و آماده پرداخت آنلاین است.`,
      link: '/swimmer/finance',
      level: 'finance',
      actionText: 'پرداخت آنلاین',
    });
  }

  return (
    <div className="space-y-6">
      {/* 1. Hero Banner: Vibrant Oceanic Blue Brand Identity with Aquatic Glow */}
      <div className="bg-gradient-to-l from-blue-700 via-sky-600 to-cyan-600 rounded-3xl p-6 sm:p-8 text-white shadow-md shadow-blue-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative overflow-hidden border border-blue-400/30">
        {/* Subtle aquatic background glows */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-cyan-300/20 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/15 backdrop-blur-md rounded-full text-sm font-bold mb-2.5 text-cyan-100 border border-white/20">
            <Waves className="w-4 h-4 text-cyan-200" />
            <span>باشگاه شنا و آکادمی ورزش‌های آبی</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
            سلام، {swimmerName}! 👋
          </h1>
          <div className="flex flex-wrap items-center gap-2.5 mt-2.5 text-sm sm:text-base font-normal text-blue-100">
            <span>سطح ورزشی:</span>
            <span className="font-extrabold text-white bg-white/20 px-2.5 py-0.5 rounded-lg">
              {profile?.level_name || 'سطح مقدماتی ۱'}
            </span>
            <span className="text-blue-200">·</span>
            <span>وضعیت پرونده:</span>
            {profile?.is_profile_completed ? (
              <span className="inline-flex items-center gap-1.5 font-bold text-teal-100 bg-teal-500/25 border border-teal-300/40 px-2.5 py-0.5 rounded-lg text-sm">
                <CheckCircle2 className="w-4 h-4" />
                تکمیل‌شده و فعال
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-bold text-amber-100 bg-amber-500/25 border border-amber-300/40 px-2.5 py-0.5 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4" />
                در انتظار مدارک
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10 self-stretch sm:self-auto">
          <Link
            to="/swimmer/schedule"
            className="flex-1 sm:flex-none px-5 py-3 bg-white text-blue-700 hover:bg-blue-50 rounded-2xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4.5 h-4.5 text-blue-600" />
            <span>برنامه کلاس‌ها</span>
          </Link>
          <Link
            to="/swimmer/documents"
            className="flex-1 sm:flex-none px-5 py-3 bg-white/15 hover:bg-white/25 text-white backdrop-blur-md rounded-2xl text-sm font-bold transition-all border border-white/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileText className="w-4.5 h-4.5 text-cyan-100" />
            <span>پرونده و مدارک</span>
          </Link>
        </div>
      </div>

      {/* 2. Action Required Checklist: Coral / Warm Orange Priority Attention */}
      {actionItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span>کارهای نیازمند اقدام شما</span>
            </h2>
            <span className="text-xs sm:text-sm font-bold font-mono px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/70 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-800">
              {actionItems.length} اقدام ضروری
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {actionItems.map((act) => (
              <div
                key={act.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 shadow-2xs ${
                  act.level === 'danger'
                    ? 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-200/80 dark:border-orange-900/60 border-r-4 border-r-orange-600'
                    : act.level === 'warning'
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/60 border-r-4 border-r-amber-500'
                    : 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/60 border-r-4 border-r-blue-600'
                }`}
              >
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                    {act.level === 'danger' && <span className="w-2.5 h-2.5 rounded-full bg-orange-600 animate-pulse" />}
                    {act.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {act.desc}
                  </p>
                </div>
                <Link
                  to={act.link}
                  className="self-end inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 hover:border-orange-500 shadow-2xs transition-colors cursor-pointer"
                >
                  <span>{act.actionText}</span>
                  <ChevronLeft className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Next Upcoming Session: Swimming Identity with Aquatic Teal Tint */}
      {nextSession ? (
        <div className="bg-gradient-to-l from-teal-50/70 via-slate-50/40 to-white dark:from-teal-950/25 dark:via-slate-900 dark:to-slate-900 p-5 sm:p-6 rounded-3xl border border-teal-200/70 dark:border-teal-900/50 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-teal-300 dark:hover:border-teal-800">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-teal-800 dark:text-teal-200 bg-teal-100/90 dark:bg-teal-950/80 px-2.5 py-0.5 rounded-lg border border-teal-200 dark:border-teal-800 inline-flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  جلسه تمرینی بعدی در استخر
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 font-mono">
                  {nextSession.session_date}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {nextSession.group_name || 'کلاس شنای آکادمی'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 flex flex-wrap items-center gap-3.5 font-medium">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  ساعت {nextSession.start_time?.slice(0, 5)} الی {nextSession.end_time?.slice(0, 5)}
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  مربی: {nextSession.coach_name || 'کادر فنی آکادمی'}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  استخر کاسه اصلی
                </span>
              </p>
            </div>
          </div>
          <Link
            to="/swimmer/schedule"
            className="px-4 py-2.5 text-sm font-bold text-teal-900 dark:text-teal-100 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 rounded-xl border border-teal-200 dark:border-teal-800 transition-colors shadow-2xs flex items-center gap-1.5 self-end md:self-center shrink-0 cursor-pointer"
          >
            <span>مشاهده جزئیات برنامه</span>
            <ChevronLeft className="w-4 h-4 text-teal-600" />
          </Link>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
                در حال حاضر جلسه زمان‌بندی‌شده فعالی ثبت نشده است
              </p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                پس از تخصیص سانس یا شروع دوره جدید، جلسات استخر در اینجا قابل مشاهده خواهند بود.
              </p>
            </div>
          </div>
          <Link
            to="/swimmer/schedule"
            className="text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 shrink-0"
          >
            تقویم هفتگی
          </Link>
        </div>
      )}

      {/* 4. KPI Summary Cards: Balanced Color Semantics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Teal for Swimming Pool Session Quota */}
        <StatsCard
          title="سهمیه ورود به آب"
          value={`${totalRemainingSessions} جلسه`}
          subtitle="سهمیه معتبر ورود به استخر"
          icon={Waves}
          color="teal"
        />

        {/* Soft Violet for Pedagogical Learning & Skills */}
        <StatsCard
          title="مهارت‌های فنی پاس‌شده"
          value={`${passedSkills} مهارت`}
          subtitle="تأیید مربی در کارنامه ورزشی"
          icon={Award}
          color="violet"
        />

        {/* Warm Amber for Discipline, Streak & Attendance */}
        <StatsCard
          title="استمرار و نرخ حضور"
          value={`٪${attendanceRate}`}
          subtitle={`${totalAttended} حضور موفق از ${totalPastSessions} جلسه`}
          icon={TrendingUp}
          color="amber"
        />

        {/* Fresh Green (Settled) or Coral (Overdue Debt) for Financial Status */}
        <StatsCard
          title="وضعیت مالی شهریه"
          value={totalDebt > 0 ? `${formatPrice(totalDebt)} ت` : 'تسویه کامل'}
          subtitle={totalDebt > 0 ? 'دارای قسط سررسیدشده' : 'تمامی اقساط پرداخت‌شده'}
          icon={CreditCard}
          color={totalDebt > 0 ? 'coral' : 'emerald'}
        />
      </div>

      {/* 5. Swimmer Motivation & Performance Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Module A: Swimming Skill Progress (Teal) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-teal-300 dark:hover:border-teal-800 transition-all">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-900/60">
                  <Sparkles className="w-4.5 h-4.5" />
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  مسیر توسعه مهارت‌های شنا
                </h3>
              </div>
              <span className="text-xs sm:text-sm font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-lg border border-teal-200/60">
                {profile?.level_name || 'سطح پایه'}
              </span>
            </div>

            <ProgressBar
              value={passedSkills}
              max={totalTargetSkills}
              label="میزان تسلط بر آیتم‌های تکنیکی"
              subtitle={`${passedSkills} مهارت از ${totalTargetSkills} مهارت مورد نیاز سطح`}
              color="teal"
            />
          </div>

          <Link
            to="/swimmer/progress"
            className="inline-flex items-center justify-between text-sm font-bold text-teal-700 dark:text-teal-300 hover:text-teal-800 pt-1 group"
          >
            <span>مشاهده ماتریس و زنجیره مهارت‌ها</span>
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </Link>
        </div>

        {/* Module B: League, Points & Rewards (Warm Amber) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-300 dark:hover:border-amber-800 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60">
                  <Trophy className="w-4.5 h-4.5" />
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  افتخارات، رتبه و امتیازات
                </h3>
              </div>
              <span className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-lg border border-amber-200/60">
                نشان ورزشی
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200/80 dark:border-amber-900/60 text-xs sm:text-sm font-semibold">
                <Medal className="w-4 h-4 text-amber-600" />
                <span>استمرار تمرین: {attendanceRate >= 80 ? 'نشان زرین حضور' : 'فعال در تمرینات'}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold">
                <Award className="w-4 h-4 text-amber-500" />
                <span>عضویت در فصول لیگ شنا</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              با حضور مستمر و ثبت رکوردهای زمانی، امتیازات خود را در جدول لیگ باشگاه ارتقا دهید.
            </p>
          </div>

          <Link
            to="/swimmer/league"
            className="inline-flex items-center justify-between text-sm font-bold text-amber-700 dark:text-amber-300 hover:text-amber-800 pt-1 group"
          >
            <span>جدول لیگ و رده‌بندی فصلی</span>
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </Link>
        </div>

        {/* Module C: Best Time Records (PB - Primary Blue / Fresh Green) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 dark:hover:border-blue-800 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60">
                  <Timer className="w-4.5 h-4.5" />
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  بهترین رکوردهای ثبت‌شده (PB)
                </h3>
              </div>
              <span className="text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-lg border border-blue-200/60 font-mono">
                {records.length} رکورد
              </span>
            </div>

            {primaryRecord ? (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {primaryRecord.distance_meters} متر {primaryRecord.stroke_display || 'کرال سینه'}
                  </span>
                  <span className="text-sm sm:text-base font-black font-mono text-blue-700 dark:text-blue-300">
                    {primaryRecord.formatted_time || `${primaryRecord.duration_seconds}s`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>تاریخ: {primaryRecord.recorded_at}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    تأیید رسمی کادر داوری
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed py-1">
                هنوز رکورد زمانی رسمی ثبت نشده است؛ در جلسات آزمون تایم‌گیری، بهترین رکوردهای استخر در اینجا قرار می‌گیرد.
              </p>
            )}
          </div>

          <Link
            to="/swimmer/progress"
            className="inline-flex items-center justify-between text-sm font-bold text-blue-700 dark:text-blue-300 hover:text-blue-800 pt-1 group"
          >
            <span>مشاهده نمودار و تاریخچه رکوردها</span>
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </Link>
        </div>
      </div>

      {/* 6. Lower Sections: Latest Coach Assessment & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Latest Coach Assessment (Soft Violet Identity) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400">
                <Award className="w-4.5 h-4.5" />
              </span>
              <span>آخرین ارزیابی‌های فنی و بازخورد مربی</span>
            </h2>
            <Link
              to="/swimmer/progress"
              className="text-sm font-bold text-violet-700 dark:text-violet-300 hover:text-violet-800 flex items-center gap-1"
            >
              <span>مشاهده کارنامه کامل</span>
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>

          {assessments.length > 0 ? (
            <div className="space-y-3">
              {assessments.slice(0, 3).map((ass) => (
                <div
                  key={ass.id}
                  className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border ${
                        ass.status === 'PASSED'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800'
                      }`}
                    >
                      {ass.score ? `${Math.round(ass.score)}` : '—'}
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
                        {ass.skill_name || 'مهارت فنی شنا'}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        مربی ارزیاب: {ass.assessed_by_name || 'کادر فنی'} · تاریخ: {ass.assessed_at || ass.assessment_date}
                      </p>
                    </div>
                  </div>
                  <Badge variant={ass.status === 'PASSED' ? 'success' : 'violet'}>
                    {ass.status_display || (ass.status === 'PASSED' ? 'تأییدشده' : 'در حال تمرین')}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-400">
              هنوز ارزیابی مهارتی برای این شناگر ثبت نشده است.
            </div>
          )}

          {/* Quick Links Navigation Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
            <Link
              to="/swimmer/league"
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 hover:bg-amber-50/60 dark:hover:bg-amber-950/30 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-800 transition-colors flex items-center gap-2.5 text-sm font-bold text-slate-800 dark:text-slate-200"
            >
              <Trophy className="w-4.5 h-4.5 text-amber-500 shrink-0" />
              <span>جدول لیگ و رتبه</span>
            </Link>
            <Link
              to="/swimmer/attendance"
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 hover:bg-teal-50/60 dark:hover:bg-teal-950/30 border border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-800 transition-colors flex items-center gap-2.5 text-sm font-bold text-slate-800 dark:text-slate-200"
            >
              <CheckCircle2 className="w-4.5 h-4.5 text-teal-500 shrink-0" />
              <span>دفترچه حضور و غیاب</span>
            </Link>
            <Link
              to="/swimmer/support"
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-800 transition-colors flex items-center gap-2.5 text-sm font-bold text-slate-800 dark:text-slate-200"
            >
              <HelpCircle className="w-4.5 h-4.5 text-blue-500 shrink-0" />
              <span>ارتباط و پشتیبانی</span>
            </Link>
          </div>
        </div>

        {/* Right: Announcements & News (Coral / Warm Orange Accents for Urgency) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400">
                <Bell className="w-4.5 h-4.5" />
              </span>
              <span>اطلاعیه‌های آکادمی</span>
            </h2>
            <Link
              to="/swimmer/announcements"
              className="text-sm font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400"
            >
              آرشیو پیام‌ها
            </Link>
          </div>

          <div className="space-y-3">
            {announcements.length > 0 ? (
              announcements.slice(0, 3).map((ann) => (
                <div
                  key={ann.id}
                  className={`p-3.5 rounded-2xl border space-y-1.5 transition-all ${
                    ann.is_pinned
                      ? 'bg-orange-50/40 dark:bg-orange-950/20 border-orange-200/80 dark:border-orange-900/60 border-r-4 border-r-orange-500'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 text-sm font-bold text-slate-800 dark:text-slate-100">
                    <span className="truncate flex items-center gap-1.5">
                      {ann.is_pinned && <Pin className="w-3.5 h-3.5 text-orange-500 rotate-45 shrink-0" />}
                      <span>{ann.title}</span>
                    </span>
                    <span className="text-xs text-slate-400 font-mono shrink-0">
                      {new Date(ann.created_at).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {ann.message}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-slate-400">
                اطلاعیه جدیدی ثبت نشده است.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
