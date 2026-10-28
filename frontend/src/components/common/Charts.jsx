import React, { useState } from 'react';

/**
 * Smooth SVG Area Trend Chart
 * Ideal for Server Latency, Error Trends, or Lap Progression
 */
export const SparklineAreaChart = ({
  data = [],
  height = 120,
  color = 'sky',
  valueFormatter = (v) => v,
  labelFormatter = (l) => l,
  title,
}) => {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-28 text-xs text-slate-400">
        داده‌ای برای نمایش نمودار وجود ندارد
      </div>
    );
  }

  const values = data.map((d) => Number(d.value || 0));
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values, 1);
  const range = maxVal - minVal || 1;

  const paddingX = 16;
  const paddingY = 16;
  const width = 480;
  const effectiveHeight = height - paddingY * 2;
  const effectiveWidth = width - paddingX * 2;

  // Calculate coordinates
  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(data.length - 1, 1)) * effectiveWidth;
    const normalizedY = (Number(d.value || 0) - minVal) / range;
    const y = height - paddingY - normalizedY * effectiveHeight;
    return { x, y, ...d };
  });

  // Construct SVG Path
  const linePath = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  const colorConfig = {
    sky: {
      stroke: '#0284c7',
      fill: 'url(#skyGradient)',
      dot: '#0369a1',
      glow: 'rgba(2, 132, 199, 0.15)',
    },
    emerald: {
      stroke: '#059669',
      fill: 'url(#emeraldGradient)',
      dot: '#047857',
      glow: 'rgba(5, 150, 105, 0.15)',
    },
    amber: {
      stroke: '#d97706',
      fill: 'url(#amberGradient)',
      dot: '#b45309',
      glow: 'rgba(217, 119, 6, 0.15)',
    },
    rose: {
      stroke: '#e11d48',
      fill: 'url(#roseGradient)',
      dot: '#be123c',
      glow: 'rgba(225, 29, 72, 0.15)',
    },
  };

  const activeColor = colorConfig[color] || colorConfig.sky;
  const hoveredPoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="relative w-full">
      {title && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700">{title}</span>
          {hoveredPoint ? (
            <span className="text-xs font-mono font-bold text-sky-700">
              {labelFormatter(hoveredPoint.label)}: {valueFormatter(hoveredPoint.value)}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 font-mono">
              بیشترین: {valueFormatter(maxVal)}
            </span>
          )}
        </div>
      )}

      <div className="w-full overflow-hidden rounded-xl bg-slate-50/70 p-2 border border-slate-100">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fb7185" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#fb7185" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="#e2e8f0"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <line
            x1={paddingX}
            y1={height / 2}
            x2={width - paddingX}
            y2={height / 2}
            stroke="#e2e8f0"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="#cbd5e1"
            strokeWidth="1"
          />

          {/* Area Fill */}
          <path d={areaPath} fill={activeColor.fill} />

          {/* Line Stroke */}
          <path
            d={linePath}
            fill="none"
            stroke={activeColor.stroke}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points and Interaction Circles */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoverIndex === i ? '5' : '3'}
                fill={activeColor.dot}
                stroke="#ffffff"
                strokeWidth="1.5"
                className="transition-all"
              />
              {/* Invisible wide hit area for hover */}
              <rect
                x={pt.x - 14}
                y={0}
                width={28}
                height={height}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                className="cursor-pointer"
              />
            </g>
          ))}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between items-center px-2 pt-2 text-[10px] text-slate-400 font-mono">
          <span>{labelFormatter(data[0]?.label)}</span>
          {data.length > 2 && <span>{labelFormatter(data[Math.floor(data.length / 2)]?.label)}</span>}
          <span>{labelFormatter(data[data.length - 1]?.label)}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Vertical Bar Chart Component
 */
export const BarChart = ({
  data = [],
  title,
  valueFormatter = (v) => v,
  color = 'sky',
}) => {
  const [activeItem, setActiveItem] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-xs text-slate-400">
        داده‌ای برای نمایش میله‌ای وجود ندارد
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => Number(d.value || 0)), 1);

  const colors = {
    sky: 'bg-sky-500 hover:bg-sky-600',
    emerald: 'bg-emerald-500 hover:bg-emerald-600',
    indigo: 'bg-indigo-500 hover:bg-indigo-600',
  };

  return (
    <div className="space-y-3 w-full">
      {title && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{title}</span>
          {activeItem && (
            <span className="text-xs font-mono font-bold text-sky-700 dark:text-sky-300">
              {activeItem.label}: {valueFormatter(activeItem.value)}
            </span>
          )}
        </div>
      )}

      <div className="h-40 flex items-end gap-2 sm:gap-4 p-3 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
        {data.map((item, idx) => {
          const heightPercent = Math.max((Number(item.value || 0) / maxValue) * 100, 6);
          const isSelected = activeItem?.label === item.label;

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
              onMouseEnter={() => setActiveItem(item)}
              onMouseLeave={() => setActiveItem(null)}
            >
              <div className="text-[10px] font-mono text-slate-400 dark:text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {valueFormatter(item.value)}
              </div>
              <div className="w-full max-w-[40px] bg-slate-200/60 dark:bg-slate-700/60 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t-lg transition-all duration-500 ${
                    isSelected ? 'bg-sky-600 dark:bg-sky-500' : colors[color] || colors.sky
                  }`}
                />
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-mono truncate max-w-[50px] text-center">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Metric Progress Bar with Target
 */
export const ProgressBar = ({
  value = 0,
  max = 100,
  label,
  subtitle,
  color = 'teal',
}) => {
  const percentage = Math.min(Math.round((value / (max || 1)) * 100), 100);

  const gradients = {
    blue: 'from-blue-600 to-sky-500',
    sky: 'from-sky-500 to-cyan-500',
    teal: 'from-teal-600 to-cyan-500',
    emerald: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-500 to-yellow-500',
    coral: 'from-orange-500 to-amber-500',
    violet: 'from-violet-600 to-indigo-500',
    rose: 'from-rose-500 to-pink-500',
  };

  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center justify-between">
        <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">{label}</span>
        <span className="font-mono font-black text-sm sm:text-base text-slate-800 dark:text-slate-200">٪{percentage}</span>
      </div>
      <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60">
        <div
          style={{ width: `${percentage}%` }}
          className={`h-full rounded-full bg-gradient-to-l ${gradients[color] || gradients.teal} transition-all duration-700 ease-out`}
        />
      </div>
      {subtitle && <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{subtitle}</p>}
    </div>
  );
};
