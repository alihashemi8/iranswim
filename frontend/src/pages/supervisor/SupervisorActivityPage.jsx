import React, { useState, useEffect } from 'react';
import {
  Users, ShieldAlert, CheckCircle2, Clock, ShieldCheck,
  RefreshCw, Lock, AlertTriangle, KeyRound, UserCheck
} from 'lucide-react';
import api from '../../api/client';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';

export const SupervisorActivityPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  const fetchActivity = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await api.get('/supervisor/activity/');
      setData(res.data);
      if (isManual) {
        toast.success('اطلاعات نشست‌ها و امنیت کاربران به‌روزرسانی شد.');
      }
    } catch (err) {
      console.error(err);
      toast.error('عدم برقراری ارتباط با پایشگر نشست‌ها');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  if (loading && !data) {
    return <LoadingState type="dashboard" message="در حال بررسی نشست‌های فعال، حساب‌های ویژه و تلاش‌های ورود..." />;
  }

  const activeCount = data?.active_sessions_count || 0;
  const failedCount = data?.failed_logins_24h || 0;
  const privileged = data?.privileged_users || [];
  const recentLogins = data?.recent_logins || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">نظارت بر نشست‌ها و امنیت حساب‌ها (User Activity & Access)</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            پایش نشست‌های فعال، تلاش‌های ناموفق احراز هویت و بررسی کاربران دارای دسترسی‌های مدیریتی (Read-Only)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchActivity(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-600' : ''}`} />
            <span>به‌روزرسانی</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
            <Users className="w-4 h-4 text-sky-500" />
            <span>کاربران فعال در ۱۵ دقیقه گذشته:</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {activeCount} کاربر آنلاین
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">نشست‌های احراز هویت‌شده</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>تلاش‌های ناموفق ورود (۲۴ ساعت):</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {failedCount} تلاش
          </div>
          <p className="text-xs text-slate-500">تحت محافظت Rate Limiter</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            <span>حساب‌های دارای دسترسی ویژه:</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {privileged.length} کاربر ویژه
          </div>
          <p className="text-xs text-slate-500">شامل ادمین‌ها و ناظران فنی</p>
        </div>
      </div>

      {/* Privileged Accounts Inspection Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">فهرست حساب‌های ویژه و دسترسی‌های مدیریتی (Privileged Accounts)</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            مشاهده سطوح دسترسی جهت بازرسی امنیتی؛ ناظر فنی مجاز به تغییر اطلاعات تجاری این کاربران نیست.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">نام و نام خانوادگی</th>
                <th className="p-4">شماره تلفن</th>
                <th className="p-4">نقش سامانه</th>
                <th className="p-4">Staff / Superuser</th>
                <th className="p-4">وضعیت حساب</th>
                <th className="p-4">آخرین ورود</th>
                <th className="p-4">تاریخ عضویت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {privileged.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>{u.full_name}</span>
                  </td>
                  <td className="p-4 font-mono text-slate-700 dark:text-slate-300">{u.phone}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                      {u.role_display}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-slate-600 dark:text-slate-400">
                    {u.is_superuser ? 'Superuser' : u.is_staff ? 'Staff' : 'Standard'}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 font-semibold ${
                      u.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {u.is_active ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 dark:text-slate-400">
                    {u.last_login ? new Date(u.last_login).toLocaleString('fa-IR') : 'هرگز'}
                  </td>
                  <td className="p-4 text-slate-500 dark:text-slate-400">
                    {new Date(u.date_joined).toLocaleDateString('fa-IR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
