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

  // Edit Personal & Professional Info Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: coach.first_name || '',
    last_name: coach.last_name || '',
    phone: coach.phone || '',
    national_id: coach.national_id || '',
    personnel_id: coach.personnel_id || '',
    gender: coach.gender || 'MALE',
    date_of_birth: coach.date_of_birth || '',
    emergency_contact_name: coach.emergency_contact_name || '',
    emergency_contact_phone: coach.emergency_contact_phone || '',
    address: coach.address || '',
    internal_notes: coach.internal_notes || '',
    specialties: coach.specialties || '',
    lifeguard_certificate: coach.lifeguard_certificate || '',
    lifeguard_expiration: coach.lifeguard_expiration || '',
    years_of_experience: coach.years_of_experience || 0,
    previous_experience: coach.previous_experience || '',
    additional_skills: coach.additional_skills || '',
    bio: coach.bio || '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

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

  // Handle Save Edit Form
  const handleSaveEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingEdit(true);
      await api.patch(`/coaches/${coach.id}/`, {
        ...editForm,
        years_of_experience: Number(editForm.years_of_experience || 0),
      });

      toast.success('اطلاعات پرونده با موفقیت ذخیره شد.');
      setIsEditModalOpen(false);
      if (onCoachUpdated) onCoachUpdated();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.phone || err.response?.data?.detail || 'خطا در به‌روزرسانی مشخصات';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSavingEdit(false);
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
          onClick={() => {
            setEditForm({
              first_name: coach.first_name || '',
              last_name: coach.last_name || '',
              phone: coach.phone || '',
              national_id: coach.national_id || '',
              personnel_id: coach.personnel_id || '',
              gender: coach.gender || 'MALE',
              date_of_birth: coach.date_of_birth || '',
              emergency_contact_name: coach.emergency_contact_name || '',
              emergency_contact_phone: coach.emergency_contact_phone || '',
              address: coach.address || '',
              internal_notes: coach.internal_notes || '',
              specialties: coach.specialties || '',
              lifeguard_certificate: coach.lifeguard_certificate || '',
              lifeguard_expiration: coach.lifeguard_expiration || '',
              years_of_experience: coach.years_of_experience || 0,
              previous_experience: coach.previous_experience || '',
              additional_skills: coach.additional_skills || '',
              bio: coach.bio || '',
            });
            setIsEditModalOpen(true);
          }}
          className="gap-1.5 text-xs bg-white dark:bg-slate-900 shadow-xs"
        >
          <Edit3 className="w-4 h-4 text-sky-600" />
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

      {/* Modal: Add Certificate */}
      <Modal
        isOpen={isAddCertModalOpen}
        onClose={() => setIsAddCertModalOpen(false)}
        title="ثبت مدرک یا گواهینامه جدید مربی"
      >
        <form onSubmit={handleAddCertSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              عنوان مدرک / گواهینامه <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={certForm.title}
              onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
              placeholder="مثال: مدرک مربیگری درجه ۲ شنا"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                سازمان یا مرجع صادرکننده
              </label>
              <input
                type="text"
                value={certForm.issuing_organization}
                onChange={(e) => setCertForm({ ...certForm, issuing_organization: e.target.value })}
                placeholder="فدراسیون شنا، شیرجه و واترپلو"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                شماره مدرک / شماره ثبت
              </label>
              <input
                type="text"
                value={certForm.certificate_number}
                onChange={(e) => setCertForm({ ...certForm, certificate_number: e.target.value })}
                placeholder="مثال: IR-SWIM-98412"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                تاریخ صدور (YYYY-MM-DD)
              </label>
              <input
                type="date"
                value={certForm.issue_date}
                onChange={(e) => setCertForm({ ...certForm, issue_date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                تاریخ انقضا / تمدید (اختیاری)
              </label>
              <input
                type="date"
                value={certForm.expiration_date}
                onChange={(e) => setCertForm({ ...certForm, expiration_date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              تصویر یا فایل PDF مدرک
            </label>
            <input
              type="file"
              onChange={(e) => setCertFile(e.target.files[0])}
              accept="image/*,.pdf"
              className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              یادداشت و توضیحات تکمیلی
            </label>
            <textarea
              rows={2}
              value={certForm.notes}
              onChange={(e) => setCertForm({ ...certForm, notes: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsAddCertModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={submittingCert} className="bg-sky-600 hover:bg-sky-500 text-white">
              {submittingCert ? 'در حال ثبت...' : 'ذخیره مدرک'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Personal & Professional Info */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`ویرایش مشخصات پرونده مربی: ${coach.full_name}`}
        size="lg"
      >
        <form onSubmit={handleSaveEditSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">نام</label>
              <input
                type="text"
                value={editForm.first_name}
                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">نام خانوادگی</label>
              <input
                type="text"
                value={editForm.last_name}
                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">شماره همراه</label>
              <input
                type="text"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">کد ملی</label>
              <input
                type="text"
                value={editForm.national_id}
                onChange={(e) => setEditForm({ ...editForm, national_id: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">کد پرسنلی</label>
              <input
                type="text"
                value={editForm.personnel_id}
                onChange={(e) => setEditForm({ ...editForm, personnel_id: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">جنسیت</label>
              <select
                value={editForm.gender}
                onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="MALE">مرد (آقا)</option>
                <option value="FEMALE">زن (خانم)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">تاریخ تولد</label>
              <input
                type="date"
                value={editForm.date_of_birth}
                onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">سابقه مربیگری (سال)</label>
              <input
                type="number"
                value={editForm.years_of_experience}
                onChange={(e) => setEditForm({ ...editForm, years_of_experience: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">نام مخاطب اضطراری</label>
              <input
                type="text"
                value={editForm.emergency_contact_name}
                onChange={(e) => setEditForm({ ...editForm, emergency_contact_name: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">تلفن اضطراری</label>
              <input
                type="text"
                value={editForm.emergency_contact_phone}
                onChange={(e) => setEditForm({ ...editForm, emergency_contact_phone: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">تخصص‌ها (با کاما جدا کنید)</label>
              <input
                type="text"
                value={editForm.specialties}
                onChange={(e) => setEditForm({ ...editForm, specialties: e.target.value })}
                placeholder="کرال سینه، شنای استقامتی، نجات غریق"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">آدرس محل سکونت</label>
              <input
                type="text"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">سوابق کاری و باشگاه‌های قبلی</label>
              <textarea
                rows={2}
                value={editForm.previous_experience}
                onChange={(e) => setEditForm({ ...editForm, previous_experience: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">رزومه و بیوگرافی رسمی</label>
              <textarea
                rows={2}
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">
                یادداشت محرمانه اداری (غیرقابل رویت برای مربی)
              </label>
              <textarea
                rows={2}
                value={editForm.internal_notes}
                onChange={(e) => setEditForm({ ...editForm, internal_notes: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-amber-300 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={savingEdit} className="bg-sky-600 hover:bg-sky-500 text-white">
              {savingEdit ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
