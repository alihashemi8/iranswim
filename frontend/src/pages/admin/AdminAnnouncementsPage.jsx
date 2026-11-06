import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, Send, Pin, Users, BookOpen, Clock,
  CheckCircle2, AlertCircle, Trash2, RefreshCw,
  ShieldCheck, ArrowLeft, Check, CheckCheck, Loader2,
  MessageSquare, UserPlus, CreditCard, Calendar, Inbox
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { formatPersianDate } from '../../utils/date';

export const AdminAnnouncementsPage = () => {
  const [activeTab, setActiveTab] = useState('NOTIFICATIONS'); // NOTIFICATIONS, ANNOUNCEMENTS
  const [announcements, setAnnouncements] = useState([]);
  const [groups, setGroups] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingIds, setMarkingIds] = useState(new Set());
  const toast = useToast();

  // Create Announcement Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    audience: 'ALL', // ALL, SWIMMERS, COACHES, GROUP
    target_group: '',
    is_pinned: false,
  });
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message) {
      toast.error('عنوان و متن پیام اعلان الزامی هستند.');
      return;
    }
    if (form.audience === 'GROUP' && !form.target_group) {
      toast.error('لطفاً گروه هدف پیام را انتخاب کنید.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: form.title,
        message: form.message,
        audience: form.audience,
        target_group: form.audience === 'GROUP' ? Number(form.target_group) : null,
        is_pinned: form.is_pinned,
      };

      await api.post('/content/announcements/', payload);
      toast.success('پیام اعلان با موفقیت ثبت شد و اعلان سیستمی آن منتشر گردید.');
      setIsModalOpen(false);
      setForm({
        title: '',
        message: '',
        audience: 'ALL',
        target_group: '',
        is_pinned: false,
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در ارسال اعلان');
    } finally {
      setSubmitting(false);
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
    ALL: 'همه اعضای آموزشگاه',
    SWIMMERS: 'فقط شناگران',
    COACHES: 'فقط مربیان',
    GROUP: 'اعضای یک گروه مشخص',
  };

  return (
    <div className="space-y-6">
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
          <Button onClick={() => setIsModalOpen(true)} className="gap-1.5 text-xs">
            <Send className="w-4 h-4" />
            <span>ارسال اطلاعیه جدید</span>
          </Button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700 text-xs sm:text-sm gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('NOTIFICATIONS')}
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
          onClick={() => setActiveTab('ANNOUNCEMENTS')}
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
                  notif.link?.includes('/admin/swimmers/') || notif.title?.includes('مدارک');
                const isMarking = markingIds.has(notif.id);

                return (
                  <div
                    key={notif.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      !notif.is_read
                        ? 'bg-sky-50/50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900/60 shadow-xs ring-1 ring-sky-500/10'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                            isSwimmerDocAlert
                              ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {isSwimmerDocAlert ? (
                            <ShieldCheck className="w-5 h-5" />
                          ) : (
                            <Bell className="w-5 h-5" />
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                              {notif.title}
                            </h3>
                            {!notif.is_read && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500 text-white">
                                خوانده‌نشده
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                            {notif.message}
                          </p>
                          <span className="text-[11px] font-mono text-slate-400 block pt-1">
                            {formatPersianDate(notif.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {notif.link && (
                          <Link
                            to={notif.link}
                            onClick={() => {
                              if (!notif.is_read) handleMarkNotifAsRead(notif.id);
                            }}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer ${
                              isSwimmerDocAlert
                                ? 'bg-sky-600 hover:bg-sky-700 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {isSwimmerDocAlert ? (
                              <>
                                <ShieldCheck className="w-4 h-4" />
                                <span>هدایت به بخش مدارک شناگر برای بررسی</span>
                              </>
                            ) : (
                              <span>مشاهده و بررسی</span>
                            )}
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </Link>
                        )}

                        {!notif.is_read && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkNotifAsRead(notif.id, e)}
                            disabled={isMarking}
                            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
              description="با کلیک روی دکمه «ارسال اطلاعیه جدید»، می‌توانید برای مخاطبان هدف پیام اطلاع‌رسانی ارسال کنید."
            />
          ) : (
            <div className="space-y-4">
              {announcements.map((item) => (
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
                        مخاطب: {audienceLabels[item.audience] || item.audience}
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
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Create Announcement */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="ارسال پیام اعلان جدید"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              عنوان پیام اعلان *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="مثال: یادآوری تغییر زمان سانس یا سررسید شهریه..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                مخاطبان هدف
              </label>
              <select
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              >
                <option value="ALL">همه اعضای آموزشگاه (عمومی)</option>
                <option value="SWIMMERS">فقط شناگران</option>
                <option value="COACHES">فقط مربیان</option>
                <option value="GROUP">اعضای یک گروه خاص کلاسی</option>
              </select>
            </div>

            {form.audience === 'GROUP' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  انتخاب گروه کلاسی *
                </label>
                <select
                  required
                  value={form.target_group}
                  onChange={(e) => setForm({ ...form, target_group: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">انتخاب گروه...</option>
                  {groups.map((grp) => (
                    <option key={grp.id} value={grp.id}>
                      {grp.course_name} - {grp.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_pinned"
              checked={form.is_pinned}
              onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
              className="rounded text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="is_pinned" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              این اعلان مهم / پین‌شده باشد (در بالای پرتال نمایش داده شود)
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              متن کامل پیام *
            </label>
            <textarea
              rows={4}
              required
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="متن پیام اطلاع‌رسانی به مخاطبان..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'در حال ارسال...' : 'ارسال اعلان'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};