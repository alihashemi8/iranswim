import React, { useState } from 'react';
import {
  Trophy, Calendar, MapPin, Plus, Clock, Edit3, Trash2,
  CheckCircle2, Users, ChevronDown, ChevronUp, Medal, AlertCircle
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { LoadingState } from '../common/LoadingState';

export const LeagueCompetitionsView = ({
  competitions = [],
  loading,
  onOpenCreateModal,
  onOpenEditModal,
  onOpenRecordResultsModal,
  onDeleteCompetition,
  onSelectSwimmer,
}) => {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [expandedCompId, setExpandedCompId] = useState(null);

  const filteredCompetitions = competitions.filter((comp) => {
    if (filterStatus === 'ALL') return true;
    return comp.status === filterStatus;
  });

  const toggleExpand = (id) => {
    setExpandedCompId((prev) => (prev === id ? null : id));
  };

  const getStrokeBadgeColor = (stroke) => {
    switch (stroke) {
      case 'FREESTYLE':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900';
      case 'BACKSTROKE':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900';
      case 'BREASTSTROKE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900';
      case 'BUTTERFLY':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900';
      case 'MEDLEY':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-900';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            فیلتر وضعیت:
          </span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                filterStatus === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              همه ({competitions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('SCHEDULED')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                filterStatus === 'SCHEDULED'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              پیش‌رو
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('COMPLETED')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                filterStatus === 'COMPLETED'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              پایان‌یافته
            </button>
          </div>
        </div>

        <Button
          onClick={onOpenCreateModal}
          className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>تعریف مسابقه جدید</span>
        </Button>
      </div>

      {/* Competitions Cards */}
      {loading ? (
        <LoadingState type="cards" count={3} message="در حال دریافت رویدادها و مسابقات لیگ..." />
      ) : filteredCompetitions.length === 0 ? (
        <EmptyState
          title="مسابقه‌ای یافت نشد"
          description="هنوز رویداد یا مسابقه‌ای با این فیلتر در لیگ تعریف نشده است. می‌توانید با کلیک روی دکمه بالا اولین مسابقه را ایجاد نمایید."
        />
      ) : (
        <div className="space-y-3.5">
          {filteredCompetitions.map((comp) => {
            const isCompleted = comp.status === 'COMPLETED';
            const isExpanded = expandedCompId === comp.id;

            return (
              <div
                key={comp.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700 space-y-4"
              >
                {/* Competition Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {comp.title}
                      </h3>

                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${getStrokeBadgeColor(
                          comp.stroke
                        )}`}
                      >
                        {comp.stroke_display} {comp.distance_meters} متر
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                            : 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-900'
                        }`}
                      >
                        {comp.status_display}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(comp.held_at).toLocaleDateString('fa-IR-u-nu-latn')}
                      </span>
                      {comp.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {comp.location}
                        </span>
                      )}
                      <span>
                        رده: <strong>{comp.category_title || 'عمومی'}</strong> ({comp.gender_display})
                      </span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                    <Button
                      variant={isCompleted ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => onOpenRecordResultsModal(comp)}
                      className={`gap-1.5 text-xs h-8.5 font-bold ${
                        !isCompleted ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''
                      }`}
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>{isCompleted ? 'ویرایش / مشاهده نتایج' : 'ثبت نتایج و زمان‌ها'}</span>
                    </Button>

                    <button
                      type="button"
                      onClick={() => onOpenEditModal(comp)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="ویرایش مشخصات مسابقه"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteCompetition(comp.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="حذف مسابقه"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Notes if available */}
                {comp.notes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    {comp.notes}
                  </p>
                )}

                {/* Completed Results Preview / Accordion */}
                {isCompleted && comp.results && comp.results.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          نفرات برتر و سکو:
                        </span>
                        <div className="flex items-center gap-1.5 text-xs">
                          {comp.results.slice(0, 3).map((r, idx) => (
                            <span
                              key={r.id}
                              onClick={() => onSelectSwimmer && onSelectSwimmer(r.swimmer_id)}
                              className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-2 py-0.5 rounded-lg font-semibold hover:border-amber-400 transition-colors cursor-pointer text-[11px]"
                            >
                              <span>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                              <span className="text-slate-800 dark:text-slate-200">{r.swimmer_name}</span>
                              <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                                {r.formatted_time}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleExpand(comp.id)}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        <span>{isExpanded ? 'بستن لیست' : `مشاهده تمام ${comp.results.length} شناگر`}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Detailed Results Table when expanded */}
                    {isExpanded && (
                      <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-xs text-right">
                          <thead className="bg-slate-50 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                            <tr>
                              <th className="p-2.5 text-center w-12">رتبه</th>
                              <th className="p-2.5">شناگر</th>
                              <th className="p-2.5 font-mono text-center">زمان ثبت‌شده</th>
                              <th className="p-2.5 text-center">مدال</th>
                              <th className="p-2.5 text-left font-mono">امتیاز لیگ</th>
                              <th className="p-2.5">توضیحات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {comp.results.map((res) => (
                              <tr
                                key={res.id}
                                onClick={() => onSelectSwimmer && onSelectSwimmer(res.swimmer_id)}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                              >
                                <td className="p-2.5 text-center font-bold font-mono">
                                  {res.rank === 1 ? '🥇' : res.rank === 2 ? '🥈' : res.rank === 3 ? '🥉' : res.rank}
                                </td>
                                <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                                  {res.swimmer_name}
                                </td>
                                <td className="p-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                                  {res.formatted_time}
                                </td>
                                <td className="p-2.5 text-center">
                                  {res.medal === 'GOLD' ? 'طلا' : res.medal === 'SILVER' ? 'نقره' : res.medal === 'BRONZE' ? 'برنز' : '-'}
                                </td>
                                <td className="p-2.5 text-left font-mono font-bold text-amber-600 dark:text-amber-400">
                                  +{res.score_points}
                                </td>
                                <td className="p-2.5 text-slate-400 text-[11px]">
                                  {res.notes || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
