import React, { useState, useEffect } from 'react';
import { Award, Timer, Plus, CheckCircle2 } from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';

export const CoachAssessmentsPage = () => {
  const [assessments, setAssessments] = useState([]);
  const [records, setRecords] = useState([]);
  const [swimmers, setSwimmers] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal 1: Assessment Form
  const [isAssModalOpen, setIsAssModalOpen] = useState(false);
  const [assForm, setAssForm] = useState({
    swimmer: '',
    skill: '',
    score: '90.00',
    status: 'PASSED',
    feedback: '',
    assessed_at: new Date().toISOString().slice(0, 10),
  });

  // Modal 2: Record Form
  const [isRecModalOpen, setIsRecModalOpen] = useState(false);
  const [recForm, setRecForm] = useState({
    swimmer: '',
    stroke: 'FREESTYLE',
    distance_meters: 50,
    duration_seconds: '',
    pool_course: 'SHORT_25M',
    recorded_at: new Date().toISOString().slice(0, 10),
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
      setAssForm({ swimmer: '', skill: '', score: '90.00', status: 'PASSED', feedback: '', assessed_at: new Date().toISOString().slice(0, 10) });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'خطا در ثبت ارزیابی');
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
      setRecForm({ swimmer: '', stroke: 'FREESTYLE', distance_meters: 50, duration_seconds: '', pool_course: 'SHORT_25M', recorded_at: new Date().toISOString().slice(0, 10), notes: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'خطا در ثبت رکورد زمانی');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            ارزیابی مهارت‌های آموزشی و رکوردهای زمانی شنا
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            سنجش سرفصل‌های آموزشی شناگران و ثبت رکوردهای رسمی آزمون و مسابقات
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setIsAssModalOpen(true)} className="gap-1.5">
            <Plus className="w-4 h-4" />
            <span>ثبت ارزیابی مهارت</span>
          </Button>
          <Button size="sm" variant="outline" onClick={() => setIsRecModalOpen(true)} className="gap-1.5">
            <Timer className="w-4 h-4" />
            <span>ثبت رکورد زمانی</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingState message="در حال دریافت اطلاعات ارزیابی‌ها و رکوردها..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Skill Assessments Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 pb-3 mb-3 border-b border-slate-100 flex items-center justify-between">
              <span>ارزیابی‌های مهارتی اخیر</span>
              <span className="text-xs font-mono text-slate-400">{assessments.length} مورد</span>
            </h2>
            {assessments.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">ارزیابی ثبت نشده است.</p>
            ) : (
              <div className="space-y-3">
                {assessments.map((ass) => (
                  <div key={ass.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800">{ass.swimmer_name}</span>
                      <Badge variant={ass.status === 'PASSED' ? 'success' : 'warning'}>
                        {ass.status_display} ({ass.score})
                      </Badge>
                    </div>
                    <div className="text-slate-600 mb-1">{ass.skill_name}</div>
                    {ass.feedback && <div className="text-slate-500 italic mt-1 bg-white p-2 rounded border border-slate-100">{ass.feedback}</div>}
                    <div className="text-slate-400 text-[10px] mt-2 font-mono">{ass.assessed_at}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Swimming Records Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 pb-3 mb-3 border-b border-slate-100 flex items-center justify-between">
              <span>رکوردهای زمانی ثبت‌شده</span>
              <span className="text-xs font-mono text-slate-400">{records.length} رکورد</span>
            </h2>
            {records.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">رکوردی ثبت نشده است.</p>
            ) : (
              <div className="space-y-3">
                {records.map((rec) => (
                  <div key={rec.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block">{rec.swimmer_name}</span>
                      <span className="text-slate-600">
                        {rec.distance_meters} متر {rec.stroke_display}
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="font-mono font-bold text-sm text-sky-700 block">{rec.formatted_time}</span>
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
        <form onSubmit={handleCreateAssessment} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">شناگر مورد سنجش:</label>
            <select
              required
              value={assForm.swimmer}
              onChange={(e) => setAssForm({ ...assForm, swimmer: e.target.value })}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white"
            >
              <option value="">انتخاب شناگر...</option>
              {swimmers.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name} ({s.phone})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">سرفصل مهارتی:</label>
            <select
              required
              value={assForm.skill}
              onChange={(e) => setAssForm({ ...assForm, skill: e.target.value })}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white"
            >
              <option value="">انتخاب مهارت...</option>
              {skills.map((sk) => (
                <option key={sk.id} value={sk.id}>{sk.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">نمره (از ۱۰۰):</label>
              <input
                type="number"
                step="0.5"
                required
                value={assForm.score}
                onChange={(e) => setAssForm({ ...assForm, score: e.target.value })}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">نتیجه نهایی:</label>
              <select
                value={assForm.status}
                onChange={(e) => setAssForm({ ...assForm, status: e.target.value })}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5"
              >
                <option value="PASSED">قبول / کسب مهارت</option>
                <option value="IN_PROGRESS">در حال تمرین</option>
                <option value="NEEDS_PRACTICE">نیازمند تمرین بیشتر</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">توضیحات و بازخورد مربی:</label>
            <textarea
              rows={2}
              value={assForm.feedback}
              onChange={(e) => setAssForm({ ...assForm, feedback: e.target.value })}
              placeholder="نکات تکنیکی و اصلاحی برای شاگرد..."
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setIsAssModalOpen(false)}>انصراف</Button>
            <Button type="submit" loading={saving}>ثبت ارزیابی</Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Swimming Record */}
      <Modal isOpen={isRecModalOpen} onClose={() => setIsRecModalOpen(false)} title="ثبت رکورد زمانی شنا">
        <form onSubmit={handleCreateRecord} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">شناگر:</label>
            <select
              required
              value={recForm.swimmer}
              onChange={(e) => setRecForm({ ...recForm, swimmer: e.target.value })}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white"
            >
              <option value="">انتخاب شناگر...</option>
              {swimmers.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name} ({s.phone})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">ماده / سبک شنا:</label>
              <select
                value={recForm.stroke}
                onChange={(e) => setRecForm({ ...recForm, stroke: e.target.value })}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5"
              >
                <option value="FREESTYLE">کرال سینه (آزاد)</option>
                <option value="BACKSTROKE">کرال پشت</option>
                <option value="BREASTSTROKE">شنای قورباغه</option>
                <option value="BUTTERFLY">شنای پروانه</option>
                <option value="MEDLEY">مختلط انفرادی</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">مسافت (متر):</label>
              <input
                type="number"
                required
                value={recForm.distance_meters}
                onChange={(e) => setRecForm({ ...recForm, distance_meters: e.target.value })}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">زمان ثبت‌شده به ثانیه (مثال: 32.45):</label>
            <input
              type="number"
              step="0.01"
              required
              value={recForm.duration_seconds}
              onChange={(e) => setRecForm({ ...recForm, duration_seconds: e.target.value })}
              placeholder="32.45"
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setIsRecModalOpen(false)}>انصراف</Button>
            <Button type="submit" loading={saving}>ارسال جهت تأیید رسمی</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
