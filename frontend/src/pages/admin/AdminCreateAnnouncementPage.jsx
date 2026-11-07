import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell, Send, Pin, Users, User, Layers, BookOpen,
  ArrowRight, GraduationCap, Sparkles, CheckCircle2,
  Info, AlertCircle, Eye, Calendar, Clock, Check,
  Smartphone, MessageSquare, CheckCheck, Shield, Search
} from 'lucide-react';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';

export const AdminCreateAnnouncementPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Form State: 1. Title, 2. Message, 3. Tickable Audience, 4. Important (Send SMS)
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  // Audience Checkbox States
  const [sendToAll, setSendToAll] = useState(false); // همه اعضای آموزشگاه (عمومی)

  // Swimmer Checkboxes
  const [allSwimmers, setAllSwimmers] = useState(false); // کلیه شناگران
  const [swimmersMale, setSwimmersMale] = useState(false); // شناگران پسر
  const [swimmersFemale, setSwimmersFemale] = useState(false); // شناگران دختر
  const [filterByGroups, setFilterByGroups] = useState(false); // کلاس‌های خاص
  const [selectedGroupIds, setSelectedGroupIds] = useState([]); // شناسه‌های کلاس‌های تیک‌خورده

  // Coach Checkboxes
  const [allCoaches, setAllCoaches] = useState(false); // کلیه مربیان
  const [coachesMale, setCoachesMale] = useState(false); // مربیان آقا
  const [coachesFemale, setCoachesFemale] = useState(false); // مربیان خانم
  const [filterByCoaches, setFilterByCoaches] = useState(false); // مربیان خاص
  const [selectedCoachIds, setSelectedCoachIds] = useState([]); // مربیان تیک‌خورده

  // 4. Important (Send SMS)
  const [isImportantSms, setIsImportantSms] = useState(false);

  // Data fetching
  const [groups, setGroups] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [coachSearchQuery, setCoachSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const [grpRes, coachRes] = await Promise.allSettled([
          api.get('/education/groups/'),
          api.get('/coaches/'),
        ]);

        if (grpRes.status === 'fulfilled') {
          const list = Array.isArray(grpRes.value.data) ? grpRes.value.data : grpRes.value.data?.results || [];
          setGroups(list);
        }
        if (coachRes.status === 'fulfilled') {
          const cList = Array.isArray(coachRes.value.data) ? coachRes.value.data : coachRes.value.data?.results || [];
          setCoaches(cList);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // Filtered Groups for search
  const filteredGroups = useMemo(() => {
    if (!groupSearchQuery.trim()) return groups;
    const q = groupSearchQuery.trim().toLowerCase();
    return groups.filter(
      (g) =>
        g.name?.toLowerCase().includes(q) ||
        g.course_name?.toLowerCase().includes(q) ||
        g.coach_name?.toLowerCase().includes(q)
    );
  }, [groups, groupSearchQuery]);

  // Filtered Coaches for search
  const filteredCoaches = useMemo(() => {
    if (!coachSearchQuery.trim()) return coaches;
    const q = coachSearchQuery.trim().toLowerCase();
    return coaches.filter(
      (c) =>
        c.full_name?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q)
    );
  }, [coaches, coachSearchQuery]);

  // Handlers for checkboxes
  const handleToggleSendToAll = () => {
    const next = !sendToAll;
    setSendToAll(next);
    if (next) {
      // Clear specific category checkboxes to avoid redundant selections
      setAllSwimmers(false);
      setSwimmersMale(false);
      setSwimmersFemale(false);
      setFilterByGroups(false);
      setSelectedGroupIds([]);

      setAllCoaches(false);
      setCoachesMale(false);
      setCoachesFemale(false);
      setFilterByCoaches(false);
      setSelectedCoachIds([]);
    }
  };

  const handleToggleGroup = (groupId) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSelectAllGroups = () => {
    setSelectedGroupIds(groups.map((g) => g.id));
  };

  const handleClearAllGroups = () => {
    setSelectedGroupIds([]);
  };

  const handleToggleCoach = (coachId) => {
    setSelectedCoachIds((prev) =>
      prev.includes(coachId) ? prev.filter((id) => id !== coachId) : [...prev, coachId]
    );
  };

  // Determine current active audience value to send to backend
  const resolvedAudienceInfo = useMemo(() => {
    if (sendToAll) {
      return {
        audience: 'ALL',
        label: 'همه اعضای آموزشگاه (عمومی)',
        groups: [],
      };
    }

    const hasSwimmers = allSwimmers || swimmersMale || swimmersFemale || (filterByGroups && selectedGroupIds.length > 0);
    const hasCoaches = allCoaches || coachesMale || coachesFemale || (filterByCoaches && selectedCoachIds.length > 0);

    if (hasSwimmers && hasCoaches) {
      // Both swimmers and coaches selected
      return {
        audience: 'ALL',
        label: 'شناگران و کادر مربیان منتخب',
        groups: selectedGroupIds,
      };
    }

    if (hasSwimmers) {
      if (filterByGroups && selectedGroupIds.length > 0) {
        return {
          audience: 'GROUP',
          label: `${selectedGroupIds.length} کلاس آموزشی مشخص`,
          groups: selectedGroupIds,
        };
      }
      if (allSwimmers || (swimmersMale && swimmersFemale)) {
        return { audience: 'SWIMMERS', label: 'کلیه شناگران آموزشگاه', groups: [] };
      }
      if (swimmersMale) {
        return { audience: 'SWIMMERS_MALE', label: 'فقط شناگران پسر (آقایان)', groups: [] };
      }
      if (swimmersFemale) {
        return { audience: 'SWIMMERS_FEMALE', label: 'فقط شناگران دختر (بانوان)', groups: [] };
      }
      return { audience: 'SWIMMERS', label: 'شناگران منتخب', groups: [] };
    }

    if (hasCoaches) {
      if (allCoaches || (coachesMale && coachesFemale)) {
        return { audience: 'COACHES', label: 'کلیه کادر مربیان', groups: [] };
      }
      if (coachesMale) {
        return { audience: 'COACHES_MALE', label: 'فقط مربیان آقا', groups: [] };
      }
      if (coachesFemale) {
        return { audience: 'COACHES_FEMALE', label: 'فقط مربیان خانم', groups: [] };
      }
      if (filterByCoaches && selectedCoachIds.length > 0) {
        return { audience: 'COACHES', label: `${selectedCoachIds.length} مربی مشخص`, groups: [] };
      }
      return { audience: 'COACHES', label: 'کادر مربیان', groups: [] };
    }

    return {
      audience: '',
      label: 'هیچ مخاطبی تیک نخورده است',
      groups: [],
    };
  }, [
    sendToAll, allSwimmers, swimmersMale, swimmersFemale,
    filterByGroups, selectedGroupIds,
    allCoaches, coachesMale, coachesFemale,
    filterByCoaches, selectedCoachIds
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('لطفاً عنوان پیام اعلان را وارد فرمایید.');
      return;
    }
    if (!message.trim()) {
      toast.error('متن کامل پیام اعلان الزامی است.');
      return;
    }

    if (!resolvedAudienceInfo.audience) {
      toast.error('لطفاً حداقل یک دسته از مخاطبان را تیک بزنید.');
      return;
    }

    if (filterByGroups && selectedGroupIds.length === 0 && !allSwimmers && !swimmersMale && !swimmersFemale) {
      toast.error('لطفاً حداقل یک کلاس آموزشی را از لیست تیک بزنید.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        message: message.trim(),
        audience: resolvedAudienceInfo.audience,
        target_group: selectedGroupIds.length > 0 ? selectedGroupIds[0] : null,
        target_group_ids: selectedGroupIds,
        is_pinned: isImportantSms,
        send_sms: isImportantSms,
      };

      await api.post('/content/announcements/', payload);
      toast.success(
        isImportantSms
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
            تعیین عنوان، متن، تیک زدن مخاطبان هدف و ارسال فوری پیامک
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
                    {title.length} / ۱۸۰
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={180}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
                    {message.length} نویسه
                  </span>
                </div>
                <textarea
                  rows={5}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="متن کامل پیام اطلاع‌رسانی، شرایط حضور، تغییرات ساعت، تذکرات لازم یا نکات بهداشتی و آموزشی را بنویسید..."
                  className="w-full px-3.5 py-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 leading-relaxed"
                />
              </div>

              {/* ======================================================== */}
              {/* بخش ۳: مخاطبین (کاملاً تیک‌زدنی / Checkboxes Only)         */}
              {/* ======================================================== */}
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      ۳. مخاطبین هدف (انتخاب به صورت تیک‌زدنی) <span className="text-rose-500">*</span>
                    </label>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      مخاطبان مورد نظر خود را با تیک زدن انتخاب نمایید:
                    </p>
                  </div>
                </div>

                {/* گزینه عمومی: همه اعضای آموزشگاه */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                    sendToAll
                      ? 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-300 dark:border-sky-700 shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={sendToAll}
                    onChange={handleToggleSendToAll}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        همه اعضای آموزشگاه (عمومی)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300">
                        شامل تمام کاربران
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      ارسال اعلان به کلیه شناگران، مربیان و مدیران حاضر در سامانه
                    </p>
                  </div>
                </label>

                {/* دو کادر دسته‌بندی شناگران و مربیان */}
                <div className={`space-y-4 transition-opacity ${sendToAll ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                  
                  {/* --- کادر دسته‌بندی شناگران --- */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span>دسته‌بندی شناگران:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* کلیه شناگران */}
                      <label
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                          allSwimmers
                            ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 text-sky-900 dark:text-sky-100 font-bold'
                            : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={allSwimmers}
                          onChange={(e) => {
                            setAllSwimmers(e.target.checked);
                            if (e.target.checked) setSendToAll(false);
                          }}
                          className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                        <span>کلیه شناگران آموزشگاه</span>
                      </label>

                      {/* شناگران پسر */}
                      <label
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                          swimmersMale
                            ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 text-sky-900 dark:text-sky-100 font-bold'
                            : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={swimmersMale}
                          onChange={(e) => {
                            setSwimmersMale(e.target.checked);
                            if (e.target.checked) setSendToAll(false);
                          }}
                          className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                        <span>فقط شناگران پسر (آقایان)</span>
                      </label>

                      {/* شناگران دختر */}
                      <label
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                          swimmersFemale
                            ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 text-sky-900 dark:text-sky-100 font-bold'
                            : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={swimmersFemale}
                          onChange={(e) => {
                            setSwimmersFemale(e.target.checked);
                            if (e.target.checked) setSendToAll(false);
                          }}
                          className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                        <span>فقط شناگران دختر (بانوان)</span>
                      </label>
                    </div>

                    {/* چک‌باکس انتخاب کلاس‌های مشخص */}
                    <div className="pt-1">
                      <label
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                          filterByGroups
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700 text-indigo-950 dark:text-indigo-100 font-bold'
                            : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={filterByGroups}
                          onChange={(e) => {
                            setFilterByGroups(e.target.checked);
                            if (e.target.checked) setSendToAll(false);
                          }}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div className="flex items-center justify-between flex-1">
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span>انتخاب کلاس‌ها یا سانس‌های آموزشی خاص</span>
                          </span>
                          {selectedGroupIds.length > 0 && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-200/70 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 font-mono">
                              {selectedGroupIds.length} کلاس انتخاب شد
                            </span>
                          )}
                        </div>
                      </label>

                      {/* لیست تیک‌زدنی کلاس‌ها */}
                      {filterByGroups && (
                        <div className="mt-2.5 p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-900/80 border border-indigo-100 dark:border-indigo-950 space-y-3 animate-in fade-in-50 duration-200">
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                            <div className="relative flex-1">
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={groupSearchQuery}
                                onChange={(e) => setGroupSearchQuery(e.target.value)}
                                placeholder="جستجوی سریع کلاس یا مربی..."
                                className="w-full pr-8 pl-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                              />
                            </div>

                            <div className="flex items-center gap-2 text-[11px] shrink-0">
                              <button
                                type="button"
                                onClick={handleSelectAllGroups}
                                className="px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold hover:bg-indigo-200 transition-colors cursor-pointer"
                              >
                                انتخاب همه کلاس‌ها
                              </button>
                              <button
                                type="button"
                                onClick={handleClearAllGroups}
                                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                پاک کردن
                              </button>
                            </div>
                          </div>

                          {/* چک‌باکس‌های کلاس‌ها */}
                          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                            {filteredGroups.length === 0 ? (
                              <div className="p-3 text-center text-xs text-slate-400">
                                کلاسی یافت نشد.
                              </div>
                            ) : (
                              filteredGroups.map((grp) => {
                                const isChecked = selectedGroupIds.includes(grp.id);
                                return (
                                  <label
                                    key={grp.id}
                                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                                      isChecked
                                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 text-indigo-950 dark:text-indigo-100 font-bold'
                                        : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleGroup(grp.id)}
                                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer mt-0.5"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="truncate">
                                          {grp.course_name ? `${grp.course_name} - ` : ''}{grp.name}
                                        </span>
                                        {grp.gender_display && (
                                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                                            {grp.gender_display}
                                          </span>
                                        )}
                                      </div>
                                      {grp.coach_name && (
                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">
                                          مربی: {grp.coach_name} {grp.schedule ? ` | ${grp.schedule}` : ''}
                                        </div>
                                      )}
                                    </div>
                                  </label>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* --- کادر دسته‌بندی مربیان --- */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                        <GraduationCap className="w-3.5 h-3.5" />
                      </div>
                      <span>دسته‌بندی مربیان:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* کلیه مربیان */}
                      <label
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                          allCoaches
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-900 dark:text-emerald-100 font-bold'
                            : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={allCoaches}
                          onChange={(e) => {
                            setAllCoaches(e.target.checked);
                            if (e.target.checked) setSendToAll(false);
                          }}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span>کلیه کادر مربیان</span>
                      </label>

                      {/* مربیان آقا */}
                      <label
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                          coachesMale
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-900 dark:text-emerald-100 font-bold'
                            : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={coachesMale}
                          onChange={(e) => {
                            setCoachesMale(e.target.checked);
                            if (e.target.checked) setSendToAll(false);
                          }}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span>فقط مربیان آقا</span>
                      </label>

                      {/* مربیان خانم */}
                      <label
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                          coachesFemale
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-900 dark:text-emerald-100 font-bold'
                            : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={coachesFemale}
                          onChange={(e) => {
                            setCoachesFemale(e.target.checked);
                            if (e.target.checked) setSendToAll(false);
                          }}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span>فقط مربیان خانم</span>
                      </label>
                    </div>

                    {/* چک‌باکس انتخاب مربیان خاص */}
                    <div className="pt-1">
                      <label
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                          filterByCoaches
                            ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-300 dark:border-teal-700 text-teal-950 dark:text-teal-100 font-bold'
                            : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={filterByCoaches}
                          onChange={(e) => {
                            setFilterByCoaches(e.target.checked);
                            if (e.target.checked) setSendToAll(false);
                          }}
                          className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                        <div className="flex items-center justify-between flex-1">
                          <span className="flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                            <span>انتخاب مربیان خاص</span>
                          </span>
                          {selectedCoachIds.length > 0 && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-200/70 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 font-mono">
                              {selectedCoachIds.length} مربی انتخاب شد
                            </span>
                          )}
                        </div>
                      </label>

                      {/* لیست تیک‌زدنی مربیان */}
                      {filterByCoaches && (
                        <div className="mt-2.5 p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-900/80 border border-teal-100 dark:border-teal-950 space-y-2 animate-in fade-in-50 duration-200">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {coaches.map((c) => {
                              const isChecked = selectedCoachIds.includes(c.id);
                              return (
                                <label
                                  key={c.id}
                                  className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                                    isChecked
                                      ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-400 text-teal-950 dark:text-teal-100 font-bold'
                                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleCoach(c.id)}
                                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                                  />
                                  <span>{c.full_name}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* ======================================================== */}
              {/* بخش ۴ و نهایی: مهم است (ارسال پیامک)                     */}
              {/* ======================================================== */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                  ۴. فوریت و اولویت انتشار
                </label>

                <div
                  onClick={() => setIsImportantSms(!isImportantSms)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3.5 ${
                    isImportantSms
                      ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/80 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className={`mt-0.5 p-2 rounded-xl shrink-0 transition-colors ${
                    isImportantSms
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
                      {isImportantSms ? (
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
                      checked={isImportantSms}
                      onChange={(e) => setIsImportantSms(e.target.checked)}
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
                    : isImportantSms
                    ? 'ارسال پیامک و انتشار اعلان مهم'
                    : 'ارسال و انتشار اعلان'}
                </span>
              </Button>
            </div>
          </div>

          {/* Right Sidebar Column: Live Preview & Summary (1 Col) */}
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
                  isImportantSms
                    ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-200 dark:border-amber-900/60 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isImportantSms && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">
                        <Pin className="w-3 h-3 rotate-45" />
                        مهم و پین‌شده
                      </span>
                    )}
                    {isImportantSms && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/60 px-2 py-0.5 rounded-md">
                        <Smartphone className="w-3 h-3" />
                        پیامک
                      </span>
                    )}
                    <Badge
                      variant={
                        sendToAll
                          ? 'info'
                          : selectedGroupIds.length > 0
                          ? 'warning'
                          : 'neutral'
                      }
                    >
                      {resolvedAudienceInfo.label}
                    </Badge>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    امروز
                  </span>
                </div>

                <div className="pt-3 space-y-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                    {title.trim() || 'عنوان پیام اعلان در این قسمت قرار می‌گیرد...'}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {message.trim() || 'متن کامل اعلان و جزئیات پیام به صورت مرتب در کارتابل شناگر یا مربی نمایش داده خواهد شد.'}
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
                <span>مزایای انتخاب تیک‌زدنی</span>
              </div>

              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>بدون نیاز به دراپ‌داون، تمام دسته‌بندی‌ها مستقیماً با تیک زدن در دسترس هستند.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>امکان انتخاب همزمان چند کلاس آموزشی با چک‌باکس و جستجوی سریع.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>امکان تفکیک جنسیت شناگران و مربیان با تیک‌های مجزا.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
