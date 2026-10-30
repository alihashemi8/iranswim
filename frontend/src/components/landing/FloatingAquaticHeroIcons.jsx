import React from 'react';
import {
  SwimmerCrawlIcon,
  SwimmerButterflyIcon,
  SwimmerBreaststrokeIcon,
  SwimmerBackstrokeIcon,
  OlympicPoolLaneIcon,
  OlympicStopwatchIcon,
  RescueBuoyRingIcon,
  PoolStartingBlockIcon,
  WaterMedalTrophyIcon,
  SwimGogglesIcon,
  SwimCapIcon,
  SwimKickboardIcon,
  SwimFinsIcon,
  SwimWhistleIcon,
} from '../common/AquaticIcons';
import './FloatingAquaticHeroIcons.css';

/**
 * FloatingAquaticHeroIcons
 * 
 * Renders swimming-themed floating icons scattered across the landing hero background,
 * specifically arranged so that the swimmer mascot photo zone remains completely clear.
 */
const FLOATING_ITEMS = [
  // 1. Swim Goggles - Top-Right corner above text
  {
    id: 'goggles',
    name: 'عینک تخصصی شنا',
    Icon: SwimGogglesIcon,
    type: 'bubble',
    size: 'w-11 h-11 sm:w-12 sm:h-12',
    iconSize: 'w-6 h-6',
    posStyle: { top: '3%', right: '3%' },
    animClass: 'anim-drift-1',
    delay: '-1.2s',
    ring: true,
  },
  // 2. Swimmer Crawl - Ambient silhouette beside main headline
  {
    id: 'crawl',
    name: 'شنای کرال سینه',
    Icon: SwimmerCrawlIcon,
    type: 'silhouette',
    size: 'w-12 h-12 sm:w-14 sm:h-14',
    iconSize: 'w-10 h-10 sm:w-12 sm:h-12',
    posStyle: { top: '14%', right: '48%' },
    animClass: 'anim-drift-2',
    delay: '-3.5s',
  },
  // 3. Kickboard - Right edge next to editorial description
  {
    id: 'kickboard',
    name: 'تخته آموزش شنا',
    Icon: SwimKickboardIcon,
    type: 'bubble',
    size: 'w-11 h-11 sm:w-12 sm:h-12',
    iconSize: 'w-6 h-6',
    posStyle: { top: '38%', right: '1.5%' },
    animClass: 'anim-drift-3',
    delay: '-2.1s',
  },
  // 4. Swim Cap - Upper-center right near badge
  {
    id: 'cap',
    name: 'کلاه مسابقاتی شنا',
    Icon: SwimCapIcon,
    type: 'bubble',
    size: 'w-10 h-10 sm:w-11 sm:h-11',
    iconSize: 'w-5 h-5 sm:w-6 sm:h-6',
    posStyle: { top: '9%', right: '24%' },
    animClass: 'anim-drift-4',
    delay: '-4.8s',
  },
  // 5. Olympic Stopwatch - Under editorial description / beside CTA
  {
    id: 'stopwatch',
    name: 'کرنومتر رکوردهای المپیک',
    Icon: OlympicStopwatchIcon,
    type: 'silhouette',
    size: 'w-10 h-10 sm:w-11 sm:h-11',
    iconSize: 'w-8 h-8 sm:w-9 sm:h-9',
    posStyle: { top: '62%', right: '46%' },
    animClass: 'anim-drift-1',
    delay: '-5.2s',
    mobileHide: true,
  },
  // 6. Rescue Buoy Ring - Bottom right corner
  {
    id: 'buoy',
    name: 'حلقه نجات استاندارد',
    Icon: RescueBuoyRingIcon,
    type: 'bubble',
    size: 'w-12 h-12 sm:w-13 sm:h-13',
    iconSize: 'w-7 h-7 sm:w-7 sm:h-7',
    posStyle: { bottom: '5%', right: '2.5%' },
    animClass: 'anim-drift-2',
    delay: '-0.7s',
    ring: true,
  },
  // 7. Swimmer Butterfly - Center-right behind CTA buttons
  {
    id: 'butterfly',
    name: 'شنای پروانه',
    Icon: SwimmerButterflyIcon,
    type: 'silhouette',
    size: 'w-12 h-12 sm:w-13 sm:h-13',
    iconSize: 'w-10 h-10 sm:w-11 sm:h-11',
    posStyle: { top: '48%', right: '35%' },
    animClass: 'anim-drift-3',
    delay: '-6.1s',
    mobileHide: true,
  },
  // 8. Olympic Pool Lanes - Top center, high above the content
  {
    id: 'pool-lanes',
    name: 'لاین‌های استخر ۵۰ متری المپیک',
    Icon: OlympicPoolLaneIcon,
    type: 'silhouette',
    size: 'w-12 h-12 sm:w-14 sm:h-14',
    iconSize: 'w-9 h-9 sm:w-10 sm:h-10',
    posStyle: { top: '2.5%', right: '40%' },
    animClass: 'anim-drift-4',
    delay: '-2.8s',
  },
  // 9. Swim Fins - Bottom-center right below cards
  {
    id: 'fins',
    name: 'فین‌های قدرتی شنا',
    Icon: SwimFinsIcon,
    type: 'bubble',
    size: 'w-11 h-11 sm:w-12 sm:h-12',
    iconSize: 'w-6 h-6',
    posStyle: { bottom: '3%', right: '34%' },
    animClass: 'anim-drift-1',
    delay: '-4.2s',
  },
  // 10. Coach Whistle - Next to the conversion buttons
  {
    id: 'whistle',
    name: 'سوت مربیگری شنا',
    Icon: SwimWhistleIcon,
    type: 'bubble',
    size: 'w-10 h-10 sm:w-11 sm:h-11',
    iconSize: 'w-5 h-5 sm:w-6 sm:h-6',
    posStyle: { top: '55%', right: '12%' },
    animClass: 'anim-drift-2',
    delay: '-1.9s',
    mobileHide: true,
  },
  // 11. Swimmer Breaststroke - Between feature cards
  {
    id: 'breaststroke',
    name: 'شنای قورباغه',
    Icon: SwimmerBreaststrokeIcon,
    type: 'silhouette',
    size: 'w-11 h-11 sm:w-12 sm:h-12',
    iconSize: 'w-9 h-9 sm:w-10 sm:h-10',
    posStyle: { bottom: '9%', right: '53%' },
    animClass: 'anim-drift-3',
    delay: '-3.8s',
    mobileHide: true,
  },
  // 12. Swimmer Backstroke - Right edge below title
  {
    id: 'backstroke',
    name: 'شنای کرال پشت',
    Icon: SwimmerBackstrokeIcon,
    type: 'silhouette',
    size: 'w-11 h-11 sm:w-12 sm:h-12',
    iconSize: 'w-9 h-9 sm:w-10 sm:h-10',
    posStyle: { top: '26%', right: '1%' },
    animClass: 'anim-drift-4',
    delay: '-5.0s',
  },
  // 13. Water Medal Trophy - High top buffer above column divider
  {
    id: 'trophy',
    name: 'کاپ قهرمانی شنا',
    Icon: WaterMedalTrophyIcon,
    type: 'bubble',
    size: 'w-11 h-11 sm:w-12 sm:h-12',
    iconSize: 'w-6 h-6',
    posStyle: { top: '2%', right: '62%' },
    animClass: 'anim-drift-1',
    delay: '-3.1s',
  },
  // 14. Pool Starting Block - Bottom wave line near cards
  {
    id: 'starting-block',
    name: 'سکوی استارت مسابقاتی',
    Icon: PoolStartingBlockIcon,
    type: 'bubble',
    size: 'w-11 h-11 sm:w-12 sm:h-12',
    iconSize: 'w-6 h-6',
    posStyle: { bottom: '4%', right: '18%' },
    animClass: 'anim-drift-2',
    delay: '-6.5s',
  },
];

export const FloatingAquaticHeroIcons = () => {
  return (
    <div className="floating-aquatic-icons-container" aria-hidden="true">
      {FLOATING_ITEMS.map((item) => {
        const { id, name, Icon, type, size, iconSize, posStyle, animClass, delay, ring, mobileHide } = item;
        const isBubble = type === 'bubble';

        return (
          <div
            key={id}
            title={name}
            className={`floating-aquatic-item ${animClass} ${mobileHide ? 'hero-floating-hide-mobile' : ''} ${
              isBubble ? `floating-aquatic-bubble ${size}` : `floating-aquatic-silhouette ${size}`
            }`}
            style={{
              ...posStyle,
              animationDelay: delay,
            }}
          >
            {ring && <span className="floating-aquatic-ring" />}
            <Icon className={`${iconSize} transition-transform duration-300 pointer-events-none`} />
          </div>
        );
      })}
    </div>
  );
};

export default FloatingAquaticHeroIcons;
