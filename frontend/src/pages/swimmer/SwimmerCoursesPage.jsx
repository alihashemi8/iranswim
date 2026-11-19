import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  BookOpen, Calendar, Clock, MapPin, Users, User, CheckCircle2,
  AlertCircle, Search, DollarSign, CreditCard, ArrowRight,
  Sparkles, ChevronDown, ChevronUp, Check, Info, X,
  GraduationCap, ArrowLeft, RefreshCw, Eye,
  ArrowRightLeft, CheckCircle, Award, Copy, Building2
} from 'lucide-react';
import { SwimCourseSpecsIcon, CourseLogoIcon } from '../../components/common/AquaticIcons';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSwimmer } from '../../context/SwimmerContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingState, Skeleton } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { CustomSelect } from '../../components/common/CustomSelect';
import { ProgressBar } from '../../components/common/Charts';
import { toShamsiDate } from '../../utils/date';
import { formatCardNumberWithDashes, copyCardToClipboard, getBankNameFromCard } from '../../utils/bankCard';
import { getMediaUrl } from '../../utils/media';

// Specialized Card Skeletons for smooth loading in both tabs
const EnrolledCourseSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 animate-pulse">
    <div className="flex items-start justify-between gap-2">
      <div className="space-y-2">
        <Skeleton className="h-3 w-28 rounded-md" />
        <Skeleton className="h-5 w-48 rounded-lg" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <Skeleton className="h-14 rounded-xl" />
      <Skeleton className="h-14 rounded-xl" />
    </div>
    <Skeleton className="h-14 rounded-2xl" />
    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
      <Skeleton className="h-4 w-36 rounded-md" />
      <Skeleton className="h-4 w-28 rounded-md" />
    </div>
  </div>
);

const SessionCardSkeleton = () => (
  <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 animate-pulse">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-28 rounded-md" />
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
    <Skeleton className="h-4 w-44 rounded-md" />
    <div className="space-y-2 pt-1">
      <Skeleton className="h-3.5 w-36 rounded-md" />
      <Skeleton className="h-3.5 w-32 rounded-md" />
      <Skeleton className="h-3.5 w-40 rounded-md" />
    </div>
    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
      <Skeleton className="h-4 w-36 rounded-md" />
    </div>
  </div>
);

const CourseCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs space-y-4 animate-pulse">
    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800" />
    <div className="p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-5 w-20 rounded-xl" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4 rounded-lg" />
        <Skeleton className="h-3.5 w-full rounded-md" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl col-span-2" />
        <Skeleton className="h-12 rounded-xl col-span-2" />
      </div>
      <Skeleton className="h-16 rounded-2xl" />
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <Skeleton className="h-9 flex-1 rounded-xl" />
      </div>
    </div>
  </div>
);

export const SwimmerCoursesPage = () => {
  const { user } = useAuth();
  const { activeSwimmer, activeSwimmerId } = useSwimmer();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Primary data states
  const [courses, setCourses] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Top-level View Tabs: 'MY_COURSES' (دوره‌ها و برنامه جلسات من) | 'REGISTER' (ثبت‌نام دوره‌ها)
  const tabParam = searchParams.get('tab');
  const initialTab =
    tabParam === 'register' || tabParam === 'catalog' || tabParam === 'courses'
      ? 'REGISTER'
      : 'MY_COURSES';

  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab with URL search parameter
  useEffect(() => {
    if (tabParam === 'plans') {
      navigate('/swimmer/plans', { replace: true });
    } else if (tabParam === 'register' || tabParam === 'catalog' || tabParam === 'courses') {
      setActiveTab('REGISTER');
    } else if (tabParam === 'schedule' || tabParam === 'my-courses' || tabParam === 'sessions') {
      setActiveTab('MY_COURSES');
    }
  }, [tabParam, navigate]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const tabUrlVal = newTab === 'MY_COURSES' ? 'my-courses' : 'register';
    setSearchParams({ tab: tabUrlVal }, { replace: true });
  };

  // Search Query for matched courses
  const [searchQuery, setSearchQuery] = useState('');

  // Sessions Filter: 'ALL' | 'UPCOMING' | 'PAST'
  const [sessionsFilter, setSessionsFilter] = useState('ALL');

  // Modals & Interactivity
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState(null);
  const [selectedCourseForEnroll, setSelectedCourseForEnroll] = useState(null);
  const [expandedSyllabusId, setExpandedSyllabusId] = useState(null);

  // Enrollment Form State
  const [enrollSubmitting, setEnrollSubmitting] = useState(false);
  const [enrollForm, setEnrollForm] = useState({
    selectedCoachId: null,
    selectedInstallments: 1,
    notes: '',
  });

  // Fetch all necessary data concurrently
  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const params = activeSwimmerId ? { swimmer_id: activeSwimmerId } : {};

      const [courseRes, profileRes, enrRes, reqRes, sessRes] = await Promise.allSettled([
        api.get('/education/courses/', { params }),
        api.get('/swimmers/me/', { params }),
        api.get('/education/enrollments/', { params }),
        api.get('/education/requests/', { params }),
        api.get('/scheduling/sessions/', { params }),
      ]);

      if (courseRes.status === 'fulfilled') {
        const d = courseRes.value.data;
        setCourses(Array.isArray(d) ? d : d.results || []);
      }
      if (profileRes.status === 'fulfilled') {
        setProfileData(profileRes.value.data);
      }
      if (enrRes.status === 'fulfilled') {
        const d = enrRes.value.data;
        const list = Array.isArray(d) ? d : d.results || [];
        setMyEnrollments(list);
        const currentUrlTab = new URLSearchParams(window.location.search).get('tab');
        if (!currentUrlTab && list.length === 0) {
          setActiveTab('REGISTER');
        }
      }
      if (reqRes.status === 'fulfilled') {
        const d = reqRes.value.data;
        setMyRequests(Array.isArray(d) ? d : d.results || []);
      }
      if (sessRes.status === 'fulfilled') {
        const d = sessRes.value.data;
        setSessions(Array.isArray(d) ? d : d.results || []);
      }
    } catch (err) {
      console.error('Error fetching courses data:', err);
      toast.error('خطا در بارگذاری دوره‌های آموزشی');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeSwimmerId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Determine current active swimmer attributes
  const currentSwimmer = useMemo(() => {
    return profileData || activeSwimmer || null;
  }, [profileData, activeSwimmer]);

  const swimmerGender = currentSwimmer?.gender || null;
  const swimmerAge = typeof currentSwimmer?.age === 'number' ? currentSwimmer.age : null;
  const swimmerName = currentSwimmer?.full_name || currentSwimmer?.first_name || 'شناگر محترم';

  // Helper: check if a course strictly matches this swimmer's gender and age
  const checkCourseEligibility = useCallback((course) => {
    if (!course) return { isEligible: true, genderOk: true, ageOk: true };

    // 1. Gender check
    const courseGender = course.gender || 'ALL';
    let genderOk = true;

    if (courseGender !== 'ALL' && swimmerGender) {
      genderOk = courseGender.toUpperCase() === swimmerGender.toUpperCase();
    }

    // 2. Age check
    let ageOk = true;
    const minA = course.min_age !== null && course.min_age !== undefined ? Number(course.min_age) : null;
    const maxA = course.max_age !== null && course.max_age !== undefined ? Number(course.max_age) : null;

    if (swimmerAge !== null) {
      if (minA !== null && swimmerAge < minA) {
        ageOk = false;
      } else if (maxA !== null && swimmerAge > maxA) {
        ageOk = false;
      }
    }

    return {
      isEligible: genderOk && ageOk,
      genderOk,
      ageOk,
    };
  }, [swimmerGender, swimmerAge]);

  // Helper: check enrollment status of a course for current swimmer
  const getEnrollmentInfo = useCallback((courseId) => {
    const enr = myEnrollments.find(
      (e) => String(e.course || e.course_id) === String(courseId)
    );
    if (enr) {
      return {
        isEnrolled: true,
        status: enr.status,
        enrollmentId: enr.id,
        coachName: enr.coach_name || 'مربی تخصیص‌یافته',
      };
    }

    const req = myRequests.find(
      (r) => String(r.course || r.course_id) === String(courseId) && r.status === 'PENDING'
    );
    if (req) {
      return {
        isEnrolled: false,
        hasPendingRequest: true,
        requestId: req.id,
      };
    }

    return { isEnrolled: false, hasPendingRequest: false };
  }, [myEnrollments, myRequests]);

  // Filtered strictly to MATCHED courses without requiring the swimmer to choose categories
  const filteredRegistrationCourses = useMemo(() => {
    return courses.filter((course) => {
      // Must be eligible for this swimmer!
      const eligibility = checkCourseEligibility(course);
      if (!eligibility.isEligible) return false;

      // Search Query (name, pool, coach, description)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = course.name?.toLowerCase().includes(q);
        const poolMatch = course.pool_location?.toLowerCase().includes(q);
        const descMatch = course.description?.toLowerCase().includes(q);
        const coachMatch = (course.coaches || []).some((c) =>
          c.full_name?.toLowerCase().includes(q)
        );
        if (!nameMatch && !poolMatch && !descMatch && !coachMatch) return false;
      }

      return true;
    });
  }, [courses, searchQuery, checkCourseEligibility]);

  // Filtered sessions
  const nowStr = new Date().toISOString().split('T')[0];
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (sessionsFilter === 'UPCOMING') return s.session_date >= nowStr;
      if (sessionsFilter === 'PAST') return s.session_date < nowStr;
      return true;
    });
  }, [sessions, sessionsFilter, nowStr]);

  const upcomingSessionsCount = useMemo(() => {
    return sessions.filter((s) => s.session_date >= nowStr).length;
  }, [sessions, nowStr]);

  // Statistics counters
  const stats = useMemo(() => {
    let matchedCount = 0;
    courses.forEach((c) => {
      const el = checkCourseEligibility(c);
      if (el.isEligible) matchedCount++;
    });

    const totalRemainingQuota = myEnrollments.reduce(
      (acc, curr) => acc + (curr.remaining_sessions || 0),
      0
    );

    return {
      totalCourses: courses.length,
      matchedCount,
      enrolledCount: myEnrollments.length,
      pendingRequestsCount: myRequests.filter((r) => r.status === 'PENDING').length,
      totalRemainingQuota,
    };
  }, [courses, myEnrollments, myRequests, checkCourseEligibility]);

  // Open enrollment modal for a course
  const handleOpenEnrollModal = (course) => {
    const defaultCoachId = course.coaches && course.coaches.length > 0 ? course.coaches[0].id : null;
    setEnrollForm({
      selectedCoachId: defaultCoachId,
      selectedInstallments: 1,
      notes: '',
    });
    setSelectedCourseForEnroll(course);
  };

  // Submit enrollment request
  const handleSubmitEnrollment = async (e) => {
    if (e) e.preventDefault();
    if (!selectedCourseForEnroll) return;

    try {
      setEnrollSubmitting(true);
      const payload = {
        course: selectedCourseForEnroll.id,
        coach: enrollForm.selectedCoachId || undefined,
        selected_installments: Number(enrollForm.selectedInstallments || 1),
        notes: enrollForm.notes || '',
        swimmer: activeSwimmerId || undefined,
      };

      await api.post('/education/requests/submit/', payload);
      toast.success(
        `درخواست پیش‌ثبت‌نام شما برای دوره «${selectedCourseForEnroll.name}» با موفقیت ثبت گردید.`
      );
      setSelectedCourseForEnroll(null);
      await loadData(true);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ارسال درخواست ثبت‌نام.');
    } finally {
      setEnrollSubmitting(false);
    }
  };

  // Format currency helper
  const formatTomans = (val) => {
    if (!val) return '۰';
    const num = Math.round(Number(val));
    return num.toLocaleString('fa-IR');
  };

  const getSessionStatusBadge = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge variant="teal">برنامه‌ریزی‌شده</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">برگزارشده</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">لغوشده (حفظ سهمیه)</Badge>;
      case 'RESCHEDULED':
        return <Badge variant="coral">جابه‌جاشده</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-16" dir="rtl">
      {/* 1. HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-sky-700 to-teal-600 text-white p-5 sm:p-7 shadow-lg">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-400/15 rounded-full blur-2xl pointer-events-none translate-x-1/3 translate-y-1/3" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-sky-100 border border-white/20">
            <CourseLogoIcon className="w-4 h-4 text-cyan-200" />
            <span>پرتال آموزشی و برنامه کلاس‌های شنا</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>دوره‌ها و برنامه کلاس‌های آموزشی</span>
          </h1>
          <p className="text-xs sm:text-sm text-sky-100/90 max-w-2xl leading-relaxed">
            مشاهده دوره‌های فعال، زمان‌بندی جلسات استخر و ثبت‌نام در دوره‌های متناسب با شرایط سنی و مهارتی شما
          </p>
        </div>
      </div>

      {/* 2. STATS OVERVIEW ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              دوره‌های فعال من
            </div>
            {loading ? (
              <Skeleton className="h-7 w-16 rounded-md my-0.5" />
            ) : (
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                {stats.enrolledCount} <span className="text-xs font-normal text-slate-400">کلاس</span>
              </div>
            )}
          </div>
          <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-200/80 dark:border-teal-900/60 p-4 shadow-2xs flex items-center justify-between bg-gradient-to-br from-teal-500/5 to-transparent">
          <div>
            <div className="text-xs font-semibold text-teal-700 dark:text-teal-400 mb-1">
              مانده سهمیه جلسات دوره
            </div>
            {loading ? (
              <Skeleton className="h-7 w-16 rounded-md my-0.5" />
            ) : (
              <div className="text-xl sm:text-2xl font-black text-teal-600 dark:text-teal-400 font-mono">
                {stats.totalRemainingQuota} <span className="text-xs font-normal text-slate-400">جلسه</span>
              </div>
            )}
          </div>
          <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              جلسات پیش‌رو
            </div>
            {loading ? (
              <Skeleton className="h-7 w-16 rounded-md my-0.5" />
            ) : (
              <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {upcomingSessionsCount} <span className="text-xs font-normal text-slate-400">سانس</span>
              </div>
            )}
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 p-4 shadow-2xs flex items-center justify-between bg-gradient-to-br from-emerald-500/5 to-transparent">
          <div>
            <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>دوره‌های متناسب قابل ثبت‌نام</span>
            </div>
            {loading ? (
              <Skeleton className="h-7 w-16 rounded-md my-0.5" />
            ) : (
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {filteredRegistrationCourses.length} <span className="text-xs font-normal text-slate-400">دوره</span>
              </div>
            )}
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. NAVIGATION TABS */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Tab 1: My Courses & Class Schedule */}
            <button
              type="button"
              onClick={() => handleTabChange('MY_COURSES')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'MY_COURSES'
                  ? 'bg-gradient-to-r from-teal-600 to-sky-600 text-white shadow-xs scale-102 ring-2 ring-teal-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>دوره‌ها و برنامه جلسات من</span>
              {loading ? (
                <span className="w-4 h-4 rounded-full bg-white/20 animate-pulse" />
              ) : myEnrollments.length > 0 && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeTab === 'MY_COURSES'
                      ? 'bg-white/20 text-white'
                      : 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                  }`}
                >
                  {myEnrollments.length}
                </span>
              )}
            </button>

            {/* Tab 2: Course Registration (ثبت‌نام دوره‌ها) */}
            <button
              type="button"
              onClick={() => handleTabChange('REGISTER')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'REGISTER'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-xs scale-102 ring-2 ring-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>ثبت‌نام دوره‌ها</span>
              {loading ? (
                <span className="w-4 h-4 rounded-full bg-white/20 animate-pulse" />
              ) : (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeTab === 'REGISTER'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {filteredRegistrationCourses.length}
                </span>
              )}
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-sky-600 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl transition-all cursor-pointer self-end sm:self-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-600' : ''}`} />
            <span>به‌روزرسانی</span>
          </button>
        </div>
      </div>

      {/* 4. TAB 1 CONTENT: MY COURSES & CLASS SCHEDULE */}
      {activeTab === 'MY_COURSES' && (
        <div className="space-y-6">
          {/* Active Enrolled Courses Overview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-teal-600" />
                <span>کلاس‌ها و دوره‌های ثبت‌نام‌شده من</span>
              </h2>
              <Link
                to="/swimmer/support?category=SCHEDULE"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-colors"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>درخواست جابه‌جایی یا اعلام غیبت</span>
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EnrolledCourseSkeleton />
                <EnrolledCourseSkeleton />
              </div>
            ) : myEnrollments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myEnrollments.map((enr) => {
                  const courseDetail = courses.find(
                    (c) => String(c.id) === String(enr.course || enr.course_id)
                  );
                  const attended = Number(enr.sessions_attended || 0);
                  const totalPurchased = Number(enr.sessions_purchased || enr.sessions_count || 12);
                  const remaining = enr.remaining_sessions ?? Math.max(0, totalPurchased - attended);
                  const progressPct = Math.min(100, Math.round((attended / (totalPurchased || 1)) * 100));

                  return (
                    <div
                      key={enr.id}
                      className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-teal-300 dark:hover:border-teal-800 transition-all flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 block mb-0.5">
                              {enr.group_name ? `کلاس ${enr.group_name}` : 'کلاس آموزشی شنا'}
                            </span>
                            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                              {enr.course_name || enr.course_title || courseDetail?.name || 'دوره آموزشی'}
                            </h3>
                          </div>
                          <Badge variant={enr.status === 'ACTIVE' ? 'success' : 'neutral'}>
                            {enr.status_display || (enr.status === 'ACTIVE' ? 'در حال برگزاری' : 'فعال')}
                          </Badge>
                        </div>

                        {/* Specs overview */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 block mb-0.5">مربی مسئول:</span>
                            <div className="font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span className="truncate">{enr.coach_name || courseDetail?.coaches?.[0]?.full_name || 'کادر فنی آکادمی'}</span>
                            </div>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 block mb-0.5">محل استخر:</span>
                            <div className="font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span className="truncate">{enr.course_pool || courseDetail?.pool_location || 'استخر اصلی آموزشگاه'}</span>
                            </div>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 block mb-0.5">روزها و ساعت برگزاری:</span>
                            <div className="font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span className="truncate">
                                {courseDetail?.days_of_week || enr.course_days || 'جلسات هفتگی'} {(courseDetail?.time_display || enr.course_time) ? `(${courseDetail?.time_display || enr.course_time})` : ''}
                              </span>
                            </div>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 block mb-0.5">بازه زمانی دوره:</span>
                            <div className="font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1 font-mono text-[11px]">
                              <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span className="truncate">
                                {(courseDetail?.start_date || enr.course_start_date) ? (
                                  <>
                                    از {toShamsiDate(courseDetail?.start_date || enr.course_start_date).shortNumeric || (courseDetail?.start_date || enr.course_start_date)} تا {toShamsiDate(courseDetail?.end_date || enr.course_end_date).shortNumeric || (courseDetail?.end_date || enr.course_end_date)}
                                  </>
                                ) : 'مصوب مدیریت'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Sessions Progress Bar */}
                        <div className="bg-teal-50/70 dark:bg-teal-950/40 p-3 rounded-2xl border border-teal-200/60 dark:border-teal-900/40 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                            <span className="flex items-center gap-1 text-teal-800 dark:text-teal-300">
                              <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
                              <span>{attended} از {totalPurchased} جلسه سپری‌شده</span>
                            </span>
                            <span className="font-mono text-teal-700 dark:text-teal-300">
                              مانده: <strong>{remaining} جلسه</strong>
                            </span>
                          </div>
                          <ProgressBar progress={progressPct} color="teal" />
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        {courseDetail ? (
                          <button
                            type="button"
                            onClick={() => setSelectedCourseForDetail(courseDetail)}
                            className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>مشاهده سرفصل‌ها و جزئیات دوره</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">ثبت‌نام رسمی در آکادمی</span>
                        )}

                        <Link
                          to={`/swimmer/support?category=SCHEDULE&subject=${encodeURIComponent(
                            `درخواست در رابطه با ${enr.course_name || enr.course_title || 'کلاس شنا'}`
                          )}`}
                          className="text-xs font-bold text-teal-700 dark:text-teal-300 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          <span>غیبت / تغییر سانس</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-xs text-center space-y-3">
                <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200">
                  در حال حاضر در هیچ دوره‌ای ثبت‌نام فعال ندارید
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  می‌توانید دوره‌های متناسب با شرایط سنی و سطح مهارتی خود را در بخش ثبت‌نام دوره‌ها مشاهده و انتخاب نمایید.
                </p>
                <div className="pt-2">
                  <Button variant="primary" onClick={() => handleTabChange('REGISTER')}>
                    مشاهده و ثبت‌نام در دوره‌ها
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Pending Requests Alert if any */}
          {myRequests.filter((r) => r.status === 'PENDING').length > 0 && (
            <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-3xl p-4 sm:p-5 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>درخواست‌های پیش‌ثبت‌نام در انتظار تأیید مدیریت آموزشگاه:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {myRequests
                  .filter((r) => r.status === 'PENDING')
                  .map((req) => (
                    <div
                      key={req.id}
                      className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-2xl border border-amber-200/60 dark:border-amber-900/60 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100">{req.course_name || 'دوره آموزشی'}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {req.selected_installments > 1 ? `تقسیط در ${req.selected_installments} قسط` : 'پرداخت یکجا'}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                        در انتظار بررسی
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Sessions & Pool Schedule Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-sky-600" />
                  <span>زمان‌بندی جلسات استخر و تقویم کلاسی</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  مشاهده تاریخ و ساعت جلسات، وضعیت برگزاری، استخر و اعلام غیبت
                </p>
              </div>

              {/* Sessions Filter Pills */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
                <button
                  type="button"
                  onClick={() => setSessionsFilter('ALL')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    sessionsFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  همه جلسات ({sessions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSessionsFilter('UPCOMING')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    sessionsFilter === 'UPCOMING'
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  جلسات پیش‌رو ({upcomingSessionsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setSessionsFilter('PAST')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    sessionsFilter === 'PAST'
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  جلسات گذشته
                </button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SessionCardSkeleton />
                <SessionCardSkeleton />
              </div>
            ) : filteredSessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSessions.map((sess) => {
                  const shamsi = toShamsiDate(sess.session_date);
                  const displayDate = shamsi.fullText || sess.session_date;

                  return (
                    <div
                      key={sess.id}
                      className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-sky-300 dark:hover:border-sky-800 transition-all flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-black text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                            <span>{displayDate}</span>
                          </span>
                          {getSessionStatusBadge(sess.status)}
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
                          {sess.group_name || 'جلسه تمرینی شنا'}
                        </h3>

                        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            <span>
                              ساعت {sess.start_time?.slice(0, 5)} الی {sess.end_time?.slice(0, 5)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            <span>مربی مسئول: {sess.coach_name || 'کادر فنی آکادمی'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            <span>محل استخر: {sess.pool_name || sess.pool_location || 'مجموعه آبی آموزشگاه'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2 text-xs">
                        <Link
                          to={`/swimmer/support?category=SCHEDULE&subject=${encodeURIComponent(
                            `درخواست در رابطه با جلسه ${displayDate}`
                          )}`}
                          className="font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 inline-flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>درخواست جابه‌جایی یا ثبت غیبت</span>
                        </Link>

                        {sess.status === 'CANCELLED' && (
                          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                            حفظ سهمیه جلسه
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
                  جلسه‌ای در این فیلتر زمانی یافت نشد
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  پس از آغاز دوره‌ها یا زمان‌بندی جدید توسط مدیریت، جلسات کلاسی در اینجا درج خواهند شد.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TAB 2 CONTENT: COURSE REGISTRATION (ثبت‌نام دوره‌ها) */}
      {activeTab === 'REGISTER' && (
        <div className="space-y-6">
          {/* Header & Search Bar - Strictly Matched Courses without Category Selector */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>ثبت‌نام دوره‌ها</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                دوره‌های آموزشی متناسب با شرایط سنی ({swimmerAge !== null ? `${swimmerAge} سال` : 'سن شناگر'}) و جنسیت ({swimmerGender === 'FEMALE' ? 'دختران / بانوان' : 'پسران / آقایان'}) شما
              </p>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="جستجو در دوره‌ها یا مربیان..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-8 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Courses Grid */}
          {loading || refreshing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, idx) => (
                <CourseCardSkeleton key={idx} />
              ))}
            </div>
          ) : filteredRegistrationCourses.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-xs">
              <EmptyState
                title="دوره‌ای با این مشخصات یافت نشد"
                description={
                  searchQuery
                    ? 'نتیجه‌ای برای عبارت جستجوی شما یافت نشد.'
                    : 'در حال حاضر دوره جدیدی متناسب با سن و جنسیت شما ثبت نشده است. به محض تعریف دوره جدید توسط آموزشگاه، در این بخش قابل مشاهده خواهد بود.'
                }
                action={
                  searchQuery ? (
                    <Button variant="outline" onClick={() => setSearchQuery('')}>
                      پاک‌سازی جستجو
                    </Button>
                  ) : null
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredRegistrationCourses.map((course) => {
                const enrInfo = getEnrollmentInfo(course.id);
                const isSyllabusExpanded = expandedSyllabusId === course.id;

                return (
                  <div
                    key={course.id}
                    className="group relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 hover:border-sky-400/80 dark:hover:border-sky-600 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md"
                  >
                    {/* Top Accent Stripe */}
                    <div
                      className={`h-1.5 w-full ${
                        enrInfo.isEnrolled
                          ? 'bg-emerald-500'
                          : enrInfo.hasPendingRequest
                          ? 'bg-amber-500'
                          : 'bg-gradient-to-r from-sky-500 via-cyan-400 to-teal-400'
                      }`}
                    />

                    <div className="p-5 sm:p-6 space-y-4 flex-1">
                      {/* Top Badges Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant={
                              course.status === 'ACTIVE'
                                ? 'success'
                                : course.status === 'UPCOMING'
                                ? 'info'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {course.status === 'ACTIVE' ? 'در حال برگزاری' : 'پیش‌ثبت‌نام'}
                          </Badge>

                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                            <User className="w-3 h-3 text-sky-500" />
                            <span>
                              {course.gender_display || (course.gender === 'FEMALE' ? 'دختران / بانوان' : course.gender === 'MALE' ? 'پسران / آقایان' : 'عمومی (پسران و دختران)')}
                            </span>
                          </span>

                          {enrInfo.isEnrolled && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>ثبت‌نام شده</span>
                            </span>
                          )}

                          {enrInfo.hasPendingRequest && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>در انتظار تأیید</span>
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                          <span>متناسب با شما</span>
                        </span>
                      </div>

                      {/* Course Title & Description */}
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                          {course.name}
                        </h3>
                        {course.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {course.description}
                          </p>
                        )}
                      </div>

                      {/* Specifications Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800/80">
                          <span className="text-[10px] text-slate-400 block mb-0.5">رده سنی مجاز:</span>
                          <div className="font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5 truncate">
                            <Calendar className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                            <span className="truncate">
                              {course.age_range ||
                                (course.min_age && course.max_age
                                  ? `${course.min_age} تا ${course.max_age} سال`
                                  : course.min_age
                                  ? `${course.min_age} سال به بالا`
                                  : 'عموم رده‌ها')}
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800/80">
                          <span className="text-[10px] text-slate-400 block mb-0.5">استخر و محل برگزاری:</span>
                          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                            <span className="truncate">{course.pool_location || 'استخر مرکزی'}</span>
                          </div>
                        </div>

                        <div className="col-span-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800/80">
                          <span className="text-[10px] text-slate-400 block mb-0.5">روزها و ساعات برگزاری:</span>
                          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
                            <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                            <span className="truncate">
                              {course.days_of_week || 'هفتگی'} {course.time_display ? `(${course.time_display})` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="col-span-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800/80">
                          <span className="text-[10px] text-slate-400 block mb-0.5">بازه زمانی برگزاری دوره:</span>
                          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between text-xs gap-2">
                            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 truncate">
                              <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>شروع: <strong>{toShamsiDate(course.start_date).shortNumeric || course.start_date || '—'}</strong></span>
                            </span>
                            <span className="text-slate-400 text-[10px]">الی</span>
                            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 truncate">
                              <span>پایان: <strong>{toShamsiDate(course.end_date).shortNumeric || course.end_date || '—'}</strong></span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Coaches List */}
                      {course.coaches && course.coaches.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                            کادر مربیان دوره ({course.coaches.length} مربی):
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            {course.coaches.map((c) => (
                              <div
                                key={c.id}
                                className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                              >
                                <div className="w-5 h-5 rounded-lg bg-sky-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 overflow-hidden">
                                  {c.avatar ? (
                                    <img src={getMediaUrl(c.avatar)} alt={c.full_name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{c.full_name?.charAt(0) || 'م'}</span>
                                  )}
                                </div>
                                <span>{c.full_name}</span>
                                {c.coaching_degree && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300">
                                    {c.coaching_degree}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Syllabus preview */}
                      {course.what_you_learn && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedSyllabusId(isSyllabusExpanded ? null : course.id)
                            }
                            className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                          >
                            <SwimCourseSpecsIcon className="w-3.5 h-3.5" />
                            <span>آنچه در این دوره یاد می‌گیرید</span>
                            {isSyllabusExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {isSyllabusExpanded && (
                            <div className="mt-2 p-3 bg-sky-50/60 dark:bg-sky-950/30 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed border border-sky-100 dark:border-sky-900 whitespace-pre-line animate-fadeIn">
                              {course.what_you_learn}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Pricing Box */}
                      <div className="bg-gradient-to-r from-slate-50 to-sky-50/50 dark:from-slate-800/80 dark:to-sky-950/30 rounded-2xl p-3 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block">
                            شهریه دوره ({course.sessions_count || 12} جلسه):
                          </span>
                          <div className="text-base font-black text-slate-900 dark:text-slate-100 font-mono">
                            {formatTomans(course.base_price)}{' '}
                            <span className="text-xs font-normal text-slate-500">تومان</span>
                          </div>
                          {course.sessions_count && Number(course.sessions_count) > 0 && (
                            <span className="text-[10px] text-sky-600 dark:text-sky-400 block font-mono">
                              (هر جلسه {formatTomans(Math.round(Number(course.base_price) / Number(course.sessions_count)))} تومان)
                            </span>
                          )}
                        </div>

                        <div className="text-left space-y-1">
                          {course.installments_count && course.installments_count > 1 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                              <CreditCard className="w-3 h-3" />
                              <span>تا {course.installments_count} قسط</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">پرداخت یکجا</span>
                          )}
                          {course.total_capacity > 0 && (
                            <div className="text-[10px] text-slate-400">
                              ظرفیت: {course.total_capacity} نفر
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="p-4 sm:p-5 pt-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCourseForDetail(course)}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="مشاهده جزئیات کامل دوره"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {enrInfo.isEnrolled ? (
                        <Button
                          variant="success"
                          className="flex-1 text-xs font-bold"
                          onClick={() => handleTabChange('MY_COURSES')}
                        >
                          <CheckCircle2 className="w-4 h-4 ml-1.5" />
                          <span>مشاهده در برنامه جلسات</span>
                        </Button>
                      ) : enrInfo.hasPendingRequest ? (
                        <div className="flex-1 text-center py-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800">
                          درخواست شما در انتظار تأیید است
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          className="flex-1 text-xs font-bold"
                          onClick={() => handleOpenEnrollModal(course)}
                        >
                          <span>پیش‌ثبت‌نام در این دوره</span>
                          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. COURSE DETAIL MODAL */}
      {selectedCourseForDetail && (
        <Modal
          isOpen={Boolean(selectedCourseForDetail)}
          onClose={() => setSelectedCourseForDetail(null)}
          title={`مشخصات دوره آموزشی: ${selectedCourseForDetail.name}`}
          size="lg"
        >
          <div className="space-y-5 text-slate-800 dark:text-slate-100" dir="rtl">
            <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-slate-800 dark:to-slate-800/60 p-4 rounded-2xl border border-sky-100 dark:border-slate-700 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Badge variant={selectedCourseForDetail.status === 'ACTIVE' ? 'success' : 'info'}>
                    {selectedCourseForDetail.status === 'ACTIVE' ? 'در حال برگزاری' : 'پیش‌ثبت‌نام'}
                  </Badge>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                    {selectedCourseForDetail.gender_display || (selectedCourseForDetail.gender === 'FEMALE' ? 'دختران / بانوان' : selectedCourseForDetail.gender === 'MALE' ? 'پسران / آقایان' : 'عمومی (پسران و دختران)')}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-sky-600 dark:text-sky-400 font-mono">
                    {formatTomans(selectedCourseForDetail.base_price)} تومان
                  </div>
                  {selectedCourseForDetail.sessions_count > 0 && (
                    <div className="text-[10px] text-slate-500 font-mono">
                      (هر جلسه {formatTomans(Math.round(Number(selectedCourseForDetail.base_price) / Number(selectedCourseForDetail.sessions_count)))} تومان)
                    </div>
                  )}
                </div>
              </div>

              <h4 className="text-base font-bold">{selectedCourseForDetail.name}</h4>
              {selectedCourseForDetail.description && (
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedCourseForDetail.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block text-[11px] mb-1">جنسیت مجاز:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedCourseForDetail.gender_display || (selectedCourseForDetail.gender === 'MALE'
                    ? 'پسران / آقایان'
                    : selectedCourseForDetail.gender === 'FEMALE'
                    ? 'دختران / بانوان'
                    : 'عمومی (پسران و دختران)')}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block text-[11px] mb-1">رده سنی مجاز:</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">
                  {selectedCourseForDetail.age_range ||
                    (selectedCourseForDetail.min_age && selectedCourseForDetail.max_age
                      ? `${selectedCourseForDetail.min_age} تا ${selectedCourseForDetail.max_age} سال`
                      : 'عموم رده‌ها')}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block text-[11px] mb-1">استخر و محل برگزاری:</span>
                <span className="font-bold">{selectedCourseForDetail.pool_location || 'استخر اصلی'}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block text-[11px] mb-1">روزها و ساعت برگزاری:</span>
                <span className="font-bold">
                  {selectedCourseForDetail.days_of_week} ({selectedCourseForDetail.time_display || 'ساعات مصوب'})
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block text-[11px] mb-1">تاریخ آغاز دوره:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{toShamsiDate(selectedCourseForDetail.start_date).fullText || selectedCourseForDetail.start_date || 'تعیین نشده'}</span>
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block text-[11px] mb-1">تاریخ پایان دوره:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{toShamsiDate(selectedCourseForDetail.end_date).fullText || selectedCourseForDetail.end_date || 'تعیین نشده'}</span>
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block text-[11px] mb-1">تعداد جلسات دوره:</span>
                <span className="font-bold font-mono">{selectedCourseForDetail.sessions_count || 12} جلسه</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block text-[11px] mb-1">سقف تعداد اقساط مجاز:</span>
                <span className="font-bold font-mono">
                  {selectedCourseForDetail.installments_count > 1
                    ? `تا ${selectedCourseForDetail.installments_count} قسط`
                    : 'پرداخت یکجا (نقدی)'}
                </span>
              </div>

              {selectedCourseForDetail.total_capacity > 0 && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl col-span-1 sm:col-span-2">
                  <span className="text-slate-400 block text-[11px] mb-1">ظرفیت کل دوره آموزشی:</span>
                  <span className="font-bold font-mono">{selectedCourseForDetail.total_capacity} نفر ظرفیت پذیرش</span>
                </div>
              )}
            </div>

            {selectedCourseForDetail.coaches && selectedCourseForDetail.coaches.length > 0 && (
              <div>
                <h5 className="text-xs font-bold text-slate-500 mb-2">مربیان تعیین‌شده برای این دوره:</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedCourseForDetail.coaches.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center shrink-0 overflow-hidden">
                        {c.avatar ? (
                          <img src={c.avatar} alt={c.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{c.full_name?.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                          <span>{c.full_name}</span>
                          {c.coaching_degree && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                              {c.coaching_degree}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>{c.class_name || 'کلاس اختصاصی مربی'}</span>
                          {c.years_of_experience > 0 && (
                            <span>• {c.years_of_experience} سال سابقه</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedCourseForDetail.what_you_learn && (
              <div>
                <h5 className="text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <SwimCourseSpecsIcon className="w-4 h-4 text-sky-500" />
                  <span>سرفصل‌ها و آنچه در این دوره یاد می‌گیرید:</span>
                </h5>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed border border-slate-200/80 dark:border-slate-700">
                  {selectedCourseForDetail.what_you_learn}
                </div>
              </div>
            )}

            {selectedCourseForDetail.card_number && (
              <div className="bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-sky-600" />
                    <span>اطلاعات حساب بانکی واریز شهریه دوره:</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {getBankNameFromCard(selectedCourseForDetail.card_number)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-sm text-sky-900 dark:text-sky-200 tracking-wider">
                    {formatCardNumberWithDashes(selectedCourseForDetail.card_number)}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyCardToClipboard(selectedCourseForDetail.card_number, 'شماره کارت', toast)}
                    className="p-1.5 rounded-lg bg-sky-200/60 dark:bg-sky-800 hover:bg-sky-300 text-sky-800 dark:text-sky-100 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>کپی شماره کارت</span>
                  </button>
                </div>
                {selectedCourseForDetail.card_holder && (
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    به نام: <strong>{selectedCourseForDetail.card_holder}</strong>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedCourseForDetail(null)}>
                بستن
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  const c = selectedCourseForDetail;
                  setSelectedCourseForDetail(null);
                  handleOpenEnrollModal(c);
                }}
              >
                پیش‌ثبت‌نام در این دوره
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 7. ENROLLMENT REQUEST MODAL */}
      {selectedCourseForEnroll && (
        <Modal
          isOpen={Boolean(selectedCourseForEnroll)}
          onClose={() => setSelectedCourseForEnroll(null)}
          title={`درخواست پیش‌ثبت‌نام در دوره: ${selectedCourseForEnroll.name}`}
          size="md"
        >
          <form onSubmit={handleSubmitEnrollment} className="space-y-4 text-slate-800 dark:text-slate-100" dir="rtl">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">متقاضی دوره:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{swimmerName}</span>
              </div>
              <div className="text-left font-mono">
                <span className="text-slate-400 block text-[11px]">سن و جنسیت:</span>
                <span className="font-bold">
                  {swimmerAge !== null ? `${swimmerAge} سال` : 'سن نامشخص'} | {swimmerGender === 'FEMALE' ? 'دختران' : 'پسران'}
                </span>
              </div>
            </div>

            {/* Course Summary Banner */}
            <div className="bg-gradient-to-r from-sky-50 to-teal-50 dark:from-slate-800 dark:to-slate-800/80 p-3.5 rounded-2xl border border-sky-100 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                  <BookOpen className="w-4 h-4 text-sky-600 shrink-0" />
                  <span className="truncate">{selectedCourseForEnroll.name}</span>
                </h4>
                <span className="text-xs font-black text-sky-700 dark:text-sky-300 font-mono shrink-0">
                  {formatTomans(selectedCourseForEnroll.base_price)} تومان
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span className="truncate">{selectedCourseForEnroll.pool_location || 'استخر مرکزی'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span className="truncate">{selectedCourseForEnroll.days_of_week} ({selectedCourseForEnroll.time_display || 'ساعات مصوب'})</span>
                </div>
                <div className="flex items-center gap-1 col-span-1 sm:col-span-2">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">
                    دوره: از <strong>{toShamsiDate(selectedCourseForEnroll.start_date).shortNumeric || selectedCourseForEnroll.start_date}</strong> تا <strong>{toShamsiDate(selectedCourseForEnroll.end_date).shortNumeric || selectedCourseForEnroll.end_date}</strong> ({selectedCourseForEnroll.sessions_count || 12} جلسه)
                  </span>
                </div>
              </div>
            </div>

            {selectedCourseForEnroll.coaches && selectedCourseForEnroll.coaches.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  انتخاب مربی / کلاس آموزشی *
                </label>
                <CustomSelect
                  value={enrollForm.selectedCoachId}
                  onChange={(val) => setEnrollForm({ ...enrollForm, selectedCoachId: val })}
                  options={selectedCourseForEnroll.coaches.map((c) => ({
                    value: c.id,
                    label: `${c.full_name} (${c.class_name || 'کلاس اختصاصی'}${c.coaching_degree ? ` - ${c.coaching_degree}` : ''})`,
                    icon: User,
                  }))}
                  placeholder="مربی مورد نظر خود را انتخاب کنید..."
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                تعداد اقساط توافقی شهریه
              </label>

              {selectedCourseForEnroll.installments_count && selectedCourseForEnroll.installments_count > 1 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Array.from({ length: selectedCourseForEnroll.installments_count }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setEnrollForm({ ...enrollForm, selectedInstallments: num })}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          enrollForm.selectedInstallments === num
                            ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {num === 1 ? 'یکجا (نقدی)' : `${num} قسط`}
                      </button>
                    ))}
                  </div>

                  {enrollForm.selectedInstallments > 1 && (
                    <div className="p-2.5 bg-sky-50 dark:bg-sky-950/60 rounded-xl text-xs text-sky-800 dark:text-sky-300 flex items-center justify-between font-semibold">
                      <span>مبلغ تقریبی هر قسط:</span>
                      <span className="font-mono font-bold text-sm">
                        {formatTomans(
                          Math.round(Number(selectedCourseForEnroll.base_price) / enrollForm.selectedInstallments)
                        )}{' '}
                        تومان
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span>شرایط پرداخت:</span>
                  <span className="font-bold">پرداخت یکجا (نقدی)</span>
                </div>
              )}
            </div>

            {selectedCourseForEnroll.card_number && (
              <div className="bg-sky-50/90 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-sky-600" />
                    <span>حساب بانکی واریز شهریه / پیش‌پرداخت دوره:</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {getBankNameFromCard(selectedCourseForEnroll.card_number)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <span className="font-mono font-bold text-sm text-sky-900 dark:text-sky-200 tracking-wider">
                    {formatCardNumberWithDashes(selectedCourseForEnroll.card_number)}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyCardToClipboard(selectedCourseForEnroll.card_number, 'شماره کارت', toast)}
                    className="p-1.5 rounded-lg bg-sky-200/60 dark:bg-sky-800 hover:bg-sky-300 text-sky-800 dark:text-sky-100 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>کپی کارت</span>
                  </button>
                </div>
                {selectedCourseForEnroll.card_holder && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    به نام: <strong>{selectedCourseForEnroll.card_holder}</strong>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                یادداشت یا توضیحات برای مدیریت / مربی (اختیاری)
              </label>
              <textarea
                rows={3}
                placeholder="توضیحات تکمیلی یا درخواست زمان‌بندی ویژه..."
                value={enrollForm.notes}
                onChange={(e) => setEnrollForm({ ...enrollForm, notes: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 text-[11px] text-slate-500 space-y-1">
              <span className="font-bold block text-slate-700 dark:text-slate-300">مراحل بعدی:</span>
              <p>
                پس از ارسال، درخواست توسط مدیریت بررسی شده و با تأیید ظرفیت، وضعیت دوره در پنل شما فعال می‌گردد.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={enrollSubmitting}
                onClick={() => setSelectedCourseForEnroll(null)}
              >
                انصراف
              </Button>
              <Button type="submit" variant="primary" disabled={enrollSubmitting} loading={enrollSubmitting}>
                تأیید و ارسال درخواست ثبت‌نام
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
