import React, { useState, useEffect } from 'react';
import {
  Radio, CheckCircle2, AlertTriangle, XCircle, RefreshCw,
  ShieldCheck, Send, CreditCard, Database, Server, Clock, Lock
} from 'lucide-react';
import api from '../../api/client';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';

export const SupervisorServicesPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [probing, setProbing] = useState(false);
  const toast = useToast();

  const fetchServices = async (isManual = false) => {
    try {
      if (isManual) setProbing(true);
      else setLoading(true);

      const res = await api.get('/supervisor/services/');
      setData(res.data);
      if (isManual) {
        toast.success('وضعیت اتصال تمام سرویس‌ها با موفقیت سنجیده شد.');
      }
    } catch (err) {
      console.error(err);
      toast.error('عدم برقراری ارتباط با پایشگر سرویس‌ها');
    } finally {
      setLoading(false);
      setProbing(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  if (loading && !data) {
    return <LoadingState type="dashboard" message="در حال ارسال سیگنال و سنجش سلامت سرویس‌های سیستم..." />;
  }

  const services = data?.services || [];
  const allHealthy = data?.all_healthy ?? true;

  const getServiceIcon = (id) => {
    switch (id) {
      case 'backend':
        return <Server className="w-5 h-5 text-indigo-500" />;
      case 'database':
        return <Database className="w-5 h-5 text-sky-500" />;
      case 'frontend_proxy':
        return <Radio className="w-5 h-5 text-emerald-500" />;
      case 'ssl_certificate':
        return <Lock className="w-5 h-5 text-amber-500" />;
      case 'sms_gateway':
        return <Send className="w-5 h-5 text-purple-500" />;
      case 'payment_gateway':
        return <CreditCard className="w-5 h-5 text-teal-500" />;
      default:
        return <Radio className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${allHealthy ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">وضعیت و پایش سرویس‌های داخلی و خارجی (Services)</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            بررسی زنده اتصال به PostgreSQL، وب‌سرور Nginx، گواهی SSL، وب‌سرویس پیامک و درگاه بانکی شاپرک
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchServices(true)}
            disabled={probing}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${probing ? 'animate-spin' : ''}`} />
            <span>سنجش مجدد لحظه‌ای (Instant Probe)</span>
          </button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((svc) => {
          const isOk = svc.status === 'ONLINE' || svc.status === 'CONNECTED' || svc.status === 'VALID';
          return (
            <div
              key={svc.id}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
                    {getServiceIcon(svc.id)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{svc.name}</h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Port: {svc.port || 'API'}</span>
                  </div>
                </div>

                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  isOk
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                }`}>
                  {isOk ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {svc.status}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {svc.details}
              </p>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800/80 text-slate-500 dark:text-slate-400">
                {svc.latency_ms !== undefined && (
                  <div>
                    <span>زمان پاسخ (Latency): </span>
                    <strong className="text-slate-700 dark:text-slate-200 font-mono">{svc.latency_ms} ms</strong>
                  </div>
                )}
                {svc.days_remaining !== undefined && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>اعتبار گواهی: </span>
                    <strong className="text-slate-800 dark:text-slate-100 font-bold">{svc.days_remaining} روز</strong>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
