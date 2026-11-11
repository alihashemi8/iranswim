import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowRight, User, GraduationCap, Award, CheckCircle2,
  Calendar, Clock, MapPin, Users, CreditCard, AlertTriangle,
  Search, Shield, Check, FileText, ChevronLeft, Sparkles, Phone,
  Layers, RefreshCw
} from 'lucide-react';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { CustomSelect } from '../../components/common/CustomSelect';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { BackButton } from '../../components/common/BackButton';
import { useToast } from '../../context/ToastContext';

export const AdminDirectEnrollPage = () => {
  const { id: swimmerIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const querySwimmerId = searchParams.get('swimmer');
  const initialSwimmerId = swimmerIdParam || querySwimmerId || '';

  // Data States
  const [swimmers, setSwimmers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [levels, setLevels] = useState([]);
  const [selectedSwimmer, setSelectedSwimmer] = useState(null);
  const [selectedSwimmerId, setSelectedSwimmerId] = useState(initialSwimmerId);
  const [selectedGroupId, setSelectedGroupId] = useState('');

  // Form Configuration
  const [sessionsCount, setSessionsCount] = useState(12);
  const [installmentsCount, setInstallmentsCount] = useState(1);
  const [adminNotes, setAdminNotes] = useState('');

  // Filtering & Browsing Groups
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  // UI States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [swimmersRes, groupsRes, levelsRes] = await Promise.all([
          api.get('/swimmers/'),
          api.get('/education/groups/'),
          api.get('/education/levels/'),
        ]);

        const swimmersData = swimmersRes.data.results || swimmersRes.data || [];
        const groupsData = groupsRes.data.results || groupsRes.data || [];
        const levelsData = levelsRes.data.results || levelsRes.data || [];

        setSwimmers(swimmersData);
        setGroups(groupsData);
        setLevels(levelsData);

        // If swimmer ID was provided, set selected swimmer
        if (initialSwimmerId) {
          const found = swimmersData.find((s) => String(s.id) === String(initialSwimmerId));
          if (found) {
            setSelectedSwimmer(found);
            setSelectedSwimmerId(String(found.id));
          } else {
            // Fetch individually if not in first page of list
            try {
              const singleRes = await api.get(`/swimmers/${initialSwimmerId}/`);
              setSelectedSwimmer(singleRes.data);
              setSelectedSwimmerId(String(singleRes.data.id));
            } catch {
              console.warn('Could not fetch swimmer by ID');
            }
          }
        }
      } catch (err) {
        console.error('Error loading enrollment setup data', err);
        toast.error('خطا در بارگذاری اطلاعات اولیه ثبت‌نام');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [initialSwimmerId]);

  // Handle swimmer change
  const handleSelectSwimmer = (id) => {
    setSelectedSwimmerId(id);
    const swimmer = swimmers.find((s) => String(s.id) === String(id));
    setSelectedSwimmer(swimmer || null);
  };

  // Selected Group Object
  const currentGroupObj = groups.find((g) => String(g.id) === String(selectedGroupId));
  const maxInst = currentGroupObj?.course_max_installments || 1;
  const courseBasePrice = Number(currentGroupObj?.course_base_price || 0);

  // Filter groups
  const filteredGroups = groups.filter((grp) => {
    if (levelFilter && String(grp.skill_level) !== String(levelFilter)) {
      return false;
    }
    if (groupSearchQuery.trim()) {
      const q = groupSearchQuery.trim().toLowerCase();
      const matchCourse = grp.course_name?.toLowerCase().includes(q);
      const matchName = grp.name?.toLowerCase().includes(q);
      const matchLevel = grp.level_name?.toLowerCase().includes(q);
      const matchPool = grp.pool_location?.toLowerCase().includes(q);
      const matchCoach = grp.coach_assignments?.some((ca) =>
        ca.coach_name?.toLowerCase().includes(q)
      );
      if (!matchCourse && !matchName && !matchLevel && !matchPool && !matchCoach) {
        return false;
      }
    }
    return true;
  });

  // Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSwimmerId) {
      toast.error('لطفاً ابتدا یک شناگر را انتخاب کنید.');
      return;
    }
    if (!selectedGroupId || !currentGroupObj) {
      toast.error('لطفاً یک کلاس یا دوره آموزشی را انتخاب کنید.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        swimmer: Number(selectedSwimmerId),
        group: Number(currentGroupObj.id),
        course: Number(currentGroupObj.course),
        status: 'ACTIVE',
        sessions_purchased: Number(sessionsCount) || 12,
        selected_installments: Number(installmentsCount) || 1,
      };

      await api.post('/education/enrollments/', payload);
      toast.success(
        `ثبت‌نام ${selectedSwimmer?.full_name || 'شناگر'} در کلاس «${currentGroupObj.name}» با موفقیت انجام شد.`
      );

      // Navigate back to swimmer details or swimmers list
      navigate(`/admin/swimmers/${selectedSwimmerId}`);
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.detail ||
          err.response?.data?.non_field_errors?.[0] ||
          'خطا در تکمیل ثبت‌نام شناگر'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <LoadingState type="table" rows={6} message="در حال بارگذاری فرم ثبت‌نام مستقیم..." />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6" dir="rtl">
      {/* 1. Header & Navigation */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <BackButton fallback="/admin/swimmers" title="بازگشت به فهرست شناگران" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Link
              to="/admin/swimmers"
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors font-medium"
            >
              مدیریت شناگران
            </Link>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium">
              ثبت‌نام مستقیم در کلاس
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-sky-600 dark:text-sky-400 shrink-0" />
            <span>ثبت‌نام مستقیم شناگر در دوره آموزشی</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            تخصیص شناگر به کلاس، تعیین سهمیه جلسات و تنظیم نحوه تسویه شهریه و اقساط
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Left/Center Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Swimmer Selection & Profile Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
                  <User className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>۱. مشخصات شناگر</span>
                </div>
                {selectedSwimmer && (
                  <Badge variant={selectedSwimmer.is_active ? 'success' : 'neutral'}>
                    {selectedSwimmer.is_active ? 'پرونده فعال' : 'غیرفعال'}
                  </Badge>
                )}
              </div>

              {/* Swimmer Selector Dropdown if no fixed param or user wants to switch */}
              <div>
                <CustomSelect
                  label="انتخاب یا تغییر شناگر:"
                  icon={User}
                  value={selectedSwimmerId}
                  onChange={(val) => handleSelectSwimmer(val)}
                  placeholder="جستجو و انتخاب شناگر..."
                  searchable
                  clearable
                  menuClassName="w-full"
                  options={swimmers.map((s) => ({
                    value: String(s.id),
                    label: s.full_name,
                    description: [
                      s.phone ? `تلفن: ${s.phone}` : null,
                      s.national_id ? `کد ملی: ${s.national_id}` : null,
                      s.current_level_name ? `سطح: ${s.current_level_name}` : null,
                    ].filter(Boolean).join(' • '),
                    badge: s.current_level_name || 'بدون سطح',
                    icon: User,
                  }))}
                />
              </div>

              {/* Selected Swimmer Profile Detail Card */}
              {selectedSwimmer ? (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50/60 to-slate-50/80 dark:from-sky-950/20 dark:to-slate-800/40 border border-sky-100 dark:border-sky-900/40 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-black text-base flex items-center justify-center shadow-xs shrink-0">
                      {selectedSwimmer.avatar ? (
                        <img
                          src={selectedSwimmer.avatar}
                          alt={selectedSwimmer.full_name}
                          className="w-full h-full object-cover rounded-2xl"
                        />
                      ) : (
                        selectedSwimmer.full_name?.slice(0, 2)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {selectedSwimmer.full_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {selectedSwimmer.phone && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {selectedSwimmer.phone}
                          </span>
                        )}
                        {selectedSwimmer.national_id && (
                          <span className="font-mono">کد ملی: {selectedSwimmer.national_id}</span>
                        )}
                      </div>
                    </div>
                    {selectedSwimmer.current_level_name && (
                      <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        {selectedSwimmer.current_level_name}
                      </span>
                    )}
                  </div>

                  {/* Secondary info pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-sky-100/80 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">تاریخ تولد</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                        {selectedSwimmer.date_of_birth || 'ثبت‌نشده'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">تماس اضطراری / ولی</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium truncate block">
                        {selectedSwimmer.emergency_contact_name
                          ? `${selectedSwimmer.emergency_contact_name} (${selectedSwimmer.emergency_contact_phone || '-'})`
                          : 'ثبت‌نشده'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">مربی اختصاصی</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium truncate block">
                        {selectedSwimmer.coach_name || 'تخصیص‌نیافته'}
                      </span>
                    </div>
                  </div>

                  {/* Medical Note Alert */}
                  {selectedSwimmer.medical_notes && (
                    <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold ml-1">ملاحظات پزشکی:</span>
                        <span>{selectedSwimmer.medical_notes}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  لطفاً شناگر مورد نظر را از دراپ‌داون بالا انتخاب نمایید.
                </div>
              )}
            </div>

            {/* Step 2: Course & Group Selection */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
                  <GraduationCap className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>۲. انتخاب دوره و گروه کلاسی</span>
                </div>
                <span className="text-xs text-slate-400">
                  {filteredGroups.length} کلاس فعال در دسترس
                </span>
              </div>

              {/* Quick Select & Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CustomSelect
                  label="انتخاب سریع از لیست:"
                  icon={GraduationCap}
                  value={selectedGroupId}
                  onChange={(val) => {
                    setSelectedGroupId(val);
                    setInstallmentsCount(1);
                  }}
                  placeholder="یک کلاس را انتخاب کنید..."
                  searchable
                  clearable
                  menuClassName="w-full"
                  options={groups.map((grp) => {
                    const remaining = grp.remaining_capacity ?? 0;
                    const isFull = remaining <= 0;
                    return {
                      value: String(grp.id),
                      label: grp.course_name ? `${grp.course_name} — ${grp.name}` : grp.name,
                      description: [
                        grp.level_name ? `سطح: ${grp.level_name}` : null,
                        grp.pool_location ? `استخر: ${grp.pool_location}` : null,
                        grp.coach_assignments?.length
                          ? `مربی: ${grp.coach_assignments.map((c) => c.coach_name).filter(Boolean).join('، ')}`
                          : null,
                      ].filter(Boolean).join(' • '),
                      badge: isFull ? 'تکمیل ظرفیت' : `${remaining} نفر خالی`,
                      badgeClassName: isFull
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
                      icon: GraduationCap,
                    };
                  })}
                />

                <CustomSelect
                  label="فیلتر بر اساس رده مهارتی:"
                  icon={Award}
                  value={levelFilter}
                  onChange={(val) => setLevelFilter(val)}
                  placeholder="همه رده‌های مهارتی"
                  clearable
                  menuClassName="w-full"
                  options={[
                    { value: '', label: 'همه رده‌های مهارتی' },
                    ...levels.map((lvl) => ({
                      value: String(lvl.id),
                      label: `سطح ${lvl.order}: ${lvl.name}`,
                      icon: Award,
                    })),
                  ]}
                />
              </div>

              {/* Search Within Classes */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={groupSearchQuery}
                  onChange={(e) => setGroupSearchQuery(e.target.value)}
                  placeholder="جستجو در نام دوره، مربی، استخر یا روزهای برگزاری..."
                  className="w-full pr-10 pl-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Interactive Visual Cards Grid */}
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredGroups.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    هیچ کلاسی مطابق فیلترهای جستجو یافت نشد.
                  </div>
                ) : (
                  filteredGroups.map((grp) => {
                    const isSelected = String(grp.id) === String(selectedGroupId);
                    const remaining = grp.remaining_capacity ?? 0;
                    const isFull = remaining <= 0;
                    const price = grp.course_base_price ? Number(grp.course_base_price) : 0;
                    const coachesStr = grp.coach_assignments
                      ?.map((c) => c.coach_name)
                      .filter(Boolean)
                      .join('، ');

                    return (
                      <div
                        key={grp.id}
                        onClick={() => {
                          setSelectedGroupId(String(grp.id));
                          setInstallmentsCount(1);
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-500 dark:border-sky-500 shadow-sm ring-2 ring-sky-500/20'
                            : 'bg-slate-50/60 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                                {grp.course_name ? `${grp.course_name} — ` : ''}
                                {grp.name}
                              </h4>
                              {grp.level_name && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  {grp.level_name}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                              {grp.pool_location && (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-sky-500" />
                                  {grp.pool_location}
                                </span>
                              )}
                              {coachesStr && (
                                <span className="inline-flex items-center gap-1">
                                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                                  مربی: {coachesStr}
                                </span>
                              )}
                              {price > 0 && (
                                <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  {price.toLocaleString('fa-IR')} تومان
                                </span>
                              )}
                            </div>

                            {/* Schedules Display */}
                            {grp.schedules?.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-600 dark:text-slate-300">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {grp.schedules.map((sch, i) => (
                                  <span
                                    key={i}
                                    className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px]"
                                  >
                                    {sch.weekday_display}{' '}
                                    <span className="font-mono">
                                      ({sch.start_time?.slice(0, 5)} الی {sch.end_time?.slice(0, 5)})
                                    </span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Left Side: Capacity & Radio Selection */}
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                isFull
                                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              }`}
                            >
                              {isFull ? 'تکمیل ظرفیت' : `${remaining} از ${grp.capacity || '-'} خالی`}
                            </span>

                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'bg-sky-600 border-sky-600 text-white'
                                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Step 3: Quota & Financial Settings */}
            {currentGroupObj && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">
                  <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>۳. سهمیه جلسات و شرایط پرداخت اقساط</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Sessions Quota */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      تعداد جلسات خریداری‌شده:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={sessionsCount}
                        onChange={(e) => setSessionsCount(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                      <span className="text-xs text-slate-400 shrink-0">جلسه</span>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-1">
                      {[8, 12, 16, 24].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setSessionsCount(num)}
                          className={`flex-1 py-1 text-[11px] font-mono rounded-lg border transition-all cursor-pointer ${
                            Number(sessionsCount) === num
                              ? 'bg-sky-600 text-white border-sky-600 font-bold'
                              : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Installments Selector */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>تعداد اقساط شهریه:</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {installmentsCount > 1 ? `${installmentsCount} قسط` : 'تسویه یکجا'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {Array.from({ length: Math.max(1, maxInst) }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setInstallmentsCount(num)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            installmentsCount === num
                              ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {num === 1 ? 'یکجا (۱ قسط)' : `${num} قسط`}
                        </button>
                      ))}
                    </div>

                    {courseBasePrice > 0 && installmentsCount > 1 && (
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300 pt-1">
                        مبلغ هر قسط تقریبی:{' '}
                        <span className="font-mono font-bold">
                          {Math.round(courseBasePrice / installmentsCount).toLocaleString('fa-IR')}
                        </span>{' '}
                        تومان
                      </p>
                    )}
                  </div>
                </div>

                {/* Registration Notes */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    یادداشت اداری / توضیحات پذیرش (اختیاری):
                  </label>
                  <input
                    type="text"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="مثال: هماهنگی جهت حضور از جلسه آینده، تخفیف معرفی یا نکات پرداخت..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Summary & Final Confirmation Card */}
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>پیش‌نمایش ثبت‌نام کلاسی</span>
              </h3>

              <div className="space-y-3 text-xs">
                {/* Swimmer Item */}
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-400">شناگر:</span>
                  <span className="font-bold text-slate-800 dark:text-white truncate max-w-[180px]">
                    {selectedSwimmer ? selectedSwimmer.full_name : 'انتخاب‌نشده'}
                  </span>
                </div>

                {/* Class Item */}
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-400">کلاس آموزشی:</span>
                  <span className="font-bold text-slate-800 dark:text-white truncate max-w-[180px]">
                    {currentGroupObj ? currentGroupObj.name : 'انتخاب‌نشده'}
                  </span>
                </div>

                {/* Course Item */}
                {currentGroupObj?.course_name && (
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-400">دوره مرجع:</span>
                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                      {currentGroupObj.course_name}
                    </span>
                  </div>
                )}

                {/* Sessions Quota Item */}
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-400">سهمیه جلسات:</span>
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                    {sessionsCount} جلسه
                  </span>
                </div>

                {/* Price Item */}
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-400">شهریه دوره:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {courseBasePrice > 0
                      ? `${courseBasePrice.toLocaleString('fa-IR')} تومان`
                      : 'تعیین‌نشده / رایگان'}
                  </span>
                </div>

                {/* Installments Mode Item */}
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-400">شرایط پرداخت:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {installmentsCount > 1 ? `${installmentsCount} قسط توافقی` : 'تسویه کامل یکجا'}
                  </span>
                </div>
              </div>

              {/* Automatic Actions Info Callout */}
              <div className="p-3 bg-sky-50/70 dark:bg-sky-950/30 rounded-xl border border-sky-100 dark:border-sky-900/50 text-[11px] text-sky-800 dark:text-sky-300 space-y-1">
                <span className="font-bold block">عملیات خودکار پس از ثبت:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400">
                  <li>صدور فاکتور و سررسیدهای اقساط</li>
                  <li>افزودن نام به لیست حضور و غیاب مربی</li>
                  <li>ارسال اعلان دسترسی به پرتال شناگر</li>
                </ul>
              </div>

              {/* Submit & Cancel Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  type="submit"
                  disabled={submitting || !selectedSwimmerId || !selectedGroupId}
                  className="w-full justify-center gap-2 py-3 text-xs sm:text-sm font-bold shadow-sm cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال ثبت قطعی...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تأیید و صدور ثبت‌نام کلاسی</span>
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="w-full justify-center text-xs cursor-pointer"
                >
                  انصراف و بازگشت
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};