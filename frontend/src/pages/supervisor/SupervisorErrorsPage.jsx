import React, { useState, useEffect } from 'react';
import { Bug, Search, Filter, CheckCircle, AlertTriangle, Terminal, Copy, Check } from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

export const SupervisorErrorsPage = () => {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [resolvedFilter, setResolvedFilter] = useState('');
  
  // Selected error modal state
  const [selectedError, setSelectedError] = useState(null);
  const [resolveNote, setResolveNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchErrors = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (levelFilter) params.level = levelFilter;
      if (resolvedFilter) params.is_resolved = resolvedFilter;
      const res = await api.get('/supervisor/errors/', { params });
      setErrors(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrors();
  }, [levelFilter, resolvedFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchErrors();
  };

  const handleResolve = async (isResolved) => {
    if (!selectedError) return;
    try {
      setUpdating(true);
      const res = await api.post(`/supervisor/errors/${selectedError.id}/resolve/`, {
        is_resolved: isResolved,
        resolution_note: resolveNote
      });
      setSelectedError(res.data);
      fetchErrors();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const copyStackTrace = () => {
    if (selectedError?.stack_trace) {
      navigator.clipboard.writeText(selectedError.stack_trace);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bug className="w-5 h-5 text-rose-500" />
            مرکز ثبت و پایش خطاهای سرور و باگ‌ها
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            مشاهده استک‌ترس کامل، پارامترهای درخواست کلاینت و ثبت وضعیت رفع باگ‌ها توسط ناظر
          </p>
        </div>
        <button
          onClick={fetchErrors}
          className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors self-start sm:self-auto"
        >
          تازه‌سازی لاگ‌ها
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              placeholder="جستجو در مسیر اندپوینت، پیام خطا یا نوع استثنا..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-9 pl-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
            />
          </div>
          <Button type="submit" size="sm">جستجو</Button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">تمام سطوح خطا</option>
            <option value="CRITICAL">بحرانی (CRITICAL)</option>
            <option value="ERROR">خطا (ERROR)</option>
            <option value="WARNING">هشدار (WARNING)</option>
          </select>

          <select
            value={resolvedFilter}
            onChange={(e) => setResolvedFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">تمام وضعیت‌ها</option>
            <option value="false">رفع‌نشده (نیاز به اقدام)</option>
            <option value="true">بررسی و رفع‌شده</option>
          </select>
        </div>
      </div>

      {/* Errors Table */}
      {loading ? (
        <LoadingState message="در حال دریافت لاگ‌های خطای سرور..." />
      ) : errors.length === 0 ? (
        <EmptyState
          title="هیچ خطایی ثبت نشده است"
          description="خوشبختانه با این فیلتر، هیچ خطای سروری در سیستم ثبت نشده است."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200/80">
                <tr>
                  <th className="px-4 py-3.5">کد خطا</th>
                  <th className="px-4 py-3.5">نوع استثنا (Exception)</th>
                  <th className="px-4 py-3.5">مسیر و متد</th>
                  <th className="px-4 py-3.5">کاربر مربوطه</th>
                  <th className="px-4 py-3.5">زمان وقوع</th>
                  <th className="px-4 py-3.5">وضعیت</th>
                  <th className="px-4 py-3.5 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {errors.map((err) => (
                  <tr key={err.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                        {err.status_code}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-medium text-slate-900 block">{err.exception_type}</span>
                      <span className="text-xs text-slate-500 truncate max-w-xs block" title={err.error_message}>
                        {err.error_message}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
                      <span className="font-bold text-slate-800 ml-1">[{err.http_method}]</span>
                      {err.endpoint}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      {err.user_name}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 font-mono">
                      {new Date(err.timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-4 py-3.5">
                      {err.is_resolved ? (
                        <Badge variant="success">رفع‌شده</Badge>
                      ) : (
                        <Badge variant="danger">در انتظار بررسی</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => {
                          setSelectedError(err);
                          setResolveNote(err.resolution_note || '');
                        }}
                        className="px-3 py-1 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 transition-colors"
                      >
                        بررسی و استک‌ترس
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stack Trace & Error Detail Modal */}
      <Modal
        isOpen={!!selectedError}
        onClose={() => setSelectedError(null)}
        title={`جزئیات باگ #${selectedError?.id} - [${selectedError?.exception_type}]`}
        maxWidth="max-w-4xl"
      >
        {selectedError && (
          <div className="space-y-5">
            {/* Meta info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block">کد وضعیت HTTP:</span>
                <span className="font-bold font-mono text-rose-600">{selectedError.status_code}</span>
              </div>
              <div>
                <span className="text-slate-400 block">متد و مسیر:</span>
                <span className="font-mono text-slate-800">{selectedError.http_method} {selectedError.endpoint}</span>
              </div>
              <div>
                <span className="text-slate-400 block">آدرس IP کلاینت:</span>
                <span className="font-mono text-slate-800">{selectedError.ip_address || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">کاربر:</span>
                <span className="font-medium text-slate-800">{selectedError.user_name}</span>
              </div>
            </div>

            {/* Error Message */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">متن پیام خطا:</label>
              <div className="p-3 bg-rose-50/70 border border-rose-200 text-rose-900 rounded-lg text-sm font-mono">
                {selectedError.error_message}
              </div>
            </div>

            {/* Request Data Preview (Safe) */}
            {selectedError.request_data && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">داده‌های ارسالی کلاینت (فیلترشده):</label>
                <pre className="p-2.5 bg-slate-100 rounded-lg text-xs font-mono text-slate-700 overflow-x-auto">
                  {selectedError.request_data}
                </pre>
              </div>
            )}

            {/* Full Stack Trace with Copy Button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  استک‌ترس کامل خطا (Traceback):
                </label>
                <button
                  onClick={copyStackTrace}
                  className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'کپی شد!' : 'کپی استک‌ترس'}</span>
                </button>
              </div>
              <pre
                dir="ltr"
                className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto max-h-72 leading-relaxed selection:bg-sky-500"
              >
                {selectedError.stack_trace}
              </pre>
            </div>

            {/* Resolution Form */}
            <div className="pt-4 border-t border-slate-200 bg-slate-50/50 -mx-6 -mb-6 p-6">
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                یادداشت ناظر سامانه (علت باگ، اقدام اصلاحی یا توضیحات):
              </label>
              <textarea
                rows={2}
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                placeholder="توضیحات و نتیجه بررسی باگ..."
                className="w-full text-sm bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 mb-3"
              />
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  {selectedError.is_resolved && (
                    <span>توسط {selectedError.resolved_by_name} در تاریخ {new Date(selectedError.resolved_at).toLocaleDateString('fa-IR')} رفع شده است.</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedError.is_resolved ? (
                    <Button
                      variant="outline"
                      size="sm"
                      loading={updating}
                      onClick={() => handleResolve(false)}
                    >
                      بازگشایی مجدد خطا
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      loading={updating}
                      onClick={() => handleResolve(true)}
                    >
                      علامت‌گذاری به عنوان رفع‌شده
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
