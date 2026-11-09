import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight, GraduationCap, Search, Check, Plus, RefreshCw,
  AlertCircle, Sparkles, Users, CheckCircle2, BookOpen,
  MapPin, Calendar, Clock, Whistle, UserCheck, CheckSquare, Square,
  Trash2, AlertTriangle
} from 'lucide-react';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';

export const AdminCourseAddCoachPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [course, setCourse] = useState(null);
  const [allCoaches, setAllCoaches] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedCoachIds, setSelectedCoachIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // State for removing coach modal & action
  const [coachToDelete, setCoachToDelete] = useState(null);
  const [removingCoachId, setRemovingCoachId] = useState(null);

  useEffect(() => {
    if (id) {
      navigate(`/admin/courses/${id}?tab=classes`, { replace: true });
    }
  }, [id, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [courseRes, coachesRes, enrollmentsRes] = await Promise.all([
          api.get(`/education/courses/${id}/`),
          api.get('/coaches/').catch(() => ({ data: [] })),
          api.get('/education/enrollments/', { params: { course_id: id } }).catch(() => ({ data: [] })),
        ]);
        setCourse(courseRes.data);
        setAllCoaches(coachesRes.data.results || coachesRes.data || []);
        setEnrollments(enrollmentsRes.data.results || enrollmentsRes.data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('خطا در بارگذاری اطلاعات دوره و کادر مربیان');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  // Set of coach IDs already in this course
  const currentCourseCoachIds = useMemo(() => {
    return new Set((course?.coaches || []).map((c) => Number(c.id)));
  }, [course]);

  // Helper to get active swimmer count for a coach in this course
  const getCoachSwimmersCount = (coachId) => {
    return enrollments.filter(
      (e) => Number(e.coach) === Number(coachId) && (e.status === 'ACTIVE' || e.status === 'PENDING_PAYMENT')
    ).length;
  };

  // Coaches not yet in this course
  const unassignedCoaches = useMemo(() => {
    return allCoaches.filter((c) => !currentCourseCoachIds.has(Number(c.id)));
  }, [allCoaches, currentCourseCoachIds]);

  // Already assigned coaches
  const assignedCoaches = useMemo(() => {
    return course?.coaches || [];
  }, [course]);

  // Filtered unassigned coaches by search
  const filteredUnassignedCoaches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return unassignedCoaches;
    return unassignedCoaches.filter((c) => {
      const name = (c.full_name || '').toLowerCase();
      const spec = (c.specialties || '').toLowerCase();
      return name.includes(q) || spec.includes(q);
    });
  }, [unassignedCoaches, searchQuery]);

  // Toggle selection for a coach
  const toggleCoach = (coachId) => {
    setSelectedCoachIds((prev) =>
      prev.includes(coachId)
        ? prev.filter((item) => item !== coachId)
        : [...prev, coachId]
    );
  };

  // Select / Deselect all filtered coaches
  const handleSelectAll = () => {
    const ids = filteredUnassignedCoaches.map((c) => c.id);
    const allSelected = ids.every((cid) => selectedCoachIds.includes(cid));
    if (allSelected) {
      // Remove all visible from selection
      setSelectedCoachIds((prev) => prev.filter((cid) => !ids.includes(cid)));
    } else {
      // Add all visible to selection
      setSelectedCoachIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  // Open modal to confirm removing coach from course
  const handleRequestRemoveCoach = (coach) => {
    const swimmersCount = getCoachSwimmersCount(coach.id);
    setCoachToDelete({
      ...coach,
      swimmersCount,
    });
  };

  // Confirm and execute removing coach from course
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
          ? `مربی «${coachToDelete.full_name}» حذف شد و ${coachToDelete.swimmersCount} شاگرد به وضعیت «بدون مربی» تبدیل شدند.`
          : `مربی «${coachToDelete.full_name}» با موفقیت از این دوره حذف شد.`
      );

      // Refresh course and enrollments data
      const [updatedCourseRes, updatedEnrollmentsRes] = await Promise.all([
        api.get(`/education/courses/${id}/`),
        api.get('/education/enrollments/', { params: { course_id: id } }).catch(() => ({ data: [] })),
      ]);
      setCourse(updatedCourseRes.data);
      setEnrollments(updatedEnrollmentsRes.data.results || updatedEnrollmentsRes.data || []);
      setCoachToDelete(null);
    } catch (err) {
      console.error('Error removing coach from course:', err);
      const errMsg = err.response?.data?.coach_ids?.[0] || err.response?.data?.detail || 'خطا در حذف مربی از دوره';
      toast.error(errMsg);
    } finally {
      setRemovingCoachId(null);
    }
  };

  // Submit adding coaches to course
  const handleSubmit = async () => {
    if (selectedCoachIds.length === 0) {
      toast.warning('لطفاً حداقل یک مربی را با زدن تیک انتخاب کنید.');
      return;
    }

    try {
      setSubmitting(true);
      const existingIds = (course.coaches || []).map((c) => Number(c.id));
      const finalCoachIds = Array.from(new Set([...existingIds, ...selectedCoachIds.map(Number)]));

      await api.patch(`/education/courses/${id}/`, {
        coach_ids: finalCoachIds,
      });

      toast.success(
        `${selectedCoachIds.length} مربی با موفقیت به دوره افزوده شد و کلاس‌های اختصاصی تشکیل گردید.`
      );
      navigate(`/admin/courses/${id}`);
    } catch (err) {
      console.error('Error adding coaches to course:', err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت و افزودن مربیان به دوره');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-12" dir="rtl">
        <LoadingState type="cards" message="در حال دریافت اطلاعات دوره و مربیان آکادمی..." />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8 text-center text-xs space-y-4" dir="rtl">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-800 dark:text-white">دوره مورد نظر یافت نشد</h2>
        <Button onClick={() => navigate('/admin/courses')}>بازگشت به فهرست دوره‌ها</Button>
      </div>
    );
  }

  // Selected coach objects for live preview
  const selectedCoachesList = allCoaches.filter((c) => selectedCoachIds.includes(c.id));

  return (
    <div className="space-y-6 pb-20 select-none sm:select-auto" dir="rtl">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate(`/admin/courses/${id}`)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer group"
        >
          <ArrowRight className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>بازگشت به مشخصات دوره:</span>
          <span className="text-slate-900 dark:text-white font-bold">{course.name}</span>
        </button>

        <Badge variant={course.status === 'ACTIVE' ? 'success' : 'default'}>
          {course.status_display || (course.status === 'ACTIVE' ? 'دوره فعال' : course.status)}
        </Badge>
      </div>

      {/* Main Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 transition-colors">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                مدیریت مربیان دوره و تشکیل کلاس‌های اختصاصی
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                دوره آموزشی: <span className="font-bold text-slate-800 dark:text-slate-200">{course.name}</span>
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl pt-1">
            مربیان مورد نظر را از فهرست زیر <strong className="text-sky-600 dark:text-sky-400">تیک بزنید</strong>.
            به ازای هر مربی انتخابی، یک کلاس اختصاصی با عنوان «کلاس مربی [نام مربی]» با ظرفیت استاندارد ۱۵ نفر و متصل به زمان‌بندی و استخر این دوره تشکیل خواهد شد.
          </p>
        </div>

        {/* Course Info Pills */}
        <div className="flex flex-wrap md:flex-col gap-2 shrink-0 text-xs">
          {course.pool_location && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>{course.pool_location}</span>
            </div>
          )}
          {course.schedule_days && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300">
              <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span>{course.schedule_days}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200 font-bold">
            <Users className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
            <span>{assignedCoaches.length} مربی در دوره حاضر هستند</span>
          </div>
        </div>
      </div>

      {/* Action Controls & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در نام مربی یا تخصص..."
              className="w-full pr-10 pl-3 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          {/* Quick Actions & Counter */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {unassignedCoaches.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAll}
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

            {/* Selection Counter Pill */}
            <span
              className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition-colors flex items-center gap-1.5 ${
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
      </div>

      {/* Available Coaches Grid (Selectable with Checkboxes) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Whistle className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>مربیان آماده تخصیص به این دوره</span>
            <span className="text-xs text-slate-400 font-normal">
              ({unassignedCoaches.length} مربی در کادر آکادمی)
            </span>
          </h2>
        </div>

        {unassignedCoaches.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              تمامی مربیان فعال آکادمی هم‌اکنون به این دوره تخصیص یافته‌اند!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              تمام مربیان موجود در سیستم در حال حاضر دارای کلاس اختصاصی در این دوره هستند. در صورت نیاز به مربی جدید، ابتدا از بخش کادر مربیان مربی جدیدی ایجاد کنید.
            </p>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/admin/courses/${id}`)}
              >
                بازگشت به صفحه مشخصات دوره
              </Button>
            </div>
          </div>
        ) : filteredUnassignedCoaches.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            مربی متناسب با عبارت «{searchQuery}» یافت نشد.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredUnassignedCoaches.map((c) => {
              const isSelected = selectedCoachIds.includes(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => toggleCoach(c.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group select-none ${
                    isSelected
                      ? 'bg-sky-50/80 dark:bg-sky-950/50 border-sky-400 dark:border-sky-600 ring-2 ring-sky-500/20 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Coach Avatar */}
                    <div className="relative shrink-0">
                      {c.avatar ? (
                        <img
                          src={c.avatar}
                          alt={c.full_name}
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                          {c.full_name ? c.full_name.charAt(0) : 'م'}
                        </div>
                      )}
                      <span className="absolute -bottom-1 -left-1 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                    </div>

                    {/* Coach Name & Specialties */}
                    <div className="min-w-0">
                      <span className="font-bold text-sm text-slate-900 dark:text-white block truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        مربی {c.full_name}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                        {c.specialties || 'مربی رسمی شنا'}
                      </span>
                      {isSelected && (
                        <span className="inline-block text-[10px] text-sky-700 dark:text-sky-300 font-bold bg-sky-100 dark:bg-sky-900/60 px-2 py-0.5 rounded-md mt-1.5">
                          تشکیل کلاس اختصاصی (۱۵ نفر)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Checkbox Tick Icon Box */}
                  <div
                    className={`w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? 'bg-sky-600 border-sky-600 text-white shadow-xs'
                        : 'border-slate-300 dark:border-slate-600 group-hover:border-sky-400 bg-slate-50 dark:bg-slate-800'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Preview of Classes to be Created */}
      {selectedCoachesList.length > 0 && (
        <div className="bg-sky-50/70 dark:bg-sky-950/40 p-5 rounded-3xl border border-sky-200 dark:border-sky-800/80 space-y-3 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sky-900 dark:text-sky-200 font-bold text-xs sm:text-sm">
              <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>پیش‌نمایش کلاس‌هایی که تشکیل خواهند شد ({selectedCoachesList.length} کلاس):</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              استخر: {course.pool_location || 'استخر دوره'} - {course.schedule_days || 'سانس‌های دوره'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {selectedCoachesList.map((c) => (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-sky-200/90 dark:border-sky-800/60 shadow-2xs flex items-center justify-between gap-2"
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

      {/* Section: Coaches Already in this Course */}
      <div className="space-y-3 pt-6 border-t border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>مربیانی که در حال حاضر در این دوره کلاس دارند ({assignedCoaches.length} مربی)</span>
          </h3>
          <span className="text-[11px] text-slate-400">
            برای حذف مربی، از دکمه «حذف از دوره» در کارت مربی استفاده کنید.
          </span>
        </div>

        {assignedCoaches.length === 0 ? (
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>هم‌اکنون هیچ مربی‌ای در این دوره کلاس فعال ندارد. از فهرست بالا مربیان مورد نظر را انتخاب و اضافه نمایید.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {assignedCoaches.map((c) => {
              const swimmerCount = getCoachSwimmersCount(c.id);
              const isRemovingThis = removingCoachId === c.id;

              return (
                <div
                  key={c.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {c.avatar ? (
                      <img
                        src={c.avatar}
                        alt={c.full_name}
                        className="w-11 h-11 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                        {c.full_name ? c.full_name.charAt(0) : 'م'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block truncate">
                        مربی {c.full_name}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/70">
                          فعال در دوره
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                          {swimmerCount > 0 ? `${swimmerCount} شناگر ثبت‌نامی` : 'بدون شناگر'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Remove Coach Button */}
                  <button
                    type="button"
                    onClick={() => handleRequestRemoveCoach(c)}
                    disabled={isRemovingThis}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-900/50 hover:border-rose-300 transition-all cursor-pointer shrink-0 disabled:opacity-50"
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
              );
            })}
          </div>
        )}
      </div>

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
                    این مربی دارای <strong>{coachToDelete.swimmersCount} شناگر ثبت‌نامی</strong> در این دوره است. با حذف مربی، کلاس اختصاصی ایشان منحل شده و وضعیت تمامی این شناگران به صورت خودکار به <strong className="text-amber-700 dark:text-amber-300 font-bold">«بدون مربی»</strong> تغییر می‌کند تا بتوانید در صفحه دوره آن‌ها را به مربی یا کلاس جدید اختصاص دهید.
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

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-3.5 px-4 sm:px-8 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
              تعداد مربیان انتخاب‌شده برای الحاق:
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono">
              {selectedCoachIds.length} مربی
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/admin/courses/${id}`)}
              disabled={submitting}
              className="cursor-pointer"
            >
              انصراف و بازگشت
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={selectedCoachIds.length === 0 || submitting}
              className="gap-2 bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-500/20 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
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
  );
};
export default AdminCourseAddCoachPage;
