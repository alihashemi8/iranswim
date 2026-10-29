import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, ArrowLeft, PhoneCall,
  CheckCircle2, Clock, MapPin, Check,
  Sparkles, Droplet, ArrowDown, Waves, Users2
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

// Verified real database records for coaches and news
// Verified real database records for coaches and news in Qazvin
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
                <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-slate-900/80 border border-cyan-400/40 rounded-full text-xs sm:text-sm font-bold text-cyan-200 shadow-md">
                  <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>مدرسه شنای ایران • استان قزوین</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1" />
                  <span className="text-[11px] sm:text-xs text-emerald-300 font-semibold">پذیرش ترم جدید</span>
                </div>

                {/* Main Headline */}
                <div className="space-y-4">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.18] text-white">
                    آموزش اصولی شنا در قزوین؛
                    <br />
                    <span className="text-cyan-300 font-black">
                      از مبتدی تا پیشرفته
                    </span>
                  </h1>
                  <p className="text-base sm:text-xl font-bold text-sky-100 leading-snug">
                    دوره‌های آموزش شنا ویژه کودکان، نوجوانان و بزرگسالان زیر نظر مربیان رسمی فدراسیون شنا
                  </p>
                </div>

                {/* Editorial Description */}
                <p className="text-sm sm:text-base lg:text-lg text-slate-100/90 leading-relaxed font-normal max-w-2xl text-justify">
                  اگر به دنبال یادگیری اصولی شنا، رفع ترس از آب در کودکان یا آموزش چهار شنا (کرال سینه، کرال پشت، قورباغه و پروانه) هستید؛ کلاس‌های ما در استخرهای منتخب قزوین در محیطی بهداشتی، خلوت و با برنامه‌ریزی منظم برگزار می‌شود.
                </p>

                {/* Primary Conversion & Navigation Buttons */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-3">
                  {user ? (
                    <Link
                      to={getDashboardDestination()}
                      className="px-6 sm:px-7 py-3.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black rounded-2xl shadow-lg transition-all text-sm sm:text-base inline-flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span>ورود به پنل کاربری</span>
                      <ArrowLeft className="w-5 h-5" />
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      className="px-6 sm:px-7 py-3.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black rounded-2xl shadow-lg transition-all text-sm sm:text-base inline-flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span>مشاهده و ثبت‌نام در کلاس‌ها</span>
                      <ArrowLeft className="w-5 h-5" />
                    </Link>
                  )}

                  <a
                    href="#courses"
                    className="px-5 sm:px-6 py-3.5 bg-slate-900/80 hover:bg-slate-800 text-white font-bold rounded-2xl border-2 border-cyan-400/40 hover:border-cyan-300 transition-all text-sm sm:text-base inline-flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>لیست دوره‌ها و شهریه</span>
                  </a>

                  <a
                    href="#coaches"
                    className="px-4 sm:px-5 py-3.5 bg-slate-900/60 hover:bg-slate-800/80 text-cyan-200 hover:text-white font-bold rounded-2xl border border-cyan-500/30 transition-all text-sm sm:text-base inline-flex items-center gap-1.5"
                  >
                    <Users2 className="w-4 h-4 text-teal-400" />
                    <span>کادر مربیان قزوین</span>
                  </a>
                </div>

                {/* Key Metric Features */}
                <div className="pt-6 border-t border-cyan-500/30 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-3.5 rounded-2xl bg-slate-900/75 border border-cyan-400/25 space-y-1">
                    <div className="flex items-center gap-1.5 text-cyan-300 text-xs sm:text-sm font-bold">
                      <OlympicPoolLaneIcon className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>آموزش ۴ شنا</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-200">کرال سینه، پشت، قورباغه و پروانه</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/75 border border-cyan-400/25 space-y-1">
                    <div className="flex items-center gap-1.5 text-cyan-300 text-xs sm:text-sm font-bold">
                      <RescueBuoyRingIcon className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>مربیان رسمی</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-200">دارای کارت مربیگری و نجات‌غریق</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/75 border border-cyan-400/25 space-y-1">
                    <div className="flex items-center gap-1.5 text-cyan-300 text-xs sm:text-sm font-bold">
                      <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>کودکان و بزرگسالان</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-200">از ۵ سال تا رده‌های بزرگسال</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/75 border border-cyan-400/25 space-y-1">
                    <div className="flex items-center gap-1.5 text-cyan-300 text-xs sm:text-sm font-bold">
                      <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>استخرهای قزوین</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-200">محیط تمیز، بهداشتی و ایمن</p>
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
        <section id="about" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 min-w-0">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="info">ویژگی‌های کلاس‌های ما</Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              چرا مدرسه شنای ایران در قزوین؟
            </h2>
            <p className="text-xs sm:text-sm text-cyan-200/90 leading-relaxed">
              آموزش شنا با صبر و حوصله، متناسب با روحیات نوآموزان و با بالاترین استانداردهای ایمنی
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
                  کودکان و نوجوانان
                </span>
                <h3 className="font-bold text-lg text-white group-hover:text-cyan-300 transition-colors">
                  آموزش بدون ترس و روان‌شناختی
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed text-justify">
                  شروع از بازی‌های شاداب در آب کم‌عمق تا کودک احساس امنیت کامل کند و با انگیزه و علاقه واقعی مراحل یادگیری شنا را پشت سر بگذارد.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-cyan-500/15 flex items-center justify-between text-xs font-semibold text-teal-300">
                <span>محیط شاداب و امن برای کودک</span>
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
                  اصلاح ساختار قامت و تنفس
                </span>
                <h3 className="font-bold text-lg text-white group-hover:text-purple-300 transition-colors">
                  تقویت ستون فقرات و سلامت جسمانی
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed text-justify">
                  شنا بهترین ورزش برای جلوگیری از افتادگی شانه و گودی کمر در کودکان محصل است و در بزرگسالان به بهبود تنفس و کاهش دردهای عضلانی کمک می‌کند.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-purple-500/15 flex items-center justify-between text-xs font-semibold text-purple-300">
                <span>بهبود استقامت و سلامت بدنی</span>
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
                  نظارت و ایمنی کامل
                </span>
                <h3 className="font-bold text-lg text-white group-hover:text-teal-300 transition-colors">
                  مربیان رسمی و کلاس‌های کم‌جمعیت
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed text-justify">
                  آموزش توسط مربیان دارای کارت رسمی فدراسیون در گروه‌های خلوت و با حضور پیوسته نجات‌غریق برگزار می‌شود تا پیشرفت هر شناگر به طور اختصاصی پایش شود.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-teal-500/15 flex items-center justify-between text-xs font-semibold text-teal-300">
                <span>توجه اختصاصی به تک‌تک شناگران</span>
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
        <section id="facilities" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 min-w-0">
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <Badge variant="info">محیط استخر و بهداشت آب</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              امکانات و شرایط بهداشتی استخرها در قزوین
            </h2>
            <p className="text-xs sm:text-sm text-cyan-200/80 leading-relaxed">
              برگزاری کلاس‌ها در استخرهای تمیز و استاندارد شهر قزوین با آب گرم، تصفیه بهداشتی و وسایل کمک‌آموزشی
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
            <div className="bg-slate-900/80 p-6 card-hydrofoil-alt border-2 border-amber-500/20 hover:border-amber-400/60 transition-all duration-300 flex flex-col justify-between">
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
            <div className="bg-slate-900/80 p-6 card-hydrofoil border-2 border-orange-500/20 hover:border-orange-400/60 transition-all duration-300 flex flex-col justify-between">
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
            <div className="bg-slate-900/80 p-6 card-hydrofoil-alt border-2 border-indigo-500/20 hover:border-indigo-400/60 transition-all duration-300 flex flex-col justify-between">
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
                  className="px-7 sm:px-9 py-4 bg-slate-900/90 hover:bg-slate-800 text-white font-bold rounded-2xl border-2 border-cyan-400/40 hover:border-cyan-300 transition-all text-base sm:text-lg inline-flex items-center gap-2.5 shadow-md"
                >
                  <PhoneCall className="w-5 h-5 text-cyan-400" />
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
