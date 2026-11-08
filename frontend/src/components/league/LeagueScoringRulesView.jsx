import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Award, Plus, RefreshCw, Save, AlertCircle,
  HelpCircle, Settings2, Sliders, CheckCircle2, History
} from 'lucide-react';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

export const LeagueScoringRulesView = ({
  league,
  onOpenManualScoreModal,
  onRefreshLeague,
}) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  // Form state
  const [rules, setRules] = useState({
    rank_1: 10,
    rank_2: 7,
    rank_3: 5,
    rank_4: 3,
    rank_5: 2,
    participation: 1,
    record_bonus: 2,
    tie_breaker: 'gold_medals',
  });
  const [rulesDescription, setRulesDescription] = useState('');

  useEffect(() => {
    if (league) {
      if (league.scoring_rules) {
        setRules((prev) => ({
          ...prev,
          ...league.scoring_rules,
        }));
      }
      setRulesDescription(league.rules_description || '');
    }
  }, [league]);

  const handleChange = (field, value) => {
    setRules((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveRules = async (recalculate = false) => {
    if (!league) return;
    try {
      if (recalculate) {
        setRecalculating(true);
      } else {
        setLoading(true);
      }

      await api.patch(`/leagues/${league.id}/scoring_rules/`, {
        scoring_rules: rules,
        rules_description: rulesDescription,
        recalculate,
      });

      toast.success(
        recalculate
          ? 'قوانین ذخیره شد و تمام امتیازات لیگ با موفقیت بازمحاسبه گردید.'
          : 'قوانین و ضرایب امتیازدهی با موفقیت به‌روزرسانی شد.'
      );
      if (onRefreshLeague) onRefreshLeague();
    } catch (err) {
      console.error(err);
      toast.error('خطا در ذخیره‌سازی قوانین امتیازدهی');
    } finally {
      setLoading(false);
      setRecalculating(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Overview & Manual Score Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            فرمول و سیستم محاسبه امتیازات مسابقات لیگ
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            جدول شفاف تخصیص امتیازات بر اساس رتبه کسب‌شده در رقابت‌های رسمی، پاداش‌ها و امتیازات دستی مدیر
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button
            onClick={onOpenManualScoreModal}
            className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت امتیاز تشویقی / دستی</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Scoring Table Editor (Col span 2) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-5 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-500" />
              ماتریس امتیازدهی بر اساس رتبه در رویداد
            </span>
            <span className="text-xs text-slate-400">
              ارقام قابل ویرایش توسط مدیر هستند
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {/* Rank 1 */}
            <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 p-3.5 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                  🥇 نفر اول (طلا)
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">قهرمان</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={rules.rank_1}
                  onChange={(e) => handleChange('rank_1', Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-xs text-slate-500 shrink-0">امتیاز</span>
              </div>
            </div>

            {/* Rank 2 */}
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  🥈 نفر دوم (نقره)
                </span>
                <span className="text-[10px] text-slate-500 font-bold">نایب‌قهرمان</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={rules.rank_2}
                  onChange={(e) => handleChange('rank_2', Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-xs text-slate-500 shrink-0">امتیاز</span>
              </div>
            </div>

            {/* Rank 3 */}
            <div className="bg-amber-900/10 dark:bg-amber-950/20 border border-amber-800/30 dark:border-amber-900/50 p-3.5 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 dark:text-amber-300 flex items-center gap-1">
                  🥉 نفر سوم (برنز)
                </span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">مقام سوم</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={rules.rank_3}
                  onChange={(e) => handleChange('rank_3', Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 border border-amber-800/40 dark:border-amber-800 rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-xs text-slate-500 shrink-0">امتیاز</span>
              </div>
            </div>

            {/* Rank 4 */}
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 p-3.5 rounded-xl space-y-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                نفر چهارم
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={rules.rank_4}
                  onChange={(e) => handleChange('rank_4', Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-xs text-slate-500 shrink-0">امتیاز</span>
              </div>
            </div>

            {/* Rank 5 */}
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 p-3.5 rounded-xl space-y-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                نفر پنجم
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={rules.rank_5}
                  onChange={(e) => handleChange('rank_5', Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-xs text-slate-500 shrink-0">امتیاز</span>
              </div>
            </div>

            {/* Participation */}
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 p-3.5 rounded-xl space-y-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                شرکت در مسابقه
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={rules.participation}
                  onChange={(e) => handleChange('participation', Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-xs text-slate-500 shrink-0">امتیاز</span>
              </div>
            </div>
          </div>

          {/* Tie Breaker Rules */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              تعیین قوانین تساوی امتیازات (Tie-Breaker Rule)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="tie_breaker"
                  checked={rules.tie_breaker === 'gold_medals'}
                  onChange={() => handleChange('tie_breaker', 'gold_medals')}
                  className="text-amber-500 focus:ring-amber-500"
                />
                <span>تعداد مدال طلای بیشتر</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="tie_breaker"
                  checked={rules.tie_breaker === 'best_time'}
                  onChange={() => handleChange('tie_breaker', 'best_time')}
                  className="text-amber-500 focus:ring-amber-500"
                />
                <span>بهترین تایم زمانی رکورد</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="tie_breaker"
                  checked={rules.tie_breaker === 'registration_date'}
                  onChange={() => handleChange('tie_breaker', 'registration_date')}
                  className="text-amber-500 focus:ring-amber-500"
                />
                <span>تاریخ زودهنگام ثبت‌نام</span>
              </label>
            </div>
          </div>

          {/* Rules Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              توضیحات و دستورالعمل امتیازدهی برای اعضا
            </label>
            <textarea
              rows={3}
              value={rulesDescription}
              onChange={(e) => setRulesDescription(e.target.value)}
              placeholder="توضیحات و ضرایب مربوط به مسابقات فصلی، رکوردهای زمانی و..."
              className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <Button
              onClick={() => handleSaveRules(false)}
              disabled={loading || recalculating}
              className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold justify-center"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'در حال ذخیره...' : 'ذخیره فرمول امتیازدهی'}</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleSaveRules(true)}
              disabled={loading || recalculating}
              className="gap-1.5 text-xs text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
              <span>{recalculating ? 'در حال بازمحاسبه...' : 'ذخیره و بازمحاسبه سراسری امتیازات لیگ'}</span>
            </Button>
          </div>
        </div>

        {/* Informational Architecture Card (Col span 1) */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-xs space-y-3.5 border border-slate-700">
            <div className="flex items-center gap-2 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-bold text-sm">معماری ایزوله امتیازات فصلی</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              امتیازات مستقیماً در پرونده عمومی شناگر ثبت نمی‌شوند؛ بلکه به ازای هر دوره لیگ، مسابقه و نتیجه مجزا محاسبه و تجمیع می‌گردند.
            </p>
            <div className="pt-2 border-t border-slate-700/80 space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>با پایان فصل، فصل جدید با جدول رتبه‌بندی تمیز از صفر آغاز می‌شود.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>تمام سوابق و رکوردهای فصول گذشته در آرشیو حفظ می‌مانند.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>امکان اعمال امتیازات تشویقی با ذکر دقیق دلیل فراهم است.</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl p-4 text-xs space-y-2 text-amber-900 dark:text-amber-200">
            <span className="font-bold block flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4" />
              نکته درباره ضرایب مسابقات
            </span>
            <p className="text-[11px] leading-relaxed text-amber-900/80 dark:text-amber-300/80">
              هنگام ثبت نتایج هر مسابقه، سیستم بر اساس کمترین زمان ثبت‌شده شناگران رتبه‌بندی را انجام داده و امتیازات مربوطه را طبق همین جدول به صورت خودکار به لیگ شناگر منتقل می‌نماید.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
