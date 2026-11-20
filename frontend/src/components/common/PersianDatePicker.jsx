import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
 * Compare two Jalali date objects
 * Returns < 0 if a < b, 0 if a == b, > 0 if a > b
 */
export const compareJalali = (a, b) => {
  if (!a || !b) return 0;
  if (a.jy !== b.jy) return a.jy - b.jy;
  if (a.jm !== b.jm) return a.jm - b.jm;
  return a.jd - b.jd;
};

export const isJalaliAfter = (a, b) => compareJalali(a, b) > 0;
export const isJalaliBefore = (a, b) => compareJalali(a, b) < 0;

/**
 * Parse any date representation (Jalali string, Gregorian ISO string, Date object, or {jy,jm,jd})
 * into a Jalali object { jy, jm, jd }
 */
export const parseDateToJalali = (val) => {
  if (!val) return null;
  if (typeof val === 'object' && val !== null && 'jy' in val && 'jm' in val && 'jd' in val) {
    return { jy: Number(val.jy), jm: Number(val.jm), jd: Number(val.jd) };
  }
  if (val instanceof Date && !isNaN(val.getTime())) {
    return jalaali.toJalaali(val.getFullYear(), val.getMonth() + 1, val.getDate());
  }
  if (typeof val === 'string') {
    const p = parseJalaliString(val);
    if (p && p.jy >= 1300 && p.jy <= 1500) {
      return p;
    }
    if (p && p.jy > 1900) {
      return jalaali.toJalaali(p.jy, p.jm, p.jd);
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    }
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
 * Format Jalali string into readable Persian prose (e.g. "۸ آبان ۱۴۰۵" or "8 آبان 1405")
 */
export const formatJalaliReadable = (str, englishDigits = false) => {
  const p = parseJalaliString(str);
  if (!p) return str || '';
  const monthName = PERSIAN_MONTHS[p.jm - 1] || '';
  if (englishDigits) {
    return `${p.jd} ${monthName} ${p.jy}`;
  }
  return `${p.jd.toLocaleString('fa-IR')} ${monthName} ${p.jy.toLocaleString('fa-IR', { useGrouping: false })}`;
};

export const PersianDatePicker = ({
  value,
  onChange,
  placeholder = 'انتخاب تاریخ...',
  label,
  labelClassName = '',
  buttonClassName = '',
  size = 'sm', // 'sm' | 'md'
  color = 'sky', // 'sky' | 'emerald' | 'teal' | 'indigo' | 'blue'
  icon: Icon = CalendarIcon,
  className = '',
  disabled = false,
  clearable = true,
  required = false,
  minYear = 1320,
  maxYear = 1415,
  minDate = null,
  maxDate = null,
  disableFuture = true, // By default, users cannot select future dates (از امروز به قبل فقط)
  placement = 'auto', // 'auto' | 'top' | 'bottom'
  align = 'auto', // 'auto' | 'left' | 'right'
  englishDigits = false,
}) => {
  const colorStyles = {
    sky: {
      ring: 'ring-2 ring-sky-500 border-transparent shadow-xs',
      text: 'text-sky-600 dark:text-sky-400',
      bgSelected: 'bg-sky-600 text-white font-bold shadow-xs scale-105',
      bgCurrent: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800',
      borderToday: 'border-2 border-sky-500 dark:border-sky-400 font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/60',
      hoverBtn: 'hover:bg-sky-50 dark:hover:bg-sky-950/40 text-sky-600 dark:text-sky-400',
    },
    emerald: {
      ring: 'ring-2 ring-emerald-500 border-transparent shadow-xs',
      text: 'text-emerald-600 dark:text-emerald-400',
      bgSelected: 'bg-emerald-600 text-white font-bold shadow-xs scale-105',
      bgCurrent: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800',
      borderToday: 'border-2 border-emerald-500 dark:border-emerald-400 font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60',
      hoverBtn: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    },
    teal: {
      ring: 'ring-2 ring-teal-500 border-transparent shadow-xs',
      text: 'text-teal-600 dark:text-teal-400',
      bgSelected: 'bg-teal-600 text-white font-bold shadow-xs scale-105',
      bgCurrent: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-800',
      borderToday: 'border-2 border-teal-500 dark:border-teal-400 font-bold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/60',
      hoverBtn: 'hover:bg-teal-50 dark:hover:bg-teal-950/40 text-teal-600 dark:text-teal-400',
    },
    indigo: {
      ring: 'ring-2 ring-indigo-500 border-transparent shadow-xs',
      text: 'text-indigo-600 dark:text-indigo-400',
      bgSelected: 'bg-indigo-600 text-white font-bold shadow-xs scale-105',
      bgCurrent: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800',
      borderToday: 'border-2 border-indigo-500 dark:border-indigo-400 font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60',
      hoverBtn: 'hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400',
    },
    blue: {
      ring: 'ring-2 ring-blue-500 border-transparent shadow-xs',
      text: 'text-blue-600 dark:text-blue-400',
      bgSelected: 'bg-blue-600 text-white font-bold shadow-xs scale-105',
      bgCurrent: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800',
      borderToday: 'border-2 border-blue-500 dark:border-blue-400 font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60',
      hoverBtn: 'hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400',
    },
  }[color] || {
    ring: 'ring-2 ring-sky-500 border-transparent shadow-xs',
    text: 'text-sky-600 dark:text-sky-400',
    bgSelected: 'bg-sky-600 text-white font-bold shadow-xs scale-105',
    bgCurrent: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800',
    borderToday: 'border-2 border-sky-500 dark:border-sky-400 font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/60',
    hoverBtn: 'hover:bg-sky-50 dark:hover:bg-sky-950/40 text-sky-600 dark:text-sky-400',
  };
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [horizontalAlign, setHorizontalAlign] = useState(align === 'left' ? 'left' : 'right');
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const yearListRef = useRef(null);

  // Mobile viewport detection for bottom-sheet rendering
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(max-width: 639px)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 639px)');
    const updateMobile = (e) => setIsMobile(e.matches);
    setIsMobile(media.matches);
    media.addEventListener('change', updateMobile);
    return () => media.removeEventListener('change', updateMobile);
  }, []);

  // Prevent background scroll when mobile bottom sheet is open
  useEffect(() => {
    if (isOpen && isMobile) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, isMobile]);

  // Today in Jalaali
  const todayJalali = useMemo(() => {
    const now = new Date();
    return jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }, []);

  const formatNum = (num, opts = {}) => {
    if (num === null || num === undefined) return '';
    return englishDigits ? String(num) : num.toLocaleString('fa-IR', opts);
  };

  // Parse current value
  const parsedValue = useMemo(() => {
    return parseDateToJalali(value);
  }, [value]);

  // Min limit Jalali object
  const minLimit = useMemo(() => {
    if (minDate) return parseDateToJalali(minDate);
    return null;
  }, [minDate]);

  // Max limit Jalali object (Defaults to today when disableFuture is true)
  const maxLimit = useMemo(() => {
    let parsedMax = null;
    if (maxDate) {
      parsedMax = parseDateToJalali(maxDate);
    }
    if (disableFuture) {
      if (parsedMax) {
        return compareJalali(parsedMax, todayJalali) < 0 ? parsedMax : todayJalali;
      }
      return todayJalali;
    }
    return parsedMax;
  }, [maxDate, disableFuture, todayJalali]);

  // View state (which month/year is currently being viewed)
  const [viewYear, setViewYear] = useState(() => {
    if (parsedValue) {
      if (maxLimit && compareJalali(parsedValue, maxLimit) > 0) return maxLimit.jy;
      if (minLimit && compareJalali(parsedValue, minLimit) < 0) return minLimit.jy;
      return parsedValue.jy;
    }
    return maxLimit && compareJalali(todayJalali, maxLimit) > 0 ? maxLimit.jy : todayJalali.jy;
  });

  const [viewMonth, setViewMonth] = useState(() => {
    if (parsedValue) {
      if (maxLimit && compareJalali(parsedValue, maxLimit) > 0) return maxLimit.jm;
      if (minLimit && compareJalali(parsedValue, minLimit) < 0) return minLimit.jm;
      return parsedValue.jm;
    }
    return maxLimit && compareJalali(todayJalali, maxLimit) > 0 ? maxLimit.jm : todayJalali.jm;
  });

  const [pickerMode, setPickerMode] = useState('days'); // 'days' | 'months' | 'years'

  // Update view when value or popup opens
  useEffect(() => {
    if (isOpen) {
      if (parsedValue) {
        const isFuture = maxLimit && compareJalali(parsedValue, maxLimit) > 0;
        const isPast = minLimit && compareJalali(parsedValue, minLimit) < 0;
        if (isFuture) {
          setViewYear(maxLimit.jy);
          setViewMonth(maxLimit.jm);
        } else if (isPast) {
          setViewYear(minLimit.jy);
          setViewMonth(minLimit.jm);
        } else {
          setViewYear(parsedValue.jy);
          setViewMonth(parsedValue.jm);
        }
      } else {
        const defaultYear = maxLimit && compareJalali(todayJalali, maxLimit) > 0
          ? maxLimit.jy
          : todayJalali.jy;
        const defaultMonth = maxLimit && compareJalali(todayJalali, maxLimit) > 0
          ? maxLimit.jm
          : todayJalali.jm;
        setViewYear(defaultYear);
        setViewMonth(defaultMonth);
      }
      setPickerMode('days');
    }
  }, [isOpen, parsedValue, todayJalali, maxLimit, minLimit]);

  // Close on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isMobile) return; // Handled by backdrop in mobile bottom-sheet mode
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
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
  }, [isOpen, isMobile]);

  // Calculate whether calendar dropdown should open upwards or downwards and align left/right
  const checkPlacement = () => {
    if (isMobile) return;
    const triggerEl = triggerRef.current || containerRef.current;
    if (!triggerEl) return;

    const rect = triggerEl.getBoundingClientRect();

    // 1. Vertical placement (top vs bottom)
    if (placement === 'top') {
      setOpenUpward(true);
    } else if (placement === 'bottom') {
      setOpenUpward(false);
    } else {
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
    }

    // 2. Horizontal alignment (right vs left)
    if (align === 'left') {
      setHorizontalAlign('left');
    } else if (align === 'right') {
      setHorizontalAlign('right');
    } else {
      // Auto alignment:
      // Dropdown width: fallback to 320 on sm/desktop, 288 on small screens
      const dropdownWidth = dropdownRef.current?.offsetWidth || (window.innerWidth >= 640 ? 320 : 288);

      let minLeft = 16;
      let maxRight = window.innerWidth - 16;

      // Check parent containers that might clip with overflow (hidden/auto/scroll)
      let parent = triggerEl.parentElement;
      while (parent && parent !== document.body && parent !== document.documentElement) {
        const style = window.getComputedStyle(parent);
        const overflowX = style.overflowX;
        if (overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'hidden') {
          const parentRect = parent.getBoundingClientRect();
          if (parentRect.left + 8 > minLeft) {
            minLeft = parentRect.left + 8;
          }
          if (parentRect.right - 8 < maxRight) {
            maxRight = parentRect.right - 8;
          }
        }
        parent = parent.parentElement;
      }

      // In RTL, default alignment is right-aligned to trigger (right: 0).
      // Dropdown extends to the left from rect.right to (rect.right - dropdownWidth).
      const wouldOverflowLeft = (rect.right - dropdownWidth) < minLeft;

      // With left-aligned to trigger (left: 0).
      // Dropdown extends to the right from rect.left to (rect.left + dropdownWidth).
      const wouldOverflowRight = (rect.left + dropdownWidth) > maxRight;

      if (wouldOverflowLeft && !wouldOverflowRight) {
        // Fits when aligned to left, but overflows window/container on left if aligned to right
        setHorizontalAlign('left');
      } else if (wouldOverflowRight && !wouldOverflowLeft) {
        // Fits when aligned to right, but overflows window/container on right if aligned to left
        setHorizontalAlign('right');
      } else if (wouldOverflowLeft && wouldOverflowRight) {
        // Narrow screen: align to side with more available space
        const spaceOnRight = maxRight - rect.left;
        const spaceOnLeft = rect.right - minLeft;
        setHorizontalAlign(spaceOnRight >= spaceOnLeft ? 'left' : 'right');
      } else {
        // Default to RTL right alignment
        setHorizontalAlign('right');
      }
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
  }, [isOpen, pickerMode, placement, align]);

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

  // Year/Month/Day validation against minLimit and maxLimit
  const isYearDisabled = (y) => {
    if (minLimit && y < minLimit.jy) return true;
    if (minYear && y < minYear) return true;
    if (maxLimit && y > maxLimit.jy) return true;
    return false;
  };

  const isMonthDisabled = (m) => {
    if (minLimit) {
      if (viewYear < minLimit.jy) return true;
      if (viewYear === minLimit.jy && m < minLimit.jm) return true;
    }
    if (maxLimit) {
      if (viewYear > maxLimit.jy) return true;
      if (viewYear === maxLimit.jy && m > maxLimit.jm) return true;
    }
    return false;
  };

  const isDayDisabled = (d) => {
    if (minLimit) {
      if (viewYear < minLimit.jy) return true;
      if (viewYear === minLimit.jy && viewMonth < minLimit.jm) return true;
      if (viewYear === minLimit.jy && viewMonth === minLimit.jm && d < minLimit.jd) return true;
    }
    if (maxLimit) {
      if (viewYear > maxLimit.jy) return true;
      if (viewYear === maxLimit.jy && viewMonth > maxLimit.jm) return true;
      if (viewYear === maxLimit.jy && viewMonth === maxLimit.jm && d > maxLimit.jd) return true;
    }
    return false;
  };

  const isPrevMonthDisabled = useMemo(() => {
    if (minLimit) {
      if (viewYear < minLimit.jy) return true;
      if (viewYear === minLimit.jy && viewMonth <= minLimit.jm) return true;
    }
    if (minYear && viewYear <= minYear && viewMonth <= 1) return true;
    return false;
  }, [minLimit, minYear, viewYear, viewMonth]);

  const isNextMonthDisabled = useMemo(() => {
    if (maxLimit) {
      if (viewYear > maxLimit.jy) return true;
      if (viewYear === maxLimit.jy && viewMonth >= maxLimit.jm) return true;
    }
    return false;
  }, [maxLimit, viewYear, viewMonth]);

  // Navigate months
  const handlePrevMonth = () => {
    if (isPrevMonthDisabled) return;
    if (viewMonth === 1) {
      setViewYear((prev) => prev - 1);
      setViewMonth(12);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (isNextMonthDisabled) return;
    if (viewMonth === 12) {
      setViewYear((prev) => prev + 1);
      setViewMonth(1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Select month
  const handleSelectMonth = (monthNum) => {
    if (isMonthDisabled(monthNum)) return;
    setViewMonth(monthNum);
    setPickerMode('days');
  };

  // Select year
  const handleSelectYear = (y) => {
    if (isYearDisabled(y)) return;
    setViewYear(y);
    if (maxLimit && y === maxLimit.jy && viewMonth > maxLimit.jm) {
      setViewMonth(maxLimit.jm);
    } else if (minLimit && y === minLimit.jy && viewMonth < minLimit.jm) {
      setViewMonth(minLimit.jm);
    }
    setPickerMode('days');
  };

  // Select day
  const handleSelectDay = (day) => {
    if (isDayDisabled(day)) return;
    const formatted = formatJalaliString(viewYear, viewMonth, day);
    const g = jalaali.toGregorian(viewYear, viewMonth, day);
    const gIso = `${g.gy}-${String(g.gm).padStart(2, '0')}-${String(g.gd).padStart(2, '0')}`;
    const gDate = new Date(g.gy, g.gm - 1, g.gd);
    onChange?.(formatted, gDate, gIso);
    setIsOpen(false);
  };

  // Select today
  const handleSelectToday = () => {
    if (maxLimit && compareJalali(todayJalali, maxLimit) > 0) return;
    if (minLimit && compareJalali(todayJalali, minLimit) < 0) return;
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
    if (isMobile) {
      setIsOpen(false);
    }
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
    const minBound = minLimit ? Math.max(minYear, minLimit.jy) : minYear;
    const min = Math.min(minBound, parsedValue?.jy ? parsedValue.jy - 5 : minBound);
    const maxBound = maxLimit ? Math.min(maxYear, maxLimit.jy) : maxYear;
    const max = Math.max(min, maxBound);
    for (let y = max; y >= min; y--) {
      years.push(y);
    }
    return years;
  }, [minYear, maxYear, parsedValue, minLimit, maxLimit]);

  const isValueActive = Boolean(parsedValue);

  const renderCalendarContent = (showCloseHeader = false) => (
    <>
      {showCloseHeader && (
        <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${colorStyles.text}`} />
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
              تقویم و انتخاب تاریخ
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="بستن تقویم"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header: Month & Year navigation */}
      <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-slate-100 dark:border-slate-800">
        {/* Previous month button (Right arrow in RTL) */}
        <button
          type="button"
          disabled={isPrevMonthDisabled}
          onClick={handlePrevMonth}
          className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${
            isPrevMonthDisabled
              ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-30 select-none'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
          }`}
          title={isPrevMonthDisabled ? 'امکان بازگشت به قبل وجود ندارد' : 'ماه قبل'}
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Month & Year Title buttons */}
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setPickerMode(pickerMode === 'months' ? 'days' : 'months')}
            className={`px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 hover:${colorStyles.text} transition-colors cursor-pointer flex items-center gap-1`}
          >
            <span>{PERSIAN_MONTHS[viewMonth - 1]}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          <button
            type="button"
            onClick={() => setPickerMode(pickerMode === 'years' ? 'days' : 'years')}
            className={`px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 hover:${colorStyles.text} font-mono transition-colors cursor-pointer flex items-center gap-1`}
          >
            <span>{formatNum(viewYear, { useGrouping: false })}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>

        {/* Next month button (Left arrow in RTL) */}
        <button
          type="button"
          disabled={isNextMonthDisabled}
          onClick={handleNextMonth}
          className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${
            isNextMonthDisabled
              ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-30 select-none'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
          }`}
          title={isNextMonthDisabled ? 'امکان انتخاب ماه‌های آینده وجود ندارد' : 'ماه بعد'}
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
            const isDisabledMonth = isMonthDisabled(monthNum);
            return (
              <button
                key={name}
                type="button"
                disabled={isDisabledMonth}
                onClick={() => handleSelectMonth(monthNum)}
                title={isDisabledMonth ? 'امکان انتخاب ماه‌های آینده وجود ندارد' : undefined}
                className={`py-2 px-1 text-xs font-semibold rounded-xl transition-all select-none ${
                  isDisabledMonth
                    ? 'opacity-25 cursor-not-allowed text-slate-300 dark:text-slate-600 hover:bg-transparent'
                    : isSelected
                    ? `${colorStyles.bgSelected} cursor-pointer`
                    : isCurrentMonth
                    ? `${colorStyles.bgCurrent} cursor-pointer`
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
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
            const isDisabledYear = isYearDisabled(y);
            return (
              <button
                key={y}
                type="button"
                disabled={isDisabledYear}
                data-selected={isSelected ? 'true' : undefined}
                onClick={() => handleSelectYear(y)}
                title={isDisabledYear ? 'امکان انتخاب سال‌های آینده وجود ندارد' : undefined}
                className={`py-2 px-1 text-xs font-mono font-bold rounded-xl transition-all select-none ${
                  isDisabledYear
                    ? 'opacity-25 cursor-not-allowed text-slate-300 dark:text-slate-600 hover:bg-transparent'
                    : isSelected
                    ? `${colorStyles.bgSelected} cursor-pointer`
                    : isCurrentYear
                    ? `${colorStyles.bgCurrent} cursor-pointer`
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
                }`}
              >
                {formatNum(y, { useGrouping: false })}
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
              const isDisabledDay = isDayDisabled(day);

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabledDay}
                  onClick={() => handleSelectDay(day)}
                  title={isDisabledDay ? 'امکان انتخاب تاریخ آینده وجود ندارد (فقط تا امروز)' : undefined}
                  className={`h-8 rounded-xl font-mono text-xs flex items-center justify-center transition-all select-none ${
                    isDisabledDay
                      ? 'opacity-25 cursor-not-allowed text-slate-300 dark:text-slate-600 hover:bg-transparent'
                      : isSelected
                      ? `${colorStyles.bgSelected} cursor-pointer`
                      : isToday
                      ? `${colorStyles.borderToday} cursor-pointer`
                      : isFriday
                      ? 'text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold cursor-pointer'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
                  }`}
                >
                  {formatNum(day)}
                </button>
              );
            })}
          </div>

          {/* Quick actions footer */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={handleSelectToday}
              className={`font-bold transition-colors cursor-pointer py-1.5 px-2.5 rounded-lg hover:underline ${colorStyles.hoverBtn}`}
            >
              انتخاب امروز
            </button>
            {disableFuture && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium select-none px-1">
                (فقط تا امروز)
              </span>
            )}
            {clearable && isValueActive && (
              <button
                type="button"
                onClick={handleClear}
                className="text-rose-600 dark:text-rose-400 hover:underline font-bold transition-colors cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                پاک کردن
              </button>
            )}
            {showCloseHeader && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium transition-colors cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                بستن
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className={`relative ${isOpen ? 'z-40' : ''} ${className}`} ref={containerRef} dir="rtl">
      {label && (
        <label className={`block font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ${
          labelClassName || (size === 'md' ? 'text-sm font-bold' : 'text-xs')
        }`}>
          {typeof label === 'string' && label.includes('*') ? (
            <>
              {label.replace('*', '').trim()} <span className="text-rose-500 font-bold">*</span>
            </>
          ) : (
            <>
              {label}
              {required && <span className="text-rose-500 font-bold mr-1">*</span>}
            </>
          )}
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
              ? colorStyles.ring
              : 'hover:border-slate-300 dark:hover:border-slate-600'
          } ${buttonClassName}`}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          <div className="flex items-center gap-2 truncate">
            <Icon className={`w-4 h-4 shrink-0 transition-colors ${
              isValueActive ? colorStyles.text : 'text-slate-400'
            }`} />
            <span className="truncate font-medium">
              {isValueActive
                ? formatJalaliReadable(formatJalaliString(parsedValue.jy, parsedValue.jm, parsedValue.jd), englishDigits)
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
              isOpen ? `rotate-180 ${colorStyles.text}` : ''
            }`} />
          </div>
        </button>

        {/* Desktop Calendar Dropdown Popup */}
        {isOpen && !isMobile && (
          <div
            ref={dropdownRef}
            role="dialog"
            aria-label="تقویم شمسی"
            className={`absolute z-50 ${
              horizontalAlign === 'left' ? 'left-0 right-auto' : 'right-0 left-auto'
            } w-72 sm:w-80 max-w-[calc(100vw-2rem)] p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none ${
              openUpward
                ? `bottom-full mb-1.5 ${horizontalAlign === 'left' ? 'origin-bottom-left' : 'origin-bottom-right'}`
                : `top-full mt-1.5 ${horizontalAlign === 'left' ? 'origin-top-left' : 'origin-top-right'}`
            }`}
          >
            {renderCalendarContent(false)}
          </div>
        )}

        {/* Mobile Bottom Sheet Modal */}
        {isOpen && isMobile && typeof document !== 'undefined' && createPortal(
          <div className="fixed inset-0 z-50 flex flex-col justify-end" dir="rtl">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
              onClick={() => setIsOpen(false)}
            />

            {/* Bottom Sheet Drawer */}
            <div
              ref={dropdownRef}
              role="dialog"
              aria-label="تقویم شمسی"
              className="relative z-10 w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-4 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-200 select-none"
            >
              {/* Drag Handle */}
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3" />
              {renderCalendarContent(true)}
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

export default PersianDatePicker;
