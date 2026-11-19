import React from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  Bug,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Filter,
  RefreshCw,
  Search,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { EmptyState } from '../../../components/common/EmptyState';
import { LoadingState } from '../../../components/common/LoadingState';
import { Pagination } from '../../../components/common/Pagination';

export const ErrorIssuesTab = ({
  issues,
  loading,
  search,
  setSearch,
  handleSearchSubmit,
  severityFilter,
  setSeverityFilter,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  statusCodeFilter,
  setStatusCodeFilter,
  assignedFilter,
  setAssignedFilter,
  ordering,
  setOrdering,
  technicians,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onSelectIssue,
  onRefresh,
}) => {
  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="danger">بحرانی (CRITICAL)</Badge>;
      case 'HIGH':
        return <Badge variant="coral">بالا (HIGH)</Badge>;
      case 'MEDIUM':
        return <Badge variant="warning">متوسط (MEDIUM)</Badge>;
      case 'LOW':
        return <Badge variant="info">پایین (LOW)</Badge>;
      default:
        return <Badge variant="neutral">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'NEW':
        return <Badge variant="danger">جدید (New)</Badge>;
      case 'INVESTIGATING':
        return <Badge variant="warning">در حال بررسی</Badge>;
      case 'PENDING_FIX':
        return <Badge variant="violet">در انتظار اصلاحیه</Badge>;
      case 'RESOLVED':
        return <Badge variant="success">رفع‌شده</Badge>;
      case 'CLOSED':
        return <Badge variant="neutral">بسته‌شده</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'AUTHENTICATION':
        return <Badge variant="violet">احراز هویت</Badge>;
      case 'DATABASE':
        return <Badge variant="teal">دیتابیس</Badge>;
      case 'INFRASTRUCTURE':
        return <Badge variant="coral">زیرساخت</Badge>;
      case 'BACKGROUND_TASKS':
        return <Badge variant="warning">وظایف پس‌زمینه</Badge>;
      case 'FRONTEND':
        return <Badge variant="info">فرانت‌اند</Badge>;
      case 'BUSINESS_LOGIC':
        return <Badge variant="primary">منطق تجاری</Badge>;
      default:
        return <Badge variant="info">API</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Advanced Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        {/* Search Row */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              placeholder="جستجو در مسیر اندپوینت، پیام باگ، نوع استثنا یا شناسه عددی (مثلاً 12)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button type="submit" size="sm" className="w-full sm:w-auto">
              جستجو
            </Button>
            <button
              type="button"
              onClick={onRefresh}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
              title="تازه‌سازی لیست"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
            </button>
          </div>
        </form>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Severity */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">شدت باگ:</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-sky-500"
            >
              <option value="">همه سطوح</option>
              <option value="CRITICAL">بحرانی (CRITICAL)</option>
              <option value="HIGH">بالا (HIGH)</option>
              <option value="MEDIUM">متوسط (MEDIUM)</option>
              <option value="LOW">پایین (LOW)</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">دسته‌بندی:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-sky-500"
            >
              <option value="">همه دسته‌ها</option>
              <option value="API">وب‌سرویس و API</option>
              <option value="AUTHENTICATION">احراز هویت و امنیت</option>
              <option value="DATABASE">پایگاه داده</option>
              <option value="INFRASTRUCTURE">زیرساخت و شبکه</option>
              <option value="BACKGROUND_TASKS">وظایف پس‌زمینه</option>
              <option value="FRONTEND">فرانت‌اند</option>
              <option value="BUSINESS_LOGIC">منطق تجاری</option>
            </select>
          </div>

          {/* Investigation Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">وضعیت پیگیری:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-sky-500"
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="NEW">جدید (New)</option>
              <option value="INVESTIGATING">در حال بررسی</option>
              <option value="PENDING_FIX">در انتظار اصلاحیه</option>
              <option value="RESOLVED">رفع‌شده</option>
              <option value="CLOSED">بسته‌شده</option>
            </select>
          </div>

          {/* HTTP Status Code */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">کد وضعیت HTTP:</label>
            <select
              value={statusCodeFilter}
              onChange={(e) => setStatusCodeFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-sky-500 font-mono"
            >
              <option value="">تمام کدها</option>
              <option value="500">500 (Internal Error)</option>
              <option value="502">502 (Bad Gateway)</option>
              <option value="503">503 (Service Unavailable)</option>
              <option value="401">401 (Unauthorized)</option>
              <option value="403">403 (Forbidden)</option>
              <option value="400">400 (Bad Request)</option>
            </select>
          </div>

          {/* Assigned Technician */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">کارشناس مسئول:</label>
            <select
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-sky-500"
            >
              <option value="">همه کارشناسان</option>
              <option value="unassigned">تخصیص‌نیافته</option>
              {technicians?.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.full_name} ({tech.role_display})
                </option>
              ))}
            </select>
          </div>

          {/* Ordering */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">مرتب‌سازی:</label>
            <select
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-sky-500"
            >
              <option value="-last_seen">جدیدترین رخداد</option>
              <option value="first_seen">قدیمی‌ترین رخداد</option>
              <option value="-occurrence_count">بیشترین تکرار باگ</option>
              <option value="severity">شدت خطا</option>
              <option value="status">وضعیت پیگیری</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grouped Incidents Table */}
      {loading ? (
        <LoadingState type="table" rows={8} message="در حال استعلام و دسته‌بندی خطاهای سرور..." />
      ) : issues.length === 0 ? (
        <EmptyState
          title="هیچ باگ یا خطایی یافت نشد"
          description="با توجه به فیلترهای انتخابی، موردی ثبت نگردیده است."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-colors space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-3 py-3 rounded-r-xl">شناسه</th>
                  <th className="px-3 py-3">نوع استثنا و عنوان</th>
                  <th className="px-3 py-3">شدت</th>
                  <th className="px-3 py-3">دسته‌بندی</th>
                  <th className="px-3 py-3">مسیر و متد</th>
                  <th className="px-3 py-3 text-center">تعداد وقوع</th>
                  <th className="px-3 py-3 text-center">کاربران متأثر</th>
                  <th className="px-3 py-3">آخرین رخداد</th>
                  <th className="px-3 py-3">وضعیت</th>
                  <th className="px-3 py-3">کارشناس مسئول</th>
                  <th className="px-3 py-3 text-center rounded-l-xl">اقدام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {issues.map((issue) => (
                  <tr
                    key={issue.id}
                    onClick={() => onSelectIssue(issue.id)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* ID & Status code */}
                    <td className="px-3 py-3 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-500 dark:text-slate-400">#{issue.id}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900">
                          {issue.status_code}
                        </span>
                      </div>
                    </td>

                    {/* Title & Exception Type */}
                    <td className="px-3 py-3 max-w-xs">
                      <span className="font-mono font-bold text-slate-900 dark:text-white block truncate" title={issue.exception_type}>
                        {issue.exception_type}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate" title={issue.error_message}>
                        {issue.error_message}
                      </span>
                    </td>

                    {/* Severity */}
                    <td className="px-3 py-3">{getSeverityBadge(issue.severity)}</td>

                    {/* Category */}
                    <td className="px-3 py-3">{getCategoryBadge(issue.category)}</td>

                    {/* Endpoint & Method */}
                    <td className="px-3 py-3 font-mono text-[11px]">
                      <span className="font-bold text-slate-800 dark:text-slate-200 ml-1">
                        [{issue.http_method || 'API'}]
                      </span>
                      <span className="text-slate-600 dark:text-slate-300 truncate max-w-[140px] inline-block align-middle" title={issue.endpoint}>
                        {issue.endpoint}
                      </span>
                    </td>

                    {/* Occurrence Count (Stable Grouping demonstration) */}
                    <td className="px-3 py-3 text-center">
                      <span className="font-mono font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-lg border border-rose-100 dark:border-rose-900 text-xs inline-block">
                        {issue.occurrence_count}×
                      </span>
                    </td>

                    {/* Affected Users Count */}
                    <td className="px-3 py-3 text-center font-mono">
                      <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{issue.affected_users_count || 0}</span>
                      </span>
                    </td>

                    {/* Last Seen */}
                    <td className="px-3 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {new Date(issue.last_seen).toLocaleDateString('fa-IR')}
                      <span className="block text-[10px] text-slate-400">
                        {new Date(issue.last_seen).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3">{getStatusBadge(issue.status)}</td>

                    {/* Assigned Technician */}
                    <td className="px-3 py-3 text-slate-700 dark:text-slate-300 text-[11px]">
                      {issue.assigned_to_name ? (
                        <span className="inline-flex items-center gap-1 font-medium text-sky-700 dark:text-sky-300">
                          <User className="w-3.5 h-3.5" />
                          <span>{issue.assigned_to_name}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">تخصیص‌نیافته</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectIssue(issue.id);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 rounded-lg border border-sky-200 dark:border-sky-800 transition-colors shrink-0 cursor-pointer"
                      >
                        بررسی و استک
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {issues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => onSelectIssue(issue.id)}
                className="py-3.5 space-y-2.5 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded-xl px-1 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="font-bold text-slate-500 dark:text-slate-400 text-xs">#{issue.id}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900">
                      {issue.status_code}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-xs truncate max-w-[140px]">
                      {issue.exception_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {getSeverityBadge(issue.severity)}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {issue.error_message}
                </p>

                <div className="flex items-center justify-between text-xs font-mono bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]" dir="ltr">
                    [{issue.http_method}] {issue.endpoint}
                  </span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400 shrink-0">
                    {issue.occurrence_count}× وقوع
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(issue.status)}
                    <span>{issue.assigned_to_name ? issue.assigned_to_name : 'تخصیص‌نیافته'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectIssue(issue.id);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 rounded-lg border border-sky-200 dark:border-sky-800 transition-colors cursor-pointer"
                  >
                    بررسی استک
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={onPageChange}
            itemLabel="گروه خطای سیستمی"
          />
        </div>
      )}
    </div>
  );
};
