import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, ArrowRight, ArrowLeft, MapPin, Clock, Calendar,
  GraduationCap, Users, Check, CheckCircle2, Award,
  Sparkles, DollarSign, Layers, Search, User, ChevronLeft, AlertCircle
} from 'lucide-react';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { CustomSelect } from '../../components/common/CustomSelect';
import { PersianDatePicker, toJalaliString, formatJalaliReadable } from '../../components/common/PersianDatePicker';
import { Time24Picker } from '../../components/common/Time24Picker';
import { useToast } from '../../context/ToastContext';

const STEPS = [
  { id: 1, title: 'مشخصات عمومی و سرفصل‌ها', subtitle: 'عنوان، جنسیت، رده سنی و توضیحات', icon: BookOpen },
  { id: 2, title: 'محل برگزاری و زمان‌بندی', subtitle: 'استخر، روزهای هفته و ساعات جلسات', icon: MapPin },
  { id: 3, title: 'کادر مربیان دوره آموزشی', subtitle: 'تعیین مربیان و تفکیک خودکار کلاس‌ها', icon: GraduationCap },
  { id: 4, title: 'امور مالی و شهریه ثبت‌نام', subtitle: 'شهریه هر شناگر و مرور نهایی دوره', icon: DollarSign },
];

export const AdminCreateCoursePage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [coaches, setCoaches] = useState([]);
  const [loadingCoaches, setLoadingCoaches] = useState(true);
  const [coachSearch, setCoachSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    gender: 'MALE',
    age_range: '',
    pool_location: 'استخر شهید رئیسی',
    days_of_week: 'سه‌شنبه و پنج‌شنبه',
    start_time: '17:00',
    end_time: '19:00',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
    base_price: '1500000',
    sessions_count: 12,
    status: 'ACTIVE',
    what_you_learn: '',
    description: '',
    coach_ids: [],
  });

  // Fetch coaches
  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        setLoadingCoaches(true);
        const res = await api.get('/coaches/');
        setCoaches(res.data.results || res.data || []);
      } catch (err) {
        console.error(err);
        toast.error('خطا در دریافت لیست کادر مربیان');
      } finally {
        setLoadingCoaches(false);
      }
    };
    fetchCoaches();
  }, []);

  const toggleCoach = (coachId) => {
    setFormData((prev) => {
      const exists = prev.coach_ids.includes(coachId);
      const next = exists
        ? prev.coach_ids.filter((id) => id !== coachId)
        : [...prev.coach_ids, coachId];
      return { ...prev, coach_ids: next };
    });
  };

  const toggleDay = (dayName) => {
    setFormData((prev) => {
      const currentDays = prev.days_of_week ? prev.days_of_week.split(' و ') : [];
      const exists = currentDays.includes(dayName);
      let nextDays;
      if (exists) {
        nextDays = currentDays.filter((d) => d !== dayName);
      } else {
        nextDays = [...currentDays, dayName];
      }
      return { ...prev, days_of_week: nextDays.join(' و ') };
    });
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.name.trim()) {
        toast.error('لطفاً عنوان دوره آموزشی را وارد کنید.');
        return false;
      }
      if (!formData.gender) {
        toast.error('لطفاً جنسیت مجاز دوره را انتخاب کنید.');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!formData.pool_location.trim()) {
        toast.error('لطفاً محل استخر و برگزاری را مشخص کنید.');
        return false;
      }
      if (!formData.days_of_week || formData.days_of_week.trim() === '') {
        toast.error('لطفاً حداقل یک روز از روزهای هفته را انتخاب کنید.');
        return false;
      }
      if (!formData.start_time || !formData.end_time) {
        toast.error('لطفاً ساعات شروع و پایان جلسات را وارد کنید.');
        return false;
      }
      if (!formData.start_date || !formData.end_date) {
        toast.error('لطفاً تاریخ شروع و پایان دوره را مشخص کنید.');
        return false;
      }
      if (formData.start_date > formData.end_date) {
        toast.error('تاریخ پایان دوره نمی‌تواند قبل از تاریخ شروع باشد.');
        return false;
      }
      return true;
    }

    if (step === 3) {
      // Step 3 is coaches; coaches are optional but recommended
      return true;
    }

    if (step === 4) {
      if (!formData.base_price || Number(formData.base_price) <= 0) {
        toast.error('لطفاً مبلغ شهریه معتبر وارد کنید.');
        return false;
      }
      if (!formData.sessions_count || Number(formData.sessions_count) < 1) {
        toast.error('تعداد جلسات دوره باید حداقل ۱ جلسه باشد.');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleStepClick = (targetStep) => {
    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
    } else if (targetStep > currentStep) {
      // Validate all previous steps
      for (let s = currentStep; s < targetStep; s++) {
        if (!validateStep(s)) return;
      }
      setCurrentStep(targetStep);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Validate all 4 steps
    for (let s = 1; s <= 4; s++) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        return;
      }
    }

    try {
      setSubmitting(true);
      await api.post('/education/courses/', {
        ...formData,
        base_price: Number(formData.base_price),
        sessions_count: Number(formData.sessions_count),
      });

      toast.success('دوره آموزشی جدید و کلاس‌های مربیان با موفقیت ایجاد گردید.');
      navigate('/admin/courses');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت دوره آموزشی');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (v) => Number(v || 0).toLocaleString('fa-IR');

  const filteredCoaches = coaches.filter((c) => {
    if (!coachSearch.trim()) return true;
    const query = coachSearch.trim().toLowerCase();
    const name = (c.full_name || '').toLowerCase();
    const spec = (c.specialties || '').toLowerCase();
    return name.includes(query) || spec.includes(query);
  });

  const selectedCoachObjects = coaches.filter((c) => formData.coach_ids.includes(c.id));

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/courses"
            className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors shrink-0"
            title="بازگشت به لیست دوره‌ها"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sky-600" />
              تعریف دوره آموزشی جدید
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              مراحل ۴ گانه تعریف مشخصات، زمان‌بندی، کادر مربیان و شهریه
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/courses')}
            className="text-xs"
          >
            انصراف
          </Button>
          <span className="text-xs font-mono font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 px-3 py-1.5 rounded-xl">
            مرحله {currentStep} از ۴
          </span>
        </div>
      </div>

      {/* 2. Stepper Navigation Header */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleStepClick(step.id)}
                className={`p-3 rounded-2xl text-right transition-all flex items-start gap-3 cursor-pointer select-none border ${
                  isCurrent
                    ? 'bg-sky-50/80 dark:bg-sky-950/50 border-sky-400 dark:border-sky-600 shadow-xs'
                    : isCompleted
                    ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100/60'
                    : 'bg-transparent border-transparent opacity-60 hover:opacity-80'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                    isCurrent
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step.id}
                </div>

                <div className="min-w-0">
                  <span
                    className={`block text-xs font-bold truncate ${
                      isCurrent
                        ? 'text-sky-950 dark:text-sky-100'
                        : isCompleted
                        ? 'text-slate-800 dark:text-slate-200'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {step.title}
                  </span>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    {step.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. STEP CONTENT CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        {/* Step 1: مشخصات عمومی و سرفصل‌های دوره */}
        {currentStep === 1 && (
          <div className="p-6 sm:p-8 space-y-5 animate-in fade-in-50 duration-200">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  مرحله ۱: مشخصات عمومی و سرفصل‌های دوره
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  نام دوره، جنسیت مجاز و اهداف آموزشی را تعیین کنید
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  عنوان دوره آموزشی *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: دوره نوجوانان یا دوره آموزش کرال سینه"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  جنسیت مجاز *
                </label>
                <CustomSelect
                  value={formData.gender}
                  onChange={(val) => setFormData({ ...formData, gender: val })}
                  options={[
                    {
                      value: 'MALE',
                      label: 'پسران / آقایان',
                      description: 'دوره ویژه پسران و آقایان',
                      icon: User,
                    },
                    {
                      value: 'FEMALE',
                      label: 'دختران / بانوان',
                      description: 'دوره ویژه دختران و بانوان',
                      icon: User,
                    },
                  ]}
                  placeholder="انتخاب جنسیت مجاز..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  رده سنی مخاطبان
                </label>
                <input
                  type="text"
                  placeholder="مثال: نوجوانان (۱۲ تا ۱۶ سال) یا خردسالان"
                  value={formData.age_range}
                  onChange={(e) => setFormData({ ...formData, age_range: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  وضعیت اولیه دوره
                </label>
                <CustomSelect
                  value={formData.status}
                  onChange={(val) => setFormData({ ...formData, status: val })}
                  options={[
                    {
                      value: 'ACTIVE',
                      label: 'در حال برگزاری (ثبت‌نام باز)',
                      description: 'امکان ثبت‌نام مستقیم شناگران فراهم است',
                    },
                    {
                      value: 'UPCOMING',
                      label: 'پیش‌ثبت‌نام',
                      description: 'دوره برای رزرو و مشاهده ظرفیت فعال است',
                    },
                  ]}
                  placeholder="انتخاب وضعیت دوره..."
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                آنچه در این دوره یاد می‌گیرند (سرفصل‌ها و مهارت‌های آموزشی)
              </label>
              <textarea
                rows={3}
                placeholder="مثال: تکنیک‌های کرال سینه، تنفس ریتمیک، استقامت، استارت و چرخش صحیح در لاین..."
                value={formData.what_you_learn}
                onChange={(e) => setFormData({ ...formData, what_you_learn: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                توضیحات و اهداف تکمیلی دوره
              </label>
              <textarea
                rows={2}
                placeholder="توضیحات کلی برای نمایش به اولیا و شناگران در سامانه و پرتال..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        )}

        {/* Step 2: محل برگزاری، روزها و ساعات هفتگی */}
        {currentStep === 2 && (
          <div className="p-6 sm:p-8 space-y-5 animate-in fade-in-50 duration-200">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    مرحله ۲: محل برگزاری، روزها و ساعات هفتگی
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    استخر و برنامه زمانی جلسات هفتگی را تنظیم نمایید
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-400 hidden sm:inline-block">
                {formData.days_of_week} ({formData.start_time} تا {formData.end_time})
              </span>
            </div>

            {/* Pool Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                استخر و محل برگزاری دوره *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="مثال: استخر شهید رئیسی یا استخر آزادی"
                  value={formData.pool_location}
                  onChange={(e) => setFormData({ ...formData, pool_location: e.target.value })}
                  className="w-full pl-3 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100 font-bold"
                />
              </div>
            </div>

            {/* Weekdays Selector */}
            <div className="space-y-2 p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-700/70">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  روزهای برگزاری کلاس‌ها در هفته *
                </label>
                <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 font-semibold">
                  {formData.days_of_week || 'هنوز روزی انتخاب نشده'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {['شنبه', 'یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'].map((day) => {
                  const isSelected = (formData.days_of_week || '').includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-sky-600 text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-sky-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      <span>{day}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Time24Picker
                  label="ساعت شروع جلسه (۲۴ ساعته) *"
                  value={formData.start_time}
                  onChange={(val) => setFormData({ ...formData, start_time: val })}
                  placeholder="17:00"
                  required
                />
              </div>

              <div>
                <Time24Picker
                  label="ساعت پایان جلسه (۲۴ ساعته) *"
                  value={formData.end_time}
                  onChange={(val) => setFormData({ ...formData, end_time: val })}
                  placeholder="19:00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <PersianDatePicker
                  label="تاریخ شروع دوره *"
                  value={formData.start_date}
                  onChange={(jalaliStr, gDate, gIso) => {
                    setFormData({ ...formData, start_date: gIso || jalaliStr });
                  }}
                  placeholder="انتخاب تاریخ شروع دوره..."
                />
              </div>

              <div>
                <PersianDatePicker
                  label="تاریخ پایان دوره *"
                  value={formData.end_date}
                  onChange={(jalaliStr, gDate, gIso) => {
                    setFormData({ ...formData, end_date: gIso || jalaliStr });
                  }}
                  placeholder="انتخاب تاریخ پایان دوره..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: کادر مربیان دوره آموزشی */}
        {currentStep === 3 && (
          <div className="p-6 sm:p-8 space-y-5 animate-in fade-in-50 duration-200">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    مرحله ۳: کادر مربیان دوره آموزشی
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    به ازای هر مربی انتخاب‌شده، یک کلاس اختصاصی با برنامه زمانی همین دوره تشکیل خواهد شد
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 px-3.5 py-1.5 rounded-xl self-start sm:self-auto">
                {formData.coach_ids.length} مربی انتخاب شده ({formData.coach_ids.length} کلاس خودکار)
              </span>
            </div>

            {/* Coach Search Bar */}
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={coachSearch}
                onChange={(e) => setCoachSearch(e.target.value)}
                placeholder="جستجو در نام مربی یا تخصص..."
                className="w-full pl-3 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Coaches Grid */}
            {loadingCoaches ? (
              <div className="p-12 text-center text-xs text-slate-400">
                در حال دریافت لیست کادر مربیان...
              </div>
            ) : filteredCoaches.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                مربی فعالی در سیستم یافت نشد.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto p-1">
                {filteredCoaches.map((c) => {
                  const isSelected = formData.coach_ids.includes(c.id);
                  return (
                    <div
                      key={c.id}
                      onClick={() => toggleCoach(c.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group select-none ${
                        isSelected
                          ? 'bg-sky-50/80 dark:bg-sky-950/50 border-sky-400 dark:border-sky-600 shadow-2xs'
                          : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/90 dark:border-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Coach Avatar */}
                        <div className="relative shrink-0">
                          {c.avatar ? (
                            <img
                              src={c.avatar}
                              alt={c.full_name}
                              className="w-11 h-11 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                              {c.full_name ? c.full_name.charAt(0) : 'م'}
                            </div>
                          )}
                          <span className="absolute -bottom-1 -left-1 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                        </div>

                        <div className="min-w-0">
                          <span className="font-bold text-xs text-slate-900 dark:text-white block truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                            {c.full_name}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                            {c.specialties || 'مربی رسمی شنا'}
                          </span>
                          {isSelected && (
                            <span className="inline-block text-[10px] text-sky-700 dark:text-sky-300 font-bold bg-sky-100 dark:bg-sky-900/60 px-2 py-0.5 rounded-md mt-1">
                              کلاس اختصاصی فعال شد
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Checkbox button */}
                      <div
                        className={`w-6 h-6 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-sky-600 border-sky-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 group-hover:border-slate-400'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 stroke-[2.5]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 4: امور مالی و شهریه ثبت‌نام */}
        {currentStep === 4 && (
          <div className="p-6 sm:p-8 space-y-6 animate-in fade-in-50 duration-200">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  مرحله ۴: امور مالی و شهریه ثبت‌نام
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  شهریه ثبت‌نام و تعداد جلسات را نهایی کرده و خلاصه دوره را بررسی نمایید
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  شهریه پایه هر شناگر (تومان) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0"
                    step="10000"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                    className="w-full pl-16 pr-3.5 py-2.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                    تومان
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 block mt-1 font-bold">
                  معادل: {formatPrice(formData.base_price)} تومان
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  تعداد کل جلسات دوره *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={formData.sessions_count}
                  onChange={(e) => setFormData({ ...formData, sessions_count: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Course Summary Preview Card */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  پیش‌نمایش مشخصات دوره آموزشی
                </span>
                <Badge variant={formData.status === 'ACTIVE' ? 'success' : 'neutral'}>
                  {formData.status === 'ACTIVE' ? 'ثبت‌نام باز' : 'پیش‌ثبت‌نام'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">عنوان دوره:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {formData.name || 'بدون عنوان'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">جنسیت مجاز:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {formData.gender === 'FEMALE' ? 'دختران / بانوان' : 'پسران / آقایان'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">استخر و محل برگزاری:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {formData.pool_location}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">برنامه زمانی:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {formData.days_of_week} ({formData.start_time} تا {formData.end_time})
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">تاریخ دوره:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {formData.start_date ? formatJalaliReadable(toJalaliString(formData.start_date)) : '-'} تا {formData.end_date ? formatJalaliReadable(toJalaliString(formData.end_date)) : '-'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">کادر مربیان دوره:</span>
                  <span className="font-bold text-sky-600 dark:text-sky-400">
                    {selectedCoachObjects.length > 0
                      ? `${selectedCoachObjects.length} مربی (${selectedCoachObjects.map(c => c.full_name).join('، ')})`
                      : 'بدون تخصیص مربی'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Wizard Footer Navigation */}
        <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div>
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="text-xs gap-1.5"
              >
                <ArrowRight className="w-4 h-4" />
                <span>مرحله قبلی</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/courses')}
                className="text-xs"
              >
                انصراف و بازگشت
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="text-xs bg-sky-600 hover:bg-sky-700 text-white font-bold gap-1.5 px-5 py-2.5 rounded-xl shadow-xs"
              >
                <span>مرحله بعدی</span>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 px-6 py-2.5 rounded-xl shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>{submitting ? 'در حال ثبت نهایی...' : 'ثبت قطعی و تعریف دوره آموزشی'}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
