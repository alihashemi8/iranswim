import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Search, X, RotateCcw, Layers, Droplets, Award,
  LayoutGrid, Table, TrendingUp, UserCheck, ChevronLeft,
} from 'lucide-react';

import api from '../../api/client';
import { CustomSelect } from '../../components/common/CustomSelect';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';

// ── ثابت‌ها ──────────────────────────────────────────────────────────
const VIEW_PREF_KEY = 'iranswim_swimmers_view';

const ENROLLMENT_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'ثبت‌نام فعال' },
  { value: 'PENDING_PAYMENT', label: 'در انتظار پرداخت' },
  { value: 'COMPLETED', label: 'تکمیل‌شده' },
];

const STATUS_CHIP_STYLES = {
  ACTIVE: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800',
  PENDING_PAYMENT: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200/70 dark:border-amber-800',
  COMPLETED: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200/70 dark:border-sky-800',
};

const attendanceColor = (rate) => {
  if (rate === null || rate === undefined) return 'text-slate-400 dark:text-slate-500';
  if (rate >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (rate >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
};

const attendanceBadge = (rate) => {
  if (rate === null || rate === undefined) return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
  if (rate >= 80) return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800';
  if (rate >= 60) return 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200/70 dark:border-amber-800';
  return 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200/70 dark:border-rose-800';
};

export const CoachSwimmersPage = () => {
  const toast = useToast();
  const [swimmers, setSwimmers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── فیلترها ──
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedPool, setSelectedPool] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // ── حالت نمایش: کارت / جدول (با ذخیره انتخاب کاربر) ──
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem(VIEW_PREF_KEY) === 'table' ? 'table' : 'cards';
    } catch {
      return 'cards';
    }
  });
  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_PREF_KEY, mode);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchSwimmers = async () => {
      try {
        setLoading(true);
        const res = await api.get('/coaches/my-swimmers/');
        if (isMounted) {
          setSwimmers(Array.isArray(res.data) ? res.data : res.data.results || []);
        }
      } catch (err) {
        console.error('Error fetching coach swimmers:', err);
        toast.error('خطا در دریافت فهرست شناگران مربی');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchSwimmers();
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── گزینه‌های فیلتر بر اساس داده واقعی ──
  const courseOptions = useMemo(() => {
    const map = new Map();
    swimmers.forEach((sw) =>
      sw.courses?.forEach((c) => map.set(String(c.course_id), c.course_name))
    );
    return Array.from(map, ([value, label]) => ({ value, label }));
  }, [swimmers]);

  const poolOptions = useMemo(() => {
    const set = new Set();
    swimmers.forEach((sw) => sw.pools?.forEach((p) => set.add(p)));
    return Array.from(set, (p) => ({ value: p, label: p }));
  }, [swimmers]);

  const levelOptions = useMemo(() => {
    const map = new Map();
    swimmers.forEach((sw) => map.set(String(sw.level_id ?? 'none'), sw.level_name));
    return Array.from(map, ([value, label]) => ({ value, label }));
  }, [swimmers]);

  // ── اعمال فیلترها ──
  const filteredSwimmers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return swimmers.filter((sw) => {
      if (
        term &&
        !sw.full_name?.toLowerCase().includes(term)
      ) return false;
      if (selectedCourse && !sw.courses?.some((c) => String(c.course_id) === selectedCourse)) return false;
      if (selectedPool && !sw.pools?.includes(selectedPool)) return false;
      if (selectedLevel && String(sw.level_id ?? 'none') !== selectedLevel) return false;
      if (selectedStatus && !sw.courses?.some((c) => c.status === selectedStatus)) return false;
      return true;
    });
  }, [swimmers, searchTerm, selectedCourse, selectedPool, selectedLevel, selectedStatus]);

  const hasActiveFilter =
    searchTerm.trim() !== '' || selectedCourse !== '' || selectedPool !== '' ||
    selectedLevel !== '' || selectedStatus !== '';

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCourse('');
    setSelectedPool('');
    setSelectedLevel('');
    setSelectedStatus('');
  };

  // ── آمار خلاصه ──
  const stats = useMemo(() => {
    const total = swimmers.length;
    const active = swimmers.filter((sw) => sw.active_enrollments > 0).length;
    const rateValues = swimmers
      .map((sw) => sw.attendance_rate)
      .filter((r) => r !== null && r !== undefined);
    const avgRate = rateValues.length
      ? Math.round(rateValues.reduce((a, b) => a + b, 0) / rateValues.length)
      : null;
    const levels = new Set(swimmers.map((sw) => sw.level_name)).size;
    return { total, active, avgRate, levels };
  }, [swimmers]);

  const statCards = [
    { label: 'کل شناگران', value: stats.total, Icon: Users, color: 'emerald' },
    { label: 'ثبت‌نام فعال', value: stats.active, Icon: UserCheck, color: 'sky' },
    { label: 'میانگین حضور', value: stats.avgRate === null ? '—' : `${stats.avgRate}٪`, Icon: TrendingUp, color: 'amber' },
    { label: 'سطوح مهارتی', value: stats.levels, Icon: Award, color: 'violet' },
  ];

  const STAT_COLORS = {
    emerald: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300',
    sky: 'bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300',
    amber: 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300',
    violet: 'bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300',
  };

  // ═══════════════════ حالت بارگذاری ═══════════════════
  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 inline-flex">
              <Users className="w-5 h-5" />
            </span>
            شناگران من
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            فهرست کامل تمام شناگران تحت سرپرستی شما همراه با آمار حضور و دوره‌های ثبت‌نامی
          </p>
        </div>
        <LoadingState type="table" showStats message="در حال دریافت فهرست شناگران شما..." rows={6} />
      </div>
    );
  }

  // ═══════════════════ رندر اصلی ═══════════════════
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* هدر */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 inline-flex">
              <Users className="w-5 h-5" />
            </span>
            شناگران من
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            فهرست کامل تمام شناگران تحت سرپرستی شما همراه با آمار حضور و دوره‌های ثبت‌نامی
          </p>
        </div>
      </div>

      {/* کارت‌های آماری */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {statCards.map(({ label, value, Icon, color }) => (
          <div
            key={label}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-3.5 sm:p-4 flex items-center gap-3"
          >
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${STAT_COLORS[color]}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono">
                {value}
              </div>
              <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold truncate">
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* نوار فیلترها */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 lg:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3">
          {/* جست‌وجو */}
          <div className="relative md:col-span-4">
            <Search className="w-4.5 h-4.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="جست‌وجوی نام شناگر..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full min-h-[42px] pr-10 pl-9 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all"
              aria-label="جست‌وجوی شناگر"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                title="پاک کردن جست‌وجو"
                aria-label="پاک کردن جست‌وجو"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* فیلتر دوره */}
          <div className="md:col-span-2">
            <CustomSelect
              value={selectedCourse}
              onChange={(val) => setSelectedCourse(val || '')}
              options={courseOptions}
              icon={Layers}
              placeholder="دوره..."
              color="emerald"
              searchable={courseOptions.length > 5}
              clearable
              isActive={selectedCourse !== ''}
              align="auto"
            />
          </div>

          {/* فیلتر استخر */}
          <div className="md:col-span-2">
            <CustomSelect
              value={selectedPool}
              onChange={(val) => setSelectedPool(val || '')}
              options={poolOptions}
              icon={Droplets}
              placeholder="استخر..."
              color="sky"
              searchable={poolOptions.length > 5}
              clearable
              isActive={selectedPool !== ''}
              align="auto"
            />
          </div>

          {/* فیلتر سطح */}
          <div className="md:col-span-2">
            <CustomSelect
              value={selectedLevel}
              onChange={(val) => setSelectedLevel(val || '')}
              options={levelOptions}
              icon={Award}
              placeholder="سطح..."
              color="amber"
              searchable={levelOptions.length > 5}
              clearable
              isActive={selectedLevel !== ''}
              align="auto"
            />
          </div>

          {/* فیلتر وضعیت ثبت‌نام */}
          <div className="md:col-span-2">
            <CustomSelect
              value={selectedStatus}
              onChange={(val) => setSelectedStatus(val || '')}
              options={ENROLLMENT_STATUS_OPTIONS}
              icon={UserCheck}
              placeholder="وضعیت..."
              color="blue"
              clearable
              isActive={selectedStatus !== ''}
              align="auto"
            />
          </div>
        </div>

        {/* خلاصه فیلترها و سوییچ نمایش */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span>
              نمایش{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{filteredSwimmers.length}</span>{' '}
              از{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{swimmers.length}</span>{' '}
              شناگر
            </span>
            {selectedCourse !== '' && (
              <button
                type="button"
                onClick={() => setSelectedCourse('')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800 font-semibold text-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer max-w-[190px]"
                title="حذف فیلتر دوره"
              >
                <span className="truncate">
                  {courseOptions.find((o) => o.value === selectedCourse)?.label || 'دوره انتخابی'}
                </span>
                <X className="w-3 h-3 shrink-0" />
              </button>
            )}
            {selectedPool !== '' && (
              <button
                type="button"
                onClick={() => setSelectedPool('')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800 font-semibold text-xs hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors cursor-pointer max-w-[190px]"
                title="حذف فیلتر استخر"
              >
                <span className="truncate">{selectedPool}</span>
                <X className="w-3 h-3 shrink-0" />
              </button>
            )}
            {selectedLevel !== '' && (
              <button
                type="button"
                onClick={() => setSelectedLevel('')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800 font-semibold text-xs hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors cursor-pointer max-w-[190px]"
                title="حذف فیلتر سطح"
              >
                <span className="truncate">
                  {levelOptions.find((o) => o.value === selectedLevel)?.label || 'سطح انتخابی'}
                </span>
                <X className="w-3 h-3 shrink-0" />
              </button>
            )}
            {selectedStatus !== '' && (
              <button
                type="button"
                onClick={() => setSelectedStatus('')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800 font-semibold text-xs hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                title="حذف فیلتر وضعیت"
              >
                <span className="truncate">
                  {ENROLLMENT_STATUS_OPTIONS.find((o) => o.value === selectedStatus)?.label}
                </span>
                <X className="w-3 h-3 shrink-0" />
              </button>
            )}
            {searchTerm.trim() !== '' && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer max-w-[180px]"
                title="حذف عبارت جست‌وجو"
              >
                <span className="truncate">«{searchTerm.trim()}»</span>
                <X className="w-3 h-3 shrink-0" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* سوییچ حالت نمایش: کارت / جدول */}
            <div
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700"
              role="group"
              aria-label="حالت نمایش لیست شناگران"
            >
              <button
                type="button"
                onClick={() => handleSetViewMode('cards')}
                aria-pressed={viewMode === 'cards'}
                title="نمایش کارتی"
                aria-label="نمایش کارتی"
                className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">کارت</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetViewMode('table')}
                aria-pressed={viewMode === 'table'}
                title="نمایش جدولی"
                aria-label="نمایش جدولی"
                className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Table className="w-4 h-4" />
                <span className="hidden sm:inline">جدول</span>
              </button>
            </div>

            {hasActiveFilter && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                پاک کردن فیلترها
              </button>
            )}
          </div>
        </div>
      </div>

      {/* لیست شناگران */}
      {filteredSwimmers.length === 0 ? (
        swimmers.length === 0 ? (
          <EmptyState
            title="هنوز شناگری به شما تخصیص نیافته است"
            description="پس از تخصیص کلاس و دوره به شما و ثبت‌نام شناگران، فهرست آن‌ها در این بخش نمایش داده می‌شود."
          />
        ) : (
          <EmptyState
            title="شناگری با این فیلترها یافت نشد"
            description="ترکیب فیلترهای فعلی نتیجه‌ای ندارد. می‌توانید فیلترها را پاک کنید و دوباره تلاش کنید."
            action={
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                پاک کردن فیلترها
              </button>
            }
          />
        )
      ) : viewMode === 'cards' ? (
        /* ═══ نمای کارتی ═══ */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {filteredSwimmers.map((sw) => (
            <div
              key={sw.swimmer_id}
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-4 sm:p-5 transition-all duration-200 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-xs overflow-hidden ring-2 ring-slate-100 dark:ring-slate-800 transition-transform group-hover:scale-105">
                  {sw.avatar ? (
                    <img
                      src={sw.avatar}
                      alt={sw.full_name}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    sw.full_name?.charAt(0) || 'ش'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm sm:text-[15px] font-black text-slate-900 dark:text-white truncate">
                    {sw.full_name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5 flex items-center gap-1.5">
                    <span>{sw.gender}</span>
                    {sw.age !== null && <span>· {sw.age} ساله</span>}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-lg text-[11px] font-black border shrink-0 ${attendanceBadge(sw.attendance_rate)}`}
                  title="درصد حضور در جلسات"
                >
                  {sw.attendance_rate === null || sw.attendance_rate === undefined
                    ? 'حضور: —'
                    : `حضور: ${sw.attendance_rate}٪`}
                </span>
              </div>

              {/* مشخصات */}
              <div className="flex flex-wrap items-center gap-1.5 mt-3.5">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200/70 dark:border-violet-800 text-[11px] font-bold">
                  <Award className="w-3 h-3 shrink-0" />
                  {sw.level_name}
                </span>
                {!sw.is_active_swimmer && (
                  <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                    پرونده غیرفعال
                  </span>
                )}
              </div>

              {/* چیپ دوره‌ها */}
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                {sw.courses?.slice(0, 2).map((en) => (
                  <span
                    key={en.enrollment_id}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold max-w-full border ${STATUS_CHIP_STYLES[en.status] || 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/70 dark:border-slate-700'}`}
                    title={`${en.course_name}${en.group_name ? ` — ${en.group_name}` : ''}`}
                  >
                    <Layers className="w-3 h-3 shrink-0" />
                    <span className="truncate">{en.course_name}</span>
                  </span>
                ))}
                {(sw.courses?.length || 0) > 2 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700 text-[11px] font-bold">
                    +{sw.courses.length - 2} دوره دیگر
                  </span>
                )}
              </div>

              {/* عملیات */}
              <Link
                to={`/coach/progress/${sw.swimmer_id}`}
                className="mt-3.5 inline-flex items-center justify-between gap-2 w-full px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-black hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 transition-all"
              >
                <span>مشاهده پرونده شناگر</span>
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      ) : (
        /* ═══ نمای جدولی ═══ */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/60 font-bold text-xs lg:text-sm">
                <tr>
                  <th className="py-3.5 px-3 lg:px-4 whitespace-nowrap">نام شناگر</th>
                  <th className="py-3.5 px-3 lg:px-4 whitespace-nowrap">سن / جنسیت</th>
                  <th className="py-3.5 px-3 lg:px-4 whitespace-nowrap">سطح مهارتی</th>
                  <th className="py-3.5 px-3 lg:px-4 whitespace-nowrap">دوره‌ها</th>
                  <th className="py-3.5 px-3 lg:px-4 whitespace-nowrap">استخر</th>
                  <th className="py-3.5 px-3 lg:px-4 text-center whitespace-nowrap">حضور</th>
                  <th className="py-3.5 px-3 lg:px-4 text-center whitespace-nowrap">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSwimmers.map((sw) => (
                  <tr
                    key={sw.swimmer_id}
                    className="hover:bg-emerald-50/40 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* نام شناگر */}
                    <td className="py-3.5 px-3 lg:px-4 align-middle">
                      <div className="flex items-center gap-2.5 lg:gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-sm shrink-0 overflow-hidden ring-2 ring-slate-100 dark:ring-slate-800">
                          {sw.avatar ? (
                            <img
                              src={sw.avatar}
                              alt={sw.full_name}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            sw.full_name?.charAt(0) || 'ش'
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm lg:text-[15px] font-black text-slate-900 dark:text-white whitespace-nowrap">
                            {sw.full_name}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                            {sw.courses?.length || 0} دوره ثبت‌نامی
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* سن / جنسیت */}
                    <td className="py-3.5 px-3 lg:px-4 align-middle whitespace-nowrap">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {sw.age !== null ? `${sw.age} سال` : '—'}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500"> / {sw.gender}</span>
                    </td>

                    {/* سطح مهارتی */}
                    <td className="py-3.5 px-3 lg:px-4 align-middle whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200/70 dark:border-violet-800 text-[11px] font-bold">
                        <Award className="w-3 h-3 shrink-0" />
                        {sw.level_name}
                      </span>
                    </td>

                    {/* دوره‌ها */}
                    <td className="py-3.5 px-3 lg:px-4 align-middle">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {sw.courses?.slice(0, 2).map((en) => (
                          <span
                            key={en.enrollment_id}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold max-w-[180px] border ${STATUS_CHIP_STYLES[en.status] || 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/70 dark:border-slate-700'}`}
                            title={`${en.course_name} — ${en.status_display}`}
                          >
                            <Layers className="w-3 h-3 shrink-0" />
                            <span className="truncate">{en.course_name}</span>
                          </span>
                        ))}
                        {(sw.courses?.length || 0) > 2 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700 text-[11px] font-bold whitespace-nowrap">
                            +{sw.courses.length - 2} دوره دیگر
                          </span>
                        )}
                      </div>
                    </td>

                    {/* استخر */}
                    <td className="py-3.5 px-3 lg:px-4 align-middle">
                      {(sw.pools?.length || 0) > 0 ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <Droplets className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                          <span className="truncate max-w-[170px]">{sw.pools.join('، ')}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>

                    {/* حضور */}
                    <td className="py-3.5 px-3 lg:px-4 text-center align-middle whitespace-nowrap">
                      <span className={`inline-block px-2 py-1 rounded-lg text-[11px] font-black border min-w-[64px] ${attendanceBadge(sw.attendance_rate)}`}>
                        {sw.attendance_rate === null || sw.attendance_rate === undefined
                          ? 'ثبت نشده'
                          : `${sw.attendance_rate}٪`}
                      </span>
                    </td>

                    {/* عملیات */}
                    <td className="py-3.5 px-3 lg:px-4 text-center align-middle">
                      <Link
                        to={`/coach/progress/${sw.swimmer_id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-black hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 transition-all cursor-pointer"
                        title={`پرونده ${sw.full_name}`}
                      >
                        پرونده
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
