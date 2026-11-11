import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, Users, Award, ArrowRight,
  BookOpen, UserCheck, ChevronLeft, ChevronRight,
  Printer, CheckCircle2, AlertTriangle, Filter, Sparkles, Plus
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { CustomSelect } from '../../components/common/CustomSelect';
import { BackButton } from '../../components/common/BackButton';
import { useToast } from '../../context/ToastContext';

// Persian days of the week indexed 0..6 (Saturday to Friday)
const WEEKDAYS = [
  { index: 0, key: 'SAT', name: 'شنبه', shortName: 'ش' },
  { index: 1, key: 'SUN', name: 'یکشنبه', shortName: 'ی' },
  { index: 2, key: 'MON', name: 'دوشنبه', shortName: 'د' },
  { index: 3, key: 'TUE', name: 'سه‌شنبه', shortName: 'س' },
  { index: 4, key: 'WED', name: 'چهارشنبه', shortName: 'چ' },
  { index: 5, key: 'THU', name: 'پنج‌شنبه', shortName: 'پ' },
  { index: 6, key: 'FRI', name: 'جمعه', shortName: 'ج' },
];

// Time slots from 08:00 to 22:00 (14 hourly blocks)
const TIME_SLOTS = [
  { start: '08:00', end: '09:00', label: '۰۸:۰۰ - ۰۹:۰۰' },
  { start: '09:00', end: '10:00', label: '۰۹:۰۰ - ۱۰:۰۰' },
  { start: '10:00', end: '11:00', label: '۱۰:۰۰ - ۱۱:۰۰' },
  { start: '11:00', end: '12:00', label: '۱۱:۰۰ - ۱۲:۰۰' },
  { start: '12:00', end: '13:00', label: '۱۲:۰۰ - ۱۳:۰۰' },
  { start: '13:00', end: '14:00', label: '۱۳:۰۰ - ۱۴:۰۰' },
  { start: '14:00', end: '15:00', label: '۱۴:۰۰ - ۱۵:۰۰' },
  { start: '15:00', end: '16:00', label: '۱۵:۰۰ - ۱۶:۰۰' },
  { start: '16:00', end: '17:00', label: '۱۶:۰۰ - ۱۷:۰۰' },
  { start: '17:00', end: '18:00', label: '۱۷:۰۰ - ۱۸:۰۰' },
  { start: '18:00', end: '19:00', label: '۱۸:۰۰ - ۱۹:۰۰' },
  { start: '19:00', end: '20:00', label: '۱۹:۰۰ - ۲۰:۰۰' },
  { start: '20:00', end: '21:00', label: '۲۰:۰۰ - ۲۱:۰۰' },
  { start: '21:00', end: '22:00', label: '۲۱:۰۰ - ۲۲:۰۰' },
];

export const AdminCoachSchedulePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [coach, setCoach] = useState(null);
  const [assignedGroups, setAssignedGroups] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active view: 'WEEKLY_GRID' (جدول روز در ساعت) or 'SESSIONS_LIST' (لیست تمام جلسات)
  const [viewMode, setViewMode] = useState('WEEKLY_GRID');
  // For mobile / small screens, active selected day
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Filter by group
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('ALL');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [coachRes, assignmentsRes, sessionsRes] = await Promise.all([
          api.get(`/coaches/${id}/`),
          api.get(`/education/group-coaches/?coach_id=${id}`),
          api.get(`/scheduling/sessions/?coach_id=${id}`),
        ]);

        setCoach(coachRes.data);
        setAssignedGroups(assignmentsRes.data.results || assignmentsRes.data || []);
        setSessions(sessionsRes.data.results || sessionsRes.data || []);
      } catch (err) {
        console.error('Error fetching coach schedule data:', err);
        toast.error('خطا در دریافت برنامه کلاسی مربی');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Flatten recurring weekly schedules from all assigned groups
  const weeklyScheduleItems = useMemo(() => {
    const items = [];
    assignedGroups.forEach((assignment) => {
      if (selectedGroupFilter !== 'ALL' && String(assignment.group) !== String(selectedGroupFilter)) {
        return;
      }
      const schedules = assignment.schedules || [];
      schedules.forEach((sch) => {
        items.push({
          id: `${assignment.id}-${sch.id}`,
          assignmentId: assignment.id,
          groupId: assignment.group,
          groupName: assignment.group_name || `گروه ${assignment.group}`,
          courseName: assignment.course_name || 'دوره شنا',
          levelName: assignment.level_name || 'سطح عمومی',
          levelColor: assignment.level_color || '#0284c7',
          poolLocation: assignment.pool_location || 'استخر مرکزی',
          weekday: sch.weekday,
          startTime: sch.start_time?.slice(0, 5) || '17:00',
          endTime: sch.end_time?.slice(0, 5) || '18:30',
          isPrimary: assignment.is_primary,
          capacity: assignment.capacity || 0,
          enrolledCount: assignment.enrolled_count || 0,
        });
      });
    });
    return items;
  }, [assignedGroups, selectedGroupFilter]);

  // Calculate total weekly hours
  const totalWeeklyMinutes = useMemo(() => {
    let mins = 0;
    weeklyScheduleItems.forEach((item) => {
      const [sh, sm] = item.startTime.split(':').map(Number);
      const [eh, em] = item.endTime.split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff > 0) mins += diff;
    });
    return mins;
  }, [weeklyScheduleItems]);

  const totalWeeklyHoursDisplay = (totalWeeklyMinutes / 60).toFixed(1);

  // Helper to check if a schedule item overlaps with a time slot
  const isItemInSlot = (item, slot) => {
    // Overlap: item.startTime < slot.end AND item.endTime > slot.start
    return item.startTime < slot.end && item.endTime > slot.start;
  };

  // Group filter options for CustomSelect
  const groupFilterOptions = useMemo(() => {
    const opts = [{ value: 'ALL', label: 'همه گروه‌های آموزشی تخصیص‌یافته' }];
    assignedGroups.forEach((g) => {
      opts.push({
        value: String(g.group),
        label: `${g.course_name} - ${g.group_name} (${g.level_name})`,
      });
    });
    return opts;
  }, [assignedGroups]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="py-12">
        <LoadingState type="cards" count={3} message="در حال بارگذاری جدول برنامه کلاسی مربی..." />
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-4">
        <p className="text-slate-600 dark:text-slate-400">مربی مورد نظر یافت نشد.</p>
        <BackButton to="/admin/coaches" label="بازگشت به کادر مربیان" showLabelAlways />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 print:p-0 print:space-y-4">
      {/* Top Header / Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3 min-w-0">
          <BackButton fallback={`/admin/coaches/${id}`} title="بازگشت به پرونده مربی" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">کادر مربیان</span>
              <span className="text-xs text-slate-300 dark:text-slate-700">/</span>
              <Link
                to={`/admin/coaches/${coach.id}`}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400"
              >
                پروفایل {coach.full_name}
              </Link>
              <span className="text-xs text-slate-300 dark:text-slate-700">/</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                برنامه کلاسی (جدول روز در ساعت)
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-600" />
              جدول هفتگی برنامه کلاسی: {coach.full_name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="gap-1.5 text-xs bg-white dark:bg-slate-900 shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>چاپ برنامه</span>
          </Button>

          <Button
            onClick={() => navigate(`/admin/coaches/${coach.id}/assign`)}
            className="gap-1.5 text-xs bg-sky-600 hover:bg-sky-500 text-white shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>تخصیص گروه جدید</span>
          </Button>
        </div>
      </div>

      {/* Coach Info Summary Banner */}
      <div className="bg-gradient-to-r from-sky-500/10 via-teal-500/10 to-indigo-500/10 dark:from-sky-950/40 dark:via-slate-900 dark:to-indigo-950/30 rounded-2xl border border-sky-100 dark:border-slate-800 p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
            {coach.avatar ? (
              <img src={coach.avatar} alt={coach.full_name} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              coach.full_name?.charAt(0) || 'C'
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {coach.full_name}
              </h2>
              <Badge
                variant={
                  coach.employment_status === 'ACTIVE'
                    ? 'success'
                    : coach.employment_status === 'SUSPENDED'
                    ? 'warning'
                    : 'neutral'
                }
              >
                {coach.employment_status === 'ACTIVE'
                  ? 'فعال و مجاز'
                  : coach.employment_status === 'SUSPENDED'
                  ? 'معلق'
                  : 'غیرفعال'}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span>تلفن تماس: <strong className="font-mono text-slate-700 dark:text-slate-300">{coach.phone}</strong></span>
              {coach.specialties && (
                <>
                  <span>•</span>
                  <span>تخصص: <strong className="text-slate-700 dark:text-slate-300">{coach.specialties}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-3 flex-wrap text-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-3.5 py-2 rounded-xl shadow-2xs">
            <span className="text-slate-400 block text-[11px]">گروه‌های آموزشی فعال:</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {assignedGroups.length} گروه
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-3.5 py-2 rounded-xl shadow-2xs">
            <span className="text-slate-400 block text-[11px]">ساعات تدریس در هفته:</span>
            <span className="font-bold text-sky-600 dark:text-sky-400 text-sm font-mono">
              {totalWeeklyHoursDisplay} ساعت
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-3.5 py-2 rounded-xl shadow-2xs">
            <span className="text-slate-400 block text-[11px]">جلسات تقویمی ثبت‌شده:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono">
              {sessions.length} جلسه
            </span>
          </div>
        </div>
      </div>

      {/* Filters and View Switcher */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('WEEKLY_GRID')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'WEEKLY_GRID'
                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>جدول روز در ساعت (الگوی هفتگی)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('SESSIONS_LIST')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'SESSIONS_LIST'
                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>تقویم جلسات موردی ({sessions.length})</span>
          </button>
        </div>

        {/* Group Filter */}
        <div className="w-full sm:w-72">
          <CustomSelect
            value={selectedGroupFilter}
            onChange={(val) => setSelectedGroupFilter(val)}
            options={groupFilterOptions}
            size="sm"
            color="sky"
            placeholder="فیلتر بر اساس گروه آموزشی..."
          />
        </div>
      </div>

      {/* VIEW 1: WEEKLY DAY-IN-HOUR MATRIX (جدول روز در ساعت) */}
      {viewMode === 'WEEKLY_GRID' && (
        <div className="space-y-4">
          {/* Mobile Day Selector Tabs (Hidden on large screens) */}
          <div className="lg:hidden flex items-center justify-between gap-1 overflow-x-auto pb-2 scrollbar-none">
            {WEEKDAYS.map((day) => {
              const countForDay = weeklyScheduleItems.filter((i) => i.weekday === day.index).length;
              const isSelected = selectedDayIndex === day.index;
              return (
                <button
                  key={day.index}
                  type="button"
                  onClick={() => setSelectedDayIndex(day.index)}
                  className={`flex-1 min-w-[70px] py-2 px-1 rounded-xl text-center text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="block">{day.name}</span>
                  <span className={`text-[10px] block mt-0.5 font-normal ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                    {countForDay > 0 ? `${countForDay} کلاس` : 'بدون کلاس'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Large Screen: 7-Column Day x Hour Full Schedule Matrix */}
          <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-right min-w-[900px]">
                {/* Table Header: Days of the week */}
                <thead>
                  <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3.5 text-center text-xs font-bold text-slate-500 dark:text-slate-400 w-28 border-l border-slate-200 dark:border-slate-800">
                      ساعت / روز
                    </th>
                    {WEEKDAYS.map((day) => {
                      const countForDay = weeklyScheduleItems.filter((i) => i.weekday === day.index).length;
                      return (
                        <th
                          key={day.index}
                          className="p-3 text-center border-l border-slate-200 dark:border-slate-800 last:border-l-0"
                        >
                          <span className="block font-bold text-slate-900 dark:text-white text-xs">
                            {day.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-normal">
                            {countForDay > 0 ? `${countForDay} کلاس هفتگی` : 'بدون کلاس'}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                {/* Table Body: Time Slots as Rows */}
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {TIME_SLOTS.map((slot, sIdx) => (
                    <tr
                      key={sIdx}
                      className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-colors h-14"
                    >
                      {/* Hour Axis Column */}
                      <td className="p-2.5 text-center font-mono font-semibold text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/40 border-l border-slate-200 dark:border-slate-800 whitespace-nowrap text-[11px]">
                        {slot.label}
                      </td>

                      {/* Day Columns */}
                      {WEEKDAYS.map((day) => {
                        const matchingItems = weeklyScheduleItems.filter(
                          (item) => item.weekday === day.index && isItemInSlot(item, slot)
                        );

                        return (
                          <td
                            key={day.index}
                            className="p-1.5 border-l border-slate-100 dark:border-slate-800/80 last:border-l-0 align-top relative"
                          >
                            {matchingItems.map((item) => (
                              <div
                                key={item.id}
                                className="group p-2 rounded-xl border border-sky-200 dark:border-sky-800/80 bg-gradient-to-br from-sky-50 to-cyan-50/80 dark:from-sky-950/70 dark:to-slate-900 shadow-2xs hover:shadow-xs transition-all mb-1 last:mb-0"
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <span className="font-bold text-slate-900 dark:text-white text-[11px] leading-tight line-clamp-1">
                                    {item.groupName}
                                  </span>
                                  <span
                                    className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white shrink-0"
                                    style={{ backgroundColor: item.levelColor }}
                                  >
                                    {item.levelName}
                                  </span>
                                </div>

                                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                                  <span className="font-mono text-sky-700 dark:text-sky-300 font-semibold">
                                    {item.startTime} تا {item.endTime}
                                  </span>
                                  <span className="flex items-center gap-0.5">
                                    <MapPin className="w-2.5 h-2.5" />
                                    <span className="truncate max-w-[80px]">{item.poolLocation}</span>
                                  </span>
                                </div>

                                {item.isPrimary && (
                                  <div className="mt-1 flex items-center gap-1 text-[9px] text-emerald-700 dark:text-emerald-400 font-semibold">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    <span>مربی اصلی گروه</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Screen: Day-by-Day Card View */}
          <div className="lg:hidden space-y-3">
            <div className="bg-sky-50 dark:bg-sky-950/50 p-3 rounded-xl border border-sky-200 dark:border-sky-800 flex items-center justify-between text-xs">
              <span className="font-bold text-sky-900 dark:text-sky-200">
                برنامه کلاسی روز {WEEKDAYS[selectedDayIndex].name}:
              </span>
              <span className="text-sky-600 dark:text-sky-400">
                {weeklyScheduleItems.filter((i) => i.weekday === selectedDayIndex).length} کلاس
              </span>
            </div>

            {weeklyScheduleItems.filter((i) => i.weekday === selectedDayIndex).length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                در روز {WEEKDAYS[selectedDayIndex].name} کلاسی برای این مربی تنظیم نشده است.
              </div>
            ) : (
              <div className="space-y-2.5">
                {weeklyScheduleItems
                  .filter((i) => i.weekday === selectedDayIndex)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                            {item.groupName}
                          </h4>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {item.courseName}
                          </span>
                        </div>
                        <Badge
                          variant="neutral"
                          style={{ backgroundColor: item.levelColor, color: '#fff' }}
                        >
                          {item.levelName}
                        </Badge>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-sky-600 font-mono" />
                          <span>ساعت {item.startTime} تا {item.endTime}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="truncate">{item.poolLocation}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: CALENDAR SESSIONS LIST */}
      {viewMode === 'SESSIONS_LIST' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 transition-colors">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                فهرست تمام جلسات تقویمی مربی
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                نمایش تمام جلسات برنامه‌ریزی‌شده، برگزارشده یا لغوشده در تقویم آموزشی
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-500">
              مجموع: {sessions.length} جلسه
            </span>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              هیچ جلسه تقویمی برای این مربی در سامانه ثبت نشده است.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2.5 px-3">نام گروه / دوره</th>
                    <th className="py-2.5 px-3">سطح مهارت</th>
                    <th className="py-2.5 px-3">تاریخ جلسه</th>
                    <th className="py-2.5 px-3">ساعت برگزاری</th>
                    <th className="py-2.5 px-3">مکان استخر</th>
                    <th className="py-2.5 px-3">حضور و غیاب</th>
                    <th className="py-2.5 px-3 text-center">وضعیت جلسه</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {s.group_name || 'کلاس عمومی'}
                        {s.course_name && (
                          <span className="block text-[11px] text-slate-400 font-normal">
                            {s.course_name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="neutral" style={{ backgroundColor: s.skill_level_badge, color: '#fff' }}>
                          {s.skill_level_name || 'عمومی'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                        {s.session_date ? new Date(s.session_date).toLocaleDateString('fa-IR') : '—'}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                        {s.start_time?.slice(0, 5)} الی {s.end_time?.slice(0, 5)}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {s.pool_location || 'استخر مرکزی'}
                      </td>
                      <td className="py-3 px-3">
                        {s.attendance_recorded ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ثبت شده ({s.attendance_count || 0})</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">در انتظار ثبت</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge
                          variant={
                            s.status === 'COMPLETED'
                              ? 'success'
                              : s.status === 'CANCELLED'
                              ? 'danger'
                              : 'info'
                          }
                        >
                          {s.status_display || s.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
