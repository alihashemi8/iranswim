import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BookOpen, Users, Calendar, MapPin, ChevronRight,
  ClipboardCheck, Award, TrendingUp, CheckCircle2,
  Clock, ArrowLeft, MessageSquare, AlertCircle
} from 'lucide-react';
import api from '../../api/client';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';

export const CoachClassDetailPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('swimmers'); // 'swimmers', 'sessions', 'info'
  const toast = useToast();

  useEffect(() => {
    const fetchClassDetail = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/coaches/my-classes/${id}/`);
        setData(res.data);
      } catch (err) {
        console.error('Error fetching class detail:', err);
        toast.error('خطا در دریافت جزئیات کلاس');
      } finally {
        setLoading(false);
      }
    };
    fetchClassDetail();
  }, [id]);

  if (loading) {
    return <LoadingState type="table" message="در حال بارگذاری جزئیات کلاس و فهرست شناگران..." />;
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">کلاس مورد نظر یافت نشد.</p>
        <Link to="/coach/classes" className="text-emerald-600 text-sm font-bold mt-2 inline-block">
          بازگشت به فهرست کلاس‌ها
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Back button and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              to="/coach/classes"
              className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1 font-semibold transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              کلاس‌های من
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">{data.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            {data.name}
            <span className="text-xs font-normal px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              سطح: {data.skill_level}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            دوره {data.course_name} · محل: {data.pool_location}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/coach/attendance?group_id=${data.id}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95"
          >
            <ClipboardCheck className="w-4 h-4" />
            حضور و غیاب کلاس
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('swimmers')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'swimmers'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          فهرست شناگران ({data.swimmers?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'sessions'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          جلسات کلاسی ({data.sessions?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'info'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          برنامه زمانی و مشخصات
        </button>
      </div>

      {/* Tab 1: Swimmers List */}
      {activeTab === 'swimmers' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/60 font-semibold">
                <tr>
                  <th className="py-3 px-4">شناگر</th>
                  <th className="py-3 px-4">کد ملی</th>
                  <th className="py-3 px-4">سطح مهارت</th>
                  <th className="py-3 px-4">جلسات حضور</th>
                  <th className="py-3 px-4">درصد حضور</th>
                  <th className="py-3 px-4 text-center">اقدامات آموزشی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.swimmers && data.swimmers.length > 0 ? (
                  data.swimmers.map((sw) => (
                    <tr key={sw.swimmer_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {sw.full_name}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {sw.national_id || '---'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                          {sw.level_name}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold">
                        {sw.sessions_attended} جلسه
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${sw.attendance_rate >= 80 ? 'bg-emerald-500' : sw.attendance_rate >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${Math.min(100, sw.attendance_rate)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-bold">
                            {sw.attendance_rate}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          to={`/coach/progress/${sw.swimmer_id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white text-xs font-bold transition-all"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          پرونده مهارت
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400">
                      هیچ شناگری در این کلاس ثبت‌نام نشده است.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Sessions */}
      {activeTab === 'sessions' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/60 font-semibold">
                <tr>
                  <th className="py-3 px-4">تاریخ جلسه</th>
                  <th className="py-3 px-4">ساعت برگزاری</th>
                  <th className="py-3 px-4">محل استخر</th>
                  <th className="py-3 px-4">وضعیت جلسه</th>
                  <th className="py-3 px-4">وضعیت حضور و غیاب</th>
                  <th className="py-3 px-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.sessions && data.sessions.length > 0 ? (
                  data.sessions.map((sess) => (
                    <tr key={sess.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold font-mono text-slate-900 dark:text-white">
                        {sess.session_date}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {sess.start_time} تا {sess.end_time}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {sess.pool_location}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-md font-medium text-[11px] ${
                          sess.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' :
                          sess.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700' :
                          'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300'
                        }`}>
                          {sess.status_display}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {sess.has_attendance ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            ثبت‌شده
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium">
                            ثبت‌نشده
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          to={`/coach/attendance?session_id=${sess.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          {sess.has_attendance ? 'ویرایش حضور' : 'ثبت حضور'}
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400">
                      جلسه‌ای برای این کلاس تعریف نشده است.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Info */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              برنامه هفتگی ثابت
            </h3>
            <div className="space-y-2">
              {data.schedules && data.schedules.length > 0 ? (
                data.schedules.map((sch, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                    <span className="font-bold text-slate-800 dark:text-white">{sch.weekday_display}</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300">ساعت {sch.start_time} تا {sch.end_time}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">برنامه هفتگی ثبت نشده است.</p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              مشخصات دوره و ظرفیت
            </h3>
            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">عنوان دوره:</span>
                <span className="font-bold text-slate-900 dark:text-white">{data.course_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">وضعیت دوره:</span>
                <span>{data.course_status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">ظرفیت مجاز:</span>
                <span className="font-mono font-bold">{data.capacity} نفر</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">شناگران ثبت‌نام‌شده:</span>
                <span className="font-mono font-bold text-emerald-600">{data.enrolled_count} نفر</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
