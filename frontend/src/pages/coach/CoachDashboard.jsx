import React, { useState, useEffect } from 'react';
import { Calendar, Users, Bell, Pin } from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';

export const CoachDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchCoachData = async () => {
      try {
        setLoading(true);
        const [sessRes, grpRes, annRes] = await Promise.allSettled([
          api.get('/scheduling/sessions/'),
          api.get('/education/groups/'),
          api.get('/content/announcements/'),
        ]);

        if (sessRes.status === 'fulfilled') {
          const d = sessRes.value.data;
          setSessions(Array.isArray(d) ? d : d.results || []);
        }
        if (grpRes.status === 'fulfilled') {
          const d = grpRes.value.data;
          setGroups(Array.isArray(d) ? d : d.results || []);
        }
        if (annRes.status === 'fulfilled') {
          const d = annRes.value.data;
          setAnnouncements(Array.isArray(d) ? d : d.results || []);
        }
      } catch (err) {
        console.error(err);
        toast.error('خطا در دریافت اطلاعات مربی');
      } finally {
        setLoading(false);
      }
    };
    fetchCoachData();
  }, []);

  if (loading) {
    return <LoadingState message="در حال دریافت برنامه کلاس‌های مربی..." />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-l from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-6 sm:p-8 text-white shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">میز کار و داشبورد مربی شنا</h1>
        <p className="text-emerald-100 text-sm mt-1 max-w-xl font-light">
          مشاهده کلاس‌های تخصیص‌یافته، ثبت سریع حضور و غیاب و ارزیابی مهارت‌های شاگردان
        </p>
      </div>

      {/* Announcements Banner for Coaches */}
      {announcements.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-sky-600" />
              پیام‌ها و اطلاعیه‌های آموزشگاه برای مربیان
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              {announcements.length} اعلان
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {announcements.slice(0, 4).map((ann) => (
              <div
                key={ann.id}
                className={`p-3.5 rounded-xl border transition-colors ${
                  ann.is_pinned
                    ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                    {ann.is_pinned && <Pin className="w-3 h-3 text-amber-600 rotate-45" />}
                    {ann.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(ann.created_at).toLocaleDateString('fa-IR')}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                  {ann.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assigned Groups */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
          <h2 className="text-base font-bold text-slate-900 dark:text-white pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            گروه‌های آموزشی تحت مربیگری شما
          </h2>
          {groups.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">شما به گروهی تخصیص داده نشده‌اید.</p>
          ) : (
            <div className="space-y-3">
              {groups.map((grp) => (
                <div key={grp.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{grp.name}</span>
                    <Badge variant="info">{grp.level_name}</Badge>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between mt-2">
                    <span>{grp.pool_location}</span>
                    <span className="font-mono">{grp.current_enrollments_count || 0} شناگر</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sessions list & Quick Attendance */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              جلسات کلاسی و حضور و غیاب
            </h2>
            <Link to="/coach/attendance" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
              ثبت حضور و غیاب ←
            </Link>
          </div>

          {sessions.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">جلسه‌ای برای شما ثبت نشده است.</p>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 5).map((sess) => (
                <div key={sess.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 block">{sess.group_name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {sess.session_date} | {sess.start_time?.slice(0, 5)} تا {sess.end_time?.slice(0, 5)}
                    </span>
                  </div>
                  <Link
                    to="/coach/attendance"
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-colors shadow-2xs"
                  >
                    دفتر حضور
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};