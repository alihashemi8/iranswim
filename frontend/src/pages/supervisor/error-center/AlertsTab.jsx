import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  ShieldAlert,
  Sliders,
  XCircle,
} from 'lucide-react';
import api from '../../../api/client';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { EmptyState } from '../../../components/common/EmptyState';
import { LoadingState } from '../../../components/common/LoadingState';
import { useToast } from '../../../context/ToastContext';

export const AlertsTab = () => {
  const [alerts, setAlerts] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(''); // ACTIVE, ACKNOWLEDGED, RESOLVED
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const toast = useToast();

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const [resAlerts, resRules] = await Promise.all([
        api.get('/supervisor/alerts/', { params }),
        api.get('/supervisor/alerts/rules/'),
      ]);
      setAlerts(resAlerts.data.results || resAlerts.data || []);
      setRules(resRules.data.results || resRules.data || []);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت هشدارهای سامانه');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter]);

  const handleAlertAction = async (alertId, action) => {
    try {
      setActionLoadingId(alertId);
      await api.post(`/supervisor/alerts/${alertId}/action/`, { action });
      toast.success(action === 'acknowledge' ? 'هشدار تأیید و مشاهده شد.' : 'هشدار برطرف و بسته شد.');
      fetchAlerts();
    } catch (err) {
      console.error(err);
      toast.error('خطا در تغییر وضعیت هشدار');
    } finally {
      setActionLoadingId(null);
    }
  };

  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE');
  const pastAlerts = alerts.filter((a) => a.status !== 'ACTIVE');

  return (
    <div className="space-y-6">
      {/* Top Header & Filter */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              سامانه مدیریت هشدارها و اعلان‌های بحرانی (Alert Center)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            یکتاسازی هشدارها (Deduplication)، رعایت دوره استراحت (Cooldown) و ردپای تأیید توسط ناظر
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:flex-initial text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200"
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="ACTIVE">فقط هشدارهای فعال</option>
            <option value="ACKNOWLEDGED">تأییدشده‌ها</option>
            <option value="RESOLVED">برطرف‌شده‌ها</option>
          </select>
          <button
            type="button"
            onClick={fetchAlerts}
            aria-label="تازه‌سازی"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Active Alerts List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <span>هشدارهای فعال نیازمند اقدام ({activeAlerts.length}):</span>
        </h3>

        {loading ? (
          <LoadingState type="card" message="در حال بارگذاری هشدارهای سامانه..." />
        ) : activeAlerts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-white">هیچ هشدار فعالی وجود ندارد</h4>
            <p className="text-[11px] text-slate-400">تمام شاخص‌های عملکردی و آستانه‌های تعیین‌شده در محدوده امن قرار دارند.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAlerts.map((alt) => (
              <div
                key={alt.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-rose-200 dark:border-rose-900 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={alt.severity === 'CRITICAL' ? 'danger' : 'coral'}>
                      {alt.severity}
                    </Badge>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{alt.title}</h4>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(alt.created_at).toLocaleTimeString('fa-IR')} - {new Date(alt.created_at).toLocaleDateString('fa-IR')}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {alt.message}
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="font-mono text-[11px] text-slate-400">
                    شرط فعال‌سازی: <code className="text-slate-600 dark:text-slate-300">{alt.trigger_condition}</code>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={actionLoadingId === alt.id}
                      onClick={() => handleAlertAction(alt.id, 'acknowledge')}
                    >
                      مشاهده و تأیید
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      loading={actionLoadingId === alt.id}
                      onClick={() => handleAlertAction(alt.id, 'resolve')}
                    >
                      برطرف‌سازی و بستن
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configured Alert Rules Panel */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-500" />
          <span>قوانین، آستانه‌ها و دوره‌های استراحت هشدار (Alert Rules & Thresholds)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rules.map((r) => (
            <div
              key={r.id}
              className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200">{r.name}</span>
                <Badge variant={r.is_enabled ? 'success' : 'neutral'}>
                  {r.is_enabled ? 'فعال' : 'غیرفعال'}
                </Badge>
              </div>
              <div className="text-[11px] text-slate-500 space-y-1 font-mono">
                <div>آستانه تحریک: <strong>{r.threshold_value}</strong></div>
                <div>دوره تعلیق تکرار: <strong>{r.cooldown_minutes} دقیقه</strong></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alert History Section */}
      {pastAlerts.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>تاریخچه هشدارهای گذشته ({pastAlerts.length}):</span>
          </h3>

          <div className="space-y-2">
            {pastAlerts.map((alt) => (
              <div
                key={alt.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-700/70 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={alt.status === 'RESOLVED' ? 'success' : 'neutral'}>
                      {alt.status_display}
                    </Badge>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{alt.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{alt.message}</p>
                </div>
                <div className="text-[11px] font-mono text-slate-400 shrink-0">
                  {alt.resolved_at ? `رفع در: ${new Date(alt.resolved_at).toLocaleDateString('fa-IR')}` : new Date(alt.created_at).toLocaleDateString('fa-IR')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
