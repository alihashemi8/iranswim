import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Bell, Send, Pin, Users, BookOpen, Clock,
  CheckCircle2, AlertCircle, Trash2, RefreshCw,
  ShieldCheck, ArrowLeft, Check, CheckCheck, Loader2,
  MessageSquare, UserPlus, CreditCard, Calendar, Inbox,
  User, GraduationCap, Search, Filter
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
    SWIMMERS: 'فقط شناگران و اولیا',
    COACHES: 'فقط کادر مربیان',
    GROUP: 'اعضای یک کلاس مشخص',
  };

  const audienceFilterOptions = [
    { value: '', label: 'همه مخاطبان' },
    { value: 'ALL', label: 'عمومی (همه اعضا)', icon: Users },
    { value: 'SWIMMERS', label: 'شناگران', icon: User },
    { value: 'COACHES', label: 'مربیان', icon: GraduationCap },
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
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-sky-600" />
            مرکز پیام‌ها و اعلان‌های مدیریت
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            مشاهده هشدارهای سیستمی و ارسال مدارک شناگران، به همراه ارسال اطلاعیه‌های عمومی به کاربران
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="به‌روزرسانی لیست اعلان‌ها"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Button
            onClick={() => navigate('/admin/announcements/new')}
            className="gap-1.5 text-xs font-bold"
          >
            <Send className="w-4 h-4" />
            <span>ارسال اطلاعیه جدید</span>
          </Button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700 text-xs sm:text-sm gap-1">
        <button
          type="button"
          onClick={() => handleTabChange('NOTIFICATIONS')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'NOTIFICATIONS'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>اعلان‌های دریافتی مدیریت</span>
          {unreadNotifCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-rose-500 text-white font-mono">
              {unreadNotifCount} جدید
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 font-mono">({notifications.length})</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('ANNOUNCEMENTS')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'ANNOUNCEMENTS'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>اطلاعیه‌های ارسالی آموزشگاه ({announcements.length})</span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: INCOMING NOTIFICATIONS                                  */}
      {/* ============================================================= */}
      {activeTab === 'NOTIFICATIONS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              پیام‌های سیستمی و هشدارهای ارسال مدارک شناگران:
            </span>
            {unreadNotifCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllNotifsAsRead}
                disabled={markingAll}
                className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>علامت‌گذاری همه به‌عنوان خوانده‌شده</span>
              </button>
            )}
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

                return (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      notif.is_read
                        ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                        : 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/60 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div
                          className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                            isSwimmerDocAlert
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                              : notif.category === 'REGISTRATION'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                              : 'bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400'
                          }`}
                        >
                          {isSwimmerDocAlert ? (
                            <ShieldCheck className="w-5 h-5" />
                          ) : notif.category === 'REGISTRATION' ? (
                            <UserPlus className="w-5 h-5" />
                          ) : notif.category === 'PAYMENT' ? (
                            <CreditCard className="w-5 h-5" />
                          ) : (
                            <Bell className="w-5 h-5" />
                          )}
                        </div>

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                              {notif.title}
                            </h3>
                            {!notif.is_read && (
                              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                            )}
                            <span className="text-[11px] font-mono text-slate-400">
                              {formatPersianDate(notif.created_at, 'YYYY/MM/DD - HH:mm')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {notif.message}
                          </p>

                          {/* Quick Action Button for Swimmer Document Alert */}
                          {notif.link && (
                            <div className="pt-2">
                              <Link
                                to={notif.link}
                                onClick={() => !notif.is_read && handleMarkNotifAsRead(notif.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition-colors shadow-2xs"
                              >
                                <span>مشاهده جزئیات و بررسی پرونده</span>
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Read Toggle Button */}
                      {!notif.is_read && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkNotifAsRead(notif.id, e)}
                          disabled={isMarking}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-sky-600 hover:border-sky-300 dark:hover:border-sky-700 transition-colors cursor-pointer shrink-0"
                          title="علامت‌گذاری به‌عنوان خوانده‌شده"
                        >
                          {isMarking ? (
                            <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                      )}
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 p-8 text-center space-y-3">
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
            <div className="space-y-4">
              {filteredAnnouncements.map((item) => {
                const targetGroupName =
                  item.target_group &&
                  groups.find((g) => g.id === item.target_group)?.name;

                return (
                  <div
                    key={item.id}
                    className={`p-5 rounded-2xl border transition-colors shadow-xs ${
                      item.is_pinned
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 gap-2">
                      <div className="flex items-center gap-2">
                        {item.is_pinned && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">
                            <Pin className="w-3 h-3 rotate-45" />
                            مهم و پین‌شده
                          </span>
                        )}
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          {item.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
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
                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(item.created_at).toLocaleDateString('fa-IR')}
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

                    <div className="pt-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
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
