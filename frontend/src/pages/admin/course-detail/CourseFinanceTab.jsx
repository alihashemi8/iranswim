import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DollarSign, CreditCard, Users, GraduationCap, CheckCircle2,
  AlertCircle, Clock, Plus, Search, Filter, RefreshCw, FileText,
  Download, ArrowRight, Eye, Calendar, Building2, Upload,
  Copy, Check, FileCheck2, AlertTriangle, ShieldCheck, Wallet,
  Receipt, ArrowUpRight, ArrowDownLeft, Trash2, X, Sparkles,
  FileSpreadsheet, ExternalLink
} from 'lucide-react';
import api from '../../../api/client';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { CustomSelect } from '../../../components/common/CustomSelect';
import { LoadingState } from '../../../components/common/LoadingState';
import { EmptyState } from '../../../components/common/EmptyState';
import { ProgressBar } from '../../../components/common/Charts';
import { PersianDatePicker } from '../../../components/common/PersianDatePicker';
import { useToast } from '../../../context/ToastContext';
import { exportToCsv } from '../../../utils/exportCsv';
import { getBankNameFromCard, formatCardNumberWithDashes } from '../../../utils/bankCard';
import { toShamsiDate } from '../../../utils/date';

export const CourseFinanceTab = ({ courseId, course, onRefreshCourse }) => {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [financeData, setFinanceData] = useState(null);

  // Sub-tabs: 'swimmers' (شناگران) vs 'coaches' (مربی‌ها)
  const [activeSubTab, setActiveSubTab] = useState('swimmers');

  // Swimmer view mode: 'invoices' | 'installments' | 'payments' | 'receipts'
  const [swimmerView, setSwimmerView] = useState('invoices');

  // Filters & Search for Swimmers
  const [searchQuery, setSearchQuery] = useState('');
  const [swimmerCoachFilter, setSwimmerCoachFilter] = useState('ALL');
  const [swimmerStatusFilter, setSwimmerStatusFilter] = useState('ALL');

  // Search & Filters for Coaches
  const [coachSearchQuery, setCoachSearchQuery] = useState('');

  // -------------------------------------------------------------
  // Modals state: Swimmers
  // -------------------------------------------------------------
  // 1. Record Swimmer Payment Modal
  const [isSwimmerPayModalOpen, setIsSwimmerPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [swimmerPayForm, setSwimmerPayForm] = useState({
    amount: '',
    method: 'POS',
    transaction_ref: '',
    notes: '',
  });
  const [submittingSwimmerPay, setSubmittingSwimmerPay] = useState(false);

  // 2. Swimmer Adjustment (Discount / Refund) Modal
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [adjInvoice, setAdjInvoice] = useState(null);
  const [adjForm, setAdjForm] = useState({
    type: 'DISCOUNT',
    amount: '',
    reason: '',
  });
  const [submittingAdj, setSubmittingAdj] = useState(false);

  // 3. Review Swimmer Receipt Modal
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptReviewForm, setReceiptReviewForm] = useState({
    action: 'APPROVE',
    approved_amount: '',
    notes: '',
    reason: '',
  });
  const [submittingReceiptReview, setSubmittingReceiptReview] = useState(false);

  // -------------------------------------------------------------
  // Modals state: Coaches
  // -------------------------------------------------------------
  // 1. Record Coach Payment Modal
  const [isCoachPayModalOpen, setIsCoachPayModalOpen] = useState(false);
  const [selectedCoachForPay, setSelectedCoachForPay] = useState(null);
  const [coachPayForm, setCoachPayForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'BANK_TRANSFER',
    reference_number: '',
    description: '',
  });
  const [coachReceiptFile, setCoachReceiptFile] = useState(null);
  const [coachReceiptPreview, setCoachReceiptPreview] = useState(null);
  const [submittingCoachPay, setSubmittingCoachPay] = useState(false);

  // 2. Generate / Calculate Course Coach Payroll Modal
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [selectedCoachForPayroll, setSelectedCoachForPayroll] = useState(null);
  const [payrollForm, setPayrollForm] = useState({
    period_start: '',
    period_end: '',
    period_label: '',
    notes: '',
  });
  const [payrollPreviewData, setPayrollPreviewData] = useState(null);
  const [calculatingPayrollPreview, setCalculatingPayrollPreview] = useState(false);
  const [submittingPayroll, setSubmittingPayroll] = useState(false);

  // Copy card / shaba feedback
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    if (!text) return;
    const clean = String(text).replace(/\s+/g, '');
    navigator.clipboard.writeText(clean);
    setCopiedKey(key);
    toast.success('در حافظه موقت (Clipboard) کپی شد.');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Helper format price
  const formatPrice = (v) => Number(v || 0).toLocaleString('en-US');

  // Fetch course finances
  const fetchFinances = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await api.get(`/education/courses/${courseId}/finances/`);
      setFinanceData(res.data);
    } catch (err) {
      console.error('Error fetching course finances:', err);
      toast.error('خطا در دریافت اطلاعات مالی دوره');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchFinances();
    }
  }, [courseId]);

  // Clean coach receipt preview URL on unmount or file change
  useEffect(() => {
    if (!coachReceiptFile) {
      setCoachReceiptPreview(null);
      return;
    }
    if (coachReceiptFile.type && coachReceiptFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(coachReceiptFile);
      setCoachReceiptPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCoachReceiptPreview(null);
    }
  }, [coachReceiptFile]);

  // Format Shamsi readable
  const formatShamsi = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const sh = toShamsiDate(dateStr);
      return sh.shortNumeric || dateStr;
    } catch {
      return dateStr;
    }
  };

  // -------------------------------------------------------------
  // Filtered Swimmer Invoices
  // -------------------------------------------------------------
  const filteredInvoices = useMemo(() => {
    if (!financeData?.swimmers_finance?.invoices) return [];
    return financeData.swimmers_finance.invoices.filter((inv) => {
      // Search term
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const mName = inv.swimmer_name?.toLowerCase().includes(q);
        const mPhone = inv.swimmer_phone?.includes(q);
        const mInv = inv.invoice_number?.toLowerCase().includes(q);
        const mCoach = inv.coach_name?.toLowerCase().includes(q);
        if (!mName && !mPhone && !mInv && !mCoach) return false;
      }

      // Filter Coach
      if (swimmerCoachFilter !== 'ALL') {
        if (swimmerCoachFilter === 'UNASSIGNED') {
          if (inv.coach_name && inv.coach_name !== '—') return false;
        } else {
          // Check coach name or coach id
          const targetCoach = financeData.coaches_finance?.coaches?.find(
            (c) => String(c.id) === String(swimmerCoachFilter)
          );
          if (targetCoach && inv.coach_name) {
            if (!inv.coach_name.includes(targetCoach.full_name)) return false;
          }
        }
      }

      // Filter Status
      if (swimmerStatusFilter !== 'ALL') {
        if (swimmerStatusFilter === 'OVERDUE') {
          // Has overdue installments
          const hasOverdue = (inv.installments || []).some((inst) => inst.status === 'OVERDUE');
          if (!hasOverdue) return false;
        } else if (inv.status !== swimmerStatusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [financeData, searchQuery, swimmerCoachFilter, swimmerStatusFilter]);

  // Filtered Installments
  const filteredInstallments = useMemo(() => {
    if (!financeData?.swimmers_finance?.installments) return [];
    return financeData.swimmers_finance.installments.filter((inst) => {
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const mName = inst.swimmer_name?.toLowerCase().includes(q);
        const mPhone = inst.swimmer_phone?.includes(q);
        const mInv = inst.invoice_number?.toLowerCase().includes(q);
        if (!mName && !mPhone && !mInv) return false;
      }
      if (swimmerStatusFilter !== 'ALL') {
        if (swimmerStatusFilter === 'OVERDUE') {
          if (inst.status !== 'OVERDUE') return false;
        } else if (inst.status !== swimmerStatusFilter) {
          return false;
        }
      }
      return true;
    });
  }, [financeData, searchQuery, swimmerStatusFilter]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    if (!financeData?.swimmers_finance?.payments) return [];
    return financeData.swimmers_finance.payments.filter((pmt) => {
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const mName = pmt.swimmer_name?.toLowerCase().includes(q);
        const mPhone = pmt.swimmer_phone?.includes(q);
        const mNum = pmt.payment_number?.toLowerCase().includes(q);
        const mRef = pmt.transaction_ref?.toLowerCase().includes(q);
        if (!mName && !mPhone && !mNum && !mRef) return false;
      }
      return true;
    });
  }, [financeData, searchQuery]);

  // Filtered Receipts
  const filteredReceipts = useMemo(() => {
    if (!financeData?.swimmers_finance?.receipts) return [];
    return financeData.swimmers_finance.receipts.filter((rcpt) => {
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const mName = rcpt.swimmer_name?.toLowerCase().includes(q);
        const mTrack = rcpt.tracking_number?.toLowerCase().includes(q);
        if (!mName && !mTrack) return false;
      }
      return true;
    });
  }, [financeData, searchQuery]);

  // Filtered Coaches
  const filteredCoaches = useMemo(() => {
    if (!financeData?.coaches_finance?.coaches) return [];
    return financeData.coaches_finance.coaches.filter((c) => {
      if (coachSearchQuery.trim()) {
        const q = coachSearchQuery.trim().toLowerCase();
        const mName = c.full_name?.toLowerCase().includes(q);
        const mEmp = c.employment_type_display?.toLowerCase().includes(q);
        const mPers = c.personnel_id?.toLowerCase().includes(q);
        if (!mName && !mEmp && !mPers) return false;
      }
      return true;
    });
  }, [financeData, coachSearchQuery]);

  // -------------------------------------------------------------
  // Handlers: Swimmer Payments & Invoices
  // -------------------------------------------------------------
  const handleOpenSwimmerPayModal = (invoice, installment = null) => {
    setSelectedInvoice(invoice);
    setSelectedInstallment(installment);
    const defaultAmt = installment
      ? String(Math.round(Number(installment.remaining_amount || 0)))
      : String(Math.round(Number(invoice.remaining_balance || 0)));

    setSwimmerPayForm({
      amount: defaultAmt,
      method: 'POS',
      transaction_ref: '',
      notes: installment ? `تسویه قسط ${installment.installment_number}` : `تسویه شهریه دوره ${course?.name || ''}`,
    });
    setIsSwimmerPayModalOpen(true);
  };

  const handleSubmitSwimmerPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    if (!swimmerPayForm.amount || Number(swimmerPayForm.amount) <= 0) {
      toast.error('لطفاً مبلغ واریزی معتبر وارد نمایید.');
      return;
    }

    try {
      setSubmittingSwimmerPay(true);
      await api.post('/finance/payments/record/', {
        swimmer_id: selectedInvoice.swimmer,
        invoice_id: selectedInvoice.id,
        installment_id: selectedInstallment ? selectedInstallment.id : null,
        amount: swimmerPayForm.amount,
        method: swimmerPayForm.method,
        transaction_ref: swimmerPayForm.transaction_ref,
        notes: swimmerPayForm.notes,
      });

      toast.success('پرداخت شهریه شناگر با موفقیت ثبت شد و مانده حساب به‌روزرسانی گردید.');
      setIsSwimmerPayModalOpen(false);
      setSelectedInvoice(null);
      setSelectedInstallment(null);
      await fetchFinances(true);
      if (onRefreshCourse) onRefreshCourse();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت پرداخت شهریه');
    } finally {
      setSubmittingSwimmerPay(false);
    }
  };

  // Financial Adjustment (Discount / Refund)
  const handleOpenAdjModal = (invoice) => {
    setAdjInvoice(invoice);
    setAdjForm({
      type: 'DISCOUNT',
      amount: '',
      reason: '',
    });
    setIsAdjModalOpen(true);
  };

  const handleSubmitAdjustment = async (e) => {
    e.preventDefault();
    if (!adjInvoice) return;
    if (!adjForm.amount || Number(adjForm.amount) <= 0 || !adjForm.reason.trim()) {
      toast.error('ورود مبلغ و علت تعدیل الزامی است.');
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

      toast.success(
        adjForm.type === 'DISCOUNT'
          ? 'تخفیف با موفقیت روی شهریه شناگر اعمال گردید.'
          : 'سند استرداد وجه با موفقیت ثبت شد.'
      );
      setIsAdjModalOpen(false);
      setAdjInvoice(null);
      await fetchFinances(true);
      if (onRefreshCourse) onRefreshCourse();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت تعدیل مالی');
    } finally {
      setSubmittingAdj(false);
    }
  };

  // Review Receipt
  const handleOpenReceiptModal = (receipt) => {
    setSelectedReceipt(receipt);
    setReceiptReviewForm({
      action: 'APPROVE',
      approved_amount: String(Math.round(Number(receipt.amount_claimed || 0))),
      notes: '',
      reason: '',
    });
    setIsReceiptModalOpen(true);
  };

  const handleSubmitReceiptReview = async (e) => {
    e.preventDefault();
    if (!selectedReceipt) return;

    try {
      setSubmittingReceiptReview(true);
      await api.post(`/finance/receipts/${selectedReceipt.id}/review/`, receiptReviewForm);

      toast.success(
        receiptReviewForm.action === 'APPROVE'
          ? 'فیش واریزی با موفقیت تأیید شد و پرداخت شهریه اعمال گردید.'
          : 'فیش واریزی رد گردید.'
      );
      setIsReceiptModalOpen(false);
      setSelectedReceipt(null);
      await fetchFinances(true);
      if (onRefreshCourse) onRefreshCourse();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در بررسی فیش واریزی');
    } finally {
      setSubmittingReceiptReview(false);
    }
  };

  // -------------------------------------------------------------
  // Handlers: Coach Payments & Payrolls
  // -------------------------------------------------------------
  const handleOpenCoachPayModal = (coach) => {
    setSelectedCoachForPay(coach);
    const rem = Number(coach.remaining_balance || 0);
    setCoachPayForm({
      amount: rem > 0 ? String(Math.round(rem)) : String(Math.round(Number(coach.calculated_compensation || 0))),
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'BANK_TRANSFER',
      reference_number: '',
      description: `واریز حقوق مربی ${coach.full_name} بابت دوره ${course?.name || ''}`,
    });
    setCoachReceiptFile(null);
    setIsCoachPayModalOpen(true);
  };

  const handleSubmitCoachPayment = async (e) => {
    e.preventDefault();
    if (!selectedCoachForPay) return;
    if (!coachPayForm.amount || Number(coachPayForm.amount) <= 0) {
      toast.error('لطفاً مبلغ واریزی معتبر وارد نمایید.');
      return;
    }

    try {
      setSubmittingCoachPay(true);
      const fd = new FormData();
      fd.append('coach_id', selectedCoachForPay.id);
      fd.append('amount', coachPayForm.amount);
      fd.append('payment_date', coachPayForm.payment_date);
      fd.append('payment_method', coachPayForm.payment_method);
      if (coachPayForm.reference_number) fd.append('reference_number', coachPayForm.reference_number);
      if (coachPayForm.description) fd.append('description', coachPayForm.description);
      if (coachReceiptFile) fd.append('receipt_document', coachReceiptFile);

      await api.post(`/education/courses/${courseId}/coach-payment/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(`واریز مبلغ ${formatPrice(coachPayForm.amount)} تومان به حساب مربی ${selectedCoachForPay.full_name} با موفقیت ثبت شد.`);
      setIsCoachPayModalOpen(false);
      setSelectedCoachForPay(null);
      setCoachReceiptFile(null);
      await fetchFinances(true);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت واریز حقوق مربی');
    } finally {
      setSubmittingCoachPay(false);
    }
  };

  // Open Payroll Modal for Coach
  const handleOpenPayrollModal = (coach) => {
    setSelectedCoachForPayroll(coach);
    setPayrollForm({
      period_start: course?.start_date || new Date().toISOString().split('T')[0],
      period_end: course?.end_date || new Date().toISOString().split('T')[0],
      period_label: `حقوق دوره ${course?.name || ''}`,
      notes: '',
    });
    setPayrollPreviewData(null);
    setIsPayrollModalOpen(true);
  };

  // Preview Payroll Calculation
  const handleCalculatePayrollPreview = async () => {
    if (!selectedCoachForPayroll) return;
    try {
      setCalculatingPayrollPreview(true);
      const res = await api.post(`/coaches/${selectedCoachForPayroll.id}/payrolls/`, {
        ...payrollForm,
        preview_only: true,
      });
      setPayrollPreviewData(res.data);
      toast.success('پیش‌محاسبه کارکرد و استحقاق مربی استخراج شد.');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در محاسبه کارکرد مربی');
    } finally {
      setCalculatingPayrollPreview(false);
    }
  };

  // Submit and Issue Payroll
  const handleSubmitIssuePayroll = async (e) => {
    e.preventDefault();
    if (!selectedCoachForPayroll) return;

    try {
      setSubmittingPayroll(true);
      const res = await api.post(`/coaches/${selectedCoachForPayroll.id}/payrolls/`, {
        ...payrollForm,
        preview_only: false,
      });
      // Auto-approve payroll so payment can be registered
      if (res.data?.id) {
        await api.post(`/coaches/payrolls/${res.data.id}/approve/`).catch(() => {});
      }

      toast.success(`فیش حقوقی رسمی مربی ${selectedCoachForPayroll.full_name} با موفقیت صادر و تأیید گردید.`);
      setIsPayrollModalOpen(false);
      setSelectedCoachForPayroll(null);
      await fetchFinances(true);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در صدور فیش حقوقی');
    } finally {
      setSubmittingPayroll(false);
    }
  };

  // Approve existing payroll directly
  const handleApproveExistingPayroll = async (payrollId, coachName) => {
    if (!window.confirm(`آیا از تأیید نهایی فیش حقوقی مربی «${coachName}» اطمینان دارید؟`)) return;
    try {
      await api.post(`/coaches/payrolls/${payrollId}/approve/`);
      toast.success('فیش حقوقی با موفقیت تأیید شد.');
      await fetchFinances(true);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در تأیید فیش حقوقی');
    }
  };

  // -------------------------------------------------------------
  // CSV Export Handlers
  // -------------------------------------------------------------
  const handleExportSwimmersCsv = () => {
    if (!filteredInvoices.length) {
      toast.warning('داده‌ای برای خروجی اکسل وجود ندارد.');
      return;
    }
    const headers = {
      swimmer_name: 'نام شناگر',
      swimmer_phone: 'شماره تماس',
      coach_name: 'کلاس و مربی',
      total_amount: 'شهریه مصوب (تومان)',
      total_paid: 'مبلغ پرداخت‌شده (تومان)',
      remaining_balance: 'مانده بدهی (تومان)',
      status_display: 'وضعیت پرداخت',
      invoice_number: 'شماره فاکتور',
      issue_date: 'تاریخ صدور',
    };
    exportToCsv(`امور_مالی_شناگران_${course?.name || courseId}`, filteredInvoices, headers);
    toast.success('فایل اکسل شناگران این دوره با موفقیت ذخیره شد.');
  };

  const handleExportCoachesCsv = () => {
    if (!filteredCoaches.length) {
      toast.warning('داده‌ای برای خروجی اکسل وجود ندارد.');
      return;
    }
    const headers = {
      full_name: 'نام مربی',
      personnel_id: 'کد پرسنلی',
      employment_type_display: 'مدل همکاری',
      swimmers_count: 'تعداد شاگردان در دوره',
      calculated_compensation: 'دستمزد استحقاقی دوره (تومان)',
      paid_amount: 'مبالغ واریزشده (تومان)',
      remaining_balance: 'مانده طلب (تومان)',
      settlement_status: 'وضعیت تسویه',
      card_number: 'شماره کارت',
      shaba_number: 'شماره شبا',
    };
    exportToCsv(`امور_مالی_مربیان_${course?.name || courseId}`, filteredCoaches, headers);
    toast.success('فایل اکسل کادر مربیان این دوره با موفقیت ذخیره شد.');
  };

  if (loading) {
    return (
      <div className="py-12">
        <LoadingState type="table" message="در حال استخراج و تحلیل داده‌های مالی دوره..." />
      </div>
    );
  }

  const swimmersSummary = financeData?.swimmers_finance?.summary || {};
  const coachesSummary = financeData?.coaches_finance?.summary || {};

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200" style={{ fontFeatureSettings: '"ss01" 0, "cv01" 1' }}>
      {/* 1. Header Toolbar & Sub-Tabs Navigation */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              امور مالی و حسابداری اختصاصی دوره
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            مدیریت کامل شهریه و مطالبات شناگران، واریزی‌های حقوق و تسویه‌حساب کادر مربیانِ مختص دوره «{course?.name}»
          </p>
        </div>

        {/* Sub-tab Switcher: Swimmers vs Coaches */}
        <div className="w-full sm:w-auto grid grid-cols-2 sm:flex items-center gap-1.5 sm:gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('swimmers')}
            className={`py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
              activeSubTab === 'swimmers'
                ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-xs border border-slate-200/50 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="truncate">شناگران و شهریه</span>
            <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-full font-mono bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 shrink-0">
              {swimmersSummary.total_swimmers || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('coaches')}
            className={`py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
              activeSubTab === 'coaches'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs border border-slate-200/50 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="truncate">حقوق و مربیان</span>
            <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-full font-mono bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 shrink-0">
              {coachesSummary.total_coaches || 0}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION A: SWIMMERS FINANCIALS (امور مالی شناگران)                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'swimmers' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Swimmers KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: کل شهریه مصوب دوره */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                  کل ارزش شهریه دوره
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {formatPrice(swimmersSummary.total_invoiced || swimmersSummary.total_expected_tuition)}
                  </span>
                  <span className="text-xs text-slate-400">تومان</span>
                </div>
                <span className="text-[11px] text-slate-400 block">
                  پایه {formatPrice(course?.base_price)} × {swimmersSummary.total_swimmers} نفر
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <Wallet className="w-6 h-6" />
              </div>
            </div>

            {/* KPI 2: مبالغ وصول‌شده / واریزی‌ها */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                  شهریه وصول‌شده (واریزی‌ها)
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatPrice(swimmersSummary.total_paid)}
                  </span>
                  <span className="text-xs text-slate-400">تومان</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {swimmersSummary.collection_rate}% وصول شده
                  </span>
                  <span>•</span>
                  <span className="text-slate-400">{swimmersSummary.paid_count} تسویه کامل</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            {/* KPI 3: مانده مطالبات و بدهی معوق */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                  مانده مطالبات شهریه
                </span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl sm:text-2xl font-black font-mono ${
                    Number(swimmersSummary.total_remaining) > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}>
                    {formatPrice(swimmersSummary.total_remaining)}
                  </span>
                  <span className="text-xs text-slate-400">تومان</span>
                </div>
                <span className="text-[11px] text-slate-400 block">
                  {swimmersSummary.partially_paid_count} نفر قسطی و بدهکار
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>

            {/* KPI 4: اقساط معوق و فیش‌های ارسالی */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                  نیازمند پیگیری مالی
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold text-xs">
                    {swimmersSummary.overdue_installments_count || 0} قسط معوق
                  </span>
                  {Number(swimmersSummary.pending_receipts_count) > 0 && (
                    <span className="px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-bold text-xs animate-pulse">
                      {swimmersSummary.pending_receipts_count} فیش جدید
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 block pt-0.5">
                  اقساط گذشته از موعد سررسید
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Progress Strip */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                میزان تحقق وصولی شهریه دوره: {swimmersSummary.collection_rate || 0}٪
              </span>
              <span className="text-slate-500">
                {formatPrice(swimmersSummary.total_paid)} از {formatPrice(swimmersSummary.total_invoiced || swimmersSummary.total_expected_tuition)} تومان
              </span>
            </div>
            <ProgressBar
              value={Number(swimmersSummary.total_paid || 0)}
              max={Number(swimmersSummary.total_invoiced || swimmersSummary.total_expected_tuition || 1)}
              color={swimmersSummary.collection_rate > 80 ? 'emerald' : swimmersSummary.collection_rate > 40 ? 'sky' : 'amber'}
              height="h-2.5"
            />
          </div>

          {/* Swimmer Controls: View Switcher, Search, Filters, Excel Export */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* View Filter Pills: Invoices | Installments | Payments | Receipts */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none -mx-1 px-1 sm:mx-0 sm:px-0">
              <button
                type="button"
                onClick={() => setSwimmerView('invoices')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  swimmerView === 'invoices'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                صورتحساب‌ها ({filteredInvoices.length})
              </button>

              <button
                type="button"
                onClick={() => setSwimmerView('installments')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  swimmerView === 'installments'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                اقساط و سررسیدها ({filteredInstallments.length})
              </button>

              <button
                type="button"
                onClick={() => setSwimmerView('payments')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  swimmerView === 'payments'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                تراکنش‌های واریزی ({filteredPayments.length})
              </button>

              <button
                type="button"
                onClick={() => setSwimmerView('receipts')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  swimmerView === 'receipts'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span>فیش‌های کارت‌به‌کارت ({filteredReceipts.length})</span>
                {Number(swimmersSummary.pending_receipts_count) > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </button>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap w-full lg:w-auto">
              {/* Search */}
              <div className="relative min-w-0 sm:min-w-[180px] flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو نام، تماس، کدملی..."
                  className="w-full pr-9 pl-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
                {/* Coach / Class Filter */}
                <div className="w-full sm:w-[150px]">
                  <CustomSelect
                    value={swimmerCoachFilter}
                    onChange={setSwimmerCoachFilter}
                    size="sm"
                    color="sky"
                    options={[
                      { value: 'ALL', label: 'همه کلاس‌ها و مربیان' },
                      { value: 'UNASSIGNED', label: 'بدون مربی' },
                      ...(financeData?.coaches_finance?.coaches || []).map((c) => ({
                        value: String(c.id),
                        label: `کلاس مربی ${c.full_name}`,
                      })),
                    ]}
                    placeholder="کلاس و مربی..."
                    className="w-full"
                  />
                </div>

                {/* Status Filter */}
                <div className="w-full sm:w-[130px]">
                  <CustomSelect
                    value={swimmerStatusFilter}
                    onChange={setSwimmerStatusFilter}
                    size="sm"
                    color="sky"
                    options={[
                      { value: 'ALL', label: 'همه وضعیت‌ها' },
                      { value: 'PAID', label: 'فقط تسویه‌شده' },
                      { value: 'PARTIALLY_PAID', label: 'بخشی پرداخت‌شده' },
                      { value: 'ISSUED', label: 'پرداخت نشده' },
                      { value: 'OVERDUE', label: 'دارای اقساط معوق' },
                    ]}
                    placeholder="وضعیت..."
                    className="w-full"
                  />
                </div>
              </div>

              {/* Excel Export Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportSwimmersCsv}
                className="gap-1 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer w-full sm:w-auto justify-center"
                title="خروجی فایل اکسل مالی شناگران دوره"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>خروجی اکسل</span>
              </Button>
            </div>
          </div>

          {/* VIEW 1: INVOICES (DESKTOP TABLE + MOBILE STANDALONE CARDS) */}
          {swimmerView === 'invoices' && (
            <div>
              {filteredInvoices.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-8 text-center">
                  <EmptyState
                    title="صورتحسابی با این فیلترها یافت نشد"
                    description="عبارت جستجو یا فیلترهای وضعیت و مربی را تغییر دهید."
                  />
                </div>
              ) : (
                <>
                  {/* Desktop & Tablet Table (>= md) */}
                  <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="px-4 py-3.5">شناگر</th>
                            <th className="px-4 py-3.5">کلاس و مربی</th>
                            <th className="px-4 py-3.5">شهریه مصوب</th>
                            <th className="px-4 py-3.5">پرداخت‌شده</th>
                            <th className="px-4 py-3.5">مانده بدهی</th>
                            <th className="px-4 py-3.5">اقساط</th>
                            <th className="px-4 py-3.5">وضعیت</th>
                            <th className="px-4 py-3.5 text-center">عملیات مالی</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                          {filteredInvoices.map((inv) => {
                            const totalPaid = Number(inv.total_paid || 0);
                            const remBal = Number(inv.remaining_balance || 0);
                            const isSettled = inv.status === 'PAID' || remBal <= 0;

                            return (
                              <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                {/* Swimmer Info */}
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                      {inv.swimmer_name?.charAt(0) || 'ش'}
                                    </div>
                                    <div className="min-w-0">
                                      <span className="font-bold text-slate-900 dark:text-white block truncate">
                                        {inv.swimmer_name}
                                      </span>
                                      <span className="text-[11px] text-slate-400 font-mono block">
                                        {inv.swimmer_phone || inv.swimmer_national_id || '—'}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* Class & Coach */}
                                <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                                  <span className="font-semibold block truncate">
                                    {inv.coach_name || 'بدون مربی'}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    فاکتور {inv.invoice_number}
                                  </span>
                                </td>

                                {/* Total Amount */}
                                <td className="px-4 py-3.5 font-mono text-slate-800 dark:text-slate-200">
                                  <span className="font-bold">{formatPrice(inv.total_amount)}</span>
                                  <span className="text-[10px] text-slate-400 mr-1">تومان</span>
                                </td>

                                {/* Paid Amount */}
                                <td className="px-4 py-3.5 font-mono">
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatPrice(totalPaid)}
                                  </span>
                                  <span className="text-[10px] text-slate-400 mr-1">تومان</span>
                                </td>

                                {/* Remaining Balance */}
                                <td className="px-4 py-3.5 font-mono">
                                  <span className={`font-bold ${remBal > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                                    {remBal > 0 ? formatPrice(remBal) : '۰'}
                                  </span>
                                  <span className="text-[10px] text-slate-400 mr-1">تومان</span>
                                </td>

                                {/* Installments status */}
                                <td className="px-4 py-3.5">
                                  {inv.installments && inv.installments.length > 0 ? (
                                    <div className="space-y-1">
                                      <span className="text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                                        {inv.installments.filter((i) => i.status === 'PAID').length} از {inv.installments.length} قسط
                                      </span>
                                      {inv.installments.some((i) => i.status === 'OVERDUE') && (
                                        <span className="block text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                          قسط معوق دارد
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 text-[11px]">پرداخت یکجا</span>
                                  )}
                                </td>

                                {/* Invoice Status */}
                                <td className="px-4 py-3.5">
                                  <Badge
                                    variant={
                                      inv.status === 'PAID'
                                        ? 'success'
                                        : inv.status === 'PARTIALLY_PAID'
                                        ? 'warning'
                                        : inv.status === 'CANCELLED'
                                        ? 'neutral'
                                        : 'danger'
                                    }
                                  >
                                    {inv.status_display || inv.status}
                                  </Badge>
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3.5 text-center">
                                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                    {!isSettled && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenSwimmerPayModal(inv)}
                                        className="p-1 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer border border-emerald-200 dark:border-emerald-800"
                                        title="ثبت پرداخت وجه برای این فاکتور"
                                      >
                                        <Plus className="w-3 h-3" />
                                        <span>ثبت واریزی</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleOpenAdjModal(inv)}
                                      className="p-1 px-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                                      title="تخفیف یا استرداد وجه"
                                    >
                                      <span>تعدیل/تخفیف</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => navigate(`/admin/swimmers/${inv.swimmer}`)}
                                      className="p-1 px-2 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                      title="مشاهده پرونده جامع شناگر"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Standalone Cards View (< md) - Distinct cards separated vertically */}
                  <div className="block md:hidden space-y-4">
                    {filteredInvoices.map((inv) => {
                      const totalPaid = Number(inv.total_paid || 0);
                      const remBal = Number(inv.remaining_balance || 0);
                      const isSettled = inv.status === 'PAID' || remBal <= 0;

                      return (
                        <div
                          key={inv.id}
                          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4.5 sm:p-5 shadow-xs hover:shadow-md transition-all space-y-3.5"
                        >
                          {/* Header: Avatar, Name, Phone, Status Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                                {inv.swimmer_name?.charAt(0) || 'ش'}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 dark:text-white text-sm block truncate">
                                  {inv.swimmer_name}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono block">
                                  {inv.swimmer_phone || inv.swimmer_national_id || '—'}
                                </span>
                              </div>
                            </div>
                            <Badge
                              variant={
                                inv.status === 'PAID'
                                  ? 'success'
                                  : inv.status === 'PARTIALLY_PAID'
                                  ? 'warning'
                                  : inv.status === 'CANCELLED'
                                  ? 'neutral'
                                  : 'danger'
                              }
                            >
                              {inv.status_display || inv.status}
                            </Badge>
                          </div>

                          {/* Coach & Invoice Meta */}
                          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-1.5 truncate">
                              <GraduationCap className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                              <span className="truncate">{inv.coach_name || 'بدون مربی'}</span>
                            </div>
                            <span className="font-mono text-[10px] text-slate-400 shrink-0">
                              فاکتور {inv.invoice_number}
                            </span>
                          </div>

                          {/* Financial Breakdown Grid (3 cols) */}
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-0.5">
                              <span className="text-[10px] text-slate-400 block">شهریه مصوب</span>
                              <span className="text-xs font-black font-mono text-slate-800 dark:text-slate-200 block truncate">
                                {formatPrice(inv.total_amount)}
                              </span>
                            </div>
                            <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 space-y-0.5">
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">پرداخت شده</span>
                              <span className="text-xs font-black font-mono text-emerald-700 dark:text-emerald-300 block truncate">
                                {formatPrice(totalPaid)}
                              </span>
                            </div>
                            <div className="p-2 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 space-y-0.5">
                              <span className="text-[10px] text-rose-600 dark:text-rose-400 block">مانده بدهی</span>
                              <span className={`text-xs font-black font-mono block truncate ${remBal > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-slate-400'}`}>
                                {remBal > 0 ? formatPrice(remBal) : '۰'}
                              </span>
                            </div>
                          </div>

                          {/* Installments info if any */}
                          {inv.installments && inv.installments.length > 0 && (
                            <div className="flex items-center justify-between text-xs px-1">
                              <span className="text-slate-500 text-[11px]">
                                وضعیت اقساط: <strong className="font-mono text-slate-700 dark:text-slate-300">{inv.installments.filter((i) => i.status === 'PAID').length} از {inv.installments.length}</strong> قسط
                              </span>
                              {inv.installments.some((i) => i.status === 'OVERDUE') && (
                                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">
                                  قسط معوق دارد
                                </span>
                              )}
                            </div>
                          )}

                          {/* Actions bar (touch friendly) */}
                          <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-1.5 flex-1">
                              {!isSettled && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenSwimmerPayModal(inv)}
                                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>ثبت واریزی</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenAdjModal(inv)}
                                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                              >
                                <span>تعدیل/تخفیف</span>
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/swimmers/${inv.swimmer}`)}
                              className="p-2 rounded-xl text-slate-400 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="مشاهده پرونده جامع شناگر"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* VIEW 2: INSTALLMENTS (DESKTOP TABLE + MOBILE STANDALONE CARDS) */}
          {swimmerView === 'installments' && (
            <div>
              {filteredInstallments.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-8 text-center">
                  <EmptyState
                    title="قسطی برای نمایش وجود ندارد"
                    description="تمامی ثبت‌نام‌های این دوره ممکن است به صورت یکجا پرداخت شده باشند یا با فیلتر فعلی همخوانی نداشته باشند."
                  />
                </div>
              ) : (
                <>
                  {/* Desktop & Tablet Table (>= md) */}
                  <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="px-4 py-3.5">شناگر</th>
                            <th className="px-4 py-3.5">شماره قسط</th>
                            <th className="px-4 py-3.5">سررسید قسط</th>
                            <th className="px-4 py-3.5">مبلغ قسط</th>
                            <th className="px-4 py-3.5">واریز شده</th>
                            <th className="px-4 py-3.5">مانده قسط</th>
                            <th className="px-4 py-3.5">وضعیت</th>
                            <th className="px-4 py-3.5 text-center">عملیات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                          {filteredInstallments.map((inst) => (
                            <tr key={inst.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                                {inst.swimmer_name}
                              </td>
                              <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-300">
                                قسط {inst.installment_number}
                              </td>
                              <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-300">
                                {formatShamsi(inst.due_date)}
                              </td>
                              <td className="px-4 py-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                                {formatPrice(inst.amount)} تومان
                              </td>
                              <td className="px-4 py-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {formatPrice(inst.paid_amount)} تومان
                              </td>
                              <td className="px-4 py-3.5 font-mono font-bold text-rose-600 dark:text-rose-400">
                                {Number(inst.remaining_amount) > 0 ? `${formatPrice(inst.remaining_amount)} تومان` : '۰'}
                              </td>
                              <td className="px-4 py-3.5">
                                <Badge
                                  variant={
                                    inst.status === 'PAID'
                                      ? 'success'
                                      : inst.status === 'PARTIAL'
                                      ? 'warning'
                                      : inst.status === 'OVERDUE'
                                      ? 'danger'
                                      : 'neutral'
                                  }
                                >
                                  {inst.status_display || inst.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                {inst.status !== 'PAID' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const matchingInv = filteredInvoices.find((i) => i.id === inst.invoice);
                                      handleOpenSwimmerPayModal(matchingInv || { id: inst.invoice, swimmer: inst.swimmer_id }, inst);
                                    }}
                                    className="p-1 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800 text-[11px]"
                                  >
                                    تسویه قسط
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Standalone Cards View (< md) - Distinct cards separated vertically */}
                  <div className="block md:hidden space-y-4">
                    {filteredInstallments.map((inst) => (
                      <div
                        key={inst.id}
                        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4.5 sm:p-5 shadow-xs hover:shadow-md transition-all space-y-3.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white text-sm block">
                              {inst.swimmer_name}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 block">
                              قسط شماره {inst.installment_number}
                            </span>
                          </div>
                          <Badge
                            variant={
                              inst.status === 'PAID'
                                ? 'success'
                                : inst.status === 'PARTIAL'
                                ? 'warning'
                                : inst.status === 'OVERDUE'
                                ? 'danger'
                                : 'neutral'
                            }
                          >
                            {inst.status_display || inst.status}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-sky-500" />
                            <span>سررسید قسط:</span>
                          </span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {formatShamsi(inst.due_date)}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-0.5">
                            <span className="text-[10px] text-slate-400 block">مبلغ قسط</span>
                            <span className="text-xs font-black font-mono text-slate-800 dark:text-slate-200 block truncate">
                              {formatPrice(inst.amount)}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 space-y-0.5">
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">واریزشده</span>
                            <span className="text-xs font-black font-mono text-emerald-700 dark:text-emerald-300 block truncate">
                              {formatPrice(inst.paid_amount)}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 space-y-0.5">
                            <span className="text-[10px] text-rose-600 dark:text-rose-400 block">مانده قسط</span>
                            <span className="text-xs font-black font-mono text-rose-700 dark:text-rose-300 block truncate">
                              {Number(inst.remaining_amount) > 0 ? formatPrice(inst.remaining_amount) : '۰'}
                            </span>
                          </div>
                        </div>

                        {inst.status !== 'PAID' && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={() => {
                                const matchingInv = filteredInvoices.find((i) => i.id === inst.invoice);
                                handleOpenSwimmerPayModal(matchingInv || { id: inst.invoice, swimmer: inst.swimmer_id }, inst);
                              }}
                              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>تسویه این قسط ({formatPrice(inst.remaining_amount)} تومان)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* VIEW 3: PAYMENTS TRANSACTIONS (DESKTOP TABLE + MOBILE STANDALONE CARDS) */}
          {swimmerView === 'payments' && (
            <div>
              {filteredPayments.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-8 text-center">
                  <EmptyState
                    title="تراکنش پرداختی ثبت نشده است"
                    description="هنوز پرداختی برای شناگران این دوره ثبت نگردیده است."
                  />
                </div>
              ) : (
                <>
                  {/* Desktop & Tablet Table (>= md) */}
                  <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="px-4 py-3.5">شناگر</th>
                            <th className="px-4 py-3.5">مبلغ واریزی</th>
                            <th className="px-4 py-3.5">روش پرداخت</th>
                            <th className="px-4 py-3.5">شماره پیگیری</th>
                            <th className="px-4 py-3.5">زمان پرداخت</th>
                            <th className="px-4 py-3.5">شماره پرداخت</th>
                            <th className="px-4 py-3.5">توضیحات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                          {filteredPayments.map((pmt) => (
                            <tr key={pmt.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                                {pmt.swimmer_name}
                              </td>
                              <td className="px-4 py-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {formatPrice(pmt.amount)} تومان
                              </td>
                              <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px]">
                                  {pmt.method_display || pmt.method}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-300">
                                {pmt.transaction_ref || '—'}
                              </td>
                              <td className="px-4 py-3.5 font-mono text-slate-500 text-[11px]">
                                {pmt.paid_at ? formatShamsi(pmt.paid_at) : '—'}
                              </td>
                              <td className="px-4 py-3.5 font-mono text-slate-500 text-[11px]">
                                {pmt.payment_number}
                              </td>
                              <td className="px-4 py-3.5 text-slate-500 max-w-xs truncate">
                                {pmt.notes || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Standalone Cards View (< md) - Distinct cards separated vertically */}
                  <div className="block md:hidden space-y-4">
                    {filteredPayments.map((pmt) => (
                      <div
                        key={pmt.id}
                        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4.5 sm:p-5 shadow-xs hover:shadow-md transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white text-sm block">
                              {pmt.swimmer_name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                              سند {pmt.payment_number}
                            </span>
                          </div>
                          <div className="text-left font-mono">
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block">
                              {formatPrice(pmt.amount)}
                            </span>
                            <span className="text-[10px] text-slate-400">تومان</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="text-[10px] text-slate-400 block">روش پرداخت:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {pmt.method_display || pmt.method}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">کد پیگیری:</span>
                            <span className="font-mono text-slate-700 dark:text-slate-300">
                              {pmt.transaction_ref || '—'}
                            </span>
                          </div>
                          <div className="col-span-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">زمان پرداخت:</span>
                            <span className="font-mono text-slate-500 text-[11px]">
                              {pmt.paid_at ? formatShamsi(pmt.paid_at) : '—'}
                            </span>
                          </div>
                        </div>

                        {pmt.notes && (
                          <p className="text-[11px] text-slate-500 bg-slate-100/60 dark:bg-slate-800/80 p-2 rounded-xl">
                            {pmt.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* VIEW 4: PAYMENT RECEIPTS (فیش‌های کارت‌به‌کارت) */}
          {swimmerView === 'receipts' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden p-5">
              {filteredReceipts.length === 0 ? (
                <div className="p-8 text-center">
                  <EmptyState
                    title="فیش واریزی ارسال نشده است"
                    description="شناگران می‌توانند از پرتال خود تصویر فیش انتقال کارت به کارت را ارسال نمایند."
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredReceipts.map((rcpt) => (
                    <div
                      key={rcpt.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {rcpt.swimmer_name}
                        </span>
                        <Badge
                          variant={
                            rcpt.status === 'APPROVED'
                              ? 'success'
                              : rcpt.status === 'REJECTED'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {rcpt.status === 'APPROVED'
                            ? 'تأییدشده'
                            : rcpt.status === 'REJECTED'
                            ? 'رد شده'
                            : 'در انتظار بررسی'}
                        </Badge>
                      </div>

                      {/* Receipt Image */}
                      {rcpt.receipt_image && (
                        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black/5 aspect-video flex items-center justify-center relative group">
                          <img
                            src={rcpt.receipt_image}
                            alt="فیش واریزی"
                            className="w-full h-full object-cover"
                          />
                          <a
                            href={rcpt.receipt_image}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute inset-0 bg-black/40 text-white flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                          >
                            <Eye className="w-4 h-4" />
                            <span>مشاهده تصویر اصلی</span>
                          </a>
                        </div>
                      )}

                      <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400">مبلغ واریزی:</span>
                          <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            {formatPrice(rcpt.amount_claimed || rcpt.approved_amount)} تومان
                          </span>
                        </div>
                        {rcpt.tracking_number && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">کد رهگیری:</span>
                            <span className="font-mono">{rcpt.tracking_number}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">زمان ثبت:</span>
                          <span className="font-mono">{formatShamsi(rcpt.created_at)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      {rcpt.status === 'PENDING' && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleOpenReceiptModal(rcpt)}
                            className="bg-sky-600 hover:bg-sky-700 text-white text-xs w-full justify-center"
                          >
                            <span>بررسی و تأیید فیش</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION B: COACHES FINANCIALS & PAYROLLS (امور مالی و حقوق مربیان)         */}
      {/* ========================================================================= */}
      {activeSubTab === 'coaches' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Coaches KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: کادر مربیان دوره */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                  کادر مربیان دوره
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {coachesSummary.total_coaches || 0}
                  </span>
                  <span className="text-xs text-slate-400">مربی فعال</span>
                </div>
                <span className="text-[11px] text-slate-400 block">
                  هدایت {coachesSummary.total_coaches || 0} کلاس اختصاصی
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
            </div>

            {/* KPI 2: کل تعهد دستمزد کادر دوره */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                  کل برآورد دستمزد کادر
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    {formatPrice(coachesSummary.total_estimated_compensation)}
                  </span>
                  <span className="text-xs text-slate-400">تومان</span>
                </div>
                <span className="text-[11px] text-slate-400 block">
                  حق‌الزحمه تدریس در این دوره
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>

            {/* KPI 3: مبالغ واریز شده به مربیان */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                  واریز شده به مربیان
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatPrice(coachesSummary.total_paid_to_coaches)}
                  </span>
                  <span className="text-xs text-slate-400">تومان</span>
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block">
                  {coachesSummary.settlement_rate || 0}% تسویه شده
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            {/* KPI 4: مانده طلب مربیان دوره */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                  مانده مطالبات کادر دوره
                </span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl sm:text-2xl font-black font-mono ${
                    Number(coachesSummary.total_remaining_payable) > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}>
                    {formatPrice(coachesSummary.total_remaining_payable)}
                  </span>
                  <span className="text-xs text-slate-400">تومان</span>
                </div>
                <span className="text-[11px] text-slate-400 block">
                  قابل تسویه پس از برگزاری جلسات
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Controls Bar for Coaches */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={coachSearchQuery}
                onChange={(e) => setCoachSearchQuery(e.target.value)}
                placeholder="جستجو در نام مربی یا کد پرسنلی..."
                className="w-full pr-9 pl-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {coachSearchQuery && (
                <button
                  type="button"
                  onClick={() => setCoachSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCoachesCsv}
              className="gap-1 text-xs text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer w-full sm:w-auto justify-center"
              title="خروجی فایل اکسل امور مالی مربیان دوره"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>خروجی اکسل مربیان</span>
            </Button>
          </div>

          {/* Coach Cards Grid (Rich Course-specific Coach Financial Details) */}
          {filteredCoaches.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
              <EmptyState
                title="مربی‌ای در این دوره یافت نشد"
                description="می‌توانید از تب «کلاس‌ها و مربیان» مربیان جدیدی به این دوره تخصیص دهید."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredCoaches.map((c) => {
                const comp = Number(c.calculated_compensation || 0);
                const paid = Number(c.paid_amount || 0);
                const rem = Number(c.remaining_balance || 0);
                const isPaid = c.settlement_status === 'PAID';

                return (
                  <div
                    key={c.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-4">
                      {/* Coach Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            {c.avatar ? (
                              <img
                                src={c.avatar}
                                alt={c.full_name}
                                className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-400 shadow-xs"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white flex items-center justify-center font-bold text-base shadow-xs">
                                {c.full_name?.charAt(0) || 'م'}
                              </div>
                            )}
                            <span className="absolute -bottom-0.5 -left-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                          </div>

                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                              مربی {c.full_name}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                              <span>کد پرسنلی: {c.personnel_id}</span>
                              <span>•</span>
                              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                {c.class_name}
                              </span>
                            </div>
                          </div>
                        </div>

                        <Badge
                          variant={
                            isPaid
                              ? 'success'
                              : paid > 0
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {isPaid ? 'تسویه کامل' : paid > 0 ? 'بخشی واریزشده' : 'پرداخت‌نشده'}
                        </Badge>
                      </div>

                      {/* Class & Teaching Scope in this Course */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                          <span className="text-slate-500">مدل همکاری و قرارداد:</span>
                          <span className="font-bold text-indigo-700 dark:text-indigo-300">
                            {c.employment_type_display}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">شاگردان کلاس در این دوره:</span>
                          <span className="font-bold font-mono text-slate-900 dark:text-white">
                            {c.swimmers_count} نفر
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">تعداد جلسات دوره:</span>
                          <span className="font-bold font-mono text-slate-900 dark:text-white">
                            {course?.sessions_count || 12} جلسه
                          </span>
                        </div>

                        <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-100/70 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                          <span className="font-bold text-slate-700 dark:text-slate-300">مبنای محاسبه دستمزد دوره: </span>
                          <span>{c.compensation_formula}</span>
                        </div>
                      </div>

                      {/* Financial Accounting Strip */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-0.5">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">استحقاقی دوره</span>
                          <span className="text-xs sm:text-sm font-black font-mono text-indigo-700 dark:text-indigo-300 block">
                            {formatPrice(comp)}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 space-y-0.5">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">واریز شده</span>
                          <span className="text-xs sm:text-sm font-black font-mono text-emerald-700 dark:text-emerald-300 block">
                            {formatPrice(paid)}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 space-y-0.5">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">مانده طلب</span>
                          <span className={`text-xs sm:text-sm font-black font-mono block ${rem > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-slate-400'}`}>
                            {formatPrice(rem)}
                          </span>
                        </div>
                      </div>

                      {/* Banking Details (Card & Shaba with 1-click Copy) */}
                      {(c.card_number || c.shaba_number) ? (
                        <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                          {c.card_number && (
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                                <CreditCard className="w-3.5 h-3.5 text-sky-500" />
                                <span>شماره کارت مربی:</span>
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-800 dark:text-slate-100" dir="ltr">
                                  {formatCardNumberWithDashes(c.card_number)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(c.card_number, `card-${c.id}`)}
                                  className="p-1 rounded-md text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/50 cursor-pointer"
                                  title="کپی شماره کارت"
                                >
                                  {copiedKey === `card-${c.id}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                                {getBankNameFromCard(c.card_number) && (
                                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded-md">
                                    {getBankNameFromCard(c.card_number)}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {c.shaba_number && (
                            <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-700/60">
                              <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                                <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                                <span>شماره شبا (IBAN):</span>
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-[11px]" dir="ltr">
                                  {c.shaba_number}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(c.shaba_number, `shaba-${c.id}`)}
                                  className="p-1 rounded-md text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer"
                                  title="کپی شماره شبا"
                                >
                                  {copiedKey === `shaba-${c.id}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                          <span>شماره کارت یا شبا در پرونده این مربی هنوز ثبت نشده است.</span>
                        </div>
                      )}

                      {/* Latest Payroll Banner if available */}
                      {c.latest_payroll && (
                        <div className="p-3 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between gap-2 text-xs flex-wrap">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">
                              فیش حقوقی: {c.latest_payroll.period_label}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              خالص: {formatPrice(c.latest_payroll.net_payable_amount)} تومان • وضعیت: {c.latest_payroll.approval_status_display}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {c.latest_payroll.approval_status !== 'APPROVED' && (
                              <button
                                type="button"
                                onClick={() => handleApproveExistingPayroll(c.latest_payroll.id, c.full_name)}
                                className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
                              >
                                تأیید فیش
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleOpenCoachPayModal(c)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs shadow-xs cursor-pointer w-full sm:w-auto justify-center"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>واریز حقوق مربی</span>
                      </Button>

                      <div className="flex items-center justify-between sm:justify-end gap-1.5 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenPayrollModal(c)}
                          className="gap-1 text-xs cursor-pointer text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 flex-1 sm:flex-initial justify-center"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>فیش حقوق دوره</span>
                        </Button>

                        <button
                          type="button"
                          onClick={() => navigate(`/admin/coaches/${c.id}?tab=FINANCE`)}
                          className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="مشاهده پرونده مالی جامع مربی در کادر مربیان"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Coach Salary Payment History (Desktop Table + Mobile Standalone Cards) */}
          {financeData?.coaches_finance?.payments && financeData.coaches_finance.payments.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-200/80 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>سوابق و اسناد واریزی حقوق به مربیان این دوره</span>
              </h3>

              <div>
                {/* Desktop & Tablet Table (>= md) */}
                <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-4 py-3.5">شماره سند</th>
                          <th className="px-4 py-3.5">مربی</th>
                          <th className="px-4 py-3.5">مبلغ واریزی</th>
                          <th className="px-4 py-3.5">تاریخ واریز</th>
                          <th className="px-4 py-3.5">روش پرداخت</th>
                          <th className="px-4 py-3.5">شماره پیگیری</th>
                          <th className="px-4 py-3.5">توضیحات</th>
                          <th className="px-4 py-3.5 text-center">فیش بانکی</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                        {financeData.coaches_finance.payments.map((pmt) => (
                          <tr key={pmt.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-300">
                              {pmt.payment_number}
                            </td>
                            <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                              {pmt.coach_name}
                            </td>
                            <td className="px-4 py-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {formatPrice(pmt.amount)} تومان
                            </td>
                            <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-300">
                              {pmt.payment_date ? formatShamsi(pmt.payment_date) : '—'}
                            </td>
                            <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px]">
                                {pmt.payment_method_display || pmt.payment_method}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 font-mono text-slate-500">
                              {pmt.reference_number || '—'}
                            </td>
                            <td className="px-4 py-3.5 text-slate-500 max-w-xs truncate">
                              {pmt.description || '—'}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              {pmt.receipt_document_url ? (
                                <a
                                  href={pmt.receipt_document_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-sky-600 hover:underline font-bold text-xs"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>مشاهده فیش</span>
                                </a>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Standalone Cards View (< md) - Distinct cards separated vertically */}
                <div className="block md:hidden space-y-4">
                  {financeData.coaches_finance.payments.map((pmt) => (
                    <div
                      key={pmt.id}
                      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4.5 sm:p-5 shadow-xs hover:shadow-md transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white text-sm block">
                            {pmt.coach_name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                            سند {pmt.payment_number}
                          </span>
                        </div>
                        <div className="text-left font-mono">
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block">
                            {formatPrice(pmt.amount)}
                          </span>
                          <span className="text-[10px] text-slate-400">تومان</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-400 block">روش واریز:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {pmt.payment_method_display || pmt.payment_method}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">شماره پیگیری:</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300">
                            {pmt.reference_number || '—'}
                          </span>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">تاریخ واریز:</span>
                          <span className="font-mono text-slate-500 text-[11px]">
                            {pmt.payment_date ? formatShamsi(pmt.payment_date) : '—'}
                          </span>
                        </div>
                      </div>

                      {pmt.description && (
                        <p className="text-[11px] text-slate-500 bg-slate-100/60 dark:bg-slate-800/80 p-2 rounded-xl">
                          {pmt.description}
                        </p>
                      )}

                      {pmt.receipt_document_url && (
                        <div className="pt-1">
                          <a
                            href={pmt.receipt_document_url}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2 px-3 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center justify-center gap-1.5 text-xs font-bold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>مشاهده تصویر فیش بانکی</span>
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: RECORD SWIMMER PAYMENT (واریز شهریه شناگر)                         */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isSwimmerPayModalOpen}
        onClose={() => {
          if (!submittingSwimmerPay) setIsSwimmerPayModalOpen(false);
        }}
        title="ثبت پرداخت شهریه شناگر"
        maxWidth="max-w-md"
      >
        {selectedInvoice && (
          <form onSubmit={handleSubmitSwimmerPayment} className="space-y-4 text-xs" dir="rtl">
            <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedInvoice.swimmer_name}
                </span>
                <span className="font-mono text-slate-500">
                  فاکتور {selectedInvoice.invoice_number}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300 text-xs pt-1 border-t border-sky-200/60 dark:border-sky-800/60">
                <span>مانده بدهی این دوره:</span>
                <span className="font-bold font-mono text-rose-600 dark:text-rose-400">
                  {formatPrice(selectedInvoice.remaining_balance)} تومان
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                مبلغ پرداختی (تومان) *
              </label>
              <input
                type="number"
                value={swimmerPayForm.amount}
                onChange={(e) => setSwimmerPayForm({ ...swimmerPayForm, amount: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                placeholder="مثلاً ۳,۵۰۰,۰۰۰"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                روش پرداخت *
              </label>
              <CustomSelect
                value={swimmerPayForm.method}
                onChange={(val) => setSwimmerPayForm({ ...swimmerPayForm, method: val })}
                options={[
                  { value: 'POS', label: 'دستگاه کارتخوان حضوری (POS)' },
                  { value: 'CARD_TRANSFER', label: 'انتقال کارت به کارت / شبا' },
                  { value: 'CASH', label: 'نقدی' },
                  { value: 'ONLINE_GATEWAY', label: 'درگاه پرداخت الکترونیک' },
                ]}
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                شماره پیگیری / مرجع بانکی
              </label>
              <input
                type="text"
                value={swimmerPayForm.transaction_ref}
                onChange={(e) => setSwimmerPayForm({ ...swimmerPayForm, transaction_ref: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                placeholder="شماره ارجاع تراکنش..."
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                توضیحات و یادداشت
              </label>
              <textarea
                value={swimmerPayForm.notes}
                onChange={(e) => setSwimmerPayForm({ ...swimmerPayForm, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                placeholder="توضیحات تکمیلی..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsSwimmerPayModalOpen(false)}
                disabled={submittingSwimmerPay}
              >
                انصراف
              </Button>
              <Button
                size="sm"
                type="submit"
                disabled={submittingSwimmerPay}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                {submittingSwimmerPay ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>ثبت قطعی پرداخت</span>
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: FINANCIAL ADJUSTMENT (تخفیف یا استرداد وجه شناگر)                   */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAdjModalOpen}
        onClose={() => {
          if (!submittingAdj) setIsAdjModalOpen(false);
        }}
        title="ثبت سند تعدیل مالی (تخفیف / استرداد)"
        maxWidth="max-w-md"
      >
        {adjInvoice && (
          <form onSubmit={handleSubmitAdjustment} className="space-y-4 text-xs" dir="rtl">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-900 dark:text-white block">
                شناگر: {adjInvoice.swimmer_name}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
                صورتحساب {adjInvoice.invoice_number} • مانده فعلی: {formatPrice(adjInvoice.remaining_balance)} تومان
              </span>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                نوع تعدیل *
              </label>
              <CustomSelect
                value={adjForm.type}
                onChange={(val) => setAdjForm({ ...adjForm, type: val })}
                options={[
                  { value: 'DISCOUNT', label: 'تخفیف (کاهش مانده بدهی)' },
                  { value: 'REFUND', label: 'استرداد وجه به شناگر' },
                ]}
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                مبلغ تعدیل (تومان) *
              </label>
              <input
                type="number"
                value={adjForm.amount}
                onChange={(e) => setAdjForm({ ...adjForm, amount: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                placeholder="مبلغ مورد نظر..."
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                علت و مستندات تعدیل *
              </label>
              <textarea
                value={adjForm.reason}
                onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })}
                required
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                placeholder="علت اعمال تخفیف یا استرداد وجه..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsAdjModalOpen(false)}
                disabled={submittingAdj}
              >
                انصراف
              </Button>
              <Button
                size="sm"
                type="submit"
                disabled={submittingAdj}
                className="bg-sky-600 hover:bg-sky-700 text-white gap-1.5"
              >
                {submittingAdj ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>ثبت سند تعدیل</span>
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: REVIEW PAYMENT RECEIPT (بررسی و تأیید فیش کارت‌به‌کارت)            */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          if (!submittingReceiptReview) setIsReceiptModalOpen(false);
        }}
        title="بررسی فیش واریزی کارت‌به‌کارت شناگر"
        maxWidth="max-w-lg"
      >
        {selectedReceipt && (
          <form onSubmit={handleSubmitReceiptReview} className="space-y-4 text-xs" dir="rtl">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  {selectedReceipt.swimmer_name}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  کد پیگیری: {selectedReceipt.tracking_number || '—'}
                </span>
              </div>
              <span className="font-mono font-bold text-emerald-600 text-sm">
                {formatPrice(selectedReceipt.amount_claimed)} تومان
              </span>
            </div>

            {selectedReceipt.receipt_image && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-72 flex items-center justify-center bg-black/10">
                <img
                  src={selectedReceipt.receipt_image}
                  alt="فیش ارسالی شناگر"
                  className="w-full h-auto max-h-72 object-contain"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                تصمیم مدیریت:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReceiptReviewForm({ ...receiptReviewForm, action: 'APPROVE' })}
                  className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    receiptReviewForm.action === 'APPROVE'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأیید فیش و ثبت پرداخت</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptReviewForm({ ...receiptReviewForm, action: 'REJECT' })}
                  className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    receiptReviewForm.action === 'REJECT'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>رد فیش و عدم تأیید</span>
                </button>
              </div>
            </div>

            {receiptReviewForm.action === 'APPROVE' ? (
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  مبلغ تأییدشده نهایی (تومان) *
                </label>
                <input
                  type="number"
                  value={receiptReviewForm.approved_amount}
                  onChange={(e) => setReceiptReviewForm({ ...receiptReviewForm, approved_amount: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  علت رد فیش واریزی *
                </label>
                <textarea
                  value={receiptReviewForm.reason}
                  onChange={(e) => setReceiptReviewForm({ ...receiptReviewForm, reason: e.target.value })}
                  required
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  placeholder="مثلاً: تصویر ناخوانا، مبلغ ناهمخوان با سند بانکی..."
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                disabled={submittingReceiptReview}
              >
                انصراف
              </Button>
              <Button
                size="sm"
                type="submit"
                disabled={submittingReceiptReview}
                className={receiptReviewForm.action === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'}
              >
                {submittingReceiptReview ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>ثبت تصمیم نهایی</span>
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: RECORD COACH PAYMENT (واریز حقوق به مربی دوره)                     */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCoachPayModalOpen}
        onClose={() => {
          if (!submittingCoachPay) setIsCoachPayModalOpen(false);
        }}
        title="ثبت واریز حقوق / دستمزد به مربی"
        maxWidth="max-w-md"
      >
        {selectedCoachForPay && (
          <form onSubmit={handleSubmitCoachPayment} className="space-y-4 text-xs" dir="rtl">
            <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  مربی {selectedCoachForPay.full_name}
                </span>
                <span className="text-slate-400 font-mono text-xs">
                  {selectedCoachForPay.personnel_id}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300 text-xs pt-1 border-t border-indigo-200/60 dark:border-indigo-800/60">
                <span>مانده طلب مربی بابت دوره:</span>
                <span className="font-bold font-mono text-rose-600 dark:text-rose-400">
                  {formatPrice(selectedCoachForPay.remaining_balance)} تومان
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                مبلغ واریزی به مربی (تومان) *
              </label>
              <input
                type="number"
                value={coachPayForm.amount}
                onChange={(e) => setCoachPayForm({ ...coachPayForm, amount: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="مبلغ واریزی..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  روش پرداخت *
                </label>
                <CustomSelect
                  value={coachPayForm.payment_method}
                  onChange={(val) => setCoachPayForm({ ...coachPayForm, payment_method: val })}
                  options={[
                    { value: 'BANK_TRANSFER', label: 'حواله بانکی پایا / ساتنا' },
                    { value: 'CARD_TRANSFER', label: 'انتقال کارت به کارت' },
                    { value: 'CHEQUE', label: 'چک بانکی صیادی' },
                    { value: 'CASH', label: 'نقدی' },
                  ]}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  تاریخ واریز *
                </label>
                <PersianDatePicker
                  value={coachPayForm.payment_date}
                  onChange={(val) => setCoachPayForm({ ...coachPayForm, payment_date: val })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                شماره پیگیری / ارجاع بانکی
              </label>
              <input
                type="text"
                value={coachPayForm.reference_number}
                onChange={(e) => setCoachPayForm({ ...coachPayForm, reference_number: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="کد ارجاع حواله پایا یا شماره فیش..."
              />
            </div>

            {/* Receipt Document Upload */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                پیوست تصویر رسید بانکی (اختیاری)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="coach-receipt-file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setCoachReceiptFile(e.target.files[0] || null)}
                  className="hidden"
                />
                <label
                  htmlFor="coach-receipt-file"
                  className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1.5 transition-colors text-xs font-semibold"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{coachReceiptFile ? coachReceiptFile.name : 'انتخاب فایل فیش...'}</span>
                </label>
                {coachReceiptFile && (
                  <button
                    type="button"
                    onClick={() => setCoachReceiptFile(null)}
                    className="text-rose-500 text-xs hover:underline"
                  >
                    حذف
                  </button>
                )}
              </div>
              {coachReceiptPreview && (
                <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-36 flex items-center justify-center bg-black/5">
                  <img src={coachReceiptPreview} alt="پیش‌نمایش رسید" className="h-32 object-contain" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                توضیحات و بابت
              </label>
              <textarea
                value={coachPayForm.description}
                onChange={(e) => setCoachPayForm({ ...coachPayForm, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="توضیحات سند پرداخت..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsCoachPayModalOpen(false)}
                disabled={submittingCoachPay}
              >
                انصراف
              </Button>
              <Button
                size="sm"
                type="submit"
                disabled={submittingCoachPay}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                {submittingCoachPay ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>ثبت قطعی واریزی</span>
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: GENERATE / CALCULATE COURSE PAYROLL (فیش حقوقی دوره مربی)         */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isPayrollModalOpen}
        onClose={() => {
          if (!submittingPayroll) setIsPayrollModalOpen(false);
        }}
        title="صدور / پیش‌محاسبه فیش حقوقی دوره مربی"
        maxWidth="max-w-md"
      >
        {selectedCoachForPayroll && (
          <form onSubmit={handleSubmitIssuePayroll} className="space-y-4 text-xs" dir="rtl">
            <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-1">
              <span className="font-bold text-slate-900 dark:text-white text-sm block">
                مربی {selectedCoachForPayroll.full_name}
              </span>
              <span className="text-slate-500 text-xs block">
                مدل همکاری: {selectedCoachForPayroll.employment_type_display} • شاگردان دوره: {selectedCoachForPayroll.swimmers_count} نفر
              </span>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                عنوان دوره حقوقی *
              </label>
              <input
                type="text"
                value={payrollForm.period_label}
                onChange={(e) => setPayrollForm({ ...payrollForm, period_label: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  شروع بازه دوره *
                </label>
                <PersianDatePicker
                  value={payrollForm.period_start}
                  onChange={(val) => setPayrollForm({ ...payrollForm, period_start: val })}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  پایان بازه دوره *
                </label>
                <PersianDatePicker
                  value={payrollForm.period_end}
                  onChange={(val) => setPayrollForm({ ...payrollForm, period_end: val })}
                />
              </div>
            </div>

            {/* Calculate Preview Button */}
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCalculatePayrollPreview}
                disabled={calculatingPayrollPreview}
                className="w-full justify-center gap-1.5 text-xs text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
              >
                {calculatingPayrollPreview ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>استخراج پیش‌محاسبه کارکرد دوره</span>
              </Button>
            </div>

            {/* Preview Box */}
            {payrollPreviewData && (
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">جلسات برگزارشده:</span>
                  <span className="font-mono font-bold">{payrollPreviewData.completed_sessions_count} جلسه</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">مجموع ساعات تدریس:</span>
                  <span className="font-mono font-bold">{payrollPreviewData.teaching_hours} ساعت</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1 border-t border-indigo-200/80 dark:border-indigo-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200">خالص استحقاقی:</span>
                  <span className="font-mono font-black text-indigo-700 dark:text-indigo-300 text-sm">
                    {formatPrice(payrollPreviewData.net_payable_amount)} تومان
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsPayrollModalOpen(false)}
                disabled={submittingPayroll}
              >
                انصراف
              </Button>
              <Button
                size="sm"
                type="submit"
                disabled={submittingPayroll}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
              >
                {submittingPayroll ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>صدور و تأیید فیش حقوقی</span>
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
