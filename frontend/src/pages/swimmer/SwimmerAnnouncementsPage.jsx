import React, { useState, useEffect } from 'react';
import {
  Bell, Newspaper, Pin, CheckCheck, Calendar, Filter, Sparkles
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';

export const SwimmerAnnouncementsPage = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('ANNOUNCEMENTS'); // ANNOUNCEMENTS, NEWS
  const [announcements, setAnnouncements] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [annRes, newsRes] = await Promise.allSettled([
        api.get('/content/announcements/'),
        api.get('/content/news/'),
      ]);

      if (annRes.status === 'fulfilled') {
        const d = annRes.value.data;
        setAnnouncements(Array.isArray(d) ? d : d.results || []);
      }
      if (newsRes.status === 'fulfilled') {
        const d = newsRes.value.data;
        setNews(Array.isArray(d) ? d : d.results || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <LoadingState type="list" message="در حال دریافت اعلانات و اخبار آکادمی..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-900/60">
              <Bell className="w-5 h-5" />
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              اطلاعیه‌ها، اخبار و پیام‌های مربی
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            اعلانات رسمی اداری، تعطیلات فصلی، پیام‌های اختصاصی گروه و مقالات آموزشی
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('ANNOUNCEMENTS')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ANNOUNCEMENTS'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>پیام‌های اختصاصی ({announcements.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('NEWS')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'NEWS'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Newspaper className="w-4 h-4" />
            <span>اخبار عمومی ({news.length})</span>
          </button>
        </div>
      </div>

      {/* Announcements List */}
      {activeTab === 'ANNOUNCEMENTS' && (
        <div className="space-y-3">
          {announcements.length > 0 ? (
            announcements.map((ann) => (
              <div
                key={ann.id}
                className={`p-5 rounded-3xl border transition-all ${
                  ann.is_pinned
                    ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {ann.is_pinned && (
                      <span className="p-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400">
                        <Pin className="w-3.5 h-3.5 rotate-45" />
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {ann.title}
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(ann.created_at).toLocaleDateString('fa-IR')}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pr-1">
                  {ann.message}
                </p>
                {ann.target_group_name && (
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-sky-600 font-bold">
                    پیام اختصاصی گروه: {ann.target_group_name}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              هیچ اعلانی یافت نشد.
            </div>
          )}
        </div>
      )}

      {/* News List */}
      {activeTab === 'NEWS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {news.length > 0 ? (
            news.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant="info">{item.category_display || 'عمومی'}</Badge>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {item.publish_at?.slice(0, 10)}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed line-clamp-3">
                    {item.summary || item.body}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              هیچ خبری در وب‌سایت منتشر نشده است.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
