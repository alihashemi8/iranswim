import React from 'react';
import { Users, CheckCircle2, Calendar, Award } from 'lucide-react';

export const LeagueStatsCards = ({ stats }) => {
  if (!stats) return null;

  const totalPoints = Number(stats.total_points_sum || 0);
  const activeSwimmers = Number(stats.participants_count || 0);
  const completedComps = Number(stats.completed_competitions_count || 0);
  const upcomingComps = Number(stats.upcoming_competitions_count || 0);
  const totalRecords = Number(stats.total_records_count || 0);

  const cards = [
    {
      title: 'شناگران فعال',
      value: activeSwimmers.toLocaleString('en-US'),
      label: 'شناگران حاضر در لیگ',
      context: 'ورودی‌های فعال در رده‌های فصلی',
      icon: Users,
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-100',
    },
    {
      title: 'مسابقات برگزارشده',
      value: completedComps.toLocaleString('en-US'),
      label: 'مسابقات نهایی‌شده',
      context: 'همراه با ثبت تایم و امتیاز رسمی',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    },
    {
      title: 'رویدادهای پیش‌رو',
      value: upcomingComps.toLocaleString('en-US'),
      label: 'مسابقات برنامه‌ریزی‌شده',
      context: 'رویدادهای آینده در تقویم مسابقات',
      icon: Calendar,
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
    },
    {
      title: 'مجموع امتیازات لیگ',
      value: totalPoints.toLocaleString('en-US'),
      label: 'امتیازات ثبت‌شده فصل',
      context: `${totalRecords.toLocaleString('en-US')} رکورد زمانی معتبر`,
      icon: Award,
      iconBg: 'bg-sky-50 text-sky-600 border border-sky-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                {c.title}
              </span>
              <span className={`p-2.5 rounded-xl ${c.iconBg}`}>
                <Icon className="w-4 h-4" />
              </span>
            </div>

            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight">
                {c.value}
              </span>
              <span className="text-xs font-semibold text-slate-700 block mt-1">
                {c.label}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
                {c.context}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
