import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, Users, GraduationCap, Calendar, Clock, MapPin,
  ChevronRight, ArrowRight, Search, Filter, CheckCircle2,
  AlertCircle, Eye, LayoutGrid, List, Plus, RefreshCw,
  Award, DollarSign, Sparkles, Layers, ShieldCheck, Phone,
  Trash2, UserPlus, UserCheck, AlertTriangle
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ProgressBar } from '../../components/common/Charts';
import { CoachSelectorDropdown } from '../../components/common/CoachSelectorDropdown';
import { SwimmerCourseCard } from '../../components/common/SwimmerCourseCard';
import { useToast } from '../../context/ToastContext';

export const AdminCourseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [course, setCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [allCoaches, setAllCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // View state
  const [activeTab, setActiveTab] = useState('swimmers'); // 'swimmers' | 'coaches' | 'groups' | 'info'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  // Coach Management Modal state
  const [isAddCoachModalOpen, setIsAddCoachModalOpen] = useState(false);
  const [selectedNewCoach, setSelectedNewCoach] = useState('');
  const [addingCoach, setAddingCoach] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [coachFilter, setCoachFilter] = useState('ALL');
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

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
          : 'تخصیص مربی با موفقیت حذف شد.'
      );
    } catch (err) {
      console.error('Error assigning coach:', err);
      toast.error('خطا در تخصیص مربی به شناگر');
    }
  };

  // Available coaches not yet in this course
  const unassignedCoaches = useMemo(() => {
    const courseCoachIds = new Set((course?.coaches || []).map((c) => Number(c.id)));
    return allCoaches.filter((c) => !courseCoachIds.has(Number(c.id)));
  }, [allCoaches, course]);

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

  // Handle adding a coach to the course (automatically syncs/creates their class)
  const handleAddCoachToCourse = async (selectedCoachId) => {
    if (!selectedCoachId) return;
    try {
      setAddingCoach(true);
      const currentCoachIds = (course.coaches || []).map((c) => c.id);
      if (currentCoachIds.includes(Number(selectedCoachId))) {
        toast.warning('این مربی در حال حاضر در این دوره حضور دارد.');
        return;
      }
      const newCoachIds = [...currentCoachIds, Number(selectedCoachId)];
      await api.patch(`/education/courses/${id}/`, {
        coach_ids: newCoachIds,
      });
      toast.success('مربی با موفقیت به دوره افزوده شد و کلاس اختصاصی وی ایجاد گردید.');
      setIsAddCoachModalOpen(false);
      setSelectedNewCoach('');
      await fetchData(true);
    } catch (err) {
      console.error('Error adding coach to course:', err);
      toast.error(err.response?.data?.detail || 'خطا در افزودن مربی به دوره');
    } finally {
      setAddingCoach(false);
    }
  };

  // Handle removing a coach from the course
  const handleRemoveCoachFromCourse = async (coachId, coachName) => {
    const assignedCount = getCoachSwimmersCount(coachId);
    if (assignedCount > 0) {
      toast.error(
        `امکان حذف مربی «${coachName}» وجود ندارد؛ زیرا ${assignedCount} شناگر در کلاس این مربی ثبت‌نام دارند. ابتدا شناگران را به مربی دیگری تخصیص دهید.`
      );
      return;
    }
    if (!window.confirm(`آیا از حذف مربی «${coachName}» از این دوره آموزشی اطمینان دارید؟`)) {
      return;
    }
    try {
      const currentCoachIds = (course.coaches || []).map((c) => c.id);
      const newCoachIds = currentCoachIds.filter((cid) => cid !== Number(coachId));
      if (newCoachIds.length === 0) {
        toast.error('دوره باید حداقل دارای یک مربی باشد.');
        return;
      }
      await api.patch(`/education/courses/${id}/`, {
        coach_ids: newCoachIds,
      });
      toast.success(`مربی «${coachName}» با موفقیت از این دوره حذف شد.`);
      await fetchData(true);
    } catch (err) {
      console.error('Error removing coach from course:', err);
      toast.error(err.response?.data?.detail || 'خطا در حذف مربی از دوره');
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
        if (!matchesName && !matchesPhone && !matchesNationalId && !matchesGroup) {
          return false;
        }
      }

      // Filter Coach
      if (coachFilter !== 'ALL') {
        if (coachFilter === 'UNASSIGNED') {
          if (enr.coach) return false;
        } else if (String(enr.coach) !== String(coachFilter)) {
          return false;
        }
      }

      // Filter Group
      if (groupFilter !== 'ALL') {
        if (groupFilter === 'UNASSIGNED') {
          if (enr.group) return false;
        } else if (String(enr.group) !== String(groupFilter)) {
          return false;
        }
      }

      // Filter Status
      if (statusFilter !== 'ALL') {
        if (enr.status !== statusFilter) return false;
      }

      return true;
    });
  }, [enrollments, searchTerm, coachFilter, groupFilter, statusFilter]);

  const formatPrice = (v) => Number(v || 0).toLocaleString('fa-IR');

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
    <div className="space-y-6 pb-12">
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
              <span className="font-semibold truncate">{course.pool_location || 'استخر شهید رئیسی'}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="truncate">{course.days_of_week || 'سه‌شنبه و پنج‌شنبه'} ({course.time_display || '۱۷:۰۰ الی ۱۹:۰۰'})</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-mono text-[11px] truncate">
                {course.start_date ? new Date(course.start_date).toLocaleDateString('fa-IR') : '—'} تا{' '}
                {course.end_date ? new Date(course.end_date).toLocaleDateString('fa-IR') : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Pricing & Quick Action Box */}
        <div className="lg:border-r lg:border-slate-100 dark:lg:border-slate-800 lg:pr-6 flex flex-col justify-center items-start lg:items-end gap-3 shrink-0">
          <div className="text-right lg:text-left">
            <span className="text-xs text-slate-400 block">شهریه مصوب دوره:</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {formatPrice(course.base_price)}
              </span>
              <span className="text-xs font-bold text-slate-500">تومان</span>
            </div>
            <span className="text-[11px] text-slate-400">
              {course.sessions_count || 12} جلسه
              {course.installments_count && course.installments_count > 1
                ? ` • تا ${course.installments_count} قسط مجاز`
                : ' • پرداخت یکجا'}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <Button
              onClick={() => navigate(`/admin/swimmers/enroll?course=${course.id}`)}
              className="gap-2 text-xs bg-sky-600 hover:bg-sky-700 text-white w-full sm:w-auto justify-center"
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

        {/* Metric 3 */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">مربیان تخصیص‌یافته</span>
            <div className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono mt-1">
              {availableCoaches.length}
              <span className="text-xs text-slate-400 mr-1 font-sans">مربی</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">کلاس‌ها / لاین‌ها</span>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">
              {groups.length}
              <span className="text-xs text-slate-400 mr-1 font-sans">کلاس</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. Tabs Navigation */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-slate-200/70 dark:bg-slate-800/80 p-1.5 rounded-2xl gap-1 text-xs sm:text-sm font-bold border border-slate-200/80 dark:border-slate-700/60">
        <button
          type="button"
          onClick={() => setActiveTab('swimmers')}
          className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'swimmers'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm border border-slate-200/50 dark:border-slate-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>شناگران دوره</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold transition-colors ${
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
          onClick={() => setActiveTab('coaches')}
          className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'coaches'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm border border-slate-200/50 dark:border-slate-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4 shrink-0" />
          <span>کادر مربیان دوره</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold transition-colors ${
              activeTab === 'coaches'
                ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {course.coaches?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('groups')}
          className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'groups'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm border border-slate-200/50 dark:border-slate-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 shrink-0" />
          <span>کلاس‌ها و لاین‌های آموزشی</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold transition-colors ${
              activeTab === 'groups'
                ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {groups.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'info'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm border border-slate-200/50 dark:border-slate-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span>مشخصات دوره</span>
        </button>
      </div>

      {/* 5. TAB 1: SWIMMERS & COACH ASSIGNMENT */}
      {activeTab === 'swimmers' && (
        <div className="space-y-4">
          {/* Coach Quick Filter Bar (Pills with Avatars and Swimmer Counts) */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-sky-600" />
                <span>فیلتر سریع شناگران بر اساس کلاس و مربی:</span>
              </span>
              <span className="text-[11px]">
                {coachFilter === 'ALL' ? 'نمای کلی تمام شناگران دوره' : 'فیلتر تفکیکی بر اساس کلاس یک مربی'}
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              <button
                type="button"
                onClick={() => setCoachFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
                  coachFilter === 'ALL'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-400'
                }`}
              >
                <span>نمای کلی دوره (همه شناگران)</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  coachFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {enrollments.length}
                </span>
              </button>

              {(course.coaches || []).map((c) => {
                const count = getCoachSwimmersCount(c.id);
                const isSelected = String(coachFilter) === String(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCoachFilter(String(c.id))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
                      isSelected
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-400'
                    }`}
                  >
                    {c.avatar ? (
                      <img src={c.avatar} alt={c.full_name} className="w-4 h-4 rounded-full object-cover" />
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 flex items-center justify-center text-[9px] font-bold">
                        {c.full_name?.charAt(0)}
                      </span>
                    )}
                    <span>کلاس {c.full_name}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {count} نفر
                    </span>
                  </button>
                );
              })}

              {unassignedSwimmers > 0 && (
                <button
                  type="button"
                  onClick={() => setCoachFilter('UNASSIGNED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                    coachFilter === 'UNASSIGNED'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60 hover:border-amber-400'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>بدون مربی تخصیصی</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-200/60 dark:bg-amber-900/60">
                    {unassignedSwimmers}
                  </span>
                </button>
              )}
            </div>
          </div>
          {/* Controls: Search, Filters, and View Switcher */}
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
              {/* Filter by Coach */}
              <select
                value={coachFilter}
                onChange={(e) => setCoachFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">همه مربیان</option>
                <option value="UNASSIGNED">بدون مربی تخصیصی</option>
                {availableCoaches.map((c) => (
                  <option key={c.id} value={c.id}>
                    مربی: {c.full_name}
                  </option>
                ))}
              </select>

              {/* Filter by Group */}
              {groups.length > 0 && (
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">همه کلاس‌ها</option>
                  <option value="UNASSIGNED">بدون کلاس</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Filter by Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">همه وضعیت‌ها</option>
                <option value="ACTIVE">فقط فعال</option>
                <option value="PENDING_PAYMENT">در انتظار پرداخت</option>
                <option value="COMPLETED">تکمیل‌شده</option>
                <option value="CANCELLED">لغو شده</option>
              </select>

              {/* View Switcher: Table vs Cards */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="نمای جدولی"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">جدول</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="نمای کارتی"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">کارت‌ها</span>
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
            {(searchTerm || coachFilter !== 'ALL' || groupFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCoachFilter('ALL');
                  setGroupFilter('ALL');
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
                description="لطفاً عبارت جستجو یا فیلترهای مربی و کلاس را تغییر دهید."
              />
            </div>
          ) : viewMode === 'table' ? (
            /* TABLE VIEW */
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right min-w-[700px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">شناگر</th>
                      <th className="px-5 py-3.5">سطح مهارتی</th>
                      <th className="px-5 py-3.5">کلاس / گروه</th>
                      <th className="px-5 py-3.5">مربی تخصیص‌یافته</th>
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

                        {/* Class / Group */}
                        <td className="px-5 py-3.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                          {enr.group ? (
                            <Link
                              to={`/admin/classes/${enr.group}`}
                              className="text-sky-600 dark:text-sky-400 hover:underline font-bold inline-flex items-center gap-1"
                            >
                              <span>{enr.group_name}</span>
                              <span className="text-[10px]">↗</span>
                            </Link>
                          ) : (
                            <span className="text-slate-400 italic">بدون کلاس</span>
                          )}
                        </td>

                        {/* Assigned Coach Dropdown */}
                        <td className="px-5 py-3.5">
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

      {/* 5.1. TAB: COURSE COACHES & DEDICATED CLASSES */}
      {activeTab === 'coaches' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-sky-600" />
                <span>کادر مربیان دوره و کلاس‌های اختصاصی ({course.coaches?.length || 0} مربی)</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                هر مربی در این دوره دارای یک کلاس/لاین اختصاصی است. می‌توانید مربی جدید اضافه کرده یا ظرفیت شاگردان هر کلاس را پایش کنید.
              </p>
            </div>

            <Button
              onClick={() => setIsAddCoachModalOpen(true)}
              size="sm"
              className="gap-2 text-xs bg-sky-600 hover:bg-sky-700 text-white shrink-0 self-start sm:self-center cursor-pointer shadow-sm shadow-sky-500/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>افزودن مربی جدید به دوره</span>
            </Button>
          </div>

          {(course.coaches || []).length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
              <EmptyState
                title="هنوز مربی برای این دوره تعیین نشده است"
                description="برای تشکیل کلاس‌های اختصاصی دوره، حداقل یک مربی از کادر آموزشگاه به دوره بیفزایید."
              />
              <div className="pt-4 flex justify-center">
                <Button
                  onClick={() => setIsAddCoachModalOpen(true)}
                  className="gap-2 text-xs bg-sky-600 hover:bg-sky-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن اولین مربی به دوره</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(course.coaches || []).map((c) => {
                const group = getCoachGroup(c.id, c.full_name);
                const swimmerCount = getCoachSwimmersCount(c.id);
                const capacity = group?.capacity || 15;
                const remaining = Math.max(0, capacity - swimmerCount);
                const isFull = remaining <= 0;

                return (
                  <div
                    key={c.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3.5">
                      {/* Coach Header */}
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
                            <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                              مربی {c.full_name}
                            </h3>
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
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                          <span className="text-slate-400">شناگران اختصاصی کلاس:</span>
                          <span className="font-black font-mono text-slate-900 dark:text-white text-sm">
                            {swimmerCount} <span className="text-xs font-normal text-slate-400">نفر</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                          <span className="text-slate-400">ظرفیت مجاز لاین:</span>
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
                          setActiveTab('swimmers');
                          setCoachFilter(String(c.id));
                        }}
                        className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="مشاهده شاگردان کلاس این مربی"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>شاگردان ({swimmerCount})</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {group && (
                          <Link
                            to={`/admin/classes/${group.id}`}
                            className="p-1.5 px-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors inline-flex items-center gap-1"
                            title="ورود به فضای کلاس"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>کلاس</span>
                          </Link>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveCoachFromCourse(c.id, c.full_name)}
                          className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700 transition-colors cursor-pointer"
                          title="حذف مربی از این دوره"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 2: CLASSES & LANES */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                کلاس‌ها و لاین‌های آموزشی این دوره
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                هر کلاس به یک مربی و لاین مجزا در استخر اختصاص دارد
              </p>
            </div>
            <Button
              onClick={() => navigate('/admin/courses?action=new-group')}
              size="sm"
              className="gap-1.5 text-xs bg-sky-600 hover:bg-sky-700 text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ایجاد گروه کلاسی جدید</span>
            </Button>
          </div>

          {groups.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
              <EmptyState
                title="هنوز گروه کلاسی برای این دوره تعریف نشده است"
                description="برای تفکیک شناگران بر اساس مربی یا سطح، می‌توانید گروه کلاسی جدید ایجاد کنید."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {groups.map((group) => {
                const isFull = group.remaining_capacity <= 0;
                return (
                  <div
                    key={group.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 rounded-lg">
                          {group.level_name || 'سطح پایه'}
                        </span>
                        <Badge variant={isFull ? 'danger' : 'success'}>
                          {isFull ? 'تکمیل ظرفیت' : 'ثبت‌نام باز'}
                        </Badge>
                      </div>

                      <div className="py-3 space-y-2.5">
                        <Link
                          to={`/admin/classes/${group.id}`}
                          className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors block"
                        >
                          <h3 className="font-bold text-slate-900 dark:text-white text-base">
                            {group.name}
                          </h3>
                        </Link>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{group.pool_location || course.pool_location}</span>
                        </div>

                        {/* Capacity Bar */}
                        <div className="pt-2">
                          <ProgressBar
                            label="وضعیت پذیرش لاین"
                            value={group.current_enrollments_count || 0}
                            max={group.capacity || 15}
                            color={isFull ? 'rose' : (group.remaining_capacity || 15) < 3 ? 'amber' : 'emerald'}
                            subtitle={`${group.current_enrollments_count || 0} نفر ثبت‌نام‌شده (${group.remaining_capacity || group.capacity || 15} جای خالی)`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-mono">ظرفیت: {group.capacity || 15} نفر</span>
                      <Link
                        to={`/admin/classes/${group.id}`}
                        className="text-sky-600 dark:text-sky-400 font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <span>ورود به فضای کلاس</span>
                        <span className="text-sm">←</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                  {course.days_of_week} ({course.time_display})
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">تعداد کل جلسات:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {course.sessions_count || 12} جلسه
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
                    ? `تا ${course.installments_count} قسط`
                    : 'پرداخت نقدی یکجا'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Coach to Course */}
      <Modal
        isOpen={isAddCoachModalOpen}
        onClose={() => {
          setIsAddCoachModalOpen(false);
          setSelectedNewCoach('');
        }}
        title="افزودن مربی جدید به دوره و تشکیل کلاس اختصاصی"
      >
        <div className="space-y-4 py-2">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            با انتخاب مربی از کادر آموزشگاه، یک کلاس اختصاصی با عنوان «کلاس مربی [نام]» به طور خودکار به این دوره افزوده شده و برنامه زمانی و استخر دوره به آن منتسب خواهد شد.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              انتخاب مربی از کادر آکادمی:
            </label>
            {unassignedCoaches.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 text-center">
                همه مربیان موجود در سیستم در حال حاضر به این دوره تخصیص یافته‌اند.
              </div>
            ) : (
              <select
                value={selectedNewCoach}
                onChange={(e) => setSelectedNewCoach(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="">-- لطفاً یک مربی را انتخاب کنید --</option>
                {unassignedCoaches.map((c) => (
                  <option key={c.id} value={c.id}>
                    مربی: {c.full_name} {c.specialties ? `(${c.specialties})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddCoachModalOpen(false);
                setSelectedNewCoach('');
              }}
              disabled={addingCoach}
            >
              انصراف
            </Button>
            <Button
              size="sm"
              onClick={() => handleAddCoachToCourse(selectedNewCoach)}
              disabled={!selectedNewCoach || addingCoach}
              className="gap-1.5 bg-sky-600 hover:bg-sky-700 text-white"
            >
              {addingCoach ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>در حال افزودن و همگام‌سازی...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن مربی و تشکیل کلاس</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
