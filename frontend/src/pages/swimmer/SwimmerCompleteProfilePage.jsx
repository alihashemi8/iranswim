import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Calendar, CreditCard, Home, Phone, Upload, CheckCircle2,
  AlertCircle, ShieldCheck, FileText, Image as ImageIcon, School,
  Sparkles, ArrowLeft, ArrowRight, Trash2, Eye, MapPin
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { MapLocationPicker } from '../../components/common/MapLocationPicker';

export const SwimmerCompleteProfilePage = () => {
  const { user, updateUserData } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Current Step: 1, 2, or 3
  const [currentStep, setCurrentStep] = useState(1);

  // Form Fields - Step 1: Personal Info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [gender, setGender] = useState('MALE');
  const [schoolName, setSchoolName] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Form Fields - Step 2: Parent Phones & Address
  const [fatherPhone, setFatherPhone] = useState('');
  const [motherPhone, setMotherPhone] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  // Form Fields - Step 3: Documents
  const [birthCertImage, setBirthCertImage] = useState(null);
  const [birthCertPreview, setBirthCertPreview] = useState(null);

  const [nationalCardImage, setNationalCardImage] = useState(null);
  const [nationalCardPreview, setNationalCardPreview] = useState(null);

  const [sportsInsuranceImage, setSportsInsuranceImage] = useState(null);
  const [sportsInsurancePreview, setSportsInsurancePreview] = useState(null);

  const [isCompletedBefore, setIsCompletedBefore] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get('/swimmers/me/');
        const data = res.data;

        setFirstName(data.first_name || user?.first_name || '');
        setLastName(data.last_name || user?.last_name || '');
        setNationalId(data.national_id || user?.national_id || '');
        setDateOfBirth(data.date_of_birth || '');
        setFatherName(data.father_name || '');
        setGender(data.gender || 'MALE');
        setSchoolName(data.school_name || '');

        setFatherPhone(data.father_phone || '');
        setMotherPhone(data.mother_phone || '');
        setAddress(data.address || '');
        setLatitude(data.latitude || 35.6892);
        setLongitude(data.longitude || 51.3890);

        if (data.avatar) setAvatarPreview(data.avatar);
        if (data.birth_certificate_image) setBirthCertPreview(data.birth_certificate_image);
        if (data.national_card_image) setNationalCardPreview(data.national_card_image);
        if (data.sports_insurance_image) setSportsInsurancePreview(data.sports_insurance_image);

        setIsCompletedBefore(Boolean(data.is_profile_completed));
      } catch (err) {
        console.error(err);
        toast.error('خطا در دریافت اطلاعات پرونده شناگر');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // File selection handlers
  const handleFileChange = (e, setFile, setPreview) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حداکثر حجم مجاز تصویر ۵ مگابایت می‌باشد.');
        return;
      }
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // Step 1 Validation
  const validateStep1 = () => {
    setError('');
    if (!firstName.trim() || !lastName.trim()) {
      setError('نام و نام خانوادگی شناگر الزامی است.');
      return false;
    }
    if (!fatherName.trim()) {
      setError('نام پدر شناگر الزامی است.');
      return false;
    }
    const cleanNationalId = nationalId.trim();
    if (!cleanNationalId || cleanNationalId.length !== 10 || !/^\d+$/.test(cleanNationalId)) {
      setError('کد ملی شناگر باید ۱۰ رقم عددی معتبر باشد.');
      return false;
    }
    if (!dateOfBirth) {
      setError('تاریخ تولد شناگر الزامی است.');
      return false;
    }
    if (!gender) {
      setError('تعیین جنسیت شناگر الزامی است.');
      return false;
    }
    return true;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    setError('');
    const cleanFatherPhone = fatherPhone.trim();
    const cleanMotherPhone = motherPhone.trim();
    if (!cleanFatherPhone && !cleanMotherPhone) {
      setError('ثبت حداقل یکی از شماره‌های تماس پدر یا مادر الزامی است.');
      return false;
    }
    if (!address.trim()) {
      setError('آدرس دقیق منزل الزامی است.');
      return false;
    }
    return true;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    setError('');
    if (!birthCertImage && !birthCertPreview) {
      setError('بارگذاری تصویر صفحه اول شناسنامه الزامی است.');
      return false;
    }
    if (!nationalCardImage && !nationalCardPreview) {
      setError('بارگذاری تصویر کارت ملی الزامی است.');
      return false;
    }
    if (!sportsInsuranceImage && !sportsInsurancePreview) {
      setError('بارگذاری تصویر کارت بیمه ورزشی الزامی است.');
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
    }
  };

  const handlePrevStep = () => {
    setError('');
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    if (!validateStep2()) {
      setCurrentStep(2);
      return;
    }
    if (!validateStep3()) {
      return;
    }

    // Prepare FormData
    const formData = new FormData();
    formData.append('first_name', firstName.trim());
    formData.append('last_name', lastName.trim());
    formData.append('national_id', nationalId.trim());
    formData.append('date_of_birth', dateOfBirth);
    formData.append('father_name', fatherName.trim());
    formData.append('father_phone', fatherPhone.trim());
    formData.append('mother_phone', motherPhone.trim());
    formData.append('gender', gender);
    formData.append('address', address.trim());
    if (latitude) formData.append('latitude', latitude);
    if (longitude) formData.append('longitude', longitude);
    if (schoolName.trim()) formData.append('school_name', schoolName.trim());

    if (avatar) formData.append('avatar', avatar);
    if (birthCertImage) formData.append('birth_certificate_image', birthCertImage);
    if (nationalCardImage) formData.append('national_card_image', nationalCardImage);
    if (sportsInsuranceImage) formData.append('sports_insurance_image', sportsInsuranceImage);

    setSaving(true);
    try {
      const res = await api.post('/swimmers/me/complete/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('پرونده و مدارک هویتی شناگر با موفقیت تکمیل و ثبت گردید!');
      updateUserData({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        is_profile_completed: true,
      });

      navigate('/swimmer');
    } catch (err) {
      console.error(err);
      const data = err.response?.data;
      let msg = 'خطا در ثبت نهایی اطلاعات. لطفاً موارد ستاره‌دار را مجدداً بررسی فرمایید.';
      if (data?.detail) msg = data.detail;
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState type="form" message="در حال دریافت پرونده شناگر..." />;
  }

  // Steps definition for the Stepper Bar
  const steps = [
    { number: 1, title: 'اطلاعات هویتی شناگر', icon: User, desc: 'مشخصات فردی و سجلی' },
    { number: 2, title: 'نشانی و تماس اولیاء', icon: Home, desc: 'تلفن والدین و نقشه منزل' },
    { number: 3, title: 'بارگذاری مدارک هویتی', icon: ShieldCheck, desc: 'شناسنامه، کارت ملی، بیمه' },
  ];

  const progressPercentage = currentStep === 1 ? 33 : currentStep === 2 ? 66 : 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-l from-sky-600 via-sky-700 to-indigo-800 rounded-3xl p-6 sm:p-7 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold mb-2 text-cyan-100">
            <Sparkles className="w-3.5 h-3.5" />
            {isCompletedBefore ? 'ویرایش پرونده شناگر' : 'مرحله تکمیل مدارک و عضویت'}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {isCompletedBefore ? 'ویرایش اطلاعات و مدارک شناگر' : 'تکمیل مشخصات و مدارک الزامی شناگر'}
          </h1>
          <p className="text-sky-100 text-xs sm:text-sm mt-1 max-w-2xl font-light leading-relaxed">
            فرآیند ثبت‌نام در ۳ گام ساده طراحی شده است. لطفاً موارد ستاره‌دار (*) را با دقت تکمیل فرمایید.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/swimmer')}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span>انتقال به پیشخوان</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ============================================================== */}
      {/* MODERN PROCESS / STEPPER BAR                                   */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        {/* Top percentage row */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping"></span>
            <span>گام {currentStep} از ۳: {steps[currentStep - 1].title}</span>
          </span>
          <span className="font-mono text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 rounded-xl">
            {progressPercentage}٪ تکمیل شده
          </span>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
          <div
            className="bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Step Cards / Tabs Indicator */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
          {steps.map((st) => {
            const Icon = st.icon;
            const isPassed = currentStep > st.number;
            const isCurrent = currentStep === st.number;

            return (
              <button
                key={st.number}
                type="button"
                onClick={() => {
                  if (st.number < currentStep) {
                    setCurrentStep(st.number);
                  } else if (st.number === 2 && currentStep === 1) {
                    if (validateStep1()) setCurrentStep(2);
                  } else if (st.number === 3 && currentStep === 2) {
                    if (validateStep2()) setCurrentStep(3);
                  }
                }}
                className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex items-center gap-2.5 ${
                  isCurrent
                    ? 'bg-sky-50/80 dark:bg-sky-950/50 border-sky-400 dark:border-sky-700 shadow-xs ring-2 ring-sky-500/20'
                    : isPassed
                    ? 'bg-slate-50 dark:bg-slate-800/60 border-emerald-300/80 dark:border-emerald-800 hover:bg-slate-100'
                    : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 opacity-60'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                    isPassed
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {isPassed ? <CheckCircle2 className="w-4 h-4" /> : st.number}
                </div>
                <div className="hidden sm:block min-w-0">
                  <span className={`text-xs font-bold block truncate ${isCurrent ? 'text-sky-900 dark:text-sky-200' : 'text-slate-800 dark:text-slate-300'}`}>
                    {st.title}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate block">
                    {st.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 rounded-2xl text-xs flex items-center gap-2 font-medium animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP CONTENT WRAPPER                                           */}
      {/* ============================================================== */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ========================================================== */}
        {/* STEP 1: PERSONAL INFORMATION                               */}
        {/* ========================================================== */}
        {currentStep === 1 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <User className="w-4 h-4 text-sky-600" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">گام اول: مشخصات هویتی و فردی شناگر</h2>
              <span className="text-[11px] text-slate-400 mr-auto font-normal">موارد ستاره‌دار (*) الزامی هستند</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  نام شناگر <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="مثال: آرتین"
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  نام خانوادگی شناگر <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="مثال: رادمنش"
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  نام پدر <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="مثال: محمد"
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  کد ملی شناگر (۱۰ رقمی) <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="0012345678"
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-9 pl-3 text-slate-900 dark:text-slate-100 font-mono focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  تاریخ تولد <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                  <input
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-9 pl-3 text-slate-900 dark:text-slate-100 font-mono focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  جنسیت <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setGender('MALE')}
                    className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      gender === 'MALE'
                        ? 'bg-sky-500 text-white border-sky-500 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    پسر / آقایان
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('FEMALE')}
                    className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      gender === 'FEMALE'
                        ? 'bg-pink-500 text-white border-pink-500 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    دختر / بانوان
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  نام مدرسه (اختیاری)
                </label>
                <div className="relative">
                  <School className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="مثال: دبیرستان نمونه دولتی رشد"
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-9 pl-3 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                </div>
              </div>

              {/* Photo Upload (Optional) */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  عکس پرسنلی شناگر (اختیاری)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="عکس پرسنلی" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <label className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer border border-slate-200/80 transition-colors">
                    <span>{avatarPreview ? 'تغییر عکس' : 'انتخاب عکس چهره'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, setAvatar, setAvatarPreview)}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Step 1 Actions */}
            <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 text-xs font-bold gap-2 cursor-pointer shadow-sm"
              >
                <span>مرحله بعدی: نشانی و تماس اولیاء</span>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* STEP 2: PARENTS & ADDRESS (MAP PICKER)                     */}
        {/* ========================================================== */}
        {currentStep === 2 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Home className="w-4 h-4 text-sky-600" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">گام دوم: اطلاعات اولیاء، نشانی منزل و تعیین موقعیت روی نقشه</h2>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <Phone className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>شماره تماس پدر یا مادر: ثبت <strong>حداقل یکی از شماره‌های تماس پدر یا مادر الزامی است</strong>.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  شماره تماس پدر:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                  <input
                    type="tel"
                    value={fatherPhone}
                    onChange={(e) => setFatherPhone(e.target.value)}
                    placeholder="09123456789"
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-9 pl-3 text-slate-900 dark:text-slate-100 font-mono focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  شماره تماس مادر:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                  <input
                    type="tel"
                    value={motherPhone}
                    onChange={(e) => setMotherPhone(e.target.value)}
                    placeholder="09129876543"
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-9 pl-3 text-slate-900 dark:text-slate-100 font-mono focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  آدرس دقیق متنی منزل <span className="text-rose-500 font-bold">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="شهر، خیابان، کوچه، پلاک، واحد..."
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                />
              </div>

              {/* Interactive Map Picker */}
              <div className="sm:col-span-2">
                <MapLocationPicker
                  latitude={latitude}
                  longitude={longitude}
                  onChange={({ lat, lng }) => {
                    setLatitude(lat);
                    setLongitude(lng);
                  }}
                  label="مشخص کردن موقعیت منزل روی نقشه *"
                  height="280px"
                />
              </div>
            </div>

            {/* Step 2 Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="px-5 py-2.5 text-xs font-bold gap-2 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>مرحله قبلی</span>
              </Button>

              <Button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 text-xs font-bold gap-2 cursor-pointer shadow-sm"
              >
                <span>مرحله بعدی: بارگذاری مدارک هویتی</span>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* STEP 3: DOCUMENTS UPLOAD & FINAL SUBMIT                    */}
        {/* ========================================================== */}
        {currentStep === 3 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Upload className="w-4 h-4 text-sky-600" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">گام سوم: بارگذاری تصاویر و مدارک هویتی شناگر</h2>
              <span className="text-[11px] text-slate-400 mr-auto font-normal">تمام موارد این بخش الزامی هستند</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 1. عکس صفحه اول شناسنامه (*) */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-sky-600" />
                    صفحه اول شناسنامه <span className="text-rose-500 font-bold">*</span>
                  </span>
                  {birthCertPreview && (
                    <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      تایید
                    </span>
                  )}
                </div>

                {birthCertPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group h-40 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                    <img src={birthCertPreview} alt="شناسنامه" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="p-2 bg-white text-slate-800 rounded-lg text-xs font-semibold cursor-pointer shadow hover:bg-slate-100">
                        تغییر عکس
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, setBirthCertImage, setBirthCertPreview)}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-sky-300 dark:border-sky-800 hover:border-sky-500 rounded-xl cursor-pointer bg-sky-50/40 dark:bg-sky-950/20 transition-colors p-3 text-center">
                    <Upload className="w-6 h-6 text-sky-600 mb-1" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">عکس شناسنامه</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">فرمت‌های JPG یا PNG</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, setBirthCertImage, setBirthCertPreview)}
                    />
                  </label>
                )}
              </div>

              {/* 2. عکس کارت ملی (*) */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-sky-600" />
                    کارت ملی شناگر <span className="text-rose-500 font-bold">*</span>
                  </span>
                  {nationalCardPreview && (
                    <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      تایید
                    </span>
                  )}
                </div>

                {nationalCardPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group h-40 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                    <img src={nationalCardPreview} alt="کارت ملی" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="p-2 bg-white text-slate-800 rounded-lg text-xs font-semibold cursor-pointer shadow hover:bg-slate-100">
                        تغییر عکس
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, setNationalCardImage, setNationalCardPreview)}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-sky-300 dark:border-sky-800 hover:border-sky-500 rounded-xl cursor-pointer bg-sky-50/40 dark:bg-sky-950/20 transition-colors p-3 text-center">
                    <CreditCard className="w-6 h-6 text-sky-600 mb-1" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">عکس کارت ملی</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">فرمت‌های JPG یا PNG</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, setNationalCardImage, setNationalCardPreview)}
                    />
                  </label>
                )}
              </div>

              {/* 3. عکس بیمه ورزشی (*) */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    بیمه ورزشی معتبر <span className="text-rose-500 font-bold">*</span>
                  </span>
                  {sportsInsurancePreview && (
                    <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      تایید
                    </span>
                  )}
                </div>

                {sportsInsurancePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group h-40 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                    <img src={sportsInsurancePreview} alt="بیمه ورزشی" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="p-2 bg-white text-slate-800 rounded-lg text-xs font-semibold cursor-pointer shadow hover:bg-slate-100">
                        تغییر عکس
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, setSportsInsuranceImage, setSportsInsurancePreview)}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 rounded-xl cursor-pointer bg-emerald-50/40 dark:bg-emerald-950/20 transition-colors p-3 text-center">
                    <ShieldCheck className="w-6 h-6 text-emerald-600 mb-1" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">عکس بیمه ورزشی</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">فدراسیون پزشکی ورزشی</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, setSportsInsuranceImage, setSportsInsurancePreview)}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Step 3 Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="px-5 py-2.5 text-xs font-bold gap-2 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>مرحله قبلی</span>
              </Button>

              <Button
                type="submit"
                loading={saving}
                className="px-8 py-3 text-sm font-bold gap-2 shadow-md cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ثبت نهایی و تکمیل پرونده شناگر</span>
              </Button>
            </div>
          </div>
        )}

      </form>
    </div>
  );
};
