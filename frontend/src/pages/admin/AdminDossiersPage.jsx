import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FolderCheck, Users, CheckCircle2, XCircle, Clock,
  Search, Eye, ShieldCheck, AlertTriangle, FileText,
  Download, ArrowLeft, RefreshCw, Filter, Whistle,
  ExternalLink, UserCheck, Calendar, Phone, Award,
  Check, X, FileSpreadsheet, ZoomIn
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { useToast } from '../../context/ToastContext';
import { getMediaUrl, getAuthenticatedDocUrl } from '../../utils/media';

export const AdminDossiersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  // Active Main Tab: 'SWIMMERS' or 'COACHES'
  const activeTab = searchParams.get('tab') === 'coaches' ? 'COACHES' : 'SWIMMERS';

  // State: Summary Stats
  const [summaryStats, setSummaryStats] = useState({
    total_pending: 0,
    swimmers_pending: 0,
    swimmers_approved: 0,
    swimmers_revision: 0,
    coaches_pending: 0,
    coaches_approved: 0,
    coaches_rejected: 0,
  });

  // State: Swimmers Tab
  const [swimmers, setSwimmers] = useState([]);
  const [swimmerLoading, setSwimmerLoading] = useState(true);
  const [swimmerSearch, setSwimmerSearch] = useState('');
  const [activeSwimmerSearch, setActiveSwimmerSearch] = useState('');
  const [swimmerFilter, setSwimmerFilter] = useState('ALL'); // ALL, PENDING, APPROVED, REVISION
  const [swimmerPage, setSwimmerPage] = useState(1);
  const [swimmerTotalPages, setSwimmerTotalPages] = useState(1);
  const [swimmerTotalCount, setSwimmerTotalCount] = useState(0);

  // State: Coaches Tab
  const [coaches, setCoaches] = useState([]);
  const [coachLoading, setCoachLoading] = useState(true);
  const [coachSearch, setCoachSearch] = useState('');
  const [activeCoachSearch, setActiveCoachSearch] = useState('');
  const [coachFilter, setCoachFilter] = useState('ALL'); // ALL, PENDING, APPROVED, REJECTED
  const [coachPage, setCoachPage] = useState(1);
  const [coachTotalPages, setCoachTotalPages] = useState(1);
  const [coachTotalCount, setCoachTotalCount] = useState(0);

  // Action Modals
  // Document Image / File Preview Modal
  const [previewDoc, setPreviewDoc] = useState(null); // { title, url, type: 'image'|'pdf' }

  // Rejection Reason Modal
  const [rejectionModal, setRejectionModal] = useState({
    isOpen: false,
    targetType: null, // 'SWIMMER' or 'COACH'
    targetId: null,
    targetName: '',
    reason: '',
    submitting: false,
  });

  // Approval Loading State per item
  const [processingId, setProcessingId] = useState(null);

  // Fetch summary stats
  const fetchSummaryStats = useCallback(async () => {
    try {
      const res = await api.get('/swimmers/dossiers-summary/');
      if (res.data) {
        setSummaryStats(res.data);
      }
    } catch {
      // Non-critical stats fallback
    }
  }, []);

  useEffect(() => {
    fetchSummaryStats();
  }, [fetchSummaryStats]);

  // Tab change handler
  const handleTabChange = (newTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newTab === 'COACHES') {
        next.set('tab', 'coaches');
      } else {
        next.delete('tab');
      }
      return next;
    });
  };

  // Fetch Swimmers
  const fetchSwimmers = useCallback(async (page = swimmerPage) => {
    try {
      setSwimmerLoading(true);
      const params = {
        page,
        page_size: 10,
      };
      if (activeSwimmerSearch.trim()) params.search = activeSwimmerSearch.trim();

      if (swimmerFilter === 'PENDING') {
        params.status = 'DOCS_PENDING';
      }

      const res = await api.get('/swimmers/', { params });
      let results = res.data.results || res.data || [];

      // If filtering locally for APPROVED or REVISION (since backend handles DOCS_PENDING and ACTIVE/INACTIVE)
      if (swimmerFilter === 'APPROVED') {
        results = results.filter(
          (s) =>
            s.birth_certificate_status === 'APPROVED' &&
            s.national_card_status === 'APPROVED' &&
            s.sports_insurance_status === 'APPROVED'
        );
      } else if (swimmerFilter === 'REVISION') {
        results = results.filter(
          (s) =>
            s.birth_certificate_status === 'REVISION_REQUIRED' ||
            s.national_card_status === 'REVISION_REQUIRED' ||
            s.sports_insurance_status === 'REVISION_REQUIRED'
        );
      }

      setSwimmers(results);
      setSwimmerTotalCount(res.data.count || results.length);
      setSwimmerTotalPages(res.data.total_pages || Math.ceil((res.data.count || results.length) / 10) || 1);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت مدارک شناگران');
    } finally {
      setSwimmerLoading(false);
    }
  }, [swimmerPage, activeSwimmerSearch, swimmerFilter, toast]);

  useEffect(() => {
    if (activeTab === 'SWIMMERS') {
      fetchSwimmers(swimmerPage);
    }
  }, [activeTab, swimmerPage, activeSwimmerSearch, swimmerFilter, fetchSwimmers]);

  // Fetch Coaches
  const fetchCoaches = useCallback(async (page = coachPage) => {
    try {
      setCoachLoading(true);
      const params = {
        page,
        page_size: 10,
      };
      if (activeCoachSearch.trim()) params.search = activeCoachSearch.trim();

      if (coachFilter === 'PENDING') {
        params.retraining_status = 'PENDING';
      } else if (coachFilter === 'APPROVED') {
        params.retraining_status = 'APPROVED';
      } else if (coachFilter === 'REJECTED') {
        params.retraining_status = 'REJECTED';
      }

      const res = await api.get('/coaches/', { params });
      const results = res.data.results || res.data || [];
      setCoaches(results);
      setCoachTotalCount(res.data.count || results.length);
      setCoachTotalPages(res.data.total_pages || Math.ceil((res.data.count || results.length) / 10) || 1);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت پرونده‌های مربیان');
    } finally {
      setCoachLoading(false);
    }
  }, [coachPage, activeCoachSearch, coachFilter, toast]);

  useEffect(() => {
    if (activeTab === 'COACHES') {
      fetchCoaches(coachPage);
    }
  }, [activeTab, coachPage, activeCoachSearch, coachFilter, fetchCoaches]);

  // Handle Swimmer Search
  const handleSwimmerSearchSubmit = (e) => {
    e.preventDefault();
    setSwimmerPage(1);
    setActiveSwimmerSearch(swimmerSearch);
  };

  // Handle Coach Search
  const handleCoachSearchSubmit = (e) => {
    e.preventDefault();
    setCoachPage(1);
    setActiveCoachSearch(coachSearch);
  };

  // Swimmer: Approve Documents
  const handleApproveSwimmer = async (swimmer) => {
    try {
      setProcessingId(swimmer.id);
      await api.post(`/swimmers/${swimmer.id}/review-documents/`, {
        action: 'APPROVE',
      });
      toast.success(`تمام مدارک شناگر «${swimmer.full_name}» با موفقیت تأیید شد.`);
      fetchSwimmers(swimmerPage);
      fetchSummaryStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در تأیید مدارک شناگر');
    } finally {
      setProcessingId(null);
    }
  };

  // Coach: Approve Retraining & Credentials
  const handleApproveCoach = async (coach) => {
    try {
      setProcessingId(coach.id);
      await api.post(`/coaches/${coach.id}/verify-retraining/`, {
        action: 'APPROVE',
      });
      toast.success(`گواهی بازآموزی و مدارک مربی «${coach.full_name}» با موفقیت تأیید شد.`);
      fetchCoaches(coachPage);
      fetchSummaryStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در تأیید مدارک مربی');
    } finally {
      setProcessingId(null);
    }
  };

  // Open Rejection Modal
  const openRejectionModal = (type, item) => {
    setRejectionModal({
      isOpen: true,
      targetType: type,
      targetId: item.id,
      targetName: item.full_name,
      reason: '',
      submitting: false,
    });
  };

  // Submit Rejection
  const handleSubmitRejection = async () => {
    if (!rejectionModal.reason.trim()) {
      toast.error('لطفاً علت نقص یا دلیل عدم تأیید مدارک را وارد نمایید.');
      return;
    }

    try {
      setRejectionModal((prev) => ({ ...prev, submitting: true }));

      if (rejectionModal.targetType === 'SWIMMER') {
        await api.post(`/swimmers/${rejectionModal.targetId}/review-documents/`, {
          action: 'REJECT',
          reason: rejectionModal.reason.trim(),
        });
        toast.info(`اعلام نقص برای شناگر «${rejectionModal.targetName}» با موفقیت ثبت شد.`);
        fetchSwimmers(swimmerPage);
      } else {
        await api.post(`/coaches/${rejectionModal.targetId}/verify-retraining/`, {
          action: 'REJECT',
          reason: rejectionModal.reason.trim(),
        });
        toast.info(`اعلام نقص برای مربی «${rejectionModal.targetName}» با موفقیت ثبت شد.`);
        fetchCoaches(coachPage);
      }

      fetchSummaryStats();
      setRejectionModal({
        isOpen: false,
        targetType: null,
        targetId: null,
        targetName: '',
        reason: '',
        submitting: false,
      });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در ثبت عدم تأیید مدارک');
      setRejectionModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Quick Preset Reasons
  const swimmerPresetReasons = [
    'تصویر بیمه ورزشی تار یا ناخواناست.',
    'تاریخ اعتبار بیمه ورزشی منقضی شده است.',
    'تصویر صفحه اول شناسنامه کامل و واضح نیست.',
    'تصویر کارت ملی ناخواناست.',
    'اطلاعات هویتی با تصویر مدارک ارسالی مطابقت ندارد.',
  ];

  const coachPresetReasons = [
    'گواهی بازآموزی سال جاری فاقد مهر یا امضای رسمی هیئت شنا است.',
    'تصویر مدرک مربیگری بارگذاری‌شده ناخوانا است.',
    'تاریخ اعتبار مدرک منقضی شده است.',
    'رزومه یا فایل بارگذاری‌شده ناقص است.',
  ];

  const getDocStatusBadge = (status, hasFile) => {
    if (!hasFile || status === 'UNUPLOADED') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
          ارسال‌نشده
        </span>
      );
    }
    if (status === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          تأییدشده
        </span>
      );
    }
    if (status === 'REVISION_REQUIRED' || status === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
          <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
          نیازمند اصلاح
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
        <Clock className="w-3 h-3 text-amber-500" />
        در انتظار بررسی
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderCheck className="w-6 h-6 text-sky-600" />
            مرکز بررسی پرونده‌ها و مدارک
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            بررسی و اعتبارسنجی مدارک هویتی، بیمه ورزشی و گواهی‌های بازآموزی شناگران و کادر مربیان
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => {
              fetchSummaryStats();
              if (activeTab === 'SWIMMERS') fetchSwimmers(swimmerPage);
              else fetchCoaches(coachPage);
            }}
            className="gap-1.5 text-xs whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>به‌روزرسانی</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/admin/swimmers')}
            className="gap-1.5 text-xs whitespace-nowrap"
          >
            <Users className="w-4 h-4 text-sky-600" />
            <span>مدیریت شناگران</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pending */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
              کل نیازمند بررسی مدیریت
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-amber-700 dark:text-amber-400 font-mono">
                {summaryStats.total_pending}
              </span>
              <span className="text-xs text-slate-400">پرونده</span>
            </div>
          </div>
        </div>

        {/* Swimmers Pending */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200/60 dark:border-sky-800 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
              مدارک در انتظار شناگران
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-sky-700 dark:text-sky-400 font-mono">
                {summaryStats.swimmers_pending}
              </span>
              <span className="text-xs text-slate-400">شناگر</span>
            </div>
          </div>
        </div>

        {/* Coaches Pending */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800 flex items-center justify-center shrink-0">
            <Whistle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
              بازآموزی و مدارک مربیان
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                {summaryStats.coaches_pending}
              </span>
              <span className="text-xs text-slate-400">مربی</span>
            </div>
          </div>
        </div>

        {/* Approved Records */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200/60 dark:border-cyan-800 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
              پرونده‌های تأییدشده
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-mono">
                {summaryStats.swimmers_approved + summaryStats.coaches_approved}
              </span>
              <span className="text-xs text-slate-400">پرونده</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-3">
        <button
          type="button"
          onClick={() => handleTabChange('SWIMMERS')}
          className={`pb-3.5 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'SWIMMERS'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>پرونده‌ها و مدارک شناگران</span>
          {summaryStats.swimmers_pending > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500 text-white font-mono">
              {summaryStats.swimmers_pending}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('COACHES')}
          className={`pb-3.5 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'COACHES'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Whistle className="w-4 h-4" />
          <span>پرونده‌ها و مدارک مربیان</span>
          {summaryStats.coaches_pending > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500 text-white font-mono">
              {summaryStats.coaches_pending}
            </span>
          )}
        </button>
      </div>

      {/* TAB CONTENT: SWIMMERS */}
      {activeTab === 'SWIMMERS' && (
        <div className="space-y-4">
          {/* Controls: Search and Status Filters */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <form onSubmit={handleSwimmerSearchSubmit} className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={swimmerSearch}
                  onChange={(e) => setSwimmerSearch(e.target.value)}
                  placeholder="جستجو با نام، نام خانوادگی، شماره تماس یا کد ملی شناگر..."
                  className="w-full pl-3 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
              <Button type="submit" variant="secondary" className="text-xs shrink-0 px-4 h-10">
                جستجو
              </Button>
            </form>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/80 text-xs shrink-0 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => {
                  setSwimmerFilter('ALL');
                  setSwimmerPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap text-xs ${
                  swimmerFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                همه پرونده‌ها
              </button>
              <button
                type="button"
                onClick={() => {
                  setSwimmerFilter('PENDING');
                  setSwimmerPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center gap-1.5 whitespace-nowrap text-xs ${
                  swimmerFilter === 'PENDING'
                    ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>در انتظار بررسی ({summaryStats.swimmers_pending})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSwimmerFilter('APPROVED');
                  setSwimmerPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap text-xs ${
                  swimmerFilter === 'APPROVED'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                تأییدشده ({summaryStats.swimmers_approved})
              </button>
              <button
                type="button"
                onClick={() => {
                  setSwimmerFilter('REVISION');
                  setSwimmerPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap text-xs ${
                  swimmerFilter === 'REVISION'
                    ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                نیازمند اصلاح ({summaryStats.swimmers_revision})
              </button>
            </div>
          </div>

          {/* Swimmers List */}
          {swimmerLoading ? (
            <LoadingState message="در حال بارگذاری پرونده‌ها و مدارک شناگران..." />
          ) : swimmers.length === 0 ? (
            <EmptyState
              title="پرونده‌ای برای بررسی یافت نشد"
              description="با فیلترهای انتخابی هیچ مدرک شناگری در این بخش قرار ندارد."
            />
          ) : (
            <div className="space-y-4">
              {swimmers.map((swimmer) => {
                const isDocsApproved =
                  swimmer.birth_certificate_status === 'APPROVED' &&
                  swimmer.national_card_status === 'APPROVED' &&
                  swimmer.sports_insurance_status === 'APPROVED';

                const isDocsRejected =
                  swimmer.birth_certificate_status === 'REVISION_REQUIRED' ||
                  swimmer.national_card_status === 'REVISION_REQUIRED' ||
                  swimmer.sports_insurance_status === 'REVISION_REQUIRED';

                const hasUploadedDocs = Boolean(
                  swimmer.birth_certificate_image ||
                  swimmer.national_card_image ||
                  swimmer.sports_insurance_image
                );

                return (
                  <div
                    key={swimmer.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors hover:border-sky-300 dark:hover:border-slate-700"
                  >
                    {/* Card Top: Swimmer Info and Overall Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-2xs overflow-hidden">
                          {swimmer.avatar ? (
                            <img src={swimmer.avatar} alt={swimmer.full_name} className="w-full h-full object-cover" />
                          ) : (
                            swimmer.first_name ? swimmer.first_name.charAt(0) : 'S'
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base">
                              {swimmer.full_name}
                            </h3>
                            <Badge variant={swimmer.is_active ? 'success' : 'neutral'} className="text-[11px]">
                              {swimmer.is_active ? 'فعال' : 'غیرفعال'}
                            </Badge>
                            {swimmer.gender && (
                              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                {swimmer.gender === 'FEMALE' ? 'دختر / بانوان' : 'پسر / آقایان'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                            <span className="font-mono">{swimmer.phone}</span>
                            {swimmer.national_id && (
                              <>
                                <span>•</span>
                                <span>کد ملی: <span className="font-mono">{swimmer.national_id}</span></span>
                              </>
                            )}
                            {swimmer.birth_year_jalali && (
                              <>
                                <span>•</span>
                                <span>متولد: <span className="font-mono">{swimmer.birth_year_jalali}</span></span>
                              </>
                            )}
                            {swimmer.emergency_contact_name && (
                              <>
                                <span>•</span>
                                <span>ولی: {swimmer.emergency_contact_name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
                        {/* Direct Approval Action */}
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleApproveSwimmer(swimmer)}
                          disabled={processingId === swimmer.id || isDocsApproved}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs whitespace-nowrap"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>تأیید همه مدارک</span>
                        </Button>

                        {/* Rejection / Revision Required Action */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openRejectionModal('SWIMMER', swimmer)}
                          disabled={processingId === swimmer.id}
                          className="border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5 text-xs whitespace-nowrap"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>اعلام نقص مدارک</span>
                        </Button>

                        {/* View Full Dossier Page */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/admin/swimmers/${swimmer.id}#documents`)}
                          className="text-xs text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 gap-1"
                        >
                          <span>پرونده کامل</span>
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Rejection Reason Alert if present */}
                    {swimmer.documents_rejection_reason && (
                      <div className="mt-3.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold">علت نقص ثبت‌شده: </strong>
                          <span>{swimmer.documents_rejection_reason}</span>
                        </div>
                      </div>
                    )}

                    {/* Document Thumbnails & Status Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
                      {/* Document 1: شناسنامه */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="truncate">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                              صفحه اول شناسنامه
                            </span>
                            <div className="mt-0.5">
                              {getDocStatusBadge(swimmer.birth_certificate_status, Boolean(swimmer.birth_certificate_image))}
                            </div>
                          </div>
                        </div>
                        {swimmer.birth_certificate_image && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDoc({
                                title: `شناسنامه - ${swimmer.full_name}`,
                                url: getAuthenticatedDocUrl(swimmer.birth_certificate_image),
                                type: 'image',
                              })
                            }
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:text-sky-600 shadow-2xs border border-slate-200/80 dark:border-slate-600 shrink-0 cursor-pointer transition-colors"
                            title="مشاهده تصویر شناسنامه"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Document 2: کارت ملی */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div className="truncate">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                              کارت ملی
                            </span>
                            <div className="mt-0.5">
                              {getDocStatusBadge(swimmer.national_card_status, Boolean(swimmer.national_card_image))}
                            </div>
                          </div>
                        </div>
                        {swimmer.national_card_image && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDoc({
                                title: `کارت ملی - ${swimmer.full_name}`,
                                url: getAuthenticatedDocUrl(swimmer.national_card_image),
                                type: 'image',
                              })
                            }
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:text-sky-600 shadow-2xs border border-slate-200/80 dark:border-slate-600 shrink-0 cursor-pointer transition-colors"
                            title="مشاهده تصویر کارت ملی"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Document 3: بیمه ورزشی */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Award className="w-5 h-5" />
                          </div>
                          <div className="truncate">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                              کارت بیمه ورزشی
                            </span>
                            <div className="mt-0.5">
                              {getDocStatusBadge(swimmer.sports_insurance_status, Boolean(swimmer.sports_insurance_image))}
                            </div>
                          </div>
                        </div>
                        {swimmer.sports_insurance_image && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDoc({
                                title: `بیمه ورزشی - ${swimmer.full_name}`,
                                url: getAuthenticatedDocUrl(swimmer.sports_insurance_image),
                                type: 'image',
                              })
                            }
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:text-sky-600 shadow-2xs border border-slate-200/80 dark:border-slate-600 shrink-0 cursor-pointer transition-colors"
                            title="مشاهده تصویر بیمه ورزشی"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Swimmers Pagination */}
              {swimmerTotalPages > 1 && (
                <div className="pt-2">
                  <Pagination
                    currentPage={swimmerPage}
                    totalPages={swimmerTotalPages}
                    onPageChange={setSwimmerPage}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: COACHES */}
      {activeTab === 'COACHES' && (
        <div className="space-y-4">
          {/* Controls: Search and Status Filters */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <form onSubmit={handleCoachSearchSubmit} className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={coachSearch}
                  onChange={(e) => setCoachSearch(e.target.value)}
                  placeholder="جستجو با نام، نام خانوادگی، شماره تماس یا کد پرسنلی مربی..."
                  className="w-full pl-3 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
              <Button type="submit" variant="secondary" className="text-xs shrink-0 px-4 h-10">
                جستجو
              </Button>
            </form>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/80 text-xs shrink-0 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => {
                  setCoachFilter('ALL');
                  setCoachPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap text-xs ${
                  coachFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                همه مربیان
              </button>
              <button
                type="button"
                onClick={() => {
                  setCoachFilter('PENDING');
                  setCoachPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center gap-1.5 whitespace-nowrap text-xs ${
                  coachFilter === 'PENDING'
                    ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>در انتظار بررسی ({summaryStats.coaches_pending})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCoachFilter('APPROVED');
                  setCoachPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap text-xs ${
                  coachFilter === 'APPROVED'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                تأییدشده ({summaryStats.coaches_approved})
              </button>
              <button
                type="button"
                onClick={() => {
                  setCoachFilter('REJECTED');
                  setCoachPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap text-xs ${
                  coachFilter === 'REJECTED'
                    ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                رد شده / نیازمند اصلاح ({summaryStats.coaches_rejected})
              </button>
            </div>
          </div>

          {/* Coaches List */}
          {coachLoading ? (
            <LoadingState message="در حال بارگذاری پرونده‌ها و مدارک مربیان..." />
          ) : coaches.length === 0 ? (
            <EmptyState
              title="پرونده مربی‌ای یافت نشد"
              description="با فیلترهای انتخابی هیچ پرونده یا مدرک مربیگری در این بخش قرار ندارد."
            />
          ) : (
            <div className="space-y-4">
              {coaches.map((coach) => {
                const hasRetrainingFile = Boolean(coach.retraining_certificate_file || coach.retraining_certificate_file_url);
                const isRetrainingApproved = coach.retraining_status === 'APPROVED';
                const isRetrainingRejected = coach.retraining_status === 'REJECTED';

                return (
                  <div
                    key={coach.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors hover:border-emerald-300 dark:hover:border-slate-700"
                  >
                    {/* Top Coach Info Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-2xs overflow-hidden">
                          {coach.avatar ? (
                            <img src={coach.avatar} alt={coach.full_name} className="w-full h-full object-cover" />
                          ) : (
                            coach.first_name ? coach.first_name.charAt(0) : 'C'
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base">
                              {coach.full_name}
                            </h3>
                            <Badge variant={coach.employment_status === 'ACTIVE' ? 'success' : 'neutral'} className="text-[11px]">
                              {coach.employment_status_display || coach.employment_status}
                            </Badge>
                            {coach.coaching_degree_display && (
                              <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                                {coach.coaching_degree_display}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                            <span className="font-mono">{coach.phone}</span>
                            {coach.personnel_id && (
                              <>
                                <span>•</span>
                                <span>کد پرسنلی: <span className="font-mono">{coach.personnel_id}</span></span>
                              </>
                            )}
                            {coach.national_id && (
                              <>
                                <span>•</span>
                                <span>کد ملی: <span className="font-mono">{coach.national_id}</span></span>
                              </>
                            )}
                            {coach.years_of_experience > 0 && (
                              <>
                                <span>•</span>
                                <span>سابقه: {coach.years_of_experience} سال</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
                        {/* Direct Approval Action */}
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleApproveCoach(coach)}
                          disabled={processingId === coach.id || isRetrainingApproved || !hasRetrainingFile}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs whitespace-nowrap"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>تأیید بازآموزی و مدارک</span>
                        </Button>

                        {/* Rejection / Revision Required Action */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openRejectionModal('COACH', coach)}
                          disabled={processingId === coach.id}
                          className="border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5 text-xs whitespace-nowrap"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>اعلام نقص یا رد</span>
                        </Button>

                        {/* View Full Coach Profile */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/admin/coaches/${coach.id}`)}
                          className="text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-1"
                        >
                          <span>پرونده کامل</span>
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Rejection Alert if rejected */}
                    {coach.retraining_rejection_reason && (
                      <div className="mt-3.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold">علت عدم تأیید بازآموزی: </strong>
                          <span>{coach.retraining_rejection_reason}</span>
                        </div>
                      </div>
                    )}

                    {/* Coach Document Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
                      {/* Document 1: بازآموزی سال جاری */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Award className="w-5 h-5" />
                          </div>
                          <div className="truncate">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                              بازآموزی {coach.retraining_year ? `سال ${coach.retraining_year}` : 'سال جاری'}
                            </span>
                            <div className="mt-0.5">
                              {getDocStatusBadge(coach.retraining_status, hasRetrainingFile)}
                            </div>
                          </div>
                        </div>
                        {hasRetrainingFile && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDoc({
                                title: `گواهی بازآموزی - ${coach.full_name}`,
                                url: getMediaUrl(coach.retraining_certificate_file || coach.retraining_certificate_file_url),
                                type: 'image',
                              })
                            }
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:text-emerald-600 shadow-2xs border border-slate-200/80 dark:border-slate-600 shrink-0 cursor-pointer transition-colors"
                            title="مشاهده مدرک بازآموزی"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Document 2: مدرک مربیگری */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div className="truncate">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                              مدرک رسمی مربیگری
                            </span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 block truncate">
                              {coach.coaching_degree_display || 'ثبت‌نشده'}
                            </span>
                          </div>
                        </div>
                        {coach.coaching_certificate_file && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDoc({
                                title: `مدرک مربیگری - ${coach.full_name}`,
                                url: getMediaUrl(coach.coaching_certificate_file),
                                type: 'image',
                              })
                            }
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:text-teal-600 shadow-2xs border border-slate-200/80 dark:border-slate-600 shrink-0 cursor-pointer transition-colors"
                            title="مشاهده مدرک مربیگری"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Document 3: رزومه و سوابق */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="truncate">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                              فایل رزومه و سوابق
                            </span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 block truncate">
                              {coach.resume_file ? 'ارسال‌شده' : 'ثبت متنی'}
                            </span>
                          </div>
                        </div>
                        {coach.resume_file && (
                          <a
                            href={getMediaUrl(coach.resume_file)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:text-sky-600 shadow-2xs border border-slate-200/80 dark:border-slate-600 shrink-0 transition-colors"
                            title="مشاهده رزومه"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Coaches Pagination */}
              {coachTotalPages > 1 && (
                <div className="pt-2">
                  <Pagination
                    currentPage={coachPage}
                    totalPages={coachTotalPages}
                    onPageChange={setCoachPage}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal 1: High Resolution Document Preview */}
      {previewDoc && (
        <Modal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.title || 'پیش‌نمایش مدرک'}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-100 dark:bg-slate-950 rounded-xl p-2 border border-slate-200 dark:border-slate-800">
              <img
                src={previewDoc.url}
                alt={previewDoc.title}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-md"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/media/placeholder.png';
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-3 pt-2">
              <a
                href={previewDoc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                <span>باز کردن در برگه جدید / اندازه اصلی</span>
              </a>
              <Button variant="secondary" size="sm" onClick={() => setPreviewDoc(null)}>
                بستن
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal 2: Rejection / Revision Required with Preset Reasons */}
      {rejectionModal.isOpen && (
        <Modal
          isOpen={rejectionModal.isOpen}
          onClose={() => setRejectionModal((prev) => ({ ...prev, isOpen: false }))}
          title={`اعلام نقص و عدم تأیید مدرک: ${rejectionModal.targetName}`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              علت نقص مدارک برای کاربر ارسال خواهد شد تا نسبت به بارگذاری مجدد اقدام نماید.
            </p>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                انتخاب سریع از موارد متداول:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(rejectionModal.targetType === 'SWIMMER'
                  ? swimmerPresetReasons
                  : coachPresetReasons
                ).map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      setRejectionModal((prev) => ({
                        ...prev,
                        reason: prev.reason ? `${prev.reason} | ${preset}` : preset,
                      }))
                    }
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition-colors text-right cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Reason Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                توضیحات و جزئیات نقص (الزامی):
              </label>
              <textarea
                value={rejectionModal.reason}
                onChange={(e) =>
                  setRejectionModal((prev) => ({ ...prev, reason: e.target.value }))
                }
                rows={4}
                placeholder="توضیح دهید چه مواردی نیازمند اصلاح است..."
                className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectionModal((prev) => ({ ...prev, isOpen: false }))}
                disabled={rejectionModal.submitting}
              >
                انصراف
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitRejection}
                disabled={rejectionModal.submitting || !rejectionModal.reason.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5 text-xs"
              >
                {rejectionModal.submitting ? 'در حال ثبت...' : 'ثبت اعلام نقص'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
