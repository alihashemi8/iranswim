import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { GraduationCap, Check, ChevronDown, ChevronUp, UserX, Loader2, Search, X, Users } from 'lucide-react';

export const CoachSelectorDropdown = ({
  currentCoach,
  availableCoaches = [],
  allCoaches = [],
  onSelectCoach,
  placement = 'auto', // 'auto', 'dropup', 'dropdown'
  size = 'md', // 'sm', 'md'
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [coords, setCoords] = useState(null);

  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  // Calculate position in viewport synchronously
  const calculatePosition = () => {
    if (!buttonRef.current) return null;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const menuWidth = Math.min(300, window.innerWidth - 24);

    const newCoords = { width: menuWidth };

    // Vertical placement
    if (placement === 'dropdown') {
      newCoords.top = rect.bottom + 6;
      newCoords.maxHeight = Math.min(360, Math.max(180, spaceBelow - 16));
    } else if (placement === 'dropup') {
      newCoords.bottom = window.innerHeight - rect.top + 6;
      newCoords.maxHeight = Math.min(360, Math.max(180, spaceAbove - 16));
    } else {
      // Auto
      if (spaceBelow >= 260 || spaceBelow >= spaceAbove) {
        newCoords.top = rect.bottom + 6;
        newCoords.maxHeight = Math.min(360, Math.max(180, spaceBelow - 16));
      } else {
        newCoords.bottom = window.innerHeight - rect.top + 6;
        newCoords.maxHeight = Math.min(360, Math.max(180, spaceAbove - 16));
      }
    }

    // Horizontal placement (RTL alignment)
    const rightOffset = window.innerWidth - rect.right;
    if (rightOffset + menuWidth > window.innerWidth - 12) {
      newCoords.left = 12;
      newCoords.right = undefined;
    } else if (rightOffset < 12) {
      newCoords.right = 12;
      newCoords.left = undefined;
    } else {
      newCoords.right = rightOffset;
      newCoords.left = undefined;
    }

    return newCoords;
  };

  const handleToggle = () => {
    if (disabled || loading) return;
    if (!isOpen) {
      const pos = calculatePosition();
      setCoords(pos);
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setCoords(null);
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      return;
    }

    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
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
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen]);

  const handleSelect = async (coachId) => {
    if (disabled || loading) return;
    try {
      setLoading(true);
      await onSelectCoach(coachId);
      setIsOpen(false);
      setCoords(null);
    } catch (err) {
      console.error('Error assigning coach:', err);
    } finally {
      setLoading(false);
    }
  };

  // Merge available coaches & other academy coaches
  const { courseCoachesList, otherCoachesList } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filterFn = (c) => !q || (c.full_name && c.full_name.toLowerCase().includes(q));

    const courseCoaches = (availableCoaches || []).filter(filterFn);
    const courseCoachIds = new Set((availableCoaches || []).map((c) => c.id));

    const otherCoaches = (allCoaches || [])
      .filter((c) => !courseCoachIds.has(c.id))
      .filter(filterFn);

    return { courseCoachesList: courseCoaches, otherCoachesList: otherCoaches };
  }, [availableCoaches, allCoaches, searchQuery]);

  const totalCoachesCount = courseCoachesList.length + otherCoachesList.length;

  return (
    <div className={`relative inline-block text-right ${className}`}>
      {/* TRIGGER BUTTON */}
      {currentCoach ? (
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          disabled={disabled || loading}
          className={`group inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-sky-50/80 dark:hover:bg-sky-950/50 border border-slate-200/90 dark:border-slate-700/80 hover:border-sky-300 dark:hover:border-sky-600 transition-colors cursor-pointer text-right shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0 ${
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

          <div className="flex items-center gap-1 text-right min-w-0">
            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium whitespace-nowrap">
              مربی:
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate max-w-[110px] whitespace-nowrap">
              {currentCoach.full_name}
            </span>
          </div>

          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600 shrink-0" />
          ) : isOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 transition-transform shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 transition-transform shrink-0" />
          )}
        </button>
      ) : (
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          disabled={disabled || loading}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-dashed border-amber-300 dark:border-amber-700/60 font-bold text-xs transition-colors cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0 ${
            size === 'sm' ? 'text-[11px] py-1 px-2' : ''
          }`}
          title="کلیک جهت انتخاب مربی برای این شناگر"
        >
          <GraduationCap className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="whitespace-nowrap">تخصیص مربی</span>
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin text-amber-600 shrink-0" />
          ) : isOpen ? (
            <ChevronUp className="w-3 h-3 text-amber-500 shrink-0" />
          ) : (
            <ChevronDown className="w-3 h-3 text-amber-500 shrink-0" />
          )}
        </button>
      )}

      {/* PORTAL DROPDOWN / DROPUP MENU */}
      {isOpen &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: coords.top !== undefined ? `${coords.top}px` : undefined,
              bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
              right: coords.right !== undefined ? `${coords.right}px` : undefined,
              left: coords.left !== undefined ? `${coords.left}px` : undefined,
              width: `${coords.width}px`,
              maxHeight: `${coords.maxHeight}px`,
              zIndex: 99999,
            }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-2.5 flex flex-col text-right font-sans transition-none"
          >
            {/* Header */}
            <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  انتخاب مربی شناگر
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {totalCoachesCount} مربی
              </span>
            </div>

            {/* Search Box if more than 3 coaches */}
            {(availableCoaches.length + allCoaches.length > 3) && (
              <div className="relative my-2 shrink-0">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی نام مربی..."
                  className="w-full pl-7 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Unassign option if coach is currently set */}
            {currentCoach && (
              <div className="my-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSelect(null)}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-800/70 transition-colors text-xs font-semibold cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <UserX className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>حذف تخصیص مربی (بدون مربی)</span>
                  </div>
                  <span className="text-[10px] bg-rose-200/60 dark:bg-rose-900/80 px-2 py-0.5 rounded-md font-bold text-rose-800 dark:text-rose-200">
                    لغو
                  </span>
                </button>
              </div>
            )}

            {/* Scrollable Coaches List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 max-h-56">
              {totalCoachesCount === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  مربی یافت نشد.
                </div>
              ) : (
                <>
                  {/* Course Coaches Section */}
                  {courseCoachesList.length > 0 && (
                    <div className="space-y-1">
                      {otherCoachesList.length > 0 && (
                        <div className="px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-300 flex items-center justify-between">
                          <span>مربیان این دوره</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {courseCoachesList.length}
                          </span>
                        </div>
                      )}
                      {courseCoachesList.map((c) => {
                        const isSelected = currentCoach && String(currentCoach.id) === String(c.id);
                        return (
                          <CoachOptionItem
                            key={c.id}
                            coach={c}
                            isSelected={isSelected}
                            onSelect={handleSelect}
                            loading={loading}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Other Academy Coaches Section */}
                  {otherCoachesList.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>سایر مربیان آموزشگاه</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {otherCoachesList.length}
                        </span>
                      </div>
                      {otherCoachesList.map((c) => {
                        const isSelected = currentCoach && String(currentCoach.id) === String(c.id);
                        return (
                          <CoachOptionItem
                            key={c.id}
                            coach={c}
                            isSelected={isSelected}
                            onSelect={handleSelect}
                            loading={loading}
                          />
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

// Sub-component for individual coach row
const CoachOptionItem = ({ coach, isSelected, onSelect, loading }) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(coach.id)}
      disabled={loading}
      className={`w-full flex items-center justify-between p-2 rounded-xl text-right transition-colors cursor-pointer ${
        isSelected
          ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 font-bold border border-sky-200/80 dark:border-sky-800'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Coach Avatar */}
        <div className="relative shrink-0">
          {coach.avatar ? (
            <img
              src={coach.avatar}
              alt={coach.full_name}
              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              {coach.full_name ? coach.full_name.charAt(0) : 'م'}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <span className="text-xs font-bold block truncate">
            {coach.full_name}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
            {coach.class_name || `کلاس مربی ${coach.full_name}`}
          </span>
        </div>
      </div>

      {isSelected && (
        <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 mr-2">
          <Check className="w-3 h-3 stroke-[2.5]" />
        </span>
      )}
    </button>
  );
};
