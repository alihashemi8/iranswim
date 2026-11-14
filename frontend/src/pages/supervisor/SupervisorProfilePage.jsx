import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, UserCheck, KeyRound, Phone, Save,
  CheckCircle2, Lock, Eye, EyeOff, AlertTriangle, Shield,
  Server, Cpu, Activity
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AvatarUpload } from '../../components/common/AvatarUpload';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { validatePassword, PasswordRequirementsList } from '../../utils/passwordValidator';

export const SupervisorProfilePage = () => {
  const { user, updateUserData } = useAuth();
  const toast = useToast();

  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    national_id: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        national_id: user.national_id || '',
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.patch('/auth/me/', {
        first_name: profileForm.first_name.trim(),
        last_name: profileForm.last_name.trim(),
        national_id: profileForm.national_id.trim(),
      });
      if (updateUserData) {
        updateUserData(res.data);
      }
      toast.success('مشخصات فردی ناظر فنی با موفقیت ذخیره گردید.');
    } catch (err) {
      console.error(err);
      toast.error('خطا در به‌روزرسانی مشخصات فردی ناظر');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const validation = validatePassword(passwordForm.newPassword);
    if (!validation.isValid) {
      toast.error(validation.firstError || 'رمز عبور با معیارهای امنیتی مطابقت ندارد.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('رمز عبور جدید و تکرار آن یکسان نیستند.');
      return;
    }

    setSavingPassword(true);
    try {
      await api.post('/auth/change-password/', {
        old_password: passwordForm.oldPassword,
        new_password: passwordForm.newPassword,
        confirm_password: passwordForm.confirmPassword,
      });
      toast.success('رمز عبور ناظر فنی با موفقیت تغییر یافت.');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || 'خطا در تغییر کلمه عبور';
      toast.error(typeof detail === 'string' ? detail : 'خطا در تغییر رمز عبور');
    } finally {
      setSavingPassword(false);
    }
  };

  const displayName = user?.full_name || 'ناظر فنی سامانه';

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto animate-fade-in">
      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500 shrink-0" />
          <span>پروفایل و تنظیمات امنیتی ناظر فنی</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          مدیریت هویت، عکس پروفایل، اطلاعات فردی و کلیدهای امنیتی ناظر ارشد سامانه
        </p>
      </div>

      {/* Identity Card with AvatarUpload */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center gap-6">
        <AvatarUpload
          currentAvatar={user?.avatar}
          displayName={displayName}
          role="SUPERVISOR"
          size="lg"
          label="تصویر پروفایل ناظر فنی"
          subtitle="انتخاب یا تغییر عکس پرسنلی (فقط یک تصویر)"
          className="shrink-0"
        />
        <div className="space-y-2 text-center sm:text-right flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
              {displayName}
            </h2>
            <Badge variant="warning" className="text-xs px-3 py-1 font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              ناظر فنی ارشد (Supervisor)
            </Badge>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-mono flex items-center justify-center sm:justify-start gap-1.5">
            <Phone className="w-4 h-4 text-amber-500" />
            {user?.phone}
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-slate-500" />
              دسترسی نظارت فنی کامل
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              نشست امن و فعال
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Personal Info & Password Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form 1: Edit Personal Details */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                مشخصات هویتی و فردی
              </h3>
              <span className="text-xs text-slate-400">
                ویرایش نام، نام خانوادگی و اطلاعات شناسنامه‌ای
              </span>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  نام:
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.first_name}
                  onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                  placeholder="مثال: محمد"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  نام خانوادگی:
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.last_name}
                  onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                  placeholder="مثال: رضوانی"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  شماره موبایل (ورود):
                </label>
                <input
                  type="text"
                  disabled
                  value={profileForm.phone}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-xl font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  کد ملی:
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={profileForm.national_id}
                  onChange={(e) => setProfileForm({ ...profileForm, national_id: e.target.value })}
                  placeholder="۱۰ رقم کد ملی"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={savingProfile}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 gap-2 cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{savingProfile ? 'در حال ذخیره‌سازی...' : 'ذخیره تغییرات مشخصات'}</span>
              </Button>
            </div>
          </form>
        </div>

        {/* Form 2: Change Password */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                تغییر رمز عبور حساب ناظر
              </h3>
              <span className="text-xs text-slate-400">
                ارتقای امنیت حساب کاربری با تعیین رمز استاندارد
              </span>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                رمز عبور فعلی:
              </label>
              <div className="relative">
                <input
                  type={showOldPass ? 'text' : 'password'}
                  required
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                  placeholder="رمز عبور فعلی خود را وارد کنید"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                رمز عبور جدید:
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="حداقل ۸ کاراکتر ترکیبی انگلیسی"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                تکرار رمز عبور جدید:
              </label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="تکرار رمز عبور جدید"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Policy Guidelines */}
            <PasswordRequirementsList password={passwordForm.newPassword} />

            <div className="pt-2">
              <Button
                type="submit"
                disabled={savingPassword}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 gap-2 cursor-pointer shadow-sm"
              >
                <Lock className="w-4 h-4" />
                <span>{savingPassword ? 'در حال ثبت...' : 'به‌روزرسانی رمز عبور'}</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
