import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Waves, Sparkles, Users2, Award, ArrowLeft,
  Clock, MapPin, CheckCircle2, ShieldCheck, ChevronRight
} from 'lucide-react';
import api from '../../api/client';
import { SEOHead } from '../../components/common/SEOHead';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { PublicFooter } from '../../components/layout/PublicFooter';

const VERIFIED_COURSES = [
  {
    id: 1,
    name: 'دوره جامع آموزش کرال سینه و استقامت پاییز ۱۴۰۵',
    status: 'ACTIVE',
    sessions_count: 12,
    base_price: 2400000,
    installments_count: 3,
    age_range: 'نوجوانان و بزرگسالان (۱۰ سال به بالا)',
    gender_display: 'پسران / آقایان',
    pool_location: 'استخر قهرمانی آزادی قزوین',
    category: 'adults',
    what_you_learn: 'اصلاح تکنیک دست و پای کرال سینه، تنفس ریتمیک دوطرفه، افزایش ظرفیت هوازی و شنای ممتد در لاین طولانی',
    remaining_capacity: 12,
    schedule_summary: 'روزهای زوج ساعت ۱۷:۰۰ الی ۱۸:۱۵'
  },
  {
    id: 2,
    name: 'دوره جامع آموزش کرال سینه و تکنیک تنفس',
    status: 'ACTIVE',
    sessions_count: 12,
    base_price: 2800000,
    installments_count: 3,
    age_range: 'نونهالان و نوجوانان (۸ تا ۱۵ سال)',
    gender_display: 'عمومی (دختران و پسران)',
    pool_location: 'استخر ۵۰ متری المپیک قزوین',
    category: 'kids',
    what_you_learn: 'آموزش زاویه اصولی دست کرال، پای منظم با تخته شنا، تنفس منظم دوطرفه و رهاسازی عضلانی در آب',
    remaining_capacity: 7,
    schedule_summary: 'روزهای یکشنبه و سه‌شنبه ساعت ۱۷:۰۰'
  },
  {
    id: 3,
    name: 'دوره تخصصی شنای پروانه و استارت قهرمانی',
    status: 'ACTIVE',
    sessions_count: 12,
    base_price: 3500000,
    installments_count: 4,
    age_range: 'نوجوانان و جوانان (۱۲ سال به بالا)',
    gender_display: 'پسران / آقایان',
    pool_location: 'استخر ۵۰ متری المپیک قزوین - لاین ۲',
    category: 'adults',
    what_you_learn: 'تکنیک تخصصی موج دلفین، پرتاب دست و تنفس تک‌ضرب پروانه، استارت جهشی از سکو و چرخش‌های سالتو',
    remaining_capacity: 3,
    schedule_summary: 'روزهای زوج ساعت ۰۸:۰۰ صبح'
  },
  {
    id: 4,
    name: 'مدرسه شنای نونهالان (آشنایی با آب و رفع ترس)',
    status: 'ACTIVE',
    sessions_count: 10,
    base_price: 2400000,
    installments_count: 2,
    age_range: 'کودکان و خردسالان (۴ تا ۹ سال)',
    gender_display: 'عمومی (دختران و پسران)',
    pool_location: 'استخر آموزشی سرپوشیده نونهالان (آب‌پری)',
    category: 'kids-beginner',
    what_you_learn: 'غلبه بر ترس از آب، اصول تنفس و غوطه‌وری، بازی‌های تعادلی و شناوری، آموزش مقدماتی پا زدن',
    remaining_capacity: 5,
    schedule_summary: 'پنج‌شنبه‌ها و جمعه‌ها ساعت ۱۰:۰۰'
  },
  {
    id: 5,
    name: 'دوره جامع استعدادیابی نخبگان نونهال',
    status: 'ACTIVE',
    sessions_count: 12,
    base_price: 2600000,
    installments_count: 3,
    age_range: 'نونهالان و نوجوانان (۶ تا ۱۲ سال)',
    gender_display: 'عمومی (دختران و پسران)',
    pool_location: 'استخر نیلگون انقلاب قزوین',
    category: 'kids',
    what_you_learn: 'آزمون‌های فیزیولوژیک درون آب، پیکرسنجی و کشش عضلانی، سنجش توان قلبی‌عروقی و ارزیابی ورود به لیگ باشگاهی',
    remaining_capacity: 10,
    schedule_summary: 'شنبه و چهارشنبه ساعت ۱۶:۰۰'
  },
  {
    id: 6,
    name: 'کلاس شنای مبتدی و آموزش از صفر',
    status: 'ACTIVE',
    sessions_count: 12,
    base_price: 2200000,
    installments_count: 3,
    age_range: 'تمام رده‌های سنی (مقدماتی)',
    gender_display: 'عمومی (سانس مجزای بانوان و آقایان)',
    pool_location: 'استخر نیلگون انقلاب قزوین',
    category: 'beginner',
    what_you_learn: 'اصول حبس نفس و دم‌وبازدم در آب، شناوری لاک‌پشتی و ستاره‌ای، سُر خوردن و پای کرال سینه مقدماتی',
    remaining_capacity: 8,
    schedule_summary: 'روزهای فرد ساعت ۱۸:۳۰'
  }
];

export const CoursesPage = ({ categoryFilter = 'ALL' }) => {
  const { categorySlug } = useParams();
  const [courses, setCourses] = useState(VERIFIED_COURSES);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(
    categoryFilter !== 'ALL'
      ? categoryFilter
      : categorySlug === 'kids-swimming'
      ? 'KIDS'
      : categorySlug === 'adults-swimming'
      ? 'ADULTS'
      : categorySlug === 'beginner-swimming'
      ? 'BEGINNER'
      : 'ALL'
  );

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const res = await api.get('/education/courses/');
        const data = res.data?.results || res.data;
        if (Array.isArray(data) && data.length > 0) {
          setCourses(data);
        }
      } catch {
        // Fallback to verified local database snapshot
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // Filter courses based on activeTab
  const filteredCourses = courses.filter((c) => {
    if (activeTab === 'ALL') return true;
    const text = `${c.name || ''} ${c.age_range || ''} ${c.what_you_learn || ''}`.toLowerCase();
    if (activeTab === 'KIDS') {
      return text.includes('کودک') || text.includes('نونهال') || text.includes('خردسال');
    }
    if (activeTab === 'ADULTS') {
      return text.includes('بزرگسال') || text.includes('جوانان') || text.includes('استقامت') || text.includes('پروانه');
    }
    if (activeTab === 'BEGINNER') {
      return text.includes('ترس') || text.includes('مبتدی') || text.includes('پایه') || text.includes('آشنایی');
    }
    return true;
  });

  // Dynamic SEO metadata based on current sub-category
  const pageMetadata = {
    ALL: {
      title: 'کلاس شنای قزوین | ثبت نام دوره‌های آموزش شنا کودکان و بزرگسالان',
      desc: 'ثبت‌نام کلاس‌های آموزش ۴ شنا در قزوین؛ آموزش کرال سینه، پشت، قورباغه و پروانه ویژه کودکان و بزرگسالان زیر نظر مربیان رسمی فدراسیون در استخرهای المپیک و نیلگون قزوین با شهریه اقساطی.',
      canonical: '/swimming-classes/',
      h1: 'کلاس‌های آموزش شنا در قزوین؛ از مبتدی تا قهرمانی'
    },
    KIDS: {
      title: 'آموزش شنا برای کودکان در قزوین | کلاس شنای نونهالان و خردسالان',
      desc: 'آموزش اصولی شنا به کودکان در قزوین در آب گرم ۳۱ درجه، رفع ترس از آب با روش‌های شاداب روان‌شناختی، مربیان باحوصله و استعدادیابی برای ورود به لیگ شنای قزوین.',
      canonical: '/courses/kids-swimming/',
      h1: 'آموزش شنا برای کودکان و نونهالان در قزوین'
    },
    ADULTS: {
      title: 'آموزش شنا برای بزرگسالان در قزوین | کلاس شنای آقایان و بانوان',
      desc: 'کلاس‌های آموزش شنا ویژه بزرگسالان در قزوین؛ اصلاح تکنیک چهار شنا، افزایش ظرفیت تنفسی و هوازی، آب‌درمانی و تقویت عضلات ستون فقرات با مربیان مجرب فدراسیون شنا.',
      canonical: '/courses/adults-swimming/',
      h1: 'آموزش شنا برای نوجوانان و بزرگسالان در قزوین'
    },
    BEGINNER: {
      title: 'کلاس شنای مبتدی در قزوین | آموزش شنا از صفر و رفع ترس از آب',
      desc: 'یادگیری اصولی شنا از پایه و صفر در قزوین بدون استرس؛ آموزش تنفس صحیح، غوطه‌وری، شناوری روی آب و پای کرال سینه در محیطی آرام و بهداشتی.',
      canonical: '/courses/beginner-swimming/',
      h1: 'کلاس شنای مبتدی در قزوین؛ آموزش شنا از صفر'
    }
  }[activeTab] || {
    title: 'کلاس شنای قزوین | آموزش شنا در قزوین',
    desc: 'کلاس‌های آموزش شنا در استخرهای منتخب قزوین با مربیان فدراسیون.',
    canonical: '/swimming-classes/',
    h1: 'کلاس‌های آموزش شنا در قزوین'
  };

  // Structured Data Schema for Courses
  const courseSchemas = filteredCourses.map((c) => ({
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': `https://iran-swim.ir/swimming-classes/#course-${c.id}`,
    'name': c.name,
    'description': c.what_you_learn || c.description || 'آموزش تکنیک‌های شنا زیر نظر مربیان فدراسیون',
    'provider': {
      '@type': 'SportsActivityLocation',
      'name': 'مدرسه شنای ایران',
      'url': 'https://iran-swim.ir'
    },
    'offers': {
      '@type': 'Offer',
      'price': c.base_price || 2400000,
      'priceCurrency': 'IRR',
      'category': 'Tuition'
    },
    'hasCourseInstance': {
      '@type': 'CourseInstance',
      'courseMode': 'OnSite',
      'location': c.pool_location || 'استخرهای منتخب قزوین'
    }
  }));

  const breadcrumbs = [
    { name: 'صفحه اصلی', url: '/' },
    { name: 'کلاس‌های شنا در قزوین', url: '/swimming-classes/' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans text-right" dir="rtl">
      <SEOHead
        title={pageMetadata.title}
        description={pageMetadata.desc}
        canonicalUrl={pageMetadata.canonical}
        keywords="کلاس شنای قزوین, آموزش شنا در قزوین, ثبت نام کلاس شنا, قیمت کلاس شنا در قزوین, آموزش شنا برای کودکان در قزوین, آموزش شنا برای بزرگسالان در قزوین, کلاس شنای مبتدی در قزوین"
        schemaData={courseSchemas}
        breadcrumbs={breadcrumbs}
      />

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-cyan-900 via-sky-950 to-slate-900 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-cyan-800/40">
        <div className="max-w-7xl mx-auto space-y-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-cyan-300">
            <Link to="/" className="hover:underline">خانه</Link>
            <ChevronRight className="w-3.5 h-3.5 rotate-180 text-cyan-400" />
            <span className="text-white font-medium">کلاس‌های شنا در قزوین</span>
          </nav>

          <div className="space-y-3 max-w-3xl">
            <Badge variant="info">ثبت‌نام ترم جدید در قزوین</Badge>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
              {pageMetadata.h1}
            </h1>
            <p className="text-sm sm:text-base text-cyan-100/90 leading-relaxed text-justify">
              مدرسه شنای ایران با بهره‌گیری از مربیان رسمی فدراسیون شنا و استخرهای استاندارد در نقاط مختلف شهر قزوین، دوره‌های تخصصی آموزش ۴ شنا (کرال سینه، کرال پشت، قورباغه و پروانه) را متناسب با سن و توانایی هر نوآموز برگزار می‌کند.
            </p>
          </div>

          {/* Quick Category Filter Pills */}
          <div className="pt-4 flex flex-wrap gap-2">
            {[
              { id: 'ALL', label: 'همه کلاس‌ها', path: '/swimming-classes/' },
              { id: 'KIDS', label: 'آموزش شنای کودکان (۴ تا ۱۲ سال)', path: '/courses/kids-swimming/' },
              { id: 'ADULTS', label: 'شنای بزرگسالان و پیشرفته', path: '/courses/adults-swimming/' },
              { id: 'BEGINNER', label: 'کلاس مبتدی و رفع ترس از آب', path: '/courses/beginner-swimming/' },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/30'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                  }`}
                >
                  <Waves className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Courses Grid Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-12">
        {loading ? (
          <LoadingState type="cards" count={6} message="در حال فراخوانی اطلاعات کلاس‌های شنا..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {filteredCourses.map((course) => {
              const price = Number(course.base_price || 0);
              return (
                <article
                  key={course.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-cyan-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-cyan-300 dark:hover:border-cyan-700 transition-all p-6 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <span className="px-3 py-1 bg-cyan-50 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 text-xs font-bold rounded-lg border border-cyan-200 dark:border-cyan-800">
                        {course.sessions_count || 12} جلسه آموزشی
                      </span>
                      {course.remaining_capacity !== undefined && (
                        <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md">
                          ظرفیت: {course.remaining_capacity} نفر
                        </span>
                      )}
                    </div>

                    <h2 className="text-lg font-black text-slate-900 dark:text-white leading-snug line-clamp-2">
                      {course.name}
                    </h2>

                    <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Users2 className="w-4 h-4 text-cyan-600 shrink-0" />
                        <span>رده سنی: <strong>{course.age_range || 'عموم رده‌های سنی'}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-cyan-600 shrink-0" />
                        <span>جنسیت: <strong>{course.gender_display || 'عمومی'}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                        <span>محل برگزاری: <strong>{course.pool_location || 'استخرهای منتخب قزوین'}</strong></span>
                      </div>
                    </div>

                    {course.what_you_learn && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs leading-relaxed text-justify">
                        <span className="font-bold text-cyan-900 dark:text-cyan-200 block mb-1">سرفصل‌های آموزشی:</span>
                        {course.what_you_learn}
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-500 dark:text-slate-400">شهریه کل دوره:</span>
                      <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                        {price > 0 ? `${price.toLocaleString('fa-IR')} تومان` : 'تماس با پذیرش'}
                      </span>
                    </div>

                    {(course.installments_count || 1) > 1 && (
                      <span className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        ✓ امکان پرداخت اقساطی تا سقف {course.installments_count} قسط
                      </span>
                    )}

                    <Link
                      to={`/login?mode=register&courseId=${course.id}`}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-700 hover:to-teal-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                    >
                      <span>ثبت‌نام آنلاین در این دوره</span>
                      <ArrowLeft className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Educational Content Section: Why learn swimming in Qazvin with IranSwim */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-cyan-100 dark:border-slate-800 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              چرا کلاس شنای مدرسه شنای ایران در قزوین؟
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
              یادگیری شنا صرفاً یک تفریح تابستانه نیست؛ بلکه یک مهارت حیاتی نجات‌بخش و ورزشی همه‌جانبه برای رشد جسمانی، اصلاح ستون فقرات و تقویت روحیه اعتمادبه‌نفس کودکان و آرامش اعصاب بزرگسالان است.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 p-4 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-100 dark:border-sky-900">
              <CheckCircle2 className="w-6 h-6 text-sky-600 dark:text-sky-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">مربیان رسمی فدراسیون</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                تمام کادر آموزشی دارای کارت معتبر مربیگری، گواهینامه نجات‌غریق و سابقه مربیگری در مسابقات قهرمانی استان قزوین هستند.
              </p>
            </div>

            <div className="space-y-2 p-4 bg-teal-50 dark:bg-teal-950/40 rounded-2xl border border-teal-100 dark:border-teal-900">
              <CheckCircle2 className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">آموزش گام‌به‌گام ۴ شنا</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                کرال سینه، کرال پشت، قورباغه و پروانه بر اساس جدیدترین متدهای آموزشی فدراسیون بین‌المللی شنا (World Aquatics) تدریس می‌شود.
              </p>
            </div>

            <div className="space-y-2 p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-100 dark:border-emerald-900">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">استخرهای بهداشتی و تمیز</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                برگزاری کلاس‌ها در استخرهای ۵۰ متری المپیک، نیلگون، آزادی و آب‌پری قزوین با نظارت دقیق بر دمای آب و سیستم‌های گندزدایی ازن و تصفیه پیشرفته.
              </p>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};
