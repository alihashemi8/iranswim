import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, PlusCircle, Sparkles, Clock, Target,
  CheckCircle2, Copy, FileText, ChevronLeft, ChevronDown,
  Trash2, Edit, Save, X
} from 'lucide-react';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';

export const CoachWorkoutsPage = () => {
  const [workouts, setWorkouts] = useState([]);
  const [classes, setClasses] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [groupId, setGroupId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [duration, setDuration] = useState(60);
  const [focusSkills, setFocusSkills] = useState('');
  const [warmup, setWarmup] = useState('');
  const [mainSet, setMainSet] = useState('');
  const [cooldown, setCooldown] = useState('');
  const [notes, setNotes] = useState('');
  const [isTemplate, setIsTemplate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const toast = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [wRes, cRes, lRes] = await Promise.all([
        api.get('/coaches/workouts/'),
        api.get('/coaches/my-classes/'),
        api.get('/education/levels/'),
      ]);
      setWorkouts(wRes.data.results || wRes.data || []);
      setClasses(cRes.data || []);
      setLevels(lRes.data || []);
    } catch (err) {
      console.error('Error fetching workouts:', err);
      toast.error('خطا در دریافت برنامه‌های تمرینی');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setGroupId('');
    setLevelId('');
    setDuration(60);
    setFocusSkills('');
    setWarmup('');
    setMainSet('');
    setCooldown('');
    setNotes('');
    setIsTemplate(false);
    setShowEditor(false);
  };

  const handleEdit = (w) => {
    setEditingId(w.id);
    setTitle(w.title || '');
    setGroupId(w.group || '');
    setLevelId(w.target_level || '');
    setDuration(w.duration_minutes || 60);
    setFocusSkills(w.focus_skills || '');
    setWarmup(w.warmup_section || '');
    setMainSet(w.main_section || '');
    setCooldown(w.cooldown_section || '');
    setNotes(w.notes || '');
    setIsTemplate(w.is_template || false);
    setShowEditor(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerateWithAI = async () => {
    try {
      setAiLoading(true);
      const res = await api.post('/coaches/ai/assist/', {
        mode: 'PRACTICE_PLAN',
        level_name: levels.find(l => l.id === Number(levelId))?.name || 'متوسط',
        stroke: 'کرال سینه و استقامت',
        duration_minutes: duration,
        target_focus: focusSkills || 'بهبود ریتم تنفس و پای قدرتی',
      });
      const generated = res.data.data;
      if (!title) setTitle(generated.title);
      if (!focusSkills) setFocusSkills(generated.focus_skills);
      setWarmup(generated.warmup_section);
      setMainSet(generated.main_section);
      setCooldown(generated.cooldown_section);
      setNotes(generated.notes);
      toast.success('طرح تمرین پیشنهادی هوش مصنوعی در فرم بارگذاری شد.');
    } catch (err) {
      console.error(err);
      toast.error('خطا در ارتباط با دستیار هوشمند');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title || !mainSet) {
      toast.error('عنوان برنامه و بخش تمرین اصلی الزامی هستند.');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        title,
        group: groupId ? Number(groupId) : null,
        target_level: levelId ? Number(levelId) : null,
        duration_minutes: Number(duration),
        focus_skills: focusSkills,
        warmup_section: warmup,
        main_section: mainSet,
        cooldown_section: cooldown,
        notes,
        is_template: isTemplate,
      };

      if (editingId) {
        await api.put(`/coaches/workouts/${editingId}/`, payload);
        toast.success('برنامه تمرین با موفقیت به‌روزرسانی شد.');
      } else {
        await api.post('/coaches/workouts/', payload);
        toast.success('برنامه تمرین جدید ذخیره شد.');
      }
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('خطا در ذخیره برنامه تمرین');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState type="dashboard" message="در حال دریافت برنامه‌ها و الگوهای تمرین..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-600" />
            طراحی و بانک برنامه‌های تمرین
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            طراحی جلسات آموزشی، تمرینات گرم‌کردن، ست‌های اصلی شنا و سردکردن
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!showEditor && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowEditor(true)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <PlusCircle className="w-4 h-4" />
              طراحی برنامه تمرین جدید
            </Button>
          )}
        </div>
      </div>

      {/* Workout Editor Form */}
      {showEditor && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-500/50 p-6 shadow-md space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              {editingId ? 'ویرایش برنامه تمرین' : 'طراحی برنامه تمرینی جدید'}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateWithAI}
                disabled={aiLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-bold border border-purple-200 dark:border-purple-800 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                {aiLoading ? 'درحال تولید ایده...' : 'پیشنهاد با هوش مصنوعی'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  عنوان برنامه تمرینی: *
                </label>
                <input
                  type="text"
                  placeholder="مثال: تمرین استقامتی کرال سینه و دریل‌های Catch-up"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  مدت زمان جلسه (دقیقه):
                </label>
                <input
                  type="number"
                  min="30"
                  max="180"
                  step="15"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  کلاس هدف (اختیاری):
                </label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-800 dark:text-slate-200"
                >
                  <option value="">-- برنامه عمومی برای همه کلاس‌ها --</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  سطح مهارت هدف:
                </label>
                <select
                  value={levelId}
                  onChange={(e) => setLevelId(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-800 dark:text-slate-200"
                >
                  <option value="">-- همه سطوح --</option>
                  {levels.map((lvl) => (
                    <option key={lvl.id} value={lvl.id}>
                      {lvl.name} (سطح {lvl.order})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  تمرکز آموزشی اصلی:
                </label>
                <input
                  type="text"
                  placeholder="مثال: تنفس جانبی، پای قورباغه، استارت"
                  value={focusSkills}
                  onChange={(e) => setFocusSkills(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Three Phase Training Sections */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  ۱. بخش گرم‌کردن و حرکات کششی در آب (Warm-up):
                </label>
                <textarea
                  rows="3"
                  placeholder="مثال: ۲۰۰ متر شنای آرام و کشیده + ۲۰۰ متر کیک با تخته شنا..."
                  value={warmup}
                  onChange={(e) => setWarmup(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  ۲. بخش اصلی و ست‌های تمرین (Main Set): *
                </label>
                <textarea
                  rows="5"
                  placeholder="مثال: ۸ ست ۵۰ متر دریل با فواصل استراحت ۲۰ ثانیه..."
                  value={mainSet}
                  onChange={(e) => setMainSet(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white leading-relaxed font-mono text-[12px]"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                  ۳. بخش سردکردن و ریکاوری (Cool-down):
                </label>
                <textarea
                  rows="2"
                  placeholder="مثال: ۱۰۰ متر کرال پشت آرام و تمرینات تنفس عمیق..."
                  value={cooldown}
                  onChange={(e) => setCooldown(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  نکات تکنیکی و یادداشت مربی:
                </label>
                <textarea
                  rows="2"
                  placeholder="نکات ایمنی، تجهیزات مورد نیاز استخر..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTemplate}
                  onChange={(e) => setIsTemplate(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                  ذخیره به عنوان الگوی قابل استفاده مجدد (Template)
                </span>
              </label>

              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                  انصراف
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  ذخیره برنامه تمرین
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Workouts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workouts.length > 0 ? (
          workouts.map((w) => (
            <div
              key={w.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {w.is_template && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 mb-1 inline-block">
                        الگوی تمرینی
                      </span>
                    )}
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {w.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {w.target_level_name ? `سطح: ${w.target_level_name}` : 'عمومی'} · {w.duration_minutes} دقیقه
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEdit(w)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-emerald-600 transition-colors"
                    title="ویرایش برنامه"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>

                {w.focus_skills && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">تمرکز: </span>
                    {w.focus_skills}
                  </div>
                )}

                <div className="space-y-2 text-xs">
                  {w.warmup_section && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">گرم‌کردن:</span>
                      <p className="text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {w.warmup_section}
                      </p>
                    </div>
                  )}

                  {w.main_section && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">بخش اصلی تمرین:</span>
                      <p className="text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed font-mono text-[11px]">
                        {w.main_section}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>تاریخ ثبت: {new Date(w.created_at).toLocaleDateString('fa-IR')}</span>
                <button
                  type="button"
                  onClick={() => handleEdit(w)}
                  className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  مشاهده ست‌های کامل
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-2">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">هنوز برنامه‌ای ذخیره نشده است</h3>
            <p className="text-xs text-slate-500">
              با استفاده از دکمه «طراحی برنامه تمرین جدید» یا دستیار هوشمند، نخستین جلسه تمرینی خود را تدوین فرمایید.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
