import React from 'react';
import {
  Skeleton,
  StatsCardsSkeleton,
  TableSkeleton,
  CardsSkeleton,
  ListSkeleton,
  DashboardSkeleton,
  DetailSkeleton,
} from './Skeleton';

export {
  Skeleton,
  StatsCardsSkeleton,
  TableSkeleton,
  CardsSkeleton,
  ListSkeleton,
  DashboardSkeleton,
  DetailSkeleton,
};

/**
 * Universal Skeleton Loading State for Panels and Components.
 * Replaces old spinning loaders with sleek, animated skeleton layouts.
 */
export const LoadingState = ({
  type = 'table',
  message,
  rows = 5,
  count = 6,
  className = '',
}) => {
  return (
    <div className={`w-full transition-opacity duration-200 ${className}`}>
      {message && (
        <div className="flex items-center gap-2 mb-3 px-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping inline-block" />
          <span>{message}</span>
        </div>
      )}

      {type === 'dashboard' && <DashboardSkeleton />}
      {type === 'cards' && <CardsSkeleton count={count} />}
      {type === 'list' && <ListSkeleton count={count} />}
      {type === 'detail' && <DetailSkeleton />}
      {type === 'stats' && <StatsCardsSkeleton count={count || 4} />}
      {type === 'table' && <TableSkeleton rows={rows} />}
      {type === 'inline' && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <Skeleton className="h-5 w-48 rounded-lg" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-3/4 rounded-md" />
        </div>
      )}
    </div>
  );
};
