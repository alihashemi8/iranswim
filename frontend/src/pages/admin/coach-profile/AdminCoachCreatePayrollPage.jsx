import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CreditCard, ArrowRight, Save, User, Calendar, DollarSign,
  Briefcase, Clock, AlertCircle, CheckCircle2, Sparkles, RefreshCw,
  Calculator, Check, FileCheck2, Info, ChevronLeft, ShieldCheck
} from 'lucide-react';
import api from '../../../api/client';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { LoadingState } from '../../../components/common/LoadingState';
import { PersianDatePicker } from '../../../components/common/PersianDatePicker';
import { BackButton } from '../../../components/common/BackButton';
import { useToast } from '../../../context/ToastContext';

export const AdminCoachCreatePayrollPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculatingPreview, setCalculatingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Default dates: current Persian month approx or 30 days window
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [form, setForm] = useState({
    period_start: firstDayOfMonth,
    period_end: lastDayOfMonth,
    period_label: `حقوق دوره ${today.toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' })}`,
    notes: '',
  });

  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    const fetchCoach = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/coaches/${id}/`);
        setCoach(res.data);
      } catch (err) {
        console.error(err);
        toast.error('خطا در دریافت اطلاعات مربی');
        navigate(`/admin/coaches/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCoach();
  }, [id]);

  const handleChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    // Clear preview if period dates changed
    if (field === 'period_start' || field === 'period_end') {
      setPreviewData(null);
    }
  };

  // Preview Payroll Calculation
  const handleCalculatePreview = async () => {
    if (!form.period_start || !form.period_end) {
      toast.error('لطفاً بازه زمانی شروع و پایان دوره حقوق را تعیین کنید.');
      return;
    }

    if (new Date(form.period_end) < new Date(form.period_start)) {
      toast.error('تاریخ پایان دوره نمی‌تواند قبل از تاریخ شروع باشد.');
      return;
    }

    try {
      setCalculatingPreview(true);
      const res = await api.post(`/coaches/${id}/payrolls/`, {
        ...form,
        preview_only: true,
      });
      setPreviewData(res.data);
      toast.success('پیش‌محاسبه کارکرد و حقوق با موفقیت استخراج شد.');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در محاسبه مقدماتی حقوق دوره');
    } finally {
      setCalculatingPreview(false);
    }
  };

  // Submit and Issue Official Payroll
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.period_start || !form.period_end) {
      toast.error('بازه زمانی دوره حقوق الزامی است.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/coaches/${id}/payrolls/`, {
        ...form,
        preview_only: false,
      });

      toast.success('فیش حقوقی دوره جدید با موفقیت صادر و ثبت شد.');
      navigate(`/admin/coaches/${id}?tab=PAYROLL`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در صدور فیش حقوقی');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <LoadingState message="در حال بارگذاری اطلاعات مربی و سامانه حقوق و دستمزد..." />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6" dir="rtl">
      {/* Header & Breadcrumbs */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <BackButton to={`/admin/coaches/${id}?tab=PAYROLL`} fallback={`/admin/coaches/${id}`} title="بازگشت به پرونده مربی" />
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 truncate">
            <Link to="/admin/coaches" className="hover:text-sky-600 transition-colors shrink-0">
              مدیریت مربیان
            </Link>
            <span>/</span>
            <Link to={`/admin/coaches/${id}?tab=PAYROLL`} className="hover:text-sky-600 transition-colors shrink-0 truncate">
              پرونده {coach?.full_name}
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold shrink-0">صدور فیش حقوقی جدید</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5 truncate">
            <CreditCard className="w-6 h-6 text-sky-600 shrink-0" />
            <span>محاسبه و صدور فیش حقوقی دوره جدید</span>
          </h1>
        </div>
      </div>

      {/* Coach Info Banner */}
      <div className="bg-gradient-to-r from-sky-50 via-white to-indigo-50 border border-sky-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-indigo-600/20">
            {coach?.full_name ? coach.full_name[0] : 'م'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">{coach?.full_name}</h2>
              <Badge variant="info" className="text-xs">
                کد پرسنلی: {coach?.personnel_id || coach?.id}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              مدل قرارداد فعال: <span className="font-bold text-slate-800">
                {coach?.employment_type === 'HOURLY' && 'ساعتی (حق‌التدریس جلسات)'}
                {coach?.employment_type === 'FIXED' && 'حقوق ماهیانه ثابت'}
                {coach?.employment_type === 'PERCENTAGE' && 'درصدی از شهریه دوره‌ها'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 shadow-xs">
            <span className="text-slate-400">نرخ مبنا: </span>
            <span className="font-bold font-mono text-slate-900">
              {coach?.employment_type === 'HOURLY' && `${(Number(coach.hourly_rate) || 0).toLocaleString('fa-IR')} ت/ساعت`}
              {coach?.employment_type === 'FIXED' && `${(Number(coach.fixed_monthly_salary) || 0).toLocaleString('fa-IR')} تومان/ماه`}
              {coach?.employment_type === 'PERCENTAGE' && `${coach.revenue_percentage || 0}٪`}
            </span>
          </div>
        </div>
      </div>

      {/* Period Selection & Calculation Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>تنظیم بازه زمانی دوره محاسبه کارکرد</span>
            </h3>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCalculatePreview}
              disabled={calculatingPreview}
              className="gap-2 text-sky-700 border-sky-300 hover:bg-sky-50 text-xs"
            >
              {calculatingPreview ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>در حال استخراج کارکرد و جلسات...</span>
                </>
              ) : (
                <>
                  <Calculator className="w-3.5 h-3.5 text-sky-600" />
                  <span>پیش‌محاسبه خودکار کارکرد و حقوق</span>
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                عنوان دوره حقوق <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.period_label}
                onChange={(e) => handleChange('period_label', e.target.value)}
                placeholder="مثال: حقوق و دستمزد دی‌ماه ۱۴۰۳"
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <PersianDatePicker
                label="تاریخ شروع دوره *"
                value={form.period_start}
                onChange={(jalaliStr, gDate, gIso) => handleChange('period_start', gIso || '')}
                placeholder="انتخاب شروع دوره..."
                color="sky"
                size="md"
                required
              />
            </div>

            <div>
              <PersianDatePicker
                label="تاریخ پایان دوره *"
                value={form.period_end}
                onChange={(jalaliStr, gDate, gIso) => handleChange('period_end', gIso || '')}
                placeholder="انتخاب پایان دوره..."
                color="sky"
                size="md"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              یادداشت و توضیحات حسابداری دوره
            </label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="توضیحات اختیاری درباره ساعات خاص، مرخصی‌ها یا پاداش‌های این دوره..."
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Live Preview Display */}
        {previewData ? (
          <div className="bg-white rounded-2xl border-2 border-sky-400 p-5 sm:p-6 shadow-md space-y-5 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sky-800 font-bold text-sm">
                <FileCheck2 className="w-5 h-5 text-sky-600" />
                <span>نتیجه پیش‌محاسبه خودکار کارکرد بر اساس دفاتر حضور و غیاب</span>
              </div>
              <Badge variant="success" className="text-xs">
                استخراج زنده با موفقیت انجام شد
              </Badge>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 block">ساعات تایید شده</span>
                <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                  {previewData.approved_teaching_hours || 0} ساعت
                </span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 block">تعداد جلسات انجام‌شده</span>
                <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                  {previewData.completed_sessions || 0} جلسه
                </span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 block">مبلغ پایه محاسبه‌شده</span>
                <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                  {(Number(previewData.base_compensation) || 0).toLocaleString('fa-IR')} ت
                </span>
              </div>
              <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
                <span className="text-[11px] text-emerald-700 font-bold block">مبلغ خالص قابل پرداخت</span>
                <span className="text-base sm:text-lg font-black text-emerald-800 font-mono">
                  {(Number(previewData.final_payable) || 0).toLocaleString('fa-IR')} ت
                </span>
              </div>
            </div>

            {/* Breakdown Detail */}
            <div className="bg-slate-50/60 rounded-xl p-4 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-600">نرخ مبنای اعمال‌شده در قرارداد:</span>
                <span className="font-mono font-bold text-slate-800">
                  {(Number(previewData.applied_rate) || 0).toLocaleString('fa-IR')} تومان
                </span>
              </div>
              {Number(previewData.total_bonuses) > 0 && (
                <div className="flex justify-between items-center py-1 text-emerald-700">
                  <span>مجموع پاداش‌ها و اضافه کار:</span>
                  <span className="font-mono font-bold">
                    +{(Number(previewData.total_bonuses) || 0).toLocaleString('fa-IR')} تومان
                  </span>
                </div>
              )}
              {Number(previewData.total_deductions) > 0 && (
                <div className="flex justify-between items-center py-1 text-rose-700">
                  <span>مجموع کسورات و غیبت‌ها:</span>
                  <span className="font-mono font-bold">
                    -{(Number(previewData.total_deductions) || 0).toLocaleString('fa-IR')} تومان
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                <span>خالص نهایی صدور فیش:</span>
                <span className="font-mono text-emerald-700 text-base">
                  {(Number(previewData.final_payable) || 0).toLocaleString('fa-IR')} تومان
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-2">
            <Calculator className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs sm:text-sm font-bold text-slate-700">
              هنوز پیش‌محاسبه‌ای انجام نشده است
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              با کلیک روی دکمه «پیش‌محاسبه خودکار کارکرد و حقوق»، ساعات ثبت‌شده در حضور و غیاب مربی در این بازه استخراج و مبلغ دقیق قبل از صدور نهایی محاسبه می‌گردد.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/admin/coaches/${id}?tab=PAYROLL`)}
            disabled={submitting}
          >
            انصراف
          </Button>

          <Button
            type="submit"
            disabled={submitting}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 py-2.5 px-6"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>در حال صدور فیش رسمی...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>تأیید و صدور رسمی فیش حقوقی دوره</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
export default AdminCoachCreatePayrollPage;
