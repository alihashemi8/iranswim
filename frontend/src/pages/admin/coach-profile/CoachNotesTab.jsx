import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Plus, AlertTriangle, Award, ShieldAlert, AlertCircle,
  Download, Calendar, User, Shield
} from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { useToast } from '../../../context/ToastContext';
import api from '../../../api/client';

export const CoachNotesTab = ({ coach, notes, onNotesUpdated }) => {
  const navigate = useNavigate();
  const toast = useToast();

  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [noteForm, setNoteForm] = useState({
    category: 'NOTE',
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    severity: 'INFO',
    is_confidential: false,
  });
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitNote = async (e) => {
    e.preventDefault();
    if (!noteForm.title.trim() || !noteForm.description.trim()) {
      toast.error('عنوان و شرح کامل یادداشت الزامی است.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('category', noteForm.category);
      formData.append('title', noteForm.title.trim());
      formData.append('description', noteForm.description.trim());
      formData.append('date', noteForm.date);
      formData.append('severity', noteForm.severity);
      formData.append('is_confidential', noteForm.is_confidential);
      if (attachmentFile) formData.append('attachment', attachmentFile);

      await api.post(`/coaches/${coach.id}/administrative-notes/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('یادداشت اداری با موفقیت ثبت شد.');
      setIsAddNoteModalOpen(false);
      setNoteForm({
        category: 'NOTE',
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        severity: 'INFO',
        is_confidential: false,
      });
      setAttachmentFile(null);
      if (onNotesUpdated) onNotesUpdated();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت یادداشت اداری');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600" />
            مکاتبات اداری، تذکرات، اخطارها و تقدیرنامه‌ها
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            ثبت انضباطی، گزارش وقایع، تشویق‌ها و یادداشت‌های پرونده پرسنلی
          </p>
        </div>

        <Button
          onClick={() => navigate(`/admin/coaches/${coach.id}/notes/new`)}
          className="gap-1.5 text-xs bg-sky-600 hover:bg-sky-500 text-white shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت مورد اداری جدید</span>
        </Button>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {notes.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center text-slate-400 text-xs">
            هیچ یادداشت، اخطار یا تشویقی در پرونده این مربی ثبت نشده است.
          </div>
        ) : (
          notes.map((note) => {
            const isWarning = note.category === 'WARNING';
            const isCommendation = note.category === 'COMMENDATION';
            const isIncident = note.category === 'INCIDENT';

            return (
              <div
                key={note.id}
                className={`p-5 rounded-2xl border transition-all text-xs space-y-3 ${
                  isWarning
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                    : isCommendation
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                    : isIncident
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    {isWarning && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                    {isCommendation && <Award className="w-4 h-4 text-emerald-600" />}
                    {isIncident && <ShieldAlert className="w-4 h-4 text-amber-600" />}
                    {!isWarning && !isCommendation && !isIncident && <FileText className="w-4 h-4 text-sky-600" />}

                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {note.title}
                    </h4>

                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isWarning ? 'bg-rose-100 text-rose-800' : isCommendation ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {note.category_display}
                    </span>

                    {note.is_confidential && (
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono">
                        محرمانه
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                    <span>تاریخ: {new Date(note.date).toLocaleDateString('fa-IR')}</span>
                    <span>•</span>
                    <span>ثبت توسط: {note.created_by_name || 'مدیر آموزشگاه'}</span>
                  </div>
                </div>

                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {note.description}
                </p>

                {note.attachment_url && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <a
                      href={note.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-sky-600 hover:text-sky-700 font-semibold inline-flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>دانلود سند / مستندات پیوست</span>
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
