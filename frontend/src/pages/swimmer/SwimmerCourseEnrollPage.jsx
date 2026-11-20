import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, Calendar, Clock, MapPin, Users, User, CheckCircle2,
  AlertCircle, DollarSign, CreditCard, ArrowLeft, ArrowRight,
  Sparkles, Check, Info, AlertTriangle, UserCheck, Copy,
  GraduationCap, ChevronDown, ChevronUp, ShieldCheck
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
import { BackButton } from '../../components/common/BackButton';
import { toShamsiDate } from '../../utils/date';
import { formatCardNumberWithDashes, copyCardToClipboard, getBankNameFromCard } from '../../utils/bankCard';
import { getMediaUrl } from '../../utils/media';

export const SwimmerCourseEnrollPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { activeSwimmer, activeSwimmerId } = useSwimmer();

  const [course, setCourse] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSyllabusExpanded, setIsSyllabusExpanded] = useState(true);

  // Form State - NOTE: Coach selection is NOT by the swimmer! Management assigns coaches.
  const [selectedInstallments, setSelectedInstallments] = useState(1);
  const [notes, setNotes] = useState('');

  // Fetch course and swimmer data
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = activeSwimmerId ? { swimmer_id: activeSwimmerId } : {};

        const [courseRes, profileRes, enrRes, reqRes] = await Promise.allSettled([
          api.get(`/education/courses/${id}/`, { params }),
          api.get('/swimmers/me/', { params }),
          api.get('/education/enrollments/', { params }),
          api.get('/education/requests/', { params }),
        ]);

        if (!isMounted) return;

        if (courseRes.status === 'fulfilled') {
          setCourse(courseRes.value.data);
        } else {
          toast.error('دوره آموزشی مورد نظر یافت نشد یا غیرفعال است.');
        }

        if (profileRes.status === 'fulfilled') {
          setProfileData(profileRes.value.data);
        }

        if (enrRes.status === 'fulfilled') {
          const list = Array.isArray(enrRes.value.data) ? enrRes.value.data : enrRes.value.data.results || [];
          setMyEnrollments(list);
        }

        if (reqRes.status === 'fulfilled') {
          const list = Array.isArray(reqRes.value.data) ? reqRes.value.data : reqRes.value.data.results || [];
          setMyRequests(list);
        }
      } catch (err) {
        console.error('Error fetching enrollment page data:', err);
        toast.error('خطا در دریافت اطلاعات ثبت‌نام دوره');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [id, activeSwimmerId, toast]);

  const currentSwimmer = useMemo(() => {
    return profileData || activeSwimmer || null;
  }, [profileData, activeSwimmer]);

  const swimmerGender = currentSwimmer?.gender || null;
  const swimmerAge = typeof currentSwimmer?.age === 'number' ? currentSwimmer.age : null;
  const swimmerName = currentSwimmer?.full_name || currentSwimmer?.first_name || 'شناگر محترم';
  const swimmerLevel = currentSwimmer?.level_name || 'سطح پایه';
  const swimmerNationalId = currentSwimmer?.national_id || '';
  const swimmerPhone = currentSwimmer?.phone || user?.phone || '';

  // Check enrollment and pending status for this course
  const existingEnrollment = useMemo(() => {
    if (!course) return null;
    return myEnrollments.find(
      (e) => String(e.course || e.course_id) === String(course.id) && e.status !== 'CANCELLED'
    );
  }, [myEnrollments, course]);

  const pendingRequest = useMemo(() => {
    if (!course) return null;
    return myRequests.find(
      (r) => String(r.course || r.course_id) === String(course.id) && r.status === 'PENDING'
    );
  }, [myRequests, course]);

  // Pricing calculations
  const formatTomans = (val) => {
    if (!val) return '۰';
    const num = Math.round(Number(val));
    return num.toLocaleString('fa-IR');
  };

  const totalFee = Number(course?.base_price || 0);
  const maxInstallments = Math.max(1, Number(course?.installments_count || 1));
  const installmentAmount = Math.round(totalFee / selectedInstallments);
  const sessionFee = course?.sessions_count > 0 ? Math.round(totalFee / course.sessions_count) : null;

  // Handle Form Submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!course) return;

    if (existingEnrollment) {
      toast.error('شما پیش‌تر در این دوره آموزشی ثبت‌نام کرده‌اید.');
      return;
    }

    if (pendingRequest) {
      toast.error('درخواست ثبت‌نام شما برای این دوره در دست بررسی مدیریت است.');
      return;
    }

    try {
      setSubmitting(true);
      // NOTE: Coach selection is NOT by swimmer. Coach is not sent, management assigns it.
      const payload = {
        course: course.id,
        selected_installments: Number(selectedInstallments || 1),
        notes: notes.trim(),
        swimmer: activeSwimmerId || undefined,
      };

      await api.post('/education/requests/submit/', payload);
      toast.success(`درخواست پیش‌ثبت‌نام شما برای دوره «${course.name}» با موفقیت ارسال گردید.`);
      navigate('/swimmer/courses?tab=my-courses');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ارسال درخواست ثبت‌نام.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <LoadingState type="cards" message="در حال دریافت اطلاعات ثبت‌نام دوره آموزشی..." />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4" dir="rtl">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">دوره آموزشی یافت نشد</h2>
          <p className="text-xs text-slate-500">
            ممکن است این دوره حذف شده باشد یا دسترسی به آن امکان‌پذیر نباشد.
          </p>
          <div className="pt-2">
            <Button variant="primary" onClick={() => navigate('/swimmer/courses?tab=register')}>
              بازگشت به لیست دوره‌ها
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const startDateShamsi = course.start_date ? toShamsiDate(course.start_date) : null;
  const endDateShamsi = course.end_date ? toShamsiDate(course.end_date) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16" dir="rtl">
      {/* 1. TOP HEADER & BREADCRUMB */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <BackButton fallback="/swimmer/courses?tab=register" title="بازگشت به دوره‌ها" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                فرم پیش‌ثبت‌نام رسمی دوره
              </span>
              <Badge variant={course.status === 'ACTIVE' ? 'success' : 'info'} size="xs">
                {course.status === 'ACTIVE' ? 'در حال برگزاری' : 'پیش‌ثبت‌نام'}
              </Badge>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate">
              {course.name}
            </h1>
          </div>
        </div>

        <div className="text-left shrink-0 self-end sm:self-auto bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 rounded-2xl border border-slate-200/70 dark:border-slate-700">
          <span className="text-[10px] text-slate-400 block">شهریه کل مصوب:</span>
          <span className="text-base sm:text-lg font-black text-sky-600 dark:text-sky-400 font-mono">
            {formatTomans(course.base_price)} تومان
          </span>
        </div>
      </div>

      {/* 2. ALERTS IF ALREADY REGISTERED OR REQUEST PENDING */}
      {existingEnrollment && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 text-emerald-800 dark:text-emerald-200">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>شما هم‌اکنون در این دوره ثبت‌نام فعال دارید.</span>
          </div>
          <Button variant="success" size="sm" onClick={() => navigate('/swimmer/courses?tab=my-courses')}>
            مشاهده در برنامه جلسات
          </Button>
        </div>
      )}

      {pendingRequest && !existingEnrollment && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3 text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <span>درخواست پیش‌ثبت‌نام شما برای این دوره در دست بررسی مدیریت است.</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/swimmer/courses?tab=my-courses')}>
            مشاهده وضعیت درخواست‌ها
          </Button>
        </div>
      )}

      {/* 3. ACTIVE SWIMMER PROFILE STRIP */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-sky-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
            {currentSwimmer?.avatar ? (
              <img src={getMediaUrl(currentSwimmer.avatar)} alt={swimmerName} className="w-full h-full object-cover" />
            ) : (
              <span>{swimmerName.charAt(0)}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-400">متقاضی ثبت‌نام:</span>
              <strong className="text-sm font-bold text-slate-900 dark:text-slate-100">{swimmerName}</strong>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 font-bold">
                {swimmerLevel}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
              <span>جنسیت: <strong>{swimmerGender === 'FEMALE' ? 'دختر / بانو' : 'پسر / آقا'}</strong></span>
              <span>•</span>
              <span>رده سنی: <strong>{swimmerAge !== null ? `${swimmerAge} سال` : 'سن نامشخص'}</strong></span>
              {swimmerNationalId && (
                <>
                  <span>•</span>
                  <span>کد ملی: <span className="font-mono">{swimmerNationalId}</span></span>
                </>
              )}
            </div>
          </div>
        </div>

        <Link
          to="/swimmer/profile"
          className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 font-bold self-end sm:self-center hover:underline cursor-pointer"
        >
          ویرایش مشخصات شناگر
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 4. EXACT COURSE SPECIFICATIONS CARD (همان اطلاعات مدیر در تعریف دوره) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <SwimCourseSpecsIcon className="w-5 h-5 text-sky-600 shrink-0" />
              <span>مشخصات مصوب دوره آموزشی</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">تعریف‌شده توسط مدیریت آکادمی</span>
          </div>

          {/* Grid of specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">جنسیت مجاز دوره:</span>
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span>
                  {course.gender_display || (course.gender === 'FEMALE' ? 'ویژه دختران / بانوان' : course.gender === 'MALE' ? 'ویژه پسران / آقایان' : 'عمومی (پسران و دختران)')}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">رده سنی مجاز دوره:</span>
              <div className="font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span>
                  {course.age_range || (course.min_age && course.max_age ? `${course.min_age} تا ${course.max_age} سال` : course.min_age ? `${course.min_age} سال به بالا` : 'عموم رده‌ها')}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">استخر و محل برگزاری:</span>
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="truncate">{course.pool_location || 'استخر شهید رئیسی'}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">روزها و ساعت برگزاری:</span>
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
                <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="truncate">
                  {course.days_of_week || 'جلسات هفتگی'} {course.time_display ? `(${course.time_display})` : ''}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">تاریخ آغاز دوره:</span>
              <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{startDateShamsi?.fullText || course.start_date || '—'}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">تاریخ پایان دوره:</span>
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{endDateShamsi?.fullText || course.end_date || '—'}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">تعداد جلسات کل دوره:</span>
              <div className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {course.sessions_count || 12} جلسه آموزشی
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">شهریه هر جلسه:</span>
              <div className="font-bold text-sky-700 dark:text-sky-300 font-mono">
                {sessionFee ? `${formatTomans(sessionFee)} تومان` : '—'}
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">سقف اقساط مجاز:</span>
              <div className="font-bold text-slate-800 dark:text-slate-200">
                {maxInstallments > 1 ? `تا ${maxInstallments} قسط توافقی` : 'پرداخت یکجا (نقدی)'}
              </div>
            </div>
          </div>

          {/* Course Description */}
          {course.description && (
            <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">درباره دوره:</span>
              <p className="whitespace-pre-line">{course.description}</p>
            </div>
          )}

          {/* Syllabus / What You Learn */}
          {course.what_you_learn && (
            <div className="border border-sky-100 dark:border-sky-900/60 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 p-4 space-y-2">
              <button
                type="button"
                onClick={() => setIsSyllabusExpanded((prev) => !prev)}
                className="w-full flex items-center justify-between text-xs font-bold text-sky-800 dark:text-sky-300 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <SwimCourseSpecsIcon className="w-4 h-4 text-sky-600" />
                  <span>سرفصل‌ها و آنچه در این دوره یاد می‌گیرید</span>
                </span>
                {isSyllabusExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {isSyllabusExpanded && (
                <div className="pt-2 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed border-t border-sky-100 dark:border-sky-900/40">
                  {course.what_you_learn}
                </div>
              )}
            </div>
          )}

          {/* Course Coaches Section (Information Only - Coach selection is by management) */}
          {course.coaches && course.coaches.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-600" />
                  <span>کادر مربیان دوره ({course.coaches.length} مربی رسمی)</span>
                </span>
                <span className="text-[11px] text-slate-400">تخصیص کلاس توسط مدیریت آکادمی</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {course.coaches.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                      {c.avatar ? (
                        <img src={getMediaUrl(c.avatar)} alt={c.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{c.full_name?.charAt(0) || 'م'}</span>
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

              {/* Notice explaining coach allocation */}
              <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>نحوه تخصیص مربی و کلاس:</strong> انتخاب و توزیع شناگران در کلاس‌ها بر اساس بررسی رده سنی، سطح آمادگی و ظرفیت استاندارد استخر، منحصراً توسط مدیریت و کادر فنی آموزشگاه صورت می‌پذیرد.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 5. PAYMENT TERMS & INSTALLMENTS SELECTION */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>شیوه پرداخت شهریه و انتخاب اقساط</span>
            </h2>
            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
              کل شهریه: {formatTomans(course.base_price)} تومان
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              تعداد اقساط مورد نظر خود را مشخص کنید:
            </label>

            {maxInstallments > 1 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {Array.from({ length: maxInstallments }, (_, i) => i + 1).map((num) => {
                    const isSelected = selectedInstallments === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSelectedInstallments(num)}
                        className={`p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-sky-600 text-white border-sky-600 shadow-sm scale-102 ring-2 ring-sky-500/20'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <div>{num === 1 ? 'یکجا (نقدی)' : `${num} قسط`}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {selectedInstallments === 1
                        ? 'پرداخت یکجا مصوب:'
                        : `برنامه‌ریزی پرداخت در ${selectedInstallments} قسط:`}
                    </span>
                  </div>
                  <div className="font-mono text-sm sm:text-base font-black text-emerald-900 dark:text-emerald-200">
                    {selectedInstallments === 1 ? (
                      <span>{formatTomans(totalFee)} تومان</span>
                    ) : (
                      <span>
                        تقریباً هر قسط <strong>{formatTomans(installmentAmount)}</strong> تومان
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between border border-slate-200 dark:border-slate-700">
                <span>شرایط پرداخت شهریه این دوره:</span>
                <span className="font-bold">پرداخت یکجا (نقدی)</span>
              </div>
            )}
          </div>
        </div>

        {/* 6. BANK ACCOUNT & CARD DETAILS BOX */}
        {course.card_number && (
          <div className="bg-sky-50/90 dark:bg-sky-950/40 border border-sky-200/90 dark:border-sky-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-sky-600" />
                <h3 className="text-sm font-bold text-sky-900 dark:text-sky-200">
                  اطلاعات حساب بانکی جهت واریز شهریه / پیش‌پرداخت دوره
                </h3>
              </div>
              <span className="text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/60 px-2.5 py-1 rounded-xl w-fit">
                {getBankNameFromCard(course.card_number)}
              </span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-sky-200 dark:border-sky-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">شماره کارت بانکی آموزشگاه:</span>
                <span className="font-mono font-black text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-wider">
                  {formatCardNumberWithDashes(course.card_number)}
                </span>
                {course.card_holder && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    به نام: <strong>{course.card_holder}</strong>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => copyCardToClipboard(course.card_number, 'شماره کارت', toast)}
                className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
              >
                <Copy className="w-4 h-4" />
                <span>کپی شماره کارت</span>
              </button>
            </div>

            <p className="text-[11px] text-sky-800 dark:text-sky-300 leading-relaxed">
              💡 <strong>راهنما:</strong> پس از واریز پیش‌پرداخت یا قسط اول به حساب فوق، با تأیید درخواست توسط مدیریت، رسید واریز در منوی امور مالی و فیش‌های بانکی شما قابل درج و پیگیری خواهد بود.
            </p>
          </div>
        )}

        {/* 7. APPLICANT NOTES */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            توضیحات یا یادداشت متقاضی برای مدیریت آموزشگاه (اختیاری):
          </label>
          <textarea
            rows={3}
            placeholder="در صورت داشتن سابقه قبلی شنا، محدودیت یا درخواست خاص، در این بخش یادداشت بفرمایید..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* 8. NEXT STEPS EXPLANATION */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
            <span>مراحل پس از ثبت درخواست:</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            پس از ارسال، درخواست پیش‌ثبت‌نام شما در کارتابل مدیریت آموزشگاه قرار می‌گیرد. با بررسی ظرفیت و تخصیص مربی و کلاس متناسب، وضعیت دوره برای شما قطعی و در بخش «دوره‌ها و برنامه جلسات من» فعال خواهد شد.
          </p>
        </div>

        {/* 9. SUBMIT & CANCEL BUTTONS */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => navigate('/swimmer/courses?tab=register')}
            className="w-full sm:w-auto"
          >
            انصراف و بازگشت
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={submitting || Boolean(existingEnrollment) || Boolean(pendingRequest)}
            loading={submitting}
            className="w-full sm:w-auto px-6"
          >
            <CheckCircle2 className="w-4 h-4 ml-1.5" />
            <span>تأیید و ارسال درخواست پیش‌ثبت‌نام</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
