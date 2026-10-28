import React, { useState, useEffect } from 'react';
import {
  Trophy, Medal, Timer, Award, ShieldCheck, Sparkles, Filter,
  CheckCircle2, ChevronLeft
} from 'lucide-react';
import api from '../../api/client';
import { useSwimmer } from '../../context/SwimmerContext';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';

export const SwimmerLeaguePage = () => {
  const { activeSwimmer, activeSwimmerId } = useSwimmer();
  const [leagues, setLeagues] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLeagueData = async () => {
    try {
      setLoading(true);
      const params = activeSwimmerId ? { swimmer_id: activeSwimmerId } : {};
      const [lRes, rRes] = await Promise.allSettled([
        api.get('/leagues/'),
        api.get('/assessments/records/', { params }),
      ]);

      if (lRes.status === 'fulfilled') {
        const d = lRes.value.data;
        const list = Array.isArray(d) ? d : d.results || [];
        setLeagues(list);
        if (list.length > 0) {
          setSelectedLeagueId(list[0].id);
          // fetch leaderboard of first league
          const lbRes = await api.get(`/leagues/${list[0].id}/leaderboard/`);
          setLeaderboard(Array.isArray(lbRes.data) ? lbRes.data : []);
        }
      }
      if (rRes.status === 'fulfilled') {
        const d = rRes.value.data;
        setRecords(Array.isArray(d) ? d : d.results || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeagueData();
  }, [activeSwimmerId]);

  const handleLeagueChange = async (leagueId) => {
    setSelectedLeagueId(leagueId);
    try {
      const lbRes = await api.get(`/leagues/${leagueId}/leaderboard/`);
      setLeaderboard(Array.isArray(lbRes.data) ? lbRes.data : []);
    } catch {
      setLeaderboard([]);
    }
  };

  if (loading) {
    return <LoadingState type="table" message="در حال محاسبه جدول لیگ و رتبه‌بندی شناگران..." />;
  }

  // Find swimmer's rank in current leaderboard
  const swimmerIdNum = Number(activeSwimmerId || activeSwimmer?.id);
  const myEntry = leaderboard.find((item) => item.swimmer_id === swimmerIdNum);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400">
              <Trophy className="w-5 h-5" />
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              لیگ، رتبه‌بندی و رکوردهای رسمی
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            جدول رده‌بندی فصول مسابقاتی، امتیازات فنی و تایم‌های تأییدشده در رویدادهای باشگاه
          </p>
        </div>

        {/* Swimmer Rank Pill */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 rounded-2xl shadow-xs">
          <Medal className="w-6 h-6 shrink-0" />
          <div>
            <span className="text-[10px] text-amber-100 font-semibold block leading-tight">
              رتبه فعلی شناگر در لیگ:
            </span>
            <span className="text-sm font-black font-mono">
              {myEntry ? `رتبه ${myEntry.rank} (امتیاز: ${myEntry.total_points})` : 'در انتظار رتبه‌بندی'}
            </span>
          </div>
        </div>
      </div>

      {/* Verified Official Records Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span className="p-1 rounded-lg bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-900/60">
            <Timer className="w-4 h-4" />
          </span>
          <span>رکوردهای زمانی رسمی تأییدشده شناگر</span>
        </h2>

        {records.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {records.map((rec) => (
              <div
                key={rec.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2 hover:border-teal-300 dark:hover:border-teal-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {rec.stroke_display || rec.stroke} ({rec.distance_meters} متر)
                  </span>
                  <Badge variant={rec.verification_status === 'VERIFIED' ? 'success' : 'warning'}>
                    {rec.verification_status === 'VERIFIED' ? 'تأییدشده' : 'در انتظار'}
                  </Badge>
                </div>
                <div className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">
                  {rec.time_seconds ? `${rec.time_seconds} ثانیه` : rec.formatted_time || `${rec.duration_seconds}s`}
                </div>
                <div className="text-[10px] text-slate-400">
                  ثبت: {rec.recorded_at?.slice(0, 10)} · وضعیت استخر: ۵۰ متر
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            هنوز رکورد زمانی رسمی در مسابقات یا تست‌های زمان‌گیری برای این شناگر ثبت نشده است.
          </div>
        )}
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden space-y-4 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              جدول رده‌بندی رسمی لیگ
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              رده‌بندی عمومی صرفاً با نام ورزشی شناگران (بدون اطلاعات هویتی و محرمانه)
            </p>
          </div>

          {/* League Selector */}
          {leagues.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">انتخاب فصل:</span>
              <select
                value={selectedLeagueId || ''}
                onChange={(e) => handleLeagueChange(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              >
                {leagues.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title} ({l.season})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {leaderboard.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                  <th className="py-2.5 px-3">رتبه</th>
                  <th className="py-2.5 px-3">نام شناگر</th>
                  <th className="py-2.5 px-3">رده / سطح مسابقاتی</th>
                  <th className="py-2.5 px-3 text-left">امتیاز کل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leaderboard.map((row) => {
                  const isMe = row.swimmer_id === swimmerIdNum;
                  return (
                    <tr
                      key={row.entry_id}
                      className={`transition-colors ${
                        isMe
                          ? 'bg-amber-50/80 dark:bg-amber-950/40 font-bold text-amber-950 dark:text-amber-200'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <span
                          className={`w-6 h-6 rounded-lg inline-flex items-center justify-center font-bold text-xs ${
                            row.rank === 1
                              ? 'bg-amber-400 text-white'
                              : row.rank === 2
                              ? 'bg-slate-300 text-slate-800'
                              : row.rank === 3
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {row.rank}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="flex items-center gap-2">
                          {row.swimmer_name}
                          {isMe && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-100">
                              شما
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {row.category_title || 'عمومی'}
                      </td>
                      <td className="py-3 px-3 text-left font-mono font-bold text-sky-600">
                        {row.total_points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            جدول رده‌بندی برای این فصل لیگ هنوز تشکیل نشده است.
          </div>
        )}
      </div>
    </div>
  );
};
