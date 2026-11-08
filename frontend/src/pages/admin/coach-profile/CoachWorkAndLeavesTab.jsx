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
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
          <button
            type="button"
            onClick={() => setSubTab('ATTENDANCE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'ATTENDANCE'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>حضور و کارکرد جلسات</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('LEAVES')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'LEAVES'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>درخواست‌های مرخصی</span>
            {pendingCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-amber-500 text-white">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        <span className="text-xs text-slate-400 px-3 hidden sm:inline">
          {subTab === 'ATTENDANCE'
            ? 'ساعات تدریس و ممیزی جلسات آموزشی'
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
