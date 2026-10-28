import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar, CreditCard, Award, Trophy, Sparkles, Bell, Pin, ShieldAlert,
  CheckCircle2, FileText, ArrowLeft, Clock, MapPin, User, ChevronLeft,
  AlertTriangle, TrendingUp, HelpCircle
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSwimmer } from '../../context/SwimmerContext';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { StatsCard } from '../../components/common/StatsCard';

export const SwimmerDashboardPage = () => {
  const { user } = useAuth();
  const { activeSwimmer, activeSwimmerId } = useSwimmer();
  const navigate = useNavigate();

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

  const swimmerName = profile?.full_name || activeSwimmer?.full_name || user?.full_name || 'شناگر';
  const totalRemainingSessions = enrollments.reduce((acc, curr) => acc + (curr.remaining_sessions || 0), 0);
  const totalDebt = invoices.reduce((acc, curr) => acc + Number(curr.remaining_balance || 0), 0);
  const formatPrice = (val) => Number(val || 0).toLocaleString('fa-IR');

  // Next Upcoming Session
  const upcomingSessions = sessions.filter((s) => s.status === 'SCHEDULED');
  const nextSession = upcomingSessions.length > 0 ? upcomingSessions[0] : null;

  // Attendance rate
  const totalAttended = attendance.filter((a) => a.status === 'PRESENT').length;
  const totalPastSessions = attendance.length;
  const attendanceRate = totalPastSessions > 0 ? Math.round((totalAttended / totalPastSessions) * 100) : 100;

  // Passed skills
  const passedSkills = assessments.filter((a) => a.status === 'PASSED').length;

  // Action items
  const actionItems = [];
  if (profile && !profile.is_profile_completed) {
    actionItems.push({
      id: 'incomplete_profile',
      title: 'تکمیل مدارک و مشخصات فردی',
      desc: 'جهت صدور کارت تردد و عضویت رسمی در فدراسیون، پرونده نیازمند بارگذاری مدارک است.',
      link: '/swimmer/documents',
      level: 'warning',
      actionText: 'تکمیل مدارک',
    });
  }
  if (user && !user.is_password_changed) {
    actionItems.push({
      id: 'initial_password',
      title: 'تغییر کلمه عبور اولیه (کد ملی)',
      desc: 'کد ملی اطلاعات قابل افشا است؛ لطفاً کلمه عبور اختصاصی و امن برای حساب خود تعریف نمایید.',
      link: '/swimmer/settings',
      level: 'danger',
      actionText: 'تعیین رمز قوی',
    });
  }
  if (totalDebt > 0) {
    actionItems.push({
      id: 'debt_payment',
      title: 'تسویه قسط یا شهریه باقیمانده',
      desc: `مبلغ ${formatPrice(totalDebt)} تومان از شهریه دوره سررسید شده و آماده پرداخت آنلاین است.`,
      link: '/swimmer/finance',
      level: 'info',
      actionText: 'پرداخت آنلاین',
    });
  }

  return (
    <div className="space-y-6">
      {/* 1. Hero Banner */}
      <div className="bg-gradient-to-l from-indigo-700 via-sky-600 to-cyan-600 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold mb-2.5 text-cyan-100">
            <Sparkles className="w-3.5 h-3.5" />
            مرکز ورزشی و ارتباط خانواده شناگر
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
            سلام، {swimmerName}! 👋
          </h1>
          <p className="text-indigo-100 text-xs sm:text-sm mt-1.5 max-w-xl font-light leading-relaxed">
            سطح فعلی: <span className="font-bold text-white">{profile?.level_name || 'تعیین‌نشده'}</span> · وضعیت پرونده:{' '}
            <span className="font-bold text-white">
              {profile?.is_profile_completed ? 'تکمیل‌شده و فعال' : 'در انتظار تکمیل مدارک'}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10 self-stretch sm:self-auto">
          <Link
            to="/swimmer/schedule"
            className="flex-1 sm:flex-none px-4 py-2.5 bg-white text-sky-800 hover:bg-sky-50 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-sky-600" />
            <span>برنامه کلاس‌ها</span>
          </Link>
          <Link
            to="/swimmer/documents"
            className="flex-1 sm:flex-none px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white backdrop-blur-md rounded-2xl text-xs font-bold transition-all border border-white/20 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>پرونده و مدارک</span>
          </Link>
        </div>
      </div>

      {/* 2. Action Required Checklist (If any) */}
      {actionItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              کارهای نیازمند اقدام شما
            </h2>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-mono font-bold">
              {actionItems.length} مورد
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {actionItems.map((act) => (
              <div
                key={act.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                  act.level === 'danger'
                    ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                    : act.level === 'warning'
                    ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
                    : 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900/60'
                }`}
              >
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                    {act.title}
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {act.desc}
                  </p>
                </div>
                <Link
                  to={act.link}
                  className="self-end inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 hover:border-sky-500 shadow-2xs transition-colors cursor-pointer"
                >
                  <span>{act.actionText}</span>
                  <ChevronLeft className="w-3.5 h-3.5 text-sky-600" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Next Session Highlight Card */}
      {nextSession ? (
        <div className="bg-gradient-to-r from-cyan-50 via-sky-50 to-blue-50 dark:from-slate-900 dark:to-slate-850 p-5 sm:p-6 rounded-3xl border border-sky-200 dark:border-sky-900/60 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/80 px-2 py-0.5 rounded-lg">
                  جلسه تمرینی بعدی
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {nextSession.session_date}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                {nextSession.group_name || 'کلاس شنا'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  ساعت {nextSession.start_time?.slice(0, 5)} الی {nextSession.end_time?.slice(0, 5)}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-sky-600" />
                  مربی: {nextSession.coach_name || 'کادر فنی آکادمی'}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  استخر شماره ۱ (کاسه اصلی)
                </span>
              </p>
            </div>
          </div>
          <Link
            to="/swimmer/schedule"
            className="px-4 py-2 text-xs font-bold text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-800 hover:bg-sky-100 rounded-xl border border-sky-200 dark:border-sky-800 transition-colors shadow-2xs flex items-center gap-1.5 self-end md:self-center shrink-0 cursor-pointer"
          >
            <span>مشاهده جزئیات برنامه</span>
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-slate-400" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                در حال حاضر جلسه برنامه‌ریزی‌شده جدیدی ندارید
              </p>
              <p className="text-[11px] text-slate-500">
                پس از تخصیص گروه یا آغاز دوره جدید، زمان جلسات در اینجا نمایش داده می‌شود.
              </p>
            </div>
          </div>
          <Link
            to="/swimmer/schedule"
            className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400"
          >
            تقویم هفتگی
          </Link>
        </div>
      )}

      {/* 4. KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title="سهمیه باقیمانده"
          value={`${totalRemainingSessions} جلسه`}
          subtitle="سهمیه مجاز ورود به استخر"
          icon={Calendar}
          color="sky"
        />
        <StatsCard
          title="مهارت‌های پاس‌شده"
          value={`${passedSkills} مهارت`}
          subtitle="تأییدشده توسط مربی"
          icon={Award}
          color="emerald"
        />
        <StatsCard
          title="درصد حضور در جلسات"
          value={`٪${attendanceRate}`}
          subtitle={`${totalAttended} حضور از ${totalPastSessions} جلسه`}
          icon={TrendingUp}
          color="teal"
        />
        <StatsCard
          title="مانده شهریه"
          value={`${formatPrice(totalDebt)} ت`}
          subtitle={totalDebt > 0 ? 'دارای قسط باز' : 'تسویه کامل دوره'}
          icon={CreditCard}
          color={totalDebt > 0 ? 'amber' : 'emerald'}
        />
      </div>

      {/* 5. Lower Sections: Latest Coach Assessment & Latest Record & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Latest Coach Assessment */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-sky-600" />
              آخرین ارزیابی و بازخورد مربی
            </h2>
            <Link
              to="/swimmer/progress"
              className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 flex items-center gap-1"
            >
              <span>مشاهده همه مهارت‌ها</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {assessments.length > 0 ? (
            <div className="space-y-3">
              {assessments.slice(0, 3).map((ass) => (
                <div
                  key={ass.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        ass.status === 'PASSED'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {ass.score ? `${ass.score}` : '—'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {ass.skill_name || 'مهارت فنی شنا'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        مربی: {ass.assessed_by_name || 'کادر فنی'} · تاریخ: {ass.assessment_date}
                      </p>
                    </div>
                  </div>
                  <Badge variant={ass.status === 'PASSED' ? 'success' : 'warning'}>
                    {ass.status_display || (ass.status === 'PASSED' ? 'تأییدشده' : 'نیازمند تمرین')}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              هنوز ارزیابی مهارتی برای این شناگر ثبت نشده است.
            </div>
          )}

          {/* Quick Links Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
            <Link
              to="/swimmer/league"
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-2.5 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>جدول لیگ و رتبه</span>
            </Link>
            <Link
              to="/swimmer/attendance"
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-2.5 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <CheckCircle2 className="w-4 h-4 text-teal-500" />
              <span>دفترچه حضور و غیاب</span>
            </Link>
            <Link
              to="/swimmer/support"
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-2.5 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <HelpCircle className="w-4 h-4 text-sky-500" />
              <span>ارتباط و پشتیبانی</span>
            </Link>
          </div>
        </div>

        {/* Right: Announcements & News */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-sky-600" />
              اطلاعیه‌های آکادمی
            </h2>
            <Link
              to="/swimmer/announcements"
              className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400"
            >
              آرشیو
            </Link>
          </div>

          <div className="space-y-3">
            {announcements.slice(0, 3).map((ann) => (
              <div
                key={ann.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-1"
              >
                <div className="flex items-center justify-between gap-1 text-xs font-bold text-slate-800 dark:text-slate-100">
                  <span className="truncate flex items-center gap-1">
                    {ann.is_pinned && <Pin className="w-3 h-3 text-amber-500 rotate-45" />}
                    {ann.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {new Date(ann.created_at).toLocaleDateString('fa-IR')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {ann.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
