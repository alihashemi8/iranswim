import React, { useState, useEffect } from 'react';
import {
  Headphones, Search, Filter, RefreshCw, Send, CheckCircle2,
  Clock, AlertTriangle, Paperclip, User, ShieldCheck, Whistle,
  ChevronDown, ChevronUp, MessageSquare, ExternalLink, X,
  AlertCircle, Check, ArrowRight
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { toShamsiDate } from '../../utils/date';
import { getMediaUrl } from '../../utils/media';

const ROLE_OPTIONS = [
  { id: 'ALL', label: 'همه نقش‌ها' },
  { id: 'ADMIN', label: 'مدیریت آموزشگاه' },
  { id: 'COACH', label: 'کادر مربیان' },
  { id: 'SWIMMER', label: 'شناگران و اولیا' },
];

const STATUS_OPTIONS = [
  { id: 'ALL', label: 'همه وضعیت‌ها' },
  { id: 'SUBMITTED', label: 'ثبت‌شده (جدید)' },
  { id: 'IN_PROGRESS', label: 'در حال بررسی' },
  { id: 'NEED_INFO', label: 'نیازمند اطلاعات' },
  { id: 'ANSWERED', label: 'پاسخ داده‌شده' },
  { id: 'CLOSED', label: 'بسته‌شده' },
];

const PRIORITY_OPTIONS = [
  { id: 'ALL', label: 'همه اولویت‌ها' },
  { id: 'URGENT', label: 'اضطراری' },
  { id: 'HIGH', label: 'فوری' },
  { id: 'MEDIUM', label: 'متوسط' },
  { id: 'LOW', label: 'عادی' },
];

export const SupervisorTicketsPage = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    in_progress: 0,
    need_info: 0,
    answered: 0,
    closed: 0,
    by_role: { ADMIN: 0, COACH: 0, SWIMMER: 0 },
    by_priority: { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Ticket for detail / response drawer
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [responseStatus, setResponseStatus] = useState('ANSWERED');
  const [responsePriority, setResponsePriority] = useState('MEDIUM');
  const [responseText, setResponseText] = useState('');
  const [responseAttachment, setResponseAttachment] = useState(null);
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchTickets = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const params = {};
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const [ticketsRes, statsRes] = await Promise.allSettled([
        api.get('/content/tickets/', { params }),
        api.get('/content/tickets/stats/'),
      ]);

      if (ticketsRes.status === 'fulfilled') {
        const d = ticketsRes.value.data;
        const list = Array.isArray(d) ? d : d.results || [];
        setTickets(list);

        if (selectedTicket) {
          const fresh = list.find((item) => item.id === selectedTicket.id);
          if (fresh) setSelectedTicket(fresh);
        }
      }

      if (statsRes.status === 'fulfilled' && statsRes.value.data) {
        setStats(statsRes.value.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت لیست تیکت‌ها.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [roleFilter, statusFilter, priorityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTickets();
  };

  const handleOpenTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setResponseStatus(ticket.status === 'SUBMITTED' ? 'ANSWERED' : ticket.status);
    setResponsePriority(ticket.priority || 'MEDIUM');
    setResponseText('');
    setResponseAttachment(null);

    try {
      const res = await api.get(`/content/tickets/${ticket.id}/`);
      setSelectedTicket(res.data);
      setResponseStatus(res.data.status === 'SUBMITTED' ? 'ANSWERED' : res.data.status);
      setResponsePriority(res.data.priority || 'MEDIUM');
    } catch (err) {
      console.error(err);
    }
  };

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

      const res = await api.post(`/content/tickets/${selectedTicket.id}/reply/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('پاسخ شما با موفقیت ثبت و اعلان برای کاربر ارسال گردید.');
      setSelectedTicket(res.data);
      setResponseText('');
      setResponseAttachment(null);
      await fetchTickets(true);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت پاسخ.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleQuickStatusChange = async (newStatus) => {
    if (!selectedTicket) return;
    try {
      const res = await api.patch(`/content/tickets/${selectedTicket.id}/`, {
        status: newStatus,
      });
      toast.success(`وضعیت تیکت به «${res.data.status_display || newStatus}» تغییر یافت.`);
      setSelectedTicket(res.data);
      setResponseStatus(res.data.status);
      await fetchTickets(true);
    } catch (err) {
      console.error(err);
      toast.error('خطا در تغییر وضعیت تیکت.');
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
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200">
            عادی
          </span>
        );
    }
  };

  if (loading) {
    return <LoadingState type="table" message="در حال بارگذاری مرکز تیکت‌های پشتیبانی ناظر فنی..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400">
              <Headphones className="w-6 h-6" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              مرکز تیکت‌های پشتیبانی ناظر فنی
            </h1>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/60">
              <span>دریافت تیکت از مدیریت، مربیان و شناگران</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            پایش رخدادها، باگ‌های اعلامی، درخواست‌های تغییرات فنی و پاسخ‌گویی آنلاین به کاربران با تفکیک نقش‌ها.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <button
            type="button"
            onClick={() => fetchTickets(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
            <span>بروزرسانی داده‌ها</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => { setStatusFilter('ALL'); setRoleFilter('ALL'); }}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs cursor-pointer hover:border-slate-300 transition-all"
        >
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">کل تیکت‌ها</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-1">تمام درخواست‌های ثبت‌شده</div>
        </div>

        <div
          onClick={() => setStatusFilter('SUBMITTED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            stats.submitted > 0
              ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900 ring-2 ring-rose-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-300">نیازمند بررسی / جدید</span>
            {stats.submitted > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">{stats.submitted}</div>
          <div className="text-[11px] text-rose-600/80 dark:text-rose-400 mt-1">تیکت‌های پاسخ‌داده‌نشده</div>
        </div>

        <div
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs cursor-pointer hover:border-slate-300 transition-all"
        >
          <div className="text-xs font-bold text-amber-600 dark:text-amber-400">در حال بررسی</div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">{stats.in_progress}</div>
          <div className="text-[11px] text-slate-400 mt-1">در دست اقدام تیم فنی</div>
        </div>

        <div
          onClick={() => setStatusFilter('ANSWERED')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs cursor-pointer hover:border-slate-300 transition-all"
        >
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">پاسخ داده‌شده</div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{stats.answered}</div>
          <div className="text-[11px] text-slate-400 mt-1">تیکت‌های رسیدگی‌شده</div>
        </div>
      </div>

      {/* Role Breakdown Bar */}
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between flex-wrap gap-2 text-xs">
        <span className="font-bold text-slate-600 dark:text-slate-300">تفکیک ارسال‌کنندگان:</span>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setRoleFilter(roleFilter === 'ADMIN' ? 'ALL' : 'ADMIN')}
            className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              roleFilter === 'ADMIN'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>مدیریت آموزشگاه:</span>
            <span className="font-mono">{stats.by_role?.ADMIN || 0}</span>
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter(roleFilter === 'COACH' ? 'ALL' : 'COACH')}
            className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              roleFilter === 'COACH'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Whistle className="w-3.5 h-3.5" />
            <span>کادر مربیان:</span>
            <span className="font-mono">{stats.by_role?.COACH || 0}</span>
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter(roleFilter === 'SWIMMER' ? 'ALL' : 'SWIMMER')}
            className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              roleFilter === 'SWIMMER'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>شناگران و اولیا:</span>
            <span className="font-mono">{stats.by_role?.SWIMMER || 0}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_OPTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStatusFilter(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === item.id
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Priority & Search Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500 shrink-0">اولویت:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در موضوع، شماره، فرستنده یا شماره همراه..."
              className="w-full pl-3 pr-9 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); fetchTickets(); }}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Tickets List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {tickets.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {tickets.map((t) => {
              const shamsi = toShamsiDate(t.created_at);
              return (
                <div
                  key={t.id}
                  onClick={() => handleOpenTicket(t)}
                  className="p-5 sm:p-6 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-mono font-bold text-sm shrink-0 border border-amber-200/50">
                        #{t.id}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {t.subject}
                          </h3>
                          <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                            {t.category_display || t.category}
                          </span>
                        </div>

                        {/* Sender info */}
                        <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                          {getRoleBadge(t.user_role)}
                          <span className="font-bold text-slate-700 dark:text-slate-300">{t.user_name}</span>
                          <span className="font-mono text-slate-400">({t.user_phone})</span>
                          {t.swimmer_name && (
                            <span className="text-blue-600 dark:text-blue-400">
                              شناگر: {t.swimmer_name}
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

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed bg-slate-50/80 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {t.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <div className="flex items-center gap-3 font-mono">
                      <span>تاریخ ثبت: {shamsi?.shortNumeric || t.created_at?.slice(0, 10)}</span>
                      {t.messages_count > 1 && (
                        <span className="flex items-center gap-1 font-sans font-bold text-slate-600 dark:text-slate-300">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {t.messages_count} پیام در گفتگو
                        </span>
                      )}
                      {t.attachment && (
                        <span className="flex items-center gap-1 text-sky-600 font-sans font-bold">
                          <Paperclip className="w-3.5 h-3.5" />
                          پیوست دارد
                        </span>
                      )}
                    </div>

                    <span className="text-amber-600 dark:text-amber-400 font-bold group-hover:underline flex items-center gap-1">
                      <span>مشاهده و پاسخ ناظر</span>
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-16 text-center">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mb-3">
              <Headphones className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">هیچ تیکتی با این فیلترها یافت نشد</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto mt-1">
              می‌توانید فیلتر وضعیت یا نقش را روی «همه» قرار دهید یا واژه جستجو را تغییر دهید.
            </p>
          </div>
        )}
      </div>

      {/* Ticket Management & Response Modal */}
      {selectedTicket && (
        <Modal
          isOpen={Boolean(selectedTicket)}
          onClose={() => setSelectedTicket(null)}
          title={`رسیدگی ناظر فنی به تیکت #${selectedTicket.id}: ${selectedTicket.subject}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto p-1 text-right scrollbar-thin" dir="rtl">
            {/* Sender Detail Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-black flex items-center justify-center text-base">
                    {selectedTicket.user_name?.[0] || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {selectedTicket.user_name}
                      </span>
                      {getRoleBadge(selectedTicket.user_role)}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      تلفن همراه: {selectedTicket.user_phone}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getPriorityBadge(selectedTicket.priority)}
                  {getStatusBadge(selectedTicket.status)}
                </div>
              </div>

              {selectedTicket.swimmer_name && (
                <div className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 p-2 rounded-xl">
                  شناگر مرتبط با درخواست: <span className="font-bold">{selectedTicket.swimmer_name}</span>
                </div>
              )}
            </div>

            {/* Conversation Thread */}
            <div className="space-y-3 pt-1">
              <div className="text-xs font-bold text-slate-400 px-1">تاریخچه پیام‌های تیکت:</div>

              {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                selectedTicket.messages.map((m, idx) => {
                  const isSupervisor = m.sender_role === 'SUPERVISOR';
                  const shamsi = toShamsiDate(m.created_at);

                  return (
                    <div
                      key={m.id || idx}
                      className={`p-4 rounded-2xl border transition-all ${
                        isSupervisor
                          ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/70 ml-4 sm:ml-8 text-amber-950 dark:text-amber-100'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mr-4 sm:mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1.5 rounded-xl text-xs font-bold flex items-center gap-1 ${
                              isSupervisor
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {isSupervisor ? <ShieldCheck className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                            <span>{m.sender_name || (isSupervisor ? 'ناظر فنی سامانه' : 'کاربر')}</span>
                          </span>
                          <span className="text-xs text-slate-400">
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
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 space-y-2 text-xs sm:text-sm">
                  <p>{selectedTicket.description}</p>
                </div>
              )}
            </div>

            {/* Quick Status Bar */}
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                اقدامات سریع وضعیت:
              </span>
              <div className="flex items-center gap-2">
                {selectedTicket.status !== 'IN_PROGRESS' && (
                  <button
                    type="button"
                    onClick={() => handleQuickStatusChange('IN_PROGRESS')}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-all cursor-pointer"
                  >
                    علامت‌گذاری به عنوان در حال بررسی
                  </button>
                )}
                {selectedTicket.status !== 'CLOSED' && (
                  <button
                    type="button"
                    onClick={() => handleQuickStatusChange('CLOSED')}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-600 hover:bg-slate-700 text-white transition-all cursor-pointer"
                  >
                    بستن تیکت
                  </button>
                )}
              </div>
            </div>

            {/* Supervisor Reply Form */}
            <form onSubmit={handleSendSupervisorReply} className="space-y-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    وضعیت پس از ارسال پاسخ:
                  </label>
                  <select
                    value={responseStatus}
                    onChange={(e) => setResponseStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="ANSWERED">پاسخ داده‌شده (ANSWERED)</option>
                    <option value="IN_PROGRESS">در حال بررسی (IN_PROGRESS)</option>
                    <option value="NEED_INFO">نیازمند اطلاعات بیشتر (NEED_INFO)</option>
                    <option value="CLOSED">پاسخ داده‌شده و بسته‌شده (CLOSED)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    پیوست فایل راهنما یا اصلاحیه (اختیاری):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="sup-reply-attachment"
                      onChange={(e) => setResponseAttachment(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label
                      htmlFor="sup-reply-attachment"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-500 text-xs text-slate-600 dark:text-slate-300 cursor-pointer flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/40 truncate"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{responseAttachment ? responseAttachment.name : 'انتخاب فایل'}</span>
                    </label>
                    {responseAttachment && (
                      <button
                        type="button"
                        onClick={() => setResponseAttachment(null)}
                        className="text-rose-500 text-xs font-bold"
                      >
                        حذف
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  متن پاسخ ناظر فنی سامانه: <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="پاسخ فنی، توضیحات رفع مشکل یا راهنمایی لازم برای کاربر را بنویسید..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-400">
                  با ارسال پاسخ، اعلان و اطلاعیه سیستمی برای کاربر مربوطه ارسال خواهد شد.
                </span>
                <button
                  type="submit"
                  disabled={submittingReply}
                  className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{submittingReply ? 'در حال ارسال پاسخ...' : 'ارسال پاسخ رسمی ناظر'}</span>
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};
