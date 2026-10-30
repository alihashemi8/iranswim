import React, { useEffect } from 'react';
import { LogOut, X, AlertTriangle } from 'lucide-react';

export const LogoutModal = ({
  isOpen,
  onClose,
  onConfirm,
  userName = '',
  userRole = '',
  loading = false,
}) => {
  // Handle Escape key and disable background scrolling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs transition-opacity duration-200"
      dir="rtl"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden transform transition-all duration-200 scale-100 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="بستن پنجره"
          title="بستن"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Content */}
        <div className="flex flex-col items-center text-center">
          {/* Warning Icon Badge */}
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
              <LogOut className="w-8 h-8 -mr-1" />
            </div>
            <span className="absolute -bottom-1 -right-1 p-1 bg-amber-500 text-white rounded-full shadow-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Title */}
          <h3
            id="logout-modal-title"
            className="text-lg sm:text-xl font-black text-slate-900 dark:text-white"
          >
            خروج از حساب کاربری
          </h3>

          {/* Prompt Question */}
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-2">
            آیا برای خروج از پنل کاربری خود مطمئن هستید؟
          </p>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-sm">
            با خروج از حساب، نشست کاربری شما خاتمه می‌یابد و برای دسترسی دوباره باید با اطلاعات کاربری خود مجدداً وارد شوید.
          </p>

          {/* User Preview Badge (if available) */}
          {userName && (
            <div className="mt-4 px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-bold text-slate-800 dark:text-slate-200">{userName}</span>
              {userRole && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                  {userRole}
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col-reverse sm:flex-row items-center gap-3 w-full">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm border border-slate-200 dark:border-slate-700 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              انصراف و ماندن
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-rose-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-4.5 h-4.5" />
              <span>بله، خارج شو</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
