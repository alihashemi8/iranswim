import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap, Users, Calendar, MapPin, ChevronRight,
  ClipboardCheck, TrendingUp, CheckCircle2, Clock,
  ArrowRight, UserCheck, AlertCircle, Award, BookOpen,
  ArrowLeft, Search, Eye, Megaphone, Pin, Bell, MessageSquare
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ProgressBar } from '../../components/common/Charts';
import { useToast } from '../../context/ToastContext';

export const AdminClassDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('swimmers'); // 'swimmers', 'sessions', 'info'
  const [searchTerm, setSearchTerm] = useState('');

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
    if (id) fetchClassDetail();
  }, [id]);

  if (loading) {
    return <LoadingState type="table" message="در حال بارگذاری فضای اختصاصی کلاس و فهرست شناگران..." />;
  }

  if (!data) {
    return (
      <div className="text-center py-16 space-y-4">
        <EmptyState
          title="کلاس مورد نظر یافت نشد"
          description="اطلاعاتی برای این کلاس یا گروه آموزشی در سیستم ثبت نشده است."
        />
        <Button onClick={() => navigate('/admin/courses')} variant="outline" className="gap-2">
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به برنامه‌ریزی دوره‌ها و کلاس‌ها</span>
        </Button>
      </div>
    );
  }

  const swimmers = data.swimmers || [];
  const sessions = data.sessions || [];
  const schedules = data.schedules || [];
  const announcements = data.announcements || [];

  const filteredSwimmers = swimmers.filter((sw) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.trim().toLowerCase();
    return (
      sw.full_name?.toLowerCase().includes(q) ||
      sw.national_id?.includes(q) ||
      sw.level_name?.toLowerCase().includes(q)
    );
  });

  const nextSession = sessions.find((s) => s.status === 'SCHEDULED');

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
        <Link
          to="/admin/courses"
          className="hover:text-sky-600 dark:hover:text-sky-400 font-bold transition-colors flex items-center gap-1"
        >
          <span>برنامه‌ریزی، دوره‌ها و کلاس‌ها</span>
        </Link>
        <ChevronRight className="w-4 h-4 text-slate-400" />
        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{data.name}</span>
      </div>

      {/* Main Class Hero Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-colors">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 border border-sky-200/70 dark:border-sky-800 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {data.name}
                </h1>
                <Badge variant="teal">
                  سطح: {data.skill_level}
                </Badge>
                {data.course_status && (
                  <Badge variant={data.course_status === 'ACTIVE' ? 'success' : 'neutral'}>
                    {data.course_status === 'ACTIVE' ? 'دوره فعال' : data.course_status}
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>دوره آموزشی: {data.course_name}</span>
                <span>•</span>
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{data.pool_location}</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400 pt-1 flex-wrap">
            <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
              <Users className="w-4 h-4 text-sky-600" />
              <span>شناگران: </span>
              <strong className="text-slate-900 dark:text-white font-mono">{swimmers.length}</strong>
              <span className="text-slate-400 font-mono">/ {data.capacity} نفر</span>
            </span>

            <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>جلسات: </span>
              <strong className="text-slate-900 dark:text-white font-mono">{sessions.length} جلسه</strong>
            </span>

            {schedules.length > 0 && (
              <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700 font-mono">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>{schedules.map((s) => s.weekday_display || s.weekday).join('، ')}</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to={nextSession ? `/admin/attendance/${nextSession.id}` : `/admin/attendance`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>برگه حضور و غیاب کلاس</span>
          </Link>

          <Link
            to="/admin/enrollments"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold transition-all"
          >
            <Users className="w-4 h-4" />
            <span>مدیریت متقاضیان دوره</span>
          </Link>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/70 dark:border-slate-700 w-full text-xs sm:text-sm font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('swimmers')}
          className={`py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'swimmers'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>شناگران ({swimmers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sessions')}
          className={`py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'sessions'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>جلسات ({sessions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('announcements')}
          className={`py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'announcements'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>اعلانات کلاس ({announcements.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'info'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>مشخصات و زمان</span>
        </button>
      </div>

      {/* TAB 1: SWIMMERS ROSTER */}
      {activeTab === 'swimmers' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                فهرست شناگران ثبت‌نام‌شده در این کلاس
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                مشاهده اطلاعات فردی، درصد حضور و دسترسی سریع به پرونده مهارتی
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="جستجوی شناگر یا کد ملی..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-9 pl-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          {filteredSwimmers.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              {searchTerm ? 'شناگری با این مشخصات یافت نشد.' : 'هنوز شناگری به این کلاس اضافه نشده است.'}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/70 dark:border-slate-800">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">
                  <tr>
                    <th className="py-3 px-4 rounded-r-xl">شناگر</th>
                    <th className="py-3 px-4">کد ملی</th>
                    <th className="py-3 px-4">سطح آموزشی</th>
                    <th className="py-3 px-4">جلسات حضور</th>
                    <th className="py-3 px-4">درصد حضور</th>
                    <th className="py-3 px-4 text-center rounded-l-xl">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredSwimmers.map((sw) => (
                    <tr key={sw.swimmer_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {sw.full_name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400 text-xs">
                        {sw.national_id || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold text-xs">
                          {sw.level_name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                        {sw.sessions_attended} جلسه
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                sw.attendance_rate >= 80 ? 'bg-emerald-500' : sw.attendance_rate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, sw.attendance_rate || 0)}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs font-bold">
                            %{sw.attendance_rate || 0}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Link
                          to={`/admin/swimmers/${sw.swimmer_id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-xs font-bold transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>مشاهده پرونده</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CLASS SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                جلسات تقویمی این کلاس
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                فهرست تمامی جلسات کلاسی، وضعیت برگزاری و دسترسی مستقیم به برگه ثبت حضور و غیاب
              </p>
            </div>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              جلسه تقویمی برای این کلاس ثبت نشده است.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/70 dark:border-slate-800">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">
                  <tr>
                    <th className="py-3 px-4 rounded-r-xl">تاریخ جلسه</th>
                    <th className="py-3 px-4">ساعت برگزاری</th>
                    <th className="py-3 px-4">محل استخر</th>
                    <th className="py-3 px-4">وضعیت جلسه</th>
                    <th className="py-3 px-4">حضور و غیاب</th>
                    <th className="py-3 px-4 text-center rounded-l-xl">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {sessions.map((sess) => (
                    <tr key={sess.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold font-mono text-slate-900 dark:text-white text-xs sm:text-sm">
                        {sess.session_date}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300 text-xs">
                        {sess.start_time?.slice(0, 5)} تا {sess.end_time?.slice(0, 5)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-xs">
                        {sess.pool_location}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={sess.status === 'COMPLETED' ? 'success' : sess.status === 'CANCELLED' ? 'danger' : 'info'}>
                          {sess.status_display}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        {sess.has_attendance ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            ثبت‌شده
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-xs">
                            <AlertCircle className="w-3.5 h-3.5" />
                            ثبت‌نشده
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Link
                          to={`/admin/attendance/${sess.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-2xs"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          <span>برگه حضور و غیاب</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: CLASS ANNOUNCEMENTS (MONITORED BY MANAGEMENT) */}
      {activeTab === 'announcements' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-sky-600" />
                <span>اعلانات و پیام‌های ارسالی این کلاس</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                نظارت مدیریت بر پیام‌های ارسالی مربی برای شناگران کلاس و اولیا
              </p>
            </div>

            <Link
              to="/admin/announcements?tab=announcements"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
            >
              <span>مشاهده در مرکز جامع اعلانات</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {announcements.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              <Megaphone className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
                هنوز هیچ اعلانی برای این کلاس ثبت نشده است.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                به محض اینکه مربی پیامی برای شناگران این کلاس ارسال کند، در اینجا و در اعلانات مدیریت قابل مشاهده خواهد بود.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    ann.is_pinned
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 shadow-xs'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {ann.is_pinned && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold text-xs border border-amber-300 dark:border-amber-700/60">
                          <Pin className="w-3.5 h-3.5 rotate-45 text-amber-600" />
                          مهم / پین‌شده
                        </span>
                      )}
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {ann.title}
                      </h4>
                    </div>

                    <span className="text-xs text-slate-400 font-mono">
                      {ann.created_at_display || (ann.created_at ? new Date(ann.created_at).toLocaleDateString('fa-IR') : '')}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed mb-3">
                    {ann.message}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        ارسال‌کننده: {ann.created_by_name}
                      </span>
                      {ann.send_sms && (
                        <span className="text-sky-600 dark:text-sky-400 font-bold flex items-center gap-1">
                          <Bell className="w-3 h-3" />
                          ارسال پیامک
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      مخاطب: کلیه شناگران کلاس
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CLASS INFO & SCHEDULES */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weekly Schedule */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>برنامه هفتگی کلاس</span>
            </h3>

            {schedules.length === 0 ? (
              <p className="text-xs text-slate-400">برنامه هفتگی مشخصی برای این کلاس ثبت نشده است.</p>
            ) : (
              <div className="space-y-2">
                {schedules.map((sch) => (
                  <div
                    key={sch.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-xs sm:text-sm font-mono"
                  >
                    <span className="font-bold text-slate-800 dark:text-slate-200">{sch.weekday_display || sch.weekday}</span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {sch.start_time?.slice(0, 5)} الی {sch.end_time?.slice(0, 5)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Capacity & Location */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-sky-500" />
              <span>محل استخر و وضعیت ظرفیت کلاس</span>
            </h3>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">محل برگزاری:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{data.pool_location}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">ظرفیت کل کلاس:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{data.capacity} نفر</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">شناگران ثبت‌نام‌شده:</span>
                <span className="font-mono font-bold text-emerald-600">{swimmers.length} نفر</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">ظرفیت باقیمانده:</span>
                <span className="font-mono font-bold text-sky-600">
                  {Math.max(0, data.capacity - swimmers.length)} جای خالی
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
