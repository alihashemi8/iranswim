import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import {
  TrendingUp, Award, Calendar, ChevronRight, CheckCircle2,
  Clock, AlertCircle, PlusCircle, Users,
  UserCheck, X, BookOpen
} from 'lucide-react';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { CustomSelect } from '../../components/common/CustomSelect';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { toShamsiDate } from '../../utils/date';

export const CoachSwimmerDossierPage = () => {
  const { swimmerId } = useParams();
  const [data, setData] = useState(null);
  const [skillsList, setSkillsList] = useState([]);
  const [loadedSwimmerId, setLoadedSwimmerId] = useState(null);
  const loading = loadedSwimmerId !== swimmerId;

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

  const fetchAllLevels = useCallback(async () => {
    const firstRes = await api.get('/education/levels/');
    const firstData = firstRes.data;
    if (Array.isArray(firstData)) return firstData;

    const allItems = [...(firstData?.results || [])];
    let next = firstData?.next;
    let page = 2;

    while (next && page <= 20) {
      const pageRes = await api.get('/education/levels/', { params: { page } });
      const pageData = pageRes.data;
      const pageItems = pageData?.results || (Array.isArray(pageData) ? pageData : []);
      allItems.push(...pageItems);
      next = pageData?.next;
      page += 1;
    }

    return allItems;
  }, []);

  const loadDossierData = useCallback(async () => {
    const [dossierRes, allLevels] = await Promise.all([
      api.get(`/coaches/swimmer-dossier/${swimmerId}/`),
      fetchAllLevels(),
    ]);

    const extractedSkills = [];
    allLevels.forEach((lvl) => {
      if (lvl?.skills && Array.isArray(lvl.skills)) {
        lvl.skills.forEach((sk) => {
          extractedSkills.push({ ...sk, level_name: lvl.name });
        });
      }
    });

    return { dossier: dossierRes.data, extractedSkills };
  }, [swimmerId, fetchAllLevels]);

  const applyDossierResult = useCallback(({ dossier, extractedSkills }) => {
    setData(dossier);
    setSkillsList(extractedSkills);
    if (extractedSkills.length > 0) {
      setSelectedSkillId((prev) => prev || String(extractedSkills[0].id));
    }
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
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت پیشنهاد ارتقا');
    } finally {
      setSubmittingPromotion(false);
    }
  };

  if (loading) {
    return <LoadingState type="dashboard" message="در حال دریافت پرونده مهارتی و عملکرد شناگر..." />;
  }

  if (!data) {
    return (
      <div className="coach-panel bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center py-12 px-6 space-y-3">
        <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
        <p className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200">
          شناگر یافت نشد یا شما به پرونده او دسترسی ندارید.
        </p>
        <Link
          to="/coach/progress"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white text-sm font-bold transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
          بازگشت به لیست پیشرفت
        </Link>
      </div>
    );
  }

  const swimmer = data.swimmer || {};
  const assessments = data.assessments || [];
  const records = data.records || [];
  const attSummary = data.attendance_summary || {};
  const skillLevels = data.skill_levels || [];

  const promotionLevelOptions = skillLevels.map((lvl) => {
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

  const passedAssessmentsCount = assessments.filter((a) => a.status === 'PASSED').length;

  return (
    <div className="space-y-5 sm:space-y-6 pb-12 coach-panel">
      {/* 1. Header & Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm">
            <Link
              to="/coach/progress"
              className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 inline-flex items-center gap-1 font-semibold transition-colors"
            >
              <ChevronRight className="w-4 h-4 shrink-0" />
              ارزیابی و پیشرفت شناگران
            </Link>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-slate-700 dark:text-slate-200 font-bold truncate max-w-[200px] sm:max-w-xs">
              {swimmer.full_name}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white flex flex-wrap items-center gap-2 sm:gap-2.5">
            <span>{swimmer.full_name}</span>
            <span className="inline-flex items-center text-xs sm:text-sm font-bold px-2.5 sm:px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
              سطح: {swimmer.current_level_name}
            </span>
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto shrink-0">
          <button
            type="button"
            onClick={() => setShowPromotionModal(true)}
            className="flex-1 min-w-[165px] sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 min-h-[42px] rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Award className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-600 dark:text-amber-400 shrink-0" />
            پیشنهاد ارتقای سطح
          </button>

          <Link
            to={`/coach/progress/${swimmerId}/assessment`}
            className="flex-1 min-w-[165px] sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 min-h-[42px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
            ثبت ارزیابی مهارت
          </Link>
        </div>
      </div>

      {/* 2. Attendance Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-bold">
              درصد حضور
            </span>
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {attSummary.attendance_rate ?? 0}%
            </div>
            <span className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
              {attSummary.present ?? 0} جلسه حاضر
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-bold">
              غیبت‌ها
            </span>
            <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {attSummary.absent ?? 0}
            </div>
            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 block">
              {attSummary.excused ?? 0} غیبت موجه
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-bold">
              مهارت‌های ارزیابی‌شده
            </span>
            <TrendingUp className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {assessments.length}
            </div>
            <span className="text-xs sm:text-sm text-sky-600 dark:text-sky-400 font-semibold mt-1 block">
              {passedAssessmentsCount} مهارت قبول‌شده
            </span>
          </div>
        </div>
      </div>

      {/* 3. Skills Assessments History */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>شناسنامه مهارت‌های شنای شاگرد</span>
          </h2>
          <span className="shrink-0 text-xs sm:text-sm px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold font-mono">
            {assessments.length} ارزیابی ثبت‌شده
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {assessments.length > 0 ? (
            assessments.map((a) => {
              const shamsiDate = toShamsiDate(a.assessed_at).shortNumeric || a.assessed_at;
              return (
                <div
                  key={a.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {a.skill_name}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                        سطح: {a.level_name}
                      </span>
                    </div>
                    {a.feedback && (
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                        نکته مربی: {a.feedback}
                      </p>
                    )}
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
                      <span>ارزیاب: {a.assessed_by}</span>
                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="font-mono">تاریخ: {shamsiDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                    <span className="text-xs sm:text-sm font-mono font-bold text-slate-700 dark:text-slate-200">
                      نمره: {a.score}/100
                    </span>
                    <span
                      className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold border ${
                        a.status === 'PASSED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80'
                          : a.status === 'IN_PROGRESS'
                          ? 'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/80'
                          : 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/80'
                      }`}
                    >
                      {a.status_display}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 px-4 space-y-2.5">
              <TrendingUp className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
                هنوز ارزیابی مهارتی برای این شناگر ثبت نشده است. از دکمه بالای صفحه برای ثبت استفاده نمایید.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Swimming Records */}
      {records.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>رکوردهای زمانی ثبت‌شده شناگر</span>
            </h2>
            <span className="shrink-0 text-xs sm:text-sm px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold font-mono">
              {records.length} رکورد
            </span>
          </div>
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {records.map((r) => {
              const recShamsi = toShamsiDate(r.recorded_at).shortNumeric || r.recorded_at;
              return (
                <div
                  key={r.id}
                  className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5"
                >
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">
                    {r.distance_meters} متر {r.stroke_display}
                  </span>
                  <span className="text-lg font-black font-mono text-purple-600 dark:text-purple-400 block">
                    {r.formatted_time}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium font-mono">
                    تاریخ: {recShamsi} · {r.verification_status_display}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Promotion Proposal Modal */}
      {showPromotionModal &&
        createPortal(
          <div
            dir="rtl"
            className="coach-panel fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overscroll-contain"
            style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
            onClick={() => setShowPromotionModal(false)}
          >
            <div
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 rounded-t-2xl">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 min-w-0">
                  <Award className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="truncate">پیشنهاد ارتقای سطح برای {swimmer.full_name}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPromotionModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                  aria-label="بستن"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  سطح فعلی شناگر:{' '}
                  <span className="font-bold text-slate-800 dark:text-white">
                    {swimmer.current_level_name}
                  </span>
                  . این پیشنهاد پس از ثبت برای تأیید نهایی به مدیر آموزشگاه ارسال می‌گردد.
                </p>

                {!swimmer.current_level_id && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs sm:text-sm text-amber-800 dark:text-amber-200 font-medium">
                    سطح پایه برای این شناگر هنوز در سیستم تعیین نشده است و امکان ثبت پیشنهاد ارتقا وجود ندارد.
                  </div>
                )}

                <form onSubmit={handleSavePromotion} className="space-y-4 text-sm">
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
                      دلیل و شواهد مربی برای ارتقا:
                    </label>
                    <textarea
                      rows="3"
                      placeholder="شرح تسلط شاگرد بر سرفصل‌های سطح قبلی و آمادگی کامل برای سطح بالاتر..."
                      value={coachNotes}
                      onChange={(e) => setCoachNotes(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      onClick={() => setShowPromotionModal(false)}
                      className="cursor-pointer"
                    >
                      انصراف
                    </Button>
                    <Button
                      type="submit"
                      variant="amber"
                      size="md"
                      loading={submittingPromotion}
                      disabled={!swimmer.current_level_id}
                      className="font-bold cursor-pointer"
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
