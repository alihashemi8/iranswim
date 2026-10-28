import React, { useState, useEffect } from 'react';
import {
  Award, TrendingUp, CheckCircle2, Clock, AlertCircle, FileText,
  User, Calendar, Sparkles, ChevronLeft, ArrowUpRight
} from 'lucide-react';
import api from '../../api/client';
import { useSwimmer } from '../../context/SwimmerContext';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { ProgressBar } from '../../components/common/Charts';

export const SwimmerProgressPage = () => {
  const { activeSwimmer, activeSwimmerId } = useSwimmer();
  const [activeTab, setActiveTab] = useState('CURRENT_LEVEL'); // CURRENT_LEVEL, SKILLS, TRENDS, FEEDBACK
  const [profile, setProfile] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [skills, setSkills] = useState([]);
  const [skillLevels, setSkillLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const params = activeSwimmerId ? { swimmer_id: activeSwimmerId } : {};
      const [meRes, assRes, skRes, levRes] = await Promise.allSettled([
        api.get('/swimmers/me/', { params }),
        api.get('/assessments/skills/', { params }),
        api.get('/education/skills/'),
        api.get('/education/levels/'),
      ]);

      if (meRes.status === 'fulfilled') setProfile(meRes.value.data);
      if (assRes.status === 'fulfilled') {
        const d = assRes.value.data;
        setAssessments(Array.isArray(d) ? d : d.results || []);
      }
      if (skRes.status === 'fulfilled') {
        const d = skRes.value.data;
        setSkills(Array.isArray(d) ? d : d.results || []);
      }
      if (levRes.status === 'fulfilled') {
        const d = levRes.value.data;
        setSkillLevels(Array.isArray(d) ? d : d.results || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressData();
  }, [activeSwimmerId]);

  if (loading) {
    return <LoadingState type="dashboard" message="در حال محاسبه زنجیره مهارت‌ها و پیشرفت ورزشی..." />;
  }

  const passedAssessments = assessments.filter((a) => a.status === 'PASSED');
  const inProgressAssessments = assessments.filter((a) => a.status === 'NEEDS_WORK' || a.status === 'PENDING');

  // Calculate percentage of skills mastered
  const totalSkillsCount = skills.length > 0 ? skills.length : 12;
  const progressPercent = Math.min(100, Math.round((passedAssessments.length / totalSkillsCount) * 100));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              پیشرفت ورزشی و ماتریس مهارت‌ها
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            رصد سطح مهارت، مهارت‌های کسب‌شده، روند ارزیابی‌های دوره‌ای و بازخورد اختصاصی کادر مربیگری
          </p>
        </div>

        {/* Level badge */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white px-4 py-2.5 rounded-2xl shadow-xs">
          <Award className="w-6 h-6 shrink-0" />
          <div>
            <span className="text-[10px] text-sky-100 font-semibold block leading-tight">سطح مهارت فعلی:</span>
            <span className="text-sm font-bold tracking-tight">{profile?.level_name || 'سطح مقدماتی ۱'}</span>
          </div>
        </div>
      </div>

      {/* 4 Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('CURRENT_LEVEL')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'CURRENT_LEVEL'
              ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>سطح فعلی و ارتقا</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SKILLS')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'SKILLS'
              ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>ماتریس مهارت‌ها ({passedAssessments.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('TRENDS')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'TRENDS'
              ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>روند پیشرفت و رشد</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('FEEDBACK')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'FEEDBACK'
              ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>بازخورد و نکات مربی</span>
        </button>
      </div>

      {/* Tab 1: Current Level & Promotion Criteria */}
      {activeTab === 'CURRENT_LEVEL' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider block mb-1">
                  شناسنامه مهارتی شناگر
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  سطح: {profile?.level_name || 'سطح پایه / مقدماتی'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  تاریخ آخرین ارزیابی جامع:{' '}
                  {assessments[0]?.assessment_date || 'در انتظار اولین جلسه سنجش'}
                </p>
              </div>

              <div className="text-right sm:text-left">
                <span className="text-xs text-slate-500 block mb-1">پیشرفت کلی به سمت سطح بعدی</span>
                <span className="text-2xl font-black text-sky-600 font-mono">٪{progressPercent}</span>
              </div>
            </div>

            <ProgressBar progress={progressPercent} color="sky" />

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 space-y-2">
              <h4 className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                <Sparkles className="w-4 h-4 text-amber-500" />
                شرایط لازم جهت ارتقا به سطح بالاتر:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 leading-relaxed pr-2">
                <li>کسب نمره قبولی (Pass) در تمام مهارت‌های تنفس جانبی و پای کرال سینه</li>
                <li>تکمیل حداقل ۱۰ جلسه تمرینی در دوره جاری با حضور فعال</li>
                <li>تأییدیه نهایی سرمربی آکادمی و ثبت در سیستم ارزیابی</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Skills Matrix */}
      {activeTab === 'SKILLS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                🟢 مهارت‌های کسب‌شده
              </span>
              <span className="text-2xl font-black text-emerald-700 font-mono">
                {passedAssessments.length}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block mb-1">
                🟡 در حال یادگیری / نیازمند تمرین
              </span>
              <span className="text-2xl font-black text-amber-700 font-mono">
                {inProgressAssessments.length}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                ⚪ سرفصل‌های سطح بعدی
              </span>
              <span className="text-2xl font-black text-slate-700 dark:text-slate-300 font-mono">
                {Math.max(0, totalSkillsCount - assessments.length)}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 divide-y divide-slate-100 dark:divide-slate-800">
            {assessments.length > 0 ? (
              assessments.map((ass) => (
                <div key={ass.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        ass.status === 'PASSED'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700'
                      }`}
                    >
                      {ass.status === 'PASSED' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {ass.skill_name || 'سرفصل مهارت'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        مربی ارزیاب: {ass.assessed_by_name || 'مربی رسمی'} · تاریخ: {ass.assessment_date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {ass.score && (
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                        امتیاز: {ass.score}/۱۰
                      </span>
                    )}
                    <Badge variant={ass.status === 'PASSED' ? 'success' : 'warning'}>
                      {ass.status_display || (ass.status === 'PASSED' ? 'کسب‌شده' : 'در حال تمرین')}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                هنوز رکورد ارزیابی مهارتی برای این شناگر ثبت نشده است.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Progress Trends */}
      {activeTab === 'TRENDS' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                روند امتیازدهی ارزیابی‌ها بر پایه داده‌های واقعی مربی
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تغییرات نمرات کسب‌شده در آزمون‌های ادواری
              </p>
            </div>
          </div>

          {assessments.length > 0 ? (
            <div className="space-y-4 pt-2">
              {assessments.map((ass) => {
                const scoreVal = ass.score ? Number(ass.score) : 7;
                const percent = Math.min(100, Math.round((scoreVal / 10) * 100));
                return (
                  <div key={ass.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {ass.skill_name || 'مهارت فنی'} ({ass.assessment_date})
                      </span>
                      <span className="font-mono font-bold text-sky-600">
                        نمره: {scoreVal} از ۱۰
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-cyan-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              داده‌های نموداری پس از ثبت اولین ارزیابی توسط مربی در دسترس خواهد بود.
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Coach Feedback */}
      {activeTab === 'FEEDBACK' && (
        <div className="space-y-4">
          {assessments.filter((a) => a.notes).length > 0 ? (
            assessments
              .filter((a) => a.notes)
              .map((ass) => (
                <div
                  key={ass.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center text-xs font-bold">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          مربی: {ass.assessed_by_name || 'کادر فنی آکادمی'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          بابت مهارت: {ass.skill_name} · تاریخ: {ass.assessment_date}
                        </span>
                      </div>
                    </div>
                    <Badge variant={ass.status === 'PASSED' ? 'success' : 'warning'}>
                      {ass.status_display}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    «{ass.notes}»
                  </p>
                </div>
              ))
          ) : (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                هنوز یادداشت یا بازخورد متنی از سوی مربی ثبت نشده است
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                توصیه‌های تمرینی مربی پس از هر جلسه ارزیابی در این بخش درج خواهد شد.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
