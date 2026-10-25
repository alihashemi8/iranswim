import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({ title = 'موردی یافت نشد', description = 'هیچ رکوردی برای نمایش وجود ندارد.', action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
      <div className="p-3 bg-white rounded-full shadow-xs text-slate-400 mb-3">
        <Inbox className="w-8 h-8" />
      </div>
      <h4 className="text-base font-medium text-slate-700">{title}</h4>
      <p className="text-sm text-slate-500 max-w-sm mt-1">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
