import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

/**
 * Converts Persian and Arabic digits to English digits and removes non-numeric characters.
 */
export const toEnglishDigits = (value) => {
  if (!value && value !== 0) return '';
  return value
    .toString()
    .replace(/[۰-۹]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 1728))
    .replace(/[٠-٩]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 1584));
};

export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  showJumper = true,
  itemLabel = 'مورد',
  className = '',
}) => {
  const [jumpPage, setJumpPage] = useState('');

  if (totalPages <= 1 && totalItems <= pageSize) {
    return null;
  }

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const delta = 1;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  const handleJumpChange = (e) => {
    const englishValue = toEnglishDigits(e.target.value).replace(/\D/g, '');
    setJumpPage(englishValue);
  };

  const handleJumpSubmit = (e) => {
    if (e) e.preventDefault();
    if (!jumpPage) return;
    const pageNum = parseInt(jumpPage, 10);
    if (!isNaN(pageNum) && pageNum >= 1) {
      const targetPage = Math.min(pageNum, totalPages);
      onPageChange(targetPage);
      setJumpPage('');
    }
  };

  return (
    <div
      className={`flex flex-col md:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 ${className}`}
    >
      <div className="whitespace-nowrap">
        <span>
          نمایش <strong className="font-mono text-slate-700 dark:text-slate-200">{startItem}</strong> تا{' '}
          <strong className="font-mono text-slate-700 dark:text-slate-200">{endItem}</strong> از{' '}
          <strong className="font-mono text-slate-800 dark:text-white">{totalItems}</strong> {itemLabel}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {/* Next/Prev Page navigation buttons */}
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          {/* Previous page (In RTL, Prev is arrow right) */}
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            title="صفحه قبلی"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {getPageNumbers().map((page, idx) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400 font-mono select-none whitespace-nowrap">
                  ...
                </span>
              );
            }

            const isActive = page === currentPage;
            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={`min-w-8 h-8 px-2 rounded-lg font-mono text-xs font-semibold transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80'
                }`}
              >
                {page}
              </button>
            );
          })}

          {/* Next page (In RTL, Next is arrow left) */}
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            title="صفحه بعدی"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Page Jumper Input */}
        {showJumper && totalPages > 1 && (
          <form
            onSubmit={handleJumpSubmit}
            className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 shrink-0 whitespace-nowrap"
          >
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 select-none whitespace-nowrap">
              برو به صفحه:
            </span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={jumpPage}
              onChange={handleJumpChange}
              placeholder={currentPage.toString()}
              aria-label="شماره صفحه مورد نظر"
              className="w-12 h-7 px-1 text-center font-mono text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all shrink-0"
            />
            <span className="text-[11px] text-slate-400 font-mono select-none whitespace-nowrap">
              / {totalPages}
            </span>
            <button
              type="submit"
              disabled={!jumpPage || Number(jumpPage) < 1}
              className="px-2.5 h-7 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
            >
              برو
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
