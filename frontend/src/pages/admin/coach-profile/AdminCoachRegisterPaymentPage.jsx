import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  CreditCard, ArrowRight, DollarSign, Calendar, FileUp,
  Receipt, CheckCircle2, AlertCircle, RefreshCw, Hash,
  FileCheck2, ShieldCheck, Wallet, Upload, Check, Copy,
  Building2, Trash2, Eye, FileText, ArrowLeft, ArrowUpRight
} from 'lucide-react';
import api from '../../../api/client';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { CustomSelect } from '../../../components/common/CustomSelect';
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
  const [previewUrl, setPreviewUrl] = useState(null);

  // Generate object preview URL when receiptFile changes
  useEffect(() => {
    if (!receiptFile) {
      setPreviewUrl(null);
      return;
    }
    if (receiptFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(receiptFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [receiptFile]);

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

  const copyToClipboard = (text, message = 'کپی شد') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  const payrollOptions = payrolls.map((p) => {
    const remaining = Number(p.remaining_balance) || 0;
    const isSettled = remaining <= 0;
    return {
      value: String(p.id),
      label: p.period_label || `دوره مالی #${p.id}`,
      description: `حقوق مصوب: ${formatPrice(p.net_payable_amount)} تومان • پرداختی تاکنون: ${formatPrice(p.total_paid)} تومان`,
      badge: isSettled ? 'تسویه کامل' : `مانده: ${formatPrice(remaining)} ت`,
      badgeClassName: isSettled
        ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
        : 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800',
      icon: Calendar,
    };
  });

  const paymentMethodOptions = [
    {
      value: 'BANK_TRANSFER',
      label: 'انتقال بانکی (پایا / ساتنا)',
      description: 'واریز بین بانکی مستقیم به شماره شبا',
      icon: CreditCard,
    },
    {
      value: 'CARD_TO_CARD',
      label: 'کارت به کارت',
      description: 'انتقال شتابی کارت به کارت بانکی',
      icon: CreditCard,
    },
    {
      value: 'CHEQUE',
      label: 'چک بانکی صیادی',
      description: 'چک معتبر شرکتی یا صیادی بنفش',
      icon: FileCheck2,
    },
    {
      value: 'CASH',
      label: 'پرداخت نقدی',
      description: 'تحویل دستی وجه نقد همراه با امضا رسید',
      icon: Wallet,
    },
    {
      value: 'POS',
      label: 'دستگاه کارتخوان (POS)',
      description: 'تراکنش دستگاه پوز مستقر در محل استخر',
      icon: Hash,
    },
  ];

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
      {/* 1. Header & Navigation Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <BackButton
            to={`/admin/coaches/${id}?tab=FINANCE`}
            fallback={`/admin/coaches/${id}`}
            title="بازگشت به امور مالی مربی"
          />
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link to="/admin/coaches" className="hover:text-sky-600 transition-colors">
                مدیریت مربیان
              </Link>
              <span>/</span>
              <Link to={`/admin/coaches/${id}?tab=FINANCE`} className="hover:text-sky-600 transition-colors font-medium">
                {coach?.full_name} (امور مالی)
              </Link>
              <span>/</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold">ثبت واریز وجه</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Receipt className="w-6 h-6 text-emerald-600" />
              <span>ثبت سند واریز و بارگذاری فیش بانکی</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge variant="neutral" className="text-xs py-1 px-2.5">
            مربی: {coach?.full_name}
          </Badge>
          <Badge variant="success" className="text-xs py-1 px-2.5">
            کد پرسنلی: {coach?.personnel_id || coach?.id}
          </Badge>
        </div>
      </div>

      {/* 2. Top Info Grid: Coach & Bank Info + Period Financial Context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card A: Coach & Bank Accounts */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-lg font-bold shadow-md shadow-emerald-600/20 shrink-0 overflow-hidden">
              {coach?.avatar ? (
                <img src={coach.avatar} alt={coach.full_name} className="w-full h-full object-cover" />
              ) : (
                coach?.full_name?.charAt(0) || 'م'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {coach?.full_name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">
                {coach?.phone}
                {coach?.national_id && <span> • کد ملی: {coach.national_id}</span>}
              </p>
            </div>
          </div>

          {/* Bank Accounts */}
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            {coach?.shaba_number ? (
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-500">شماره شبا:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 dir-ltr text-[11px] sm:text-xs">
                    {coach.shaba_number.startsWith('IR') ? coach.shaba_number : `IR${coach.shaba_number}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(coach.shaba_number, 'شماره شبا کپی شد')}
                  className="p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                  title="کپی شماره شبا"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}

            {coach?.card_number ? (
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-500">شماره کارت:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 dir-ltr text-xs tracking-wider">
                    {coach.card_number}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(coach.card_number, 'شماره کارت کپی شد')}
                  className="p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                  title="کپی شماره کارت"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}

            {!coach?.shaba_number && !coach?.card_number && (
              <p className="text-[11px] text-slate-400 text-center py-1">
                شماره کارت یا شبا در پرونده مربی ثبت نشده است
              </p>
            )}
          </div>
        </div>

        {/* Card B: Selected Period Financial Ledger */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500">وضعیت مالی دوره انتخابی</span>
            <Badge variant="sky" className="text-xs font-bold">
              {currentPayroll?.period_label || 'انتخاب دوره در فرم...'}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 py-3 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[11px] text-slate-400 block mb-0.5">حقوق مصوب</span>
              <strong className="text-xs sm:text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
                {currentPayroll ? `${formatPrice(currentPayroll.net_payable_amount)}` : '—'}
              </strong>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30">
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mb-0.5">واریز شده</span>
              <strong className="text-xs sm:text-sm font-mono font-bold text-emerald-700 dark:text-emerald-300">
                {currentPayroll ? `${formatPrice(currentPayroll.total_paid)}` : '—'}
              </strong>
            </div>

            <div className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30">
              <span className="text-[11px] text-rose-600 dark:text-rose-400 block mb-0.5">مانده طلب</span>
              <strong className="text-xs sm:text-sm font-mono font-bold text-rose-700 dark:text-rose-300">
                {currentPayroll ? `${formatPrice(remainingBalance)}` : '—'}
              </strong>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>تاریخ دوره:</span>
            <span>
              {currentPayroll?.period_start
                ? `${new Date(currentPayroll.period_start).toLocaleDateString('fa-IR')} تا ${new Date(currentPayroll.period_end).toLocaleDateString('fa-IR')}`
                : '—'}
            </span>
          </div>
        </div>
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
        /* 3. Main Form */
        <form onSubmit={handleSubmit}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
            {/* Form Section Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>اطلاعات سند مالی و بارگذاری فیش بانکی</span>
              </div>
              <span className="text-xs text-slate-400">فیلدهای علامت‌دار (<span className="text-rose-500">*</span>) الزامی هستند</span>
            </div>

            {/* Form Content: 2 Balanced Columns */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Right Column (7 cols): Financial Inputs */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. Period Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    دوره حقوقی و قرارداد مربوطه <span className="text-rose-500">*</span>
                  </label>
                  <CustomSelect
                    value={selectedPayrollId}
                    onChange={(val) => handlePayrollSelect(val)}
                    options={payrollOptions}
                    placeholder="انتخاب دوره حقوقی مورد نظر..."
                    icon={Calendar}
                    color="emerald"
                    size="md"
                    menuClassName="w-full"
                    searchable={payrollOptions.length > 4}
                  />
                </div>

                {/* 2. Amount Input + Quick Fill Buttons */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      مبلغ واریز به حساب (تومان) <span className="text-rose-500">*</span>
                    </label>
                    {remainingBalance > 0 && (
                      <span className="text-[11px] text-slate-400">
                        مانده طلب: <strong className="font-mono text-rose-600 dark:text-rose-400">{formatPrice(remainingBalance)} تومان</strong>
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      min="1000"
                      step="1000"
                      value={form.amount}
                      onChange={(e) => handleChange('amount', e.target.value)}
                      placeholder="مثال: ۷۶۰۰۰۰۰"
                      className="w-full text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 pr-9 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                      required
                    />
                    <DollarSign className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  </div>

                  {/* Quick Fill Chips */}
                  {remainingBalance > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleChange('amount', String(Math.round(remainingBalance)))}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        تسویه کل مانده ({formatPrice(remainingBalance)} ت)
                      </button>
                      {remainingBalance >= 20000 && (
                        <button
                          type="button"
                          onClick={() => handleChange('amount', String(Math.round(remainingBalance / 2)))}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          ۵۰٪ مانده ({formatPrice(Math.round(remainingBalance / 2))} ت)
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Date & Payment Method */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      روش پرداخت <span className="text-rose-500">*</span>
                    </label>
                    <CustomSelect
                      value={form.payment_method}
                      onChange={(val) => handleChange('payment_method', val)}
                      options={paymentMethodOptions}
                      placeholder="انتخاب روش پرداخت..."
                      icon={CreditCard}
                      color="emerald"
                      size="md"
                      menuClassName="w-full"
                    />
                  </div>
                </div>

                {/* 4. Reference Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    شماره پیگیری / مرجع بانکی
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.reference_number}
                      onChange={(e) => handleChange('reference_number', e.target.value)}
                      placeholder="کد پیگیری تراکنش بانکی (پایا، ساتنا، کارت‌به‌کارت)..."
                      className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 pr-9 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    />
                    <Hash className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
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

              {/* Left Column (5 cols): Receipt File Upload & Live Settlement Preview */}
              <div className="lg:col-span-5 space-y-5">
                {/* Receipt Upload & Preview Box */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    فایل تصویر یا PDF فیش واریز <span className="text-rose-500">*</span>
                  </label>

                  {!receiptFile ? (
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 transition-all">
                      <input
                        type="file"
                        id="receipt-file-input"
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => setReceiptFile(e.target.files[0] || null)}
                        required
                      />
                      <label htmlFor="receipt-file-input" className="cursor-pointer flex flex-col items-center gap-2.5">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                          <FileUp className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 block">
                            کلیک کنید یا فایل فیش را اینجا رها کنید
                          </span>
                          <span className="text-[11px] text-slate-400 mt-1 block">
                            فرمت‌های مجاز: JPG, PNG, PDF (حداکثر ۱۰ مگابایت)
                          </span>
                        </div>
                      </label>
                    </div>
                  ) : (
                    /* File Selected State with Preview */
                    <div className="rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                              {receiptFile.name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {(receiptFile.size / 1024).toFixed(1)} کیلوبایت
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setReceiptFile(null)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                          title="حذف این فیش"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Image Preview Thumbnail if available */}
                      {previewUrl ? (
                        <div className="rounded-xl overflow-hidden border border-emerald-200 dark:border-emerald-900 max-h-48 bg-slate-900 flex items-center justify-center">
                          <img
                            src={previewUrl}
                            alt="پیش‌نمایش فیش"
                            className="max-h-48 w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center gap-3">
                          <FileText className="w-8 h-8 text-rose-500 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              سند الکترونیکی PDF
                            </span>
                            <span className="text-[11px] text-slate-400">
                              فایل ضمیمه پیوست شده آماده ارسال است
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <label
                          htmlFor="receipt-file-change"
                          className="text-xs text-emerald-700 dark:text-emerald-300 font-bold hover:underline cursor-pointer"
                        >
                          تعویض فایل فیش...
                        </label>
                        <input
                          type="file"
                          id="receipt-file-change"
                          className="hidden"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => setReceiptFile(e.target.files[0] || null)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Live Settlement Impact Card */}
                <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/40 dark:from-slate-800/60 dark:to-emerald-950/20 border border-slate-200/80 dark:border-slate-700/80 p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>پیش‌نمایش تأثیر واریز بر حساب دوره</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">مانده بدهی این دوره:</span>
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                        {formatPrice(remainingBalance)} تومان
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">مبلغ واریزی جدید:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatPrice(currentPayAmount)} تومان
                      </span>
                    </div>

                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />

                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200">مانده نهایی پس از ثبت:</span>
                      <span
                        className={`font-mono font-black text-sm ${
                          newRemainingBalance <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {newRemainingBalance <= 0 ? 'تسویه کامل (۰ تومان)' : `${formatPrice(newRemainingBalance)} تومان`}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {currentPayroll && Number(currentPayroll.net_payable_amount) > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>میزان تسویه این دوره:</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {Math.min(
                            100,
                            Math.round(
                              ((Number(currentPayroll.total_paid) + currentPayAmount) /
                                Number(currentPayroll.net_payable_amount)) *
                                100
                            )
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-l from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                ((Number(currentPayroll.total_paid) + currentPayAmount) /
                                  Number(currentPayroll.net_payable_amount)) *
                                  100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form Footer Action Bar */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-400 hidden sm:block">
                پس از ثبت، سند پرداخت بلافاصله در آرشیو فیش‌ها و گردش حساب مربی منعکس می‌شود.
              </span>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/admin/coaches/${id}?tab=FINANCE`)}
                  className="text-xs px-4"
                >
                  انصراف و بازگشت
                </Button>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-6 py-2.5 shadow-md shadow-emerald-600/20 gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال ثبت سند و آپلود فیش...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>ثبت نهایی و بارگذاری فیش</span>
                    </>
                  )}
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
