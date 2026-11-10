import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Users, Award, Search,
  ChevronLeft, Calendar, BookOpen, Layers, X, RotateCcw
} from 'lucide-react';
import api from '../../api/client';
import { CustomSelect } from '../../components/common/CustomSelect';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';

const WEEKDAYS = [
  { index: 0, name: 'شنبه' },
  { index: 1, name: 'یک‌شنبه' },
  { index: 2, name: 'دوشنبه' },
  { index: 3, name: 'سه‌شنبه' },
  { index: 4, name: 'چهارشنبه' },
  { index: 5, name: 'پنج‌شنبه' },
  { index: 6, name: 'جمعه' },
];

const WEEKDAY_NAME_MAP = Object.fromEntries(WEEKDAYS.map((d) => [d.index, d.name]));

const parseWeekdaysFromText = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return [];
  const normalized = rawText
    .replace(/\u200c/g, ' ')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return [];

  const weekdaysSet = new Set();
  let rest = normalized;

  const compoundMatches = [
    { regex: /یک\s*شنبه/g, idx: 1 },
    { regex: /دو\s*شنبه/g, idx: 2 },
    { regex: /سه\s*شنبه/g, idx: 3 },
    { regex: /چهار\s*شنبه/g, idx: 4 },
    { regex: /پنج\s*شنبه/g, idx: 5 },
    { regex: /جمعه/g, idx: 6 },
  ];

  compoundMatches.forEach(({ regex, idx }) => {
    if (regex.test(rest)) {
      weekdaysSet.add(idx);
      rest = rest.replace(regex, ' ');
    }
  });

  if (/شنبه/.test(rest)) {
    weekdaysSet.add(0);
  }

  if (weekdaysSet.size === 0) {
    if (normalized.includes('فرد')) {
      weekdaysSet.add(0);
      weekdaysSet.add(2);
      weekdaysSet.add(4);
    } else if (normalized.includes('زوج')) {
      weekdaysSet.add(1);
      weekdaysSet.add(3);
      weekdaysSet.add(5);
    }
  }

  return Array.from(weekdaysSet).sort((a, b) => a - b);
};

const formatPersianList = (items) => {
  if (!items || items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} و ${items[1]}`;
  return `${items.slice(0, -1).join('، ')} و ${items[items.length - 1]}`;
};

const getClassScheduleInfo = (cls) => {
  const schedules = Array.isArray(cls?.schedules) ? [...cls.schedules] : [];

  if (schedules.length > 0) {
    schedules.sort((a, b) => Number(a.weekday) - Number(b.weekday));
    const seenWeekdays = new Set();
    const chips = [];

    schedules.forEach((sch) => {
      const idx = Number(sch.weekday);
      if (Number.isNaN(idx) || idx < 0 || idx > 6 || seenWeekdays.has(idx)) return;
      seenWeekdays.add(idx);
      const startTime = sch.start_time ? String(sch.start_time).slice(0, 5) : '';
      const endTime = sch.end_time ? String(sch.end_time).slice(0, 5) : '';
      chips.push({
        weekday: idx,
        label: WEEKDAY_NAME_MAP[idx] || sch.weekday_display || '',
        time: startTime,
        endTime,
      });
    });

    const weekdays = chips.map((c) => c.weekday);
    const uniqueTimeRanges = new Set(
      chips.map((c) => (c.time && c.endTime ? `${c.time} تا ${c.endTime}` : c.time || ''))
    );

    let summaryText = '';
    if (uniqueTimeRanges.size === 1) {
      const onlyTime = Array.from(uniqueTimeRanges)[0];
      const daysJoined = formatPersianList(chips.map((c) => c.label));
      summaryText = onlyTime ? `${daysJoined} (${onlyTime})` : daysJoined;
    } else {
      summaryText = chips
        .map((c) => (c.time ? `${c.label} ${c.time}` : c.label))
        .join('، ');
    }

    return { weekdays, chips, summaryText };
  }

  let weekdays = parseWeekdaysFromText(cls?.course_days);
  if (weekdays.length === 0) {
    weekdays = parseWeekdaysFromText(cls?.name);
  }

  const chips = weekdays.map((idx) => ({
    weekday: idx,
    label: WEEKDAY_NAME_MAP[idx],
    time: '',
    endTime: '',
  }));

  const daysText = cls?.course_days || formatPersianList(chips.map((c) => c.label));
  const summaryText = [daysText, cls?.course_time].filter(Boolean).join(' · ');

  return { weekdays, chips, summaryText };
};

export const CoachProgressPage = () => {
  const [swimmers, setSwimmers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchAllEnrollments = async () => {
      const firstRes = await api.get('/education/enrollments/');
      const firstData = firstRes.data;
      if (Array.isArray(firstData)) return firstData;

      const allItems = [...(firstData?.results || [])];
      let next = firstData?.next;
      let page = 2;

      while (next && page <= 50) {
        const pageRes = await api.get('/education/enrollments/', { params: { page } });
        const pageData = pageRes.data;
        const pageItems = pageData?.results || (Array.isArray(pageData) ? pageData : []);
        allItems.push(...pageItems);
        next = pageData?.next;
        page += 1;
      }

      return allItems;
    };

    const fetchData = async () => {
      try {
        setLoading(true);
        const [classesRes, enrList] = await Promise.all([
          api.get('/coaches/my-classes/'),
          fetchAllEnrollments(),
        ]);

        const clsList = Array.isArray(classesRes.data)
          ? classesRes.data
          : classesRes.data?.results || [];
        setClasses(clsList);

        const uniqueSwimmersMap = {};
        enrList.forEach((en) => {
          if (!uniqueSwimmersMap[en.swimmer]) {
            uniqueSwimmersMap[en.swimmer] = {
              swimmer_id: en.swimmer,
              full_name: en.swimmer_name,
              enrollments: [],
            };
          }
          uniqueSwimmersMap[en.swimmer].enrollments.push({
            id: en.id,
            group_id: en.group,
            group_name: en.group_name,
            course_id: en.course,
            course_name: en.course_name,
            course_days: en.course_days,
            course_time: en.course_time,
            sessions_attended: en.sessions_attended,
            sessions_purchased: en.sessions_purchased,
          });
        });
        setSwimmers(Object.values(uniqueSwimmersMap));
      } catch (err) {
        console.error('Error fetching swimmers progress:', err);
        toast.error('خطا در دریافت لیست پیشرفت شناگران');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const enrichedClasses = useMemo(() => {
    return classes.map((cls) => {
      const scheduleInfo = getClassScheduleInfo(cls);
      return {
        ...cls,
        weekdays: scheduleInfo.weekdays,
        scheduleInfo,
      };
    });
  }, [classes]);

  const classMap = useMemo(() => {
    const map = {};
    enrichedClasses.forEach((cls) => {
      map[cls.id] = cls;
    });
    return map;
  }, [enrichedClasses]);

  const swimmerCountByGroup = useMemo(() => {
    const counts = {};
    swimmers.forEach((sw) => {
      const seenGroups = new Set();
      sw.enrollments.forEach((en) => {
        if (en.group_id && !seenGroups.has(en.group_id)) {
          seenGroups.add(en.group_id);
          counts[en.group_id] = (counts[en.group_id] || 0) + 1;
        }
      });
    });
    return counts;
  }, [swimmers]);

  const dayClassCounts = useMemo(() => {
    const counts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    enrichedClasses.forEach((cls) => {
      cls.weekdays.forEach((dayIdx) => {
        if (counts[dayIdx] !== undefined) {
          counts[dayIdx] += 1;
        }
      });
    });
    return counts;
  }, [enrichedClasses]);

  const visibleClasses = useMemo(() => {
    if (selectedDay === '') return enrichedClasses;
    const dayNum = Number(selectedDay);
    return enrichedClasses.filter((cls) => cls.weekdays.includes(dayNum));
  }, [enrichedClasses, selectedDay]);

  const selectedDayName = selectedDay !== '' ? WEEKDAY_NAME_MAP[Number(selectedDay)] : '';

  const handleSelectDay = (dayVal) => {
    setSelectedDay(dayVal);
    if (dayVal !== '' && selectedClass !== '') {
      const dayNum = Number(dayVal);
      const stillValid = enrichedClasses.some(
        (cls) => String(cls.id) === String(selectedClass) && cls.weekdays.includes(dayNum)
      );
      if (!stillValid) {
        setSelectedClass('');
      }
    }
  };

  const handleResetFilters = () => {
    setSelectedDay('');
    setSelectedClass('');
    setSearchTerm('');
  };

  const classOptions = useMemo(() => {
    const allOption = {
      value: '',
      label: selectedDay === '' ? 'همه کلاس‌های من' : `همه کلاس‌های روز ${selectedDayName}`,
      icon: Layers,
      description:
        selectedDay === ''
          ? 'نمایش شناگران تمام کلاس‌های تخصیص‌یافته'
          : `فیلتر بر اساس کلاس‌های فعال در روز ${selectedDayName}`,
      badge: `${visibleClasses.length} کلاس`,
    };

    const items = visibleClasses.map((cls) => {
      const count = swimmerCountByGroup[cls.id] ?? 0;
      const details = [
        cls.course_name,
        cls.skill_level_name,
        cls.scheduleInfo.summaryText,
      ]
        .filter(Boolean)
        .join(' · ');

      return {
        value: String(cls.id),
        label: cls.name,
        icon: BookOpen,
        description: details,
        badge: `${count} شناگر`,
      };
    });

    return [allOption, ...items];
  }, [visibleClasses, selectedDay, selectedDayName, swimmerCountByGroup]);

  const filteredSwimmers = useMemo(() => {
    const getEnrollmentWeekdays = (en) => {
      const cls = en.group_id ? classMap[en.group_id] : null;
      if (cls && cls.weekdays.length > 0) return cls.weekdays;
      return parseWeekdaysFromText(en.course_days);
    };

    const q = searchTerm.trim().toLowerCase();
    return swimmers
      .map((sw) => {
        const matchingEnrollments = sw.enrollments.filter((en) => {
          const matchesClass = !selectedClass || en.group_id === Number(selectedClass);
          const matchesDay =
            selectedDay === '' || getEnrollmentWeekdays(en).includes(Number(selectedDay));
          return matchesClass && matchesDay;
        });

        if (matchingEnrollments.length === 0) return null;

        const matchesSearch =
          !q ||
          sw.full_name?.toLowerCase().includes(q) ||
          matchingEnrollments.some(
            (en) =>
              en.group_name?.toLowerCase().includes(q) ||
              en.course_name?.toLowerCase().includes(q)
          );

        if (!matchesSearch) return null;

        return {
          ...sw,
          displayEnrollments: matchingEnrollments,
        };
      })
      .filter(Boolean);
  }, [swimmers, searchTerm, selectedClass, selectedDay, classMap]);

  const hasActiveFilter = Boolean(searchTerm.trim() || selectedClass !== '' || selectedDay !== '');

  if (loading) {
    return <LoadingState type="table" message="در حال بارگذاری کارنامه و پیشرفت شناگران..." />;
  }

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6 pb-4 sm:pb-6 coach-panel">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2 sm:gap-2.5">
            <TrendingUp className="w-5.5 h-5.5 sm:w-7 sm:h-7 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>ارزیابی و پیشرفت شناگران</span>
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            سنجش مهارت‌های تخصصی شنا، ثبت ارزیابی دوره‌ای و کارنامه انفرادی شاگردان
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Link
            to="/coach/exams"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 min-h-[40px] sm:min-h-[42px] rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm lg:text-base font-bold shadow-xs transition-all active:scale-95 whitespace-nowrap shrink-0"
          >
            <Award className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
            <span>آزمون‌ها و پیشنهاد ارتقا</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 lg:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 sm:space-y-3.5 relative z-20">
        {/* Row 1: Search & Class CustomSelect */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3 items-center">
          <div className="relative md:col-span-6 lg:col-span-7">
            <Search className="w-4.5 h-4.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="جست‌وجوی نام شناگر، کلاس یا دوره..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full min-h-[42px] pr-10 pl-9 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all"
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

          <div className="md:col-span-6 lg:col-span-5">
            <CustomSelect
              value={selectedClass}
              onChange={(val) => setSelectedClass(val || '')}
              options={classOptions}
              icon={BookOpen}
              placeholder="انتخاب کلاس..."
              color="emerald"
              searchable={visibleClasses.length > 5}
              clearable
              isActive={selectedClass !== ''}
              align="auto"
              menuClassName="w-full md:min-w-full md:w-max md:max-w-[min(460px,calc(100vw-7rem))]"
            />
          </div>
        </div>

        {/* Row 2: Class Day Category Filter */}
        <div className="pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 shrink-0">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>دسته‌بندی بر اساس روز کلاس:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-1">
            <button
              type="button"
              onClick={() => handleSelectDay('')}
              aria-pressed={selectedDay === ''}
              className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer whitespace-nowrap ${
                selectedDay === ''
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 font-semibold'
              }`}
            >
              <span>همه روزها</span>
              <span
                className={`text-[11px] sm:text-xs px-2 py-0.5 rounded-full font-mono font-bold leading-none ${
                  selectedDay === ''
                    ? 'bg-emerald-700/80 text-white'
                    : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {enrichedClasses.length}
              </span>
            </button>

            {WEEKDAYS.map((day) => {
              const count = dayClassCounts[day.index] || 0;
              const isSelected = selectedDay === String(day.index);
              return (
                <button
                  key={day.index}
                  type="button"
                  onClick={() => handleSelectDay(String(day.index))}
                  aria-pressed={isSelected}
                  className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : count > 0
                      ? 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 font-semibold'
                      : 'bg-slate-50/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200/70 dark:border-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600 font-medium'
                  }`}
                >
                  <span>{day.name}</span>
                  <span
                    className={`text-[11px] sm:text-xs px-2 py-0.5 rounded-full font-mono font-bold leading-none ${
                      isSelected
                        ? 'bg-emerald-700/80 text-white'
                        : count > 0
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-200/80 dark:bg-slate-700/70 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: Active Filter Summary */}
        <div className="pt-2 sm:pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span>
              نمایش{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {filteredSwimmers.length}
              </span>{' '}
              شناگر
            </span>
            {selectedDay !== '' && (
              <button
                type="button"
                onClick={() => handleSelectDay('')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800 font-semibold text-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
                title="حذف فیلتر روز"
              >
                <span>روز {selectedDayName} ({visibleClasses.length} کلاس)</span>
                <X className="w-3 h-3 shrink-0" />
              </button>
            )}
            {selectedClass !== '' && classMap[Number(selectedClass)] && (
              <button
                type="button"
                onClick={() => setSelectedClass('')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800 font-semibold text-xs hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors cursor-pointer max-w-[210px] sm:max-w-[280px]"
                title="حذف فیلتر کلاس"
              >
                <span className="truncate">{classMap[Number(selectedClass)].name}</span>
                <X className="w-3 h-3 shrink-0" />
              </button>
            )}
            {searchTerm.trim() !== '' && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer max-w-[180px] sm:max-w-[240px]"
                title="حذف عبارت جست‌وجو"
              >
                <span className="truncate">«{searchTerm.trim()}»</span>
                <X className="w-3 h-3 shrink-0" />
              </button>
            )}
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

      {/* Swimmers Roster: Mobile Cards (< md) & Tablet/Desktop Table (md+) */}
      {filteredSwimmers.length > 0 ? (
        <>
          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {filteredSwimmers.map((sw) => {
              const primaryEnr = sw.displayEnrollments[0];
              const isMultiEnrollment = sw.displayEnrollments.length > 1;
              return (
                <div
                  key={sw.swimmer_id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3"
                >
                  {/* Card Header: Swimmer Identity & Attendance */}
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center font-bold text-sm shrink-0">
                        {sw.full_name?.charAt(0) || 'ش'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                          {sw.full_name}
                        </h3>
                        {isMultiEnrollment && (
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                            {sw.displayEnrollments.length} کلاس فعال
                          </span>
                        )}
                      </div>
                    </div>

                    {!isMultiEnrollment && primaryEnr && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-mono text-xs font-bold whitespace-nowrap shrink-0">
                        {primaryEnr.sessions_attended} از {primaryEnr.sessions_purchased} جلسه
                      </span>
                    )}
                  </div>

                  {/* Enrollments Breakdown */}
                  <div className="space-y-2">
                    {sw.displayEnrollments.map((en) => {
                      const clsObj = en.group_id ? classMap[en.group_id] : null;
                      const chips =
                        clsObj?.scheduleInfo?.chips ||
                        parseWeekdaysFromText(en.course_days).map((idx) => ({
                          weekday: idx,
                          label: WEEKDAY_NAME_MAP[idx],
                          time: '',
                        }));

                      return (
                        <div
                          key={en.id}
                          className="p-3 rounded-xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
                              {en.group_name || 'کلاس من'}
                            </div>
                            {isMultiEnrollment && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-mono text-[11px] font-bold whitespace-nowrap shrink-0">
                                {en.sessions_attended} از {en.sessions_purchased} جلسه
                              </span>
                            )}
                          </div>

                          {en.course_name && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                              {en.course_name}
                            </div>
                          )}

                          {chips.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 pt-0.5">
                              {chips.map((ch) => {
                                const isDayActive =
                                  selectedDay !== '' && Number(selectedDay) === ch.weekday;
                                return (
                                  <span
                                    key={ch.weekday}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${
                                      isDayActive
                                        ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 font-bold shadow-xs'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700 font-semibold'
                                    }`}
                                  >
                                    <span className="font-bold">{ch.label}</span>
                                    {ch.time && (
                                      <span className="font-mono text-[11px] opacity-80">
                                        {ch.time}
                                      </span>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Primary CTA */}
                  <Link
                    to={`/coach/progress/${sw.swimmer_id}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-200/70 dark:border-emerald-800/70 font-bold transition-all text-xs sm:text-sm active:scale-[0.99]"
                  >
                    <TrendingUp className="w-4 h-4 shrink-0" />
                    <span>مشاهده پرونده و ثبت ارزیابی</span>
                    <ChevronLeft className="w-4 h-4 shrink-0" />
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Tablet & Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/60 font-bold text-xs lg:text-sm">
                  <tr>
                    <th className="py-3.5 px-3 lg:px-4 whitespace-nowrap">نام شناگر</th>
                    <th className="py-3.5 px-3 lg:px-4 whitespace-nowrap">کلاس آموزشی</th>
                    <th className="py-3.5 px-3 lg:px-4 whitespace-nowrap">جلسات حضور</th>
                    <th className="py-3.5 px-3 lg:px-4 text-center whitespace-nowrap">
                      پرونده عملکرد و مهارت
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSwimmers.map((sw) => {
                    const primaryEnr = sw.displayEnrollments[0];
                    const isMultiEnrollment = sw.displayEnrollments.length > 1;
                    return (
                      <tr
                        key={sw.swimmer_id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-3 lg:px-4 font-bold text-slate-900 dark:text-white align-middle">
                          <div className="flex items-center gap-2.5 lg:gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50 flex items-center justify-center font-bold text-sm shrink-0">
                              {sw.full_name?.charAt(0) || 'ش'}
                            </div>
                            <span className="text-sm lg:text-[15px] whitespace-nowrap">
                              {sw.full_name}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 lg:px-4 text-slate-700 dark:text-slate-300 text-sm align-middle">
                          <div className="space-y-2.5">
                            {sw.displayEnrollments.map((en) => {
                              const clsObj = en.group_id ? classMap[en.group_id] : null;
                              const chips =
                                clsObj?.scheduleInfo?.chips ||
                                parseWeekdaysFromText(en.course_days).map((idx) => ({
                                  weekday: idx,
                                  label: WEEKDAY_NAME_MAP[idx],
                                  time: '',
                                }));

                              return (
                                <div key={en.id} className="space-y-1">
                                  <div className="font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                                    {en.group_name || 'کلاس من'}
                                  </div>
                                  {en.course_name && (
                                    <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                      {en.course_name}
                                    </div>
                                  )}
                                  {chips.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                                      {chips.map((ch) => {
                                        const isDayActive =
                                          selectedDay !== '' && Number(selectedDay) === ch.weekday;
                                        return (
                                          <span
                                            key={ch.weekday}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${
                                              isDayActive
                                                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 font-bold shadow-xs'
                                                : 'bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700 font-semibold'
                                            }`}
                                          >
                                            <span className="font-bold">{ch.label}</span>
                                            {ch.time && (
                                              <span className="font-mono text-[11px] opacity-80">
                                                {ch.time}
                                              </span>
                                            )}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 lg:px-4 align-middle">
                          {!isMultiEnrollment ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-mono text-xs lg:text-sm font-bold whitespace-nowrap">
                              {primaryEnr.sessions_attended} از {primaryEnr.sessions_purchased} جلسه
                            </span>
                          ) : (
                            <div className="space-y-2">
                              {sw.displayEnrollments.map((en) => (
                                <div key={en.id} className="flex flex-col items-start gap-0.5">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-mono text-xs font-bold whitespace-nowrap">
                                    {en.sessions_attended} از {en.sessions_purchased} جلسه
                                  </span>
                                  {en.group_name && (
                                    <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[140px]">
                                      {en.group_name}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-3 lg:px-4 text-center align-middle">
                          <Link
                            to={`/coach/progress/${sw.swimmer_id}`}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 lg:px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-200/70 dark:border-emerald-800/70 font-bold transition-all text-xs lg:text-sm whitespace-nowrap"
                          >
                            <TrendingUp className="w-4 h-4 shrink-0" />
                            <span className="lg:hidden">پرونده و ارزیابی</span>
                            <span className="hidden lg:inline">مشاهده پرونده و ثبت ارزیابی</span>
                            <ChevronLeft className="w-4 h-4 shrink-0" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-3">
          <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">شناگری یافت نشد</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {selectedDay !== '' && visibleClasses.length === 0
              ? `در روز ${selectedDayName} کلاسی برای شما برنامه‌ریزی نشده است.`
              : 'شناگری مطابق فیلترهای انتخابی در کلاس‌های شما وجود ندارد.'}
          </p>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-200/70 dark:border-emerald-800/70 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              نمایش همه شناگران و روزها
            </button>
          )}
        </div>
      )}
    </div>
  );
};
