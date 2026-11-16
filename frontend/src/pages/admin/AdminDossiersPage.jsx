import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FolderCheck, Users, CheckCircle2, XCircle, Clock,
  Search, Eye, ShieldCheck, AlertTriangle, FileText,
  Download, ArrowLeft, RefreshCw, Filter, Whistle,
  ExternalLink, UserCheck, Calendar, Phone, Award,
  Check, X, FileSpreadsheet, ZoomIn, Receipt, CreditCard
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

const FALLBACK_RECEIPT_IMAGE = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f1f5f9'/%3E%3Cpath d='M160 110h80v70h-80z' fill='%23cbd5e1'/%3E%3Ccircle cx='180' cy='130' r='10' fill='%2394a3b8'/%3E%3Cpath d='M165 170l20-25 15 15 20-30 20 40z' fill='%2394a3b8'/%3E%3Ctext x='50%25' y='215' dominant-baseline='middle' text-anchor='middle' fill='%2364748b' font-family='sans-serif' font-size='15' font-weight='600'%3E%D8%AA%D8%B5%D9%88%DB%8C%D8%B1 %D9%81%DB%8C%D8%B4 %D8%AF%D8%B1 %D8%AF%D8%B3%D8%AA%D8%B1%D8%B3 %D9%86%DB%8C%D8%B3%D8%AA%3C/text%3E%3C/svg%3E";

export const AdminDossiersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  // Download document or receipt in original full resolution
  const downloadOriginalFile = async (url, fallbackFilename = 'receipt-original.jpg') => {
    if (!url) {
      toast.error('آدرس فایل معتبر نیست');
      return;
    }
    try {
      toast.info('در حال دانلود فایل اصلی با حداکثر کیفیت...');
      const response = await fetch(url);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fallbackFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('فایل با کیفیت اصلی دانلود شد.');
    } catch {
      const link = document.createElement('a');
      link.href = url;
      link.download = fallbackFilename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Active Main Tab: 'SWIMMERS', 'COACHES', or 'RECEIPTS'
  const tabParam = searchParams.get('tab');
  const activeTab = tabParam === 'coaches' ? 'COACHES' : tabParam === 'receipts' ? 'RECEIPTS' : 'SWIMMERS';

  // State: Summary Stats
  const [summaryStats, setSummaryStats] = useState({
    total_pending: 0,
    swimmers_pending: 0,
    swimmers_approved: 0,
    swimmers_revision: 0,
    coaches_pending: 0,
    coaches_approved: 0,
    coaches_rejected: 0,
    receipts_pending: 0,
    receipts_approved: 0,
    receipts_rejected: 0,
  });

  // State: Receipts Tab
  const [receipts, setReceipts] = useState([]);
  const [receiptLoading, setReceiptLoading] = useState(true);
  const [receiptSearch, setReceiptSearch] = useState('');
  const [activeReceiptSearch, setActiveReceiptSearch] = useState('');
  const [receiptFilter, setReceiptFilter] = useState('ALL'); // ALL, PENDING, APPROVED, REJECTED

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

  // Receipt Approval Modal (with manager-entered amount)
  const [approveModal, setApproveModal] = useState({
    isOpen: false,
    receipt: null,
    approvedAmount: '',
    notes: '',
    submitting: false,
  });

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
      } else if (newTab === 'RECEIPTS') {
        next.set('tab', 'receipts');
      } else {
        next.delete('tab');
      }
      return next;
    });
  };

  // Fetch Receipts (رسیدهای واریز شهریه کارت به کارت)
  const fetchReceipts = useCallback(async () => {
    try {
      setReceiptLoading(true);
      const params = {};
      if (activeReceiptSearch.trim()) params.search = activeReceiptSearch.trim();
      if (receiptFilter !== 'ALL') params.status = receiptFilter;

      const res = await api.get('/finance/receipts/', { params });
      const results = res.data.results || res.data || [];
      setReceipts(results);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت رسیدهای پرداخت');
    } finally {
      setReceiptLoading(false);
    }
  }, [activeReceiptSearch, receiptFilter, toast]);

  useEffect(() => {
    if (activeTab === 'RECEIPTS') {
      fetchReceipts();
    }
  }, [activeTab, activeReceiptSearch, receiptFilter, fetchReceipts]);

  // Handle Receipt Search
  const handleReceiptSearchSubmit = (e) => {
    e.preventDefault();
    setActiveReceiptSearch(receiptSearch);
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

  // Open Receipt Approval Modal
  const openApproveModal = (receipt) => {
    // Default amount: remaining balance or claimed amount or empty
    const defaultAmount = receipt.amount_claimed > 0
      ? String(receipt.amount_claimed)
      : (receipt.invoice_remaining_balance > 0 ? String(receipt.invoice_remaining_balance) : '');

    setApproveModal({
      isOpen: true,
      receipt,
      approvedAmount: defaultAmount,
      notes: '',
      submitting: false,
    });
  };

  // Submit Receipt Approval (with manager-entered amount)
  const handleApproveReceiptSubmit = async (e) => {
    e.preventDefault();
    if (!approveModal.receipt) return;
    const amountNum = parseFloat(approveModal.approvedAmount);
    if (!amountNum || amountNum <= 0) {
      toast.error('لطفاً مبلغ پرداختی مورد تأیید (تومان) را به صورت معتبر وارد نمایید.');
      return;
    }

    try {
      setApproveModal((prev) => ({ ...prev, submitting: true }));
      await api.post(`/finance/receipts/${approveModal.receipt.id}/review/`, {
        action: 'APPROVE',
        approved_amount: amountNum,
        notes: approveModal.notes.trim(),
      });

      toast.success(
        `مبلغ ${Number(amountNum).toLocaleString('fa-IR')} تومان با موفقیت تأیید و از شهریه شناگر کسر شد.`
      );
      setApproveModal({
        isOpen: false,
        receipt: null,
        approvedAmount: '',
        notes: '',
        submitting: false,
      });
      fetchSummaryStats();
      fetchReceipts();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در تأیید رسید و اعمال شهریه');
      setApproveModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Open Rejection Modal
  const openRejectionModal = (type, item) => {
    setRejectionModal({
      isOpen: true,
      targetType: type,
      targetId: item.id,
      targetName: item.swimmer_name || item.full_name || `رسید شماره #${item.id}`,
      reason: '',
      submitting: false,
    });
  };

  // Submit Rejection
  const handleSubmitRejection = async () => {
    if (!rejectionModal.reason.trim()) {
      toast.error('لطفاً علت نقص یا دلیل عدم تأیید را وارد نمایید.');
      return;
    }

    try {
      setRejectionModal((prev) => ({ ...prev, submitting: true }));

      if (rejectionModal.targetType === 'RECEIPT') {
        await api.post(`/finance/receipts/${rejectionModal.targetId}/review/`, {
          action: 'REJECT',
          reason: rejectionModal.reason.trim(),
        });
        toast.info(`عدم تأیید رسید پرداخت برای «${rejectionModal.targetName}» با موفقیت ثبت شد.`);
        fetchReceipts();
      } else if (rejectionModal.targetType === 'SWIMMER') {
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
      toast.error(err.response?.data?.detail || 'خطا در ثبت عدم تأیید');
      setRejectionModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Quick Preset Reasons
  const receiptPresetReasons = [
    'تصویر فیش یا رسید واریز ناخوانا یا ناقص است.',
    'مبلغ اعلامی به حساب آموزشگاه واریز نشده یا گردش بانکی ندارد.',
    'شماره پیگیری یا مرجع بانکی نامعتبر است.',
    'فیش تکراری است یا قبلاً در سیستم ثبت شده است.',
  ];

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

  const formatPrice = (val) => Number(val || 0).toLocaleString('fa-IR');

  const numToPersianWords = (num) => {
    const n = parseInt(num, 10);
    if (isNaN(n) || n <= 0) return '';
    const yekan = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
    const dahha = ['', 'ده', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
    const dahYek = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
    const sadha = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
    const scales = ['', 'هزار', 'میلیون', 'میلیارد'];

    const convert3 = (val) => {
      let res = [];
      const s = Math.floor(val / 100);
      const d = Math.floor((val % 100) / 10);
      const y = val % 10;
      if (s > 0) res.push(sadha[s]);
      if (d === 1) {
        res.push(dahYek[y]);
      } else {
        if (d > 0) res.push(dahha[d]);
        if (y > 0) res.push(yekan[y]);
      }
      return res.join(' و ');
    };

    let chunks = [];
    let temp = n;
    while (temp > 0) {
      chunks.push(temp % 1000);
      temp = Math.floor(temp / 1000);
    }
    let words = [];
    for (let i = chunks.length - 1; i >= 0; i--) {
      if (chunks[i] > 0) {
        words.push(convert3(chunks[i]) + (scales[i] ? ' ' + scales[i] : ''));
      }
    }
    return words.join(' و ') + ' تومان';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <FolderCheck className="w-7 h-7 text-sky-600" />
            مرکز بررسی رسیدها و مدارک
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            بررسی و اعتبارسنجی فیش‌های واریزی کارت‌به‌کارت شهریه، مدارک هویتی شناگران و کادر مربیان
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => {
              fetchSummaryStats();
              if (activeTab === 'SWIMMERS') fetchSwimmers(swimmerPage);
              else if (activeTab === 'COACHES') fetchCoaches(coachPage);
              else fetchReceipts();
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Pending */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <span className="text-sm text-slate-500 dark:text-slate-400 block font-bold">
              کل نیازمند بررسی
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-400 font-mono">
                {summaryStats.total_pending}
              </span>
              <span className="text-sm text-slate-400 font-medium">مورد</span>
            </div>
          </div>
        </div>

        {/* Receipts Pending */}
        <div
          onClick={() => handleTabChange('RECEIPTS')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs flex items-center gap-3 ${
            activeTab === 'RECEIPTS'
              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 ring-2 ring-amber-400/40'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-300'
          }`}
        >
          <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5 text-amber-700 dark:text-amber-300" />
          </div>
          <div>
            <span className="text-sm text-slate-500 dark:text-slate-400 block font-bold">
              فیش‌های در انتظار بررسی
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-300 font-mono">
                {summaryStats.receipts_pending || 0}
              </span>
              <span className="text-sm text-slate-400 font-medium">رسید</span>
            </div>
          </div>
        </div>

        {/* Swimmers Pending */}
        <div
          onClick={() => handleTabChange('SWIMMERS')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs flex items-center gap-3 ${
            activeTab === 'SWIMMERS'
              ? 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-300 dark:border-sky-800 ring-2 ring-sky-400/40'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-sky-300'
          }`}
        >
          <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200/60 dark:border-sky-800 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <span className="text-sm text-slate-500 dark:text-slate-400 block font-bold">
              مدارک شناگران
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-sky-700 dark:text-sky-400 font-mono">
                {summaryStats.swimmers_pending}
              </span>
              <span className="text-sm text-slate-400 font-medium">شناگر</span>
            </div>
          </div>
        </div>

        {/* Coaches Pending */}
        <div
          onClick={() => handleTabChange('COACHES')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs flex items-center gap-3 ${
            activeTab === 'COACHES'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-400/40'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-300'
          }`}
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800 flex items-center justify-center shrink-0">
            <Whistle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <span className="text-sm text-slate-500 dark:text-slate-400 block font-bold">
              مدارک مربیان
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                {summaryStats.coaches_pending}
              </span>
              <span className="text-sm text-slate-400 font-medium">مربی</span>
            </div>
          </div>
        </div>

        {/* Approved Records */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200/60 dark:border-cyan-800 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <span className="text-sm text-slate-500 dark:text-slate-400 block font-bold">
              کل تأییدشده‌ها
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 font-mono">
                {summaryStats.swimmers_approved + summaryStats.coaches_approved + (summaryStats.receipts_approved || 0)}
              </span>
              <span className="text-sm text-slate-400 font-medium">مورد</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-3">
        <button
          type="button"
          onClick={() => handleTabChange('SWIMMERS')}
          className={`pb-3.5 px-4 font-black text-sm sm:text-base transition-all border-b-2 flex items-center gap-2.5 cursor-pointer ${
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
          className={`pb-3.5 px-4 font-black text-sm sm:text-base transition-all border-b-2 flex items-center gap-2.5 cursor-pointer ${
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

        <button
          type="button"
          onClick={() => handleTabChange('RECEIPTS')}
          className={`pb-3.5 px-4 font-black text-sm sm:text-base transition-all border-b-2 flex items-center gap-2.5 cursor-pointer ${
            activeTab === 'RECEIPTS'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>رسید ها</span>
          {summaryStats.receipts_pending > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500 text-white font-mono">
              {summaryStats.receipts_pending}
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
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-2xs overflow-hidden">
                          {swimmer.avatar ? (
                            <img src={swimmer.avatar} alt={swimmer.full_name} className="w-full h-full object-cover" />
                          ) : (
                            swimmer.first_name ? swimmer.first_name.charAt(0) : 'S'
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-black text-slate-900 dark:text-white text-lg">
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
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-2xs overflow-hidden">
                          {coach.avatar ? (
                            <img src={coach.avatar} alt={coach.full_name} className="w-full h-full object-cover" />
                          ) : (
                            coach.first_name ? coach.first_name.charAt(0) : 'C'
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-black text-slate-900 dark:text-white text-lg">
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

      {/* TAB CONTENT: RECEIPTS (رسید ها) */}
      {activeTab === 'RECEIPTS' && (
        <div className="space-y-4">
          {/* Controls: Search and Status Filters */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <form onSubmit={handleReceiptSearchSubmit} className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={receiptSearch}
                  onChange={(e) => setReceiptSearch(e.target.value)}
                  placeholder="جستجو با نام شناگر، شماره تماس، کد ملی یا شماره پیگیری فیش..."
                  className="w-full pl-3 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
              <Button type="submit" variant="secondary" className="text-xs shrink-0 px-4 h-10">
                جستجو
              </Button>
            </form>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/80 text-xs shrink-0 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setReceiptFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap text-xs cursor-pointer ${
                  receiptFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                همه رسیدها ({receipts.length})
              </button>
              <button
                type="button"
                onClick={() => setReceiptFilter('PENDING')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center gap-1.5 whitespace-nowrap text-xs cursor-pointer ${
                  receiptFilter === 'PENDING'
                    ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>در انتظار بررسی ({summaryStats.receipts_pending || 0})</span>
              </button>
              <button
                type="button"
                onClick={() => setReceiptFilter('APPROVED')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center gap-1.5 whitespace-nowrap text-xs cursor-pointer ${
                  receiptFilter === 'APPROVED'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>تأییدشده ({summaryStats.receipts_approved || 0})</span>
              </button>
              <button
                type="button"
                onClick={() => setReceiptFilter('REJECTED')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center gap-1.5 whitespace-nowrap text-xs cursor-pointer ${
                  receiptFilter === 'REJECTED'
                    ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>رد شده ({summaryStats.receipts_rejected || 0})</span>
              </button>
            </div>
          </div>

          {/* Receipts List */}
          {receiptLoading ? (
            <LoadingState message="در حال دریافت و بارگذاری رسیدهای پرداخت..." />
          ) : receipts.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="رسیدی یافت نشد"
              description="هیچ فیش یا رسید پرداختی در وضعیت یا جستجوی انتخابی ثبت نشده است."
            />
          ) : (
            <div className="space-y-4">
              {receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-4"
                >
                  {/* Card Top: Swimmer Info, Meta & Status Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 text-white flex items-center justify-center font-black text-lg shadow-xs shrink-0 overflow-hidden">
                        {receipt.swimmer_avatar ? (
                          <img
                            src={getAuthenticatedDocUrl(receipt.swimmer_avatar)}
                            alt={receipt.swimmer_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{receipt.swimmer_name?.charAt(0) || 'ش'}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-slate-900 dark:text-white text-lg">
                            {receipt.swimmer_name}
                          </h3>
                          {receipt.gender_display && (
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                              {receipt.gender_display}
                            </span>
                          )}
                          {receipt.national_id && (
                            <span className="text-[11px] text-slate-400 font-mono">
                              کد ملی: {receipt.national_id}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                          {receipt.swimmer_phone && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {receipt.swimmer_phone}
                            </span>
                          )}
                          {receipt.father_name && <span>نام پدر: {receipt.father_name}</span>}
                          <span className="text-slate-400">·</span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            زمان ارسال: {receipt.created_at ? new Date(receipt.created_at).toLocaleDateString('fa-IR') : '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {receipt.status === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          تأییدشده و کسر از شهریه
                        </span>
                      ) : receipt.status === 'REJECTED' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800">
                          <XCircle className="w-4 h-4 text-rose-600" />
                          عدم تأیید / رد شده
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800">
                          <Clock className="w-4 h-4 text-amber-600" />
                          در انتظار بررسی مدیریت
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Middle: 3 Columns Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    {/* Col 1: Course & Tuition details */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 space-y-2">
                      <span className="text-sm font-black text-sky-700 dark:text-sky-300 flex items-center gap-1.5 block">
                        <CreditCard className="w-4 h-4" />
                        مشخصات دوره و وضعیت شهریه
                      </span>
                      <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                        <div>
                          <span className="text-slate-400">دوره آموزشی: </span>
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {receipt.course_name}
                          </span>
                        </div>
                        {receipt.group_name && receipt.group_name !== '—' && (
                          <div>
                            <span className="text-slate-400">گروه کلاسی: </span>
                            <span>{receipt.group_name}</span>
                          </div>
                        )}
                        {receipt.course_price && (
                          <div>
                            <span className="text-slate-400">شهریه مصوب دوره: </span>
                            <span className="font-bold font-mono">
                              {formatPrice(receipt.course_price)} تومان
                            </span>
                          </div>
                        )}
                        {receipt.invoice_number && (
                          <div>
                            <span className="text-slate-400">شماره صورتحساب: </span>
                            <span className="font-mono text-[11px]">{receipt.invoice_number}</span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                          <span className="text-slate-500 font-bold">مانده بدهی فعلی:</span>
                          {Number(receipt.invoice_remaining_balance || 0) > 0 ? (
                            <span className="text-sm sm:text-base font-black text-rose-600 font-mono">
                              {formatPrice(receipt.invoice_remaining_balance)} تومان
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> تسویه کامل
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Col 2: Bank transfer details & notes */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 space-y-2">
                      <span className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5 block">
                        <Receipt className="w-4 h-4 text-emerald-600" />
                        اطلاعات واریز کارت‌به‌کارت
                      </span>
                      <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                        <div>
                          <span className="text-slate-400">شماره پیگیری / مرجع: </span>
                          <span className="font-bold font-mono text-slate-900 dark:text-white">
                            {receipt.tracking_number || 'ثبت‌نشده'}
                          </span>
                        </div>
                        {receipt.payer_card_number && (
                          <div>
                            <span className="text-slate-400">کارت واریزکننده: </span>
                            <span className="font-mono" dir="ltr">
                              {receipt.payer_card_number}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-400">مبلغ اعلامی شناگر: </span>
                          <span className="font-bold font-mono text-slate-800 dark:text-slate-100">
                            {receipt.amount_claimed > 0
                              ? `${formatPrice(receipt.amount_claimed)} تومان`
                              : 'ذکر نشده'}
                          </span>
                        </div>
                        {receipt.notes && (
                          <div className="text-[11px] text-slate-500 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 mt-1">
                            <span className="text-slate-400 block mb-0.5">توضیحات شناگر:</span>
                            {receipt.notes}
                          </div>
                        )}

                        {/* If Approved info */}
                        {receipt.status === 'APPROVED' && (
                          <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold">مبلغ کسر شده از شهریه:</span>
                              <span className="font-black font-mono text-sm">
                                {formatPrice(receipt.approved_amount)} تومان
                              </span>
                            </div>
                            {receipt.reviewed_by_name && (
                              <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400 block">
                                تأییدشده توسط: {receipt.reviewed_by_name}
                              </span>
                            )}
                          </div>
                        )}

                        {/* If Rejected info */}
                        {receipt.status === 'REJECTED' && (
                          <div className="mt-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs">
                            <span className="font-bold block mb-0.5">علت عدم تأیید:</span>
                            <span>{receipt.rejection_reason || 'مدارک ناقص است'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Col 3: Receipt Image Thumbnail with Stable Preview & Download */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 flex flex-col justify-between text-center gap-2.5">
                      <div className="w-full flex items-center justify-between">
                        <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                          تصویر فیش واریزی
                        </span>
                        {receipt.receipt_image && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                            کیفیت اصلی
                          </span>
                        )}
                      </div>

                      {receipt.receipt_image ? (
                        <div className="w-full space-y-2">
                          <div
                            onClick={() =>
                              setPreviewDoc({
                                title: `رسید واریز کارت‌به‌کارت ${receipt.swimmer_name}`,
                                url: getAuthenticatedDocUrl(receipt.receipt_image),
                                filename: `receipt_${receipt.id}_${receipt.swimmer_name || 'swimmer'}.jpg`,
                                type: 'image',
                              })
                            }
                            className="relative w-full h-40 bg-white dark:bg-slate-900 rounded-xl overflow-hidden cursor-pointer border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-2xs hover:border-sky-400 dark:hover:border-sky-500 transition-colors"
                            title="مشاهده بزرگنمایی فیش"
                          >
                            <img
                              src={getAuthenticatedDocUrl(receipt.receipt_image)}
                              alt={`رسید ${receipt.swimmer_name}`}
                              className="w-full h-full object-contain p-1"
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = FALLBACK_RECEIPT_IMAGE;
                              }}
                            />
                            <div className="absolute inset-0 bg-slate-950/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-bold pointer-events-none">
                              <ZoomIn className="w-5 h-5 text-emerald-400" />
                              <span>بزرگنمایی فیش</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 w-full pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewDoc({
                                  title: `رسید واریز کارت‌به‌کارت ${receipt.swimmer_name}`,
                                  url: getAuthenticatedDocUrl(receipt.receipt_image),
                                  filename: `receipt_${receipt.id}_${receipt.swimmer_name || 'swimmer'}.jpg`,
                                  type: 'image',
                                })
                              }
                              className="w-full py-2 px-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-sky-200/80 dark:border-sky-800 transition-colors cursor-pointer"
                            >
                              <ZoomIn className="w-4 h-4" />
                              <span>بزرگنمایی</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                downloadOriginalFile(
                                  getAuthenticatedDocUrl(receipt.receipt_image),
                                  `receipt_${receipt.id}_${receipt.swimmer_name || 'swimmer'}.jpg`
                                )
                              }
                              className="w-full py-2 px-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-emerald-200/80 dark:border-emerald-800 transition-colors cursor-pointer"
                            >
                              <Download className="w-4 h-4" />
                              <span>دانلود فیش</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-40 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 text-sm gap-2">
                          <Receipt className="w-8 h-8 opacity-40" />
                          <span>تصویر فیش یافت نشد</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                    {receipt.status === 'PENDING' ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="primary"
                          onClick={() => openApproveModal(receipt)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-2.5 gap-2 shadow-2xs cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>تأیید رسید و کسر از شهریه</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => openRejectionModal('RECEIPT', receipt)}
                          className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-300 dark:border-rose-800 font-bold text-sm px-4 py-2.5 gap-2 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          <span>عدم تأیید / رد رسید</span>
                        </Button>
                      </div>
                    ) : receipt.status === 'APPROVED' ? (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        این رسید تأیید شده و مبلغ {formatPrice(receipt.approved_amount)} تومان در حسابداری ثبت و از شهریه شناگر کسر گردید.
                      </span>
                    ) : (
                      <span className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5">
                        <XCircle className="w-4 h-4" />
                        این رسید رد شده است (علت: {receipt.rejection_reason || 'مدارک نامعتبر'})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal 3: Approve Receipt & Deduct Tuition Amount */}
      {approveModal.isOpen && (
        <Modal
          isOpen={approveModal.isOpen}
          onClose={() => setApproveModal((prev) => ({ ...prev, isOpen: false }))}
          title={`تأیید رسید پرداخت و کسر از شهریه شناگر: ${approveModal.receipt?.swimmer_name}`}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleApproveReceiptSubmit} className="space-y-4 text-right" dir="rtl">
            {/* Swimmer & Course Summary banner */}
            <div className="bg-sky-50 dark:bg-sky-950/40 p-4 rounded-2xl border border-sky-200/80 dark:border-sky-900/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-sky-900 dark:text-sky-200">
                <span>شناگر: {approveModal.receipt?.swimmer_name}</span>
                <span>کد ملی: {approveModal.receipt?.national_id || '—'}</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                <span>دوره: {approveModal.receipt?.course_name}</span>
                <span>شهریه کل: {formatPrice(approveModal.receipt?.course_price)} تومان</span>
              </div>
              <div className="pt-2 border-t border-sky-200 dark:border-sky-900/80 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">مانده بدهی فعلی دوره:</span>
                <span className="font-black font-mono text-rose-600 text-sm">
                  {formatPrice(approveModal.receipt?.invoice_remaining_balance)} تومان
                </span>
              </div>
            </div>

            {/* Quick Fill Helper Chips */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                تنظیم سریع مبلغ تأییدی:
              </label>
              <div className="flex flex-wrap gap-2">
                {Number(approveModal.receipt?.invoice_remaining_balance || 0) > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setApproveModal((prev) => ({
                        ...prev,
                        approvedAmount: String(approveModal.receipt.invoice_remaining_balance),
                      }))
                    }
                    className="text-xs px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 border border-emerald-300 dark:border-emerald-800 font-bold transition-all cursor-pointer"
                  >
                    تسویه کامل بدهی ({formatPrice(approveModal.receipt.invoice_remaining_balance)} ت)
                  </button>
                )}
                {Number(approveModal.receipt?.amount_claimed || 0) > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setApproveModal((prev) => ({
                        ...prev,
                        approvedAmount: String(approveModal.receipt.amount_claimed),
                      }))
                    }
                    className="text-xs px-3 py-1.5 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-200 hover:bg-sky-200 border border-sky-300 dark:border-sky-800 font-bold transition-all cursor-pointer"
                  >
                    مبلغ اعلامی شناگر ({formatPrice(approveModal.receipt.amount_claimed)} ت)
                  </button>
                )}
                {Number(approveModal.receipt?.course_price || 0) > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setApproveModal((prev) => ({
                        ...prev,
                        approvedAmount: String(approveModal.receipt.course_price),
                      }))
                    }
                    className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-300 dark:border-slate-700 font-bold transition-all cursor-pointer"
                  >
                    شهریه کل ({formatPrice(approveModal.receipt.course_price)} ت)
                  </button>
                )}
              </div>
            </div>

            {/* Approved Amount Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                مبلغ مورد تأیید مدیریت جهت کسر از شهریه (تومان) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="1000"
                  step="1000"
                  value={approveModal.approvedAmount}
                  onChange={(e) =>
                    setApproveModal((prev) => ({ ...prev, approvedAmount: e.target.value }))
                  }
                  placeholder="مثال: ۱۵۰۰۰۰۰"
                  className="w-full p-3.5 text-base sm:text-lg font-black font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              {approveModal.approvedAmount && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  {numToPersianWords(approveModal.approvedAmount)}
                </p>
              )}
            </div>

            {/* Admin Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                یادداشت یا توضیحات مدیر (اختیاری):
              </label>
              <input
                type="text"
                value={approveModal.notes}
                onChange={(e) =>
                  setApproveModal((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="مثلاً: واریز فیش کارت‌به‌کارت تأیید گردید."
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setApproveModal((prev) => ({ ...prev, isOpen: false }))}
                disabled={approveModal.submitting}
              >
                انصراف
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={approveModal.submitting || !approveModal.approvedAmount}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-bold"
              >
                <Check className="w-4 h-4" />
                <span>{approveModal.submitting ? 'در حال اعمال در حسابداری...' : 'تأیید قطعی و کسر از شهریه'}</span>
              </Button>
            </div>
          </form>
        </Modal>
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
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-100 dark:bg-slate-950 rounded-2xl p-3 border border-slate-200 dark:border-slate-800">
              <img
                src={previewDoc.url}
                alt={previewDoc.title}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-md"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_RECEIPT_IMAGE;
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-3 pt-2.5 flex-wrap">
              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    downloadOriginalFile(
                      previewDoc.url,
                      previewDoc.filename || `${previewDoc.title || 'document'}.jpg`
                    )
                  }
                  className="gap-2 text-sm font-bold bg-sky-600 hover:bg-sky-700 text-white cursor-pointer shadow-xs py-2 px-3.5"
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود فایل اصلی با کیفیت بالا</span>
                </Button>
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-sky-600 dark:text-sky-400 font-bold hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>مشاهده در برگه جدید</span>
                </a>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPreviewDoc(null)}
                className="text-sm font-semibold px-4"
              >
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
          title={
            rejectionModal.targetType === 'RECEIPT'
              ? `رد فیش پرداخت شناگر: ${rejectionModal.targetName}`
              : `اعلام نقص و عدم تأیید مدرک: ${rejectionModal.targetName}`
          }
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {rejectionModal.targetType === 'RECEIPT'
                ? 'دلیل عدم تأیید فیش برای شناگر نمایش داده خواهد شد تا نسبت به بررسی یا ارسال مجدد اقدام نماید.'
                : 'علت نقص مدارک برای کاربر ارسال خواهد شد تا نسبت به بارگذاری مجدد اقدام نماید.'}
            </p>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                انتخاب سریع از موارد متداول:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(rejectionModal.targetType === 'RECEIPT'
                  ? receiptPresetReasons
                  : rejectionModal.targetType === 'SWIMMER'
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
                placeholder="توضیح دهید چه مواردی نیازمند اصلاح یا رفع مغایرت است..."
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
                className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5 text-xs font-bold"
              >
                {rejectionModal.submitting
                  ? 'در حال ثبت...'
                  : rejectionModal.targetType === 'RECEIPT'
                  ? 'تأیید رد رسید'
                  : 'ثبت اعلام نقص'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
