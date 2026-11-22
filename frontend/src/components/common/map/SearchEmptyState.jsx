import React from 'react';
import { Compass, AlertCircle, MapPin } from 'lucide-react';

export const SearchEmptyState = ({ query, isOutsideScope, detectedLocation, message }) => {
  if (isOutsideScope) {
    return (
      <div className="py-6 px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-3 border border-amber-200 dark:border-amber-900/50 shadow-xs">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
          محدودیت جغرافیایی: فقط شهر قزوین
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed mb-3">
          {message ||
            `مکان درخواستی (${detectedLocation || query}) خارج از محدوده شهر قزوین است. سامانه ایران‌شنا منحصراً اماکن و معابر شهر قزوین را پوشش می‌دهد.`}
        </p>
        <div className="inline-flex items-center gap-1.5 text-[11px] text-sky-600 dark:text-sky-400 font-semibold bg-sky-50 dark:bg-sky-950/40 px-3 py-1.5 rounded-full border border-sky-200 dark:border-sky-800">
          <MapPin className="w-3.5 h-3.5" />
          <span>لطفاً آدرس یا نام مکانی در محدوده قزوین را وارد کنید</span>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
        <Compass className="w-6 h-6 animate-pulse" />
      </div>
      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">
        مکانی با عبارت «{query}» در قزوین یافت نشد
      </h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
        املا یا کلمات کلیدی دیگری را امتحان کنید (مثلاً نام محله، بلوار اصلی، استخر یا نام کوچه).
      </p>
    </div>
  );
};

export default SearchEmptyState;
