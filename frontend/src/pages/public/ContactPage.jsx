import React from 'react';
import { Link } from 'react-router-dom';
import {
  PhoneCall, MapPin, Clock, ChevronRight, Waves,
  ShieldCheck, ArrowLeft, Mail, Building2, CheckCircle2
} from 'lucide-react';
import { SEOHead } from '../../components/common/SEOHead';
import { Badge } from '../../components/common/Badge';
import { PublicFooter } from '../../components/layout/PublicFooter';

const VERIFIED_POOLS = [
  {
    name: 'استخر ۵۰ متری المپیک قزوین',
    location: 'قزوین، شهرک کوثر، مجتمع ورزشی المپیک',
    phone: '۰۲۸-۳۳۶۵۲۰۰۱',
    dimensions: '۵۰ در ۲۵ متر (۱۰ لاین مسابقاتی)',
    depth: '۱.۴۰ الی ۳.۸۰ متر',
    facilities: 'سونای خشک و بخار، جکوزی ماساژوردار، حوضچه آب سرد، رختکن الکترونیک و پارکینگ اختصاصی'
  },
  {
    name: 'استخر نیلگون انقلاب',
    location: 'قزوین، میدان میرعماد، خیابان نادری شمالی',
    phone: '۰۲۸-۳۳۳۴۱۰۰۲',
    dimensions: '۲۵ در ۱۲.۵ متر (۶ لاین)',
    depth: '۰.۹۰ الی ۲.۲۰ متر',
    facilities: 'کاسه آموزشی اختصاصی، سونای بخار گیاهی، جکوزی ماساژوردار، بوفه سلامت'
  },
  {
    name: 'استخر قهرمانی آزادی',
    location: 'قزوین، سبزه میدان، مجموعه ورزشی جهان پهلوان تختی',
    phone: '۰۲۸-۳۳۲۲۳۳۴۴',
    dimensions: '۳۳ در ۱۵ متر',
    depth: '۱.۲۰ الی ۲.۸۰ متر',
    facilities: 'لاین‌های اختصاصی تمرین سرعتی، تخته‌های شنا و فین، سالن بدنسازی خشک ویژه شناگران'
  },
  {
    name: 'استخر آموزشی سرپوشیده نونهالان (آب‌پری)',
    location: 'قزوین، بلوار دانشگاه، مجتمع آموزشی ورزشی دانشگاه',
    phone: '۰۲۸-۳۳۵۵۶۶۷۷',
    dimensions: '۱۶ در ۸ متر',
    depth: '۰.۷۰ الی ۱.۲۰ متر',
    facilities: 'کاسه شیب‌دار ایمن کودکان، بازوبند و نودل‌های فومی، دوش‌های آبگرم اختصاصی کودکان و دمای ۳۱ درجه'
  }
];

export const ContactPage = () => {
  const breadcrumbs = [
    { name: 'صفحه اصلی', url: '/' },
    { name: 'تماس با ما و آدرس استخرهای قزوین', url: '/contact/' }
  ];

  const contactSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': 'https://iran-swim.ir/contact/#webpage',
    'url': 'https://iran-swim.ir/contact/',
    'name': 'تماس با مدرسه شنای ایران و استخرهای طرف قرارداد در قزوین',
    'description': 'اطلاعات تماس، مشاوره ثبت‌نام و آدرس استخرهای همکار و طرف قرارداد مدرسه شنای ایران در شهر قزوین.',
    'mainEntity': {
      '@type': 'SportsClub',
      '@id': 'https://iran-swim.ir/#organization',
      'name': 'مدرسه شنای ایران',
      'url': 'https://iran-swim.ir'
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans text-right" dir="rtl">
      <SEOHead
        title="تماس با ما | آدرس و شماره تلفن استخرهای مدرسه شنای ایران در قزوین"
        description="اطلاعات تماس، آدرس و شماره تلفن استخرهای تحت پوشش مدرسه شنای ایران در قزوین؛ شامل استخر المپیک کوثر، نیلگون نادری، آزادی تختی و استخر نونهالان آب‌پری."
        canonicalUrl="/contact/"
        keywords="تماس با مدرسه شنای ایران, آدرس مدرسه شنا در قزوین, تلفن استخر قزوین, تلفن استخر المپیک قزوین, تلفن استخر نیلگون قزوین"
        schemaData={contactSchema}
        breadcrumbs={breadcrumbs}
      />

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-cyan-900 via-sky-950 to-slate-900 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-cyan-800/40">
        <div className="max-w-7xl mx-auto space-y-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-cyan-300">
            <Link to="/" className="hover:underline">خانه</Link>
            <ChevronRight className="w-3.5 h-3.5 rotate-180 text-cyan-400" />
            <span className="text-white font-medium">تماس با ما و استخرها</span>
          </nav>

          <div className="space-y-3 max-w-3xl">
            <Badge variant="info">دفتر پذیرش و مجموعه‌های آبی قزوین</Badge>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
              تماس با مدرسه شنای ایران و استخرهای طرف قرارداد در قزوین
            </h1>
            <p className="text-sm sm:text-base text-cyan-100/90 leading-relaxed text-justify">
              برای مشاوره تعیین سطح، ثبت‌نام در کلاس‌ها یا اطلاع از سانس‌های آقایان و بانوان در شهر قزوین، از طریق راه‌های ارتباطی زیر با ما در ارتباط باشید.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-12">
        
        {/* Core NAP Info Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-cyan-100 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2 p-4 bg-cyan-50/70 dark:bg-cyan-950/40 rounded-2xl border border-cyan-200/60 dark:border-cyan-800/60">
            <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <h2 className="font-black text-sm text-slate-900 dark:text-white">شماره تماس پذیرش مرکزی</h2>
            <a
              href="tel:02833650000"
              className="text-lg font-mono font-black text-cyan-700 dark:text-cyan-300 block hover:underline"
              dir="ltr"
            >
              ۰۲۸-۳۳۶۵۰۰۰۰
            </a>
            <p className="text-[11px] text-slate-500">پاسخگویی سریع برای مشاوره و ثبت‌نام دوره‌ها</p>
          </div>

          <div className="space-y-2 p-4 bg-teal-50/70 dark:bg-teal-950/40 rounded-2xl border border-teal-200/60 dark:border-teal-800/60">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="font-black text-sm text-slate-900 dark:text-white">ساعات پاسخگویی</h2>
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">
              شنبه تا پنج‌شنبه: ۹:۰۰ الی ۲۰:۰۰
            </p>
            <p className="text-[11px] text-slate-500">پذیرش آنلاین در ۲۴ ساعت شبانه‌روز فعال است</p>
          </div>

          <div className="space-y-2 p-4 bg-sky-50/70 dark:bg-sky-950/40 rounded-2xl border border-sky-200/60 dark:border-sky-800/60">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h2 className="font-black text-sm text-slate-900 dark:text-white">موقعیت جغرافیایی</h2>
            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
              استان قزوین، شهر قزوین، شهرک کوثر (استخر المپیک) و استخرهای همکار در سطح شهر
            </p>
            <p className="text-[11px] text-slate-500">مختصات جغرافیایی: 36.2797° N, 50.0049° E</p>
          </div>
        </div>

        {/* Detailed Contracted Pools Directory */}
        <section className="space-y-6">
          <div className="space-y-2">
            <Badge variant="warning">استخرهای طرف قرارداد</Badge>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              مشخصات و آدرس استخرهای محل برگزاری کلاس‌ها در قزوین
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              کلاس‌های مدرسه شنای ایران در استخرهای منتخب و مجهز به سیستم‌های بهداشتی تصفیه پیشرفته برگزار می‌شود:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {VERIFIED_POOLS.map((pool, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Waves className="w-5 h-5 text-cyan-600 shrink-0" />
                    <span>{pool.name}</span>
                  </h3>
                  <a
                    href={`tel:${pool.phone.replace(/[^0-9]/g, '')}`}
                    className="p-1.5 px-3 rounded-xl bg-cyan-50 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 text-xs font-mono font-bold flex items-center gap-1 hover:bg-cyan-100"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{pool.phone}</span>
                  </a>
                </div>

                <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span><strong>آدرس:</strong> {pool.location}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-cyan-600 shrink-0" />
                    <span><strong>ابعاد و عمق:</strong> {pool.dimensions} • عمق: {pool.depth}</span>
                  </p>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs leading-relaxed">
                    <strong>امکانات:</strong> {pool.facilities}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};
