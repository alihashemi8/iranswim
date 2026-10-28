import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, CreditCard, Award, Timer, Sparkles, Bell, Pin, ShieldAlert, CheckCircle2, FileText, ArrowLeft } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { StatsCard } from '../../components/common/StatsCard';
import { ProgressBar } from '../../components/common/Charts';

export const SwimmerPortal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [records, setRecords] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSwimmerData = async () => {
      try {
        setLoading(true);
        const [meRes, enrRes, sessRes, invRes, assRes, recRes, annRes] = await Promise.allSettled([
          api.get('/swimmers/me/'),
          api.get('/education/enrollments/'),
          api.get('/scheduling/sessions/'),
          api.get('/finance/invoices/'),
          api.get('/assessments/skills/'),
          api.get('/assessments/records/'),
          api.get('/content/announcements/'),
        ]);

        if (meRes.status === 'fulfilled') {
          setProfile(meRes.value.data);
        }


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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSwimmerData();
  }, []);

  if (loading) {
    return <LoadingState type="dashboard" message="در حال بارگذاری پرونده شناگر..." />;
  }

  const activeEnrollment = enrollments[0];
  const totalRemainingSessions = enrollments.reduce((acc, curr) => acc + (curr.remaining_sessions || 0), 0);
  const totalDebt = invoices.reduce((acc, curr) => acc + Number(curr.remaining_balance || 0), 0);
  const formatPrice = (val) => Number(val || 0).toLocaleString('fa-IR');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-l from-indigo-600 via-sky-600 to-cyan-600 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/15 backdrop-blur-md rounded-full text-xs sm:text-sm font-bold mb-2 text-cyan-100">
            <Sparkles className="w-4 h-4" />
            شناگر فعال آکادمی
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">پرتال اختصاصی شناگر</h1>
          <p className="text-indigo-100 text-sm sm:text-base mt-2 max-w-xl font-normal leading-relaxed">
            مشاهده سهمیه جلسات باقیمانده، برنامه تمرینی، صورتحساب‌ها و مدارک هویتی
          </p>
        </div>

        <Link
          to="/swimmer/complete-profile"
          className="px-5 py-3 bg-white text-sky-800 hover:bg-sky-50 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <FileText className="w-4 h-4 text-sky-600" />
          <span>{profile?.is_profile_completed ? 'مشاهده و ویرایش مدارک پرونده' : 'تکمیل مدارک و پرونده شناگر'}</span>
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>

      {/* Incomplete Profile Alert Banner */}
      {profile && !profile.is_profile_completed && (
        <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200 dark:border-amber-900/60 rounded-3xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-amber-900 dark:text-amber-200">
                پرونده هویتی و مدارک شناگر ناقص است!
              </h3>
              <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300/90 mt-1 leading-relaxed font-medium">
                جهت صدور کارت تردد استخر، بیمه ورزشی فدراسیون و ثبت‌نام در گروه‌ها، تکمیل فیلدهای ستاره‌دار و آپلود مدارک هویتی الزامی می‌باشد.
              </p>
            </div>
          </div>
          <Link
            to="/swimmer/complete-profile"
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5 shrink-0 self-end sm:self-auto"
          >
            <span>تکمیل فوری پرونده</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      )}


      {/* Announcements Banner for Swimmers */}
      {announcements.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-sky-600" />
              پیام‌ها و اطلاعیه‌های مهم آموزشگاه
            </h2>
            <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              {announcements.length} اعلان
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {announcements.slice(0, 4).map((ann) => (
              <div
                key={ann.id}
                className={`p-4 rounded-xl border transition-colors ${
                  ann.is_pinned
                    ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                    {ann.is_pinned && <Pin className="w-3.5 h-3.5 text-amber-600 rotate-45" />}
                    {ann.title}
                  </span>
                  <span className="text-xs text-slate-400 font-mono font-medium">
                    {new Date(ann.created_at).toLocaleDateString('fa-IR')}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                  {ann.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title="جلسات باقیمانده شما"
          value={`${totalRemainingSessions} جلسه`}
          subtitle="سهمیه مجاز ورود به استخر"
          icon={Calendar}
          color="sky"
        />
        <StatsCard
          title="مهارت‌های پاس‌شده"
          value={`${assessments.filter((a) => a.status === 'PASSED').length} مهارت`}
          subtitle="تأییدشده توسط مربیان"
          icon={Award}
          color="emerald"
        />
        <StatsCard
          title="مانده بدهی شهریه"
          value={`${formatPrice(totalDebt)} تومان`}
          subtitle={totalDebt > 0 ? 'دارای قسط سررسیددار' : 'تسویه کامل'}
          icon={CreditCard}
          color={totalDebt > 0 ? 'amber' : 'emerald'}
        />
        <StatsCard
          title="بهترین رکورد ثبت‌شده"
          value={records[0]?.formatted_time || '—'}
          subtitle={records[0] ? `${records[0].distance_meters}م ${records[0].stroke_display}` : 'بدون رکورد'}
          icon={Timer}
          color="indigo"
        />
      </div>

      {/* Enrolled Courses & Progress Bar */}
      {activeEnrollment && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2 mb-4">
            <div>
              <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 block">دوره آموزشی فعال شما:</span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">{activeEnrollment.course_name}</h2>
              <p className="text-sm font-bold text-sky-600 dark:text-sky-400 mt-0.5">{activeEnrollment.group_name}</p>
            </div>
            <div className="text-left">
              <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 block">مصرف جلسات:</span>
              <span className="font-mono font-black text-slate-800 dark:text-slate-200 text-base sm:text-lg">
                {activeEnrollment.sessions_attended} از {activeEnrollment.sessions_purchased} جلسه
              </span>
            </div>
          </div>

          <div>
            <ProgressBar
              label="پیشرفت جلسات مصرف‌شده دوره"
              value={activeEnrollment.sessions_attended}
              max={activeEnrollment.sessions_purchased}
              color="sky"
              subtitle={`باقیمانده: ${activeEnrollment.remaining_sessions} جلسه مجاز`}
            />
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed font-medium">
              با حضور در هر جلسه کلاسی، سهمیه شما به‌طور خودکار کسر می‌گردد؛ غیبت‌های موجه کسر نخواهند شد.
            </p>
          </div>
        </div>
      )}

      {/* Skills Assessment Roadmap */}
      {assessments.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              سوابق ارزیابی تکنیک‌ها و مهارت‌های آب‌نوردی
            </h3>
            <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              {assessments.length} سرفصل مهارتی
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {assessments.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-colors ${
                  item.status === 'PASSED'
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80'
                    : item.status === 'FAILED'
                    ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/80'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    {item.skill_name}
                  </span>
                  <Badge variant={item.status === 'PASSED' ? 'success' : item.status === 'FAILED' ? 'danger' : 'neutral'}>
                    {item.status_display}
                  </Badge>
                </div>
                <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center justify-between font-medium">
                  <span>سطح: {item.level_name}</span>
                  <span className="font-mono">{item.assessed_at ? new Date(item.assessed_at).toLocaleDateString('fa-IR') : 'در انتظار آزمون'}</span>
                </div>
                {item.notes && (
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 font-medium leading-relaxed">
                    نظر مربی: {item.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout: Schedule & Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Class Sessions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-600" />
              برنامه جلسات پیش‌رو
            </h3>
            <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              {sessions.length} سانس زمان‌بندی‌شده
            </span>
          </div>

          {sessions.length === 0 ? (
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 py-6 text-center">جلسه‌ای در سیستم برنامه‌ریزی نشده است.</p>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 5).map((sess) => (
                <div key={sess.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200 block">{sess.group_name}</span>
                    <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono mt-1 block">
                      {sess.session_date} | ساعت {sess.start_time?.slice(0, 5)} تا {sess.end_time?.slice(0, 5)}
                    </span>
                  </div>
                  <Badge variant={sess.status === 'COMPLETED' ? 'success' : 'info'}>
                    {sess.status_display}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tuition Invoices */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-500" />
              صورتحساب و سوابق شهریه
            </h3>
            <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              {invoices.length} صورتحساب
            </span>
          </div>

          {invoices.length === 0 ? (
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 py-6 text-center">صورتحسابی صادر نشده است.</p>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div key={inv.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="font-mono font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200">{inv.invoice_number}</span>
                    <Badge variant={inv.status === 'PAID' ? 'success' : 'warning'}>
                      {inv.status_display}
                    </Badge>
                  </div>
                  <div className="flex justify-between py-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 border-t border-slate-200/40 dark:border-slate-800">
                    <span className="font-medium">مبلغ کل شهریه:</span>
                    <span className="font-mono font-bold">{formatPrice(inv.total_amount)} تومان</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <span className="font-medium">پرداخت‌شده:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(inv.total_paid)} تومان</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <span className="font-medium">مانده قابل پرداخت:</span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{formatPrice(inv.remaining_balance)} تومان</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};