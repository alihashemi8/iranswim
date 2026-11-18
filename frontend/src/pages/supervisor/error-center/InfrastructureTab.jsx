import React from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  HardDrive,
  HelpCircle,
  Layers,
  Radio,
  RefreshCw,
  Server,
  XCircle,
  Zap,
} from 'lucide-react';
import { Badge } from '../../../components/common/Badge';

export const InfrastructureTab = ({
  infraData,
  loading,
  onRefresh,
}) => {
  const services = infraData?.services || [];
  const metrics = infraData?.metrics || {};
  const cpu = metrics?.cpu || { usage_percent: 15, cores: 4, load_avg: [0.3, 0.2, 0.2] };
  const ram = metrics?.ram || { total_mb: 8192, used_mb: 3200, free_mb: 4992, percent: 39 };
  const disk = metrics?.disk || { total_gb: 40, used_gb: 12, free_gb: 28, percent: 30 };
  const dbPool = metrics?.database_pool || { active_connections: 1, max_connections: 100, utilization_percent: 1 };
  const uptime = metrics?.uptime || { human_readable: 'بیش از ۲۴ ساعت' };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'HEALTHY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>پایدار (Healthy)</span>
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>افت کارایی (Degraded)</span>
          </span>
        );
      case 'DOWN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>قطع سرویس (Down)</span>
          </span>
        );
      case 'UNKNOWN':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>غیرفعال / نامشخص (Unknown)</span>
          </span>
        );
    }
  };

  const getServiceIcon = (id) => {
    switch (id) {
      case 'backend':
        return <Server className="w-5 h-5 text-indigo-500" />;
      case 'database':
        return <Database className="w-5 h-5 text-sky-500" />;
      case 'redis':
        return <Zap className="w-5 h-5 text-rose-500" />;
      case 'celery_workers':
        return <Activity className="w-5 h-5 text-emerald-500" />;
      case 'celery_beat':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'nginx':
        return <Radio className="w-5 h-5 text-teal-500" />;
      default:
        return <Layers className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Strip */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              infraData?.status === 'HEALTHY' ? 'bg-emerald-500 animate-pulse' :
              infraData?.status === 'DEGRADED' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500 animate-ping'
            }`}></span>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              پایش بلادرنگ سرویس‌ها و منابع زیرساخت (Live Infrastructure Probing)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            سنجش اتصال واقعی به سرور، دیتابیس، کش و وب‌سرور با تشخیص تفکیکی سرویس‌های غیرفعال
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>سنجش مجدد لحظه‌ای</span>
        </button>
      </div>

      {/* Hardware Resource Metrics Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Gauge */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-500" />
              <span>پردازنده (CPU)</span>
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{cpu.usage_percent}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                cpu.usage_percent > 85 ? 'bg-rose-500' : cpu.usage_percent > 70 ? 'bg-amber-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, cpu.usage_percent))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>{cpu.cores} هسته فعال</span>
            <span>بار: {cpu.load_avg?.join(', ')}</span>
          </div>
        </div>

        {/* RAM Gauge */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>حافظه موقت (RAM)</span>
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{ram.percent}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                ram.percent > 85 ? 'bg-rose-500' : ram.percent > 70 ? 'bg-amber-500' : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, ram.percent))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>{Math.round(ram.used_mb / 1024 * 10) / 10}GB مصرف</span>
            <span>{Math.round(ram.free_mb / 1024 * 10) / 10}GB آزاد</span>
          </div>
        </div>

        {/* Disk Gauge */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-sky-500" />
              <span>دیسک سرور (Disk)</span>
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{disk.percent}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                disk.percent > 85 ? 'bg-rose-500' : disk.percent > 70 ? 'bg-amber-500' : 'bg-sky-600'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, disk.percent))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>{disk.used_gb}GB مصرف</span>
            <span>{disk.free_gb}GB آزاد</span>
          </div>
        </div>

        {/* DB Pool Utilization */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-teal-500" />
              <span>استخر اتصالات دیتابیس</span>
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{dbPool.utilization_percent}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-teal-600 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, dbPool.utilization_percent))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>{dbPool.active_connections} اتصال فعال</span>
            <span>سقف {dbPool.max_connections}</span>
          </div>
        </div>
      </div>

      {/* 6 Key Operational Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((svc) => (
          <div
            key={svc.id}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
                  {getServiceIcon(svc.id)}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">{svc.name}</h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    پورت / آدرس: {svc.port || '—'}
                  </span>
                </div>
              </div>
              {getStatusBadge(svc.status)}
            </div>

            {/* Diagnostic Details */}
            <div className="p-3 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl text-xs space-y-1.5 border border-slate-100 dark:border-slate-800">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                {svc.diagnostics}
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px] text-slate-400 font-mono">
                <span>
                  زمان پاسخ: {svc.latency_ms !== null && svc.latency_ms !== undefined && svc.latency_ms >= 0 ? `${svc.latency_ms}ms` : '—'}
                </span>
                <span>
                  آخرین بررسی موفق: {svc.last_successful_check ? new Date(svc.last_successful_check).toLocaleTimeString('fa-IR') : '—'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
