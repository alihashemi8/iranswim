import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck, ArrowRight, Save, User, Phone, Hash, Calendar,
  Briefcase, MapPin, ShieldAlert, Award, CreditCard, Clock, Lock,
  Eye, EyeOff, AlertCircle, CheckCircle2, Sparkles, KeyRound
} from 'lucide-react';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { CustomSelect } from '../../components/common/CustomSelect';
import { useToast } from '../../context/ToastContext';
import { validatePassword, PasswordRequirementsList } from '../../utils/passwordValidator';

export const AdminCreateCoachPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    national_id: '',
    gender: 'MALE',
    date_of_birth: '',
    password: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    address: '',
    specialties: 'کرال سینه، شنای پروانه، نجات غریق',
    years_of_experience: 1,
    lifeguard_certificate: '',
    lifeguard_expiration: '',
    previous_experience: '',
    additional_skills: '',
    bio: '',
    employment_status: 'ACTIVE',
    employment_type: 'HOURLY',
    hourly_rate: '250000',
    fixed_monthly_salary: '0',
    revenue_percentage: '0',
    percentage_revenue_basis: 'COURSE_GROSS',
    contractual_weekly_hours: 20,
    internal_notes: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Generate suggested random password
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error('نام و نام خانوادگی مربی الزامی است.');
      return;
    }

    if (!form.phone.trim()) {
      toast.error('شماره تلفن همراه الزامی است.');
      return;
    }

    if (form.password) {
      const passValidation = validatePassword(form.password);
      if (!passValidation.isValid) {
        toast.error('رمز عبور تعیین‌شده، الزامات امنیتی را برآورده نمی‌کند.');
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        national_id: form.national_id.trim(),
        gender: form.gender,
        date_of_birth: form.date_of_birth || null,
        password: form.password || undefined,
        emergency_contact_name: form.emergency_contact_name.trim(),
        emergency_contact_phone: form.emergency_contact_phone.trim(),
        address: form.address.trim(),
        specialties: form.specialties.trim(),
        years_of_experience: Number(form.years_of_experience || 0),
        lifeguard_certificate: form.lifeguard_certificate.trim(),
        lifeguard_expiration: form.lifeguard_expiration || null,
        previous_experience: form.previous_experience.trim(),
        additional_skills: form.additional_skills.trim(),
        bio: form.bio.trim(),
        employment_status: form.employment_status,
        employment_type: form.employment_type,
        hourly_rate: form.employment_type === 'HOURLY' ? form.hourly_rate : '0',
        fixed_monthly_salary: form.employment_type === 'FIXED' ? form.fixed_monthly_salary : '0',
        revenue_percentage: form.employment_type === 'PERCENTAGE' ? form.revenue_percentage : '0',
        percentage_revenue_basis: form.percentage_revenue_basis,
        contractual_weekly_hours: Number(form.contractual_weekly_hours || 0),
        internal_notes: form.internal_notes.trim(),
      };

      const res = await api.post('/coaches/', payload);
      toast.success(`پرونده پرسنلی مربی ${form.first_name} ${form.last_name} با موفقیت تشکیل شد.`);
      const newId = res.data.id;
      navigate(`/admin/coaches/${newId}`);
    } catch (err) {
      console.error(err);
      const errorData = err.response?.data;
      if (typeof errorData === 'object' && errorData !== null) {
        const firstKey = Object.keys(errorData)[0];
        const firstVal = errorData[firstKey];
        toast.error(`${firstKey}: ${Array.isArray(firstVal) ? firstVal[0] : firstVal}`);
      } else {
        toast.error('خطا در ثبت و تشکیل پرونده مربی جدید');
      }
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="space-y-6 pb-16">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/coaches')}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer shadow-xs"
            title="بازگشت به فهرست مربیان"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">مدیریت مربیان و منابع انسانی</span>
              <span className="text-xs text-slate-300 dark:text-slate-700">/</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">کادر مربیان</span>
              <span className="text-xs text-slate-300 dark:text-slate-700">/</span>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400">افزودن مربی جدید</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-sky-600" />
              تشکیل پرونده و استخدام مربی جدید
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/coaches')}
            className="text-xs"
          >
            انصراف
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="gap-2 text-xs bg-sky-600 hover:bg-sky-500 text-white shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'در حال ثبت پرونده...' : 'ثبت و تشکیل پرونده مربی'}</span>
          </Button>
        </div>
      </div>

      {/* Main Form Formats */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Personal & Identity Info */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600" />
              ۱. مشخصات هویتی و اطلاعات تماس مربی
            </h3>
            <Badge variant="info">مرحله اول: هویت فردی</Badge>
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
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-colors"
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
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-colors"
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
                  className="w-full text-xs sm:text-sm pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                کد ملی ده رقمی
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  dir="ltr"
                  maxLength={10}
                  value={form.national_id}
                  onChange={(e) => handleChange('national_id', e.target.value)}
                  placeholder="0012345678"
                  className="w-full text-xs sm:text-sm pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono"
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                تاریخ تولد (میلادی/شمسی)
              </label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => handleChange('date_of_birth', e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          {/* User Account Password Setup */}
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
                  placeholder="رمز عبور اولیه (حداقل ۸ کاراکتر)..."
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

        {/* Section 2: Contact & Emergency Info */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            ۲. اطلاعات سکونت و مخاطب اضطراری
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                نام فرد رابط اضطراری
              </label>
              <input
                type="text"
                value={form.emergency_contact_name}
                onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                placeholder="مثال: پدر / همسر / برادر"
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                تلفن تماس اضطراری
              </label>
              <input
                type="text"
                dir="ltr"
                value={form.emergency_contact_phone}
                onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                placeholder="09..."
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                آدرس کامل محل سکونت
              </label>
              <textarea
                rows={2}
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="استان، شهر، خیابان..."
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Coaching Credentials & Qualifications */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
            ۳. شایستگی‌های حرفه‌ای، مدارک و سوابق مربیگری
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                تخصص‌های آموزشی شنا (با ویرگول جدا کنید)
              </label>
              <input
                type="text"
                value={form.specialties}
                onChange={(e) => handleChange('specialties', e.target.value)}
                placeholder="مثال: کرال سینه، شنای پروانه، نجات غریق درجه ۱، اصلاح تکنیک"
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                سابقه تدریس و مربیگری (سال)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={form.years_of_experience}
                onChange={(e) => handleChange('years_of_experience', e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono"
              />
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
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                تاریخ انقضای کارت نجات‌غریق
              </label>
              <input
                type="date"
                value={form.lifeguard_expiration}
                onChange={(e) => handleChange('lifeguard_expiration', e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                سایر مهارت‌ها و دوره‌ها
              </label>
              <input
                type="text"
                value={form.additional_skills}
                onChange={(e) => handleChange('additional_skills', e.target.value)}
                placeholder="مثال: آب‌درمانی، کمک‌های اولیه، آمادگی جسمانی"
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
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
                placeholder="مربیگری در باشگاه‌های قبلی، مدارک و افتخارات..."
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                بیوگرافی رسمی و معرفی جهت نمایش در وب‌سایت آموزشگاه
              </label>
              <textarea
                rows={3}
                value={form.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                placeholder="متن بیوگرافی که اولیا و شناگران در صفحه مربیان مشاهده خواهند کرد..."
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Employment & Financial Model */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
            ۴. شرایط احکام استخدامی، مدل حقوق و تعهد کاری
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm">
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
                  className="w-full text-xs sm:text-sm pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            {/* Compensation Conditional Rate Inputs */}
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
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono font-bold"
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
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono font-bold"
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
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono font-bold"
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
                <span>یادداشت‌های محرمانه داخلی مدیریت (غیرقابل رویت برای مربی و ناظر فنی)</span>
              </label>
              <textarea
                rows={2}
                value={form.internal_notes}
                onChange={(e) => handleChange('internal_notes', e.target.value)}
                placeholder="توضیحات و توافقات پشت پرده، مصاحبه اولیه، ارزیابی گزینش..."
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Action Bottom Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/coaches')}
          >
            انصراف و بازگشت
          </Button>

          <Button
            type="submit"
            disabled={submitting}
            className="gap-2 bg-sky-600 hover:bg-sky-500 text-white shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'در حال ثبت پرونده...' : 'ثبت و تشکیل پرونده مربی'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
