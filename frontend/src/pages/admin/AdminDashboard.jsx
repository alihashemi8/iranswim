import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users, CreditCard, TrendingUp, AlertCircle,
  Calendar, CheckCircle2, Clock, UserCheck,
  Award, RefreshCw, MapPin, ClipboardCheck,
  AlertTriangle, Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { StatsCard } from '../../components/common/StatsCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { BarChart, ProgressBar } from '../../components/common/Charts';
import { useToast } from '../../context/ToastContext';

// Helper for local YYYY-MM-DD string
const getLocalDateStr = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Clean coach name helper
const cleanCoachName = (name) => {
  if (!name || name === '—') return '—';
  return String(name)
    .replace(/^مربی[:\s]+/, '')
    .replace(/\s*\(مربی\)\s*$/, '')
    .trim() || '—';
};

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [finance, setFinance] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [overdueInstallments, setOverdueInstallments] = useState([]);
  const [pendingRecords, setPendingRecords] = useState([]);
  const [todaySessions, setTodaySessions] = useState([]);
  const [unrecordedSessions, setUnrecordedSessions] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [groups, setGroups] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [scheduleFilter, setScheduleFilter] = useState('ALL'); // ALL, UPCOMING, COMPLETED
  const toast = useToast();

  const [currentDate] = useState(() => new Date());
  const todayStr = useMemo(() => getLocalDateStr(currentDate), [currentDate]);

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setHasError(false);

      const [
        healthRes,
        financeRes,
        reqsRes,
        overdueRes,
        recordsRes,
        todaySessionsRes,
        unrecordedRes,
        coachesRes,
        groupsRes,
        enrollmentsRes,
      ] = await Promise.allSettled([
        api.get('/supervisor/health/'),
        api.get('/finance/summary/'),
        api.get('/education/requests/?status=PENDING'),
        api.get('/finance/installments/?overdue=true'),
        api.get('/assessments/records/'),
        api.get(`/scheduling/sessions/?date=${todayStr}`),
        api.get('/scheduling/sessions/?unrecorded=true'),
        api.get('/coaches/?status=ACTIVE'),
        api.get('/education/groups/'),
        api.get('/education/enrollments/'),
      ]);

      let successfulCalls = 0;

      if (healthRes.status === 'fulfilled') {
        setStats(healthRes.value.data.system_stats);
        successfulCalls++;
      }
      if (financeRes.status === 'fulfilled') {
        setFinance(financeRes.value.data);
        successfulCalls++;
      }
      if (reqsRes.status === 'fulfilled') {
        setPendingRequests(reqsRes.value.data.results || reqsRes.value.data || []);
        successfulCalls++;
      }
      if (overdueRes.status === 'fulfilled') {
        setOverdueInstallments(overdueRes.value.data.results || overdueRes.value.data || []);
        successfulCalls++;
      }
      if (recordsRes.status === 'fulfilled') {
        const allRecords = recordsRes.value.data.results || recordsRes.value.data || [];
        setPendingRecords(allRecords.filter((r) => r.verification_status === 'PENDING'));
        successfulCalls++;
      }
      if (todaySessionsRes.status === 'fulfilled') {
        setTodaySessions(todaySessionsRes.value.data.results || todaySessionsRes.value.data || []);
        successfulCalls++;
      }
      if (unrecordedRes.status === 'fulfilled') {
        setUnrecordedSessions(unrecordedRes.value.data.results || unrecordedRes.value.data || []);
        successfulCalls++;
      }
      if (coachesRes.status === 'fulfilled') {
        setCoaches(coachesRes.value.data.results || coachesRes.value.data || []);
        successfulCalls++;
      }
      if (groupsRes.status === 'fulfilled') {
        setGroups(groupsRes.value.data.results || groupsRes.value.data || []);
        successfulCalls++;
      }
      if (enrollmentsRes.status === 'fulfilled') {
        setEnrollments(enrollmentsRes.value.data.results || enrollmentsRes.value.data || []);
        successfulCalls++;
      }

      if (successfulCalls === 0) {
        setHasError(true);
        toast.error('خطا در برقراری ارتباط با سرور و دریافت اطلاعات پیشخوان');
      } else if (isManualRefresh) {
        toast.success('اطلاعات پیشخوان عملیاتی با موفقیت به‌روزرسانی شد');
      }
    } catch (err) {
      console.error(err);
      setHasError(true);
      toast.error('خطا در دریافت اطلاعات پیشخوان مدیریتی آموزشگاه');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [todayStr, toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatPrice = (val) => Number(val || 0).toLocaleString('fa-IR');
  const formatNum = (val) => Number(val || 0).toLocaleString('fa-IR');

  // Groups lookup map
  const groupMap = useMemo(() => {
    const map = new Map();
    groups.forEach((g) => map.set(g.id, g));
    return map;
  }, [groups]);

  // Current time representation for in-progress session check
  const nowTime = useMemo(() => {
    return `${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;
  }, [currentDate]);

  const formattedTodayDate = useMemo(() => {
    return currentDate.toLocaleDateString('fa-IR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [currentDate]);

  // Session state evaluator
  const getSessionLiveState = (session) => {
    if (session.status === 'COMPLETED') {
      return { key: 'COMPLETED', label: 'برگزارشده', variant: 'success', isLive: false };
    }
    if (session.status === 'CANCELLED') {
      return { key: 'CANCELLED', label: 'لغوشده', variant: 'danger', isLive: false };
    }

    const start = session.start_time?.slice(0, 5) || '00:00';
    const end = session.end_time?.slice(0, 5) || '23:59';

    if (nowTime >= start && nowTime <= end) {
      return { key: 'IN_PROGRESS', label: 'در حال برگزاری', variant: 'warning', isLive: true };
    }
    if (nowTime > end) {
      return { key: 'PAST_DUE', label: 'پایان‌یافته (در انتظار ثبت حضور)', variant: 'neutral', isLive: false };
    }
    if (session.is_makeup) {
      return { key: 'MAKEUP', label: 'جلسه جبرانی', variant: 'info', isLive: false };
    }
    return { key: 'SCHEDULED', label: session.status_display || 'برنامه‌ریزی‌شده', variant: 'info', isLive: false };
  };

  // Operational metrics for today's sessions
  const completedSessionsCount = useMemo(
    () => todaySessions.filter((s) => s.status === 'COMPLETED').length,
    [todaySessions]
  );
  const inProgressSessionsCount = useMemo(
    () =>
      todaySessions.filter((s) => {
        if (s.status === 'COMPLETED' || s.status === 'CANCELLED') return false;
        const start = s.start_time?.slice(0, 5) || '00:00';
        const end = s.end_time?.slice(0, 5) || '23:59';
        return nowTime >= start && nowTime <= end;
      }).length,
    [todaySessions, nowTime]
  );
  const remainingSessionsCount = useMemo(
    () =>
      todaySessions.filter((s) => {
        if (s.status === 'COMPLETED' || s.status === 'CANCELLED') return false;
        const end = s.end_time?.slice(0, 5) || '23:59';
        return end > nowTime;
      }).length,
    [todaySessions, nowTime]
  );

  // Filtered and sorted schedule
  const filteredSchedule = useMemo(() => {
    let list = [...todaySessions].sort((a, b) =>
      (a.start_time || '').localeCompare(b.start_time || '')
    );
    if (scheduleFilter === 'UPCOMING') {
      list = list.filter((s) => {
        if (s.status === 'COMPLETED' || s.status === 'CANCELLED') return false;
        const end = s.end_time?.slice(0, 5) || '23:59';
        return end >= nowTime;
      });
    } else if (scheduleFilter === 'COMPLETED') {
      list = list.filter((s) => s.status === 'COMPLETED');
    }
    return list;
  }, [todaySessions, scheduleFilter, nowTime]);

  // Unique debtor swimmers count
  const debtorCount = useMemo(() => {
    const ids = overdueInstallments
      .map((i) => i.swimmer_id || i.swimmer_name)
      .filter(Boolean);
    return new Set(ids).size;
  }, [overdueInstallments]);

  // Total urgent actionable items
  const totalUrgentActionItems =
    pendingRequests.length +
    overdueInstallments.length +
    pendingRecords.length +
    unrecordedSessions.length;

  // Real Weekly enrollments calculation (Saturday to Friday in current Persian week)
  const { weeklyChartData, weekPeriodLabel, weekEnrollmentsTotal } = useMemo(() => {
    const daysSinceSat = (currentDate.getDay() + 1) % 7;
    const saturday = new Date(currentDate);
    saturday.setDate(currentDate.getDate() - daysSinceSat);
    saturday.setHours(0, 0, 0, 0);

    const dayNames = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
    const weekDays = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(saturday);
      d.setDate(saturday.getDate() + i);
      const dateStr = getLocalDateStr(d);
      weekDays.push({
        dateStr,
        label: dayNames[i],
        dateObj: d,
        count: 0,
      });
    }

    enrollments.forEach((e) => {
      if (!e.enrolled_at) return;
      const eDate = e.enrolled_at.slice(0, 10);
      const match = weekDays.find((w) => w.dateStr === eDate);
      if (match) {
        match.count += 1;
      }
    });

    const chartData = weekDays.map((w) => ({
      label: w.label,
      value: w.count,
    }));

    const startDateFa = weekDays[0].dateObj.toLocaleDateString('fa-IR', { day: 'numeric', month: 'short' });
    const endDateFa = weekDays[6].dateObj.toLocaleDateString('fa-IR', { day: 'numeric', month: 'short', year: 'numeric' });
    const periodLabel = `هفته جاری (${startDateFa} تا ${endDateFa})`;
    const total = weekDays.reduce((acc, curr) => acc + curr.count, 0);

    return {
      weeklyChartData: chartData,
      weekPeriodLabel: periodLabel,
      weekEnrollmentsTotal: total,
    };
  }, [enrollments, currentDate]);

  // Groups with notable empty capacity (> 40% empty capacity)
  const underfilledGroups = useMemo(() => {
    return groups
      .filter((g) => g.status === 'OPEN' && g.capacity > 0 && g.remaining_capacity >= Math.ceil(g.capacity * 0.4))
      .sort((a, b) => b.remaining_capacity - a.remaining_capacity)
      .slice(0, 3);
  }, [groups]);

  if (loading && !stats && !finance) {
    return <LoadingState type="dashboard" message="در حال بارگذاری مرکز عملیات آموزشگاه شنا..." />;
  }

  return (
    <div className="space-y-6">
      {/* Network / Data Error Banner with Retry */}
      {hasError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between text-xs text-rose-800 dark:text-rose-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>بخشی از اطلاعات پیشخوان به دلیل اختلال ارتباطی دریافت نشد. می‌توانید مجدداً تلاش کنید.</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchDashboardData(true)}
            className="text-xs shrink-0"
          >
            تلاش مجدد
          </Button>
        </div>
      )}

      {/* 1. Welcome & Operational Status Banner */}
      <div className="bg-gradient-to-l from-sky-700 via-sky-800 to-cyan-800 rounded-3xl p-5 sm:p-7 text-white shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 transition-all">
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold tracking-wide">
              پیشخوان عملیاتی مدیر
            </span>
            <span className="text-sky-200 text-xs font-medium">
              امروز: {formattedTodayDate}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            مرکز کنترل و مدیریت آموزشگاه شنای ایران
          </h1>
          <p className="text-sky-100 text-xs sm:text-sm font-normal leading-relaxed max-w-2xl">
            نظارت زنده بر سانس‌های روزانه، وضعیت لاین‌های استخر، وصول مطالبات و تصمیم‌گیری‌های آموزشی
          </p>

          {/* Compact Operational Overview Metrics Row */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            {/* Today's Sessions Total Chip */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-sky-100 whitespace-nowrap">
              <Calendar className="w-3.5 h-3.5 text-sky-300 shrink-0" />
              <span>
                سانس‌های امروز: <strong className="text-white font-bold">{formatNum(todaySessions.length)}</strong>
              </span>
            </div>

            {/* In-progress Sessions Chip (if any) */}
            {inProgressSessionsCount > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400/20 border border-amber-300/40 text-amber-200 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                <span>
                  در حال برگزاری: <strong className="font-bold">{formatNum(inProgressSessionsCount)}</strong>
                </span>
              </div>
            )}

            {/* Completed Sessions Chip */}
            {completedSessionsCount > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 border border-white/15 text-sky-100 whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                <span>
                  برگزارشده: <strong className="text-white font-bold">{formatNum(completedSessionsCount)}</strong>
                </span>
              </div>
            )}

            {/* Unrecorded Attendance Alert Chip */}
            {unrecordedSessions.length > 0 && (
              <Link
                to="/admin/attendance?filter=UNRECORDED"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-300/40 text-amber-200 transition-colors whitespace-nowrap"
              >
                <ClipboardCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>
                  <strong>{formatNum(unrecordedSessions.length)}</strong> جلسه بدون ثبت حضور
                </span>
              </Link>
            )}

            {/* Overdue Receivables Alert Chip */}
            {Number(finance?.receivables || 0) > 0 && (
              <Link
                to="/admin/finance?tab=installments"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-300/40 text-rose-200 transition-colors whitespace-nowrap"
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                <span>
                  معوقات: <strong>{formatPrice(finance?.receivables)}</strong> تومان
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* Action Counter & Refresh Button */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end shrink-0">
          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            title="به‌روزرسانی داده‌های پیشخوان"
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-sky-100 hover:text-white border border-white/20 transition-all cursor-pointer flex items-center justify-center shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {totalUrgentActionItems > 0 ? (
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/20 flex items-center gap-2.5 shrink-0 whitespace-nowrap">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-amber-950 font-black flex items-center justify-center shrink-0 shadow-xs text-xs">
                {formatNum(totalUrgentActionItems)}
              </div>
              <div className="leading-tight">
                <span className="text-xs font-bold block text-white">اقدام فوری</span>
                <span className="text-[11px] text-sky-100 font-normal">در صف پیگیری</span>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/20 flex items-center gap-2 shrink-0 text-xs text-emerald-200 whitespace-nowrap">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>عملیات روزانه منظم است</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Operational KPI Cards - Connected to existing routes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link to="/admin/swimmers" className="block h-full hover:opacity-95 transition-opacity">
          <StatsCard
            title="شناگران فعال"
            value={`${formatNum(stats?.active_swimmers)} نفر`}
            subtitle="دارای پرونده آموزشی فعال"
            icon={Users}
            color="sky"
          />
        </Link>

        <Link to="/admin/coaches?status=ACTIVE" className="block h-full hover:opacity-95 transition-opacity">
          <StatsCard
            title="مربیان فعال"
            value={`${formatNum(coaches.length)} مربی`}
            subtitle="کادر فعال با گروه تخصیص‌یافته"
            icon={UserCheck}
            color="indigo"
          />
        </Link>

        <Link to="/admin/finance" className="block h-full hover:opacity-95 transition-opacity">
          <StatsCard
            title="درآمد وصول‌شده (تجمعی کل)"
            value={`${formatPrice(finance?.total_paid)} تومان`}
            subtitle={`از کل ${formatPrice(finance?.total_invoiced)} تومان صورتحساب صادرشده`}
            icon={CreditCard}
            color="emerald"
          />
        </Link>

        <Link to="/admin/finance?tab=installments" className="block h-full hover:opacity-95 transition-opacity">
          <StatsCard
            title="مطالبات معوق (اقساط سررسید گذشته)"
            value={`${formatPrice(finance?.receivables)} تومان`}
            subtitle={
              overdueInstallments.length > 0
                ? `${formatNum(overdueInstallments.length)} قسط معوق (${formatNum(debtorCount)} بدهکار)`
                : 'تمامی اقساط به‌روز و تسویه هستند'
            }
            icon={AlertCircle}
            color={overdueInstallments.length > 0 ? 'rose' : 'emerald'}
          />
        </Link>
      </div>

      {/* 3. Urgent Action Center (اقدامات و پیگیری‌های فوری مدیر) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-colors space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-1.5">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${totalUrgentActionItems > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              بخش عملیات فوری و پیگیری‌های امروز مدیر
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            رسیدگی سریع به بدهی‌های معوق، ثبت حضور و غیاب، و درخواست‌های در صف
          </span>
        </div>

        {totalUrgentActionItems === 0 ? (
          <div className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                کلیه امور عملیاتی و مالی روزانه در وضعیت مطلوب قرار دارد
              </h3>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
                هیچ قسط سررسید گذشته، جلسه ثبت‌نشده یا درخواست معلقی برای رسیدگی وجود ندارد.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {/* Priority 1 (CRITICAL RED): Overdue Installments & Debtors */}
            {overdueInstallments.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      اقساط معوق (بدهکاران)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 font-bold text-xs">
                      {formatNum(overdueInstallments.length)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {formatNum(debtorCount)} بدهکار با مجموع {formatPrice(finance?.receivables)} تومان بدهی معوق نیازمند پیگیری و تسویه هستند.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-rose-200/60 dark:border-rose-900/60">
                  <Link
                    to="/admin/finance?tab=installments"
                    className="w-full text-center block py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs whitespace-nowrap"
                  >
                    تسویه اقساط معوق ←
                  </Link>
                </div>
              </div>
            )}

            {/* Priority 2 (WARNING AMBER): Unrecorded Attendance Sessions */}
            {unrecordedSessions.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                      <ClipboardCheck className="w-4 h-4 text-amber-600 shrink-0" />
                      جلسات بدون ثبت حضور
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 font-bold text-xs">
                      {formatNum(unrecordedSessions.length)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    جلسات کلاسی سررسیده‌ای که حضور و غیاب شناگران هنوز در سامانه توسط مربی یا مدیر ثبت نشده است.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-amber-200/60 dark:border-amber-900/60">
                  <Link
                    to="/admin/attendance?filter=UNRECORDED"
                    className="w-full text-center block py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs whitespace-nowrap"
                  >
                    ثبت حضور و غیاب ←
                  </Link>
                </div>
              </div>
            )}

            {/* Priority 3 (WARNING AMBER): Unverified Swimming Records */}
            {pendingRecords.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-600 shrink-0" />
                      رکوردهای در انتظار تأیید
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 font-bold text-xs">
                      {formatNum(pendingRecords.length)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    رکوردهای مسابقاتی ثبت‌شده توسط مربیان که برای اعمال در جدول رتبه‌بندی لیگ نیازمند تأیید رسمی داور/مدیر هستند.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-amber-200/60 dark:border-amber-900/60">
                  <Link
                    to="/admin/assessments"
                    className="w-full text-center block py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs whitespace-nowrap"
                  >
                    تأیید رکوردهای شنا ←
                  </Link>
                </div>
              </div>
            )}

            {/* Priority 4 (NORMAL SKY): Pending Online Registrations */}
            {pendingRequests.length > 0 && (
              <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-900/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-sky-800 dark:text-sky-200 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-sky-600 shrink-0" />
                      پیش‌ثبت‌نام‌های آنلاین
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-sky-200 dark:bg-sky-900/80 text-sky-800 dark:text-sky-200 font-bold text-xs">
                      {formatNum(pendingRequests.length)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    متقاضیانی که فرم ثبت‌نام دوره‌ها را از طریق سایت تکمیل کرده و در انتظار بررسی و پذیرش نهایی هستند.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-sky-200/60 dark:border-sky-900/60">
                  <Link
                    to="/admin/enrollments"
                    className="w-full text-center block py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs whitespace-nowrap"
                  >
                    بررسی درخواست‌ها ←
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Today's Pool Classes Schedule */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-colors space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
              برنامه سانس‌های کلاس امروز استخر ({formatNum(todaySessions.length)} سانس)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              مربیان مسئول، ظرفیت ثبت‌نامی، زمان‌بندی دقیق و وضعیت حضور و غیاب هر جلسه
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Schedule Filter Buttons */}
            {todaySessions.length > 0 && (
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs border border-slate-200/60 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setScheduleFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    scheduleFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  همه ({formatNum(todaySessions.length)})
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleFilter('UPCOMING')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    scheduleFilter === 'UPCOMING'
                      ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  پیش‌رو ({formatNum(remainingSessionsCount)})
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleFilter('COMPLETED')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    scheduleFilter === 'COMPLETED'
                      ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  برگزارشده ({formatNum(completedSessionsCount)})
                </button>
              </div>
            )}

            <Link
              to="/admin/attendance"
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline px-2 py-1 rounded-lg transition-colors whitespace-nowrap"
            >
              دفتر حضور و غیاب کلاسی ←
            </Link>
          </div>
        </div>

        {todaySessions.length === 0 ? (
          <EmptyState
            title="امروز هیچ سانس کلاسی زمان‌بندی نشده است"
            description="برای بررسی برنامه‌های آموزشی یا تعریف سانس‌های جدید، به بخش دوره‌ها و زمان‌بندی مراجعه نمایید."
            action={
              <Link
                to="/admin/courses"
                className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                مدیریت گروه‌ها و دوره‌ها
              </Link>
            }
          />
        ) : filteredSchedule.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            سانسی منطبق با فیلتر انتخابی برای امروز یافت نشد.
          </div>
        ) : (
          <>
            {/* Desktop & Tablet Table View */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <table className="w-full text-sm text-right min-w-[700px]">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 whitespace-nowrap">گروه کلاسی</th>
                    <th className="px-4 py-3 whitespace-nowrap">مربی مسئول</th>
                    <th className="px-4 py-3 whitespace-nowrap">زمان سانس</th>
                    <th className="px-4 py-3 whitespace-nowrap">محل استخر / لاین</th>
                    <th className="px-4 py-3 whitespace-nowrap">ظرفیت و پذیرش</th>
                    <th className="px-4 py-3 whitespace-nowrap">وضعیت برگزاری</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">اقدام عملیاتی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {filteredSchedule.map((session) => {
                    const liveState = getSessionLiveState(session);
                    const groupInfo = groupMap.get(session.group);

                    return (
                      <tr
                        key={session.id}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                          liveState.isLive ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                        }`}
                      >
                        <td className="px-4 py-3 min-w-[160px]">
                          <span className="font-bold text-slate-800 dark:text-slate-100 block">
                            {session.group_name}
                          </span>
                          {session.is_makeup && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                              (جلسه جبرانی)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {cleanCoachName(session.coach_name)}
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-300">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {session.start_time?.slice(0, 5)} تا {session.end_time?.slice(0, 5)}
                            </span>
                          </div>
                          {liveState.isLive && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                              در حال برگزاری
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{session.pool_location || 'استخر اصلی'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                          {groupInfo ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                                {formatNum(groupInfo.current_enrollments_count)} از {formatNum(groupInfo.capacity)}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                                  groupInfo.remaining_capacity <= 0
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                    : groupInfo.remaining_capacity <= 2
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}
                              >
                                {groupInfo.remaining_capacity <= 0
                                  ? 'تکمیل'
                                  : `${formatNum(groupInfo.remaining_capacity)} خالی`}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={liveState.variant}>
                            {liveState.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {session.status !== 'CANCELLED' ? (
                            <Link
                              to={`/admin/attendance?session_id=${session.id}`}
                              className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 font-bold text-xs border border-sky-200 dark:border-sky-800 transition-colors inline-flex items-center gap-1 shadow-2xs whitespace-nowrap"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                              <span>ثبت حضور</span>
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-400 whitespace-nowrap">لغوشده</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredSchedule.map((session) => {
                const liveState = getSessionLiveState(session);
                const groupInfo = groupMap.get(session.group);

                return (
                  <div
                    key={session.id}
                    className={`p-4 rounded-2xl border space-y-2.5 text-xs transition-colors ${
                      liveState.isLive
                        ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-300/70 dark:border-amber-800/80'
                        : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/70 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {session.group_name}
                      </span>
                      <Badge variant={liveState.variant}>
                        {liveState.label}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">مربی مسئول:</span>
                        <span className="font-medium">{cleanCoachName(session.coach_name)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">ساعت سانس:</span>
                        <span className="font-mono font-medium">
                          {session.start_time?.slice(0, 5)} تا {session.end_time?.slice(0, 5)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">محل استخر:</span>
                        <span>{session.pool_location || 'استخر اصلی'}</span>
                      </div>
                      {groupInfo && (
                        <div className="flex justify-between items-center pt-1 border-t border-slate-200/40 dark:border-slate-700/60">
                          <span className="text-slate-400">ظرفیت گروه:</span>
                          <span className="font-mono">
                            {formatNum(groupInfo.current_enrollments_count)} از {formatNum(groupInfo.capacity)} نفر ({formatNum(groupInfo.remaining_capacity)} جای خالی)
                          </span>
                        </div>
                      )}
                    </div>

                    {session.status !== 'CANCELLED' && (
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700">
                        <Link
                          to={`/admin/attendance?session_id=${session.id}`}
                          className="w-full py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs whitespace-nowrap"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          <span>ثبت حضور و غیاب</span>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 5. Analytics Visuals: Registrations Trend & Real Pool Capacity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Registrations Trend Chart (2 columns on lg) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-colors space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-1.5">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-600 shrink-0" />
                روند پذیرش شناگران در طول روزهای هفته
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                توزیع متقاضیان و ثبت‌نام‌های قطعی بر اساس روزهای هفته جاری
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="info">{weekPeriodLabel}</Badge>
            </div>
          </div>

          <BarChart
            data={weeklyChartData}
            color="sky"
            valueFormatter={(v) => `${v} نفر`}
          />

          <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>مجموع ثبت‌نام‌های هفته جاری: <strong className="text-slate-800 dark:text-slate-200 font-bold">{formatNum(weekEnrollmentsTotal)} نفر</strong></span>
            <Link to="/admin/reports" className="text-sky-600 dark:text-sky-400 hover:underline font-medium whitespace-nowrap">
              مشاهده گزارش جامع تحلیلی ←
            </Link>
          </div>

          {/* Operational Decision Aid: Underfilled Groups with High Empty Capacity */}
          {underfilledGroups.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  گروه‌های نیازمند تکمیل ظرفیت (بیش از ۴۰٪ ظرفیت خالی)
                </span>
                <Link to="/admin/enrollments" className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline whitespace-nowrap">
                  پذیرش متقاضیان ←
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {underfilledGroups.map((grp) => (
                  <div
                    key={grp.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1"
                  >
                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate" title={grp.name}>
                      {grp.name}
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px] font-mono">
                      <span>ثبت‌نام: {formatNum(grp.current_enrollments_count)} از {formatNum(grp.capacity)}</span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">{formatNum(grp.remaining_capacity)} جای خالی</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Real Pool Lane & Group Capacity (1 column on lg) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-colors space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
                  تکمیل ظرفیت گروه‌های استخر
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  پایش درصد اشغال و ظرفیت آزاد هر لاین و گروه
                </p>
              </div>
              <Badge variant="neutral">{formatNum(groups.length)} گروه</Badge>
            </div>

            {groups.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                هیچ گروه آموزشی برای نمایش ظرفیت ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-0.5">
                {groups.slice(0, 5).map((group) => {
                  const isFull = group.remaining_capacity <= 0 || group.status === 'FULL';
                  const isNear = !isFull && group.remaining_capacity <= 2;
                  const color = isFull ? 'rose' : isNear ? 'amber' : 'sky';

                  return (
                    <div key={group.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[190px]" title={group.name}>
                          {group.name}
                        </span>
                        <Badge variant={isFull ? 'danger' : isNear ? 'warning' : 'success'}>
                          {isFull ? 'تکمیل' : isNear ? 'نزدیک به تکمیل' : 'ثبت‌نام باز'}
                        </Badge>
                      </div>

                      <ProgressBar
                        value={group.current_enrollments_count}
                        max={group.capacity}
                        color={color}
                        subtitle={`${formatNum(group.current_enrollments_count)} از ${formatNum(group.capacity)} نفر (${formatNum(group.remaining_capacity)} جای خالی)`}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
            <Link
              to="/admin/courses"
              className="w-full text-center block py-2.5 px-3 text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 rounded-xl transition-colors whitespace-nowrap"
            >
              مدیریت دوره‌ها و گروه‌ها ←
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
