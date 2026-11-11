import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, MapPin, Clock, Calendar,
  Users, Check, CheckCircle2, Award,
  Sparkles, DollarSign, Layers, Search, User, ChevronLeft, AlertCircle,
  Whistle, CreditCard
} from 'lucide-react';
import { SwimCourseSpecsIcon } from '../../components/common/AquaticIcons';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { CustomSelect } from '../../components/common/CustomSelect';
import { BackButton } from '../../components/common/BackButton';
import { PersianDatePicker, toJalaliString, formatJalaliReadable } from '../../components/common/PersianDatePicker';
import { useToast } from '../../context/ToastContext';

const STEPS = [
  { id: 1, title: 'مشخصات عمومی و سرفصل‌ها', subtitle: 'عنوان، جنسیت، رده سنی و توضیحات', icon: SwimCourseSpecsIcon },
  { id: 2, title: 'محل برگزاری و زمان‌بندی', subtitle: 'استخر، روزهای هفته و ساعات جلسات', icon: MapPin },
  { id: 3, title: 'کادر مربیان دوره آموزشی', subtitle: 'تعیین مربیان و تفکیک خودکار کلاس‌ها', icon: Whistle },
  { id: 4, title: 'امور مالی و اقساط شهریه', subtitle: 'شهریه، تعداد جلسات، اقساط و مرور نهایی', icon: DollarSign },
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
    age_min: '',
    age_max: '',
    age_range: '',
    pool_location: 'استخر شهید رئیسی',
    days_of_week: 'سه‌شنبه و پنج‌شنبه',
    start_time: '17:00',
    end_time: '19:00',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
    base_price: '1500000',
    sessions_count: 12,
    installments_count: 1,
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
      const currentDays = prev.days_of_week
        ? prev.days_of_week.split(' و ').map((d) => d.trim()).filter(Boolean)
        : [];
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

  // Auto-masking function for 24h time input: "17" -> "17:" -> "17:00"
  const formatTimeInput = (inputVal, prevVal) => {
    // If user is deleting characters
    if (prevVal && inputVal.length < prevVal.length) {
      if (prevVal.endsWith(':') && !inputVal.includes(':')) {
        return inputVal.slice(0, -1);
      }
      return inputVal;
    }

    // Convert Persian and Arabic numbers to English digits
    const eng = inputVal
      .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

    const digits = eng.replace(/\D/g, '').slice(0, 4);
    if (!digits) return '';

    if (digits.length === 1) {
      if (inputVal.endsWith(':')) {
        return `0${digits}:`;
      }
      return digits;
    }

    if (digits.length === 2) {
      let h = parseInt(digits, 10);
      if (h > 23) h = 23;
      return `${String(h).padStart(2, '0')}:`;
    }

    if (digits.length === 3) {
      let h = parseInt(digits.slice(0, 2), 10);
      if (h > 23) h = 23;
      return `${String(h).padStart(2, '0')}:${digits.slice(2)}`;
    }

    // 4 digits
    let h = parseInt(digits.slice(0, 2), 10);
    if (h > 23) h = 23;
    let m = parseInt(digits.slice(2, 4), 10);
    if (m > 59) m = 59;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const normalizeTimeOnBlur = (timeStr) => {
    if (!timeStr) return '';
    const clean = timeStr.trim();
    if (clean.endsWith(':')) {
      return `${clean}00`;
    }
    const parts = clean.split(':');
    if (parts.length === 2 && parts[1].length === 1) {
      return `${parts[0]}:${parts[1]}0`;
    }
    return clean;
  };

  const handleAgeChange = (field, rawValue) => {
    // Convert Persian and Arabic digits to standard English digits
    const eng = String(rawValue || '')
      .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
    const cleanDigits = eng.replace(/\D/g, '').slice(0, 2);

    const nextMin = field === 'age_min' ? cleanDigits : formData.age_min;
    const nextMax = field === 'age_max' ? cleanDigits : formData.age_max;

    let computedRange = '';
    if (nextMin && nextMax) {
      computedRange = `${nextMin} تا ${nextMax} سال`;
    } else if (nextMin) {
      computedRange = `از ${nextMin} سال به بالا`;
    } else if (nextMax) {
      computedRange = `تا ${nextMax} سال`;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: cleanDigits,
      age_range: computedRange,
    }));
  };

  const setQuickAgeRange = (min, max) => {
    const minStr = String(min);
    const maxStr = String(max);
    setFormData((prev) => ({
      ...prev,
      age_min: minStr,
      age_max: maxStr,
      age_range: `${minStr} تا ${maxStr} سال`,
    }));
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
      if (formData.age_min && formData.age_max && Number(formData.age_min) > Number(formData.age_max)) {
        toast.error('حداقل سن نمی‌تواند از حداکثر سن بیشتر باشد.');
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
      if (!formData.coach_ids || formData.coach_ids.length === 0) {
        toast.error('لطفاً حداقل یک مربی برای دوره آموزشی انتخاب کنید.');
        return false;
      }
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
      if (!formData.installments_count || Number(formData.installments_count) < 1) {
        toast.error('تعداد اقساط شهریه باید حداقل ۱ قسط باشد.');
        return false;
      }
      if (Number(formData.installments_count) > 24) {
        toast.error('تعداد اقساط نمی‌تواند بیشتر از ۲۴ قسط باشد.');
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
        if (!validateStep(s)) {
          setCurrentStep(s);
          return;
        }
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
      const postPayload = {
        ...formData,
        age_range: formData.age_range || (formData.age_min && formData.age_max ? `${formData.age_min} تا ${formData.age_max} سال` : formData.age_min ? `از ${formData.age_min} سال به بالا` : ''),
        base_price: Number(formData.base_price),
        sessions_count: Number(formData.sessions_count),
        installments_count: Number(formData.installments_count || 1),
      };
      delete postPayload.age_min;
      delete postPayload.age_max;

      await api.post('/education/courses/', postPayload);

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
        <div className="flex items-center gap-3 min-w-0">
          <BackButton fallback="/admin/courses" title="بازگشت به دوره‌ها و کلاس‌ها" />
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
              <SwimCourseSpecsIcon className="w-5 h-5 text-sky-600 shrink-0" />
              <span>تعریف دوره آموزشی جدید</span>
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

      {/* 2. Stepper Progress Bar Header */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        {/* Progress Bar & Icon Nodes */}
        <div className="flex items-center justify-between max-w-2xl mx-auto px-2 sm:px-6">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <React.Fragment key={step.id}>
                {/* Step Node Button with Icon */}
                <button
                  type="button"
                  onClick={() => handleStepClick(step.id)}
                  title={step.title}
                  className={`relative group flex items-center justify-center rounded-2xl transition-all duration-300 cursor-pointer select-none shrink-0 ${
                    isCurrent
                      ? 'w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-lg shadow-sky-500/30 ring-4 ring-sky-100 dark:ring-sky-900/60 scale-105'
                      : isCompleted
                      ? 'w-11 h-11 sm:w-13 sm:h-13 bg-emerald-500 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600 hover:scale-105'
                      : 'w-11 h-11 sm:w-13 sm:h-13 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon className={`${isCurrent ? 'w-6 h-6 sm:w-7 sm:h-7' : 'w-5 h-5 sm:w-6 sm:h-6'} transition-transform`} />

                  {/* Completed checkmark badge */}
                  {isCompleted && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-2xs">
                      <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                    </span>
                  )}

                  {/* Active glowing indicator */}
                  {isCurrent && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-sky-400 border-2 border-white dark:border-slate-900" />
                    </span>
                  )}
                </button>

                {/* Connecting Progress Line between step icons */}
                {idx < STEPS.length - 1 && (
                  <div className="flex-1 h-1.5 mx-2 sm:mx-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        currentStep > step.id
                          ? 'w-full bg-gradient-to-l from-sky-500 to-cyan-400'
                          : 'w-0'
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Current Active Step Title Display (only the active step is written here) */}
        <div className="mt-5 pt-4 text-center border-t border-slate-100 dark:border-slate-800/80">
          <span className="inline-block text-[11px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-3 py-1 rounded-full border border-sky-200/60 dark:border-sky-800/60 mb-1.5">
            مرحله {currentStep} از {STEPS.length}
          </span>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            {STEPS[currentStep - 1].title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {STEPS[currentStep - 1].subtitle}
          </p>
        </div>
      </div>

      {/* 3. STEP CONTENT CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        {/* Step 1: مشخصات عمومی و سرفصل‌های دوره */}
        {currentStep === 1 && (
          <div className="p-6 sm:p-8 space-y-5 animate-in fade-in-50 duration-200">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <SwimCourseSpecsIcon className="w-4 h-4" />
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>رده سنی مخاطبان (سال)</span>
                  {formData.age_range && (
                    <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-200/60 dark:border-sky-800">
                      {formData.age_range}
                    </span>
                  )}
                </label>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none select-none">
                      از
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="۵"
                      value={formData.age_min}
                      onChange={(e) => handleAgeChange('age_min', e.target.value)}
                      className="w-full pr-8 pl-3 py-2.5 text-xs text-center font-bold font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100 transition-colors"
                    />
                  </div>

                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 shrink-0 select-none">
                    تا
                  </span>

                  <div className="relative flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="۷"
                      value={formData.age_max}
                      onChange={(e) => handleAgeChange('age_max', e.target.value)}
                      className="w-full pr-3 pl-9 py-2.5 text-xs text-center font-bold font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100 transition-colors"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none select-none">
                      سال
                    </span>
                  </div>
                </div>

                {/* Quick suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 select-none">پیشنهاد سریع:</span>
                  {[
                    { label: '۵ تا ۷ سال', min: '5', max: '7' },
                    { label: '۸ تا ۱۲ سال', min: '8', max: '12' },
                    { label: '۱۳ تا ۱۷ سال', min: '13', max: '17' },
                    { label: '۱۸ تا ۵۰ سال', min: '18', max: '50' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setQuickAgeRange(preset.min, preset.max)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                        formData.age_min === preset.min && formData.age_max === preset.max
                          ? 'bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700 font-bold'
                          : 'bg-slate-100/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
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
                  const selectedDays = (formData.days_of_week || '')
                    .split(' و ')
                    .map((d) => d.trim())
                    .filter(Boolean);
                  const isSelected = selectedDays.includes(day);
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

            {/* Quick pool session presets */}
            <div className="p-3 bg-sky-50/60 dark:bg-sky-950/40 rounded-2xl border border-sky-200/60 dark:border-sky-800/60 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                سانس‌های متداول استخر (تنظیم سریع):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '۱۷:۰۰ تا ۱۹:۰۰ (۲ ساعته)', start: '17:00', end: '19:00' },
                  { label: '۱۶:۰۰ تا ۱۸:۰۰', start: '16:00', end: '18:00' },
                  { label: '۱۸:۰۰ تا ۲۰:۰۰', start: '18:00', end: '20:00' },
                  { label: '۱۹:۰۰ تا ۲۱:۰۰', start: '19:00', end: '21:00' },
                  { label: '۱۷:۰۰ تا ۱۸:۳۰ (۱.۵ ساعته)', start: '17:00', end: '18:30' },
                  { label: '۱۸:۳۰ تا ۲۰:۰۰', start: '18:30', end: '20:00' },
                ].map((preset) => {
                  const isActive = formData.start_time === preset.start && formData.end_time === preset.end;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setFormData({ ...formData, start_time: preset.start, end_time: preset.end })}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-sky-600 text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-sky-300'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>ساعت شروع جلسه (۲۴ ساعته) *</span>
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="17:00"
                    value={formData.start_time}
                    onChange={(e) => {
                      const formatted = formatTimeInput(e.target.value, formData.start_time);
                      setFormData({ ...formData, start_time: formatted });
                    }}
                    onBlur={() => {
                      setFormData((prev) => ({
                        ...prev,
                        start_time: normalizeTimeOnBlur(prev.start_time),
                      }));
                    }}
                    className="w-full pl-3 pr-10 py-2.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  دو رقم اول را بزنید دو نقطه (:) خودکار درج می‌شود (مثال ۱۷:۰۰)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>ساعت پایان جلسه (۲۴ ساعته) *</span>
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="19:00"
                    value={formData.end_time}
                    onChange={(e) => {
                      const formatted = formatTimeInput(e.target.value, formData.end_time);
                      setFormData({ ...formData, end_time: formatted });
                    }}
                    onBlur={() => {
                      setFormData((prev) => ({
                        ...prev,
                        end_time: normalizeTimeOnBlur(prev.end_time),
                      }));
                    }}
                    className="w-full pl-3 pr-10 py-2.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  دو رقم اول را بزنید دو نقطه (:) خودکار درج می‌شود (مثال ۱۹:۰۰)
                </span>
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
                  <Whistle className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>مرحله ۳: کادر مربیان دوره آموزشی</span>
                    <span className="text-rose-500 text-sm font-bold" title="انتخاب مربی الزامی است">*</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    انتخاب حداقل یک مربی الزامی است؛ به ازای هر مربی، یک کلاس اختصاصی برای این دوره تشکیل می‌شود
                  </p>
                </div>
              </div>

              <span className={`text-xs font-mono font-bold px-3.5 py-1.5 rounded-xl self-start sm:self-auto border transition-colors ${
                formData.coach_ids.length > 0
                  ? 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 border-sky-200 dark:border-sky-800'
                  : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800'
              }`}>
                {formData.coach_ids.length > 0
                  ? `${formData.coach_ids.length} مربی انتخاب شده (${formData.coach_ids.length} کلاس خودکار)`
                  : 'هیچ مربی انتخاب نشده (الزامی)'}
              </span>
            </div>

            {formData.coach_ids.length === 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/80 rounded-2xl flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  برای ادامه و رفتن به مرحله بعدی، لطفاً حداقل یک مربی را از فهرست زیر برای دوره انتخاب کنید.
                </span>
              </div>
            )}

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
            ) : coaches.length === 0 ? (
              <div className="p-8 text-center text-xs bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-3">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="font-bold text-slate-700 dark:text-slate-200">مربی فعالی در سیستم یافت نشد.</p>
                <p className="text-slate-500 dark:text-slate-400">برای ثبت دوره آموزشی باید ابتدا حداقل یک مربی در سامانه ایجاد نمایید.</p>
                <Link
                  to="/admin/coaches"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 transition-colors"
                >
                  افزودن مربی جدید
                </Link>
              </div>
            ) : filteredCoaches.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                مربی متناسب با عبارت جستجو یافت نشد.
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
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    مرحله ۴: امور مالی و سقف اقساط شهریه
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    شهریه دوره، تعداد جلسات و سقف مجاز اقساط را مشخص نمایید (شناگر در ثبت‌نام می‌تواند کمتر هم انتخاب کند)
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-3.5 py-1.5 rounded-xl self-start sm:self-auto">
                {Number(formData.installments_count) > 1 ? `سقف تا ${formData.installments_count} قسط مجاز` : 'فقط پرداخت یکجا'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  شهریه کل هر شناگر (تومان) *
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
                <span className="text-[11px] text-slate-400 block mt-1">
                  تعداد جلسات مجاز شناگر در طول دوره
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  سقف تعداد اقساط مجاز *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="24"
                  value={formData.installments_count}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const val = raw === '' ? '' : Math.max(1, parseInt(raw, 10) || 1);
                    setFormData({ ...formData, installments_count: val });
                  }}
                  className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                />
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 select-none">سقف اقساط:</span>
                  {[
                    { label: 'فقط ۱ قسط (یکجا)', count: 1 },
                    { label: 'تا ۲ قسط', count: 2 },
                    { label: 'تا ۳ قسط', count: 3 },
                    { label: 'تا ۴ قسط', count: 4 },
                  ].map((preset) => (
                    <button
                      key={preset.count}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, installments_count: preset.count }))}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                        Number(formData.installments_count) === preset.count
                          ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-bold'
                          : 'bg-slate-100/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Installments calculation preview banner */}
            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/70 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                    {Number(formData.installments_count) > 1
                      ? `سقف تقسیط مجاز: تا ${formData.installments_count} قسط مساوی`
                      : 'شیوه پرداخت: فقط یکجا (بدون تقسیط)'}
                  </span>
                  <p className="text-[11px] text-emerald-700/90 dark:text-emerald-400 mt-0.5">
                    {Number(formData.installments_count) > 1
                      ? `شناگر در زمان ثبت‌نام می‌تواند کل شهریه را یکجا یا در هر تعداد قسط دلخواه از ۱ تا ${formData.installments_count} قسط پرداخت کند.`
                      : 'شناگر شهریه را به صورت یکجا همزمان با شروع دوره پرداخت خواهد کرد.'}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">
                  {Number(formData.installments_count) > 1 ? `مبلغ هر قسط در سقف ${formData.installments_count} قسط:` : 'مبلغ کل:'}
                </span>
                <span className="text-sm font-mono font-black text-emerald-800 dark:text-emerald-200">
                  {formatPrice(Math.round(Number(formData.base_price || 0) / (Number(formData.installments_count) || 1)))} تومان
                </span>
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
                  <span className="text-slate-400 block text-[11px]">رده سنی مجاز:</span>
                  <span className="font-bold text-sky-600 dark:text-sky-400">
                    {formData.age_range || (formData.age_min && formData.age_max ? `${formData.age_min} تا ${formData.age_max} سال` : 'عموم رده‌های سنی')}
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
                  <span className={`font-bold ${selectedCoachObjects.length > 0 ? 'text-sky-600 dark:text-sky-400' : 'text-rose-500'}`}>
                    {selectedCoachObjects.length > 0
                      ? `${selectedCoachObjects.length} مربی (${selectedCoachObjects.map(c => c.full_name).join('، ')})`
                      : 'بدون انتخاب مربی (نامعتبر)'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">سقف تقسیط مجاز دوره:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {Number(formData.installments_count) > 1
                      ? `تا ${formData.installments_count} قسط (شناگر می‌تواند ۱ تا ${formData.installments_count} قسط انتخاب کند)`
                      : 'فقط پرداخت یکجا (بدون قسط)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Wizard Footer Navigation */}
        <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 rounded-b-3xl flex items-center justify-between gap-3">
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
