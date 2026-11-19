import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  Bug,
  CheckCircle2,
  Clock,
  History,
  Layers,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  Sliders,
  Terminal,
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { OverviewTab } from './error-center/OverviewTab';
import { ErrorIssuesTab } from './error-center/ErrorIssuesTab';
import { ErrorDetailDrawer } from './error-center/ErrorDetailDrawer';
import { InfrastructureTab } from './error-center/InfrastructureTab';
import { AlertsTab } from './error-center/AlertsTab';
import { InvestigationHistoryTab } from './error-center/InvestigationHistoryTab';
import { MonitoringSettingsTab } from './error-center/MonitoringSettingsTab';

export const SupervisorErrorsPage = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState('overview'); // overview, issues, infrastructure, alerts, history, settings

  // Deep Inspection Drawer State
  const [selectedIssueId, setSelectedIssueId] = useState(null);

  // Overview Tab State
  const [statsData, setStatsData] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Issues Tab State
  const [issues, setIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [statusCodeFilter, setStatusCodeFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');
  const [ordering, setOrdering] = useState('-last_seen');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 12;

  // Infrastructure Tab State
  const [infraData, setInfraData] = useState(null);
  const [infraLoading, setInfraLoading] = useState(true);

  // Technicians List
  const [technicians, setTechnicians] = useState([]);

  const toast = useToast();

  // 1. Fetch Overview Stats
  const fetchOverviewStats = useCallback(async () => {
    try {
      setOverviewLoading(true);
      const params = { time_range: timeRange };
      if (timeRange === 'custom' && customStart && customEnd) {
        params.start_date = customStart;
        params.end_date = customEnd;
      }
      const res = await api.get('/supervisor/errors/overview/', { params });
      setStatsData(res.data);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت آمار نمای کلی خطاهای سرور');
    } finally {
      setOverviewLoading(false);
    }
  }, [timeRange, customStart, customEnd]);

  // 2. Fetch Grouped Error Issues
  const fetchIssues = useCallback(async (page = 1) => {
    try {
      setIssuesLoading(true);
      const params = {
        page,
        page_size: pageSize,
        ordering,
      };
      if (search) params.search = search;
      if (severityFilter) params.severity = severityFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      if (statusCodeFilter) params.status_code = statusCodeFilter;
      if (assignedFilter) params.assigned_to = assignedFilter;

      const res = await api.get('/supervisor/errors/groups/', { params });
      if (res.data?.results) {
        setIssues(res.data.results);
        setTotalItems(res.data.count || 0);
      } else if (Array.isArray(res.data)) {
        setIssues(res.data);
        setTotalItems(res.data.length);
      }
      setCurrentPage(page);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت لیست باگ‌ها و رخدادها');
    } finally {
      setIssuesLoading(false);
    }
  }, [search, severityFilter, categoryFilter, statusFilter, statusCodeFilter, assignedFilter, ordering]);

  // 3. Fetch Comprehensive Infrastructure
  const fetchInfrastructure = useCallback(async () => {
    try {
      setInfraLoading(true);
      const res = await api.get('/supervisor/infrastructure/live/');
      setInfraData(res.data);
    } catch (err) {
      console.error(err);
      toast.error('خطا در ارزیابی وضعیت سلامت زیرساخت');
    } finally {
      setInfraLoading(false);
    }
  }, []);

  // 4. Fetch Technicians List
  const fetchTechnicians = useCallback(async () => {
    try {
      const res = await api.get('/supervisor/technicians/');
      setTechnicians(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchOverviewStats();
    fetchTechnicians();
  }, [fetchOverviewStats, fetchTechnicians]);

  useEffect(() => {
    if (activeTab === 'issues') {
      fetchIssues(1);
    } else if (activeTab === 'infrastructure') {
      fetchInfrastructure();
    }
  }, [activeTab, fetchIssues, fetchInfrastructure]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    fetchIssues(1);
  };

  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  return (
    <div className="space-y-4 sm:space-y-6 select-auto">
      {/* Top Banner & Hub Title */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 md:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/80 shadow-2xs shrink-0">
              <Bug className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                <span>مرکز جامع پایش خطاها و مدیریت رخدادها</span>
                <span className="text-[11px] sm:text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Incident Center
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                تجمیع خطاهای تکراری بر مبنای Fingerprint پایدار، پایش سلامت سرویس‌های زیرساخت و چرخه حیات پیگیری باگ‌ها
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'overview') fetchOverviewStats();
              else if (activeTab === 'issues') fetchIssues(currentPage);
              else if (activeTab === 'infrastructure') fetchInfrastructure();
              toast.info('داده‌ها به‌روزرسانی شدند.');
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer w-full sm:w-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تازه‌سازی سریع</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs Bar */}
      <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-1 overflow-x-auto text-xs no-scrollbar scroll-smooth">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'overview'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4 shrink-0" />
          <span>۱. نمای کلی و آمار</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('issues')}
          className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'issues'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Bug className="w-4 h-4 shrink-0" />
          <span>۲. باگ‌ها و خطاها</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('infrastructure')}
          className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'infrastructure'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Server className="w-4 h-4 shrink-0" />
          <span>۳. پایش زیرساخت</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('alerts')}
          className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'alerts'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Bell className="w-4 h-4 shrink-0" />
          <span>۴. هشدارها و وقایع</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'history'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4 shrink-0" />
          <span>۵. تاریخچه پیگیری</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'settings'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4 shrink-0" />
          <span>۶. تنظیمات و آستانه‌ها</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <OverviewTab
          statsData={statsData}
          loading={overviewLoading}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          customStart={customStart}
          setCustomStart={setCustomStart}
          customEnd={customEnd}
          setCustomEnd={setCustomEnd}
          onRefresh={fetchOverviewStats}
          onViewIssues={(filterStatus) => {
            if (filterStatus) setStatusFilter(filterStatus);
            setActiveTab('issues');
          }}
          onViewAlerts={() => setActiveTab('alerts')}
        />
      )}

      {activeTab === 'issues' && (
        <ErrorIssuesTab
          issues={issues}
          loading={issuesLoading}
          search={search}
          setSearch={setSearch}
          handleSearchSubmit={handleSearchSubmit}
          severityFilter={severityFilter}
          setSeverityFilter={setSeverityFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          statusCodeFilter={statusCodeFilter}
          setStatusCodeFilter={setStatusCodeFilter}
          assignedFilter={assignedFilter}
          setAssignedFilter={setAssignedFilter}
          ordering={ordering}
          setOrdering={setOrdering}
          technicians={technicians}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={(page) => fetchIssues(page)}
          onSelectIssue={(id) => setSelectedIssueId(id)}
          onRefresh={() => fetchIssues(currentPage)}
        />
      )}

      {activeTab === 'infrastructure' && (
        <InfrastructureTab
          infraData={infraData}
          loading={infraLoading}
          onRefresh={fetchInfrastructure}
        />
      )}

      {activeTab === 'alerts' && <AlertsTab />}

      {activeTab === 'history' && (
        <InvestigationHistoryTab
          onSelectIssue={(id) => setSelectedIssueId(id)}
        />
      )}

      {activeTab === 'settings' && <MonitoringSettingsTab />}

      {/* Deep Inspection Drawer / Modal */}
      <ErrorDetailDrawer
        issueId={selectedIssueId}
        isOpen={!!selectedIssueId}
        onClose={() => setSelectedIssueId(null)}
        onUpdated={() => {
          fetchIssues(currentPage);
          fetchOverviewStats();
        }}
        technicians={technicians}
      />
    </div>
  );
};
