import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings, KeyRound, ShieldCheck, Smartphone, Bell,
  LogOut, AlertTriangle, CheckCircle2, Lock, Eye, EyeOff
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { LogoutModal } from '../../components/common/LogoutModal';

export const SwimmerSettingsPage = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Notification preferences state
  const [smsNotif, setSmsNotif] = useState(true);
  const [appNotif, setAppNotif] = useState(true);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordForm.new_password || passwordForm.new_password.length < 6) {
      toast.error('کلمه عبور جدید باید حداقل ۶ کاراکتر باشد.');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400">
              <Settings className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              تنظیمات حساب کاربری و امنیت
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            تغییر رمز عبور، مدیریت روش‌های ورود و بازیابی با پیامک (OTP)، و حریم خصوصی
          </p>
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

      {/* Warning for Initial Password (if National ID is still password) */}
      {user && !user.is_password_changed && (
        <div className="p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3.5">
          <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h4 className="text-sm sm:text-base font-bold text-rose-900 dark:text-rose-100">
              توجه امنیتی بسیار مهم: شما در حال حاضر از رمز اولیه (کد ملی) استفاده می‌کنید!
            </h4>
            <p className="text-xs sm:text-sm text-rose-800 dark:text-rose-200/90 leading-relaxed font-medium">
              کد ملی اطلاعاتی قابل حدس و عمومی است. لطفاً فوراً از فرم زیر یک کلمه عبور اختصاصی و قوی برای حساب خود تعیین فرمایید.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Password Change Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <KeyRound className="w-4.5 h-4.5 text-sky-600" />
            تعیین یا تغییر کلمه عبور اختصاصی
          </h3>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                رمز عبور فعلی (یا کد ملی)
              </label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  value={passwordForm.old_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                  placeholder="رمز عبور فعلی"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                کلمه عبور جدید (حداقل ۶ کاراکتر)
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  placeholder="رمز عبور جدید و قوی"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                تکرار کلمه عبور جدید
              </label>
              <input
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                placeholder="تکرار رمز عبور جدید"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                required
              />
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="w-full py-3 text-sm sm:text-base font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {changingPassword ? 'در حال ذخیره...' : 'ذخیره کلمه عبور جدید'}
            </button>
          </form>
        </div>

        {/* Security & Account Information */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Smartphone className="w-4.5 h-4.5 text-emerald-600" />
              شناسه ورود و بازیابی حساب
            </h3>

            <div className="space-y-3.5 text-sm">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                <div>
                  <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 block mb-1 font-medium">شماره همراه اصلی (شناسه ورود):</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white text-base sm:text-lg">
                    {user?.phone || '—'}
                  </span>
                </div>
                <span className="text-emerald-600 font-bold flex items-center gap-1.5 text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4" /> تایید با OTP
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pr-1 font-medium">
                ورود به سامانه در هر زمان با ارسال کد یکبار مصرف پیامکی (OTP) به شماره همراه فوق امکان‌پذیر است. در صورت نیاز به تغییر شماره همراه، به دلیل ملاحظات امنیتی با دفتر آموزشگاه هماهنگ فرمایید.
              </p>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Bell className="w-4.5 h-4.5 text-sky-600" />
              ترجیحات دریافت اعلان‌ها
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                <div>
                  <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 block">
                    پیامک یادآوری جلسه و تغییرات سانس
                  </span>
                  <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                    ارسال پیامک فوری در صورت جابه‌جایی یا لغو جلسه استخر
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={smsNotif}
                  onChange={(e) => setSmsNotif(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 w-4.5 h-4.5 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                <div>
                  <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 block">
                    اعلان‌های درون‌برنامه‌ای نمرات ارزیابی مربی
                  </span>
                  <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                    نمایش نشانگر قرمز زنگوله به محض ثبت نمره جدید
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={appNotif}
                  onChange={(e) => setAppNotif(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 w-4.5 h-4.5 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        userName={user?.full_name}
        userRole="شناگر"
      />
    </div>
  );
};
