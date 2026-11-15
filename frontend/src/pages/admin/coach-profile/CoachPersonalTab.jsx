import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Phone, Hash, Calendar, MapPin, ShieldAlert, Award, FileText,
  Clock, Briefcase, Plus, Trash2, Download, AlertCircle, CheckCircle2,
  FileCheck, Edit3, X, Save, Check, XCircle, Shield
} from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { useToast } from '../../../context/ToastContext';
import api from '../../../api/client';

export const CoachPersonalTab = ({ coach, onCoachUpdated, certificates, onCertificatesUpdated }) => {
  const navigate = useNavigate();
  const toast = useToast();

  // Add Certificate Modal State
  const [isAddCertModalOpen, setIsAddCertModalOpen] = useState(false);
  const [certForm, setCertForm] = useState({
    title: '',
    issuing_organization: '',
    certificate_number: '',
    issue_date: '',
    expiration_date: '',
    notes: '',
  });
  const [certFile, setCertFile] = useState(null);
  const [submittingCert, setSubmittingCert] = useState(false);

  // Retraining Review Modal & States
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingRetraining, setProcessingRetraining] = useState(false);

  // Handle Approve Retraining
  const handleApproveRetraining = async () => {
    try {
      setProcessingRetraining(true);
      const res = await api.post(`/coaches/${coach.id}/verify-retraining/`, { action: 'APPROVE' });
      toast.success(res.data.message || 'گواهی بازآموزی سال جاری با موفقیت تأیید شد.');
      if (onCoachUpdated) onCoachUpdated();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در تأیید گواهی بازآموزی');
    } finally {
      setProcessingRetraining(false);
    }
  };

  // Handle Reject Retraining
  const handleRejectRetraining = async (e) => {
    e?.preventDefault();
    if (!rejectionReason.trim()) {
      toast.error('لطفاً دلیل عدم تأیید گواهی بازآموزی را وارد فرمایید.');
      return;
    }
    try {
      setProcessingRetraining(true);
      const res = await api.post(`/coaches/${coach.id}/verify-retraining/`, {
        action: 'REJECT',
        reason: rejectionReason.trim(),
      });
      toast.success(res.data.message || 'گواهی بازآموزی رد شد و به مربی اطلاع‌رسانی گردید.');
      setIsRejectModalOpen(false);
      setRejectionReason('');
      if (onCoachUpdated) onCoachUpdated();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت عدم تأیید گواهی بازآموزی');
    } finally {
      setProcessingRetraining(false);
    }
  };

  // Handle Add Certificate
  const handleAddCertSubmit = async (e) => {
    e.preventDefault();
    if (!certForm.title) {
      toast.error('عنوان مدرک یا گواهینامه الزامی است.');
      return;
    }

    try {
      setSubmittingCert(true);
      const formData = new FormData();
      formData.append('title', certForm.title);
      if (certForm.issuing_organization) formData.append('issuing_organization', certForm.issuing_organization);
      if (certForm.certificate_number) formData.append('certificate_number', certForm.certificate_number);
      if (certForm.issue_date) formData.append('issue_date', certForm.issue_date);
      if (certForm.expiration_date) formData.append('expiration_date', certForm.expiration_date);
      if (certForm.notes) formData.append('notes', certForm.notes);
      if (certFile) formData.append('file', certFile);

      await api.post(`/coaches/${coach.id}/certificates/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('مدرک با موفقیت ثبت شد.');
      setIsAddCertModalOpen(false);
      setCertForm({
        title: '',
        issuing_organization: '',
        certificate_number: '',
        issue_date: '',
        expiration_date: '',
        notes: '',
      });
      setCertFile(null);
      if (onCertificatesUpdated) onCertificatesUpdated();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت مدرک مربی');
    } finally {
      setSubmittingCert(false);
    }
  };

  // Handle Delete Certificate
  const handleDeleteCert = async (certId, certTitle) => {
    if (!window.confirm(`آیا از حذف مدرک «${certTitle}» اطمینان دارید؟`)) return;

    try {
      await api.delete(`/coaches/certificates/${certId}/`);
      toast.success('مدرک با موفقیت حذف شد.');
      if (onCertificatesUpdated) onCertificatesUpdated();
    } catch (err) {
      toast.error('خطا در حذف مدرک');
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header for Edit */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-5 h-5 text-sky-600" />
          مشخصات فردی، هویتی و مدارک تخصصی
        </h3>
        <Button
          variant="outline"
          onClick={() => navigate(`/admin/coaches/${coach.id}/edit`)}
          className="gap-1.5 text-xs bg-white dark:bg-slate-900 shadow-xs hover:bg-sky-50 dark:hover:bg-sky-950/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800"
        >
          <Edit3 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>ویرایش مشخصات پرونده</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section A: Personal Information */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <User className="w-4 h-4 text-sky-600" />
            الف) اطلاعات شناسنامه‌ای و تماس
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-slate-400 block mb-0.5">نام و نام خانوادگی:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{coach.full_name}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">کد پرسنلی:</span>
              <span className="font-mono font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded-md inline-block">
                {coach.personnel_id || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">کد ملی:</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {coach.national_id || 'ثبت‌نشده'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">جنسیت:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {coach.gender_display || (coach.gender === 'MALE' ? 'مرد' : 'زن')}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">شماره همراه:</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {coach.phone}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">تاریخ تولد:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {coach.date_of_birth ? new Date(coach.date_of_birth).toLocaleDateString('fa-IR') : '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">مخاطب اضطراری:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {coach.emergency_contact_name || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">تلفن اضطراری:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {coach.emergency_contact_phone || '—'}
              </span>
            </div>

            <div className="col-span-1 sm:col-span-2">
              <span className="text-slate-400 block mb-0.5">آدرس محل سکونت:</span>
              <span className="text-slate-700 dark:text-slate-300">
                {coach.address || 'آدرسی ثبت نشده است.'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">شماره کارت بانکی:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tracking-wider">
                {coach.card_number ? coach.card_number.replace(/(\d{4})/g, '$1-').replace(/-$/, '') : 'ثبت نشده'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">شماره شبا بانکی (IBAN):</span>
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                {coach.shaba_number || 'ثبت نشده'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">وضعیت تکمیل پرونده:</span>
              {coach.is_profile_completed ? (
                <Badge variant="success">تکمیل و تأیید شده</Badge>
              ) : (
                <Badge variant="warning">نیازمند تکمیل مدارک</Badge>
              )}
            </div>

            {coach.internal_notes && (
              <div className="col-span-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/50">
                <span className="text-amber-800 dark:text-amber-300 font-bold block mb-1 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  یادداشت محرمانه اداری (مختص مدیریت):
                </span>
                <p className="text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
                  {coach.internal_notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section B: Professional Information */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            ب) سوابق حرفه‌ای، درجه و مدارک مربیگری
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-slate-400 block mb-0.5">درجه رسمی مربی‌گری:</span>
              <span className="font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 px-2.5 py-1 rounded-lg border border-sky-200 dark:border-sky-800 inline-block">
                {coach.coaching_degree_display || coach.coaching_degree || 'درجه ۳'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">تاریخ اخذ مربی‌گری:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {coach.coaching_certificate_date ? new Date(coach.coaching_certificate_date).toLocaleDateString('fa-IR') : '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">مدرک مربیگری بارگذاری‌شده:</span>
              {coach.coaching_certificate_file ? (
                <a
                  href={coach.coaching_certificate_file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود / مشاهده مدرک</span>
                </a>
              ) : (
                <span className="text-rose-500 font-medium">مدرکی بارگذاری نشده است</span>
              )}
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">سابقه تدریس و مربیگری:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {coach.years_of_experience || 0} سال سابقه
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">مدرک نجات‌غریق:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {coach.lifeguard_certificate || 'فاقد کارت ثبت‌شده'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">اعتبار کارت نجات‌غریق:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {coach.lifeguard_expiration ? new Date(coach.lifeguard_expiration).toLocaleDateString('fa-IR') : '—'}
              </span>
            </div>

            {coach.resume_file && (
              <div className="col-span-2">
                <span className="text-slate-400 block mb-0.5">فایل رزومه پیوست:</span>
                <a
                  href={coach.resume_file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 dark:bg-sky-950/40 px-2.5 py-1 rounded-lg border border-sky-200 dark:border-sky-800"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود فایل رزومه</span>
                </a>
              </div>
            )}

            <div className="col-span-2">
              <span className="text-slate-400 block mb-0.5">سوابق کاری و باشگاه‌های قبلی:</span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {coach.previous_experience || 'سابقه‌ای درج نشده است.'}
              </p>
            </div>

            <div className="col-span-2">
              <span className="text-slate-400 block mb-0.5">سایر مهارت‌ها و دوره‌ها:</span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {coach.additional_skills || '—'}
              </p>
            </div>

            <div className="col-span-2">
              <span className="text-slate-400 block mb-0.5">رزومه و بیوگرافی رسمی (نمایش در سایت):</span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                {coach.bio || 'توضیحی ثبت نشده است.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* بخش اختصاصی: بازآموزی سال جاری و تأیید مدیریت */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-300 dark:border-emerald-700/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-xs">
                <FileCheck className="w-4 h-4" />
              </span>
              <span>گواهی دوره بازآموزی سال جاری ({coach.retraining_year || 1405})</span>
            </h4>
            <p className="text-xs text-slate-500">
              اعتبار سالانه تا پایان اسفند ماه • نیازمند بررسی و تأیید صلاحیت اداری توسط مدیر
            </p>
          </div>

          <div className="flex items-center gap-2">
            {coach.retraining_status === 'APPROVED' ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>تأییدشده و معتبر</span>
              </span>
            ) : coach.retraining_status === 'PENDING' ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>در انتظار بررسی و تأیید مدیر</span>
              </span>
            ) : coach.retraining_status === 'REJECTED' ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>رد شده / نیازمند اصلاح</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                <span>بارگذاری‌نشده</span>
              </span>
            )}
          </div>
        </div>

        {/* Content Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div className="space-y-3 bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">فایل مدرک بازآموزی:</span>
              {coach.retraining_certificate_file_url || coach.retraining_certificate_file ? (
                <a
                  href={coach.retraining_certificate_file_url || coach.retraining_certificate_file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold text-emerald-600 hover:text-emerald-700 bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 shadow-2xs text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود / مشاهده گواهی بازآموزی</span>
                </a>
              ) : (
                <span className="text-rose-500 font-semibold">مدرکی توسط مربی بارگذاری نشده است</span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">تاریخ انقضای اعتبار قانونی:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {coach.retraining_expiry_date_jalali ? `تا ${coach.retraining_expiry_date_jalali} (پایان اسفند)` : (coach.retraining_year ? `تا ۲۹ اسفند ${coach.retraining_year}` : 'تا آخر اسفند سال جاری')}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">وضعیت انقضا:</span>
              {coach.is_retraining_valid ? (
                <span className="font-bold text-emerald-600 text-xs">دارای اعتبار قانونی تا پایان سال ✓</span>
              ) : coach.is_retraining_expired ? (
                <span className="font-bold text-rose-600 text-xs">منقضی‌شده (نیاز به بازآموزی سال جدید)</span>
              ) : (
                <span className="text-slate-500 text-xs">منوط به تأیید مدیریت</span>
              )}
            </div>

            {coach.retraining_verified_by_name && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                <span className="text-slate-500">بررسی‌کننده:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {coach.retraining_verified_by_name}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between space-y-3 bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            {coach.retraining_status === 'REJECTED' && coach.retraining_rejection_reason ? (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs">
                <span className="font-bold text-rose-800 dark:text-rose-300 block mb-1">دلیل رد مدرک توسط مدیر:</span>
                <p className="text-rose-700 dark:text-rose-300 leading-relaxed">{coach.retraining_rejection_reason}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 leading-relaxed">
                بر اساس ضوابط رسمی، مربیان تنها در صورتی مجاز به هدایت کلاس‌های شنا و دریافت ابلاغیه آموزشی هستند که گواهی بازآموزی سال جاری را گذرانده و تأییدیه مدیریت را دریافت کرده باشند.
              </p>
            )}

            {/* Admin Verification Actions */}
            <div className="pt-3 border-t border-slate-200/50 dark:border-slate-700/50 flex flex-wrap items-center gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRejectModalOpen(true)}
                disabled={processingRetraining || !coach.retraining_certificate_file}
                className="gap-1.5 text-xs text-rose-600 hover:text-rose-700 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>رد / نیاز به اصلاح</span>
              </Button>

              <Button
                size="sm"
                onClick={handleApproveRetraining}
                loading={processingRetraining}
                disabled={processingRetraining || !coach.retraining_certificate_file || coach.retraining_status === 'APPROVED'}
                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{coach.retraining_status === 'APPROVED' ? 'تأیید مجدد' : 'تأیید گواهی بازآموزی'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Section C: Certificates and Diplomas */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              مدارک مربیگری و گواهینامه‌های رسمی فدراسیون
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              مدارک معتبر درجه ۱، ۲ و ۳ شنا، نجات‌غریق، آب‌درمانی و دوره‌های بین‌المللی
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => navigate(`/admin/coaches/${coach.id}/certificates/new`)}
            className="gap-1.5 text-xs bg-sky-600 hover:bg-sky-500 text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ثبت مدرک جدید</span>
          </Button>
        </div>

        {certificates && certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {cert.title}
                    </h5>
                    {cert.is_verified && (
                      <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        تأییدشده
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    مرجع صادرکننده: <span className="font-semibold text-slate-700 dark:text-slate-300">{cert.issuing_organization || 'فدراسیون شنا'}</span>
                  </p>
                  {cert.certificate_number && (
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                      شماره مدرک: {cert.certificate_number}
                    </p>
                  )}
                  {cert.expiration_date && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      تاریخ انقضا: <span className="font-mono">{new Date(cert.expiration_date).toLocaleDateString('fa-IR')}</span>
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
                  {cert.file_url ? (
                    <a
                      href={cert.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 font-semibold flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>دانلود فایل مدرک</span>
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400">فاقد فایل پیوست</span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteCert(cert.id, cert.title)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="حذف مدرک"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs">
            هنوز مدرک یا گواهینامه‌ای برای این مربی بارگذاری نشده است.
          </div>
        )}
      </div>

      {/* Modal: Rejection Reason for Retraining */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="ثبت عدم تأیید گواهی بازآموزی سال جاری"
        size="md"
      >
        <form onSubmit={handleRejectRetraining} className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            علت عدم تأیید مدرک را مشخص فرمایید. این توضیح به عنوان پیام سیستمی به مربی ارسال خواهد شد تا نسبت به اصلاح و بارگذاری مجدد فایل اقدام نماید.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              دلیل عدم تأیید یا موارد نیازمند اصلاح <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="مثال: گواهی مربوط به سال گذشته است، کیفیت تصویر ناخواناست، مدرک فاقد مهر هیئت شنا است..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs leading-relaxed"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRejectModalOpen(false)}
              disabled={processingRetraining}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={processingRetraining}
              className="bg-rose-600 hover:bg-rose-500 text-white gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>ثبت عدم تأیید و ارسال به مربی</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
