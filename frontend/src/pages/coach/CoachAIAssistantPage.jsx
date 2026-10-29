import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Bot, BookOpen, MessageSquare, Target,
  Copy, Check, Save, ArrowLeft, RefreshCw, ShieldCheck
} from 'lucide-react';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';

export const CoachAIAssistantPage = () => {
  const [activeTab, setActiveTab] = useState('PRACTICE_PLAN'); // 'PRACTICE_PLAN', 'SWIMMER_REPORT', 'DRILLS'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  // Mode 1: Practice Plan Form State
  const [stroke, setStroke] = useState('کرال سینه');
  const [level, setLevel] = useState('متوسط');
  const [duration, setDuration] = useState(60);
  const [focus, setFocus] = useState('بهبود سرعت و ریتم تنفس');

  // Mode 2: Swimmer Report Form State
  const [swimmerName, setSwimmerName] = useState('علی محمدی');
  const [reportFocus, setReportFocus] = useState('تسلط بر هواگیری جانبی و انضباط کلاسی');

  // Mode 3: Drills Form State
  const [drillStroke, setDrillStroke] = useState('کرال سینه');
  const [weakness, setWeakness] = useState('افتادن باسن در آب و بالا آمدن بیش از حد سر هنگام نفس‌گیری');

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setResult(null);
      const res = await api.post('/coaches/ai/assist/', {
        mode: activeTab,
        stroke: activeTab === 'DRILLS' ? drillStroke : stroke,
        level_name: level,
        duration_minutes: duration,
        target_focus: activeTab === 'SWIMMER_REPORT' ? reportFocus : focus,
        swimmer_name: swimmerName,
        weakness,
      });

      setResult(res.data);
      toast.success('محتوای هوشمند با موفقیت تولید گردید.');
    } catch (err) {
      console.error('AI Assist error:', err);
      toast.error('خطا در دریافت پاسخ از دستیار هوشمند');
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('متن در کلیپ‌بورد کپی شد.');
    setTimeout(() => setCopied(false), 3000);
  };

  const saveToWorkouts = async (plan) => {
    try {
      await api.post('/coaches/workouts/', {
        title: plan.title,
        duration_minutes: duration,
        focus_skills: plan.focus_skills,
        warmup_section: plan.warmup_section,
        main_section: plan.main_section,
        cooldown_section: plan.cooldown_section,
        notes: plan.notes,
        is_template: true,
      });
      toast.success('برنامه تمرینی مستقیماً در بانک تمرینات مربی ذخیره گردید.');
      navigate('/coach/workouts');
    } catch (err) {
      console.error(err);
      toast.error('خطا در ذخیره برنامه تمرینی');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-purple-700 via-indigo-600 to-cyan-700 p-6 sm:p-8 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-purple-200" />
              دستیار هوشمند و تحلیلگر مربی شنا
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              دستیار تخصصی هوش مصنوعی مربی
            </h1>
            <p className="text-purple-100 text-xs sm:text-sm mt-1 max-w-xl font-light">
              طراحی جلسات استاندارد تمرینی، تحلیل تکنیک و نگارش پیام‌های محترمانه آموزشی برای اولیای گرامی
            </p>
          </div>
        </div>
      </div>

      {/* Safety & Sandbox Notice */}
      <div className="bg-purple-50/70 dark:bg-purple-950/20 rounded-2xl border border-purple-200 dark:border-purple-900/60 p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="text-xs text-purple-900 dark:text-purple-200 leading-relaxed">
          <span className="font-bold">اصل استقلال تصمیم‌گیری مربی:</span> کلیه خروجی‌های هوش مصنوعی صرفاً نقش پیشنهاد کمکی را دارند و مربی در ویرایش، انطباق با آمادگی جسمانی شناگر یا عدم استفاده از آن‌ها کاملاً مختار است.
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => { setActiveTab('PRACTICE_PLAN'); setResult(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'PRACTICE_PLAN'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          ۱. طراحی برنامه تمرین
        </button>

        <button
          onClick={() => { setActiveTab('SWIMMER_REPORT'); setResult(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'SWIMMER_REPORT'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          ۲. گزارش پیشرفت برای والدین
        </button>

        <button
          onClick={() => { setActiveTab('DRILLS'); setResult(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'DRILLS'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Target className="w-4 h-4" />
          ۳. دریل‌های اصلاح تکنیک
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left/Top Form */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            تنظیم پارامترهای درخواست
          </h2>

          {activeTab === 'PRACTICE_PLAN' && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">ماده / سبک شنا:</label>
                <select
                  value={stroke}
                  onChange={(e) => setStroke(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-800 dark:text-slate-200"
                >
                  <option value="کرال سینه">کرال سینه (Freestyle)</option>
                  <option value="کرال پشت">کرال پشت (Backstroke)</option>
                  <option value="شنای قورباغه">شنای قورباغه (Breaststroke)</option>
                  <option value="شنای پروانه">شنای پروانه (Butterfly)</option>
                  <option value="مختلط انفرادی (IM)">مختلط انفرادی (IM)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">سطح شاگردان:</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-800 dark:text-slate-200"
                  >
                    <option value="مبتدی">مبتدی (سطح ۱)</option>
                    <option value="متوسط">متوسط (سطح ۲)</option>
                    <option value="پیشرفته">پیشرفته (سطح ۳)</option>
                    <option value="تیم شنا و مسابقه">تیم مسابقه</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">مدت زمان (دقیقه):</label>
                  <input
                    type="number"
                    min="30"
                    max="180"
                    step="15"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">هدف و تمرکز جلسه:</label>
                <input
                  type="text"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-800 dark:text-slate-200"
                  placeholder="مثال: پای پروانه انفجاری، ریتم دست..."
                />
              </div>
            </div>
          )}

          {activeTab === 'SWIMMER_REPORT' && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">نام و نام‌خانوادگی شناگر:</label>
                <input
                  type="text"
                  value={swimmerName}
                  onChange={(e) => setSwimmerName(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-800 dark:text-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">نکات کلیدی پیشرفت و توصیه تمرین:</label>
                <textarea
                  rows="4"
                  value={reportFocus}
                  onChange={(e) => setReportFocus(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          )}

          {activeTab === 'DRILLS' && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">ماده شنا:</label>
                <select
                  value={drillStroke}
                  onChange={(e) => setDrillStroke(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-800 dark:text-slate-200"
                >
                  <option value="کرال سینه">کرال سینه</option>
                  <option value="کرال پشت">کرال پشت</option>
                  <option value="شنای قورباغه">شنای قورباغه</option>
                  <option value="شنای پروانه">شنای پروانه</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">شرح اشکال تکنیکی یا نقطه ضعف شناگر:</label>
                <textarea
                  rows="4"
                  value={weakness}
                  onChange={(e) => setWeakness(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-800 dark:text-slate-200 leading-relaxed"
                  placeholder="مثال: زاویه نادرست مچ پا در شنای قورباغه یا خستگی سریع در دست پروانه..."
                />
              </div>
            </div>
          )}

          <Button
            variant="primary"
            size="md"
            loading={loading}
            onClick={handleGenerate}
            className="w-full justify-center bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2"
          >
            <Sparkles className="w-4 h-4" />
            تولید و تحلیل هوشمند
          </Button>
        </div>

        {/* Right/Bottom Result Panel */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-600" />
              پیش‌نمایش محتوای تولیدشده
            </h2>
          </div>

          {loading ? (
            <div className="py-20 text-center text-xs text-slate-500 space-y-3">
              <Sparkles className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
              <p className="font-semibold">دستیار در حال پردازش سرفصل‌ها و تدوین طرح آموزشی...</p>
            </div>
          ) : result ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Practice Plan Display */}
              {activeTab === 'PRACTICE_PLAN' && result.data && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{result.data.title}</h3>
                      <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5">{result.data.focus_skills}</p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => saveToWorkouts(result.data)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shrink-0"
                    >
                      <Save className="w-3.5 h-3.5" />
                      ذخیره در برنامه‌های من
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-slate-800 dark:text-white block mb-1">بخش گرم‌کردن (Warm-up):</span>
                      <p className="whitespace-pre-line text-slate-700 dark:text-slate-300 leading-relaxed font-mono text-[11px]">
                        {result.data.warmup_section}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-slate-800 dark:text-white block mb-1">بخش اصلی تمرین (Main Set):</span>
                      <p className="whitespace-pre-line text-slate-700 dark:text-slate-300 leading-relaxed font-mono text-[11px]">
                        {result.data.main_section}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-slate-800 dark:text-white block mb-1">بخش سردکردن و ریکاوری:</span>
                      <p className="whitespace-pre-line text-slate-700 dark:text-slate-300 leading-relaxed font-mono text-[11px]">
                        {result.data.cooldown_section}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
                      <span className="font-bold text-amber-900 dark:text-amber-200 block mb-1">نکات کلیدی برای مربی کنار استخر:</span>
                      <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                        {result.data.notes}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Swimmer Report Display */}
              {activeTab === 'SWIMMER_REPORT' && result.report_text && (
                <div className="space-y-3">
                  <textarea
                    rows="10"
                    readOnly
                    value={result.report_text}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans"
                  />
                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => copyText(result.report_text)}
                      className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'کپی شد' : 'کپی متن گزارش'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Drills Recommendation Display */}
              {activeTab === 'DRILLS' && result.drills && (
                <div className="space-y-3 text-xs">
                  {result.drills.map((d, i) => (
                    <div key={i} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                      <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-purple-600" />
                        {d.title}
                      </h4>
                      <p className="text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-slate-500">هدف اصلاحی:</span> {d.focus}
                      </p>
                      <p className="text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-slate-500">تعداد تکرار و ست:</span> {d.reps}
                      </p>
                      <p className="text-purple-700 dark:text-purple-300 bg-purple-50/60 dark:bg-purple-950/40 p-2 rounded-lg leading-relaxed">
                        <span className="font-bold">دستورالعمل اجرا:</span> {d.instructions}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-slate-400 space-y-2">
              <Bot className="w-10 h-10 text-slate-300 mx-auto" />
              <p>پارامترهای سمت راست را مشخص کرده و دکمه «تولید و تحلیل هوشمند» را بزنید.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
