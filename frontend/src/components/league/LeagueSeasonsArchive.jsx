import React from 'react';
import {
  Calendar, Trophy, Users, CheckCircle2, Archive,
  Plus, Edit3, ArrowLeft, ShieldAlert, Sparkles, Check
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export const LeagueSeasonsArchive = ({
  leagues = [],
  selectedLeague,
  onSelectLeague,
  onOpenCreateModal,
  onOpenEditModal,
  onToggleStatus,
}) => {
  const getStatusBadge = (status, isActive) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
            فعال و در جریان
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
            پایان‌یافته / آرشیو
          </span>
        );
      case 'DRAFT':
        return (
          <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            پیش‌نویس
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
            بایگانی
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Archive className="w-5 h-5 text-amber-500" />
            فصل‌های مسابقاتی و آرشیو دوره‌های لیگ
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            مدیریت فصول، تعیین دوره فعال و مشاهده سوابق و جداول نهایی دوره‌های گذشته
          </p>
        </div>

        <Button
          onClick={onOpenCreateModal}
          className="gap-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>ایجاد دوره / فصل جدید</span>
        </Button>
      </div>

      {/* Grid of Seasons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {leagues.map((lg) => {
          const isCurrent = selectedLeague?.id === lg.id;

          return (
            <div
              key={lg.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-xs transition-all space-y-4 ${
                isCurrent
                  ? 'border-amber-400 dark:border-amber-700 ring-2 ring-amber-400/20'
                  : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {lg.name}
                    </h3>
                    {getStatusBadge(lg.status, lg.is_active)}
                  </div>
                  <span className="text-xs font-semibold text-slate-400 block">
                    {lg.season}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenEditModal(lg)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="ویرایش فصل"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              {/* Dates & Rules */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>بازه زمانی برگزاری:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                    {new Date(lg.starts_at).toLocaleDateString('fa-IR-u-nu-latn')} تا {new Date(lg.ends_at).toLocaleDateString('fa-IR-u-nu-latn')}
                  </span>
                </div>
                {lg.rules_description && (
                  <p className="text-[11px] text-slate-500 line-clamp-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    {lg.rules_description}
                  </p>
                )}
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 block">شناگران</span>
                  <span className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
                    {lg.participants_count || 0}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 block">مسابقات</span>
                  <span className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
                    {lg.competitions_count || 0}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 block">مجموع امتیاز</span>
                  <span className="text-sm font-mono font-bold text-amber-600 dark:text-amber-400">
                    {Number(lg.total_points_sum || 0).toLocaleString('en-US')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
                <Button
                  variant={isCurrent ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => onSelectLeague(lg)}
                  className={`text-xs h-8.5 font-bold ${
                    !isCurrent ? 'bg-amber-500 hover:bg-amber-600 text-slate-950' : 'text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {isCurrent ? 'فصل فعال در پنل' : 'انتخاب و مشاهده این فصل'}
                </Button>

                <div className="flex items-center gap-1.5">
                  {lg.status === 'ACTIVE' ? (
                    <button
                      type="button"
                      onClick={() => onToggleStatus(lg, 'COMPLETED')}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="بستن و خاتمه فصل"
                    >
                      خاتمه فصل
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onToggleStatus(lg, 'ACTIVE')}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                      title="فعال‌سازی این فصل"
                    >
                      فعال‌سازی فصل
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
