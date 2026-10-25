import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({ title = 'موردی یافت نشد', description = 'هیچ رکوردی برای نمایش وجود ندارد.', action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 transition-colors">
      <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-xs text-slate-400 dark:text-slate-500 mb-3 border border-slate-100 dark:border-slate-700">
        <Inbox className="w-8 h-8" />
      </div>
      <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">{title}</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
