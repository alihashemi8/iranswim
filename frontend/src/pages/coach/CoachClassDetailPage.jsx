import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BookOpen, Users, Calendar, MapPin, ChevronRight,
  ClipboardCheck, Award, TrendingUp, CheckCircle2,
  Clock, ArrowLeft, MessageSquare, AlertCircle,
  Megaphone, Bell, Send, Pin, Trash2, Sparkles
} from 'lucide-react';
import api from '../../api/client';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';

const ANNOUNCEMENT_TEMPLATES = [
  {
    icon: '🏊‍♂️',
    label: 'همراه داشتن وسایل',
    title: 'لوازم تمرینی جلسه آینده: فین و کفی',
    message: 'شناگران عزیز، لطفاً در جلسه آینده فین کوتاه و کفی دست (Paddle) را حتماً به همراه داشته باشید تا تمرینات تکنیکی دست و پا را انجام دهیم.',
    is_pinned: false,
  },
  {
    icon: '⏰',
    label: 'تغییر ساعت کلاس',
    title: 'اطلاعیه تغییر ساعت برگزاری کلاس',
    message: 'به اطلاع شناگران گرامی و اولیای محترم می‌رساند، جلسه آینده کلاس با ۳۰ دقیقه تاخیر و راس ساعت ... آغاز خواهد شد. لطفاً به موقع در محل استخر حاضر باشید.',
    is_pinned: true,
  },
  {
    icon: '⚠️',
    label: 'لغو جلسه و جبرانی',
    title: 'لغو جلسه و هماهنگی سانس جبرانی',
    message: 'به علت انجام امور فنی و نگهداری تاسیسات استخر، جلسه این تاریخ برگزار نمی‌گردد. زمان و تاریخ سانس جبرانی به زودی به اطلاع شما خواهد رسید.',
    is_pinned: true,
  },
  {
    icon: '🍎',
    label: 'نکات تغذیه و استراحت',
    title: 'نکات تغذیه‌ای و آمادگی بدنی قبل از تمرین',
    message: 'شناگران محترم، توجه فرمایید حداقل ۱/۵ ساعت پیش از ورود به استخر غذای سنگین میل نکنید و حتماً بطری آب برای حفظ هیدراتاسیون همراه داشته باشید.',
    is_pinned: false,
  },
  {
    icon: '🏆',
    label: 'تست و ارزیابی سطح',
    title: 'برگزاری تست رکوردگیری و سنجش مهارت',
    message: 'در جلسه آینده رکوردگیری تایم ۵۰ متر کرال سینه و ارزیابی استانداردهای تکنیک تنفس انجام می‌شود. لطفاً با آمادگی کامل و استراحت کافی حاضر شوید.',
    is_pinned: false,
  },
];

export const CoachClassDetailPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('swimmers'); // 'swimmers', 'sessions', 'announcements', 'info'
  const toast = useToast();

  // Announcement composer state
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [sendSms, setSendSms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingPinId, setTogglingPinId] = useState(null);

  useEffect(() => {
    const fetchClassDetail = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/coaches/my-classes/${id}/`);
        setData(res.data);
      } catch (err) {
        console.error('Error fetching class detail:', err);
        toast.error('خطا در دریافت جزئیات کلاس');
      } finally {
        setLoading(false);
      }
    };
    fetchClassDetail();
  }, [id]);

  const handleApplyTemplate = (tpl) => {
    setAnnouncementTitle(tpl.title);
    setAnnouncementMessage(tpl.message);
    setIsPinned(tpl.is_pinned);
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      toast.error('لطفاً عنوان و متن اعلان را وارد نمایید.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post(`/coaches/my-classes/${id}/`, {
        title: announcementTitle.trim(),
        message: announcementMessage.trim(),
        is_pinned: isPinned,
        send_sms: sendSms,
      });

      toast.success('اعلان با موفقیت برای تمامی شناگران این کلاس ارسال گردید.');

      const newAnn = res.data.announcement;
      setData((prev) => ({
        ...prev,
        announcements: [newAnn, ...(prev.announcements || [])],
      }));

      setAnnouncementTitle('');
      setAnnouncementMessage('');
      setIsPinned(false);
      setSendSms(false);
    } catch (err) {
      console.error('Error sending announcement:', err);
      toast.error(err.response?.data?.detail || 'خطا در ارسال اعلان کلاس');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (annId) => {
    if (!window.confirm('آیا از حذف این اعلان اطمینان دارید؟ این پیام از پنل کلیه شناگران کلاس حذف خواهد شد.')) {
      return;
    }

    try {
      setDeletingId(annId);
      await api.delete(`/coaches/my-classes/${id}/announcements/${annId}/`);
      toast.success('اعلان با موفقیت حذف شد.');
      setData((prev) => ({
        ...prev,
        announcements: (prev.announcements || []).filter((a) => a.id !== annId),
      }));
    } catch (err) {
      console.error('Error deleting announcement:', err);
      toast.error(err.response?.data?.detail || 'خطا در حذف اعلان');
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePin = async (annId) => {
    try {
      setTogglingPinId(annId);
      const res = await api.patch(`/coaches/my-classes/${id}/announcements/${annId}/`);
      const newPinned = res.data.is_pinned;
      setData((prev) => ({
        ...prev,
        announcements: (prev.announcements || []).map((a) =>
          a.id === annId ? { ...a, is_pinned: newPinned } : a
        ).sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0)),
      }));
      toast.success(newPinned ? 'اعلان در بالای لیست سنجاق گردید.' : 'سنجاق اعلان برداشته شد.');
    } catch (err) {
      console.error('Error toggling pin:', err);
      toast.error('خطا در تغییر وضعیت سنجاق اعلان');
    } finally {
      setTogglingPinId(null);
    }
  };

  const formatPersianDateTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return new Intl.DateTimeFormat('fa-IR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(d);
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return <LoadingState type="table" message="در حال بارگذاری جزئیات کلاس و فهرست شناگران..." />;
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">کلاس مورد نظر یافت نشد.</p>
        <Link to="/coach/classes" className="text-emerald-600 text-sm font-bold mt-2 inline-block">
          بازگشت به فهرست کلاس‌ها
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 coach-panel">
      {/* Back button and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              to="/coach/classes"
              className="text-sm text-slate-500 hover:text-emerald-600 flex items-center gap-1 font-semibold transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              کلاس‌های من
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-sm text-slate-700 dark:text-slate-300 font-bold">{data.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            {data.name}
            <span className="text-xs sm:text-sm font-semibold px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              سطح: {data.skill_level}
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            دوره {data.course_name} · محل: {data.pool_location}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/coach/attendance?group_id=${data.id}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-base font-bold shadow-md transition-all active:scale-95"
          >
            <ClipboardCheck className="w-4.5 h-4.5" />
            حضور و غیاب کلاس
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('swimmers')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm sm:text-base font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'swimmers'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4.5 h-4.5" />
          فهرست شناگران ({data.swimmers?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm sm:text-base font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'sessions'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4.5 h-4.5" />
          جلسات کلاسی ({data.sessions?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm sm:text-base font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'announcements'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Megaphone className="w-4.5 h-4.5" />
          اعلانات کلاس ({data.announcements?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm sm:text-base font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'info'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-4.5 h-4.5" />
          برنامه زمانی و مشخصات
        </button>
      </div>

      {/* Tab 1: Swimmers List */}
      {activeTab === 'swimmers' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/60 font-bold text-sm">
                <tr>
                  <th className="py-3.5 px-4">شناگر</th>
                  <th className="py-3.5 px-4">کد ملی</th>
                  <th className="py-3.5 px-4">سطح مهارت</th>
                  <th className="py-3.5 px-4">جلسات حضور</th>
                  <th className="py-3.5 px-4">درصد حضور</th>
                  <th className="py-3.5 px-4 text-center">اقدامات آموزشی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.swimmers && data.swimmers.length > 0 ? (
                  data.swimmers.map((sw) => (
                    <tr key={sw.swimmer_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                        {sw.full_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-sm">
                        {sw.national_id || '---'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm">
                          {sw.level_name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-sm">
                        {sw.sessions_attended} جلسه
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${sw.attendance_rate >= 80 ? 'bg-emerald-500' : sw.attendance_rate >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${Math.min(100, sw.attendance_rate)}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs sm:text-sm font-bold">
                            {sw.attendance_rate}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Link
                          to={`/coach/progress/${sw.swimmer_id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white text-xs sm:text-sm font-bold transition-all"
                        >
                          <TrendingUp className="w-4 h-4" />
                          پرونده مهارت
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400 text-sm">
                      هیچ شناگری در این کلاس ثبت‌نام نشده است.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Sessions */}
      {activeTab === 'sessions' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/60 font-bold text-sm">
                <tr>
                  <th className="py-3.5 px-4">تاریخ جلسه</th>
                  <th className="py-3.5 px-4">ساعت برگزاری</th>
                  <th className="py-3.5 px-4">محل استخر</th>
                  <th className="py-3.5 px-4">وضعیت جلسه</th>
                  <th className="py-3.5 px-4">وضعیت حضور و غیاب</th>
                  <th className="py-3.5 px-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.sessions && data.sessions.length > 0 ? (
                  data.sessions.map((sess) => (
                    <tr key={sess.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold font-mono text-slate-900 dark:text-white text-sm">
                        {sess.session_date}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300 text-sm">
                        {sess.start_time} تا {sess.end_time}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 text-sm">
                        {sess.pool_location}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-md font-semibold text-xs ${
                          sess.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' :
                          sess.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700' :
                          'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300'
                        }`}>
                          {sess.status_display}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {sess.has_attendance ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-sm">
                            <CheckCircle2 className="w-4 h-4" />
                            ثبت‌شده
                          </span>
                        ) : (
                          <span className="text-amber-600 font-bold text-sm">
                            ثبت‌نشده
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Link
                          to={`/coach/attendance?session_id=${sess.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold transition-all"
                        >
                          <ClipboardCheck className="w-4 h-4" />
                          {sess.has_attendance ? 'ویرایش حضور' : 'ثبت حضور'}
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400 text-sm">
                      جلسه‌ای برای این کلاس تعریف نشده است.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Class Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          {/* Section A: Send Announcement Form */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    ارسال اعلان و اطلاعیه به شناگران کلاس
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    این اعلان به صورت فوری در پنل کاربری تمامی شناگران این کلاس ({data.swimmers?.length || 0} نفر) و اولیای آنها نمایش داده می‌شود.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 self-start sm:self-auto px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800">
                <Users className="w-3.5 h-3.5" />
                {data.swimmers?.length || 0} شناگر عضو کلاس
              </div>
            </div>

            {/* Quick Templates */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  الگوهای آماده پیام مربی (برای درج سریع پیام کلیک کنید):
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ANNOUNCEMENT_TEMPLATES.map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200/70 dark:border-slate-700/60 hover:border-emerald-300 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <span>{tpl.icon}</span>
                    <span>{tpl.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  عنوان اعلان <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="مثال: لوازم مورد نیاز جلسه آینده یا تغییر ساعت تمرین..."
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  متن اعلان و توضیحات برای شناگران <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  placeholder="توضیحات کامل در مورد برنامه تمرینی، هماهنگی‌ها، وسایل مورد نیاز یا اطلاعیه برای اولیا و شناگران بنویسید..."
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                    />
                    <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Pin className="w-3.5 h-3.5 text-amber-500 rotate-45" />
                      سنجاق کردن اعلان (مهم و در بالای لیست)
                    </span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sendSms}
                      onChange={(e) => setSendSms(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                    />
                    <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Bell className="w-3.5 h-3.5 text-sky-500" />
                      ارسال پیامک و نوتیفیکیشن فوری
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-2.5">
                  {(announcementTitle || announcementMessage) && (
                    <button
                      type="button"
                      onClick={() => {
                        setAnnouncementTitle('');
                        setAnnouncementMessage('');
                        setIsPinned(false);
                        setSendSms(false);
                      }}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                    >
                      پاک کردن فرم
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !announcementTitle.trim() || !announcementMessage.trim()}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        در حال ارسال...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        ارسال اعلان به شناگران کلاس
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Section B: Announcements History */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  تاریخچه اعلانات ارسالی این کلاس
                </h3>
              </div>
              <span className="text-xs sm:text-sm font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {data.announcements?.length || 0} اعلان
              </span>
            </div>

            {data.announcements && data.announcements.length > 0 ? (
              <div className="space-y-3.5">
                {data.announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className={`rounded-2xl p-4 sm:p-5 border transition-all ${
                      ann.is_pinned
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 shadow-xs'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {ann.is_pinned && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold text-xs border border-amber-300 dark:border-amber-700/60">
                            <Pin className="w-3.5 h-3.5 rotate-45 text-amber-600" />
                            مهم و پین‌شده
                          </span>
                        )}
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          {ann.title}
                        </h4>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleTogglePin(ann.id)}
                          disabled={togglingPinId === ann.id}
                          title={ann.is_pinned ? 'برداشتن سنجاق' : 'سنجاق کردن در بالای لیست'}
                          className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            ann.is_pinned
                              ? 'text-amber-600 bg-amber-100/70 dark:bg-amber-900/50 hover:bg-amber-200'
                              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          <Pin className="w-4 h-4 rotate-45" />
                        </button>

                        {ann.can_delete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAnnouncement(ann.id)}
                            disabled={deletingId === ann.id}
                            title="حذف این اعلان"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all cursor-pointer"
                          >
                            {deletingId === ann.id ? (
                              <div className="w-4 h-4 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Message Body */}
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed mb-3 pr-0.5">
                      {ann.message}
                    </p>

                    {/* Footer Metadata */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          ارسال شده برای تمامی شناگران کلاس ({data.swimmers?.length || 0} نفر)
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          ارسال‌کننده: {ann.created_by_name}
                        </span>
                        {ann.send_sms && (
                          <>
                            <span className="text-slate-300 dark:text-slate-700">·</span>
                            <span className="text-sky-600 dark:text-sky-400 font-bold flex items-center gap-1">
                              <Bell className="w-3 h-3" />
                              پیامک ارسال شد
                            </span>
                          </>
                        )}
                      </div>

                      <span className="font-mono text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatPersianDateTime(ann.created_at || ann.created_at_display)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Megaphone className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  هنوز هیچ اعلانی برای این کلاس ارسال نشده است
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                  شما می‌توانید با استفاده از فرم بالا، هماهنگی‌های لازم، تغییرات ساعت، لوازم مورد نیاز جلسه آینده یا نکات تمرینی را برای تمامی شناگران این کلاس ارسال کنید.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Info */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-3.5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              برنامه هفتگی ثابت
            </h3>
            <div className="space-y-2">
              {data.schedules && data.schedules.length > 0 ? (
                data.schedules.map((sch, i) => (
                  <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-sm">
                    <span className="font-bold text-slate-800 dark:text-white">{sch.weekday_display}</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300 font-medium">ساعت {sch.start_time} تا {sch.end_time}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">برنامه هفتگی ثبت نشده است.</p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-3.5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              مشخصات دوره و ظرفیت
            </h3>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">عنوان دوره:</span>
                <span className="font-bold text-slate-900 dark:text-white">{data.course_name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">وضعیت دوره:</span>
                <span className="font-semibold">{data.course_status}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">ظرفیت مجاز:</span>
                <span className="font-mono font-bold">{data.capacity} نفر</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">شناگران ثبت‌نام‌شده:</span>
                <span className="font-mono font-bold text-emerald-600">{data.enrolled_count} نفر</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
