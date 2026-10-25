import React, { useState } from 'react';
import { Zap, AlertTriangle, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { Link } from 'react-router-dom';

export const SupervisorTestTriggerPage = () => {
  const [triggering, setTriggering] = useState(false);
  const [result, setResult] = useState(null);

  const handleTrigger = async (mode) => {
    try {
      setTriggering(true);
      setResult(null);
      await api.post('/supervisor/test-trigger/', { mode });
    } catch (err) {
      // The middleware returns 500 with error_tracking_id
      const data = err.response?.data;
      setResult({
        success: true,
        errorId: data?.error_tracking_id,
        exceptionType: data?.exception_type,
        detail: data?.detail || 'خطا در سرور ثبت گردید.'
      });
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          شبیه‌ساز و آزمون زنده سیستم پایش باگ ناظر
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          جهت اطمینان از عملکرد صد درصدی سیستم مانیتورینگ، با فشردن دکمه‌های زیر می‌توانید یک خطای آزمایشی کنترل‌شده در سرور جنگو ایجاد کنید تا ضبط استک‌ترس و ثبت در پایگاه داده را به صورت زنده آزمایش کنید.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Test 1: Division by zero */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-mono font-bold text-sm mb-3">
              1/0
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">خطای تقسیم بر صفر (ZeroDivisionError)</h3>
            <p className="text-xs text-slate-500 mt-1">
              شبیه‌سازی یک خطای محاسباتی غیرمنتظره در منطق بک‌اند
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Button
              variant="danger"
              size="sm"
              loading={triggering}
              onClick={() => handleTrigger('division_by_zero')}
              className="w-full"
            >
              ایجاد خطای 1/0
            </Button>
          </div>
        </div>

        {/* Test 2: ValueError */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-mono font-bold text-sm mb-3">
              Val
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">خطای مقدار نامعتبر (ValueError)</h3>
            <p className="text-xs text-slate-500 mt-1">
              شبیه‌سازی خطای اعتبارسنجی کنترل‌نشده یا تبدیل نوع داده
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              loading={triggering}
              onClick={() => handleTrigger('value_error')}
              className="w-full text-amber-700 border-amber-300 hover:bg-amber-50"
            >
              ایجاد خطای ValueError
            </Button>
          </div>
        </div>

        {/* Test 3: RuntimeError */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-mono font-bold text-sm mb-3">
              Run
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">خطای زمان اجرا (RuntimeError)</h3>
            <p className="text-xs text-slate-500 mt-1">
              شبیه‌سازی کرش یا استثنای عمومی در سرویس‌های سیستم
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Button
              variant="secondary"
              size="sm"
              loading={triggering}
              onClick={() => handleTrigger('runtime_error')}
              className="w-full"
            >
              ایجاد خطای RuntimeError
            </Button>
          </div>
        </div>
      </div>

      {/* Result feedback */}
      {result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-xs animate-in fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-base font-bold text-emerald-900">
                استثنا با موفقیت در سرور ایجاد و توسط Middleware ناظر ضبط گردید!
              </h4>
              <p className="text-sm text-emerald-800 mt-1 leading-relaxed">
                {result.detail}
              </p>
              <div className="mt-3 flex items-center gap-4 text-xs font-mono">
                <span className="bg-white px-3 py-1 rounded-md border border-emerald-200 text-slate-800">
                  شناسه رهگیری خطا: <strong>#{result.errorId}</strong>
                </span>
                <span className="bg-white px-3 py-1 rounded-md border border-emerald-200 text-slate-800">
                  نوع استثنا: <strong>{result.exceptionType}</strong>
                </span>
              </div>
              <div className="mt-4">
                <Link
                  to="/supervisor/errors"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                >
                  <span>مشاهده این خطا در جدول باگ‌ها و بررسی استک‌ترس</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
