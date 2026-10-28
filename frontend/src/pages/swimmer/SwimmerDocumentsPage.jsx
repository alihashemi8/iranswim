import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, User, Phone, MapPin, ShieldCheck, AlertTriangle,
  CheckCircle2, Clock, XCircle, ArrowLeft, Upload, Calendar, Edit3
} from 'lucide-react';
import api from '../../api/client';
import { useSwimmer } from '../../context/SwimmerContext';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';

export const SwimmerDocumentsPage = () => {
  const { activeSwimmer, activeSwimmerId } = useSwimmer();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const params = activeSwimmerId ? { swimmer_id: activeSwimmerId } : {};
      const res = await api.get('/swimmers/me/', { params });
      setProfile(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [activeSwimmerId]);

  if (loading) {
    return <LoadingState type="form" message="در حال دریافت اطلاعات پرونده و مدارک..." />;
  }

  const getDocStatusBadge = (status, hasImage) => {
    if (!hasImage || status === 'UNUPLOADED') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
          <Clock className="w-3.5 h-3.5" />
          بارگذاری‌نشده
        </span>
      );
    }
    if (status === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          تأییدشده توسط آموزشگاه
        </span>
      );
    }
    if (status === 'REVISION_REQUIRED' || status === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-xl border border-rose-200">
          <XCircle className="w-3.5 h-3.5" />
          نیازمند اصلاح / رد شده
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-xl border border-amber-200">
        <Clock className="w-3.5 h-3.5" />
        در انتظار بررسی کارشناس
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              پرونده هویتی، مدارک و اطلاعات خانواده
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            مشخصات فردی شناگر، تماس والدین، آدرس منزل و وضعیت بررسی مدارک رسمی
          </p>
        </div>

        <Link
          to="/swimmer/complete-profile"
          className="px-4 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-2xl transition-colors shadow-2xs flex items-center gap-2 cursor-pointer self-end md:self-auto"
        >
          <Edit3 className="w-4 h-4" />
          <span>ویرایش و بارگذاری مدارک جدید</span>
        </Link>
      </div>

      {/* Rejection alert banner if needed */}
      {profile?.documents_rejection_reason && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 space-y-1">
          <h4 className="font-bold flex items-center gap-1.5 text-rose-900 dark:text-rose-100">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            توضیحات کارشناس آموزشگاه در خصوص نقص مدارک:
          </h4>
          <p className="text-[11px] leading-relaxed pr-2">
            «{profile.documents_rejection_reason}»
          </p>
        </div>
      )}

      {/* Grid: Personal Info & Contact Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Details */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <User className="w-4 h-4 text-sky-600" />
            مشخصات سجلی و فردی شناگر
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">نام و نام خانوادگی:</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {profile?.full_name || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">کد ملی:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                {profile?.national_id || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">تاریخ تولد:</span>
              <span className="font-mono text-slate-800 dark:text-slate-100">
                {profile?.date_of_birth || 'ثبت‌نشده'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">نام پدر:</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {profile?.father_name || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">جنسیت:</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {profile?.gender_display || (profile?.gender === 'MALE' ? 'پسر / آقایان' : 'دختر / بانوان')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">نام مدرسه / مقطع:</span>
              <span className="text-slate-800 dark:text-slate-100">
                {profile?.school_name || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Contact & Address */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Phone className="w-4 h-4 text-sky-600" />
            اطلاعات تماس والدین و نشانی منزل
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">شماره همراه پدر:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                {profile?.father_phone || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">شماره همراه مادر:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                {profile?.mother_phone || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">مخاطب اضطراری:</span>
              <span className="text-slate-800 dark:text-slate-100">
                {profile?.emergency_contact_name || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">تلفن اضطراری:</span>
              <span className="font-mono text-slate-800 dark:text-slate-100">
                {profile?.emergency_contact_phone || '—'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block mb-0.5">نشانی منزل:</span>
              <span className="text-slate-800 dark:text-slate-200 leading-relaxed block">
                {profile?.address || 'ثبت‌نشده'}
              </span>
            </div>
            {profile?.latitude && profile?.longitude && (
              <div className="col-span-2 flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                <span>موقعیت مکانی: {profile.latitude}, {profile.longitude}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Documents Status Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          وضعیت مدارک هویتی و بیمه ورزشی
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Birth Certificate */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                صفحه اول شناسنامه
              </h4>
              {getDocStatusBadge(profile?.birth_certificate_status, profile?.birth_certificate_image)}
            </div>
            {profile?.birth_certificate_image ? (
              <div className="h-32 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 relative group border">
                <img
                  src={profile.birth_certificate_image}
                  alt="شناسنامه"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-32 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-xs text-slate-400 gap-1">
                <Upload className="w-6 h-6" />
                <span>مدرک بارگذاری نشده</span>
              </div>
            )}
          </div>

          {/* 2. National Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                کارت ملی هوشمند
              </h4>
              {getDocStatusBadge(profile?.national_card_status, profile?.national_card_image)}
            </div>
            {profile?.national_card_image ? (
              <div className="h-32 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 relative group border">
                <img
                  src={profile.national_card_image}
                  alt="کارت ملی"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-32 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-xs text-slate-400 gap-1">
                <Upload className="w-6 h-6" />
                <span>مدرک بارگذاری نشده</span>
              </div>
            )}
          </div>

          {/* 3. Sports Insurance */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                کارت بیمه ورزشی فدراسیون
              </h4>
              {getDocStatusBadge(profile?.sports_insurance_status, profile?.sports_insurance_image)}
            </div>
            {profile?.sports_insurance_image ? (
              <div className="h-32 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 relative group border">
                <img
                  src={profile.sports_insurance_image}
                  alt="بیمه ورزشی"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-32 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-xs text-slate-400 gap-1">
                <Upload className="w-6 h-6" />
                <span>مدرک بارگذاری نشده</span>
              </div>
            )}
            <div className="text-[11px] text-slate-500 font-mono">
              اعتبار بیمه: {profile?.sports_insurance_expiry || 'نامشخص'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
