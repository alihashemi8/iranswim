import React from 'react';
import { Check, X, ShieldAlert } from 'lucide-react';

/**
 * قوانین الزامی رمز عبور در کل سامانه:
 * - حداقل ۸ نویسه
 * - شامل حروف بزرگ و کوچک انگلیسی
 * - شامل حداقل یک عدد
 * - شامل حداقل یک کاراکتر ویژه (@، # و ...)
 * - فقط و فقط کاراکترهای انگلیسی (فاقد فاصله و بدون نویسه‌ها و اعداد فارسی)
 */
export const PASSWORD_RULES = [
  {
    id: 'length',
    label: 'حداقل ۸ نویسه (کاراکتر)',
    check: (pwd) => Boolean(pwd && pwd.length >= 8),
  },
  {
    id: 'uppercase',
    label: 'حداقل یک حرف بزرگ انگلیسی (A-Z)',
    check: (pwd) => /[A-Z]/.test(pwd || ''),
  },
  {
    id: 'lowercase',
    label: 'حداقل یک حرف کوچک انگلیسی (a-z)',
    check: (pwd) => /[a-z]/.test(pwd || ''),
  },
  {
    id: 'number',
    label: 'حداقل یک عدد انگلیسی (0-9)',
    check: (pwd) => /[0-9]/.test(pwd || ''),
  },
  {
    id: 'special',
    label: 'حداقل یک نشانه یا کاراکتر ویژه (@، #، $، % و ...)',
    check: (pwd) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(pwd || ''),
  },
  {
    id: 'englishOnly',
    label: 'فقط حروف و علائم انگلیسی (فاقد فاصله و حروف/اعداد فارسی)',
    check: (pwd) => {
      if (!pwd) return false;
      return /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]+$/.test(pwd);
    },
  },
];

/**
 * اعتبارسنجی رمز عبور و بازگرداندن وضعیت و آرایه خطاها
 */
export const validatePassword = (password) => {
  if (!password) {
    return {
      isValid: false,
      errors: ['کلمه عبور نمی‌تواند خالی باشد.'],
      firstError: 'کلمه عبور الزامی است.',
    };
  }

  const errors = [];

  for (const rule of PASSWORD_RULES) {
    if (!rule.check(password)) {
      errors.push(rule.label);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    firstError: errors.length > 0 ? `رمز عبور باید: ${errors[0]}` : null,
    errorMessage:
      errors.length > 0
        ? `رمز عبور باید شامل معیارهای زیر باشد:\n• ${errors.join('\n• ')}`
        : null,
  };
};

/**
 * تولید رمز عبور تصادفی مطمئن و پیچیده با تضمین تحقق تمام قوانین
 */
export const generateStrongPassword = (length = 14) => {
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowers = 'abcdefghijkmnpqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%^&*_-+=';
  const allChars = uppers + lowers + numbers + symbols;

  // تضمین وجود حداقل ۲ مورد از هر دسته الزامی
  const getRandom = (str) => str.charAt(Math.floor(Math.random() * str.length));

  const result = [
    getRandom(uppers),
    getRandom(uppers),
    getRandom(lowers),
    getRandom(lowers),
    getRandom(numbers),
    getRandom(numbers),
    getRandom(symbols),
    getRandom(symbols),
  ];

  while (result.length < length) {
    result.push(getRandom(allChars));
  }

  // بر زدن تصادفی کاراکترها (Fisher-Yates Shuffle)
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join('');
};

/**
 * کامپوننت راهنما و نمایش زنده چک‌لیست قوانین رمز عبور
 */
export const PasswordRequirementsList = ({ password, showAlways = false, className = '' }) => {
  if (!password && !showAlways) return null;

  return (
    <div className={`p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1.5 ${className}`}>
      <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 pb-1 border-b border-slate-200/60 dark:border-slate-700/40">
        <ShieldAlert className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
        <span>شرایط الزامی کلمه عبور:</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-0.5">
        {PASSWORD_RULES.map((rule) => {
          const passed = rule.check(password);
          return (
            <div
              key={rule.id}
              className={`flex items-center gap-1.5 transition-colors ${
                passed
                  ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {passed ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0 ml-1" />
              )}
              <span className="text-[11px] leading-tight">{rule.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
