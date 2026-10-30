import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export const CustomSelect = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'انتخاب کنید...',
  icon: Icon,
  className = '',
  searchable = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options: can be strings or objects { value, label, icon, description }
  const normalizedOptions = options.map((opt) =>
    typeof opt === 'object' && opt !== null ? opt : { value: opt, label: opt }
  );

  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  // Filter options if searchable
  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.trim().toLowerCase();
    const l = opt.label?.toLowerCase() || '';
    const d = opt.description?.toLowerCase() || '';
    return l.includes(q) || d.includes(q);
  });

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen, searchable]);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  const isSelectedActive = value !== undefined && value !== null && value !== '';
  const DisplayIcon = selectedOption?.icon || Icon;

  return (
    <div className={`relative ${className}`} ref={containerRef} dir="rtl">
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-right px-3.5 py-2.5 text-xs rounded-xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer select-none ${
          disabled ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''
        } ${
          isSelectedActive
            ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'
            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
        } ${
          isOpen
            ? 'ring-2 ring-sky-500/25 border-sky-500 dark:border-sky-500 bg-white dark:bg-slate-900 shadow-xs'
            : 'hover:border-slate-300 dark:hover:border-slate-600'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
          {DisplayIcon && (
            <DisplayIcon
              className={`w-4 h-4 shrink-0 transition-colors ${
                isSelectedActive
                  ? 'text-sky-600 dark:text-sky-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            />
          )}
          <span
            className={`truncate ${
              isSelectedActive
                ? 'font-bold text-slate-800 dark:text-slate-100'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 mr-1">
          <ChevronDown
            className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-sky-600 dark:text-sky-400' : ''
            }`}
          />
        </div>
      </button>

      {/* Custom Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute z-50 w-full min-w-[210px] mt-1.5 py-1.5 bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden animate-in fade-in-50 zoom-in-95"
          role="listbox"
        >
          {/* Optional Search inside dropdown */}
          {(searchable || normalizedOptions.length > 7) && (
            <div className="p-2 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="جستجو در گزینه‌ها..."
                  className="w-full text-xs pr-8 pl-6 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-1 divide-y-0 text-xs">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-slate-400 text-[11px]">
                گزینه‌ای یافت نشد
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                const OptIcon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-right px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-bold border border-sky-200/80 dark:border-sky-800/80'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border border-transparent'
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {OptIcon && (
                        <OptIcon
                          className={`w-4 h-4 shrink-0 ${
                            isSelected
                              ? 'text-sky-600 dark:text-sky-400'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        />
                      )}
                      <div className="min-w-0">
                        <span className="truncate block font-semibold">{opt.label}</span>
                        {opt.description && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate font-normal mt-0.5">
                            {opt.description}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
