import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * Unified BackButton for coach and dashboard sub-pages.
 * Maintains consistent styling, responsive label, and smart history-fallback navigation.
 */
export const BackButton = ({
  to,
  fallback = '/coach',
  label = 'بازگشت',
  title = 'بازگشت به صفحه قبل',
  showLabel = true,
  showLabelAlways = false,
  forceTo = false,
  className = '',
  onClick,
}) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
      return;
    }

    if (forceTo && to) {
      navigate(to);
      return;
    }

    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else if (to) {
      navigate(to);
    } else if (fallback) {
      navigate(fallback);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={title || label}
      aria-label={title || label}
      className={`inline-flex items-center justify-center gap-2 min-h-[40px] min-w-[40px] px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 bg-slate-100 hover:bg-slate-200/90 dark:bg-slate-800 dark:hover:bg-slate-700/90 border border-slate-200/90 dark:border-slate-700/90 transition-all cursor-pointer shadow-xs shrink-0 active:scale-95 group select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${className}`}
    >
      <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
      {showLabel && (
        <span className={`tracking-tight ${showLabelAlways ? 'inline' : 'hidden sm:inline'}`}>
          {label}
        </span>
      )}
    </button>
  );
};

export default BackButton;
