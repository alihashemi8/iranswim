import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, UserCheck, Shield, KeyRound, Clock,
  CheckCircle2, XCircle, Search, Filter, Lock, Unlock, RefreshCw
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';

export const AdminSecurityPage = () => {
  const [activeTab, setActiveTab] = useState('USERS'); // USERS, AUDIT_LOGS
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const toast = useToast();

  // Edit User Role Modal
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState('SWIMMER');
  const [updating, setUpdating] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, auditRes] = await Promise.all([
        api.get('/auth/users/'),
        api.get('/supervisor/audit-logs/'),
      ]);
      setUsers(usersRes.data.results || usersRes.data);
      setAuditLogs(auditRes.data.results || auditRes.data);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت اطلاعات امنیتی و کاربران');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Toggle User Active Status
  const handleToggleUserActive = async (user) => {
    try {
      await api.patch(`/auth/users/${user.id}/`, {
        is_active: !user.is_active,
      });
      toast.success(
        !user.is_active
          ? `دسترسی کاربر ${user.full_name || user.phone} فعال گردید.`
          : `دسترسی کاربر ${user.full_name || user.phone} غیرفعال شد.`
      );
      fetchData();
    } catch (err) {
      toast.error('خطا در تغییر وضعیت دسترسی کاربر');
    }
  };

  // Change Role Handler
  const handleChangeRole = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setUpdating(true);
      await api.patch(`/auth/users/${editingUser.id}/`, {
        role: newRole,
      });
      toast.success(`نقش کاربری با موفقیت به ${newRole} تغییر یافت.`);
      setEditingUser(null);
      fetchData();
    } catch (err) {
      toast.error('خطا در تغییر نقش کاربری');
    } finally {
      setUpdating(false);
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
    ENROLLMENT_CREATE: 'ثبت‌نام قطعی',
    PAYMENT_RECORD: 'ثبت پرداخت مالی',
    REFUND_ISSUE: 'استرداد یا تخفیف مالی',
    RECORD_VERIFY: 'تأیید رسمی رکورد شنا',
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const name = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
      const phone = (u.phone || '').toLowerCase();
      return name.includes(q) || phone.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-sky-600" />
            مدیریت کاربران، سطح دسترسی و لاگ‌های حسابرسی امنیتی
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            کنترل مجوزهای ورود، مسدودسازی حساب، تخصیص نقش‌ها و ردگیری دقیق تراکنش‌های حساس (Audit Trail)
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} className="gap-1.5 text-xs">
          <RefreshCw className="w-4 h-4 text-sky-600" />
          <span>به‌روزرسانی لاگ‌ها</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700 text-xs w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('USERS')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'USERS'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4 text-sky-600" />
          <span>حساب‌های کاربری سامانه ({users.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('AUDIT_LOGS')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'AUDIT_LOGS'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-600" />
          <span>سوابق عملیات حساس (Audit Trail - {auditLogs.length})</span>
        </button>
      </div>

      {loading ? (
        <LoadingState message="در حال دریافت داده‌های امنیتی..." />
      ) : activeTab === 'USERS' ? (
        /* TAB 1: USERS MANAGEMENT */
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جستجو با نام کاربر یا شماره همراه..."
                className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 w-full sm:w-auto"
            >
              <option value="">تمام نقش‌ها</option>
              <option value="ADMIN">مدیر آموزشگاه</option>
              <option value="COACH">مربی</option>
              <option value="SWIMMER">شناگر</option>
              <option value="SUPERVISOR">ناظر فنی سامانه</option>
            </select>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-right min-w-[650px]">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5 rounded-r-xl">کاربر</th>
                    <th className="px-4 py-3.5">شماره همراه</th>
                    <th className="px-4 py-3.5">نقش کاربری</th>
                    <th className="px-4 py-3.5">وضعیت حساب</th>
                    <th className="px-4 py-3.5">تاریخ ثبت‌نام</th>
                    <th className="px-4 py-3.5 text-center rounded-l-xl">عملیات امنیتی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center">
                            {u.first_name ? u.first_name.charAt(0) : 'U'}
                          </div>
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {u.full_name || 'بدون نام'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {u.phone}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                          {roleLabels[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={u.is_active ? 'success' : 'danger'}>
                          {u.is_active ? 'فعال و مجاز' : 'مسدودشده'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-400">
                        {new Date(u.created_at).toLocaleDateString('fa-IR')}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(u);
                              setNewRole(u.role);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 font-semibold text-xs border border-sky-200 dark:border-sky-800 transition-colors cursor-pointer"
                          >
                            تغییر نقش
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleUserActive(u)}
                            className={`px-2.5 py-1.5 rounded-xl font-semibold text-xs border transition-colors cursor-pointer flex items-center gap-1 ${
                              u.is_active
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                            }`}
                          >
                            {u.is_active ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            <span>{u.is_active ? 'مسدودسازی' : 'رفع مسدودی'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-3">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center shrink-0">
                        {u.first_name ? u.first_name.charAt(0) : 'U'}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                          {u.full_name || 'بدون نام'}
                        </h4>
                        <span className="inline-block mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {roleLabels[u.role] || u.role}
                        </span>
                      </div>
                    </div>
                    <Badge variant={u.is_active ? 'success' : 'danger'}>
                      {u.is_active ? 'فعال' : 'مسدود'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-slate-400 block text-[10px]">شماره تماس</span>
                      <a href={`tel:${u.phone}`} className="font-mono text-sky-600 dark:text-sky-400 underline decoration-sky-300">
                        {u.phone}
                      </a>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">تاریخ ثبت‌نام</span>
                      <span className="font-mono text-slate-500">
                        {new Date(u.created_at).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUser(u);
                        setNewRole(u.role);
                      }}
                      className="flex-1 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 font-semibold border border-sky-200 dark:border-sky-800 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>تغییر نقش</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleUserActive(u)}
                      className={`flex-1 py-2 rounded-xl font-semibold border transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                        u.is_active
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                      }`}
                    >
                      {u.is_active ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      <span>{u.is_active ? 'مسدودسازی' : 'رفع مسدودی'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: AUDIT TRAIL LOGS */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 rounded-r-xl">کاربر اقدام‌کننده</th>
                  <th className="px-4 py-3.5">نوع رویداد حساس</th>
                  <th className="px-4 py-3.5">موجودیت مرتبط</th>
                  <th className="px-4 py-3.5">جزئیات و مستندات عملیات</th>
                  <th className="px-4 py-3.5 text-left rounded-l-xl">زمان رخداد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-100">
                      {log.actor_name || log.actor_phone || 'سیستم'}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant="info">
                        {actionLabels[log.action] || log.action_display || log.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {log.entity_type} #{log.entity_id}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-left font-mono text-xs text-slate-400">
                      {new Date(log.timestamp).toLocaleString('fa-IR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-2.5 text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {log.actor_name || log.actor_phone || 'سیستم'}
                    </h4>
                    <span className="font-mono text-[11px] text-slate-400 block mt-0.5">
                      {log.entity_type} #{log.entity_id}
                    </span>
                  </div>
                  <Badge variant="info">
                    {actionLabels[log.action] || log.action_display || log.action}
                  </Badge>
                </div>

                {log.details && (
                  <div className="p-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 font-mono text-[11px] text-slate-600 dark:text-slate-300 break-all">
                    {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center text-slate-400 text-[11px]">
                  <span>زمان رخداد:</span>
                  <span className="font-mono">{new Date(log.timestamp).toLocaleString('fa-IR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Change User Role */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`تغییر نقش کاربری: ${editingUser?.full_name || editingUser?.phone}`}
      >
        <form onSubmit={handleChangeRole} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              انتخاب نقش دسترسی جدید در سامانه
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
            >
              <option value="SWIMMER">شناگر (دسترسی به پرتال و سهمیه خود)</option>
              <option value="COACH">مربی (ثبت حضور و غیاب، ارزیابی و رکوردها)</option>
              <option value="ADMIN">مدیر آموزشگاه (دسترسی کامل مدیریتی و مالی)</option>
              <option value="SUPERVISOR">ناظر فنی سامانه (پایش سرور و رفع باگ)</option>
            </select>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
            تغییر نقش بلافاصله در تمام اندپوینت‌های سرور اعمال شده و دسترسی‌های کاربر بازنشانی خواهد شد.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
              انصراف
            </Button>
            <Button type="submit" disabled={updating}>
              {updating ? 'در حال ثبت...' : 'تأیید و ذخیره نقش'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
