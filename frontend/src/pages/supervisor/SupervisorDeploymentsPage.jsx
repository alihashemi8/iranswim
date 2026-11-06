import React, { useState, useEffect } from 'react';
import {
  GitBranch, CheckCircle2, XCircle, Clock, RefreshCw,
  Layers, ShieldAlert, AlertCircle, ArrowUpRight, Cpu
} from 'lucide-react';
import api from '../../api/client';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';

export const SupervisorDeploymentsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  const fetchDeployments = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await api.get('/supervisor/deployments/');
      setData(res.data);
      if (isManual) {
        toast.success('اطلاعات استقرار با موفقیت به‌روزرسانی شد.');
      }
    } catch (err) {
      console.error(err);
      toast.error('عدم برقراری ارتباط با سرویس استقرار');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDeployments();
  }, []);

  if (loading && !data) {
    return <LoadingState type="dashboard" message="در حال دریافت اطلاعات آخرین پایپ‌لاین‌های گیت‌هاب و کانتینرها..." />;
  }

  const current = data?.current_release || {};
  const history = data?.history || [];
  const pipeline = data?.ci_pipeline || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">مدیریت نسخه و تاریخچه استقرار (Deployments & CI/CD)</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            ردیابی تگ‌های Docker، آخرین کامیت‌های مستقرشده و پایپ‌لاین خودکار GitHub Actions روی سرور پارس‌پک
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchDeployments(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-600' : ''}`} />
            <span>به‌روزرسانی وضعیت</span>
          </button>
        </div>
      </div>

      {/* Active Release Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-sky-200/80 dark:border-sky-900/50 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-sky-500 to-indigo-600"></div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                نسخه فعال (Current Production Release)
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Branch: {current.branch || 'main'}
              </span>
            </div>
            <h2 className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {current.version}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {current.commit_message || 'استقرار خودکار پکیج‌های کانتینری در پارس‌پک'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-1">شناسه Git SHA:</span>
              <strong className="font-mono text-slate-900 dark:text-white text-sm bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                {current.commit_sha}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-1">محیط اجرا:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{current.environment || 'production'}</strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-1">عامل دیپلوی:</span>
              <strong className="text-slate-700 dark:text-slate-200">{current.deployed_by_name || 'GitHub Actions'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* CI/CD & GitHub Actions Workflow Overview */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">پایپ‌لاین خودکار GitHub Actions</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Workflow: <span className="font-mono">{pipeline.workflow}</span> | Registry: <span className="font-mono">{pipeline.registry}</span>
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            اتصال مخزن پایدار
          </span>
        </div>
      </div>

      {/* Deployment History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">تاریخچه استقرارها و تغییرات نسخه</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">سوابق استقرار نسخه‌های بک‌اند و فرانت‌اند در سرور عملیاتی</p>
        </div>

        {history.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
            نشانگر استقرار ثبت‌شده‌ای یافت نشد. استقرار فعلی به عنوان نسخه اولیه ثبت شده است.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4">نسخه</th>
                  <th className="p-4">شناسه کامیت</th>
                  <th className="p-4">پیام تغییرات</th>
                  <th className="p-4">شاخه</th>
                  <th className="p-4">وضعیت</th>
                  <th className="p-4">زمان استقرار</th>
                  <th className="p-4">عامل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">{item.version}</td>
                    <td className="p-4 font-mono text-slate-600 dark:text-slate-300">{item.commit_sha?.slice(0, 7)}</td>
                    <td className="p-4 text-slate-800 dark:text-slate-200 font-medium">{item.commit_message || '-'}</td>
                    <td className="p-4 font-mono text-slate-500">{item.branch}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        {item.status_display || item.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">{new Date(item.deployed_at).toLocaleString('fa-IR')}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">{item.deployed_by_name}</td>
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
