import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Bell, Pin, Send, Clock, Smartphone
} from 'lucide-react';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';

export const CoachMessagesPage = () => {
  const [data, setData] = useState({ announcements: [], notifications: [], my_groups: [] });
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const toast = useToast();

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/coaches/messages/');
      setData(res.data);
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

  if (loading) {
    return <LoadingState type="dashboard" message="در حال بارگذاری مرکز پیام و اعلان‌های مربی..." />;
  }

  const { announcements = [], notifications = [] } = data;

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
          variant="success"
          size="sm"
          onClick={() => navigate('/coach/messages/new')}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base px-4 py-2.5 cursor-pointer"
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
                      {ann.is_pinned && <Pin className="w-4 h-4 text-amber-500 rotate-45 shrink-0" />}
                      {ann.title}
                    </span>
                    <span className="text-xs text-slate-400 font-mono font-medium shrink-0">
                      {ann.created_at}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {ann.group_names && ann.group_names.length > 0 ? (
                      ann.group_names.map((gName, idx) => (
                        <span
                          key={idx}
                          className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        >
                          کلاس: {gName}
                        </span>
                      ))
                    ) : ann.group_name ? (
                      <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        کلاس: {ann.group_name}
                      </span>
                    ) : null}

                    {ann.send_sms && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                        <Smartphone className="w-3 h-3" />
                        پیامک
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {ann.message}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-12 space-y-3">
                <p className="text-slate-400 text-sm">
                  هیچ اطلاعیه‌ای وجود ندارد.
                </p>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => navigate('/coach/messages/new')}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  ارسال اولین اطلاعیه
                </Button>
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
    </div>
  );
};
