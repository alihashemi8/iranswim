import React from 'react';
import {
  MapPin, Clock, BookOpen, Award, Phone,
  CreditCard, Eye, ShieldCheck, CheckCircle2
} from 'lucide-react';
import { Badge } from './Badge';
import { CoachSelectorDropdown } from './CoachSelectorDropdown';

export const SwimmerCourseCard = ({
  swimmer,
  course,
  coach,
  availableCoaches = [],
  onSelectCoach,
  onOpenDossier,
  status = 'ACTIVE',
  sessionsPurchased = 12,
  sessionsAttended = 0,
}) => {
  const swimmerName = swimmer.full_name || `${swimmer.first_name || ''} ${swimmer.last_name || ''}`.trim() || 'شناگر';
  const swimmerAvatar = swimmer.avatar || null;
  const swimmerPhone = swimmer.phone || '';
  const swimmerLevel = swimmer.level_name || swimmer.current_level_name || 'سطح پایه';
  const nationalId = swimmer.national_id || '';

  const courseName = course?.name || swimmer.course_name || 'دوره آموزشی شنا';
  const poolLocation = course?.pool_location || swimmer.pool_location || 'استخر شهید رئیسی';
  const daysOfWeek = course?.days_of_week || swimmer.days_of_week || 'سه‌شنبه و پنج‌شنبه';
  const timeDisplay = course?.time_display || swimmer.time_display || '۱۷:۰۰ الی ۱۹:۰۰';

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
      {/* 1. TOP SECTION: Swimmer Profile at TOP-RIGHT (راست بالای کارت) */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Swimmer Avatar (Large & Crisp) */}
          <div className="relative shrink-0">
            {swimmerAvatar ? (
              <img
                src={swimmerAvatar}
                alt={swimmerName}
                className="w-13 h-13 rounded-2xl object-cover border-2 border-sky-400 dark:border-sky-500 shadow-2xs group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-lg shadow-2xs group-hover:scale-105 transition-transform">
                {swimmerName.charAt(0)}
              </div>
            )}
            <span className="absolute -bottom-1 -left-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                {swimmerName}
              </h3>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[10px] font-bold border border-sky-200/60 dark:border-sky-800">
                <Award className="w-3 h-3 text-sky-500" />
                {swimmerLevel}
              </span>
              {swimmerPhone && (
                <span className="text-[11px] font-mono text-slate-400">
                  {swimmerPhone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status Badge at TOP-LEFT */}
        <Badge variant={status === 'ACTIVE' ? 'success' : status === 'PENDING_PAYMENT' ? 'warning' : 'neutral'}>
          {status === 'ACTIVE' ? 'ثبت‌نام قطعی' : status === 'PENDING_PAYMENT' ? 'در انتظار پرداخت' : status}
        </Badge>
      </div>

      {/* 2. MIDDLE SECTION: Course, Pool, Schedule */}
      <div className="my-4 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/60 space-y-2 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/50">
          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
            <BookOpen className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
            {courseName}
          </span>
          <span className="text-[11px] font-mono text-slate-500 shrink-0">
            {sessionsAttended} از {sessionsPurchased} جلسه
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{poolLocation}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{daysOfWeek} ({timeDisplay})</span>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM SECTION: Coach Avatar at BOTTOM-LEFT (عکس مربی ریزتر چپ پایین) */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        {/* Coach Selector / Avatar at BOTTOM-LEFT */}
        <div className="flex items-center">
          <CoachSelectorDropdown
            currentCoach={coach}
            availableCoaches={availableCoaches}
            onSelectCoach={onSelectCoach}
            placement="dropup"
            size="md"
          />
        </div>

        {/* Actions at BOTTOM-RIGHT */}
        <div className="flex items-center gap-1.5">
          {onOpenDossier && (
            <button
              type="button"
              onClick={onOpenDossier}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
              title="مشاهده پرونده جامع شناگر"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>پرونده</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
