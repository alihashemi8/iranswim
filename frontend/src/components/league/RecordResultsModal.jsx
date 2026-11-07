import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Trash2, Clock, Check, AlertCircle, Medal } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

export const RecordResultsModal = ({
  isOpen,
  onClose,
  competition,
  leagueScoringRules,
  availableSwimmers = [],
  onSuccess,
}) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!isOpen || !competition) return;

    // If competition already has results, load them
    if (competition.results && competition.results.length > 0) {
      setRows(
        competition.results.map((r) => ({
          swimmer_id: r.swimmer_id,
          swimmer_name: r.swimmer_name,
          duration_seconds: r.duration_seconds !== null ? String(r.duration_seconds) : '',
          notes: r.notes || '',
        }))
      );
    } else {
      // Pre-fill with first 6 available swimmers for quick recording
      const initial = (availableSwimmers || []).slice(0, 6).map((sw) => ({
        swimmer_id: sw.id,
        swimmer_name: sw.full_name,
        duration_seconds: '',
        notes: '',
      }));
      setRows(initial.length > 0 ? initial : [{ swimmer_id: '', swimmer_name: '', duration_seconds: '', notes: '' }]);
    }
  }, [isOpen, competition, availableSwimmers]);

  const handleRowChange = (index, field, value) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      if (field === 'swimmer_id') {
        const found = availableSwimmers.find((s) => String(s.id) === String(value));
        if (found) copy[index].swimmer_name = found.full_name;
      }
      return copy;
    });
  };

  const addRow = () => {
    setRows((prev) => [...prev, { swimmer_id: '', swimmer_name: '', duration_seconds: '', notes: '' }]);
  };

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculate live preview ranks
  const sortedPreviews = [...rows]
    .filter((r) => r.swimmer_id && r.duration_seconds && !isNaN(Number(r.duration_seconds)) && Number(r.duration_seconds) > 0)
    .sort((a, b) => Number(a.duration_seconds) - Number(b.duration_seconds));

  const getRankAndPoints = (swimmerId) => {
    const idx = sortedPreviews.findIndex((r) => String(r.swimmer_id) === String(swimmerId));
    if (idx === -1) return null;
    const rank = idx + 1;
    let pts = 1;
    let medal = null;

    const rules = leagueScoringRules || {};
    if (rank === 1) {
      pts = rules.rank_1 ?? 10;
      medal = '🥇 طلا';
    } else if (rank === 2) {
      pts = rules.rank_2 ?? 7;
      medal = '🥈 نقره';
    } else if (rank === 3) {
      pts = rules.rank_3 ?? 5;
      medal = '🥉 برنز';
    } else if (rank === 4) {
      pts = rules.rank_4 ?? 3;
    } else if (rank === 5) {
      pts = rules.rank_5 ?? 2;
    } else {
      pts = rules.participation ?? 1;
    }

    return { rank, pts, medal };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!competition) return;

    const validRows = rows.filter(
      (r) => r.swimmer_id && r.duration_seconds && !isNaN(Number(r.duration_seconds)) && Number(r.duration_seconds) > 0
    );

    if (validRows.length === 0) {
      toast.error('حداقل باید زمان یک شناگر را به صورت عدد ثانیه وارد نمایید.');
      return;
    }

    try {
      setLoading(true);
      await api.post(`/leagues/competitions/${competition.id}/record_results/`, {
        results: validRows.map((r) => ({
          swimmer_id: Number(r.swimmer_id),
          duration_seconds: Number(r.duration_seconds),
          notes: r.notes || '',
        })),
      });

      toast.success('نتایج مسابقه با موفقیت ثبت شد و جدول لیگ به‌روزرسانی گردید.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('خطا در ثبت نتایج مسابقه');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !competition) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`ثبت زمان‌ها و نتایج: ${competition.title}`}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {/* Banner with rules info */}
        <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 p-3.5 rounded-xl flex items-center justify-between gap-3 text-amber-950 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <span className="font-bold block">
                {competition.stroke_display} {competition.distance_meters} متر ({new Date(competition.held_at).toLocaleDateString('fa-IR')})
              </span>
              <span className="text-[11px] text-amber-800 dark:text-amber-300">
                رتبه‌بندی بر اساس کمترین زمان (ثانیه) به صورت خودکار محاسبه و امتیازدهی می‌شود.
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRow}
            className="gap-1 text-xs bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>افزودن خط/شناگر</span>
          </Button>
        </div>

        {/* Dynamic Swimmer Time Rows */}
        <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
          {rows.map((row, idx) => {
            const preview = getRankAndPoints(row.swimmer_id);

            return (
              <div
                key={idx}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-2.5 transition-all"
              >
                {/* Lane / Index */}
                <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-mono font-bold text-slate-700 dark:text-slate-300 text-xs shrink-0">
                  {idx + 1}
                </div>

                {/* Swimmer Select */}
                <div className="flex-1 min-w-[180px] w-full sm:w-auto">
                  <select
                    value={row.swimmer_id}
                    onChange={(e) => handleRowChange(idx, 'swimmer_id', e.target.value)}
                    className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">انتخاب شناگر...</option>
                    {availableSwimmers.map((sw) => (
                      <option key={sw.id} value={sw.id}>
                        {sw.full_name} ({sw.gender === 'FEMALE' ? 'دختر' : 'پسر'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration Input */}
                <div className="w-full sm:w-36 flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="600"
                    placeholder="مثال: 27.85"
                    value={row.duration_seconds}
                    onChange={(e) => handleRowChange(idx, 'duration_seconds', e.target.value)}
                    className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-mono text-center font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[11px] text-slate-400 shrink-0">ثانیه</span>
                </div>

                {/* Rank & Points Preview Pill */}
                <div className="w-full sm:w-36 flex items-center justify-center sm:justify-start gap-1.5 shrink-0 text-center sm:text-right">
                  {preview ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-[11px] font-bold text-amber-900 dark:text-amber-200 font-mono">
                      <span>رتبه {preview.rank}</span>
                      {preview.medal && <span>{preview.medal}</span>}
                      <span className="text-amber-700 dark:text-amber-400">+{preview.pts}pt</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">در انتظار تایم</span>
                  )}
                </div>

                {/* Notes Input */}
                <div className="flex-1 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="یادداشت داوری..."
                    value={row.notes}
                    onChange={(e) => handleRowChange(idx, 'notes', e.target.value)}
                    className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Remove row */}
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                  title="حذف این سطر"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-3">
          <span className="text-xs text-slate-500">
            تعداد رکوردهای معتبر: <strong className="font-mono text-slate-800 dark:text-slate-200">{sortedPreviews.length}</strong> شناگر
          </span>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              انصراف
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
            >
              {loading ? 'در حال ثبت و محاسبه امتیازات...' : 'ثبت قطعی نتایج و امتیازدهی لیگ'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
