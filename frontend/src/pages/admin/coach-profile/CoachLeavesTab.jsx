import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Plus, CheckCircle2, XCircle, AlertCircle, Clock,
  FileText, Download, Check, X, ShieldAlert
} from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { useToast } from '../../../context/ToastContext';
import api from '../../../api/client';

export const CoachLeavesTab = ({ coach, leaves, onLeavesUpdated }) => {
  const navigate = useNavigate();
  const toast = useToast();

  const [isSubmitLeaveModalOpen, setIsSubmitLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'CASUAL',
    start_date: '',
    end_date: '',
    hours_requested: 0,
    reason: '',
  });
  const [leaveDoc, setLeaveDoc] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Review Modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedLeaveForReview, setSelectedLeaveForReview] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('APPROVED');
  const [adminNotes, setAdminNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const pendingLeaves = leaves.filter((l) => l.status === 'PENDING');
  const pastLeaves = leaves.filter((l) => l.status !== 'PENDING');

  // Submit Leave Request
  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.start_date || !leaveForm.end_date || !leaveForm.reason.trim()) {
      toast.error('تاریخ شروع، پایان و دلیل مرخصی الزامی است.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('leave_type', leaveForm.leave_type);
      formData.append('start_date', leaveForm.start_date);
      formData.append('end_date', leaveForm.end_date);
      formData.append('hours_requested', leaveForm.hours_requested);
      formData.append('reason', leaveForm.reason.trim());
      if (leaveDoc) formData.append('document', leaveDoc);

      await api.post(`/coaches/${coach.id}/leave-requests/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('درخواست مرخصی با موفقیت ثبت شد.');
      setIsSubmitLeaveModalOpen(false);
      setLeaveForm({
        leave_type: 'CASUAL',
        start_date: '',
        end_date: '',
        hours_requested: 0,
        reason: '',
      });
      setLeaveDoc(null);
      if (onLeavesUpdated) onLeavesUpdated();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت درخواست مرخصی');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Review (Approve or Reject)
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLeaveForReview) return;

    try {
      setReviewing(true);
      await api.post(`/coaches/leave-requests/${selectedLeaveForReview.id}/review/`, {
        status: reviewStatus,
        admin_notes: adminNotes.trim(),
      });

      toast.success(`درخواست مرخصی با موفقیت ${reviewStatus === 'APPROVED' ? 'تأیید' : 'رد'} شد.`);
      setIsReviewModalOpen(false);
      setSelectedLeaveForReview(null);
      setAdminNotes('');
      if (onLeavesUpdated) onLeavesUpdated();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در بررسی مرخصی');
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-600" />
            مدیریت درخواست‌های مرخصی و عدم حضور
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            بررسی مرخصی‌های استحقاقی، استعلاجی، ساعتی و تاثیر آن بر تقویم جلسات و حقوق
          </p>
        </div>

        <Button
          onClick={() => navigate(`/admin/coaches/${coach.id}/leaves/new`)}
          className="gap-1.5 text-xs bg-sky-600 hover:bg-sky-500 text-white shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت مرخصی جدید</span>
        </Button>
      </div>

      {/* Pending Requests Alert Box */}
      {pendingLeaves.length > 0 && (
        <div className="p-4 rounded-2xl border border-amber-300 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 animate-spin" />
            <h4 className="font-bold text-amber-900 dark:text-amber-200 text-xs">
              {pendingLeaves.length} درخواست مرخصی در انتظار بررسی مدیریت
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingLeaves.map((l) => (
              <div
                key={l.id}
                className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-800 text-xs space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {l.leave_type_display}
                  </span>
                  <Badge variant="warning">{l.status_display}</Badge>
                </div>

                <div className="text-slate-600 dark:text-slate-400">
                  بازه: <strong className="font-mono text-slate-800 dark:text-slate-200">{new Date(l.start_date).toLocaleDateString('fa-IR')}</strong> تا <strong className="font-mono text-slate-800 dark:text-slate-200">{new Date(l.end_date).toLocaleDateString('fa-IR')}</strong>
                </div>

                <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                  علت: {l.reason}
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                  {l.document_url ? (
                    <a
                      href={l.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 hover:text-sky-700 font-semibold inline-flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>مشاهده گواهی پیوست</span>
                    </a>
                  ) : (
                    <span className="text-slate-400">فاقد مدارک پیوست</span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedLeaveForReview(l);
                        setReviewStatus('APPROVED');
                        setAdminNotes('');
                        setIsReviewModalOpen(true);
                      }}
                      className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>موافقت</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedLeaveForReview(l);
                        setReviewStatus('REJECTED');
                        setAdminNotes('');
                        setIsReviewModalOpen(true);
                      }}
                      className="gap-1 text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>مخالفت</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leave History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
            تاریخچه مرخصی‌های گذشته ({pastLeaves.length} مورد)
          </h4>
          <span className="text-[11px] text-slate-400">مرخصی‌های تاییدشده در محاسبات حقوق و حضور لحاظ می‌شوند</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-bold">نوع مرخصی</th>
                <th className="py-3 px-4 font-bold">از تاریخ</th>
                <th className="py-3 px-4 font-bold">تا تاریخ</th>
                <th className="py-3 px-4 font-bold">دلیل ثبت‌شده</th>
                <th className="py-3 px-4 font-bold">وضعیت بررسی</th>
                <th className="py-3 px-4 font-bold">بررسی‌کننده</th>
                <th className="py-3 px-4 font-bold">یادداشت اداری</th>
                <th className="py-3 px-4 font-bold text-center">پیوست</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {pastLeaves.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    هیچ سابقه مرخصی بررسی‌شده‌ای برای این مربی ثبت نشده است.
                  </td>
                </tr>
              ) : (
                pastLeaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {l.leave_type_display}
                    </td>
                    <td className="py-3 px-4 font-mono">{new Date(l.start_date).toLocaleDateString('fa-IR')}</td>
                    <td className="py-3 px-4 font-mono">{new Date(l.end_date).toLocaleDateString('fa-IR')}</td>
                    <td className="py-3 px-4 max-w-[200px] truncate" title={l.reason}>
                      {l.reason}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={l.status === 'APPROVED' ? 'success' : 'error'}>
                        {l.status_display}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{l.reviewed_by_name || 'مدیر'}</td>
                    <td className="py-3 px-4 text-slate-500">{l.admin_notes || '—'}</td>
                    <td className="py-3 px-4 text-center">
                      {l.document_url ? (
                        <a
                          href={l.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-600 hover:text-sky-700 inline-block p-1"
                          title="دانلود گواهی پیوست"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Review Leave */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={`بررسی درخواست مرخصی: ${selectedLeaveForReview?.leave_type_display}`}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs space-y-1">
            <div className="text-slate-500">
              بازه زمانی: {selectedLeaveForReview?.start_date && new Date(selectedLeaveForReview.start_date).toLocaleDateString('fa-IR')} تا {selectedLeaveForReview?.end_date && new Date(selectedLeaveForReview.end_date).toLocaleDateString('fa-IR')}
            </div>
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              علت: {selectedLeaveForReview?.reason}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              تصمیم نهایی مدیریت
            </label>
            <div className="flex items-center gap-4 text-xs font-bold">
              <label className="flex items-center gap-1.5 cursor-pointer text-emerald-700">
                <input
                  type="radio"
                  name="review_decision"
                  value="APPROVED"
                  checked={reviewStatus === 'APPROVED'}
                  onChange={() => setReviewStatus('APPROVED')}
                />
                موافقت با مرخصی
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-rose-700">
                <input
                  type="radio"
                  name="review_decision"
                  value="REJECTED"
                  checked={reviewStatus === 'REJECTED'}
                  onChange={() => setReviewStatus('REJECTED')}
                />
                مخالفت و رد درخواست
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              توضیح یا یادداشت اداری برای مربی
            </label>
            <textarea
              rows={2}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="مثال: با هماهنگی مربی جایگزین آقای رضایی موافقت شد."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsReviewModalOpen(false)}>
              انصراف
            </Button>
            <Button
              type="submit"
              disabled={reviewing}
              className={reviewStatus === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white'}
            >
              {reviewing ? 'در حال ثبت...' : reviewStatus === 'APPROVED' ? 'تأیید مرخصی' : 'رد درخواست'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
