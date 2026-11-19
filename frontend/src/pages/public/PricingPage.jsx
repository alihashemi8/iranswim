import React from 'react';
import { Link } from 'react-router-dom';
import {
  Coins, Check, ShieldCheck, ChevronRight,
  ArrowLeft, CreditCard, Sparkles, HelpCircle
} from 'lucide-react';
import { SEOHead } from '../../components/common/SEOHead';
import { Badge } from '../../components/common/Badge';
import { PublicFooter } from '../../components/layout/PublicFooter';

export const PricingPage = () => {
  const breadcrumbs = [
    { name: 'صفحه اصلی', url: '/' },
    { name: 'تعرفه‌ها و شهریه کلاس شنا در قزوین', url: '/pricing/' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans text-right" dir="rtl">
      <SEOHead
        title="قیمت کلاس شنا در قزوین | شهریه و هزینه آموزش شنا ۱۴۰۵"
        description="مشاهده شفاف قیمت و شهریه کلاس‌های آموزش شنا در قزوین؛ تعرفه دوره‌های کودکان، نوجوانان و بزرگسالان همراه با امکان پرداخت اقساطی در ۲ تا ۴ قسط توافقی بدون کارمزد."
        canonicalUrl="/pricing/"
        keywords="قیمت کلاس شنا در قزوین, هزینه آموزش شنا, شهریه کلاس شنا قزوین, ثبت نام آموزش شنا, کلاس اقساطی شنا قزوین"
        breadcrumbs={breadcrumbs}
      />

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-cyan-900 via-sky-950 to-slate-900 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-cyan-800/40">
        <div className="max-w-7xl mx-auto space-y-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-cyan-300">
            <Link to="/" className="hover:underline">خانه</Link>
            <ChevronRight className="w-3.5 h-3.5 rotate-180 text-cyan-400" />
            <span className="text-white font-medium">تعرفه‌ها و شهریه کلاس شنا</span>
          </nav>

          <div className="space-y-3 max-w-3xl">
            <Badge variant="info">شهریه مصوب ترم پاییز و زمستان ۱۴۰۵</Badge>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
              تعرفه‌ها و هزینه ثبت‌نام کلاس‌های شنا در قزوین
            </h1>
            <p className="text-sm sm:text-base text-cyan-100/90 leading-relaxed text-justify">
              شفافیت کامل در هزینه‌ها، بدون دریافت وجه پنهان؛ با امکان تسهیل پرداخت از طریق اقساط توافقی در سامانه آنلاین مدرسه شنای ایران.
            </p>
          </div>
        </div>
      </section>

      {/* Main Pricing Tables & Installment Policy */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-12">
        
        {/* 3 Tier Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          
          {/* Card 1: Beginner / Kids */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all">
            <div className="space-y-4">
              <span className="px-3 py-1 bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 rounded-xl text-xs font-bold inline-block">
                مقدماتی و نونهالان
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                دوره آشنایی و رفع ترس از آب
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                ویژه کودکان و خردسالان (۴ تا ۹ سال) در استخر آب گرم با عمق استاندارد و مربیان روان‌شناس.
              </p>

              <div className="py-4 border-y border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">شهریه دوره (۱۰ جلسه):</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">۲,۴۰۰,۰۰۰</span>
                  <span className="text-xs font-bold text-slate-500">تومان</span>
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block pt-1">
                  قابلیت پرداخت در ۲ قسط توافقی
                </span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>دمای آب کنترل‌شده ۳۱ درجه سانتی‌گراد</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>بازی‌های تعادلی و شناوری بدون استرس</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>حضور نجات‌غریق مقیم در تمامی جلسات</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>بیمه ورزشی معتبر فدراسیون پزشکی</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6">
              <Link
                to="/login?mode=register"
                className="w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
              >
                <span>ثبت‌نام آنلاین این دوره</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: 4 Strokes Comprehensive (POPULAR) */}
          <div className="bg-gradient-to-b from-white to-cyan-50/50 dark:from-slate-900 dark:to-cyan-950/20 rounded-3xl p-6 sm:p-8 border-2 border-cyan-400 dark:border-cyan-500 shadow-xl flex flex-col justify-between relative transform md:-translate-y-2">
            <div className="absolute -top-3.5 right-6">
              <span className="px-3.5 py-1 bg-gradient-to-r from-cyan-600 to-teal-500 text-white rounded-full text-[11px] font-black shadow-md flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>پرمخاطب‌ترین دوره قزوین</span>
              </span>
            </div>

            <div className="space-y-4 pt-2">
              <span className="px-3 py-1 bg-cyan-100 dark:bg-cyan-900/80 text-cyan-900 dark:text-cyan-200 rounded-xl text-xs font-bold inline-block">
                کرال سینه، پشت و تنفس
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                دوره جامع آموزش ۴ شنا و استقامت
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                ویژه نونهالان، نوجوانان و بزرگسالان (۸ تا ۳۵ سال) با تضمین یادگیری اصولی زاویه دست و پا زدن.
              </p>

              <div className="py-4 border-y border-cyan-200/60 dark:border-cyan-800/60 space-y-1">
                <span className="text-xs text-slate-400">شهریه دوره (۱۲ جلسه):</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-cyan-700 dark:text-cyan-300 font-mono">۲,۶۰۰,۰۰۰</span>
                  <span className="text-xs font-bold text-slate-500">تومان</span>
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block pt-1">
                  امکان تقسیط تا ۳ قسط دلخواه
                </span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>آموزش اصولی تنفس ریتمیک دوطرفه</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>اصلاح تکنیک فیلم‌برداری و فیدبک مربی</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>برگزاری در استخرهای ۵۰ متری المپیک و نیلگون</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>صدور کارنامه الکترونیکی ثبت مهارت‌ها</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6">
              <Link
                to="/login?mode=register"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-700 hover:to-teal-600 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/25 active:scale-95"
              >
                <span>ثبت‌نام آنلاین دوره جامع</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 3: Advanced & Championship */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all">
            <div className="space-y-4">
              <span className="px-3 py-1 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold inline-block">
                تخصصی و استعدادیابی
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                دوره شنای پروانه و استارت قهرمانی
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                ویژه شناگران مستعد و متقاضیان ورود به مسابقات استانی و تیم‌های باشگاهی شنای قزوین.
              </p>

              <div className="py-4 border-y border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">شهریه دوره (۱۲ جلسه):</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">۳,۵۰۰,۰۰۰</span>
                  <span className="text-xs font-bold text-slate-500">تومان</span>
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block pt-1">
                  امکان تقسیط تا ۴ قسط توافقی
                </span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>تکنیک موج دلفین و پروانه تک‌ضرب</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>استارت جهشی از سکو و چرخش سالتو</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>تایم‌گیری دیجیتال و ثبت رکورد در لیگ</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>برنامه‌ریزی بدنسازی خشک مکمل شنا</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6">
              <Link
                to="/login?mode=register"
                className="w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
              >
                <span>ثبت‌نام دوره پیشرفته</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Installment Guide Box */}
        <section className="bg-emerald-50/70 dark:bg-emerald-950/40 rounded-3xl p-6 sm:p-8 border border-emerald-200 dark:border-emerald-800/60 space-y-4">
          <div className="flex items-center gap-3">
            <Coins className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h2 className="text-lg sm:text-xl font-black text-emerald-950 dark:text-emerald-200">
              راهنمای پرداخت اقساطی شهریه در سامانه مدرسه شنای ایران
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-emerald-900/90 dark:text-emerald-300 leading-relaxed text-justify">
            برای راحتی خانواده‌ها، مدیریت مدرسه شنای ایران امکان پرداخت شهریه دوره‌ها را تا سقف ۴ قسط توافقی فراهم کرده است. تعداد اقساط و حتی مبلغ هر قسط دست شماست (تقسیم لزوماً مساوی نیست؛ می‌توانید پیش‌پرداخت را مشخص و مابقی را تراز خودکار کنید). بدون نیاز به چک یا ضامن.
          </p>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};
