import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorStyles = {
  success: 'bg-white/95 dark:bg-slate-900/95 border-emerald-200 dark:border-emerald-800/60 text-slate-800 dark:text-slate-100 shadow-emerald-500/10 dark:shadow-black/40',
  error: 'bg-white/95 dark:bg-slate-900/95 border-rose-200 dark:border-rose-800/60 text-slate-800 dark:text-slate-100 shadow-rose-500/10 dark:shadow-black/40',
  warning: 'bg-white/95 dark:bg-slate-900/95 border-amber-200 dark:border-amber-800/60 text-slate-800 dark:text-slate-100 shadow-amber-500/10 dark:shadow-black/40',
  info: 'bg-white/95 dark:bg-slate-900/95 border-sky-200 dark:border-sky-800/60 text-slate-800 dark:text-slate-100 shadow-sky-500/10 dark:shadow-black/40',
};

const iconColors = {
  success: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
  error: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60',
  warning: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60',
  info: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60',
};

// Individual Toast Item with responsive touch/pointer swipe-to-dismiss & auto-dismiss
const ToastItem = ({ toast, onRemove }) => {
  const cardRef = useRef(null);
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [exitDirection, setExitDirection] = useState('fade'); // 'left' | 'right' | 'fade'
  const [isEntered, setIsEntered] = useState(false);

  // Auto-dismiss timer refs
  const remainingTimeRef = useRef(toast.duration ?? 4000);
  const timerStartRef = useRef(Date.now());
  const timerRef = useRef(null);

  // Gesture tracking refs
  const gestureInfo = useRef({
    startX: 0,
    startY: 0,
    currentX: 0,
    startTime: 0,
    isPointerDown: false,
    isSwiping: false,
    isScrollLocked: false,
    pointerId: null,
  });

  // Trigger smooth enter animation after mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Exit & remove handler
  const handleDismiss = useCallback((direction = 'fade') => {
    if (isExiting) return;
    setIsExiting(true);
    setExitDirection(direction);

    // Wait for exit transition to complete before unmounting
    setTimeout(() => {
      onRemove(toast.id);
    }, 220);
  }, [isExiting, onRemove, toast.id]);

  // Timer handlers (pauses on hover/swipe, resumes on release)
  const startTimer = useCallback(() => {
    if (!toast.duration || toast.duration <= 0 || isExiting) return;
    timerStartRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      handleDismiss('fade');
    }, remainingTimeRef.current);
  }, [toast.duration, isExiting, handleDismiss]);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      const elapsed = Date.now() - timerStartRef.current;
      remainingTimeRef.current = Math.max(1000, remainingTimeRef.current - elapsed);
    }
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [startTimer]);

  // Pointer / Touch Swipe Events
  const handlePointerDown = (e) => {
    // If clicking a button or interactive child, don't initiate drag
    if (e.target.closest('button, a, input, textarea')) return;
    if (isExiting) return;

    // Only respond to primary button (mouse left-click) or touch
    if (e.button !== undefined && e.button !== 0) return;

    gestureInfo.current = {
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      startTime: Date.now(),
      isPointerDown: true,
      isSwiping: false,
      isScrollLocked: false,
      pointerId: e.pointerId,
    };

    pauseTimer();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {
      // Safe fallback if pointer capture is unsupported or already released
    }
  };

  const handlePointerMove = (e) => {
    const info = gestureInfo.current;
    if (!info.isPointerDown || isExiting) return;
    if (info.isScrollLocked) return;

    const deltaX = e.clientX - info.startX;
    const deltaY = e.clientY - info.startY;

    // Determine gesture intent
    if (!info.isSwiping) {
      // If moving vertically more than horizontally, allow standard page scroll
      if (Math.abs(deltaY) > 8 && Math.abs(deltaY) > Math.abs(deltaX)) {
        info.isScrollLocked = true;
        info.isPointerDown = false;
        try {
          e.currentTarget.releasePointerCapture(info.pointerId);
        } catch (_) {}
        startTimer();
        return;
      }

      // If moved horizontally past 6px, lock into swipe gesture
      if (Math.abs(deltaX) > 6) {
        info.isSwiping = true;
        setIsDragging(true);
      }
    }

    if (info.isSwiping) {
      info.currentX = e.clientX;
      setOffsetX(deltaX);
    }
  };

  const handlePointerEnd = (e) => {
    const info = gestureInfo.current;
    if (!info.isPointerDown && !info.isSwiping) return;

    try {
      e.currentTarget.releasePointerCapture(info.pointerId);
    } catch (_) {}

    const wasSwiping = info.isSwiping;
    const deltaX = e.clientX - info.startX;
    const elapsed = Math.max(1, Date.now() - info.startTime);
    const velocity = Math.abs(deltaX) / elapsed; // px per ms

    info.isPointerDown = false;
    info.isSwiping = false;
    info.isScrollLocked = false;
    setIsDragging(false);

    if (wasSwiping) {
      const cardWidth = cardRef.current?.offsetWidth || 300;
      // Dismiss if dragged past 25% of card width or 75px, OR quick flick (> 0.35 px/ms)
      const distanceThreshold = Math.min(80, cardWidth * 0.25);
      const isFlick = Math.abs(deltaX) > 30 && velocity > 0.35;
      const isPastDistance = Math.abs(deltaX) > distanceThreshold;

      if (isPastDistance || isFlick) {
        // Swiping right (deltaX > 0) or swiping left (deltaX < 0) both dismiss!
        const direction = deltaX > 0 ? 'right' : 'left';
        handleDismiss(direction);
        return;
      }
    }

    // Threshold not met: snap back to center and resume timer
    setOffsetX(0);
    startTimer();
  };

  // Compute dynamic styling for drag, exit, and enter states
  const getCardStyle = () => {
    if (isDragging) {
      const cardWidth = cardRef.current?.offsetWidth || 320;
      const progress = Math.min(Math.abs(offsetX) / (cardWidth * 0.75), 1);
      const opacity = Math.max(0.15, 1 - progress * 0.85);
      return {
        transform: `translateX(${offsetX}px)`,
        opacity,
        transition: 'none',
        touchAction: 'pan-y',
      };
    }

    if (isExiting) {
      let exitTransform = 'translateY(10px) scale(0.95)';
      if (exitDirection === 'right') {
        exitTransform = 'translateX(120%)';
      } else if (exitDirection === 'left') {
        exitTransform = 'translateX(-120%)';
      }
      return {
        transform: exitTransform,
        opacity: 0,
        transition: 'transform 0.22s cubic-bezier(0.4, 0, 1, 1), opacity 0.2s ease',
        touchAction: 'pan-y',
      };
    }

    if (!isEntered) {
      return {
        transform: 'translateY(14px) scale(0.96)',
        opacity: 0,
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s ease',
        touchAction: 'pan-y',
      };
    }

    return {
      transform: 'translate(0, 0) scale(1)',
      opacity: 1,
      transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease',
      touchAction: 'pan-y',
    };
  };

  const Icon = icons[toast.type] || Info;

  return (
    <div
      ref={cardRef}
      style={getCardStyle()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onMouseEnter={pauseTimer}
      onMouseLeave={startTimer}
      dir="rtl"
      role="alert"
      className={`pointer-events-auto select-none cursor-grab active:cursor-grabbing flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border shadow-lg backdrop-blur-xs w-full min-w-0 ${
        colorStyles[toast.type] || colorStyles.info
      }`}
    >
      <div className={`p-2 rounded-xl shrink-0 ${iconColors[toast.type] || iconColors.info}`}>
        <Icon className="w-5 h-5 shrink-0" />
      </div>

      <div className="flex-1 min-w-0 pt-0.5 break-words">
        {toast.title && (
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight mb-0.5 break-words">
            {toast.title}
          </h4>
        )}
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal break-words">
          {toast.message}
        </p>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss('fade');
        }}
        className="text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1.5 -mr-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
        aria-label="بستن پیام"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    setToasts((prev) => {
      // Avoid duplicate notifications with same message & type
      if (prev.some((t) => t.message === message && t.type === type)) {
        return prev;
      }
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast = { id, type, title, message, duration };
      // Keep at most 4 toasts visible at a time
      return [...prev.slice(-3), newToast];
    });
  }, []);

  const toast = useMemo(
    () => ({
      success: (message, title = 'عملیات موفق', options = {}) =>
        addToast({ type: 'success', title, message, ...options }),
      error: (message, title = 'خطا در عملیات', options = {}) =>
        addToast({ type: 'error', title, message, duration: 6000, ...options }),
      warning: (message, title = 'هشدار', options = {}) =>
        addToast({ type: 'warning', title, message, duration: 5000, ...options }),
      info: (message, title = 'اطلاعیه', options = {}) =>
        addToast({ type: 'info', title, message, ...options }),
      add: addToast,
      remove: removeToast,
    }),
    [addToast, removeToast]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Floating Toasts Container:
          - Mobile: centered with safe gutters on both sides (inset-x-3), floating cleanly above MobileBottomNav & safe area
          - Desktop: bottom-left anchored with max-w-sm
      */}
      <div
        className="fixed z-[9999] pointer-events-none flex flex-col gap-2.5 items-stretch
          inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))]
          sm:inset-x-auto sm:left-6 sm:right-auto sm:bottom-6 sm:w-96 sm:max-w-sm"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
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
