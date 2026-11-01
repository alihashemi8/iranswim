import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck, Plus, Calendar, Clock, BookOpen,
  Award, Shield, Phone, Edit, CheckCircle2, AlertTriangle, FileSpreadsheet,
  ChevronLeft, Sparkles, User, Hash, Lock, DollarSign
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { CustomSelect } from '../../components/common/CustomSelect';
import { useToast } from '../../context/ToastContext';
import { exportToCsv } from '../../utils/exportCsv';

export const AdminCoachesPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState(''); // '' | 'MALE' | 'FEMALE'

  // Add Coach Modal State
  const [isAddCoachModalOpen, setIsAddCoachModalOpen] = useState(false);
  const [addCoachForm, setAddCoachForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    national_id: '',
    password: '',
    gender: 'MALE',
    display_order: 1,
    specialties: '',
    bio: '',
    employment_status: 'ACTIVE',
    hourly_rate: '',
  });
  const [addingCoach, setAddingCoach] = useState(false);

  // Edit Status Modal
  const [statusCoach, setStatusCoach] = useState(null);
  const [newStatus, setNewStatus] = useState('ACTIVE');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchCoaches = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (genderFilter) params.gender = genderFilter;

      const coachesRes = await api.get('/coaches/', { params });
      setCoaches(coachesRes.data.results || coachesRes.data);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت اطلاعات مربیان');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoaches();
  }, [statusFilter, genderFilter]);

  // Handle Add Coach Submit
  const handleAddCoachSubmit = async (e) => {
    e.preventDefault();
    if (!addCoachForm.first_name || !addCoachForm.last_name || !addCoachForm.phone) {
      toast.error('لطفاً نام، نام خانوادگی و شماره همراه مربی را وارد کنید.');
      return;
    }

    try {
      setAddingCoach(true);
      await api.post('/coaches/', {
        ...addCoachForm,
        hourly_rate: Number(addCoachForm.hourly_rate || 0),
      });

      toast.success(`مربی جدید "${addCoachForm.first_name} ${addCoachForm.last_name}" با موفقیت ثبت شد.`);
      setIsAddCoachModalOpen(false);
      setAddCoachForm({
        first_name: '',
        last_name: '',
        phone: '',
        national_id: '',
        password: '',
        specialties: '',
        bio: '',
        employment_status: 'ACTIVE',
        hourly_rate: '',
      });
      fetchCoaches();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.phone || err.response?.data?.detail || 'خطا در ثبت مربی جدید';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setAddingCoach(false);
    }
  };

  // Submit Coach Status Update
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!statusCoach) return;

    try {
      setUpdatingStatus(true);
      await api.patch(`/coaches/${statusCoach.id}/`, {
        employment_status: newStatus,
      });
      toast.success(`وضعیت همکاری مربی ${statusCoach.full_name} با موفقیت به‌روزرسانی شد.`);
      setStatusCoach(null);
      fetchCoaches();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در تغییر وضعیت همکاری مربی');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleExportCsv = () => {
    const rows = coaches.map((c) => ({
      name: c.full_name,
      phone: c.phone,
      national_id: c.national_id || '—',
      specialties: c.specialties || '—',
      status: c.employment_status === 'ACTIVE' ? 'فعال' : c.employment_status === 'SUSPENDED' ? 'معلق' : 'غیرفعال',
      hourly_rate: Number(c.hourly_rate || 0).toLocaleString('fa-IR'),
    }));
    exportToCsv('IranSwim_Coaches_List', rows, {
      name: 'نام و نام خانوادگی',
      phone: 'شماره همراه',
      national_id: 'کد ملی',
      specialties: 'تخصص‌ها',
      status: 'وضعیت همکاری',
      hourly_rate: 'نرخ ساعتی (تومان)',
    });
  };

  const formatPrice = (v) => Number(v || 0).toLocaleString('fa-IR');

  const statusFilterOptions = [
    { value: '', label: 'تمام وضعیت‌های کاری' },
    { value: 'ACTIVE', label: 'فعال و مجاز' },
    { value: 'SUSPENDED', label: 'معلق' },
    { value: 'INACTIVE', label: 'غیرفعال' },
  ];

  const statusEditOptions = [
    { value: 'ACTIVE', label: 'فعال و مجاز (Active)' },
    { value: 'SUSPENDED', label: 'معلق موقت (Suspended)' },
    { value: 'INACTIVE', label: 'پایان همکاری / غیرفعال (Inactive)' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-sky-600" />
            مدیریت کادر مربیان، تخصص‌ها و برنامه هفتگی
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            بررسی پرونده حرفه‌ای مربیان، تخصیص کلاس با کنترل تداخل و نظارت بر جلسات کلاسی
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add Coach Button */}
          <Button
            onClick={() => setIsAddCoachModalOpen(true)}
            className="gap-1.5 text-xs bg-sky-600 hover:bg-sky-500 text-white shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن مربی جدید</span>
          </Button>

          {/* Export to Excel */}
          <Button variant="outline" onClick={handleExportCsv} className="gap-1.5 text-xs">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>خروجی اکسل</span>
          </Button>

          {/* Status Filter using CustomSelect */}
          <div className="w-48">
            <CustomSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={statusFilterOptions}
              size="sm"
              color="sky"
              placeholder="فیلتر وضعیت..."
            />
          </div>
        </div>
      </div>

      {/* Gender Filter Pills */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setGenderFilter('')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            genderFilter === ''
              ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          همه مربیان
        </button>
        <button
          type="button"
          onClick={() => setGenderFilter('MALE')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            genderFilter === 'MALE'
              ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          مربیان مرد (آقایان)
        </button>
        <button
          type="button"
          onClick={() => setGenderFilter('FEMALE')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            genderFilter === 'FEMALE'
              ? 'bg-white dark:bg-slate-700 text-pink-700 dark:text-pink-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          مربیان زن (بانوان)
        </button>
      </div>

      {/* Grid of Coaches */}
      {loading ? (
        <LoadingState type="cards" count={6} message="در حال دریافت اطلاعات مربیان آموزشگاه..." />
      ) : coaches.length === 0 ? (
        <EmptyState
          title="مربی‌ای یافت نشد"
          description="با تغییر فیلترها یا افزودن مربی جدید، مربیان ثبت‌شده نمایش داده خواهند شد."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {coaches.map((coach) => (
            <div
              key={coach.id}
              onClick={() => navigate(`/admin/coaches/${coach.id}`)}
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:border-sky-400/80 dark:hover:border-sky-500/80 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
            >
              <div>
                {/* Header Profile */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                      {coach.avatar ? (
                        <img src={coach.avatar} alt={coach.full_name} className="w-full h-full object-cover" />
                      ) : (
                        coach.full_name ? coach.full_name.charAt(0) : 'C'
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                          {coach.full_name}
                        </h3>
                      </div>
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {coach.phone}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
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
                </div>

                {/* Specialties & Bio */}
                <div className="py-3 space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">تخصص‌های آموزشی:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {coach.specialties || 'شنای عمومی و مقدماتی'}
                    </span>
                  </div>

                  {coach.bio && (
                    <div>
                      <span className="text-slate-400 block mb-0.5">بیوگرافی و مدارک:</span>
                      <p className="text-slate-600 dark:text-slate-400 line-clamp-2">{coach.bio}</p>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between text-slate-500 border-t border-slate-100 dark:border-slate-800/60">
                    <span>حق‌التدریس ساعتی:</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                      {formatPrice(coach.hourly_rate)} تومان
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                {/* 1. Navigate to Coach Schedule Page (Day-by-hour table) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin/coaches/${coach.id}/schedule`);
                  }}
                  className="flex-1 py-1.5 px-2 bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-600 dark:hover:text-sky-300 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200/60 dark:border-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="مشاهده برنامه کلاسی هفتگی (روز در ساعت)"
                >
                  <Calendar className="w-3.5 h-3.5 text-sky-600" />
                  <span>برنامه کلاسی</span>
                </button>

                {/* 2. Navigate to Group Assignment Page */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin/coaches/${coach.id}/assign`);
                  }}
                  className="flex-1 py-1.5 px-2 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 rounded-xl text-xs font-semibold border border-sky-200 dark:border-sky-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="تخصیص گروه آموزشی به این مربی"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>تخصیص گروه</span>
                </button>

                {/* 3. Quick Status Toggle */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatusCoach(coach);
                    setNewStatus(coach.employment_status);
                  }}
                  className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl border border-slate-200/60 dark:border-slate-700 transition-colors cursor-pointer"
                  title="تغییر وضعیت همکاری"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add New Coach */}
      <Modal
        isOpen={isAddCoachModalOpen}
        onClose={() => setIsAddCoachModalOpen(false)}
        title="افزودن مربی جدید به کادر آموزشی"
      >
        <form onSubmit={handleAddCoachSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                نام *
              </label>
              <input
                type="text"
                required
                placeholder="مثلاً علی"
                value={addCoachForm.first_name}
                onChange={(e) => setAddCoachForm({ ...addCoachForm, first_name: e.target.value })}
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
                placeholder="مثلاً رحمانی"
                value={addCoachForm.last_name}
                onChange={(e) => setAddCoachForm({ ...addCoachForm, last_name: e.target.value })}
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
                placeholder="0912..."
                value={addCoachForm.phone}
                onChange={(e) => setAddCoachForm({ ...addCoachForm, phone: e.target.value })}
                className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                کد ملی
              </label>
              <input
                type="text"
                placeholder="۱۰ رقمی"
                value={addCoachForm.national_id}
                onChange={(e) => setAddCoachForm({ ...addCoachForm, national_id: e.target.value })}
                className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                کلمه عبور ورود (اختیاری)
              </label>
              <input
                type="password"
                placeholder="پیش‌فرض: کد ملی یا شماره همراه"
                value={addCoachForm.password}
                onChange={(e) => setAddCoachForm({ ...addCoachForm, password: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                حق‌التدریس ساعتی (تومان)
              </label>
              <input
                type="number"
                min="0"
                step="10000"
                placeholder="مثلاً 250000"
                value={addCoachForm.hourly_rate}
                onChange={(e) => setAddCoachForm({ ...addCoachForm, hourly_rate: e.target.value })}
                className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                جنسیت مربی *
              </label>
              <select
                value={addCoachForm.gender}
                onChange={(e) => setAddCoachForm({ ...addCoachForm, gender: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="MALE">مربی مرد (آقا)</option>
                <option value="FEMALE">مربی زن (خانم)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ترتیب نمایش در سایت
              </label>
              <input
                type="number"
                min="1"
                value={addCoachForm.display_order}
                onChange={(e) => setAddCoachForm({ ...addCoachForm, display_order: Number(e.target.value) })}
                className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              وضعیت شروع همکاری
            </label>
            <CustomSelect
              value={addCoachForm.employment_status}
              onChange={(val) => setAddCoachForm({ ...addCoachForm, employment_status: val })}
              options={statusEditOptions}
              color="sky"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              تخصص‌های آموزشی مربیگری
            </label>
            <input
              type="text"
              placeholder="مثلاً: کرال سینه، شنای قورباغه، نجات‌غریق، کودکان و نوجوانان"
              value={addCoachForm.specialties}
              onChange={(e) => setAddCoachForm({ ...addCoachForm, specialties: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              رزومه، بیوگرافی و مدارک فدراسیون
            </label>
            <textarea
              rows={3}
              placeholder="سوابق تدریس، رتبه‌های ورزشی و مدارک بین‌المللی یا ملی مربی..."
              value={addCoachForm.bio}
              onChange={(e) => setAddCoachForm({ ...addCoachForm, bio: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddCoachModalOpen(false)}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              disabled={addingCoach}
              className="bg-sky-600 hover:bg-sky-500 text-white"
            >
              {addingCoach ? 'در حال ثبت...' : 'ثبت مربی جدید'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Change Employment Status */}
      <Modal
        isOpen={!!statusCoach}
        onClose={() => setStatusCoach(null)}
        title={`تغییر وضعیت همکاری: ${statusCoach?.full_name}`}
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              وضعیت همکاری جدید
            </label>
            <CustomSelect
              value={newStatus}
              onChange={(val) => setNewStatus(val)}
              options={statusEditOptions}
              color="sky"
            />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
            تغییر وضعیت همکاری به معلق یا غیرفعال، سوابق قبلی، دوره‌های گذرانده‌شده و کلاس‌های ثبت‌شده توسط مربی را پاک نخواهد کرد.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setStatusCoach(null)}>
              انصراف
            </Button>
            <Button type="submit" disabled={updatingStatus}>
              {updatingStatus ? 'در حال ثبت...' : 'ذخیره تغییرات'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
