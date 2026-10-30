import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, ArrowRight, MapPin, Clock, Calendar,
  GraduationCap, Users, Check, CheckCircle2, Award,
  Sparkles, DollarSign, Layers, Search
} from 'lucide-react';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';

export const AdminCreateCoursePage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [coaches, setCoaches] = useState([]);
  const [loadingCoaches, setLoadingCoaches] = useState(true);
  const [coachSearch, setCoachSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    gender: 'MALE',
    age_range: '',
    pool_location: 'استخر شهید رئیسی',
    days_of_week: 'سه‌شنبه و پنج‌شنبه',
    start_time: '17:00',
    end_time: '19:00',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
    base_price: '1500000',
    sessions_count: 12,
    status: 'ACTIVE',
    what_you_learn: '',
    description: '',
    coach_ids: [],
  });

  // Fetch coaches
  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        setLoadingCoaches(true);
        const res = await api.get('/coaches/');
        setCoaches(res.data.results || res.data || []);
      } catch (err) {
        console.error(err);
        toast.error('خطا در دریافت لیست کادر مربیان');
      } finally {
        setLoadingCoaches(false);
      }
    };
    fetchCoaches();
  }, []);

  const toggleCoach = (coachId) => {
    setFormData((prev) => {
      const exists = prev.coach_ids.includes(coachId);
      const next = exists
        ? prev.coach_ids.filter((id) => id !== coachId)
        : [...prev.coach_ids, coachId];
      return { ...prev, coach_ids: next };
    });
  };

  const toggleDay = (dayName) => {
    setFormData((prev) => {
      const currentDays = prev.days_of_week ? prev.days_of_week.split(' و ') : [];
      const exists = currentDays.includes(dayName);
      let nextDays;
      if (exists) {
        nextDays = currentDays.filter((d) => d !== dayName);
      } else {
        nextDays = [...currentDays, dayName];
      }
      return { ...prev, days_of_week: nextDays.join(' و ') };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('لطفاً عنوان دوره را وارد کنید.');
      return;
    }
    if (!formData.start_date || !formData.end_date) {
      toast.error('لطفاً تاریخ شروع و پایان دوره را مشخص کنید.');
      return;
    }
    if (!formData.base_price || Number(formData.base_price) <= 0) {
      toast.error('لطفاً مبلغ شهریه معتبر وارد کنید.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/education/courses/', {
        ...formData,
        base_price: Number(formData.base_price),
        sessions_count: Number(formData.sessions_count),
      });

      toast.success('دوره آموزشی و کلاس‌های مربیان با موفقیت ایجاد گردید.');
      navigate('/admin/courses');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت دوره آموزشی');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (v) => Number(v || 0).toLocaleString('fa-IR');

  const filteredCoaches = coaches.filter((c) => {
    if (!coachSearch.trim()) return true;
    const query = coachSearch.trim().toLowerCase();
    const name = (c.full_name || '').toLowerCase();
    const spec = (c.specialties || '').toLowerCase();
    return name.includes(query) || spec.includes(query);
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/courses"
            className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors shrink-0"
            title="بازگشت به لیست دوره‌ها"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sky-600" />
              تعریف دوره آموزشی جدید
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تنظیم مشخصات زمانی، محل برگزاری، شهریه و تعیین کادر مربیان دوره
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/courses')}
            className="text-xs"
          >
            انصراف
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="text-xs bg-sky-600 hover:bg-sky-700 text-white font-bold px-5"
          >
            {submitting ? 'در حال ثبت...' : 'ثبت و ایجاد دوره'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 2. SECTION: Basic Course Information */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              مشخصات عمومی و سرفصل‌های دوره
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                عنوان دوره آموزشی *
              </label>
              <input
                type="text"
                required
                placeholder="مثال: دوره نوجوانان یا دوره آموزش کرال سینه"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                جنسیت مجاز *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
              >
                <option value="MALE">پسران / آقایان</option>
                <option value="FEMALE">دختران / بانوان</option>
                <option value="ALL">عمومی (پسران و دختران)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                رده سنی مخاطبان
              </label>
              <input
                type="text"
                placeholder="مثال: نوجوانان (۱۲ تا ۱۶ سال)"
                value={formData.age_range}
                onChange={(e) => setFormData({ ...formData, age_range: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                وضعیت اولیه دوره
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
              >
                <option value="ACTIVE">در حال برگزاری (ثبت‌نام باز)</option>
                <option value="UPCOMING">پیش‌ثبت‌نام</option>
                <option value="COMPLETED">خاتمه‌یافته</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              آنچه در این دوره یاد می‌گیرند (سرفصل‌ها و مهارت‌های آموزشی)
            </label>
            <textarea
              rows={2}
              placeholder="مثال: تکنیک‌های کرال سینه، تنفس ریتمیک، استقامت، استارت و چرخش صحیح در لاین"
              value={formData.what_you_learn}
              onChange={(e) => setFormData({ ...formData, what_you_learn: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              توضیحات و اهداف تکمیلی دوره
            </label>
            <textarea
              rows={2}
              placeholder="توضیحات کلی برای اولیا و شناگران در سامانه و پرتال..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* 3. SECTION: Pool Location & Schedule */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                محل برگزاری، روزها و ساعات هفتگی
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {formData.days_of_week} ({formData.start_time} تا {formData.end_time})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                استخر و محل برگزاری دوره *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="مثال: استخر شهید رئیسی"
                  value={formData.pool_location}
                  onChange={(e) => setFormData({ ...formData, pool_location: e.target.value })}
                  className="w-full pl-3 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100 font-semibold"
                />
              </div>
            </div>

            {/* Weekdays Selector */}
            <div className="sm:col-span-3 space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                روزهای برگزاری کلاس‌ها در هفته *
              </label>
              <div className="flex flex-wrap gap-2">
                {['شنبه', 'یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'].map((day) => {
                  const isSelected = (formData.days_of_week || '').includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-sky-600 text-white shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-sky-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      <span>{day}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                ساعت شروع جلسه *
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="time"
                  required
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full pl-3 pr-10 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                ساعت پایان جلسه *
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="time"
                  required
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full pl-3 pr-10 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                تعداد کل جلسات دوره *
              </label>
              <input
                type="number"
                required
                min="1"
                max="100"
                value={formData.sessions_count}
                onChange={(e) => setFormData({ ...formData, sessions_count: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                تاریخ شروع دوره *
              </label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                تاریخ پایان دوره *
              </label>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* 4. SECTION: Course Coaching Staff (کادر مربیان دوره) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  کادر مربیان دوره آموزشی
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                مربیان مسئول این دوره را انتخاب کنید. به ازای هر مربی انتخاب‌شده، یک کلاس اختصاصی برای این دوره تشکیل خواهد شد.
              </p>
            </div>

            <span className="text-xs font-mono font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              {formData.coach_ids.length} مربی انتخاب شده
            </span>
          </div>

          {/* Coach Search Bar */}
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={coachSearch}
              onChange={(e) => setCoachSearch(e.target.value)}
              placeholder="جستجو در نام مربی یا تخصص..."
              className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Coaches Grid */}
          {loadingCoaches ? (
            <div className="p-8 text-center text-xs text-slate-400">
              در حال دریافت لیست کادر مربیان...
            </div>
          ) : filteredCoaches.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              مربی فعالی در سیستم یافت نشد.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredCoaches.map((c) => {
                const isSelected = formData.coach_ids.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleCoach(c.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group select-none ${
                      isSelected
                        ? 'bg-sky-50/80 dark:bg-sky-950/50 border-sky-400 dark:border-sky-600 shadow-2xs'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/90 dark:border-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Coach Avatar */}
                      <div className="relative shrink-0">
                        {c.avatar ? (
                          <img
                            src={c.avatar}
                            alt={c.full_name}
                            className="w-11 h-11 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                            {c.full_name ? c.full_name.charAt(0) : 'م'}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -left-1 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                      </div>

                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-900 dark:text-white block truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                          {c.full_name}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                          {c.specialties || 'مربی رسمی شنا'}
                        </span>
                        {isSelected && (
                          <span className="inline-block text-[10px] text-sky-700 dark:text-sky-300 font-bold bg-sky-100 dark:bg-sky-900/60 px-2 py-0.5 rounded-md mt-1">
                            کلاس اختصاصی: {c.full_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Checkbox button */}
                    <div
                      className={`w-6 h-6 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-sky-600 border-sky-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 group-hover:border-slate-400'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 stroke-[2.5]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. SECTION: Financial Settings */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              امور مالی و شهریه ثبت‌نام
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                شهریه پایه هر شناگر (تومان) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  step="10000"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  className="w-full pl-16 pr-3.5 py-2.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                  تومان
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 block mt-1 font-bold">
                معادل: {formatPrice(formData.base_price)} تومان
              </span>
            </div>
          </div>
        </div>

        {/* 6. Form Footer Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/courses')}
            className="text-xs"
          >
            انصراف و بازگشت
          </Button>

          <Button
            type="submit"
            disabled={submitting}
            className="text-xs bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm"
          >
            {submitting ? 'در حال ذخیره‌سازی دوره و ایجاد کلاس‌ها...' : 'ثبت قطعی و تعریف دوره'}
          </Button>
        </div>
      </form>
    </div>
  );
};
