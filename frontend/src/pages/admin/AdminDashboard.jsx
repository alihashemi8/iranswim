import React, { useState, useEffect } from 'react';
import { Users, BookOpen, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';
import api from '../../api/client';
import { StatsCard } from '../../components/common/StatsCard';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { BarChart, ProgressBar } from '../../components/common/Charts';
import { useToast } from '../../context/ToastContext';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [finance, setFinance] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [healthRes, financeRes, reqsRes] = await Promise.all([
          api.get('/supervisor/health/'),
          api.get('/finance/summary/'),
          api.get('/education/requests/?status=PENDING'),
        ]);
        setStats(healthRes.data.system_stats);
        setFinance(financeRes.data);
        setPendingRequests(reqsRes.data.results || reqsRes.data);
      } catch (err) {
        console.error(err);
        toast.error('خطا در دریافت اطلاعات پیشخوان مدیریت آموزشگاه');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading && !stats) {
    return <LoadingState message="در حال دریافت اطلاعات مدیریتی آموزشگاه..." />;
  }

  const formatPrice = (val) => Number(val || 0).toLocaleString('fa-IR');

  // Sample weekly/monthly enrollment activity for visual chart
  const weeklyEnrollments = [
    { label: 'شنبه', value: 8 },
    { label: 'یکشنبه', value: 14 },
    { label: 'دوشنبه', value: 12 },
    { label: 'سه‌شنبه', value: 19 },
    { label: 'چهارشنبه', value: 24 },
    { label: 'پنج‌شنبه', value: 16 },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-l from-sky-600 via-sky-700 to-cyan-700 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">مرکز کنترل و مدیریت آموزشگاه شنا (مدیر)</h1>
          <p className="text-sky-100 text-sm mt-1 max-w-xl font-light">
            نظارت یکپارچه بر ثبت‌نام‌ها، دوره‌های فعال، امور مالی و اقساط، زمان‌بندی جلسات و کادر مربیان
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/admin/enrollments"
            className="px-4 py-2.5 bg-white text-sky-800 hover:bg-sky-50 font-bold rounded-xl text-xs transition-colors shadow-sm inline-flex items-center gap-1.5"
          >
            <span>بررسی درخواست‌های جدید</span>
            <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-mono text-[11px]">
              {pendingRequests.length}
            </span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="شناگران فعال"
          value={`${stats?.active_swimmers ?? 0} نفر`}
          subtitle="دارای دوره آموزشی فعال"
          icon={Users}
          color="sky"
        />
        <StatsCard
          title="کل واریزی‌ها و درآمد"
          value={`${formatPrice(finance?.total_paid)} تومان`}
          subtitle={`تسهیم به فاکتورها: ${finance?.total_paid ? 'قطعی' : '۰'}`}
          icon={CreditCard}
          color="emerald"
        />
        <StatsCard
          title="مطالبات معوق / مانده"
          value={`${formatPrice(finance?.receivables)} تومان`}
          subtitle={`اقساط سررسید گذشته: ${finance?.overdue_installments_count ?? 0} مورد`}
          icon={AlertCircle}
          color={(finance?.overdue_installments_count || 0) > 0 ? 'amber' : 'emerald'}
        />
        <StatsCard
          title="گروه‌های آموزشی فعال"
          value={`${stats?.active_groups ?? 0} گروه`}
          subtitle={`جلسات کلاسی ثبت‌شده: ${stats?.total_sessions ?? 0}`}
          icon={BookOpen}
          color="indigo"
        />
      </div>

      {/* Analytics Visual Section: Weekly Registrations & Capacity Meters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-600" />
                روند ثبت‌نام‌های روزهای اخیر هفته
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                توزیع پذیرش متقاضیان شنا بر حسب روزهای کلاس
              </p>
            </div>
            <Badge variant="info">هفته جاری</Badge>
          </div>

          <BarChart
            data={weeklyEnrollments}
            color="sky"
            valueFormatter={(v) => `${v} نفر`}
          />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              تکمیل ظرفیت استخرها
            </h2>
            <div className="space-y-4">
              <ProgressBar
                label="ظرفیت لاین‌های آموزشی نونهالان"
                value={18}
                max={20}
                color="sky"
                subtitle="۱۸ از ۲۰ شناگر پر شده است"
              />
              <ProgressBar
                label="ظرفیت دوره پیشرفته و تکنیک"
                value={14}
                max={15}
                color="emerald"
                subtitle="۱۴ از ۱۵ نفر در حال تکمیل"
              />
              <ProgressBar
                label="کلاس‌های خصوصی و آمادگی نجات غریق"
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

      {/* Pending Requests Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              درخواست‌های ثبت‌نام آنلاین در انتظار تأیید
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              درخواست‌های ثبت‌شده توسط متقاضیان از طریق پرتال عمومی سایت
            </p>
          </div>
          <Link to="/admin/enrollments" className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline">
            مشاهده همه ({pendingRequests.length}) ←
          </Link>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
            در حال حاضر هیچ درخواست جدیدی در صف انتظار قرار ندارد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 rounded-r-xl">نام متقاضی</th>
                  <th className="px-4 py-3">شماره تماس</th>
                  <th className="px-4 py-3">دوره و گروه</th>
                  <th className="px-4 py-3">تاریخ ثبت</th>
                  <th className="px-4 py-3 text-center rounded-l-xl">اقدام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {pendingRequests.slice(0, 5).map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{req.applicant_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">{req.applicant_phone}</td>
                    <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">{req.course_name} - {req.group_name}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {new Date(req.created_at).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        to="/admin/enrollments"
                        className="px-3 py-1.5 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 font-semibold text-xs rounded-xl border border-sky-200 dark:border-sky-800 transition-colors shadow-2xs"
                      >
                        بررسی و تأیید
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
