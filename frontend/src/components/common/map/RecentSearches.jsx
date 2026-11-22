import React from 'react';
import { History, X, Clock } from 'lucide-react';

export const RecentSearches = ({
  items = [],
  onSelect,
  onClearAll,
  onRemoveItem,
}) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="py-2 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between px-3.5 mb-2">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-slate-400" />
          <span>جستجوهای اخیر شما در قزوین</span>
        </span>
        <button
          type="button"
          onClick={onClearAll}
          className="text-[10px] text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors font-medium cursor-pointer"
        >
          پاک کردن تاریخچه
        </button>
      </div>

      <div className="space-y-0.5">
        {items.map((item, idx) => (
          <div
            key={item.id || `recent-${idx}`}
            className="group flex items-center justify-between px-3.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-right transition-colors"
            onClick={() => onSelect(item)}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-700 dark:text-slate-200 truncate">
                {item.title}
              </span>
            </div>
            {onRemoveItem && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveItem(item);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded-md transition-opacity"
                title="حذف از تاریخچه"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentSearches;
