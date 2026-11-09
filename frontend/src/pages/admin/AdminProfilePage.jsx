import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User, UserCheck, UserPlus, ShieldAlert, Settings, KeyRound, Phone,
  CreditCard, Building2, Clock, Globe, Save, Search, Filter,
  CheckCircle2, Lock, Unlock, RefreshCw, FileText,
  BadgeCheck, Shield, Trash2, Edit3, Eye, EyeOff, AlertTriangle,
  Award, LifeBuoy, Check, Copy
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { CustomSelect } from '../../components/common/CustomSelect';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { formatPersianDate } from '../../utils/date';
import { validatePassword, generateStrongPassword, PasswordRequirementsList } from '../../utils/passwordValidator';

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
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [copiedPhone, setCopiedPhone] = useState(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Add Form
  const [addForm, setAddForm] = useState({
    phone: '',
    first_name: '',
    last_name: '',
    national_id: '',
    role: 'SWIMMER',
    password: '',
    is_active: true,
  });
  const [addingUser, setAddingUser] = useState(false);

  // Edit Form
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    national_id: '',
    role: 'SWIMMER',
    password: '',
    is_active: true,
  });
  const [updatingUser, setUpdatingUser] = useState(false);

  // Reset Password State (صدور کلمه عبور تصادفی جدید بدون نمایش)
  const [resettingUser, setResettingUser] = useState(false);
  const [generatedResetPassword, setGeneratedResetPassword] = useState(null);

  // Delete & Suspend state
  const [deletingUser, setDeletingUser] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState(null);

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

  // Accessible users: Only coaches, swimmers, and the admin themselves (excludes technical supervisors and other admins)
  const accessibleUsers = useMemo(() => {
    return users.filter((u) => {
      if (u.role === 'SUPERVISOR') return false;
      if (u.role === 'ADMIN' && u.id !== user?.id) return false;
      return true;
    });
  }, [users, user?.id]);

  // Statistics for managed users
  const userStats = useMemo(() => {
    const total = accessibleUsers.length;
    const coaches = accessibleUsers.filter((u) => u.role === 'COACH').length;
    const swimmers = accessibleUsers.filter((u) => u.role === 'SWIMMER').length;
    const active = accessibleUsers.filter((u) => u.is_active).length;
    const suspended = accessibleUsers.filter((u) => !u.is_active).length;
    return { total, coaches, swimmers, active, suspended };
  }, [accessibleUsers]);

  // Role and status options for CustomSelect filters
  const roleFilterOptions = useMemo(() => [
    {
      value: '',
      label: 'همه نقش‌ها',
      badge: accessibleUsers.length,
      icon: Filter,
    },
    {
      value: 'SWIMMER',
      label: 'شناگران و اولیا',
      badge: userStats.swimmers,
      icon: User,
    },
    {
      value: 'COACH',
      label: 'مربیان آکادمی',
      badge: userStats.coaches,
      icon: Award,
    },
  ], [accessibleUsers.length, userStats.swimmers, userStats.coaches]);

  const statusFilterOptions = useMemo(() => [
    {
      value: '',
      label: 'همه وضعیت‌ها',
      badge: accessibleUsers.length,
      icon: Shield,
    },
    {
      value: 'active',
      label: 'فقط فعال‌ها',
      badge: userStats.active,
      icon: CheckCircle2,
    },
    {
      value: 'suspended',
      label: 'فقط معلق‌ها',
      badge: userStats.suspended,
      icon: ShieldAlert,
    },
  ], [accessibleUsers.length, userStats.active, userStats.suspended]);

  // Filtered and Paginated users
  const filteredUsers = useMemo(() => {
    return accessibleUsers.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (statusFilter === 'active' && !u.is_active) return false;
      if (statusFilter === 'suspended' && u.is_active) return false;
      if (userSearch.trim()) {
        const q = userSearch.trim().toLowerCase();
        const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
        const phone = (u.phone || '').toLowerCase();
        const nationalId = (u.national_id || '').toLowerCase();
        return fullName.includes(q) || phone.includes(q) || nationalId.includes(q);
      }
      return true;
    });
  }, [accessibleUsers, roleFilter, statusFilter, userSearch]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Handle Toggle Suspend (معلق کردن / رفع تعلیق)
  const handleToggleSuspend = async (targetUser) => {
    if (targetUser.id === user?.id) {
      toast.error('امکان معلق‌سازی حساب کاربری مدیر جاری وجود ندارد.');
      return;
    }

    try {
      setTogglingUserId(targetUser.id);
      const nextActive = !targetUser.is_active;
      await api.patch(`/auth/users/${targetUser.id}/`, {
        is_active: nextActive,
      });

      if (nextActive) {
        toast.success(`تعلیق حساب کاربری ${targetUser.full_name || targetUser.phone} رفع و فعال شد.`);
      } else {
        toast.info(`حساب کاربری ${targetUser.full_name || targetUser.phone} با موفقیت معلق گردید.`);
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, is_active: nextActive } : u))
      );
    } catch (err) {
      console.error(err);
      toast.error('خطا در تغییر وضعیت تعلیق کاربر');
    } finally {
      setTogglingUserId(null);
    }
  };

  // Clipboard copy helper
  const copyToClipboard = async (text, msg = 'کلمه عبور در کلیپ‌بورد کپی شد.') => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      toast.success(msg);
      return true;
    } catch (err) {
      console.error(err);
      toast.error('خطا در کپی در کلیپ‌بورد');
      return false;
    }
  };

  // Add User (اضافه کردن کاربر جدید)
  const handleOpenAddModal = () => {
    setAddForm({
      phone: '',
      first_name: '',
      last_name: '',
      national_id: '',
      role: 'SWIMMER',
      password: '',
      is_active: true,
    });
    setIsAddModalOpen(true);
  };

  // تولید رمز تصادفی و کپی در کلیپ‌بورد برای کاربر جدید (بدون نمایش کاراکترها)
  const handleGenerateAddPassword = () => {
    const newPass = generateStrongPassword(14);
    setAddForm((prev) => ({ ...prev, password: newPass }));
    copyToClipboard(newPass, 'کلمه عبور امن تصادفی تولید شد و در کلیپ‌بورد کپی گردید.');
  };

  // تولید رمز تصادفی و کپی برای ویرایش مشخصات کاربر
  const handleGenerateEditPassword = () => {
    const newPass = generateStrongPassword(14);
    setEditForm((prev) => ({ ...prev, password: newPass }));
    copyToClipboard(newPass, 'کلمه عبور تصادفی جدید تولید شد و در کلیپ‌بورد کپی گردید.');
  };

  // ریست و صدور کلمه عبور جدید مستقیم از جدول کاربران
  const handleOpenResetPasswordModal = (targetUser) => {
    if (targetUser.id === user?.id) {
      toast.info('تغییر رمز عبور مدیر از تب مشخصات فردی و پروفایل انجام می‌شود.');
      return;
    }
    setSelectedUser(targetUser);
    setGeneratedResetPassword(null);
    setIsResetPasswordModalOpen(true);
  };

  const handleExecuteResetPassword = async () => {
    if (!selectedUser) return;
    const newPass = generateStrongPassword(14);
    setResettingUser(true);
    try {
      await api.patch(`/auth/users/${selectedUser.id}/`, {
        password: newPass,
      });
      setGeneratedResetPassword(newPass);
      await copyToClipboard(
        newPass,
        `کلمه عبور جدید برای ${selectedUser.full_name || selectedUser.phone} با موفقیت ثبت و در کلیپ‌بورد کپی شد.`
      );
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || err.response?.data?.password || 'خطا در صدور کلمه عبور جدید';
      toast.error(Array.isArray(detail) ? detail[0] : detail);
    } finally {
      setResettingUser(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!addForm.phone || !addForm.first_name || !addForm.last_name) {
      toast.error('لطفاً شماره تلفن همراه، نام و نام خانوادگی را وارد فرمایید.');
      return;
    }
    const cleanPhone = addForm.phone.trim();
    if (!cleanPhone.startsWith('09') || cleanPhone.length !== 11) {
      toast.error('شماره تلفن همراه باید ۱۱ رقم بوده و با ۰۹ آغاز شود.');
      return;
    }

    setAddingUser(true);
    try {
      const payload = {
        phone: cleanPhone,
        first_name: addForm.first_name.trim(),
        last_name: addForm.last_name.trim(),
        national_id: addForm.national_id.trim() || undefined,
        role: addForm.role,
        is_active: addForm.is_active,
      };
      if (addForm.password.trim()) {
        const validation = validatePassword(addForm.password.trim());
        if (!validation.isValid) {
          toast.error(validation.firstError || 'رمز عبور با معیارهای امنیتی مطابقت ندارد.');
          setAddingUser(false);
          return;
        }
        payload.password = addForm.password.trim();
      }

      const res = await api.post('/auth/users/', payload);
      toast.success(`کاربر ${res.data.full_name || res.data.phone} با موفقیت افزوده شد.`);
      setIsAddModalOpen(false);
      fetchUsersData();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.phone || err.response?.data?.role || err.response?.data?.detail || 'خطا در افزودن کاربر جدید';
      toast.error(Array.isArray(detail) ? detail[0] : detail);
    } finally {
      setAddingUser(false);
    }
  };

  // Edit User (ادیت مشخصات کاربر)
  const handleOpenEditModal = (targetUser) => {
    setSelectedUser(targetUser);
    setEditForm({
      first_name: targetUser.first_name || '',
      last_name: targetUser.last_name || '',
      phone: targetUser.phone || '',
      national_id: targetUser.national_id || '',
      role: targetUser.role || 'SWIMMER',
      password: '',
      is_active: targetUser.is_active ?? true,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    setUpdatingUser(true);
    try {
      const payload = {
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        phone: editForm.phone.trim(),
        national_id: editForm.national_id.trim(),
        is_active: editForm.is_active,
      };
      if (selectedUser.role !== 'ADMIN') {
        payload.role = editForm.role;
      }
      if (editForm.password.trim()) {
        const validation = validatePassword(editForm.password.trim());
        if (!validation.isValid) {
          toast.error(validation.firstError || 'رمز عبور با معیارهای امنیتی مطابقت ندارد.');
          setUpdatingUser(false);
          return;
        }
        payload.password = editForm.password.trim();
      }

      const res = await api.patch(`/auth/users/${selectedUser.id}/`, payload);
      toast.success(`مشخصات کاربر ${res.data.full_name || res.data.phone} با موفقیت به‌روزرسانی شد.`);
      setIsEditModalOpen(false);
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? res.data : u)));
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || err.response?.data?.role || 'خطا در ویرایش مشخصات کاربر';
      toast.error(Array.isArray(detail) ? detail[0] : detail);
    } finally {
      setUpdatingUser(false);
    }
  };

  // Delete User (دیلیت کاربر)
  const handleOpenDeleteModal = (targetUser) => {
    if (targetUser.id === user?.id) {
      toast.error('امکان حذف حساب کاربری مدیر جاری وجود ندارد.');
      return;
    }
    setSelectedUser(targetUser);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setDeletingUser(true);
    try {
      await api.delete(`/auth/users/${selectedUser.id}/`);
      toast.success(`کاربر ${selectedUser.full_name || selectedUser.phone} با موفقیت حذف شد.`);
      setIsDeleteModalOpen(false);
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || 'خطا در حذف کاربر';
      toast.error(detail);
    } finally {
      setDeletingUser(false);
    }
  };

  const handleCopyPhone = (phone) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    toast.success('شماره همراه کپی شد.');
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const roleLabels = {
    ADMIN: 'مدیر آموزشگاه',
    COACH: 'مربی آکادمی',
    SWIMMER: 'شناگر / اولیا',
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
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                پروفایل و مدیریت سیستم
              </h1>
              <span className="px-3 py-1 rounded-lg text-xs sm:text-sm font-bold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800">
                مدیر آموزشگاه
              </span>
            </div>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
              مشخصات فردی، پیکربندی قوانین و سیاست‌های آموزشگاه، و مدیریت کاربران و دسترسی‌ها
            </p>
          </div>
        </div>

        {/* Quick User Identity Badge */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/70 text-sm">
          <div className="text-right">
            <span className="font-bold text-slate-800 dark:text-slate-200 block text-sm">
              {user?.full_name}
            </span>
            <span className="font-mono text-slate-400 text-xs">
              {user?.phone}
            </span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950/40" title="آنلاین" />
        </div>
      </div>

      {/* Main Page Navigation Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-sm sm:text-base font-bold gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => handleTabChange('PROFILE')}
          className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeMainTab === 'PROFILE'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <User className="w-5 h-5 shrink-0" />
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
          <Settings className="w-5 h-5 shrink-0" />
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
          <ShieldAlert className="w-5 h-5 shrink-0" />
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
                <span className="text-xs sm:text-sm text-slate-400 block font-medium">نقش سازمانی</span>
                <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">مدیریت کل آموزشگاه</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/70 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm text-slate-400 block font-medium">وضعیت حساب</span>
                <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">فعال و تأییدشده</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200/60 dark:border-purple-800/70 shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm text-slate-400 block font-medium">سطح دسترسی</span>
                <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">دسترسی کامل (Super Admin)</span>
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
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                    مشخصات هویتی و فردی مدیر
                  </h3>
                  <span className="text-xs sm:text-sm text-slate-400">
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
                      placeholder="مثال: علی"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all"
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
                      placeholder="مثال: حسینی"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      شماره تلفن همراه (شناسه ورود):
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                      <input
                        type="text"
                        disabled
                        value={profileForm.phone}
                        className="w-full pr-10 pl-3 py-2.5 text-sm font-mono bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      کد ملی:
                    </label>
                    <input
                      type="text"
                      value={profileForm.national_id}
                      onChange={(e) => setProfileForm({ ...profileForm, national_id: e.target.value })}
                      placeholder="۱۰ رقم بدون خط تیره"
                      className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" loading={savingProfile} className="gap-2 text-sm font-bold px-5">
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
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                      تغییر رمز عبور ورود
                    </h3>
                    <span className="text-xs sm:text-sm text-slate-400">
                      تعیین کلمه عبور جدید برای ورود ایمن به سامانه
                    </span>
                  </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  {/* توضیحات و شرایط الزامی کلمه عبور در بالا */}
                  <PasswordRequirementsList password={passwordForm.newPassword} showAlways={true} />

                  {/* رمز جدید و تکرار زیر هم */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      رمز عبور جدید (انگلیسی، حداقل ۸ نویسه):
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="رمز عبور جدید"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      تکرار رمز عبور جدید:
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="تکرار رمز عبور"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button type="submit" variant="secondary" loading={savingPassword} className="gap-2 text-sm font-bold px-5">
                      <KeyRound className="w-4 h-4" />
                      <span>به‌روزرسانی رمز عبور</span>
                    </Button>
                  </div>
                </form>
              </div>

              {/* Security Hint */}
              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
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
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700 text-sm font-bold w-fit overflow-x-auto gap-1">
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
                  className={`px-4 py-2.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap text-sm ${
                    settingsActiveSubTab === tab.key
                      ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {settingsActiveSubTab === 'ACADEMY' && (
                <div className="space-y-4">
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    مشخصات عمومی و تماس آکادمی
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        نام رسمی آموزشگاه
                      </label>
                      <input
                        type="text"
                        value={settings.academyName}
                        onChange={(e) => setSettings({ ...settings, academyName: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        نام استخر و مجموعه اصلی
                      </label>
                      <input
                        type="text"
                        value={settings.poolName}
                        onChange={(e) => setSettings({ ...settings, poolName: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        شماره تماس ثابت آموزشگاه
                      </label>
                      <input
                        type="text"
                        value={settings.phone}
                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        شماره همراه پشتیبانی / ثبت‌نام
                      </label>
                      <input
                        type="text"
                        value={settings.supportMobile}
                        onChange={(e) => setSettings({ ...settings, supportMobile: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      نشانی پستی مجموعه ورزشی
                    </label>
                    <textarea
                      rows={2}
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              )}

              {settingsActiveSubTab === 'CLASS' && (
                <div className="space-y-4">
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    ضوابط برگزاری و ظرفیت جلسات شنا
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        مدت زمان پیش‌فرض هر سانس (دقیقه)
                      </label>
                      <input
                        type="number"
                        value={settings.defaultSessionDurationMinutes}
                        onChange={(e) => setSettings({ ...settings, defaultSessionDurationMinutes: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        ظرفیت استاندارد کلاس‌های گروهی
                      </label>
                      <input
                        type="number"
                        value={settings.defaultGroupCapacity}
                        onChange={(e) => setSettings({ ...settings, defaultGroupCapacity: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        مهلت مجاز لغو جلسه توسط شاگرد (ساعت قبل از سانس)
                      </label>
                      <input
                        type="number"
                        value={settings.cancellationNoticeHours}
                        onChange={(e) => setSettings({ ...settings, cancellationNoticeHours: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        حداکثر سهمیه جلسات جبرانی در هر ترم
                      </label>
                      <input
                        type="number"
                        value={settings.maxMakeupPerCourse}
                        onChange={(e) => setSettings({ ...settings, maxMakeupPerCourse: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {settingsActiveSubTab === 'FINANCE' && (
                <div className="space-y-4">
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    قوانین مالی و پرداخت شهریه
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        واحد پولی سیستم
                      </label>
                      <input
                        type="text"
                        disabled
                        value={settings.currency}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        تعداد پیش‌فرض اقساط شهریه
                      </label>
                      <input
                        type="number"
                        value={settings.installmentCountDefault}
                        onChange={(e) => setSettings({ ...settings, installmentCountDefault: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        مهلت ارفاق پرداخت سررسید (روز)
                      </label>
                      <input
                        type="number"
                        value={settings.overdueGraceDays}
                        onChange={(e) => setSettings({ ...settings, overdueGraceDays: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {settingsActiveSubTab === 'SYSTEM' && (
                <div className="space-y-4">
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    پیکربندی زمان، زبان و تقویم
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        منطقه زمانی سامانه
                      </label>
                      <input
                        type="text"
                        disabled
                        value={settings.timezone}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        سیستم تقویم و گاه‌شمار
                      </label>
                      <input
                        type="text"
                        disabled
                        value={settings.calendarSystem}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Button type="submit" loading={savingSettings} className="gap-2 text-sm font-bold px-6">
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
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700 text-sm font-bold w-fit gap-1">
            <button
              type="button"
              onClick={() => setSecuritySubTab('USERS')}
              className={`px-4 py-2.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 text-sm ${
                securitySubTab === 'USERS'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4.5 h-4.5" />
              <span>فهرست کاربران و نقش‌ها</span>
            </button>

            <button
              type="button"
              onClick={() => setSecuritySubTab('AUDIT_LOGS')}
              className={`px-4 py-2.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 text-sm ${
                securitySubTab === 'AUDIT_LOGS'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4.5 h-4.5" />
              <span>لاگ‌های ممیزی امنیتی (Audit)</span>
            </button>
          </div>

          {loadingUsers ? (
            <LoadingState type="table" rows={5} message="در حال بارگذاری اطلاعات کاربران..." />
          ) : securitySubTab === 'USERS' ? (
            <div className="space-y-4">
              {/* Stats Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 block font-medium">کل کاربران تحت مدیریت</span>
                  <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 font-mono mt-1">
                    {userStats.total}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-cyan-200/60 dark:border-cyan-900/40 shadow-2xs">
                  <span className="text-xs sm:text-sm text-cyan-600 dark:text-cyan-400 block font-medium">شناگران و اولیا</span>
                  <div className="text-xl sm:text-2xl font-bold text-cyan-700 dark:text-cyan-300 font-mono mt-1">
                    {userStats.swimmers}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 shadow-2xs">
                  <span className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 block font-medium">کادر مربیان</span>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-300 font-mono mt-1">
                    {userStats.coaches}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-200/60 dark:border-rose-900/40 shadow-2xs">
                  <span className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 block font-medium">کاربران معلق / مسدود</span>
                  <div className="text-xl sm:text-2xl font-bold text-rose-700 dark:text-rose-300 font-mono mt-1">
                    {userStats.suspended}
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="جستجو با نام، موبایل یا کد ملی..."
                    className="w-full pr-9 pl-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-full sm:w-48">
                    <CustomSelect
                      value={roleFilter}
                      onChange={(val) => {
                        setRoleFilter(val);
                        setCurrentPage(1);
                      }}
                      options={roleFilterOptions}
                      placeholder="همه نقش‌ها..."
                      icon={Filter}
                      size="sm"
                      clearable
                    />
                  </div>

                  <div className="w-full sm:w-44">
                    <CustomSelect
                      value={statusFilter}
                      onChange={(val) => {
                        setStatusFilter(val);
                        setCurrentPage(1);
                      }}
                      options={statusFilterOptions}
                      placeholder="همه وضعیت‌ها..."
                      icon={Shield}
                      size="sm"
                      clearable
                    />
                  </div>

                  <button
                    type="button"
                    onClick={fetchUsersData}
                    className="p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    title="به‌روزرسانی جدول"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <Button
                    variant="primary"
                    onClick={handleOpenAddModal}
                    className="gap-1.5 text-sm font-bold py-2.5 px-4 shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>افزودن کاربر جدید</span>
                  </Button>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
                {filteredUsers.length === 0 ? (
                  <EmptyState message="کاربری با معیارهای جستجو یافت نشد." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 font-bold text-xs sm:text-sm">
                        <tr>
                          <th className="px-4 py-3.5">کاربر و نام</th>
                          <th className="px-4 py-3.5">شماره تماس (موبایل)</th>
                          <th className="px-4 py-3.5">کد ملی</th>
                          <th className="px-4 py-3.5">نقش کاربری</th>
                          <th className="px-4 py-3.5 text-center">وضعیت حساب</th>
                          <th className="px-4 py-3.5">تاریخ ثبت‌نام</th>
                          <th className="px-4 py-3.5 text-center">عملیات مدیریت</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {paginatedUsers.map((u) => {
                          const isCurrent = u.id === user?.id;

                          return (
                            <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                              {/* Name & Avatar */}
                              <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-100 text-sm">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 font-bold flex items-center justify-center text-xs shrink-0">
                                    {u.first_name ? u.first_name.charAt(0) : 'U'}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span>{u.full_name || 'بدون نام'}</span>
                                    {isCurrent && (
                                      <span className="text-xs bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 px-1.5 py-0.5 rounded-md font-bold">
                                        شما
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Phone */}
                              <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-300 text-sm">
                                <div className="flex items-center gap-1.5">
                                  <span>{u.phone}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyPhone(u.phone)}
                                    className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                    title="کپی شماره تماس"
                                  >
                                    {copiedPhone === u.phone ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </td>

                              {/* National ID */}
                              <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-300 text-sm">
                                {u.national_id || '-'}
                              </td>

                              {/* Role */}
                              <td className="px-4 py-3.5">
                                <Badge
                                  variant={
                                    u.role === 'ADMIN' ? 'primary' :
                                    u.role === 'COACH' ? 'success' : 'info'
                                  }
                                >
                                  {roleLabels[u.role] || u.role}
                                </Badge>
                              </td>

                              {/* Status (فعال / معلق) */}
                              <td className="px-4 py-3.5 text-center">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                    u.is_active
                                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50'
                                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/50'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                  <span>{u.is_active ? 'فعال' : 'معلق / مسدود'}</span>
                                </span>
                              </td>

                              {/* Created At */}
                              <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-xs sm:text-sm">
                                {formatPersianDate(u.created_at)}
                              </td>

                              {/* Actions: ادیت، معلق، دیلیت */}
                              <td className="px-4 py-3.5 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {/* Edit (ادیت) */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(u)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors cursor-pointer"
                                    title="ویرایش مشخصات کاربر"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>

                                  {/* Reset Password (صدور و کپی کلمه عبور جدید) */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenResetPasswordModal(u)}
                                    disabled={isCurrent}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      isCurrent
                                        ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                                        : 'text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 cursor-pointer'
                                    }`}
                                    title={isCurrent ? 'تغییر رمز مدیر از تب مشخصات انجام می‌شود' : 'صدور و کپی رمز عبور تصادفی جدید برای کاربر'}
                                  >
                                    <KeyRound className="w-4 h-4" />
                                  </button>

                                  {/* Suspend (معلق کردن / رفع تعلیق) */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleSuspend(u)}
                                    disabled={isCurrent || togglingUserId === u.id}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      isCurrent
                                        ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                                        : u.is_active
                                          ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 cursor-pointer'
                                          : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 cursor-pointer'
                                    }`}
                                    title={
                                      isCurrent
                                        ? 'امکان معلق‌سازی حساب جاری وجود ندارد'
                                        : u.is_active
                                          ? 'معلق کردن کاربر'
                                          : 'رفع تعلیق و فعال‌سازی'
                                    }
                                  >
                                    {u.is_active ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                  </button>

                                  {/* Delete (دیلیت) */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDeleteModal(u)}
                                    disabled={isCurrent}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      isCurrent
                                        ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                                        : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer'
                                    }`}
                                    title={isCurrent ? 'نمی‌توانید حساب کاربری خودتان را حذف نمایید' : 'حذف کاربر'}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {filteredUsers.length > pageSize && (
                  <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
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
                  <table className="w-full text-right text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 font-bold text-xs sm:text-sm">
                      <tr>
                        <th className="px-4 py-3.5">زمان رخداد</th>
                        <th className="px-4 py-3.5">نوع عملیات</th>
                        <th className="px-4 py-3.5">کاربر</th>
                        <th className="px-4 py-3.5">آدرس IP</th>
                        <th className="px-4 py-3.5">جزئیات عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3.5 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs sm:text-sm">
                            {formatPersianDate(log.created_at)}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                              {actionLabels[log.action] || log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 font-mono text-sm">
                            {log.user_phone || 'سیستم'}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-500 dark:text-slate-400 text-xs sm:text-sm">{log.ip_address || '-'}</td>
                          <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 text-xs sm:text-sm max-w-xs truncate">
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

      {/* ===================================================================== */}
      {/* MODAL 1: ADD USER (افزودن کاربر جدید)                                 */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="افزودن کاربر جدید به آموزشگاه"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl text-sm text-sky-800 dark:text-sky-300">
            شما به عنوان مدیر آموزشگاه می‌توانید شناگران و مربیان جدید را به سیستم اضافه کنید.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                شماره تلفن همراه (شناسه ورود) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  dir="ltr"
                  placeholder="09123456789"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  className="w-full pl-3 pr-9 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                کد ملی
              </label>
              <input
                type="text"
                dir="ltr"
                maxLength={10}
                placeholder="۱۰ رقم بدون خط تیره"
                value={addForm.national_id}
                onChange={(e) => setAddForm({ ...addForm, national_id: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                نام <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثلاً علی"
                value={addForm.first_name}
                onChange={(e) => setAddForm({ ...addForm, first_name: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                نام خانوادگی <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثلاً حسینی"
                value={addForm.last_name}
                onChange={(e) => setAddForm({ ...addForm, last_name: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              نقش کاربری در آموزشگاه <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  key: 'SWIMMER',
                  label: 'شناگر / اولیا',
                  desc: 'دسترسی به پورتال شناگر، انتخاب دوره، کارنامه و امور مالی',
                  icon: LifeBuoy,
                },
                {
                  key: 'COACH',
                  label: 'مربی آکادمی',
                  desc: 'دسترسی به میز کار مربی، کلاس‌ها، حضور و غیاب و ارزیابی',
                  icon: Award,
                },
              ].map((roleItem) => {
                const isSelected = addForm.role === roleItem.key;
                const IconComponent = roleItem.icon;
                return (
                  <div
                    key={roleItem.key}
                    onClick={() => setAddForm({ ...addForm, role: roleItem.key })}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/50 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4.5 h-4.5 text-sky-600 dark:text-sky-400" />
                        <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                          {roleItem.label}
                        </span>
                      </div>
                      <span className={`w-3 h-3 rounded-full border-2 ${
                        isSelected ? 'border-sky-600 bg-sky-600' : 'border-slate-300 dark:border-slate-600'
                      }`} />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {roleItem.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Password (تنظیم کلمه عبور بدون امکان مشاهده توسط مدیر) */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              کلمه عبور ورود به سامانه
            </label>
            {!addForm.password ? (
              <div className="p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    طبق ضوابط امنیتی، مدیر کلمه عبور کاربر را نمی‌بیند. می‌توانید کلمه عبور تصادفی تولید و کپی کنید، یا فیلد را خالی بگذارید تا ورود کاربر از طریق کد پیامکی OTP یا کد ملی انجام شود.
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateAddPassword}
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>تولید رمز تصادفی و کپی</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-semibold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    کلمه عبور امن تصادفی تولید و در کلیپ‌بورد کپی شد
                  </span>
                  <button
                    type="button"
                    onClick={() => setAddForm((prev) => ({ ...prev, password: '' }))}
                    className="text-xs text-rose-500 hover:underline cursor-pointer"
                  >
                    حذف رمز (ورود با کد ملی / پیامک)
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      readOnly
                      value={addForm.password}
                      className="w-full pl-3 pr-9 py-2.5 text-sm font-mono bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 rounded-xl text-slate-500 cursor-not-allowed select-none tracking-widest"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(addForm.password, 'کلمه عبور مجدداً در کلیپ‌بورد کپی شد.')}
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                    <span>کپی رمز عبور</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateAddPassword}
                    className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
                    title="تولید مجدد رمز"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  کاراکترهای رمز به دلایل امنیتی برای مدیر نمایش داده نمی‌شوند؛ رمز در کلیپ‌بورد شماست و می‌توانید مستقیماً برای کاربر ارسال کنید.
                </p>
              </div>
            )}
          </div>

          {/* Active Status Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="add_is_active"
              checked={addForm.is_active}
              onChange={(e) => setAddForm({ ...addForm, is_active: e.target.checked })}
              className="w-4 h-4 text-sky-600 rounded-md border-slate-300 dark:border-slate-600 focus:ring-sky-500 cursor-pointer"
            />
            <label htmlFor="add_is_active" className="text-sm text-slate-700 dark:text-slate-300 select-none cursor-pointer">
              حساب کاربری از ابتدا <strong>فعال</strong> باشد و کاربر معلق نباشد.
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={addingUser}
              className="text-sm font-medium"
            >
              انصراف
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={addingUser}
              className="gap-2 text-sm font-bold"
            >
              {addingUser ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>در حال افزودن...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>ثبت و ایجاد کاربر</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 2: EDIT USER (ویرایش مشخصات کاربر)                              */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`ویرایش مشخصات کاربر: ${selectedUser?.full_name || selectedUser?.phone}`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                نام
              </label>
              <input
                type="text"
                required
                value={editForm.first_name}
                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                نام خانوادگی
              </label>
              <input
                type="text"
                required
                value={editForm.last_name}
                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                شماره تلفن همراه
              </label>
              <input
                type="text"
                required
                dir="ltr"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                کد ملی
              </label>
              <input
                type="text"
                dir="ltr"
                value={editForm.national_id}
                onChange={(e) => setEditForm({ ...editForm, national_id: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              نقش و سطح دسترسی کاربر
            </label>
            {selectedUser?.role === 'ADMIN' ? (
              <input
                type="text"
                disabled
                value="مدیر آموزشگاه (ADMIN) - حساب کاربری جاری"
                className="w-full px-3 py-2.5 text-sm bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed"
              />
            ) : (
              <CustomSelect
                value={editForm.role}
                onChange={(val) => setEditForm({ ...editForm, role: val })}
                options={[
                  {
                    value: 'SWIMMER',
                    label: 'شناگر / اولیا',
                    description: 'دسترسی به پورتال آموزشی، دوره‌ها و سوابق شناگر',
                    icon: User,
                  },
                  {
                    value: 'COACH',
                    label: 'مربی آکادمی',
                    description: 'دسترسی به میز کار مربی، ثبت جلسات، حضور و غیاب و ارزیابی',
                    icon: Award,
                  },
                ]}
                menuClassName="w-full"
              />
            )}
          </div>

          {/* Password (تنظیم کلمه عبور بدون دسترسی یا مشاهده توسط مدیر) */}
          {selectedUser?.role !== 'ADMIN' && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                کلمه عبور ورود به سامانه
              </label>
              {!editForm.password ? (
                <div className="p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      رمزهای عبور کاربران هش‌شده و برای هیچ‌کس (از جمله مدیر) قابل مشاهده نیست. در صورت درخواست کاربر، می‌توانید کلمه عبور تصادفی جدید صادر و در کلیپ‌بورد کپی فرمایید.
                    </p>
                    <button
                      type="button"
                      onClick={handleGenerateEditPassword}
                      className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>تولید رمز تصادفی و کپی</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-semibold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      کلمه عبور تصادفی جدید آماده ثبت و در کلیپ‌بورد کپی شد
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditForm((prev) => ({ ...prev, password: '' }))}
                      className="text-xs text-rose-500 hover:underline cursor-pointer"
                    >
                      انصراف از تغییر رمز
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        readOnly
                        value={editForm.password}
                        className="w-full pl-3 pr-9 py-2.5 text-sm font-mono bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 rounded-xl text-slate-500 cursor-not-allowed select-none tracking-widest"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(editForm.password, 'کلمه عبور جدید مجدداً در کلیپ‌بورد کپی شد.')}
                      className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                      <span>کپی رمز عبور</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateEditPassword}
                      className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
                      title="تولید مجدد رمز"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    با کلیک بر روی «ذخیره مشخصات»، این رمز اعمال می‌شود. کاراکترها به مدیر نمایش داده نمی‌شوند و در کلیپ‌بورد کپی شده‌اند.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Active Status Checkbox */}
          {selectedUser?.id !== user?.id && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="edit_is_active"
                checked={editForm.is_active}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                className="w-4 h-4 text-sky-600 rounded-md border-slate-300 dark:border-slate-600 focus:ring-sky-500 cursor-pointer"
              />
              <label htmlFor="edit_is_active" className="text-sm text-slate-700 dark:text-slate-300 select-none cursor-pointer">
                وضعیت حساب کاربری فعال باشد (معلق نباشد).
              </label>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={updatingUser}
              className="text-sm font-medium"
            >
              انصراف
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={updatingUser}
              className="gap-2 text-sm font-bold"
            >
              {updatingUser ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>در حال ذخیره...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ذخیره تغییرات</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 3: DELETE USER (حذف قطعی کاربر)                                 */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="تأییدیه حذف کاربر از سیستم"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-200 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div className="leading-relaxed">
              <strong>هشدار مدیریتی:</strong> آیا از حذف کامل کاربر{' '}
              <strong>{selectedUser?.full_name || selectedUser?.phone}</strong> اطمینان دارید؟ این عملیات غیرقابل بازگشت است.
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-sm space-y-2 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">شماره تلفن:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{selectedUser?.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">کد ملی:</span>
              <span className="font-mono text-slate-800 dark:text-slate-100">{selectedUser?.national_id || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">نقش:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{roleLabels[selectedUser?.role] || selectedUser?.role}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deletingUser}
              className="text-sm font-medium"
            >
              انصراف
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteUser}
              disabled={deletingUser}
              className="gap-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold"
            >
              {deletingUser ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>در حال حذف...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>حذف قطعی کاربر</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 4: RESET USER PASSWORD (صدور کلمه عبور تصادفی جدید و کپی)       */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isResetPasswordModalOpen}
        onClose={() => {
          setIsResetPasswordModalOpen(false);
          setGeneratedResetPassword(null);
        }}
        title={`صدور کلمه عبور تصادفی جدید: ${selectedUser?.full_name || selectedUser?.phone}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          {!generatedResetPassword ? (
            <>
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-800 dark:text-amber-300 leading-relaxed space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
                  <ShieldAlert className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                  <span>حفظ امنیت و محرمانگی کلمه عبور کاربر</span>
                </div>
                <p>
                  مدیر آموزشگاه به کلمات عبور کاربران دسترسی ندارد و امکان مشاهده یا تعیین رمز دلخواه وجود ندارد. با زدن دکمه زیر، یک کلمه عبور استاندارد، قوی و تصادفی صادر و بلافاصله در کلیپ‌بورد شما کپی خواهد شد تا بتوانید آن را برای کاربر ارسال نمایید.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">نام کاربر:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{selectedUser?.full_name || 'بدون نام'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">شماره همراه (شناسه ورود):</span>
                  <span className="font-mono text-slate-800 dark:text-slate-100">{selectedUser?.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">نقش کاربری:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{roleLabels[selectedUser?.role] || selectedUser?.role}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  disabled={resettingUser}
                  className="text-sm font-medium"
                >
                  انصراف
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleExecuteResetPassword}
                  disabled={resettingUser}
                  className="gap-2 text-sm font-bold"
                >
                  {resettingUser ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال صدور و ثبت...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>تولید، ثبت و کپی کلمه عبور جدید</span>
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base text-emerald-900 dark:text-emerald-100">
                  کلمه عبور جدید با موفقیت ثبت شد
                </h4>
                <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  رمز عبور تصادفی جدید در کلیپ‌بورد سیستم شما کپی گردید. لطفاً آن را از طریق پیامک یا پیام‌رسان به کاربر اعلام فرمایید.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4.5 h-4.5 text-slate-400" />
                  <span className="font-mono text-base tracking-widest text-slate-600 dark:text-slate-300 select-none">
                    ••••••••••••••
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(generatedResetPassword, 'کلمه عبور مجدداً در کلیپ‌بورد کپی شد.')}
                  className="gap-1.5 text-xs sm:text-sm py-1.5 px-3 font-semibold"
                >
                  <Copy className="w-4 h-4" />
                  <span>کپی مجدد رمز عبور</span>
                </Button>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    setIsResetPasswordModalOpen(false);
                    setGeneratedResetPassword(null);
                  }}
                  className="text-sm font-bold"
                >
                  متوجه شدم و بستن
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
