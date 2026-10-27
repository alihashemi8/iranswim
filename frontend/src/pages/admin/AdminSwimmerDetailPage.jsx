import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight, User, Phone, Calendar, CreditCard, Award,
  BookOpen, Clock, ShieldAlert, CheckCircle2, AlertCircle,
  FileText, ShieldCheck, Mail, Activity, ChevronLeft, MapPin
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { StatsCard } from '../../components/common/StatsCard';
import { useToast } from '../../context/ToastContext';

export const AdminSwimmerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [swimmer, setSwimmer] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('INFO'); // INFO, ENROLLMENTS, ATTENDANCE, FINANCE, ASSESSMENTS

  useEffect(() => {
    const fetchDossier = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [swimmerRes, enrollRes, attRes, invRes, recRes] = await Promise.allSettled([
          api.get(`/swimmers/${id}/`),
          api.get(`/education/enrollments/?swimmer_id=${id}`),
          api.get(`/attendance/?swimmer_id=${id}`),
          api.get(`/finance/invoices/?swimmer_id=${id}`),
          api.get(`/assessments/records/?swimmer_id=${id}`),
        ]);

        if (swimmerRes.status === 'fulfilled' && swimmerRes.value?.data) {
          setSwimmer(swimmerRes.value.data);
        } else {
          toast.error('اطلاعات شناگر یافت نشد.');
        }

        if (enrollRes.status === 'fulfilled') {
          setEnrollments(enrollRes.value.data.results || enrollRes.value.data || []);
        }
        if (attRes.status === 'fulfilled') {
          setAttendance(attRes.value.data.results || attRes.value.data || []);
        }
        if (invRes.status === 'fulfilled') {
          setInvoices(invRes.value.data.results || invRes.value.data || []);
        }
        if (recRes.status === 'fulfilled') {
          setRecords(recRes.value.data.results || recRes.value.data || []);
        }
      } catch (err) {
        console.error('Error fetching swimmer details:', err);
        toast.error('خطا در دریافت پرونده شناگر');
      } finally {
        setLoading(false);
      }
    };

    fetchDossier();
  }, [id]);

  const formatPrice = (val) => Number(val || 0).toLocaleString('fa-IR');

  const totalRemainingBalance = invoices.reduce(
    (sum, inv) => sum + Number(inv.remaining_balance || 0),
    0
  );
  const totalSessionsRemaining = enrollments.reduce(
    (sum, enr) => sum + Number(enr.remaining_sessions || 0),
    0
  );
  const totalSessionsAttended = enrollments.reduce(
    (sum, enr) => sum + Number(enr.sessions_attended || 0),
    0
  );

  if (loading) {
    return <LoadingState type="dashboard" message="در حال بارگذاری پرونده جامع شناگر..." />;
  }

  if (!swimmer) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-800 space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">شناگر مورد نظر یافت نشد</h2>
        <p className="text-xs text-slate-500">ممکن است این شناگر حذف شده یا شناسه واردشده نامعتبر باشد.</p>
        <Button onClick={() => navigate('/admin/swimmers')} variant="outline" className="text-xs gap-1.5">
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به فهرست شناگران</span>
        </Button>
      </div>
    );
  }

  const swimmerInitial = swimmer.full_name ? swimmer.full_name.trim().charAt(0) : 'ش';

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link to="/admin/swimmers" className="hover:text-sky-600 transition-colors">
            شناگران
          </Link>
          <span>/</span>
          <span className="text-slate-700 dark:text-slate-200 font-semibold">{swimmer.full_name}</span>
        </div>
      </div>

      {/* Main Hero Header Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shrink-0 shadow-md">
              {swimmerInitial}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {swimmer.full_name}
                </h1>
                <Badge variant={swimmer.gender === 'FEMALE' ? 'warning' : 'info'}>
                  {swimmer.gender_display || (swimmer.gender === 'FEMALE' ? 'دختر / بانوان' : 'پسر / آقایان')}
                </Badge>
                {swimmer.is_active ? (
                  <Badge variant="success">فعال در آموزشگاه</Badge>
                ) : (
                  <Badge variant="neutral">غیرفعال</Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                <span className="font-mono flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`tel:${swimmer.phone}`} className="hover:text-sky-600">
                    {swimmer.phone}
                  </a>
                </span>
                {swimmer.national_id && (
                  <span className="font-mono flex items-center gap-1">
                    <span>کد ملی:</span>
                    <span>{swimmer.national_id}</span>
                  </span>
                )}
                {swimmer.level_name && (
                  <span className="text-sky-600 dark:text-sky-400 font-medium flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>سطح فعلی: {swimmer.level_name}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <a
              href={`tel:${swimmer.phone}`}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-sky-600" />
              <span>تماس مستقیم</span>
            </a>
            <Link
              to={`/admin/finance?search=${encodeURIComponent(swimmer.full_name)}`}
              className="px-3.5 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 border border-sky-200 dark:border-sky-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5 text-sky-600" />
              <span>فاکتورها و پرداخت‌ها</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Overview Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title="دوره‌های آموزشی"
          value={`${enrollments.length} دوره`}
          subtitle="سوابق ثبت‌نام کلاسی"
          icon={BookOpen}
          color="indigo"
        />
        <StatsCard
          title="جلسات باقی‌مانده"
          value={`${totalSessionsRemaining} جلسه`}
          subtitle={`مصرف‌شده: ${totalSessionsAttended} جلسه`}
          icon={Clock}
          color="sky"
        />
        <StatsCard
          title="مانده بدهی شهریه"
          value={`${formatPrice(totalRemainingBalance)} تومان`}
          subtitle={totalRemainingBalance > 0 ? 'دارای معوقه پرداخت‌نشده' : 'تسویه کامل'}
          icon={CreditCard}
          color={totalRemainingBalance > 0 ? 'rose' : 'emerald'}
        />
        <StatsCard
          title="رکوردهای ثبت‌شده"
          value={`${records.length} رکورد`}
          subtitle="ارزیابی‌های رکوردی شنا"
          icon={Award}
          color="amber"
        />
      </div>

      {/* Profile Section Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors space-y-6">
        <div className="flex w-full bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700 text-xs gap-1 overflow-x-auto">
          {[
            { key: 'INFO', label: 'اطلاعات هویتی و پزشکی', icon: User },
            { key: 'ENROLLMENTS', label: `دوره‌ها و کلاس‌ها (${enrollments.length})`, icon: BookOpen },
            { key: 'ATTENDANCE', label: `دفتر حضور و غیاب (${attendance.length})`, icon: Calendar },
            { key: 'FINANCE', label: `امور مالی و فاکتورها (${invoices.length})`, icon: CreditCard },
            { key: 'ASSESSMENTS', label: `رکوردهای ثبت‌شده (${records.length})`, icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 min-w-0 py-2.5 px-3 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: INFO */}
        {activeTab === 'INFO' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-sky-600" />
                <span>اطلاعات پایه و مشخصات سجلی</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-400 block mb-1">نام کامل:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{swimmer.full_name}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-400 block mb-1">شماره تماس اصلی:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-sm">{swimmer.phone}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-400 block mb-1">کد ملی:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-200 font-semibold">{swimmer.national_id || '—'}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-400 block mb-1">تاریخ تولد:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-200">{swimmer.date_of_birth || 'ثبت‌نشده'}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-400 block mb-1">سطح مهارت شنا:</span>
                  <span className="font-bold text-sky-600 dark:text-sky-400">{swimmer.level_name || 'تعیین سطح نشده'}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-400 block mb-1">تاریخ ثبت پرونده:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-200">
                    {swimmer.created_at ? new Date(swimmer.created_at).toLocaleDateString('fa-IR') : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>اطلاعات تماس اضطراری و والد</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-400 block mb-1">نام والد / رابط اضطراری:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{swimmer.emergency_contact_name || '—'}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-400 block mb-1">شماره تماس اضطراری:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{swimmer.emergency_contact_phone || '—'}</span>
                </div>
              </div>
            </div>

            {/* Medical Notes */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>ملاحظات پزشکی و حساسیت‌ها</span>
              </h3>
              {swimmer.medical_notes ? (
                <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 text-xs leading-relaxed">
                  {swimmer.medical_notes}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-slate-400 text-xs">
                  هیچ نکته پزشکی یا حساسیت خاصی برای این شناگر ثبت نشده است.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: ENROLLMENTS */}
        {activeTab === 'ENROLLMENTS' && (
          <div className="space-y-4">
            {enrollments.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                هیچ دوره آموزشی فعالی برای این شناگر ثبت نشده است.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enrollments.map((enr) => (
                  <div
                    key={enr.id}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {enr.course_name}
                        </h4>
                        <span className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 block">
                          گروه: {enr.group_name}
                        </span>
                      </div>
                      <Badge variant={enr.is_active ? 'success' : 'neutral'}>
                        {enr.is_active ? 'فعال' : 'خاتمه‌یافته'}
                      </Badge>
                    </div>

                    {enr.pool_location && (
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-sky-500" />
                        <span>{enr.pool_location}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div>
                        <span className="text-slate-400 block text-[10px]">جلسات باقی‌مانده</span>
                        <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-sm">
                          {enr.remaining_sessions} جلسه
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">جلسات حضور یافته</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          {enr.sessions_attended} جلسه
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: ATTENDANCE */}
        {activeTab === 'ATTENDANCE' && (
          <div className="space-y-4">
            {attendance.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                هنوز هیچ سابقه حضور و غیابی برای این شناگر ثبت نشده است.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3 rounded-r-xl">تاریخ جلسه</th>
                      <th className="px-4 py-3">وضعیت حضور</th>
                      <th className="px-4 py-3">یادداشت و توضیحات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {attendance.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors text-xs">
                        <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                          {new Date(att.recorded_at).toLocaleDateString('fa-IR')}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              att.status === 'PRESENT'
                                ? 'success'
                                : att.status === 'EXCUSED'
                                ? 'info'
                                : att.status === 'LATE'
                                ? 'warning'
                                : 'danger'
                            }
                          >
                            {att.status_display}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          {att.note || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: FINANCE */}
        {activeTab === 'FINANCE' && (
          <div className="space-y-4">
            {invoices.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                صورتحساب مالی برای این شناگر ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-sm">
                          {inv.invoice_number}
                        </span>
                        <span className="text-slate-400 block text-[11px] font-mono mt-0.5">
                          تاریخ صدور: {new Date(inv.created_at).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                      <Badge
                        variant={
                          inv.status === 'PAID'
                            ? 'success'
                            : inv.status === 'PARTIALLY_PAID'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {inv.status_display}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
                      <div>
                        <span className="text-slate-400 block text-[10px]">مبلغ کل</span>
                        <span className="font-mono text-slate-700 dark:text-slate-200 font-bold">
                          {formatPrice(inv.total_amount)} تومان
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">پرداخت‌شده</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatPrice(inv.total_paid)} تومان
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">مانده بدهی</span>
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                          {formatPrice(inv.remaining_balance)} تومان
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: ASSESSMENTS */}
        {activeTab === 'ASSESSMENTS' && (
          <div className="space-y-4">
            {records.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                هنوز هیچ رکورد زمانی یا ارزیابی مسابقاتی برای این شناگر ثبت نشده است.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {records.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {rec.distance_meters} متر {rec.stroke_display || rec.stroke}
                        </h4>
                        <span className="font-mono text-slate-400 text-[11px] block mt-0.5">
                          {new Date(rec.recorded_at).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                      <Badge variant={rec.verification_status === 'VERIFIED' ? 'success' : 'warning'}>
                        {rec.verification_status === 'VERIFIED' ? 'تأیید رسمی' : 'در انتظار بررسی'}
                      </Badge>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-between items-center">
                      <span className="text-slate-400">زمان ثبت‌شده:</span>
                      <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-base">
                        {rec.duration_seconds} ثانیه
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
