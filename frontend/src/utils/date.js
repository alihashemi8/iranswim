/**
 * Persian Date and Relative Time Utilities
 */

import * as jalaali from 'jalaali-js';

const PERSIAN_MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

/**
 * Format ISO date string "YYYY-MM-DD" or Date object to Solar Hijri (Shamsi) details
 * Returns fullText: "پنج‌شنبه ۱ آبان ۱۴۰۵", shortNumeric: "۱۴۰۵/۰۸/۰۱", weekday: "پنج‌شنبه", etc.
 */
export const toShamsiDate = (dateInput) => {
  if (!dateInput) return { fullText: '', shortNumeric: '', weekday: '', monthName: '' };
  let gy, gm, gd;
  if (typeof dateInput === 'string') {
    const clean = dateInput.split('T')[0];
    const parts = clean.split('-').map((p) => parseInt(p, 10));
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      gy = parts[0];
      gm = parts[1];
      gd = parts[2];
    } else {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return { fullText: dateInput, shortNumeric: dateInput, weekday: '', monthName: '' };
      gy = d.getFullYear();
      gm = d.getMonth() + 1;
      gd = d.getDate();
    }
  } else if (dateInput instanceof Date) {
    gy = dateInput.getFullYear();
    gm = dateInput.getMonth() + 1;
    gd = dateInput.getDate();
  } else {
    return { fullText: String(dateInput), shortNumeric: String(dateInput), weekday: '', monthName: '' };
  }

  const { jy, jm, jd } = jalaali.toJalaali(gy, gm, gd);
  const dObj = new Date(gy, gm - 1, gd);
  const weekday = dObj.toLocaleDateString('fa-IR', { weekday: 'long' });
  const monthName = PERSIAN_MONTH_NAMES[jm - 1] || '';

  const shortNumeric = `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
  const fullText = `${weekday} ${jd} ${monthName} ${jy}`;

  return {
    jy,
    jm,
    jd,
    weekday,
    monthName,
    fullText,
    shortNumeric,
  };
};

/**
 * Converts Persian and Arabic unicode digits to English ASCII digits
 */
export const toEnglishDigits = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/[۰-۹]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 1728))
    .replace(/[٠-٩]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 1584));
};

/**
 * Format date in Persian Solar Hijri calendar using Latin / English numerals
 */
export const formatPersianDateEn = (dateString, options = {}) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options,
  }).format(date);
};

export const formatPersianDate = (dateString, options = {}) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  // Auto-detect coach panel environment
  const isCoach = typeof document !== 'undefined' && (
    document.body?.classList?.contains('coach-panel') ||
    document.body?.getAttribute('data-panel') === 'coach'
  );

  const useEnglishDigits = options.englishDigits ?? isCoach;
  const locale = useEnglishDigits ? 'fa-IR-u-nu-latn' : 'fa-IR';

  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'هم‌اکنون';
  if (diffMin < 60) return `${diffMin.toLocaleString(locale)} دقیقه پیش`;
  if (diffHour < 24) return `${diffHour.toLocaleString(locale)} ساعت پیش`;
  if (diffDay === 1) return 'دیروز';
  if (diffDay < 7) return `${diffDay.toLocaleString(locale)} روز پیش`;

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
