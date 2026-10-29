import React, { useState, useEffect } from 'react';
import { Award, Timer, Plus } from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';

export const CoachAssessmentsPage = () => {
  const [assessments, setAssessments] = useState([]);
  const [records, setRecords] = useState([]);
  const [swimmers, setSwimmers] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const getTodayDate = () => new Date().toISOString().slice(0, 10);

  // Modal 1: Assessment Form
  const [isAssModalOpen, setIsAssModalOpen] = useState(false);
  const [assForm, setAssForm] = useState({
    swimmer: '',
    skill: '',
    score: '90.00',
    status: 'PASSED',
    feedback: '',
    assessed_at: getTodayDate(),
  });

  // Modal 2: Record Form
  const [isRecModalOpen, setIsRecModalOpen] = useState(false);
  const [recForm, setRecForm] = useState({
    swimmer: '',
    stroke: 'FREESTYLE',
    distance_meters: 50,
    duration_seconds: '',
    pool_course: 'SHORT_25M',
    recorded_at: getTodayDate(),
    notes: '',
  });

  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assRes, recRes, swimRes, lvlRes] = await Promise.all([
        api.get('/assessments/skills/'),
        api.get('/assessments/records/'),
        api.get('/swimmers/'),
        api.get('/education/levels/'),
      ]);
      setAssessments(assRes.data.results || assRes.data);
      setRecords(recRes.data.results || recRes.data);
      setSwimmers(swimRes.data.results || swimRes.data);

      const allSkills = [];
      (lvlRes.data.results || lvlRes.data).forEach((lvl) => {
        if (lvl.skills) allSkills.push(...lvl.skills);
      });
      setSkills(allSkills);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت ارزیابی‌ها و رکوردهای مربی');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAssessment = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.post('/assessments/skills/', assForm);
      setIsAssModalOpen(false);
      setAssForm({ swimmer: '', skill: '', score: '90.00', status: 'PASSED', feedback: '', assessed_at: getTodayDate() });
      toast.success('ارزیابی مهارت شناگر با موفقیت ثبت شد.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در ثبت ارزیابی');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRecord = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.post('/assessments/records/', recForm);
      setIsRecModalOpen(false);
      setRecForm({ swimmer: '', stroke: 'FREESTYLE', distance_meters: 50, duration_seconds: '', pool_course: 'SHORT_25M', recorded_at: getTodayDate(), notes: '' });
      toast.success('رکورد زمانی شناگر با موفقیت در سامانه ثبت گردید.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در ثبت رکورد زمانی');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Award className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600 dark:text-emerald-400" />
            ارزیابی مهارت‌های آموزشی و رکوردهای زمانی شنا
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            سنجش سرفصل‌های آموزشی شناگران و ثبت رکوردهای رسمی آزمون و مسابقات
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button size="sm" onClick={() => setIsAssModalOpen(true)} className="gap-2 text-sm sm:text-base font-bold px-4 py-2.5">
            <Plus className="w-4.5 h-4.5" />
            <span>ثبت ارزیابی مهارت</span>
          </Button>
          <Button size="sm" variant="outline" onClick={() => setIsRecModalOpen(true)} className="gap-2 text-sm sm:text-base font-bold px-4 py-2.5">
            <Timer className="w-4.5 h-4.5" />
            <span>ثبت رکورد زمانی</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingState type="table" rows={6} message="در حال دریافت اطلاعات ارزیابی‌ها و رکوردها..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Skill Assessments Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white pb-3 mb-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span>ارزیابی‌های مهارتی اخیر</span>
              <span className="text-sm font-mono text-slate-500 font-semibold">{assessments.length} مورد</span>
            </h2>
            {assessments.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">ارزیابی ثبت نشده است.</p>
            ) : (
              <div className="space-y-3">
                {assessments.map((ass) => (
                  <div key={ass.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-sm">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-base text-slate-900 dark:text-slate-100">{ass.swimmer_name}</span>
                      <Badge variant={ass.status === 'PASSED' ? 'success' : 'warning'}>
                        {ass.status_display} ({ass.score})
                      </Badge>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 font-medium mb-1.5">{ass.skill_name}</div>
                    {ass.feedback && <div className="text-slate-600 dark:text-slate-400 italic mt-1.5 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 leading-relaxed">{ass.feedback}</div>}
                    <div className="text-slate-400 text-xs mt-2 font-mono font-medium">{ass.assessed_at}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Swimming Records Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white pb-3 mb-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span>رکوردهای زمانی ثبت‌شده</span>
              <span className="text-sm font-mono text-slate-500 font-semibold">{records.length} رکورد</span>
            </h2>
            {records.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">رکوردی ثبت نشده است.</p>
            ) : (
              <div className="space-y-3">
                {records.map((rec) => (
                  <div key={rec.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-sm flex items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-base text-slate-900 dark:text-slate-100 block">{rec.swimmer_name}</span>
                      <span className="text-slate-600 dark:text-slate-300 font-medium mt-0.5 block">
                        {rec.distance_meters} متر {rec.stroke_display}
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="font-mono font-black text-base sm:text-lg text-sky-700 dark:text-sky-400 block">{rec.formatted_time}</span>
                      <Badge variant={rec.verification_status === 'VERIFIED' ? 'success' : 'warning'}>
                        {rec.verification_status_display}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 1: Skill Assessment */}
      <Modal isOpen={isAssModalOpen} onClose={() => setIsAssModalOpen(false)} title="ثبت ارزیابی مهارت آموزشی">
        <form onSubmit={handleCreateAssessment} className="space-y-4 text-sm">
          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">شناگر مورد سنجش:</label>
            <select
              required
              value={assForm.swimmer}
              onChange={(e) => setAssForm({ ...assForm, swimmer: e.target.value })}
              className="w-full text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
            >
              <option value="">انتخاب شناگر...</option>
              {swimmers.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name} ({s.phone})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">سرفصل مهارتی:</label>
            <select
              required
              value={assForm.skill}
              onChange={(e) => setAssForm({ ...assForm, skill: e.target.value })}
              className="w-full text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
            >
              <option value="">انتخاب مهارت...</option>
              {skills.map((sk) => (
                <option key={sk.id} value={sk.id}>{sk.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">نمره (از ۱۰۰):</label>
              <input
                type="number"
                step="0.5"
                required
                value={assForm.score}
                onChange={(e) => setAssForm({ ...assForm, score: e.target.value })}
                className="w-full text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">نتیجه نهایی:</label>
              <select
                value={assForm.status}
                onChange={(e) => setAssForm({ ...assForm, status: e.target.value })}
                className="w-full text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
              >
                <option value="PASSED">قبول / کسب مهارت</option>
                <option value="IN_PROGRESS">در حال تمرین</option>
                <option value="FAILED">مردود / نیاز به بازآموزی</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">بازخورد و نکات فنی مربی:</label>
            <textarea
              rows={2}
              value={assForm.feedback}
              onChange={(e) => setAssForm({ ...assForm, feedback: e.target.value })}
              placeholder="مثال: تکنیک تنفس صحیح است اما زاویه ورود دست به آب باید اصلاح گردد..."
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 leading-relaxed"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <Button variant="secondary" type="button" onClick={() => setIsAssModalOpen(false)} className="text-sm font-medium">
              انصراف
            </Button>
            <Button type="submit" loading={saving} className="text-sm font-bold">
              ثبت ارزیابی
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Swimming Record */}
      <Modal isOpen={isRecModalOpen} onClose={() => setIsRecModalOpen(false)} title="ثبت رکورد زمانی شناگر">
        <form onSubmit={handleCreateRecord} className="space-y-4 text-sm">
          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">شناگر صاحب رکورد:</label>
            <select
              required
              value={recForm.swimmer}
              onChange={(e) => setRecForm({ ...recForm, swimmer: e.target.value })}
              className="w-full text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
            >
              <option value="">انتخاب شناگر...</option>
              {swimmers.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name} ({s.phone})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">سبک شنا:</label>
              <select
                value={recForm.stroke}
                onChange={(e) => setRecForm({ ...recForm, stroke: e.target.value })}
                className="w-full text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
              >
                <option value="FREESTYLE">شنای آزاد (کرال سینه)</option>
                <option value="BREASTSTROKE">قورباغه</option>
                <option value="BACKSTROKE">کرال پشت</option>
                <option value="BUTTERFLY">پروانه</option>
                <option value="MEDLEY">مختلط انفرادی</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">مسافت (متر):</label>
              <input
                type="number"
                required
                value={recForm.distance_meters}
                onChange={(e) => setRecForm({ ...recForm, distance_meters: e.target.value })}
                className="w-full text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">زمان ثبت‌شده (ثانیه دقیق):</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="مثال: 28.45"
                value={recForm.duration_seconds}
                onChange={(e) => setRecForm({ ...recForm, duration_seconds: e.target.value })}
                className="w-full text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">ابعاد استخر (کورس):</label>
              <select
                value={recForm.pool_course}
                onChange={(e) => setRecForm({ ...recForm, pool_course: e.target.value })}
                className="w-full text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
              >
                <option value="SHORT_25M">مسافت کوتاه (۲۵ متر)</option>
                <option value="LONG_50M">مسافت استاندارد المپیک (۵۰ متر)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <Button variant="secondary" type="button" onClick={() => setIsRecModalOpen(false)} className="text-sm font-medium">
              انصراف
            </Button>
            <Button type="submit" loading={saving} className="text-sm font-bold">
              ثبت رکورد زمانی
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
