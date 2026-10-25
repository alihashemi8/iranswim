import React, { useState, useEffect } from 'react';
import {
  Newspaper, Plus, Eye, Edit, Trash2, Calendar,
  CheckCircle, Clock, Archive, Tag, Search
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';

export const AdminNewsPage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    category: 'GENERAL',
    status: 'PUBLISHED',
    summary: '',
    body: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Preview Modal
  const [previewPost, setPreviewPost] = useState(null);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/content/news/');
      setNews(res.data.results || res.data);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت لیست اخبار آموزشگاه');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleOpenCreate = () => {
    setEditingPost(null);
    setForm({
      title: '',
      slug: '',
      category: 'GENERAL',
      status: 'PUBLISHED',
      summary: '',
      body: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (post) => {
    setEditingPost(post);
    setForm({
      title: post.title,
      slug: post.slug,
      category: post.category,
      status: post.status,
      summary: post.summary || '',
      body: post.body,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.body) {
      toast.error('عنوان و متن اصلی خبر الزامی هستند.');
      return;
    }

    // Auto slug if empty
    const slugVal = form.slug.trim()
      ? form.slug.trim().replace(/\s+/g, '-')
      : form.title.trim().replace(/\s+/g, '-').slice(0, 50);

    try {
      setSubmitting(true);
      const payload = {
        ...form,
        slug: slugVal,
      };

      if (editingPost) {
        await api.put(`/content/news/${editingPost.slug}/`, payload);
        toast.success('خبر با موفقیت ویرایش شد.');
      } else {
        await api.post('/content/news/', payload);
        toast.success('خبر جدید با موفقیت منتشر گردید.');
      }

      setIsModalOpen(false);
      fetchNews();
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.slug?.[0] || 'خطا در ثبت خبر');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (slug) => {
    if (!window.confirm('آیا از حذف این خبر اطمینان دارید؟')) return;
    try {
      await api.delete(`/content/news/${slug}/`);
      toast.success('خبر با موفقیت حذف شد.');
      fetchNews();
    } catch (err) {
      toast.error('خطا در حذف خبر');
    }
  };

  const categoryLabels = {
    GENERAL: 'عمومی و اطلاعیه‌ها',
    COMPETITIONS: 'مسابقات و رویدادها',
    CLASSES: 'دوره‌ها و کلاس‌ها',
    HEALTH: 'آموزش و بهداشت استخر',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-sky-600" />
            سامانه مدیریت محتوا و اخبار سایت (CMS)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            انتشار اطلاعیه‌ها، تقویم مسابقات، نکات بهداشتی استخر و مدیریت وضعیت پیش‌نویس یا انتشار
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-1.5 text-xs">
          <Plus className="w-4 h-4" />
          <span>ارسال خبر جدید</span>
        </Button>
      </div>

      {loading ? (
        <LoadingState message="در حال بارگذاری اخبار..." />
      ) : news.length === 0 ? (
        <EmptyState
          title="خبری ثبت نشده است"
          description="با کلیک بر روی دکمه ارسال خبر، اولین مطلب آموزشی یا اطلاعیه را منتشر کنید."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((post) => (
            <div
              key={post.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between transition-colors"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-sky-600 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 rounded-lg">
                    {categoryLabels[post.category] || post.category}
                  </span>
                  <Badge variant={post.status === 'PUBLISHED' ? 'success' : post.status === 'DRAFT' ? 'warning' : 'neutral'}>
                    {post.status === 'PUBLISHED' ? 'منتشرشده' : post.status === 'DRAFT' ? 'پیش‌نویس' : 'آرشیو'}
                  </Badge>
                </div>

                <div className="py-3 space-y-2">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">
                    {post.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3">
                    {post.summary || post.body}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(post.publish_at).toLocaleDateString('fa-IR')}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPreviewPost(post)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="پیش‌نمایش"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(post)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="ویرایش"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(post.slug)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1. Modal: Create / Edit News */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPost ? 'ویرایش خبر' : 'انتشار خبر جدید در وب‌سایت'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              عنوان خبر *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                دسته‌بندی موضوعی
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              >
                <option value="GENERAL">عمومی و اطلاعیه‌ها</option>
                <option value="COMPETITIONS">مسابقات و رویدادها</option>
                <option value="CLASSES">دوره‌ها و کلاس‌ها</option>
                <option value="HEALTH">آموزش و بهداشت استخر</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                وضعیت انتشار
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              >
                <option value="PUBLISHED">منتشرشده در سایت (Published)</option>
                <option value="DRAFT">پیش‌نویس (Draft)</option>
                <option value="ARCHIVED">بایگانی‌شده (Archived)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              خلاصه خبر (کوتاه برای کارت‌ها)
            </label>
            <textarea
              rows={2}
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="یک یا دو خط خلاصه برای نمایش در پیش‌نمایش کارت‌ها..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              متن کامل خبر *
            </label>
            <textarea
              rows={6}
              required
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="متن کامل گزارش یا اطلاعیه..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'در حال ثبت...' : editingPost ? 'به‌روزرسانی خبر' : 'انتشار خبر'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Modal: Preview Post */}
      <Modal
        isOpen={!!previewPost}
        onClose={() => setPreviewPost(null)}
        title="پیش‌نمایش انتشار خبر"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-sky-600 font-semibold bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 rounded-lg">
              {categoryLabels[previewPost?.category]}
            </span>
            <span className="text-slate-400 font-mono">
              {previewPost && new Date(previewPost.publish_at).toLocaleDateString('fa-IR')}
            </span>
          </div>

          <h2 className="text-base font-bold text-slate-900 dark:text-white leading-relaxed">
            {previewPost?.title}
          </h2>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {previewPost?.body}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setPreviewPost(null)}>
              بستن پیش‌نمایش
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
