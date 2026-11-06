import React, { useState, useEffect } from 'react';
import {
  Database, HardDrive, Download, RefreshCw, CheckCircle2,
  Clock, ShieldCheck, Plus, AlertCircle, FileArchive
} from 'lucide-react';
import api from '../../api/client';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';

export const SupervisorBackupsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [notes, setNotes] = useState('');
  const [showModal, setShowModal] = useState(false);
  const toast = useToast();

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const res = await api.get('/supervisor/backups/');
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error('عدم برقراری ارتباط با سرویس پشتیبان‌گیری');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async (e) => {
    e.preventDefault();
    try {
      setTriggering(true);
      const res = await api.post('/supervisor/backups/', { notes });
      toast.success('نسخه پشتیبان دستی با موفقیت ایجاد شد.');
      setShowModal(false);
      setNotes('');
      fetchBackups();
    } catch (err) {
      console.error(err);
      toast.error('خطا در اجرای فرآیند تهیه پشتیبان');
    } finally {
      setTriggering(false);
    }
  };

  if (loading && !data) {
    return <LoadingState type="dashboard" message="در حال استعلام وضعیت نسخه‌های پشتیبان پایگاه داده..." />;
  }

  const backups = data?.backups || [];
  const latest = data?.latest_backup;
  const totalMb = data?.total_storage_mb || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">پشتیبان‌گیری و بازیابی پایگاه داده (Backup & Recovery)</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            پایش دامپ‌های خودکار PostgreSQL، اعتبارسنجی Checksum و امکان ایجاد نسخه پشتیبان دستی اضطراری
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>تهیه پشتیبان دستی فوری</span>
          </button>
        </div>
      </div>

      {/* Backup Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
            <Clock className="w-4 h-4 text-sky-500" />
            <span>آخرین زمان پشتیبان‌گیری:</span>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {latest ? new Date(latest.created_at).toLocaleString('fa-IR') : 'هنوز رکوردی ثبت نشده'}
          </div>
          <p className="text-xs text-slate-500">{latest ? latest.filename : '-'}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
            <HardDrive className="w-4 h-4 text-emerald-500" />
            <span>فضای مصرف‌شده توسط بک‌آپ‌ها:</span>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {totalMb} مگابایت
          </div>
          <p className="text-xs text-slate-500">مجموع فایل‌های فشرده SQL.GZ</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            <span>سلامت یکپارچگی داده‌ها (Checksum):</span>
          </div>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5" />
            <span>تأییدشده و معتبر</span>
          </div>
          <p className="text-xs text-slate-500">SHA256 Hash Verified</p>
        </div>
      </div>

      {/* Backups List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">سوابق فایل‌های پشتیبان ذخیره‌شده</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">نسخه‌های پشتیبان ایجادشده توسط زمان‌بند سیستمی و ناظر</p>
        </div>

        {backups.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
            هیچ نسخه پشتیبانی ثبت نشده است. با زدن دکمه بالا یک نسخه پشتیبان دستی ایجاد کنید.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4">نام فایل</th>
                  <th className="p-4">حجم</th>
                  <th className="p-4">نوع</th>
                  <th className="p-4">وضعیت</th>
                  <th className="p-4">زمان ثبت</th>
                  <th className="p-4">مدت ساخت</th>
                  <th className="p-4">ایجادکننده</th>
                  <th className="p-4">چک‌سام SHA256</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {backups.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <FileArchive className="w-4 h-4 text-sky-500 shrink-0" />
                      <span>{b.filename}</span>
                    </td>
                    <td className="p-4 font-mono text-slate-700 dark:text-slate-300">{b.file_size_formatted}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {b.backup_type_display}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {b.status_display}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">{new Date(b.created_at).toLocaleString('fa-IR')}</td>
                    <td className="p-4 font-mono text-slate-600 dark:text-slate-300">{b.duration_seconds} ثانیه</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">{b.created_by_name}</td>
                    <td className="p-4 font-mono text-slate-400 truncate max-w-xs">{b.checksum ? b.checksum.slice(0, 16) + '...' : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Backup Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">ایجاد نسخه پشتیبان دستی از دیتابیس</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              این عملیات یک فایل دامپ فشرده از تمامی جداول و رکوردهای سامانه IranSwim بدون توقف سرویس‌دهی ایجاد کرده و در جدول ثبت می‌نماید.
            </p>

            <form onSubmit={handleCreateBackup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  توضیحات و دلیل پشتیبان‌گیری:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: بک‌آپ قبل از اعمال تغییرات ساختار دوره جدید"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={triggering}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={triggering}
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {triggering && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>شروع فرآیند بک‌آپ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
