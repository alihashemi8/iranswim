import React from 'react';

/**
 * Base atomic Skeleton component with smooth shimmer effect
 */
export const Skeleton = ({ className = '', rounded = 'rounded-xl', ...props }) => {
  return (
    <div
      className={`relative overflow-hidden bg-slate-200/80 dark:bg-slate-800/80 ${rounded} ${className} before:absolute before:inset-0 before:translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 dark:before:via-white/10 before:to-transparent`}
      {...props}
    />
  );
};

/**
 * Skeleton for Stats Cards Grid (like top dashboard counters)
 */
export const StatsCardsSkeleton = ({ count = 4, className = 'grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4' }) => {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-4 w-24 sm:w-28 rounded-md" />
            <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl shrink-0" />
          </div>
          <div className="mt-3 sm:mt-4 space-y-2">
            <Skeleton className="h-7 w-20 sm:w-28 rounded-lg" />
            <Skeleton className="h-3 w-32 sm:w-36 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton for Table pages (e.g. Swimmers, Coaches, Attendance, Finance, Audit, etc.)
 */
export const TableSkeleton = ({
  rows = 5,
  showFilters = true,
  showStats = false,
  showPagination = true,
  columnsCount = 5,
}) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Optional Top Stats Skeleton */}
      {showStats && <StatsCardsSkeleton count={4} />}

      {/* Filter / Search Bar Skeleton */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-1 items-center gap-3">
            <Skeleton className="h-10 w-full sm:max-w-xs rounded-xl" />
            <Skeleton className="h-10 w-28 sm:w-36 rounded-xl hidden sm:block shrink-0" />
            <Skeleton className="h-10 w-28 sm:w-32 rounded-xl hidden md:block shrink-0" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>
      )}

      {/* Table Container Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs">
        {/* Table Header Row Skeleton */}
        <div className="hidden md:flex items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800/80">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>

        {/* Table Rows Skeleton */}
        <div className="space-y-3 sm:space-y-4">
          {Array.from({ length: rows }).map((_, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60"
            >
              {/* Primary Identity / Title */}
              <div className="flex items-center gap-3 min-w-[200px]">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-28 sm:w-36 rounded-md" />
                  <Skeleton className="h-3 w-20 sm:w-24 rounded-md" />
                </div>
              </div>

              {/* Middle Columns */}
              <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
                <Skeleton className="h-3.5 w-24 rounded-md" />
                <Skeleton className="h-3.5 w-20 rounded-md" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>

              {/* Actions Skeleton */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <Skeleton className="h-8 w-16 sm:w-20 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Table Pagination Skeleton */}
        {showPagination && (
          <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-100 dark:border-slate-800">
            <Skeleton className="h-4 w-28 rounded-md" />
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Skeleton for Grid/Card views (e.g. Courses, News, Leagues)
 */
export const CardsSkeleton = ({ count = 6, showFilters = true }) => {
  return (
    <div className="space-y-5">
      {/* Filter bar */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3">
          <Skeleton className="h-10 w-full sm:max-w-xs rounded-xl" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-16 rounded-md" />
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-5 w-3/4 rounded-lg" />
                <Skeleton className="h-3.5 w-full rounded-md" />
                <Skeleton className="h-3.5 w-2/3 rounded-md" />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton for List items (e.g. Announcements, Audit Logs, Security Activity)
 */
export const ListSkeleton = ({ count = 5 }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <Skeleton className="h-5 w-36 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 flex items-start justify-between gap-4"
        >
          <div className="flex items-start gap-3.5 flex-1">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4.5 w-3/4 max-w-sm rounded-md" />
              <Skeleton className="h-3.5 w-full max-w-md rounded-md" />
              <div className="flex items-center gap-3 pt-1">
                <Skeleton className="h-3 w-20 rounded-md" />
                <Skeleton className="h-3 w-16 rounded-md" />
              </div>
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton for Comprehensive Dashboard (Admin Dashboard, Coach Dashboard, Supervisor Dashboard, Swimmer Portal)
 */
export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Top Welcome / Hero Banner Skeleton */}
      <div className="bg-gradient-to-l from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-md space-y-2.5">
          <Skeleton className="h-7 sm:h-8 w-56 sm:w-72 rounded-xl" />
          <Skeleton className="h-4 w-full max-w-sm rounded-md" />
          <Skeleton className="h-4 w-4/5 max-w-xs rounded-md" />
        </div>
      </div>

      {/* 4 Stats Cards Skeleton */}
      <StatsCardsSkeleton count={4} />

      {/* Charts & Quick Action Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Box */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-7 w-24 rounded-lg" />
          </div>
          {/* Chart Graphic Placeholder */}
          <div className="h-56 sm:h-64 flex items-end justify-between gap-2 pt-6 px-2">
            {[45, 65, 30, 80, 55, 90, 70].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <Skeleton className={`w-full rounded-t-lg`} style={{ height: `${h}%` }} />
                <Skeleton className="h-3 w-8 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* Side Widget / Activity List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
          <div className="space-y-3.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32 rounded-md" />
                  <Skeleton className="h-2.5 w-20 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Table Skeleton */}
      <TableSkeleton rows={4} showFilters={false} showPagination={false} />
    </div>
  );
};

/**
 * Skeleton for Profile & Settings / Detail Pages
 */
export const DetailSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Profile Header Box */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col sm:flex-row items-center gap-5">
        <Skeleton className="w-20 h-20 rounded-full shrink-0" />
        <div className="space-y-2 text-center sm:text-right flex-1">
          <Skeleton className="h-6 w-48 rounded-lg mx-auto sm:mx-0" />
          <Skeleton className="h-4 w-32 rounded-md mx-auto sm:mx-0" />
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <Skeleton className="h-10 w-28 rounded-xl shrink-0" />
        <Skeleton className="h-10 w-28 rounded-xl shrink-0" />
        <Skeleton className="h-10 w-28 rounded-xl shrink-0" />
        <Skeleton className="h-10 w-28 rounded-xl shrink-0" />
      </div>

      {/* Form Grid Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
};
