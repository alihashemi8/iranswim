import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ClipboardCheck, Calendar, Clock, Users, CheckCircle,
  XCircle, AlertCircle, Save, Filter, FileSpreadsheet,
  Search, X, CheckCheck, RotateCcw, Award, MapPin, UserCheck, BookOpen
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { PersianDatePicker } from '../../components/common/PersianDatePicker';
import { CustomSelect } from '../../components/common/CustomSelect';
import { useToast } from '../../context/ToastContext';
import { exportToCsv } from '../../utils/exportCsv';

export const AdminAttendancePage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real Database Categories Metadata
  const [levels, setLevels] = useState([]);
  const [courses, setCourses] = useState([]);
  const [coaches, setCoaches] = useState([]);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedCoach, setSelectedCoach] = useState('');
  const [selectedSessionStatus, setSelectedSessionStatus] = useState('');
  const [selectedPool, setSelectedPool] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, UNRECORDED, RECORDED, TODAY
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  // Active Attendance Registering Modal
  const [activeSession, setActiveSession] = useState(null);
  const [groupEnrollments, setGroupEnrollments] = useState([]);
  const [existingAttendance, setExistingAttendance] = useState({});
  const [modalLoading, setModalLoading] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [modalSearchSwimmer, setModalSearchSwimmer] = useState('');
  const [modalStatusFilter, setModalStatusFilter] = useState('ALL');

  // 1. Fetch Categories Metadata from Real Database Endpoints
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [levelsRes, coursesRes, coachesRes] = await Promise.all([
          api.get('/education/levels/'),
          api.get('/education/courses/'),
          api.get('/coaches/'),
        ]);
        setLevels(levelsRes.data.results || levelsRes.data || []);
        setCourses(coursesRes.data.results || coursesRes.data || []);
        setCoaches(coachesRes.data.results || coachesRes.data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Compute Unique Pool Locations Dynamically
  const poolLocations = useMemo(() => {
    const pools = new Set();
    sessions.forEach((s) => {
      if (s.pool_location) pools.add(s.pool_location);
    });
    courses.forEach((c) => {
      if (c.pool_location) pools.add(c.pool_location);
    });
    return Array.from(pools).filter(Boolean);
  }, [sessions, courses]);

  // 2. Fetch Sessions with Filters and Search
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterType === 'UNRECORDED') params.attendance_status = 'UNRECORDED';
      else if (filterType === 'RECORDED') params.attendance_status = 'RECORDED';
      else if (filterType === 'TODAY') params.date = new Date().toISOString().split('T')[0];

      if (dateFilter) params.date = dateFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedLevel) params.skill_level_id = selectedLevel;
      if (selectedCourse) params.course_id = selectedCourse;
      if (selectedCoach) params.coach_id = selectedCoach;
      if (selectedSessionStatus) params.status = selectedSessionStatus;
      if (selectedPool) params.pool_location = selectedPool;

      const res = await api.get('/scheduling/sessions/', { params });
      const list = res.data.results || res.data || [];
      setSessions(list);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت لیست جلسات آموزشی');
    } finally {
      setLoading(false);
    }
  };

  // Synchronize URL query params (e.g. ?session_id=... or ?filter=UNRECORDED)
  useEffect(() => {
    const filter = searchParams.get('filter')?.toUpperCase();
    if (filter && ['ALL', 'UNRECORDED', 'RECORDED', 'TODAY', 'COMPLETED'].includes(filter)) {
      if (filter === 'COMPLETED') {
        setSelectedSessionStatus('COMPLETED');
        setFilterType('ALL');
      } else {
        setFilterType(filter);
      }
    }
  }, [searchParams]);

  // Debounce search input and trigger fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSessions();
    }, 300);
    return () => clearTimeout(timer);
  }, [
    searchTerm,
    filterType,
    dateFilter,
    selectedLevel,
    selectedCourse,
    selectedCoach,
    selectedSessionStatus,
    selectedPool,
  ]);

  // Auto-open modal if session_id is in query params
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId && sessions.length > 0 && !activeSession) {
      const target = sessions.find((s) => s.id === Number(sessionId));
      if (target) {
        handleOpenAttendanceSheet(target);
      }
    }
  }, [searchParams, sessions, activeSession]);

  // Filtered Sessions List (Guarantees Instant Client-Side Responsiveness)
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (selectedLevel && String(s.skill_level_id) !== String(selectedLevel)) return false;
      if (selectedCourse && String(s.course_id) !== String(selectedCourse)) return false;
      if (selectedCoach && String(s.coach) !== String(selectedCoach)) return false;
      if (selectedSessionStatus && s.status !== selectedSessionStatus) return false;
      if (selectedPool && s.pool_location !== selectedPool) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchGroup = s.group_name?.toLowerCase().includes(q);
        const matchCourse = s.course_name?.toLowerCase().includes(q);
        const matchCoach = s.coach_name?.toLowerCase().includes(q);
        const matchLevel = s.skill_level_name?.toLowerCase().includes(q);
        const matchPool = s.pool_location?.toLowerCase().includes(q);
        if (!matchGroup && !matchCourse && !matchCoach && !matchLevel && !matchPool) return false;
      }
      return true;
    });
  }, [
    sessions,
    selectedLevel,
    selectedCourse,
    selectedCoach,
    selectedSessionStatus,
    selectedPool,
    searchTerm,
  ]);

  // Pagination Slice
  const totalItems = filteredSessions.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Check if any filter is active
  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    selectedLevel ||
    selectedCourse ||
    selectedCoach ||
    selectedSessionStatus ||
    selectedPool ||
    dateFilter ||
    filterType !== 'ALL'
  );

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedLevel('');
    setSelectedCourse('');
    setSelectedCoach('');
    setSelectedSessionStatus('');
    setSelectedPool('');
    setDateFilter('');
    setFilterType('ALL');
    setCurrentPage(1);
  };

  // Open Attendance Sheet for a Session
  const handleOpenAttendanceSheet = async (session) => {
    setActiveSession(session);
    setModalLoading(true);
    setModalSearchSwimmer('');
    setModalStatusFilter('ALL');
    try {
      const [enrollRes, attRes] = await Promise.all([
        api.get(`/education/enrollments/?group_id=${session.group}`),
        api.get(`/attendance/?session_id=${session.id}`),
      ]);

      const enrollments = enrollRes.data.results || enrollRes.data || [];
      const records = attRes.data.results || attRes.data || [];

      // Map existing records by swimmer id
      const attMap = {};
      records.forEach((r) => {
        attMap[r.swimmer] = {
          status: r.status,
          note: r.note || '',
        };
      });

      // Default to 'PRESENT' for enrolled swimmers without existing record
      enrollments.forEach((e) => {
        if (!attMap[e.swimmer]) {
          attMap[e.swimmer] = {
            status: 'PRESENT',
            note: '',
          };
        }
      });

      setGroupEnrollments(enrollments);
      setExistingAttendance(attMap);
    } catch (err) {
      console.error(err);
      toast.error('خطا در بارگذاری دفتر حضور و غیاب جلسه');
    } finally {
      setModalLoading(false);
    }
  };

  // Status Change in Attendance Sheet
  const handleStatusChange = (swimmerId, status) => {
    setExistingAttendance((prev) => ({
      ...prev,
      [swimmerId]: {
        ...(prev[swimmerId] || {}),
        status,
      },
    }));
  };

  // Note Change in Attendance Sheet
  const handleNoteChange = (swimmerId, note) => {
    setExistingAttendance((prev) => ({
      ...prev,
      [swimmerId]: {
        ...(prev[swimmerId] || {}),
        note,
      },
    }));
  };

  // Mark all enrolled swimmers present in modal
  const handleMarkAllPresentInModal = () => {
    setExistingAttendance((prev) => {
      const updated = { ...prev };
      groupEnrollments.forEach((enr) => {
        updated[enr.swimmer] = {
          ...(updated[enr.swimmer] || {}),
          status: 'PRESENT',
        };
      });
      return updated;
    });
    toast.success('تمامی شناگران این جلسه به عنوان «حاضر» مشخص شدند.');
  };

  // Save Attendance Sheet
  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    if (!activeSession) return;

    const records = Object.entries(existingAttendance).map(([swimmerId, data]) => ({
      swimmer_id: Number(swimmerId),
      status: data.status,
      note: data.note,
    }));

    try {
      setSavingAttendance(true);
      await api.post('/attendance/bulk-save/', {
        session_id: activeSession.id,
        records,
      });

      toast.success('دفتر حضور و غیاب ثبت و سهمیه شناگران با موفقیت به‌روزرسانی شد.');
      setActiveSession(null);
      fetchSessions();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در ثبت حضور و غیاب');
    } finally {
      setSavingAttendance(false);
    }
  };

  // Export to CSV with full category information
  const handleExportCsv = () => {
    const rows = filteredSessions.map((s) => ({
      course: s.course_name || 'عمومی',
      group: s.group_name,
      level: s.skill_level_name || 'نامشخص',
      coach: s.coach_name || 'نامشخص',
      date: new Date(s.session_date).toLocaleDateString('fa-IR'),
      time: `${s.start_time?.slice(0, 5)} - ${s.end_time?.slice(0, 5)}`,
      location: s.pool_location || '-',
      session_status: s.status_display,
      attendance_status: s.attendance_recorded ? 'ثبت‌شده' : 'ثبت‌نشده',
    }));
    exportToCsv('IranSwim_Attendance_Sessions', rows, {
      course: 'دوره آموزشی',
      group: 'گروه کلاسی',
      level: 'سطح مهارت',
      coach: 'مربی مسئول',
      date: 'تاریخ برگزاری',
      time: 'ساعت برگزاری',
      location: 'استخر / لاین',
      session_status: 'وضعیت جلسه',
      attendance_status: 'وضعیت حضور و غیاب',
    });
  };

  // Filtered swimmers inside the attendance modal
  const filteredModalEnrollments = useMemo(() => {
    return groupEnrollments.filter((enr) => {
      const q = modalSearchSwimmer.trim().toLowerCase();
      const matchesSearch = !q || enr.swimmer_name?.toLowerCase().includes(q);
      const currentStatus = existingAttendance[enr.swimmer]?.status || 'PRESENT';
      const matchesStatus = modalStatusFilter === 'ALL' || currentStatus === modalStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [groupEnrollments, existingAttendance, modalSearchSwimmer, modalStatusFilter]);

  // Counts of swimmers by status in modal
  const modalCounts = useMemo(() => {
    const counts = { ALL: groupEnrollments.length, PRESENT: 0, LATE: 0, EXCUSED: 0, ABSENT: 0 };
    groupEnrollments.forEach((enr) => {
      const st = existingAttendance[enr.swimmer]?.status || 'PRESENT';
      if (counts[st] !== undefined) counts[st]++;
    });
    return counts;
  }, [groupEnrollments, existingAttendance]);

  // Status Badge Helper
  const getSessionStatusBadgeVariant = (st) => {
    switch (st) {
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'danger';
      case 'MAKEUP': return 'warning';
      default: return 'info';
    }
  };

  // Session Date & Weekday Helper
  const formatSessionDate = (dateStr) => {
    if (!dateStr) return { weekday: '', dateFormatted: '—' };
    try {
      const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
      const weekday = d.toLocaleDateString('fa-IR', { weekday: 'long' });
      const dateFormatted = d.toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' });
      return { weekday, dateFormatted };
    } catch {
      return { weekday: '', dateFormatted: dateStr };
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Card */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <ClipboardCheck className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            دفتر حضور و غیاب و مدیریت جلسات
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            جستجو، دسته‌بندی دوره‌ها و سطوح مهارتی، ثبت هوشمند حضور و غیاب و کسر سهمیه شناگران
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleExportCsv}
            className="w-full sm:w-auto justify-center gap-1.5 text-xs h-10 px-2 sm:px-3 truncate shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">خروجی اکسل جلسات</span>
          </Button>

          {/* Persian Calendar Filter */}
          <div className="w-full sm:w-44">
            <PersianDatePicker
              value={dateFilter}
              onChange={(jalaliStr, gDate, gIso) => {
                setDateFilter(gIso || '');
                if (gIso) setFilterType('ALL');
              }}
              placeholder="تقویم"
              clearable
              align="left"
              buttonClassName="h-10 justify-center sm:justify-between"
            />
          </div>
        </div>
      </div>

      {/* 2. Search & Category Filters Panel */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5 transition-colors relative z-20">
        {/* Top Filter Row: Search & Attendance Status Pills */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Real-time Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در جلسات (نام گروه، دوره، سطح، مربی، استخر یا شناگر)..."
              className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Attendance Status Quick Pills */}
          <div className="w-full grid grid-cols-4 sm:flex sm:w-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700 text-xs sm:shrink-0 select-none">
            <button
              type="button"
              onClick={() => { setFilterType('ALL'); setDateFilter(''); }}
              className={`px-1.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors text-center flex items-center justify-center whitespace-nowrap text-[11px] sm:text-xs cursor-pointer ${
                filterType === 'ALL' && !dateFilter
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>همه</span>
              <span className="hidden min-[420px]:inline">&nbsp;جلسات</span>
            </button>

            <button
              type="button"
              onClick={() => { setFilterType('UNRECORDED'); setDateFilter(''); }}
              className={`px-1.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors text-center flex items-center justify-center whitespace-nowrap text-[11px] sm:text-xs cursor-pointer ${
                filterType === 'UNRECORDED' && !dateFilter
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>ثبت‌نشده‌ها</span>
            </button>

            <button
              type="button"
              onClick={() => { setFilterType('RECORDED'); setDateFilter(''); }}
              className={`px-1.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors text-center flex items-center justify-center whitespace-nowrap text-[11px] sm:text-xs cursor-pointer ${
                filterType === 'RECORDED' && !dateFilter
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>ثبت‌شده‌ها</span>
            </button>

            <button
              type="button"
              onClick={() => { setFilterType('TODAY'); setDateFilter(''); }}
              className={`px-1.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors text-center flex items-center justify-center whitespace-nowrap text-[11px] sm:text-xs cursor-pointer ${
                filterType === 'TODAY' && !dateFilter
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="hidden min-[420px]:inline">جلسات&nbsp;</span>
              <span>امروز</span>
            </button>
          </div>
        </div>

        {/* Real Categories Select Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 relative z-20">
          {/* 1. Skill Level Category */}
          <CustomSelect
            label="سطح مهارت (رده مهارتی):"
            value={selectedLevel}
            onChange={(val) => setSelectedLevel(val)}
            icon={Award}
            placeholder="همه سطوح مهارت"
            clearable
            size="sm"
            options={[
              { value: '', label: 'همه سطوح مهارت' },
              ...levels.map((lvl) => ({
                value: lvl.id,
                label: lvl.order ? `${lvl.order}. ${lvl.name}` : lvl.name,
                description: lvl.description || undefined,
              })),
            ]}
          />

          {/* 2. Course Category */}
          <CustomSelect
            label="دوره آموزشی:"
            value={selectedCourse}
            onChange={(val) => setSelectedCourse(val)}
            icon={BookOpen}
            placeholder="همه دوره‌های آموزشی"
            clearable
            searchable
            size="sm"
            options={[
              { value: '', label: 'همه دوره‌های آموزشی' },
              ...courses.map((c) => ({
                value: c.id,
                label: c.name,
                description: c.code ? `کد دوره: ${c.code}` : undefined,
              })),
            ]}
          />

          {/* 3. Coach Category */}
          <CustomSelect
            label="مربی مسئول:"
            value={selectedCoach}
            onChange={(val) => setSelectedCoach(val)}
            icon={UserCheck}
            placeholder="همه مربیان"
            clearable
            searchable
            size="sm"
            options={[
              { value: '', label: 'همه مربیان' },
              ...coaches.map((c) => ({
                value: c.id,
                label: c.full_name,
                description: c.specialty || undefined,
              })),
            ]}
          />

          {/* 4. Session Status */}
          <CustomSelect
            label="وضعیت برگزاری جلسه:"
            value={selectedSessionStatus}
            onChange={(val) => setSelectedSessionStatus(val)}
            icon={Clock}
            placeholder="همه وضعیت‌ها"
            clearable
            size="sm"
            options={[
              { value: '', label: 'همه وضعیت‌ها' },
              { value: 'SCHEDULED', label: 'برنامه‌ریزی‌شده', description: 'در انتظار تشکیل' },
              { value: 'COMPLETED', label: 'برگزارشده', description: 'کلاس تشکیل شده' },
              { value: 'CANCELLED', label: 'لغوشده', description: 'کلاس لغو شده' },
              { value: 'MAKEUP', label: 'جلسه جبرانی', description: 'جلسه جبرانی فوق‌العاده' },
            ]}
          />

          {/* 5. Pool Location */}
          <CustomSelect
            label="محل استخر:"
            value={selectedPool}
            onChange={(val) => setSelectedPool(val)}
            icon={MapPin}
            placeholder="همه استخرها"
            clearable
            size="sm"
            options={[
              { value: '', label: 'همه استخرها' },
              ...poolLocations.map((pool) => ({
                value: pool,
                label: pool,
              })),
            ]}
          />
        </div>

        {/* Active Filters Summary & Reset Button */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              تعداد جلسات منطبق: <strong className="font-mono text-slate-800 dark:text-slate-100 font-bold">{totalItems}</strong> جلسه
            </span>

            {/* Filter Tags */}
            {selectedLevel && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 text-[11px] font-bold border border-sky-200 dark:border-sky-800">
                سطح: {levels.find((l) => String(l.id) === String(selectedLevel))?.name}
                <button type="button" onClick={() => setSelectedLevel('')} className="hover:opacity-75">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedCourse && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 text-[11px] font-bold border border-blue-200 dark:border-blue-800">
                دوره: {courses.find((c) => String(c.id) === String(selectedCourse))?.name}
                <button type="button" onClick={() => setSelectedCourse('')} className="hover:opacity-75">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedCoach && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800">
                مربی: {coaches.find((c) => String(c.id) === String(selectedCoach))?.full_name}
                <button type="button" onClick={() => setSelectedCoach('')} className="hover:opacity-75">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedPool && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 text-[11px] font-bold border border-teal-200 dark:border-teal-800">
                استخر: {selectedPool}
                <button type="button" onClick={() => setSelectedPool('')} className="hover:opacity-75">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {dateFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold border border-indigo-200 dark:border-indigo-800">
                تاریخ: {new Date(dateFilter).toLocaleDateString('fa-IR')}
                <button type="button" onClick={() => setDateFilter('')} className="hover:opacity-75">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {searchTerm.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 text-[11px] font-bold border border-amber-200 dark:border-amber-800">
                جستجو: «{searchTerm.trim()}»
                <button type="button" onClick={() => setSearchTerm('')} className="hover:opacity-75">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              پاک کردن همه فیلترها
            </button>
          )}
        </div>
      </div>

      {/* 3. Sessions Attendance List */}
      {loading ? (
        <LoadingState type="table" rows={6} message="در حال دریافت جلسات کلاسی و داده‌های حضور و غیاب..." />
      ) : filteredSessions.length === 0 ? (
        <EmptyState
          title="جلسه‌ای با فیلترها یا جستجوی انتخابی یافت نشد"
          description="با تغییر یا پاک کردن فیلترهای جستجو، دوره، مربی یا سطح مهارت، جلسات نمایش داده خواهند شد."
          action={
            hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-3 gap-1.5 text-xs">
                <RotateCcw className="w-3.5 h-3.5" />
                پاک کردن فیلترها
              </Button>
            )
          }
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <table className="w-full text-sm text-right border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200/80 dark:border-slate-700/80 select-none">
                <tr>
                  <th className="px-3.5 py-3 text-right w-[24%]">گروه و دوره آموزشی</th>
                  <th className="px-3 py-3 text-right w-[11%]">سطح مهارت</th>
                  <th className="px-3 py-3 text-right w-[13%]">مربی مسئول</th>
                  <th className="px-3 py-3 text-right w-[13%]">محل استخر</th>
                  <th className="px-3 py-3 text-right w-[17%]">تاریخ و زمان سانس</th>
                  <th className="px-3 py-3 text-center w-[12%]">وضعیت حضور</th>
                  <th className="px-3 py-3 text-center w-[10%]">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                {paginatedSessions.map((session) => (
                  <tr
                    key={session.id}
                    className={`transition-colors border-b border-slate-100 dark:border-slate-800/80 last:border-b-0 ${
                      !session.attendance_recorded
                        ? 'bg-amber-50/20 dark:bg-amber-950/10 hover:bg-amber-50/40 dark:hover:bg-amber-950/20'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* 1. Group & Course (Clean text, no bulky icon) */}
                    <td className="px-3.5 py-3 align-middle">
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-tight truncate">
                          {session.group_name}
                        </div>
                        {session.course_name && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 truncate">
                            <BookOpen className="w-3 h-3 text-sky-500 shrink-0" />
                            <span className="truncate">{session.course_name}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 2. Skill Level */}
                    <td className="px-3 py-3 align-middle">
                      {session.skill_level_name ? (
                        <Badge
                          variant="info"
                          className="text-[11px] gap-1 font-semibold whitespace-nowrap"
                          style={{
                            borderColor: session.skill_level_badge ? `${session.skill_level_badge}40` : undefined,
                            color: session.skill_level_badge || undefined,
                          }}
                        >
                          <Award className="w-3 h-3 shrink-0" />
                          <span>{session.skill_level_name}</span>
                        </Badge>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    {/* 3. Coach */}
                    <td className="px-3 py-3 align-middle">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                        <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          <UserCheck className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                        </div>
                        <span className="truncate">{session.coach_name || 'نامشخص'}</span>
                      </div>
                    </td>

                    {/* 4. Pool Location */}
                    <td className="px-3 py-3 align-middle">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-medium">{session.pool_location || 'استخر اصلی'}</span>
                      </div>
                    </td>

                    {/* 5. Date & Time */}
                    <td className="px-3 py-3 align-middle">
                      {(() => {
                        const { weekday, dateFormatted } = formatSessionDate(session.session_date);
                        return (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100 text-xs whitespace-nowrap">
                              <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                              <span>{weekday}</span>
                              <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">{dateFormatted}</span>
                            </div>
                            <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
                              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{session.start_time?.slice(0, 5)} تا {session.end_time?.slice(0, 5)}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </td>

                    {/* 6. Attendance Status (Clean, pure attendance state) */}
                    <td className="px-3 py-3 align-middle text-center">
                      {session.attendance_recorded ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold shadow-2xs whitespace-nowrap">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>ثبت‌شده ({session.attendance_count || 0} نفر)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold shadow-2xs whitespace-nowrap">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>ثبت‌نشده</span>
                        </span>
                      )}
                    </td>

                    {/* 7. Action Button */}
                    <td className="px-3 py-3 align-middle text-center">
                      {session.attendance_recorded ? (
                        <button
                          type="button"
                          onClick={() => handleOpenAttendanceSheet(session)}
                          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/90 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all cursor-pointer active:scale-95 whitespace-nowrap shadow-2xs"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                          <span>بازبینی حضور</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenAttendanceSheet(session)}
                          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs hover:shadow transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          <span>ثبت حضور</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {paginatedSessions.map((session) => (
              <div
                key={session.id}
                className={`p-4 rounded-2xl border space-y-3 text-xs transition-all ${
                  !session.attendance_recorded
                    ? 'bg-amber-50/30 dark:bg-amber-950/15 border-amber-200/70 dark:border-amber-900/40 shadow-xs'
                    : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight">
                      {session.group_name}
                    </h3>
                    {session.course_name && (
                      <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-sky-500 shrink-0" />
                        <span className="truncate">{session.course_name}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Tags row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {session.skill_level_name && (
                    <Badge variant="info" className="text-[10px]">
                      {session.skill_level_name}
                    </Badge>
                  )}
                  {session.attendance_recorded ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                      <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      ثبت‌شده ({session.attendance_count || 0} نفر)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      ثبت‌نشده
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">مربی مسئول</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block mt-0.5">
                      {session.coach_name || 'نامشخص'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">محل استخر</span>
                    <span className="text-slate-700 dark:text-slate-300 truncate block mt-0.5">
                      {session.pool_location || 'استخر اصلی'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">تاریخ برگزاری</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 block mt-0.5">
                      {(() => {
                        const { weekday, dateFormatted } = formatSessionDate(session.session_date);
                        return `${weekday} ${dateFormatted}`;
                      })()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">زمان سانس</span>
                    <span className="font-mono text-slate-700 dark:text-slate-200 block mt-0.5">
                      {session.start_time?.slice(0, 5)} تا {session.end_time?.slice(0, 5)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  {session.attendance_recorded ? (
                    <button
                      type="button"
                      onClick={() => handleOpenAttendanceSheet(session)}
                      className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <ClipboardCheck className="w-4 h-4 text-sky-600" />
                      <span>بازبینی حضور و غیاب</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenAttendanceSheet(session)}
                      className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      <span>ثبت حضور و غیاب</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      )}

      {/* 4. Modal: Live Attendance Sheet Register & Review */}
      <Modal
        isOpen={!!activeSession}
        onClose={() => setActiveSession(null)}
        title={`دفتر حضور و غیاب: ${activeSession?.group_name || ''}`}
        size="lg"
      >
        <form onSubmit={handleSaveAttendance} className="space-y-4">
          {/* Session Overview Card */}
          <div className="bg-gradient-to-r from-sky-50/80 to-blue-50/60 dark:from-sky-950/40 dark:to-blue-950/30 p-3.5 rounded-2xl border border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {activeSession?.group_name}
                </span>
                {activeSession?.course_name && (
                  <span className="text-[11px] text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/60 px-2 py-0.5 rounded-md font-medium">
                    {activeSession?.course_name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-[11px]">
                <span>مربی: <strong>{activeSession?.coach_name || 'نامشخص'}</strong></span>
                <span>•</span>
                <span>محل: <strong>{activeSession?.pool_location || 'استخر اصلی'}</strong></span>
              </div>
            </div>

            <div className="text-left font-mono font-bold text-xs bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800 shrink-0">
              <div>{activeSession?.session_date}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {activeSession?.start_time?.slice(0, 5)} تا {activeSession?.end_time?.slice(0, 5)}
              </div>
            </div>
          </div>

          {/* Quick Actions & Swimmer Search Inside Modal */}
          {groupEnrollments.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                {/* Search Swimmer */}
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={modalSearchSwimmer}
                    onChange={(e) => setModalSearchSwimmer(e.target.value)}
                    placeholder="جستجوی نام شناگر در این کلاس..."
                    className="w-full pl-8 pr-9 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                  />
                  {modalSearchSwimmer && (
                    <button
                      type="button"
                      onClick={() => setModalSearchSwimmer('')}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Mark All Present Button */}
                <button
                  type="button"
                  onClick={handleMarkAllPresentInModal}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition-colors shrink-0 shadow-2xs active:scale-95 cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                  حاضر کردن همه
                </button>
              </div>

              {/* Status Filter Pills Inside Modal */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { key: 'ALL', label: `همه (${modalCounts.ALL})` },
                  { key: 'PRESENT', label: `حاضر (${modalCounts.PRESENT})`, color: 'text-emerald-700 dark:text-emerald-300' },
                  { key: 'LATE', label: `تأخیر (${modalCounts.LATE})`, color: 'text-amber-700 dark:text-amber-300' },
                  { key: 'EXCUSED', label: `موجه (${modalCounts.EXCUSED})`, color: 'text-sky-700 dark:text-sky-300' },
                  { key: 'ABSENT', label: `غایب (${modalCounts.ABSENT})`, color: 'text-rose-700 dark:text-rose-300' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setModalStatusFilter(item.key)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap text-[11px] ${
                      modalStatusFilter === item.key
                        ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Swimmer Rows List */}
          {modalLoading ? (
            <LoadingState type="inline" message="در حال بارگذاری لیست شاگردان این کلاس..." />
          ) : groupEnrollments.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              هیچ شناگری در این گروه ثبت‌نام قطعی ندارد.
            </div>
          ) : filteredModalEnrollments.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              شناگری با فیلتر انتخابی یافت نشد.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {filteredModalEnrollments.map((enr) => {
                const currentStatus = existingAttendance[enr.swimmer]?.status || 'PRESENT';
                const currentNote = existingAttendance[enr.swimmer]?.note || '';

                return (
                  <div
                    key={enr.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-colors"
                  >
                    {/* Swimmer Info */}
                    <div className="min-w-[140px]">
                      <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs">
                        {enr.swimmer_name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                        {enr.remaining_sessions} جلسه باقی‌مانده از {enr.sessions_purchased}
                      </span>
                    </div>

                    {/* Status Select Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { key: 'PRESENT', label: 'حاضر', color: 'bg-emerald-600 text-white' },
                        { key: 'LATE', label: 'تأخیر', color: 'bg-amber-600 text-white' },
                        { key: 'EXCUSED', label: 'موجه (بدون کسر)', color: 'bg-sky-600 text-white' },
                        { key: 'ABSENT', label: 'غایب', color: 'bg-rose-600 text-white' },
                      ].map((st) => (
                        <button
                          key={st.key}
                          type="button"
                          onClick={() => handleStatusChange(enr.swimmer, st.key)}
                          className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer text-[11px] ${
                            currentStatus === st.key
                              ? `${st.color} shadow-2xs scale-105`
                              : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>

                    {/* Note Input */}
                    <div className="w-full sm:w-44">
                      <input
                        type="text"
                        placeholder="یادداشت مربی یا علت غیبت..."
                        value={currentNote}
                        onChange={(e) => handleNoteChange(enr.swimmer, e.target.value)}
                        className="w-full px-2.5 py-1 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Business Rule Notice */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800">
            💡 <strong>قانون هوشمند سهمیه:</strong> وضعیت‌های «حاضر»، «تأخیر» و «غایب» یک جلسه از سهمیه شناگر کسر می‌کنند؛ وضعیت «غایب موجه» سهمیه‌ای کسر نمی‌کند.
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setActiveSession(null)}>
              انصراف
            </Button>
            <Button type="submit" disabled={savingAttendance || groupEnrollments.length === 0}>
              {savingAttendance ? 'در حال ثبت...' : 'ثبت و نهایی‌سازی حضور و غیاب'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};