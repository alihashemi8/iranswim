import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen, Check, ChevronDown, ChevronUp, UserX,
  Search, X, Layers, Users, GraduationCap
} from 'lucide-react';

export const ClassSelectorDropdown = ({
  currentClass,
  availableClasses = [],
  onSelectClass,
  placement = 'auto', // 'auto', 'dropup', 'dropdown'
  size = 'md', // 'sm', 'md'
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [coords, setCoords] = useState(null);

  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  // Helper to extract clean class label for trigger button
  const getDisplayTitle = () => {
    if (!currentClass) return '';
    const raw = currentClass.name || (currentClass.coach_name ? `کلاس ${currentClass.coach_name}` : 'کلاس شناگر');
    const cleaned = raw.replace(/^کلاس\s+(مربی\s+)?/, '').trim();
    return cleaned || raw;
  };

  // Calculate position in viewport synchronously
  const calculatePosition = () => {
    if (!buttonRef.current) return null;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const menuWidth = Math.min(350, window.innerWidth - 24);

    const newCoords = { width: menuWidth };

    // Vertical placement
    if (placement === 'dropdown') {
      newCoords.top = rect.bottom + 6;
      newCoords.maxHeight = Math.min(380, Math.max(180, spaceBelow - 16));
    } else if (placement === 'dropup') {
      newCoords.bottom = (window.innerHeight - rect.top) + 6;
      newCoords.maxHeight = Math.min(380, Math.max(180, spaceAbove - 16));
    } else {
      // Auto: choose side with more space
      if (spaceBelow >= 280 || spaceBelow >= spaceAbove) {
        newCoords.top = rect.bottom + 6;
        newCoords.maxHeight = Math.min(380, Math.max(180, spaceBelow - 16));
      } else {
        newCoords.bottom = (window.innerHeight - rect.top) + 6;
        newCoords.maxHeight = Math.min(380, Math.max(180, spaceAbove - 16));
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

  // Keep position pinned on scroll/resize without any animation
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      return;
    }

    const handleScrollOrResize = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      const pos = calculatePosition();
      if (pos) setCoords(pos);
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, placement]);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = (classItem) => {
    setIsOpen(false);
    setCoords(null);
    if (onSelectClass) {
      onSelectClass(classItem);
    }
  };

  // Filter available classes
  const filteredClasses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return availableClasses;
    return availableClasses.filter((item) => {
      const nameMatch = item.name && item.name.toLowerCase().includes(q);
      const coachMatch = item.coach_name && item.coach_name.toLowerCase().includes(q);
      const courseMatch = item.course_name && item.course_name.toLowerCase().includes(q);
      return nameMatch || coachMatch || courseMatch;
    });
  }, [availableClasses, searchQuery]);

  // Group classes into Current Course vs Other Courses
  const currentCourseClasses = useMemo(
    () => filteredClasses.filter((c) => c.is_current_course),
    [filteredClasses]
  );
  const otherCourseClasses = useMemo(
    () => filteredClasses.filter((c) => !c.is_current_course),
    [filteredClasses]
  );

  return (
    <div className={`relative inline-block text-right ${className}`}>
      {/* TRIGGER BUTTON */}
      {currentClass ? (
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={`group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-sky-50/80 dark:hover:bg-sky-950/50 border border-slate-200/90 dark:border-slate-700/80 hover:border-sky-300 dark:hover:border-sky-600 transition-colors cursor-pointer text-right shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0 ${
            size === 'sm' ? 'text-[11px] py-1 px-2' : ''
          }`}
          title="کلیک برای تغییر یا حذف کلاس شناگر"
        >
          {/* Avatar / Icon */}
          <div className="relative shrink-0">
            {currentClass.avatar ? (
              <img
                src={currentClass.avatar}
                alt={currentClass.name || 'کلاس'}
                className="w-7 h-7 rounded-full object-cover border border-sky-400 dark:border-sky-500 shadow-2xs"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                {currentClass.coach_name
                  ? currentClass.coach_name.charAt(0)
                  : currentClass.name
                  ? currentClass.name.charAt(0)
                  : 'ک'}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-white dark:border-slate-900 rounded-full" />
          </div>

          <div className="flex items-center gap-1 text-right min-w-0">
            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium whitespace-nowrap">
              کلاس:
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate max-w-[125px] whitespace-nowrap">
              {getDisplayTitle()}
            </span>
          </div>

          {isOpen ? (
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
          disabled={disabled}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-dashed border-amber-300 dark:border-amber-700/60 font-bold text-xs transition-colors cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0 ${
            size === 'sm' ? 'text-[11px] py-1 px-2' : ''
          }`}
          title="کلیک جهت افزودن شناگر به یک کلاس"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="whitespace-nowrap">تعیین کلاس</span>
          {isOpen ? (
            <ChevronUp className="w-3 h-3 text-amber-500 shrink-0" />
          ) : (
            <ChevronDown className="w-3 h-3 text-amber-500 shrink-0" />
          )}
        </button>
      )}

      {/* PORTAL DROPDOWN MENU (No slide animation, calculated instantly) */}
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
                  مدیریت و انتخاب کلاس شناگر
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {availableClasses.length} کلاس
              </span>
            </div>

            {/* Search Box */}
            <div className="relative my-2 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی کلاس، دوره یا مربی..."
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

            {/* Unassign Option (Prominent if currently in a class) */}
            {currentClass && (
              <div className="mb-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleItemClick(null)}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-800/70 transition-colors text-xs font-semibold cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <UserX className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>حذف شناگر از این کلاس (بدون کلاس)</span>
                  </div>
                  <span className="text-[10px] bg-rose-200/60 dark:bg-rose-900/80 px-2 py-0.5 rounded-md font-bold text-rose-800 dark:text-rose-200">
                    لغو انتساب
                  </span>
                </button>
              </div>
            )}

            {/* Scrollable Class List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-0.5 max-h-60">
              {filteredClasses.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  کلاسی با این عنوان یافت نشد.
                </div>
              ) : (
                <>
                  {/* Current Course Classes Section */}
                  {currentCourseClasses.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-2 py-1 text-[11px] font-bold text-sky-700 dark:text-sky-300 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-sky-500" />
                          کلاس‌های دوره فعلی شناگر
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal truncate max-w-[140px]">
                          {currentCourseClasses[0]?.course_name}
                        </span>
                      </div>
                      {currentCourseClasses.map((item) => (
                        <ClassOptionButton
                          key={item.id}
                          item={item}
                          currentClass={currentClass}
                          onSelect={handleItemClick}
                        />
                      ))}
                    </div>
                  )}

                  {/* Other Classes Section */}
                  {otherCourseClasses.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-2 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          {currentCourseClasses.length > 0
                            ? 'سایر کلاس‌های فعال آموزشگاه'
                            : 'تمامی کلاس‌های فعال آموزشگاه'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {otherCourseClasses.length} کلاس
                        </span>
                      </div>
                      {otherCourseClasses.map((item) => (
                        <ClassOptionButton
                          key={item.id}
                          item={item}
                          currentClass={currentClass}
                          onSelect={handleItemClick}
                        />
                      ))}
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

// Reusable individual class option button
const ClassOptionButton = ({ item, currentClass, onSelect }) => {
  const isSelected =
    currentClass &&
    ((item.group_id && currentClass.group_id && item.group_id === currentClass.group_id) ||
      (item.coach_id && currentClass.coach_id && item.coach_id === currentClass.coach_id && (!item.group_id || item.group_id === currentClass.group_id)) ||
      (item.id && currentClass.id && item.id === currentClass.id));

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={`w-full flex items-center justify-between p-2 rounded-xl text-right transition-colors cursor-pointer ${
        isSelected
          ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 font-bold border border-sky-200/80 dark:border-sky-800'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Avatar */}
        <div className="relative shrink-0">
          {item.avatar ? (
            <img
              src={item.avatar}
              alt={item.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              {item.coach_name
                ? item.coach_name.charAt(0)
                : item.name
                ? item.name.charAt(0)
                : 'ک'}
            </div>
          )}
        </div>

        <div className="min-w-0 text-right">
          <span className="text-xs font-bold block truncate max-w-[190px]">
            {item.name || `کلاس ${item.coach_name}`}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {item.course_name && (
              <span className="text-[10px] text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.2 rounded font-medium truncate max-w-[120px]">
                {item.course_name}
              </span>
            )}
            {item.coach_name && (
              <span className="text-[10px] text-slate-400 truncate max-w-[110px]">
                مربی: {item.coach_name}
              </span>
            )}
          </div>
        </div>
      </div>

      {isSelected && (
        <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 mr-2 shadow-2xs">
          <Check className="w-3 h-3 stroke-[2.5]" />
        </span>
      )}
    </button>
  );
};
