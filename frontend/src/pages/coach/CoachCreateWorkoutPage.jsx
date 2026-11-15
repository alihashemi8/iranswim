import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar, Dumbbell, Utensils, Save, X, Sparkles,
  Users, User, Clock, Target, Apple, Flame, Droplets,
  BookOpen, ChevronRight, CheckCircle2, ShieldCheck, FileText
} from 'lucide-react';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { BackButton } from '../../components/common/BackButton';
import { LoadingState } from '../../components/common/LoadingState';
import { CustomSelect } from '../../components/common/CustomSelect';
import { useToast } from '../../context/ToastContext';

export const CoachCreateWorkoutPage = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data sources for selectors
  const [classes, setClasses] = useState([]);
  const [swimmers, setSwimmers] = useState([]);
  const [levels, setLevels] = useState([]);

  // Form State
  const [planType, setPlanType] = useState('TRAINING'); // 'TRAINING' | 'DIET'
  const [targetType, setTargetType] = useState('GROUP'); // 'GROUP' | 'INDIVIDUAL' | 'GENERAL'
  const [title, setTitle] = useState('');
  const [groupId, setGroupId] = useState('');
  const [swimmerId, setSwimmerId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [notes, setNotes] = useState('');
  const [isTemplate, setIsTemplate] = useState(false);

  // Training fields
  const [duration, setDuration] = useState(60);
  const [focusSkills, setFocusSkills] = useState('');
  const [warmup, setWarmup] = useState('');
  const [mainSet, setMainSet] = useState('');
  const [cooldown, setCooldown] = useState('');
  const [equipment, setEquipment] = useState('');

  // Diet fields
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

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [cRes, sRes, lRes] = await Promise.allSettled([
          api.get('/coaches/my-classes/'),
          api.get('/coaches/my-swimmers/'),
          api.get('/education/levels/'),
        ]);

        if (cRes.status === 'fulfilled') {
          setClasses(Array.isArray(cRes.value.data) ? cRes.value.data : []);
        }
        if (sRes.status === 'fulfilled') {
          setSwimmers(Array.isArray(sRes.value.data) ? sRes.value.data : []);
        }
        if (lRes.status === 'fulfilled') {
          setLevels(Array.isArray(lRes.value.data) ? lRes.value.data : []);
        }

        // If editing, load the plan details
        if (isEditing) {
          const planRes = await api.get(`/coaches/workouts/${id}/`);
          const w = planRes.data;
          setPlanType(w.plan_type || 'TRAINING');
          setTargetType(w.target_type || (w.swimmer ? 'INDIVIDUAL' : w.group ? 'GROUP' : 'GENERAL'));
          setTitle(w.title || '');
          setGroupId(w.group ? String(w.group) : '');
          setSwimmerId(w.swimmer ? String(w.swimmer) : '');
          setLevelId(w.target_level ? String(w.target_level) : '');
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
        }
      } catch (err) {
        console.error('Error loading form data:', err);
        toast.error('خطا در بارگذاری اطلاعات اولیه');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [id, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('عنوان برنامه الزامی است.');
      return;
    }

    if (targetType === 'GROUP' && !groupId) {
      toast.error('لطفاً کلاس هدف را انتخاب فرمایید.');
      return;
    }

    if (targetType === 'INDIVIDUAL' && !swimmerId) {
      toast.error('لطفاً شناگر هدف را انتخاب فرمایید.');
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

      if (isEditing) {
        await api.put(`/coaches/workouts/${id}/`, payload);
        toast.success(`برنامه ${planType === 'DIET' ? 'غذایی' : 'تمرینی'} با موفقیت به‌روزرسانی شد.`);
      } else {
        await api.post('/coaches/workouts/', payload);
        toast.success(`برنامه ${planType === 'DIET' ? 'غذایی' : 'تمرینی'} جدید با موفقیت ذخیره گردید.`);
      }
      navigate('/coach/workouts');
    } catch (err) {
      console.error(err);
      toast.error('خطا در ذخیره‌سازی برنامه');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState type="dashboard" message="در حال آماده‌سازی فرم طراحی برنامه..." />;
  }

  // Options for CustomSelect components
  const classOptions = classes.map((cls) => ({
    value: String(cls.id),
    label: cls.name,
    badge: cls.course_title || cls.pool_location || undefined,
    icon: Users,
  }));

  const swimmerOptions = swimmers.map((sw) => ({
    value: String(sw.swimmer_id || sw.id),
    label: sw.full_name,
    description: sw.gender ? (sw.gender === 'M' ? 'شناگر آقا' : 'شناگر خانم') : undefined,
    badge: sw.level_name || undefined,
    icon: User,
  }));

  const levelOptions = [
    { value: '', label: 'همه سطوح مهارت (عمومی)' },
    ...levels.map((lvl) => ({
      value: String(lvl.id),
      label: `${lvl.name} (سطح ${lvl.order})`,
      icon: Target,
    })),
  ];

  const themeColor = planType === 'DIET' ? 'emerald' : 'blue';

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto px-3 sm:px-4 md:px-0">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <BackButton to="/coach/workouts" label="بازگشت به برنامه‌ها" showLabelAlways />
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <span className={`p-2 rounded-2xl text-white ${planType === 'DIET' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                {planType === 'DIET' ? <Utensils className="w-5 h-5 sm:w-6 sm:h-6" /> : <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6" />}
              </span>
              <span>{isEditing ? 'ویرایش برنامه' : 'طراحی برنامه جدید'}</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
              {planType === 'DIET'
                ? 'تدوین رژیم غذایی و راهنمای هیدراتاسیون برای کلاس یا شناگر اختصاصی'
                : 'طراحی جلسه تمرین شنا، ست‌های اصلی، گرم‌کردن و سردکردن'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => navigate('/coach/workouts')}
            className="text-sm sm:text-base font-bold px-4 py-2"
          >
            انصراف
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            loading={saving}
            onClick={handleSubmit}
            className={`gap-2 text-sm sm:text-base font-bold text-white shadow-xs px-5 py-2 ${
              planType === 'DIET' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Save className="w-4.5 h-4.5" />
            <span>ذخیره نهایی برنامه</span>
          </Button>
        </div>
      </div>

      {/* Main Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Program Type Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-100 font-black text-base sm:text-lg">
            <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs sm:text-sm font-bold font-mono">
              ۱
            </span>
            <span>نوع برنامه را مشخص فرمایید:</span>
            <span className="text-rose-500">*</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setPlanType('TRAINING')}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-start gap-3.5 text-right cursor-pointer ${
                planType === 'TRAINING'
                  ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                planType === 'TRAINING' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                <Dumbbell className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-base sm:text-lg font-black ${planType === 'TRAINING' ? 'text-blue-900 dark:text-blue-100' : 'text-slate-800 dark:text-slate-200'}`}>
                  برنامه تمرینی شنا
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  طراحی ست‌های اصلی، گرم‌کردن و تمرینات کششی، دریل‌های تکنیکی و سردکردن
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPlanType('DIET')}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-start gap-3.5 text-right cursor-pointer ${
                planType === 'DIET'
                  ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                planType === 'DIET' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                <Utensils className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-base sm:text-lg font-black ${planType === 'DIET' ? 'text-emerald-900 dark:text-emerald-100' : 'text-slate-800 dark:text-slate-200'}`}>
                  برنامه غذایی و رژیم ورزشی
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  تنظیم وعده‌ها و میان‌وعده‌های روزانه، ریکاوری بعد از تمرین، هیدراتاسیون و مکمل‌ها
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Step 2: Target Scope (Group vs Individual Swimmer) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-100 font-black text-base sm:text-lg">
            <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs sm:text-sm font-bold font-mono">
              ۲
            </span>
            <span>دامنه و مخاطبان هدف برنامه:</span>
            <span className="text-rose-500">*</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <button
              type="button"
              onClick={() => setTargetType('GROUP')}
              className={`p-4 sm:p-4.5 rounded-2xl border-2 transition-all flex items-center gap-3.5 text-right cursor-pointer ${
                targetType === 'GROUP'
                  ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 shadow-2xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-bold text-sm sm:text-base block truncate">کلاسی (گروهی)</span>
                <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 block truncate mt-0.5">برای کل اعضای یک کلاس</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTargetType('INDIVIDUAL')}
              className={`p-4 sm:p-4.5 rounded-2xl border-2 transition-all flex items-center gap-3.5 text-right cursor-pointer ${
                targetType === 'INDIVIDUAL'
                  ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-100 shadow-2xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-bold text-sm sm:text-base block truncate">فردی (شناگر اختصاصی)</span>
                <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 block truncate mt-0.5">شخصی‌سازی برای یک فرد</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTargetType('GENERAL')}
              className={`p-4 sm:p-4.5 rounded-2xl border-2 transition-all flex items-center gap-3.5 text-right cursor-pointer ${
                targetType === 'GENERAL'
                  ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 shadow-2xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-bold text-sm sm:text-base block truncate">الگوی عمومی</span>
                <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 block truncate mt-0.5">بدون انتساب اولیه</span>
              </div>
            </button>
          </div>

          {/* Selectors for Target using CustomSelect */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {targetType === 'GROUP' && (
              <div>
                <CustomSelect
                  label="انتخاب کلاس هدف:"
                  options={classOptions}
                  value={groupId}
                  onChange={(val) => setGroupId(val)}
                  placeholder="کلاس مورد نظر را انتخاب فرمایید..."
                  searchable={true}
                  color={themeColor}
                  icon={Users}
                  clearable={false}
                />
              </div>
            )}

            {targetType === 'INDIVIDUAL' && (
              <div>
                <CustomSelect
                  label="انتخاب شناگر هدف:"
                  options={swimmerOptions}
                  value={swimmerId}
                  onChange={(val) => setSwimmerId(val)}
                  placeholder="شناگر مورد نظر را انتخاب فرمایید..."
                  searchable={true}
                  color={themeColor}
                  icon={User}
                  clearable={false}
                />
              </div>
            )}

            <div>
              <CustomSelect
                label="سطح مهارت هدف (اختیاری):"
                options={levelOptions}
                value={levelId}
                onChange={(val) => setLevelId(val)}
                placeholder="انتخاب سطح مهارت شناگر..."
                searchable={true}
                color={themeColor}
                icon={Target}
                clearable={true}
              />
            </div>
          </div>
        </div>

        {/* Step 3: Main Program Details Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-100 font-black text-base sm:text-lg">
            <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs sm:text-sm font-bold font-mono">
              ۳
            </span>
            <span>مشخصات و محتوای برنامه:</span>
            <span className="text-rose-500">*</span>
          </div>

          {/* Title */}
          <div>
            <label className="block text-slate-800 dark:text-slate-200 font-bold mb-2 text-sm sm:text-base">
              عنوان رسمی برنامه: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder={
                planType === 'DIET'
                  ? 'مثال: رژیم غذایی و هیدراتاسیون دوره مسابقات استانی شناگران'
                  : 'مثال: تمرین استقامتی کرال سینه و دریل‌های هماهنگی پا'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3.5 text-slate-900 dark:text-white font-bold text-base sm:text-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-sm sm:placeholder:text-base placeholder-slate-400"
              required
            />
          </div>

          {/* TRAINING SPECIFIC INPUTS */}
          {planType === 'TRAINING' && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-bold mb-2 text-sm sm:text-base flex items-center gap-1.5">
                    <Clock className="w-4.5 h-4.5 text-blue-600" />
                    <span>مدت زمان جلسه (دقیقه):</span>
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    step="15"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-slate-900 dark:text-white font-mono text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-bold mb-2 text-sm sm:text-base">
                    تمرکز آموزشی یا ماده شنا:
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: تنفس جانبی، پای قورباغه، استارت"
                    value={focusSkills}
                    onChange={(e) => setFocusSkills(e.target.value)}
                    className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-slate-900 dark:text-white text-sm sm:text-base placeholder:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-bold mb-2 text-sm sm:text-base">
                    تجهیزات و وسایل مورد نیاز:
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: فین کوتاه، کفی دستی، تخته شنا"
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                    className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-slate-900 dark:text-white text-sm sm:text-base placeholder:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-800 dark:text-slate-200 font-bold mb-2 text-sm sm:text-base flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
                  <span>۱. بخش گرم‌کردن و حرکات کششی در آب (Warm-up):</span>
                </label>
                <textarea
                  rows="3"
                  placeholder="مثال: ۲۰۰ متر شنای آرام و کشیده + ۲۰۰ متر کیک با تخته شنا..."
                  value={warmup}
                  onChange={(e) => setWarmup(e.target.value)}
                  className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3.5 text-slate-900 dark:text-white leading-relaxed text-sm sm:text-base outline-none focus:border-blue-500 placeholder:text-sm sm:placeholder:text-base"
                />
              </div>

              <div>
                <label className="block text-slate-800 dark:text-slate-200 font-bold mb-2 text-sm sm:text-base flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0" />
                  <span>۲. بخش اصلی و ست‌های تمرین شنا (Main Set):</span>
                  <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows="5"
                  placeholder="مثال: ۸ ست ۵۰ متر دریل با فواصل استراحت ۲۰ ثانیه + ۴ ست ۱۰۰ متر سرعت متوسط..."
                  value={mainSet}
                  onChange={(e) => setMainSet(e.target.value)}
                  className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3.5 text-slate-900 dark:text-white leading-relaxed font-mono text-sm sm:text-base outline-none focus:border-blue-500 placeholder:text-sm sm:placeholder:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-800 dark:text-slate-200 font-bold mb-2 text-sm sm:text-base flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyan-400 shrink-0" />
                  <span>۳. بخش سردکردن و ریکاوری (Cool-down):</span>
                </label>
                <textarea
                  rows="2"
                  placeholder="مثال: ۱۰۰ متر کرال پشت آرام و تمرینات تنفس عمیق و رهاسازی عضلات..."
                  value={cooldown}
                  onChange={(e) => setCooldown(e.target.value)}
                  className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3.5 text-slate-900 dark:text-white leading-relaxed text-sm sm:text-base outline-none focus:border-blue-500 placeholder:text-sm sm:placeholder:text-base"
                />
              </div>
            </div>
          )}

          {/* DIET SPECIFIC INPUTS */}
          {planType === 'DIET' && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-bold mb-2 text-sm sm:text-base">
                    هدف فیزیولوژیک رژیم غذایی:
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: بارگیری کربوهیدرات، افزایش چگالی عضلانی، ریکاوری سریع"
                    value={dietGoal}
                    onChange={(e) => setDietGoal(e.target.value)}
                    className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-slate-900 dark:text-white text-sm sm:text-base placeholder:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-bold mb-2 text-sm sm:text-base">
                    کالری هدف روزانه (کیلوکالری):
                  </label>
                  <input
                    type="number"
                    step="50"
                    placeholder="مثال: 2600"
                    value={dailyCalories}
                    onChange={(e) => setDailyCalories(e.target.value)}
                    className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-slate-900 dark:text-white font-mono text-sm sm:text-base placeholder:text-sm"
                  />
                </div>
              </div>

              {/* Meals Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                  <label className="block text-emerald-800 dark:text-emerald-300 font-bold text-sm sm:text-base flex items-center gap-1.5">
                    <Apple className="w-4.5 h-4.5 text-emerald-600" />
                    <span>وعده صبحانه:</span>
                  </label>
                  <textarea
                    rows="2"
                    placeholder="مثال: جو دوسر با شیر کم‌چرب + ۲ عدد تخم‌مرغ آب‌پز + عسل و گردو"
                    value={breakfast}
                    onChange={(e) => setBreakfast(e.target.value)}
                    className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 text-slate-900 dark:text-white text-sm sm:text-base leading-relaxed placeholder:text-xs sm:placeholder:text-sm"
                  />
                </div>

                <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                  <label className="block text-emerald-800 dark:text-emerald-300 font-bold text-sm sm:text-base flex items-center gap-1.5">
                    <Apple className="w-4.5 h-4.5 text-emerald-600" />
                    <span>میان‌وعده صبح:</span>
                  </label>
                  <textarea
                    rows="2"
                    placeholder="مثال: یک عدد موز متوسط + مشت بادام خام درختی"
                    value={morningSnack}
                    onChange={(e) => setMorningSnack(e.target.value)}
                    className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 text-slate-900 dark:text-white text-sm sm:text-base leading-relaxed placeholder:text-xs sm:placeholder:text-sm"
                  />
                </div>

                <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                  <label className="block text-emerald-800 dark:text-emerald-300 font-bold text-sm sm:text-base flex items-center gap-1.5">
                    <Utensils className="w-4.5 h-4.5 text-emerald-600" />
                    <span>وعده ناهار:</span>
                  </label>
                  <textarea
                    rows="2"
                    placeholder="مثال: ۲۰۰ گرم سینه مرغ گریل‌شده + یک بشقاب برنج قهوه‌ای یا پاستا + سالاد کلم بروکلی"
                    value={lunch}
                    onChange={(e) => setLunch(e.target.value)}
                    className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 text-slate-900 dark:text-white text-sm sm:text-base leading-relaxed placeholder:text-xs sm:placeholder:text-sm"
                  />
                </div>

                <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                  <label className="block text-emerald-800 dark:text-emerald-300 font-bold text-sm sm:text-base flex items-center gap-1.5">
                    <Flame className="w-4.5 h-4.5 text-emerald-600" />
                    <span>میان‌وعده عصر / قبل از تمرین:</span>
                  </label>
                  <textarea
                    rows="2"
                    placeholder="مثال: نان تست جو با کره بادام‌زمینی + ۳ عدد خرما (یک ساعت پیش از استخر)"
                    value={afternoonSnack}
                    onChange={(e) => setAfternoonSnack(e.target.value)}
                    className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 text-slate-900 dark:text-white text-sm sm:text-base leading-relaxed placeholder:text-xs sm:placeholder:text-sm"
                  />
                </div>

                <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                  <label className="block text-emerald-800 dark:text-emerald-300 font-bold text-sm sm:text-base flex items-center gap-1.5">
                    <Utensils className="w-4.5 h-4.5 text-emerald-600" />
                    <span>وعده شام:</span>
                  </label>
                  <textarea
                    rows="2"
                    placeholder="مثال: ماهی قزل‌آلا یا سالمون بخارپز + سیب‌زمینی تنوری + سوپ سبزیجات سبک"
                    value={dinner}
                    onChange={(e) => setDinner(e.target.value)}
                    className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 text-slate-900 dark:text-white text-sm sm:text-base leading-relaxed placeholder:text-xs sm:placeholder:text-sm"
                  />
                </div>

                <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                  <label className="block text-emerald-800 dark:text-emerald-300 font-bold text-sm sm:text-base flex items-center gap-1.5">
                    <Sparkles className="w-4.5 h-4.5 text-emerald-600" />
                    <span>تغذیه بعد از تمرین (ریکاوری):</span>
                  </label>
                  <textarea
                    rows="2"
                    placeholder="مثال: شیک پروتئین وی با آب نارگیل یا شیر کاکائو کم‌چرب ظرف ۳۰ دقیقه پس از تمرین"
                    value={postWorkoutSnack}
                    onChange={(e) => setPostWorkoutSnack(e.target.value)}
                    className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 text-slate-900 dark:text-white text-sm sm:text-base leading-relaxed placeholder:text-xs sm:placeholder:text-sm"
                  />
                </div>
              </div>

              {/* Guidelines */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-bold mb-2 text-sm sm:text-base flex items-center gap-1.5">
                    <Droplets className="w-4.5 h-4.5 text-sky-500" />
                    <span>مصرف آب و هیدراتاسیون:</span>
                  </label>
                  <textarea
                    rows="2"
                    placeholder="مثال: ۳ لیتر در روز + ۵۰۰ سی‌سی الکترولیت حین تمرین"
                    value={hydrationGuidelines}
                    onChange={(e) => setHydrationGuidelines(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-slate-900 dark:text-white text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-bold mb-2 text-sm sm:text-base">
                    مکمل‌ها و ویتامین‌ها:
                  </label>
                  <textarea
                    rows="2"
                    placeholder="مثال: ویتامین C، امگا ۳، کپسول منیزیم"
                    value={supplements}
                    onChange={(e) => setSupplements(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-slate-900 dark:text-white text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-bold mb-2 text-sm sm:text-base">
                    پرهیزها و نکات تغذیه‌ای:
                  </label>
                  <textarea
                    rows="2"
                    placeholder="مثال: پرهیز از فست‌فود و نوشابه‌های گازدار"
                    value={dietaryGuidelines}
                    onChange={(e) => setDietaryGuidelines(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-slate-900 dark:text-white text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-slate-800 dark:text-slate-200 font-bold mb-2 text-sm sm:text-base">
              توضیحات تکمیلی و یادداشت مربی:
            </label>
            <textarea
              rows="2"
              placeholder="توصیه‌های تکمیلی، نکات ایمنی و بازه زمانی اعتبار این برنامه..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3.5 text-slate-900 dark:text-white text-sm sm:text-base placeholder:text-sm"
            />
          </div>

          {/* Template Checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isTemplate}
                onChange={(e) => setIsTemplate(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-5 h-5 cursor-pointer"
              />
              <span className="text-slate-800 dark:text-slate-200 font-bold text-sm sm:text-base select-none">
                ذخیره به عنوان الگوی آماده (Template) جهت استفاده مجدد در آینده
              </span>
            </label>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => navigate('/coach/workouts')}
            className="text-sm sm:text-base font-bold px-5 py-2.5"
          >
            انصراف و بازگشت
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={saving}
            className={`gap-2 font-black text-base sm:text-lg px-8 py-3 text-white shadow-md cursor-pointer ${
              planType === 'DIET' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Save className="w-5 h-5" />
            <span>{isEditing ? 'به‌روزرسانی برنامه' : 'ذخیره و ثبت برنامه'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
