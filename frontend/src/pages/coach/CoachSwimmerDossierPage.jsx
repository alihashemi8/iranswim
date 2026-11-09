import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  TrendingUp, Award, Calendar, ChevronRight, CheckCircle2,
  Clock, AlertCircle, PlusCircle, MessageSquare,
  ShieldCheck, ArrowLeft
} from 'lucide-react';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';

export const CoachSwimmerDossierPage = () => {
  const { swimmerId } = useParams();
  const [data, setData] = useState(null);
  const [skillsList, setSkillsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // New assessment modal/form state
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [score, setScore] = useState(85);
  const [statusVal, setStatusVal] = useState('PASSED');
  const [feedback, setFeedback] = useState('');
  const [savingAssessment, setSavingAssessment] = useState(false);

  // Promotion proposal modal state
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [targetLevelId, setTargetLevelId] = useState('');
  const [coachNotes, setCoachNotes] = useState('');
  const [submittingPromotion, setSubmittingPromotion] = useState(false);

  const toast = useToast();

  const fetchDossier = async () => {
    try {
      setLoading(true);
      const [dossierRes, skillsRes] = await Promise.all([
        api.get(`/coaches/swimmer-dossier/${swimmerId}/`),
        api.get('/education/levels/'),
      ]);
      setData(dossierRes.data);

      // Collect available skills
      const allLevels = skillsRes.data || [];
      const extractedSkills = [];
      allLevels.forEach((lvl) => {
        if (lvl.skills && Array.isArray(lvl.skills)) {
          lvl.skills.forEach((sk) => {
            extractedSkills.push({ ...sk, level_name: lvl.name });
          });
        }
      });
      setSkillsList(extractedSkills);
      if (extractedSkills.length > 0) {
        setSelectedSkillId(extractedSkills[0].id);
      }
    } catch (err) {
      console.error('Error fetching swimmer dossier:', err);
      toast.error('خطا در دریافت پرونده مهارتی شناگر');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDossier();
  }, [swimmerId]);

  // Submit Skill Assessment
  const handleSaveAssessment = async (e) => {
    e.preventDefault();
    if (!selectedSkillId) {
      toast.error('لطفاً مهارت مورد نظر را انتخاب کنید.');
      return;
    }
    try {
      setSavingAssessment(true);
      await api.post('/assessments/skills/', {
        swimmer: Number(swimmerId),
        skill: Number(selectedSkillId),
        score: Number(score),
        status: statusVal,
        feedback,
        assessed_at: new Date().toISOString().split('T')[0],
      });
      toast.success('ارزیابی مهارتی با موفقیت ثبت شد.');
      setShowAssessmentModal(false);
      setFeedback('');
      fetchDossier();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت ارزیابی');
    } finally {
      setSavingAssessment(false);
    }
  };

  // Submit Level Promotion Proposal
  const handleSavePromotion = async (e) => {
    e.preventDefault();
    if (!targetLevelId || !coachNotes) {
      toast.error('لطفاً سطح پیشنهادی و دلیل ارتقا را وارد فرمایید.');
      return;
    }
    try {
      setSubmittingPromotion(true);
      await api.post('/assessments/promotions/', {
        swimmer: Number(swimmerId),
        current_level: data.swimmer.current_level_id,
        proposed_level: Number(targetLevelId),
        coach_notes: coachNotes,
      });
      toast.success('پیشنهاد ارتقای سطح برای تأیید مدیر آموزشگاه ارسال شد.');
      setShowPromotionModal(false);
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
      <div className="text-center py-12">
        <p className="text-slate-500">شناگر یافت نشد یا شما به پرونده او دسترسی ندارید.</p>
        <Link to="/coach/progress" className="text-emerald-600 text-sm font-bold mt-2 inline-block">
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

  return (
    <div className="space-y-6 pb-12 coach-panel">
      {/* 1. Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              to="/coach/progress"
              className="text-sm text-slate-500 hover:text-emerald-600 flex items-center gap-1 font-semibold transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              ارزیابی و پیشرفت شناگران
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-sm text-slate-700 dark:text-slate-300 font-bold">{swimmer.full_name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            {swimmer.full_name}
            <span className="text-xs sm:text-sm font-semibold px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              سطح: {swimmer.current_level_name}
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            کد ملی: {swimmer.national_id || 'ثبت‌نشده'} · شماره ولی: {swimmer.guardian_phone || '---'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowPromotionModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 text-sm font-bold transition-all cursor-pointer active:scale-95"
          >
            <Award className="w-4.5 h-4.5 text-amber-600" />
            پیشنهاد ارتقای سطح
          </button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAssessmentModal(true)}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base px-4 py-2.5"
          >
            <PlusCircle className="w-4.5 h-4.5" />
            ثبت ارزیابی مهارت
          </Button>
        </div>
      </div>

      {/* 2. Attendance & Health Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-sm text-slate-500 dark:text-slate-400 font-bold block mb-1">درصد حضور</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {attSummary.attendance_rate}%
          </div>
          <span className="text-xs sm:text-sm text-emerald-600 font-semibold mt-1 block">
            {attSummary.present} جلسه حاضر
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-sm text-slate-500 dark:text-slate-400 font-bold block mb-1">غیبت‌ها</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {attSummary.absent}
          </div>
          <span className="text-xs sm:text-sm text-slate-400 font-medium mt-1 block">
            {attSummary.excused} غیبت موجه
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-sm text-slate-500 dark:text-slate-400 font-bold block mb-1">مهارت‌های ارزیابی‌شده</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {assessments.length}
          </div>
          <span className="text-xs sm:text-sm text-sky-600 font-semibold mt-1 block">
            {assessments.filter(a => a.status === 'PASSED').length} مهارت قبول‌شده
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-sm text-slate-500 dark:text-slate-400 font-bold block mb-1">ملاحظات ویژه/پزشکی</span>
          <p className="text-sm font-bold text-slate-800 dark:text-white truncate mt-2">
            {swimmer.medical_conditions || 'موردی ثبت نشده است'}
          </p>
        </div>
      </div>

      {/* 3. Skills Assessments History */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            شناسنامه مهارت‌های شنای شاگرد
          </h2>
          <span className="text-sm text-slate-500 font-semibold">
            {assessments.length} ارزیابی ثبت‌شده
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {assessments.length > 0 ? (
            assessments.map((a) => (
              <div
                key={a.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {a.skill_name}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                      سطح: {a.level_name}
                    </span>
                  </div>
                  {a.feedback && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                      نکته مربی: {a.feedback}
                    </p>
                  )}
                  <div className="text-xs text-slate-400 flex items-center gap-2 font-medium">
                    <span>ارزیاب: {a.assessed_by}</span>
                    <span>·</span>
                    <span>تاریخ: {a.assessed_at}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
                    نمره: {a.score}/100
                  </span>
                  <span
                    className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold ${
                      a.status === 'PASSED'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : a.status === 'IN_PROGRESS'
                        ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}
                  >
                    {a.status_display}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">
              هنوز ارزیابی مهارتی برای این شناگر ثبت نشده است. از دکمه بالای صفحه برای ثبت استفاده نمایید.
            </div>
          )}
        </div>
      </div>

      {/* 4. Swimming Records */}
      {records.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              رکوردهای زمانی ثبت‌شده شناگر
            </h2>
          </div>
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {records.map((r) => (
              <div key={r.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5">
                <span className="text-sm font-bold text-slate-900 dark:text-white block">
                  {r.distance_meters} متر {r.stroke_display}
                </span>
                <span className="text-lg font-black font-mono text-purple-600 block">
                  {r.formatted_time}
                </span>
                <span className="text-xs text-slate-400 block font-medium">
                  تاریخ: {r.recorded_at} · {r.verification_status_display}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assessment Modal */}
      {showAssessmentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              ثبت ارزیابی مهارت برای {swimmer.full_name}
            </h3>

            <form onSubmit={handleSaveAssessment} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">انتخاب مهارت شنا:</label>
                <select
                  value={selectedSkillId}
                  onChange={(e) => setSelectedSkillId(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-800 dark:text-slate-200 text-sm font-medium"
                >
                  {skillsList.map((sk) => (
                    <option key={sk.id} value={sk.id}>
                      {sk.name} ({sk.level_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">نتیجه سنجش:</label>
                  <select
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-800 dark:text-slate-200 text-sm font-medium"
                  >
                    <option value="PASSED">قبول / کسب مهارت</option>
                    <option value="IN_PROGRESS">در حال تمرین</option>
                    <option value="NEEDS_PRACTICE">نیازمند تمرین بیشتر</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">نمره (از 100):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-800 dark:text-slate-200 font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">توضیحات و بازخورد مربی:</label>
                <textarea
                  rows="3"
                  placeholder="نکات تکنیکی، اصلاحات مورد نیاز یا نقاط قوت شاگرد..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-800 dark:text-slate-200 text-sm leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAssessmentModal(false)}
                  className="text-sm"
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={savingAssessment}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm"
                >
                  ثبت ارزیابی
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Promotion Proposal Modal */}
      {showPromotionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              پیشنهاد ارتقای سطح برای {swimmer.full_name}
            </h3>
            <p className="text-sm text-slate-500">
              سطح فعلی شناگر: <span className="font-bold text-slate-800 dark:text-white">{swimmer.current_level_name}</span>. این پیشنهاد پس از ثبت برای تأیید نهایی به مدیر آموزشگاه ارسال می‌گردد.
            </p>

            <form onSubmit={handleSavePromotion} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">سطح جدید پیشنهادی:</label>
                <select
                  value={targetLevelId}
                  onChange={(e) => setTargetLevelId(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-800 dark:text-slate-200 text-sm font-medium"
                >
                  <option value="">-- انتخاب سطح مقصد --</option>
                  {skillLevels.map((lvl) => (
                    <option key={lvl.id} value={lvl.id}>
                      {lvl.name} (سطح {lvl.order})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">دلیل و شواهد مربی برای ارتقا:</label>
                <textarea
                  rows="3"
                  placeholder="شرح تسلط شاگرد بر سرفصل‌های سطح قبلی و آمادگی کامل برای سطح بالاتر..."
                  value={coachNotes}
                  onChange={(e) => setCoachNotes(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-800 dark:text-slate-200 text-sm leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPromotionModal(false)}
                  className="text-sm"
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={submittingPromotion}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm"
                >
                  ارسال پیشنهاد به مدیر
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
