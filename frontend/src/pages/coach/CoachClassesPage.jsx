import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Users, Calendar, MapPin, Search,
  ChevronLeft, ClipboardCheck, Archive
} from 'lucide-react';
import api from '../../api/client';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';

export const CoachClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const res = await api.get('/coaches/my-classes/');
        setClasses(Array.isArray(res.data) ? res.data : res.data.results || []);
      } catch (err) {
        console.error('Error fetching coach classes:', err);
        toast.error('خطا در دریافت فهرست کلاس‌های مربی');
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const isCompletedClass = (cls) =>
    cls.status === 'CLOSED' ||
    cls.status === 'CANCELLED' ||
    cls.course_status === 'COMPLETED' ||
    cls.course_status === 'ARCHIVED';

  const activeClasses = classes.filter((cls) => !isCompletedClass(cls));
  const completedClasses = classes.filter(isCompletedClass);

  const filteredActiveClasses = activeClasses.filter((cls) => {
    const term = searchTerm.toLowerCase();
    return (
      cls.name.toLowerCase().includes(term) ||
      cls.course_name.toLowerCase().includes(term) ||
      cls.skill_level_name.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return <LoadingState type="table" message="در حال دریافت کلاس‌های تخصیص‌یافته به مربی..." />;
  }

  return (
    <div className="space-y-6 pb-12 coach-panel">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
            کلاس‌های من
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            گروه‌های آموزشی، سانس‌های استخر و شناگران تحت آموزش شما
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/coach/workouts"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-base font-bold shadow-xs transition-all active:scale-95"
          >
            <Calendar className="w-4.5 h-4.5" />
            برنامه تمرینات
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4.5 h-4.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="جست‌وجو با نام کلاس، دوره یا سطح..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Archive Link replacing previous select box */}
        <Link
          to="/coach/classes/archive"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-amber-50/70 dark:hover:bg-amber-950/40 hover:border-amber-300 dark:hover:border-amber-700 text-slate-700 dark:text-slate-200 hover:text-amber-700 dark:hover:text-amber-300 text-sm font-bold transition-all shadow-xs group shrink-0"
          title="مشاهده صفحه بایگانی کلاس‌های خاتمه‌یافته"
        >
          <Archive className="w-4.5 h-4.5 text-amber-500 group-hover:scale-110 transition-transform" />
          <span>بایگانی کلاس‌ها</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
            {completedClasses.length}
          </span>
        </Link>
      </div>

      {/* Active Classes Grid */}
      {filteredActiveClasses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredActiveClasses.map((cls) => (
            <div
              key={cls.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-lg text-white mb-2 inline-block"
                      style={{ backgroundColor: cls.skill_level_color || '#0284c7' }}
                    >
                      {cls.skill_level_name}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {cls.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                      {cls.course_name}
                    </p>
                  </div>

                  <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${cls.status === 'FULL' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'}`}>
                    {cls.status === 'FULL' ? 'تکمیل ظرفیت' : 'فعال'}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Users className="w-4 h-4 text-emerald-600" />
                      تعداد شناگران:
                    </span>
                    <span className="font-bold font-mono text-sm">
                      {cls.enrolled_count} از {cls.capacity} نفر
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      محل استخر:
                    </span>
                    <span className="font-medium truncate max-w-[170px]">
                      {cls.pool_location}
                    </span>
                  </div>

                  {cls.schedules && cls.schedules.length > 0 && (
                    <div className="pt-2">
                      <span className="text-xs font-bold text-slate-400 block mb-1.5">برنامه هفتگی:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {cls.schedules.map((sch, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                          >
                            {sch.weekday_display} {sch.start_time.slice(0, 5)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2.5">
                <Link
                  to={`/coach/classes/${cls.id}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-200 text-sm font-bold transition-all"
                >
                  مشاهده پرونده و جلسات
                  <ChevronLeft className="w-4 h-4" />
                </Link>
                <Link
                  to={`/coach/attendance?group_id=${cls.id}`}
                  className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors"
                  title="ثبت سریع حضور و غیاب"
                >
                  <ClipboardCheck className="w-5 h-5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-2">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">کلاسی یافت نشد</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {searchTerm ? 'هیچ کلاس فعالی با عبارت جست‌وجو شده مطابقت ندارد.' : 'در حال حاضر کلاس جاری و فعالی به شما تخصیص داده نشده است.'}
          </p>
        </div>
      )}
    </div>
  );
};
