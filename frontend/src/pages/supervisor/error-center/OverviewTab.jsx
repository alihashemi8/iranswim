import React from 'react';
import {
  Activity,
  AlertTriangle,
  Bug,
  CheckCircle2,
  Clock,
  ExternalLink,
  GitBranch,
  Layers,
  RefreshCw,
  Search,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { SparklineAreaChart } from '../../../components/common/Charts';

export const OverviewTab = ({
  statsData,
  loading,
  timeRange,
  setTimeRange,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  onRefresh,
  onViewIssues,
  onViewAlerts,
}) => {
  const stats = statsData?.stats || {};
  const timeseries = statsData?.timeseries || [];
  const latestDeploy = statsData?.latest_deployment;

  const timeRangeOptions = [
    { id: '1h', label: '۱ ساعت گذشته' },
    { id: '6h', label: '۶ ساعت گذشته' },
    { id: '24h', label: '۲۴ ساعت گذشته' },
    { id: '7d', label: '۷ روز گذشته' },
    { id: '30d', label: '۳۰ روز گذشته' },
    { id: 'custom', label: 'بازه دلخواه' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Controls: Time Filter Pills & Refresh */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">بازه زمانی:</span>
          {timeRangeOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTimeRange(opt.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                timeRange === opt.id
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {timeRange === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
            <input
              type="date"
              max={new Date().toISOString().split('T')[0]}
              value={customStart}
              onChange={(e) => {
                const todayStr = new Date().toISOString().split('T')[0];
                if (e.target.value && e.target.value > todayStr) return;
                setCustomStart(e.target.value);
              }}
              className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
            />
            <span className="text-xs text-slate-400">تا</span>
            <input
              type="date"
              max={new Date().toISOString().split('T')[0]}
              value={customEnd}
              onChange={(e) => {
                const todayStr = new Date().toISOString().split('T')[0];
                if (e.target.value && e.target.value > todayStr) return;
                setCustomEnd(e.target.value);
              }}
              className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
            />
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 bg-sky-600 text-white text-xs font-medium rounded-xl hover:bg-sky-700 transition-colors"
            >
              اعمال
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-600' : ''}`} />
            <span>به‌روزرسانی</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Errors 24h */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>کل خطاها (۲۴س)</span>
            <Bug className="w-4 h-4 text-rose-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
            {stats.total_errors_24h ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            {stats.total_errors_window ?? 0} رخداد در بازه
          </div>
        </div>

        {/* Critical Errors */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-rose-100 dark:border-rose-950/60 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-xs font-semibold">
            <span>خطاهای بحرانی</span>
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
            {stats.critical_errors_24h ?? 0}
          </div>
          <div className="text-[11px] text-rose-500/80 truncate">
            Crash یا خطاهای ۵۰۰
          </div>
        </div>

        {/* Unresolved Issues */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-amber-100 dark:border-amber-950/60 shadow-xs space-y-1 cursor-pointer hover:border-amber-300 dark:hover:border-amber-700 transition-colors" onClick={() => onViewIssues('NEW')}>
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <span>در انتظار اقدام</span>
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
            {stats.unresolved_errors ?? 0}
          </div>
          <div className="text-[11px] text-amber-600/80 truncate">
            باگ‌های جدید رفع‌نشده
          </div>
        </div>

        {/* Under Investigation */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-sky-100 dark:border-sky-950/60 shadow-xs space-y-1 cursor-pointer hover:border-sky-300 dark:hover:border-sky-700 transition-colors" onClick={() => onViewIssues('INVESTIGATING')}>
          <div className="flex items-center justify-between text-sky-600 dark:text-sky-400 text-xs font-semibold">
            <span>در حال بررسی</span>
            <Clock className="w-4 h-4 text-sky-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-sky-600 dark:text-sky-400">
            {stats.investigating_errors ?? 0}
          </div>
          <div className="text-[11px] text-sky-600/80 truncate">
            تخصیص‌یافته به کارشناس
          </div>
        </div>

        {/* Resolved Errors */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-emerald-100 dark:border-emerald-950/60 shadow-xs space-y-1 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors" onClick={() => onViewIssues('RESOLVED')}>
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <span>رفع‌شده</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {stats.resolved_errors ?? 0}
          </div>
          <div className="text-[11px] text-emerald-600/80 truncate">
            باگ‌های بررسی و رفع‌شده
          </div>
        </div>

        {/* Error Rate */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>نرخ خطا</span>
            <Activity className="w-4 h-4 text-indigo-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
            {stats.error_rate_percent ?? 0}٪
          </div>
          <div className="text-[11px]">
            <span className={`font-semibold ${
              stats.error_rate_status === 'CRITICAL' ? 'text-rose-600' :
              stats.error_rate_status === 'ELEVATED' ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              {stats.error_rate_status === 'CRITICAL' ? 'بسیار بالا' :
               stats.error_rate_status === 'ELEVATED' ? 'افزایش‌یافته' : 'پایدار و عادی'}
            </span>
          </div>
        </div>
      </div>

      {/* Error Frequency Time-Series Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-500" />
              <span>نمودار فراوانی و توزیع رخدادهای خطا در طول زمان</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تعداد دفعات رخ‌داد خطاها و استثناها بر مبنای داده‌های واقعی لاگ سرور
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">
              مجموع در بازه: <strong className="text-slate-700 dark:text-slate-200">{stats.total_errors_window ?? 0}</strong>
            </span>
          </div>
        </div>

        <SparklineAreaChart
          data={timeseries}
          height={160}
          color="rose"
          title="روند رخ‌داد خطاها"
          subtitle="بر حسب بازه زمانی انتخابی"
          valueFormatter={(v) => `${v} خطا`}
          labelFormatter={(l) => l}
        />
      </div>

      {/* Correlation & Quick Action Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Deployment Correlation Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">آخرین استقرار سامانه (Release Correlation)</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-300">
              <span className="font-bold text-slate-900 dark:text-white">{latestDeploy?.version || 'v1.2.0'}</span>
              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                {latestDeploy?.commit_sha ? latestDeploy.commit_sha.slice(0, 7) : '7f8a92b'}
              </span>
              <span className="text-slate-400">
                {latestDeploy?.deployed_at ? new Date(latestDeploy.deployed_at).toLocaleDateString('fa-IR') : 'اخیراً'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              خطاها به صورت خودکار با نسخه‌های استقرار و کامیت‌های گیت تطبیق داده می‌شوند.
            </p>
          </div>
          <Badge variant="success">استقرار موفق</Badge>
        </div>

        {/* Active Alerts Strip */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">هشدارهای فعال سیستمی</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              تعداد <strong className="font-mono text-amber-600 font-bold">{stats.active_alerts_count ?? 0}</strong> هشدار فعال نیازمند بررسی توسط ناظر
            </p>
            <p className="text-[11px] text-slate-400">
              شامل شروط افزایش ۵۰۰، قطعی دیتابیس و سقف مصرف دیسک
            </p>
          </div>
          <button
            type="button"
            onClick={onViewAlerts}
            className="px-3.5 py-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-semibold hover:bg-amber-100 transition-colors"
          >
            مشاهده هشدارها
          </button>
        </div>
      </div>
    </div>
  );
};
