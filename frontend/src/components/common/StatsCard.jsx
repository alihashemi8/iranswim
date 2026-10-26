import React from 'react';

export const StatsCard = ({ title, value, subtitle, icon: Icon, color = 'sky', className = '' }) => {
  const colorMap = {
    sky: 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-900/60',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/60',
    amber: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/60',
    rose: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/60',
    indigo: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/60',
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all h-full flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex items-start justify-between gap-1.5 sm:gap-2">
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-tight">{title}</span>
          {Icon && (
            <div className={`p-1.5 sm:p-2.5 rounded-xl border shrink-0 ${colorMap[color] || colorMap.sky}`}>
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          )}
        </div>
        <div className="mt-2 sm:mt-3">
          <div className="text-base sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</div>
        </div>
      </div>
      {subtitle && <p className="mt-1.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-tight">{subtitle}</p>}
    </div>
  );
};
