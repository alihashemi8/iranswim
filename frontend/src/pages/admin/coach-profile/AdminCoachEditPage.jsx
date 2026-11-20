import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  UserCheck, ArrowRight, ArrowLeft, Save, User, Phone, Hash, Calendar,
  Briefcase, MapPin, ShieldAlert, Award, CreditCard, Clock, Lock,
  Eye, EyeOff, AlertCircle, CheckCircle2, Sparkles, KeyRound,
  FileText, Upload, X, Shield, RefreshCw, Check, FileCheck
} from 'lucide-react';
import api from '../../../api/client';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { CustomSelect } from '../../../components/common/CustomSelect';
import { PersianDatePicker } from '../../../components/common/PersianDatePicker';
import { LoadingState } from '../../../components/common/LoadingState';
import { BackButton } from '../../../components/common/BackButton';
import { useToast } from '../../../context/ToastContext';
import { validatePassword, PasswordRequirementsList } from '../../../utils/passwordValidator';
import { toEnglishDigits } from '../../../utils/digits';

export const AdminCoachEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const returnUrl = location.state?.from || `/admin/coaches/${id}`;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');
  const [coach, setCoach] = useState(null);

  const [form, setForm] = useState({
    // Step 1: Personal Identity
    first_name: '',
    last_name: '',
    phone: '',
    national_id: '',
    personnel_id: '',
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
    years_of_experience: '',
    bio: '',
    lifeguard_certificate: '',
    lifeguard_expiration: '',
    previous_experience: '',
    additional_skills: '',
    retraining_year: '',
    retraining_status: 'UNUPLOADED',
    retraining_expiry_date: '',
    retraining_rejection_reason: '',

    // Step 4: Bank & Employment
    card_number: '',
    shaba_number: '',
    employment_status: 'ACTIVE',
    employment_type: 'HOURLY',
    hourly_rate: '0',
    fixed_monthly_salary: '0',
    revenue_percentage: '0',
    percentage_revenue_basis: 'COURSE_GROSS',
    contractual_weekly_hours: 20,
    display_order: 1,
    internal_notes: '',
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coachingCertificateFile, setCoachingCertificateFile] = useState(null);
  const [coachingCertificateFilePreview, setCoachingCertificateFilePreview] = useState(null);
  const [retrainingCertificateFile, setRetrainingCertificateFile] = useState(null);
  const [retrainingCertificateFilePreview, setRetrainingCertificateFilePreview] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeFileName, setResumeFileName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const retrainingStatusOptions = [
    { value: 'UNUPLOADED', label: 'بارگذاری‌نشده' },
    { value: 'PENDING', label: 'در انتظار بررسی و تأیید' },
    { value: 'APPROVED', label: 'تأییدشده' },
    { value: 'REJECTED', label: 'رد شده / نیازمند اصلاح' },
  ];

  const degreeOptions = [
    { value: 'GRADE_3', label: 'مربیگری درجه ۳ فدراسیون', description: 'آموزش شنا مقدماتی و تکنیک‌های ۴ شنا' },
    { value: 'GRADE_2', label: 'مربیگری درجه ۲ فدراسیون', description: 'تیم‌های پایه و دوره‌های نیمه‌پیشرفته' },
    { value: 'GRADE_1', label: 'مربیگری درجه ۱ فدراسیون', description: 'تیم‌های استانی و مسابقات حرفه‌ای' },
    { value: 'NATIONAL', label: 'مربیگری ملی شنا', description: 'تیم‌های لیگ برتر و منتخب استان' },
    { value: 'INTERNATIONAL', label: 'مربیگری بین‌المللی (FINA / World Aquatics)', description: 'مربیگری دوره‌های جهانی و بین‌المللی' },
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

  // Fetch Coach Data
  useEffect(() => {
    const fetchCoach = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/coaches/${id}/`);
        const data = res.data;
        setCoach(data);

        setForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          national_id: data.national_id || '',
          personnel_id: data.personnel_id || '',
          gender: data.gender || 'MALE',
          date_of_birth: data.date_of_birth || '',
          password: '',
          emergency_contact_name: data.emergency_contact_name || '',
          emergency_contact_phone: data.emergency_contact_phone || '',
          address: data.address || '',
          coaching_degree: data.coaching_degree || 'GRADE_3',
          coaching_certificate_date: data.coaching_certificate_date || '',
          years_of_experience: data.years_of_experience !== null && data.years_of_experience !== undefined ? String(data.years_of_experience) : '',
          bio: data.bio || '',
          lifeguard_certificate: data.lifeguard_certificate || '',
          lifeguard_expiration: data.lifeguard_expiration || '',
          previous_experience: data.previous_experience || '',
          additional_skills: data.additional_skills || '',
          retraining_year: data.retraining_year || '',
          retraining_status: data.retraining_status || 'UNUPLOADED',
          retraining_expiry_date: data.retraining_expiry_date || '',
          retraining_rejection_reason: data.retraining_rejection_reason || '',
          card_number: data.card_number || '',
          shaba_number: data.shaba_number || '',
          employment_status: data.employment_status || 'ACTIVE',
          employment_type: data.employment_type || 'HOURLY',
          hourly_rate: String(parseInt(data.hourly_rate || '0', 10)),
          fixed_monthly_salary: String(parseInt(data.fixed_monthly_salary || '0', 10)),
          revenue_percentage: String(parseFloat(data.revenue_percentage || '0')),
          percentage_revenue_basis: data.percentage_revenue_basis || 'COURSE_GROSS',
          contractual_weekly_hours: data.contractual_weekly_hours || 20,
          display_order: data.display_order ?? 1,
          internal_notes: data.internal_notes || '',
        });

        if (data.avatar) {
          setAvatarPreview(data.avatar);
        }
        if (data.coaching_certificate_file) {
          setCoachingCertificateFilePreview(data.coaching_certificate_file);
        }
        if (data.retraining_certificate_file_url || data.retraining_certificate_file) {
          setRetrainingCertificateFilePreview(data.retraining_certificate_file_url || data.retraining_certificate_file);
        }
        if (data.resume_file) {
          setResumeFileName(data.resume_file.split('/').pop() || 'فایل رزومه');
        }
      } catch (err) {
        console.error('Error fetching coach details:', err);
        toast.error('خطا در دریافت اطلاعات مربی');
        navigate(returnUrl);
      } finally {
        setLoading(false);
      }
    };

    fetchCoach();
  }, [id]);

  const handleChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$!';
    let pass = 'Coach@';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pass += '9';
    setForm((prev) => ({ ...prev, password: pass }));
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
        setError('رمز عبور جدید الزامات امنیتی را برآورده نمی‌کند.');
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

  // Submit Handler
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
      if (form.personnel_id) formData.append('personnel_id', form.personnel_id.trim());
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

      if (retrainingCertificateFile) formData.append('retraining_certificate_file', retrainingCertificateFile);
      if (form.retraining_year) formData.append('retraining_year', Number(form.retraining_year));
      if (form.retraining_status) formData.append('retraining_status', form.retraining_status);
      if (form.retraining_expiry_date) formData.append('retraining_expiry_date', form.retraining_expiry_date);
      if (form.retraining_rejection_reason) formData.append('retraining_rejection_reason', form.retraining_rejection_reason.trim());

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
      if (form.display_order !== undefined) {
        formData.append('display_order', Number(form.display_order || 1));
      }
      formData.append('internal_notes', form.internal_notes.trim());

      await api.patch(`/coaches/${id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('مشخصات پرونده مربی با موفقیت به‌روزرسانی شد.');
      navigate(returnUrl);
    } catch (err) {
      console.error('Error updating coach:', err);
      const data = err.response?.data;
      if (typeof data === 'object' && data !== null) {
        const errors = [];
        for (const [key, value] of Object.entries(data)) {
          const valMsg = Array.isArray(value) ? value.join(' ') : String(value);
          errors.push(`${key}: ${valMsg}`);
        }
        const msg = errors.length > 0 ? errors.join(' | ') : 'خطا در به‌روزرسانی مشخصات مربی';
        setError(msg);
        toast.error(msg);
      } else {
        const msg = err.response?.data?.detail || 'خطا در به‌روزرسانی مشخصات مربی';
        setError(msg);
        toast.error(msg);
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

  if (loading) {
    return <LoadingState type="form" message="در حال دریافت اطلاعات پرونده مربی..." />;
  }

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <BackButton fallback={returnUrl} title="بازگشت" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">مدیریت مربیان</span>
              <span className="text-xs text-slate-300 dark:text-slate-700">/</span>
              <Link to={returnUrl} className="text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-sky-600 truncate">
                {coach?.full_name || 'پرونده مربی'}
              </Link>
              <span className="text-xs text-slate-300 dark:text-slate-700">/</span>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400">ویرایش پرونده</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-sky-600 shrink-0" />
              <span>ویرایش مشخصات مربی: {coach?.full_name}</span>
            </h1>
          </div>
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
                <div className="text-xs sm:text-sm font-bold leading-tight">
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
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-semibold">{error}</div>
        </div>
      )}

      {/* Form Steps */}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {/* STEP 1: Personal & Identity Info */}
        {currentStep === 1 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600 shrink-0" />
                <span>مرحله ۱: مشخصات هویتی و پرسنلی مربی</span>
              </h3>
              <Badge variant="info" className="text-xs sm:text-sm px-2.5 py-1">مرحله ۱ از ۴</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm sm:text-base">
              <div>
                <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  نام <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  نام خانوادگی <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  شماره همراه (نام کاربری) <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    dir="ltr"
                    inputMode="numeric"
                    maxLength={11}
                    value={form.phone}
                    onChange={(e) => handleChange('phone', toEnglishDigits(e.target.value).replace(/\D/g, ''))}
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  کد ملی ده رقمی <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    dir="ltr"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.national_id}
                    onChange={(e) => handleChange('national_id', toEnglishDigits(e.target.value).replace(/\D/g, ''))}
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  کد پرسنلی
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={form.personnel_id}
                  onChange={(e) => handleChange('personnel_id', e.target.value)}
                  placeholder="مثال: C-104"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm"
                />
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

              <div>
                <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  جنسیت مربی <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleChange('gender', 'MALE')}
                    className={`py-2.5 px-3 rounded-xl text-sm sm:text-base font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
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
                    className={`py-2.5 px-3 rounded-xl text-sm sm:text-base font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      form.gender === 'FEMALE'
                        ? 'bg-pink-50 dark:bg-pink-950/60 border-pink-400 text-pink-700 dark:text-pink-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>خانم / زن</span>
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
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
                  <label className="cursor-pointer px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 transition-colors">
                    <Upload className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>انتخاب تصویر جدید</span>
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

            {/* Password Reset */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-xl">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base flex items-center gap-2">
                  <KeyRound className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0" />
                  تنظیم مجدد کلمه عبور مربی (اختیاری)
                </span>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-xs sm:text-sm text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>تولید کلمه عبور قوی</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="در صورت عدم تمایل به تغییر، خالی بگذارید..."
                    className="w-full text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm pr-3 pl-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
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
                  <div className="text-xs text-slate-500 pt-1">
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
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 shrink-0" />
                <span>مرحله ۲: نشانی محل سکونت و مخاطب اضطراری</span>
              </h3>
              <Badge variant="info" className="text-xs sm:text-sm px-2.5 py-1">مرحله ۲ از ۴</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base">
              <div className="sm:col-span-2">
                <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  آدرس دقیق محل سکونت <span className="text-rose-500 font-bold">*</span>
                </label>
                <textarea
                  rows={3}
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="استان، شهر، خیابان اصلی، کوچه، پلاک، واحد..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  نام و نام خانوادگی مخاطب اضطراری <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={form.emergency_contact_name}
                  onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                  placeholder="مثال: پدر / همسر / برادر"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  تلفن تماس اضطراری <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  inputMode="numeric"
                  maxLength={11}
                  value={form.emergency_contact_phone}
                  onChange={(e) => handleChange('emergency_contact_phone', toEnglishDigits(e.target.value).replace(/\D/g, ''))}
                  placeholder="09123456789"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm"
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
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 shrink-0" />
                <span>مرحله ۳: شایستگی‌های حرفه‌ای، درجه و مدارک مربیگری</span>
              </h3>
              <Badge variant="info" className="text-xs sm:text-sm px-2.5 py-1">مرحله ۳ از ۴</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base">
              <div>
                <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  درجه رسمی مربی‌گری <span className="text-rose-500 font-bold">*</span>
                </label>
                <CustomSelect
                  value={form.coaching_degree}
                  onChange={(val) => handleChange('coaching_degree', val)}
                  options={degreeOptions}
                  color="sky"
                  size="md"
                  textSize="text-sm sm:text-base"
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
                <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  آپلود مدرک مربیگری (PDF یا تصویر) <span className="text-rose-500 font-bold">*</span>
                </label>
                <label className="cursor-pointer flex items-center justify-between p-2.5 rounded-xl border border-dashed border-sky-400 dark:border-sky-600 bg-sky-50/50 dark:bg-sky-950/20 hover:bg-sky-100/50 transition-colors">
                  <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 truncate">
                    <Upload className="w-4 h-4 shrink-0 text-sky-600" />
                    <span className="truncate text-xs sm:text-sm font-bold">
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
                <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  سابقه تدریس و مربیگری (سال) <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  dir="ltr"
                  inputMode="numeric"
                  maxLength={2}
                  value={form.years_of_experience}
                  onChange={(e) => handleChange('years_of_experience', toEnglishDigits(e.target.value).replace(/\D/g, ''))}
                  placeholder="مثلاً ۵"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono text-center text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  بیوگرافی رسمی و رزومه مربی <span className="text-rose-500 font-bold">*</span>
                </label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="متن بیوگرافی که اولیا و شناگران در صفحه مربیان مشاهده خواهند کرد..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm leading-relaxed"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  فایل پیوست رزومه (اختیاری)
                </label>
                <label className="cursor-pointer flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 truncate">
                    <FileText className="w-4 h-4 shrink-0 text-slate-500" />
                    <span className="truncate text-xs sm:text-sm font-semibold">
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
                <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  مدرک و کارت نجات‌غریق
                </label>
                <input
                  type="text"
                  value={form.lifeguard_certificate}
                  onChange={(e) => handleChange('lifeguard_certificate', e.target.value)}
                  placeholder="مثال: نجات غریق درجه ۲ فدراسیون"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm"
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
                <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  سایر مهارت‌ها و دوره‌ها
                </label>
                <input
                  type="text"
                  value={form.additional_skills}
                  onChange={(e) => handleChange('additional_skills', e.target.value)}
                  placeholder="مثال: آب‌درمانی، کمک‌های اولیه، آمادگی جسمانی"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  سوابق کاری در باشگاه‌های قبلی
                </label>
                <textarea
                  rows={2}
                  value={form.previous_experience}
                  onChange={(e) => handleChange('previous_experience', e.target.value)}
                  placeholder="مربیگری در باشگاه‌های قبلی، افتخارات و جوایز..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm"
                />
              </div>

              {/* بازآموزی سال جاری */}
              <div className="sm:col-span-2 p-4 rounded-xl border border-emerald-300 dark:border-emerald-700/80 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200 dark:border-emerald-800">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
                    <span>گواهی بازآموزی سال جاری</span>
                  </h4>
                  <span className="text-xs sm:text-sm text-slate-500 font-mono">
                    اعتبار تا پایان اسفند {form.retraining_year || 1405}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      آپلود یا جایگزینی فایل بازآموزی
                    </label>
                    <label className="cursor-pointer flex items-center justify-between p-2.5 rounded-xl border border-dashed border-emerald-400 dark:border-emerald-600 bg-white dark:bg-slate-900 hover:bg-emerald-50/50 transition-colors">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 truncate">
                        <Upload className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span className="truncate text-xs sm:text-sm font-bold">
                          {retrainingCertificateFile ? retrainingCertificateFile.name : retrainingCertificateFilePreview ? 'فایل موجود است (تغییر؟)' : 'انتخاب فایل گواهی بازآموزی...'}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setRetrainingCertificateFile(file);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      وضعیت تأیید بازآموزی
                    </label>
                    <CustomSelect
                      value={form.retraining_status}
                      onChange={(val) => handleChange('retraining_status', val)}
                      options={retrainingStatusOptions}
                      color="emerald"
                      size="md"
                      textSize="text-sm sm:text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      سال بازآموزی
                    </label>
                    <input
                      type="number"
                      value={form.retraining_year}
                      onChange={(e) => handleChange('retraining_year', e.target.value)}
                      placeholder="1405"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm sm:text-base"
                    />
                  </div>

                  <div>
                    <PersianDatePicker
                      label="تاریخ انقضای گواهی بازآموزی"
                      value={form.retraining_expiry_date}
                      onChange={(jalaliStr, gDate, gIso) => handleChange('retraining_expiry_date', gIso || '')}
                      placeholder="انتخاب تاریخ انقضا..."
                      color="emerald"
                      size="md"
                      minYear={1390}
                      maxYear={1420}
                      clearable
                    />
                  </div>

                  {form.retraining_status === 'REJECTED' && (
                    <div className="sm:col-span-2">
                      <label className="block text-sm sm:text-[15px] font-bold text-rose-700 dark:text-rose-300 mb-1.5">
                        دلیل عدم تأیید گواهی بازآموزی
                      </label>
                      <input
                        type="text"
                        value={form.retraining_rejection_reason}
                        onChange={(e) => handleChange('retraining_rejection_reason', e.target.value)}
                        placeholder="علت رد گواهی جهت نمایش به مربی..."
                        className="w-full p-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm sm:text-base"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Employment & Financial Model */}
        {currentStep === 4 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 shrink-0" />
                <span>مرحله ۴: اطلاعات حساب بانکی و شرایط همکاری</span>
              </h3>
              <Badge variant="info" className="text-xs sm:text-sm px-2.5 py-1">مرحله ۴ از ۴</Badge>
            </div>

            {/* Banking Fields (Mandatory) */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-4">
              <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
                اطلاعات بانکی جهت واریز حق‌الزحمه مربی (الزامی)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base">
                <div>
                  <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    شماره کارت بانکی (۱۶ رقمی) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    inputMode="numeric"
                    maxLength={19}
                    value={formatCardInput(form.card_number)}
                    onChange={(e) => handleChange('card_number', toEnglishDigits(e.target.value).replace(/\D/g, ''))}
                    placeholder="6037-9918-XXXX-XXXX"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-center tracking-wider font-bold text-sm sm:text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    شماره شبا بانکی (IBAN) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono font-bold text-slate-500">
                      IR
                    </span>
                    <input
                      type="text"
                      dir="ltr"
                      inputMode="numeric"
                      maxLength={26}
                      value={form.shaba_number.replace(/^IR/i, '')}
                      onChange={(e) => {
                        const clean = toEnglishDigits(e.target.value).replace(/[^0-9]/g, '');
                        handleChange('shaba_number', `IR${clean}`);
                      }}
                      placeholder="24 رقمی بدون IR"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-left tracking-wider text-sm sm:text-base font-bold placeholder:text-xs sm:placeholder:text-sm"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Employment Status & Rates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm sm:text-base pt-2">
              <div>
                <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  وضعیت همکاری <span className="text-rose-500 font-bold">*</span>
                </label>
                <CustomSelect
                  value={form.employment_status}
                  onChange={(val) => handleChange('employment_status', val)}
                  options={statusOptions}
                  size="md"
                  textSize="text-sm sm:text-base"
                  color="sky"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  مدل محاسبه جبران خدمات <span className="text-rose-500 font-bold">*</span>
                </label>
                <CustomSelect
                  value={form.employment_type}
                  onChange={(val) => handleChange('employment_type', val)}
                  options={employmentTypeOptions}
                  size="md"
                  textSize="text-sm sm:text-base"
                  color="sky"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
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
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono text-sm sm:text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ترتیب نمایش در وب‌سایت
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.display_order || 1}
                  onChange={(e) => handleChange('display_order', Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono text-sm sm:text-base"
                />
              </div>

              {form.employment_type === 'HOURLY' && (
                <div>
                  <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    نرخ دستمزد ساعتی (تومان) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={form.hourly_rate}
                    onChange={(e) => handleChange('hourly_rate', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono font-bold text-sm sm:text-base"
                    required
                  />
                </div>
              )}

              {form.employment_type === 'FIXED' && (
                <div>
                  <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    حقوق ثابت ماهانه (تومان) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    value={form.fixed_monthly_salary}
                    onChange={(e) => handleChange('fixed_monthly_salary', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono font-bold text-sm sm:text-base"
                    required
                  />
                </div>
              )}

              {form.employment_type === 'PERCENTAGE' && (
                <>
                  <div>
                    <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      درصد سهم مربی از درآمد (۰ تا ۱۰۰) <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.revenue_percentage}
                      onChange={(e) => handleChange('revenue_percentage', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono font-bold text-sm sm:text-base"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      مبنای محاسبه درصد درآمد
                    </label>
                    <CustomSelect
                      value={form.percentage_revenue_basis}
                      onChange={(val) => handleChange('percentage_revenue_basis', val)}
                      options={revenueBasisOptions}
                      size="md"
                      textSize="text-sm sm:text-base"
                      color="sky"
                    />
                  </div>
                </>
              )}

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>یادداشت‌های محرمانه اداری مدیریت (غیرقابل رویت برای مربی)</span>
                </label>
                <textarea
                  rows={2}
                  value={form.internal_notes}
                  onChange={(e) => handleChange('internal_notes', e.target.value)}
                  placeholder="توضیحات و توافقات پشت پرده، مصاحبه اولیه، ارزیابی گزینش..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="flex flex-row items-center justify-between gap-2 sm:gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              className="gap-1.5 sm:gap-2 text-sm sm:text-base px-3 sm:px-4 flex-1 sm:flex-initial sm:min-w-[140px] justify-center min-h-[42px] sm:min-h-[44px] min-w-0 !shrink font-bold"
            >
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span className="truncate">مرحله قبل</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(returnUrl)}
              className="gap-1.5 sm:gap-2 text-sm sm:text-base px-3 sm:px-4 flex-1 sm:flex-initial sm:min-w-[140px] justify-center min-h-[42px] sm:min-h-[44px] min-w-0 !shrink font-bold"
            >
              <span className="truncate">انصراف و بازگشت</span>
            </Button>
          )}

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={handleNextStep}
              className="gap-1.5 sm:gap-2 text-sm sm:text-base bg-sky-600 hover:bg-sky-500 text-white shadow-xs px-3 sm:px-5 flex-1 sm:flex-initial sm:min-w-[140px] justify-center min-h-[42px] sm:min-h-[44px] font-bold min-w-0 !shrink"
            >
              <span className="truncate">مرحله بعد</span>
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-1.5 sm:gap-2 text-sm sm:text-base bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/30 px-3 sm:px-6 py-2.5 flex-1 sm:flex-initial sm:min-w-[160px] justify-center min-h-[42px] sm:min-h-[44px] font-bold min-w-0 !shrink"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span className="truncate hidden sm:inline">
                {submitting ? 'در حال ثبت...' : 'ذخیره تغییرات پرونده'}
              </span>
              <span className="truncate sm:hidden">
                {submitting ? 'در حال ثبت...' : 'ذخیره پرونده'}
              </span>
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};
