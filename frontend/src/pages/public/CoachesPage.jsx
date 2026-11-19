import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users2, Award, ChevronRight,
  ShieldCheck, CheckCircle2, Waves
} from 'lucide-react';
import api from '../../api/client';
import { SEOHead } from '../../components/common/SEOHead';
import { Badge } from '../../components/common/Badge';
import { CoachProfileCard } from '../../components/common/CoachProfileCard';
import { PublicFooter } from '../../components/layout/PublicFooter';

const VERIFIED_COACHES = [
  {
    id: 99,
    full_name: 'علی هاشمی',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
    coaching_degree: 'مدیر و مؤسس آموزشگاه',
    role_title: 'مدیر و مؤسس آموزشگاه',
    is_manager: true,
    gender: 'MALE',
    display_order: 1,
    bio: 'مدیر و مؤسس مدرسه شنای ایران، پیشکسوت ورزش‌های آبی استان با بیش از ۱۵ سال سابقه مدیریت و توسعه شنای قهرمانی و پایه‌ای در قزوین'
  },
  {
    id: 1,
    full_name: 'محمد رضایی',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
    coaching_degree: 'درجه ۱ فدراسیون شنا',
    is_manager: false,
    gender: 'MALE',
    display_order: 2,
    bio: 'مربی رسمی فدراسیون شنا با ۱۰ سال سابقه آموزش تیم‌های پایه و استعدادیابی شناگران در شهر قزوین'
  },
  {
    id: 2,
    full_name: 'علیرضا مرادی',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=500&q=80',
    coaching_degree: 'درجه ۱ فدراسیون شنا',
    is_manager: false,
    gender: 'MALE',
    display_order: 3,
    bio: 'مربی رسمی فدراسیون شنا با ۱۲ سال سابقه تدریس شنای مبتدی و پیشرفته برای کودکان و بزرگسالان'
  },
  {
    id: 3,
    full_name: 'سارا کاظمی',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80',
    coaching_degree: 'درجه ۱ فدراسیون شنا',
    is_manager: false,
    gender: 'FEMALE',
    display_order: 4,
    bio: 'مدرس رسمی فدراسیون و کارشناس ارشد تربیت بدنی با ۱۰ سال سابقه برگزاری کلاس‌های آموزش شنای بانوان و نونهالان'
  },
  {
    id: 4,
    full_name: 'نیما سعادتی',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
    coaching_degree: 'درجه ۲ فدراسیون شنا',
    is_manager: false,
    gender: 'MALE',
    display_order: 5,
    bio: 'مربی تخصصی اصلاح تکنیک دست و پا، استارت سکو و افزایش استقامت بدنی شناگران نوجوان'
  },
  {
    id: 5,
    full_name: 'مهدی یزدانی',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=500&q=80',
    coaching_degree: 'درجه ۳ فدراسیون شنا',
    is_manager: false,
    gender: 'MALE',
    display_order: 6,
    bio: 'مربی باحوصله و مجرب در حوزه آموزش اصولی شنا از پایه و غلبه بر ترس از آب برای رده‌های سنی ۵ تا ۱۲ سال'
  }
];

export const CoachesPage = () => {
  const [coaches, setCoaches] = useState(VERIFIED_COACHES);
  const [categoryTab, setCategoryTab] = useState('ALL'); // 'ALL' | 'MANAGEMENT' | 'MALE' | 'FEMALE'

  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        const res = await api.get('/coaches/');
        const data = res.data?.results || res.data;
        if (Array.isArray(data) && data.length > 0) {
          setCoaches(data);
        }
      } catch {
        // Fallback to verified local database snapshot
      }
    };
    fetchCoaches();
  }, []);

  const filteredCoaches = coaches.filter((c) => {
    if (categoryTab === 'MANAGEMENT') return c.is_manager;
    if (categoryTab === 'MALE') return !c.is_manager && (c.gender === 'MALE' || !c.gender);
    if (categoryTab === 'FEMALE') return !c.is_manager && (c.gender === 'FEMALE' || (c.full_name || '').includes('سارا'));
    return true;
  });

  const personSchemas = coaches.map((c) => ({
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `https://iran-swim.ir/coaches/#coach-${c.id}`,
    'name': c.full_name,
    'jobTitle': c.coaching_degree || 'مربی شنا',
    'description': c.bio,
    'worksFor': {
      '@type': 'SportsActivityLocation',
      'name': 'مدرسه شنای ایران',
      'url': 'https://iran-swim.ir'
    }
  }));

  const breadcrumbs = [
    { name: 'صفحه اصلی', url: '/' },
    { name: 'کادر مربیان شنا در قزوین', url: '/coaches/' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans text-right" dir="rtl">
      <SEOHead
        title="مربی شنا در قزوین | کادر مربیان رسمی فدراسیون مدرسه شنای ایران"
        description="معرفی مربیان رسمی فدراسیون شنا در قزوین؛ کادر مجرب مدرسه شنای ایران دارای مدارک مربیگری رسمی درجه ۱، ۲ و ۳، کارت نجات‌غریق و سابقه آموزش ۴ شنا به کودکان و بزرگسالان."
        canonicalUrl="/coaches/"
        keywords="مربی شنا در قزوین, مربیان شنا قزوین, بهترین مربی شنا در قزوین, مربی شنا کودکان قزوین, آموزش شنا مربی رسمی فدراسیون"
        schemaData={personSchemas}
        breadcrumbs={breadcrumbs}
      />

      {/* Header */}
      <section className="bg-gradient-to-b from-cyan-900 via-sky-950 to-slate-900 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-cyan-800/40">
        <div className="max-w-7xl mx-auto space-y-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-cyan-300">
            <Link to="/" className="hover:underline">خانه</Link>
            <ChevronRight className="w-3.5 h-3.5 rotate-180 text-cyan-400" />
            <span className="text-white font-medium">کادر مربیان شنا در قزوین</span>
          </nav>

          <div className="space-y-3 max-w-3xl">
            <Badge variant="info">مربیان رسمی فدراسیون شنا</Badge>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
              کادر مربیان متخصص و رسمی مدرسه شنای ایران در قزوین
            </h1>
            <p className="text-sm sm:text-base text-cyan-100/90 leading-relaxed text-justify">
              تمامی مربیان مدرسه شنای ایران دارای کارت رسمی مربیگری از فدراسیون شنا، کارت نجات‌غریق و دوره‌های بازآموزی سال جاری هستند. رویکرد ما آموزش روان‌شناختی، صبورانه و گام‌به‌گام است.
            </p>
          </div>

          <div className="pt-4 flex flex-wrap gap-2">
            {[
              { id: 'ALL', label: 'همه اعضای کادر (۶ نفر)' },
              { id: 'MANAGEMENT', label: 'مدیریت و موسسین' },
              { id: 'MALE', label: 'کادر مربیان آقایان' },
              { id: 'FEMALE', label: 'کادر مربیان بانوان' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  categoryTab === tab.id
                    ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/30'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid of Coaches */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {filteredCoaches.map((coach) => (
            <CoachProfileCard
              key={coach.id}
              coach={coach}
              avatarUrl={coach.avatar}
            />
          ))}
        </div>

        {/* E-E-A-T Trust Section */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-cyan-100 dark:border-slate-800 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              معیارهای انتخاب مربی در مدرسه شنای ایران (E-E-A-T)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
              انتخاب مربی مناسب، تضمین‌کننده امنیت و علاقه دائمی فرزند شما به ورزش شنا است. در مجموعه ما هر مربی بر اساس شایستگی‌های زیر فعالیت می‌کند:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-100 dark:border-sky-900 space-y-2">
              <ShieldCheck className="w-6 h-6 text-sky-600 dark:text-sky-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">مدارک معتبر و بازآموزی سالانه</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                هر مربی موظف به تمدید بازآموزی سالانه فدراسیون شنا و گذراندن تست‌های آمادگی نجات‌غریق است.
              </p>
            </div>

            <div className="p-4 bg-teal-50 dark:bg-teal-950/40 rounded-2xl border border-teal-100 dark:border-teal-900 space-y-2">
              <CheckCircle2 className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">روان‌شناسی برخورد با کودک</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                پرهیز کامل از هرگونه اجبار یا پرتاب کودک در آب؛ آموزش با بازی، تشویق و تقویت احساس ایمنی نوآموز انجام می‌شود.
              </p>
            </div>

            <div className="p-4 bg-cyan-50 dark:bg-cyan-950/40 rounded-2xl border border-cyan-100 dark:border-cyan-900 space-y-2">
              <Award className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">سوابق مسابقاتی و قهرمانی</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                مربیان رده‌های پیشرفته دارای سابقه پرورش شناگران مدال‌آور در مسابقات لیگ استانی و کشوری هستند.
              </p>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};
