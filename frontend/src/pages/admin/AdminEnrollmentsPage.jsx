import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { useToast } from '../../context/ToastContext';

export const AdminEnrollmentsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const toast = useToast();
  
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
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت درخواست‌های ثبت‌نام');
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
      toast.success(
        action === 'APPROVE'
          ? 'درخواست ثبت‌نام با موفقیت تأیید و فاکتور مالی صادر شد.'
          : 'درخواست متقاضی رد شد.'
      );
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در ثبت تصمیم بررسی');
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

  const totalPages = Math.ceil(requests.length / pageSize) || 1;
  const paginatedRequests = requests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            درخواست‌های ثبت‌نام آنلاین و اعتبارسنجی ظرفیت
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            بررسی متقاضیان، تأیید ثبت‌نام با بررسی تراکنشی ظرفیت کلاس و صدور خودکار صورتحساب
          </p>
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 rounded-r-xl">نام متقاضی</th>
                  <th className="px-4 py-3.5">شماره همراه</th>
                  <th className="px-4 py-3.5">دوره درخواستی</th>
                  <th className="px-4 py-3.5">گروه اجرایی</th>
                  <th className="px-4 py-3.5">تاریخ ثبت</th>
                  <th className="px-4 py-3.5">وضعیت</th>
                  <th className="px-4 py-3.5 text-center rounded-l-xl">اقدام مدیر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {paginatedRequests.map((req) => {
                  const meta = statusBadges[req.status] || { label: req.status, variant: 'neutral' };
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white">{req.applicant_name}</td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-400">{req.applicant_phone}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300">{req.course_name}</td>
                      <td className="px-4 py-3.5 text-xs font-medium text-slate-800 dark:text-slate-200">{req.group_name}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {new Date(req.created_at).toLocaleDateString('fa-IR')}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {req.status === 'PENDING' ? (
                          <button
                            type="button"
                            onClick={() => setSelectedReq(req)}
                            className="px-3 py-1.5 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 font-semibold text-xs rounded-xl border border-sky-200 dark:border-sky-800 transition-colors shadow-2xs"
                          >
                            بررسی و تصمیم
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500 italic">بررسی‌شده</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {paginatedRequests.map((req) => {
              const meta = statusBadges[req.status] || { label: req.status, variant: 'neutral' };
              return (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{req.applicant_name}</h4>
                      <a href={`tel:${req.applicant_phone}`} className="font-mono text-sky-600 dark:text-sky-400 text-xs block mt-0.5 underline decoration-sky-300">
                        {req.applicant_phone}
                      </a>
                    </div>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-slate-400 block text-[10px]">دوره درخواستی</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{req.course_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">گروه اجرایی</span>
                      <span className="text-slate-700 dark:text-slate-200">{req.group_name}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[10px]">تاریخ ثبت</span>
                      <span className="font-mono text-slate-500">{new Date(req.created_at).toLocaleDateString('fa-IR')}</span>
                    </div>
                  </div>

                  {req.status === 'PENDING' && (
                    <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                      <button
                        type="button"
                        onClick={() => setSelectedReq(req)}
                        className="w-full py-2.5 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 font-semibold rounded-xl border border-sky-200 dark:border-sky-800 transition-colors shadow-2xs"
                      >
                        بررسی و تصمیم نهایی
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={requests.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
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
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">متقاضی:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedReq.applicant_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">شماره تماس:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedReq.applicant_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">دوره و گروه:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{selectedReq.course_name} - {selectedReq.group_name}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                دلیل رد درخواست (در صورت رد):
              </label>
              <textarea
                rows={2}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="در صورت رد درخواست، دلیل را برای شناگر وارد فرمایید..."
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
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
