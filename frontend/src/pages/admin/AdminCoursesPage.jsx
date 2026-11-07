import React, { useState, useEffect } from 'react';
import {
  BookOpen, Plus, Clock, MapPin, Users,
  Award, Calendar, AlertTriangle, Layers, ChevronRight,
  GraduationCap, LayoutGrid, List, CheckCircle2, UserCheck, Eye
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
import { SessionsScheduleTimetable } from '../../components/common/SessionsScheduleTimetable';
import { CustomSelect } from '../../components/common/CustomSelect';
import { useToast } from '../../context/ToastContext';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';

export const AdminCoursesPage = () => {
  const [activeTab, setActiveTab] = useState('GROUPS'); // GROUPS, COURSES, LEVELS, SESSIONS
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [levels, setLevels] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Swimmers of Course Modal / Drawer
  const [selectedCourseForSwimmers, setSelectedCourseForSwimmers] = useState(null);
  const [courseEnrollments, setCourseEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [swimmerViewMode, setSwimmerViewMode] = useState('cards'); // 'cards' | 'table'

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
      setCourses(coursesRes.data.results || coursesRes.data);
      setGroups(groupsRes.data.results || groupsRes.data);
      setLevels(levelsRes.data.results || levelsRes.data);
      setSessions(sessionsRes.data.results || sessionsRes.data);
      setCoaches(coachesRes.data.results || coachesRes.data);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت اطلاعات کلاس‌ها و برنامه‌ریزی');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Open Course Swimmers View
  const handleOpenCourseSwimmers = async (course) => {
    setSelectedCourseForSwimmers(course);
    setLoadingEnrollments(true);
    try {
      const res = await api.get(`/education/enrollments/?course_id=${course.id}`);
      setCourseEnrollments(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت لیست شناگران دوره');
    } finally {
      setLoadingEnrollments(false);
    }
  };

  // Assign Coach to Enrollment within Course Swimmers View
  const handleAssignCoachToEnrollment = async (enrollmentId, coachId) => {
    try {
      const res = await api.post(`/education/enrollments/${enrollmentId}/assign-coach/`, { coach_id: coachId });
      setCourseEnrollments((prev) =>
        prev.map((e) => (e.id === enrollmentId ? res.data : e))
      );
      toast.success(coachId ? 'مربی با موفقیت به شناگر تخصیص یافت.' : 'تخصیص مربی با موفقیت حذف شد.');
    } catch (err) {
      console.error(err);
      toast.error('خطا در تخصیص مربی به شناگر');
    }
  };

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
      toast.error('لطفاً تمام فیلدهای الزامی گروه را پر کنید.');
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
      toast.success('گروه کلاسی جدید با موفقیت تعریف شد.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در ایجاد گروه');
    } finally {
      setSavingGroup(false);
    }
  };

  const formatPrice = (v) => Number(v || 0).toLocaleString('fa-IR');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-600" />
            برنامه‌ریزی آموزشی، دوره‌ها، گروه‌ها و جلسات
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            تفکیک ۴ مفهوم بنیادین (سطح مهارت، دوره، گروه کلاسی، جلسه) و کنترل ظرفیت لاین‌های استخر
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={() => navigate('/admin/courses/new')} className="gap-2 text-sm">
            <Plus className="w-4 h-4" />
            <span>تعریف دوره جدید</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700 w-full shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('GROUPS')}
          className={`py-3 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm md:text-base transition-all cursor-pointer flex items-center justify-center gap-2 sm:gap-2.5 ${
            activeTab === 'GROUPS'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm border border-slate-200/50 dark:border-slate-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-700/40'
          }`}
        >
          <Users className="w-5 h-5 shrink-0" />
          <span className="whitespace-nowrap">گروه‌های کلاسی و ظرفیت</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold transition-colors ${
              activeTab === 'GROUPS'
                ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {groups.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('COURSES')}
          className={`py-3 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm md:text-base transition-all cursor-pointer flex items-center justify-center gap-2 sm:gap-2.5 ${
            activeTab === 'COURSES'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm border border-slate-200/50 dark:border-slate-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-700/40'
          }`}
        >
          <BookOpen className="w-5 h-5 shrink-0" />
          <span className="whitespace-nowrap">دوره‌ها و بسته‌ها</span>
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
          onClick={() => setActiveTab('LEVELS')}
          className={`py-3 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm md:text-base transition-all cursor-pointer flex items-center justify-center gap-2 sm:gap-2.5 ${
            activeTab === 'LEVELS'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm border border-slate-200/50 dark:border-slate-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-700/40'
          }`}
        >
          <Award className="w-5 h-5 shrink-0" />
          <span className="whitespace-nowrap">سطوح مهارتی</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold transition-colors ${
              activeTab === 'LEVELS'
                ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {levels.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SESSIONS')}
          className={`py-3 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm md:text-base transition-all cursor-pointer flex items-center justify-center gap-2 sm:gap-2.5 ${
            activeTab === 'SESSIONS'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm border border-slate-200/50 dark:border-slate-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-700/40'
          }`}
        >
          <Calendar className="w-5 h-5 shrink-0" />
          <span className="whitespace-nowrap">جلسات تقویمی</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold transition-colors ${
              activeTab === 'SESSIONS'
                ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {sessions.length}
          </span>
        </button>
      </div>

      {loading ? (
        <LoadingState type="cards" count={6} message="در حال دریافت داده‌های آموزشی..." />
      ) : activeTab === 'GROUPS' ? (
        /* TAB 1: SWIMMER GROUPS & CAPACITY */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                      {group.level_name}
                    </span>
                    <Badge variant={isFull ? 'danger' : 'success'}>
                      {isFull ? 'تکمیل ظرفیت' : 'ثبت‌نام باز'}
                    </Badge>
                  </div>

                  <div className="py-3 space-y-2.5">
                    <div>
                      <span className="text-[11px] text-slate-400 block">{group.course_name}</span>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {group.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{group.pool_location}</span>
                    </div>

                    {/* Weekly Schedule */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700 space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 block">برنامه هفتگی:</span>
                      {(group.schedules || []).length === 0 ? (
                        <span className="text-[11px] text-slate-400">برنامه ساعتی ثبت نشده است</span>
                      ) : (
                        group.schedules.map((sch) => (
                          <div key={sch.id} className="text-xs font-mono text-slate-700 dark:text-slate-300 flex justify-between">
                            <span>{sch.weekday_display}</span>
                            <span>{sch.start_time?.slice(0, 5)} تا {sch.end_time?.slice(0, 5)}</span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Capacity Bar */}
                    <div className="pt-2">
                      <ProgressBar
                        label="وضعیت پذیرش لاین"
                        value={group.current_enrollments_count}
                        max={group.capacity}
                        color={isFull ? 'rose' : group.remaining_capacity < 3 ? 'amber' : 'emerald'}
                        subtitle={`${group.current_enrollments_count} نفر ثبت‌نام‌شده (${group.remaining_capacity} جای خالی)`}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono">ظرفیت کل: {group.capacity} نفر</span>
                  <Link
                    to="/admin/enrollments"
                    className="text-sky-600 dark:text-sky-400 font-semibold hover:underline"
                  >
                    مشاهده متقاضیان ←
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : activeTab === 'COURSES' ? (
        /* TAB 2: COURSES */
        <div className="grid grid-cols-1 gap-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-5"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0 border border-sky-200/60 dark:border-sky-800">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                        {course.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
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
                    </div>
                  </div>

                  <div className="text-left font-mono">
                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100 block">
                      {formatPrice(course.base_price)} تومان
                    </span>
                    <span className="text-xs text-slate-400">
                      شهریه هر شناگر ({course.sessions_count} جلسه
                      {course.installments_count && course.installments_count > 1 ? ` • تا ${course.installments_count} قسط مجاز` : ' • پرداخت یکجا'}
                      )
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {course.description || 'بدون توضیحات ثبت‌شده برای دوره'}
                </p>

                {/* Course Metadata (Pool, Days, Hours) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-sky-500 shrink-0" />
                    <span className="font-semibold">{course.pool_location || 'استخر شهید رئیسی'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{course.days_of_week || 'سه‌شنبه و پنج‌شنبه'} ({course.time_display || '۱۷:۰۰ الی ۱۹:۰۰'})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-mono text-[11px]">
                      {new Date(course.start_date).toLocaleDateString('fa-IR')} تا {new Date(course.end_date).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                </div>

                {/* Assigned Coaches & Classes List (مربی A -> کلاس A) */}
                <div className="pt-2">
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      مربیان و کلاس‌های اختصاصی دوره (
                      {course.coaches?.length || course.groups?.length || 0} کلاس):
                    </span>
                    <span className="text-[11px] text-slate-400">
                      هر مربی دارای یک کلاس مجزا در این دوره است
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {course.coaches && course.coaches.length > 0 ? (
                      course.coaches.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-800/80 text-xs text-slate-800 dark:text-slate-200"
                        >
                          <div className="relative shrink-0">
                            {c.avatar ? (
                              <img
                                src={c.avatar}
                                alt={c.full_name}
                                className="w-6 h-6 rounded-full object-cover border border-sky-400"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-[10px]">
                                {c.full_name?.charAt(0) || 'م'}
                              </div>
                            )}
                          </div>
                          <span className="font-bold">{c.full_name}</span>
                          <span className="text-[10px] text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/60 px-1.5 py-0.5 rounded-md font-semibold">
                            {c.class_name}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        هنوز مربی به این دوره اختصاص نیافته است.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-400">
                  ظرفیت لاین‌ها بر اساس کلاس‌های مربیان محاسبه می‌شود
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleOpenCourseSwimmers(course)}
                    className="gap-1.5 text-xs bg-sky-600 hover:bg-sky-700 text-white"
                  >
                    <Users className="w-4 h-4" />
                    <span>شناگران دوره و تخصیص مربی</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === 'LEVELS' ? (
        /* TAB 3: SKILL LEVELS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {levels.map((lvl) => (
            <div
              key={lvl.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: lvl.color_badge || '#0284c7' }}
                  />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    سطح {lvl.order}: {lvl.name}
                  </h3>
                </div>
                <Badge variant={lvl.is_active ? 'success' : 'neutral'}>
                  {lvl.is_active ? 'فعال' : 'غیرفعال'}
                </Badge>
              </div>

              <div className="py-3 text-xs text-slate-600 dark:text-slate-400">
                <p>{lvl.description || 'توضیحات پیش‌نیاز ثبت نشده است.'}</p>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between font-mono text-slate-500">
                  <span>سرفصل‌های ارزیابی:</span>
                  <span className="font-bold">{(lvl.skills || []).length} مهارت</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TAB 4: CALENDAR & SESSIONS (جدول روز در ساعت و امکان دانلود باکیفیت) */
        <SessionsScheduleTimetable
          sessions={sessions}
          groups={groups}
          coaches={coaches}
          onRefresh={fetchData}
        />
      )}



      {/* Modal: View Swimmers of Course & Assign Coaches */}
      <Modal
        isOpen={Boolean(selectedCourseForSwimmers)}
        onClose={() => setSelectedCourseForSwimmers(null)}
        title={selectedCourseForSwimmers ? `شناگران دوره: ${selectedCourseForSwimmers.name}` : ''}
        maxWidth="max-w-4xl"
      >
        {selectedCourseForSwimmers && (
          <div className="space-y-4">
            {/* Header info */}
            <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/70 dark:border-sky-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sky-900 dark:text-sky-200 text-sm">
                    {selectedCourseForSwimmers.name}
                  </span>
                  <Badge variant="info">
                    {selectedCourseForSwimmers.gender_display || 'پسرانه'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {selectedCourseForSwimmers.pool_location || 'استخر شهید رئیسی'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {selectedCourseForSwimmers.days_of_week} ({selectedCourseForSwimmers.time_display || '۱۷:۰۰ الی ۱۹:۰۰'})
                  </span>
                </div>
              </div>

              {/* View Switcher */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSwimmerViewMode('cards')}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                    swimmerViewMode === 'cards'
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="نمای کارتی"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">کارت‌ها</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSwimmerViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                    swimmerViewMode === 'table'
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="نمای جدولی"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">جدول</span>
                </button>
              </div>
            </div>

            {/* Swimmers Content */}
            {loadingEnrollments ? (
              <LoadingState type="cards" count={3} message="در حال دریافت شناگران دوره..." />
            ) : courseEnrollments.length === 0 ? (
              <EmptyState
                title="شناگری در این دوره ثبت‌نام نکرده است"
                description="متقاضیان می‌توانند از طریق فرم درخواست آنلاین ثبت‌نام کنند یا مدیر می‌تواند شناگر را مستقیم در کلاس ثبت‌نام نماید."
              />
            ) : swimmerViewMode === 'cards' ? (
              /* CARDS VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
                {courseEnrollments.map((enr) => (
                  <SwimmerCourseCard
                    key={enr.id}
                    swimmer={{
                      full_name: enr.swimmer_name,
                      avatar: enr.swimmer_avatar,
                      phone: enr.swimmer_phone,
                      national_id: enr.swimmer_national_id,
                      level_name: enr.swimmer_level_name,
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
                    availableCoaches={enr.course_coaches || selectedCourseForSwimmers.coaches || []}
                    onSelectCoach={(coachId) => handleAssignCoachToEnrollment(enr.id, coachId)}
                    onOpenDossier={() => navigate(`/admin/swimmers/${enr.swimmer}`)}
                    status={enr.status}
                    sessionsPurchased={enr.sessions_purchased}
                    sessionsAttended={enr.sessions_attended}
                  />
                ))}
              </div>
            ) : (
              /* TABLE VIEW */
              <div className="overflow-x-auto max-h-[60vh] p-1">
                <table className="w-full text-sm text-right min-w-[650px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3 rounded-r-xl">شناگر</th>
                      <th className="px-4 py-3">کلاس / گروه</th>
                      <th className="px-4 py-3">مربی تخصیص‌یافته</th>
                      <th className="px-4 py-3">جلسات</th>
                      <th className="px-4 py-3">وضعیت</th>
                      <th className="px-4 py-3 text-center rounded-l-xl">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {courseEnrollments.map((enr) => (
                      <tr key={enr.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {enr.swimmer_avatar ? (
                              <img
                                src={enr.swimmer_avatar}
                                alt={enr.swimmer_name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs">
                                {enr.swimmer_name?.charAt(0) || 'ش'}
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block text-xs">
                                {enr.swimmer_name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {enr.swimmer_phone}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-700 dark:text-slate-300">
                          {enr.group_name || 'بدون کلاس'}
                        </td>
                        <td className="px-4 py-3">
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
                            availableCoaches={enr.course_coaches || selectedCourseForSwimmers.coaches || []}
                            onSelectCoach={(coachId) => handleAssignCoachToEnrollment(enr.id, coachId)}
                            placement="auto"
                            size="sm"
                          />
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-500">
                          {enr.sessions_attended} از {enr.sessions_purchased}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={enr.status === 'ACTIVE' ? 'success' : 'neutral'}>
                            {enr.status === 'ACTIVE' ? 'فعال' : enr.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/swimmers/${enr.swimmer}`)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600 dark:text-sky-400 transition-colors inline-flex items-center gap-1 text-xs cursor-pointer"
                            title="مشاهده پرونده جامع"
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
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setSelectedCourseForSwimmers(null)}>
                بستن
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Create SwimmerGroup */}
      <Modal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        title="ایجاد گروه کلاسی و لاین جدید"
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
              نام گروه اجرایی *
            </label>
            <input
              type="text"
              required
              value={groupForm.name}
              onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
              placeholder="مثال: گروه مقدماتی شنبه و دوشنبه ساعت ۱۷"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                سطح مهارت گروه *
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
                ظرفیت مجاز گروه (نفر) *
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
              محل استخر و لاین
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
              {savingGroup ? 'در حال ثبت...' : 'ایجاد گروه'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
