import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, User, MapPin, Download, Printer,
  FileSpreadsheet, ChevronLeft, ChevronRight,
  BookOpen, GraduationCap, Users, ArrowLeft, ArrowRight,
  ExternalLink, Layers, CheckCircle2
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

    // "فرد" (Odd days): Saturday(0), Monday(2), Wednesday(4)
    if (text.includes('فرد')) {
      weekdaysSet.add(0);
      weekdaysSet.add(2);
      weekdaysSet.add(4);
    }
    // "زوج" (Even days): Sunday(1), Tuesday(3), Thursday(5)
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

  // Fallback if empty: شنبه، دوشنبه، چهارشنبه
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

  start = start || '17:00';
  end = end || (start === '17:00' ? '18:30' : '19:00');

  return {
    start,
    end,
    key: `${start}-${end}`,
    label: `${start} الی ${end}`,
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
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [selectedCourseForModal, setSelectedCourseForModal] = useState(null);

  // Mobile active day: default to today's Persian weekday
  const [selectedMobileDay, setSelectedMobileDay] = useState(() => {
    const jsDay = new Date().getDay();
    return (jsDay + 1) % 7;
  });

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

  // Extract distinct unique Time Slots from courses
  const timeSlots = useMemo(() => {
    const slotMap = new Map();

    scheduledCourses.forEach((c) => {
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

    if (slotMap.size === 0) {
      return [
        { id: '08:00-09:30', start: '08:00', end: '09:30', label: '۰۸:۰۰ الی ۰۹:۳۰' },
        { id: '16:00-17:30', start: '16:00', end: '17:30', label: '۱۶:۰۰ الی ۱۷:۳۰' },
        { id: '17:00-18:30', start: '17:00', end: '18:30', label: '۱۷:۰۰ الی ۱۸:۳۰' },
        { id: '17:00-19:00', start: '17:00', end: '19:00', label: '۱۷:۰۰ الی ۱۹:۰۰' },
        { id: '18:30-20:00', start: '18:30', end: '20:00', label: '۱۸:۳۰ الی ۲۰:۰۰' },
      ];
    }

    return Array.from(slotMap.values()).sort((a, b) => a.start.localeCompare(b.start));
  }, [scheduledCourses]);

  // Course Grid Matrix: matrix[timeSlotKey][weekdayIndex] -> array of courses
  const courseMatrix = useMemo(() => {
    const matrix = {};
    timeSlots.forEach((slot) => {
      matrix[slot.id] = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    });

    scheduledCourses.forEach((c) => {
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
  }, [scheduledCourses, timeSlots]);

  // Courses grouped by day for mobile view
  const dayCoursesMap = useMemo(() => {
    const map = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    scheduledCourses.forEach((c) => {
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
  }, [scheduledCourses]);

  // Click handler for Course Card
  const handleCourseClick = (course) => {
    const courseGroups = course.groups || [];
    if (courseGroups.length === 1) {
      navigate(`/admin/classes/${courseGroups[0].id}`);
    } else {
      setSelectedCourseForModal(course);
    }
  };

  // High-Resolution PNG Export
  const handleDownloadHighResPng = async () => {
    if (!printContainerRef.current) return;
    try {
      setIsExportingPng(true);
      toast.info('در حال تولید تصویر باکیفیت جدول...');

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

      toast.success('تصویر جدول زمان‌بندی با موفقیت دانلود شد.');
    } catch (err) {
      console.error('Export PNG failed:', err);
      toast.error('خطا در تولید تصویر جدول');
    } finally {
      setIsExportingPng(false);
    }
  };

  // Print
  const handlePrint = () => {
    window.print();
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
        
        {/* Clean Header Bar */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 sm:p-2.5 rounded-2xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800 shrink-0">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
            </span>
            <div>
              <h2 className="font-black text-base sm:text-xl text-slate-900 dark:text-white leading-tight">
                برنامه هفتگی دوره‌های آموزشی استخر
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                زمان‌بندی سانس‌ها و لاین‌های استخر به تفکیک روز و ساعت
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 no-print shrink-0">
            <button
              type="button"
              onClick={handleDownloadHighResPng}
              disabled={isExportingPng}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all cursor-pointer disabled:opacity-60"
              title="دانلود تصویر باکیفیت"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{isExportingPng ? 'در حال تولید...' : 'دانلود تصویر'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
              title="چاپ برنامه"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            MOBILE LAYOUT (< md): Ergonomic, Native-Feeling Day Timeline
           ========================================================================= */}
        <div className="block md:hidden pt-3 space-y-4">
          {/* Day Selector Pill Strip */}
          <div className="grid grid-cols-7 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/70 dark:border-slate-700">
            {WEEKDAYS.map((day) => {
              const count = (dayCoursesMap[day.index] || []).length;
              const isSelected = selectedMobileDay === day.index;
              return (
                <button
                  key={day.index}
                  type="button"
                  onClick={() => setSelectedMobileDay(day.index)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <span>{day.short}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isSelected
                      ? 'bg-white'
                      : count > 0
                      ? 'bg-sky-500'
                      : 'bg-transparent'
                  }`} />
                </button>
              );
            })}
          </div>

          {/* Active Day Header */}
          <div className="flex items-center justify-between px-1">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>دوره‌های روز</span>
              <span className="text-sky-600 dark:text-sky-400">{WEEKDAYS.find((w) => w.index === selectedMobileDay)?.name}:</span>
            </h3>
            <span className="text-xs font-mono text-slate-500">
              {(dayCoursesMap[selectedMobileDay] || []).length} دوره فعال
            </span>
          </div>

          {/* Mobile Courses List for Selected Day */}
          {(dayCoursesMap[selectedMobileDay] || []).length === 0 ? (
            <div className="text-center py-12 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-slate-400 text-xs space-y-1">
              <p className="font-bold">در این روز دوره‌ای برنامه‌ریزی نشده است.</p>
              <p className="text-[11px] text-slate-400">یکی دیگر از روزهای هفته را از نوار بالا لمس کنید.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(dayCoursesMap[selectedMobileDay] || []).map((course) => (
                <div
                  key={course.id}
                  className="rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 p-4 shadow-xs space-y-3"
                >
                  {/* Card Header: Time & Badges */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono font-bold text-xs border border-amber-200/70 dark:border-amber-800">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>{course.timeSlot.label}</span>
                    </div>

                    {course.age_range && (
                      <span className="text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-0.5 rounded-lg border border-sky-200/60 dark:border-sky-800">
                        {course.age_range}
                      </span>
                    )}
                  </div>

                  {/* Course Title & Location */}
                  <div>
                    <h4 className="font-black text-base text-slate-900 dark:text-white leading-snug">
                      {course.name}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{course.pool_location || 'استخر شهید رئیسی'}</span>
                      <span>•</span>
                      <span>{course.days_of_week || 'روزهای فرد'}</span>
                    </div>
                  </div>

                  {/* Classes of this course embedded directly into mobile card */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      کلاس‌ها و لاین‌های فعال ({(course.groups || []).length} کلاس):
                    </span>

                    {(course.groups || []).length === 0 ? (
                      <p className="text-xs text-slate-400 italic">کلاسی برای این دوره تعریف نشده است.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {(course.groups || []).map((grp) => {
                          const coachName = grp.coach_assignments?.[0]?.coach_name || grp.name;
                          return (
                            <div
                              key={grp.id}
                              onClick={() => navigate(`/admin/classes/${grp.id}`)}
                              className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-700/50 hover:bg-sky-50 dark:hover:bg-slate-700 border border-slate-200/70 dark:border-slate-600 transition-all cursor-pointer active:scale-[0.99]"
                            >
                              <div className="space-y-0.5">
                                <span className="font-bold text-xs text-slate-900 dark:text-white block">
                                  {grp.name}
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono">
                                  ظرفیت: {grp.capacity} نفر ({grp.remaining_capacity || grp.capacity} خالی)
                                </span>
                              </div>

                              <span className="text-sky-600 dark:text-sky-400 font-bold text-xs flex items-center gap-1">
                                <span>ورود</span>
                                <span className="text-sm">←</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* =========================================================================
            DESKTOP & TABLET LAYOUT (>= md): Elegant Timetable Grid
           ========================================================================= */}
        <div id="print-schedule-root" ref={printContainerRef} className="hidden md:block pt-3">
          {/* Header visible only in PNG & Print exports */}
          <div className="hidden print:block p-4 mb-3 border-b-2 border-slate-300 text-center space-y-1">
            <h2 className="text-xl font-black text-slate-900">مدرسه شنای ایران - جدول برنامه‌ریزی هفتگی دوره‌های آموزشی</h2>
            <p className="text-xs text-slate-600">
              تاریخ گزارش: {new Intl.DateTimeFormat('fa-IR', { dateStyle: 'full' }).format(new Date())}
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <table className="w-full text-right border-collapse table-fixed min-w-[760px]">
              {/* Table Header: Days of the Week */}
              <thead>
                <tr className="bg-slate-100/95 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                  {/* Ultra-compact Time Column in RTL */}
                  <th className="p-2 text-center font-extrabold text-xs w-20 border-l border-slate-200 dark:border-slate-700 bg-slate-200/80 dark:bg-slate-800">
                    <span>ساعت</span>
                  </th>

                  {/* 7 Days Columns */}
                  {WEEKDAYS.map((day) => (
                    <th
                      key={day.index}
                      className="p-3 text-center border-l last:border-l-0 border-slate-200 dark:border-slate-700 font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-200"
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
                    {/* Ultra-compact Time Column in RTL */}
                    <td className="p-2 text-center border-l border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 align-middle w-20">
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
                                  className="p-3 rounded-2xl bg-sky-50/80 hover:bg-sky-100/90 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 border border-sky-200/80 dark:border-sky-800 shadow-2xs hover:border-sky-400 hover:shadow-md hover:-translate-y-0.5 transition-all space-y-1.5 cursor-pointer group"
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
          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              <span>با کلیک بر روی هر دوره، کلاس‌ها و لاین‌های تفکیک‌شده مربیان باز می‌شوند.</span>
            </div>
            <div className="font-mono font-bold text-sky-600">
              {scheduledCourses.length} دوره آموزشی در برنامه
            </div>
          </div>
        </div>

      </div>

      {/* MODAL: VIEW CLASSES OF SELECTED COURSE (Desktop Modal) */}
      <Modal
        isOpen={Boolean(selectedCourseForModal)}
        onClose={() => setSelectedCourseForModal(null)}
        title={selectedCourseForModal ? `کلاس‌های دوره: ${selectedCourseForModal.name}` : ''}
        maxWidth="max-w-xl"
      >
        {selectedCourseForModal && (
          <div className="space-y-4">
            {/* Header summary of the course */}
            <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/70 dark:border-sky-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-sky-900 dark:text-sky-200 text-sm">
                  {selectedCourseForModal.name}
                </span>
                <Badge variant="teal">{selectedCourseForModal.age_range || 'عمومی'}</Badge>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-xs">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedCourseForModal.timeSlot.label}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedCourseForModal.pool_location || 'استخر شهید رئیسی'}</span>
                </span>
              </div>
            </div>

            {/* List of Classes */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>کلاس‌ها و لاین‌های تفکیک‌شده:</span>
                <span className="font-mono text-slate-400">
                  {(selectedCourseForModal.groups || []).length} کلاس
                </span>
              </h4>

              {(selectedCourseForModal.groups || []).length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60">
                  هنوز گروه کلاسی برای این دوره تعریف نشده است.
                </div>
              ) : (
                <div className="space-y-2">
                  {(selectedCourseForModal.groups || []).map((grp) => {
                    const coachName = grp.coach_assignments?.[0]?.coach_name || 'مربی مشخص نشده';
                    return (
                      <div
                        key={grp.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3 shadow-2xs hover:border-sky-400 transition-all"
                      >
                        <div className="space-y-0.5">
                          <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {grp.name}
                          </h5>
                          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                              <span>مربی: {coachName}</span>
                            </span>
                            <span className="font-mono text-[11px] text-slate-400">
                              ظرفیت: {grp.capacity} نفر ({grp.remaining_capacity || grp.capacity} خالی)
                            </span>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedCourseForModal(null);
                            navigate(`/admin/classes/${grp.id}`);
                          }}
                          className="gap-1 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shrink-0"
                        >
                          <span>ورود به کلاس</span>
                          <span>←</span>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              {onOpenCourseSwimmers ? (
                <button
                  type="button"
                  onClick={() => {
                    const c = selectedCourseForModal;
                    setSelectedCourseForModal(null);
                    onOpenCourseSwimmers(c);
                  }}
                  className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>مشاهده کلیه شناگران دوره و تخصیص مربی ←</span>
                </button>
              ) : <div />}

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
