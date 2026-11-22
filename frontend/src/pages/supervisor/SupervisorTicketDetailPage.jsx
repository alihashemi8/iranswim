import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Headphones, Send, CheckCircle2, Clock, AlertTriangle, Paperclip,
  User, ShieldCheck, Whistle, ChevronDown, MessageSquare, ExternalLink,
  X, AlertCircle, Check, ArrowRight, RefreshCw, Phone, Calendar,
  FileText, CornerDownLeft, Sparkles, Server, Bug, Key, CreditCard,
  FileCheck, HelpCircle, Info
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { BackButton } from '../../components/common/BackButton';
import { LoadingState } from '../../components/common/LoadingState';
import { toShamsiDate } from '../../utils/date';
import { getMediaUrl } from '../../utils/media';

export const SupervisorTicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Response Form State
  const [responseText, setResponseText] = useState('');
  const [responseStatus, setResponseStatus] = useState('ANSWERED');
  const [responsePriority, setResponsePriority] = useState('MEDIUM');
  const [responseAttachment, setResponseAttachment] = useState(null);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchTicket = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const res = await api.get(`/content/tickets/${id}/`);
      setTicket(res.data);
      setResponseStatus(res.data.status === 'SUBMITTED' ? 'ANSWERED' : res.data.status);
      setResponsePriority(res.data.priority || 'MEDIUM');
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت اطلاعات تیکت.');
      navigate('/supervisor/tickets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTicket();
    }
  }, [id]);

  const handleSendSupervisorReply = async (e) => {
    e.preventDefault();
    if (!responseText.trim() && !responseAttachment) {
      toast.error('لطفاً متن پاسخ یا فایل پیوست را وارد فرمایید.');
      return;
    }

    try {
      setSubmittingReply(true);
      const data = new FormData();
      if (responseText.trim()) {
        data.append('message', responseText.trim());
      }
      if (responseAttachment) {
        data.append('attachment', responseAttachment);
      }
      if (responseStatus) {
        data.append('status', responseStatus);
      }

      const res = await api.post(`/content/tickets/${id}/reply/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('پاسخ رسمی ناظر با موفقیت ثبت و اعلان سیستمی برای کاربر ارسال شد.');
      setTicket(res.data);
      setResponseText('');
      setResponseAttachment(null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت پاسخ تیکت.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleQuickStatusChange = async (newStatus) => {
    if (!ticket) return;
    try {
      setUpdatingStatus(true);
      const res = await api.patch(`/content/tickets/${id}/`, {
        status: newStatus,
      });
      toast.success(`وضعیت تیکت به «${res.data.status_display || newStatus}» تغییر یافت.`);
      setTicket(res.data);
      setResponseStatus(res.data.status);
    } catch (err) {
      console.error(err);
      toast.error('خطا در تغییر وضعیت تیکت.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleQuickPriorityChange = async (newPriority) => {
    if (!ticket) return;
    try {
      setUpdatingStatus(true);
      const res = await api.patch(`/content/tickets/${id}/`, {
        priority: newPriority,
      });
      toast.success(`اولویت تیکت به «${res.data.priority_display || newPriority}» تغییر یافت.`);
      setTicket(res.data);
      setResponsePriority(res.data.priority);
    } catch (err) {
      console.error(err);
      toast.error('خطا در تغییر اولویت تیکت.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            مدیریت آموزشگاه
          </span>
        );
      case 'COACH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Whistle className="w-3.5 h-3.5" />
            کادر مربیان
          </span>
        );
      case 'SWIMMER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <User className="w-3.5 h-3.5" />
            شناگر / اولیا
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200">
            {role}
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return <Badge variant="danger">جدید / ثبت‌شده</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="warning">در حال بررسی</Badge>;
      case 'NEED_INFO':
        return <Badge variant="coral">نیازمند اطلاعات</Badge>;
      case 'ANSWERED':
        return <Badge variant="success">پاسخ داده‌شده</Badge>;
      case 'CLOSED':
        return <Badge variant="neutral">بسته‌شده</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
            <AlertTriangle className="w-3.5 h-3.5" />
            بحرانی / اضطراری
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
            فوری
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-900">
            متوسط
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200">
            عادی
          </span>
        );
    }
  };

  if (loading) {
    return <LoadingState type="detail" message="در حال بارگذاری جزئیات تیکت ناظر فنی..." />;
  }

  if (!ticket) {
    return null;
  }

  const createdShamsi = toShamsiDate(ticket.created_at);
  const isImageAttachment = ticket.attachment && /\.(png|jpe?g|gif|webp|svg)$/i.test(ticket.attachment);

  return (
    <div className="space-y-4 sm:space-y-6 pb-12" dir="rtl">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto">
          <BackButton to="/supervisor/tickets" label="بازگشت به لیست" forceTo={true} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="px-2.5 py-0.5 rounded-lg font-mono font-bold text-xs bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/60">
                #{ticket.id}
              </span>
              <h1 className="text-base sm:text-xl font-black text-slate-900 dark:text-white truncate">
                {ticket.subject}
              </h1>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span>دسته‌بندی: <strong className="text-slate-700 dark:text-slate-200">{ticket.category_display || ticket.category}</strong></span>
              <span>•</span>
              <span>تاریخ ثبت: <strong className="font-mono text-slate-700 dark:text-slate-200">{createdShamsi?.shortNumeric || ticket.created_at?.slice(0, 10)}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-between md:justify-end flex-wrap">
          <div className="flex items-center gap-1.5">
            {getPriorityBadge(ticket.priority)}
            {getStatusBadge(ticket.status)}
          </div>

          <button
            type="button"
            onClick={() => fetchTicket(true)}
            disabled={refreshing}
            className="p-2 sm:px-3 sm:py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            title="بروزرسانی داده‌ها"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
            <span className="hidden sm:inline">بروزرسانی</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Main Content (Right/8 cols on Desktop, Full Width on Mobile) */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-6">
          {/* 1. Original Ticket Description Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-sm border border-slate-200 dark:border-slate-700">
                  {ticket.user_name?.[0] || 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {ticket.user_name}
                    </span>
                    {getRoleBadge(ticket.user_role)}
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    شماره همراه: {ticket.user_phone}
                  </div>
                </div>
              </div>

              {ticket.swimmer_name && (
                <div className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-xl border border-blue-200/60 dark:border-blue-800/60 font-medium">
                  شناگر مرتبط: <strong className="font-bold">{ticket.swimmer_name}</strong>
                </div>
              )}
            </div>

            {/* Description Text */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-400">متن پیام و شرح مشکل ارسال‌شده توسط کاربر:</span>
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </div>
            </div>

            {/* Initial Attachment Preview (if any) */}
            {ticket.attachment && (
              <div className="p-3.5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 space-y-2">
                <span className="text-xs font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" />
                  فایل پیوست اولیه کاربر:
                </span>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isImageAttachment ? (
                      <img
                        src={getMediaUrl(ticket.attachment_url || ticket.attachment)}
                        alt="تصویر پیوست تیکت"
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-xs">
                        فایل ارسالی تیکت
                      </div>
                      <div className="text-[11px] text-slate-400">برای مشاهده یا دانلود کلیک نمایید</div>
                    </div>
                  </div>

                  <a
                    href={getMediaUrl(ticket.attachment_url || ticket.attachment)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 text-xs font-bold text-sky-700 hover:text-sky-800 bg-sky-100 dark:bg-sky-900/50 hover:bg-sky-200 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>مشاهده فایل</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* 2. Conversation Thread */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  تاریخچه پیام‌ها و گفتگو
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {ticket.messages?.length || 1} پیام
              </span>
            </div>

            <div className="space-y-3.5 pt-1">
              {ticket.messages && ticket.messages.length > 0 ? (
                ticket.messages.map((m, idx) => {
                  const isSupervisor = m.sender_role === 'SUPERVISOR';
                  const shamsi = toShamsiDate(m.created_at);

                  return (
                    <div
                      key={m.id || idx}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                        isSupervisor
                          ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/70 mr-1 sm:mr-8 text-amber-950 dark:text-amber-100'
                          : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700 ml-1 sm:ml-8 text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1 sm:px-2 sm:py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                              isSupervisor
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {isSupervisor ? <ShieldCheck className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                            <span>{m.sender_name || (isSupervisor ? 'ناظر فنی سامانه' : 'کاربر')}</span>
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ({m.sender_role_display || m.sender_role})
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {shamsi?.shortNumeric} {m.created_at?.slice(11, 16)}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-normal">
                        {m.message}
                      </p>

                      {m.attachment && (
                        <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5">
                          <a
                            href={getMediaUrl(m.attachment_url || m.attachment)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>مشاهده یا دانلود فایل پیوست</span>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                  پیام دیگری ثبت نشده است.
                </div>
              )}
            </div>
          </div>

          {/* 3. Supervisor Response Console */}
          <form
            onSubmit={handleSendSupervisorReply}
            className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <CornerDownLeft className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                ثبت و ارسال پاسخ رسمی ناظر فنی
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Set Status on Reply */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  وضعیت تیکت پس از ارسال این پاسخ:
                </label>
                <select
                  value={responseStatus}
                  onChange={(e) => setResponseStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                >
                  <option value="ANSWERED">پاسخ داده‌شده (ANSWERED)</option>
                  <option value="IN_PROGRESS">در حال بررسی فنی (IN_PROGRESS)</option>
                  <option value="NEED_INFO">نیازمند اطلاعات بیشتر از کاربر (NEED_INFO)</option>
                  <option value="CLOSED">حل‌شده و بستن تیکت (CLOSED)</option>
                </select>
              </div>

              {/* Attachment */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  پیوست فایل راهنما یا اصلاحیه (اختیاری):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="sup-page-reply-file"
                    onChange={(e) => setResponseAttachment(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label
                    htmlFor="sup-page-reply-file"
                    className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-500 text-xs text-slate-600 dark:text-slate-300 cursor-pointer flex items-center gap-1.5 bg-slate-50/60 dark:bg-slate-800/60 truncate"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{responseAttachment ? responseAttachment.name : 'انتخاب فایل یا اسکرین‌شات'}</span>
                  </label>
                  {responseAttachment && (
                    <button
                      type="button"
                      onClick={() => setResponseAttachment(null)}
                      className="px-2.5 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    >
                      حذف
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Reply Textarea */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                متن پاسخ رسمی ناظر فنی: <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={5}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="توضیحات رفع مشکل، نتیجه بررسی فنی، یا راهنمایی لازم برای کاربر را بنویسید..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800 transition-all leading-relaxed font-normal"
                required
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[11px] text-slate-400">
                با ارسال پاسخ، اعلان فوری در سامانه برای کاربر ثبت و ارسال می‌شود.
              </div>

              <button
                type="submit"
                disabled={submittingReply}
                className="px-7 py-3 text-xs sm:text-sm font-black text-white bg-amber-600 hover:bg-amber-700 active:scale-[0.98] rounded-xl sm:rounded-2xl transition-all shadow-md shadow-amber-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>{submittingReply ? 'در حال ارسال پاسخ...' : 'ارسال پاسخ رسمی ناظر فنی'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Details & Quick Actions (Left/4 cols on Desktop, Bottom on Mobile) */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-6">
          {/* 1. Quick Status Lifecycle Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>اقدامات سریع وضعیت</span>
            </h4>

            <div className="space-y-2">
              {ticket.status !== 'IN_PROGRESS' && (
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleQuickStatusChange('IN_PROGRESS')}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200/80 dark:border-amber-800 transition-all text-right flex items-center justify-between cursor-pointer"
                >
                  <span>علامت‌گذاری به عنوان در حال بررسی</span>
                  <Clock className="w-3.5 h-3.5" />
                </button>
              )}

              {ticket.status !== 'CLOSED' && (
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleQuickStatusChange('CLOSED')}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all text-right flex items-center justify-between cursor-pointer"
                >
                  <span>حل مشکل و بستن قطعی تیکت</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </button>
              )}

              {ticket.status === 'CLOSED' && (
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleQuickStatusChange('IN_PROGRESS')}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 border border-sky-200 transition-all text-right flex items-center justify-between cursor-pointer"
                >
                  <span>بازگشایی مجدد تیکت</span>
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Priority Switching */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500">تغییر سطح اولویت:</span>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {[
                  { id: 'LOW', label: 'عادی', color: 'hover:border-slate-400' },
                  { id: 'MEDIUM', label: 'متوسط', color: 'hover:border-sky-400' },
                  { id: 'HIGH', label: 'فوری', color: 'hover:border-amber-400' },
                  { id: 'URGENT', label: 'بحرانی', color: 'hover:border-rose-400' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => handleQuickPriorityChange(item.id)}
                    className={`py-1.5 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      ticket.priority === item.id
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : `bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 ${item.color}`
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Sender Profile Information Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <User className="w-4 h-4 text-sky-600" />
              <span>مشخصات ارسال‌کننده تیکت</span>
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400">نام کاربر:</span>
                <span className="font-bold text-slate-800 dark:text-white">{ticket.user_name}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400">نقش در سامانه:</span>
                <div>{getRoleBadge(ticket.user_role)}</div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400">شماره تماس:</span>
                <a
                  href={`tel:${ticket.user_phone}`}
                  className="font-mono font-bold text-sky-600 hover:underline flex items-center gap-1"
                >
                  <span>{ticket.user_phone}</span>
                  <Phone className="w-3 h-3" />
                </a>
              </div>

              {ticket.swimmer_name && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50">
                  <span className="text-blue-700 dark:text-blue-300 font-medium">شناگر مرتبط:</span>
                  <span className="font-bold text-blue-900 dark:text-blue-100">{ticket.swimmer_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. Ticket Technical Metadata */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>اطلاعات سیستمی تیکت</span>
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400">شماره پیگیری:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">#{ticket.id}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400">دسته‌بندی فنی:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{ticket.category_display || ticket.category}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400">زمان ثبت تیکت:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {createdShamsi?.shortNumeric} - {ticket.created_at?.slice(11, 16)}
                </span>
              </div>

              {ticket.responded_at && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-slate-400">آخرین پاسخ:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {ticket.responded_at?.slice(11, 16)} ({ticket.responded_by_name || 'ناظر فنی'})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
