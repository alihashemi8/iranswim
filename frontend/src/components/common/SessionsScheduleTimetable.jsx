import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, Download, Printer,
  BookOpen, GraduationCap, Users, ArrowRight,
  User, Eye, DollarSign, Sparkles, CheckCircle2
} from 'lucide-react';
import { toPng } from 'html-to-image';
import api from '../../api/client';
import { Badge } from './Badge';
import { Modal } from './Modal';
import { Button } from './Button';
import { LoadingState } from './LoadingState';
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
}) => {
  const navigate = useNavigate();
  const toast = useToast();
  const printContainerRef = useRef(null);

  // States
  const [isExportingPng, setIsExportingPng] = useState(false);

  // Selected Day (0: Saturday ... 6: Friday)
  const [selectedDay, setSelectedDay] = useState(() => {
    const jsDay = new Date().getDay();
    return (jsDay + 1) % 7; // today's Persian weekday
  });

  // Selected Course Space State (فضای اختصاصی دوره با یک کلیک)
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseEnrollments, setCourseEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [courseSpaceTab, setCourseSpaceTab] = useState('classes'); // 'classes' | 'swimmers' | 'info'

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

  // Active courses for current selected day
  const activeCourses = useMemo(() => {
    return dayCoursesMap[selectedDay] || [];
  }, [selectedDay, dayCoursesMap]);

  // Click on a course card -> opens the complete Course Space
  const handleCourseClick = async (course) => {
    setSelectedCourse(course);
    setCourseSpaceTab('classes');
    setLoadingEnrollments(true);
    try {
      const res = await api.get(`/education/enrollments/?course_id=${course.id}`);
      setCourseEnrollments(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
      setCourseEnrollments([]);
    } finally {
      setLoadingEnrollments(false);
    }
  };

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
        
        {/* Header Bar */}
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
                زمان‌بندی دوره‌ها · با کلیک روی هر کارت، وارد فضای اختصاصی دوره و کلاس‌های آن شوید
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
              className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="چاپ برنامه"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day Selector Tabs (شنبه تا جمعه) */}
        <div className="pt-3 pb-2 no-print">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 bg-slate-100 dark:bg-slate-800/90 p-1 sm:p-1.5 rounded-2xl border border-slate-200/70 dark:border-slate-700">
            {WEEKDAYS.map((day) => {
              const count = (dayCoursesMap[day.index] || []).length;
              const isSelected = selectedDay === day.index;
              return (
                <button
                  key={day.index}
                  type="button"
                  onClick={() => setSelectedDay(day.index)}
                  className={`py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40'
                  }`}
                >
                  <span className="text-xs sm:text-sm font-extrabold">{day.name}</span>
                  <span
                    className={`text-[10px] sm:text-xs px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isSelected
                        ? 'bg-sky-700 text-white'
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

        {/* Printable Content Root */}
        <div id="print-schedule-root" ref={printContainerRef} className="pt-2">
          {/* Header visible only in PNG & Print exports */}
          <div className="hidden print:block p-4 mb-4 border-b-2 border-slate-300 text-center space-y-1">
            <h2 className="text-xl font-black text-slate-900">مدرسه شنای ایران - جدول برنامه‌ریزی هفتگی دوره‌های آموزشی</h2>
            <p className="text-xs text-slate-600">
              تاریخ صدور گزارش: {new Intl.DateTimeFormat('fa-IR', { dateStyle: 'full' }).format(new Date())}
            </p>
          </div>

          {/* Active Day Header */}
          <div className="flex items-center justify-between px-1 pb-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                دوره‌های روز {WEEKDAYS.find((w) => w.index === selectedDay)?.name}
              </span>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-lg border border-sky-200/60 dark:border-sky-800">
                {activeCourses.length} دوره
              </span>
            </div>

            <span className="text-slate-400 text-xs hidden sm:inline">
              روی هر کارت کلیک کنید تا فضای اختصاصی دوره و کلاس‌های آن باز شود
            </span>
          </div>

          {/* =========================================================================
              CLEAN CARDS: ONLY (اسم دوره، اسم استخر، روز، ساعت)
             ========================================================================= */}
          {activeCourses.length === 0 ? (
            <div className="text-center py-14 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-slate-400 text-xs sm:text-sm space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-700 dark:text-slate-300">
                در روز {WEEKDAYS.find((w) => w.index === selectedDay)?.name} دوره‌ای برنامه‌ریزی نشده است.
              </p>
              <p className="text-xs text-slate-400">
                برای مشاهده برنامه‌ها، روز دیگری را از نوار بالا انتخاب فرمایید.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {activeCourses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => handleCourseClick(course)}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 shadow-xs hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between gap-3 active:scale-[0.99]"
                >
                  <div className="space-y-2.5">
                    {/* ۱. ساعت و ۲. روز */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
                      {/* ساعت */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-mono font-bold text-xs border border-sky-200/60 dark:border-sky-800">
                        <Clock className="w-3.5 h-3.5 text-sky-600" />
                        <span>ساعت {course.timeSlot.label}</span>
                      </div>

                      {/* روز */}
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1 rounded-lg">
                        {course.days_of_week || 'روزهای فرد'}
                      </span>
                    </div>

                    {/* ۳. اسم دوره */}
                    <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors leading-snug">
                      {course.name}
                    </h3>
                  </div>

                  {/* ۴. اسم استخر و راهنمای کلیک */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400">
                    {/* اسم استخر */}
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">{course.pool_location || 'استخر شهید رئیسی'}</span>
                    </div>

                    {/* کلیک برای ورود به فضای دوره */}
                    <span className="text-sky-600 dark:text-sky-400 font-bold group-hover:translate-x-[-2px] transition-transform text-[11px] shrink-0">
                      فضای دوره ←
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer Info */}
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              <span>با کلیک بر روی هر کارت، فضای اختصاصی دوره شامل کلاس‌ها، لاین‌ها و شناگران باز می‌شود.</span>
            </div>
            <div className="font-mono font-bold text-sky-600">
              {scheduledCourses.length} دوره آموزشی در سامانه
            </div>
          </div>
        </div>

      </div>

      {/* =========================================================================
          COURSE SPACE MODAL: فضای اختصاصی دوره با یک کلیک
         ========================================================================= */}
      <Modal
        isOpen={Boolean(selectedCourse)}
        onClose={() => setSelectedCourse(null)}
        title={selectedCourse ? `فضای اختصاصی دوره: ${selectedCourse.name}` : ''}
        maxWidth="max-w-3xl"
      >
        {selectedCourse && (
          <div className="space-y-4">
            {/* Course Header Banner */}
            <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/70 dark:border-sky-800 text-xs space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-base text-sky-900 dark:text-sky-200">
                    {selectedCourse.name}
                  </h3>
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1 font-mono font-bold">
                      <Clock className="w-3.5 h-3.5 text-sky-600" />
                      <span>{selectedCourse.timeSlot.label}</span>
                    </span>
                    <span>•</span>
                    <span className="font-semibold">{selectedCourse.days_of_week || 'روزهای فرد'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedCourse.pool_location || 'استخر شهید رئیسی'}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  {selectedCourse.age_range && (
                    <Badge variant="teal">{selectedCourse.age_range}</Badge>
                  )}
                  {selectedCourse.status && (
                    <Badge variant={selectedCourse.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {selectedCourse.status === 'ACTIVE' ? 'فعال' : selectedCourse.status}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Course Space Tabs: Classes | Swimmers | Details */}
            <div className="grid grid-cols-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/70 dark:border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => setCourseSpaceTab('classes')}
                className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  courseSpaceTab === 'classes'
                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>کلاس‌ها و لاین‌ها ({(selectedCourse.groups || []).length})</span>
              </button>

              <button
                type="button"
                onClick={() => setCourseSpaceTab('swimmers')}
                className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  courseSpaceTab === 'swimmers'
                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>شناگران ثبت‌نام‌شده ({courseEnrollments.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setCourseSpaceTab('info')}
                className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  courseSpaceTab === 'info'
                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>مشخصات کامل دوره</span>
              </button>
            </div>

            {/* TAB 1: CLASSES OF THIS COURSE */}
            {courseSpaceTab === 'classes' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    کلاس‌های تفکیکی مربیان در این دوره:
                  </span>
                  <span>برای ورود به صفحه کلاس، دکمه ورود را انتخاب نمایید</span>
                </div>

                {(selectedCourse.groups || []).length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60">
                    هنوز کلاسی برای این دوره تعریف نشده است.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto p-0.5">
                    {(selectedCourse.groups || []).map((grp) => {
                      const coachName = grp.coach_assignments?.[0]?.coach_name || 'مربی مشخص نشده';
                      return (
                        <div
                          key={grp.id}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between gap-3 shadow-2xs hover:border-sky-400 transition-all"
                        >
                          <div className="space-y-1">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                              {grp.name}
                            </h4>
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                              <User className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                              <span>مربی: {coachName}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              ظرفیت لاین: {grp.capacity} نفر ({grp.remaining_capacity || grp.capacity} جای خالی)
                            </div>
                          </div>

                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedCourse(null);
                              navigate(`/admin/classes/${grp.id}`);
                            }}
                            className="w-full gap-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white"
                          >
                            <span>ورود به فضای اختصاصی کلاس</span>
                            <span>←</span>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ENROLLED SWIMMERS */}
            {courseSpaceTab === 'swimmers' && (
              <div className="space-y-3">
                {loadingEnrollments ? (
                  <LoadingState type="cards" count={2} message="در حال دریافت شناگران دوره..." />
                ) : courseEnrollments.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60">
                    شناگری در این دوره ثبت‌نام نکرده است.
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[50vh] rounded-2xl border border-slate-200/70 dark:border-slate-800">
                    <table className="w-full text-xs text-right min-w-[550px]">
                      <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="py-2.5 px-3">شناگر</th>
                          <th className="py-2.5 px-3">کلاس تخصیصی</th>
                          <th className="py-2.5 px-3">مربی</th>
                          <th className="py-2.5 px-3">جلسات</th>
                          <th className="py-2.5 px-3">وضعیت</th>
                          <th className="py-2.5 px-3 text-center">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {courseEnrollments.map((enr) => (
                          <tr key={enr.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                              {enr.swimmer_name}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                              {enr.group_name || 'بدون کلاس'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                              {enr.coach_name || '—'}
                            </td>
                            <td className="py-2.5 px-3 font-mono">
                              {enr.sessions_attended} از {enr.sessions_purchased}
                            </td>
                            <td className="py-2.5 px-3">
                              <Badge variant={enr.status === 'ACTIVE' ? 'success' : 'neutral'}>
                                {enr.status === 'ACTIVE' ? 'فعال' : enr.status}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCourse(null);
                                  navigate(`/admin/swimmers/${enr.swimmer}`);
                                }}
                                className="px-2 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold hover:underline"
                              >
                                پرونده
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: COURSE FULL INFO */}
            {courseSpaceTab === 'info' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 space-y-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block border-b pb-1.5">
                    مشخصات مالی و ثبت‌نام
                  </span>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">شهریه هر شناگر:</span>
                    <span className="font-bold font-mono">{Number(selectedCourse.base_price || 0).toLocaleString('fa-IR')} تومان</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">تعداد جلسات دوره:</span>
                    <span className="font-bold font-mono">{selectedCourse.sessions_count || 12} جلسه</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">شرایط پرداخت:</span>
                    <span>{selectedCourse.installments_count > 1 ? `تا ${selectedCourse.installments_count} قسط` : 'یکجا'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 space-y-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block border-b pb-1.5">
                    مشخصات برگزاری
                  </span>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">محل برگزاری:</span>
                    <span className="font-bold">{selectedCourse.pool_location}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">روزها:</span>
                    <span>{selectedCourse.days_of_week}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">ساعت سانس:</span>
                    <span className="font-mono">{selectedCourse.timeSlot.label}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const cId = selectedCourse.id;
                  setSelectedCourse(null);
                  navigate(`/admin/courses/${cId}`);
                }}
                className="gap-1.5 text-xs bg-sky-600 hover:bg-sky-700 text-white"
              >
                <Users className="w-3.5 h-3.5" />
                <span>صفحه جامع دوره و شناگران</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCourse(null)}
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
