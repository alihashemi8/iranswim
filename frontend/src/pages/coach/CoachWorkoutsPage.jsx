import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, PlusCircle, Clock, Target,
  CheckCircle2, FileText, ChevronLeft, ChevronDown,
  Trash2, Edit, X, Utensils, Dumbbell, Send,
  Download, Printer, Search, Filter, Sparkles,
  User, Users, Apple, Droplets, Eye, ShieldCheck, Flame
} from 'lucide-react';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';
import { exportPlanToWord, printPlanToPdf } from '../../utils/planExport';

export const CoachWorkoutsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active top tab: 'ALL' | 'TRAINING' | 'DIET'
  const [activeTab, setActiveTab] = useState('ALL');
  // Target scope filter: 'ALL' | 'GROUP' | 'INDIVIDUAL' | 'TEMPLATE'
  const [targetFilter, setTargetFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Preview & Action Modals
  const [previewPlan, setPreviewPlan] = useState(null);
  const [sendingId, setSendingId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/coaches/workouts/');
      const d = res.data;
      setWorkouts(Array.isArray(d) ? d : d.results || []);
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

  const handleDelete = async (id) => {
    if (!window.confirm('آیا از حذف این برنامه اطمینان دارید؟')) return;
    try {
      await api.delete(`/coaches/workouts/${id}/`);
      toast.success('برنامه مورد نظر با موفقیت حذف گردید.');
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-bold mb-2">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>سامانه طراحی، صدور و ارسال برنامه‌های ورزشی مربی</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Calendar className="w-8 h-8 sm:w-9 sm:h-9 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>برنامه</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2 max-w-2xl leading-relaxed">
            تدوین و صدور برنامه‌های تمرینی شنا و رژیم‌های غذایی ورزشی؛ به تفکیک برای کل کلاس یا اختصاصی برای هر شناگر با قابلیت دانلود فایل Word و PDF و ارسال درون‌برنامه‌ای
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/coach/workouts/create')}
            className="w-full sm:w-auto justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-base sm:text-lg px-6 py-3 rounded-2xl shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" />
            <span>طراحی برنامه جدید</span>
          </Button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-bold">کل برنامه‌ها</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            {workouts.length}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-bold">برنامه‌های تمرینی</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Dumbbell className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-700 dark:text-cyan-400 mt-2 font-mono">
            {trainingCount}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-bold">برنامه‌های غذایی</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Utensils className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-2 font-mono">
            {dietCount}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-bold">برنامه‌های فردی / کلاسی</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <User className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg md:text-xl font-black text-purple-700 dark:text-purple-400 mt-2 font-mono">
            {individualCount} فردی · {groupCount} کلاسی
          </div>
        </div>
      </div>

      {/* Unified Filter & Search Bar: In Desktop Search is placed between the tabs */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Right side: Plan Type Tabs */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1 shrink-0 overflow-x-auto select-none">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            همه برنامه‌ها ({workouts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('TRAINING')}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'TRAINING'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span>برنامه‌های تمرینی ({trainingCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('DIET')}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'DIET'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>برنامه‌های غذایی ({dietCount})</span>
          </button>
        </div>

        {/* Center: Search Bar placed between the tabs on Desktop */}
        <div className="relative flex-1 min-w-[220px] max-w-full lg:max-w-md mx-auto w-full lg:w-auto">
          <Search className="w-4.5 h-4.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="جستجو در عنوان، کلاس، شناگر یا تمرکز..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 pr-10 pl-8 py-2.5 text-sm sm:text-base text-slate-900 dark:text-white placeholder:text-sm sm:placeholder:text-base placeholder-slate-400 outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Left side: Scope Filter Pills */}
        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 lg:pb-0 select-none">
          <button
            type="button"
            onClick={() => setTargetFilter('ALL')}
            className={`px-3 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
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
            className={`px-3 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
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
            className={`px-3 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
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
            className={`px-3 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              targetFilter === 'TEMPLATE'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 hover:bg-amber-100'
            }`}
          >
            الگوهای آماده
          </button>
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
                className={`bg-white dark:bg-slate-900 rounded-3xl border p-4 sm:p-5 md:p-6 shadow-xs transition-all flex flex-col justify-between hover:shadow-md ${
                  isDiet
                    ? 'border-emerald-200/80 dark:border-emerald-900/60 hover:border-emerald-400'
                    : 'border-blue-200/80 dark:border-blue-900/60 hover:border-blue-400'
                }`}
              >
                <div className="space-y-3.5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                          isDiet
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'
                        }`}
                      >
                        {isDiet ? <Utensils className="w-5 h-5" /> : <Dumbbell className="w-5 h-5" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Badges row */}
                        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                          <span
                            className={`text-xs sm:text-sm font-bold px-2.5 py-0.5 rounded-lg ${
                              isDiet
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                          >
                            {isDiet ? 'برنامه غذایی' : 'برنامه تمرینی'}
                          </span>

                          {w.target_type === 'INDIVIDUAL' && w.swimmer_name && (
                            <span className="text-xs sm:text-sm font-bold px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 flex items-center gap-1.5 truncate max-w-[180px]">
                              <User className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{w.swimmer_name}</span>
                            </span>
                          )}

                          {w.target_type === 'GROUP' && w.group_name && (
                            <span className="text-xs sm:text-sm font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 flex items-center gap-1.5 truncate max-w-[180px]">
                              <Users className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{w.group_name}</span>
                            </span>
                          )}

                          {w.is_template && (
                            <span className="text-xs sm:text-sm font-bold px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                              الگو
                            </span>
                          )}

                          {w.sent_at && (
                            <span className="text-xs sm:text-sm font-bold px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              ارسال‌شده
                            </span>
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-white leading-snug break-words">
                          {w.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => navigate(`/coach/workouts/${w.id}/edit`)}
                        className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="ویرایش برنامه در صفحه جدید"
                      >
                        <Edit className="w-4.5 h-4.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(w.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="حذف برنامه"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>

                  {/* Highlights */}
                  {isDiet ? (
                    <div className="space-y-2.5 text-sm sm:text-base">
                      {w.diet_goal && (
                        <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between flex-wrap gap-2">
                          <span className="truncate">
                            <strong className="text-emerald-800 dark:text-emerald-300 font-bold">هدف: </strong>
                            {w.diet_goal}
                          </span>
                          {w.daily_calories && (
                            <span className="font-mono font-bold text-xs sm:text-sm px-2.5 py-0.5 bg-white dark:bg-slate-900 rounded-md shadow-2xs shrink-0">
                              {w.daily_calories.toLocaleString('fa-IR')} kcal
                            </span>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {w.breakfast && (
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1 text-sm sm:text-base">صبحانه:</span>
                            <p className="text-slate-600 dark:text-slate-300 line-clamp-2 text-xs sm:text-sm leading-relaxed">{w.breakfast}</p>
                          </div>
                        )}
                        {w.lunch && (
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1 text-sm sm:text-base">ناهار:</span>
                            <p className="text-slate-600 dark:text-slate-300 line-clamp-2 text-xs sm:text-sm leading-relaxed">{w.lunch}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 text-sm sm:text-base">
                      <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300 font-medium text-xs sm:text-sm flex-wrap">
                        {w.duration_minutes && <span>مدت: {w.duration_minutes} دقیقه</span>}
                        {w.target_level_name && <span>· سطح: {w.target_level_name}</span>}
                        {w.equipment && <span className="truncate">· تجهیزات: {w.equipment}</span>}
                      </div>

                      {w.focus_skills && (
                        <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 text-blue-950 dark:text-blue-200 border border-blue-100 dark:border-blue-900/40">
                          <strong className="text-blue-800 dark:text-blue-300 font-bold">تمرکز: </strong>
                          {w.focus_skills}
                        </div>
                      )}

                      {w.main_section && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1 text-sm sm:text-base">تمرین اصلی:</span>
                          <p className="text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed font-mono text-xs sm:text-sm">
                            {w.main_section}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Buttons (Send, Word, PDF, Preview) */}
                <div className="pt-3.5 mt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* View Details Modal */}
                    <button
                      type="button"
                      onClick={() => setPreviewPlan(w)}
                      className="px-3 sm:px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="مشاهده جزئیات کامل برنامه"
                    >
                      <Eye className="w-4 h-4 text-blue-600" />
                      <span>مشاهده کامل</span>
                    </button>

                    {/* Word Document (.doc) */}
                    <button
                      type="button"
                      onClick={() => exportPlanToWord(w)}
                      className="px-3 sm:px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="دانلود فایل Word (.doc)"
                    >
                      <Download className="w-4 h-4" />
                      <span>فایل Word</span>
                    </button>

                    {/* PDF Print */}
                    <button
                      type="button"
                      onClick={() => printPlanToPdf(w)}
                      className="px-3 sm:px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="چاپ یا ذخیره نسخه PDF"
                    >
                      <Printer className="w-4 h-4" />
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
                    className={`gap-1.5 text-xs sm:text-sm font-bold rounded-xl px-3.5 py-2 cursor-pointer ${
                      w.sent_at
                        ? 'text-teal-700 dark:text-teal-300 border-teal-200 hover:bg-teal-50'
                        : isDiet
                        ? 'text-emerald-700 dark:text-emerald-300 border-emerald-300 hover:bg-emerald-50'
                        : 'text-blue-700 dark:text-blue-300 border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    <span>{w.sent_at ? 'ارسال مجدد' : 'ارسال به مخاطب'}</span>
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
            <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">برنامه‌ای یافت نشد</h3>
            <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto leading-relaxed">
              با استفاده از دکمه «طراحی برنامه جدید»، برنامه‌های تمرینی یا رژیم‌های غذایی کلاسی و فردی خود را تدوین فرمایید.
            </p>
          </div>
        )}
      </div>

      {/* Full Preview and Export Modal */}
      {previewPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-5 sm:p-7 md:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white shrink-0 ${
                    previewPlan.plan_type === 'DIET' ? 'bg-emerald-600' : 'bg-blue-600'
                  }`}
                >
                  {previewPlan.plan_type === 'DIET' ? <Utensils className="w-6 h-6" /> : <Dumbbell className="w-6 h-6" />}
                </div>
                <div>
                  <span
                    className={`text-xs sm:text-sm font-bold px-3 py-1 rounded-lg inline-block mb-1.5 ${
                      previewPlan.plan_type === 'DIET'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    }`}
                  >
                    {previewPlan.plan_type === 'DIET' ? 'برنامه غذایی و رژیم ورزشی' : 'برنامه تمرینی تخصصی'}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                    {previewPlan.title}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewPlan(null)}
                className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target & Metadata Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-sm sm:text-base">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-bold text-xs sm:text-sm">مخاطب برنامه:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block truncate text-sm sm:text-base">
                  {previewPlan.target_type === 'INDIVIDUAL' && previewPlan.swimmer_name
                    ? `شناگر: ${previewPlan.swimmer_name}`
                    : previewPlan.group_name
                    ? `کلاس: ${previewPlan.group_name}`
                    : 'عمومی'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-bold text-xs sm:text-sm">مربی صادرکننده:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block truncate text-sm sm:text-base">
                  {previewPlan.coach_name || 'کادر فنی آکادمی'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-bold text-xs sm:text-sm">
                  {previewPlan.plan_type === 'DIET' ? 'کالری روزانه:' : 'مدت زمان جلسه:'}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block font-mono text-sm sm:text-base">
                  {previewPlan.plan_type === 'DIET'
                    ? previewPlan.daily_calories
                      ? `${previewPlan.daily_calories.toLocaleString('fa-IR')} kcal`
                      : 'متناسب با وزن'
                    : `${previewPlan.duration_minutes || 60} دقیقه`}
                </span>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-bold text-xs sm:text-sm">وضعیت ارسال:</span>
                <span className="font-bold mt-1 block text-sm sm:text-base">
                  {previewPlan.sent_at ? (
                    <span className="text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
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
              <div className="space-y-4 text-sm sm:text-base">
                {previewPlan.diet_goal && (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 text-emerald-950 dark:text-emerald-100 text-sm sm:text-base">
                    <strong className="font-black text-emerald-800 dark:text-emerald-300">هدف فیزیولوژیک: </strong>
                    {previewPlan.diet_goal}
                  </div>
                )}

                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                  <table className="w-full text-right text-sm sm:text-base">
                    <thead className="bg-emerald-700 text-white font-bold">
                      <tr>
                        <th className="p-3.5 w-36 border-b border-emerald-800 text-sm sm:text-base">وعده غذایی</th>
                        <th className="p-3.5 border-b border-emerald-800 text-sm sm:text-base">مواد غذایی و دستور مصرف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {previewPlan.breakfast && (
                        <tr>
                          <td className="p-3.5 font-bold bg-slate-50 dark:bg-slate-800/40">صبحانه</td>
                          <td className="p-3.5 leading-relaxed">{previewPlan.breakfast}</td>
                        </tr>
                      )}
                      {previewPlan.morning_snack && (
                        <tr>
                          <td className="p-3.5 font-bold bg-slate-50 dark:bg-slate-800/40">میان‌وعده صبح</td>
                          <td className="p-3.5 leading-relaxed">{previewPlan.morning_snack}</td>
                        </tr>
                      )}
                      {previewPlan.lunch && (
                        <tr>
                          <td className="p-3.5 font-bold bg-slate-50 dark:bg-slate-800/40">ناهار</td>
                          <td className="p-3.5 leading-relaxed">{previewPlan.lunch}</td>
                        </tr>
                      )}
                      {previewPlan.afternoon_snack && (
                        <tr>
                          <td className="p-3.5 font-bold bg-slate-50 dark:bg-slate-800/40">عصرانه / قبل تمرین</td>
                          <td className="p-3.5 leading-relaxed">{previewPlan.afternoon_snack}</td>
                        </tr>
                      )}
                      {previewPlan.dinner && (
                        <tr>
                          <td className="p-3.5 font-bold bg-slate-50 dark:bg-slate-800/40">شام</td>
                          <td className="p-3.5 leading-relaxed">{previewPlan.dinner}</td>
                        </tr>
                      )}
                      {previewPlan.post_workout_snack && (
                        <tr>
                          <td className="p-3.5 font-bold bg-slate-50 dark:bg-slate-800/40">ریکاوری بعد از تمرین</td>
                          <td className="p-3.5 leading-relaxed">{previewPlan.post_workout_snack}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {previewPlan.hydration_guidelines && (
                  <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 text-slate-800 dark:text-slate-200 space-y-1.5 text-sm sm:text-base">
                    <strong className="text-sky-800 dark:text-sky-300 block font-bold">مصرف آب و هیدراتاسیون:</strong>
                    <p className="whitespace-pre-line leading-relaxed">{previewPlan.hydration_guidelines}</p>
                  </div>
                )}

                {previewPlan.supplements && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 space-y-1.5 text-sm sm:text-base">
                    <strong className="block font-bold">مکمل‌ها و ویتامین‌ها:</strong>
                    <p className="whitespace-pre-line leading-relaxed">{previewPlan.supplements}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 text-sm sm:text-base">
                {previewPlan.focus_skills && (
                  <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 text-blue-950 dark:text-blue-100 text-sm sm:text-base">
                    <strong className="font-black text-blue-800 dark:text-blue-300">تمرکز آموزشی و تکنیکی: </strong>
                    {previewPlan.focus_skills}
                  </div>
                )}

                {previewPlan.warmup_section && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                    <strong className="text-amber-600 dark:text-amber-400 block font-black text-sm sm:text-base">
                      ۱. بخش گرم‌کردن و تمرینات کششی در آب (Warm-up):
                    </strong>
                    <p className="whitespace-pre-line leading-relaxed text-slate-700 dark:text-slate-200 text-sm sm:text-base">
                      {previewPlan.warmup_section}
                    </p>
                  </div>
                )}

                {previewPlan.main_section && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-r-4 border-r-blue-600 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                    <strong className="text-blue-700 dark:text-blue-300 block font-black text-sm sm:text-base">
                      ۲. بخش تمرینات اصلی و ست‌های شنا (Main Set):
                    </strong>
                    <pre className="whitespace-pre-wrap font-mono text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200">
                      {previewPlan.main_section}
                    </pre>
                  </div>
                )}

                {previewPlan.cooldown_section && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                    <strong className="text-cyan-600 dark:text-cyan-400 block font-black text-sm sm:text-base">
                      ۳. بخش سردکردن و ریکاوری (Cool-down):
                    </strong>
                    <p className="whitespace-pre-line leading-relaxed text-slate-700 dark:text-slate-200 text-sm sm:text-base">
                      {previewPlan.cooldown_section}
                    </p>
                  </div>
                )}
              </div>
            )}

            {previewPlan.notes && (
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 text-sm sm:text-base text-amber-900 dark:text-amber-200">
                <strong className="font-bold">یادداشت مربی: </strong>
                {previewPlan.notes}
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => exportPlanToWord(previewPlan)}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base cursor-pointer px-4 py-2.5"
                >
                  <Download className="w-4.5 h-4.5" />
                  <span>دانلود فایل Word (.doc)</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => printPlanToPdf(previewPlan)}
                  className="gap-2 text-rose-700 border-rose-300 hover:bg-rose-50 font-bold text-sm sm:text-base cursor-pointer px-4 py-2.5"
                >
                  <Printer className="w-4.5 h-4.5" />
                  <span>چاپ / ذخیره PDF</span>
                </Button>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  loading={sendingId === previewPlan.id}
                  onClick={() => handleSendPlan(previewPlan)}
                  className="gap-2 text-teal-700 border-teal-300 hover:bg-teal-50 font-bold text-sm sm:text-base cursor-pointer px-4 py-2.5"
                >
                  <Send className="w-4.5 h-4.5" />
                  <span>{previewPlan.sent_at ? 'ارسال مجدد' : 'ارسال به مخاطب'}</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setPreviewPlan(null)}
                  className="text-sm sm:text-base font-bold px-4 py-2.5"
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
