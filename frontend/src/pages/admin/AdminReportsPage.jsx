import React, { useState, useEffect } from 'react';
import {
  BarChart3, FileSpreadsheet, Filter, CreditCard,
  Users, BookOpen, Calendar, TrendingUp, CheckCircle, ArrowDownToLine
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';
import { exportToCsv } from '../../utils/exportCsv';

export const AdminReportsPage = () => {
  const [reportType, setReportType] = useState('FINANCIAL'); // FINANCIAL, EDUCATIONAL, ENROLLMENT
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [swimmers, setSwimmers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [requests, setRequests] = useState([]);
  const [installments, setInstallments] = useState([]);
  const toast = useToast();

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const [sumRes, invRes, swmRes, grpRes, reqRes, instRes] = await Promise.all([
        api.get('/finance/summary/'),
        api.get('/finance/invoices/'),
        api.get('/swimmers/'),
        api.get('/education/groups/'),
        api.get('/education/requests/'),
        api.get('/finance/installments/?overdue=true'),
      ]);
      setSummary(sumRes.data);
      setInvoices(invRes.data.results || invRes.data);
      setSwimmers(swmRes.data.results || swmRes.data);
      setGroups(grpRes.data.results || grpRes.data);
      setRequests(reqRes.data.results || reqRes.data);
      setInstallments(instRes.data.results || instRes.data);
    } catch (err) {
      console.error(err);
      toast.error('خطا در استخراج گزارشات تحلیلی');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  const formatPrice = (v) => Number(v || 0).toLocaleString('fa-IR');

  // Export handlers
  const exportFinancialReport = () => {
    const rows = invoices.map((inv) => ({
      invoice_number: inv.invoice_number,
      swimmer: inv.swimmer_name,
      total_amount: formatPrice(inv.total_amount),
      paid_amount: formatPrice(inv.total_paid),
      balance: formatPrice(inv.remaining_balance),
      status: inv.status_display,
      date: new Date(inv.created_at).toLocaleDateString('fa-IR'),
    }));
    exportToCsv('IranSwim_Financial_Report', rows, {
      invoice_number: 'شماره فاکتور',
      swimmer: 'نام شناگر',
      total_amount: 'مبلغ کل (تومان)',
      paid_amount: 'وصول‌شده (تومان)',
      balance: 'مانده بدهی (تومان)',
      status: 'وضعیت فاکتور',
      date: 'تاریخ صدور',
    });
  };

  const exportEducationalReport = () => {
    const rows = groups.map((g) => ({
      course: g.course_name,
      group: g.name,
      level: g.level_name,
      capacity: g.capacity,
      enrolled: g.current_enrollments_count,
      remaining: g.remaining_capacity,
      location: g.pool_location,
    }));
    exportToCsv('IranSwim_Educational_Capacity_Report', rows, {
      course: 'دوره آموزشی',
      group: 'گروه اجرایی',
      level: 'سطح مهارت',
      capacity: 'ظرفیت کل',
      enrolled: 'تعداد ثبت‌نام‌شده',
      remaining: 'ظرفیت خالی',
      location: 'استخر / لاین',
    });
  };

  const exportEnrollmentReport = () => {
    const rows = requests.map((r) => ({
      applicant: r.applicant_name,
      phone: r.applicant_phone,
      course: r.course_name,
      group: r.group_name,
      status: r.status_display,
      date: new Date(r.created_at).toLocaleDateString('fa-IR'),
    }));
    exportToCsv('IranSwim_Enrollments_Requests_Report', rows, {
      applicant: 'نام متقاضی',
      phone: 'شماره همراه',
      course: 'دوره',
      group: 'گروه',
      status: 'وضعیت درخواست',
      date: 'تاریخ ثبت',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-600" />
            مرکز گزارش‌های تحلیلی، مالی و عملکردی آموزشگاه
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            استخراج آمار جامع، فیلتر گزارشات پیشرفته و قابلیت خروجی استاندارد اکسل (CSV)
          </p>
        </div>

        {/* Export Button based on active tab */}
        <Button
          onClick={
            reportType === 'FINANCIAL'
              ? exportFinancialReport
              : reportType === 'EDUCATIONAL'
              ? exportEducationalReport
              : exportEnrollmentReport
          }
          className="gap-1.5 text-xs"
        >
          <ArrowDownToLine className="w-4 h-4" />
          <span>دانلود فایل اکسل گزارش جاری</span>
        </Button>
      </div>

      {/* Report Category Switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700 text-xs w-fit">
        <button
          type="button"
          onClick={() => setReportType('FINANCIAL')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            reportType === 'FINANCIAL'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-600" />
          <span>گزارش مالی و وصولی‌ها</span>
        </button>
        <button
          type="button"
          onClick={() => setReportType('EDUCATIONAL')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            reportType === 'EDUCATIONAL'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4 text-sky-600" />
          <span>گزارش آموزشی و ظرفیت گروه‌ها</span>
        </button>
        <button
          type="button"
          onClick={() => setReportType('ENROLLMENT')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            reportType === 'ENROLLMENT'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-600" />
          <span>گزارش ثبت‌نام‌ها و پذیرش</span>
        </button>
      </div>

      {loading ? (
        <LoadingState message="در حال تهیه و پردازش داده‌های گزارش..." />
      ) : reportType === 'FINANCIAL' ? (
        /* REPORT 1: FINANCIAL */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400 block mb-1">مجموع کل صورتحساب‌های صادرشده</span>
              <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-100">
                {formatPrice(summary?.total_invoiced)} تومان
              </span>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400 block mb-1">کل وصولی‌های قطعی و نقدی</span>
              <span className="text-lg font-bold font-mono text-emerald-600">
                {formatPrice(summary?.total_paid)} تومان
              </span>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400 block mb-1">مانده مطالبات معوق (بدهکاران)</span>
              <span className="text-lg font-bold font-mono text-amber-600">
                {formatPrice(summary?.receivables)} تومان
              </span>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400 block mb-1">تعداد اقساط سررسید گذشته</span>
              <span className="text-lg font-bold font-mono text-rose-600">
                {summary?.overdue_installments_count || 0} قسط
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
              فهرست جزئیات صورتحساب‌ها و مانده بدهی شناگران
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 rounded-r-xl">شماره فاکتور</th>
                    <th className="px-4 py-3">نام شناگر</th>
                    <th className="px-4 py-3">مبلغ کل</th>
                    <th className="px-4 py-3">مبلغ پرداخت‌شده</th>
                    <th className="px-4 py-3">مانده مطالبات</th>
                    <th className="px-4 py-3">وضعیت</th>
                    <th className="px-4 py-3 rounded-l-xl">تاریخ صدور</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-100">
                        {inv.invoice_number}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold">{inv.swimmer_name}</td>
                      <td className="px-4 py-3 font-mono text-xs">{formatPrice(inv.total_amount)} تومان</td>
                      <td className="px-4 py-3 font-mono text-xs text-emerald-600">{formatPrice(inv.total_paid)} تومان</td>
                      <td className="px-4 py-3 font-mono text-xs text-rose-600 font-bold">{formatPrice(inv.remaining_balance)} تومان</td>
                      <td className="px-4 py-3">
                        <Badge variant={inv.status === 'PAID' ? 'success' : inv.status === 'PARTIALLY_PAID' ? 'warning' : 'danger'}>
                          {inv.status_display}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">
                        {new Date(inv.created_at).toLocaleDateString('fa-IR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : reportType === 'EDUCATIONAL' ? (
        /* REPORT 2: EDUCATIONAL & CAPACITY */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
            تکمیل ظرفیت گروه‌های آموزشی و تخصیص لاین استخر
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 rounded-r-xl">دوره آموزشی</th>
                  <th className="px-4 py-3">گروه کلاسی</th>
                  <th className="px-4 py-3">سطح مهارت</th>
                  <th className="px-4 py-3">ظرفیت کل</th>
                  <th className="px-4 py-3">تعداد ثبت‌نام‌شده</th>
                  <th className="px-4 py-3">ظرفیت باقیمانده</th>
                  <th className="px-4 py-3 rounded-l-xl">محل استخر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {groups.map((grp) => (
                  <tr key={grp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">{grp.course_name}</td>
                    <td className="px-4 py-3 text-xs">{grp.name}</td>
                    <td className="px-4 py-3 text-xs text-sky-600">{grp.level_name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{grp.capacity} نفر</td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-emerald-600">{grp.current_enrollments_count} نفر</td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-amber-600">{grp.remaining_capacity} جای خالی</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{grp.pool_location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* REPORT 3: ENROLLMENT REQUESTS */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
            آمار درخواست‌های پذیرش آنلاین و نرخ تبدیل متقاضیان
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 rounded-r-xl">متقاضی</th>
                  <th className="px-4 py-3">شماره تماس</th>
                  <th className="px-4 py-3">دوره درخواستی</th>
                  <th className="px-4 py-3">گروه انتخابی</th>
                  <th className="px-4 py-3">وضعیت بررسی</th>
                  <th className="px-4 py-3 rounded-l-xl">تاریخ درخواست</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">{r.applicant_name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.applicant_phone}</td>
                    <td className="px-4 py-3 text-xs">{r.course_name}</td>
                    <td className="px-4 py-3 text-xs">{r.group_name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={r.status === 'APPROVED' ? 'success' : r.status === 'PENDING' ? 'warning' : 'danger'}>
                        {r.status_display}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {new Date(r.created_at).toLocaleDateString('fa-IR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
