import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newToast = { id, type, title, message };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const toast = {
    success: (message, title = 'عملیات موفق') => addToast({ type: 'success', title, message }),
    error: (message, title = 'خطا در عملیات') => addToast({ type: 'error', title, message, duration: 6000 }),
    warning: (message, title = 'هشدار') => addToast({ type: 'warning', title, message, duration: 5000 }),
    info: (message, title = 'اطلاعیه') => addToast({ type: 'info', title, message }),
    remove: removeToast,
  };

  const icons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colorStyles = {
    success: 'bg-white border-emerald-200 text-slate-800 shadow-emerald-500/10',
    error: 'bg-white border-rose-200 text-slate-800 shadow-rose-500/10',
    warning: 'bg-white border-amber-200 text-slate-800 shadow-amber-500/10',
    info: 'bg-white border-sky-200 text-slate-800 shadow-sky-500/10',
  };

  const iconColors = {
    success: 'text-emerald-500 bg-emerald-50',
    error: 'text-rose-500 bg-rose-50',
    warning: 'text-amber-500 bg-amber-50',
    info: 'text-sky-500 bg-sky-50',
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Floating Toasts Container (Bottom Left for RTL ergonomics) */}
      <div
        className="fixed bottom-5 left-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const Icon = icons[t.type] || Info;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-lg transition-all transform animate-slide-in-right ${colorStyles[t.type] || colorStyles.info}`}
              role="alert"
            >
              <div className={`p-2 rounded-xl shrink-0 ${iconColors[t.type] || iconColors.info}`}>
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                {t.title && (
                  <h4 className="text-xs font-bold text-slate-900 leading-tight mb-0.5">{t.title}</h4>
                )}
                <p className="text-xs text-slate-600 leading-relaxed font-normal">{t.message}</p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-700 p-1 -mr-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                aria-label="بستن پیام"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
