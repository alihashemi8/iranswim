import React, { useState, useEffect } from 'react';
import {
  CreditCard, AlertCircle, FileText, CheckCircle2,
  DollarSign, ArrowUpRight, ArrowDownLeft, Plus,
  FileSpreadsheet, Search, RefreshCw, User, Phone
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { StatsCard } from '../../components/common/StatsCard';
import { Pagination } from '../../components/common/Pagination';
import { useToast } from '../../context/ToastContext';
import { exportToCsv } from '../../utils/exportCsv';

export const AdminFinancePage = () => {
  const [activeTab, setActiveTab] = useState('INVOICES'); // INVOICES, INSTALLMENTS, PAYMENTS, ADJUSTMENTS
  const [invoices, setInvoices] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const toast = useToast();

  // Record Payment Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [payForm, setPayForm] = useState({
    amount: '',
    method: 'POS',
    transaction_ref: '',
    notes: '',
  });
  const [paying, setPaying] = useState(false);

  // Financial Adjustment (Discount / Refund) Modal
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [adjInvoice, setAdjInvoice] = useState(null);
  const [adjForm, setAdjForm] = useState({
    type: 'DISCOUNT', // DISCOUNT, REFUND
    amount: '',
    reason: '',
  });
  const [submittingAdj, setSubmittingAdj] = useState(false);

  const fetchFinance = async () => {
    try {
      setLoading(true);
      const [invRes, sumRes, instRes, payRes] = await Promise.all([
        api.get('/finance/invoices/'),
        api.get('/finance/summary/'),
        api.get('/finance/installments/?overdue=true'),
        api.get('/finance/payments/'),
      ]);
      setInvoices(invRes.data.results || invRes.data);
      setSummary(sumRes.data);
      setInstallments(instRes.data.results || instRes.data);
      setPayments(payRes.data.results || payRes.data);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت اطلاعات مالی آموزشگاه');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinance();
  }, []);

  // Open Payment Modal for an Invoice
  const handleOpenPayModal = (invoice, installment = null) => {
    setSelectedInvoice(invoice);
    setSelectedInstallment(installment);
    setPayForm({
      amount: installment ? String(installment.remaining_amount) : String(invoice?.remaining_balance || ''),
      method: 'POS',
      transaction_ref: '',
      notes: installment ? `تسویه قسط ${installment.installment_number}` : '',
    });
    setIsPayModalOpen(true);
  };

  // Submit Payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice && !selectedInstallment) return;
    try {
      setPaying(true);
      const swimmerId = selectedInvoice ? selectedInvoice.swimmer : selectedInstallment?.swimmer_id;
      const invoiceId = selectedInvoice ? selectedInvoice.id : selectedInstallment?.invoice;

      await api.post('/finance/payments/record/', {
        swimmer_id: swimmerId,
        invoice_id: invoiceId,
        installment_id: selectedInstallment ? selectedInstallment.id : null,
        amount: payForm.amount,
        method: payForm.method,
        transaction_ref: payForm.transaction_ref,
        notes: payForm.notes,
        idempotency_key: `adm-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      });

      setIsPayModalOpen(false);
      setSelectedInvoice(null);
      setSelectedInstallment(null);
      setPayForm({ amount: '', method: 'POS', transaction_ref: '', notes: '' });
      toast.success('پرداخت با موفقیت در سیستم ثبت گردید و مانده صورتحساب تعدیل شد.');
      fetchFinance();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در ثبت پرداخت');
    } finally {
      setPaying(false);
    }
  };

  // Open Adjustment Modal
  const handleOpenAdjModal = (invoice) => {
    setAdjInvoice(invoice);
    setAdjForm({
      type: 'DISCOUNT',
      amount: '',
      reason: '',
    });
    setIsAdjModalOpen(true);
  };

  // Submit Adjustment
  const handleRecordAdjustment = async (e) => {
    e.preventDefault();
    if (!adjInvoice || !adjForm.amount || !adjForm.reason) {
      toast.error('مبلغ و دلیل تعدیل مالی الزامی هستند.');
      return;
    }
    try {
      setSubmittingAdj(true);
      await api.post('/finance/adjustments/', {
        invoice: adjInvoice.id,
        type: adjForm.type,
        amount: adjForm.amount,
        reason: adjForm.reason,
      });

      setIsAdjModalOpen(false);
      setAdjInvoice(null);
      toast.success(
        adjForm.type === 'DISCOUNT'
          ? 'سند تخفیف با موفقیت روی صورتحساب اعمال گردید.'
          : 'سند استرداد وجه با موفقیت ثبت شد.'
      );
      fetchFinance();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در ثبت سند تعدیل مالی');
    } finally {
      setSubmittingAdj(false);
    }
  };

  const formatPrice = (val) => Number(val || 0).toLocaleString('fa-IR');

  const statusBadges = {
    PAID: { label: 'تسویه کامل', variant: 'success' },
    PARTIALLY_PAID: { label: 'بخشی پرداخت‌شده', variant: 'warning' },
    ISSUED: { label: 'پرداخت‌نشده', variant: 'danger' },
    CANCELLED: { label: 'باطل‌شده', variant: 'neutral' },
    OVERDUE: { label: 'سررسید گذشته', variant: 'danger' },
    UNPAID: { label: 'پرداخت‌نشده', variant: 'warning' },
  };

  const methodLabels = {
    POS: 'دستگاه کارتخوان حضوری',
    CARD_TRANSFER: 'کارت به کارت / شبا',
    CASH: 'نقدی',
    ONLINE_GATEWAY: 'درگاه پرداخت آنلاین',
  };

  // Export handlers
  const handleExportInvoicesCsv = () => {
    const rows = invoices.map((inv) => ({
      invoice_number: inv.invoice_number,
      swimmer: inv.swimmer_name,
      total_amount: formatPrice(inv.total_amount),
      total_paid: formatPrice(inv.total_paid),
      balance: formatPrice(inv.remaining_balance),
      status: inv.status_display,
      date: new Date(inv.created_at).toLocaleDateString('fa-IR'),
    }));
    exportToCsv('IranSwim_Invoices_List', rows, {
      invoice_number: 'شماره فاکتور',
      swimmer: 'شناگر',
      total_amount: 'مبلغ کل (تومان)',
      total_paid: 'پرداخت‌شده (تومان)',
      balance: 'مانده بدهی (تومان)',
      status: 'وضعیت',
      date: 'تاریخ صدور',
    });
  };

  const handleExportInstallmentsCsv = () => {
    const rows = installments.map((inst) => ({
      swimmer: inst.swimmer_name,
      phone: inst.swimmer_phone,
      invoice: inst.invoice_number,
      num: `قسط ${inst.installment_number}`,
      amount: formatPrice(inst.amount),
      remaining: formatPrice(inst.remaining_amount),
      due_date: new Date(inst.due_date).toLocaleDateString('fa-IR'),
      status: inst.status_display,
    }));
    exportToCsv('IranSwim_Overdue_Installments', rows, {
      swimmer: 'نام بدهکار',
      phone: 'تلفن تماس',
      invoice: 'شماره فاکتور',
      num: 'شماره قسط',
      amount: 'مبلغ قسط',
      remaining: 'مانده پرداخت‌نشده',
      due_date: 'تاریخ سررسید',
      status: 'وضعیت',
    });
  };

  const totalPages = Math.ceil(invoices.length / pageSize) || 1;
  const paginatedInvoices = invoices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-sky-600" />
            امور مالی، صورتحساب‌ها، اقساط و پیگیری مطالبات
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            ثبت تراکنش‌های قطعی با تخصیص به اقساط، کنترل مانده بدهکاران و اسناد تعدیل (تخفیف و استرداد)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportInvoicesCsv} className="gap-1.5 text-xs">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>خروجی اکسل صورتحساب‌ها</span>
          </Button>
          <Button variant="outline" onClick={fetchFinance} className="gap-1.5 text-xs">
            <RefreshCw className="w-4 h-4" />
            <span>به‌روزرسانی</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="مجموع فاکتورهای صادرشده"
          value={`${formatPrice(summary?.total_invoiced)} تومان`}
          subtitle="تعهدات مالی ثبت‌شده شناگران"
          icon={FileText}
          color="indigo"
        />
        <StatsCard
          title="درآمد واقعاً وصول‌شده"
          value={`${formatPrice(summary?.total_paid)} تومان`}
          subtitle="تراکنش‌های قطعی کارتخوان و نقدی"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatsCard
          title="مانده مطالبات معوق (بدهکاران)"
          value={`${formatPrice(summary?.receivables)} تومان`}
          subtitle="نیازمند پیگیری وصول شهریه"
          icon={AlertCircle}
          color={Number(summary?.receivables || 0) > 0 ? 'amber' : 'emerald'}
        />
        <StatsCard
          title="اقساط سررسید گذشته"
          value={`${summary?.overdue_installments_count ?? 0} مورد`}
          subtitle="اقساط معوق پرداخت‌نشده"
          icon={AlertCircle}
          color={(summary?.overdue_installments_count || 0) > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Financial Tabs Switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700 text-xs w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('INVOICES')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'INVOICES'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>صورتحساب‌ها ({invoices.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('INSTALLMENTS')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'INSTALLMENTS'
              ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>اقساط معوق و بدهکاران ({installments.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('PAYMENTS')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'PAYMENTS'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>رسیدها و پرداخت‌ها ({payments.length})</span>
        </button>
      </div>

      {loading ? (
        <LoadingState message="در حال دریافت اطلاعات مالی..." />
      ) : activeTab === 'INVOICES' ? (
        /* TAB 1: INVOICES */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 rounded-r-xl">شماره فاکتور</th>
                  <th className="px-4 py-3.5">نام شناگر</th>
                  <th className="px-4 py-3.5">مبلغ کل</th>
                  <th className="px-4 py-3.5">پرداخت‌شده</th>
                  <th className="px-4 py-3.5">مانده بدهی</th>
                  <th className="px-4 py-3.5">اقساط</th>
                  <th className="px-4 py-3.5">وضعیت</th>
                  <th className="px-4 py-3.5 text-center rounded-l-xl">عملیات مالی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {paginatedInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-800 dark:text-slate-100">
                      {inv.invoice_number}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-100">
                      {inv.swimmer_name}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {formatPrice(inv.total_amount)} تومان
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatPrice(inv.total_paid)} تومان
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                      {formatPrice(inv.remaining_balance)} تومان
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {(inv.installments || []).length} قسط
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={statusBadges[inv.status]?.variant || 'neutral'}>
                        {inv.status_display}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {inv.status !== 'PAID' && (
                          <button
                            type="button"
                            onClick={() => handleOpenPayModal(inv)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-semibold text-xs border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                            title="ثبت پرداخت برای این فاکتور"
                          >
                            ثبت واریزی
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenAdjModal(inv)}
                          className="px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold text-xs border border-slate-200/60 dark:border-slate-700 transition-colors cursor-pointer"
                          title="تخفیف یا استرداد وجه"
                        >
                          تعدیل / تخفیف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {paginatedInvoices.map((inv) => (
              <div
                key={inv.id}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3 text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400 block">
                      {inv.invoice_number}
                    </span>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5">
                      {inv.swimmer_name}
                    </h3>
                  </div>
                  <Badge variant={statusBadges[inv.status]?.variant || 'neutral'}>
                    {inv.status_display}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[10px]">مبلغ کل</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {formatPrice(inv.total_amount)} تومان
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">پرداخت‌شده</span>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatPrice(inv.total_paid)} تومان
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">مانده بدهی</span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      {formatPrice(inv.remaining_balance)} تومان
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">تعداد اقساط</span>
                    <span className="text-slate-600 dark:text-slate-300">
                      {(inv.installments || []).length} قسط
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                  {inv.status !== 'PAID' && (
                    <button
                      type="button"
                      onClick={() => handleOpenPayModal(inv)}
                      className="flex-1 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-semibold border border-emerald-200 dark:border-emerald-800 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>ثبت واریزی</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenAdjModal(inv)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-semibold border border-slate-200/60 dark:border-slate-700 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>تعدیل / تخفیف</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              نمایش {paginatedInvoices.length} از {invoices.length} فاکتور
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      ) : activeTab === 'INSTALLMENTS' ? (
        /* TAB 2: OVERDUE INSTALLMENTS & DEBTORS */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              فهرست اقساط سررسید گذشته که هنوز تسویه نشده‌اند. مدیر می‌تواند با یک کلیک پرداخت را ثبت یا تماس حاصل کند.
            </p>
            <Button variant="outline" onClick={handleExportInstallmentsCsv} className="gap-1.5 text-xs">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>خروجی لیست بدهکاران</span>
            </Button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors">
            {installments.length === 0 ? (
              <EmptyState
                title="اقساط سررسید گذشته‌ای وجود ندارد"
                description="تمام اقساط تا به این لحظه تسویه شده‌اند و هیچ بدهی معوقه‌ای ثبت نشده است."
              />
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3.5 rounded-r-xl">شناگر بدهکار</th>
                        <th className="px-4 py-3.5">تلفن تماس</th>
                        <th className="px-4 py-3.5">شماره قسط و فاکتور</th>
                        <th className="px-4 py-3.5">مبلغ قسط</th>
                        <th className="px-4 py-3.5">مانده پرداخت‌نشده</th>
                        <th className="px-4 py-3.5">تاریخ سررسید</th>
                        <th className="px-4 py-3.5 text-center rounded-l-xl">عملیات فوری</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                      {installments.map((inst) => (
                        <tr key={inst.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-100">
                            {inst.swimmer_name}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-300">
                            <a href={`tel:${inst.swimmer_phone}`} className="hover:text-sky-600 flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{inst.swimmer_phone}</span>
                            </a>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400 font-mono">
                            قسط {inst.installment_number} ({inst.invoice_number})
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs">
                            {formatPrice(inst.amount)} تومان
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                            {formatPrice(inst.remaining_amount)} تومان
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs text-rose-500 font-semibold">
                            {new Date(inst.due_date).toLocaleDateString('fa-IR')}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenPayModal(null, inst)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-xs shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>ثبت تسویه این قسط</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden space-y-3">
                  {installments.map((inst) => (
                    <div
                      key={inst.id}
                      className="p-4 rounded-2xl bg-rose-50/30 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 space-y-3 text-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                            {inst.swimmer_name}
                          </h3>
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mt-0.5">
                            قسط {inst.installment_number} ({inst.invoice_number})
                          </span>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                          سررسید: {new Date(inst.due_date).toLocaleDateString('fa-IR')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-rose-200/40 dark:border-rose-900/30 text-slate-600 dark:text-slate-300">
                        <div>
                          <span className="text-slate-400 block text-[10px]">مبلغ قسط</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300">
                            {formatPrice(inst.amount)} تومان
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">مانده معوقه</span>
                          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                            {formatPrice(inst.remaining_amount)} تومان
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 block text-[10px]">تماس با شناگر</span>
                          <a href={`tel:${inst.swimmer_phone}`} className="hover:text-sky-600 flex items-center gap-1 font-mono text-sky-600 dark:text-sky-400 underline decoration-sky-300">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{inst.swimmer_phone}</span>
                          </a>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-rose-200/40 dark:border-rose-900/30">
                        <button
                          type="button"
                          onClick={() => handleOpenPayModal(null, inst)}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <DollarSign className="w-4 h-4" />
                          <span>ثبت تسویه این قسط</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* TAB 3: PAYMENTS LIST */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 rounded-r-xl">شماره رسید تراکنش</th>
                  <th className="px-4 py-3.5">شناگر</th>
                  <th className="px-4 py-3.5">مبلغ پرداختی</th>
                  <th className="px-4 py-3.5">روش پرداخت</th>
                  <th className="px-4 py-3.5">شماره پیگیری / مرجع بانکی</th>
                  <th className="px-4 py-3.5">وضعیت</th>
                  <th className="px-4 py-3.5 rounded-l-xl">زمان ثبت تراکنش</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-800 dark:text-slate-100">
                      {p.payment_number}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-100">
                      {p.swimmer_name}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatPrice(p.amount)} تومان
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                      {methodLabels[p.method] || p.method_display || p.method}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                      {p.transaction_ref || '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={p.status === 'SUCCESSFUL' ? 'success' : 'warning'}>
                        {p.status_display}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-400">
                      {new Date(p.paid_at || p.created_at).toLocaleString('fa-IR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {payments.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3 text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs text-slate-400 block">
                      {p.payment_number}
                    </span>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5">
                      {p.swimmer_name}
                    </h3>
                  </div>
                  <Badge variant={p.status === 'SUCCESSFUL' ? 'success' : 'warning'}>
                    {p.status_display}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[10px]">مبلغ پرداختی</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatPrice(p.amount)} تومان
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">روش پرداخت</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {methodLabels[p.method] || p.method_display || p.method}
                    </span>
                  </div>
                  {p.transaction_ref && (
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[10px]">شماره پیگیری بانکی</span>
                      <span className="font-mono text-slate-600 dark:text-slate-400">{p.transaction_ref}</span>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">زمان ثبت</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">
                      {new Date(p.paid_at || p.created_at).toLocaleString('fa-IR')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1. Modal: Record Manual Payment */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={
          selectedInstallment
            ? `ثبت پرداخت قسط ${selectedInstallment.installment_number}: ${selectedInstallment.swimmer_name}`
            : `ثبت پرداخت شهریه: ${selectedInvoice?.swimmer_name} (${selectedInvoice?.invoice_number})`
        }
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800 text-xs text-sky-800 dark:text-sky-300">
            {selectedInstallment ? (
              <span>
                مبلغ مانده این قسط: <b>{formatPrice(selectedInstallment.remaining_amount)} تومان</b>
              </span>
            ) : (
              <span>
                مانده کل صورتحساب: <b>{formatPrice(selectedInvoice?.remaining_balance)} تومان</b>
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              مبلغ پرداختی (تومان) *
            </label>
            <input
              type="number"
              required
              min="1000"
              value={payForm.amount}
              onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                روش پرداخت *
              </label>
              <select
                value={payForm.method}
                onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              >
                <option value="POS">دستگاه کارتخوان حضوری (POS)</option>
                <option value="CARD_TRANSFER">کارت به کارت / واریز شبا</option>
                <option value="CASH">نقدی</option>
                <option value="ONLINE_GATEWAY">درگاه پرداخت الکترونیک</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                شماره پیگیری / ارجاع بانکی (اختیاری)
              </label>
              <input
                type="text"
                value={payForm.transaction_ref}
                onChange={(e) => setPayForm({ ...payForm, transaction_ref: e.target.value })}
                placeholder="شماره پیگیری دستگاه پوز یا کارت"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              توضیحات و یادداشت حسابداری
            </label>
            <input
              type="text"
              value={payForm.notes}
              onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
              placeholder="مثال: تسویه قسط اول ترم پاییز..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsPayModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={paying}>
              {paying ? 'در حال ثبت...' : 'ثبت قطعی پرداخت'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Modal: Financial Adjustment (Discount / Refund) */}
      <Modal
        isOpen={isAdjModalOpen}
        onClose={() => setIsAdjModalOpen(false)}
        title={`تعدیل مالی و تخفیف برای فاکتور: ${adjInvoice?.invoice_number}`}
      >
        <form onSubmit={handleRecordAdjustment} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                نوع سند تعدیل مالی *
              </label>
              <select
                value={adjForm.type}
                onChange={(e) => setAdjForm({ ...adjForm, type: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              >
                <option value="DISCOUNT">تخفیف مدیریتی (کاهش مانده صورتحساب)</option>
                <option value="REFUND">استرداد وجه به شناگر (انصراف یا کنسلی)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                مبلغ تعدیل (تومان) *
              </label>
              <input
                type="number"
                required
                min="1000"
                value={adjForm.amount}
                onChange={(e) => setAdjForm({ ...adjForm, amount: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              دلیل و مستندات تعدیل مالی *
            </label>
            <textarea
              rows={3}
              required
              value={adjForm.reason}
              onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })}
              placeholder="مثال: تخفیف ثبت‌نام خانوادگی یا استرداد وجه به علت جابجایی منزل..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsAdjModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={submittingAdj}>
              {submittingAdj ? 'در حال ثبت سند...' : 'ثبت سند تعدیل مالی'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
