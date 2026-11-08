import React, { useState } from 'react';
import {
  CreditCard, Plus, CheckCircle2, AlertCircle, Clock, DollarSign,
  FileText, Download, RotateCcw, AlertTriangle, ChevronDown, ChevronUp,
  ShieldAlert, Eye, Check, Calendar, ArrowLeftRight
} from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { useToast } from '../../../context/ToastContext';
import api from '../../../api/client';

export const CoachPayrollTab = ({ coach, payrolls, onPayrollsUpdated }) => {
  const toast = useToast();

  // Selected payroll for inspection
  const [selectedPayroll, setSelectedPayroll] = useState(null);

  // Generate Payroll Modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    period_start: '',
    period_end: '',
    period_label: '',
  });
  const [previewData, setPreviewData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Register Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'BANK_TRANSFER',
    reference_number: '',
    description: '',
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Add Adjustment Modal
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [adjForm, setAdjForm] = useState({
    adjustment_type: 'BONUS',
    amount: '',
    title: '',
    reason: '',
  });
  const [submittingAdj, setSubmittingAdj] = useState(false);

  // Reverse Payment Modal
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [selectedPaymentForReverse, setSelectedPaymentForReverse] = useState(null);
  const [reverseReason, setReverseReason] = useState('');
  const [submittingReverse, setSubmittingReverse] = useState(false);

  // Fetch Payroll Details
  const fetchPayrollDetails = async (id) => {
    try {
      const res = await api.get(`/coaches/payrolls/${id}/`);
      setSelectedPayroll(res.data);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت جزئیات فیش حقوقی');
    }
  };

  // Preview Payroll Calculation
  const handlePreviewPayroll = async () => {
    if (!generateForm.period_start || !generateForm.period_end) {
      toast.error('لطفاً بازه زمانی شروع و پایان دوره را مشخص کنید.');
      return;
    }

    try {
      setLoadingPreview(true);
      const res = await api.post(`/coaches/${coach.id}/payrolls/`, {
        ...generateForm,
        preview_only: true,
      });
      setPreviewData(res.data);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در پیش‌محاسبه حقوق');
    } finally {
      setLoadingPreview(false);
    }
  };

  // Confirm and Generate Payroll
  const handleConfirmGeneratePayroll = async (e) => {
    e.preventDefault();
    try {
      setGenerating(true);
      await api.post(`/coaches/${coach.id}/payrolls/`, {
        ...generateForm,
        preview_only: false,
      });
      toast.success('فیش حقوقی دوره با موفقیت صادر و ثبت شد.');
      setIsGenerateModalOpen(false);
      setPreviewData(null);
      if (onPayrollsUpdated) onPayrollsUpdated();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در صدور فیش حقوقی');
    } finally {
      setGenerating(false);
    }
  };

  // Approve Payroll
  const handleApprovePayroll = async (payrollId) => {
    if (!window.confirm('آیا از تأیید نهایی این فیش حقوقی اطمینان دارید؟ پس از تأیید، مبالغ پایه تثبیت می‌شوند.')) return;

    try {
      await api.post(`/coaches/payrolls/${payrollId}/approve/`);
      toast.success('فیش حقوقی با موفقیت تأیید شد.');
      fetchPayrollDetails(payrollId);
      if (onPayrollsUpdated) onPayrollsUpdated();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در تأیید فیش حقوقی');
    }
  };

  // Submit Payment
  const handleRegisterPayment = async (e) => {
    e.preventDefault();
    if (!selectedPayroll) return;
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      toast.error('مبلغ پرداختی باید بزرگتر از صفر باشد.');
      return;
    }

    try {
      setSubmittingPayment(true);
      const formData = new FormData();
      formData.append('amount', paymentForm.amount);
      formData.append('payment_date', paymentForm.payment_date);
      formData.append('payment_method', paymentForm.payment_method);
      if (paymentForm.reference_number) formData.append('reference_number', paymentForm.reference_number);
      if (paymentForm.description) formData.append('description', paymentForm.description);
      if (receiptFile) formData.append('receipt_document', receiptFile);

      await api.post(`/coaches/payrolls/${selectedPayroll.id}/payments/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('سند پرداخت حقوق با موفقیت ثبت شد.');
      setIsPaymentModalOpen(false);
      setPaymentForm({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'BANK_TRANSFER',
        reference_number: '',
        description: '',
      });
      setReceiptFile(null);
      fetchPayrollDetails(selectedPayroll.id);
      if (onPayrollsUpdated) onPayrollsUpdated();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت سند پرداخت');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Submit Adjustment
  const handleAddAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedPayroll) return;
    if (!adjForm.amount || !adjForm.title) {
      toast.error('عنوان و مبلغ ردیف الزامی است.');
      return;
    }

    try {
      setSubmittingAdj(true);
      await api.post(`/coaches/payrolls/${selectedPayroll.id}/adjustments/`, adjForm);
      toast.success('ردیف تعدیل حقوق با موفقیت اضافه شد.');
      setIsAdjModalOpen(false);
      setAdjForm({ adjustment_type: 'BONUS', amount: '', title: '', reason: '' });
      fetchPayrollDetails(selectedPayroll.id);
      if (onPayrollsUpdated) onPayrollsUpdated();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت ردیف تعدیل');
    } finally {
      setSubmittingAdj(false);
    }
  };

  // Submit Reversal
  const handleReversePayment = async (e) => {
    e.preventDefault();
    if (!selectedPaymentForReverse || !reverseReason.trim()) {
      toast.error('درج علت برگشت سند الزامی است.');
      return;
    }

    try {
      setSubmittingReverse(true);
      await api.post(`/coaches/payments/${selectedPaymentForReverse.id}/reverse/`, {
        reason: reverseReason.trim(),
      });
      toast.success('سند پرداخت با موفقیت برگشت داده شد.');
      setIsReverseModalOpen(false);
      setSelectedPaymentForReverse(null);
      setReverseReason('');
      if (selectedPayroll) fetchPayrollDetails(selectedPayroll.id);
      if (onPayrollsUpdated) onPayrollsUpdated();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در برگشت سند');
    } finally {
      setSubmittingReverse(false);
    }
  };

  const formatPrice = (v) => Number(v || 0).toLocaleString('fa-IR');

  return (
    <div className="space-y-6">
      {/* Top Banner and Compensation Model Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-sky-600" />
            سیستم حقوق، دستمزد و اسناد مالی مربی
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            محاسبه هوشمند بر اساس ساعات جلسات برگزارشده، اعمال پاداش و کسورات و ثبت واریز مرحله‌ای
          </p>
        </div>

        <Button
          onClick={() => {
            const today = new Date();
            const y = today.getFullYear();
            const m = today.getMonth();
            const firstDay = new Date(y, m, 1).toISOString().split('T')[0];
            const lastDay = new Date(y, m + 1, 0).toISOString().split('T')[0];

            setGenerateForm({
              period_start: firstDay,
              period_end: lastDay,
              period_label: `حقوق ${today.toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' })}`,
            });
            setPreviewData(null);
            setIsGenerateModalOpen(true);
          }}
          className="gap-1.5 text-xs bg-sky-600 hover:bg-sky-500 text-white shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>محاسبه و صدور حقوق دوره جدید</span>
        </Button>
      </div>

      {/* Model Overview Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-400 block mb-1">مدل پرداخت جاری:</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {coach.employment_type === 'HOURLY' && 'ساعتی (حق‌التدریس بر اساس جلسه)'}
            {coach.employment_type === 'FIXED' && 'حقوق ثابت ماهانه'}
            {coach.employment_type === 'PERCENTAGE' && 'درصدی از درآمد دوره‌ها'}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block mb-1">نرخ پایه همکاری:</span>
          <span className="font-mono font-bold text-sky-700 dark:text-sky-400">
            {coach.employment_type === 'HOURLY' && `${formatPrice(coach.hourly_rate)} تومان/ساعت`}
            {coach.employment_type === 'FIXED' && `${formatPrice(coach.fixed_monthly_salary)} تومان/ماه`}
            {coach.employment_type === 'PERCENTAGE' && `${coach.revenue_percentage}٪ از درآمد`}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block mb-1">ساعات تعهد هفتگی:</span>
          <span className="font-mono text-slate-700 dark:text-slate-300">
            {coach.contractual_weekly_hours} ساعت
          </span>
        </div>

        <div>
          <span className="text-slate-400 block mb-1">کل فیش‌های صادرشده:</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {payrolls.length} دوره حقوقی
          </span>
        </div>
      </div>

      {/* Payrolls Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
            لیست فیش‌های حقوقی و کارکرد ماهانه
          </h4>
          <span className="text-[11px] text-slate-400">برای مشاهده ریز محاسبات و ثبت واریز روی هر ردیف کلیک کنید</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-bold">دوره حقوق</th>
                <th className="py-3 px-4 font-bold">ساعات مصوب</th>
                <th className="py-3 px-4 font-bold">جلسات</th>
                <th className="py-3 px-4 font-bold">دستمزد پایه</th>
                <th className="py-3 px-4 font-bold">خالص پرداختی</th>
                <th className="py-3 px-4 font-bold">واریزشده</th>
                <th className="py-3 px-4 font-bold">مانده تسویه</th>
                <th className="py-3 px-4 font-bold">تأییدیه مدیر</th>
                <th className="py-3 px-4 font-bold">وضعیت تسویه</th>
                <th className="py-3 px-4 font-bold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {payrolls.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    تاکنون فیش حقوقی برای این مربی صادر نشده است.
                  </td>
                </tr>
              ) : (
                payrolls.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => fetchPayrollDetails(p.id)}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                      selectedPayroll?.id === p.id ? 'bg-sky-50/60 dark:bg-sky-950/30 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {p.period_label}
                    </td>
                    <td className="py-3 px-4 font-mono">{Number(p.teaching_hours || 0).toLocaleString('fa-IR')} س</td>
                    <td className="py-3 px-4 font-mono">{p.completed_sessions_count} جلسه</td>
                    <td className="py-3 px-4 font-mono">{formatPrice(p.base_compensation)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {formatPrice(p.net_payable_amount)} ت
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400">
                      {formatPrice(p.total_paid)} ت
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-600 dark:text-rose-400">
                      {formatPrice(p.remaining_balance)} ت
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          p.approval_status === 'APPROVED'
                            ? 'success'
                            : p.approval_status === 'DRAFT'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {p.approval_status_display}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          p.payment_status === 'PAID'
                            ? 'success'
                            : p.payment_status === 'PARTIALLY_PAID'
                            ? 'warning'
                            : 'error'
                        }
                      >
                        {p.payment_status_display}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => fetchPayrollDetails(p.id)}
                        className="text-xs text-sky-600 hover:text-sky-700 font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>مشاهده</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Payroll Deep-Dive Panel */}
      {selectedPayroll && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-sky-400/80 dark:border-sky-500/80 p-5 shadow-md space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-slate-900 dark:text-white text-sm">
                  ریز محاسبات حقوق: {selectedPayroll.period_label}
                </h4>
                <Badge variant={selectedPayroll.approval_status === 'APPROVED' ? 'success' : 'warning'}>
                  {selectedPayroll.approval_status_display}
                </Badge>
                <Badge variant={selectedPayroll.payment_status === 'PAID' ? 'success' : 'error'}>
                  {selectedPayroll.payment_status_display}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                بازه زمانی: {new Date(selectedPayroll.period_start).toLocaleDateString('fa-IR')} تا {new Date(selectedPayroll.period_end).toLocaleDateString('fa-IR')}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {selectedPayroll.approval_status === 'DRAFT' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAdjModalOpen(true)}
                    className="gap-1 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن پاداش / کسر</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleApprovePayroll(selectedPayroll.id)}
                    className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>تأیید نهایی فیش</span>
                  </Button>
                </>
              )}

              {selectedPayroll.approval_status === 'APPROVED' && selectedPayroll.remaining_balance > 0 && (
                <Button
                  size="sm"
                  onClick={() => {
                    setPaymentForm({
                      amount: String(selectedPayroll.remaining_balance),
                      payment_date: new Date().toISOString().split('T')[0],
                      payment_method: 'BANK_TRANSFER',
                      reference_number: '',
                      description: `واریز حقوق ${selectedPayroll.period_label}`,
                    });
                    setIsPaymentModalOpen(true);
                  }}
                  className="gap-1.5 text-xs bg-sky-600 hover:bg-sky-500 text-white"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>ثبت واریز وجه</span>
                </Button>
              )}

              <button
                type="button"
                onClick={() => setSelectedPayroll(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
                title="بستن پنل"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Financial Breakdown Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-1">دستمزد پایه (کارکرد جلسات):</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                {formatPrice(selectedPayroll.base_compensation)} تومان
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {selectedPayroll.teaching_hours} ساعت تدریس ({selectedPayroll.completed_sessions_count} جلسه)
              </span>
            </div>

            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-emerald-700 dark:text-emerald-300 block mb-1">پاداش‌ها و اضافه‌کاری:</span>
              <span className="font-mono font-bold text-emerald-800 dark:text-emerald-200 text-sm">
                + {formatPrice(Number(selectedPayroll.bonuses_amount || 0) + Number(selectedPayroll.overtime_amount || 0))} تومان
              </span>
            </div>

            <div className="bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/40">
              <span className="text-rose-700 dark:text-rose-300 block mb-1">کسورات قانونی و غیبت:</span>
              <span className="font-mono font-bold text-rose-800 dark:text-rose-200 text-sm">
                - {formatPrice(selectedPayroll.deductions_amount)} تومان
              </span>
            </div>

            <div className="bg-sky-50 dark:bg-sky-950/40 p-3 rounded-xl border border-sky-200 dark:border-sky-800">
              <span className="text-sky-800 dark:text-sky-200 block mb-1 font-bold">خالص قابل پرداخت:</span>
              <span className="font-mono font-black text-sky-900 dark:text-sky-100 text-base">
                {formatPrice(selectedPayroll.net_payable_amount)} تومان
              </span>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 pt-1 border-t border-sky-200/60 dark:border-sky-800">
                <span>پرداخت‌شده: {formatPrice(selectedPayroll.total_paid)}</span>
                <span className="font-bold text-rose-600">مانده: {formatPrice(selectedPayroll.remaining_balance)}</span>
              </div>
            </div>
          </div>

          {/* Adjustments Sub-Table */}
          <div className="space-y-2">
            <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
              ردیف‌های تعدیل، پاداش‌ها و کسورات مصوب
            </h5>
            {selectedPayroll.adjustments && selectedPayroll.adjustments.length > 0 ? (
              <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400">
                    <tr>
                      <th className="py-2 px-3">نوع</th>
                      <th className="py-2 px-3">عنوان ردیف</th>
                      <th className="py-2 px-3">مبلغ (تومان)</th>
                      <th className="py-2 px-3">توضیحات و دلیل</th>
                      <th className="py-2 px-3">ثبت‌کننده</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedPayroll.adjustments.map((adj) => (
                      <tr key={adj.id}>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ['BONUS', 'OVERTIME', 'MANUAL'].includes(adj.adjustment_type)
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}>
                            {adj.adjustment_type_display}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-semibold">{adj.title}</td>
                        <td className="py-2 px-3 font-mono font-bold">
                          {formatPrice(adj.amount)}
                        </td>
                        <td className="py-2 px-3 text-slate-500">{adj.reason || '—'}</td>
                        <td className="py-2 px-3 text-slate-500">{adj.created_by_name || 'مدیر'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-400 text-xs">هیچ ردیف پاداش یا کسوراتی برای این فیش ثبت نشده است.</p>
            )}
          </div>

          {/* Payments Registered Sub-Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                اسناد واریزی و تراکنش‌های بانکی حقوق
              </h5>
              <span className="text-[11px] text-slate-400">ثبت پرداخت چندمرحله‌ای با شماره مرجع بانکی</span>
            </div>

            {selectedPayroll.payments && selectedPayroll.payments.length > 0 ? (
              <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400">
                    <tr>
                      <th className="py-2 px-3">شماره سند</th>
                      <th className="py-2 px-3">مبلغ واریزی</th>
                      <th className="py-2 px-3">تاریخ واریز</th>
                      <th className="py-2 px-3">روش پرداخت</th>
                      <th className="py-2 px-3">شماره پیگیری / مرجع</th>
                      <th className="py-2 px-3">ثبت‌کننده</th>
                      <th className="py-2 px-3 text-center">فیش</th>
                      <th className="py-2 px-3 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedPayroll.payments.map((pmt) => (
                      <tr key={pmt.id} className={pmt.is_reversal ? 'bg-rose-50/30 line-through text-slate-400' : ''}>
                        <td className="py-2 px-3 font-mono font-bold text-sky-700 dark:text-sky-400">
                          {pmt.payment_number}
                          {pmt.is_reversal && <span className="text-rose-600 mr-1">(برگشت‌داده‌شده)</span>}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          {formatPrice(pmt.amount)} تومان
                        </td>
                        <td className="py-2 px-3 font-mono">{new Date(pmt.payment_date).toLocaleDateString('fa-IR')}</td>
                        <td className="py-2 px-3">{pmt.payment_method_display}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{pmt.reference_number || '—'}</td>
                        <td className="py-2 px-3 text-slate-500">{pmt.registered_by_name || 'مدیر'}</td>
                        <td className="py-2 px-3 text-center">
                          {pmt.receipt_document_url ? (
                            <a
                              href={pmt.receipt_document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-600 hover:text-sky-700"
                              title="مشاهده فیش واریز"
                            >
                              <Download className="w-3.5 h-3.5 inline" />
                            </a>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {!pmt.is_reversal && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPaymentForReverse(pmt);
                                setReverseReason('');
                                setIsReverseModalOpen(true);
                              }}
                              className="text-rose-600 hover:text-rose-700 font-semibold text-[11px] inline-flex items-center gap-1"
                              title="ابطال یا برگشت سند واریز"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>برگشت</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-400 text-xs">هنوز هیچ واریزی برای این فیش حقوقی ثبت نشده است.</p>
            )}
          </div>
        </div>
      )}

      {/* Modal: Generate / Calculate Payroll */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title={`محاسبه و صدور فیش حقوق مربی: ${coach.full_name}`}
        size="lg"
      >
        <form onSubmit={handleConfirmGeneratePayroll} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                عنوان دوره حقوق <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={generateForm.period_label}
                onChange={(e) => setGenerateForm({ ...generateForm, period_label: e.target.value })}
                placeholder="مثال: حقوق آبان ۱۴۰۵"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                تاریخ شروع دوره محاسباتی <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={generateForm.period_start}
                onChange={(e) => setGenerateForm({ ...generateForm, period_start: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                تاریخ پایان دوره محاسباتی <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={generateForm.period_end}
                onChange={(e) => setGenerateForm({ ...generateForm, period_end: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                required
              />
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                disabled={loadingPreview}
                onClick={handlePreviewPayroll}
                className="w-full gap-1.5 text-xs bg-slate-50 dark:bg-slate-800"
              >
                {loadingPreview ? 'در حال بررسی جلسات...' : 'پیش‌نمایش و محاسبه زنده'}
              </Button>
            </div>
          </div>

          {/* Live Preview Box */}
          {previewData && (
            <div className="p-4 bg-sky-50 dark:bg-sky-950/30 rounded-2xl border border-sky-200 dark:border-sky-900 space-y-3 animate-in fade-in">
              <h5 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
                نتیجه استخراج جلسات و محاسبه مقدماتی
              </h5>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">مدل همکاری:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{previewData.compensation_model}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">جلسات برگزارشده:</span>
                  <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{previewData.completed_sessions_count} جلسه</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">ساعات تدریس مصوب:</span>
                  <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{previewData.teaching_hours} ساعت</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">خالص دستمزد پایه:</span>
                  <span className="font-mono font-black text-sky-800 dark:text-sky-300">
                    {formatPrice(previewData.base_compensation)} تومان
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsGenerateModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={generating} className="bg-sky-600 hover:bg-sky-500 text-white">
              {generating ? 'در حال صدور فیش...' : 'تأیید و صدور فیش حقوقی'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Register Payment */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`ثبت واریز حقوق: ${selectedPayroll?.period_label}`}
      >
        <form onSubmit={handleRegisterPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              مبلغ پرداختی (تومان) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              required
            />
            {selectedPayroll && (
              <span className="text-[11px] text-slate-400 block mt-1">
                مانده بدهی این دوره: <strong className="font-mono text-rose-600">{formatPrice(selectedPayroll.remaining_balance)} تومان</strong> (امکان پرداخت جزئی یا کامل وجود دارد)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                روش پرداخت
              </label>
              <select
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="BANK_TRANSFER">حواله پایا / ساتنا</option>
                <option value="CARD_TRANSFER">کارت به کارت</option>
                <option value="CHEQUE">چک صیادی</option>
                <option value="CASH">نقدی</option>
                <option value="OTHER">سایر</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                تاریخ واریز
              </label>
              <input
                type="date"
                value={paymentForm.payment_date}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              شماره پیگیری / مرجع بانکی
            </label>
            <input
              type="text"
              value={paymentForm.reference_number}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
              placeholder="مثال: REF-98341029"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              بارگذاری تصویر فیش یا رسید واریز
            </label>
            <input
              type="file"
              onChange={(e) => setReceiptFile(e.target.files[0])}
              accept="image/*,.pdf"
              className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              توضیحات پرداخت
            </label>
            <textarea
              rows={2}
              value={paymentForm.description}
              onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsPaymentModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={submittingPayment} className="bg-sky-600 hover:bg-sky-500 text-white">
              {submittingPayment ? 'در حال ثبت...' : 'ثبت قطعی پرداخت'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Adjustment (Bonus / Deduction) */}
      <Modal
        isOpen={isAdjModalOpen}
        onClose={() => setIsAdjModalOpen(false)}
        title="ثبت پاداش، اضافه‌کاری یا کسورات روی فیش حقوقی"
      >
        <form onSubmit={handleAddAdjustment} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                نوع ردیف
              </label>
              <select
                value={adjForm.adjustment_type}
                onChange={(e) => setAdjForm({ ...adjForm, adjustment_type: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="BONUS">پاداش رضایت و کیفیت آموزش (+)</option>
                <option value="OVERTIME">اضافه‌کاری و سانس اضافه (+)</option>
                <option value="DEDUCTION">کسورات انضباطی (-)</option>
                <option value="TAX_INSURANCE">بیمه و مالیات قانونی (-)</option>
                <option value="PENALTY">جریمه غیبت غیرموجه (-)</option>
                <option value="MANUAL">تعدیل دستی مصوب مدیریت</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                مبلغ (تومان) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={adjForm.amount}
                onChange={(e) => setAdjForm({ ...adjForm, amount: e.target.value })}
                placeholder="مثال: ۵۰۰۰۰۰"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              عنوان ردیف <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={adjForm.title}
              onChange={(e) => setAdjForm({ ...adjForm, title: e.target.value })}
              placeholder="مثال: پاداش کسب مقام در لیگ توسط شاگردان"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              علت و توضیحات تکمیلی
            </label>
            <textarea
              rows={2}
              value={adjForm.reason}
              onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsAdjModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={submittingAdj} className="bg-sky-600 hover:bg-sky-500 text-white">
              {submittingAdj ? 'در حال ثبت...' : 'افزودن به فیش'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Reverse Payment */}
      <Modal
        isOpen={isReverseModalOpen}
        onClose={() => {
          setIsReverseModalOpen(false);
          setSelectedPaymentForReverse(null);
        }}
        title="ابطال و برگشت سند پرداخت حقوق"
      >
        <form onSubmit={handleReversePayment} className="space-y-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 space-y-1">
            <p className="font-bold">
              شما در حال ابطال سند واریز شماره {selectedPaymentForReverse?.payment_number} به مبلغ {formatPrice(selectedPaymentForReverse?.amount)} تومان هستید.
            </p>
            <p className="text-[11px] text-rose-600 dark:text-rose-300">
              این سند به صورت فیزیکی از دیتابیس پاک نمی‌شود بلکه سند اصلاحی معکوس برای حفظ ردپای حسابرسی صادر خواهد شد.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              علت و توضیح ابطال سند <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reverseReason}
              onChange={(e) => setReverseReason(e.target.value)}
              placeholder="مثال: اشتباه در شماره شبا، بازگشت وجه از بانک، ثبت دوبار سند..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsReverseModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={submittingReverse} className="bg-rose-600 hover:bg-rose-500 text-white">
              {submittingReverse ? 'در حال صدور برگشتی...' : 'تأیید برگشت سند'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
