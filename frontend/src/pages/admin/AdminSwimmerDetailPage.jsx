import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight, User, Phone, Calendar, CreditCard, Award,
  BookOpen, Clock, ShieldAlert, CheckCircle2, AlertCircle,
  FileText, ShieldCheck, Mail, Activity, ChevronLeft, MapPin, PlusCircle,
  XCircle, ZoomIn, Send
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { StatsCard } from '../../components/common/StatsCard';
import { MapLocationPicker } from '../../components/common/MapLocationPicker';
import { BackButton } from '../../components/common/BackButton';
import { SecureImage } from '../../components/common/SecureImage';
import { getMediaUrl, getAuthenticatedDocUrl } from '../../utils/media';
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

  // Document Review States (Step 3)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState(null);

  const quickRejectReasons = [
    'تصویر کارت ملی ناخوانا یا دارای بازتاب نور است، لطفاً تصویر واضح‌تری بارگذاری فرمایید.',
    'عکس صفحه اول شناسنامه کامل نبوده یا بخش‌هایی از آن پوشانده شده است.',
    'کارت بیمه ورزشی فاقد تاریخ معتبر است یا منقضی گردیده است.',
    'مشخصات فردی ثبت‌شده با مندرجات کارت ملی یا شناسنامه مطابقت ندارد.',
  ];

  const handleApproveDocuments = async () => {
    try {
      setReviewing(true);
      const res = await api.post(`/swimmers/${id}/review-documents/`, {
        action: 'APPROVE',
      });
      if (res.data?.swimmer) {
        setSwimmer(res.data.swimmer);
      }
      toast.success(res.data?.detail || 'مدارک هویتی شناگر با موفقیت تأیید شد و اعلان برای شناگر ارسال گردید.');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در تأیید مدارک شناگر');
    } finally {
      setReviewing(false);
    }
  };

  const handleRejectDocuments = async (e) => {
    if (e) e.preventDefault();
    if (!rejectReason.trim()) {
      toast.error('لطفاً علت و توضیحات رد مدارک را وارد فرمایید.');
      return;
    }
    try {
      setReviewing(true);
      const res = await api.post(`/swimmers/${id}/review-documents/`, {
        action: 'REJECT',
        reason: rejectReason.trim(),
      });
      if (res.data?.swimmer) {
        setSwimmer(res.data.swimmer);
      }
      toast.success(res.data?.detail || 'مدارک شناگر رد شد و پیام به بخش اعلانات شناگر ارسال گردید.');
      setIsRejectModalOpen(false);
      setRejectReason('');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت رد مدارک');
    } finally {
      setReviewing(false);
    }
  };

  const getDocStatusBadge = (status, hasImage) => {
    if (!hasImage || status === 'UNUPLOADED') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg">
          بارگذاری‌نشده
        </span>
      );
    }
    if (status === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5" />
          تأییدشده
        </span>
      );
    }
    if (status === 'REVISION_REQUIRED' || status === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-lg border border-rose-200 dark:border-rose-800">
          <XCircle className="w-3.5 h-3.5" />
          نیازمند اصلاح
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
        <Clock className="w-3.5 h-3.5" />
        در انتظار بررسی
      </span>
    );
  };

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

  // Smooth scroll to documents section if hash is present
  useEffect(() => {
    if (!loading && swimmer && window.location.hash.includes('documents')) {
      setActiveTab('INFO');
      setTimeout(() => {
        const el = document.getElementById('documents-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [loading, swimmer]);

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
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">شناگر مورد نظر یافت نشد</h2>
        <p className="text-sm text-slate-500">ممکن است این شناگر حذف شده یا شناسه واردشده نامعتبر باشد.</p>
        <BackButton to="/admin/swimmers" label="بازگشت به فهرست شناگران" showLabelAlways />
      </div>
    );
  }

  const swimmerInitial = swimmer.full_name ? swimmer.full_name.trim().charAt(0) : 'ش';

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center gap-3">
        <BackButton fallback="/admin/swimmers" title="بازگشت به فهرست شناگران" />
        <div className="flex items-center gap-2 text-sm sm:text-base text-slate-500 dark:text-slate-400 min-w-0 flex-1">
          <Link to="/admin/swimmers" className="hover:text-sky-600 dark:hover:text-sky-400 font-bold transition-colors shrink-0">
            شناگران و پرونده‌ها
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-slate-800 dark:text-slate-200 font-extrabold truncate">{swimmer.full_name}</span>
        </div>
      </div>

      {/* Main Hero Header Card */}
      <div className="p-5 sm:p-6 lg:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
            {/* Swimmer Avatar Image with fallback to Initial */}
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden shrink-0 shadow-md border border-slate-200/80 dark:border-slate-700/80 bg-gradient-to-tr from-sky-600 via-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl sm:text-3xl">
              {swimmer.avatar ? (
                <SecureImage
                  src={swimmer.avatar}
                  alt={swimmer.full_name}
                  className="w-full h-full object-cover"
                  fallbackText={swimmerInitial}
                />
              ) : (
                <span>{swimmerInitial}</span>
              )}
            </div>

            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {swimmer.full_name}
                </h1>
                <Badge variant={swimmer.gender === 'FEMALE' ? 'warning' : 'info'} size="md">
                  {swimmer.gender_display || (swimmer.gender === 'FEMALE' ? 'دختر / بانوان' : 'پسر / آقایان')}
                </Badge>
                {swimmer.is_active ? (
                  <Badge variant="success" size="md">فعال در آموزشگاه</Badge>
                ) : (
                  <Badge variant="neutral" size="md">غیرفعال</Badge>
                )}
              </div>

              <div className="flex items-center gap-3.5 sm:gap-5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 flex-wrap pt-0.5">
                <span className="flex items-center gap-1.5 font-medium">
                  <Phone className="w-4 h-4 text-sky-500 shrink-0" />
                  <a href={`tel:${swimmer.phone}`} className="font-mono font-bold text-slate-800 dark:text-slate-200 hover:text-sky-600" dir="ltr">
                    {swimmer.phone}
                  </a>
                </span>
                {swimmer.national_id && (
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="text-slate-400">کد ملی:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200" dir="ltr">{swimmer.national_id}</span>
                  </span>
                )}
                {swimmer.level_name && (
                  <span className="text-sky-600 dark:text-sky-400 font-bold flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>سطح فعلی: {swimmer.level_name}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Responsive Grid on Mobile, Flex on Desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:items-center gap-2 sm:gap-2.5 w-full lg:w-auto shrink-0">
            <a
              href={`tel:${swimmer.phone}`}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Phone className="w-4 h-4 text-sky-600 shrink-0" />
              <span>تماس مستقیم</span>
            </a>
            <Link
              to={`/admin/finance?search=${encodeURIComponent(swimmer.full_name)}`}
              className="px-4 py-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <CreditCard className="w-4 h-4 text-sky-600 shrink-0" />
              <span>فاکتورها و پرداخت‌ها</span>
            </Link>
            <Link
              to={`/admin/swimmers/${id}/enroll`}
              className="px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>ثبت‌نام در کلاس جدید</span>
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
        <div className="flex w-full bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700 gap-1.5 overflow-x-auto scrollbar-none">
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
                className={`flex-1 min-w-[130px] sm:min-w-0 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm'
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
              <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-sky-600 shrink-0" />
                  <span>اطلاعات پایه و مشخصات سجلی شناگر</span>
                </h3>
                <Badge variant={swimmer.is_profile_completed ? 'success' : 'warning'} size="md">
                  {swimmer.is_profile_completed ? 'پرونده هویتی تکمیل شده' : 'پرونده ناقص / در انتظار مدارک'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">نام و نام خانوادگی:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">{swimmer.full_name}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">نام پدر:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">{swimmer.father_name || '—'}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">کد ملی شناگر:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-100 font-bold text-sm sm:text-base" dir="ltr">{swimmer.national_id || '—'}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">تاریخ تولد:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-100 font-bold text-sm sm:text-base" dir="ltr">{swimmer.date_of_birth || 'ثبت‌نشده'}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">جنسیت:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base">{swimmer.gender_display || (swimmer.gender === 'FEMALE' ? 'دختر / بانوان' : 'پسر / آقایان')}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">نام مدرسه:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base">{swimmer.school_name || '—'}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">سطح مهارت شنا:</span>
                  <span className="font-black text-sky-600 dark:text-sky-400 text-sm sm:text-base">{swimmer.level_name || 'تعیین سطح نشده'}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">شماره همراه شناگر:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm sm:text-base" dir="ltr">{swimmer.phone}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">تاریخ عضویت در آکادمی:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-100 font-bold text-sm sm:text-base" dir="ltr">
                    {swimmer.created_at ? new Date(swimmer.created_at).toLocaleDateString('fa-IR') : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Parents Contact */}
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-3.5 flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>اطلاعات تماس اولیاء (پدر و مادر)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">شماره تماس پدر:</span>
                  {swimmer.father_phone ? (
                    <a href={`tel:${swimmer.father_phone}`} className="font-mono font-bold text-sky-600 hover:underline text-sm sm:text-base" dir="ltr">
                      {swimmer.father_phone}
                    </a>
                  ) : (
                    <span className="text-slate-400 text-sm">ثبت‌نشده</span>
                  )}
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">شغل پدر:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                    {swimmer.father_job || 'ثبت‌نشده'}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">شماره تماس مادر:</span>
                  {swimmer.mother_phone ? (
                    <a href={`tel:${swimmer.mother_phone}`} className="font-mono font-bold text-pink-600 hover:underline text-sm sm:text-base" dir="ltr">
                      {swimmer.mother_phone}
                    </a>
                  ) : (
                    <span className="text-slate-400 text-sm">ثبت‌نشده</span>
                  )}
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">شغل مادر:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                    {swimmer.mother_job || 'ثبت‌نشده'}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 sm:col-span-2 lg:col-span-2">
                  <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">رابط اضطراری:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                    {swimmer.emergency_contact_name ? `${swimmer.emergency_contact_name} (${swimmer.emergency_contact_phone || '—'})` : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Home Address & Map Location */}
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-3.5 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-sky-600 shrink-0" />
                <span>نشانی محل سکونت و موقعیت روی نقشه</span>
              </h3>
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">آدرس متنی:</span>
                  <span className="text-slate-800 dark:text-slate-100 leading-relaxed font-semibold text-sm sm:text-base">
                    {swimmer.address || 'آدرسی توسط شناگر ثبت نشده است.'}
                  </span>
                </div>

                {swimmer.latitude && swimmer.longitude ? (
                  <MapLocationPicker
                    latitude={swimmer.latitude}
                    longitude={swimmer.longitude}
                    readOnly={true}
                    height="280px"
                    label="موقعیت ثبت‌شده منزل شناگر روی نقشه"
                  />
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-slate-400 text-sm">
                    مختصات جغرافیایی روی نقشه هنوز تعیین نشده است.
                  </div>
                )}
              </div>
            </div>

            {/* Uploaded Documents Gallery & Verification Controls (Step 3 Review) */}
            <div id="documents-section" className="bg-slate-50/70 dark:bg-slate-800/40 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 pb-3 border-b border-slate-200/80 dark:border-slate-700/80">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0" />
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      بررسی مدارک هویتی شناگر (گام سوم ثبت‌نام)
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                    بررسی و تعیین وضعیت نهایی تصاویر شناسنامه، کارت ملی و بیمه ورزشی
                  </p>
                </div>

                {/* Action buttons: Approve / Reject */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto self-end sm:self-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setRejectReason(swimmer.documents_rejection_reason || '');
                      setIsRejectModalOpen(true);
                    }}
                    disabled={reviewing}
                    className="flex-1 sm:flex-initial px-4 py-2.5 text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4 text-rose-500" />
                    <span>رد مدارک / اعلام نقص</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={handleApproveDocuments}
                    loading={reviewing}
                    className="flex-1 sm:flex-initial px-4 py-2.5 text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأیید کامل مدارک</span>
                  </Button>
                </div>
              </div>

              {/* Rejection alert banner if rejected previously */}
              {swimmer.documents_rejection_reason && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-sm text-rose-800 dark:text-rose-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-rose-900 dark:text-rose-100">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>آخرین توضیحات ثبت‌شده برای نقص مدارک این شناگر:</span>
                  </div>
                  <p className="pr-6 font-medium leading-relaxed text-sm sm:text-base">
                    «{swimmer.documents_rejection_reason}»
                  </p>
                  <span className="block pr-6 text-xs text-rose-600/90 dark:text-rose-400/90 font-medium">
                    (این پیام به همراه راهنمای ویرایش مدارک در بخش اعلانات شناگر قرار دارد.)
                  </span>
                </div>
              )}

              {/* Documents Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                {/* 1. شناسنامه */}
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      عکس صفحه اول شناسنامه
                    </span>
                    {getDocStatusBadge(swimmer.birth_certificate_status, Boolean(swimmer.birth_certificate_image))}
                  </div>
                  {swimmer.birth_certificate_image ? (
                    <div
                      onClick={() => setSelectedPreviewImage({ title: 'عکس صفحه اول شناسنامه', url: swimmer.birth_certificate_image })}
                      className="group relative h-40 sm:h-44 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer bg-slate-100 dark:bg-slate-800"
                    >
                      <SecureImage
                        src={swimmer.birth_certificate_image}
                        alt="شناسنامه"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs sm:text-sm font-bold backdrop-blur-2xs">
                        <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>مشاهده بزرگنمایی</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 sm:h-44 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 text-xs sm:text-sm font-medium gap-1.5">
                      <span>بارگذاری نشده</span>
                    </div>
                  )}
                </div>

                {/* 2. کارت ملی */}
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      عکس کارت ملی
                    </span>
                    {getDocStatusBadge(swimmer.national_card_status, Boolean(swimmer.national_card_image))}
                  </div>
                  {swimmer.national_card_image ? (
                    <div
                      onClick={() => setSelectedPreviewImage({ title: 'عکس کارت ملی', url: swimmer.national_card_image })}
                      className="group relative h-40 sm:h-44 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer bg-slate-100 dark:bg-slate-800"
                    >
                      <SecureImage
                        src={swimmer.national_card_image}
                        alt="کارت ملی"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs sm:text-sm font-bold backdrop-blur-2xs">
                        <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>مشاهده بزرگنمایی</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 sm:h-44 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 text-xs sm:text-sm font-medium gap-1.5">
                      <span>بارگذاری نشده</span>
                    </div>
                  )}
                </div>

                {/* 3. بیمه ورزشی */}
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      عکس کارت بیمه ورزشی
                    </span>
                    {getDocStatusBadge(swimmer.sports_insurance_status, Boolean(swimmer.sports_insurance_image))}
                  </div>
                  {swimmer.sports_insurance_image ? (
                    <div
                      onClick={() => setSelectedPreviewImage({ title: 'عکس کارت بیمه ورزشی', url: swimmer.sports_insurance_image })}
                      className="group relative h-40 sm:h-44 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer bg-slate-100 dark:bg-slate-800"
                    >
                      <SecureImage
                        src={swimmer.sports_insurance_image}
                        alt="بیمه ورزشی"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs sm:text-sm font-bold backdrop-blur-2xs">
                        <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>مشاهده بزرگنمایی</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 sm:h-44 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 text-xs sm:text-sm font-medium gap-1.5">
                      <span>بارگذاری نشده</span>
                    </div>
                  )}
                </div>

                {/* 4. عکس پرسنلی */}
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      عکس پرسنلی / چهره
                    </span>
                    {swimmer.avatar ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        بارگذاری‌شده
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg">
                        بارگذاری‌نشده
                      </span>
                    )}
                  </div>
                  {swimmer.avatar ? (
                    <div
                      onClick={() => setSelectedPreviewImage({ title: 'عکس پرسنلی شناگر', url: swimmer.avatar })}
                      className="group relative h-40 sm:h-44 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer bg-slate-100 dark:bg-slate-800"
                    >
                      <SecureImage
                        src={swimmer.avatar}
                        alt="پروفایل"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs sm:text-sm font-bold backdrop-blur-2xs">
                        <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>مشاهده بزرگنمایی</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 sm:h-44 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 text-xs sm:text-sm font-medium gap-1.5">
                      <span>بارگذاری نشده</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Medical Notes */}
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-3.5 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                <span>ملاحظات پزشکی و حساسیت‌ها</span>
              </h3>
              {swimmer.medical_notes ? (
                <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 text-sm sm:text-base leading-relaxed font-medium">
                  {swimmer.medical_notes}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-slate-400 text-sm">
                  هیچ نکته پزشکی یا حساسیت خاصی برای این شناگر ثبت نشده است.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: ENROLLMENTS */}
        {activeTab === 'ENROLLMENTS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
              <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
                سوابق دوره‌ها و کلاس‌های شناگر:
              </span>
              <Button
                size="sm"
                onClick={() => navigate(`/admin/swimmers/${id}/enroll`)}
                className="gap-1.5 text-xs sm:text-sm font-bold cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>ثبت‌نام مستقیم در کلاس جدید</span>
              </Button>
            </div>

            {enrollments.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm space-y-3">
                <p>هیچ دوره آموزشی فعالی برای این شناگر ثبت نشده است.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/admin/swimmers/${id}/enroll`)}
                  className="gap-1.5 text-xs sm:text-sm font-bold cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>ثبت‌نام در اولین دوره</span>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enrollments.map((enr) => (
                  <div
                    key={enr.id}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-3.5 text-xs sm:text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
                          {enr.course_name}
                        </h4>
                        <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5 block font-medium">
                          گروه: {enr.group_name}
                        </span>
                      </div>
                      <Badge variant={enr.is_active ? 'success' : 'neutral'} size="md">
                        {enr.is_active ? 'فعال' : 'خاتمه‌یافته'}
                      </Badge>
                    </div>

                    {enr.pool_location && (
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium">
                        <MapPin className="w-4 h-4 text-sky-500 shrink-0" />
                        <span>{enr.pool_location}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-xs font-semibold mb-1">جلسات باقی‌مانده</span>
                        <span className="font-mono font-black text-sky-600 dark:text-sky-400 text-base sm:text-lg">
                          {enr.remaining_sessions} جلسه
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-xs font-semibold mb-1">جلسات حضور یافته</span>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-base sm:text-lg">
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
              <div className="text-center py-12 text-slate-400 text-sm">
                هنوز هیچ سابقه حضور و غیابی برای این شناگر ثبت نشده است.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5 rounded-r-xl">تاریخ جلسه</th>
                      <th className="px-4 py-3.5">وضعیت حضور</th>
                      <th className="px-4 py-3.5">یادداشت و توضیحات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {attendance.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors text-xs sm:text-sm">
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-800 dark:text-slate-200" dir="ltr">
                          {new Date(att.recorded_at).toLocaleDateString('fa-IR')}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge
                            size="md"
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
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-medium">
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
              <div className="text-center py-12 text-slate-400 text-sm">
                صورتحساب مالی برای این شناگر ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-3.5 text-xs sm:text-sm"
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <span className="font-mono font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
                          {inv.invoice_number}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 block text-xs sm:text-sm font-mono mt-0.5">
                          تاریخ صدور: {new Date(inv.created_at).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                      <Badge
                        size="md"
                        variant={
                          inv.status === 'PAID'
                            ? 'success'
                            : inv.status === 'PARTIALLY_PAID'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {inv.status === 'ISSUED' || inv.status_display?.includes('صادرشده') ? 'پرداخت نشده' : inv.status_display}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3.5 border-t border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-xs font-semibold mb-1">مبلغ کل</span>
                        <span className="font-mono text-slate-900 dark:text-white font-extrabold text-sm sm:text-base">
                          {formatPrice(inv.total_amount)} تومان
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-xs font-semibold mb-1">پرداخت‌شده</span>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">
                          {formatPrice(inv.total_paid)} تومان
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-xs font-semibold mb-1">مانده بدهی</span>
                        <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm sm:text-base">
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
              <div className="text-center py-12 text-slate-400 text-sm">
                هنوز هیچ رکورد زمانی یا ارزیابی مسابقاتی برای این شناگر ثبت نشده است.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {records.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-3.5 text-xs sm:text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
                          {rec.distance_meters} متر {rec.stroke_display || rec.stroke}
                        </h4>
                        <span className="font-mono text-slate-400 text-xs sm:text-sm block mt-0.5" dir="ltr">
                          {new Date(rec.recorded_at).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                      <Badge variant={rec.verification_status === 'VERIFIED' ? 'success' : 'warning'} size="md">
                        {rec.verification_status === 'VERIFIED' ? 'تأیید رسمی' : 'در انتظار بررسی'}
                      </Badge>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">زمان ثبت‌شده:</span>
                      <span className="font-mono font-black text-sky-600 dark:text-sky-400 text-base sm:text-xl">
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

      {/* Modal: Reject Swimmer Documents & Send Notification */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => {
          if (!reviewing) {
            setIsRejectModalOpen(false);
          }
        }}
        title="رد مدارک هویتی شناگر و ارسال پیام به اعلانات"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleRejectDocuments} className="space-y-4 text-xs sm:text-sm">
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl text-rose-800 dark:text-rose-200 space-y-1.5">
            <span className="font-bold text-sm sm:text-base block">
              شناگر: «{swimmer.full_name}» {swimmer.national_id ? `(کد ملی: ${swimmer.national_id})` : ''}
            </span>
            <p className="text-xs sm:text-sm text-rose-700/90 dark:text-rose-300/90 leading-relaxed font-normal">
              با ثبت رد مدارک، توضیحات شما مستقیماً در قالب یک اعلان رسمی در پنل شناگر و اولیاء نمایش داده می‌شود تا نسبت به اصلاح و ارسال مجدد مدارک اقدام کنند.
            </p>
          </div>

          {/* Quick preset chips */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs sm:text-sm">
              انتخاب متن آماده یا دلایل پرتکرار نقص مدرک:
            </label>
            <div className="flex flex-wrap gap-2">
              {quickRejectReasons.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRejectReason(preset)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors text-right cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Reason textarea */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 text-xs sm:text-sm">
              علت و توضیحات دقیق نقص مدارک <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="مثلاً: تصویر کارت ملی ناخوانا و فاقد وضوح کافی است، لطفاً تصویر اسکن‌شده یا عکس باکیفیت و بدون نور مستقیم بارگذاری نمایید..."
              className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              disabled={reviewing}
              onClick={() => setIsRejectModalOpen(false)}
              className="px-4 py-2.5 text-xs sm:text-sm font-bold"
            >
              انصراف
            </Button>
            <Button
              type="submit"
              loading={reviewing}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>ثبت رد مدارک و ارسال اعلان</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Document Zoom Preview */}
      <Modal
        isOpen={Boolean(selectedPreviewImage)}
        onClose={() => setSelectedPreviewImage(null)}
        title={selectedPreviewImage?.title || 'پیش‌نمایش تصویر مدرک'}
        maxWidth="max-w-3xl"
      >
        {selectedPreviewImage && (
          <div className="space-y-4">
            <div className="max-h-[70vh] overflow-auto rounded-2xl bg-slate-950 flex items-center justify-center p-3">
              <SecureImage
                src={selectedPreviewImage.url}
                alt={selectedPreviewImage.title}
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-slate-500">
              <span className="font-bold text-slate-700 dark:text-slate-200">{selectedPreviewImage.title}</span>
              <a
                href={getAuthenticatedDocUrl(selectedPreviewImage.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-600 dark:text-sky-400 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>باز کردن در تب جدید</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
