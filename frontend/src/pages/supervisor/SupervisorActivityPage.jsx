import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, ShieldAlert, CheckCircle2, Clock, ShieldCheck,
  RefreshCw, Lock, AlertTriangle, KeyRound, UserCheck,
  UserPlus, UserX, Trash2, Edit3, Search, Filter, Phone,
  Eye, EyeOff, Copy, Check, Shield, Activity, Award,
  LifeBuoy, XCircle
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { formatPersianDate } from '../../utils/date';
import { validatePassword, generateStrongPassword, PasswordRequirementsList } from '../../utils/passwordValidator';

const ROLE_DEFINITIONS = {
  ADMIN: {
    label: 'مدیریت',
    bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    icon: Shield,
    description: 'مدیریت سامانه',
  },
  SUPERVISOR: {
    label: 'ناظر فنی',
    bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    icon: Activity,
    description: 'پایش و نظارت فنی',
  },
  COACH: {
    label: 'مربی',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    icon: Award,
    description: 'مربی',
  },
  SWIMMER: {
    label: 'شناگر',
    bg: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    icon: LifeBuoy,
    description: 'شناگر',
  },
};

export const SupervisorActivityPage = () => {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [activityData, setActivityData] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Copy phone feedback
  const [copiedPhone, setCopiedPhone] = useState(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [addForm, setAddForm] = useState({
    phone: '',
    first_name: '',
    last_name: '',
    national_id: '',
    role: 'ADMIN',
    password: '',
    is_active: true,
  });
  const [addingUser, setAddingUser] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);

  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    national_id: '',
    role: 'SWIMMER',
    is_active: true,
  });
  const [updatingUser, setUpdatingUser] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [deletingUser, setDeletingUser] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState(null);

  // Fetch Activity and Users
  const fetchData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const [activityRes, usersRes] = await Promise.all([
        api.get('/supervisor/activity/'),
        api.get('/auth/users/?page_size=100'),
      ]);

      setActivityData(activityRes.data);
      const userList = usersRes.data.results || usersRes.data || [];
      setUsers(userList);

      if (isManual) {
        toast.success('اطلاعات نشست‌ها و امنیت کاربران به‌روزرسانی شد.');
      }
    } catch (err) {
      console.error(err);
      toast.error('عدم برقراری ارتباط با سامانه پایش کاربران');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered & Paginated Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter) {
        if (roleFilter === 'PRIVILEGED') {
          const isPriv = u.role === 'ADMIN' || u.role === 'SUPERVISOR' || u.is_staff || u.is_superuser;
          if (!isPriv) return false;
        } else if (u.role !== roleFilter) {
          return false;
        }
      }

      // Status filter
      if (statusFilter === 'active' && !u.is_active) return false;
      if (statusFilter === 'inactive' && u.is_active) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
        const phone = (u.phone || '').toLowerCase();
        const nationalId = (u.national_id || '').toLowerCase();
        return fullName.includes(term) || phone.includes(term) || nationalId.includes(term);
      }

      return true;
    });
  }, [users, roleFilter, statusFilter, searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Handle Quick Toggle Active / Suspend
  const handleToggleActive = async (targetUser) => {
    if (targetUser.id === currentUser?.id) {
      toast.error('امکان تغییر وضعیت یا معلق‌سازی حساب کاربری جاری خودتان وجود ندارد.');
      return;
    }

    setTogglingUserId(targetUser.id);
    try {
      const nextState = !targetUser.is_active;
      const res = await api.patch(`/auth/users/${targetUser.id}/`, {
        is_active: nextState,
      });

      const updatedUser = res.data;
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, is_active: nextState } : u))
      );

      toast.success(
        nextState
          ? `حساب کاربری ${updatedUser.full_name || targetUser.full_name || targetUser.phone} با موفقیت فعال شد.`
          : `حساب کاربری ${updatedUser.full_name || targetUser.full_name || targetUser.phone} معلق گردید.`
      );
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.is_active || err.response?.data?.detail || 'خطا در تغییر وضعیت حساب کاربر';
      toast.error(Array.isArray(detail) ? detail[0] : detail);
    } finally {
      setTogglingUserId(null);
    }
  };

  // Add User
  const handleOpenAddModal = () => {
    setAddForm({
      phone: '',
      first_name: '',
      last_name: '',
      national_id: '',
      role: 'ADMIN',
      password: '',
      is_active: true,
    });
    setShowAddPassword(false);
    setIsAddModalOpen(true);
  };

  const handleGenerateRandomPassword = (targetForm = 'add') => {
    const rand = generateStrongPassword(14);
    if (targetForm === 'add') {
      setAddForm((prev) => ({ ...prev, password: rand }));
      setShowAddPassword(true);
    } else {
      setPasswordForm({ newPassword: rand, confirmPassword: rand });
      setShowNewPassword(true);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!addForm.phone || !addForm.first_name || !addForm.last_name) {
      toast.error('لطفاً شماره تلفن همراه، نام و نام‌خانوادگی را وارد فرمایید.');
      return;
    }

    const cleanedPhone = addForm.phone.trim();
    if (!cleanedPhone.startsWith('09') || cleanedPhone.length !== 11) {
      toast.error('شماره تلفن همراه باید ۱۱ رقم بوده و با ۰۹ شروع شود.');
      return;
    }

    if (addForm.password.trim()) {
      const validation = validatePassword(addForm.password.trim());
      if (!validation.isValid) {
        toast.error(validation.firstError || 'رمز عبور با معیارهای امنیتی مطابقت ندارد.');
        return;
      }
    }

    setAddingUser(true);
    try {
      const payload = {
        phone: cleanedPhone,
        first_name: addForm.first_name.trim(),
        last_name: addForm.last_name.trim(),
        national_id: addForm.national_id.trim() || undefined,
        role: addForm.role,
        is_active: addForm.is_active,
      };
      if (addForm.password.trim()) {
        payload.password = addForm.password.trim();
      }

      const res = await api.post('/auth/users/', payload);
      toast.success(
        `کاربر ${res.data.full_name || res.data.phone} با نقش ${ROLE_DEFINITIONS[res.data.role]?.label || res.data.role} با موفقیت افزوده شد.`
      );
      setIsAddModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.phone || err.response?.data?.detail || 'خطا در ثبت کاربر جدید';
      toast.error(Array.isArray(detail) ? detail[0] : detail);
    } finally {
      setAddingUser(false);
    }
  };

  // Edit User
  const handleOpenEditModal = (targetUser) => {
    setSelectedUser(targetUser);
    setEditForm({
      first_name: targetUser.first_name || '',
      last_name: targetUser.last_name || '',
      phone: targetUser.phone || '',
      national_id: targetUser.national_id || '',
      role: targetUser.role || 'SWIMMER',
      is_active: targetUser.is_active ?? true,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    setUpdatingUser(true);
    try {
      const res = await api.patch(`/auth/users/${selectedUser.id}/`, {
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        phone: editForm.phone.trim(),
        national_id: editForm.national_id.trim(),
        role: editForm.role,
        is_active: editForm.is_active,
      });
      toast.success(`مشخصات کاربر ${res.data.full_name || res.data.phone} با موفقیت به‌روزرسانی گردید.`);
      setIsEditModalOpen(false);
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? { ...u, ...res.data } : u)));
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || 'خطا در ویرایش مشخصات کاربر';
      toast.error(detail);
    } finally {
      setUpdatingUser(false);
    }
  };

  // Password Reset
  const handleOpenPasswordModal = (targetUser) => {
    setSelectedUser(targetUser);
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    setShowNewPassword(false);
    setIsPasswordModalOpen(true);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    const validation = validatePassword(passwordForm.newPassword);
    if (!validation.isValid) {
      toast.error(validation.firstError || 'رمز عبور با معیارهای امنیتی مطابقت ندارد.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('کلمه عبور جدید با تکرار آن همخوانی ندارد.');
      return;
    }

    setSavingPassword(true);
    try {
      await api.patch(`/auth/users/${selectedUser.id}/`, {
        password: passwordForm.newPassword.trim(),
      });
      toast.success(`کلمه عبور جدید برای کاربر ${selectedUser.full_name || selectedUser.phone} با موفقیت ذخیره شد.`);
      setIsPasswordModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('خطا در تغییر کلمه عبور کاربر');
    } finally {
      setSavingPassword(false);
    }
  };

  // Delete User
  const handleOpenDeleteModal = (targetUser) => {
    if (targetUser.id === currentUser?.id) {
      toast.error('شما نمی‌توانید حساب کاربری فعال خود را حذف نمایید.');
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
      toast.success(`کاربر ${selectedUser.full_name || selectedUser.phone} با موفقیت از سیستم حذف شد.`);
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
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    toast.success('شماره تلفن کپی شد.');
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  if (loading && !activityData && users.length === 0) {
    return <LoadingState type="dashboard" message="در حال بررسی نشست‌های فعال، حساب‌های ویژه و پایش کاربران..." />;
  }

  const activeCount = activityData?.active_sessions_count || 0;
  const failedCount = activityData?.failed_logins_24h || 0;
  const privilegedCount = users.filter((u) => u.role === 'ADMIN' || u.role === 'SUPERVISOR' || u.is_staff || u.is_superuser).length;
  const totalCount = users.length;
  const totalActive = users.filter((u) => u.is_active).length;
  const totalSuspended = totalCount - totalActive;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              نظارت بر نشست‌ها و امنیت حساب‌ها (User Activity & Access)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            پایش نشست‌های فعال، تلاش‌های ناموفق احراز هویت و مدیریت کاربران و دسترسی‌ها (افزودن، تعلیق و حذف)
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="به‌روزرسانی اطلاعات"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-600' : ''}`} />
            <span>به‌روزرسانی</span>
          </button>

          <Button
            variant="primary"
            onClick={handleOpenAddModal}
            className="gap-2 text-xs py-2.5 px-4 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>افزودن کاربر جدید</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Stats Cards (Clean Persian typography, no font-mono on words) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Online Sessions */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>کاربران فعال (۱۵ دقیقه گذشته)</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold">{activeCount}</span>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">کاربر آنلاین</span>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            نشست‌های احراز هویت‌شده
          </p>
        </div>

        {/* Card 2: Failed Logins */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>تلاش‌های ناموفق ورود (۲۴ ساعت)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold">{failedCount}</span>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">تلاش</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">تحت محافظت Rate Limiter</p>
        </div>

        {/* Card 3: Privileged Accounts */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>حساب‌های دسترسی ویژه</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold">{privilegedCount}</span>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">کاربر ویژه</span>
          </div>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">شامل مدیران و ناظران فنی</p>
        </div>

        {/* Card 4: Total & Status Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>کل حساب‌های کاربری</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold">{totalCount}</span>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">کاربر</span>
          </div>
          <div className="text-xs flex items-center gap-2 font-medium">
            <span className="text-emerald-600 dark:text-emerald-400">{totalActive} فعال</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-rose-600 dark:text-rose-400">{totalSuspended} معلق</span>
          </div>
        </div>
      </div>

      {/* 3. Main Users Management Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        {/* Card Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>فهرست حساب‌های کاربری و سطوح دسترسی</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                {filteredUsers.length} حساب
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              مدیریت مستقیم، افزودن کاربر، معلق‌سازی یا فعال‌سازی آنی حساب‌ها و بازنشانی مشخصات
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="px-6 py-4 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="جستجو با نام و نام خانوادگی، شماره همراه..."
              className="w-full pl-3 pr-10 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="">همه نقش‌ها ({users.length})</option>
                <option value="PRIVILEGED">حساب‌های ویژه ({privilegedCount})</option>
                <option value="ADMIN">مدیریت ({users.filter((u) => u.role === 'ADMIN').length})</option>
                <option value="SUPERVISOR">ناظر فنی ({users.filter((u) => u.role === 'SUPERVISOR').length})</option>
                <option value="COACH">مربی ({users.filter((u) => u.role === 'COACH').length})</option>
                <option value="SWIMMER">شناگر ({users.filter((u) => u.role === 'SWIMMER').length})</option>
              </select>
            </div>

            <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="">همه وضعیت‌ها</option>
                <option value="active">فقط حساب‌های فعال ({totalActive})</option>
                <option value="inactive">فقط حساب‌های معلق ({totalSuspended})</option>
              </select>
            </div>

            {(searchTerm || roleFilter || statusFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('');
                  setStatusFilter('');
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
              >
                پاک‌سازی فیلتر
              </button>
            )}
          </div>
        </div>

        {/* Content: Empty State, Desktop Table (7 Clean Columns), and Mobile Cards */}
        {filteredUsers.length === 0 ? (
          <div className="py-12">
            <EmptyState
              message={
                searchTerm || roleFilter || statusFilter
                  ? 'هیچ کاربری با فیلترهای انتخاب‌شده یافت نشد.'
                  : 'هنوز هیچ کاربری در سیستم ثبت نشده است.'
              }
            />
          </div>
        ) : (
          <>
            {/* 1. DESKTOP & LAPTOP TABLE (Spacious 7 Columns without National ID or Staff/Superuser) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 whitespace-nowrap">
                  <tr>
                    <th className="px-5 py-3.5">نام و نام خانوادگی</th>
                    <th className="px-4 py-3.5">شماره تلفن</th>
                    <th className="px-4 py-3.5">نقش</th>
                    <th className="px-4 py-3.5 text-center">وضعیت</th>
                    <th className="px-4 py-3.5">آخرین ورود</th>
                    <th className="px-4 py-3.5">تاریخ عضویت</th>
                    <th className="px-5 py-3.5 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedUsers.map((u) => {
                    const isCurrent = u.id === currentUser?.id;
                    const roleDef = ROLE_DEFINITIONS[u.role] || ROLE_DEFINITIONS.SWIMMER;
                    const RoleIcon = roleDef.icon;
                    const isToggling = togglingUserId === u.id;

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* 1. Name & Avatar */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                              {u.first_name ? u.first_name.charAt(0) : 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap">
                                <span>{u.full_name || 'کاربر بدون نام'}</span>
                                {isCurrent && (
                                  <span className="text-[10px] bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 px-1.5 py-0.2 rounded-md font-medium">
                                    شما
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                ID: #{u.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Phone */}
                        <td className="px-4 py-3.5 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs sm:text-sm">{u.phone}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyPhone(u.phone)}
                              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                              title="کپی شماره"
                            >
                              {copiedPhone === u.phone ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* 3. Role */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleDef.bg}`}
                            title={roleDef.description}
                          >
                            <RoleIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>{roleDef.label}</span>
                          </span>
                        </td>

                        {/* 4. Status Toggle Pill */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(u)}
                            disabled={isCurrent || isToggling}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
                              u.is_active
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800'
                            } ${isCurrent ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                            title={
                              isCurrent
                                ? 'امکان تعلیق حساب کاربری فعال جاری وجود ندارد'
                                : u.is_active
                                ? 'کلیک کنید تا حساب کاربری معلق شود'
                                : 'کلیک کنید تا حساب کاربری فعال شود'
                            }
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isToggling
                                  ? 'bg-amber-500 animate-spin'
                                  : u.is_active
                                  ? 'bg-emerald-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                            <span>{u.is_active ? 'فعال' : 'معلق'}</span>
                          </button>
                        </td>

                        {/* 5. Last Login */}
                        <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {u.last_login ? new Date(u.last_login).toLocaleString('fa-IR') : 'هرگز'}
                        </td>

                        {/* 6. Created At */}
                        <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {u.created_at || u.date_joined
                            ? new Date(u.created_at || u.date_joined).toLocaleDateString('fa-IR')
                            : '—'}
                        </td>

                        {/* 7. Actions */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Suspend / Activate Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleActive(u)}
                              disabled={isCurrent || isToggling}
                              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                                isCurrent
                                  ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                                  : u.is_active
                                  ? 'text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50'
                                  : 'text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                              }`}
                              title={
                                isCurrent
                                  ? 'امکان معلق‌سازی حساب جاری وجود ندارد'
                                  : u.is_active
                                  ? 'معلق‌سازی حساب کاربر'
                                  : 'رفع تعلیق و فعال‌سازی حساب'
                              }
                            >
                              {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4 text-emerald-600" />}
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(u)}
                              className="p-2 rounded-xl text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors cursor-pointer"
                              title="ویرایش مشخصات کاربر"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Password */}
                            <button
                              type="button"
                              onClick={() => handleOpenPasswordModal(u)}
                              className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                              title="تغییر یا بازنشانی کلمه عبور"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteModal(u)}
                              disabled={isCurrent}
                              className={`p-2 rounded-xl transition-colors ${
                                isCurrent
                                  ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                                  : 'text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer'
                              }`}
                              title={isCurrent ? 'نمی‌توانید حساب کاربری فعال خود را حذف نمایید' : 'حذف کاربر'}
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

            {/* 2. MOBILE CARD VIEW (Standalone Cards with Margin & Separation) */}
            <div className="block md:hidden p-3.5 space-y-3.5 bg-slate-50/70 dark:bg-slate-950/40">
              {paginatedUsers.map((u) => {
                const isCurrent = u.id === currentUser?.id;
                const roleDef = ROLE_DEFINITIONS[u.role] || ROLE_DEFINITIONS.SWIMMER;
                const RoleIcon = roleDef.icon;
                const isToggling = togglingUserId === u.id;

                return (
                  <div
                    key={u.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-3"
                  >
                    {/* Header: Name, Avatar, Role */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 font-bold flex items-center justify-center text-sm shrink-0 shadow-2xs">
                          {u.first_name ? u.first_name.charAt(0) : 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                            <span>{u.full_name || 'کاربر بدون نام'}</span>
                            {isCurrent && (
                              <span className="text-[10px] bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 px-1.5 py-0.2 rounded-md font-medium">
                                شما
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            ID: #{u.id}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${roleDef.bg}`}
                      >
                        <RoleIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>{roleDef.label}</span>
                      </span>
                    </div>

                    {/* Mobile Details: Phone & Last login */}
                    <div className="flex items-center justify-between text-xs bg-slate-50/80 dark:bg-slate-800/60 px-3.5 py-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-medium">شماره همراه:</span>
                        <div className="flex items-center gap-1.5 font-mono text-slate-800 dark:text-slate-200 mt-0.5 font-semibold">
                          <span>{u.phone}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyPhone(u.phone)}
                            className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            title="کپی شماره"
                          >
                            {copiedPhone === u.phone ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="text-left">
                        <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-medium">آخرین ورود:</span>
                        <span className="text-slate-700 dark:text-slate-300 text-[11px] mt-0.5 block">
                          {u.last_login ? new Date(u.last_login).toLocaleDateString('fa-IR') : 'هرگز'}
                        </span>
                      </div>
                    </div>

                    {/* Mobile Actions Bar */}
                    <div className="flex items-center justify-between pt-1">
                      {/* Status Toggle Pill */}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(u)}
                        disabled={isCurrent || isToggling}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                          u.is_active
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                        } ${isCurrent ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isToggling
                              ? 'bg-amber-500 animate-spin'
                              : u.is_active
                              ? 'bg-emerald-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        <span>{u.is_active ? 'فعال' : 'معلق'}</span>
                      </button>

                      {/* Action Icons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(u)}
                          disabled={isCurrent || isToggling}
                          className={`p-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors ${
                            isCurrent
                              ? 'opacity-40 cursor-not-allowed text-slate-400'
                              : u.is_active
                              ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50'
                              : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                          }`}
                          title={u.is_active ? 'معلق کردن کاربر' : 'فعال‌سازی کاربر'}
                        >
                          {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(u)}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors"
                          title="ویرایش مشخصات"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenPasswordModal(u)}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                          title="تغییر کلمه عبور"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenDeleteModal(u)}
                          disabled={isCurrent}
                          className={`p-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors ${
                            isCurrent
                              ? 'opacity-40 cursor-not-allowed text-slate-400'
                              : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                          }`}
                          title="حذف کاربر"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {filteredUsers.length > pageSize && (
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredUsers.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: ADD USER (افزودن کاربر جدید)                                 */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="افزودن کاربر جدید به سامانه"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl text-xs text-sky-800 dark:text-sky-300 leading-relaxed">
            با افزودن کاربر جدید، می‌توانید بلافاصله نقش وی را به <strong>مدیریت</strong>، <strong>ناظر فنی</strong>، <strong>مربی</strong> یا <strong>شناگر</strong> تعیین فرمایید.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
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
                  className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                نقش کاربری در سامانه <span className="text-rose-500">*</span>
              </label>
              <select
                value={addForm.role}
                onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer"
              >
                <option value="ADMIN">مدیریت (ADMIN)</option>
                <option value="SUPERVISOR">ناظر فنی (SUPERVISOR)</option>
                <option value="COACH">مربی (COACH)</option>
                <option value="SWIMMER">شناگر (SWIMMER)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                نام <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثلاً: علی"
                value={addForm.first_name}
                onChange={(e) => setAddForm({ ...addForm, first_name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                نام خانوادگی <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثلاً: رضایی"
                value={addForm.last_name}
                onChange={(e) => setAddForm({ ...addForm, last_name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                وضعیت اولیه حساب
              </label>
              <select
                value={addForm.is_active ? 'true' : 'false'}
                onChange={(e) => setAddForm({ ...addForm, is_active: e.target.value === 'true' })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer"
              >
                <option value="true">فعال (مجاز به ورود)</option>
                <option value="false">معلق (غیرفعال)</option>
              </select>
            </div>
          </div>

          {/* Password Field */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                کلمه عبور (اختیاری - در صورت خالی ماندن، ورود فقط با پیامک OTP خواهد بود)
              </label>
              <button
                type="button"
                onClick={() => handleGenerateRandomPassword('add')}
                className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <KeyRound className="w-3 h-3" />
                <span>تولید رمز عبور قوی</span>
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type={showAddPassword ? 'text' : 'password'}
                dir="ltr"
                placeholder="حداقل ۸ کاراکتر شامل حروف بزرگ، کوچک، عدد و نماد"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowAddPassword(!showAddPassword)}
                className="p-1 text-slate-400 hover:text-slate-600 absolute left-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                {showAddPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {addForm.password && <PasswordRequirementsList password={addForm.password} />}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
              className="text-xs py-2 px-4"
            >
              انصراف
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={addingUser}
              className="text-xs py-2 px-5 gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>ایجاد حساب کاربر</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 2: EDIT USER (ویرایش مشخصات)                                    */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`ویرایش مشخصات کاربر: ${selectedUser?.full_name || selectedUser?.phone || ''}`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                نام <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editForm.first_name}
                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                نام خانوادگی <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editForm.last_name}
                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                شماره تلفن همراه <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                dir="ltr"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                نقش کاربری در سامانه
              </label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer"
              >
                <option value="ADMIN">مدیریت (ADMIN)</option>
                <option value="SUPERVISOR">ناظر فنی (SUPERVISOR)</option>
                <option value="COACH">مربی (COACH)</option>
                <option value="SWIMMER">شناگر (SWIMMER)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                وضعیت حساب
              </label>
              <select
                value={editForm.is_active ? 'true' : 'false'}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === 'true' })}
                disabled={selectedUser?.id === currentUser?.id}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="true">فعال (مجاز به ورود)</option>
                <option value="false">معلق (غیرفعال)</option>
              </select>
              {selectedUser?.id === currentUser?.id && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                  نمی‌توانید وضعیت حساب کاربری خودتان را معلق کنید.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
              className="text-xs py-2 px-4"
            >
              انصراف
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={updatingUser}
              className="text-xs py-2 px-5"
            >
              ذخیره تغییرات
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 3: RESET PASSWORD (بازنشانی کلمه عبور)                            */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title={`تغییر کلمه عبور کاربر: ${selectedUser?.full_name || selectedUser?.phone || ''}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              تعیین رمز عبور جدید و اعمال فوری
            </span>
            <button
              type="button"
              onClick={() => handleGenerateRandomPassword('password')}
              className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <KeyRound className="w-3 h-3" />
              <span>تولید رمز قوی</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              کلمه عبور جدید <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                dir="ltr"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="p-1 text-slate-400 hover:text-slate-600 absolute left-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {passwordForm.newPassword && <PasswordRequirementsList password={passwordForm.newPassword} />}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              تکرار کلمه عبور جدید <span className="text-rose-500">*</span>
            </label>
            <input
              type={showNewPassword ? 'text' : 'password'}
              required
              dir="ltr"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPasswordModalOpen(false)}
              className="text-xs py-2 px-4"
            >
              انصراف
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={savingPassword}
              className="text-xs py-2 px-5"
            >
              ثبت کلمه عبور
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 4: DELETE CONFIRMATION (حذف کاربر)                              */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="تأیید حذف کاربر"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-300">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold">هشدار: این عمل غیرقابل بازگشت است!</div>
              <p className="text-rose-700/90 dark:text-rose-300/90 leading-relaxed">
                آیا از حذف حساب کاربری <strong>{selectedUser?.full_name || selectedUser?.phone}</strong> اطمینان دارید؟ تمامی نشست‌های فعال و دسترسی‌های این کاربر بلافاصله قطع خواهد شد.
              </p>
            </div>
          </div>

          {selectedUser && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1.5 font-mono text-slate-700 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">شناسه:</span>
                <span>#{selectedUser.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">شماره تماس:</span>
                <span>{selectedUser.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">نقش:</span>
                <span>{ROLE_DEFINITIONS[selectedUser.role]?.label || selectedUser.role}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              className="text-xs py-2 px-4"
            >
              انصراف
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deletingUser}
              onClick={handleDeleteUser}
              className="text-xs py-2 px-5 gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>بله، کاربر را حذف کن</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
