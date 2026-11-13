import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { GraduationCap, Check, ChevronDown, Search, X, UserX, Sparkles, Award } from 'lucide-react';

export const CoachSelectField = ({
  coaches = [],
  value,
  onChange,
  placeholder = 'لطفاً یک مربی را از کادر آکادمی انتخاب کنید...',
  label,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [coords, setCoords] = useState(null);

  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);

  // Find currently selected coach
  const selectedCoach = useMemo(() => {
    if (!value) return null;
    return coaches.find((c) => String(c.id) === String(value)) || null;
  }, [coaches, value]);

  // Calculate fixed viewport position for portal
  const calculatePosition = () => {
    if (!triggerRef.current) return null;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const menuWidth = rect.width;
    const safeWidth = Math.min(menuWidth, window.innerWidth - 24);
    const safeLeft = Math.max(12, Math.min(rect.left, window.innerWidth - safeWidth - 12));

    const newCoords = {
      width: safeWidth,
      left: safeLeft,
    };

    // If space below is too small, flip upwards
    if (spaceBelow < 280 && spaceAbove > spaceBelow) {
      newCoords.bottom = window.innerHeight - rect.top + 6;
      newCoords.maxHeight = Math.min(320, Math.max(160, spaceAbove - 16));
    } else {
      newCoords.top = rect.bottom + 6;
      newCoords.maxHeight = Math.min(320, Math.max(160, spaceBelow - 16));
    }

    return newCoords;
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      const pos = calculatePosition();
      setCoords(pos);
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setCoords(null);
    }
  };

  // Close on outside click, scroll or resize
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      return;
    }

    // Auto-focus search input when opened
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 40);

    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
        setCoords(null);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setCoords(null);
      }
    };

    const handleScrollOrResize = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      const pos = calculatePosition();
      if (pos) setCoords(pos);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen]);

  // Filter coaches by name or coaching degree
  const filteredCoaches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return coaches;
    return coaches.filter((c) => {
      const name = (c.full_name || '').toLowerCase();
      const deg = (c.coaching_degree_display || c.coaching_degree || '').toLowerCase();
      return name.includes(q) || deg.includes(q);
    });
  }, [coaches, searchQuery]);

  const handleSelect = (coachId) => {
    onChange(coachId);
    setIsOpen(false);
    setCoords(null);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
    setCoords(null);
  };

  return (
    <div className={`relative w-full text-right ${className}`} dir="rtl">
      {label && (
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
          {label}
        </label>
      )}

      {/* TRIGGER BUTTON */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-3 text-right cursor-pointer select-none ${
          disabled
            ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            : isOpen
            ? 'bg-white dark:bg-slate-900 border-sky-500 dark:border-sky-500 ring-3 ring-sky-500/20 shadow-xs'
            : selectedCoach
            ? 'bg-sky-50/50 dark:bg-sky-950/25 border-sky-300 dark:border-sky-700/80 hover:border-sky-400 dark:hover:border-sky-600'
            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100/60 dark:hover:bg-slate-800'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {selectedCoach ? (
            <>
              {/* Selected Coach Avatar */}
              <div className="relative shrink-0">
                {selectedCoach.avatar ? (
                  <img
                    src={selectedCoach.avatar}
                    alt={selectedCoach.full_name}
                    className="w-9 h-9 rounded-xl object-cover border border-sky-300 dark:border-sky-600 shadow-2xs"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                    {selectedCoach.full_name ? selectedCoach.full_name.charAt(0) : 'م'}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
              </div>

              {/* Selected Coach Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    مربی {selectedCoach.full_name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold shrink-0">
                    کادر آکادمی
                  </span>
                </div>
                {(selectedCoach.coaching_degree_display || selectedCoach.coaching_degree) && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {selectedCoach.coaching_degree_display || selectedCoach.coaching_degree}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Placeholder Icon */}
              <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-normal truncate">
                {placeholder}
              </span>
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0 mr-1">
          {selectedCoach && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="پاک کردن و انتخاب مجدد"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-sky-600 dark:text-sky-400' : ''
            }`}
          />
        </div>
      </button>

      {/* PORTAL FLOATING MENU */}
      {isOpen &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            dir="rtl"
            style={{
              position: 'fixed',
              top: coords.top !== undefined ? `${coords.top}px` : undefined,
              bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              maxHeight: `${coords.maxHeight}px`,
              zIndex: 99999,
            }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col text-right font-sans overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
            role="listbox"
          >
            {/* Header / Coach Counter */}
            <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50 shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <GraduationCap className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>مربیان در دسترس آکادمی</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 font-bold">
                {coaches.length} مربی
              </span>
            </div>

            {/* Search Box */}
            <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی نام مربی یا تخصص..."
                  className="w-full pr-9 pl-8 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Coaches List */}
            <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
              {filteredCoaches.length === 0 ? (
                <div className="py-6 px-4 text-center text-xs text-slate-400 dark:text-slate-500 flex flex-col items-center gap-2">
                  <UserX className="w-8 h-8 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
                  <span>هیچ مربی‌ای با این مشخصات یافت نشد</span>
                </div>
              ) : (
                filteredCoaches.map((c) => {
                  const isSelected = String(c.id) === String(value);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelect(c.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-right transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-sky-50 dark:bg-sky-950/70 border border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-100 shadow-2xs font-semibold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-transparent'
                      }`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          {c.avatar ? (
                            <img
                              src={c.avatar}
                              alt={c.full_name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                              {c.full_name ? c.full_name.charAt(0) : 'م'}
                            </div>
                          )}
                          <span className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                        </div>

                        {/* Name & Specialties */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold block truncate">
                              مربی {c.full_name}
                            </span>
                          </div>
                          {c.coaching_degree_display || c.coaching_degree ? (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                              {c.coaching_degree_display || c.coaching_degree}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 block truncate mt-0.5">
                              مربی رسمی آکادمی شنا
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Selected Indicator */}
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 mr-2 shadow-2xs">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium px-2 py-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0">
                          انتخاب
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
