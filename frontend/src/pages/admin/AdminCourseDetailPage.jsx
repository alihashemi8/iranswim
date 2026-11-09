import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  BookOpen, Users, GraduationCap, Calendar, Clock, MapPin,
  ChevronRight, ArrowRight, Search, Filter, CheckCircle2,
  AlertCircle, Eye, LayoutGrid, List, Plus, RefreshCw,
  Award, DollarSign, Sparkles, Layers, ShieldCheck, Phone,
  Trash2, UserPlus, UserCheck, AlertTriangle, UserCog,
  CheckSquare, Square, Whistle, UserX, Check
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ProgressBar } from '../../components/common/Charts';
import { CoachSelectorDropdown } from '../../components/common/CoachSelectorDropdown';
import { CustomSelect } from '../../components/common/CustomSelect';
import { SwimmerCourseCard } from '../../components/common/SwimmerCourseCard';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';

export const AdminCourseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const [course, setCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [allCoaches, setAllCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tab state synced with URL search params (?tab=classes or swimmers or info)
  const initialTab = searchParams.get('tab') || 'swimmers';
  const [activeTab, setActiveTab] = useState(
    ['swimmers', 'classes', 'info'].includes(initialTab) ? initialTab : 'swimmers'
  );

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['swimmers', 'classes', 'info'].includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', newTab);
      return next;
    }, { replace: true });
  };

  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards' for desktop/tablet

  // Mobile detection for responsive view (mobile always shows cards, tablet/desktop allows toggle)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768; // Tailwind md breakpoint (< 768px is mobile)
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

  // Effective view mode: mobile ALWAYS forces 'cards'; desktop & tablet honor user's viewMode
  const effectiveViewMode = isMobile ? 'cards' : viewMode;

  // Filters (unified Coach & Class filter because Coach = Class)
  const [searchTerm, setSearchTerm] = useState('');
  const [classCoachFilter, setClassCoachFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Coach Management states inside Tab 2
  const [coachSearchQuery, setCoachSearchQuery] = useState('');
  const [selectedCoachIds, setSelectedCoachIds] = useState([]);
  const [submittingCoaches, setSubmittingCoaches] = useState(false);
  const [coachToDelete, setCoachToDelete] = useState(null);
  const [removingCoachId, setRemovingCoachId] = useState(null);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [courseRes, enrollmentsRes, groupsRes, coachesRes] = await Promise.all([
        api.get(`/education/courses/${id}/`),
        api.get(`/education/enrollments/?course_id=${id}`),
        api.get(`/education/groups/?course_id=${id}`).catch(() => ({ data: [] })),
        api.get('/coaches/').catch(() => ({ data: [] })),
      ]);

      setCourse(courseRes.data);
      setEnrollments(enrollmentsRes.data.results || enrollmentsRes.data || []);
      
      const courseGroups = (groupsRes.data.results || groupsRes.data || []).filter(
        (g) => g.course === Number(id) || g.course_id === Number(id) || !g.course
      );
      setGroups(courseGroups.length > 0 ? courseGroups : (courseRes.data.groups || []));
      setAllCoaches(coachesRes.data.results || coachesRes.data || []);
    } catch (err) {
      console.error('Error fetching course detail:', err);
      toast.error('خطا در دریافت اطلاعات دوره و فهرست شناگران');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  // Handle coach assignment to an enrollment
  const handleAssignCoachToEnrollment = async (enrollmentId, coachId) => {
    try {
      const res = await api.post(`/education/enrollments/${enrollmentId}/assign-coach/`, {
        coach_id: coachId,
      });
      setEnrollments((prev) =>
        prev.map((e) => (e.id === enrollmentId ? res.data : e))
      );
      toast.success(
        coachId
          ? 'مربی با موفقیت به شناگر تخصیص یافت.'
          : 'تخصیص مربی با موفقیت حذف شد و شناگر به وضعیت «بدون مربی» تبدیل شد.'
      );
    } catch (err) {
      console.error('Error assigning coach:', err);
      toast.error('خطا در تخصیص مربی به شناگر');
    }
  };

  // Set of coach IDs already in this course
  const currentCourseCoachIds = useMemo(() => {
    return new Set((course?.coaches || []).map((c) => Number(c.id)));
  }, [course]);

  // Available coaches not yet in this course
  const unassignedCoaches = useMemo(() => {
    return allCoaches.filter((c) => !currentCourseCoachIds.has(Number(c.id)));
  }, [allCoaches, currentCourseCoachIds]);

  // Coaches currently assigned to this course
  const assignedCoaches = useMemo(() => {
    return course?.coaches || [];
  }, [course]);

  // Filtered unassigned coaches by search query
  const filteredUnassignedCoaches = useMemo(() => {
    const q = coachSearchQuery.trim().toLowerCase();
    if (!q) return unassignedCoaches;
    return unassignedCoaches.filter((c) => {
      const name = (c.full_name || '').toLowerCase();
      const spec = (c.specialties || '').toLowerCase();
      return name.includes(q) || spec.includes(q);
    });
  }, [unassignedCoaches, coachSearchQuery]);

  // Selected coach objects for live preview
  const selectedCoachesList = useMemo(() => {
    return allCoaches.filter((c) => selectedCoachIds.includes(c.id));
  }, [allCoaches, selectedCoachIds]);

  // Toggle selection for coach
  const toggleCoachSelection = (coachId) => {
    setSelectedCoachIds((prev) =>
      prev.includes(coachId) ? prev.filter((cid) => cid !== coachId) : [...prev, coachId]
    );
  };

  // Select / Deselect all filtered coaches
  const handleSelectAllCoaches = () => {
    const ids = filteredUnassignedCoaches.map((c) => c.id);
    const allSelected = ids.every((cid) => selectedCoachIds.includes(cid));
    if (allSelected) {
      setSelectedCoachIds((prev) => prev.filter((cid) => !ids.includes(cid)));
    } else {
      setSelectedCoachIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  // Submit adding selected coaches to this course
  const handleAddCoachesSubmit = async () => {
    if (selectedCoachIds.length === 0) {
      toast.warning('لطفاً حداقل یک مربی را با زدن تیک انتخاب کنید.');
      return;
    }

    try {
      setSubmittingCoaches(true);
      const existingIds = (course.coaches || []).map((c) => Number(c.id));
      const finalCoachIds = Array.from(new Set([...existingIds, ...selectedCoachIds.map(Number)]));

      await api.patch(`/education/courses/${id}/`, {
        coach_ids: finalCoachIds,
      });

      toast.success(
        `${selectedCoachIds.length} مربی با موفقیت به دوره افزوده شد و کلاس‌های اختصاصی تشکیل گردید.`
      );
      setSelectedCoachIds([]);
      await fetchData(true);
    } catch (err) {
      console.error('Error adding coaches to course:', err);
      toast.error(err.response?.data?.detail || 'خطا در افزودن مربیان به دوره');
    } finally {
      setSubmittingCoaches(false);
    }
  };

  // Helper to find SwimmerGroup for a coach
  const getCoachGroup = (coachId, coachName) => {
    return groups.find((g) => {
      const hasAssignment = (g.coach_assignments || []).some(
        (ca) => Number(ca.coach) === Number(coachId)
      );
      return hasAssignment || (coachName && g.name?.includes(coachName));
    });
  };

  // Helper to get swimmer count for a coach in this course
  const getCoachSwimmersCount = (coachId) => {
    return enrollments.filter((e) => Number(e.coach) === Number(coachId)).length;
  };

  // Request removing a coach (opens confirmation modal)
  const handleRequestRemoveCoach = (coach) => {
    const swimmersCount = getCoachSwimmersCount(coach.id);
    setCoachToDelete({
      ...coach,
      swimmersCount,
    });
  };

  // Execute confirmed coach removal
  const handleConfirmRemoveCoach = async () => {
    if (!coachToDelete) return;

    try {
      setRemovingCoachId(coachToDelete.id);
      const currentCoachIds = (course.coaches || []).map((c) => Number(c.id));
      const newCoachIds = currentCoachIds.filter((cid) => cid !== Number(coachToDelete.id));

      await api.patch(`/education/courses/${id}/`, {
        coach_ids: newCoachIds,
      });

      toast.success(
        coachToDelete.swimmersCount > 0
          ? `مربی «${coachToDelete.full_name}» حذف شد و ${coachToDelete.swimmersCount} شناگر به وضعیت «بدون مربی» تبدیل شدند.`
          : `مربی «${coachToDelete.full_name}» با موفقیت از این دوره حذف شد.`
      );

      setCoachToDelete(null);
      await fetchData(true);
    } catch (err) {
      console.error('Error removing coach from course:', err);
      const errMsg = err.response?.data?.coach_ids?.[0] || err.response?.data?.detail || 'خطا در حذف مربی از دوره';
      toast.error(errMsg);
    } finally {
      setRemovingCoachId(null);
    }
  };

  // Filtered enrollments
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((enr) => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchesName = enr.swimmer_name?.toLowerCase().includes(q);
        const matchesPhone = enr.swimmer_phone?.includes(q);
        const matchesNationalId = enr.swimmer_national_id?.includes(q);
        const matchesGroup = enr.group_name?.toLowerCase().includes(q);
        const matchesCoach = enr.coach_name?.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesNationalId && !matchesGroup && !matchesCoach) {
          return false;
        }
      }

      // Filter Class & Coach (unified because Coach = Class)
      if (classCoachFilter !== 'ALL') {
        if (classCoachFilter === 'UNASSIGNED') {
          if (enr.coach) return false;
        } else {
          const targetId = Number(classCoachFilter);
          const matchesCoach = Number(enr.coach) === targetId;
          const coachGroup = getCoachGroup(targetId);
          const matchesGroup = coachGroup && Number(enr.group) === Number(coachGroup.id);
          if (!matchesCoach && !matchesGroup) {
            return false;
          }
        }
      }

      // Filter Status
      if (statusFilter !== 'ALL') {
        if (enr.status !== statusFilter) return false;
      }

      return true;
    });
  }, [enrollments, searchTerm, classCoachFilter, statusFilter, groups]);

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
      return dateStr;
    }
  };

  const formatPrice = (v) => Number(v || 0).toLocaleString('en-US');

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <LoadingState type="table" message="در حال بارگذاری اطلاعات دوره و فهرست شناگران..." />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-16 space-y-4">
        <EmptyState
          title="دوره آموزشی مورد نظر یافت نشد"
          description="دوره درخواست‌شده ممکن است حذف شده یا آدرس وارد شده نادرست باشد."
        />
        <Button onClick={() => navigate('/admin/courses?tab=COURSES')} variant="outline" className="gap-2">
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به فهرست دوره‌ها</span>
        </Button>
      </div>
    );
  }

  // Course Coaches list (available for assignment)
  const availableCoaches = course.coaches && course.coaches.length > 0 ? course.coaches : allCoaches;

  // Counts & stats
  const totalSwimmers = enrollments.length;
  const activeSwimmers = enrollments.filter((e) => e.status === 'ACTIVE').length;
  const assignedSwimmers = enrollments.filter((e) => e.coach).length;
  const unassignedSwimmers = totalSwimmers - assignedSwimmers;

  return (
    <div className="space-y-6 pb-12 admin-course-detail-section" style={{ fontFeatureSettings: '"ss01" 0, "cv01" 1' }}>
      {/* 1. Breadcrumb Navigation */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          <Link
            to="/admin/courses?tab=COURSES"
            className="hover:text-sky-600 dark:hover:text-sky-400 font-bold transition-colors flex items-center gap-1"
          >
            <span>برنامه‌ریزی، دوره‌ها و کلاس‌ها</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
            {course.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>به‌روزرسانی</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/admin/courses?tab=COURSES')}
            className="gap-1.5 text-xs"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>بازگشت به دوره‌ها</span>
          </Button>
        </div>
      </div>

      {/* 2. Main Hero Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-colors">
        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-sky-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                  {course.name}
                </h1>
                <Badge variant={course.status === 'ACTIVE' ? 'success' : 'neutral'}>
                  {course.status === 'ACTIVE' ? 'در حال برگزاری' : 'پیش‌ثبت‌نام'}
                </Badge>
                <Badge variant={course.gender === 'FEMALE' ? 'warning' : 'info'}>
                  {course.gender_display || (course.gender === 'FEMALE' ? 'دختران / بانوان' : 'پسران / آقایان')}
                </Badge>
                {course.age_range && (
                  <Badge variant="violet">
                    {course.age_range}
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {course.description || 'دوره تخصصی آموزش شنا و مهارت‌های آب‌پایه'}
              </p>
            </div>
          </div>

          {/* Location, Schedule & Dates Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <MapPin className="w-4 h-4 text-sky-500 shrink-0" />
              <span className="font-semibold truncate">{toEnglishDigits(course.pool_location || 'استخر شهید رئیسی')}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="truncate">{toEnglishDigits(course.days_of_week || 'سه‌شنبه و پنج‌شنبه')} ({toEnglishDigits(course.time_display || '17:00 الی 19:00')})</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-mono text-[11px] truncate">
                {course.start_date ? formatDateShamsiEnglish(course.start_date) : '—'} تا{' '}
                {course.end_date ? formatDateShamsiEnglish(course.end_date) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Pricing & Quick Action Box */}
        <div className="lg:border-r lg:border-slate-100 dark:lg:border-slate-800 lg:pr-6 flex flex-col justify-center items-start gap-3 shrink-0 bg-slate-50/80 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 w-full lg:w-auto min-w-[260px]">
          <div className="space-y-1 w-full text-right">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">شهریه مصوب دوره:</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {formatPrice(course.base_price)}
              </span>
              <span className="text-xs font-bold text-slate-500">تومان</span>
            </div>
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{toEnglishDigits(course.sessions_count || 12)} جلسه</span>
              <span>•</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60 text-[11px]">
                {course.installments_count && course.installments_count > 1
                  ? `اقساط تا ${toEnglishDigits(course.installments_count)} ماه`
                  : 'پرداخت یکجا'}
              </span>
            </div>
          </div>

          <div className="w-full">
            <Button
              onClick={() => navigate(`/admin/swimmers/enroll?course=${course.id}`)}
              className="gap-2 text-xs bg-sky-600 hover:bg-sky-700 text-white w-full justify-center shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت‌نام مستقیم شناگر در این دوره</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 3. KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">کل شناگران ثبت‌نامی</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
              {totalSwimmers}
              <span className="text-xs text-slate-400 mr-1 font-sans">نفر</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">شناگران فعال</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              {activeSwimmers}
              <span className="text-xs text-slate-400 mr-1 font-sans">نفر</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 (Coaches & Classes are 1:1) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">کلاس‌ها و مربیان دوره</span>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">
              {availableCoaches.length}
              <span className="text-xs text-slate-400 mr-1 font-sans">کلاس</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">جلسات مصوب دوره</span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
              {course.sessions_count || 12}
              <span className="text-xs text-slate-400 mr-1 font-sans">جلسه</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. Tabs Navigation (Unified 3 tabs: Swimmers, Classes & Coaches, Specs) */}
      <div className="grid grid-cols-3 bg-slate-200/70 dark:bg-slate-800/80 p-1.5 rounded-2xl gap-1 text-xs sm:text-sm font-bold border border-slate-200/80 dark:border-slate-700/60">
        <button
          type="button"
          onClick={() => handleTabChange('swimmers')}
          className={`py-2.5 px-2 sm:px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
            activeTab === 'swimmers'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm border border-slate-200/50 dark:border-slate-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span className="truncate">شناگران دوره</span>
          <span
            className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-bold transition-colors ${
              activeTab === 'swimmers'
                ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {enrollments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('classes')}
          className={`py-2.5 px-2 sm:px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
            activeTab === 'classes'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm border border-slate-200/50 dark:border-slate-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4 shrink-0" />
          <span className="truncate">کلاس‌ها و مربیان</span>
          <span
            className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-bold transition-colors ${
              activeTab === 'classes'
                ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {assignedCoaches.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('info')}
          className={`py-2.5 px-2 sm:px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
            activeTab === 'info'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm border border-slate-200/50 dark:border-slate-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span className="truncate">مشخصات دوره</span>
        </button>
      </div>

      {/* 5. TAB 1: SWIMMERS & CLASS/COACH ASSIGNMENT */}
      {activeTab === 'swimmers' && (
        <div className="space-y-4">
          {/* Controls: Search, Unified Class/Coach Filter, Status Filter, and View Switcher */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو با نام شناگر، شماره تماس یا کد ملی..."
                className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Dropdowns & View Mode Switcher */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Unified Filter by Class / Coach (Since Coach = Class) */}
              <div className="flex-1 sm:flex-initial min-w-[150px]">
                <CustomSelect
                  value={classCoachFilter}
                  onChange={setClassCoachFilter}
                  size="sm"
                  color="sky"
                  options={[
                    { value: 'ALL', label: 'همه کلاس‌ها و مربیان' },
                    { value: 'UNASSIGNED', label: 'بدون مربی' },
                    ...(course?.coaches || []).map((c) => ({
                      value: String(c.id),
                      label: `کلاس ${c.full_name} (${getCoachSwimmersCount(c.id)} نفر)`,
                    })),
                  ]}
                  placeholder="فیلتر کلاس و مربی..."
                  className="w-full sm:w-48"
                />
              </div>

              {/* Filter by Status */}
              <div className="flex-1 sm:flex-initial min-w-[130px]">
                <CustomSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  size="sm"
                  color="sky"
                  options={[
                    { value: 'ALL', label: 'همه وضعیت‌ها' },
                    { value: 'ACTIVE', label: 'فقط فعال' },
                    { value: 'PENDING_PAYMENT', label: 'در انتظار پرداخت' },
                    { value: 'COMPLETED', label: 'تکمیل‌شده' },
                    { value: 'CANCELLED', label: 'لغو شده' },
                  ]}
                  placeholder="وضعیت..."
                  className="w-full sm:w-36"
                />
              </div>

              {/* View Switcher: Table vs Cards (HIDDEN on Mobile, VISIBLE on Desktop & Tablet) */}
              <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-sky-600 text-white shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title="نمای جدولی"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>جدول</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-sky-600 text-white shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title="نمای کارتی"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>کارت‌ها</span>
                </button>
              </div>
            </div>
          </div>

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              نمایش <strong className="text-slate-900 dark:text-white font-mono">{filteredEnrollments.length}</strong> شناگر
              از مجموع <strong className="font-mono">{enrollments.length}</strong> شناگر ثبت‌نامی
            </span>
            {(searchTerm || classCoachFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setClassCoachFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="text-sky-600 dark:text-sky-400 hover:underline font-bold"
              >
                پاکسازی فیلترها
              </button>
            )}
          </div>

          {/* Swimmers Content */}
          {enrollments.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
              <EmptyState
                title="هنوز شناگری در این دوره ثبت‌نام نکرده است"
                description="متقاضیان می‌توانند از طریق پرتال عمومی ثبت‌نام کنند یا می‌توانید با دکمه ثبت‌نام مستقیم، شناگران را وارد این دوره نمایید."
              />
              <div className="pt-4 flex justify-center">
                <Button
                  onClick={() => navigate(`/admin/swimmers/enroll?course=${course.id}`)}
                  className="gap-2 text-xs bg-sky-600 hover:bg-sky-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                  <span>ثبت‌نام مستقیم اولین شناگر</span>
                </Button>
              </div>
            </div>
          ) : filteredEnrollments.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
              <EmptyState
                title="شناگری با فیلترهای انتخابی یافت نشد"
                description="لطفاً عبارت جستجو یا فیلترهای کلاس و مربی را تغییر دهید."
              />
            </div>
          ) : effectiveViewMode === 'table' ? (
            /* TABLE VIEW (Available on Tablet & Desktop) */
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right min-w-[700px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">شناگر</th>
                      <th className="px-5 py-3.5">سطح مهارتی</th>
                      <th className="px-5 py-3.5">کلاس و مربی تخصیص‌یافته</th>
                      <th className="px-5 py-3.5">جلسات</th>
                      <th className="px-5 py-3.5">وضعیت</th>
                      <th className="px-5 py-3.5 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {filteredEnrollments.map((enr) => (
                      <tr
                        key={enr.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Swimmer Name, Phone, Avatar */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              {enr.swimmer_avatar ? (
                                <img
                                  src={enr.swimmer_avatar}
                                  alt={enr.swimmer_name}
                                  className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                                  {enr.swimmer_name?.charAt(0) || 'ش'}
                                </div>
                              )}
                              <span className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 bg-emerald-500 border border-white dark:border-slate-900 rounded-full" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 dark:text-white block text-xs sm:text-sm truncate">
                                {enr.swimmer_name}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                {enr.swimmer_phone && (
                                  <span className="text-[11px] text-slate-400 font-mono">
                                    {enr.swimmer_phone}
                                  </span>
                                )}
                                {enr.swimmer_national_id && (
                                  <span className="text-[10px] text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded-sm">
                                    کدملی: {enr.swimmer_national_id}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Skill Level */}
                        <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                          {enr.swimmer_level_name ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[11px] font-bold border border-sky-200/60 dark:border-sky-800">
                              <Award className="w-3 h-3 text-sky-500 shrink-0" />
                              <span>{enr.swimmer_level_name}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Class & Assigned Coach (Unified) */}
                        <td className="px-5 py-3.5">
                          <div className="space-y-1.5">
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
                              availableCoaches={enr.course_coaches || availableCoaches}
                              onSelectCoach={(coachId) => handleAssignCoachToEnrollment(enr.id, coachId)}
                              placement="auto"
                              size="sm"
                            />
                            {enr.coach && enr.group && (
                              <div className="text-[11px] text-slate-500">
                                <Link
                                  to={`/admin/classes/${enr.group}`}
                                  className="text-sky-600 dark:text-sky-400 hover:underline font-semibold inline-flex items-center gap-1"
                                >
                                  <span>{enr.group_name}</span>
                                  <span className="text-[9px]">↗</span>
                                </Link>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Sessions attended / purchased */}
                        <td className="px-5 py-3.5 text-xs font-mono text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {enr.sessions_attended || 0}
                            </span>
                            <span className="text-slate-400">از</span>
                            <span>{enr.sessions_purchased || course.sessions_count || 12}</span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="px-5 py-3.5">
                          <Badge
                            variant={
                              enr.status === 'ACTIVE'
                                ? 'success'
                                : enr.status === 'PENDING_PAYMENT'
                                ? 'warning'
                                : 'neutral'
                            }
                          >
                            {enr.status === 'ACTIVE'
                              ? 'فعال'
                              : enr.status === 'PENDING_PAYMENT'
                              ? 'در انتظار پرداخت'
                              : enr.status}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/swimmers/${enr.swimmer}`)}
                            className="p-1.5 px-2.5 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-950/60 text-sky-600 dark:text-sky-400 transition-colors inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer border border-transparent hover:border-sky-200 dark:hover:border-sky-800"
                            title="مشاهده پرونده جامع شناگر"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>پرونده</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* CARDS VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEnrollments.map((enr) => (
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
                    name: enr.course_name || course.name,
                    pool_location: enr.course_pool || course.pool_location,
                    days_of_week: enr.course_days || course.days_of_week,
                    time_display: enr.course_time || course.time_display,
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
                  availableCoaches={enr.course_coaches || availableCoaches}
                  allCoaches={allCoaches}
                  onSelectCoach={(coachId) => handleAssignCoachToEnrollment(enr.id, coachId)}
                  onOpenDossier={() => navigate(`/admin/swimmers/${enr.swimmer}`)}
                  status={enr.status}
                  sessionsPurchased={enr.sessions_purchased || course.sessions_count || 12}
                  sessionsAttended={enr.sessions_attended || 0}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 2: CLASSES & COACHES (UNIFIED - COACH = CLASS) */}
      {activeTab === 'classes' && (
        <div className="space-y-6">
          {/* Main Header Banner */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-sky-600" />
                <span>کلاس‌ها و مدیریت مربیان دوره ({assignedCoaches.length} کلاس اختصاصی)</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                در این دوره هر مربی هدایت یک کلاس اختصاصی را بر عهده دارد. می‌توانید کلاس و مربی جدید بیفزایید یا مربیان و شاگردان فعلی را مدیریت کنید.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200">
                {assignedCoaches.length} مربی فعال در دوره
              </span>
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                {unassignedCoaches.length} مربی آماده تخصیص
              </span>
            </div>
          </div>

          {/* Section 1: Coaches Currently Assigned in this Course */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>مربیانی که در حال حاضر در این دوره کلاس دارند ({assignedCoaches.length} مربی)</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                برای حذف مربی، از دکمه «حذف از دوره» در کارت مربی استفاده کنید.
              </span>
            </div>

            {assignedCoaches.length === 0 ? (
              <div className="p-5 rounded-3xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>هم‌اکنون هیچ مربی‌ای در این دوره کلاس فعال ندارد. از بخش زیر مربیان مورد نظر را انتخاب و اضافه نمایید.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignedCoaches.map((c) => {
                  const group = getCoachGroup(c.id, c.full_name);
                  const swimmerCount = getCoachSwimmersCount(c.id);
                  const capacity = group?.capacity || 15;
                  const remaining = Math.max(0, capacity - swimmerCount);
                  const isFull = remaining <= 0;
                  const isRemovingThis = removingCoachId === c.id;

                  return (
                    <div
                      key={c.id}
                      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                    >
                      <div className="space-y-3.5">
                        {/* Coach & Class Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative shrink-0">
                              {c.avatar ? (
                                <img
                                  src={c.avatar}
                                  alt={c.full_name}
                                  className="w-12 h-12 rounded-2xl object-cover border-2 border-sky-400 shadow-2xs"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-base shadow-2xs">
                                  {c.full_name?.charAt(0) || 'م'}
                                </div>
                              )}
                              <span className="absolute -bottom-0.5 -left-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                            </div>

                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-900 dark:text-white text-base truncate">
                                مربی {c.full_name}
                              </h4>
                              <span className="text-xs text-sky-600 dark:text-sky-400 font-semibold block mt-0.5">
                                {c.class_name || (group?.name ? group.name : `کلاس مربی ${c.full_name}`)}
                              </span>
                            </div>
                          </div>

                          <Badge variant={isFull ? 'danger' : 'success'}>
                            {isFull ? 'تکمیل ظرفیت' : 'ظرفیت پذیرش دارد'}
                          </Badge>
                        </div>

                        {/* Class Specs Pill */}
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                          {group?.level_name && (
                            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800/80">
                              <span className="text-slate-400">سطح آموزشی:</span>
                              <span className="font-bold text-sky-600 dark:text-sky-400">
                                {group.level_name}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                            <span className="text-slate-400">شناگران اختصاصی کلاس:</span>
                            <span className="font-black font-mono text-slate-900 dark:text-white text-sm">
                              {swimmerCount} <span className="text-xs font-normal text-slate-400">نفر</span>
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                            <span className="text-slate-400">ظرفیت مجاز کلاس:</span>
                            <span className="font-mono text-slate-700 dark:text-slate-300">
                              {capacity} نفر ({remaining} جای خالی)
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="pt-1">
                            <ProgressBar
                              value={swimmerCount}
                              max={capacity}
                              color={isFull ? 'rose' : remaining < 3 ? 'amber' : 'emerald'}
                              height="h-2"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bottom Actions */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            handleTabChange('swimmers');
                            setClassCoachFilter(String(c.id));
                          }}
                          className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="مشاهده شاگردان کلاس این مربی در تب شناگران"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>شاگردان ({swimmerCount})</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          {group && (
                            <Link
                              to={`/admin/classes/${group.id}`}
                              className="p-1.5 px-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors inline-flex items-center gap-1"
                              title="ورود به فضای کلاس"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>کلاس</span>
                            </Link>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRequestRemoveCoach(c)}
                            disabled={isRemovingThis}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-900/50 hover:border-rose-300 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                            title={`حذف مربی ${c.full_name} از دوره`}
                          >
                            {isRemovingThis ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                            )}
                            <span>حذف از دوره</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Add New Coaches & Form Dedicated Classes */}
          <div className="space-y-4 pt-6 border-t border-slate-200/80 dark:border-slate-800">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="space-y-1.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Whistle className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>افزودن مربیان جدید و تشکیل کلاس‌های اختصاصی</span>
                  <span className="text-xs text-slate-400 font-normal">
                    ({unassignedCoaches.length} مربی در کادر آکادمی)
                  </span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  مربیان مورد نظر را از فهرست زیر <strong className="text-sky-600 dark:text-sky-400">تیک بزنید</strong>.
                  به ازای هر مربی انتخابی، یک کلاس اختصاصی با عنوان «کلاس مربی [نام مربی]» با ظرفیت استاندارد ۱۵ نفر و متصل به زمان‌بندی و استخر این دوره تشکیل خواهد شد.
                </p>
              </div>

              {/* Search Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={coachSearchQuery}
                    onChange={(e) => setCoachSearchQuery(e.target.value)}
                    placeholder="جستجو در نام مربی یا تخصص..."
                    className="w-full pr-10 pl-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                  />
                  {coachSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCoachSearchQuery('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {unassignedCoaches.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllCoaches}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      {filteredUnassignedCoaches.length > 0 &&
                      filteredUnassignedCoaches.every((c) => selectedCoachIds.includes(c.id)) ? (
                        <>
                          <Square className="w-3.5 h-3.5 text-slate-500" />
                          <span>لغو انتخاب همه</span>
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                          <span>انتخاب همه ({filteredUnassignedCoaches.length})</span>
                        </>
                      )}
                    </button>
                  )}

                  <span
                    className={`text-xs font-bold px-3 py-2 rounded-xl border transition-colors flex items-center gap-1.5 ${
                      selectedCoachIds.length > 0
                        ? 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 border-sky-200 dark:border-sky-800'
                        : 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      {selectedCoachIds.length > 0
                        ? `${selectedCoachIds.length} مربی انتخاب شده`
                        : 'هیچ مربی‌ای تیک نخورده'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Available Coaches Grid */}
              {unassignedCoaches.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    تمامی مربیان فعال آکادمی هم‌اکنون به این دوره تخصیص یافته‌اند!
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    تمام مربیان موجود در سیستم در حال حاضر دارای کلاس اختصاصی در این دوره هستند.
                  </p>
                </div>
              ) : filteredUnassignedCoaches.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  مربی متناسب با عبارت «{coachSearchQuery}» یافت نشد.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredUnassignedCoaches.map((c) => {
                    const isSelected = selectedCoachIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => toggleCoachSelection(c.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group select-none ${
                          isSelected
                            ? 'bg-sky-50/80 dark:bg-sky-950/50 border-sky-400 dark:border-sky-600 ring-2 ring-sky-500/20 shadow-xs'
                            : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/90 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            {c.avatar ? (
                              <img
                                src={c.avatar}
                                alt={c.full_name}
                                className="w-11 h-11 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                                {c.full_name ? c.full_name.charAt(0) : 'م'}
                              </div>
                            )}
                            <span className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 bg-emerald-500 border border-white dark:border-slate-900 rounded-full" />
                          </div>

                          <div className="min-w-0">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                              مربی {c.full_name}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                              {c.specialties || 'مربی رسمی شنا'}
                            </span>
                            {isSelected && (
                              <span className="inline-block text-[10px] text-sky-700 dark:text-sky-300 font-bold bg-sky-100 dark:bg-sky-900/60 px-2 py-0.5 rounded-md mt-1">
                                تشکیل کلاس اختصاصی (۱۵ نفر)
                              </span>
                            )}
                          </div>
                        </div>

                        <div
                          className={`w-6 h-6 rounded-xl border flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'bg-sky-600 border-sky-600 text-white shadow-xs'
                              : 'border-slate-300 dark:border-slate-600 group-hover:border-sky-400 bg-white dark:bg-slate-900'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Live Preview of Classes to be Created */}
              {selectedCoachesList.length > 0 && (
                <div className="bg-sky-50/70 dark:bg-sky-950/40 p-4 rounded-2xl border border-sky-200 dark:border-sky-800/80 space-y-2.5 animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-sky-900 dark:text-sky-200 font-bold text-xs sm:text-sm">
                      <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <span>پیش‌نمایش کلاس‌هایی که تشکیل خواهند شد ({selectedCoachesList.length} کلاس):</span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      استخر: {course.pool_location || 'استخر دوره'} - {course.schedule_days || course.days_of_week || 'سانس‌های دوره'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                    {selectedCoachesList.map((c) => (
                      <div
                        key={c.id}
                        className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-sky-200/90 dark:border-sky-800/60 shadow-2xs flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                            کلاس مربی {c.full_name}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                            کلاس اختصاصی - ظرفیت ۱۵ نفر
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shrink-0">
                          آماده تشکیل
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Action Bar */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    تعداد مربیان انتخاب‌شده برای الحاق:
                  </span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono">
                    {selectedCoachIds.length} مربی
                  </span>
                </div>

                <Button
                  size="sm"
                  onClick={handleAddCoachesSubmit}
                  disabled={selectedCoachIds.length === 0 || submittingCoaches}
                  className="gap-2 bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-500/20 cursor-pointer disabled:opacity-50"
                >
                  {submittingCoaches ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال افزودن و تشکیل کلاس‌ها...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>
                        افزودن و تشکیل {selectedCoachIds.length > 0 ? `${selectedCoachIds.length} کلاس اختصاصی` : 'کلاس‌ها'}
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 3: COURSE INFO & DETAILS */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sky-600" />
              <span>مشخصات و اهداف دوره</span>
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {course.description || 'توضیحات تکمیلی برای این دوره ثبت نشده است.'}
            </p>

            {course.what_you_learn && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  سرفصل‌های آموزشی و مهارت‌های کسب‌شده:
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                  {course.what_you_learn}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>اطلاعات زمان‌بندی و مالی</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">استخر محل برگزاری:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {course.pool_location || 'استخر شهید رئیسی'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">روزها و ساعت برگزاری:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {toEnglishDigits(course.days_of_week)} ({toEnglishDigits(course.time_display)})
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">تعداد کل جلسات:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {toEnglishDigits(course.sessions_count || 12)} جلسه
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">شهریه هر شناگر:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {formatPrice(course.base_price)} تومان
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">شرایط پرداخت اقساطی:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {course.installments_count && course.installments_count > 1
                    ? `تا ${toEnglishDigits(course.installments_count)} قسط`
                    : 'پرداخت نقدی یکجا'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Remove Coach from Course */}
      <Modal
        isOpen={Boolean(coachToDelete)}
        onClose={() => {
          if (!removingCoachId) setCoachToDelete(null);
        }}
        title="حذف مربی از دوره آموزشی"
        maxWidth="max-w-md"
      >
        {coachToDelete && (
          <div className="space-y-4 text-xs" dir="rtl">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 text-rose-800 dark:text-rose-300">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-rose-900 dark:text-rose-200">
                  تأیید حذف مربی «{coachToDelete.full_name}»
                </h4>
                <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">
                  کلاس اختصاصی مرتبط با این مربی در این دوره منحل خواهد شد.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                آیا از حذف مربی <strong className="text-slate-900 dark:text-white font-bold">«{coachToDelete.full_name}»</strong> از این دوره اطمینان دارید؟
              </p>

              {coachToDelete.swimmersCount > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-1.5">
                  <p className="font-bold text-xs flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>انتقال شاگردان به وضعیت «بدون مربی»</span>
                  </p>
                  <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    این مربی دارای <strong>{coachToDelete.swimmersCount} شناگر ثبت‌نامی</strong> در این دوره است. با حذف مربی، کلاس اختصاصی ایشان منحل شده و وضعیت تمامی این شناگران به صورت خودکار به <strong className="text-amber-700 dark:text-amber-300 font-bold">«بدون مربی»</strong> تغییر می‌کند تا بتوانید در تب شناگران آن‌ها را به مربی یا کلاس جدید اختصاص دهید.
                  </p>
                </div>
              )}

              {assignedCoaches.length === 1 && (
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] space-y-0.5">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    نکته مدیریتی:
                  </span>
                  <span>
                    این مربی تنها مربی حاضر در این دوره است. با حذف وی، دوره موقتاً بدون مربی خواهد شد تا مربی جدیدی تخصیص دهید.
                  </span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCoachToDelete(null)}
                disabled={Boolean(removingCoachId)}
                className="cursor-pointer"
              >
                انصراف
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmRemoveCoach}
                disabled={Boolean(removingCoachId)}
                className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {removingCoachId ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>در حال حذف...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>
                      {coachToDelete.swimmersCount > 0
                        ? 'تأیید حذف و تبدیل شاگردان به بدون مربی'
                        : 'بله، حذف مربی از دوره'}
                    </span>
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
