import React from 'react';
import {
  OzonePurificationIcon,
  HydroTherapySpineIcon,
  CardioAquaticIcon,
  OlympicPoolLaneIcon,
  WaterMedalTrophyIcon,
  OlympicStopwatchIcon,
  SaunaThermalSpaIcon,
  RescueBuoyRingIcon,
  SwimGogglesIcon,
  SwimKickboardIcon,
} from '../common/AquaticIcons';

/**
 * FloatingAquaticSectionIcons
 * Renders subtle, non-intrusive floating aquatic icons in the side margins of page sections
 */
export const FloatingAquaticSectionIcons = ({ section }) => {
  const configs = {
    about: [
      {
        id: 'about-right',
        name: 'اصلاح ناهنجاری اسکلتی',
        Icon: HydroTherapySpineIcon,
        posStyle: { top: '35%', right: '1.5%' },
        animClass: 'anim-drift-1',
        delay: '-2.5s',
      },
      {
        id: 'about-left',
        name: 'سلامت قلبی عروقی در آب',
        Icon: CardioAquaticIcon,
        posStyle: { top: '65%', left: '1.5%' },
        animClass: 'anim-drift-3',
        delay: '-5.1s',
      },
    ],
    courses: [
      {
        id: 'courses-right',
        name: 'لاین‌های استخر المپیک',
        Icon: OlympicPoolLaneIcon,
        posStyle: { top: '25%', right: '1.8%' },
        animClass: 'anim-drift-2',
        delay: '-1.8s',
      },
      {
        id: 'courses-left',
        name: 'تخته آموزش شنا',
        Icon: SwimKickboardIcon,
        posStyle: { top: '75%', left: '1.8%' },
        animClass: 'anim-drift-4',
        delay: '-4.3s',
      },
    ],
    coaches: [
      {
        id: 'coaches-right',
        name: 'کاپ قهرمانی فدراسیون',
        Icon: WaterMedalTrophyIcon,
        posStyle: { top: '20%', right: '1.5%' },
        animClass: 'anim-drift-1',
        delay: '-3.7s',
      },
      {
        id: 'coaches-left',
        name: 'زمان‌بندی و ثبت رکورد',
        Icon: OlympicStopwatchIcon,
        posStyle: { top: '68%', left: '1.5%' },
        animClass: 'anim-drift-3',
        delay: '-0.9s',
      },
    ],
    facilities: [
      {
        id: 'facilities-right',
        name: 'سونای خشک فنلاندی',
        Icon: SaunaThermalSpaIcon,
        posStyle: { top: '28%', right: '1.5%' },
        animClass: 'anim-drift-4',
        delay: '-4.6s',
      },
      {
        id: 'facilities-left',
        name: 'تصفیه اوزون و کلرزدایی',
        Icon: OzonePurificationIcon,
        posStyle: { top: '72%', left: '1.5%' },
        animClass: 'anim-drift-2',
        delay: '-2.1s',
      },
    ],
    news: [
      {
        id: 'news-right',
        name: 'عینک مسابقه و لوازم شنا',
        Icon: SwimGogglesIcon,
        posStyle: { top: '30%', right: '1.8%' },
        animClass: 'anim-drift-1',
        delay: '-3.2s',
      },
      {
        id: 'news-left',
        name: 'حلقه نجات غریق فدراسیون',
        Icon: RescueBuoyRingIcon,
        posStyle: { top: '65%', left: '1.8%' },
        animClass: 'anim-drift-3',
        delay: '-5.8s',
      },
    ],
  };

  const items = configs[section] || [];
  if (!items.length) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 hidden xl:block" aria-hidden="true">
      {items.map((item) => {
        const { id, name, Icon, posStyle, animClass, delay } = item;
        return (
          <div
            key={id}
            title={name}
            className={`floating-aquatic-item ${animClass} floating-aquatic-bubble w-11 h-11 opacity-45 hover:opacity-95`}
            style={{
              ...posStyle,
              animationDelay: delay,
            }}
          >
            <Icon className="w-5 h-5 text-cyan-800 pointer-events-none" />
          </div>
        );
      })}
    </div>
  );
};

export default FloatingAquaticSectionIcons;
