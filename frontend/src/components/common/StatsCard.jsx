import React from 'react';
import { Skeleton } from './Skeleton';

export const StatsCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  badge,
  className = '',
  loading = false,
}) => {
  const colorMap = {
    blue: {
      icon: 'bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border-blue-200/80 dark:border-blue-900/60',
      hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-700/80',
      accentGlow: 'before:bg-blue-500',
    },
    sky: {
      icon: 'bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 border-sky-200/80 dark:border-sky-900/60',
      hoverBorder: 'hover:border-sky-300 dark:hover:border-sky-700/80',
      accentGlow: 'before:bg-sky-500',
    },
    teal: {
      icon: 'bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 border-teal-200/80 dark:border-teal-900/60',
      hoverBorder: 'hover:border-teal-300 dark:hover:border-teal-700/80',
      accentGlow: 'before:bg-teal-500',
    },
    coral: {
      icon: 'bg-orange-50 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400 border-orange-200/80 dark:border-orange-900/60',
      hoverBorder: 'hover:border-orange-300 dark:hover:border-orange-700/80',
      accentGlow: 'before:bg-orange-500',
    },
    violet: {
      icon: 'bg-violet-50 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400 border-violet-200/80 dark:border-violet-900/60',
      hoverBorder: 'hover:border-violet-300 dark:hover:border-violet-700/80',
      accentGlow: 'before:bg-violet-500',
    },
    emerald: {
      icon: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-900/60',
      hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700/80',
      accentGlow: 'before:bg-emerald-500',
    },
    amber: {
      icon: 'bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-900/60',
      hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-700/80',
      accentGlow: 'before:bg-amber-500',
    },
    rose: {
      icon: 'bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-900/60',
      hoverBorder: 'hover:border-rose-300 dark:hover:border-rose-700/80',
      accentGlow: 'before:bg-rose-500',
    },
    indigo: {
      icon: 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-900/60',
      hoverBorder: 'hover:border-indigo-300 dark:hover:border-indigo-700/80',
      accentGlow: 'before:bg-indigo-500',
    },
  };

  const currentStyle = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`relative bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs ${currentStyle.hoverBorder} transition-all duration-200 h-full flex flex-col justify-between overflow-hidden group ${className}`}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200 leading-snug">
            {title}
          </span>
          {Icon && (
            <div
              className={`p-2 rounded-xl border shrink-0 transition-transform duration-200 group-hover:scale-105 ${currentStyle.icon}`}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          )}
        </div>
        <div className="mt-2.5 sm:mt-3 flex items-baseline gap-2 flex-wrap">
          {loading ? (
            <Skeleton className="h-7 sm:h-8 w-24 sm:w-28 rounded-lg" />
          ) : (
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {value}
            </div>
          )}
          {badge && !loading && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {badge}
            </span>
          )}
        </div>
      </div>
      {subtitle && (
        <p className="mt-2 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};
