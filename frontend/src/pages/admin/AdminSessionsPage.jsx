import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { useToast } from '../../context/ToastContext';

export const AdminSessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingSession, setCancellingSession] = useState(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const toast = useToast();

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/scheduling/sessions/');
      setSessions(res.data.results || res.data);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت لیست جلسات کلاسی');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCancelSession = async () => {
    if (!cancellingSession) return;
    try {
      setSubmitting(true);
      await api.post(`/scheduling/sessions/${cancellingSession.id}/cancel/`, { reason });
      setCancellingSession(null);
      setReason('');
      toast.success('جلسه کلاسی با موفقیت لغو شد و سهمیه شناگران محفوظ ماند.');
      fetchSessions();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در لغو جلسه');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadges = {
    SCHEDULED: { label: 'برنامه‌ریزی‌شده', variant: 'info' },
    COMPLETED: { label: 'برگزارشده', variant: 'success' },
    CANCELLED: { label: 'لغوشده', variant: 'danger' },
    MAKEUP: { label: 'جلسه جبرانی', variant: 'warning' },
  };

  const totalPages = Math.ceil(sessions.length / pageSize) || 1;
  const paginatedSessions = sessions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-600" />
            برنامه جلسات کلاسی و تقویم آموزشگاه
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            مشاهده زمان‌بندی روزانه، محل استخر، مربیان و مدیریت کنسلی و جبرانی جلسات
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingState message="در حال بارگذاری جلسات کلاسی..." />
      ) : sessions.length === 0 ? (
        <EmptyState title="جلسه‌ای یافت نشد" description="هیچ جلسه کلاسی در سیستم ثبت نشده است." />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 rounded-r-xl">گروه آموزشی</th>
                  <th className="px-4 py-3.5">مربی مسئول</th>
                  <th className="px-4 py-3.5">تاریخ برگزاری</th>
                  <th className="px-4 py-3.5">ساعت کلاس</th>
                  <th className="px-4 py-3.5">محل و لاین استخر</th>
                  <th className="px-4 py-3.5">وضعیت</th>
                  <th className="px-4 py-3.5 text-center rounded-l-xl">اقدام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {paginatedSessions.map((sess) => {
                  const meta = statusBadges[sess.status] || { label: sess.status, variant: 'neutral' };
                  return (
                    <tr key={sess.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white">{sess.group_name}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300 font-medium">{sess.coach_name}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300 font-mono">{sess.session_date}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400 font-mono">
                        {sess.start_time?.slice(0, 5)} تا {sess.end_time?.slice(0, 5)}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">{sess.pool_location}</td>
                      <td className="px-4 py-3.5">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {sess.status === 'SCHEDULED' ? (
                          <button
                            type="button"
                            onClick={() => setCancellingSession(sess)}
                            className="px-3 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl border border-rose-200 dark:border-rose-900 transition-colors shadow-2xs"
                          >
                            لغو جلسه
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={sessions.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      {/* Cancel Session Modal */}
      <Modal
        isOpen={!!cancellingSession}
        onClose={() => setCancellingSession(null)}
        title={`لغو جلسه کلاسی: ${cancellingSession?.group_name}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            در صورت لغو جلسه توسط آموزشگاه، از سهمیه جلسات خریداری‌شده شناگران کسر نخواهد شد
            و می‌توانید جلسه جبرانی برای این کلاس تنظیم فرمایید.
          </p>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">دلیل لغو جلسه:</label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: برودت هوا یا تعمیرات تأسیسات استخر..."
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setCancellingSession(null)}>
              انصراف
            </Button>
            <Button variant="danger" size="sm" loading={submitting} onClick={handleCancelSession}>
              تأیید و ثبت لغو جلسه
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
