import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  User, Calendar, CreditCard, Home, Phone, Upload, CheckCircle2,
  AlertCircle, ShieldCheck, FileText, Image as ImageIcon, School,
  Sparkles, ArrowLeft, ArrowRight, Trash2, Eye, EyeOff, MapPin,
  KeyRound, Shield, Smartphone, Briefcase, Lock, AlertTriangle,
  BadgeCheck, Award, Clock, ChevronLeft, Camera, ZoomIn, LogOut, TrendingUp
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSwimmer } from '../../context/SwimmerContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { MapLocationPicker } from '../../components/common/MapLocationPicker';
import { PersianDatePicker } from '../../components/common/PersianDatePicker';
import { LogoutModal } from '../../components/common/LogoutModal';
import { SwimmerPerformanceSection } from '../../components/swimmer/SwimmerPerformanceSection';
import { RegistrationSuccessModal } from '../../components/swimmer/RegistrationSuccessModal';
import { validatePassword, PasswordRequirementsList } from '../../utils/passwordValidator';
import { getMediaUrl, getAuthenticatedDocUrl } from '../../utils/media';
import { toShamsiDate } from '../../utils/date';

export const SwimmerProfilePage = () => {
  const { user, updateUserData, logout } = useAuth();
  const { activeSwimmerId } = useSwimmer() || {};
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Main Tab: 'INFO' | 'PERFORMANCE' | 'ASSESSMENTS' | 'SECURITY'
  const tabParam = searchParams.get('tab')?.toUpperCase();
  const validTabs = ['INFO', 'PERFORMANCE', 'ASSESSMENTS', 'SECURITY'];
  const initialTab = validTabs.includes(tabParam) ? tabParam : 'INFO';
  const [activeMainTab, setActiveMainTab] = useState(initialTab);

  const handleTabChange = (tab) => {
    setActiveMainTab(tab);
    setSearchParams({ tab: tab.toLowerCase() });
    setError('');
  };

  useEffect(() => {
    if (validTabs.includes(tabParam)) {
      setActiveMainTab(tabParam);
    }
  }, [tabParam]);

  // Loading & submit states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Swimmer profile ID state
  const [profileSwimmerId, setProfileSwimmerId] = useState(null);

  // Document full-size preview modal
  const [previewDocModal, setPreviewDocModal] = useState(null);

  // 3-Step Registration Completion Success Modal
  const [showRegistrationSuccessModal, setShowRegistrationSuccessModal] = useState(false);

  // Coach Assessments State
  const [assessments, setAssessments] = useState([]);
  const [profileLevelName, setProfileLevelName] = useState('');

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
        const params = activeSwimmerId ? { swimmer_id: activeSwimmerId } : {};
        const [res, assRes] = await Promise.allSettled([
          api.get('/swimmers/me/', { params }),
          api.get('/assessments/skills/', { params }),
        ]);

        if (res.status === 'fulfilled') {
          const data = res.value.data;
          if (data.id) setProfileSwimmerId(data.id);
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
          setLatitude(data.latitude || 36.2797);
          setLongitude(data.longitude || 50.0049);

          if (data.avatar) setAvatarPreview(getMediaUrl(data.avatar));
          if (data.birth_certificate_image) setBirthCertPreview(getAuthenticatedDocUrl(data.birth_certificate_image));
          if (data.national_card_image) setNationalCardPreview(getAuthenticatedDocUrl(data.national_card_image));
          if (data.sports_insurance_image) setSportsInsurancePreview(getAuthenticatedDocUrl(data.sports_insurance_image));

          setBirthCertStatus(data.birth_certificate_status || '');
          setNationalCardStatus(data.national_card_status || '');
          setSportsInsuranceStatus(data.sports_insurance_status || '');
          setDocumentsRejectionReason(data.documents_rejection_reason || '');

          setIsCompletedBefore(Boolean(data.is_profile_completed));
          setProfileLevelName(data.level_name || '');
        }

        if (assRes.status === 'fulfilled') {
          const d = assRes.value.data;
          setAssessments(Array.isArray(d) ? d : d.results || []);
        }
      } catch (err) {
        console.error(err);
        toast.error('خطا در دریافت اطلاعات پرونده شناگر');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, activeSwimmerId]);

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
    if (e) e.preventDefault();
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
      await api.post('/swimmers/me/complete/', formData, {
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
      setShowRegistrationSuccessModal(true);
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
    { number: 1, title: 'مشخصات هویتی و فردی', shortTitle: 'مشخصات شناگر', icon: User, desc: 'نام، کد ملی، تاریخ تولد و عکس چهره' },
    { number: 2, title: 'اولیاء، شغل‌ها و نشانی', shortTitle: 'والدین و نشانی', icon: Home, desc: 'شماره تماس و شغل والدین، موقعیت روی نقشه' },
    { number: 3, title: 'بارگذاری مدارک هویتی', shortTitle: 'مدارک و بیمه', icon: ShieldCheck, desc: 'شناسنامه، کارت ملی و کارت بیمه ورزشی' },
  ];

  const progressPercentage = currentStep === 1 ? 33 : currentStep === 2 ? 66 : 100;
  const displayName = user?.full_name || `${firstName} ${lastName}`.trim() || user?.phone || 'شناگر محترم';

  // Count approved documents
  const approvedDocsCount = [birthCertStatus, nationalCardStatus, sportsInsuranceStatus].filter((s) => s === 'APPROVED').length;

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-12 px-1 sm:px-0">
      {/* =================================================================== */}
      {/* 1. HERO PROFILE CARD (100% Identity-Focused, NO Logout in Header)    */}
      {/* =================================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
        {/* Soft decorative background glow */}
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-gradient-to-br from-sky-400/15 via-blue-500/10 to-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 relative z-10 text-center sm:text-right">
          {/* Avatar & Core Swimmer Info */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-5 min-w-0 w-full sm:w-auto">
            {/* Swimmer Avatar with Direct Camera Upload Badge */}
            <div className="relative shrink-0 group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-3xl shadow-md overflow-hidden ring-4 ring-sky-50 dark:ring-sky-950/60 transition-transform group-hover:scale-[1.02]">
                {avatarPreview ? (
                  <img src={getMediaUrl(avatarPreview)} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span>{displayName.charAt(0)}</span>
                )}
              </div>
              <label
                title="تغییر عکس پرسنلی"
                className="absolute -bottom-1 -left-1 w-8 h-8 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white rounded-full flex items-center justify-center shadow-md cursor-pointer border-2 border-white dark:border-slate-900 transition-all"
              >
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, setAvatar, setAvatarPreview)}
                />
              </label>
            </div>

            {/* Name, Roles, and Quick Info */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                  {displayName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300">
                  شناگر آکادمی
                </span>
              </div>

              {/* Status and Meta Badges */}
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap pt-0.5">
                {isCompletedBefore ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>پرونده تکمیل‌شده</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>نیازمند تکمیل پرونده</span>
                  </span>
                )}

                {isCompletedBefore && (
                  <button
                    type="button"
                    onClick={() => setShowRegistrationSuccessModal(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 cursor-pointer transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>وضعیت تأیید مدارک</span>
                  </button>
                )}

                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-full">
                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{user?.phone || '—'}</span>
                </span>

                {nationalId && (
                  <span className="hidden xs:inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-full">
                    <CreditCard className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{nationalId}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Athletic Summary Pills (Level & Documents Counter) */}
          <div className="flex sm:flex-col items-center sm:items-end justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 w-full sm:w-auto">
            {profileLevelName && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/60 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300">
                <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                <span>سطح: {profileLevelName}</span>
              </div>
            )}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>مدارک: {approvedDocsCount} از ۳ تأییدشده</span>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. MAIN SEGMENTED TABS (Touch-first, 4-column responsive, zero overflow) */}
      {/* =================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 bg-slate-100/90 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 select-none">
        {/* Tab 1: Info & Dossier */}
        <button
          type="button"
          onClick={() => handleTabChange('INFO')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeMainTab === 'INFO'
              ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-300 shadow-xs border border-slate-200/70 dark:border-slate-700/80'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4.5 h-4.5 shrink-0" />
          <span className="sm:hidden">پرونده</span>
          <span className="hidden sm:inline">پرونده و مدارک</span>
        </button>

        {/* Tab 2: Performance (عملکرد) */}
        <button
          type="button"
          onClick={() => handleTabChange('PERFORMANCE')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer relative ${
            activeMainTab === 'PERFORMANCE'
              ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-300 shadow-xs border border-slate-200/70 dark:border-slate-700/80'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className="relative">
            <TrendingUp className="w-4.5 h-4.5 shrink-0" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-sky-500" />
          </div>
          <span className="sm:hidden">عملکرد</span>
          <span className="hidden sm:inline">عملکرد و رکوردها</span>
        </button>

        {/* Tab 3: Assessments */}
        <button
          type="button"
          onClick={() => handleTabChange('ASSESSMENTS')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer relative ${
            activeMainTab === 'ASSESSMENTS'
              ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-300 shadow-xs border border-slate-200/70 dark:border-slate-700/80'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className="relative">
            <Award className="w-4.5 h-4.5 shrink-0" />
            {assessments.length > 0 && (
              <span className="sm:hidden absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full text-[9px] font-mono font-black bg-sky-600 text-white">
                {assessments.length}
              </span>
            )}
          </div>
          <span className="sm:hidden">کارنامه</span>
          <span className="hidden sm:inline">کارنامه مربی</span>
          {assessments.length > 0 && (
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
              {assessments.length}
            </span>
          )}
        </button>

        {/* Tab 4: Security & Account */}
        <button
          type="button"
          onClick={() => handleTabChange('SECURITY')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer relative ${
            activeMainTab === 'SECURITY'
              ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-300 shadow-xs border border-slate-200/70 dark:border-slate-700/80'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className="relative">
            <ShieldCheck className="w-4.5 h-4.5 shrink-0" />
            {user && !user.is_password_changed && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>
          <span className="sm:hidden">امنیت</span>
          <span className="hidden sm:inline">امنیت و حساب</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: 3-STEP INFORMATION & DOCUMENTS                               */}
      {/* =================================================================== */}
      {activeMainTab === 'INFO' && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
          {/* Welcome Banner for Newly Registered Swimmer */}
          {sessionStorage.getItem('iranswim_just_registered') === 'true' && (
            <div className="bg-gradient-to-r from-sky-500/10 via-cyan-500/10 to-emerald-500/10 dark:from-sky-950/40 dark:to-emerald-950/30 border border-sky-300 dark:border-sky-800 rounded-3xl p-4 sm:p-5 flex items-start gap-3.5 shadow-xs animate-in fade-in duration-300">
              <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20">
                <Sparkles className="w-5 h-5 text-cyan-200" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  عضویت شما با موفقیت انجام شد!
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  لطفاً ۳ مرحله زیر را جهت تکمیل پرونده و بارگذاری مدارک هویتی انجام دهید. پس از ثبت نهایی، مدارک جهت بررسی ارسال شده و می‌توانید بلافاصله دوره‌های آموزشی مناسب خود را انتخاب نمایید.
                </p>
              </div>
            </div>
          )}

          {/* Stepper Header Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
                <span>گام {currentStep} از ۳: <span className="text-sky-600 dark:text-sky-400">{steps[currentStep - 1].shortTitle}</span></span>
              </span>
              <span className="font-mono font-black text-xs sm:text-sm text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-0.5 rounded-lg border border-sky-100 dark:border-sky-900/40">
                {progressPercentage}٪
              </span>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 sm:h-2.5 rounded-full overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-sky-500 via-blue-500 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out shadow-xs"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Stepper 3 Interactive Buttons */}
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
                    className={`p-2.5 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-3 text-center sm:text-right ${
                      isCurrent
                        ? 'bg-sky-50/90 dark:bg-sky-950/50 border-sky-400 dark:border-sky-700 shadow-xs ring-2 ring-sky-500/20'
                        : isPassed
                        ? 'bg-slate-50 dark:bg-slate-800/60 border-emerald-300/80 dark:border-emerald-800 hover:bg-slate-100'
                        : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 text-xs sm:text-sm font-bold transition-colors ${
                        isPassed
                          ? 'bg-emerald-500 text-white'
                          : isCurrent
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Icon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />}
                    </div>
                    <div className="min-w-0 w-full">
                      <span className={`text-[11px] sm:text-sm font-bold block truncate ${isCurrent ? 'text-sky-900 dark:text-sky-200' : 'text-slate-800 dark:text-slate-300'}`}>
                        <span className="sm:hidden">{st.shortTitle}</span>
                        <span className="hidden sm:inline">{st.title}</span>
                      </span>
                      <span className="hidden sm:block text-xs text-slate-400 truncate mt-0.5 font-medium">
                        {st.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3.5 sm:p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 rounded-2xl text-xs sm:text-sm flex items-center gap-2.5 font-medium animate-in fade-in">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSubmitProfile} className="space-y-4 sm:space-y-6">
            {/* STEP 1: PERSONAL INFORMATION */}
            {currentStep === 1 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-7 shadow-xs space-y-4 sm:space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <User className="w-5 h-5 text-sky-600 shrink-0" />
                  <h2 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white">گام اول: مشخصات هویتی و فردی شناگر</h2>
                  <span className="text-[11px] sm:text-xs text-slate-400 mr-auto font-medium">موارد (*) الزامی هستند</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
                  {/* First Name */}
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      نام شناگر <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="مثال: آرتین"
                        className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-9 pl-3 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      نام خانوادگی شناگر <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="مثال: رادمنش"
                        className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-9 pl-3 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Father Name */}
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      نام پدر <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        placeholder="مثال: محمد"
                        className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-9 pl-3 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* National ID */}
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      کد ملی شناگر (۱۰ رقمی) <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        maxLength={10}
                        value={nationalId}
                        onChange={(e) => setNationalId(e.target.value)}
                        placeholder="0012345678"
                        className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-9 pl-3 text-slate-900 dark:text-slate-100 font-mono font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <PersianDatePicker
                      label="تاریخ تولد *"
                      required={true}
                      size="md"
                      labelClassName="text-xs sm:text-sm font-bold block mb-1.5"
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

                  {/* Gender Selector - Icon Buttons */}
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      جنسیت شناگر <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setGender('MALE')}
                        className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          gender === 'MALE'
                            ? 'bg-sky-500 text-white border-sky-500 shadow-xs ring-2 ring-sky-500/20'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <User className="w-4 h-4" />
                        <span>پسر / آقایان</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender('FEMALE')}
                        className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          gender === 'FEMALE'
                            ? 'bg-pink-500 text-white border-pink-500 shadow-xs ring-2 ring-pink-500/20'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <User className="w-4 h-4" />
                        <span>دختر / بانوان</span>
                      </button>
                    </div>
                  </div>

                  {/* School Name */}
                  <div className="sm:col-span-2">
                    <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      نام مدرسه یا مقطع تحصیلی <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <School className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="مثال: دبستان و دبیرستان نمونه دولتی رشد"
                        className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-9 pl-3 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Photo Card */}
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      عکس پرسنلی شناگر <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                      <div className="w-11 h-11 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden border border-slate-300 dark:border-slate-600">
                        {avatarPreview ? (
                          <img src={getMediaUrl(avatarPreview)} alt="عکس پرسنلی" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                          {avatarPreview ? 'عکس انتخاب شد' : 'عکس پرسنلی'}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          حداکثر ۵MB
                        </span>
                      </div>
                      <label className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-400 rounded-lg text-xs font-bold cursor-pointer border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 shrink-0 shadow-2xs">
                        <Camera className="w-3.5 h-3.5" />
                        <span>انتخاب</span>
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
                <div className="flex items-center justify-end pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full sm:w-auto px-6 sm:px-7 py-2.5 sm:py-3 text-xs sm:text-sm font-bold gap-2 cursor-pointer shadow-sm rounded-xl sm:rounded-2xl bg-sky-600 hover:bg-sky-700 text-white"
                  >
                    <span>گام بعدی: اطلاعات والدین</span>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: PARENTS, JOBS & ADDRESS */}
            {currentStep === 2 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-7 shadow-xs space-y-4 sm:space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <Home className="w-5 h-5 text-sky-600 shrink-0" />
                  <h2 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white">گام دوم: اطلاعات اولیاء، شغل والدین و نشانی منزل</h2>
                </div>

                <div className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl text-xs sm:text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2 font-medium leading-relaxed">
                  <Phone className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>ثبت شماره تماس و شغل هر دو والد (جهت اعزام مسابقات اصناف و ادارات) الزامی است.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
                  {/* Father Phone */}
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      شماره تماس پدر <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={fatherPhone}
                        onChange={(e) => setFatherPhone(e.target.value)}
                        placeholder="09123456789"
                        className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-9 pl-3 text-slate-900 dark:text-slate-100 font-mono font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Father Job */}
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      شغل پدر <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={fatherJob}
                        onChange={(e) => setFatherJob(e.target.value)}
                        placeholder="مثال: کارمند، پزشک، مهندس، آزاد..."
                        className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-9 pl-3 text-slate-900 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Mother Phone */}
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      شماره تماس مادر <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={motherPhone}
                        onChange={(e) => setMotherPhone(e.target.value)}
                        placeholder="09129876543"
                        className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-9 pl-3 text-slate-900 dark:text-slate-100 font-mono font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Mother Job */}
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      شغل مادر <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={motherJob}
                        onChange={(e) => setMotherJob(e.target.value)}
                        placeholder="مثال: فرهنگی، پزشک، خانه‌دار، کارمند..."
                        className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-9 pl-3 text-slate-900 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Home Address */}
                  <div className="sm:col-span-2">
                    <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      آدرس دقیق متنی منزل <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                      <textarea
                        required
                        rows={2}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="شهر، خیابان، کوچه، پلاک، واحد..."
                        className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-9 pl-3 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Interactive Map Picker */}
                  <div className="sm:col-span-2">
                    <MapLocationPicker
                      latitude={latitude}
                      longitude={longitude}
                      onChange={({ lat, lng, address: selectedAddr }) => {
                        setLatitude(lat);
                        setLongitude(lng);
                        if (selectedAddr && (!address || address.trim() === '')) {
                          setAddress(selectedAddr);
                        }
                      }}
                      label="مشخص کردن موقعیت منزل روی نقشه *"
                      height="260px"
                    />
                  </div>
                </div>

                {/* Step 2 Actions */}
                <div className="flex items-center justify-between gap-2 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold gap-1 sm:gap-2 cursor-pointer rounded-xl sm:rounded-2xl border-slate-200 dark:border-slate-700"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>گام قبل</span>
                    <span className="hidden sm:inline">: مشخصات فردی</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="px-4 sm:px-7 py-2.5 sm:py-3 text-xs sm:text-sm font-bold gap-1 sm:gap-2 cursor-pointer shadow-sm rounded-xl sm:rounded-2xl bg-sky-600 hover:bg-sky-700 text-white"
                  >
                    <span>گام بعد</span>
                    <span className="hidden sm:inline">: بارگذاری مدارک</span>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: DOCUMENTS */}
            {currentStep === 3 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-7 shadow-xs space-y-4 sm:space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0" />
                  <h2 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white">گام سوم: بارگذاری مدارک هویتی و ورزشی</h2>
                  <span className="text-[11px] sm:text-xs text-slate-400 mr-auto font-medium">هر ۳ مدرک الزامی است</span>
                </div>

                {documentsRejectionReason && (
                  <div className="p-3.5 sm:p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-2xl text-xs sm:text-sm text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
                    <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <h4 className="font-bold mb-0.5">پیام مدیریت آموزشگاه برای اصلاح مدارک:</h4>
                      <p className="leading-relaxed font-medium">{documentsRejectionReason}</p>
                    </div>
                  </div>
                )}

                {/* 3 Responsive Document Upload Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5">
                  {/* Birth Certificate Card */}
                  <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                        صفحه اول شناسنامه <span className="text-rose-500 font-bold">*</span>
                      </span>
                      {birthCertStatus === 'APPROVED' ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> تأییدشده
                        </span>
                      ) : birthCertPreview ? (
                        <span className="text-[10px] font-bold text-sky-600 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md">
                          بارگذاری‌شده
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">
                          الزامی
                        </span>
                      )}
                    </div>

                    <div className="h-40 sm:h-44 rounded-xl bg-slate-200 dark:bg-slate-700/50 flex items-center justify-center overflow-hidden border border-dashed border-slate-300 dark:border-slate-600 relative group">
                      {birthCertPreview ? (
                        <>
                          <img src={birthCertPreview} alt="شناسنامه" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewDocModal({ title: 'صفحه اول شناسنامه', url: birthCertPreview })}
                              title="مشاهده تصویر کامل"
                              className="p-2 bg-white/90 text-slate-800 rounded-xl hover:bg-white transition-all cursor-pointer shadow-md"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-3 text-slate-400">
                          <Upload className="w-7 h-7 mx-auto mb-1 opacity-60" />
                          <span className="text-xs font-medium block">تصویر شناسنامه</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex-1 py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs">
                        <Upload className="w-3.5 h-3.5 text-sky-600" />
                        <span>{birthCertPreview ? 'تغییر تصویر' : 'انتخاب تصویر'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, setBirthCertImage, setBirthCertPreview)}
                        />
                      </label>
                      {birthCertPreview && (
                        <button
                          type="button"
                          onClick={() => setPreviewDocModal({ title: 'صفحه اول شناسنامه', url: birthCertPreview })}
                          title="مشاهده بزرگنمایی"
                          className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* National Card */}
                  <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                        کارت ملی شناگر <span className="text-rose-500 font-bold">*</span>
                      </span>
                      {nationalCardStatus === 'APPROVED' ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> تأییدشده
                        </span>
                      ) : nationalCardPreview ? (
                        <span className="text-[10px] font-bold text-sky-600 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md">
                          بارگذاری‌شده
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">
                          الزامی
                        </span>
                      )}
                    </div>

                    <div className="h-40 sm:h-44 rounded-xl bg-slate-200 dark:bg-slate-700/50 flex items-center justify-center overflow-hidden border border-dashed border-slate-300 dark:border-slate-600 relative group">
                      {nationalCardPreview ? (
                        <>
                          <img src={nationalCardPreview} alt="کارت ملی" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewDocModal({ title: 'کارت ملی شناگر', url: nationalCardPreview })}
                              title="مشاهده تصویر کامل"
                              className="p-2 bg-white/90 text-slate-800 rounded-xl hover:bg-white transition-all cursor-pointer shadow-md"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-3 text-slate-400">
                          <CreditCard className="w-7 h-7 mx-auto mb-1 opacity-60" />
                          <span className="text-xs font-medium block">تصویر کارت ملی</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex-1 py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs">
                        <Upload className="w-3.5 h-3.5 text-sky-600" />
                        <span>{nationalCardPreview ? 'تغییر تصویر' : 'انتخاب تصویر'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, setNationalCardImage, setNationalCardPreview)}
                        />
                      </label>
                      {nationalCardPreview && (
                        <button
                          type="button"
                          onClick={() => setPreviewDocModal({ title: 'کارت ملی شناگر', url: nationalCardPreview })}
                          title="مشاهده بزرگنمایی"
                          className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sports Insurance */}
                  <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                        کارت بیمه ورزشی <span className="text-rose-500 font-bold">*</span>
                      </span>
                      {sportsInsuranceStatus === 'APPROVED' ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> تأییدشده
                        </span>
                      ) : sportsInsurancePreview ? (
                        <span className="text-[10px] font-bold text-sky-600 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md">
                          بارگذاری‌شده
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">
                          الزامی
                        </span>
                      )}
                    </div>

                    <div className="h-40 sm:h-44 rounded-xl bg-slate-200 dark:bg-slate-700/50 flex items-center justify-center overflow-hidden border border-dashed border-slate-300 dark:border-slate-600 relative group">
                      {sportsInsurancePreview ? (
                        <>
                          <img src={sportsInsurancePreview} alt="بیمه ورزشی" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewDocModal({ title: 'کارت بیمه ورزشی', url: sportsInsurancePreview })}
                              title="مشاهده تصویر کامل"
                              className="p-2 bg-white/90 text-slate-800 rounded-xl hover:bg-white transition-all cursor-pointer shadow-md"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-3 text-slate-400">
                          <ShieldCheck className="w-7 h-7 mx-auto mb-1 opacity-60" />
                          <span className="text-xs font-medium block">تصویر بیمه ورزشی</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex-1 py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs">
                        <Upload className="w-3.5 h-3.5 text-sky-600" />
                        <span>{sportsInsurancePreview ? 'تغییر تصویر' : 'انتخاب تصویر'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, setSportsInsuranceImage, setSportsInsurancePreview)}
                        />
                      </label>
                      {sportsInsurancePreview && (
                        <button
                          type="button"
                          onClick={() => setPreviewDocModal({ title: 'کارت بیمه ورزشی', url: sportsInsurancePreview })}
                          title="مشاهده بزرگنمایی"
                          className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Step 3 Actions */}
                <div className="flex items-center justify-between gap-2 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold gap-1 sm:gap-2 cursor-pointer rounded-xl sm:rounded-2xl border-slate-200 dark:border-slate-700 min-w-0 !shrink"
                  >
                    <ArrowRight className="w-4 h-4 shrink-0" />
                    <span className="truncate">گام قبل</span>
                    <span className="hidden sm:inline">: اطلاعات والدین</span>
                  </Button>
                  <Button
                    type="submit"
                    loading={saving}
                    className="px-3.5 sm:px-8 py-2.5 sm:py-3.5 text-xs sm:text-sm font-bold gap-1.5 sm:gap-2 cursor-pointer shadow-md shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl sm:rounded-2xl min-w-0 !shrink"
                  >
                    <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
                    <span className="truncate hidden sm:inline">ثبت نهایی و ارسال مدارک</span>
                    <span className="truncate sm:hidden">ثبت نهایی مدارک</span>
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB: SWIMMER PERFORMANCE (Progress Chart, Medals, Comments, Videos) */}
      {/* =================================================================== */}
      {activeMainTab === 'PERFORMANCE' && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
          <SwimmerPerformanceSection
            swimmerId={activeSwimmerId || profileSwimmerId}
            swimmerName={firstName && lastName ? `${firstName} ${lastName}` : ''}
          />
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB: COACH ASSESSMENTS & PERFORMANCE DOSSIER                        */}
      {/* =================================================================== */}
      {activeMainTab === 'ASSESSMENTS' && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
          {/* Header Summary Card */}
          <div className="bg-gradient-to-l from-sky-600 via-blue-600 to-indigo-700 rounded-3xl p-4 sm:p-6 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/15 backdrop-blur-md rounded-full text-[11px] sm:text-xs font-bold text-sky-100">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                کارنامه و ارزیابی‌های فنی شناگر
              </div>
              <h2 className="text-base sm:text-xl font-black">
                سطح آموزشی: {profileLevelName || 'سطح پایه / مقدماتی'}
              </h2>
              <p className="text-xs sm:text-sm text-sky-100 max-w-xl">
                ارزیابی‌های ثبت‌شده و توصیه‌های آموزشی کادر مربیگری آکادمی
              </p>
            </div>

            <Link
              to="/swimmer/progress"
              className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-white text-blue-700 hover:bg-sky-50 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 self-end sm:self-auto cursor-pointer"
            >
              <span>ماتریس مهارت‌ها</span>
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>

          {/* KPI Mini-cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs text-center sm:text-right">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 block mb-0.5 sm:mb-1">کل ارزیابی‌ها</span>
              <span className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white font-mono">{assessments.length}</span>
            </div>
            <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs text-center sm:text-right">
              <span className="text-[11px] sm:text-xs font-bold text-emerald-600 block mb-0.5 sm:mb-1">قبول‌شده</span>
              <span className="text-lg sm:text-2xl font-black text-emerald-600 font-mono">
                {assessments.filter((a) => a.status === 'PASSED').length}
              </span>
            </div>
            <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs text-center sm:text-right">
              <span className="text-[11px] sm:text-xs font-bold text-amber-600 block mb-0.5 sm:mb-1">در حال تمرین</span>
              <span className="text-lg sm:text-2xl font-black text-amber-600 font-mono">
                {assessments.filter((a) => a.status !== 'PASSED').length}
              </span>
            </div>
          </div>

          {/* Assessments List */}
          {assessments.length > 0 ? (
            <div className="space-y-3 sm:space-y-3.5">
              {assessments.map((ass) => {
                const dateStr = (ass.assessed_at || ass.assessment_date)
                  ? toShamsiDate(ass.assessed_at || ass.assessment_date)?.shortNumeric
                  : '—';
                const hasFeedback = Boolean((ass.feedback || ass.notes)?.trim());

                return (
                  <div
                    key={ass.id}
                    className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 transition-all hover:border-sky-300 dark:hover:border-sky-800"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border ${
                            ass.status === 'PASSED'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {ass.score !== undefined && ass.score !== null ? `${Math.round(ass.score)}` : '—'}
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                            {ass.skill_name || 'سرفصل مهارتی'}
                          </h3>
                          <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-500 mt-0.5 flex-wrap">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              <span>{ass.assessed_by_name || 'کادر فنی آکادمی'}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-mono">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{dateStr}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {ass.score !== undefined && ass.score !== null && (
                          <span className="text-[11px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {Math.round(ass.score)} / ۱۰۰
                          </span>
                        )}
                        <Badge variant={ass.status === 'PASSED' ? 'success' : 'warning'}>
                          {ass.status_display || (ass.status === 'PASSED' ? 'قبول' : 'در حال تمرین')}
                        </Badge>
                      </div>
                    </div>

                    {/* Coach Feedback Box */}
                    {hasFeedback ? (
                      <div className="p-3 sm:p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/60 text-xs sm:text-sm text-slate-700 dark:text-slate-200 space-y-1">
                        <span className="font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1.5 text-xs">
                          <FileText className="w-3.5 h-3.5 text-sky-600" />
                          نکات آموزشی مربی:
                        </span>
                        <p className="leading-relaxed font-normal">
                          «{ass.feedback || ass.notes}»
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        توضیحات متنی برای این ارزیابی ثبت نشده است.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
              <Award className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-sm sm:text-lg font-bold text-slate-800 dark:text-slate-200">
                هنوز ارزیابی توسط مربی ثبت نشده است
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                پس از برگزاری جلسات تمرینی یا آزمون‌های تعیین سطح، نمرات و توصیه‌های مربی در این بخش نمایش داده می‌شوند.
              </p>
              <div className="pt-2">
                <Link
                  to="/swimmer/progress"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs sm:text-sm font-bold hover:bg-sky-100 transition-colors"
                >
                  <span>مشاهده نقشه راه مهارت‌ها</span>
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: PASSWORD & SECURITY (With Proper Account Management at Bottom)*/}
      {/* =================================================================== */}
      {activeMainTab === 'SECURITY' && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
          {/* Warning for Initial Password */}
          {user && !user.is_password_changed && (
            <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-100">
                  توجه امنیتی: شما هنوز کلمه عبور اختصاصی تعیین نکرده‌اید!
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-200/90 leading-relaxed font-medium">
                  جهت ورود مستقیم بدون نیاز به پیامک، پیشنهاد می‌شود یک رمز عبور اختصاصی تعیین فرمایید.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Password Form Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <KeyRound className="w-4.5 h-4.5 text-sky-600" />
                تعیین یا تغییر کلمه عبور اختصاصی
              </h3>

              <form onSubmit={handlePasswordChange} className="space-y-3.5 sm:space-y-4">
                <PasswordRequirementsList password={passwordForm.new_password} showAlways={true} />

                {/* Old password (only if password was previously changed) */}
                {user?.is_password_changed && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      کلمه عبور فعلی <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showOld ? 'text' : 'password'}
                        required
                        value={passwordForm.old_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                        placeholder="کلمه عبور فعلی خود را وارد کنید"
                        className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-9 pl-9 text-slate-900 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOld(!showOld)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
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
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNew ? 'text' : 'password'}
                      required
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      placeholder="حداقل ۸ کاراکتر شامل حروف و اعداد"
                      className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-9 pl-9 text-slate-900 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
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
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                      placeholder="تکرار کلمه عبور جدید"
                      className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-9 pl-9 text-slate-900 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  loading={changingPassword}
                  className="w-full py-2.5 sm:py-3 text-xs sm:text-sm font-bold rounded-xl cursor-pointer bg-sky-600 hover:bg-sky-700 text-white"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>ذخیره کلمه عبور جدید</span>
                </Button>
              </form>
            </div>

            {/* Account & Session Management Cards */}
            <div className="space-y-4">
              {/* OTP Phone Verification Info */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <Smartphone className="w-4.5 h-4.5 text-sky-600" />
                  ورود سریع با پیامک (OTP)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  شماره همراه شما در سامانه تأیید شده است و همواره می‌توانید با رمز یکبارمصرف پیامکی وارد شوید.
                </p>

                <div className="p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">شماره ثبت‌شده:</span>
                      <span className="text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white">
                        {user?.phone || '—'}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3" />
                    تأییدشده
                  </span>
                </div>
              </div>

              {/* Data Protection & Privacy Notice */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  حریم خصوصی و امنیت پرونده
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  اطلاعات هویتی، آدرس و مدارک بارگذاری‌شده شناگر در سرورهای ابری امن آکادمی ذخیره و تنها توسط کادر مجاز آموزشگاه قابل ارزیابی هستند.
                </p>
              </div>

              {/* Account Management & Logout Card (Properly Positioned at Bottom of Security) */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-rose-100 dark:border-rose-950/40 shadow-xs space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <LogOut className="w-4 h-4 text-rose-600" />
                  مدیریت نشست و خروج از حساب
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  در صورت استفاده از دستگاه‌های اشتراکی یا عمومی، جهت حفظ امنیت حساب خود می‌توانید از اینجا خارج شوید.
                </p>
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(true)}
                  className="w-full py-2.5 px-4 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>خروج از حساب کاربری</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. MODALS (Document Zoom & Logout Confirmation)                     */}
      {/* =================================================================== */}
      {/* Document Full-Size Zoom / Preview Modal */}
      {previewDocModal && (
        <Modal
          isOpen={Boolean(previewDocModal)}
          onClose={() => setPreviewDocModal(null)}
          title={previewDocModal.title}
          maxWidth="max-w-2xl"
        >
          <div className="flex flex-col items-center justify-center p-2">
            <img
              src={previewDocModal.url}
              alt={previewDocModal.title}
              className="max-h-[70vh] max-h-[70dvh] w-auto max-w-full rounded-2xl object-contain shadow-md"
            />
          </div>
        </Modal>
      )}

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        userName={displayName}
        userRole="شناگر"
      />

      {/* Registration & 3-Step Completion Success Modal */}
      <RegistrationSuccessModal
        isOpen={showRegistrationSuccessModal}
        onClose={() => setShowRegistrationSuccessModal(false)}
        swimmerName={firstName && lastName ? `${firstName} ${lastName}`.trim() : displayName}
      />
    </div>
  );
};
