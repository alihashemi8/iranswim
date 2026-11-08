import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck, Clock, Calendar, CheckCircle2, XCircle, AlertTriangle,
  History, Edit3, ArrowRight, UserCheck, Shield
} from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { LoadingState } from '../../../components/common/LoadingState';
import { useToast } from '../../../context/ToastContext';
import api from '../../../api/client';

export const CoachAttendanceTab = ({ coach }) => {
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState('');

  // Manual Correction Modal
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [selectedSessionForCorrection, setSelectedSessionForCorrection] = useState(null);
  const [correctionForm, setCorrectionForm] = useState({
    new_status: 'COMPLETED',
    new_hours: 1,
    reason: '',
  });
  const [submittingCorrection, setSubmittingCorrection] = useState(false);

  const fetchAttendanceSummary = async () => {
    try {
      setLoading(true);
      const params = {};
      if (monthFilter) params.month = monthFilter;
      const res = await api.get(`/coaches/${coach.id}/attendance-summary/`, { params });
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت سوابق حضور و جلسات مربی');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceSummary();
  }, [coach.id, monthFilter]);

  const handleOpenCorrection = (session) => {
    setSelectedSessionForCorrection(session);
    setCorrectionForm({
      new_status: session.status === 'COMPLETED' ? 'CANCELLED' : 'COMPLETED',
      new_hours: Number(session.duration_hours || 1),
      reason: '',
    });
    setIsCorrectionModalOpen(true);
  };

  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSessionForCorrection) return;
    if (!correctionForm.reason.trim()) {
      toast.error('درج دلیل اصلاحیه الزامی است.');
      return;
    }

    try {
      setSubmittingCorrection(true);
      await api.post(`/coaches/${coach.id}/attendance-summary/`, {
        session_id: selectedSessionForCorrection.id,
        new_status: correctionForm.new_status,
        new_hours: correctionForm.new_hours,
        reason: correctionForm.reason.trim(),
      });

      toast.success('اصلاحیه تدریس با موفقیت در سند ردپای حسابرسی ثبت گردید.');
      setIsCorrectionModalOpen(false);
      setSelectedSessionForCorrection(null);
      fetchAttendanceSummary();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت اصلاحیه تدریس');
    } finally {
      setSubmittingCorrection(false);
    }
  };

  if (loading && !data) {
    return <LoadingState type="cards" count={3} message="در حال استخراج کارکرد و جلسات تدریس مربی..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-sky-600" />
            حضور، غیاب و کارکرد جلسات تدریس
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            بررسی جلسات برنامه‌ریزی‌شده، برگزارشده، لغوشده و امکان اصلاح دستی سوابق با ردپای حسابرسی
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
          />
          {monthFilter && (
            <button
              type="button"
              onClick={() => setMonthFilter('')}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              پاک‌کردن
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
            <span className="text-slate-400 block mb-1">کل ساعات برنامه‌ریزی‌شده:</span>
            <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
              {Number(data.scheduled_hours || 0).toLocaleString('fa-IR')} ساعت
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 p-4 shadow-xs bg-emerald-50/20 dark:bg-emerald-950/20">
            <span className="text-emerald-700 dark:text-emerald-300 block mb-1">ساعات مصوب برگزارشده:</span>
            <span className="text-lg font-bold font-mono text-emerald-800 dark:text-emerald-200">
              {Number(data.approved_hours || 0).toLocaleString('fa-IR')} ساعت
            </span>
            <span className="text-[10px] text-emerald-600 block mt-0.5">
              مبنای محاسبه حقوق ساعتی
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
            <span className="text-slate-400 block mb-1">جلسات تکمیل‌شده:</span>
            <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-200">
              {data.completed_sessions} جلسه
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
            <span className="text-slate-400 block mb-1">جلسات لغوشده:</span>
            <span className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
              {data.cancelled_sessions} جلسه
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              عدم احتساب در کارکرد
            </span>
          </div>
        </div>
      )}

      {/* Sessions Detail Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
            ریز جلسات کلاسی و وضعیت برگزاری
          </h4>
          <span className="text-[11px] text-slate-400">امکان اصلاح دستی وضعیت جلسه با ثبت الزامی دلیل</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-bold">تاریخ جلسه</th>
                <th className="py-3 px-4 font-bold">ساعت</th>
                <th className="py-3 px-4 font-bold">کلاس / دوره</th>
                <th className="py-3 px-4 font-bold">محل استخر</th>
                <th className="py-3 px-4 font-bold">مدت زمان</th>
                <th className="py-3 px-4 font-bold">وضعیت برگزاری</th>
                <th className="py-3 px-4 font-bold text-center">اصلاحیه</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {!data?.sessions || data.sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    جلسه‌ای در این بازه زمانی یافت نشد.
                  </td>
                </tr>
              ) : (
                data.sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {new Date(s.session_date).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="py-3 px-4 font-mono">{s.start_time} تا {s.end_time}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold block">{s.group_name}</span>
                      <span className="text-[11px] text-slate-400">{s.course_name}</span>
                    </td>
                    <td className="py-3 px-4">{s.pool_location}</td>
                    <td className="py-3 px-4 font-mono">{s.duration_hours} ساعت</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          s.status === 'COMPLETED'
                            ? 'success'
                            : s.status === 'CANCELLED'
                            ? 'error'
                            : s.status === 'MAKEUP'
                            ? 'info'
                            : 'warning'
                        }
                      >
                        {s.status_display}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenCorrection(s)}
                        className="text-xs text-sky-600 hover:text-sky-700 font-semibold inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>اصلاح</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Trail of Corrections */}
      {data?.recent_corrections && data.recent_corrections.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs space-y-2 p-4">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <History className="w-4 h-4 text-amber-500" />
            سوابق اصلاحات و ویرایش‌های دستی جلسات (Audit Trail)
          </h4>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.recent_corrections.map((audit) => (
              <div key={audit.id} className="py-2.5 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    جلسه {audit.session_group_name} ({new Date(audit.session_date).toLocaleDateString('fa-IR')}):
                  </span>
                  <span className="text-slate-500 mr-2">
                    تغییر وضعیت از «{audit.previous_status}» به «{audit.new_status}» ({audit.previous_hours} س → {audit.new_hours} س)
                  </span>
                  <p className="text-amber-800 dark:text-amber-300 text-[11px] mt-0.5">
                    علت: {audit.reason}
                  </p>
                </div>
                <div className="text-[11px] text-slate-400 font-mono shrink-0">
                  توسط {audit.adjusted_by_name || 'مدیر'} در {new Date(audit.created_at).toLocaleDateString('fa-IR')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Manual Attendance Correction */}
      <Modal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        title="اصلاح دستی سابقه تدریس جلسه"
      >
        <form onSubmit={handleCorrectionSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1">
            <span className="text-slate-400 block">مشخصات جلسه انتخابی:</span>
            <div className="font-bold text-slate-800 dark:text-slate-200">
              {selectedSessionForCorrection?.group_name} - مورخ {selectedSessionForCorrection?.session_date && new Date(selectedSessionForCorrection.session_date).toLocaleDateString('fa-IR')}
            </div>
            <div className="text-slate-500">
              ساعت: {selectedSessionForCorrection?.start_time} تا {selectedSessionForCorrection?.end_time} ({selectedSessionForCorrection?.duration_hours} ساعت)
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                وضعیت جدید جلسه <span className="text-rose-500">*</span>
              </label>
              <select
                value={correctionForm.new_status}
                onChange={(e) => setCorrectionForm({ ...correctionForm, new_status: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="COMPLETED">برگزارشده (مشمول محاسبه حق‌التدریس)</option>
                <option value="CANCELLED">لغوشده (بدون احتساب ساعت)</option>
                <option value="MAKEUP">جلسه جبرانی</option>
                <option value="SCHEDULED">برنامه‌ریزی‌شده</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ساعت تدریس مصوب جدید
              </label>
              <input
                type="number"
                step="0.1"
                value={correctionForm.new_hours}
                onChange={(e) => setCorrectionForm({ ...correctionForm, new_hours: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              دلیل و مستندات اصلاحیه (اجباری برای سیستم حسابرسی) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={correctionForm.reason}
              onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
              placeholder="مثال: قطعی آب استخر، تایید کلاس جبرانی توسط ناظر، عدم ثبت به موقع..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsCorrectionModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={submittingCorrection} className="bg-sky-600 hover:bg-sky-500 text-white">
              {submittingCorrection ? 'در حال ثبت...' : 'ثبت اصلاحیه'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
