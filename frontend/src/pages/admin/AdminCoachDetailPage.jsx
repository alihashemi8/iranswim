import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  UserCheck, Calendar, Clock, MapPin, Users, Award, Shield,
  Phone, Edit3, ArrowRight, BookOpen, CheckCircle2, AlertTriangle,
  FileText, Plus, Save, Hash
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { CustomSelect } from '../../components/common/CustomSelect';
import { StatsCard } from '../../components/common/StatsCard';
import { useToast } from '../../context/ToastContext';

export const AdminCoachDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [coach, setCoach] = useState(null);
  const [assignedGroups, setAssignedGroups] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('INFO'); // 'INFO', 'GROUPS', 'SCHEDULE', 'EDIT'

  // Edit Form State
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    national_id: '',
    specialties: '',
    bio: '',
    employment_status: 'ACTIVE',
    hourly_rate: 0,
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [coachRes, assignedRes, sessionsRes] = await Promise.all([
        api.get(`/coaches/${id}/`),
        api.get(`/education/group-coaches/?coach_id=${id}`),
        api.get(`/scheduling/sessions/?coach_id=${id}`),
      ]);

      const cData = coachRes.data;
      setCoach(cData);
      setAssignedGroups(assignedRes.data.results || assignedRes.data || []);
      setSessions(sessionsRes.data.results || sessionsRes.data || []);

      setEditForm({
        first_name: cData.first_name || '',
        last_name: cData.last_name || '',
        phone: cData.phone || '',
        national_id: cData.national_id || '',
        specialties: cData.specialties || '',
        bio: cData.bio || '',
        employment_status: cData.employment_status || 'ACTIVE',
        hourly_rate: cData.hourly_rate || 0,
      });
    } catch (err) {
      console.error('Error fetching coach details:', err);
      toast.error('خطا در دریافت پرونده مربی');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Calculate total weekly hours
  const totalWeeklyMinutes = useMemo(() => {
    let mins = 0;
    assignedGroups.forEach((assign) => {
      (assign.schedules || []).forEach((sch) => {
        const [sh, sm] = (sch.start_time || '00:00').slice(0, 5).split(':').map(Number);
        const [eh, em] = (sch.end_time || '00:00').slice(0, 5).split(':').map(Number);
        const diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff > 0) mins += diff;
      });
    });
    return mins;
  }, [assignedGroups]);

  const totalWeeklyHours = (totalWeeklyMinutes / 60).toFixed(1);

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.patch(`/coaches/${id}/`, {
        ...editForm,
        hourly_rate: Number(editForm.hourly_rate || 0),
      });
      toast.success('مشخصات مربی با موفقیت به‌روزرسانی شد.');
      fetchData();
      setActiveTab('INFO');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.phone || err.response?.data?.detail || 'خطا در ذخیره تغییرات مربی');
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (v) => Number(v || 0).toLocaleString('fa-IR');

  const statusOptions = [
    { value: 'ACTIVE', label: 'فعال و مجاز (Active)' },
    { value: 'SUSPENDED', label: 'معلق موقت (Suspended)' },
    { value: 'INACTIVE', label: 'پایان همکاری / غیرفعال (Inactive)' },
  ];

  if (loading) {
    return (
      <div className="py-12">
        <LoadingState type="cards" count={3} message="در حال دریافت پرونده کامل مربی..." />
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center">
        <p className="text-slate-600 dark:text-slate-400">مربی مورد نظر یافت نشد.</p>
        <Button onClick={() => navigate('/admin/coaches')} className="mt-4 gap-2">
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به کادر مربیان</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/coaches')}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer shadow-xs"
            title="بازگشت به کادر مربیان"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">کادر مربیان</span>
              <span className="text-xs text-slate-300 dark:text-slate-700">/</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                پروفایل مربی
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-sky-600" />
              پرونده مربی: {coach.full_name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/coaches/${coach.id}/schedule`)}
            className="gap-1.5 text-xs bg-white dark:bg-slate-900 shadow-xs"
          >
            <Calendar className="w-4 h-4 text-sky-600" />
            <span>برنامه کلاسی (جدول روز در ساعت)</span>
          </Button>

          <Button
            onClick={() => navigate(`/admin/coaches/${coach.id}/assign`)}
            className="gap-1.5 text-xs bg-sky-600 hover:bg-sky-500 text-white shadow-xs"
          >
            <BookOpen className="w-4 h-4" />
            <span>تخصیص گروه</span>
          </Button>
        </div>
      </div>

      {/* Hero Profile Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6 transition-colors">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-sky-600 via-cyan-500 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg ring-4 ring-sky-50 dark:ring-sky-950/40 shrink-0">
            {coach.avatar ? (
              <img src={coach.avatar} alt={coach.full_name} className="w-full h-full object-cover rounded-3xl" />
            ) : (
              coach.full_name?.charAt(0) || 'C'
            )}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                {coach.full_name}
              </h2>
              <Badge
                variant={
                  coach.employment_status === 'ACTIVE'
                    ? 'success'
                    : coach.employment_status === 'SUSPENDED'
                    ? 'warning'
                    : 'neutral'
                }
              >
                {coach.employment_status === 'ACTIVE'
                  ? 'فعال و مجاز'
                  : coach.employment_status === 'SUSPENDED'
                  ? 'معلق'
                  : 'غیرفعال'}
              </Badge>
            </div>

            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-sky-600" />
                <span className="font-mono">{coach.phone}</span>
              </span>
              {coach.national_id && (
                <span className="flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-emerald-600" />
                  <span>کد ملی: <strong className="font-mono">{coach.national_id}</strong></span>
                </span>
              )}
              <span>•</span>
              <span>تاریخ عضویت: {coach.created_at ? new Date(coach.created_at).toLocaleDateString('fa-IR') : '—'}</span>
            </div>
          </div>
        </div>

        {/* Action quick links */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setActiveTab('EDIT')}
            className="gap-1.5 text-xs"
          >
            <Edit3 className="w-4 h-4 text-sky-600" />
            <span>ویرایش مشخصات</span>
          </Button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="گروه‌های آموزشی فعال"
          value={`${assignedGroups.length} گروه`}
          subtitle="تحت آموزش این مربی"
          icon={BookOpen}
          color="sky"
        />
        <StatsCard
          title="ساعات تدریس هفتگی"
          value={`${totalWeeklyHours} ساعت`}
          subtitle="مجموع زمان کلاس‌ها در هفته"
          icon={Clock}
          color="emerald"
        />
        <StatsCard
          title="جلسات تقویمی ثبت‌شده"
          value={`${sessions.length} جلسه`}
          subtitle="در تقویم آموزشی آموزشگاه"
          icon={Calendar}
          color="indigo"
        />
        <StatsCard
          title="نرخ ساعتی حق‌التدریس"
          value={`${formatPrice(coach.hourly_rate)} تومان`}
          subtitle="محاسبه در حقوق و دستمزد"
          icon={Award}
          color="amber"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('INFO')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'INFO'
                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>مشخصات فردی و تخصص‌ها</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('GROUPS')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'GROUPS'
                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>گروه‌های آموزشی تحت نظر ({assignedGroups.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SCHEDULE')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'SCHEDULE'
                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>پیش‌نمایش برنامه کلاسی هفتگی</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('EDIT')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'EDIT'
                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>ویرایش پرونده و دستمزد</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PERSONAL INFO & BIO */}
      {activeTab === 'INFO' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Award className="w-4 h-4 text-sky-600" />
                تخصص‌های آموزشی و حوزه‌های مربیگری
              </h3>

              <div className="flex flex-wrap gap-2">
                {(coach.specialties || 'شنای عمومی، کرال سینه، شنای قورباغه')
                  .split(/[,،]+/)
                  .map((spec, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-semibold"
                    >
                      {spec.trim()}
                    </span>
                  ))}
              </div>

              {coach.bio && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    بیوگرافی، مدارک و سوابق کاری:
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    {coach.bio}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm pb-3 border-b border-slate-100 dark:border-slate-800">
                مشخصات حساب کاربری
              </h3>

              <div className="space-y-3 text-slate-600 dark:text-slate-300">
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">نام و نام خانوادگی:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{coach.full_name}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">شماره همراه (نام کاربری):</span>
                  <span className="font-mono font-semibold">{coach.phone}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">کد ملی:</span>
                  <span className="font-mono">{coach.national_id || 'ثبت نشده'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">وضعیت همکاری:</span>
                  <Badge variant={coach.employment_status === 'ACTIVE' ? 'success' : 'neutral'}>
                    {coach.employment_status === 'ACTIVE' ? 'فعال و مجاز' : coach.employment_status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">حق‌التدریس ساعتی:</span>
                  <span className="font-bold font-mono text-sky-600 dark:text-sky-400">
                    {formatPrice(coach.hourly_rate)} تومان
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ASSIGNED GROUPS */}
      {activeTab === 'GROUPS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              گروه‌های آموزشی تحت نظر مربی ({assignedGroups.length})
            </h3>
            <Button
              onClick={() => navigate(`/admin/coaches/${coach.id}/assign`)}
              className="gap-1.5 text-xs bg-sky-600 hover:bg-sky-500 text-white"
            >
              <Plus className="w-4 h-4" />
              <span>تخصیص به گروه جدید</span>
            </Button>
          </div>

          {assignedGroups.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
              هنوز گروه آموزشی‌ای به این مربی تخصیص نیافته است.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedGroups.map((assign) => (
                <div
                  key={assign.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:border-sky-300 dark:hover:border-sky-700 transition-all flex flex-col justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {assign.group_name}
                        </h4>
                        <span className="text-xs text-slate-400 block mt-0.5">
                          {assign.course_name}
                        </span>
                      </div>
                      <Badge variant="neutral" style={{ backgroundColor: assign.level_color || '#0284c7', color: '#fff' }}>
                        {assign.level_name}
                      </Badge>
                    </div>

                    <div className="mt-3 space-y-2 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span className="font-mono">
                          {(assign.schedules || [])
                            .map((s) => `${s.weekday_display} ${s.start_time?.slice(0, 5)}`)
                            .join('، ') || 'بدون زمان‌بندی'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{assign.pool_location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>ظرفیت: {assign.capacity} نفر ({assign.enrolled_count || 0} شناگر ثبت‌نام‌شده)</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <Badge variant={assign.is_primary ? 'success' : 'neutral'}>
                      {assign.is_primary ? 'مربی اصلی' : 'مربی کمکی'}
                    </Badge>

                    <Link
                      to={`/admin/coaches/${coach.id}/assign`}
                      className="text-sky-600 hover:text-sky-700 dark:text-sky-400 font-semibold"
                    >
                      مدیریت تخصیص ←
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SCHEDULE PREVIEW */}
      {activeTab === 'SCHEDULE' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                خلاصه برنامه کلاسی هفتگی مربی
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                برای مشاهده و ویرایش جدول روز در ساعت کامل، روی دکمه مشاهده جدول کلیک کنید
              </p>
            </div>
            <Button
              onClick={() => navigate(`/admin/coaches/${coach.id}/schedule`)}
              className="gap-1.5 text-xs bg-sky-600 hover:bg-sky-500 text-white"
            >
              <Calendar className="w-4 h-4" />
              <span>مشاهده جدول کامل روز در ساعت</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedGroups.map((grp) => (
              <div
                key={grp.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 text-xs space-y-2"
              >
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                  <span>{grp.group_name}</span>
                  <Badge variant="neutral" style={{ backgroundColor: grp.level_color || '#0284c7', color: '#fff' }}>
                    {grp.level_name}
                  </Badge>
                </div>
                <div className="text-slate-500 dark:text-slate-400 space-y-1">
                  {(grp.schedules || []).map((s, sIdx) => (
                    <div key={sIdx} className="flex items-center justify-between font-mono">
                      <span>{s.weekday_display}</span>
                      <span className="text-sky-600 font-semibold">{s.start_time?.slice(0, 5)} تا {s.end_time?.slice(0, 5)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: EDIT FORM */}
      {activeTab === 'EDIT' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs max-w-3xl">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-sky-600" />
            ویرایش مشخصات، تخصص‌ها و وضعیت کاری مربی
          </h3>

          <form onSubmit={handleEditSubmit} className="mt-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نام *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نام خانوادگی *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  شماره همراه (شناسه ورود) *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  کد ملی
                </label>
                <input
                  type="text"
                  value={editForm.national_id}
                  onChange={(e) => setEditForm({ ...editForm, national_id: e.target.value })}
                  className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  وضعیت همکاری
                </label>
                <CustomSelect
                  value={editForm.employment_status}
                  onChange={(val) => setEditForm({ ...editForm, employment_status: val })}
                  options={statusOptions}
                  color="sky"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نرخ حق‌التدریس ساعتی (تومان)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={editForm.hourly_rate}
                  onChange={(e) => setEditForm({ ...editForm, hourly_rate: e.target.value })}
                  className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                تخصص‌های آموزشی (با کاما جدا کنید)
              </label>
              <input
                type="text"
                placeholder="کرال سینه، قورباغه، پروانه، نجات غریق..."
                value={editForm.specialties}
                onChange={(e) => setEditForm({ ...editForm, specialties: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                بیوگرافی و رزومه
              </label>
              <textarea
                rows={4}
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 leading-relaxed"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('INFO')}
              >
                انصراف
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-sky-600 hover:bg-sky-500 text-white gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'در حال ذخیره...' : 'ذخیره تغییرات پرونده'}</span>
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
