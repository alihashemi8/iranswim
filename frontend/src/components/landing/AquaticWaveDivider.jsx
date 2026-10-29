import React from 'react';

/**
 * AquaticWaveDivider
 * Creates an organic, multi-layered swimming pool wave transition between landing page sections.
 * Smoothly blends colors without any sharp horizontal cuts or Mach banding artifacts.
 */
export function AquaticWaveDivider({
  topColor = 'transparent',
  bottomColor = '#c5e3f5',
  crestColor = 'rgba(255, 255, 255, 0.55)',
  flip = false,
  className = '',
}) {
  return (
    <div
      className={`relative w-full overflow-hidden leading-none pointer-events-none select-none z-10 -my-[1px] ${className}`}
      style={{ backgroundColor: topColor }}
      aria-hidden="true"
    >
      <svg
        className={`w-full h-8 sm:h-12 lg:h-16 block transition-transform duration-300 ${
          flip ? '-scale-x-100' : ''
        }`}
        viewBox="0 0 1440 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        {/* Layer 1: Semi-transparent rear wave for visual fluid depth */}
        <path
          d="M0,32 C220,70 420,12 640,44 C860,76 1080,24 1260,54 C1360,68 1410,48 1440,42 L1440,96 L0,96 Z"
          fill={bottomColor}
          fillOpacity="0.45"
        />

        {/* Layer 2: Main foreground organic water wave connecting directly to the next section */}
        <path
          d="M0,54 C260,18 460,82 720,48 C980,14 1200,74 1440,40 L1440,96 L0,96 Z"
          fill={bottomColor}
        />

        {/* Layer 3: Sunlit pool surface ripple highlight on the wave crest */}
        <path
          d="M0,54 C260,18 460,82 720,48 C980,14 1200,74 1440,40"
          stroke={crestColor}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

export default AquaticWaveDivider;
