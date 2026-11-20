import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dumbbell, Utensils, Download, Printer, Eye, Calendar,
  User, CheckCircle2, RefreshCw, Sparkles, UserCheck, AlertTriangle
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSwimmer } from '../../context/SwimmerContext';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/common/LoadingState';
import { Modal } from '../../components/common/Modal';
import { toShamsiDate } from '../../utils/date';
import { getMediaUrl } from '../../utils/media';
import { exportPlanToWord, printPlanToPdf } from '../../utils/planExport';

export const SwimmerPlansPage = () => {
  const { user } = useAuth();
  const { activeSwimmer, activeSwimmerId, childrenList, selectChild } = useSwimmer();
  const toast = useToast();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [planFilter, setPlanFilter] = useState('ALL'); // 'ALL' | 'TRAINING' | 'DIET'
  const [selectedPlanForView, setSelectedPlanForView] = useState(null);

  const loadPlans = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const params = activeSwimmerId ? { swimmer_id: activeSwimmerId } : {};
      const res = await api.get('/swimmers/my-plans/', { params });
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setPlans(data);
    } catch (err) {
      console.error('Error fetching swimmer plans:', err);
      toast.error('خطا در دریافت برنامه‌های تمرینی و غذایی');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeSwimmerId, toast]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const swimmerName = activeSwimmer?.full_name || user?.full_name || 'شناگر محترم';
  const swimmerLevel = activeSwimmer?.level_name || 'سطح پایه';

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      if (planFilter === 'TRAINING') return p.plan_type === 'TRAINING';
      if (planFilter === 'DIET') return p.plan_type === 'DIET';
      return true;
    });
  }, [plans, planFilter]);

  const trainingCount = useMemo(() => plans.filter((p) => p.plan_type === 'TRAINING').length, [plans]);
  const dietCount = useMemo(() => plans.filter((p) => p.plan_type === 'DIET').length, [plans]);

  if (loading) {
    return <LoadingState type="cards" message="در حال دریافت برنامه‌های تمرینی و غذایی..." />;
  }

  return (
    <div className="space-y-6 pb-16" dir="rtl">
      {/* 1. HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-600 text-white p-5 sm:p-7 shadow-lg">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-400/15 rounded-full blur-2xl pointer-events-none translate-x-1/3 translate-y-1/3" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-teal-100 border border-white/20">
              <Dumbbell className="w-4 h-4 text-emerald-200" />
              <span>پرتال تخصصی تمرین و تغذیه ورزشی</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>برنامه غذایی و تمرینی شناگر</span>
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/90 max-w-2xl leading-relaxed">
              مشاهده برنامه‌های تمرینی اختصاصی، رژیم‌های غذایی و دستورالعمل‌های ورزشی با امکان دانلود رسمی Word و چاپ PDF
            </p>
          </div>

          {/* Active Swimmer Profile Chip */}
          <div className="shrink-0 bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-3.5 sm:p-4 text-white shadow-xs max-w-md w-full lg:w-auto">
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <span className="text-[11px] font-semibold text-teal-200 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-cyan-300" />
                <span>شناگر جاری:</span>
              </span>
              {childrenList && childrenList.length > 1 && (
                <div
                  className="text-[11px] text-cyan-200 font-bold underline cursor-pointer hover:text-white transition-colors"
                  onClick={() => {
                    const nextChild = childrenList.find(
                      (c) => String(c.swimmer || c.swimmer_detail?.id) !== String(activeSwimmerId)
                    );
                    if (nextChild) selectChild(nextChild.swimmer || nextChild.swimmer_detail?.id);
                  }}
                >
                  تعویض فرزند
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-400 to-teal-300 text-teal-900 font-black text-base flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                {activeSwimmer?.avatar ? (
                  <img src={getMediaUrl(activeSwimmer.avatar)} alt={swimmerName} className="w-full h-full object-cover" />
                ) : (
                  <span>{swimmerName.charAt(0)}</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white truncate flex items-center gap-2">
                  <span>{swimmerName}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/25 text-cyan-100 border border-cyan-300/30">
                    {swimmerLevel}
                  </span>
                </div>
                <div className="text-xs text-teal-100 mt-0.5">
                  تعداد کل برنامه‌های فعال: <strong>{plans.length} برنامه</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CONTROLS BAR: FILTER PILLS & REFRESH */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full sm:w-fit overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setPlanFilter('ALL')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
              planFilter === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            همه برنامه‌ها ({plans.length})
          </button>
          <button
            type="button"
            onClick={() => setPlanFilter('TRAINING')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              planFilter === 'TRAINING'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>برنامه‌های تمرینی ({trainingCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setPlanFilter('DIET')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              planFilter === 'DIET'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>برنامه‌های غذایی ({dietCount})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => loadPlans(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-teal-600 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl transition-all cursor-pointer w-full sm:w-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
          <span>به‌روزرسانی</span>
        </button>
      </div>

      {/* 3. PLANS GRID */}
      {filteredPlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredPlans.map((p) => {
            const isDiet = p.plan_type === 'DIET';

            return (
              <div
                key={p.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border shadow-xs flex flex-col justify-between gap-4 ${
                  isDiet
                    ? 'border-emerald-200 dark:border-emerald-900/60'
                    : 'border-blue-200 dark:border-blue-900/60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-black px-2.5 py-0.5 rounded-md ${
                          isDiet
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {isDiet ? 'برنامه غذایی و رژیم ورزشی' : 'برنامه تمرین تخصصی شنا'}
                      </span>
                      {p.target_type === 'INDIVIDUAL' ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                          اختصاصی برای شما
                        </span>
                      ) : p.group_name ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                          کلاس: {p.group_name}
                        </span>
                      ) : null}
                    </div>

                    <span className="text-xs text-slate-400 font-mono">
                      {toShamsiDate(p.created_at).shortNumeric || p.created_at?.slice(0, 10)}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {p.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    مربی طراح: <strong>{p.coach_name || 'کادر فنی آکادمی'}</strong>
                  </p>

                  {isDiet ? (
                    <div className="space-y-2 text-xs sm:text-sm">
                      {p.diet_goal && (
                        <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-200/50 dark:border-emerald-900/40">
                          <strong>هدف رژیم: </strong> {p.diet_goal}
                        </div>
                      )}
                      {p.breakfast && (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                          <strong>صبحانه: </strong> {p.breakfast}
                        </div>
                      )}
                      {p.lunch && (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                          <strong>ناهار: </strong> {p.lunch}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs sm:text-sm">
                      {p.focus_skills && (
                        <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border border-blue-200/50 dark:border-blue-900/40">
                          <strong>تمرکز تکنیکی: </strong> {p.focus_skills}
                        </div>
                      )}
                      {p.main_section && (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-mono text-xs border border-slate-100 dark:border-slate-800">
                          <strong>ست تمرین اصلی (Main Set): </strong>
                          <p className="line-clamp-2 mt-1">{p.main_section}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons: View Details, Word, PDF */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlanForView(p)}
                    className="w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Eye className="w-4 h-4" />
                    <span>مشاهده کامل آیتم‌های برنامه</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => exportPlanToWord(p)}
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/60 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>دانلود Word</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => printPlanToPdf(p)}
                      className="flex-1 py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/70 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/60 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>چاپ PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Dumbbell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200">
            هنوز برنامه تمرینی یا غذایی برای شما ثبت نشده است
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            به محض اینکه مربی شما برنامه‌ای اختصاصی تدوین و ثبت نماید، در این بخش قابل مشاهده و دانلود خواهد بود.
          </p>
        </div>
      )}

      {/* 4. PLAN DETAILS MODAL */}
      {selectedPlanForView && (
        <Modal
          isOpen={Boolean(selectedPlanForView)}
          onClose={() => setSelectedPlanForView(null)}
          title={selectedPlanForView.title || 'جزئیات کامل برنامه'}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-right" dir="rtl">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-lg font-black ${
                    selectedPlanForView.plan_type === 'DIET'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  }`}
                >
                  {selectedPlanForView.plan_type === 'DIET' ? 'برنامه تغذیه' : 'برنامه تمرین شنا'}
                </span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  مربی: {selectedPlanForView.coach_name || 'کادر فنی آکادمی'}
                </span>
              </div>
              <span className="font-mono text-slate-400">
                تاریخ تدوین: {toShamsiDate(selectedPlanForView.created_at).fullText || selectedPlanForView.created_at?.slice(0, 10)}
              </span>
            </div>

            {selectedPlanForView.plan_type === 'DIET' ? (
              <div className="space-y-3 text-sm">
                {selectedPlanForView.diet_goal && (
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
                    <span className="font-bold text-emerald-900 dark:text-emerald-200 block mb-1">🎯 هدف رژیم غذایی:</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedPlanForView.diet_goal}</p>
                  </div>
                )}
                {selectedPlanForView.breakfast && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">🍳 وعده صبحانه:</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{selectedPlanForView.breakfast}</p>
                  </div>
                )}
                {selectedPlanForView.lunch && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">🥗 وعده ناهار:</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{selectedPlanForView.lunch}</p>
                  </div>
                )}
                {selectedPlanForView.dinner && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">🍲 وعده شام:</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{selectedPlanForView.dinner}</p>
                  </div>
                )}
                {selectedPlanForView.snacks && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">🍎 میان‌وعده‌ها و مکمل‌ها:</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{selectedPlanForView.snacks}</p>
                  </div>
                )}
                {selectedPlanForView.hydration && (
                  <div className="p-3 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-900/60">
                    <span className="font-bold text-cyan-900 dark:text-cyan-200 block mb-1">💧 آبرسانی و نوشیدنی‌های قبل و حین تمرین:</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedPlanForView.hydration}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                {selectedPlanForView.focus_skills && (
                  <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60">
                    <span className="font-bold text-sky-900 dark:text-sky-200 block mb-1">🎯 تمرکز مهارتی و تکنیکی:</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedPlanForView.focus_skills}</p>
                  </div>
                )}
                {selectedPlanForView.warmup && (
                  <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                    <span className="font-bold text-amber-900 dark:text-amber-200 block mb-1">🔥 گرم‌کردن و کشش:</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{selectedPlanForView.warmup}</p>
                  </div>
                )}
                {selectedPlanForView.main_section && (
                  <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
                    <span className="font-bold text-blue-900 dark:text-blue-200 block mb-1.5">🏊 ست تمرین اصلی (Main Set):</span>
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-mono text-xs sm:text-sm">
                      {selectedPlanForView.main_section}
                    </p>
                  </div>
                )}
                {selectedPlanForView.drills && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">⚙️ تمرینات اصلاح تکنیک (Drills):</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{selectedPlanForView.drills}</p>
                  </div>
                )}
                {selectedPlanForView.cooldown && (
                  <div className="p-3 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50">
                    <span className="font-bold text-teal-900 dark:text-teal-200 block mb-1">❄️ سرد کردن و کشش پایانی:</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{selectedPlanForView.cooldown}</p>
                  </div>
                )}
              </div>
            )}

            {selectedPlanForView.notes && (
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong>یادداشت مربی: </strong> {selectedPlanForView.notes}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => exportPlanToWord(selectedPlanForView)}
                className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>دریافت فایل Word</span>
              </button>
              <button
                type="button"
                onClick={() => printPlanToPdf(selectedPlanForView)}
                className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>چاپ یا PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlanForView(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
