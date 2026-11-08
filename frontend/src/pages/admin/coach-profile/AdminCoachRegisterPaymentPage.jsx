import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CreditCard, ArrowRight, Save, DollarSign, Calendar, FileUp,
  Receipt, CheckCircle2, AlertCircle, RefreshCw, Hash, ChevronLeft,
  FileCheck2, ShieldCheck, Wallet
} from 'lucide-react';
import api from '../../../api/client';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { CustomSelect } from '../../../components/common/CustomSelect';
import { LoadingState } from '../../../components/common/LoadingState';
import { useToast } from '../../../context/ToastContext';

export const AdminCoachRegisterPaymentPage = () => {
  const { id, payrollId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [coach, setCoach] = useState(null);
  const [payroll, setPayroll] = useState(null);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [coachRes, payrollRes] = await Promise.all([
          api.get(`/coaches/${id}/`),
          api.get(`/coaches/payrolls/${payrollId}/`),
        ]);
        setCoach(coachRes.data);
        const p = payrollRes.data;
        setPayroll(p);

        // Pre-fill amount with remaining balance if positive
        const remaining = (Number(p.final_payable) || 0) - (Number(p.paid_amount) || 0);
        if (remaining > 0) {
          setForm((prev) => ({ ...prev, amount: remaining }));
        }
      } catch (err) {
        console.error(err);
        toast.error('خطا در دریافت اطلاعات فیش حقوقی');
        navigate(`/admin/coaches/${id}?tab=PAYROLL`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, payrollId]);

  const handleChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const remainingBalance = payroll
    ? Math.max(0, (Number(payroll.final_payable) || 0) - (Number(payroll.paid_amount) || 0))
    : 0;

  const currentPayAmount = Number(form.amount) || 0;
  const newRemainingBalance = Math.max(0, remainingBalance - currentPayAmount);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('مبلغ پرداختی باید بزرگتر از صفر باشد.');
      return;
    }

    if (!form.payment_date) {
      toast.error('تاریخ پرداخت الزامی است.');
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
      if (receiptFile) formData.append('receipt', receiptFile);

      await api.post(`/coaches/payrolls/${payrollId}/payments/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('پرداخت حقوق با موفقیت در سیستم ثبت گردید.');
      navigate(`/admin/coaches/${id}?tab=PAYROLL`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت پرداخت حقوق');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <LoadingState message="در حال بارگذاری فیش حقوقی و اطلاعات پرداخت..." />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6" dir="rtl">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
            <Link to="/admin/coaches" className="hover:text-sky-600 transition-colors">
              مدیریت مربیان
            </Link>
            <span>/</span>
            <Link to={`/admin/coaches/${id}?tab=PAYROLL`} className="hover:text-sky-600 transition-colors">
              پرونده مالی {coach?.full_name}
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">ثبت تراکنش پرداخت حقوق</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-emerald-600" />
            <span>ثبت رسمی سند پرداخت حقوق مربی</span>
          </h1>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate(`/admin/coaches/${id}?tab=PAYROLL`)}
          className="gap-2 self-start sm:self-auto text-xs sm:text-sm"
        >
          <ArrowRight className="w-4 h-4" />
          <span>انصراف و بازگشت</span>
        </Button>
      </div>

      {/* Payroll Target Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-white to-sky-50 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="success" className="text-xs">
              فیش دوره: {payroll?.period_label}
            </Badge>
            <span className="text-xs text-slate-500">
              (از {payroll?.period_start} تا {payroll?.period_end})
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
            مربی: {coach?.full_name}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700">
            <span className="text-slate-400">کل قابل پرداخت: </span>
            <span className="font-bold font-mono text-slate-900">
              {(Number(payroll?.final_payable) || 0).toLocaleString('fa-IR')} ت
            </span>
          </div>
          <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700">
            <span className="text-slate-400">پرداخت‌شده: </span>
            <span className="font-bold font-mono text-emerald-600">
              {(Number(payroll?.paid_amount) || 0).toLocaleString('fa-IR')} ت
            </span>
          </div>
          <div className="bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-800">
            <span className="font-bold">مانده طلب: </span>
            <span className="font-bold font-mono">
              {remainingBalance.toLocaleString('fa-IR')} ت
            </span>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>اطلاعات سند و تراکنش پرداخت</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  مبلغ پرداختی (تومان) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1000"
                    value={form.amount}
                    onChange={(e) => handleChange('amount', e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 pr-9 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    required
                  />
                  <DollarSign className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  معادل: <span className="font-bold text-slate-800 font-mono">{currentPayAmount.toLocaleString('fa-IR')} تومان</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  تاریخ واریز / پرداخت <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={form.payment_date}
                    onChange={(e) => handleChange('payment_date', e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  روش پرداخت <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={form.payment_method}
                  onChange={(val) => handleChange('payment_method', val)}
                  options={[
                    { value: 'BANK_TRANSFER', label: 'حواله بانکی / پایا / ساتنا' },
                    { value: 'CARD_TO_CARD', label: 'کارت به کارت' },
                    { value: 'CASH', label: 'نقدی' },
                    { value: 'CHEQUE', label: 'چک بانکی صیادی' },
                    { value: 'POS', label: 'کارتخوان آموزشگاه' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  شماره پیگیری / شماره چک / ارجاع
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.reference_number}
                    onChange={(e) => handleChange('reference_number', e.target.value)}
                    placeholder="مثال: ۹۸۲۳۷۴۲۳ یا شماره چک"
                    className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 pr-9 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                  <Hash className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                توضیحات و بابت پرداخت
              </label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="توضیحات واریز یا تسویه حساب..."
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                تصویر رسید بانکی / فیش واریز
              </label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
                <input
                  type="file"
                  id="receipt-file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setReceiptFile(e.target.files[0] || null)}
                />
                <label htmlFor="receipt-file" className="cursor-pointer flex flex-col items-center gap-1.5">
                  <Receipt className="w-8 h-8 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">
                    {receiptFile ? receiptFile.name : 'انتخاب تصویر فیش واریزی (عکس یا PDF)'}
                  </span>
                  <span className="text-[11px] text-slate-400">حداکثر ۱۰ مگابایت</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Status & Submit */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 sticky top-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>پیش‌نمایش وضعیت تسویه</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">مانده فعلی:</span>
                <span className="font-mono font-bold text-rose-600">
                  {remainingBalance.toLocaleString('fa-IR')} تومان
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">مبلغ این پرداخت:</span>
                <span className="font-mono font-bold text-emerald-600">
                  {currentPayAmount.toLocaleString('fa-IR')} تومان
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">مانده پس از پرداخت:</span>
                <span className={`font-mono font-bold ${newRemainingBalance === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {newRemainingBalance.toLocaleString('fa-IR')} تومان
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">وضعیت جدید فیش:</span>
                <Badge variant={newRemainingBalance === 0 ? 'success' : 'warning'} className="text-[10px]">
                  {newRemainingBalance === 0 ? 'کاملاً تسویه‌شده (Paid)' : 'پرداخت بخشی (Partially Paid)'}
                </Badge>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-xs sm:text-sm shadow-md shadow-emerald-600/20"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>در حال ثبت سند پرداخت...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>ثبت قطعی پرداخت و صدور رسید</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
export default AdminCoachRegisterPaymentPage;
