import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Calendar, CreditCard, Home, Phone, Upload, CheckCircle2,
  AlertCircle, ShieldCheck, FileText, Image as ImageIcon, School,
  Sparkles, ArrowLeft, Trash2, Eye
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

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [gender, setGender] = useState('MALE');
  const [schoolName, setSchoolName] = useState('');

  // Parent Phones & Address
  const [fatherPhone, setFatherPhone] = useState('');
  const [motherPhone, setMotherPhone] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  // File Uploads (File object or existing URL)
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation for Star (*) items:
    // * نام و نام خانوادگی
    if (!firstName.trim() || !lastName.trim()) {
      setError('نام و نام خانوادگی الزامی است.');
      toast.error('لطفاً نام و نام خانوادگی شناگر را وارد نمایید.');
      return;
    }

    // * تاریخ تولد
    if (!dateOfBirth) {
      setError('تاریخ تولد شناگر الزامی است.');
      toast.error('لطفاً تاریخ تولد را وارد نمایید.');
      return;
    }

    // * نام پدر
    if (!fatherName.trim()) {
      setError('نام پدر الزامی است.');
      toast.error('لطفاً نام پدر شناگر را وارد نمایید.');
      return;
    }

    // * کد ملی شناگر
    const cleanNationalId = nationalId.trim();
    if (!cleanNationalId || cleanNationalId.length !== 10 || !/^\d+$/.test(cleanNationalId)) {
      setError('کد ملی شناگر باید ۱۰ رقم عددی معتبر باشد.');
      toast.error('کد ملی ۱۰ رقمی الزامی است.');
      return;
    }

    // * شماره تماس مادر یا پدر (حداقل یکیش واجبه)
    const cleanFatherPhone = fatherPhone.trim();
    const cleanMotherPhone = motherPhone.trim();
    if (!cleanFatherPhone && !cleanMotherPhone) {
      setError('ثبت حداقل یکی از شماره‌های تماس پدر یا مادر الزامی است.');
      toast.error('لطفاً شماره تماس پدر یا مادر را وارد فرمایید.');
      return;
    }

    // * جنسیت
    if (!gender) {
      setError('تعیین جنسیت شناگر الزامی است.');
      return;
    }

    // * آدرس منزل + مپ
    if (!address.trim()) {
      setError('آدرس دقیق منزل الزامی است.');
      toast.error('لطفاً آدرس منزل را وارد فرمایید.');
      return;
    }

    // * عکس صفحه اول شناسنامه
    if (!birthCertImage && !birthCertPreview) {
      setError('بارگذاری تصویر صفحه اول شناسنامه الزامی است.');
      toast.error('لطفاً تصویر صفحه اول شناسنامه را بارگذاری نمایید.');
      return;
    }

    // * کارت ملی
    if (!nationalCardImage && !nationalCardPreview) {
      setError('بارگذاری تصویر کارت ملی الزامی است.');
      toast.error('لطفاً تصویر کارت ملی را بارگذاری نمایید.');
      return;
    }

    // * عکس بیمه ورزشی
    if (!sportsInsuranceImage && !sportsInsurancePreview) {
      setError('بارگذاری تصویر کارت بیمه ورزشی الزامی است.');
      toast.error('لطفاً تصویر بیمه ورزشی را بارگذاری نمایید.');
      return;
    }

    // Prepare FormData
    const formData = new FormData();
    formData.append('first_name', firstName.trim());
    formData.append('last_name', lastName.trim());
    formData.append('national_id', cleanNationalId);
    formData.append('date_of_birth', dateOfBirth);
    formData.append('father_name', fatherName.trim());
    formData.append('father_phone', cleanFatherPhone);
    formData.append('mother_phone', cleanMotherPhone);
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-l from-sky-600 via-sky-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold mb-2.5 text-cyan-100">
            <Sparkles className="w-3.5 h-3.5" />
            {isCompletedBefore ? 'ویرایش پرونده شناگر' : 'مرحله تکمیل پرونده و مدارک شناگر'}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {isCompletedBefore ? 'ویرایش مدارک و پرونده شناگر' : 'تکمیل مشخصات و مدارک الزامی شناگر'}
          </h1>
          <p className="text-sky-100 text-xs sm:text-sm mt-1.5 max-w-2xl font-light leading-relaxed">
            جهت صدور کارت عضویت، تخصیص سانس‌های تمرینی و دریافت بیمه ورزشی، تکمیل فیلدهای ستاره‌دار (*) و آپلود مدارک الزامی است.
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

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 rounded-2xl text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Personal Info */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <User className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">۱. مشخصات هویتی و فردی شناگر</h2>
            <span className="text-[11px] text-slate-400 font-normal mr-auto">موارد دارای ستاره (*) الزامی هستند</span>
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

            <div className="sm:col-span-2 lg:col-span-3">
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
          </div>
        </div>

        {/* SECTION 2: Parents Phone, Address & Map */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Home className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">۲. اطلاعات اولیاء، نشانی منزل و تعیین موقعیت روی نقشه</h2>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <Phone className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>شماره تماس پدر یا مادر: می‌توانید هر دو را وارد نمایید، اما <strong>حداقل وارد کردن یکی از آن‌ها الزامی است</strong>.</span>
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
                آدرس دقیق منزل <span className="text-rose-500 font-bold">*</span>
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
                label="مشخص کردن موقعیت دقیق منزل روی نقشه *"
                height="340px"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Documents and Images Upload */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Upload className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">۳. تصاویر و مدارک هویتی</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* 1. عکس صفحه اول شناسنامه (*) */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-sky-600" />
                  عکس صفحه اول شناسنامه <span className="text-rose-500 font-bold">*</span>
                </span>
                {birthCertPreview && (
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    انتخاب شده
                  </span>
                )}
              </div>

              {birthCertPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group h-44 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                  <img src={birthCertPreview} alt="صفحه اول شناسنامه" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label className="p-2 bg-white text-slate-800 rounded-lg text-xs font-semibold cursor-pointer shadow hover:bg-slate-100">
                      تغییر تصویر
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
                <label className="flex flex-col items-center justify-center h-44 border-2 border-dashed border-sky-300 dark:border-sky-800 hover:border-sky-500 rounded-xl cursor-pointer bg-sky-50/40 dark:bg-sky-950/20 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors p-4 text-center">
                  <Upload className="w-7 h-7 text-sky-600 mb-2" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">کلیک جهت انتخاب عکس شناسنامه</span>
                  <span className="text-[10px] text-slate-400 mt-1">فرمت‌های مجاز JPG یا PNG (حداکثر ۵ مگابایت)</span>
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
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-sky-600" />
                  عکس کارت ملی شناگر <span className="text-rose-500 font-bold">*</span>
                </span>
                {nationalCardPreview && (
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    انتخاب شده
                  </span>
                )}
              </div>

              {nationalCardPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group h-44 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                  <img src={nationalCardPreview} alt="کارت ملی" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label className="p-2 bg-white text-slate-800 rounded-lg text-xs font-semibold cursor-pointer shadow hover:bg-slate-100">
                      تغییر تصویر
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
                <label className="flex flex-col items-center justify-center h-44 border-2 border-dashed border-sky-300 dark:border-sky-800 hover:border-sky-500 rounded-xl cursor-pointer bg-sky-50/40 dark:bg-sky-950/20 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors p-4 text-center">
                  <CreditCard className="w-7 h-7 text-sky-600 mb-2" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">کلیک جهت انتخاب عکس کارت ملی</span>
                  <span className="text-[10px] text-slate-400 mt-1">فرمت‌های مجاز JPG یا PNG (حداکثر ۵ مگابایت)</span>
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
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  عکس بیمه ورزشی معتبر <span className="text-rose-500 font-bold">*</span>
                </span>
                {sportsInsurancePreview && (
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    انتخاب شده
                  </span>
                )}
              </div>

              {sportsInsurancePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group h-44 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                  <img src={sportsInsurancePreview} alt="بیمه ورزشی" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label className="p-2 bg-white text-slate-800 rounded-lg text-xs font-semibold cursor-pointer shadow hover:bg-slate-100">
                      تغییر تصویر
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
                <label className="flex flex-col items-center justify-center h-44 border-2 border-dashed border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 rounded-xl cursor-pointer bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors p-4 text-center">
                  <ShieldCheck className="w-7 h-7 text-emerald-600 mb-2" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">کلیک جهت انتخاب تصویر بیمه ورزشی</span>
                  <span className="text-[10px] text-slate-400 mt-1">کارت عضویت خدمات درمانی فدراسیون پزشکی ورزشی</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, setSportsInsuranceImage, setSportsInsurancePreview)}
                  />
                </label>
              )}
            </div>

            {/* 4. عکس پروفایل (اختیاری) */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-sky-600" />
                  عکس پرسنلی / پروفایل (اختیاری)
                </span>
                {avatarPreview && (
                  <span className="text-[11px] font-semibold text-sky-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    انتخاب شده
                  </span>
                )}
              </div>

              {avatarPreview ? (
                <div className="flex items-center gap-4 h-44 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <img
                    src={avatarPreview}
                    alt="عکس پروفایل"
                    className="w-28 h-28 rounded-full object-cover border-2 border-sky-500 shadow-md mx-auto"
                  />
                  <div className="flex flex-col gap-2">
                    <label className="px-3 py-1.5 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 rounded-lg text-xs font-semibold cursor-pointer border border-sky-200 hover:bg-sky-100 transition-colors text-center">
                      تغییر عکس
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, setAvatar, setAvatarPreview)}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-44 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-400 rounded-xl cursor-pointer bg-white dark:bg-slate-900/60 transition-colors p-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                    <User className="w-6 h-6 text-slate-400" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">انتخاب عکس چهره شناگر</span>
                  <span className="text-[10px] text-slate-400 mt-1">جهت درج بر روی کارت عضویت استخر</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, setAvatar, setAvatarPreview)}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            با کلیک بر روی ثبت نهایی، مشخصات شما در سامانه رسمی آکادمی ذخیره خواهد شد.
          </p>

          <Button
            type="submit"
            loading={saving}
            className="w-full sm:w-auto px-8 py-3 text-sm font-bold gap-2 shadow-md cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>ثبت نهایی و تکمیل پرونده شناگر</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
