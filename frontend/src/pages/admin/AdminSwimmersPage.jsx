import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Users, UserPlus, Search, Filter, Phone, CheckCircle2,
  XCircle, FileSpreadsheet, PlusCircle, Award, MapPin,
  Calendar, ArrowLeft, ArrowDown, Loader2, Check, UserX,
  ShieldCheck, Clock, Whistle, X, RotateCcw, SlidersHorizontal,
  FolderCheck, Sparkles
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { ClassSelectorDropdown } from '../../components/common/ClassSelectorDropdown';
import { PersianDatePicker } from '../../components/common/PersianDatePicker';
import { CustomSelect } from '../../components/common/CustomSelect';
import { useToast } from '../../context/ToastContext';
import { exportToCsv } from '../../utils/exportCsv';

export const AdminSwimmersPage = () => {
  const [swimmers, setSwimmers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [countsSummary, setCountsSummary] = useState({ total: 0, active: 0, inactive: 0 });
  const [levels, setLevels] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, INACTIVE
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 4 Core Filters Requested by User:
  // 1. سال تولد (Birth Year)
  // 2. استخر (Pool)
  // 3. جنسیت (Gender)
  // 4. مربی (Coach)
  const [birthYearFilter, setBirthYearFilter] = useState('');
  const [poolFilter, setPoolFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [coachFilter, setCoachFilter] = useState('');

  // Mobile filters collapsible state
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filter options loaded from backend
  const [filterOptions, setFilterOptions] = useState({
    pools: [],
    coaches: [],
    birth_years: [],
    genders: [
      { value: 'MALE', label: 'پسر / آقایان' },
      { value: 'FEMALE', label: 'دختر / بانوان' },
    ],
  });

  // Pending documents summary counter (to show shortcut badge to Dossiers page)
  const [pendingDocsCount, setPendingDocsCount] = useState(0);

  // Create Swimmer Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    national_id: '',
    gender: 'MALE',
    date_of_birth: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    current_level: '',
    medical_notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Swimmer Class Change Confirmation Modal State
  const [pendingClassChange, setPendingClassChange] = useState(null);
  const [confirmingClassChange, setConfirmingClassChange] = useState(false);

  // Load levels, groups, and filter metadata
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [levelsRes, groupsRes, filterRes, dossiersRes] = await Promise.allSettled([
          api.get('/education/levels/'),
          api.get('/education/groups/'),
          api.get('/swimmers/filter-options/'),
          api.get('/swimmers/dossiers-summary/'),
        ]);

        if (levelsRes.status === 'fulfilled') {
          setLevels(levelsRes.value.data.results || levelsRes.value.data || []);
        }
        if (groupsRes.status === 'fulfilled') {
          setGroups(groupsRes.value.data.results || groupsRes.value.data || []);
        }
        if (filterRes.status === 'fulfilled' && filterRes.value.data) {
          setFilterOptions(filterRes.value.data);
        }
        if (dossiersRes.status === 'fulfilled' && dossiersRes.value.data) {
          setPendingDocsCount(dossiersRes.value.data.swimmers_pending || 0);
        }
      } catch (err) {
        console.error('Error fetching metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch swimmers with server-side pagination & all 4 advanced filters
  const fetchSwimmers = useCallback(async (pageToFetch = currentPage) => {
    try {
      setLoading(true);
      const params = {
        page: pageToFetch,
        page_size: pageSize,
      };
      if (activeSearch.trim()) params.search = activeSearch.trim();
      if (selectedLevel) params.level = selectedLevel;
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
      if (birthYearFilter) params.birth_year = birthYearFilter;
      if (poolFilter) params.pool = poolFilter;
      if (genderFilter) params.gender = genderFilter;
      if (coachFilter) params.coach = coachFilter;

      const swimmersRes = await api.get('/swimmers/', { params });
      const data = swimmersRes.data;

      if (data && data.results) {
        setSwimmers(data.results);
        setTotalCount(data.count || 0);
        setTotalPages(data.total_pages || Math.ceil((data.count || 0) / pageSize) || 1);
        if (data.counts) {
          setCountsSummary(data.counts);
        }
      } else if (Array.isArray(data)) {
        setSwimmers(data);
        setTotalCount(data.length);
        setTotalPages(Math.ceil(data.length / pageSize) || 1);
      }
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت لیست شناگران');
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    activeSearch,
    selectedLevel,
    statusFilter,
    birthYearFilter,
    poolFilter,
    genderFilter,
    coachFilter,
    pageSize,
    toast,
  ]);

  useEffect(() => {
    fetchSwimmers(currentPage);
  }, [
    currentPage,
    activeSearch,
    selectedLevel,
    statusFilter,
    birthYearFilter,
    poolFilter,
    genderFilter,
    coachFilter,
    fetchSwimmers,
  ]);

  // Handle Quick Action deep link
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsAddModalOpen(true);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('action');
          return next;
        },
        { replace: true }
      );
    }
  }, [searchParams, setSearchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (currentPage !== 1) setCurrentPage(1);
    setActiveSearch(search);
  };

  const handleStatusFilterChange = (val) => {
    if (currentPage !== 1) setCurrentPage(1);
    setStatusFilter(val);
  };

  const handleBirthYearChange = (val) => {
    if (currentPage !== 1) setCurrentPage(1);
    setBirthYearFilter(val);
  };

  const handlePoolChange = (val) => {
    if (currentPage !== 1) setCurrentPage(1);
    setPoolFilter(val);
  };

  const handleGenderChange = (val) => {
    if (currentPage !== 1) setCurrentPage(1);
    setGenderFilter(val);
  };

  const handleCoachChange = (val) => {
    if (currentPage !== 1) setCurrentPage(1);
    setCoachFilter(val);
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setBirthYearFilter('');
    setPoolFilter('');
    setGenderFilter('');
    setCoachFilter('');
    setSelectedLevel('');
    setSearch('');
    setActiveSearch('');
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  const activeAdvancedFilterCount = [
    birthYearFilter,
    poolFilter,
    genderFilter,
    coachFilter,
    selectedLevel,
  ].filter(Boolean).length;

  // Open Full Swimmer Dossier
  const handleOpenDossier = (swimmer) => {
    if (swimmer?.id) {
      navigate(`/admin/swimmers/${swimmer.id}`);
    }
  };

  // Create Swimmer Handler
  const handleCreateSwimmer = async (e) => {
    e.preventDefault();
    if (!createForm.first_name || !createForm.last_name || !createForm.phone) {
      toast.error('لطفاً نام، نام خانوادگی و شماره همراه را وارد کنید.');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/swimmers/', {
        ...createForm,
        current_level: createForm.current_level ? Number(createForm.current_level) : null,
      });
      toast.success('پرونده شناگر با موفقیت ثبت گردید.');
      setIsAddModalOpen(false);
      setCreateForm({
        first_name: '',
        last_name: '',
        phone: '',
        national_id: '',
        gender: 'MALE',
        date_of_birth: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        current_level: '',
        medical_notes: '',
      });
      if (currentPage === 1) {
        fetchSwimmers(1);
      } else {
        setCurrentPage(1);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در ثبت پرونده شناگر');
    } finally {
      setSubmitting(false);
    }
  };

  // Available classes helper for swimmer
  const getSwimmerAvailableClasses = (swimmer) => {
    if (swimmer.available_classes && swimmer.available_classes.length > 0) {
      return swimmer.available_classes;
    }
    if (groups && groups.length > 0) {
      return groups.map((g) => ({
        id: `g_${g.id}`,
        group_id: g.id,
        coach_id: g.coach_assignments?.[0]?.coach || null,
        name: g.name,
        coach_name: g.coach_assignments?.[0]?.coach_name || null,
        avatar: null,
        course_id: g.course,
        course_name: g.course_name || '',
        is_current_course: Boolean(swimmer.course_id && g.course === swimmer.course_id),
      }));
    }
    return [];
  };

  // Request Swimmer Class Change (triggers confirmation modal)
  const handleRequestChangeClass = (swimmer, selectedClass) => {
    const isCurrentlyInClass =
      (selectedClass === null && !swimmer.coach_id && !swimmer.group_id) ||
      (selectedClass &&
        ((selectedClass.group_id && swimmer.group_id && selectedClass.group_id === swimmer.group_id) ||
          (selectedClass.coach_id &&
            swimmer.coach_id &&
            selectedClass.coach_id === swimmer.coach_id &&
            (!selectedClass.group_id || selectedClass.group_id === swimmer.group_id))));

    if (isCurrentlyInClass) {
      toast.info('شناگر در حال حاضر در این کلاس حضور دارد.');
      return;
    }

    const currentClass =
      swimmer.coach_id || swimmer.group_id || swimmer.class_name
        ? {
            id: swimmer.group_id || swimmer.coach_id,
            group_id: swimmer.group_id,
            coach_id: swimmer.coach_id,
            name: swimmer.class_name || (swimmer.coach_name ? `کلاس ${swimmer.coach_name}` : 'کلاس فعلی'),
            coach_name: swimmer.coach_name,
            avatar: swimmer.coach_avatar,
          }
        : null;

    setPendingClassChange({
      swimmer,
      currentClass,
      newClass: selectedClass,
    });
  };

  // Confirm Swimmer Class Change
  const handleConfirmClassChange = async () => {
    if (!pendingClassChange) return;
    const { swimmer, newClass } = pendingClassChange;

    try {
      setConfirmingClassChange(true);
      const payload = {
        coach_id: newClass ? newClass.coach_id : null,
        group_id: newClass ? newClass.group_id : null,
      };

      const res = await api.post(`/swimmers/${swimmer.id}/assign-coach/`, payload);
      setSwimmers((prev) => prev.map((s) => (s.id === swimmer.id ? res.data : s)));

      const targetName = newClass
        ? newClass.name || (newClass.coach_name ? `کلاس ${newClass.coach_name}` : 'کلاس انتخاب‌شده')
        : 'بدون کلاس';

      toast.success(
        newClass
          ? `کلاس شناگر «${swimmer.full_name}» با موفقیت به «${targetName}» تغییر یافت.`
          : `تخصیص کلاس برای «${swimmer.full_name}» با موفقیت حذف گردید.`
      );
      setPendingClassChange(null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در تغییر کلاس شناگر');
    } finally {
      setConfirmingClassChange(false);
    }
  };

  // Export to Excel / CSV with all active filters accurately applied
  const handleExportCsv = async () => {
    try {
      toast.info('در حال دریافت اطلاعات و ایجاد فایل اکسل...');
      const params = { all: 'true' };
      if (activeSearch.trim()) params.search = activeSearch.trim();
      if (selectedLevel) params.level = selectedLevel;
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
      if (birthYearFilter) params.birth_year = birthYearFilter;
      if (poolFilter) params.pool = poolFilter;
      if (genderFilter) params.gender = genderFilter;
      if (coachFilter) params.coach = coachFilter;

      const res = await api.get('/swimmers/', { params });
      const allSwimmers = res.data.results || res.data || [];

      if (!allSwimmers.length) {
        toast.warning('با فیلترهای انتخابی فعلی، شناگری برای خروجی اکسل یافت نشد.');
        return;
      }

      const rows = allSwimmers.map((s) => {
        let genderLabel = 'تعیین‌نشده';
        if (s.gender === 'MALE') genderLabel = 'پسر / آقایان';
        else if (s.gender === 'FEMALE') genderLabel = 'دختر / بانوان';

        return {
          name: s.full_name || '',
          gender: genderLabel,
          birth_year: s.birth_year_jalali || '',
          dob: s.date_of_birth_jalali || (s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString('fa-IR') : ''),
          phone: s.phone || '',
          national_id: s.national_id || '',
          guardian_name: s.emergency_contact_name || s.father_name || '',
          guardian_phone: s.emergency_contact_phone || s.father_phone || '',
          pool: s.pool_location || 'استخر شهید رئیسی',
          coach: s.coach_name || 'بدون مربی',
          class_name: s.class_name || s.course_name || 'بدون کلاس',
          level: s.level_name || 'بدون سطح',
          status: s.is_active ? 'فعال' : 'غیرفعال / بایگانی',
          created_at: new Date(s.created_at).toLocaleDateString('fa-IR'),
        };
      });

      // Construct dynamic filename describing applied filters
      const filterTags = [];
      if (birthYearFilter) filterTags.push(`متولدین_${birthYearFilter}`);
      if (poolFilter) filterTags.push(poolFilter.replace(/\s+/g, '_'));
      if (genderFilter) filterTags.push(genderFilter === 'MALE' ? 'پسران' : 'دختران');
      if (coachFilter) {
        const cObj = filterOptions.coaches.find((c) => String(c.id) === String(coachFilter));
        if (cObj) filterTags.push(`مربی_${cObj.name.replace(/\s+/g, '_')}`);
      }

      const suffix = filterTags.length ? `_${filterTags.join('_')}` : '';
      const dateStr = new Date().toLocaleDateString('fa-IR').replace(/\//g, '-');
      const filename = `بانک_اطلاعات_شناگران${suffix}_${dateStr}`;

      exportToCsv(filename, rows, {
        name: 'نام و نام خانوادگی',
        gender: 'جنسیت',
        birth_year: 'سال تولد (شمسی)',
        dob: 'تاریخ تولد کامل',
        phone: 'شماره همراه شناگر',
        national_id: 'کد ملی',
        guardian_name: 'نام ولی / مخاطب اضطراری',
        guardian_phone: 'شماره تماس ولی',
        pool: 'استخر محل تمرین',
        coach: 'مربی',
        class_name: 'کلاس / دوره',
        level: 'سطح مهارت',
        status: 'وضعیت کاربری',
        created_at: 'تاریخ ثبت‌نام',
      });

      toast.success(`فایل اکسل با ${rows.length} شناگر با موفقیت دانلود گردید.`);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت خروجی اکسل شناگران');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-600" />
            بانک اطلاعات و مدیریت شناگران
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            مشاهده، ثبت‌نام، تخصیص کلاس و فیلتر پیشرفته بر اساس سال تولد، استخر، جنسیت و مربی
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Link to Dossiers Page */}
          <Link
            to="/admin/dossiers"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200/80 dark:border-amber-800 transition-colors whitespace-nowrap shadow-2xs"
          >
            <FolderCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>بررسی پرونده‌ها و مدارک</span>
            {pendingDocsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-mono text-[10px]">
                {pendingDocsCount}
              </span>
            )}
          </Link>

          <Button variant="outline" onClick={handleExportCsv} className="gap-1.5 text-xs whitespace-nowrap">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="whitespace-nowrap">خروجی اکسل / CSV</span>
          </Button>

          <Button onClick={() => setIsAddModalOpen(true)} className="gap-1.5 text-xs whitespace-nowrap">
            <UserPlus className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">ثبت شناگر جدید</span>
          </Button>
        </div>
      </div>

      {/* Advanced Filter and Search Section */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
        {/* Top Row: Search input and Status filter tabs */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جستجو با نام، شماره تماس یا کد ملی..."
                className="w-full pl-3 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
              />
            </div>
            <Button type="submit" variant="secondary" className="text-xs shrink-0 px-4 whitespace-nowrap h-10">
              جستجو
            </Button>
          </form>

          {/* Status Tabs (همه، فعال، بایگانی) */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/80 text-xs shrink-0 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => handleStatusFilterChange('ALL')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap text-xs shrink-0 ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              همه ({countsSummary.total || totalCount})
            </button>
            <button
              type="button"
              onClick={() => handleStatusFilterChange('ACTIVE')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap text-xs shrink-0 ${
                statusFilter === 'ACTIVE'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              فعال ({countsSummary.active || 0})
            </button>
            <button
              type="button"
              onClick={() => handleStatusFilterChange('INACTIVE')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap text-xs shrink-0 ${
                statusFilter === 'INACTIVE'
                  ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              بایگانی ({countsSummary.inactive || 0})
            </button>
          </div>

          {/* Mobile Filter Toggle Button */}
          <div className="sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="w-full flex items-center justify-between text-xs py-2"
            >
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>فیلترهای پیشرفته (سال تولد، استخر، جنسیت، مربی)</span>
              </span>
              {activeAdvancedFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px]">
                  {activeAdvancedFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* 4 Core Filters Grid (Desktop/Tablet always visible; Mobile toggleable) */}
        <div className={`pt-3 border-t border-slate-100 dark:border-slate-800 ${showMobileFilters ? 'block' : 'hidden sm:block'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Filter 1: سال تولد (Birth Year) */}
            <div>
              <CustomSelect
                label="۱. سال تولد"
                icon={Calendar}
                size="sm"
                value={birthYearFilter}
                onChange={handleBirthYearChange}
                placeholder="همه سال‌های تولد"
                clearable
                searchable
                menuClassName="w-full"
                options={[
                  { value: '', label: 'همه سال‌های تولد' },
                  ...filterOptions.birth_years.map((y) => ({
                    value: String(y),
                    label: `متولد سال ${y}`,
                    icon: Calendar,
                  })),
                ]}
              />
            </div>

            {/* Filter 2: استخر (Pool) */}
            <div>
              <CustomSelect
                label="۲. استخر و محل تمرین"
                icon={MapPin}
                size="sm"
                value={poolFilter}
                onChange={handlePoolChange}
                placeholder="همه استخرها"
                clearable
                searchable
                menuClassName="w-full"
                options={[
                  { value: '', label: 'همه استخرها' },
                  ...filterOptions.pools.map((p) => ({
                    value: p,
                    label: p,
                    icon: MapPin,
                  })),
                ]}
              />
            </div>

            {/* Filter 3: جنسیت (Gender) */}
            <div>
              <CustomSelect
                label="۳. جنسیت"
                icon={Users}
                size="sm"
                value={genderFilter}
                onChange={handleGenderChange}
                placeholder="همه جنسیت‌ها"
                clearable
                menuClassName="w-full"
                options={[
                  { value: '', label: 'همه جنسیت‌ها' },
                  ...filterOptions.genders.map((g) => ({
                    value: g.value,
                    label: g.label,
                    icon: Users,
                  })),
                ]}
              />
            </div>

            {/* Filter 4: مربی (Coach) */}
            <div>
              <CustomSelect
                label="۴. مربی"
                icon={Whistle}
                size="sm"
                value={coachFilter}
                onChange={handleCoachChange}
                placeholder="همه مربیان"
                clearable
                searchable
                menuClassName="w-full"
                options={[
                  { value: '', label: 'همه مربیان' },
                  ...filterOptions.coaches.map((c) => ({
                    value: String(c.id),
                    label: `کلاس مربی ${c.name}`,
                    icon: Whistle,
                  })),
                ]}
              />
            </div>
          </div>

          {/* Active Filter Badges & Reset Button */}
          {activeAdvancedFilterCount > 0 && (
            <div className="flex items-center justify-between flex-wrap gap-2 pt-3 mt-3 border-t border-dashed border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-slate-400 text-[11px] font-medium">فیلترهای اعمال‌شده:</span>

                {birthYearFilter && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs">
                    <span>سال: {birthYearFilter}</span>
                    <button type="button" onClick={() => handleBirthYearChange('')} className="hover:text-sky-900 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {poolFilter && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs">
                    <span>استخر: {poolFilter}</span>
                    <button type="button" onClick={() => handlePoolChange('')} className="hover:text-emerald-900 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {genderFilter && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs">
                    <span>{genderFilter === 'MALE' ? 'پسران' : 'دختران'}</span>
                    <button type="button" onClick={() => handleGenderChange('')} className="hover:text-indigo-900 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {coachFilter && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs">
                    <span>
                      مربی:{' '}
                      {filterOptions.coaches.find((c) => String(c.id) === String(coachFilter))?.name || coachFilter}
                    </span>
                    <button type="button" onClick={() => handleCoachChange('')} className="hover:text-teal-900 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleClearAllFilters}
                className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-medium cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>حذف تمام فیلترها</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <LoadingState type="table" rows={6} message="در حال بارگذاری لیست شناگران..." />
      ) : swimmers.length === 0 ? (
        <EmptyState
          title="شناگری با این مشخصات یافت نشد"
          description="با تغییر یا حذف فیلترهای جستجو (سال تولد، استخر، جنسیت و مربی)، پرونده‌ها در این بخش نمایش داده می‌شوند."
          actionText={activeAdvancedFilterCount > 0 ? 'پاک کردن فیلترها' : undefined}
          onAction={activeAdvancedFilterCount > 0 ? handleClearAllFilters : undefined}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors">
          {/* Active Results Summary & Quick Excel Button */}
          <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800 flex-wrap">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              نمایش <strong className="text-slate-800 dark:text-slate-200 font-mono">{swimmers.length}</strong> شناگر
              در این صفحه از مجموع <strong className="text-slate-800 dark:text-slate-200 font-mono">{totalCount}</strong> شناگر
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="text-xs gap-1.5 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>خروجی اکسل این لیست ({totalCount} شناگر)</span>
            </Button>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm text-right min-w-[850px]">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 rounded-r-xl whitespace-nowrap">شناگر</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">جنسیت</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">سال تولد</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">شماره تماس</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">استخر و دوره</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">کلاس و مربی</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">وضعیت</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">تاریخ ثبت</th>
                  <th className="px-4 py-3.5 text-center rounded-l-xl whitespace-nowrap">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {swimmers.map((swimmer) => {
                  return (
                    <tr key={swimmer.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      {/* Swimmer Name and Avatar */}
                      <td className="px-4 py-3.5 cursor-pointer whitespace-nowrap" onClick={() => handleOpenDossier(swimmer)}>
                        <div className="flex items-center gap-3 group">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs group-hover:scale-105 transition-transform overflow-hidden">
                            {swimmer.avatar ? (
                              <img src={swimmer.avatar} alt={swimmer.full_name} className="w-full h-full object-cover" />
                            ) : (
                              swimmer.first_name ? swimmer.first_name.charAt(0) : 'S'
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-100 block group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors whitespace-nowrap">
                              {swimmer.full_name}
                            </span>
                            {swimmer.emergency_contact_name && (
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap block mt-0.5">
                                ولی: {swimmer.emergency_contact_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Gender */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {swimmer.gender === 'FEMALE' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                            دختر / بانوان
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-800">
                            پسر / آقایان
                          </span>
                        )}
                      </td>

                      {/* Birth Year */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {swimmer.birth_year_jalali ? (
                          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                            {swimmer.birth_year_jalali}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {swimmer.phone}
                      </td>

                      {/* Pool Location */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[150px] font-medium">
                            {swimmer.pool_location || 'استخر شهید رئیسی'}
                          </span>
                        </div>
                      </td>

                      {/* Class and Coach Dropdown */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <ClassSelectorDropdown
                          currentClass={
                            swimmer.coach_id || swimmer.group_id || swimmer.class_name
                              ? {
                                  id: swimmer.group_id ? `g_${swimmer.group_id}` : `c_${swimmer.coach_id}`,
                                  group_id: swimmer.group_id,
                                  coach_id: swimmer.coach_id,
                                  name: swimmer.class_name || (swimmer.coach_name ? `کلاس ${swimmer.coach_name}` : 'کلاس فعلی'),
                                  coach_name: swimmer.coach_name,
                                  avatar: swimmer.coach_avatar,
                                }
                              : null
                          }
                          availableClasses={getSwimmerAvailableClasses(swimmer)}
                          onSelectClass={(selectedClass) => handleRequestChangeClass(swimmer, selectedClass)}
                          placement="auto"
                          size="sm"
                        />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <Badge variant={swimmer.is_active ? 'success' : 'neutral'} className="whitespace-nowrap">
                          {swimmer.is_active ? 'فعال' : 'غیرفعال'}
                        </Badge>
                      </td>

                      {/* Registration Date */}
                      <td className="px-4 py-3.5 text-xs font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(swimmer.created_at).toLocaleDateString('fa-IR')}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenDossier(swimmer)}
                            className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 font-semibold text-xs border border-sky-200/80 dark:border-sky-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
                            title="مشاهده پرونده کامل"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                            <span>پرونده</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/swimmers/${swimmer.id}/enroll`)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-semibold text-xs border border-emerald-200/80 dark:border-emerald-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
                            title="ثبت‌نام مستقیم در کلاس"
                          >
                            <PlusCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>ثبت‌نام</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tablet & Mobile Cards View */}
          <div className="lg:hidden space-y-3">
            {swimmers.map((swimmer) => {
              return (
                <div
                  key={swimmer.id}
                  className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3 text-xs"
                >
                  {/* Top Section: Avatar, Name, and Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs overflow-hidden">
                        {swimmer.avatar ? (
                          <img src={swimmer.avatar} alt={swimmer.full_name} className="w-full h-full object-cover" />
                        ) : (
                          swimmer.first_name ? swimmer.first_name.charAt(0) : 'S'
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-sm block">
                          {swimmer.full_name}
                        </span>
                        {swimmer.emergency_contact_name && (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5">
                            ولی: {swimmer.emergency_contact_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={swimmer.is_active ? 'success' : 'neutral'} className="whitespace-nowrap">
                        {swimmer.is_active ? 'فعال' : 'غیرفعال'}
                      </Badge>
                    </div>
                  </div>

                  {/* 4 Core Data Badges: سال تولد، استخر، جنسیت، مربی */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px]">سال تولد:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {swimmer.birth_year_jalali || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px]">جنسیت:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {swimmer.gender === 'FEMALE' ? 'دختر' : 'پسر'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px]">استخر:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">
                        {swimmer.pool_location || 'شهید رئیسی'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px]">مربی:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">
                        {swimmer.coach_name || 'بدون مربی'}
                      </span>
                    </div>
                  </div>

                  {/* Contact & Class Row */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 text-[10px]">شماره تماس: </span>
                      <a href={`tel:${swimmer.phone}`} className="font-mono text-sky-600 dark:text-sky-400 underline decoration-sky-300">
                        {swimmer.phone}
                      </a>
                    </div>
                    <div className="text-slate-400 text-[10px] font-mono">
                      ثبت: {new Date(swimmer.created_at).toLocaleDateString('fa-IR')}
                    </div>
                  </div>

                  {/* Bottom Action Row: Class Selector & Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                    <div className="w-full sm:w-auto">
                      <ClassSelectorDropdown
                        currentClass={
                          swimmer.coach_id || swimmer.group_id || swimmer.class_name
                            ? {
                                id: swimmer.group_id ? `g_${swimmer.group_id}` : `c_${swimmer.coach_id}`,
                                group_id: swimmer.group_id,
                                coach_id: swimmer.coach_id,
                                name: swimmer.class_name || (swimmer.coach_name ? `کلاس ${swimmer.coach_name}` : 'کلاس فعلی'),
                                coach_name: swimmer.coach_name,
                                avatar: swimmer.coach_avatar,
                              }
                            : null
                        }
                        availableClasses={getSwimmerAvailableClasses(swimmer)}
                        onSelectClass={(selectedClass) => handleRequestChangeClass(swimmer, selectedClass)}
                        placement="dropup"
                        size="sm"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => handleOpenDossier(swimmer)}
                        className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 font-semibold border border-sky-200/80 dark:border-sky-800 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span className="whitespace-nowrap">پرونده</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/swimmers/${swimmer.id}/enroll`)}
                        className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-semibold border border-emerald-200/80 dark:border-emerald-800 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs"
                      >
                        <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="whitespace-nowrap">ثبت‌نام</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
              showJumper={true}
              itemLabel="شناگر"
            />
          </div>
        </div>
      )}

      {/* Modal 1: Create Swimmer */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="تشکیل پرونده شناگر جدید"
      >
        <form onSubmit={handleCreateSwimmer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                نام *
              </label>
              <input
                type="text"
                required
                value={createForm.first_name}
                onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                نام خانوادگی *
              </label>
              <input
                type="text"
                required
                value={createForm.last_name}
                onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                جنسیت
              </label>
              <select
                value={createForm.gender}
                onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              >
                <option value="MALE">پسر / آقایان</option>
                <option value="FEMALE">دختر / بانوان</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                شماره همراه *
              </label>
              <input
                type="text"
                required
                placeholder="0912..."
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                کد ملی
              </label>
              <input
                type="text"
                placeholder="۱۰ رقمی"
                value={createForm.national_id}
                onChange={(e) => setCreateForm({ ...createForm, national_id: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <PersianDatePicker
                label="تاریخ تولد"
                value={createForm.date_of_birth}
                onChange={(jalaliStr, gDate, gIso) => {
                  setCreateForm({ ...createForm, date_of_birth: gIso || '' });
                }}
                placeholder="انتخاب تاریخ تولد..."
                minYear={1320}
                maxYear={1415}
                clearable
              />
            </div>
            <div>
              <CustomSelect
                label="سطح مهارت اولیه"
                icon={Award}
                value={createForm.current_level}
                onChange={(val) => setCreateForm({ ...createForm, current_level: val })}
                placeholder="بدون سطح / نیاز به تعیین سطح"
                clearable
                menuClassName="w-full"
                options={[
                  { value: '', label: 'بدون سطح / نیاز به تعیین سطح' },
                  ...levels.map((lvl) => ({
                    value: lvl.id,
                    label: `سطح ${lvl.order}: ${lvl.name}`,
                    icon: Award,
                  })),
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                نام ولی / مخاطب اضطراری
              </label>
              <input
                type="text"
                placeholder="نام والد یا همراه"
                value={createForm.emergency_contact_name}
                onChange={(e) => setCreateForm({ ...createForm, emergency_contact_name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                تلفن تماس اضطراری
              </label>
              <input
                type="text"
                placeholder="شماره تماس ضروری"
                value={createForm.emergency_contact_phone}
                onChange={(e) => setCreateForm({ ...createForm, emergency_contact_phone: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              ملاحظات پزشکی، حساسیت پوستی یا توصیه‌های ویژه
            </label>
            <textarea
              rows={2}
              placeholder="در صورت وجود آسم، حساسیت به کلر، ترس از آب یا هر نکته پزشکی..."
              value={createForm.medical_notes}
              onChange={(e) => setCreateForm({ ...createForm, medical_notes: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="w-full sm:w-auto">
              انصراف
            </Button>
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? 'در حال ثبت...' : 'ثبت قطعی پرونده'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Confirm Swimmer Class Change */}
      {pendingClassChange && (
        <Modal
          isOpen={Boolean(pendingClassChange)}
          onClose={() => setPendingClassChange(null)}
          title="تغییر و تخصیص کلاس شناگر"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              آیا از انتقال و تغییر کلاس شناگر «
              <strong className="text-slate-900 dark:text-white font-bold">
                {pendingClassChange.swimmer.full_name}
              </strong>
              » به کلاس زیر اطمینان دارید؟
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>کلاس قبلی:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {pendingClassChange.currentClass?.name || 'بدون کلاس'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sky-600 dark:text-sky-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="font-bold">کلاس جدید:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {pendingClassChange.newClass
                    ? pendingClassChange.newClass.name ||
                      (pendingClassChange.newClass.coach_name
                        ? `کلاس ${pendingClassChange.newClass.coach_name}`
                        : 'کلاس انتخابی')
                    : 'حذف تخصیص کلاس (بدون کلاس)'}
                </span>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPendingClassChange(null)}
                disabled={confirmingClassChange}
                className="w-full sm:w-auto"
              >
                انصراف
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmClassChange}
                disabled={confirmingClassChange}
                className="bg-sky-600 hover:bg-sky-700 text-white gap-1.5 w-full sm:w-auto"
              >
                {confirmingClassChange ? 'در حال ثبت...' : 'تأیید و اعمال تغییر'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
