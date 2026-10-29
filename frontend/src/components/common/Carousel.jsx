import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronRight, ChevronLeft, Pause, Play } from 'lucide-react';

/**
 * Accessible, Responsive, RTL-aware Carousel Component
 * Satisfies all specifications:
 * - Automatic movement when items > itemsPerView
 * - Smooth transition with comfortable reading interval
 * - Pauses on hover, focus, touch, manual interaction, and tab visibility change
 * - Respects prefers-reduced-motion
 * - Touch swipe support
 * - RTL navigation buttons (Next advances left, Prev advances right)
 */
export const Carousel = ({
  items = [],
  renderItem,
  autoPlay = true,
  interval = 5000,
  className = '',
  itemClassName = '',
  ariaLabel = 'گردونه اسلایدر',
  visibleItems = { mobile: 1, tablet: 2, desktop: 3 },
  showPlayPause = true,
  showNavigation = true,
  showProgress = true,
  showDots = true,
  pauseOnHover = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);

  const containerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const userInteractionTimeout = useRef(null);

  // Check prefers-reduced-motion with lazy initializer
  const [isReducedMotion, setIsReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  const [itemsPerView, setItemsPerView] = useState(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width >= 1024) return visibleItems.desktop || 3;
      if (width >= 768) return visibleItems.tablet || 2;
      return visibleItems.mobile || 1;
    }
    return visibleItems.desktop || 3;
  });

  useEffect(() => {
    if (!window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1024) setItemsPerView(visibleItems.desktop || 3);
      else if (width >= 768) setItemsPerView(visibleItems.tablet || 2);
      else setItemsPerView(visibleItems.mobile || 1);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [visibleItems]);

  const totalItems = items.length;
  const maxIndex = Math.max(0, totalItems - itemsPerView);
  const canSlide = totalItems > itemsPerView;
  const safeIndex = Math.min(currentIndex, maxIndex);

  const nextSlide = useCallback(() => {
    if (!canSlide) return;
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [canSlide, maxIndex]);

  const prevSlide = useCallback(() => {
    if (!canSlide) return;
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [canSlide, maxIndex]);

  // Handler for manual controls with temporary pause
  const handleManualAction = (action) => {
    action();
    if (showPlayPause) {
      setIsManuallyPaused(true);
      if (userInteractionTimeout.current) {
        clearTimeout(userInteractionTimeout.current);
      }
      // Resume auto-play after 8 seconds of inactivity
      userInteractionTimeout.current = setTimeout(() => {
        setIsManuallyPaused(false);
      }, 8000);
    }
  };

  // Auto-play interval
  useEffect(() => {
    const shouldPause = (pauseOnHover && isHovered) || (showPlayPause && isManuallyPaused);
    if (!autoPlay || !canSlide || isReducedMotion || shouldPause || isFocused) {
      return;
    }

    let isDocumentVisible = !document.hidden;
    const handleVisibilityChange = () => {
      isDocumentVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const timer = setInterval(() => {
      if (isDocumentVisible) {
        nextSlide();
      }
    }, interval);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [autoPlay, canSlide, isReducedMotion, pauseOnHover, isHovered, isFocused, showPlayPause, isManuallyPaused, interval, nextSlide]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (userInteractionTimeout.current) {
        clearTimeout(userInteractionTimeout.current);
      }
    };
  }, []);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 45; // min swipe distance in px
    if (Math.abs(diff) > threshold) {
      // In RTL:
      // Swiping finger Left (diff > 0) means dragging content to left -> advance forward (next)
      // Swiping finger Right (diff < 0) means dragging content to right -> go back (prev)
      if (diff > 0) {
        handleManualAction(nextSlide);
      } else {
        handleManualAction(prevSlide);
      }
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Keyboard navigation on track container
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      // In RTL, left arrow is forward / next
      e.preventDefault();
      handleManualAction(nextSlide);
    } else if (e.key === 'ArrowRight') {
      // In RTL, right arrow is backwards / prev
      e.preventDefault();
      handleManualAction(prevSlide);
    }
  };

  // Calculate slide percentage width
  const itemWidthPercent = 100 / itemsPerView;

  // In RTL, moving to slide index N translates the track to the right (+N * itemWidthPercent %)
  const translatePercent = safeIndex * itemWidthPercent;

  // Dot count: number of possible starting positions
  const dotCount = maxIndex + 1;

  if (totalItems === 0) return null;

  return (
    <div
      ref={containerRef}
      className={`relative select-none w-full max-w-full min-w-0 overflow-hidden ${className}`}
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={() => setIsFocused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
    >
      {/* Top Header Actions (Arrows + Play status) */}
      {canSlide && (showProgress || (showPlayPause && !isReducedMotion) || showNavigation) && (
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2">
            {showProgress && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {safeIndex + 1} از {dotCount}
              </span>
            )}
            {showPlayPause && !isReducedMotion && (
              <button
                type="button"
                onClick={() => setIsManuallyPaused((prev) => !prev)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-sky-500/40"
                title={isManuallyPaused ? 'پخش خودکار' : 'توقف حرکت خودکار'}
                aria-label={isManuallyPaused ? 'پخش خودکار' : 'توقف حرکت خودکار'}
              >
                {isManuallyPaused ? (
                  <Play className="w-3.5 h-3.5" />
                ) : (
                  <Pause className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>

          {/* Previous and Next Navigation Buttons (RTL aligned) */}
          {showNavigation && (
            <div className="flex items-center gap-2">
              {/* Previous Button in RTL: points Right (ChevronRight) */}
              <button
                type="button"
                onClick={() => handleManualAction(prevSlide)}
                className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-sky-300 dark:hover:border-sky-600 transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-sky-500/50"
                aria-label="کارت قبلی"
                title="کارت قبلی"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Next Button in RTL: points Left (ChevronLeft) */}
              <button
                type="button"
                onClick={() => handleManualAction(nextSlide)}
                className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-sky-300 dark:hover:border-sky-600 transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-sky-500/50"
                aria-label="کارت بعدی"
                title="کارت بعدی"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overflow Track Viewport */}
      <div className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl sm:rounded-3xl p-1 -m-1">
        <div
          className={`flex min-w-0 ${isReducedMotion ? '' : 'transition-transform duration-500 ease-out'}`}
          style={{
            transform: `translateX(${translatePercent}%)`,
          }}
        >
          {items.map((item, index) => (
            <div
              key={item.id || index}
              className={`shrink-0 px-2 sm:px-3 min-w-0 ${itemClassName}`}
              style={{ width: `${itemWidthPercent}%` }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} از ${totalItems}`}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>

      {/* Dot Indicators */}
      {canSlide && showDots && dotCount > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-6">
          {Array.from({ length: dotCount }).map((_, dotIdx) => {
            const isActive = dotIdx === safeIndex;
            return (
              <button
                key={dotIdx}
                type="button"
                onClick={() => handleManualAction(() => setCurrentIndex(dotIdx))}
                className={`transition-all duration-300 rounded-full cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-sky-500/40 ${
                  isActive
                    ? 'w-7 sm:w-8 h-2 bg-gradient-to-r from-sky-600 to-cyan-500 shadow-2xs'
                    : 'w-2 h-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
                }`}
                aria-label={`رفتن به اسلاید ${dotIdx + 1}`}
                aria-current={isActive ? 'true' : 'false'}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
