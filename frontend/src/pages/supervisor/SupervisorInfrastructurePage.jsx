import React, { useState, useEffect } from 'react';
import {
  Server, Cpu, HardDrive, Layers, RefreshCw, CheckCircle2,
  AlertTriangle, Clock, Zap, Network, Shield
} from 'lucide-react';
import api from '../../api/client';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';

export const SupervisorInfrastructurePage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  const fetchMetrics = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await api.get('/supervisor/infrastructure/');
      setData(res.data);
      if (isManual) {
        toast.success('متریک‌های زیرساخت با موفقیت به‌روزرسانی شد.');
      }
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت اطلاعات مانیتورینگ سخت‌افزار');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(() => fetchMetrics(false), 15000); // 15s interval
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return <LoadingState type="dashboard" message="در حال فراخوانی وضعیت زنده پردازنده، حافظه و کانتینرهای سرور..." />;
  }

  const cpu = data?.cpu || { usage_percent: 15, cores: 4, load_avg: [0.3, 0.2, 0.2] };
  const ram = data?.ram || { total_mb: 8192, used_mb: 3200, free_mb: 4992, percent: 39 };
  const disk = data?.disk || { total_gb: 40, used_gb: 12, free_gb: 28, percent: 30, media_size_mb: 15 };
  const containers = data?.containers || [];
  const uptime = data?.uptime || { human_readable: 'بیش از ۲۴ ساعت' };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">مانیتورینگ سخت‌افزار و زیرساخت سرور (Infrastructure)</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            پایش لحظه‌ای پردازنده (CPU)، مصرف رم، پارتیشن‌های دیسک و سلامت کانتینرهای داکر سرور پارس‌پک
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchMetrics(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-600' : ''}`} />
            <span>بررسی مجدد</span>
          </button>
        </div>
      </div>

      {/* Hardware Gauge Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CPU Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold text-sm">
              <Cpu className="w-5 h-5 text-indigo-500" />
              <span>پردازنده (CPU Usage)</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              cpu.usage_percent > 85 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400' :
              cpu.usage_percent > 70 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400' :
              'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
            }`}>
              {cpu.usage_percent}%
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                cpu.usage_percent > 85 ? 'bg-rose-500' : cpu.usage_percent > 70 ? 'bg-amber-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, cpu.usage_percent))}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800/80 text-slate-500 dark:text-slate-400">
            <div>
              <span>هسته‌ها: </span>
              <strong className="text-slate-700 dark:text-slate-200">{cpu.cores} Core</strong>
            </div>
            <div>
              <span>Load Avg: </span>
              <strong className="text-slate-700 dark:text-slate-200">{cpu.load_avg?.join(', ')}</strong>
            </div>
          </div>
        </div>

        {/* RAM Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold text-sm">
              <Server className="w-5 h-5 text-sky-500" />
              <span>حافظه موقت (RAM)</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              ram.percent > 85 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400' :
              ram.percent > 70 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400' :
              'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
            }`}>
              {ram.percent}%
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                ram.percent > 85 ? 'bg-rose-500' : ram.percent > 70 ? 'bg-amber-500' : 'bg-sky-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, ram.percent))}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800/80 text-slate-500 dark:text-slate-400">
            <div>
              <span>مصرف‌شده: </span>
              <strong className="text-slate-700 dark:text-slate-200">{Math.round(ram.used_mb / 1024 * 10) / 10} GB</strong>
            </div>
            <div>
              <span>کل حافظه: </span>
              <strong className="text-slate-700 dark:text-slate-200">{Math.round(ram.total_mb / 1024 * 10) / 10} GB</strong>
            </div>
          </div>
        </div>

        {/* Disk Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold text-sm">
              <HardDrive className="w-5 h-5 text-emerald-500" />
              <span>فضای ذخیره‌سازی دیسک</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              disk.percent > 85 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400' :
              'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
            }`}>
              {disk.percent}%
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                disk.percent > 85 ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, disk.percent))}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800/80 text-slate-500 dark:text-slate-400">
            <div>
              <span>فضای باقیمانده: </span>
              <strong className="text-slate-700 dark:text-slate-200">{disk.free_gb} GB</strong>
            </div>
            <div>
              <span>پوشه مدیا: </span>
              <strong className="text-slate-700 dark:text-slate-200">{disk.media_size_mb} MB</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Docker Containers Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">کانتینرهای فعال داکر (Docker Compose Pod)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">وضعیت، پورت‌ها و ایمیج‌های در حال اجرای کانتینرها در سرور پارس‌پک</p>
            </div>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            زمان فعالیت پیوسته: <strong className="text-slate-800 dark:text-slate-200">{uptime.human_readable}</strong>
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {containers.map((container, idx) => (
            <div key={idx} className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">{container.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                      Port: {container.port}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{container.service}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-slate-500 dark:text-slate-400 truncate max-w-xs">{container.image}</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {container.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
