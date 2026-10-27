import React, { useState, useEffect } from 'react';
import {
  Trophy, Medal, Award, Users, Calendar, Filter,
  Shield, CheckCircle2, ChevronRight, FileSpreadsheet
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { exportToCsv } from '../../utils/exportCsv';

export const AdminLeaguesPage = () => {
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [boardLoading, setBoardLoading] = useState(false);
  const toast = useToast();

  const fetchLeagues = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leagues/');
      const data = res.data.results || res.data;
      setLeagues(data);
      if (data.length > 0) {
        setSelectedLeague(data[0]);
      }
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت اطلاعات لیگ‌های شنا');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeagues();
  }, []);

  // Fetch Leaderboard whenever selectedLeague or selectedCategory changes
  useEffect(() => {
    if (!selectedLeague) return;

    const fetchBoard = async () => {
      try {
        setBoardLoading(true);
        const params = {};
        if (selectedCategory) params.category_id = selectedCategory;

        const res = await api.get(`/leagues/${selectedLeague.id}/leaderboard/`, { params });
        setLeaderboard(res.data);
      } catch (err) {
        console.error(err);
        toast.error('خطا در دریافت جدول رده‌بندی لیگ');
      } finally {
        setBoardLoading(false);
      }
    };

    fetchBoard();
  }, [selectedLeague, selectedCategory]);

  const handleExportCsv = () => {
    if (!leaderboard.length) return;
    const rows = leaderboard.map((row) => ({
      rank: row.rank,
      name: row.swimmer_name,
      category: row.category_title,
      points: row.total_points,
    }));
    exportToCsv(`IranSwim_Leaderboard_${selectedLeague?.name || 'League'}`, rows, {
      rank: 'رتبه',
      name: 'نام شناگر',
      category: 'رده مسابقاتی',
      points: 'مجموع امتیازات رسمی',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            لیگ شنای آکادمی و جدول رتبه‌بندی رقابت‌ها
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            محاسبه امتیازات حاصل از پیشرفت مهارتی و رکوردهای زمانی رسمی، رده‌های سنی و جدول زنده برترین‌ها
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCsv} disabled={!leaderboard.length} className="gap-1.5 text-xs">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>خروجی اکسل رده‌بندی</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingState type="cards" count={4} message="در حال بارگذاری اطلاعات دوره‌های لیگ..." />
      ) : leagues.length === 0 ? (
        <EmptyState
          title="دوره‌ای برای لیگ تعریف نشده است"
          description="با ایجاد اولین دوره لیگ، جدول رتبه‌بندی فعال می‌گردد."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* League Selector & Details Sidebar */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs transition-colors">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">
                فصل‌های مسابقاتی
              </span>
              <div className="space-y-1.5">
                {leagues.map((lg) => (
                  <button
                    key={lg.id}
                    type="button"
                    onClick={() => {
                      setSelectedLeague(lg);
                      setSelectedCategory('');
                    }}
                    className={`w-full text-right p-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                      selectedLeague?.id === lg.id
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800 font-bold shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <span className="block">{lg.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{lg.season}</span>
                    </div>
                    {selectedLeague?.id === lg.id && <ChevronRight className="w-4 h-4 text-amber-600" />}
                  </button>
                ))}
              </div>
            </div>

            {/* League Rules Card */}
            {selectedLeague && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs text-xs space-y-2.5 transition-colors">
                <span className="font-bold text-slate-900 dark:text-white block pb-2 border-b border-slate-100 dark:border-slate-800">
                  قوانین و تاریخ دوره
                </span>
                <div className="flex justify-between text-slate-500">
                  <span>تاریخ آغاز:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{new Date(selectedLeague.starts_at).toLocaleDateString('fa-IR')}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>تاریخ پایان:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{new Date(selectedLeague.ends_at).toLocaleDateString('fa-IR')}</span>
                </div>
                {selectedLeague.rules_description && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="font-bold block mb-1">فرمول امتیازدهی:</span>
                    <p>{selectedLeague.rules_description}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Leaderboard Table */}
          <div className="md:col-span-2 lg:col-span-3 space-y-4">
            {/* Filter by Category */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  فیلتر رده رقابتی:
                </span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">تمام رده‌های سنی و جنسیتی</option>
                  {(selectedLeague?.categories || []).map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.title} ({cat.age_min} تا {cat.age_max} سال)
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                مجموع رقابت‌کنندگان: {leaderboard.length} شناگر
              </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors">
              {boardLoading ? (
                <LoadingState type="table" rows={5} message="در حال محاسبه جدول زنده رتبه‌بندی..." />
              ) : leaderboard.length === 0 ? (
                <EmptyState
                  title="امتیازی ثبت نشده است"
                  description="به محض تأیید اولین رکورد یا ارزیابی رسمی برای شناگران این لیگ، جدول رتبه‌بندی به‌روز خواهد شد."
                />
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-right min-w-[550px]">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800">
                        <tr>
                          <th className="px-4 py-3.5 text-center rounded-r-xl w-16">رتبه</th>
                          <th className="px-4 py-3.5">شناگر</th>
                          <th className="px-4 py-3.5">رده رقابتی</th>
                          <th className="px-4 py-3.5 text-left rounded-l-xl">مجموع امتیازات معتبر</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                        {leaderboard.map((row) => (
                          <tr key={row.entry_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3.5 text-center">
                              {row.rank === 1 ? (
                                <span className="w-7 h-7 mx-auto rounded-full bg-amber-400 text-amber-950 font-bold flex items-center justify-center text-xs shadow-2xs">
                                  🥇
                                </span>
                              ) : row.rank === 2 ? (
                                <span className="w-7 h-7 mx-auto rounded-full bg-slate-300 text-slate-900 font-bold flex items-center justify-center text-xs shadow-2xs">
                                  🥈
                                </span>
                              ) : row.rank === 3 ? (
                                <span className="w-7 h-7 mx-auto rounded-full bg-amber-700/60 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                                  🥉
                                </span>
                              ) : (
                                <span className="font-mono text-xs text-slate-500 font-bold">
                                  {row.rank}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-100">
                              {row.swimmer_name}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                              {row.category_title}
                            </td>
                            <td className="px-4 py-3.5 text-left font-mono font-bold text-amber-600 dark:text-amber-400 text-base">
                              {row.total_points} <span className="text-xs font-normal text-slate-400">امتیاز</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards View */}
                  <div className="md:hidden space-y-3">
                    {leaderboard.map((row) => (
                      <div
                        key={row.entry_id}
                        className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold shrink-0">
                            {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : (
                              <span className="font-mono text-xs text-slate-600 dark:text-slate-300">#{row.rank}</span>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                              {row.swimmer_name}
                            </h4>
                            <span className="text-slate-500 dark:text-slate-400 text-[11px] block mt-0.5">
                              {row.category_title}
                            </span>
                          </div>
                        </div>

                        <div className="text-left font-mono font-bold text-amber-600 dark:text-amber-400 text-base shrink-0">
                          {row.total_points} <span className="text-xs font-normal text-slate-400">امتیاز</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
