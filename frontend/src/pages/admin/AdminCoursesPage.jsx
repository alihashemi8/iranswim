import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, Plus, Clock, MapPin, Users,
  Calendar, GraduationCap, ChevronLeft,
  LayoutGrid, List, Search, X, Layers,
  CheckCircle2
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { StatsCard } from '../../components/common/StatsCard';
import { SessionsScheduleTimetable } from '../../components/common/SessionsScheduleTimetable';
import { CustomSelect } from '../../components/common/CustomSelect';
import { CourseLogoIcon } from '../../components/common/AquaticIcons';
import { useToast } from '../../context/ToastContext';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';

export const AdminCoursesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const initialTab = rawTab === 'SESSIONS' ? 'SESSIONS' : 'COURSES';
  const [activeTab, setActiveTab] = useState(initialTab); // 'COURSES' | 'SESSIONS'
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [levels, setLevels] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('ALL');

  // View Mode: 'cards' | 'table' (persisted in localStorage)
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('admin_courses_view_mode') || 'cards';
    } catch {
      return 'cards';
    }
  });

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('admin_courses_view_mode', mode);
    } catch {
      // ignore storage errors
    }
  };

  // Mobile detection (< 768px): Mobile ALWAYS strictly uses 'cards' view
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effective view mode: mobile forces 'cards', desktop/tablet respects viewMode
  const effectiveViewMode = isMobile ? 'cards' : viewMode;

  // Create SwimmerGroup Modal
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({
    course: '',
    name: '',
    skill_level: '',
    capacity: 15,
    pool_location: 'استخر شهید رئیسی',
  });
  const [savingGroup, setSavingGroup] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, groupsRes, levelsRes, sessionsRes, coachesRes] = await Promise.all([
        api.get('/education/courses/'),
        api.get('/education/groups/'),
        api.get('/education/levels/'),
        api.get('/scheduling/sessions/'),
        api.get('/coaches/'),
      ]);
      setCourses(coursesRes.data.results || coursesRes.data || []);
      setGroups(groupsRes.data.results || groupsRes.data || []);
      setLevels(levelsRes.data.results || levelsRes.data || []);
      setSessions(sessionsRes.data.results || sessionsRes.data || []);
      setCoaches(coachesRes.data.results || coachesRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت اطلاعات کلاس‌ها و دوره‌های آموزشی');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Quick Action deep link
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new-group') {
      setIsGroupModalOpen(true);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('action');
        return next;
      }, { replace: true });
    } else if (action === 'new-course') {
      navigate('/admin/courses/new');
    }
  }, [searchParams, setSearchParams, navigate]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupForm.course || !groupForm.skill_level || !groupForm.name) {
      toast.error('لطفاً تمام فیلدهای الزامی کلاس را پر کنید.');
      return;
    }
    try {
      setSavingGroup(true);
      await api.post('/education/groups/', {
        ...groupForm,
        course: Number(groupForm.course),
        skill_level: Number(groupForm.skill_level),
        capacity: Number(groupForm.capacity),
      });
      setIsGroupModalOpen(false);
      setGroupForm({
        course: '',
        name: '',
        skill_level: '',
        capacity: 15,
        pool_location: 'استخر شهید رئیسی',
      });
      toast.success('کلاس جدید با موفقیت تعریف شد.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در ایجاد کلاس');
    } finally {
      setSavingGroup(false);
    }
  };

  const formatPrice = (v) => Number(v || 0).toLocaleString('en-US');

  // Helper to compute course capacity metrics consistently
  const getCourseCapacityInfo = (course) => {
    const courseGroups = (course.groups && course.groups.length > 0)
      ? course.groups
      : groups.filter(
          (g) => Number(g.course) === Number(course.id) || Number(g.course_id) === Number(course.id)
        );

    const totalCapacity = courseGroups.reduce((acc, g) => acc + (Number(g.capacity) || 0), 0);
    const totalEnrolled = courseGroups.reduce((acc, g) => acc + (Number(g.current_enrollments_count) || 0), 0);
    const totalRemaining = Math.max(0, totalCapacity - totalEnrolled);
    const isCourseFull = totalCapacity > 0 && totalRemaining <= 0;
    const fillPercent = totalCapacity > 0 ? Math.min(100, Math.round((totalEnrolled / totalCapacity) * 100)) : 0;

    return {
      courseGroups,
      classesCount: courseGroups.length,
      totalCapacity,
      totalEnrolled,
      totalRemaining,
      isCourseFull,
      fillPercent,
    };
  };

  // Summary statistics for executive KPI bar
  const summaryStats = useMemo(() => {
    const totalCourses = courses.length;
    const activeCourses = courses.filter((c) => c.status === 'ACTIVE').length;
    let totalCap = 0;
    let totalEnr = 0;
    let totalClasses = 0;

    courses.forEach((c) => {
      const cGroups = (c.groups && c.groups.length > 0)
        ? c.groups
        : groups.filter((g) => Number(g.course) === Number(c.id) || Number(g.course_id) === Number(c.id));
      totalClasses += cGroups.length;
      totalCap += cGroups.reduce((acc, g) => acc + (Number(g.capacity) || 0), 0);
      totalEnr += cGroups.reduce((acc, g) => acc + (Number(g.current_enrollments_count) || 0), 0);
    });

    const overallOccupancy = totalCap > 0 ? Math.round((totalEnr / totalCap) * 100) : 0;

    return { totalCourses, activeCourses, totalClasses, totalCap, totalEnr, overallOccupancy };
  }, [courses, groups]);

  // Filtered courses based on search and filters
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = course.name?.toLowerCase().includes(q);
        const matchPool = course.pool_location?.toLowerCase().includes(q);
        const matchDays = course.days_of_week?.toLowerCase().includes(q);
        const matchAge = course.age_range?.toLowerCase().includes(q);
        if (!matchName && !matchPool && !matchDays && !matchAge) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'ALL' && course.status !== statusFilter) {
        return false;
      }

      // Gender filter
      if (genderFilter !== 'ALL' && course.gender !== genderFilter) {
        return false;
      }

      return true;
    });
  }, [courses, searchQuery, statusFilter, genderFilter]);

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'ALL' || genderFilter !== 'ALL';

  return (
    <div className="space-y-6 admin-courses-section" style={{ fontFeatureSettings: '"ss01" 0, "cv01" 1' }}>
      {/* 1. Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CourseLogoIcon className="w-6 h-6 shrink-0 text-sky-600 dark:text-sky-400" />
            <span>برنامه‌ریزی، دوره‌ها و کلاس‌های آموزشی</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            مدیریت دوره‌های آموزشی، کلاس‌ها، کنترل ظرفیت و جدول هفتگی برنامه‌ریزی
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={() => navigate('/admin/courses/new')} className="gap-2 text-sm bg-sky-600 hover:bg-sky-700 text-white">
            <Plus className="w-4 h-4" />
            <span>تعریف دوره جدید</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Tabs: Courses & Classes + Weekly Timetable */}
      <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700 w-full sm:max-w-md shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('COURSES')}
          className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm md:text-base transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'COURSES'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm border border-slate-200/50 dark:border-slate-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-700/40'
          }`}
        >
          <CourseLogoIcon className="w-5 h-5 shrink-0" />
          <span className="whitespace-nowrap">دوره‌ها و کلاس‌ها</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold transition-colors ${
              activeTab === 'COURSES'
                ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {courses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SESSIONS')}
          className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm md:text-base transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'SESSIONS'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm border border-slate-200/50 dark:border-slate-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-700/40'
          }`}
        >
          <Calendar className="w-5 h-5 shrink-0" />
          <span className="whitespace-nowrap">جدول هفتگی</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold transition-colors ${
              activeTab === 'SESSIONS'
                ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {sessions.length || courses.length}
          </span>
        </button>
      </div>

      {loading ? (
        <LoadingState type="cards" count={6} message="در حال دریافت داده‌های آموزشی..." />
      ) : activeTab === 'COURSES' ? (
        /* TAB 1: COURSES (CARDS / TABLE VIEW) */
        <div className="space-y-5">
          {/* 3. Summary Stats KPIs */}
          {courses.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatsCard
                title="کل دوره‌های آموزشی"
                value={`${summaryStats.totalCourses} دوره`}
                subtitle={`${summaryStats.activeCourses} دوره در حال برگزاری`}
                icon={CourseLogoIcon}
                color="sky"
              />
              <StatsCard
                title="کلاس‌های فعال"
                value={`${summaryStats.totalClasses} کلاس`}
                subtitle="در سطوح مهارتی مختلف"
                icon={Layers}
                color="teal"
              />
              <StatsCard
                title="شناگران ثبت‌نامی"
                value={`${summaryStats.totalEnr} نفر`}
                subtitle={`از ظرفیت کل ${summaryStats.totalCap} نفر`}
                icon={Users}
                color="blue"
              />
              <StatsCard
                title="ضریب اشغال ظرفیت"
                value={`${summaryStats.overallOccupancy}%`}
                subtitle={
                  summaryStats.totalCap > summaryStats.totalEnr
                    ? `${summaryStats.totalCap - summaryStats.totalEnr} ظرفیت خالی`
                    : 'ظرفیت تکمیل'
                }
                icon={CheckCircle2}
                color={summaryStats.overallOccupancy > 80 ? 'coral' : 'emerald'}
              />
            </div>
          )}

          {/* 4. Controls Toolbar: Search, Filters & View Mode Switcher */}
          {courses.length > 0 && (
            <div className="space-y-2.5">
              <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-colors">
                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 flex-wrap">
                  {/* Search Input */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="جستجوی نام دوره، استخر، روزهای برگزاری..."
                      className="w-full pr-10 pl-8 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Status Filter */}
                  <CustomSelect
                    value={statusFilter}
                    onChange={(val) => setStatusFilter(val)}
                    options={[
                      { value: 'ALL', label: 'همه وضعیت‌ها' },
                      { value: 'ACTIVE', label: 'در حال برگزاری' },
                      { value: 'UPCOMING', label: 'پیش‌ثبت‌نام' },
                      { value: 'COMPLETED', label: 'خاتمه‌یافته' },
                    ]}
                    size="sm"
                    className="w-full sm:w-40 shrink-0"
                  />

                  {/* Gender Filter */}
                  <CustomSelect
                    value={genderFilter}
                    onChange={(val) => setGenderFilter(val)}
                    options={[
                      { value: 'ALL', label: 'همه جنسیت‌ها' },
                      { value: 'MALE', label: 'پسران / آقایان' },
                      { value: 'FEMALE', label: 'دختران / بانوان' },
                    ]}
                    size="sm"
                    className="w-full sm:w-40 shrink-0"
                  />
                </div>

                {/* View Switcher: ONLY VISIBLE ON DESKTOP & TABLET (HIDDEN ON MOBILE) */}
                <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shrink-0 self-end lg:self-auto">
                  <button
                    type="button"
                    onClick={() => handleViewModeChange('cards')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      effectiveViewMode === 'cards'
                        ? 'bg-sky-600 text-white shadow-2xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                    title="نمایش کارتی"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>کارت‌ها</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewModeChange('table')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      effectiveViewMode === 'table'
                        ? 'bg-sky-600 text-white shadow-2xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                    title="نمایش جدولی"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>جدول</span>
                  </button>
                </div>
              </div>

              {/* Filter feedback & clear button */}
              {hasActiveFilters && (
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>
                    نمایش <strong className="text-slate-900 dark:text-white font-mono">{filteredCourses.length}</strong> دوره
                    از مجموع <strong className="font-mono">{courses.length}</strong> دوره
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('ALL');
                      setGenderFilter('ALL');
                    }}
                    className="text-sky-600 dark:text-sky-400 hover:underline font-bold cursor-pointer"
                  >
                    پاکسازی فیلترها
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 5. Course List Content */}
          {courses.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
              <EmptyState
                title="هنوز دوره‌ای تعریف نشده است"
                description="می‌توانید با کلیک روی دکمه «تعریف دوره جدید»، دوره آموزشی و کلاس‌های مربوطه را ایجاد نمایید."
              />
              <div className="pt-4 flex justify-center">
                <Button onClick={() => navigate('/admin/courses/new')} className="gap-2 text-sm bg-sky-600 hover:bg-sky-700 text-white">
                  <Plus className="w-4 h-4" />
                  <span>تعریف اولین دوره آموزشی</span>
                </Button>
              </div>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
              <EmptyState
                title="دوره‌ای با این مشخصات یافت نشد"
                description="فیلترهای انتخابی یا عبارت جستجوی خود را بررسی کنید."
              />
              <div className="pt-4 flex justify-center">
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setGenderFilter('ALL');
                  }}
                  variant="secondary"
                  className="gap-2 text-sm"
                >
                  <span>پاکسازی فیلترها و نمایش همه دوره‌ها</span>
                </Button>
              </div>
            </div>
          ) : effectiveViewMode === 'cards' ? (
            /* ======================================================== */
            /* VIEW MODE 1: CARDS VIEW (DEFAULT & EXCLUSIVE ON MOBILE)  */
            /* ======================================================== */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredCourses.map((course) => {
                const {
                  classesCount,
                  totalCapacity,
                  totalEnrolled,
                  totalRemaining,
                  isCourseFull,
                  fillPercent,
                } = getCourseCapacityInfo(course);

                return (
                  <div
                    key={course.id}
                    className="group relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-lg hover:border-sky-300 dark:hover:border-sky-700 transition-all duration-200 flex flex-col justify-between"
                  >
                    <div className="space-y-3.5">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <Badge variant={course.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
                          {course.status === 'ACTIVE' ? 'در حال برگزاری' : 'پیش‌ثبت‌نام'}
                        </Badge>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {course.gender && (
                            <Badge variant={course.gender === 'FEMALE' ? 'warning' : 'info'} size="sm">
                              {course.gender_display || (course.gender === 'FEMALE' ? 'بانوان' : 'آقایان')}
                            </Badge>
                          )}
                          {course.age_range && (
                            <Badge variant="violet" size="sm">
                              {course.age_range}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Course Title */}
                      <div>
                        <Link
                          to={`/admin/courses/${course.id}`}
                          className="font-bold text-slate-900 dark:text-white text-base hover:text-sky-600 dark:hover:text-sky-400 transition-colors line-clamp-2 leading-snug block"
                          title={course.name}
                        >
                          {course.name}
                        </Link>
                      </div>

                      {/* Meta Details List */}
                      <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-0.5">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-sky-500 shrink-0" />
                          <span className="truncate">{course.pool_location || 'استخر شهید رئیسی'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-sky-500 shrink-0" />
                          <span className="truncate">
                            {course.days_of_week} {course.time_display ? `(${course.time_display})` : ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 pt-0.5">
                          <span className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{classesCount} کلاس آموزشی</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{course.sessions_count || 12} جلسه</span>
                          </span>
                        </div>
                      </div>

                      {/* Capacity Control Box */}
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">کنترل ظرفیت:</span>
                          {totalCapacity > 0 ? (
                            <span className="font-bold text-slate-900 dark:text-white">
                              {totalEnrolled} / {totalCapacity} نفر
                            </span>
                          ) : (
                            <span className="text-slate-400 font-sans">بدون کلاس</span>
                          )}
                        </div>

                        {totalCapacity > 0 ? (
                          <>
                            <div className="w-full bg-slate-200 dark:bg-slate-700/80 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isCourseFull ? 'bg-rose-500' : totalRemaining < 5 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${fillPercent}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px] pt-0.5">
                              <span
                                className={`font-semibold ${
                                  isCourseFull
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : totalRemaining < 5
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                }`}
                              >
                                {isCourseFull ? 'تکمیل ظرفیت' : `${totalRemaining} جای خالی`}
                              </span>
                              <span className="text-slate-400 font-mono">{fillPercent}% پر شده</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-[11px] text-slate-400">هنوز کلاسی برای این دوره تعریف نشده است.</div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer: Price & Action Button */}
                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block">شهریه دوره</span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-bold font-mono text-slate-900 dark:text-white text-base">
                            {formatPrice(course.base_price)}
                          </span>
                          <span className="text-xs text-slate-500">تومان</span>
                        </div>
                      </div>

                      <Button
                        onClick={() => navigate(`/admin/courses/${course.id}`)}
                        size="sm"
                        className="gap-1.5 text-xs bg-sky-600 hover:bg-sky-700 text-white cursor-pointer shrink-0 shadow-2xs group-hover:bg-sky-700"
                      >
                        <span>ورود به دوره</span>
                        <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ======================================================== */
            /* VIEW MODE 2: TABLE VIEW (DESKTOP & TABLET PREFERENCE)    */
            /* ======================================================== */
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right min-w-[760px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5 rounded-r-xl whitespace-nowrap">دوره آموزشی</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">رده سنی و جنسیت</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">زمان و مکان برگزاری</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">شهریه و جلسات</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">ظرفیت و کلاس‌ها</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">وضعیت</th>
                      <th className="px-4 py-3.5 text-center rounded-l-xl whitespace-nowrap">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {filteredCourses.map((course) => {
                      const {
                        classesCount,
                        totalCapacity,
                        totalEnrolled,
                        totalRemaining,
                        isCourseFull,
                        fillPercent,
                      } = getCourseCapacityInfo(course);

                      return (
                        <tr
                          key={course.id}
                          className="hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* 1. Course Name & Icon */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                                <CourseLogoIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <Link
                                  to={`/admin/courses/${course.id}`}
                                  className="font-bold text-slate-900 dark:text-white text-sm hover:text-sky-600 dark:hover:text-sky-400 transition-colors block"
                                >
                                  {course.name}
                                </Link>
                                <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5">
                                  {classesCount} کلاس تعریف‌شده
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Target & Gender */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {course.gender && (
                                <Badge variant={course.gender === 'FEMALE' ? 'warning' : 'info'} size="sm">
                                  {course.gender_display || (course.gender === 'FEMALE' ? 'بانوان' : 'آقایان')}
                                </Badge>
                              )}
                              {course.age_range && (
                                <Badge variant="violet" size="sm">
                                  {course.age_range}
                                </Badge>
                              )}
                            </div>
                          </td>

                          {/* 3. Location & Schedule */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                                <span>{course.pool_location || 'استخر شهید رئیسی'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                <span>{course.days_of_week} {course.time_display ? `(${course.time_display})` : ''}</span>
                              </div>
                            </div>
                          </td>

                          {/* 4. Price & Sessions */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div>
                              <span className="font-bold font-mono text-slate-900 dark:text-white text-sm block">
                                {formatPrice(course.base_price)} <span className="text-xs font-normal text-slate-500">تومان</span>
                              </span>
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5">
                                {course.sessions_count || 12} جلسه آموزشی
                              </span>
                            </div>
                          </td>

                          {/* 5. Capacity */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            {totalCapacity > 0 ? (
                              <div className="min-w-[130px]">
                                <div className="flex items-center justify-between text-xs font-mono mb-1">
                                  <span className="text-[11px] text-slate-400 font-sans">ظرفیت:</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {totalEnrolled} / {totalCapacity} نفر
                                  </span>
                                </div>
                                <div className="w-32 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden mb-1">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      isCourseFull ? 'bg-rose-500' : totalRemaining < 5 ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${fillPercent}%` }}
                                  />
                                </div>
                                <span
                                  className={`text-[10px] font-semibold ${
                                    isCourseFull
                                      ? 'text-rose-600 dark:text-rose-400'
                                      : totalRemaining < 5
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-emerald-600 dark:text-emerald-400'
                                  }`}
                                >
                                  {isCourseFull ? 'تکمیل ظرفیت' : `${totalRemaining} جای خالی (${fillPercent}%)`}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">بدون کلاس</span>
                            )}
                          </td>

                          {/* 6. Status */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Badge variant={course.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
                              {course.status === 'ACTIVE' ? 'در حال برگزاری' : 'پیش‌ثبت‌نام'}
                            </Badge>
                          </td>

                          {/* 7. Action Button */}
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <Button
                              onClick={() => navigate(`/admin/courses/${course.id}`)}
                              size="sm"
                              className="gap-1 text-xs bg-sky-600 hover:bg-sky-700 text-white cursor-pointer shadow-2xs"
                            >
                              <span>ورود به دوره</span>
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: CALENDAR & SESSIONS TIMETABLE */
        <SessionsScheduleTimetable
          courses={courses}
          sessions={sessions}
          groups={groups}
          coaches={coaches}
          onRefresh={fetchData}
        />
      )}

      {/* Modal: Create SwimmerGroup */}
      <Modal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        title="تعریف کلاس جدید برای دوره"
      >
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              دوره آموزشی والد *
            </label>
            <CustomSelect
              value={groupForm.course}
              onChange={(val) => setGroupForm({ ...groupForm, course: val })}
              options={courses.map((c) => ({
                value: c.id,
                label: `${c.name} (${formatPrice(c.base_price)} تومان)`,
              }))}
              placeholder="یک دوره را انتخاب کنید..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              نام کلاس *
            </label>
            <input
              type="text"
              required
              value={groupForm.name}
              onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
              placeholder="مثال: کلاس مقدماتی شنبه و دوشنبه ساعت ۱۷"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                سطح مهارت کلاس *
              </label>
              <CustomSelect
                value={groupForm.skill_level}
                onChange={(val) => setGroupForm({ ...groupForm, skill_level: val })}
                options={levels.map((lvl) => ({
                  value: lvl.id,
                  label: `سطح ${lvl.order}: ${lvl.name}`,
                }))}
                placeholder="انتخاب سطح..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ظرفیت مجاز کلاس (نفر) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="50"
                value={groupForm.capacity}
                onChange={(e) => setGroupForm({ ...groupForm, capacity: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              استخر و محل برگزاری
            </label>
            <input
              type="text"
              value={groupForm.pool_location}
              onChange={(e) => setGroupForm({ ...groupForm, pool_location: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsGroupModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={savingGroup}>
              {savingGroup ? 'در حال ثبت...' : 'تعریف کلاس'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
