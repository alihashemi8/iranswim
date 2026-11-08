import React, { useState, useEffect } from 'react';
import {
  BookOpen, Plus, Clock, MapPin, Users,
  Calendar, GraduationCap, ChevronRight
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ProgressBar } from '../../components/common/Charts';
import { SessionsScheduleTimetable } from '../../components/common/SessionsScheduleTimetable';
import { CustomSelect } from '../../components/common/CustomSelect';
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

  const formatPrice = (v) => Number(v || 0).toLocaleString('fa-IR');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-600" />
            <span>برنامه‌ریزی، دوره‌ها و کلاس‌های آموزشی</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            مدیریت دوره‌های آموزشی، کلاس‌ها، کنترل ظرفیت و جدول هفتگی برنامه‌ریزی
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={() => navigate('/admin/courses/new')} className="gap-2 text-sm">
            <Plus className="w-4 h-4" />
            <span>تعریف دوره جدید</span>
          </Button>
        </div>
      </div>

      {/* Tabs: Unified Courses & Classes + Weekly Timetable */}
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
          <BookOpen className="w-5 h-5 shrink-0" />
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
            {courses.length}
          </span>
        </button>
      </div>

      {loading ? (
        <LoadingState type="cards" count={6} message="در حال دریافت داده‌های آموزشی..." />
      ) : activeTab === 'COURSES' ? (
        /* TAB 1: UNIFIED COURSES AND THEIR EMBEDDED CLASSES */
        courses.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
            <EmptyState
              title="هنوز دوره‌ای تعریف نشده است"
              description="می‌توانید با کلیک روی دکمه «تعریف دوره جدید»، دوره آموزشی و کلاس‌های مربوطه را ایجاد نمایید."
            />
            <div className="pt-4 flex justify-center">
              <Button onClick={() => navigate('/admin/courses/new')} className="gap-2 text-sm">
                <Plus className="w-4 h-4" />
                <span>تعریف اولین دوره آموزشی</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {courses.map((course) => {
              // Find all classes/groups belonging to this course
              const courseGroups = (course.groups && course.groups.length > 0)
                ? course.groups
                : groups.filter(
                    (g) => Number(g.course) === Number(course.id) || Number(g.course_id) === Number(course.id)
                  );

              const totalCapacity = courseGroups.reduce((acc, g) => acc + (Number(g.capacity) || 0), 0);
              const totalEnrolled = courseGroups.reduce((acc, g) => acc + (Number(g.current_enrollments_count) || 0), 0);
              const totalRemaining = Math.max(0, totalCapacity - totalEnrolled);
              const isCourseFull = totalCapacity > 0 && totalRemaining <= 0;

              return (
                <div
                  key={course.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-5"
                >
                  <div className="space-y-4">
                    {/* Course Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0 border border-sky-200/60 dark:border-sky-800 shadow-2xs">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <Link
                            to={`/admin/courses/${course.id}`}
                            className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors block"
                          >
                            <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                              {course.name}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                        <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 block">
                          {formatPrice(course.base_price)} تومان
                        </span>
                        <span className="text-xs text-slate-400">
                          شهریه هر شناگر ({course.sessions_count} جلسه
                          {course.installments_count && course.installments_count > 1
                            ? ` • تا ${course.installments_count} قسط مجاز`
                            : ' • پرداخت یکجا'}
                          )
                        </span>
                      </div>
                    </div>

                    {/* Course Description */}
                    {course.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {course.description}
                      </p>
                    )}

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

                    {/* Overall Course Capacity Bar */}
                    {totalCapacity > 0 && (
                      <div className="pt-1">
                        <ProgressBar
                          label="وضعیت پذیرش و ظرفیت کل دوره"
                          value={totalEnrolled}
                          max={totalCapacity}
                          color={isCourseFull ? 'rose' : totalRemaining < 5 ? 'amber' : 'emerald'}
                          subtitle={`${totalEnrolled} نفر ثبت‌نام‌شده از مجموع ${totalCapacity} نفر (${totalRemaining} جای خالی)`}
                        />
                      </div>
                    )}

                    {/* Unified Classes of this Course */}
                    <div className="pt-2 space-y-2.5">
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                          <span>کلاس‌های این دوره ({courseGroups.length} کلاس):</span>
                        </span>
                        <span className="text-[11px] text-slate-400">
                          اطلاعات ظرفیت و مربی هر کلاس
                        </span>
                      </div>

                      {courseGroups.length === 0 ? (
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-400 text-center">
                          هنوز کلاسی برای این دوره ثبت نشده است.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {courseGroups.map((g) => {
                            const gRemaining = g.remaining_capacity !== undefined
                              ? g.remaining_capacity
                              : Math.max(0, (g.capacity || 0) - (g.current_enrollments_count || 0));
                            const gIsFull = gRemaining <= 0;
                            const coachAssignment = (g.coach_assignments && g.coach_assignments.length > 0)
                              ? g.coach_assignments[0]
                              : null;
                            const coachName = coachAssignment?.coach_name;

                            return (
                              <div
                                key={g.id}
                                className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 flex flex-col justify-between gap-3 hover:border-sky-300 dark:hover:border-sky-700 transition-colors"
                              >
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <Link
                                      to={`/admin/classes/${g.id}`}
                                      className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 truncate block"
                                    >
                                      {g.name}
                                    </Link>
                                    <Badge variant={gIsFull ? 'danger' : 'success'} size="sm">
                                      {gIsFull ? 'تکمیل' : `${gRemaining} خالی`}
                                    </Badge>
                                  </div>

                                  {coachName && (
                                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                                      <GraduationCap className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                                      <span>مربی: {coachName}</span>
                                    </div>
                                  )}

                                  {g.level_name && (
                                    <span className="inline-block text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">
                                      {g.level_name}
                                    </span>
                                  )}
                                </div>

                                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                                  <span className="font-mono text-slate-500 text-[11px]">
                                    {g.current_enrollments_count || 0} / {g.capacity || 0} نفر
                                  </span>
                                  <Link
                                    to={`/admin/classes/${g.id}`}
                                    className="text-sky-600 dark:text-sky-400 font-bold hover:underline inline-flex items-center gap-1 text-xs"
                                  >
                                    <span>ورود به کلاس</span>
                                    <span className="text-[10px]">←</span>
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span>ظرفیت کل دوره:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                        {totalEnrolled} از {totalCapacity} نفر
                      </span>
                      {totalRemaining > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          ({totalRemaining} جای خالی برای ثبت‌نام)
                        </span>
                      ) : (
                        <span className="text-rose-500 font-semibold">(ظرفیت تکمیل)</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => navigate(`/admin/courses/${course.id}`)}
                        className="gap-1.5 text-xs bg-sky-600 hover:bg-sky-700 text-white cursor-pointer"
                      >
                        <Users className="w-4 h-4" />
                        <span>مدیریت دوره و شناگران</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
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
