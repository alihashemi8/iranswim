import React, { useState, useEffect } from 'react';
import {
  MessageSquare, Bell, Pin, Send, PlusCircle,
  Users, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';

export const CoachMessagesPage = () => {
  const [data, setData] = useState({ announcements: [], notifications: [], my_groups: [] });
  const [loading, setLoading] = useState(true);

  // New announcement form
  const [showSendModal, setShowSendModal] = useState(false);
  const [targetGroupId, setTargetGroupId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const toast = useToast();

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/coaches/messages/');
      setData(res.data);
      if (res.data.my_groups && res.data.my_groups.length > 0) {
        setTargetGroupId(res.data.my_groups[0].id);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      toast.error('خطا در دریافت پیام‌ها و اطلاعیه‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!title || !message || !targetGroupId) {
      toast.error('عنوان، متن پیام و کلاس هدف الزامی هستند.');
      return;
    }

    try {
      setSending(true);
      await api.post('/coaches/messages/', {
        title,
        message,
        group_id: Number(targetGroupId),
      });
      toast.success('پیام با موفقیت برای شناگران کلاس ارسال شد.');
      setShowSendModal(false);
      setTitle('');
      setMessage('');
      fetchMessages();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ارسال پیام');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <LoadingState type="dashboard" message="در حال بارگذاری مرکز پیام و اعلان‌های مربی..." />;
  }

  const { announcements = [], notifications = [], my_groups = [] } = data;

  return (
    <div className="space-y-6 pb-12 coach-panel">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
            مرکز پیام و ارتباطات آموزشی
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            اطلاع‌رسانی تغییرات کلاس به شناگران، ارتباط آموزشی و اطلاعیه‌های رسمی آکادمی
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowSendModal(true)}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base px-4 py-2.5"
        >
          <Send className="w-4.5 h-4.5" />
          ارسال اطلاعیه به کلاس
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Class Announcements (Left 7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-600" />
              اطلاعیه‌های کلاسی و پیام‌های مدیریت
            </h2>
            <span className="text-sm text-slate-400 font-semibold">{announcements.length} پیام</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {announcements.length > 0 ? (
              announcements.map((ann) => (
                <div key={ann.id} className="py-4 space-y-2">
                  <div className="flex items-center justify-between gap-2.5">
                    <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                      {ann.is_pinned && <Pin className="w-4 h-4 text-amber-500 rotate-45" />}
                      {ann.title}
                    </span>
                    <span className="text-xs text-slate-400 font-mono font-medium">
                      {ann.created_at}
                    </span>
                  </div>

                  {ann.group_name && (
                    <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      کلاس: {ann.group_name}
                    </span>
                  )}

                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {ann.message}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400 text-sm">
                هیچ اطلاعیه‌ای وجود ندارد.
              </div>
            )}
          </div>
        </div>

        {/* Notifications & System Alerts (Right 5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-sky-600" />
              اعلان‌های سیستمی مربی
            </h2>
            <span className="text-sm text-slate-400 font-semibold">{notifications.length} اعلان</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div key={notif.id} className="py-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      {notif.title}
                    </span>
                    <span className="text-xs text-slate-400 font-mono font-medium">
                      {notif.created_at}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400 text-sm">
                اعلان سیستمی جدیدی ندارید.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Send Message to Class Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-600" />
              ارسال پیام و اعلان به کلاس
            </h3>

            <form onSubmit={handleSendMessage} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  انتخاب کلاس مخاطب:
                </label>
                <select
                  value={targetGroupId}
                  onChange={(e) => setTargetGroupId(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-800 dark:text-slate-200 text-sm font-medium"
                >
                  {my_groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-400 mt-1.5 block">
                  * پیام صرفاً برای شناگران و اولیای این کلاس نمایش داده خواهد شد.
                </span>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  عنوان اطلاعیه:
                </label>
                <input
                  type="text"
                  placeholder="مثال: تغییر ساعت جلسه پنج‌شنبه یا همراه داشتن فین شنا"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  متن پیام:
                </label>
                <textarea
                  rows="4"
                  placeholder="متن کامل پیام و نکات آموزشی لازم برای شاگردان..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white leading-relaxed text-sm"
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSendModal(false)}
                  className="text-sm font-medium"
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={sending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold text-sm px-4"
                >
                  <Send className="w-4 h-4" />
                  ارسال به کلاس
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
