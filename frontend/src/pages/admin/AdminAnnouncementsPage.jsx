import React, { useState, useEffect } from 'react';
import {
  Bell, Send, Pin, Users, BookOpen, Clock,
  CheckCircle2, AlertCircle, Trash2
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';

export const AdminAnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Create Announcement Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    audience: 'ALL', // ALL, SWIMMERS, COACHES, GROUP
    target_group: '',
    is_pinned: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [annRes, grpRes] = await Promise.all([
        api.get('/content/announcements/'),
        api.get('/education/groups/'),
      ]);
      setAnnouncements(annRes.data.results || annRes.data);
      setGroups(grpRes.data.results || grpRes.data);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت لیست اعلان‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message) {
      toast.error('عنوان و متن پیام اعلان الزامی هستند.');
      return;
    }
    if (form.audience === 'GROUP' && !form.target_group) {
      toast.error('لطفاً گروه هدف پیام را انتخاب کنید.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: form.title,
        message: form.message,
        audience: form.audience,
        target_group: form.audience === 'GROUP' ? Number(form.target_group) : null,
        is_pinned: form.is_pinned,
      };

      await api.post('/content/announcements/', payload);
      toast.success('پیام اعلان با موفقیت برای مخاطبان ارسال شد.');
      setIsModalOpen(false);
      setForm({
        title: '',
        message: '',
        audience: 'ALL',
        target_group: '',
        is_pinned: false,
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در ارسال اعلان');
    } finally {
      setSubmitting(false);
    }
  };

  const audienceLabels = {
    ALL: 'همه اعضای آموزشگاه',
    SWIMMERS: 'فقط شناگران',
    COACHES: 'فقط مربیان',
    GROUP: 'اعضای یک گروه مشخص',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-sky-600" />
            مرکز ارسال پیام و اعلان‌های درون‌برنامه‌ای
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            ارسال هشدارهای فوری، یادآوری سررسید اقساط، تغییر ساعت یا لغو کلاس برای شناگران و مربیان
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-1.5 text-xs">
          <Send className="w-4 h-4" />
          <span>ارسال اعلان جدید</span>
        </Button>
      </div>

      {loading ? (
        <LoadingState message="در حال دریافت پیام‌های سیستمی..." />
      ) : announcements.length === 0 ? (
        <EmptyState
          title="اعلانی ثبت نشده است"
          description="با کلیک روی دکمه بالا، می‌توانید برای مخاطبان هدف پیام اطلاع‌رسانی ارسال کنید."
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-colors shadow-xs ${
                item.is_pinned
                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 gap-2">
                <div className="flex items-center gap-2">
                  {item.is_pinned && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">
                      <Pin className="w-3 h-3 rotate-45" />
                      مهم و پین‌شده
                    </span>
                  )}
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={item.audience === 'ALL' ? 'info' : item.audience === 'GROUP' ? 'warning' : 'neutral'}>
                    مخاطب: {audienceLabels[item.audience] || item.audience}
                  </Badge>
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(item.created_at).toLocaleDateString('fa-IR')}
                  </span>
                </div>
              </div>

              <div className="pt-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {item.message}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Announcement */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="ارسال پیام اعلان جدید"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              عنوان پیام اعلان *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="مثال: یادآوری تغییر زمان سانس یا سررسید شهریه..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                مخاطبان هدف
              </label>
              <select
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              >
                <option value="ALL">همه اعضای آموزشگاه (عمومی)</option>
                <option value="SWIMMERS">فقط شناگران</option>
                <option value="COACHES">فقط مربیان</option>
                <option value="GROUP">اعضای یک گروه خاص کلاسی</option>
              </select>
            </div>

            {form.audience === 'GROUP' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  انتخاب گروه کلاسی *
                </label>
                <select
                  required
                  value={form.target_group}
                  onChange={(e) => setForm({ ...form, target_group: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">انتخاب گروه...</option>
                  {groups.map((grp) => (
                    <option key={grp.id} value={grp.id}>
                      {grp.course_name} - {grp.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_pinned"
              checked={form.is_pinned}
              onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
              className="rounded text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="is_pinned" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              این اعلان مهم / پین‌شده باشد (در بالای پرتال نمایش داده شود)
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              متن کامل پیام *
            </label>
            <textarea
              rows={4}
              required
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="متن پیام اطلاع‌رسانی به مخاطبان..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'در حال ارسال...' : 'ارسال اعلان'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
