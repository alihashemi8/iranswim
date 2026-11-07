import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

export const LeagueSeasonModal = ({
  isOpen,
  onClose,
  initialData = null,
  onSuccess,
}) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    season: '',
    starts_at: '',
    ends_at: '',
    status: 'ACTIVE',
    rules_description: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        season: initialData.season || '',
        starts_at: initialData.starts_at || '',
        ends_at: initialData.ends_at || '',
        status: initialData.status || 'ACTIVE',
        rules_description: initialData.rules_description || '',
      });
    } else {
      setFormData({
        name: '',
        season: '',
        starts_at: new Date().toISOString().split('T')[0],
        ends_at: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
        status: 'ACTIVE',
        rules_description: 'محاسبه امتیازات حاصل از پیشرفت مهارتی و رکوردهای زمانی رسمی، رده‌های سنی و جدول زنده برترین‌ها',
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.season || !formData.starts_at || !formData.ends_at) {
      toast.error('لطفاً عنوان دوره، فصل و تاریخ‌های برگزاری را وارد نمایید.');
      return;
    }

    try {
      setLoading(true);
      if (initialData?.id) {
        await api.patch(`/leagues/${initialData.id}/`, formData);
        toast.success('اطلاعات دوره لیگ با موفقیت به‌روزرسانی شد.');
      } else {
        await api.post('/leagues/', formData);
        toast.success('دوره مسابقاتی جدید با موفقیت ایجاد گردید.');
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('خطا در ذخیره‌سازی اطلاعات دوره لیگ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'ویرایش اطلاعات فصل لیگ' : 'تعریف دوره / فصل مسابقاتی جدید'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Name */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 dark:text-slate-300 block">
            عنوان دوره لیگ *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="مثال: لیگ فصلی ستارگان شنای ایران"
            required
            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Season & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 block">
              فصل / بازه زمانی *
            </label>
            <input
              type="text"
              name="season"
              value={formData.season}
              onChange={handleChange}
              placeholder="مثال: زمستان ۱۴۰۵ یا بهار ۱۴۰۶"
              required
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 block">
              وضعیت فصل *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ACTIVE">فعال و در جریان</option>
              <option value="DRAFT">پیش‌نویس</option>
              <option value="COMPLETED">پایان‌یافته / آرشیو</option>
            </select>
          </div>
        </div>

        {/* Start and End Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 block">
              تاریخ آغاز لیگ *
            </label>
            <input
              type="date"
              name="starts_at"
              value={formData.starts_at}
              onChange={handleChange}
              required
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 block">
              تاریخ پایان لیگ *
            </label>
            <input
              type="date"
              name="ends_at"
              value={formData.ends_at}
              onChange={handleChange}
              required
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Rules description */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 dark:text-slate-300 block">
            شرح قوانین و نحوه امتیازدهی
          </label>
          <textarea
            name="rules_description"
            rows={3}
            value={formData.rules_description}
            onChange={handleChange}
            placeholder="توضیحات کلی فرمول امتیازدهی و شرایط شرکت‌کنندگان..."
            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            انصراف
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
          >
            {loading ? 'در حال ثبت...' : initialData ? 'به‌روزرسانی دوره' : 'ایجاد دوره مسابقاتی'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
