import React, { useState, useEffect } from 'react';
import {
  Award, Clock, CheckCircle, XCircle, Filter, Plus,
  Search, ShieldCheck, AlertCircle, FileSpreadsheet, Eye
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { exportToCsv } from '../../utils/exportCsv';

export const AdminAssessmentsPage = () => {
  const [activeTab, setActiveTab] = useState('RECORDS'); // RECORDS, ASSESSMENTS, SKILLS
  const [records, setRecords] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [levels, setLevels] = useState([]);
  const [swimmers, setSwimmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Verify Record Modal
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [verifying, setVerifying] = useState(false);

  // New Skill Assessment Modal
  const [isNewAssessModalOpen, setIsNewAssessModalOpen] = useState(false);
  const [assessForm, setAssessForm] = useState({
    swimmer: '',
    skill: '',
    score: 100,
    status: 'PASSED',
    feedback: '',
    assessed_at: new Date().toISOString().split('T')[0],
  });
  const [submittingAssess, setSubmittingAssess] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recordsRes, assessRes, levelsRes, swimmersRes] = await Promise.all([
        api.get('/assessments/records/'),
        api.get('/assessments/skills/'),
        api.get('/education/levels/'),
        api.get('/swimmers/'),
      ]);
      setRecords(recordsRes.data.results || recordsRes.data);
      setAssessments(assessRes.data.results || assessRes.data);
      setLevels(levelsRes.data.results || levelsRes.data);
      setSwimmers(swimmersRes.data.results || swimmersRes.data);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت اطلاعات ارزیابی و رکوردهای شنا');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Verify or Reject Record
  const handleVerifyDecision = async (action) => {
    if (!selectedRecord) return;
    try {
      setVerifying(true);
      await api.post(`/assessments/records/${selectedRecord.id}/verify/`, {
        action,
        reason: rejectReason,
      });
      toast.success(
        action === 'VERIFY'
          ? 'رکورد شنا با موفقیت تأیید رسمی گردید و در لیگ ثبت شد.'
          : 'رکورد زمانی رد شد.'
      );
      setSelectedRecord(null);
      setRejectReason('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در ثبت تصمیم تأیید رکورد');
    } finally {
      setVerifying(false);
    }
  };

  // Submit New Skill Assessment
  const handleCreateAssessment = async (e) => {
    e.preventDefault();
    if (!assessForm.swimmer || !assessForm.skill) {
      toast.error('لطفاً شناگر و مهارت را مشخص کنید.');
      return;
    }
    try {
      setSubmittingAssess(true);
      await api.post('/assessments/skills/', assessForm);
      toast.success('ارزیابی مهارتی جدید با موفقیت ثبت شد.');
      setIsNewAssessModalOpen(false);
      setAssessForm({
        swimmer: '',
        skill: '',
        score: 100,
        status: 'PASSED',
        feedback: '',
        assessed_at: new Date().toISOString().split('T')[0],
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در ثبت ارزیابی');
    } finally {
      setSubmittingAssess(false);
    }
  };

  // Flatten all skills from levels
  const allSkills = levels.flatMap((lvl) => lvl.skills || []);

  const strokeLabels = {
    FREESTYLE: 'کرال سینه (آزاد)',
    BACKSTROKE: 'کرال پشت',
    BREASTSTROKE: 'شنای قورباغه',
    BUTTERFLY: 'شنای پروانه',
    MEDLEY: 'مختلط انفرادی',
  };

  const handleExportCsv = () => {
    const rows = records.map((r) => ({
      swimmer: r.swimmer_name,
      stroke: strokeLabels[r.stroke] || r.stroke,
      distance: `${r.distance_meters} متر`,
      time: `${r.duration_seconds} ثانیه`,
      date: new Date(r.recorded_at).toLocaleDateString('fa-IR'),
      status: r.verification_status === 'VERIFIED' ? 'تأییدشده رسمی' : r.verification_status === 'PENDING' ? 'در انتظار بررسی' : 'رد شده',
    }));
    exportToCsv('IranSwim_Swimming_Records', rows, {
      swimmer: 'شناگر',
      stroke: 'ماده / سبک شنا',
      distance: 'مسافت',
      time: 'زمان ثبت‌شده',
      date: 'تاریخ ثبت',
      status: 'وضعیت تأیید',
    });
  };

  const pendingRecordsCount = records.filter((r) => r.verification_status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-sky-600" />
            ارزیابی مهارت‌های آموزشی و رکوردهای زمانی شنا
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            پایش پیشرفت تکنیکی شناگران، سنجش سرفصل‌ها و اعتبارسنجی رسمی رکوردهای استخری
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={handleExportCsv} className="gap-1.5 text-xs">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>خروجی اکسل رکوردها</span>
          </Button>
          <Button onClick={() => setIsNewAssessModalOpen(true)} className="gap-1.5 text-xs">
            <Plus className="w-4 h-4" />
            <span>ثبت ارزیابی مهارتی جدید</span>
          </Button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700 text-xs w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('RECORDS')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'RECORDS'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <span>رکوردهای زمانی شنا</span>
          {pendingRecordsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-mono">
              {pendingRecordsCount} نیازمند تأیید
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ASSESSMENTS')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer ${
            activeTab === 'ASSESSMENTS'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          سوابق ارزیابی مهارتی ({assessments.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('SKILLS')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer ${
            activeTab === 'SKILLS'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          سرفصل‌های مهارتی سطوح ({allSkills.length})
        </button>
      </div>

      {loading ? (
        <LoadingState type="table" rows={6} message="در حال بارگذاری اطلاعات ارزیابی..." />
      ) : activeTab === 'RECORDS' ? (
        /* TAB 1: SWIMMING RECORDS */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-right min-w-[640px]">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 rounded-r-xl">شناگر</th>
                  <th className="px-4 py-3.5">ماده و مسافت</th>
                  <th className="px-4 py-3.5">زمان ثبت‌شده</th>
                  <th className="px-4 py-3.5">نوع استخر</th>
                  <th className="px-4 py-3.5">تاریخ ثبت</th>
                  <th className="px-4 py-3.5">وضعیت تأیید</th>
                  <th className="px-4 py-3.5 text-center rounded-l-xl">بررسی داوری / تأیید</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-100">
                      {rec.swimmer_name}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300">
                      {rec.distance_meters} متر {strokeLabels[rec.stroke] || rec.stroke}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-sky-600 dark:text-sky-400">
                      {rec.duration_seconds} ثانیه
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                      {rec.pool_course === 'SHORT_25M' ? 'استخر ۲۵ متر' : 'استخر ۵۰ متر المپیک'}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {new Date(rec.recorded_at).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          rec.verification_status === 'VERIFIED'
                            ? 'success'
                            : rec.verification_status === 'PENDING'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {rec.verification_status === 'VERIFIED'
                          ? 'تأیید رسمی'
                          : rec.verification_status === 'PENDING'
                          ? 'در انتظار بررسی'
                          : 'رد شده'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {rec.verification_status === 'PENDING' ? (
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(rec)}
                          className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 font-semibold text-xs border border-amber-200 dark:border-amber-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                          <span>بررسی و تأیید</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono">
                          {rec.verification_status === 'VERIFIED' ? 'تأییدشده ✓' : 'رد شده ✕'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {records.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3 text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {rec.swimmer_name}
                    </h3>
                    <span className="text-slate-500 dark:text-slate-400 text-xs block mt-0.5">
                      {rec.distance_meters} متر {strokeLabels[rec.stroke] || rec.stroke}
                    </span>
                  </div>
                  <Badge
                    variant={
                      rec.verification_status === 'VERIFIED'
                        ? 'success'
                        : rec.verification_status === 'PENDING'
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {rec.verification_status === 'VERIFIED'
                      ? 'تأیید رسمی'
                      : rec.verification_status === 'PENDING'
                      ? 'در انتظار بررسی'
                      : 'رد شده'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[10px]">زمان رکورد</span>
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-sm">
                      {rec.duration_seconds} ثانیه
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">نوع استخر</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {rec.pool_course === 'SHORT_25M' ? '۲۵ متر' : '۵۰ متر'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">تاریخ ثبت</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">
                      {new Date(rec.recorded_at).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                </div>

                {rec.verification_status === 'PENDING' && (
                  <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                    <button
                      type="button"
                      onClick={() => setSelectedRecord(rec)}
                      className="w-full py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 font-semibold border border-amber-200 dark:border-amber-800 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>بررسی و تأیید رکورد داوری</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'ASSESSMENTS' ? (
        /* TAB 2: SKILL ASSESSMENTS */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 rounded-r-xl">شناگر</th>
                  <th className="px-4 py-3.5">آیتم مهارتی ارزیابی‌شده</th>
                  <th className="px-4 py-3.5">سطح آموزشی</th>
                  <th className="px-4 py-3.5">نتیجه</th>
                  <th className="px-4 py-3.5">نمره ارزیابی</th>
                  <th className="px-4 py-3.5">توضیحات و بازخورد</th>
                  <th className="px-4 py-3.5 rounded-l-xl">تاریخ ارزیابی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {assessments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-100">
                      {a.swimmer_name}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                      {a.skill_name}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                      {a.level_name}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={a.status === 'PASSED' ? 'success' : a.status === 'IN_PROGRESS' ? 'warning' : 'danger'}>
                        {a.status === 'PASSED' ? 'قبول / تسلط کامل' : a.status === 'IN_PROGRESS' ? 'در حال تمرین' : 'نیاز به تمرین'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      {a.score} از ۱۰۰
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                      {a.feedback || '—'}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {new Date(a.assessed_at).toLocaleDateString('fa-IR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {assessments.map((a) => (
              <div
                key={a.id}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3 text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {a.swimmer_name}
                    </h3>
                    <span className="text-slate-500 dark:text-slate-400 text-xs block mt-0.5">
                      {a.level_name}
                    </span>
                  </div>
                  <Badge variant={a.status === 'PASSED' ? 'success' : a.status === 'IN_PROGRESS' ? 'warning' : 'danger'}>
                    {a.status === 'PASSED' ? 'قبول' : a.status === 'IN_PROGRESS' ? 'در حال تمرین' : 'نیاز به تمرین'}
                  </Badge>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">آیتم مهارتی:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{a.skill_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">نمره:</span>
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{a.score} از ۱۰۰</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">تاریخ ارزیابی:</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">
                      {new Date(a.assessed_at).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                  {a.feedback && (
                    <div className="pt-1.5 text-slate-600 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/70 p-2 rounded-xl text-[11px] leading-relaxed">
                      <span className="font-semibold text-slate-500 block text-[10px] mb-0.5">بازخورد مربی:</span>
                      {a.feedback}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* TAB 3: SKILL CHECKLIST BY LEVEL */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {levels.map((lvl) => (
            <div
              key={lvl.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: lvl.color_badge || '#0284c7' }}
                  />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    سطح {lvl.order}: {lvl.name}
                  </h3>
                </div>
                <Badge variant="neutral">{(lvl.skills || []).length} سرفصل</Badge>
              </div>

              <div className="py-3 space-y-2.5">
                {(lvl.skills || []).map((sk) => (
                  <div
                    key={sk.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-xs"
                  >
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      {sk.order}. {sk.name}
                    </span>
                    {sk.criteria_description && (
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        معیار قبولی: {sk.criteria_description}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Verify Record */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="تأیید رسمی رکورد شنا برای لیگ و کارنامه شناگر"
      >
        <div className="space-y-4">
          <div className="p-4 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">شناگر:</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">{selectedRecord?.swimmer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ماده / مسافت:</span>
              <span className="font-bold text-sky-700 dark:text-sky-300">
                {selectedRecord?.distance_meters} متر {strokeLabels[selectedRecord?.stroke] || selectedRecord?.stroke}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">زمان ثبت‌شده:</span>
              <span className="font-mono font-bold text-emerald-600 text-sm">{selectedRecord?.duration_seconds} ثانیه</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">محل استخر:</span>
              <span>{selectedRecord?.pool_course === 'SHORT_25M' ? 'استخر ۲۵ متری' : 'استخر ۵۰ متری المپیک'}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              توضیحات داوری یا دلیل رد (در صورت رد شدن)
            </label>
            <textarea
              rows={2}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="در صورت رد رکورد، دلیل مانند خطای استارت یا خطا در چرخش سالتو را وارد کنید..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              disabled={verifying}
              onClick={() => handleVerifyDecision('REJECT')}
              className="text-rose-600 hover:bg-rose-50 border-rose-200"
            >
              رد رکورد
            </Button>
            <Button
              type="button"
              disabled={verifying}
              onClick={() => handleVerifyDecision('VERIFY')}
            >
              {verifying ? 'در حال ثبت...' : 'تأیید رسمی و ورود به لیگ'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: New Skill Assessment */}
      <Modal
        isOpen={isNewAssessModalOpen}
        onClose={() => setIsNewAssessModalOpen(false)}
        title="ثبت ارزیابی مهارتی جدید برای شناگر"
      >
        <form onSubmit={handleCreateAssessment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              انتخاب شناگر *
            </label>
            <select
              required
              value={assessForm.swimmer}
              onChange={(e) => setAssessForm({ ...assessForm, swimmer: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
            >
              <option value="">انتخاب شناگر...</option>
              {swimmers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.phone}) - سطح فعلی: {s.level_name || 'ثبت‌نشده'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              سرفصل مهارتی مورد ارزیابی *
            </label>
            <select
              required
              value={assessForm.skill}
              onChange={(e) => setAssessForm({ ...assessForm, skill: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
            >
              <option value="">انتخاب مهارت...</option>
              {allSkills.map((sk) => (
                <option key={sk.id} value={sk.id}>
                  {sk.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                نتیجه ارزیابی
              </label>
              <select
                value={assessForm.status}
                onChange={(e) => setAssessForm({ ...assessForm, status: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              >
                <option value="PASSED">قبول / کسب تسلط (Passed)</option>
                <option value="IN_PROGRESS">در حال تمرین (In Progress)</option>
                <option value="NEEDS_PRACTICE">نیاز به تمرین بیشتر (Needs Practice)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                نمره (از ۱۰۰)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={assessForm.score}
                onChange={(e) => setAssessForm({ ...assessForm, score: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              توضیحات و بازخورد مربی برای تمرین‌های بعدی
            </label>
            <textarea
              rows={2}
              value={assessForm.feedback}
              onChange={(e) => setAssessForm({ ...assessForm, feedback: e.target.value })}
              placeholder="توصیه‌های فنی مربی در خصوص ریتم تنفس یا زاویه ورود دست به آب..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsNewAssessModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={submittingAssess}>
              {submittingAssess ? 'در حال ثبت...' : 'ثبت قطعی ارزیابی'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
