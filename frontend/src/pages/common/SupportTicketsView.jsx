import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Headphones, Send, Plus, CheckCircle2, Clock, AlertCircle,
  FileText, Paperclip, ChevronDown, ChevronUp, User, ShieldCheck,
  Search, Filter, RefreshCw, MessageSquare, AlertTriangle, X,
  Download, Eye
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSwimmer } from '../../context/SwimmerContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { toShamsiDate } from '../../utils/date';
import { getMediaUrl } from '../../utils/media';

const CATEGORY_CHOICES = [
  { value: 'TECHNICAL', label: 'مشکلات فنی و سامانه' },
  { value: 'BUG', label: 'گزارش باگ یا خطای عملکردی' },
  { value: 'ACCOUNT', label: 'حساب کاربری و سطوح دسترسی' },
  { value: 'FEATURE', label: 'پیشنهاد یا درخواست امکانات' },
  { value: 'FINANCE', label: 'امور مالی و پرداخت شهریه' },
  { value: 'SCHEDULE', label: 'برنامه کلاس و زمان‌بندی' },
  { value: 'DOCUMENTS', label: 'مدارک و پرونده ورزشی' },
  { value: 'OTHER', label: 'سایر موارد و پیشنهادات' },
];

const PRIORITY_CHOICES = [
  { value: 'LOW', label: 'عادی', color: 'text-slate-600 bg-slate-100 dark:bg-slate-800' },
  { value: 'MEDIUM', label: 'متوسط', color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/60' },
  { value: 'HIGH', label: 'فوری', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60' },
  { value: 'URGENT', label: 'اضطراری و بحرانی', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60' },
];

export const SupportTicketsView = ({
  roleName = 'کاربر',
  roleColor = 'sky',
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const swimmerContext = useSwimmer() || {};
  const { activeSwimmer, activeSwimmerId } = swimmerContext;
  const toast = useToast();

  const userRole = user?.role || 'ADMIN';
  const createPath = userRole === 'ADMIN' ? '/admin/support/new' : userRole === 'COACH' ? '/coach/support/new' : '/swimmer/support/new';

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Reply Form State
  const [replyText, setReplyText] = useState('');
  const [replyAttachment, setReplyAttachment] = useState(null);
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchTickets = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      const res = await api.get('/content/tickets/');
      const d = res.data;
      const list = Array.isArray(d) ? d : d.results || [];
      setTickets(list);

      // If a ticket is currently open in modal, refresh its data
      if (selectedTicket) {
        const updated = list.find((t) => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (err) {
      console.error('Error fetching support tickets:', err);
      toast.error('خطا در دریافت لیست تیکت‌های پشتیبانی.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleOpenTicketDetail = async (ticket) => {
    setSelectedTicket(ticket);
    setReplyText('');
    setReplyAttachment(null);
    try {
      const res = await api.get(`/content/tickets/${ticket.id}/`);
      setSelectedTicket(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() && !replyAttachment) {
      toast.error('لطفاً پیام پاسخ یا فایل پیوست را وارد فرمایید.');
      return;
    }

    try {
      setSubmittingReply(true);
      const data = new FormData();
      if (replyText.trim()) {
        data.append('message', replyText.trim());
      }
      if (replyAttachment) {
        data.append('attachment', replyAttachment);
      }

      const res = await api.post(`/content/tickets/${selectedTicket.id}/reply/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('پاسخ شما برای ناظر فنی ارسال شد.');
      setReplyText('');
      setReplyAttachment(null);
      setSelectedTicket(res.data);
      await fetchTickets(true);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ارسال پاسخ.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    try {
      const res = await api.patch(`/content/tickets/${selectedTicket.id}/`, {
        status: 'CLOSED',
      });
      toast.success('تیکت با موفقیت بسته شد.');
      setSelectedTicket(res.data);
      await fetchTickets(true);
    } catch (err) {
      toast.error('خطا در بستن تیکت.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return <Badge variant="info">ثبت‌شده (جدید)</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="warning">در حال بررسی ناظر</Badge>;
      case 'NEED_INFO':
        return <Badge variant="coral">نیازمند اطلاعات بیشتر</Badge>;
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
            اضطراری
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
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            عادی
          </span>
        );
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSubject = t.subject?.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchId = String(t.id).includes(q);
      if (!matchSubject && !matchDesc && !matchId) return false;
    }
    return true;
  });

  const submittedCount = tickets.filter((t) => t.status === 'SUBMITTED').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'NEED_INFO').length;
  const answeredCount = tickets.filter((t) => t.status === 'ANSWERED').length;
  const closedCount = tickets.filter((t) => t.status === 'CLOSED').length;

  if (loading) {
    return <LoadingState type="list" message="در حال بارگذاری تیکت‌های پشتیبانی..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="p-2 rounded-2xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400">
              <Headphones className="w-5 h-5 sm:w-6 sm:h-6" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              ارتباط با پشتیبانی
            </h1>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>پاسخ‌گویی مستقیم ناظر فنی سامانه</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            ارسال مستقیم تیکت به ناظر فنی سامانه جهت گزارش خطاهای سیستمی، مشکلات فنی، پیگیری دسترسی، امور مالی و ارتقای خدمات.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => fetchTickets(true)}
            disabled={refreshing}
            className="p-2.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 rounded-2xl transition-all border border-slate-200/80 dark:border-slate-700 cursor-pointer"
            title="بروزرسانی تیکت‌ها"
          >
            <RefreshCw className={`w-4.5 h-4.5 ${refreshing ? 'animate-spin text-sky-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => navigate(createPath)}
            className="flex-1 md:flex-initial px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-2xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>ارسال تیکت جدید به ناظر فنی</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === 'ALL'
              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 ring-2 ring-sky-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">کل تیکت‌ها</div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{tickets.length}</div>
        </div>

        <div
          onClick={() => setStatusFilter('SUBMITTED')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === 'SUBMITTED'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-amber-600 dark:text-amber-400">در انتظار بررسی</div>
          <div className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">{submittedCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter('ANSWERED')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === 'ANSWERED'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">پاسخ داده‌شده</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{answeredCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter('CLOSED')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === 'CLOSED'
              ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 ring-2 ring-slate-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">بسته‌شده</div>
          <div className="text-xl sm:text-2xl font-black text-slate-700 dark:text-slate-300 mt-1">{closedCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'ALL', label: 'همه تیکت‌ها' },
            { id: 'SUBMITTED', label: 'ثبت‌شده' },
            { id: 'IN_PROGRESS', label: 'در حال بررسی' },
            { id: 'ANSWERED', label: 'پاسخ داده‌شده' },
            { id: 'CLOSED', label: 'بسته‌شده' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStatusFilter(item.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === item.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در موضوع، شماره یا متن..."
            className="w-full pl-3 pr-9 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3.5">
        {filteredTickets.length > 0 ? (
          filteredTickets.map((t) => {
            const shamsi = toShamsiDate(t.created_at);
            return (
              <div
                key={t.id}
                onClick={() => handleOpenTicketDetail(t)}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5 hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="p-2.5 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 shrink-0 group-hover:scale-105 transition-transform">
                      <Headphones className="w-5 h-5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                          #{t.id}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                          {t.subject}
                        </h3>
                        <span className="text-xs text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 px-2.5 py-0.5 rounded-lg font-bold">
                          {t.category_display || t.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                        <span>تاریخ: {shamsi?.shortNumeric || t.created_at?.slice(0, 10)}</span>
                        {t.messages_count > 1 && (
                          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-sans font-bold">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {t.messages_count} پیام
                          </span>
                        )}
                        {t.attachment && (
                          <span className="flex items-center gap-1 text-sky-600 font-sans font-bold">
                            <Paperclip className="w-3.5 h-3.5" />
                            دارای پیوست
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {getPriorityBadge(t.priority)}
                    {getStatusBadge(t.status)}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 bg-slate-50/70 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  {t.description}
                </p>

                {/* Supervisor response preview */}
                {t.response ? (
                  <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 truncate">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      پاسخ ناظر فنی: {t.response}
                    </span>
                    <span className="text-sky-600 dark:text-sky-400 font-bold shrink-0">
                      مشاهده گفتگو ←
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      در صف بررسی ناظر فنی سامانه
                    </span>
                    <span className="text-slate-400 group-hover:text-sky-600 transition-colors">
                      مشاهده جزئیات تیکت ←
                    </span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center mb-3">
              <Headphones className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">هیچ تیکت پشتیبانی یافت نشد</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-1 mb-5">
              در صورت بروز هرگونه مشکل فنی، سوال درباره سامانه، گزارش باگ یا درخواست‌های اداری، می‌توانید مستقیماً به ناظر فنی تیکت بزنید.
            </p>
            <button
              type="button"
              onClick={() => navigate(createPath)}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-2xl transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>ارسال اولین تیکت پشتیبانی</span>
            </button>
          </div>
        )}
      </div>



      {/* Ticket Conversation Detail Modal */}
      {selectedTicket && (
        <Modal
          isOpen={Boolean(selectedTicket)}
          onClose={() => setSelectedTicket(null)}
          title={`تیکت #${selectedTicket.id}: ${selectedTicket.subject}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto p-1 text-right scrollbar-thin" dir="rtl">
            {/* Ticket Info Strip */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 flex-wrap text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  دسته‌بندی: <span className="text-sky-600">{selectedTicket.category_display || selectedTicket.category}</span>
                </span>
                <span>•</span>
                {getPriorityBadge(selectedTicket.priority)}
                <span>•</span>
                {getStatusBadge(selectedTicket.status)}
              </div>
              <div className="text-slate-400 font-mono">
                {toShamsiDate(selectedTicket.created_at)?.fullText || selectedTicket.created_at?.slice(0, 10)}
              </div>
            </div>

            {/* Conversation Thread */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold text-slate-400 px-1">تاریخچه پیام‌ها و پاسخ‌های ناظر فنی:</div>

              {/* Messages list */}
              {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                selectedTicket.messages.map((m, idx) => {
                  const isSupervisor = m.sender_role === 'SUPERVISOR';
                  const isMe = m.sender === user?.id;
                  const shamsiTime = toShamsiDate(m.created_at);

                  return (
                    <div
                      key={m.id || idx}
                      className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${
                        isSupervisor
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-100 mr-1 sm:mr-6'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 ml-1 sm:ml-6'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1.5 rounded-xl text-xs font-bold flex items-center gap-1 ${
                              isSupervisor
                                ? 'bg-emerald-600 text-white'
                                : 'bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200'
                            }`}
                          >
                            {isSupervisor ? <ShieldCheck className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                            <span>{m.sender_name || (isSupervisor ? 'ناظر فنی سامانه' : 'شما')}</span>
                          </span>
                          {isSupervisor && (
                            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                              پاسخ رسمی ناظر فنی
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {shamsiTime?.shortNumeric} {m.created_at?.slice(11, 16)}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-normal">
                        {m.message}
                      </p>

                      {/* Message Attachment */}
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
                /* Fallback if messages array is empty */
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="text-xs font-bold text-slate-500">متن تیکت ارسال‌شده:</div>
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                    {selectedTicket.description}
                  </p>
                  {selectedTicket.attachment && (
                    <div className="pt-2">
                      <a
                        href={getMediaUrl(selectedTicket.attachment_url || selectedTicket.attachment)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:underline"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>مشاهده فایل پیوست</span>
                      </a>
                    </div>
                  )}
                  {selectedTicket.response && (
                    <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200">
                      <div className="font-bold text-emerald-800 mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        پاسخ ناظر فنی:
                      </div>
                      <p>{selectedTicket.response}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Status / Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs text-slate-400">
                وضعیت فعلی: {getStatusBadge(selectedTicket.status)}
              </span>
              {selectedTicket.status !== 'CLOSED' && (
                <button
                  type="button"
                  onClick={handleCloseTicket}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  علامت‌گذاری مشکل به عنوان حل‌شده (بستن تیکت)
                </button>
              )}
            </div>

            {/* Reply Input Form */}
            {selectedTicket.status !== 'CLOSED' ? (
              <form onSubmit={handleSendReply} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ارسال پیام تکمیلی یا پاسخ به ناظر فنی:
                  </label>
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="پیام یا توضیحات جدید خود را بنویسید..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="reply-file-input"
                      onChange={(e) => setReplyAttachment(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label
                      htmlFor="reply-file-input"
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-sky-500 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/40"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate max-w-[120px] sm:max-w-xs">{replyAttachment ? replyAttachment.name : 'افزودن پیوست جدید'}</span>
                    </label>
                    {replyAttachment && (
                      <button
                        type="button"
                        onClick={() => setReplyAttachment(null)}
                        className="text-rose-500 text-xs font-bold"
                      >
                        حذف
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReply}
                    className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingReply ? 'در حال ارسال...' : 'ارسال پاسخ'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                این تیکت بسته‌شده است. در صورت نیاز به پیگیری مجدد، تیکت جدیدی ارسال فرمایید.
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
