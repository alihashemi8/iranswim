import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, History } from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

export const SupervisorAuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (actionFilter) params.action = actionFilter;
      const res = await api.get('/supervisor/audit-logs/', { params });
      setLogs(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter]);

  const actionLabels = {
    LOGIN: { label: 'ورود به سیستم', variant: 'neutral' },
    ROLE_CHANGE: { label: 'تغییر نقش کاربر', variant: 'warning' },
    ENROLLMENT_CREATE: { label: 'ثبت‌نام جدید', variant: 'info' },
    PAYMENT_RECORD: { label: 'ثبت پرداخت مالی', variant: 'success' },
    REFUND_ISSUE: { label: 'استرداد یا تخفیف', variant: 'danger' },
    ATTENDANCE_EDIT: { label: 'ویرایش حضور و غیاب', variant: 'warning' },
    RECORD_VERIFY: { label: 'تأیید رکورد شنا', variant: 'success' },
    CONFIG_CHANGE: { label: 'تنظیمات سامانه', variant: 'info' },
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            لاگ‌های حسابرسی امنیتی و عملیات حساس (Audit Trail)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ثبت غیرقابل‌دستکاری تمامی رخدادهای مالی، تغییر وضعیت ثبت‌نام‌ها، تأیید رکوردها و اصلاحات سیستمی
          </p>
        </div>
        <div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">تمام عملیات حساس</option>
            <option value="PAYMENT_RECORD">ثبت پرداخت مالی</option>
            <option value="ENROLLMENT_CREATE">ثبت‌نام جدید</option>
            <option value="REFUND_ISSUE">استرداد یا تخفیف</option>
            <option value="RECORD_VERIFY">تأیید رکورد شنا</option>
            <option value="CONFIG_CHANGE">تغییرات سیستمی</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingState message="در حال خواندن وقایع حسابرسی..." />
      ) : logs.length === 0 ? (
        <EmptyState title="هیچ لاگ حسابرسی یافت نشد" description="هنوز رخداد حساسی با این مشخصات ثبت نشده است." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200/80">
                <tr>
                  <th className="px-4 py-3.5">کاربر اقدام‌کننده</th>
                  <th className="px-4 py-3.5">نوع عملیات</th>
                  <th className="px-4 py-3.5">موجودیت مرتبط</th>
                  <th className="px-4 py-3.5">جزئیات و تغییرات</th>
                  <th className="px-4 py-3.5">آدرس IP</th>
                  <th className="px-4 py-3.5">زمان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const meta = actionLabels[log.action] || { label: log.action, variant: 'neutral' };
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-slate-900">
                        {log.actor_name}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
                        {log.entity_type} #{log.entity_id}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono text-slate-700 max-w-md truncate">
                        {JSON.stringify(log.details)}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                        {log.ip_address || 'محلی'}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleString('fa-IR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
