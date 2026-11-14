import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award, Star, Plus, CheckCircle2, TrendingUp, UserCheck, MessageSquare,
  FileText, Shield, Eye
} from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { PersianDatePicker } from '../../../components/common/PersianDatePicker';
import { useToast } from '../../../context/ToastContext';
import api from '../../../api/client';

const EVAL_CRITERIA = [
  { key: 'teaching_quality', label: 'کیفیت تدریس و فن بیان تکنیک‌ها', max: 5 },
  { key: 'student_satisfaction', label: 'رضایت شاگردان و والدین', max: 5 },
  { key: 'student_progress', label: 'رشد و ارتقای سطح مهارتی شناگران', max: 5 },
  { key: 'punctuality', label: 'نظم و حضور به‌موقع در لبه استخر', max: 5 },
  { key: 'attendance_reliability', label: 'ثبت دقیق دفتر الکترونیک حضور و غیاب', max: 5 },
  { key: 'professional_conduct', label: 'اخلاق حرفه‌ای و تعامل با کادر آکادمی', max: 5 },
  { key: 'class_completion', label: 'درصد برگزاری کامل سرفصل‌های دوره', max: 5 },
  { key: 'academy_standards', label: 'رعایت پروتکل‌های بهداشتی و نجات‌غریق', max: 5 },
];

export const CoachPerformanceTab = ({ coach, evaluations, onEvaluationsUpdated }) => {
  const navigate = useNavigate();
  const toast = useToast();

  const [isNewEvalModalOpen, setIsNewEvalModalOpen] = useState(false);
  const [selectedEvalDetail, setSelectedEvalDetail] = useState(null);

  const [evalForm, setEvalForm] = useState({
    period_label: `ارزیابی ${new Date().toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' })}`,
    evaluation_date: new Date().toISOString().split('T')[0],
    criteria_ratings: {
      teaching_quality: 5,
      student_satisfaction: 5,
      student_progress: 5,
      punctuality: 5,
      attendance_reliability: 5,
      professional_conduct: 5,
      class_completion: 5,
      academy_standards: 5,
    },
    strengths: '',
    weaknesses: '',
    recommendations: '',
    general_feedback: '',
    is_shared_with_coach: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Latest evaluation
  const latestEval = evaluations.length > 0 ? evaluations[0] : null;

  // Calculate average overall score across criteria
  const calculateOverall = (ratings) => {
    const vals = Object.values(ratings).map(Number);
    if (!vals.length) return 5;
    const sum = vals.reduce((a, b) => a + b, 0);
    return (sum / vals.length).toFixed(2);
  };

  const handleRatingChange = (key, val) => {
    const updated = {
      ...evalForm.criteria_ratings,
      [key]: Number(val),
    };
    setEvalForm({
      ...evalForm,
      criteria_ratings: updated,
    });
  };

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    const overall = calculateOverall(evalForm.criteria_ratings);

    try {
      setSubmitting(true);
      await api.post(`/coaches/${coach.id}/evaluations/`, {
        ...evalForm,
        overall_score: overall,
      });

      toast.success('ارزیابی عملکرد مربی با موفقیت ثبت شد.');
      setIsNewEvalModalOpen(false);
      if (onEvaluationsUpdated) onEvaluationsUpdated();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت ارزیابی عملکرد');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            ارزیابی عملکرد حرفه‌ای و مهارت‌های مربیگری
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            سنجش دوره‌ای ۸ شاخص کلیدی عملکرد توسط مدیریت و ناظر فنی آموزشگاه
          </p>
        </div>

        <Button
          onClick={() => navigate(`/admin/coaches/${coach.id}/evaluations/new`)}
          className="gap-1.5 text-xs bg-sky-600 hover:bg-sky-500 text-white shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت ارزیابی جدید</span>
        </Button>
      </div>

      {/* Latest Evaluation Overview Hero Box */}
      {latestEval ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  آخرین ارزیابی مصوب: {latestEval.period_label}
                </h4>
                <span className="text-[11px] bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  امتیاز کل: {latestEval.overall_score} از ۵
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ثبت‌شده در تاریخ {new Date(latestEval.evaluation_date).toLocaleDateString('fa-IR')} توسط {latestEval.evaluator_name || 'ناظر فنی'}
              </p>
            </div>
          </div>

          {/* Criteria Progress Bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {EVAL_CRITERIA.map((crit) => {
              const score = latestEval.criteria_ratings?.[crit.key] || 5;
              const pct = (score / 5) * 100;
              return (
                <div key={crit.key} className="space-y-1 bg-slate-50/60 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{crit.label}</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">{score} از ۵</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        score >= 4.5 ? 'bg-emerald-500' : score >= 3.5 ? 'bg-sky-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Qualitative Notes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2">
            {latestEval.strengths && (
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                <strong className="text-emerald-800 dark:text-emerald-300 block mb-1">نقاط قوت برجسته:</strong>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{latestEval.strengths}</p>
              </div>
            )}

            {latestEval.weaknesses && (
              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/40">
                <strong className="text-amber-800 dark:text-amber-300 block mb-1">زمینه‌های نیازمند بهبود:</strong>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{latestEval.weaknesses}</p>
              </div>
            )}

            {latestEval.recommendations && (
              <div className="p-3 bg-sky-50/60 dark:bg-sky-950/20 rounded-xl border border-sky-100 dark:border-sky-900/40">
                <strong className="text-sky-800 dark:text-sky-300 block mb-1">توصیه‌ها و برنامه‌های ارتقا:</strong>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{latestEval.recommendations}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
          <Award className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            هنوز ارزیابی عملکردی برای این مربی ثبت نشده است
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            مدیران آموزشگاه و ناظران فنی می‌توانند ارزیابی‌های ماهانه یا فصلی را ثبت کنند.
          </p>
        </div>
      )}

      {/* Historical Evaluations Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
            سوابق کلیه ارزیابی‌های گذشته ({evaluations.length} دوره)
          </h4>
          <span className="text-[11px] text-slate-400">مربیان امکان ویرایش یا دستکاری ارزیابی‌ها را ندارند</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-bold">دوره ارزیابی</th>
                <th className="py-3 px-4 font-bold">تاریخ ارزیابی</th>
                <th className="py-3 px-4 font-bold">ارزیاب</th>
                <th className="py-3 px-4 font-bold">نمره کل (از ۵)</th>
                <th className="py-3 px-4 font-bold">وضعیت اشتراک</th>
                <th className="py-3 px-4 font-bold text-center">جزئیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {evaluations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    هیچ ارزیابی عملکردی ثبت نشده است.
                  </td>
                </tr>
              ) : (
                evaluations.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {ev.period_label}
                    </td>
                    <td className="py-3 px-4 font-mono">{new Date(ev.evaluation_date).toLocaleDateString('fa-IR')}</td>
                    <td className="py-3 px-4 text-slate-500">{ev.evaluator_name || 'ناظر فنی'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                      ★ {ev.overall_score}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={ev.is_shared_with_coach ? 'success' : 'neutral'}>
                        {ev.is_shared_with_coach ? 'نمایش در پرتال مربی' : 'محرمانه'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedEvalDetail(ev)}
                        className="text-xs text-sky-600 hover:text-sky-700 font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>مشاهده</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Performance Evaluation */}
      <Modal
        isOpen={isNewEvalModalOpen}
        onClose={() => setIsNewEvalModalOpen(false)}
        title={`ثبت ارزیابی عملکرد مربی: ${coach.full_name}`}
        size="lg"
      >
        <form onSubmit={handleSubmitEvaluation} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                عنوان دوره ارزیابی <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={evalForm.period_label}
                onChange={(e) => setEvalForm({ ...evalForm, period_label: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <PersianDatePicker
                label="تاریخ ارزیابی *"
                value={evalForm.evaluation_date}
                onChange={(jalaliStr, gDate, gIso) => setEvalForm({ ...evalForm, evaluation_date: gIso || '' })}
                placeholder="انتخاب تاریخ..."
                color="sky"
                size="sm"
                required
              />
            </div>
          </div>

          {/* Criteria Inputs */}
          <div className="space-y-3 pt-2">
            <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200 pb-1 border-b border-slate-100 dark:border-slate-800">
              امتیازدهی به شاخص‌های ۸ گانه (نمره ۱ تا ۵)
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EVAL_CRITERIA.map((crit) => (
                <div key={crit.key} className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {crit.label}
                    </label>
                    <span className="font-mono font-bold text-sky-600 text-xs">
                      {evalForm.criteria_ratings[crit.key]} از ۵
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={evalForm.criteria_ratings[crit.key]}
                    onChange={(e) => handleRatingChange(crit.key, e.target.value)}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Overall Preview */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900 flex items-center justify-between text-xs">
            <span className="font-bold text-amber-900 dark:text-amber-200">
              نمره کل محاسبه‌شده عملکرد:
            </span>
            <span className="font-bold font-mono text-base text-amber-800 dark:text-amber-300">
              {calculateOverall(evalForm.criteria_ratings)} از ۵.۰۰
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              نقاط قوت برجسته مربی
            </label>
            <textarea
              rows={2}
              value={evalForm.strengths}
              onChange={(e) => setEvalForm({ ...evalForm, strengths: e.target.value })}
              placeholder="ارتباط عالی با کودکان، تسلط بر اصلاح تکنیک کرال..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              زمینه‌های نیازمند بهبود
            </label>
            <textarea
              rows={2}
              value={evalForm.weaknesses}
              onChange={(e) => setEvalForm({ ...evalForm, weaknesses: e.target.value })}
              placeholder="نیاز به ثبت سریع‌تر دفتر حضور و غیاب، شرکت در کارگاه‌های آب‌درمانی..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              توصیه‌ها و برنامه‌های ارتقا
            </label>
            <textarea
              rows={2}
              value={evalForm.recommendations}
              onChange={(e) => setEvalForm({ ...evalForm, recommendations: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              جمع‌بندی و بازخورد کلی
            </label>
            <textarea
              rows={2}
              value={evalForm.general_feedback}
              onChange={(e) => setEvalForm({ ...evalForm, general_feedback: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={evalForm.is_shared_with_coach}
                onChange={(e) => setEvalForm({ ...evalForm, is_shared_with_coach: e.target.checked })}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
              />
              <span>قابلیت مشاهده این ارزیابی در پرتال مربی (ارزیابی شفاف)</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsNewEvalModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={submitting} className="bg-sky-600 hover:bg-sky-500 text-white">
              {submitting ? 'در حال ثبت...' : 'ثبت قطعی ارزیابی'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Evaluation Detail */}
      <Modal
        isOpen={!!selectedEvalDetail}
        onClose={() => setSelectedEvalDetail(null)}
        title={`جزئیات ارزیابی: ${selectedEvalDetail?.period_label}`}
        size="lg"
      >
        {selectedEvalDetail && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  نمره کلی ارزیابی: ★ {selectedEvalDetail.overall_score} از ۵
                </span>
                <span className="font-mono text-slate-400">
                  {new Date(selectedEvalDetail.evaluation_date).toLocaleDateString('fa-IR')}
                </span>
              </div>
              <p className="text-slate-500">
                ارزیاب: {selectedEvalDetail.evaluator_name || 'ناظر فنی آموزشگاه'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {EVAL_CRITERIA.map((crit) => (
                <div key={crit.key} className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">{crit.label}</span>
                  <span className="font-bold font-mono text-sky-600">{selectedEvalDetail.criteria_ratings?.[crit.key] || '—'}</span>
                </div>
              ))}
            </div>

            {selectedEvalDetail.strengths && (
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl">
                <strong className="text-emerald-800 block mb-1">نقاط قوت:</strong>
                <p className="text-slate-700 leading-relaxed">{selectedEvalDetail.strengths}</p>
              </div>
            )}

            {selectedEvalDetail.weaknesses && (
              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl">
                <strong className="text-amber-800 block mb-1">زمینه‌های نیازمند بهبود:</strong>
                <p className="text-slate-700 leading-relaxed">{selectedEvalDetail.weaknesses}</p>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setSelectedEvalDetail(null)}>
                بستن
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
