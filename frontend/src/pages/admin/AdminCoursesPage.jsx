import React, { useState, useEffect } from 'react';
import {
  BookOpen, Plus, Clock, MapPin, Users,
  Award, Calendar, AlertTriangle, Layers, ChevronRight
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ProgressBar } from '../../components/common/Charts';
import { useToast } from '../../context/ToastContext';
import { Link, useSearchParams } from 'react-router-dom';

export const AdminCoursesPage = () => {
  const [activeTab, setActiveTab] = useState('GROUPS'); // GROUPS, COURSES, LEVELS, SESSIONS
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [levels, setLevels] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Create Course Modal
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseForm, setCourseForm] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    base_price: '',
    sessions_count: 12,
  });
  const [savingCourse, setSavingCourse] = useState(false);

  // Create SwimmerGroup Modal
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({
    course: '',
    name: '',
    skill_level: '',
    capacity: 15,
    pool_location: 'استخر اصلی آزادی - لاین آموزشی ۲',
  });
  const [savingGroup, setSavingGroup] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, groupsRes, levelsRes, sessionsRes] = await Promise.all([
        api.get('/education/courses/'),
        api.get('/education/groups/'),
        api.get('/education/levels/'),
        api.get('/scheduling/sessions/'),
      ]);
      setCourses(coursesRes.data.results || coursesRes.data);
      setGroups(groupsRes.data.results || groupsRes.data);
      setLevels(levelsRes.data.results || levelsRes.data);
      setSessions(sessionsRes.data.results || sessionsRes.data);
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
      setIsCourseModalOpen(true);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('action');
        return next;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      setSavingCourse(true);
      await api.post('/education/courses/', courseForm);
      setIsCourseModalOpen(false);
      setCourseForm({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        base_price: '',
        sessions_count: 12,
      });
      toast.success('دوره آموزشی جدید با موفقیت ایجاد گردید.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در ثبت دوره');
    } finally {
      setSavingCourse(false);
    }
  };

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
        pool_location: 'استخر اصلی آزادی - لاین آموزشی ۲',
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
          <Button variant="outline" onClick={() => setIsCourseModalOpen(true)} className="gap-1.5 text-xs">
            <Plus className="w-4 h-4" />
            <span>تعریف دوره جدید</span>
          </Button>
          <Button onClick={() => setIsGroupModalOpen(true)} className="gap-1.5 text-xs">
            <Plus className="w-4 h-4" />
            <span>ایجاد گروه کلاسی جدید</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700 text-xs w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('GROUPS')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'GROUPS'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>گروه‌های کلاسی و ظرفیت ({groups.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('COURSES')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'COURSES'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>دوره‌ها و بسته‌ها ({courses.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('LEVELS')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'LEVELS'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>سطوح مهارتی ({levels.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('SESSIONS')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'SESSIONS'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>جلسات تقویمی ({sessions.length})</span>
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
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">{course.name}</h3>
                  <Badge variant={course.status === 'ACTIVE' ? 'success' : 'neutral'}>
                    {course.status === 'ACTIVE' ? 'در حال برگزاری' : 'پیش‌ثبت‌نام'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{course.description || 'بدون توضیحات'}</p>
                <div className="flex items-center gap-4 text-xs font-mono text-slate-500 pt-1">
                  <span>شروع: {new Date(course.start_date).toLocaleDateString('fa-IR')}</span>
                  <span>پایان: {new Date(course.end_date).toLocaleDateString('fa-IR')}</span>
                  <span>تعداد جلسات: {course.sessions_count} جلسه</span>
                </div>
              </div>

              <div className="text-left font-mono">
                <span className="text-base font-bold text-slate-900 dark:text-slate-100 block">
                  {formatPrice(course.base_price)} تومان
                </span>
                <span className="text-xs text-slate-400">شهریه هر شناگر</span>
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
        /* TAB 4: CALENDAR & SESSIONS */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              برنامه زمانی جلسات استخر
            </h3>
            <Link to="/admin/sessions" className="text-xs font-semibold text-sky-600 hover:underline">
              مشاهده تقویم کامل و مدیریت کنسلی ←
            </Link>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-right min-w-[640px]">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 rounded-r-xl">گروه کلاسی</th>
                  <th className="px-4 py-3">مربی مسئول</th>
                  <th className="px-4 py-3">تاریخ جلسه</th>
                  <th className="px-4 py-3">ساعت برگزاری</th>
                  <th className="px-4 py-3">محل استخر</th>
                  <th className="px-4 py-3 text-left rounded-l-xl">وضعیت جلسه</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {sessions.slice(0, 10).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">{s.group_name}</td>
                    <td className="px-4 py-3 text-xs">{s.coach_name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{new Date(s.session_date).toLocaleDateString('fa-IR')}</td>
                    <td className="px-4 py-3 font-mono text-xs">{s.start_time?.slice(0, 5)} تا {s.end_time?.slice(0, 5)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{s.pool_location}</td>
                    <td className="px-4 py-3 text-left">
                      <Badge variant={s.status === 'COMPLETED' ? 'success' : s.status === 'CANCELLED' ? 'danger' : 'info'}>
                        {s.status_display}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {sessions.slice(0, 10).map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-2.5 text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{s.group_name}</h4>
                    <span className="text-slate-500 dark:text-slate-400 text-xs block mt-0.5">مربی: {s.coach_name || 'نامشخص'}</span>
                  </div>
                  <Badge variant={s.status === 'COMPLETED' ? 'success' : s.status === 'CANCELLED' ? 'danger' : 'info'}>
                    {s.status_display}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[10px]">تاریخ</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{new Date(s.session_date).toLocaleDateString('fa-IR')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ساعت</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{s.start_time?.slice(0, 5)} تا {s.end_time?.slice(0, 5)}</span>
                  </div>
                  {s.pool_location && (
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[10px]">محل استخر</span>
                      <span className="text-slate-600 dark:text-slate-300">{s.pool_location}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Create Course */}
      <Modal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        title="تعریف دوره و بسته آموزشی جدید"
      >
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              عنوان دوره *
            </label>
            <input
              type="text"
              required
              value={courseForm.name}
              onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
              placeholder="مثال: دوره آموزش شنای کرال پاییزه"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                شهریه پایه دوره (تومان) *
              </label>
              <input
                type="number"
                required
                value={courseForm.base_price}
                onChange={(e) => setCourseForm({ ...courseForm, base_price: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                تعداد کل جلسات دوره *
              </label>
              <input
                type="number"
                required
                min="1"
                value={courseForm.sessions_count}
                onChange={(e) => setCourseForm({ ...courseForm, sessions_count: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                تاریخ شروع دوره *
              </label>
              <input
                type="date"
                required
                value={courseForm.start_date}
                onChange={(e) => setCourseForm({ ...courseForm, start_date: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                تاریخ پایان دوره *
              </label>
              <input
                type="date"
                required
                value={courseForm.end_date}
                onChange={(e) => setCourseForm({ ...courseForm, end_date: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              توضیحات دوره
            </label>
            <textarea
              rows={2}
              value={courseForm.description}
              onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsCourseModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={savingCourse}>
              {savingCourse ? 'در حال ثبت...' : 'ایجاد دوره'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create SwimmerGroup */}
      <Modal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        title="ایجاد گروه کلاسی و لاین جدید"
      >
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              دوره آموزشی والد *
            </label>
            <select
              required
              value={groupForm.course}
              onChange={(e) => setGroupForm({ ...groupForm, course: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
            >
              <option value="">یک دوره را انتخاب کنید...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({formatPrice(c.base_price)} تومان)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              نام گروه اجرایی *
            </label>
            <input
              type="text"
              required
              value={groupForm.name}
              onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
              placeholder="مثال: گروه مقدماتی شنبه و دوشنبه ساعت ۱۷"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                سطح مهارت گروه *
              </label>
              <select
                required
                value={groupForm.skill_level}
                onChange={(e) => setGroupForm({ ...groupForm, skill_level: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              >
                <option value="">انتخاب سطح...</option>
                {levels.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    سطح {lvl.order}: {lvl.name}
                  </option>
                ))}
              </select>
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
