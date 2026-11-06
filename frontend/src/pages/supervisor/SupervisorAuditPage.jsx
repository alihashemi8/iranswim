import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { useToast } from '../../context/ToastContext';

export const SupervisorAuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const toast = useToast();

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (actionFilter) params.action = actionFilter;
      const res = await api.get('/supervisor/audit-logs/', { params });
      setLogs(res.data.results || res.data);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت لاگ‌های حسابرسی');
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
    USER_CREATE: { label: 'ایجاد کاربر جدید', variant: 'primary' },
    USER_UPDATE: { label: 'ویرایش مشخصات کاربر', variant: 'info' },
    USER_DELETE: { label: 'حذف کاربر', variant: 'danger' },
    PASSWORD_RESET: { label: 'تغییر کلمه عبور کاربر', variant: 'warning' },
    ENROLLMENT_CREATE: { label: 'ثبت‌نام جدید', variant: 'info' },
    PAYMENT_RECORD: { label: 'ثبت پرداخت مالی', variant: 'success' },
    REFUND_ISSUE: { label: 'استرداد یا تخفیف', variant: 'danger' },
    ATTENDANCE_EDIT: { label: 'ویرایش حضور و غیاب', variant: 'warning' },
    RECORD_VERIFY: { label: 'تأیید رکورد شنا', variant: 'success' },
    CONFIG_CHANGE: { label: 'تنظیمات سامانه', variant: 'info' },
  };

  const totalPages = Math.ceil(logs.length / pageSize) || 1;
  const paginatedLogs = logs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            لاگ‌های حسابرسی امنیتی و عملیات حساس (Audit Trail)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            ثبت غیرقابل‌دستکاری تمامی رخدادهای مالی، تغییر وضعیت ثبت‌نام‌ها، تأیید رکوردها و اصلاحات سیستمی
          </p>
        </div>
        <div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
        <LoadingState type="table" rows={6} message="در حال خواندن وقایع حسابرسی..." />
      ) : logs.length === 0 ? (
        <EmptyState title="هیچ لاگ حسابرسی یافت نشد" description="هنوز رخداد حساسی با این مشخصات ثبت نشده است." />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 rounded-r-xl">کاربر اقدام‌کننده</th>
                  <th className="px-4 py-3.5">نوع عملیات</th>
                  <th className="px-4 py-3.5">موجودیت مرتبط</th>
                  <th className="px-4 py-3.5">جزئیات و تغییرات</th>
                  <th className="px-4 py-3.5">آدرس IP</th>
                  <th className="px-4 py-3.5 rounded-l-xl">زمان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {paginatedLogs.map((log) => {
                  const meta = actionLabels[log.action] || { label: log.action, variant: 'neutral' };
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-slate-100">
                        {log.actor_name}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {log.entity_type} #{log.entity_id}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono text-slate-700 dark:text-slate-300 max-w-md truncate">
                        {JSON.stringify(log.details)}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {log.ip_address || 'محلی'}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleString('fa-IR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={logs.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </div>
  );
};
