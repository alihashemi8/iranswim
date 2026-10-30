import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Clock, ChevronDown, Check, X } from 'lucide-react';

const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
const COMMON_PRESETS = ['15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

export const Time24Picker = ({
  value = '17:00',
  onChange,
  label,
  placeholder = '17:00',
  disabled = false,
  className = '',
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const hourListRef = useRef(null);
  const minuteListRef = useRef(null);

  // Parse current value into HH and mm
  const { currentHour, currentMinute } = useMemo(() => {
    if (!value) return { currentHour: '17', currentMinute: '00' };
    const parts = value.split(':');
    const h = (parts[0] || '17').padStart(2, '0');
    const m = (parts[1] || '00').padStart(2, '0');
    return { currentHour: h, currentMinute: m };
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Scroll active hour into view when opening
  useEffect(() => {
    if (isOpen && hourListRef.current) {
      const activeEl = hourListRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen]);

  const handleHourSelect = (h) => {
    const nextVal = `${h}:${currentMinute}`;
    onChange?.(nextVal);
  };

  const handleMinuteSelect = (m) => {
    const nextVal = `${currentHour}:${m}`;
    onChange?.(nextVal);
  };

  const handlePresetSelect = (preset) => {
    onChange?.(preset);
    setIsOpen(false);
  };

  const getTimePeriodDesc = (h) => {
    const num = parseInt(h, 10);
    if (num >= 5 && num < 12) return 'صبح';
    if (num >= 12 && num < 16) return 'ظهر';
    if (num >= 16 && num < 20) return 'عصر';
    return 'شب';
  };

  return (
    <div className={`relative ${className}`} ref={containerRef} dir="rtl">
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-right px-3.5 py-2.5 text-xs rounded-xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer select-none ${
          disabled ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''
        } ${
          value
            ? 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'
            : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
        } ${
          isOpen
            ? 'ring-2 ring-sky-500/25 border-sky-500 dark:border-sky-500 bg-white dark:bg-slate-900 shadow-xs'
            : 'hover:border-slate-300 dark:hover:border-slate-600'
        }`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
          <Clock className={`w-4 h-4 shrink-0 transition-colors ${
            value ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'
          }`} />
          <span className="font-mono text-xs font-bold tracking-wider">
            {value || placeholder}
          </span>
          {value && (
            <span className="text-[10px] text-slate-400 font-sans mr-1">
              ({getTimePeriodDesc(currentHour)})
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-sky-600 dark:text-sky-400' : ''
          }`}
        />
      </button>

      {/* 24-Hour Time Dropdown Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="انتخاب ساعت ۲۴ ساعته"
          className="absolute z-50 top-full mt-1.5 right-0 w-64 p-3 bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 select-none"
        >
          {/* Header Display */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 block">ساعت انتخابی (۲۴ ساعته):</span>
              <div className="flex items-center gap-1 font-mono text-base font-extrabold text-sky-600 dark:text-sky-400">
                <span>{currentHour}</span>
                <span className="animate-pulse">:</span>
                <span>{currentMinute}</span>
              </div>
            </div>

            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              {getTimePeriodDesc(currentHour)}
            </span>
          </div>

          {/* Quick presets for common pool sessions */}
          <div className="mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">سانس‌های رایج استخر:</span>
            <div className="flex flex-wrap gap-1">
              {COMMON_PRESETS.map((preset) => {
                const isPreset = value === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                      isPreset
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-700 hover:text-sky-600'
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hours and Minutes Columns */}
          <div className="grid grid-cols-2 gap-2 text-center">
            {/* Hour Column (00 to 23) */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 block mb-1">
                ساعت (۰۰ - ۲۳)
              </span>
              <div
                ref={hourListRef}
                className="h-44 overflow-y-auto space-y-0.5 p-1 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800"
              >
                {HOURS_24.map((h) => {
                  const isSelected = h === currentHour;
                  return (
                    <button
                      key={h}
                      type="button"
                      data-selected={isSelected}
                      onClick={() => handleHourSelect(h)}
                      className={`w-full py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-sky-600 text-white shadow-2xs scale-102'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                      }`}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minute Column (00 to 55) */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 block mb-1">
                دقیقه
              </span>
              <div
                ref={minuteListRef}
                className="h-44 overflow-y-auto space-y-0.5 p-1 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800"
              >
                {MINUTES.map((m) => {
                  const isSelected = m === currentMinute;
                  return (
                    <button
                      key={m}
                      type="button"
                      data-selected={isSelected}
                      onClick={() => handleMinuteSelect(m)}
                      className={`w-full py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-sky-600 text-white shadow-2xs scale-102'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              تأیید ساعت
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
