import React from 'react';
import { TrendingUp, MapPin, Waves, Building2, Stethoscope, Fuel } from 'lucide-react';

const DEFAULT_POPULAR_TAGS = [
  { label: 'استخر شهید رجایی', icon: Waves },
  { label: 'سبزه‌میدان (میدان آزادی)', icon: MapPin },
  { label: 'خیابان خیام شمالی', icon: Building2 },
  { label: 'خیابان دانشگاه', icon: Building2 },
  { label: 'بلوار نوروزیان', icon: Building2 },
  { label: 'بیمارستان ولایت (پونک)', icon: Stethoscope },
  { label: 'شهرک کوثر', icon: Building2 },
  { label: 'شهرک مینودر', icon: Building2 },
  { label: 'سرای سعدالسلطنه', icon: MapPin },
  { label: 'داروخانه شبانه‌روزی', icon: Stethoscope },
  { label: 'پمپ بنزین بابایی', icon: Fuel },
];

export const PopularSearches = ({ onSelectTag }) => {
  return (
    <div className="py-2.5 px-3.5">
      <div className="flex items-center gap-1.5 mb-2.5">
        <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
          جستجوهای پرطرفدار در شهر قزوین
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {DEFAULT_POPULAR_TAGS.map((tag) => {
          const TagIcon = tag.icon;
          return (
            <button
              key={tag.label}
              type="button"
              onClick={() => onSelectTag(tag.label)}
              className="
                inline-flex items-center gap-1.5
                px-2.5 py-1.5
                rounded-xl
                bg-slate-100/80 dark:bg-slate-800/80
                hover:bg-sky-50 dark:hover:bg-sky-950/40
                hover:border-sky-300 dark:hover:border-sky-700
                border border-transparent
                text-slate-700 dark:text-slate-300
                hover:text-sky-700 dark:hover:text-sky-300
                text-[11px] font-medium
                transition-all duration-150
                cursor-pointer
              "
            >
              <TagIcon className="w-3 h-3 text-slate-400 group-hover:text-sky-500" />
              <span>{tag.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PopularSearches;
