import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, Search, Filter, Eye, BookOpen,
  CreditCard, Calendar, Award, Phone, CheckCircle2,
  XCircle, FileSpreadsheet, PlusCircle, Activity, GraduationCap, MapPin,
  AlertTriangle, ArrowLeft, ArrowDown, Loader2, Check, UserX, ShieldCheck, Clock
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
  const [levels, setLevels] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, INACTIVE
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Create Swimmer Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    national_id: '',
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

  const fetchSwimmers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedLevel) params.level = selectedLevel;

      const [swimmersRes, levelsRes, groupsRes] = await Promise.all([
        api.get('/swimmers/', { params }),
        api.get('/education/levels/'),
        api.get('/education/groups/'),
      ]);

      setSwimmers(swimmersRes.data.results || swimmersRes.data);
      setLevels(levelsRes.data.results || levelsRes.data);
      setGroups(groupsRes.data.results || groupsRes.data);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت لیست شناگران');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSwimmers();
  }, [selectedLevel]);

  // Handle Quick Action deep link
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsAddModalOpen(true);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('action');
        return next;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSwimmers();
  };

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
      toast.error('لطفاً نام، نام خانوادگی و شماره تلفن را وارد کنید.');
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
        date_of_birth: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        current_level: '',
        medical_notes: '',
      });
      fetchSwimmers();
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
      (selectedClass && (
        (selectedClass.group_id && swimmer.group_id && selectedClass.group_id === swimmer.group_id) ||
        (selectedClass.coach_id && swimmer.coach_id && selectedClass.coach_id === swimmer.coach_id && (!selectedClass.group_id || selectedClass.group_id === swimmer.group_id))
      ));

    if (isCurrentlyInClass) {
      toast.info('شناگر در حال حاضر در این کلاس حضور دارد.');
      return;
    }

    const currentClass = (swimmer.coach_id || swimmer.group_id || swimmer.class_name)
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
      setSwimmers((prev) =>
        prev.map((s) => (s.id === swimmer.id ? res.data : s))
      );

      const targetName = newClass
        ? (newClass.name || (newClass.coach_name ? `کلاس ${newClass.coach_name}` : 'کلاس انتخاب‌شده'))
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

  // Export to CSV
  const handleExportCsv = () => {
    const rows = swimmers.map((s) => ({
      name: s.full_name,
      phone: s.phone,
      level: s.level_name || 'بدون سطح',
      status: s.is_active ? 'فعال' : 'غیرفعال',
      date: new Date(s.created_at).toLocaleDateString('fa-IR'),
    }));
    exportToCsv('IranSwim_Swimmers_List', rows, {
      name: 'نام و نام خانوادگی',
      phone: 'شماره همراه',
      level: 'سطح مهارت',
      status: 'وضعیت',
      date: 'تاریخ ثبت',
    });
  };

  const pendingDocsCount = swimmers.filter(
    (s) =>
      s.birth_certificate_status === 'PENDING' ||
      s.national_card_status === 'PENDING' ||
      s.sports_insurance_status === 'PENDING' ||
      (!s.is_profile_completed && (s.birth_certificate_image || s.national_card_image || s.sports_insurance_image))
  ).length;

  // Filtered Swimmers List
  const filteredSwimmers = swimmers.filter((s) => {
    if (statusFilter === 'ACTIVE') return s.is_active;
    if (statusFilter === 'INACTIVE') return !s.is_active;
    if (statusFilter === 'DOCS_PENDING') {
      return (
        s.birth_certificate_status === 'PENDING' ||
        s.national_card_status === 'PENDING' ||
        s.sports_insurance_status === 'PENDING' ||
        (!s.is_profile_completed && (s.birth_certificate_image || s.national_card_image || s.sports_insurance_image))
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredSwimmers.length / pageSize) || 1;
  const paginatedSwimmers = filteredSwimmers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatPrice = (v) => Number(v || 0).toLocaleString('fa-IR');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            مرکز مدیریت شناگران و پرونده‌های آموزشی
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            دسترسی به پرونده کامل سلامت و رشد، ثبت‌نام در گروه‌ها، سوابق کلاسی و امور مالی هر شناگر
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={handleExportCsv} className="gap-1.5 text-xs">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>خروجی اکسل / CSV</span>
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-1.5 text-xs">
            <UserPlus className="w-4 h-4" />
            <span>ثبت شناگر جدید</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 transition-colors relative z-20">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو با نام، نام خانوادگی، شماره تماس یا کد ملی..."
              className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
            />
          </div>
          <Button type="submit" variant="secondary" className="text-xs shrink-0 px-4">
            جستجو
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Level Filter */}
          <div className="w-full sm:w-52 shrink-0">
            <CustomSelect
              value={selectedLevel}
              onChange={(val) => setSelectedLevel(val)}
              placeholder="همه سطوح مهارت"
              icon={Award}
              size="sm"
              clearable
              options={[
                { value: '', label: 'همه سطوح مهارت' },
                ...levels.map((lvl) => ({
                  value: lvl.id,
                  label: `سطح ${lvl.order}: ${lvl.name}`,
                  icon: Award,
                })),
              ]}
            />
          </div>

          {/* Status Tab buttons */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              همه ({swimmers.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('DOCS_PENDING')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center gap-1.5 ${
                statusFilter === 'DOCS_PENDING'
                  ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>بررسی مدارک ({pendingDocsCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'ACTIVE'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              فعال
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'INACTIVE'
                  ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              بایگانی
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <LoadingState type="table" rows={6} message="در حال بارگذاری لیست شناگران..." />
      ) : paginatedSwimmers.length === 0 ? (
        <EmptyState
          title="شناگری یافت نشد"
          description="با تغییر فیلترهای جستجو یا ثبت شناگر جدید، پرونده‌ها در این بخش نمایش داده می‌شوند."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-right min-w-[650px]">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 rounded-r-xl">شناگر</th>
                  <th className="px-4 py-3.5">شماره تماس</th>
                  <th className="px-4 py-3.5">سطح مهارت فعلی</th>
                  <th className="px-4 py-3.5">کلاس</th>
                  <th className="px-4 py-3.5">وضعیت کاربری</th>
                  <th className="px-4 py-3.5">وضعیت مدارک (گام ۳)</th>
                  <th className="px-4 py-3.5">تاریخ ثبت</th>
                  <th className="px-4 py-3.5 text-center rounded-l-xl">عملیات پرونده</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {paginatedSwimmers.map((swimmer) => {
                  const isDocsApproved =
                    swimmer.birth_certificate_status === 'APPROVED' &&
                    swimmer.national_card_status === 'APPROVED' &&
                    swimmer.sports_insurance_status === 'APPROVED';

                  const isDocsRejected =
                    swimmer.birth_certificate_status === 'REVISION_REQUIRED' ||
                    swimmer.national_card_status === 'REVISION_REQUIRED' ||
                    swimmer.sports_insurance_status === 'REVISION_REQUIRED';

                  const hasAnyDocUploaded =
                    Boolean(swimmer.birth_certificate_image || swimmer.national_card_image || swimmer.sports_insurance_image);

                  return (
                    <tr key={swimmer.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3.5 cursor-pointer" onClick={() => handleOpenDossier(swimmer)}>
                        <div className="flex items-center gap-3 group">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs group-hover:scale-105 transition-transform overflow-hidden">
                            {swimmer.avatar ? (
                              <img src={swimmer.avatar} alt={swimmer.full_name} className="w-full h-full object-cover" />
                            ) : (
                              swimmer.first_name ? swimmer.first_name.charAt(0) : 'S'
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-100 block group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                              {swimmer.full_name}
                            </span>
                            {swimmer.emergency_contact_name && (
                              <span className="text-[11px] text-slate-400">
                                ولی/رابط: {swimmer.emergency_contact_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {swimmer.phone}
                      </td>
                      <td className="px-4 py-3.5">
                        {swimmer.level_name ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800">
                            <Award className="w-3.5 h-3.5 text-sky-500" />
                            {swimmer.level_name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">تعیین سطح نشده</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <ClassSelectorDropdown
                          currentClass={
                            (swimmer.coach_id || swimmer.group_id || swimmer.class_name)
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
                      <td className="px-4 py-3.5">
                        <Badge variant={swimmer.is_active ? 'success' : 'neutral'}>
                          {swimmer.is_active ? 'فعال' : 'غیرفعال'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        {isDocsApproved ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            تأییدشده
                          </span>
                        ) : isDocsRejected ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800">
                            <XCircle className="w-3.5 h-3.5" />
                            رد شده / نقص
                          </span>
                        ) : hasAnyDocUploaded ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3.5 h-3.5" />
                            در انتظار بررسی
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            ارسال‌نشده
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono text-slate-500 dark:text-slate-400">
                        {new Date(swimmer.created_at).toLocaleDateString('fa-IR')}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenDossier(swimmer)}
                            className="px-2.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 font-semibold text-xs border border-sky-200 dark:border-sky-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="مشاهده پرونده جامع و بررسی مدارک"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                            <span>پرونده و مدارک</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/swimmers/${swimmer.id}/enroll`)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-semibold text-xs border border-emerald-200 dark:border-emerald-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="ثبت‌نام مستقیم در کلاس"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
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

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {paginatedSwimmers.map((swimmer) => (
              <div
                key={swimmer.id}
                className="p-4 rounded-3xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3 text-xs"
              >
                {/* Top Section: Swimmer Avatar Top-Right */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs overflow-hidden">
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
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          ولی/رابط: {swimmer.emergency_contact_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant={swimmer.is_active ? 'success' : 'neutral'}>
                    {swimmer.is_active ? 'فعال' : 'غیرفعال'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[10px]">سطح مهارت</span>
                    {swimmer.level_name ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-sky-700 dark:text-sky-300 mt-0.5">
                        <Award className="w-3 h-3 text-sky-500" />
                        {swimmer.level_name}
                      </span>
                    ) : (
                      <span className="text-slate-400">تعیین سطح نشده</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">تماس</span>
                    <a href={`tel:${swimmer.phone}`} className="font-mono text-sky-600 dark:text-sky-400 underline decoration-sky-300">
                      {swimmer.phone}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">دوره فعلی</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 truncate block">
                      {swimmer.course_name || 'بدون دوره'}
                    </span>
                  </div>
                </div>

                {/* Bottom Left Class Avatar / Selector */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center">
                    <ClassSelectorDropdown
                      currentClass={
                        (swimmer.coach_id || swimmer.group_id || swimmer.class_name)
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

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenDossier(swimmer)}
                      className="px-2.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 font-semibold border border-sky-200 dark:border-sky-800 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>پرونده</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/swimmers/${swimmer.id}/enroll`)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-semibold border border-emerald-200 dark:border-emerald-800 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>ثبت‌نام</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              نمایش {paginatedSwimmers.length} از {filteredSwimmers.length} شناگر
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* 1. Modal: Create Swimmer */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'در حال ثبت...' : 'ثبت قطعی پرونده'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Modal: Confirm Swimmer Class Change */}
      <Modal
        isOpen={!!pendingClassChange}
        onClose={() => !confirmingClassChange && setPendingClassChange(null)}
        title={
          pendingClassChange?.newClass === null
            ? 'تأیید حذف شناگر از کلاس'
            : pendingClassChange?.currentClass
            ? 'تأیید تغییر کلاس شناگر'
            : 'تأیید انتساب شناگر به کلاس'
        }
        maxWidth="max-w-lg"
      >
        {pendingClassChange && (
          <div className="space-y-4">
            {pendingClassChange.newClass === null ? (
              // Case: Unassign / Remove from class
              <div className="flex items-start gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    آیا از حذف این شناگر از کلاس مطمئن هستید؟
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    با تأیید، شناگر از لیست این کلاس و برنامه کلاسی خارج خواهد شد و وضعیت آن به «بدون کلاس» تغییر می‌یابد.
                  </p>
                </div>
              </div>
            ) : (
              // Case: Add or Change class
              <div className="flex items-start gap-3 p-3.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/60 flex items-center justify-center shrink-0 text-sky-600 dark:text-sky-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    {pendingClassChange.currentClass
                      ? 'آیا از انتقال این شناگر به کلاس جدید مطمئن هستید؟'
                      : 'آیا از افزودن این شناگر به کلاس مطمئن هستید؟'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    با تأیید شما، این شناگر در کلاس انتخاب‌شده ثبت خواهد شد و امور آموزشی و حضور و غیاب دوره همگام‌سازی می‌گردد.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 space-y-3 overflow-hidden">
              {/* Swimmer Info */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-xs text-slate-400">شناگر:</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0">
                    {pendingClassChange.swimmer.avatar ? (
                      <img src={pendingClassChange.swimmer.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      pendingClassChange.swimmer.first_name ? pendingClassChange.swimmer.first_name.charAt(0) : 'S'
                    )}
                  </div>
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                    {pendingClassChange.swimmer.full_name}
                  </span>
                </div>
              </div>

              {/* Class Transition */}
              {pendingClassChange.newClass === null ? (
                // Case: Removal
                <div className="space-y-2 pt-1">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0">کلاس فعلی:</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {pendingClassChange.currentClass?.name || 'بدون کلاس'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 flex items-center justify-between gap-2 text-rose-700 dark:text-rose-300">
                    <span className="text-xs font-semibold shrink-0">وضعیت جدید:</span>
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <UserX className="w-3.5 h-3.5 text-rose-600" />
                      بدون کلاس (لغو انتساب)
                    </span>
                  </div>
                </div>
              ) : (
                // Case: Add / Transfer
                <div className="space-y-2 pt-1">
                  {/* Current Class */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0">کلاس فعلی:</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 text-left truncate">
                      {pendingClassChange.currentClass?.name || 'بدون کلاس'}
                    </span>
                  </div>

                  {/* Down Transition Arrow */}
                  <div className="flex items-center justify-center -my-1">
                    <div className="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-900/60 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-300 shadow-2xs">
                      <ArrowDown className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* New Class Target */}
                  <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200/90 dark:border-sky-800/90 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-bold text-sky-700 dark:text-sky-300">کلاس جدید:</span>
                    </div>
                    <div className="text-left min-w-0">
                      <span className="text-xs font-bold text-sky-900 dark:text-sky-100 block truncate">
                        {pendingClassChange.newClass.name || `کلاس ${pendingClassChange.newClass.coach_name}`}
                      </span>
                      {pendingClassChange.newClass.course_name && (
                        <span className="text-[10px] text-sky-600 dark:text-sky-400 block mt-0.5 truncate">
                          دوره: {pendingClassChange.newClass.course_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                disabled={confirmingClassChange}
                onClick={() => setPendingClassChange(null)}
                className="text-xs"
              >
                انصراف
              </Button>
              <Button
                type="button"
                disabled={confirmingClassChange}
                onClick={handleConfirmClassChange}
                className={`text-xs gap-1.5 ${
                  pendingClassChange.newClass === null
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : ''
                }`}
              >
                {confirmingClassChange ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>در حال ثبت...</span>
                  </>
                ) : pendingClassChange.newClass === null ? (
                  <>
                    <UserX className="w-3.5 h-3.5" />
                    <span>تأیید و حذف از کلاس</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>تأیید و ثبت در کلاس</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
