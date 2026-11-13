import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  User, Calendar, CreditCard, Home, Phone, Upload, CheckCircle2,
  AlertCircle, ShieldCheck, FileText, Image as ImageIcon, School,
  Sparkles, ArrowLeft, ArrowRight, Trash2, Eye, EyeOff, MapPin,
  KeyRound, Shield, Smartphone, Briefcase, Lock, LogOut, AlertTriangle,
  BadgeCheck
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { MapLocationPicker } from '../../components/common/MapLocationPicker';
import { PersianDatePicker } from '../../components/common/PersianDatePicker';
import { LogoutModal } from '../../components/common/LogoutModal';
import { validatePassword, PasswordRequirementsList } from '../../utils/passwordValidator';

export const SwimmerProfilePage = () => {
  const { user, updateUserData, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Main Tab: 'INFO' (3-step registration/editing) | 'SECURITY' (password & login)
  const tabParam = searchParams.get('tab')?.toUpperCase();
  const initialTab = tabParam === 'SECURITY' ? 'SECURITY' : 'INFO';
  const [activeMainTab, setActiveMainTab] = useState(initialTab);

  const handleTabChange = (tab) => {
    setActiveMainTab(tab);
    setSearchParams({ tab: tab.toLowerCase() });
    setError('');
  };

  useEffect(() => {
    if (tabParam === 'SECURITY' || tabParam === 'INFO') {
      setActiveMainTab(tabParam);
    }
  }, [tabParam]);

  // Loading & submit states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Current Step inside INFO tab: 1, 2, or 3
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

  // Form Fields - Step 2: Parent Contacts, Jobs & Address
  const [fatherPhone, setFatherPhone] = useState('');
  const [fatherJob, setFatherJob] = useState('');
  const [motherPhone, setMotherPhone] = useState('');
  const [motherJob, setMotherJob] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  // Form Fields - Step 3: Documents
  const [birthCertImage, setBirthCertImage] = useState(null);
  const [birthCertPreview, setBirthCertPreview] = useState(null);
  const [birthCertStatus, setBirthCertStatus] = useState('');

  const [nationalCardImage, setNationalCardImage] = useState(null);
  const [nationalCardPreview, setNationalCardPreview] = useState(null);
  const [nationalCardStatus, setNationalCardStatus] = useState('');

  const [sportsInsuranceImage, setSportsInsuranceImage] = useState(null);
  const [sportsInsurancePreview, setSportsInsurancePreview] = useState(null);
  const [sportsInsuranceStatus, setSportsInsuranceStatus] = useState('');

  const [documentsRejectionReason, setDocumentsRejectionReason] = useState('');
  const [isCompletedBefore, setIsCompletedBefore] = useState(false);

  // Password & Security Form States
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

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
        setFatherJob(data.father_job || '');
        setMotherPhone(data.mother_phone || '');
        setMotherJob(data.mother_job || '');
        setAddress(data.address || '');
        setLatitude(data.latitude || 35.6892);
        setLongitude(data.longitude || 51.3890);

        if (data.avatar) setAvatarPreview(data.avatar);
        if (data.birth_certificate_image) setBirthCertPreview(data.birth_certificate_image);
        if (data.national_card_image) setNationalCardPreview(data.national_card_image);
        if (data.sports_insurance_image) setSportsInsurancePreview(data.sports_insurance_image);

        setBirthCertStatus(data.birth_certificate_status || '');
        setNationalCardStatus(data.national_card_status || '');
        setSportsInsuranceStatus(data.sports_insurance_status || '');
        setDocumentsRejectionReason(data.documents_rejection_reason || '');

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
        toast.error('حداکثر حجم مجاز تصویر ۵ مگابایت است.');
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
    if (!schoolName.trim()) {
      setError('نام مدرسه شناگر الزامی است.');
      return false;
    }
    if (!avatar && !avatarPreview) {
      setError('بارگذاری عکس پرسنلی شناگر الزامی است.');
      return false;
    }
    return true;
  };

  // Step 2 Validation: Father phone & job, Mother phone & job, and Address are all MANDATORY!
  const validateStep2 = () => {
    setError('');
    const cleanFatherPhone = fatherPhone.trim();
    const cleanMotherPhone = motherPhone.trim();
    const cleanFatherJob = fatherJob.trim();
    const cleanMotherJob = motherJob.trim();

    if (!cleanFatherPhone) {
      setError('شماره تماس پدر الزامی است.');
      return false;
    }
    if (!/^09\d{9}$/.test(cleanFatherPhone)) {
      setError('شماره تماس پدر باید یک شماره موبایل معتبر ۱۱ رقمی (شروع با ۰۹) باشد.');
      return false;
    }
    if (!cleanFatherJob) {
      setError('شغل پدر الزامی است. لطفاً آن را وارد فرمایید.');
      return false;
    }

    if (!cleanMotherPhone) {
      setError('شماره تماس مادر الزامی است.');
      return false;
    }
    if (!/^09\d{9}$/.test(cleanMotherPhone)) {
      setError('شماره تماس مادر باید یک شماره موبایل معتبر ۱۱ رقمی (شروع با ۰۹) باشد.');
      return false;
    }
    if (!cleanMotherJob) {
      setError('شغل مادر الزامی است. لطفاً آن را وارد فرمایید.');
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

  // Submit 3-Step Profile Form
  const handleSubmitProfile = async (e) => {
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

    const formData = new FormData();
    formData.append('first_name', firstName.trim());
    formData.append('last_name', lastName.trim());
    formData.append('national_id', nationalId.trim());
    formData.append('date_of_birth', dateOfBirth);
    formData.append('father_name', fatherName.trim());
    formData.append('father_phone', fatherPhone.trim());
    formData.append('father_job', fatherJob.trim());
    formData.append('mother_phone', motherPhone.trim());
    formData.append('mother_job', motherJob.trim());
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
      setIsCompletedBefore(true);
      updateUserData({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        national_id: nationalId.trim(),
        is_profile_completed: true,
      });
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

  // Submit Password Change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const validation = validatePassword(passwordForm.new_password);
    if (!validation.isValid) {
      toast.error(validation.firstError || 'رمز عبور با معیارهای امنیتی مطابقت ندارد.');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('تکرار کلمه عبور جدید مطابقت ندارد.');
      return;
    }

    try {
      setChangingPassword(true);
      const res = await api.post('/auth/change-password/', passwordForm);
      toast.success(res.data?.detail || 'کلمه عبور با موفقیت به‌روزرسانی شد.');
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
      if (user) {
        user.is_password_changed = true;
        updateUserData({ is_password_changed: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در تغییر کلمه عبور.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    toast.info('با موفقیت از حساب کاربری خارج شدید.');
    navigate('/login');
  };

  if (loading) {
    return <LoadingState type="form" message="در حال دریافت اطلاعات و پرونده شناگر..." />;
  }

  // Steps definition for Stepper Bar
  const steps = [
    { number: 1, title: 'مشخصات هویتی و فردی', icon: User, desc: 'نام، کد ملی، تولد و عکس' },
    { number: 2, title: 'اولیاء، شغل‌ها و نشانی', icon: Home, desc: 'تلفن و شغل والدین، نقشه' },
    { number: 3, title: 'بارگذاری مدارک هویتی', icon: ShieldCheck, desc: 'شناسنامه، کارت ملی، بیمه' },
  ];

  const progressPercentage = currentStep === 1 ? 33 : currentStep === 2 ? 66 : 100;
  const displayName = user?.full_name || `${firstName} ${lastName}`.trim() || user?.phone || 'شناگر محترم';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-600 via-sky-600 to-teal-500 text-white flex items-center justify-center font-black text-2xl shrink-0 shadow-md overflow-hidden ring-4 ring-sky-50 dark:ring-sky-950/60">
            {avatarPreview ? (
              <img src={avatarPreview} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span>{displayName.charAt(0)}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {displayName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300">
                شناگر آکادمی
              </span>
              {isCompletedBefore ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  پرونده تکمیل‌شده
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  نیازمند تکمیل مشخصات
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono">
              شماره همراه: {user?.phone || '—'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          className="px-4 py-2.5 text-xs sm:text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900/60 transition-colors flex items-center gap-2 cursor-pointer self-end md:self-auto"
        >
          <LogOut className="w-4.5 h-4.5" />
          <span>خروج از حساب</span>
        </button>
      </div>

      {/* Main Tabs Header */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
        <button
          type="button"
          onClick={() => handleTabChange('INFO')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeMainTab === 'INFO'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4.5 h-4.5" />
          <span>اطلاعات و مدارک شناگر (۳ مرحله‌ای)</span>
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('SECURITY')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeMainTab === 'SECURITY'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4.5 h-4.5" />
          <span>رمز عبور و امنیت</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: 3-STEP INFORMATION & DOCUMENTS                               */}
      {/* =================================================================== */}
      {activeMainTab === 'INFO' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Stepper Progress Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping"></span>
                <span>گام {currentStep} از ۳: {steps[currentStep - 1].title}</span>
              </span>
              <span className="font-mono font-black text-sm sm:text-base text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-3 py-1 rounded-xl">
                {progressPercentage}٪ تکمیل شده
              </span>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3.5 pt-1">
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
                    className={`p-3 sm:p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex items-center gap-2.5 sm:gap-3 ${
                      isCurrent
                        ? 'bg-sky-50/80 dark:bg-sky-950/50 border-sky-400 dark:border-sky-700 shadow-xs ring-2 ring-sky-500/20'
                        : isPassed
                        ? 'bg-slate-50 dark:bg-slate-800/60 border-emerald-300/80 dark:border-emerald-800 hover:bg-slate-100'
                        : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold transition-colors ${
                        isPassed
                          ? 'bg-emerald-500 text-white'
                          : isCurrent
                          ? 'bg-sky-600 text-white shadow-md'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-5 h-5" /> : st.number}
                    </div>
                    <div className="hidden sm:block min-w-0">
                      <span className={`text-xs sm:text-sm font-bold block truncate ${isCurrent ? 'text-sky-900 dark:text-sky-200' : 'text-slate-800 dark:text-slate-300'}`}>
                        {st.title}
                      </span>
                      <span className="text-xs text-slate-400 truncate block mt-0.5 font-medium">
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
            <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 rounded-2xl text-xs sm:text-sm flex items-center gap-2 font-medium animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Form container */}
          <form onSubmit={handleSubmitProfile} className="space-y-6">
            {/* STEP 1: PERSONAL INFORMATION */}
            {currentStep === 1 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center gap-2.5 pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <User className="w-5 h-5 text-sky-600" />
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">گام اول: مشخصات هویتی و فردی شناگر</h2>
                  <span className="text-xs sm:text-sm text-slate-400 mr-auto font-medium">موارد ستاره‌دار (*) الزامی هستند</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  <div>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      نام شناگر <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="مثال: آرتین"
                      className="w-full text-sm sm:text-base bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      نام خانوادگی شناگر <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="مثال: رادمنش"
                      className="w-full text-sm sm:text-base bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      نام پدر <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      placeholder="مثال: محمد"
                      className="w-full text-sm sm:text-base bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      کد ملی شناگر (۱۰ رقمی) <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        maxLength={10}
                        value={nationalId}
                        onChange={(e) => setNationalId(e.target.value)}
                        placeholder="0012345678"
                        className="w-full text-sm sm:text-base bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-10 pl-3 text-slate-900 dark:text-slate-100 font-mono font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <PersianDatePicker
                      label="تاریخ تولد *"
                      required={true}
                      size="md"
                      labelClassName="text-sm font-bold block mb-1.5"
                      value={dateOfBirth}
                      onChange={(jalaliStr, gDate, gIso) => {
                        setDateOfBirth(gIso || '');
                      }}
                      placeholder="انتخاب تاریخ تولد..."
                      minYear={1320}
                      maxYear={1415}
                      clearable={false}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      جنسیت <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setGender('MALE')}
                        className={`flex-1 py-2.5 px-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
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
                        className={`flex-1 py-2.5 px-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
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
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      نام مدرسه <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <School className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="مثال: دبستان و دبیرستان نمونه دولتی رشد"
                        className="w-full text-sm sm:text-base bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-10 pl-3.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Photo Upload (Mandatory) */}
                  <div>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      عکس پرسنلی شناگر <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="عکس پرسنلی" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <label className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-bold cursor-pointer border border-slate-200/80 transition-colors">
                        <span>{avatarPreview ? 'تغییر عکس' : 'انتخاب عکس چهره *'}</span>
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

                <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="px-7 py-3 text-sm sm:text-base font-bold gap-2 cursor-pointer shadow-sm"
                  >
                    <span>مرحله بعدی: اولیاء، شغل‌ها و نشانی</span>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: PARENTS, JOBS & ADDRESS */}
            {currentStep === 2 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center gap-2.5 pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <Home className="w-5 h-5 text-sky-600" />
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">گام دوم: اطلاعات اولیاء، شغل والدین، نشانی منزل و تعیین موقعیت روی نقشه</h2>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl text-xs sm:text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2.5 font-medium leading-relaxed">
                  <Phone className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>ثبت اطلاعات تماس و <strong>شغل هر دو والد (پدر و مادر)</strong> الزامی است.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  {/* Father Phone */}
                  <div>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      شماره تماس پدر <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                      <input
                        type="tel"
                        required
                        value={fatherPhone}
                        onChange={(e) => setFatherPhone(e.target.value)}
                        placeholder="09123456789"
                        className="w-full text-sm sm:text-base bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-10 pl-3 text-slate-900 dark:text-slate-100 font-mono font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Father Job (MANDATORY) */}
                  <div>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      شغل پدر <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        value={fatherJob}
                        onChange={(e) => setFatherJob(e.target.value)}
                        placeholder="مثال: مهندس، پزشک، کارمند، آزاد..."
                        className="w-full text-sm sm:text-base bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-10 pl-3 text-slate-900 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Mother Phone */}
                  <div>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      شماره تماس مادر <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                      <input
                        type="tel"
                        required
                        value={motherPhone}
                        onChange={(e) => setMotherPhone(e.target.value)}
                        placeholder="09129876543"
                        className="w-full text-sm sm:text-base bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-10 pl-3 text-slate-900 dark:text-slate-100 font-mono font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Mother Job (MANDATORY) */}
                  <div>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      شغل مادر <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        value={motherJob}
                        onChange={(e) => setMotherJob(e.target.value)}
                        placeholder="مثال: فرهنگی، پزشک، خانه‌دار، کارمند..."
                        className="w-full text-sm sm:text-base bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-10 pl-3 text-slate-900 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Home Address */}
                  <div className="sm:col-span-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      آدرس دقیق متنی منزل <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="شهر، خیابان، کوچه، پلاک، واحد..."
                      className="w-full text-sm sm:text-base bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium"
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

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="px-5 py-3 text-sm font-bold gap-2 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>بازگشت به گام اول</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="px-7 py-3 text-sm sm:text-base font-bold gap-2 cursor-pointer shadow-sm"
                  >
                    <span>مرحله بعدی: بارگذاری مدارک</span>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: DOCUMENTS */}
            {currentStep === 3 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center gap-2.5 pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <ShieldCheck className="w-5 h-5 text-sky-600" />
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">گام سوم: بارگذاری مدارک هویتی شناگر</h2>
                  <span className="text-xs sm:text-sm text-slate-400 mr-auto font-medium">بارگذاری هر ۳ مدرک الزامی است</span>
                </div>

                {documentsRejectionReason && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-2xl text-xs sm:text-sm text-rose-800 dark:text-rose-200 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <h4 className="font-bold mb-1">پیام مدیریت آموزشگاه برای اصلاح مدارک:</h4>
                      <p className="leading-relaxed font-medium">{documentsRejectionReason}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Birth Certificate */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        صفحه اول شناسنامه <span className="text-rose-500 font-bold">*</span>
                      </span>
                      {birthCertStatus === 'APPROVED' && (
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">تأییدشده</span>
                      )}
                    </div>
                    <div className="aspect-4/3 rounded-xl bg-slate-200 dark:bg-slate-700/50 flex items-center justify-center overflow-hidden border border-dashed border-slate-300 dark:border-slate-600 relative group">
                      {birthCertPreview ? (
                        <img src={birthCertPreview} alt="شناسنامه" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-3 text-slate-400">
                          <Upload className="w-8 h-8 mx-auto mb-1.5 opacity-60" />
                          <span className="text-xs font-medium block">تصویر شناسنامه</span>
                        </div>
                      )}
                    </div>
                    <label className="w-full py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-sky-600" />
                      <span>{birthCertPreview ? 'تغییر تصویر' : 'انتخاب تصویر شناسنامه *'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, setBirthCertImage, setBirthCertPreview)}
                      />
                    </label>
                  </div>

                  {/* National Card */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        کارت ملی شناگر <span className="text-rose-500 font-bold">*</span>
                      </span>
                      {nationalCardStatus === 'APPROVED' && (
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">تأییدشده</span>
                      )}
                    </div>
                    <div className="aspect-4/3 rounded-xl bg-slate-200 dark:bg-slate-700/50 flex items-center justify-center overflow-hidden border border-dashed border-slate-300 dark:border-slate-600 relative group">
                      {nationalCardPreview ? (
                        <img src={nationalCardPreview} alt="کارت ملی" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-3 text-slate-400">
                          <CreditCard className="w-8 h-8 mx-auto mb-1.5 opacity-60" />
                          <span className="text-xs font-medium block">تصویر کارت ملی</span>
                        </div>
                      )}
                    </div>
                    <label className="w-full py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-sky-600" />
                      <span>{nationalCardPreview ? 'تغییر تصویر' : 'انتخاب تصویر کارت ملی *'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, setNationalCardImage, setNationalCardPreview)}
                      />
                    </label>
                  </div>

                  {/* Sports Insurance */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        کارت بیمه ورزشی <span className="text-rose-500 font-bold">*</span>
                      </span>
                      {sportsInsuranceStatus === 'APPROVED' && (
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">تأییدشده</span>
                      )}
                    </div>
                    <div className="aspect-4/3 rounded-xl bg-slate-200 dark:bg-slate-700/50 flex items-center justify-center overflow-hidden border border-dashed border-slate-300 dark:border-slate-600 relative group">
                      {sportsInsurancePreview ? (
                        <img src={sportsInsurancePreview} alt="بیمه ورزشی" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-3 text-slate-400">
                          <ShieldCheck className="w-8 h-8 mx-auto mb-1.5 opacity-60" />
                          <span className="text-xs font-medium block">تصویر بیمه ورزشی</span>
                        </div>
                      )}
                    </div>
                    <label className="w-full py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-sky-600" />
                      <span>{sportsInsurancePreview ? 'تغییر تصویر' : 'انتخاب تصویر بیمه *'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, setSportsInsuranceImage, setSportsInsurancePreview)}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="px-5 py-3 text-sm font-bold gap-2 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>بازگشت به گام دوم</span>
                  </Button>
                  <Button
                    type="submit"
                    loading={saving}
                    className="px-8 py-3.5 text-sm sm:text-base font-bold gap-2 cursor-pointer shadow-md shadow-sky-500/20 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>ثبت نهایی و ارسال مدارک</span>
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: PASSWORD & SECURITY                                          */}
      {/* =================================================================== */}
      {activeMainTab === 'SECURITY' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Warning for Initial Password */}
          {user && !user.is_password_changed && (
            <div className="p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3.5">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <h4 className="text-sm sm:text-base font-bold text-rose-900 dark:text-rose-100">
                  توجه امنیتی: شما هنوز کلمه عبور اختصاصی تعیین نکرده‌اید!
                </h4>
                <p className="text-xs sm:text-sm text-rose-800 dark:text-rose-200/90 leading-relaxed font-medium">
                  برای ورود بدون پیامک و افزایش امنیت حساب، پیشنهاد می‌شود یک رمز عبور اختصاصی و مطمئن تعیین فرمایید.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Password Form Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <KeyRound className="w-4.5 h-4.5 text-sky-600" />
                تعیین یا تغییر کلمه عبور اختصاصی
              </h3>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <PasswordRequirementsList password={passwordForm.new_password} showAlways={true} />

                {/* Old password (only if password was previously changed) */}
                {user?.is_password_changed && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      کلمه عبور فعلی <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                      <input
                        type={showOld ? 'text' : 'password'}
                        required
                        value={passwordForm.old_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                        placeholder="کلمه عبور فعلی خود را وارد کنید"
                        className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-10 pl-10 text-slate-900 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOld(!showOld)}
                        className="absolute left-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* New Password */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    کلمه عبور جدید <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                    <input
                      type={showNew ? 'text' : 'password'}
                      required
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      placeholder="حداقل ۸ کاراکتر شامل حروف و اعداد"
                      className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-10 pl-10 text-slate-900 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute left-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    تکرار کلمه عبور جدید <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                      placeholder="تکرار کلمه عبور جدید"
                      className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-10 pl-10 text-slate-900 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute left-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  loading={changingPassword}
                  className="w-full py-3 text-sm font-bold rounded-xl cursor-pointer"
                >
                  <ShieldCheck className="w-4.5 h-4.5" />
                  <span>ذخیره کلمه عبور جدید</span>
                </Button>
              </form>
            </div>

            {/* Account & Login Info Card */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <Smartphone className="w-4.5 h-4.5 text-sky-600" />
                  ورود سریع با پیامک (OTP)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  شماره همراه شما در سامانه تأیید شده است. حتی در صورت فراموشی کلمه عبور، همواره می‌توانید با استفاده از دریافت کد یکبار مصرف پیامکی (OTP) وارد حساب خود شوید.
                </p>

                <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">شماره موبایل ورود:</span>
                      <span className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-white">
                        {user?.phone || '—'}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    تأییدشده
                  </span>
                </div>
              </div>

              {/* Security info card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  امنیت و حفاظت از داده‌ها
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  تمامی داده‌های هویتی، آدرس و مدارک بارگذاری‌شده شناگر در سرورهای امن سامانه آکادمی شنا رمزنگاری و محافظت می‌شوند و تنها توسط کادر مجاز آموزشگاه قابل ارزیابی هستند.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        userName={displayName}
        userRole="شناگر"
      />
    </div>
  );
};
