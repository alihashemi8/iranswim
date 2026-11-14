import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck, Plus, Calendar, Clock, BookOpen, Whistle,
  Award, Shield, Phone, Edit, CheckCircle2, AlertTriangle, FileSpreadsheet,
  ChevronLeft, Sparkles, User, Hash, Lock, DollarSign, KeyRound, Copy, X,
  LayoutGrid, List, Search, Filter, RotateCcw, Archive, FileText, Download,
  CreditCard, ChevronRight, AlertCircle, ArrowUpDown, ClipboardCheck, Check
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { CustomSelect } from '../../components/common/CustomSelect';
import { PersianDatePicker, toJalaliString, parseJalaliString } from '../../components/common/PersianDatePicker';
import * as jalaali from 'jalaali-js';
import { useToast } from '../../context/ToastContext';
import { exportToCsv } from '../../utils/exportCsv';
import { generateStrongPassword, validatePassword } from '../../utils/passwordValidator';

export const AdminCoachesPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [coaches, setCoaches] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  // View Mode: 'cards' | 'table' (persisted in localStorage)
  const [viewMode, setViewMode] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_coaches_view_mode');
      if (saved === 'cards' || saved === 'table') {
        return saved;
      }
    } catch (e) {
      console.error('Error reading viewMode from localStorage:', e);
    }
    return 'cards';
  });

  useEffect(() => {
    try {
      localStorage.setItem('admin_coaches_view_mode', viewMode);
    } catch (e) {
      console.error('Error saving viewMode to localStorage:', e);
    }
  }, [viewMode]);

  // Track copied card state for visual checkmark feedback
  const [copiedCard, setCopiedCard] = useState(null);

  // Responsive mobile detection (mobile forces cards; tablet & desktop allow switching)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const effectiveViewMode = isMobile ? 'cards' : viewMode;

  // Persian Date Filter for Statistics (Month Filter)
  const [persianStatsDate, setPersianStatsDate] = useState(() => toJalaliString(new Date()));

  // Compute Gregorian month (YYYY-MM) for backend statistics API
  const statsMonth = useMemo(() => {
    if (!persianStatsDate) {
      const today = new Date();
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    }
    const p = parseJalaliString(persianStatsDate);
    if (!p) {
      const today = new Date();
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    }
    try {
      const g = jalaali.toGregorian(p.jy, p.jm, p.jd || 1);
      return `${g.gy}-${String(g.gm).padStart(2, '0')}`;
    } catch {
      const today = new Date();
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    }
  }, [persianStatsDate]);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('');
  const [contractStatusFilter, setContractStatusFilter] = useState('');
  const [payrollStatusFilter, setPayrollStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('display_order');

  // Edit Status Modal
  const [statusCoach, setStatusCoach] = useState(null);
  const [newStatus, setNewStatus] = useState('ACTIVE');
  const [statusReason, setStatusReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Archive Confirmation Modal
  const [archiveCoachTarget, setArchiveCoachTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);

  // HR Reports Modal
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [reportsData, setReportsData] = useState(null);
  const [activeReportTab, setActiveReportTab] = useState('payroll');
  const [loadingReports, setLoadingReports] = useState(false);

  // Fetch Dashboard Statistics
  const fetchStatistics = async () => {
    try {
      setLoadingStats(true);
      const res = await api.get('/coaches/statistics/', {
        params: { month: statsMonth },
      });
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch Coaches List with Server-side Filtering & Search
  const fetchCoaches = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter) params.status = statusFilter;
      if (genderFilter) params.gender = genderFilter;
      if (employmentTypeFilter) params.employment_type = employmentTypeFilter;
      if (contractStatusFilter) params.contract_status = contractStatusFilter;
      if (payrollStatusFilter) params.payroll_status = payrollStatusFilter;
      if (sortBy) params.ordering = sortBy;

      const res = await api.get('/coaches/', { params });
      setCoaches(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت لیست مربیان');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [statsMonth]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCoaches();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, genderFilter, employmentTypeFilter, contractStatusFilter, payrollStatusFilter, sortBy]);

  // Submit Coach Status Change
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!statusCoach) return;

    try {
      setUpdatingStatus(true);
      await api.post(`/coaches/${statusCoach.id}/change-status/`, {
        employment_status: newStatus,
        reason: statusReason.trim(),
      });
      toast.success(`وضعیت همکاری مربی ${statusCoach.full_name} با موفقیت به‌روزرسانی شد.`);
      setStatusCoach(null);
      setStatusReason('');
      fetchCoaches();
      fetchStatistics();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در تغییر وضعیت مربی');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Submit Archive Coach (Soft Archive)
  const handleArchiveConfirm = async () => {
    if (!archiveCoachTarget) return;

    try {
      setArchiving(true);
      await api.delete(`/coaches/${archiveCoachTarget.id}/`);
      toast.success(`پرونده مربی ${archiveCoachTarget.full_name} با موفقیت بایگانی شد.`);
      setArchiveCoachTarget(null);
      fetchCoaches();
      fetchStatistics();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در بایگانی پرونده مربی');
    } finally {
      setArchiving(false);
    }
  };

  // Format number in Millions (e.g. 12,400,000 -> "12.4م", 20,000,000 -> "20م")
  const formatMillion = (val) => {
    if (val === null || val === undefined) return '۰';
    const num = Number(val);
    if (num === 0) return '۰';
    const m = num / 1_000_000;
    if (m >= 1) {
      const formatted = m % 1 === 0 ? m.toFixed(0) : m.toFixed(1).replace(/\.0$/, '');
      return `${formatted}م`;
    }
    const k = num / 1_000;
    if (k >= 1) {
      const formatted = k % 1 === 0 ? k.toFixed(0) : k.toFixed(1).replace(/\.0$/, '');
      return `${formatted}هزار`;
    }
    return num.toLocaleString('en-US');
  };

  // Format bank card number (e.g. 6037-9975-1234-5678)
  const formatCardNumber = (num) => {
    if (!num) return '—';
    const clean = String(num).replace(/\D/g, '');
    if (clean.length === 16) {
      return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}`;
    }
    return num;
  };

  // Copy card number to clipboard with feedback
  const handleCopyCard = (card, name) => {
    if (!card) return;
    const clean = String(card).replace(/\D/g, '');
    const copyVal = clean || card;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(copyVal).then(() => {
        setCopiedCard(card);
        toast.success(`شماره کارت ${name ? `مربی ${name}` : ''} کپی شد (${formatCardNumber(card)})`);
        setTimeout(() => setCopiedCard(null), 2500);
      }).catch(() => {
        fallbackCopy(copyVal, name, card);
      });
    } else {
      fallbackCopy(copyVal, name, card);
    }
  };

  const fallbackCopy = (text, name, card) => {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedCard(card);
      toast.success(`شماره کارت ${name ? `مربی ${name}` : ''} کپی شد (${formatCardNumber(card)})`);
      setTimeout(() => setCopiedCard(null), 2500);
    } catch {
      toast.error('خطا در کپی شماره کارت در حافظه');
    }
  };

  // Export to Excel / CSV
  const handleExportCsv = () => {
    const rows = coaches.map((c) => {
      const ps = c.payroll_summary || {};
      const totalSalary = Number(ps.total_salary || 0);
      const totalPaid = Number(ps.total_paid || 0);
      const remaining = Number(ps.remaining !== undefined ? ps.remaining : Math.max(0, totalSalary - totalPaid));
      return {
        name: c.full_name,
        personnel_id: c.personnel_id || '—',
        phone: c.phone,
        card_number: formatCardNumber(c.card_number),
        attendance_count: `${c.attendance_count || 0} جلسه`,
        classes_count: `${c.active_classes_count || 0} کلاس`,
        total_salary: `${formatPrice(totalSalary)} تومان (${formatMillion(totalSalary)})`,
        total_paid: `${formatPrice(totalPaid)} تومان (${formatMillion(totalPaid)})`,
        remaining: `${formatPrice(remaining)} تومان (${formatMillion(remaining)})`,
        financial_ratio: `${formatMillion(totalPaid)} / ${formatMillion(totalSalary)}`,
        status: c.employment_status_display || c.employment_status,
      };
    });

    exportToCsv('IranSwim_Coaches_List', rows, {
      name: 'نام و نام خانوادگی',
      personnel_id: 'کد پرسنلی',
      phone: 'شماره همراه',
      card_number: 'شماره کارت بانکی',
      attendance_count: 'تعداد حضور',
      classes_count: 'کلاس‌های فعال',
      total_salary: 'مبلغ کل حقوق',
      total_paid: 'مبلغ پرداختی',
      remaining: 'مبلغ مانده',
      financial_ratio: 'نسبت پرداختی به کل حقوق',
      status: 'وضعیت کاری',
    });
  };

  // Open HR Reports Modal
  const handleOpenReports = async (type = 'payroll') => {
    setActiveReportTab(type);
    setIsReportsModalOpen(true);
    try {
      setLoadingReports(true);
      const res = await api.get('/coaches/reports/', { params: { type } });
      setReportsData(res.data.records || []);
    } catch (err) {
      toast.error('خطا در دریافت گزارش');
    } finally {
      setLoadingReports(false);
    }
  };

  const toEnglishDigits = (val) => {
    if (val === null || val === undefined) return '';
    return String(val)
      .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
      .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  };

  const formatDateShamsiEnglish = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return toEnglishDigits(d.toLocaleDateString('fa-IR'));
    } catch {
      return toEnglishDigits(dateStr);
    }
  };

  const formatPrice = (v) => Number(v || 0).toLocaleString('en-US');

  const statusFilterOptions = [
    { value: '', label: 'تمام وضعیت‌های کاری' },
    { value: 'ACTIVE', label: 'فعال و مجاز' },
    { value: 'SUSPENDED', label: 'معلق' },
    { value: 'INACTIVE', label: 'غیرفعال' },
    { value: 'ARCHIVED', label: 'بایگانی‌شده' },
  ];

  const coachStatusChangeOptions = [
    {
      value: 'ACTIVE',
      label: 'فعال و مجاز (Active)',
      description: 'مربی مجاز به فعالیت، ثبت کلاس و تدریس است',
      badge: 'مجاز',
      badgeClassName: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800',
      icon: CheckCircle2,
    },
    {
      value: 'SUSPENDED',
      label: 'معلق موقت (Suspended)',
      description: 'فعالیت‌های مربی موقتاً به حالت تعلیق درمی‌آید',
      badge: 'معلق',
      badgeClassName: 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800',
      icon: Clock,
    },
    {
      value: 'INACTIVE',
      label: 'پایان همکاری / غیرفعال (Inactive)',
      description: 'همکاری مربی خاتمه یافته یا متوقف شده است',
      badge: 'غیرفعال',
      badgeClassName: 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800',
      icon: AlertCircle,
    },
    {
      value: 'ARCHIVED',
      label: 'بایگانی پرونده (Archived)',
      description: 'پرونده بایگانی و از چرخه‌های جاری حذف می‌شود',
      badge: 'بایگانی',
      badgeClassName: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
      icon: Archive,
    },
  ];

  const employmentTypeOptions = [
    { value: '', label: 'تمام مدل‌های همکاری' },
    { value: 'HOURLY', label: 'ساعتی (حق‌التدریس)' },
    { value: 'FIXED', label: 'حقوق ثابت ماهانه' },
    { value: 'PERCENTAGE', label: 'درصدی از شهریه' },
  ];

  const contractStatusOptions = [
    { value: '', label: 'تمام وضعیت‌های قرارداد' },
    { value: 'ACTIVE', label: 'دارای قرارداد معتبر' },
    { value: 'EXPIRING_SOON', label: 'انقضا در 30 روز آینده' },
    { value: 'EXPIRED', label: 'قرارداد منقضی‌شده' },
    { value: 'NO_CONTRACT', label: 'فاقد قرارداد' },
  ];

  const sortOptions = [
    { value: 'display_order', label: 'ترتیب نمایش سایت' },
    { value: 'name', label: 'نام مربی (الف-ی)' },
    { value: '-name', label: 'نام مربی (ی-الف)' },
    { value: '-employment_date', label: 'جدیدترین تاریخ استخدام' },
    { value: 'employment_date', label: 'قدیمی‌ترین تاریخ استخدام' },
  ];

  return (
    <div className="space-y-6 admin-coaches-section" style={{ fontFeatureSettings: '"ss01" 0, "cv01" 1' }}>
      <style>{`
        .admin-coaches-section,
        .admin-coaches-section *,
        .admin-coaches-modal,
        .admin-coaches-modal * {
          font-feature-settings: "ss01" 0, "cv01" 1 !important;
        }
      `}</style>
      {/* 1. Header with Title & Action Controls */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Whistle className="w-6 h-6 sm:w-7 sm:h-7 text-sky-600 shrink-0" />
            <span>سامانه جامع مدیریت مربیان و منابع انسانی</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            پرونده‌های پرسنلی، احکام قراردادی، محاسبه کارکرد و فیش حقوقی، مرخصی‌ها و ارزیابی عملکرد
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add Coach Button */}
          <Button
            onClick={() => navigate('/admin/coaches/new')}
            className="gap-2 text-xs sm:text-sm font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-xs py-2 sm:py-2.5 px-3.5 sm:px-4"
          >
            <Plus className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span>افزودن مربی جدید</span>
          </Button>

          {/* View Reports Button */}
          <Button variant="outline" onClick={() => handleOpenReports('payroll')} className="gap-2 text-xs sm:text-sm font-bold bg-white dark:bg-slate-900 shadow-xs py-2 sm:py-2.5 px-3.5 sm:px-4">
            <CreditCard className="w-4 h-4 text-sky-600" />
            <span>گزارش‌های جامع مالی و پرسنلی</span>
          </Button>
        </div>
      </div>

      {/* 2. Real-time Dashboard Statistics Cards */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <span className="font-bold text-sm sm:text-base text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-sky-600" />
            شاخص‌های کلیدی مدیریت پرسنلی و حقوق دستمزد
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">فیلتر ماه گزارش:</span>
            <div className="w-44 sm:w-52">
              <PersianDatePicker
                value={persianStatsDate}
                onChange={(val) => setPersianStatsDate(val)}
                placeholder="انتخاب تاریخ..."
                size="sm"
                englishDigits={true}
                buttonClassName="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-xs sm:text-sm py-1.5 px-3 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
          {/* Total & Active Coaches */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5">
            <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 block">کل مربیان / فعال:</span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
                {stats?.total_coaches || 0}
              </span>
              <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                ({stats?.active_coaches || 0} نفر فعال)
              </span>
            </div>
            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {stats?.inactive_or_suspended_coaches || 0} نفر معلق یا غیرفعال
            </div>
          </div>

          {/* Currently Teaching */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5">
            <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 block">مربیان در حال تدریس:</span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black font-mono text-sky-600 dark:text-sky-400">
                {stats?.teaching_coaches || 0}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">نفر دارای کلاس</span>
            </div>
            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">دارای گروه یا جلسه فعال</div>
          </div>

          {/* Monthly Payroll Total */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5">
            <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 block">کل تعهد حقوق این ماه:</span>
            <div className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white truncate">
              {formatPrice(stats?.total_payroll_month)} تومان
            </div>
            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {stats?.fully_settled_coaches || 0} مربی کاملاً تسویه‌شده
            </div>
          </div>

          {/* Outstanding Liabilities */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-xs space-y-1.5 bg-rose-50/20 dark:bg-rose-950/20">
            <span className="text-xs sm:text-sm text-rose-700 dark:text-rose-300 block font-bold">مطالبات معوق حقوق:</span>
            <div className="text-base sm:text-lg font-black font-mono text-rose-600 dark:text-rose-400 truncate">
              {formatPrice(stats?.outstanding_salary_payments)} تومان
            </div>
            <div className="text-xs sm:text-sm text-rose-600/90 dark:text-rose-400/90 font-medium">مانده قابل پرداخت مربیان</div>
          </div>

          {/* Contract Expiration & Leaves Alerts */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-600 dark:text-slate-300 font-medium">انقضای قرارداد (30 روز):</span>
              <span className={`font-mono font-bold px-2.5 py-0.5 rounded-full text-xs sm:text-sm ${
                (stats?.expiring_contracts_count || 0) > 0 ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {stats?.expiring_contracts_count || 0}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-600 dark:text-slate-300 font-medium">مرخصی در انتظار:</span>
              <span className={`font-mono font-bold px-2.5 py-0.5 rounded-full text-xs sm:text-sm ${
                (stats?.pending_leave_requests_count || 0) > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {stats?.pending_leave_requests_count || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search and Multi-Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو نام مربی، تلفن، کد پرسنلی یا کد ملی..."
              className="w-full text-xs sm:text-sm pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          {/* Status Filter */}
          <div>
            <CustomSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={statusFilterOptions}
              size="sm"
              color="sky"
              placeholder="وضعیت کاری..."
            />
          </div>

          {/* Employment Type */}
          <div>
            <CustomSelect
              value={employmentTypeFilter}
              onChange={(val) => setEmploymentTypeFilter(val)}
              options={employmentTypeOptions}
              size="sm"
              color="sky"
              placeholder="مدل همکاری..."
            />
          </div>

          {/* Contract Status */}
          <div>
            <CustomSelect
              value={contractStatusFilter}
              onChange={(val) => setContractStatusFilter(val)}
              options={contractStatusOptions}
              size="sm"
              color="sky"
              placeholder="وضعیت قرارداد..."
            />
          </div>

          {/* Sort By */}
          <div>
            <CustomSelect
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={sortOptions}
              size="sm"
              color="sky"
              placeholder="مرتب‌سازی..."
            />
          </div>
        </div>

        {/* Gender Filter Pills, Excel Export & View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Gender Filter Pills */}
            <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setGenderFilter('')}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  genderFilter === ''
                    ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                همه ({coaches.length})
              </button>
              <button
                type="button"
                onClick={() => setGenderFilter('MALE')}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  genderFilter === 'MALE'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                مربیان آقا
              </button>
              <button
                type="button"
                onClick={() => setGenderFilter('FEMALE')}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  genderFilter === 'FEMALE'
                    ? 'bg-white dark:bg-slate-700 text-pink-700 dark:text-pink-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                مربیان خانم
              </button>
            </div>

            {/* Export to Excel */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="gap-2 text-xs sm:text-sm font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 shadow-2xs py-2 px-3 sm:px-3.5 rounded-xl transition-all cursor-pointer shrink-0"
              title="دریافت خروجی اکسل مربیان"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>خروجی اکسل</span>
            </Button>
          </div>

          {/* View Switcher (Cards / Table) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">حالت نمایش:</span>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-2xs' : 'text-slate-500 dark:text-slate-400'
                }`}
                title="نمای کارت‌ها"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-2xs' : 'text-slate-500 dark:text-slate-400'
                }`}
                title="نمای جدول"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Coaches List (Cards View or Table View) */}
      {loading ? (
        <LoadingState type={effectiveViewMode === 'cards' ? 'cards' : 'table'} count={6} message="در حال واکشی اطلاعات مربیان آموزشگاه..." />
      ) : coaches.length === 0 ? (
        <EmptyState
          title="مربی با این مشخصات یافت نشد"
          description="با تنظیم مجدد فیلترها یا جستجوی نام دیگر، نتایج به‌روزرسانی خواهند شد."
        />
      ) : effectiveViewMode === 'cards' ? (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch">
          {coaches.map((coach) => {
            const ps = coach.payroll_summary || {};
            const total = Number(ps.total_salary || 0);
            const paid = Number(ps.total_paid || 0);
            const rem = Number(ps.remaining !== undefined ? ps.remaining : Math.max(0, total - paid));
            const percent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
            const isSettled = rem === 0 && total > 0;
            const isUnpaid = paid === 0 && total > 0;

            return (
              <div
                key={coach.id}
                onClick={() => navigate(`/admin/coaches/${coach.id}`)}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:border-sky-400/80 dark:hover:border-sky-500/80 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer h-full"
              >
                <div className="flex flex-col flex-1 space-y-4">
                  {/* Header: Large Profile Avatar, Name, Phone & Status */}
                  <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3.5">
                      {/* Enlarged Avatar */}
                      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-xs ring-2 ring-slate-100 dark:ring-slate-800 group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                        {coach.avatar ? (
                          <img src={coach.avatar} alt={coach.full_name} className="w-full h-full object-cover" />
                        ) : (
                          coach.full_name ? coach.full_name.charAt(0) : 'م'
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate max-w-[170px]">
                          {coach.full_name}
                        </h3>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                          <span>{coach.phone}</span>
                        </div>
                      </div>
                    </div>

                    <Badge
                      variant={
                        coach.employment_status === 'ACTIVE'
                          ? 'success'
                          : coach.employment_status === 'SUSPENDED'
                          ? 'warning'
                          : coach.employment_status === 'ARCHIVED'
                          ? 'neutral'
                          : 'neutral'
                      }
                    >
                      {coach.employment_status_display || coach.employment_status}
                    </Badge>
                  </div>

                  {/* Bank Card with One-Click Copy */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyCard(coach.card_number, coach.full_name);
                    }}
                    className="p-2.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between cursor-pointer group/card transition-all"
                    title="برای کپی شماره کارت کلیک کنید"
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-sky-600 shrink-0" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">شماره کارت:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-xs tracking-wider" dir="ltr">
                        {formatCardNumber(coach.card_number)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {copiedCard === coach.card_number ? (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>کپی شد</span>
                        </span>
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400 group-hover/card:text-sky-600 transition-colors" />
                      )}
                    </div>
                  </div>

                  {/* Attendance & Classes Metrics */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold block mb-1">تعداد حضور:</span>
                      <div className="flex items-center gap-1.5">
                        <ClipboardCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-mono font-black text-emerald-800 dark:text-emerald-200 text-base">
                          {toEnglishDigits(coach.attendance_count || 0)}
                        </span>
                        <span className="text-xs text-emerald-700 dark:text-emerald-300">جلسه</span>
                      </div>
                    </div>

                    <div
                      className="p-3 bg-sky-50/60 dark:bg-sky-950/20 rounded-xl border border-sky-100 dark:border-sky-900/40"
                      title={coach.assigned_group_names && coach.assigned_group_names.length > 0 ? coach.assigned_group_names.join(' • ') : 'فاقد کلاس'}
                    >
                      <span className="text-[11px] text-sky-700 dark:text-sky-300 font-semibold block mb-1">کلاس‌ها:</span>
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-sky-600 shrink-0" />
                        <span className="font-mono font-black text-sky-800 dark:text-sky-200 text-base">
                          {toEnglishDigits(coach.active_classes_count || 0)}
                        </span>
                        <span className="text-xs text-sky-700 dark:text-sky-300">کلاس</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Status: Total Salary, Paid, Remaining */}
                  <div
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2"
                    title={`کل حقوق: ${formatPrice(total)} تومان\nپرداختی: ${formatPrice(paid)} تومان\nمانده: ${formatPrice(rem)} تومان`}
                  >
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-bold text-slate-600 dark:text-slate-300">حقوق و تسویه:</span>
                      <div className="flex items-baseline gap-1">
                        <span className="font-mono font-black text-slate-900 dark:text-white text-sm sm:text-base">
                          {formatMillion(paid)} / {formatMillion(total)}
                        </span>
                        <span className="text-[11px] text-slate-500 font-semibold">تومان</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isSettled ? 'bg-emerald-500' : isUnpaid ? 'bg-rose-400' : 'bg-sky-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <span className="text-slate-500 dark:text-slate-400">مبلغ مانده:</span>
                      {isSettled ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">تسویه کامل ✓</span>
                      ) : total === 0 ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {formatMillion(rem)} تومان
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 mt-3.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/coaches/${coach.id}/schedule`)}
                    className="flex-1 py-2 px-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950 text-slate-700 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-bold border border-slate-200/60 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    title="برنامه هفتگی"
                  >
                    <Calendar className="w-4 h-4 text-sky-600" />
                    <span>برنامه</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/admin/coaches/${coach.id}`)}
                    className="flex-1 py-2 px-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950 text-slate-700 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-bold border border-slate-200/60 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    title="مشاهده پرونده جامع"
                  >
                    <UserCheck className="w-4 h-4 text-sky-600" />
                    <span>پرونده</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setArchiveCoachTarget(coach)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl border border-slate-200/60 dark:border-slate-700 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="بایگانی مربی"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-bold text-center w-24">پروفایل</th>
                  <th className="py-3.5 px-4 font-bold min-w-[170px]">نام و نام خانوادگی</th>
                  <th className="py-3.5 px-4 font-bold min-w-[175px]">شماره کارت بانکی</th>
                  <th className="py-3.5 px-4 font-bold text-center">تعداد حضور</th>
                  <th className="py-3.5 px-4 font-bold text-center">کلاس‌ها</th>
                  <th className="py-3.5 px-4 font-bold min-w-[220px]">
                    <div>حقوق و تسویه</div>
                    <span className="text-[11px] text-slate-400 font-normal">پرداختی / کل (مانده)</span>
                  </th>
                  <th className="py-3.5 px-4 font-bold text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {coaches.map((c) => {
                  const ps = c.payroll_summary || {};
                  const total = Number(ps.total_salary || 0);
                  const paid = Number(ps.total_paid || 0);
                  const rem = Number(ps.remaining !== undefined ? ps.remaining : Math.max(0, total - paid));
                  const percent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
                  const isSettled = rem === 0 && total > 0;
                  const isUnpaid = paid === 0 && total > 0;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/admin/coaches/${c.id}`)}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* 1. Profile Avatar (Enlarged) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-xs ring-2 ring-slate-100 dark:ring-slate-800 overflow-hidden shrink-0 mx-auto group-hover:scale-105 transition-transform">
                          {c.avatar ? (
                            <img src={c.avatar} alt={c.full_name} className="w-full h-full object-cover" />
                          ) : (
                            c.full_name?.charAt(0) || 'م'
                          )}
                        </div>
                      </td>

                      {/* 2. Full Name & Subtitle */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors block">
                            {c.full_name}
                          </span>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            <span>{c.phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Bank Card Number (Clickable to Copy) */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        {c.card_number ? (
                          <button
                            type="button"
                            onClick={() => handleCopyCard(c.card_number, c.full_name)}
                            className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-sky-50 dark:hover:bg-sky-950/60 border border-slate-200/80 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700 text-slate-800 dark:text-slate-200 transition-all cursor-pointer group/btn"
                            title="برای کپی شماره کارت کلیک کنید"
                          >
                            <CreditCard className="w-4 h-4 text-slate-400 group-hover/btn:text-sky-600 shrink-0" />
                            <span className="font-mono font-bold text-xs tracking-wider" dir="ltr">
                              {formatCardNumber(c.card_number)}
                            </span>
                            {copiedCard === c.card_number ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-sky-600 shrink-0 opacity-70 group-hover/btn:opacity-100" />
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">ثبت‌نشده</span>
                        )}
                      </td>

                      {/* 4. Attendance Count */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs sm:text-sm font-bold border border-emerald-200/60 dark:border-emerald-800 shadow-2xs">
                          <ClipboardCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-mono">{toEnglishDigits(c.attendance_count || 0)}</span>
                          <span>جلسه</span>
                        </div>
                      </td>

                      {/* 4. Classes */}
                      <td className="py-3.5 px-4 text-center">
                        <div
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 rounded-xl text-xs sm:text-sm font-bold border border-sky-200/60 dark:border-sky-800 shadow-2xs"
                          title={c.assigned_group_names && c.assigned_group_names.length > 0 ? c.assigned_group_names.join(' • ') : 'فاقد کلاس'}
                        >
                          <BookOpen className="w-4 h-4 text-sky-600 shrink-0" />
                          <span className="font-mono">{toEnglishDigits(c.active_classes_count || 0)}</span>
                          <span>کلاس</span>
                        </div>
                      </td>

                      {/* 5. Salary, Paid, Remaining */}
                      <td className="py-3.5 px-4">
                        <div
                          className="space-y-1.5 min-w-[210px] max-w-[260px]"
                          title={`مبلغ کل حقوق: ${formatPrice(total)} تومان\nمبلغ پرداختی: ${formatPrice(paid)} تومان\nمبلغ مانده: ${formatPrice(rem)} تومان`}
                        >
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <div className="flex items-baseline gap-1">
                              <span className="font-mono font-black text-slate-900 dark:text-white text-sm sm:text-base">
                                {formatMillion(paid)} / {formatMillion(total)}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">تومان</span>
                            </div>
                            <span className="font-mono font-bold text-xs text-slate-500 dark:text-slate-400">
                              {percent}%
                            </span>
                          </div>

                          {/* Mini progress bar */}
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isSettled ? 'bg-emerald-500' : isUnpaid ? 'bg-rose-400' : 'bg-sky-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 dark:text-slate-400">مانده:</span>
                            {isSettled ? (
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800 text-[11px]">
                                تسویه کامل ✓
                              </span>
                            ) : total === 0 ? (
                              <span className="text-slate-400 text-[11px]">—</span>
                            ) : (
                              <span
                                className={`font-mono font-bold px-2 py-0.5 rounded-md text-[11px] ${
                                  isUnpaid
                                    ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900'
                                    : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900'
                                }`}
                              >
                                {formatMillion(rem)} تومان
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 6. Operations / Actions */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/coaches/${c.id}`)}
                            className="px-3 py-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/50 dark:hover:bg-sky-900/50 rounded-xl border border-sky-200/60 dark:border-sky-800 transition-colors cursor-pointer"
                            title="مشاهده پرونده جامع"
                          >
                            پرونده
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Change Status */}
      <Modal
        isOpen={!!statusCoach}
        onClose={() => setStatusCoach(null)}
        title={`تغییر وضعیت همکاری مربی: ${statusCoach?.full_name}`}
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4 admin-coaches-modal">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              وضعیت جدید همکاری <span className="text-rose-500">*</span>
            </label>
            <CustomSelect
              value={newStatus}
              onChange={(val) => setNewStatus(val)}
              options={coachStatusChangeOptions}
              color="sky"
              menuClassName="w-full"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              علت تغییر وضعیت <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="مثال: پایان مدت قرارداد، تعلیق انضباطی، بازگشت به کار..."
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium placeholder:text-slate-400"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setStatusCoach(null)}>
              انصراف
            </Button>
            <Button type="submit" disabled={updatingStatus} className="bg-sky-600 hover:bg-sky-500 text-white">
              {updatingStatus ? 'در حال ثبت...' : 'تأیید تغییر وضعیت'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Archive Coach Confirmation */}
      <Modal
        isOpen={!!archiveCoachTarget}
        onClose={() => setArchiveCoachTarget(null)}
        title="تأیید بایگانی پرونده مربی"
      >
        <div className="space-y-4 text-xs sm:text-sm admin-coaches-modal">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              هشدار بایگانی پرونده مربی: {archiveCoachTarget?.full_name}
            </div>
            <p className="leading-relaxed">
              با بایگانی پرونده، وضعیت کاری مربی به «بایگانی‌شده» تغییر می‌یابد و کلاس‌های جاری ایشان خاتمه می‌یابد.
            </p>
            <p className="font-bold text-amber-950 dark:text-amber-100">
              * کلیه سوابق تاریخی مالی، فیش‌های حقوقی گذشته، اسناد پرداخت، قراردادها و حضور و غیاب مربی دست‌نخورده باقی مانده و هرگز پاک نخواهند شد.
            </p>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setArchiveCoachTarget(null)} className="text-xs sm:text-sm font-bold">
              انصراف
            </Button>
            <Button
              onClick={handleArchiveConfirm}
              disabled={archiving}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold"
            >
              {archiving ? 'در حال بایگانی...' : 'تأیید و بایگانی پرونده'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: HR Reports and Exports */}
      <Modal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
        title="مرکز گزارش‌های جامع مالی، تعهدات و منابع انسانی مربیان"
        size="lg"
      >
        <div className="space-y-4 text-xs sm:text-sm admin-coaches-modal">
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => handleOpenReports('payroll')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeReportTab === 'payroll' ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              گزارش حقوق و مطالبات ماهانه
            </button>
            <button
              type="button"
              onClick={() => handleOpenReports('contracts')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeReportTab === 'contracts' ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              گزارش وضعیت و انقضای قراردادها
            </button>
            <button
              type="button"
              onClick={() => handleOpenReports('performance')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeReportTab === 'performance' ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              گزارش ارزیابی عملکرد
            </button>
          </div>

          {loadingReports ? (
            <div className="py-8 text-center text-slate-400 text-xs sm:text-sm">در حال دریافت داده‌های گزارش...</div>
          ) : !reportsData || reportsData.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs sm:text-sm">داده‌ای برای این گزارش ثبت نشده است.</div>
          ) : (
            <div className="max-h-[50vh] overflow-y-auto space-y-2">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold">
                  <tr>
                    <th className="py-2.5 px-3.5">مربی</th>
                    {activeReportTab === 'payroll' && (
                      <>
                        <th className="py-2.5 px-3.5">دوره</th>
                        <th className="py-2.5 px-3.5">ساعات</th>
                        <th className="py-2.5 px-3.5">خالص حقوق</th>
                        <th className="py-2.5 px-3.5">واریزشده</th>
                        <th className="py-2.5 px-3.5">مانده</th>
                        <th className="py-2.5 px-3.5">وضعیت تسویه</th>
                      </>
                    )}
                    {activeReportTab === 'contracts' && (
                      <>
                        <th className="py-2.5 px-3.5">شماره قرارداد</th>
                        <th className="py-2.5 px-3.5">شروع</th>
                        <th className="py-2.5 px-3.5">پایان</th>
                        <th className="py-2.5 px-3.5">روز مانده</th>
                        <th className="py-2.5 px-3.5">وضعیت</th>
                      </>
                    )}
                    {activeReportTab === 'performance' && (
                      <>
                        <th className="py-2.5 px-3.5">دوره ارزیابی</th>
                        <th className="py-2.5 px-3.5">نمره کل</th>
                        <th className="py-2.5 px-3.5">ارزیاب</th>
                        <th className="py-2.5 px-3.5">تاریخ</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reportsData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="py-2.5 px-3.5 font-bold">{row.coach_name}</td>
                      {activeReportTab === 'payroll' && (
                        <>
                          <td className="py-2.5 px-3.5">{row.period_label}</td>
                          <td className="py-2.5 px-3.5 font-mono">{row.teaching_hours} س</td>
                          <td className="py-2.5 px-3.5 font-mono font-bold">{formatPrice(row.net_payable)} ت</td>
                          <td className="py-2.5 px-3.5 font-mono text-emerald-600 dark:text-emerald-400 font-bold">{formatPrice(row.total_paid)} ت</td>
                          <td className="py-2.5 px-3.5 font-mono text-rose-600 dark:text-rose-400 font-bold">{formatPrice(row.remaining_balance)} ت</td>
                          <td className="py-2.5 px-3.5">{row.payment_status}</td>
                        </>
                      )}
                      {activeReportTab === 'contracts' && (
                        <>
                          <td className="py-2.5 px-3.5 font-mono">{row.contract_number}</td>
                          <td className="py-2.5 px-3.5 font-mono">{formatDateShamsiEnglish(row.start_date)}</td>
                          <td className="py-2.5 px-3.5 font-mono">{formatDateShamsiEnglish(row.end_date)}</td>
                          <td className="py-2.5 px-3.5 font-mono font-bold text-amber-600">{row.days_remaining} روز</td>
                          <td className="py-2.5 px-3.5">{row.status}</td>
                        </>
                      )}
                      {activeReportTab === 'performance' && (
                        <>
                          <td className="py-2.5 px-3.5">{row.period_label}</td>
                          <td className="py-2.5 px-3.5 font-mono font-bold text-amber-600">★ {row.overall_score}</td>
                          <td className="py-2.5 px-3.5">{row.evaluator_name}</td>
                          <td className="py-2.5 px-3.5 font-mono">{formatDateShamsiEnglish(row.evaluation_date)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsReportsModalOpen(false)} className="text-xs sm:text-sm font-bold">
              بستن
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
