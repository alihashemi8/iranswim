import React from 'react';
import {
  MapPin,
  Waves,
  Activity,
  GraduationCap,
  ShoppingBag,
  Sparkles,
  Train,
  Landmark,
  Compass,
  Building2,
  ChevronLeft,
  Navigation,
  Fuel,
  Search,
} from 'lucide-react';

const ICON_MAP = {
  MapPin,
  Waves,
  Activity,
  GraduationCap,
  ShoppingBag,
  Sparkles,
  Train,
  Landmark,
  Compass,
  Building2,
  Navigation,
  Fuel,
  Search,
};

export const SearchSuggestionItem = ({
  item,
  isActive = false,
  onSelect,
  index,
}) => {
  const IconComponent = ICON_MAP[item.icon] || MapPin;

  return (
    <li
      id={`suggestion-item-${index}`}
      role="option"
      aria-selected={isActive}
      onClick={() => onSelect(item)}
      className={`
        group flex items-center justify-between gap-3
        px-3.5 py-2.5
        rounded-xl
        cursor-pointer
        transition-all duration-150
        text-right select-none
        ${
          isActive
            ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-950 dark:text-sky-100 ring-1 ring-sky-300 dark:ring-sky-700'
            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
        }
      `}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Category Icon Badge */}
        <div
          className={`
            w-8 h-8 rounded-lg shrink-0 flex items-center justify-center
            transition-colors
            ${
              isActive
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 group-hover:bg-sky-100 dark:group-hover:bg-slate-700'
            }
          `}
        >
          <IconComponent className="w-4 h-4" />
        </div>

        {/* Text Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold truncate text-slate-900 dark:text-slate-100">
              {item.title}
            </span>
            {item.category_label && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                {item.category_label}
              </span>
            )}
          </div>
          {item.subtitle && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-normal leading-relaxed">
              {item.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Trailing: Distance & Chevron */}
      <div className="flex items-center gap-2 shrink-0">
        {item.distance_persian && (
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
            {item.distance_persian}
          </span>
        )}
        <ChevronLeft
          className={`
            w-4 h-4 transition-transform
            ${isActive ? 'text-sky-600 dark:text-sky-400 -translate-x-0.5' : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-400'}
          `}
        />
      </div>
    </li>
  );
};

export default SearchSuggestionItem;
