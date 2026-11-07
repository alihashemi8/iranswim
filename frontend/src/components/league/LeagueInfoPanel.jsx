import React from 'react';
import {
  Calendar, CheckCircle2, ChevronRight, Edit3, Plus,
  Settings2, Trophy, Clock, Flag, Award, Sparkles
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

export const LeagueInfoPanel = ({
  leagues = [],
  selectedLeague,
  onSelectLeague,
  onOpenCreateSeasonModal,
  onOpenEditSeasonModal,
  onOpenCreateCompetitionModal,
  onSwitchToScoringTab,
}) => {
  if (!selectedLeague) return null;

  const totalComps = Number(selectedLeague.competitions_count || 0);
  const completedComps = Number(selectedLeague.completed_competitions_count || 0);
  const remainingComps = Math.max(totalComps - completedComps, 0);
  const progressPercent = totalComps > 0 ? Math.min(Math.round((completedComps / totalComps) * 100), 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4 w-full">
      {/* 1. Seasons Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-xs font-bold text-slate-500 shrink-0 flex items-center gap-1.5 ml-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            فصل‌های مسابقاتی:
          </span>
          <div className="flex items-center gap-1.5 flex-nowrap">
            {leagues.map((lg) => {
              const isSelected = selectedLeague?.id === lg.id;
              return (
                <button
                  key={lg.id}
                  type="button"
                  onClick={() => onSelectLeague(lg)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                  }`}
                >
                  <span>{lg.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/60 text-slate-500'
                    }`}
                  >
                    {lg.season}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenCreateSeasonModal}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>ایجاد فصل مسابقاتی جدید</span>
        </button>
      </div>

      {/* 2. Active Season Overview & Competition Progress (Horizontal Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
        {/* Col 1: Active Season Title, Status, and Edit (4 cols) */}
        <div className="lg:col-span-4 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-400">اطلاعات فصل فعال</span>
            <span
              className={`px-2 py-0.2 rounded-md text-[10px] font-bold border ${
                selectedLeague.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : selectedLeague.status === 'COMPLETED'
                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {selectedLeague.status === 'ACTIVE'
                ? 'فعال و در جریان'
                : selectedLeague.status === 'COMPLETED'
                ? 'پایان‌یافته'
                : 'پیش‌نویس'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              {selectedLeague.name}
            </h3>
            <button
              type="button"
              onClick={() => onOpenEditSeasonModal(selectedLeague)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="ویرایش مشخصات فصل"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>
              آغاز:{' '}
              <strong className="font-mono text-slate-800 font-semibold">
                {new Date(selectedLeague.starts_at).toLocaleDateString('fa-IR-u-nu-latn')}
              </strong>
            </span>
            <span>•</span>
            <span>
              پایان:{' '}
              <strong className="font-mono text-slate-800 font-semibold">
                {new Date(selectedLeague.ends_at).toLocaleDateString('fa-IR-u-nu-latn')}
              </strong>
            </span>
          </div>
        </div>

        {/* Col 2: Competition Progress Bar (5 cols) */}
        <div className="lg:col-span-5 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Flag className="w-3.5 h-3.5 text-blue-600" />
              پیشرفت تقویم مسابقات لیگ
            </span>
            <span className="font-mono font-black text-blue-700 text-xs">
              {progressPercent}%
            </span>
          </div>

          {/* Clean Progress Track */}
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span>
              برگزارشده:{' '}
              <strong className="font-mono text-slate-800">{completedComps}</strong>
            </span>
            <span>
              باقیمانده:{' '}
              <strong className="font-mono text-slate-800">{remainingComps}</strong>
            </span>
            <span>
              کل رویدادها:{' '}
              <strong className="font-mono text-slate-800">{totalComps}</strong>
            </span>
          </div>
        </div>

        {/* Col 3: Quick Action Buttons (3 cols) */}
        <div className="lg:col-span-3 flex flex-row lg:flex-col gap-2 justify-end">
          <Button
            size="sm"
            onClick={onOpenCreateCompetitionModal}
            className="w-full text-xs h-8.5 gap-1.5 justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>تعریف مسابقه جدید</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onSwitchToScoringTab}
            className="w-full text-xs h-8.5 gap-1.5 justify-center border-slate-200 text-slate-700 hover:bg-slate-50 font-bold cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-500" />
            <span>تنظیم قوانین امتیازدهی</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
