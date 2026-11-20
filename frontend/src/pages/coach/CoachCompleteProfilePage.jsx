import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  User, Calendar, CreditCard, Home, Phone, Upload, CheckCircle2,
  AlertCircle, ShieldCheck, FileText, Sparkles, ArrowLeft, ArrowRight,
  Eye, MapPin, Briefcase, Award, Shield, FileCheck, Check, Clock
} from 'lucide-react';
import * as jalaali from 'jalaali-js';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { PersianDatePicker } from '../../components/common/PersianDatePicker';
import { CustomSelect } from '../../components/common/CustomSelect';

export const CoachCompleteProfilePage = () => {
  const { user, updateUserData } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const DRAFT_KEY = user?.id ? `coach_profile_draft_${user.id}` : 'coach_profile_draft';
  const STEP_KEY = user?.id ? `coach_profile_step_${user.id}` : 'coach_profile_step';

  const readSavedDraft = () => {
    try {
      const specific = user?.id ? localStorage.getItem(`coach_profile_draft_${user.id}`) : null;
      const generic = localStorage.getItem('coach_profile_draft');
      const raw = specific || generic;
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Error reading draft from localStorage:', e);
    }
    return {};
  };

  const readSavedStep = () => {
    const urlStep = parseInt(searchParams.get('step'), 10);
    if (urlStep >= 1 && urlStep <= 4) return urlStep;
    try {
      const specific = user?.id ? localStorage.getItem(`coach_profile_step_${user.id}`) : null;
      const generic = localStorage.getItem('coach_profile_step');
      const savedStep = parseInt(specific || generic, 10);
      if (savedStep >= 1 && savedStep <= 4) return savedStep;
    } catch (e) {
      console.error('Error reading step from localStorage:', e);
    }
    return 1;
  };

  // 4 Steps: 1: هویت فردی, 2: نشانی و ارتباط اضطراری, 3: درجه و مدارک مربیگری, 4: اطلاعات بانکی
  const [currentStep, setCurrentStep] = useState(readSavedStep);

  // Sync currentStep with URL search params and localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STEP_KEY, String(currentStep));
      setSearchParams({ step: String(currentStep) }, { replace: true });
    } catch (e) {
      console.error('Error syncing step:', e);
    }
  }, [currentStep, STEP_KEY, setSearchParams]);

  // Read initial draft for state defaults
  const initialDraft = readSavedDraft();

  // Step 1: هویت فردی
  const [firstName, setFirstName] = useState(initialDraft.firstName ?? user?.first_name ?? '');
  const [lastName, setLastName] = useState(initialDraft.lastName ?? user?.last_name ?? '');
  const [nationalId, setNationalId] = useState(initialDraft.nationalId ?? user?.national_id ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(initialDraft.dateOfBirth ?? '');
  const [gender, setGender] = useState(initialDraft.gender ?? 'MALE');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Step 2: نشانی و ارتباط اضطراری
  const [address, setAddress] = useState(initialDraft.address ?? '');
  const [emergencyContactName, setEmergencyContactName] = useState(initialDraft.emergencyContactName ?? '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(initialDraft.emergencyContactPhone ?? '');

  // Step 3: درجه و مدارک مربیگری
  const [coachingDegree, setCoachingDegree] = useState(initialDraft.coachingDegree ?? 'GRADE_3');
  const [coachingCertificateDate, setCoachingCertificateDate] = useState(initialDraft.coachingCertificateDate ?? '');
  const [coachingCertificateFile, setCoachingCertificateFile] = useState(null);
  const [coachingCertificateFilePreview, setCoachingCertificateFilePreview] = useState(null);
  const [yearsOfExperience, setYearsOfExperience] = useState(initialDraft.yearsOfExperience ?? 1);
  const [bio, setBio] = useState(initialDraft.bio ?? '');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeFileName, setResumeFileName] = useState('');

  // بازآموزی سال جاری
  const [retrainingCertificateFile, setRetrainingCertificateFile] = useState(null);
  const [retrainingCertificateFilePreview, setRetrainingCertificateFilePreview] = useState(null);
  const [retrainingStatus, setRetrainingStatus] = useState('UNUPLOADED');
  const [retrainingYear, setRetrainingYear] = useState(null);
  const [retrainingExpiryDate, setRetrainingExpiryDate] = useState('');
  const [retrainingRejectionReason, setRetrainingRejectionReason] = useState('');

  // Step 4: اطلاعات بانکی
  const [cardNumber, setCardNumber] = useState(initialDraft.cardNumber ?? '');
  const [shabaNumber, setShabaNumber] = useState(initialDraft.shabaNumber ?? '');

  const [isCompletedBefore, setIsCompletedBefore] = useState(false);

  const currentJalaliYear = React.useMemo(() => {
    try {
      return jalaali.toJalaali(new Date()).jy;
    } catch {
      return 1405;
    }
  }, []);

  // Degree options matching backend CoachingDegree
  const degreeOptions = [
    { value: 'GRADE_3', label: 'مربیگری درجه ۳ فدراسیون', description: 'آموزش شنا مقدماتی و تکنیک‌های ۴ شنا' },
    { value: 'GRADE_2', label: 'مربیگری درجه ۲ فدراسیون', description: 'تیم‌های پایه و دوره‌های نیمه‌پیشرفته' },
    { value: 'GRADE_1', label: 'مربیگری درجه ۱ فدراسیون', description: 'تیم‌های استانی و مسابقات حرفه‌ای' },
    { value: 'NATIONAL', label: 'مربیگری ملی شنا', description: 'تیم‌های لیگ برتر و منتخب استان' },
    { value: 'INTERNATIONAL', label: 'مربیگری بین‌المللی (FINA / World Aquatics)', description: 'مربیگری دوره‌های جهانی و بین‌المللی' },
  ];

  // Fetch coach current profile data
  useEffect(() => {
    let isMounted = true;
    const fetchCoachData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/coaches/me/');
        if (!isMounted) return;
        const data = res.data;
        const draft = readSavedDraft();

        setFirstName(draft.firstName !== undefined && draft.firstName !== '' ? draft.firstName : (data.first_name || user?.first_name || ''));
        setLastName(draft.lastName !== undefined && draft.lastName !== '' ? draft.lastName : (data.last_name || user?.last_name || ''));
        setNationalId(draft.nationalId !== undefined && draft.nationalId !== '' ? draft.nationalId : (data.national_id || user?.national_id || ''));
        setDateOfBirth(draft.dateOfBirth !== undefined && draft.dateOfBirth !== '' ? draft.dateOfBirth : (data.date_of_birth || ''));
        setGender(draft.gender !== undefined && draft.gender !== '' ? draft.gender : (data.gender || 'MALE'));
        if (data.avatar || user?.avatar) setAvatarPreview(data.avatar || user?.avatar);

        setAddress(draft.address !== undefined && draft.address !== '' ? draft.address : (data.address || ''));
        setEmergencyContactName(draft.emergencyContactName !== undefined && draft.emergencyContactName !== '' ? draft.emergencyContactName : (data.emergency_contact_name || ''));
        setEmergencyContactPhone(draft.emergencyContactPhone !== undefined && draft.emergencyContactPhone !== '' ? draft.emergencyContactPhone : (data.emergency_contact_phone || ''));

        setCoachingDegree(draft.coachingDegree !== undefined && draft.coachingDegree !== '' ? draft.coachingDegree : (data.coaching_degree || 'GRADE_3'));
        setCoachingCertificateDate(draft.coachingCertificateDate !== undefined && draft.coachingCertificateDate !== '' ? draft.coachingCertificateDate : (data.coaching_certificate_date || ''));
        if (data.coaching_certificate_file) {
          setCoachingCertificateFilePreview(data.coaching_certificate_file);
        }
        setYearsOfExperience(draft.yearsOfExperience !== undefined && draft.yearsOfExperience !== '' ? draft.yearsOfExperience : (data.years_of_experience ?? 1));
        setBio(draft.bio !== undefined && draft.bio !== '' ? draft.bio : (data.bio || ''));
        if (data.resume_file) {
          setResumeFileName(data.resume_file.split('/').pop() || 'فایل رزومه');
        }

        if (data.retraining_certificate_file_url || data.retraining_certificate_file) {
          setRetrainingCertificateFilePreview(data.retraining_certificate_file_url || data.retraining_certificate_file);
        }
        if (data.retraining_status) setRetrainingStatus(data.retraining_status);
        if (data.retraining_year) setRetrainingYear(data.retraining_year);
        if (data.retraining_expiry_date) setRetrainingExpiryDate(data.retraining_expiry_date);
        if (data.retraining_rejection_reason) setRetrainingRejectionReason(data.retraining_rejection_reason);

        setCardNumber(draft.cardNumber !== undefined && draft.cardNumber !== '' ? draft.cardNumber : (data.card_number || ''));
        setShabaNumber(draft.shabaNumber !== undefined && draft.shabaNumber !== '' ? draft.shabaNumber : (data.shaba_number || ''));

        setIsCompletedBefore(Boolean(data.is_profile_completed));
      } catch (err) {
        console.error('Error fetching coach profile:', err);
        if (!isMounted) return;
        const draft = readSavedDraft();
        setFirstName(draft.firstName !== undefined && draft.firstName !== '' ? draft.firstName : (user?.first_name || ''));
        setLastName(draft.lastName !== undefined && draft.lastName !== '' ? draft.lastName : (user?.last_name || ''));
        setNationalId(draft.nationalId !== undefined && draft.nationalId !== '' ? draft.nationalId : (user?.national_id || ''));
        if (draft.dateOfBirth) setDateOfBirth(draft.dateOfBirth);
        if (draft.gender) setGender(draft.gender);
        if (draft.address) setAddress(draft.address);
        if (draft.emergencyContactName) setEmergencyContactName(draft.emergencyContactName);
        if (draft.emergencyContactPhone) setEmergencyContactPhone(draft.emergencyContactPhone);
        if (draft.coachingDegree) setCoachingDegree(draft.coachingDegree);
        if (draft.coachingCertificateDate) setCoachingCertificateDate(draft.coachingCertificateDate);
        if (draft.yearsOfExperience !== undefined && draft.yearsOfExperience !== '') setYearsOfExperience(draft.yearsOfExperience);
        if (draft.bio) setBio(draft.bio);
        if (draft.cardNumber) setCardNumber(draft.cardNumber);
        if (draft.shabaNumber) setShabaNumber(draft.shabaNumber);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCoachData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Persist form draft whenever fields change (after initial loading)
  useEffect(() => {
    if (loading) return;
    try {
      const draft = {
        firstName,
        lastName,
        nationalId,
        dateOfBirth,
        gender,
        address,
        emergencyContactName,
        emergencyContactPhone,
        coachingDegree,
        coachingCertificateDate,
        yearsOfExperience,
        bio,
        cardNumber,
        shabaNumber,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      console.error('Error saving draft to localStorage:', e);
    }
  }, [
    loading,
    firstName,
    lastName,
    nationalId,
    dateOfBirth,
    gender,
    address,
    emergencyContactName,
    emergencyContactPhone,
    coachingDegree,
    coachingCertificateDate,
    yearsOfExperience,
    bio,
    cardNumber,
    shabaNumber,
    DRAFT_KEY,
  ]);

  // Clear specific field error on user interaction
  const clearFieldError = (fieldName) => {
    setFieldErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

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
    const errors = {};
    if (!firstName.trim()) {
      errors.firstName = 'وارد کردن نام الزامی است.';
    }
    if (!lastName.trim()) {
      errors.lastName = 'وارد کردن نام خانوادگی الزامی است.';
    }
    const cleanNid = nationalId.trim();
    if (!cleanNid) {
      errors.nationalId = 'وارد کردن کد ملی ۱۰ رقمی الزامی است.';
    } else if (cleanNid.length !== 10 || !/^\d+$/.test(cleanNid)) {
      errors.nationalId = 'کد ملی باید دقیقاً ۱۰ رقم عددی باشد.';
    }
    if (!dateOfBirth) {
      errors.dateOfBirth = 'ثبت تاریخ تولد الزامی است.';
    }
    if (!avatar && !avatarPreview) {
      errors.avatar = 'بارگذاری عکس الزامی است.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...errors }));
      setError(Object.values(errors)[0]);
      return false;
    }
    return true;
  };

  // Step 2 Validation: آدرس محل سکونت، نام مخاطب اضطراری، شماره مخاطب اضطراری
  const validateStep2 = () => {
    setError('');
    const errors = {};
    if (!address.trim()) {
      errors.address = 'وارد کردن آدرس کامل محل سکونت الزامی است.';
    }
    if (!emergencyContactName.trim()) {
      errors.emergencyContactName = 'وارد کردن نام و نام خانوادگی مخاطب اضطراری الزامی است.';
    }
    const cleanEmergPhone = emergencyContactPhone.trim();
    if (!cleanEmergPhone) {
      errors.emergencyContactPhone = 'شماره تماس مخاطب اضطراری الزامی است.';
    } else if (!/^09\d{9}$/.test(cleanEmergPhone)) {
      errors.emergencyContactPhone = 'شماره تماس مخاطب اضطراری باید یک شماره موبایل معتبر ۱۱ رقمی (شروع با ۰۹) باشد.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...errors }));
      setError(Object.values(errors)[0]);
      return false;
    }
    return true;
  };

  // Step 3 Validation: درجه مربیگری، تاریخ اخذ، آپلود مدرک، سابقه کار، رزومه
  const validateStep3 = () => {
    setError('');
    const errors = {};
    if (!coachingDegree) {
      errors.coachingDegree = 'انتخاب درجه مربیگری الزامی است.';
    }
    if (!coachingCertificateDate) {
      errors.coachingCertificateDate = 'ثبت تاریخ اخذ مدرک مربیگری الزامی است.';
    }
    if (!coachingCertificateFile && !coachingCertificateFilePreview) {
      errors.coachingCertificateFile = 'بارگذاری تصویر یا فایل مدرک مربیگری الزامی است.';
    }
    if (!retrainingCertificateFile && !retrainingCertificateFilePreview) {
      errors.retrainingCertificateFile = 'بارگذاری فایل گواهی بازآموزی سال جاری الزامی است.';
    }
    if (yearsOfExperience === '' || Number(yearsOfExperience) < 0) {
      errors.yearsOfExperience = 'سابقه کار مربیگری الزامی است.';
    }
    if (!bio.trim() && !resumeFile && !resumeFileName) {
      errors.bio = 'وارد کردن شرح رزومه یا بارگذاری فایل رزومه الزامی است.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...errors }));
      setError(Object.values(errors)[0]);
      return false;
    }
    return true;
  };

  // Step 4 Validation: شماره کارت (16 رقمی)، شماره شبا (حداقل 24 کاراکتر)
  const validateStep4 = () => {
    setError('');
    const errors = {};
    const cleanCard = cardNumber.replace(/\D/g, '');
    if (!cleanCard) {
      errors.cardNumber = 'وارد کردن شماره کارت بانکی الزامی است.';
    } else if (cleanCard.length !== 16) {
      errors.cardNumber = 'شماره کارت بانکی باید ۱۶ رقم عددی معتبر باشد.';
    }
    const cleanShaba = shabaNumber.replace(/\s+/g, '').toUpperCase();
    if (!cleanShaba) {
      errors.shabaNumber = 'وارد کردن شماره شبا بانکی الزامی است.';
    } else if (cleanShaba.length < 24) {
      errors.shabaNumber = 'شماره شبا باید معتبر و حداقل ۲۴ نویسه (به همراه کد کشور) باشد.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...errors }));
      setError(Object.values(errors)[0]);
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!validateStep1()) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setFieldErrors({});
      setError('');
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 2) {
      if (!validateStep2()) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setFieldErrors({});
      setError('');
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 3) {
      if (!validateStep3()) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setFieldErrors({});
      setError('');
      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setError('');
    setFieldErrors({});
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = (step) => {
    if (step < currentStep) {
      setError('');
      setFieldErrors({});
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Final Submit
  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validateStep1()) {
      setCurrentStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!validateStep2()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!validateStep3()) {
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!validateStep4()) {
      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      if (retrainingCertificateFile) formData.append('retraining_certificate_file', retrainingCertificateFile);
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

      try {
        localStorage.removeItem(DRAFT_KEY);
        localStorage.removeItem(STEP_KEY);
        localStorage.removeItem('coach_profile_draft');
        localStorage.removeItem('coach_profile_step');
      } catch (storageErr) {
        console.error('Error clearing draft storage:', storageErr);
      }

      if (updateUserData) {
        updateUserData({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          national_id: nationalId.trim(),
          is_profile_completed: true,
          ...(res.data.coach?.avatar ? { avatar: res.data.coach.avatar } : {}),
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
        const backendErrors = {};
        data.missing_fields.forEach((f) => {
          backendErrors[f] = true;
          if (f === 'first_name') backendErrors.firstName = 'وارد کردن نام الزامی است.';
          if (f === 'last_name') backendErrors.lastName = 'وارد کردن نام خانوادگی الزامی است.';
          if (f === 'national_id') backendErrors.nationalId = 'کد ملی الزامی است.';
          if (f === 'date_of_birth') backendErrors.dateOfBirth = 'تاریخ تولد الزامی است.';
          if (f === 'address') backendErrors.address = 'آدرس الزامی است.';
          if (f === 'emergency_contact_name') backendErrors.emergencyContactName = 'نام مخاطب اضطراری الزامی است.';
          if (f === 'emergency_contact_phone') backendErrors.emergencyContactPhone = 'شماره مخاطب اضطراری الزامی است.';
          if (f === 'card_number') backendErrors.cardNumber = 'شماره کارت الزامی است.';
          if (f === 'shaba_number') backendErrors.shabaNumber = 'شماره شبا الزامی است.';
        });
        setFieldErrors((prev) => ({ ...prev, ...backendErrors }));
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
              <button
                type="button"
                key={item.step}
                onClick={() => handleStepClick(item.step)}
                disabled={item.step >= currentStep}
                className={`flex flex-col items-center gap-2 transition-all ${
                  item.step < currentStep ? 'cursor-pointer hover:opacity-85' : 'cursor-default'
                } ${
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
              </button>
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
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    clearFieldError('firstName');
                  }}
                  placeholder="مثال: علی"
                  className={`w-full p-2.5 rounded-xl border text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-colors ${
                    fieldErrors.firstName
                      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50'
                  }`}
                  required
                />
                {fieldErrors.firstName && (
                  <span className="text-[11px] text-rose-500 dark:text-rose-400 font-semibold mt-1 block">
                    {fieldErrors.firstName}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام خانوادگی مربی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    clearFieldError('lastName');
                  }}
                  placeholder="مثال: حسینی"
                  className={`w-full p-2.5 rounded-xl border text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-colors ${
                    fieldErrors.lastName
                      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50'
                  }`}
                  required
                />
                {fieldErrors.lastName && (
                  <span className="text-[11px] text-rose-500 dark:text-rose-400 font-semibold mt-1 block">
                    {fieldErrors.lastName}
                  </span>
                )}
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
                  onChange={(e) => {
                    setNationalId(e.target.value.replace(/\D/g, ''));
                    clearFieldError('nationalId');
                  }}
                  placeholder="0012345678"
                  className={`w-full p-2.5 rounded-xl border font-mono text-slate-900 dark:text-white ${
                    fieldErrors.nationalId
                      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50'
                  }`}
                  required
                />
                {fieldErrors.nationalId && (
                  <span className="text-[11px] text-rose-500 dark:text-rose-400 font-semibold mt-1 block">
                    {fieldErrors.nationalId}
                  </span>
                )}
              </div>

              <div>
                <PersianDatePicker
                  label="تاریخ تولد *"
                  value={dateOfBirth}
                  onChange={(jalaliStr, gDate, gIso) => {
                    setDateOfBirth(gIso || '');
                    clearFieldError('dateOfBirth');
                  }}
                  placeholder="انتخاب تاریخ تولد شمسی..."
                  color="emerald"
                  size="md"
                  required
                  minYear={1330}
                  maxYear={1415}
                  buttonClassName={
                    fieldErrors.dateOfBirth
                      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20 !text-rose-700 dark:!text-rose-300'
                      : ''
                  }
                />
                {fieldErrors.dateOfBirth && (
                  <span className="text-[11px] text-rose-500 dark:text-rose-400 font-semibold mt-1 block">
                    {fieldErrors.dateOfBirth}
                  </span>
                )}
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
                  عکس <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="عکس"
                      className={`w-12 h-12 rounded-xl object-cover border ${
                        fieldErrors.avatar
                          ? 'border-rose-500 ring-2 ring-rose-500/20'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                  ) : (
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        fieldErrors.avatar
                          ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-500 ring-2 ring-rose-500/20 text-rose-500'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <User className="w-6 h-6" />
                    </div>
                  )}
                  <label
                    className={`cursor-pointer px-3 py-2 rounded-xl border flex items-center gap-1.5 transition-colors text-xs font-semibold ${
                      fieldErrors.avatar
                        ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Upload className={`w-4 h-4 ${fieldErrors.avatar ? 'text-rose-600' : 'text-emerald-600'}`} />
                    <span>انتخاب عکس</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        handleFileChange(e, setAvatar, setAvatarPreview);
                        clearFieldError('avatar');
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
                {fieldErrors.avatar && (
                  <span className="text-[11px] text-rose-500 dark:text-rose-400 font-semibold mt-1 block">
                    {fieldErrors.avatar}
                  </span>
                )}
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
                  onChange={(e) => {
                    setAddress(e.target.value);
                    clearFieldError('address');
                  }}
                  placeholder="استان، شهر، خیابان اصلی، کوچه، پلاک، واحد..."
                  className={`w-full p-2.5 rounded-xl border text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-colors leading-relaxed ${
                    fieldErrors.address
                      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50'
                  }`}
                  required
                />
                {fieldErrors.address && (
                  <span className="text-[11px] text-rose-500 dark:text-rose-400 font-semibold mt-1 block">
                    {fieldErrors.address}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام و نام خانوادگی مخاطب اضطراری <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => {
                    setEmergencyContactName(e.target.value);
                    clearFieldError('emergencyContactName');
                  }}
                  placeholder="مثال: رضا حسینی (برادر / همسر / پدر)"
                  className={`w-full p-2.5 rounded-xl border text-slate-900 dark:text-white ${
                    fieldErrors.emergencyContactName
                      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50'
                  }`}
                  required
                />
                {fieldErrors.emergencyContactName && (
                  <span className="text-[11px] text-rose-500 dark:text-rose-400 font-semibold mt-1 block">
                    {fieldErrors.emergencyContactName}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شماره تماس مخاطب اضطراری <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 ${
                    fieldErrors.emergencyContactPhone ? 'text-rose-500' : 'text-slate-400'
                  }`} />
                  <input
                    type="text"
                    dir="ltr"
                    value={emergencyContactPhone}
                    onChange={(e) => {
                      setEmergencyContactPhone(e.target.value);
                      clearFieldError('emergencyContactPhone');
                    }}
                    placeholder="0912..."
                    className={`w-full pr-9 pl-3 py-2.5 rounded-xl border text-slate-900 dark:text-white font-mono ${
                      fieldErrors.emergencyContactPhone
                        ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50'
                    }`}
                    required
                  />
                </div>
                {fieldErrors.emergencyContactPhone && (
                  <span className="text-[11px] text-rose-500 dark:text-rose-400 font-semibold mt-1 block">
                    {fieldErrors.emergencyContactPhone}
                  </span>
                )}
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
                <CustomSelect
                  value={coachingDegree}
                  onChange={(val) => {
                    setCoachingDegree(val);
                    clearFieldError('coachingDegree');
                  }}
                  options={degreeOptions}
                  color="emerald"
                  size="md"
                  icon={Award}
                  buttonClassName={
                    fieldErrors.coachingDegree
                      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20'
                      : ''
                  }
                />
                {fieldErrors.coachingDegree && (
                  <span className="text-[11px] text-rose-500 dark:text-rose-400 font-semibold mt-1 block">
                    {fieldErrors.coachingDegree}
                  </span>
                )}
              </div>

              <div>
                <PersianDatePicker
                  label="تاریخ اخذ مربی‌گری *"
                  value={coachingCertificateDate}
                  onChange={(jalaliStr, gDate, gIso) => {
                    setCoachingCertificateDate(gIso || '');
                    clearFieldError('coachingCertificateDate');
                  }}
                  placeholder="انتخاب تاریخ اخذ گواهی..."
                  color="emerald"
                  size="md"
                  required
                  minYear={1350}
                  maxYear={1415}
                  buttonClassName={
                    fieldErrors.coachingCertificateDate
                      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20 !text-rose-700 dark:!text-rose-300'
                      : ''
                  }
                />
                {fieldErrors.coachingCertificateDate && (
                  <span className="text-[11px] text-rose-500 dark:text-rose-400 font-semibold mt-1 block">
                    {fieldErrors.coachingCertificateDate}
                  </span>
                )}
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
                  onChange={(e) => {
                    setYearsOfExperience(e.target.value);
                    clearFieldError('yearsOfExperience');
                  }}
                  className={`w-full p-2.5 rounded-xl border text-slate-900 dark:text-white font-mono ${
                    fieldErrors.yearsOfExperience
                      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50'
                  }`}
                  required
                />
                {fieldErrors.yearsOfExperience && (
                  <span className="text-[11px] text-rose-500 dark:text-rose-400 font-semibold mt-1 block">
                    {fieldErrors.yearsOfExperience}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  آپلود مدرک مربیگری (PDF یا تصویر) <span className="text-rose-500">*</span>
                </label>
                <label
                  className={`cursor-pointer flex items-center justify-between p-2.5 rounded-xl border border-dashed transition-colors ${
                    fieldErrors.coachingCertificateFile
                      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/50 dark:bg-rose-950/30'
                      : 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/50'
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 truncate ${
                      fieldErrors.coachingCertificateFile
                        ? 'text-rose-800 dark:text-rose-300'
                        : 'text-emerald-800 dark:text-emerald-300'
                    }`}
                  >
                    <Upload className={`w-4 h-4 shrink-0 ${fieldErrors.coachingCertificateFile ? 'text-rose-600' : 'text-emerald-600'}`} />
                    <span className="truncate text-xs font-semibold">
                      {coachingCertificateFile ? coachingCertificateFile.name : coachingCertificateFilePreview ? 'مدرک قبلاً بارگذاری شده (تغییر؟)' : 'انتخاب فایل گواهی...'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => {
                      handleFileChange(e, setCoachingCertificateFile, setCoachingCertificateFilePreview);
                      clearFieldError('coachingCertificateFile');
                    }}
                    className="hidden"
                  />
                </label>
                {fieldErrors.coachingCertificateFile && (
                  <span className="text-[11px] text-rose-500 dark:text-rose-400 font-semibold mt-1 block">
                    {fieldErrors.coachingCertificateFile}
                  </span>
                )}
              </div>

              {/* بخش بازآموزی سال جاری */}
              <div className="sm:col-span-2 p-4 sm:p-5 rounded-2xl border-2 border-emerald-300 dark:border-emerald-700/80 bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-cyan-50/50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-cyan-950/30 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-emerald-200/80 dark:border-emerald-800/80">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-xs">
                        <FileCheck className="w-4 h-4" />
                      </span>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                        بازآموزی سال جاری ({currentJalaliYear}) <span className="text-rose-500">*</span>
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      طبق آیین‌نامه فدراسیون شنا، مربیان ملزم به بارگذاری گواهی بازآموزی سالانه هستند. این مدرک تا <strong className="text-emerald-700 dark:text-emerald-300">پایان اسفند ماه ({currentJalaliYear})</strong> دارای اعتبار است.
                    </p>
                  </div>

                  <div className="shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 text-xs font-bold shadow-2xs">
                      <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>اعتبار تا ۲۹ اسفند {retrainingYear || currentJalaliYear}</span>
                    </span>
                  </div>
                </div>

                {/* Rejection Alert if REJECTED */}
                {retrainingStatus === 'REJECTED' && retrainingRejectionReason && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-bold text-rose-800 dark:text-rose-300 block mb-0.5">علت عدم تأیید گواهی قبلی:</span>
                      <p className="text-rose-700 dark:text-rose-300/90 leading-relaxed">{retrainingRejectionReason}</p>
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-semibold">لطفاً فایل اصلاح‌شده و معتبر بازآموزی سال جاری را مجدداً انتخاب و ثبت فرمایید.</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    آپلود فایل گواهی بازآموزی سال جاری (PDF یا تصویر) <span className="text-rose-500">*</span>
                  </label>
                  <label
                    className={`cursor-pointer flex items-center justify-between p-3 rounded-xl border border-dashed transition-all shadow-2xs ${
                      fieldErrors.retrainingCertificateFile
                        ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/50 dark:bg-rose-950/30'
                        : 'border-emerald-500 dark:border-emerald-600 bg-white/80 dark:bg-slate-900/80 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30'
                    }`}
                  >
                    <div
                      className={`flex items-center gap-2 truncate ${
                        fieldErrors.retrainingCertificateFile
                          ? 'text-rose-800 dark:text-rose-300'
                          : 'text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      <Upload className={`w-4 h-4 shrink-0 ${fieldErrors.retrainingCertificateFile ? 'text-rose-600' : 'text-emerald-600'}`} />
                      <span className="truncate text-xs font-semibold">
                        {retrainingCertificateFile ? retrainingCertificateFile.name : retrainingCertificateFilePreview ? 'گواهی بازآموزی انتخاب شده (تغییر؟)' : 'انتخاب فایل گواهی بازآموزی سال جاری...'}
                      </span>
                    </div>
                    {retrainingCertificateFilePreview && (
                      <a
                        href={retrainingCertificateFilePreview}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 flex items-center gap-1 bg-emerald-100/70 dark:bg-emerald-950 px-2.5 py-1 rounded-lg"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>مشاهده فایل</span>
                      </a>
                    )}
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => {
                        handleFileChange(e, setRetrainingCertificateFile, setRetrainingCertificateFilePreview);
                        clearFieldError('retrainingCertificateFile');
                      }}
                      className="hidden"
                    />
                  </label>
                  {fieldErrors.retrainingCertificateFile && (
                    <span className="text-[11px] text-rose-500 dark:text-rose-400 font-semibold mt-1 block">
                      {fieldErrors.retrainingCertificateFile}
                    </span>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  متن رزومه و خلاصه سوابق حرفه‌ای <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => {
                    setBio(e.target.value);
                    clearFieldError('bio');
                  }}
                  placeholder="سوابق کاری، مربیگری در استخرها و باشگاه‌ها، افتخارات، شاگردان قهرمان..."
                  className={`w-full p-2.5 rounded-xl border text-slate-900 dark:text-white leading-relaxed ${
                    fieldErrors.bio
                      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50'
                  }`}
                  required
                />
                {fieldErrors.bio && (
                  <span className="text-[11px] text-rose-500 dark:text-rose-400 font-semibold mt-1 block">
                    {fieldErrors.bio}
                  </span>
                )}
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
                  <CreditCard className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 ${
                    fieldErrors.cardNumber ? 'text-rose-500' : 'text-slate-400'
                  }`} />
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={19}
                    value={formatCardInput(cardNumber)}
                    onChange={(e) => {
                      setCardNumber(e.target.value.replace(/\D/g, ''));
                      clearFieldError('cardNumber');
                    }}
                    placeholder="6037-9918-XXXX-XXXX"
                    className={`w-full pr-9 pl-3 py-2.5 rounded-xl border font-mono text-center tracking-wider text-slate-900 dark:text-white ${
                      fieldErrors.cardNumber
                        ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50'
                    }`}
                    required
                  />
                </div>
                {fieldErrors.cardNumber ? (
                  <span className="text-[11px] text-rose-500 dark:text-rose-400 font-semibold mt-1 block">
                    {fieldErrors.cardNumber}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    کارت بانکی باید به نام شخص مربی ({firstName || '...'} {lastName || '...'}) باشد.
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شماره شبا بانکی (IBAN) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold ${
                    fieldErrors.shabaNumber ? 'text-rose-500' : 'text-slate-500'
                  }`}>
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
                      clearFieldError('shabaNumber');
                    }}
                    placeholder="24 رقمی بدون IR"
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border font-mono text-left tracking-wider text-slate-900 dark:text-white ${
                      fieldErrors.shabaNumber
                        ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50'
                    }`}
                    required
                  />
                </div>
                {fieldErrors.shabaNumber ? (
                  <span className="text-[11px] text-rose-500 dark:text-rose-400 font-semibold mt-1 block">
                    {fieldErrors.shabaNumber}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    شماره شبا بدون احتساب حروف IR دارای ۲۴ رقم عددی است.
                  </span>
                )}
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
        <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between gap-2 sm:gap-3">
          {/* دکمه سمت راست: مرحله قبل */}
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 flex-1 sm:flex-initial sm:min-w-[140px] justify-center min-h-[44px] min-w-0 !shrink"
            >
              <ArrowRight className="w-4 h-4 shrink-0" />
              <span className="truncate">مرحله قبل</span>
            </Button>
          ) : (
            <div className="hidden sm:block" />
          )}

          {/* دکمه سمت چپ: مرحله بعد / ثبت نهایی */}
          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={handleNextStep}
              className={`gap-1.5 sm:gap-2 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs px-3 sm:px-5 justify-center min-h-[44px] font-bold min-w-0 !shrink ${
                currentStep > 1 ? 'flex-1 sm:flex-initial sm:min-w-[140px]' : 'w-full sm:w-auto sm:min-w-[140px]'
              }`}
            >
              <span className="truncate">مرحله بعد</span>
              <ArrowLeft className="w-4 h-4 shrink-0" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-1.5 sm:gap-2 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 px-3 sm:px-6 py-2.5 flex-1 sm:flex-initial sm:min-w-[180px] justify-center min-h-[44px] font-bold min-w-0 !shrink"
            >
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span className="truncate hidden sm:inline">
                {submitting ? 'در حال ثبت نهایی...' : 'ثبت نهایی و تکمیل پرونده مربیگری'}
              </span>
              <span className="truncate sm:hidden">
                {submitting ? 'در حال ثبت...' : 'ثبت نهایی پرونده'}
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
