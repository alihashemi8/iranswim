/**
 * Persian Date and Relative Time Utilities
 */

export const formatPersianDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'هم‌اکنون';
  if (diffMin < 60) return `${diffMin.toLocaleString('fa-IR')} دقیقه پیش`;
  if (diffHour < 24) return `${diffHour.toLocaleString('fa-IR')} ساعت پیش`;
  if (diffDay === 1) return 'دیروز';
  if (diffDay < 7) return `${diffDay.toLocaleString('fa-IR')} روز پیش`;

  return new Intl.DateTimeFormat('fa-IR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
