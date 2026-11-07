import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, User, MapPin, Download, Printer,
  FileSpreadsheet, ChevronLeft, ChevronRight, Filter,
  LayoutGrid, List, CheckCircle2, AlertCircle, XCircle,
  Users, RefreshCw, Eye, ArrowRight, ExternalLink,
  GraduationCap, BookOpen, Layers, X
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { Badge } from './Badge';
import { Modal } from './Modal';
import { Button } from './Button';
import { exportToCsv } from '../../utils/exportCsv';
import { useToast } from '../../context/ToastContext';

// Persian days of the week starting from Saturday (index 0)
const WEEKDAYS = [
  { index: 0, name: 'شنبه', short: 'ش' },
  { index: 1, name: 'یکشنبه', short: 'ی' },
  { index: 2, name: 'دوشنبه', short: 'د' },
  { index: 3, name: 'سه‌شنبه', short: 'س' },
  { index: 4, name: 'چهارشنبه', short: 'چ' },
  { index: 5, name: 'پنج‌شنبه', short: 'پ' },
  { index: 6, name: 'جمعه', short: 'ج' },
];

/**
 * Parse course days into array of weekday indices [0..6]
 */
export const parseCourseWeekdays = (course, allGroups = []) => {
  const weekdaysSet = new Set();

  // 1. Check schedules of groups belonging to this course
  const courseGroups = (course.groups && course.groups.length > 0)
    ? course.groups
    : allGroups.filter((g) => g.course === course.id || g.course_id === course.id);

  courseGroups.forEach((g) => {
    (g.schedules || []).forEach((sch) => {
      if (typeof sch.weekday === 'number') {
        weekdaysSet.add(sch.weekday);
      }
    });
  });

  // 2. Parse text in days_of_week
  if (weekdaysSet.size === 0 && course.days_of_week) {
    const text = course.days_of_week.toLowerCase();

    // Check for "فرد" (Odd days): Saturday(0), Monday(2), Wednesday(4)
    if (text.includes('فرد')) {
      weekdaysSet.add(0);
      weekdaysSet.add(2);
      weekdaysSet.add(4);
    }
    // Check for "زوج" (Even days): Sunday(1), Tuesday(3), Thursday(5)
    else if (text.includes('زوج')) {
      weekdaysSet.add(1);
      weekdaysSet.add(3);
      weekdaysSet.add(5);
    } else {
      if (text.includes('شنبه') && !text.includes('یکشنبه') && !text.includes('دوشنبه') && !text.includes('سه‌شنبه') && !text.includes('چهارشنبه') && !text.includes('پنج‌شنبه')) {
        weekdaysSet.add(0);
      }
      if (text.includes('یکشنبه')) weekdaysSet.add(1);
      if (text.includes('دوشنبه')) weekdaysSet.add(2);
      if (text.includes('سه‌شنبه')) weekdaysSet.add(3);
      if (text.includes('چهارشنبه')) weekdaysSet.add(4);
      if (text.includes('پنج‌شنبه')) weekdaysSet.add(5);
      if (text.includes('جمعه')) weekdaysSet.add(6);
    }
  }

  // Fallback if empty
  if (weekdaysSet.size === 0) {
    weekdaysSet.add(0);
    weekdaysSet.add(2);
    weekdaysSet.add(4);
  }

  return Array.from(weekdaysSet).sort((a, b) => a - b);
};

/**
 * Extract start and end time for a course
 */
export const getCourseTimeSlot = (course, allGroups = []) => {
  let start = course.start_time ? String(course.start_time).slice(0, 5) : '';
  let end = course.end_time ? String(course.end_time).slice(0, 5) : '';

  if (!start) {
    const courseGroups = (course.groups && course.groups.length > 0)
      ? course.groups
      : allGroups.filter((g) => g.course === course.id || g.course_id === course.id);

    for (const g of courseGroups) {
      if (g.schedules && g.schedules.length > 0) {
        start = String(g.schedules[0].start_time || '').slice(0, 5);
        end = String(g.schedules[0].end_time || '').slice(0, 5);
        if (start) break;
      }
    }
  }

  // Fallbacks if not set
  start = start || '17:00';
  end = end || (start === '17:00' ? '18:30' : '19:00');

  return {
    start,
    end,
    key: `${start}-${end}`,
    label: `${start} تا ${end}`,
  };
};

export const SessionsScheduleTimetable = ({
  courses = [],
  sessions = [],
  groups = [],
  coaches = [],
  onRefresh,
  onOpenCourseSwimmers,
}) => {
  const navigate = useNavigate();
  const toast = useToast();
  const printContainerRef = useRef(null);

  // States
  const [selectedPool, setSelectedPool] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExportingPng, setIsExportingPng] = useState(false);

  // Selected Course Modal State (برای مشاهده کلاس‌های این دوره)
  const [selectedCourseForModal, setSelectedCourseForModal] = useState(null);

  // Mobile layout state
  const [selectedMobileDay, setSelectedMobileDay] = useState(() => {
    const jsDay = new Date().getDay();
    return (jsDay + 1) % 7; // today's Persian weekday
  });
  const [mobileLayoutMode, setMobileLayoutMode] = useState('dayTimeline'); // 'dayTimeline' | 'matrixTable'

  // Extract distinct pool locations
  const poolLocations = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => c.pool_location && set.add(c.pool_location));
    groups.forEach((g) => g.pool_location && set.add(g.pool_location));
    return Array.from(set);
  }, [courses, groups]);

  // Prepared Course Items with parsed weekdays and times
  const scheduledCourses = useMemo(() => {
    return courses.map((course) => {
      const timeSlot = getCourseTimeSlot(course, groups);
      const weekdays = parseCourseWeekdays(course, groups);
      const courseGroups = (course.groups && course.groups.length > 0)
        ? course.groups
        : groups.filter((g) => g.course === course.id || g.course_id === course.id);

      return {
        ...course,
        timeSlot,
        weekdays,
        groups: courseGroups,
      };
    });
  }, [courses, groups]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return scheduledCourses.filter((c) => {
      if (selectedPool !== 'ALL' && c.pool_location !== selectedPool) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchName = c.name?.toLowerCase().includes(q);
        const matchAge = c.age_range?.toLowerCase().includes(q);
        const matchPool = c.pool_location?.toLowerCase().includes(q);
        if (!matchName && !matchAge && !matchPool) return false;
      }
      return true;
    });
  }, [scheduledCourses, selectedPool, searchTerm]);

  // Extract distinct unique Time Slots from courses
  const timeSlots = useMemo(() => {
    const slotMap = new Map();

    filteredCourses.forEach((c) => {
      const { start, end, key, label } = c.timeSlot;
      if (!slotMap.has(key)) {
        slotMap.set(key, {
          id: key,
          start,
          end,
          label,
        });
      }
    });

    // If no course slots, provide default swimming slots
    if (slotMap.size === 0) {
      return [
        { id: '08:00-09:30', start: '08:00', end: '09:30', label: '۰۸:۰۰ تا ۰۹:۳۰' },
        { id: '16:00-17:30', start: '16:00', end: '17:30', label: '۱۶:۰۰ تا ۱۷:۳۰' },
        { id: '17:00-18:30', start: '17:00', end: '18:30', label: '۱۷:۰۰ تا ۱۸:۳۰' },
        { id: '17:00-19:00', start: '17:00', end: '19:00', label: '۱۷:۰۰ تا ۱۹:۰۰' },
        { id: '18:30-20:00', start: '18:30', end: '20:00', label: '۱۸:۳۰ تا ۲۰:۰۰' },
      ];
    }

    return Array.from(slotMap.values()).sort((a, b) => a.start.localeCompare(b.start));
  }, [filteredCourses]);

  // Course Grid Matrix: matrix[timeSlotKey][weekdayIndex] -> array of courses
  const courseMatrix = useMemo(() => {
    const matrix = {};
    timeSlots.forEach((slot) => {
      matrix[slot.id] = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    });

    filteredCourses.forEach((c) => {
      const slotKey = c.timeSlot.key;
      let targetSlot = timeSlots.find((s) => s.id === slotKey);
      if (!targetSlot) {
        targetSlot = timeSlots.find((s) => s.start === c.timeSlot.start) || timeSlots[0];
      }

      if (targetSlot && matrix[targetSlot.id]) {
        c.weekdays.forEach((dayIdx) => {
          if (matrix[targetSlot.id][dayIdx]) {
            matrix[targetSlot.id][dayIdx].push(c);
          }
        });
      }
    });

    return matrix;
  }, [filteredCourses, timeSlots]);

  // Courses map by day for mobile view
  const dayCoursesMap = useMemo(() => {
    const map = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    filteredCourses.forEach((c) => {
      c.weekdays.forEach((dayIdx) => {
        if (map[dayIdx]) {
          map[dayIdx].push(c);
        }
      });
    });

    // Sort by start time
    Object.keys(map).forEach((dayKey) => {
      map[dayKey].sort((a, b) => a.timeSlot.start.localeCompare(b.timeSlot.start));
    });
    return map;
  }, [filteredCourses]);

  // Click handler for Course Card
  const handleCourseClick = (course) => {
    const courseGroups = course.groups || [];
    if (courseGroups.length === 1) {
      // If course has only 1 class, jump directly to its space
      navigate(`/admin/classes/${courseGroups[0].id}`);
    } else {
      // Open modal to view classes of this course
      setSelectedCourseForModal(course);
    }
  };

  // High-Resolution PNG Export
  const handleDownloadHighResPng = async () => {
    if (!printContainerRef.current) return;
    try {
      setIsExportingPng(true);
      toast.info('در حال تولید تصویر باکیفیت جدول دوره‌ها...');

      const dataUrl = await toPng(printContainerRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2.5,
        filter: (node) => !node.classList?.contains('no-export'),
      });

      const todayFa = new Intl.DateTimeFormat('fa-IR').format(new Date()).replace(/\//g, '-');
      const filename = `جدول-برنامه-هفتگی-دوره-های-استخر-${todayFa}.png`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();

      toast.success('تصویر باکیفیت جدول دوره‌ها با موفقیت دانلود شد.');
    } catch (err) {
      console.error('Export PNG failed:', err);
      toast.error('خطا در تولید تصویر جدول');
    } finally {
      setIsExportingPng(false);
    }
  };

  // Print timetable
  const handlePrint = () => {
    window.print();
  };

  // Export to CSV / Excel
  const handleExportCsv = () => {
    if (!filteredCourses.length) {
      toast.error('دوره‌ای برای خروجی اکسل وجود ندارد.');
      return;
    }

    const headers = {
      name: 'نام دوره آموزشی',
      age_range: 'رده سنی / سطح',
      days_of_week: 'روزهای برگزاری',
      time_slot: 'ساعت کلاس',
      pool_location: 'محل استخر',
      groups_count: 'تعداد کلاس‌ها / لاین‌ها',
      status: 'وضعیت دوره',
    };

    const rows = filteredCourses.map((c) => ({
      name: c.name || '—',
      age_range: c.age_range || 'عمومی',
      days_of_week: c.days_of_week || c.weekdays.map((w) => WEEKDAYS[w]?.name).join('، '),
      time_slot: c.timeSlot.label,
      pool_location: c.pool_location || 'استخر شهید رئیسی',
      groups_count: (c.groups?.length || c.coaches?.length || 0),
      status: c.status === 'ACTIVE' ? 'فعال' : c.status,
    }));

    const todayFa = new Intl.DateTimeFormat('fa-IR').format(new Date()).replace(/\//g, '-');
    exportToCsv(`برنامه-زمانی-دوره-های-استخر-${todayFa}`, rows, headers);
    toast.success('فایل اکسل دوره‌های آموزشی با موفقیت دانلود شد.');
  };

  return (
    <div className="space-y-4">
      {/* Print stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-schedule-root, #print-schedule-root * {
            visibility: visible;
          }
          #print-schedule-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 10px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Container Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors">
        
        {/* Top Header & Actions Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 sm:p-2.5 rounded-2xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800 shrink-0">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                  <span>جدول زمان‌بندی هفتگی دوره‌های آموزشی استخر</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300">
                    {filteredCourses.length} دوره فعال
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  برنامه سانس‌ها و روزهای دوره‌ها · با کلیک روی هر دوره، کلاس‌ها و لاین‌های آن را مشاهده کنید
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons: High-Res PNG, Print/PDF, Excel */}
          <div className="flex items-center gap-2 flex-wrap no-print">
            {/* Download High-Res PNG Button */}
            <button
              type="button"
              onClick={handleDownloadHighResPng}
              disabled={isExportingPng}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all cursor-pointer disabled:opacity-60"
              title="دانلود تصویر باکیفیت جدول دوره‌ها (مناسب اشتراک‌گذاری و پرینت)"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPng ? 'در حال آماده‌سازی...' : 'دانلود تصویر باکیفیت (PNG)'}</span>
            </button>

            {/* Print / PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="چاپ یا ذخیره به صورت PDF"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">چاپ / PDF</span>
            </button>

            {/* Excel / CSV Button */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="دریافت فایل اکسل دوره‌ها"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">خروجی اکسل</span>
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 pb-2 no-print text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Pool filter */}
            {poolLocations.length > 1 && (
              <select
                value={selectedPool}
                onChange={(e) => setSelectedPool(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-medium outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="ALL">همه استخرها / لاین‌ها</option>
                {poolLocations.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            )}

            {selectedPool !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedPool('ALL')}
                className="text-xs text-rose-600 hover:underline px-1 font-bold"
              >
                حذف فیلتر
              </button>
            )}
          </div>

          <div className="text-slate-400 text-[11px] font-mono">
            نکته: با کلیک روی هر دوره، فضای کلاس‌های اختصاصی هر مربی باز می‌شود
          </div>
        </div>

        {/* MOBILE MODE CONTROLS (< md) */}
        <div className="md:hidden pt-2 pb-2 space-y-2.5 no-print">
          {/* Mobile Layout Switcher: Day Timeline vs Full Matrix */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">نمایش موبایل:</span>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setMobileLayoutMode('dayTimeline')}
                className={`px-2 py-1 rounded-md font-bold transition-all ${
                  mobileLayoutMode === 'dayTimeline'
                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                روز انتخابی
              </button>
              <button
                type="button"
                onClick={() => setMobileLayoutMode('matrixTable')}
                className={`px-2 py-1 rounded-md font-bold transition-all ${
                  mobileLayoutMode === 'matrixTable'
                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                جدول کامل (اسکرول)
              </button>
            </div>
          </div>

          {/* Mobile Day Selector Pill Strip (visible in dayTimeline mode) */}
          {mobileLayoutMode === 'dayTimeline' && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {WEEKDAYS.map((day) => {
                const count = (dayCoursesMap[day.index] || []).length;
                const isSelected = selectedMobileDay === day.index;
                return (
                  <button
                    key={day.index}
                    type="button"
                    onClick={() => setSelectedMobileDay(day.index)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex flex-col items-center gap-0.5 cursor-pointer border ${
                      isSelected
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-extrabold">{day.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono mt-0.5 ${
                      isSelected
                        ? 'bg-sky-700 text-white'
                        : count > 0
                        ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 font-bold'
                        : 'bg-slate-200/80 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}>
                      {count} دوره
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Printable & Exportable Timetable Root */}
        <div id="print-schedule-root" ref={printContainerRef} className="mt-2 bg-white dark:bg-slate-900 rounded-2xl">
          
          {/* Header visible only in PNG & Print exports */}
          <div className="hidden print:block p-4 mb-3 border-b-2 border-slate-300 text-center space-y-1">
            <h2 className="text-xl font-black text-slate-900">مدرسه شنای ایران - جدول برنامه‌ریزی هفتگی دوره‌های آموزشی</h2>
            <p className="text-xs text-slate-600">
              تاریخ گزارش: {new Intl.DateTimeFormat('fa-IR', { dateStyle: 'full' }).format(new Date())}
            </p>
          </div>

          {/* MOBILE DAY TIMELINE VIEW (shown on mobile when dayTimeline mode is selected) */}
          <div className={`md:hidden ${mobileLayoutMode === 'dayTimeline' ? 'block' : 'hidden'} space-y-3 pt-1`}>
            <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-bold">
              <span>دوره‌های روز {WEEKDAYS.find((w) => w.index === selectedMobileDay)?.name}:</span>
              <span className="font-mono text-sky-600">{(dayCoursesMap[selectedMobileDay] || []).length} دوره فعال</span>
            </div>

            {(dayCoursesMap[selectedMobileDay] || []).length === 0 ? (
              <div className="text-center py-10 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-slate-400 text-xs space-y-1">
                <p className="font-bold">در این روز دوره‌ای برنامه‌ریزی نشده است.</p>
                <p className="text-[11px]">برای مشاهده سایر روزها، روز دیگری را از نوار بالا انتخاب نمایید.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(dayCoursesMap[selectedMobileDay] || []).map((course) => (
                  <div
                    key={course.id}
                    onClick={() => handleCourseClick(course)}
                    className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-sky-400 hover:shadow-md transition-all cursor-pointer space-y-3 active:scale-[0.99] group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 font-mono font-bold mb-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>ساعت {course.timeSlot.label}</span>
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-sky-600 transition-colors">
                          {course.name}
                        </h4>
                      </div>
                      {course.age_range && (
                        <Badge variant="teal" className="text-[10px] shrink-0">
                          {course.age_range}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{course.pool_location || 'استخر شهید رئیسی'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <GraduationCap className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span>{(course.groups?.length || course.coaches?.length || 0)} کلاس / لاین</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                      <span className="text-sky-600 dark:text-sky-400 font-bold flex items-center gap-1">
                        <span>مشاهده کلاس‌ها و مربیان دوره</span>
                        <span className="text-sm">←</span>
                      </span>
                      <span className="text-slate-400 text-[11px] font-mono">
                        {course.days_of_week || 'روزهای فرد'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TABLE MATRIX VIEW (Desktop, Tablet, or Mobile Matrix Mode) */}
          <div className={`overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs ${
            mobileLayoutMode === 'dayTimeline' ? 'hidden md:block' : 'block'
          }`}>
            <table className="w-full text-right border-collapse min-w-[700px] lg:min-w-[900px]">
              {/* Table Header: Days of the Week */}
              <thead>
                <tr className="bg-slate-100/95 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20">
                  {/* Ultra-compact Sticky Right Time Header in RTL */}
                  <th className="p-2 sm:p-2.5 text-center font-extrabold text-xs w-16 sm:w-20 border-l border-slate-200 dark:border-slate-700 sticky right-0 z-30 bg-slate-200/90 dark:bg-slate-800 shadow-xs">
                    <span className="text-slate-700 dark:text-slate-300">ساعت</span>
                  </th>

                  {/* 7 Days Columns */}
                  {WEEKDAYS.map((day) => (
                    <th
                      key={day.index}
                      className="p-3 text-center border-l last:border-l-0 border-slate-200 dark:border-slate-700 font-bold text-xs sm:text-sm"
                    >
                      <span>{day.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body: Time Slots as Rows */}
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                {timeSlots.map((slot) => (
                  <tr key={slot.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                    {/* Ultra-compact Sticky Right Column for Hour in RTL */}
                    <td className="p-2 text-center border-l border-slate-200 dark:border-slate-700 bg-slate-50/95 dark:bg-slate-800/90 sticky right-0 z-10 shadow-xs align-middle w-16 sm:w-20">
                      <div className="flex flex-col items-center justify-center font-mono leading-tight">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-100">{slot.start}</span>
                        <span className="text-[10px] text-slate-400 font-normal">تا</span>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{slot.end}</span>
                      </div>
                    </td>

                    {/* 7 Days cells */}
                    {WEEKDAYS.map((day) => {
                      const cellCourses = courseMatrix[slot.id]?.[day.index] || [];
                      const hasCourses = cellCourses.length > 0;

                      return (
                        <td
                          key={day.index}
                          className={`p-2 border-l last:border-l-0 border-slate-200/80 dark:border-slate-800 align-top transition-colors ${
                            hasCourses ? 'bg-sky-50/15 dark:bg-sky-950/10' : ''
                          }`}
                        >
                          {hasCourses ? (
                            <div className="space-y-2">
                              {cellCourses.map((course) => (
                                <div
                                  key={course.id}
                                  onClick={() => handleCourseClick(course)}
                                  className="p-2.5 rounded-xl bg-sky-50/80 hover:bg-sky-100/90 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 border border-sky-200/80 dark:border-sky-800 shadow-2xs hover:border-sky-400 hover:shadow-md hover:-translate-y-0.5 transition-all space-y-1.5 cursor-pointer group"
                                  title="کلیک برای مشاهده کلاس‌های این دوره"
                                >
                                  {/* Course Title & Age Badge */}
                                  <div className="flex items-start justify-between gap-1">
                                    <h4 className="font-extrabold text-xs text-sky-950 dark:text-sky-100 group-hover:text-sky-600 transition-colors leading-tight">
                                      {course.name}
                                    </h4>
                                    {course.age_range && (
                                      <Badge variant="teal" className="text-[9px] py-0 px-1 shrink-0">
                                        {course.age_range.split(' ')[0]}
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Pool location */}
                                  <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate">{course.pool_location || 'استخر شهید رئیسی'}</span>
                                  </div>

                                  {/* Classes count and Action arrow */}
                                  <div className="pt-1 border-t border-sky-100 dark:border-sky-800/60 flex items-center justify-between text-[10px]">
                                    <span className="text-slate-500 font-medium">
                                      {(course.groups?.length || course.coaches?.length || 0)} کلاس / لاین
                                    </span>
                                    <span className="text-sky-600 dark:text-sky-400 font-bold flex items-center gap-0.5 group-hover:translate-x-[-2px] transition-transform">
                                      <span>کلاس‌ها</span>
                                      <span>←</span>
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-16 flex items-center justify-center text-slate-300 dark:text-slate-700 text-xs font-mono select-none">
                              —
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer Summary */}
          <div className="pt-3.5 mt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              <span>هر کارت نشان‌دهنده یک دوره آموزشی فعال در آن روز و ساعت است. با کلیک بر روی آن، کلاس‌ها و لاین‌های تفکیک‌شده باز می‌شوند.</span>
            </div>
            <div className="text-left font-mono font-bold text-sky-600">
              {filteredCourses.length} دوره در جدول
            </div>
          </div>

        </div>
      </div>

      {/* MODAL: VIEW CLASSES OF SELECTED COURSE */}
      <Modal
        isOpen={Boolean(selectedCourseForModal)}
        onClose={() => setSelectedCourseForModal(null)}
        title={selectedCourseForModal ? `کلاس‌ها و لاین‌های: ${selectedCourseForModal.name}` : ''}
        maxWidth="max-w-2xl"
      >
        {selectedCourseForModal && (
          <div className="space-y-4">
            {/* Header summary of the course */}
            <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/70 dark:border-sky-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sky-900 dark:text-sky-200 text-sm">
                    {selectedCourseForModal.name}
                  </span>
                  <Badge variant="teal">{selectedCourseForModal.age_range || 'عمومی'}</Badge>
                </div>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>ساعت {selectedCourseForModal.timeSlot.label}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedCourseForModal.pool_location || 'استخر شهید رئیسی'}</span>
                  </span>
                </div>
              </div>

              {onOpenCourseSwimmers && (
                <Button
                  size="sm"
                  onClick={() => {
                    const c = selectedCourseForModal;
                    setSelectedCourseForModal(null);
                    onOpenCourseSwimmers(c);
                  }}
                  className="gap-1.5 text-xs bg-sky-600 hover:bg-sky-700 text-white shrink-0"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>شناگران دوره و تخصیص مربی</span>
                </Button>
              )}
            </div>

            {/* List of Classes */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>کلاس‌های تفکیکی این دوره (مربیان و لاین‌ها):</span>
                <span className="font-mono text-slate-400">
                  {(selectedCourseForModal.groups || []).length} کلاس
                </span>
              </h4>

              {(selectedCourseForModal.groups || []).length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60">
                  هنوز گروه کلاسی برای این دوره تعریف نشده است.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(selectedCourseForModal.groups || []).map((grp) => {
                    const coachName = grp.coach_assignments?.[0]?.coach_name || 'مربی مشخص نشده';
                    return (
                      <div
                        key={grp.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between gap-3 shadow-2xs hover:border-sky-400 transition-all"
                      >
                        <div className="space-y-1.5">
                          <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                            {grp.name}
                          </h5>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                            <User className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            <span>مربی: {coachName}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            ظرفیت: {grp.capacity} نفر ({grp.remaining_capacity || grp.capacity} جای خالی)
                          </div>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedCourseForModal(null);
                            navigate(`/admin/classes/${grp.id}`);
                          }}
                          className="w-full gap-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white"
                        >
                          <span>ورود به فضای کلاس</span>
                          <span>←</span>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCourseForModal(null)}
              >
                بستن
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
