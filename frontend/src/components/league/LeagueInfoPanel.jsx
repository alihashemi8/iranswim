import React from 'react';
import {
  Calendar, CheckCircle2, ChevronRight, Edit3, Plus,
  Settings2, Trophy, Clock, Flag, Award
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
    <div className="space-y-4">
      {/* 1. Seasons Switcher Box */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            فصل‌های مسابقاتی
          </span>
          <button
            type="button"
            onClick={onOpenCreateSeasonModal}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-0.5 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>فصل جدید</span>
          </button>
        </div>

        <div className="space-y-1.5">
          {leagues.map((lg) => {
            const isSelected = selectedLeague?.id === lg.id;
            return (
              <button
                key={lg.id}
                type="button"
                onClick={() => onSelectLeague(lg)}
                className={`w-full text-right p-2.5 sm:p-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs font-bold'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <div className="truncate pr-1">
                  <span className="block truncate text-xs">{lg.name}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {lg.season} {lg.status === 'COMPLETED' ? '(پایان‌یافته)' : ''}
                  </span>
                </div>
                {isSelected && <ChevronRight className="w-4 h-4 text-blue-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Active League Information & Progress Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Header with Title & Status */}
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-slate-400">اطلاعات فصل جاری</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
              {selectedLeague.name}
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {selectedLeague.season}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onOpenEditSeasonModal(selectedLeague)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            title="ویرایش مشخصات فصل"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>

        {/* Status Badge & Dates */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-600">
            <span>وضعیت فصل:</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
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

          <div className="flex justify-between items-center text-slate-600">
            <span>تاریخ آغاز:</span>
            <span className="font-mono text-slate-800 font-semibold text-[11px]">
              {new Date(selectedLeague.starts_at).toLocaleDateString('fa-IR-u-nu-latn')}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-600">
            <span>تاریخ پایان:</span>
            <span className="font-mono text-slate-800 font-semibold text-[11px]">
              {new Date(selectedLeague.ends_at).toLocaleDateString('fa-IR-u-nu-latn')}
            </span>
          </div>
        </div>

        {/* 3. Competition Progress Bar */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Flag className="w-3.5 h-3.5 text-blue-600" />
              پیشرفت تقویم مسابقات
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
              کل:{' '}
              <strong className="font-mono text-slate-800">{totalComps}</strong>
            </span>
          </div>
        </div>

        {/* Scoring formula preview */}
        {selectedLeague.rules_description && (
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 space-y-1">
            <span className="font-bold text-slate-700 block">نحوه امتیازدهی:</span>
            <p className="line-clamp-2 leading-relaxed">
              {selectedLeague.rules_description}
            </p>
          </div>
        )}

        {/* 4. Quick Action Buttons */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onSwitchToScoringTab}
            className="w-full text-xs h-8.5 gap-1.5 justify-center border-slate-200 text-slate-700 hover:bg-slate-50 font-bold"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-500" />
            <span>تنظیم قوانین امتیازدهی</span>
          </Button>

          <Button
            size="sm"
            onClick={onOpenCreateCompetitionModal}
            className="w-full text-xs h-8.5 gap-1.5 justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ثبت مسابقه جدید</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
