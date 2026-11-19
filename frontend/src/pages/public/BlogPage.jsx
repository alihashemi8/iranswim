import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Clock, ChevronRight, Newspaper, ArrowLeft,
  Sparkles, Award, User, Tag, Calendar
} from 'lucide-react';
import api from '../../api/client';
import { SEOHead } from '../../components/common/SEOHead';
import { Badge } from '../../components/common/Badge';
import { PublicFooter } from '../../components/layout/PublicFooter';

const VERIFIED_NEWS = [
  {
    id: 1,
    title: 'آغاز دوره‌های تخصصی شنای پاییز ۱۴۰۵ در آکادمی ایران سوییم',
    slug: 'welcome-autumn-term-1405',
    category: 'CLASSES',
    category_display: 'دوره‌ها و کلاس‌ها',
    summary: 'ثبت‌نام ترم جدید کلاس‌های آموزش ۴ شنا ویژه کودکان، نوجوانان و بزرگسالان آغاز شد.',
    body: `آکادمی ایران‌سوییم با هدف گسترش ورزش شنا و ارتقای سطح سلامت جامعه، ثبت‌نام ترم جدید کلاس‌های آموزشی خود را در استخرهای تحت پوشش آغاز نمود.

این دوره‌ها در رده‌های سنی مختلف شامل:
- نونهالان و خردسالان (۴ تا ۹ سال): آشنایی با آب، رفع ترس و آموزش اصول اولیه تنفس
- کودکان و نوجوانان (۶ تا ۱۲ سال): استعدادیابی، آموزش کرال سینه و کرال پشت
- جوانان و بزرگسالان (۱۲ سال به بالا): اصلاح تکنیک، شنای پروانه، قورباغه و افزایش استقامت

کلاس‌ها با حضور مربیان رسمی فدراسیون شنا و رعایت بالاترین استانداردهای بهداشتی برگزار می‌گردد. جهت رزرو سانس می‌توانید از طریق سامانه آنلاین اقدام فرمایید.`,
    publish_at: '2026-10-25T12:49:27.601522+00:00',
    image: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 2,
    title: 'برگزاری مسابقات استانی شنای سرعت «جام آزادی ۱۴۰۵»',
    slug: 'state-swimming-championship-freedom-cup',
    category: 'COMPETITIONS',
    category_display: 'مسابقات و رویدادها',
    summary: 'مسابقات استانی شنای سرعت در مواد ۵۰ و ۱۰۰ متر با درخشش شناگران آکادمی ایران‌سوییم برگزار شد.',
    body: `مسابقات قهرمانی شنای استان قزوین تحت عنوان «جام آزادی ۱۴۰۵» در استخر قهرمانی با حضور بیش از ۱۲۰ شناگر از سراسر استان برگزار گردید.

شناگران مدرسه شنای ایران در رده‌های سنی نونهالان و نوجوانان موفق به کسب چندین مدال طلا و نقره در رشته‌های کرال سینه، پروانه و قورباغه شدند. این مسابقات با ثبت رکوردهای دیجیتال و حضور داوران رسمی فدراسیون شنا برگزار شد.

مدیریت آموزشگاه این افتخارآفرینی را به شناگران بااستعداد، خانواده‌های گرامی و کادر مربیان دلسوز تبریک عرض می‌نماید.`,
    publish_at: '2026-10-22T16:35:12.990003+00:00',
    image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 3,
    title: 'افتتاح پیشرفته‌ترین سیستم تصفیه آب اوزون و تصفیه بدون کلر',
    slug: 'ozone-water-purification-upgrade',
    category: 'HEALTH',
    category_display: 'آموزش و بهداشت استخر',
    summary: 'بهره‌برداری از سیستم پیشرفته گندزدایی ترکیبی ازن جهت سلامت کامل پوست و چشمان نوآموزان.',
    body: `در راستای ارتقای سلامت شناگران و رعایت بالاترین استانداردهای بهداشتی، استخرهای تحت نظارت مدرسه شنای ایران به پیشرفته‌ترین فناوری گندزدایی ازن و فیلتراسیون شنی مجهز شدند.

این فناوری مزایای زیر را برای ورزشکاران به همراه دارد:
۱. کاهش چشمگیر استفاده از کلر سنتی و حذف بوی تند در فضای استخر
۲. جلوگیری از سوزش چشم، خشکی پوست و حساسیت‌های ریوی به ویژه در کودکان
۳. زلالیت فوق‌العاده آب با حذف کامل باکتری‌ها و ترکیبات آلی
۴. پایش ۲۴ ساعته دما و اسیدیته آب (pH) با دستگاه‌های اندازه‌گیری هوشمند`,
    publish_at: '2026-10-18T16:35:12.997702+00:00',
    image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 4,
    title: 'آغاز پیش‌ثبت‌نام دوره‌های تخصصی شنای زمستانه با تخفیف ویژه',
    slug: 'winter-term-registration-opened',
    category: 'CLASSES',
    category_display: 'دوره‌ها و کلاس‌ها',
    summary: 'پیش‌ثبت‌نام کلاس‌های زمستانه آموزش شنا در قزوین با ظرفیت محدود آغاز شد.',
    body: `به اطلاع علاقه‌مندان به ورزش‌های آبی می‌رساند پیش‌ثبت‌نام ترم زمستانه مدرسه شنای ایران در استخرهای ۵۰ متری المپیک و نیلگون قزوین آغاز گردید.

با توجه به تجهیز استخرها به سامانه‌های گرمایشی مدرن و حفظ دمای مطبوع آب در فصول سرد، فصل زمستان یکی از بهترین زمان‌ها برای تمرینات مستمر و حفظ آمادگی جسمانی است.

تخفیف ویژه ثبت‌نام زودهنگام و امکان پرداخت اقساطی برای متقاضیانی که تا پایان آذرماه ثبت‌نام نمایند فعال می‌باشد.`,
    publish_at: '2026-10-15T16:35:13.005472+00:00',
    image: 'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 5,
    title: 'کارگاه تغذیه ورزشی، ریکاوری و تنفس عمیق ویژه ورزشکاران شنا',
    slug: 'nutrition-and-breathing-workshop',
    category: 'GENERAL',
    category_display: 'عمومی و آموزشی',
    summary: 'برگزاری کارگاه تخصصی تغذیه و اصول نفس‌گیری در شنا برای اولیا و شناگران رده‌های پایه.',
    body: `تغذیه مناسب قبل و بعد از تمرین شنا، نقش تعیین‌کننده‌ای در تأمین انرژی عضلانی و جلوگیری از گرفتگی عضلات در آب ایفا می‌کند.

در این کارگاه آموزشی که با حضور کارشناس تغذیه ورزشی برگزار شد، نکات کلیدی زیر بررسی گردید:
- میان‌وعده‌های پرکربوهیدرات و زودهضم ۱ تا ۲ ساعت قبل از ورود به استخر
- مصرف مایعات و الکترولیت‌ها برای جلوگیری از کم‌آبی پنهان بدن
- اصول تنفس دیافراگمی و ریتمیک جهت افزایش گنجایش ریوی شناگر`,
    publish_at: '2026-10-10T12:00:00+00:00',
    image: 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 6,
    title: 'درخشش شناگران آموزشگاه شنای ایران در لیگ برتر باشگاه‌های کشور',
    slug: 'iran-swim-academy-shines-in-national-league',
    category: 'COMPETITIONS',
    category_display: 'مسابقات و رویدادها',
    summary: 'کسب جایگاه برتر و ارتقای رکوردهای انفرادی شناگران قزوین در مرحله اول مسابقات باشگاهی.',
    body: `تیم منتخب شناگران رده‌های پایه مدرسه شنای ایران با شرکت در مرحله رفت لیگ باشگاه‌های کشور، نتایج درخشانی را کسب نمودند.

شناگران مستعد قزوین در رشته‌های ۱۰۰ متر کرال پشت و ۲۰۰ متر آزاد توانستند رکوردهای شخصی خود را بهبود بخشیده و در میان برترین‌های کشور قرار گیرند. کادر مربیان این موفقیت را نویدبخش حضور پررنگ‌تر استان در رقابت‌های ملی می‌دانند.`,
    publish_at: '2026-10-05T12:00:00+00:00',
    image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&q=80'
  }
];

export const BlogPage = () => {
  const { slug } = useParams();
  const [articles, setArticles] = useState(VERIFIED_NEWS);
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await api.get('/content/news/');
        const data = res.data?.results || res.data;
        if (Array.isArray(data) && data.length > 0) {
          setArticles(data);
        }
      } catch {
        // Fallback to verified local database snapshot
      }
    };
    fetchNews();
  }, []);

  useEffect(() => {
    if (slug) {
      const found = articles.find((a) => a.slug === slug);
      setSelectedArticle(found || null);
    } else {
      setSelectedArticle(null);
    }
  }, [slug, articles]);

  const formatDate = (dateStr) => {
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

  // If viewing a single article
  if (selectedArticle) {
    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': `https://iran-swim.ir/blog/${selectedArticle.slug}/#article`,
      'headline': selectedArticle.title,
      'description': selectedArticle.summary || selectedArticle.title,
      'image': selectedArticle.image || 'https://iran-swim.ir/images/swimmer-boy.webp',
      'datePublished': selectedArticle.publish_at,
      'dateModified': selectedArticle.publish_at,
      'author': {
        '@type': 'Organization',
        'name': 'مدرسه شنای ایران',
        'url': 'https://iran-swim.ir'
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'مدرسه شنای ایران',
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://iran-swim.ir/images/logo.png'
        }
      },
      'mainEntityOfPage': `https://iran-swim.ir/blog/${selectedArticle.slug}/`
    };

    const breadcrumbs = [
      { name: 'صفحه اصلی', url: '/' },
      { name: 'وبلاگ و مقالات آموزشی', url: '/blog/' },
      { name: selectedArticle.title, url: `/blog/${selectedArticle.slug}/` }
    ];

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans text-right" dir="rtl">
        <SEOHead
          title={`${selectedArticle.title} | وبلاگ مدرسه شنای ایران`}
          description={selectedArticle.summary || selectedArticle.title}
          canonicalUrl={`/blog/${selectedArticle.slug}/`}
          ogType="article"
          ogImage={selectedArticle.image}
          schemaData={articleSchema}
          breadcrumbs={breadcrumbs}
        />

        {/* Article Header */}
        <section className="bg-gradient-to-b from-cyan-900 via-sky-950 to-slate-900 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-cyan-800/40">
          <div className="max-w-4xl mx-auto space-y-4">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-cyan-300">
              <Link to="/" className="hover:underline">خانه</Link>
              <ChevronRight className="w-3.5 h-3.5 rotate-180 text-cyan-400" />
              <Link to="/blog/" className="hover:underline">وبلاگ و مقالات</Link>
              <ChevronRight className="w-3.5 h-3.5 rotate-180 text-cyan-400" />
              <span className="text-white font-medium truncate max-w-xs">{selectedArticle.title}</span>
            </nav>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 rounded-lg text-xs font-bold">
                  {selectedArticle.category_display || 'آموزشی'}
                </span>
                <span className="text-xs text-slate-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  <span>{formatDate(selectedArticle.publish_at)}</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                {selectedArticle.title}
              </h1>
            </div>
          </div>
        </section>

        {/* Article Body */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-8">
          {selectedArticle.image && (
            <div className="rounded-3xl overflow-hidden aspect-video shadow-lg border border-slate-200 dark:border-slate-800">
              <img
                src={selectedArticle.image}
                alt={selectedArticle.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {selectedArticle.summary && (
            <div className="p-4 sm:p-6 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 rounded-2xl text-sm font-semibold text-cyan-950 dark:text-cyan-200 leading-relaxed">
              {selectedArticle.summary}
            </div>
          )}

          <div className="prose dark:prose-invert max-w-none text-sm sm:text-base leading-loose whitespace-pre-line text-justify text-slate-700 dark:text-slate-300">
            {selectedArticle.body}
          </div>

          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <Link
              to="/blog/"
              className="inline-flex items-center gap-2 text-xs font-bold text-cyan-700 dark:text-cyan-400 hover:underline"
            >
              <ArrowLeft className="w-4 h-4 rotate-180" />
              <span>بازگشت به لیست مقالات و اخبار</span>
            </Link>

            <Link
              to="/swimming-classes/"
              className="py-2.5 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <span>مشاهده دوره‌های شنا</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </main>

        <PublicFooter />
      </div>
    );
  }

  // Articles List View (/blog/)
  const breadcrumbs = [
    { name: 'صفحه اصلی', url: '/' },
    { name: 'وبلاگ و اخبار آموزشگاه شنا', url: '/blog/' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans text-right" dir="rtl">
      <SEOHead
        title="وبلاگ و مقالات آموزشی شنا | مدرسه شنای ایران در قزوین"
        description="تازه‌ترین مقالات آموزشی، نکات یادگیری ۴ شنا، راهنمای رفع ترس از آب در کودکان، اصول نفس‌گیری و اخبار مسابقات شنای استان قزوین."
        canonicalUrl="/blog/"
        keywords="آموزش شنا از صفر, چگونه شنا یاد بگیریم, آموزش کرال سینه, اصول تنفس در شنا, فواید شنا, وبلاگ مدرسه شنای ایران"
        breadcrumbs={breadcrumbs}
      />

      {/* Header */}
      <section className="bg-gradient-to-b from-cyan-900 via-sky-950 to-slate-900 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-cyan-800/40">
        <div className="max-w-7xl mx-auto space-y-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-cyan-300">
            <Link to="/" className="hover:underline">خانه</Link>
            <ChevronRight className="w-3.5 h-3.5 rotate-180 text-cyan-400" />
            <span className="text-white font-medium">وبلاگ و اخبار آموزشگاه</span>
          </nav>

          <div className="space-y-3 max-w-3xl">
            <Badge variant="info">دانشنامه و اطلاعیه‌های شنا</Badge>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
              مقالات آموزشی، نکات یادگیری شنا و اخبار مدرسه شنای ایران
            </h1>
            <p className="text-sm sm:text-base text-cyan-100/90 leading-relaxed text-justify">
              راهنماهای کاربردی مربیان برای یادگیری صحیح تکنیک‌های شنا، بهداشت استخر، تغذیه ورزشی و پوشش رویدادهای قهرمانی در قزوین.
            </p>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {articles.map((item) => (
            <article
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <span className="absolute top-3 right-3 px-3 py-1 bg-white/90 dark:bg-slate-900/90 text-cyan-900 dark:text-cyan-200 text-xs font-bold rounded-lg border border-cyan-200 dark:border-cyan-800">
                    {item.category_display || 'اطلاعیه'}
                  </span>
                </div>

                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    <span>{formatDate(item.publish_at)}</span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                    {item.title}
                  </h2>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 text-justify">
                    {item.summary || item.body}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <Link
                  to={`/blog/${item.slug}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-50 dark:bg-cyan-950/80 hover:bg-cyan-600 hover:text-white text-cyan-900 dark:text-cyan-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-cyan-200/80 dark:border-cyan-800"
                >
                  <span>مطالعه کامل مقاله</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
