import React from 'react';
import {
  Trophy, Medal, Search, Filter, TrendingUp, TrendingDown,
  Minus, ChevronRight, User, Eye, FileSpreadsheet
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { LoadingState } from '../common/LoadingState';
import { EmptyState } from '../common/EmptyState';

export const LeagueLeaderboardTable = ({
  leaderboard = [],
  categories = [],
  selectedCategory,
  onCategoryChange,
  selectedGender,
  onGenderChange,
  searchQuery,
  onSearchChange,
  loading,
  onSelectSwimmer,
  onExportCsv,
}) => {
  return (
    <div className="space-y-4">
      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300">رده:</span>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="">همه رده‌های سنی</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.title} ({cat.age_min} تا {cat.age_max} سال)
                </option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300">جنسیت:</span>
            <select
              value={selectedGender}
              onChange={(e) => onGenderChange(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="">همه شناگران</option>
              <option value="MALE">پسران</option>
              <option value="FEMALE">دختران</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[180px] sm:min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="جستجوی شناگر..."
              className="w-full text-xs pr-8 pl-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3 text-xs">
          <span className="font-bold text-slate-500 dark:text-slate-400">
            مجموع رقابت‌کنندگان: <span className="text-slate-900 dark:text-white font-mono">{leaderboard.length}</span> شناگر
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onExportCsv}
            disabled={!leaderboard.length}
            className="gap-1.5 text-xs h-8"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>خروجی اکسل</span>
          </Button>
        </div>
      </div>

      {/* Leaderboard Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors">
        {loading ? (
          <LoadingState type="table" rows={6} message="در حال محاسبه جدول زنده رتبه‌بندی شناگران..." />
        ) : leaderboard.length === 0 ? (
          <EmptyState
            title="هیچ داده‌ای در جدول رتبه‌بندی یافت نشد"
            description="شناگری با فیلترهای انتخابی یافت نشد، یا هنوز نتایج و رکوردی در این لیگ ثبت نشده است."
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm text-right min-w-[760px]">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="px-3.5 py-3.5 text-center rounded-r-xl w-14">رتبه</th>
                    <th className="px-3.5 py-3.5">شناگر</th>
                    <th className="px-3.5 py-3.5">رده سنی</th>
                    <th className="px-3.5 py-3.5 text-center">جنسیت</th>
                    <th className="px-3.5 py-3.5 text-center">تعداد مسابقات</th>
                    <th className="px-3.5 py-3.5 text-center">مدال‌ها</th>
                    <th className="px-3.5 py-3.5 text-center">روند</th>
                    <th className="px-3.5 py-3.5 text-left">مجموع امتیازات</th>
                    <th className="px-3.5 py-3.5 text-center rounded-l-xl w-24">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {leaderboard.map((row) => (
                    <tr
                      key={row.entry_id}
                      onClick={() => onSelectSwimmer && onSelectSwimmer(row.swimmer_id)}
                      className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors cursor-pointer group"
                    >
                      {/* Rank Medal / Number */}
                      <td className="px-3.5 py-3.5 text-center">
                        {row.rank === 1 ? (
                          <span className="w-8 h-8 mx-auto rounded-full bg-amber-400 text-amber-950 font-bold flex items-center justify-center text-sm shadow-2xs ring-2 ring-amber-300/60">
                            🥇
                          </span>
                        ) : row.rank === 2 ? (
                          <span className="w-8 h-8 mx-auto rounded-full bg-slate-300 text-slate-900 font-bold flex items-center justify-center text-sm shadow-2xs ring-2 ring-slate-200">
                            🥈
                          </span>
                        ) : row.rank === 3 ? (
                          <span className="w-8 h-8 mx-auto rounded-full bg-amber-700 text-white font-bold flex items-center justify-center text-sm shadow-2xs ring-2 ring-amber-600/40">
                            🥉
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 font-bold">
                            #{row.rank}
                          </span>
                        )}
                      </td>

                      {/* Swimmer Avatar & Name */}
                      <td className="px-3.5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                            {row.swimmer_avatar ? (
                              <img
                                src={row.swimmer_avatar}
                                alt={row.swimmer_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                              <span>{row.swimmer_name}</span>
                              {row.rank <= 3 && (
                                <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded-md font-normal">
                                  برتر
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                              {row.age ? `${row.age} سال` : 'عضو آکادمی'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-3.5 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                        {row.category_title}
                      </td>

                      {/* Gender */}
                      <td className="px-3.5 py-3.5 text-center text-xs">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-lg font-medium text-[11px] ${
                            row.gender === 'FEMALE'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}
                        >
                          {row.gender_display || (row.gender === 'FEMALE' ? 'دختران' : 'پسران')}
                        </span>
                      </td>

                      {/* Matches Count */}
                      <td className="px-3.5 py-3.5 text-center font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                        {row.matches_count || 0}
                      </td>

                      {/* Medals Badges */}
                      <td className="px-3.5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1 text-[11px] font-mono">
                          {row.gold_medals > 0 && (
                            <span className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5" title="مدال طلا">
                              🥇 {row.gold_medals}
                            </span>
                          )}
                          {row.silver_medals > 0 && (
                            <span className="bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5" title="مدال نقره">
                              🥈 {row.silver_medals}
                            </span>
                          )}
                          {row.bronze_medals > 0 && (
                            <span className="bg-amber-800/20 text-amber-950 dark:bg-amber-950/60 dark:text-amber-300 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5" title="مدال برنز">
                              🥉 {row.bronze_medals}
                            </span>
                          )}
                          {row.gold_medals === 0 && row.silver_medals === 0 && row.bronze_medals === 0 && (
                            <span className="text-slate-300 dark:text-slate-600">-</span>
                          )}
                        </div>
                      </td>

                      {/* Trend */}
                      <td className="px-3.5 py-3.5 text-center">
                        {row.rank_trend === 'UP' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs" title="روند صعودی">
                            <TrendingUp className="w-3.5 h-3.5" />
                          </span>
                        ) : row.rank_trend === 'DOWN' ? (
                          <span className="inline-flex items-center gap-1 text-rose-500 dark:text-rose-400 font-bold text-xs" title="روند نزولی">
                            <TrendingDown className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-slate-400 text-xs" title="بدون تغییر">
                            <Minus className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>

                      {/* Total Points */}
                      <td className="px-3.5 py-3.5 text-left font-mono font-black text-amber-600 dark:text-amber-400 text-base">
                        {Number(row.total_points).toLocaleString('en-US')}{' '}
                        <span className="text-[11px] font-normal text-slate-400">امتیاز</span>
                      </td>

                      {/* Action */}
                      <td className="px-3.5 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSwimmer && onSelectSwimmer(row.swimmer_id);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors"
                          title="مشاهده جزئیات عملکرد"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile & Tablet Card View */}
            <div className="lg:hidden space-y-3">
              {leaderboard.map((row) => (
                <div
                  key={row.entry_id}
                  onClick={() => onSelectSwimmer && onSelectSwimmer(row.swimmer_id)}
                  className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3 cursor-pointer hover:border-amber-300 dark:hover:border-amber-700 transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold shrink-0 text-base shadow-2xs">
                        {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : (
                          <span className="font-mono text-xs text-slate-700 dark:text-slate-300">#{row.rank}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {row.swimmer_name}
                        </h4>
                        <span className="text-slate-400 dark:text-slate-500 text-[11px] block mt-0.5">
                          {row.category_title} • {row.gender === 'FEMALE' ? 'دختران' : 'پسران'}
                        </span>
                      </div>
                    </div>

                    <div className="text-left font-mono font-black text-amber-600 dark:text-amber-400 text-lg shrink-0">
                      {Number(row.total_points).toLocaleString('en-US')} <span className="text-xs font-normal text-slate-400">امتیاز</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span>مسابقات: <strong className="font-mono text-slate-800 dark:text-slate-200">{row.matches_count || 0}</strong></span>
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        {row.gold_medals > 0 && <span>🥇{row.gold_medals}</span>}
                        {row.silver_medals > 0 && <span>🥈{row.silver_medals}</span>}
                        {row.bronze_medals > 0 && <span>🥉{row.bronze_medals}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                      <span>مشاهده جزئیات</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
