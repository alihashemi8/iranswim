import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  UserCheck, ArrowRight, Save, User, Phone, Hash, Calendar,
  Briefcase, MapPin, ShieldAlert, Award, CreditCard, Clock, Lock,
  Eye, EyeOff, AlertCircle, CheckCircle2, Sparkles, KeyRound,
  FileText, Upload, X, Shield, RefreshCw
} from 'lucide-react';
import api from '../../../api/client';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { CustomSelect } from '../../../components/common/CustomSelect';
import { LoadingState } from '../../../components/common/LoadingState';
import { useToast } from '../../../context/ToastContext';
import { validatePassword, PasswordRequirementsList } from '../../../utils/passwordValidator';

export const AdminCoachEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [coach, setCoach] = useState(null);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    national_id: '',
    personnel_id: '',
    gender: 'MALE',
    date_of_birth: '',
    password: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    address: '',
    specialties: '',
    years_of_experience: 0,
    lifeguard_certificate: '',
    lifeguard_expiration: '',
    previous_experience: '',
    additional_skills: '',
    bio: '',
    employment_status: 'ACTIVE',
    employment_type: 'HOURLY',
    hourly_rate: '0',
    fixed_monthly_salary: '0',
    revenue_percentage: '0',
    percentage_revenue_basis: 'COURSE_GROSS',
    contractual_weekly_hours: 20,
    internal_notes: '',
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

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
          specialties: data.specialties || '',
          years_of_experience: data.years_of_experience || 0,
          lifeguard_certificate: data.lifeguard_certificate || '',
          lifeguard_expiration: data.lifeguard_expiration || '',
          previous_experience: data.previous_experience || '',
          additional_skills: data.additional_skills || '',
          bio: data.bio || '',
          employment_status: data.employment_status || 'ACTIVE',
          employment_type: data.employment_type || 'HOURLY',
          hourly_rate: String(parseInt(data.hourly_rate || '0', 10)),
          fixed_monthly_salary: String(parseInt(data.fixed_monthly_salary || '0', 10)),
          revenue_percentage: String(parseFloat(data.revenue_percentage || '0')),
          percentage_revenue_basis: data.percentage_revenue_basis || 'COURSE_GROSS',
          contractual_weekly_hours: data.contractual_weekly_hours || 20,
          internal_notes: data.internal_notes || '',
        });

        if (data.avatar) {
          setAvatarPreview(data.avatar);
        }
      } catch (err) {
        console.error('Error fetching coach details:', err);
        toast.error('خطا در دریافت اطلاعات مربی');
        navigate(`/admin/coaches/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCoach();
  }, [id]);

  const handleChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم تصویر نباید بیشتر از ۵ مگابایت باشد.');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(coach?.avatar || null);
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

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error('نام و نام خانوادگی مربی الزامی است.');
      return;
    }

    if (!form.phone.trim()) {
      toast.error('شماره همراه مربی الزامی است.');
      return;
    }

    if (form.password) {
      const passValidation = validatePassword(form.password);
      if (!passValidation.isValid) {
        toast.error('رمز عبور جدید الزامات امنیتی را برآورده نمی‌کند.');
        return;
      }
    }

    try {
      setSubmitting(true);

      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        national_id: form.national_id.trim() || null,
        personnel_id: form.personnel_id.trim() || null,
        gender: form.gender,
        date_of_birth: form.date_of_birth ? form.date_of_birth : null,
        emergency_contact_name: form.emergency_contact_name.trim(),
        emergency_contact_phone: form.emergency_contact_phone.trim(),
        address: form.address.trim(),
        specialties: form.specialties.trim(),
        years_of_experience: Number(form.years_of_experience || 0),
        lifeguard_certificate: form.lifeguard_certificate.trim(),
        lifeguard_expiration: form.lifeguard_expiration ? form.lifeguard_expiration : null,
        previous_experience: form.previous_experience.trim(),
        additional_skills: form.additional_skills.trim(),
        bio: form.bio.trim(),
        employment_status: form.employment_status,
        employment_type: form.employment_type,
        hourly_rate: form.employment_type === 'HOURLY' ? String(form.hourly_rate || 0) : '0',
        fixed_monthly_salary: form.employment_type === 'FIXED' ? String(form.fixed_monthly_salary || 0) : '0',
        revenue_percentage: form.employment_type === 'PERCENTAGE' ? String(form.revenue_percentage || 0) : '0',
        percentage_revenue_basis: form.percentage_revenue_basis,
        contractual_weekly_hours: Number(form.contractual_weekly_hours || 0),
        internal_notes: form.internal_notes.trim(),
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (avatarFile) {
        const formData = new FormData();
        Object.keys(payload).forEach((key) => {
          if (payload[key] !== null && payload[key] !== undefined) {
            formData.append(key, payload[key]);
          }
        });
        formData.append('avatar', avatarFile);

        await api.patch(`/coaches/${id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.patch(`/coaches/${id}/`, payload);
      }

      toast.success('مشخصات پرونده مربی با موفقیت به‌روزرسانی شد.');
      navigate(`/admin/coaches/${id}?tab=INFO`);
    } catch (err) {
      console.error('Error updating coach:', err);
      const data = err.response?.data;
      if (typeof data === 'object' && data !== null) {
        const errors = [];
        for (const [key, value] of Object.entries(data)) {
          const valMsg = Array.isArray(value) ? value.join(' ') : String(value);
          errors.push(`${key}: ${valMsg}`);
        }
        toast.error(errors.length > 0 ? errors.join(' | ') : 'خطا در به‌روزرسانی مشخصات مربی');
      } else {
        toast.error(err.response?.data?.detail || 'خطا در به‌روزرسانی مشخصات مربی');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const genderOptions = [
    { value: 'MALE', label: 'آقا / مرد (Male)', badge: 'آقا' },
    { value: 'FEMALE', label: 'خانم / زن (Female)', badge: 'خانم' },
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: 'فعال و مجاز (Active)', description: 'مربی مجاز به فعالیت، ثبت کلاس و کارکرد است', badge: 'مجاز' },
    { value: 'SUSPENDED', label: 'معلق موقت (Suspended)', description: 'دسترسی‌های مربی موقتاً مسدود می‌شود', badge: 'معلق' },
    { value: 'INACTIVE', label: 'پایان همکاری / غیرفعال (Inactive)', description: 'همکاری مربی خاتمه یافته است', badge: 'غیرفعال' },
    { value: 'ARCHIVED', label: 'بایگانی پرونده (Archived)', description: 'پرونده بایگانی و از لیست‌های فعال حذف می‌شود', badge: 'بایگانی' },
  ];

  const employmentTypeOptions = [
    { value: 'HOURLY', label: 'ساعتی (حق‌التدریس بر اساس ساعات کلاس)', description: 'محاسبه کارکرد بر اساس ساعات واقعی تدریس استخر' },
    { value: 'FIXED', label: 'حقوق ثابت ماهانه', description: 'پرداخت مبلغ معین ماهیانه بدون وابستگی به ساعات کلاس' },
    { value: 'PERCENTAGE', label: 'درصدی (سهم از شهریه دوره‌ها)', description: 'محاسبه سهم مربی بر مبنای درصدی از شهریه ثبت‌نام‌ها' },
  ];

  const revenueBasisOptions = [
    { value: 'COURSE_GROSS', label: 'درآمد ناخالص دوره‌های مربی', description: 'کل مبالغ قراردادهای دوره‌های فعال مربی' },
    { value: 'COURSE_COLLECTED', label: 'درآمد وصول‌شده دوره‌ها', description: 'فقط مبالغ نقدی و تسویه‌شده دوره‌ها' },
    { value: 'CUSTOM', label: 'مبلغ سفارشی توافق‌شده', description: 'محاسبه بر اساس توافقات خاص اداری' },
  ];

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <LoadingState message="در حال بارگذاری پرونده مربی جهت ویرایش..." />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6" dir="rtl">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Link to="/admin/coaches" className="hover:text-sky-600 transition-colors">
              مدیریت مربیان و منابع انسانی
            </Link>
            <span>/</span>
            <Link to={`/admin/coaches/${id}?tab=INFO`} className="hover:text-sky-600 transition-colors">
              پرونده {coach?.full_name}
            </Link>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-200 font-semibold">ویرایش مشخصات پرونده</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-sky-600" />
            <span>ویرایش مشخصات پرونده مربی</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/coaches/${id}?tab=INFO`)}
            className="gap-2 text-xs sm:text-sm bg-white dark:bg-slate-900 shadow-xs"
          >
            <ArrowRight className="w-4 h-4" />
            <span>انصراف و بازگشت</span>
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="gap-2 text-xs sm:text-sm bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>در حال ذخیره...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>ذخیره تغییرات پرونده</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Coach Info Summary Banner */}
      <div className="bg-gradient-to-r from-sky-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/40 border border-sky-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-sky-600/20 shrink-0 overflow-hidden ring-2 ring-sky-200 dark:ring-sky-900">
            {avatarPreview ? (
              <img src={avatarPreview} alt={coach?.full_name} className="w-full h-full object-cover" />
            ) : (
              coach?.full_name ? coach.full_name[0] : 'م'
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {coach?.full_name}
              </h2>
              <span className="font-mono text-xs font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-800">
                {form.personnel_id || 'فاقد کد پرسنلی'}
              </span>
              <Badge
                variant={
                  form.employment_status === 'ACTIVE'
                    ? 'success'
                    : form.employment_status === 'SUSPENDED'
                    ? 'warning'
                    : 'neutral'
                }
              >
                {statusOptions.find((s) => s.value === form.employment_status)?.label || form.employment_status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
              شماره همراه ورود: {form.phone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-2xs transition-colors">
            <Upload className="w-3.5 h-3.5 text-sky-600" />
            <span>تغییر تصویر پرسنلی</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </label>
          {avatarFile && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="انصراف از تصویر انتخابی"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Personal and Identity */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-sky-600" />
              ۱. مشخصات شناسنامه‌ای و هویتی
            </h3>
            <Badge variant="info">هویت فردی</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                نام <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                placeholder="مثال: سارا"
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                نام خانوادگی <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                placeholder="مثال: کاظمی"
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                شماره همراه (نام کاربری سامانه) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  dir="ltr"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="09222222223"
                  className="w-full text-xs sm:text-sm pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
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
                  className="w-full text-xs sm:text-sm pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                کد پرسنلی (EMP)
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  dir="ltr"
                  value={form.personnel_id}
                  onChange={(e) => handleChange('personnel_id', e.target.value)}
                  placeholder="EMP-1001"
                  className="w-full text-xs sm:text-sm pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                جنسیت مربی <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={form.gender}
                onChange={(val) => handleChange('gender', val)}
                options={genderOptions}
                size="md"
                color="sky"
                menuClassName="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                تاریخ تولد مربی
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => handleChange('date_of_birth', e.target.value)}
                  className="w-full text-xs sm:text-sm pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Professional and Qualifications */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              ۲. مهارت‌های تخصصی، سوابق و بیوگرافی
            </h3>
            <Badge variant="neutral">صلاحیت مربیگری</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                تخصص‌های آموزشی شنا (با کاما یا گیومه جدا کنید)
              </label>
              <input
                type="text"
                value={form.specialties}
                onChange={(e) => handleChange('specialties', e.target.value)}
                placeholder="کرال سینه، شنای قورباغه، نجات غریق، آب‌درمانی"
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                سابقه مربیگری رسمی (سال)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={form.years_of_experience}
                onChange={(e) => handleChange('years_of_experience', e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                مدرک یا وضعیت نجات‌غریق
              </label>
              <input
                type="text"
                value={form.lifeguard_certificate}
                onChange={(e) => handleChange('lifeguard_certificate', e.target.value)}
                placeholder="درجه ۲ فدراسیون نجات‌غریق"
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                تاریخ انقضای کارت نجات‌غریق
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={form.lifeguard_expiration}
                  onChange={(e) => handleChange('lifeguard_expiration', e.target.value)}
                  className="w-full text-xs sm:text-sm pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                سایر مهارت‌ها و دوره‌ها
              </label>
              <input
                type="text"
                value={form.additional_skills}
                onChange={(e) => handleChange('additional_skills', e.target.value)}
                placeholder="دوره CPR، مربیگری آمادگی جسمانی"
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                سوابق کاری و باشگاه‌های قبلی
              </label>
              <textarea
                rows={2}
                value={form.previous_experience}
                onChange={(e) => handleChange('previous_experience', e.target.value)}
                placeholder="نام مجموعه‌های ورزشی و سال‌های فعالیت..."
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                رزومه و بیوگرافی رسمی مربی (جهت درج در پرونده و معرفی)
              </label>
              <textarea
                rows={3}
                value={form.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                placeholder="خلاصه افتخارات و دستاوردهای ورزشی و تحصیلی..."
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Emergency Contact & Address */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              ۳. تماس اضطراری و نشانی محل سکونت
            </h3>
            <Badge variant="success">اطلاعات تماس</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                نام مخاطب اضطراری
              </label>
              <input
                type="text"
                value={form.emergency_contact_name}
                onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                placeholder="مثال: پدر / همسر"
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                شماره تماس اضطراری
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  dir="ltr"
                  value={form.emergency_contact_phone}
                  onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                  placeholder="09120000000"
                  className="w-full text-xs sm:text-sm pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                آدرس کامل محل سکونت
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="استان، شهر، خیابان..."
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Employment & Compensation */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              ۴. احکام همکاری، مدل مالی و یادداشت اداری
            </h3>
            <Badge variant="warning">منابع انسانی و مالی</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                وضعیت همکاری <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={form.employment_status}
                onChange={(val) => handleChange('employment_status', val)}
                options={statusOptions}
                size="md"
                color="sky"
                menuClassName="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                مدل محاسبه جبران خدمات <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={form.employment_type}
                onChange={(val) => handleChange('employment_type', val)}
                options={employmentTypeOptions}
                size="md"
                color="sky"
                menuClassName="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
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
                  className="w-full text-xs sm:text-sm pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Dynamic Compensation Inputs */}
            {form.employment_type === 'HOURLY' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  نرخ ساعتی تدریس (تومان)
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={form.hourly_rate}
                    onChange={(e) => handleChange('hourly_rate', e.target.value)}
                    className="w-full text-xs sm:text-sm pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                {Number(form.hourly_rate) > 0 && (
                  <p className="text-[11px] text-sky-600 dark:text-sky-400 mt-1 font-semibold">
                    معادل: {Number(form.hourly_rate).toLocaleString('fa-IR')} تومان در ساعت
                  </p>
                )}
              </div>
            )}

            {form.employment_type === 'FIXED' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  حقوق ثابت ماهیانه (تومان)
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={form.fixed_monthly_salary}
                    onChange={(e) => handleChange('fixed_monthly_salary', e.target.value)}
                    className="w-full text-xs sm:text-sm pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                {Number(form.fixed_monthly_salary) > 0 && (
                  <p className="text-[11px] text-sky-600 dark:text-sky-400 mt-1 font-semibold">
                    معادل: {Number(form.fixed_monthly_salary).toLocaleString('fa-IR')} تومان ماهانه
                  </p>
                )}
              </div>
            )}

            {form.employment_type === 'PERCENTAGE' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    درصد سهم مربی از درآمد (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={form.revenue_percentage}
                    onChange={(e) => handleChange('revenue_percentage', e.target.value)}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    مبنای محاسبه درصد سهم
                  </label>
                  <CustomSelect
                    value={form.percentage_revenue_basis}
                    onChange={(val) => handleChange('percentage_revenue_basis', val)}
                    options={revenueBasisOptions}
                    size="md"
                    color="sky"
                    menuClassName="w-full"
                  />
                </div>
              </>
            )}

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold text-amber-700 dark:text-amber-400 mb-1.5 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                یادداشت محرمانه اداری (غیرقابل رویت برای مربی)
              </label>
              <textarea
                rows={3}
                value={form.internal_notes}
                onChange={(e) => handleChange('internal_notes', e.target.value)}
                placeholder="توضیحات و نکات اداری، عملکردی یا انضباطی فقط قابل رویت برای کادر مدیریت..."
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-amber-300 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Security & Password Reset (Optional) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-sky-600" />
              ۵. بازنشانی یا تعیین رمز عبور جدید (اختیاری)
            </h3>
            <span className="text-xs text-slate-400">در صورت عدم تغییر، خالی بگذارید</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                کلمه عبور جدید (ورود به پورتال)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="در صورت خالی بودن، رمز فعلی تغییر نمی‌کند"
                  className="w-full text-xs sm:text-sm pr-9 pl-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>تولید خودکار کلمه عبور ایمن</span>
                </button>
              </div>
            </div>

            {form.password && (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs">
                <p className="font-bold text-slate-700 dark:text-slate-300 mb-2">بررسی الزامات امنیتی رمز عبور:</p>
                <PasswordRequirementsList password={form.password} />
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            type="button"
            onClick={() => navigate(`/admin/coaches/${id}?tab=INFO`)}
            className="gap-2 text-xs sm:text-sm"
          >
            <ArrowRight className="w-4 h-4" />
            <span>انصراف و بازگشت</span>
          </Button>

          <Button
            type="submit"
            disabled={submitting}
            className="gap-2 text-xs sm:text-sm bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 px-6 py-2.5"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>در حال ذخیره اطلاعات...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>ذخیره تغییرات پرونده</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
