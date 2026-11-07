import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell, Send, Pin, Users, User, Layers, BookOpen,
  ArrowRight, GraduationCap, Sparkles, CheckCircle2,
  Info, AlertCircle, Eye, Calendar, Clock, Check,
  Smartphone, MessageSquare, CheckCheck, Shield
} from 'lucide-react';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { CustomSelect } from '../../components/common/CustomSelect';
import { useToast } from '../../context/ToastContext';

export const AdminCreateAnnouncementPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // 1. Title, 2. Message, 3. Audience (with categories), 4. Important (Send SMS)
  const [form, setForm] = useState({
    title: '',
    message: '',
    audienceGroup: 'ALL', // 'ALL' | 'SWIMMERS' | 'COACHES'
    audience: 'ALL',      // 'ALL' | 'SWIMMERS' | 'SWIMMERS_MALE' | 'SWIMMERS_FEMALE' | 'GROUP' | 'COACHES' | 'COACHES_MALE' | 'COACHES_FEMALE'
    target_group: '',
    is_important_sms: false, // مهم است (ارسال پیامک)
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

  // Swimmer subcategories options
  const swimmerAudienceOptions = [
    {
      value: 'SWIMMERS',
      label: 'کلیه شناگران آموزشگاه (همه سطوح و رده‌ها)',
      description: 'ارسال اعلان به تمامی شناگران ثبت‌نام‌شده در سامانه',
      icon: Users,
      badge: 'عمومی شناگران',
    },
    {
      value: 'GROUP',
      label: 'اعضای یک کلاس / گروه آموزشی مشخص',
      description: 'انتخاب یک سانس یا کلاس مشخص و ارسال پیام اختصاصی به ثبت‌نامی‌ها',
      icon: Layers,
      badge: 'کلاسی / سانسی',
    },
    {
      value: 'SWIMMERS_MALE',
      label: 'فقط شناگران پسر / آقایان',
      description: 'ارسال پیام اختصاصی فقط به کارتابل شناگران پسر',
      icon: User,
      badge: 'آقایان',
    },
    {
      value: 'SWIMMERS_FEMALE',
      label: 'فقط شناگران دختر / بانوان',
      description: 'ارسال پیام اختصاصی فقط به کارتابل شناگران دختر',
      icon: User,
      badge: 'بانوان',
    },
  ];

  // Coach subcategories options
  const coachAudienceOptions = [
    {
      value: 'COACHES',
      label: 'کلیه کادر مربیان آموزشگاه',
      description: 'ارسال اطلاعیه درون‌برنامه‌ای به تمام مربیان فعال',
      icon: GraduationCap,
      badge: 'همه مربیان',
    },
    {
      value: 'COACHES_MALE',
      label: 'فقط مربیان آقا',
      description: 'ارسال اطلاعیه اختصاصی فقط به مربیان آقا',
      icon: User,
      badge: 'مربیان آقا',
    },
    {
      value: 'COACHES_FEMALE',
      label: 'فقط مربیان خانم',
      description: 'ارسال اطلاعیه اختصاصی فقط به مربیان خانم',
      icon: User,
      badge: 'مربیان خانم',
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

  // Handler for changing audience group (عمومی / شناگران / مربیان)
  const handleAudienceGroupChange = (group) => {
    if (group === 'ALL') {
      setForm((prev) => ({
        ...prev,
        audienceGroup: 'ALL',
        audience: 'ALL',
        target_group: '',
      }));
    } else if (group === 'SWIMMERS') {
      setForm((prev) => ({
        ...prev,
        audienceGroup: 'SWIMMERS',
        audience: 'SWIMMERS',
        target_group: '',
      }));
    } else if (group === 'COACHES') {
      setForm((prev) => ({
        ...prev,
        audienceGroup: 'COACHES',
        audience: 'COACHES',
        target_group: '',
      }));
    }
  };

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
        is_pinned: form.is_important_sms,
        send_sms: form.is_important_sms,
      };

      await api.post('/content/announcements/', payload);
      toast.success(
        form.is_important_sms
          ? 'پیام اعلان ثبت شد، نوتیفیکیشن سیستمی منتشر گردید و پیامک به مخاطبان ارسال شد.'
          : 'پیام اعلان با موفقیت ثبت و نوتیفیکیشن سیستمی آن منتشر شد.'
      );
      navigate('/admin/announcements?tab=announcements');
    } catch (err) {
      console.error('Create announcement error:', err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت و ارسال پیام اعلان');
    } finally {
      setSubmitting(false);
    }
  };

  const getAudienceDisplayLabel = () => {
    if (form.audience === 'ALL') return 'همه اعضای آموزشگاه (عمومی)';
    if (form.audience === 'SWIMMERS') return 'کلیه شناگران آموزشگاه';
    if (form.audience === 'SWIMMERS_MALE') return 'فقط شناگران پسر';
    if (form.audience === 'SWIMMERS_FEMALE') return 'فقط شناگران دختر';
    if (form.audience === 'COACHES') return 'کلیه کادر مربیان';
    if (form.audience === 'COACHES_MALE') return 'فقط مربیان آقا';
    if (form.audience === 'COACHES_FEMALE') return 'فقط مربیان خانم';
    if (form.audience === 'GROUP') {
      return selectedGroup
        ? `کلاس: ${selectedGroup.course_name ? `${selectedGroup.course_name} - ` : ''}${selectedGroup.name}`
        : 'یک کلاس آموزشی مشخص';
    }
    return 'مخاطبان هدف';
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
              ارسال پیام جدید
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/70 border border-sky-200/70 dark:border-sky-800 text-sky-600 dark:text-sky-400">
              <Send className="w-5 h-5" />
            </div>
            <span>ارسال پیام و اعلان جدید</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            ارسال پیام به تفکیک دسته‌بندی شناگران و مربیان به همراه اطلاع‌رسانی پیامکی
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/admin/announcements')}
          className="gap-2 text-xs self-start sm:self-auto cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به لیست اعلان‌ها</span>
        </Button>
      </div>

      {/* 2. Main Form & Live Preview Grid */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Left Form Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-6">
              
              {/* ======================================================== */}
              {/* بخش ۱: عنوان (Title)                                     */}
              {/* ======================================================== */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    ۱. عنوان پیام اعلان <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    {form.title.length} / ۱۸۰
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={180}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="مثال: یادآوری تغییر زمان سانس‌های آموزشی و تعطیلی هفته آینده..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              {/* ======================================================== */}
              {/* بخش ۲: متن (Message Content)                             */}
              {/* ======================================================== */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    ۲. متن کامل پیام اعلان <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    {form.message.length} نویسه
                  </span>
                </div>
                <textarea
                  rows={6}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="متن کامل پیام اطلاع‌رسانی، شرایط حضور، تغییرات ساعت، تذکرات لازم یا نکات بهداشتی و آموزشی را بنویسید..."
                  className="w-full px-3.5 py-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 leading-relaxed"
                />
              </div>

              {/* ======================================================== */}
              {/* بخش ۳: مخاطبین (Audience with Swimmer & Coach Categories) */}
              {/* ======================================================== */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    ۳. مخاطبین هدف (دسته‌بندی‌های شناگران و مربیان) <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2.5">
                    تعیین کنید پیام برای کدام گروه یا دسته‌بندی اختصاصی ارسال شود:
                  </p>
                </div>

                {/* Main 3 Segmented Selector */}
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => handleAudienceGroupChange('ALL')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                      form.audienceGroup === 'ALL'
                        ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs border border-sky-200/70 dark:border-sky-800'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>همه اعضا (عمومی)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAudienceGroupChange('SWIMMERS')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                      form.audienceGroup === 'SWIMMERS'
                        ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs border border-sky-200/70 dark:border-sky-800'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>دسته‌بندی شناگران</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAudienceGroupChange('COACHES')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                      form.audienceGroup === 'COACHES'
                        ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs border border-sky-200/70 dark:border-sky-800'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>دسته‌بندی مربیان</span>
                  </button>
                </div>

                {/* Subcategories for Swimmers */}
                {form.audienceGroup === 'SWIMMERS' && (
                  <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 animate-in fade-in-50 duration-200">
                    <CustomSelect
                      label="زیرمجموعه مخاطبان شناگر *"
                      value={form.audience}
                      onChange={(val) => setForm({ ...form, audience: val, target_group: '' })}
                      options={swimmerAudienceOptions}
                      menuClassName="w-full"
                      placeholder="انتخاب دسته‌بندی شناگران..."
                    />

                    {/* If specific group is chosen */}
                    {form.audience === 'GROUP' && (
                      <div className="p-3.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/70 space-y-2 animate-in fade-in-50 duration-150">
                        <CustomSelect
                          label="انتخاب کلاس یا گروه آموزشی *"
                          value={form.target_group}
                          onChange={(val) => setForm({ ...form, target_group: val })}
                          options={groupOptions}
                          searchable={true}
                          icon={BookOpen}
                          menuClassName="w-full"
                          placeholder={loadingGroups ? 'در حال بارگذاری کلاس‌ها...' : 'جستجو و انتخاب کلاس یا سانس...'}
                        />
                        <p className="text-[11px] text-sky-700 dark:text-sky-300">
                          پیام فقط برای شناگرانی که در این سانس ثبت‌نام دارند و مربی آن نمایش داده می‌شود.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Subcategories for Coaches */}
                {form.audienceGroup === 'COACHES' && (
                  <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 animate-in fade-in-50 duration-200">
                    <CustomSelect
                      label="زیرمجموعه مخاطبان مربی *"
                      value={form.audience}
                      onChange={(val) => setForm({ ...form, audience: val, target_group: '' })}
                      options={coachAudienceOptions}
                      menuClassName="w-full"
                      placeholder="انتخاب دسته‌بندی مربیان..."
                    />
                  </div>
                )}
              </div>

              {/* ======================================================== */}
              {/* بخش ۴ و نهایی: مهم است (ارسال پیامک)                     */}
              {/* ======================================================== */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                  ۴. فوریت و اولویت انتشار
                </label>

                <div
                  onClick={() => setForm({ ...form, is_important_sms: !form.is_important_sms })}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3.5 ${
                    form.is_important_sms
                      ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/80 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className={`mt-0.5 p-2 rounded-xl shrink-0 transition-colors ${
                    form.is_important_sms
                      ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                      : 'bg-slate-200/70 dark:bg-slate-700/60 text-slate-400'
                  }`}>
                    <Smartphone className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        مهم است (ارسال پیامک به مخاطبان)
                      </span>
                      {form.is_important_sms ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/70 dark:bg-amber-900/70 text-amber-900 dark:text-amber-100 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>پیامک + پین طلایی فعال</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">
                          اعلان عادی درون‌برنامه‌ای
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      با فعال بودن این گزینه، علاوه بر پین شدن در بالاترین بخش کارتابل، پیامک اطلاع‌رسانی فوری به شماره همراه مخاطبان ارسال می‌شود.
                    </p>
                  </div>

                  <div className="shrink-0 self-center">
                    <input
                      type="checkbox"
                      id="is_important_sms"
                      checked={form.is_important_sms}
                      onChange={(e) => setForm({ ...form, is_important_sms: e.target.checked })}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 rounded-md text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />
                  </div>
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
                <span>
                  {submitting
                    ? 'در حال ارسال و انتشار...'
                    : form.is_important_sms
                    ? 'ارسال پیامک و انتشار اعلان مهم'
                    : 'ارسال و انتشار اعلان'}
                </span>
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
                  <span>پیش‌نمایش زنده در کارتابل مخاطب</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>زنده</span>
                </div>
              </div>

              {/* Simulated Card */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  form.is_important_sms
                    ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-200 dark:border-amber-900/60 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {form.is_important_sms && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">
                        <Pin className="w-3 h-3 rotate-45" />
                        مهم و پین‌شده
                      </span>
                    )}
                    {form.is_important_sms && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/60 px-2 py-0.5 rounded-md">
                        <Smartphone className="w-3 h-3" />
                        پیامک
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
                      {getAudienceDisplayLabel()}
                    </Badge>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    امروز
                  </span>
                </div>

                <div className="pt-3 space-y-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                    {form.title.trim() || 'عنوان پیام اعلان در این قسمت قرار می‌گیرد...'}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {form.message.trim() || 'متن کامل اعلان و جزئیات پیام به صورت مرتب در کارتابل شناگر یا مربی نمایش داده خواهد شد.'}
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 dark:text-slate-500 pt-1 leading-relaxed">
                این کارت پیش‌نمایش دقیق همان چیزی است که دریافت‌کنندگان در کارتابل خود مشاهده می‌کنند.
              </div>
            </div>

            {/* Quick Tips Box */}
            <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/20 rounded-2xl border border-sky-200/60 dark:border-sky-800/60 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-900 dark:text-sky-200">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>نکات انتشار پیام</span>
              </div>

              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>عنوان و متن:</strong> در ابتدا قرار دارند تا محتوا را با دقت تدوین کنید.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>دسته‌بندی شناگران:</strong> امکان ارسال به همه، تفکیک جنسیت (پسر/دختر) یا یک کلاس مشخص.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>دسته‌بندی مربیان:</strong> امکان ارسال به کلیه مربیان، مربیان آقا یا مربیان خانم.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>مهم است (ارسال پیامک):</strong> اعلان را در صدر پرتال پین کرده و پیامک ارسال می‌کند.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
