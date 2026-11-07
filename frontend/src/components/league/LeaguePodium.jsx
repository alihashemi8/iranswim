import React from 'react';
import { Trophy, Medal, Award, Sparkles, ChevronLeft, User } from 'lucide-react';

export const LeaguePodium = ({ topSwimmers = [], onSelectSwimmer }) => {
  if (!topSwimmers || topSwimmers.length === 0) return null;

  const first = topSwimmers.find((s) => s.rank === 1) || topSwimmers[0];
  const second = topSwimmers.find((s) => s.rank === 2) || topSwimmers[1];
  const third = topSwimmers.find((s) => s.rank === 3) || topSwimmers[2];

  const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]} ${parts[1][0]}`;
    return name.slice(0, 2) || 'شناگر';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
            <Trophy className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              سکوی قهرمانی و 3 شناگر برتر فصل
            </h3>
            <p className="text-[11px] text-slate-500">
              پیشتازان جدول رتبه‌بندی بر اساس مجموع امتیازات رسمی رقابت‌ها
            </p>
          </div>
        </div>
      </div>

      {/* 3-Pedestal Championship Podium */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-end pt-2">
        {/* Second Place (Rank 2 - Silver) */}
        {second ? (
          <div
            onClick={() => onSelectSwimmer && onSelectSwimmer(second.swimmer_id)}
            className="order-2 sm:order-1 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl p-4 text-center cursor-pointer transition-all duration-200 hover:shadow-xs group flex flex-col items-center justify-between min-h-[190px]"
          >
            <div className="w-full flex justify-between items-center text-[11px] font-bold text-slate-500">
              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-slate-700 shadow-2xs font-mono">
                🥈 رتبه 2
              </span>
              <span className="text-slate-400">نایب‌قهرمان</span>
            </div>

            <div className="my-2 flex flex-col items-center">
              <div className="relative w-14 h-14 rounded-2xl bg-white border-2 border-slate-300 shadow-2xs flex items-center justify-center overflow-hidden mb-2">
                {second.swimmer_avatar ? (
                  <img
                    src={second.swimmer_avatar}
                    alt={second.swimmer_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-bold text-slate-600 text-sm">
                    {getInitials(second.swimmer_name)}
                  </span>
                )}
              </div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                {second.swimmer_name}
              </h4>
              <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                {second.category_title || 'رده مسابقاتی'}
              </span>
            </div>

            <div className="w-full pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">مجموع امتیاز:</span>
              <span className="font-mono font-black text-slate-800 text-sm">
                {Number(second.total_points).toLocaleString('en-US')}{' '}
                <span className="text-[10px] font-normal text-slate-400">pt</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="order-2 sm:order-1 border border-dashed border-slate-200 rounded-2xl p-4 text-center text-xs text-slate-400 min-h-[190px] flex items-center justify-center">
            در انتظار تعیین نفر دوم
          </div>
        )}

        {/* First Place (Rank 1 - Gold Champion) Elevated */}
        {first && (
          <div
            onClick={() => onSelectSwimmer && onSelectSwimmer(first.swimmer_id)}
            className="order-1 sm:order-2 bg-gradient-to-b from-amber-50/70 to-white hover:from-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition-all duration-200 hover:shadow-md group flex flex-col items-center justify-between min-h-[220px] relative -top-1 sm:-top-2 shadow-xs"
          >
            {/* Crown / Top Badge */}
            <div className="w-full flex justify-between items-center text-xs font-bold text-amber-800">
              <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-lg shadow-2xs font-mono font-black">
                🥇 رتبه 1
              </span>
              <span className="text-amber-700 font-bold flex items-center gap-1 text-[11px]">
                <Sparkles className="w-3 h-3 text-amber-500" />
                صدرنشین لیگ
              </span>
            </div>

            <div className="my-2 flex flex-col items-center">
              <div className="relative w-16 h-16 rounded-2xl bg-white border-2 border-amber-400 shadow-md flex items-center justify-center overflow-hidden mb-2 ring-4 ring-amber-100">
                {first.swimmer_avatar ? (
                  <img
                    src={first.swimmer_avatar}
                    alt={first.swimmer_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-black text-amber-800 text-base">
                    {getInitials(first.swimmer_name)}
                  </span>
                )}
              </div>
              <h4 className="font-black text-slate-900 text-base group-hover:text-amber-700 transition-colors">
                {first.swimmer_name}
              </h4>
              <span className="text-[11px] font-medium text-amber-800/80 bg-amber-100/60 px-2 py-0.5 rounded-md mt-1">
                {first.category_title || 'رده مسابقاتی'}
              </span>
            </div>

            <div className="w-full pt-2 border-t border-amber-200/80 flex items-center justify-between text-xs">
              <span className="text-amber-800 text-[11px] font-semibold">مجموع امتیاز:</span>
              <span className="font-mono font-black text-amber-600 text-base">
                {Number(first.total_points).toLocaleString('en-US')}{' '}
                <span className="text-[11px] font-normal text-amber-800/60">امتیاز</span>
              </span>
            </div>
          </div>
        )}

        {/* Third Place (Rank 3 - Bronze) */}
        {third ? (
          <div
            onClick={() => onSelectSwimmer && onSelectSwimmer(third.swimmer_id)}
            className="order-3 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl p-4 text-center cursor-pointer transition-all duration-200 hover:shadow-xs group flex flex-col items-center justify-between min-h-[190px]"
          >
            <div className="w-full flex justify-between items-center text-[11px] font-bold text-amber-900">
              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-amber-200 text-amber-900 shadow-2xs font-mono">
                🥉 رتبه 3
              </span>
              <span className="text-slate-400">مقام سوم</span>
            </div>

            <div className="my-2 flex flex-col items-center">
              <div className="relative w-14 h-14 rounded-2xl bg-white border-2 border-amber-700/50 shadow-2xs flex items-center justify-center overflow-hidden mb-2">
                {third.swimmer_avatar ? (
                  <img
                    src={third.swimmer_avatar}
                    alt={third.swimmer_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-bold text-amber-900 text-sm">
                    {getInitials(third.swimmer_name)}
                  </span>
                )}
              </div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                {third.swimmer_name}
              </h4>
              <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                {third.category_title || 'رده مسابقاتی'}
              </span>
            </div>

            <div className="w-full pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">مجموع امتیاز:</span>
              <span className="font-mono font-black text-slate-800 text-sm">
                {Number(third.total_points).toLocaleString('en-US')}{' '}
                <span className="text-[10px] font-normal text-slate-400">pt</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="order-3 border border-dashed border-slate-200 rounded-2xl p-4 text-center text-xs text-slate-400 min-h-[190px] flex items-center justify-center">
            در انتظار تعیین نفر سوم
          </div>
        )}
      </div>
    </div>
  );
};
