import React, { useState } from 'react';
import { Award, ShieldCheck, MapPin, CheckCircle2, User, Sparkles } from 'lucide-react';

/**
 * Redesigned Swimming Coach Profile Card
 * - Wide horizontal card layout with generous spacing
 * - Large circular profile avatar overlapping top edge
 * - Custom smooth, symmetrical concave curved top edge that wraps around avatar
 * - Clear Persian typography hierarchy
 * - Responsive from mobile to desktop
 */
export const CoachProfileCard = ({
  coach,
  avatarUrl: customAvatarUrl,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  if (!coach) return null;

  // Resolve avatar URL from coach data or curated portraits
  const getResolvedAvatar = () => {
    if (customAvatarUrl) return customAvatarUrl;
    if (coach.avatar) return coach.avatar;
    if (coach.profile_image) return coach.profile_image;
    if (coach.image) return coach.image;
    if (coach.photo) return coach.photo;

    const name = coach.full_name || '';
    if (name.includes('سارا')) {
      return 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80';
    }
    if (name.includes('نیما')) {
      return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80';
    }
    if (name.includes('علیرضا')) {
      return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=500&q=80';
    }
    if (name.includes('مهدی')) {
      return 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=500&q=80';
    }
    if (name.includes('رضایی') || name.includes('محمد')) {
      return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80';
    }
    return null;
  };

  const avatarUrl = getResolvedAvatar();
  const hasValidPhoto = avatarUrl && !imgError;

  // Extract experience from bio if present, else fallback
  const getExperienceText = () => {
    const bio = coach.bio || '';
    const match = bio.match(/(\d+)\s*سال\s*سابقه/);
    if (match) return `${match[1]} سال سابقه مربیگری`;
    if (bio.includes('۱۰ سال')) return '۱۰ سال سابقه';
    if (bio.includes('۱۲ سال')) return '۱۲ سال سابقه';
    if (bio.includes('۸ سال')) return '۸ سال سابقه';
    return 'مربی رسمی و باسابقه';
  };

  // Extract certification
  const getCertificationText = () => {
    const spec = (coach.specialties || '').toLowerCase();
    const bio = (coach.bio || '').toLowerCase();
    if (spec.includes('نجات غریق') || bio.includes('نجات غریق')) {
      return 'نجات‌غریق فدراسیون';
    }
    if (bio.includes('کارشناس تربیت بدنی')) {
      return 'کارشناس تربیت بدنی';
    }
    if (bio.includes('مدرس رسمی')) {
      return 'مدرس رسمی فدراسیون';
    }
    return 'مدرک مربیگری فدراسیون';
  };

  // Specialties parsed as tags
  const specialtiesList = (coach.specialties || '')
    .split(/[,،]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div
      className={`coach-profile-card-wrapper relative pt-14 pb-2 w-full max-w-2xl mx-auto group select-none ${className}`}
      dir="rtl"
    >
      {/* =========================================================================
          1. Overlapping Circular Avatar (Horizontally Centered)
          ========================================================================= */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 w-24 h-24 sm:w-26 sm:h-26 md:w-28 md:h-28 rounded-full p-1 bg-white ring-1 ring-sky-200/90 shadow-[0_10px_24px_rgba(15,43,56,0.15)] transition-transform duration-300 group-hover:scale-105">
        <div className="relative w-full h-full rounded-full overflow-hidden bg-sky-50">
          {hasValidPhoto ? (
            <img
              src={avatarUrl}
              alt={coach.full_name || 'مربی شنا'}
              className="w-full h-full object-cover rounded-full"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-sky-100 via-sky-50 to-teal-50 flex items-center justify-center text-sky-600">
              <User className="w-11 h-11 sm:w-12 sm:h-12 text-sky-600/70" strokeWidth={1.75} />
            </div>
          )}
        </div>

        {/* Federation Verified Check Badge */}
        <div
          className="absolute bottom-0.5 left-0.5 sm:bottom-1 sm:left-1 w-6 h-6 sm:w-7 sm:h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center border-2 border-white text-xs font-bold shadow-xs"
          title="دارای مدرک رسمی و معتبر فدراسیون شنا"
        >
          ✓
        </div>
      </div>

      {/* =========================================================================
          2. Unified Card Container with Curved Top Edge & Filter Shadow
          ========================================================================= */}
      <div className="coach-card-body-shell flex flex-col w-full transition-all duration-300 group-hover:-translate-y-1">
        
        {/* Top Boundary with Smooth Concave Curve Indentation */}
        <div className="flex items-stretch h-11 sm:h-12 w-full -mb-[1px]">
          {/* Right Shoulder (RTL layout: right side of card) */}
          <div className="flex-1 bg-white border-t-[1.5px] border-r-[1.5px] border-[#bae0eb] rounded-tr-2xl sm:rounded-tr-3xl transition-colors duration-300 group-hover:border-sky-300/90" />

          {/* Concave Notch SVG (Smoothly descending and ascending around avatar) */}
          <div className="w-[130px] sm:w-[144px] h-11 sm:h-12 shrink-0 relative overflow-visible">
            <svg
              className="w-full h-full block"
              viewBox="0 0 144 48"
              fill="none"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {/* Card Fill */}
              <path
                d="M 0 0 C 34 0, 42 44, 72 44 C 102 44, 110 0, 144 0 L 144 48 L 0 48 Z"
                fill="#ffffff"
              />
              {/* Curved Top Stroke */}
              <path
                d="M 0 0.75 C 34 0.75, 42 44, 72 44 C 102 44, 110 0.75, 144 0.75"
                stroke="#bae0eb"
                strokeWidth="1.5"
                className="transition-colors duration-300 group-hover:stroke-sky-300/90"
              />
            </svg>
          </div>

          {/* Left Shoulder (RTL layout: left side of card) */}
          <div className="flex-1 bg-white border-t-[1.5px] border-l-[1.5px] border-[#bae0eb] rounded-tl-2xl sm:rounded-tl-3xl transition-colors duration-300 group-hover:border-sky-300/90" />
        </div>

        {/* Card Main Body */}
        <div className="bg-white border-b-[1.5px] border-x-[1.5px] border-[#bae0eb] rounded-b-2xl sm:rounded-b-3xl px-5 sm:px-8 pt-5 pb-6 text-center space-y-3.5 transition-colors duration-300 group-hover:border-sky-300/90 flex flex-col justify-between h-full">
          <div>
            {/* 1. Coach Name */}
            <h3 className="text-xl sm:text-2xl font-black text-[#0f2c3d] tracking-tight">
              {coach.full_name}
            </h3>

            {/* 2. Professional Role */}
            <div className="mt-1.5 flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-sky-50 text-sky-700 text-xs font-bold border border-sky-200/70 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                مربی رسمی فدراسیون شنا
              </span>
            </div>

            {/* 3. Metadata Row */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3.5 text-xs text-[#486875] border-y border-sky-100/90 py-2.5 my-3.5">
              <span className="flex items-center gap-1 font-medium">
                <Award className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                {getExperienceText()}
              </span>
              <span className="w-1 h-1 rounded-full bg-sky-300 hidden sm:inline-block" />
              <span className="flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                {getCertificationText()}
              </span>
              <span className="w-1 h-1 rounded-full bg-sky-300 hidden sm:inline-block" />
              <span className="flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                استخرهای قزوین
              </span>
            </div>

            {/* 4. Readable Persian Biography */}
            <p className="text-xs sm:text-sm text-[#486875] leading-relaxed max-w-lg mx-auto text-center line-clamp-3">
              {coach.bio || 'مدرس باسابقه دوره‌های تخصصی شنای پایه و قهرمانی با سابقه درخشان در آموزش شناگران استان قزوین'}
            </p>
          </div>

          {/* 5. Supported Specialties Section */}
          {specialtiesList.length > 0 && (
            <div className="mt-2 bg-[#f0f8fb] border border-sky-100/90 rounded-2xl p-2.5 sm:p-3 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              <span className="text-xs font-bold text-sky-900 ml-1">تخصص‌ها:</span>
              {specialtiesList.map((spec, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-white rounded-lg text-xs font-semibold text-sky-800 shadow-2xs border border-sky-200/50"
                >
                  {spec}
                </span>
              ))}
            </div>
          )}

          {/* Bottom Card Footer: Status & Badge */}
          <div className="pt-2 border-t border-sky-100/60 flex items-center justify-between text-[11px] text-[#587684]">
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              وضعیت: فعال و مجاز
            </span>
            <span className="font-mono text-sky-700/80 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
              تأییدیه فدراسیون شنا ✓
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
