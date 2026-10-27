import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User, UserCheck, ShieldAlert, Settings, KeyRound, Phone,
  CreditCard, Building2, Clock, Globe, Save, Search, Filter,
  CheckCircle2, Lock, Unlock, RefreshCw, FileText,
  BadgeCheck, Shield
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { formatPersianDate } from '../../utils/date';

export const AdminProfilePage = ({ defaultTab = 'PROFILE' }) => {
  const { user, updateUserData } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Primary Page Tabs: PROFILE | SETTINGS | USERS
  const paramTab = searchParams.get('tab')?.toUpperCase();
  const validTabs = ['PROFILE', 'SETTINGS', 'USERS'];
  const initialTab = validTabs.includes(paramTab) ? paramTab : defaultTab;
  const [activeMainTab, setActiveMainTab] = useState(initialTab);

  // Sync tab with URL
  useEffect(() => {
    if (paramTab && validTabs.includes(paramTab) && paramTab !== activeMainTab) {
      setActiveMainTab(paramTab);
    }
  }, [paramTab]);

  const handleTabChange = (tabKey) => {
    setActiveMainTab(tabKey);
    setSearchParams({ tab: tabKey.toLowerCase() });
  };

  // ---------------------------------------------------------------------------
  // TAB 1: PROFILE STATE & HANDLERS
  // ---------------------------------------------------------------------------
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    national_id: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Change
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
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
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        national_id: profileForm.national_id,
      });
      if (updateUserData) {
        updateUserData(res.data);
      }
      toast.success('مشخصات فردی مدیر با موفقیت ذخیره و به‌روزرسانی شد.');
    } catch (err) {
      console.error(err);
      toast.error('خطا در به‌روزرسانی مشخصات فردی');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 6) {
      toast.error('رمز عبور باید حداقل ۶ نویسه (کاراکتر) باشد.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('رمز عبور جدید و تکرار آن یکسان نیستند.');
      return;
    }

    setSavingPassword(true);
    try {
      await api.patch('/auth/me/', {
        password: passwordForm.newPassword,
      });
      toast.success('رمز عبور مدیر با موفقیت تغییر یافت.');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error(err);
      toast.error('خطا در تغییر رمز عبور');
    } finally {
      setSavingPassword(false);
    }
  };

  // ---------------------------------------------------------------------------
  // TAB 2: SETTINGS STATE & HANDLERS
  // ---------------------------------------------------------------------------
  const [settingsActiveSubTab, setSettingsActiveSubTab] = useState('ACADEMY');
  const [settings, setSettings] = useState({
    academyName: 'آموزشگاه تخصصی شنای ایران (IranSwim)',
    phone: '۰۲۱-۸۸۲۲۳۳۴۴',
    supportMobile: '۰۹۰۴۵۹۱۱۱۴۴',
    address: 'تهران، خیابان آزادی، مجتمع ورزش‌های آبی ایران',
    email: 'info@iranswim.com',
    poolName: 'استخر بین‌المللی آزادی (لاین‌های ۲ تا ۵)',
    defaultSessionDurationMinutes: 75,
    defaultGroupCapacity: 15,
    cancellationNoticeHours: 12,
    allowMakeupSessions: true,
    maxMakeupPerCourse: 2,
    currency: 'تومان (TOMAN)',
    taxPercent: 0,
    installmentCountDefault: 2,
    overdueGraceDays: 3,
    allowCashPayments: true,
    timezone: 'Asia/Tehran (+03:30)',
    calendarSystem: 'گاه‌شمار هجری خورشیدی (Jalali)',
    language: 'فارسی (Persian / RTL)',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setTimeout(() => {
      setSavingSettings(false);
      toast.success('تنظیمات آموزشگاه با موفقیت ذخیره گردید.');
    }, 400);
  };

  // ---------------------------------------------------------------------------
  // TAB 3: USERS & SECURITY STATE & HANDLERS
  // ---------------------------------------------------------------------------
  const [securitySubTab, setSecuritySubTab] = useState('USERS'); // USERS, AUDIT_LOGS
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Edit Role Modal
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState('SWIMMER');
  const [updatingRole, setUpdatingRole] = useState(false);

  const fetchUsersData = async () => {
    try {
      setLoadingUsers(true);
      const [usersRes, auditRes] = await Promise.all([
        api.get('/auth/users/'),
        api.get('/supervisor/audit-logs/'),
      ]);
      setUsers(usersRes.data.results || usersRes.data || []);
      setAuditLogs(auditRes.data.results || auditRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت اطلاعات کاربران و ممیزی');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeMainTab === 'USERS') {
      fetchUsersData();
    }
  }, [activeMainTab]);

  const handleToggleUserActive = async (targetUser) => {
    try {
      await api.patch(`/auth/users/${targetUser.id}/`, {
        is_active: !targetUser.is_active,
      });
      toast.success(
        !targetUser.is_active
          ? `دسترسی کاربر ${targetUser.full_name || targetUser.phone} فعال شد.`
          : `دسترسی کاربر ${targetUser.full_name || targetUser.phone} غیرفعال شد.`
      );
      fetchUsersData();
    } catch (err) {
      console.error(err);
      toast.error('خطا در تغییر وضعیت دسترسی کاربر');
    }
  };

  const handleChangeRole = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setUpdatingRole(true);
      await api.patch(`/auth/users/${editingUser.id}/`, {
        role: newRole,
      });
      toast.success(`نقش کاربر به ${newRole} تغییر یافت.`);
      setEditingUser(null);
      fetchUsersData();
    } catch (err) {
      console.error(err);
      toast.error('خطا در تغییر نقش کاربری');
    } finally {
      setUpdatingRole(false);
    }
  };

  const roleLabels = {
    ADMIN: 'مدیر آموزشگاه',
    COACH: 'مربی آکادمی',
    SWIMMER: 'شناگر',
    SUPERVISOR: 'ناظر فنی سامانه',
  };

  const actionLabels = {
    LOGIN: 'ورود به سامانه',
    PASSWORD_CHANGE: 'تغییر رمز عبور',
    CONFIG_CHANGE: 'تغییر تنظیمات',
    ENROLLMENT_CREATE: 'ثبت‌نام دوره',
    PAYMENT_RECORD: 'ثبت پرداخت مالی',
    REFUND_ISSUE: 'استرداد شهریه',
    RECORD_VERIFY: 'تأیید رسمی رکورد شنا',
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.phone || '').includes(userSearch) ||
      (u.national_id || '').includes(userSearch);
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-500 text-white flex items-center justify-center font-extrabold text-xl shadow-md shrink-0">
            {user?.full_name ? user.full_name.charAt(0) : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                پروفایل و مدیریت سیستم
              </h1>
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800">
                مدیر آموزشگاه
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              مشخصات فردی، پیکربندی قوانین و سیاست‌های آموزشگاه، و مدیریت کاربران و دسترسی‌ها
            </p>
          </div>
        </div>

        {/* Quick User Identity Badge */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/70 text-xs">
          <div className="text-right">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              {user?.full_name}
            </span>
            <span className="font-mono text-slate-400 text-[11px]">
              {user?.phone}
            </span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950/40" title="آنلاین" />
        </div>
      </div>

      {/* Main Page Navigation Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs sm:text-sm font-bold gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => handleTabChange('PROFILE')}
          className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeMainTab === 'PROFILE'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4 shrink-0" />
          <span>مشخصات و پروفایل</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('SETTINGS')}
          className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeMainTab === 'SETTINGS'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>تنظیمات آموزشگاه</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('USERS')}
          className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeMainTab === 'USERS'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>کاربران و امنیت</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: PROFILE CONTENT */}
      {/* =================================================================== */}
      {activeMainTab === 'PROFILE' && (
        <div className="space-y-6 animate-fade-in">
          {/* Identity & Account Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200/60 dark:border-sky-800/70 shrink-0">
                <BadgeCheck className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-xs text-slate-400 block font-medium">نقش سازمانی</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">مدیریت کل آموزشگاه</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/70 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-xs text-slate-400 block font-medium">وضعیت حساب</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">فعال و تأییدشده</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200/60 dark:border-purple-800/70 shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-xs text-slate-400 block font-medium">سطح دسترسی</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">دسترسی کامل (Super Admin)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form 1: Edit Personal Details */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
              <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    مشخصات هویتی و فردی مدیر
                  </h3>
                  <span className="text-xs text-slate-400">
                    ویرایش نام، نام خانوادگی و اطلاعات شناسنامه‌ای
                  </span>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      نام:
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                      placeholder="مثال: علی"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      نام خانوادگی:
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                      placeholder="مثال: حسینی"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      شماره تلفن همراه (شناسه ورود):
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                      <input
                        type="text"
                        disabled
                        value={profileForm.phone}
                        className="w-full pr-10 pl-3 py-2.5 text-xs font-mono bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      کد ملی:
                    </label>
                    <input
                      type="text"
                      value={profileForm.national_id}
                      onChange={(e) => setProfileForm({ ...profileForm, national_id: e.target.value })}
                      placeholder="۱۰ رقم بدون خط تیره"
                      className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" loading={savingProfile} className="gap-2 text-xs font-bold px-5">
                    <Save className="w-4 h-4" />
                    <span>ذخیره تغییرات مشخصات</span>
                  </Button>
                </div>
              </form>
            </div>

            {/* Form 2: Change Password */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      تغییر رمز عبور ورود
                    </h3>
                    <span className="text-xs text-slate-400">
                      تعیین کلمه عبور جدید برای ورود ایمن به سامانه
                    </span>
                  </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      رمز عبور جدید (حداقل ۶ نویسه):
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="حداقل ۶ نویسه"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      تکرار رمز عبور جدید:
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="تکرار رمز عبور"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button type="submit" variant="secondary" loading={savingPassword} className="gap-2 text-xs font-bold px-5">
                      <KeyRound className="w-4 h-4" />
                      <span>به‌روزرسانی رمز عبور</span>
                    </Button>
                  </div>
                </form>
              </div>

              {/* Security Hint */}
              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400">
                💡 جهت حفظ امنیت، از انتخاب رمزهای ساده یا شماره موبایل پرهیز نمایید.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: SETTINGS CONTENT */}
      {/* =================================================================== */}
      {activeMainTab === 'SETTINGS' && (
        <div className="space-y-6 animate-fade-in">
          {/* Subtabs for Settings */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700 text-xs w-fit overflow-x-auto">
            {[
              { key: 'ACADEMY', label: 'اطلاعات آموزشگاه و استخر', icon: Building2 },
              { key: 'CLASS', label: 'قوانین کلاس‌ها و ظرفیت', icon: Clock },
              { key: 'FINANCE', label: 'سیاست‌های مالی و تعرفه', icon: CreditCard },
              { key: 'SYSTEM', label: 'تنظیمات زبان و تقویم', icon: Globe },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSettingsActiveSubTab(tab.key)}
                  className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                    settingsActiveSubTab === tab.key
                      ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {settingsActiveSubTab === 'ACADEMY' && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                    مشخصات عمومی و تماس آکادمی
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        نام رسمی آموزشگاه
                      </label>
                      <input
                        type="text"
                        value={settings.academyName}
                        onChange={(e) => setSettings({ ...settings, academyName: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        نام استخر و مجموعه اصلی
                      </label>
                      <input
                        type="text"
                        value={settings.poolName}
                        onChange={(e) => setSettings({ ...settings, poolName: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        شماره تماس ثابت آموزشگاه
                      </label>
                      <input
                        type="text"
                        value={settings.phone}
                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        شماره همراه پشتیبانی / ثبت‌نام
                      </label>
                      <input
                        type="text"
                        value={settings.supportMobile}
                        onChange={(e) => setSettings({ ...settings, supportMobile: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      نشانی پستی مجموعه ورزشی
                    </label>
                    <textarea
                      rows={2}
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              )}

              {settingsActiveSubTab === 'CLASS' && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                    ضوابط برگزاری و ظرفیت جلسات شنا
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        مدت زمان پیش‌فرض هر سانس (دقیقه)
                      </label>
                      <input
                        type="number"
                        value={settings.defaultSessionDurationMinutes}
                        onChange={(e) => setSettings({ ...settings, defaultSessionDurationMinutes: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        ظرفیت استاندارد کلاس‌های گروهی
                      </label>
                      <input
                        type="number"
                        value={settings.defaultGroupCapacity}
                        onChange={(e) => setSettings({ ...settings, defaultGroupCapacity: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        مهلت مجاز لغو جلسه توسط شاگرد (ساعت قبل از سانس)
                      </label>
                      <input
                        type="number"
                        value={settings.cancellationNoticeHours}
                        onChange={(e) => setSettings({ ...settings, cancellationNoticeHours: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        حداکثر سهمیه جلسات جبرانی در هر ترم
                      </label>
                      <input
                        type="number"
                        value={settings.maxMakeupPerCourse}
                        onChange={(e) => setSettings({ ...settings, maxMakeupPerCourse: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {settingsActiveSubTab === 'FINANCE' && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                    قوانین مالی و پرداخت شهریه
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        واحد پولی سیستم
                      </label>
                      <input
                        type="text"
                        disabled
                        value={settings.currency}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        تعداد پیش‌فرض اقساط شهریه
                      </label>
                      <input
                        type="number"
                        value={settings.installmentCountDefault}
                        onChange={(e) => setSettings({ ...settings, installmentCountDefault: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        مهلت ارفاق پرداخت سررسید (روز)
                      </label>
                      <input
                        type="number"
                        value={settings.overdueGraceDays}
                        onChange={(e) => setSettings({ ...settings, overdueGraceDays: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {settingsActiveSubTab === 'SYSTEM' && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                    پیکربندی زمان، زبان و تقویم
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        منطقه زمانی سامانه
                      </label>
                      <input
                        type="text"
                        disabled
                        value={settings.timezone}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        سیستم تقویم و گاه‌شمار
                      </label>
                      <input
                        type="text"
                        disabled
                        value={settings.calendarSystem}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Button type="submit" loading={savingSettings} className="gap-2 text-xs font-bold px-6">
                  <Save className="w-4 h-4" />
                  <span>ذخیره کلیه تنظیمات آموزشگاه</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: USERS & SECURITY CONTENT */}
      {/* =================================================================== */}
      {activeMainTab === 'USERS' && (
        <div className="space-y-6 animate-fade-in">
          {/* Subtabs: Users List vs Audit Logs */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700 text-xs w-fit">
            <button
              type="button"
              onClick={() => setSecuritySubTab('USERS')}
              className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 ${
                securitySubTab === 'USERS'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>فهرست کاربران و نقش‌ها</span>
            </button>

            <button
              type="button"
              onClick={() => setSecuritySubTab('AUDIT_LOGS')}
              className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 ${
                securitySubTab === 'AUDIT_LOGS'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>لاگ‌های ممیزی امنیتی (Audit)</span>
            </button>
          </div>

          {loadingUsers ? (
            <LoadingState message="در حال بارگذاری اطلاعات کاربران..." />
          ) : securitySubTab === 'USERS' ? (
            <div className="space-y-4">
              {/* Filter & Search Bar */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="جستجو با نام، موبایل یا کد ملی..."
                    className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value="">همه نقش‌ها</option>
                    <option value="ADMIN">مدیر آموزشگاه</option>
                    <option value="COACH">مربی</option>
                    <option value="SWIMMER">شناگر</option>
                    <option value="SUPERVISOR">ناظر فنی</option>
                  </select>

                  <button
                    type="button"
                    onClick={fetchUsersData}
                    className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    title="به‌روزرسانی"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
                {filteredUsers.length === 0 ? (
                  <EmptyState message="کاربری با معیارهای جستجو یافت نشد." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-100 dark:border-slate-800 font-bold">
                        <tr>
                          <th className="px-4 py-3">نام و نام خانوادگی</th>
                          <th className="px-4 py-3">شماره تماس (موبایل)</th>
                          <th className="px-4 py-3">کد ملی</th>
                          <th className="px-4 py-3">نقش کاربری</th>
                          <th className="px-4 py-3">وضعیت حساب</th>
                          <th className="px-4 py-3 text-center">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 font-bold flex items-center justify-center text-xs shrink-0">
                                {u.first_name ? u.first_name.charAt(0) : 'U'}
                              </div>
                              <span>{u.full_name || 'بدون نام'}</span>
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{u.phone}</td>
                            <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{u.national_id || '-'}</td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={
                                  u.role === 'ADMIN' ? 'primary' :
                                  u.role === 'COACH' ? 'success' :
                                  u.role === 'SUPERVISOR' ? 'warning' : 'info'
                                }
                              >
                                {roleLabels[u.role] || u.role}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  u.is_active
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                {u.is_active ? 'فعال' : 'مسدود / غیرفعال'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingUser(u);
                                    setNewRole(u.role);
                                  }}
                                  className="px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 rounded-lg transition-colors cursor-pointer"
                                >
                                  تغییر نقش
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleUserActive(u)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    u.is_active
                                      ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                      : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                  }`}
                                  title={u.is_active ? 'غیرفعال کردن کاربر' : 'فعال‌سازی کاربر'}
                                >
                                  {u.is_active ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Audit Logs Table */
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
              {auditLogs.length === 0 ? (
                <EmptyState message="هیچ لاگ ممیزی در سامانه ثبت نشده است." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-100 dark:border-slate-800 font-bold">
                      <tr>
                        <th className="px-4 py-3">زمان رخداد</th>
                        <th className="px-4 py-3">نوع عملیات</th>
                        <th className="px-4 py-3">کاربر</th>
                        <th className="px-4 py-3">آدرس IP</th>
                        <th className="px-4 py-3">جزئیات عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                            {formatPersianDate(log.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {actionLabels[log.action] || log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-mono">
                            {log.user_phone || 'سیستم'}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">{log.ip_address || '-'}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                            {typeof log.details === 'object' ? JSON.stringify(log.details) : (log.details || '-')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal: Change Role */}
      {editingUser && (
        <Modal
          isOpen={true}
          onClose={() => setEditingUser(null)}
          title={`تغییر نقش کاربری: ${editingUser.full_name || editingUser.phone}`}
        >
          <form onSubmit={handleChangeRole} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                نقش جدید را انتخاب نمایید:
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              >
                <option value="SWIMMER">شناگر (دسترسی به پرتال و سوابق)</option>
                <option value="COACH">مربی (دسترسی به میز کار مربی و حضور غیاب)</option>
                <option value="ADMIN">مدیر آموزشگاه (دسترسی کامل مدیریتی)</option>
                <option value="SUPERVISOR">ناظر فنی (دسترسی مانیتورینگ زیرساخت)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                انصراف
              </Button>
              <Button type="submit" loading={updatingRole}>
                تأیید و ذخیره نقش
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
