import React, { useState } from 'react';
import { Award, ShieldAlert, History } from 'lucide-react';
import { CoachPerformanceTab } from './CoachPerformanceTab';
import { CoachNotesTab } from './CoachNotesTab';
import { CoachTimelineTab } from './CoachTimelineTab';

export const CoachEvaluationAndRecordsTab = ({
  coach,
  evaluations,
  onEvaluationsUpdated,
  notes,
  onNotesUpdated,
}) => {
  const [subTab, setSubTab] = useState('PERFORMANCE'); // 'PERFORMANCE' | 'NOTES' | 'TIMELINE'

  const evalsCount = (evaluations || []).length;
  const notesCount = (notes || []).length;

  return (
    <div className="space-y-6">
      {/* Sub-navigation Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-2.5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto scrollbar-none w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSubTab('PERFORMANCE')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              subTab === 'PERFORMANCE'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span>ارزیابی عملکرد ۸ شاخصه</span>
            {evalsCount > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-bold bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                {evalsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubTab('NOTES')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              subTab === 'NOTES'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span>مکاتبات و اخطارهای اداری</span>
            {notesCount > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                {notesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubTab('TIMELINE')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              subTab === 'TIMELINE'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span>تاریخچه زمانی رویدادها</span>
          </button>
        </div>

        <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 px-3 hidden lg:inline">
          {subTab === 'PERFORMANCE' && 'سوابق امتیازدهی، بازخوردها و نقاط قوت و ضعف'}
          {subTab === 'NOTES' && 'ثبت تذکرات، تشویقی‌ها و مکاتبات انضباطی'}
          {subTab === 'TIMELINE' && 'لاگ کرونولوژیک کلیه رویدادهای پرسنلی مربی'}
        </span>
      </div>

      {/* Sub-tab Content */}
      <div>
        {subTab === 'PERFORMANCE' && (
          <CoachPerformanceTab
            coach={coach}
            evaluations={evaluations}
            onEvaluationsUpdated={onEvaluationsUpdated}
          />
        )}
        {subTab === 'NOTES' && (
          <CoachNotesTab
            coach={coach}
            notes={notes}
            onNotesUpdated={onNotesUpdated}
          />
        )}
        {subTab === 'TIMELINE' && <CoachTimelineTab coach={coach} />}
      </div>
    </div>
  );
};
