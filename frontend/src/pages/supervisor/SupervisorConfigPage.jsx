import React, { useState, useEffect } from 'react';
import {
  Sliders, ShieldCheck, AlertTriangle, CheckCircle2, Lock,
  RefreshCw, Power, Zap, Eye, EyeOff
} from 'lucide-react';
import api from '../../api/client';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';

export const SupervisorConfigPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const toast = useToast();

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get('/supervisor/config/');
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت تنظیمات فنی سامانه');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleToggleFeature = async (flagKey, currentValue) => {
    try {
      setUpdating(true);
      const newFlags = { ...data.feature_flags, [flagKey]: !currentValue };
      await api.post('/supervisor/config/', {
        key: 'feature_flags',
        value: newFlags
      });
      setData((prev) => ({ ...prev, feature_flags: newFlags }));
      toast.success('تنظیم فیچرفلگ با موفقیت به‌روزرسانی و ثبت شد.');
    } catch (err) {
      console.error(err);
      toast.error('خطا در به‌روزرسانی فیچرفلگ');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleMaintenance = async () => {
    try {
      setUpdating(true);
      const currentEnabled = data.maintenance_mode?.enabled;
      const newMode = {
        ...data.maintenance_mode,
        enabled: !currentEnabled
      };
      await api.post('/supervisor/config/', {
        key: 'maintenance_mode',
        value: newMode
      });
      setData((prev) => ({ ...prev, maintenance_mode: newMode }));
      toast.success(
        !currentEnabled
          ? 'حالت تعمیرات و نگهداری سامانه فعال شد.'
          : 'حالت تعمیرات سامانه غیرفعال شد.'
      );
    } catch (err) {
      console.error(err);
      toast.error('خطا در تغییر وضعیت تعمیرات');
    } finally {
      setUpdating(false);
    }
  };

  if (loading && !data) {
    return <LoadingState type="dashboard" message="در حال بارگذاری متغیرهای عملیاتی و Feature Flags..." />;
  }

  const maint = data?.maintenance_mode || { enabled: false };
  const flags = data?.feature_flags || {};
  const rateLimit = data?.rate_limiting || { anon_limit_per_min: 60, user_limit_per_min: 240 };
  const env = data?.environment_status || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">تنظیمات فنی، Feature Flags و اسرار سیستم</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            کنترل وضعیت عملیاتی نرم‌افزار، حالت تعمیرات و پایش وضعیت متغیرهای محیطی با پوشش ماسک امنیتی
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchConfig}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>به‌روزرسانی تنظیمات</span>
          </button>
        </div>
      </div>

      {/* Maintenance Mode Card */}
      <div className={`p-6 rounded-2xl border transition-all ${
        maint.enabled
          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${
              maint.enabled ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}>
              <Power className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">حالت تعمیر و بروزرسانی زیرساخت (Maintenance Mode)</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  maint.enabled ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}>
                  {maint.enabled ? 'فعال (سامانه در دسترس عموم نیست)' : 'غیرفعال (سامانه آنلاین است)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                در صورت فعال‌سازی، دسترسی شناگران و کاربران عادی مسدود شده و صفحه «در حال بروزرسانی» نمایش داده می‌شود.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleMaintenance}
            disabled={updating}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              maint.enabled
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{maint.enabled ? 'غیرفعال‌سازی حالت تعمیرات' : 'فعال‌سازی حالت تعمیرات'}</span>
          </button>
        </div>
      </div>

      {/* Feature Flags Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">مدیریت پرچم‌های قابلیت (Feature Flags)</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          فعال یا غیرفعال کردن قابلیت‌های کلیدی سامانه بدون نیاز به استقرار مجدد کد
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">ماژول مسابقات و لیگ شنا</h4>
              <p className="text-xs text-slate-500 mt-0.5">ثبت‌نام و نمایش جدول لیگ‌ها در پورتال شناگر</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleFeature('online_leagues', flags.online_leagues)}
              disabled={updating}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                flags.online_leagues ? 'bg-sky-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">ثبت‌نام آزاد اینترنتی شناگران</h4>
              <p className="text-xs text-slate-500 mt-0.5">امکان ساخت حساب کاربری عمومی از صفحه نخست</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleFeature('public_registration', flags.public_registration)}
              disabled={updating}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                flags.public_registration ? 'bg-sky-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">پرداخت اقساطی شهریه</h4>
              <p className="text-xs text-slate-500 mt-0.5">امکان تقسیط فاکتورهای دوره‌های آموزشی</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleFeature('installment_payment', flags.installment_payment)}
              disabled={updating}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                flags.installment_payment ? 'bg-sky-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">اعلان‌های پیامکی خودکار</h4>
              <p className="text-xs text-slate-500 mt-0.5">ارسال پیامک تایید ثبت‌نام، پرداخت و تاخیر</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleFeature('sms_notifications', flags.sms_notifications)}
              disabled={updating}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                flags.sms_notifications ? 'bg-sky-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Environment & Security Redacted Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">وضعیت پیکربندی امنیتی (Secret Masking Applied)</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          برای رعایت بالاترین استانداردهای امنیتی، مقادیر کلیدهای محرمانه و کلمات عبور هرگز به مرورگر ارسال نمی‌شوند.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-500 block mb-1">DJANGO_SECRET_KEY:</span>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>پیکربندی‌شده (Masked ••••••••)</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-500 block mb-1">DJANGO_DEBUG:</span>
            <div className="font-bold text-slate-800 dark:text-slate-200">
              {env.django_debug ? 'True (Development)' : 'False (Production Hardened)'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-500 block mb-1">DATABASE_ENGINE:</span>
            <div className="font-bold text-slate-800 dark:text-slate-200">
              {env.database_engine || 'postgresql'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-500 block mb-1">RATE LIMITING:</span>
            <div className="font-bold text-slate-800 dark:text-slate-200">
              {rateLimit.anon_limit_per_min} req/min (Anon) | {rateLimit.user_limit_per_min} req/min (User)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-500 block mb-1">TIME_ZONE:</span>
            <div className="font-bold text-slate-800 dark:text-slate-200">
              {env.time_zone || 'Asia/Tehran'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-500 block mb-1">ALLOWED_HOSTS:</span>
            <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
              {Array.isArray(env.allowed_hosts) ? env.allowed_hosts.join(', ') : '*'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
