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
  const ram = data?.ram || { total_mb: 1024, used_mb: 500, free_mb: 524, percent: 49 };
  const swap = data?.swap || data?.ram?.swap || { total_mb: 2048, used_mb: 82, free_mb: 1966, percent: 4, is_enabled: true, swappiness: 10, status_label: 'طبیعی و پایدار' };
  const disk = data?.disk || { total_gb: 24, used_gb: 7, free_gb: 17, percent: 29, media_size_mb: 15 };
  const containers = data?.containers || [];
  const uptime = data?.uptime || { human_readable: 'بیش از ۲۴ ساعت' };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 md:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">مانیتورینگ سخت‌افزار و زیرساخت سرور (Infrastructure)</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            پایش لحظه‌ای پردازنده (CPU)، مصرف رم، پارتیشن‌های دیسک و سلامت کانتینرهای داکر سرور پارس‌پک
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => fetchMetrics(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-600' : ''}`} />
            <span>بررسی مجدد</span>
          </button>
        </div>
      </div>

      {/* Hardware Gauge Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 md:gap-5">
        {/* CPU Card */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 md:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold text-sm flex-wrap">
              <Cpu className="w-5 h-5 text-indigo-500 shrink-0" />
              <span>پردازنده (CPU Usage)</span>
              {cpu.metric_scope === 'VPS_HOST' && (
                <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">هاست فیزیکی</span>
              )}
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              (cpu.usage_percent || 0) > 85 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400' :
              (cpu.usage_percent || 0) > 70 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400' :
              'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
            }`}>
              {cpu.usage_percent !== null && cpu.usage_percent !== undefined ? `${cpu.usage_percent}%` : 'N/A'}
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                (cpu.usage_percent || 0) > 85 ? 'bg-rose-500' : (cpu.usage_percent || 0) > 70 ? 'bg-amber-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, cpu.usage_percent || 0))}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800/80 text-slate-500 dark:text-slate-400">
            <div>
              <span>هسته‌ها: </span>
              <strong className="text-slate-700 dark:text-slate-200">{cpu.cores || 1} Core</strong>
              {cpu.container_cpu_limit_cores && (
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block font-mono">
                  سقف کانتینر: {cpu.container_cpu_limit_cores} هسته
                </span>
              )}
            </div>
            <div>
              <span>Load Avg: </span>
              <strong className="text-slate-700 dark:text-slate-200 font-mono">
                {Array.isArray(cpu.load_avg) && cpu.load_avg.length > 0 ? cpu.load_avg.join(', ') : '0.2, 0.2, 0.2'}
              </strong>
            </div>
          </div>
        </div>

        {/* RAM & Swap Card */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 md:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          {/* Host RAM Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold text-sm flex-wrap">
              <Server className="w-5 h-5 text-sky-500 shrink-0" />
              <span>حافظه فیزیکی (Host RAM)</span>
              <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">هاست سرور</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              (ram.host?.percent || ram.percent || 0) > 85 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400' :
              (ram.host?.percent || ram.percent || 0) > 70 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400' :
              'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
            }`}>
              {ram.host?.percent !== null && ram.host?.percent !== undefined ? `${ram.host.percent}%` : (ram.percent !== null ? `${ram.percent}%` : 'N/A')}
            </span>
          </div>

          {/* Host RAM Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                (ram.host?.percent || ram.percent || 0) > 85 ? 'bg-rose-500' : (ram.host?.percent || ram.percent || 0) > 70 ? 'bg-amber-500' : 'bg-sky-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, ram.host?.percent || ram.percent || 0))}%` }}
            ></div>
          </div>

          {/* Host RAM Numbers */}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div>
              <span>مصرف کل هاست: </span>
              <strong className="text-slate-700 dark:text-slate-200">
                {ram.host?.used_mb ? `${Math.round(ram.host.used_mb)} MB / ${Math.round(ram.host.total_mb)} MB` : (ram.used_mb ? `${Math.round(ram.used_mb)} MB` : 'نامشخص')}
              </strong>
            </div>
            <div>
              <span>سهم کانتینر بک‌اند: </span>
              <strong className="text-slate-700 dark:text-slate-200">
                {ram.container?.used_mb ? `${ram.container.used_mb} MB` : (ram.used_mb ? `${Math.round(ram.used_mb)} MB` : '—')}
              </strong>
            </div>
          </div>

          {/* Dedicated Swap Monitoring Sub-section (Priority 1 Requirement) */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <Shield className="w-3.5 h-3.5 text-indigo-500" />
                <span>حافظه معاوضه (Linux Swap)</span>
                {swap.swappiness !== null && swap.swappiness !== undefined && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    swappiness={swap.swappiness}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                !swap.is_enabled ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' :
                (swap.percent || 0) > 80 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400' :
                (swap.percent || 0) > 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400' :
                'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
              }`}>
                {swap.is_enabled ? `${swap.percent}% بافر فعال` : 'غیرفعال'}
              </span>
            </div>

            {/* Swap Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  (swap.percent || 0) > 80 ? 'bg-rose-500' : (swap.percent || 0) > 50 ? 'bg-amber-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${swap.is_enabled ? Math.min(100, Math.max(2, swap.percent || 0)) : 0}%` }}
              ></div>
            </div>

            {/* Swap Numbers */}
            <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <div>
                <span>مصرف: </span>
                <strong className="text-slate-700 dark:text-slate-200">{swap.used_mb}MB</strong>
              </div>
              <div>
                <span>در دسترس: </span>
                <strong className="text-slate-700 dark:text-slate-200">{swap.free_mb}MB</strong>
              </div>
              <div>
                <span>ظرفیت کل: </span>
                <strong className="text-slate-700 dark:text-slate-200">{Math.round((swap.total_mb || 0) / 1024 * 10) / 10}GB</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Disk Card */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 md:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold text-sm flex-wrap">
              <HardDrive className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>فضای دیسک (Storage)</span>
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">هاست ریشه /</span>
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
        <div className="p-4 sm:p-5 md:p-6 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">کانتینرهای فعال داکر (Docker Compose Pod)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">وضعیت، پورت‌ها و ایمیج‌های در حال اجرای کانتینرها در سرور پارس‌پک</p>
            </div>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium self-start sm:self-auto">
            زمان فعالیت پیوسته: <strong className="text-slate-800 dark:text-slate-200">{uptime.human_readable}</strong>
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {containers.map((container, idx) => (
            <div key={idx} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full shrink-0 ${
                  container.status === 'RUNNING' ? 'bg-emerald-500 animate-pulse' :
                  container.status === 'DEGRADED' ? 'bg-amber-500' : 'bg-rose-500 animate-ping'
                }`}></div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">{container.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                      Port: {container.port}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-mono">
                      {container.restart_count !== undefined ? `${container.restart_count} ری‌استارت` : '۰ ری‌استارت'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {container.service}
                    {container.details && (
                      <span className="text-slate-600 dark:text-slate-300 font-mono mr-2">
                        • {container.details}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono self-start sm:self-auto flex-wrap">
                {container.uptime && (
                  <span className="text-[11px] text-slate-400">کارکرد: {container.uptime}</span>
                )}
                <span className="text-slate-500 dark:text-slate-400 truncate max-w-[160px] sm:max-w-xs">{container.image}</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
                  container.status === 'RUNNING'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : container.status === 'DEGRADED'
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                }`}>
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
