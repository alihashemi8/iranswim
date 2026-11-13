import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Calendar, CreditCard, Home, Phone, Upload, CheckCircle2,
  AlertCircle, ShieldCheck, FileText, Sparkles, ArrowLeft, ArrowRight,
  Eye, MapPin, Briefcase, Award, Shield, FileCheck, Check
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';

export const CoachCompleteProfilePage = () => {
  const { user, updateUserData } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 4 Steps: 1: هویت فردی, 2: نشانی و ارتباط اضطراری, 3: درجه و مدارک مربیگری, 4: اطلاعات بانکی
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: هویت فردی
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('MALE');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Step 2: نشانی و ارتباط اضطراری
  const [address, setAddress] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Step 3: درجه و مدارک مربیگری
  const [coachingDegree, setCoachingDegree] = useState('GRADE_3');
  const [coachingCertificateDate, setCoachingCertificateDate] = useState('');
  const [coachingCertificateFile, setCoachingCertificateFile] = useState(null);
  const [coachingCertificateFilePreview, setCoachingCertificateFilePreview] = useState(null);
  const [yearsOfExperience, setYearsOfExperience] = useState(1);
  const [bio, setBio] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeFileName, setResumeFileName] = useState('');

  // Step 4: اطلاعات بانکی
  const [cardNumber, setCardNumber] = useState('');
  const [shabaNumber, setShabaNumber] = useState('');

  const [isCompletedBefore, setIsCompletedBefore] = useState(false);

  // Degree options matching backend CoachingDegree
  const degreeOptions = [
    { value: 'GRADE_3', label: 'مربیگری درجه ۳ فدراسیون' },
    { value: 'GRADE_2', label: 'مربیگری درجه ۲ فدراسیون' },
    { value: 'GRADE_1', label: 'مربیگری درجه ۱ فدراسیون' },
    { value: 'NATIONAL', label: 'مربیگری ملی شنا' },
    { value: 'INTERNATIONAL', label: 'مربیگری بین‌المللی (FINA / World Aquatics)' },
  ];

  // Fetch coach current profile data
  useEffect(() => {
    const fetchCoachData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/coaches/me/');
        const data = res.data;

        setFirstName(data.first_name || user?.first_name || '');
        setLastName(data.last_name || user?.last_name || '');
        setNationalId(data.national_id || user?.national_id || '');
        setDateOfBirth(data.date_of_birth || '');
        setGender(data.gender || 'MALE');
        if (data.avatar) setAvatarPreview(data.avatar);

        setAddress(data.address || '');
        setEmergencyContactName(data.emergency_contact_name || '');
        setEmergencyContactPhone(data.emergency_contact_phone || '');

        if (data.coaching_degree) setCoachingDegree(data.coaching_degree);
        setCoachingCertificateDate(data.coaching_certificate_date || '');
        if (data.coaching_certificate_file) {
          setCoachingCertificateFilePreview(data.coaching_certificate_file);
        }
        setYearsOfExperience(data.years_of_experience ?? 1);
        setBio(data.bio || '');
        if (data.resume_file) {
          setResumeFileName(data.resume_file.split('/').pop() || 'فایل رزومه');
        }

        setCardNumber(data.card_number || '');
        setShabaNumber(data.shaba_number || '');

        setIsCompletedBefore(Boolean(data.is_profile_completed));
      } catch (err) {
        console.error('Error fetching coach profile:', err);
        // Fallback to user auth data if coach profile not yet populated
        setFirstName(user?.first_name || '');
        setLastName(user?.last_name || '');
        setNationalId(user?.national_id || '');
      } finally {
        setLoading(false);
      }
    };

    fetchCoachData();
  }, [user]);

  // File selection helper
  const handleFileChange = (e, setFile, setPreview) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        toast.error('حداکثر حجم مجاز فایل ۸ مگابایت است.');
        return;
      }
      setFile(file);
      if (setPreview) {
        if (file.type.startsWith('image/')) {
          setPreview(URL.createObjectURL(file));
        } else {
          setPreview(file.name);
        }
      }
    }
  };

  // Step 1 Validation: نام، نام خانوادگی، کد ملی، تاریخ تولد
  const validateStep1 = () => {
    setError('');
    if (!firstName.trim()) {
      setError('وارد کردن نام الزامی است.');
      return false;
    }
    if (!lastName.trim()) {
      setError('وارد کردن نام خانوادگی الزامی است.');
      return false;
    }
    const cleanNid = nationalId.trim();
    if (!cleanNid || cleanNid.length !== 10 || !/^\d+$/.test(cleanNid)) {
      setError('کد ملی باید دقیقاً ۱۰ رقم عددی باشد.');
      return false;
    }
    if (!dateOfBirth) {
      setError('ثبت تاریخ تولد الزامی است.');
      return false;
    }
    return true;
  };

  // Step 2 Validation: آدرس محل سکونت، نام مخاطب اضطراری، شماره مخاطب اضطراری
  const validateStep2 = () => {
    setError('');
    if (!address.trim()) {
      setError('وارد کردن آدرس کامل محل سکونت الزامی است.');
      return false;
    }
    if (!emergencyContactName.trim()) {
      setError('وارد کردن نام و نام خانوادگی مخاطب اضطراری الزامی است.');
      return false;
    }
    const cleanEmergPhone = emergencyContactPhone.trim();
    if (!cleanEmergPhone) {
      setError('شماره تماس مخاطب اضطراری الزامی است.');
      return false;
    }
    if (!/^09\d{9}$/.test(cleanEmergPhone)) {
      setError('شماره تماس مخاطب اضطراری باید یک شماره موبایل معتبر ۱۱ رقمی (شروع با ۰۹) باشد.');
      return false;
    }
    return true;
  };

  // Step 3 Validation: درجه مربیگری، تاریخ اخذ، آپلود مدرک، سابقه کار، رزومه
  const validateStep3 = () => {
    setError('');
    if (!coachingDegree) {
      setError('انتخاب درجه مربیگری الزامی است.');
      return false;
    }
    if (!coachingCertificateDate) {
      setError('ثبت تاریخ اخذ مدرک مربیگری الزامی است.');
      return false;
    }
    if (!coachingCertificateFile && !coachingCertificateFilePreview) {
      setError('بارگذاری تصویر یا فایل مدرک مربیگری الزامی است.');
      return false;
    }
    if (yearsOfExperience === '' || Number(yearsOfExperience) < 0) {
      setError('سابقه کار مربیگری الزامی است.');
      return false;
    }
    if (!bio.trim() && !resumeFile && !resumeFileName) {
      setError('وارد کردن شرح رزومه یا بارگذاری فایل رزومه الزامی است.');
      return false;
    }
    return true;
  };

  // Step 4 Validation: شماره کارت (16 رقمی)، شماره شبا (حداقل 24 کاراکتر)
  const validateStep4 = () => {
    setError('');
    const cleanCard = cardNumber.replace(/\D/g, '');
    if (!cleanCard || cleanCard.length !== 16) {
      setError('شماره کارت بانکی باید ۱۶ رقم عددی معتبر باشد.');
      return false;
    }
    const cleanShaba = shabaNumber.replace(/\s+/g, '').toUpperCase();
    if (!cleanShaba || cleanShaba.length < 24) {
      setError('شماره شبا باید معتبر و حداقل ۲۴ نویسه (به همراه کد کشور) باشد.');
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

  // Final Submit
  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validateStep1() || !validateStep2() || !validateStep3() || !validateStep4()) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const formData = new FormData();
      formData.append('first_name', firstName.trim());
      formData.append('last_name', lastName.trim());
      formData.append('national_id', nationalId.trim());
      formData.append('date_of_birth', dateOfBirth);
      formData.append('gender', gender);
      if (avatar) formData.append('avatar', avatar);

      formData.append('address', address.trim());
      formData.append('emergency_contact_name', emergencyContactName.trim());
      formData.append('emergency_contact_phone', emergencyContactPhone.trim());

      formData.append('coaching_degree', coachingDegree);
      formData.append('coaching_certificate_date', coachingCertificateDate);
      if (coachingCertificateFile) formData.append('coaching_certificate_file', coachingCertificateFile);
      formData.append('years_of_experience', Number(yearsOfExperience || 0));
      formData.append('bio', bio.trim());
      if (resumeFile) formData.append('resume_file', resumeFile);

      const cleanCard = cardNumber.replace(/\D/g, '');
      const cleanShaba = shabaNumber.replace(/\s+/g, '').toUpperCase();
      formData.append('card_number', cleanCard);
      formData.append('shaba_number', cleanShaba);

      const res = await api.post('/coaches/me/complete/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(res.data.message || 'پرونده مربیگری شما با موفقیت تکمیل و ثبت شد.');

      if (updateUserData) {
        updateUserData({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          national_id: nationalId.trim(),
          is_profile_completed: true,
        });
      }

      navigate('/coach');
    } catch (err) {
      console.error(err);
      const data = err.response?.data;
      if (data?.detail) {
        setError(data.detail);
        toast.error(data.detail);
      } else if (data?.missing_fields) {
        setError(`لطفاً فیلدهای الزامی زیر را تکمیل نمایید: ${data.missing_fields.join('، ')}`);
        toast.error('برخی از اطلاعات الزامی هنوز تکمیل نشده‌اند.');
      } else {
        setError('خطا در ثبت و تکمیل پرونده مربیگری. لطفاً مجدداً تلاش نمایید.');
        toast.error('خطا در ذخیره اطلاعات پرونده مربی.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState type="dashboard" message="در حال دریافت اطلاعات پرونده مربی..." />;
  }

  // Format Card Number (XXXX-XXXX-XXXX-XXXX)
  const formatCardInput = (val) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    const parts = raw.match(/[\s\S]{1,4}/g) || [];
    return parts.join('-');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 px-4 sm:px-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-emerald-600 via-teal-600 to-cyan-700 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs sm:text-sm font-semibold mb-3">
              <Award className="w-4 h-4 text-emerald-300" />
              <span>پرتال تخصصی کادر مربیان آکادمی</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">
              {isCompletedBefore ? 'ویرایش و بازبینی پرونده مربیگری' : 'تکمیل پرونده پرسنلی و مدارک مربیگری'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 mt-2 leading-relaxed max-w-2xl">
              جهت فعال‌سازی کلاس‌ها، صدور احکام مربیگری و تسویه حقوق و دستمزد، تکمیل تمام ۱۴ فیلد الزامی مشخص‌شده در مراحل زیر طبق آیین‌نامه فدراسیون ضروری است.
            </p>
          </div>

          {isCompletedBefore && (
            <div className="flex items-center gap-2 bg-emerald-500/30 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-emerald-300/40 text-xs sm:text-sm font-bold shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-200" />
              <span>پرونده قبلاً تکمیل شده است</span>
            </div>
          )}
        </div>
      </div>

      {/* 4-Step Stepper Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs">
        <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
          {[
            { step: 1, title: 'هویت فردی', icon: User },
            { step: 2, title: 'نشانی و اضطراری', icon: MapPin },
            { step: 3, title: 'درجه و مدارک', icon: Award },
            { step: 4, title: 'اطلاعات بانکی', icon: CreditCard },
          ].map((item) => {
            const Icon = item.icon;
            const isCurrent = currentStep === item.step;
            const isDone = currentStep > item.step;
            return (
              <div
                key={item.step}
                className={`flex flex-col items-center gap-2 transition-all ${
                  isCurrent
                    ? 'text-emerald-600 dark:text-emerald-400 font-black'
                    : isDone
                    ? 'text-teal-600 dark:text-teal-400 font-bold'
                    : 'text-slate-400 dark:text-slate-500 font-medium'
                }`}
              >
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-xs sm:text-sm font-black transition-all ${
                    isCurrent
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-4 ring-emerald-100 dark:ring-emerald-950/60 scale-105'
                      : isDone
                      ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <div className="text-[11px] sm:text-xs">
                  <span className="hidden sm:inline">مرحله {item.step}: </span>
                  <span>{item.title}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-300 rounded-full"
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

      {/* Wizard Step Content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 shadow-xs">
        {/* STEP 1: هویت فردی و مشخصات کاربری */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                <span>مرحله ۱: هویت فردی و مشخصات شناسنامه‌ای مربی</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                اطلاعات فردی و کد ملی مربی طبق مندرجات شناسنامه و کارت ملی
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام مربی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="مثال: علی"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام خانوادگی مربی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="مثال: حسینی"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  کد ملی ۱۰ رقمی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  dir="ltr"
                  maxLength={10}
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
                  placeholder="0012345678"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تاریخ تولد <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  جنسیت <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setGender('MALE')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      gender === 'MALE'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    آقا / مرد
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('FEMALE')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      gender === 'FEMALE'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    خانم / زن
                  </button>
                </div>
              </div>

              <div>
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
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>انتخاب تصویر</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setAvatar, setAvatarPreview)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: نشانی و ارتباط اضطراری */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span>مرحله ۲: نشانی محل سکونت و مخاطب اضطراری</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                اطلاعات تماس جهت هماهنگی‌های اداری و موارد اضطراری درون استخر
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  آدرس دقیق محل سکونت <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="استان، شهر، خیابان اصلی، کوچه، پلاک، واحد..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-colors leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام و نام خانوادگی مخاطب اضطراری <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="مثال: رضا حسینی (برادر / همسر / پدر)"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شماره تماس مخاطب اضطراری <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    dir="ltr"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    placeholder="0912..."
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: درجه، مدارک و سوابق مربیگری */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <span>مرحله ۳: شایستگی‌ها، درجه و مدارک مربیگری</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                اطلاعات گواهی رسمی مربیگری، تاریخ اخذ، سابقه و رزومه حرفه‌ای
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  درجه رسمی مربی‌گری <span className="text-rose-500">*</span>
                </label>
                <select
                  value={coachingDegree}
                  onChange={(e) => setCoachingDegree(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-medium"
                  required
                >
                  {degreeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تاریخ اخذ مربی‌گری <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={coachingCertificateDate}
                  onChange={(e) => setCoachingCertificateDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  سابقه کار و تدریس (سال) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  آپلود مدرک مربیگری (PDF یا تصویر) <span className="text-rose-500">*</span>
                </label>
                <label className="cursor-pointer flex items-center justify-between p-2.5 rounded-xl border border-dashed border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/50 transition-colors">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 truncate">
                    <Upload className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span className="truncate text-xs font-semibold">
                      {coachingCertificateFile ? coachingCertificateFile.name : coachingCertificateFilePreview ? 'مدرک قبلاً بارگذاری شده (تغییر؟)' : 'انتخاب فایل گواهی...'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => handleFileChange(e, setCoachingCertificateFile, setCoachingCertificateFilePreview)}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  متن رزومه و خلاصه سوابق حرفه‌ای <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="سوابق کاری، مربیگری در استخرها و باشگاه‌ها، افتخارات، شاگردان قهرمان..."
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
                    onChange={(e) => handleFileChange(e, setResumeFile, (f) => setResumeFileName(f.name))}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: اطلاعات بانکی و واریز حقوق */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <span>مرحله ۴: اطلاعات حساب بانکی و تأیید نهایی</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                اطلاعات شماره کارت و شماره شبا جهت واریز حق‌التدریس و دستمزد ماهیانه
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شماره کارت بانکی (۱۶ رقمی) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={19}
                    value={formatCardInput(cardNumber)}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="6037-9918-XXXX-XXXX"
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono text-center tracking-wider"
                    required
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  کارت بانکی باید به نام شخص مربی ({firstName || '...'} {lastName || '...'}) باشد.
                </span>
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
                    value={shabaNumber.replace(/^IR/i, '')}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\s+/g, '').toUpperCase();
                      setShabaNumber(`IR${clean}`);
                    }}
                    placeholder="24 رقمی بدون IR"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono text-left tracking-wider"
                    required
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  شماره شبا بدون احتساب حروف IR دارای ۲۴ رقم عددی است.
                </span>
              </div>
            </div>

            {/* Verification Summary Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>خلاصه بازبینی اطلاعات پرونده مربیگری:</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block mb-0.5 text-[11px]">نام و نام خانوادگی:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{firstName} {lastName}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block mb-0.5 text-[11px]">کد ملی:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{nationalId}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block mb-0.5 text-[11px]">درجه مربیگری:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {degreeOptions.find((d) => d.value === coachingDegree)?.label || coachingDegree}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block mb-0.5 text-[11px]">سابقه کار:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{yearsOfExperience} سال</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls Footer */}
        <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
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
            <div />
          )}

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={handleNextStep}
              className="gap-2 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
            >
              <span>مرحله بعد</span>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-2 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 px-6 py-2.5"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{submitting ? 'در حال ثبت نهایی...' : 'ثبت نهایی و تکمیل پرونده مربیگری'}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
