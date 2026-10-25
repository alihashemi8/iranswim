import React, { useState, useEffect } from 'react';
import {
  Users, BookOpen, CreditCard, TrendingUp, AlertCircle,
  Calendar, CheckCircle2, Clock, UserCheck, ShieldAlert,
  Award, ArrowUpRight, ArrowLeft, DollarSign, Bell
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { StatsCard } from '../../components/common/StatsCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { BarChart, ProgressBar, SparklineAreaChart } from '../../components/common/Charts';
import { useToast } from '../../context/ToastContext';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [finance, setFinance] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [overdueInstallments, setOverdueInstallments] = useState([]);
  const [pendingRecords, setPendingRecords] = useState([]);
  const [todaySessions, setTodaySessions] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchDashboardHub = async () => {
      try {
        setLoading(true);
        const [
          healthRes,
          financeRes,
          reqsRes,
          overdueRes,
          recordsRes,
          todaySessionsRes,
          coachesRes,
        ] = await Promise.all([
          api.get('/supervisor/health/'),
          api.get('/finance/summary/'),
          api.get('/education/requests/?status=PENDING'),
          api.get('/finance/installments/?overdue=true'),
          api.get('/assessments/records/'),
          api.get(`/scheduling/sessions/?date=${todayStr}`),
          api.get('/coaches/?status=ACTIVE'),
        ]);

        setStats(healthRes.data.system_stats);
        setFinance(financeRes.data);
        setPendingRequests(reqsRes.data.results || reqsRes.data);
        setOverdueInstallments(overdueRes.data.results || overdueRes.data);
        
        const allRecords = recordsRes.data.results || recordsRes.data;
        setPendingRecords(allRecords.filter((r) => r.verification_status === 'PENDING'));

        setTodaySessions(todaySessionsRes.data.results || todaySessionsRes.data);
        setCoaches(coachesRes.data.results || coachesRes.data);
      } catch (err) {
        console.error(err);
        toast.error('خطا در دریافت اطلاعات پیشخوان مدیریتی آموزشگاه');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardHub();
  }, []);

  if (loading && !stats) {
    return <LoadingState message="در حال دریافت اطلاعات مرکز فرماندهی آموزشگاه شنا..." />;
  }

  const formatPrice = (val) => Number(val || 0).toLocaleString('fa-IR');

  // Weekly registrations chart
  const weeklyEnrollmentsData = [
    { label: 'شنبه', value: 8 },
    { label: 'یکشنبه', value: 14 },
    { label: 'دوشنبه', value: 12 },
    { label: 'سه‌شنبه', value: 19 },
    { label: 'چهارشنبه', value: 24 },
    { label: 'پنج‌شنبه', value: 16 },
  ];

  // Financial comparative bar
  const financeBreakdownData = [
    { label: 'صورتحساب‌های صادرشده', value: Number(finance?.total_invoiced || 0) / 1000000 },
    { label: 'درآمد واقعاً وصول‌شده', value: Number(finance?.total_paid || 0) / 1000000 },
    { label: 'مانده مطالبات معوق', value: Number(finance?.receivables || 0) / 1000000 },
  ];

  const totalUrgentActionItems =
    pendingRequests.length + overdueInstallments.length + pendingRecords.length;

  return (
    <div className="space-y-6">
      {/* 1. Welcome & Operational Status Banner */}
      <div className="bg-gradient-to-l from-sky-700 via-sky-800 to-cyan-800 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold tracking-wide">
              پیشخوان عملیاتی مدیر
            </span>
            <span className="text-sky-200 text-xs font-mono">
              امروز: {new Date().toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            مرکز کنترل و مدیریت آموزشگاه شنای ایران
          </h1>
          <p className="text-sky-100 text-xs sm:text-sm mt-1 max-w-xl font-light">
            مدیریت افراد، زمان‌بندی گروه‌ها، وصول مطالبات مالی، پیشرفت مهارتی و تصمیم‌گیری‌های عملیاتی روزانه
          </p>
        </div>

        {totalUrgentActionItems > 0 && (
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-amber-950 font-bold flex items-center justify-center shrink-0 shadow-xs text-sm">
              {totalUrgentActionItems}
            </div>
            <div>
              <span className="text-xs font-bold block text-white">مورد نیازمند اقدام فوری</span>
              <span className="text-[11px] text-sky-100">در صف بررسی و پیگیری مدیر</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Operational KPI Cards - Connected to pages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/swimmers?status=active" className="block hover:opacity-95 transition-opacity">
          <StatsCard
            title="شناگران فعال"
            value={`${stats?.active_swimmers ?? 0} نفر`}
            subtitle="دارای پرونده آموزشی فعال"
            icon={Users}
            color="sky"
          />
        </Link>

        <Link to="/admin/coaches?status=ACTIVE" className="block hover:opacity-95 transition-opacity">
          <StatsCard
            title="مربیان فعال"
            value={`${coaches.length} مربی`}
            subtitle="کادر فعال با گروه تخصیص‌یافته"
            icon={UserCheck}
            color="indigo"
          />
        </Link>

        <Link to="/admin/finance" className="block hover:opacity-95 transition-opacity">
          <StatsCard
            title="درآمد وصول‌شده قطعی"
            value={`${formatPrice(finance?.total_paid)} تومان`}
            subtitle={`کل تعهدات فاکتور: ${formatPrice(finance?.total_invoiced)}`}
            icon={CreditCard}
            color="emerald"
          />
        </Link>

        <Link to="/admin/finance?tab=installments" className="block hover:opacity-95 transition-opacity">
          <StatsCard
            title="مطالبات معوق (بدهکاران)"
            value={`${formatPrice(finance?.receivables)} تومان`}
            subtitle={`${overdueInstallments.length} قسط سررسید گذشته`}
            icon={AlertCircle}
            color={overdueInstallments.length > 0 ? 'rose' : 'emerald'}
          />
        </Link>
      </div>

      {/* 3. Urgent Action Center (نیازمند پیگیری فوری مدیر) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              بخش عملیات فوری و پیگیری‌های امروز مدیر
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            رسیدگی سریع به درخواست‌ها و بدهی‌های سررسیدشده
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card A: Pending Registrations */}
          <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-900/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-sky-800 dark:text-sky-200 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-600" />
                  درخواست‌های آنلاین ثبت‌نام
                </span>
                <span className="px-2 py-0.5 rounded-full bg-sky-200 text-sky-800 font-bold text-xs font-mono">
                  {pendingRequests.length}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                متقاضیانی که فرم ثبت‌نام دوره‌ها را از طریق سایت تکمیل کرده و در انتظار تأیید هستند.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-sky-200/60 dark:border-sky-900/60">
              <Link
                to="/admin/enrollments"
                className="w-full text-center block py-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
              >
                بررسی و تأیید درخواست‌ها ({pendingRequests.length}) ←
              </Link>
            </div>
          </div>

          {/* Card B: Overdue Installments & Debtors */}
          <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  اقساط سررسید گذشته (بدهکاران)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-800 font-bold text-xs font-mono">
                  {overdueInstallments.length}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                اقساطی که موعد پرداخت آن‌ها فرا رسیده و نیازمند پیگیری تلفنی یا ثبت دستی تسویه هستند.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-rose-200/60 dark:border-rose-900/60">
              <Link
                to="/admin/finance"
                className="w-full text-center block py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
              >
                مشاهده لیست بدهکاران و تسویه ←
              </Link>
            </div>
          </div>

          {/* Card C: Unverified Swimming Records */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  رکوردهای شنا در انتظار تأیید
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 font-bold text-xs font-mono">
                  {pendingRecords.length}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                رکوردهای ثبت‌شده توسط مربیان که برای اعمال در جدول رتبه‌بندی لیگ نیازمند تأیید رسمی داور/مدیر هستند.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-amber-200/60 dark:border-amber-900/60">
              <Link
                to="/admin/assessments"
                className="w-full text-center block py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
              >
                تأیید رسمی رکوردهای مسابقاتی ←
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Today's Pool Classes Schedule */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              برنامه سانس‌های کلاس امروز استخر ({todaySessions.length} سانس)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              مربیان حاضر، زمان‌بندی دقیق و وضعیت حضور و غیاب هر جلسه کلاسی
            </p>
          </div>
          <Link to="/admin/attendance" className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline">
            دفتر ثبت حضور و غیاب کلاسی ←
          </Link>
        </div>

        {todaySessions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            امروز هیچ سانس کلاسی زمان‌بندی نشده است یا کلیه جلسات خاتمه یافته‌اند.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 rounded-r-xl">گروه کلاسی</th>
                    <th className="px-4 py-3">مربی مسئول</th>
                    <th className="px-4 py-3">زمان سانس</th>
                    <th className="px-4 py-3">محل استخر / لاین</th>
                    <th className="px-4 py-3">وضعیت برگزاری</th>
                    <th className="px-4 py-3 text-center rounded-l-xl">اقدام سریع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {todaySessions.map((session) => (
                    <tr key={session.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">
                        {session.group_name}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">
                        {session.coach_name}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {session.start_time?.slice(0, 5)} تا {session.end_time?.slice(0, 5)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {session.pool_location}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={session.status === 'COMPLETED' ? 'success' : session.status === 'CANCELLED' ? 'danger' : 'info'}>
                          {session.status_display}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          to="/admin/attendance"
                          className="px-2.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 font-semibold text-xs border border-sky-200 dark:border-sky-800 transition-colors inline-flex items-center gap-1 shadow-2xs"
                        >
                          ثبت حضور
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {todaySessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700 space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {session.group_name}
                    </span>
                    <Badge variant={session.status === 'COMPLETED' ? 'success' : session.status === 'CANCELLED' ? 'danger' : 'info'}>
                      {session.status_display}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">مربی مسئول:</span>
                      <span className="font-medium">{session.coach_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">ساعت سانس:</span>
                      <span className="font-mono">{session.start_time?.slice(0, 5)} تا {session.end_time?.slice(0, 5)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">محل استخر:</span>
                      <span>{session.pool_location}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700">
                    <Link
                      to="/admin/attendance"
                      className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    >
                      ثبت حضور و غیاب کلاس
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 5. Analytics Visuals: Registrations Trend & Capacity Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-600" />
                روند پذیرش شناگران در طول روزهای هفته
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                توزیع متقاضیان شنا بر اساس روزهای برگزاری کلاس‌ها
              </p>
            </div>
            <Badge variant="info">هفته جاری</Badge>
          </div>

          <BarChart
            data={weeklyEnrollmentsData}
            color="sky"
            valueFormatter={(v) => `${v} نفر`}
          />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              تکمیل ظرفیت لاین‌های استخر
            </h2>
            <div className="space-y-4">
              <ProgressBar
                label="ظرفیت لاین نونهالان و آشنایی با آب"
                value={18}
                max={20}
                color="sky"
                subtitle="۱۸ از ۲۰ شناگر پر شده است"
              />
              <ProgressBar
                label="دوره پیشرفته و تکنیک چهار سبک"
                value={14}
                max={15}
                color="emerald"
                subtitle="۱۴ از ۱۵ نفر - تکمیل ظرفیت"
              />
              <ProgressBar
                label="کلاس آمادگی نجات غریق و لیگ"
                value={6}
                max={10}
                color="amber"
                subtitle="۶ از ۱۰ نفر - ۴ جای خالی باقی‌مانده"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
            <Link
              to="/admin/courses"
              className="w-full text-center block py-2 px-3 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 rounded-xl transition-colors"
            >
              مدیریت و تعریف گروه‌های جدید ←
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
