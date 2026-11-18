import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  Filter,
  History,
  RefreshCw,
  Search,
  User,
  Users,
} from 'lucide-react';
import api from '../../../api/client';
import { Badge } from '../../../components/common/Badge';
import { EmptyState } from '../../../components/common/EmptyState';
import { LoadingState } from '../../../components/common/LoadingState';

export const InvestigationHistoryTab = ({ onSelectIssue }) => {
  const [resolvedIssues, setResolvedIssues] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const [resResolved, resAudit] = await Promise.all([
        api.get('/supervisor/errors/groups/', { params: { status: 'RESOLVED', page_size: 20 } }),
        api.get('/supervisor/audit-logs/', { params: { entity_type: 'ErrorGroup' } }),
      ]);
      setResolvedIssues(resResolved.data.results || resResolved.data || []);
      setAuditLogs(resAudit.data.results || resAudit.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-500" />
            <span>تاریخچه بررسی‌ها، اقدامات تکنسین‌ها و باگ‌های رفع‌شده</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ردپای کامل تصمیمات، گزارش‌های علت ریشه‌ای و مستندات رفع باگ در سامانه
          </p>
        </div>
        <button
          type="button"
          onClick={fetchHistory}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resolved Issues Column */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>باگ‌های اخیراً رفع‌شده ({resolvedIssues.length}):</span>
          </h3>

          {loading ? (
            <LoadingState type="table" rows={4} message="در حال واکشی تاریخچه باگ‌ها..." />
          ) : resolvedIssues.length === 0 ? (
            <EmptyState title="هیچ باگ رفع‌شده‌ای ثبت نشده است" />
          ) : (
            <div className="space-y-2.5">
              {resolvedIssues.map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => onSelectIssue(issue.id)}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">#{issue.id}</span>
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{issue.exception_type}</span>
                    </div>
                    <Badge variant="success">رفع‌شده</Badge>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-mono" dir="ltr">
                    [{issue.http_method}] {issue.endpoint}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-mono">
                    <span>{issue.occurrence_count} بار رخداد</span>
                    <span>آخرین: {new Date(issue.last_seen).toLocaleDateString('fa-IR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Technician Audit Trail Column */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-500" />
            <span>ردپای حسابرسی اقدامات ناظران (Audit Trail):</span>
          </h3>

          {loading ? (
            <LoadingState type="table" rows={4} message="در حال واکشی لاگ‌های حسابرسی..." />
          ) : auditLogs.length === 0 ? (
            <EmptyState title="اقدامی در لاگ ثبت نگردیده است" />
          ) : (
            <div className="space-y-2.5">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {log.action_display}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString('fa-IR')} - {new Date(log.timestamp).toLocaleDateString('fa-IR')}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    توسط: <strong className="text-slate-700 dark:text-slate-300">{log.actor_name}</strong> روی موجودیت #{log.entity_id}
                  </div>

                  {log.details && (
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-[11px] font-mono text-slate-600 dark:text-slate-400 overflow-x-auto" dir="ltr">
                      {JSON.stringify(log.details)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
