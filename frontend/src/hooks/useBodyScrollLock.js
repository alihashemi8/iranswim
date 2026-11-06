import { useEffect } from 'react';

let lockCount = 0;
let preservedScrollY = 0;

/**
 * Custom hook to lock body scroll on mobile & desktop when a modal or drawer is open.
 * Uses position: fixed on body to completely prevent mobile background scrolling,
 * rubber-band overscroll bouncing, and scroll chaining.
 *
 * @param {boolean} isLocked - Whether scroll should be locked.
 */
export const useBodyScrollLock = (isLocked) => {
  useEffect(() => {
    if (!isLocked) return;

    if (lockCount === 0) {
      preservedScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

      // Lock root documentElement
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.overscrollBehavior = 'none';

      // Lock body with fixed positioning at current scroll position
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${preservedScrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overscrollBehavior = 'none';
      document.body.style.touchAction = 'none';
    }

    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);

      if (lockCount === 0) {
        document.documentElement.style.overflow = '';
        document.documentElement.style.overscrollBehavior = '';

        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        document.body.style.overscrollBehavior = '';
        document.body.style.touchAction = '';

        window.scrollTo(0, preservedScrollY);
      }
    };
  }, [isLocked]);
};
