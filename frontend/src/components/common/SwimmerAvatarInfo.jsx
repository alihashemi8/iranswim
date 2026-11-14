import React from 'react';
import { toShamsiDate } from '../../utils/date';

/**
 * عکس شناگر همراه با جایگزین (حرف اول نام) در صورت نبود عکس پروفایل
 * @param {string}  fullName نام کامل شناگر
 * @param {string}  avatar   آدرس عکس پروفایل (اختیاری)
 * @param {'sm'|'md'|'lg'} size اندازه آواتار
 */
export const SwimmerAvatar = ({ fullName, avatar, alt, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-11 h-11 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-14 h-14 sm:w-20 sm:h-20 text-xl',
  };
  const fallbackInitial = fullName?.trim()?.charAt(0) || 'ش';

  return (
    <div
      className={`${sizeClasses[size] || sizeClasses.md} rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center font-bold shrink-0 overflow-hidden ${className}`}
    >
      {avatar ? (
        <img
          src={avatar}
          alt={alt || `${fullName || 'شناگر'} — عکس پروفایل`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        fallbackInitial
      )}
    </div>
  );
};

/**
 * نمایش تاریخ تولد شمسی و سن شناگر در یک خط؛ اگر هیچ‌کدام موجود نباشد رندر نمی‌شود
 */
export const SwimmerBirthLine = ({ age, dateOfBirth, className = '' }) => {
  if (!age && !dateOfBirth) return null;
  const shamsiDate = dateOfBirth ? toShamsiDate(dateOfBirth).shortNumeric : '';

  return (
    <span
      className={`text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap block ${className}`}
    >
      {age ? `${age} ساله` : ''}
      {age && shamsiDate ? ' · ' : ''}
      {shamsiDate}
    </span>
  );
};
