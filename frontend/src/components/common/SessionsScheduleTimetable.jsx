import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, User, MapPin, Download, Printer,
  FileSpreadsheet, ChevronLeft, ChevronRight,
  BookOpen, GraduationCap, Users, ArrowRight,
  Layers, CheckCircle2, Search, ExternalLink
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { Badge } from './Badge';
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

  // Selected Day (0: Saturday ... 6: Friday, or 'ALL')
  const [selectedDay, setSelectedDay] = useState(() => {
    const jsDay = new Date().getDay();
    return (jsDay + 1) % 7; // today's Persian weekday
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

  // Courses grouped by day
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

  // Active courses for current selection
  const activeCourses = useMemo(() => {
    if (selectedDay === 'ALL') {
      return scheduledCourses;
    }
    return dayCoursesMap[selectedDay] || [];
  }, [selectedDay, scheduledCourses, dayCoursesMap]);

  // High-Resolution PNG Export
  const handleDownloadHighResPng = async () => {
    if (!printContainerRef.current) return;
    try {
      setIsExportingPng(true);
      toast.info('در حال تولید تصویر باکیفیت برنامه دوره‌ها...');

      const dataUrl = await toPng(printContainerRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2.5,
        filter: (node) => !node.classList?.contains('no-export'),
      });

      const todayFa = new Intl.DateTimeFormat('fa-IR').format(new Date()).replace(/\//g, '-');
      const filename = `برنامه-هفتگی-دوره-ها-${todayFa}.png`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();

      toast.success('تصویر برنامه هفتگی با موفقیت دانلود شد.');
    } catch (err) {
      console.error('Export PNG failed:', err);
      toast.error('خطا در تولید تصویر برنامه');
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
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="p-2 sm:p-2.5 rounded-2xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800 shrink-0">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
            </span>
            <div>
              <h2 className="font-black text-base sm:text-xl text-slate-900 dark:text-white leading-tight">
                برنامه هفتگی دوره‌های آموزشی استخر
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                مشاهده زمان‌بندی دوره‌ها، سانس‌های فعال و ورود مستقیم به کلاس‌های هر مربی
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 no-print self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleDownloadHighResPng}
              disabled={isExportingPng}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all cursor-pointer disabled:opacity-60"
              title="دانلود تصویر باکیفیت"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPng ? 'در حال تولید...' : 'دانلود تصویر'}</span>
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
            DAY SELECTOR TABS (شنبه تا جمعه) - Universal across Desktop, Tablet & Mobile
           ========================================================================= */}
        <div className="pt-4 pb-2 no-print">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 bg-slate-100 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200/70 dark:border-slate-700">
            {WEEKDAYS.map((day) => {
              const count = (dayCoursesMap[day.index] || []).length;
              const isSelected = selectedDay === day.index;
              return (
                <button
                  key={day.index}
                  type="button"
                  onClick={() => setSelectedDay(day.index)}
                  className={`py-2.5 sm:py-3 px-1 sm:px-3 rounded-xl font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-sm scale-101'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40'
                  }`}
                >
                  <span className="text-xs sm:text-sm sm:font-extrabold">{day.name}</span>
                  <span
                    className={`text-[10px] sm:text-xs px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isSelected
                        ? 'bg-sky-700/90 text-white'
                        : count > 0
                        ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300'
                        : 'bg-slate-200/70 dark:bg-slate-700 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Printable Root for Content */}
        <div id="print-schedule-root" ref={printContainerRef} className="pt-3">
          {/* Header visible only in PNG & Print exports */}
          <div className="hidden print:block p-4 mb-4 border-b-2 border-slate-300 text-center space-y-1">
            <h2 className="text-xl font-black text-slate-900">مدرسه شنای ایران - جدول برنامه‌ریزی هفتگی دوره‌های آموزشی</h2>
            <p className="text-xs text-slate-600">
              تاریخ صدور گزارش: {new Intl.DateTimeFormat('fa-IR', { dateStyle: 'full' }).format(new Date())}
            </p>
          </div>

          {/* Active Day Title & Stats Bar */}
          <div className="flex items-center justify-between px-1 pb-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                دوره‌های روز {WEEKDAYS.find((w) => w.index === selectedDay)?.name}
              </span>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-lg border border-sky-200/60 dark:border-sky-800">
                {activeCourses.length} دوره آموزشی
              </span>
            </div>

            <span className="text-slate-400 text-xs hidden sm:inline">
              برای مشاهده سایر روزها، روز مورد نظر را از نوار بالا انتخاب فرمایید
            </span>
          </div>

          {/* =========================================================================
              COURSES CARDS: Spacious, Responsive 2-Column Desktop & 1-Column Mobile
             ========================================================================= */}
          {activeCourses.length === 0 ? (
            <div className="text-center py-16 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-slate-400 text-xs sm:text-sm space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-700 dark:text-slate-300">
                در روز {WEEKDAYS.find((w) => w.index === selectedDay)?.name} دوره‌ای برنامه‌ریزی نشده است.
              </p>
              <p className="text-xs text-slate-400">
                برای مشاهده برنامه‌های آموزشی، یکی از روزهای دیگر هفته را از نوار بالا انتخاب فرمایید.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              {activeCourses.map((course) => (
                <div
                  key={course.id}
                  className="rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 p-5 sm:p-6 shadow-xs hover:border-sky-300 dark:hover:border-sky-600 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    {/* Time Pill & Metadata Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono font-bold text-xs sm:text-sm border border-amber-200/70 dark:border-amber-800">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>ساعت {course.timeSlot.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {course.age_range && (
                          <span className="text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 rounded-lg border border-sky-200/60 dark:border-sky-800">
                            {course.age_range}
                          </span>
                        )}
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1 rounded-lg">
                          {course.days_of_week || 'روزهای فرد'}
                        </span>
                      </div>
                    </div>

                    {/* Course Title & Pool Location */}
                    <div>
                      <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-snug">
                        {course.name}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{course.pool_location || 'استخر شهید رئیسی'}</span>
                        </span>
                        {course.sessions_count && (
                          <>
                            <span>•</span>
                            <span>طول دوره: {course.sessions_count} جلسه</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Embedded Classes & Coaches List */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4 text-sky-600" />
                          <span>کلاس‌ها و مربیان دوره ({(course.groups || []).length} کلاس):</span>
                        </span>
                        <span className="text-slate-400 text-[11px] font-mono">ظرفیت لاین: ۱۵ نفر</span>
                      </div>

                      {(course.groups || []).length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-1">کلاسی برای این دوره تعریف نشده است.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(course.groups || []).map((grp) => {
                            const coachName = grp.coach_assignments?.[0]?.coach_name || grp.name;
                            return (
                              <div
                                key={grp.id}
                                onClick={() => navigate(`/admin/classes/${grp.id}`)}
                                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/50 hover:bg-sky-50 dark:hover:bg-slate-700 border border-slate-200/70 dark:border-slate-600 hover:border-sky-400 transition-all cursor-pointer group/grp active:scale-[0.99]"
                                title="ورود به فضای این کلاس"
                              >
                                <div className="space-y-0.5">
                                  <div className="font-bold text-xs text-slate-900 dark:text-white group-hover/grp:text-sky-600 transition-colors">
                                    {grp.name}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono">
                                    ظرفیت: {grp.capacity} نفر ({grp.remaining_capacity || grp.capacity} خالی)
                                  </div>
                                </div>

                                <span className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1 group-hover/grp:translate-x-[-2px] transition-transform shrink-0">
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

                  {/* Card Bottom Action */}
                  {onOpenCourseSwimmers && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => onOpenCourseSwimmers(course)}
                        className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>مشاهده کل شناگران دوره و تخصیص مربی ←</span>
                      </button>

                      <span className="text-slate-400 font-mono text-[11px]">
                        {(course.groups || []).length} لاین فعال
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Footer Info */}
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              <span>برای ورود به فضای اختصاصی هر کلاس و مشاهده حضور و غیاب، روی کارت همان کلاس کلیک کنید.</span>
            </div>
            <div className="font-mono font-bold text-sky-600">
              {scheduledCourses.length} دوره آموزشی در برنامه هفتگی
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
