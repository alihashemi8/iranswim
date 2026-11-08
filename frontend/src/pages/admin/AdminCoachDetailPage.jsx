import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  UserCheck, Calendar, Clock, MapPin, Users, Award, Shield,
  Phone, Edit3, ArrowRight, BookOpen, CheckCircle2, AlertTriangle,
  FileText, Plus, Save, Hash, CreditCard, ClipboardCheck, History,
  Star, ShieldAlert, Archive, RotateCcw
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';

// Tabs
import { CoachPersonalTab } from './coach-profile/CoachPersonalTab';
import { CoachContractsTab } from './coach-profile/CoachContractsTab';
import { CoachPayrollTab } from './coach-profile/CoachPayrollTab';
import { CoachWorkAndLeavesTab } from './coach-profile/CoachWorkAndLeavesTab';
import { CoachScheduleTab } from './coach-profile/CoachScheduleTab';
import { CoachEvaluationAndRecordsTab } from './coach-profile/CoachEvaluationAndRecordsTab';

export const AdminCoachDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [coach, setCoach] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState('INFO');

  // Change Status Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('ACTIVE');
  const [statusReason, setStatusReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch all coach data in parallel
  const fetchCoachData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [coachRes, certsRes, contractsRes, payrollsRes, leavesRes, evalsRes, notesRes] = await Promise.all([
        api.get(`/coaches/${id}/`),
        api.get(`/coaches/${id}/certificates/`),
        api.get(`/coaches/${id}/contracts/`),
        api.get(`/coaches/${id}/payrolls/`),
        api.get(`/coaches/${id}/leave-requests/`),
        api.get(`/coaches/${id}/evaluations/`),
        api.get(`/coaches/${id}/administrative-notes/`),
      ]);

      setCoach(coachRes.data);
      setCertificates(certsRes.data || []);
      setContracts(contractsRes.data || []);
      setPayrolls(payrollsRes.data || []);
      setLeaves(leavesRes.data || []);
      setEvaluations(evalsRes.data || []);
      setNotes(notesRes.data || []);
      setNewStatus(coachRes.data.employment_status || 'ACTIVE');
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت پرونده جامع مربی');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoachData();
  }, [id]);

  // Handle Status Change
  const handleStatusChangeSubmit = async (e) => {
    e.preventDefault();
    try {
      setUpdatingStatus(true);
      await api.post(`/coaches/${id}/change-status/`, {
        employment_status: newStatus,
        reason: statusReason.trim(),
      });
      toast.success('وضعیت همکاری مربی با موفقیت به‌روزرسانی شد.');
      setIsStatusModalOpen(false);
      setStatusReason('');
      fetchCoachData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در تغییر وضعیت همکاری');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading && !coach) {
    return (
      <div className="py-12">
        <LoadingState type="cards" count={3} message="در حال دریافت پرونده منابع انسانی و مالی مربی..." />
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center">
        <p className="text-slate-600 dark:text-slate-400">مربی مورد نظر یافت نشد.</p>
        <Button onClick={() => navigate('/admin/coaches')} className="mt-4 gap-2">
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به کادر مربیان</span>
        </Button>
      </div>
    );
  }

  const activeContract = contracts.find((c) => c.status === 'ACTIVE');
  const formatPrice = (v) => Number(v || 0).toLocaleString('fa-IR');

  const tabs = [
    { id: 'INFO', label: 'مشخصات و مدارک', icon: UserCheck },
    { id: 'CONTRACTS', label: 'احکام و قراردادها', icon: FileText, count: contracts.length },
    { id: 'PAYROLL', label: 'حقوق و امور مالی', icon: CreditCard, count: payrolls.length },
    {
      id: 'WORK_AND_LEAVES',
      label: 'کارکرد و مرخصی‌ها',
      icon: ClipboardCheck,
      count: leaves.filter((l) => l.status === 'PENDING').length,
      countColor: 'bg-amber-500',
    },
    { id: 'SCHEDULE', label: 'برنامه کاری و کلاس‌ها', icon: Clock },
    {
      id: 'EVALUATION_AND_RECORDS',
      label: 'ارزیابی و سوابق',
      icon: Award,
      count: (evaluations.length + notes.length) || undefined,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/coaches')}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer shadow-xs"
            title="بازگشت به کادر مربیان"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">مدیریت مربیان و منابع انسانی</span>
              <span className="text-xs text-slate-300 dark:text-slate-700">/</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                پرونده مربی
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-sky-600" />
              پرونده پرسنلی و مالی: {coach.full_name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => {
              setNewStatus(coach.employment_status || 'ACTIVE');
              setStatusReason('');
              setIsStatusModalOpen(true);
            }}
            className="gap-1.5 text-xs bg-white dark:bg-slate-900 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span>تغییر وضعیت همکاری</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate(`/admin/coaches/${coach.id}/schedule`)}
            className="gap-1.5 text-xs bg-white dark:bg-slate-900 shadow-xs"
          >
            <Calendar className="w-4 h-4 text-sky-600" />
            <span>برنامه کلاسی</span>
          </Button>

          <Button
            onClick={() => navigate(`/admin/coaches/${coach.id}/assign`)}
            className="gap-1.5 text-xs bg-sky-600 hover:bg-sky-500 text-white shadow-xs"
          >
            <BookOpen className="w-4 h-4" />
            <span>تخصیص کلاس</span>
          </Button>
        </div>
      </div>

      {/* Hero Profile Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-sky-600 via-cyan-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xl sm:text-2xl shadow-lg ring-4 ring-sky-50 dark:ring-sky-950/40 shrink-0 overflow-hidden">
            {coach.avatar ? (
              <img src={coach.avatar} alt={coach.full_name} className="w-full h-full object-cover" />
            ) : (
              coach.full_name?.charAt(0) || 'C'
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {coach.full_name}
              </h2>

              <Badge
                variant={
                  coach.employment_status === 'ACTIVE'
                    ? 'success'
                    : coach.employment_status === 'SUSPENDED'
                    ? 'warning'
                    : coach.employment_status === 'ARCHIVED'
                    ? 'neutral'
                    : 'neutral'
                }
              >
                {coach.employment_status_display || coach.employment_status}
              </Badge>

              <span className="font-mono text-xs font-bold bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 px-2.5 py-0.5 rounded-lg border border-sky-100 dark:border-sky-900">
                {coach.personnel_id || 'EMP-1001'}
              </span>

              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg">
                مدل: {coach.employment_type_display || coach.employment_type}
              </span>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex-wrap">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-sky-600" />
                <span className="font-mono">{coach.phone}</span>
              </span>

              {coach.national_id && (
                <span className="flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-emerald-600" />
                  <span>کد ملی: <strong className="font-mono">{coach.national_id}</strong></span>
                </span>
              )}

              <span className="hidden sm:inline">•</span>
              <span>
                تاریخ آغاز همکاری: {coach.employment_start_date ? new Date(coach.employment_start_date).toLocaleDateString('fa-IR') : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0 text-xs sm:text-sm">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block mb-0.5">کلاس‌های فعال:</span>
            <span className="font-bold font-mono text-slate-800 dark:text-slate-200 text-sm sm:text-base">
              {coach.active_classes_count || coach.assigned_groups_count || 0} کلاس
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block mb-0.5">تعهد هفتگی:</span>
            <span className="font-bold font-mono text-slate-800 dark:text-slate-200 text-sm sm:text-base">
              {coach.contractual_weekly_hours} ساعت
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono text-white ${tab.countColor || 'bg-slate-400'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'INFO' && (
          <CoachPersonalTab
            coach={coach}
            onCoachUpdated={fetchCoachData}
            certificates={certificates}
            onCertificatesUpdated={fetchCoachData}
          />
        )}

        {activeTab === 'CONTRACTS' && (
          <CoachContractsTab
            coach={coach}
            contracts={contracts}
            onContractsUpdated={fetchCoachData}
          />
        )}

        {activeTab === 'PAYROLL' && (
          <CoachPayrollTab
            coach={coach}
            payrolls={payrolls}
            onPayrollsUpdated={fetchCoachData}
          />
        )}

        {activeTab === 'WORK_AND_LEAVES' && (
          <CoachWorkAndLeavesTab
            coach={coach}
            leaves={leaves}
            onLeavesUpdated={fetchCoachData}
          />
        )}

        {activeTab === 'SCHEDULE' && (
          <CoachScheduleTab
            coach={coach}
          />
        )}

        {activeTab === 'EVALUATION_AND_RECORDS' && (
          <CoachEvaluationAndRecordsTab
            coach={coach}
            evaluations={evaluations}
            onEvaluationsUpdated={fetchCoachData}
            notes={notes}
            onNotesUpdated={fetchCoachData}
          />
        )}
      </div>

      {/* Modal: Change Status */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={`تغییر وضعیت همکاری مربی: ${coach.full_name}`}
      >
        <form onSubmit={handleStatusChangeSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              وضعیت جدید همکاری <span className="text-rose-500">*</span>
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="ACTIVE">فعال و مجاز (Active)</option>
              <option value="SUSPENDED">معلق موقت (Suspended)</option>
              <option value="INACTIVE">پایان همکاری / غیرفعال (Inactive)</option>
              <option value="ARCHIVED">بایگانی پرونده (Archived)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              دلیل و توضیح تصمیم اداری <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="مثال: پایان مدت قرارداد، تخلف انضباطی، درخواست مربی، شروع دوره جدید..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsStatusModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={updatingStatus} className="bg-sky-600 hover:bg-sky-500 text-white">
              {updatingStatus ? 'در حال اعمال...' : 'ثبت تغییر وضعیت'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
