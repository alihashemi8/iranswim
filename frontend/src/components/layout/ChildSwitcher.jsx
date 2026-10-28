import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, User, Check, Users } from 'lucide-react';
import { useSwimmer } from '../../context/SwimmerContext';
import { AddChildModal } from '../common/AddChildModal';

export const ChildSwitcher = () => {
  const { childrenList, activeSwimmer, activeSwimmerId, selectChild } = useSwimmer();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentName = activeSwimmer?.full_name || 'پرونده شناگر';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all cursor-pointer text-sm sm:text-base font-bold shadow-2xs"
        title="انتخاب و جابه‌جایی بین پرونده فرزندان"
      >
        <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs shrink-0 font-bold shadow-2xs">
          {activeSwimmer?.first_name ? activeSwimmer.first_name.charAt(0) : <User className="w-3.5 h-3.5" />}
        </div>
        <span className="truncate max-w-[110px] sm:max-w-[160px] font-bold">
          {currentName}
        </span>
        <ChevronDown className={`w-4 h-4 text-blue-600 dark:text-blue-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {dropdownOpen && (
        <div className="absolute left-0 sm:left-auto right-auto sm:right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              <span>فرزندان و پرونده‌های متصل</span>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
            {childrenList.length === 0 ? (
              <div className="p-3 text-sm text-slate-500 text-center">پرونده‌ای یافت نشد.</div>
            ) : (
              childrenList.map((item) => {
                const swimmer = item.swimmer_detail || {};
                const id = String(swimmer.id || item.swimmer);
                const isSelected = id === String(activeSwimmerId);

                return (
                  <button
                    key={item.id || id}
                    type="button"
                    onClick={() => {
                      selectChild(id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-right transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-sky-500 to-teal-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        {swimmer.first_name ? swimmer.first_name.charAt(0) : 'U'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold truncate">{swimmer.full_name || 'بدون نام'}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {swimmer.level_name || 'سطح تعیین‌نشده'} · {item.relationship_display || 'فرزند'}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>

          <div className="p-1.5 border-t border-slate-100 dark:border-slate-800 mt-1">
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                setModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-bold text-sky-700 dark:text-sky-300 bg-sky-50/70 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت فرزند جدید در این حساب</span>
            </button>
          </div>
        </div>
      )}

      {modalOpen && <AddChildModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />}
    </div>
  );
};
