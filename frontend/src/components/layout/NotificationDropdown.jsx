import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Check, CheckCheck, UserPlus, CreditCard,
  Calendar, Pin, AlertCircle, RefreshCw, Loader2, ArrowLeft, LogIn
} from 'lucide-react';
import api from '../../api/client';
import { formatPersianDate } from '../../utils/date';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const NotificationDropdown = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingIds, setMarkingIds] = useState(new Set());

  const containerRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();

  const fetchNotifications = async (isManual = false) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
      return;
    }

    try {
      if (isManual) setLoading(true);
      setError(null);
      const res = await api.get('/content/notifications/');
      const results = res.data.results || [];
      const count = typeof res.data.unread_count === 'number'
        ? res.data.unread_count
        : results.filter((n) => !n.is_read).length;

      setNotifications(results);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      if (err.response?.status === 401) {
        setError('نشست کاربری شما منقضی شده است. لطفاً مجدداً وارد سامانه شوید.');
      } else {
        setError('خطا در دریافت اعلان‌ها از سرور');
      }
      if (isManual) {
        toast.error('خطا در برقراری ارتباط جهت دریافت اعلان‌ها');
      }
    } finally {
      if (isManual) setLoading(false);
    }
  };

  // Initial load and whenever the authenticated user changes
  useEffect(() => {
    if (user) {
      fetchNotifications(false);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
    }
  }, [user]);

  // Fetch when opening if empty or refreshed
  const toggleOpen = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchNotifications(false);
    }
  };

  // Close on Escape or click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Mark single notification as read
  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    if (markingIds.has(id)) return;

    setMarkingIds((prev) => new Set(prev).add(id));
    try {
      await api.post(`/content/notifications/${id}/read/`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      toast.error('خطا در به‌روزرسانی وضعیت اعلان');
    } finally {
      setMarkingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || markingAll) return;

    setMarkingAll(true);
    try {
      await api.post('/content/notifications/read-all/');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('تمامی اعلان‌ها به‌عنوان خوانده‌شده علامت‌گذاری شدند.');
    } catch {
      toast.error('خطا در خواندن تمامی اعلان‌ها');
    } finally {
      setMarkingAll(false);
    }
  };

  // Click on notification item
  const handleItemClick = async (notif) => {
    if (!notif.is_read) {
      await handleMarkAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.link) {
      // Role-safe navigation: If link points to admin and user is not admin, redirect to user dashboard
      if (notif.link.startsWith('/admin') && user?.role !== 'ADMIN' && !user?.is_superuser) {
        if (user?.role === 'COACH') navigate('/coach');
        else if (user?.role === 'SWIMMER') navigate('/swimmer');
        else navigate('/');
      } else {
        navigate(notif.link);
      }
    }
  };

  const getCategoryMeta = (cat) => {
    switch (cat) {
      case 'REGISTRATION':
        return {
          icon: UserPlus,
          color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800',
        };
      case 'PAYMENT':
        return {
          icon: CreditCard,
          color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
        };
      case 'SCHEDULE':
        return {
          icon: Calendar,
          color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800',
        };
      case 'ANNOUNCEMENT':
      default:
        return {
          icon: Pin,
          color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800',
        };
    }
  };

  return (
    <div className="relative inline-block" ref={containerRef} dir="rtl">
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={toggleOpen}
        className="relative p-2 text-slate-500 dark:text-slate-300 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200/80 dark:border-slate-700/80 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-sky-500/40"
        title="اعلان‌ها"
        aria-label="مشاهده اعلان‌ها"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />

        {/* Unread Badge (hidden when count === 0) */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -left-1.5 min-w-4.5 h-4.5 px-1 flex items-center justify-center text-[10px] font-bold font-mono text-white bg-rose-500 rounded-full shadow-xs ring-2 ring-white dark:ring-slate-900 animate-fade-in">
            {unreadCount > 99 ? '99+' : unreadCount.toLocaleString('fa-IR')}
          </span>
        )}
      </button>

      {/* Popover Panel */}
      {isOpen && (
        <>
          {/* Mobile Backdrop overlay */}
          <div
            className="fixed inset-0 z-40 sm:hidden bg-slate-950/30 backdrop-blur-2xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div
            role="dialog"
            aria-label="جعبه اعلان‌ها"
            className="fixed sm:absolute top-16 sm:top-full mt-2 left-3 right-3 sm:left-0 sm:right-auto sm:w-96 max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl z-50 flex flex-col max-h-[calc(100vh-6rem)] sm:max-h-[30rem] overflow-hidden animate-fade-in"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  اعلان‌ها
                </span>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300">
                    {unreadCount.toLocaleString('fa-IR')} جدید
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    disabled={markingAll}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-sky-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer disabled:opacity-50"
                    title="علامت‌گذاری همه به‌عنوان خوانده‌شده"
                  >
                    {markingAll ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCheck className="w-3.5 h-3.5 text-sky-600" />
                    )}
                    <span>خواندن همه</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fetchNotifications(true)}
                  disabled={loading}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="به‌روزرسانی اعلان‌ها"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading && notifications.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
                  <span className="text-xs">در حال بارگذاری اعلان‌ها...</span>
                </div>
              ) : error ? (
                <div className="py-10 px-4 text-center space-y-3">
                  <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                    {error}
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fetchNotifications(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>تلاش مجدد</span>
                    </button>
                    {error.includes('منقضی') && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          navigate('/login');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/50 rounded-xl transition-colors cursor-pointer"
                      >
                        <LogIn className="w-3 h-3" />
                        <span>ورود به سامانه</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-slate-400 flex items-center justify-center mx-auto">
                    <Bell className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    اعلانی برای نمایش وجود ندارد
                  </p>
                  <p className="text-[11px] text-slate-400">
                    رویدادها و گزارش‌های جدید آموزشگاه در اینجا نمایش داده خواهند شد.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const meta = getCategoryMeta(notif.category);
                  const Icon = meta.icon;
                  const isMarking = markingIds.has(notif.id);

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleItemClick(notif)}
                      className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 relative group ${
                        !notif.is_read
                          ? 'bg-sky-50/50 dark:bg-sky-950/30 hover:bg-sky-100/60 dark:hover:bg-sky-950/60 border-r-3 border-sky-600'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Category Icon */}
                      <div
                        className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border shadow-2xs ${meta.color}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-xs leading-snug line-clamp-1 ${
                              !notif.is_read
                                ? 'font-bold text-slate-900 dark:text-white'
                                : 'font-medium text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {notif.title}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                            {formatPersianDate(notif.created_at)}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                          {notif.message}
                        </p>

                        {notif.link && (
                          <div className="pt-1 flex items-center gap-1 text-[11px] text-sky-600 dark:text-sky-400 font-semibold group-hover:underline">
                            <span>مشاهده جزئیات</span>
                            <ArrowLeft className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      {/* Mark Read Action Button */}
                      {!notif.is_read && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          disabled={isMarking}
                          className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors"
                          title="علامت‌گذاری به‌عنوان خوانده‌شده"
                          aria-label="علامت‌گذاری به‌عنوان خوانده‌شده"
                        >
                          {isMarking ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Panel Footer */}
            <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 text-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (user?.role === 'ADMIN' || user?.is_superuser) {
                    navigate('/admin/announcements');
                  } else if (user?.role === 'COACH') {
                    navigate('/coach');
                  } else {
                    navigate('/swimmer');
                  }
                }}
                className="w-full py-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 rounded-xl transition-colors cursor-pointer"
              >
                مشاهده همه پیام‌ها و اطلاعیه‌ها ←
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};