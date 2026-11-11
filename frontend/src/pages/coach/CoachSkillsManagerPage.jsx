import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, Plus, Trash2, Edit3, Check, X,
  ArrowRight, ChevronRight, Sparkles, Download, AlertTriangle,
  Search, CheckCircle2
} from 'lucide-react';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { BackButton } from '../../components/common/BackButton';
import { useToast } from '../../context/ToastContext';

export const CoachSkillsManagerPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const returnTo = searchParams.get('returnTo') || '/coach/progress';

  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Add new skill form state
  const [newName, setNewName] = useState('');
  const [newCriteria, setNewCriteria] = useState('');
  const [addingSkill, setAddingSkill] = useState(false);
  const [importingDefaults, setImportingDefaults] = useState(false);

  // Edit skill inline state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCriteria, setEditCriteria] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // In-app delete confirmation state (NO window.confirm!)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch coach's custom skills
  const loadSkills = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/education/skills/');
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setSkills(data);
    } catch (err) {
      console.error('Error fetching coach skills:', err);
      toast.error('خطا در دریافت سرفصل‌های ارزیابی مربی');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  // 1. ADD NEW SKILL
  const handleAddSkill = async (e) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error('لطفاً عنوان یا متن سرفصل ارزیابی را وارد نمایید.');
      return;
    }

    try {
      setAddingSkill(true);
      const res = await api.post('/education/skills/', {
        name: trimmed,
        criteria_description: newCriteria.trim(),
      });
      setSkills((prev) => [res.data, ...prev]);
      setNewName('');
      setNewCriteria('');
      toast.success('سرفصل ارزیابی جدید با موفقیت ذخیره شد و در تمامی کلاس‌ها در دسترس است.');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.name?.[0] || 'خطا در ثبت سرفصل ارزیابی');
    } finally {
      setAddingSkill(false);
    }
  };

  // 2. IMPORT STARTER DEFAULTS
  const handleImportDefaults = async () => {
    try {
      setImportingDefaults(true);
      const res = await api.post('/education/skills/import-defaults/');
      const imported = res.data?.skills || [];
      if (imported.length > 0) {
        setSkills(imported);
        toast.success(res.data?.message || 'سرفصل‌های پرکاربرد به لیست شما اضافه شدند.');
      } else {
        toast.info('تمامی سرفصل‌های پایه قبلاً در لیست شما ثبت شده‌اند.');
      }
    } catch (err) {
      console.error(err);
      toast.error('خطا در درون‌ریزی سرفصل‌های پایه');
    } finally {
      setImportingDefaults(false);
    }
  };

  // 3. START EDITING
  const handleStartEdit = (sk) => {
    setEditingId(sk.id);
    setEditName(sk.name);
    setEditCriteria(sk.criteria_description || '');
    setDeleteConfirmId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditCriteria('');
  };

  // 4. SAVE EDIT
  const handleSaveEdit = async (skId) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      toast.error('عنوان سرفصل نمی‌تواند خالی باشد.');
      return;
    }

    try {
      setSavingEdit(true);
      const res = await api.patch(`/education/skills/${skId}/`, {
        name: trimmed,
        criteria_description: editCriteria.trim(),
      });

      setSkills((prev) =>
        prev.map((item) => (item.id === skId ? res.data : item))
      );
      setEditingId(null);
      toast.success('تغییرات سرفصل ارزیابی با موفقیت ذخیره شد.');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.name?.[0] || 'خطا در ویرایش سرفصل ارزیابی');
    } finally {
      setSavingEdit(false);
    }
  };

  // 5. DELETE SKILL (Using In-App UI Confirmation, NO window.confirm!)
  const handleExecuteDelete = async (skId) => {
    try {
      setDeletingId(skId);
      await api.delete(`/education/skills/${skId}/`);
      setSkills((prev) => prev.filter((item) => item.id !== skId));
      setDeleteConfirmId(null);
      toast.success('سرفصل ارزیابی با موفقیت حذف شد.');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در حذف سرفصل ارزیابی');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter skills by search query
  const filteredSkills = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return skills;
    return skills.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.criteria_description?.toLowerCase().includes(q)
    );
  }, [skills, searchTerm]);

  if (loading) {
    return <LoadingState type="dashboard" message="در حال دریافت سرفصل‌های ارزیابی..." />;
  }

  return (
    <div className="coach-panel space-y-6 pb-16 max-w-5xl mx-auto">
      {/* 1. Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <BackButton to={returnTo} title="بازگشت به صفحه قبل" className="mt-0.5 sm:mt-0" />
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <Link
                to="/coach/progress"
                className="hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold transition-colors"
              >
                ارزیابی و پیشرفت شناگران
              </Link>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold">
                مدیریت سرفصل‌های ارزیابی
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>مدیریت سرفصل‌ها و معیارهای ارزیابی مربی</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              سرفصل‌های نوشته‌شده در این صفحه در دراپ‌داون ارزیابی تمامی کلاس‌ها و دوره‌ها مشترک خواهند بود.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Top Card: Add New Skill Form */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>افزودن سرفصل ارزیابی جدید</span>
          </h2>
          <span className="text-xs text-slate-400">
            برای استفاده در دراپ‌داون ارزیابی
          </span>
        </div>

        <form onSubmit={handleAddSkill} className="space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                عنوان / متن ارزیابی <span className="text-rose-500">*</span>:
              </label>
              <input
                type="text"
                placeholder="مثال: پای کرال سینه با تخته شنا ۲۵ متر..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full min-h-[44px] rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                معیار سنجش و قبولی (اختیاری):
              </label>
              <input
                type="text"
                placeholder="مثال: حرکت شلاقی مچ پا با زانوی کشیده بدون توقف..."
                value={newCriteria}
                onChange={(e) => setNewCriteria(e.target.value)}
                className="w-full min-h-[44px] rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={handleImportDefaults}
              disabled={importingDefaults}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{importingDefaults ? 'در حال افزودن...' : 'درون‌ریزی سرفصل‌های پرکاربرد شنا به عنوان نمونه'}</span>
            </button>

            <Button
              type="submit"
              variant="success"
              size="md"
              loading={addingSkill}
              className="font-bold text-xs sm:text-sm px-5 py-2.5 cursor-pointer shadow-xs gap-1.5"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>افزودن به دراپ‌داون سرفصل‌ها</span>
            </Button>
          </div>
        </form>
      </div>

      {/* 3. Main List: Manage Existing Skills (Add / Edit / Delete in ONE page!) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              سرفصل‌های تعریف‌شده شما
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-mono font-bold">
              {skills.length} سرفصل
            </span>
          </div>

          {skills.length > 3 && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="جستجو در سرفصل‌ها..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full min-h-[38px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 pr-9 pl-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
              />
            </div>
          )}
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredSkills.length > 0 ? (
            filteredSkills.map((sk) => {
              const isEditing = editingId === sk.id;
              const isConfirmingDelete = deleteConfirmId === sk.id;

              return (
                <div
                  key={sk.id}
                  className="p-4 sm:p-5 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                >
                  {isEditing ? (
                    /* Inline Edit Mode */
                    <div className="space-y-3 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 animate-fadeIn">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        <span>ویرایش سرفصل ارزیابی</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="عنوان ارزیابی..."
                          className="w-full min-h-[40px] rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <input
                          type="text"
                          value={editCriteria}
                          onChange={(e) => setEditCriteria(e.target.value)}
                          placeholder="معیار سنجش و قبولی..."
                          className="w-full min-h-[40px] rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          انصراف
                        </button>
                        <Button
                          type="button"
                          variant="success"
                          size="sm"
                          loading={savingEdit}
                          onClick={() => handleSaveEdit(sk.id)}
                          className="gap-1.5 text-xs font-bold px-4 py-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>ذخیره تغییرات</span>
                        </Button>
                      </div>
                    </div>
                  ) : isConfirmingDelete ? (
                    /* In-App Delete Confirmation (NO window.confirm!) */
                    <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/80 space-y-2.5 animate-fadeIn">
                      <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 text-xs sm:text-sm font-bold">
                        <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span>آیا از حذف سرفصل «{sk.name}» اطمینان دارید؟</span>
                      </div>
                      <p className="text-xs text-rose-700/80 dark:text-rose-300/80 leading-relaxed">
                        با حذف این سرفصل، از دراپ‌داون ارزیابی تمام کلاس‌های شما حذف خواهد شد.
                      </p>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          انصراف
                        </button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          loading={deletingId === sk.id}
                          onClick={() => handleExecuteDelete(sk.id)}
                          className="gap-1 text-xs font-bold px-4 py-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>بله، حذف شود</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Normal Skill Row */
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white block">
                          {sk.name}
                        </span>
                        {sk.criteria_description ? (
                          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                            معیار سنجش: {sk.criteria_description}
                          </p>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            بدون توضیحات معیار سنجش
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pt-2 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(sk)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                          title="ویرایش سرفصل"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>ویرایش</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirmId(sk.id);
                            setEditingId(null);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/80 transition-colors cursor-pointer"
                          title="حذف سرفصل"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 px-4 space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-300">
                {searchTerm ? 'هیچ سرفصلی مطابق عبارت جستجو یافت نشد.' : 'هنوز سرفصلی توسط شما تعریف نشده است.'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                از فرم بالای همین صفحه برای افزودن اولین سرفصل استفاده کنید تا در دراپ‌داون ارزیابی تمامی کلاس‌ها قرار گیرد.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
