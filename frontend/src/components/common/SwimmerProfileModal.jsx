import React, { useState, useEffect } from 'react';
import {
  Users, BookOpen, Calendar, CreditCard, Award,
  Phone, User, ShieldAlert, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import api from '../../api/client';
import { Modal } from './Modal';
import { Badge } from './Badge';
import { Button } from './Button';
import { LoadingState } from './LoadingState';
import { useToast } from '../../context/ToastContext';

export const SwimmerProfileModal = ({ isOpen, onClose, swimmerId, initialSwimmer }) => {
  const [profileSwimmer, setProfileSwimmer] = useState(null);
  const [profileTab, setProfileTab] = useState('INFO');
  const [swimmerEnrollments, setSwimmerEnrollments] = useState([]);
  const [swimmerAttendance, setSwimmerAttendance] = useState([]);
  const [swimmerInvoices, setSwimmerInvoices] = useState([]);
  const [swimmerRecords, setSwimmerRecords] = useState([]);
  const [dossierLoading, setDossierLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!isOpen || !swimmerId) {
      setProfileSwimmer(null);
      setProfileTab('INFO');
      setSwimmerEnrollments([]);
      setSwimmerAttendance([]);
      setSwimmerInvoices([]);
      setSwimmerRecords([]);
      return;
    }

    // Set fallback initial info
    if (initialSwimmer) {
      setProfileSwimmer({
        id: swimmerId,
        full_name: initialSwimmer.swimmer_name || initialSwimmer.full_name || 'شناگر',
        phone: initialSwimmer.swimmer_phone || initialSwimmer.phone || '—',
        gender_display: initialSwimmer.gender_display,
        birth_year: initialSwimmer.birth_year,
        ...initialSwimmer,
      });
    }

    const fetchDossier = async () => {
      setDossierLoading(true);
      try {
        const [swimmerRes, enrollRes, attRes, invRes, recRes] = await Promise.allSettled([
          api.get(`/swimmers/${swimmerId}/`),
          api.get(`/education/enrollments/?swimmer_id=${swimmerId}`),
          api.get(`/attendance/?swimmer_id=${swimmerId}`),
          api.get(`/finance/invoices/?swimmer_id=${swimmerId}`),
          api.get(`/assessments/records/?swimmer_id=${swimmerId}`),
        ]);

        if (swimmerRes.status === 'fulfilled' && swimmerRes.value?.data) {
          setProfileSwimmer(swimmerRes.value.data);
        }

        if (enrollRes.status === 'fulfilled') {
          setSwimmerEnrollments(enrollRes.value.data.results || enrollRes.value.data || []);
        }

        if (attRes.status === 'fulfilled') {
          setSwimmerAttendance(attRes.value.data.results || attRes.value.data || []);
        }

        if (invRes.status === 'fulfilled') {
          setSwimmerInvoices(invRes.value.data.results || invRes.value.data || []);
        }

        if (recRes.status === 'fulfilled') {
          setSwimmerRecords(recRes.value.data.results || recRes.value.data || []);
        }
      } catch (err) {
        console.error('Error fetching swimmer profile:', err);
        toast.error('خطا در بارگذاری جزئیات پرونده شناگر');
      } finally {
        setDossierLoading(false);
      }
    };

    fetchDossier();
  }, [isOpen, swimmerId]);

  const formatPrice = (val) => Number(val || 0).toLocaleString('fa-IR');

  const swimmerDisplayName =
    profileSwimmer?.full_name ||
    initialSwimmer?.swimmer_name ||
    initialSwimmer?.full_name ||
    'شناگر';

  const swimmerInitial = swimmerDisplayName ? swimmerDisplayName.trim().charAt(0) : 'ش';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`پرونده جامع شناگر: ${swimmerDisplayName}`}
    >
      <div className="space-y-4">
        {/* Profile Header Card */}
        <div className="flex items-center gap-3.5 p-3.5 bg-gradient-to-r from-sky-50 to-indigo-50/40 dark:from-sky-950/30 dark:to-indigo-950/20 rounded-2xl border border-sky-100 dark:border-sky-900/40">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
            {swimmerInitial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                {swimmerDisplayName}
              </h3>
              {profileSwimmer?.gender_display && (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium shadow-2xs border border-slate-200/50 dark:border-slate-700/50">
                  {profileSwimmer.gender_display}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                {profileSwimmer?.phone || initialSwimmer?.swimmer_phone || '—'}
              </span>
              {profileSwimmer?.level_name && (
                <span className="text-sky-600 dark:text-sky-400 font-medium flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  {profileSwimmer.level_name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Header */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-2">
          {[
            { key: 'INFO', label: 'اطلاعات پایه', icon: Users },
            { key: 'ENROLLMENTS', label: `دوره‌ها (${swimmerEnrollments.length})`, icon: BookOpen },
            { key: 'ATTENDANCE', label: `حضور و غیاب (${swimmerAttendance.length})`, icon: Calendar },
            { key: 'FINANCE', label: `مالی و فاکتور (${swimmerInvoices.length})`, icon: CreditCard },
            { key: 'ASSESSMENTS', label: `رکوردها (${swimmerRecords.length})`, icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setProfileTab(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                  profileTab === tab.key
                    ? 'bg-sky-500 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {dossierLoading ? (
          <LoadingState type="inline" message="در حال بارگذاری پرونده شناگر..." />
        ) : (
          <div>
            {/* TAB 1: INFO */}
            {profileTab === 'INFO' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[11px]">نام و نام خانوادگی:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {profileSwimmer?.full_name || swimmerDisplayName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">شماره تلفن:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                      {profileSwimmer?.phone || initialSwimmer?.swimmer_phone || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">کد ملی:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-200">
                      {profileSwimmer?.national_id || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">سطح مهارت فعلی:</span>
                    <span className="font-bold text-sky-600 dark:text-sky-400">
                      {profileSwimmer?.level_name || 'ثبت‌نشده'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">مخاطب اضطراری / والد:</span>
                    <span className="text-slate-700 dark:text-slate-200">
                      {profileSwimmer?.emergency_contact_name || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">تلفن اضطراری:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-200">
                      {profileSwimmer?.emergency_contact_phone || '—'}
                    </span>
                  </div>
                  {profileSwimmer?.date_of_birth && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">تاریخ تولد:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-200">
                        {profileSwimmer.date_of_birth}
                      </span>
                    </div>
                  )}
                  {profileSwimmer?.created_at && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">تاریخ ثبت‌نام در سامانه:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-200">
                        {new Date(profileSwimmer.created_at).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                  )}
                </div>

                {profileSwimmer?.medical_notes && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300">
                    <span className="font-bold block mb-1 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span>ملاحظات و حساسیت‌های پزشکی:</span>
                    </span>
                    <p className="pr-5 text-slate-700 dark:text-slate-300">
                      {profileSwimmer.medical_notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ENROLLMENTS */}
            {profileTab === 'ENROLLMENTS' && (
              <div className="space-y-2">
                {swimmerEnrollments.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    ثبت‌نام کلاسی فعالی برای این شناگر وجود ندارد.
                  </div>
                ) : (
                  swimmerEnrollments.map((enr) => (
                    <div
                      key={enr.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-100 block">
                          {enr.course_name}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                          {enr.group_name} {enr.pool_location ? `• ${enr.pool_location}` : ''}
                        </span>
                      </div>
                      <div className="text-left font-mono">
                        <span className="text-sky-600 dark:text-sky-400 font-bold block">
                          {enr.remaining_sessions} جلسه مانده
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {enr.sessions_attended} جلسه مصرف‌شده
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: ATTENDANCE */}
            {profileTab === 'ATTENDANCE' && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {swimmerAttendance.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    سابقه حضور و غیابی ثبت نشده است.
                  </div>
                ) : (
                  swimmerAttendance.map((att) => (
                    <div
                      key={att.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono text-slate-600 dark:text-slate-300 block">
                          {new Date(att.recorded_at).toLocaleDateString('fa-IR')}
                        </span>
                        {att.note && (
                          <span className="text-[11px] text-slate-400">یادداشت: {att.note}</span>
                        )}
                      </div>
                      <Badge
                        variant={
                          att.status === 'PRESENT'
                            ? 'success'
                            : att.status === 'EXCUSED'
                            ? 'info'
                            : att.status === 'LATE'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {att.status_display}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 4: FINANCE */}
            {profileTab === 'FINANCE' && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {swimmerInvoices.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    صورتحساب مالی ثبت نشده است.
                  </div>
                ) : (
                  swimmerInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                          {inv.invoice_number}
                        </span>
                        <Badge
                          variant={
                            inv.status === 'PAID'
                              ? 'success'
                              : inv.status === 'PARTIALLY_PAID'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {inv.status_display}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                        <span>مبلغ کل: {formatPrice(inv.total_amount)} تومان</span>
                        <span className="text-rose-600 dark:text-rose-400 font-bold font-mono">
                          مانده: {formatPrice(inv.remaining_balance)} تومان
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 5: ASSESSMENTS & RECORDS */}
            {profileTab === 'ASSESSMENTS' && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {swimmerRecords.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    رکورد زمانی ثبت نشده است.
                  </div>
                ) : (
                  swimmerRecords.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-100 block">
                          {rec.distance_meters} متر {rec.stroke_display || rec.stroke}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(rec.recorded_at).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                      <div className="text-left font-mono">
                        <span className="text-sky-600 dark:text-sky-400 font-bold block">
                          {rec.duration_seconds} ثانیه
                        </span>
                        <Badge variant={rec.verification_status === 'VERIFIED' ? 'success' : 'warning'}>
                          {rec.verification_status === 'VERIFIED' ? 'تأیید رسمی' : 'در انتظار بررسی'}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose}>
            بستن پرونده
          </Button>
        </div>
      </div>
    </Modal>
  );
};
