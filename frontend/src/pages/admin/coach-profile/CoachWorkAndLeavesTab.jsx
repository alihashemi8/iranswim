import React, { useState } from 'react';
import { ClipboardCheck, Calendar } from 'lucide-react';
import { CoachAttendanceTab } from './CoachAttendanceTab';
import { CoachLeavesTab } from './CoachLeavesTab';

export const CoachWorkAndLeavesTab = ({ coach, leaves, onLeavesUpdated }) => {
  const [subTab, setSubTab] = useState('ATTENDANCE'); // 'ATTENDANCE' | 'LEAVES'
  const pendingCount = (leaves || []).filter((l) => l.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Sub-navigation Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-2.5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSubTab('ATTENDANCE')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'ATTENDANCE'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span>حضور و کارکرد جلسات</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('LEAVES')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'LEAVES'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span>درخواست‌های مرخصی</span>
            {pendingCount > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-amber-500 text-white font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 px-3 hidden md:inline">
          {subTab === 'ATTENDANCE'
            ? 'ساعات تدریس مصوب و ممیزی جلسات آموزشی'
            : 'مدیریت و تأیید درخواست‌های مرخصی مربی'}
        </span>
      </div>

      {/* Sub-tab Content */}
      <div>
        {subTab === 'ATTENDANCE' && <CoachAttendanceTab coach={coach} />}
        {subTab === 'LEAVES' && (
          <CoachLeavesTab
            coach={coach}
            leaves={leaves}
            onLeavesUpdated={onLeavesUpdated}
          />
        )}
      </div>
    </div>
  );
};
