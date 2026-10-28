import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, ArrowLeft, PhoneCall,
  CheckCircle2, Clock, MapPin, Check,
  Sparkles, Droplet, ArrowDown, Waves
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

const RubberDuckExperience = lazy(() => import('../../components/landing/RubberDuckExperience').then((module) => ({ default: module.RubberDuckExperience })));

// Verified real database records for coaches and news
const INITIAL_COACHES = [
  {
    id: 1,
    full_name: 'محمد رضایی',
    specialties: 'کرال سینه، شنای پروانه، نجات غریق درجه ۱',
    bio: 'مربی رسمی فدراسیون شنا با ۱۰ سال سابقه آموزش تیم‌های پایه',
    icon: SwimmerCrawlIcon,
  },
  {
    id: 4,
    full_name: 'نیما سعادتی',
    specialties: 'شنای قورباغه، استارت و برگشت‌های سرعتی المپیک',
    bio: 'عضو اسبق تیم ملی شنا و مربی تخصصی اصلاح تکنیک و استقامت بدنی شناگران نخبه',
    icon: PoolStartingBlockIcon,
  },
  {
    id: 2,
    full_name: 'علیرضا مرادی (مربی)',
    specialties: 'کرال سینه، شنای پروانه، نجات غریق بین‌المللی',
    bio: 'مربی رسمی فدراسیون شنا با ۱۲ سال سابقه تدریس و قهرمانی رده‌های پایه کشور',
    icon: RescueBuoyRingIcon,
  },
  {
    id: 3,
    full_name: 'سارا کاظمی',
    specialties: 'شنای موزون (سینکرونایز)، آب‌درمانی و کرال پشت',
    bio: 'مدرس رسمی فدراسیون و کارشناس ارشد فیزیولوژی ورزش با سابقه ۱۰ سال هدایت تیم‌های استانی',
    icon: SynchroSwimIcon,
  },
  {
    id: 5,
    full_name: 'مهدی یزدانی',
    specialties: 'استعدادیابی نونهالان و آموزش آب‌بازی و مبتدی',
    bio: 'مربی باحوصله و مجرب در حوزه آموزش اصولی شنا از پایه برای رده‌های سنی ۵ تا ۱۲ سال',
    icon: WaterMedalTrophyIcon,
  },
];

const INITIAL_NEWS = [
  {
    id: 2,
    title: 'برگزاری مسابقات استانی شنای سرعت «جام آزادی ۱۴۰۵»',
    category: 'COMPETITIONS',
    category_display: 'مسابقات و رویدادها',
    summary: 'رقابت‌های استانی شنا با حضور بیش از ۳۰۰ شناگر برتر و اهدای مدال‌های قهرمانی به میزبانی آموزشگاه شنای ایران برگزار شد.',
    body: 'مسابقات استانی شنای سرعت با حضور تیم‌های منتخب از سراسر استان با شور و هیجان بی‌نظیر برگزار شد. شناگران آکادمی موفق به کسب مقام اول تیمی شدند.',
    publish_at: '2026-10-25T16:35:12.990003+00:00',
  },
  {
    id: 1,
    title: 'آغاز دوره‌های تخصصی شنای پاییز ۱۴۰۵ در آکادمی ایران سوییم',
    category: 'CLASSES',
    category_display: 'دوره‌ها و کلاس‌ها',
    summary: 'ثبت‌نام دوره‌های پاییز ۱۴۰۵ با حضور مربیان مجرب فدراسیون آغاز شد.',
    body: 'با افتخار به اطلاع اعضای محترم می‌رساند ثبت‌نام دوره‌های تخصصی شنا از امروز آغاز گردید...',
    publish_at: '2026-10-25T12:49:27.601522+00:00',
  },
  {
    id: 3,
    title: 'افتتاح پیشرفته‌ترین سیستم تصفیه آب اوزون و تصفیه بدون کلر',
    category: 'HEALTH',
    category_display: 'آموزش و بهداشت استخر',
    summary: 'به جهت حفظ سلامت پوست، چشم و ریه شناگران، موتورخانه و تصفیه‌خانه مرکزی آکادمی به تکنولوژی روز اوزوناسیون مجهز شد.',
    body: 'این سیستم نوین با از بین بردن ۹۹.۹ درصد باکتری‌ها و کاهش بوی تند کلر، تجربه‌ای دلنشین و استاندارد برای ورزشکاران حرفه‌ای و کودکان فراهم می‌آورد.',
    publish_at: '2026-10-22T16:35:12.997702+00:00',
  },
  {
    id: 4,
    title: 'آغاز پیش‌ثبت‌نام دوره‌های تخصصی شنای زمستانه با تخفیف ویژه',
    category: 'CLASSES',
    category_display: 'دوره‌ها و کلاس‌ها',
    summary: 'ثبت‌نام ترم جدید آموزش چهار شنا، واترپلو و نجات‌غریق برای تمامی رده‌های سنی آغاز شد.',
    body: 'علاقه‌مندان می‌توانند با مراجعه به سایت و مشاهده جدول زمان‌بندی گروه‌ها، اقدام به ثبت‌نام در ساعات دلخواه نمایند.',
    publish_at: '2026-10-19T16:35:13.005472+00:00',
  },
  {
    id: 5,
    title: 'کارگاه تغذیه ورزشی، ریکاوری و تنفس عمیق ویژه ورزشکاران شنا',
    category: 'GENERAL',
    category_display: 'عمومی و اطلاعیه‌ها',
    summary: 'سمینار کاربردی با حضور متخصصین تغذیه فدراسیون پزشکی ورزشی روز پنج‌شنبه در سالن همایش آکادمی برگزار می‌شود.',
    body: 'در این دوره به مباحث برنامه غذایی در روزهای مسابقه، جبران الکترولیت‌ها و تکنیک‌های افزایش حجم ریه پرداخته خواهد شد.',
    publish_at: '2026-10-16T16:35:13.011508+00:00',
  },
  {
    id: 6,
    title: 'درخشش شناگران آموزشگاه شنای ایران در لیگ برتر باشگاه‌های کشور',
    category: 'COMPETITIONS',
    category_display: 'مسابقات و رویدادها',
    summary: 'تیم شنای نوجوانان آکادمی با شکستن دو رکورد ملی موفق به کسب کاپ اخلاق و جایگاه نخست ماده ۲۰۰ متر امدادی شدند.',
    body: 'این موفقیت ارزشمند حاصل برنامه‌ریزی علمی، تمرینات منظم هفتگی و پایش مداوم شاخص‌های آمادگی جسمانی توسط مربیان مجرب است.',
    publish_at: '2026-10-13T16:35:13.018034+00:00',
  },
];

export const HomePage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coaches, setCoaches] = useState(INITIAL_COACHES);
  const [news, setNews] = useState(INITIAL_NEWS);
  const [selectedNews, setSelectedNews] = useState(null);

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
          if (Array.isArray(courseData)) setCourses(courseData);
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
      <AquaticPoolBackground scrolling />

      {/* 3D Realistic Rubber Duck Experience (R3F/Three.js + Scroll Journey) */}
      <Suspense fallback={null}>
        <RubberDuckExperience />
      </Suspense>

      {/* Main Content Layers */}
      <div className="relative z-20 space-y-20 sm:space-y-28 lg:space-y-36 pb-20 pt-4">
        
        {/* =========================================================================
            SECTION 1: CINEMATIC AQUATIC HERO & WATER ENTRY ARENA
            ========================================================================= */}
        <section className="landing-hero relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 lg:pt-18 min-w-0">
          <div className="landing-hero__panel relative rounded-3xl sm:rounded-4xl p-6 sm:p-12 lg:p-16 border border-cyan-500/20 bg-radial-[circle_at_top_right,rgba(8,59,92,0.85)_0%,rgba(3,17,30,0.92)_100%] shadow-[0_25px_60px_-15px_rgba(2,12,22,0.8)] backdrop-blur-md overflow-hidden">
            
            {/* Ambient Water Lights */}
            <div className="absolute -top-32 right-1/4 w-96 h-96 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 left-10 w-96 h-96 rounded-full bg-[#16b8b0]/20 blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
              {/* Text & Primary Actions */}
              <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-right">
                
                {/* Floating Aquatic Pill */}
                <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-cyan-950/70 border border-cyan-400/30 rounded-full text-xs font-semibold text-cyan-200 shadow-inner">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  <span className="truncate">آکادمی بین‌المللی و مرکز تخصصی استعدادیابی شنا</span>
                  <Droplet className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                </div>

                {/* Main Headline */}
                <div className="space-y-3">
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.25] text-white">
                    غوطه‌وری در آب،
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-l from-cyan-400 via-teal-300 to-white">
                      از اولین شیرجه تا سکوی قهرمانی
                    </span>
                  </h1>
                  <p className="text-sm sm:text-base text-cyan-200/80 font-medium">
                    آموزشگاه شنای ایران • تحت نظارت مربیان رسمی فدراسیون با استخر ۵۰ متری المپیک
                  </p>
                </div>

                {/* Editorial Description */}
                <p className="text-xs sm:text-base text-slate-200/90 leading-relaxed font-normal max-w-2xl text-justify">
                  شنا مهارتی فراتر از یک ورزش معمولی است؛ پیوندی میان آرامش، سلامت قلبی-تنفسی و نجات‌زندگی.
                  در استخرهای مجهز آکادمی شنای ایران، با بهره‌گیری از سامانه تصفیه اوزون بدون کلر سوزاننده،
                  فضایی ایمن و شاداب برای تمامی رده‌های سنی از نونهالان تا قهرمانان بزرگسال فراهم کرده‌ایم.
                </p>

                {/* Primary Conversion & Navigation Buttons */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
                  {user ? (
                    <Link
                      to={getDashboardDestination()}
                      className="px-6 py-3.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-bold rounded-2xl shadow-[0_10px_25px_-5px_rgba(20,184,166,0.5)] transition-all text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer active:scale-95 border border-cyan-300/30"
                    >
                      <span>ورود به پیشخوان کاربری</span>
                      <ArrowLeft className="w-4 h-4" />
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      className="px-6 py-3.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-bold rounded-2xl shadow-[0_10px_25px_-5px_rgba(20,184,166,0.5)] transition-all text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer active:scale-95 border border-cyan-300/30"
                    >
                      <span>ورود و ثبت‌نام در سامانه</span>
                      <ArrowLeft className="w-4 h-4" />
                    </Link>
                  )}

                  <a
                    href="#courses"
                    className="px-5 sm:px-6 py-3.5 bg-slate-800/80 hover:bg-slate-700/80 text-cyan-100 font-medium rounded-2xl border border-cyan-500/25 backdrop-blur-sm transition-all text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>مشاهده دوره‌ها</span>
                  </a>

                  <a
                    href="#coaches"
                    className="px-4 py-3.5 text-xs sm:text-sm text-cyan-300/90 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <span>آشنایی با مربیان</span>
                    <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
                  </a>
                </div>

                {/* Key Metric Features */}
                <div className="pt-6 border-t border-cyan-500/20 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-cyan-500/20 space-y-1">
                    <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-bold">
                      <OlympicPoolLaneIcon className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>۵۰ متری المپیک</span>
                    </div>
                    <p className="text-[11px] text-slate-300/80">استاندارد بین‌المللی FINA</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-cyan-500/20 space-y-1">
                    <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-bold">
                      <RescueBuoyRingIcon className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>کارت فدراسیون</span>
                    </div>
                    <p className="text-[11px] text-slate-300/80">مربیان رسمی درجه ۱ و ۲</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-cyan-500/20 space-y-1">
                    <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-bold">
                      <OzonePurificationIcon className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>تصفیه با گاز اوزون</span>
                    </div>
                    <p className="text-[11px] text-slate-300/80">بدون کلر سنگین و سوزش</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-cyan-500/20 space-y-1">
                    <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-bold">
                      <OlympicStopwatchIcon className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>پایش رکوردها</span>
                    </div>
                    <p className="text-[11px] text-slate-300/80">تحلیل زمانی و بیومکانیک</p>
                  </div>
                </div>

              </div>

              {/* Hydrofoil Visual Showcase Card */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-teal-500/30 to-cyan-500/30 blur-xl opacity-60" />
                  
                  <div className="relative card-hydrofoil overflow-hidden border-2 border-cyan-400/30 shadow-2xl bg-slate-950 aspect-4/3 sm:aspect-5/4">
                    <img
                      src="/images/olympic-pool-aerial.webp"
                      alt="نمای هوایی استخر المپیک با لاین‌های مسابقاتی"
                      className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700 relative z-10"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent pointer-events-none z-15" />

                    <div className="absolute top-4 right-4 z-20 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-cyan-400/30 text-cyan-200 flex items-center gap-2 shadow-md">
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />
                      <span className="text-xs font-bold">تأییدیه رسمی فدراسیون</span>
                    </div>

                    <div className="absolute top-4 left-4 z-20 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/50 backdrop-blur-md text-[11px] text-cyan-300 border border-cyan-500/20 font-mono">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      <span>دمای آب: ۲۸° C</span>
                    </div>

                    <div className="absolute bottom-4 inset-x-4 z-20 p-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-cyan-400/20 text-white flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold block text-cyan-100">مجموعه استخرهای بین‌المللی آزادی</span>
                        <span className="text-[10px] text-cyan-300/80">سالن مسابقاتی ۵۰ متری، آب‌درمانی و سونا</span>
                      </div>
                      <span className="px-3 py-1 bg-teal-500 text-slate-950 font-extrabold text-[10px] rounded-lg shadow-sm">
                        FINA Standard
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 2: HEALTH, REHABILITATION & CORE BENEFITS (Water Scooped Indents)
            ========================================================================= */}
        <section id="about" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 min-w-0">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="info">فلسفه و مزایای فیزیولوژیک</Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              چرا یادگیری اصولی شنا در آکادمی ما؟
            </h2>
            <p className="text-xs sm:text-sm text-cyan-200/80 leading-relaxed">
              آب محیطی بی‌بدیل است که در آن وزن بدن کاهش یافته و عضلات بدون فشار ضربه‌ای تقویت می‌شوند.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-8 pt-4">
            {/* Benefit Card 1 */}
            <div className="group relative bg-slate-900/85 backdrop-blur-md card-hydrofoil pt-12 pb-7 px-7 border-2 border-cyan-500/20 hover:border-cyan-400/60 shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 flex flex-col justify-between">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-900 to-teal-800 text-cyan-300 flex items-center justify-center border border-cyan-400/30 mb-5 shadow-sm group-hover:scale-110 transition-transform">
                <CardioAquaticIcon className="w-7 h-7" />
              </div>
              <div className="space-y-3">
                <span className="inline-block px-3 py-1 rounded-lg bg-cyan-950 text-cyan-300 text-[11px] font-bold border border-cyan-500/25">
                  تقویت زنجیره هوازی و تنفس
                </span>
                <h3 className="font-bold text-lg text-white group-hover:text-cyan-300 transition-colors">
                  سلامت قلبی، تنفسی و آرامش ذهن
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed text-justify">
                  افزایش ظرفیت حیاتی ریه‌ها، تنظیم ریتم منظم تنفس و کاهش استرس‌های عصبی ناشی از فشار کاری روزمره به یمن شناوری مطبوع در آب.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-cyan-500/15 flex items-center justify-between text-xs font-semibold text-teal-300">
                <span>بهبود راندمان قلب و عروق</span>
                <Check className="w-4 h-4" />
              </div>
            </div>

            {/* Benefit Card 2 */}
            <div className="group relative bg-slate-900/85 backdrop-blur-md card-hydrofoil-alt pt-12 pb-7 px-7 border-2 border-purple-500/20 hover:border-purple-400/60 shadow-lg hover:shadow-purple-500/10 transition-all duration-300 flex flex-col justify-between">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-950 to-indigo-900 text-purple-300 flex items-center justify-center border border-purple-400/30 mb-5 shadow-sm group-hover:scale-110 transition-transform">
                <HydroTherapySpineIcon className="w-7 h-7" />
              </div>
              <div className="space-y-3">
                <span className="inline-block px-3 py-1 rounded-lg bg-purple-950 text-purple-300 text-[11px] font-bold border border-purple-500/25">
                  حرکات اصلاحی هیدروتراپی
                </span>
                <h3 className="font-bold text-lg text-white group-hover:text-purple-300 transition-colors">
                  اصلاح ناهنجاری‌های اسکلتی و ستون فقرات
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed text-justify">
                  رفع گودی کمر، ناهنجاری افتادگی شانه و تسکین دردهای عضلانی با بهره‌گیری از تکنیک‌های تخصصی آب‌درمانی و کرال پشت اصلاحی.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-purple-500/15 flex items-center justify-between text-xs font-semibold text-purple-300">
                <span>تسکین فشارهای دیسک کمر</span>
                <Check className="w-4 h-4" />
              </div>
            </div>

            {/* Benefit Card 3 */}
            <div className="group relative bg-slate-900/85 backdrop-blur-md card-hydrofoil pt-12 pb-7 px-7 border-2 border-teal-500/20 hover:border-teal-400/60 shadow-lg hover:shadow-teal-500/10 transition-all duration-300 flex flex-col justify-between">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-950 to-cyan-900 text-teal-300 flex items-center justify-center border border-teal-400/30 mb-5 shadow-sm group-hover:scale-110 transition-transform">
                <RescueBuoyRingIcon className="w-7 h-7" />
              </div>
              <div className="space-y-3">
                <span className="inline-block px-3 py-1 rounded-lg bg-teal-950 text-teal-300 text-[11px] font-bold border border-teal-500/25">
                  استاندارد جهانی فدراسیون
                </span>
                <h3 className="font-bold text-lg text-white group-hover:text-teal-300 transition-colors">
                  متد آموزشی FINA و ایمنی کامل
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed text-justify">
                  آموزش مهندسی‌شده چهار شنا، استارت و چرخش‌ها با حضور پیوسته غریق‌نجات‌های دارای گواهی درجه یک کشوری در محیطی کاملاً تحت کنترل.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-teal-500/15 flex items-center justify-between text-xs font-semibold text-teal-300">
                <span>نظارت مستمر منجیان غریق</span>
                <Check className="w-4 h-4" />
              </div>
            </div>
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
              <p className="text-xs sm:text-sm">کلاس‌های ثبت‌شده در سامانه، همراه با سطح، زمان‌بندی و ظرفیت گروه‌ها</p>
            </div>
            <span className="text-xs font-medium px-3.5 py-1.5 rounded-xl shrink-0">{courses.length} دوره</span>
          </div>

          {coursesLoading ? (
            <LoadingState type="cards" count={3} message="در حال دریافت دوره‌های آموزشی..." />
          ) : courses.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {courses.map((course, index) => (
                <article key={course.id} className={`landing-course landing-course--${index % 3}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="landing-course__eyebrow">{course.status === 'ACTIVE' ? 'ثبت‌نام فعال' : 'پیش‌ثبت‌نام'}</span>
                      <h3 className="mt-2 text-lg font-bold">{course.name}</h3>
                    </div>
                    <Waves className="w-6 h-6 shrink-0" aria-hidden="true" />
                  </div>
                  {course.description && <p className="mt-3 text-sm leading-7">{course.description}</p>}
                  <div className="landing-course__meta mt-5">
                    <span>{course.sessions_count} جلسه</span>
                    <span>{Number(course.base_price || 0).toLocaleString('fa-IR')} تومان</span>
                  </div>
                  {Array.isArray(course.groups) && course.groups.length > 0 && (
                    <ul className="landing-course__groups mt-4 space-y-2">
                      {course.groups.slice(0, 2).map((group) => (
                        <li key={group.id} className="flex items-center justify-between gap-2 text-xs">
                          <span>{group.name} · {group.pool_location}</span>
                          <span>{group.remaining_capacity > 0 ? `${group.remaining_capacity} ظرفیت` : 'تکمیل'}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link to="/login" className="landing-course__link mt-5 inline-flex items-center gap-2">
                    مشاهده و پیگیری ثبت‌نام <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <p className="landing-empty-state">در حال حاضر دوره‌ای برای نمایش ثبت نشده است. برای اطلاع از ثبت‌نام با پذیرش تماس بگیرید.</p>
          )}
        </section>

        {/* =========================================================================
            SECTION 4: CERTIFIED FEDERATION COACHES
            ========================================================================= */}
        <section id="coaches" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-cyan-500/20 pb-5">
            <div className="space-y-1.5">
              <Badge variant="success">کادر مربیگری برگزیده</Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                مربیان رسمی و قهرمانان آکادمی شنای ایران
              </h2>
              <p className="text-xs sm:text-sm text-cyan-200/80">
                دارای مدارک مربیگری رسمی فدراسیون شنا، شیرجه و واترپلو جمهوری اسلامی ایران
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
        <section id="facilities" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 min-w-0">
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <Badge variant="info">استانداردهای بهداشتی و مهندسی استخر</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              امکانات و تجهیزات پیشرفته استخرهای آکادمی
            </h2>
            <p className="text-xs sm:text-sm text-cyan-200/80 leading-relaxed">
              تصفیه‌خانه اوزوناسیون، استخر مسابقاتی ۵۰ متری، حوضچه آب سرد و سالن تخصصی خشکی
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-slate-900/80 p-6 card-hydrofoil border-2 border-teal-500/20 hover:border-teal-400/60 transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-teal-950 text-teal-300 flex items-center justify-center border border-teal-500/30">
                    <OzonePurificationIcon className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold text-teal-300 bg-teal-950 rounded-lg border border-teal-500/30">
                    بدون کلر سنگین
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-base text-white">تصفیه گاز اوزون</h4>
                  <p className="text-xs text-slate-300 leading-relaxed text-justify">
                    گندزدایی مدرن بر پایه گاز اوزون؛ بدون ایجاد سوزش چشم، خشکی پوست و حساسیت‌های ریوی در کودکان.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-teal-500/20 text-[11px] font-bold text-teal-400 flex items-center justify-between">
                <span>تضمین سلامت پوست و ریه</span>
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900/80 p-6 card-hydrofoil-alt border-2 border-amber-500/20 hover:border-amber-400/60 transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-amber-950 text-amber-300 flex items-center justify-center border border-amber-500/30">
                    <OlympicPoolLaneIcon className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold text-amber-300 bg-amber-950 rounded-lg border border-amber-500/30">
                    ۸ لاین مسابقاتی
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-base text-white">استخر ۵۰ متری المپیک</h4>
                  <p className="text-xs text-slate-300 leading-relaxed text-justify">
                    ابعاد ۵۰ × ۲۵ متر استاندارد جهانی با عمق یکنواخت مسابقاتی و خطوط موج‌گیر ضدتلاطم فدراسیونی.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-amber-500/20 text-[11px] font-bold text-amber-400 flex items-center justify-between">
                <span>استاندارد جهانی FINA</span>
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900/80 p-6 card-hydrofoil border-2 border-orange-500/20 hover:border-orange-400/60 transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-orange-950 text-orange-300 flex items-center justify-center border border-orange-500/30">
                    <SaunaThermalSpaIcon className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold text-orange-300 bg-orange-950 rounded-lg border border-orange-500/30">
                    ریکاوری و آب‌درمانی
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-base text-white">جکوزی و سونای خشک</h4>
                  <p className="text-xs text-slate-300 leading-relaxed text-justify">
                    حوضچه آب سرد استاندارد، سونای خشک فنلاندی، بخار اکالیپتوس و جت‌های ماساژ جهت تسکین اسید لاکتیک عضلات.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-orange-500/20 text-[11px] font-bold text-orange-400 flex items-center justify-between">
                <span>ریکاوری عضلانی فوری</span>
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-900/80 p-6 card-hydrofoil-alt border-2 border-indigo-500/20 hover:border-indigo-400/60 transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-indigo-950 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
                    <DryLandSwimGymIcon className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold text-indigo-300 bg-indigo-950 rounded-lg border border-indigo-500/30">
                    تمرینات کششی خشکی
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-base text-white">سالن بدنسازی تخصصی</h4>
                  <p className="text-xs text-slate-300 leading-relaxed text-justify">
                    کش‌های ایزوکینتیک و سیم‌کش‌های شبیه‌ساز استارت و پول‌داون دست‌ها برای ارتقای توان عضلانی در آب.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-indigo-500/20 text-[11px] font-bold text-indigo-400 flex items-center justify-between">
                <span>افزایش شتاب شناگر</span>
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
              <Badge variant="warning">تازه ترین رویدادها</Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                اخبار، مقالات آموزشی و رویدادهای آکادمی
              </h2>
              <p className="text-xs sm:text-sm text-cyan-200/80">
                گزارش مسابقات، ارتقای رکوردها و تازه‌ترین اطلاعیه‌های رسمی آکادمی شنای ایران
              </p>
            </div>
          </div>

          <Carousel
            items={news}
            className="landing-carousel"
            ariaLabel="اسلایدر اخبار و رویدادهای آکادمی"
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
                          <span>{item.category_display || 'اطلاعیه آکادمی'}</span>
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
          <div className="relative overflow-hidden bg-radial-[circle_at_center,rgba(8,59,92,0.95)_0%,rgba(3,17,30,0.98)_100%] rounded-3xl lg:rounded-4xl p-8 sm:p-14 lg:p-16 border-2 border-cyan-400/30 shadow-[0_25px_60px_-15px_rgba(2,12,22,0.9)] text-center space-y-6">
            
            <div className="absolute top-0 right-1/3 w-80 h-80 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-teal-400/15 blur-3xl pointer-events-none" />

            <div className="relative max-w-2xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/80 rounded-full text-xs font-semibold text-cyan-200 border border-cyan-400/30">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>پذیرش شناگر در تمامی رده‌های سنی و سطوح مهارتی</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                آماده‌اید شنا را اصولی و استاندارد بیاموزید؟
              </h2>

              <p className="text-xs sm:text-sm text-cyan-200/90 leading-relaxed font-light">
                از آموزش‌های پایه‌ای و استعدادیابی نونهالان تا شرکت در لیگ‌های مسابقاتی و رکوردهای کشوری،
                مربیان رسمی آکادمی شنای ایران در تمامی گام‌ها همراه شما هستند.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-3">
                <Link
                  to="/login"
                  className="px-8 py-3.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-bold rounded-2xl shadow-lg transition-all text-sm inline-flex items-center gap-2 cursor-pointer active:scale-95 border border-cyan-300/30"
                >
                  <span>ورود به پرتال و ثبت‌نام در سامانه</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>

                <a
                  href="tel:02188888888"
                  className="px-6 py-3.5 bg-slate-900/80 hover:bg-slate-800 text-cyan-200 font-semibold rounded-2xl border border-cyan-500/30 backdrop-blur-sm transition-all text-sm inline-flex items-center gap-2 cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4 text-teal-400" />
                  <span>تماس با پذیرش: ۰۲۱-۸۸۸۸۸۸۸۸</span>
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
                  <span>آموزشگاه شنای ایران</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed text-justify">
                  سامانه جامع و یکپارچه مدیریت آموزشی، رکوردهای زمانی، ارزیابی مستمر مهارت‌ها و پایش استانداردهای ایمنی استخرهای شنای کشور.
                </p>
                <div className="pt-2 flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30 w-fit">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>عضو رسمی فدراسیون شنای جمهوری اسلامی ایران</span>
                </div>
              </div>

              {/* Quick Links */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-white">بخش‌های آکادمی</h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li>
                    <a href="#about" className="hover:text-cyan-300 transition-colors">
                      اصول و فلسفه آموزشگاه
                    </a>
                  </li>
                  <li>
                    <a href="#coaches" className="hover:text-cyan-300 transition-colors">
                      کادر مربیان رسمی فدراسیون
                    </a>
                  </li>
                  <li>
                    <a href="#facilities" className="hover:text-cyan-300 transition-colors">
                      امکانات استخر ۵۰ متری و سونا
                    </a>
                  </li>
                  <li>
                    <a href="#news" className="hover:text-cyan-300 transition-colors">
                      تازه‌ترین اخبار و اطلاعیه‌ها
                    </a>
                  </li>
                </ul>
              </div>

              {/* Portal Access */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-white">دسترسی سریع به پرتال‌ها</h4>
                <ul className="space-y-2 text-xs text-cyan-300">
                  <li>
                    <Link to="/login" className="hover:underline flex items-center gap-1.5">
                      <span>ورود شناگران و اعضا</span>
                      <ArrowLeft className="w-3 h-3" />
                    </Link>
                  </li>
                  <li>
                    <Link to="/login" className="hover:underline flex items-center gap-1.5">
                      <span>ورود مربیان کادر فنی</span>
                      <ArrowLeft className="w-3 h-3" />
                    </Link>
                  </li>
                  <li>
                    <Link to="/login" className="hover:underline flex items-center gap-1.5">
                      <span>ورود مدیریت آموزشگاه</span>
                      <ArrowLeft className="w-3 h-3" />
                    </Link>
                  </li>
                  <li>
                    <Link to="/login" className="hover:underline flex items-center gap-1.5">
                      <span>ورود ناظر فنی سامانه</span>
                      <ArrowLeft className="w-3 h-3" />
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-white">آدرس و پذیرش</h4>
                <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span>تهران، مجموعه ورزشی استخر بین‌المللی آزادی، سالن شماره ۲</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>تلفن هماهنگی: ۰۲۱-۸۸۸۸۸۸۸۸</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>ساعات کاری: همه‌روزه از ساعت ۰۶:۰۰ الی ۲۲:۰۰</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <p>
                کلیه حقوق مادی و معنوی متعلق به سامانه جامع آموزشگاه شنای ایران می‌باشد © ۱۴۰۵
              </p>
              <div className="flex items-center gap-2 text-[11px] text-cyan-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>سامانه آنلاین و کلیه خدمات استخر فعال است</span>
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
