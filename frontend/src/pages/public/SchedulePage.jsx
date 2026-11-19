import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock, MapPin, ChevronRight, Waves,
  ShieldCheck, ArrowLeft, PhoneCall
} from 'lucide-react';
import { SEOHead } from '../../components/common/SEOHead';
import { Badge } from '../../components/common/Badge';
import { PublicFooter } from '../../components/layout/PublicFooter';

const POOL_SCHEDULES = [
  {
    poolName: 'استخر ۵۰ متری المپیک قزوین',
    location: 'شهرک کوثر، مجتمع ورزشی المپیک',
    phone: '۰۲۸-۳۳۶۵۲۰۰۱',
    days: [
      { day: 'روزهای زوج (شنبه، دوشنبه، چهارشنبه)', time: '۱۶:۰۰ الی ۱۷:۱۵', target: 'نونهالان و کودکان (آموزش ۴ شنا)' },
      { day: 'روزهای زوج (شنبه، دوشنبه، چهارشنبه)', time: '۱۷:۳۰ الی ۱۹:۰۰', target: 'نوجوانان و بزرگسالان (استقامت و اصلاح تکنیک)' },
      { day: 'روزهای زوج (صبحگاهی)', time: '۰۸:۰۰ الی ۰۹:۳۰', target: 'شنای پروانه و استارت قهرمانی (لاین اختصاصی ۲)' }
    ]
  },
  {
    poolName: 'استخر نیلگون انقلاب',
    location: 'میدان میرعماد، خیابان نادری شمالی',
    phone: '۰۲۸-۳۳۳۴۱۰۰۲',
    days: [
      { day: 'روزهای فرد (یکشنبه، سه‌شنبه)', time: '۱۵:۳۰ الی ۱۶:۴۵', target: 'سانس ویژه بانوان و دختران نونهال' },
      { day: 'روزهای فرد (یکشنبه، سه‌شنبه)', time: '۱۷:۰۰ الی ۱۸:۱۵', target: 'کلاس‌های مقدماتی و رفع ترس کودکان' },
      { day: 'پنج‌شنبه‌ها', time: '۰۹:۳۰ الی ۱۱:۰۰', target: 'آزمون تعیین سطح و استعدادیابی نخبگان' }
    ]
  },
  {
    poolName: 'استخر قهرمانی آزادی',
    location: 'سبزه میدان، مجموعه ورزشی جهان پهلوان تختی',
    phone: '۰۲۸-۳۳۲۲۳۳۴۴',
    days: [
      { day: 'روزهای زوج (شنبه، دوشنبه، چهارشنبه)', time: '۱۷:۰۰ الی ۱۸:۱۵', target: 'آموزش کرال سینه و استقامت پاییز' },
      { day: 'روزهای فرد (یکشنبه، سه‌شنبه)', time: '۱۸:۰۰ الی ۱۹:۳۰', target: 'تمرینات تایم‌گیری و آمادگی لیگ مسابقاتی' }
    ]
  },
  {
    poolName: 'استخر آموزشی سرپوشیده نونهالان (آب‌پری)',
    location: 'بلوار دانشگاه، مجتمع آموزشی ورزشی دانشگاه',
    phone: '۰۲۸-۳۳۵۵۶۶۷۷',
    days: [
      { day: 'پنج‌شنبه‌ها و جمعه‌ها', time: '۱۰:۰۰ الی ۱۱:۱۵', target: 'خردسالان ۴ تا ۹ سال (دمای آب ۳۱ درجه بدون کلر)' },
      { day: 'پنج‌شنبه‌ها و جمعه‌ها', time: '۱۱:۳۰ الی ۱۲:۴۵', target: 'آموزش اولیه شناوری و بازی‌های تعادلی' }
    ]
  }
];

export const SchedulePage = () => {
  const breadcrumbs = [
    { name: 'صفحه اصلی', url: '/' },
    { name: 'برنامه زمان‌بندی کلاس‌ها و استخرهای قزوین', url: '/schedule/' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans text-right" dir="rtl">
      <SEOHead
        title="برنامه کلاس‌های شنا در قزوین | سانس استخرهای المپیک، نیلگون و آزادی"
        description="برنامه هفتگی کلاس‌های آموزش شنا در قزوین؛ جدول سانس‌های روزهای زوج و فرد ویژه کودکان، نوجوانان و بزرگسالان در استخرهای ۵۰ متری المپیک، نیلگون و آزادی قزوین."
        canonicalUrl="/schedule/"
        keywords="برنامه کلاس شنا قزوین, سانس استخر المپیک قزوین, سانس استخر نیلگون قزوین, ساعت کلاس شنا کودکان قزوین"
        breadcrumbs={breadcrumbs}
      />

      {/* Header */}
      <section className="bg-gradient-to-b from-cyan-900 via-sky-950 to-slate-900 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-cyan-800/40">
        <div className="max-w-7xl mx-auto space-y-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-cyan-300">
            <Link to="/" className="hover:underline">خانه</Link>
            <ChevronRight className="w-3.5 h-3.5 rotate-180 text-cyan-400" />
            <span className="text-white font-medium">برنامه زمان‌بندی کلاس‌ها</span>
          </nav>

          <div className="space-y-3 max-w-3xl">
            <Badge variant="info">تقویم کلاسی ترم پاییز و زمستان ۱۴۰۵</Badge>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
              برنامه زمان‌بندی کلاس‌های آموزش شنا در استخرهای قزوین
            </h1>
            <p className="text-sm sm:text-base text-cyan-100/90 leading-relaxed text-justify">
              جدول روزها و ساعات برگزاری کلاس‌های مقدماتی، پیشرفته و قهرمانی مدرسه شنای ایران به تفکیک استخرهای طرف قرارداد در سطح شهر قزوین.
            </p>
          </div>
        </div>
      </section>

      {/* Main Timetable Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {POOL_SCHEDULES.map((pool, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-cyan-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Waves className="w-5 h-5 text-cyan-600 shrink-0" />
                      <span>{pool.poolName}</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>{pool.location}</span>
                    </p>
                  </div>
                  <a
                    href={`tel:${pool.phone.replace(/[^0-9]/g, '')}`}
                    className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 text-xs font-mono font-bold flex items-center gap-1 hover:bg-cyan-100"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{pool.phone}</span>
                  </a>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    سانس‌های آموزشی دایر:
                  </span>
                  <div className="space-y-2.5">
                    {pool.days.map((s, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                          <span>{s.day}</span>
                          <span className="text-cyan-700 dark:text-cyan-300 font-mono bg-cyan-50 dark:bg-cyan-950 px-2 py-0.5 rounded-md">
                            {s.time}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{s.target}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                <Link
                  to="/login?mode=register"
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                >
                  <span>رزرو سانس در این استخر</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Attendance Policy Box */}
        <section className="bg-sky-50 dark:bg-sky-950/40 rounded-3xl p-6 sm:p-8 border border-sky-200 dark:border-sky-800/60 space-y-3">
          <div className="flex items-center gap-2.5 font-bold text-sky-950 dark:text-sky-200 text-base">
            <Clock className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>قوانین حضور و غیاب و جلسات جبرانی</span>
          </div>
          <p className="text-xs sm:text-sm text-sky-900/90 dark:text-sky-300 leading-relaxed text-justify">
            شناگران گرامی در صورت هماهنگی حداقل ۲۴ ساعت قبل از جلسه کلاسی از طریق سامانه یا پیام به مربی، می‌توانند از جلسه جبرانی در پایان ترم بهره‌مند شوند. سیستم کنترل هوشمند سهمیه جلسات از سوخت شدن بی‌دلیل شهریه خانواده‌ها جلوگیری می‌کند.
          </p>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};
