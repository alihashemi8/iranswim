import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, User, MapPin, Download, Printer,
  FileSpreadsheet, ChevronLeft, ChevronRight, Filter,
  LayoutGrid, List, CheckCircle2, AlertCircle, XCircle,
  Users, RefreshCw, Eye, ArrowLeft, ArrowRight, ExternalLink,
  ChevronDown, Smartphone, Monitor
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { Badge } from './Badge';
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

// Standard pool time slots (سانس‌های استاندارد استخر)
const DEFAULT_TIME_SLOTS = [
  { id: '08:00', label: '۰۸:۰۰ الی ۰۹:۳۰', start: '08:00', end: '09:30', period: 'صبحگاهی اول' },
  { id: '09:30', label: '۰۹:۳۰ الی ۱۱:۰۰', start: '09:30', end: '11:00', period: 'صبحگاهی دوم' },
  { id: '11:00', label: '۱۱:۰۰ الی ۱۲:۳۰', start: '11:00', end: '12:30', period: 'ظهر' },
  { id: '15:30', label: '۱۵:۳۰ الی ۱۷:۰۰', start: '15:30', end: '17:00', period: 'بعدازظهر' },
  { id: '17:00', label: '۱۷:۰۰ الی ۱۸:۳۰', start: '17:00', end: '18:30', period: 'عصر اول' },
  { id: '17:00_long', label: '۱۷:۰۰ الی ۱۹:۰۰', start: '17:00', end: '19:00', period: 'عصر ویژه' },
  { id: '18:30', label: '۱۸:۳۰ الی ۲۰:۰۰', start: '18:30', end: '20:00', period: 'عصر دوم' },
  { id: '20:00', label: '۲۰:۰۰ الی ۲۱:۳۰', start: '20:00', end: '21:30', period: 'شبانه' },
];

/**
 * Get weekday index (0 for Saturday ... 6 for Friday) from date string (YYYY-MM-DD)
 */
export const getWeekdayFromDateStr = (dateStr) => {
  if (!dateStr) return 0;
  try {
    const parts = dateStr.split('-');
    if (parts.length < 3) return 0;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const jsDay = d.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
    return (jsDay + 1) % 7;
  } catch {
    return 0;
  }
};

/**
 * Format date string to Persian locale
 */
export const formatFaDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('fa-IR', { month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

/**
 * Calculate dates for the week of a reference date (starts on Saturday)
 */
export const getWeekDates = (refDate = new Date()) => {
  const d = new Date(refDate);
  const jsDay = d.getDay(); // 0: Sun, ..., 6: Sat
  const offsetToSat = (jsDay + 1) % 7; // days passed since Saturday
  
  const saturday = new Date(d);
  saturday.setDate(d.getDate() - offsetToSat);

  const week = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(saturday);
    day.setDate(saturday.getDate() + i);
    const isoStr = day.toISOString().split('T')[0];
    week.push({
      weekdayIndex: i,
      isoDate: isoStr,
      faLabel: day.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' }),
      isToday: day.toDateString() === new Date().toDateString(),
    });
  }
  return week;
};

export const SessionsScheduleTimetable = ({
  sessions = [],
  groups = [],
  coaches = [],
  onRefresh,
}) => {
  const navigate = useNavigate();
  const toast = useToast();
  const printContainerRef = useRef(null);

  // States
  const [viewMode, setViewMode] = useState('grid'); // 'grid' (روز در ساعت) | 'list' (فهرستی)
  const [weekScope, setWeekScope] = useState('ALL'); // 'ALL' (الگوی کلی هفتگی) | 'CURRENT_WEEK' (هفته انتخابی)
  const [weekOffset, setWeekOffset] = useState(0); // weeks from now
  const [selectedCoach, setSelectedCoach] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPool, setSelectedPool] = useState('ALL');
  const [isExportingPng, setIsExportingPng] = useState(false);

  // Mobile layout state
  const [selectedMobileDay, setSelectedMobileDay] = useState(() => {
    // default to today's weekday in Iranian calendar
    const jsDay = new Date().getDay();
    return (jsDay + 1) % 7;
  });
  const [mobileLayoutMode, setMobileLayoutMode] = useState('dayTimeline'); // 'dayTimeline' | 'matrixTable'

  // Calculate current week reference based on weekOffset
  const currentWeekDays = useMemo(() => {
    const refDate = new Date();
    refDate.setDate(refDate.getDate() + weekOffset * 7);
    return getWeekDates(refDate);
  }, [weekOffset]);

  // Extract distinct pool locations
  const poolLocations = useMemo(() => {
    const set = new Set();
    sessions.forEach((s) => s.pool_location && set.add(s.pool_location));
    groups.forEach((g) => g.pool_location && set.add(g.pool_location));
    return Array.from(set);
  }, [sessions, groups]);

  // Extract distinct coaches
  const availableCoaches = useMemo(() => {
    const map = new Map();
    sessions.forEach((s) => {
      if (s.coach && s.coach_name) map.set(s.coach, s.coach_name);
    });
    coaches.forEach((c) => {
      const name = c.user?.first_name ? `${c.user.first_name} ${c.user.last_name}` : c.full_name || `مربی #${c.id}`;
      map.set(c.id, name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [sessions, coaches]);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    let result = sessions;

    // Scope filter (Current week vs All)
    if (weekScope === 'CURRENT_WEEK') {
      const weekDatesSet = new Set(currentWeekDays.map((d) => d.isoDate));
      result = result.filter((s) => weekDatesSet.has(s.session_date));
    }

    // Coach filter
    if (selectedCoach !== 'ALL') {
      result = result.filter((s) => String(s.coach) === String(selectedCoach));
    }

    // Status filter
    if (selectedStatus !== 'ALL') {
      result = result.filter((s) => s.status === selectedStatus);
    }

    // Pool location filter
    if (selectedPool !== 'ALL') {
      result = result.filter((s) => s.pool_location === selectedPool);
    }

    return result;
  }, [sessions, weekScope, currentWeekDays, selectedCoach, selectedStatus, selectedPool]);

  // Build dynamic Time Slots based on sessions data
  const timeSlots = useMemo(() => {
    const slotMap = new Map();

    // Add slots from active sessions
    filteredSessions.forEach((s) => {
      const start = s.start_time?.slice(0, 5) || '17:00';
      const end = s.end_time?.slice(0, 5) || '18:30';
      const key = `${start}-${end}`;
      if (!slotMap.has(key)) {
        slotMap.set(key, {
          id: key,
          start,
          end,
          label: `${start} تا ${end}`,
          period: start < '12:00' ? 'صبح' : start < '17:00' ? 'بعدازظهر' : 'عصر و شب',
        });
      }
    });

    // Also include group recurring schedules if present
    groups.forEach((g) => {
      (g.schedules || []).forEach((sch) => {
        const start = sch.start_time?.slice(0, 5) || '17:00';
        const end = sch.end_time?.slice(0, 5) || '19:00';
        const key = `${start}-${end}`;
        if (!slotMap.has(key)) {
          slotMap.set(key, {
            id: key,
            start,
            end,
            label: `${start} تا ${end}`,
            period: start < '12:00' ? 'صبح' : start < '17:00' ? 'بعدازظهر' : 'عصر و شب',
          });
        }
      });
    });

    // Fallback to default swimming slots if none found
    if (slotMap.size === 0) {
      return DEFAULT_TIME_SLOTS;
    }

    // Convert map to sorted array by start time
    return Array.from(slotMap.values()).sort((a, b) => a.start.localeCompare(b.start));
  }, [filteredSessions, groups]);

  // Group sessions into matrix [slotId][weekdayIndex] -> array of sessions
  const scheduleMatrix = useMemo(() => {
    const matrix = {};

    timeSlots.forEach((slot) => {
      matrix[slot.id] = {
        0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
      };
    });

    filteredSessions.forEach((s) => {
      const weekday = getWeekdayFromDateStr(s.session_date);
      const sStart = s.start_time?.slice(0, 5) || '17:00';
      const sEnd = s.end_time?.slice(0, 5) || '18:30';

      // Find exact or closest matching slot
      let matchedSlot = timeSlots.find((slot) => slot.start === sStart && slot.end === sEnd);
      if (!matchedSlot) {
        matchedSlot = timeSlots.find((slot) => slot.start === sStart);
      }
      if (!matchedSlot && timeSlots.length > 0) {
        matchedSlot = timeSlots[0];
      }

      if (matchedSlot && matrix[matchedSlot.id] && matrix[matchedSlot.id][weekday]) {
        matrix[matchedSlot.id][weekday].push(s);
      }
    });

    return matrix;
  }, [filteredSessions, timeSlots]);

  // Sessions map grouped by day of week (for mobile day view)
  const daySessionsMap = useMemo(() => {
    const map = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    filteredSessions.forEach((s) => {
      const weekday = getWeekdayFromDateStr(s.session_date);
      if (map[weekday]) map[weekday].push(s);
    });
    // Sort each day's sessions by start time
    Object.keys(map).forEach((dayKey) => {
      map[dayKey].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    });
    return map;
  }, [filteredSessions]);

  // Status Meta
  const statusMeta = {
    SCHEDULED: { label: 'برنامه‌ریزی‌شده', color: 'bg-sky-50 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-800' },
    COMPLETED: { label: 'برگزارشده', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    CANCELLED: { label: 'لغوشده', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
    MAKEUP: { label: 'جبرانی', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  };

  // High-Resolution PNG Export
  const handleDownloadHighResPng = async () => {
    if (!printContainerRef.current) return;
    try {
      setIsExportingPng(true);
      toast.info('در حال آماده‌سازی تصویر باکیفیت بالا...');

      // Render with 2.5x pixel ratio for print-ready high clarity
      const dataUrl = await toPng(printContainerRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2.5,
        filter: (node) => !node.classList?.contains('no-export'),
      });

      const todayFa = new Intl.DateTimeFormat('fa-IR').format(new Date()).replace(/\//g, '-');
      const filename = `جدول-برنامه-هفتگی-استخر-${todayFa}.png`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();

      toast.success('تصویر باکیفیت جدول زمان‌بندی با موفقیت دانلود شد.');
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
    if (!filteredSessions.length) {
      toast.error('جلسه‌ای برای خروجی اکسل وجود ندارد.');
      return;
    }

    const headers = {
      group_name: 'گروه کلاسی',
      course_name: 'دوره آموزشی',
      coach_name: 'مربی مسئول',
      weekday_name: 'روز هفته',
      session_date: 'تاریخ برگزاری',
      time_range: 'ساعت کلاس',
      pool_location: 'محل استخر و لاین',
      status_display: 'وضعیت جلسه',
      enrolled_count: 'تعداد شناگران ثبت‌نام‌شده',
    };

    const rows = filteredSessions.map((s) => {
      const weekdayIdx = getWeekdayFromDateStr(s.session_date);
      const weekdayObj = WEEKDAYS.find((w) => w.index === weekdayIdx);
      return {
        group_name: s.group_name || '—',
        course_name: s.course_name || '—',
        coach_name: s.coach_name || '—',
        weekday_name: weekdayObj?.name || '—',
        session_date: s.session_date || '—',
        time_range: `${s.start_time?.slice(0, 5)} تا ${s.end_time?.slice(0, 5)}`,
        pool_location: s.pool_location || 'استخر شهید رئیسی',
        status_display: s.status_display || s.status,
        enrolled_count: s.enrolled_count || 0,
      };
    });

    const todayFa = new Intl.DateTimeFormat('fa-IR').format(new Date()).replace(/\//g, '-');
    exportToCsv(`جلسات-تقویمی-استخر-${todayFa}`, rows, headers);
    toast.success('فایل اکسل جلسات تقویمی با موفقیت دانلود شد.');
  };

  // Navigate to Class Space
  const handleNavigateToClass = (groupId) => {
    if (groupId) {
      navigate(`/admin/classes/${groupId}`);
    }
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
            padding: 12px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Container Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors">
        
        {/* Top Header & Actions Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 sm:p-2.5 rounded-2xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800 shrink-0">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                  <span>جدول زمان‌بندی روز در ساعت جلسات استخر</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300">
                    {filteredSessions.length} جلسه
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  نمایش ماتریسی کلاس‌ها، مربیان و لاین‌ها · با کلیک روی هر کلاس، وارد فضای اختصاصی آن شوید
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons: High-Res PNG, Print/PDF, Excel, View Mode */}
          <div className="flex items-center gap-2 flex-wrap no-print">
            {/* Download High-Res PNG Button */}
            <button
              type="button"
              onClick={handleDownloadHighResPng}
              disabled={isExportingPng}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all cursor-pointer disabled:opacity-60"
              title="دانلود تصویر باکیفیت جدول (مناسب اشتراک‌گذاری و چاپ)"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPng ? 'در حال تولید...' : 'دانلود تصویر باکیفیت (PNG)'}</span>
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
              title="دریافت فایل اکسل جلسات"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">خروجی اکسل</span>
            </button>

            {/* View Mode Switcher (Grid vs List) */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 px-2.5 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="نمای جدول روز در ساعت"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">جدول ماتریسی</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 px-2.5 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="نمای لیستی"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">فهرست خطی</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Week Scope Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-4 pb-2 no-print">
          {/* Week Scope Navigator */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setWeekScope('ALL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  weekScope === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                الگوی کلی هفتگی (همه جلسات)
              </button>
              <button
                type="button"
                onClick={() => setWeekScope('CURRENT_WEEK')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  weekScope === 'CURRENT_WEEK'
                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                تقویم هفتگی با تاریخ
              </button>
            </div>

            {/* Week navigation buttons if CURRENT_WEEK */}
            {weekScope === 'CURRENT_WEEK' && (
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setWeekOffset((prev) => prev - 1)}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  title="هفته قبل"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="font-bold px-2 text-slate-800 dark:text-slate-200">
                  {weekOffset === 0
                    ? 'هفته جاری'
                    : weekOffset > 0
                    ? `${weekOffset} هفته بعد`
                    : `${Math.abs(weekOffset)} هفته قبل`}
                </span>
                <button
                  type="button"
                  onClick={() => setWeekOffset((prev) => prev + 1)}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  title="هفته بعد"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {weekOffset !== 0 && (
                  <button
                    type="button"
                    onClick={() => setWeekOffset(0)}
                    className="text-[11px] font-bold text-sky-600 hover:underline px-1.5"
                  >
                    امروز
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Dropdown Filters (Coach, Status, Pool) */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Coach filter */}
            {availableCoaches.length > 0 && (
              <select
                value={selectedCoach}
                onChange={(e) => setSelectedCoach(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-medium outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="ALL">همه مربیان ({availableCoaches.length})</option>
                {availableCoaches.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}

            {/* Status filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-medium outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="ALL">همه وضعیت‌ها</option>
              <option value="SCHEDULED">برنامه‌ریزی‌شده</option>
              <option value="COMPLETED">برگزارشده</option>
              <option value="CANCELLED">لغوشده</option>
            </select>

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

            {(selectedCoach !== 'ALL' || selectedStatus !== 'ALL' || selectedPool !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCoach('ALL');
                  setSelectedStatus('ALL');
                  setSelectedPool('ALL');
                }}
                className="text-xs text-rose-600 hover:underline px-1 font-bold"
              >
                حذف فیلترها
              </button>
            )}
          </div>
        </div>

        {/* MOBILE MODE CONTROLS (< md) */}
        {viewMode === 'grid' && (
          <div className="md:hidden pt-3 pb-2 space-y-3 no-print">
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
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                {WEEKDAYS.map((day) => {
                  const count = (daySessionsMap[day.index] || []).length;
                  const isSelected = selectedMobileDay === day.index;
                  const weekDateObj = currentWeekDays.find((d) => d.weekdayIndex === day.index);
                  return (
                    <button
                      key={day.index}
                      type="button"
                      onClick={() => setSelectedMobileDay(day.index)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex flex-col items-center gap-0.5 cursor-pointer border ${
                        isSelected
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs scale-102'
                          : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="font-extrabold">{day.name}</span>
                      {weekScope === 'CURRENT_WEEK' && weekDateObj && (
                        <span className="text-[10px] opacity-80 font-mono">{weekDateObj.faLabel}</span>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono mt-0.5 ${
                        isSelected
                          ? 'bg-sky-700 text-white'
                          : count > 0
                          ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 font-bold'
                          : 'bg-slate-200/80 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }`}>
                        {count} کلاس
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Printable & Exportable Timetable Root */}
        <div id="print-schedule-root" ref={printContainerRef} className="mt-3 bg-white dark:bg-slate-900 rounded-2xl">
          
          {/* Header visible in PNG & Print exports */}
          <div className="hidden print:block p-4 mb-4 border-b-2 border-slate-300 text-center space-y-1">
            <h2 className="text-xl font-black text-slate-900">مدرسه شنای ایران - جدول برنامه‌ریزی جلسات و سانس‌های هفتگی</h2>
            <p className="text-xs text-slate-600">
              تاریخ صدور گزارش: {new Intl.DateTimeFormat('fa-IR', { dateStyle: 'full' }).format(new Date())}
              {selectedCoach !== 'ALL' && ` • مربی: ${availableCoaches.find(c => String(c.id) === String(selectedCoach))?.name}`}
            </p>
          </div>

          {/* VIEW 1: DAY-IN-HOUR TIMETABLE GRID (جدول روز در ساعت) */}
          {viewMode === 'grid' ? (
            <>
              {/* MOBILE DAY TIMELINE VIEW (shown on mobile when dayTimeline mode is selected) */}
              <div className={`md:hidden ${mobileLayoutMode === 'dayTimeline' ? 'block' : 'hidden'} space-y-3 pt-1`}>
                <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-bold">
                  <span>برنامه روز {WEEKDAYS.find((w) => w.index === selectedMobileDay)?.name}:</span>
                  <span className="font-mono text-sky-600">{(daySessionsMap[selectedMobileDay] || []).length} کلاس فعال</span>
                </div>

                {(daySessionsMap[selectedMobileDay] || []).length === 0 ? (
                  <div className="text-center py-12 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-slate-400 text-xs space-y-1">
                    <p className="font-bold">در این روز جلسه یا کلاسی تعریف نشده است.</p>
                    <p className="text-[11px]">برای مشاهده سایر روزها، دکمه‌های بالای صفحه را انتخاب کنید.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(daySessionsMap[selectedMobileDay] || []).map((sess) => {
                      const meta = statusMeta[sess.status] || statusMeta.SCHEDULED;
                      return (
                        <div
                          key={sess.id}
                          onClick={() => handleNavigateToClass(sess.group)}
                          className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-sky-400 hover:shadow-md transition-all cursor-pointer space-y-3 active:scale-[0.99] group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 font-bold mb-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{sess.start_time?.slice(0, 5)} الی {sess.end_time?.slice(0, 5)}</span>
                              </div>
                              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                {sess.group_name}
                              </h4>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${meta.color}`}>
                              {sess.status_display || meta.label}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{sess.coach_name || 'بدون مربی'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{sess.pool_location || 'استخر شهید رئیسی'}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                            <span className="text-sky-600 dark:text-sky-400 font-bold flex items-center gap-1 group-hover:translate-x-[-3px] transition-transform">
                              <span>ورود به فضای کلاس</span>
                              <span className="text-sm">←</span>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/attendance/${sess.id}`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 dark:bg-sky-950/70 dark:hover:bg-sky-900/70 text-sky-700 dark:text-sky-300 text-xs font-bold transition-colors"
                            >
                              برگه حضور و غیاب
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* TABLE MATRIX VIEW (Desktop, Tablet, or Mobile Matrix Mode) */}
              <div className={`overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs ${
                mobileLayoutMode === 'dayTimeline' ? 'hidden md:block' : 'block'
              }`}>
                <table className="w-full text-right border-collapse min-w-[760px] lg:min-w-[920px]">
                  {/* Table Header: Days of the Week */}
                  <thead>
                    <tr className="bg-slate-100/95 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20">
                      {/* Sticky Right Column Header in RTL (Hour / سانس) */}
                      <th className="p-3.5 text-center font-extrabold text-xs sm:text-sm w-32 sm:w-36 border-l border-slate-200 dark:border-slate-700 sticky right-0 z-30 bg-slate-200/80 dark:bg-slate-800 shadow-xs">
                        <div className="flex items-center justify-center gap-1.5">
                          <Clock className="w-4 h-4 text-sky-600" />
                          <span>ساعت / سانس</span>
                        </div>
                      </th>

                      {/* 7 Days Columns */}
                      {WEEKDAYS.map((day) => {
                        const weekDateObj = currentWeekDays.find((d) => d.weekdayIndex === day.index);
                        return (
                          <th
                            key={day.index}
                            className={`p-3 text-center border-l last:border-l-0 border-slate-200 dark:border-slate-700 transition-colors ${
                              weekDateObj?.isToday && weekScope === 'CURRENT_WEEK'
                                ? 'bg-sky-100/70 dark:bg-sky-950/70 text-sky-900 dark:text-sky-200 font-black'
                                : 'font-bold text-xs sm:text-sm'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <span className="block">{day.name}</span>
                              {weekScope === 'CURRENT_WEEK' && weekDateObj && (
                                <span className={`block text-[11px] font-mono ${
                                  weekDateObj.isToday
                                    ? 'text-sky-700 dark:text-sky-300 font-bold'
                                    : 'text-slate-500 dark:text-slate-400 font-normal'
                                }`}>
                                  {weekDateObj.faLabel}
                                </span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  {/* Table Body: Time Slots as Rows */}
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                    {timeSlots.map((slot) => {
                      return (
                        <tr key={slot.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                          {/* Sticky Time Slot Column in RTL */}
                          <td className="p-3 text-center border-l border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/80 sticky right-0 z-10 shadow-xs align-middle">
                            <div className="space-y-1">
                              <span className="font-mono font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 block">
                                {slot.label}
                              </span>
                              <span className="inline-block px-2 py-0.5 text-[10px] rounded-md font-semibold bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                {slot.period}
                              </span>
                            </div>
                          </td>

                          {/* 7 Days cells */}
                          {WEEKDAYS.map((day) => {
                            const cellSessions = scheduleMatrix[slot.id]?.[day.index] || [];
                            const hasSessions = cellSessions.length > 0;

                            return (
                              <td
                                key={day.index}
                                className={`p-2 border-l last:border-l-0 border-slate-200/80 dark:border-slate-800 align-top transition-colors ${
                                  hasSessions ? 'bg-sky-50/20 dark:bg-sky-950/10' : ''
                                }`}
                              >
                                {hasSessions ? (
                                  <div className="space-y-2">
                                    {cellSessions.map((sess) => {
                                      const meta = statusMeta[sess.status] || statusMeta.SCHEDULED;
                                      return (
                                        <div
                                          key={sess.id}
                                          onClick={() => handleNavigateToClass(sess.group)}
                                          className="p-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-2xs hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-md hover:-translate-y-0.5 transition-all space-y-1.5 cursor-pointer group"
                                          title="کلیک برای ورود به فضای اختصاصی این کلاس"
                                        >
                                          {/* Group & Status */}
                                          <div className="flex items-start justify-between gap-1.5">
                                            <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 leading-tight transition-colors">
                                              {sess.group_name}
                                            </h4>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${meta.color}`}>
                                              {sess.status_display || meta.label}
                                            </span>
                                          </div>

                                          {/* Coach */}
                                          <div className="flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                                            <User className="w-3 h-3 text-sky-600 shrink-0" />
                                            <span className="truncate">{sess.coach_name || 'بدون مربی'}</span>
                                          </div>

                                          {/* Pool location */}
                                          {sess.pool_location && (
                                            <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                              <span className="truncate">{sess.pool_location}</span>
                                            </div>
                                          )}

                                          {/* Action Footer on Card */}
                                          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                                            <span className="text-sky-600 dark:text-sky-400 font-bold flex items-center gap-0.5 group-hover:underline">
                                              <span>کلاس</span>
                                              <span>←</span>
                                            </span>
                                            {weekScope === 'ALL' && sess.session_date ? (
                                              <span className="text-slate-400 font-mono">{formatFaDate(sess.session_date)}</span>
                                            ) : sess.enrolled_count > 0 ? (
                                              <span className="text-slate-500 font-mono font-bold">{sess.enrolled_count} نفر</span>
                                            ) : null}
                                          </div>
                                        </div>
                                      );
                                    })}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* VIEW 2: CLASSIC LIST VIEW (فهرست خطی جلسات) */
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <table className="w-full text-sm text-right min-w-[700px]">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 rounded-r-xl">گروه کلاسی</th>
                    <th className="px-4 py-3">دوره آموزشی</th>
                    <th className="px-4 py-3">مربی مسئول</th>
                    <th className="px-4 py-3">روز و تاریخ جلسه</th>
                    <th className="px-4 py-3">ساعت برگزاری</th>
                    <th className="px-4 py-3">محل استخر</th>
                    <th className="px-4 py-3">وضعیت</th>
                    <th className="px-4 py-3 text-center rounded-l-xl">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {filteredSessions.map((sess) => {
                    const weekdayIdx = getWeekdayFromDateStr(sess.session_date);
                    const weekdayObj = WEEKDAYS.find((w) => w.index === weekdayIdx);
                    const meta = statusMeta[sess.status] || statusMeta.SCHEDULED;

                    return (
                      <tr key={sess.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          <button
                            type="button"
                            onClick={() => handleNavigateToClass(sess.group)}
                            className="hover:text-sky-600 dark:hover:text-sky-400 font-bold hover:underline transition-colors text-right"
                          >
                            {sess.group_name}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{sess.course_name || '—'}</td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-800 dark:text-slate-200">{sess.coach_name || 'نامشخص'}</td>
                        <td className="px-4 py-3 text-xs font-mono">
                          <span className="font-bold text-sky-700 dark:text-sky-300 ml-1.5">{weekdayObj?.name}</span>
                          <span>{sess.session_date}</span>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-700 dark:text-slate-300">
                          {sess.start_time?.slice(0, 5)} تا {sess.end_time?.slice(0, 5)}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{sess.pool_location}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg border inline-block ${meta.color}`}>
                            {sess.status_display || meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleNavigateToClass(sess.group)}
                            className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>ورود به کلاس</span>
                            <span>←</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Legend / Footer info */}
          <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-bold">راهنمای وضعیت‌ها:</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                <span>برنامه‌ریزی‌شده</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>برگزارشده</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>لغوشده</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>جلسه جبرانی</span>
              </span>
            </div>

            <div className="text-left font-mono">
              مجموع جلسات قابل نمایش: {filteredSessions.length} جلسه
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
