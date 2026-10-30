import React, { useState, useEffect } from 'react';
import {
  Users, UserCheck, Search, Filter, BookOpen,
  MapPin, Clock, LayoutGrid, List, Award, Eye,
  GraduationCap, CheckCircle2, AlertTriangle, ArrowUpDown
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { CoachSelectorDropdown } from '../../components/common/CoachSelectorDropdown';
import { SwimmerCourseCard } from '../../components/common/SwimmerCourseCard';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

export const AdminEnrollmentsPage = () => {
  const [activeTab, setActiveTab] = useState('ENROLLMENTS'); // 'ENROLLMENTS' | 'REQUESTS'

  // Tab 1: Enrollments State
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [searchSwimmer, setSearchSwimmer] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);

  // Tab 2: Requests State
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReq, setSelectedReq] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const toast = useToast();
  const navigate = useNavigate();

  // Fetch Enrollments & Courses
  const fetchEnrollmentsData = async () => {
    try {
      setLoadingEnrollments(true);
      const params = {};
      if (selectedCourse) params.course_id = selectedCourse;

      const [enrRes, coursesRes] = await Promise.all([
        api.get('/education/enrollments/', { params }),
        api.get('/education/courses/'),
      ]);

      setEnrollments(enrRes.data.results || enrRes.data || []);
      setCourses(coursesRes.data.results || coursesRes.data || []);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت لیست ثبت‌نام‌ها');
    } finally {
      setLoadingEnrollments(false);
    }
  };

  // Fetch Online Requests
  const fetchRequestsData = async () => {
    try {
      setLoadingRequests(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/education/requests/', { params });
      setRequests(res.data.results || res.data || []);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت درخواست‌های ثبت‌نام');
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ENROLLMENTS') {
      fetchEnrollmentsData();
    } else {
      fetchRequestsData();
    }
  }, [activeTab, selectedCourse, statusFilter]);

  // Coach Assignment Handler
  const handleAssignCoach = async (enrollmentId, coachId) => {
    try {
      const res = await api.post(`/education/enrollments/${enrollmentId}/assign-coach/`, {
        coach_id: coachId,
      });

      // Update state locally
      setEnrollments((prev) =>
        prev.map((e) => (e.id === enrollmentId ? res.data : e))
      );

      const coachName = res.data.coach_name;
      toast.success(
        coachId && coachName
          ? `شناگر با موفقیت به کلاس مربی ${coachName} تخصیص یافت.`
          : 'تخصیص مربی با موفقیت حذف گردید.'
      );
    } catch (err) {
      console.error(err);
      toast.error('خطا در تخصیص مربی به شناگر');
    }
  };

  // Review Online Request Handler
  const handleReview = async (action) => {
    if (!selectedReq) return;
    try {
      setSubmitting(true);
      await api.post(`/education/requests/${selectedReq.id}/review/`, {
        action,
        rejection_reason: rejectionReason,
      });
      setSelectedReq(null);
      setRejectionReason('');
      toast.success(
        action === 'APPROVE'
          ? 'درخواست ثبت‌نام با موفقیت تأیید شد و شناگر در دوره ثبت گردید.'
          : 'درخواست متقاضی رد شد.'
      );
      fetchRequestsData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در ثبت تصمیم بررسی');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Enrollments
  const filteredEnrollments = enrollments.filter((e) => {
    if (!searchSwimmer.trim()) return true;
    const query = searchSwimmer.trim().toLowerCase();
    const name = (e.swimmer_name || '').toLowerCase();
    const phone = (e.swimmer_phone || '').toLowerCase();
    return name.includes(query) || phone.includes(query);
  });

  const totalPages = Math.ceil(
    (activeTab === 'ENROLLMENTS' ? filteredEnrollments.length : requests.length) / pageSize
  ) || 1;

  const paginatedEnrollments = filteredEnrollments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const paginatedRequests = requests.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const statusBadges = {
    PENDING: { label: 'در انتظار بررسی', variant: 'warning' },
    APPROVED: { label: 'تأییدشده و فعال', variant: 'success' },
    REJECTED: { label: 'رد شده', variant: 'danger' },
    WAITLIST: { label: 'فهرست انتظار', variant: 'neutral' },
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            مرکز ثبت‌نام دوره‌ها و تخصیص شناگران به مربیان
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            مشاهده ثبت‌نام‌های هر دوره، انتخاب مربی کلاس برای هر شناگر و بررسی درخواست‌های آنلاین
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('ENROLLMENTS')}
            className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'ENROLLMENTS'
                ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>ثبت‌نام‌های دوره‌ها ({enrollments.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('REQUESTS')}
            className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'REQUESTS'
                ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>درخواست‌های آنلاین ({requests.filter((r) => r.status === 'PENDING').length})</span>
          </button>
        </div>
      </div>

      {/* 2. TAB 1: ENROLLMENTS & COACH ASSIGNMENT */}
      {activeTab === 'ENROLLMENTS' ? (
        <div className="space-y-4">
          {/* Controls: Course Filter, Search, View Switcher */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 transition-colors">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchSwimmer}
                  onChange={(e) => setSearchSwimmer(e.target.value)}
                  placeholder="جستجو با نام شناگر یا شماره تماس..."
                  className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Course Filter */}
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 min-w-[180px]"
              >
                <option value="">همه دوره‌های آموزشی</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* View Switcher: Cards vs Table */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700 shrink-0 self-end md:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="نمای کارتی (عکس شناگر راست بالا، عکس مربی چپ پایین)"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>کارت‌ها</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="نمای جدولی"
              >
                <List className="w-4 h-4" />
                <span>جدول</span>
              </button>
            </div>
          </div>

          {/* Content Area */}
          {loadingEnrollments ? (
            <LoadingState type={viewMode === 'cards' ? 'cards' : 'table'} count={6} message="در حال بارگذاری ثبت‌نام‌های دوره‌ها..." />
          ) : paginatedEnrollments.length === 0 ? (
            <EmptyState
              title="هیچ ثبت‌نامی یافت نشد"
              description="با تغییر فیلتر دوره یا ثبت‌نام متقاضیان، شناگران در این بخش نمایش داده می‌شوند."
            />
          ) : viewMode === 'cards' ? (
            /* CARDS VIEW: Swimmer Avatar TOP-RIGHT, Coach Avatar BOTTOM-LEFT */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {paginatedEnrollments.map((enr) => (
                <SwimmerCourseCard
                  key={enr.id}
                  swimmer={{
                    full_name: enr.swimmer_name,
                    avatar: enr.swimmer_avatar,
                    phone: enr.swimmer_phone,
                    national_id: enr.swimmer_national_id,
                    level_name: enr.swimmer_level_name,
                  }}
                  course={{
                    name: enr.course_name,
                    pool_location: enr.course_pool,
                    days_of_week: enr.course_days,
                    time_display: enr.course_time,
                  }}
                  coach={
                    enr.coach
                      ? {
                          id: enr.coach,
                          full_name: enr.coach_name,
                          avatar: enr.coach_avatar,
                        }
                      : null
                  }
                  availableCoaches={enr.course_coaches || []}
                  onSelectCoach={(coachId) => handleAssignCoach(enr.id, coachId)}
                  onOpenDossier={() => navigate(`/admin/swimmers/${enr.swimmer}`)}
                  status={enr.status}
                  sessionsPurchased={enr.sessions_purchased}
                  sessionsAttended={enr.sessions_attended}
                />
              ))}
            </div>
          ) : (
            /* TABLE VIEW: Dedicated Coach Column */
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right min-w-[750px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5 rounded-r-xl">شناگر</th>
                      <th className="px-4 py-3.5">دوره آموزشی و استخر</th>
                      <th className="px-4 py-3.5">برنامه و ساعت</th>
                      <th className="px-4 py-3.5">مربی و کلاس تخصیص‌یافته</th>
                      <th className="px-4 py-3.5">مصرف جلسات</th>
                      <th className="px-4 py-3.5">وضعیت</th>
                      <th className="px-4 py-3.5 text-center rounded-l-xl">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {paginatedEnrollments.map((enr) => (
                      <tr key={enr.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                        {/* Swimmer Info */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            {enr.swimmer_avatar ? (
                              <img
                                src={enr.swimmer_avatar}
                                alt={enr.swimmer_name}
                                className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                {enr.swimmer_name ? enr.swimmer_name.charAt(0) : 'ش'}
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block text-xs">
                                {enr.swimmer_name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {enr.swimmer_phone}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Course & Pool */}
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs truncate max-w-[170px]">
                            {enr.course_name}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {enr.course_pool || 'استخر شهید رئیسی'}
                          </span>
                        </td>

                        {/* Schedule */}
                        <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                          <span className="block">{enr.course_days || 'سه‌شنبه و پنج‌شنبه'}</span>
                          <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                            {enr.course_time || '۱۷:۰۰ الی ۱۹:۰۰'}
                          </span>
                        </td>

                        {/* Coach & Class Column with CoachSelectorDropdown */}
                        <td className="px-4 py-3.5">
                          <CoachSelectorDropdown
                            currentCoach={
                              enr.coach
                                ? {
                                    id: enr.coach,
                                    full_name: enr.coach_name,
                                    avatar: enr.coach_avatar,
                                  }
                                : null
                            }
                            availableCoaches={enr.course_coaches || []}
                            onSelectCoach={(coachId) => handleAssignCoach(enr.id, coachId)}
                            placement="auto"
                            size="md"
                          />
                        </td>

                        {/* Sessions */}
                        <td className="px-4 py-3.5 text-xs font-mono text-slate-600 dark:text-slate-300">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {enr.sessions_attended}
                          </span>{' '}
                          از {enr.sessions_purchased}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <Badge variant={enr.status === 'ACTIVE' ? 'success' : 'neutral'}>
                            {enr.status === 'ACTIVE' ? 'فعال' : enr.status}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/swimmers/${enr.swimmer}`)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-600 font-semibold text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="مشاهده پرونده جامع"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>پرونده</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          <div className="pt-2 flex justify-between items-center">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              نمایش {paginatedEnrollments.length} از {filteredEnrollments.length} ثبت‌نام
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      ) : (
        /* 3. TAB 2: ONLINE ENROLLMENT REQUESTS */
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              فیلتر وضعیت درخواست‌ها:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">تمام وضعیت‌ها</option>
              <option value="PENDING">در انتظار بررسی</option>
              <option value="APPROVED">تأییدشده</option>
              <option value="REJECTED">رد شده</option>
              <option value="WAITLIST">فهرست انتظار</option>
            </select>
          </div>

          {loadingRequests ? (
            <LoadingState type="table" rows={6} message="در حال بارگذاری درخواست‌های ثبت‌نام..." />
          ) : requests.length === 0 ? (
            <EmptyState title="هیچ درخواستی یافت نشد" description="در حال حاضر درخواستی با این وضعیت ثبت نشده است." />
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right min-w-[640px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5 rounded-r-xl">نام متقاضی</th>
                      <th className="px-4 py-3.5">شماره همراه</th>
                      <th className="px-4 py-3.5">دوره درخواستی</th>
                      <th className="px-4 py-3.5">گروه اجرایی</th>
                      <th className="px-4 py-3.5">تاریخ ثبت</th>
                      <th className="px-4 py-3.5">وضعیت</th>
                      <th className="px-4 py-3.5 text-center rounded-l-xl">اقدام مدیر</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {paginatedRequests.map((req) => {
                      const meta = statusBadges[req.status] || { label: req.status, variant: 'neutral' };
                      return (
                        <tr key={req.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white">{req.applicant_name}</td>
                          <td className="px-4 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-400">{req.applicant_phone}</td>
                          <td className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300">{req.course_name}</td>
                          <td className="px-4 py-3.5 text-xs font-medium text-slate-800 dark:text-slate-200">{req.group_name}</td>
                          <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                            {new Date(req.created_at).toLocaleDateString('fa-IR')}
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge variant={meta.variant}>{meta.label}</Badge>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {req.status === 'PENDING' ? (
                              <button
                                type="button"
                                onClick={() => setSelectedReq(req)}
                                className="px-3 py-1.5 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 font-semibold text-xs rounded-xl border border-sky-200 dark:border-sky-800 transition-colors shadow-2xs cursor-pointer"
                              >
                                بررسی و تصمیم
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 dark:text-slate-500 italic">بررسی‌شده</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <span className="text-xs text-slate-500">
                  نمایش {paginatedRequests.length} از {requests.length} درخواست
                </span>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Review Request Modal */}
      <Modal
        isOpen={Boolean(selectedReq)}
        onClose={() => setSelectedReq(null)}
        title="بررسی و تصمیم‌گیری درخواست ثبت‌نام آنلاین"
      >
        {selectedReq && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">نام متقاضی:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedReq.applicant_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">شماره همراه:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedReq.applicant_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">دوره درخواستی:</span>
                <span className="font-bold text-sky-700 dark:text-sky-300">{selectedReq.course_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">گروه کلاسی:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedReq.group_name}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                توضیحات یا دلیل رد (در صورت رد درخواست)
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="در صورت عدم تایید، دلیل آن برای متقاضی پیامک می‌شود..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setSelectedReq(null)}>
                انصراف
              </Button>
              <Button
                variant="danger"
                disabled={submitting}
                onClick={() => handleReview('REJECT')}
              >
                رد درخواست
              </Button>
              <Button
                variant="primary"
                disabled={submitting}
                onClick={() => handleReview('APPROVE')}
              >
                تأیید و صدور فاکتور
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
