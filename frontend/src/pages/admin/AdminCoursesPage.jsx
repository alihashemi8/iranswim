import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Clock, MapPin } from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';

export const AdminCoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    base_price: '',
    sessions_count: 12,
  });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/education/courses/');
      setCourses(res.data.results || res.data);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت لیست دوره‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.post('/education/courses/', form);
      setIsModalOpen(false);
      setForm({ name: '', description: '', start_date: '', end_date: '', base_price: '', sessions_count: 12 });
      toast.success('دوره آموزشی جدید با موفقیت ایجاد گردید.');
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در ثبت دوره');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-600" />
            مدیریت دوره‌های آموزشی و گروه‌ها
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            تعریف دوره‌ها، زمان‌بندی روز و ساعت، رصد ظرفیت کلاس‌ها و تخصیص مربیان
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="self-start sm:self-auto gap-2">
          <Plus className="w-4 h-4" />
          <span>تعریف دوره جدید</span>
        </Button>
      </div>

      {loading ? (
        <LoadingState message="در حال دریافت فهرست دوره‌ها..." />
      ) : courses.length === 0 ? (
        <EmptyState title="دوره‌ای تعریف نشده است" description="با کلیک روی دکمه بالا، اولین دوره آموزشی را ایجاد کنید." />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{course.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{course.description || 'بدون توضیح'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={course.status === 'ACTIVE' ? 'success' : 'neutral'}>
                    {course.status === 'ACTIVE' ? 'در حال برگزاری' : 'پیش‌ثبت‌نام'}
                  </Badge>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700 font-mono">
                    {Number(course.base_price).toLocaleString('fa-IR')} تومان
                  </span>
                </div>
              </div>

              {/* Course Groups */}
              <div className="mt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  گروه‌های اجرایی دوره:
                </h4>
                {course.groups?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">هنوز گروهی برای این دوره تعریف نشده است.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {course.groups.map((grp) => {
                      const capacityPercent = Math.min(100, Math.round(((grp.current_enrollments_count || 0) / grp.capacity) * 100));
                      return (
                        <div key={grp.id} className="bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{grp.name}</span>
                            <Badge variant={grp.remaining_capacity > 0 ? 'info' : 'danger'}>
                              {grp.level_name}
                            </Badge>
                          </div>

                          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-3">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{grp.pool_location}</span>
                            </div>
                            {grp.schedules?.map((sch) => (
                              <div key={sch.id} className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{sch.weekday_display} {sch.start_time.slice(0, 5)} تا {sch.end_time.slice(0, 5)}</span>
                              </div>
                            ))}
                          </div>

                          {/* Capacity Bar */}
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-500 dark:text-slate-400">ظرفیت تکمیل:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                                {grp.current_enrollments_count || 0} از {grp.capacity} نفر ({grp.remaining_capacity} جای خالی)
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  capacityPercent >= 90 ? 'bg-rose-500' : 'bg-sky-500'
                                }`}
                                style={{ width: `${capacityPercent}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="تعریف دوره آموزشی جدید">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">عنوان دوره:</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="مثال: دوره آموزش شنای استقامت زمستان ۱۴۰۵"
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">توضیحات دوره:</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">تاریخ شروع:</label>
              <input
                type="date"
                required
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">تاریخ پایان:</label>
              <input
                type="date"
                required
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">شهریه پایه (تومان):</label>
              <input
                type="number"
                required
                value={form.base_price}
                onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                placeholder="2500000"
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">تعداد جلسات کل دوره:</label>
              <input
                type="number"
                required
                value={form.sessions_count}
                onChange={(e) => setForm({ ...form, sessions_count: e.target.value })}
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" loading={saving}>
              ذخیره و ثبت دوره
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
