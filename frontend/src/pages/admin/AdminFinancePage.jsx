import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CreditCard, AlertCircle, FileText, CheckCircle2,
  DollarSign, ArrowUpRight, ArrowDownLeft, Plus,
  FileSpreadsheet, Search, RefreshCw, User, Phone,
  Filter, RotateCcw, Calendar, MapPin, UserCheck, Users, X
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { StatsCard } from '../../components/common/StatsCard';
import { Pagination } from '../../components/common/Pagination';
import { CustomSelect } from '../../components/common/CustomSelect';
import { useToast } from '../../context/ToastContext';
import { exportToCsv } from '../../utils/exportCsv';

export const AdminFinancePage = () => {
  const [activeTab, setActiveTab] = useState('INVOICES'); // INVOICES, INSTALLMENTS, PAYMENTS
  const [invoices, setInvoices] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Category Filters: جنسیت, استخر, مربی, سال تولد
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [poolFilter, setPoolFilter] = useState('ALL');
  const [coachFilter, setCoachFilter] = useState('ALL');
  const [birthYearFilter, setBirthYearFilter] = useState('ALL');

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

  // Handle Quick Action deep link
  useEffect(() => {
    if (searchParams.get('action') === 'pay') {
      setActiveTab('INVOICES');
      if (invoices.length > 0) {
        const unpaid = invoices.find((inv) => Number(inv.remaining_balance) > 0) || invoices[0];
        if (unpaid) {
          handleOpenPayModal(unpaid);
        }
      }
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('action');
        return next;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams, invoices]);


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

  // Available filter options dynamically extracted from data
  const availablePools = useMemo(() => {
    const list = [
      'استخر ۵۰ متری المپیک',
      'استخر آزادی',
      'استخر قهرمانی آزادی',
      'استخر آموزشی سرپوشیده با دمای ۳۱ درجه',
      ...invoices.map((i) => i.pool_name),
      ...installments.map((i) => i.pool_name),
      ...payments.map((i) => i.pool_name),
    ].filter((p) => p && p !== '—');
    return Array.from(new Set(list));
  }, [invoices, installments, payments]);

  const availableCoaches = useMemo(() => {
    const list = [
      'علیرضا مرادی (مربی)',
      'محمد رضایی',
      'نیما سعادتی',
      'سارا کاظمی',
      'مهدی یزدانی',
      ...invoices.map((i) => i.coach_name),
      ...installments.map((i) => i.coach_name),
      ...payments.map((i) => i.coach_name),
    ].filter((c) => c && c !== '—');
    return Array.from(new Set(list));
  }, [invoices, installments, payments]);

  const availableBirthYears = useMemo(() => {
    const list = [
      ...invoices.map((i) => i.birth_year),
      ...installments.map((i) => i.birth_year),
      ...payments.map((i) => i.birth_year),
      '1388', '1389', '1390', '1391', '1392', '1393', '1394', '1395'
    ].filter((y) => y && y !== '—');
    return Array.from(new Set(list)).sort((a, b) => Number(a) - Number(b));
  }, [invoices, installments, payments]);

  const genderOptions = [
    { value: 'ALL', label: 'همه جنسیت‌ها' },
    { value: 'MALE', label: 'پسر / آقایان' },
    { value: 'FEMALE', label: 'دختر / بانوان' },
  ];

  const poolOptions = useMemo(() => [
    { value: 'ALL', label: 'همه استخرها' },
    ...availablePools.map((p) => ({ value: p, label: p })),
  ], [availablePools]);

  const coachOptions = useMemo(() => [
    { value: 'ALL', label: 'همه مربیان' },
    ...availableCoaches.map((c) => ({ value: c, label: c })),
  ], [availableCoaches]);

  const birthYearOptions = useMemo(() => [
    { value: 'ALL', label: 'همه سال‌های تولد' },
    ...availableBirthYears.map((y) => ({ value: y, label: `متولدین سال ${y}` })),
  ], [availableBirthYears]);

  const filterItem = (item) => {
    if (genderFilter !== 'ALL' && item.gender !== genderFilter) return false;
    if (poolFilter !== 'ALL' && item.pool_name !== poolFilter) return false;
    if (coachFilter !== 'ALL' && item.coach_name !== coachFilter && !item.coach_name?.includes(coachFilter)) return false;
    if (birthYearFilter !== 'ALL' && String(item.birth_year) !== String(birthYearFilter)) return false;
    return true;
  };

  const filteredInvoices = useMemo(() => invoices.filter(filterItem), [invoices, genderFilter, poolFilter, coachFilter, birthYearFilter]);
  const filteredInstallments = useMemo(() => installments.filter(filterItem), [installments, genderFilter, poolFilter, coachFilter, birthYearFilter]);
  const filteredPayments = useMemo(() => payments.filter(filterItem), [payments, genderFilter, poolFilter, coachFilter, birthYearFilter]);

  const isAnyFilterActive = genderFilter !== 'ALL' || poolFilter !== 'ALL' || coachFilter !== 'ALL' || birthYearFilter !== 'ALL';

  const handleResetFilters = () => {
    setGenderFilter('ALL');
    setPoolFilter('ALL');
    setCoachFilter('ALL');
    setBirthYearFilter('ALL');
    setCurrentPage(1);
  };

  // Export handlers
  const handleExportInvoicesCsv = () => {
    const rows = filteredInvoices.map((inv) => ({
      invoice_number: inv.invoice_number,
      swimmer: inv.swimmer_name,
      gender: inv.gender_display || (inv.gender === 'FEMALE' ? 'دختر / بانوان' : 'پسر / آقایان'),
      pool: inv.pool_name || '—',
      coach: inv.coach_name || '—',
      birth_year: inv.birth_year || '—',
      total_amount: formatPrice(inv.total_amount),
      total_paid: formatPrice(inv.total_paid),
      balance: formatPrice(inv.remaining_balance),
      installments_count: (inv.installments || []).length,
      status: inv.status_display,
      date: new Date(inv.created_at).toLocaleDateString('fa-IR'),
    }));
    exportToCsv('IranSwim_Invoices_List', rows, {
      invoice_number: 'شماره فاکتور',
      swimmer: 'شناگر',
      gender: 'جنسیت',
      pool: 'استخر',
      coach: 'مربی',
      birth_year: 'سال تولد',
      total_amount: 'مبلغ کل (تومان)',
      total_paid: 'پرداخت‌شده (تومان)',
      balance: 'مانده بدهی (تومان)',
      installments_count: 'تعداد اقساط',
      status: 'وضعیت',
      date: 'تاریخ صدور',
    });
  };

  const handleExportInstallmentsCsv = () => {
    const rows = filteredInstallments.map((inst) => ({
      swimmer: inst.swimmer_name,
      gender: inst.gender_display || (inst.gender === 'FEMALE' ? 'دختر / بانوان' : 'پسر / آقایان'),
      pool: inst.pool_name || '—',
      coach: inst.coach_name || '—',
      birth_year: inst.birth_year || '—',
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
      gender: 'جنسیت',
      pool: 'استخر',
      coach: 'مربی',
      birth_year: 'سال تولد',
      phone: 'تلفن تماس',
      invoice: 'شماره فاکتور',
      num: 'شماره قسط',
      amount: 'مبلغ قسط',
      remaining: 'مانده پرداخت‌نشده',
      due_date: 'تاریخ سررسید',
      status: 'وضعیت',
    });
  };

  const handleExportPaymentsCsv = () => {
    const rows = filteredPayments.map((p) => ({
      payment_number: p.payment_number,
      swimmer: p.swimmer_name,
      gender: p.gender_display || (p.gender === 'FEMALE' ? 'دختر / بانوان' : 'پسر / آقایان'),
      pool: p.pool_name || '—',
      coach: p.coach_name || '—',
      birth_year: p.birth_year || '—',
      amount: formatPrice(p.amount),
      method: methodLabels[p.method] || p.method_display || p.method,
      ref: p.transaction_ref || '—',
      status: p.status_display,
      date: new Date(p.paid_at || p.created_at).toLocaleString('fa-IR'),
    }));
    exportToCsv('IranSwim_Payments_List', rows, {
      payment_number: 'شماره رسید',
      swimmer: 'شناگر',
      gender: 'جنسیت',
      pool: 'استخر',
      coach: 'مربی',
      birth_year: 'سال تولد',
      amount: 'مبلغ پرداختی (تومان)',
      method: 'روش پرداخت',
      ref: 'شماره پیگیری',
      status: 'وضعیت',
      date: 'زمان ثبت تراکنش',
    });
  };

  const handleExportCurrent = () => {
    if (activeTab === 'INVOICES') handleExportInvoicesCsv();
    else if (activeTab === 'INSTALLMENTS') handleExportInstallmentsCsv();
    else if (activeTab === 'PAYMENTS') handleExportPaymentsCsv();
  };

  const totalPages = Math.ceil(filteredInvoices.length / pageSize) || 1;
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
          value={`${(summary?.overdue_installments_count ?? 0).toLocaleString('fa-IR')} مورد`}
          subtitle="اقساط معوق پرداخت‌نشده"
          icon={AlertCircle}
          color={(summary?.overdue_installments_count || 0) > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Row 1: Category Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700 text-xs w-full sm:w-fit overflow-x-auto">
        <button
          type="button"
          onClick={() => { setActiveTab('INVOICES'); setCurrentPage(1); }}
          className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'INVOICES'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>صورت حساب ها</span>
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('INSTALLMENTS'); setCurrentPage(1); }}
          className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'INSTALLMENTS'
              ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>اقساط</span>
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('PAYMENTS'); setCurrentPage(1); }}
          className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'PAYMENTS'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>رسیدها</span>
        </button>
      </div>

      {/* Row 2: Secondary Category Row (Custom Designed Dropdowns): "جنسیت", "استخر", "مربی", "سال تولد" */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
            <Filter className="w-4 h-4 text-sky-600" />
            <span>دسته‌بندی و فیلترهای تکمیلی:</span>
          </div>
          {isAnyFilterActive && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>پاک کردن فیلترها</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* 1. جنسیت */}
          <CustomSelect
            label="جنسیت"
            icon={Users}
            value={genderFilter}
            onChange={(val) => { setGenderFilter(val); setCurrentPage(1); }}
            options={genderOptions}
          />

          {/* 2. استخر */}
          <CustomSelect
            label="استخر"
            icon={MapPin}
            value={poolFilter}
            onChange={(val) => { setPoolFilter(val); setCurrentPage(1); }}
            options={poolOptions}
            searchable={availablePools.length > 5}
          />

          {/* 3. مربی */}
          <CustomSelect
            label="مربی"
            icon={UserCheck}
            value={coachFilter}
            onChange={(val) => { setCoachFilter(val); setCurrentPage(1); }}
            options={coachOptions}
            searchable={availableCoaches.length > 5}
          />

          {/* 4. سال تولد */}
          <CustomSelect
            label="سال تولد"
            icon={Calendar}
            value={birthYearFilter}
            onChange={(val) => { setBirthYearFilter(val); setCurrentPage(1); }}
            options={birthYearOptions}
            searchable={availableBirthYears.length > 5}
          />
        </div>

        {/* Applied filters tags bar */}
        {isAnyFilterActive && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            <span className="text-slate-400 font-medium">اعمال‌شده:</span>
            {genderFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-bold">
                <span>جنسیت: {genderFilter === 'MALE' ? 'پسر / آقایان' : 'دختر / بانوان'}</span>
                <button
                  type="button"
                  onClick={() => setGenderFilter('ALL')}
                  className="hover:text-rose-600 cursor-pointer p-0.5 rounded-md"
                  title="حذف این فیلتر"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {poolFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-bold">
                <span>استخر: {poolFilter}</span>
                <button
                  type="button"
                  onClick={() => setPoolFilter('ALL')}
                  className="hover:text-rose-600 cursor-pointer p-0.5 rounded-md"
                  title="حذف این فیلتر"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {coachFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-bold">
                <span>مربی: {coachFilter}</span>
                <button
                  type="button"
                  onClick={() => setCoachFilter('ALL')}
                  className="hover:text-rose-600 cursor-pointer p-0.5 rounded-md"
                  title="حذف این فیلتر"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {birthYearFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-bold">
                <span>متولدین {birthYearFilter}</span>
                <button
                  type="button"
                  onClick={() => setBirthYearFilter('ALL')}
                  className="hover:text-rose-600 cursor-pointer p-0.5 rounded-md"
                  title="حذف این فیلتر"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <LoadingState message="در حال دریافت اطلاعات مالی..." />
      ) : activeTab === 'INVOICES' ? (
        /* TAB 1: INVOICES */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors">
          {/* Header above Table with Excel Icon */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>صورتحساب‌های صادرشده</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-mono">
                  {filteredInvoices.length} فاکتور
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportInvoicesCsv}
                className="w-9 h-9 flex items-center justify-center text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl transition-colors cursor-pointer shadow-2xs"
                title="خروجی فایل اکسل صورتحساب‌ها"
                aria-label="خروجی اکسل"
              >
                <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
              </button>
              <button
                type="button"
                onClick={fetchFinance}
                className="w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl transition-colors cursor-pointer shadow-2xs"
                title="به‌روزرسانی داده‌ها"
                aria-label="به‌روزرسانی"
              >
                <RefreshCw className={`w-4.5 h-4.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {filteredInvoices.length === 0 ? (
            <EmptyState
              title="صورتحسابی با این مشخصات یافت نشد"
              description="می‌توانید فیلترهای دسته‌بندی بالا را تغییر دهید یا بازنشانی کنید."
              action={
                isAnyFilterActive ? (
                  <Button variant="outline" onClick={handleResetFilters} className="text-xs gap-1.5 mt-2">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>پاک کردن فیلترها</span>
                  </Button>
                ) : null
              }
            />
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5 rounded-r-xl">شماره فاکتور</th>
                      <th className="px-4 py-3.5">نام و مشخصات شناگر</th>
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
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-100">
                            {inv.swimmer_name}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>{inv.gender_display || (inv.gender === 'FEMALE' ? 'دختر / بانوان' : 'پسر / آقایان')}</span>
                            <span>•</span>
                            <span>متولد {inv.birth_year ? `${inv.birth_year}` : '—'}</span>
                            <span>•</span>
                            <span className="text-slate-600 dark:text-slate-400">{inv.pool_name}</span>
                            {inv.coach_name && inv.coach_name !== '—' && (
                              <>
                                <span>•</span>
                                <span>مربی: {inv.coach_name}</span>
                              </>
                            )}
                          </div>
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

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                        {inv.gender_display || (inv.gender === 'FEMALE' ? 'دختر / بانوان' : 'پسر / آقایان')}
                      </span>
                      {inv.birth_year && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                          متولد {inv.birth_year}
                        </span>
                      )}
                      {inv.pool_name && inv.pool_name !== '—' && (
                        <span className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300">
                          {inv.pool_name}
                        </span>
                      )}
                      {inv.coach_name && inv.coach_name !== '—' && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                          مربی: {inv.coach_name}
                        </span>
                      )}
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
                  نمایش {paginatedInvoices.length} از {filteredInvoices.length} فاکتور
                </span>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          )}
        </div>
      ) : activeTab === 'INSTALLMENTS' ? (
        /* TAB 2: OVERDUE INSTALLMENTS & DEBTORS */
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors">
            {/* Header above Table with Excel Icon */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>اقساط معوق و بدهکاران</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-mono">
                    {filteredInstallments.length} مورد
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  فهرست اقساط سررسید گذشته نیازمند پیگیری وصول شهریه
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportInstallmentsCsv}
                  className="w-9 h-9 flex items-center justify-center text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl transition-colors cursor-pointer shadow-2xs"
                  title="خروجی فایل اکسل لیست بدهکاران"
                  aria-label="خروجی اکسل"
                >
                  <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                </button>
                <button
                  type="button"
                  onClick={fetchFinance}
                  className="w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl transition-colors cursor-pointer shadow-2xs"
                  title="به‌روزرسانی داده‌ها"
                  aria-label="به‌روزرسانی"
                >
                  <RefreshCw className={`w-4.5 h-4.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {filteredInstallments.length === 0 ? (
              <EmptyState
                title="قسط معوقه‌ای با این مشخصات وجود ندارد"
                description="هیچ بدهی معوقه‌ای منطبق با فیلترهای انتخابی ثبت نشده است."
                action={
                  isAnyFilterActive ? (
                    <Button variant="outline" onClick={handleResetFilters} className="text-xs gap-1.5 mt-2">
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>پاک کردن فیلترها</span>
                    </Button>
                  ) : null
                }
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
                      {filteredInstallments.map((inst) => (
                        <tr key={inst.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-100">
                            <div>{inst.swimmer_name}</div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-0.5 font-normal">
                              <span>{inst.gender_display || (inst.gender === 'FEMALE' ? 'دختر / بانوان' : 'پسر / آقایان')}</span>
                              <span>•</span>
                              <span>متولد {inst.birth_year ? `${inst.birth_year}` : '—'}</span>
                              <span>•</span>
                              <span className="text-slate-600 dark:text-slate-400">{inst.pool_name}</span>
                              {inst.coach_name && inst.coach_name !== '—' && (
                                <>
                                  <span>•</span>
                                  <span>مربی: {inst.coach_name}</span>
                                </>
                              )}
                            </div>
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
                  {filteredInstallments.map((inst) => (
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

                      {/* Metadata tags */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                          {inst.gender_display || (inst.gender === 'FEMALE' ? 'دختر / بانوان' : 'پسر / آقایان')}
                        </span>
                        {inst.birth_year && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                            متولد {inst.birth_year}
                          </span>
                        )}
                        {inst.pool_name && inst.pool_name !== '—' && (
                          <span className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300">
                            {inst.pool_name}
                          </span>
                        )}
                        {inst.coach_name && inst.coach_name !== '—' && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                            مربی: {inst.coach_name}
                          </span>
                        )}
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
          {/* Header above Table with Excel Icon */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>رسیدها و تراکنش‌های وصول‌شده</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono">
                  {filteredPayments.length} رسید
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportPaymentsCsv}
                className="w-9 h-9 flex items-center justify-center text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl transition-colors cursor-pointer shadow-2xs"
                title="خروجی فایل اکسل تراکنش‌ها"
                aria-label="خروجی اکسل"
              >
                <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
              </button>
              <button
                type="button"
                onClick={fetchFinance}
                className="w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl transition-colors cursor-pointer shadow-2xs"
                title="به‌روزرسانی داده‌ها"
                aria-label="به‌روزرسانی"
              >
                <RefreshCw className={`w-4.5 h-4.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {filteredPayments.length === 0 ? (
            <EmptyState
              title="تراکنشی با این مشخصات یافت نشد"
              description="می‌توانید فیلترهای دسته‌بندی بالا را تغییر دهید یا بازنشانی کنید."
              action={
                isAnyFilterActive ? (
                  <Button variant="outline" onClick={handleResetFilters} className="text-xs gap-1.5 mt-2">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>پاک کردن فیلترها</span>
                  </Button>
                ) : null
              }
            />
          ) : (
            <>
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
                    {filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-800 dark:text-slate-100">
                          {p.payment_number}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-100">
                          <div>{p.swimmer_name}</div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-0.5 font-normal">
                            <span>{p.gender_display || (p.gender === 'FEMALE' ? 'دختر / بانوان' : 'پسر / آقایان')}</span>
                            <span>•</span>
                            <span>متولد {p.birth_year ? `${p.birth_year}` : '—'}</span>
                            <span>•</span>
                            <span className="text-slate-600 dark:text-slate-400">{p.pool_name}</span>
                            {p.coach_name && p.coach_name !== '—' && (
                              <>
                                <span>•</span>
                                <span>مربی: {p.coach_name}</span>
                              </>
                            )}
                          </div>
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
                {filteredPayments.map((p) => (
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

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                        {p.gender_display || (p.gender === 'FEMALE' ? 'دختر / بانوان' : 'پسر / آقایان')}
                      </span>
                      {p.birth_year && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                          متولد {p.birth_year}
                        </span>
                      )}
                      {p.pool_name && p.pool_name !== '—' && (
                        <span className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300">
                          {p.pool_name}
                        </span>
                      )}
                      {p.coach_name && p.coach_name !== '—' && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                          مربی: {p.coach_name}
                        </span>
                      )}
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
            </>
          )}
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
