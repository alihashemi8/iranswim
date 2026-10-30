import React, { useState, useRef, useEffect } from 'react';
import { GraduationCap, Check, ChevronDown, ChevronUp, UserX, Loader2, Sparkles } from 'lucide-react';

export const CoachSelectorDropdown = ({
  currentCoach,
  availableCoaches = [],
  onSelectCoach,
  placement = 'auto', // 'auto', 'dropup', 'dropdown'
  size = 'md', // 'sm', 'md'
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Determine dropup or dropdown if auto
  const [actualPlacement, setActualPlacement] = useState(placement === 'auto' ? 'dropdown' : placement);

  useEffect(() => {
    if (placement === 'auto' && isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 260) {
        setActualPlacement('dropup');
      } else {
        setActualPlacement('dropdown');
      }
    } else if (placement !== 'auto') {
      setActualPlacement(placement);
    }
  }, [isOpen, placement]);

  const handleSelect = async (coachId) => {
    if (disabled || loading) return;
    try {
      setLoading(true);
      await onSelectCoach(coachId);
      setIsOpen(false);
    } catch (err) {
      console.error('Error assigning coach:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative inline-block text-right ${className}`} ref={dropdownRef}>
      {/* TRIGGER BUTTON */}
      {currentCoach ? (
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-sky-50/80 dark:hover:bg-sky-950/50 border border-slate-200/90 dark:border-slate-700/80 hover:border-sky-300 dark:hover:border-sky-600 transition-all cursor-pointer text-right shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed ${
            size === 'sm' ? 'text-[11px] py-1 px-2' : ''
          }`}
          title="کلیک برای تغییر مربی شناگر"
        >
          {/* Coach Avatar (Micro) */}
          <div className="relative shrink-0">
            {currentCoach.avatar ? (
              <img
                src={currentCoach.avatar}
                alt={currentCoach.full_name || 'مربی'}
                className="w-7 h-7 rounded-full object-cover border border-sky-400 dark:border-sky-500 shadow-2xs"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                {currentCoach.full_name ? currentCoach.full_name.charAt(0) : 'م'}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-white dark:border-slate-900 rounded-full" />
          </div>

          <div className="flex flex-col text-right min-w-[70px]">
            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium leading-none">
              مربی:
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors mt-0.5 truncate max-w-[120px]">
              {currentCoach.full_name}
            </span>
          </div>

          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600 shrink-0" />
          ) : actualPlacement === 'dropup' && isOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 transition-transform shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 transition-transform shrink-0" />
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-dashed border-amber-300 dark:border-amber-700/60 font-bold text-xs transition-colors cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed ${
            size === 'sm' ? 'text-[11px] py-1 px-2' : ''
          }`}
          title="کلیک جهت انتخاب مربی برای این شناگر"
        >
          <GraduationCap className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>تخصیص مربی</span>
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin text-amber-600 shrink-0" />
          ) : actualPlacement === 'dropup' && isOpen ? (
            <ChevronUp className="w-3 h-3 text-amber-500 shrink-0" />
          ) : (
            <ChevronDown className="w-3 h-3 text-amber-500 shrink-0" />
          )}
        </button>
      )}

      {/* POPUP DROPDOWN / DROPUP MENU */}
      {isOpen && (
        <div
          className={`absolute z-50 w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-2 animate-in fade-in zoom-in-95 duration-150 right-0 ${
            actualPlacement === 'dropup'
              ? 'bottom-full mb-2'
              : 'top-full mt-2'
          }`}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-white">
                انتخاب مربی دوره
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {availableCoaches.length} مربی
            </span>
          </div>

          {/* Coach Options */}
          <div className="py-1 max-h-56 overflow-y-auto space-y-1">
            {availableCoaches.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                مربی برای این دوره ثبت نشده است.
              </div>
            ) : (
              availableCoaches.map((c) => {
                const isSelected = currentCoach && currentCoach.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelect(c.id)}
                    disabled={loading}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-right transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 font-bold border border-sky-200/80 dark:border-sky-800'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Coach Avatar */}
                      <div className="relative shrink-0">
                        {c.avatar ? (
                          <img
                            src={c.avatar}
                            alt={c.full_name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                            {c.full_name ? c.full_name.charAt(0) : 'م'}
                          </div>
                        )}
                      </div>

                      <div>
                        <span className="text-xs font-bold block">
                          {c.full_name}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {c.class_name || `کلاس ${c.full_name}`}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Unassign option if coach is set */}
          {currentCoach && (
            <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleSelect(null)}
                disabled={loading}
                className="w-full flex items-center gap-2 p-2 rounded-xl text-right text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <UserX className="w-3.5 h-3.5 shrink-0" />
                <span>حذف تخصیص (بدون مربی)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
