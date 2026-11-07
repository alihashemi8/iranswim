import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell, Send, Pin, Users, User, Layers, BookOpen,
  ArrowRight, GraduationCap, Sparkles, CheckCircle2,
  Info, AlertCircle, Eye, Calendar, Clock, Check
} from 'lucide-react';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { CustomSelect } from '../../components/common/CustomSelect';
import { useToast } from '../../context/ToastContext';

export const AdminCreateAnnouncementPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    title: '',
    message: '',
    audience: 'ALL', // ALL, SWIMMERS, COACHES, GROUP
    target_group: '',
    is_pinned: false,
  });

  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch groups for class-level targeting
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoadingGroups(true);
        const res = await api.get('/education/groups/');
        const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setGroups(list);
      } catch (err) {
        console.error('Error fetching groups:', err);
      } finally {
        setLoadingGroups(false);
      }
    };
    fetchGroups();
  }, []);

  const audienceOptions = [
    {
      value: 'ALL',
      label: 'همه اعضای آموزشگاه (عمومی)',
      description: 'اطلاع‌رسانی عمومی به تمام شناگران، مربیان و مدیران سیستم',
      icon: Users,
      badge: 'همگانی',
    },
    {
      value: 'SWIMMERS',
      label: 'فقط شناگران و اولیا',
      description: 'ارسال اعلان اختصاصی به کارتابل و داشبورد شناگران',
      icon: User,
      badge: 'شناگران',
    },
    {
      value: 'COACHES',
      label: 'فقط کادر مربیان',
      description: 'ارسال اعلان اختصاصی به پنل و کارتابل مربیان آموزشگاه',
      icon: GraduationCap,
      badge: 'مربیان',
    },
    {
      value: 'GROUP',
      label: 'اعضای یک کلاس / گروه آموزشی خاص',
      description: 'ارسال پیام فقط به شناگران ثبت‌نام‌شده در یک گروه کلاسی مشخص',
      icon: Layers,
      badge: 'کلاسی',
    },
  ];

  const groupOptions = groups.map((grp) => ({
    value: String(grp.id),
    label: grp.course_name ? `${grp.course_name} - ${grp.name}` : grp.name,
    description: grp.coach_name
      ? `مربی: ${grp.coach_name}${grp.schedule ? ` | زمان: ${grp.schedule}` : ''}`
      : (grp.schedule ? `زمان: ${grp.schedule}` : 'کلاس آموزشی'),
    badge: grp.gender_display || (grp.enrolled_count ? `${grp.enrolled_count} نفر` : undefined),
    icon: BookOpen,
  }));

  const selectedGroup = groups.find((g) => String(g.id) === String(form.target_group));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error('لطفاً عنوان پیام اعلان را وارد کنید.');
      return;
    }
    if (!form.message.trim()) {
      toast.error('متن کامل پیام اعلان الزامی است.');
      return;
    }
    if (form.audience === 'GROUP' && !form.target_group) {
      toast.error('لطفاً کلاس یا گروه آموزشی هدف را انتخاب کنید.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        audience: form.audience,
        target_group: form.audience === 'GROUP' ? Number(form.target_group) : null,
        is_pinned: form.is_pinned,
      };

      await api.post('/content/announcements/', payload);
      toast.success('پیام اعلان با موفقیت ثبت و نوتیفیکیشن سیستمی آن منتشر شد.');
      navigate('/admin/announcements?tab=announcements');
    } catch (err) {
      console.error('Create announcement error:', err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت و ارسال پیام اعلان');
    } finally {
      setSubmitting(false);
    }
  };

  const getAudienceLabel = () => {
    const match = audienceOptions.find((opt) => opt.value === form.audience);
    if (form.audience === 'GROUP' && selectedGroup) {
      return `گروه: ${selectedGroup.course_name ? `${selectedGroup.course_name} - ` : ''}${selectedGroup.name}`;
    }
    return match ? match.label : 'همه مخاطبان';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6" dir="rtl">
      {/* 1. Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <Link
              to="/admin/announcements"
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              مرکز پیام‌ها و اعلان‌ها
            </Link>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium">
              ارسال پیام اعلان جدید
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/70 border border-sky-200/70 dark:border-sky-800 text-sky-600 dark:text-sky-400">
              <Send className="w-5 h-5" />
            </div>
            <span>ارسال پیام اعلان جدید</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            تنظیم و انتشار اطلاعیه عمومی به تفکیک مخاطبان آموزشگاه همراه با ارسال خودکار هشدارهای سیستمی
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/admin/announcements')}
          className="gap-2 text-xs self-start sm:self-auto cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به اعلان‌ها</span>
        </Button>
      </div>

      {/* 2. Main Form & Live Preview Grid */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Left Form Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
                  <Bell className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>مشخصات و محتوای اعلان</span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  فیلدهای دارای ستاره (*) الزامی هستند
                </span>
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  عنوان پیام اعلان <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={180}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="مثال: یادآوری تغییر زمان سانس‌های آموزشی و تعطیلی هفته آینده..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                  <span>عنوانی کوتاه، واضح و رسا انتخاب نمایید</span>
                  <span className="font-mono">{form.title.length} / ۱۸۰</span>
                </div>
              </div>

              {/* Audience Dropdown using CustomSelect */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <CustomSelect
                    label="مخاطبان هدف پیام اعلان *"
                    value={form.audience}
                    onChange={(val) => setForm({ ...form, audience: val, target_group: '' })}
                    options={audienceOptions}
                    menuClassName="w-full"
                    placeholder="انتخاب گروه مخاطبان..."
                  />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    تعیین کنید این اطلاعیه برای چه دسته‌ای از کاربران در پنل نمایش داده شود.
                  </p>
                </div>

                {/* Conditional Class Group Selection */}
                {form.audience === 'GROUP' && (
                  <div className="p-4 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-800/60 space-y-2 animate-in fade-in-50 zoom-in-95 duration-200">
                    <CustomSelect
                      label="انتخاب کلاس یا گروه آموزشی هدف *"
                      value={form.target_group}
                      onChange={(val) => setForm({ ...form, target_group: val })}
                      options={groupOptions}
                      searchable={true}
                      icon={BookOpen}
                      menuClassName="w-full"
                      placeholder={loadingGroups ? 'در حال بارگذاری گروه‌ها...' : 'جستجو و انتخاب گروه آموزشی...'}
                    />
                    <p className="text-[11px] text-sky-700 dark:text-sky-300">
                      این پیام منحصراً به کارتابل شناگرانی که در این گروه ثبت‌نام قطعی دارند ارسال خواهد شد.
                    </p>
                  </div>
                )}
              </div>

              {/* Pin Status Toggle Card */}
              <div
                onClick={() => setForm({ ...form, is_pinned: !form.is_pinned })}
                className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                  form.is_pinned
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className={`mt-0.5 p-2 rounded-lg shrink-0 transition-colors ${
                  form.is_pinned
                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                    : 'bg-slate-200/70 dark:bg-slate-700/60 text-slate-400'
                }`}>
                  <Pin className={`w-4 h-4 ${form.is_pinned ? 'rotate-45' : ''}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      این اعلان مهم / پین‌شده باشد (نمایش در بالای پرتال)
                    </span>
                    {form.is_pinned && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/70 dark:bg-amber-900/70 text-amber-800 dark:text-amber-200">
                        فعال
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    اعلان‌های مهم با رنگ طلایی و در بالاترین بخش کارتابل کاربران شناگر یا مربی جهت جلب توجه فوری تثبیت می‌شوند.
                  </p>
                </div>
                <div className="shrink-0 self-center">
                  <input
                    type="checkbox"
                    checked={form.is_pinned}
                    onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Full Message Textarea */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  متن کامل پیام اعلان <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={6}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="متن پیام اطلاع‌رسانی، شرایط، تاریخ‌های مدنظر، تذکرات یا جزئیات مورد نیاز مخاطبان را با دقت بنویسید..."
                  className="w-full px-3.5 py-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 leading-relaxed"
                />
                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                  <span>پشتیبانی از فاصله‌گذاری و شکستن خطوط</span>
                  <span className="font-mono">{form.message.length} نویسه</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/announcements')}
                disabled={submitting}
                className="w-full sm:w-auto text-xs"
              >
                انصراف و بازگشت
              </Button>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto gap-2 text-xs font-bold"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'در حال ارسال و انتشار...' : 'ارسال و انتشار اعلان'}</span>
              </Button>
            </div>
          </div>

          {/* Right Sidebar Column: Live Preview & Tips (1 Col) */}
          <div className="space-y-6">
            {/* Live Card Preview */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white">
                  <Eye className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>پیش‌نمایش زنده در پرتال مخاطبان</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>زنده</span>
                </div>
              </div>

              {/* Simulated Card */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  form.is_pinned
                    ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-200 dark:border-amber-900/60 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-2 flex-wrap">
                    {form.is_pinned && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">
                        <Pin className="w-3 h-3 rotate-45" />
                        مهم و پین‌شده
                      </span>
                    )}
                    <Badge
                      variant={
                        form.audience === 'ALL'
                          ? 'info'
                          : form.audience === 'GROUP'
                          ? 'warning'
                          : 'neutral'
                      }
                    >
                      {getAudienceLabel()}
                    </Badge>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    امروز
                  </span>
                </div>

                <div className="pt-3 space-y-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                    {form.title.trim() || 'عنوان پیام اعلان در این قسمت نمایش داده خواهد شد...'}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {form.message.trim() || 'متن کامل پیام و جزئیات اطلاعیه به صورت قالب‌بندی‌شده در اینجا برای شناگران و مربیان نمایش می‌یابد.'}
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 dark:text-slate-500 pt-1 leading-relaxed">
                این کارت همان شکلی است که پیام ارسالی در کارتابل شناگر یا مربی دریافت‌کننده به نمایش درمی‌آید.
              </div>
            </div>

            {/* Quick Tips Box */}
            <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/20 rounded-2xl border border-sky-200/60 dark:border-sky-800/60 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-900 dark:text-sky-200">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>راهنمای انتشار اعلان‌های موثر</span>
              </div>

              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>اعلان‌های عمومی به صورت هشدار سیستمی درون‌برنامه‌ای برای تمامی اعضا ذخیره می‌شوند.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>در صورت انتخاب «کلاس خاص»، پیام صرفاً برای اعضای همان سانس و مربی مربوطه قابل مشاهده خواهد بود.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>پین کردن اعلان باعث تثبیت آن در ابتدای لیست پرتال شناگران تا زمان لغو پین می‌شود.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
