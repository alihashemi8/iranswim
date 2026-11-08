import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck, Plus, Calendar, Clock, BookOpen,
  Award, Shield, Phone, Edit, CheckCircle2, AlertTriangle, FileSpreadsheet,
  ChevronLeft, Sparkles, User, Hash, Lock, DollarSign, KeyRound, Copy, X,
  LayoutGrid, List, Search, Filter, RotateCcw, Archive, FileText, Download,
  CreditCard, ChevronRight, AlertCircle, ArrowUpDown
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { CustomSelect } from '../../components/common/CustomSelect';
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

  // View Mode: 'cards' | 'table'
  const [viewMode, setViewMode] = useState('cards');

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

  // Month Filter for Statistics
  const [statsMonth, setStatsMonth] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

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

  // Export to Excel / CSV
  const handleExportCsv = () => {
    const rows = coaches.map((c) => ({
      name: c.full_name,
      personnel_id: c.personnel_id || '—',
      phone: c.phone,
      national_id: c.national_id || '—',
      gender: c.gender === 'MALE' ? 'مرد' : 'زن',
      specialties: c.specialties || '—',
      employment_type: c.employment_type === 'HOURLY' ? 'ساعتی' : c.employment_type === 'FIXED' ? 'حقوق ثابت' : 'درصدی',
      status: c.employment_status_display || c.employment_status,
      rate_salary: c.employment_type === 'HOURLY'
        ? `${Number(c.hourly_rate || 0).toLocaleString('fa-IR')} ت/ساعت`
        : c.employment_type === 'FIXED'
        ? `${Number(c.fixed_monthly_salary || 0).toLocaleString('fa-IR')} ت/ماه`
        : `${c.revenue_percentage || 0}٪`,
      active_classes: c.active_classes_count || 0,
      start_date: c.employment_start_date ? new Date(c.employment_start_date).toLocaleDateString('fa-IR') : '—',
    }));

    exportToCsv('IranSwim_Coaches_HR_List', rows, {
      name: 'نام و نام خانوادگی',
      personnel_id: 'کد پرسنلی',
      phone: 'شماره همراه',
      national_id: 'کد ملی',
      gender: 'جنسیت',
      specialties: 'تخصص‌ها',
      employment_type: 'مدل همکاری',
      status: 'وضعیت کاری',
      rate_salary: 'نرخ / دستمزد مصوب',
      active_classes: 'کلاس‌های فعال',
      start_date: 'تاریخ آغاز همکاری',
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

  const formatPrice = (v) => Number(v || 0).toLocaleString('fa-IR');

  const statusFilterOptions = [
    { value: '', label: 'تمام وضعیت‌های کاری' },
    { value: 'ACTIVE', label: 'فعال و مجاز' },
    { value: 'SUSPENDED', label: 'معلق' },
    { value: 'INACTIVE', label: 'غیرفعال' },
    { value: 'ARCHIVED', label: 'بایگانی‌شده' },
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
    { value: 'EXPIRING_SOON', label: 'انقضا در ۳۰ روز آینده' },
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
    <div className="space-y-6">
      {/* 1. Header with Title & Action Controls */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-sky-600" />
            سامانه جامع مدیریت مربیان و منابع انسانی (Coach HR)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            پرونده‌های پرسنلی، احکام قراردادی، محاسبه کارکرد و فیش حقوقی، مرخصی‌ها و ارزیابی عملکرد
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add Coach Button */}
          <Button
            onClick={() => navigate('/admin/coaches/new')}
            className="gap-1.5 text-xs bg-sky-600 hover:bg-sky-500 text-white shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن مربی جدید</span>
          </Button>

          {/* Export to Excel */}
          <Button variant="outline" onClick={handleExportCsv} className="gap-1.5 text-xs bg-white dark:bg-slate-900 shadow-xs">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>خروجی اکسل</span>
          </Button>

          {/* View Reports Button */}
          <Button variant="outline" onClick={() => handleOpenReports('payroll')} className="gap-1.5 text-xs bg-white dark:bg-slate-900 shadow-xs">
            <CreditCard className="w-4 h-4 text-sky-600" />
            <span>گزارش‌های جامع مالی و HR</span>
          </Button>
        </div>
      </div>

      {/* 2. Real-time Dashboard Statistics Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-sky-600" />
            شاخص‌های کلیدی مدیریت پرسنلی و حقوق دستمزد
          </span>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">فیلتر ماه گزارش:</span>
            <input
              type="month"
              value={statsMonth}
              onChange={(e) => setStatsMonth(e.target.value)}
              className="text-xs p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
          {/* Total & Active Coaches */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-xs sm:text-sm text-slate-400 block">کل مربیان / فعال:</span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
                {stats?.total_coaches || 0}
              </span>
              <span className="text-xs sm:text-sm font-bold text-emerald-600">
                ({stats?.active_coaches || 0} نفر فعال)
              </span>
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400">
              {stats?.inactive_or_suspended_coaches || 0} نفر معلق یا غیرفعال
            </div>
          </div>

          {/* Currently Teaching */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-xs sm:text-sm text-slate-400 block">مربیان در حال تدریس:</span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl font-black font-mono text-sky-600 dark:text-sky-400">
                {stats?.teaching_coaches || 0}
              </span>
              <span className="text-xs sm:text-sm text-slate-500">نفر دارای کلاس</span>
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400">دارای گروه یا جلسه فعال</div>
          </div>

          {/* Monthly Payroll Total */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-xs sm:text-sm text-slate-400 block">کل تعهد حقوق این ماه:</span>
            <div className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white truncate">
              {formatPrice(stats?.total_payroll_month)} تومان
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400">
              {stats?.fully_settled_coaches || 0} مربی کاملاً تسویه‌شده
            </div>
          </div>

          {/* Outstanding Liabilities */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-xs space-y-1 bg-rose-50/20 dark:bg-rose-950/20">
            <span className="text-xs sm:text-sm text-rose-700 dark:text-rose-300 block font-semibold">مطالبات معوق حقوق:</span>
            <div className="text-sm sm:text-base font-black font-mono text-rose-600 dark:text-rose-400 truncate">
              {formatPrice(stats?.outstanding_salary_payments)} تومان
            </div>
            <div className="text-[11px] sm:text-xs text-rose-600/80">مانده قابل پرداخت مربیان</div>
          </div>

          {/* Contract Expiration & Leaves Alerts */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-500">انقضای قرارداد (۳۰ روز):</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded-full text-xs ${
                (stats?.expiring_contracts_count || 0) > 0 ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-slate-100 text-slate-600'
              }`}>
                {stats?.expiring_contracts_count || 0}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-500">مرخصی در انتظار:</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded-full text-xs ${
                (stats?.pending_leave_requests_count || 0) > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
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
              className="w-full text-xs pr-9 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
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

        {/* Gender Filter Pills & View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setGenderFilter('')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                genderFilter === ''
                  ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              همه ({coaches.length})
            </button>
            <button
              type="button"
              onClick={() => setGenderFilter('MALE')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                genderFilter === 'MALE'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              مربیان آقا
            </button>
            <button
              type="button"
              onClick={() => setGenderFilter('FEMALE')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                genderFilter === 'FEMALE'
                  ? 'bg-white dark:bg-slate-700 text-pink-700 dark:text-pink-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              مربیان خانم
            </button>
          </div>

          {/* View Switcher (HIDDEN on Mobile, VISIBLE on Desktop & Tablet) */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs text-slate-400">حالت نمایش:</span>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-2xs' : 'text-slate-500'
                }`}
                title="نمای کارت‌ها"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-2xs' : 'text-slate-500'
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
          {coaches.map((coach) => (
            <div
              key={coach.id}
              onClick={() => navigate(`/admin/coaches/${coach.id}`)}
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:border-sky-400/80 dark:hover:border-sky-500/80 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer h-full"
            >
              <div className="flex flex-col flex-1 space-y-3">
                {/* Header: Photo, Name, Personnel ID, Status */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                      {coach.avatar ? (
                        <img src={coach.avatar} alt={coach.full_name} className="w-full h-full object-cover" />
                      ) : (
                        coach.full_name ? coach.full_name.charAt(0) : 'C'
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate max-w-[150px]">
                        {coach.full_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono">{coach.phone}</span>
                        <span>•</span>
                        <span className="font-mono text-sky-700 dark:text-sky-400 font-bold">
                          {coach.personnel_id || '—'}
                        </span>
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

                {/* Specialties & Contract */}
                <div className="space-y-2 text-xs flex-1">
                  <div>
                    <span className="text-slate-400 block mb-0.5">تخصص‌ها:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">
                      {coach.specialties || 'شنای عمومی و مقدماتی'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-500">
                    <span>مدل قرارداد:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {coach.employment_type_display || coach.employment_type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-500">
                    <span>کلاس‌های فعال:</span>
                    <span className="font-bold font-mono text-sky-600 dark:text-sky-400">
                      {coach.active_classes_count || coach.assigned_groups_count || 0} کلاس
                    </span>
                  </div>

                  {/* Contract Status Badge */}
                  {coach.active_contract_summary ? (
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
                      <span className="text-slate-500">قرارداد معتبر:</span>
                      <span className={`font-mono text-[11px] font-bold ${
                        coach.active_contract_summary.is_expiring_soon ? 'text-amber-600 animate-pulse' : 'text-emerald-600'
                      }`}>
                        تا {new Date(coach.active_contract_summary.end_date).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                  ) : (
                    <div className="p-2 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl flex items-center justify-between text-amber-700 dark:text-amber-300 text-[11px]">
                      <span>فاقد قرارداد فعال</span>
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between text-slate-500 border-t border-slate-100 dark:border-slate-800/60">
                    <span>حق‌التدریس مصوب:</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                      {coach.employment_type === 'HOURLY' && `${formatPrice(coach.hourly_rate)} ت/س`}
                      {coach.employment_type === 'FIXED' && `${formatPrice(coach.fixed_monthly_salary)} ت/ماه`}
                      {coach.employment_type === 'PERCENTAGE' && `${coach.revenue_percentage || 0}٪`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => navigate(`/admin/coaches/${coach.id}/schedule`)}
                  className="flex-1 py-1.5 px-2 bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200/60 dark:border-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="برنامه هفتگی"
                >
                  <Calendar className="w-3.5 h-3.5 text-sky-600" />
                  <span>برنامه</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStatusCoach(coach);
                    setNewStatus(coach.employment_status || 'ACTIVE');
                    setStatusReason('');
                  }}
                  className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200/60 dark:border-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="تغییر وضعیت"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>وضعیت</span>
                </button>

                <button
                  type="button"
                  onClick={() => setArchiveCoachTarget(coach)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl border border-slate-200/60 dark:border-slate-700 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="بایگانی مربی"
                >
                  <Archive className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-bold">مربی</th>
                  <th className="py-3 px-4 font-bold">کد پرسنلی</th>
                  <th className="py-3 px-4 font-bold">شماره همراه</th>
                  <th className="py-3 px-4 font-bold">جنسیت</th>
                  <th className="py-3 px-4 font-bold">تخصص‌ها</th>
                  <th className="py-3 px-4 font-bold">مدل همکاری</th>
                  <th className="py-3 px-4 font-bold">نرخ / دستمزد</th>
                  <th className="py-3 px-4 font-bold">کلاس‌های فعال</th>
                  <th className="py-3 px-4 font-bold">وضعیت کاری</th>
                  <th className="py-3 px-4 font-bold">قرارداد</th>
                  <th className="py-3 px-4 font-bold text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {coaches.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/admin/coaches/${c.id}`)}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                          {c.avatar ? <img src={c.avatar} alt={c.full_name} className="w-full h-full object-cover" /> : c.full_name?.charAt(0) || 'C'}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{c.full_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-sky-700 dark:text-sky-400">{c.personnel_id || '—'}</td>
                    <td className="py-3 px-4 font-mono">{c.phone}</td>
                    <td className="py-3 px-4">{c.gender === 'MALE' ? 'مرد' : 'زن'}</td>
                    <td className="py-3 px-4 max-w-[150px] truncate">{c.specialties || 'عمومی'}</td>
                    <td className="py-3 px-4">{c.employment_type_display || c.employment_type}</td>
                    <td className="py-3 px-4 font-mono font-semibold">
                      {c.employment_type === 'HOURLY' && `${formatPrice(c.hourly_rate)} ت`}
                      {c.employment_type === 'FIXED' && `${formatPrice(c.fixed_monthly_salary)} ت`}
                      {c.employment_type === 'PERCENTAGE' && `${c.revenue_percentage || 0}٪`}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-center">{c.active_classes_count || 0}</td>
                    <td className="py-3 px-4">
                      <Badge variant={c.employment_status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {c.employment_status_display || c.employment_status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {c.active_contract_summary ? (
                        <span className={`font-mono text-[11px] ${c.active_contract_summary.is_expiring_soon ? 'text-amber-600 font-bold' : 'text-emerald-600'}`}>
                          معتبر
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">ندارد</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/coaches/${c.id}`)}
                          className="text-xs text-sky-600 hover:text-sky-700 font-semibold p-1"
                          title="مشاهده پرونده جامع"
                        >
                          پرونده
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStatusCoach(c);
                            setNewStatus(c.employment_status || 'ACTIVE');
                            setStatusReason('');
                          }}
                          className="text-xs text-amber-600 hover:text-amber-700 font-semibold p-1"
                          title="تغییر وضعیت"
                        >
                          وضعیت
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              وضعیت جدید همکاری <span className="text-rose-500">*</span>
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="ACTIVE">فعال و مجاز (Active)</option>
              <option value="SUSPENDED">معلق موقت (Suspended)</option>
              <option value="INACTIVE">پایان همکاری / غیرفعال (Inactive)</option>
              <option value="ARCHIVED">بایگانی پرونده (Archived)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              علت تغییر وضعیت <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="مثال: پایان مدت قرارداد، تعلیق انضباطی، بازگشت به کار..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
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
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
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

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setArchiveCoachTarget(null)}>
              انصراف
            </Button>
            <Button
              onClick={handleArchiveConfirm}
              disabled={archiving}
              className="bg-rose-600 hover:bg-rose-500 text-white"
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
        <div className="space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => handleOpenReports('payroll')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeReportTab === 'payroll' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              گزارش حقوق و مطالبات ماهانه
            </button>
            <button
              type="button"
              onClick={() => handleOpenReports('contracts')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeReportTab === 'contracts' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              گزارش وضعیت و انقضای قراردادها
            </button>
            <button
              type="button"
              onClick={() => handleOpenReports('performance')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeReportTab === 'performance' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              گزارش ارزیابی عملکرد
            </button>
          </div>

          {loadingReports ? (
            <div className="py-8 text-center text-slate-400">در حال دریافت داده‌های گزارش...</div>
          ) : !reportsData || reportsData.length === 0 ? (
            <div className="py-8 text-center text-slate-400">داده‌ای برای این گزارش ثبت نشده است.</div>
          ) : (
            <div className="max-h-[50vh] overflow-y-auto space-y-2">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400">
                  <tr>
                    <th className="py-2 px-3">مربی</th>
                    {activeReportTab === 'payroll' && (
                      <>
                        <th className="py-2 px-3">دوره</th>
                        <th className="py-2 px-3">ساعات</th>
                        <th className="py-2 px-3">خالص حقوق</th>
                        <th className="py-2 px-3">واریزشده</th>
                        <th className="py-2 px-3">مانده</th>
                        <th className="py-2 px-3">وضعیت تسویه</th>
                      </>
                    )}
                    {activeReportTab === 'contracts' && (
                      <>
                        <th className="py-2 px-3">شماره قرارداد</th>
                        <th className="py-2 px-3">نوع</th>
                        <th className="py-2 px-3">شروع</th>
                        <th className="py-2 px-3">پایان</th>
                        <th className="py-2 px-3">روز مانده</th>
                        <th className="py-2 px-3">وضعیت</th>
                      </>
                    )}
                    {activeReportTab === 'performance' && (
                      <>
                        <th className="py-2 px-3">دوره ارزیابی</th>
                        <th className="py-2 px-3">نمره کل</th>
                        <th className="py-2 px-3">ارزیاب</th>
                        <th className="py-2 px-3">تاریخ</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reportsData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold">{row.coach_name}</td>
                      {activeReportTab === 'payroll' && (
                        <>
                          <td className="py-2 px-3">{row.period_label}</td>
                          <td className="py-2 px-3 font-mono">{row.teaching_hours} س</td>
                          <td className="py-2 px-3 font-mono font-bold">{formatPrice(row.net_payable)} ت</td>
                          <td className="py-2 px-3 font-mono text-emerald-600">{formatPrice(row.total_paid)} ت</td>
                          <td className="py-2 px-3 font-mono text-rose-600 font-bold">{formatPrice(row.remaining_balance)} ت</td>
                          <td className="py-2 px-3">{row.payment_status}</td>
                        </>
                      )}
                      {activeReportTab === 'contracts' && (
                        <>
                          <td className="py-2 px-3 font-mono">{row.contract_number}</td>
                          <td className="py-2 px-3">{row.contract_type}</td>
                          <td className="py-2 px-3 font-mono">{new Date(row.start_date).toLocaleDateString('fa-IR')}</td>
                          <td className="py-2 px-3 font-mono">{new Date(row.end_date).toLocaleDateString('fa-IR')}</td>
                          <td className="py-2 px-3 font-mono font-bold text-amber-600">{row.days_remaining} روز</td>
                          <td className="py-2 px-3">{row.status}</td>
                        </>
                      )}
                      {activeReportTab === 'performance' && (
                        <>
                          <td className="py-2 px-3">{row.period_label}</td>
                          <td className="py-2 px-3 font-mono font-bold text-amber-600">★ {row.overall_score}</td>
                          <td className="py-2 px-3">{row.evaluator_name}</td>
                          <td className="py-2 px-3 font-mono">{new Date(row.evaluation_date).toLocaleDateString('fa-IR')}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsReportsModalOpen(false)}>
              بستن
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
