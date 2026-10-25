import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, AlertCircle, XCircle } from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

export const AdminSessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingSession, setCancellingSession] = useState(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/scheduling/sessions/');
      setSessions(res.data.results || res.data);
    } catch (err) {
      console.error(err);
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
      fetchSessions();
    } catch (err) {
      alert(err.response?.data?.detail || 'خطا در لغو جلسه');
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

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-600" />
            برنامه جلسات کلاسی و تقویم آموزشگاه
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            مشاهده زمان‌بندی روزانه، محل استخر، مربیان و مدیریت کنسلی و جبرانی جلسات
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingState message="در حال بارگذاری جلسات کلاسی..." />
      ) : sessions.length === 0 ? (
        <EmptyState title="جلسه‌ای یافت نشد" description="هیچ جلسه کلاسی در سیستم ثبت نشده است." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200/80">
                <tr>
                  <th className="px-4 py-3.5">گروه آموزشی</th>
                  <th className="px-4 py-3.5">مربی مسئول</th>
                  <th className="px-4 py-3.5">تاریخ برگزاری</th>
                  <th className="px-4 py-3.5">ساعت کلاس</th>
                  <th className="px-4 py-3.5">محل و لاین استخر</th>
                  <th className="px-4 py-3.5">وضعیت</th>
                  <th className="px-4 py-3.5 text-center">اقدام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((sess) => {
                  const meta = statusBadges[sess.status] || { label: sess.status, variant: 'neutral' };
                  return (
                    <tr key={sess.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-slate-900">{sess.group_name}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-700">{sess.coach_name}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-700 font-mono">{sess.session_date}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 font-mono">
                        {sess.start_time?.slice(0, 5)} تا {sess.end_time?.slice(0, 5)}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">{sess.pool_location}</td>
                      <td className="px-4 py-3.5">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {sess.status === 'SCHEDULED' ? (
                          <button
                            onClick={() => setCancellingSession(sess)}
                            className="px-2.5 py-1 text-xs text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
                          >
                            لغو جلسه
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cancel Session Modal */}
      <Modal
        isOpen={!!cancellingSession}
        onClose={() => setCancellingSession(null)}
        title={`لغو جلسه کلاسی: ${cancellingSession?.group_name}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            در صورت لغو جلسه توسط آموزشگاه، از سهمیه جلسات خریداری‌شده شناگران کسر نخواهد شد
            و می‌توانید جلسه جبرانی برای این کلاس تنظیم فرمایید.
          </p>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">دلیل لغو جلسه:</label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: برودت هوا یا تعمیرات تأسیسات استخر..."
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
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
