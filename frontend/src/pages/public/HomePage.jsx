import React, { useState, useEffect, useRef } from 'react';
import {
  Waves, Calendar, Clock, MapPin, Award, CheckCircle2,
  ChevronLeft, ChevronRight, ShieldCheck, HeartPulse, Droplets,
  Trophy, Sparkles, Compass, Users2, ArrowLeft, PhoneCall
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { Modal } from '../../components/common/Modal';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const HomePage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState(null);

  const newsScrollRef = useRef(null);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        setLoading(true);
        const [cRes, coachRes, nRes] = await Promise.all([
          api.get('/education/courses/'),
          api.get('/coaches/'),
          api.get('/content/news/'),
        ]);
        setCourses(cRes.data.results || cRes.data);
        setCoaches(coachRes.data.results || coachRes.data);
        setNews(nRes.data.results || nRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLandingData();
  }, []);

  const scrollNews = (direction) => {
    if (newsScrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      newsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // High-res curated avatar images for coaches
  const coachAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  ];

  // Curated imagery for news
  const newsImages = [
    'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?auto=format&fit=crop&w=800&q=80',
  ];

  const formatPrice = (val) => Number(val || 0).toLocaleString('fa-IR');

  return (
    <div className="space-y-20 pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-900 via-sky-800 to-cyan-900 text-white p-8 sm:p-14 lg:p-16 shadow-lg">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-sky-500/20 blur-3xl pointer-events-none"></div>

        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-cyan-200 border border-white/15">
            <Sparkles className="w-3.5 h-3.5" />
            مرکز تخصصی آموزش، استعدادیابی و تمرینات شنا
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight sm:leading-none">
            آکادمی جامع شنای <span className="text-transparent bg-clip-text bg-gradient-to-l from-cyan-300 to-sky-200">ایران</span>
          </h1>

          <p className="text-sm sm:text-base text-sky-100/90 leading-relaxed max-w-2xl font-light">
            شنا تنها یک ورزش نیست؛ مهارت نجات زندگی، تقویت کامل عضلات و آرامش ذهن است.
            در آموزشگاه شنای ایران با بهره‌گیری از مربیان رسمی فدراسیون، استخر استاندارد ۵۰ متری و سیستم پایش مداوم،
            مسیر شما را از نخستین تماس با آب تا کسب رکوردهای قهرمانی هموار ساخته‌ایم.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a
              href="#courses"
              className="px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-md transition-all text-sm inline-flex items-center gap-2"
            >
              <span>مشاهده دوره‌ها و کلاس‌ها</span>
              <ArrowLeft className="w-4 h-4" />
            </a>
            <a
              href="#coaches"
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl border border-white/20 backdrop-blur-md transition-all text-sm"
            >
              آشنایی با کادر مربیان
            </a>
            {user ? (
              <Link
                to={
                  user.role === 'ADMIN' ? '/admin' :
                  user.role === 'COACH' ? '/coach' :
                  user.role === 'SUPERVISOR' ? '/supervisor' : '/swimmer'
                }
                className="px-6 py-3.5 bg-white text-sky-900 hover:bg-sky-50 font-bold rounded-xl shadow-md transition-all text-sm inline-flex items-center gap-2"
              >
                <span>ورود به پیشخوان کاربری</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-6 py-3.5 bg-white text-sky-900 hover:bg-sky-50 font-semibold rounded-xl shadow-md transition-all text-sm"
              >
                ورود / ثبت‌نام اعضا
              </Link>
            )}
          </div>

          {/* Quick Stat Chips */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/10 text-center sm:text-right">
            <div>
              <span className="block text-2xl font-extrabold font-mono text-cyan-300">۲,۵۰۰+</span>
              <span className="text-xs text-sky-200">شناگر آموزش‌دیده</span>
            </div>
            <div>
              <span className="block text-2xl font-extrabold font-mono text-cyan-300">۱۲</span>
              <span className="text-xs text-sky-200">مربی بین‌المللی</span>
            </div>
            <div>
              <span className="block text-2xl font-extrabold font-mono text-cyan-300">۵۰m</span>
              <span className="text-xs text-sky-200">استخر استاندارد المپیک</span>
            </div>
            <div>
              <span className="block text-2xl font-extrabold font-mono text-cyan-300">۳۰°C</span>
              <span className="text-xs text-sky-200">دمای مطبوع دائمی آب</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Why Swimming & Methodology (چرا ورزش شنا و روش آموزش ما؟) */}
      <section id="about" className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="info">اصول و فلسفه آموزشگاه</Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            چرا ورزش شنا و یادگیری اصولی در آکادمی ما؟
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            ورزش شنا یکی از معدود فعالیت‌های بدنی است که تمامی گروه‌های عضلانی را بدون فشار ضربه‌ای به مفاصل تقویت می‌کند.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-sky-300 dark:hover:border-sky-600 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <HeartPulse className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">سلامت قلبی و تنفسی</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              افزایش چشمگیر حجم ریه، بهبود ریتم ضربان قلب و تنظیم اکسیژن‌رسانی به بافت‌ها از مهم‌ترین دستاوردهای شنای مداوم است.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-sky-300 dark:hover:border-sky-600 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">اصلاح ناهنجاری‌های اسکلتی</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              حرکات کنترل‌شده در آب به درمان گودی کمر، افتادگی شانه‌ها و اسکولیوز کمک کرده و ساختار بدنی متقارن ایجاد می‌نماید.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-sky-300 dark:hover:border-sky-600 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">متد آموزشی FINA و ایمنی کامل</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              آموزش مرحله‌به‌مرحله مطابق استانداردهای فدراسیون جهانی شنا، همراه با حضور دائمی ناجیان غریق دارای گواهینامه معتبر.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Courses Section (دوره‌ها و کلاس‌های آموزشی) */}
      <section id="courses" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <Badge variant="info">برنامه آموزشی ترم جاری</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
              دوره‌ها و کلاس‌های در حال برگزاری
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              کلاس‌های تفکیک‌شده بر اساس سطح مهارت، رده سنی و زمان‌بندی منظم
            </p>
          </div>
          <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
            {courses.length} دوره آموزشی فعال
          </span>
        </div>

        {loading ? (
          <LoadingState message="در حال دریافت اطلاعات دوره‌ها و ظرفیت کلاس‌ها..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{course.name}</h3>
                    <Badge variant={course.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {course.status === 'ACTIVE' ? 'فعال' : 'پیش‌ثبت‌نام'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-2">
                    {course.description || 'آموزش تخصصی تکنیک‌های شنا تحت نظارت مربیان رسمی فدراسیون'}
                  </p>

                  <div className="space-y-2 py-3 border-t border-b border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 dark:text-slate-500">تعداد جلسات:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{course.sessions_count} جلسه آموزشی</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 dark:text-slate-500">شهریه کل دوره:</span>
                      <span className="font-bold text-sky-700 dark:text-sky-400 font-mono text-sm">
                        {formatPrice(course.base_price)} تومان
                      </span>
                    </div>
                  </div>

                  {/* Groups list */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      گروه‌های کلاسی این دوره:
                    </span>
                    {course.groups?.map((grp) => (
                      <div
                        key={grp.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-700/60 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{grp.name}</span>
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {grp.remaining_capacity > 0 ? `${grp.remaining_capacity} جای خالی` : 'تکمیل'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{grp.pool_location}</span>
                        </div>
                        {grp.schedules?.map((sch) => (
                          <div key={sch.id} className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {sch.weekday_display} ساعت {sch.start_time?.slice(0, 5)} تا {sch.end_time?.slice(0, 5)}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    to="/login"
                    className="w-full text-center block py-2.5 px-4 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-medium text-xs rounded-xl border border-sky-200 dark:border-sky-800 transition-colors"
                  >
                    ورود به پنل و پیگیری ثبت‌نام
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Coaches Section (کادر مربیان برجسته با عکس گرد و مشخصات زیر آن) */}
      <section id="coaches" className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="success">کادر مربیگری مجرب</Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            مربیان رسمی و قهرمانان آموزشگاه شنای ایران
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            آموزش تحت هدایت مربیان دارای کارت درجه ۱ و ۲ فدراسیون شنا، شیرجه و واترپلو جمهوری اسلامی ایران
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          {coaches.map((coach, index) => {
            const avatarUrl = coachAvatars[index % coachAvatars.length];
            return (
              <div
                key={coach.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 text-center shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Circular Avatar Photo as requested */}
                  <div className="relative w-28 h-28 mx-auto mb-4">
                    <img
                      src={avatarUrl}
                      alt={coach.full_name}
                      className="w-full h-full rounded-full object-cover border-4 border-sky-100 dark:border-sky-900 shadow-sm"
                    />
                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" title="مربی فعال"></div>
                  </div>

                  {/* Coach Specs underneath photo */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{coach.full_name}</h3>
                  <div className="mt-1">
                    <span className="inline-block px-2.5 py-0.5 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[11px] font-semibold rounded-lg border border-sky-200 dark:border-sky-800">
                      مربی فدراسیون
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-3 font-sans">
                    {coach.specialties || 'تخصص در سبک‌های چهارگانه شنا و استقامت'}
                  </p>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed line-clamp-3">
                    {coach.bio || 'مدرس باسابقه دوره‌های تخصصی شنای پایه و قهرمانی با پرورش ده‌ها قهرمان استانی'}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                  وضعیت کاری: فعال و مجاز ✓
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Facilities & Amenities (امکانات استخر) */}
      <section id="facilities" className="bg-slate-100/70 dark:bg-slate-900/60 rounded-3xl p-8 sm:p-12 border border-slate-200/70 dark:border-slate-800 space-y-8 transition-colors">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="info">استانداردهای بهداشتی و ایمنی</Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            امکانات پیشرفته مجموعه استخرهای آکادمی
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            تجهیزات مدرن تصفیه آب و فضای استاندارد جهت تمرینات ورزشی و آرامش خانواده‌ها
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
            <Droplets className="w-7 h-7 text-sky-600 dark:text-sky-400" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">تصفیه گاز اوزون</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              ضدعفونی بدون استفاده از کلر سنگین؛ محافظت کامل از پوست و چشم شناگران حساس و نونهالان.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
            <Trophy className="w-7 h-7 text-amber-500" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">استخر ۵۰ متری المپیک</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              لاین‌های استاندارد مجهز به موج‌گیر مسابقاتی و سکوهای استارت الکترونیک فدراسیونی.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
            <HeartPulse className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">جکوزی و سونای خشک</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              حوضچه آب سرد، سونای بخار گیاهی و جکوزی با فشار ماساژ هیدروتراپی ویژه ریکاوری ورزشکاران.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
            <Users2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">سالن بدنسازی خشک</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              تجهیزات کششی و تمرینات تخصصی تقویت عضلات شانه، پشت و ساق برای افزایش شتاب در آب.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Horizontally Scrolling News Cards (قسمت اخبار با کارت‌های اسکرول افقی) */}
      <section id="news" className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <Badge variant="warning">تازه ترین رویدادها</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
              اخبار و اطلاعیه‌های آکادمی
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              برای مشاهده کارت‌های بیشتر، به صورت افقی اسکرول کنید
            </p>
          </div>

          {/* Navigation arrow buttons for horizontal scroll */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollNews('right')}
              className="p-2.5 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-xs text-slate-700 dark:text-slate-200 transition-colors"
              title="کارت‌های قبلی"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollNews('left')}
              className="p-2.5 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-xs text-slate-700 dark:text-slate-200 transition-colors"
              title="کارت‌های بعدی"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Scrolling Container */}
        <div
          ref={newsScrollRef}
          className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x scroll-smooth no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {news.map((item, index) => {
            const imgUrl = newsImages[index % newsImages.length];
            return (
              <div
                key={item.id}
                className="w-80 sm:w-96 shrink-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between snap-start"
              >
                <div>
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={imgUrl}
                      alt={item.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-sky-800 dark:text-sky-300 text-xs font-semibold rounded-lg shadow-xs">
                        {item.category_display || 'اطلاعیه'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(item.publish_at).toLocaleDateString('fa-IR')}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                      {item.summary || item.body}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    onClick={() => setSelectedNews(item)}
                    className="w-full text-center py-2.5 px-3 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:text-sky-800 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 rounded-xl transition-colors"
                  >
                    مطالعه متن کامل خبر ←
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 pt-12 text-slate-600 dark:text-slate-400 text-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 font-bold text-base mb-2">
              <Waves className="w-5 h-5" />
              <span>آموزشگاه شنای ایران</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              سامانه یکپارچه مدیریت آموزشی، حضور و غیاب، رکوردهای زمانی، امور مالی و پایش باگ‌های سیستمی آموزشگاه شنا.
            </p>
          </div>
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-2">آدرس و هماهنگی:</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              مجموعه ورزشی استخر بین‌المللی آزادی، سالن شماره ۲<br />
              تلفن تماس پشتیبانی: ۰۲۱-۸۸۸۸۸۸۸۸<br />
              ساعات کاری: شنبه تا پنج‌شنبه از ساعت ۰۷:۰۰ الی ۲۲:۰۰
            </p>
          </div>
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-2">دسترسی سریع پرتال:</span>
            <div className="space-y-1.5">
              <Link to="/login" className="block text-sky-600 dark:text-sky-400 hover:underline">ورود اعضا و شناگران</Link>
              <Link to="/login" className="block text-sky-600 dark:text-sky-400 hover:underline">ورود مربیان</Link>
              <Link to="/login" className="block text-sky-600 dark:text-sky-400 hover:underline">ورود مدیریت و ناظر فنی سامانه</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-6 text-center text-slate-400 dark:text-slate-500">
          تمامی حقوق محفوظ است © ۱۴۰۵ - سامانه مدیریت آموزشگاه شنای ایران
        </div>
      </footer>

      {/* News Detail Modal */}
      <Modal
        isOpen={!!selectedNews}
        onClose={() => setSelectedNews(null)}
        title={selectedNews?.title || 'خبر'}
        maxWidth="max-w-3xl"
      >
        {selectedNews && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 rounded-lg">
                دسته‌بندی: {selectedNews.category_display}
              </span>
              <span className="font-mono">
                تاریخ انتشار: {new Date(selectedNews.publish_at).toLocaleDateString('fa-IR')}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              {selectedNews.summary}
            </p>
            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3 whitespace-pre-line">
              {selectedNews.body}
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button size="sm" onClick={() => setSelectedNews(null)}>
                بستن
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
