import React, { useState, useEffect } from 'react';
import {
  MessageSquareQuote, Send, Plus, CheckCircle2, Clock, AlertCircle,
  FileText, Paperclip, ChevronDown, ChevronUp, User, Headphones
} from 'lucide-react';
import api from '../../api/client';
import { useSwimmer } from '../../context/SwimmerContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';

export const SwimmerSupportPage = () => {
  const { activeSwimmer, activeSwimmerId } = useSwimmer();
  const toast = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState(null);

  // New ticket form
  const [formData, setFormData] = useState({
    category: 'SCHEDULE',
    subject: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/content/tickets/');
      const d = res.data;
      setTickets(Array.isArray(d) ? d : d.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.description) {
      toast.error('لطفاً عنوان و شرح درخواست را وارد فرمایید.');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/content/tickets/', {
        ...formData,
        swimmer: activeSwimmerId || activeSwimmer?.id,
      });
      toast.success('درخواست شما با موفقیت ثبت شد و به واحد پشتیبانی ارسال گردید.');
      setFormData({ category: 'SCHEDULE', subject: '', description: '' });
      setShowNewModal(false);
      await fetchTickets();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در ثبت درخواست.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState type="list" message="در حال بارگذاری تیکت‌های پشتیبانی..." />;
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return <Badge variant="info">ثبت‌شده</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="warning">در حال بررسی</Badge>;
      case 'NEED_INFO':
        return <Badge variant="danger">نیازمند اطلاعات بیشتر</Badge>;
      case 'ANSWERED':
        return <Badge variant="success">پاسخ داده‌شده</Badge>;
      case 'CLOSED':
        return <Badge variant="neutral">بسته‌شده</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400">
              <MessageSquareQuote className="w-5 h-5" />
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              پشتیبانی و ارتباط با مدیریت آموزشگاه
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            ارسال درخواست‌های اداری، اعلام غیبت موجه، جابه‌جایی سانس و پیگیری پاسخ رسمی
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-2xl transition-all shadow-xs flex items-center gap-2 cursor-pointer self-end md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت درخواست جدید</span>
        </button>
      </div>

      {/* New Ticket Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150" dir="rtl">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-sky-50/50 dark:bg-sky-950/30">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquareQuote className="w-4 h-4 text-sky-600" />
                ثبت پیام و تیکت پشتیبانی جدید
              </h3>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitTicket} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  موضوع درخواست <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="SCHEDULE">برنامه کلاس و جابه‌جایی یا غیبت موجه</option>
                  <option value="FINANCE">امور مالی، شهریه و اقساط</option>
                  <option value="REGISTRATION">ثبت‌نام و پذیرش</option>
                  <option value="DOCUMENTS">مدارک و بیمه ورزشی</option>
                  <option value="OTHER">سایر موارد و پیشنهادات</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان درخواست <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="مثلاً: درخواست جابه‌جایی سانس روز پنج‌شنبه"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شرح مشکل یا درخواست <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="توضیحات کامل درخواست خود را بنویسید..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'در حال ارسال...' : 'ارسال درخواست'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tickets List */}
      <div className="space-y-3">
        {tickets.length > 0 ? (
          tickets.map((t) => {
            const isExpanded = expandedTicketId === t.id;
            return (
              <div
                key={t.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <Headphones className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {t.subject}
                        </span>
                        <span className="text-[10px] text-sky-600 bg-sky-50 dark:bg-sky-950/70 px-2 py-0.5 rounded-lg font-bold">
                          {t.category_display || t.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                        کد درخواست #{t.id} · تاریخ: {t.created_at?.slice(0, 10)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(t.status)}
                    <button
                      type="button"
                      onClick={() => setExpandedTicketId(isExpanded ? null : t.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  {t.description}
                </p>

                {/* Response from Academy */}
                {t.response ? (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                    <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        پاسخ رسمی مدیریت آموزشگاه:
                      </span>
                      <span className="text-[10px] font-mono text-emerald-600">
                        {t.responded_at?.slice(0, 10)}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed pr-5">{t.response}</p>
                  </div>
                ) : (
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    درخواست شما در نوبت بررسی کارشناس اداری قرار دارد.
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
            هنوز درخواست یا تیکتی ثبت نکرده‌اید. برای ثبت اولین درخواست، دکمه «ثبت درخواست جدید» را بزنید.
          </div>
        )}
      </div>
    </div>
  );
};
