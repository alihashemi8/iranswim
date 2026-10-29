import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, ArrowLeft, PhoneCall,
  CheckCircle2, Clock, MapPin, Check,
  Sparkles, Droplet, ArrowDown, Waves, Users2, Award
} from 'lucide-react';
import {
  SwimmerCrawlIcon,
  SwimmerButterflyIcon,
  SwimmerBreaststrokeIcon,
  OlympicPoolLaneIcon,
  OzonePurificationIcon,
  HydroTherapySpineIcon,
  CardioAquaticIcon,
  OlympicStopwatchIcon,
  RescueBuoyRingIcon,
  SaunaThermalSpaIcon,
  DryLandSwimGymIcon,
  WaterMedalTrophyIcon,
  SynchroSwimIcon,
  PoolStartingBlockIcon,
} from '../../components/common/AquaticIcons';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Carousel } from '../../components/common/Carousel';
import { LoadingState } from '../../components/common/LoadingState';
import { useAuth } from '../../context/AuthContext';
import { AquaticPoolBackground } from '../../components/landing/AquaticPoolBackground';
import './HomePage.css';

// Verified real database records for coaches and news in Qazvin
const INITIAL_COURSES = [
  {
    id: 1,
    name: 'دوره جامع استعدادیابی نخبگان نونهال',
    status: 'ACTIVE',
    sessions_count: 12,
    age_range: 'نونهالان و نوجوانان (۶ تا ۱۲ سال)',
    gender: 'ALL',
    gender_display: 'عمومی (دختران و پسران)',
    what_you_learn: 'آزمون‌های فیزیولوژیک درون آب، پیکرسنجی و کشش عضلانی، سنجش توان قلبی‌عروقی و ارزیابی ورود به لیگ باشگاهی',
    groups: [
      { id: 1, name: 'گروه استعدادیابی نونهالان (شنبه و چهارشنبه ۱۶:۰۰)', pool_location: 'استخر نیلگون انقلاب', remaining_capacity: 10 }
    ]
  },
  {
    id: 2,
    name: 'مدرسه شنای نونهالان (آشنایی با آب و رفع ترس)',
    status: 'ACTIVE',
    sessions_count: 10,
    age_range: 'کودکان و خردسالان (۴ تا ۹ سال)',
    gender: 'ALL',
    gender_display: 'عمومی (دختران و پسران)',
    what_you_learn: 'غلبه بر ترس از آب، اصول تنفس و غوطه‌وری، بازی‌های تعادلی و شناوری، آموزش مقدماتی پا زدن',
    groups: [
      { id: 2, name: 'گروه نونهالان آب‌پری (پنج‌شنبه‌ها ۱۰:۰۰)', pool_location: 'استخر آموزشی سرپوشیده با دمای ۳۱ درجه', remaining_capacity: 5 }
    ]
  },
  {
    id: 3,
    name: 'دوره تخصصی شنای پروانه و استارت قهرمانی',
    status: 'ACTIVE',
    sessions_count: 12,
    age_range: 'نوجوانان و جوانان (۱۲ سال به بالا)',
    gender: 'MALE',
    gender_display: 'پسران / آقایان',
    what_you_learn: 'تکنیک تخصصی موج دلفین، پرتاب دست و تنفس تک‌ضرب پروانه، استارت جهشی از سکو و چرخش‌های سالتو',
    groups: [
      { id: 3, name: 'گروه پیشرفته صبحگاهی (روزهای زوج ۰۸:۰۰)', pool_location: 'استخر قهرمانی آزادی - لاین اختصاصی ۲', remaining_capacity: 3 }
    ]
  },
  {
    id: 4,
    name: 'دوره جامع آموزش کرال سینه و استقامت پاییز ۱۴۰۵',
    status: 'ACTIVE',
    sessions_count: 12,
    age_range: 'نوجوانان و بزرگسالان (۱۰ سال به بالا)',
    gender: 'MALE',
    gender_display: 'پسران / آقایان',
    what_you_learn: 'اصلاح تکنیک دست و پای کرال سینه، تنفس ریتمیک دوطرفه، افزایش ظرفیت هوازی و شنای ممتد در لاین طولانی',
    groups: [
      { id: 4, name: 'گروه A (روزهای فرد ساعت ۱۷:۰۰)', pool_location: 'استخر آزادی', remaining_capacity: 12 }
    ]
  },
  {
    id: 5,
    name: 'دوره جامع آموزش کرال سینه و تکنیک تنفس',
    status: 'ACTIVE',
    sessions_count: 12,
    age_range: 'نونهالان و نوجوانان (۸ تا ۱۵ سال)',
    gender: 'ALL',
    gender_display: 'عمومی (دختران و پسران)',
    what_you_learn: 'آموزش زاویه اصولی دست کرال، پای منظم با تخته شنا، تنفس منظم دوطرفه و رهاسازی عضلانی در آب',
    groups: [
      { id: 5, name: 'گروه A عصرها (یکشنبه و سه‌شنبه ۱۷:۰۰)', pool_location: 'استخر ۵۰ متری المپیک - لاین ۳ و ۴', remaining_capacity: 7 }
    ]
  }
];

const INITIAL_COACHES = [
  {
    id: 1,
    full_name: 'محمد رضایی',
    specialties: 'کرال سینه، شنای پروانه، نجات غریق درجه ۱',
    bio: 'مربی رسمی فدراسیون شنا با ۱۰ سال سابقه آموزش تیم‌های پایه و استعدادیابی در استخرهای قزوین',
    icon: SwimmerCrawlIcon,
  },
  {
    id: 4,
    full_name: 'نیما سعادتی',
    specialties: 'شنای قورباغه، اصلاح تکنیک و استارت',
    bio: 'مربی تخصصی اصلاح حرکت، استارت و استقامت بدنی شناگران در رده‌های نوجوانان و جوانان قزوین',
    icon: PoolStartingBlockIcon,
  },
  {
    id: 2,
    full_name: 'علیرضا مرادی (مربی)',
    specialties: 'کرال سینه، شنای پروانه، نجات غریق',
    bio: 'مربی رسمی فدراسیون شنا با ۱۲ سال سابقه تدریس شنای مبتدی و پیشرفته برای کودکان و بزرگسالان در قزوین',
    icon: RescueBuoyRingIcon,
  },
  {
    id: 3,
    full_name: 'سارا کاظمی',
    specialties: 'آموزش بانوان و کودکان، آب‌درمانی و کرال پشت',
    bio: 'مدرس رسمی فدراسیون و کارشناس تربیت بدنی با سابقه ۱۰ سال برگزاری کلاس‌های آموزش شنای بانوان در قزوین',
    icon: SynchroSwimIcon,
  },
  {
    id: 5,
    full_name: 'مهدی یزدانی',
    specialties: 'استعدادیابی نونهالان، آب‌بازی و رفع ترس از آب',
    bio: 'مربی باحوصله و مجرب در حوزه آموزش اصولی شنا از پایه برای رده‌های سنی ۵ تا ۱۲ سال',
    icon: WaterMedalTrophyIcon,
  },
];

const INITIAL_NEWS = [
  {
    id: 1,
    title: 'آغاز ثبت‌نام دوره‌های جدید آموزش شنا در استخرهای قزوین',
    category: 'CLASSES',
    category_display: 'دوره‌ها و کلاس‌ها',
    summary: 'ثبت‌نام ترم جدید کلاس‌های آموزش ۴ شنا ویژه کودکان، نوجوانان و بزرگسالان آغاز شد.',
    body: 'علاقه‌مندان می‌توانند برای انتخاب تایم کلاس‌ها و تعیین سطح اولیه، از طریق سامانه یا با هماهنگی تلفنی اقدام نمایند.',
    publish_at: '2026-10-25T12:49:27.601522+00:00',
  },
  {
    id: 2,
    title: 'برگزاری برنامه استعدادیابی شنای نونهالان استان قزوین',
    category: 'COMPETITIONS',
    category_display: 'استعدادیابی',
    summary: 'طرح شناسایی استعدادهای برتر شنا در رده‌های سنی ۶ تا ۱۲ سال با حضور مربیان رسمی فدراسیون برگزار گردید.',
    body: 'این ارزیابی با هدف جذب نونهالان مستعد جهت آموزش اصولی تکنیک‌های پایه و آماده‌سازی برای مسابقات استانی انجام شد.',
    publish_at: '2026-10-22T16:35:12.990003+00:00',
  },
  {
    id: 3,
    title: 'راهنمای والدین: راهکارهای رفع ترس از آب در کودکان خردسال',
    category: 'HEALTH',
    category_display: 'آموزش و مشاوره',
    summary: 'چگونه می‌توان با آب‌بازی و محیط آرام، تجربه اولین جلسات شنا را برای کودک لذت‌بخش و خاطره‌انگیز کرد.',
    body: 'روانشناسی آموزش شنا به کودکان نشان می‌دهد همراهی صبورانه مربی و پرهیز از اجبار، مهم‌ترین عامل در علاقه پایدار کودک به شنا است.',
    publish_at: '2026-10-18T16:35:12.997702+00:00',
  },
  {
    id: 4,
    title: 'نکات بهداشتی استخرها و مراقبت از چشم و پوست کودکان',
    category: 'HEALTH',
    category_display: 'بهداشت و سلامت',
    summary: 'توصیه‌های مهم مربیان درباره استفاده از عینک و کلاه شنای استاندارد و دوش گرفتن قبل و بعد از تمرین.',
    body: 'رعایت اصول بهداشت فردی و شستشوی مناسب بعد از استخر، از خشکی پوست و خستگی جلوگیری می‌کند.',
    publish_at: '2026-10-15T16:35:13.005472+00:00',
  },
];

const getCourseDetails = (course) => {
  // 1. Age Range (رده سنی)
  let ageRange = course.age_range;
  if (!ageRange) {
    const name = course.name || '';
    if (name.includes('نونهال') || name.includes('کودک')) {
      ageRange = 'کودکان و نونهالان (۶ تا ۱۲ سال)';
    } else if (name.includes('پروانه') || name.includes('قهرمانی')) {
      ageRange = 'نوجوانان و جوانان (۱۲ سال به بالا)';
    } else if (name.includes('استقامت') || name.includes('پاییز')) {
      ageRange = 'نوجوانان و بزرگسالان (۱۰ سال به بالا)';
    } else {
      ageRange = 'عموم رده‌های سنی (۸ تا ۱۶ سال)';
    }
  }

  // 2. Gender (جنسیت)
  let gender = course.gender_display;
  if (!gender) {
    if (course.gender === 'MALE') {
      gender = 'پسران / آقایان';
    } else if (course.gender === 'FEMALE') {
      gender = 'دختران / بانوان';
    } else if (course.gender === 'ALL') {
      gender = 'عمومی (دختران و پسران)';
    } else {
      const name = course.name || '';
      if (name.includes('پروانه') || name.includes('استقامت')) {
        gender = 'پسران / آقایان';
      } else {
        gender = 'عمومی (دختران و پسران)';
      }
    }
  }

  // 3. What they teach (چیزی که یاد میدن)
  let whatYouLearn = course.what_you_learn;
  if (!whatYouLearn) {
    const name = course.name || '';
    if (name.includes('پروانه')) {
      whatYouLearn = 'تکنیک تخصصی موج دلفین، پرتاب دست و تنفس تک‌ضرب پروانه، استارت جهشی از سکو و سالتو';
    } else if (name.includes('نونهال') && name.includes('ترس')) {
      whatYouLearn = 'غلبه بر ترس از آب، اصول تنفس و غوطه‌وری، بازی‌های تعادلی و شناوری، آموزش مقدماتی پا زدن';
    } else if (name.includes('استعدادیابی')) {
      whatYouLearn = 'آزمون‌های فیزیولوژیک درون آب، پیکرسنجی و کشش عضلانی، سنجش توان قلبی و ارزیابی ورود به لیگ';
    } else if (name.includes('کرال سینه') && name.includes('استقامت')) {
      whatYouLearn = 'اصلاح تکنیک دست و پای کرال سینه، تنفس ریتمیک دوطرفه، افزایش ظرفیت هوازی و شنای ممتد در لاین طولانی';
    } else if (name.includes('کرال سینه') && name.includes('تنفس')) {
      whatYouLearn = 'آموزش زاویه اصولی دست کرال، پای منظم با تخته شنا، تنفس منظم دوطرفه و رهاسازی عضلانی در آب';
    } else if (course.description) {
      whatYouLearn = course.description;
    } else {
      whatYouLearn = 'آموزش اصولی تکنیک‌های پایه شنا، هماهنگی تنفس و دست و پا، و غوطه‌وری ایمن';
    }
  }

  return { ageRange, gender, whatYouLearn };
};

export const HomePage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState(INITIAL_COURSES);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coaches, setCoaches] = useState(INITIAL_COACHES);
  const [news, setNews] = useState(INITIAL_NEWS);
  const [selectedNews, setSelectedNews] = useState(null);

  // Auto-scroll for core benefit cards on mobile & tablet without play/pause buttons
  const benefitsTrackRef = useRef(null);
  const activeBenefitIndexRef = useRef(0);
  const [activeBenefitDot, setActiveBenefitDot] = useState(0);
  const isBenefitInteractingRef = useRef(false);
  const benefitTimeoutRef = useRef(null);

  useEffect(() => {
    const track = benefitsTrackRef.current;
    if (!track) return;

    const intervalId = setInterval(() => {
      // Don't auto-scroll if user is currently interacting
      if (isBenefitInteractingRef.current) return;

      // On desktop (grid layout where all cards fit), do not scroll
      if (track.scrollWidth <= track.clientWidth + 20) return;

      const cards = Array.from(track.children);
      if (!cards || cards.length <= 1) return;

      const nextIndex = (activeBenefitIndexRef.current + 1) % cards.length;
      activeBenefitIndexRef.current = nextIndex;
      setActiveBenefitDot(nextIndex);

      cards[nextIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }, 3600);

    return () => clearInterval(intervalId);
  }, []);

  const handleBenefitInteractionStart = () => {
    isBenefitInteractingRef.current = true;
    if (benefitTimeoutRef.current) {
      clearTimeout(benefitTimeoutRef.current);
    }
  };

  const handleBenefitInteractionEnd = () => {
    if (benefitTimeoutRef.current) {
      clearTimeout(benefitTimeoutRef.current);
    }
    benefitTimeoutRef.current = setTimeout(() => {
      isBenefitInteractingRef.current = false;
    }, 4000);
  };

  const handleBenefitScroll = () => {
    const track = benefitsTrackRef.current;
    if (!track) return;
    const cards = Array.from(track.children);
    if (!cards || cards.length === 0) return;

    const trackCenter = track.getBoundingClientRect().left + track.clientWidth / 2;
    let closestIndex = 0;
    let minDiff = Infinity;

    cards.forEach((card, idx) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const diff = Math.abs(trackCenter - cardCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = idx;
      }
    });

    activeBenefitIndexRef.current = closestIndex;
    setActiveBenefitDot(closestIndex);
  };

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const [courseRes, coachRes, nRes] = await Promise.allSettled([
          api.get('/education/courses/'),
          api.get('/coaches/'),
          api.get('/content/news/'),
        ]);
        if (courseRes.status === 'fulfilled' && courseRes.value?.data) {
          const courseData = courseRes.value.data.results || courseRes.value.data;
          if (Array.isArray(courseData) && courseData.length > 0) setCourses(courseData);
        }
        if (coachRes.status === 'fulfilled' && coachRes.value?.data) {
          const cData = coachRes.value.data.results || coachRes.value.data;
          if (Array.isArray(cData) && cData.length > 0) setCoaches(cData);
        }
        if (nRes.status === 'fulfilled' && nRes.value?.data) {
          const nData = nRes.value.data.results || nRes.value.data;
          if (Array.isArray(nData) && nData.length > 0) setNews(nData);
        }
      } catch (err) {
        console.error('Error updating live landing data:', err);
      } finally {
        setCoursesLoading(false);
      }
    };
    fetchLandingData();
  }, []);

  // Professional portraits curated for each coach
  const getCoachAvatar = (coach) => {
    const name = coach?.full_name || '';
    if (name.includes('سارا')) {
      return 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80';
    }
    if (name.includes('نیما')) {
      return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80';
    }
    if (name.includes('علیرضا')) {
      return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=500&q=80';
    }
    if (name.includes('مهدی')) {
      return 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=500&q=80';
    }
    return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80';
  };

  const getCoachSpecialtyIcon = (coach) => {
    const name = coach?.full_name || '';
    const spec = (coach?.specialties || '').toLowerCase();
    if (name.includes('سارا') || spec.includes('موزون') || spec.includes('آب‌درمانی')) return SynchroSwimIcon;
    if (name.includes('نیما') || spec.includes('استارت') || spec.includes('سرعتی')) return PoolStartingBlockIcon;
    if (name.includes('علیرضا') || spec.includes('نجات') || spec.includes('غریق')) return RescueBuoyRingIcon;
    if (name.includes('مهدی') || spec.includes('نونهالان') || spec.includes('استعدادیابی')) return WaterMedalTrophyIcon;
    if (spec.includes('پروانه')) return SwimmerButterflyIcon;
    if (spec.includes('قورباغه')) return SwimmerBreaststrokeIcon;
    return SwimmerCrawlIcon;
  };

  const getNewsImage = (item, index) => {
    const cat = item?.category;
    if (cat === 'COMPETITIONS') {
      return 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&q=80';
    }
    if (cat === 'HEALTH') {
      return 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80';
    }
    if (cat === 'CLASSES') {
      return index % 2 === 0
        ? 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=800&q=80'
        : 'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?auto=format&fit=crop&w=800&q=80';
    }
    return 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?auto=format&fit=crop&w=800&q=80';
  };

  const getNewsCategoryIcon = (category) => {
    switch (category) {
      case 'COMPETITIONS': return OlympicStopwatchIcon;
      case 'CLASSES': return OlympicPoolLaneIcon;
      case 'HEALTH': return OzonePurificationIcon;
      case 'GENERAL':
      default: return WaterMedalTrophyIcon;
    }
  };

  const formatPersianDateString = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getDashboardDestination = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'ADMIN': return '/admin';
      case 'COACH': return '/coach';
      case 'SUPERVISOR': return '/supervisor';
      case 'SWIMMER': return '/swimmer';
      default: return '/';
    }
  };

  return (
    <div className="landing-experience relative min-h-screen selection:bg-cyan-200 selection:text-slate-900 overflow-x-hidden text-right font-sans">
      {/* Dynamic Aquatic Water Caustic Canvas */}
      <AquaticPoolBackground />

      {/* Main Content Layers */}
      <div className="relative z-20 space-y-20 sm:space-y-28 lg:space-y-36 pb-20 pt-4">
        
        {/* =========================================================================
            SECTION 1: CINEMATIC AQUATIC HERO & WATER ENTRY ARENA
            ========================================================================= */}
        <section className="landing-hero relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 lg:pt-18 min-w-0">
          <div className="landing-hero__panel relative w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
              {/* Text & Primary Actions */}
              <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-right">
                
                {/* Floating Aquatic Pill */}
                <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/95 border-2 border-cyan-200/90 rounded-full text-xs sm:text-sm font-bold text-slate-900 shadow-md">
                  <MapPin className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>مدرسه شنای ایران • استان قزوین</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1" />
                </div>

                {/* Main Headline */}
                <div className="space-y-4">
                  <h1 className="text-3xl sm:text-4xl md:text-[1.85rem] lg:text-[2.6rem] xl:text-5xl font-black tracking-tight leading-[1.25] text-white">
                    <span>آموزش اصولی شنا</span>{' '}
                    <br className="block md:hidden" />
                    <span className="text-cyan-300 font-black">
                      از مبتدی تا پیشرفته
                    </span>
                  </h1>
                  <p className="hero-lead-text text-base sm:text-xl font-bold text-sky-100 leading-snug">
                    دوره‌های آموزش شنا ویژه کودکان، نوجوانان و بزرگسالان زیر نظر مربیان رسمی فدراسیون شنا
                  </p>
                </div>

                {/* Editorial Description */}
                <p className="hero-editorial-p text-sm sm:text-base lg:text-lg text-slate-100/90 leading-relaxed font-normal max-w-2xl text-justify">
                  اگر به دنبال یادگیری اصولی شنا، رفع ترس از آب در کودکان یا آموزش چهار شنا (کرال سینه، کرال پشت، قورباغه و پروانه) هستید؛ کلاس‌های ما در استخرهای منتخب قزوین در محیطی بهداشتی، خلوت و با برنامه‌ریزی منظم برگزار می‌شود.
                </p>

                {/* Primary Conversion & Navigation Buttons */}
                <div className="flex flex-row items-center gap-2.5 sm:gap-4 pt-3 w-full sm:w-auto">
                  {user ? (
                    <Link
                      to={getDashboardDestination()}
                      className="flex-1 sm:flex-initial justify-center px-4 sm:px-7 py-3.5 sm:py-4 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black rounded-2xl shadow-[0_8px_20px_-4px_rgba(34,211,238,0.5)] hover:shadow-cyan-400/60 transition-all text-xs sm:text-base inline-flex items-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 text-center whitespace-nowrap"
                    >
                      <span>ورود به پنل کاربری</span>
                      <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      className="flex-1 sm:flex-initial justify-center px-4 sm:px-7 py-3.5 sm:py-4 bg-cyan-300 hover:bg-cyan-200 text-slate-950 font-black rounded-2xl shadow-[0_8px_20px_-4px_rgba(34,211,238,0.5)] hover:shadow-cyan-400/60 transition-all text-xs sm:text-base inline-flex items-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 text-center whitespace-nowrap"
                    >
                      <span>ثبت‌نام در کلاس‌ها</span>
                      <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    </Link>
                  )}

                  <a
                    href="#coaches"
                    className="flex-1 sm:flex-initial justify-center px-4 sm:px-6 py-3.5 sm:py-4 bg-white hover:bg-cyan-50 text-slate-950 font-black rounded-2xl border-2 border-cyan-200/80 shadow-[0_8px_20px_-4px_rgba(255,255,255,0.4)] hover:shadow-white/60 transition-all text-xs sm:text-base inline-flex items-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 text-center whitespace-nowrap"
                  >
                    <Users2 className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600 shrink-0" />
                    <span>کادر مربیان قزوین</span>
                  </a>
                </div>

                {/* Key Metric Features */}
                <div className="pt-6 border-t border-cyan-300/40 flex overflow-x-auto sm:grid sm:grid-cols-4 gap-2.5 sm:gap-4 pb-2 sm:pb-0 landing-scroll-track snap-x snap-mandatory">
                  <div className="hero-feature-card min-w-[160px] sm:min-w-0 shrink-0 sm:shrink snap-start p-3 sm:p-3.5 lg:p-4 rounded-2xl bg-white/95 border-2 border-cyan-100/90 shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex flex-col justify-start gap-1.5 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-1.5 text-slate-950 text-xs sm:text-[13px] lg:text-sm font-black whitespace-nowrap">
                      <Waves className="w-4 h-4 text-cyan-600 shrink-0" />
                      <span className="font-black whitespace-nowrap">آموزش ۴ شنا</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 font-bold leading-snug sm:leading-relaxed">کرال سینه، پشت، قورباغه و پروانه</p>
                  </div>

                  <div className="hero-feature-card min-w-[160px] sm:min-w-0 shrink-0 sm:shrink snap-start p-3 sm:p-3.5 lg:p-4 rounded-2xl bg-white/95 border-2 border-cyan-100/90 shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex flex-col justify-start gap-1.5 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-1.5 text-slate-950 text-xs sm:text-[13px] lg:text-sm font-black whitespace-nowrap">
                      <Award className="w-4 h-4 text-cyan-600 shrink-0" />
                      <span className="font-black whitespace-nowrap">مربیان رسمی</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 font-bold leading-snug sm:leading-relaxed">دارای کارت مربیگری و نجات‌غریق</p>
                  </div>

                  <div className="hero-feature-card min-w-[160px] sm:min-w-0 shrink-0 sm:shrink snap-start p-3 sm:p-3.5 lg:p-4 rounded-2xl bg-white/95 border-2 border-cyan-100/90 shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex flex-col justify-start gap-1.5 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-1.5 text-slate-950 text-xs sm:text-[13px] lg:text-sm font-black whitespace-nowrap">
                      <Users2 className="w-4 h-4 text-cyan-600 shrink-0" />
                      <span className="font-black whitespace-nowrap">کودکان و بزرگسالان</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 font-bold leading-snug sm:leading-relaxed">از ۵ سال تا رده‌های بزرگسال</p>
                  </div>

                  <div className="hero-feature-card min-w-[160px] sm:min-w-0 shrink-0 sm:shrink snap-start p-3.5 sm:p-3.5 lg:p-4 rounded-2xl bg-white/95 border-2 border-cyan-100/90 shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex flex-col justify-start gap-1.5 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-1.5 text-slate-950 text-xs sm:text-[13px] lg:text-sm font-black whitespace-nowrap">
                      <MapPin className="w-4 h-4 text-cyan-600 shrink-0" />
                      <span className="font-black whitespace-nowrap">استخرهای قزوین</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 font-bold leading-snug sm:leading-relaxed">محیط تمیز، بهداشتی و ایمن</p>
                  </div>
                </div>

              </div>

              {/* Swimmer Boy Hero Mascot */}
              <div className="lg:col-span-5 relative flex items-center justify-center">
                <div className="relative w-full max-w-sm sm:max-w-md flex items-center justify-center py-4">
                  {/* Subtle aquatic glow behind the swimmer */}
                  <div className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />

                  <img
                    src="/images/swimmer-boy.png"
                    alt="آموزشگاه شنای ایران - آموزش و استعدادیابی شنا"
                    className="hero-swimmer-boy relative z-10 w-full max-w-[300px] sm:max-w-[360px] lg:max-w-[420px] h-auto object-contain select-none drop-shadow-[0_20px_35px_rgba(2,22,35,0.65)] hover:scale-105 transition-transform duration-500"
                    loading="eager"
                  />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 2: REAL CORE BENEFITS
            ========================================================================= */}
        <section id="about" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 min-w-0">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="info">ویژگی‌های کلاس‌های ما</Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              چرا مدرسه شنای ایران؟
            </h2>
            <p className="text-sm sm:text-base text-cyan-200/90 leading-relaxed font-medium">
              آموزش شنا با صبر و حوصله، متناسب با روحیات نوآموزان و با بالاترین استانداردهای ایمنی
            </p>
          </div>

          <div
            ref={benefitsTrackRef}
            onMouseEnter={handleBenefitInteractionStart}
            onMouseLeave={handleBenefitInteractionEnd}
            onTouchStart={handleBenefitInteractionStart}
            onTouchEnd={handleBenefitInteractionEnd}
            onScroll={handleBenefitScroll}
            className="landing-benefits-track landing-scroll-track flex overflow-x-auto pt-2 pb-4 px-1 gap-4 sm:gap-6 snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:gap-8 lg:overflow-visible lg:pb-0 lg:px-0 items-stretch"
          >
            {/* Benefit Card 1 - فیروزه‌ای پودری */}
            <div className="benefit-card benefit-card--turquoise card-hydrofoil group relative flex flex-col justify-between w-[84vw] sm:w-[340px] md:w-[360px] max-w-[380px] shrink-0 snap-center lg:w-auto lg:max-w-none lg:shrink">
              <div className="benefit-card__icon w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <CardioAquaticIcon className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="space-y-2.5 sm:space-y-3 flex-1 flex flex-col">
                <span className="benefit-card__badge inline-block self-start px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold">
                  کودکان و نوجوانان
                </span>
                <h3 className="benefit-card__title font-black text-xl sm:text-2xl lg:text-[1.35rem] xl:text-2xl leading-snug">
                  آموزش بدون ترس و روان‌شناختی
                </h3>
                <p className="benefit-card__desc text-sm sm:text-base leading-relaxed sm:leading-loose text-justify font-medium flex-1">
                  شروع از بازی‌های شاداب در آب کم‌عمق تا کودک احساس امنیت کامل کند و با انگیزه و علاقه واقعی مراحل یادگیری شنا را پشت سر بگذارد.
                </p>
              </div>
              <div className="benefit-card__footer mt-4 sm:mt-5 pt-3.5 flex items-center justify-between text-xs sm:text-sm font-bold">
                <span>محیط شاداب و امن برای کودک</span>
                <Check className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              </div>
            </div>

            {/* Benefit Card 2 - بنفش ملو پودری */}
            <div className="benefit-card benefit-card--purple card-hydrofoil group relative flex flex-col justify-between w-[84vw] sm:w-[340px] md:w-[360px] max-w-[380px] shrink-0 snap-center lg:w-auto lg:max-w-none lg:shrink">
              <div className="benefit-card__icon w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <HydroTherapySpineIcon className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="space-y-2.5 sm:space-y-3 flex-1 flex flex-col">
                <span className="benefit-card__badge inline-block self-start px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold">
                  اصلاح ساختار قامت و تنفس
                </span>
                <h3 className="benefit-card__title font-black text-xl sm:text-2xl lg:text-[1.35rem] xl:text-2xl leading-snug">
                  تقویت ستون فقرات و سلامت جسمانی
                </h3>
                <p className="benefit-card__desc text-sm sm:text-base leading-relaxed sm:leading-loose text-justify font-medium flex-1">
                  شنا بهترین ورزش برای جلوگیری از افتادگی شانه و گودی کمر در کودکان محصل است و در بزرگسالان به بهبود تنفس و کاهش دردهای عضلانی کمک می‌کند.
                </p>
              </div>
              <div className="benefit-card__footer mt-4 sm:mt-5 pt-3.5 flex items-center justify-between text-xs sm:text-sm font-bold">
                <span>بهبود استقامت و سلامت بدنی</span>
                <Check className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              </div>
            </div>

            {/* Benefit Card 3 - سبز پودری */}
            <div className="benefit-card benefit-card--green card-hydrofoil group relative flex flex-col justify-between w-[84vw] sm:w-[340px] md:w-[360px] max-w-[380px] shrink-0 snap-center lg:w-auto lg:max-w-none lg:shrink">
              <div className="benefit-card__icon w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <RescueBuoyRingIcon className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="space-y-2.5 sm:space-y-3 flex-1 flex flex-col">
                <span className="benefit-card__badge inline-block self-start px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold">
                  نظارت و ایمنی کامل
                </span>
                <h3 className="benefit-card__title font-black text-xl sm:text-2xl lg:text-[1.35rem] xl:text-2xl leading-snug">
                  مربیان رسمی و کلاس‌های کم‌جمعیت
                </h3>
                <p className="benefit-card__desc text-sm sm:text-base leading-relaxed sm:leading-loose text-justify font-medium flex-1">
                  آموزش توسط مربیان دارای کارت رسمی فدراسیون در گروه‌های خلوت و با حضور پیوسته نجات‌غریق برگزار می‌شود تا پیشرفت هر شناگر به طور اختصاصی پایش شود.
                </p>
              </div>
              <div className="benefit-card__footer mt-4 sm:mt-5 pt-3.5 flex items-center justify-between text-xs sm:text-sm font-bold">
                <span>توجه اختصاصی به تک‌تک شناگران</span>
                <Check className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              </div>
            </div>
          </div>

          {/* Dots Indicator for Mobile & Tablet (NO Play/Pause button) */}
          <div className="flex lg:hidden items-center justify-center gap-2 pt-1" aria-hidden="true">
            {[0, 1, 2].map((idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeBenefitDot === idx
                    ? 'w-7 bg-cyan-400 shadow-sm shadow-cyan-400/50'
                    : 'w-2 bg-cyan-900/40'
                }`}
              />
            ))}
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: LIVE COURSES
            ========================================================================= */}
        <section id="courses" className="landing-section w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 min-w-0">
          <div className="landing-section__heading flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-cyan-500/20 pb-5">
            <div className="space-y-1.5">
              <Badge variant="info">برنامه آموزشی ترم جاری</Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">دوره‌ها و کلاس‌های آموزشی</h2>
              <p className="text-xs sm:text-sm">کلاس‌های ثبت‌شده در سامانه، همراه با رده سنی، جنسیت و سرفصل‌های آموزشی</p>
            </div>
          </div>

          {coursesLoading ? (
            <LoadingState type="cards" count={3} message="در حال دریافت دوره‌های آموزشی..." />
          ) : courses.length ? (
            <Carousel
              items={courses}
              className="landing-carousel"
              ariaLabel="گردونه دوره‌ها و کلاس‌های آموزشی"
              visibleItems={{ mobile: 1, tablet: 2, desktop: 3 }}
              interval={4000}
              showPlayPause={false}
              showNavigation={true}
              showDots={true}
              pauseOnHover={true}
              renderItem={(course, index) => {
                const details = getCourseDetails(course);
                return (
                  <article
                    key={course.id}
                    className={`landing-course landing-course--${index % 3} flex flex-col justify-between h-full`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="landing-course__eyebrow">
                            {course.status === 'ACTIVE' ? 'ثبت‌نام فعال' : 'پیش‌ثبت‌نام'}
                          </span>
                          <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                            {course.name}
                          </h3>
                        </div>
                        <Waves className="w-6 h-6 shrink-0 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
                      </div>

                      {/* رده سنی و جنسیت */}
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/70 border border-sky-300/70 dark:border-sky-800/60 text-sky-900 dark:text-sky-200 text-xs">
                          <Users2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                          <span className="text-slate-500 dark:text-slate-400">رده سنی:</span>
                          <strong className="font-bold">{details.ageRange}</strong>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/70 border border-teal-300/70 dark:border-teal-800/60 text-teal-900 dark:text-teal-200 text-xs">
                          <Award className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span className="text-slate-500 dark:text-slate-400">جنسیت:</span>
                          <strong className="font-bold">{details.gender}</strong>
                        </div>
                      </div>

                      {/* چیزی که یاد میدن */}
                      <div className="mt-4 p-3.5 rounded-xl bg-cyan-950/5 dark:bg-slate-900/60 border border-cyan-500/20 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-cyan-900 dark:text-cyan-200 mb-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>آنچه در این دوره یاد می‌گیرید:</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-justify">
                          {details.whatYouLearn}
                        </p>
                      </div>

                      {/* اطلاعات جلسات و استخر بدون قیمت */}
                      <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 border-t border-cyan-500/20">
                        <span>{course.sessions_count} جلسه آموزشی</span>
                        <span className="font-medium text-cyan-800 dark:text-cyan-300">
                          {course.groups?.[0]?.pool_location || 'استخر اختصاصی آکادمی'}
                        </span>
                      </div>
                    </div>

                    <Link
                      to="/login"
                      className="landing-course__link mt-5 inline-flex items-center justify-between gap-2 pt-3 border-t border-cyan-500/20 font-bold"
                    >
                      <span>مشاهده و پیگیری ثبت‌نام</span>
                      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  </article>
                );
              }}
            />
          ) : (
            <p className="landing-empty-state">در حال حاضر دوره‌ای برای نمایش ثبت نشده است. برای اطلاع از ثبت‌نام با پذیرش تماس بگیرید.</p>
          )}
        </section>

        {/* =========================================================================
            SECTION 3: CERTIFIED FEDERATION COACHES
            ========================================================================= */}
        <section id="coaches" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-cyan-500/20 pb-5">
            <div className="space-y-1.5">
              <Badge variant="success">کادر مربیان قزوین</Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                مربیان باسابقه و رسمی مدرسه شنای ایران
              </h2>
              <p className="text-xs sm:text-sm text-cyan-200/80">
                دارای مدارک مربیگری رسمی و نجات‌غریق از فدراسیون شنا، شیرجه و واترپلو جمهوری اسلامی ایران
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/80 px-3.5 py-1.5 rounded-xl border border-cyan-500/30 shrink-0 self-start sm:self-auto shadow-sm">
              {coaches.length} مربی فعال و مجاز
            </span>
          </div>

          <Carousel
            items={coaches}
            className="landing-carousel"
            ariaLabel="اسلایدر کادر مربیان آموزشگاه"
            visibleItems={{ mobile: 1, tablet: 2, desktop: 3 }}
            interval={6000}
            renderItem={(coach) => {
              const avatar = getCoachAvatar(coach);
              const SpecialtyIcon = getCoachSpecialtyIcon(coach);
              return (
                <div className="landing-coach-card relative bg-slate-900/90 backdrop-blur-md card-hydrofoil p-6 text-center border-2 border-cyan-500/20 hover:border-cyan-400/60 shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 flex flex-col justify-between h-full">
                  <div>
                    {/* Portrait */}
                    <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-cyan-400/40 p-1 bg-gradient-to-tr from-cyan-950 to-teal-900 shadow-md">
                      <img
                        src={avatar}
                        alt={coach.full_name}
                        className="w-full h-full object-cover rounded-full"
                        loading="lazy"
                      />
                      <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center border border-slate-900 text-[10px]">
                        ✓
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white">
                      {coach.full_name}
                    </h3>
                    <div className="mt-1">
                      <span className="inline-block px-3 py-0.5 bg-cyan-950/70 text-cyan-300 text-[11px] font-bold rounded-lg border border-cyan-500/30">
                        مربی رسمی فدراسیون شنا
                      </span>
                    </div>

                    <div className="mt-3 py-2 px-3 bg-slate-800/80 rounded-xl border border-cyan-500/20 flex items-center justify-center gap-2">
                      <SpecialtyIcon className="w-4 h-4 text-teal-400 shrink-0" />
                      <p className="text-xs font-semibold text-cyan-200 truncate">
                        {coach.specialties || 'تخصص در تکنیک‌های چهارگانه و استقامت'}
                      </p>
                    </div>

                    <p className="text-xs text-slate-300 mt-3 leading-relaxed line-clamp-3 text-justify">
                      {coach.bio || 'مدرس باسابقه دوره‌های تخصصی شنای پایه و قهرمانی با پرورش قهرمانان استانی و کشوری'}
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-cyan-500/20 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      وضعیت: فعال و مجاز
                    </span>
                    <span className="font-mono text-cyan-300/80">کارت فدراسیون ✓</span>
                  </div>
                </div>
              );
            }}
          />
        </section>

        {/* =========================================================================
            SECTION 4: ACADEMY FACILITIES & INFRASTRUCTURE
            ========================================================================= */}
        <section id="facilities" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10 min-w-0">
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <Badge variant="info">محیط استخر و بهداشت آب</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              امکانات و شرایط بهداشتی استخرها در قزوین
            </h2>
            <p className="text-xs sm:text-sm text-cyan-200/80 leading-relaxed">
              برگزاری کلاس‌ها در استخرهای تمیز و استاندارد شهر قزوین با آب گرم، تصفیه بهداشتی و وسایل کمک‌آموزشی
            </p>
            {/* Swipe hint on mobile & tablet */}
            <div className="flex lg:hidden items-center justify-center gap-1.5 text-[11px] sm:text-xs text-cyan-200/80 pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>برای مشاهده سایر امکانات به صورت افقی بکشید</span>
            </div>
          </div>

          <div className="landing-facilities-track landing-scroll-track flex overflow-x-auto pt-2 pb-6 px-1 gap-5 snap-x snap-mandatory lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:pb-0 lg:px-0 items-stretch">
            {/* Feature 1 */}
            <div className="bg-slate-900/80 p-6 card-hydrofoil border-2 border-teal-500/20 hover:border-teal-400/60 transition-all duration-300 flex flex-col justify-between w-[80vw] sm:w-[280px] md:w-[300px] max-w-[320px] shrink-0 snap-start lg:w-auto lg:max-w-none lg:shrink">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-teal-950 text-teal-300 flex items-center justify-center border border-teal-500/30">
                    <OzonePurificationIcon className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold text-teal-300 bg-teal-950 rounded-lg border border-teal-500/30">
                    کنترل بهداشت
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-base text-white">آب زلال و تصفیه مداوم</h4>
                  <p className="text-xs text-slate-300 leading-relaxed text-justify">
                    تنظیم دمای آب متناسب با فصل و نظارت پیوسته بر زلالی آب استخر جهت راحتی نوآموزان و پیشگیری از سوزش چشم.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-teal-500/20 text-[11px] font-bold text-teal-400 flex items-center justify-between">
                <span>تضمین سلامت پوست و چشم</span>
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900/80 p-6 card-hydrofoil-alt border-2 border-amber-500/20 hover:border-amber-400/60 transition-all duration-300 flex flex-col justify-between w-[80vw] sm:w-[280px] md:w-[300px] max-w-[320px] shrink-0 snap-start lg:w-auto lg:max-w-none lg:shrink">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-amber-950 text-amber-300 flex items-center justify-center border border-amber-500/30">
                    <OlympicPoolLaneIcon className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold text-amber-300 bg-amber-950 rounded-lg border border-amber-500/30">
                    تجهیزات کامل
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-base text-white">وسایل کمک‌آموزشی استاندارد</h4>
                  <p className="text-xs text-slate-300 leading-relaxed text-justify">
                    استفاده از تخته شنا، نودل فومی، فین و جلیقه‌های استاندارد برای یادگیری ایمن‌تر و سریع‌تر دست و پا زدن.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-amber-500/20 text-[11px] font-bold text-amber-400 flex items-center justify-between">
                <span>تسهیل یادگیری نوآموزان</span>
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900/80 p-6 card-hydrofoil border-2 border-orange-500/20 hover:border-orange-400/60 transition-all duration-300 flex flex-col justify-between w-[80vw] sm:w-[280px] md:w-[300px] max-w-[320px] shrink-0 snap-start lg:w-auto lg:max-w-none lg:shrink">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-orange-950 text-orange-300 flex items-center justify-center border border-orange-500/30">
                    <SaunaThermalSpaIcon className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold text-orange-300 bg-orange-950 rounded-lg border border-orange-500/30">
                    امکانات رفاهی
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-base text-white">سونا، جکوزی و دوش تمیز</h4>
                  <p className="text-xs text-slate-300 leading-relaxed text-justify">
                    رختکن‌های تمیز، آب گرم مناسب و دسترسی به جکوزی جهت رفع خستگی و ریکاوری بعد از تمرین.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-orange-500/20 text-[11px] font-bold text-orange-400 flex items-center justify-between">
                <span>ریکاوری و آرامش پس از کلاس</span>
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-900/80 p-6 card-hydrofoil-alt border-2 border-indigo-500/20 hover:border-indigo-400/60 transition-all duration-300 flex flex-col justify-between w-[80vw] sm:w-[280px] md:w-[300px] max-w-[320px] shrink-0 snap-start lg:w-auto lg:max-w-none lg:shrink">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-indigo-950 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
                    <Clock className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold text-indigo-300 bg-indigo-950 rounded-lg border border-indigo-500/30">
                    سانس‌های مجزا
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-base text-white">تایم‌های تفکیک‌شده و منظم</h4>
                  <p className="text-xs text-slate-300 leading-relaxed text-justify">
                    برنامه‌ریزی دقیق سانس‌های ویژه بانوان، آقایان و نونهالان در ساعت‌های عصر و روزهای تعطیل برای رفاه خانواده‌ها.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-indigo-500/20 text-[11px] font-bold text-indigo-400 flex items-center justify-between">
                <span>تایم‌بندی منعطف با برنامه شما</span>
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 5: NEWS, ARTICLES & EVENTS
            ========================================================================= */}
        <section id="news" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-cyan-500/20 pb-5">
            <div className="space-y-1.5">
              <Badge variant="warning">اخبار و اطلاعیه‌ها</Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                تازه‌ترین رویدادها و اطلاعیه‌های مدرسه شنای ایران
              </h2>
              <p className="text-xs sm:text-sm text-cyan-200/80">
                زمان‌بندی ترم‌های آموزشی، استعدادیابی و نکات مهم یادگیری شنا در قزوین
              </p>
            </div>
          </div>

          <Carousel
            items={news}
            className="landing-carousel"
            ariaLabel="اسلایدر اخبار و رویدادهای آموزشگاه"
            visibleItems={{ mobile: 1, tablet: 2, desktop: 3 }}
            interval={5500}
            renderItem={(item, index) => {
              const imgUrl = getNewsImage(item, index);
              const CategoryIcon = getNewsCategoryIcon(item.category);
              return (
                <article className="landing-news-card group bg-slate-900/90 rounded-3xl border-2 border-cyan-500/20 overflow-hidden shadow-lg hover:shadow-cyan-500/10 hover:border-cyan-400/50 transition-all duration-300 flex flex-col justify-between h-full">
                  <div>
                    <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-950">
                      <img
                        src={imgUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-3.5 right-3.5 z-20">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 backdrop-blur-md text-cyan-300 text-[11px] font-bold rounded-lg border border-cyan-400/30">
                          <CategoryIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{item.category_display || 'اطلاعیه'}</span>
                        </span>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-cyan-300/80 font-mono">
                        <Clock className="w-3.5 h-3.5 text-teal-400" />
                        <span>{formatPersianDateString(item.publish_at)}</span>
                      </div>

                      <h3 className="text-base font-bold text-white leading-snug line-clamp-2 group-hover:text-cyan-300 transition-colors">
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 text-justify">
                        {item.summary || item.body}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 pt-0">
                    <button
                      type="button"
                      onClick={() => setSelectedNews(item)}
                      className="w-full text-center py-2.5 px-4 text-xs font-bold text-cyan-200 hover:text-white bg-cyan-950/70 hover:bg-cyan-900/70 rounded-xl border border-cyan-500/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>مطالعه متن کامل خبر</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              );
            }}
          />
        </section>

        {/* =========================================================================
            SECTION 6: FINAL REGISTRATION CALL TO ACTION
            ========================================================================= */}
        <section className="landing-cta w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0">
          <div className="landing-cta__panel relative w-full text-center space-y-6 py-10 sm:py-16">
            <div className="relative max-w-3xl mx-auto space-y-5">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/80 rounded-full text-xs sm:text-sm font-bold text-cyan-200 border border-cyan-400/40 shadow-md">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>پذیرش شناگر در تمامی رده‌های سنی در استان قزوین</span>
              </div>

              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.2]">
                آماده‌اید شنا را اصولی و استاندارد شروع کنید؟
              </h2>

              <p className="text-base sm:text-xl lg:text-2xl font-bold text-slate-100 leading-relaxed max-w-2xl mx-auto">
                برای مشاوره، اطلاع از سانس‌ها یا ثبت‌نام در کلاس‌های آموزش شنای کودکان و بزرگسالان در قزوین، از طریق سامانه اقدام کنید یا با پذیرش تماس بگیرید.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Link
                  to="/login"
                  className="px-8 sm:px-10 py-4 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black rounded-2xl shadow-xl hover:shadow-cyan-400/30 transition-all text-base sm:text-lg inline-flex items-center gap-2.5 cursor-pointer active:scale-95"
                >
                  <span>ورود و ثبت‌نام در دوره‌ها</span>
                  <ArrowLeft className="w-5 h-5" />
                </Link>

                <a
                  href="tel:02833650000"
                  className="px-7 sm:px-9 py-4 bg-white hover:bg-cyan-50 text-slate-950 font-black rounded-2xl border-2 border-cyan-200/90 transition-all text-base sm:text-lg inline-flex items-center gap-2.5 shadow-md"
                >
                  <PhoneCall className="w-5 h-5 text-cyan-600" />
                  <span>تماس با پذیرش: ۰۲۸-۳۳۶۵۰۰۰۰</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 7: ACCESSIBLE FOOTER
            ========================================================================= */}
        <footer className="w-full border-t border-cyan-500/20 bg-slate-950/95 backdrop-blur-md pt-14 pb-8 min-w-0">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
              
              {/* Identity */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 text-cyan-300 font-extrabold text-lg">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-400 text-white flex items-center justify-center shadow-md">
                    <SwimmerCrawlIcon className="w-5 h-5" />
                  </div>
                  <span>مدرسه شنای ایران - قزوین</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed text-justify">
                  مرکز تخصصی آموزش و استعدادیابی شنا در استان قزوین؛ برگزارکننده دوره‌های عمومی، نیمه‌خصوصی و خصوصی ۴ شنا ویژه کودکان، نوجوانان و بزرگسالان.
                </p>
                <div className="pt-2 flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30 w-fit">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>زیر نظر مربیان رسمی فدراسیون شنا</span>
                </div>
              </div>

              {/* Quick Links */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-white">بخش‌های وبسایت</h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li>
                    <a href="#about" className="hover:text-cyan-300 transition-colors">
                      ویژگی‌ها و مزایای کلاس‌ها
                    </a>
                  </li>
                  <li>
                    <a href="#courses" className="hover:text-cyan-300 transition-colors">
                      برنامه دوره‌ها و ثبت‌نام
                    </a>
                  </li>
                  <li>
                    <a href="#coaches" className="hover:text-cyan-300 transition-colors">
                      کادر مربیان قزوین
                    </a>
                  </li>
                  <li>
                    <a href="#facilities" className="hover:text-cyan-300 transition-colors">
                      امکانات و شرایط استخرها
                    </a>
                  </li>
                </ul>
              </div>

              {/* Portal Access */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-white">ورود به سامانه‌ها</h4>
                <ul className="space-y-2 text-xs text-cyan-300">
                  <li>
                    <Link to="/login" className="hover:underline flex items-center gap-1.5">
                      <span>ورود شناگران و والدین</span>
                      <ArrowLeft className="w-3 h-3" />
                    </Link>
                  </li>
                  <li>
                    <Link to="/login" className="hover:underline flex items-center gap-1.5">
                      <span>میز کار مربیان</span>
                      <ArrowLeft className="w-3 h-3" />
                    </Link>
                  </li>
                  <li>
                    <Link to="/login" className="hover:underline flex items-center gap-1.5">
                      <span>مدیریت آموزشگاه</span>
                      <ArrowLeft className="w-3 h-3" />
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-white">اطلاعات تماس و استخرها</h4>
                <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span>قزوین، استخرها و مجموعه‌های ورزشی طرف قرارداد مدرسه شنای ایران</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>تلفن هماهنگی: ۰۲۸-۳۳۶۵۰۰۰۰</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>پاسخگویی و هماهنگی: شنبه تا پنج‌شنبه ۹ الی ۲۰</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <p>
                کلیه حقوق مادی و معنوی متعلق به مدرسه شنای ایران در استان قزوین می‌باشد © ۱۴۰۵
              </p>
              <div className="flex items-center gap-2 text-[11px] text-cyan-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>سامانه ثبت‌نام آنلاین فعال است</span>
              </div>
            </div>
          </div>
        </footer>

      </div>

      {/* =========================================================================
          NEWS DETAIL MODAL
          ========================================================================= */}
      <Modal
        isOpen={!!selectedNews}
        onClose={() => setSelectedNews(null)}
        title={selectedNews?.title || 'مشاهده خبر'}
        maxWidth="max-w-3xl"
      >
        {selectedNews && (
          <div className="space-y-5 text-right">
            <div className="relative h-56 sm:h-64 w-full rounded-2xl overflow-hidden bg-slate-900 shadow-md">
              <img
                src={getNewsImage(selectedNews, 0)}
                alt={selectedNews.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3">
                <span className="px-3 py-1 bg-slate-900/90 backdrop-blur-md text-cyan-300 text-xs font-bold rounded-lg border border-cyan-400/30">
                  {selectedNews.category_display || 'اطلاعیه'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span className="font-semibold text-cyan-300 bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                دسته‌بندی: {selectedNews.category_display || 'عمومی'}
              </span>
              <span className="font-mono">
                تاریخ انتشار: {formatPersianDateString(selectedNews.publish_at)}
              </span>
            </div>

            {selectedNews.summary && (
              <p className="text-sm font-semibold text-cyan-100 leading-relaxed bg-slate-800/70 p-4 rounded-xl border border-cyan-500/20">
                {selectedNews.summary}
              </p>
            )}

            <div className="text-sm text-slate-300 leading-relaxed space-y-3 whitespace-pre-line text-justify">
              {selectedNews.body}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <Button size="sm" onClick={() => setSelectedNews(null)}>
                بستن پنجره
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
