import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, UserPlus, Search, Filter, Shield, Activity,
  Award, LifeBuoy, Trash2, Edit3, KeyRound, CheckCircle2,
  XCircle, RefreshCw, Phone, Lock, Eye, EyeOff, AlertTriangle,
  Copy, Check, UserCheck
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
    label: 'مدیر آموزشگاه',
    variant: 'primary',
    bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    description: 'دسترسی کامل به پنل مدیریت، ثبت‌نام‌ها، امور مالی و آموزشی'
  },
  SUPERVISOR: {
    label: 'ناظر فنی سامانه',
    variant: 'warning',
    bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    description: 'دسترسی به پایش سرور، مدیریت کاربران، لاگ خطاها و حسابرسی'
  },
  COACH: {
    label: 'مربی آکادمی',
    variant: 'success',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    description: 'دسترسی به پیشخوان مربی، کلاس‌ها، حضور و غیاب و ارزیابی'
  },
  SWIMMER: {
    label: 'شناگر / اولیا',
    variant: 'info',
    bg: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    description: 'دسترسی به پورتال شناگر، مشاهده سوابق، دوره‌ها و وضعیت مالی'
  },
};

export const SupervisorUsersPage = () => {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Copy feedback
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

  // Fetch users
  const fetchUsers = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await api.get('/auth/users/');
      const data = res.data.results || res.data || [];
      setUsers(data);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت لیست کاربران سامانه');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered & Paginated list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter && u.role !== roleFilter) return false;
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

  // Handle Quick Toggle Active
  const handleToggleActive = async (targetUser) => {
    if (targetUser.id === currentUser?.id) {
      toast.error('نمی‌توانید وضعیت حساب کاربری خودتان را غیرفعال کنید.');
      return;
    }

    try {
      const nextState = !targetUser.is_active;
      await api.patch(`/auth/users/${targetUser.id}/`, {
        is_active: nextState,
      });
      toast.success(
        nextState
          ? `حساب کاربری ${targetUser.full_name || targetUser.phone} با موفقیت فعال شد.`
          : `حساب کاربری ${targetUser.full_name || targetUser.phone} غیرفعال گردید.`
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, is_active: nextState } : u))
      );
    } catch (err) {
      console.error(err);
      toast.error('خطا در تغییر وضعیت کاربر');
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
      toast.error('لطفاً شماره همراه، نام و نام‌خانوادگی را وارد فرمایید.');
      return;
    }

    const cleanedPhone = addForm.phone.trim();
    if (!cleanedPhone.startsWith('09') || cleanedPhone.length !== 11) {
      toast.error('شماره تلفن همراه باید ۱۱ رقمی بوده و با ۰۹ شروع شود.');
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
      toast.success(`کاربر ${res.data.full_name || res.data.phone} با نقش ${ROLE_DEFINITIONS[res.data.role]?.label || res.data.role} با موفقیت افزوده شد.`);
      setIsAddModalOpen(false);
      fetchUsers();
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
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? res.data : u)));
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
      toast.success(`کلمه عبور جدید برای کاربر ${selectedUser.full_name || selectedUser.phone} با موفقیت ثبت شد.`);
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
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    toast.success('شماره همراه کپی شد.');
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  // Summary counts
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === 'ADMIN').length;
    const supervisors = users.filter((u) => u.role === 'SUPERVISOR').length;
    const coaches = users.filter((u) => u.role === 'COACH').length;
    const swimmers = users.filter((u) => u.role === 'SWIMMER').length;
    const active = users.filter((u) => u.is_active).length;
    return { total, admins, supervisors, coaches, swimmers, active };
  }, [users]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                مدیریت کاربران و دسترسی‌ها
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                افزودن کاربر با هر شماره همراه، تغییر نقش، تعیین کلمه عبور و مدیریت مستقیم بدون نیاز به پنل جنگو
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchUsers(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            title="به‌روزرسانی جدول"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-sky-600' : ''}`} />
            <span>به‌روزرسانی</span>
          </button>

          <Button
            variant="primary"
            onClick={handleOpenAddModal}
            className="gap-2 text-xs py-2.5 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>افزودن کاربر جدید</span>
          </Button>
        </div>
      </div>

      {/* Role Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>کل کاربران</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-800 dark:text-white font-mono">
            {stats.total}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            {stats.active} فعال
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-blue-200/60 dark:border-blue-900/40 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 text-xs font-medium">
            <span>مدیران آموزشگاه</span>
            <Shield className="w-4 h-4" />
          </div>
          <div className="mt-2 text-xl font-bold text-blue-700 dark:text-blue-300 font-mono">
            {stats.admins}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            دسترسی کامل
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200/60 dark:border-amber-900/40 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-medium">
            <span>ناظران فنی</span>
            <Activity className="w-4 h-4" />
          </div>
          <div className="mt-2 text-xl font-bold text-amber-700 dark:text-amber-300 font-mono">
            {stats.supervisors}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            زیرساخت و لاگ‌ها
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-medium">
            <span>مربیان آکادمی</span>
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="mt-2 text-xl font-bold text-emerald-700 dark:text-emerald-300 font-mono">
            {stats.coaches}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            کلاس و حضورغیاب
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-cyan-200/60 dark:border-cyan-900/40 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-cyan-600 dark:text-cyan-400 text-xs font-medium">
            <span>شناگران / اولیا</span>
            <LifeBuoy className="w-4 h-4" />
          </div>
          <div className="mt-2 text-xl font-bold text-cyan-700 dark:text-cyan-300 font-mono">
            {stats.swimmers}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            پورتال آموزشی
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-200/60 dark:border-rose-900/40 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-xs font-medium">
            <span>غیرفعال / مسدود</span>
            <XCircle className="w-4 h-4" />
          </div>
          <div className="mt-2 text-xl font-bold text-rose-700 dark:text-rose-300 font-mono">
            {stats.total - stats.active}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            فاقد اجازه ورود
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 transition-colors">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="جستجو با نام، نام خانوادگی، شماره تماس یا کد ملی..."
            className="w-full pl-3 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
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
              <option value="ADMIN">مدیر آموزشگاه ({stats.admins})</option>
              <option value="SUPERVISOR">ناظر فنی سامانه ({stats.supervisors})</option>
              <option value="COACH">مربی آکادمی ({stats.coaches})</option>
              <option value="SWIMMER">شناگر / اولیا ({stats.swimmers})</option>
            </select>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="active">فقط فعال‌ها</option>
              <option value="inactive">فقط غیرفعال‌ها</option>
            </select>
          </div>

          {(searchTerm || roleFilter || statusFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('');
                setStatusFilter('');
                setCurrentPage(1);
              }}
              className="px-2.5 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              پاک‌سازی فیلتر
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        {loading ? (
          <div className="py-12">
            <LoadingState message="در حال دریافت لیست کاربران سامانه..." />
          </div>
        ) : filteredUsers.length === 0 ? (
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
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="px-5 py-3.5">کاربر و نام</th>
                  <th className="px-4 py-3.5">شماره همراه (نام کاربری)</th>
                  <th className="px-4 py-3.5">کد ملی</th>
                  <th className="px-4 py-3.5">نقش کاربری</th>
                  <th className="px-4 py-3.5 text-center">وضعیت دسترسی</th>
                  <th className="px-4 py-3.5">تاریخ عضویت</th>
                  <th className="px-5 py-3.5 text-center">عملیات مدیریت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {paginatedUsers.map((u) => {
                  const roleDef = ROLE_DEFINITIONS[u.role] || ROLE_DEFINITIONS.SWIMMER;
                  const isCurrent = u.id === currentUser?.id;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & Avatar */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                            {u.first_name ? u.first_name.charAt(0) : 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                              <span>{u.full_name || 'کاربر بدون نام'}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 px-1.5 py-0.5 rounded-md font-medium">
                                  شما
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                              ID: #{u.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3.5 font-mono text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span>{u.phone}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyPhone(u.phone)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
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

                      {/* National ID */}
                      <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400">
                        {u.national_id || '—'}
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${roleDef.bg}`}
                          title={roleDef.description}
                        >
                          {u.role === 'ADMIN' && <Shield className="w-3 h-3 shrink-0" />}
                          {u.role === 'SUPERVISOR' && <Activity className="w-3 h-3 shrink-0" />}
                          {u.role === 'COACH' && <Award className="w-3 h-3 shrink-0" />}
                          {u.role === 'SWIMMER' && <LifeBuoy className="w-3 h-3 shrink-0" />}
                          <span>{roleDef.label}</span>
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(u)}
                          disabled={isCurrent}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                            u.is_active
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100'
                          } ${isCurrent ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                          title={isCurrent ? 'امکان تغییر وضعیت حساب جاری وجود ندارد' : 'کلیک برای تغییر وضعیت'}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span>{u.is_active ? 'فعال' : 'غیرفعال'}</span>
                        </button>
                      </td>

                      {/* Created At */}
                      <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                        {formatPersianDate(u.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit Details */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors"
                            title="ویرایش مشخصات و نقش"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Reset Password */}
                          <button
                            type="button"
                            onClick={() => handleOpenPasswordModal(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors"
                            title="تغییر یا بازنشانی کلمه عبور"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(u)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isCurrent
                                ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                                : 'text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                            }`}
                            title={isCurrent ? 'نمی‌توانید حساب جاری را حذف کنید' : 'حذف کاربر'}
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
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: ADD USER                                                     */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="افزودن کاربر جدید به سامانه"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl text-xs text-sky-800 dark:text-sky-300">
            با افزودن کاربر جدید، می‌توانید بلافاصله نقش وی را به <strong>مدیر آموزشگاه</strong> یا <strong>ناظر فنی</strong> ارتقا داده و رمز عبور مستقیم تعیین فرمایید.
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
                کد ملی
              </label>
              <input
                type="text"
                dir="ltr"
                maxLength={10}
                placeholder="0012345678"
                value={addForm.national_id}
                onChange={(e) => setAddForm({ ...addForm, national_id: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                نام <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثلاً علی"
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
                placeholder="مثلاً محمدی"
                value={addForm.last_name}
                onChange={(e) => setAddForm({ ...addForm, last_name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
              نقش کاربری در سامانه <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.entries(ROLE_DEFINITIONS).map(([key, def]) => {
                const isSelected = addForm.role === key;
                return (
                  <div
                    key={key}
                    onClick={() => setAddForm({ ...addForm, role: key })}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/50 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-100">
                        {def.label}
                      </span>
                      <span className={`w-3 h-3 rounded-full border-2 ${
                        isSelected ? 'border-sky-600 bg-sky-600' : 'border-slate-300 dark:border-slate-600'
                      }`} />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {def.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                کلمه عبور ورود به سامانه
              </label>
              <button
                type="button"
                onClick={() => handleGenerateRandomPassword('add')}
                className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-medium"
              >
                تولید رمز تصادفی مطمئن
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type={showAddPassword ? 'text' : 'password'}
                dir="ltr"
                placeholder="اختیاری (در صورت خالی بودن، کد ملی یا پیش‌فرض تنظیم می‌شود)"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowAddPassword(!showAddPassword)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute left-2.5 top-1/2 -translate-y-1/2"
              >
                {showAddPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {addForm.password && (
              <PasswordRequirementsList password={addForm.password} showAlways={true} className="mt-2" />
            )}
          </div>

          {/* Active status */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="add_is_active"
              checked={addForm.is_active}
              onChange={(e) => setAddForm({ ...addForm, is_active: e.target.checked })}
              className="w-4 h-4 text-sky-600 rounded-md border-slate-300 dark:border-slate-600 focus:ring-sky-500"
            />
            <label htmlFor="add_is_active" className="text-xs text-slate-700 dark:text-slate-300 select-none cursor-pointer">
              حساب کاربری از ابتدا <strong>فعال</strong> باشد و کاربر بتواند وارد شود.
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={addingUser}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={addingUser}
              className="gap-2"
            >
              {addingUser ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>در حال ذخیره...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>ثبت و ایجاد کاربر</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 2: EDIT USER                                                    */}
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                نام
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
                نام خانوادگی
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
                شماره تلفن همراه
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
                کد ملی
              </label>
              <input
                type="text"
                dir="ltr"
                value={editForm.national_id}
                onChange={(e) => setEditForm({ ...editForm, national_id: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              نقش و سطح دسترسی کاربر
            </label>
            <select
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer"
            >
              <option value="ADMIN">مدیر آموزشگاه (ADMIN) - دسترسی کامل</option>
              <option value="SUPERVISOR">ناظر فنی سامانه (SUPERVISOR) - پایش و مانیتورینگ</option>
              <option value="COACH">مربی آکادمی (COACH)</option>
              <option value="SWIMMER">شناگر / اولیا (SWIMMER)</option>
            </select>
          </div>

          {/* Active status */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="edit_is_active"
              checked={editForm.is_active}
              onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
              className="w-4 h-4 text-sky-600 rounded-md border-slate-300 dark:border-slate-600 focus:ring-sky-500"
            />
            <label htmlFor="edit_is_active" className="text-xs text-slate-700 dark:text-slate-300 select-none cursor-pointer">
              وضعیت حساب کاربری فعال باشد.
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={updatingUser}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={updatingUser}
              className="gap-2"
            >
              {updatingUser ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>در حال ذخیره...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ذخیره تغییرات</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 3: CHANGE PASSWORD                                              */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title={`تغییر یا بازنشانی کلمه عبور: ${selectedUser?.full_name || selectedUser?.phone}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
            شما به عنوان ناظر فنی می‌توانید مستقیماً و بدون نیاز به داشتن رمز قبلی، کلمه عبور جدیدی برای این کاربر ثبت نمایید.
          </div>

          <PasswordRequirementsList password={passwordForm.newPassword} showAlways={true} />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                کلمه عبور جدید <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => handleGenerateRandomPassword('reset')}
                className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-medium"
              >
                تولید رمز تصادفی
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                dir="ltr"
                placeholder="کلمه عبور جدید"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute left-2.5 top-1/2 -translate-y-1/2"
              >
                {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              تکرار کلمه عبور جدید <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                dir="ltr"
                placeholder="تکرار رمز عبور جدید"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full px-9 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPasswordModalOpen(false)}
              disabled={savingPassword}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={savingPassword}
              className="gap-2"
            >
              {savingPassword ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>در حال ذخیره...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>ثبت رمز جدید</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 4: DELETE CONFIRMATION                                          */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="تأییدیه حذف کاربر از سیستم"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-200 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div className="leading-relaxed">
              <strong>هشدار امنیتی:</strong> آیا از حذف کامل کاربر{' '}
              <strong>{selectedUser?.full_name || selectedUser?.phone}</strong> مطمئن هستید؟ این عملیات غیرقابل بازگشت است.
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-2 text-slate-600 dark:text-slate-300">
            <div className="flex justify-between">
              <span>شماره تلفن:</span>
              <span className="font-mono font-bold">{selectedUser?.phone}</span>
            </div>
            <div className="flex justify-between">
              <span>کد ملی:</span>
              <span className="font-mono">{selectedUser?.national_id || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span>نقش:</span>
              <span>{ROLE_DEFINITIONS[selectedUser?.role]?.label || selectedUser?.role}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deletingUser}
            >
              انصراف
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteUser}
              disabled={deletingUser}
              className="gap-2 bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deletingUser ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>در حال حذف...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف قطعی کاربر</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
