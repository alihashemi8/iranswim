import React from 'react';

/**
 * IranSwim Bespoke Aquatic & Sports SVG Icon Set
 * Consistent 24x24 viewBox, 1.8px stroke width, round caps & joins.
 * Fully theme-adaptive via currentColor.
 */

// 1. Swimmer Front Crawl (کرال سینه - تکنیک و استقامت)
export const SwimmerCrawlIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Swimmer Head */}
    <circle cx="17.5" cy="6.5" r="2" />
    {/* High Elbow Catch Arm */}
    <path d="M14 8l3-3.5 3.5 2" />
    {/* Torso Angled in Glide */}
    <path d="M7 13.5l5.5-3.5 3 1.5" />
    {/* Trail Arm in Underwater Finish */}
    <path d="M10 11.5l-3 1.5-2-1" />
    {/* Flutter Kick Legs */}
    <path d="M7 13.5l-4.5 1M5 15.5l-2.5 1.5" />
    {/* Surface Water Waves */}
    <path d="M2 18.5c2.5-1 5 1 7.5 0s5-1 7.5 0 3.5-0.5 5-0.5" />
    <path d="M4 21.5c2-0.8 4 0.8 6 0s4-0.8 6 0 3 0.5 4 0" opacity="0.6" />
  </svg>
);

// 2. Swimmer Butterfly (شنای پروانه - قدرت و اوج)
export const SwimmerButterflyIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Head centered rising from crest */}
    <circle cx="12" cy="6" r="2" />
    {/* Dual Symmetrical Recovery Wings */}
    <path d="M3.5 9c2.5-3 5.5-2.5 7.5-0.5" />
    <path d="M20.5 9c-2.5-3-5.5-2.5-7.5-0.5" />
    {/* Chest & Undulating Spine */}
    <path d="M12 8.5v4.5" />
    {/* Dolphin Kick Propulsion */}
    <path d="M12 13l-2.5 4 2.5 2 2.5-2-2.5-4z" fill="currentColor" fillOpacity="0.15" />
    {/* Bow Wave Wake */}
    <path d="M2 15c3-1.5 6 1.5 9 0M13 15c3 1.5 6-1.5 9 0" />
    <path d="M5 19c2.5-1 5 1 7 0s4.5-1 7 0" opacity="0.5" />
  </svg>
);

// 3. Swimmer Breaststroke (شنای قورباغه - ریتم و هارمونی)
export const SwimmerBreaststrokeIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Swimmer Head */}
    <circle cx="12" cy="5" r="2" />
    {/* Sweeping Breaststroke Arm Catch */}
    <path d="M12 8c-3.2 0-5.5 2-5 4 0.6 2 3.5 2 5-0.5 1.5 2.5 4.4 2.5 5 0.5 0.5-2-1.8-4-5-4z" />
    {/* Body Torso */}
    <path d="M12 11.5v4" />
    {/* Whip Kick Legs */}
    <path d="M12 15.5l-3.5 3-2-1.5" />
    <path d="M12 15.5l3.5 3 2-1.5" />
    {/* Water Horizon */}
    <path d="M2 20.5c3-0.8 6 0.8 9 0s6-0.8 9 0" opacity="0.7" />
  </svg>
);

// 4. Swimmer Backstroke (کرال پشت - آرامش و استیل)
export const SwimmerBackstrokeIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Head floating looking up */}
    <circle cx="16.5" cy="8.5" r="2" />
    {/* Horizontal Floating Body */}
    <path d="M5.5 14h9l2-2" />
    {/* Upward Windmill Arm Entry */}
    <path d="M11 14l-2.5-6.5-2 1" />
    {/* Flutter Kick below water */}
    <path d="M5.5 14l-3 2M4.5 15.5l-2.5 1" />
    {/* Water Line embracing the swimmer */}
    <path d="M2 17c3-1 6 1 9 0s6-1 9 0" />
    <path d="M4 20c2.5-0.8 5 0.8 7.5 0s5-0.8 7.5 0" opacity="0.5" />
  </svg>
);

// 5. Olympic 50m Pool Lanes (لاین‌های استاندارد ۵۰ متری المپیک)
export const OlympicPoolLaneIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Back Wall of Pool */}
    <path d="M3 6h18" />
    {/* Left Outer Lane Line */}
    <path d="M3 6l-1 14h3l1-14" />
    {/* Center Left Lane Line with Float Marks */}
    <path d="M9 6l-1.5 14" strokeDasharray="2 2" />
    {/* Center T-Turn Axis Line */}
    <path d="M12 6v14" />
    <path d="M10 17h4" />
    {/* Center Right Lane Line */}
    <path d="M15 6l1.5 14" strokeDasharray="2 2" />
    {/* Right Outer Lane Line */}
    <path d="M21 6l1 14h-3l-1-14" />
    {/* Pool Water Reflection Waves */}
    <path d="M7 11c1.5-0.5 3 0.5 4.5 0" opacity="0.6" />
    <path d="M13 13c1.5-0.5 3 0.5 4.5 0" opacity="0.6" />
  </svg>
);

// 6. Ozone Molecule Purification (تصفیه مولکولی اوزون و آب کریستالی)
export const OzonePurificationIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Tri-atomic Ozone O3 Ring */}
    <circle cx="12" cy="5.5" r="2.5" />
    <circle cx="6.5" cy="15" r="2.5" />
    <circle cx="17.5" cy="15" r="2.5" />
    {/* Resonance Molecular Bonds */}
    <path d="M10.2 7.5L8 12.8" />
    <path d="M13.8 7.5L16 12.8" />
    <path d="M9.2 15h5.6" strokeDasharray="2 1.5" />
    {/* Oxygen Bubbles of Purity */}
    <circle cx="12" cy="11.5" r="1" fill="currentColor" />
    <path d="M12 18.5v3M10.5 20h3" />
    {/* Purified Droplet */}
    <path d="M12 18c1.5 0 2.5 1 2.5 2s-1 2-2.5 2-2.5-1-2.5-2 1-2 2.5-2z" opacity="0.4" />
  </svg>
);

// 7. Ergonomic Spine & Hydrotherapy (اصلاح ناهنجاری اسکلتی و هیدروتراپی)
export const HydroTherapySpineIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Natural Cervical, Thoracic & Lumbar S-Curve */}
    <path d="M12 2.5c-1.5 1.5-2 3.5-1 5.5s2 4 1 6-2 4-1 6 1.5 1.5 1 2" />
    {/* Vertebra Alignment Segments */}
    <line x1="9" y1="4.5" x2="15" y2="4.5" />
    <line x1="8" y1="8" x2="16" y2="8" />
    <line x1="7.5" y1="11.5" x2="16.5" y2="11.5" />
    <line x1="8" y1="15" x2="16" y2="15" />
    <line x1="9" y1="18.5" x2="15" y2="18.5" />
    {/* Fluid Supportive Water Waves */}
    <path d="M3 11c1.5-1 3 0 4.5 0" opacity="0.6" />
    <path d="M16.5 13c1.5 0 3 1 4.5 0" opacity="0.6" />
    <path d="M2.5 16c2-0.8 4 0.8 6 0" opacity="0.4" />
    <path d="M15.5 18c2-0.8 4 0.8 6 0" opacity="0.4" />
  </svg>
);

// 8. Cardio Aquatic Rhythm (سلامت قلبی-تنفسی با پالس‌های موجی)
export const CardioAquaticIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Athletic Heart Shield */}
    <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
    {/* Dynamic ECG combined with Water Ripple */}
    <path d="M6 12h2.5l1.5-3.5 2.5 7 2-4.5 1.5 2h2" />
    {/* Air Lung Droplet Bubbles */}
    <circle cx="16" cy="6" r="1" fill="currentColor" opacity="0.8" />
    <circle cx="18" cy="4" r="0.7" fill="currentColor" opacity="0.6" />
  </svg>
);

// 9. Olympic Split Stopwatch (کرنومتر و رکوردهای صدم‌ثانیه‌ای)
export const OlympicStopwatchIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Outer Stopwatch Casing */}
    <circle cx="12" cy="13.5" r="8" />
    {/* Precision Chrono Hands */}
    <path d="M12 13.5v-4" />
    <path d="M12 13.5l3 2" />
    {/* Top Pushers */}
    <path d="M12 5.5v-3M9.5 2.5h5" />
    <path d="M18 7.5l1.8-1.8M17.5 4.5l2 2" />
    {/* Water Flow Wake beneath */}
    <path d="M4 22c2.5-0.8 5 0.8 8 0s5.5-0.8 8 0" opacity="0.6" />
  </svg>
);

// 10. Certified Rescue Buoy (نجات‌غریق رسمی و حلقه حیات فدراسیون)
export const RescueBuoyRingIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Outer Torus */}
    <circle cx="12" cy="12" r="9.5" />
    {/* Inner Passage */}
    <circle cx="12" cy="12" r="4.5" />
    {/* 4 Quadrant Harness Straps */}
    <line x1="12" y1="2.5" x2="12" y2="7.5" />
    <line x1="12" y1="16.5" x2="12" y2="21.5" />
    <line x1="2.5" y1="12" x2="7.5" y2="12" />
    <line x1="16.5" y1="12" x2="21.5" y2="12" />
    {/* Perimeter Grab Lifeline */}
    <path d="M5 5c-1.5 2-1.5 4-0.5 6" strokeDasharray="1.5 1.5" />
    <path d="M19 5c1.5 2 1.5 4 0.5 6" strokeDasharray="1.5 1.5" />
    <path d="M5 19c-1.5-2-1.5-4-0.5-6" strokeDasharray="1.5 1.5" />
    <path d="M19 19c1.5-2 1.5-4 0.5-6" strokeDasharray="1.5 1.5" />
  </svg>
);

// 11. Finnish Sauna & Thermal Spa (سونای خشک فنلاندی، بخار اکالیپتوس و ریکاوری)
export const SaunaThermalSpaIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Heated Volcanic Sauna Stones */}
    <path d="M5 19.5c0-1.5 1.8-2.5 3.5-2.5s3 1 3.5 2.5" />
    <path d="M12 19.5c0-1.5 1.8-2.5 3.5-2.5s3 1 3.5 2.5" />
    <path d="M8.5 17c0-1.5 1.6-2.5 3.5-2.5s3.5 1 3.5 2.5" />
    <path d="M3 21h18" />
    {/* Rising Eucalyptus Thermal Vapors */}
    <path d="M8 12.5c-1-2 1-3 0-5s-1-3 0-5" />
    <path d="M12 11c-1.2-2 1.2-3 0-5s-1.2-3 0-5" />
    <path d="M16 12.5c-1-2 1-3 0-5s-1-3 0-5" />
  </svg>
);

// 12. Dry-Land Swim Ergometer (تمرینات تخصصی کش و بدنسازی خشکی)
export const DryLandSwimGymIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Dumbbell / Pulley Weight Core */}
    <path d="M4 9h2v6H4zM18 9h2v6h-2z" />
    <path d="M2 11h2v2H2zM20 11h2v2h-2z" />
    {/* Ergonomic Cable Cross Axis */}
    <path d="M6 12h12" />
    {/* Swim Stroke Elastic Cords Tension Arc */}
    <path d="M8 7c2-2 6-2 8 0" strokeDasharray="2 1.5" />
    <path d="M8 17c2 2 6 2 8 0" strokeDasharray="2 1.5" />
    {/* Swimmer Grip Paddles */}
    <circle cx="8" cy="7" r="1" fill="currentColor" />
    <circle cx="16" cy="7" r="1" fill="currentColor" />
  </svg>
);

// 13. Aquatic Victory Trophy & Laurel (کاپ قهرمانی المپیک با نقش امواج)
export const WaterMedalTrophyIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Cup Body with wave cut */}
    <path d="M6 4h12v6c0 3.3-2.7 6-6 6s-6-2.7-6-6V4z" />
    {/* Left and Right Handles */}
    <path d="M6 6H3a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4h1" />
    <path d="M18 6h3a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4h-1" />
    {/* Stem & Pedestal */}
    <path d="M12 16v3" />
    <path d="M8 21h8M9 19h6" />
    {/* Water Crest inside Cup */}
    <path d="M8.5 9c1-0.8 2 0.8 3.5 0s2.5 0.8 3.5 0" />
  </svg>
);

// 14. Synchronized Swim Grace (شنای موزون، ریتم و آب‌بازی نونهالان)
export const SynchroSwimIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Vertical Artistic Ballet Leg out of water */}
    <path d="M12 3v12" />
    <path d="M12 3l3 2" />
    {/* Second angled arching leg */}
    <path d="M12 10l-4-3-2 1" />
    {/* Water Splash Ring */}
    <ellipse cx="12" cy="15" rx="8" ry="2.5" />
    <path d="M7 18c2-0.6 4 0.6 5 0s3-0.6 5 0" opacity="0.6" />
    {/* Sparkle drops */}
    <circle cx="7" cy="8" r="0.8" fill="currentColor" />
    <circle cx="17" cy="6" r="0.8" fill="currentColor" />
  </svg>
);

// 15. Olympic Starting Block (سکوی استارت سنسوردار فدراسیونی)
export const PoolStartingBlockIcon = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Pool Deck Edge */}
    <path d="M2 18h20" />
    {/* Angled Starting Platform */}
    <path d="M5 11l9-3.5 1 2.5-9 3.5z" fill="currentColor" fillOpacity="0.1" />
    <path d="M5 11l9-3.5" />
    {/* Support Post */}
    <path d="M9 12.5v5.5" />
    <path d="M13 11v7" />
    {/* Adjustable Wedge */}
    <path d="M12.5 8.5l1.5-2.5" />
    {/* Water Ripple at base */}
    <path d="M3 21c2.5-0.6 5 0.6 7.5 0s5-0.6 7.5 0" opacity="0.5" />
  </svg>
);
