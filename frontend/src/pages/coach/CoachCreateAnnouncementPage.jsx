import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Send, Pin, Users, BookOpen, ArrowRight,
  Sparkles, CheckCircle2, Eye, Bell, Search,
  MapPin, Megaphone, Smartphone, ChevronRight
} from 'lucide-react';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { BackButton } from '../../components/common/BackButton';
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

export const CoachCreateAnnouncementPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [classSearchQuery, setClassSearchQuery] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [sendSms, setSendSms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isCompletedClass = (cls) =>
    cls.status === 'CLOSED' ||
    cls.status === 'CANCELLED' ||
    cls.course_status === 'COMPLETED' ||
    cls.course_status === 'ARCHIVED';

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const res = await api.get('/coaches/my-classes/');
        const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setClasses(list);

        const paramGroupId = Number(searchParams.get('group_id'));
        if (paramGroupId && list.some((c) => c.id === paramGroupId)) {
          setSelectedGroupIds([paramGroupId]);
        } else {
          const activeList = list.filter((c) => !isCompletedClass(c));
          if (activeList.length === 1) {
            setSelectedGroupIds([activeList[0].id]);
          } else if (activeList.length === 0 && list.length === 1) {
            setSelectedGroupIds([list[0].id]);
          }
        }
      } catch (err) {
        console.error('Error fetching coach classes:', err);
        toast.error('خطا در دریافت فهرست کلاس‌های مربی');
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [searchParams]);

  const sortedClasses = useMemo(() => {
    return [...classes].sort((a, b) => Number(isCompletedClass(a)) - Number(isCompletedClass(b)));
  }, [classes]);

  const activeClasses = useMemo(
    () => sortedClasses.filter((cls) => !isCompletedClass(cls)),
    [sortedClasses]
  );

  const filteredClasses = useMemo(() => {
    const q = classSearchQuery.trim().toLowerCase();
    if (!q) return sortedClasses;
    return sortedClasses.filter(
      (cls) =>
        cls.name?.toLowerCase().includes(q) ||
        cls.course_name?.toLowerCase().includes(q) ||
        cls.skill_level_name?.toLowerCase().includes(q) ||
        cls.pool_location?.toLowerCase().includes(q)
    );
  }, [sortedClasses, classSearchQuery]);

  const selectedClasses = useMemo(
    () => classes.filter((cls) => selectedGroupIds.includes(cls.id)),
    [classes, selectedGroupIds]
  );

  const totalSelectedSwimmers = useMemo(
    () => selectedClasses.reduce((sum, cls) => sum + (Number(cls.enrolled_count) || 0), 0),
    [selectedClasses]
  );

  const handleToggleGroup = (groupId) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSelectAllActive = () => {
    const targets = activeClasses.length > 0 ? activeClasses : sortedClasses;
    setSelectedGroupIds(targets.map((c) => c.id));
  };

  const handleClearGroups = () => {
    setSelectedGroupIds([]);
  };

  const handleApplyTemplate = (tpl) => {
    setTitle(tpl.title);
    setMessage(tpl.message);
    setIsPinned(Boolean(tpl.is_pinned));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedGroupIds.length === 0) {
      toast.error('لطفاً حداقل یک کلاس مخاطب را انتخاب نمایید.');
      return;
    }
    if (!title.trim()) {
      toast.error('لطفاً عنوان اطلاعیه را وارد نمایید.');
      return;
    }
    if (!message.trim()) {
      toast.error('لطفاً متن کامل پیام را وارد نمایید.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/coaches/messages/', {
        title: title.trim(),
        message: message.trim(),
        group_id: selectedGroupIds[0],
        group_ids: selectedGroupIds,
        is_pinned: isPinned,
        send_sms: sendSms,
      });

      toast.success(
        selectedGroupIds.length > 1
          ? `اطلاعیه با موفقیت برای شناگران ${selectedGroupIds.length} کلاس ارسال شد.`
          : 'اطلاعیه با موفقیت برای شناگران کلاس ارسال شد.'
      );
      navigate('/coach/messages');
    } catch (err) {
      console.error('Error sending announcement:', err);
      toast.error(err.response?.data?.detail || 'خطا در ارسال اطلاعیه');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState type="dashboard" message="در حال بارگذاری فرم ارسال اطلاعیه جدید..." />;
  }

  return (
    <div className="space-y-6 pb-12 coach-panel max-w-6xl mx-auto" dir="rtl">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <BackButton to="/coach/messages" title="بازگشت به مرکز پیام" className="mt-0.5 sm:mt-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-1">
              <Link
                to="/coach/messages"
                className="hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold transition-colors"
              >
                پیام‌ها و اطلاعیه‌ها
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 rotate-180" />
              <span className="text-slate-800 dark:text-slate-200 font-bold">
                ارسال اطلاعیه جدید
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/70 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
                <Send className="w-5 h-5" />
              </div>
              <span>ارسال پیام و اطلاعیه به کلاس</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              انتخاب کلاس مخاطب، تنظیم متن پیام یا استفاده از الگوهای آماده و اطلاع‌رسانی به شناگران و اولیا
            </p>
          </div>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto">
            <Megaphone className="w-7 h-7" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            هنوز هیچ کلاسی به شما تخصیص داده نشده است
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            برای ارسال اطلاعیه کلاسی لازم است حداقل یک کلاس آموزشی فعال یا جلسه تحت هدایت شما ثبت شده باشد.
          </p>
          <div className="pt-2">
            <Button
              type="button"
              variant="success"
              onClick={() => navigate('/coach/messages')}
              className="gap-2 font-bold cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              بازگشت به مرکز پیام
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Main Left Column (2 Cols) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-6">
                {/* Section 1: Target Class(es) */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                        ۱. انتخاب کلاس مخاطب <span className="text-rose-500">*</span>
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        پیام صرفاً برای شناگران و اولیای کلاس‌های منتخب نمایش داده خواهد شد.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleSelectAllActive}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-bold transition-colors cursor-pointer"
                      >
                        انتخاب همه ({activeClasses.length > 0 ? activeClasses.length : sortedClasses.length})
                      </button>
                      {selectedGroupIds.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearGroups}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          پاک کردن
                        </button>
                      )}
                    </div>
                  </div>

                  {sortedClasses.length > 4 && (
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={classSearchQuery}
                        onChange={(e) => setClassSearchQuery(e.target.value)}
                        placeholder="جستجو بر اساس نام کلاس، دوره، سطح یا استخر..."
                        className="w-full pr-9 pl-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-0.5">
                    {filteredClasses.length === 0 ? (
                      <div className="sm:col-span-2 py-6 text-center text-xs sm:text-sm text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        کلاسی مطابق با جستجوی شما یافت نشد.
                      </div>
                    ) : (
                      filteredClasses.map((cls) => {
                        const isChecked = selectedGroupIds.includes(cls.id);
                        const isArchived = isCompletedClass(cls);
                        return (
                          <label
                            key={cls.id}
                            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer select-none transition-all ${
                              isChecked
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/35 border-emerald-400 dark:border-emerald-600 shadow-2xs'
                                : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleGroup(cls.id)}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer mt-1 shrink-0"
                            />
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                                  {cls.name}
                                </span>
                                {isArchived && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 shrink-0">
                                    خاتمه‌یافته
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                {cls.course_name && (
                                  <span className="flex items-center gap-1 truncate">
                                    <BookOpen className="w-3 h-3 text-emerald-600 shrink-0" />
                                    {cls.course_name}
                                  </span>
                                )}
                                {cls.skill_level_name && (
                                  <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                                    {cls.skill_level_name}
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                                <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                                  <Users className="w-3 h-3" />
                                  {cls.enrolled_count ?? 0} شناگر
                                </span>
                                {cls.pool_location && (
                                  <span className="flex items-center gap-1 truncate">
                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                    {cls.pool_location}
                                  </span>
                                )}
                              </div>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Quick Templates */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      الگوهای آماده پیام مربی (برای درج سریع کلیک کنید):
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

                {/* Section 2: Title */}
                <div className="space-y-1.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="coach-announcement-title"
                      className="block text-sm font-bold text-slate-800 dark:text-slate-200"
                    >
                      ۲. عنوان اطلاعیه <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs font-mono text-slate-400">
                      {title.length} / 180
                    </span>
                  </div>
                  <input
                    id="coach-announcement-title"
                    type="text"
                    required
                    maxLength={180}
                    placeholder="مثال: تغییر ساعت جلسه پنج‌شنبه یا همراه داشتن فین شنا"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Section 3: Message */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="coach-announcement-message"
                      className="block text-sm font-bold text-slate-800 dark:text-slate-200"
                    >
                      ۳. متن پیام <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs font-mono text-slate-400">
                      {message.length} نویسه
                    </span>
                  </div>
                  <textarea
                    id="coach-announcement-message"
                    rows={5}
                    required
                    placeholder="متن کامل پیام و نکات آموزشی لازم برای شاگردان و اولیا..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3.5 py-3 text-slate-900 dark:text-white leading-relaxed text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Section 4: Pin & SMS Options */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                    ۴. تنظیمات انتشار و فوریت
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                        isPinned
                          ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/80'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isPinned}
                        onChange={(e) => setIsPinned(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer mt-0.5"
                      />
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Pin className="w-3.5 h-3.5 text-amber-500 rotate-45" />
                          سنجاق کردن اطلاعیه (مهم)
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                          نمایش ثابت در بالاترین بخش لیست اطلاعیه‌های شناگران
                        </p>
                      </div>
                    </label>

                    <label
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                        sendSms
                          ? 'bg-sky-50/80 dark:bg-sky-950/30 border-sky-300 dark:border-sky-700/80'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={sendSms}
                        onChange={(e) => setSendSms(e.target.checked)}
                        className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer mt-0.5"
                      />
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-sky-500" />
                          ارسال پیامک و اعلان فوری
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                          ثبت وضعیت فوری و ارسال اعلان مستقیم برای اعضای کلاس
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/coach/messages')}
                  disabled={submitting}
                  className="w-full sm:w-auto text-sm font-semibold border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  انصراف و بازگشت
                </Button>

                <Button
                  type="submit"
                  variant="success"
                  loading={submitting}
                  className="w-full sm:w-auto gap-2 text-sm font-bold px-6 py-2.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {selectedGroupIds.length > 1
                      ? `ارسال اطلاعیه به ${selectedGroupIds.length} کلاس`
                      : 'ارسال به کلاس'}
                  </span>
                </Button>
              </div>
            </div>

            {/* Right Sidebar Column: Live Preview & Tips (1 Col) */}
            <div className="space-y-6">
              {/* Live Card Preview */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
                    <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>پیش‌نمایش در پنل شناگر</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>زنده</span>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl border transition-all ${
                    isPinned
                      ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-200 dark:border-amber-900/60 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200/60 dark:border-slate-700/60 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isPinned && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">
                          <Pin className="w-3 h-3 rotate-45" />
                          مهم
                        </span>
                      )}
                      {sendSms && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/60 px-2 py-0.5 rounded-md">
                          <Bell className="w-3 h-3" />
                          پیامک فوری
                        </span>
                      )}
                      {selectedClasses.length > 0 ? (
                        <Badge variant="success">
                          {selectedClasses.length === 1
                            ? `کلاس: ${selectedClasses[0].name}`
                            : `${selectedClasses.length} کلاس منتخب`}
                        </Badge>
                      ) : (
                        <Badge variant="neutral">بدون کلاس انتخاب‌شده</Badge>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      امروز
                    </span>
                  </div>

                  <div className="pt-3 space-y-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                      {title.trim() || 'عنوان اطلاعیه در این بخش نمایش داده می‌شود...'}
                    </h4>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {message.trim() || 'متن پیام و نکات آموزشی شما برای شناگران و اولیای کلاس در اینجا نمایش داده خواهد شد.'}
                    </p>
                  </div>

                  {selectedClasses.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                        <Users className="w-3.5 h-3.5" />
                        مخاطبان: {totalSelectedSwimmers} شناگر
                      </span>
                      <span className="truncate max-w-[140px]">
                        {selectedClasses.map((c) => c.name).join('، ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Tips */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/60 p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>راهنمای ارسال اطلاعیه کلاسی</span>
                </div>

                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>اطلاعیه بلافاصله در بخش اعلانات پنل شناگران و اولیای کلاس‌های منتخب ثبت می‌شود.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>می‌توانید یک پیام را همزمان برای چند کلاس خود ارسال کنید.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>با سنجاق کردن پیام، اطلاعیه‌های مهم در صدر لیست شناگران باقی می‌مانند.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
