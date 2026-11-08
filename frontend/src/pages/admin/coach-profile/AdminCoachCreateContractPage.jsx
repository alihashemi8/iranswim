import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  FileText, ArrowRight, Save, User, Calendar, DollarSign,
  Briefcase, Percent, Clock, FileUp, AlertCircle, CheckCircle2,
  Sparkles, RefreshCw, ChevronLeft, ShieldCheck, Info
} from 'lucide-react';
import api from '../../../api/client';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { CustomSelect } from '../../../components/common/CustomSelect';
import { LoadingState } from '../../../components/common/LoadingState';
import { useToast } from '../../../context/ToastContext';

export const AdminCoachCreateContractPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const renewId = searchParams.get('renew_id');
  const navigate = useNavigate();
  const toast = useToast();

  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    contract_type: 'STANDARD',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    employment_type: 'HOURLY',
    hourly_rate: 250000,
    fixed_salary: 0,
    percentage_rate: 0,
    percentage_basis: 'COURSE_GROSS',
    agreed_weekly_hours: 20,
    terms_and_conditions: '',
    internal_notes: '',
    sync_to_profile: true,
  });

  const [contractFile, setContractFile] = useState(null);

  // Fetch coach and prefill if renewing
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/coaches/${id}/`);
        const coachData = res.data;
        setCoach(coachData);

        // If renewing an existing contract, fetch that contract
        if (renewId) {
          try {
            const contractsRes = await api.get(`/coaches/${id}/contracts/`);
            const prevContract = contractsRes.data.find((c) => String(c.id) === String(renewId));
            if (prevContract) {
              const today = new Date();
              const nextYear = new Date();
              nextYear.setFullYear(today.getFullYear() + 1);

              setForm({
                contract_type: prevContract.contract_type || 'STANDARD',
                start_date: prevContract.end_date || today.toISOString().split('T')[0],
                end_date: nextYear.toISOString().split('T')[0],
                employment_type: prevContract.employment_type || coachData.employment_type || 'HOURLY',
                hourly_rate: prevContract.hourly_rate || coachData.hourly_rate || 250000,
                fixed_salary: prevContract.fixed_salary || coachData.fixed_monthly_salary || 0,
                percentage_rate: prevContract.percentage_rate || coachData.revenue_percentage || 0,
                percentage_basis: prevContract.percentage_basis || 'COURSE_GROSS',
                agreed_weekly_hours: prevContract.agreed_weekly_hours || coachData.contractual_weekly_hours || 20,
                terms_and_conditions: prevContract.terms_and_conditions || '',
                internal_notes: `تمدید قرارداد شماره ${prevContract.contract_number || prevContract.id}`,
                sync_to_profile: true,
              });
              return;
            }
          } catch (e) {
            console.error('Failed to load renewal contract details', e);
          }
        }

        // Default from coach profile
        const today = new Date();
        const nextYear = new Date();
        nextYear.setFullYear(today.getFullYear() + 1);

        setForm((prev) => ({
          ...prev,
          start_date: today.toISOString().split('T')[0],
          end_date: nextYear.toISOString().split('T')[0],
          employment_type: coachData.employment_type || 'HOURLY',
          hourly_rate: coachData.hourly_rate || 250000,
          fixed_salary: coachData.fixed_monthly_salary || 0,
          percentage_rate: coachData.revenue_percentage || 0,
          percentage_basis: coachData.percentage_revenue_basis || 'COURSE_GROSS',
          agreed_weekly_hours: coachData.contractual_weekly_hours || 20,
        }));
      } catch (err) {
        console.error('Error fetching coach details:', err);
        toast.error('خطا در دریافت اطلاعات مربی');
        navigate(`/admin/coaches/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id, renewId]);

  const handleChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.start_date || !form.end_date) {
      toast.error('تاریخ شروع و پایان قرارداد الزامی است.');
      return;
    }

    if (new Date(form.end_date) <= new Date(form.start_date)) {
      toast.error('تاریخ پایان قرارداد باید بعد از تاریخ شروع باشد.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      Object.keys(form).forEach((key) => {
        formData.append(key, form[key]);
      });
      if (contractFile) {
        formData.append('document', contractFile);
      }

      if (renewId) {
        await api.post(`/coaches/contracts/${renewId}/renew/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('قرارداد مربی با موفقیت تمدید و ثبت شد.');
      } else {
        await api.post(`/coaches/${id}/contracts/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('قرارداد جدید با موفقیت منعقد و ثبت شد.');
      }

      navigate(`/admin/coaches/${id}?tab=CONTRACTS`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت قرارداد مربی');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <LoadingState message="در حال بارگذاری اطلاعات مربی و آماده‌سازی فرم قرارداد..." />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6" dir="rtl">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
            <Link to="/admin/coaches" className="hover:text-sky-600 transition-colors">
              مدیریت مربیان
            </Link>
            <span>/</span>
            <Link to={`/admin/coaches/${id}?tab=CONTRACTS`} className="hover:text-sky-600 transition-colors">
              پرونده {coach?.full_name}
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">
              {renewId ? 'تمدید قرارداد' : 'انعقاد قرارداد جدید'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-sky-600" />
            <span>{renewId ? 'تمدید حکم و قرارداد استخدامی' : 'انعقاد قرارداد استخدامی جدید'}</span>
          </h1>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate(`/admin/coaches/${id}?tab=CONTRACTS`)}
          className="gap-2 self-start sm:self-auto text-xs sm:text-sm"
        >
          <ArrowRight className="w-4 h-4" />
          <span>انصراف و بازگشت</span>
        </Button>
      </div>

      {/* Coach Info Banner */}
      <div className="bg-gradient-to-r from-sky-50 via-white to-blue-50 border border-sky-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-sky-600/20">
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
              شماره تماس: <span className="font-mono">{coach?.phone}</span> • کد ملی: <span className="font-mono">{coach?.national_id || '---'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {renewId ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>عملیات: تمدید قرارداد فعال</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>عملیات: قرارداد حقوقی جدید</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Fields (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Contract Basics */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>مشخصات و بازه زمانی قرارداد</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نوع قرارداد <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={form.contract_type}
                  onChange={(val) => handleChange('contract_type', val)}
                  options={[
                    { value: 'STANDARD', label: 'قرارداد استاندارد همکاری' },
                    { value: 'HOURLY', label: 'قرارداد پاره‌وقت ساعتی' },
                    { value: 'COMMISSION', label: 'قرارداد درصدی / پروژه‌ای' },
                    { value: 'TRIAL', label: 'قرارداد دوره آزمایشی' },
                    { value: 'TEMPORARY', label: 'قرارداد موقت فصلی' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ساعات تعهد هفتگی (ساعت)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="80"
                    value={form.agreed_weekly_hours}
                    onChange={(e) => handleChange('agreed_weekly_hours', e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 pr-9 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  تاریخ شروع قرارداد <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  تاریخ پایان قرارداد <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => handleChange('end_date', e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Card 2: Financial & Compensation Model */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>مدل مالی و حقوق و دستمزد قرارداد</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                نوع پرداخت حقوق <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'HOURLY', title: 'حق‌التدریس ساعتی', desc: 'محاسبه بر اساس ساعات خالص تدریس' },
                  { id: 'FIXED', title: 'حقوق ماهانه ثابت', desc: 'حقوق ثابت مشخص در هر ماه' },
                  { id: 'PERCENTAGE', title: 'درصدی از شهریه', desc: 'سهم از شهریه ناخالص یا خالص دوره‌ها' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleChange('employment_type', m.id)}
                    className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
                      form.employment_type === m.id
                        ? 'border-sky-500 bg-sky-50/70 ring-1 ring-sky-500 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <p className={`text-xs font-bold ${form.employment_type === m.id ? 'text-sky-900' : 'text-slate-800'}`}>
                        {m.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">{m.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic compensation inputs */}
            {form.employment_type === 'HOURLY' && (
              <div className="bg-sky-50/50 rounded-xl p-4 border border-sky-100 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  نرخ هر ساعت تدریس (تومان) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={form.hourly_rate}
                    onChange={(e) => handleChange('hourly_rate', e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 pr-9 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                    required
                  />
                  <DollarSign className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
                <p className="text-[11px] text-slate-500">
                  معادل: <span className="font-bold text-slate-800 font-mono">{(Number(form.hourly_rate) || 0).toLocaleString('fa-IR')} تومان</span> به ازای هر ساعت تدریس تایید شده.
                </p>
              </div>
            )}

            {form.employment_type === 'FIXED' && (
              <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  حقوق ماهانه ثابت (تومان) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    value={form.fixed_salary}
                    onChange={(e) => handleChange('fixed_salary', e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 pr-9 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    required
                  />
                  <DollarSign className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
                <p className="text-[11px] text-slate-500">
                  معادل: <span className="font-bold text-slate-800 font-mono">{(Number(form.fixed_salary) || 0).toLocaleString('fa-IR')} تومان</span> حقوق پایه ماهانه.
                </p>
              </div>
            )}

            {form.employment_type === 'PERCENTAGE' && (
              <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    درصد سهم مربی از درآمد (%) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={form.percentage_rate}
                      onChange={(e) => handleChange('percentage_rate', e.target.value)}
                      className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 pr-9 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                      required
                    />
                    <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    مبنای محاسبه سهم مربی
                  </label>
                  <CustomSelect
                    value={form.percentage_basis}
                    onChange={(val) => handleChange('percentage_basis', val)}
                    options={[
                      { value: 'COURSE_GROSS', label: 'شهریه ناخالص ثبت‌نامی‌ها' },
                      { value: 'COURSE_NET', label: 'شهریه خالص پس از تخفیفات' },
                      { value: 'COLLECTED_REVENUE', label: 'مبالغ وصول شده واقعی' },
                    ]}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Terms, Notes & Upload */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <FileUp className="w-4 h-4 text-sky-600" />
              <span>مفاد، پیوست‌ها و یادداشت‌های اداری</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                مفاد، تعهدات و شرایط اختصاصی قرارداد
              </label>
              <textarea
                rows={3}
                value={form.terms_and_conditions}
                onChange={(e) => handleChange('terms_and_conditions', e.target.value)}
                placeholder="تعهدات انضباطی، شیوه محاسبه غیبت، نحوه جبران کلاس‌ها، شرایط فسخ قرارداد و..."
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 p-3 focus:ring-2 focus:ring-sky-500 focus:outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                یادداشت اداری (محرمانه مدیریت)
              </label>
              <input
                type="text"
                value={form.internal_notes}
                onChange={(e) => handleChange('internal_notes', e.target.value)}
                placeholder="یادداشت‌های محرمانه مربوط به قرارداد..."
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                تصویر یا فایل PDF قرارداد امضاشده (اختیاری)
              </label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
                <input
                  type="file"
                  id="contract-file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setContractFile(e.target.files[0] || null)}
                />
                <label htmlFor="contract-file" className="cursor-pointer flex flex-col items-center gap-2">
                  <FileUp className="w-8 h-8 text-sky-600" />
                  <span className="text-xs font-bold text-slate-800">
                    {contractFile ? contractFile.name : 'انتخاب یا رهاسازی فایل اسکن‌شده قرارداد'}
                  </span>
                  <span className="text-[11px] text-slate-400">فرمت‌های مجاز: PDF, PNG, JPG (حداکثر ۱۰ مگابایت)</span>
                </label>
              </div>
            </div>

            {/* Sync to profile checkbox */}
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.sync_to_profile}
                  onChange={(e) => handleChange('sync_to_profile', e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  همگام‌سازی خودکار مدل مالی با پروفایل اصلی مربی
                </span>
              </label>
              <p className="text-[11px] text-slate-500 mt-1 mr-6">
                در صورت فعال بودن، مدل پرداختی و نرخ جدید بلافاصله در فیش‌های حقوقی آینده اعمال می‌شود.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Live Summary & Actions */}
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 sticky top-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>خلاصه وضعیت قرارداد حقوقی</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">طرف قرارداد:</span>
                <span className="font-bold text-slate-900">{coach?.full_name}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">نوع همکاری:</span>
                <span className="font-bold text-slate-900">
                  {form.contract_type === 'STANDARD' && 'استاندارد'}
                  {form.contract_type === 'HOURLY' && 'پاره‌وقت ساعتی'}
                  {form.contract_type === 'COMMISSION' && 'درصدی'}
                  {form.contract_type === 'TRIAL' && 'آزمایشی'}
                  {form.contract_type === 'TEMPORARY' && 'موقت'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">مدل تسویه:</span>
                <Badge variant={form.employment_type === 'FIXED' ? 'success' : form.employment_type === 'PERCENTAGE' ? 'warning' : 'info'} className="text-[10px]">
                  {form.employment_type === 'HOURLY' && 'حق‌التدریس ساعتی'}
                  {form.employment_type === 'FIXED' && 'حقوق ماهیانه ثابت'}
                  {form.employment_type === 'PERCENTAGE' && 'درصدی از شهریه'}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">مبلغ پایه / نرخ:</span>
                <span className="font-bold font-mono text-slate-900">
                  {form.employment_type === 'HOURLY' && `${(Number(form.hourly_rate) || 0).toLocaleString('fa-IR')} ت/ساعت`}
                  {form.employment_type === 'FIXED' && `${(Number(form.fixed_salary) || 0).toLocaleString('fa-IR')} تومان`}
                  {form.employment_type === 'PERCENTAGE' && `${form.percentage_rate || 0}٪`}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">تاریخ شروع:</span>
                <span className="font-mono text-slate-800">{form.start_date || '---'}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">تاریخ پایان:</span>
                <span className="font-mono text-slate-800">{form.end_date || '---'}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">پیوست فیزیکی:</span>
                <span className="text-slate-800 font-bold">
                  {contractFile ? 'پیوست شد' : 'ندارد'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-xs sm:text-sm shadow-md shadow-emerald-600/20"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>در حال صدور و ثبت...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{renewId ? 'تأیید و صدور تمدید قرارداد' : 'ثبت و فعال‌سازی قرارداد'}</span>
                  </>
                )}
              </Button>
            </div>

            <div className="bg-sky-50/70 rounded-xl p-3 border border-sky-100 flex items-start gap-2 text-[11px] text-sky-800 leading-relaxed">
              <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <span>
                با ثبت این قرارداد، قرارداد قبلی مربی به وضعیت «پایان‌یافته» منتقل شده و قرارداد جدید وضعیت «فعال» را اخذ می‌نماید. سوابق قراردادهای گذشته به طور دائم حفظ می‌شوند.
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
export default AdminCoachCreateContractPage;
