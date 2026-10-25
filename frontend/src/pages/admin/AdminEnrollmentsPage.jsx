import React, { useState, useEffect } from 'react';
import { Users, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

export const AdminEnrollmentsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedReq, setSelectedReq] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/education/requests/', { params });
      setRequests(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleReview = async (action) => {
    if (!selectedReq) return;
    try {
      setSubmitting(true);
      await api.post(`/education/requests/${selectedReq.id}/review/`, {
        action,
        rejection_reason: rejectionReason,
      });
      setSelectedReq(null);
      setRejectionReason('');
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.detail || 'خطا در ثبت تصمیم بررسی');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadges = {
    PENDING: { label: 'در انتظار بررسی', variant: 'warning' },
    APPROVED: { label: 'تأییدشده و فعال', variant: 'success' },
    REJECTED: { label: 'رد شده', variant: 'danger' },
    WAITLIST: { label: 'فهرست انتظار (ظرفیت پر)', variant: 'neutral' },
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            درخواست‌های ثبت‌نام آنلاین و اعتبارسنجی ظرفیت
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            بررسی متقاضیان، تأیید ثبت‌نام با بررسی تراکنشی ظرفیت کلاس و صدور خودکار صورتحساب
          </p>
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">تمام وضعیت‌ها</option>
            <option value="PENDING">در انتظار بررسی</option>
            <option value="APPROVED">تأییدشده</option>
            <option value="REJECTED">رد شده</option>
            <option value="WAITLIST">فهرست انتظار</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingState message="در حال بارگذاری درخواست‌های ثبت‌نام..." />
      ) : requests.length === 0 ? (
        <EmptyState title="هیچ درخواستی یافت نشد" description="در حال حاضر درخواستی با این وضعیت ثبت نشده است." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200/80">
                <tr>
                  <th className="px-4 py-3.5">نام متقاضی</th>
                  <th className="px-4 py-3.5">شماره همراه</th>
                  <th className="px-4 py-3.5">دوره درخواستی</th>
                  <th className="px-4 py-3.5">گروه اجرایی</th>
                  <th className="px-4 py-3.5">تاریخ ثبت</th>
                  <th className="px-4 py-3.5">وضعیت</th>
                  <th className="px-4 py-3.5 text-center">اقدام مدیر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => {
                  const meta = statusBadges[req.status] || { label: req.status, variant: 'neutral' };
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-slate-900">{req.applicant_name}</td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-600">{req.applicant_phone}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-700">{req.course_name}</td>
                      <td className="px-4 py-3.5 text-xs font-medium text-slate-800">{req.group_name}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 font-mono">
                        {new Date(req.created_at).toLocaleDateString('fa-IR')}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {req.status === 'PENDING' ? (
                          <button
                            onClick={() => setSelectedReq(req)}
                            className="px-3 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 font-medium text-xs rounded-lg border border-sky-200 transition-colors"
                          >
                            بررسی و تصمیم
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">بررسی‌شده</span>
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

      {/* Review Modal */}
      <Modal
        isOpen={!!selectedReq}
        onClose={() => setSelectedReq(null)}
        title={`بررسی درخواست متقاضی: ${selectedReq?.applicant_name}`}
      >
        {selectedReq && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">متقاضی:</span>
                <span className="font-semibold text-slate-800">{selectedReq.applicant_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">شماره تماس:</span>
                <span className="font-mono text-slate-800">{selectedReq.applicant_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">دوره و گروه:</span>
                <span className="font-medium text-slate-800">{selectedReq.course_name} - {selectedReq.group_name}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                دلیل رد درخواست (در صورت رد):
              </label>
              <textarea
                rows={2}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="در صورت رد درخواست، دلیل را برای شناگر وارد فرمایید..."
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                variant="danger"
                size="sm"
                loading={submitting}
                onClick={() => handleReview('REJECT')}
              >
                رد درخواست
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={submitting}
                onClick={() => handleReview('APPROVE')}
              >
                تأیید و صدور فاکتور
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
