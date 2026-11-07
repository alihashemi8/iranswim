import React, { useState, useEffect } from 'react';
import {
  UserCheck, Shield, Key, Bell, CheckCircle2,
  Lock, Phone, BookOpen, AlertCircle, Save
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';
import { validatePassword, PasswordRequirementsList } from '../../utils/passwordValidator';

export const CoachProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [specialties, setSpecialties] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  const toast = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get('/coaches/dashboard-overview/');
        setProfile(res.data.coach || {});
        setSpecialties(res.data.coach?.specialties || '');
      } catch (err) {
        console.error('Error fetching coach profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      if (profile?.id) {
        await api.patch(`/coaches/${profile.id}/`, {
          specialties,
          bio,
        });
        toast.success('اطلاعات حرفه‌ای با موفقیت به‌روزرسانی شد.');
      }
    } catch (err) {
      console.error(err);
      toast.error('خطا در به‌روزرسانی اطلاعات مربی');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      toast.error(validation.firstError || 'رمز عبور با معیارهای امنیتی مطابقت ندارد.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('تکرار کلمه عبور جدید مطابقت ندارد.');
      return;
    }

    try {
      setChangingPass(true);
      await api.post('/auth/change-password/', {
        old_password: currentPassword,
        new_password: newPassword,
      });
      toast.success('کلمه عبور با موفقیت تغییر یافت.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در تغییر کلمه عبور');
    } finally {
      setChangingPass(false);
    }
  };

  if (loading) {
    return <LoadingState type="dashboard" message="در حال دریافت اطلاعات حساب کاربری مربی..." />;
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <UserCheck className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
          پروفایل و تنظیمات فردی مربی
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
          مشاهده مشخصات حرفه‌ای، تخصص‌ها، رزومه و امنیت حساب کاربری
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-3xl shadow-md shrink-0">
          {user?.first_name?.charAt(0) || 'م'}
        </div>
        <div className="space-y-1.5 text-center sm:text-right">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2.5">
            {profile?.full_name || user?.phone}
            <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              مربی رسمی آکادمی
            </span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 font-mono">
            <Phone className="w-4 h-4 text-slate-400" />
            {user?.phone}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Professional Details Form */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            مشخصات فنی و تخصص‌ها
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-sm">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                تخصص‌های ورزشی (شناها و مهارت‌ها):
              </label>
              <input
                type="text"
                placeholder="مثال: کرال سینه، شنای پروانه، نجات‌غریق درجه ۲"
                value={specialties}
                onChange={(e) => setSpecialties(e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                رزومه و سوابق مربیگری:
              </label>
              <textarea
                rows="4"
                placeholder="شرح تجارب مربیگری، مدارک و افتخارات ورزشی..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white leading-relaxed text-sm"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={savingProfile}
              className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base py-2.5 gap-2"
            >
              <Save className="w-4 h-4" />
              ذخیره تغییرات مشخصات
            </Button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Lock className="w-5 h-5 text-slate-600" />
            تغییر کلمه عبور
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-4 text-sm">
            {/* توضیحات و شرایط الزامی کلمه عبور در بالا */}
            <PasswordRequirementsList password={newPassword} showAlways={true} />

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                کلمه عبور فعلی:
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white font-mono text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                کلمه عبور جدید (انگلیسی، حداقل ۸ نویسه):
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="مانند: Coach@Secure2026"
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white font-mono text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                تکرار کلمه عبور جدید:
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white font-mono text-sm"
                required
              />
            </div>

            <Button
              type="submit"
              variant="outline"
              size="sm"
              loading={changingPass}
              className="w-full justify-center font-bold text-sm sm:text-base py-2.5"
            >
              به‌روزرسانی کلمه عبور
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
