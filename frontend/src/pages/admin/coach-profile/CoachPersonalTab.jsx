import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Phone, Hash, Calendar, MapPin, ShieldAlert, Award, FileText,
  Clock, Briefcase, Plus, Trash2, Download, AlertCircle, CheckCircle2,
  FileCheck, Edit3, X, Save
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

            <div className="col-span-2">
              <span className="text-slate-400 block mb-0.5">آدرس محل سکونت:</span>
              <span className="text-slate-700 dark:text-slate-300">
                {coach.address || 'آدرسی ثبت نشده است.'}
              </span>
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
            ب) سوابق حرفه‌ای و شایستگی‌ها
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="col-span-1 sm:col-span-2">
              <span className="text-slate-400 block mb-0.5">تخصص‌های آموزشی شنا:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {coach.specialties ? (
                  coach.specialties.split(/[,،]/).map((spec, idx) => (
                    <span key={idx} className="bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 px-2.5 py-0.5 rounded-lg font-semibold border border-sky-100 dark:border-sky-900/50">
                      {spec.trim()}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500">عمومی و پایه</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">سابقه مربیگری:</span>
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
    </div>
  );
};
