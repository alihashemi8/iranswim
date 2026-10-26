import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users, UserPlus, Search, Filter, Eye, BookOpen,
  CreditCard, Calendar, Award, Phone, CheckCircle2,
  XCircle, FileSpreadsheet, PlusCircle, Activity
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { useToast } from '../../context/ToastContext';
import { exportToCsv } from '../../utils/exportCsv';

export const AdminSwimmersPage = () => {
  const [swimmers, setSwimmers] = useState([]);
  const [levels, setLevels] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, INACTIVE
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Create Swimmer Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    national_id: '',
    date_of_birth: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    current_level: '',
    medical_notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Swimmer Dossier Profile Modal
  const [profileSwimmer, setProfileSwimmer] = useState(null);
  const [profileTab, setProfileTab] = useState('INFO'); // INFO, ENROLLMENTS, ATTENDANCE, FINANCE, ASSESSMENTS
  const [swimmerEnrollments, setSwimmerEnrollments] = useState([]);
  const [swimmerAttendance, setSwimmerAttendance] = useState([]);
  const [swimmerInvoices, setSwimmerInvoices] = useState([]);
  const [swimmerRecords, setSwimmerRecords] = useState([]);
  const [dossierLoading, setDossierLoading] = useState(false);

  // Direct Enrollment Modal
  const [enrollModalSwimmer, setEnrollModalSwimmer] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [enrollSessions, setEnrollSessions] = useState(12);
  const [enrolling, setEnrolling] = useState(false);

  const fetchSwimmers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedLevel) params.level = selectedLevel;

      const [swimmersRes, levelsRes, groupsRes] = await Promise.all([
        api.get('/swimmers/', { params }),
        api.get('/education/levels/'),
        api.get('/education/groups/'),
      ]);

      setSwimmers(swimmersRes.data.results || swimmersRes.data);
      setLevels(levelsRes.data.results || levelsRes.data);
      setGroups(groupsRes.data.results || groupsRes.data);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت لیست شناگران');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSwimmers();
  }, [selectedLevel]);

  // Handle Quick Action deep link
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsAddModalOpen(true);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('action');
        return next;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSwimmers();
  };

  // Open Full Swimmer Dossier
  const handleOpenDossier = async (swimmer) => {
    setProfileSwimmer(swimmer);
    setProfileTab('INFO');
    setDossierLoading(true);
    try {
      const [enrollRes, attRes, invRes, recRes] = await Promise.all([
        api.get(`/education/enrollments/?swimmer_id=${swimmer.id}`),
        api.get(`/attendance/?swimmer_id=${swimmer.id}`),
        api.get(`/finance/invoices/?swimmer_id=${swimmer.id}`),
        api.get(`/assessments/records/?swimmer_id=${swimmer.id}`),
      ]);
      setSwimmerEnrollments(enrollRes.data.results || enrollRes.data);
      setSwimmerAttendance(attRes.data.results || attRes.data);
      setSwimmerInvoices(invRes.data.results || invRes.data);
      setSwimmerRecords(recRes.data.results || recRes.data);
    } catch (err) {
      console.error(err);
      toast.error('خطا در بارگذاری جزئیات پرونده شناگر');
    } finally {
      setDossierLoading(false);
    }
  };

  // Create Swimmer Handler
  const handleCreateSwimmer = async (e) => {
    e.preventDefault();
    if (!createForm.first_name || !createForm.last_name || !createForm.phone) {
      toast.error('لطفاً نام، نام خانوادگی و شماره تلفن را وارد کنید.');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/swimmers/', {
        ...createForm,
        current_level: createForm.current_level ? Number(createForm.current_level) : null,
      });
      toast.success('پرونده شناگر با موفقیت ثبت گردید.');
      setIsAddModalOpen(false);
      setCreateForm({
        first_name: '',
        last_name: '',
        phone: '',
        national_id: '',
        date_of_birth: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        current_level: '',
        medical_notes: '',
      });
      fetchSwimmers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در ثبت پرونده شناگر');
    } finally {
      setSubmitting(false);
    }
  };

  // Direct Group Enrollment
  const handleDirectEnroll = async (e) => {
    e.preventDefault();
    if (!enrollModalSwimmer || !selectedGroup) return;

    const groupObj = groups.find((g) => g.id === Number(selectedGroup));
    if (!groupObj) return;

    try {
      setEnrolling(true);
      await api.post('/education/enrollments/', {
        swimmer: enrollModalSwimmer.id,
        group: groupObj.id,
        course: groupObj.course,
        status: 'ACTIVE',
        sessions_purchased: Number(enrollSessions) || 12,
      });
      toast.success(`شناگر با موفقیت در گروه ${groupObj.name} ثبت‌نام شد.`);
      setEnrollModalSwimmer(null);
      setSelectedGroup('');
      fetchSwimmers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در ثبت‌نام مستقیم شناگر');
    } finally {
      setEnrolling(false);
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    const rows = swimmers.map((s) => ({
      name: s.full_name,
      phone: s.phone,
      national_id: s.national_id || '—',
      level: s.level_name || 'بدون سطح',
      status: s.is_active ? 'فعال' : 'غیرفعال',
      date: new Date(s.created_at).toLocaleDateString('fa-IR'),
    }));
    exportToCsv('IranSwim_Swimmers_List', rows, {
      name: 'نام و نام خانوادگی',
      phone: 'شماره همراه',
      national_id: 'کد ملی',
      level: 'سطح مهارت',
      status: 'وضعیت',
      date: 'تاریخ ثبت',
    });
  };

  // Filtered Swimmers List
  const filteredSwimmers = swimmers.filter((s) => {
    if (statusFilter === 'ACTIVE') return s.is_active;
    if (statusFilter === 'INACTIVE') return !s.is_active;
    return true;
  });

  const totalPages = Math.ceil(filteredSwimmers.length / pageSize) || 1;
  const paginatedSwimmers = filteredSwimmers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatPrice = (v) => Number(v || 0).toLocaleString('fa-IR');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            مرکز مدیریت شناگران و پرونده‌های آموزشی
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            دسترسی به پرونده کامل سلامت و رشد، ثبت‌نام در گروه‌ها، سوابق کلاسی و امور مالی هر شناگر
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={handleExportCsv} className="gap-1.5 text-xs">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>خروجی اکسل / CSV</span>
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-1.5 text-xs">
            <UserPlus className="w-4 h-4" />
            <span>ثبت شناگر جدید</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 transition-colors">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو با نام، نام خانوادگی، شماره تماس یا کد ملی..."
              className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
            />
          </div>
          <Button type="submit" variant="secondary" className="text-xs shrink-0 px-4">
            جستجو
          </Button>
        </form>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          {/* Level Filter */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">همه سطوح مهارت</option>
            {levels.map((lvl) => (
              <option key={lvl.id} value={lvl.id}>
                سطح {lvl.order}: {lvl.name}
              </option>
            ))}
          </select>

          {/* Status Tab buttons */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              همه ({swimmers.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'ACTIVE'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              فعال
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'INACTIVE'
                  ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              بایگانی
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <LoadingState message="در حال بارگذاری لیست شناگران..." />
      ) : paginatedSwimmers.length === 0 ? (
        <EmptyState
          title="شناگری یافت نشد"
          description="با تغییر فیلترهای جستجو یا ثبت شناگر جدید، پرونده‌ها در این بخش نمایش داده می‌شوند."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 rounded-r-xl">شناگر</th>
                  <th className="px-4 py-3.5">شماره تماس</th>
                  <th className="px-4 py-3.5">کد ملی</th>
                  <th className="px-4 py-3.5">سطح مهارت فعلی</th>
                  <th className="px-4 py-3.5">وضعیت</th>
                  <th className="px-4 py-3.5">تاریخ ثبت</th>
                  <th className="px-4 py-3.5 text-center rounded-l-xl">عملیات پرونده</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {paginatedSwimmers.map((swimmer) => (
                  <tr key={swimmer.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {swimmer.first_name ? swimmer.first_name.charAt(0) : 'S'}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-100 block">
                            {swimmer.full_name}
                          </span>
                          {swimmer.emergency_contact_name && (
                            <span className="text-[11px] text-slate-400">
                              ولی/رابط: {swimmer.emergency_contact_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {swimmer.phone}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {swimmer.national_id || '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      {swimmer.level_name ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800">
                          <Award className="w-3.5 h-3.5 text-sky-500" />
                          {swimmer.level_name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">تعیین سطح نشده</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={swimmer.is_active ? 'success' : 'neutral'}>
                        {swimmer.is_active ? 'فعال' : 'غیرفعال'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-mono text-slate-500 dark:text-slate-400">
                      {new Date(swimmer.created_at).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenDossier(swimmer)}
                          className="px-2.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 font-semibold text-xs border border-sky-200 dark:border-sky-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="مشاهده پرونده جامع"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>پرونده</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEnrollModalSwimmer(swimmer)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-semibold text-xs border border-emerald-200 dark:border-emerald-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="ثبت‌نام مستقیم در کلاس"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>ثبت‌نام</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {paginatedSwimmers.map((swimmer) => (
              <div
                key={swimmer.id}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3 text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                      {swimmer.first_name ? swimmer.first_name.charAt(0) : 'S'}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-sm block">
                        {swimmer.full_name}
                      </span>
                      {swimmer.emergency_contact_name && (
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          ولی/رابط: {swimmer.emergency_contact_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant={swimmer.is_active ? 'success' : 'neutral'}>
                    {swimmer.is_active ? 'فعال' : 'غیرفعال'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[10px]">سطح مهارت</span>
                    {swimmer.level_name ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-sky-700 dark:text-sky-300 mt-0.5">
                        <Award className="w-3 h-3 text-sky-500" />
                        {swimmer.level_name}
                      </span>
                    ) : (
                      <span className="text-slate-400">تعیین سطح نشده</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">تماس</span>
                    <a href={`tel:${swimmer.phone}`} className="font-mono text-sky-600 dark:text-sky-400 underline decoration-sky-300">
                      {swimmer.phone}
                    </a>
                  </div>
                  {swimmer.national_id && (
                    <div>
                      <span className="text-slate-400 block text-[10px]">کد ملی</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{swimmer.national_id}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400 block text-[10px]">تاریخ عضویت</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">
                      {new Date(swimmer.created_at).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                  <button
                    type="button"
                    onClick={() => handleOpenDossier(swimmer)}
                    className="flex-1 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 font-semibold border border-sky-200 dark:border-sky-800 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>مشاهده پرونده</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnrollModalSwimmer(swimmer)}
                    className="flex-1 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-semibold border border-emerald-200 dark:border-emerald-800 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>ثبت‌نام در کلاس</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              نمایش {paginatedSwimmers.length} از {filteredSwimmers.length} شناگر
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* 1. Modal: Create Swimmer */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="تشکیل پرونده شناگر جدید"
      >
        <form onSubmit={handleCreateSwimmer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                نام *
              </label>
              <input
                type="text"
                required
                value={createForm.first_name}
                onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                نام خانوادگی *
              </label>
              <input
                type="text"
                required
                value={createForm.last_name}
                onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                شماره همراه *
              </label>
              <input
                type="text"
                required
                placeholder="0912..."
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                کد ملی
              </label>
              <input
                type="text"
                placeholder="۱۰ رقمی"
                value={createForm.national_id}
                onChange={(e) => setCreateForm({ ...createForm, national_id: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                تاریخ تولد
              </label>
              <input
                type="date"
                value={createForm.date_of_birth}
                onChange={(e) => setCreateForm({ ...createForm, date_of_birth: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                سطح مهارت اولیه
              </label>
              <select
                value={createForm.current_level}
                onChange={(e) => setCreateForm({ ...createForm, current_level: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              >
                <option value="">بدون سطح / نیاز به تعیین سطح</option>
                {levels.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    سطح {lvl.order}: {lvl.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                نام ولی / مخاطب اضطراری
              </label>
              <input
                type="text"
                placeholder="نام والد یا همراه"
                value={createForm.emergency_contact_name}
                onChange={(e) => setCreateForm({ ...createForm, emergency_contact_name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                تلفن تماس اضطراری
              </label>
              <input
                type="text"
                placeholder="شماره تماس ضروری"
                value={createForm.emergency_contact_phone}
                onChange={(e) => setCreateForm({ ...createForm, emergency_contact_phone: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              ملاحظات پزشکی، حساسیت پوستی یا توصیه‌های ویژه
            </label>
            <textarea
              rows={2}
              placeholder="در صورت وجود آسم، حساسیت به کلر، ترس از آب یا هر نکته پزشکی..."
              value={createForm.medical_notes}
              onChange={(e) => setCreateForm({ ...createForm, medical_notes: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'در حال ثبت...' : 'ثبت قطعی پرونده'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Modal: Direct Group Enrollment */}
      <Modal
        isOpen={!!enrollModalSwimmer}
        onClose={() => setEnrollModalSwimmer(null)}
        title={`ثبت‌نام مستقیم در کلاس: ${enrollModalSwimmer?.full_name}`}
      >
        <form onSubmit={handleDirectEnroll} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              انتخاب گروه و دوره آموزشی *
            </label>
            <select
              required
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
            >
              <option value="">یک گروه را انتخاب کنید...</option>
              {groups.map((grp) => (
                <option key={grp.id} value={grp.id}>
                  {grp.course_name} - {grp.name} ({grp.level_name}) - ظرفیت خالی: {grp.remaining_capacity} نفر
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              تعداد جلسات خریداری‌شده
            </label>
            <input
              type="number"
              min="1"
              max="48"
              value={enrollSessions}
              onChange={(e) => setEnrollSessions(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800 text-xs text-sky-800 dark:text-sky-300">
            با تأیید ثبت‌نام، شناگر مستقیماً به لیست شاگردان این گروه اضافه شده و سهمیه جلسات و صورتحساب مربوطه صادر خواهد شد.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setEnrollModalSwimmer(null)}>
              انصراف
            </Button>
            <Button type="submit" disabled={enrolling}>
              {enrolling ? 'در حال ثبت‌نام...' : 'تأیید و ثبت‌نام'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Modal: Swimmer Dossier Full Profile */}
      <Modal
        isOpen={!!profileSwimmer}
        onClose={() => setProfileSwimmer(null)}
        title={`پرونده جامع شناگر: ${profileSwimmer?.full_name}`}
      >
        <div className="space-y-4">
          {/* Tabs Header */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-2">
            {[
              { key: 'INFO', label: 'اطلاعات پایه', icon: Users },
              { key: 'ENROLLMENTS', label: `دوره‌ها (${swimmerEnrollments.length})`, icon: BookOpen },
              { key: 'ATTENDANCE', label: `حضور و غیاب (${swimmerAttendance.length})`, icon: Calendar },
              { key: 'FINANCE', label: `مالی و فاکتور (${swimmerInvoices.length})`, icon: CreditCard },
              { key: 'ASSESSMENTS', label: `رکوردها (${swimmerRecords.length})`, icon: Award },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setProfileTab(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                    profileTab === tab.key
                      ? 'bg-sky-500 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {dossierLoading ? (
            <LoadingState message="در حال استخراج داده‌های پرونده شناگر..." />
          ) : (
            <div>
              {/* TAB 1: INFO */}
              {profileTab === 'INFO' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700">
                    <div>
                      <span className="text-slate-400 block">نام و نام خانوادگی:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">{profileSwimmer?.full_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">شماره تلفن:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{profileSwimmer?.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">کد ملی:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-200">{profileSwimmer?.national_id || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">سطح مهارت:</span>
                      <span className="font-bold text-sky-600">{profileSwimmer?.level_name || 'ثبت‌نشده'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">مخاطب اضطراری / والد:</span>
                      <span className="text-slate-700 dark:text-slate-200">{profileSwimmer?.emergency_contact_name || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">تلفن اضطراری:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-200">{profileSwimmer?.emergency_contact_phone || '—'}</span>
                    </div>
                  </div>

                  {profileSwimmer?.medical_notes && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300">
                      <span className="font-bold block mb-1">ملاحظات و حساسیت‌های پزشکی:</span>
                      <p>{profileSwimmer.medical_notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ENROLLMENTS */}
              {profileTab === 'ENROLLMENTS' && (
                <div className="space-y-2">
                  {swimmerEnrollments.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">ثبت‌نام کلاسی فعالی وجود ندارد.</div>
                  ) : (
                    swimmerEnrollments.map((enr) => (
                      <div key={enr.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-100 block">{enr.course_name}</span>
                          <span className="text-slate-500 dark:text-slate-400">{enr.group_name}</span>
                        </div>
                        <div className="text-left font-mono">
                          <span className="text-sky-600 font-bold block">{enr.remaining_sessions} جلسه مانده</span>
                          <span className="text-[10px] text-slate-400">{enr.sessions_attended} جلسه مصرف‌شده</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: ATTENDANCE */}
              {profileTab === 'ATTENDANCE' && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {swimmerAttendance.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">سابقه حضور و غیابی ثبت نشده است.</div>
                  ) : (
                    swimmerAttendance.map((att) => (
                      <div key={att.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono text-slate-500 block">{new Date(att.recorded_at).toLocaleDateString('fa-IR')}</span>
                          {att.note && <span className="text-[11px] text-slate-400">یادداشت: {att.note}</span>}
                        </div>
                        <Badge
                          variant={
                            att.status === 'PRESENT'
                              ? 'success'
                              : att.status === 'EXCUSED'
                              ? 'info'
                              : att.status === 'LATE'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {att.status_display}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: FINANCE */}
              {profileTab === 'FINANCE' && (
                <div className="space-y-2">
                  {swimmerInvoices.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">صورتحساب مالی ثبت نشده است.</div>
                  ) : (
                    swimmerInvoices.map((inv) => (
                      <div key={inv.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{inv.invoice_number}</span>
                          <Badge variant={inv.status === 'PAID' ? 'success' : inv.status === 'PARTIALLY_PAID' ? 'warning' : 'danger'}>
                            {inv.status_display}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-slate-500">
                          <span>مبلغ کل: {formatPrice(inv.total_amount)} تومان</span>
                          <span className="text-rose-600 font-bold font-mono">مانده: {formatPrice(inv.remaining_balance)} تومان</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 5: ASSESSMENTS & RECORDS */}
              {profileTab === 'ASSESSMENTS' && (
                <div className="space-y-2">
                  {swimmerRecords.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">رکورد زمانی ثبت نشده است.</div>
                  ) : (
                    swimmerRecords.map((rec) => (
                      <div key={rec.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-100 block">
                            {rec.distance_meters} متر {rec.stroke_display || rec.stroke}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(rec.recorded_at).toLocaleDateString('fa-IR')}
                          </span>
                        </div>
                        <div className="text-left font-mono">
                          <span className="text-sky-600 font-bold block">{rec.duration_seconds} ثانیه</span>
                          <Badge variant={rec.verification_status === 'VERIFIED' ? 'success' : 'warning'}>
                            {rec.verification_status === 'VERIFIED' ? 'تأیید رسمی' : 'در انتظار بررسی'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setProfileSwimmer(null)}>
              بستن پرونده
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
