import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { LoadingState } from '../../components/common/LoadingState';
import { toShamsiDate } from '../../utils/date';

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
  { id: 'URGENT', label: 'بحرانی / اضطراری' },
  { id: 'HIGH', label: 'فوری' },
  { id: 'MEDIUM', label: 'متوسط' },
  { id: 'LOW', label: 'عادی' },
];

export const SupervisorTicketsPage = () => {
  const navigate = useNavigate();
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

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
            مدیریت آموزشگاه
          </span>
        );
      case 'COACH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
            <Whistle className="w-3.5 h-3.5" />
            کادر مربیان
          </span>
        );
      case 'SWIMMER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
            <User className="w-3.5 h-3.5" />
            شناگر / اولیا
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 shrink-0">
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
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" />
            بحرانی
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 shrink-0">
            فوری
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-900 shrink-0">
            متوسط
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 shrink-0">
            عادی
          </span>
        );
    }
  };

  if (loading) {
    return <LoadingState type="table" message="در حال بارگذاری مرکز تیکت‌های پشتیبانی ناظر فنی..." />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-12" dir="rtl">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="p-2 sm:p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 shrink-0">
              <Headphones className="w-5 h-5 sm:w-6 sm:h-6" />
            </span>
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
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

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => fetchTickets(true)}
            disabled={refreshing}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl sm:rounded-2xl transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
            <span>بروزرسانی تیکت‌ها</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div
          onClick={() => { setStatusFilter('ALL'); setRoleFilter('ALL'); }}
          className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs cursor-pointer hover:border-slate-300 transition-all"
        >
          <div className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">کل تیکت‌ها</div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">تمام درخواست‌های ثبت‌شده</div>
        </div>

        <div
          onClick={() => setStatusFilter('SUBMITTED')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            stats.submitted > 0
              ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900 ring-2 ring-rose-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-rose-700 dark:text-rose-300 truncate">نیازمند بررسی / جدید</span>
            {stats.submitted > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
            )}
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">{stats.submitted}</div>
          <div className="text-[10px] sm:text-[11px] text-rose-600/80 dark:text-rose-400 mt-1 truncate">تیکت‌های پاسخ‌داده‌نشده</div>
        </div>

        <div
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs cursor-pointer hover:border-slate-300 transition-all"
        >
          <div className="text-[11px] sm:text-xs font-bold text-amber-600 dark:text-amber-400">در حال بررسی</div>
          <div className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">{stats.in_progress}</div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">در دست اقدام تیم فنی</div>
        </div>

        <div
          onClick={() => setStatusFilter('ANSWERED')}
          className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs cursor-pointer hover:border-slate-300 transition-all"
        >
          <div className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400">پاسخ داده‌شده</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{stats.answered}</div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">تیکت‌های رسیدگی‌شده</div>
        </div>
      </div>

      {/* Role Breakdown Bar */}
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between flex-wrap gap-2 text-xs">
        <span className="font-bold text-slate-600 dark:text-slate-300">تفکیک ارسال‌کنندگان:</span>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setRoleFilter(roleFilter === 'ADMIN' ? 'ALL' : 'ADMIN')}
            className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer text-xs ${
              roleFilter === 'ADMIN'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>مدیریت:</span>
            <span className="font-mono">{stats.by_role?.ADMIN || 0}</span>
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter(roleFilter === 'COACH' ? 'ALL' : 'COACH')}
            className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer text-xs ${
              roleFilter === 'COACH'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Whistle className="w-3.5 h-3.5" />
            <span>مربیان:</span>
            <span className="font-mono">{stats.by_role?.COACH || 0}</span>
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter(roleFilter === 'SWIMMER' ? 'ALL' : 'SWIMMER')}
            className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer text-xs ${
              roleFilter === 'SWIMMER'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>شناگران:</span>
            <span className="font-mono">{stats.by_role?.SWIMMER || 0}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_OPTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStatusFilter(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
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
              className="flex-1 sm:flex-initial px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-medium"
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
              placeholder="جستجو در موضوع، شماره، فرستنده یا همراه..."
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {tickets.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {tickets.map((t) => {
              const shamsi = toShamsiDate(t.created_at);
              return (
                <div
                  key={t.id}
                  onClick={() => navigate(`/supervisor/tickets/${t.id}`)}
                  className="p-4 sm:p-6 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                    <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-mono font-bold text-xs sm:text-sm shrink-0 border border-amber-200/50">
                        #{t.id}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {t.subject}
                          </h3>
                          <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg truncate">
                            {t.category_display || t.category}
                          </span>
                        </div>

                        {/* Sender info */}
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
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

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      {getPriorityBadge(t.priority)}
                      {getStatusBadge(t.status)}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed bg-slate-50/80 dark:bg-slate-800/30 p-2.5 sm:p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {t.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5 sm:gap-3 font-mono text-[11px] sm:text-xs">
                      <span>تاریخ ثبت: {shamsi?.shortNumeric || t.created_at?.slice(0, 10)}</span>
                      {t.messages_count > 1 && (
                        <span className="flex items-center gap-1 font-sans font-bold text-slate-600 dark:text-slate-300">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {t.messages_count} پیام
                        </span>
                      )}
                      {t.attachment && (
                        <span className="flex items-center gap-1 text-sky-600 font-sans font-bold">
                          <Paperclip className="w-3.5 h-3.5" />
                          پیوست دارد
                        </span>
                      )}
                    </div>

                    <span className="text-amber-600 dark:text-amber-400 font-bold group-hover:underline flex items-center gap-1 text-xs">
                      <span>مشاهده و پاسخ در صفحه اختصاصی</span>
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 sm:p-16 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-3xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mb-3">
              <Headphones className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">هیچ تیکتی با این فیلترها یافت نشد</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto mt-1">
              می‌توانید فیلتر وضعیت یا نقش را روی «همه» قرار دهید یا واژه جستجو را تغییر دهید.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
