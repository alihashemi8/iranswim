import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronRight, ChevronLeft, Pause, Play } from 'lucide-react';

/**
 * Accessible, Responsive, RTL-aware Carousel Component with Ultra-Smooth Touch Gestures
 * Satisfies all specifications:
 * - Real-time 1:1 finger tracking with native GPU momentum and inertia on mobile
 * - Automatic smooth scrolling when items > itemsPerView with comfortable reading interval
 * - Pauses on touch, drag, hover, focus, manual interaction, and tab visibility change
 * - Respects prefers-reduced-motion
 * - Snap-to-center on mobile for peek affordance, snap-to-start on tablet/desktop
 * - Smooth desktop mouse-drag support
 * - RTL-accurate navigation (Next advances left in RTL, Prev advances right)
 * - Live synchronized dot indicators and interactive dot buttons
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
  showPlayPause = false,
  showNavigation = true,
  showProgress = false,
  showDots = true,
  pauseOnHover = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [isInView, setIsInView] = useState(false);

  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const cardsRef = useRef([]);
  const interactionTimeoutRef = useRef(null);
  const isPointerDownRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const scrollDebounceRef = useRef(null);

  // Lazy initializer for prefers-reduced-motion
  const [isReducedMotion, setIsReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (!window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Pause carousel when not in active viewport to prevent background scroll interference
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const totalItems = items.length;

  const pauseInteraction = useCallback(() => {
    setIsInteracting(true);
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }
    interactionTimeoutRef.current = setTimeout(() => {
      setIsInteracting(false);
    }, 4500);
  }, []);

  // Smoothly scrolls to a given slide index with exact viewport geometry
  const scrollToSlide = useCallback((targetIndex, behavior = 'smooth') => {
    const track = trackRef.current;
    if (!track) return;
    const cards = Array.from(track.children);
    if (!cards || cards.length === 0) return;

    const clampedIndex = Math.max(0, Math.min(targetIndex, cards.length - 1));
    const targetCard = cards[clampedIndex];
    if (!targetCard) return;

    const trackRect = track.getBoundingClientRect();
    const cardRect = targetCard.getBoundingClientRect();
    const isMobile = window.innerWidth < 640;
    const isRtl = document.documentElement.dir === 'rtl' || getComputedStyle(track).direction === 'rtl';

    let delta = 0;
    if (isMobile) {
      // Center card on mobile view
      const trackCenter = trackRect.left + trackRect.width / 2;
      const cardCenter = cardRect.left + cardRect.width / 2;
      delta = cardCenter - trackCenter;
    } else {
      // Align to start edge on desktop
      const trackEdge = isRtl ? trackRect.right : trackRect.left;
      const cardEdge = isRtl ? cardRect.right : cardRect.left;
      delta = cardEdge - trackEdge;
    }

    if (Math.abs(delta) > 1) {
      track.scrollBy({
        left: delta,
        behavior: isReducedMotion ? 'auto' : behavior,
      });
    }

    setCurrentIndex(clampedIndex);
  }, [isReducedMotion]);

  // Live calculation of the active card during finger/mouse scrolling
  const handleScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const cards = Array.from(track.children);
    if (!cards || cards.length === 0) return;

    if (scrollDebounceRef.current) {
      cancelAnimationFrame(scrollDebounceRef.current);
    }

    scrollDebounceRef.current = requestAnimationFrame(() => {
      const trackRect = track.getBoundingClientRect();
      const isMobile = window.innerWidth < 640;
      const isRtl = document.documentElement.dir === 'rtl' || getComputedStyle(track).direction === 'rtl';

      let closestIndex = 0;
      let minDiff = Infinity;

      if (isMobile) {
        const trackCenter = trackRect.left + trackRect.width / 2;
        cards.forEach((card, idx) => {
          const cardRect = card.getBoundingClientRect();
          const cardCenter = cardRect.left + cardRect.width / 2;
          const diff = Math.abs(trackCenter - cardCenter);
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = idx;
          }
        });
      } else {
        const trackEdge = isRtl ? trackRect.right : trackRect.left;
        cards.forEach((card, idx) => {
          const cardRect = card.getBoundingClientRect();
          const cardEdge = isRtl ? cardRect.right : cardRect.left;
          const diff = Math.abs(trackEdge - cardEdge);
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = idx;
          }
        });
      }

      setCurrentIndex(closestIndex);
    });
  }, []);

  const nextSlide = useCallback(() => {
    if (totalItems <= 1) return;
    const nextIdx = (currentIndex + 1) % totalItems;
    scrollToSlide(nextIdx);
  }, [currentIndex, totalItems, scrollToSlide]);

  const prevSlide = useCallback(() => {
    if (totalItems <= 1) return;
    const prevIdx = (currentIndex - 1 + totalItems) % totalItems;
    scrollToSlide(prevIdx);
  }, [currentIndex, totalItems, scrollToSlide]);

  const handleManualAction = (action) => {
    pauseInteraction();
    action();
  };

  // Auto-play interval
  useEffect(() => {
    const shouldPause = (pauseOnHover && isHovered) || (showPlayPause && isManuallyPaused) || isInteracting;
    if (!autoPlay || totalItems <= 1 || isReducedMotion || shouldPause || !isInView) {
      return;
    }

    const timer = setInterval(() => {
      if (!document.hidden) {
        setCurrentIndex((prev) => {
          const next = (prev + 1) % totalItems;
          scrollToSlide(next, 'smooth');
          return next;
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, totalItems, isReducedMotion, pauseOnHover, isHovered, isInteracting, showPlayPause, isManuallyPaused, isInView, interval, scrollToSlide]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
      if (scrollDebounceRef.current) cancelAnimationFrame(scrollDebounceRef.current);
    };
  }, []);

  // Desktop Mouse Drag to scroll smoothly
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    isPointerDownRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.clientX;
    if (trackRef.current) {
      startScrollLeftRef.current = trackRef.current.scrollLeft;
    }
    pauseInteraction();
  };

  const handleMouseMove = (e) => {
    if (!isPointerDownRef.current || !trackRef.current) return;
    const walk = e.clientX - startXRef.current;
    if (Math.abs(walk) > 4) {
      hasDraggedRef.current = true;
      trackRef.current.scrollLeft = startScrollLeftRef.current - walk;
    }
  };

  const handleMouseUp = () => {
    if (isPointerDownRef.current) {
      isPointerDownRef.current = false;
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 60);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      // In RTL, left arrow moves forward to next slide
      e.preventDefault();
      handleManualAction(nextSlide);
    } else if (e.key === 'ArrowRight') {
      // In RTL, right arrow moves backward to prev slide
      e.preventDefault();
      handleManualAction(prevSlide);
    }
  };

  if (totalItems === 0) return null;

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-full min-w-0 ${className}`}
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      onMouseEnter={() => {
        setIsHovered(true);
        pauseInteraction();
      }}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={pauseInteraction}
      onKeyDown={handleKeyDown}
      role="region"
    >
      {/* Top Header Actions (Progress / Play status if enabled) */}
      {totalItems > 1 && (showProgress || (showPlayPause && !isReducedMotion)) && (
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2">
            {showProgress && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {currentIndex + 1} از {totalItems}
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
        </div>
      )}

      {/* Cards Viewport & Side Navigation Box */}
      <div className="relative group/carousel">
        {/* Scrollable Viewport with Touch Momentum & 1:1 Finger Tracking */}
        <div className="carousel-viewport w-full max-w-full min-w-0 overflow-hidden rounded-2xl sm:rounded-3xl p-1 -m-1">
          <div
            ref={trackRef}
            onScroll={handleScroll}
            onTouchStart={pauseInteraction}
            onTouchMove={pauseInteraction}
            onTouchEnd={pauseInteraction}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClickCapture={(e) => {
              if (hasDraggedRef.current) {
                e.stopPropagation();
                e.preventDefault();
              }
            }}
            className="carousel-track landing-scroll-track flex overflow-x-auto overflow-y-hidden items-stretch snap-x snap-mandatory sm:snap-start py-3 px-3 sm:px-0 -mx-3 sm:mx-0 select-none cursor-grab active:cursor-grabbing"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x pan-y',
              overscrollBehaviorX: 'contain',
              scrollPaddingInline: '1rem',
            }}
          >
            {items.map((item, index) => (
              <div
                key={item.id || index}
                ref={(el) => (cardsRef.current[index] = el)}
                className={`shrink-0 min-w-0 flex flex-col items-stretch self-stretch h-full snap-center sm:snap-start w-[85vw] max-w-[340px] xs:w-[82vw] xs:max-w-[360px] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] px-2 sm:px-3 ${itemClassName}`}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} از ${totalItems}`}
              >
                <div className="w-full flex-1 flex flex-col h-full">
                  {renderItem(item, index)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Side Navigation Buttons (Round, positioned on sides of the cards box, hidden on mobile) */}
        {showNavigation && totalItems > 1 && (
          <>
            {/* Right Button (Previous in RTL: advances right) */}
            <button
              type="button"
              onClick={() => handleManualAction(prevSlide)}
              className="hidden md:flex absolute -right-3 md:-right-4 lg:-right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 lg:w-12 lg:h-12 rounded-full items-center justify-center bg-white/95 dark:bg-slate-800/95 text-slate-700 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700 shadow-md hover:shadow-xl hover:bg-white dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-300 dark:hover:border-sky-500 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-sky-500/50 backdrop-blur-xs"
              aria-label="کارت قبلی"
              title="کارت قبلی"
            >
              <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>

            {/* Left Button (Next in RTL: advances left) */}
            <button
              type="button"
              onClick={() => handleManualAction(nextSlide)}
              className="hidden md:flex absolute -left-3 md:-left-4 lg:-left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 lg:w-12 lg:h-12 rounded-full items-center justify-center bg-white/95 dark:bg-slate-800/95 text-slate-700 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700 shadow-md hover:shadow-xl hover:bg-white dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-300 dark:hover:border-sky-500 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-sky-500/50 backdrop-blur-xs"
              aria-label="کارت بعدی"
              title="کارت بعدی"
            >
              <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>
          </>
        )}
      </div>

      {/* Interactive Dot Indicators */}
      {showDots && totalItems > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-6">
          {items.map((_, dotIdx) => {
            const isActive = dotIdx === currentIndex;
            return (
              <button
                key={dotIdx}
                type="button"
                onClick={() => handleManualAction(() => scrollToSlide(dotIdx))}
                className={`transition-all duration-300 rounded-full cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-sky-500/40 ${
                  isActive
                    ? 'w-7 sm:w-8 h-2 bg-gradient-to-r from-sky-600 to-cyan-500 shadow-xs'
                    : 'w-2 h-2 bg-slate-300/80 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
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
