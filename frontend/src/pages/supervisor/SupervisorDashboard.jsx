import React, { useState, useEffect } from 'react';
import {
  Activity, Bug, Database, Users, ShieldAlert, CheckCircle2,
  Zap, RefreshCw, HardDrive, Clock, Server, GitBranch,
  Radio, ArrowUpRight, AlertTriangle, ShieldCheck
} from 'lucide-react';
import api from '../../api/client';
import { StatsCard } from '../../components/common/StatsCard';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';
import { Link } from 'react-router-dom';

export const SupervisorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  const fetchOverview = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await api.get('/supervisor/overview/');
      setData(res.data);
      if (isManual) {
        toast.success('داشبورد عملیات با موفقیت به‌روزرسانی شد.');
      }
    } catch (err) {
      console.error(err);
      toast.error('عدم برقراری ارتباط با سامانه پایش عملیات سرور');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(() => fetchOverview(false), 20000); // 20s live polling
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return <LoadingState type="dashboard" message="در حال استعلام وضعیت نبض سامانه، دیتابیس و سرویس‌ها..." />;
  }

  const isCritical = data?.system_status === 'CRITICAL';
  const isDegraded = data?.system_status === 'DEGRADED';
  const db = data?.database || { status: 'HEALTHY', latency_ms: 10 };
  const storage = data?.storage || { percent: 30, used_gb: 12, total_gb: 40 };
  const cpuRam = data?.cpu_and_ram || {};
  const uptime = data?.uptime || { human_readable: 'بیش از ۲۴ ساعت' };
  const errors = data?.errors_summary || { unresolved_count: 0, critical_24h: 0 };
  const deploy = data?.deployment || { version: 'v1.2.0', commit_sha: '7f8a92b' };

  return (
    <div className="space-y-6">
      {/* Header & Pulse Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                isCritical ? 'bg-rose-500 animate-ping' : isDegraded ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'
              }`}></span>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">داشبورد عملیات و نظارت فنی (Technical Operations Hub)</h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              رصد جامع سلامت زیرساخت، پایگاه داده، زمان پاسخ‌دهی و پایداری سرویس‌های سامانه IranSwim
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fetchOverview(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-600' : ''}`} />
              <span>به‌روزرسانی زنده</span>
            </button>
            <Link
              to="/supervisor/infrastructure"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-colors"
            >
              <Server className="w-3.5 h-3.5" />
              <span>سخت‌افزار</span>
            </Link>
            <Link
              to="/supervisor/services"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 rounded-xl border border-sky-200 dark:border-sky-800 transition-colors"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>سرویس‌ها</span>
            </Link>
            <Link
              to="/supervisor/test"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 rounded-xl border border-amber-200 dark:border-amber-800 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>شبیه‌ساز خطا</span>
            </Link>
          </div>
        </div>

        {/* Pulse Status Banner */}
        <div className={`p-4 rounded-xl flex items-center justify-between border ${
          isCritical
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            : isDegraded
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
        }`}>
          <div className="flex items-center gap-3">
            {isCritical ? (
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            ) : isDegraded ? (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            )}
            <div>
              <strong className="text-sm font-bold block">{data?.status_label}</strong>
              <span className="text-xs opacity-80">
                بررسی در {new Date(data?.checked_at).toLocaleTimeString('fa-IR')} | Uptime سرور: {uptime.human_readable}
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono font-bold">
            <span className="bg-white/80 dark:bg-black/30 px-2.5 py-1 rounded-md">
              Release: {deploy.version} ({deploy.commit_sha})
            </span>
          </div>
        </div>
      </div>

      {/* KPI 6 Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* DB Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Database className="w-4 h-4 text-sky-500" />
              سلامت پایگاه داده (PostgreSQL)
            </span>
            <span className="font-mono text-emerald-600 font-bold">{db.latency_ms} ms</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{db.status === 'HEALTHY' ? 'اتصال پایدار و سالم' : 'خطا در اتصال'}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">تاخیر کوئری کمتر از ۱۵ میلی‌ثانیه</p>
        </div>

        {/* Active Online Users */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Users className="w-4 h-4 text-indigo-500" />
              کاربران فعال (Online Users)
            </span>
            <span className="text-xs text-sky-600 font-bold">۱۵ دقیقه اخیر</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {data?.active_users} کاربر
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">از مجموع {data?.stats?.total_users} حساب ثبت‌شده</p>
        </div>

        {/* Today's Registrations */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Activity className="w-4 h-4 text-emerald-500" />
              درخواست‌های ثبت‌نام امروز
            </span>
            <span className="text-xs text-emerald-600 font-bold">۲۴ ساعت جاری</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {data?.today_registrations} درخواست
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            پرداخت‌های موفق امروز: {data?.stats?.successful_payments_today || 0}
          </p>
        </div>

        {/* Unresolved Errors */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Bug className="w-4 h-4 text-rose-500" />
              خطاهای بررسی‌نشده (Unresolved)
            </span>
            <Link to="/supervisor/errors" className="text-xs text-sky-600 hover:underline flex items-center gap-0.5">
              <span>مشاهده</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className={errors.unresolved_count > 0 ? 'text-rose-600' : 'text-emerald-600'}>
              {errors.unresolved_count} خطا
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            خطاهای بحرانی امروز: {errors.critical_24h} مورد
          </p>
        </div>

        {/* Disk & Storage */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <HardDrive className="w-4 h-4 text-amber-500" />
              فضای ذخیره‌سازی سرور
            </span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{storage.percent}%</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {storage.used_gb} GB / {storage.total_gb} GB
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            حجم فایل‌های مدیا: {storage.media_size_mb || 15} MB
          </p>
        </div>

        {/* Deployment Marker */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <GitBranch className="w-4 h-4 text-purple-500" />
              نسخه فعال استقرار
            </span>
            <Link to="/supervisor/deployments" className="text-xs text-sky-600 hover:underline flex items-center gap-0.5">
              <span>تاریخچه</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-white truncate">
            {deploy.version}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Commit: {deploy.commit_sha} | Status: {deploy.status}
          </p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          to="/supervisor/infrastructure"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 transition-all group"
        >
          <Server className="w-6 h-6 text-sky-500 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">مانیتورینگ زیرساخت سرور</h3>
          <p className="text-xs text-slate-500 mt-1">مشاهده مصرف CPU، RAM و کانتینرهای داکر</p>
        </Link>

        <Link
          to="/supervisor/services"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group"
        >
          <Radio className="w-6 h-6 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">وضعیت سرویس‌ها و SSL</h3>
          <p className="text-xs text-slate-500 mt-1">پایش اعتبار گواهی SSL، پیامک و بانک</p>
        </Link>

        <Link
          to="/supervisor/errors"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500 transition-all group"
        >
          <Bug className="w-6 h-6 text-rose-500 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">لاگ باگ‌ها و Stack Trace</h3>
          <p className="text-xs text-slate-500 mt-1">بررسی خطاهای ۵۰۰ و علامت‌گذاری رفع مشکل</p>
        </Link>

        <Link
          to="/supervisor/backups"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all group"
        >
          <Database className="w-6 h-6 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">پشتیبان‌گیری پایگاه داده</h3>
          <p className="text-xs text-slate-500 mt-1">ایجاد نسخه پشتیبان دستی و اعتبارسنجی</p>
        </Link>
      </div>
    </div>
  );
};
