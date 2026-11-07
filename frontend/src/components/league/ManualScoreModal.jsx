import React, { useState, useEffect } from 'react';
import { Award, Plus } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

export const ManualScoreModal = ({
  isOpen,
  onClose,
  leagueId,
  selectedSwimmer = null,
  availableSwimmers = [],
  onSuccess,
}) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    swimmer_id: '',
    score_points: '',
    event_name: 'امتیاز ویژه / تشویقی مدیر آموزشگاه',
    notes: '',
  });

  useEffect(() => {
    if (selectedSwimmer) {
      setFormData((prev) => ({
        ...prev,
        swimmer_id: selectedSwimmer.id,
      }));
    } else if (availableSwimmers.length > 0) {
      setFormData((prev) => ({
        ...prev,
        swimmer_id: prev.swimmer_id || availableSwimmers[0].id,
      }));
    }
  }, [selectedSwimmer, availableSwimmers, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.swimmer_id || formData.score_points === '') {
      toast.error('لطفاً شناگر و مقدار امتیاز را تعیین کنید.');
      return;
    }

    try {
      setLoading(true);
      await api.post(`/leagues/${leagueId}/manual_score/`, {
        swimmer_id: Number(formData.swimmer_id),
        score_points: Number(formData.score_points),
        event_name: formData.event_name,
        notes: formData.notes,
      });

      toast.success('امتیاز دستی با موفقیت ثبت شد و به مجموع امتیازات اضافه گردید.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('خطا در ثبت امتیاز دستی');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ثبت امتیاز دستی / تشویقی شناگر"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Swimmer Select */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 dark:text-slate-300 block">
            شناگر دریافت‌کننده امتیاز *
          </label>
          <select
            value={formData.swimmer_id}
            onChange={(e) => setFormData((p) => ({ ...p, swimmer_id: e.target.value }))}
            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">انتخاب شناگر...</option>
            {availableSwimmers.map((sw) => (
              <option key={sw.id} value={sw.id}>
                {sw.full_name} ({sw.gender === 'FEMALE' ? 'دختر' : 'پسر'})
              </option>
            ))}
          </select>
        </div>

        {/* Score Points */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 dark:text-slate-300 block">
            مقدار امتیاز (مثبت یا منفی) *
          </label>
          <input
            type="number"
            step="0.5"
            placeholder="مثال: 5 یا -2"
            value={formData.score_points}
            onChange={(e) => setFormData((p) => ({ ...p, score_points: e.target.value }))}
            required
            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Event Name */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 dark:text-slate-300 block">
            عنوان رویداد / عنوان امتیاز *
          </label>
          <input
            type="text"
            value={formData.event_name}
            onChange={(e) => setFormData((p) => ({ ...p, event_name: e.target.value }))}
            placeholder="مثال: امتیاز تشویقی انضباط و رکوردشکنی"
            required
            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 dark:text-slate-300 block">
            شرح علت / یادداشت داوری
          </label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
            placeholder="توضیح دلیل تخصیص این امتیاز برای شفافیت در کارنامه..."
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
            {loading ? 'در حال ثبت...' : 'ثبت امتیاز'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
