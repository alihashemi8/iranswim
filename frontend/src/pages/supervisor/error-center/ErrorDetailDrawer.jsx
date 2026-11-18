import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Bug,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  ExternalLink,
  FileCode,
  FileText,
  GitBranch,
  History,
  Layers,
  RotateCcw,
  Send,
  Shield,
  Terminal,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import api from '../../../api/client';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { LoadingState } from '../../../components/common/LoadingState';
import { useToast } from '../../../context/ToastContext';

export const ErrorDetailDrawer = ({
  issueId,
  isOpen,
  onClose,
  onUpdated,
  technicians,
}) => {
  const [data, setData] = useState(null);
  const [occurrences, setOccurrences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [occurrencesLoading, setOccurrencesLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('trace'); // trace, request, user, occurrences, workflow
  const toast = useToast();

  // Workflow Action Form States
  const [actionLoading, setActionLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [assignedTechnician, setAssignedTechnician] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [resolutionDetails, setResolutionDetails] = useState('');

  const fetchDetail = async () => {
    if (!issueId) return;
    try {
      setLoading(true);
      const res = await api.get(`/supervisor/errors/groups/${issueId}/`);
      setData(res.data);
      setNewStatus(res.data.status);
      setAssignedTechnician(res.data.assigned_to || '');
      setRootCause(res.data.suspected_root_cause || '');
      setResolutionDetails(res.data.resolution_details || '');
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت جزئیات باگ');
    } finally {
      setLoading(false);
    }
  };

  const fetchOccurrences = async () => {
    if (!issueId) return;
    try {
      setOccurrencesLoading(true);
      const res = await api.get(`/supervisor/errors/groups/${issueId}/occurrences/`);
      setOccurrences(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setOccurrencesLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && issueId) {
      fetchDetail();
      fetchOccurrences();
    }
  }, [isOpen, issueId]);

  const copyStackTrace = () => {
    const trace = data?.latest_occurrence?.stack_trace;
    if (trace) {
      navigator.clipboard.writeText(trace);
      setCopied(true);
      toast.info('استک‌ترس خطا با موفقیت کپی گردید.');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExecuteAction = async (actionType, extraPayload = {}) => {
    if (!issueId) return;
    try {
      setActionLoading(true);
      const payload = { action: actionType, ...extraPayload };
      const res = await api.post(`/supervisor/errors/groups/${issueId}/action/`, payload);
      setData(res.data);
      toast.success('اقدام ناظر با موفقیت در سامانه ثبت گردید.');
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error(err);
      toast.error('خطا در ثبت اقدام روی باگ');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const latest = data?.latest_occurrence;
  const frames = latest?.parsed_stack_frames || [];
  const loc = latest?.code_location || {};

  return (
    <div
      className="fixed inset-0 top-0 right-0 bottom-0 left-0 w-screen h-[100dvh] z-[9999] overflow-hidden bg-slate-950/65 backdrop-blur-xs flex justify-end select-none"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col select-auto animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 shrink-0">
              <Bug className="w-5 h-5" />
            </span>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                  #{data?.id || issueId}
                </span>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {data?.exception_type}
                </h2>
                <Badge variant={data?.severity === 'CRITICAL' ? 'danger' : data?.severity === 'HIGH' ? 'coral' : 'warning'}>
                  {data?.severity}
                </Badge>
              </div>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5" dir="ltr">
                [{data?.http_method}] {data?.endpoint}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={copyStackTrace}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 rounded-xl border border-sky-200 dark:border-sky-800 transition-colors"
              title="کپی متن کامل استک‌ترس"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'کپی شد!' : 'کپی استک'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="بستن"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Tabs Bar */}
        <div className="flex items-center gap-1 px-6 pt-2 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('trace')}
            className={`px-3.5 py-2.5 font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'trace'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            استک‌ترس و کد (Stack Trace)
          </button>
          <button
            onClick={() => setActiveTab('request')}
            className={`px-3.5 py-2.5 font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'request'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            بافت درخواست (Request Context)
          </button>
          <button
            onClick={() => setActiveTab('user')}
            className={`px-3.5 py-2.5 font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'user'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            بافت کاربر (User Context)
          </button>
          <button
            onClick={() => setActiveTab('occurrences')}
            className={`px-3.5 py-2.5 font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'occurrences'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            تاریخچه رخدادها ({data?.occurrence_count ?? 1})
          </button>
          <button
            onClick={() => setActiveTab('workflow')}
            className={`px-3.5 py-2.5 font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'workflow'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            مدیریت رخداد و پیگیری (Incident Actions)
          </button>
        </div>

        {/* Drawer Body Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <LoadingState type="card" message="در حال واکشی اطلاعات عمیق استک‌ترس و رخداد باگ..." />
          ) : (
            <>
              {/* Top Overview KPI Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">وضعیت پیگیری:</span>
                  <span className="font-bold text-slate-800 dark:text-white mt-0.5 block">
                    {data?.status_display}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">تعداد تکرار (گروه‌بندی‌شده):</span>
                  <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm mt-0.5 block">
                    {data?.occurrence_count}×
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">اولین رخداد:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px] mt-0.5 block">
                    {data?.first_seen ? new Date(data.first_seen).toLocaleDateString('fa-IR') : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">آخرین رخداد:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px] mt-0.5 block">
                    {data?.last_seen ? new Date(data.last_seen).toLocaleDateString('fa-IR') : '—'}
                  </span>
                </div>
              </div>

              {/* Error Message Box */}
              <div className="p-4 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl">
                <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300 block mb-1">متن خطا:</span>
                <p className="font-mono text-xs text-rose-900 dark:text-rose-200 leading-relaxed break-words" dir="ltr">
                  {data?.error_message}
                </p>
              </div>

              {/* TAB 1: STACK TRACE & CODE PRESENTATION */}
              {activeTab === 'trace' && (
                <div className="space-y-5">
                  {/* Code Location Header */}
                  {loc.file_path && loc.file_path !== 'unknown' && (
                    <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1.5 font-mono">
                          <FileCode className="w-4 h-4 text-sky-400" />
                          <span>{loc.file_path}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono">
                          خط {loc.line_number}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-mono">
                        در تابع: <strong className="text-white font-bold">{loc.function_name}</strong>
                      </div>
                      {loc.code_snippet && (
                        <div className="mt-2 p-2.5 bg-slate-950 rounded-xl font-mono text-xs text-rose-400 border border-slate-800" dir="ltr">
                          &gt; {loc.code_snippet}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Frame by Frame Presentation */}
                  {frames.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Code2 className="w-4 h-4 text-slate-500" />
                        <span>فریم‌های مسیر اجرا (Stack Frames):</span>
                      </label>
                      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                        {frames.map((f, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border text-xs font-mono transition-colors ${
                              f.is_in_app
                                ? 'bg-sky-50/60 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                            dir="ltr"
                          >
                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{f.file_name}</span>
                              <span>line {f.line_number} in {f.function_name}</span>
                            </div>
                            {f.code_snippet && (
                              <div className="mt-1 text-slate-700 dark:text-slate-300 text-[11px] truncate">
                                {f.code_snippet}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Complete Raw Stack Trace */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Terminal className="w-4 h-4 text-slate-500" />
                        <span>استک‌ترس کامل سیستمی (Traceback):</span>
                      </label>
                      <button
                        onClick={copyStackTrace}
                        className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium"
                      >
                        {copied ? 'کپی شد!' : 'کپی متن کامل'}
                      </button>
                    </div>
                    <pre
                      dir="ltr"
                      className="p-4 bg-slate-950 text-slate-200 rounded-2xl text-xs font-mono overflow-x-auto max-h-80 leading-relaxed border border-slate-800 selection:bg-sky-500"
                    >
                      {latest?.stack_trace || 'استک‌ترس موجود نیست.'}
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 2: REQUEST CONTEXT */}
              {activeTab === 'request' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block text-[11px]">متد و اندپوینت:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                        [{latest?.http_method}] {latest?.endpoint}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block text-[11px]">شناسه یکتای پیگیری (Correlation ID):</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 mt-1 block select-all">
                        {latest?.request_id || 'نامشخص'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block text-[11px]">مدت زمان پردازش:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 mt-1 block">
                        {latest?.duration_ms ? `${latest.duration_ms} میلی‌ثانیه` : '—'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block text-[11px]">آدرس IP کلاینت:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 mt-1 block">
                        {latest?.ip_address || '—'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[11px] mb-1">مرورگر و کلاینت (User-Agent):</span>
                    <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 block break-words" dir="ltr">
                      {latest?.user_agent || '—'}
                    </span>
                  </div>

                  {/* Sanitized Query Params */}
                  {latest?.query_params && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-1">
                        پارامترهای URL (Query Parameters - پالایش‌شده):
                      </span>
                      <pre className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono text-[11px] text-slate-800 dark:text-slate-200 overflow-x-auto" dir="ltr">
                        {latest.query_params}
                      </pre>
                    </div>
                  )}

                  {/* Sanitized Body Preview */}
                  {latest?.request_data && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-1">
                        داده‌های ارسالی کلاینت (Payload Preview - ماسک‌سازی امن):
                      </span>
                      <pre className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono text-[11px] text-slate-800 dark:text-slate-200 overflow-x-auto max-h-48" dir="ltr">
                        {latest.request_data}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: USER CONTEXT */}
              {activeTab === 'user' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block text-[11px]">شناسه کاربری:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                        {latest?.user || 'مهمان / ثبت‌نشده'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block text-[11px]">نام کاربر:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                        {latest?.user_name}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block text-[11px]">نقش کاربری:</span>
                      <span className="font-bold text-sky-600 dark:text-sky-400 mt-1 block">
                        {latest?.user_role}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl flex items-start gap-3">
                    <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-amber-900 dark:text-amber-200">الزام امنیتی حفاظت از حریم خصوصی کلاینت</h4>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                        کلمات عبور، کدهای پیامکی OTP، توکن‌های JWT و فایل‌های هویتی بر اساس استانداردهای OWASP ماسک‌سازی شده و تحت هیچ شرایطی در لاگ‌های مانیتورینگ ناظر ذخیره یا نمایش داده نمی‌شوند.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: OCCURRENCE HISTORY TIMELINE */}
              {activeTab === 'occurrences' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>تایم‌لاین رخدادهای مجزای این باگ:</span>
                    <span>{occurrences.length} رخداد اخیر</span>
                  </div>

                  {occurrencesLoading ? (
                    <LoadingState type="table" rows={4} message="در حال دریافت رخدادها..." />
                  ) : occurrences.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                      رخداد دیگری ثبت نشده است.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {occurrences.map((occ) => (
                        <div
                          key={occ.id}
                          className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-slate-400">#{occ.id}</span>
                            <span className="font-mono font-bold text-rose-600">{occ.status_code}</span>
                            <span className="font-mono text-slate-700 dark:text-slate-300">[{occ.http_method}]</span>
                            <span className="text-slate-600 dark:text-slate-300">{occ.user_name}</span>
                          </div>

                          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
                            <span>{occ.ip_address || '—'}</span>
                            <span>{new Date(occ.timestamp).toLocaleTimeString('fa-IR')}</span>
                            <span>{new Date(occ.timestamp).toLocaleDateString('fa-IR')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: INCIDENT ACTIONS & WORKFLOW */}
              {activeTab === 'workflow' && (
                <div className="space-y-5">
                  {/* Status & Assignment Box */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-sky-500" />
                      <span>تغییر وضعیت و ارجاع به کارشناس</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-500 mb-1">وضعیت باگ:</label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200"
                        >
                          <option value="NEW">جدید (New)</option>
                          <option value="INVESTIGATING">در حال بررسی (Investigating)</option>
                          <option value="PENDING_FIX">در انتظار انتشار اصلاحیه (Pending Fix)</option>
                          <option value="RESOLVED">رفع‌شده (Resolved)</option>
                          <option value="CLOSED">بسته‌شده (Closed)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-500 mb-1">تخصیص به کارشناس:</label>
                        <select
                          value={assignedTechnician}
                          onChange={(e) => setAssignedTechnician(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200"
                        >
                          <option value="">تخصیص‌نیافته</option>
                          {technicians?.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.full_name} ({t.role_display})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-end pt-2">
                      <Button
                        size="sm"
                        loading={actionLoading}
                        onClick={() => {
                          if (newStatus !== data.status) {
                            handleExecuteAction('change_status', { status: newStatus });
                          }
                          if (String(assignedTechnician) !== String(data.assigned_to || '')) {
                            handleExecuteAction('assign', { technician_id: assignedTechnician || null });
                          }
                        }}
                      >
                        ثبت تغییرات وضعیت و تخصیص
                      </Button>
                    </div>
                  </div>

                  {/* Root Cause & Resolution Form */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-500" />
                      <span>ثبت ریشه‌یابی و جزئیات رفع مشکل</span>
                    </h3>

                    <div>
                      <label className="block text-slate-500 mb-1">ریشه باگ (Root Cause):</label>
                      <textarea
                        rows={2}
                        value={rootCause}
                        onChange={(e) => setRootCause(e.target.value)}
                        placeholder="شرح علت ریشه‌ای بروز استثنا..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500"
                      />
                      <div className="text-right mt-1">
                        <button
                          type="button"
                          onClick={() => handleExecuteAction('record_root_cause', { root_cause: rootCause })}
                          className="px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-[11px] font-semibold hover:bg-amber-100"
                        >
                          ثبت ریشه خطا
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="block text-slate-500 mb-1">گزارش نحوه رفع (Resolution Details):</label>
                      <textarea
                        rows={2}
                        value={resolutionDetails}
                        onChange={(e) => setResolutionDetails(e.target.value)}
                        placeholder="توضیحات اقدام اصلاحی و کد پیگیری استقرار..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500"
                      />
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[11px] text-slate-400">
                          {data?.resolved_at && `رفع شده در ${new Date(data.resolved_at).toLocaleDateString('fa-IR')} توسط ${data.resolved_by_name || 'ناظر'}`}
                        </span>
                        <div className="flex items-center gap-2">
                          {data?.status === 'RESOLVED' && (
                            <button
                              type="button"
                              onClick={() => handleExecuteAction('reopen', { note: 'بازگشایی مجدد' })}
                              className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 rounded-lg text-[11px] font-semibold"
                            >
                              بازگشایی خطا
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleExecuteAction('record_resolution', { resolution_details: resolutionDetails })}
                            className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-semibold hover:bg-emerald-700"
                          >
                            ثبت رفع و خاتمه باگ
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Internal Note Form */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">افزودن یادداشت جدید ناظر:</label>
                    <textarea
                      rows={2}
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      placeholder="متن یادداشت داخلی..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200"
                    />
                    <div className="text-right">
                      <Button
                        size="sm"
                        disabled={!internalNote.trim()}
                        onClick={() => {
                          handleExecuteAction('add_note', { note: internalNote });
                          setInternalNote('');
                        }}
                      >
                        ثبت یادداشت
                      </Button>
                    </div>
                  </div>

                  {/* Audit Trail List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <History className="w-4 h-4 text-sky-500" />
                      <span>ردپای حسابرسی اقدامات (Audit Trail):</span>
                    </h4>

                    {data?.activities?.length === 0 ? (
                      <p className="text-xs text-slate-400">هنوز اقدامی روی این باگ ثبت نگردیده است.</p>
                    ) : (
                      <div className="space-y-2">
                        {data?.activities?.map((act) => (
                          <div
                            key={act.id}
                            className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between text-slate-500 text-[11px]">
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {act.activity_type_display} توسط {act.actor_name}
                              </span>
                              <span className="font-mono">
                                {new Date(act.created_at).toLocaleTimeString('fa-IR')} - {new Date(act.created_at).toLocaleDateString('fa-IR')}
                              </span>
                            </div>
                            {act.note && <p className="text-slate-600 dark:text-slate-300">{act.note}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
