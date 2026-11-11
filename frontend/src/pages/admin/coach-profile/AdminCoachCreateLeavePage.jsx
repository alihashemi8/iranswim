import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar, ArrowRight, Save, User, Clock, FileUp,
  AlertCircle, CheckCircle2, RefreshCw, FileText, ChevronLeft,
  ShieldCheck, AlertTriangle
} from 'lucide-react';
import api from '../../../api/client';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { CustomSelect } from '../../../components/common/CustomSelect';
import { LoadingState } from '../../../components/common/LoadingState';
import { BackButton } from '../../../components/common/BackButton';
import { useToast } from '../../../context/ToastContext';

export const AdminCoachCreateLeavePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    leave_type: 'CASUAL',
    start_date: todayStr,
    end_date: todayStr,
    hours_requested: 0,
    reason: '',
  });

  const [leaveDoc, setLeaveDoc] = useState(null);

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

  const isHourly = form.leave_type === 'HOURLY';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.start_date || !form.end_date) {
      toast.error('تاریخ شروع و پایان مرخصی الزامی است.');
      return;
    }

    if (new Date(form.end_date) < new Date(form.start_date)) {
      toast.error('تاریخ پایان مرخصی نمی‌تواند قبل از تاریخ شروع باشد.');
      return;
    }

    if (!form.reason.trim()) {
      toast.error('ثبت علت یا شرح مرخصی الزامی است.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('leave_type', form.leave_type);
      formData.append('start_date', form.start_date);
      formData.append('end_date', form.end_date);
      formData.append('hours_requested', form.hours_requested || 0);
      formData.append('reason', form.reason.trim());
      if (leaveDoc) formData.append('document', leaveDoc);

      await api.post(`/coaches/${id}/leave-requests/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('درخواست مرخصی با موفقیت ثبت شد.');
      navigate(`/admin/coaches/${id}?tab=WORK_AND_LEAVES`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت درخواست مرخصی');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <LoadingState message="در حال بارگذاری سامانه ثبت مرخصی..." />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6" dir="rtl">
      {/* Header & Breadcrumb */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <BackButton to={`/admin/coaches/${id}?tab=WORK_AND_LEAVES`} fallback={`/admin/coaches/${id}`} title="بازگشت به پرونده مربی" />
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 truncate">
            <Link to="/admin/coaches" className="hover:text-sky-600 transition-colors shrink-0">
              مدیریت مربیان
            </Link>
            <span>/</span>
            <Link to={`/admin/coaches/${id}?tab=WORK_AND_LEAVES`} className="hover:text-sky-600 transition-colors shrink-0 truncate">
              پرونده {coach?.full_name}
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold shrink-0">ثبت درخواست مرخصی</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5 truncate">
            <Calendar className="w-6 h-6 text-sky-600 shrink-0" />
            <span>ثبت درخواست مرخصی جدید</span>
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
              وضعیت استخدامی: <span className="font-bold text-slate-800">{coach?.employment_status}</span>
            </p>
          </div>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
          بخش پرونده: <span className="font-bold text-slate-900">کارکرد و مرخصی‌ها</span>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>مشخصات و زمان‌بندی مرخصی</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نوع مرخصی <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={form.leave_type}
                  onChange={(val) => handleChange('leave_type', val)}
                  options={[
                    { value: 'CASUAL', label: 'مرخصی استحقاقی (روزانه)' },
                    { value: 'SICK', label: 'مرخصی استعلاجی / پزشکی' },
                    { value: 'HOURLY', label: 'مرخصی ساعتی' },
                    { value: 'EMERGENCY', label: 'مرخصی اضطراری' },
                    { value: 'UNPAID', label: 'مرخصی بدون حقوق' },
                  ]}
                />
              </div>

              {isHourly ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    تعداد ساعات مرخصی <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={form.hours_requested}
                      onChange={(e) => handleChange('hours_requested', e.target.value)}
                      className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2.5 pr-9 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                      required
                    />
                    <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ساعت مورد نیاز (اختیاری)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={form.hours_requested}
                      onChange={(e) => handleChange('hours_requested', e.target.value)}
                      placeholder="در صورت نیاز به ثبت ساعت..."
                      className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2.5 pr-9 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                    />
                    <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  تاریخ شروع مرخصی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  تاریخ پایان مرخصی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => handleChange('end_date', e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                علت و شرح مرخصی <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={form.reason}
                onChange={(e) => handleChange('reason', e.target.value)}
                placeholder="توضیح کامل در مورد ضرورت مرخصی، هماهنگی‌های لازم با کلاس‌ها یا مربی جانشین..."
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 p-3 focus:ring-2 focus:ring-sky-500 focus:outline-none leading-relaxed"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                پیوست مدارک (گواهی پزشکی، بلیت، سند موجه‌ساز اختیاری)
              </label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
                <input
                  type="file"
                  id="leave-doc"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setLeaveDoc(e.target.files[0] || null)}
                />
                <label htmlFor="leave-doc" className="cursor-pointer flex flex-col items-center gap-1.5">
                  <FileUp className="w-8 h-8 text-sky-600" />
                  <span className="text-xs font-bold text-slate-800">
                    {leaveDoc ? leaveDoc.name : 'انتخاب مدرک ضمیمه (عکس یا PDF)'}
                  </span>
                  <span className="text-[11px] text-slate-400">حداکثر ۱۰ مگابایت</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 sticky top-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>خلاصه درخواست مرخصی</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">متقاضی:</span>
                <span className="font-bold text-slate-900">{coach?.full_name}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">نوع مرخصی:</span>
                <Badge variant={form.leave_type === 'SICK' ? 'danger' : form.leave_type === 'UNPAID' ? 'warning' : 'info'} className="text-[10px]">
                  {form.leave_type === 'CASUAL' && 'استحقاقی'}
                  {form.leave_type === 'SICK' && 'استعلاجی'}
                  {form.leave_type === 'HOURLY' && 'ساعتی'}
                  {form.leave_type === 'EMERGENCY' && 'اضطراری'}
                  {form.leave_type === 'UNPAID' && 'بدون حقوق'}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">از تاریخ:</span>
                <span className="font-mono text-slate-800">{form.start_date || '---'}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">تا تاریخ:</span>
                <span className="font-mono text-slate-800">{form.end_date || '---'}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">سند ضمیمه:</span>
                <span className="font-bold text-slate-800">
                  {leaveDoc ? 'پیوست دارد' : 'ندارد'}
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
                  <span>در حال ثبت درخواست...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>ثبت و ارسال به کارتابل مدیریت</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
export default AdminCoachCreateLeavePage;
