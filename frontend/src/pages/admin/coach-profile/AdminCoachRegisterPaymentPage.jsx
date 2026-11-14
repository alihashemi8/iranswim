import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  CreditCard, ArrowRight, Save, DollarSign, Calendar, FileUp,
  Receipt, CheckCircle2, AlertCircle, RefreshCw, Hash, ChevronLeft,
  FileCheck2, ShieldCheck, Wallet, Upload, Download, Check
} from 'lucide-react';
import api from '../../../api/client';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { PersianDatePicker } from '../../../components/common/PersianDatePicker';
import { LoadingState } from '../../../components/common/LoadingState';
import { BackButton } from '../../../components/common/BackButton';
import { useToast } from '../../../context/ToastContext';

export const AdminCoachRegisterPaymentPage = () => {
  const { id, payrollId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [coach, setCoach] = useState(null);
  const [payrolls, setPayrolls] = useState([]);
  const [selectedPayrollId, setSelectedPayrollId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'BANK_TRANSFER',
    reference_number: '',
    description: '',
  });

  const [receiptFile, setReceiptFile] = useState(null);

  // Fetch coach and all coach payrolls
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [coachRes, payrollsRes] = await Promise.all([
          api.get(`/coaches/${id}/`),
          api.get(`/coaches/${id}/payrolls/`),
        ]);

        setCoach(coachRes.data);
        const pList = payrollsRes.data || [];
        setPayrolls(pList);

        // Determine which payroll to pre-select:
        const targetPid =
          payrollId ||
          searchParams.get('payroll_id') ||
          (pList.find((p) => Number(p.remaining_balance) > 0)?.id || pList[0]?.id || '');

        if (targetPid) {
          const matched = pList.find((p) => String(p.id) === String(targetPid));
          setSelectedPayrollId(String(targetPid));
          if (matched && Number(matched.remaining_balance) > 0) {
            setForm((prev) => ({
              ...prev,
              amount: String(Math.round(Number(matched.remaining_balance))),
            }));
          }
        }
      } catch (err) {
        console.error(err);
        toast.error('خطا در دریافت اطلاعات مالی مربی');
        navigate(`/admin/coaches/${id}?tab=FINANCE`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, payrollId, searchParams]);

  // Current selected payroll object
  const currentPayroll = payrolls.find((p) => String(p.id) === String(selectedPayrollId));

  // Handle changing payroll selection
  const handlePayrollSelect = (newPid) => {
    setSelectedPayrollId(newPid);
    const matched = payrolls.find((p) => String(p.id) === String(newPid));
    if (matched && Number(matched.remaining_balance) > 0) {
      setForm((prev) => ({
        ...prev,
        amount: String(Math.round(Number(matched.remaining_balance))),
      }));
    }
  };

  const handleChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const remainingBalance = currentPayroll
    ? Math.max(0, (Number(currentPayroll.remaining_balance) || (Number(currentPayroll.net_payable_amount) - Number(currentPayroll.total_paid)) || 0))
    : 0;

  const currentPayAmount = Number(form.amount) || 0;
  const newRemainingBalance = Math.max(0, remainingBalance - currentPayAmount);

  const formatPrice = (v) => Number(v || 0).toLocaleString('fa-IR');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPayrollId) {
      toast.error('لطفاً دوره حقوقی و قرارداد مربوطه را انتخاب کنید.');
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('مبلغ پرداختی باید بزرگتر از صفر باشد.');
      return;
    }

    if (!form.payment_date) {
      toast.error('تاریخ واریز وجه الزامی است.');
      return;
    }

    if (!receiptFile) {
      toast.error('لطفاً تصویر یا فایل فیش واریز را انتخاب نمایید.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('amount', form.amount);
      formData.append('payment_date', form.payment_date);
      formData.append('payment_method', form.payment_method);
      if (form.reference_number) formData.append('reference_number', form.reference_number.trim());
      if (form.description) formData.append('description', form.description.trim());
      formData.append('receipt_document', receiptFile);
      formData.append('receipt', receiptFile);

      await api.post(`/coaches/payrolls/${selectedPayrollId}/payments/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('فیش پرداختی و سند واریز حقوق با موفقیت در سیستم ثبت گردید.');
      navigate(`/admin/coaches/${id}?tab=FINANCE`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت و آپلود فیش پرداختی');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <LoadingState message="در حال بارگذاری دوره‌های مالی و آماده‌سازی فرم آپلود فیش..." />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6" dir="rtl">
      {/* Header & Breadcrumb */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <BackButton to={`/admin/coaches/${id}?tab=FINANCE`} fallback={`/admin/coaches/${id}`} title="بازگشت به پرونده مالی مربی" />
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 truncate">
            <Link to="/admin/coaches" className="hover:text-sky-600 transition-colors shrink-0">
              مدیریت مربیان
            </Link>
            <span>/</span>
            <Link to={`/admin/coaches/${id}?tab=FINANCE`} className="hover:text-sky-600 transition-colors shrink-0 truncate">
              پرونده مالی {coach?.full_name}
            </Link>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-200 font-semibold shrink-0">
              بارگذاری فیش پرداختی
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 truncate">
            <Upload className="w-6 h-6 text-emerald-600 shrink-0" />
            <span>بارگذاری فیش پرداختی و ثبت واریز وجه به مربی</span>
          </h1>
        </div>
      </div>

      {/* Coach Info Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-white to-sky-50 dark:from-emerald-950/20 dark:via-slate-900 dark:to-sky-950/20 border border-emerald-200/80 dark:border-emerald-900/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-emerald-600/20 shrink-0 overflow-hidden">
            {coach?.avatar ? (
              <img src={coach.avatar} alt={coach.full_name} className="w-full h-full object-cover" />
            ) : (
              coach?.full_name?.charAt(0) || 'م'
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{coach?.full_name}</h2>
              <Badge variant="success" className="text-xs">
                کد پرسنلی: {coach?.personnel_id || coach?.id}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              شماره تماس: <span className="font-mono">{coach?.phone}</span>
              {coach?.national_id && <span> • کد ملی: <strong className="font-mono">{coach.national_id}</strong></span>}
            </p>
          </div>
        </div>

        {currentPayroll && (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <span className="text-slate-400">حقوق دوره: </span>
              <span className="font-bold font-mono text-slate-900 dark:text-white">
                {formatPrice(currentPayroll.net_payable_amount)} ت
              </span>
            </div>
            <div className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <span className="text-slate-400">واریز شده: </span>
              <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatPrice(currentPayroll.total_paid)} ت
              </span>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/60 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300">
              <span className="font-bold">مانده طلب: </span>
              <span className="font-bold font-mono">
                {formatPrice(remainingBalance)} ت
              </span>
            </div>
          </div>
        )}
      </div>

      {payrolls.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-amber-300 dark:border-amber-800 p-8 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
            دوره حقوقی برای این مربی صادر نشده است
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            برای ثبت سند پرداخت و آپلود فیش، ابتدا باید یک دوره حقوقی جدید برای این مربی محاسبه و صادر شود.
          </p>
          <Button
            onClick={() => navigate(`/admin/coaches/${id}/payrolls/new`)}
            className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold"
          >
            صدور دوره حقوقی جدید
          </Button>
        </div>
      ) : (
        /* Form */
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>اطلاعات سند و فیش واریزی</span>
              </h3>

              {/* 1. Period Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  دوره حقوقی و قرارداد مربوطه <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedPayrollId}
                  onChange={(e) => handlePayrollSelect(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                >
                  <option value="">انتخاب دوره حقوقی...</option>
                  {payrolls.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.period_label} — خالص: {formatPrice(p.net_payable_amount)} ت (مانده: {formatPrice(p.remaining_balance)} ت)
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. File Upload Box (Matching Screenshot) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  فایل تصویر یا PDF فیش واریز <span className="text-rose-500">*</span>
                </label>
                <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                  receiptFile
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}>
                  <input
                    type="file"
                    id="receipt-file-input"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => setReceiptFile(e.target.files[0] || null)}
                    required
                  />
                  <label htmlFor="receipt-file-input" className="cursor-pointer flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                      <FileUp className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 block">
                        {receiptFile ? receiptFile.name : 'کلیک کنید یا فایل فیش پرداختی را اینجا رها کنید'}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        {receiptFile
                          ? `${(receiptFile.size / 1024).toFixed(1)} کیلوبایت — برای تعویض کلیک کنید`
                          : 'فرمت‌های مجاز: JPG, PNG, PDF (حداکثر ۱۰ مگابایت)'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 3. Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    مبلغ واریز به حساب (تومان) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1000"
                      step="1000"
                      value={form.amount}
                      onChange={(e) => handleChange('amount', e.target.value)}
                      placeholder="مثال: ۷۶۰۰۰۰۰"
                      className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 pr-9 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                      required
                    />
                    <DollarSign className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  </div>
                  {currentPayAmount > 0 && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      معادل: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatPrice(currentPayAmount)} تومان</strong>
                    </p>
                  )}
                </div>

                <div>
                  <PersianDatePicker
                    label="تاریخ واریز وجه *"
                    value={form.payment_date}
                    onChange={(jalaliStr, gDate, gIso) => handleChange('payment_date', gIso || '')}
                    placeholder="انتخاب تاریخ واریز..."
                    color="emerald"
                    size="md"
                    required
                  />
                </div>
              </div>

              {/* 4. Payment Method & Reference Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    روش پرداخت <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.payment_method}
                    onChange={(e) => handleChange('payment_method', e.target.value)}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  >
                    <option value="BANK_TRANSFER">انتقال بانکی (پایا / ساتنا)</option>
                    <option value="CARD_TO_CARD">کارت به کارت</option>
                    <option value="CHEQUE">چک بانکی صیادی</option>
                    <option value="CASH">نقدی</option>
                    <option value="POS">دستگاه کارتخوان (POS)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    شماره پیگیری / مرجع بانکی
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.reference_number}
                      onChange={(e) => handleChange('reference_number', e.target.value)}
                      placeholder="کد پیگیری تراکنش بانکی..."
                      className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 pr-9 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    />
                    <Hash className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                </div>
              </div>

              {/* 5. Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  توضیحات و بابت پرداخت
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="مثال: تسویه فیش حقوقی دوره، واریز علی‌الحساب..."
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live Status & Submit */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 sticky top-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>پیش‌نمایش وضعیت تسویه</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800/60">
                  <span className="text-slate-500">طرف حساب:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{coach?.full_name}</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800/60">
                  <span className="text-slate-500">دوره حقوقی:</span>
                  <span className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                    {currentPayroll?.period_label || '—'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800/60">
                  <span className="text-slate-500">مانده فعلی دوره:</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    {formatPrice(remainingBalance)} تومان
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800/60">
                  <span className="text-slate-500">مبلغ این واریز:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatPrice(currentPayAmount)} تومان
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800/60">
                  <span className="text-slate-500">مانده پس از پرداخت:</span>
                  <span className={`font-mono font-bold ${newRemainingBalance === 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-400'}`}>
                    {formatPrice(newRemainingBalance)} تومان
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800/60">
                  <span className="text-slate-500">وضعیت جدید فیش:</span>
                  <Badge variant={newRemainingBalance === 0 ? 'success' : 'warning'} className="text-[10px]">
                    {newRemainingBalance === 0 ? 'کاملاً تسویه‌شده (Paid)' : 'پرداخت بخشی (Partially Paid)'}
                  </Badge>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال ثبت سند و آپلود فیش...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>ثبت و آپلود فیش</span>
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/admin/coaches/${id}?tab=FINANCE`)}
                  className="w-full text-xs"
                >
                  انصراف
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminCoachRegisterPaymentPage;
