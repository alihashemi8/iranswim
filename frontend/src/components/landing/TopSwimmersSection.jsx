import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCoverflow, Navigation, Pagination } from 'swiper/modules';
import { ChevronLeft, ChevronRight, Trophy, Sparkles } from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../common/Badge';
import { FloatingLandingWaterIcons } from './FloatingLandingWaterIcons';
import { getMediaUrl } from '../../utils/media';

// Swiper CSS
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/autoplay';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const DEFAULT_TOP_SWIMMERS = [
  {
    id: 1,
    name: 'محمد پارسا صفایی',
    role: 'پروانه',
    age: '۱۵ تا ۱۷ سال',
    description: 'رکورددار ۱۰۰ متر پروانه',
    image: '/images/top-swimmers/safaei.jpg',
    image_url: '/images/top-swimmers/safaei.jpg',
  },
  {
    id: 2,
    name: 'کاوه راموز',
    role: 'استقامت سینه',
    age: '۱۸ سال به بالا',
    description: 'قهرمان کشور',
    image: '/images/top-swimmers/ramooz.jpg',
    image_url: '/images/top-swimmers/ramooz.jpg',
  },
  {
    id: 3,
    name: 'مازیار بگیان',
    role: 'پروانه رو',
    age: '۱۸ سال به بالا',
    description: 'قهرمان کشور',
    image: '/images/top-swimmers/begian.jpg',
    image_url: '/images/top-swimmers/begian.jpg',
  },
  {
    id: 4,
    name: 'فربد ترابی',
    role: 'پروانه رو',
    age: '۱۸ سال به بالا',
    description: 'قهرمان کشور',
    image: '/images/top-swimmers/torabi.jpg',
    image_url: '/images/top-swimmers/torabi.jpg',
  },
  {
    id: 5,
    name: 'معراج توروه',
    role: 'قورباغه رو',
    age: '۱۸ سال به بالا',
    description: 'قهرمان کشور و مسابقات بین‌المللی دبی',
    image: '/images/top-swimmers/toureh.jpg',
    image_url: '/images/top-swimmers/toureh.jpg',
  },
  {
    id: 6,
    name: 'پوریا سید جعفری',
    role: 'مختلط',
    age: '۱۸ سال به بالا',
    description: 'قهرمان کشور',
    image: '/images/top-swimmers/jafari.jpg',
    image_url: '/images/top-swimmers/jafari.jpg',
  },
  {
    id: 7,
    name: 'امیر یعقوبی',
    role: 'مختلط',
    age: '۱۳ تا ۱۴ سال',
    description: 'قهرمان کشور در رده سنی نوجوانان',
    image: '/images/top-swimmers/yaghoubi.jpg',
    image_url: '/images/top-swimmers/yaghoubi.jpg',
  },
];

export default function TopSwimmersSection() {
  const [swimmers, setSwimmers] = useState(DEFAULT_TOP_SWIMMERS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchTopSwimmers = async () => {
      try {
        const res = await api.get('/content/top-swimmers/');
        if (isMounted && Array.isArray(res.data) && res.data.length > 0) {
          setSwimmers(res.data);
        }
      } catch (err) {
        console.warn('Failed to load dynamic top swimmers, using default list:', err);
      }
    };

    fetchTopSwimmers();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section
      id="top-swimmers"
      className="relative w-full py-12 sm:py-16 lg:py-20 min-w-0 select-none"
      dir="rtl"
    >
      <span id="facilities" className="sr-only" />

      {/* Floating Aquatic Water Icons on the native background */}
      <FloatingLandingWaterIcons section="facilities" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 relative z-10">
        {/* Section Header matching the site's light aesthetic */}
        <div className="text-center max-w-2xl mx-auto space-y-2.5">
          <Badge variant="info">معرفی قهرمانان و نخبگان</Badge>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            شناگران برتر
          </h2>

          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
            معرفی قهرمانان و استعدادهای برتر مجموعه
          </p>

          {/* Swipe Hint for touch/mobile */}
          <div className="flex lg:hidden items-center justify-center gap-1.5 text-[11px] sm:text-xs text-slate-600 pt-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-pulse" />
            <span>برای مشاهده سایر شناگران به صورت افقی بکشید</span>
          </div>
        </div>

        {/* Carousel Container */}
        <div className="relative group px-0 sm:px-8 lg:px-12">
          {/* Previous Button (Moves to previous swimmer) */}
          <button
            type="button"
            onClick={() => swiperInstance?.slidePrev()}
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-3 lg:right-0 z-30 w-12 h-12 rounded-full bg-white/95 hover:bg-cyan-600 text-slate-700 hover:text-white border-2 border-cyan-200/90 items-center justify-center transition-all duration-300 shadow-md hover:shadow-xl cursor-pointer hover:scale-110 active:scale-95"
            aria-label="شناگر قبلی"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Next Button (Moves to next swimmer) */}
          <button
            type="button"
            onClick={() => swiperInstance?.slideNext()}
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 -left-3 lg:left-0 z-30 w-12 h-12 rounded-full bg-white/95 hover:bg-cyan-600 text-slate-700 hover:text-white border-2 border-cyan-200/90 items-center justify-center transition-all duration-300 shadow-md hover:shadow-xl cursor-pointer hover:scale-110 active:scale-95"
            aria-label="شناگر بعدی"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Swiper Coverflow */}
          <Swiper
            modules={[Autoplay, EffectCoverflow, Navigation, Pagination]}
            effect="coverflow"
            centeredSlides={true}
            loop={swimmers.length > 3}
            autoplay={{
              delay: 3200,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            speed={750}
            grabCursor={true}
            slidesPerView={3}
            spaceBetween={-35}
            coverflowEffect={{
              rotate: 0,
              stretch: 0,
              depth: 130,
              modifier: 1.25,
              slideShadows: false,
            }}
            breakpoints={{
              320: {
                slidesPerView: 1.2,
                spaceBetween: 16,
              },
              640: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: -35,
              },
            }}
            onSwiper={setSwiperInstance}
            onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
            className="!py-6"
          >
            {swimmers.map((swimmer, index) => {
              const isCenter = activeIndex === index;
              const rawImg = swimmer.image_url || swimmer.image;
              const imageSrc = getMediaUrl(rawImg) || rawImg;

              return (
                <SwiperSlide key={swimmer.id || index} className="!h-[460px] sm:!h-[480px]">
                  <div
                    onClick={() => swiperInstance?.slideToLoop(index)}
                    className={`relative h-full rounded-3xl overflow-hidden transition-all duration-500 cursor-pointer select-none ${
                      isCenter
                        ? 'scale-100 opacity-100 shadow-[0_20px_45px_rgba(8,59,92,0.25)] border-2 border-cyan-400 ring-4 ring-cyan-400/20 z-20'
                        : 'scale-90 opacity-70 hover:opacity-90 shadow-md border border-cyan-100/80 z-10'
                    }`}
                  >
                    {/* Swimmer Photo */}
                    <img
                      src={imageSrc}
                      alt={swimmer.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        const fallbackName = swimmer.name?.includes('صفایی')
                          ? 'safaei'
                          : swimmer.name?.includes('راموز')
                          ? 'ramooz'
                          : swimmer.name?.includes('بگیان')
                          ? 'begian'
                          : swimmer.name?.includes('ترابی')
                          ? 'torabi'
                          : swimmer.name?.includes('توروه')
                          ? 'toureh'
                          : swimmer.name?.includes('جعفری')
                          ? 'jafari'
                          : swimmer.name?.includes('یعقوبی')
                          ? 'yaghoubi'
                          : 'safaei';
                        e.currentTarget.src = `/images/top-swimmers/${fallbackName}.jpg`;
                      }}
                      className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-700 hover:scale-105"
                      loading="lazy"
                    />

                    {/* Gradient Overlay for high-contrast legible text */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

                    {/* Top badge for center card */}
                    {isCenter && (
                      <div className="absolute top-4 right-4 z-10 bg-cyan-600/90 backdrop-blur-md text-white text-[11px] font-black px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5 shadow-md">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>استعداد برتر</span>
                      </div>
                    )}

                    {/* Bottom Details Overlay */}
                    <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 text-white text-right pointer-events-none space-y-1">
                      <h3
                        className="text-xl sm:text-2xl font-black !text-white tracking-tight drop-shadow-md"
                        style={{ color: '#ffffff' }}
                      >
                        {swimmer.name}
                      </h3>

                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <p className="text-cyan-300 text-sm sm:text-base font-black">
                          {swimmer.role}
                        </p>
                        <span className="text-[11px] sm:text-xs text-slate-200 font-bold bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/15">
                          {swimmer.age}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-100 pt-1 leading-relaxed font-semibold">
                        {swimmer.description}
                      </p>
                    </div>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>

          {/* Interactive Pagination Dots Indicator */}
          <div className="flex items-center justify-center gap-2 pt-3 z-20 relative">
            {swimmers.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => swiperInstance?.slideToLoop(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  activeIndex === idx
                    ? 'w-8 bg-cyan-600 shadow-md shadow-cyan-600/40'
                    : 'w-2 bg-cyan-900/25 hover:bg-cyan-900/50'
                }`}
                aria-label={`رفتن به شناگر ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
