import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Bell, Send, Pin, Users, BookOpen, Clock,
  CheckCircle2, AlertCircle, Trash2, RefreshCw,
  ShieldCheck, ArrowLeft, Check, CheckCheck, Loader2,
  MessageSquare, UserPlus, CreditCard, Calendar, Inbox,
  User, GraduationCap, Search, Filter, Smartphone
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { CustomSelect } from '../../components/common/CustomSelect';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { formatPersianDate } from '../../utils/date';

export const AdminAnnouncementsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(
    tabFromUrl === 'announcements' ? 'ANNOUNCEMENTS' : 'NOTIFICATIONS'
  );
  const [announcements, setAnnouncements] = useState([]);
  const [groups, setGroups] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingIds, setMarkingIds] = useState(new Set());

  // Filtering states for Announcements tab
  const [audienceFilter, setAudienceFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const toast = useToast();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'ANNOUNCEMENTS') {
      setSearchParams({ tab: 'announcements' });
    } else {
      setSearchParams({});
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [annRes, grpRes, notifRes] = await Promise.allSettled([
        api.get('/content/announcements/'),
        api.get('/education/groups/'),
        api.get('/content/notifications/'),
      ]);

      if (annRes.status === 'fulfilled') {
        const d = annRes.value.data;
        const list = Array.isArray(d) ? d : d.results || [];
        setAnnouncements(list);
      } else {
        console.error('Error fetching announcements:', annRes.reason);
      }

      if (grpRes.status === 'fulfilled') {
        const d = grpRes.value.data;
        const grpList = Array.isArray(d) ? d : d.results || [];
        setGroups(grpList);
      }

      if (notifRes.status === 'fulfilled') {
        const nd = notifRes.value.data;
        const nList = nd.results || nd || [];
        setNotifications(nList);
        setUnreadNotifCount(
          typeof nd.unread_count === 'number'
            ? nd.unread_count
            : nList.filter((n) => !n.is_read).length
        );
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('خطا در برقراری ارتباط با سامانه اعلانات');
      toast.error('خطا در برقراری ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkNotifAsRead = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      setMarkingIds((prev) => new Set([...prev, notifId]));
      await api.post(`/content/notifications/${notifId}/read/`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
      );
      setUnreadNotifCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
      toast.error('خطا در ثبت خوانده شدن اعلان');
    } finally {
      setMarkingIds((prev) => {
        const next = new Set(prev);
        next.delete(notifId);
        return next;
      });
    }
  };

  const handleMarkAllNotifsAsRead = async () => {
    try {
      setMarkingAll(true);
      await api.post('/content/notifications/read-all/');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadNotifCount(0);
      toast.success('تمامی اعلان‌ها به‌عنوان خوانده‌شده ثبت شدند.');
    } catch (err) {
      console.error(err);
      toast.error('خطا در خواندن تمامی اعلان‌ها');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('آیا از حذف این پیام اعلان مطمئن هستید؟')) return;
    try {
      setDeletingId(id);
      await api.delete(`/content/announcements/${id}/`);
      setAnnouncements((prev) => prev.filter((item) => item.id !== id));
      toast.success('پیام اعلان با موفقیت حذف گردید.');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('خطا در حذف پیام اعلان');
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePin = async (item) => {
    try {
      const nextState = !item.is_pinned;
      await api.patch(`/content/announcements/${item.id}/`, {
        is_pinned: nextState,
      });
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, is_pinned: nextState } : a))
      );
      toast.success(nextState ? 'پیام اعلان پین شد.' : 'اعلان از حالت پین خارج گردید.');
    } catch (err) {
      console.error('Pin toggle error:', err);
      toast.error('خطا در تغییر وضعیت پین اعلان');
    }
  };

  const audienceLabels = {
    ALL: 'همه اعضای آموزشگاه (عمومی)',
    SWIMMERS: 'کلیه شناگران',
    SWIMMERS_MALE: 'شناگران پسر',
    SWIMMERS_FEMALE: 'شناگران دختر',
    COACHES: 'کلیه مربیان',
    COACHES_MALE: 'مربیان آقا',
    COACHES_FEMALE: 'مربیان خانم',
    GROUP: 'اعضای یک کلاس مشخص',
  };

  const audienceFilterOptions = [
    { value: '', label: 'همه مخاطبان' },
    { value: 'ALL', label: 'عمومی (همه اعضا)', icon: Users },
    { value: 'SWIMMERS', label: 'کلیه شناگران', icon: User },
    { value: 'SWIMMERS_MALE', label: 'شناگران پسر', icon: User },
    { value: 'SWIMMERS_FEMALE', label: 'شناگران دختر', icon: User },
    { value: 'COACHES', label: 'کلیه مربیان', icon: GraduationCap },
    { value: 'COACHES_MALE', label: 'مربیان آقا', icon: GraduationCap },
    { value: 'COACHES_FEMALE', label: 'مربیان خانم', icon: GraduationCap },
    { value: 'GROUP', label: 'کلاس‌های خاص', icon: BookOpen },
  ];

  // Filtered Announcements
  const filteredAnnouncements = announcements.filter((item) => {
    const matchesAudience = !audienceFilter || item.audience === audienceFilter;
    const matchesQuery =
      !searchQuery.trim() ||
      item.title?.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      item.message?.toLowerCase().includes(searchQuery.trim().toLowerCase());
    return matchesAudience && matchesQuery;
  });

  return (
    <div className="space-y-4 sm:space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 transition-colors">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-sky-600 shrink-0" />
            <span>مرکز پیام‌ها و اعلان‌های مدیریت</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            مشاهده هشدارهای سیستمی و ارسال مدارک شناگران، به همراه ارسال اطلاعیه‌های عمومی
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="به‌روزرسانی لیست اعلان‌ها"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Button
            onClick={() => navigate('/admin/announcements/new')}
            className="flex-1 sm:flex-none justify-center gap-1.5 text-xs font-bold"
          >
            <Send className="w-4 h-4" />
            <span>ارسال اطلاعیه جدید</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        {/* Responsive Segmented Tabs: 2-column grid on mobile, inline-flex on desktop */}
        <div className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 sm:p-1.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 shadow-2xs gap-1">
          <button
            type="button"
            onClick={() => handleTabChange('NOTIFICATIONS')}
            className={`py-2 px-2 sm:px-5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 ${
              activeTab === 'NOTIFICATIONS'
                ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-xs border border-slate-200/60 dark:border-slate-700/80'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/40'
            }`}
          >
            <Inbox className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="sm:hidden">اعلان‌ها</span>
            <span className="hidden sm:inline">اعلان‌های دریافتی مدیریت</span>
            {unreadNotifCount > 0 ? (
              <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-rose-500 text-white shadow-2xs animate-pulse shrink-0">
                {unreadNotifCount} <span className="hidden xs:inline sm:inline">جدید</span>
              </span>
            ) : (
              <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-mono shrink-0">
                {notifications.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('ANNOUNCEMENTS')}
            className={`py-2 px-2 sm:px-5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 ${
              activeTab === 'ANNOUNCEMENTS'
                ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-xs border border-slate-200/60 dark:border-slate-700/80'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/40'
            }`}
          >
            <Bell className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="sm:hidden">اطلاعیه‌ها</span>
            <span className="hidden sm:inline">اطلاعیه‌های ارسالی آموزشگاه</span>
            <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-mono shrink-0">
              {announcements.length}
            </span>
          </button>
        </div>

        {/* Mark all as read button */}
        {activeTab === 'NOTIFICATIONS' && unreadNotifCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllNotifsAsRead}
            disabled={markingAll}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800/80 transition-colors cursor-pointer"
          >
            {markingAll ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
            ) : (
              <CheckCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            )}
            <span>علامت‌گذاری همه به‌عنوان خوانده‌شده</span>
          </button>
        )}
      </div>

      {/* ============================================================= */}
      {/* TAB 1: INCOMING NOTIFICATIONS                                  */}
      {/* ============================================================= */}
      {activeTab === 'NOTIFICATIONS' && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="font-bold text-slate-600 dark:text-slate-300 truncate">
              هشدارهای سیستمی و مدارک شناگران:
            </span>
            <span className="text-slate-400 font-mono shrink-0 mr-2">
              {unreadNotifCount > 0 ? `${unreadNotifCount} پیام خوانده‌نشده` : 'همه خوانده‌شده'}
            </span>
          </div>

          {loading ? (
            <LoadingState type="list" count={4} message="در حال دریافت اعلان‌های مدیریت..." />
          ) : notifications.length === 0 ? (
            <EmptyState
              title="هیچ اعلانی دریافت نشده است"
              description="هنگامی که شناگران مدارک خود را ارسال یا به‌روزرسانی کنند، اعلان آن در این بخش همراه با دکمه بررسی مدارک نمایش داده خواهد شد."
            />
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => {
                const isSwimmerDocAlert =
                  notif.category === 'SWIMMER_DOCUMENT_UPLOAD' ||
                  notif.title?.includes('مدارک') ||
                  notif.message?.includes('مدارک');

                const isMarking = markingIds.has(notif.id);

                // Category Badge & Theme
                let catBadge = {
                  label: 'سیستمی',
                  color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
                };
                let catIcon = <Bell className="w-4 h-4 sm:w-5 sm:h-5" />;
                let iconBg = 'bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400';
                let actionLabel = 'مشاهده جزئیات';

                if (isSwimmerDocAlert) {
                  catBadge = {
                    label: 'مدارک شناگر',
                    color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                  };
                  catIcon = <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />;
                  iconBg = 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400';
                  actionLabel = 'بررسی مدارک شناگر';
                } else if (notif.category === 'REGISTRATION') {
                  catBadge = {
                    label: 'ثبت‌نام',
                    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                  };
                  catIcon = <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />;
                  iconBg = 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400';
                  actionLabel = 'مشاهده پرونده شناگر';
                } else if (
                  notif.category === 'PAYMENT' ||
                  notif.title?.includes('شهریه') ||
                  notif.message?.includes('شهریه') ||
                  notif.title?.includes('اقساط')
                ) {
                  catBadge = {
                    label: 'امور مالی و شهریه',
                    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
                  };
                  catIcon = <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />;
                  iconBg = 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400';
                  actionLabel = 'مشاهده امور مالی و اقساط';
                } else if (
                  notif.category === 'SCHEDULE' ||
                  notif.title?.includes('سانس') ||
                  notif.title?.includes('استخر')
                ) {
                  catBadge = {
                    label: 'برنامه و سانس استخر',
                    color: 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border-teal-200 dark:border-teal-800',
                  };
                  catIcon = <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />;
                  iconBg = 'bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400';
                  actionLabel = 'مشاهده برنامه سانس‌ها';
                } else if (
                  notif.category === 'ANNOUNCEMENT' ||
                  notif.title?.includes('مربی') ||
                  notif.title?.includes('اعلان')
                ) {
                  catBadge = {
                    label: 'اعلان کلاس مربی',
                    color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800',
                  };
                  catIcon = <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />;
                  iconBg = 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400';
                  actionLabel = 'مشاهده در اعلانات و کلاس';
                }

                return (
                  <div
                    key={notif.id}
                    className={`p-3.5 sm:p-5 rounded-2xl border transition-all ${
                      notif.is_read
                        ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                        : 'bg-gradient-to-r from-sky-50/70 via-white to-white dark:from-sky-950/30 dark:via-slate-900 dark:to-slate-900 border-sky-300 dark:border-sky-800/80 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3 sm:gap-3.5">
                      {/* Category Icon */}
                      <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 mt-0.5 ${iconBg}`}>
                        {catIcon}
                      </div>

                      {/* Content Container */}
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Row 1: Badges & Top Meta */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md border ${catBadge.color}`}>
                              {catBadge.label}
                            </span>
                            {!notif.is_read && (
                              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/60 px-1.5 py-0.5 rounded-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                                جدید
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <span className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {formatPersianDate(notif.created_at, 'MM/DD - HH:mm')}
                            </span>

                            {/* Mark read toggle button */}
                            {!notif.is_read ? (
                              <button
                                type="button"
                                onClick={(e) => handleMarkNotifAsRead(notif.id, e)}
                                disabled={isMarking}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 hover:text-sky-700 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                                title="علامت‌گذاری به‌عنوان خوانده‌شده"
                              >
                                {isMarking ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-slate-500" />
                                )}
                                <span className="hidden sm:inline">خوانده شد</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-0.5">
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="hidden sm:inline">خوانده‌شده</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Row 2: Title */}
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                          {notif.title}
                        </h3>

                        {/* Row 3: Message Body */}
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {notif.message}
                        </p>

                        {/* Row 4: Action Button (Responsive full-width on mobile) */}
                        {notif.link && (
                          <div className="pt-1">
                            <Link
                              to={notif.link}
                              onClick={() => !notif.is_read && handleMarkNotifAsRead(notif.id)}
                              className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition-colors shadow-2xs text-center"
                            >
                              <span>{actionLabel}</span>
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: BROADCAST ANNOUNCEMENTS                                */}
      {/* ============================================================= */}
      {activeTab === 'ANNOUNCEMENTS' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در عنوان یا متن اطلاعیه‌ها..."
                className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-900 dark:text-white"
              />
            </div>

            <div className="w-full sm:w-60">
              <CustomSelect
                value={audienceFilter}
                onChange={(val) => setAudienceFilter(val)}
                options={audienceFilterOptions}
                size="sm"
                placeholder="فیلتر بر اساس مخاطب..."
              />
            </div>
          </div>

          {loading ? (
            <LoadingState type="list" count={4} message="در حال دریافت اطلاعیه‌های ارسالی..." />
          ) : error ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 p-6 sm:p-8 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400">{error}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                ارتباط با سرور جهت دریافت فهرست اعلان‌ها برقرار نشد.
              </p>
              <Button onClick={fetchData} variant="outline" className="gap-1.5 text-xs">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تلاش مجدد</span>
              </Button>
            </div>
          ) : announcements.length === 0 ? (
            <EmptyState
              title="اطلاعیه‌ای ثبت نشده است"
              description="می‌توانید برای مخاطبان هدف اعم از تمام کاربران، شناگران، مربیان یا یک کلاس آموزشی پیام اطلاع‌رسانی ارسال کنید."
              action={
                <Button
                  onClick={() => navigate('/admin/announcements/new')}
                  className="gap-1.5 text-xs font-bold"
                >
                  <Send className="w-4 h-4" />
                  <span>ارسال اولین اطلاعیه</span>
                </Button>
              }
            />
          ) : filteredAnnouncements.length === 0 ? (
            <EmptyState
              title="نتیجه‌ای مطابق با فیلتر یافت نشد"
              description="لطفاً عبارت جستجو یا فیلتر دسته‌بندی مخاطبان را تغییر دهید."
            />
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredAnnouncements.map((item) => {
                const targetGroupName =
                  item.target_group &&
                  groups.find((g) => g.id === item.target_group)?.name;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 sm:p-5 rounded-2xl border transition-colors shadow-xs ${
                      item.is_pinned
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                      {/* Row 1: Badges & Actions */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            variant={
                              item.audience === 'ALL'
                                ? 'info'
                                : item.audience === 'GROUP'
                                ? 'warning'
                                : 'neutral'
                            }
                          >
                            {targetGroupName
                              ? `گروه: ${targetGroupName}`
                              : audienceLabels[item.audience] || item.audience}
                          </Badge>
                          {item.created_by_name && (
                            <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                              <User className="w-3 h-3 text-emerald-600" />
                              {item.created_by_role === 'COACH' ? `مربی: ${item.created_by_name}` : item.created_by_name}
                            </span>
                          )}
                          {item.is_pinned && (
                            <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">
                              <Pin className="w-3 h-3 rotate-45" />
                              پین‌شده
                            </span>
                          )}
                          {item.send_sms && (
                            <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/60 px-2 py-0.5 rounded-md">
                              <Smartphone className="w-3 h-3" />
                              پیامک
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatPersianDate(item.created_at, 'YYYY/MM/DD')}
                          </span>
                          {/* Pin toggle button */}
                          <button
                            type="button"
                            onClick={() => handleTogglePin(item)}
                            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                              item.is_pinned
                                ? 'text-amber-600 border-amber-200 dark:border-amber-800 hover:bg-amber-100/50'
                                : 'text-slate-400 border-slate-200 dark:border-slate-700 hover:text-amber-600'
                            }`}
                            title={item.is_pinned ? 'حذف پین' : 'پین کردن اعلان'}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-800 transition-colors cursor-pointer disabled:opacity-50"
                            title="حذف اعلان"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Row 2: Title */}
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                        {item.title}
                      </h3>
                    </div>

                    <div className="pt-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {item.message}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
