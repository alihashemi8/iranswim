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
  Navigation,
  Fuel,
  Check,
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
};

export const SearchResultItem = ({ item, onSelect }) => {
  const IconComponent = ICON_MAP[item.icon] || MapPin;

  return (
    <div
      onClick={() => onSelect(item)}
      className="
        group p-3 sm:p-3.5
        rounded-2xl
        border border-slate-200/80 dark:border-slate-800
        bg-white/95 dark:bg-slate-900/90
        hover:border-sky-300 dark:hover:border-sky-700
        hover:shadow-md hover:shadow-sky-500/5
        transition-all duration-200
        cursor-pointer
        text-right
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
            <IconComponent className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                {item.title}
              </h4>
              {item.category_label && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                  {item.category_label}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
              {item.address}
            </p>

            {item.neighborhood && (
              <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                <span>محله: <strong className="text-slate-600 dark:text-slate-300 font-semibold">{item.neighborhood}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Distance & Action */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {item.distance_persian && (
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
              {item.distance_persian}
            </span>
          )}

          <button
            type="button"
            className="
              inline-flex items-center gap-1
              px-2.5 py-1
              rounded-lg
              bg-sky-50 dark:bg-sky-950/50
              group-hover:bg-sky-600
              text-sky-700 dark:text-sky-300
              group-hover:text-white
              text-[11px] font-medium
              transition-all duration-150
            "
          >
            <Check className="w-3.5 h-3.5" />
            <span>انتخاب</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchResultItem;
