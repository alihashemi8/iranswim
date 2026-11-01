import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft, X, ChevronDown } from 'lucide-react';
import * as jalaali from 'jalaali-js';

const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

const PERSIAN_WEEKDAYS = [
  { short: 'ش', name: 'شنبه' },
  { short: 'ی', name: 'یکشنبه' },
  { short: 'د', name: 'دوشنبه' },
  { short: 'س', name: 'سه‌شنبه' },
  { short: 'چ', name: 'چهارشنبه' },
  { short: 'پ', name: 'پنج‌شنبه' },
  { short: 'ج', name: 'جمعه', isWeekend: true },
];

/**
 * Format a Jalaali date object to YYYY/MM/DD string
 */
export const formatJalaliString = (jy, jm, jd) => {
  return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
};

/**
 * Parse a Jalali string "YYYY/MM/DD" or "YYYY-MM-DD"
 */
export const parseJalaliString = (str) => {
  if (!str) return null;
  const clean = typeof str === 'string' ? str.split('T')[0].split(' ')[0].trim() : '';
  const parts = clean.split(/[/ -]/).map((p) => parseInt(p, 10));
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return { jy: parts[0], jm: parts[1], jd: parts[2] };
  }
  return null;
};

/**
 * Convert any Date / ISO string to Jalali string YYYY/MM/DD
 */
export const toJalaliString = (dateInput) => {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  const j = jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return formatJalaliString(j.jy, j.jm, j.jd);
};

/**
 * Format Jalali string into readable Persian prose (e.g. "۸ آبان ۱۴۰۵")
 */
export const formatJalaliReadable = (str) => {
  const p = parseJalaliString(str);
  if (!p) return str || '';
  const monthName = PERSIAN_MONTHS[p.jm - 1] || '';
  return `${p.jd.toLocaleString('fa-IR')} ${monthName} ${p.jy.toLocaleString('fa-IR')}`;
};

export const PersianDatePicker = ({
  value,
  onChange,
  placeholder = 'انتخاب تاریخ...',
  label,
  labelClassName = '',
  buttonClassName = '',
  size = 'sm', // 'sm' | 'md'
  icon: Icon = CalendarIcon,
  className = '',
  disabled = false,
  clearable = true,
  required = false,
  minYear = 1320,
  maxYear = 1415,
  placement = 'auto', // 'auto' | 'top' | 'bottom'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const yearListRef = useRef(null);

  // Today in Jalaali
  const todayJalali = useMemo(() => {
    const now = new Date();
    return jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }, []);

  // Parse current value
  const parsedValue = useMemo(() => {
    if (!value) return null;
    if (typeof value === 'string') {
      const p = parseJalaliString(value);
      // Check if it's already Jalali (e.g. starting with 13xx or 14xx)
      if (p && (p.jy >= 1300 && p.jy <= 1500)) {
        return p;
      }
      // If it's a Gregorian YYYY-MM-DD or YYYY/MM/DD
      if (p && p.jy > 1900) {
        return jalaali.toJalaali(p.jy, p.jm, p.jd);
      }
      // Fallback Date object parsing
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        return jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
      }
    } else if (value instanceof Date && !isNaN(value.getTime())) {
      return jalaali.toJalaali(value.getFullYear(), value.getMonth() + 1, value.getDate());
    }
    return null;
  }, [value]);

  // View state (which month/year is currently being viewed)
  const [viewYear, setViewYear] = useState(parsedValue?.jy || todayJalali.jy);
  const [viewMonth, setViewMonth] = useState(parsedValue?.jm || todayJalali.jm);
  const [pickerMode, setPickerMode] = useState('days'); // 'days' | 'months' | 'years'

  // Update view when value or popup opens
  useEffect(() => {
    if (isOpen) {
      if (parsedValue) {
        setViewYear(parsedValue.jy);
        setViewMonth(parsedValue.jm);
      } else {
        setViewYear(todayJalali.jy);
        setViewMonth(todayJalali.jm);
      }
      setPickerMode('days');
    }
  }, [isOpen, parsedValue, todayJalali]);

  // Close on click outside or Escape
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

  // Calculate whether calendar dropdown should open upwards or downwards
  const checkPlacement = () => {
    if (placement === 'top') {
      setOpenUpward(true);
      return;
    }
    if (placement === 'bottom') {
      setOpenUpward(false);
      return;
    }

    const triggerEl = triggerRef.current || containerRef.current;
    if (!triggerEl) return;

    const rect = triggerEl.getBoundingClientRect();
    const dropdownHeight = dropdownRef.current?.offsetHeight || 375;

    let spaceBelow = window.innerHeight - rect.bottom;
    let spaceAbove = rect.top;

    // Check parent containers that might clip with overflow (hidden/auto/scroll)
    let parent = triggerEl.parentElement;
    while (parent && parent !== document.body && parent !== document.documentElement) {
      const style = window.getComputedStyle(parent);
      const overflowY = style.overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'hidden') {
        const parentRect = parent.getBoundingClientRect();
        const parentSpaceBelow = parentRect.bottom - rect.bottom;
        const parentSpaceAbove = rect.top - parentRect.top;
        if (parentSpaceBelow < spaceBelow) {
          spaceBelow = parentSpaceBelow;
        }
        if (parentSpaceAbove < spaceAbove) {
          spaceAbove = parentSpaceAbove;
        }
      }
      parent = parent.parentElement;
    }

    // Open upward if space below is insufficient and space above is larger
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      setOpenUpward(true);
    } else {
      setOpenUpward(false);
    }
  };

  // Re-check placement on open, scroll, or resize
  useEffect(() => {
    if (!isOpen) return;

    checkPlacement();

    const handleScrollOrResize = () => {
      checkPlacement();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, pickerMode, placement]);

  // Scroll active year into center view when opening year picker mode
  useEffect(() => {
    if (isOpen && pickerMode === 'years' && yearListRef.current) {
      const activeEl = yearListRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }, [isOpen, pickerMode]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      checkPlacement();
    }
    setIsOpen((prev) => !prev);
  };

  // Navigate months
  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear(viewYear - 1);
      setViewMonth(12);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear(viewYear + 1);
      setViewMonth(1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Select day
  const handleSelectDay = (day) => {
    const formatted = formatJalaliString(viewYear, viewMonth, day);
    const g = jalaali.toGregorian(viewYear, viewMonth, day);
    const gIso = `${g.gy}-${String(g.gm).padStart(2, '0')}-${String(g.gd).padStart(2, '0')}`;
    const gDate = new Date(g.gy, g.gm - 1, g.gd);
    onChange?.(formatted, gDate, gIso);
    setIsOpen(false);
  };

  // Select today
  const handleSelectToday = () => {
    const formatted = formatJalaliString(todayJalali.jy, todayJalali.jm, todayJalali.jd);
    const g = jalaali.toGregorian(todayJalali.jy, todayJalali.jm, todayJalali.jd);
    const gIso = `${g.gy}-${String(g.gm).padStart(2, '0')}-${String(g.gd).padStart(2, '0')}`;
    const now = new Date(g.gy, g.gm - 1, g.gd);
    onChange?.(formatted, now, gIso);
    setIsOpen(false);
  };

  // Clear value
  const handleClear = (e) => {
    e?.stopPropagation();
    onChange?.('', null, '');
  };

  // Month days count and starting weekday
  const monthLength = useMemo(() => {
    return jalaali.jalaaliMonthLength(viewYear, viewMonth);
  }, [viewYear, viewMonth]);

  const startWeekday = useMemo(() => {
    const g = jalaali.toGregorian(viewYear, viewMonth, 1);
    const d = new Date(g.gy, g.gm - 1, g.gd);
    // 0: شنبه, ..., 6: جمعه
    return (d.getDay() + 1) % 7;
  }, [viewYear, viewMonth]);

  // Years list for year picker
  const yearsList = useMemo(() => {
    const years = [];
    const min = Math.min(minYear, parsedValue?.jy ? parsedValue.jy - 5 : minYear);
    const max = Math.max(maxYear, parsedValue?.jy ? parsedValue.jy + 5 : maxYear);
    for (let y = max; y >= min; y--) {
      years.push(y);
    }
    return years;
  }, [minYear, maxYear, parsedValue]);

  const isValueActive = Boolean(parsedValue);

  return (
    <div className={`relative ${isOpen ? 'z-40' : ''} ${className}`} ref={containerRef} dir="rtl">
      {label && (
        <label className={`block font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ${
          labelClassName || (size === 'md' ? 'text-sm font-bold' : 'text-xs')
        }`}>
          {label}
          {required && !label.includes('*') && <span className="text-rose-500 font-bold mr-1">*</span>}
        </label>
      )}

      {/* Trigger Button & Calendar Popup */}
      <div className="relative" ref={triggerRef}>
        <button
          type="button"
          disabled={disabled}
          onClick={handleToggle}
          className={`w-full text-right rounded-xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer select-none ${
            size === 'md' ? 'px-4 py-2.5 text-sm sm:text-base font-medium' : 'px-3.5 py-2.5 text-xs'
          } ${
            disabled ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''
          } ${
            isValueActive
              ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-2xs'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
          } ${
            isOpen
              ? 'ring-2 ring-sky-500 border-transparent shadow-xs'
              : 'hover:border-slate-300 dark:hover:border-slate-600'
          } ${buttonClassName}`}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          <div className="flex items-center gap-2 truncate">
            <Icon className={`w-4 h-4 shrink-0 transition-colors ${
              isValueActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'
            }`} />
            <span className="truncate font-medium">
              {isValueActive
                ? formatJalaliReadable(formatJalaliString(parsedValue.jy, parsedValue.jm, parsedValue.jd))
                : placeholder}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {clearable && isValueActive && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
                title="پاک کردن تاریخ"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-sky-600' : ''
            }`} />
          </div>
        </button>

        {/* Calendar Dropdown Popup */}
        {isOpen && (
          <div
            ref={dropdownRef}
            role="dialog"
            aria-label="تقویم شمسی"
            className={`absolute z-50 right-0 w-72 sm:w-80 max-w-[calc(100vw-2rem)] p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none ${
              openUpward
                ? 'bottom-full mb-1.5 origin-bottom'
                : 'top-full mt-1.5 origin-top'
            }`}
          >
          {/* Header: Month & Year navigation */}
          <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-slate-100 dark:border-slate-800">
            {/* Previous month button (Right arrow in RTL) */}
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="ماه قبل"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Month & Year Title buttons */}
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPickerMode(pickerMode === 'months' ? 'days' : 'months')}
                className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 hover:text-sky-600 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>{PERSIAN_MONTHS[viewMonth - 1]}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              <button
                type="button"
                onClick={() => setPickerMode(pickerMode === 'years' ? 'days' : 'years')}
                className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 hover:text-sky-600 font-mono transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>{viewYear.toLocaleString('fa-IR')}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </div>

            {/* Next month button (Left arrow in RTL) */}
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="ماه بعد"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Mode 1: Month Picker */}
          {pickerMode === 'months' && (
            <div className="grid grid-cols-3 gap-2 py-2">
              {PERSIAN_MONTHS.map((name, idx) => {
                const monthNum = idx + 1;
                const isSelected = viewMonth === monthNum;
                const isCurrentMonth = todayJalali.jm === monthNum && todayJalali.jy === viewYear;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setViewMonth(monthNum);
                      setPickerMode('days');
                    }}
                    className={`py-2 px-1 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-2xs font-bold'
                        : isCurrentMonth
                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Mode 2: Year Picker */}
          {pickerMode === 'years' && (
            <div ref={yearListRef} className="max-h-56 overflow-y-auto grid grid-cols-3 gap-2 py-2 pr-1">
              {yearsList.map((y) => {
                const isSelected = viewYear === y;
                const isCurrentYear = todayJalali.jy === y;
                return (
                  <button
                    key={y}
                    type="button"
                    data-selected={isSelected ? 'true' : undefined}
                    onClick={() => {
                      setViewYear(y);
                      setPickerMode('days');
                    }}
                    className={`py-2 px-1 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : isCurrentYear
                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {y.toLocaleString('fa-IR')}
                  </button>
                );
              })}
            </div>
          )}

          {/* Mode 3: Days Calendar Grid */}
          {pickerMode === 'days' && (
            <div>
              {/* Weekdays header */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                {PERSIAN_WEEKDAYS.map((wd) => (
                  <div
                    key={wd.name}
                    className={`text-[11px] font-bold py-1 ${
                      wd.isWeekend
                        ? 'text-rose-500 dark:text-rose-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                    title={wd.name}
                  >
                    {wd.short}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty leading cells */}
                {Array.from({ length: startWeekday }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-8" />
                ))}

                {/* Days of current month */}
                {Array.from({ length: monthLength }).map((_, i) => {
                  const day = i + 1;
                  const isSelected =
                    parsedValue &&
                    parsedValue.jy === viewYear &&
                    parsedValue.jm === viewMonth &&
                    parsedValue.jd === day;
                  const isToday =
                    todayJalali.jy === viewYear &&
                    todayJalali.jm === viewMonth &&
                    todayJalali.jd === day;
                  const isFriday = (startWeekday + i) % 7 === 6;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleSelectDay(day)}
                      className={`h-8 rounded-xl font-mono text-xs flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-sky-600 text-white font-bold shadow-xs scale-105'
                          : isToday
                          ? 'border-2 border-sky-500 dark:border-sky-400 font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/60'
                          : isFriday
                          ? 'text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {day.toLocaleString('fa-IR')}
                    </button>
                  );
                })}
              </div>

              {/* Quick actions footer */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={handleSelectToday}
                  className="text-sky-600 dark:text-sky-400 hover:underline font-bold transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/40"
                >
                  انتخاب امروز
                </button>
                {clearable && isValueActive && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    پاک کردن
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default PersianDatePicker;
