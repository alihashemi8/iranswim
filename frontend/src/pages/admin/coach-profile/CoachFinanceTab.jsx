import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard, Plus, CheckCircle2, AlertCircle, Clock,
  FileText, Download, RotateCcw, AlertTriangle, Eye, Check,
  Upload, Receipt, Calendar, ArrowRight, ShieldCheck, DollarSign
} from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { useToast } from '../../../context/ToastContext';
import api from '../../../api/client';

export const CoachFinanceTab = ({
  coach,
  contracts = [],
  payrolls = [],
  onContractsUpdated,
  onPayrollsUpdated,
}) => {
  const navigate = useNavigate();
  const toast = useToast();

  // Active sub-section within Finance tab
  const [activeSection, setActiveSection] = useState('PAYROLLS'); // 'PAYROLLS' | 'RECEIPTS' | 'CONTRACTS'

  // Selected payroll for detail drill-down
  const [selectedPayroll, setSelectedPayroll] = useState(null);

  // Add Adjustment Modal (Bonus / Deduction)
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

  // Format price helper
  const formatPrice = (v) => Number(v || 0).toLocaleString('fa-IR');

  // Overall Financial Totals
  const totalReceivable = payrolls.reduce(
    (acc, p) => acc + (Number(p.net_payable_amount) || 0),
    0
  );
  const totalPaid = payrolls.reduce(
    (acc, p) => acc + (Number(p.total_paid) || 0),
    0
  );
  const totalRemaining = Math.max(0, totalReceivable - totalPaid);
  const settlementPercentage =
    totalReceivable > 0 ? Math.min(100, Math.round((totalPaid / totalReceivable) * 100)) : 100;

  // Active contract
  const activeContract = contracts.find((c) => c.status === 'ACTIVE');

  // All payments aggregated across all payrolls
  const allPayments = payrolls
    .flatMap((p) =>
      (p.payments || []).map((pmt) => ({
        ...pmt,
        period_label: p.period_label,
        payroll_id: p.id,
      }))
    )
    .sort((a, b) => new Date(b.payment_date || 0) - new Date(a.payment_date || 0));

  const totalReceiptsCount = allPayments.filter((pmt) => pmt.receipt_document_url).length;

  // Fetch single payroll detail
  const fetchPayrollDetails = async (id) => {
    try {
      const res = await api.get(`/coaches/payrolls/${id}/`);
      setSelectedPayroll(res.data);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت جزئیات فیش حقوقی');
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

  // Add Adjustment Submit
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
      toast.success('ردیف تعدیل حقوق با موفقیت ثبت گردید.');
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

  // Reverse Payment Submit
  const handleReversePayment = async (e) => {
    e.preventDefault();
    if (!selectedPaymentForReverse || !reverseReason.trim()) {
      toast.error('درج علت ابطال سند الزامی است.');
      return;
    }

    try {
      setSubmittingReverse(true);
      await api.post(`/coaches/payments/${selectedPaymentForReverse.id}/reverse/`, {
        reason: reverseReason.trim(),
      });
      toast.success('سند پرداخت با موفقیت ابطال و برگشت داده شد.');
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

  return (
    <div className="space-y-6">
      {/* Top Banner and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-sky-600" />
            امور مالی و تسویه حساب‌های مربی
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            قراردادهای دوره‌ای، پیگیری کل مطالبات و دریافتی‌ها، و بارگذاری مستقیم فیش‌های پرداختی
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => navigate(`/admin/coaches/${coach.id}/payments/new`)}
            className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs font-bold"
          >
            <Upload className="w-4 h-4" />
            <span>آپلود فیش پرداختی جدید</span>
          </Button>

          <Button
            onClick={() => navigate(`/admin/coaches/${coach.id}/payrolls/new`)}
            className="gap-1.5 text-xs bg-sky-600 hover:bg-sky-500 text-white shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>صدور حقوق دوره جدید</span>
          </Button>
        </div>
      </div>

      {/* OVERALL FINANCIAL SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Total Receivable */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                کل مبلغ دریافتی (حقوق مصوب):
              </span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
              {formatPrice(totalReceivable)} <span className="text-xs font-normal text-slate-500">تومان</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
            مجموع کارکرد و فیش‌های صادرشده ({payrolls.length} دوره)
          </div>
        </div>

        {/* Card 2: Total Paid */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                چقدر پرداخت شده (کل واریزی):
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {formatPrice(totalPaid)} <span className="text-xs font-normal text-slate-500">تومان</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">{totalReceiptsCount} فیش بانکی آپلودشده</span>
            <span className="font-bold text-emerald-600 font-mono">{settlementPercentage}٪ تسویه</span>
          </div>
        </div>

        {/* Card 3: Total Remaining Due */}
        <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs flex flex-col justify-between ${
          totalRemaining > 0
            ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold ${
                totalRemaining > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'
              }`}>
                مانده تسویه‌نشده (طلب مربی):
              </span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                totalRemaining > 0
                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {totalRemaining > 0 ? <AlertCircle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              </div>
            </div>
            <div className={`text-xl sm:text-2xl font-black font-mono ${
              totalRemaining > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'
            }`}>
              {formatPrice(totalRemaining)} <span className="text-xs font-normal text-slate-500">تومان</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[11px]">
            {totalRemaining > 0 ? (
              <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                مبلغ در انتظار ثبت پرداخت و آپلود فیش
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                کلیه مطالبات تسویه کامل شده است
              </span>
            )}
          </div>
        </div>

        {/* Card 4: Active Contract & Commitment */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                وضعیت قرارداد و تعهدات:
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
              {activeContract ? (
                <span>قرارداد فعال: {activeContract.contract_number}</span>
              ) : (
                <span className="text-amber-600">فاقد قرارداد فعال جاری</span>
              )}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>تعهد کاری: {activeContract?.agreed_weekly_hours || coach.contractual_weekly_hours || 0} ساعت/هفته</span>
            {activeContract?.document_url && (
              <a
                href={activeContract.document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-600 hover:text-sky-700 font-bold inline-flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                فایل قرارداد
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Internal Sub-navigation Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-2.5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto scrollbar-none w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveSection('PAYROLLS')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeSection === 'PAYROLLS'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span>قراردادها و دوره‌های مالی</span>
            {payrolls.length > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-bold bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                {payrolls.length} دوره
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('RECEIPTS')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeSection === 'RECEIPTS'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span>فیش‌های پرداختی و رسیدها</span>
            {allPayments.length > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {allPayments.length} سند
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('CONTRACTS')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeSection === 'CONTRACTS'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span>احکام و سوابق قراردادها</span>
            {contracts.length > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                {contracts.length}
              </span>
            )}
          </button>
        </div>

        <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 px-3 hidden lg:inline">
          {activeSection === 'PAYROLLS' && 'مشاهده مبالغ مصوب، میزان واریزی و مانده تسویه هر دوره'}
          {activeSection === 'RECEIPTS' && 'آرشیو فیش‌های بانکی واریزشده با امکان آپلود فیش جدید'}
          {activeSection === 'CONTRACTS' && 'قراردادهای همکاری، بازه‌های زمانی و تعهدات کاری مربی'}
        </span>
      </div>

      {/* SECTION 1: PAYROLLS TABLE (قرارداد های هر دوره و وضعیت پرداختی ها و میزان پرداخت) */}
      {activeSection === 'PAYROLLS' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  قراردادها و دوره‌های مالی (کارکرد، حقوق مصوب و میزان پرداخت)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  برای آپلود مستقیم فیش واریز یا مشاهده ریز محاسبات، روی ردیف مربوطه کلیک کنید
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => navigate(`/admin/coaches/${coach.id}/payments/new`)}
                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>+ آپلود فیش پرداختی</span>
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-bold">دوره / قرارداد</th>
                    <th className="py-3 px-4 font-bold">کارکرد</th>
                    <th className="py-3 px-4 font-bold">مبلغ مصوب (باید دریافت کند)</th>
                    <th className="py-3 px-4 font-bold text-emerald-700 dark:text-emerald-400">میزان پرداخت‌شده</th>
                    <th className="py-3 px-4 font-bold text-rose-700 dark:text-rose-400">مانده تسویه</th>
                    <th className="py-3 px-4 font-bold text-center">وضعیت پرداخت</th>
                    <th className="py-3 px-4 font-bold text-center">وضعیت تأیید</th>
                    <th className="py-3 px-4 font-bold text-center">فیش‌های پیوست</th>
                    <th className="py-3 px-4 font-bold text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {payrolls.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        تاکنون دوره حقوقی یا فیشی برای این مربی ثبت نشده است.
                      </td>
                    </tr>
                  ) : (
                    payrolls.map((p) => {
                      const receiptsCount = (p.payments || []).filter((pmt) => pmt.receipt_document_url).length;
                      return (
                        <tr
                          key={p.id}
                          onClick={() => fetchPayrollDetails(p.id)}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                            selectedPayroll?.id === p.id ? 'bg-sky-50/60 dark:bg-sky-950/30 font-semibold' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            <div>{p.period_label}</div>
                            <div className="text-[11px] text-slate-400 font-normal font-mono">
                              {new Date(p.period_start).toLocaleDateString('fa-IR')} تا {new Date(p.period_end).toLocaleDateString('fa-IR')}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            {Number(p.teaching_hours || 0).toLocaleString('fa-IR')} س ({p.completed_sessions_count} جلسه)
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                            {formatPrice(p.net_payable_amount)} تومان
                          </td>
                          <td className="py-3.5 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                            {formatPrice(p.total_paid)} تومان
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-rose-600 dark:text-rose-400">
                            {formatPrice(p.remaining_balance)} تومان
                          </td>
                          <td className="py-3.5 px-4 text-center">
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
                          <td className="py-3.5 px-4 text-center">
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
                          <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            {receiptsCount > 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPayroll(p);
                                  setActiveSection('RECEIPTS');
                                }}
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                title="مشاهده فیش‌های واریزی این دوره"
                              >
                                <Receipt className="w-3 h-3" />
                                <span>{receiptsCount} فیش</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px]">بدون فیش</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/admin/coaches/${coach.id}/payrolls/${p.id}/payments/new`)}
                                className="text-[11px] py-1 px-2 gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                title="آپلود فیش واریز برای این دوره"
                              >
                                <Upload className="w-3 h-3 text-emerald-600" />
                                <span>آپلود فیش</span>
                              </Button>

                              <button
                                type="button"
                                onClick={() => fetchPayrollDetails(p.id)}
                                className="text-xs text-sky-600 hover:text-sky-700 font-semibold inline-flex items-center gap-1 p-1"
                                title="مشاهده ریز محاسبات فیش"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
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
                      ریز محاسبات مالی دوره: {selectedPayroll.period_label}
                    </h4>
                    <Badge variant={selectedPayroll.approval_status === 'APPROVED' ? 'success' : 'warning'}>
                      {selectedPayroll.approval_status_display}
                    </Badge>
                    <Badge variant={selectedPayroll.payment_status === 'PAID' ? 'success' : 'error'}>
                      {selectedPayroll.payment_status_display}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    بازه زمانی دوره: {new Date(selectedPayroll.period_start).toLocaleDateString('fa-IR')} تا {new Date(selectedPayroll.period_end).toLocaleDateString('fa-IR')}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    onClick={() => navigate(`/admin/coaches/${coach.id}/payrolls/${selectedPayroll.id}/payments/new`)}
                    className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>آپلود فیش واریز این دوره</span>
                  </Button>

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

              {/* Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs sm:text-sm">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block mb-1">دستمزد کارکرد جلسات:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    {formatPrice(selectedPayroll.base_compensation)} تومان
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {selectedPayroll.teaching_hours} ساعت تدریس ({selectedPayroll.completed_sessions_count} جلسه)
                  </span>
                </div>

                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-emerald-700 dark:text-emerald-300 block mb-1">پاداش‌ها و اضافه‌کاری:</span>
                  <span className="font-mono font-bold text-emerald-800 dark:text-emerald-200 text-sm sm:text-base">
                    + {formatPrice(Number(selectedPayroll.bonuses_amount || 0) + Number(selectedPayroll.overtime_amount || 0))} تومان
                  </span>
                </div>

                <div className="bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/40">
                  <span className="text-rose-700 dark:text-rose-300 block mb-1">کسورات قانونی و غیبت:</span>
                  <span className="font-mono font-bold text-rose-800 dark:text-rose-200 text-sm sm:text-base">
                    - {formatPrice(selectedPayroll.deductions_amount)} تومان
                  </span>
                </div>

                <div className="bg-sky-50 dark:bg-sky-950/40 p-3 rounded-xl border border-sky-200 dark:border-sky-800">
                  <span className="text-sky-800 dark:text-sky-200 block mb-1 font-bold">خالص قابل دریافت:</span>
                  <span className="font-mono font-black text-sky-900 dark:text-sky-100 text-base sm:text-lg">
                    {formatPrice(selectedPayroll.net_payable_amount)} تومان
                  </span>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 pt-1 border-t border-sky-200/60 dark:border-sky-800">
                    <span>پرداخت‌شده: {formatPrice(selectedPayroll.total_paid)}</span>
                    <span className="font-bold text-rose-600">مانده: {formatPrice(selectedPayroll.remaining_balance)}</span>
                  </div>
                </div>
              </div>

              {/* Sub-table: Registered Payments and Receipts for this payroll */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    اسناد واریزی و فیش‌های ثبت‌شده برای این دوره
                  </h5>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/admin/coaches/${coach.id}/payrolls/${selectedPayroll.id}/payments/new`)}
                    className="text-xs py-1 gap-1 text-emerald-600 border-emerald-200"
                  >
                    <Upload className="w-3 h-3" />
                    <span>آپلود فیش جدید</span>
                  </Button>
                </div>

                {selectedPayroll.payments && selectedPayroll.payments.length > 0 ? (
                  <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-none">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400">
                        <tr>
                          <th className="py-2 px-3">شماره سند</th>
                          <th className="py-2 px-3">مبلغ واریزی</th>
                          <th className="py-2 px-3">تاریخ واریز</th>
                          <th className="py-2 px-3">شماره پیگیری / مرجع</th>
                          <th className="py-2 px-3 text-center">فیش واریز</th>
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
                            <td className="py-2 px-3 font-mono text-slate-500">{pmt.reference_number || '—'}</td>
                            <td className="py-2 px-3 text-center">
                              {pmt.receipt_document_url ? (
                                <a
                                  href={pmt.receipt_document_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800"
                                  title="دانلود / مشاهده تصویر فیش"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>مشاهده فیش</span>
                                </a>
                              ) : (
                                <span className="text-slate-400">فاقد تصویر فیش</span>
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
                                  className="text-rose-600 hover:text-rose-700 text-[11px] inline-flex items-center gap-1"
                                  title="ابطال سند پرداخت"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>برگشت سند</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs py-2">هنوز فیش واریزی برای این دوره ثبت نشده است.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: RECEIPTS ARCHIVE (یه جا برای آپلود فیش های پرداختی) */}
      {activeSection === 'RECEIPTS' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                آرشیو فیش‌های بانکی و اسناد واریزی مربی
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                کلیه فیش‌های حقوقی بارگذاری شده، رسیدهای انتقال ساتنا/پایا و اسناد تراکنش بانکی
              </p>
            </div>

            <Button
              onClick={() => navigate(`/admin/coaches/${coach.id}/payments/new`)}
              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              <Upload className="w-4 h-4" />
              <span>بارگذاری فیش پرداختی جدید</span>
            </Button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-bold">شماره سند</th>
                    <th className="py-3 px-4 font-bold">دوره حقوقی مرتبط</th>
                    <th className="py-3 px-4 font-bold">مبلغ واریزی</th>
                    <th className="py-3 px-4 font-bold">تاریخ واریز</th>
                    <th className="py-3 px-4 font-bold">روش پرداخت</th>
                    <th className="py-3 px-4 font-bold">شماره پیگیری / مرجع بانکی</th>
                    <th className="py-3 px-4 font-bold text-center">فایل فیش آپلودشده</th>
                    <th className="py-3 px-4 font-bold text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {allPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        <div className="max-w-xs mx-auto space-y-3">
                          <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                          <p>هنوز هیچ فیش پرداختی یا سند واریزی برای این مربی بارگذاری نشده است.</p>
                          <Button
                            size="sm"
                            onClick={() => navigate(`/admin/coaches/${coach.id}/payments/new`)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold mx-auto"
                          >
                            <Upload className="w-3.5 h-3.5 ml-1" />
                            اولین فیش را آپلود کنید
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    allPayments.map((pmt) => (
                      <tr
                        key={pmt.id}
                        className={pmt.is_reversal ? 'bg-rose-50/30 line-through text-slate-400' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-sky-700 dark:text-sky-400">
                          {pmt.payment_number}
                          {pmt.is_reversal && <span className="text-rose-600 mr-1 text-[10px]">(برگشت‌داده‌شده)</span>}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {pmt.period_label}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatPrice(pmt.amount)} تومان
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {new Date(pmt.payment_date).toLocaleDateString('fa-IR')}
                        </td>
                        <td className="py-3 px-4">{pmt.payment_method_display}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{pmt.reference_number || '—'}</td>
                        <td className="py-3 px-4 text-center">
                          {pmt.receipt_document_url ? (
                            <a
                              href={pmt.receipt_document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-sky-600 hover:text-sky-700 font-bold inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 dark:bg-sky-950/60 rounded-xl border border-sky-200 dark:border-sky-800"
                              title="مشاهده یا دانلود فایل فیش"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>دانلود فیش</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 text-xs">بدون فایل پیوست</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {!pmt.is_reversal && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPaymentForReverse(pmt);
                                setReverseReason('');
                                setIsReverseModalOpen(true);
                              }}
                              className="text-rose-600 hover:text-rose-700 text-xs inline-flex items-center gap-1"
                              title="ابطال سند"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>برگشت</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: CONTRACTS HISTORY (احکام و سوابق قراردادها بدون مدل قرارداد) */}
      {activeSection === 'CONTRACTS' && (
        <div className="space-y-6">
          {/* Active Contract Hero Box */}
          {activeContract ? (
            <div className="p-5 rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-gradient-to-r from-sky-50/50 to-indigo-50/30 dark:from-sky-950/20 dark:to-indigo-950/20 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-sky-100 dark:border-sky-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        قرارداد فعال: شماره {activeContract.contract_number}
                      </h4>
                      <Badge variant="success">جاری و دارای اعتبار</Badge>
                      {activeContract.is_expiring_soon && (
                        <span className="bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          کمتر از ۳۰ روز تا پایان اعتبار
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeContract.document_url && (
                    <a
                      href={activeContract.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 font-semibold flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-sky-200 dark:border-sky-800 shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>دانلود نسخه امضاشده</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block mb-1">نرخ / دستمزد مصوب:</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white text-sm sm:text-base">
                    {activeContract.employment_type === 'HOURLY' && `${Number(activeContract.hourly_rate).toLocaleString('fa-IR')} ت/ساعت`}
                    {activeContract.employment_type === 'FIXED' && `${Number(activeContract.fixed_salary).toLocaleString('fa-IR')} ت/ماه`}
                    {activeContract.employment_type === 'PERCENTAGE' && `${activeContract.percentage_rate}٪ از شهریه`}
                  </span>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block mb-1">بازه زمانی اعتبار:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {new Date(activeContract.start_date).toLocaleDateString('fa-IR')} تا {new Date(activeContract.end_date).toLocaleDateString('fa-IR')}
                  </span>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block mb-1">تعهد کاری هفتگی:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {activeContract.agreed_weekly_hours} ساعت در هفته
                  </span>
                </div>
              </div>

              {activeContract.terms_and_conditions && (
                <div className="text-xs text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <strong className="text-slate-700 dark:text-slate-300 block mb-1">مفاد و شرایط توافق‌شده:</strong>
                  <p className="leading-relaxed">{activeContract.terms_and_conditions}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-center space-y-2">
              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                این مربی در حال حاضر فاقد قرارداد ثبتی است
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                نرخ‌ها و مدل دستمزد مربی مستقیماً از بخش مشخصات و ویرایش پرونده مربی خوانده شده و در محاسبات فیش‌های دوره‌ای لحاظ می‌شود.
              </p>
            </div>
          )}

          {/* Historical Contracts Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                سوابق کلیه قراردادهای مربی ({contracts.length} فقره)
              </h4>
              <span className="text-[11px] text-slate-400">سوابق تاریخی به هیچ عنوان بازنویسی نمی‌شوند</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-bold">شماره قرارداد</th>
                    <th className="py-3 px-4 font-bold">تاریخ شروع</th>
                    <th className="py-3 px-4 font-bold">تاریخ پایان</th>
                    <th className="py-3 px-4 font-bold">نرخ / دستمزد مصوب</th>
                    <th className="py-3 px-4 font-bold">ساعات تعهد</th>
                    <th className="py-3 px-4 font-bold">وضعیت</th>
                    <th className="py-3 px-4 font-bold text-center">فایل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {contracts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        هیچ قراردادی در پرونده ثبت نشده است.
                      </td>
                    </tr>
                  ) : (
                    contracts.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-sky-700 dark:text-sky-400">
                          {c.contract_number}
                        </td>
                        <td className="py-3 px-4 font-mono">{new Date(c.start_date).toLocaleDateString('fa-IR')}</td>
                        <td className="py-3 px-4 font-mono">{new Date(c.end_date).toLocaleDateString('fa-IR')}</td>
                        <td className="py-3 px-4 font-mono font-semibold">
                          {c.employment_type === 'HOURLY' && `${Number(c.hourly_rate).toLocaleString('fa-IR')} تومان`}
                          {c.employment_type === 'FIXED' && `${Number(c.fixed_salary).toLocaleString('fa-IR')} تومان`}
                          {c.employment_type === 'PERCENTAGE' && `${c.percentage_rate}٪`}
                        </td>
                        <td className="py-3 px-4 font-mono">{c.agreed_weekly_hours} ساعت</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              c.status === 'ACTIVE'
                                ? 'success'
                                : c.status === 'RENEWED'
                                ? 'info'
                                : c.status === 'EXPIRED'
                                ? 'neutral'
                                : 'warning'
                            }
                          >
                            {c.status_display}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {c.document_url ? (
                            <a
                              href={c.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-600 hover:text-sky-700 inline-block p-1"
                              title="دانلود فایل قرارداد"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}



      {/* Modal: Add Adjustment (Bonus / Deduction) */}
      <Modal
        isOpen={isAdjModalOpen}
        onClose={() => setIsAdjModalOpen(false)}
        title="ثبت پاداش یا کسورات روی فیش حقوقی"
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
              placeholder="مثال: اشتباه در واریز، عدم تطابق رسید..."
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
