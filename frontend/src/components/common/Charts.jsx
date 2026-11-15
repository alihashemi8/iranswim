import React, { useState, useId } from 'react';

/**
 * Smooth SVG Area Trend Chart
 * Ideal for Server Latency, Error Trends, or Lap Progression
 */
export const SparklineAreaChart = ({
  data = [],
  height = 140,
  color = 'sky',
  valueFormatter = (v) => v,
  labelFormatter = (l) => l,
  title,
  subtitle,
}) => {
  const [hoverIndex, setHoverIndex] = useState(null);
  const chartId = useId().replace(/:/g, '');

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
        داده‌ای برای نمایش نمودار وجود ندارد
      </div>
    );
  }

  const values = data.map((d) => Number(d.value || 0));
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values, 1);
  const range = maxVal - minVal || 1;

  const paddingX = 18;
  const paddingY = 16;
  const width = 500;
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
      gradientStart: '#38bdf8',
      dot: '#0284c7',
      bgGrad: 'rgba(2, 132, 199, 0.45)',
    },
    emerald: {
      stroke: '#059669',
      gradientStart: '#34d399',
      dot: '#059669',
      bgGrad: 'rgba(5, 150, 105, 0.45)',
    },
    amber: {
      stroke: '#d97706',
      gradientStart: '#fbbf24',
      dot: '#d97706',
      bgGrad: 'rgba(217, 119, 6, 0.45)',
    },
    rose: {
      stroke: '#e11d48',
      gradientStart: '#fb7185',
      dot: '#e11d48',
      bgGrad: 'rgba(225, 29, 72, 0.45)',
    },
    indigo: {
      stroke: '#4f46e5',
      gradientStart: '#818cf8',
      dot: '#4f46e5',
      bgGrad: 'rgba(79, 70, 229, 0.45)',
    },
  };

  const activeColor = colorConfig[color] || colorConfig.sky;
  const hoveredPoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="relative w-full space-y-2">
      {(title || subtitle) && (
        <div className="h-7 min-h-[28px] flex items-center justify-between gap-2 overflow-hidden">
          <div className="min-w-0 flex items-center gap-2 truncate">
            {title && <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{title}</span>}
            {subtitle && <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{subtitle}</p>}
          </div>
          <div className="shrink-0 h-6 flex items-center">
            {hoveredPoint ? (
              <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-800 transition-all truncate max-w-full">
                {labelFormatter(hoveredPoint.label)}: {valueFormatter(hoveredPoint.value)}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                اوج: {valueFormatter(maxVal)}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="w-full overflow-hidden rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 p-3 border border-slate-200/70 dark:border-slate-800">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`grad-${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={activeColor.gradientStart} stopOpacity="0.45" />
              <stop offset="100%" stopColor={activeColor.gradientStart} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-700/60"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <line
            x1={paddingX}
            y1={height / 2}
            x2={width - paddingX}
            y2={height / 2}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-700/60"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="currentColor"
            className="text-slate-300 dark:text-slate-700"
            strokeWidth="1"
          />

          {/* Area Fill */}
          <path d={areaPath} fill={`url(#grad-${chartId})`} />

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
                r={hoverIndex === i ? '5.5' : '3.5'}
                fill={activeColor.dot}
                stroke="#ffffff"
                strokeWidth="2"
                className="transition-all duration-150"
              />
              <rect
                x={pt.x - 16}
                y={0}
                width={32}
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
        <div className="flex justify-between items-center px-1 pt-2.5 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-mono">
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
  subtitle,
  valueFormatter = (v) => v,
  color = 'sky',
  height = 'h-44',
}) => {
  const [activeItem, setActiveItem] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
        داده‌ای برای نمایش میله‌ای وجود ندارد
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => Number(d.value || 0)), 1);

  const colors = {
    sky: 'bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-500',
    emerald: 'bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500',
    indigo: 'bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500',
    amber: 'bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500',
    rose: 'bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500',
    teal: 'bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-500',
  };

  const badgeColors = {
    sky: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800',
    emerald: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
    indigo: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800',
    amber: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
    rose: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
    teal: 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800',
  };

  const activeBadgeClass = badgeColors[color] || badgeColors.sky;

  return (
    <div className="space-y-3 w-full">
      {/* Fixed height header bar: prevents layout shifts / page jumping when hovering */}
      <div className="h-7 min-h-[28px] flex items-center justify-between gap-2 overflow-hidden">
        <div className="min-w-0 flex items-center gap-2 truncate">
          {title && <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{title}</span>}
          {subtitle && <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{subtitle}</p>}
        </div>
        <div className="shrink-0 h-6 flex items-center">
          {activeItem ? (
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border transition-all truncate max-w-full ${activeBadgeClass}`}>
              {activeItem.label}: {valueFormatter(activeItem.value)}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
              اوج: {valueFormatter(maxValue)}
            </span>
          )}
        </div>
      </div>

      <div className={`${height} flex items-end gap-2 sm:gap-3 p-3.5 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-800`}>
        {data.map((item, idx) => {
          const heightPercent = Math.max((Number(item.value || 0) / maxValue) * 100, 4);
          const isSelected = activeItem?.label === item.label;

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
              onMouseEnter={() => setActiveItem(item)}
              onMouseLeave={() => setActiveItem(null)}
            >
              <div className="text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-300 mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {valueFormatter(item.value)}
              </div>
              <div className="w-full max-w-[44px] bg-slate-200/60 dark:bg-slate-700/60 rounded-t-xl overflow-hidden flex flex-col justify-end h-full">
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t-xl transition-all duration-300 ${
                    isSelected
                      ? `${item.colorClass || 'bg-sky-600 dark:bg-sky-400'} brightness-110 shadow-sm`
                      : item.colorClass || colors[color] || colors.sky
                  }`}
                />
              </div>
              <span className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 mt-2 font-medium truncate max-w-[65px] text-center" title={item.label}>
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
 * Modern SVG Donut / Pie Chart Component
 * Perfect for Financial Status, Attendance breakdown, or Skill distribution
 */
export const DonutChart = ({
  data = [],
  title,
  subtitle,
  size = 170,
  donutWidth = 24,
  centerLabel = 'مجموع',
  centerValue,
  valueFormatter = (v) => v,
  showLegend = true,
}) => {
  const [hoverIndex, setHoverIndex] = useState(null);

  const defaultColors = [
    { fill: '#10b981', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500' },
    { fill: '#0284c7', text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500' },
    { fill: '#f59e0b', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500' },
    { fill: '#f43f5e', text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500' },
    { fill: '#6366f1', text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500' },
    { fill: '#8b5cf6', text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500' },
  ];

  const total = data.reduce((sum, item) => sum + Math.max(Number(item.value || 0), 0), 0);

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-44 text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-4">
        <span>داده‌ای برای نمایش نمودار دایره‌ای وجود ندارد</span>
      </div>
    );
  }

  const radius = (size - donutWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  const slices = data.map((item, idx) => {
    const val = Math.max(Number(item.value || 0), 0);
    const percent = total > 0 ? (val / total) * 100 : 0;
    const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativePercent / 100) * circumference);
    cumulativePercent += percent;

    const colorObj = item.color
      ? { fill: item.color, bg: 'bg-sky-500', text: 'text-sky-600' }
      : defaultColors[idx % defaultColors.length];

    return {
      ...item,
      val,
      percent: Math.round(percent),
      strokeDasharray,
      strokeDashoffset,
      colorObj,
    };
  });

  const activeSlice = hoverIndex !== null ? slices[hoverIndex] : null;

  return (
    <div className="space-y-3 w-full">
      {(title || subtitle) && (
        <div className="flex items-center justify-between">
          <div>
            {title && <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{title}</h4>}
            {subtitle && <p className="text-[11px] text-slate-400 dark:text-slate-500">{subtitle}</p>}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-5 p-3 sm:p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-800">
        {/* SVG Ring */}
        <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90 select-none">
            {/* Background Ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              className="text-slate-200/70 dark:text-slate-700/60"
              strokeWidth={donutWidth - 6}
            />

            {/* Slices */}
            {slices.map((slice, idx) => {
              const isHovered = hoverIndex === idx;
              return (
                <circle
                  key={idx}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={slice.colorObj.fill}
                  strokeWidth={isHovered ? donutWidth + 4 : donutWidth}
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  strokeLinecap="round"
                  onMouseEnter={() => setHoverIndex(idx)}
                  onMouseLeave={() => setHoverIndex(null)}
                  className="cursor-pointer transition-all duration-300 origin-center"
                />
              );
            })}
          </svg>

          {/* Center Info Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[100px]">
              {activeSlice ? activeSlice.label : centerLabel}
            </span>
            <span className="text-sm font-black font-mono text-slate-900 dark:text-white leading-tight">
              {activeSlice ? valueFormatter(activeSlice.val) : (centerValue ?? valueFormatter(total))}
            </span>
            {activeSlice && (
              <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                {activeSlice.percent}%
              </span>
            )}
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="w-full sm:w-auto flex flex-col gap-2 min-w-[140px]">
            {slices.map((slice, idx) => {
              const isHovered = hoverIndex === idx;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoverIndex(idx)}
                  onMouseLeave={() => setHoverIndex(null)}
                  className={`flex items-center justify-between gap-3 text-xs p-1.5 rounded-lg cursor-pointer transition-all ${
                    isHovered
                      ? 'bg-white dark:bg-slate-700/80 shadow-xs'
                      : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: slice.colorObj.fill }}
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate" title={slice.label}>
                      {slice.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 font-mono">
                    <span className="text-slate-900 dark:text-white font-bold">{slice.percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Horizontal Bar Chart (Ranking & Skill comparison)
 */
export const HorizontalBarChart = ({
  data = [],
  title,
  subtitle,
  valueFormatter = (v) => v,
  max,
}) => {
  const calculatedMax = max || Math.max(...data.map((d) => Number(d.value || 0)), 1);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
        داده‌ای برای نمایش موجود نیست
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full">
      {(title || subtitle) && (
        <div>
          {title && <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{title}</h4>}
          {subtitle && <p className="text-[11px] text-slate-400 dark:text-slate-500">{subtitle}</p>}
        </div>
      )}

      <div className="space-y-2.5 p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-800">
        {data.map((item, idx) => {
          const val = Number(item.value || 0);
          const percent = Math.min(100, Math.round((val / calculatedMax) * 100));

          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]" title={item.label}>
                  {item.label}
                </span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {valueFormatter(val)}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200/70 dark:bg-slate-700/60 rounded-full overflow-hidden p-0.5">
                <div
                  style={{ width: `${percent}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.colorClass || 'bg-gradient-to-l from-sky-500 to-cyan-500'
                  }`}
                />
              </div>
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
        <span className="font-mono font-black text-sm sm:text-base text-slate-800 dark:text-slate-200">{percentage}%</span>
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
