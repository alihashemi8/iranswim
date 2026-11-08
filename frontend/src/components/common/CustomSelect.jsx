import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export const CustomSelect = ({
  label,
  labelClassName = '',
  value,
  onChange,
  options = [],
  placeholder = 'انتخاب کنید...',
  icon: Icon,
  className = '',
  menuClassName = '',
  buttonClassName = '',
  searchable = false,
  disabled = false,
  clearable = false,
  size = 'md', // 'sm' | 'md'
  color = 'sky', // 'sky' | 'emerald' | 'blue' | 'amber'
  align = 'auto', // 'auto' | 'left' | 'right'
  placement = 'auto', // 'auto' | 'top' | 'bottom'
  isActive, // optional boolean override for active styling
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [alignLeft, setAlignLeft] = useState(align === 'left');
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options: can be strings or objects { value, label, icon, description, badge }
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
    const b = opt.badge != null ? String(opt.badge).toLowerCase() : '';
    return l.includes(q) || d.includes(q) || b.includes(q);
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
    if (isOpen && (searchable || normalizedOptions.length > 7) && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen, searchable, normalizedOptions.length]);

  // Calculate upward/downward and left/right placement
  const checkPlacement = () => {
    const triggerEl = triggerRef.current || containerRef.current;
    if (!triggerEl) return;
    const rect = triggerEl.getBoundingClientRect();
    const dropdownHeight = 260;
    let spaceBelow = window.innerHeight - rect.bottom;
    let spaceAbove = rect.top;

    let parent = triggerEl.parentElement;
    while (parent && parent !== document.body && parent !== document.documentElement) {
      const style = window.getComputedStyle(parent);
      const overflowY = style.overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'hidden') {
        const parentRect = parent.getBoundingClientRect();
        const parentSpaceBelow = parentRect.bottom - rect.bottom;
        const parentSpaceAbove = rect.top - parentRect.top;
        if (parentSpaceBelow < spaceBelow) {
          spaceBelow = parentSpaceBelow;
        }
        if (parentSpaceAbove < spaceAbove) {
          spaceAbove = parentSpaceAbove;
        }
      }
      parent = parent.parentElement;
    }

    if (placement === 'top') {
      setOpenUpward(true);
    } else if (placement === 'bottom') {
      setOpenUpward(false);
    } else if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      setOpenUpward(true);
    } else {
      setOpenUpward(false);
    }

    if (align === 'left') {
      setAlignLeft(true);
    } else if (align === 'right') {
      setAlignLeft(false);
    } else {
      // In RTL, standard anchoring to right:0 extends to the left.
      // If rect.right - minMenuWidth < 16, it clips on the viewport's left side.
      const menuMinW = 210;
      if (rect.right - menuMinW < 16) {
        setAlignLeft(true);
      } else {
        setAlignLeft(false);
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    checkPlacement();

    const handleScrollOrResize = () => {
      checkPlacement();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, filteredOptions.length]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      checkPlacement();
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const hasValue = selectedOption !== undefined;
  const isSelectedActive = isActive !== undefined
    ? Boolean(isActive)
    : (value !== undefined && value !== null && value !== '');
  const DisplayIcon = selectedOption?.icon || Icon;

  // Color schemes
  const colorStyles = {
    blue: {
      activeRing: 'ring-2 ring-blue-500/25 border-blue-500 dark:border-blue-500',
      activeTrigger: 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700/80 text-blue-950 dark:text-blue-100',
      activeIcon: 'text-blue-600 dark:text-blue-400',
      selectedItem: 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold border border-blue-200/80 dark:border-blue-800/80',
      selectedIconBox: 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400',
      selectedBadge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300',
      checkIcon: 'text-blue-600 dark:text-blue-400',
      searchFocus: 'focus:ring-blue-500',
    },
    sky: {
      activeRing: 'ring-2 ring-sky-500/25 border-sky-500 dark:border-sky-500',
      activeTrigger: 'bg-sky-50/50 dark:bg-sky-950/25 border-sky-300 dark:border-sky-700/80 text-sky-950 dark:text-sky-100',
      activeIcon: 'text-sky-600 dark:text-sky-400',
      selectedItem: 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-bold border border-sky-200/80 dark:border-sky-800/80',
      selectedIconBox: 'bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400',
      selectedBadge: 'bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300',
      checkIcon: 'text-sky-600 dark:text-sky-400',
      searchFocus: 'focus:ring-sky-500',
    },
    emerald: {
      activeRing: 'ring-2 ring-emerald-500/25 border-emerald-500 dark:border-emerald-500',
      activeTrigger: 'bg-emerald-50/50 dark:bg-emerald-950/25 border-emerald-300 dark:border-emerald-700/80 text-emerald-950 dark:text-emerald-100',
      activeIcon: 'text-emerald-600 dark:text-emerald-400',
      selectedItem: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200/80 dark:border-emerald-800/80',
      selectedIconBox: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400',
      selectedBadge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300',
      checkIcon: 'text-emerald-600 dark:text-emerald-400',
      searchFocus: 'focus:ring-emerald-500',
    },
    amber: {
      activeRing: 'ring-2 ring-amber-500/25 border-amber-500 dark:border-amber-500',
      activeTrigger: 'bg-amber-50/50 dark:bg-amber-950/25 border-amber-300 dark:border-amber-700/80 text-amber-950 dark:text-amber-100',
      activeIcon: 'text-amber-600 dark:text-amber-400',
      selectedItem: 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 font-bold border border-amber-200/80 dark:border-amber-800/80',
      selectedIconBox: 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400',
      selectedBadge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300',
      checkIcon: 'text-amber-600 dark:text-amber-400',
      searchFocus: 'focus:ring-amber-500',
    },
  }[color] || {
    activeRing: 'ring-2 ring-sky-500/25 border-sky-500 dark:border-sky-500',
    activeTrigger: 'bg-sky-50/50 dark:bg-sky-950/25 border-sky-300 dark:border-sky-700/80 text-sky-950 dark:text-sky-100',
    activeIcon: 'text-sky-600 dark:text-sky-400',
    selectedItem: 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-bold border border-sky-200/80 dark:border-sky-800/80',
    selectedIconBox: 'bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400',
    selectedBadge: 'bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300',
    checkIcon: 'text-sky-600 dark:text-sky-400',
    searchFocus: 'focus:ring-sky-500',
  };

  const isCompact = size === 'sm';

  return (
    <div className={`relative ${isOpen ? 'z-50' : 'z-10'} ${className}`} ref={containerRef} dir="rtl">
      {label && (
        <label
          className={`block font-semibold mb-1 truncate ${
            labelClassName || (isCompact ? 'text-xs text-slate-600 dark:text-slate-400' : 'text-xs sm:text-sm text-slate-700 dark:text-slate-300')
          }`}
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full text-right border transition-all flex items-center justify-between gap-2 cursor-pointer select-none rounded-xl ${
          isCompact ? 'px-2.5 py-1.5 text-xs sm:text-sm min-h-[36px]' : 'px-3.5 py-2.5 text-xs sm:text-sm min-h-[42px]'
        } ${
          disabled ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''
        } ${
          isSelectedActive
            ? `${colorStyles.activeTrigger} shadow-2xs font-bold`
            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
        } ${
          isOpen ? `${colorStyles.activeRing} bg-white dark:bg-slate-900 shadow-xs` : ''
        } ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
          {DisplayIcon && (
            <DisplayIcon
              className={`shrink-0 transition-colors ${isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${
                isSelectedActive
                  ? colorStyles.activeIcon
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            />
          )}
          <span
            className={`truncate ${
              isSelectedActive
                ? 'font-bold text-slate-900 dark:text-white'
                : hasValue
                ? 'font-medium text-slate-700 dark:text-slate-200'
                : 'text-slate-400 dark:text-slate-500 font-normal'
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption && selectedOption.badge !== undefined && selectedOption.badge !== null && selectedOption.badge !== '' && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded-md font-bold shrink-0 transition-colors ${
                selectedOption.badgeClassName ||
                (isSelectedActive
                  ? (colorStyles.selectedBadge || 'bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300')
                  : 'bg-slate-200/70 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300')
              }`}
            >
              {selectedOption.badge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 mr-1">
          {clearable && isSelectedActive && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleClear(e);
                }
              }}
              className="p-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
              title="پاک کردن فیلتر"
            >
              <X className={isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            </span>
          )}

          <ChevronDown
            className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
              isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'
            } ${
              isOpen ? `rotate-180 ${colorStyles.activeIcon}` : ''
            }`}
          />
        </div>
      </button>

      {/* Custom Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 ${
            menuClassName?.includes('w-full')
              ? 'left-0 right-0 w-full'
              : alignLeft
              ? 'left-0'
              : 'right-0'
          } ${
            menuClassName ? menuClassName : 'min-w-full min-w-[200px] w-max max-w-[min(380px,calc(100vw-2rem))]'
          } py-1.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/90 rounded-2xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 ${
            openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
          role="listbox"
        >
          {/* Search inside dropdown */}
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
                  className={`w-full text-xs sm:text-sm pr-8 pl-6 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 ${colorStyles.searchFocus}`}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-1 divide-y-0 text-xs sm:text-sm">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-slate-400 text-xs">
                گزینه‌ای یافت نشد
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                const OptIcon = opt.icon;
                const isDisabled = opt.disabled;
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      if (!isDisabled) handleSelect(opt.value);
                    }}
                    className={`w-full text-right px-3 py-2 rounded-xl text-xs sm:text-sm transition-colors flex items-center justify-between gap-2.5 ${
                      isDisabled
                        ? 'opacity-50 cursor-not-allowed bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500'
                        : isSelected
                        ? `${colorStyles.selectedItem} cursor-pointer`
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border border-transparent cursor-pointer'
                    }`}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isDisabled}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {OptIcon && (
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? colorStyles.selectedIconBox
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>
                          <OptIcon className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 text-right">
                        <span className="truncate block font-semibold text-slate-800 dark:text-slate-100">
                          {opt.label}
                        </span>
                        {opt.description && (
                          <span className="text-xs text-slate-400 dark:text-slate-500 block truncate font-normal mt-0.5">
                            {opt.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {(opt.badge !== undefined && opt.badge !== null && opt.badge !== '') && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-md font-bold shrink-0 ${
                            opt.badgeClassName ||
                            (isSelected
                              ? (colorStyles.selectedBadge || 'bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300')
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700')
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check className={`w-4 h-4 shrink-0 mr-1 ${colorStyles.checkIcon}`} />
                      )}
                    </div>
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
