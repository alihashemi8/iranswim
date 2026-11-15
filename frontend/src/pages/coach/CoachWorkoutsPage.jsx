import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, PlusCircle, Clock, Target,
  CheckCircle2, FileText, ChevronLeft, ChevronDown,
  Trash2, Edit, Save, X, Utensils, Dumbbell, Send,
  Download, Printer, Search, Filter, Sparkles,
  User, Users, Apple, Droplets, Eye, ShieldCheck, Flame
} from 'lucide-react';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';
import { exportPlanToWord, printPlanToPdf } from '../../utils/planExport';

export const CoachWorkoutsPage = () => {
  const [workouts, setWorkouts] = useState([]);
  const [classes, setClasses] = useState([]);
  const [swimmers, setSwimmers] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active top tab: 'ALL' | 'TRAINING' | 'DIET'
  const [activeTab, setActiveTab] = useState('ALL');
  // Target scope filter: 'ALL' | 'GROUP' | 'INDIVIDUAL' | 'TEMPLATE'
  const [targetFilter, setTargetFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // General fields
  const [planType, setPlanType] = useState('TRAINING'); // 'TRAINING' | 'DIET'
  const [targetType, setTargetType] = useState('GROUP'); // 'GROUP' | 'INDIVIDUAL' | 'GENERAL'
  const [title, setTitle] = useState('');
  const [groupId, setGroupId] = useState('');
  const [swimmerId, setSwimmerId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [notes, setNotes] = useState('');
  const [isTemplate, setIsTemplate] = useState(false);
  const [saving, setSaving] = useState(false);

  // Training Plan specific fields
  const [duration, setDuration] = useState(60);
  const [focusSkills, setFocusSkills] = useState('');
  const [warmup, setWarmup] = useState('');
  const [mainSet, setMainSet] = useState('');
  const [cooldown, setCooldown] = useState('');
  const [equipment, setEquipment] = useState('');

  // Diet Plan specific fields
  const [dailyCalories, setDailyCalories] = useState('');
  const [dietGoal, setDietGoal] = useState('');
  const [breakfast, setBreakfast] = useState('');
  const [morningSnack, setMorningSnack] = useState('');
  const [lunch, setLunch] = useState('');
  const [afternoonSnack, setAfternoonSnack] = useState('');
  const [dinner, setDinner] = useState('');
  const [postWorkoutSnack, setPostWorkoutSnack] = useState('');
  const [hydrationGuidelines, setHydrationGuidelines] = useState('');
  const [supplements, setSupplements] = useState('');
  const [dietaryGuidelines, setDietaryGuidelines] = useState('');

  // Preview & Action Modals
  const [previewPlan, setPreviewPlan] = useState(null);
  const [sendingId, setSendingId] = useState(null);

  const toast = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [wRes, cRes, sRes, lRes] = await Promise.allSettled([
        api.get('/coaches/workouts/'),
        api.get('/coaches/my-classes/'),
        api.get('/coaches/my-swimmers/'),
        api.get('/education/levels/'),
      ]);

      if (wRes.status === 'fulfilled') {
        const d = wRes.value.data;
        setWorkouts(Array.isArray(d) ? d : d.results || []);
      }
      if (cRes.status === 'fulfilled') {
        setClasses(Array.isArray(cRes.value.data) ? cRes.value.data : []);
      }
      if (sRes.status === 'fulfilled') {
        setSwimmers(Array.isArray(sRes.value.data) ? sRes.value.data : []);
      }
      if (lRes.status === 'fulfilled') {
        setLevels(Array.isArray(lRes.value.data) ? lRes.value.data : []);
      }
    } catch (err) {
      console.error('Error fetching plans data:', err);
      toast.error('خطا در دریافت برنامه‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setPlanType('TRAINING');
    setTargetType('GROUP');
    setTitle('');
    setGroupId('');
    setSwimmerId('');
    setLevelId('');
    setNotes('');
    setIsTemplate(false);

    // Training fields
    setDuration(60);
    setFocusSkills('');
    setWarmup('');
    setMainSet('');
    setCooldown('');
    setEquipment('');

    // Diet fields
    setDailyCalories('');
    setDietGoal('');
    setBreakfast('');
    setMorningSnack('');
    setLunch('');
    setAfternoonSnack('');
    setDinner('');
    setPostWorkoutSnack('');
    setHydrationGuidelines('');
    setSupplements('');
    setDietaryGuidelines('');

    setShowEditor(false);
  };

  const handleEdit = (w) => {
    setEditingId(w.id);
    setPlanType(w.plan_type || 'TRAINING');
    setTargetType(w.target_type || (w.swimmer ? 'INDIVIDUAL' : w.group ? 'GROUP' : 'GENERAL'));
    setTitle(w.title || '');
    setGroupId(w.group || '');
    setSwimmerId(w.swimmer || '');
    setLevelId(w.target_level || '');
    setNotes(w.notes || '');
    setIsTemplate(w.is_template || false);

    // Training
    setDuration(w.duration_minutes || 60);
    setFocusSkills(w.focus_skills || '');
    setWarmup(w.warmup_section || '');
    setMainSet(w.main_section || '');
    setCooldown(w.cooldown_section || '');
    setEquipment(w.equipment || '');

    // Diet
    setDailyCalories(w.daily_calories ? String(w.daily_calories) : '');
    setDietGoal(w.diet_goal || '');
    setBreakfast(w.breakfast || '');
    setMorningSnack(w.morning_snack || '');
    setLunch(w.lunch || '');
    setAfternoonSnack(w.afternoon_snack || '');
    setDinner(w.dinner || '');
    setPostWorkoutSnack(w.post_workout_snack || '');
    setHydrationGuidelines(w.hydration_guidelines || '');
    setSupplements(w.supplements || '');
    setDietaryGuidelines(w.dietary_guidelines || '');

    setShowEditor(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('عنوان برنامه الزامی است.');
      return;
    }

    if (planType === 'TRAINING' && !mainSet.trim()) {
      toast.error('ثبت ست‌های اصلی تمرین شنا الزامی است.');
      return;
    }

    if (planType === 'DIET' && !breakfast.trim() && !lunch.trim() && !dinner.trim() && !dietGoal.trim()) {
      toast.error('لطفاً حداقل هدف رژیم یا یکی از وعده‌های اصلی غذایی را ثبت فرمایید.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: title.trim(),
        plan_type: planType,
        target_type: targetType,
        group: targetType === 'GROUP' && groupId ? Number(groupId) : null,
        swimmer: targetType === 'INDIVIDUAL' && swimmerId ? Number(swimmerId) : null,
        target_level: levelId ? Number(levelId) : null,
        notes: notes.trim(),
        is_template: isTemplate,

        // Training fields
        duration_minutes: planType === 'TRAINING' ? Number(duration || 60) : null,
        focus_skills: planType === 'TRAINING' ? focusSkills.trim() : '',
        warmup_section: planType === 'TRAINING' ? warmup.trim() : '',
        main_section: planType === 'TRAINING' ? mainSet.trim() : '',
        cooldown_section: planType === 'TRAINING' ? cooldown.trim() : '',
        equipment: planType === 'TRAINING' ? equipment.trim() : '',

        // Diet fields
        daily_calories: planType === 'DIET' && dailyCalories ? Number(dailyCalories) : null,
        diet_goal: planType === 'DIET' ? dietGoal.trim() : '',
        breakfast: planType === 'DIET' ? breakfast.trim() : '',
        morning_snack: planType === 'DIET' ? morningSnack.trim() : '',
        lunch: planType === 'DIET' ? lunch.trim() : '',
        afternoon_snack: planType === 'DIET' ? afternoonSnack.trim() : '',
        dinner: planType === 'DIET' ? dinner.trim() : '',
        post_workout_snack: planType === 'DIET' ? postWorkoutSnack.trim() : '',
        hydration_guidelines: planType === 'DIET' ? hydrationGuidelines.trim() : '',
        supplements: planType === 'DIET' ? supplements.trim() : '',
        dietary_guidelines: planType === 'DIET' ? dietaryGuidelines.trim() : '',
      };

      if (editingId) {
        await api.put(`/coaches/workouts/${editingId}/`, payload);
        toast.success(`برنامه ${planType === 'DIET' ? 'غذایی' : 'تمرینی'} با موفقیت به‌روزرسانی شد.`);
      } else {
        await api.post('/coaches/workouts/', payload);
        toast.success(`برنامه ${planType === 'DIET' ? 'غذایی' : 'تمرینی'} جدید با موفقیت ذخیره شد.`);
      }
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('خطا در ذخیره برنامه');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('آیا از حذف این برنامه اطمینان دارید؟')) return;
    try {
      await api.delete(`/coaches/workouts/${id}/`);
      toast.success('برنامه مورد نظر حذف گردید.');
      if (previewPlan?.id === id) setPreviewPlan(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('خطا در حذف برنامه');
    }
  };

  const handleSendPlan = async (plan) => {
    try {
      setSendingId(plan.id);
      const res = await api.post(`/coaches/workouts/${plan.id}/send/`);
      toast.success(res.data.message || 'برنامه با موفقیت برای مخاطبان ارسال شد.');
      // Update local state
      setWorkouts((prev) =>
        prev.map((w) => (w.id === plan.id ? { ...w, sent_at: res.data.sent_at || new Date().toISOString() } : w))
      );
      if (previewPlan?.id === plan.id) {
        setPreviewPlan((prev) => ({ ...prev, sent_at: res.data.sent_at || new Date().toISOString() }));
      }
    } catch (err) {
      console.error(err);
      toast.error('خطا در ارسال برنامه');
    } finally {
      setSendingId(null);
    }
  };

  // Filtered workouts
  const filteredWorkouts = useMemo(() => {
    return workouts.filter((w) => {
      // 1. Tab filter (ALL, TRAINING, DIET)
      if (activeTab === 'TRAINING' && w.plan_type !== 'TRAINING') return false;
      if (activeTab === 'DIET' && w.plan_type !== 'DIET') return false;

      // 2. Scope filter (GROUP, INDIVIDUAL, TEMPLATE)
      if (targetFilter === 'GROUP' && w.target_type !== 'GROUP') return false;
      if (targetFilter === 'INDIVIDUAL' && w.target_type !== 'INDIVIDUAL') return false;
      if (targetFilter === 'TEMPLATE' && !w.is_template) return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const inTitle = (w.title || '').toLowerCase().includes(q);
        const inGroup = (w.group_name || '').toLowerCase().includes(q);
        const inSwimmer = (w.swimmer_name || '').toLowerCase().includes(q);
        const inFocus = (w.focus_skills || '').toLowerCase().includes(q);
        const inGoal = (w.diet_goal || '').toLowerCase().includes(q);
        if (!inTitle && !inGroup && !inSwimmer && !inFocus && !inGoal) return false;
      }

      return true;
    });
  }, [workouts, activeTab, targetFilter, searchQuery]);

  // Quick metrics
  const trainingCount = useMemo(() => workouts.filter((w) => w.plan_type === 'TRAINING').length, [workouts]);
  const dietCount = useMemo(() => workouts.filter((w) => w.plan_type === 'DIET').length, [workouts]);
  const groupCount = useMemo(() => workouts.filter((w) => w.target_type === 'GROUP').length, [workouts]);
  const individualCount = useMemo(() => workouts.filter((w) => w.target_type === 'INDIVIDUAL').length, [workouts]);

  if (loading) {
    return <LoadingState type="dashboard" message="در حال بارگذاری بانک برنامه‌های تمرینی و غذایی مربی..." />;
  }

  return (
    <div className="space-y-6 pb-12 coach-panel">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-bold mb-2">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>سامانه طراحی، صدور و ارسال برنامه‌های ورزشی مربی</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Calendar className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>برنامه</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            تدوین و صدور برنامه‌های تمرینی شنا و رژیم‌های غذایی ورزشی؛ به تفکیک برای کل کلاس یا اختصاصی برای هر شناگر با قابلیت دانلود فایل Word و PDF و ارسال درون‌برنامه‌ای
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {!showEditor && (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                resetForm();
                setShowEditor(true);
              }}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base px-5 py-2.5 rounded-xl shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              <span>طراحی برنامه جدید</span>
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-slate-500 font-bold">کل برنامه‌ها</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            {workouts.length}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-slate-500 font-bold">برنامه‌های تمرینی</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Dumbbell className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-cyan-700 dark:text-cyan-400 mt-2 font-mono">
            {trainingCount}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-slate-500 font-bold">برنامه‌های غذایی</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-2 font-mono">
            {dietCount}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-slate-500 font-bold">برنامه‌های فردی / کلاسی</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-purple-700 dark:text-purple-400 mt-2 font-mono">
            {individualCount} فردی · {groupCount} کلاسی
          </div>
        </div>
      </div>

      {/* Editor Form Modal / Card */}
      {showEditor && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-blue-500/60 p-5 sm:p-7 shadow-lg space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${planType === 'DIET' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                {planType === 'DIET' ? <Utensils className="w-5 h-5" /> : <Dumbbell className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {editingId ? 'ویرایش برنامه' : 'طراحی برنامه جدید'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {planType === 'DIET' ? 'تدوین رژیم غذایی و هیدراتاسیون ورزشی' : 'طراحی جلسه و ست‌های آموزشی و استقامتی شنا'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6 text-sm">
            {/* Step 1: Program Type Selector */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-2">
                ۱. نوع برنامه را انتخاب فرمایید: <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => setPlanType('TRAINING')}
                  className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border-2 font-black transition-all cursor-pointer ${
                    planType === 'TRAINING'
                      ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Dumbbell className="w-5 h-5" />
                  <span>برنامه تمرینی</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPlanType('DIET')}
                  className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border-2 font-black transition-all cursor-pointer ${
                    planType === 'DIET'
                      ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Utensils className="w-5 h-5" />
                  <span>برنامه غذایی</span>
                </button>
              </div>
            </div>

            {/* Step 2: Target Scope Selector (Class vs Individual Swimmer) */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-2">
                ۲. دامنه هدف برنامه (کلاسی یا فردی): <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label
                  onClick={() => setTargetType('GROUP')}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    targetType === 'GROUP'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="targetType"
                    checked={targetType === 'GROUP'}
                    onChange={() => setTargetType('GROUP')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>کلاسی (برای کل اعضای یک کلاس)</span>
                    </div>
                    <span className="text-xs text-slate-500 block mt-0.5">ارسال همگانی برای کلیه شناگران کلاس</span>
                  </div>
                </label>

                <label
                  onClick={() => setTargetType('INDIVIDUAL')}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    targetType === 'INDIVIDUAL'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="targetType"
                    checked={targetType === 'INDIVIDUAL'}
                    onChange={() => setTargetType('INDIVIDUAL')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <User className="w-4 h-4 text-purple-600" />
                      <span>فردی (اختصاصی برای یک شناگر)</span>
                    </div>
                    <span className="text-xs text-slate-500 block mt-0.5">شخصی‌سازی‌شده برای یک شناگر مشخص</span>
                  </div>
                </label>

                <label
                  onClick={() => setTargetType('GENERAL')}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    targetType === 'GENERAL'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="targetType"
                    checked={targetType === 'GENERAL'}
                    onChange={() => setTargetType('GENERAL')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>الگوی عمومی (بدون انتساب اولیه)</span>
                    </div>
                    <span className="text-xs text-slate-500 block mt-0.5">قابل استفاده مجدد در آینده</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Target Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {targetType === 'GROUP' && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                    انتخاب کلاس هدف: <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-800 dark:text-slate-200 text-sm font-medium"
                    required
                  >
                    <option value="">-- کلاس مورد نظر را انتخاب فرمایید --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {cls.course_title ? `(${cls.course_title})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {targetType === 'INDIVIDUAL' && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                    انتخاب شناگر هدف: <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={swimmerId}
                    onChange={(e) => setSwimmerId(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-800 dark:text-slate-200 text-sm font-medium"
                    required
                  >
                    <option value="">-- شناگر مورد نظر را انتخاب فرمایید --</option>
                    {swimmers.map((sw) => (
                      <option key={sw.swimmer_id || sw.id} value={sw.swimmer_id || sw.id}>
                        {sw.full_name} {sw.level_name ? `(سطح: ${sw.level_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  سطح مهارت هدف (اختیاری):
                </label>
                <select
                  value={levelId}
                  onChange={(e) => setLevelId(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-800 dark:text-slate-200 text-sm font-medium"
                >
                  <option value="">-- برای تمامی سطوح مهارت --</option>
                  {levels.map((lvl) => (
                    <option key={lvl.id} value={lvl.id}>
                      {lvl.name} (سطح {lvl.order})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                عنوان برنامه: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder={
                  planType === 'DIET'
                    ? 'مثال: رژیم غذایی و هیدراتاسیون دوره مسابقات استانی شناگران نونهال'
                    : 'مثال: تمرین استقامتی کرال سینه و دریل‌های Catch-up'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white font-bold text-sm"
                required
              />
            </div>

            {/* TRAINING FORM FIELDS */}
            {planType === 'TRAINING' && (
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                      مدت زمان جلسه (دقیقه):
                    </label>
                    <input
                      type="number"
                      min="15"
                      max="180"
                      step="15"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                      تمرکز آموزشی یا ماده شنا:
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: تنفس جانبی، پای قورباغه، استارت"
                      value={focusSkills}
                      onChange={(e) => setFocusSkills(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                      تجهیزات و وسایل مورد نیاز:
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: فین کوتاه، کفی دستی، تخته شنا"
                      value={equipment}
                      onChange={(e) => setEquipment(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    ۱. بخش گرم‌کردن و تمرینات کششی در آب (Warm-up):
                  </label>
                  <textarea
                    rows="3"
                    placeholder="مثال: ۲۰۰ متر شنای آرام و کشیده + ۲۰۰ متر کیک با تخته شنا..."
                    value={warmup}
                    onChange={(e) => setWarmup(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white leading-relaxed text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    ۲. بخش اصلی و ست‌های تمرین (Main Set): <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows="4"
                    placeholder="مثال: ۸ ست ۵۰ متر دریل با فواصل استراحت ۲۰ ثانیه + ۴ ست ۱۰۰ متر سرعت متوسط..."
                    value={mainSet}
                    onChange={(e) => setMainSet(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white leading-relaxed font-mono text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    ۳. بخش سردکردن و ریکاوری (Cool-down):
                  </label>
                  <textarea
                    rows="2"
                    placeholder="مثال: ۱۰۰ متر کرال پشت آرام و تمرینات تنفس عمیق و رهاسازی عضلات..."
                    value={cooldown}
                    onChange={(e) => setCooldown(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white leading-relaxed text-sm"
                  />
                </div>
              </div>
            )}

            {/* DIET FORM FIELDS */}
            {planType === 'DIET' && (
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                      هدف فیزیولوژیک رژیم:
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: بارگیری کربوهیدرات، افزایش چگالی عضلانی، ریکاوری سریع"
                      value={dietGoal}
                      onChange={(e) => setDietGoal(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                      کالری هدف روزانه (کیلوکالری):
                    </label>
                    <input
                      type="number"
                      step="50"
                      placeholder="مثال: 2500"
                      value={dailyCalories}
                      onChange={(e) => setDailyCalories(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white font-mono text-sm"
                    />
                  </div>
                </div>

                {/* Meals */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                    <label className="block text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                      <Apple className="w-4 h-4 text-emerald-600" />
                      <span>وعده صبحانه:</span>
                    </label>
                    <textarea
                      rows="2"
                      placeholder="مثال: جو دوسر با شیر کم‌چرب + ۲ عدد تخم‌مرغ آب‌پز + عسل و گردو"
                      value={breakfast}
                      onChange={(e) => setBreakfast(e.target.value)}
                      className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div className="bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                    <label className="block text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                      <Apple className="w-4 h-4 text-emerald-600" />
                      <span>میان‌وعده صبح:</span>
                    </label>
                    <textarea
                      rows="2"
                      placeholder="مثال: یک عدد موز متوسط + مشت بادام خام درختی"
                      value={morningSnack}
                      onChange={(e) => setMorningSnack(e.target.value)}
                      className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div className="bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                    <label className="block text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                      <Utensils className="w-4 h-4 text-emerald-600" />
                      <span>وعده ناهار:</span>
                    </label>
                    <textarea
                      rows="2"
                      placeholder="مثال: ۲۰۰ گرم سینه مرغ گریل‌شده + یک بشقاب برنج قهوه‌ای یا پاستا + سالاد کلم بروکلی"
                      value={lunch}
                      onChange={(e) => setLunch(e.target.value)}
                      className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div className="bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                    <label className="block text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-emerald-600" />
                      <span>میان‌وعده عصر / قبل از تمرین:</span>
                    </label>
                    <textarea
                      rows="2"
                      placeholder="مثال: نان تست جو با کره بادام‌زمینی + ۳ عدد خرما (یک ساعت پیش از استخر)"
                      value={afternoonSnack}
                      onChange={(e) => setAfternoonSnack(e.target.value)}
                      className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div className="bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                    <label className="block text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                      <Utensils className="w-4 h-4 text-emerald-600" />
                      <span>وعده شام:</span>
                    </label>
                    <textarea
                      rows="2"
                      placeholder="مثال: ماهی قزل‌آلا یا سالمون بخارپز + سیب‌زمینی تنوری + سوپ سبزیجات سبک"
                      value={dinner}
                      onChange={(e) => setDinner(e.target.value)}
                      className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div className="bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                    <label className="block text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>تغذیه بعد از تمرین (ریکاوری):</span>
                    </label>
                    <textarea
                      rows="2"
                      placeholder="مثال: شیک پروتئین وی با آب نارگیل یا شیر کاکائو کم‌چرب ظرف ۳۰ دقیقه پس از تمرین"
                      value={postWorkoutSnack}
                      onChange={(e) => setPostWorkoutSnack(e.target.value)}
                      className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                      <Droplets className="w-4 h-4 text-sky-500" />
                      <span>مصرف آب و هیدراتاسیون:</span>
                    </label>
                    <textarea
                      rows="2"
                      placeholder="مثال: ۳ لیتر در روز + ۵۰۰ سی‌سی حین تمرین"
                      value={hydrationGuidelines}
                      onChange={(e) => setHydrationGuidelines(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                      مکمل‌ها و ویتامین‌ها:
                    </label>
                    <textarea
                      rows="2"
                      placeholder="مثال: ویتامین C، امگا ۳، کپسول منیزیم"
                      value={supplements}
                      onChange={(e) => setSupplements(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                      پرهیزها و نکات تغذیه‌ای:
                    </label>
                    <textarea
                      rows="2"
                      placeholder="مثال: عدم مصرف نوشابه گازدار و غذاهای سرخ‌کردنی"
                      value={dietaryGuidelines}
                      onChange={(e) => setDietaryGuidelines(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Common Notes */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                توضیحات تکمیلی و یادداشت مربی:
              </label>
              <textarea
                rows="2"
                placeholder="توصیه‌های تکمیلی، بازه زمانی اعتبار برنامه و نکات بهداشتی..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white text-sm"
              />
            </div>

            {/* Template & Form Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTemplate}
                  onChange={(e) => setIsTemplate(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4.5 h-4.5"
                />
                <span className="text-slate-700 dark:text-slate-300 font-bold text-sm">
                  ذخیره به عنوان الگوی آماده (Template) جهت استفاده مجدد
                </span>
              </label>

              <div className="flex gap-2.5">
                <Button type="button" variant="outline" size="sm" onClick={resetForm} className="text-sm font-medium">
                  انصراف
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={saving}
                  className={`gap-2 font-bold text-sm px-5 text-white ${planType === 'DIET' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  <Save className="w-4 h-4" />
                  <span>ذخیره {planType === 'DIET' ? 'برنامه غذایی' : 'برنامه تمرینی'}</span>
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs and Search Bar */}
      <div className="space-y-3">
        {/* Top Program Type Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              همه برنامه‌ها ({workouts.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('TRAINING')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'TRAINING'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              <span>برنامه‌های تمرینی ({trainingCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('DIET')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'DIET'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>برنامه‌های غذایی ({dietCount})</span>
            </button>
          </div>

          {/* Scope Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setTargetFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                targetFilter === 'ALL'
                  ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              همه 
            </button>
            <button
              type="button"
              onClick={() => setTargetFilter('GROUP')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                targetFilter === 'GROUP'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 hover:bg-blue-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>کلاسی ({groupCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setTargetFilter('INDIVIDUAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                targetFilter === 'INDIVIDUAL'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 hover:bg-purple-100'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>فردی ({individualCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setTargetFilter('TEMPLATE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                targetFilter === 'TEMPLATE'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 hover:bg-amber-100'
              }`}
            >
              الگوهای آماده
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="w-4.5 h-4.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="جستجو در عنوان برنامه، نام کلاس، نام شناگر، تمرکز جلسه یا اهداف غذایی..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 pr-10 pl-4 py-2.5 text-sm text-slate-900 dark:text-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Plans List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {filteredWorkouts.length > 0 ? (
          filteredWorkouts.map((w) => {
            const isDiet = w.plan_type === 'DIET';

            return (
              <div
                key={w.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl border p-5 sm:p-6 shadow-xs transition-all flex flex-col justify-between hover:shadow-md ${
                  isDiet
                    ? 'border-emerald-200/80 dark:border-emerald-900/60 hover:border-emerald-400'
                    : 'border-blue-200/80 dark:border-blue-900/60 hover:border-blue-400'
                }`}
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                          isDiet
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'
                        }`}
                      >
                        {isDiet ? <Utensils className="w-5 h-5" /> : <Dumbbell className="w-5 h-5" />}
                      </div>

                      <div>
                        {/* Badges row */}
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span
                            className={`text-[11px] font-black px-2.5 py-0.5 rounded-md ${
                              isDiet
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                          >
                            {isDiet ? 'برنامه غذایی' : 'برنامه تمرینی'}
                          </span>

                          {w.target_type === 'INDIVIDUAL' && w.swimmer_name && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              شناگر: {w.swimmer_name}
                            </span>
                          )}

                          {w.target_type === 'GROUP' && w.group_name && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              کلاس: {w.group_name}
                            </span>
                          )}

                          {w.is_template && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                              الگو
                            </span>
                          )}

                          {w.sent_at && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-teal-600" />
                              ارسال‌شده
                            </span>
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                          {w.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(w)}
                        className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="ویرایش برنامه"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(w.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="حذف برنامه"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Highlights */}
                  {isDiet ? (
                    <div className="space-y-2 text-xs sm:text-sm">
                      {w.diet_goal && (
                        <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
                          <span>
                            <strong className="text-emerald-800 dark:text-emerald-300">هدف: </strong>
                            {w.diet_goal}
                          </span>
                          {w.daily_calories && (
                            <span className="font-mono font-bold text-xs px-2 py-0.5 bg-white dark:bg-slate-900 rounded-md shadow-2xs">
                              {w.daily_calories.toLocaleString('fa-IR')} kcal
                            </span>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        {w.breakfast && (
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                            <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">صبحانه:</span>
                            <p className="text-slate-600 dark:text-slate-400 line-clamp-1">{w.breakfast}</p>
                          </div>
                        )}
                        {w.lunch && (
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                            <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">ناهار:</span>
                            <p className="text-slate-600 dark:text-slate-400 line-clamp-1">{w.lunch}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-medium">
                        {w.duration_minutes && <span>مدت: {w.duration_minutes} دقیقه</span>}
                        {w.target_level_name && <span>· سطح: {w.target_level_name}</span>}
                        {w.equipment && <span>· تجهیزات: {w.equipment}</span>}
                      </div>

                      {w.focus_skills && (
                        <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 border border-blue-100 dark:border-blue-900/40">
                          <strong className="text-blue-800 dark:text-blue-300">تمرکز: </strong>
                          {w.focus_skills}
                        </div>
                      )}

                      {w.main_section && (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">تمرین اصلی:</span>
                          <p className="text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed font-mono text-xs">
                            {w.main_section}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Buttons (Send, Word, PDF, Preview) */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* View Details Modal */}
                    <button
                      type="button"
                      onClick={() => setPreviewPlan(w)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="مشاهده جزئیات کامل برنامه"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>مشاهده کامل</span>
                    </button>

                    {/* Word Document (.doc) */}
                    <button
                      type="button"
                      onClick={() => exportPlanToWord(w)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="دانلود فایل Word (.doc)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>فایل Word</span>
                    </button>

                    {/* PDF Print */}
                    <button
                      type="button"
                      onClick={() => printPlanToPdf(w)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="چاپ یا ذخیره نسخه PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>نسخه PDF</span>
                    </button>
                  </div>

                  {/* Send Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    loading={sendingId === w.id}
                    onClick={() => handleSendPlan(w)}
                    className={`gap-1.5 text-xs font-bold rounded-xl cursor-pointer ${
                      w.sent_at
                        ? 'text-teal-700 dark:text-teal-300 border-teal-200 hover:bg-teal-50'
                        : isDiet
                        ? 'text-emerald-700 dark:text-emerald-300 border-emerald-300 hover:bg-emerald-50'
                        : 'text-blue-700 dark:text-blue-300 border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{w.sent_at ? 'ارسال مجدد' : 'ارسال به مخاطب'}</span>
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
            <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">برنامه‌ای یافت نشد</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              با استفاده از دکمه «طراحی برنامه جدید»، برنامه‌های تمرینی یا رژیم‌های غذایی کلاسی و فردی خود را تدوین فرمایید.
            </p>
          </div>
        )}
      </div>

      {/* Full Preview and Export Modal */}
      {previewPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${
                    previewPlan.plan_type === 'DIET' ? 'bg-emerald-600' : 'bg-blue-600'
                  }`}
                >
                  {previewPlan.plan_type === 'DIET' ? <Utensils className="w-6 h-6" /> : <Dumbbell className="w-6 h-6" />}
                </div>
                <div>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-md inline-block mb-1 ${
                      previewPlan.plan_type === 'DIET'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    }`}
                  >
                    {previewPlan.plan_type === 'DIET' ? 'برنامه غذایی و رژیم ورزشی' : 'برنامه تمرینی تخصصی'}
                  </span>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">{previewPlan.title}</h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewPlan(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target & Metadata Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs sm:text-sm">
              <div>
                <span className="text-slate-400 block font-bold">مخاطب برنامه:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {previewPlan.target_type === 'INDIVIDUAL' && previewPlan.swimmer_name
                    ? `شناگر: ${previewPlan.swimmer_name}`
                    : previewPlan.group_name
                    ? `کلاس: ${previewPlan.group_name}`
                    : 'عمومی'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-bold">مربی صادرکننده:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {previewPlan.coach_name || 'کادر فنی آکادمی'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-bold">
                  {previewPlan.plan_type === 'DIET' ? 'کالری روزانه:' : 'مدت زمان جلسه:'}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block font-mono">
                  {previewPlan.plan_type === 'DIET'
                    ? previewPlan.daily_calories
                      ? `${previewPlan.daily_calories.toLocaleString('fa-IR')} kcal`
                      : 'متناسب با وزن'
                    : `${previewPlan.duration_minutes || 60} دقیقه`}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-bold">وضعیت ارسال:</span>
                <span className="font-bold mt-0.5 block">
                  {previewPlan.sent_at ? (
                    <span className="text-teal-600 dark:text-teal-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      ارسال‌شده
                    </span>
                  ) : (
                    <span className="text-amber-600">پیش‌نویس</span>
                  )}
                </span>
              </div>
            </div>

            {/* Plan Content Body */}
            {previewPlan.plan_type === 'DIET' ? (
              <div className="space-y-4 text-sm">
                {previewPlan.diet_goal && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 text-emerald-900 dark:text-emerald-200">
                    <strong>هدف فیزیولوژیک: </strong>
                    {previewPlan.diet_goal}
                  </div>
                )}

                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                  <table className="w-full text-right text-xs sm:text-sm">
                    <thead className="bg-emerald-700 text-white font-bold">
                      <tr>
                        <th className="p-3 w-32 border-b border-emerald-800">وعده غذایی</th>
                        <th className="p-3 border-b border-emerald-800">مواد غذایی و دستور مصرف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {previewPlan.breakfast && (
                        <tr>
                          <td className="p-3 font-bold bg-slate-50 dark:bg-slate-800/40">صبحانه</td>
                          <td className="p-3 leading-relaxed">{previewPlan.breakfast}</td>
                        </tr>
                      )}
                      {previewPlan.morning_snack && (
                        <tr>
                          <td className="p-3 font-bold bg-slate-50 dark:bg-slate-800/40">میان‌وعده صبح</td>
                          <td className="p-3 leading-relaxed">{previewPlan.morning_snack}</td>
                        </tr>
                      )}
                      {previewPlan.lunch && (
                        <tr>
                          <td className="p-3 font-bold bg-slate-50 dark:bg-slate-800/40">ناهار</td>
                          <td className="p-3 leading-relaxed">{previewPlan.lunch}</td>
                        </tr>
                      )}
                      {previewPlan.afternoon_snack && (
                        <tr>
                          <td className="p-3 font-bold bg-slate-50 dark:bg-slate-800/40">عصرانه / قبل تمرین</td>
                          <td className="p-3 leading-relaxed">{previewPlan.afternoon_snack}</td>
                        </tr>
                      )}
                      {previewPlan.dinner && (
                        <tr>
                          <td className="p-3 font-bold bg-slate-50 dark:bg-slate-800/40">شام</td>
                          <td className="p-3 leading-relaxed">{previewPlan.dinner}</td>
                        </tr>
                      )}
                      {previewPlan.post_workout_snack && (
                        <tr>
                          <td className="p-3 font-bold bg-slate-50 dark:bg-slate-800/40">ریکاوری بعد از تمرین</td>
                          <td className="p-3 leading-relaxed">{previewPlan.post_workout_snack}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {previewPlan.hydration_guidelines && (
                  <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 text-slate-800 dark:text-slate-200 space-y-1">
                    <strong className="text-sky-800 dark:text-sky-300 block">مصرف آب و هیدراتاسیون:</strong>
                    <p className="whitespace-pre-line leading-relaxed">{previewPlan.hydration_guidelines}</p>
                  </div>
                )}

                {previewPlan.supplements && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 space-y-1">
                    <strong className="block">مکمل‌ها و ویتامین‌ها:</strong>
                    <p className="whitespace-pre-line leading-relaxed">{previewPlan.supplements}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                {previewPlan.focus_skills && (
                  <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 text-blue-900 dark:text-blue-200">
                    <strong>تمرکز آموزشی و تکنیکی: </strong>
                    {previewPlan.focus_skills}
                  </div>
                )}

                {previewPlan.warmup_section && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                    <strong className="text-amber-600 dark:text-amber-400 block font-black">
                      ۱. بخش گرم‌کردن و تمرینات کششی در آب (Warm-up):
                    </strong>
                    <p className="whitespace-pre-line leading-relaxed text-slate-700 dark:text-slate-300">
                      {previewPlan.warmup_section}
                    </p>
                  </div>
                )}

                {previewPlan.main_section && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-r-4 border-blue-600 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                    <strong className="text-blue-700 dark:text-blue-300 block font-black">
                      ۲. بخش تمرینات اصلی و ست‌های شنا (Main Set):
                    </strong>
                    <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                      {previewPlan.main_section}
                    </pre>
                  </div>
                )}

                {previewPlan.cooldown_section && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                    <strong className="text-cyan-600 dark:text-cyan-400 block font-black">
                      ۳. بخش سردکردن و ریکاوری (Cool-down):
                    </strong>
                    <p className="whitespace-pre-line leading-relaxed text-slate-700 dark:text-slate-300">
                      {previewPlan.cooldown_section}
                    </p>
                  </div>
                )}
              </div>
            )}

            {previewPlan.notes && (
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                <strong>یادداشت مربی: </strong>
                {previewPlan.notes}
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => exportPlanToWord(previewPlan)}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود فایل Word (.doc)</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => printPlanToPdf(previewPlan)}
                  className="gap-2 text-rose-700 border-rose-300 hover:bg-rose-50 font-bold cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>چاپ / ذخیره PDF</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={sendingId === previewPlan.id}
                  onClick={() => handleSendPlan(previewPlan)}
                  className="gap-2 text-teal-700 border-teal-300 hover:bg-teal-50 font-bold cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{previewPlan.sent_at ? 'ارسال مجدد' : 'ارسال به مخاطب'}</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewPlan(null)}
                >
                  بستن
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
