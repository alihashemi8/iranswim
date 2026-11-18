import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Sparkles, ShieldCheck, Clock, BookOpen,
  ArrowLeft, X, Trophy, Waves, Star, ChevronLeft, Check, Compass
} from 'lucide-react';
import { SwimCourseSpecsIcon, CourseLogoIcon } from '../common/AquaticIcons';

export const RegistrationSuccessModal = ({
  isOpen = false,
  onClose = () => {},
  swimmerName = 'شناگر گرامی',
  coursesUrl = '/swimmer/courses',
  dashboardUrl = '/swimmer',
}) => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handleGoToCourses = () => {
    onClose();
    navigate(coursesUrl);
  };

  const handleGoToDashboard = () => {
    onClose();
    navigate(dashboardUrl);
  };

  const modalContent = (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reg-success-title"
    >
      {/* 1. BACKDROP WITH AQUATIC GLASSMORPHISM */}
      <div
        className="fixed inset-0 bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* 2. MAIN MODAL CONTAINER */}
      <div className="relative w-full max-w-lg md:max-w-xl bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[32px] border border-sky-200/80 dark:border-sky-800/80 shadow-2xl shadow-sky-950/30 overflow-hidden z-10 transition-all animate-modal-pop my-auto">
        {/* Top Decorative Aquatic Wave Header (Gradated Ocean Cyan) */}
        <div className="relative h-28 sm:h-32 bg-gradient-to-br from-blue-600 via-sky-600 to-cyan-500 overflow-hidden flex items-center justify-center">
          {/* Animated Background Rings & Water Glimmer */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white blur-xl" />
            <div className="absolute -bottom-8 -left-8 w-44 h-44 rounded-full bg-cyan-300 blur-lg" />
          </div>

          {/* Floating Celebratory Sparkles */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-around px-8 opacity-75">
            <span className="animate-float-gentle text-amber-300 text-lg">✦</span>
            <span className="animate-float-gentle text-cyan-200 text-sm" style={{ animationDelay: '0.6s' }}>✦</span>
            <span className="animate-float-gentle text-white text-base" style={{ animationDelay: '1.2s' }}>★</span>
            <span className="animate-float-gentle text-sky-200 text-xs" style={{ animationDelay: '1.8s' }}>✦</span>
            <span className="animate-float-gentle text-amber-200 text-sm" style={{ animationDelay: '0.9s' }}>★</span>
          </div>

          {/* Close button in top-left corner */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 left-3.5 w-8 h-8 rounded-full bg-black/15 hover:bg-black/25 text-white/90 hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs z-20"
            aria-label="بستن پنجره"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Animated Water Ripples around Emblem */}
          <div className="absolute -bottom-10 flex items-center justify-center">
            <div className="absolute w-24 h-24 rounded-full bg-sky-400/30 dark:bg-sky-500/20 animate-pulse-ripple" />
            <div className="absolute w-24 h-24 rounded-full bg-cyan-300/30 dark:bg-cyan-400/20 animate-pulse-ripple" style={{ animationDelay: '1.1s' }} />

            {/* Central Luminous Floating Emblem */}
            <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-tr from-sky-500 via-cyan-400 to-teal-300 p-1 shadow-xl shadow-sky-900/30 flex items-center justify-center animate-float-gentle">
              <div className="w-full h-full rounded-[22px] bg-slate-900 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/40 via-sky-500/30 to-cyan-400/40" />
                <CourseLogoIcon className="w-10 h-10 sm:w-11 sm:h-11 text-cyan-200 drop-shadow-md relative z-10" />

                {/* Micro Check Badge on the emblem corner */}
                <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-slate-900 shadow-xs z-20">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. MODAL BODY */}
        <div className="pt-12 sm:pt-14 px-5 sm:px-7 pb-6 sm:pb-7 text-center space-y-4 sm:space-y-5">
          {/* Status Chip: Pending Support Review */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 text-xs font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>منتظر تأیید مدارک هویتی خود از سمت پشتیبانی باشید</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-1.5">
            <h3
              id="reg-success-title"
              className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight"
            >
              اطلاعات شما با موفقیت ثبت شد!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
              <strong className="text-slate-900 dark:text-white font-bold">{swimmerName}</strong> عزیز، اطلاعات هویتی و مدارک ۳ مرحله‌ای شما دریافت و در صف بررسی کارشناسان قرار گرفت.
            </p>
          </div>

          {/* HIGHLIGHT PROMO CARD FOR COURSES */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-50 via-cyan-50/50 to-blue-50 dark:from-slate-800/90 dark:via-sky-950/40 dark:to-slate-800/90 border border-sky-200/90 dark:border-sky-700/80 p-4 sm:p-5 text-right shadow-xs">
            <div className="absolute top-0 left-0 w-32 h-32 bg-sky-400/10 dark:bg-sky-400/5 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-start gap-3.5">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20">
                <BookOpen className="w-5 h-5" />
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span>همین حالا دوره‌ها را مشاهده و ثبت‌نام کنید!</span>
                  </h4>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  دوره‌های اختصاصی متناسب با <strong className="text-sky-700 dark:text-sky-300">جنسیت و رده سنی شما</strong> آماده و فیلتر شده‌اند. نیازی به انتظار برای شروع شنا نیست؛ همین لحظه می‌توانید دوره دلخواه خود را رزرو فرمایید.
                </p>

                {/* Feature tags */}
                <div className="flex flex-wrap items-center gap-2 pt-1.5 text-[10px] sm:text-[11px] font-semibold text-sky-800 dark:text-sky-300">
                  <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-900/80 px-2 py-0.5 rounded-md border border-sky-200/60 dark:border-sky-800/60">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>فیلتر هوشمند سن و جنسیت</span>
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-900/80 px-2 py-0.5 rounded-md border border-sky-200/60 dark:border-sky-800/60">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>امکان پرداخت اقساطی شهریه</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. ACTION BUTTONS */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3">
            {/* Primary Action Button: View & Enroll in Courses */}
            <button
              type="button"
              onClick={handleGoToCourses}
              className="flex-1 py-3 sm:py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-600 hover:from-sky-700 hover:via-blue-700 hover:to-cyan-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-sky-600/30 hover:shadow-xl hover:shadow-sky-600/40 transition-all flex items-center justify-center gap-2 group cursor-pointer animate-shimmer-btn ring-2 ring-white/20 dark:ring-sky-500/20"
            >
              <BookOpen className="w-4 h-4 text-cyan-200 group-hover:scale-110 transition-transform" />
              <span>مشاهده و ثبت‌نام در دوره‌ها</span>
              <ArrowLeft className="w-4 h-4 text-sky-200 group-hover:-translate-x-1 transition-transform" />
            </button>

            {/* Secondary Action: Go to Swimmer Dashboard */}
            <button
              type="button"
              onClick={handleGoToDashboard}
              className="py-3 sm:py-3.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition-all border border-slate-200/80 dark:border-slate-700/80 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>ورود به داشبورد</span>
            </button>
          </div>

          {/* Trust Footnote */}
          <div className="pt-1 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>واحد پذیرش و پشتیبانی ایران‌سویم در ساعات کاری مدارک شما را بررسی می‌نماید.</span>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
