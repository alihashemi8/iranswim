import React from 'react';
import './FloatingLandingWaterIcons.css';

/**
 * FloatingLandingWaterIcons
 * 
 * Renders transparent, cropped swimming icons scattered and floating across
 * the landing page background (Sections 2 to 7).
 * 
 * Strict constraints:
 * - NO icons in the Hero photo area (as requested by user)
 * - Absolutely non-clickable and non-hoverable (pointer-events: none, no :hover)
 */
const SECTION_ICONS = {
  about: [
    {
      id: 'about-goggles',
      src: '/images/aquatic-icons/goggles.png',
      alt: 'عینک شنا',
      posStyle: { top: '14%', right: '2.5%' },
      size: 'w-13 h-13 sm:w-16 sm:h-16',
      animClass: 'anim-water-1',
      delay: '-1.5s',
      opacity: 'opacity-80',
    },
    {
      id: 'about-swimmer',
      src: '/images/aquatic-icons/swimmer.png',
      alt: 'شناگر کرال',
      posStyle: { top: '48%', left: '2.5%' },
      size: 'w-15 h-15 sm:w-18 sm:h-18',
      animClass: 'anim-water-2',
      delay: '-3.8s',
      opacity: 'opacity-75',
    },
    {
      id: 'about-kickboard',
      src: '/images/aquatic-icons/kickboard.png',
      alt: 'تخته شنا',
      posStyle: { bottom: '8%', right: '3%' },
      size: 'w-13 h-13 sm:w-15 sm:h-15',
      animClass: 'anim-water-3',
      delay: '-5.2s',
      opacity: 'opacity-75',
    },
  ],
  courses: [
    {
      id: 'courses-ladder',
      src: '/images/aquatic-icons/ladder.png',
      alt: 'نردبان استخر',
      posStyle: { top: '15%', left: '2.5%' },
      size: 'w-13 h-13 sm:w-16 sm:h-16',
      animClass: 'anim-water-4',
      delay: '-2.1s',
      opacity: 'opacity-75',
    },
    {
      id: 'courses-flippers',
      src: '/images/aquatic-icons/flippers.png',
      alt: 'فین‌های شنا',
      posStyle: { top: '45%', right: '2.5%' },
      size: 'w-14 h-14 sm:w-17 sm:h-17',
      animClass: 'anim-water-1',
      delay: '-4.4s',
      opacity: 'opacity-80',
    },
    {
      id: 'courses-ball',
      src: '/images/aquatic-icons/ball.png',
      alt: 'توپ واترپلو',
      posStyle: { bottom: '10%', left: '3%' },
      size: 'w-14 h-14 sm:w-16 sm:h-16',
      animClass: 'anim-water-2',
      delay: '-0.8s',
      opacity: 'opacity-75',
    },
  ],
  facilities: [
    {
      id: 'facilities-diving-board',
      src: '/images/aquatic-icons/diving-board.png',
      alt: 'سکوی شیرجه',
      posStyle: { top: '16%', right: '3%' },
      size: 'w-14 h-14 sm:w-17 sm:h-17',
      animClass: 'anim-water-3',
      delay: '-3.3s',
      opacity: 'opacity-80',
    },
    {
      id: 'facilities-lifebuoy',
      src: '/images/aquatic-icons/lifebuoy.png',
      alt: 'حلقه نجات',
      posStyle: { top: '50%', left: '2.5%' },
      size: 'w-15 h-15 sm:w-18 sm:h-18',
      animClass: 'anim-water-4',
      delay: '-1.9s',
      opacity: 'opacity-80',
    },
    {
      id: 'facilities-ladder',
      src: '/images/aquatic-icons/ladder.png',
      alt: 'نردبان استخر',
      posStyle: { bottom: '8%', right: '2.5%' },
      size: 'w-13 h-13 sm:w-15 sm:h-15',
      animClass: 'anim-water-1',
      delay: '-4.8s',
      opacity: 'opacity-75',
    },
  ],
  coaches: [
    {
      id: 'coaches-swimmer',
      src: '/images/aquatic-icons/swimmer.png',
      alt: 'شناگر',
      posStyle: { top: '18%', right: '2.5%' },
      size: 'w-15 h-15 sm:w-18 sm:h-18',
      animClass: 'anim-water-2',
      delay: '-2.7s',
      opacity: 'opacity-75',
    },
    {
      id: 'coaches-goggles',
      src: '/images/aquatic-icons/goggles.png',
      alt: 'عینک شنا',
      posStyle: { top: '55%', left: '3%' },
      size: 'w-13 h-13 sm:w-16 sm:h-16',
      animClass: 'anim-water-3',
      delay: '-4.1s',
      opacity: 'opacity-80',
    },
    {
      id: 'coaches-flippers',
      src: '/images/aquatic-icons/flippers.png',
      alt: 'فین‌های شنا',
      posStyle: { bottom: '12%', right: '2.5%' },
      size: 'w-14 h-14 sm:w-17 sm:h-17',
      animClass: 'anim-water-4',
      delay: '-0.5s',
      opacity: 'opacity-75',
    },
  ],
  news: [
    {
      id: 'news-ball',
      src: '/images/aquatic-icons/ball.png',
      alt: 'توپ واترپلو',
      posStyle: { top: '16%', left: '2.5%' },
      size: 'w-14 h-14 sm:w-17 sm:h-17',
      animClass: 'anim-water-1',
      delay: '-3.1s',
      opacity: 'opacity-75',
    },
    {
      id: 'news-kickboard',
      src: '/images/aquatic-icons/kickboard.png',
      alt: 'تخته شنا',
      posStyle: { top: '52%', right: '3%' },
      size: 'w-13 h-13 sm:w-15 sm:h-15',
      animClass: 'anim-water-2',
      delay: '-5.5s',
      opacity: 'opacity-75',
    },
    {
      id: 'news-lifebuoy',
      src: '/images/aquatic-icons/lifebuoy.png',
      alt: 'حلقه نجات',
      posStyle: { bottom: '8%', left: '2.5%' },
      size: 'w-15 h-15 sm:w-18 sm:h-18',
      animClass: 'anim-water-3',
      delay: '-1.4s',
      opacity: 'opacity-80',
    },
  ],
  cta: [
    {
      id: 'cta-diving-board',
      src: '/images/aquatic-icons/diving-board.png',
      alt: 'سکوی شیرجه',
      posStyle: { top: '25%', left: '4%' },
      size: 'w-14 h-14 sm:w-17 sm:h-17',
      animClass: 'anim-water-4',
      delay: '-2.2s',
      opacity: 'opacity-75',
    },
    {
      id: 'cta-swimmer',
      src: '/images/aquatic-icons/swimmer.png',
      alt: 'شناگر',
      posStyle: { top: '30%', right: '4%' },
      size: 'w-15 h-15 sm:w-18 sm:h-18',
      animClass: 'anim-water-1',
      delay: '-4.0s',
      opacity: 'opacity-70',
    },
  ],
};

export const FloatingLandingWaterIcons = ({ section }) => {
  const items = SECTION_ICONS[section] || [];
  if (!items.length) return null;

  return (
    <div className="floating-water-icons-container" aria-hidden="true">
      {items.map((item) => {
        const { id, src, alt, posStyle, size, animClass, delay, opacity } = item;
        return (
          <div
            key={id}
            className={`floating-water-item ${animClass} ${size} ${opacity}`}
            style={{
              ...posStyle,
              animationDelay: delay,
            }}
          >
            <img src={src} alt={alt} loading="lazy" draggable={false} />
          </div>
        );
      })}
    </div>
  );
};

export default FloatingLandingWaterIcons;
