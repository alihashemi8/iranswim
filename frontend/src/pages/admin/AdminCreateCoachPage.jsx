import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  UserCheck, ArrowRight, ArrowLeft, Save, User, Phone, Hash, Calendar,
  Briefcase, MapPin, ShieldAlert, Award, CreditCard, Clock, Lock,
  Eye, EyeOff, AlertCircle, CheckCircle2, Sparkles, KeyRound, Upload,
  Check, FileText, FileCheck
} from 'lucide-react';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { CustomSelect } from '../../components/common/CustomSelect';
import { PersianDatePicker } from '../../components/common/PersianDatePicker';
import { BackButton } from '../../components/common/BackButton';
import { useToast } from '../../context/ToastContext';
import { validatePassword, PasswordRequirementsList } from '../../utils/passwordValidator';

export const AdminCreateCoachPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [loadingCoach, setLoadingCoach] = useState(isEdit);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // File uploads
  const [coachingCertificateFile, setCoachingCertificateFile] = useState(null);
  const [coachingCertificateFilePreview, setCoachingCertificateFilePreview] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeFileName, setResumeFileName] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [form, setForm] = useState({
    // Step 1: Personal Identity
    first_name: '',
    last_name: '',
    phone: '',
    national_id: '',
    gender: 'MALE',
    date_of_birth: '',
    password: '',

    // Step 2: Address & Emergency Contact
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',

    // Step 3: Coaching Credentials (specialties REMOVED)
    coaching_degree: 'GRADE_3',
    coaching_certificate_date: '',
    years_of_experience: 1,
    bio: '',
    lifeguard_certificate: '',
    lifeguard_expiration: '',
    previous_experience: '',
    additional_skills: '',

    // Step 4: Bank & Employment
    card_number: '',
    shaba_number: '',
    employment_status: 'ACTIVE',
    employment_type: 'HOURLY',
    hourly_rate: '250000',
    fixed_monthly_salary: '0',
    revenue_percentage: '0',
    percentage_revenue_basis: 'COURSE_GROSS',
    contractual_weekly_hours: 20,
    internal_notes: '',
  });

  const degreeOptions = [
    { value: 'GRADE_3', label: 'مربیگری درجه ۳ فدراسیون', badge: 'پایه', description: 'آموزش شنا مقدماتی و تکنیک‌های ۴ شنا' },
    { value: 'GRADE_2', label: 'مربیگری درجه ۲ فدراسیون', badge: 'متوسط', description: 'تیم‌های پایه و دوره‌های نیمه‌پیشرفته' },
    { value: 'GRADE_1', label: 'مربیگری درجه ۱ فدراسیون', badge: 'پیشرفته', description: 'تیم‌های استانی و مسابقات حرفه‌ای' },
    { value: 'NATIONAL', label: 'مربیگری ملی شنا', badge: 'ملی', description: 'تیم‌های لیگ برتر و منتخب استان' },
    { value: 'INTERNATIONAL', label: 'مربیگری بین‌المللی (FINA / World Aquatics)', badge: 'بین‌المللی', description: 'مربیگری دوره‌های جهانی و بین‌المللی' },
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: 'فعال و مجاز به تدریس' },
    { value: 'SUSPENDED', label: 'معلق موقت' },
    { value: 'INACTIVE', label: 'غیرفعال' },
  ];

  const employmentTypeOptions = [
    { value: 'HOURLY', label: 'ساعتی (حق‌التدریس بر اساس ساعت جلسه)' },
    { value: 'FIXED', label: 'حقوق ثابت ماهانه' },
    { value: 'PERCENTAGE', label: 'درصدی از شهریه دوره‌ها' },
  ];

  const revenueBasisOptions = [
    { value: 'COURSE_GROSS', label: 'کل درآمد ثبت‌نامی دوره (Gross)' },
    { value: 'COURSE_NET', label: 'خالص درآمد پس از کسر هزینه‌های استخر' },
    { value: 'COLLECTED', label: 'مبالغ وصول‌شده نقدی شهریه' },
  ];

  useEffect(() => {
    if (!id) return;
    const fetchCoach = async () => {
      try {
        setLoadingCoach(true);
        const res = await api.get(`/coaches/${id}/`);
        const c = res.data;
        setForm({
          first_name: c.first_name || '',
          last_name: c.last_name || '',
          phone: c.phone || '',
          national_id: c.national_id || '',
          gender: c.gender || 'MALE',
          date_of_birth: c.date_of_birth || '',
          password: '',
          emergency_contact_name: c.emergency_contact_name || '',
          emergency_contact_phone: c.emergency_contact_phone || '',
          address: c.address || '',
          coaching_degree: c.coaching_degree || 'GRADE_3',
          coaching_certificate_date: c.coaching_certificate_date || '',
          years_of_experience: c.years_of_experience ?? 1,
          bio: c.bio || '',
          lifeguard_certificate: c.lifeguard_certificate || '',
          lifeguard_expiration: c.lifeguard_expiration || '',
          previous_experience: c.previous_experience || '',
          additional_skills: c.additional_skills || '',
          card_number: c.card_number || '',
          shaba_number: c.shaba_number || '',
          employment_status: c.employment_status || 'ACTIVE',
          employment_type: c.employment_type || 'HOURLY',
          hourly_rate: String(c.hourly_rate || '250000'),
          fixed_monthly_salary: String(c.fixed_monthly_salary || '0'),
          revenue_percentage: String(c.revenue_percentage || '0'),
          percentage_revenue_basis: c.percentage_revenue_basis || 'COURSE_GROSS',
          contractual_weekly_hours: c.contractual_weekly_hours || 20,
          internal_notes: c.internal_notes || '',
        });

        if (c.coaching_certificate_file) {
          setCoachingCertificateFilePreview(c.coaching_certificate_file);
        }
        if (c.resume_file) {
          setResumeFileName(c.resume_file.split('/').pop() || 'فایل رزومه');
        }
        if (c.avatar) {
          setAvatarPreview(c.avatar);
        }
      } catch (err) {
        console.error(err);
        toast.error('خطا در دریافت اطلاعات مربی');
        navigate('/admin/coaches');
      } finally {
        setLoadingCoach(false);
      }
    };
    fetchCoach();
  }, [id]);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$!';
    let pass = 'Coach@';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pass += '9';
    setForm((prev) => ({ ...prev, password: pass }));
  };

  const handleChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  // Step 1 Validation
  const validateStep1 = () => {
    setError('');
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('نام و نام خانوادگی مربی الزامی است.');
      return false;
    }
    const cleanPhone = form.phone.trim();
    if (!cleanPhone || !/^09\d{9}$/.test(cleanPhone)) {
      setError('شماره تلفن همراه باید یک شماره موبایل معتبر ۱۱ رقمی (شروع با ۰۹) باشد.');
      return false;
    }
    const cleanNid = form.national_id.trim();
    if (!cleanNid || cleanNid.length !== 10 || !/^\d+$/.test(cleanNid)) {
      setError('کد ملی مربی باید دقیقاً ۱۰ رقم عددی معتبر باشد.');
      return false;
    }
    if (!form.date_of_birth) {
      setError('تاریخ تولد مربی الزامی است.');
      return false;
    }
    if (form.password) {
      const passValidation = validatePassword(form.password);
      if (!passValidation.isValid) {
        setError('رمز عبور تعیین‌شده، الزامات امنیتی را برآورده نمی‌کند.');
        return false;
      }
    }
    return true;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    setError('');
    if (!form.address.trim()) {
      setError('آدرس کامل محل سکونت مربی الزامی است.');
      return false;
    }
    if (!form.emergency_contact_name.trim()) {
      setError('نام و نام خانوادگی مخاطب اضطراری الزامی است.');
      return false;
    }
    const cleanEmergPhone = form.emergency_contact_phone.trim();
    if (!cleanEmergPhone || !/^09\d{9}$/.test(cleanEmergPhone)) {
      setError('شماره تماس مخاطب اضطراری باید ۱۱ رقمی و معتبر (با ۰۹) باشد.');
      return false;
    }
    return true;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    setError('');
    if (!form.coaching_degree) {
      setError('درجه رسمی مربیگری الزامی است.');
      return false;
    }
    if (!form.coaching_certificate_date) {
      setError('تاریخ اخذ مدرک مربیگری الزامی است.');
      return false;
    }
    if (!coachingCertificateFile && !coachingCertificateFilePreview) {
      setError('بارگذاری فایل یا تصویر مدرک مربیگری الزامی است.');
      return false;
    }
    if (form.years_of_experience === '' || Number(form.years_of_experience) < 0) {
      setError('سابقه کار مربیگری الزامی است.');
      return false;
    }
    if (!form.bio.trim() && !resumeFile && !resumeFileName) {
      setError('وارد کردن متن رزومه یا بارگذاری فایل رزومه الزامی است.');
      return false;
    }
    return true;
  };

  // Step 4 Validation
  const validateStep4 = () => {
    setError('');
    const cleanCard = form.card_number.replace(/\D/g, '');
    if (!cleanCard || cleanCard.length !== 16) {
      setError('شماره کارت بانکی مربی باید ۱۶ رقم عددی معتبر باشد.');
      return false;
    }
    const cleanShaba = form.shaba_number.replace(/\s+/g, '').toUpperCase();
    if (!cleanShaba || cleanShaba.length < 24) {
      setError('شماره شبا بانکی باید حداقل ۲۴ کاراکتر معتبر باشد.');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 2) {
      if (!validateStep2()) return;
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 3) {
      if (!validateStep3()) return;
      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setError('');
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validateStep1() || !validateStep2() || !validateStep3() || !validateStep4()) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const formData = new FormData();
      formData.append('first_name', form.first_name.trim());
      formData.append('last_name', form.last_name.trim());
      formData.append('phone', form.phone.trim());
      formData.append('national_id', form.national_id.trim());
      formData.append('gender', form.gender);
      formData.append('date_of_birth', form.date_of_birth);
      if (form.password) formData.append('password', form.password);
      if (avatarFile) formData.append('avatar', avatarFile);

      formData.append('address', form.address.trim());
      formData.append('emergency_contact_name', form.emergency_contact_name.trim());
      formData.append('emergency_contact_phone', form.emergency_contact_phone.trim());

      formData.append('coaching_degree', form.coaching_degree);
      formData.append('coaching_certificate_date', form.coaching_certificate_date);
      if (coachingCertificateFile) formData.append('coaching_certificate_file', coachingCertificateFile);
      formData.append('years_of_experience', Number(form.years_of_experience || 0));
      formData.append('bio', form.bio.trim());
      if (resumeFile) formData.append('resume_file', resumeFile);
      formData.append('lifeguard_certificate', form.lifeguard_certificate.trim());
      if (form.lifeguard_expiration) formData.append('lifeguard_expiration', form.lifeguard_expiration);
      formData.append('previous_experience', form.previous_experience.trim());
      formData.append('additional_skills', form.additional_skills.trim());

      const cleanCard = form.card_number.replace(/\D/g, '');
      const cleanShaba = form.shaba_number.replace(/\s+/g, '').toUpperCase();
      formData.append('card_number', cleanCard);
      formData.append('shaba_number', cleanShaba);

      formData.append('employment_status', form.employment_status);
      formData.append('employment_type', form.employment_type);
      formData.append('hourly_rate', form.employment_type === 'HOURLY' ? form.hourly_rate : '0');
      formData.append('fixed_monthly_salary', form.employment_type === 'FIXED' ? form.fixed_monthly_salary : '0');
      formData.append('revenue_percentage', form.employment_type === 'PERCENTAGE' ? form.revenue_percentage : '0');
      formData.append('percentage_revenue_basis', form.percentage_revenue_basis);
      formData.append('contractual_weekly_hours', Number(form.contractual_weekly_hours || 0));
      formData.append('internal_notes', form.internal_notes.trim());

      if (isEdit) {
        await api.patch(`/coaches/${id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success(`مشخصات مربی ${form.first_name} ${form.last_name} با موفقیت به‌روزرسانی شد.`);
        navigate(`/admin/coaches/${id}`);
      } else {
        const res = await api.post('/coaches/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success(`پرونده پرسنلی مربی ${form.first_name} ${form.last_name} با موفقیت تشکیل شد.`);
        const newId = res.data.id;
        navigate(`/admin/coaches/${newId}`);
      }
    } catch (err) {
      console.error(err);
      const errorData = err.response?.data;
      if (typeof errorData === 'object' && errorData !== null) {
        const firstKey = Object.keys(errorData)[0];
        const firstVal = errorData[firstKey];
        const msg = `${firstKey}: ${Array.isArray(firstVal) ? firstVal[0] : firstVal}`;
        setError(msg);
        toast.error(msg);
      } else {
        setError('خطا در ثبت و تشکیل پرونده مربی جدید');
        toast.error('خطا در ثبت اطلاعات پرونده مربی');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatCardInput = (val) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    const parts = raw.match(/[\s\S]{1,4}/g) || [];
    return parts.join('-');
  };

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <BackButton fallback="/admin/coaches" title="بازگشت به فهرست مربیان" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">مدیریت مربیان و منابع انسانی</span>
              <span className="text-xs text-slate-300 dark:text-slate-700">/</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">کادر مربیان</span>
              <span className="text-xs text-slate-300 dark:text-slate-700">/</span>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                {isEdit ? 'ویرایش مشخصات مربی' : 'افزودن مربی جدید'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2 truncate">
              <UserCheck className="w-6 h-6 text-sky-600 shrink-0" />
              <span>{isEdit ? `ویرایش پرونده مربی: ${form.first_name} ${form.last_name}` : 'تشکیل پرونده و استخدام مربی جدید'}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => navigate(isEdit ? `/admin/coaches/${id}` : '/admin/coaches')}
            className="text-xs"
          >
            انصراف
          </Button>
        </div>
      </div>

      {/* Stepper Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { step: 1, title: 'هویت فردی', icon: User },
            { step: 2, title: 'نشانی و اضطراری', icon: MapPin },
            { step: 3, title: 'درجه و مدارک', icon: Award },
            { step: 4, title: 'بانک و شرایط همکاری', icon: CreditCard },
          ].map((item) => {
            const Icon = item.icon;
            const isCurrent = currentStep === item.step;
            const isDone = currentStep > item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => {
                  if (item.step < currentStep) setCurrentStep(item.step);
                }}
                className={`flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  isCurrent
                    ? 'text-sky-600 dark:text-sky-400 font-black'
                    : isDone
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-slate-400 dark:text-slate-500 font-medium'
                }`}
              >
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-xs sm:text-sm font-black transition-all ${
                    isCurrent
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-4 ring-sky-100 dark:ring-sky-950/60 scale-105'
                      : isDone
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <div className="text-[11px] sm:text-xs">
                  <span className="hidden sm:inline">مرحله {item.step}: </span>
                  <span>{item.title}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-sky-500 to-emerald-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* Form Steps */}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {/* STEP 1: Personal & Identity Info */}
        {currentStep === 1 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-sky-600" />
                <span>مرحله ۱: مشخصات هویتی و اطلاعات حساب کاربری مربی</span>
              </h3>
              <Badge variant="info">مرحله ۱ از ۴</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  placeholder="مثال: علیرضا"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام خانوادگی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  placeholder="مثال: رضایی"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شماره همراه (نام کاربری ورود) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    dir="ltr"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="09123456789"
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  کد ملی ده رقمی <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={10}
                    value={form.national_id}
                    onChange={(e) => handleChange('national_id', e.target.value.replace(/\D/g, ''))}
                    placeholder="0012345678"
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  جنسیت مربی <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleChange('gender', 'MALE')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      form.gender === 'MALE'
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-400 text-sky-700 dark:text-sky-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>آقا / مرد</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('gender', 'FEMALE')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      form.gender === 'FEMALE'
                        ? 'bg-pink-50 dark:bg-pink-950/60 border-pink-400 text-pink-700 dark:text-pink-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>خانم / زن</span>
                  </button>
                </div>
              </div>

              <div>
                <PersianDatePicker
                  label="تاریخ تولد *"
                  value={form.date_of_birth}
                  onChange={(jalaliStr, gDate, gIso) => handleChange('date_of_birth', gIso || '')}
                  placeholder="انتخاب تاریخ تولد شمسی..."
                  color="sky"
                  size="md"
                  required
                  minYear={1330}
                  maxYear={1415}
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عکس پرسنلی مربی
                </label>
                <div className="flex items-center gap-3">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                  <label className="cursor-pointer px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors">
                    <Upload className="w-4 h-4 text-sky-600" />
                    <span>انتخاب عکس پرسنلی</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAvatarFile(file);
                          setAvatarPreview(URL.createObjectURL(file));
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Password Setup */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-xl">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-500" />
                  تعیین رمز عبور حساب کاربری پرتال مربی
                </span>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>تولید خودکار کلمه عبور قوی</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder={isEdit ? 'در صورت عدم تغییر، خالی بگذارید...' : 'رمز عبور اولیه (حداقل ۸ کاراکتر)...'}
                    className="w-full text-xs sm:text-sm pr-3 pl-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {form.password && (
                  <div className="text-[11px] text-slate-500 pt-1">
                    <PasswordRequirementsList password={form.password} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Address & Emergency Contact */}
        {currentStep === 2 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span>مرحله ۲: نشانی محل سکونت و مخاطب اضطراری</span>
              </h3>
              <Badge variant="info">مرحله ۲ از ۴</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  آدرس دقیق محل سکونت <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="استان، شهر، خیابان اصلی، کوچه، پلاک، واحد..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام و نام خانوادگی مخاطب اضطراری <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.emergency_contact_name}
                  onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                  placeholder="مثال: پدر / همسر / برادر"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تلفن تماس اضطراری <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={form.emergency_contact_phone}
                  onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                  placeholder="0912..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Coaching Credentials & Qualifications */}
        {currentStep === 3 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>مرحله ۳: شایستگی‌های حرفه‌ای، درجه و مدارک مربیگری</span>
              </h3>
              <Badge variant="info">مرحله ۳ از ۴</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  درجه رسمی مربی‌گری <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={form.coaching_degree}
                  onChange={(val) => handleChange('coaching_degree', val)}
                  options={degreeOptions}
                  color="sky"
                  size="md"
                  icon={Award}
                />
              </div>

              <div>
                <PersianDatePicker
                  label="تاریخ اخذ مربی‌گری *"
                  value={form.coaching_certificate_date}
                  onChange={(jalaliStr, gDate, gIso) => handleChange('coaching_certificate_date', gIso || '')}
                  placeholder="انتخاب تاریخ اخذ گواهی..."
                  color="sky"
                  size="md"
                  required
                  minYear={1350}
                  maxYear={1415}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  آپلود مدرک مربیگری (PDF یا تصویر) <span className="text-rose-500">*</span>
                </label>
                <label className="cursor-pointer flex items-center justify-between p-2.5 rounded-xl border border-dashed border-sky-400 dark:border-sky-600 bg-sky-50/50 dark:bg-sky-950/20 hover:bg-sky-100/50 transition-colors">
                  <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 truncate">
                    <Upload className="w-4 h-4 shrink-0 text-sky-600" />
                    <span className="truncate text-xs font-semibold">
                      {coachingCertificateFile ? coachingCertificateFile.name : coachingCertificateFilePreview ? 'مدرک بارگذاری شده (تغییر؟)' : 'انتخاب فایل گواهی...'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setCoachingCertificateFile(file);
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  سابقه تدریس و مربیگری (سال) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={form.years_of_experience}
                  onChange={(e) => handleChange('years_of_experience', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  بیوگرافی رسمی و رزومه مربی <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="متن بیوگرافی که اولیا و شناگران در صفحه مربیان مشاهده خواهند کرد..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white leading-relaxed"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  فایل پیوست رزومه (اختیاری)
                </label>
                <label className="cursor-pointer flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 truncate">
                    <FileText className="w-4 h-4 shrink-0 text-slate-500" />
                    <span className="truncate text-xs">
                      {resumeFile ? resumeFile.name : resumeFileName ? `پیوست فعلی: ${resumeFileName}` : 'بارگذاری فایل PDF یا Word رزومه (اختیاری)'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setResumeFile(file);
                        setResumeFileName(file.name);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مدرک و کارت نجات‌غریق
                </label>
                <input
                  type="text"
                  value={form.lifeguard_certificate}
                  onChange={(e) => handleChange('lifeguard_certificate', e.target.value)}
                  placeholder="مثال: نجات غریق درجه ۲ فدراسیون"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <PersianDatePicker
                  label="تاریخ انقضای کارت نجات‌غریق"
                  value={form.lifeguard_expiration}
                  onChange={(jalaliStr, gDate, gIso) => handleChange('lifeguard_expiration', gIso || '')}
                  placeholder="انتخاب تاریخ انقضا..."
                  color="sky"
                  size="md"
                  minYear={1390}
                  maxYear={1420}
                  clearable
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  سایر مهارت‌ها و دوره‌ها
                </label>
                <input
                  type="text"
                  value={form.additional_skills}
                  onChange={(e) => handleChange('additional_skills', e.target.value)}
                  placeholder="مثال: آب‌درمانی، کمک‌های اولیه، آمادگی جسمانی"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  سوابق کاری در باشگاه‌های قبلی
                </label>
                <textarea
                  rows={2}
                  value={form.previous_experience}
                  onChange={(e) => handleChange('previous_experience', e.target.value)}
                  placeholder="مربیگری در باشگاه‌های قبلی، افتخارات و جوایز..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Employment & Financial Model */}
        {currentStep === 4 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <span>مرحله ۴: اطلاعات حساب بانکی و شرایط همکاری</span>
              </h3>
              <Badge variant="info">مرحله ۴ از ۴</Badge>
            </div>

            {/* Banking Fields (Mandatory) */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-4">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                اطلاعات بانکی جهت واریز حق‌الزحمه مربی (الزامی)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    شماره کارت بانکی (۱۶ رقمی) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={19}
                    value={formatCardInput(form.card_number)}
                    onChange={(e) => handleChange('card_number', e.target.value.replace(/\D/g, ''))}
                    placeholder="6037-9918-XXXX-XXXX"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-center tracking-wider font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    شماره شبا بانکی (IBAN) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-500">
                      IR
                    </span>
                    <input
                      type="text"
                      dir="ltr"
                      maxLength={26}
                      value={form.shaba_number.replace(/^IR/i, '')}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\s+/g, '').toUpperCase();
                        handleChange('shaba_number', `IR${clean}`);
                      }}
                      placeholder="24 رقمی بدون IR"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-left tracking-wider"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Employment Status & Rates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  وضعیت اولیه همکاری <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={form.employment_status}
                  onChange={(val) => handleChange('employment_status', val)}
                  options={statusOptions}
                  size="md"
                  color="sky"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مدل محاسبه جبران خدمات <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={form.employment_type}
                  onChange={(val) => handleChange('employment_type', val)}
                  options={employmentTypeOptions}
                  size="md"
                  color="sky"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ساعات تعهد موظف هفتگی
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.contractual_weekly_hours}
                    onChange={(e) => handleChange('contractual_weekly_hours', e.target.value)}
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {form.employment_type === 'HOURLY' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نرخ دستمزد ساعتی (تومان) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={form.hourly_rate}
                    onChange={(e) => handleChange('hourly_rate', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono font-bold"
                    required
                  />
                </div>
              )}

              {form.employment_type === 'FIXED' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    حقوق ثابت ماهانه (تومان) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    value={form.fixed_monthly_salary}
                    onChange={(e) => handleChange('fixed_monthly_salary', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono font-bold"
                    required
                  />
                </div>
              )}

              {form.employment_type === 'PERCENTAGE' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      درصد سهم مربی از درآمد (۰ تا ۱۰۰) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.revenue_percentage}
                      onChange={(e) => handleChange('revenue_percentage', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      مبنای محاسبه درصد درآمد
                    </label>
                    <CustomSelect
                      value={form.percentage_revenue_basis}
                      onChange={(val) => handleChange('percentage_revenue_basis', val)}
                      options={revenueBasisOptions}
                      size="md"
                      color="sky"
                    />
                  </div>
                </>
              )}

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  <span>یادداشت‌های محرمانه اداری مدیریت (غیرقابل رویت برای مربی)</span>
                </label>
                <textarea
                  rows={2}
                  value={form.internal_notes}
                  onChange={(e) => handleChange('internal_notes', e.target.value)}
                  placeholder="توضیحات و توافقات پشت پرده، مصاحبه اولیه، ارزیابی گزینش..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-slate-800">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              className="gap-2 text-xs sm:text-sm"
            >
              <ArrowRight className="w-4 h-4" />
              <span>مرحله قبل</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/coaches')}
              className="text-xs sm:text-sm"
            >
              انصراف و بازگشت
            </Button>
          )}

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={handleNextStep}
              className="gap-2 text-xs sm:text-sm bg-sky-600 hover:bg-sky-500 text-white shadow-xs px-5 py-2.5"
            >
              <span>مرحله بعد</span>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-2 text-xs sm:text-sm bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/30 px-6 py-2.5"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'در حال ثبت...' : isEdit ? 'ذخیره تغییرات پرونده' : 'ثبت و تشکیل نهایی پرونده مربی'}</span>
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};
