import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Award, ArrowRight, Save, User, Calendar, FileUp,
  Hash, Building, FileText, CheckCircle2, AlertCircle,
  RefreshCw, Sparkles, ShieldCheck
} from 'lucide-react';
import api from '../../../api/client';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { LoadingState } from '../../../components/common/LoadingState';
import { BackButton } from '../../../components/common/BackButton';
import { useToast } from '../../../context/ToastContext';

export const AdminCoachAddCertificatePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    issuing_organization: '',
    certificate_number: '',
    issue_date: '',
    expiration_date: '',
    notes: '',
  });

  const [certFile, setCertFile] = useState(null);

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

  const isExpired = form.expiration_date && new Date(form.expiration_date) < new Date();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error('عنوان مدرک یا گواهینامه الزامی است.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('title', form.title.trim());
      if (form.issuing_organization) formData.append('issuing_organization', form.issuing_organization.trim());
      if (form.certificate_number) formData.append('certificate_number', form.certificate_number.trim());
      if (form.issue_date) formData.append('issue_date', form.issue_date);
      if (form.expiration_date) formData.append('expiration_date', form.expiration_date);
      if (form.notes) formData.append('notes', form.notes.trim());
      if (certFile) formData.append('file', certFile);

      await api.post(`/coaches/${id}/certificates/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('مدرک با موفقیت در پرونده مربی ثبت شد.');
      navigate(`/admin/coaches/${id}?tab=INFO`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت مدرک مربی');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <LoadingState message="در حال بارگذاری پرونده مربی..." />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6" dir="rtl">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <BackButton to={`/admin/coaches/${id}?tab=INFO`} fallback={`/admin/coaches/${id}`} title="بازگشت به پرونده مربی" />
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 truncate">
            <Link to="/admin/coaches" className="hover:text-sky-600 transition-colors shrink-0">
              مدیریت مربیان
            </Link>
            <span>/</span>
            <Link to={`/admin/coaches/${id}?tab=INFO`} className="hover:text-sky-600 transition-colors shrink-0 truncate">
              پرونده {coach?.full_name}
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold shrink-0">ثبت مدرک و گواهینامه جدید</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5 truncate">
            <Award className="w-6 h-6 text-sky-600 shrink-0" />
            <span>ثبت مدرک، گواهینامه یا حکم قهرمانی</span>
          </h1>
        </div>
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
              تخصص‌ها: {coach?.specialties || 'تعیین‌نشده'}
            </p>
          </div>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
          بخش پرونده: <span className="font-bold text-slate-900">مشخصات، مدارک و سوابق</span>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Award className="w-4 h-4 text-sky-600" />
              <span>اطلاعات گواهی یا مدرک فنی</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  عنوان مدرک یا گواهینامه <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="مثال: مربیگری درجه ۲ شنا، نجات‌غریق بین‌المللی ILS، هیدروتراپی"
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  مرجع یا فدراسیون صادرکننده
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.issuing_organization}
                    onChange={(e) => handleChange('issuing_organization', e.target.value)}
                    placeholder="فدراسیون شنا / نجات‌غریق"
                    className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2.5 pr-9 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <Building className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  شماره حکم یا گواهینامه
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.certificate_number}
                    onChange={(e) => handleChange('certificate_number', e.target.value)}
                    placeholder="IRN-SWIM-84729"
                    className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2.5 pr-9 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                  <Hash className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  تاریخ اخذ / صدور
                </label>
                <input
                  type="date"
                  value={form.issue_date}
                  onChange={(e) => handleChange('issue_date', e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  تاریخ انقضا یا تمدید (اختیاری)
                </label>
                <input
                  type="date"
                  value={form.expiration_date}
                  onChange={(e) => handleChange('expiration_date', e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                توضیحات و سوابق پیوست این مدرک
              </label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="توضیحات تکمیلی پیرامون ساعات دوره، رتبه قبولی، شرایط تمدید..."
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 p-3 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                تصویر یا اسکن فایل مدرک
              </label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
                <input
                  type="file"
                  id="cert-file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setCertFile(e.target.files[0] || null)}
                />
                <label htmlFor="cert-file" className="cursor-pointer flex flex-col items-center gap-1.5">
                  <FileUp className="w-8 h-8 text-sky-600" />
                  <span className="text-xs font-bold text-slate-800">
                    {certFile ? certFile.name : 'انتخاب تصویر اسکن‌شده مدرک (عکس یا PDF)'}
                  </span>
                  <span className="text-[11px] text-slate-400">فرمت‌های مجاز: JPG, PNG, PDF (حداکثر ۱۰ مگابایت)</span>
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
              <span>بررسی و وضعیت اعتبار مدرک</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">عنوان:</span>
                <span className="font-bold text-slate-900 truncate max-w-[140px]">
                  {form.title || 'هنوز ثبت نشده'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">مرجع صادرکننده:</span>
                <span className="font-bold text-slate-800">
                  {form.issuing_organization || '---'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">وضعیت انقضا:</span>
                {form.expiration_date ? (
                  isExpired ? (
                    <Badge variant="danger" className="text-[10px]">منقضی‌شده</Badge>
                  ) : (
                    <Badge variant="success" className="text-[10px]">دارای اعتبار رسمی</Badge>
                  )
                ) : (
                  <Badge variant="default" className="text-[10px]">بدون محدودیت زمانی</Badge>
                )}
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">فایل ضمیمه:</span>
                <span className="font-bold text-slate-800">
                  {certFile ? 'انتخاب شده' : 'ندارد'}
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
                  <span>در حال ذخیره و اعتبارسنجی...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>ثبت و الصاق به پرونده مربی</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
export default AdminCoachAddCertificatePage;
