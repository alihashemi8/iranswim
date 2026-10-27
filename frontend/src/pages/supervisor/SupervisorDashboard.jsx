import React, { useState, useEffect } from 'react';
import { Bug, Database, Users, ShieldAlert, CheckCircle2, Zap, RefreshCw } from 'lucide-react';
import api from '../../api/client';
import { StatsCard } from '../../components/common/StatsCard';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { SparklineAreaChart } from '../../components/common/Charts';
import { useToast } from '../../context/ToastContext';
import { Link } from 'react-router-dom';

export const SupervisorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  const fetchHealth = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await api.get('/supervisor/health/');
      setData(res.data);
      if (isManual) {
        toast.success('وضعیت سلامت سرور با موفقیت به‌روزرسانی شد.');
      }
    } catch (err) {
      console.error(err);
      toast.error('عدم برقراری ارتباط با سرویس پایش سرور');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(() => fetchHealth(false), 20000); // Poll every 20s for live monitoring
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return <LoadingState type="dashboard" message="در حال استعلام وضعیت سلامت سرور و پایگاه داده..." />;
  }

  const isHealthy = data?.database?.status === 'HEALTHY';
  const unresolved = data?.error_monitoring?.unresolved_errors || 0;
  const currentLatency = Number(data?.database?.latency_ms || 2.4);

  // Simulated latency trend based on current DB latency
  const latencyTrend = [
    { label: '۰۴:۰۰', value: Math.max(1.2, currentLatency * 0.8) },
    { label: '۰۸:۰۰', value: Math.max(1.5, currentLatency * 0.9) },
    { label: '۱۲:۰۰', value: Math.max(2.1, currentLatency * 1.3) },
    { label: '۱۴:۰۰', value: Math.max(1.8, currentLatency * 1.1) },
    { label: '۱۶:۰۰', value: Math.max(2.4, currentLatency * 1.2) },
    { label: 'اکنون', value: currentLatency },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">پیشخوان پایش سلامت و نظارت فنی (Supervisor)</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            رصد زنده خطاهای سرور، سلامت دیتابیس PostgreSQL، ردپای تغییرات و وضعیت عملیاتی آموزشگاه
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchHealth(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-600' : ''}`} />
            <span>به‌روزرسانی وضعیت</span>
          </button>
          <Link
            to="/supervisor/test"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-xl border border-amber-200 dark:border-amber-800 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>تست شبیه‌ساز باگ</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="وضعیت پایگاه داده"
          value={isHealthy ? 'سالم و پایدار' : 'نیازمند بررسی'}
          subtitle={`تاخیر پاسخ: ${data?.database?.latency_ms}ms (${data?.database?.engine})`}
          icon={Database}
          color={isHealthy ? 'emerald' : 'rose'}
        />
        <StatsCard
          title="خطاهای ۲۴ ساعت اخیر"
          value={data?.error_monitoring?.total_errors_24h ?? 0}
          subtitle={`بحرانی: ${data?.error_monitoring?.critical_errors_24h ?? 0} مورد`}
          icon={Bug}
          color={(data?.error_monitoring?.total_errors_24h || 0) > 0 ? 'amber' : 'emerald'}
        />
        <StatsCard
          title="باگ‌های باز و رفع‌نشده"
          value={unresolved}
          subtitle="در انتظار بررسی ناظر"
          icon={ShieldAlert}
          color={unresolved > 0 ? 'rose' : 'emerald'}
        />
        <StatsCard
          title="شناگران و مربیان فعال"
          value={`${data?.system_stats?.active_swimmers ?? 0} شناگر`}
          subtitle={`کاربران کل سامانه: ${data?.system_stats?.total_users ?? 0}`}
          icon={Users}
          color="sky"
        />
      </div>

      {/* Database Latency Trend & Health Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-sky-600" />
                روند تاخیر سرور و سلامت دیتابیس
              </h2>
              <Badge variant={isHealthy ? 'success' : 'danger'}>
                {data?.status === 'OPERATIONAL' ? 'عملیاتی ۱۰۰٪' : 'بررسی فوری'}
              </Badge>
            </div>

            {/* Visual SVG Trend Chart */}
            <div className="mb-6">
              <SparklineAreaChart
                title="نمودار پاسخ‌دهی دیتابیس PostgreSQL (میلی‌ثانیه)"
                data={latencyTrend}
                height={130}
                color={isHealthy ? 'emerald' : 'rose'}
                valueFormatter={(v) => `${Number(v).toFixed(1)} ms`}
              />
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">موتور دیتابیس:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{data?.database?.engine}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">زمان پینگ کوئری دیتابیس:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{data?.database?.latency_ms} میلی‌ثانیه</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">تعداد دوره‌های آموزشی:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{data?.system_stats?.courses_count} دوره</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500 dark:text-slate-400">تراکنش‌های مالی موفق:</span>
                <span className="font-semibold text-sky-600 dark:text-sky-400 font-mono">{data?.system_stats?.successful_payments} تراکنش</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bug Alert & Quick Action */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Bug className="w-4 h-4 text-rose-500" />
                وضعیت مانیتورینگ خطاها
              </h2>
              <Link to="/supervisor/errors" className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium">
                مشاهده همه خطاها ←
              </Link>
            </div>
            {unresolved > 0 ? (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl mb-4 text-sm text-rose-800 dark:text-rose-200">
                <p className="font-bold mb-1">توجه ناظر محترم:</p>
                <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                  تعداد {unresolved} خطای سرور ثبت شده است که نیاز به بررسی استک‌ترس و تعیین وضعیت رفع دارند.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl mb-4 text-sm text-emerald-800 dark:text-emerald-200 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                  هیچ باگ حل‌نشده‌ای در سامانه وجود ندارد. سیستم در وضعیت پایدار کار می‌کند.
                </p>
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              هر استثنای مدیریت‌نشده در کدهای بک‌اند جنگو بلافاصله توسط Middleware اختصاصی ناظر ضبط شده،
              پارامترهای درخواست فیلتر گردیده و استک‌ترس کامل در پایگاه داده ثبت می‌شود.
            </p>
          </div>

          <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <Link
              to="/supervisor/errors"
              className="flex-1 text-center py-2.5 px-3 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-xs"
            >
              مدیریت و مشاهده باگ‌ها
            </Link>
            <Link
              to="/supervisor/audit"
              className="flex-1 text-center py-2.5 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              بررسی لاگ‌های حسابرسی
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
