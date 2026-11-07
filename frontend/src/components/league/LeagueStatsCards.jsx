import React from 'react';
import { Users, Trophy, Calendar, Timer, Medal, Sparkles, TrendingUp } from 'lucide-react';

export const LeagueStatsCards = ({ stats, onSelectSwimmer }) => {
  if (!stats) return null;

  const cards = [
    {
      title: 'شرکت‌کنندگان',
      count: stats.participants_count ?? 0,
      label: 'شناگران حاضر در لیگ',
      sublabel: 'ورودی‌های فعال در رده‌های مسابقاتی',
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400',
      borderAccent: 'hover:border-blue-300 dark:hover:border-blue-700',
    },
    {
      title: 'مسابقات',
      count: stats.completed_competitions_count ?? 0,
      label: 'مسابقات برگزارشده',
      sublabel: 'نتایج نهایی و رتبه‌بندی ثبت‌شده',
      icon: Trophy,
      color: 'amber',
      bgColor: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
      borderAccent: 'hover:border-amber-300 dark:hover:border-amber-700',
    },
    {
      title: 'فعال / پیش‌رو',
      count: stats.upcoming_competitions_count ?? 0,
      label: 'رویدادهای پیش‌رو',
      sublabel: 'برنامه‌ریزی‌شده در تقویم فصل',
      icon: Calendar,
      color: 'emerald',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
      borderAccent: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    },
    {
      title: 'رکوردها',
      count: stats.total_records_count ?? 0,
      label: 'رکورد ثبت‌شده در فصل',
      sublabel: 'تایم‌های زمانی رسمی و معتبر',
      icon: Timer,
      color: 'rose',
      bgColor: 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400',
      borderAccent: 'hover:border-rose-300 dark:hover:border-rose-700',
    },
  ];

  return (
    <div className="space-y-4">
      {/* 4 Primary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-all duration-200 hover:shadow-md ${c.borderAccent}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {c.title}
                </span>
                <span className={`p-2 rounded-xl ${c.bgColor}`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
                  {Number(c.count).toLocaleString('fa-IR')}
                </span>
              </div>
              <div className="mt-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                  {c.label}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1">
                  {c.sublabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Podium Highlights Bar (نفرات برتر فصل) */}
      {stats.podium && stats.podium.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent dark:from-amber-950/30 dark:via-amber-900/10 dark:to-transparent border border-amber-200/70 dark:border-amber-900/50 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-500 text-white shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-amber-950 dark:text-amber-200 block">
                سکوی پیشتازان {stats.league_name}
              </span>
              <span className="text-[11px] text-amber-800/80 dark:text-amber-400/80">
                مجموع امتیازات معتبر ثبت‌شده: {Number(stats.total_points_sum || 0).toLocaleString('fa-IR')} امتیاز
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {stats.podium.map((pod) => (
              <button
                key={pod.swimmer_id}
                type="button"
                onClick={() => onSelectSwimmer && onSelectSwimmer(pod.swimmer_id)}
                className="flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 border border-amber-200 dark:border-amber-800/60 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all shadow-2xs cursor-pointer group"
                title="مشاهده جزئیات عملکرد"
              >
                <span className="text-base">
                  {pod.rank === 1 ? '🥇' : pod.rank === 2 ? '🥈' : '🥉'}
                </span>
                <span className="font-bold group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {pod.swimmer_name}
                </span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-lg text-[11px]">
                  {Number(pod.total_points).toLocaleString('fa-IR')} امتیاز
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
