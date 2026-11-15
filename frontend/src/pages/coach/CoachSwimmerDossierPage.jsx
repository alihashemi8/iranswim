import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import {
  TrendingUp, Award, Calendar, ChevronLeft,
  PlusCircle, Users, UserCheck, X, Video,
  Timer, CheckCircle2, Clock, AlertCircle,
  Sparkles, Phone, Search, LayoutGrid, Check, ArrowLeft
} from 'lucide-react';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { CustomSelect } from '../../components/common/CustomSelect';
import { LoadingState } from '../../components/common/LoadingState';
import { BackButton } from '../../components/common/BackButton';
import { useToast } from '../../context/ToastContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { toShamsiDate } from '../../utils/date';
import { SwimmerAvatar } from '../../components/common/SwimmerAvatarInfo';

export const CoachSwimmerDossierPage = () => {
  const { swimmerId } = useParams();
  const [data, setData] = useState(null);
  const [loadedSwimmerId, setLoadedSwimmerId] = useState(null);
  const loading = loadedSwimmerId !== swimmerId;

  // Active view tab: 'all' | 'skills' | 'records' | 'videos'
  const [activeTab, setActiveTab] = useState('all');

  // Skill search & filter state
  const [skillSearch, setSkillSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('ALL'); // 'ALL' | 'PASSED' | 'IN_PROGRESS' | 'FAILED'

  // Promotion proposal modal state
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [targetLevelId, setTargetLevelId] = useState('');
  const [coachNotes, setCoachNotes] = useState('');
  const [submittingPromotion, setSubmittingPromotion] = useState(false);

  const toast = useToast();

  useBodyScrollLock(showPromotionModal);

  useEffect(() => {
    if (!showPromotionModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowPromotionModal(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showPromotionModal]);

  const loadDossierData = useCallback(async () => {
    const res = await api.get(`/coaches/swimmer-dossier/${swimmerId}/`);
    return res.data;
  }, [swimmerId]);

  const applyDossierResult = useCallback((dossier) => {
    setData(dossier);
  }, []);

  useEffect(() => {
    let active = true;

    loadDossierData()
      .then((res) => {
        if (!active) return;
        applyDossierResult(res);
      })
      .catch((err) => {
        if (!active) return;
        setData(null);
        console.error('Error fetching swimmer dossier:', err);
        toast.error('خطا در دریافت پرونده مهارتی شناگر');
      })
      .finally(() => {
        if (active) setLoadedSwimmerId(swimmerId);
      });

    return () => {
      active = false;
    };
  }, [swimmerId, loadDossierData, applyDossierResult, toast]);

  const refreshDossier = useCallback(async () => {
    try {
      const res = await loadDossierData();
      applyDossierResult(res);
    } catch (err) {
      console.error('Error refreshing swimmer dossier:', err);
      toast.error('خطا در بروزرسانی پرونده مهارتی شناگر');
    }
  }, [loadDossierData, applyDossierResult, toast]);

  // Submit Level Promotion Proposal
  const handleSavePromotion = async (e) => {
    e.preventDefault();
    if (!data?.swimmer?.current_level_id) {
      toast.error('ابتدا باید سطح فعلی شناگر در پرونده ثبت شده باشد.');
      return;
    }
    if (!targetLevelId || !coachNotes.trim()) {
      toast.error('لطفاً سطح پیشنهادی و دلیل ارتقا را وارد فرمایید.');
      return;
    }
    try {
      setSubmittingPromotion(true);
      await api.post('/assessments/promotions/', {
        swimmer: Number(swimmerId),
        current_level: data.swimmer.current_level_id,
        proposed_level: Number(targetLevelId),
        coach_notes: coachNotes.trim(),
      });
      toast.success('پیشنهاد ارتقای سطح برای تأیید مدیر آموزشگاه ارسال شد.');
      setShowPromotionModal(false);
      setTargetLevelId('');
      setCoachNotes('');
      await refreshDossier();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت پیشنهاد ارتقا');
    } finally {
      setSubmittingPromotion(false);
    }
  };

  const swimmer = data?.swimmer || {};
  const assessments = data?.assessments || [];
  const records = data?.records || [];
  const videos = data?.videos || [];
  const attSummary = data?.attendance_summary || {};
  const skillLevels = data?.skill_levels || [];

  const passedAssessmentsCount = useMemo(
    () => assessments.filter((a) => a.status === 'PASSED').length,
    [assessments]
  );

  const promotionLevelOptions = useMemo(() => {
    return skillLevels.map((lvl) => {
      const isCurrent =
        swimmer.current_level_id != null && Number(lvl.id) === Number(swimmer.current_level_id);
      return {
        value: String(lvl.id),
        label: lvl.name,
        badge: `سطح ${lvl.order}`,
        description: isCurrent ? 'سطح فعلی شناگر' : undefined,
        disabled: isCurrent,
        icon: Award,
      };
    });
  }, [skillLevels, swimmer.current_level_id]);

  // Filtered skills
  const filteredAssessments = useMemo(() => {
    return assessments.filter((a) => {
      const matchSearch =
        !skillSearch.trim() ||
        (a.skill_name && a.skill_name.toLowerCase().includes(skillSearch.toLowerCase())) ||
        (a.level_name && a.level_name.toLowerCase().includes(skillSearch.toLowerCase())) ||
        (a.feedback && a.feedback.toLowerCase().includes(skillSearch.toLowerCase()));

      const matchFilter = skillFilter === 'ALL' || a.status === skillFilter;
      return matchSearch && matchFilter;
    });
  }, [assessments, skillSearch, skillFilter]);

  if (loading) {
    return <LoadingState type="dashboard" message="در حال بارگذاری پرونده مهارتی و عملکرد شناگر..." />;
  }

  if (!data) {
    return (
      <div className="coach-panel bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center py-16 px-6 max-w-xl mx-auto space-y-5 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
          <Users className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            شناگر یافت نشد
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            شناگر مورد نظر در سیستم ثبت نشده است یا شما به عنوان مربی دسترسی به پرونده او ندارید.
          </p>
        </div>
        <div className="pt-2">
          <BackButton to="/coach/progress" label="بازگشت به فهرست پیشرفت" showLabelAlways />
        </div>
      </div>
    );
  }

  const attendanceRate = attSummary.attendance_rate ?? 100;
  const totalSessions = attSummary.total_sessions ?? 0;
  const presentCount = attSummary.present ?? 0;
  const absentCount = attSummary.absent ?? 0;
  const excusedCount = attSummary.excused ?? 0;
  const lateCount = attSummary.late ?? 0;

  return (
    <div className="space-y-5 sm:space-y-6 pb-14 coach-panel max-w-7xl mx-auto">
      {/* 1. Top Breadcrumb & Return Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <BackButton
            to="/coach/progress"
            label="بازگشت"
            title="بازگشت به فهرست ارزیابی و پیشرفت شناگران"
            color="emerald"
          />
          <nav aria-label="مسیر راهنما" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 min-w-0">
            <Link
              to="/coach/progress"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold transition-colors truncate"
            >
              ارزیابی و پیشرفت شناگران
            </Link>
            <ChevronLeft className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
            <span className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-[170px] sm:max-w-xs">
              {swimmer.full_name}
            </span>
          </nav>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>پرونده فعال شناگر</span>
        </div>
      </div>

      {/* 2. Swimmer Profile Hero Card */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 lg:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Soft background accents */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl from-sky-500/5 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Swimmer Info (Right in RTL) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 min-w-0 flex-1">
            <div className="relative shrink-0">
              <SwimmerAvatar
                fullName={swimmer.full_name}
                avatar={swimmer.avatar}
                size="lg"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ring-4 ring-emerald-500/15 dark:ring-emerald-500/20 shadow-md text-2xl font-black"
              />
              <div
                className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] text-white shadow-xs"
                title="شناگر فعال آکادمی"
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            </div>

            <div className="min-w-0 space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {swimmer.full_name}
                </h1>
                {swimmer.gender && (
                  <span className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-200/80 dark:border-slate-700">
                    {swimmer.gender}
                  </span>
                )}
              </div>

              {/* Badges / Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {/* Level Chip */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 text-xs sm:text-sm font-bold shadow-2xs">
                  <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>سطح فعلی: {swimmer.current_level_name || 'تعیین‌نشده'}</span>
                </div>

                {/* Age & Birthdate Chip */}
                {(swimmer.age || swimmer.date_of_birth) && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span>
                      {swimmer.age ? `${swimmer.age} ساله` : ''}
                      {swimmer.age && swimmer.date_of_birth ? ' · ' : ''}
                      {swimmer.date_of_birth ? toShamsiDate(swimmer.date_of_birth).shortNumeric : ''}
                    </span>
                  </div>
                )}

                {/* Guardian Phone for coach emergency */}
                {swimmer.guardian_phone && swimmer.guardian_phone !== 'ثبت‌نشده' && (
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700/70 text-xs"
                    title="شماره تماس ولی یا اضطراری"
                  >
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span dir="ltr" className="font-mono">{swimmer.guardian_phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons Hub (Left in RTL) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex items-center gap-2.5 lg:shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
            {/* Primary Action: Record Skill Assessment */}
            <Link
              to={`/coach/progress/${swimmerId}/assessment`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow-md hover:shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer min-h-[44px]"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>ثبت ارزیابی مهارت</span>
            </Link>

            {/* Secondary Action 1: Propose Level Promotion */}
            <button
              type="button"
              onClick={() => setShowPromotionModal(true)}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/80 text-xs sm:text-sm font-bold active:scale-95 transition-all cursor-pointer min-h-[44px]"
            >
              <Award className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>پیشنهاد ارتقای سطح</span>
            </button>

            {/* Secondary Action 2: Upload Swimming Video */}
            <Link
              to={`/coach/records?swimmer=${swimmerId}&tab=video`}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/50 dark:hover:bg-sky-900/60 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-800/80 text-xs sm:text-sm font-bold active:scale-95 transition-all cursor-pointer min-h-[44px]"
            >
              <Video className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>آپلود فیلم شنا</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Analytics & KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-5">
        {/* Card 1: Attendance Rate */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700/70 transition-all flex flex-col justify-between gap-3 group">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
              درصد حضور در جلسات
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/70 shrink-0 group-hover:scale-105 transition-transform">
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                <span className="font-mono tabular-nums">{attendanceRate}</span>٪
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                {attendanceRate >= 80 ? 'حضور منظم' : 'نیاز به پیگیری'}
              </span>
            </div>

            {/* Attendance Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  attendanceRate >= 80
                    ? 'bg-emerald-500'
                    : attendanceRate >= 60
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, attendanceRate))}%` }}
              />
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2 flex items-center justify-between">
              <span>{presentCount} جلسه حاضر</span>
              <span>از {totalSessions} جلسه ثبت‌شده</span>
            </div>
          </div>
        </div>

        {/* Card 2: Absences & Excuses */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between gap-3 group">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
              وضعیت غیبت و تأخیر
            </span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0 group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                <span className="font-mono tabular-nums">{absentCount}</span>
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">جلسه غیبت</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200/70 dark:border-slate-700">
                {excusedCount} غیبت موجه
              </span>
              {lateCount > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-800">
                  {lateCount} تأخیر
                </span>
              )}
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2">
              {absentCount === 0 ? 'شناگر فاقد هرگونه غیبت ثبت‌شده است.' : 'سوابق غیبت در سامانه ثبت شده است.'}
            </div>
          </div>
        </div>

        {/* Card 3: Assessed Skills */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-sky-300 dark:hover:border-sky-700/70 transition-all flex flex-col justify-between gap-3 group">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
              مهارت‌های ارزیابی‌شده
            </span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 border border-sky-200/70 dark:border-sky-800/70 shrink-0 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                <span className="font-mono tabular-nums">{assessments.length}</span>
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
                {passedAssessmentsCount} قبول‌شده
              </span>
            </div>

            {/* Skills Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-500"
                style={{
                  width: `${assessments.length > 0 ? (passedAssessmentsCount / assessments.length) * 100 : 0}%`,
                }}
              />
            </div>

            <div className="text-xs text-sky-600 dark:text-sky-400 font-medium mt-2 flex items-center justify-between">
              <span>{assessments.length - passedAssessmentsCount} در حال پیشرفت یا نیازمند تمرین</span>
              {assessments.length > 0 && (
                <span className="font-mono tabular-nums">
                  {Math.round((passedAssessmentsCount / assessments.length) * 100)}٪
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Segmented Section Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>همه بخش‌ها</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('skills')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'skills'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>شناسنامه مهارت‌ها</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
            <span className="font-mono tabular-nums">{assessments.length}</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('records')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'records'
              ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Timer className="w-4 h-4" />
          <span>رکوردهای زمانی</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
            <span className="font-mono tabular-nums">{records.length}</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('videos')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'videos'
              ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>ویدئوهای تحلیل تکنیک</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60">
            <span className="font-mono tabular-nums">{videos.length}</span>
          </span>
        </button>
      </div>

      {/* 5. Section: Skills Assessments */}
      {(activeTab === 'all' || activeTab === 'skills') && (
        <section aria-labelledby="skills-heading" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          {/* Section Header */}
          <div className="p-4 sm:p-5 lg:p-6 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 id="skills-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  شناسنامه مهارت‌های شنای شاگرد
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  سوابق سنجش تکنیک‌ها، تسلط بر شناها و بازخورد مربی
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-xs sm:text-sm px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold shadow-2xs">
                <span className="font-mono tabular-nums">{assessments.length}</span> ارزیابی ثبت‌شده
              </span>
              <Link
                to={`/coach/progress/${swimmerId}/assessment`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">ثبت ارزیابی جدید</span>
                <span className="sm:hidden">ثبت</span>
              </Link>
            </div>
          </div>

          {/* Search & Filter Bar (Shown when multiple assessments exist) */}
          {assessments.length > 2 && (
            <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="جستجوی مهارت یا بازخورد..."
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  className="w-full pr-9 pl-3 py-1.5 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'ALL', label: 'همه' },
                  { id: 'PASSED', label: 'قبول‌شده' },
                  { id: 'IN_PROGRESS', label: 'در حال پیشرفت' },
                  { id: 'FAILED', label: 'نیاز به تمرین' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSkillFilter(f.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      skillFilter === f.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Skills Assessment List or Empty State */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredAssessments.length > 0 ? (
              filteredAssessments.map((a) => {
                const shamsiDate = toShamsiDate(a.assessed_at).fullText || a.assessed_at;
                return (
                  <div
                    key={a.id}
                    className="p-4 sm:p-5 lg:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="space-y-2.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          {a.skill_name}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                          سطح: {a.level_name}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
                            a.status === 'PASSED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                              : a.status === 'IN_PROGRESS'
                              ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
                              : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                          }`}
                        >
                          {a.status === 'PASSED' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : a.status === 'IN_PROGRESS' ? (
                            <Clock className="w-3.5 h-3.5" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{a.status_display}</span>
                        </span>
                      </div>

                      {/* Coach Feedback Note */}
                      {a.feedback && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
                          <span className="font-bold text-slate-900 dark:text-white ml-1">یادداشت ارزیابی مربی:</span>
                          {a.feedback}
                        </div>
                      )}

                      <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
                        <span>ارزیاب: {a.assessed_by}</span>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span>تاریخ ارزیابی: {shamsiDate}</span>
                      </div>
                    </div>

                    {/* Score badge & display */}
                    <div className="flex items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                      <div className="text-left sm:text-right">
                        <div className="text-xs text-slate-400 font-medium">نمره آزمون</div>
                        <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                          <span className="font-mono tabular-nums">{a.score}</span>
                          <span className="text-xs text-slate-400 font-normal mr-1">/ ۱۰۰</span>
                        </div>
                      </div>

                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-black text-sm border shadow-2xs ${
                          a.score >= 80
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                            : a.score >= 60
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                        }`}
                      >
                        {Math.round(a.score)}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : assessments.length > 0 ? (
              <div className="text-center py-12 px-4 space-y-2">
                <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  موردی با این عبارت یافت نشد.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSkillSearch('');
                    setSkillFilter('ALL');
                  }}
                  className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  پاک کردن فیلترها
                </button>
              </div>
            ) : (
              <div className="text-center py-14 px-6 max-w-lg mx-auto space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-2xs">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    هنوز ارزیابی مهارتی برای این شناگر ثبت نشده است
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    با ثبت ارزیابی مهارت، عملکرد فنی شناگر در کرال سینه، پشت، قورباغه یا پروانه را بسنجید و سوابق پیشرفت او را مستند نمایید.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    to={`/coach/progress/${swimmerId}/assessment`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs active:scale-95 transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>ثبت اولین ارزیابی مهارت</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 6. Section: Swimming Records */}
      {(activeTab === 'all' || activeTab === 'records') && (
        <section aria-labelledby="records-heading" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 lg:p-6 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/80 dark:border-purple-800/80 shrink-0">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <h2 id="records-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  رکوردهای زمانی ثبت‌شده شناگر
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  تایم‌های مسافت‌های مختلف و وضعیت تأیید رکوردهای زمانی
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-xs sm:text-sm px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold shadow-2xs">
                <span className="font-mono tabular-nums">{records.length}</span> رکورد
              </span>
              <Link
                to={`/coach/records?swimmer=${swimmerId}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">ثبت رکورد جدید</span>
                <span className="sm:hidden">ثبت رکورد</span>
              </Link>
            </div>
          </div>

          {records.length > 0 ? (
            <div className="p-4 sm:p-5 lg:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {records.map((r) => {
                const recShamsi = toShamsiDate(r.recorded_at).shortNumeric || r.recorded_at;
                return (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-850 hover:shadow-xs transition-all space-y-2 group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {r.distance_meters} متر {r.stroke_display}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-medium">
                        {r.verification_status_display}
                      </span>
                    </div>

                    <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                      <span className="font-mono tabular-nums">{r.formatted_time}</span>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span>تاریخ ثبت رکورد:</span>
                      <span className="font-mono tabular-nums">{recShamsi}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 px-6 max-w-lg mx-auto space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/80 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
                <Timer className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                هنوز رکورد زمانی برای این شناگر ثبت نشده است.
              </p>
              <Link
                to={`/coach/records?swimmer=${swimmerId}`}
                className="inline-flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>ثبت اولین رکورد در مسافت‌های مختلف</span>
              </Link>
            </div>
          )}
        </section>
      )}

      {/* 7. Section: Swimming Technique Videos */}
      {(activeTab === 'all' || activeTab === 'videos') && (
        <section aria-labelledby="videos-heading" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 lg:p-6 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200/80 dark:border-sky-800/80 shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h2 id="videos-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  ویدئوهای تحلیل تکنیک شناگر
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  فیلم‌های ضبط‌شده تمرینی و آنالیز حرکات زیر آب و روی آب
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-xs sm:text-sm px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold shadow-2xs">
                <span className="font-mono tabular-nums">{videos.length}</span> ویدئو
              </span>
              <Link
                to={`/coach/records?swimmer=${swimmerId}&tab=video`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">آپلود فیلم شنا</span>
                <span className="sm:hidden">آپلود فیلم</span>
              </Link>
            </div>
          </div>

          {videos.length > 0 ? (
            <div className="p-4 sm:p-5 lg:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {videos.map((v) => (
                <div
                  key={v.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 overflow-hidden hover:shadow-xs transition-shadow flex flex-col justify-between"
                >
                  <div className="relative bg-slate-950 aspect-video flex items-center justify-center">
                    <video
                      src={v.video_url || v.video}
                      controls
                      preload="metadata"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {v.title || 'ویدئوی بدون عنوان'}
                        </span>
                        {v.category_display && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold shrink-0">
                            {v.category_display}
                          </span>
                        )}
                      </div>
                      {v.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 mt-1">
                          {v.description}
                        </p>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span>توسط: {v.uploaded_by || 'مربی'}</span>
                      <span className="font-mono tabular-nums">{toShamsiDate(v.uploaded_at).shortNumeric || v.uploaded_at}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-6 max-w-lg mx-auto space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/80 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
                <Video className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                هنوز فیلمی برای تحلیل تکنیک این شناگر بارگذاری نشده است.
              </p>
              <Link
                to={`/coach/records?swimmer=${swimmerId}&tab=video`}
                className="inline-flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 font-bold hover:underline"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>بارگذاری ویدئوی تمرینی شناگر</span>
              </Link>
            </div>
          )}
        </section>
      )}

      {/* 8. Promotion Proposal Modal */}
      {showPromotionModal &&
        createPortal(
          <div
            dir="rtl"
            className="coach-panel fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overscroll-contain animate-fadeIn"
            style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
            onClick={() => setShowPromotionModal(false)}
          >
            <div
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl my-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/80 shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                      پیشنهاد ارتقای سطح شناگر
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      شاگرد: {swimmer.full_name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPromotionModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                  aria-label="بستن پنجره"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Level Comparison Banner */}
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold block">سطح کنونی:</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {swimmer.current_level_name || 'تعیین‌نشده'}
                    </span>
                  </div>
                  <div className="p-2 rounded-full bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-2xs">
                    <ArrowLeft className="w-4 h-4" />
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold block">سطح پیشنهادی:</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {targetLevelId
                        ? promotionLevelOptions.find((o) => o.value === targetLevelId)?.label || 'انتخاب‌شده'
                        : 'انتخاب نمایید'}
                    </span>
                  </div>
                </div>

                {!swimmer.current_level_id && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-xs sm:text-sm text-rose-800 dark:text-rose-200 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>سطح پایه برای این شناگر هنوز در پرونده ثبت نشده است و امکان ثبت پیشنهاد ارتقا وجود ندارد.</span>
                  </div>
                )}

                <form onSubmit={handleSavePromotion} className="space-y-4">
                  <div>
                    <CustomSelect
                      label="سطح جدید پیشنهادی:"
                      value={targetLevelId}
                      onChange={(val) => setTargetLevelId(val)}
                      options={promotionLevelOptions}
                      icon={Award}
                      placeholder="-- انتخاب سطح مقصد --"
                      color="amber"
                      menuClassName="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
                      دلیل و مستندات مربی برای ارتقا:
                    </label>
                    <textarea
                      rows="3"
                      placeholder="شرح تسلط شاگرد بر سرفصل‌های سطح کنونی و آمادگی کامل برای ورود به سطح بالاتر..."
                      value={coachNotes}
                      onChange={(e) => setCoachNotes(e.target.value)}
                      className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3.5 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      این پیشنهاد پس از ثبت جهت تایید نهایی برای مدیر آکادمی ارسال خواهد شد.
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      onClick={() => setShowPromotionModal(false)}
                      className="cursor-pointer rounded-xl"
                    >
                      انصراف
                    </Button>
                    <Button
                      type="submit"
                      variant="amber"
                      size="md"
                      loading={submittingPromotion}
                      disabled={!swimmer.current_level_id}
                      className="font-bold cursor-pointer rounded-xl"
                    >
                      ارسال پیشنهاد به مدیر
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
