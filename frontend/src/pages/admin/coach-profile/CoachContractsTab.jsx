import React, { useState } from 'react';
import {
  FileText, Plus, RefreshCw, AlertTriangle, CheckCircle2, Download,
  Calendar, Clock, DollarSign, Shield, X
} from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { useToast } from '../../../context/ToastContext';
import api from '../../../api/client';

export const CoachContractsTab = ({ coach, contracts, onContractsUpdated }) => {
  const toast = useToast();

  const [isNewContractModalOpen, setIsNewContractModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [selectedContractForRenew, setSelectedContractForRenew] = useState(null);

  const [contractForm, setContractForm] = useState({
    contract_type: 'STANDARD',
    start_date: '',
    end_date: '',
    employment_type: coach.employment_type || 'HOURLY',
    hourly_rate: coach.hourly_rate || 0,
    fixed_salary: coach.fixed_monthly_salary || 0,
    percentage_rate: coach.revenue_percentage || 0,
    percentage_basis: 'COURSE_GROSS',
    agreed_weekly_hours: coach.contractual_weekly_hours || 20,
    terms_and_conditions: '',
    internal_notes: '',
    sync_to_profile: true,
  });
  const [contractFile, setContractFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Active contract
  const activeContract = contracts.find((c) => c.status === 'ACTIVE');

  // Submit New Contract
  const handleNewContractSubmit = async (e) => {
    e.preventDefault();
    if (!contractForm.start_date || !contractForm.end_date) {
      toast.error('تاریخ شروع و پایان قرارداد الزامی است.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      Object.keys(contractForm).forEach((key) => {
        formData.append(key, contractForm[key]);
      });
      if (contractFile) formData.append('document', contractFile);

      await api.post(`/coaches/${coach.id}/contracts/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('قرارداد جدید با موفقیت ثبت شد.');
      setIsNewContractModalOpen(false);
      setContractFile(null);
      if (onContractsUpdated) onContractsUpdated();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت قرارداد جدید');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Contract Renewal
  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedContractForRenew) return;

    try {
      setSubmitting(true);
      const formData = new FormData();
      Object.keys(contractForm).forEach((key) => {
        formData.append(key, contractForm[key]);
      });
      if (contractFile) formData.append('document', contractFile);

      await api.post(`/coaches/contracts/${selectedContractForRenew.id}/renew/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('قرارداد با موفقیت تمدید شد.');
      setIsRenewModalOpen(false);
      setSelectedContractForRenew(null);
      setContractFile(null);
      if (onContractsUpdated) onContractsUpdated();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در تمدید قرارداد');
    } finally {
      setSubmitting(false);
    }
  };

  const openRenewModal = (contract) => {
    setSelectedContractForRenew(contract);
    const today = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(today.getFullYear() + 1);

    setContractForm({
      contract_type: contract.contract_type || 'STANDARD',
      start_date: contract.end_date || today.toISOString().split('T')[0],
      end_date: nextYear.toISOString().split('T')[0],
      employment_type: contract.employment_type || 'HOURLY',
      hourly_rate: contract.hourly_rate || 0,
      fixed_salary: contract.fixed_salary || 0,
      percentage_rate: contract.percentage_rate || 0,
      percentage_basis: contract.percentage_basis || 'COURSE_GROSS',
      agreed_weekly_hours: contract.agreed_weekly_hours || 20,
      terms_and_conditions: contract.terms_and_conditions || '',
      internal_notes: '',
      sync_to_profile: true,
    });
    setIsRenewModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Active Contract Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600" />
            مدیریت احکام و قراردادهای همکاری
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            ثبت قراردادهای ساعتی، حقوق ثابت و درصدی همراه با پیگیری سررسید و تمدید سیستمی
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeContract && (
            <Button
              variant="outline"
              onClick={() => openRenewModal(activeContract)}
              className="gap-1.5 text-xs bg-white dark:bg-slate-900 shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
              <span>تمدید قرارداد جاری</span>
            </Button>
          )}

          <Button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              const nextYear = new Date();
              nextYear.setFullYear(new Date().getFullYear() + 1);
              setContractForm({
                contract_type: 'STANDARD',
                start_date: today,
                end_date: nextYear.toISOString().split('T')[0],
                employment_type: coach.employment_type || 'HOURLY',
                hourly_rate: coach.hourly_rate || 0,
                fixed_salary: coach.fixed_monthly_salary || 0,
                percentage_rate: coach.revenue_percentage || 0,
                percentage_basis: 'COURSE_GROSS',
                agreed_weekly_hours: coach.contractual_weekly_hours || 20,
                terms_and_conditions: '',
                internal_notes: '',
                sync_to_profile: true,
              });
              setIsNewContractModalOpen(true);
            }}
            className="gap-1.5 text-xs bg-sky-600 hover:bg-sky-500 text-white shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>انعقاد قرارداد جدید</span>
          </Button>
        </div>
      </div>

      {/* Active Contract Hero Box */}
      {activeContract ? (
        <div className="p-5 rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-gradient-to-r from-sky-50/50 to-indigo-50/30 dark:from-sky-950/20 dark:to-indigo-950/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-sky-100 dark:border-sky-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    قرارداد فعال: شماره {activeContract.contract_number}
                  </h4>
                  <Badge variant="success">جاری و دارای اعتبار</Badge>
                  {activeContract.is_expiring_soon && (
                    <span className="bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      کمتر از ۳۰ روز تا پایان اعتبار
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  نوع قرارداد: <span className="font-semibold text-slate-700 dark:text-slate-300">{activeContract.contract_type_display}</span>
                </p>
              </div>
            </div>

            {activeContract.document_url && (
              <a
                href={activeContract.document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 font-semibold flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-sky-200 dark:border-sky-800 shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>دانلود نسخه امضاشده</span>
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-1">مدل محاسبه دستمزد:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {activeContract.employment_type_display}
              </span>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-1">نرخ / مبلغ مصوب:</span>
              <span className="font-bold font-mono text-slate-900 dark:text-white text-sm sm:text-base">
                {activeContract.employment_type === 'HOURLY' && `${Number(activeContract.hourly_rate).toLocaleString('fa-IR')} ت/ساعت`}
                {activeContract.employment_type === 'FIXED' && `${Number(activeContract.fixed_salary).toLocaleString('fa-IR')} ت/ماه`}
                {activeContract.employment_type === 'PERCENTAGE' && `${activeContract.percentage_rate}٪ از شهریه`}
              </span>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-1">بازه زمانی اعتبار:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {new Date(activeContract.start_date).toLocaleDateString('fa-IR')} تا {new Date(activeContract.end_date).toLocaleDateString('fa-IR')}
              </span>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-1">تعهد کاری هفتگی:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {activeContract.agreed_weekly_hours} ساعت در هفته
              </span>
            </div>
          </div>

          {activeContract.terms_and_conditions && (
            <div className="text-xs text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <strong className="text-slate-700 dark:text-slate-300 block mb-1">مفاد و شرایط توافق‌شده:</strong>
              <p className="leading-relaxed">{activeContract.terms_and_conditions}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 rounded-2xl border border-dashed border-amber-300 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20 text-center space-y-2">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            این مربی در حال حاضر فاقد قرارداد فعال است
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            برای صدور فیش حقوقی و رسمیت‌بخشی به نرخ‌های پرداختی، لطفاً با کلیک روی «انعقاد قرارداد جدید» قرارداد ایشان را ثبت کنید.
          </p>
        </div>
      )}

      {/* Historical Contracts Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
            سوابق کلیه قراردادهای تاریخی مربی ({contracts.length} فقره)
          </h4>
          <span className="text-[11px] text-slate-400">سوابق تاریخی به هیچ عنوان حذف یا بازنویسی نمی‌شوند</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-bold">شماره قرارداد</th>
                <th className="py-3 px-4 font-bold">نوع قرارداد</th>
                <th className="py-3 px-4 font-bold">مدل دستمزد</th>
                <th className="py-3 px-4 font-bold">تاریخ شروع</th>
                <th className="py-3 px-4 font-bold">تاریخ پایان</th>
                <th className="py-3 px-4 font-bold">نرخ / دستمزد مصوب</th>
                <th className="py-3 px-4 font-bold">ساعات تعهد</th>
                <th className="py-3 px-4 font-bold">وضعیت</th>
                <th className="py-3 px-4 font-bold text-center">فایل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-400">
                    هیچ قراردادی در پرونده ثبت نشده است.
                  </td>
                </tr>
              ) : (
                contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-sky-700 dark:text-sky-400">
                      {c.contract_number}
                    </td>
                    <td className="py-3 px-4">{c.contract_type_display}</td>
                    <td className="py-3 px-4">{c.employment_type_display}</td>
                    <td className="py-3 px-4 font-mono">{new Date(c.start_date).toLocaleDateString('fa-IR')}</td>
                    <td className="py-3 px-4 font-mono">{new Date(c.end_date).toLocaleDateString('fa-IR')}</td>
                    <td className="py-3 px-4 font-mono font-semibold">
                      {c.employment_type === 'HOURLY' && `${Number(c.hourly_rate).toLocaleString('fa-IR')} تومان`}
                      {c.employment_type === 'FIXED' && `${Number(c.fixed_salary).toLocaleString('fa-IR')} تومان`}
                      {c.employment_type === 'PERCENTAGE' && `${c.percentage_rate}٪`}
                    </td>
                    <td className="py-3 px-4 font-mono">{c.agreed_weekly_hours} ساعت</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          c.status === 'ACTIVE'
                            ? 'success'
                            : c.status === 'RENEWED'
                            ? 'info'
                            : c.status === 'EXPIRED'
                            ? 'neutral'
                            : 'warning'
                        }
                      >
                        {c.status_display}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {c.document_url ? (
                        <a
                          href={c.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-600 hover:text-sky-700 inline-block p-1"
                          title="دانلود فایل قرارداد"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Contract or Renew Contract */}
      <Modal
        isOpen={isNewContractModalOpen || isRenewModalOpen}
        onClose={() => {
          setIsNewContractModalOpen(false);
          setIsRenewModalOpen(false);
          setSelectedContractForRenew(null);
        }}
        title={isRenewModalOpen ? `تمدید قرارداد مربی: ${coach.full_name}` : `انعقاد قرارداد جدید برای: ${coach.full_name}`}
        size="lg"
      >
        <form onSubmit={isRenewModalOpen ? handleRenewSubmit : handleNewContractSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                نوع و قالب قرارداد <span className="text-rose-500">*</span>
              </label>
              <select
                value={contractForm.contract_type}
                onChange={(e) => setContractForm({ ...contractForm, contract_type: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="STANDARD">استاندارد کادر آموزشی</option>
                <option value="FULL_TIME">تمام‌وقت</option>
                <option value="PART_TIME">پاره‌وقت</option>
                <option value="PROJECT">پروژه‌ای / دوره‌ای</option>
                <option value="INTERNSHIP">کارآموزی / آزمایشی</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                مدل همکاری و دستمزد <span className="text-rose-500">*</span>
              </label>
              <select
                value={contractForm.employment_type}
                onChange={(e) => setContractForm({ ...contractForm, employment_type: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="HOURLY">ساعتی (بر اساس ساعات تدریس تاییدشده)</option>
                <option value="FIXED">حقوق ثابت ماهانه مقطوع</option>
                <option value="PERCENTAGE">درصدی (سهم از شهریه دوره‌ها)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                تاریخ آغاز قرارداد <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={contractForm.start_date}
                onChange={(e) => setContractForm({ ...contractForm, start_date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                تاریخ پایان اعتبار قرارداد <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={contractForm.end_date}
                onChange={(e) => setContractForm({ ...contractForm, end_date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                required
              />
            </div>

            {/* Compensation Inputs Based on Model */}
            {contractForm.employment_type === 'HOURLY' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نرخ دستمزد ساعتی (تومان) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={contractForm.hourly_rate}
                  onChange={(e) => setContractForm({ ...contractForm, hourly_rate: e.target.value })}
                  placeholder="مثال: ۲۵۰۰۰۰"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>
            )}

            {contractForm.employment_type === 'FIXED' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  حقوق ثابت ماهانه (تومان) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={contractForm.fixed_salary}
                  onChange={(e) => setContractForm({ ...contractForm, fixed_salary: e.target.value })}
                  placeholder="مثال: ۲۰۰۰۰۰۰۰"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>
            )}

            {contractForm.employment_type === 'PERCENTAGE' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    درصد سهم مربی (از ۱۰۰) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={contractForm.percentage_rate}
                    onChange={(e) => setContractForm({ ...contractForm, percentage_rate: e.target.value })}
                    placeholder="مثال: ۳۰"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    مبنای درآمدی سهم درصدی
                  </label>
                  <select
                    value={contractForm.percentage_basis}
                    onChange={(e) => setContractForm({ ...contractForm, percentage_basis: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="COURSE_GROSS">درآمد ناخالص مصوب دوره‌ها</option>
                    <option value="COURSE_COLLECTED">درآمد وصول‌شده و واریزشده شناگران</option>
                    <option value="CUSTOM">مبلغ توافق‌شده سفارشی</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                ساعات کاری موظف در هفته
              </label>
              <input
                type="number"
                value={contractForm.agreed_weekly_hours}
                onChange={(e) => setContractForm({ ...contractForm, agreed_weekly_hours: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                بارگذاری تصویر یا فایل PDF قرارداد امضاشده
              </label>
              <input
                type="file"
                onChange={(e) => setContractFile(e.target.files[0])}
                accept="image/*,.pdf"
                className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                مفاد و شرایط اختصاصی توافق‌شده
              </label>
              <textarea
                rows={2}
                value={contractForm.terms_and_conditions}
                onChange={(e) => setContractForm({ ...contractForm, terms_and_conditions: e.target.value })}
                placeholder="تعهدات انضباطی، شیوه محاسبه مرخصی و الزامات حضور..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setIsNewContractModalOpen(false);
                setIsRenewModalOpen(false);
              }}
            >
              انصراف
            </Button>
            <Button type="submit" disabled={submitting} className="bg-sky-600 hover:bg-sky-500 text-white">
              {submitting ? 'در حال ثبت قرارداد...' : isRenewModalOpen ? 'تأیید و صدور تمدید' : 'ثبت و فعال‌سازی قرارداد'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
