import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, Calendar, Clock, MapPin, Users, User, CheckCircle2,
  AlertCircle, Search, Filter, DollarSign, CreditCard, ArrowRight,
  Sparkles, ChevronDown, ChevronUp, Layers, Award, ShieldCheck,
  AlertTriangle, Copy, Check, Info, X, SlidersHorizontal, UserCheck,
  GraduationCap, ArrowLeft, RefreshCw, Eye
} from 'lucide-react';
import { SwimCourseSpecsIcon, CourseLogoIcon } from '../../components/common/AquaticIcons';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSwimmer } from '../../context/SwimmerContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { CustomSelect } from '../../components/common/CustomSelect';
import { toShamsiDate } from '../../utils/date';
import { getBankNameFromCard, formatCardNumberWithDashes, copyCardToClipboard } from '../../utils/bankCard';
import { getMediaUrl } from '../../utils/media';

// Quick age category presets for easy filtering
const AGE_CATEGORY_PRESETS = [
  { id: 'ALL', label: 'همه رده‌ها', min: null, max: null },
  { id: 'KIDS', label: 'کودکان و خردسالان (۴ تا ۹ سال)', min: 4, max: 9 },
  { id: 'PRE_TEEN', label: 'نونهالان (۶ تا ۱۲ سال)', min: 6, max: 12 },
  { id: 'TEEN', label: 'نوجوانان (۸ تا ۱۵ سال)', min: 8, max: 15 },
  { id: 'YOUTH', label: 'نوجوانان و بزرگسالان (۱۲ سال به بالا)', min: 12, max: null },
];

export const SwimmerCoursesPage = () => {
  const { user } = useAuth();
  const { activeSwimmer, activeSwimmerId, childrenList, selectChild } = useSwimmer();
  const toast = useToast();
  const navigate = useNavigate();

  // Primary data states
  const [courses, setCourses] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter States
  // 'MATCHED' = متناسب با من (پیش‌فرض) | 'ALL' = همه دوره‌ها | 'MY_COURSES' = دوره‌های من
  const [viewMode, setViewMode] = useState('MATCHED');
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('ALL'); // 'ALL' | 'MALE' | 'FEMALE'
  const [ageCategory, setAgeCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'UPCOMING' | 'ACTIVE'

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

  // Fetch all necessary data
  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const params = activeSwimmerId ? { swimmer_id: activeSwimmerId } : {};

      const [courseRes, profileRes, enrRes, reqRes] = await Promise.allSettled([
        api.get('/education/courses/', { params }),
        api.get('/swimmers/me/', { params }),
        api.get('/education/enrollments/', { params }),
        api.get('/education/requests/', { params }),
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
        setMyEnrollments(Array.isArray(d) ? d : d.results || []);
      }
      if (reqRes.status === 'fulfilled') {
        const d = reqRes.value.data;
        setMyRequests(Array.isArray(d) ? d : d.results || []);
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
  const swimmerLevel = currentSwimmer?.level_name || 'سطح پایه';
  const hasBirthDate = Boolean(currentSwimmer?.date_of_birth);
  const hasGender = Boolean(swimmerGender);

  // Helper: check if a course matches this swimmer's gender and age
  const checkCourseEligibility = useCallback((course) => {
    if (!course) return { isEligible: true, genderOk: true, ageOk: true, reason: '' };

    // 1. Gender check
    const courseGender = course.gender || 'ALL';
    let genderOk = true;
    let genderReason = '';

    if (courseGender !== 'ALL' && swimmerGender) {
      genderOk = courseGender.toUpperCase() === swimmerGender.toUpperCase();
      if (!genderOk) {
        genderReason = courseGender === 'MALE' ? 'مخصوص پسران / آقایان' : 'مخصوص دختران / بانوان';
      }
    }

    // 2. Age check
    let ageOk = true;
    let ageReason = '';
    const minA = course.min_age !== null && course.min_age !== undefined ? Number(course.min_age) : null;
    const maxA = course.max_age !== null && course.max_age !== undefined ? Number(course.max_age) : null;

    if (swimmerAge !== null) {
      if (minA !== null && swimmerAge < minA) {
        ageOk = false;
        ageReason = `حداقل سن ${minA} سال (سن شناگر: ${swimmerAge} سال)`;
      } else if (maxA !== null && swimmerAge > maxA) {
        ageOk = false;
        ageReason = `حداکثر سن ${maxA} سال (سن شناگر: ${swimmerAge} سال)`;
      }
    } else if (minA !== null || maxA !== null) {
      // If swimmer age unknown
      ageReason = 'نیاز به ثبت تاریخ تولد';
    }

    return {
      isEligible: genderOk && ageOk,
      genderOk,
      ageOk,
      genderReason,
      ageReason,
      minA,
      maxA,
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
        status: enr.status, // ACTIVE, PENDING_PAYMENT, COMPLETED, CANCELLED
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

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const eligibility = checkCourseEligibility(course);
      const enrInfo = getEnrollmentInfo(course.id);

      // 1. View Mode Tab
      if (viewMode === 'MATCHED') {
        // Only matched by both gender and age!
        if (!eligibility.isEligible) return false;
      } else if (viewMode === 'MY_COURSES') {
        // Only enrolled or pending request
        if (!enrInfo.isEnrolled && !enrInfo.hasPendingRequest) return false;
      }

      // 2. Search Query (name, pool, coach, description)
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

      // 3. Gender Filter
      if (genderFilter !== 'ALL') {
        if (course.gender && course.gender !== 'ALL' && course.gender !== genderFilter) {
          return false;
        }
      }

      // 4. Age Category Preset Filter
      if (ageCategory !== 'ALL') {
        const preset = AGE_CATEGORY_PRESETS.find((p) => p.id === ageCategory);
        if (preset) {
          const cMin = course.min_age !== null && course.min_age !== undefined ? Number(course.min_age) : null;
          const cMax = course.max_age !== null && course.max_age !== undefined ? Number(course.max_age) : null;
          if (preset.min !== null && cMax !== null && cMax < preset.min) return false;
          if (preset.max !== null && cMin !== null && cMin > preset.max) return false;
        }
      }

      // 5. Status Filter
      if (statusFilter !== 'ALL') {
        if (course.status !== statusFilter) return false;
      }

      return true;
    });
  }, [courses, viewMode, searchQuery, genderFilter, ageCategory, statusFilter, checkCourseEligibility, getEnrollmentInfo]);

  // Statistics counters
  const stats = useMemo(() => {
    let matchedCount = 0;
    let enrolledCount = 0;
    let totalCount = courses.length;

    courses.forEach((c) => {
      const el = checkCourseEligibility(c);
      if (el.isEligible) matchedCount++;
      const en = getEnrollmentInfo(c.id);
      if (en.isEnrolled || en.hasPendingRequest) enrolledCount++;
    });

    return { totalCount, matchedCount, enrolledCount };
  }, [courses, checkCourseEligibility, getEnrollmentInfo]);

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
        `درخواست پیش‌ثبت‌نام شما برای دوره «${selectedCourseForEnroll.name}» با موفقیت ارسال گردید.`
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

  if (loading) {
    return <LoadingState type="cards" message="در حال دریافت دوره‌های آموزشی تعریف‌شده..." />;
  }

  return (
    <div className="space-y-6 pb-16" dir="rtl">
      {/* 1. HERO & ACTIVE SWIMMER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-sky-700 to-cyan-600 text-white p-5 sm:p-7 shadow-lg">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-400/15 rounded-full blur-2xl pointer-events-none translate-x-1/3 translate-y-1/3" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-sky-100 border border-white/20">
              <CourseLogoIcon className="w-4 h-4 text-cyan-200" />
              <span>دوره‌های آموزشی مصوب مدیریت آموزشگاه</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>دوره‌های آموزشی اختصاصی شنا</span>
            </h1>
            <p className="text-xs sm:text-sm text-sky-100/90 max-w-2xl leading-relaxed">
              مشاهده، مقایسه و پیش‌ثبت‌نام در دوره‌های آموزشی طراحی‌شده بر اساس جنسیت، رده سنی و سطح مهارت شما
            </p>
          </div>

          {/* Active Swimmer Profile Chip & Filter Context */}
          <div className="shrink-0 bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-3.5 sm:p-4 text-white shadow-xs max-w-md w-full lg:w-auto">
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <span className="text-[11px] font-semibold text-sky-200 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-cyan-300" />
                <span>شناگر جاری برای فیلتر دوره‌ها:</span>
              </span>
              {childrenList.length > 1 && (
                <div className="text-[11px] text-cyan-200 font-bold underline cursor-pointer hover:text-white transition-colors"
                  onClick={() => {
                    const nextChild = childrenList.find(c => String(c.swimmer || c.swimmer_detail?.id) !== String(activeSwimmerId));
                    if (nextChild) selectChild(nextChild.swimmer || nextChild.swimmer_detail?.id);
                  }}
                >
                  تعویض فرزند
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-400 to-sky-300 text-sky-900 font-black text-base flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                {currentSwimmer?.avatar ? (
                  <img src={getMediaUrl(currentSwimmer.avatar)} alt={swimmerName} className="w-full h-full object-cover" />
                ) : (
                  <span>{swimmerName.charAt(0)}</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white truncate flex items-center gap-2">
                  <span>{swimmerName}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/25 text-cyan-100 border border-cyan-300/30">
                    {swimmerLevel}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-sky-100">
                  <span className="inline-flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md font-mono text-[11px]">
                    <User className="w-3 h-3 text-cyan-300" />
                    <span>{swimmerGender === 'FEMALE' ? 'دختر / بانو' : 'پسر / آقا'}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md font-mono text-[11px]">
                    <Calendar className="w-3 h-3 text-cyan-300" />
                    <span>{swimmerAge !== null ? `${swimmerAge} سال` : 'سن نامشخص'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Completion Warning if age or gender is missing */}
            {(!hasBirthDate || !hasGender) && (
              <div className="mt-2.5 pt-2.5 border-t border-white/15 text-[11px] text-amber-200 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>تاریخ تولد یا جنسیت تکمیل نشده است.</span>
                </span>
                <Link to="/swimmer/profile" className="font-bold underline text-white hover:text-cyan-200">
                  تکمیل پرونده
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. STATS OVERVIEW ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              کل دوره‌های فعال آموزشگاه
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {stats.totalCount} <span className="text-xs font-normal text-slate-400">دوره</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 p-4 shadow-2xs flex items-center justify-between bg-gradient-to-br from-emerald-500/5 to-transparent">
          <div>
            <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>دوره‌های متناسب با شرایط شما</span>
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {stats.matchedCount} <span className="text-xs font-normal text-slate-400">دوره پیشنهادی</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              دوره‌های ثبت‌نامی / درخواستی شما
            </div>
            <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
              {stats.enrolledCount} <span className="text-xs font-normal text-slate-400">دوره</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. MAIN TABS & FILTER BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Primary View Mode Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('MATCHED')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                viewMode === 'MATCHED'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs scale-102 ring-2 ring-emerald-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>دوره‌های متناسب با شرایط من</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                viewMode === 'MATCHED' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {stats.matchedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('ALL')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                viewMode === 'ALL'
                  ? 'bg-sky-600 text-white shadow-xs scale-102 ring-2 ring-sky-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>همه دوره‌های آموزشگاه</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                viewMode === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {stats.totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('MY_COURSES')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                viewMode === 'MY_COURSES'
                  ? 'bg-cyan-600 text-white shadow-xs scale-102 ring-2 ring-cyan-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>دوره‌های من</span>
              {stats.enrolledCount > 0 && (
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                  viewMode === 'MY_COURSES' ? 'bg-white/20 text-white' : 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300'
                }`}>
                  {stats.enrolledCount}
                </span>
              )}
            </button>
          </div>

          {/* Refresh Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-sky-600 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-600' : ''}`} />
              <span>به‌روزرسانی</span>
            </button>
          </div>
        </div>

        {/* View Mode Explanation Alert */}
        {viewMode === 'MATCHED' && (
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-3 sm:p-3.5 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">فیلتر هوشمند انطباق فعال است:</span>
              <p className="text-emerald-700 dark:text-emerald-400/90 leading-relaxed text-[11px]">
                تنها دوره‌هایی که با جنسیت <strong>({swimmerGender === 'FEMALE' ? 'دختران' : 'پسران'})</strong> و سن شناگر <strong>({swimmerAge !== null ? `${swimmerAge} سال` : 'نامشخص'})</strong> همخوانی دارند نمایش داده می‌شوند. برای دیدن سایر دوره‌های آموزشگاه، تب «همه دوره‌ها» را انتخاب نمایید.
              </p>
            </div>
          </div>
        )}

        {/* Secondary Filters: Search, Gender, Age Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="جستجوی دوره، مربی یا استخر..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-8 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100 transition-colors"
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

          {/* Gender Manual Filter */}
          <div>
            <CustomSelect
              value={genderFilter}
              onChange={(val) => setGenderFilter(val)}
              options={[
                { value: 'ALL', label: 'همه جنسیت‌ها', icon: Users },
                { value: 'MALE', label: 'پسران / آقایان', icon: User },
                { value: 'FEMALE', label: 'دختران / بانوان', icon: User },
              ]}
              placeholder="فیلتر جنسیت..."
            />
          </div>

          {/* Age Preset Filter */}
          <div>
            <CustomSelect
              value={ageCategory}
              onChange={(val) => setAgeCategory(val)}
              options={AGE_CATEGORY_PRESETS.map((p) => ({
                value: p.id,
                label: p.label,
                icon: Calendar,
              }))}
              placeholder="فیلتر رده سنی..."
            />
          </div>

          {/* Status Filter */}
          <div>
            <CustomSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: 'ALL', label: 'همه وضعیت‌ها' },
                { value: 'UPCOMING', label: 'پیش‌ثبت‌نام (آتی)' },
                { value: 'ACTIVE', label: 'در حال برگزاری' },
              ]}
              placeholder="وضعیت دوره..."
            />
          </div>
        </div>

        {/* Clear Filters helper button if any filter is active */}
        {(searchQuery || genderFilter !== 'ALL' || ageCategory !== 'ALL' || statusFilter !== 'ALL') && (
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span>
              نمایش <strong>{filteredCourses.length}</strong> دوره از <strong>{courses.length}</strong> دوره
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setGenderFilter('ALL');
                setAgeCategory('ALL');
                setStatusFilter('ALL');
              }}
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
            >
              پاک‌سازی فیلترها
            </button>
          </div>
        )}
      </div>

      {/* 4. COURSES GRID */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-xs">
          <EmptyState
            title="دوره‌ای با این مشخصات یافت نشد"
            description={
              viewMode === 'MATCHED'
                ? 'در حال حاضر دوره‌ای متناسب با سن و جنسیت تعیین‌شده ثبت نشده است. می‌توانید با جابجایی به تب «همه دوره‌ها»، کلیه دوره‌های آموزشگاه را بررسی کنید.'
                : 'با تغییر عبارات جستجو یا فیلترهای انتخابی، دوباره تلاش کنید.'
            }
            action={
              viewMode === 'MATCHED' ? (
                <Button variant="primary" onClick={() => setViewMode('ALL')}>
                  مشاهده همه دوره‌های آموزشگاه
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setGenderFilter('ALL');
                    setAgeCategory('ALL');
                    setStatusFilter('ALL');
                  }}
                >
                  حذف فیلترها
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredCourses.map((course) => {
            const eligibility = checkCourseEligibility(course);
            const enrInfo = getEnrollmentInfo(course.id);
            const isSyllabusExpanded = expandedSyllabusId === course.id;

            return (
              <div
                key={course.id}
                className={`group relative bg-white dark:bg-slate-900 rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  eligibility.isEligible
                    ? 'border-slate-200/90 dark:border-slate-800 hover:border-sky-400/80 dark:hover:border-sky-600'
                    : 'border-slate-200/60 dark:border-slate-800/60 opacity-90'
                }`}
              >
                {/* Top Colored Accent Stripe */}
                <div
                  className={`h-1.5 w-full ${
                    enrInfo.isEnrolled
                      ? 'bg-emerald-500'
                      : enrInfo.hasPendingRequest
                      ? 'bg-amber-500'
                      : eligibility.isEligible
                      ? 'bg-gradient-to-r from-sky-500 via-cyan-400 to-teal-400'
                      : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                />

                <div className="p-5 sm:p-6 space-y-4 flex-1">
                  {/* Top Badges Row: Status + Match Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
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

                    {/* Eligibility Badge */}
                    {eligibility.isEligible ? (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                        <span>متناسب با شما</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>شرایط متفاوت</span>
                      </span>
                    )}
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

                  {/* Eligibility Details Pill if mismatched */}
                  {!eligibility.isEligible && (
                    <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 rounded-xl p-2.5 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                      {!eligibility.genderOk && (
                        <div className="flex items-center gap-1 font-semibold">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>جنسیت مجاز: {course.gender === 'MALE' ? 'فقط پسران / آقایان' : 'فقط دختران / بانوان'}</span>
                        </div>
                      )}
                      {!eligibility.ageOk && (
                        <div className="flex items-center gap-1 font-semibold">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>رده سنی: {course.age_range || (course.min_age && course.max_age ? `${course.min_age} تا ${course.max_age} سال` : '')} (سن شناگر: {swimmerAge} سال)</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Specifications Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Gender Spec */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block mb-0.5">جنسیت مجاز:</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
                        <Users className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="truncate">
                          {course.gender === 'MALE'
                            ? 'پسران / آقایان'
                            : course.gender === 'FEMALE'
                            ? 'دختران / بانوان'
                            : 'عمومی (پسران و دختران)'}
                        </span>
                      </div>
                    </div>

                    {/* Age Range Spec */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block mb-0.5">رده سنی:</span>
                      <div className="font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5 truncate">
                        <Calendar className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="truncate">
                          {course.age_range ||
                            (course.min_age && course.max_age
                              ? `${course.min_age} تا ${course.max_age} سال`
                              : course.min_age
                              ? `${course.min_age} سال به بالا`
                              : 'عموم رده‌های سنی')}
                        </span>
                      </div>
                    </div>

                    {/* Pool Location Spec */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block mb-0.5">استخر و محل برگزاری:</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="truncate">{course.pool_location || 'استخر شهید رئیسی'}</span>
                      </div>
                    </div>

                    {/* Schedule Spec */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block mb-0.5">روزها و ساعات:</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
                        <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="truncate">
                          {course.days_of_week || 'هفتگی'} {course.time_display ? `(${course.time_display})` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Coaches Section */}
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
                                <img src={c.avatar} alt={c.full_name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{c.full_name?.charAt(0) || 'م'}</span>
                              )}
                            </div>
                            <span>{c.full_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Syllabus / "What you learn" Preview */}
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

                  {/* Pricing and Installments Box */}
                  <div className="bg-gradient-to-r from-slate-50 to-sky-50/50 dark:from-slate-800/80 dark:to-sky-950/30 rounded-2xl p-3 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">شهریه کل دوره ({course.sessions_count || 12} جلسه):</span>
                      <div className="text-base font-black text-slate-900 dark:text-slate-100 font-mono">
                        {formatTomans(course.base_price)}{' '}
                        <span className="text-xs font-normal text-slate-500">تومان</span>
                      </div>
                    </div>

                    <div className="text-left">
                      {course.installments_count && course.installments_count > 1 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                          <CreditCard className="w-3 h-3" />
                          <span>امکان پرداخت در {course.installments_count} قسط</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">پرداخت یکجا (نقدی)</span>
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
                      onClick={() => navigate('/swimmer/schedule')}
                    >
                      <CheckCircle2 className="w-4 h-4 ml-1.5" />
                      <span>مشاهده در برنامه کلاس‌ها</span>
                    </Button>
                  ) : enrInfo.hasPendingRequest ? (
                    <div className="flex-1 text-center py-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800">
                      درخواست شما در انتظار تأیید مدیریت است
                    </div>
                  ) : (
                    <Button
                      variant={eligibility.isEligible ? 'primary' : 'outline'}
                      className={`flex-1 text-xs font-bold ${
                        !eligibility.isEligible ? 'border-amber-300 text-amber-700 dark:text-amber-400' : ''
                      }`}
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

      {/* 5. COURSE DETAIL MODAL */}
      {selectedCourseForDetail && (
        <Modal
          isOpen={Boolean(selectedCourseForDetail)}
          onClose={() => setSelectedCourseForDetail(null)}
          title={`مشخصات دوره آموزشی: ${selectedCourseForDetail.name}`}
          size="lg"
        >
          <div className="space-y-5 text-slate-800 dark:text-slate-100" dir="rtl">
            {/* Header info card */}
            <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-slate-800 dark:to-slate-800/60 p-4 rounded-2xl border border-sky-100 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Badge variant={selectedCourseForDetail.status === 'ACTIVE' ? 'success' : 'info'}>
                  {selectedCourseForDetail.status === 'ACTIVE' ? 'در حال برگزاری' : 'پیش‌ثبت‌نام'}
                </Badge>
                <div className="text-base font-black text-sky-600 dark:text-sky-400 font-mono">
                  {formatTomans(selectedCourseForDetail.base_price)} تومان
                </div>
              </div>

              <h4 className="text-base font-bold">{selectedCourseForDetail.name}</h4>
              {selectedCourseForDetail.description && (
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedCourseForDetail.description}
                </p>
              )}
            </div>

            {/* Specifications list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block text-[11px] mb-1">جنسیت مجاز:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedCourseForDetail.gender === 'MALE'
                    ? 'پسران / آقایان'
                    : selectedCourseForDetail.gender === 'FEMALE'
                    ? 'دختران / بانوان'
                    : 'عمومی (پسران و دختران)'}
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
            </div>

            {/* Coaches details */}
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
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{c.full_name}</div>
                        <div className="text-[11px] text-slate-400">{c.class_name || 'کلاس اختصاصی مربی'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* What you learn details */}
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

            {/* Bank Card info if defined */}
            {selectedCourseForDetail.card_number && (
              <div className="bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800 rounded-2xl p-3.5 space-y-1.5">
                <span className="text-[11px] font-bold text-sky-800 dark:text-sky-300 block">
                  اطلاعات حساب واریز شهریه دوره:
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-sm text-sky-900 dark:text-sky-200 tracking-wider">
                    {formatCardNumberWithDashes(selectedCourseForDetail.card_number)}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyCardToClipboard(selectedCourseForDetail.card_number, toast)}
                    className="p-1.5 rounded-lg bg-sky-200/60 dark:bg-sky-800 hover:bg-sky-300 text-sky-800 dark:text-sky-100 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>کپی کارت</span>
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

      {/* 6. ENROLLMENT REQUEST MODAL */}
      {selectedCourseForEnroll && (
        <Modal
          isOpen={Boolean(selectedCourseForEnroll)}
          onClose={() => setSelectedCourseForEnroll(null)}
          title={`درخواست پیش‌ثبت‌نام در دوره: ${selectedCourseForEnroll.name}`}
          size="md"
        >
          <form onSubmit={handleSubmitEnrollment} className="space-y-4 text-slate-800 dark:text-slate-100" dir="rtl">
            {/* Swimmer Info Summary */}
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

            {/* Coach selection */}
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
                    label: `${c.full_name} (${c.class_name || 'کلاس اختصاصی'})`,
                    icon: User,
                  }))}
                  placeholder="مربی مورد نظر خود را انتخاب کنید..."
                />
              </div>
            )}

            {/* Installments selection */}
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

            {/* Notes Textarea */}
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

            {/* Notice regarding review */}
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 text-[11px] text-slate-500 space-y-1">
              <span className="font-bold block text-slate-700 dark:text-slate-300">مراحل بعدی:</span>
              <p>
                پس از ثبت درخواست، مدیریت آموزشگاه درخواست شما را بررسی و در صورت تأیید ظرفیت، کلاس مربوطه را در پنل شما فعال می‌نماید.
              </p>
            </div>

            {/* Modal Actions */}
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
