import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

export const CompetitionModal = ({
  isOpen,
  onClose,
  leagueId,
  categories = [],
  initialData = null,
  onSuccess,
}) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    stroke: 'FREESTYLE',
    distance_meters: 50,
    category: '',
    gender: 'ALL',
    held_at: '',
    location: 'استخر اصلی آکادمی',
    status: 'SCHEDULED',
    notes: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        stroke: initialData.stroke || 'FREESTYLE',
        distance_meters: initialData.distance_meters || 50,
        category: initialData.category || '',
        gender: initialData.gender || 'ALL',
        held_at: initialData.held_at || '',
        location: initialData.location || 'استخر اصلی آکادمی',
        status: initialData.status || 'SCHEDULED',
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        title: '',
        stroke: 'FREESTYLE',
        distance_meters: 50,
        category: categories.length > 0 ? categories[0].id : '',
        gender: 'ALL',
        held_at: new Date().toISOString().split('T')[0],
        location: 'استخر اصلی آکادمی',
        status: 'SCHEDULED',
        notes: '',
      });
    }
  }, [initialData, isOpen, categories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.held_at) {
      toast.error('لطفاً عنوان مسابقه و تاریخ برگزاری را وارد نمایید.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        category: formData.category ? Number(formData.category) : null,
        distance_meters: Number(formData.distance_meters),
      };

      if (initialData?.id) {
        await api.patch(`/leagues/competitions/${initialData.id}/`, payload);
        toast.success('اطلاعات مسابقه با موفقیت ویرایش شد.');
      } else {
        await api.post(`/leagues/${leagueId}/competitions/`, payload);
        toast.success('مسابقه جدید با موفقیت به تقویم لیگ افزوده شد.');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('خطا در ذخیره‌سازی مسابقه');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'ویرایش رویداد مسابقه' : 'تعریف مسابقه / رویداد جدید'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Title */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 dark:text-slate-300 block">
            عنوان رویداد مسابقه *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="مثال: مسابقه 50 متر کرال سینه انتخابی باشگاه"
            required
            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Stroke and Distance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 block">
              ماده شنا *
            </label>
            <select
              name="stroke"
              value={formData.stroke}
              onChange={handleChange}
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="FREESTYLE">شنای آزاد (کرال سینه)</option>
              <option value="BACKSTROKE">شنای کرال پشت</option>
              <option value="BREASTSTROKE">شنای قورباغه</option>
              <option value="BUTTERFLY">شنای پروانه</option>
              <option value="MEDLEY">شنای مختلط انفرادی</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 block">
              مسافت (متر) *
            </label>
            <select
              name="distance_meters"
              value={formData.distance_meters}
              onChange={handleChange}
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="25">25 متر</option>
              <option value="50">50 متر</option>
              <option value="100">100 متر</option>
              <option value="200">200 متر</option>
              <option value="400">400 متر</option>
            </select>
          </div>
        </div>

        {/* Category & Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 block">
              رده مسابقاتی مجاز
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">عمومی / تمام رده‌های سنی</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.title} ({cat.age_min} تا {cat.age_max} سال)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 block">
              جنسیت رقابت *
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">مختلط / عمومی</option>
              <option value="MALE">پسران</option>
              <option value="FEMALE">دختران</option>
            </select>
          </div>
        </div>

        {/* Date & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 block">
              تاریخ برگزاری *
            </label>
            <input
              type="date"
              name="held_at"
              value={formData.held_at}
              onChange={handleChange}
              required
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 block">
              محل استخر / موقعیت
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="مثال: استخر قهرمانی آزادی"
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 dark:text-slate-300 block">
            وضعیت برگزاری
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="SCHEDULED">برنامه‌ریزی‌شده (پیش‌رو)</option>
            <option value="IN_PROGRESS">در حال برگزاری</option>
            <option value="COMPLETED">پایان‌یافته و ثبت نتایج</option>
            <option value="CANCELLED">لغوشده</option>
          </select>
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 dark:text-slate-300 block">
            توضیحات و شرایط مسابقه
          </label>
          <textarea
            name="notes"
            rows={2}
            value={formData.notes}
            onChange={handleChange}
            placeholder="شرایط ورودی، قوانین ویژه، تجهیزات مورد نیاز..."
            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            انصراف
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
          >
            {loading ? 'در حال ثبت...' : initialData ? 'به‌روزرسانی مسابقه' : 'ایجاد مسابقه'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
