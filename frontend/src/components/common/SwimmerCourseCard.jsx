import React from 'react';
import {
  MapPin, Clock, BookOpen, Award, Phone,
  CreditCard, Eye, ShieldCheck, CheckCircle2, ArrowLeftRight, User
} from 'lucide-react';
import { Badge } from './Badge';
import { CoachSelectorDropdown } from './CoachSelectorDropdown';

export const SwimmerCourseCard = ({
  swimmer,
  course,
  coach,
  availableCoaches = [],
  allCoaches = [],
  onSelectCoach,
  onChangeClass,
  onOpenDossier,
  status = 'ACTIVE',
  sessionsPurchased = 12,
  sessionsAttended = 0,
}) => {
  const swimmerName = swimmer.full_name || `${swimmer.first_name || ''} ${swimmer.last_name || ''}`.trim() || 'شناگر';
  const swimmerAvatar = swimmer.avatar || null;
  const swimmerPhone = swimmer.phone || '';
  const swimmerLevel = swimmer.level_name || swimmer.current_level_name || 'سطح پایه';
  const swimmerGender = swimmer.gender || swimmer.swimmer_gender || '';

  const courseName = course?.name || swimmer.course_name || 'دوره آموزشی شنا';
  const poolLocation = course?.pool_location || swimmer.pool_location || 'استخر شهید رئیسی';
  const daysOfWeek = course?.days_of_week || swimmer.days_of_week || 'سه‌شنبه و پنج‌شنبه';
  const timeDisplay = course?.time_display || swimmer.time_display || '۱۷:۰۰ الی ۱۹:۰۰';

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
      {/* 1. TOP SECTION: Swimmer Profile (Avatar on right, info center, status badge on left) */}
      <div className="flex items-start justify-between gap-2.5 min-w-0">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Swimmer Avatar (Large & Crisp) */}
          <div className="relative shrink-0">
            {swimmerAvatar ? (
              <img
                src={swimmerAvatar}
                alt={swimmerName}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-sky-400 dark:border-sky-500 shadow-2xs group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-base shadow-2xs group-hover:scale-105 transition-transform">
                {swimmerName.charAt(0)}
              </div>
            )}
            <span className="absolute -bottom-0.5 -left-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
          </div>

          {/* Swimmer Details: Name, Phone, Level Pill, Gender Pill */}
          <div className="min-w-0 flex-1">
            <h3
              className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug truncate"
              title={swimmerName}
            >
              {swimmerName}
            </h3>

            {swimmerPhone && (
              <div className="mt-0.5">
                <span className="text-[11px] font-mono text-slate-400 dark:text-slate-400 block truncate">
                  {swimmerPhone}
                </span>
              </div>
            )}

            <div className="mt-1 flex items-center flex-wrap gap-1.5">
              {/* Level Badge */}
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[10px] font-bold border border-sky-200/60 dark:border-sky-800 whitespace-nowrap"
                title={swimmerLevel}
              >
                <Award className="w-3 h-3 text-sky-500 shrink-0" />
                <span className="truncate max-w-[110px]">{swimmerLevel}</span>
              </span>

              {/* Gender Badge */}
              {swimmerGender === 'MALE' && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold border border-blue-200/70 dark:border-blue-800 whitespace-nowrap">
                  پسر
                </span>
              )}
              {swimmerGender === 'FEMALE' && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 text-[10px] font-bold border border-pink-200/70 dark:border-pink-800 whitespace-nowrap">
                  دختر
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status Badge at TOP-LEFT: Never wraps to two lines */}
        <div className="shrink-0 pt-0.5">
          <Badge
            variant={status === 'ACTIVE' ? 'success' : status === 'PENDING_PAYMENT' ? 'warning' : 'neutral'}
            className="whitespace-nowrap shrink-0 text-[11px] px-2.5 py-1"
          >
            {status === 'ACTIVE' ? 'ثبت‌نام قطعی' : status === 'PENDING_PAYMENT' ? 'در انتظار پرداخت' : status}
          </Badge>
        </div>
      </div>

      {/* 2. MIDDLE SECTION: Course, Pool, Schedule & Change Class Action */}
      <div className="my-3.5 p-3 sm:p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 space-y-2 text-xs">
        {/* Course Title & Sessions */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-700/50 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <BookOpen className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
            <span
              className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate"
              title={courseName}
            >
              {courseName}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 shrink-0 whitespace-nowrap bg-white dark:bg-slate-900/60 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/50 shadow-2xs">
            {sessionsAttended} از {sessionsPurchased} جلسه
          </span>
        </div>

        {/* Location & Time with Change Class Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate" title={poolLocation}>
                {poolLocation}
              </span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">
                {daysOfWeek}
              </span>
              <span className="font-mono text-slate-400 dark:text-slate-500 shrink-0 whitespace-nowrap">
                ({timeDisplay})
              </span>
            </div>
          </div>

          {/* Change Class / Course button */}
          {onChangeClass && (
            <button
              type="button"
              onClick={onChangeClass}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/70 border border-sky-200/80 dark:border-sky-800/80 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs shrink-0 self-end"
              title="تغییر کلاس یا انتقال به دوره دیگر"
            >
              <ArrowLeftRight className="w-3 h-3 text-sky-600 dark:text-sky-400 shrink-0" />
              <span className="whitespace-nowrap">تغییر کلاس</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. BOTTOM SECTION: Coach Selector and Dossier Action (Single line buttons) */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        {/* Coach Selector / Avatar at BOTTOM-LEFT */}
        <div className="flex items-center min-w-0">
          <CoachSelectorDropdown
            currentCoach={coach}
            availableCoaches={availableCoaches}
            allCoaches={allCoaches}
            onSelectCoach={onSelectCoach}
            placement="dropup"
            size="md"
          />
        </div>

        {/* Dossier Action Button */}
        <div className="flex items-center shrink-0">
          {onOpenDossier && (
            <button
              type="button"
              onClick={onOpenDossier}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
              title="مشاهده پرونده جامع شناگر"
            >
              <Eye className="w-3.5 h-3.5 shrink-0" />
              <span>پرونده</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
