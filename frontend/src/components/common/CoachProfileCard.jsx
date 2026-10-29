import React, { useState } from 'react';
import { Award, ShieldCheck, MapPin, CheckCircle2, User } from 'lucide-react';

/**
 * Redesigned Swimming Coach Profile Card
 * - Proportional ~3/4 desktop width (balanced 3-column / 430px max layout)
 * - Prominent, large circular avatar (144px)
 * - Geometrically concentric circular arc perfectly matching the avatar circle
 * - Uniform 13px breathing air gap (zero touch with card)
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
    if (match) return `${match[1]} سال سابقه`;
    if (bio.includes('۱۰ سال')) return '۱۰ سال سابقه';
    if (bio.includes('۱۲ سال')) return '۱۲ سال سابقه';
    if (bio.includes('۸ سال')) return '۸ سال سابقه';
    return 'مربی باسابقه';
  };

  // Extract certification
  const getCertificationText = () => {
    const spec = (coach.specialties || '').toLowerCase();
    const bio = (coach.bio || '').toLowerCase();
    if (spec.includes('نجات غریق') || bio.includes('نجات غریق')) {
      return 'نجات‌غریق ۱';
    }
    if (bio.includes('کارشناس تربیت بدنی')) {
      return 'تربیت بدنی';
    }
    if (bio.includes('مدرس رسمی')) {
      return 'مدرس فدراسیون';
    }
    return 'مربی فدراسیون';
  };

  // Specialties parsed as tags
  const specialtiesList = (coach.specialties || '')
    .split(/[,،]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div
      className={`coach-profile-card-wrapper relative pt-[84px] pb-2 w-full max-w-[430px] mx-auto group select-none ${className}`}
      dir="rtl"
    >
      {/* =========================================================================
          1. Overlapping Circular Avatar (Large 144px, Decoupled with Constant 13px Gap)
          ========================================================================= */}
      <div className="absolute top-[20px] left-1/2 -translate-x-1/2 z-20 w-[136px] h-[136px] sm:w-[144px] sm:h-[144px] rounded-full p-1 bg-white ring-1 ring-sky-200/90 shadow-[0_14px_30px_rgba(15,43,56,0.18)] transition-transform duration-300 group-hover:scale-105">
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
              <User className="w-16 h-16 text-sky-600/70" strokeWidth={1.75} />
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          2. Unified Card Container with Concentric Curved Top Edge & Filter Shadow
          ========================================================================= */}
      <div className="coach-card-body-shell flex flex-col w-full transition-all duration-300 group-hover:-translate-y-1">
        
        {/* Top Boundary with Exact Concentric Circular Arc & Smooth Tangent Fillets */}
        <div className="flex items-stretch h-[98px] w-full -mb-[1px]">
          {/* Right Shoulder (RTL right) */}
          <div className="flex-1 bg-white border-t-[1.5px] border-r-[1.5px] border-[#bae0eb] rounded-tr-2xl sm:rounded-tr-3xl transition-colors duration-300 group-hover:border-sky-300/90" />

          {/* Center Concentric Notch SVG (Exact circular arc radius 85px concentric to avatar radius 72px) */}
          <div className="w-[208.6px] h-[98px] shrink-0 relative overflow-visible">
            <svg
              className="w-full h-full block"
              viewBox="0 0 208.6 98"
              fill="none"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {/* Card Fill */}
              <path
                d="M 0 0 A 20 20 0 0 0 19.9 17.7 A 85 85 0 0 0 188.8 17.7 A 20 20 0 0 0 208.6 0 L 208.6 98 L 0 98 Z"
                fill="#ffffff"
              />
              {/* Curved Top Stroke */}
              <path
                d="M 0 0.75 A 20 20 0 0 0 19.9 17.7 A 85 85 0 0 0 188.8 17.7 A 20 20 0 0 0 208.6 0.75"
                stroke="#bae0eb"
                strokeWidth="1.5"
                className="transition-colors duration-300 group-hover:stroke-sky-300/90"
              />
            </svg>
          </div>

          {/* Left Shoulder (RTL left) */}
          <div className="flex-1 bg-white border-t-[1.5px] border-l-[1.5px] border-[#bae0eb] rounded-tl-2xl sm:rounded-tl-3xl transition-colors duration-300 group-hover:border-sky-300/90" />
        </div>

        {/* Card Main Body */}
        <div className="bg-white border-b-[1.5px] border-x-[1.5px] border-[#bae0eb] rounded-b-2xl sm:rounded-b-3xl px-5 sm:px-6 pt-5 pb-6 text-center space-y-3.5 transition-colors duration-300 group-hover:border-sky-300/90 flex flex-col justify-between h-full">
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
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 text-xs text-[#486875] border-y border-sky-100/90 py-2.5 my-3.5">
              <span className="flex items-center gap-1 font-medium">
                <Award className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                {getExperienceText()}
              </span>
              <span className="w-1 h-1 rounded-full bg-sky-300 inline-block" />
              <span className="flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                {getCertificationText()}
              </span>
              <span className="w-1 h-1 rounded-full bg-sky-300 inline-block" />
              <span className="flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                قزوین
              </span>
            </div>

            {/* 4. Readable Persian Biography */}
            <p className="text-xs text-[#486875] leading-relaxed line-clamp-3">
              {coach.bio || 'مدرس باسابقه دوره‌های تخصصی شنای پایه و قهرمانی با سابقه درخشان در آموزش شناگران استان قزوین'}
            </p>
          </div>

          {/* 5. Supported Specialties Section */}
          {specialtiesList.length > 0 && (
            <div className="mt-2 bg-[#f0f8fb] border border-sky-100/90 rounded-2xl p-2.5 flex flex-wrap items-center justify-center gap-1.5">
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
              تأییدیه فدراسیون ✓
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
