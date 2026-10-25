import React, { useState, useEffect } from 'react';
import { Calendar, CreditCard, Award, Timer, MapPin, Sparkles } from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { StatsCard } from '../../components/common/StatsCard';
import { ProgressBar } from '../../components/common/Charts';

export const SwimmerPortal = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSwimmerData = async () => {
      try {
        setLoading(true);
        const [enrRes, sessRes, invRes, assRes, recRes] = await Promise.all([
          api.get('/education/enrollments/'),
          api.get('/scheduling/sessions/'),
          api.get('/finance/invoices/'),
          api.get('/assessments/skills/'),
          api.get('/assessments/records/'),
        ]);
        setEnrollments(enrRes.data.results || enrRes.data);
        setSessions(sessRes.data.results || sessRes.data);
        setInvoices(invRes.data.results || invRes.data);
        setAssessments(assRes.data.results || assRes.data);
        setRecords(recRes.data.results || recRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSwimmerData();
  }, []);

  if (loading) {
    return <LoadingState message="در حال بارگذاری پرونده شناگر..." />;
  }

  const activeEnrollment = enrollments[0];
  const totalRemainingSessions = enrollments.reduce((acc, curr) => acc + (curr.remaining_sessions || 0), 0);
  const totalDebt = invoices.reduce((acc, curr) => acc + Number(curr.remaining_balance || 0), 0);
  const formatPrice = (val) => Number(val || 0).toLocaleString('fa-IR');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-l from-indigo-600 via-sky-600 to-cyan-600 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold mb-2 text-cyan-100">
            <Sparkles className="w-3.5 h-3.5" />
            شناگر فعال آکادمی
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">پرتال اختصاصی شناگر</h1>
          <p className="text-indigo-100 text-sm mt-1 max-w-xl font-light">
            مشاهده سهمیه جلسات باقیمانده، برنامه تمرینی، صورتحساب‌ها و نمودار پیشرفت مهارتی شما
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="جلسات باقیمانده شما"
          value={`${totalRemainingSessions} جلسه`}
          subtitle="سهمیه مجاز ورود به استخر"
          icon={Calendar}
          color="sky"
        />
        <StatsCard
          title="مهارت‌های پاس‌شده"
          value={`${assessments.filter((a) => a.status === 'PASSED').length} مهارت`}
          subtitle="تأییدشده توسط مربیان"
          icon={Award}
          color="emerald"
        />
        <StatsCard
          title="مانده بدهی شهریه"
          value={`${formatPrice(totalDebt)} تومان`}
          subtitle={totalDebt > 0 ? 'دارای قسط سررسیددار' : 'تسویه کامل'}
          icon={CreditCard}
          color={totalDebt > 0 ? 'amber' : 'emerald'}
        />
        <StatsCard
          title="بهترین رکورد ثبت‌شده"
          value={records[0]?.formatted_time || '—'}
          subtitle={records[0] ? `${records[0].distance_meters}م ${records[0].stroke_display}` : 'بدون رکورد'}
          icon={Timer}
          color="indigo"
        />
      </div>

      {/* Enrolled Courses & Progress Bar */}
      {activeEnrollment && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2 mb-4">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">دوره آموزشی فعال شما:</span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{activeEnrollment.course_name}</h2>
              <p className="text-xs text-sky-600 dark:text-sky-400 font-medium mt-0.5">{activeEnrollment.group_name}</p>
            </div>
            <div className="text-left">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">مصرف جلسات:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                {activeEnrollment.sessions_attended} از {activeEnrollment.sessions_purchased} جلسه
              </span>
            </div>
          </div>

          <div>
            <ProgressBar
              label="پیشرفت جلسات مصرف‌شده دوره"
              value={activeEnrollment.sessions_attended}
              max={activeEnrollment.sessions_purchased}
              color="sky"
              subtitle={`باقیمانده: ${activeEnrollment.remaining_sessions} جلسه مجاز`}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
              با حضور در هر جلسه کلاسی، سهمیه شما به‌طور خودکار کسر می‌گردد؛ غیبت‌های موجه کسر نخواهند شد.
            </p>
          </div>
        </div>
      )}

      {/* Skills Assessment Roadmap */}
      {assessments.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              سوابق ارزیابی تکنیک‌ها و مهارت‌های آب‌نوردی
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {assessments.length} سرفصل مهارتی
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {assessments.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start justify-between gap-3"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.skill_name}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{item.feedback || 'ارزیابی انجام شده'}</p>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">مربی: {item.coach_name}</span>
                </div>
                <Badge variant={item.status === 'PASSED' ? 'success' : 'warning'}>
                  {item.status === 'PASSED' ? 'قبول ✓' : 'نیازمند تمرین'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule & Financial Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Sessions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 mb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-600" />
            جلسات کلاسی آینده شما
          </h3>
          {sessions.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">جلسه‌ای برای شما تنظیم نشده است.</p>
          ) : (
            <div className="space-y-2.5">
              {sessions.slice(0, 5).map((sess) => (
                <div key={sess.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{sess.group_name}</span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono mt-0.5 block">{sess.pool_location}</span>
                  </div>
                  <div className="text-left font-mono">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">{sess.session_date}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">{sess.start_time?.slice(0, 5)} تا {sess.end_time?.slice(0, 5)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invoices */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 mb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            صورتحساب‌ها و اقساط شخصی
          </h3>
          {invoices.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">صورتحسابی ثبت نشده است.</p>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div key={inv.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{inv.invoice_number}</span>
                    <Badge variant={inv.status === 'PAID' ? 'success' : 'warning'}>
                      {inv.status_display}
                    </Badge>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300 border-t border-slate-200/40 dark:border-slate-800">
                    <span>مبلغ کل شهریه:</span>
                    <span className="font-mono">{formatPrice(inv.total_amount)} تومان</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
                    <span>پرداخت‌شده:</span>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{formatPrice(inv.total_paid)} تومان</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
                    <span>مانده قابل پرداخت:</span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{formatPrice(inv.remaining_balance)} تومان</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
