import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck, CheckCircle2, XCircle, Clock, AlertCircle,
  Calendar, ShieldAlert, Sparkles, HelpCircle
} from 'lucide-react';
import api from '../../api/client';
import { useSwimmer } from '../../context/SwimmerContext';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';

export const SwimmerAttendancePage = () => {
  const { activeSwimmer, activeSwimmerId } = useSwimmer();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = activeSwimmerId ? { swimmer_id: activeSwimmerId } : {};
      const res = await api.get('/attendance/', { params });
      const d = res.data;
      setAttendance(Array.isArray(d) ? d : d.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [activeSwimmerId]);

  if (loading) {
    return <LoadingState type="table" message="در حال محاسبه دفترچه حضور و غیاب شناگر..." />;
  }

  const presentCount = attendance.filter((a) => a.status === 'PRESENT').length;
  const absentCount = attendance.filter((a) => a.status === 'ABSENT').length;
  const justifiedCount = attendance.filter((a) => a.status === 'JUSTIFIED' || a.is_justified).length;
  const totalRecorded = attendance.length;
  const attendanceRate = totalRecorded > 0 ? Math.round((presentCount / totalRecorded) * 100) : 100;

  const getAttendanceStatusBadge = (att) => {
    if (att.status === 'PRESENT') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-4 h-4" />
          حاضر
        </span>
      );
    }
    if (att.status === 'JUSTIFIED' || att.is_justified) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-3 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
          <Clock className="w-4 h-4" />
          غیبت موجه (بدون کسر سهمیه)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-3 py-1 rounded-xl border border-rose-200 dark:border-rose-800">
        <XCircle className="w-4 h-4" />
        غایب غیرموجه
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400">
              <ClipboardCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              دفترچه الکترونیکی حضور و غیاب
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            سوابق ثبت‌شده توسط مربیان، غیبت‌های موجه و اثر آن بر سهمیه کلاس‌های آموزشی
          </p>
        </div>

        {/* Rate pill */}
        <div className="flex items-center gap-3 bg-teal-50 dark:bg-teal-950/50 p-3 rounded-2xl border border-teal-200 dark:border-teal-800">
          <div className="text-right">
            <span className="text-xs sm:text-sm text-teal-700 dark:text-teal-300 font-bold block">
              درصد حضور در دوره:
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              ٪{attendanceRate}
            </span>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs sm:text-sm font-bold text-slate-500 block mb-1">جلسات کل ثبت‌شده</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {totalRecorded} جلسه
          </span>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs sm:text-sm font-bold text-emerald-600 block mb-1">تعداد جلسات حاضر</span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
            {presentCount} جلسه
          </span>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs sm:text-sm font-bold text-amber-600 block mb-1">غیبت موجه (حفظ سهمیه)</span>
          <span className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">
            {justifiedCount} جلسه
          </span>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs sm:text-sm font-bold text-rose-600 block mb-1">غیبت غیرموجه</span>
          <span className="text-2xl sm:text-3xl font-black text-rose-600 font-mono">
            {absentCount} جلسه
          </span>
        </div>
      </div>

      {/* Policy Info Alert */}
      <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/60 text-sm text-sky-900 dark:text-sky-200 space-y-1.5">
        <h4 className="font-bold flex items-center gap-2 text-sm sm:text-base">
          <Sparkles className="w-4.5 h-4.5 text-sky-600" />
          قوانین شفاف آموزشگاه در مورد غیبت و جلسات لغوشده:
        </h4>
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed pr-2 font-medium">
          ۱. لغو جلسات از سوی آموزشگاه (تعطیلات رسمی یا مسابقات) هرگز غیبت شناگر محاسبه نشده و سهمیه جلسه کاملاً محفوظ است.
          <br />
          ۲. در صورت بیماری یا موجه بودن غیبت، والد گرامی می‌تواند از بخش «پشتیبانی»، گواهی یا درخواست ثبت غیبت موجه ارسال نماید تا جلسه سوخت نشود.
        </p>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Calendar className="w-4.5 h-4.5 text-sky-600" />
          ریز سوابق جلسات برگزارشده
        </h3>

        {attendance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold text-sm">
                  <th className="py-3 px-3">تاریخ جلسه</th>
                  <th className="py-3 px-3">سانس و ساعت</th>
                  <th className="py-3 px-3">مربی ثبت‌کننده</th>
                  <th className="py-3 px-3">وضعیت حضور</th>
                  <th className="py-3 px-3">توضیحات و علت غیبت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {attendance.map((att) => (
                  <tr key={att.id} className="text-slate-700 dark:text-slate-300">
                    <td className="py-3.5 px-3 font-mono font-black text-slate-900 dark:text-white text-sm sm:text-base">
                      {att.session_date || '—'}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-600 dark:text-slate-400 font-medium">
                      {att.session_time || 'ساعت مقرر'}
                    </td>
                    <td className="py-3.5 px-3 font-semibold">
                      {att.recorded_by_name || 'کادر مربیان'}
                    </td>
                    <td className="py-3.5 px-3">
                      {getAttendanceStatusBadge(att)}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                      {att.notes || (att.status === 'PRESENT' ? 'حضور کامل و فعال در آب' : '—')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-slate-400">
            هنوز جلسه‌ای برای حضور و غیاب ثبت نشده است.
          </div>
        )}
      </div>
    </div>
  );
};
