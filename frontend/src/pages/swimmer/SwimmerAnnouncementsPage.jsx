import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Bell, Newspaper, Pin, CheckCheck, Calendar, Filter, Sparkles,
  CreditCard, Check, ArrowLeft, UserPlus, Info, ExternalLink, ShieldAlert
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { formatPersianDateEn } from '../../utils/date';

export const SwimmerAnnouncementsPage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabFromUrl === 'news'
      ? 'NEWS'
      : tabFromUrl === 'announcements'
      ? 'ANNOUNCEMENTS'
      : 'NOTIFICATIONS'
  );
  const [announcements, setAnnouncements] = useState([]);
  const [news, setNews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [annRes, newsRes, notifRes] = await Promise.allSettled([
        api.get('/content/announcements/'),
        api.get('/content/news/'),
        api.get('/content/notifications/'),
      ]);

      if (annRes.status === 'fulfilled') {
        const d = annRes.value.data;
        setAnnouncements(Array.isArray(d) ? d : d.results || []);
      }
      if (newsRes.status === 'fulfilled') {
        const d = newsRes.value.data;
        setNews(Array.isArray(d) ? d : d.results || []);
      }
      if (notifRes.status === 'fulfilled') {
        const d = notifRes.value.data;
        setNotifications(Array.isArray(d) ? d : d.results || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'NOTIFICATIONS' ? {} : { tab: tab.toLowerCase() });
  };

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.post(`/content/notifications/${id}/read/`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      toast.error('خطا در به‌روزرسانی وضعیت اعلان');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAll(true);
      await api.post('/content/notifications/read-all/');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success('تمامی اعلانات به‌عنوان خوانده‌شده علامت‌گذاری شدند.');
    } catch {
      toast.error('خطا در خواندن تمامی اعلان‌ها');
    } finally {
      setMarkingAll(false);
    }
  };

  const getCategoryMeta = (cat) => {
    switch (cat) {
      case 'PAYMENT':
        return {
          label: 'امور مالی و تخفیف',
          icon: CreditCard,
          badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          iconColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
        };
      case 'REGISTRATION':
        return {
          label: 'ثبت‌نام و مدارک',
          icon: UserPlus,
          badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border-sky-200 dark:border-sky-800',
          iconColor: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60',
        };
      case 'SCHEDULE':
        return {
          label: 'برنامه و جلسات',
          icon: Calendar,
          badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
          iconColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60',
        };
      case 'ANNOUNCEMENT':
      default:
        return {
          label: 'پیام سیستم',
          icon: Bell,
          badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          iconColor: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60',
        };
    }
  };

  if (loading) {
    return <LoadingState type="list" message="در حال دریافت اعلانات و پیام‌های شناگر..." />;
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-900/60">
              <Bell className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              پیام‌ها، اعلانات و اطلاعیه‌های آکادمی
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            پیام‌های مالی و تخفیف‌های مدیریت، اطلاعیه‌های کلاسی و اداری، تعطیلات و اخبار
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full sm:w-fit overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => handleTabChange('NOTIFICATIONS')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'NOTIFICATIONS'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>اعلانات و پیام‌های من</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500 text-white">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('ANNOUNCEMENTS')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'ANNOUNCEMENTS'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Pin className="w-4 h-4" />
            <span>اطلاعیه‌های آکادمی ({announcements.length})</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('NEWS')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'NEWS'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Newspaper className="w-4 h-4" />
            <span>اخبار ({news.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PERSONAL NOTIFICATIONS (Discounts, financial alerts, etc.) */}
      {activeTab === 'NOTIFICATIONS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-slate-500">
              تعداد کل پیام‌ها: {notifications.length} {unreadCount > 0 && `(${unreadCount} خوانده‌نشده)`}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCheck className="w-4 h-4" />
                <span>{markingAll ? 'در حال ثبت...' : 'علامت‌گذاری همه به‌عنوان خوانده‌شده'}</span>
              </button>
            )}
          </div>

          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notif) => {
                const meta = getCategoryMeta(notif.category);
                const IconComponent = meta.icon;

                return (
                  <div
                    key={notif.id}
                    className={`p-5 rounded-3xl border transition-all ${
                      !notif.is_read
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/80 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className={`p-2 rounded-xl border ${meta.iconColor} ${meta.badgeColor}`}>
                          <IconComponent className="w-4.5 h-4.5" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                              {notif.title}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border ${meta.badgeColor}`}>
                              {meta.label}
                            </span>
                            {!notif.is_read && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                                جدید
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs text-slate-400">
                        <span>{formatPersianDateEn(notif.created_at)}</span>
                      </div>
                    </div>

                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line pr-1 sm:pr-10">
                      {notif.message}
                    </p>

                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap pr-1 sm:pr-10">
                      {notif.link ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (!notif.is_read) handleMarkAsRead(notif.id);
                            navigate(notif.link);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                        >
                          <span>مشاهده در بخش شهریه و حسابداری</span>
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                      ) : <div />}

                      {!notif.is_read && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>خوانده شد</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-sm text-slate-400">
              هیچ اعلانی در صندوق پیام‌های شما موجود نیست.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACADEMY & GROUP ANNOUNCEMENTS */}
      {activeTab === 'ANNOUNCEMENTS' && (
        <div className="space-y-3.5">
          {announcements.length > 0 ? (
            announcements.map((ann) => (
              <div
                key={ann.id}
                className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                  ann.is_pinned
                    ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    {ann.is_pinned && (
                      <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400">
                        <Pin className="w-4 h-4 rotate-45" />
                      </span>
                    )}
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {ann.title}
                    </h3>
                  </div>
                  <span className="text-xs sm:text-sm text-slate-500 font-mono">
                    {new Date(ann.created_at).toLocaleDateString('fa-IR')}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed pr-1 font-normal">
                  {ann.message}
                </p>
                {ann.target_group_name && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-sky-600 dark:text-sky-400 font-bold">
                    پیام اختصاصی گروه: {ann.target_group_name}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-sm text-slate-400">
              هیچ اطلاعیه‌ای یافت نشد.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: NEWS */}
      {activeTab === 'NEWS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {news.length > 0 ? (
            news.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <Badge variant="info">{item.category_display || 'عمومی'}</Badge>
                    <span className="text-xs sm:text-sm text-slate-500 font-mono">
                      {item.publish_at?.slice(0, 10)}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed line-clamp-3 font-normal">
                    {item.summary || item.body}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-sm text-slate-400">
              هیچ خبری در وب‌سایت منتشر نشده است.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
