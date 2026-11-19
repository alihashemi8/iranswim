import React, { useState } from 'react';
import { HelpCircle, ChevronDown, CheckCircle2, PhoneCall } from 'lucide-react';
import { Badge } from '../common/Badge';

export const FAQ_ITEMS = [
  {
    q: 'مدرسه شنای ایران در کدام استخرهای قزوین کلاس برگزار می‌کند؟',
    a: 'کلاس‌های مدرسه شنای ایران در ۴ استخر مجهز و استاندارد در شهر قزوین برگزار می‌شود: ۱. استخر ۵۰ متری المپیک (شهرک کوثر)، ۲. استخر نیلگون انقلاب (خیابان نادری شمالی، میدان میرعماد)، ۳. استخر قهرمانی آزادی (سبزه میدان، مجموعه ورزشی تختی)، و ۴. استخر آموزشی سرپوشیده نونهالان آب‌پری (بلوار دانشگاه) با دمای کنترل‌شده ۳۱ درجه سانتی‌گراد.'
  },
  {
    q: 'چگونه در کلاس‌های شنای قزوین ثبت‌نام کنیم؟',
    a: 'ثبت‌نام به سادگی و به صورت کاملاً آنلاین از طریق همین سامانه انجام می‌شود. کافی است دوره متناسب با رده سنی را انتخاب فرمایید و مشخصات متقاضی را وارد کنید. همچنین پذیرش تلفنی از طریق شماره ۰۲۸-۳۳۶۵۰۰۰۰ در ساعات ۹ الی ۲۰ پاسخگوی سوالات شماست.'
  },
  {
    q: 'کلاس‌های شنا برای چه رده‌های سنی برگزار می‌شوند؟',
    a: 'کلاس‌های ما در رده‌های تفکیک‌شده شامل: ۱. خردسالان و نونهالان (۴ تا ۹ سال) جهت رفع ترس و بازی‌های تعادلی، ۲. کودکان و نوجوانان (۶ تا ۱۲ سال و ۸ تا ۱۵ سال) برای آموزش ۴ شنا و استعدادیابی، و ۳. نوجوانان و بزرگسالان برای آموزش از پایه، اصلاح تکنیک و استقامت بدنی دایر می‌باشد.'
  },
  {
    q: 'هزینه و شهریه ثبت‌نام کلاس شنا چقدر است و آیا امکان پرداخت اقساطی وجود دارد؟',
    a: 'شهریه دوره‌های ۱۰ تا ۱۲ جلسه‌ای متناسب با رده آموزشی بین ۱,۹۵۰,۰۰۰ تا ۳,۵۰۰,۰۰۰ تومان است. برای راحتی خانواده‌ها، پرداخت اقساطی در ۲ الی ۴ قسط توافقی فعال است و متقاضیان می‌توانند مبالغ اقساط را متناسب با بودجه خود در سامانه تنظیم نمایند.'
  },
  {
    q: 'برای شروع آموزش شنا چه سطحی لازم است؟ آیا افراد مبتدی پذیرش می‌شوند؟',
    a: 'هیچ پیش‌نیازی لازم نیست! کلاس‌های رده مبتدی ویژه افرادی طراحی شده که تا کنون وارد استخر نشده‌اند یا ترس از آب دارند. مربیان رسمی فدراسیون با روش‌های صبورانه و گام‌به‌گام شناوری و تنفس را آموزش می‌دهند.'
  },
  {
    q: 'آیا قبل از ثبت‌نام آزمون تعیین سطح و استعدادیابی انجام می‌شود؟',
    a: 'بله، برای شناگرانی که پیش‌زمینه‌ای در شنا دارند، تعیین سطح توسط سرپرست مربیان انجام می‌شود تا شناگر در کلاس هماهنگ با توانایی فنی خود قرار گیرد و از اتلاف زمان و هزینه جلوگیری شود.'
  },
  {
    q: 'مدت زمان یادگیری کامل شنا چقدر است؟',
    a: 'آشنایی با آب، شناوری و پای مقدماتی معمولاً طی یک ترم ۱۰ تا ۱۲ جلسه‌ای حاصل می‌شود. یادگیری اصولی ۴ شنا (کرال سینه، کرال پشت، قورباغه و پروانه) با اصلاح تکنیک دست و نفس‌گیری معمولاً به ۲ الی ۳ ترم مستمر نیاز دارد.'
  },
  {
    q: 'چه تجهیزاتی برای شرکت در کلاس شنا نیاز داریم؟',
    a: 'داشتن مایو استاندارد شنا، کلاه شنای سیلیکونی، عینک شنای ضدبخار و دمپایی استخری تمیز کافی است. تجهیزات آموزشی کمکی مانند تخته شنا، نودل‌های فومی و بازوبند توسط آموزشگاه در محل استخر تأمین می‌گردد.'
  }
];

export const LandingFaqSection = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="relative w-full py-14 sm:py-20 lg:py-24 min-w-0 bg-white/70 dark:bg-slate-900/60 border-t border-cyan-800/10">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10 text-right" dir="rtl">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="info">پاسخ به سوالات پرتکرار</Badge>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            پرسش‌های متداول درباره کلاس‌های شنا در قزوین
          </h2>
          <p className="text-xs sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            پاسخ سریع و شفاف به سوالاتی که والدین و علاقه‌مندان به شنا پیش از ثبت‌نام از ما می‌پرسند
          </p>
        </div>

        <div className="space-y-3.5">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all ${
                  isOpen
                    ? 'bg-cyan-50/80 dark:bg-slate-800/80 border-cyan-300 dark:border-cyan-700 shadow-sm'
                    : 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800 hover:border-cyan-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-right cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                    <HelpCircle className={`w-4 h-4 shrink-0 ${isOpen ? 'text-cyan-600' : 'text-slate-400'}`} />
                    <span>{item.q}</span>
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform shrink-0 ${
                      isOpen ? 'rotate-180 text-cyan-600' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 sm:pb-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed text-justify border-t border-cyan-100 dark:border-slate-700/60 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions? Help card */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-600 to-teal-500 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-cyan-600/20">
          <div className="space-y-1 text-center sm:text-right">
            <h3 className="font-bold text-base">سوالی دارید که در لیست بالا نبود؟</h3>
            <p className="text-xs text-cyan-100">کارشناسان پذیرش مدرسه شنای ایران آماده پاسخگویی و راهنمایی شما هستند.</p>
          </div>
          <a
            href="tel:02833650000"
            className="px-6 py-2.5 rounded-xl bg-white text-slate-950 font-black text-xs inline-flex items-center gap-2 hover:bg-cyan-50 transition-colors shrink-0 shadow-sm"
          >
            <PhoneCall className="w-4 h-4 text-cyan-600" />
            <span>تماس با پذیرش: ۰۲۸-۳۳۶۵۰۰۰۰</span>
          </a>
        </div>
      </div>
    </section>
  );
};
