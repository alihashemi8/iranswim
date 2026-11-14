import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Award, ArrowRight, Save, User, Calendar, Star, Sparkles,
  CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff, ShieldCheck,
  TrendingUp, ThumbsUp, ThumbsDown, MessageSquare
} from 'lucide-react';
import api from '../../../api/client';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { LoadingState } from '../../../components/common/LoadingState';
import { PersianDatePicker } from '../../../components/common/PersianDatePicker';
import { BackButton } from '../../../components/common/BackButton';
import { useToast } from '../../../context/ToastContext';

const CRITERIA = [
  { key: 'teaching_quality', label: 'کیفیت آموزش، تفهیم تکنیک‌ها و فن بیان' },
  { key: 'student_satisfaction', label: 'رضایت شناآموزان و اولیا از رفتار و تدریس' },
  { key: 'student_progress', label: 'میزان پیشرفت مهارتی شاگردان در پایان دوره' },
  { key: 'punctuality', label: 'نظم، انضباط و شروع و پایان سر وقت کلاس‌ها' },
  { key: 'attendance_reliability', label: 'ثبات حضور و حداقل بودن غیبت یا تاخیر' },
  { key: 'professional_conduct', label: 'اخلاق ورزشی، تعامل مثبت با همکاران و مدیریت' },
  { key: 'class_completion', label: 'تکمیل دقیق سرفصل‌ها و آزمون پایان دوره' },
  { key: 'academy_standards', label: 'رعایت پروتکل‌های بهداشتی، انضباطی و نجات‌غریق' },
];

export const AdminCoachCreateEvaluationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date();
  const [form, setForm] = useState({
    period_label: `ارزیابی دوره ${today.toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' })}`,
    evaluation_date: today.toISOString().split('T')[0],
    criteria_ratings: {
      teaching_quality: 5,
      student_satisfaction: 5,
      student_progress: 5,
      punctuality: 5,
      attendance_reliability: 5,
      professional_conduct: 5,
      class_completion: 5,
      academy_standards: 5,
    },
    strengths: '',
    weaknesses: '',
    recommendations: '',
    general_feedback: '',
    is_shared_with_coach: true,
  });

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

  const handleRatingChange = (key, val) => {
    setForm((prev) => ({
      ...prev,
      criteria_ratings: {
        ...prev.criteria_ratings,
        [key]: Number(val),
      },
    }));
  };

  const calculateOverall = (ratings) => {
    const vals = Object.values(ratings).map(Number);
    if (!vals.length) return 5;
    const sum = vals.reduce((a, b) => a + b, 0);
    return (sum / vals.length).toFixed(2);
  };

  const overallScore = calculateOverall(form.criteria_ratings);

  const getScoreGrade = (score) => {
    const num = Number(score);
    if (num >= 4.5) return { label: 'عالی و ممتاز', color: 'emerald', badge: 'success' };
    if (num >= 3.8) return { label: 'بسیار خوب و فراتر از انتظار', color: 'sky', badge: 'info' };
    if (num >= 3.0) return { label: 'خوب و در حد استاندارد', color: 'amber', badge: 'warning' };
    return { label: 'نیازمند ارتقا و بهبود', color: 'rose', badge: 'danger' };
  };

  const grade = getScoreGrade(overallScore);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      await api.post(`/coaches/${id}/evaluations/`, {
        ...form,
        overall_score: overallScore,
      });

      toast.success('فرم ارزیابی عملکرد مربی با موفقیت ثبت گردید.');
      navigate(`/admin/coaches/${id}?tab=EVALUATION_AND_RECORDS`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت ارزیابی مربی');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <LoadingState message="در حال آماده‌سازی سامانه ارزیابی عملکرد..." />
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
            <span className="text-slate-800 font-semibold shrink-0">ثبت فرم ارزیابی عملکرد</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5 truncate">
            <Award className="w-6 h-6 text-sky-600 shrink-0" />
            <span>ثبت ارزیابی جامع عملکرد مربی</span>
          </h1>
        </div>
      </div>

      {/* Coach Banner */}
      <div className="bg-gradient-to-r from-sky-50 via-white to-amber-50 border border-sky-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-amber-500/20">
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
              سابقه: <span className="font-mono font-bold text-slate-800">{coach?.years_of_experience || 0} سال</span> • درجه: {coach?.coaching_degree_display || coach?.coaching_degree || 'درجه ۳'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 shadow-xs flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>امتیاز زنده: </span>
            <span className="font-black text-slate-900 font-mono text-sm">{overallScore} از ۵</span>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Period Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>مشخصات دوره ارزیابی</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  عنوان یا بازه ارزیابی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.period_label}
                  onChange={(e) => setForm({ ...form, period_label: e.target.value })}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <PersianDatePicker
                  label="تاریخ ثبت ارزیابی *"
                  value={form.evaluation_date}
                  onChange={(jalaliStr, gDate, gIso) => setForm({ ...form, evaluation_date: gIso || '' })}
                  placeholder="انتخاب تاریخ ارزیابی..."
                  color="sky"
                  size="md"
                  required
                />
              </div>
            </div>
          </div>

          {/* Card 2: 8 Criteria Sliders */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>امتیازدهی به معیارهای استاندارد آکادمی (۱ تا ۵)</span>
            </h3>

            <div className="space-y-4">
              {CRITERIA.map((criterion, idx) => {
                const currentVal = form.criteria_ratings[criterion.key] || 5;
                return (
                  <div key={criterion.key} className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">
                        {idx + 1}. {criterion.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-amber-600 text-sm">{currentVal}</span>
                        <span className="text-slate-400">از ۵</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={currentVal}
                        onChange={(e) => handleRatingChange(criterion.key, e.target.value)}
                        className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: Qualitative Feedback */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <MessageSquare className="w-4 h-4 text-sky-600" />
              <span>بازخورد تشریحی و توصیه‌های مدیریتی</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>نقاط قوت برجسته مربی</span>
              </label>
              <textarea
                rows={2}
                value={form.strengths}
                onChange={(e) => setForm({ ...form, strengths: e.target.value })}
                placeholder="ارتباط عالی با کودکان، تکنیک بالا در آموزش کرال سینه، نظم کامل در تایم کلاس..."
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 p-3 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <ThumbsDown className="w-3.5 h-3.5 text-rose-500" />
                <span>حوزه‌های نیازمند بهبود و تقویت</span>
              </label>
              <textarea
                rows={2}
                value={form.weaknesses}
                onChange={(e) => setForm({ ...form, weaknesses: e.target.value })}
                placeholder="ثبت سریع‌تر حضور و غیاب، هماهنگی بیشتر با سرپرست استخر..."
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 p-3 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                پیشنهادات توسعه فردی و دوره‌های آموزشی پیشنهادی
              </label>
              <input
                type="text"
                value={form.recommendations}
                onChange={(e) => setForm({ ...form, recommendations: e.target.value })}
                placeholder="شرکت در کارگاه اصلاح تکنیک کرال پشت، تمدید کارت بازآموزی نجات‌غریق..."
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                جمع‌بندی نهایی ارزیاب
              </label>
              <textarea
                rows={2}
                value={form.general_feedback}
                onChange={(e) => setForm({ ...form, general_feedback: e.target.value })}
                placeholder="نتیجه‌گیری و بازخورد جامع مدیریت آموزشگاه..."
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 p-3 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_shared_with_coach}
                  onChange={(e) => setForm({ ...form, is_shared_with_coach: e.target.checked })}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  قابلیت مشاهده این ارزیابی و بازخوردها در پنل کاربری اختصاصی مربی
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Live Score & Action */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 sticky top-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>نتیجه زنده ارزیابی</span>
            </h3>

            <div className="text-center py-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
              <span className="text-xs text-slate-500">میانگین امتیاز کل</span>
              <div className="text-3xl font-black font-mono text-slate-900">
                {overallScore} <span className="text-sm font-normal text-slate-400">از ۵</span>
              </div>
              <div>
                <Badge variant={grade.badge} className="text-xs">
                  {grade.label}
                </Badge>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">مربی:</span>
                <span className="font-bold text-slate-900">{coach?.full_name}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">تاریخ ارزیابی:</span>
                <span className="font-mono text-slate-800">{form.evaluation_date}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">مشاهده برای مربی:</span>
                <span className="font-bold text-slate-800">
                  {form.is_shared_with_coach ? 'فعال (مشاهده در پنل)' : 'محرمانه مدیریت'}
                </span>
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
                  <span>در حال ذخیره ارزیابی...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>ثبت نهایی فرم ارزیابی</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
export default AdminCoachCreateEvaluationPage;
