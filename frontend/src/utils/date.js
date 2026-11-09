/**
 * Persian Date and Relative Time Utilities
 */

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
