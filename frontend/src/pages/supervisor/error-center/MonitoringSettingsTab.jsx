import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Database,
  Lock,
  RefreshCw,
  Save,
  Shield,
  Sliders,
  Trash2,
} from 'lucide-react';
import api from '../../../api/client';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { useToast } from '../../../context/ToastContext';

export const MonitoringSettingsTab = () => {
  const [config, setConfig] = useState(null);
  const [retentionDays, setRetentionDays] = useState(60);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get('/supervisor/monitoring/config/');
      setConfig(res.data);
      setRetentionDays(res.data.retention_days || 60);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت تنظیمات مانیتورینگ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSaveRetention = async () => {
    try {
      setSaving(true);
      await api.post('/supervisor/monitoring/config/', {
        action: 'update_retention',
        retention_days: retentionDays,
      });
      toast.success('سیاست دوره نگهداری لاگ‌ها با موفقیت ذخیره شد.');
    } catch (err) {
      console.error(err);
      toast.error('خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  };

  const handleCleanupLogs = async () => {
    if (!window.confirm(`آیا از پاکسازی لاگ‌های خطای رفع‌شده قدیمی‌تر از ${retentionDays} روز اطمینان دارید؟`)) {
      return;
    }
    try {
      setCleaning(true);
      const res = await api.post('/supervisor/monitoring/config/', {
        action: 'cleanup_logs',
        retention_days: retentionDays,
      });
      const count = res.data?.cleanup_result?.deleted_count ?? 0;
      toast.success(`عملیات با موفقیت انجام شد؛ تعداد ${count} رکورد لاگ قدیمی حذف گردید.`);
    } catch (err) {
      console.error(err);
      toast.error('خطا در پاکسازی لاگ‌ها');
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-sky-500 shrink-0" />
          <span>تنظیمات مرکز مانیتورینگ، سیاست‌های نگهداری و خط‌مشی‌های امنیتی</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          پیکربندی سقف دوره‌های نگهداری (Retention)، پاکسازی دیتابیس و کنترل پرچم‌های قابلیت‌ها
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Retention Policy Box */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-500" />
            <span>سیاست نگهداری لاگ‌ها (Log Retention Policy)</span>
          </h3>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            تعیین مدت زمانی که لاگ‌های خطای بررسی و رفع‌شده در پایگاه داده باقی می‌مانند قبل از آنکه به صورت خودکار یا دستی پاکسازی شوند.
          </p>

          <div className="space-y-2">
            <label className="font-semibold text-slate-700 dark:text-slate-300">مدت نگهداری لاگ‌های رفع‌شده (روز):</label>
            <select
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200"
            >
              <option value={15}>۱۵ روز</option>
              <option value={30}>۳۰ روز (پیشنهادی)</option>
              <option value={60}>۶۰ روز</option>
              <option value={90}>۹۰ روز</option>
              <option value={180}>۱۸۰ روز</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="secondary"
              size="sm"
              loading={cleaning}
              onClick={handleCleanupLogs}
              className="text-rose-600 dark:text-rose-400 hover:text-rose-700 justify-center"
            >
              <Trash2 className="w-3.5 h-3.5 ml-1 text-rose-500" />
              اجرای پاکسازی دستی اکنون
            </Button>

            <Button
              size="sm"
              loading={saving}
              onClick={handleSaveRetention}
              className="justify-center"
            >
              <Save className="w-3.5 h-3.5 ml-1" />
              ذخیره تنظیمات
            </Button>
          </div>
        </div>

        {/* AI Integration Status Box (Section 9 Requirement) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-slate-400" />
              <span>ماژول هوش مصنوعی و تحلیل خودکار خطا (AI Module)</span>
            </h3>
            <Badge variant="neutral">غیرفعال (Disabled)</Badge>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Feature Flag: <code>AI_ERROR_ANALYSIS_ENABLED = False</code></span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              مطابق با نیازمندی‌های صریح پروژه، ماژول هوش مصنوعی تا زمان تأمین بودجه و تعیین ارائه‌دهنده سرویس (Provider) کاملاً غیرفعال است.
              هیچ‌گونه فراخوانی خارجی، هزینه یا داده شبیه‌سازی‌شده‌ای تولید نمی‌گردد.
            </p>
          </div>

          <div className="space-y-1.5 text-slate-500 text-[11px]">
            <div>• معماری سیستم به صورت ماژولار و توسعه‌پذیر در واسط <code className="text-slate-700 dark:text-slate-300">BaseAIErrorAnalyzer</code> ایزوله گردیده است.</div>
            <div>• در آینده بدون ایجاد هیچ تغییری در هسته ثبت باگ‌ها و تنها با فعال‌سازی پرچم مربوطه، قابل بهره‌برداری خواهد بود.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
