import React, { useState, useMemo } from 'react';
import {
  Trophy, Medal, Search, Filter, TrendingUp, TrendingDown,
  Minus, ChevronRight, ChevronLeft, User, Eye, FileSpreadsheet, Printer,
  ArrowUpDown, ChevronUp, ChevronDown, X, SlidersHorizontal, Award,
  Users
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Pagination } from '../common/Pagination';
import { EmptyState } from '../common/EmptyState';
import { CustomSelect } from '../common/CustomSelect';

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
  // Sorting state: field and direction ('asc' | 'desc')
  const [sortField, setSortField] = useState('rank'); // 'rank' | 'points' | 'medals' | 'matches' | 'name'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  // Advanced filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [onlyMedalists, setOnlyMedalists] = useState(false);
  const [onlyWithMatches, setOnlyWithMatches] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Toggle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      // Defaults: points, medals, matches usually default to desc (highest first)
      if (['points', 'medals', 'matches'].includes(field)) {
        setSortOrder('desc');
      } else {
        setSortOrder('asc');
      }
    }
    setCurrentPage(1);
  };

  // Filtered & Sorted Leaderboard
  const processedLeaderboard = useMemo(() => {
    let list = [...leaderboard];

    // Advanced filters
    if (onlyMedalists) {
      list = list.filter((r) => (r.gold_medals || 0) + (r.silver_medals || 0) + (r.bronze_medals || 0) > 0);
    }
    if (onlyWithMatches) {
      list = list.filter((r) => (r.matches_count || 0) > 0);
    }

    // Sort
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'points') {
        valA = Number(a.total_points || 0);
        valB = Number(b.total_points || 0);
      } else if (sortField === 'medals') {
        valA = (a.gold_medals || 0) * 100 + (a.silver_medals || 0) * 10 + (a.bronze_medals || 0);
        valB = (b.gold_medals || 0) * 100 + (b.silver_medals || 0) * 10 + (b.bronze_medals || 0);
      } else if (sortField === 'matches') {
        valA = Number(a.matches_count || 0);
        valB = Number(b.matches_count || 0);
      } else if (sortField === 'name') {
        valA = a.swimmer_name || '';
        valB = b.swimmer_name || '';
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        // default rank
        valA = Number(a.rank || 9999);
        valB = Number(b.rank || 9999);
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [leaderboard, onlyMedalists, onlyWithMatches, sortField, sortOrder]);

  // Paginated slice
  const totalItems = processedLeaderboard.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedLeaderboard.slice(start, start + pageSize);
  }, [processedLeaderboard, currentPage, pageSize]);

  // Reset all filters
  const handleResetFilters = () => {
    onCategoryChange('');
    onGenderChange('');
    onSearchChange('');
    setOnlyMedalists(false);
    setOnlyWithMatches(false);
    setSortField('rank');
    setSortOrder('asc');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    selectedCategory || selectedGender || searchQuery || onlyMedalists || onlyWithMatches
  );

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
    );
  };

  // Category options for CustomSelect
  const categoryOptions = useMemo(() => [
    { value: '', label: 'همه رده‌های سنی' },
    ...categories.map((cat) => ({
      value: String(cat.id),
      label: cat.title,
      badge: cat.age_min != null && cat.age_max != null ? `${cat.age_min} تا ${cat.age_max} سال` : undefined,
    })),
  ], [categories]);

  // Gender options for CustomSelect
  const genderOptions = [
    { value: '', label: 'همه جنسیت‌ها' },
    { value: 'MALE', label: 'پسران', badge: 'پسر' },
    { value: 'FEMALE', label: 'دختران', badge: 'دختر' },
  ];

  // Sort options for CustomSelect
  const sortOptions = [
    { value: 'rank-asc', label: 'مرتب‌سازی: رتبه لیگ' },
    { value: 'points-desc', label: 'مرتب‌سازی: بیشترین امتیاز' },
    { value: 'medals-desc', label: 'مرتب‌سازی: بیشترین مدال طلا' },
    { value: 'matches-desc', label: 'مرتب‌سازی: بیشترین تعداد مسابقه' },
    { value: 'name-asc', label: 'مرتب‌سازی: حروف الفبا' },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* 1. Dedicated Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3 w-full relative z-20">
        {/* Row 1: Primary Frequently Used Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Search Input */}
            <div className="relative min-w-[200px] max-w-sm flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="جستجوی نام شناگر..."
                className="w-full text-xs sm:text-sm pr-9 pl-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all h-9"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Age Category Dropdown */}
            <div className="w-full sm:w-auto min-w-[170px] sm:max-w-xs">
              <CustomSelect
                value={selectedCategory ? String(selectedCategory) : ''}
                onChange={(val) => {
                  onCategoryChange(val);
                  setCurrentPage(1);
                }}
                placeholder="همه رده‌های سنی"
                icon={Award}
                size="sm"
                color="blue"
                clearable
                searchable={categories.length > 6}
                options={categoryOptions}
              />
            </div>

            {/* Gender Filter */}
            <div className="w-full sm:w-auto min-w-[130px]">
              <CustomSelect
                value={selectedGender}
                onChange={(val) => {
                  onGenderChange(val);
                  setCurrentPage(1);
                }}
                placeholder="همه جنسیت‌ها"
                icon={Users}
                size="sm"
                color="blue"
                clearable
                options={genderOptions}
              />
            </div>

            {/* Sort Dropdown */}
            <div className="w-full sm:w-auto min-w-[185px]">
              <CustomSelect
                value={`${sortField}-${sortOrder}`}
                onChange={(val) => {
                  const [f, o] = val.split('-');
                  setSortField(f);
                  setSortOrder(o);
                  setCurrentPage(1);
                }}
                icon={ArrowUpDown}
                size="sm"
                color="blue"
                isActive={sortField !== 'rank' || sortOrder !== 'asc'}
                options={sortOptions}
              />
            </div>

            {/* Expand Advanced Filters Button */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              className={`p-2 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                showAdvancedFilters || onlyMedalists || onlyWithMatches
                  ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
              title="فیلترهای پیشرفته"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>فیلترهای بیشتر</span>
              {(onlyMedalists || onlyWithMatches) && (
                <span className="w-2 h-2 rounded-full bg-blue-600" />
              )}
            </button>
          </div>

          {/* Export Action & Counts */}
          <div className="flex items-center justify-between lg:justify-end gap-3 text-xs sm:text-sm border-t lg:border-t-0 pt-2 lg:pt-0">
            <span className="text-slate-600 text-xs sm:text-sm font-medium">
              تعداد: <strong className="font-mono text-slate-900 font-black">{totalItems}</strong> شناگر
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={onExportCsv}
              disabled={!leaderboard.length}
              className="gap-1.5 text-xs sm:text-sm h-8.5 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>خروجی اکسل</span>
            </Button>
          </div>
        </div>

        {/* Row 2: Expandable Advanced Filters */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={onlyMedalists}
                  onChange={(e) => {
                    setOnlyMedalists(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span>فقط دارندگان مدال (طلا، نقره، برنز)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={onlyWithMatches}
                  onChange={(e) => {
                    setOnlyWithMatches(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span>دارای حضور ثبت‌شده در مسابقات</span>
              </label>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs sm:text-sm text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>پاک‌کردن همه فیلترها</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Leaderboard Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden w-full">
        {loading ? (
          <div className="p-6 space-y-4">
            <div className="animate-pulse space-y-3">
              <div className="h-10 bg-slate-100 rounded-xl w-full" />
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 bg-slate-50 rounded-xl w-full" />
              ))}
            </div>
          </div>
        ) : processedLeaderboard.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="شناگری با این مشخصات یافت نشد"
              description="می‌توانید فیلترهای جستجو یا رده مسابقاتی را تغییر دهید."
              actionLabel={hasActiveFilters ? 'پاک‌کردن فیلترها' : undefined}
              onAction={hasActiveFilters ? handleResetFilters : undefined}
            />
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto w-full">
              <table className="w-full text-sm text-right min-w-[780px]">
                <thead className="bg-slate-50/80 text-xs sm:text-sm font-bold text-slate-700 border-b border-slate-200/80 select-none">
                  <tr>
                    <th
                      onClick={() => handleSort('rank')}
                      className="px-4 py-3.5 text-center w-16 cursor-pointer hover:bg-slate-100/60 transition-colors"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>رتبه</span>
                        {getSortIcon('rank')}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort('name')}
                      className="px-4 py-3.5 cursor-pointer hover:bg-slate-100/60 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>شناگر</span>
                        {getSortIcon('name')}
                      </div>
                    </th>

                    <th className="px-4 py-3.5">رده سنی</th>

                    <th className="px-4 py-3.5 text-center">جنسیت</th>

                    <th
                      onClick={() => handleSort('matches')}
                      className="px-4 py-3.5 text-center cursor-pointer hover:bg-slate-100/60 transition-colors"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>مسابقات</span>
                        {getSortIcon('matches')}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort('medals')}
                      className="px-4 py-3.5 text-center cursor-pointer hover:bg-slate-100/60 transition-colors"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>مدال‌ها</span>
                        {getSortIcon('medals')}
                      </div>
                    </th>

                    <th className="px-4 py-3.5 text-center">روند</th>

                    <th
                      onClick={() => handleSort('points')}
                      className="px-4 py-3.5 text-left cursor-pointer hover:bg-slate-100/60 transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>مجموع امتیازات</span>
                        {getSortIcon('points')}
                      </div>
                    </th>

                    <th className="px-4 py-3.5 text-center w-20">عملیات</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedList.map((row) => {
                    const isRank1 = row.rank === 1;
                    const isRank2 = row.rank === 2;
                    const isRank3 = row.rank === 3;

                    return (
                      <tr
                        key={row.entry_id}
                        onClick={() => onSelectSwimmer && onSelectSwimmer(row.swimmer_id)}
                        className={`transition-colors cursor-pointer group ${
                          isRank1
                            ? 'bg-amber-50/25 hover:bg-amber-50/50'
                            : isRank2
                            ? 'bg-slate-50/40 hover:bg-slate-100/50'
                            : isRank3
                            ? 'bg-amber-900/[0.015] hover:bg-amber-50/30'
                            : 'hover:bg-blue-50/30'
                        }`}
                      >
                        {/* Rank */}
                        <td className="px-4 py-3.5 text-center">
                          {isRank1 ? (
                            <span className="w-8 h-8 mx-auto rounded-full bg-amber-400 text-amber-950 font-black flex items-center justify-center text-sm shadow-2xs ring-2 ring-amber-300/60">
                              🥇
                            </span>
                          ) : isRank2 ? (
                            <span className="w-8 h-8 mx-auto rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-sm shadow-2xs ring-2 ring-slate-300">
                              🥈
                            </span>
                          ) : isRank3 ? (
                            <span className="w-8 h-8 mx-auto rounded-full bg-amber-700/80 text-white font-bold flex items-center justify-center text-sm shadow-2xs ring-2 ring-amber-600/40">
                              🥉
                            </span>
                          ) : (
                            <span className="font-mono text-sm text-slate-600 font-bold">
                              #{row.rank}
                            </span>
                          )}
                        </td>

                        {/* Swimmer Name & Avatar */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
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
                              <div className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                                <span>{row.swimmer_name}</span>
                                {row.rank <= 3 && (
                                  <span className="text-xs bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                                    برتر
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 block font-mono font-medium">
                                {row.age ? `${row.age} سال` : 'عضو آکادمی'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Age Category */}
                        <td className="px-4 py-3.5 text-xs sm:text-sm text-slate-700 font-medium">
                          {row.category_title}
                        </td>

                        {/* Gender */}
                        <td className="px-4 py-3.5 text-center text-xs sm:text-sm">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-lg font-semibold text-xs border ${
                              row.gender === 'FEMALE'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {row.gender_display || (row.gender === 'FEMALE' ? 'دختران' : 'پسران')}
                          </span>
                        </td>

                        {/* Matches Count */}
                        <td className="px-4 py-3.5 text-center font-mono text-xs sm:text-sm font-bold text-slate-800">
                          {row.matches_count || 0}
                        </td>

                        {/* Medals */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1 text-xs font-mono">
                            {row.gold_medals > 0 && (
                              <span className="bg-amber-100 text-amber-950 px-2 py-0.5 rounded-md font-bold flex items-center gap-0.5" title="مدال طلا">
                                🥇 {row.gold_medals}
                              </span>
                            )}
                            {row.silver_medals > 0 && (
                              <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-bold flex items-center gap-0.5" title="مدال نقره">
                                🥈 {row.silver_medals}
                              </span>
                            )}
                            {row.bronze_medals > 0 && (
                              <span className="bg-amber-800/20 text-amber-950 px-2 py-0.5 rounded-md font-bold flex items-center gap-0.5" title="مدال برنز">
                                🥉 {row.bronze_medals}
                              </span>
                            )}
                            {row.gold_medals === 0 && row.silver_medals === 0 && row.bronze_medals === 0 && (
                              <span className="text-slate-400 font-bold">-</span>
                            )}
                          </div>
                        </td>

                        {/* Rank Trend */}
                        <td className="px-4 py-3.5 text-center">
                          {row.rank_trend === 'UP' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs sm:text-sm" title="روند صعودی">
                              <TrendingUp className="w-4 h-4" />
                            </span>
                          ) : row.rank_trend === 'DOWN' ? (
                            <span className="inline-flex items-center gap-1 text-rose-500 font-bold text-xs sm:text-sm" title="روند نزولی">
                              <TrendingDown className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-slate-300 text-xs sm:text-sm" title="بدون تغییر">
                              <Minus className="w-4 h-4" />
                            </span>
                          )}
                        </td>

                        {/* Total Points */}
                        <td className="px-4 py-3.5 text-left font-mono font-black text-blue-700 text-base sm:text-lg">
                          {Number(row.total_points).toLocaleString('en-US')}{' '}
                          <span className="text-xs font-normal text-slate-400">pt</span>
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectSwimmer && onSelectSwimmer(row.swimmer_id);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="مشاهده جزئیات پرونده"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile & Tablet Card View */}
            <div className="lg:hidden divide-y divide-slate-100">
              {paginatedList.map((row) => (
                <div
                  key={row.entry_id}
                  onClick={() => onSelectSwimmer && onSelectSwimmer(row.swimmer_id)}
                  className="p-4 space-y-3 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center font-bold shrink-0 text-base shadow-2xs">
                        {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : (
                          <span className="font-mono text-sm text-slate-800 font-bold">#{row.rank}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">
                          {row.swimmer_name}
                        </h4>
                        <span className="text-slate-500 text-xs sm:text-sm block mt-0.5 font-medium">
                          {row.category_title} • {row.gender === 'FEMALE' ? 'دختران' : 'پسران'}
                        </span>
                      </div>
                    </div>

                    <div className="text-left font-mono font-black text-blue-700 text-base sm:text-lg shrink-0">
                      {Number(row.total_points).toLocaleString('en-US')}{' '}
                      <span className="text-xs font-normal text-slate-400">pt</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs sm:text-sm text-slate-600">
                    <div className="flex items-center gap-3">
                      <span>مسابقات: <strong className="font-mono text-slate-900 font-bold">{row.matches_count || 0}</strong></span>
                      <div className="flex items-center gap-1 font-mono text-xs">
                        {row.gold_medals > 0 && <span className="font-bold">🥇{row.gold_medals}</span>}
                        {row.silver_medals > 0 && <span className="font-bold">🥈{row.silver_medals}</span>}
                        {row.bronze_medals > 0 && <span className="font-bold">🥉{row.bronze_medals}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-blue-600 font-bold text-xs sm:text-sm">
                      <span>مشاهده پرونده</span>
                      <ChevronLeft className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
