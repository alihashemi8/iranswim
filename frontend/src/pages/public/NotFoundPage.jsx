import React from 'react';
import { Link } from 'react-router-dom';
import { Waves, ArrowLeft, Home, BookOpen, PhoneCall } from 'lucide-react';
import { SEOHead } from '../../components/common/SEOHead';
import { PublicFooter } from '../../components/layout/PublicFooter';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans text-right" dir="rtl">
      <SEOHead
        title="صفحه مورد نظر یافت نشد (خطای ۴۰۴)"
        description="صفحه‌ای که به دنبال آن هستید در وبسایت مدرسه شنای ایران وجود ندارد یا به آدرس دیگری منتقل شده است."
        robots="noindex, nofollow"
      />

      <main className="flex-1 flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 flex items-center justify-center mx-auto shadow-inner">
            <Waves className="w-10 h-10 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="text-4xl sm:text-5xl font-mono font-black text-cyan-600 dark:text-cyan-400 block">
              ۴۰۴
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              صفحه مورد نظر در اعماق استخر پیدا نشد!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              صفحه‌ای که به دنبال آن بودید ممکن است حذف شده باشد، آدرس آن تغییر کرده باشد، یا به درستی وارد نشده باشد.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="py-3 px-5 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Home className="w-4 h-4" />
              <span>بازگشت به صفحه اصلی</span>
            </Link>

            <Link
              to="/swimming-classes/"
              className="py-3 px-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-95"
            >
              <BookOpen className="w-4 h-4 text-cyan-600" />
              <span>مشاهده کلاس‌های شنا</span>
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
