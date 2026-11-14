import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText, ArrowRight, Save, User, Calendar, AlertTriangle,
  Award, ShieldAlert, FileUp, EyeOff, CheckCircle2, RefreshCw,
  ChevronLeft, ShieldCheck, Info
} from 'lucide-react';
import api from '../../../api/client';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { CustomSelect } from '../../../components/common/CustomSelect';
import { PersianDatePicker } from '../../../components/common/PersianDatePicker';
import { LoadingState } from '../../../components/common/LoadingState';
import { BackButton } from '../../../components/common/BackButton';
import { useToast } from '../../../context/ToastContext';

export const AdminCoachCreateNotePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    category: 'NOTE',
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    severity: 'INFO',
    is_confidential: false,
  });

  const [attachmentFile, setAttachmentFile] = useState(null);

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error('عنوان یا موضوع مکاتبه الزامی است.');
      return;
    }

    if (!form.description.trim()) {
      toast.error('شرح و متن کامل مکاتبه یا گزارش الزامی است.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('category', form.category);
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());
      formData.append('date', form.date);
      formData.append('severity', form.severity);
      formData.append('is_confidential', form.is_confidential);
      if (attachmentFile) formData.append('attachment', attachmentFile);

      await api.post(`/coaches/${id}/administrative-notes/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('سند اداری با موفقیت در پرونده پرسنلی ثبت گردید.');
      navigate(`/admin/coaches/${id}?tab=EVALUATION_AND_RECORDS`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت یادداشت اداری');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <LoadingState message="در حال آماده‌سازی سامانه مکاتبات و پرونده اداری..." />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6" dir="rtl">
      {/* Header & Breadcrumb */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <BackButton to={`/admin/coaches/${id}?tab=EVALUATION_AND_RECORDS`} fallback={`/admin/coaches/${id}`} title="بازگشت به پرونده مربی" />
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 truncate">
            <Link to="/admin/coaches" className="hover:text-sky-600 transition-colors shrink-0">
              مدیریت مربیان
            </Link>
            <span>/</span>
            <Link to={`/admin/coaches/${id}?tab=EVALUATION_AND_RECORDS`} className="hover:text-sky-600 transition-colors shrink-0 truncate">
              پرونده {coach?.full_name}
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold shrink-0">ثبت مکاتبه یا یادداشت اداری</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5 truncate">
            <FileText className="w-6 h-6 text-sky-600 shrink-0" />
            <span>ثبت مکاتبه اداری، اخطار یا تشویق‌نامه</span>
          </h1>
        </div>
      </div>

      {/* Coach Banner */}
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
              وضعیت: <span className="font-bold text-slate-800">{coach?.employment_status}</span>
            </p>
          </div>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
          بخش پرونده: <span className="font-bold text-slate-900">ارزیابی و سوابق اداری</span>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <FileText className="w-4 h-4 text-sky-600" />
              <span>مشخصات و محتوای سند اداری</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  دسته‌بندی موضوع <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={form.category}
                  onChange={(val) => handleChange('category', val)}
                  options={[
                    { value: 'NOTE', label: 'یادداشت عمومی پرونده' },
                    { value: 'WARNING', label: 'تذکر انضباطی' },
                    { value: 'REPRIMAND', label: 'اخطار کتبی و توبیخ' },
                    { value: 'COMMENDATION', label: 'تشویق و تقدیرنامه' },
                    { value: 'INCIDENT', label: 'گزارش سانحه یا حادثه' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  سطح اهمیت / حساسیت <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={form.severity}
                  onChange={(val) => handleChange('severity', val)}
                  options={[
                    { value: 'INFO', label: 'عادی / اطلاع‌رسانی' },
                    { value: 'LOW', label: 'پایین' },
                    { value: 'MEDIUM', label: 'متوسط' },
                    { value: 'HIGH', label: 'بالا' },
                    { value: 'CRITICAL', label: 'بحرانی و اضطراری' },
                  ]}
                />
              </div>

              <div>
                <PersianDatePicker
                  label="تاریخ وقوع یا صدور *"
                  value={form.date}
                  onChange={(jalaliStr, gDate, gIso) => handleChange('date', gIso || '')}
                  placeholder="انتخاب تاریخ..."
                  color="sky"
                  size="md"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                عنوان یا موضوع مکاتبه <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="مثال: تقدیرنامه عملکرد درخشان مسابقات استانی، تذکر تاخیر در شروع کلاس..."
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                متن کامل و شرح رویداد <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="شرح جزئیات، اقدامات صورت گرفته، افراد حاضر و تصمیمات متخذه..."
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 p-3 focus:ring-2 focus:ring-sky-500 focus:outline-none leading-relaxed"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                فایل یا سند ضمیمه (اختیاری)
              </label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
                <input
                  type="file"
                  id="note-attachment"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setAttachmentFile(e.target.files[0] || null)}
                />
                <label htmlFor="note-attachment" className="cursor-pointer flex flex-col items-center gap-1.5">
                  <FileUp className="w-8 h-8 text-sky-600" />
                  <span className="text-xs font-bold text-slate-800">
                    {attachmentFile ? attachmentFile.name : 'انتخاب نامه، صورت‌جلسه یا عکس سند (عکس یا PDF)'}
                  </span>
                  <span className="text-[11px] text-slate-400">حداکثر ۱۰ مگابایت</span>
                </label>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_confidential}
                  onChange={(e) => handleChange('is_confidential', e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  سند کاملاً محرمانه (تنها قابل مشاهده برای مدیریت ارشد)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 sticky top-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>خلاصه مشخصات مکاتبه</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">مربی:</span>
                <span className="font-bold text-slate-900">{coach?.full_name}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">نوع سند:</span>
                <Badge variant={form.category === 'COMMENDATION' ? 'success' : form.category === 'REPRIMAND' || form.category === 'INCIDENT' ? 'danger' : form.category === 'WARNING' ? 'warning' : 'info'} className="text-[10px]">
                  {form.category === 'NOTE' && 'یادداشت اداری'}
                  {form.category === 'WARNING' && 'تذکر'}
                  {form.category === 'REPRIMAND' && 'توبیخ و اخطار'}
                  {form.category === 'COMMENDATION' && 'تشویق‌نامه'}
                  {form.category === 'INCIDENT' && 'گزارش حادثه'}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">سطح اهمیت:</span>
                <span className="font-bold text-slate-800">
                  {form.severity === 'CRITICAL' && 'بحرانی'}
                  {form.severity === 'HIGH' && 'بالا'}
                  {form.severity === 'MEDIUM' && 'متوسط'}
                  {form.severity === 'LOW' && 'پایین'}
                  {form.severity === 'INFO' && 'عادی'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">سطح محرمانگی:</span>
                <span className="font-bold text-slate-800">
                  {form.is_confidential ? 'محرمانه مدیریت' : 'عادی'}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full gap-2 bg-sky-600 hover:bg-sky-700 text-white py-2.5 text-xs sm:text-sm shadow-md shadow-sky-600/20"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>در حال ثبت در پرونده...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>ثبت و الصاق به پرونده پرسنلی</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
export default AdminCoachCreateNotePage;
