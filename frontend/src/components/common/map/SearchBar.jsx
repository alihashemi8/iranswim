import React, { forwardRef } from 'react';
import { Search, X, Loader2, MapPin } from 'lucide-react';

export const SearchBar = forwardRef(
  (
    {
      value,
      onChange,
      onClear,
      onFocus,
      onKeyDown,
      placeholder = 'جستجوی آدرس در قزوین (شهر، محله، خیابان، کوچه...)',
      loading = false,
      isOpen = false,
      disabled = false,
    },
    ref
  ) => {
    return (
      <div
        className="
          flex items-center gap-2.5
          h-11 sm:h-12
          bg-white/98 dark:bg-slate-900/98
          backdrop-blur-md
          border border-sky-200/90 dark:border-slate-700/90
          rounded-2xl
          px-3.5
          shadow-lg shadow-slate-900/10 dark:shadow-black/40
          transition-all duration-200
          focus-within:border-sky-500 dark:focus-within:border-sky-400
          focus-within:ring-2 focus-within:ring-sky-200/60 dark:focus-within:ring-sky-500/25
        "
      >
        {/* Search Icon or Loading Spinner */}
        <div className="shrink-0 flex items-center justify-center text-sky-600 dark:text-sky-400">
          {loading ? (
            <Loader2 className="w-4.5 h-4.5 animate-spin" />
          ) : (
            <Search className="w-4.5 h-4.5" />
          )}
        </div>

        {/* Input */}
        <input
          ref={ref}
          type="text"
          dir="rtl"
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          className="
            flex-1 min-w-0
            bg-transparent
            outline-none
            text-xs sm:text-sm
            text-right
            text-slate-800 dark:text-slate-100
            placeholder:text-slate-400 dark:placeholder:text-slate-500
            font-medium
          "
        />

        {/* Clear Button */}
        {value && !disabled && (
          <button
            type="button"
            onClick={onClear}
            className="
              shrink-0 p-1
              rounded-full
              text-slate-400 hover:text-slate-600 dark:hover:text-slate-200
              hover:bg-slate-100 dark:hover:bg-slate-800
              transition-colors
              cursor-pointer
            "
            title="پاک کردن متن جستجو"
            aria-label="پاک کردن متن جستجو"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* City Scope Badge */}
        <div className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-md border border-sky-200/60 dark:border-sky-800/60 shrink-0 select-none">
          <MapPin className="w-3 h-3 text-sky-500" />
          <span>قزوین</span>
        </div>
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';

export default SearchBar;
