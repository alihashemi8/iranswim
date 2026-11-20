import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, PhoneCall, MapPin, Clock, ArrowUp, Sparkles
} from 'lucide-react';
import { SwimmerCrawlIcon } from '../common/AquaticIcons';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

export const PublicFooter = () => {
  const [showRaybanModal, setShowRaybanModal] = useState(false);

  return (
    <>
      <footer className="landing-footer w-full bg-gradient-to-b from-[#0d3849] to-[#061e29] pt-12 sm:pt-14 pb-8 min-w-0 relative text-right" dir="rtl">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 xl:gap-10">
            
            {/* Identity & About */}
            <div className="sm:col-span-1 lg:col-span-4 space-y-4">
              <div className="flex items-center gap-2.5 text-cyan-300 font-extrabold text-lg">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-400 text-white flex items-center justify-center shadow-md shrink-0">
                  <SwimmerCrawlIcon className="w-5 h-5" />
                </div>
                <span className="text-white font-black text-lg">مدرسه شنای ایران - قزوین</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed text-justify sm:text-right">
                مرکز تخصصی آموزش، اصلاح تکنیک و استعدادیابی شنا در استان قزوین؛ برگزارکننده دوره‌های عمومی، نیمه‌خصوصی و خصوصی ۴ شنا ویژه کودکان، نوجوانان و بزرگسالان زیر نظر مربیان رسمی فدراسیون شنا.
              </p>
              <div className="pt-1 flex items-center gap-2 text-[11px] text-emerald-300 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30 w-fit">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>دارای کادر مربیان رسمی فدراسیون شنای جمهوری اسلامی ایران</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="sm:col-span-1 lg:col-span-2 space-y-3.5">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                <span>صفحات اصلی</span>
              </h4>
              <ul className="grid grid-cols-2 gap-x-2 gap-y-2.5 sm:grid-cols-1 sm:gap-2.5 text-xs text-slate-300">
                <li>
                  <Link to="/" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 py-0.5 group">
                    <span className="text-cyan-400/60 group-hover:text-cyan-300 text-[10px] transition-colors">‹</span>
                    <span>صفحه اصلی</span>
                  </Link>
                </li>
                <li>
                  <Link to="/swimming-classes/" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 py-0.5 group">
                    <span className="text-cyan-400/60 group-hover:text-cyan-300 text-[10px] transition-colors">‹</span>
                    <span>کلاس‌های شنا</span>
                  </Link>
                </li>
                <li>
                  <Link to="/courses/kids-swimming/" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 py-0.5 group">
                    <span className="text-cyan-400/60 group-hover:text-cyan-300 text-[10px] transition-colors">‹</span>
                    <span>آموزش شنای کودکان</span>
                  </Link>
                </li>
                <li>
                  <Link to="/courses/adults-swimming/" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 py-0.5 group">
                    <span className="text-cyan-400/60 group-hover:text-cyan-300 text-[10px] transition-colors">‹</span>
                    <span>آموزش شنای بزرگسالان</span>
                  </Link>
                </li>
                <li>
                  <Link to="/coaches/" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 py-0.5 group">
                    <span className="text-cyan-400/60 group-hover:text-cyan-300 text-[10px] transition-colors">‹</span>
                    <span>کادر مربیان قزوین</span>
                  </Link>
                </li>
                <li>
                  <Link to="/pricing/" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 py-0.5 group">
                    <span className="text-cyan-400/60 group-hover:text-cyan-300 text-[10px] transition-colors">‹</span>
                    <span>تعرفه‌ها و اقساط</span>
                  </Link>
                </li>
                <li>
                  <Link to="/schedule/" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 py-0.5 group">
                    <span className="text-cyan-400/60 group-hover:text-cyan-300 text-[10px] transition-colors">‹</span>
                    <span>برنامه هفتگی استخرها</span>
                  </Link>
                </li>
                <li>
                  <Link to="/blog/" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 py-0.5 group">
                    <span className="text-cyan-400/60 group-hover:text-cyan-300 text-[10px] transition-colors">‹</span>
                    <span>وبلاگ و مقالات آموزشی</span>
                  </Link>
                </li>
                <li>
                  <Link to="/contact/" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 py-0.5 group">
                    <span className="text-cyan-400/60 group-hover:text-cyan-300 text-[10px] transition-colors">‹</span>
                    <span>تماس با ما و استخرها</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="sm:col-span-1 lg:col-span-3 space-y-3.5">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                <span>اطلاعات تماس و استخرها</span>
              </h4>
              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <p className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>قزوین، شهرک کوثر (استخر المپیک) و استخرهای منتخب نیلگون، آزادی و آب‌پری</span>
                </p>
                <div className="flex items-center gap-2.5">
                  <PhoneCall className="w-4 h-4 text-teal-400 shrink-0" />
                  <Link
                    to="/contact/"
                    className="hover:text-cyan-300 transition-colors flex items-center gap-2 font-medium group"
                  >
                    <span>تماس با استخرهای همکار:</span>
                    <span className="text-[10px] text-cyan-400/80 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/50">مشاهده شماره‌ها</span>
                  </Link>
                </div>
                <p className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>پاسخگویی و مشاوره: شنبه تا پنج‌شنبه ۹ الی ۲۰</span>
                </p>
              </div>
            </div>

            {/* Trust Seal (Enamad) */}
            <div className="sm:col-span-1 lg:col-span-3 flex flex-col items-start sm:items-center lg:items-start space-y-3.5">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                <span>نماد اعتماد الکترونیکی</span>
              </h4>
              <a
                referrerPolicy="origin"
                target="_blank"
                rel="noreferrer"
                href="https://trustseal.enamad.ir/?id=8412006&Code=JQjDkp1A7Vlcx7g8vFbifdbIAGnkdkJm"
                aria-label="نماد اعتماد الکترونیکی مدرسه شنای ایران"
                className="inline-flex items-center justify-center rounded-2xl bg-white/95 hover:bg-white p-2.5 shadow-lg border border-cyan-200/30 transition-transform duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                <img
                  referrerPolicy="origin"
                  src="https://trustseal.enamad.ir/logo.aspx?id=8412006&Code=JQjDkp1A7Vlcx7g8vFbifdbIAGnkdkJm"
                  alt="نماد اعتماد الکترونیکی کسب‌وکار مدرسه شنای ایران"
                  style={{ cursor: 'pointer' }}
                  className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                />
              </a>
            </div>
          </div>

          {/* About Rayban Team & Creator Banner */}
          <div className="mt-10 pt-8 border-t border-cyan-900/40">
            <div className="rounded-2xl bg-gradient-to-r from-slate-900/90 via-cyan-950/40 to-slate-900/90 border border-cyan-500/20 p-4 sm:p-5 backdrop-blur-sm shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-white font-black text-lg shadow-md shadow-cyan-500/20 shrink-0">
                    ر
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-white font-extrabold text-sm sm:text-base">
                        تیم نرم‌افزاری رایبان
                      </h4>
                      <span className="text-[10px] text-cyan-300 bg-cyan-950/90 border border-cyan-600/40 px-2 py-0.5 rounded-full font-bold">
                        طراح و سازنده سامانه
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1">
                      طراحی، پیاده‌سازی و ساخت اختصاصی این سامانه جامع توسط <strong className="text-cyan-300 font-bold">تیم رایبان</strong> انجام شده است.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRaybanModal(true)}
                  className="shrink-0 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-white border border-cyan-500/30 transition-all text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>درباره رایبان</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Divider & Copyright */}
          <div className="border-t border-slate-800/80 pt-6 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-right leading-relaxed">
              <p>
                کلیه حقوق مادی و معنوی این سامانه متعلق به <span className="text-cyan-300 font-bold">مدرسه شنای ایران (IranSwim)</span> و <span className="text-cyan-300 font-bold">تیم رایبان</span> می‌باشد © ۱۴۰۵
              </p>
              <span className="hidden sm:inline text-slate-600">•</span>
              <p className="text-slate-400 flex items-center gap-1.5">
                <span>توسعه‌دهنده:</span>
                <span className="text-slate-200 font-medium">تیم نرم‌افزاری رایبان</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer group py-1.5 px-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-cyan-800/40"
              aria-label="بازگشت به ابتدای صفحه"
            >
              <span>بازگشت به بالا</span>
              <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </footer>

      {/* About Rayban Modal */}
      <Modal
        isOpen={showRaybanModal}
        onClose={() => setShowRaybanModal(false)}
        title="درباره تیم نرم‌افزاری رایبان (Rayban)"
        maxWidth="max-w-xl"
      >
        <div className="space-y-5 text-right p-1" dir="rtl">
          <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-400 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0">
              ر
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                تیم نرم‌افزاری و توسعه فناوری رایبان
              </h3>
              <p className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold mt-0.5">
                طراح، معمار و سازنده پلتفرم مدیریت مدرسه شنا
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
            <p>
              تیم نرم‌افزاری <strong>رایبان</strong> متشکل از متخصصان حوزه مهندسی نرم‌افزار، طراحی تجربه کاربری و سامانه‌های ابری است که با هدف ارتقای سطح کیفی مدیریت کسب‌وکارهای ورزشی و آموزشی، پلتفرم‌های اختصاصی، امن و پرسرعت را طراحی و پیاده‌سازی می‌نماید.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRaybanModal(false)}
              className="text-xs font-bold"
            >
              بستن
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
