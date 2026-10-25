import React, { useState, useEffect } from 'react';
import { Calendar, CreditCard, Award, Timer, Trophy, CheckCircle2, Clock } from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { StatsCard } from '../../components/common/StatsCard';

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
      <div className="bg-gradient-to-l from-indigo-600 to-sky-600 rounded-2xl p-6 text-white shadow-xs">
        <h1 className="text-xl font-bold">پرتال اختصاصی شناگر</h1>
        <p className="text-indigo-100 text-sm mt-1">
          مشاهده سهمیه جلسات باقیمانده، برنامه تمرینی، صورتحساب‌ها و پیشرفت مهارتی شما
        </p>
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
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-4">
            <div>
              <span className="text-xs text-slate-500 block">دوره آموزشی فعال شما:</span>
              <h2 className="text-base font-bold text-slate-900">{activeEnrollment.course_name}</h2>
              <p className="text-xs text-sky-600 font-medium mt-0.5">{activeEnrollment.group_name}</p>
            </div>
            <div className="text-left">
              <span className="text-xs text-slate-500 block">مصرف جلسات:</span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                {activeEnrollment.sessions_attended} از {activeEnrollment.sessions_purchased} جلسه
              </span>
            </div>
          </div>

          <div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.round((activeEnrollment.sessions_attended / activeEnrollment.sessions_purchased) * 100))}%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              با حضور در هر جلسه کلاسی، سهمیه شما به‌طور خودکار کسر می‌گردد؛ غیبت‌های موجه کسر نخواهند شد.
            </p>
          </div>
        </div>
      )}

      {/* Schedule & Financial Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Sessions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 pb-3 mb-3 border-b border-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-600" />
            جلسات کلاسی آینده شما
          </h3>
          {sessions.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">جلسه‌ای برای شما تنظیم نشده است.</p>
          ) : (
            <div className="space-y-2.5">
              {sessions.slice(0, 5).map((sess) => (
                <div key={sess.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800 block">{sess.group_name}</span>
                    <span className="text-slate-500 font-mono mt-0.5 block">{sess.pool_location}</span>
                  </div>
                  <div className="text-left font-mono">
                    <span className="font-bold text-slate-800 block">{sess.session_date}</span>
                    <span className="text-slate-500 text-[11px]">{sess.start_time?.slice(0, 5)} تا {sess.end_time?.slice(0, 5)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invoices */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 pb-3 mb-3 border-b border-slate-100 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            صورتحساب‌ها و اقساط شخصی
          </h3>
          {invoices.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">صورتحسابی ثبت نشده است.</p>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div key={inv.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-slate-800">{inv.invoice_number}</span>
                    <Badge variant={inv.status === 'PAID' ? 'success' : 'warning'}>
                      {inv.status_display}
                    </Badge>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600 border-t border-slate-200/40">
                    <span>مبلغ کل شهریه:</span>
                    <span className="font-mono">{formatPrice(inv.total_amount)} تومان</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>پرداخت‌شده:</span>
                    <span className="font-mono font-semibold text-emerald-600">{formatPrice(inv.total_paid)} تومان</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>مانده قابل پرداخت:</span>
                    <span className="font-mono font-bold text-rose-600">{formatPrice(inv.remaining_balance)} تومان</span>
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
