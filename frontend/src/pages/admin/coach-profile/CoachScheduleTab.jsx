import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, Users, BookOpen, AlertTriangle, CheckCircle2,
  ExternalLink, Plus, UserCheck
} from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { LoadingState } from '../../../components/common/LoadingState';
import api from '../../../api/client';

const WEEKDAYS = [
  { id: 0, label: 'شنبه' },
  { id: 1, label: 'یک‌شنبه' },
  { id: 2, label: 'دوشنبه' },
  { id: 3, label: 'سه‌شنبه' },
  { id: 4, label: 'چهارشنبه' },
  { id: 5, label: 'پنج‌شنبه' },
  { id: 6, label: 'جمعه' },
];

export const CoachScheduleTab = ({ coach }) => {
  const navigate = useNavigate();

  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/coaches/${coach.id}/schedule/`);
      setScheduleData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [coach.id]);

  if (loading && !scheduleData) {
    return <LoadingState type="cards" count={3} message="در حال استخراج برنامه هفتگی و تداخل‌های کلاسی..." />;
  }

  const assignedGroups = scheduleData?.assigned_groups || [];
  const conflicts = scheduleData?.conflicts || [];
  const contractualHours = Number(scheduleData?.contractual_weekly_hours || coach.contractual_weekly_hours || 20);
  const scheduledHours = Number(scheduleData?.scheduled_weekly_hours || 0);
  const diffHours = scheduledHours - contractualHours;

  return (
    <div className="space-y-6">
      {/* Top Banner and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-600" />
            برنامه کاری، تخصیص کلاس‌ها و کنترل تداخل
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            تطبیق ساعات کلاسی برنامه‌ریزی‌شده با تعهدات قرارداد و نظارت بر سانس‌های اشغال
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/coaches/${coach.id}/schedule`)}
            className="gap-1.5 text-xs bg-white dark:bg-slate-900 shadow-xs"
          >
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            <span>جدول پیشرفته روز در ساعت</span>
          </Button>

          <Button
            onClick={() => navigate(`/admin/coaches/${coach.id}/assign`)}
            className="gap-1.5 text-xs bg-sky-600 hover:bg-sky-500 text-white shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>تخصیص کلاس جدید</span>
          </Button>
        </div>
      </div>

      {/* Contractual vs Scheduled Hours Indicator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <span className="text-slate-400 block mb-1">تعهد موظف در قرارداد:</span>
          <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
            {contractualHours} ساعت در هفته
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <span className="text-slate-400 block mb-1">مجموع ساعات کلاس‌های تخصیص‌یافته:</span>
          <span className="text-lg font-bold font-mono text-sky-700 dark:text-sky-400">
            {scheduledHours} ساعت در هفته
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <span className="text-slate-400 block mb-1">وضعیت پوشش تعهد:</span>
          <span className={`text-sm font-bold flex items-center gap-1 ${
            diffHours >= 0 ? 'text-emerald-600' : 'text-amber-600'
          }`}>
            {diffHours >= 0 ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                تکمیل تعهد ({diffHours > 0 ? `+${diffHours} ساعت اضافه` : 'کامل'})
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                کسری ظرفیت ({Math.abs(diffHours)} ساعت خالی)
              </>
            )}
          </span>
        </div>
      </div>

      {/* Conflict Alert Box if Any */}
      {conflicts.length > 0 && (
        <div className="p-4 rounded-2xl border border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
            هشدار تداخل همزمانی در جلسات این مربی ({conflicts.length} تداخل شناسایی شد)
          </div>
          <div className="divide-y divide-rose-200 dark:divide-rose-900/40">
            {conflicts.map((c, idx) => (
              <div key={idx} className="py-2 text-rose-700 dark:text-rose-300">
                تاریخ: <strong className="font-mono">{new Date(c.date).toLocaleDateString('fa-IR')}</strong> — کلاس ۱: {c.session_1} در برابر کلاس ۲: {c.session_2}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assigned Classes Grid */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
          کلاس‌ها و گروه‌های آموزشی تخصیص‌یافته ({assignedGroups.length} کلاس فعال)
        </h4>

        {assignedGroups.length === 0 ? (
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center text-slate-400 text-xs">
            در حال حاضر کلاسی به این مربی تخصیص داده نشده است.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedGroups.map((grp) => (
              <div
                key={grp.group_id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3 text-xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                      {grp.group_name}
                    </h5>
                    <Badge variant={grp.status === 'OPEN' ? 'success' : 'neutral'}>
                      {grp.status === 'OPEN' ? 'فعال' : grp.status}
                    </Badge>
                  </div>

                  <p className="text-slate-500 font-semibold">{grp.course_name}</p>

                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-sky-600" />
                    <span>{grp.pool_location}</span>
                  </div>

                  {/* Schedules List */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                    <span className="text-slate-400 block text-[11px]">سانس‌های هفتگی:</span>
                    {grp.schedules && grp.schedules.length > 0 ? (
                      grp.schedules.map((sch) => (
                        <div key={sch.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{sch.weekday_display}</span>
                          <span className="font-mono text-slate-600 dark:text-slate-400">{sch.start_time} تا {sch.end_time}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-400 text-[11px]">فاقد سانس زمانی</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/classes/${grp.group_id}`)}
                    className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
                  >
                    <span>مشاهده کلاس و شاگردان</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Visual Timeline Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
            نمای تقویم هفتگی سانس‌های مربی
          </h4>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            شنبه تا جمعه به تفکیک سانس و کلاس
          </span>
        </div>

        <div className="overflow-x-auto scrollbar-none pb-1">
          <div className="grid grid-cols-1 sm:grid-cols-7 gap-2 text-xs min-w-full sm:min-w-[680px] lg:min-w-0">
          {WEEKDAYS.map((day) => {
            // Find all schedules on this day
            const daySchedules = [];
            assignedGroups.forEach((grp) => {
              (grp.schedules || []).forEach((sch) => {
                if (sch.weekday === day.id) {
                  daySchedules.push({ ...sch, group_name: grp.group_name });
                }
              });
            });

            return (
              <div
                key={day.id}
                className={`p-3 rounded-xl border flex flex-col justify-between min-h-[110px] ${
                  daySchedules.length > 0
                    ? 'border-sky-200 dark:border-sky-900 bg-sky-50/40 dark:bg-sky-950/20'
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20'
                }`}
              >
                <div className="font-bold text-slate-800 dark:text-slate-200 pb-1.5 border-b border-slate-200/60 dark:border-slate-700">
                  {day.label}
                </div>

                <div className="py-2 space-y-1 flex-1">
                  {daySchedules.length > 0 ? (
                    daySchedules.map((item, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-sky-100 dark:border-sky-800/60 shadow-2xs">
                        <span className="font-semibold text-sky-800 dark:text-sky-300 block truncate">{item.group_name}</span>
                        <span className="font-mono text-[10px] text-slate-500 block">{item.start_time}-{item.end_time}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-400 block pt-3">سانس آزاد</span>
                  )}
                </div>

                <span className="text-[10px] font-mono text-slate-400 block pt-1 border-t border-slate-200/40 dark:border-slate-700/60">
                  {daySchedules.length} کلاس
                </span>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
};
