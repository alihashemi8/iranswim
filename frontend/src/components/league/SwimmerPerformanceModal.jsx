import React, { useState, useEffect } from 'react';
import {
  Trophy, Medal, Timer, Calendar, User, TrendingUp,
  Award, Shield, Plus, CheckCircle2, Flame, Sparkles
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { LoadingState } from '../common/LoadingState';
import { SparklineAreaChart } from '../common/Charts';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const SwimmerPerformanceModal = ({
  isOpen,
  onClose,
  leagueId,
  swimmerId,
  onOpenManualScoreForSwimmer,
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (!isOpen || !leagueId || !swimmerId) return;

    const fetchPerformance = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/leagues/${leagueId}/swimmer_performance/${swimmerId}/`);
        setData(res.data);
      } catch (err) {
        console.error(err);
        toast.error('خطا در دریافت سوابق و عملکرد شناگر');
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, [isOpen, leagueId, swimmerId]);

  if (!isOpen) return null;

  const swimmer = data?.swimmer;
  const entry = data?.entry;
  const chartData = data?.chart_data || [];
  const personalBests = data?.personal_bests || [];
  const results = data?.results || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={swimmer ? `پرونده عملکرد لیگ: ${swimmer.full_name}` : 'جزئیات عملکرد شناگر'}
      maxWidth="max-w-4xl"
    >
      {loading ? (
        <LoadingState type="cards" count={3} message="در حال استخراج کارنامه مسابقاتی و نمودار پیشرفت..." />
      ) : !data ? (
        <div className="text-center py-8 text-slate-400 text-xs">
          اطلاعاتی برای این شناگر در لیگ فعلی یافت نشد.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Swimmer Header Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent dark:from-amber-950/30 dark:via-amber-900/10 dark:to-transparent border border-amber-200/80 dark:border-amber-900/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border-2 border-amber-400/80 shadow-md flex items-center justify-center overflow-hidden shrink-0">
                {swimmer.avatar ? (
                  <img
                    src={swimmer.avatar}
                    alt={swimmer.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div className="space-y-1 text-center sm:text-right">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {swimmer.full_name}
                  </h3>
                  <span className="text-[11px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
                    {entry.category_title}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{swimmer.gender_display}</span>
                  <span>•</span>
                  <span>دوره: {data.league?.name}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => {
                  if (onOpenManualScoreForSwimmer) {
                    onOpenManualScoreForSwimmer(swimmer);
                  }
                }}
                className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ثبت امتیاز تشویقی/تعدیلی</span>
              </Button>
            </div>
          </div>

          {/* Quick Stats Badges (4 cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl text-center space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block">رتبه در لیگ</span>
              <span className="text-xl font-mono font-black text-slate-900 dark:text-white flex items-center justify-center gap-1">
                {entry.rank === 1 ? '🥇 1' : entry.rank === 2 ? '🥈 2' : entry.rank === 3 ? '🥉 3' : `#${entry.rank || '-'}`}
              </span>
            </div>

            <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 p-3.5 rounded-2xl text-center space-y-1">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block">مجموع امتیازات</span>
              <span className="text-xl font-mono font-black text-amber-600 dark:text-amber-300">
                {Number(entry.total_points).toLocaleString('en-US')}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl text-center space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block">مدال‌ها</span>
              <div className="flex items-center justify-center gap-1.5 font-mono text-xs font-bold pt-1">
                <span title="طلا">🥇{entry.gold_medals}</span>
                <span title="نقره">🥈{entry.silver_medals}</span>
                <span title="برنز">🥉{entry.bronze_medals}</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl text-center space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block">تعداد مسابقات</span>
              <span className="text-xl font-mono font-black text-slate-900 dark:text-white">
                {entry.matches_count}
              </span>
            </div>
          </div>

          {/* Progression Area Chart */}
          {chartData.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  روند پیشرفت و انباشت امتیازات در طول مسابقات فصل
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  آخرین امتیاز: {entry.total_points}
                </span>
              </div>

              <SparklineAreaChart
                data={chartData}
                color="amber"
                height={140}
                valueFormatter={(val) => `${val} امتیاز`}
              />
            </div>
          )}

          {/* Personal Best Records */}
          {personalBests.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-500" />
                بهترین رکوردهای شخصی شناگر (Personal Best)
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {personalBests.map((pb, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 p-3 rounded-xl space-y-1"
                  >
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                      {pb.stroke_display} {pb.distance_meters}م
                    </span>
                    <span className="text-base font-mono font-black text-slate-900 dark:text-white block">
                      {pb.formatted_time}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {new Date(pb.recorded_at).toLocaleDateString('fa-IR-u-nu-latn')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complete Results History Table */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-500" />
              ریز تاریخچه رویدادها، مسابقات و امتیازات کسب‌شده
            </span>

            {results.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                هنوز امتیازی برای این شناگر ثبت نشده است.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
                <table className="w-full text-xs text-right min-w-[500px]">
                  <thead className="bg-slate-50 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="p-3">رویداد / ماده مسابقه</th>
                      <th className="p-3 text-center">زمان ثبت‌شده</th>
                      <th className="p-3 text-center">رتبه</th>
                      <th className="p-3 text-center">مدال</th>
                      <th className="p-3 text-left font-mono">امتیاز لیگ</th>
                      <th className="p-3">تاریخ</th>
                      <th className="p-3">توضیحات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {results.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {r.event_name}
                          {r.is_manual && (
                            <span className="mr-1.5 text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded font-normal">
                              دستی
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {r.formatted_time || '-'}
                        </td>
                        <td className="p-3 text-center font-bold font-mono">
                          {r.rank ? (r.rank === 1 ? '🥇 1' : r.rank === 2 ? '🥈 2' : r.rank === 3 ? '🥉 3' : r.rank) : '-'}
                        </td>
                        <td className="p-3 text-center">
                          {r.medal === 'GOLD' ? 'طلا' : r.medal === 'SILVER' ? 'نقره' : r.medal === 'BRONZE' ? 'برنز' : '-'}
                        </td>
                        <td className="p-3 text-left font-mono font-black text-amber-600 dark:text-amber-400 text-sm">
                          +{Number(r.score_points).toLocaleString('en-US')}
                        </td>
                        <td className="p-3 font-mono text-slate-500">
                          {new Date(r.recorded_at).toLocaleDateString('fa-IR-u-nu-latn')}
                        </td>
                        <td className="p-3 text-slate-400 text-[11px]">
                          {r.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
