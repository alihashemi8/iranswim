import React, { useState, useEffect } from 'react';
import { Activity, Bug, Database, Users, ShieldAlert, CheckCircle2, Clock, Zap } from 'lucide-react';
import api from '../../api/client';
import { StatsCard } from '../../components/common/StatsCard';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { Link } from 'react-router-dom';

export const SupervisorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await api.get('/supervisor/health/');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000); // Poll every 15s for live monitoring
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return <LoadingState message="در حال استعلام وضعیت سلامت سرور و پایگاه داده..." />;
  }

  const isHealthy = data?.database?.status === 'HEALTHY';
  const unresolved = data?.error_monitoring?.unresolved_errors || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="text-xl font-bold text-slate-900">پیشخوان پایش سلامت و نظارت فنی (Supervisor)</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            رصد زنده خطاهای سرور، سلامت دیتابیس PostgreSQL، ردپای تغییرات و وضعیت عملیاتی آموزشگاه
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchHealth}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
          >
            به‌روزرسانی وضعیت
          </button>
          <Link
            to="/supervisor/test"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            تست شبیه‌ساز باگ
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

      {/* Database & Monitoring Health Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-600" />
              جزئیات وضعیت زیرساخت سرور
            </h2>
            <Badge variant={isHealthy ? 'success' : 'danger'}>
              {data?.status === 'OPERATIONAL' ? 'عملیاتی ۱۰۰٪' : 'بررسی فوری'}
            </Badge>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">موتور دیتابیس:</span>
              <span className="font-medium text-slate-800">{data?.database?.engine}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">زمان پینگ کوئری دیتابیس:</span>
              <span className="font-semibold text-emerald-600">{data?.database?.latency_ms} میلی‌ثانیه</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">تعداد دوره‌های آموزشی:</span>
              <span className="font-medium text-slate-800">{data?.system_stats?.courses_count} دوره</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">گروه‌های فعال در حال ثبت‌نام:</span>
              <span className="font-medium text-slate-800">{data?.system_stats?.active_groups} گروه</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">کل جلسات کلاسی ثبت‌شده:</span>
              <span className="font-medium text-slate-800">{data?.system_stats?.total_sessions} جلسه</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">تراکنش‌های مالی موفق:</span>
              <span className="font-semibold text-sky-600">{data?.system_stats?.successful_payments} تراکنش</span>
            </div>
          </div>
        </div>

        {/* Bug Alert & Quick Action */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Bug className="w-4 h-4 text-rose-500" />
                وضعیت مانیتورینگ خطاها
              </h2>
              <Link to="/supervisor/errors" className="text-xs text-sky-600 hover:text-sky-700 font-medium">
                مشاهده همه خطاها ←
              </Link>
            </div>
            {unresolved > 0 ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl mb-4 text-sm text-rose-800">
                <p className="font-medium mb-1">توجه ناظر محترم:</p>
                <p className="text-xs text-rose-700 leading-relaxed">
                  تعداد {unresolved} خطای سرور ثبت شده است که نیاز به بررسی استک‌ترس و تعیین وضعیت رفع دارند.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-4 text-sm text-emerald-800 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-xs text-emerald-700 leading-relaxed">
                  هیچ باگ حل‌نشده‌ای در سامانه وجود ندارد. سیستم در وضعیت پایدار کار می‌کند.
                </p>
              </div>
            )}
            <p className="text-xs text-slate-500 leading-relaxed">
              هر استثنای مدیریت‌نشده در کدهای بک‌اند جنگو بلافاصله توسط Middleware اختصاصی ناظر ضبط شده،
              پارامترهای درخواست فیلتر گردیده و استک‌ترس کامل در پایگاه داده ثبت می‌شود.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
            <Link
              to="/supervisor/errors"
              className="flex-1 text-center py-2 px-3 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors"
            >
              مدیریت و مشاهده باگ‌ها
            </Link>
            <Link
              to="/supervisor/audit"
              className="flex-1 text-center py-2 px-3 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              بررسی لاگ‌های حسابرسی
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
