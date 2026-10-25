import React, { useState, useEffect } from 'react';
import { Users, BookOpen, CreditCard, Calendar, TrendingUp, AlertCircle, Plus } from 'lucide-react';
import api from '../../api/client';
import { StatsCard } from '../../components/common/StatsCard';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [finance, setFinance] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [healthRes, financeRes, reqsRes] = await Promise.all([
          api.get('/supervisor/health/'),
          api.get('/finance/summary/'),
          api.get('/education/requests/?status=PENDING'),
        ]);
        setStats(healthRes.data.system_stats);
        setFinance(financeRes.data);
        setPendingRequests(reqsRes.data.results || reqsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading && !stats) {
    return <LoadingState message="در حال دریافت اطلاعات مدیریتی آموزشگاه..." />;
  }

  const formatPrice = (val) => Number(val || 0).toLocaleString('fa-IR');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-l from-sky-600 to-sky-700 rounded-2xl p-6 text-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">مرکز کنترل و مدیریت آموزشگاه شنا (مدیر)</h1>
          <p className="text-sky-100 text-sm mt-1">
            نظارت بر ثبت‌نام‌ها، دوره‌های فعال، امور مالی، زمان‌بندی جلسات و مربیان
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/enrollments"
            className="px-4 py-2 bg-white text-sky-700 hover:bg-sky-50 font-medium rounded-xl text-xs transition-colors shadow-xs"
          >
            بررسی درخواست‌های جدید ({pendingRequests.length})
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="شناگران فعال"
          value={`${stats?.active_swimmers ?? 0} نفر`}
          subtitle="دارای دوره آموزشی فعال"
          icon={Users}
          color="sky"
        />
        <StatsCard
          title="کل واریزی‌ها و درآمد"
          value={`${formatPrice(finance?.total_paid)} تومان`}
          subtitle={`تسهیم به فاکتورها: ${finance?.total_paid ? 'قطعی' : '۰'}`}
          icon={CreditCard}
          color="emerald"
        />
        <StatsCard
          title="مطالبات معوق / مانده"
          value={`${formatPrice(finance?.receivables)} تومان`}
          subtitle={`اقساط سررسید گذشته: ${finance?.overdue_installments_count ?? 0} مورد`}
          icon={AlertCircle}
          color={(finance?.overdue_installments_count || 0) > 0 ? 'amber' : 'emerald'}
        />
        <StatsCard
          title="گروه‌های آموزشی فعال"
          value={`${stats?.active_groups ?? 0} گروه`}
          subtitle={`جلسات کلاسی ثبت‌شده: ${stats?.total_sessions ?? 0}`}
          icon={BookOpen}
          color="indigo"
        />
      </div>

      {/* Pending Requests & Quick Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              درخواست‌های ثبت‌نام آنلاین در انتظار تأیید
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              درخواست‌های ثبت‌شده توسط متقاضیان از طریق پرتال عمومی سایت
            </p>
          </div>
          <Link to="/admin/enrollments" className="text-xs font-medium text-sky-600 hover:text-sky-700">
            مشاهده همه ({pendingRequests.length}) ←
          </Link>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500">
            در حال حاضر هیچ درخواست جدیدی در صف انتظار قرار ندارد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">نام متقاضی</th>
                  <th className="px-4 py-3">شماره تماس</th>
                  <th className="px-4 py-3">دوره و گروه</th>
                  <th className="px-4 py-3">تاریخ ثبت</th>
                  <th className="px-4 py-3 text-center">اقدام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingRequests.slice(0, 5).map((req) => (
                  <tr key={req.id}>
                    <td className="px-4 py-3 font-medium text-slate-800">{req.applicant_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{req.applicant_phone}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">{req.course_name} - {req.group_name}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                      {new Date(req.created_at).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        to="/admin/enrollments"
                        className="px-3 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 font-medium text-xs rounded-lg border border-sky-200 transition-colors"
                      >
                        بررسی و تأیید
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
