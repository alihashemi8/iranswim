import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  TrendingUp, Award, ChevronRight, CheckCircle2,
  Clock, AlertCircle, PlusCircle, Users, BookOpen,
  Sparkles, FileText
} from 'lucide-react';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { BackButton } from '../../components/common/BackButton';
import { PersianDatePicker } from '../../components/common/PersianDatePicker';
import { useToast } from '../../context/ToastContext';
import { toShamsiDate } from '../../utils/date';

const SCORE_PRESETS = [100, 95, 90, 85, 80, 75, 70, 60];

export const CoachAssessmentRecordPage = () => {
  const { swimmerId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [dossierData, setDossierData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [skillTitle, setSkillTitle] = useState('');
  const [criteriaDescription, setCriteriaDescription] = useState('');
  const [score, setScore] = useState(85);
  const [statusVal, setStatusVal] = useState('PASSED');
  const [feedback, setFeedback] = useState('');
  const [assessedAt, setAssessedAt] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  // Load swimmer data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const dossierRes = await api.get(`/coaches/swimmer-dossier/${swimmerId}/`);
      setDossierData(dossierRes.data);
    } catch (err) {
      console.error('Error fetching swimmer dossier:', err);
      toast.error('خطا در دریافت اطلاعات شناگر');
    } finally {
      setLoading(false);
    }
  }, [swimmerId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const swimmer = dossierData?.swimmer || {};
  const assessments = dossierData?.assessments || [];
  const attSummary = dossierData?.attendance_summary || {};

  // Submit Final Assessment
  const handleSubmitAssessment = async (e) => {
    e.preventDefault();
    const trimmedTitle = skillTitle.trim();
    if (!trimmedTitle) {
      toast.error('لطفاً عنوان یا متن ارزیابی را وارد نمایید.');
      return;
    }

    const numScore = Number(score);
    if (Number.isNaN(numScore) || numScore < 0 || numScore > 100) {
      toast.error('نمره ارزیابی باید عددی بین 0 تا 100 باشد.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/assessments/skills/', {
        swimmer: Number(swimmerId),
        custom_skill_name: trimmedTitle,
        custom_criteria_description: criteriaDescription.trim(),
        score: numScore,
        status: statusVal,
        feedback: feedback.trim(),
        assessed_at: assessedAt,
      });

      toast.success('ارزیابی مهارت شناگر با موفقیت ثبت شد.');
      navigate(`/coach/progress/${swimmerId}`);
    } catch (err) {
      console.error('Error saving assessment:', err);
      toast.error(err.response?.data?.detail || err.response?.data?.skill?.[0] || 'خطا در ثبت نهایی ارزیابی');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState type="dashboard" message="در حال بارگذاری فرم ارزیابی شناگر..." />;
  }

  if (!dossierData) {
    return (
      <div className="coach-panel bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center py-12 px-6 space-y-4">
        <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
        <p className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200">
          شناگر یافت نشد یا شما به پرونده او دسترسی ندارید.
        </p>
        <BackButton to="/coach/progress" label="بازگشت به لیست پیشرفت" showLabelAlways />
      </div>
    );
  }

  const passedCount = assessments.filter((a) => a.status === 'PASSED').length;
  const shamsiToday = toShamsiDate(assessedAt).fullText || assessedAt;

  return (
    <div className="coach-panel space-y-6 pb-16 max-w-5xl mx-auto">
      {/* 1. Breadcrumbs & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <BackButton to={`/coach/progress/${swimmerId}`} title="بازگشت به پرونده شناگر" className="mt-0.5 sm:mt-0" />
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <Link
                to="/coach/progress"
                className="hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold transition-colors flex items-center gap-1"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                ارزیابی و پیشرفت
              </Link>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <Link
                to={`/coach/progress/${swimmerId}`}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold transition-colors"
              >
                پرونده مهارتی: {swimmer.full_name}
              </Link>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold">ثبت ارزیابی جدید</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <PlusCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>ثبت ارزیابی مهارت برای {swimmer.full_name}</span>
            </h1>
          </div>
        </div>
      </div>

      {/* 2. Swimmer Snapshot Card */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-sm">
            {swimmer.first_name ? swimmer.first_name.charAt(0) : 'ش'}
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {swimmer.full_name}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 font-bold border border-emerald-200 dark:border-emerald-800/80">
                سطح فعلی: {swimmer.current_level_name}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ثبت ارزیابی مهارتی و فنی شناگر به همراه نمره، تاریخ و بازخورد مربی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs sm:text-sm pt-2 sm:pt-0 border-t sm:border-t-0 border-emerald-500/15 shrink-0">
          <div className="text-center sm:text-right">
            <span className="block text-slate-400 text-[11px] font-semibold">حضور شاگرد</span>
            <span className="font-black text-slate-800 dark:text-slate-200 font-mono">
              {attSummary.attendance_rate ?? 0}% ({attSummary.present ?? 0} جلسه)
            </span>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
          <div className="text-center sm:text-right">
            <span className="block text-slate-400 text-[11px] font-semibold">سوابق ارزیابی</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {passedCount} قبولی از {assessments.length} ارزیابی
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Form Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form
          onSubmit={handleSubmitAssessment}
          className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-6 shadow-xs"
        >
          {/* Section 1: Evaluation Item Title & Criteria */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>عنوان ارزیابی / مهارت شنا:</span>
                <span className="text-rose-500 font-black">*</span>
              </label>
              <input
                type="text"
                value={skillTitle}
                onChange={(e) => setSkillTitle(e.target.value)}
                placeholder="مثال: پای کرال سینه ۲۵ متر، استارت مسابقاتی، هواگیری دوطرفه، سالتو برگشت..."
                className="w-full min-h-[46px] rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>معیار سنجش یا توضیحات تکمیلی سرفصل (اختیاری):</span>
              </label>
              <input
                type="text"
                value={criteriaDescription}
                onChange={(e) => setCriteriaDescription(e.target.value)}
                placeholder="مثال: حفظ خط هیدرودینامیک بدن، ضربه شلاقی مچ پا بدون خم شدن زانو..."
                className="w-full min-h-[42px] rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section 2: Result and Score */}
          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>نتیجه سنجش و نمره:</span>
            </label>

            {/* Status selection cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: 'PASSED',
                  label: 'قبول / کسب مهارت',
                  icon: CheckCircle2,
                  bgActive: 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/20',
                  iconColor: 'text-emerald-600 dark:text-emerald-400',
                },
                {
                  id: 'IN_PROGRESS',
                  label: 'در حال تمرین',
                  icon: Clock,
                  bgActive: 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/50 text-sky-800 dark:text-sky-200 ring-2 ring-sky-500/20',
                  iconColor: 'text-sky-600 dark:text-sky-400',
                },
                {
                  id: 'NEEDS_PRACTICE',
                  label: 'نیازمند تمرین بیشتر',
                  icon: AlertCircle,
                  bgActive: 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 ring-2 ring-rose-500/20',
                  iconColor: 'text-rose-600 dark:text-rose-400',
                },
              ].map((opt) => {
                const IconComp = opt.icon;
                const isSelected = statusVal === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStatusVal(opt.id)}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center gap-2.5 ${
                      isSelected
                        ? opt.bgActive
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <IconComp className={`w-5 h-5 shrink-0 ${isSelected ? opt.iconColor : 'text-slate-400'}`} />
                    <span className="text-xs sm:text-sm font-bold">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Score input & quick presets */}
            <div className="space-y-2 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-semibold">
                  نمره ارزیابی (از ۱۰۰):
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">نمرات پرتکرار:</span>
                  {SCORE_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setScore(p)}
                      className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold transition-colors cursor-pointer ${
                        Number(score) === p
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="number"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-full min-h-[44px] rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-slate-800 dark:text-slate-100 font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
              />
            </div>

            {/* Assessment Date (Persian Calendar) */}
            <div className="space-y-1 pt-1">
              <PersianDatePicker
                label="تاریخ ارزیابی:"
                value={assessedAt}
                onChange={(jalaliStr, gDate, gIso) => {
                  if (gIso) {
                    setAssessedAt(gIso);
                  }
                }}
                placeholder="انتخاب تاریخ ارزیابی..."
                clearable={false}
                className="w-full sm:w-80"
              />
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section 3: Technical Feedback and Notes */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>توضیحات و بازخورد فنی مربی:</span>
              </label>
              <span className="text-[11px] text-slate-400">
                این بازخورد در کارنامه و اپلیکیشن شناگر نمایش داده می‌شود.
              </span>
            </div>

            <textarea
              rows="4"
              placeholder="نکات تکنیکی، اصلاحات مورد نیاز در فرم دست و پا، نقاط قوت شاگرد یا توصیه‌های جلسه بعد..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3.5 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              to={`/coach/progress/${swimmerId}`}
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-sm transition-colors cursor-pointer text-center"
            >
              انصراف و بازگشت
            </Link>

            <Button
              type="submit"
              variant="success"
              size="md"
              loading={submitting}
              disabled={!skillTitle.trim() || submitting}
              className="w-full sm:w-auto font-bold text-sm px-6 py-2.5 cursor-pointer shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>ثبت نهایی ارزیابی مهارت</span>
            </Button>
          </div>
        </form>

        {/* 4. Side Column: Swimmer's Recent Evaluations History */}
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>سوابق ارزیابی {swimmer.first_name}</span>
              </h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {assessments.length} مورد
              </span>
            </div>

            {assessments.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {assessments.slice(0, 8).map((a) => {
                  const shDate = toShamsiDate(a.assessed_at).shortNumeric || a.assessed_at;
                  return (
                    <div
                      key={a.id}
                      className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {a.skill_name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                            a.status === 'PASSED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                              : a.status === 'IN_PROGRESS'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                          }`}
                        >
                          {a.status_display}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                        <span>نمره: {a.score}/100</span>
                        <span>{shDate}</span>
                      </div>
                      {a.feedback && (
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed line-clamp-2">
                          {a.feedback}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 space-y-2">
                <Award className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p>تاکنون هیچ ارزیابی برای این شناگر ثبت نشده است.</p>
              </div>
            )}
          </div>

          {/* Info Tip Box */}
          <div className="bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-800/60 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-sky-900 dark:text-sky-200">
              <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>نحوه ثبت ارزیابی مهارت</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              عنوان مهارت یا سرفصل مورد نظر را مستقیماً بنویسید (مثلاً پای کرال، استارت، تنفس). نمره، وضعیت قبولی و بازخورد فنی شما در پرونده شاگرد ثبت شده و در کارنامه و اپلیکیشن او قابل مشاهده خواهد بود.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
