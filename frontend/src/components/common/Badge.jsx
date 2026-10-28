import React from 'react';

export const Badge = ({ children, variant = 'info', className = '' }) => {
  const styles = {
    // Primary brand blue
    primary: 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    info: 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',

    // Swimming / Progress: Aquatic Teal
    teal: 'bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-200 border-teal-200 dark:border-teal-800',

    // Urgent / Attention / Reminders: Coral
    coral: 'bg-orange-50 dark:bg-orange-950/70 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800',
    warning: 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800',

    // Achievements / Learning / Technical: Soft Violet
    violet: 'bg-violet-50 dark:bg-violet-950/70 text-violet-800 dark:text-violet-200 border-violet-200 dark:border-violet-800',

    // Rewards / Streaks / Points: Warm Amber
    reward: 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800',

    // Success / Completed / Settled: Fresh Green
    success: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800',

    // Critical errors / High alert: Danger Rose
    danger: 'bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800',

    // Neutral
    neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant] || styles.info} ${className}`}
    >
      {children}
    </span>
  );
};
