import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, UserCheck, Search, Filter, BookOpen,
  MapPin, Clock, LayoutGrid, List, Award, Eye,
  GraduationCap, CheckCircle2, AlertTriangle, ArrowUpDown, PlusCircle,
  ArrowRight, ArrowLeftRight, X, Layers, RefreshCw, Loader2, Check
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { CoachSelectorDropdown } from '../../components/common/CoachSelectorDropdown';
import { SwimmerCourseCard } from '../../components/common/SwimmerCourseCard';
import { CustomSelect } from '../../components/common/CustomSelect';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

export const AdminEnrollmentsPage = () => {
  const [activeTab, setActiveTab] = useState('ENROLLMENTS'); // 'ENROLLMENTS' | 'REQUESTS'

  // Tab 1: Enrollments State
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [groups, setGroups] = useState([]);
  const [levels, setLevels] = useState([]);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);

  // Filters State
  const [searchSwimmer, setSearchSwimmer] = useState('');
  const [genderFilter, setGenderFilter] = useState(''); // '' | 'MALE' | 'FEMALE'
  const [coachFilter, setCoachFilter] = useState(''); // '' | 'UNASSIGNED' | coach_id
  const [selectedCourse, setSelectedCourse] = useState(''); // '' | course_id
  const [levelFilter, setLevelFilter] = useState(''); // '' | level_id
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState(''); // '' | 'ACTIVE' | 'PENDING_PAYMENT' | 'COMPLETED'
  const [poolFilter, setPoolFilter] = useState(''); // '' | pool_name

  // Change Class / Course Modal State
  const [changeClassTarget, setChangeClassTarget] = useState(null);
  const [targetCourseId, setTargetCourseId] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [targetCoachId, setTargetCoachId] = useState('');
  const [resetSessions, setResetSessions] = useState(false);
  const [submittingChangeClass, setSubmittingChangeClass] = useState(false);

  // Tab 2: Requests State
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReq, setSelectedReq] = useState(null);
  const [reviewInstallments, setReviewInstallments] = useState(1);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const toast = useToast();
  const navigate = useNavigate();

  // Fetch Enrollments, Courses, Coaches, Groups & Levels
  const fetchEnrollmentsData = async () => {
    try {
      setLoadingEnrollments(true);

      const [enrRes, coursesRes, coachesRes, groupsRes, levelsRes] = await Promise.all([
        api.get('/education/enrollments/'),
        api.get('/education/courses/'),
        api.get('/coaches/').catch(() => ({ data: [] })),
        api.get('/education/groups/').catch(() => ({ data: [] })),
        api.get('/education/levels/').catch(() => ({ data: [] })),
      ]);

      setEnrollments(enrRes.data.results || enrRes.data || []);
      setCourses(coursesRes.data.results || coursesRes.data || []);
      setCoaches(coachesRes.data.results || coachesRes.data || []);
      setGroups(groupsRes.data.results || groupsRes.data || []);
      setLevels(levelsRes.data.results || levelsRes.data || []);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت لیست ثبت‌نام‌ها');
    } finally {
      setLoadingEnrollments(false);
    }
  };

  // Fetch Online Requests
  const fetchRequestsData = async () => {
    try {
      setLoadingRequests(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/education/requests/', { params });
      setRequests(res.data.results || res.data || []);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت درخواست‌های ثبت‌نام');
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ENROLLMENTS') {
      fetchEnrollmentsData();
    } else {
      fetchRequestsData();
    }
  }, [activeTab, statusFilter]);

  // Coach Assignment Handler
  const handleAssignCoach = async (enrollmentId, coachId) => {
    try {
      const res = await api.post(`/education/enrollments/${enrollmentId}/assign-coach/`, {
        coach_id: coachId,
      });

      // Update state locally
      setEnrollments((prev) =>
        prev.map((e) => (e.id === enrollmentId ? res.data : e))
      );

      const coachName = res.data.coach_name;
      toast.success(
        coachId && coachName
          ? `شناگر با موفقیت به مربی ${coachName} تخصیص یافت.`
          : 'تخصیص مربی با موفقیت حذف گردید.'
      );
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در تخصیص مربی به شناگر');
    }
  };

  // Open Change Class / Course Modal
  const openChangeClassModal = (enr) => {
    setChangeClassTarget(enr);
    setTargetCourseId(enr.course ? String(enr.course) : '');
    setTargetGroupId(enr.group ? String(enr.group) : '');
    setTargetCoachId(enr.coach ? String(enr.coach) : '');
    setResetSessions(false);
  };

  // Groups for selected target course in Modal
  const modalAvailableGroups = useMemo(() => {
    if (!targetCourseId) return [];
    return groups.filter((g) => String(g.course) === String(targetCourseId));
  }, [groups, targetCourseId]);

  // Coaches for selected target course in Modal
  const modalAvailableCoaches = useMemo(() => {
    if (!targetCourseId) return coaches;
    const selectedCourseObj = courses.find((c) => String(c.id) === String(targetCourseId));
    if (selectedCourseObj?.coaches && selectedCourseObj.coaches.length > 0) {
      const courseCoachIds = new Set(selectedCourseObj.coaches.map((c) => (typeof c === 'object' ? c.id : c)));
      return coaches.filter((c) => courseCoachIds.has(c.id));
    }
    return coaches;
  }, [courses, coaches, targetCourseId]);

  // Handle Course Change inside Modal
  const handleTargetCourseChange = (courseId) => {
    setTargetCourseId(courseId);
    // Reset group & coach when course changes
    setTargetGroupId('');
    const courseObj = courses.find((c) => String(c.id) === String(courseId));
    if (courseObj?.coaches && courseObj.coaches.length > 0) {
      const firstCoach = courseObj.coaches[0];
      setTargetCoachId(String(typeof firstCoach === 'object' ? firstCoach.id : firstCoach));
    } else {
      setTargetCoachId('');
    }
  };

  // Handle Group Change inside Modal
  const handleTargetGroupChange = (groupId) => {
    setTargetGroupId(groupId);
    if (groupId) {
      const grp = groups.find((g) => String(g.id) === String(groupId));
      const primaryCoach = grp?.coach_assignments?.find((ca) => ca.is_primary)?.coach || grp?.coach_assignments?.[0]?.coach;
      if (primaryCoach) {
        setTargetCoachId(String(primaryCoach));
      }
    }
  };

  // Confirm Change Class / Course Submission
  const handleConfirmChangeClass = async () => {
    if (!changeClassTarget) return;
    if (!targetCourseId) {
      toast.error('لطفاً دوره آموزشی را انتخاب نمایید.');
      return;
    }

    try {
      setSubmittingChangeClass(true);
      const payload = {
        course_id: Number(targetCourseId),
        group_id: targetGroupId ? Number(targetGroupId) : null,
        coach_id: targetCoachId ? Number(targetCoachId) : null,
        reset_sessions: resetSessions,
      };

      const res = await api.post(`/education/enrollments/${changeClassTarget.id}/assign-coach/`, payload);

      setEnrollments((prev) =>
        prev.map((e) => (e.id === changeClassTarget.id ? res.data : e))
      );

      const targetCourseObj = courses.find((c) => String(c.id) === String(targetCourseId));
      toast.success(`دوره و کلاس شناگر با موفقیت به «${targetCourseObj?.name || 'دوره جدید'}» تغییر یافت.`);
      setChangeClassTarget(null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در تغییر کلاس و دوره شناگر');
    } finally {
      setSubmittingChangeClass(false);
    }
  };

  // Review Online Request Handler
  const handleReview = async (action) => {
    if (!selectedReq) return;
    try {
      setSubmitting(true);
      await api.post(`/education/requests/${selectedReq.id}/review/`, {
        action,
        rejection_reason: rejectionReason,
        selected_installments: Number(reviewInstallments) || 1,
      });
      setSelectedReq(null);
      setRejectionReason('');
      toast.success(
        action === 'APPROVE'
          ? 'درخواست ثبت‌نام با موفقیت تأیید شد و اقساط فاکتور صادر گردید.'
          : 'درخواست متقاضی رد شد.'
      );
      fetchRequestsData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در ثبت تصمیم بررسی');
    } finally {
      setSubmitting(false);
    }
  };

  // Dynamic Pools List
  const poolsList = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => c.pool_location && set.add(c.pool_location));
    enrollments.forEach((e) => e.course_pool && set.add(e.course_pool));
    return Array.from(set);
  }, [courses, enrollments]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchSwimmer.trim()) count++;
    if (genderFilter) count++;
    if (coachFilter) count++;
    if (selectedCourse) count++;
    if (levelFilter) count++;
    if (enrollmentStatusFilter) count++;
    if (poolFilter) count++;
    return count;
  }, [searchSwimmer, genderFilter, coachFilter, selectedCourse, levelFilter, enrollmentStatusFilter, poolFilter]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchSwimmer('');
    setGenderFilter('');
    setCoachFilter('');
    setSelectedCourse('');
    setLevelFilter('');
    setEnrollmentStatusFilter('');
    setPoolFilter('');
    setCurrentPage(1);
  };

  // Comprehensive Filtered Enrollments
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((e) => {
      // 1. Text Search (Name, Phone, National ID)
      if (searchSwimmer.trim()) {
        const query = searchSwimmer.trim().toLowerCase();
        const name = (e.swimmer_name || '').toLowerCase();
        const phone = (e.swimmer_phone || '').toLowerCase();
        const nationalId = (e.swimmer_national_id || '').toLowerCase();
        if (!name.includes(query) && !phone.includes(query) && !nationalId.includes(query)) {
          return false;
        }
      }

      // 2. Gender Filter (پسران / دختران)
      if (genderFilter) {
        const swGender = e.swimmer_gender || '';
        const crsGender = e.course_gender || '';
        if (swGender !== genderFilter && crsGender !== genderFilter) {
          return false;
        }
      }

      // 3. Coach Filter
      if (coachFilter) {
        if (coachFilter === 'UNASSIGNED') {
          if (e.coach) return false;
        } else {
          if (String(e.coach) !== String(coachFilter)) return false;
        }
      }

      // 4. Course Filter
      if (selectedCourse) {
        if (String(e.course) !== String(selectedCourse)) return false;
      }

      // 5. Level Filter
      if (levelFilter) {
        if (String(e.swimmer_level_id) !== String(levelFilter)) return false;
      }

      // 6. Status Filter
      if (enrollmentStatusFilter) {
        if (e.status !== enrollmentStatusFilter) return false;
      }

      // 7. Pool Location Filter
      if (poolFilter) {
        if ((e.course_pool || '') !== poolFilter) return false;
      }

      return true;
    });
  }, [enrollments, searchSwimmer, genderFilter, coachFilter, selectedCourse, levelFilter, enrollmentStatusFilter, poolFilter]);

  const totalPages = Math.ceil(
    (activeTab === 'ENROLLMENTS' ? filteredEnrollments.length : requests.length) / pageSize
  ) || 1;

  const paginatedEnrollments = filteredEnrollments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const paginatedRequests = requests.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const statusBadges = {
    PENDING: { label: 'در انتظار بررسی', variant: 'warning' },
    APPROVED: { label: 'تأییدشده و فعال', variant: 'success' },
    REJECTED: { label: 'رد شده', variant: 'danger' },
    WAITLIST: { label: 'فهرست انتظار', variant: 'neutral' },
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner with Back Button */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3.5">
          {/* Back Button */}
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="gap-1.5 text-xs font-bold cursor-pointer shrink-0 shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-800"
            title="بازگشت به صفحه قبل"
          >
            <ArrowRight className="w-4 h-4 text-slate-500" />
            <span>بازگشت</span>
          </Button>

          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-600" />
              مرکز ثبت‌نام دوره‌ها و تخصیص شناگران به مربیان
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              مشاهده ثبت‌نام‌های هر دوره، انتخاب مربی کلاس برای هر شناگر و بررسی درخواست‌های آنلاین
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <Button
            onClick={() => navigate('/admin/enrollments/new')}
            className="gap-1.5 text-xs font-bold shadow-2xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ثبت‌نام مستقیم جدید</span>
          </Button>

          {/* Tab Buttons */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('ENROLLMENTS')}
              className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'ENROLLMENTS'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">ثبت‌نام‌های دوره‌ها ({enrollments.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('REQUESTS')}
              className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'REQUESTS'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">
                درخواست‌های آنلاین ({requests.filter((r) => r.status === 'PENDING').length})
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. TAB 1: ENROLLMENTS & COACH ASSIGNMENT */}
      {activeTab === 'ENROLLMENTS' ? (
        <div className="space-y-4">
          {/* Controls: Comprehensive Filters Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
            {/* Row 1: Search & View Switcher */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchSwimmer}
                  onChange={(e) => {
                    setSearchSwimmer(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="جستجو با نام شناگر، شماره تماس یا کد ملی..."
                  className="w-full pl-8 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                />
                {searchSwimmer && (
                  <button
                    type="button"
                    onClick={() => setSearchSwimmer('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* View Switcher: Cards vs Table */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    viewMode === 'cards'
                      ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="نمای کارتی"
                >
                  <LayoutGrid className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">کارت‌ها</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="نمای جدولی"
                >
                  <List className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">جدول</span>
                </button>
              </div>
            </div>

            {/* Row 2: Comprehensive Categorized Dropdown Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1 border-t border-slate-100 dark:border-slate-800">
              {/* 1. Gender Filter (دختر / پسر) */}
              <div>
                <CustomSelect
                  value={genderFilter}
                  onChange={(val) => {
                    setGenderFilter(val);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: '', label: 'همه جنسیت‌ها (دختر/پسر)' },
                    { value: 'MALE', label: 'پسران / آقایان' },
                    { value: 'FEMALE', label: 'دختران / بانوان' },
                  ]}
                  placeholder="جنسیت..."
                  size="sm"
                />
              </div>

              {/* 2. Coach Filter (بر اساس مربی) */}
              <div>
                <CustomSelect
                  value={coachFilter}
                  onChange={(val) => {
                    setCoachFilter(val);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: '', label: 'همه مربیان' },
                    { value: 'UNASSIGNED', label: 'بدون مربی (تخصیص‌نیافته)' },
                    ...coaches.map((c) => ({
                      value: String(c.id),
                      label: `مربی ${c.full_name}`,
                    })),
                  ]}
                  placeholder="فیلتر مربی..."
                  size="sm"
                  searchable={coaches.length > 5}
                />
              </div>

              {/* 3. Course Filter (بر اساس دوره) */}
              <div>
                <CustomSelect
                  value={selectedCourse}
                  onChange={(val) => {
                    setSelectedCourse(val);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: '', label: 'همه دوره‌های آموزشی' },
                    ...courses.map((c) => ({
                      value: String(c.id),
                      label: c.name,
                    })),
                  ]}
                  placeholder="فیلتر دوره..."
                  size="sm"
                  searchable={courses.length > 5}
                />
              </div>

              {/* 4. Skill Level Filter (سطح مهارت) */}
              <div>
                <CustomSelect
                  value={levelFilter}
                  onChange={(val) => {
                    setLevelFilter(val);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: '', label: 'همه سطوح مهارت' },
                    ...levels.map((l) => ({
                      value: String(l.id),
                      label: l.name,
                    })),
                  ]}
                  placeholder="سطح شناگر..."
                  size="sm"
                />
              </div>

              {/* 5. Pool Filter (استخر) */}
              <div>
                <CustomSelect
                  value={poolFilter}
                  onChange={(val) => {
                    setPoolFilter(val);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: '', label: 'همه استخرها' },
                    ...poolsList.map((p) => ({ value: p, label: p })),
                  ]}
                  placeholder="محل استخر..."
                  size="sm"
                />
              </div>

              {/* 6. Status Filter */}
              <div>
                <CustomSelect
                  value={enrollmentStatusFilter}
                  onChange={(val) => {
                    setEnrollmentStatusFilter(val);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: '', label: 'همه وضعیت‌های ثبت‌نام' },
                    { value: 'ACTIVE', label: 'ثبت‌نام قطعی (فعال)' },
                    { value: 'PENDING_PAYMENT', label: 'در انتظار پرداخت' },
                    { value: 'COMPLETED', label: 'تکمیل‌شده/پایان‌یافته' },
                    { value: 'CANCELLED', label: 'لغوشده' },
                  ]}
                  placeholder="وضعیت..."
                  size="sm"
                />
              </div>
            </div>

            {/* Row 3: Active Filters Summary & Reset */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  {activeFiltersCount} فیلتر فعال است • یافت‌شده:{' '}
                  <span className="font-bold text-sky-700 dark:text-sky-300">
                    {filteredEnrollments.length}
                  </span>{' '}
                  از {enrollments.length} شناگر
                </span>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 font-bold text-xs transition-colors cursor-pointer border border-rose-200 dark:border-rose-800"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>پاک‌کردن فیلترها</span>
                </button>
              </div>
            )}
          </div>

          {/* Content Area */}
          {loadingEnrollments ? (
            <LoadingState
              type={viewMode === 'cards' ? 'cards' : 'table'}
              count={6}
              message="در حال بارگذاری ثبت‌نام‌های دوره‌ها..."
            />
          ) : paginatedEnrollments.length === 0 ? (
            <EmptyState
              title="هیچ ثبت‌نامی با فیلترهای انتخابی یافت نشد"
              description="می‌توانید فیلترهای جستجو، جنسیت، مربی یا دوره را تغییر داده یا پاک کنید."
              action={
                activeFiltersCount > 0 ? (
                  <Button variant="outline" onClick={handleClearFilters} className="text-xs">
                    پاک‌کردن تمام فیلترها
                  </Button>
                ) : null
              }
            />
          ) : viewMode === 'cards' ? (
            /* CARDS VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {paginatedEnrollments.map((enr) => (
                <SwimmerCourseCard
                  key={enr.id}
                  swimmer={{
                    full_name: enr.swimmer_name,
                    avatar: enr.swimmer_avatar,
                    phone: enr.swimmer_phone,
                    national_id: enr.swimmer_national_id,
                    level_name: enr.swimmer_level_name,
                    gender: enr.swimmer_gender,
                  }}
                  course={{
                    name: enr.course_name,
                    pool_location: enr.course_pool,
                    days_of_week: enr.course_days,
                    time_display: enr.course_time,
                  }}
                  coach={
                    enr.coach
                      ? {
                          id: enr.coach,
                          full_name: enr.coach_name,
                          avatar: enr.coach_avatar,
                        }
                      : null
                  }
                  availableCoaches={enr.course_coaches || []}
                  allCoaches={coaches}
                  onSelectCoach={(coachId) => handleAssignCoach(enr.id, coachId)}
                  onChangeClass={() => openChangeClassModal(enr)}
                  onOpenDossier={() => navigate(`/admin/swimmers/${enr.swimmer}`)}
                  status={enr.status}
                  sessionsPurchased={enr.sessions_purchased}
                  sessionsAttended={enr.sessions_attended}
                />
              ))}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right min-w-[780px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5 rounded-r-xl">شناگر</th>
                      <th className="px-4 py-3.5">دوره آموزشی و استخر</th>
                      <th className="px-4 py-3.5">برنامه و ساعت</th>
                      <th className="px-4 py-3.5">مربی و کلاس تخصیص‌یافته</th>
                      <th className="px-4 py-3.5">مصرف جلسات</th>
                      <th className="px-4 py-3.5">وضعیت</th>
                      <th className="px-4 py-3.5 text-center rounded-l-xl">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {paginatedEnrollments.map((enr) => (
                      <tr key={enr.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                        {/* Swimmer Info & Gender Badge */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            {enr.swimmer_avatar ? (
                              <img
                                src={enr.swimmer_avatar}
                                alt={enr.swimmer_name}
                                className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                {enr.swimmer_name ? enr.swimmer_name.charAt(0) : 'ش'}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 dark:text-white block text-xs">
                                  {enr.swimmer_name}
                                </span>
                                {enr.swimmer_gender === 'MALE' && (
                                  <span className="px-1.5 py-0.2 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold border border-blue-200/60">
                                    پسر
                                  </span>
                                )}
                                {enr.swimmer_gender === 'FEMALE' && (
                                  <span className="px-1.5 py-0.2 rounded-md bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 text-[10px] font-bold border border-pink-200/60">
                                    دختر
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {enr.swimmer_phone}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Course & Pool with Quick Change Button */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-between gap-2 max-w-[220px]">
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs truncate">
                                {enr.course_name}
                              </span>
                              <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{enr.course_pool || 'استخر شهید رئیسی'}</span>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => openChangeClassModal(enr)}
                              className="p-1 rounded-lg text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/60 transition-colors shrink-0"
                              title="تغییر کلاس و دوره"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Schedule */}
                        <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                          <span className="block">{enr.course_days || 'سه‌شنبه و پنج‌شنبه'}</span>
                          <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                            {enr.course_time || '۱۷:۰۰ الی ۱۹:۰۰'}
                          </span>
                        </td>

                        {/* Coach & Class Column with CoachSelectorDropdown */}
                        <td className="px-4 py-3.5">
                          <CoachSelectorDropdown
                            currentCoach={
                              enr.coach
                                ? {
                                    id: enr.coach,
                                    full_name: enr.coach_name,
                                    avatar: enr.coach_avatar,
                                  }
                                : null
                            }
                            availableCoaches={enr.course_coaches || []}
                            allCoaches={coaches}
                            onSelectCoach={(coachId) => handleAssignCoach(enr.id, coachId)}
                            placement="auto"
                            size="md"
                          />
                        </td>

                        {/* Sessions */}
                        <td className="px-4 py-3.5 text-xs font-mono text-slate-600 dark:text-slate-300">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {enr.sessions_attended}
                          </span>{' '}
                          از {enr.sessions_purchased}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <Badge variant={enr.status === 'ACTIVE' ? 'success' : 'neutral'}>
                            {enr.status === 'ACTIVE' ? 'فعال' : enr.status}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openChangeClassModal(enr)}
                              className="px-2.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 font-semibold text-xs transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                              title="تغییر کلاس و دوره شناگر"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
                              <span className="whitespace-nowrap">تغییر کلاس</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/swimmers/${enr.swimmer}`)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-semibold text-xs transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                              title="مشاهده پرونده جامع"
                            >
                              <Eye className="w-3.5 h-3.5 shrink-0" />
                              <span className="whitespace-nowrap">پرونده</span>
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

          {/* Pagination & Count */}
          <div className="pt-2 flex flex-col sm:flex-row justify-between items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              نمایش {paginatedEnrollments.length} از {filteredEnrollments.length} ثبت‌نام{' '}
              {enrollments.length !== filteredEnrollments.length && `(از مجموع ${enrollments.length} ثبت‌نام)`}
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      ) : (
        /* 3. TAB 2: ONLINE ENROLLMENT REQUESTS */
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              فیلتر وضعیت درخواست‌ها:
            </span>
            <div className="w-full sm:w-60">
              <CustomSelect
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                options={[
                  { value: '', label: 'تمام وضعیت‌ها' },
                  { value: 'PENDING', label: 'در انتظار بررسی' },
                  { value: 'APPROVED', label: 'تأییدشده' },
                  { value: 'REJECTED', label: 'رد شده' },
                  { value: 'WAITLIST', label: 'فهرست انتظار' },
                ]}
                placeholder="فیلتر وضعیت..."
              />
            </div>
          </div>

          {loadingRequests ? (
            <LoadingState type="table" rows={6} message="در حال بارگذاری درخواست‌های ثبت‌نام..." />
          ) : requests.length === 0 ? (
            <EmptyState
              title="هیچ درخواستی یافت نشد"
              description="در حال حاضر درخواستی با این وضعیت ثبت نشده است."
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right min-w-[640px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5 rounded-r-xl">نام متقاضی</th>
                      <th className="px-4 py-3.5">شماره همراه</th>
                      <th className="px-4 py-3.5">دوره درخواستی</th>
                      <th className="px-4 py-3.5">گروه اجرایی</th>
                      <th className="px-4 py-3.5">اقساط انتخابی</th>
                      <th className="px-4 py-3.5">تاریخ ثبت</th>
                      <th className="px-4 py-3.5">وضعیت</th>
                      <th className="px-4 py-3.5 text-center rounded-l-xl">اقدام مدیر</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {paginatedRequests.map((req) => {
                      const meta = statusBadges[req.status] || { label: req.status, variant: 'neutral' };
                      return (
                        <tr key={req.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white">{req.applicant_name}</td>
                          <td className="px-4 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-400">{req.applicant_phone}</td>
                          <td className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300">{req.course_name}</td>
                          <td className="px-4 py-3.5 text-xs font-medium text-slate-800 dark:text-slate-200">{req.group_name}</td>
                          <td className="px-4 py-3.5 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                            {req.selected_installments > 1 ? `${req.selected_installments} قسط` : 'یکجا (نقدی)'}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                            {new Date(req.created_at).toLocaleDateString('fa-IR')}
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge variant={meta.variant}>{meta.label}</Badge>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {req.status === 'PENDING' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedReq(req);
                                  setReviewInstallments(req.selected_installments || 1);
                                  setRejectionReason('');
                                }}
                                className="px-3 py-1.5 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 font-semibold text-xs rounded-xl border border-sky-200 dark:border-sky-800 transition-colors shadow-2xs cursor-pointer whitespace-nowrap shrink-0"
                              >
                                بررسی و تصمیم
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 dark:text-slate-500 italic whitespace-nowrap">بررسی‌شده</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <span className="text-xs text-slate-500">
                  نمایش {paginatedRequests.length} از {requests.length} درخواست
                </span>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. MODAL: CHANGE CLASS & COURSE COMPLETELY */}
      <Modal
        isOpen={Boolean(changeClassTarget)}
        onClose={() => setChangeClassTarget(null)}
        title="تغییر کلاس و دوره آموزشی شناگر"
      >
        {changeClassTarget && (
          <div className="space-y-4">
            {/* Swimmer Profile Brief */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {changeClassTarget.swimmer_avatar ? (
                  <img
                    src={changeClassTarget.swimmer_avatar}
                    alt={changeClassTarget.swimmer_name}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    {changeClassTarget.swimmer_name ? changeClassTarget.swimmer_name.charAt(0) : 'ش'}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    {changeClassTarget.swimmer_name}
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400 block">
                    {changeClassTarget.swimmer_phone}
                  </span>
                </div>
              </div>

              {changeClassTarget.swimmer_gender && (
                <Badge variant={changeClassTarget.swimmer_gender === 'MALE' ? 'sky' : 'rose'}>
                  {changeClassTarget.swimmer_gender === 'MALE' ? 'پسران / آقایان' : 'دختران / بانوان'}
                </Badge>
              )}
            </div>

            {/* Current State Info */}
            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/60 text-xs space-y-1.5 text-amber-900 dark:text-amber-200">
              <div className="flex justify-between">
                <span className="text-amber-700 dark:text-amber-400">دوره فعلی:</span>
                <span className="font-bold">{changeClassTarget.course_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-700 dark:text-amber-400">کلاس و مربی فعلی:</span>
                <span className="font-semibold">
                  {changeClassTarget.group_name || `کلاس مربی ${changeClassTarget.coach_name || 'بدون مربی'}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-700 dark:text-amber-400">جلسات مصرف‌شده:</span>
                <span className="font-mono font-bold">
                  {changeClassTarget.sessions_attended} از {changeClassTarget.sessions_purchased} جلسه
                </span>
              </div>
            </div>

            {/* Form Fields: New Course, Class, Coach */}
            <div className="space-y-3 pt-1">
              {/* Select New Course */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ۱. انتخاب دوره آموزشی جدید:
                </label>
                <CustomSelect
                  value={targetCourseId}
                  onChange={handleTargetCourseChange}
                  options={courses.map((c) => ({
                    value: String(c.id),
                    label: `${c.name} (${c.pool_location || 'استخر اصلی'})`,
                  }))}
                  placeholder="دوره آموزشی جدید را انتخاب نمایید..."
                  searchable
                />
              </div>

              {/* Select Group/Class */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ۲. انتخاب کلاس / گروه اجرایی (اختیاری):
                </label>
                <CustomSelect
                  value={targetGroupId}
                  onChange={handleTargetGroupChange}
                  options={[
                    { value: '', label: 'انتخاب خودکار یا بر اساس مربی' },
                    ...modalAvailableGroups.map((g) => ({
                      value: String(g.id),
                      label: `${g.name} (${g.remaining_capacity} جای خالی)`,
                    })),
                  ]}
                  placeholder="کلاس مشخص..."
                  disabled={!targetCourseId}
                />
              </div>

              {/* Select Coach */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ۳. مربی تخصیص‌یافته:
                </label>
                <CustomSelect
                  value={targetCoachId}
                  onChange={(val) => setTargetCoachId(val)}
                  options={[
                    { value: '', label: 'بدون مربی (تعیین بعداً)' },
                    ...modalAvailableCoaches.map((c) => ({
                      value: String(c.id),
                      label: `مربی ${c.full_name}`,
                    })),
                  ]}
                  placeholder="مربی کلاس..."
                  searchable
                />
              </div>

              {/* Reset Sessions Checkbox */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={resetSessions}
                    onChange={(e) => setResetSessions(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                  <span>
                    شمارش جلسات دوره جدید از صفر آغاز شود (جلسات مصرف‌شده قبلی صفر شود)
                  </span>
                </label>
                <p className="text-[11px] text-slate-400 mt-1 pr-6">
                  {resetSessions
                    ? 'جلسات مصرف‌شده شناگر به صفر تغییر می‌کند.'
                    : `سوابق ${changeClassTarget.sessions_attended} جلسه مصرف‌شده قبلی حفظ می‌گردد.`}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                disabled={submittingChangeClass}
                onClick={() => setChangeClassTarget(null)}
                className="text-xs"
              >
                انصراف
              </Button>
              <Button
                type="button"
                disabled={submittingChangeClass}
                onClick={handleConfirmChangeClass}
                className="text-xs gap-1.5"
              >
                {submittingChangeClass ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>در حال انتقال...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>تأیید و اعمال تغییر کلاس و دوره</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Review Request Modal */}
      <Modal
        isOpen={Boolean(selectedReq)}
        onClose={() => setSelectedReq(null)}
        title="بررسی و تصمیم‌گیری درخواست ثبت‌نام آنلاین"
      >
        {selectedReq && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">نام متقاضی:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedReq.applicant_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">شماره همراه:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedReq.applicant_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">دوره درخواستی:</span>
                <span className="font-bold text-sky-700 dark:text-sky-300">{selectedReq.course_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">گروه کلاسی:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedReq.group_name}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-400 font-medium">اقساط انتخابی شناگر:</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200/80 dark:border-emerald-800">
                  {selectedReq.selected_installments > 1 ? `${selectedReq.selected_installments} قسط` : 'یکجا (نقدی)'}
                  {selectedReq.course_max_installments > 1 && ` (از سقف مجاز ${selectedReq.course_max_installments} قسط)`}
                </span>
              </div>
            </div>

            {/* Installments selection before approving */}
            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/70 dark:border-emerald-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  تعداد اقساط فاکتور نهایی:
                </label>
                <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
                  {reviewInstallments > 1 ? `${reviewInstallments} قسط مساوی` : 'پرداخت یکجا (۱ قسط)'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {Array.from({ length: Math.max(1, selectedReq.course_max_installments || 1) }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setReviewInstallments(num)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      Number(reviewInstallments) === num
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                    }`}
                  >
                    {num === 1 ? 'یکجا (۱ قسط)' : `${num} قسط`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                توضیحات یا دلیل رد (در صورت رد درخواست)
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="در صورت عدم تایید، دلیل آن برای متقاضی پیامک می‌شود..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setSelectedReq(null)}>
                انصراف
              </Button>
              <Button
                variant="danger"
                disabled={submitting}
                onClick={() => handleReview('REJECT')}
              >
                رد درخواست
              </Button>
              <Button
                variant="primary"
                disabled={submitting}
                onClick={() => handleReview('APPROVE')}
              >
                تأیید و صدور فاکتور
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
